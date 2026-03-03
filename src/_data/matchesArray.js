const matches = require('./matches.json');

// Auto-generate slug if missing
module.exports = (matches.items || []).map(m => {
  if (!m.slug && m.date && m.home && m.away) {
    // Generate slug from date and teams
    const dateStr = m.date.slice(0, 10); // YYYY-MM-DD
    const home = (m.home || '').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const away = (m.away || '').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    m.slug = `${dateStr}-${home}-${away}`.slice(0, 100);
  }
  return m;
});
