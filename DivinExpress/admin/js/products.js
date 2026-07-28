(function () {
  "use strict";

  let variantEditorHandle = null;
  let editingProduct = null;
  let drawerKeydownHandler = null;

  function getCategorySuggestedSizes(categorySlug) {
    if (categorySlug === "gadget") return ["Taille Unique"];
    if (categorySlug === "enfant") return ["2 ans", "4 ans", "6 ans", "8 ans"];
    return ["S", "M", "L", "XL"];
  }

  function computeProductStock(variants) {
    let total = 0;
    variants.forEach(v => {
      Object.keys(v.sizesStock || {}).forEach(sz => { total += parseInt(v.sizesStock[sz], 10) || 0; });
    });
    return total;
  }

  // ---------- Inventory table ----------
  function loadInventoryList() {
    const tbody = document.getElementById("inventory-list-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const products = window.db.getProducts();
    let needsPersist = false;

    products.forEach(p => {
      p.sizes = (p.sizes && p.sizes.length) ? p.sizes : ["S", "M", "L", "XL"];
      p.variants.forEach(v => {
        if (!v.sizesStock) {
          v.sizesStock = {};
          const defaultStock = v.stock !== undefined ? v.stock : (p.stock !== undefined ? p.stock : 10);
          const share = Math.max(0, Math.floor(defaultStock / p.sizes.length));
          p.sizes.forEach((sz, idx) => {
            v.sizesStock[sz] = (idx === p.sizes.length - 1) ? (defaultStock - share * (p.sizes.length - 1)) : share;
          });
          needsPersist = true;
        }
      });
      p.stock = computeProductStock(p.variants);
    });

    if (needsPersist) localStorage.setItem("DivinExpress_db_products", JSON.stringify(products));

    products.forEach(p => {
      const tr = document.createElement("tr");
      let stockStatus = '<span class="badge-status success"><span class="bullet-dot"></span> OK</span>';
      if (p.stock < 3) stockStatus = '<span class="badge-status danger"><span class="bullet-dot"></span> Stock Faible</span>';

      let inlineStocksHTML = '<div class="inventory-inline-stocks">';
      p.variants.forEach(v => {
        p.sizes.forEach(sz => {
          const qty = (v.sizesStock && v.sizesStock[sz] !== undefined) ? v.sizesStock[sz] : 0;
          inlineStocksHTML +=
            '<div class="inventory-inline-stock-row">' +
              '<span class="inventory-inline-stock-label"><span class="color-badge-dot" style="background-color:' + v.color + ';"></span>' + v.name + ' (' + sz + ')</span>' +
              '<input type="number" value="' + qty + '" min="0" class="inventory-inline-stock-input" data-product="' + p.id + '" data-color="' + v.name + '" data-size="' + sz + '">' +
            '</div>';
        });
      });
      inlineStocksHTML += "</div>";

      const promoBadgeHTML = p.promoCode ? '<span class="badge-status info inventory-promo-badge">Promo : ' + p.promoCode + '</span>' : "";

      tr.innerHTML =
        '<td><div class="inventory-product-cell"><img src="../' + p.image + '" alt=""><div>' +
          '<span class="inventory-product-title"></span>' +
          '<span class="inventory-product-price"></span>' + promoBadgeHTML +
        '</div></div></td>' +
        '<td class="inventory-category-cell"></td>' +
        '<td class="inventory-stock-cell">' + inlineStocksHTML + '<div class="inventory-stock-total"><span></span>' + stockStatus + '</div></td>' +
        '<td class="inventory-actions-cell"><button class="btn-secondary" data-action="edit" data-id="' + p.id + '">Modifier</button> <button class="btn-danger" data-action="delete" data-id="' + p.id + '">Supprimer</button></td>';

      tr.querySelector(".inventory-product-cell img").alt = p.title;
      tr.querySelector(".inventory-product-title").textContent = p.title;
      tr.querySelector(".inventory-product-price").textContent = "Prix : " + window.formatPrice(p.price);
      tr.querySelector(".inventory-category-cell").textContent = p.categories[0];
      tr.querySelector(".inventory-stock-total span").textContent = "Total : " + p.stock;

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".inventory-inline-stock-input").forEach(input => {
      input.addEventListener("change", () => updateVariantSizeStock(input.dataset.product, input.dataset.color, input.dataset.size, input.value));
    });
    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => btn.addEventListener("click", () => openEditDrawer(btn.dataset.id)));
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener("click", () => handleDeleteProduct(btn.dataset.id)));
  }

  function updateVariantSizeStock(productId, colorName, size, newQty) {
    const products = window.db.getProducts();
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    const v = p.variants.find(varObj => varObj.name === colorName);
    if (!v) return;

    v.sizesStock = v.sizesStock || {};
    (p.sizes || []).forEach(sz => { if (v.sizesStock[sz] === undefined) v.sizesStock[sz] = 0; });
    v.sizesStock[size] = Math.max(0, parseInt(newQty, 10) || 0);
    v.stock = Object.keys(v.sizesStock).reduce((sum, sz) => sum + (parseInt(v.sizesStock[sz], 10) || 0), 0);
    p.stock = computeProductStock(p.variants);

    window.db.saveProduct(p);
    loadInventoryList();
    if (window.Dashboard) window.Dashboard.refresh();
  }

  function handleDeleteProduct(id) {
    window.ConfirmModal.open({
      title: "Supprimer l'article",
      message: "Voulez-vous vraiment supprimer cet article de la boutique ?",
      confirmLabel: "Supprimer",
      danger: true
    }).then(confirmed => {
      if (!confirmed) return;
      window.db.deleteProduct(id);
      if (editingProduct && editingProduct.id === id) closeDrawer();
      loadInventoryList();
      if (window.Dashboard) window.Dashboard.refresh();
      window.Toast.show("L'article a été supprimé avec succès.", "success");
    });
  }

  // ---------- Drawer ----------
  // If `value` isn't among the options already populated in `selectEl`, append an extra
  // option carrying that exact value/label so it displays and is preserved as-is, instead of
  // the <select> silently falling back to selectedIndex -1 / value "" (which would blank the
  // product's real stored category/subcategory/promo on the next save).
  function ensureSelectedOptionExists(selectEl, value, label) {
    if (!value) return;
    const exists = Array.from(selectEl.options).some(o => o.value === value);
    if (!exists) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label !== undefined ? label : value;
      selectEl.appendChild(opt);
    }
  }

  function buildCategoryOptions(selectEl, selectedSlug) {
    selectEl.innerHTML = "";
    window.db.getCategories().forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.slug;
      opt.textContent = cat.name;
      selectEl.appendChild(opt);
    });
    ensureSelectedOptionExists(selectEl, selectedSlug);
    if (selectedSlug) selectEl.value = selectedSlug;
  }

  function buildSubcategoryOptions(selectEl, categorySlug, selectedSlug) {
    selectEl.innerHTML = "";
    window.db.getSubcategoriesForCategory(categorySlug).forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub.slug;
      opt.textContent = sub.name;
      selectEl.appendChild(opt);
    });
    ensureSelectedOptionExists(selectEl, selectedSlug);
    if (selectedSlug) selectEl.value = selectedSlug;
  }

  function buildPromoOptions(selectEl, selectedCode) {
    selectEl.innerHTML = '<option value="">Aucun</option>';
    window.db.getPromoCodes().filter(pr => pr.active === true || pr.active === "true").forEach(pr => {
      const opt = document.createElement("option");
      opt.value = pr.code;
      const valLabel = pr.type === "percent" ? pr.value + "%" : window.formatPrice(pr.value);
      opt.textContent = pr.code + " (" + valLabel + ")";
      selectEl.appendChild(opt);
    });
    ensureSelectedOptionExists(selectEl, selectedCode);
    if (selectedCode) selectEl.value = selectedCode;
  }

  function updateLivePreview(overlay) {
    const title = overlay.querySelector("#drawer-prod-title").value.trim() || "Titre de l'article";
    const price = parseFloat(overlay.querySelector("#drawer-prod-price").value) || 0;
    const category = overlay.querySelector("#drawer-prod-category").value || "";
    const promo = overlay.querySelector("#drawer-prod-promo").value;
    const state = variantEditorHandle ? variantEditorHandle.getState() : { variants: [] };

    let firstImage = "images/product_male.png";
    for (const v of state.variants) {
      const found = v.images.find(img => img);
      if (found) { firstImage = found; break; }
    }
    const imgSrc = firstImage.startsWith("data:") ? firstImage : "../" + firstImage;

    const preview = overlay.querySelector("#drawer-live-preview");
    preview.innerHTML =
      '<div class="live-preview-card"><div class="live-preview-image-wrap">' +
        '<img src="' + imgSrc + '" alt=""><span class="badge-tag"></span>' +
        (promo ? '<span class="badge-tag live-preview-promo"></span>' : "") +
      '</div><div class="live-preview-title"></div><div class="live-preview-price"></div></div>';

    preview.querySelector(".badge-tag").textContent = category;
    if (promo) preview.querySelector(".live-preview-promo").textContent = "Code : " + promo;
    preview.querySelector(".live-preview-title").textContent = title;
    preview.querySelector(".live-preview-price").textContent = window.formatPrice(price);
  }

  function openDrawer(product) {
    // The ⌘K command palette can call openEditDrawer() even while a drawer is already open
    // (e.g. create drawer open, then a product is picked from the palette). Without this guard
    // a second overlay would be created sharing the same id, silently overwriting
    // variantEditorHandle and leaving closeDrawer() only able to remove one of the two via
    // getElementById.
    if (document.getElementById("product-drawer-overlay")) closeDrawer();

    editingProduct = product;

    const overlay = document.createElement("div");
    overlay.className = "drawer-overlay";
    overlay.id = "product-drawer-overlay";
    overlay.innerHTML =
      '<div class="drawer-panel">' +
        '<div class="drawer-header"><h3></h3><button type="button" class="drawer-close" aria-label="Fermer">&times;</button></div>' +
        '<div class="drawer-body">' +
          '<section class="drawer-section"><h4>Informations générales</h4>' +
            '<div class="form-group"><label>Nom de l\'article*</label><input type="text" id="drawer-prod-title"></div>' +
            '<div class="form-group"><label>Prix de vente*</label><input type="number" id="drawer-prod-price"></div>' +
            '<div class="form-group"><label>Catégorie Parente*</label><select id="drawer-prod-category"></select></div>' +
            '<div class="form-group"><label>Sous-Catégorie*</label><select id="drawer-prod-subcategory"></select></div>' +
            '<div class="form-group"><label>Description</label><textarea id="drawer-prod-desc"></textarea></div>' +
            '<div class="form-group"><label>Code Promo Associé</label><select id="drawer-prod-promo"></select></div>' +
          '</section>' +
          '<section class="drawer-section"><h4>Tailles & Variantes de couleur</h4>' +
            '<div id="drawer-variant-editor-mount"></div>' +
            '<div class="variant-add-color-row">' +
              '<input type="text" id="drawer-new-color-name" placeholder="Nom de la couleur (Ex: Noir Onyx)">' +
              '<input type="color" id="drawer-new-color-hex" value="#000000">' +
              '<button type="button" class="btn-secondary" id="drawer-add-color-btn">+ Couleur</button>' +
            '</div>' +
          '</section>' +
          '<section class="drawer-section"><h4>Aperçu en direct</h4><div id="drawer-live-preview"></div></section>' +
        '</div>' +
        '<div class="drawer-footer">' +
          '<button type="button" class="btn-secondary" id="drawer-cancel-btn">Annuler</button>' +
          '<button type="button" class="btn-primary" id="drawer-publish-btn"></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector(".drawer-header h3").textContent = product ? "Modifier : " + product.title : "Nouveau Produit";
    overlay.querySelector("#drawer-publish-btn").textContent = product ? "Enregistrer les modifications" : "Publier sur la boutique";
    if (product) {
      overlay.querySelector("#drawer-prod-title").value = product.title;
      overlay.querySelector("#drawer-prod-price").value = product.price;
      overlay.querySelector("#drawer-prod-desc").value = product.desc || "";
    }

    const categorySelect = overlay.querySelector("#drawer-prod-category");
    const subcategorySelect = overlay.querySelector("#drawer-prod-subcategory");
    buildCategoryOptions(categorySelect, product ? product.categories[0] : undefined);
    buildSubcategoryOptions(subcategorySelect, categorySelect.value, product ? product.subcategory : undefined);
    buildPromoOptions(overlay.querySelector("#drawer-prod-promo"), product ? product.promoCode : undefined);

    const mount = overlay.querySelector("#drawer-variant-editor-mount");
    const initialSizes = (product && product.sizes && product.sizes.length) ? product.sizes : getCategorySuggestedSizes(categorySelect.value);
    const initialVariants = product ? product.variants.map(v => ({
      name: v.name, color: v.color, images: (v.images && v.images.length) ? v.images : (v.img ? [v.img] : []), sizesStock: v.sizesStock || {}
    })) : [];

    variantEditorHandle = window.VariantEditor.mount(mount, {
      sizes: initialSizes,
      variants: initialVariants,
      onChange: () => updateLivePreview(overlay)
    });

    categorySelect.addEventListener("change", () => {
      buildSubcategoryOptions(subcategorySelect, categorySelect.value);
      if (!product) {
        const previousVariants = variantEditorHandle.getState().variants;
        variantEditorHandle.destroy();
        variantEditorHandle = window.VariantEditor.mount(mount, {
          sizes: getCategorySuggestedSizes(categorySelect.value),
          variants: previousVariants,
          onChange: () => updateLivePreview(overlay)
        });
      }
      updateLivePreview(overlay);
    });

    ["input", "change"].forEach(evt => {
      overlay.querySelector("#drawer-prod-title").addEventListener(evt, () => updateLivePreview(overlay));
      overlay.querySelector("#drawer-prod-price").addEventListener(evt, () => updateLivePreview(overlay));
      overlay.querySelector("#drawer-prod-promo").addEventListener(evt, () => updateLivePreview(overlay));
    });

    overlay.querySelector("#drawer-add-color-btn").addEventListener("click", () => {
      const nameInput = overlay.querySelector("#drawer-new-color-name");
      const hexInput = overlay.querySelector("#drawer-new-color-hex");
      const name = nameInput.value.trim();
      if (!name) { window.Toast.show("Veuillez renseigner le nom de la couleur.", "error"); return; }
      variantEditorHandle.addColor(name, hexInput.value);
      nameInput.value = "";
      updateLivePreview(overlay);
    });

    updateLivePreview(overlay);

    function requestClose() {
      window.ConfirmModal.open({
        title: "Fermer sans enregistrer ?",
        message: "Les modifications non publiées seront perdues.",
        confirmLabel: "Fermer"
      }).then(confirmed => { if (confirmed) closeDrawer(); });
    }

    // Same Escape-to-close pattern as ConfirmModal/CommandPalette in ui-kit.js: added on open,
    // removed on close so listeners never leak across repeated drawer opens. Skipped while a
    // ConfirmModal is on top (e.g. the "close without saving?" prompt this very handler can
    // trigger) so Escape cancels that dialog instead of stacking a second one.
    function onDrawerKeydown(e) {
      if (e.key === "Escape" && !document.querySelector(".confirm-overlay")) requestClose();
    }
    drawerKeydownHandler = onDrawerKeydown;
    document.addEventListener("keydown", onDrawerKeydown);

    overlay.addEventListener("click", (e) => { if (e.target === overlay) requestClose(); });
    overlay.querySelector(".drawer-close").addEventListener("click", requestClose);
    overlay.querySelector("#drawer-cancel-btn").addEventListener("click", requestClose);
    overlay.querySelector("#drawer-publish-btn").addEventListener("click", () => handlePublish(overlay, product));
  }

  function closeDrawer() {
    const overlay = document.getElementById("product-drawer-overlay");
    if (overlay) overlay.remove();
    if (variantEditorHandle) variantEditorHandle.destroy();
    variantEditorHandle = null;
    editingProduct = null;
    if (drawerKeydownHandler) {
      document.removeEventListener("keydown", drawerKeydownHandler);
      drawerKeydownHandler = null;
    }
  }

  function handlePublish(overlay, existingProduct) {
    const title = overlay.querySelector("#drawer-prod-title").value.trim();
    const price = parseFloat(overlay.querySelector("#drawer-prod-price").value);
    const category = overlay.querySelector("#drawer-prod-category").value;
    const subcategory = overlay.querySelector("#drawer-prod-subcategory").value;
    const desc = overlay.querySelector("#drawer-prod-desc").value.trim();
    const promoCode = overlay.querySelector("#drawer-prod-promo").value;

    if (title === "" || isNaN(price)) { window.Toast.show("Veuillez renseigner un titre et un prix corrects.", "error"); return; }

    const state = variantEditorHandle.getState();
    if (state.variants.length === 0) { window.Toast.show("Veuillez ajouter au moins une variante de couleur.", "error"); return; }
    if (!state.variants[0].images.some(img => img)) { window.Toast.show("Veuillez téléverser au moins une photo pour la première couleur.", "error"); return; }

    const formattedVariants = state.variants.map(v => {
      const validImages = v.images.filter(img => img);
      const stockTotal = Object.keys(v.sizesStock).reduce((sum, sz) => sum + (parseInt(v.sizesStock[sz], 10) || 0), 0);
      return { name: v.name, color: v.color, img: validImages[0] || "images/product_male.png", images: validImages, sizesStock: v.sizesStock, stock: stockTotal };
    });

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const id = existingProduct ? existingProduct.id : (slug + "-" + Date.now());

    const product = {
      id: id,
      title: title,
      categories: [category],
      subcategory: subcategory,
      price: price,
      oldPrice: existingProduct ? existingProduct.oldPrice : price * 1.2,
      desc: desc || "Aucune description fournie.",
      image: formattedVariants[0].img,
      variants: formattedVariants,
      sizes: state.sizes,
      stock: computeProductStock(formattedVariants),
      promoCode: promoCode || ""
    };

    window.db.saveProduct(product);
    window.Toast.show(existingProduct ? '"' + title + '" mis à jour avec succès.' : '"' + title + '" publié avec succès.', "success");
    closeDrawer();
    loadInventoryList();
    if (window.Dashboard) window.Dashboard.refresh();
  }

  function openCreateDrawer() { openDrawer(null); }
  function openEditDrawer(id) {
    const product = window.db.getProducts().find(p => p.id === id);
    if (product) openDrawer(product);
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadInventoryList();
    const createBtn = document.getElementById("btn-open-create-product-drawer");
    if (createBtn) createBtn.addEventListener("click", openCreateDrawer);
  });

  window.ProductsPanel = { openCreateDrawer: openCreateDrawer, openEditDrawer: openEditDrawer };
})();
