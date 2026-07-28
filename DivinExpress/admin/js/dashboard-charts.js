(function () {
  "use strict";

  function renderRevenueBarChart(container, buckets, options) {
    options = options || {};
    container.innerHTML = "";
    container.style.position = "relative";

    const maxTotal = Math.max(1, ...buckets.map(b => b.total));
    const width = 560;
    const height = 220;
    const paddingBottom = 26;
    const paddingTop = 10;
    const chartHeight = height - paddingBottom - paddingTop;
    const barGap = 14;
    const barWidth = (width - barGap * (buckets.length + 1)) / buckets.length;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.overflow = "visible";

    buckets.forEach((bucket, i) => {
      const barHeight = Math.max(4, (bucket.total / maxTotal) * chartHeight);
      const x = barGap + i * (barWidth + barGap);
      const y = paddingTop + (chartHeight - barHeight);

      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("class", "revenue-bar");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", barWidth);
      rect.setAttribute("height", barHeight);
      rect.setAttribute("rx", 6);
      rect.setAttribute("fill", "var(--accent-primary)");
      svg.appendChild(rect);

      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("x", x + barWidth / 2);
      label.setAttribute("y", height - 8);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-size", "9");
      label.setAttribute("fill", "var(--text-body)");
      label.textContent = bucket.label;
      svg.appendChild(label);

      rect.addEventListener("mouseenter", () => showTooltip(container, bucket, rect));
      rect.addEventListener("mouseleave", () => hideTooltip(container));
    });

    container.appendChild(svg);

    if (options.trend !== undefined && options.trend !== null) {
      const badge = document.createElement("span");
      badge.className = "chart-trend-floating badge-status " + (options.trend >= 0 ? "success" : "danger");
      badge.textContent = (options.trend >= 0 ? "+" : "") + options.trend.toFixed(1) + "% vs période précédente";
      container.appendChild(badge);
    }
  }

  function showTooltip(container, bucket, rect) {
    hideTooltip(container);
    const tooltip = document.createElement("div");
    tooltip.className = "revenue-bar-tooltip";
    tooltip.innerHTML =
      '<strong></strong><br><span class="tooltip-count"></span><br><span class="tooltip-total"></span>';
    tooltip.querySelector("strong").textContent = bucket.dateLabel;
    tooltip.querySelector(".tooltip-count").textContent = bucket.count + " commande(s)";
    tooltip.querySelector(".tooltip-total").textContent = window.formatPrice(bucket.total);
    container.appendChild(tooltip);

    // Use real rendered geometry instead of SVG viewBox arithmetic. The viewBox is 560 units
    // wide but with the default preserveAspectRatio ("xMidYMid meet") and height as the
    // constraining dimension, the content is letterboxed and centered inside the container -
    // so `x / 560 * 100%` only lines up with reality for the one bar sitting exactly at the
    // horizontal center; every other bar was off by up to ~1.4 bar-widths. Likewise, deriving
    // the vertical position from the hovered <rect>'s own getBoundingClientRect() (rather than
    // a hardcoded floor tuned against a single extreme-outlier fixture) means the fallback
    // below only engages for bars that are genuinely too tall to fit a tooltip above them, and
    // it falls back relative to *that* bar's own position - not a shared constant that pins
    // every close-together bar to an identical spot.
    const b = rect.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    tooltip.style.left = (b.left + b.width / 2 - c.left) + "px";
    const gap = 8;
    const above = b.top - c.top - tooltip.offsetHeight - gap;
    // Falls inside the bar's own top edge only when there's truly no room above - safe
    // because it only fires for genuinely tall bars, never overlapping the card header.
    tooltip.style.top = (above >= 4 ? above : b.top - c.top + gap) + "px";
  }

  function hideTooltip(container) {
    const existing = container.querySelector(".revenue-bar-tooltip");
    if (existing) existing.remove();
  }

  function renderSuccessGauge(container, percent, stats) {
    container.innerHTML = "";

    const svgNS = "http://www.w3.org/2000/svg";
    const size = 180;
    const radius = 70;
    const cx = size / 2;
    const cy = size / 2 + 10;
    const totalSegments = 24;
    const filledSegments = Math.round((percent / 100) * totalSegments);

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 " + size + " " + (size / 2 + 30));
    svg.setAttribute("width", "160");
    svg.setAttribute("height", "110");

    for (let i = 0; i < totalSegments; i++) {
      const angle = Math.PI + (i / (totalSegments - 1)) * Math.PI;
      const x1 = cx + Math.cos(angle) * (radius - 8);
      const y1 = cy + Math.sin(angle) * (radius - 8);
      const x2 = cx + Math.cos(angle) * radius;
      const y2 = cy + Math.sin(angle) * radius;

      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", i < filledSegments ? "var(--accent-primary)" : "var(--border-light)");
      line.setAttribute("stroke-width", "5");
      line.setAttribute("stroke-linecap", "round");
      svg.appendChild(line);
    }

    const wrap = document.createElement("div");
    wrap.className = "gauge-wrap";
    wrap.appendChild(svg);

    const percentLabel = document.createElement("div");
    percentLabel.className = "gauge-percent";
    percentLabel.textContent = percent.toFixed(1) + "%";
    wrap.appendChild(percentLabel);

    const subLabel = document.createElement("div");
    subLabel.className = "gauge-sublabel";
    subLabel.textContent = "Commandes réussies";
    wrap.appendChild(subLabel);

    container.appendChild(wrap);

    const statsRow = document.createElement("div");
    statsRow.className = "gauge-mini-stats";
    (stats || []).forEach(s => {
      const card = document.createElement("div");
      card.className = "gauge-mini-stat";
      card.innerHTML = '<span class="gauge-mini-stat-label"></span><span class="gauge-mini-stat-value"></span>';
      card.querySelector(".gauge-mini-stat-label").textContent = s.label;
      card.querySelector(".gauge-mini-stat-value").textContent = s.value;
      statsRow.appendChild(card);
    });
    container.appendChild(statsRow);
  }

  window.DashboardCharts = {
    renderRevenueBarChart: renderRevenueBarChart,
    renderSuccessGauge: renderSuccessGauge
  };
})();
