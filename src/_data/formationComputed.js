/**
 * Computed formation data – maps slots to % positions on pitch
 * and merges player info from players.json.
 */
module.exports = function () {
  const formation = require("./formation.json");
  const playersData = require("./players.json");
  const players = playersData.men || [];
  const formationName = formation.formation || "4-4-2";
  const slots = formation.positions || [];

  // Slot → {top%, left%} for each formation
  // Pitch is oriented vertically: GK at bottom, attackers at top
  const layouts = {
    "4-4-2": {
      GK:  { top: 90, left: 50 },
      LB:  { top: 72, left: 15 },
      CB1: { top: 74, left: 37 },
      CB2: { top: 74, left: 63 },
      RB:  { top: 72, left: 85 },
      LM:  { top: 48, left: 15 },
      CM1: { top: 50, left: 37 },
      CM2: { top: 50, left: 63 },
      RM:  { top: 48, left: 85 },
      ST1: { top: 22, left: 35 },
      ST2: { top: 22, left: 65 }
    },
    "4-3-3": {
      GK:  { top: 90, left: 50 },
      LB:  { top: 72, left: 15 },
      CB1: { top: 74, left: 37 },
      CB2: { top: 74, left: 63 },
      RB:  { top: 72, left: 85 },
      CM1: { top: 52, left: 25 },
      CM2: { top: 48, left: 50 },
      CM3: { top: 52, left: 75 },
      LW:  { top: 22, left: 18 },
      CF:  { top: 18, left: 50 },
      RW:  { top: 22, left: 82 }
    },
    "4-2-3-1": {
      GK:  { top: 90, left: 50 },
      LB:  { top: 72, left: 15 },
      CB1: { top: 74, left: 37 },
      CB2: { top: 74, left: 63 },
      RB:  { top: 72, left: 85 },
      CDM: { top: 58, left: 35 },
      CDM2:{ top: 58, left: 65 },
      LM:  { top: 38, left: 18 },
      CAM: { top: 36, left: 50 },
      RM:  { top: 38, left: 82 },
      CF:  { top: 16, left: 50 }
    },
    "3-5-2": {
      GK:  { top: 90, left: 50 },
      CB1: { top: 74, left: 25 },
      CB2: { top: 74, left: 50 },
      CB3: { top: 74, left: 75 },
      LWB: { top: 52, left: 10 },
      CM1: { top: 55, left: 32 },
      CM2: { top: 50, left: 50 },
      CM3: { top: 55, left: 68 },
      RWB: { top: 52, left: 90 },
      ST1: { top: 22, left: 35 },
      ST2: { top: 22, left: 65 }
    },
    "3-4-3": {
      GK:  { top: 90, left: 50 },
      CB1: { top: 74, left: 25 },
      CB2: { top: 74, left: 50 },
      CB3: { top: 74, left: 75 },
      LM:  { top: 50, left: 15 },
      CM1: { top: 52, left: 38 },
      CM2: { top: 52, left: 62 },
      RM:  { top: 50, left: 85 },
      LW:  { top: 22, left: 18 },
      CF:  { top: 18, left: 50 },
      RW:  { top: 22, left: 82 }
    },
    "5-3-2": {
      GK:  { top: 90, left: 50 },
      LWB: { top: 68, left: 8 },
      CB1: { top: 74, left: 27 },
      CB2: { top: 76, left: 50 },
      CB3: { top: 74, left: 73 },
      RWB: { top: 68, left: 92 },
      CM1: { top: 50, left: 25 },
      CM2: { top: 48, left: 50 },
      CM3: { top: 50, left: 75 },
      ST1: { top: 22, left: 35 },
      ST2: { top: 22, left: 65 }
    },
    "5-4-1": {
      GK:  { top: 90, left: 50 },
      LWB: { top: 68, left: 8 },
      CB1: { top: 74, left: 27 },
      CB2: { top: 76, left: 50 },
      CB3: { top: 74, left: 73 },
      RWB: { top: 68, left: 92 },
      LM:  { top: 46, left: 15 },
      CM1: { top: 48, left: 38 },
      CM2: { top: 48, left: 62 },
      RM:  { top: 46, left: 85 },
      CF:  { top: 18, left: 50 }
    },
    "4-1-4-1": {
      GK:  { top: 90, left: 50 },
      LB:  { top: 72, left: 15 },
      CB1: { top: 74, left: 37 },
      CB2: { top: 74, left: 63 },
      RB:  { top: 72, left: 85 },
      CDM: { top: 60, left: 50 },
      LM:  { top: 40, left: 15 },
      CM1: { top: 42, left: 38 },
      CM2: { top: 42, left: 62 },
      RM:  { top: 40, left: 85 },
      CF:  { top: 16, left: 50 }
    },
    "4-5-1": {
      GK:  { top: 90, left: 50 },
      LB:  { top: 72, left: 15 },
      CB1: { top: 74, left: 37 },
      CB2: { top: 74, left: 63 },
      RB:  { top: 72, left: 85 },
      LM:  { top: 48, left: 10 },
      CM1: { top: 50, left: 30 },
      CM2: { top: 48, left: 50 },
      CM3: { top: 50, left: 70 },
      RM:  { top: 48, left: 90 },
      CF:  { top: 18, left: 50 }
    }
  };

  const layout = layouts[formationName] || layouts["4-4-2"];

  // Bench / sideline roles (not on the pitch grid)
  const benchSlots = {
    TRIDACKA: { label: "Třídačka" },
    TRENER:   { label: "Trenér" }
  };

  // Build player lookup by name
  const byName = {};
  for (const p of players) {
    if (p.name) byName[p.name] = p;
  }

  // Map each slot to positioned player
  const positioned = [];
  const bench = [];
  for (const s of slots) {
    const p = s.player ? byName[s.player] : null;
    const info = {
      slot: s.slot,
      name: s.player || "",
      number: p ? p.number : null,
      photo: p ? p.photo : null,
      position: p ? p.position : null
    };

    if (benchSlots[s.slot]) {
      info.roleLabel = benchSlots[s.slot].label;
      bench.push(info);
    } else {
      const pos = layout[s.slot];
      if (!pos) continue;
      info.top = pos.top;
      info.left = pos.left;
      positioned.push(info);
    }
  }

  return {
    name: formationName,
    players: positioned,
    bench: bench,
    hasFormation: positioned.length > 0
  };
};
