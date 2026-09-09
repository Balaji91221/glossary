// Validates every term against docs/style-guide.md. Run with `npm test`.
//
//   node scripts/validate.mjs             validate everything the site loads
//   node scripts/validate.mjs --only ai   validate one category file while
//                                         sibling files may be mid-edit
//
// Errors exit non-zero. Warnings are style advice and never fail the run.

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CATEGORIES, LAYERS } from "../data/taxonomy.js";
import { slugify } from "../data/slug.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED = ["t", "c", "l", "level", "def", "plain", "example", "note", "depth", "see"];
const IDIOMS = [
  /\bbites?\b/i,
  /belt and braces/i,
  /\brumour\b/i,
  /Tuesday/i,
  /criminally/i,
  /cheerfully/i,
  /colonis/i,
  /costume/i,
  /ambush/i,
  /folklore/i,
  /long pole/i,
  /coffee break/i,
  /edifice/i,
];
const CONCRETE = /\d|[A-Z]{2,}|\w+_\w+|\w+\.\w+|--?\w{2,}|\/\w+|\w+\(\)/;

const only = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1]
  : null;

async function loadCategoryFile(id) {
  const mod = await import(`../data/terms/${id}.js`);
  if (!Array.isArray(mod.TERMS)) throw new Error(`data/terms/${id}.js must export TERMS`);
  return mod.TERMS;
}

async function loadPlanned() {
  try {
    const raw = JSON.parse(await readFile(join(ROOT, "scripts", "planned-terms.json"), "utf8"));
    const slugs = new Set();
    for (const [cat, list] of Object.entries(raw)) {
      if (cat.startsWith("_")) continue;
      for (const p of list) slugs.add(slugify(p.t));
    }
    return slugs;
  } catch {
    return new Set();
  }
}

function words(s) {
  return String(s).trim().split(/\s+/).filter(Boolean).length;
}

function sentences(s) {
  return String(s).trim().split(/(?<=[.!?])\s+/).filter(Boolean).length;
}

export function validateTerms(terms, { knownSlugs, pendingSlugs = new Set(), label = "" }) {
  const errors = [];
  const warnings = [];
  const categoryIds = new Set(CATEGORIES.map((c) => c.id));
  const seenSlug = new Map();
  const seenName = new Map();
  const levelOneByCategory = new Map();

  for (const term of terms) {
    const where = `${label}${term.t || "(unnamed)"}`;
    const err = (rule, msg) => errors.push(`${where} — ${rule}: ${msg}`);
    const warn = (rule, msg) => warnings.push(`${where} — ${rule}: ${msg}`);

    for (const field of REQUIRED) {
      const v = term[field];
      const empty = v === undefined || v === null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && v.length === 0);
      if (empty) err("missing", `field "${field}" is required`);
    }
    if (!term.t) continue;

    const slug = slugify(term.t);
    if (seenSlug.has(slug)) err("duplicate", `slug "${slug}" already used by "${seenSlug.get(slug)}"`);
    seenSlug.set(slug, term.t);
    const lower = term.t.toLowerCase();
    if (seenName.has(lower)) err("duplicate", `name already used (case-insensitive)`);
    seenName.set(lower, true);

    if (term.c && !categoryIds.has(term.c)) err("taxonomy", `unknown category "${term.c}"`);
    if (term.l && !LAYERS[term.l]) err("taxonomy", `unknown layer "${term.l}" (use one of ${Object.keys(LAYERS).join(", ")})`);
    if (term.level !== undefined && ![1, 2, 3].includes(term.level)) err("level", `must be 1, 2 or 3, got ${JSON.stringify(term.level)}`);
    if (term.level === 1 && term.c) levelOneByCategory.set(term.c, true);

    if (typeof term.aka === "string" && /\bsee\b|related/i.test(term.aka)) warn("aka", `aka should list synonyms only`);

    if (term.def) {
      if (!/[.!?]$/.test(term.def.trim())) warn("def", `should end with a full stop`);
      if (sentences(term.def) > 2) warn("def", `should be one sentence (two for a "vs" entry), found ${sentences(term.def)}`);
      if (/\bis (when|where)\b/i.test(term.def)) warn("def", `avoid "is when" / "is where"`);
      const defLower = term.def.toLowerCase();
      if (!/\bvs\b|\/|&|,/.test(term.t) && defLower.includes(lower)) warn("def", `uses the term inside its own definition`);
    }
    if (term.plain) {
      const n = words(term.plain);
      if (n > 30) err("plain", `must be at most 30 words, found ${n}`);
      if (term.def && term.plain.trim().toLowerCase() === term.def.trim().toLowerCase()) err("plain", `identical to def`);
    }
    if (term.example) {
      if (!CONCRETE.test(term.example)) warn("example", `has no concrete detail (a number, code, flag, filename or status code)`);
      if (sentences(term.example) > 3) warn("example", `should be 1–2 sentences, found ${sentences(term.example)}`);
    }
    if (term.see !== undefined) {
      if (!Array.isArray(term.see)) err("see", `must be an array of slugs`);
      else {
        if (term.see.length < 2 || term.see.length > 4) err("see", `must list 2–4 slugs, found ${term.see.length}`);
        const dup = term.see.filter((s, i) => term.see.indexOf(s) !== i);
        if (dup.length) err("see", `duplicate slug(s): ${dup.join(", ")}`);
        for (const s of term.see) {
          if (s === slug) err("see", `links to itself`);
          else if (knownSlugs.has(s)) continue;
          else if (pendingSlugs.has(s)) warn("see", `"${s}" is planned but not written yet`);
          else err("see", `unknown slug "${s}"`);
        }
      }
    }
    for (const field of ["def", "plain", "example", "note", "depth"]) {
      const v = term[field];
      if (typeof v !== "string") continue;
      for (const re of IDIOMS) {
        if (re.test(v)) warn("idiom", `"${field}" matches ${re} — see style guide §5`);
      }
    }
    if (term.depth && term.def && term.depth.trim() === term.def.trim()) err("depth", `identical to def`);
  }

  const cats = new Set(terms.map((t) => t.c).filter(Boolean));
  for (const c of cats) {
    if (!levelOneByCategory.has(c)) warnings.push(`${label}category "${c}" — level: has no level-1 (Foundation) term`);
  }

  return { errors, warnings };
}

