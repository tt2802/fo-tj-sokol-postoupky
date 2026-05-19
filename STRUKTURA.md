# Struktura webu – TJ Sokol Postoupky

Toto je detailní návod jak je web strukturován a jak v něm editovat. 

> **Důležité:** Jako zdroj pravdy pro editovatelná data vždy berte `src/admin/config.yml` + soubory v `src/_data/`. Pokud se některá část tohoto dokumentu liší, platí konfigurace v adminu.

## 📋 Přehled struktury

Web má tyto hlavní sekce:

- **Domů** (`/`) – přehledová stránka s nejbližším zápasem
- **Novinky** (`/novinky/`) – články editovatelné v adminu
- **Muži** (`/muzi/`) – tým Mužů
  - Zápasy (`/muzi/zapasy/`) – seznam všech zápasů
  - Tým (`/muzi/tym/`) – soupiska hráčů a realizační tým
- **Mládež** (`/mladez/`) – věkové kategorie
  - Dorostenci (`/mladez/dorostenci/`) – U19
    - Zápasy (`/mladez/dorostenci/zapasy/`)
    - Tým (`/mladez/dorostenci/tym/`)
  - Starší žáci (`/mladez/starsi-zaci/`) – U15 (podobná struktura)
  - Mladší žáci (`/mladez/mlads-zaci/`) – U12 (podobná struktura)
  - Miniféra (`/mladez/minifera/`) – U8 (podobná struktura)
- **Galerie** (`/galerie/`) – alba fotek
- **Partneři** (`/partneri/`) – sponzoři
- **Kontakty** (`/kontakty/`) – údaje, tréninky, kontaktní osoby
- **Nábor** (`/nabor/`) – jak se přihlásit

---

## 🛠️ Admin editace (Decap CMS)

Admin je dostupný na `/admin/` a umožňuje editovat:

### 📰 Novinky
- Cesta: `Admin → Novinky`
- Editujete: článek, datum, obsah, obrázky
- Soubory se ukládají do: `src/news/*.md`

### 👥 Hráči
- Cesta: `Admin → Data → Hráči`
- Oddělené sekce pro:
  - **Muži** – seznam hráčů týmu Mužů
  - **Mládež – Dorostenci** – U19
  - **Mládež – Starší žáci** – U15
  - **Mládež – Mladší žáci** – U12
  - **Mládež – Miniféra** – U8
- U každého hráče: jméno, číslo, pozice, fotka
- Soubor: `src/_data/players.yml`

### 🏆 Zápasy
- Cesta: `Admin → Data → Zápasy`
- Editujete: tým (muži/mládež), soutěž, domácí/hosté, skóre, video URL, report
- Soubor: `src/_data/matches.json`

### 🎭 Realizační tým
- Cesta: `Admin → Data → Realizační tým`
- Jméno, role, telefon, email
- Soubor: `src/_data/staff.yml`

### 📸 Galerie
- Cesta: `Admin → Data → Galerie`
- Alba fotek s datem a fotkami
- Soubor: `src/_data/gallery.yml`

### 🤝 Partneři
- Cesta: `Admin → Data → Partneři`
- Název, logo, odkaz
- Soubor: `src/_data/sponsors.yml`

### 📍 Kontakty
- Cesta: `Admin → Data → Kontakty`
- Adresa, tréninky, kontaktní osoby
- Soubor: `src/_data/contacts.yml`

### 📚 Kategorie mládeže
- Cesta: `Admin → Data → Kategorie mládeže`
- Definuje věkové kategorie (U19, U15, U12, U8)
- Soubor: `src/_data/categories.yml`

---

## 📂 Struktura souborů

