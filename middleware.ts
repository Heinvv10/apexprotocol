import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication (any logged-in user)
const AUTH_ROUTES = ['/catalog', '/cart', '/checkout', '/orders', '/account'];
// Routes that require admin
const ADMIN_ROUTES = ['/admin'];
// Routes only for non-authenticated users
const GUEST_ONLY = ['/auth/login', '/auth/register'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('session_token')?.value;

  // Decode session (format: base64(userId:email:isAdmin))
  let userId: string | null = null;
  let isAdmin = false;
  if (token) {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const parts = decoded.split(':');
      userId = parts[0] || null;
      isAdmin = parts[2] === '1';
    } catch {
      userId = null;
    }
  }

  const isLoggedIn = !!userId;

  // Protect /admin/* — must be logged in AND admin
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    if (!isAdmin) {
      // Logged in but not admin — redirect to customer area
      return NextResponse.redirect(new URL('/catalog', req.url));
    }
    return NextResponse.next();
  }

  // Protect customer routes — must be logged in
  if (AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    return NextResponse.next();
  }

  // Redirect logged-in users away from auth pages
  if (GUEST_ONLY.some(r => pathname.startsWith(r)) && isLoggedIn) {
    return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/catalog', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/catalog/:path*',
    '/catalog',
    '/cart/:path*',
    '/cart',
    '/checkout/:path*',
    '/checkout',
    '/orders/:path*',
    '/orders',
    '/account/:path*',
    '/account',
    '/auth/login',
    '/auth/register',
  ],
};
