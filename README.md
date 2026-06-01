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

```bash
npm run dev
```

Pak otevri:

```text
http://localhost:4173
```

## Nasazeni

Projekt je staticky. Na Cloudflare Pages nebo podobny hosting staci nasadit cely obsah repozitare.

Pro zivy EduPage kalendar je pripravena Cloudflare Pages Function:

```text
functions/calendar.ics.js
```

V nastaveni Pages pridej environment promennou:

```text
EDUPAGE_ICS_URL=https://...
```

Pokud proxy jeste neni nastavena, aplikace stale funguje pres rucni import `.ics` souboru.
