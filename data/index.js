import { TERMS_A } from "./terms-a.js";
import { TERMS_B } from "./terms-b.js";
import { TERMS_C } from "./terms-c.js";
import { CATEGORIES } from "./taxonomy.js";

export const TERMS = [...TERMS_A, ...TERMS_B, ...TERMS_C].map((term, i) => ({
  ...term,
  id: `t-${i}`,
  slug: term.t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  // depth is searchable too — a match may sit in the collapsed panel.
  search: [term.t, term.aka || "", term.def, term.note, term.depth || ""]
    .join(" ")
    .toLowerCase(),
}));

export const TERM_COUNT = TERMS.length;

export const COUNTS_BY_CATEGORY = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = TERMS.filter((t) => t.c === c.id).length;
  return acc;
}, {});

export { CATEGORIES, CATEGORY_BY_ID, LAYERS } from "./taxonomy.js";
export { TOOLKIT } from "./toolkit.js";
