import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Self-contained server build for o2switch / Passenger (see docs/deploiement-o2switch.md).
  output: 'standalone',
};

export default withNextIntl(nextConfig);
