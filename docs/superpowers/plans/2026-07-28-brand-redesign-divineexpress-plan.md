# Brand Redesign: DivinExpress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename and restructure the static site in `Shammah 2.0/` to fully adapt it to the brand name `"DivinExpress"` (exactly one 'e' between 'n' and 'x') across all folder names, filenames, HTML texts, localstorage keys, promo codes, and SVG logo paths.

**Architecture:** We will first rename directories and file structures, then update references in HTML pages, next rename and refactor Javascript files and administrative scripts, and finally verify that the e-commerce SPA logic, shopping cart, and local database function correctly.

**Tech Stack:** HTML5, CSS3 (Vanilla), JavaScript (Vanilla ES6), LocalStorage.

## Global Constraints
- All fonts must be kept as `"Inter", sans-serif` as specified in CSS.
- No space and exactly one 'e' in the logo branding text: `"DivinExpress"`.
- Clés localStorage prefix must be `"DivinExpress_"`.
- Shorter codes for discounts: `DIVINE10` and `DIVINE15`.

---

### Task 1: Directory and Assets Restructuring

**Files:**
- Rename Directory: `Shammah 2.0/` $\rightarrow$ `DivinExpress/`
- Rename: `DivinExpress/css/shammah.css` $\rightarrow$ `DivinExpress/css/divinexpress.css`
- Rename: `DivinExpress/js/shammah.js` $\rightarrow$ `DivinExpress/js/divinexpress.js`
- Rename: `DivinExpress/images/logo-shammah.svg` $\rightarrow$ `DivinExpress/images/logo-divinexpress.svg`

**Interfaces:**
- Consumes: None (starting task)
- Produces: Renamed directory structure and updated SVG logo drawing a "D" emblem

- [ ] **Step 1: Rename the root directory and assets**
  Run in terminal:
  ```powershell
  Rename-Item -Path "c:/Users/monep/OneDrive/Desktop/Tous mes dossiers/PROJET WEB/DivinExpress/Shammah 2.0" -NewName "DivinExpress"
  Rename-Item -Path "c:/Users/monep/OneDrive/Desktop/Tous mes dossiers/PROJET WEB/DivinExpress/DivinExpress/css/shammah.css" -NewName "divinexpress.css"
  Rename-Item -Path "c:/Users/monep/OneDrive/Desktop/Tous mes dossiers/PROJET WEB/DivinExpress/DivinExpress/js/shammah.js" -NewName "divinexpress.js"
  Rename-Item -Path "c:/Users/monep/OneDrive/Desktop/Tous mes dossiers/PROJET WEB/DivinExpress/DivinExpress/images/logo-shammah.svg" -NewName "logo-divinexpress.svg"
  ```

