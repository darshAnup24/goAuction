import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { placeBidSchema } from '@/lib/validations'
import { getSocket } from '@/lib/socket'

// Minimum bid increment in dollars
const MINIMUM_BID_INCREMENT = 1.00

/**
 * POST /api/bids/place
 * Place a bid on an auction listing
 * 
 * @body {string} listingId - ID of the listing to bid on
 * @body {number} amount - Bid amount in dollars
 * 
 * @returns {Object} Success response with bid details and updated listing
 */
export async function POST(request) {
  try {
    // Authentication check
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to place bids.' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = placeBidSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid bid data', 
          details: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const { listingId, amount } = validation.data
    const userId = session.user.id

    // Use Prisma transaction with row locking to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch listing with row-level lock (FOR UPDATE)
      // This prevents concurrent bid placements from creating inconsistent state
      const listing = await tx.$queryRaw`
        SELECT * FROM Listing 
        WHERE id = ${listingId} 
        FOR UPDATE
      `

      if (!listing || listing.length === 0) {
        throw new Error('Listing not found')
      }

      const lockedListing = listing[0]

      // 2. Validate user is not the seller
      if (lockedListing.sellerId === userId) {
        throw new Error('You cannot bid on your own listing')
      }

      // 3. Validate auction status and timing
      const now = new Date()
      const startTime = new Date(lockedListing.startTime)
      const endTime = new Date(lockedListing.endTime)

      // Check if auction has started
      if (startTime > now) {
        throw new Error('This auction has not started yet')
      }

      // Check if auction has ended
      if (endTime <= now) {
        throw new Error('This auction has already ended')
      }

      // Check listing status
      if (lockedListing.status !== 'LIVE') {
        throw new Error(`Cannot bid on ${lockedListing.status.toLowerCase()} auctions`)
      }

      // 4. Calculate minimum required bid
      const currentHighestBid = lockedListing.currentBid || lockedListing.startingPrice
      const minimumBid = currentHighestBid + MINIMUM_BID_INCREMENT

      // 5. Validate bid amount
      if (amount < minimumBid) {
        throw new Error(
          `Bid must be at least $${minimumBid.toFixed(2)} (current bid + $${MINIMUM_BID_INCREMENT.toFixed(2)} minimum increment)`
        )
      }

      // Check if user already has the highest bid
      const userHighestBid = await tx.bid.findFirst({
        where: {
          listingId,
          bidderId: userId,
          status: 'WINNING',
        },
      })

      if (userHighestBid) {
        throw new Error('You already have the highest bid on this listing')
      }

      // 6. Mark all previous bids as OUTBID
      await tx.bid.updateMany({
        where: {
          listingId,
          status: 'WINNING',
        },
        data: {
          status: 'OUTBID',
        },
      })

      // Get previous highest bidder for notification
      const previousWinningBid = await tx.bid.findFirst({
        where: {
          listingId,
          status: 'OUTBID',
        },
        orderBy: {
          amount: 'desc',
        },
        include: {
          bidder: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      })

      // 7. Create new bid with WINNING status
      const newBid = await tx.bid.create({
        data: {
          amount,
          bidderId: userId,
          listingId,
          status: 'WINNING',
        },
        include: {
          bidder: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              images: true,
              endTime: true,
              sellerId: true,
            },
          },
        },
      })

      // 8. Update listing's current bid and bid count
      const updatedListing = await tx.listing.update({
        where: { id: listingId },
        data: {
          currentBid: amount,
          bidCount: {
            increment: 1,
          },
        },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          bids: {
            take: 5,
            orderBy: {
              amount: 'desc',
            },
            include: {
              bidder: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
      })

      // 9. Create notifications
      const notifications = []

      // Notify previous highest bidder (if exists)
      if (previousWinningBid && previousWinningBid.bidder.id !== userId) {
        notifications.push(
          tx.notification.create({
            data: {
              userId: previousWinningBid.bidder.id,
              type: 'BID_OUTBID',
              message: `You have been outbid on "${updatedListing.title}". New bid: $${amount.toFixed(2)}`,
              link: `/listings/${listingId}`,
            },
          })
        )
      }

      // Notify seller
      if (updatedListing.seller.id !== userId) {
        notifications.push(
          tx.notification.create({
            data: {
              userId: updatedListing.seller.id,
              type: 'BID_PLACED',
              message: `New bid of $${amount.toFixed(2)} placed on "${updatedListing.title}" by ${newBid.bidder.username}`,
              link: `/listings/${listingId}`,
            },
          })
        )
      }

      // Create all notifications
      await Promise.all(notifications)

      return {
        bid: newBid,
        listing: updatedListing,
        previousHighestBid: previousWinningBid?.amount || null,
      }
    }, {
      // Transaction options
      maxWait: 5000, // 5 seconds max wait time
      timeout: 10000, // 10 seconds timeout
      isolationLevel: 'Serializable', // Highest isolation level to prevent race conditions
    })

    // Emit Socket.IO event to notify other users (real-time update)
    const io = getSocket()
    if (io) {
      io.to(`listing:${listingId}`).emit('bid:new', {
        bid: {
          id: result.bid.id,
          amount: result.bid.amount,
          status: result.bid.status,
          createdAt: result.bid.createdAt,
          bidder: result.bid.bidder,
        },
        listing: {
          id: result.listing.id,
          title: result.listing.title,
          currentBid: result.listing.currentBid,
          bidCount: result.listing.bidCount,
          endTime: result.listing.endTime,
        },
        previousHighestBid: result.previousHighestBid,
        timestamp: new Date().toISOString(),
      })
      console.log(`🔔 Socket.IO: Broadcast new bid to listing:${listingId}`)
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Bid placed successfully',
        bid: {
          id: result.bid.id,
          amount: result.bid.amount,
          status: result.bid.status,
          createdAt: result.bid.createdAt,
          bidder: result.bid.bidder,
        },
        listing: {
          id: result.listing.id,
          title: result.listing.title,
          currentBid: result.listing.currentBid,
          bidCount: result.listing.bidCount,
          endTime: result.listing.endTime,
          recentBids: result.listing.bids,
        },
        previousHighestBid: result.previousHighestBid,
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Place bid error:', error)

    // Handle specific error cases
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (
      error.message.includes('cannot bid') ||
      error.message.includes('not started') ||
      error.message.includes('already ended') ||
      error.message.includes('Bid must be at least') ||
      error.message.includes('already have the highest bid')
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Transaction timeout or deadlock
    if (error.code === 'P2028' || error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Bid placement timed out. Please try again.' },
        { status: 408 }
      )
    }

    // Generic error
    return NextResponse.json(
      { error: 'Failed to place bid. Please try again.' },
      { status: 500 }
    )
  }
}
