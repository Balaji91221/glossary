// Ranked search over the term list. Pure functions, no state.
//
// A query is split into tokens; every token must match somewhere (AND).
// Each token scores by where it matched, and the term's score is the sum,
// so "lock" ranks "Lock / mutex" above an entry that merely mentions locks.

const WEIGHT = {
  exactName: 100,
  namePrefix: 80,
  nameContains: 60,
  aka: 40,
  head: 20,
  body: 5,
};

export function tokenise(query) {
  return String(query || "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function scoreToken(term, token) {
  if (term.searchName === token) return WEIGHT.exactName;
  if (term.searchName.startsWith(token)) return WEIGHT.namePrefix;
  if (term.searchName.includes(token)) return WEIGHT.nameContains;
  if (term.searchAka.includes(token)) return WEIGHT.aka;
  if (term.searchHead.includes(token)) return WEIGHT.head;
  if (term.searchBody.includes(token)) return WEIGHT.body;
  return 0;
}

// Returns 0 when any token fails to match, otherwise the summed score.
export function scoreTerm(term, tokens) {
  let total = 0;
  for (const token of tokens) {
    const s = scoreToken(term, token);
    if (s === 0) return 0;
    total += s;
  }
  return total;
}

export function rankTerms(terms, query) {
  const tokens = tokenise(query);
  if (tokens.length === 0) return terms;
  return terms
    .map((term) => ({ term, score: scoreTerm(term, tokens) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.term.t.localeCompare(b.term.t))
    .map((x) => x.term);
}
