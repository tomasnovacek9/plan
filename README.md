# Generator tydenniho planu

Webová aplikace pro přípravu týdenního plánu školy s kalendářem EduPage a společným ukládáním přes Cloudflare Pages Functions a D1.

## Co umi

- nacist zivy kalendar z `/calendar.ics`, pokud ho hosting poskytuje,
- importovat `.ics` soubor rucne,
- filtrovat rezervace a beznou vyuku,
- pridavat, upravovat a mazat rucni zaznamy,
- sdílet vlastní úpravy mezi uživateli přes server a ponechat místní zálohu v prohlížeči,
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
libovolného dne včetně jiného týdne, stažení JSON zálohy, obnovení zálohy a přehled zkratek,
pro které není jednoznačné příjmení. Záloha obsahuje uložené vlastní úpravy ze
všech týdnů v tomto prohlížeči. Obnovení vyžaduje potvrzení nahrazení shodných
položek; jiné položky zůstávají zachované.

Hlavní náhled neukazuje odhadované konce stran. Skutečné listy jsou v tiskovém
náhledu, kde je u rozděleného dne na první části „pokračuje na další straně“
a na následující „pokračování“. Automatické nahrávání na SharePoint není zapojeno.


## Společné ukládání

Zapnutí schváleno uživatelem 22. 10. 2026. Produkční projekt `plan` používá
samostatnou databázi `plan-shared-db` (`0affabfd-9be3-4c9b-8186-01b47e554542`)
připojenou přes vazbu `PLAN_DB`. Nastavení vazby je v Cloudflare Pages, není
součástí statických souborů.

Společný plán je přístupný k prohlížení i úpravám všem, kteří otevřou odkaz.
Nejde o přihlášení do EduPage; zdrojový kalendář se nemění.
Sdílí se vlastní akce, úpravy buněk, smazání, formátování, týdenní poznámky,
podpis, datum a autor vytvoření a zobrazení víkendu či data vytvoření.
Otevřený týden zůstává volbou jednotlivého uživatele.

`functions/shared-plan.json.js` vyžaduje vazbu D1 databáze **PLAN_DB**.
Schéma je v `migrations/0001_shared_plan.sql`. Před nasazením této verze:

1. Vytvořit samostatnou D1 databázi `plan-shared-db` ve stávajícím účtu Cloudflare.
2. Spustit na nové databázi SQL migraci `migrations/0001_shared_plan.sql`.
3. Připojit databázi k produkčnímu Pages projektu `plan` jako `PLAN_DB`.
4. Nasadit nový kód a zkontrolovat `/shared-plan.json` a dvě oddělená otevření aplikace.

**Vytvoření databáze a zapnutí v produkci vyžaduje potvrzení uživatele.**
Při nedostupném společném úložišti první načtení pozastaví editaci a zobrazí
chybu s možností opakování. Aplikace neoznačuje lokální uložení za společné.
U dalších výpadků se čekající změny zachovají místně a po připojení se odešlou.
Každé otevření má vlastní frontu změn. Po zavření jiného okna lze jeho čekající
frontu převzít tlačítkem „Obnovit neodeslané změny“.

Před prvním přechodem z místního ukládání se původní sdílené položky uloží pod
`tydenni_plan_before_shared_v340`. Následně se načte společná verze. Původní
místní práce se automaticky nezveřejňuje ani nepřepisuje práci kolegů.
Jednorázový převod dosavadních místních úprav byl dokončen. Na žádost uživatele
bylo tlačítko „Převést místní úpravy“ odstraněno; původní místní záloha zůstává
uložená. Nové úpravy se sdílí automaticky.

Změny se odesílají po 500 ms; jiná otevření kontrolují společný plán každé
4 sekundy, když jsou viditelná. Aktivní psaní, dialog a rozpracovaná úprava času
se nepřekreslují. Nezávislé údaje se slučují; současné změny stejného údaje
vyžadují volbu společné nebo vlastní verze. Přijetí společné verze zachová
ostatní nekonfliktní místní změny a odloží původní návrh do místní zálohy.
Server používá podmíněný zápis podle revize a ukládá historii úspěšných verzí.

Test serveru a slučování: `npm run test:shared` (také součást `npm test`).
Integrační test tří oddělených prohlížečů s lokální databází:

```bash
CHROME_BIN="/cesta/k/chrome" npm run test:shared:browser
```

Test potřebuje dostupný balíček `playwright`; alternativně proměnná
`PLAYWRIGHT_MODULE` určuje cestu k jeho `index.mjs`. Testuje zachování místní zálohy bez převodního tlačítka,
přenos běžných úprav, metadata, souběh, konflikt, výpadek připojení,
opakované otevření, nového čtenáře a sanitizaci sdíleného formátovaného textu.
