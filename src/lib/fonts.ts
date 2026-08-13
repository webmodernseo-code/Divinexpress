import { Fraunces, Inter } from 'next/font/google';

// Note: these variable names are NOT `--font-serif`/`--font-sans` on purpose —
// they get mapped to those Tailwind theme tokens in globals.css, and reusing
// the same name on both sides would create an invalid circular CSS variable.
export const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--divinexpress-font-serif',
  display: 'swap'
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--divinexpress-font-sans',
  display: 'swap'
});
