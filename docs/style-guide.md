# Entry style guide

How a term in this manual is written. Every entry follows this standard, and
`npm test` checks the parts a script can check. Read this before adding or
editing a term.

The reader is an engineer in their first years of backend, data or AI work,
often reading English as a second language, usually mid-task. They need to
understand a term in under a minute and come back later for the mechanism.

## 1. The shape of an entry

Every term has seven parts, shown in this order on the site and in the
markdown export. Each part answers one question.

| # | Field | Question it answers | Length |
|---|---|---|---|
| 1 | `t` (+ `aka`) | What is it called? | 1–5 words; aliases separated by commas |
| 2 | `def` | What is it, precisely? | One sentence |
| 3 | `plain` | What is it, in everyday words? | ≤ 30 words |
| 4 | `example` | What does it look like in a real system? | 1–2 sentences, one concrete detail |
| 5 | `note` | Where does it go wrong in production? | 1–2 sentences |
| 6 | `depth` | What is the mechanism underneath? | 2–4 sentences |
| 7 | `see` | What should I read next? | 2–4 slugs |

Plus three tags: `c` (category id), `l` (layer id) and `level` (1, 2 or 3).

A reader who stops after part 4 must already understand the term. Parts 5–7
are for the day it breaks.

## 2. Rules per field

### `t` — the term

- Use the form an engineer types or says: `SIGTERM`, `N+1 query`, `Rate limiting`.
- Capitalise the first letter of the display form unless the term is
  conventionally lowercase (`async / await`, `stdout / stderr`).
- Two contrasted ideas may share one entry with "vs": `Merge vs rebase`.
- `aka` lists real synonyms and abbreviations only, comma-separated:
  `aka: "DLQ"`, `aka: "package.json, pyproject.toml"`. Not related terms.

### `def` — the definition

- **One sentence**, present tense, in the form *genus + differentia*: what kind
  of thing it is, then what makes it this thing and not its neighbours.
  - ✅ `A holding queue for messages that failed repeatedly and will never succeed.`
  - ❌ `Fluent, confident, wrong output.` (a fragment, no genus)
  - ❌ `2xx success, 3xx redirect, 4xx caller's fault, 5xx server's fault.` (a list, not a definition)
- Never use the term inside its own definition.
- Never use "is when" or "is where".
- A "vs" entry may use two short sentences, one per side.
- Any technical word in the definition must itself be a term in this manual,
  or an everyday word. If it is neither, either add the term or use a simpler word.

### `plain` — in plain words

- **At most 30 words.** Shorter is better.
- Written for a smart person who is not an engineer. No jargon that is not
  itself an entry.
- Must add a new angle: a comparison to daily life, or the simplest concrete
  phrasing. It must **not** restate `def` with synonyms.
  - ✅ `Pressing a lift button five times does not call five lifts. An idempotent operation is safe to repeat.`
  - ❌ `The property that repeating an operation gives the same outcome.` (paraphrase)
- A comparison is welcome but optional. If none is honest, use a concrete phrasing instead.

### `example` — one concrete scenario

- **1–2 sentences**, present tense. Start with a situation, end with the consequence.
- Must contain **at least one concrete detail**: a number, a status code, a
  command, a flag, a filename, a table or column name.
- Must be a **different scenario** from `note`. If `note` talks about a
  charged card, the example talks about something else.
- Numbers must be plausible for a real system and follow §4.

### `note` — where it goes wrong

- The specific way this term causes an incident, a slow page, a lost message,
  a wrong number. This is the amber line on the site.
- Keep the existing voice: direct, slightly dry. Humour is allowed **only** if
  a second-language reader would still get the point (see §5).

### `depth` — in depth

- 2–4 sentences on the mechanism: the flag, the number, the specific failure,
  the trade-off. Never a restatement of `def` or `note`.
- May name tools and commands. Follow the numbers policy in §4.
- This is the reference layer; it is allowed to be dense. It is not allowed
  to be vague.

### `see` — related terms

- **2–4 slugs** of other terms (`see: ["idempotency-key", "dead-letter-queue"]`).
- Every slug must exist. Never link an entry to itself.
- Prefer terms the entry already mentions, and at least one from another
  category when natural, so the links form a graph rather than a list.
- Reciprocal links are encouraged but not required.

### `level` — reading order

| Level | Name | Rule of thumb |
|---|---|---|
| 1 | Foundation | You meet it in the first month of any engineering job. An intern must know it. |
| 2 | Working | You meet it the first time you run something in production or work in a team. Assumed in code review. |
| 3 | Advanced | Only matters past a certain scale, or in a specialist area. Senior engineers argue about it. |

Roughly a third of terms should be level 1. If a category has no level-1
term, something foundational is missing.

## 3. Slugs

The slug is derived automatically from `t`: lowercase, every run of
non-alphanumeric characters becomes `-`, leading and trailing `-` removed.

| `t` | slug |
|---|---|
| `N+1 query` | `n-1-query` |
| `Merge vs rebase` | `merge-vs-rebase` |
| `Logs, metrics, traces` | `logs-metrics-traces` |
| `Conway's law` | `conway-s-law` |

