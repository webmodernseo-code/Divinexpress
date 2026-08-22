# DivinExpress storefront and dashboard experience design

**Date:** 2026-08-22

## Objective

Improve the DivinExpress storefront and administration experience as one coherent release: category browsing, branding, customer reassurance, promotional content, cart and checkout presentation, customer chat, and reliable dashboard navigation.

## Scope

### Category browsing

- Replace the four existing category thumbnails with the supplied `icon-homme.png`, `icon-femme.png`, `icon-enfant.png`, and `icon-accessoirs.png` assets.
- Publish the assets under the application `public` directory and keep the category-to-image mapping explicit.
- Selecting a category immediately shows products from that category.
- Category selection does not expose subcategory, size, color, or sort filters.
- Selecting the active category again may return to the mixed catalogue view.
- When a selected category has no product, show exactly: `Aucun produit n’est disponible dans cette catégorie pour le moment — revenez très bientôt.`
- Header category links navigate directly to the corresponding category collection rather than opening filter menus.

### Brand presentation

- Use a reusable brand lockup composed of the DivinExpress mark followed by the DivinExpress wordmark.
- Display the lockup in the storefront header and on the right/form side of the administration login page.
- Preserve responsive sizing and accessible home/login labels.

### Customer testimonials and reassurance

- Add an animated customer testimonials section adapted from the supplied component.
- Testimonials are explicitly fictional content for the prototype, but use credible names, locations, purchases, and delivery experiences relevant to DivinExpress customers in Europe and Africa.
- Provide keyboard-accessible testimonial navigation and pause or reduce animation when the user requests reduced motion.
- Replace the supplied company-logo cloud with four DivinExpress reassurance items inspired by the supplied reference image: responsible materials, quality commitment, tracked delivery, and thoughtful selection.
- Use SVG icons from the existing icon library rather than external brand logos.

### Promotional carousel

- Replace the current final `Nouveautés` home section with a `Promotions du moment` carousel adapted from the supplied card-carousel component.
- Use all ten supplied carousel images as the initial promotional slides.
- Every slide image has all four corners rounded.
- The carousel is touch-friendly and responsive: one dominant card on mobile, a broader staged view on tablet, and a coverflow-style presentation on desktop.
- Autoplay pauses while the user interacts and respects reduced-motion preferences.
- Every published slide links to its associated active product detail route in the current locale.

### Promotional slide administration

- Add a `promotion_slides` table through a new idempotent database migration.
- Each record stores an identifier, image URL, associated product identifier, display position, active state, and timestamps.
- The product foreign key prevents invalid associations. A product that is not active is omitted from the public carousel even if its slide remains stored.
- Seed the ten supplied local images as initial slides. Their product associations must use existing active catalogue products and remain editable from the dashboard.
- Add authenticated administration endpoints for listing and mutating slides. Mutations require owner or manager role.
- Validate request payloads, product existence, product status, image URLs/paths, active state, and integer display positions.
- Add a dashboard `Carrousel promotionnel` manager that supports:
  - image upload through the existing signed Cloudinary flow;
  - mandatory active-product selection;
  - rounded preview;
  - create, edit, activate/deactivate, reorder, and delete operations;
  - clear saving, empty, loading, and failure states.
- The public storefront reads only active slides linked to active products, sorted by display position.
- Public links are derived from the current product slug and locale rather than storing arbitrary destination URLs.

### Cart popup

- Restyle the current cart drawer as a centered modal popup on tablet and desktop, while retaining a safe near-full-screen presentation on small mobile screens.
- Keep the backdrop, Escape handling, focus semantics, body-scroll lock, and close control.
- Show product image, localized name, selected size/color, unit price, line price, and quantity.
- Provide clearly labeled decrement and increment controls, never allowing a quantity below one.
- Provide item removal, subtotal, free-delivery progress, payment reassurance, and a prominent checkout action.
- Retain cart state through the existing cart context.

### Checkout product summary

- Add a reusable order-summary component to both shipping and payment steps.
- Show every product image, localized name, selected variants, quantity, line total, and order subtotal.
- Use responsive layouts that keep the form primary on mobile and present a balanced form/summary layout on larger screens.
- Add distinct inline SVG/icon-library illustrations to the Europe and Africa region selectors.

### Customer chatbot

- Replace the floating WhatsApp bubble with a web-chatbot bubble and chatbot visual language.
- The control opens an on-site chat panel rather than an external WhatsApp URL.
- The first implementation provides a clear welcome state and customer-question interface compatible with the existing AI/messaging domain.
- Remove WhatsApp-specific labels and public floating-button branding. Existing server integrations may remain dormant until separately retired.

### Dashboard reliability

- Reproduce and identify the root cause of the persistent dashboard navigation failure before applying a fix.
- Cover the reproduced failure with a regression test before changing production behavior.
- Replace hard-coded `/fr` and raw full-page administration navigation where it breaks locale-aware client navigation.
- Keep session checks server-side and preserve the current authentication cookie behavior.
- Add a dashboard-segment error boundary with a branded recovery action so an unexpected child-page error does not replace the entire application with the generic Next.js failure screen.
- Error-boundary handling supplements, but does not replace, the root-cause fix.

## Data flow

### Promotional slides

1. An authorized administrator uploads an image or selects an existing initial slide.
2. The administrator selects an active product and chooses display order and publication state.
3. The administration API validates and stores the slide.
4. The home page queries published slides joined to active products.
5. The carousel renders the image and derives a locale-aware product-detail link from the product slug.

### Cart and checkout

1. Product selections remain in `CartContext`.
2. The header opens the modal through `CartDrawerContext`.
3. Quantity controls update the same cart line identity used by the existing context.
4. Checkout pages consume the unchanged cart items and render the shared visual summary.

## Error handling

- Dashboard slide mutations show inline errors and keep unsaved form values.
- Failed promotion queries render an empty promotional state without crashing the home page.
- Invalid, inactive, or deleted product associations are never exposed as public links.
- Missing product images use the established catalogue fallback.
- Dashboard navigation failures are logged by the segment error boundary and can be retried.
- Chatbot service failures keep the conversation UI open and show a concise retry message.

## Testing and verification

- Database migration and promotion repository tests cover schema, relationships, ordering, active filtering, and inactive products.
- API tests cover authentication, authorization, validation, create/update/reorder/delete behavior, and error responses.
- Component tests cover category selection without filters and the exact empty-category sentence.
- Carousel tests cover rounded images, locale-aware product links, keyboard controls, and responsive-safe rendering.
- Dashboard manager tests cover upload integration, mandatory product selection, activation, reordering, and deletion.
- Cart tests cover modal opening/closing, increment, decrement floor, removal, and checkout navigation.
- Checkout tests cover product images, variants, totals, and Europe/Africa icons.
- Branding, testimonial, reassurance, and chatbot controls receive focused rendering/accessibility tests.
- The dashboard navigation regression is reproduced first and kept as a permanent test.
- Run focused tests during development, then the full test suite, typecheck, lint, production build, and representative mobile/desktop visual checks.

## Deferred dashboard areas

After implementation, report which dashboard controls remain demonstrative or can safely be deferred. Likely candidates include global search, notification dropdown behavior, profile menus, response-template management, two-factor authentication UI, and advanced campaign analytics. The final list must be based on the implemented state rather than assumptions.

## Non-goals

- Campaign scheduling, audience segmentation, click analytics, and A/B testing.
- Arbitrary external links from promotion slides.
- A complete replacement of the existing messaging backend.
- Reworking unrelated product, order, or payment domain behavior.
