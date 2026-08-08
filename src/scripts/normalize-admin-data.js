/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { extractArrayPayload, extractObjectPayload } = require("../_data/adminPayload.js");
const yaml = require("js-yaml");

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

// ── YAML normalization (contacts.yml) ─────────────────────────────────────
function extractContactsData(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data)) return parsed.data;
  if (typeof parsed.raw === "string") {
    const inner = yaml.load(parsed.raw);
    if (inner && typeof inner === "object") return extractContactsData(inner) || inner;
  }
  if (parsed.address !== undefined || parsed.people !== undefined) return parsed;
  return null;
}

const contactsPath = path.join(root, "contacts.yml");
if (fs.existsSync(contactsPath)) {
  const rawYml = fs.readFileSync(contactsPath, "utf8");
  if (!rawYml.trimStart().startsWith("address:")) {
    try {
      let data = extractContactsData(yaml.load(rawYml));
      if (!data) data = {};
      const clean = {
        address:   data.address   || "",
        mapUrl:    data.mapUrl    || "",
        people:    Array.isArray(data.people)    ? data.people    : [],
        trainings: Array.isArray(data.trainings) ? data.trainings : [],
      };
      fs.writeFileSync(contactsPath, yaml.dump(clean, { allowUnicode: true, lineWidth: 120 }), "utf8");
      changed += 1;
      console.log("Normalized contacts.yml");
    } catch (e) {
      console.warn("Skipping contacts.yml:", e.message);
    }
  }
}

console.log(`Done. Updated ${changed} file(s).`);

