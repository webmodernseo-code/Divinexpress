# DivinExpress — Socle du Dashboard Admin (Auth + Shell) — Design Spec

## Contexte
Ceci est le premier sous-projet d'un dashboard e-commerce premium (inspiré de captures fournies par l'utilisateur : sidebar groupée, cartes de stats, tableaux de commandes/produits/clients/retours). Le projet complet couvre plusieurs sous-systèmes indépendants (produits, commandes, réductions, retours, clients, blog, paramètres) qui seront chacun brainstormés et implémentés séparément.

Ce sous-projet pose les fondations sans lesquelles aucune autre page admin n'est sécurisée ni intégrée visuellement : authentification et structure du dashboard (sidebar + layout).

État actuel du projet :
* Le modèle Prisma `Admin` (`id`, `email`, `passwordHash`, `role`, `createdAt`) existe déjà mais n'est utilisé nulle part — aucune page de connexion, aucune vérification de session.
* Aucune route `/admin` n'existe.
* `middleware.ts` ne gère que le routage i18n (`next-intl`), avec un matcher `['/', '/(fr|en)/:path*']` qui ne touche pas `/admin/*`.
* Le projet n'a aucune dépendance d'authentification (pas de NextAuth, pas de bcrypt) — seulement `next`, `next-intl`, `react`, `@prisma/client`.

## Buts
1. Permettre à l'admin (un seul compte) de se connecter via email + mot de passe sur `/admin/login`.
2. Protéger toutes les routes `/admin/*` (sauf `/admin/login`) : redirection vers la connexion si la session est absente ou invalide.
3. Fournir une structure de dashboard (sidebar groupée + topbar) reprenant l'esthétique noir/blanc premium déjà établie sur le site, avec des icônes SVG dessinées à la main (pas de librairie d'icônes).
4. Livrer une page "Vue d'ensemble" avec de vraies données (nombre de produits, nombre de commandes, commandes récentes) puisque ces modèles existent déjà.
5. Livrer des pages stub "Bientôt disponible" pour les sections dont les données n'existent pas encore (Commandes, Retours, Clients, Produits, Réductions, Articles de blog, Analytique, Messages, Paramètres), afin que la navigation soit complète dès maintenant.

