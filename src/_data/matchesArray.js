const upcomingMatches = require('./upcoming_matches.json');
const playedMatches = require('./played_matches.json');

// Helper function to generate slug if missing
const generateSlug = (m) => {
  if (!m.slug && m.date && m.home && m.away) {
    const dateStr = m.date.slice(0, 10);
    const home = (m.home || '').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const away = (m.away || '').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    m.slug = `${dateStr}-${home}-${away}`.slice(0, 100);
  }
  return m;
};

// Combine upcoming and played matches with matchType
const allMatches = [
  ...(upcomingMatches.items || []).map(m => ({
    ...m,
    matchType: 'upcoming'
  })),
  ...(playedMatches.items || []).map(m => ({
    ...m,
    matchType: 'played'
  }))
].map(generateSlug);

module.exports = allMatches;
