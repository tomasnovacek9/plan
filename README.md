# Generator tydenniho planu

Cista staticka verze aplikace pro pripravu tydenniho planu skoly.

## Co umi

- nacist zivy kalendar z `/calendar.ics`, pokud ho hosting poskytuje,
- importovat `.ics` soubor rucne,
- filtrovat rezervace a beznou vyuku,
- pridavat, upravovat a mazat rucni zaznamy,
- ukladat stav do prohlizece pres `localStorage`,
- psat poznamku ke konkretnimu tydnu,
- upravovat bunky `Zodpovida` primo v nahledu,
- tisknout a exportovat A4 PDF.

## Spusteni lokalne

Projekt pouziva Node.js 22. Pokud pouzivas `nvm`:

```bash
nvm use
```

Pak nainstaluj zavislosti:

```bash
npm install
```

A spust lokalni Vite server:

```bash
npm run dev
```

Pak otevri:

```text
http://localhost:4173
```

## Kontroly a build

Pred commitem je dobre pustit:

```bash
npm run check
```

Tento prikaz znovu vygeneruje legacy baliky, zkontroluje syntaxi JavaScriptu
a overi lokalni odkazy v `index.html`.

Produkce se sestavi do `dist/` jako staticka kopie aplikace:

```bash
npm run build
```

## Struktura

Aktualni verze vychazi z puvodniho jednosouboroveho HTML, ale inline casti jsou
rozdelene do samostatnych souboru:

- `index.html` drzi kostru stranky a poradi nacitani.
- `src/styles/legacy/` obsahuje puvodni styly rozdelene podle jejich historickych `id`.
- `src/scripts/legacy/` obsahuje puvodni skripty rozdelene podle jejich historickych `id`.
- `src/styles/pro-redesign.css` je nova moderni vizualni vrstva.
- `src/scripts/pro-redesign.js` obsahuje drobne nove chovani panelu.
- `src/assets/generated/` obsahuje obrazky vytazene z puvodnich base64 dat.
- `tools/` obsahuje pomocne skripty pro opakovatelny cleanup inline assetu.
- `src/styles/legacy/bundle.css` a `src/scripts/legacy/bundle.js` jsou
  generovane soubory pro rychlejsi nacitani aplikace.
- `tools/build-static-dist.mjs` vytvori produkcni `dist/` bez transformace cest,
  aby se legacy skripty nacitaly ze stejnych URL jako lokalne.

Pri dalsich upravach je nejbezpecnejsi sahat nejdriv do `pro-redesign.css`
a `pro-redesign.js`. Legacy soubory je dobre menit jen cilene, protoze kopiruji
puvodni funkcni aplikaci.

## Nasazeni

Projekt je staticky. Na Cloudflare Pages nastav:

```text
Build command: npm run build
Build output directory: dist
Node.js version: 22
```

Pro zivy EduPage kalendar je pripravena Cloudflare Pages Function:

```text
functions/calendar.ics.js
```

V nastaveni Pages pridej environment promennou:

```text
EDUPAGE_ICS_URL=https://...
```

Pokud proxy jeste neni nastavena, aplikace stale funguje pres rucni import `.ics` souboru.
