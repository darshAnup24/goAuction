import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Missing token or email' },
        { status: 400 }
      )
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        identifier: email,
      },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification link' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (new Date() > verificationToken.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token,
          },
        },
      })

      return NextResponse.json(
        { error: 'Verification link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Update user's emailVerified field
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    })

    // Delete the used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}

// POST endpoint to resend verification email
export async function POST(req) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 200 }
      )
    }

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    // Create new verification token
    const crypto = await import('crypto')
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires,
      },
    })

    // Send verification email
    const { sendVerificationEmail } = await import('@/lib/email')
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`
    
    await sendVerificationEmail(email, user.fullName, verificationUrl)

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
