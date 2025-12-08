import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { updateListingSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req, { params }) {
  try {
    const { id } = params

    // Fetch listing with full details
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            phone: true,
            address: true,
            ratingAsSeller: true,
            totalRatings: true,
            isVendor: true,
            createdAt: true,
          },
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            bidder: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Increment view count (async, don't wait)
    prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(err => console.error('Error updating view count:', err))

    // Get current highest bid
    const highestBid = listing.bids.length > 0 ? listing.bids[0] : null

    // Calculate time remaining
    const now = new Date()
    const endTime = new Date(listing.endTime)
    const timeRemaining = endTime - now
    const isActive = listing.status === 'LIVE' && timeRemaining > 0

    return NextResponse.json({
      listing: {
        ...listing,
        highestBid,
        bidCount: listing._count.bids,
        timeRemaining: Math.max(0, timeRemaining),
        isActive,
      },
    })
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if listing exists and belongs to user
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bids: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only update your own listings' },
        { status: 403 }
      )
    }

    // Check if listing has bids
    if (listing._count.bids > 0) {
      return NextResponse.json(
        { error: 'Cannot update listing with existing bids' },
        { status: 400 }
      )
    }

    const body = await req.json()

    // Validate input
    const validatedData = updateListingSchema.parse(body)

    // Build update data object
    const updateData = {}

    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.images !== undefined) updateData.images = validatedData.images
    if (validatedData.startingPrice !== undefined) {
      updateData.startingPrice = validatedData.startingPrice
      updateData.currentBid = validatedData.startingPrice
    }
    if (validatedData.reservePrice !== undefined) updateData.reservePrice = validatedData.reservePrice
    if (validatedData.category !== undefined) updateData.category = validatedData.category

    // Handle time updates
    if (validatedData.startTime !== undefined) {
      const startTime = new Date(validatedData.startTime)
      const now = new Date()

      if (startTime < now) {
        return NextResponse.json(
          { error: 'Start time cannot be in the past' },
          { status: 400 }
        )
      }

      updateData.startTime = startTime
      updateData.status = startTime <= now ? 'LIVE' : 'UPCOMING'
    }

    if (validatedData.endTime !== undefined) {
      const endTime = new Date(validatedData.endTime)
      const startTime = validatedData.startTime 
        ? new Date(validatedData.startTime) 
        : listing.startTime

      if (endTime <= startTime) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        )
      }

      updateData.endTime = endTime
    }

    // Update listing
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: updateData,
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            ratingAsSeller: true,
            totalRatings: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Listing updated successfully',
      listing: updatedListing,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating listing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if listing exists and belongs to user
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bids: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own listings' },
        { status: 403 }
      )
    }

    // Check if listing has bids
    if (listing._count.bids > 0) {
      return NextResponse.json(
        { error: 'Cannot delete listing with existing bids' },
        { status: 400 }
      )
    }

    // Delete listing
    await prisma.listing.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Listing deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting listing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
