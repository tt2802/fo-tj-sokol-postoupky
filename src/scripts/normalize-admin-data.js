/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { extractArrayPayload, extractObjectPayload } = require("../_data/adminPayload.js");

const root = path.join(__dirname, "..", "_data");

const targets = [
  {
    file: "upcoming_matches.json",
    normalize(payload) {
      return { items: extractArrayPayload(payload, "items") };
    }
  },
  {
    file: "played_matches.json",
    normalize(payload) {
      return { items: extractArrayPayload(payload, "items") };
    }
  },
  {
    file: "calendar_events.json",
    normalize(payload) {
      return { items: extractArrayPayload(payload, "items") };
    }
  },
  {
    file: "staff.json",
    normalize(payload) {
      return { items: extractArrayPayload(payload, "items") };
    }
  },
  {
    file: "executive_board.json",
    normalize(payload) {
      return { items: extractArrayPayload(payload, "items") };
    }
  },
  {
    file: "sponsors.json",
    normalize(payload) {
      return { items: extractArrayPayload(payload, "items") };
    }
  },
  {
    file: "categories.json",
    normalize(payload) {
      return { items: extractArrayPayload(payload, "items") };
    }
  },
  {
    file: "players.json",
    normalize(payload) {
      const clean = extractObjectPayload(payload, ["men", "youth"]);
      return {
        men: Array.isArray(clean.men) ? clean.men : [],
        youth: clean && clean.youth && typeof clean.youth === "object" ? clean.youth : {}
      };
    }
  },
  {
    file: "formation.json",
    normalize(payload) {
      const clean = extractObjectPayload(payload, ["formation", "positions"]);
      return {
        formation: clean.formation || "4-4-2",
        positions: Array.isArray(clean.positions) ? clean.positions : []
      };
    }
  },
  {
    file: "league_table.json",
    normalize(payload) {
      const clean = extractObjectPayload(payload, ["season", "competition", "teams"]);
      return {
        season: clean.season || "",
        competition: clean.competition || "",
        teams: Array.isArray(clean.teams) ? clean.teams : []
      };
    }
  },
  {
    file: "site.json",
    normalize(payload) {
      return extractObjectPayload(payload, ["url", "clubName", "clubShort"]);
    }
  },
  {
    file: "nabor_content.json",
    normalize(payload) {
      return extractObjectPayload(payload, ["title", "body", "subtitle"]);
    }
  }
];

let changed = 0;

for (const target of targets) {
  const filePath = path.join(root, target.file);
  if (!fs.existsSync(filePath)) continue;

  const raw = fs.readFileSync(filePath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn(`Skipping ${target.file}: invalid JSON (${error.message})`);
    continue;
  }

  const normalized = target.normalize(parsed);
  const next = `${JSON.stringify(normalized, null, 2)}\n`;

  if (next !== raw) {
    fs.writeFileSync(filePath, next, "utf8");
    changed += 1;
    console.log(`Normalized ${target.file}`);
  }
}

console.log(`Done. Updated ${changed} file(s).`);