- [ ] **Step 2: Update the SVG logo emblem to draw a "D"**
  Overwrite the content of `c:/Users/monep/OneDrive/Desktop/Tous mes dossiers/PROJET WEB/DivinExpress/DivinExpress/images/logo-divinexpress.svg` with:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="9" fill="#0f172a"/>
    <path d="M10 9h6c3.866 0 7 3.134 7 7s-3.134 7-7 7h-6V9zm2 2v10h4c2.761 0 5-2.239 5-5s-2.239-5-5-5h-4z" fill="#ffffff"/>
  </svg>
  ```

- [ ] **Step 3: Commit files**
  Run in terminal:
  ```bash
  git add "DivinExpress"
  git commit -m "refactor: rename Shammah folder and files to DivinExpress, update logo SVG to D glyph"
  ```

---

### Task 2: Update Main Storefront HTML Files

**Files:**
- Modify: `DivinExpress/index.html`
- Modify: `DivinExpress/legal.html`
- Modify: `DivinExpress/privacy.html`
- Modify: `DivinExpress/terms.html`

**Interfaces:**
- Consumes: Renamed directories and asset files from Task 1

- [ ] **Step 1: Replace Stylesheet, Script, and SVG paths in index.html, legal.html, privacy.html, terms.html**
  - In each HTML file, replace `css/shammah.css?v=2.4` with `css/divinexpress.css?v=2.4` (or similar link href).
  - Replace `js/shammah.js` with `js/divinexpress.js`.
  - Replace `images/logo-shammah.svg` with `images/logo-divinexpress.svg`.

- [ ] **Step 2: Update visible Branding Text**
  - In each file, change title tags from `<title>Shammah | ...</title>` or `<title>... - SHAMMAH</title>` to `<title>DivinExpress | ...</title>` or `<title>... - DivinExpress</title>`.
  - Change logo anchors `<a href="..." class="logo">SHAMMAH</a>` or `<a href="..." class="mobile-logo">SHAMMAH</a>` to `<a href="..." class="logo">DivinExpress</a>` or `<a href="..." class="mobile-logo">DivinExpress</a>`.
  - Change all textual mentions of "SHAMMAH" or "Shammah" in paragraph texts, copyright footers, policies and terms to "DivinExpress".
  - Change promo banner coupon text from `SHAMMAH15` to `DIVINE15` inside `index.html`.
  - Change section header sub-titles or promo titles like `OFFRE DE SAISON SHAMMAH` to `OFFRE DE SAISON DIVINEXPRESS`.

- [ ] **Step 3: Verify HTML layout visually / check links**
  Ensure that no tags or stylesheet paths are broken.

- [ ] **Step 4: Commit changes**
  Run:
  ```bash
  git add "DivinExpress/*.html"
  git commit -m "feat: update assets links, logo texts, and policy mentions to DivinExpress in HTML files"
  ```

---

### Task 3: Update Administration Panel HTML & CSS

**Files:**
- Modify: `DivinExpress/admin/index.html`
- Modify: `DivinExpress/admin/admin.css`

**Interfaces:**
- Consumes: Task 1 assets

- [ ] **Step 1: Update assets, title, and logo references in admin/index.html**
  - Replace logo SVG reference: `../images/logo-shammah.svg` $\rightarrow$ `../images/logo-divinexpress.svg`.
  - Replace text branding inside `<span class="top-nav-logo-text">SHAMMAH</span>` $\rightarrow$ `<span class="top-nav-logo-text">DivinExpress</span>`.
  - Replace title tag `<title>SHAMMAH - Dashboard Administration</title>` $\rightarrow$ `<title>DivinExpress - Dashboard Administration</title>`.
  - Replace placeholder text inside `promo-code` input if any.

- [ ] **Step 2: Update CSS Header Comment and Styles in admin/admin.css**
  - Change first line comment: `/* Shammah Admin Dashboard... */` $\rightarrow$ `/* DivinExpress Admin Dashboard... */`.

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add "DivinExpress/admin/index.html" "DivinExpress/admin/admin.css"
  git commit -m "feat: rename branding references in admin dashboard HTML and CSS"
  ```

---

### Task 4: Refactor Database & E-Commerce Logic (JavaScript)

**Files:**
- Modify: `DivinExpress/js/divinexpress.js`
- Modify: `DivinExpress/js/db.js`
- Modify: `DivinExpress/admin/js/ui-kit.js`
- Modify: `DivinExpress/admin/js/products.js`
- Modify: `DivinExpress/admin/js/dashboard.js`

**Interfaces:**
- Consumes: Task 1 and Task 2 renamed variables

- [ ] **Step 1: Update localStorage prefixes and database variables in js/divinexpress.js and js/db.js**
  - Replace `"shammah_cart"` $\rightarrow$ `"DivinExpress_cart"`.
  - Replace `"shammah_favorites"` $\rightarrow$ `"DivinExpress_favorites"`.
  - Replace `"shammah_db_categories"` $\rightarrow$ `"DivinExpress_db_categories"`.
  - Replace `"shammah_db_subcategories"` $\rightarrow$ `"DivinExpress_db_subcategories"`.
  - Replace `"shammah_db_products"` $\rightarrow$ `"DivinExpress_db_products"`.
  - Replace `"shammah_db_orders"` $\rightarrow$ `"DivinExpress_db_orders"`.
  - Replace `"shammah_db_promos"` $\rightarrow$ `"DivinExpress_db_promos"`.

