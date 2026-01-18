const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/admin/config.yml": "admin/config.yml" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  eleventyConfig.addFilter("czDate", (value) => {
    if (!value) return "";
    return DateTime.fromISO(value).setLocale("cs").toFormat("d. L. yyyy");
  });

  eleventyConfig.addFilter("czTime", (value) => {
    if (!value) return "";
    return DateTime.fromISO(value).setLocale("cs").toFormat("H:mm");
  });

  eleventyConfig.addCollection("news", (api) =>
    api.getFilteredByTag("news").sort((a, b) => b.date - a.date)
  );

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    }
  };
};
