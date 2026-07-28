# Spécification de Conception : Refonte de la Marque - DivinExpress

Cette spécification détaille la restructuration et le renommage complet du projet statique **Shammah 2.0** en **DivinExpress**, afin de refléter la nouvelle identité de marque sur l'ensemble de la structure physique (fichiers/dossiers), de l'interface utilisateur, de la logique applicative et du stockage local.

## Renseignements Généraux

* **Date** : 28 Juillet 2026
* **Sujet** : Alignement de marque de Shammah vers DivinExpress (une seule lettre "e" entre le "n" et le "x", ex: **DivinExpress**)
* **Statut** : Approuvé par le client

---

## 1. Restructuration Physique (Fichiers et Dossiers)

Afin d'éliminer toute trace de l'ancien nom dans les chemins d'accès et les importations, les renommages suivants seront appliqués :

* **Dossier racine du site** : `Shammah 2.0/` $\rightarrow$ `DivinExpress/`
* **Feuille de style principale** : `css/shammah.css` $\rightarrow$ `css/divinexpress.css`
* **Script logique principal** : `js/shammah.js` $\rightarrow$ `js/divinexpress.js`
* **Icône/Logo SVG** : `images/logo-shammah.svg` $\rightarrow$ `images/logo-divinexpress.svg`

### Mise à jour du fichier Logo SVG
Le logo SVG dessine actuellement un "S". Il sera mis à jour pour dessiner un "D" majuscule minimaliste blanc sur fond noir/bleu foncé (`#0f172a`) :
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="9" fill="#0f172a"/>
  <path d="M10 9h6c3.866 0 7 3.134 7 7s-3.134 7-7 7h-6V9zm2 2v10h4c2.761 0 5-2.239 5-5s-2.239-5-5-5h-4z" fill="#ffffff"/>
</svg>
```

---

## 2. Refactorisation de l'Interface Utilisateur (Textes et Liens)

Dans l'ensemble des fichiers HTML (`index.html`, `legal.html`, `privacy.html`, `terms.html` et `admin/index.html`) :

1. **Mise à jour des liens d'actifs** :
   * Remplacement de `css/shammah.css` par `css/divinexpress.css`.
   * Remplacement de `js/shammah.js` par `js/divinexpress.js`.
   * Remplacement de `images/logo-shammah.svg` par `images/logo-divinexpress.svg`.
2. **Branding et Logos UI** :
   * Le texte du logo principal (`SHAMMAH`) sera remplacé par `DivinExpress` (sans espace, avec majuscules D et E, avec la police Inter sans-serif existante).
   * Le titre des pages `<title>Shammah | ...</title>` sera mis à jour en `<title>DivinExpress | ...</title>`.
   * Le texte des mentions légales, politiques de confidentialité et conditions générales de vente sera purgé de toute mention à "SHAMMAH" au profit de "DivinExpress".

---

## 3. Logique Applicative et Stockage Local

Dans les scripts JavaScript (`js/divinexpress.js`, `js/db.js` et les scripts d'administration dans `admin/js/`) :

1. **LocalStorage Keys** :
   Les données persistées sur le navigateur de l'utilisateur utiliseront le préfixe de la nouvelle marque :
   * `shammah_cart` $\rightarrow$ `DivinExpress_cart`
   * `shammah_favorites` $\rightarrow$ `DivinExpress_favorites`
   * `shammah_db_categories` $\rightarrow$ `DivinExpress_db_categories`
   * `shammah_db_products` $\rightarrow$ `DivinExpress_db_products`
   * `shammah_db_orders` $\rightarrow$ `DivinExpress_db_orders`
   * `shammah_db_promos` $\rightarrow$ `DivinExpress_db_promos`
   * `shammah_admin_theme` $\rightarrow$ `DivinExpress_admin_theme`
   * `shammah_admin_sidebar_collapsed` $\rightarrow$ `DivinExpress_admin_sidebar_collapsed`
2. **Objets et Classes JS** :
   * La classe de base de données locale `class ShammahDB` sera renommée en `class DivinExpressDB`.
   * L'instance globale `window.db = new ShammahDB()` sera mise à jour en `window.db = new DivinExpressDB()`.
3. **Notifications utilisateur** :
   * Les toasts utilisateur comme `"Recherche de votre colis Shammah..."` afficheront `"Recherche de votre colis DivinExpress..."`.

---

## 4. Données et Codes Promotionnels (`js/db.js`)

1. **Codes Promotionnels par défaut** :
   * `SHAMMAH10` $\rightarrow$ `DIVINE10`
   * `SHAMMAH15` $\rightarrow$ `DIVINE15`
2. **Noms de Produits** :
   * `"Polo Signature Shammah"` $\rightarrow$ `"Polo Signature DivinExpress"`
   * Description de la casquette contenant `"broderie minimaliste Shammah."` $\rightarrow$ `"broderie minimaliste DivinExpress."`
