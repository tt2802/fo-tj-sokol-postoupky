// file: .eleventy.cjs
const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/sitemap.xml": "sitemap.xml" });

  eleventyConfig.addFilter("czDate", (value) => {
    if (!value) return "";
    if (value instanceof Date) {
      const dt = DateTime.fromJSDate(value).setZone("Europe/Prague");
      return dt.isValid ? dt.setLocale("cs").toFormat("d. L. yyyy") : "";
    }
    const iso = DateTime.fromISO(String(value), { zone: "Europe/Prague" });
    return iso.isValid ? iso.setLocale("cs").toFormat("d. L. yyyy") : "";
  });

  eleventyConfig.addFilter("czTime", (value) => {
    if (!value) return "";
    if (value instanceof Date) {
      const dt = DateTime.fromJSDate(value).setZone("Europe/Prague");
      return dt.isValid ? dt.setLocale("cs").toFormat("H:mm") : "";
    }
    const iso = DateTime.fromISO(String(value), { zone: "Europe/Prague" });
    return iso.isValid ? iso.setLocale("cs").toFormat("H:mm") : "";
  });

  eleventyConfig.addCollection("news", (api) => {
    return api.getFilteredByGlob("src/news/*.md").sort((a, b) => b.date - a.date);
  });

  return {
    dir: { input: "src", includes: "_includes", output: "_site" },
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "/"
  };
};
// file: .eleventy.cjs
const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/sitemap.xml": "sitemap.xml" });

  eleventyConfig.addFilter("czDate", (value) => {
    if (!value) return "";
    if (value instanceof Date) {
      const dt = DateTime.fromJSDate(value).setZone("Europe/Prague");
      return dt.isValid ? dt.setLocale("cs").toFormat("d. L. yyyy") : "";
    }
    const iso = DateTime.fromISO(String(value), { zone: "Europe/Prague" });
    return iso.isValid ? iso.setLocale("cs").toFormat("d. L. yyyy") : "";
  });

  eleventyConfig.addFilter("czTime", (value) => {
    if (!value) return "";
    if (value instanceof Date) {
      const dt = DateTime.fromJSDate(value).setZone("Europe/Prague");
      return dt.isValid ? dt.setLocale("cs").toFormat("H:mm") : "";
    }
    const iso = DateTime.fromISO(String(value), { zone: "Europe/Prague" });
    return iso.isValid ? iso.setLocale("cs").toFormat("H:mm") : "";
  });

  eleventyConfig.addCollection("news", (api) => {
    return api.getFilteredByGlob("src/news/*.md").sort((a, b) => b.date - a.date);
  });

  return {
    dir: { input: "src", includes: "_includes", output: "_site" },
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "/"
  };
};
