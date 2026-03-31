// Robust auto-fill for Decap CMS: copy fields from selected upcoming match to played match form.
(function () {
  const logPrefix = "[CMS AutoFill]";
  const state = {
    upcomingMatches: [],
    matchKeys: new Map(),
    attachedInputs: new WeakSet(),
    inputScopes: new WeakMap(),
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

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function formatDateToCz(dateValue) {
    const date = normalizeDate(dateValue);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
    const [y, m, d] = date.split("-");
    return `${d}.${m}.${y}`;
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

  function resolveMatchFromSelection(rawSelection) {
    const selection = String(rawSelection || "").trim();
    if (!selection) return null;

    // 1) Exact key lookup (slug/id/fallback key)
    const byKey = state.matchKeys.get(selection);
    if (byKey) return byKey;

    // 2) Fuzzy lookup from display text (date + home + away)
    const selectionNorm = normalizeText(selection);
    if (!selectionNorm) return null;

    let bestMatch = null;
    let bestScore = -1;

    for (const m of state.upcomingMatches) {
      if (!m) continue;

      const homeNorm = normalizeText(m.home);
      const awayNorm = normalizeText(m.away);
      const isoNorm = normalizeText(normalizeDate(m.date));
      const czNorm = normalizeText(formatDateToCz(m.date));

      let score = 0;
      if (homeNorm && selectionNorm.includes(homeNorm)) score += 3;
      if (awayNorm && selectionNorm.includes(awayNorm)) score += 3;
      if (isoNorm && selectionNorm.includes(isoNorm)) score += 2;
      if (czNorm && selectionNorm.includes(czNorm)) score += 2;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = m;
      }
    }

    // Require at least teams match (3+3) or strong combined score
    if (bestScore >= 6) return bestMatch;
    return null;
  }

  function findFieldByLabel(labelText, scopeRoot = document) {
    const labels = Array.from(scopeRoot.querySelectorAll("label, span"));
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

  function findFormField(fieldName, scopeRoot = document) {
    return (
      scopeRoot.querySelector(`input[id*="${fieldName}"]`) ||
      scopeRoot.querySelector(`select[id*="${fieldName}"]`) ||
      scopeRoot.querySelector(`textarea[id*="${fieldName}"]`) ||
      scopeRoot.querySelector(`input[name="${fieldName}"]`) ||
      scopeRoot.querySelector(`select[name="${fieldName}"]`) ||
      scopeRoot.querySelector(`textarea[name="${fieldName}"]`)
    );
  }

  function findEntryScope(sourceInput) {
    if (!sourceInput) return document;

    let node = sourceInput;
    while (node && node !== document.body) {
      const hasRelated = node.querySelector('input[name*="relatedUpcoming"], select[name*="relatedUpcoming"], input[id*="relatedUpcoming"], select[id*="relatedUpcoming"]');
      const hasHome = node.querySelector('input[name*="home"], input[id*="home"], textarea[name*="home"]');
      const hasAway = node.querySelector('input[name*="away"], input[id*="away"], textarea[name*="away"]');
      if (hasRelated && (hasHome || hasAway)) {
        return node;
      }
      node = node.parentElement;
    }

    return document;
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

  function fillField(fieldName, value, scopeRoot = document) {
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

    let input = findFormField(fieldName, scopeRoot);
    if (!input && labelMap[fieldName]) {
      input = findFieldByLabel(labelMap[fieldName], scopeRoot);
    }

    if (!input) {
      warn(`Field not found: ${fieldName}`);
      return;
    }

    const finalValue = fieldName === "date" ? normalizeDate(value) : value;
    setReactFieldValue(input, finalValue);
    log(`Filled ${fieldName}:`, finalValue);
  }

  function autoFillFromSlug(slug, sourceInput = null) {
    const safeSlug = String(slug || "").trim();
    if (!safeSlug) return;

    const scopeRoot = sourceInput ? (state.inputScopes.get(sourceInput) || findEntryScope(sourceInput)) : document;

    const match = resolveMatchFromSelection(safeSlug);
    if (!match) {
      warn("No upcoming match found for selection:", safeSlug);
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
      setTimeout(() => fillField(fieldName, value, scopeRoot), index * 40);
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
    const sourceInput = event?.target || null;
    const currentValue = String(event?.target?.value || "").trim();
    if (!currentValue || currentValue === state.relationValue) return;
    state.relationValue = currentValue;
    autoFillFromSlug(currentValue, sourceInput);
  }

  function attachRelationListeners() {
    const relationInputByLabel = findFieldByLabel("Převzít z nadcházejícího");
    const inputs = [...getRelationInputCandidates(), relationInputByLabel].filter(Boolean);

    inputs.forEach((input) => {
      if (state.attachedInputs.has(input)) return;
      state.attachedInputs.add(input);
      state.inputScopes.set(input, findEntryScope(input));
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

  function fillItemFromRelatedUpcoming(item) {
    if (!item || typeof item !== "object") return item;

    const relationValue = String(item.relatedUpcoming || "").trim();
    if (!relationValue) return item;

    const match = resolveMatchFromSelection(relationValue);
    if (!match) return item;

    const next = { ...item };
    const fieldMap = {
      team: match.team,
      category: match.category,
      season: match.season,
      competition: match.competition,
      round: match.round,
      date: normalizeDate(match.date),
      home: match.home,
      away: match.away,
      isHome: match.isHome,
      venue: match.venue
    };

    Object.entries(fieldMap).forEach(([key, value]) => {
      // Fill only empty fields so manual edits are preserved.
      if ((next[key] === undefined || next[key] === null || next[key] === "") && value !== undefined && value !== null && value !== "") {
        next[key] = value;
      }
    });

    return next;
  }

  function registerPreSaveAutofillHook() {
    if (!window.CMS || typeof window.CMS.registerEventListener !== "function") {
      return false;
    }

    window.CMS.registerEventListener({
      name: "preSave",
      handler: ({ entry }) => {
        try {
          if (!entry || typeof entry.get !== "function") return entry;

          const path = String(entry.get("path") || "");
          if (!path.endsWith("src/_data/played_matches.json")) return entry;

          const items = entry.getIn(["data", "items"]);
          if (!items || typeof items.map !== "function") return entry;

          const updatedItems = items.map((itemMap) => {
            const itemJs = typeof itemMap?.toJS === "function" ? itemMap.toJS() : itemMap;
            const updatedJs = fillItemFromRelatedUpcoming(itemJs);
            if (typeof itemMap?.merge === "function") {
              return itemMap.merge(updatedJs);
            }
            return itemMap;
          });

          log("preSave autofill applied for played_matches");
          return entry.setIn(["data", "items"], updatedItems);
        } catch (err) {
          warn("preSave autofill failed:", err?.message || err);
          return entry;
        }
      }
    });

    log("Registered preSave autofill hook");
    return true;
  }

  function ensurePreSaveHookRegistered() {
    if (registerPreSaveAutofillHook()) return;

    let attempts = 0;
    const maxAttempts = 40;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (registerPreSaveAutofillHook() || attempts >= maxAttempts) {
        window.clearInterval(timer);
      }
    }, 250);
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
    ensurePreSaveHookRegistered();

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
