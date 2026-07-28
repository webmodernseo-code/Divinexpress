(function () {
  "use strict";

  function setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const panels = document.querySelectorAll(".workspace-panel");

    navItems.forEach(item => {
      item.addEventListener("click", () => {
        navItems.forEach(n => n.classList.remove("active"));
        item.classList.add("active");
        const target = item.getAttribute("data-target");
        panels.forEach(p => p.classList.toggle("active", p.id === target));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", setupNavigation);
})();
