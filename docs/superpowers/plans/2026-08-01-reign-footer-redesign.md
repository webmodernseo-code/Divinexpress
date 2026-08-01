# Reign Footer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing light footer with the approved premium black responsive footer, faithfully adapting the supplied desktop and mobile references while preserving Reign's existing locale and currency behavior.

**Architecture:** Keep global locale and currency logic in the existing switcher components, adding a typed visual variant instead of duplicating behavior. Rebuild the footer as a focused client component driven by localized navigation-group data, with desktop columns and accessible mobile accordions rendered from the same source. Reuse existing payment and social assets, add the supplied white logo under `public/branding`, and cover behavior with focused Testing Library tests.

**Tech Stack:** Next.js 16.2.12 App Router, React 19.2.4, TypeScript 5 strict mode, Tailwind CSS 4, next-intl 4.13.4, Vitest 4.1.10, Testing Library 16.3.2.

## Global Constraints

- The footer background is deep black (`#0D0D0D`) with an editorial, spacious, premium visual hierarchy.
- Use Fraunces for editorial headings and Inter for interface text through the existing font tokens.
- Use the supplied white Reign asset; do not invert the black logo with CSS.
- Preserve all existing locale routing, currency persistence, header selector appearance, and header behavior.
- Desktop uses a horizontal newsletter, four-column main area, and one-line utility row.
- Mobile uses a vertical newsletter, brand block, accessible Shop/Help/Legal accordions, payments, locale controls, and copyright.
- Do not add a newsletter backend, real social destinations, sales analytics, standalone category routes, or unrelated redesigns.
- Every new user-facing string exists in both `messages/fr.json` and `messages/en.json`.
- Implement with TDD: observe each focused test fail before adding the behavior that makes it pass.

---

## File Map

- Modify `src/components/layout/LanguageSwitcher.tsx`: accept `variant?: 'utility' | 'footer'` and render the existing behavior in either header or footer styling.
- Modify `src/components/layout/CurrencySwitcher.tsx`: accept the same `variant` contract without changing currency state behavior.
- Create `src/components/layout/Footer.test.tsx`: cover newsletter states, navigation groups, accordion behavior, locale/currency integration, and key accessibility semantics.
- Modify `src/components/layout/Footer.tsx`: implement the approved responsive structure from one navigation data model.
- Modify `messages/fr.json`: add the exact French footer copy and link/group labels.
- Modify `messages/en.json`: add the exact English footer copy and link/group labels.
- Create `public/branding/logo-reign-white.png`: copy the supplied `logo-reign-fd-blanc.png` without recompression.

---

### Task 1: Footer variants for language and currency selectors

**Files:**
- Modify: `src/components/layout/LanguageSwitcher.tsx`
- Modify: `src/components/layout/CurrencySwitcher.tsx`
- Test: `src/components/layout/Footer.test.tsx`

**Interfaces:**
- Consumes: `useLocale`, `usePathname`, `useRouter`, `useCurrency`, and the existing dropdown behavior.
- Produces: `LanguageSwitcher({ variant?: 'utility' | 'footer' })` and `CurrencySwitcher({ variant?: 'utility' | 'footer' })`; omitted `variant` must remain identical to `variant="utility"`.

- [ ] **Step 1: Create a focused test harness for footer selector integration**

Create `src/components/layout/Footer.test.tsx` with deterministic mocks for next-intl, localized navigation, contexts, and `next/image`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Footer } from './Footer';

const replace = vi.fn();
const setCurrency = vi.fn();

