import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n';
import { shouldRedirectToLogin } from './lib/adminAuth';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const secret = process.env.ADMIN_SESSION_SECRET ?? '';
    const sessionCookie = request.cookies.get('admin_session')?.value;
    if (shouldRedirectToLogin(pathname, sessionCookie, secret)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(fr|en)/:path*', '/admin/:path*']
};
