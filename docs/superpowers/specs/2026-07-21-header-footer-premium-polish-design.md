# DivinExpress — Sélecteur Langue/Devise, Icônes Sociales & Wordmark (Design Spec)

## Contexte
Le sélecteur de langue/devise du Header (`LocaleCurrencySelector`) repose sur des balises `<select>` HTML natives : le déclencheur est stylé, mais le panneau d'options ouvert par le navigateur reste l'UI native de l'OS (fond bleu système, pas de coins arrondis, aucune animation) — cf. capture fournie par l'utilisateur. Les icônes de réseaux sociaux (Header topbar et Footer) utilisent des tracés SVG dessinés à la main, dont certains ne sont pas fidèles au logo réel (le tracé "Facebook" ne ressemble pas au "f" de la marque). Le wordmark "DivinExpress" à côté du logo DX (Header et Footer) est en graisse 800 uniforme, sans traitement typographique particulier.

L'utilisateur souhaite un rendu "premium SaaS" (référence Framer, Webflow) pour ces trois éléments, sans changer leur comportement fonctionnel.

## Buts
1. Remplacer les `<select>` natifs par un dropdown custom entièrement stylable (langue + devise), tout en conservant le comportement actuel (changement de route i18n pour la langue, état local pour la devise).
2. Remplacer les tracés SVG des icônes Facebook/Instagram/TikTok (Header topbar + Footer) par des icônes propres et fidèles aux logos réels, en conservant le style ligne/outline monochrome et les traitements hover existants.
3. Affiner la typographie du wordmark "DivinExpress" (Header `.brandText`, Footer `.brandTitle`) : ajustement du tracking/graisse, palette noir/blanc inchangée (pas d'accent couleur).

## Hors périmètre
* Pas de logique de conversion de devise (le sélecteur de devise reste un état d'affichage, comme aujourd'hui).
* Pas de nouvelle dépendance npm (pas de librairie de composants ajoutée) — le dropdown est construit à la main, cohérent avec le reste du code base (aucune lib UI utilisée ailleurs).
* Pas de changement de la liste des réseaux sociaux (Facebook, Instagram, TikTok uniquement) ni des liens `href="#"` existants.

## Spécifications Techniques

### 1. Dropdown custom (`LocaleCurrencySelector`)
* **Emplacement** : `components/Header/LocaleCurrencySelector.tsx` + `.module.css` (réécriture, même export/props publiques : `locale`, `theme`, `className`).
* **Comportement** :
  * Composant interne réutilisable `Dropdown` (options, valeur sélectionnée, `onChange`, label ARIA) instancié deux fois (langue, devise).
  * Déclencheur : bouton (`<button type="button">`) reprenant le style actuel (texte + chevron SVG existant), `aria-haspopup="listbox"`, `aria-expanded`.
  * Panneau : `position: absolute`, `background: var(--color-white)`, `border-radius: var(--radius-md)`, `box-shadow: var(--shadow-popover)`, `border: var(--border-hairline)`.
  * Animation d'ouverture : `opacity` + `scale(0.96→1)` + léger `translateY`, durée `var(--duration-fast)`, easing `var(--ease-standard)`. Fermeture symétrique.
  * Chaque option (`role="option"`) : padding confortable, surlignage au survol (`var(--color-cream)`), item sélectionné avec coche (✓) et texte en `var(--color-brand-blue)`.
  * Fermeture : clic en dehors (listener `mousedown` global), touche `Échap`, sélection d'une option.
  * Clavier : `ArrowDown`/`ArrowUp` déplacent le focus/highlight entre options, `Enter` valide, `Échap` ferme et rend le focus au déclencheur.
  * Le changement de langue continue d'appeler `router.replace(pathname, { locale })`; le changement de devise continue de faire un simple `setState` local (comportement identique à l'existant).

### 2. Icônes sociales (Header + Footer)
* **Fichiers** : `components/Header/Header.tsx` (icônes topbar, 15px) et `components/Footer/Footer.tsx` (icônes badges circulaires, 20px).
* **Changement** : uniquement les attributs `<path>` (et `viewBox` si besoin) des trois icônes SVG (Facebook, Instagram, TikTok), remplacés par des tracés fidèles aux logos officiels, style outline/ligne (pas de remplissage plein), `stroke="currentColor"` conservé pour hériter des couleurs/hover actuels.
* Aucune modification des wrappers, tailles de conteneur, classes CSS ou logique de hover — uniquement la géométrie des icônes.

### 3. Wordmark "DivinExpress"
* **Fichiers** : `components/Header/Header.module.css` (`.brandText`) et `components/Footer/Footer.module.css` (`.brandTitle`).
* **Changement** : le texte affiché est déjà en capitales (`DIVINEXPRESS`, cf. `messages/fr.json` et `en.json`). Pour un rendu premium SaaS sur du texte tout en capitales, la graisse passe de `800` à `700` et le tracking s'ouvre légèrement (au lieu d'être resserré/négatif) :
  * Header `.brandText` : `font-weight: 700` (au lieu de 800), `letter-spacing: 0.04em` (au lieu de `-0.02em`). `font-size: 22px` inchangé.
  * Footer `.brandTitle` : `font-weight: 700` (au lieu de 800), `letter-spacing: 0.04em` (au lieu de `0.06em`, pour s'aligner avec le Header). `font-size: 20px` inchangé.
  * Couleurs inchangées (Header : `var(--color-black)` hérité ; Footer : `#ffffff`). Aucun changement de balisage HTML/JSX.

## Critères d'acceptation
1. Cliquer sur le sélecteur de langue ou de devise ouvre un panneau custom stylé (coins arrondis, ombre, animation), plus aucun rendu de `<select>` natif du navigateur.
2. Le panneau se ferme au clic extérieur, à la touche Échap, ou après sélection d'une option ; la sélection change bien la langue (redirection i18n) ou la devise affichée (label du bouton mis à jour).
3. Navigation clavier fonctionnelle (flèches, Entrée, Échap) sur les deux dropdowns.
4. Les icônes Facebook/Instagram/TikTok (Header topbar et Footer) sont visuellement reconnaissables et fidèles aux logos réels, sans changement de taille/emplacement/comportement hover.
5. Le wordmark "DivinExpress" a un tracking affiné visible dans le Header et le Footer, toujours en noir (Header) / blanc (Footer).
6. Aucune nouvelle dépendance npm ajoutée (`package.json` inchangé côté `dependencies`).
7. `npx tsc --noEmit` et `npm run lint` passent sans erreur.
8. Vérification visuelle manuelle sur `http://localhost:3000` en desktop. Sur mobile (≤768px), le comportement existant est inchangé : le sélecteur langue/devise et les icônes sociales de la topbar restent masqués (`display: none`), seules les icônes sociales du Footer et le wordmark restent visibles et doivent y être vérifiés également.