vi.mock('next/image', () => ({
  default: ({ alt = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt={alt} {...props} />
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'fr',
  useTranslations: (namespace: string) => {
    const messages: Record<string, string> = {
      'footer.newsletterKicker': 'ACCÈS PRIVÉ',
      'footer.newsletterTitle': 'Gardez une longueur d’avance.',
      'footer.newsletterBody': 'Découvrez les nouveautés et offres exclusives.',
      'footer.newsletterLabel': 'Adresse email',
      'footer.newsletterPlaceholder': 'Adresse email',
      'footer.newsletterButton': 'REJOINDRE LA LISTE',
      'footer.newsletterSuccess': 'Merci, vous êtes inscrit·e.',
      'footer.tagline': 'Vêtements et accessoires premium, façonnés pour durer.',
      'footer.groups.shop': 'SHOP',
      'footer.groups.help': 'AIDE',
      'footer.groups.legal': 'LÉGAL',
      'footer.links.newArrivals': 'Nouveautés',
      'footer.links.clothing': 'Vêtements',
      'footer.links.accessories': 'Accessoires',
      'footer.links.bestSellers': 'Meilleures ventes',
      'footer.links.contact': 'Contact',
      'footer.links.faq': 'FAQ',
      'footer.links.shippingReturns': 'Livraison & Retours',
      'footer.links.sizeGuide': 'Guide des tailles',
      'footer.links.legalNotice': 'Mentions légales',
      'footer.links.terms': 'CGV',
      'footer.links.privacy': 'Confidentialité',
      'footer.securePayments': 'Paiements sécurisés',
      'footer.rights': 'Tous droits réservés.',
      'currency.eur': 'Euro (EUR)',
      'currency.gbp': 'Livre (GBP)'
    };
    return (key: string) => messages[`${namespace}.${key}`] ?? key;
  }
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string | object }) => (
    <a href={typeof href === 'string' ? href : '/'} {...props}>{children}</a>
  ),
  usePathname: () => '/',
  useRouter: () => ({ replace })
}));

vi.mock('@/context/CurrencyContext', () => ({
  useCurrency: () => ({ currency: 'EUR', setCurrency })
}));

