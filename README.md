# DivinExpress

E-commerce de vêtements — paiement carte bancaire + Afrique de l'Ouest, dashboard admin.
Domaine cible : divinexpress.fr.

## Stack

- Next.js 14 (App Router) + TypeScript, déployé sur Vercel
- Tokens CSS du design system DivinExpress (pas de Tailwind)
- PostgreSQL (Neon) + Prisma
- i18n : `next-intl`, locales `fr` (défaut) et `en`, toujours préfixées

## Démarrage local

1. Copier `.env.example` en `.env` et renseigner `DATABASE_URL` (connexion Neon).
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Appliquer les migrations et le seed :
   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```
4. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```
   Le site est disponible sur http://localhost:3000/fr et http://localhost:3000/en.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` / `npm run start` — build et exécution en production
- `npm run lint` — ESLint
- `npm run db:migrate` — migrations Prisma
- `npm run db:seed` — seed de la base

## Design system

Source : `Design système ecommerce Divinexpress/_ds/`. Les tokens sont copiés dans `app/styles/tokens/`.
