# Reign — Note de passation

Document de passation généré le 2026-08-01. Résume l'état du projet pour qu'un autre développeur
puisse reprendre sans avoir à reconstituer le contexte depuis l'historique de conversation.

## Le projet

Reign est une boutique e-commerce de démonstration (mode premium) : Next.js 16 (App Router,
Turbopack), i18n complet FR/EN (`next-intl`), devise EUR/GBP, tunnel de commande invité (sans
compte), panier/favoris persistés côté client, pas de vrai backend/paiement (tout est simulé).

**Branche actuelle :** `feature/frontend-storefront`, 46 commits, jamais poussée (`git remote -v`
ne retourne rien — aucun remote configuré), jamais mergée dans `master`.

## Stack et commandes

```
npm run dev          # serveur de dev (Turbopack)
npm run build         # build de production
npm run start         # sert le build de production
npm run lint           # ESLint
npm run test            # vitest run
npm run test:watch       # vitest en mode watch
```

Node/Next 16.2.12, React 19, Tailwind v4, next-intl v4, Vitest v4, Testing Library.

### Pièges connus de cet environnement (Windows, ce poste précisément)

1. **Ne jamais lancer `npm run build` et `npm run dev` l'un après l'autre sans supprimer
   `.next/` entre les deux.** Les deux commandes écrivent dans le même dossier `.next/` ; les
   artefacts de build restants font planter le routing du serveur de dev (des routes entières
   renvoient 404, y compris des routes valides) ou déclenchent des erreurs internes de workers
   Turbopack (« Jest worker encountered N child process exceptions »). Rencontré plusieurs fois
   cette session. Remède : `rm -rf .next` puis relancer `npm run dev`.
