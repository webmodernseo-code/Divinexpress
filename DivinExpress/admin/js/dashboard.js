(function () {
  "use strict";

  function methodDisplay(method) {
    return window.PaymentIcons ? window.PaymentIcons.forMethodLabel(method) : method;
  }

  function statusBadgeClass(status) {
    if (status === "Payée") return "success";
    if (status === "Expédiée") return "info";
    if (status === "Annulée") return "danger";
    return "warning";
  }

  // ---------- Date range filtering ----------
  let currentRangeKey = "7d";
  let currentChartMode = "week";

  function parseOrderDate(dateStr) {
    // order.date is always produced by `new Date().toLocaleDateString('fr-FR')` -> "dd/mm/yyyy"
    const parts = (dateStr || "").split("/");
    if (parts.length !== 3) return new Date(0);
    return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  }

  function rangeDays(rangeKey) {
    return rangeKey === "30d" ? 30 : 7;
  }

  function filterByRange(orders, rangeKey) {
    if (rangeKey === "all") return orders;
    const days = rangeDays(rangeKey);
    const start = new Date();
    start.setDate(start.getDate() - days);
    return orders.filter(o => parseOrderDate(o.date) >= start);
  }

  function filterByPreviousRange(orders, rangeKey) {
    if (rangeKey === "all") return [];
    const days = rangeDays(rangeKey);
    const start = new Date();
    start.setDate(start.getDate() - days * 2);
    const end = new Date();
    end.setDate(end.getDate() - days);
    return orders.filter(o => {
      const d = parseOrderDate(o.date);
      return d >= start && d < end;
    });
  }

  function trendPercent(current, previous) {
    if (!previous) return null;
    return ((current - previous) / previous) * 100;
  }

  function renderTrend(elId, value, inverse) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (value === null || value === undefined || !isFinite(value)) {
      el.style.display = "none";
      return;
    }
    el.style.display = "";
    const sign = value >= 0 ? "+" : "";
    el.textContent = sign + value.toFixed(1) + "%";
    // For most KPIs, a rise is good (green/"up"). For "inverse" metrics like refunds, a rise
    // is bad, so flip which class gets applied - the sign of the displayed number is unchanged.
    const isGood = inverse ? value < 0 : value >= 0;
    el.className = "metric-trend " + (isGood ? "up" : "down");
  }

  // ---------- Order detail overlay ----------
  let orderDetailKeydownHandler = null;

  function closeOrderDetail() {
    const overlay = document.getElementById("order-detail-overlay");
    if (overlay) overlay.remove();
    if (orderDetailKeydownHandler) {
      document.removeEventListener("keydown", orderDetailKeydownHandler);
      orderDetailKeydownHandler = null;
    }
  }

  function openOrderDetail(order) {
    // Guard against stacking a second overlay if a "Détail" button is clicked again fast,
    // same spirit as the product drawer duplicate-overlay fix in products.js.
    closeOrderDetail();

    const overlay = document.createElement("div");
    overlay.className = "order-detail-overlay";
    overlay.id = "order-detail-overlay";
    overlay.innerHTML =
      '<div class="order-detail-modal">' +
        '<div class="order-detail-header"><h3></h3><button type="button" class="order-detail-close" aria-label="Fermer">&times;</button></div>' +
        '<div class="order-detail-body">' +
          '<section class="order-detail-section"><h4>Client</h4>' +
            '<p class="order-detail-field"><strong>Email</strong><span class="order-detail-email"></span></p>' +
            '<p class="order-detail-field"><strong>Téléphone</strong><span class="order-detail-phone"></span></p>' +
            '<p class="order-detail-field"><strong>Adresse</strong><span class="order-detail-address"></span></p>' +
          '</section>' +
          '<section class="order-detail-section"><h4>Articles</h4><div class="order-detail-items"></div></section>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    // Every field below is customer-submitted checkout data (js/divinexpress.js), same trust
    // boundary as the order id/client/date fixed in loadOrdersPanel — always .textContent.
    overlay.querySelector("h3").textContent = "Commande " + order.id;
    overlay.querySelector(".order-detail-email").textContent = order.email || "—";
    overlay.querySelector(".order-detail-phone").textContent = order.phone || "—";
    overlay.querySelector(".order-detail-address").textContent = order.address || "—";

    const itemsContainer = overlay.querySelector(".order-detail-items");
    const items = order.items || [];
    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "order-detail-empty";
      empty.textContent = "Aucun article enregistré pour cette commande.";
      itemsContainer.appendChild(empty);
    } else {
      items.forEach(item => {
        const row = document.createElement("div");
        row.className = "order-detail-item";
        row.innerHTML =
          '<span class="order-detail-item-title"></span>' +
          '<span class="order-detail-item-meta"></span>' +
          '<span class="order-detail-item-qty"></span>' +
          '<span class="order-detail-item-price"></span>';
        row.querySelector(".order-detail-item-title").textContent = item.title || "Article";
        const colorName = (item.variant && item.variant.name) ? item.variant.name : "";
        const metaParts = [];
        if (item.size) metaParts.push("Taille : " + item.size);
        if (colorName) metaParts.push(colorName);
        row.querySelector(".order-detail-item-meta").textContent = metaParts.join(" · ");
        row.querySelector(".order-detail-item-qty").textContent = "x" + (item.qty || 1);
        row.querySelector(".order-detail-item-price").textContent = (item.price !== undefined && item.price !== null) ? window.formatPrice(item.price) : "";
        itemsContainer.appendChild(row);
      });
    }

    function onKeydown(e) { if (e.key === "Escape") closeOrderDetail(); }
    orderDetailKeydownHandler = onKeydown;
    document.addEventListener("keydown", onKeydown);

    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeOrderDetail(); });
    overlay.querySelector(".order-detail-close").addEventListener("click", closeOrderDetail);
  }

  function computeKPIs(allOrders, rangeKey) {
    const current = filterByRange(allOrders, rangeKey);
    const previous = filterByPreviousRange(allOrders, rangeKey);

    const currentNonCancelled = current.filter(o => o.status !== "Annulée");
    const previousNonCancelled = previous.filter(o => o.status !== "Annulée");

    const currentRevenue = currentNonCancelled.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    const previousRevenue = previousNonCancelled.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

    const currentCancelled = current.filter(o => o.status === "Annulée");
    const previousCancelled = previous.filter(o => o.status === "Annulée");

    const currentCustomers = new Set(current.map(o => o.email || o.phone).filter(Boolean)).size;
    const previousCustomers = new Set(previous.map(o => o.email || o.phone).filter(Boolean)).size;

    return {
      sales: { value: currentNonCancelled.length, trend: trendPercent(currentNonCancelled.length, previousNonCancelled.length) },
      revenue: { value: currentRevenue, trend: trendPercent(currentRevenue, previousRevenue) },
      customers: { value: currentCustomers, trend: trendPercent(currentCustomers, previousCustomers) },
      refunds: { value: currentCancelled.length, trend: trendPercent(currentCancelled.length, previousCancelled.length) }
    };
  }

  function computeSuccessRate(allOrders, rangeKey) {
    const current = filterByRange(allOrders, rangeKey).filter(o => o.status !== "Annulée");
    const successful = current.filter(o => o.status === "Payée" || o.status === "Expédiée");
    const percent = current.length ? (successful.length / current.length) * 100 : 0;
    return { percent: percent, successfulCount: successful.length, successfulRevenue: successful.reduce((s, o) => s + (parseFloat(o.total) || 0), 0) };
  }

  function renderSuccessGauge() {
    const container = document.getElementById("success-gauge-body");
    if (!container || !window.DashboardCharts) return;
    const orders = window.db.getOrders();
    const result = computeSuccessRate(orders, currentRangeKey);
    window.DashboardCharts.renderSuccessGauge(container, result.percent, [
      { label: "Ventes", value: result.successfulCount },
      { label: "Chiffre d'Affaires", value: window.formatPrice(result.successfulRevenue) }
    ]);
  }

  function buildPlaceholderThumb() {
    const placeholder = document.createElement("div");
    placeholder.className = "recent-order-thumb recent-order-thumb-empty";
    placeholder.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />' +
      "</svg>";
    return placeholder;
  }

  function buildThumbElement(firstItem) {
    if (firstItem && firstItem.variant && firstItem.variant.img) {
      const raw = firstItem.variant.img;
      // Stored product photos are relative paths like "images/foo.png" (relative to the site
      // root); rendered from /admin/index.html they need a "../" prefix. Freshly-picked files
      // are data: URLs and must be left untouched. Same resolution as variant-editor.js:132
      // and products.js:193 (fixed in 95ec26d for the edit drawer) - this dashboard thumbnail
      // was using the raw catalog path and 404ing under /admin/images/... before this fix.
      const img = document.createElement("img");
      img.className = "recent-order-thumb";
      img.src = raw.startsWith("data:") ? raw : "../" + raw;
      img.alt = "";
      // This exact field has proven fragile before (95ec26d) - fall back to the placeholder
      // if the resolved path still 404s instead of showing a broken-image icon.
      img.onerror = () => { img.replaceWith(buildPlaceholderThumb()); };
      return img;
    }
    return buildPlaceholderThumb();
  }

  function renderRecentOrdersPreview() {
    const container = document.getElementById("recent-orders-body");
    if (!container) return;
    // Respect the date-range selector, same as the KPI cards, gauge and sales overview,
    // so a 20-day-old order can't appear here while the "7 derniers jours" range is active.
    const orders = filterByRange(window.db.getOrders(), currentRangeKey);

    if (orders.length === 0) {
      container.innerHTML = '<p class="empty-state-panel">Aucune commande pour le moment.</p>';
      return;
    }

    const table = document.createElement("table");
    table.innerHTML =
      "<thead><tr><th>Article</th><th>Client</th><th>Date</th><th>Montant</th><th style=\"text-align:right;\">Statut</th></tr></thead><tbody></tbody>";
    const tbody = table.querySelector("tbody");

    orders.slice(-5).reverse().forEach(o => {
      const items = o.items || [];
      const firstItem = items[0];
      const extraCount = items.length - 1;

      const itemCell = document.createElement("td");
      const itemWrap = document.createElement("div");
      itemWrap.className = "recent-order-item-cell";
      itemWrap.appendChild(buildThumbElement(firstItem));

      const textWrap = document.createElement("div");
      const titleEl = document.createElement("span");
      titleEl.className = "recent-order-title";
      // item.title comes from the product catalog (admin-controlled), but we still use
      // textContent (never innerHTML interpolation) to match this file's established convention.
      titleEl.textContent = firstItem ? firstItem.title : "Commande vide";
      textWrap.appendChild(titleEl);
      if (extraCount > 0) {
        const extraEl = document.createElement("span");
        extraEl.className = "recent-order-extra";
        extraEl.textContent = "+" + extraCount + " autres articles";
        textWrap.appendChild(document.createElement("br"));
        textWrap.appendChild(extraEl);
      }
      itemWrap.appendChild(textWrap);
      itemCell.appendChild(itemWrap);

      const clientCell = document.createElement("td");
      clientCell.textContent = o.client; // customer-submitted (js/divinexpress.js) -> textContent only

      const dateCell = document.createElement("td");
      dateCell.textContent = o.date;

      const totalCell = document.createElement("td");
      totalCell.textContent = window.formatPrice(o.total);

      const statusCell = document.createElement("td");
      statusCell.style.textAlign = "right";
      const badge = document.createElement("span");
      badge.className = "badge-status " + statusBadgeClass(o.status);
      const dot = document.createElement("span");
      dot.className = "bullet-dot";
      badge.appendChild(dot);
      badge.appendChild(document.createTextNode(" " + o.status));
      statusCell.appendChild(badge);

      const tr = document.createElement("tr");
      tr.appendChild(itemCell);
      tr.appendChild(clientCell);
      tr.appendChild(dateCell);
      tr.appendChild(totalCell);
      tr.appendChild(statusCell);
      tbody.appendChild(tr);
    });

    container.innerHTML = "";
    container.appendChild(table);
  }

  function computeSalesOverview(allOrders, rangeKey) {
    const current = filterByRange(allOrders, rangeKey);
    const total = current.length || 1;

    const successful = current.filter(o => o.status === "Payée" || o.status === "Expédiée").length;
    const pending = current.filter(o => o.status === "En attente").length;
    const cancelled = current.filter(o => o.status === "Annulée").length;

    const breakdown = [
      { label: "Réussies", key: "success", percent: (successful / total) * 100 },
      { label: "En attente", key: "pending", percent: (pending / total) * 100 },
      { label: "Annulées", key: "cancelled", percent: (cancelled / total) * 100 }
    ];

    const productTotals = {};
    current.forEach(o => {
      (o.items || []).forEach(item => {
        const title = item.title || "Article";
        const lineTotal = (parseFloat(item.price) || 0) * (parseInt(item.qty, 10) || 1);
        productTotals[title] = (productTotals[title] || 0) + lineTotal;
      });
    });

    const grandTotal = Object.values(productTotals).reduce((s, v) => s + v, 0) || 1;
    const topProducts = Object.keys(productTotals)
      .map(title => ({ title: title, earnings: productTotals[title], percent: (productTotals[title] / grandTotal) * 100 }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 4);

    return { breakdown: breakdown, topProducts: topProducts };
  }

  function renderSalesOverview() {
    const container = document.getElementById("sales-overview-body");
    if (!container) return;
    const orders = window.db.getOrders();
    const data = computeSalesOverview(orders, currentRangeKey);

    const legendHTML = data.breakdown.map(b =>
      '<div class="sales-legend-item"><span class="sales-legend-dot ' + b.key + '"></span><span class="sales-legend-label"></span><strong class="sales-legend-percent"></strong></div>'
    ).join("");

    const barsHTML = data.breakdown.map(b => {
      const ticks = Math.round(b.percent / 2); // ~50 ticks total across all 3 categories
      let ticksHTML = "";
      for (let i = 0; i < ticks; i++) {
        ticksHTML += '<span class="sales-breakdown-bar ' + b.key + '"></span>';
      }
      return ticksHTML;
    }).join("");

    const rowsHTML = data.topProducts.map(() =>
      '<tr><td class="top-product-name"></td><td class="top-product-percent"></td><td class="top-product-earnings"></td></tr>'
    ).join("");

    container.innerHTML =
      '<div class="sales-legend">' + legendHTML + '</div>' +
      '<div class="sales-breakdown-row">' + barsHTML + '</div>' +
      '<table class="sales-top-products"><thead><tr><th>Produit</th><th>Part</th><th>Gains</th></tr></thead><tbody>' + rowsHTML + '</tbody></table>';

    container.querySelectorAll(".sales-legend-item").forEach((el, i) => {
      el.querySelector(".sales-legend-label").textContent = data.breakdown[i].label;
      el.querySelector(".sales-legend-percent").textContent = data.breakdown[i].percent.toFixed(1) + "%";
    });

    if (data.topProducts.length === 0) {
      container.querySelector(".sales-top-products tbody").innerHTML = '<tr><td colspan="3" class="empty-state-panel">Aucun article vendu sur cette période.</td></tr>';
    } else {
      container.querySelectorAll(".sales-top-products tbody tr").forEach((row, i) => {
        row.querySelector(".top-product-name").textContent = data.topProducts[i].title;
        row.querySelector(".top-product-percent").textContent = data.topProducts[i].percent.toFixed(0) + "%";
        row.querySelector(".top-product-earnings").textContent = window.formatPrice(data.topProducts[i].earnings);
      });
    }
  }

  function loadOverviewMetrics() {
    const orders = window.db.getOrders();
    const kpis = computeKPIs(orders, currentRangeKey);

    const salesEl = document.getElementById("val-sales");
    if (salesEl) salesEl.textContent = kpis.sales.value;
    renderTrend("kpi-sales-trend", kpis.sales.trend);

    const revenueEl = document.getElementById("val-revenue");
    if (revenueEl) revenueEl.textContent = window.formatPrice(kpis.revenue.value);
    renderTrend("kpi-revenue-trend", kpis.revenue.trend);

    const customersEl = document.getElementById("val-customers");
    if (customersEl) customersEl.textContent = kpis.customers.value;
    renderTrend("kpi-customers-trend", kpis.customers.trend);

    const refundsEl = document.getElementById("val-refunds");
    if (refundsEl) refundsEl.textContent = kpis.refunds.value;
    renderTrend("kpi-refunds-trend", kpis.refunds.trend, true); // inverse: more refunds is bad

    renderSuccessGauge();
    renderRecentOrdersPreview();
    renderSalesOverview();
  }

  function loadOrdersPanel() {
    const tbody = document.getElementById("orders-list-tbody");
    const emptyState = document.getElementById("orders-empty-state");
    if (!tbody) return;

    const orders = window.db.getOrders().slice().reverse();
    tbody.innerHTML = "";
    if (emptyState) emptyState.style.display = orders.length ? "none" : "flex";

    orders.forEach(o => {
      const tr = document.createElement("tr");
      // o.id/o.client/o.date come straight from the customer checkout form (js/divinexpress.js) —
      // unlike admin-entered category/product/promo names, this is customer-submitted text, so
      // build the row skeleton via innerHTML then assign these three fields via .textContent.
      tr.innerHTML =
        "<td data-cell=\"id\"></td>" +
        "<td data-cell=\"client\"></td>" +
        "<td data-cell=\"date\"></td>" +
        "<td>" + window.formatPrice(o.total) + "</td>" +
        "<td>" + methodDisplay(o.method) + "</td>" +
        "<td><select class=\"order-status-select\" data-id=\"" + o.id + "\">" +
          ["En attente", "Payée", "Expédiée", "Annulée"].map(s =>
            "<option value=\"" + s + "\"" + (s === o.status ? " selected" : "") + ">" + s + "</option>"
          ).join("") +
        "</select></td>" +
        "<td><button type=\"button\" class=\"btn-secondary order-detail-btn\" data-id=\"" + o.id + "\">Détail</button></td>";
      tr.querySelector('[data-cell="id"]').textContent = o.id;
      tr.querySelector('[data-cell="client"]').textContent = o.client;
      tr.querySelector('[data-cell="date"]').textContent = o.date;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".order-status-select").forEach(select => {
      select.addEventListener("change", () => {
        window.db.updateOrderStatus(select.dataset.id, select.value);
        window.Toast.show("Statut de la commande " + select.dataset.id + " mis à jour.", "success");
        refresh();
      });
    });

    tbody.querySelectorAll(".order-detail-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const order = window.db.getOrders().find(o => o.id === btn.dataset.id);
        if (order) openOrderDetail(order);
      });
    });
  }

  function refresh() {
    loadOverviewMetrics();
    loadOrdersPanel();
    renderRevenueChart(currentChartMode);
  }

  function buildWeeklyBuckets(orders) {
    const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const buckets = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      buckets.push({ label: dayLabels[(day.getDay() + 6) % 7], total: 0, count: 0, dateLabel: day.toLocaleDateString("fr-FR"), dayStart: day });
    }

    orders.forEach(o => {
      if (o.status === "Annulée") return;
      const d = parseOrderDate(o.date);
      const bucket = buckets.find(b => b.dayStart.toDateString() === d.toDateString());
      if (bucket) {
        bucket.total += parseFloat(o.total) || 0;
        bucket.count += 1;
      }
    });

    return buckets;
  }

  function buildMonthlyBuckets(orders) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 34); // 5 weeks
    start.setHours(0, 0, 0, 0);

    const buckets = [];
    for (let i = 0; i < 5; i++) {
      const weekStart = new Date(start);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      buckets.push({ label: "Sem " + (i + 1), total: 0, count: 0, dateLabel: "Sem " + (i + 1) + " (" + weekStart.toLocaleDateString("fr-FR") + ")", weekStart: weekStart, weekEnd: weekEnd });
    }

    orders.forEach(o => {
      if (o.status === "Annulée") return;
      const d = parseOrderDate(o.date);
      const bucket = buckets.find(b => d >= b.weekStart && d < b.weekEnd);
      if (bucket) {
        bucket.total += parseFloat(o.total) || 0;
        bucket.count += 1;
      }
    });

    return buckets;
  }

  function renderRevenueChart(mode) {
    const container = document.getElementById("revenue-chart-body");
    if (!container) return;
    const orders = window.db.getOrders();
    const buckets = mode === "month" ? buildMonthlyBuckets(orders) : buildWeeklyBuckets(orders);

    const currentTotal = buckets.reduce((s, b) => s + b.total, 0);
    // Trend vs the immediately preceding equivalent window — computed by summing orders
    // that fall in the prior window directly, rather than re-running the bucket builders.
    const now = new Date();
    const spanDays = mode === "month" ? 35 : 7;
    const prevStart = new Date(now); prevStart.setDate(prevStart.getDate() - spanDays * 2);
    const prevEnd = new Date(now); prevEnd.setDate(prevEnd.getDate() - spanDays);
    const previousTotal = orders
      .filter(o => o.status !== "Annulée")
      .filter(o => { const d = parseOrderDate(o.date); return d >= prevStart && d < prevEnd; })
      .reduce((s, o) => s + (parseFloat(o.total) || 0), 0);

    const trend = trendPercent(currentTotal, previousTotal);
    window.DashboardCharts.renderRevenueBarChart(container, buckets, { trend: trend });
  }

  function setupChartToggle() {
    const btnWeek = document.getElementById("btn-chart-week");
    const btnMonth = document.getElementById("btn-chart-month");
    if (!btnWeek || !btnMonth) return;

    renderRevenueChart(currentChartMode);

    btnWeek.addEventListener("click", () => {
      currentChartMode = "week";
      btnWeek.classList.add("active");
      btnMonth.classList.remove("active");
      renderRevenueChart(currentChartMode);
    });
    btnMonth.addEventListener("click", () => {
      currentChartMode = "month";
      btnMonth.classList.add("active");
      btnWeek.classList.remove("active");
      renderRevenueChart(currentChartMode);
    });
  }

  function setupDateRangeSelector() {
    const select = document.getElementById("kpi-date-range");
    if (!select) return;
    select.addEventListener("change", () => {
      currentRangeKey = select.value;
      refresh();
    });
  }

  function csvEscape(value) {
    const str = String(value === undefined || value === null ? "" : value);
    if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
      return "\"" + str.replace(/"/g, "\"\"") + "\"";
    }
    return str;
  }

  function rangeLabel(rangeKey) {
    if (rangeKey === "30d") return "30 derniers jours";
    if (rangeKey === "all") return "Tout";
    return "7 derniers jours";
  }

  function buildReportCSV() {
    const orders = window.db.getOrders();
    const kpis = computeKPIs(orders, currentRangeKey);

    const lines = [];
    lines.push(csvEscape("Période") + "," + csvEscape(rangeLabel(currentRangeKey)));
    lines.push("");
    // "Valeur (numérique)" repeats "Valeur" as a plain number for rows that are already
    // numeric, and gives Chiffre d'Affaires (the only formatted-string row here, e.g.
    // "125 000 FCFA") a clean numeric counterpart - so a spreadsheet can sum/chart the
    // column without parsing the formatted text.
    lines.push("Indicateur,Valeur,Valeur (numérique)");
    lines.push(csvEscape("Ventes Totales") + "," + csvEscape(kpis.sales.value) + "," + csvEscape(kpis.sales.value));
    lines.push(csvEscape("Chiffre d'Affaires") + "," + csvEscape(window.formatPrice(kpis.revenue.value)) + "," + csvEscape(kpis.revenue.value));
    lines.push(csvEscape("Clients Actifs") + "," + csvEscape(kpis.customers.value) + "," + csvEscape(kpis.customers.value));
    lines.push(csvEscape("Demandes de Remboursement") + "," + csvEscape(kpis.refunds.value) + "," + csvEscape(kpis.refunds.value));
    lines.push("");
    lines.push("Commande,Client,Date,Total,Statut,Total (numérique)");
    // Filtered through the same currentRangeKey as the KPIs above, so the exported orders
    // reconcile with the exported KPI period instead of silently covering all-time data.
    filterByRange(orders, currentRangeKey).slice(-5).reverse().forEach(o => {
      const rawTotal = parseFloat(o.total) || 0;
      lines.push([o.id, o.client, o.date, window.formatPrice(o.total), o.status, rawTotal].map(csvEscape).join(","));
    });

    return lines.join("\n");
  }

  function setupExportButton() {
    const btn = document.getElementById("btn-export-report");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const csv = buildReportCSV();
      // Prepend a UTF-8 BOM so Excel on Windows decodes accented characters (e.g. "Expédiée")
      // correctly instead of mangling them (e.g. "ExpÃ©diÃ©e").
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = "rapport-divinexpress-" + today + ".csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      window.Toast.show("Rapport exporté.", "success");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    refresh();
    setupChartToggle();
    setupDateRangeSelector();
    setupExportButton();
  });

  window.Dashboard = { refresh: refresh };
})();
