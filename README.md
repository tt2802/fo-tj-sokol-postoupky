# fo-tj-sokol-postoupky

Jednoduchý web pro fotbalový oddíl postavený na 11ty (Eleventy).

## Rychlý start

```bash
npm install          # nainstalovat závislosti (Eleventy, Luxon, ESLint)
npm run dev          # spustí lokální vývojový server
npm run build        # vygeneruje statickou stránku do `_site`
npm run lint         # kontrola JavaScriptu pomocí ESLint (po instalaci devDependencies)
```

## Struktura

- `src/` – zdrojové soubory (šablony, data, obsah)
- `_includes/`, `_data/` – Eleventy includes a data
- `news/`, `matches/`, `pages/` – markdown soubory s obsahem
- `assets/` – CSS, skripty, obrázky
- `_site/` – vygenerovaná produkční verze (ignorováno ve .gitignore)

> **Poznámka pro vývojáře**: Nezapomeňte spustit `npm install` (nebo `npm ci`) před prvním použitím. Pokud `npm install` selže kvůli síti nebo autentizaci,
> zkontrolujte nastavení registru (`npm config get registry`) nebo použijte `npm cache clean --force`.
> Po instalaci jsou dostupné skripty `npm run dev`, `npm run build` a `npm run lint`.

### Vytváření obsahu

- **Novinka**: přidejte `.md` soubor do `src/news/` s frontmatterem:
  ```yaml
  ---
  title: "Název novinky"
  date: 2026-02-18
  description: "Krátký popis pro SEO (volitelné)"
  ---
  TEXT NOVINKY...
  ```

- **Zápas**: použijte šablonu `src/matches/match.njk` nebo přidejte nový objekt do `src/_data/matches.json` a poté vytvořte odpovídající `.md` soubor s reportem.
- **Stránka**: soubory v `src/pages/` jsou převáděny přímo podle permalinku.


## Další kroky

- Doplnit SEO meta tagy ve stránkách (`description`, `og:`) – funguje pomocí `partials/seo.njk`.
- Upravit `src/_data/site.json` a nastavit hodnotu `url` na skutečnou doménu (např. GitHub Pages URL). Plugin sitemap ho bude používat.
- `robots.txt` byl vyplněn, ale upravte v něm adresu sitemap.
- V článcích/stránkách ve frontmatteru můžete zadat tyto volitelné hodnoty pro SEO:
  - `description` – meta popisek (pokud chybí, generuje se z obsahu).
  - `ogTitle`, `ogDescription`, `ogImage` – Open Graph přes override.
  - `canonical` – kanonická URL.
- Při produkčním buildu (`NODE_ENV=production npm run build` nebo `ELEVENTY_ENV=production npm run build`) se automaticky minifikuje HTML; navíc CSS a JS v adresáři `_site/assets` jsou zmenšené pomocí pluginů.
- Inline CSS/JS lze redukovat pomocí filtrů `cssmin` a `jsmin` ve šablonách (pouze pokud používáte `{% raw %}{{ myCode | cssmin }}{% endraw %}` a podobně).
- Použít ESLint pro kontrolu kódu (`npm run lint`).

