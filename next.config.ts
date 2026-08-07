import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Standalone server build only for self-hosting (o2switch / Passenger).
  // On Vercel, leave output undefined — Vercel manages its own output, and
  // 'standalone' + Turbopack breaks Vercel file tracing (.nft.json ENOENT).
  output: process.env.VERCEL ? undefined : 'standalone',
};

export default withNextIntl(nextConfig);
