// file: .eleventy.cjs
const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  // Static passthrough
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  // Datum CZ (odolné: umí Date objekt i string)
  eleventyConfig.addFilter("czDate", (value) => {
    if (!value) return "";

    if (value instanceof Date) {
      const dt = DateTime.fromJSDate(value);
      return dt.isValid ? dt.setLocale("cs").toFormat("d. L. yyyy") : "";
    }

    const str = String(value);

    const iso = DateTime.fromISO(str);
    if (iso.isValid) return iso.setLocale("cs").toFormat("d. L. yyyy");

    const js = DateTime.fromJSDate(new Date(str));
    if (js.isValid) return js.setLocale("cs").toFormat("d. L. yyyy");

    return "";
  });

  // Čas CZ (pokud někde používáš)
  eleventyConfig.addFilter("czTime", (value) => {
    if (!value) return "";

    if (value instanceof Date) {
      const dt = DateTime.fromJSDate(value);
      return dt.isValid ? dt.setLocale("cs").toFormat("H:mm") : "";
    }

    const str = String(value);

    const iso = DateTime.fromISO(str);
    if (iso.isValid) return iso.setLocale("cs").toFormat("H:mm");

    const js = DateTime.fromJSDate(new Date(str));
    if (js.isValid) return js.setLocale("cs").toFormat("H:mm");

    return "";
  });

  // Novinky: bereme VŽDY vše z src/news (nezávisle na tags)
  eleventyConfig.addCollection("news", (api) => {
    return api
      .getFilteredByGlob("src/news/*.md")
      .sort((a, b) => b.date - a.date);
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    }
  };
};
