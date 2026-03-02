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
    toggle.addEventListener("click", () => {
      const open = d.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
})();
