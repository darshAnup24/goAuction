import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req) {
  try {
    const body = await req.json()
    let { email, username, password, fullName, phone, address } = body

    // Normalize email (lowercase and trim)
    email = email?.toLowerCase().trim()
    username = username?.trim()

    // Validate required fields
    if (!email || !username || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, username, password, and full name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength (min 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate username (alphanumeric and underscore only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        )
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 409 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user (auto-verify for now to allow immediate login)
    // TODO: Switch to null and implement proper email verification flow
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        fullName,
        phone: phone || null,
        address: address || null,
        role: 'BUYER',
        isVendor: false,
        emailVerified: new Date(), // Auto-verify to allow immediate login
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
        isVendor: true,
        createdAt: true,
      },
    })

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires,
      },
    })

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`
    
    let emailSent = false;
    try {
      const result = await sendVerificationEmail(email, fullName, verificationUrl)
      emailSent = result?.success === true;
      console.log('✅ Verification email sent:', result);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError.message)
      // Log more details for debugging
      if (emailError.message?.includes('403') || emailError.message?.includes('only send')) {
        console.error('⚠️ This is likely a Resend domain verification issue. Using onboarding@resend.dev only allows sending to the account owner email.');
      }
    }

    return NextResponse.json(
      {
        message: 'User registered successfully! You can now log in with your credentials.',
        user,
        requiresVerification: false, // Changed to false since we auto-verify
        emailSent,
        note: emailSent 
          ? 'A verification email was also sent to your inbox.'
          : 'Email verification will be available once email service is configured.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Registration error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
