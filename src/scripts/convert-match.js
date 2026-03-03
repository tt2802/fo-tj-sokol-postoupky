#!/usr/bin/env node

/**
 * Interactive helper: Select upcoming match and create played match
 * Usage: node src/scripts/convert-match.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const upcomingPath = path.join(__dirname, '../../src/_data/upcoming_matches.json');
const playedPath = path.join(__dirname, '../../src/_data/played_matches.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  try {
    // Load upcoming matches
    let upcomingData;
    try {
      upcomingData = JSON.parse(fs.readFileSync(upcomingPath, 'utf8'));
    } catch (err) {
      console.error('❌ Nemohu načíst upcoming_matches.json:', err.message);
      process.exit(1);
    }

    const upcomingMatches = upcomingData.items || [];

    if (upcomingMatches.length === 0) {
      console.error('❌ Žádné nadcházející zápasy není');
      process.exit(1);
    }

    // Show menu
    console.log('\n📋 Dostupné nadcházející zápasy:\n');
    upcomingMatches.forEach((match, i) => {
      console.log(`  ${i + 1}. ${match.date} | ${match.home} vs ${match.away} | ${match.venue}`);
      console.log(`     Slug: ${match.slug}\n`);
    });

    // Ask user to select
    const answer = await question('Vyber číslo zápasu (1-' + upcomingMatches.length + '): ');
    const index = parseInt(answer) - 1;

    if (index < 0 || index >= upcomingMatches.length) {
      console.error('❌ Neplatná volba');
      process.exit(1);
    }

    const selectedMatch = upcomingMatches[index];

    // Load played matches
    let playedData;
    try {
      playedData = JSON.parse(fs.readFileSync(playedPath, 'utf8'));
    } catch (err) {
      playedData = { items: [] };
    }

    if (!playedData.items) {
      playedData.items = [];
    }

    // Create new played match
    const newPlayedMatch = {
      slug: selectedMatch.slug,
      team: selectedMatch.team,
      category: selectedMatch.category,
      season: selectedMatch.season,
      competition: selectedMatch.competition,
      round: selectedMatch.round,
      date: selectedMatch.date,
      home: selectedMatch.home,
      away: selectedMatch.away,
      isHome: selectedMatch.isHome,
      venue: selectedMatch.venue,
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
    const existingIndex = playedData.items.findIndex(m => m.slug === selectedMatch.slug);
    if (existingIndex !== -1) {
      console.warn(`\n⚠️  Zápas už existuje v odehraných zápasech. Přepísuju...\n`);
      playedData.items[existingIndex] = newPlayedMatch;
    } else {
      playedData.items.push(newPlayedMatch);
    }

    // Save
    fs.writeFileSync(playedPath, JSON.stringify(playedData, null, 2), 'utf8');

    console.log(`\n✅ Hotovo!\n`);
    console.log(`📅 Datum: ${newPlayedMatch.date}`);
    console.log(`👥 Zápas: ${newPlayedMatch.home} vs ${newPlayedMatch.away}`);
    console.log(`📍 Místo: ${newPlayedMatch.venue}`);
    console.log(`🏆 Soutěž: ${newPlayedMatch.competition}`);
    console.log(`\n👉 Teď jdi do adminu a vyplň výsledek:\n`);
    console.log(`   http://localhost:8080/admin/\n`);

    rl.close();

  } catch (err) {
    console.error('❌ Chyba:', err.message);
    rl.close();
    process.exit(1);
  }
}

main();
