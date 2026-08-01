const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const filePath = path.join(__dirname, 'gallery.yml');

function normalizeGalleryShape(input) {
	const data = input && typeof input === 'object' ? input : {};

	if (Array.isArray(data.albums)) {
		return { albums: data.albums };
	}

	if (data.data && Array.isArray(data.data.albums)) {
		return { albums: data.data.albums };
	}

	if (Array.isArray(data)) {
		return { albums: data };
	}

	return { albums: [] };
}

try {
	if (!fs.existsSync(filePath)) {
		console.warn('[gallery.js] Soubor gallery.yml neexistuje, používám prázdný seznam alb.');
		module.exports = { albums: [] };
		return;
	}

	const raw = fs.readFileSync(filePath, 'utf8');
	const parsed = yaml.load(raw);
	module.exports = normalizeGalleryShape(parsed);
} catch (error) {
	console.warn('[gallery.js] Nepodařilo se načíst gallery.yml, používám prázdný seznam alb.', error && error.message ? error.message : error);
	module.exports = { albums: [] };
}
