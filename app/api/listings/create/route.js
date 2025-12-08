import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { createListingSchema } from '@/lib/validations'
import { z } from 'zod'

export async function POST(req) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a vendor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isVendor: true, role: true },
    })

    if (!user || (!user.isVendor && user.role !== 'SELLER' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only vendors and sellers can create listings' },
        { status: 403 }
      )
    }

    const body = await req.json()

    // Validate input
    const validatedData = createListingSchema.parse(body)

    const startTime = new Date(validatedData.startTime)
    const endTime = new Date(validatedData.endTime)
    const now = new Date()

    // Allow start times within the last 5 minutes (for "Start Now" functionality)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    
    // Additional validation: start time should not be too far in the past
    if (startTime < fiveMinutesAgo) {
      return NextResponse.json(
        { error: 'Start time cannot be in the past' },
        { status: 400 }
      )
    }

    // Determine initial status based on start time
    // If start time is within 5 minutes of now, consider it LIVE
    const status = startTime <= new Date(now.getTime() + 5 * 60 * 1000) ? 'LIVE' : 'UPCOMING'

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        images: validatedData.images,
        startingPrice: validatedData.startingPrice,
        reservePrice: validatedData.reservePrice || null,
        currentBid: validatedData.startingPrice,
        startTime: startTime,
        endTime: endTime,
        category: validatedData.category,
        status: status,
        sellerId: session.user.id,
      },
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

    return NextResponse.json(
      {
        message: 'Listing created successfully',
        listing,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating listing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
