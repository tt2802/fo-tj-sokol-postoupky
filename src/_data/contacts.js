const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const filePath = path.join(__dirname, 'contacts.yml');

function unwrapAdminPayload(raw) {
  // If admin CMS wrapped the file in metadata, extract the inner YAML string
  if (typeof raw !== 'string') return raw;
  const parsed = yaml.load(raw);
  if (!parsed || typeof parsed !== 'object') return raw;
  // Detect admin wrapper: has 'raw' key with actual YAML inside
  if (typeof parsed.raw === 'string' && (parsed.path || parsed.partial !== undefined)) {
    return unwrapAdminPayload(parsed.raw);
  }
  if (parsed.data && typeof parsed.data === 'object') return parsed.data;
  return parsed;
}

const EMPTY = { address: '', mapUrl: '', people: [], trainings: [] };

try {
  if (!fs.existsSync(filePath)) {
    module.exports = EMPTY;
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let data = unwrapAdminPayload(raw);

  // If data came out as a string (nested raw), parse it once more
  if (typeof data === 'string') data = yaml.load(data);

  const clean = {
    address:   (data && data.address)   || '',
    mapUrl:    (data && data.mapUrl)    || '',
    people:    (data && Array.isArray(data.people))    ? data.people    : [],
    trainings: (data && Array.isArray(data.trainings)) ? data.trainings : [],
  };

  // Self-heal: write clean YAML back if the file was corrupted
  const rawTrimmed = raw.trimStart();
  if (!rawTrimmed.startsWith('address:') && !rawTrimmed.startsWith('#')) {
    const cleanYaml = yaml.dump(clean, { allowUnicode: true, lineWidth: 120 });
    try {
      fs.writeFileSync(filePath, cleanYaml, 'utf8');
      console.log('[contacts.js] contacts.yml opraven z admin wrapperu');
    } catch (_) {}
  }

  module.exports = clean;
} catch (e) {
  console.warn('[contacts.js] Chyba při čtení contacts.yml:', e.message);
  module.exports = EMPTY;
}
