// file: src/_data/calendarComputed.js
const { DateTime } = require("luxon");

module.exports = function () {
  const calendarEvents = require("./calendar_events.json");
  const upcomingMatches = require("./upcoming_matches.json");
  const zone = "Europe/Prague";
  const now = DateTime.now().setZone(zone).startOf("day");

  const typeLabels = {
    training: "Trénink",
    tournament: "Turnaj",
    camp: "Soustředění",
    meeting: "Schůze",
    match: "Zápas",
    other: "Jiné"
  };

  const typeIcons = {
    training: "🏃",
    tournament: "🏆",
    camp: "⛺",
    meeting: "📋",
    match: "⚽",
    other: "📅"
  };

  // Calendar events
  const events = (calendarEvents.items || []).map((e) => {
    const date = (e.date || "").slice(0, 10);
    const dt = DateTime.fromISO(date, { zone });
    return {
      title: e.title,
      type: e.type || "other",
      typeLabel: typeLabels[e.type] || typeLabels.other,
      icon: typeIcons[e.type] || typeIcons.other,
      date,
      time: e.time || "",
      endTime: e.endTime || "",
      location: e.location || "",
      description: e.description || "",
      team: e.team || "",
      _dt: dt.isValid ? dt : null
    };
  });

  // Upcoming matches as calendar items
  const matches = (upcomingMatches.items || []).map((m) => {
    const date = (m.date || "").slice(0, 10);
    const dt = DateTime.fromISO(date, { zone });
    const title = `${m.home || "?"} vs ${m.away || "?"}`;
    return {
      title,
      type: "match",
      typeLabel: typeLabels.match,
      icon: typeIcons.match,
      date,
      time: m.time || "",
      endTime: "",
      location: m.venue || "",
      description: m.competition || "",
      team: m.team || "",
      _dt: dt.isValid ? dt : null
    };
  });

  const all = [...events, ...matches]
    .filter((e) => e._dt && e._dt >= now)
    .sort((a, b) => a._dt.toMillis() - b._dt.toMillis());

  return all;
};
