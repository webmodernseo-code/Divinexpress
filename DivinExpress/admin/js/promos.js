(function () {
  "use strict";

  function loadPromoCodes() {
    const tbody = document.getElementById("promo-list-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    window.db.getPromoCodes().forEach(p => {
      const tr = document.createElement("tr");
      const active = p.active === true || p.active === "true";
      const statusBadge = active
        ? '<span class="badge-status success"><span class="bullet-dot"></span> Actif</span>'
        : '<span class="badge-status warning"><span class="bullet-dot"></span> Inactif</span>';
      const typeLabel = p.type === "percent" ? "Pourcentage" : "Montant Fixe";
      const valLabel = p.type === "percent" ? p.value + "%" : window.formatPrice(p.value);

      tr.innerHTML =
        "<td>" + p.code + "</td>" +
        "<td>" + typeLabel + "</td>" +
        "<td>" + valLabel + "</td>" +
        "<td>" + statusBadge + "</td>" +
        '<td style="text-align:center;"><button type="button" class="btn-danger promo-delete-btn" data-code="' + p.code + '">Supprimer</button></td>';
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".promo-delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        window.ConfirmModal.open({
          title: "Supprimer le code promo",
          message: 'Voulez-vous vraiment supprimer le code promo "' + btn.dataset.code + '" ?',
          confirmLabel: "Supprimer",
          danger: true
        }).then(confirmed => {
          if (!confirmed) return;
          window.db.deletePromoCode(btn.dataset.code);
          window.Toast.show('Code promo "' + btn.dataset.code + '" supprimé.', "success");
          loadPromoCodes();
        });
      });
    });
  }

  function setupPromoForm() {
    const btnSave = document.getElementById("btn-save-promo");
    if (!btnSave) return;

    btnSave.addEventListener("click", () => {
      const code = document.getElementById("promo-code").value.trim().toUpperCase();
      const type = document.getElementById("promo-type").value;
      const value = parseFloat(document.getElementById("promo-value").value);
      const active = document.getElementById("promo-active").value === "true";

      if (!code || isNaN(value) || value < 0) {
        window.Toast.show("Veuillez remplir correctement les champs.", "error");
        return;
      }

      window.db.savePromoCode({ code: code, type: type, value: value, active: active });
      window.Toast.show('Code promo "' + code + '" enregistré avec succès.', "success");
      document.getElementById("form-add-promo").reset();
      loadPromoCodes();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadPromoCodes();
    setupPromoForm();
  });

  window.PromosPanel = { refresh: loadPromoCodes };
})();