2. **Le port 3000 peut être occupé par un tout autre projet sur cette machine** (une app avec
   NextAuth/next-auth, aucun rapport avec Reign — repéré via un cookie `authjs.*` et une
   redirection vers `/fr-fr`). Ne pas tuer ce process à l'aveugle. Utiliser un port dédié :
   `npm run dev -- -p 3210` (c'est le port utilisé en fin de session).
3. **`npx vitest run` seul peut être flaky sous charge** (plusieurs process Chrome/Node headless
   en parallèle) — erreur générique `Cannot read properties of undefined (reading 'config')` sur
   tous les fichiers de test simultanément. Ce n'est pas un vrai échec de test. Remède : fermer les
   process en trop (`tasklist | grep node`, `taskkill //PID <n> //F //T` — attention, `//T` tue
   tout l'arbre, y compris un serveur de dev qu'on voudrait garder) puis relancer avec
   `npx vitest run --no-file-parallelism`.

## État d'avancement

Le plan complet (30 tâches) est dans `docs/superpowers/plans/2026-07-30-reign-site-frontend.md`.
Le suivi tâche par tâche (ce qui a été revu, les écarts, les corrections) est dans
`.superpowers/sdd/2026-07-30-reign-site-frontend/` :
- `progress.md` — ledger résumé, une ligne par tâche
- `task-N-brief.md` / `task-N-report.md` — spec et rapport d'implémentation par tâche
- `batch1-notes.md` à `batch5-notes.md` — **très important** : arbitrages du contrôleur quand la
  maquette approuvée divergeait du code littéral du brief. Ces fichiers sont la source de vérité
  la plus fiable sur « ce qui a été vraiment validé » pour un composant donné — plus fiable que la
  mémoire auto d'un futur agent Claude, voir la mésaventure Footer ci-dessous.

**Les 30 tâches du plan sont marquées complètes.** Au-delà du plan, cette session a fait :
- Intégration de vrais logos de paiement (Stripe → Visa/Mastercard + PayPal, Genius Pay →
  Visa/Mastercard + Orange Money + Wave) sur la page paiement.
- Correctif navigation : route catch-all manquante sous `[locale]` (404 stylisé qui ne se
  déclenchait pas pour les URLs non appariées).
- Correctif bandeau cookies : recouvrait le CTA du formulaire de livraison sans espace réservé.
- Unification des tailles : Homme/Femme/Enfant utilisent maintenant le même référentiel de tailles
  lettres (XS→XXL) au lieu de l'ancien système par âge (4A/6A/8A…) pour Enfant ; l'âge est affiché
  en complément pour les produits Enfant.
- Complétion de `relatedProductIds` : 10 produits sur 16 n'avaient aucun article recommandé
  configuré, donc « Vous aimerez aussi » ne s'affichait jamais sur la majorité des fiches produit.

## ⚠️ Point non résolu : le Footer

Cette session a fait **trois allers-retours** sur `src/components/layout/Footer.tsx` avant que
l'utilisateur ne coupe court à la conversation. Chronologie, pour ne pas repartir de zéro :

1. Version d'origine (grille de liens texte, icônes sociales génériques 2 lettres) — l'utilisateur
   a signalé qu'elle ne correspondait pas à ce qui avait été validé.
2. Reconstruite (logo+tagline en haut, champ pilule, liste à chevrons, badges sociaux circulaires,
   encart « Paiements sécurisés ») à partir d'une mémoire auto décrivant une capture de référence
   collée par l'utilisateur dans une session antérieure — **rejetée** (« le footer est nul »).
3. Recherche de la source la plus fiable trouvée dans le repo : `batch1-notes.md` dit explicitement
   « maquette Footer approuvée sans changement structurel ». Revert vers la structure d'origine
   (juste les icônes sociales corrigées pour matcher le Header) — **rejetée aussi** (« non pas du
   tout »).
4. L'utilisateur a fini par décrire directement ce qu'il voulait : « disposition verticale sur
   mobile, logo mis en avant » — ce qui correspond à la version de l'étape 2. Restaurée
   (commit `47eacfa`), captures d'écran montrées (mobile + desktop), mais **l'utilisateur n'a
   jamais confirmé explicitement que cette dernière capture était la bonne** avant de dire
   « laisse tomber, fais un résumé ».

**État actuel du fichier committé :** la version « riche » (logo+tagline, pilule, chevrons,
badges circulaires, encart paiements) — c'est ce qui est sur le disque et commité en `47eacfa`.
Elle correspond à la description verbale la plus récente et directe de l'utilisateur, mais
**n'a pas reçu de confirmation finale explicite**. Premier réflexe recommandé en reprenant ce
projet : redemander confirmation visuelle à l'utilisateur avant de considérer ce fichier comme
clos.

**Leçon pour la suite (déjà consignée en mémoire auto, `feedback_check_sdd_notes_before_memory.md`
si tu y as accès) :** pour toute question de fidélité de design, vérifier `batch*-notes.md`
*et* redemander confirmation directe à l'utilisateur plutôt que de deviner à partir d'une
description mémorisée — les deux sources peuvent être fausses/périmées.

## Autres points en attente

- **Assets non intégrés, encore à la racine du repo (non trackés par git) :**
  `logo-reign-fd-blanc.png` / `logo-reign-fd-blanc copy.png` (doublons identiques au logo déjà en
  place dans `public/branding/`, aucune action requise), `logo-reign-fd-noir.png` (variante fond
  noir, non utilisée nulle part sur le site actuellement — pas de zone à fond sombre qui l'exige),
  `orange money.png`, `paypal.png`, `wave.png`, `visa/mastercard.png` (déjà copiés/intégrés dans
  `public/payment/` sous des noms propres, les originaux à la racine sont désormais redondants).
- **Photos produits non intégrées :** `public/image/image projet/` contient ~60 vraies photos
  (hommes/femmes/enfants/gadgets) qui ne correspondent PAS au catalogue actuel
  (`src/lib/products.ts`, 16 produits fictifs : vestes/chemises/robes/manteaux/accessoires cuir).
  Décision explicitement différée par l'utilisateur — voir la question posée et sa réponse
  « ne pas toucher au catalogue pour l'instant » plus haut dans la conversation. Si on reprend ce
  chantier, il faudra soit refondre le catalogue sur les photos dispo, soit clarifier à nouveau
  l'intention.
- **Pages légales (Tâche 27)** ont des champs placeholder (SIREN, adresse, hébergeur…) qui ne
  peuvent être remplis qu'avec de vraies informations d'entreprise.
- **`SITE_URL`** dans `src/lib/seo.ts` est un domaine placeholder (`reign-example.com`) — à changer
  avant toute mise en prod réelle (sitemap, canonical, hreflang, JSON-LD en dépendent tous).
- **31 problèmes ESLint préexistants**, documentés et volontairement différés (essentiellement
  `react-hooks/set-state-in-effect` dans les Context providers — pattern déjà en place avant cette
  session, jugé non bloquant par le contrôleur à l'époque). `npm run lint` doit stabiliser à ce
  chiffre ; si un futur changement fait grimper le total, c'est probablement une vraie régression.
- **Merge/PR :** la branche n'a jamais été proposée en revue. Le prochain jalon naturel est une
  revue de code avant fusion dans `master` (rien n'indique qu'une revue ait déjà eu lieu sur
  l'ensemble de la branche).

## Pour valider visuellement le site

```
rm -rf .next
npm run dev -- -p 3210
```
puis ouvrir `http://localhost:3210` (redirige vers `/fr`). Vérifier le port 3000 n'est pas
nécessairement libre sur cette machine (voir piège #2 ci-dessus).
