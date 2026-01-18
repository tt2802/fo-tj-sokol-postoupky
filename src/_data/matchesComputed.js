// file: src/_data/matchesComputed.js
module.exports = function () {
  const raw = require("./matches.json");
  const items = Array.isArray(raw?.items) ? raw.items : [];

  // Normalizace datumu
  const parsed = items
    .map((m) => {
      const dateStr = (m.date || "").slice(0, 10); // "YYYY-MM-DD"
      const dateObj = dateStr ? new Date(dateStr + "T00:00:00Z") : null;
      return { ...m, _dateStr: dateStr, _dateObj: dateObj };
    })
    .filter((m) => m._dateObj && !Number.isNaN(m._dateObj.getTime()))
    .sort((a, b) => a._dateObj - b._dateObj);

  const today = new Date();
  const todayMidnight = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  // Nejbližší = dnes nebo budoucnost
  const nextMatch = parsed.find((m) => m._dateObj >= todayMidnight) || null;

  // Odehrané = má skóre (stačí jedna strana), a datum je v minulosti nebo dnes
  const played = parsed
    .filter((m) => (m.homeScore !== undefined && m.homeScore !== null) || (m.awayScore !== undefined && m.awayScore !== null))
    .filter((m) => m._dateObj <= todayMidnight)
    .sort((a, b) => b._dateObj - a._dateObj);

  const lastResult = played[0] || null;

  return {
    nextMatch,
    lastResult
  };
};
