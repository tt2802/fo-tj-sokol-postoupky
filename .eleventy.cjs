// file: .eleventy.cjs
const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

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

  eleventyConfig.addCollection("news", (api) => {
    return api.getFilteredByGlob("src/news/*.md").sort((a, b) => b.date - a.date);
  });

  // Zápasy (MD soubory v src/matches)
  eleventyConfig.addCollection("matches", (api) => {
    const items = api.getFilteredByGlob("src/matches/*.md");

    const normalized = items
      .map((it) => {
        const dt = it.data?.datetime ? DateTime.fromISO(String(it.data.datetime)) : null;
        const dtValid = dt && dt.isValid ? dt : null;
        return {
          ...it,
          data: {
            ...it.data,
            _dt: dtValid,
            _ts: dtValid ? dtValid.toMillis() : null
          }
        };
      })
      .filter((it) => it.data._ts !== null)
      .sort((a, b) => a.data._ts - b.data._ts);

    return normalized;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    },
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "/"
  };
};
