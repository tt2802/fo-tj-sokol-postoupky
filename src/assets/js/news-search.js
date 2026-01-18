(function () {
  const input = document.getElementById("newsSearch");
  const list = document.getElementById("newsList");
  if (!input || !list) return;

  const items = Array.from(list.querySelectorAll("li[data-title]"));

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    for (const item of items) {
      const title = item.getAttribute("data-title") || "";
      item.style.display = title.includes(q) ? "" : "none";
    }
  });
})();
