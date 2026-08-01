# Reign Footer Redesign

**Date:** 2026-08-01

**Status:** Approved design, pending implementation

## Goal

Replace the current footer with a faithful responsive adaptation of the two user-provided references. The result must feel editorial, spacious, premium, and specific to Reign rather than like a generic storefront template.

## Visual Direction

The footer uses a full-width deep-black background (`#0D0D0D`) and generous spacing. Its hierarchy is built around four areas:

1. A large off-white newsletter panel at the top.
2. A brand-and-navigation area beneath it.
3. A thin divider and utility row for copyright, payments, language, and currency.
4. A purpose-built mobile composition using stacked content and accordions.

The supplied white Reign logo asset must be used on the dark background. The black logo must not be inverted with CSS. Typography continues to use Fraunces for editorial headings and Inter for interface text.

## Newsletter Panel

The panel has a warm off-white background, large rounded corners, dark text, and a small uppercase kicker. Its content is localized in French and English.

Desktop layout:

- Editorial copy occupies the left side.
- The email input and submit button form one horizontal control on the right.
- The button is black with white uppercase text.

Mobile layout:

- Kicker, heading, description, input, and button are stacked.
- The input and button span the available width.
- Touch targets remain at least 44 pixels high.

The form validates a non-empty, browser-valid email address. Because phase 1 has no backend, a successful submission only replaces the form with a localized confirmation message. The input has an accessible label even when the visible design relies on placeholder text.

## Brand and Navigation

The brand block contains:

- The white Reign logo, visually prominent.
- The existing localized brand tagline.
- Circular outlined links for Instagram, TikTok, and Facebook.

Social URLs remain placeholders until the brand provides real destinations. They must be isolated in one data structure so they can be replaced without changing the layout.

Desktop navigation uses three columns:

- **Shop:** New arrivals, Clothing, Accessories, Best sellers.
- **Help:** Contact, FAQ, Shipping & Returns, Size Guide.
- **Legal:** Legal Notice, Terms of Sale, Privacy.

Existing localized routes and query-based collection navigation must be reused. The redesign does not introduce new standalone category routes or fabricate sales analytics. “Best sellers” is a curated collection entry in this front-end demonstration, not a claim derived from order data.

On mobile, Shop, Help, and Legal become separate accordion rows with a plus/minus affordance. Each row has a thin divider. Accordion triggers expose `aria-expanded` and `aria-controls`; panels remain keyboard accessible.

## Utility Row

The desktop utility row is divided from the main area by a subtle dark-gray rule and contains:

- Copyright on the left.
- “Secure payments” and the existing Visa/Mastercard, PayPal, Orange Money, and Wave assets in the center.
- Language and currency controls on the right.

On mobile, payments appear above the locale controls, followed by the copyright. The controls use the existing language and currency state and navigation logic, with a dark visual variant designed for the footer. Header behavior must remain unchanged.

Decorative payment logos use empty alternative text because the adjacent localized “Secure payments” label provides context. Logo sizing must be optically balanced instead of using identical raw dimensions.

## Responsive Behavior

- **Mobile:** single column; vertical newsletter; brand block; accordions; centered payments; full-width locale controls; centered copyright.
- **Tablet:** retain the mobile information hierarchy until all desktop columns fit without compression.
- **Desktop:** horizontal newsletter; brand plus three navigation columns; single-line utility row.

No content may overlap, clip, or create horizontal page scrolling. Spacing should scale progressively rather than switch abruptly between cramped and oversized layouts.

## Component Boundaries

The implementation may extract focused footer-only components when that makes responsibilities clearer:

- Newsletter panel and local submission state.
- Navigation group data and responsive rendering.
- Mobile accordion behavior.
- Dark variants of language and currency selectors.

Shared business logic stays in the existing contexts and internationalization helpers. The redesign must not duplicate currency persistence, locale routing, or global state.

## Accessibility

- Semantic `<footer>`, `<nav>`, headings, form label, and buttons.
- Visible keyboard focus on every interactive element.
- Minimum practical contrast on the black background.
- Accordion state exposed to assistive technology.
- Social links have descriptive accessible names.
- Newsletter success feedback is announced appropriately.
- Motion is limited to short color, opacity, and accordion-indicator transitions.

## Verification

Implementation is accepted when:

- The mobile and desktop compositions closely match the supplied references.
- French and English content both fit without collisions.
- EUR and GBP selection still persists through the existing context.
- Locale switching still preserves supported navigation behavior.
- Newsletter empty/invalid and successful states behave correctly.
- Mobile accordions work with pointer and keyboard input.
- Every footer link resolves to its intended localized destination.
- Existing header selectors are visually and functionally unchanged.
- TypeScript passes and focused footer tests pass.
- Mobile and desktop visual checks show no overflow or layout regression.

## Scope

This redesign changes only the footer and any narrowly required reusable selector styling. It does not add a newsletter backend, real social URLs, new product analytics, new category routes, or unrelated page redesigns.
