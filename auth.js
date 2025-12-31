import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
  },
  trustHost: true, // Fix for hostname mismatch issues
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
    }),
    // Credentials Provider (email/password)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // Find user by email (case-insensitive search)
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email.toLowerCase().trim(),
          },
        })

        if (!user) {
          console.log(`❌ Login failed: No user found with email ${credentials.email}`)
          throw new Error('Invalid email or password')
        }

        // Check if user has a password (OAuth users won't have one)
        if (!user.password) {
          console.log(`❌ Login failed: User ${credentials.email} has no password (OAuth user)`)
          throw new Error('This account uses social login. Please sign in with Google.')
        }

        // Check if email is verified (skip for OAuth users who have no password)
        if (!user.emailVerified && user.password) {
          console.log(`⚠️ Login blocked: User ${credentials.email} email not verified`)
          throw new Error('Please verify your email before logging in')
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          console.log(`❌ Login failed: Invalid password for ${credentials.email}`)
          throw new Error('Invalid email or password')
        }

        console.log(`✅ Login successful for user: ${credentials.email}`)

        // Return user object (without password)
        return {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          isVendor: user.isVendor,
          avatar: user.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth (Google), auto-create user if doesn't exist
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          // Create new user from Google profile
          const username = user.email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 6)
          await prisma.user.create({
            data: {
              email: user.email,
              username: username,
              fullName: user.name || 'Google User',
              password: '', // No password for OAuth users
              avatar: user.image,
              emailVerified: new Date(), // Google users are auto-verified
              role: 'BUYER',
              isVendor: false,
            },
          })
        } else if (!existingUser.emailVerified) {
          // Mark existing user as verified if signing in with Google
          await prisma.user.update({
            where: { email: user.email },
            data: { emailVerified: new Date() },
          })
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // Add user data to token on sign in
      if (user) {
        // Fetch full user data from database
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.username = dbUser.username
          token.role = dbUser.role
          token.isVendor = dbUser.isVendor
          token.avatar = dbUser.avatar
        }
      }
      return token
    },
    async session({ session, token }) {
      // Add token data to session
      if (token) {
        session.user.id = token.id
        session.user.username = token.username
        session.user.role = token.role
        session.user.isVendor = token.isVendor
        session.user.avatar = token.avatar
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
})
