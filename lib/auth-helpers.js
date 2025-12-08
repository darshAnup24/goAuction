// Helper functions for authentication in Server Components and API Routes

import { auth } from '@/auth'
import { redirect } from 'next/navigation'

/**
 * Get the current session in a Server Component
 * @returns {Promise<Session | null>}
 */
export async function getSession() {
  return await auth()
}

/**
 * Get the current user or redirect to login
 * Use this in Server Components that require authentication
 */
export async function requireAuth() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }
  
  return session
}

/**
 * Check if user is a vendor
 */
export async function requireVendor() {
  const session = await requireAuth()
  
  if (!session.user.isVendor) {
    redirect('/dashboard')
  }
  
  return session
}

/**
 * Check if user is an admin
 */
export async function requireAdmin() {
  const session = await requireAuth()
  
  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }
  
  return session
}
