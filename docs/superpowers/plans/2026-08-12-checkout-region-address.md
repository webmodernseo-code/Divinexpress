# Formulaire livraison Europe/Afrique — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapter le formulaire d'adresse du tunnel de commande avec un sélecteur Europe/Afrique — autocomplétion d'adresses réelles (Photon/OSM) en Europe, adresse libre + téléphone en Afrique — front ET back (option A), sans limite de pays.

**Architecture:** Le front fournit désormais le code pays ISO (source de vérité). La validation devient conditionnelle selon la région. Le back accepte `city`/`postalCode` optionnels et utilise le `countryCode` fourni au lieu du mapping de noms fragile. Aucune migration DB : l'adresse complète reste stockée en JSON dans `orders.shipping_address_json`, et les colonnes NOT NULL de `customer_addresses` reçoivent `''` quand ville/CP sont absents.

**Tech Stack:** Next.js 16 (App Router, client components), next-intl, zod, Photon API (photon.komoot.io), SQLite (dev) + Postgres/Neon (prod) via adaptateur, Vitest.

## Global Constraints

- Bilingue fr + en : toute chaîne visible passe par `messages/fr.json` et `messages/en.json` (namespace `checkout`).
- Aucune clé API : Photon est appelé sans clé, côté client, avec anti-rebond + AbortController.
- Aucune migration DB : compat via JSON + coalescence `?? ''` sur les colonnes NOT NULL.
- Code pays = ISO alpha-2 majuscules, source de vérité back.
- TDD : test d'abord, commits fréquents. Lancer les tests avec `npm run test`.
- Vérif finale avant push : `rm -rf .next/dev && npm run typecheck` doit renvoyer 0 (l'artefact `.next/dev` généré par un serveur dev corrompt le typecheck).

---

### Task 1: Données pays par continent

**Files:**
- Create: `src/lib/countries.ts`
- Test: `src/lib/countries.test.ts`

**Interfaces:**
- Produces: `interface Country { code: string; fr: string; en: string }`, `const EUROPE: Country[]`, `const AFRICA: Country[]`, `function countryName(code: string, locale: 'fr' | 'en'): string`.

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from 'vitest';
import { EUROPE, AFRICA, countryName } from './countries';

describe('countries', () => {
  it('exposes ISO alpha-2 codes for both continents', () => {
    expect(EUROPE.find((c) => c.code === 'FR')).toBeTruthy();
    expect(AFRICA.find((c) => c.code === 'SN')).toBeTruthy();
    for (const c of [...EUROPE, ...AFRICA]) expect(c.code).toMatch(/^[A-Z]{2}$/);
  });
  it('returns a localized name by code', () => {
    expect(countryName('FR', 'fr')).toBe('France');
    expect(countryName('SN', 'en')).toBe('Senegal');
    expect(countryName('ZZ', 'fr')).toBe('ZZ');
  });
});
```

- [ ] **Step 2: Run `npm run test -- countries` → FAIL (module manquant)**

- [ ] **Step 3: Implement** `src/lib/countries.ts` — listes complètes Europe et Afrique (`{ code, fr, en }`), triées par nom fr. Inclure au minimum : Europe (FR, BE, CH, DE, GB, ES, IT, PT, NL, LU, IE, AT, DK, SE, NO, FI, PL, …) ; Afrique (SN, CI, ML, BJ, TG, BF, GN, CM, GA, CD, CG, MA, DZ, TN, NG, GH, …). Ajouter tous les pays de chaque continent. `countryName` fait un lookup et renvoie le code en repli.

```ts
export interface Country { code: string; fr: string; en: string }
export const EUROPE: Country[] = [ /* … tous les pays d'Europe … */ ];
export const AFRICA: Country[] = [ /* … tous les pays d'Afrique … */ ];
const BY_CODE = new Map<string, Country>([...EUROPE, ...AFRICA].map((c) => [c.code, c]));
export function countryName(code: string, locale: 'fr' | 'en'): string {
  return BY_CODE.get(code)?.[locale] ?? code;
}
```

- [ ] **Step 4: Run `npm run test -- countries` → PASS**
- [ ] **Step 5: Commit** `feat(checkout): country lists per continent (ISO codes)`

---

### Task 2: Validation conditionnelle

**Files:**
- Modify: `src/lib/checkoutValidation.ts`
- Test: `src/lib/checkoutValidation.test.ts`

**Interfaces:**
- Produces: `ShippingFormValues` étendu (`region: 'europe'|'africa'`, `phone?`, `city?`, `postalCode?`, `countryCode`), `validateShippingForm(values): ShippingFormErrors`.

- [ ] **Step 1: Test** (ajouter aux tests existants)

```ts
import { validateShippingForm, type ShippingFormValues } from './checkoutValidation';

const base: ShippingFormValues = {
  region: 'europe', fullName: 'Jean Dupont', email: 'j@d.fr',
  address: '1 rue X', city: 'Paris', postalCode: '75001', country: 'France', countryCode: 'FR',
};

it('europe requires city and postalCode', () => {
  expect(validateShippingForm({ ...base, city: '', postalCode: '' }))
    .toEqual({ city: 'required', postalCode: 'required' });
});
it('africa requires phone but not city/postalCode', () => {
  const africa: ShippingFormValues = {
    ...base, region: 'africa', country: 'Sénégal', countryCode: 'SN',
    city: '', postalCode: '', phone: '',
  };
  expect(validateShippingForm(africa)).toEqual({ phone: 'required' });
});
it('africa passes with phone set', () => {
  const africa: ShippingFormValues = {
    ...base, region: 'africa', countryCode: 'SN', city: '', postalCode: '', phone: '+221770000000',
  };
  expect(validateShippingForm(africa)).toEqual({});
});
```

- [ ] **Step 2: Run `npm run test -- checkoutValidation` → FAIL**

- [ ] **Step 3: Implement**

```ts
export interface ShippingFormValues {
  region: 'europe' | 'africa';
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  city?: string;
  postalCode?: string;
  country: string;
  countryCode: string;
}

export function validateShippingForm(values: ShippingFormValues): ShippingFormErrors {
  const errors: ShippingFormErrors = {};
  if (!values.fullName.trim()) errors.fullName = 'required';
  if (!values.email.trim()) errors.email = 'required';
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'invalid';
  if (!values.address.trim()) errors.address = 'required';
  if (!values.country.trim() || !values.countryCode.trim()) errors.country = 'required';
  if (values.region === 'europe') {
    if (!values.city?.trim()) errors.city = 'required';
    if (!values.postalCode?.trim()) errors.postalCode = 'required';
  } else {
    if (!values.phone?.trim()) errors.phone = 'required';
  }
  return errors;
}
```
(`ShippingFormErrors` : élargir le `Record` aux nouvelles clés via `keyof ShippingFormValues`.)

- [ ] **Step 4: Run `npm run test -- checkoutValidation` → PASS**
- [ ] **Step 5: Commit** `feat(checkout): conditional shipping validation by region`

---

### Task 3: Élargir CheckoutContext

**Files:**
- Modify: `src/context/CheckoutContext.tsx`

**Interfaces:**
- Consumes: `ShippingFormValues` (Task 2).

- [ ] **Step 1:** Ouvrir `CheckoutContext.tsx`. Il stocke `shipping: ShippingFormValues | null`. Comme le type est importé de `checkoutValidation`, l'élargissement est automatique. Si une valeur initiale/`EMPTY` existe dans le contexte, y ajouter `region: 'europe'`, `countryCode: ''`, `phone: ''`.
- [ ] **Step 2: Run `rm -rf .next/dev && npm run typecheck` → 0**
- [ ] **Step 3: Commit** `refactor(checkout): widen CheckoutContext shipping type`

---

### Task 4: Composant AddressAutocomplete (Photon)

**Files:**
- Create: `src/components/checkout/AddressAutocomplete.tsx`
- Test: `src/components/checkout/AddressAutocomplete.test.tsx`

**Interfaces:**
- Produces:
```ts
interface AddressSelection { address: string; city: string; postalCode: string; country: string; countryCode: string }
function AddressAutocomplete(props: {
  value: string;
  locale: 'fr' | 'en';
  label: string;
  onInputChange: (text: string) => void;
  onSelect: (sel: AddressSelection) => void;
  error?: string;
}): JSX.Element
```
- Mapping Photon `feature.properties` → `AddressSelection` :
  - `address` = `[housenumber, street ?? name].filter(Boolean).join(' ')` (repli `name`)
  - `city` = `city ?? town ?? village ?? ''`
  - `postalCode` = `postcode ?? ''`
  - `country` = `country ?? ''`
  - `countryCode` = `(countrycode ?? '').toUpperCase()`

- [ ] **Step 1: Test** (mock `fetch`, anti-rebond avec faux timers)

```tsx
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AddressAutocomplete } from './AddressAutocomplete';

