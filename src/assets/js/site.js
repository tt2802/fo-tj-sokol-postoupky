// file: src/assets/js/site.js
(function () {
  const btn = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#mainNav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
})();
