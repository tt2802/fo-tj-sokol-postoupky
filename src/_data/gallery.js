const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const filePath = path.join(__dirname, 'gallery.yml');
const raw = fs.readFileSync(filePath, 'utf8');

module.exports = yaml.load(raw);
