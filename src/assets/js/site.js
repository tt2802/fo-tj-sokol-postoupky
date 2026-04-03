// file: src/assets/js/site.js
(function () {
  const btn = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#mainNav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // dropdown toggles
  const drops = document.querySelectorAll(".dropdown");
  drops.forEach((d) => {
    const toggle = d.querySelector(".dropdown-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      drops.forEach((other) => {
        if (other !== d) {
          other.classList.remove("open");
          const ot = other.querySelector(".dropdown-toggle");
          if (ot) ot.setAttribute("aria-expanded", "false");
        }
      });
      const open = d.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  // close dropdowns on outside click
  document.addEventListener("click", () => {
    drops.forEach((d) => {
      d.classList.remove("open");
      const t = d.querySelector(".dropdown-toggle");
      if (t) t.setAttribute("aria-expanded", "false");
    });
  });

  // ===== DARK MODE TOGGLE =====
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    // Restore saved preference (default is light)
    const saved = localStorage.getItem("theme");
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
    }
    // Update icon — handled by CSS visibility of .theme-icon--moon / .theme-icon--sun
    function updateIcon() {}
    updateIcon();

    themeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const next = isDark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      updateIcon();
    });
  }
})();
