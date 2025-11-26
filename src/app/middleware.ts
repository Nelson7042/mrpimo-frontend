// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the path the user is trying to access
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't need authentication
  const isPublicPath = [
    '/login',
    '/sign-up',
    '/forgot-password',
    '/verify-token',
    '/reset-password'
  ].includes(path);
  
  // Get the token from cookies
  const token = request.cookies.get('auth-token')?.value;
  console.log(token)
  
  // If user is not logged in and trying to access a protected route
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If user is logged in and trying to access login page
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Configure which paths this middleware will run on
export const config = {
  matcher: [
    // Protected routes
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    // Auth routes (to redirect logged in users)
    '/login',
    '/sign-up',
    '/forgot-password',
    '/verify-token',
    '/reset-password'
  ]
};