const feature = { properties: { name: '1 Rue de Rivoli', housenumber: '1', street: 'Rue de Rivoli',
  city: 'Paris', postcode: '75001', country: 'France', countrycode: 'fr' } };

beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ features: [feature] }) }))); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('shows suggestions after debounce and returns a mapped selection on click', async () => {
  const onSelect = vi.fn();
  render(<AddressAutocomplete value="" locale="fr" label="Adresse" onInputChange={() => {}} onSelect={onSelect} />);
  fireEvent.change(screen.getByLabelText('Adresse'), { target: { value: 'rue de riv' } });
  await act(async () => { vi.advanceTimersByTime(400); });
  const option = await screen.findByText(/Rue de Rivoli/);
  fireEvent.click(option);
  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({
    city: 'Paris', postalCode: '75001', countryCode: 'FR',
  }));
});
```

- [ ] **Step 2: Run `npm run test -- AddressAutocomplete` → FAIL**

- [ ] **Step 3: Implement** — champ `<input>` contrôlé ; `useEffect` avec `setTimeout(300ms)` + `AbortController` ; ne fetch que si `query.trim().length >= 3` ; `fetch(\`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lang=${locale}&limit=5\`)` ; stocke `features`, affiche une liste `<ul role="listbox">` cliquable ; `onSelect(map(feature))` + vide la liste. Gérer erreur/abort silencieusement (liste vide → saisie manuelle possible). Attribution « © OpenStreetMap » discrète sous le champ. Fermer la liste au blur (léger délai) et à la sélection.

- [ ] **Step 4: Run `npm run test -- AddressAutocomplete` → PASS**
- [ ] **Step 5: Commit** `feat(checkout): Photon address autocomplete component`

---

### Task 5: Refonte du formulaire livraison

**Files:**
- Modify: `src/app/[locale]/commande/livraison/page.tsx`

**Interfaces:**
- Consumes: `AddressAutocomplete` (Task 4), `EUROPE`/`AFRICA`/`countryName` (Task 1), `ShippingFormValues`/`validateShippingForm` (Task 2).

- [ ] **Step 1:** Remplacer le rendu à liste `FIELDS` par un formulaire structuré :
  - Toggle région (deux boutons `Europe`/`Afrique`, `values.region`).
  - Toujours : `fullName`, `email`.
  - Si `region==='europe'` : `<AddressAutocomplete>` (onSelect → set address/city/postalCode/country/countryCode) ; puis champs `city`, `postalCode` (modifiables) ; `<select>` pays alimenté par `EUROPE` (option `value=code`, label `countryName(code, locale)`), qui fixe `country`+`countryCode`.
  - Si `region==='africa'` : `phone` (obligatoire), `<select>` pays alimenté par `AFRICA`, `address` en `<textarea>` libre. Pas de city/postalCode.
  - Au changement de région, réinitialiser les champs propres à l'autre branche (city/postalCode vidés en Afrique ; phone vidé en Europe).
  - `handleSubmit` : `validateShippingForm(values)` ; si OK `setShipping(values)` → `router.push('/commande/paiement')`.
- [ ] **Step 2: Run `rm -rf .next/dev && npm run typecheck` → 0**
- [ ] **Step 3:** Lancer le dev, vérifier manuellement les deux branches + suggestions Photon.
- [ ] **Step 4: Commit** `feat(checkout): region-aware shipping form (Europe/Africa)`

---

### Task 6: i18n

**Files:**
- Modify: `messages/fr.json`, `messages/en.json` (namespace `checkout`)

- [ ] **Step 1:** Ajouter les clés (fr + en) : `regionLabel`, `regionEurope`, `regionAfrica`, `fields.phone`, `africaAddressPlaceholder`, `addressAutocompleteHint`, `osmAttribution`, `errors.required`/`errors.invalid` (déjà présents — vérifier), et libellé pays « Pays ». Reprendre les libellés exacts existants pour les autres champs.
- [ ] **Step 2:** Vérifier que `t('fields.phone')`, etc. résolvent (pas de clé manquante en console).
- [ ] **Step 3: Commit** `i18n(checkout): region + phone + autocomplete strings`

---

### Task 7: Schéma commande — city/postalCode nullable

**Files:**
- Modify: `src/server/orders/schemas.ts`
- Test: `src/server/orders/service.test.ts` (ou test de schéma dédié si présent)

**Interfaces:**
- Produces: `createOrderInputSchema` avec `shippingAddress.postalCode` et `city` `nullable`.

- [ ] **Step 1: Test** — un `createOrderInput` avec `city: null, postalCode: null` passe le schéma.

```ts
import { createOrderInputSchema } from './schemas';
it('accepts null city/postalCode', () => {
  const parsed = createOrderInputSchema.safeParse({
    idempotencyKey: 'abcd1234', currency: 'EUR',
    customer: { email: 'a@b.fr', firstName: 'A', lastName: 'B', phone: '+221770000000' },
    shippingAddress: { recipient: 'A B', line1: 'Quartier X', line2: null,
      postalCode: null, city: null, region: null, countryCode: 'SN' },
    lines: [{ variantId: 'v1', quantity: 1 }], shippingMinor: 0, taxMinor: 0, discountMinor: 0,
  });
  expect(parsed.success).toBe(true);
});
```

- [ ] **Step 2: Run test → FAIL**
- [ ] **Step 3: Implement** — dans `shippingAddress`, remplacer `postalCode: z.string().trim().min(1)` et `city: z.string().trim().min(1)` par `z.string().trim().min(1).nullable()` (comme `nullableText`).
- [ ] **Step 4: Run test → PASS**
- [ ] **Step 5: Commit** `feat(orders): nullable city/postalCode in order schema`

---

### Task 8: API checkout — countryCode direct, phone, city/postal optionnels

**Files:**
- Modify: `src/app/api/checkout/route.ts`
- Test: `src/server/checkout/checkout.test.ts` (adapter/ajouter)

**Interfaces:**
- Consumes: `createOrderInputSchema` (Task 7).
- `requestSchema.shipping` devient : `fullName`, `email`, `address` requis ; `city`/`postalCode` `.optional()` ; `country` requis ; `countryCode` `z.string().length(2)` ; `phone` `.optional()` ; `region` `z.enum(['europe','africa']).optional()`.

- [ ] **Step 1: Test** — POST Afrique (SN, sans city/postal, avec phone) n'échoue plus sur le pays ni sur city/postal ; `customer.phone` est propagé. (Suivre le style des tests existants ; provider Genius mocké/configuré comme dans `checkout.test.ts`.)
- [ ] **Step 2: Run test → FAIL**
- [ ] **Step 3: Implement**
  - `requestSchema.shipping` comme ci-dessus.
  - `destinationCountryCode` = `input.shipping.countryCode.toUpperCase()` (fallback : `countryCode(input.shipping.country)` si absent, pour robustesse ascendante). Supprimer le throw « Unsupported » quand un `countryCode` valide (2 lettres) est fourni.
  - `customer.phone` = `input.shipping.phone ?? null`.
  - `shippingAddress.city` = `input.shipping.city ?? null` ; `postalCode` = `input.shipping.postalCode ?? null`.
- [ ] **Step 4: Run test → PASS**
- [ ] **Step 5: Commit** `feat(checkout): accept ISO countryCode, phone, optional city/postal`

---

### Task 9: Service commande — colonnes NOT NULL sûres

**Files:**
- Modify: `src/server/orders/service.ts`
- Test: `src/server/orders/service.test.ts`

- [ ] **Step 1: Test** — `createOrder` avec `shippingAddress.city=null, postalCode=null` insère sans erreur ; le JSON stocké contient bien `city:null/postalCode:null` ; `customers.phone` = valeur fournie.
- [ ] **Step 2: Run test → FAIL** (contrainte NOT NULL sur `customer_addresses`)
- [ ] **Step 3: Implement** — à l'INSERT `customer_addresses`, passer `input.shippingAddress.postalCode ?? ''` et `input.shippingAddress.city ?? ''` (les colonnes restent NOT NULL, `''` les satisfait). Le `shipping_address_json` continue de stocker l'objet tel quel (city/postalCode `null` conservés = vérité). Vérifier que l'INSERT `customers` inclut déjà `phone` (colonne existante) ; sinon l'ajouter.
- [ ] **Step 4: Run test → PASS**
- [ ] **Step 5: Commit** `feat(orders): persist null city/postal via JSON, coalesce structured columns`

---

### Task 10: Soumission (page paiement) — envoyer les nouveaux champs

**Files:**
- Modify: page/module qui appelle `POST /api/checkout` (repérer via recherche `'/api/checkout'`, probablement `src/app/[locale]/commande/paiement/page.tsx`).

- [ ] **Step 1:** Dans le payload `shipping` envoyé à l'API, inclure `countryCode`, `phone`, `region` (en plus des champs existants). Ne plus envoyer `city`/`postalCode` en dur ; envoyer `values.city ?? undefined`, `values.postalCode ?? undefined`.
- [ ] **Step 2: Run `rm -rf .next/dev && npm run typecheck` → 0**
- [ ] **Step 3: Commit** `feat(checkout): submit countryCode/phone/region to API`

---

### Task 11: Vérif dashboard (adresse/phone optionnels)

**Files:**
- Verify: `src/app/[locale]/(dashboard)/commandes/page.tsx`, `src/app/[locale]/(dashboard)/clients/page.tsx`

- [ ] **Step 1:** Confirmer l'affichage : le récap adresse utilise déjà `.filter(Boolean).join(', ')` (ville/CP vides ignorés) et le téléphone via `customer.phone`. Aucune modif attendue. Si un champ ville/CP est affiché en dur ailleurs, le rendre conditionnel.
- [ ] **Step 2:** Si modif : commit `fix(dashboard): tolerate missing city/postal`. Sinon, rien.

---

### Task 12: Vérification finale + déploiement

- [ ] **Step 1: Run** `npm run test` → tout vert.
- [ ] **Step 2: Run** `rm -rf .next/dev && npm run typecheck` → 0.
- [ ] **Step 3: Run** `npm run lint` (tolérer l'erreur `any` pré-existante hors périmètre dans `webhooks/genius/route.ts`).
- [ ] **Step 4:** Commit final éventuel, puis `git push origin feature/frontend-storefront` (déploiement Vercel prod). Vérifier le tunnel de commande en ligne (Europe : suggestions ; Afrique : téléphone + adresse libre).

## Self-Review

- **Couverture spec :** région/branches (T5), Photon (T4), pays ISO (T1, T8), validation conditionnelle (T2), phone (T2/T5/T8/T9), city/postal optionnels (T7/T8/T9), i18n (T6), back sans limite pays (T8), dashboard (T11). ✅
- **Pas de placeholder :** les listes pays complètes (T1) et les libellés i18n (T6) sont décrits ; le code des étapes est concret. Les rares « repérer via recherche » (T10) sont des étapes d'investigation suivies d'une action concrète.
- **Cohérence des types :** `ShippingFormValues` (region, phone?, city?, postalCode?, countryCode) est utilisé identiquement en T2/T3/T5/T10 ; `AddressSelection` (T4) alimente T5 ; `countryCode` ISO2 traverse T5→T10→T8→T9.
