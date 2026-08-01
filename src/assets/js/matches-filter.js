// file: src/assets/js/matches-filter.js
// Skript pro filtrování seznamu zápasů
(function () {
  function uniq(arr) {
    return Array.from(new Set(arr)).filter(Boolean);
  }

  function normalize(s) {
    return (s || "").toString().trim();
  }

  function initFilters() {
    const controls = document.querySelector("[data-matches-controls]");
    if (!controls) return;

    const selects = controls.querySelectorAll("select[data-filter]");
    const seasonSelect = controls.querySelector('select[data-filter="season"]');
    const compSelect = controls.querySelector('select[data-filter="competition"]');

    const cards = Array.from(document.querySelectorAll(".match-card"));
    if (!cards.length) return;

    const seasons = uniq(cards.map((c) => normalize(c.dataset.season))).sort().reverse();
    const comps = uniq(cards.map((c) => normalize(c.dataset.competition))).sort();

    for (const s of seasons) {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      seasonSelect.appendChild(opt);
    }

    for (const c of comps) {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      compSelect.appendChild(opt);
    }

    function apply() {
      const filters = {};
      selects.forEach((sel) => {
        filters[sel.dataset.filter] = normalize(sel.value);
      });

      cards.forEach((card) => {
        const okTeam = !filters.team || normalize(card.dataset.team) === filters.team;
        const okSeason = !filters.season || normalize(card.dataset.season) === filters.season;
        const okComp = !filters.competition || normalize(card.dataset.competition) === filters.competition;

        card.style.display = okTeam && okSeason && okComp ? "" : "none";
      });
    }

    selects.forEach((sel) => sel.addEventListener("change", apply));
    apply();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initFilters();
  });
})();