- [ ] **Step 2: Rename Database class and window properties**
  - In `js/db.js`, rename class `ShammahDB` to `DivinExpressDB`.
  - Rename instantation `window.db = new ShammahDB()` to `window.db = new DivinExpressDB()`.

- [ ] **Step 3: Update Default Promo Codes and product titles in js/db.js**
  - Rename `SHAMMAH10` and `SHAMMAH15` codes in `DEFAULT_PROMO_CODES` to `DIVINE10` and `DIVINE15`.
  - Rename products: `"Polo Signature Shammah"` $\rightarrow$ `"Polo Signature DivinExpress"`.
  - Rename description: `"broderie minimaliste Shammah."` $\rightarrow$ `"broderie minimaliste DivinExpress."`.

- [ ] **Step 4: Update Toast alerts in js/divinexpress.js**
  - Replace `"Recherche de votre colis Shammah..."` $\rightarrow$ `"Recherche de votre colis DivinExpress..."`.
  - Replace `"Shammah : Une marque née..."` $\rightarrow$ `"DivinExpress : Une marque née..."`.
  - Replace `"lettre Shammah"` $\rightarrow$ `"lettre DivinExpress"`.

- [ ] **Step 5: Update admin scripts in admin/js/**
  - Replace localStorage keys `"shammah_admin_theme"` $\rightarrow$ `"DivinExpress_admin_theme"`.
  - Replace localStorage keys `"shammah_admin_sidebar_collapsed"` $\rightarrow$ `"DivinExpress_admin_sidebar_collapsed"`.
  - Replace references to db storage keys `shammah_db_products` to `DivinExpress_db_products`.
  - Replace CSV filename `rapport-shammah-` to `rapport-divinexpress-`.

- [ ] **Step 6: Commit changes**
  Run:
  ```bash
  git add "DivinExpress/js" "DivinExpress/admin/js"
  git commit -m "feat: refactor localStorage keys, database class, product names, and promo codes in JS files"
  ```

---

### Task 5: Refactor nested Next.js files (Optional Cleanup)

**Files:**
- Modify: `DivinExpress/nextjs/components/StorefrontShell.tsx`
- Modify: `DivinExpress/nextjs/app/legal/page.tsx`

**Interfaces:**
- Consumes: Brand naming conventions

- [ ] **Step 1: Replace SHAMMAH15 with DIVINE15 inside StorefrontShell.tsx**
  - Locate `SHAMMAH15` and change it to `DIVINE15`.

- [ ] **Step 2: Replace DivinExpress / Shammah with DivinExpress in page.tsx**
  - Change label text `DivinExpress / Shammah` to `DivinExpress`.

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add "DivinExpress/nextjs"
  git commit -m "cleanup: align branding names in nested nextjs subdirectory files"
  ```

---

### Task 6: Manual Verification

**Files:**
- Test: `DivinExpress/index.html`
- Test: `DivinExpress/admin/index.html`

- [ ] **Step 1: Start a local HTTP server**
  Run:
  ```bash
  npx serve DivinExpress -p 3000
  ```
  *(Or use Python if serve is not installed: `python -m http.server 3000 --directory DivinExpress`)*

- [ ] **Step 2: Open and test the storefront**
  - Open `http://localhost:3000/index.html`.
  - Verify that the title is `DivinExpress | Boutique Officielle`.
  - Verify that the logo in the top left displays `DivinExpress` in Inter font, and has the new SVG icon with a "D" emblem.
  - Test adding a product to the cart, opening the cart drawer, and verifying that the localStorage key `DivinExpress_cart` is populated.
  - Test applying code `DIVINE15` in the discount form and verify that the 15% discount is applied correctly.

- [ ] **Step 3: Open and test the admin dashboard**
  - Open `http://localhost:3000/admin/index.html`.
  - Verify the header logo displays `DivinExpress`.
  - Verify that dashboard orders load correctly and theme selector settings persist under `DivinExpress_admin_theme` key in localStorage.
