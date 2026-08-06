const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const filePath = path.join(__dirname, 'contacts.yml');

try {
  if (!fs.existsSync(filePath)) {
    module.exports = { address: '', mapUrl: '', people: [], trainings: [] };
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = yaml.load(raw);
  module.exports = {
    address:   (data && data.address)   || '',
    mapUrl:    (data && data.mapUrl)    || '',
    people:    (data && Array.isArray(data.people))    ? data.people    : [],
    trainings: (data && Array.isArray(data.trainings)) ? data.trainings : [],
  };
} catch (e) {
  console.warn('[contacts.js] Chyba při čtení contacts.yml:', e.message);
  module.exports = { address: '', mapUrl: '', people: [], trainings: [] };
}
