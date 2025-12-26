import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isAdmin = req.auth?.user?.isAdmin || false

  const isAuthPage = nextUrl.pathname.startsWith('/login') ||
                     nextUrl.pathname.startsWith('/register')

  const isPublicPage = nextUrl.pathname === '/' ||
                       nextUrl.pathname.startsWith('/api/auth')

  const isAdminPage = nextUrl.pathname.startsWith('/admin')

  // NOTE: Rate limiting is now handled in API routes (src/app/api/auth/[...nextauth]/route.ts)
  // This allows us to use async/await which is required for production rate limiting with Upstash

  // Protect admin routes - require both login and admin status
  if (isAdminPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (!isAdmin) {
      // User is logged in but not admin - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect non-logged-in users to login (except public pages)
  if (!isLoggedIn && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
