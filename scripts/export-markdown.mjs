// Renders the whole manual to docs/field-manual.md so it can be read, diffed
// and printed outside the browser. Run with `npm run export:md`.
//
// It also validates the data on the way through: every term must carry a
// definition, a note and a depth passage, and every category and layer id must
// exist in the taxonomy. A failure here exits non-zero, so CI can run it.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { TERMS } from "../data/index.js";
import { CATEGORIES, LAYERS, resolveLayer } from "../data/taxonomy.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs", "field-manual.md");

function validate(terms) {
  const problems = [];
  const categoryIds = new Set(CATEGORIES.map((c) => c.id));
  const seen = new Map();

  for (const term of terms) {
    const where = term.t || `(unnamed term ${term.id})`;
    for (const field of ["t", "c", "l", "def", "note", "depth"]) {
      if (!term[field] || !String(term[field]).trim()) {
        problems.push(`${where}: missing ${field}`);
      }
    }
    if (term.c && !categoryIds.has(term.c)) {
      problems.push(`${where}: unknown category "${term.c}"`);
    }
    if (term.l && !resolveLayer(term.l)) {
      problems.push(`${where}: unknown layer "${term.l}"`);
    }
    if (seen.has(term.slug)) {
      problems.push(`${where}: duplicate slug "${term.slug}"`);
    }
    seen.set(term.slug, true);
  }

  return problems;
}

function render(terms) {
  const lines = [];
  const push = (...s) => lines.push(...s);

  push("# The Engineer's Field Manual");
  push("");
  push(
    `${terms.length} terms across ${CATEGORIES.length} areas and ` +
      `${Object.keys(LAYERS).length} layers of a running system.`
  );
  push("");
  push(
    "Each entry has three parts: **what it is**, **how it bites** in " +
      "production, and **in depth** — the mechanism underneath, for when the " +
      "one-liner is not enough."
  );
  push("");
  push(
    "Generated from `data/terms-*.js` by `npm run export:md`. Edit the data, " +
      "not this file."
  );
  push("");

  push("## Contents");
  push("");
  for (const cat of CATEGORIES) {
    const count = terms.filter((t) => t.c === cat.id).length;
    if (!count) continue;
    push(`- [${cat.name}](#${cat.id}) — ${cat.kicker} · ${count} terms`);
  }
  push("");

  for (const cat of CATEGORIES) {
    const items = terms.filter((t) => t.c === cat.id);
    if (!items.length) continue;

    push(`<a id="${cat.id}"></a>`);
    push("");
    push(`## ${cat.name}`);
    push("");
    push(`*${cat.kicker}*`);
    push("");
    push(cat.summary);
    push("");

    for (const term of items) {
      const aka = term.aka ? ` *(aka ${term.aka})*` : "";
      push(`### ${term.t}${aka}`);
      push("");
      push(`\`${resolveLayer(term.l).label}\``);
      push("");
      push(term.def);
      push("");
      push(`> ${term.note}`);
      push("");
      push(term.depth);
      push("");
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

const problems = validate(TERMS);
if (problems.length) {
  console.error(`Export failed — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  • ${p}`);
  process.exit(1);
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, render(TERMS), "utf8");

const words = TERMS.reduce((n, t) => n + t.depth.split(/\s+/).length, 0);
console.log(
  `Wrote docs/field-manual.md — ${TERMS.length} terms, ` +
    `${words.toLocaleString("en-GB")} words of depth passages.`
);
