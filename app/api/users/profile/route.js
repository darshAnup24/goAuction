import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { updateProfileSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
        stripeAccountId: true,
        ratingAsBuyer: true,
        ratingAsSeller: true,
        totalRatings: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate input
    const validatedData = updateProfileSchema.parse(body)

    // Check if username is taken by another user
    if (validatedData.username !== session.user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: validatedData.username },
      })

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        )
      }
    }

    // Check if email is taken by another user
    if (validatedData.email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      })

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Email is already registered' },
          { status: 409 }
        )
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fullName: validatedData.fullName,
        username: validatedData.username,
        email: validatedData.email,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        avatar: validatedData.avatar || null,
      },
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
        updatedAt: true,
      },
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
