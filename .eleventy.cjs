// file: .eleventy.cjs
const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const mdLib = markdownIt({ html: true, linkify: true });
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
  eleventyConfig.addPassthroughCopy({ "src/_data/played_matches.json": "_data/played_matches.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/players.json": "_data/players.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/league_table.json": "_data/league_table.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/staff.json": "_data/staff.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/executive_board.json": "_data/executive_board.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/formation.json": "_data/formation.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/calendar_events.json": "_data/calendar_events.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/nabor_content.json": "_data/nabor_content.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/sponsors.json": "_data/sponsors.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/site.json": "_data/site.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/categories.json": "_data/categories.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/contacts.yml": "_data/contacts.yml" });
  eleventyConfig.addPassthroughCopy({ "src/_data/gallery.yml": "_data/gallery.yml" });

  eleventyConfig.addFilter("striptags", stripTags);
  eleventyConfig.addFilter("truncate", truncateText);
  eleventyConfig.addFilter("md", (content) => mdLib.render(content || ""));
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

  // Helper to parse date string to Luxon DateTime
  function parseCzDT(value) {
    if (!value) return null;
    if (value instanceof Date) {
      const dt = DateTime.fromJSDate(value).setZone("Europe/Prague");
      return dt.isValid ? dt : null;
    }
    const str = String(value);
    const iso = DateTime.fromISO(str, { zone: "Europe/Prague" });
    if (iso.isValid) return iso;
    const js = DateTime.fromJSDate(new Date(str)).setZone("Europe/Prague");
    return js.isValid ? js : null;
  }

  eleventyConfig.addFilter("czDateDay", (value) => {
    const dt = parseCzDT(value);
    return dt ? dt.toFormat("d") : "";
  });

  eleventyConfig.addFilter("czDateMonth", (value) => {
    const dt = parseCzDT(value);
    if (!dt) return "";
    const months = ["led","úno","bře","dub","kvě","čvn","čvc","srp","zář","říj","lis","pro"];
    return months[dt.month - 1] || "";
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
        hostname: process.env.SITE_URL || "https://tt2802.github.io/fo-tj-sokol-postoupky"
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
  eleventyConfig.on("afterBuild", async () => {
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
        const files = fs.readdirSync(jsDir).filter((n) => n.endsWith(".js"));
        for (const name of files) {
          const filePath = path.join(jsDir, name);
          try {
            const jsIn = fs.readFileSync(filePath, "utf8");
            const min = await terser.minify(jsIn);
            if (min && min.code) fs.writeFileSync(filePath, min.code);
          } catch (err) {
            console.error("Error minifying JS in afterBuild", err);
          }
        }
      }
    }
  });

  // Image shortcode: responsive images using @11ty/eleventy-img when available
  (function () {
    const fs = require("fs");
    const path = require("path");
    const pathPrefix = (process.env.ELEVENTY_PATH_PREFIX || "/").replace(/\/?$/, "/");

    function isRemoteOrDataUrl(value) {
      return typeof value === "string" && (/^data:/i.test(value) || /^https?:\/\//i.test(value) || /^\/\//.test(value));
    }

    function isSvgLike(value) {
      return typeof value === "string" && /\.svg(?:[?#].*)?$/i.test(value);
    }

    function isOptimizableRaster(value) {
      return typeof value === "string" && /\.(png|jpe?g|webp|avif|gif)(?:[?#].*)?$/i.test(value);
    }

    function publicUrl(value) {
      if (!value) return "";
      if (isRemoteOrDataUrl(value)) return value;
      if (value.startsWith("/")) return pathPrefix + value.replace(/^\//, "");
      return pathPrefix + value;
    }

    function placeholderDataUrl(label, cls) {
      const safeLabel = String(label || "Bez fotky").replace(/[<>&"]/g, "").slice(0, 28);
      const short = safeLabel ? safeLabel.slice(0, 2).toUpperCase() : "?";
      const fill = cls && /gallery/i.test(cls) ? "#f3f4f6" : "#e8f5ec";
      const color = "#1f2937";
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="${safeLabel}">
          <rect width="800" height="600" fill="${fill}"/>
          <g fill="none" stroke="${color}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" opacity="0.22">
            <rect x="120" y="96" width="560" height="408" rx="32"/>
            <path d="M210 394l95-95 77 77 63-63 145 145"/>
            <circle cx="316" cy="244" r="42"/>
          </g>
          <text x="400" y="520" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="700" fill="${color}" opacity="0.65">${short}</text>
        </svg>`;
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
    }

    function resolveLocalCandidate(src) {
      if (typeof src !== "string") return null;
      const normalized = src.replace(/^\//, "");
      const candidates = [];

      if (normalized.startsWith("assets/uploads/")) {
        candidates.push(path.join(__dirname, "src", normalized));
        candidates.push(path.join(__dirname, "src", normalized.replace(/^assets\/uploads\//, "assets/img/uploads/")));
      } else if (normalized.startsWith("assets/img/uploads/")) {
        candidates.push(path.join(__dirname, "src", normalized));
        candidates.push(path.join(__dirname, "src", normalized.replace(/^assets\/img\/uploads\//, "assets/uploads/")));
      } else {
        candidates.push(path.join(__dirname, "src", normalized));
      }

      const existing = candidates.find((candidate) => fs.existsSync(candidate));
      return existing || candidates[0];
    }

    async function imageShortcode(src, alt = "", sizes = "(max-width: 600px) 100vw, 600px", cls = "") {
      if (!src) {
        return `<img src="${placeholderDataUrl(alt, cls)}" alt="${alt || "Bez fotky"}" class="${cls}" loading="lazy" decoding="async">`;
      }

      if (isRemoteOrDataUrl(src) || isSvgLike(src) || !isOptimizableRaster(src)) {
        return `<img src="${src}" alt="${alt || ""}" class="${cls}" loading="lazy" decoding="async">`;
      }

      // resolve local files that start with '/'
      const input = resolveLocalCandidate(src);

      if (!input || !fs.existsSync(input)) {
        return `<img src="${placeholderDataUrl(alt, cls)}" alt="${alt || "Bez fotky"}" class="${cls}" loading="lazy" decoding="async">`;
      }

      if (!Image) {
        // fallback: return simple img tag
        return `<img src="${publicUrl(src)}" alt="${alt || ""}" class="${cls}" loading="lazy" decoding="async">`;
      }

      try {
        const metadata = await Image(input, {
          widths: [300, 600, 1200],
          formats: ["webp", "jpeg"],
          outputDir: "_site/assets/img",
          urlPath: `${pathPrefix}assets/img/`
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
        return `<img src="${publicUrl(src)}" alt="${alt || ""}" class="${cls}" loading="lazy" decoding="async">`;
      }
    }

    // register shortcodes for all template engines (safe fallback when Image is missing)
    eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
    eleventyConfig.addLiquidShortcode("image", imageShortcode);
    eleventyConfig.addShortcode("image", imageShortcode);
  })();

  // Ensure legacy root-relative asset URLs keep working on the GitHub Pages subpath.
  (function () {
    const pathPrefix = (process.env.ELEVENTY_PATH_PREFIX || "/").replace(/\/?$/, "/");

    if (!pathPrefix || pathPrefix === "/") return;

    eleventyConfig.addTransform("prefix-root-relative-assets", function (content, outputPath) {
      if (!outputPath || !outputPath.endsWith(".html")) return content;

      return content.replace(/\b(src|href|poster)=(['"])\/(assets\/[^'"]+)\2/g, function (_match, attr, quote, assetPath) {
        return `${attr}=${quote}${pathPrefix}${assetPath}${quote}`;
      });
    });
  })();

  return {
    dir: { input: "src", includes: "_includes", output: "_site" },
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "/"
  };
};
