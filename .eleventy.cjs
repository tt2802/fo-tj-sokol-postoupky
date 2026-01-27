// file: .eleventy.cjs
const { DateTime } = require("luxon");

function stripTags(input) {
  return String(input || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(input, maxLen) {
  const text = stripTags(input);
  const n = Number(maxLen) || 0;
  if (!n || text.length <= n) return text;
  return `${text.slice(0, Math.max(0, n - 1)).trim()}…`;
}

function extractYouTubeId(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  if (u.includes("youtu.be/")) return u.split("youtu.be/")[1].split("?")[0].split("&")[0].trim();
  if (u.includes("v=")) return u.split("v=")[1].split("&")[0].trim();
  if (u.includes("/embed/")) return u.split("/embed/")[1].split("?")[0].split("&")[0].trim();
  return "";
}

function videoKind(url) {
  const u = String(url || "").trim().toLowerCase();
  if (!u) return "";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".ogg")) return "file";
  if (u.includes("facebook.com") || u.includes("fb.watch")) return "facebook";
  return "link";
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  eleventyConfig.addFilter("striptags", stripTags);
  eleventyConfig.addFilter("truncate", truncateText);

  eleventyConfig.addFilter("youtubeId", extractYouTubeId);
  eleventyConfig.addFilter("videoKind", videoKind);

  eleventyConfig.addFilter("czDate", (value) => {
    if (!value) return "";
    if (value instanceof Date) {
      const dt = DateTime.fromJSDate(value).setZone("Europe/Prague");
      return dt.isValid ? dt.setLocale("cs").toFormat("d. L. yyyy") : "";
    }
    const str = String(value);
    const iso = DateTime.fromISO(str, { zone: "Europe/Prague" });
    if (iso.isValid) return iso.setLocale("cs").toFormat("d. L. yyyy");
    const js = DateTime.fromJSDate(new Date(str)).setZone("Europe/Prague");
    if (js.isValid) return js.setLocale("cs").toFormat("d. L. yyyy");
    return "";
  });

  eleventyConfig.addFilter("czTime", (value) => {
    if (!value) return "";
    if (value instanceof Date) {
      const dt = DateTime.fromJSDate(value).setZone("Europe/Prague");
      return dt.isValid ? dt.setLocale("cs").toFormat("H:mm") : "";
    }
    const str = String(value);
    const iso = DateTime.fromISO(str, { zone: "Europe/Prague" });
    if (iso.isValid) return iso.setLocale("cs").toFormat("H:mm");
    const js = DateTime.fromJSDate(new Date(str)).setZone("Europe/Prague");
    if (js.isValid) return js.setLocale("cs").toFormat("H:mm");
    return "";
  });

  eleventyConfig.addCollection("news", (api) => {
    return api.getFilteredByGlob("src/news/*.md").sort((a, b) => b.date - a.date);
  });

  return {
    dir: { input: "src", includes: "_includes", output: "_site" },
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "/"
  };
};
