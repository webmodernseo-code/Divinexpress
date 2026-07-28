import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'always'
});

export const config = {
  // Match all pathnames except API routes, static assets, etc.
  matcher: ['/', '/(fr|en)/:path*', '/((?!api|_next|_ipx|images|.*\\..*).*)']
};