describe('Footer', () => {
  beforeEach(() => {
    replace.mockReset();
    setCurrency.mockReset();
  });

  it('renders footer locale and currency controls', () => {
    render(<Footer />);
    expect(screen.getByRole('button', { name: /fr/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eur/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the selector integration test and verify it fails**

Run:

```powershell
npx vitest run src/components/layout/Footer.test.tsx --no-file-parallelism
```

Expected: FAIL because the current footer does not render `LanguageSwitcher` or `CurrencySwitcher`.

- [ ] **Step 3: Add a typed visual variant to both selector components**

In both selector files, introduce the shared local type and prop:

```tsx
type SwitcherVariant = 'utility' | 'footer';

export function LanguageSwitcher({ variant = 'utility' }: { variant?: SwitcherVariant }) {
```

```tsx
export function CurrencySwitcher({ variant = 'utility' }: { variant?: SwitcherVariant }) {
```

Derive trigger and menu positioning classes without altering state or event handlers:

```tsx
const isFooter = variant === 'footer';
const triggerClassName = isFooter
  ? 'inline-flex min-h-11 items-center gap-2 bg-transparent text-sm font-medium text-paper transition-colors hover:text-paper/70'
  : 'inline-flex items-center gap-1.5 rounded-full border border-paper/20 bg-paper/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-paper hover:bg-paper/20';
const menuPositionClassName = isFooter
  ? 'absolute bottom-[calc(100%+8px)] right-0 z-20'
  : 'absolute right-0 top-[calc(100%+8px)] z-20';
```

Keep the existing light dropdown menu content for legibility. Use `triggerClassName` on the trigger and prefix the existing dropdown class with `menuPositionClassName`. The footer trigger displays full locale/currency wording while the utility trigger keeps the current compact label:

```tsx
<span>{isFooter ? LANGUAGES.find((item) => item.code === locale)?.name : locale.toUpperCase()}</span>
```

```tsx
<span>{isFooter ? t(active.messageKey) : active.code}</span>
```

- [ ] **Step 4: Render the footer variants temporarily in `Footer.tsx` and verify the focused test passes**

Import and place the controls immediately before the current copyright block; Task 2 will move them into the final utility row:

```tsx
import { LanguageSwitcher } from './LanguageSwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';

<div className="flex justify-center gap-5 bg-ink px-4 py-4">
  <LanguageSwitcher variant="footer" />
  <CurrencySwitcher variant="footer" />
</div>
```

Run:

```powershell
npx vitest run src/components/layout/Footer.test.tsx --no-file-parallelism
```

Expected: PASS, 1 test.

- [ ] **Step 5: Verify the unchanged default selector contract**

Run:

```powershell
npx tsc --noEmit
```

Expected: exit code 0; existing `<LanguageSwitcher />` and `<CurrencySwitcher />` calls in `Header.tsx` remain valid.

- [ ] **Step 6: Commit the selector variants**

```powershell
git add src/components/layout/LanguageSwitcher.tsx src/components/layout/CurrencySwitcher.tsx src/components/layout/Footer.tsx src/components/layout/Footer.test.tsx
git commit -m "feat: add footer variants for locale controls"
```

---

### Task 2: Faithful responsive footer implementation

**Files:**
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/components/layout/Footer.test.tsx`
- Modify: `messages/fr.json`
- Modify: `messages/en.json`
- Create: `public/branding/logo-reign-white.png`

**Interfaces:**
- Consumes: `LanguageSwitcher({ variant: 'footer' })`, `CurrencySwitcher({ variant: 'footer' })`, `Link` from `@/i18n/navigation`, `SOCIAL_LINKS`, and existing payment assets.
- Produces: `Footer()` with a localized newsletter, desktop navigation columns, mobile accordion navigation, brand block, secure-payment block, and responsive utility row.

- [ ] **Step 1: Expand the behavioral tests before rewriting the component**

Append these tests inside the existing `describe('Footer')` block:

```tsx
it('shows the approved newsletter copy and confirms a valid local subscription', async () => {
  const user = userEvent.setup();
  render(<Footer />);
  expect(screen.getByText('ACCÈS PRIVÉ')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Gardez une longueur d’avance.' })).toBeInTheDocument();
  await user.type(screen.getByLabelText('Adresse email'), 'client@example.com');
  await user.click(screen.getByRole('button', { name: 'REJOINDRE LA LISTE' }));
  expect(screen.getByText('Merci, vous êtes inscrit·e.')).toHaveAttribute('role', 'status');
});

it('does not confirm an invalid email', async () => {
  const user = userEvent.setup();
  render(<Footer />);
  await user.type(screen.getByLabelText('Adresse email'), 'incorrect');
  await user.click(screen.getByRole('button', { name: 'REJOINDRE LA LISTE' }));
  expect(screen.queryByText('Merci, vous êtes inscrit·e.')).not.toBeInTheDocument();
});

it('renders the three desktop navigation groups and their localized links', () => {
  render(<Footer />);
  expect(screen.getAllByText('SHOP').length).toBeGreaterThan(0);
  expect(screen.getAllByText('AIDE').length).toBeGreaterThan(0);
  expect(screen.getAllByText('LÉGAL').length).toBeGreaterThan(0);
  expect(screen.getAllByRole('link', { name: 'Accessoires' })[0]).toHaveAttribute('href');
  expect(screen.getAllByRole('link', { name: 'Contact' })[0]).toHaveAttribute('href', '/contact');
  expect(screen.getAllByRole('link', { name: 'Confidentialité' })[0]).toHaveAttribute('href', '/confidentialite');
});

it('opens and closes a mobile navigation accordion accessibly', async () => {
  const user = userEvent.setup();
  render(<Footer />);
  const trigger = screen.getByRole('button', { name: 'SHOP' });
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await user.click(trigger);
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(document.getElementById(trigger.getAttribute('aria-controls')!)).not.toHaveAttribute('hidden');
  await user.click(trigger);
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

it('uses the supplied white logo and labels the secure payment area', () => {
  render(<Footer />);
  expect(screen.getByAltText('Reign')).toHaveAttribute('src', '/branding/logo-reign-white.png');
  expect(screen.getByText('Paiements sécurisés')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the expanded footer tests and verify the new cases fail**

Run:

```powershell
npx vitest run src/components/layout/Footer.test.tsx --no-file-parallelism
```

Expected: the Task 1 selector test passes; the new newsletter, navigation, accordion, and white-logo tests fail.

- [ ] **Step 3: Add the exact localized footer content**

Replace the current `footer` namespace in `messages/fr.json` with:

```json
"footer": {
  "newsletterKicker": "ACCÈS PRIVÉ",
  "newsletterTitle": "Gardez une longueur d’avance sur la prochaine sortie.",
  "newsletterBody": "Soyez parmi les premiers à découvrir les nouveautés, les offres exclusives et plus encore.",
  "newsletterLabel": "Adresse email",
  "newsletterPlaceholder": "Adresse email",
  "newsletterButton": "REJOINDRE LA LISTE",
  "newsletterSuccess": "Merci, vous êtes inscrit·e à la liste privée.",
  "tagline": "Vêtements et accessoires premium, façonnés pour durer.",
  "groups": { "shop": "SHOP", "help": "AIDE", "legal": "LÉGAL" },
  "links": {
    "newArrivals": "Nouveautés",
    "clothing": "Vêtements",
    "accessories": "Accessoires",
    "bestSellers": "Meilleures ventes",
    "contact": "Contact",
    "faq": "FAQ",
    "shippingReturns": "Livraison & Retours",
    "sizeGuide": "Guide des tailles",
    "legalNotice": "Mentions légales",
    "terms": "CGV",
    "privacy": "Confidentialité"
  },
  "securePayments": "Paiements sécurisés",
  "rights": "Tous droits réservés."
}
```

Replace the current `footer` namespace in `messages/en.json` with:

```json
"footer": {
  "newsletterKicker": "PRIVATE ACCESS",
  "newsletterTitle": "Stay ahead of the next drop.",
  "newsletterBody": "Be the first to know about new arrivals, exclusive offers and more.",
  "newsletterLabel": "Email address",
  "newsletterPlaceholder": "Email address",
  "newsletterButton": "JOIN THE LIST",
  "newsletterSuccess": "Thank you, you have joined the private list.",
  "tagline": "Premium clothing and accessories, made to last.",
  "groups": { "shop": "SHOP", "help": "HELP", "legal": "LEGAL" },
  "links": {
    "newArrivals": "New arrivals",
    "clothing": "Clothing",
    "accessories": "Accessories",
    "bestSellers": "Best sellers",
    "contact": "Contact",
    "faq": "FAQ",
    "shippingReturns": "Shipping & Returns",
    "sizeGuide": "Size Guide",
    "legalNotice": "Legal Notice",
    "terms": "Terms of Sale",
    "privacy": "Privacy"
  },
  "securePayments": "Secure payments",
  "rights": "All rights reserved."
}
```

Update the test mock strings to match the full approved French title and success copy exactly.

- [ ] **Step 4: Add the white logo asset without altering the source file**

Run:

```powershell
Copy-Item -LiteralPath 'logo-reign-fd-blanc.png' -Destination 'public\branding\logo-reign-white.png'
```

Verify the copy is byte-identical:

```powershell
Get-FileHash 'logo-reign-fd-blanc.png','public\branding\logo-reign-white.png' -Algorithm SHA256
```

Expected: both SHA-256 hashes are identical.

- [ ] **Step 5: Replace `Footer.tsx` with one shared navigation model**

Define typed groups once, above `Footer`:

```tsx
type FooterLink = {
  key: 'newArrivals' | 'clothing' | 'accessories' | 'bestSellers' | 'contact' | 'faq' | 'shippingReturns' | 'sizeGuide' | 'legalNotice' | 'terms' | 'privacy';
  href: string | { pathname: '/'; query: Record<string, string> };
};

type FooterGroup = {
  key: 'shop' | 'help' | 'legal';
  links: FooterLink[];
};

const FOOTER_GROUPS: FooterGroup[] = [
  {
    key: 'shop',
    links: [
      { key: 'newArrivals', href: '/' },
      { key: 'clothing', href: '/' },
      { key: 'accessories', href: { pathname: '/', query: { categorie: 'accessoires' } } },
      { key: 'bestSellers', href: '/' }
    ]
  },
  {
    key: 'help',
    links: [
      { key: 'contact', href: '/contact' },
      { key: 'faq', href: '/aide' },
      { key: 'shippingReturns', href: '/livraison-retours' },
      { key: 'sizeGuide', href: '/guide-tailles' }
    ]
  },
  {
    key: 'legal',
    links: [
      { key: 'legalNotice', href: '/mentions-legales' },
      { key: 'terms', href: '/cgv' },
      { key: 'privacy', href: '/confidentialite' }
    ]
  }
];
```

Only Accessoires receives a filter query because `?categorie=accessoires` is an existing supported contract. New arrivals, Clothing, and Best sellers link to the collection homepage until dedicated collection filters exist; do not add ignored query parameters that imply unsupported behavior.

Use the model for both the desktop columns (`hidden lg:grid`) and mobile accordions (`lg:hidden`). Keep accordion panels mounted and toggle `hidden`, with IDs based on the group key:

```tsx
const [openGroup, setOpenGroup] = useState<FooterGroup['key'] | null>(null);

<button
  type="button"
  aria-expanded={openGroup === group.key}
  aria-controls={`footer-${group.key}-panel`}
  onClick={() => setOpenGroup((current) => current === group.key ? null : group.key)}
>
  <span>{t(`groups.${group.key}`)}</span>
  <span aria-hidden="true">{openGroup === group.key ? '−' : '+'}</span>
</button>
<div id={`footer-${group.key}-panel`} hidden={openGroup !== group.key}>
  {group.links.map((link) => <Link key={link.key} href={link.href}>{t(`links.${link.key}`)}</Link>)}
</div>
```

Use these exact top-level layout classes as the responsive foundation:

```tsx
<footer className="bg-ink text-paper">
  <Container className="px-4 pb-8 pt-8 sm:px-6 md:pt-12 lg:px-8 lg:pb-7">
    <section className="rounded-[24px] bg-[#f4f1ec] px-6 py-9 text-ink sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.8fr)] lg:items-center lg:gap-14 lg:px-12 lg:py-11">
      {/* localized newsletter copy and form */}
    </section>
    <div className="py-12 lg:grid lg:grid-cols-[1.35fr_0.8fr_0.8fr_0.8fr] lg:gap-16 lg:py-16">
      {/* brand block, desktop groups, mobile accordions */}
    </div>
    <div className="border-t border-paper/15 pt-8 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-8">
      {/* copyright, payments, locale controls */}
    </div>
  </Container>
</footer>
```

Render the logo directly with `next/image`:

```tsx
<Image
  src="/branding/logo-reign-white.png"
  alt="Reign"
  width={193}
  height={67}
  className="h-auto w-[170px] object-contain"
/>
```

Newsletter submission relies on native email validity plus trimmed content:

```tsx
function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!email.trim() || !form.checkValidity()) {
    form.reportValidity();
    return;
  }
  setHasSubscribed(true);
  setEmail('');
}
```

Render success feedback as:

```tsx
<p role="status" className="mt-7 text-sm font-medium text-mist-700">
  {t('newsletterSuccess')}
</p>
```

Use the existing `SOCIAL_LINKS` and payment assets. Social links remain `href="#"` per scope. Use circular `h-12 w-12 border border-paper/70` controls. Render payment images with optical height classes between `h-5` and `h-7`, preserving aspect ratio.

- [ ] **Step 6: Run the focused footer tests and make them pass**

Run:

```powershell
npx vitest run src/components/layout/Footer.test.tsx --no-file-parallelism
```

Expected: all footer tests PASS.

- [ ] **Step 7: Run static validation for the completed component**

Run:

```powershell
npx tsc --noEmit
npx eslint src/components/layout/Footer.tsx src/components/layout/Footer.test.tsx src/components/layout/LanguageSwitcher.tsx src/components/layout/CurrencySwitcher.tsx
```

Expected: both commands exit 0. This targeted ESLint command intentionally excludes the repository's unrelated pre-existing `claude skills/` findings.

- [ ] **Step 8: Commit the responsive footer**

```powershell
git add src/components/layout/Footer.tsx src/components/layout/Footer.test.tsx messages/fr.json messages/en.json public/branding/logo-reign-white.png
git commit -m "feat: redesign the Reign footer"
```

---

### Task 3: Responsive visual verification and final regression gate

**Files:**
- Modify only if verification exposes a defect: `src/components/layout/Footer.tsx`
- Modify only if verification exposes a test gap: `src/components/layout/Footer.test.tsx`

**Interfaces:**
- Consumes: completed `Footer`, live Next.js route `/fr`, locale route `/en`, and responsive browser viewport controls.
- Produces: verified mobile and desktop footer with no overflow, collision, locale regression, or header regression.

- [ ] **Step 1: Confirm no unrelated dev server owns the chosen port**

Run:

```powershell
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Select-Object ProcessId,CommandLine
```

If Reign is already running on port 3210, reuse it. Otherwise run:

```powershell
npm run dev -- -p 3210
```

Do not launch `npm run build` while this dev server uses `.next`.

- [ ] **Step 2: Verify the approved mobile composition at 390 × 844**

Open `http://localhost:3210/fr` and set the viewport to 390 × 844. Inspect the full footer and verify:

- Off-white newsletter panel is vertically stacked and fully contained.
- White logo is sharp and prominent.
- Social controls are circular and evenly spaced.
- Shop, Aide, and Légal render as divided accordion rows.
- Payment marks fit on one or two intentional centered rows without clipping.
- Locale/currency controls and copyright follow the payments.
- The page has no horizontal scrollbar.

Capture a full-page screenshot for comparison with the supplied mobile reference.

- [ ] **Step 3: Verify interactions on mobile**

Using the same viewport:

- Open each accordion and confirm its expected links.
- Close an open accordion and confirm its panel is hidden.
- Submit `client@example.com` and confirm the localized success status.
- Switch EUR to GBP and confirm the trigger updates.
- Switch FR to EN and confirm the `/en` footer uses English copy.
- Tab through every control and confirm a visible focus indicator.

- [ ] **Step 4: Verify the approved desktop composition at 1440 × 1000**

Open `http://localhost:3210/fr` at 1440 × 1000 and verify:

- Newsletter copy and combined form share one horizontal panel.
- Brand, Shop, Aide, and Légal occupy four balanced columns.
- Mobile accordion triggers are absent from the desktop layout.
- Copyright, payments, and locale controls share the bottom utility row.
- English copy at `/en` does not collide or wrap awkwardly.
- Header utility selectors retain their original compact appearance.

Capture a full-page screenshot for comparison with the supplied desktop reference.

- [ ] **Step 5: Correct only defects found by the visual checks**

For each observed defect, first add or tighten a focused assertion in `Footer.test.tsx` when the issue is behavioral. Then make the smallest Tailwind or JSX correction in `Footer.tsx`. Do not refactor unrelated components.

- [ ] **Step 6: Run the final verification gate**

Run:

```powershell
npx vitest run src/components/layout/Footer.test.tsx --no-file-parallelism
npx tsc --noEmit
npx eslint src/components/layout/Footer.tsx src/components/layout/Footer.test.tsx src/components/layout/LanguageSwitcher.tsx src/components/layout/CurrencySwitcher.tsx
git status --short
```

Expected:

- Footer test file: all tests PASS.
- TypeScript: exit code 0.
- Targeted ESLint: exit code 0.
- Git status: only intentional footer changes, if any, plus the user's pre-existing untracked root assets and `public/image/` directory.

- [ ] **Step 7: Commit any visual-verification corrections**

If Step 5 changed files:

```powershell
git add src/components/layout/Footer.tsx src/components/layout/Footer.test.tsx
git commit -m "fix: refine responsive footer layout"
```

If Step 5 made no changes, do not create an empty commit.
