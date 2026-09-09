// The single place the site, the validator and the exporter get their data.
// Merges the per-category files in taxonomy order, derives slugs and search
// fields, and resolves every `see` link to the term it points at.

import { TERMS_BY_CATEGORY } from "./terms/index.js";
import { CATEGORIES, LAYERS } from "./taxonomy.js";
import { slugify } from "./slug.js";

export const LEVELS = {
  1: { id: 1, label: "Foundation", blurb: "You meet it in your first month. Start here." },
  2: { id: 2, label: "Working", blurb: "Assumed once you run something in production." },
  3: { id: 3, label: "Advanced", blurb: "Matters at scale or in a specialist area." },
};

const RAW = CATEGORIES.flatMap((c) => TERMS_BY_CATEGORY[c.id] || []);

export const TERMS = RAW.map((term, i) => ({
  ...term,
  id: `t-${i}`,
  slug: slugify(term.t),
  // Search fields are split so results can be ranked: a hit on the name
  // outranks a hit on an alias, which outranks a hit in the definition,
  // which outranks a hit somewhere in the depth passage.
  searchName: term.t.toLowerCase(),
  searchAka: (term.aka || "").toLowerCase(),
  searchHead: [term.def, term.plain || "", term.example || ""].join(" ").toLowerCase(),
  searchBody: [term.note, term.depth || ""].join(" ").toLowerCase(),
}));

export const BY_SLUG = new Map(TERMS.map((t) => [t.slug, t]));

for (const t of TERMS) {
  t.related = (t.see || [])
    .map((s) => BY_SLUG.get(s))
    .filter(Boolean)
    .map((r) => ({ slug: r.slug, t: r.t, c: r.c }));
}

export const TERM_COUNT = TERMS.length;

export const COUNTS_BY_CATEGORY = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = TERMS.filter((t) => t.c === c.id).length;
  return acc;
}, {});

export const COUNTS_BY_LEVEL = [1, 2, 3].reduce((acc, l) => {
  acc[l] = TERMS.filter((t) => t.level === l).length;
  return acc;
}, {});

export const LAYER_COUNT = Object.keys(LAYERS).length;

export { CATEGORIES, CATEGORY_BY_ID, LAYERS, resolveLayer } from "./taxonomy.js";
export { TOOLKIT } from "./toolkit.js";
export { ROUTE } from "./route.js";
export { slugify } from "./slug.js";
