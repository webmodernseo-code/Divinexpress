import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin panel routes
  if (pathname.startsWith('/admin')) {
    const session = request.cookies.get('admin_session')?.value;
    
    // Redirect to login if no active session
    if (!session && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // Redirect to dashboard if session exists and trying to access login
    if (session && pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except API routes, static assets, etc.
  matcher: ['/', '/(fr|en)/:path*', '/((?!api|_next|_ipx|images|.*\\..*).*)']
};
