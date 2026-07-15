# DivinExpress Design System

DivinExpress is an original, from-scratch premium sportswear-ecommerce brand — built in the spirit of a French premium sportswear retailer (per the brief: "un site ecommerce comme celui de nike france... premium, police Inter, blanc et noir, vert pour promo, rouge peu visible"), but **not a recreation of any real company's brand**. No codebase, Figma file, or brand asset was attached for this run — everything here (tokens, components, screens, copy) was authored from the brief alone. If real brand assets exist, attach them and this system should be revised against that source of truth.

Two products are covered:
1. **Ecommerce storefront** — homepage, product listing, product detail, cart, checkout.
2. **Merchant dashboard** — Shopify-style back office: orders, catalog, analytics, settings.

## Index

- `styles.css` — root stylesheet, imports every token file. Link this one file.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `shadows.css`, `motion.css`, `base.css`.
- `components/` — reusable primitives, grouped by concern:
  - `forms/` — Button, Input, Select, Checkbox, Switch
  - `feedback/` — Badge, PriceTag, Toast, Tooltip
  - `navigation/` — Tabs, Breadcrumb
  - `data/` — Card, ProductCard, Table
  - `overlay/` — Dialog
- `ui_kits/ecommerce/` — storefront screens (`index.html` to click through)
- `ui_kits/dashboard/` — merchant dashboard screens (`index.html` to click through)
- `guidelines/` — foundation specimen cards (colors, type, spacing, radius, shadow, motion, brand, iconography)
- `assets/` — (empty — see Iconography/Logo notes below)
- `thumbnail.html` — homepage tile
- `SKILL.md` — portable skill file for Claude Code

### Intentional additions
No source defined a component inventory, so a standard primitive set was authored sized to the brief: Button, Input, Select, Checkbox, Switch, Badge, PriceTag, Toast, Tooltip, Tabs, Breadcrumb, Card, ProductCard, Table, Dialog. `PriceTag` and `ProductCard` are ecommerce-specific additions beyond the standard set — the brief centers on pricing/promo display, so they're first-class primitives rather than ad-hoc markup.

## Content fundamentals

**Tone:** bold, short, motivational — imperative verbs, second person implied but rarely stated ("Run Further", "Shop the Drop", "Engineered for Speed"). Sentences are short fragments, not full copy blocks. Headlines are direct commands or capability statements; body copy stays factual and brief (shipping/returns terms, material specs).

**Casing:** headlines and eyebrows are UPPERCASE with tight/negative letter-spacing on display sizes and wide positive tracking on small eyebrow/label text. Body copy and UI labels are sentence case.

**Voice:** confident, minimal punctuation, no exclamation points, no emoji. Numbers and prices are always precise ("€150.00", "-34%", "Only 2 left") — urgency is conveyed through red-flagged specificity, not hype language.

**Examples:**
- Hero: "RUN FURTHER" / "Engineered for Speed."
- CTA: "Shop the Drop", "Add to Bag", "Checkout"
- Utility copy: "Free shipping on orders over €50. Returns within 30 days."
- Status copy: "Only 2 left in size M" (red), "-34% Today" (green)

## Visual foundations

**Colors:** strictly black (`#0a0a0a`) and white as the base — no grey-brand identity, greys exist only as structural neutrals (borders, sunken surfaces, muted text). Green (`--color-green-500` family) is reserved almost exclusively for promotional/sale pricing and positive status (in-stock, fulfilled). Red (`--color-red-500` family) is used sparingly and only for urgency: low stock, payment failure, out-of-stock — never for primary actions or decoration.

**Type:** Inter throughout, no secondary typeface. Display sizes are heavy (weight 800) with negative tracking and near-1 line-height for a compressed, athletic feel; body copy relaxes to 1.45–1.5 line-height. Labels/eyebrows use wide positive tracking and uppercase for a technical, spec-sheet feel that contrasts with soft display headlines.

