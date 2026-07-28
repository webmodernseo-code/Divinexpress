(function () {
  "use strict";

  // ---------- formatPrice ----------
  window.formatPrice = function formatPrice(val) {
    const num = parseFloat(val) || 0;
    // Always FCFA - there is no scenario in this codebase where USD formatting is correct.
    // The dashboard's default "7 derniers jours" range makes a quiet-week $0.00 revenue card
    // newly likely/visible, so amounts under 1000 must also render as FCFA, not USD.
    return num.toLocaleString('fr-FR') + " FCFA";
  };

  // ---------- Toast ----------
  let toastContainer = null;

  function ensureToastContainer() {
    if (toastContainer) return toastContainer;
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
    return toastContainer;
  }

  function showToast(message, type) {
    type = type || "info";
    const container = ensureToastContainer();
    const toast = document.createElement("div");
    toast.className = "toast toast-" + type;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("toast-visible"));

    setTimeout(() => {
      toast.classList.remove("toast-visible");
      toast.classList.add("toast-hiding");
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  window.Toast = { show: showToast };

  // ---------- Confirm Modal ----------
  function openConfirm(options) {
    options = options || {};
    const title = options.title || "Confirmer";
    const message = options.message || "";
    const confirmLabel = options.confirmLabel || "Confirmer";
    const danger = !!options.danger;

    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "confirm-overlay";
      overlay.innerHTML =
        '<div class="confirm-modal">' +
          '<h3></h3><p></p>' +
          '<div class="confirm-modal-actions">' +
            '<button class="btn-secondary" data-action="cancel">Annuler</button>' +
            '<button class="' + (danger ? "btn-danger" : "btn-primary") + '" data-action="confirm"></button>' +
          '</div>' +
        '</div>';
      overlay.querySelector("h3").textContent = title;
      overlay.querySelector("p").textContent = message;
      overlay.querySelector('[data-action="confirm"]').textContent = confirmLabel;
      document.body.appendChild(overlay);

      function close(result) {
        overlay.remove();
        document.removeEventListener("keydown", onKeydown);
        resolve(result);
      }
      function onKeydown(e) { if (e.key === "Escape") close(false); }

      overlay.addEventListener("click", (e) => { if (e.target === overlay) close(false); });
      overlay.querySelector('[data-action="cancel"]').addEventListener("click", () => close(false));
      overlay.querySelector('[data-action="confirm"]').addEventListener("click", () => close(true));
      document.addEventListener("keydown", onKeydown);
    });
  }

  window.ConfirmModal = { open: openConfirm };

  // ---------- Theme ----------
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function initTheme() {
    const saved = localStorage.getItem("DivinExpress_admin_theme");
    const theme = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(theme);

    const btn = document.getElementById("theme-toggle-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        localStorage.setItem("DivinExpress_admin_theme", next);
      });
    }
  }

  // ---------- Sidebar collapse ----------
  function initSidebarCollapse() {
    const appContainer = document.querySelector(".app-container");
    const btn = document.getElementById("sidebar-toggle-btn");
    if (!appContainer || !btn) return;

    if (localStorage.getItem("DivinExpress_admin_sidebar_collapsed") === "true") {
      appContainer.classList.add("sidebar-collapsed");
    }

    btn.addEventListener("click", () => {
      appContainer.classList.toggle("sidebar-collapsed");
      localStorage.setItem("DivinExpress_admin_sidebar_collapsed", appContainer.classList.contains("sidebar-collapsed"));
    });
  }

  function initNavUserMenu() {
    const userMenu = document.getElementById("nav-user-menu");
    if (!userMenu) return;

    userMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      userMenu.classList.toggle("open");
    });

    document.addEventListener("click", () => userMenu.classList.remove("open"));

    // Only "logout" is wired — "profile" carries the `disabled` attribute (see index.html)
    // per spec §3, since Profil & Paramètres has no real destination until Phase 6 exists.
    userMenu.querySelectorAll(".nav-user-dropdown-item:not([disabled])").forEach(item => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        userMenu.classList.remove("open");
        window.Toast.show("Déconnexion non disponible dans cette démo.", "info");
      });
    });
  }

  function initNotificationBell() {
    const btn = document.getElementById("nav-bell-btn");
    if (!btn) return;
    btn.addEventListener("click", () => window.Toast.show("Aucune nouvelle notification.", "info"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("theme-toggle-btn")) initTheme();
    if (document.getElementById("sidebar-toggle-btn")) initSidebarCollapse();
    initNavUserMenu();
    initNotificationBell();
  });

  // ---------- Command Palette ----------
  const NAV_TARGETS = [
    { label: "Dashboard", target: "panel-dashboard" },
    { label: "Produits", target: "panel-products" },
    { label: "Commandes", target: "panel-orders" },
    { label: "Clients", target: "panel-customers" },
    { label: "Attributs", target: "panel-settings" },
    { label: "Promotions", target: "panel-promos" }
  ];

  function goToPanel(target) {
    const navItem = document.querySelector('.nav-item[data-target="' + target + '"]');
    if (navItem) navItem.click();
  }

  function openCommandPalette() {
    if (document.getElementById("command-palette-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "command-palette-overlay";
    overlay.id = "command-palette-overlay";
    overlay.innerHTML =
      '<div class="command-palette">' +
        '<input type="text" id="command-palette-input" placeholder="Rechercher un produit ou naviguer...">' +
        '<div class="command-palette-results" id="command-palette-results"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    function closePalette() {
      overlay.remove();
      document.removeEventListener("keydown", onPaletteKeydown);
    }

    function onPaletteKeydown(e) {
      if (e.key === "Escape") closePalette();
    }

    function renderResults(query) {
      const resultsEl = overlay.querySelector("#command-palette-results");
      const q = query.trim().toLowerCase();
      resultsEl.innerHTML = "";

      NAV_TARGETS.filter(n => n.label.toLowerCase().includes(q)).forEach(n => {
        const item = document.createElement("div");
        item.className = "command-palette-item";
        item.innerHTML = "<span></span><span>Navigation</span>";
        item.querySelector("span").textContent = n.label;
        item.addEventListener("click", () => { closePalette(); goToPanel(n.target); });
        resultsEl.appendChild(item);
      });

      if (q.length >= 2 && window.db) {
        window.db.getProducts().filter(p => p.title.toLowerCase().includes(q)).slice(0, 6).forEach(p => {
          const item = document.createElement("div");
          item.className = "command-palette-item";
          item.innerHTML = "<span></span><span>Produit</span>";
          item.querySelector("span").textContent = p.title;
          item.addEventListener("click", () => {
            closePalette();
            goToPanel("panel-products");
            if (window.ProductsPanel) window.ProductsPanel.openEditDrawer(p.id);
          });
          resultsEl.appendChild(item);
        });
      }

      if (!resultsEl.children.length) {
        resultsEl.innerHTML = '<div class="command-palette-empty">Aucun résultat</div>';
      }
    }

    renderResults("");
    overlay.querySelector("#command-palette-input").addEventListener("input", (e) => renderResults(e.target.value));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closePalette(); });
    document.addEventListener("keydown", onPaletteKeydown);
    overlay.querySelector("#command-palette-input").focus();
  }

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openCommandPalette();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const searchBox = document.querySelector(".search-box input");
    if (searchBox) searchBox.addEventListener("click", openCommandPalette);
    setupLegacyDataExport();
  });

  function setupLegacyDataExport() {
    const btn = document.getElementById("btn-export-legacy-data");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const payload = {
        products: window.db.getProducts(),
        categories: window.db.getCategories(),
        promoCodes: window.db.getPromoCodes ? window.db.getPromoCodes() : [],
        orders: window.db.getOrders(),
      };
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = "divinexpress-export-" + today + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      window.Toast.show("Export terminé.", "success");
    });
  }

  window.CommandPalette = { open: openCommandPalette };
})();
