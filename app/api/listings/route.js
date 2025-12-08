import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Filters
    const statusParam = searchParams.get('status')
    const category = searchParams.get('category')
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999999')
    const search = searchParams.get('search')
    const sellerId = searchParams.get('sellerId')
    const timeRemaining = searchParams.get('timeRemaining') // 'hour', 'day', 'week', 'any'

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'newly-listed'

    // Build where clause
    const where = {}
    const now = new Date()

    // Status filter with special handling for "live" and "ending-soon"
    if (statusParam) {
      const status = statusParam.toUpperCase()
      if (status === 'ALL') {
        // No status filter
      } else if (status === 'LIVE') {
        where.status = 'LIVE'
      } else if (status === 'ENDING-SOON') {
        // Auctions ending in next 24 hours
        where.status = 'LIVE'
        const endingSoonTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        where.endTime = {
          lte: endingSoonTime,
          gte: now
        }
      } else if (status === 'UPCOMING') {
        where.status = 'UPCOMING'
      } else {
        // Validate other status enums
        const validStatuses = ['ENDED', 'SOLD', 'UNSOLD']
        if (validStatuses.includes(status)) {
          where.status = status
        }
      }
    }

    // Category filter
    if (category && category !== 'all') {
      where.category = category
    }

    // Price range filter (on currentBid)
    if (minPrice > 0 || maxPrice < 999999999) {
      where.currentBid = {
        gte: minPrice,
        lte: maxPrice,
      }
    }

    // Time remaining filter
    if (timeRemaining && timeRemaining !== 'any') {
      if (!where.status) {
        where.status = 'LIVE' // Only apply to live auctions
      }
      
      let endTimeLimit
      switch (timeRemaining) {
        case 'hour':
          endTimeLimit = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour
          break
        case 'day':
          endTimeLimit = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
          break
        case 'week':
          endTimeLimit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
          break
      }
      
      if (endTimeLimit) {
        where.endTime = {
          ...(where.endTime || {}),
          lte: endTimeLimit,
          gte: now
        }
      }
    }

    // Full-text search on title and description
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }

    // Seller filter
    if (sellerId) {
      where.sellerId = sellerId
    }

    // Build orderBy clause
    let orderBy = {}
    switch (sortBy) {
      case 'ending-soonest':
        orderBy = { endTime: 'asc' }
        break
      case 'newly-listed':
        orderBy = { createdAt: 'desc' }
        break
      case 'most-bids':
        orderBy = { bidCount: 'desc' }
        break
      case 'price-low-high':
        orderBy = { currentBid: 'asc' }
        break
      case 'price-high-low':
        orderBy = { currentBid: 'desc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    // Fetch listings and total count
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
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
          _count: {
            select: {
              bids: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      listings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
      appliedFilters: {
        status: statusParam,
        category,
        minPrice,
        maxPrice,
        search,
        sortBy,
        timeRemaining,
      },
    })
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 })
  }
}
