/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const configPath = path.join(root, "src", "admin", "config.yml");
const eleventyPath = path.join(root, ".eleventy.cjs");

function readText(filePath) {
	return fs.readFileSync(filePath, "utf8");
}

function parseAdminFileRefs(yamlText) {
	const refs = [];
	const regex = /^\s*file:\s*"([^"]+)"\s*$/gm;
	let m;
	while ((m = regex.exec(yamlText)) !== null) {
		refs.push(m[1]);
	}
	return Array.from(new Set(refs));
}

function toPosix(p) {
	return String(p || "").replace(/\\/g, "/");
}

function looksLikeWrappedAdminPayload(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	return (
		Object.prototype.hasOwnProperty.call(value, "partial") ||
		Object.prototype.hasOwnProperty.call(value, "raw") ||
		(Object.prototype.hasOwnProperty.call(value, "data") && Object.prototype.hasOwnProperty.call(value, "path"))
	);
}

function fail(message, details = []) {
	console.error("❌ [data-sync-check] " + message);
	details.forEach((d) => console.error("   - " + d));
	process.exitCode = 1;
}

function ok(message) {
	console.log("✅ [data-sync-check] " + message);
}

function main() {
	if (!fs.existsSync(configPath)) {
		fail("Chybí admin config", [toPosix(path.relative(root, configPath))]);
		return;
	}
	if (!fs.existsSync(eleventyPath)) {
		fail("Chybí .eleventy konfigurace", [toPosix(path.relative(root, eleventyPath))]);
		return;
	}

	const yaml = readText(configPath);
	const eleventy = readText(eleventyPath);

	const adminFiles = parseAdminFileRefs(yaml);
	if (!adminFiles.length) {
		fail("V admin configu nebyly nalezeny žádné file kolekce.");
		return;
	}

	const missingFiles = adminFiles
		.map((rel) => ({ rel, abs: path.join(root, rel) }))
		.filter((x) => !fs.existsSync(x.abs));

	if (missingFiles.length) {
		fail(
			"Některé soubory z admin/config.yml neexistují",
			missingFiles.map((x) => toPosix(x.rel))
		);
	} else {
		ok("Všechny soubory z admin/config.yml existují");
	}

	const dataFilesNeedingPassthrough = adminFiles.filter(
		(rel) => rel.startsWith("src/_data/") && /\.(json|ya?ml)$/i.test(rel)
	);

	const missingPassthrough = dataFilesNeedingPassthrough.filter((rel) => {
		const needle = `"${toPosix(rel)}"`;
		return !eleventy.includes(needle);
	});

	if (missingPassthrough.length) {
		fail(
			"Některé admin data nejsou mapované v .eleventy.cjs přes addPassthroughCopy",
			missingPassthrough.map((x) => toPosix(x))
		);
	} else {
		ok("Admin data v src/_data jsou mapovaná do passthrough copy");
	}

	const forbidden = path.join(root, "src", "_data", "galleries.json");
	if (fs.existsSync(forbidden)) {
		fail("Nalezen zakázaný duplicitní zdroj galerie", ["src/_data/galleries.json"]);
	} else {
		ok("Duplicitní galleries.json neexistuje");
	}

	const wrappedJsonFiles = adminFiles
		.filter((rel) => rel.startsWith("src/_data/") && /\.json$/i.test(rel))
		.filter((rel) => {
			try {
				const parsed = JSON.parse(readText(path.join(root, rel)));
				return looksLikeWrappedAdminPayload(parsed);
			} catch (_) {
				return false;
			}
		});

	if (wrappedJsonFiles.length) {
		fail(
			"Některé admin JSON soubory jsou uložené jako zabalený CMS payload místo čistých dat",
			wrappedJsonFiles.map((x) => toPosix(x))
		);
	} else {
		ok("Admin JSON soubory mají čistý datový tvar");
	}

	if (!process.exitCode) {
		console.log("🎉 [data-sync-check] Data sync guard prošel.");
	}
}

main();