Run `npm test` to see the slug of every term, or check `docs/field-manual.md`.

## 4. Numbers policy

Numbers make an entry trustworthy only if they are true.

- State a number only when it is a documented default or limit you could cite
  (Kubernetes `terminationGracePeriodSeconds` 30 s; SQS visibility timeout
  30 s; Postgres `max_connections` 100; SQS message cap 256 KB; nginx
  `client_max_body_size` 1 MB).
- Rules of thumb are fine when marked as such: "about", "roughly", "typically".
- If you are not sure, leave the number out. A sentence without a number is
  better than a sentence with a wrong one.
- Never invent version numbers, dates or benchmark results.

## 5. Language

- British spelling, to match the existing text: `serialise`, `behaviour`,
  `normalisation`, `optimisation`.
- Sentences under about 25 words where possible. One idea per sentence.
- Prefer the concrete word: "the database" over "the persistence layer".
- Expand an acronym the first time it appears in an entry unless it is the
  term itself or a universally known one (HTTP, SQL, CPU, JSON, API).
- **Idioms**: if a reader would need a dictionary of idioms, replace it.

| Avoid | Use instead |
|---|---|
| how it bites, bites you | where it goes wrong, fails |
| belt and braces | a second safeguard |
| a rumour (for an untested thing) | unverified, untested |
| on a Tuesday afternoon | during an incident |
| criminally underused | rarely used and very useful |
| cheerfully continues | keeps running |
| colonising your codebase | spreading through your codebase |
| wearing a costume | in disguise |
| ambush | surprise |
| folklore | an opinion with no reason attached |
| the long pole | the slowest part |
| a coffee break | a few minutes |
| the whole edifice | the whole system |

Wit that survives translation may stay ("It is always DNS."). Wit that
depends on an idiom goes.

## 6. Worked example

Before (v1):

```js
{
  t: "Hallucination",
  c: "ai", l: "ai",
  def: "Fluent, confident, wrong output.",
  note: "The core reliability problem. Grounding, citations and verification reduce it; nothing eliminates it.",
  depth: "It is intrinsic to the mechanism — …",
}
```

After (v2):

```js
{
  t: "Hallucination",
  c: "ai", l: "ai", level: 1,
  def: "Model output that is fluent and confident but factually wrong or unsupported by any source.",
  plain: "The model writes something that sounds right but is made up, the way a confident person fills a gap in their memory.",
  example: "Asked how to cancel a subscription with the SDK, the model returns client.subscriptions.cancel_now(), a method that does not exist. It reads correctly and fails at runtime.",
  note: "The core reliability problem. Grounding, citations and verification reduce it; nothing eliminates it.",
  depth: "It is intrinsic to the mechanism — …",
  see: ["rag", "grounding-citations", "eval", "llm-as-judge"],
}
```

What changed and why:

- `def` became a sentence with a genus ("model output") and a differentia
  ("fluent and confident but wrong").
- `plain` adds a comparison instead of a paraphrase.
- `example` has a concrete detail (a method name) and a consequence.
- `see` links it into the graph.
- `note` and `depth` are unchanged: the voice is kept, the clarity is added around it.

## 7. Gap evidence (2026-09-09 scan)

A glossary must not use a term it does not define. A scan of every `def`,
`note` and `depth` found these words used inside entries without an entry of
their own. Counts are the number of entries that mention the word.

| Word | Entries | Word | Entries |
|---|---|---|---|
| client / server | 29 / 27 | join | 6 |
| latency / throughput | 24 / 7 | partition, offset (Kafka) | 10 / 6 |
| pod, Kubernetes | 12 / 7 | acknowledgement (ack) | 5 |
| kernel | 10 | middleware | 4 |
| tenant | 8 | cookie | 4 |
| serialisation | 8 | TCP | 4 |
| refactor | 7 | health check, thread pool, contract test | 3 each |
| write-ahead log (WAL) | 6 | Server-Sent Events | 3 |
| outbox, load shedding, unique constraint, HMAC, ETag, schema registry, supervisor, KMS | 2 each | | |

Every word in this table now has an entry. When you add an entry that
introduces a new technical word, add that word too, or use a simpler one.

## 8. Review checklist

Before opening a pull request that adds or edits a term:

- [ ] `npm test` passes with no errors (warnings are advice, read them).
- [ ] `def` is one sentence with a genus, and does not contain the term.
- [ ] `plain` is ≤ 30 words and is not a paraphrase of `def`.
- [ ] `example` has a concrete detail and is a different scenario from `note`.
- [ ] Every number is a documented default or marked as a rule of thumb.
- [ ] Every technical word in `def` and `plain` is itself an entry or an everyday word.
- [ ] `see` has 2–4 existing slugs, none of them the entry itself.
- [ ] `level` follows the rubric in §2.
- [ ] No idiom from §5.
- [ ] `npm run export:md` was run, so `docs/field-manual.md` is current.
