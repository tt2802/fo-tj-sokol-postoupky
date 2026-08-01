const upcomingMatches = require('./upcoming_matches.json');
const playedMatches = require('./played_matches.json');
const { extractArrayPayload } = require('./adminPayload.js');

const normalizeDate = (value) => String(value || '').slice(0, 10);

const slugify = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const fallbackKey = (m) => {
  const date = normalizeDate(m?.date);
  const home = slugify(m?.home);
  const away = slugify(m?.away);
  if (!date || !home || !away) return '';
  return `${date}-${home}-${away}`;
};

const getMatchLookup = (items) => {
  const map = new Map();
  (items || []).forEach((m) => {
    if (!m) return;
    [m.slug, m.id, fallbackKey(m)]
      .map((k) => String(k || '').trim())
      .filter(Boolean)
      .forEach((k) => map.set(k, m));
  });
  return map;
};

const fillPlayedFromRelatedUpcoming = (playedItem, lookup) => {
  const related = String(playedItem?.relatedUpcoming || '').trim();
  if (!related) return playedItem;

  const source = lookup.get(related);
  if (!source) return playedItem;

  const merged = { ...playedItem };
  const mapFields = {
    team: source.team,
    category: source.category,
    season: source.season,
    competition: source.competition,
    round: source.round,
    date: source.date,
    home: source.home,
    away: source.away,
    isHome: source.isHome,
    venue: source.venue,
    id: source.id,
    slug: source.slug
  };

  Object.entries(mapFields).forEach(([key, value]) => {
    if ((merged[key] === undefined || merged[key] === null || merged[key] === '') && value !== undefined && value !== null && value !== '') {
      merged[key] = value;
    }
  });

  return merged;
};

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
const upcomingItems = extractArrayPayload(upcomingMatches, 'items');
const upcomingLookup = getMatchLookup(upcomingItems);

const allMatches = [
  ...upcomingItems.map(m => ({
    ...m,
    matchType: 'upcoming'
  })),
  ...extractArrayPayload(playedMatches, 'items').map(m => fillPlayedFromRelatedUpcoming(m, upcomingLookup)).map(m => ({
    ...m,
    matchType: 'played'
  }))
].map(generateSlug);

// Remove duplicates that would generate identical detail URLs.
// Preference: played match overrides upcoming match with same team/category/slug.
const dedupedMatches = [];
const indexByKey = new Map();

allMatches.forEach((m) => {
  const team = String(m?.team || '');
  const category = String(m?.category || '');
  const slug = String(m?.slug || '');
  if (!slug || !team) {
    dedupedMatches.push(m);
    return;
  }

  const key = `${team}|${category}|${slug}`;
  const existingIndex = indexByKey.get(key);

  if (existingIndex === undefined) {
    indexByKey.set(key, dedupedMatches.length);
    dedupedMatches.push(m);
    return;
  }

  const existing = dedupedMatches[existingIndex];
  if (existing?.matchType !== 'played' && m?.matchType === 'played') {
    dedupedMatches[existingIndex] = m;
  }
});

module.exports = dedupedMatches;
