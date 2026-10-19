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

## Tisk a PDF

Tlačítko **Tisk / export** otevře společný náhled A4. Volba **Vytisknout / uložit PDF**
spustí systémový tisk; pro PDF vyber „Uložit jako PDF“. Ponech A4 na výšku,
měřítko 100 % a vypni automatické záhlaví a zápatí prohlížeče.

Tisk zachovává obsah, pořadí, písmo a barvy aktuálního náhledu. Tabulka se dělí mezi řádky a záhlaví sloupců se opakuje. Hlavička s logem a názvem plánu je pouze na první straně. Tisk nemění grafiku tabulky.
Opakované celodenní akce zůstávají první v daném dni a uložené úpravy se zachovají.

Test řazení: `npm test`. Test skutečného rozložení v Chrome/Chromium:

```bash
CHROME_BIN="/cesta/k/chrome" npm test
```

Test používá krátký plán, hustý týden a dlouhý den. Výjimečný záznam delší než
celá stránka se může rozdělit, aby se žádný text neodřízl.

## Úprava času a textu

Kliknutím na čas v tabulce otevřeš editor s přesným časem, rozsahem vyučovacích
hodin a celodenním režimem. Rozsahy lze předvyplnit rychlými volbami. Čas se
uloží až tlačítkem „Uložit změny“; „Zrušit“ a Escape návrh zahodí.

Kliknutí do Akce nebo Zodpovídá otevře formátování velikosti, barvy, tučného
písma a kurzívy. Platí pro označený text nebo celou buňku; ukládá se automaticky.
„Výchozí vzhled“ odstraní formátování a zachová text.

Funkční test editorů: `CHROME_BIN="/cesta/k/chrome" npm run test:editors`.

## Příjmení učitelů ze školního webu

Funkce `/teachers.json` načítá veřejné stránky zaměstnanců a školního poradenského pracoviště na www.zsbabak.cz.
Adresář se na síti obnovuje nejvýše jednou za hodinu. V „Zodpovídá“ se zkratka
nahradí příjmením pouze při jediné shodě podle začátku příjmení, případně iniciály
jména (např. `NovT`, `Nov T.` nebo `T. Nov`). Více možností, neznámá zkratka nebo
neúplný adresář ponechají původní text. Výpadek adresáře neblokuje kalendář.
Původní události a klíče ručních úprav se při doplnění příjmení nemění.

## Nástroje plánu

Nad náhledem jsou dostupné návrat na aktuální týden, kopírování vlastní akce do
jiného dne stejného týdne, stažení JSON zálohy, obnovení zálohy a přehled zkratek,
pro které není jednoznačné příjmení. Záloha obsahuje uložené vlastní úpravy ze
všech týdnů v tomto prohlížeči. Obnovení vyžaduje potvrzení nahrazení shodných
položek; jiné položky zůstávají zachované.

Hlavní náhled neukazuje odhadované konce stran. Skutečné listy jsou v tiskovém
náhledu, kde je u rozděleného dne na první části „pokračuje na další straně“
a na následující „pokračování“. Automatické nahrávání na SharePoint není zapojeno.
