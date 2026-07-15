// file: src/_data/calendarComputed.js
const { DateTime } = require("luxon");

module.exports = function () {
  const calendarEvents = require("./calendar_events.json");
  const upcomingMatches = require("./upcoming_matches.json");
  const playedMatches = require("./played_matches.json");
  const zone = "Europe/Prague";
  const now = DateTime.now().setZone(zone).startOf("day");

  // Slugs of already played matches — exclude from upcoming
  const playedSlugs = new Set(
    (playedMatches.items || []).map((m) => m.slug).filter(Boolean)
  );

  const czMonths = [
    "", "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
    "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
  ];

  const czDaysShort = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

  const typeLabels = {
    training: "Trénink",
    tournament: "Turnaj",
    camp: "Soustředění",
    meeting: "Schůze",
    match: "Zápas",
    other: "Jiné"
  };

  const typeIcons = {
    training: "",
    tournament: "",
    camp: "",
    meeting: "",
    match: "",
    other: ""
  };

  function getCalendarItems(src) {
    if (!src || typeof src !== "object") return [];
    if (Array.isArray(src.items)) return src.items;
    if (src.data && Array.isArray(src.data.items)) return src.data.items;

    if (typeof src.raw === "string") {
      try {
        const parsed = JSON.parse(src.raw);
        if (Array.isArray(parsed.items)) return parsed.items;
        if (parsed.data && Array.isArray(parsed.data.items)) return parsed.data.items;
      } catch (_) {
        // ignore malformed raw payload and fall back to empty list
      }
    }
    return [];
  }

  // Calendar events — expand recurring ones
  const rawItems = getCalendarItems(calendarEvents);
  const events = [];
  for (const e of rawItems) {
    const date = (e.date || "").slice(0, 10);
    const dt = DateTime.fromISO(date, { zone });
    if (!dt.isValid) continue;

    const repeat = e.repeat || "none";
    const repeatUntilStr = (e.repeatUntil || "").slice(0, 10);
    const repeatUntil = repeatUntilStr ? DateTime.fromISO(repeatUntilStr, { zone }) : null;
    const step = repeat === "weekly" ? 7 : repeat === "biweekly" ? 14 : 0;

    // Generate occurrences
    let cursor = dt;
    const maxDate = repeatUntil && repeatUntil.isValid ? repeatUntil : cursor; // single occurrence when no repeat
    do {
      const oDate = cursor.toISODate();
      events.push({
        title: e.title,
        type: e.type || "other",
        typeLabel: typeLabels[e.type] || typeLabels.other,
        icon: typeIcons[e.type] || typeIcons.other,
        date: oDate,
        day: cursor.day,
        time: e.time || "",
        endTime: e.endTime || "",
        location: e.location || "",
        description: e.description || "",
        team: e.team || "",
        _dt: cursor
      });
      if (!step) break;
      cursor = cursor.plus({ days: step });
    } while (cursor <= maxDate);
  }

  // Upcoming matches as calendar items (exclude already played)
  const matches = (upcomingMatches.items || [])
    .filter((m) => !playedSlugs.has(m.slug))
    .map((m) => {
    const date = (m.date || "").slice(0, 10);
    const dt = DateTime.fromISO(date, { zone });
    const title = `${m.home || "?"} vs ${m.away || "?"}`;
    return {
      title,
      type: "match",
      typeLabel: typeLabels.match,
      icon: typeIcons.match,
      date,
      day: dt.isValid ? dt.day : 0,
      time: m.time || "",
      endTime: "",
      location: m.venue || "",
      description: m.competition || "",
      team: m.team || "",
      _dt: dt.isValid ? dt : null
    };
  });

  const all = [...events, ...matches]
    .filter((e) => e._dt)
    .sort((a, b) => a._dt.toMillis() - b._dt.toMillis());

  // Upcoming events shown in sidebar: next 30 days for all types
  const monthAhead = now.plus({ days: 30 });
  const upcomingEvents = all.filter((e) => e._dt >= now && e._dt <= monthAhead);

  // Group by month key "YYYY-MM"
  const eventsByDate = {};
  all.forEach((e) => {
    const key = e.date; // "YYYY-MM-DD"
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(e);
  });

  // Build months: current month + next 2 months
  const months = [];
  for (let offset = 0; offset < 3; offset++) {
    const monthStart = now.startOf("month").plus({ months: offset });
    const year = monthStart.year;
    const month = monthStart.month;
    const daysInMonth = monthStart.daysInMonth;
    // weekday: 1=Mon ... 7=Sun (ISO)
    const firstWeekday = monthStart.weekday; // 1-based, Mon=1

    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const label = `${czMonths[month]} ${year}`;

    // Build grid cells: leading empty + days
    const cells = [];
    // Empty cells before first day (Mon=1 means 0 empties, Tue=2 means 1 empty, etc.)
    for (let i = 1; i < firstWeekday; i++) {
      cells.push({ empty: true });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayDt = DateTime.fromISO(dateStr, { zone });
      const isToday = dateStr === now.toISODate();
      const isPast = dayDt < now;
      const isWeekend = dayDt.weekday >= 6;
      const dayEvents = eventsByDate[dateStr] || [];
      cells.push({
        empty: false,
        day: d,
        date: dateStr,
        isToday,
        isPast,
        isWeekend,
        events: dayEvents
      });
    }

    // Build rows of 7 cells for easy table rendering
    const rows = [];
    let row = [];
    for (let i = 0; i < cells.length; i++) {
      row.push(cells[i]);
      if (row.length === 7) {
        rows.push(row);
        row = [];
      }
    }
    // Pad last row with empty cells
    while (row.length > 0 && row.length < 7) {
      row.push({ empty: true });
    }
    if (row.length) rows.push(row);

    months.push({
      key: monthKey,
      label,
      year,
      month,
      rows,
      active: offset === 0
    });
  }

  return {
    months,
    dayHeaders: czDaysShort,
    allEvents: all,
    upcomingEvents
  };
};
