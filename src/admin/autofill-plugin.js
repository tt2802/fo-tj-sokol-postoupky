// Robust auto-fill for Decap CMS: copy fields from selected upcoming match to played match form.
(function () {
  const logPrefix = "[CMS AutoFill]";
  const state = {
    upcomingMatches: [],
    matchKeys: new Map(),
    attachedInputs: new WeakSet(),
    relationValue: "",
    initialized: false,
    intervalId: null
  };

  function log(...args) {
    console.log(logPrefix, ...args);
  }

  function warn(...args) {
    console.warn(logPrefix, ...args);
  }

  async function fetchJsonWithFallback(urls) {
    for (const url of urls) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return { data, url };
      } catch (err) {
        warn(`Fetch failed for ${url}:`, err.message || err);
      }
    }
    return { data: null, url: null };
  }

  function getPathPrefixFromAdminUrl() {
    const path = String(window.location.pathname || "");
    const adminIndex = path.indexOf("/admin/");
    if (adminIndex === -1) return "";
    return path.slice(0, adminIndex);
  }

  function normalizeDate(value) {
    if (!value) return value;
    const str = String(value);
    return str.length >= 10 ? str.slice(0, 10) : str;
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
  }

  function buildFallbackMatchKey(match) {
    const date = normalizeDate(match?.date || "");
    const home = slugify(match?.home || "");
    const away = slugify(match?.away || "");
    if (!date || !home || !away) return "";
    return `${date}-${home}-${away}`;
  }

  function indexMatches(matches) {
    state.matchKeys = new Map();
    (matches || []).forEach((m) => {
      if (!m) return;
      const keys = [m.slug, m.id, buildFallbackMatchKey(m)]
        .map((k) => String(k || "").trim())
        .filter(Boolean);

      keys.forEach((key) => state.matchKeys.set(key, m));
    });
  }

  function findFieldByLabel(labelText) {
    const labels = Array.from(document.querySelectorAll("label, span"));
    for (const label of labels) {
      if ((label.textContent || "").includes(labelText)) {
        const container = label.closest('[class*="field"]') || label.closest("div");
        if (container) {
          return container.querySelector("input, select, textarea");
        }
      }
    }
    return null;
  }

  function findFormField(fieldName) {
    return (
      document.querySelector(`input[id*="${fieldName}"]`) ||
      document.querySelector(`select[id*="${fieldName}"]`) ||
      document.querySelector(`textarea[id*="${fieldName}"]`) ||
      document.querySelector(`input[name="${fieldName}"]`) ||
      document.querySelector(`select[name="${fieldName}"]`) ||
      document.querySelector(`textarea[name="${fieldName}"]`)
    );
  }

  function setReactFieldValue(element, value) {
    if (!element) return;

    if (element.type === "checkbox") {
      element.checked = Boolean(value);
    } else {
      const valueSetter =
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set ||
        Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")?.set ||
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;

      if (valueSetter) {
        valueSetter.call(element, value);
      } else {
        element.value = value;
      }
    }

    ["input", "change", "blur"].forEach((eventType) => {
      element.dispatchEvent(new Event(eventType, { bubbles: true }));
    });
  }

  function fillField(fieldName, value) {
    if (value === null || value === undefined || value === "") return;

    const labelMap = {
      team: "Tým",
      category: "Kategorie",
      season: "Sezóna",
      competition: "Soutěž",
      round: "Kolo",
      date: "Datum",
      home: "Domácí",
      away: "Hosté",
      isHome: "Jsme doma",
      venue: "Místo utkání"
    };

    let input = findFormField(fieldName);
    if (!input && labelMap[fieldName]) {
      input = findFieldByLabel(labelMap[fieldName]);
    }

    if (!input) {
      warn(`Field not found: ${fieldName}`);
      return;
    }

    const finalValue = fieldName === "date" ? normalizeDate(value) : value;
    setReactFieldValue(input, finalValue);
    log(`Filled ${fieldName}:`, finalValue);
  }

  function autoFillFromSlug(slug) {
    const safeSlug = String(slug || "").trim();
    if (!safeSlug) return;

    const match = state.matchKeys.get(safeSlug) || state.upcomingMatches.find((m) => m && m.slug === safeSlug);
    if (!match) {
      warn("No upcoming match found for key:", safeSlug);
      return;
    }

    log("Applying autofill from:", safeSlug);

    const fieldsToFill = [
      ["team", match.team],
      ["category", match.category],
      ["season", match.season],
      ["competition", match.competition],
      ["round", match.round],
      ["date", match.date],
      ["home", match.home],
      ["away", match.away],
      ["isHome", match.isHome],
      ["venue", match.venue]
    ];

    fieldsToFill.forEach(([fieldName, value], index) => {
      setTimeout(() => fillField(fieldName, value), index * 40);
    });
  }

  function getRelationInputCandidates() {
    return [
      ...document.querySelectorAll('select[id*="relatedUpcoming"], input[id*="relatedUpcoming"]'),
      ...document.querySelectorAll('select[name*="relatedUpcoming"], input[name*="relatedUpcoming"], textarea[name*="relatedUpcoming"]')
    ];
  }

  function valueLooksLikeMatchKey(value) {
    const v = String(value || "").trim();
    if (!v) return false;
    if (state.matchKeys.has(v)) return true;
    // Common relation display string often contains separators; skip these
    if (v.includes(" · ")) return false;
    return /^[a-z0-9][a-z0-9-]{5,}$/i.test(v);
  }

  function getCurrentRelationValue() {
    const relationInputByLabel = findFieldByLabel("Převzít z nadcházejícího");
    const inputs = [...getRelationInputCandidates(), relationInputByLabel].filter(Boolean);

    for (const input of inputs) {
      const value = String(input.value || "").trim();
      if (valueLooksLikeMatchKey(value)) return value;
    }

    for (const input of inputs) {
      const value = String(input.value || "").trim();
      if (value) return value;
    }

    return "";
  }

  function onRelationChanged(event) {
    const currentValue = String(event?.target?.value || "").trim();
    if (!currentValue || currentValue === state.relationValue) return;
    state.relationValue = currentValue;
    autoFillFromSlug(currentValue);
  }

  function attachRelationListeners() {
    const relationInputByLabel = findFieldByLabel("Převzít z nadcházejícího");
    const inputs = [...getRelationInputCandidates(), relationInputByLabel].filter(Boolean);

    inputs.forEach((input) => {
      if (state.attachedInputs.has(input)) return;
      state.attachedInputs.add(input);
      input.addEventListener("change", onRelationChanged);
      input.addEventListener("input", onRelationChanged);
      input.addEventListener("blur", onRelationChanged);
      log("Attached listener to relation field");
    });
  }

  function startPollingFallback() {
    if (state.intervalId) return;
    state.intervalId = window.setInterval(() => {
      const currentValue = getCurrentRelationValue();
      if (!currentValue || currentValue === state.relationValue) return;
      state.relationValue = currentValue;
      autoFillFromSlug(currentValue);
    }, 400);
  }

  async function initialize() {
    if (state.initialized) return;
    state.initialized = true;

    const pathPrefix = getPathPrefixFromAdminUrl();
    const prefixedDataUrl = pathPrefix ? `${pathPrefix}/_data/upcoming_matches.json` : "";

    const { data, url } = await fetchJsonWithFallback([
      prefixedDataUrl,
      "../_data/upcoming_matches.json",
      "/_data/upcoming_matches.json"
    ].filter(Boolean));

    state.upcomingMatches = Array.isArray(data?.items) ? data.items : [];
    indexMatches(state.upcomingMatches);
    if (!state.upcomingMatches.length) {
      warn("No upcoming matches available for auto-fill.");
    } else {
      log(`Loaded ${state.upcomingMatches.length} upcoming matches from ${url}`);
    }

    attachRelationListeners();
    startPollingFallback();

    const observer = new MutationObserver(() => {
      attachRelationListeners();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
