// One slug function, shared by the site, the validator and the exporter, so
// a link written in `see` resolves the same way everywhere.
export function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
