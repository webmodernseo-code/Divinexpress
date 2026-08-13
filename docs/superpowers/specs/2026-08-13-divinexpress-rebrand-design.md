# Rebrand « Reign » → « DivinExpress » — Design

Document de conception validé le 2026-08-13. Décrit le remplacement de la marque
« Reign » par « DivinExpress » dans le code, les textes et la configuration, sans
changer le concept business (mode/streetwear premium, pièce phare YAHWEH).

## Objectif

Remplacer toutes les mentions **visibles et fonctionnelles** de « Reign » par
« DivinExpress », brancher la base de production Neon (config uniquement) et préparer
le déploiement sur le même Vercel que l'ancien dossier divinexpress. Ne rien casser :
tests verts, `typecheck` à 0.

## Décisions validées

- **Nom de marque :** `DivinExpress` (un seul mot, D et E majuscules).
- **Concept :** inchangé — simple remplacement du nom, pas de réécriture éditoriale.
- **Logo :** on **garde les images actuelles** (`logo-reign*.png`) pour l'instant ;
  on ne modifie que le texte `alt`/`aria-label`. Vrai logo DivinExpress = phase ultérieure.
- **Domaine :** `divinexpress.fr` (URL prod + domaine email).
- **Base prod :** Neon (Postgres). Aucun code à écrire, l'app détecte déjà `postgres://`.
- **Déploiement :** Vercel (même projet que l'ancien dossier divinexpress supprimé).

## Approche

Remplacement **ciblé, fichier par fichier, en respectant la casse** :

| Forme source | Forme cible |
|---|---|
| `Reign` | `DivinExpress` |
| `REIGN` | `DIVINEXPRESS` |
| `reign` | `divinexpress` |

Les **tests** qui asservissent des chaînes « Reign » sont mis à jour dans le même
mouvement que le fichier qu'ils couvrent, pour rester verts.

**Rejeté :** un `sed`/remplacement global aveugle — il corromprait les docs
historiques, les chemins d'images (`logo-reign.png`), les noms de fichiers d'assets,
et mélangerait les trois casses.

## Table de correspondance (source de vérité)

| Contexte | Avant | Après |
|---|---|---|
| Nom affiché | Reign | DivinExpress |
| Capitales / code promo | REIGN10 | DIVINEXPRESS10 |
| Entité légale | Reign SAS | DivinExpress SAS |
| Email contact | contact@reign.webmodernseo.co · contact@reign.example | contact@divinexpress.fr |
| URL prod (`SITE_URL`, `NEXT_PUBLIC_SITE_URL`) | www.reign-example.com · reign.webmodernseo.co | https://divinexpress.fr |
| Nom du package (`package.json`) | reign | divinexpress |
| Fichier DB dev (`.env.example`, `client.ts`) | data/reign.db | data/divinexpress.db |
| Admin seed (`.env.example`) | admin@reign.local | admin@divinexpress.local |
| Persona IA (`agent.ts`, `rules.ts`) | assistant/équipe Reign | assistant/équipe DivinExpress |
| Produits (nom, gravure, patch — `products.ts`) | Reign | DivinExpress |
| Metadata `<title>`/description (`layout.tsx`) | Reign | DivinExpress |
| Fil d'Ariane JSON-LD (`page.tsx`, `produit/[slug]`) | Reign | DivinExpress |
| Email support admin (`LoginPanel.tsx`) | support@reign.com | support@divinexpress.fr |
| Email boutique (`parametres`, `settings` route) | contact@reign-store.com · contact@reign.webmodernseo.co | contact@divinexpress.fr |
| Préfixe SKU généré (`produits/page.tsx`) | REIGN- | DIVINEXPRESS- |
| Dossier Cloudinary (fixtures de test) | reign/products | divinexpress/products |

### Identifiants fonctionnels (clés de stockage / cookie)

Ta consigne « remplacer **tout** ce qui est pseudo reign » couvre aussi les
identifiants internes non visibles. Renommés :

| Identifiant | Avant | Après |
|---|---|---|
| localStorage panier (`CartContext`) | reign-cart | divinexpress-cart |
| localStorage favoris (`FavoritesContext`) | reign-favorites-v2 | divinexpress-favorites-v2 |
| localStorage devise (`CurrencyContext`) | reign-currency | divinexpress-currency |
| localStorage livraison (`CheckoutContext`) | reign-checkout-shipping | divinexpress-checkout-shipping |
| localStorage idempotence (`paiement/page.tsx`) | reign-checkout-idempotency | divinexpress-checkout-idempotency |
| localStorage cookies (`CookieBanner`) | reign-cookie-consent | divinexpress-cookie-consent |
| localStorage admin démo (`admin/repository.ts`) | reign:admin-demo:v1 | divinexpress:admin-demo:v1 |
| Cookie session admin (`auth/runtime.ts`) | reign_admin_session | divinexpress_admin_session |

**Effet de bord (nul en prod, site pas encore live) :** renommer ces clés
réinitialise les paniers/favoris de dev et invalide les sessions admin ouvertes
(re-login une fois). Les tests qui asservissent ces clés sont mis à jour en lockstep.

## Périmètre

### Dans le périmètre (à modifier)

- `messages/fr.json`, `messages/en.json` — nom, code promo, textes éditoriaux,
  mentions légales (Reign SAS), emails.
- `src/components/ui/Logo.tsx` — `alt` et `aria-label` seulement (chemin d'image conservé).
- `src/lib/seo.ts` — `SITE_URL`, nom `Organization` du JSON-LD (chemin du logo conservé).
- `src/lib/contactInfo.ts` — email, messages WhatsApp par défaut.
- `src/server/ai/agent.ts`, `src/server/ai/rules.ts` — persona/équipe.
- `src/lib/products.ts` — nom de produit + descriptions (gravure/patch).
- `src/server/db/client.ts` — chemin par défaut `file:./data/reign.db`.
- `.env.example` — `NEXT_PUBLIC_SITE_URL` (commentaire), `DATABASE_URL` par défaut,
  `SEED_ADMIN_EMAIL`.
- `package.json` — champ `name`.
- `src/app/[locale]/layout.tsx` — `title`/`description` metadata.
- `src/app/[locale]/page.tsx`, `src/app/[locale]/produit/[slug]/page.tsx` — fil d'Ariane JSON-LD.
- Composants d'affichage restants signalés par la recherche : `Footer`, `CookieBanner`,
  `LoginPanel`, `AdminSidebar`, `AdminShell`, pages dashboard
  (`produits`, `clients`, `commandes`, `parametres`), route `api/admin/settings`,
  `server/auth/runtime.ts`, `server/dashboard/queries.ts`, etc.
- Contexts et clés de stockage : `CartContext`, `FavoritesContext`, `CurrencyContext`,
  `CheckoutContext`, `app/[locale]/commande/paiement/page.tsx`, `lib/admin/repository.ts`
  (voir table « Identifiants fonctionnels »).
- **Les fichiers de test associés** (`*.test.ts(x)`) qui vérifient des chaînes « Reign »,
  mis à jour en lockstep.

### Hors périmètre (ne pas toucher)

- `docs/superpowers/plans/**`, `docs/superpowers/specs/**` (archives de planification).
- `HANDOFF.md`, `docs/audits/**`, `docs/autonomous-fullstack-handoff.md`,
  `docs/deploiement-o2switch.md`.
- `package-lock.json` (se régénère via `npm install` après le changement de `name`).
- **Assets images** : `public/branding/logo-reign*.png`,
  `public/image/reign-admin-hoodie.png` — noms de fichiers et visuels conservés
  (voir phase 3).

## Phasage

- **Phase 1 — Rebrand code/texte/config (maintenant).** Toutes les modifications
  ci-dessus. Vérification complète.
- **Phase 2 — Neon + Vercel (nécessite tes infos).** Côté Vercel : définir
  `DATABASE_URL` = chaîne Neon, `NEXT_PUBLIC_SITE_URL=https://divinexpress.fr`,
  `AUTH_SECRET`, `SEED_ADMIN_*`, providers paiement/email ; lancer `npm run db:setup`
  contre Neon ; pointer `divinexpress.fr` sur Vercel. Aucun code applicatif.
- **Phase 3 — Vrais logos (plus tard).** Remplacer `logo-reign*.png` par les fichiers
  DivinExpress fournis et aligner les chemins.

## Vérification

- `npm run test` — vert (suite complète Vitest).
- `rm -rf .next/dev && npm run typecheck` → 0 (l'artefact `.next/dev` d'un serveur dev
  corrompt le typecheck).
- `grep -ri reign src messages` — ne laisse que les résidus attendus : chemins
  d'images logo (`/branding/logo-reign.png`, `reign-admin-hoodie.png`).
- Contrôle visuel : nom « DivinExpress » dans le header (texte), footer, pages légales,
  page « À propos », code promo `DIVINEXPRESS10`.

## Risques / points d'attention

- **Logo visuel** encore « REIGN » jusqu'à la phase 3 — assumé et documenté.
- **Chemins d'images `reign`** volontairement conservés → apparaîtront dans le grep
  résiduel ; ce n'est pas une régression.
- **Tests en lockstep** : oublier de mettre à jour une assertion « Reign » ferait
  échouer la suite — chaque tâche modifie le code *et* son test ensemble.
- **`data/divinexpress.db`** : nouveau fichier dev vierge ; il faudra relancer
  `npm run db:setup` en local (l'ancien `data/reign.db` devient orphelin, sans impact).
