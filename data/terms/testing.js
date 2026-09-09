// Testing & quality — Proving it works.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
  {
    t: "Unit test",
    c: "testing",
    l: "craft",
    def: "A test of one function or class in isolation, with dependencies replaced by fakes.",
    note: "Fast enough to run on every save. If it needs a database, it is not a unit test.",
    depth:
      "Test behaviour through the public interface, not implementation: a test that asserts a private method was called breaks on every refactor while catching nothing, which is how suites become an obstacle rather than a safety net. Structure each one as arrange/act/assert with a name that states the expectation ('rejects_expired_token'), so a failure report reads as a specification. Aim for milliseconds — a suite you can run on save changes how you work; a two-minute one gets run at the end, by which point you have written the bug.",
  },
  {
    t: "Integration test",
    c: "testing",
    l: "craft",
    def: "A test of several real components working together — usually app plus real database.",
    note: "Where most genuine bugs actually live. Testcontainers makes these practical.",
    depth:
      "Use the real dependency, not an in-memory substitute: SQLite standing in for Postgres will not reproduce your JSONB queries, your constraint behaviour or your isolation level, so the test passes and production does not. Isolate runs by wrapping each test in a transaction that rolls back, or by truncating between tests — a shared, accumulating database is the leading cause of tests that pass alone and fail in a suite. Keep one container per session rather than per test, or the fixture cost dominates the runtime.",
  },
  {
    t: "End-to-end test",
    aka: "E2E",
    c: "testing",
    l: "craft",
    def: "Driving the whole system the way a user would, through the real interface.",
    note: "Highest confidence, slowest, flakiest. Keep a handful covering critical paths, not hundreds.",
    depth:
      "Almost all E2E flakiness is timing: sleep-based waits and CSS-selector coupling. Wait for a condition (an element visible, a request settled) rather than a duration, and select by accessible role or a stable data-testid so a class rename does not break twenty tests. Pick the flows by revenue and risk — signup, checkout, login — and accept that everything else is better covered lower down. Capture a video, a trace and a screenshot on failure, because a red CI run with only a stack trace is nearly unactionable.",
  },
  {
    t: "Test pyramid",
    c: "testing",
    l: "craft",
    def: "Many fast unit tests, fewer integration tests, a small number of end-to-end tests.",
    note: "Invert it and your suite takes an hour, fails randomly, and everyone stops trusting it.",
    depth:
      "The economics behind the shape: cost per test and time to diagnose both rise as you go up, while the realism of what is being verified rises too. The 'testing trophy' argument shifts weight toward integration tests, and for a typical web service it is often right — that is where the wiring bugs are. What matters more than the exact ratio is feedback time: a suite over ten minutes stops being run before pushing, and a suite that is not run before pushing is documentation.",
  },
  {
    t: "Mock / stub / fake",
    c: "testing",
    l: "craft",
    def: "A mock records how it was called. A stub returns canned answers. A fake is a working lightweight implementation.",
    note: "Over-mocking produces tests that verify your code calls the functions you wrote, which proves nothing.",
    depth:
      "Prefer a fake — an in-memory repository implementing the same interface — because it exercises real behaviour and survives refactoring, whereas a mock encodes today's call sequence into the test. Only mock at genuine boundaries you do not own, and even there prefer recorded fixtures (VCR-style) so the canned response is a real one. The unavoidable risk with any double is drift: your mock returns the shape the vendor had last year, so a contract test against the real thing is what keeps the whole edifice honest.",
  },
  {
    t: "Fixture",
    c: "testing",
    l: "craft",
    def: "Reusable setup — a test database, a seeded user, a configured client.",
    note: "pytest fixtures with scopes are the cleanest version of this idea in any language.",
    depth:
      "Scope is the performance dial and the isolation risk in one: session-scoped for expensive immutable things (a container, an app instance), function-scoped for anything a test mutates. Prefer factories with sensible defaults over static seed data — user_factory(plan='pro') states what the test depends on, while a shared fixtures.json means nobody dares change a row. The anti-pattern to watch for is a fixture that sets up more than the test needs, which quietly couples every test to details it never asked about.",
  },
  {
    t: "Flaky test",
    c: "testing",
    l: "craft",
    def: "A test that passes and fails without the code changing.",
    note: "Worse than no test, because it trains the team to ignore red builds. Fix it or delete it — do not retry it.",
    depth:
      "The usual causes are enumerable: real time (a test that fails at midnight or month end), test-order dependence through shared state, unawaited async work, network calls, and random data without a fixed seed. Diagnose order-dependence by shuffling the suite deliberately, and time-dependence by freezing the clock. Auto-retry is a trap — it hides the exact race your test just caught in production code. If you cannot fix it today, quarantine it out of the blocking suite with an owner and a date rather than leaving it to erode trust.",
  },
  {
    t: "Coverage",
    c: "testing",
    l: "craft",
    def: "The percentage of lines executed while tests run.",
    note: "A weak proxy. You can reach 100% with zero assertions. Useful for finding untested files, useless as a target.",
    depth:
      "Branch coverage is meaningfully stronger than line coverage — a line with an `and` in it can be fully covered with one of its conditions never exercised. Enforcing a global percentage produces assertion-free tests written to satisfy the gate; a diff-coverage check on changed lines only is far more useful and much harder to game. If you want to know whether your tests actually catch anything, mutation testing (mutmut, Stryker) changes the code and checks a test notices, which is the real question coverage is a proxy for.",
  },
  {
    t: "Regression",
    c: "testing",
    l: "craft",
    def: "Something that used to work and now does not.",
    note: "Every bug fix deserves a test that fails before the fix and passes after. That is how regressions stop recurring.",
    depth:
      "Write the failing test first and watch it fail — a test written after the fix may be passing for reasons unrelated to the bug, and you will never know. Reproduce at the lowest level that still exhibits the fault: a unit test pinning the off-by-one is worth more than an E2E test of the whole flow. When the same area regresses repeatedly, the test is treating a symptom; the recurrence is telling you the design permits the mistake, which is a refactor, not another assertion.",
  },
  {
    t: "Property-based testing",
    c: "testing",
    l: "craft",
    def: "Asserting invariants over generated inputs rather than hand-written examples.",
    note: "Hypothesis and fast-check find the empty string, the negative number, and the emoji you never thought of.",
    depth:
      "The work is naming the invariant: round-tripping (parse(serialise(x)) == x), commutativity, idempotence, or agreement with an obvious slow reference implementation. Shrinking is the feature that makes it practical — the library reduces a 400-character failing input to the two-character minimum that still breaks, handing you the actual cause. It shines on parsers, serialisers, date arithmetic and anything with fiddly boundaries, and libraries can persist the failing seed so a found counterexample becomes a permanent regression test.",
  },
  {
    t: "Snapshot test",
    c: "testing",
    l: "craft",
    def: "Recording output and failing when it changes.",
    note: "Cheap coverage for rendering. Dangerous when people update snapshots reflexively without reading the diff.",
    depth:
      "It is a change detector, not a correctness check — it tells you output differs, never that it is right, and the first recording is accepted without anyone verifying it. Keep snapshots small and focused so a diff is readable; a 500-line DOM dump gets approved unread every time. Anything volatile (timestamps, ids, ordering) must be normalised or the test is flaky by construction. They are strongest as a safety net during a refactor that should change nothing, and weakest as your primary assertion.",
  },
  {
    t: "Linter / formatter / type checker",
    c: "testing",
    l: "craft",
    def: "Catches likely bugs / rewrites style automatically / verifies types statically.",
    note: "ruff, black, mypy in Python. Formatting should never be a code review topic — automate it away.",
    depth:
      "Adopt them incrementally on an existing codebase or the first run produces a 4,000-file diff nobody can review: format in one isolated commit (and add it to .git-blame-ignore-revs so blame still works), then ratchet the linter and the type checker module by module rather than globally. Run the identical versions locally and in CI, pinned, or you get disagreements that are purely tooling. A pre-commit hook keeps the feedback fast, and CI enforces it for anyone who skipped the hook.",
  },
  {
    t: "Static analysis",
    c: "testing",
    l: "craft",
    def: "Inspecting code without running it to find bugs, security issues or dead code.",
    note: "Free defect detection in CI. Type hints turn a whole class of runtime errors into build errors.",
    depth:
      "The families worth running are different tools: type checking, security-focused scanners (Semgrep, Bandit, CodeQL) that look for injection and unsafe patterns, and dead-code or complexity analysis. The economics turn on false positives — a scanner that cries wolf gets ignored within two weeks, so tune the ruleset down to what your team will actually act on and fail the build only on those. Static analysis proves the absence of specific mistakes, never the presence of correct behaviour; it complements tests rather than substituting.",
  },
  {
    t: "Test double for time",
    c: "testing",
    l: "craft",
    def: "Injecting a clock so tests control 'now' instead of depending on the real one.",
    note: "Tests that fail at midnight, at month end, or in another timezone all come from calling datetime.now() directly.",
    depth:
      "Make the clock a dependency — pass a callable, or use freezegun / vi.useFakeTimers — so tests can assert what happens at a leap day, at a DST boundary, or when a token expires, without sleeping. The same discipline applies to randomness (inject a seeded generator) and to uuid generation. Store and compute in UTC and convert only at the presentation edge, since almost every timezone bug is a naive datetime that picked up the server's local zone somewhere in the middle.",
  },
];
