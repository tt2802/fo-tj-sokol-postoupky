// file: src/assets/js/matches-filter.js
// Skript pro filtrování seznamu zápasů a embed videí
// Pozor: soubor byl upraven, aby neobsahoval duplicitní kód (dříve se část kódu opakovala). 
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

  function renderVideoEmbeds() {
    const boxes = Array.from(document.querySelectorAll(".video-embed[data-video-url]"));
    if (!boxes.length) return;

    boxes.forEach((box) => {
      const url = (box.getAttribute("data-video-url") || "").trim();
      if (!url) return;

      const lower = url.toLowerCase();

      // MP4 / WEBM
      if (lower.endsWith(".mp4") || lower.endsWith(".webm")) {
        const video = document.createElement("video");
        video.controls = true;
        video.preload = "metadata";
        video.style.width = "100%";
        video.src = url;
        box.appendChild(video);
        return;
      }

      // YouTube
      const ytMatch =
        url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/) ||
        url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);

      if (ytMatch && ytMatch[1]) {
        const id = ytMatch[1];
        const iframe = document.createElement("iframe");
        iframe.width = "560";
        iframe.height = "315";
        iframe.style.width = "100%";
        iframe.style.aspectRatio = "16 / 9";
        iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id);
        iframe.title = "Video ze zápasu";
        iframe.loading = "lazy";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        box.appendChild(iframe);
        return;
      }

      // Facebook (bez SDK: jednoduchý embed přes plugin)
      if (lower.includes("facebook.com")) {
        const iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.aspectRatio = "16 / 9";
        iframe.loading = "lazy";
        iframe.allow = "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.src =
          "https://www.facebook.com/plugins/video.php?href=" +
          encodeURIComponent(url) +
          "&show_text=false&width=560";
        iframe.title = "Video ze zápasu (Facebook)";
        box.appendChild(iframe);
        return;
      }

      // Fallback
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = url;
      a.textContent = "Otevřít video";
      a.rel = "noopener";
      a.target = "_blank";
      p.appendChild(a);
      box.appendChild(p);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initFilters();
    renderVideoEmbeds();
  });
})();
