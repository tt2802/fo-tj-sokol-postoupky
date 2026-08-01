/**
 * Computed player statistics — aggregates goals, assists, cards, appearances
 * from played_matches.json automatically. No manual entry needed.
 */
const { extractArrayPayload } = require("./adminPayload.js");

module.exports = function () {
  const playedMatches = require("./played_matches.json");
  const playersData = require("./players.json");
  const players = playersData.men || [];
  const matches = extractArrayPayload(playedMatches, "items");

  // Normalise name for matching (strip diacritics, lowercase)
  function norm(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  // Simple Levenshtein distance
  function lev(a, b) {
    const m = a.length, n = b.length;
    const d = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        d[i][j] = a[i - 1] === b[j - 1]
          ? d[i - 1][j - 1]
          : 1 + Math.min(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1]);
      }
    }
    return d[m][n];
  }

  // Resolve a name from a match field to a canonical player name
  function resolve(inputName) {
    if (!inputName) return null;
    const input = norm(inputName);
    // exact match (normalised)
    for (const p of players) {
      if (norm(p.name) === input) return p.name;
    }
    // contains match
    for (const p of players) {
      const pn = norm(p.name);
      if (pn.includes(input) || input.includes(pn)) return p.name;
    }
    // partial (any word)
    for (const p of players) {
      const parts = norm(p.name).split(/\s+/);
      for (const part of parts) {
        if (part === input) return p.name;
      }
    }
    // fuzzy (Levenshtein ≤ 2 on any word)
    let best = null, bestDist = 3;
    for (const p of players) {
      const parts = norm(p.name).split(/\s+/);
      for (const part of parts) {
        const d = lev(input, part);
        if (d < bestDist) { bestDist = d; best = p.name; }
      }
    }
    return best;
  }

  // Init stats for all players
  const stats = {};
  for (const p of players) {
    stats[p.name] = {
      name: p.name,
      number: p.number || null,
      position: p.position || "",
      matches: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0
    };
  }

  // Process each played match (men only = team "muzi")
  for (const match of matches) {
    if (match.team !== "muzi") continue;

    // Appearances from lineup
    const lineup = match.lineup || [];
    const inLineup = new Set();
    for (const entry of lineup) {
      const raw = typeof entry === "string" ? entry : (entry.player || "");
      const resolved = resolve(raw);
      if (resolved) {
        inLineup.add(resolved);
        if (stats[resolved]) stats[resolved].matches++;
      }
    }

    // Goals from scorers
    const scorers = match.scorers || [];
    for (const s of scorers) {
      const raw = typeof s === "string" ? s : (s.scorer || "");
      const resolved = resolve(raw);
      if (resolved && stats[resolved]) {
        stats[resolved].goals++;
        // If player scored but wasn't in lineup, count appearance
        if (!inLineup.has(resolved)) {
          inLineup.add(resolved);
          stats[resolved].matches++;
        }
      }
    }

    // Assists
    const assists = match.assists || [];
    for (const a of assists) {
      const raw = typeof a === "string" ? a : (a.player || "");
      const resolved = resolve(raw);
      if (resolved && stats[resolved]) {
        stats[resolved].assists++;
        if (!inLineup.has(resolved)) {
          inLineup.add(resolved);
          stats[resolved].matches++;
        }
      }
    }

    // Cards
    const cards = match.cards || [];
    for (const c of cards) {
      const raw = c.player || "";
      const resolved = resolve(raw);
      if (resolved && stats[resolved]) {
        if (c.cardType === "yellow") stats[resolved].yellowCards++;
        else if (c.cardType === "red") stats[resolved].redCards++;
        if (!inLineup.has(resolved)) {
          inLineup.add(resolved);
          stats[resolved].matches++;
        }
      }
    }
  }

  // Return sorted by goals (desc), then assists, then name
  const list = Object.values(stats).sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.assists !== a.assists) return b.assists - a.assists;
    return a.name.localeCompare(b.name, "cs");
  });

  return { men: list };
};
