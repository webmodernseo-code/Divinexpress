import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Standalone server build only for self-hosting (o2switch / Passenger).
  // On Vercel, leave output undefined — Vercel manages its own output, and
  // 'standalone' + Turbopack breaks Vercel file tracing (.nft.json ENOENT).
  output: process.env.VERCEL ? undefined : 'standalone',
  images: {
    // Product images uploaded from the dashboard are served from Cloudinary.
    // Without this, next/image throws "hostname not configured" and the page
    // that renders such an image fails to load.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
