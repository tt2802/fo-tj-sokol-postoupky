#!/usr/bin/env node

/**
 * Helper script: Create played match from upcoming match
 * Usage: node src/scripts/create-played-from-upcoming.js <slug>
 * Example: node src/scripts/create-played-from-upcoming.js 2026-01-19-postoupky-hulin
 */

const fs = require('fs');
const path = require('path');

const upcomingPath = path.join(__dirname, '../../src/_data/upcoming_matches.json');
const playedPath = path.join(__dirname, '../../src/_data/played_matches.json');

// Get slug from command line argument
const upcomingSlug = process.argv[2];

if (!upcomingSlug) {
  console.error('❌ Chyba: Zadej slug nadcházejícího zápasu');
  console.error('Použití: node src/scripts/create-played-from-upcoming.js <slug>');
  console.error('Příklad: node src/scripts/create-played-from-upcoming.js 2026-01-19-postoupky-hulin');
  process.exit(1);
}

// Load upcoming match
let upcomingData = null;
try {
  upcomingData = JSON.parse(fs.readFileSync(upcomingPath, 'utf8'));
} catch (err) {
  console.error('❌ Nemohu načíst upcoming_matches.json:', err.message);
  process.exit(1);
}

// Find the match by slug
const upcomingMatch = (upcomingData.items || []).find(m => m.slug === upcomingSlug);

if (!upcomingMatch) {
  console.error(`❌ Zápas se slugem "${upcomingSlug}" nenalezen v nadcházejících zápasech`);
  console.error('Dostupné zápasy:');
  (upcomingData.items || []).forEach(m => {
    console.error(`  - ${m.slug} (${m.date} ${m.home} vs ${m.away})`);
  });
  process.exit(1);
}

// Load played matches
let playedData = null;
try {
  playedData = JSON.parse(fs.readFileSync(playedPath, 'utf8'));
} catch (err) {
  playedData = { items: [] };
}

if (!playedData.items) {
  playedData.items = [];
}

// Create new played match from upcoming
const newPlayedMatch = {
  slug: upcomingMatch.slug,
  team: upcomingMatch.team,
  category: upcomingMatch.category,
  season: upcomingMatch.season,
  competition: upcomingMatch.competition,
  round: upcomingMatch.round,
  date: upcomingMatch.date,
  home: upcomingMatch.home,
  away: upcomingMatch.away,
  isHome: upcomingMatch.isHome,
  venue: upcomingMatch.venue,
  // Played match specific fields (empty for now)
  homeScore: null,
  awayScore: null,
  referee: '',
  report: '',
  videoUrl: '',
  lineup: [],
  scorers: [],
  cards: [],
  substitutions: []
};

// Check if already exists
const existingIndex = playedData.items.findIndex(m => m.slug === upcomingMatch.slug);
if (existingIndex !== -1) {
  console.warn(`⚠️  Zápas se slugem "${upcomingSlug}" už existuje v odehraných zápasech`);
  console.warn('Přepíšu...');
  playedData.items[existingIndex] = newPlayedMatch;
} else {
  playedData.items.push(newPlayedMatch);
}

// Save played matches
try {
  fs.writeFileSync(playedPath, JSON.stringify(playedData, null, 2), 'utf8');
  console.log(`✅ Zápas úspěšně vytvořen!`);
  console.log(`📅 Datum: ${newPlayedMatch.date}`);
  console.log(`⚽ Zápas: ${newPlayedMatch.home} vs ${newPlayedMatch.away}`);
  console.log(`📍 Místo: ${newPlayedMatch.venue}`);
  console.log(`\n👉 Teď si otevři admin na http://localhost:8080/admin/`);
  console.log(`👉 Jdi na "Odehrané zápasy" a vyplň skóre, rozhodčího, report atd.`);
} catch (err) {
  console.error('❌ Nemohu uložit played_matches.json:', err.message);
  process.exit(1);
}
