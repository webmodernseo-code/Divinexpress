# Reign — Dashboard full-stack + Messagerie WhatsApp IA — Design & Audit

Date : 2026-08-07
Branche : `feature/frontend-storefront`
Mode : autonome (décisions validées en amont, livraison en commits incrémentaux)

## Décisions cadrées avec le propriétaire

1. **Moteur de l'agent IA** : Claude (Anthropic). Intégration via `ANTHROPIC_API_KEY` dans l'environnement, avec **repli automatique sur des règles** si la clé est absente ou l'appel échoue.
2. **Autonomie de l'agent** : **conseiller commercial en lecture seule**. Il informe (commandes, suivi, tailles, produits, politique), oriente vers l'achat, capture les coordonnées, et passe la main à un humain. Il n'écrit jamais dans les commandes/retours.
3. **Bascule IA ↔ humain** : l'IA répond automatiquement ; l'admin voit toutes les conversations dans le dashboard et peut **reprendre la main** à tout moment (l'IA se met en pause sur ce fil).
4. **Livraison** : commits incrémentaux sur la branche, avec `typecheck` + tests ciblés à chaque palier. Le build de production reste un *gate* documenté (il stalle sous OneDrive).

---

## Partie 1 — Audit : bugs, anomalies, points à améliorer

### Sécurité / correction

- **A1. Fuite de secret en log** — `connexion/actions.ts` imprime email + mot de passe en clair via `console.log` à chaque login. → Supprimer les logs de debug.
- **A2. Webhook WhatsApp non authentifié** — aucune vérification de la signature Meta `X-Hub-Signature-256`. N'importe qui peut poster de faux messages. → Vérifier le HMAC SHA-256 avec `WHATSAPP_APP_SECRET`.
- **A3. Pas d'idempotence sur les messages entrants** — Meta re-livre les webhooks ; le même message peut être inséré/traité plusieurs fois. → Dédupliquer sur `wa_message_id` (unique).
- **A4. Traitement synchrone avant le 200** — l'appel IA + envoi bloquent la réponse au webhook, risque de timeout/retries Meta. → Accuser réception vite, traiter ensuite.
- **A5. Effets de bord dans un GET** — `api/admin/returns` GET **insère des données de démo en base**. Un GET doit être en lecture seule. → Déplacer le seed de démo dans `seed.ts` (dev uniquement).

### Modèle de données / architecture

- **A6. Messagerie à plat** — une seule table `contact_messages` où la *direction* est devinée par `subject === 'Reply from Admin'` et le *canal* par la présence d'un `@`. Impossible d'y greffer proprement « IA auto + reprise humaine », ni de distinguer IA vs humain. → Nouveau modèle `conversations` + `messages`.
- **A7. Réponse IA fantôme sur le formulaire de contact** — `/api/contact` génère une « réponse IA » stockée en base mais **jamais délivrée** au client (pas d'email). Trompeur. → Sur le canal web/email : stocker le message + produire un **brouillon IA** pour l'admin.
- **A8. Duplication + `db: any`** — logique IA dupliquée dans `contact/route.ts` et `webhooks/whatsapp/route.ts`, paramètre `db: any`. → Module IA unique et typé.
- **A9. Migrations non évolutives** — `migrate.ts` est codé en dur pour la seule migration `0001_initial`. → Rendre l'application des migrations itérative et ordonnée.
- **A10. Timestamps cross-DB** — `new Date(created_at + 'Z')` suppose le format SQLite ; l'adaptateur PG renvoie autre chose. → Normaliser dans le repository.

### Couverture fonctionnelle du dashboard

- **A11. Commandes** — endpoint en lecture seule ; **aucune mutation de statut** ni saisie de suivi. → `PATCH /api/admin/orders`.
- **A12. Retours** — mutation présente mais pas de workflow de remboursement (la table `refunds` existe et n'est pas utilisée).
- **A13. Clients** — lecture seule, pas de fiche détaillée.
- **A14. UI messagerie en dur** — badge « 8 » non lues, « Assigner à Jean », timeline « 8 mai », tags « VIP » codés en dur. → Données réelles ou retrait.
- **A15. Lint** — `any[]` dans `products/[id]/route.ts`.
- **A16. `.env.example`** — variables Anthropic + WhatsApp manquantes.

---

## Partie 2 — Design cible

### 2.1 Modèle de données messagerie (migration `0002`)

```
conversations
  id TEXT PK
  channel TEXT CHECK (channel IN ('whatsapp','email','web'))
  external_id TEXT            -- téléphone (E.164 normalisé) ou email ; clé métier
  customer_id TEXT NULL REFERENCES customers(id)
  display_name TEXT
  status TEXT CHECK (status IN ('open','pending','resolved')) DEFAULT 'pending'
  ai_enabled INTEGER DEFAULT 1        -- 0 = un humain a repris la main
  unread_count INTEGER DEFAULT 0
  last_message_at TEXT
  last_message_preview TEXT
  created_at, updated_at
  UNIQUE(channel, external_id)

messages
  id TEXT PK
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE
  direction TEXT CHECK (direction IN ('inbound','outbound'))
  author TEXT CHECK (author IN ('customer','ai','admin','system'))
  admin_id TEXT NULL REFERENCES admin_users(id)
  body TEXT
  wa_message_id TEXT NULL UNIQUE      -- dédup Meta
  status TEXT CHECK (status IN ('received','draft','sent','delivered','read','failed')) DEFAULT 'sent'
  created_at
```

`contact_messages` est conservée (compatibilité) mais n'est plus la source de vérité de la messagerie.

Repository : `src/server/messaging/repository.ts` — `upsertConversation`, `addMessage` (dédup `wa_message_id`), `listConversations`, `getThread`, `setAiEnabled`, `setStatus`, `markRead`, `countUnread`.

### 2.2 Agent IA commercial — `src/server/ai/agent.ts`

- Interface `generateReply({ channel, customer, order, history, message, locale }) => { text, handoff }`.
- **Contexte injecté** (pas de tool-calling en lecture seule) : faits marque (Reign, streetwear premium, sweat YAHWEH, retours 14 j, transporteurs), contexte client (nom, dernière commande + suivi), historique récent.
- **Claude** via `fetch` sur l'API Messages (modèle par défaut à confirmer dans la skill `claude-api`), clé `ANTHROPIC_API_KEY`.
- **Garde-fous** (system prompt) : ne jamais inventer de données de commande, ne jamais promettre d'action non confirmée, répondre dans la langue du client, proposer le passage à un humain sur les cas sensibles (litige, remboursement contesté).
- **Repli** : si pas de clé ou erreur API → moteur de règles (logique actuelle consolidée). Dégrade proprement, jamais d'échec bloquant.

### 2.3 Flux WhatsApp — `src/app/api/webhooks/whatsapp/route.ts`

`GET` : vérification Meta (inchangé). `POST` :
1. Vérifier signature `X-Hub-Signature-256`.
2. Parser messages + statuses.
3. Pour chaque message texte : normaliser le téléphone, `upsertConversation`, `addMessage(inbound, customer)` dédupliqué.
4. Si `ai_enabled` : `generateReply`, `addMessage(outbound, ai)`, `sendWhatsAppMessage`. Sinon, juste incrémenter `unread`.
5. Répondre `200` rapidement.

### 2.4 API dashboard messagerie — `src/app/api/admin/messages/route.ts`

Réécrite sur le modèle conversation : `GET` liste + thread, `POST` réponse humaine (met `ai_enabled=0`, envoie via WhatsApp si canal WhatsApp), `PATCH` statut + toggle IA. `sidebar-badges` compte via `conversations`.

### 2.5 UI messagerie — `messages/page.tsx`

Inbox unifiée réelle, distinction visuelle client / IA / admin, **interrupteur « IA activée »** par conversation (reprise humaine), envoi, marquer résolu, polling léger. Retrait des éléments en dur.

### 2.6 Reste du dashboard full-stack

- **Commandes** : `PATCH /api/admin/orders` (transition de statut validée par `order-status.ts`, capture transporteur/suivi → `shipments`). Câblage page.
- **Retours** : workflow approbation/refus + remboursement (table `refunds`), retrait du seed du GET. Câblage page.
- **Clients** : fiche détaillée (commandes, adresses). Câblage page.
- **Produits / Paramètres / Inventaire** : consolidation, correction lint.

---

## Partie 3 — Plan de livraison (lots)

- **Lot A — Fondations** : `migrate.ts` itératif, migration `0002`, repository messagerie, fix logs login (A1), `.env.example` (A16).
- **Lot B — IA + WhatsApp** : agent IA Claude + repli, webhook (A2/A3/A4), `/api/contact` (A7), API messages, sidebar-badges.
- **Lot C — UI messagerie** : refonte `messages/page.tsx` (A14).
- **Lot D — Reste dashboard** : commandes (A11), retours (A5/A12), clients (A13), lint (A15).
- **Lot E — Vérification** : tests ciblés (repo messagerie, repli IA, transitions commandes) + `typecheck`.

Chaque lot = un commit, `typecheck` + tests ciblés verts. Build prod = gate documenté.

## Entrées propriétaire requises (non bloquantes)

- `ANTHROPIC_API_KEY` (sinon repli règles).
- Compte Meta WhatsApp Business : `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`.
- Sans ces identifiants, tout le code fonctionne et se teste ; seule la connexion live à WhatsApp reste inactive.
