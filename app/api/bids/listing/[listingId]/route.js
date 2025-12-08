import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { bidQuerySchema } from '@/lib/validations'

/**
 * GET /api/bids/listing/[listingId]
 * Get all bids for a specific listing with pagination
 * 
 * @param {string} listingId - ID of the listing
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 * @query {string} status - Filter by bid status (default: 'all')
 * 
 * @returns {Object} Paginated list of bids with bidder information
 */
export async function GET(request, { params }) {
  try {
    const { listingId } = params

    // Validate listing ID format
    if (!listingId || typeof listingId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid listing ID' },
        { status: 400 }
      )
    }

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

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        status: true,
        currentBid: true,
        bidCount: true,
        startTime: true,
        endTime: true,
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Build where clause for filtering
    const whereClause = {
      listingId,
    }

    // Add status filter if not 'all'
    if (status !== 'all') {
      whereClause.status = status
    }

    // Fetch bids with pagination
    const [bids, totalCount] = await Promise.all([
      prisma.bid.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [
          { amount: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          bidder: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              ratingAsBuyer: true,
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

    // Get bid statistics
    const highestBid = bids.length > 0 ? bids[0].amount : null
    const uniqueBidders = new Set(bids.map(bid => bid.bidderId)).size

    // Format response
    const formattedBids = bids.map(bid => ({
      id: bid.id,
      amount: bid.amount,
      status: bid.status,
      createdAt: bid.createdAt,
      bidder: {
        id: bid.bidder.id,
        username: bid.bidder.username,
        fullName: bid.bidder.fullName,
        avatar: bid.bidder.avatar,
        rating: bid.bidder.ratingAsBuyer,
      },
      isWinning: bid.status === 'WINNING',
      isOutbid: bid.status === 'OUTBID',
    }))

    return NextResponse.json({
      success: true,
      bids: formattedBids,
      listing: {
        id: listing.id,
        title: listing.title,
        status: listing.status,
        currentBid: listing.currentBid,
        bidCount: listing.bidCount,
        startTime: listing.startTime,
        endTime: listing.endTime,
        sellerId: listing.seller.id,
      },
      statistics: {
        totalBids: totalCount,
        uniqueBidders,
        highestBid,
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
    console.error('Fetch listing bids error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bids. Please try again.' },
      { status: 500 }
    )
  }
}