```
src/
├── _data/                          # Data (JSON/YAML)
│   ├── players.yml                 # Hráči (muži + mládež)
│   ├── categories.yml              # Kategorie mládeže
│   ├── matches.json                # Zápasy
│   ├── matchesComputed.js          # Výpočty pro zápasy (филтрace, sorting)
│   ├── staff.yml                   # Realizační tým
│   ├── sponsors.yml                # Partneři
│   ├── contacts.yml                # Kontakty a tréninky
│   ├── gallery.yml                 # Galerie
│   └── site.json                   # Globální údaje webu
│
├── _includes/
│   ├── layouts/                    # Šablony (base, page, news-post, match)
│   └── partials/                   # Komponenty (header, footer, seo, atd.)
│
├── assets/
│   ├── css/styles.css
│   ├── js/
│   │   ├── site.js                 # Navigace (toggle)
│   │   ├── matches-filter.js       # Filtrování zápasů a embed videí
│   │   └── news-search.js          # Vyhledávání novinek
│   └── uploads/                    # Uploadované fotky
│
├── admin/
│   ├── config.yml                  # Decap CMS konfigurace
│   ├── index.njk                   # Admin stránka
│   └── index.html                  # Vygenerovaný HTML
│
├── muzi/                           # NOVÁ SEKCE: Muži
│   ├── index.njk                   # /muzi/
│   ├── zapasy.njk                  # /muzi/zapasy/
│   └── tym.njk                     # /muzi/tym/
│
├── mladez/                         # NOVÁ SEKCE: Mládež
│   ├── index.njk                   # /mladez/ (správce kategorií)
│   ├── dorostenci.njk              # /mladez/dorostenci/
│   ├── dorostenci-zapasy.njk       # /mladez/dorostenci/zapasy/
│   ├── dorostenci-tym.njk          # /mladez/dorostenci/tym/
│   └── [budou dalšímladší žáci, starší žáci, miniféra]
│
├── news/
│   ├── 2026-01-10-prvni-novinka.md
│   └── [další články]
│
├── pages/
│   ├── novinky.njk                 # /novinky/
│   ├── galerie.njk                 # /galerie/ (UPRAVENO)
│   ├── kontakty.njk                # /kontakty/ (UPRAVENO)
│   ├── partneri.njk                # /partneri/
│   ├── nabor.njk                   # /nábor/
│   ├── gdpr-cookies.njk            # /gdpr-cookies/
│   ├── tym.njk                     # [STARÝ - západ]
│   ├── zapasy.njk                  # [STARÝ – západ]
│   └── pages.json
│
├── index.njk                       # Domovská stránka (UPRAVENA)
├── 404.njk
└── robots.txt
```

---

## 🎯 Jak pokračovat?

### 1. Přidat dalších věkových kategorií mládeže

Budete mít soubory pro:
- **Starší žáci** (`src/mladez/starsi-zaci.njk`, `starsi-zaci-zapasy.njk`, `starsi-zaci-tym.njk`)
- **Mladší žáci** (`src/mladez/mlads-zaci.njk`, `mlads-zaci-zapasy.njk`, `mlads-zaci-tym.njk`)
- **Miniféra** (`src/mladez/minifera.njk`, `minifera-zapasy.njk`, `minifera-tym.njk`)

Každý soubor si zkopírujete z `dorostenci.njk` a upravíte číslo kategorie.

### 2. Filtrování zápasů podle mládeže

V `options` u `teams` v `matchesComputed.js` můžete přidat pole `category`, které filtruje zápasy podle věkové kategorie.

### 3. Vlastní logika hráčů

Pokud chcete mít speciální pole u hráčů (např. "narodil se", "pozice ve zdraví", atd.), editujte `config.yml` v admin sekci.

### 4. Dynamická galerie s lightboxem

Galérii lze rozšířit o JavaScript lightbox – např. `lightbox2` nebo `fancybox` – aby se fotky otevíraly v pop-up okně.

### 5. Importovat hráče – seznam třeba z PDF or XLS

Pokud máte seznam hráčů v tabulce, lze je hromadně importovat přes JavaScript nebo službu jako `Zapier`.

---

## 🚀 Build a deploy

```bash
npm install          # Instalace závislostí
npm run dev          # Lokální server na http://localhost:8080
npm run build        # Vygeneruje statickou stránku do _site/
npm run lint         # Kontrola JavaScriptu
```

Při `npm run build` se vygenerují všechny HTML soubory, které se pak uploadují na GitHub Pages.

---

## 🔗 Aktuální linky na strukturu

- **Admin**: `/admin/`
- **Domů**: `/`
- **Novinky**: `/novinky/`
- **Muži**: `/muzi/` → Zápasy `/muzi/zapasy/` → Tým `/muzi/tym/`
- **Mládež**: `/mladez/` → Dorostenci `/mladez/dorostenci/` → Zápasy/Tým
- **Ostatní**: `/galerie/`, `/partneri/`, `/kontakty/`, `/nabor/`, `/gdpr-cookies/`

---

## 💡 Tipy a triky

1. **Video v zápasech**: V poli "Video URL" zadejte odkaz na YouTube, Facebook video nebo `.mp4` soubor. Automaticky se vloží embed.
2. **Filtrování zápasů**: Na `/muzi/zapasy/` a `/mladez/*/zapasy/` jsou select/dropdown pro filtrování sezóny a soutěže.
3. **SEO**: V `src/_includes/partials/seo.njk` se nastavují meta tagy a Open Graph data.
4. **Responsive obrázky**: V šablonách se používá `image` shortcode, který automaticky generuje různé velikosti.

---

Máte-li otázky nebo chcete přidat nové funkce, můžete své požadavky napsat!