## Hors périmètre
* Pas de gestion multi-comptes admin, pas de rôles différenciés (le champ `role` existe dans le modèle mais n'est pas exploité ici).
* Pas de récupération de mot de passe oublié, pas de limitation de tentatives de connexion (brute-force) — un seul compte, risque faible, à ajouter plus tard si besoin.
* Pas de contenu réel dans les pages stub — elles seront construites par leurs propres sous-projets.
* Pas de nouvelle dépendance npm (`dependencies` inchangé) — hashage et signature de session via le module `crypto` natif de Node, pas de `bcrypt`/`bcryptjs`/`next-auth`.

## Spécifications Techniques

### 1. Hashage du mot de passe et session signée (`lib/adminAuth.ts`)
* **Hashage** : `crypto.scryptSync(password, salt, 64)`, stocké dans `Admin.passwordHash` au format `"<saltHex>:<hashHex>"`.
  * `hashPassword(password: string): string`
  * `verifyPassword(password: string, storedHash: string): boolean` — recalcule le hash avec le sel stocké et compare avec `crypto.timingSafeEqual` (pas de comparaison de chaînes naïve).
* **Session** : cookie `admin_session`, valeur `"<adminId>.<expiresAtMs>.<signatureHex>"`.
  * `signature = HMAC-SHA256(secret, "<adminId>.<expiresAtMs>")` où `secret` vient de `process.env.ADMIN_SESSION_SECRET` (nouvelle variable d'environnement, ajoutée à `.env.example`; la vraie valeur va dans `.env`, qui est déjà entièrement ignoré par git).
  * `createSessionToken(adminId: string): string` — expiration à 7 jours.
  * `verifySessionToken(token: string): { adminId: string } | null` — vérifie la signature (`timingSafeEqual`) et l'expiration ; retourne `null` si invalide/expiré (jamais d'exception).
* Ces fonctions sont pures (pas de DB, pas de Next.js) → testables unitairement avec Vitest, cohérent avec les conventions existantes (`lib/*.test.ts`).

### 2. Middleware (`middleware.ts`, modifié)
* Le matcher couvre désormais aussi `/admin/:path*` en plus des routes existantes.
* Dans la fonction `middleware` :
  * Si `pathname` commence par `/admin` : logique d'auth uniquement (aucun traitement i18n). Si `pathname === '/admin/login'`, laisser passer. Sinon, lire le cookie `admin_session`, appeler `verifySessionToken` ; si invalide, rediriger vers `/admin/login`. Si valide, laisser passer.
  * Sinon (toutes les autres routes) : comportement actuel inchangé, délégué à `createMiddleware(...)` de `next-intl`.
* Aucun accès à la base de données dans le middleware (vérification de signature uniquement, stateless) — compatible edge runtime.

### 3. Connexion (`app/admin/login/page.tsx` + `app/admin/login/actions.ts`)
* Page de connexion simple (hors du groupe `[locale]`, uniquement en français) : logo, champ email, champ mot de passe, bouton "Se connecter", message d'erreur générique en cas d'échec ("Email ou mot de passe incorrect") — jamais préciser lequel des deux est faux.
* Server Action `login(formData: FormData)` :
  1. Cherche l'`Admin` par email (`prisma.admin.findUnique`).
  2. Si trouvé, vérifie le mot de passe avec `verifyPassword`.
  3. Si valide, pose le cookie via `cookies().set('admin_session', createSessionToken(admin.id), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/admin', maxAge: 60 * 60 * 24 * 7 })`, puis `redirect('/admin')`.
  4. Sinon, retourne un état d'erreur affiché sur le formulaire (pas de redirection).
* Déconnexion : `app/admin/logout/route.ts`, handler `POST` qui supprime le cookie (`cookies().delete('admin_session')`) et redirige vers `/admin/login`.

### 4. Shell du dashboard (`app/admin/(dashboard)/layout.tsx`)
* Route group `(dashboard)` pour que toutes les pages protégées partagent ce layout sans apparaître dans l'URL.
* Structure : sidebar fixe à gauche (logo DX + "DIVINEXPRESS", nav groupée, bouton déconnexion en bas) + zone de contenu à droite.
* Nav groupée (icônes SVG ligne, style cohérent avec le reste du site — `stroke="currentColor"`) :
  * **Boutique** : Vue d'ensemble (`/admin`), Commandes (`/admin/commandes`), Retours (`/admin/retours`), Clients (`/admin/clients`)
  * **Catalogue** : Produits (`/admin/produits`), Réductions (`/admin/reductions`), Articles de blog (`/admin/blog`)
  * **Suivi** : Analytique (`/admin/analytique`), Messages (`/admin/messages`)
  * **Paramètres** (`/admin/parametres`), épinglé en bas, hors groupes
* Item actif : pastille noire pleine avec texte blanc (repris des captures), déterminé via le pathname courant (`usePathname`).
* Palette et tokens : réutilise `var(--color-black)`, `var(--color-white)`, `var(--color-cream)`, `var(--radius-md)`, `var(--shadow-card)`, `var(--font-sans)` — aucune nouvelle couleur.

### 5. Vue d'ensemble (`app/admin/(dashboard)/page.tsx`)
* Contenu réel (pas de placeholder) :
  * Nombre total de produits (`prisma.product.count()`)
  * Nombre total de commandes (`prisma.order.count()`)
  * Les 5 commandes les plus récentes (`prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })`) affichées dans un tableau simple (numéro, email client, statut, total, date)
* Pas de graphique ni de cartes de tendance ("+12.3%", etc.) à ce stade — nécessite un historique de données que le sous-projet Commandes n'a pas encore construit.

### 6. Pages stub (`app/admin/(dashboard)/{commandes,produits,reductions,retours,clients,blog,analytique,messages,parametres}/page.tsx`)
* Un seul composant partagé `components/Admin/ComingSoon.tsx` (titre + message "Cette section arrive bientôt.") réutilisé par chaque page stub — évite la duplication.

### 7. Seed du compte admin (`prisma/seed.ts`, modifié)
* À la fin du script existant, ajoute un upsert :
  ```typescript
  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (adminEmail && adminPassword) {
    await prisma.admin.upsert({
      where: { email: adminEmail },
      update: { passwordHash: hashPassword(adminPassword) },
      create: { email: adminEmail, passwordHash: hashPassword(adminPassword), role: 'admin' }
    });
  }
  ```
* `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` sont lus depuis `.env` (jamais commités). Si absents, le seed catalogue continue de fonctionner normalement sans toucher au compte admin (pas d'erreur bloquante).
* `.env.example` reçoit deux nouvelles lignes commentées : `ADMIN_SESSION_SECRET=` et les deux variables de seed, avec une note explicative.

## Critères d'acceptation
1. Visiter une route `/admin/*` (autre que `/admin/login`) sans session valide redirige vers `/admin/login`.
2. Se connecter avec le bon email/mot de passe redirige vers `/admin` et affiche le shell du dashboard.
3. Se connecter avec un mauvais mot de passe affiche un message d'erreur générique, reste sur `/admin/login`, ne pose pas de cookie.
4. Une fois connecté, la sidebar affiche les 3 groupes + Paramètres avec les bonnes icônes ; l'item correspondant à la page actuelle est visuellement actif (pastille noire).
5. "Vue d'ensemble" affiche le vrai nombre de produits et de commandes de la base, plus les 5 commandes les plus récentes.
6. Chaque autre lien de la sidebar mène à une page stub "Bientôt disponible" avec le même habillage (pas de 404).
7. Le bouton de déconnexion supprime le cookie et redirige vers `/admin/login` ; retenter d'accéder à `/admin` redirige de nouveau vers la connexion.
8. Le site public (`/fr`, `/en`, etc.) continue de fonctionner exactement comme avant — aucune régression du routage i18n.
9. `hashPassword`/`verifyPassword`/`createSessionToken`/`verifySessionToken` sont couverts par des tests Vitest unitaires (cas valides et invalides, y compris token expiré et signature altérée).
10. Aucune nouvelle dépendance dans `package.json` (`dependencies` inchangé). `npx tsc --noEmit` et `npm run lint` passent sans erreur.