function report({ errors, warnings }, summary) {
  for (const w of warnings) console.warn(`  warn  ${w}`);
  for (const e of errors) console.error(`  ERROR ${e}`);
  console.log(`${summary} — ${errors.length} error(s), ${warnings.length} warning(s)`);
  return errors.length === 0;
}

async function main() {
  const planned = await loadPlanned();

  if (only) {
    if (!CATEGORIES.some((c) => c.id === only)) {
      console.error(`Unknown category "${only}". Use one of: ${CATEGORIES.map((c) => c.id).join(", ")}`);
      process.exit(2);
    }
    const mine = await loadCategoryFile(only);
    const knownSlugs = new Set(mine.map((t) => slugify(t.t)));
    for (const c of CATEGORIES) {
      if (c.id === only) continue;
      try {
        for (const t of await loadCategoryFile(c.id)) knownSlugs.add(slugify(t.t));
      } catch (e) {
        console.warn(`  note  could not load data/terms/${c.id}.js (${e.message.split("\n")[0]}); its slugs count as pending`);
      }
    }
    const result = validateTerms(mine, { knownSlugs, pendingSlugs: planned, label: `${only}: ` });
    const ok = report(result, `data/terms/${only}.js — ${mine.length} terms`);
    process.exit(ok ? 0 : 1);
  }

  const { TERMS } = await import("../data/index.js");
  const { ROUTE } = await import("../data/route.js");
  const knownSlugs = new Set(TERMS.map((t) => t.slug));
  const result = validateTerms(TERMS, { knownSlugs, pendingSlugs: planned });

  for (const step of ROUTE) {
    for (const s of step.terms || []) {
      if (!knownSlugs.has(s)) result.errors.push(`route "${step.title}" — unknown slug "${s}"`);
    }
  }
  const stillPlanned = [...planned].filter((s) => !knownSlugs.has(s));
  if (stillPlanned.length) {
    result.warnings.push(`planned-terms.json — ${stillPlanned.length} planned term(s) not written yet: ${stillPlanned.join(", ")}`);
  }

  const byLevel = [1, 2, 3].map((l) => TERMS.filter((t) => t.level === l).length);
  const ok = report(
    result,
    `${TERMS.length} terms · ${CATEGORIES.length} categories · levels ${byLevel.join("/")}`
  );
  process.exit(ok ? 0 : 1);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
