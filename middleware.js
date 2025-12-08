import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  
  console.log('Middleware:', pathname, 'isLoggedIn:', isLoggedIn)

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/listings/create',
    '/payment',
    '/profile/edit',
    '/admin',
    '/vendor'
  ]
  
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Redirect to login if accessing protected route while not logged in
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ONLY redirect logged-in users away from auth pages
  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Check admin permissions
  if (pathname.startsWith('/admin') && isLoggedIn && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url))
  }
  
  // Check vendor permissions ONLY for Stripe Connect vendor setup
  if (pathname.startsWith('/vendor') && isLoggedIn && !req.auth?.user?.isVendor) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
