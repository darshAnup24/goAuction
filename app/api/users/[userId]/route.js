import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req, { params }) {
  try {
    const { userId } = params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        address: true,
        avatar: true,
        role: true,
        isVendor: true,
        ratingAsBuyer: true,
        ratingAsSeller: true,
        totalRatings: true,
        createdAt: true,
        // Get statistics
        _count: {
          select: {
            listings: true,
            bids: true,
            ratingsGiven: true,
            ratingsReceived: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate auctions won (where user is the winner)
    const auctionsWon = await prisma.listing.count({
      where: {
        winnerId: userId,
        status: 'SOLD',
      },
    })

    // Get active listings count
    const activeListings = await prisma.listing.count({
      where: {
        sellerId: userId,
        status: {
          in: ['UPCOMING', 'LIVE'],
        },
      },
    })

    // Get recent ratings
    const recentRatings = await prisma.rating.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({
      user: {
        ...user,
        statistics: {
          totalListings: user._count.listings,
          activeListings,
          auctionsWon,
          totalBids: user._count.bids,
          ratingsReceived: user._count.ratingsReceived,
          ratingsGiven: user._count.ratingsGiven,
        },
        recentRatings,
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
