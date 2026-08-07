# Déploiement — o2switch (reign.webmodernseo.co)

Guide de mise en production de Reign (Next.js 16) sur l'hébergement mutualisé o2switch (cPanel + Passenger), avec la messagerie WhatsApp IA.

## 0. Décisions clés

- **Domaine** : `https://reign.webmodernseo.co`
- **Base de données** : **Postgres managé (Neon recommandé)**. o2switch fournit MySQL/MariaDB, or l'app utilise SQLite (dev) ou Postgres (prod, via `@neondatabase/serverless`, qui se connecte à Neon par-dessus HTTPS — indépendant de l'hébergeur). ⚠️ Ne pas utiliser SQLite en prod mutualisée (concurrence + persistance fragile).
- **Node** : le pilote sqlite (`node:sqlite`) est désormais chargé **paresseusement** ; l'app démarre donc en Postgres même si la version Node d'o2switch ne fournit pas `node:sqlite`. Prends la version Node la plus récente proposée par le sélecteur cPanel (≥ 20).

## 1. Base de données (Neon)

1. Crée un projet Postgres gratuit sur https://neon.tech.
2. Récupère la chaîne de connexion `postgres://user:password@host/db?sslmode=require`.
3. Elle servira de `DATABASE_URL` (étape 4).

## 2. DNS / sous-domaine

Dans cPanel → **Sous-domaines**, crée `reign` sur `webmodernseo.co` pointant vers un dossier dédié (ex. `~/apps/reign`). Le certificat SSL (Let's Encrypt AutoSSL) doit être actif — le webhook Meta exige **HTTPS**.

## 3. Build

Recommandé : build en local / CI (le build stalle sous OneDrive) puis upload.

Ajoute à `next.config` (recommandé pour l'auto-hébergement) :

```js
// next.config.(js|ts)
const nextConfig = { output: 'standalone' /* …reste de la config… */ };
```

Puis :

```bash
npm ci
npm run build
```

Uploade sur le serveur : `.next/standalone/`, `.next/static/` (dans `.next/standalone/.next/static/`), `public/`, et le dossier `messages/`.

## 4. Application Node (cPanel → Setup Node.js App)

- **Application root** : `apps/reign`
- **Application URL** : `reign.webmodernseo.co`
- **Application startup file** : `server.js` (celui généré par `output: 'standalone'`, à la racine de `.next/standalone/`)
- **Node version** : la plus récente disponible (≥ 20)

Puis, dans l'interface, ajoute les **variables d'environnement** :

```
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://reign.webmodernseo.co
DATABASE_URL=postgres://user:password@host/db?sslmode=require
AUTH_SECRET=<32+ octets aléatoires>
SEED_ADMIN_EMAIL=<ton email admin>
SEED_ADMIN_PASSWORD=<mot de passe fort>

# Paiement / e-mail (adapter selon fournisseur retenu)
PAYMENT_PROVIDER=development
EMAIL_PROVIDER=development

# Agent IA Claude
ANTHROPIC_API_KEY=<clé du compte Anthropic>
AI_AGENT_MODEL=claude-opus-5
AI_AGENT_ENABLED=true

# WhatsApp Business Cloud API (Meta)
WHATSAPP_VERIFY_TOKEN=<jeton que TU choisis>
WHATSAPP_ACCESS_TOKEN=<token permanent Meta>
WHATSAPP_PHONE_NUMBER_ID=<id du numéro>
WHATSAPP_APP_SECRET=<app secret Meta>
WHATSAPP_GRAPH_VERSION=v21.0
WHATSAPP_BUSINESS_NUMBER=+33753741030

# Transcription des notes vocales (Claude ne transcrit pas l'audio — voir note)
STT_API_KEY=<clé Groq ou OpenAI, optionnel>
STT_BASE_URL=https://api.groq.com/openai/v1
STT_MODEL=whisper-large-v3-turbo
```

> ⚠️ **La clé `ANTHROPIC_API_KEY` se met UNIQUEMENT ici (variables d'env cPanel), jamais dans le code ni dans le dépôt git.**

## 5. Migrations (une fois, puis à chaque évolution du schéma)

Depuis un terminal SSH cPanel, dans le dossier de l'app, avec `DATABASE_URL` pointant sur Neon :

```bash
npm run db:migrate
```

Ne **PAS** exécuter `db:seed` en production (le seed insère des données de démo, dev-only).

Crée le compte admin de prod (le seed dev ne tourne pas en prod) : soit via un script d'amorçage admin, soit en insérant l'admin manuellement (email + hash scrypt).

## 6. Webhook WhatsApp (Meta / developers.facebook.com)

Dans l'app Meta → WhatsApp → Configuration :

- **Callback URL** : `https://reign.webmodernseo.co/api/webhooks/whatsapp`
- **Verify token** : la valeur de `WHATSAPP_VERIFY_TOKEN`
- **Champs à souscrire** : `messages`
- Renseigne l'**App Secret** dans `WHATSAPP_APP_SECRET` (signature vérifiée par le webhook).

Meta appelle le `GET` de vérification ; s'il répond 200 avec le challenge, l'abonnement est validé. Ensuite les messages entrants arrivent en `POST` (signés).

## 7. Vérifications post-déploiement

- `https://reign.webmodernseo.co` répond en HTTPS.
- Connexion au dashboard avec le compte admin.
- Envoi d'un message WhatsApp au numéro business → réponse automatique de l'agent IA (en FR/EN selon la langue) et apparition de la conversation dans le dashboard.
- Note vocale (si `STT_API_KEY` configurée) → transcrite et répondue ; sinon message « écrivez / refaites une note claire ».

## Notes

- **Claude et l'audio** : l'API Anthropic n'accepte pas l'audio en entrée. La transcription des notes vocales passe donc obligatoirement par un service STT (Groq/OpenAI). La *compréhension et la réponse* restent faites par Claude à partir du texte transcrit.
- **Synchro produit → site** : encore bloquée par l'absence de stockage d'images (voir le plan produit). Non lié au déploiement.
