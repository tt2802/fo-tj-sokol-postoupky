// file: src/_data/matchesComputed.js
const { DateTime } = require("luxon");

module.exports = function () {
  const raw = require("./matches.json");
  const items = Array.isArray(raw?.items) ? raw.items : [];
  const zone = "Europe/Prague";

  const normalized = items
    .map((m) => {
      const date = (m.date || "").slice(0, 10);
      const time = (m.time || "00:00").trim();
      const dt = DateTime.fromFormat(`${date} ${time}`, "yyyy-MM-dd H:mm", { zone });
      const dtFallback = DateTime.fromISO(date, { zone });
      const finalDt = dt.isValid ? dt : dtFallback;

      return {
        ...m,
        _dateStr: date,
        _dt: finalDt.isValid ? finalDt : null,
        _teamLabel: m.team === "muzi" ? "Muži" : "Mládež"
      };
    })
    .filter((m) => m._dt)
    .sort((a, b) => a._dt.toMillis() - b._dt.toMillis());

  const now = DateTime.now().setZone(zone);

  const upcoming = normalized.filter((m) => m._dt >= now.startOf("day"));

  const played = normalized
    .filter((m) => Number.isFinite(m.homeScore) && Number.isFinite(m.awayScore))
    .sort((a, b) => b._dt.toMillis() - a._dt.toMillis());

  const nextMatch = upcoming[0] || null;
  const lastResult = played[0] || null;

  const seasons = Array.from(new Set(normalized.map((m) => m.season).filter(Boolean))).sort().reverse();

  return {
    nextMatch,
    lastResult,
    upcoming,
    played,
    seasons
  };
};
