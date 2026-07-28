(function () {
  "use strict";

  let categoryImageDataUrl = "images/category_kid.png";

  function populateSubcategoryParentSelect() {
    const select = document.getElementById("subcat-parent");
    if (!select) return;
    select.innerHTML = "";
    window.db.getCategories().forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.slug;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  }

  function loadCategoryTree() {
    const container = document.getElementById("list-settings-categories");
    if (!container) return;
    container.innerHTML = "";

    const categories = window.db.getCategories();
    const subcategories = window.db.getSubcategories();

    categories.forEach(cat => {
      const subs = subcategories.filter(s => s.category_slug === cat.slug);
      const div = document.createElement("div");
      div.className = "category-tree-item";
      div.innerHTML =
        '<div class="category-tree-photo"><img src="../' + cat.image_url + '" alt="' + cat.name + '"></div>' +
        '<div class="category-tree-info">' +
          '<span class="category-tree-name">' + cat.name + '</span>' +
          '<div class="category-tree-subs">' +
            (subs.length
              ? subs.map(s => '<span class="badge-status info category-subcat-chip">' + s.name + '<button type="button" class="category-subcat-remove" data-cat="' + cat.slug + '" data-sub="' + s.slug + '">&times;</button></span>').join("")
              : '<em>Aucune sous-catégorie</em>') +
          '</div>' +
        '</div>' +
        '<button type="button" class="btn-danger category-remove-btn" data-slug="' + cat.slug + '">Supprimer</button>';
      container.appendChild(div);
    });

    container.querySelectorAll(".category-remove-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        window.ConfirmModal.open({
          title: "Supprimer la catégorie",
          message: "Cela supprimera aussi toutes ses sous-catégories. Continuer ?",
          confirmLabel: "Supprimer",
          danger: true
        }).then(confirmed => {
          if (!confirmed) return;
          window.db.deleteCategory(btn.dataset.slug);
          window.Toast.show("Catégorie supprimée.", "success");
          loadCategoryTree();
          populateSubcategoryParentSelect();
        });
      });
    });

    container.querySelectorAll(".category-subcat-remove").forEach(btn => {
      btn.addEventListener("click", () => {
        const subcatName = btn.parentElement.textContent.replace("×", "").trim();
        window.ConfirmModal.open({
          title: "Supprimer la sous-catégorie",
          message: "Voulez-vous vraiment supprimer la sous-catégorie \"" + subcatName + "\" ?",
          confirmLabel: "Supprimer",
          danger: true
        }).then(confirmed => {
          if (!confirmed) return;
          window.db.deleteSubcategory(btn.dataset.cat, btn.dataset.sub);
          window.Toast.show("Sous-catégorie supprimée.", "success");
          loadCategoryTree();
        });
      });
    });
  }

  function setupCategoryForm() {
    const fileInput = document.getElementById("cat-image-file");
    const uploaderBox = document.getElementById("cat-uploader-box");
    const uploadLabel = document.getElementById("cat-upload-label");
    const btnSave = document.getElementById("btn-save-category");

    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          categoryImageDataUrl = evt.target.result;
          uploadLabel.textContent = "Image sélectionnée : " + file.name;
          uploaderBox.style.borderColor = "var(--accent-green)";
        };
        reader.readAsDataURL(file);
      });
    }

    if (btnSave) {
      btnSave.addEventListener("click", () => {
        const name = document.getElementById("cat-name").value.trim();
        if (!name) {
          window.Toast.show("Veuillez entrer le nom de la catégorie.", "error");
          return;
        }
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        window.db.saveCategory({ slug: slug, name: name, image_url: categoryImageDataUrl });
        window.Toast.show('Catégorie "' + name + '" créée avec succès.', "success");

        document.getElementById("form-add-category").reset();
        uploadLabel.textContent = "Déposer la photo ou cliquer pour choisir";
        uploaderBox.style.borderColor = "var(--border-medium)";
        categoryImageDataUrl = "images/category_kid.png";

        populateSubcategoryParentSelect();
        loadCategoryTree();
      });
    }
  }

  function setupSubcategoryForm() {
    const btnSave = document.getElementById("btn-save-subcategory");
    if (!btnSave) return;

    btnSave.addEventListener("click", () => {
      const name = document.getElementById("subcat-name").value.trim();
      const parent = document.getElementById("subcat-parent").value;
      if (!name) {
        window.Toast.show("Veuillez entrer le nom de la sous-catégorie.", "error");
        return;
      }
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      window.db.saveSubcategory({ category_slug: parent, name: name, slug: slug });
      window.Toast.show('Sous-catégorie "' + name + '" créée avec succès.', "success");
      document.getElementById("form-add-subcategory").reset();
      loadCategoryTree();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    populateSubcategoryParentSelect();
    loadCategoryTree();
    setupCategoryForm();
    setupSubcategoryForm();
  });

  window.CategoriesPanel = { refresh: function () { populateSubcategoryParentSelect(); loadCategoryTree(); } };
})();
