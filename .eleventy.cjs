// file: .eleventy.cjs
const { DateTime } = require("luxon");
let pluginSitemap;
try {
  pluginSitemap = require("@quasibit/eleventy-plugin-sitemap");
} catch (e) {
  console.warn("Sitemap plugin not installed, skipping");
}
let htmlmin;
try {
  htmlmin = require("html-minifier");
} catch (e) {
  console.warn("html-minifier not installed, skipping html minify transform");
}
let CleanCSS;
try {
  CleanCSS = require("clean-css");
} catch (e) {
  console.warn("clean-css not installed, skipping cssmin filter");
}
let terser;
try {
  terser = require("terser");
} catch (e) {
  console.warn("terser not installed, skipping jsmin filter");
}

let Image;
try {
  Image = require("@11ty/eleventy-img");
} catch (e) {
  console.warn("@11ty/eleventy-img not installed, image shortcode disabled");
}

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
  eleventyConfig.addPassthroughCopy({ "src/_data/upcoming_matches.json": "_data/upcoming_matches.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/players.json": "_data/players.json" });

  eleventyConfig.addFilter("striptags", stripTags);
  eleventyConfig.addFilter("truncate", truncateText);
  eleventyConfig.addFilter("where", (arr, key, value) => {
    if (!Array.isArray(arr)) return [];
    return arr.filter((item) => item && item[key] === value);
  });

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

  // sitemap plugin (optional, requires SITE_URL env or fallback)
  if (pluginSitemap) {
    eleventyConfig.addPlugin(pluginSitemap, {
      sitemap: {
        hostname: process.env.SITE_URL || "https://example.com/fo-tj-sokol-postoupky"
      }
    });
  }

  eleventyConfig.addCollection("news", (api) => {
    return api.getFilteredByGlob("src/news/*.md").sort((a, b) => b.date - a.date);
  });

  // production-only HTML minification (if plugin available)
  if ((process.env.ELEVENTY_ENV === "production" || process.env.NODE_ENV === "production") && htmlmin) {
    eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
      if (outputPath && outputPath.endsWith(".html")) {
        return htmlmin.minify(content, {
          removeComments: true,
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true
        });
      }
      return content;
    });
  }

  // helpers for inline assets
  if (terser) {
    eleventyConfig.addFilter("jsmin", function (code) {
      try {
        const result = terser.minify(code);
        return result.code || code;
      } catch (e) {
        console.error("Terser error:", e);
        return code;
      }
    });
  }

  if (CleanCSS) {
    eleventyConfig.addFilter("cssmin", function (code) {
      try {
        return new CleanCSS({}).minify(code).styles;
      } catch (e) {
        console.error("CleanCSS error:", e);
        return code;
      }
    });
  }

  // after build hook: minify static CSS/JS assets in output folder (only if libs exist)
  eleventyConfig.on("afterBuild", () => {
    if (!CleanCSS && !terser) return;
    const fs = require("fs");
    const path = require("path");
    const outDir = path.join(__dirname, "_site");

    // CSS
    if (CleanCSS) {
      const cssFile = path.join(outDir, "assets/css/styles.css");
      if (fs.existsSync(cssFile)) {
        try {
          const cssIn = fs.readFileSync(cssFile, "utf8");
          const cssOut = new CleanCSS({}).minify(cssIn).styles;
          fs.writeFileSync(cssFile, cssOut);
        } catch (err) {
          console.error("Error minifying CSS in afterBuild", err);
        }
      }
    }

    // JS
    if (terser) {
      const jsDir = path.join(outDir, "assets/js");
      if (fs.existsSync(jsDir)) {
        fs.readdirSync(jsDir).forEach((name) => {
          if (name.endsWith(".js")) {
            const filePath = path.join(jsDir, name);
            try {
              const jsIn = fs.readFileSync(filePath, "utf8");
              const min = terser.minify(jsIn);
              if (min && min.code) fs.writeFileSync(filePath, min.code);
            } catch (err) {
              console.error("Error minifying JS in afterBuild", err);
            }
          }
        });
      }
    }
  });

  // Image shortcode: responsive images using @11ty/eleventy-img when available
  (function () {
    const path = require("path");

    async function imageShortcode(src, alt = "", sizes = "(max-width: 600px) 100vw, 600px", cls = "") {
      if (!src) return "";

      // resolve local files that start with '/'
      let input = src;
      if (typeof input === "string" && input.startsWith("/")) {
        input = path.join(__dirname, "src", input.replace(/^\//, ""));
      }

      if (!Image) {
        // fallback: return simple img tag
        return `<img src="${src}" alt="${alt || ""}" class="${cls}" loading="lazy" decoding="async">`;
      }

      try {
        const metadata = await Image(input, {
          widths: [300, 600, 1200],
          formats: ["webp", "jpeg"],
          outputDir: "_site/assets/img",
          urlPath: "/assets/img/"
        });

        const toSrcset = (arr) => arr.map((i) => `${i.url} ${i.width}w`).join(", ");

        const webp = metadata["webp"];
        const jpeg = metadata["jpeg"];
        const largestJpeg = jpeg[jpeg.length - 1];

        const picture = [];
        if (webp) {
          picture.push(`<source type="image/webp" srcset="${toSrcset(webp)}" sizes="${sizes}">`);
        }

        picture.push(`<img src="${largestJpeg.url}" srcset="${toSrcset(jpeg)}" sizes="${sizes}" alt="${alt || ""}" class="${cls}" loading="lazy" decoding="async">`);

        return `<picture>${picture.join("")}</picture>`;
      } catch (err) {
        console.error("Image generation failed for", src, err);
        return `<img src="${src}" alt="${alt || ""}" class="${cls}" loading="lazy" decoding="async">`;
      }
    }

    // register shortcodes for all template engines (safe fallback when Image is missing)
    eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
    eleventyConfig.addLiquidShortcode("image", imageShortcode);
    eleventyConfig.addShortcode("image", imageShortcode);
  })();

  return {
    dir: { input: "src", includes: "_includes", output: "_site" },
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "/"
  };
};
