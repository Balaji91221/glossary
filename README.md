# The Engineer's Field Manual

A searchable glossary of 289 engineering terms — backend, data, infrastructure,
security, and AI — written for people entering engineering and for people who
have been shipping for years but never had the words handed to them.

Every entry has three parts: what the term means, the specific way it goes
wrong in production, and — behind an **In depth** toggle — the mechanism
underneath, with the numbers, flags and failure modes attached. The second and
third parts are the ones that are usually missing.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production
npm run export:md            # regenerate docs/field-manual.md
```

Node 18.17+ required. No database, no environment variables, no API keys.

## Structure

```
app/
├── layout.js       fonts + metadata
├── page.js         assembles sections, owns the layer-filter state
└── globals.css     the whole design system (cyanotype blueprint)
components/
├── Hero.js         request-path selector; picking a stage filters the glossary
├── Glossary.js     search + category/layer filtering + highlighting
└── Sections.js     learning path, toolkit, footer
data/
├── taxonomy.js     16 categories, 8 layers, alias resolution
├── terms-a/b/c.js  the 289 terms, split for readability
├── toolkit.js      what library for what, with the reason attached
└── index.js        merges, slugs and builds the search index
scripts/
└── export-markdown.mjs   validates every entry, renders the manual to markdown
docs/
└── field-manual.md       generated — the whole manual as one readable file
```

## Adding a term

Append to any `terms-*.js` file:

```js
{
  t: "Term name",
  aka: "optional alias",
  c: "async",        // category id from taxonomy.js
  l: "app",          // layer id from taxonomy.js
  def: "What it is, in one sentence.",
  note: "The way it bites you in production.",
  depth: "Two to four sentences on the mechanism underneath — the flag, the " +
    "number, the specific failure. Never a restatement of def or note.",
}
```

Counts, search index, filters and the category chips all update automatically.
`npm run export:md` fails loudly if any entry is missing a field or points at a
category or layer that does not exist, so it doubles as the data test.

## Design notes

Cyanotype blueprint: Prussian ground with a drafting grid, chalk line work,
signal amber reserved for anything carrying a warning. Space Grotesk for
display, IBM Plex Sans for body, IBM Plex Mono for the terms themselves —
because a term is a thing you type. Amber marks warnings; the cyan rule marks
the **In depth** passage, which is reference, not alarm.

Press `/` anywhere to focus search, `Esc` to clear. Search covers the depth
passages too, so a match may be waiting inside a collapsed panel.