**Spacing:** 4px base unit, generous section gaps (96px) and page gutters (32px) — the brand relies on whitespace rather than dividers or shadow to separate content.

**Backgrounds/imagery:** full-bleed hero blocks (video/photo implied, not generated here — see Imagery note below); no illustration, no repeating pattern/texture, no gradients. Product imagery is placeholder-labeled since no real photography was supplied — never invented or generated.

**Animation:** fast and precise — 160–220ms transitions on an ease-out curve with no bounce/spring, matching an athletic, confident feel. Motion is reserved for state changes (hover, press, panel open), never decorative/looping.

**Hover states:** primary buttons darken one step (`--action-primary-bg-hover`); secondary buttons pick up a faint grey fill; product tiles get a barely-visible dark scrim (4% black) over the image, not a scale/zoom.

**Press states:** buttons scale down slightly (`--press-scale: 0.97`) — no color change on press beyond hover's darkened tone.

**Borders:** 1px hairlines in light grey (`--surface-border`) for cards/dividers; 1.5–2px solid black for interactive outlines (secondary button, selected size swatch, focused checkbox).

**Shadows:** minimal and cool-toned; the brand leans on whitespace and contrast over elevation. Cards sit flat (hairline border, no shadow) at rest; dialogs/toasts get a soft `--shadow-lg` since they float above content.

**Corner radii:** mostly square (`--radius-none`/`--radius-md` 4px) for cards, tiles, and imagery. Pills (`--radius-pill`) are reserved for buttons and price/status badges — the one place roundness appears.

**Cards:** hairline border, no shadow, 8px radius, no colored left border, no header bar — content sits directly in generous padding (20px).

**Transparency/blur:** only on the dialog scrim (60% black, no blur) — no glassmorphism or backdrop-blur anywhere else.

**Imagery color vibe:** not applicable — no real photography was supplied. Placeholder blocks are neutral grey and explicitly labeled "Product image" / "Campaign image" rather than faked.

## Iconography

No icon set was attached. **Lucide** icons (1.5px stroke, outline style) are linked via CDN as the closest neutral match to a premium/minimal sportswear aesthetic — see `guidelines/iconography.card.html`. This is a **substitution, flagged for the user**: if the brand has its own icon set, swap the CDN link for it. No emoji, no unicode-glyph icons, no icon font beyond Lucide's SVGs.

## Logo

**No logo file was provided.** Per instructions, none was invented — the brand name "DIVINEXPRESS" renders as plain uppercase type wherever a mark would normally go (header, dashboard sidebar, thumbnail). If a real wordmark/logo exists, attach it and this should be swapped in everywhere a text mark currently appears.

## Fonts

Inter is loaded via Google Fonts (`@import` in `tokens/typography.css`) rather than self-hosted, since no font files were provided. `--font-mono` points at `'SF Mono'/'IBM Plex Mono'` with system fallbacks — no monospace webfont is loaded; upload one if code/mono display is needed anywhere.

## Caveats / iterate with me

- **This is a from-scratch brand**, not a recreation of any real retailer's design system — no codebase, Figma, or brand guideline was attached. Everything is a reasonable, brief-driven starting point.
- **No product photography, logo, or icon set was supplied** — imagery is labeled placeholder, the wordmark is plain type, icons are a CDN substitution (Lucide).
- The merchant dashboard is a from-scratch "Shopify-style" interpretation (no real Shopify UI was copied) — sidebar nav + stat cards + table pattern, generically applicable to any back-office.
- Two homepage hero directions are built (toggle in the storefront kit) per your "explore 2 options for key screens" request — let me know if you'd like variations pushed further into PDP or checkout too.

**Ask:** tell me if `DivinExpress` is a placeholder or the real name you want to keep, and send over any real logo, product photography, or brand guideline you have — I'll fold them in and everything else (tokens, components, screens) will adjust to match.
