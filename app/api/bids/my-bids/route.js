import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { bidQuerySchema } from '@/lib/validations'

/**
 * GET /api/bids/my-bids
 * Get authenticated user's bid history
 * 
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 * @query {string} status - Filter by bid status: 'WINNING', 'OUTBID', 'LOST', 'all' (default: 'all')
 * 
 * @returns {Object} User's bids grouped by status with listing details
 */
export async function GET(request) {
  try {
    // Authentication check
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to view your bids.' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryValidation = bidQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || 'all',
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: queryValidation.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    let { page, limit, status } = queryValidation.data

    // Enforce maximum limit
    limit = Math.min(limit, 100)

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build where clause
    const whereClause = {
      bidderId: userId,
    }

    // Add status filter if not 'all'
    if (status !== 'all') {
      whereClause.status = status
    }

    // Fetch user's bids with listing details
    const [bids, totalCount] = await Promise.all([
      prisma.bid.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [
          { createdAt: 'desc' },
        ],
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              description: true,
              images: true,
              status: true,
              currentBid: true,
              startingPrice: true,
              bidCount: true,
              startTime: true,
              endTime: true,
              category: true,
              winnerId: true,
              seller: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatar: true,
                  ratingAsSeller: true,
                },
              },
            },
          },
        },
      }),
      prisma.bid.count({
        where: whereClause,
      }),
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // Determine bid outcomes and group bids
    const now = new Date()
    const groupedBids = {
      winning: [],   // Currently winning active auctions
      outbid: [],    // Outbid on active auctions
      won: [],       // Won completed auctions
      lost: [],      // Lost completed auctions (ended, user was not winner)
    }

    const formattedBids = bids.map(bid => {
      const listing = bid.listing
      const isAuctionEnded = listing.status === 'ENDED' || 
                             listing.status === 'SOLD' || 
                             listing.status === 'UNSOLD' ||
                             new Date(listing.endTime) <= now

      let bidStatus = bid.status
      let groupKey = 'outbid'

      if (isAuctionEnded) {
        // Auction has ended
        if (listing.winnerId === userId) {
          bidStatus = 'WON'
          groupKey = 'won'
        } else {
          bidStatus = 'LOST'
          groupKey = 'lost'
        }
      } else {
        // Auction is still active
        if (bid.status === 'WINNING') {
          groupKey = 'winning'
        } else if (bid.status === 'OUTBID') {
          groupKey = 'outbid'
        }
      }

      const formattedBid = {
        id: bid.id,
        amount: bid.amount,
        status: bidStatus,
        originalStatus: bid.status,
        createdAt: bid.createdAt,
        isHighestBid: bid.amount === listing.currentBid && !isAuctionEnded,
        listing: {
          id: listing.id,
          title: listing.title,
          images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images,
          status: listing.status,
          currentBid: listing.currentBid,
          startingPrice: listing.startingPrice,
          bidCount: listing.bidCount,
          endTime: listing.endTime,
          category: listing.category,
          isEnded: isAuctionEnded,
          seller: listing.seller,
        },
      }

      // Add to appropriate group
      groupedBids[groupKey].push(formattedBid)

      return formattedBid
    })

    // Calculate summary statistics
    const summary = {
      totalBids: totalCount,
      activeWinning: groupedBids.winning.length,
      activeOutbid: groupedBids.outbid.length,
      auctionsWon: groupedBids.won.length,
      auctionsLost: groupedBids.lost.length,
      totalSpentIfWon: groupedBids.won.reduce((sum, bid) => sum + bid.amount, 0),
      potentialWinnings: groupedBids.winning.reduce((sum, bid) => sum + bid.amount, 0),
    }

    // Get unique listings user has bid on
    const uniqueListings = [...new Set(bids.map(bid => bid.listingId))].length

    return NextResponse.json({
      success: true,
      bids: formattedBids,
      groupedBids: {
        winning: groupedBids.winning,
        outbid: groupedBids.outbid,
        won: groupedBids.won,
        lost: groupedBids.lost,
      },
      summary: {
        ...summary,
        uniqueListings,
      },
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        status,
      },
    })

  } catch (error) {
    console.error('Fetch my bids error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch your bids. Please try again.' },
      { status: 500 }
    )
  }
}
