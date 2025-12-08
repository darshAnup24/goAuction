import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req, { params }) {
  try {
    const { userId } = params
    const { searchParams } = new URL(req.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Filter by status
    const status = searchParams.get('status')
    const statusFilter = status
      ? { status: status.toUpperCase() }
      : {}

    // Fetch listings
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where: {
          sellerId: userId,
          ...statusFilter,
        },
        include: {
          _count: {
            select: {
              bids: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.listing.count({
        where: {
          sellerId: userId,
          ...statusFilter,
        },
      }),
    ])

    return NextResponse.json({
      listings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching user listings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
