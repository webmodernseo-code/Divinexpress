(function () {
  "use strict";

  const ICONS = {
    orange: '<svg viewBox="0 0 40 40" width="20" height="20"><rect width="40" height="40" rx="8" fill="#FF7900"/><path d="M17 19h6v2h-6zm0 4h6v2h-6z" fill="#ffffff"/></svg>',
    mtn: '<svg viewBox="0 0 40 40" width="20" height="20"><rect width="40" height="40" rx="8" fill="#FFCC00"/><ellipse cx="20" cy="20" rx="14" ry="10" fill="#003399"/><text x="20" y="23" dominant-baseline="middle" text-anchor="middle" fill="#FFCC00" font-family="sans-serif" font-weight="900" font-size="8">MTN</text></svg>',
    wave: '<svg viewBox="0 0 40 40" width="20" height="20"><rect width="40" height="40" rx="8" fill="#1B4ECF"/><path d="M10 18c4-6 6-6 10 0s6 6 10 0" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>',
    card: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2 10h20"/></svg>'
  };

  function keyForLabel(label) {
    const l = (label || "").toLowerCase();
    if (l.indexOf("orange") !== -1) return "orange";
    if (l.indexOf("mtn") !== -1) return "mtn";
    if (l.indexOf("wave") !== -1) return "wave";
    return "card";
  }

  function forMethodLabel(label) {
    const span = document.createElement("span");
    span.className = "payment-method-pill";
    const iconWrap = document.createElement("span");
    iconWrap.innerHTML = ICONS[keyForLabel(label)];
    const text = document.createElement("span");
    text.textContent = label;
    span.appendChild(iconWrap);
    span.appendChild(text);
    return span.outerHTML;
  }

  window.PaymentIcons = { icons: ICONS, forMethodLabel: forMethodLabel };
})();
