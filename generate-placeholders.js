#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const uploadsDir = 'src/assets/img/uploads';

// Ensure uploads dir exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Test players to generate placeholders for
const playersToGenerate = [
  { name: 'Jan Novák', number: 10, position: 'Útočník', category: 'men' },
  { name: 'Tomáš Kučera', number: 8, position: 'Brankář', category: 'dorostenci' },
  { name: 'Petr Svoboda', number: 11, position: 'Záložník', category: 'starsi-zaci' },
  { name: 'Martin Novák', number: 5, position: 'Obránce', category: 'men' },
  { name: 'David Horák', number: 7, position: 'Záložník', category: 'mlads-zaci' },
  { name: 'Filip Dvořák', number: 3, position: 'Obránce', category: 'skolicka' },
];

const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7B731', '#5F27CD', '#6BCB77'];

playersToGenerate.forEach((player, idx) => {
  // Safe filename from player name
  const safeFilename = player.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const filename = `${safeFilename}-${idx + 1}.svg`;
  const filepath = path.join(uploadsDir, filename);
  
  const color = colors[idx % colors.length];
  const initials = player.name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <linearGradient id="grad${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustBrightness(color, -30)};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="300" height="300" fill="url(#grad${idx})"/>
  <circle cx="150" cy="85" r="45" fill="white" opacity="0.25"/>
  <circle cx="150" cy="85" r="35" fill="white" opacity="0.2"/>
  <text x="150" y="105" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white" opacity="0.9">
    ${initials}
  </text>
  <text x="150" y="210" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">
    ${player.name}
  </text>
  <text x="150" y="235" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="white" opacity="0.95">
    ${player.position}
  </text>
  <text x="150" y="258" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="white" opacity="0.8">
    #${player.number}
  </text>
  <rect x="10" y="10" width="280" height="280" fill="none" stroke="white" stroke-width="2" opacity="0.3" rx="8"/>
</svg>`;
  
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Created: ${filepath}`);
});

console.log(`\n✓ Generated ${playersToGenerate.length} placeholder images in ${uploadsDir}`);

function adjustBrightness(color, percent) {
  const num = parseInt(color.replace("#",""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
    (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255))
    .toString(16).slice(1);
}
