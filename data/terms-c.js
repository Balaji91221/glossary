export const TERMS_C = [
  // ── TESTING & QUALITY ─────────────────────────────────────────
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

  // ── GIT, CI/CD & DELIVERY ─────────────────────────────────────
  {
    t: "Commit",
    c: "delivery",
    l: "craft",
    def: "A recorded snapshot of changes with a message explaining why.",
    note: "The message should explain intent, not restate the diff. 'Fix bug' helps nobody in eight months.",
    depth:
      "A commit is a full tree snapshot addressed by a hash of its content plus its parents, which is why history is tamper-evident and why rewriting one changes every hash after it. Aim for one logical change per commit: it is the unit that revert, cherry-pick and bisect all operate on, so a commit mixing a rename with a bug fix cannot be undone cleanly. Use git add -p to split work you did in one sitting into commits that each make sense, and write the body to answer why, since the diff already answers what.",
  },
  {
    t: "Branch",
    c: "delivery",
    l: "craft",
    def: "An independent line of development that can be merged back later.",
    note: "Short-lived branches merge cleanly. A branch open for three weeks becomes a conflict resolution project.",
    depth:
      "A branch is a movable pointer to a commit — creating one is writing 40 bytes to a file, which is why branching is free and why deleting a merged branch loses nothing. The cost is not the branch, it is the divergence: conflict probability grows with both time and the number of people touching the same files. Trunk-based development with feature flags is the alternative that keeps integration continuous, and it is the practice that lets teams deploy many times a day without a merge queue full of week-old branches.",
  },
  {
    t: "Merge vs rebase",
    c: "delivery",
    l: "craft",
    def: "Merge combines two histories with a merge commit. Rebase replays your commits on top of another branch for linear history.",
    note: "Rebase your own unshared work freely. Never rebase a branch others have pulled.",
    depth:
      "Rebase creates new commits with new hashes, so anyone who pulled the old ones now has a divergent history — which is why the rule is about sharing, not about taste. If you must force-push a rebased branch, use --force-with-lease so you cannot overwrite work someone pushed while you were rewriting. Squash-merge gives a clean main and discards intermediate commits, which is a real loss when bisecting a large PR. Whichever the team picks, pick one: mixed strategies produce a history nobody can read.",
  },
  {
    t: "Merge conflict",
    c: "delivery",
    l: "craft",
    def: "Two branches changed the same lines and git needs a human to decide.",
    note: "Not an error. Frequent small merges make them rare and trivial.",
    depth:
      "Git merges by content within a three-way comparison against the common ancestor, which is why a conflict means two edits to the same region and not simply two edits to the same file. The dangerous case is the semantic conflict that merges cleanly and is still wrong — one branch renames a function, another adds a caller, git is satisfied and the build is not. Resolve with the ancestor visible (merge.conflictStyle = zdiff3), always run the tests after resolving, and enable rerere so you do not re-resolve the same conflict on every rebase.",
  },
  {
    t: "Pull request",
    aka: "PR, MR",
    c: "delivery",
    l: "craft",
    def: "A proposed change, opened for review before merging.",
    note: "Small PRs get real review. A 2,000-line PR gets 'LGTM' and a rubber stamp.",
    depth:
      "There is measured evidence for a ceiling around 200–400 changed lines, beyond which defect detection falls off sharply — reviewer attention, not diligence, is the constraint. Give it a description that says what changed, why, and how you verified it, and stack dependent PRs rather than submitting one enormous change. Separate mechanical changes (a rename, a reformat) into their own PR so the reviewer's attention lands on the ten lines that carry the risk rather than the six hundred that do not.",
  },
  {
    t: "Code review",
    c: "delivery",
    l: "craft",
    def: "Another engineer reading a change for correctness, clarity and risk before it ships.",
    note: "Review the design, not the formatting. Ask questions instead of issuing verdicts.",
    depth:
      "Its highest-value output is often not the defects found but the knowledge spread — a second person who now understands that subsystem, which is a direct improvement to the bus factor. Label comments by weight ('nit:', 'question:', 'blocking:') so the author knows what must change; unlabelled preferences read as requirements and stall the PR. Latency is the metric that matters most: a review that arrives a day later has forced a context switch that costs more than the review saved.",
  },
  {
    t: "Cherry-pick",
    c: "delivery",
    l: "craft",
    def: "Applying one specific commit onto another branch.",
    note: "How an urgent fix reaches a release branch without dragging along everything else on main.",
    depth:
      "It creates a new commit with a different hash and the same content, so the change now exists twice in history and a later merge between the branches may conflict with itself. Use -x to record the original SHA in the message, which is what lets someone six months later work out that these two commits are the same fix. Repeatedly cherry-picking between long-lived branches is a signal your branching model is wrong — the sustainable pattern is fix on main, then cherry-pick to the release branch, never the other direction.",
  },
  {
    t: "Revert vs reset",
    c: "delivery",
    l: "craft",
    def: "Revert creates a new commit undoing an old one. Reset moves the branch pointer and rewrites history.",
    note: "Revert on shared branches, always. Reset only on local work nobody has seen.",
    depth:
      "Know the three resets: --soft moves the pointer and keeps everything staged, --mixed (the default) unstages but keeps your files, --hard discards working-tree changes irrecoverably. Reverting a merge commit needs -m 1 to say which parent is the mainline, and it has a trap — re-merging that branch later will do nothing, because git considers those commits already merged, so you must revert the revert. And almost nothing is truly lost: git reflog keeps unreferenced commits for 90 days by default.",
  },
  {
    t: "Bisect",
    c: "delivery",
    l: "craft",
    def: "Binary-searching history to find the commit that introduced a bug.",
    note: "git bisect finds the culprit in twenty commits with about five tests. Criminally underused.",
    depth:
      "Ten steps cover a thousand commits, and git bisect run <script> automates the whole thing if you can write a command that exits non-zero on the bug — which turns an afternoon of guessing into a coffee break. Two requirements make it work: every commit must build (a reason to keep main green), and the reproduction must be deterministic, since a flaky check sends the search down the wrong half. Mark unbuildable commits 'skip' rather than guessing, and it is just as effective for finding when a performance regression appeared.",
  },
  {
    t: "CI",
    aka: "continuous integration",
    c: "delivery",
    l: "craft",
    def: "Every push automatically builds, lints and tests the code.",
    note: "Its value is proportional to how fast it runs. A twenty-minute pipeline gets circumvented.",
    depth:
      "Speed comes from caching dependencies keyed on the lockfile hash, parallelising the suite across shards, and running the fast checks (lint, types, unit) before the slow ones so failures return in a minute. A broken main is an emergency for the whole team, since every subsequent push now sees a red build and stops learning anything from it. Keep the pipeline definition in the repo, and make it runnable locally — a CI-only build step is a step nobody can debug.",
  },
  {
    t: "CD",
    aka: "continuous deployment",
    c: "delivery",
    l: "infra",
    def: "Passing builds ship to production automatically without a human gate.",
    note: "Requires real tests, fast rollback and feature flags. The payoff is that deploys become unremarkable.",
    depth:
      "Distinguish delivery from deployment: continuous delivery means every build is releasable and a human presses the button; continuous deployment removes the button. The counter-intuitive result from DORA's research is that frequent small deploys correlate with lower change-failure rates, because each one carries less risk and is easier to attribute. The prerequisites are non-negotiable — automated verification you trust, backwards-compatible migrations, a rollback that takes a minute, and monitoring good enough to notice within one.",
  },
  {
    t: "Artifact",
    c: "delivery",
    l: "infra",
    def: "The built output that actually gets deployed — a container image, a wheel, a jar.",
    note: "Build once, promote the same artifact through environments. Rebuilding per environment means you tested something else.",
    depth:
      "Address it by immutable digest rather than a tag: :latest and even :v1.2.3 can be repointed, so a rollback may not return the bytes you tested. Configuration therefore has to come from the environment at run time, since the same image must run in staging and production unchanged. Stamp provenance into it — commit SHA, build time, pipeline id — so a running instance can tell you exactly what it is, and keep a retention policy or your registry bill grows forever.",
  },
  {
    t: "Container image",
    c: "delivery",
    l: "infra",
    def: "A layered, immutable filesystem snapshot containing your app and its dependencies.",
    note: "Layers cache: put dependency installation before copying source and rebuilds drop from minutes to seconds.",
    depth:
      "Layers are stacked and additive, which is why deleting a file in a later layer does not shrink the image and why a secret copied in and removed later is still extractable from history — use build secrets or a multi-stage build instead. Order Dockerfile instructions by rate of change: base, system packages, lockfile, dependency install, then source. Pin the base image by digest, run as a non-root user, and add a .dockerignore, or you will ship .git and node_modules into the build context and wonder why it takes four minutes.",
  },
  {
    t: "Multi-stage build",
    c: "delivery",
    l: "infra",
    def: "Compiling in a heavy builder image, then copying only the results into a small runtime image.",
    note: "Turns a 1.2GB image into 150MB. Smaller images deploy faster and expose less attack surface.",
    depth:
      "The security gain is as large as the size gain: no compiler, no package manager and no build credentials in the shipped image, so an attacker who lands inside has far fewer tools. Distroless or Alpine as the final stage takes it further — but Alpine uses musl, which can break Python wheels and change DNS behaviour, so measure rather than assume. Name your stages and target them (--target=test) so CI can run the test stage and production can build the runtime stage from the same Dockerfile.",
  },
  {
    t: "Rolling deploy",
    c: "delivery",
    l: "infra",
    def: "Replacing instances gradually so the service stays up throughout.",
    note: "Requires that old and new versions can coexist — which constrains how you change database schemas.",
    depth:
      "The controls are maxSurge and maxUnavailable: surge adds extra pods before removing old ones (needs spare capacity but never dips below full strength), unavailable allows a temporary reduction. Because both versions serve traffic simultaneously, every change must be backwards-compatible in both directions for the duration — schema, API contract, cache format and queue message shape. Rollback is a second rolling update, so it takes as long as the deploy did, which is the main practical difference from blue-green.",
  },
  {
    t: "Blue-green deploy",
    c: "delivery",
    l: "infra",
    def: "Two complete environments; deploy to the idle one, then switch traffic.",
    note: "Instant rollback by flipping back. Costs double infrastructure during the switch.",
    depth:
      "The switch is atomic for new connections and not for existing ones, so in-flight requests and open WebSockets still need draining. The database is the part that is not duplicated, which is where the strategy actually bites: green's migrations must leave blue working, or rollback is impossible whatever the traffic layer says. Prefer switching at the load balancer over DNS, since DNS caching means some clients keep hitting blue for the length of the TTL and you never get a clean cutover.",
  },
  {
    t: "Canary release",
    c: "delivery",
    l: "infra",
    def: "Routing a small percentage of traffic to the new version and watching metrics before proceeding.",
    note: "Catches problems that only appear under real traffic. Needs good metrics to be meaningful.",
    depth:
      "Compare the canary against the baseline on the same signals at the same moment — error rate, p99 latency, saturation — rather than against yesterday, since traffic patterns move. Give it enough volume and enough time to be statistically meaningful: 1% of traffic for 90 seconds proves nothing about an error that occurs once in ten thousand requests. Automate the abort on a threshold breach, because the entire point is catching it before a human notices, and be aware that sticky sessions and caches can leave the canary serving an unrepresentative slice of users.",
  },
  {
    t: "Rollback",
    c: "delivery",
    l: "infra",
    def: "Returning to the previous known-good version.",
    note: "A deploy strategy is only as good as its undo. Practise rollbacks before you need one at 3am.",
    depth:
      "Measure it in minutes and rehearse it, because during an incident rollback should be the reflex, not a decision requiring analysis — diagnose after service is restored. The database is what makes it hard: a migration that dropped a column cannot be rolled back by redeploying the old image, which is precisely why expand/contract exists and why destructive steps ship in a later release than the code that stopped needing them. Roll forward instead when the previous version has a known worse bug, but that should be a considered exception.",
  },
  {
    t: "Feature flag",
    c: "delivery",
    l: "app",
    def: "A runtime switch letting you ship code disabled and enable it later without redeploying.",
    note: "Decouples deploy from release. Also accumulates into permanent debt unless you delete flags after rollout.",
    depth:
      "Separate the kinds, because they have different lifetimes: release toggles live weeks and must be deleted, experiment flags run for a defined test, ops kill-switches are permanent by design, and permission flags are really entitlements and belong in your authorization model. Every flag doubles the possible code paths, so two interacting flags mean four states you are unlikely to test. Give each one an owner and an expiry date at creation, and default to off in a way that fails safe if the flag service is unreachable.",
  },
  {
    t: "Semantic versioning",
    aka: "semver",
    c: "delivery",
    l: "craft",
    def: "MAJOR.MINOR.PATCH — breaking change, new feature, bug fix.",
    note: "A major bump is a promise you are breaking something. Respect it and your consumers can upgrade confidently.",
    depth:
      "0.x means all bets are off — anything may break in a minor bump, which is why so many dependency ranges behave surprisingly for pre-1.0 packages. What counts as breaking is broader than the signature: tightening validation, changing a default, or altering timing can break consumers who depended on the old behaviour (Hyrum's law). Note that semver describes intent and cannot enforce it, which is why a lockfile still matters, and applications (as opposed to libraries) are often better served by date or build versioning.",
  },
  {
    t: "Infrastructure as code",
    aka: "IaC",
    c: "delivery",
    l: "infra",
    def: "Declaring servers, networks and permissions in version-controlled files — Terraform, Pulumi, CloudFormation.",
    note: "Makes infrastructure reviewable, repeatable and recoverable. Clicking in a console is not reproducible.",
    depth:
      "The state file is the whole system's weak point: it records what Terraform believes exists, must live in remote storage with locking so two applies cannot race, and contains secrets in plaintext. Drift — someone changing a resource in the console — is detected by plan and is the reason console access to production should be read-only. Always read the plan before applying (destroy-and-recreate hides in there), and separate state per environment so a mistake in staging cannot reach production.",
  },
  {
    t: "Environment",
    c: "delivery",
    l: "infra",
    def: "An isolated deployment of the system — local, dev, staging, production.",
    note: "The only difference between them should be configuration and data. Code divergence defeats the purpose.",
    depth:
      "Staging's value is proportional to its similarity, and the differences that matter most are usually data volume and traffic shape — a query that is instant against 10,000 seeded rows is a timeout against 40 million. Never copy production data down without anonymising; generate representative synthetic data instead. Beware environment-conditional code (if ENV == 'production'), which means the path you tested is not the path you run; use configuration values rather than branches, so the shape of the code is identical everywhere.",
  },

  // ── OPERATIONS & OBSERVABILITY ────────────────────────────────
  {
    t: "Logs, metrics, traces",
    c: "ops",
    l: "infra",
    def: "Discrete events, numeric time series, and the path of one request across services.",
    note: "The three pillars. Logs say what happened, metrics say how much, traces say where the time went.",
    depth:
      "Their costs scale differently, which should drive what you emit: metrics are cheap and aggregate (bounded by cardinality), logs are expensive per event and scale with traffic, traces are usually sampled for exactly that reason. The practical workflow is to alert on metrics, find the affected requests through traces, and read logs for the detail — which only works if all three carry the same trace id. OpenTelemetry is the vendor-neutral way to emit them, and instrumenting through it is what keeps you from rewriting everything when the backend changes.",
  },
  {
    t: "Structured logging",
    c: "ops",
    l: "infra",
    def: "Emitting logs as JSON with named fields rather than prose sentences.",
    note: "Turns logs into a queryable dataset. Grepping unstructured strings does not scale past one server.",
    depth:
      "The message should be a stable constant with the variables as fields — log('payment failed', order_id=…, reason=…) rather than an f-string — because a constant message is groupable and countable while an interpolated one has infinite distinct values. Bind context once per request (user id, trace id, tenant) so every subsequent line carries it automatically. Two rules that save incidents: never log secrets or PII (redact in the formatter, not at each call site), and use levels meaningfully, since a service that logs everything at INFO has no signal left.",
  },
  {
    t: "Correlation ID",
    aka: "trace ID, request ID",
    c: "ops",
    l: "infra",
    def: "A unique identifier attached to a request and propagated through every service and job it touches.",
    note: "Without it, debugging a distributed system means guessing which log lines belong together.",
    depth:
      "Generate it at the edge if absent, accept it if present (W3C traceparent is the standard header), and carry it through every hop — including the queue, which is where propagation usually breaks, because a message published without the trace context orphans everything the worker does. Store it in a context-local so logging picks it up automatically rather than being threaded through every signature. Returning it in the response header is what lets a user paste one string into a support ticket and give you the entire request.",
  },
  {
    t: "Percentiles",
    aka: "p50, p95, p99",
    c: "ops",
    l: "infra",
    def: "The latency below which that percentage of requests complete.",
    note: "Averages hide pain. p50 can look excellent while p99 means your largest customer times out every time.",
    depth:
      "Percentiles do not average: you cannot take the mean of per-instance p99s and get the cluster's p99 — you need histograms that aggregate correctly, which is why Prometheus histogram buckets exist and why the bucket boundaries must be chosen to bracket your SLO. Remember that a page making 20 backend calls will hit the p99 of something roughly one time in five, so tail latency is far more visible to users than its name suggests. Watch p99.9 for the biggest customers, whose requests are the largest and slowest by nature.",
  },
  {
    t: "Cardinality",
    c: "ops",
    l: "infra",
    def: "The number of distinct label combinations on a metric.",
    note: "Adding user_id as a metric label will bankrupt your monitoring bill and possibly your monitoring system.",
    depth:
      "It multiplies: 5 endpoints × 10 status codes × 3 regions is 150 series, and adding a customer id with 10,000 values makes it 1.5 million — each one a separate time series stored and indexed forever. The rule is that labels must be bounded and low-cardinality (endpoint, method, status), and unbounded identifiers belong in logs or traces where high cardinality is the point. Watch for accidental sources: a URL path with an id in it, an error message used as a label, or a user-agent string.",
  },
  {
    t: "SLI / SLO / SLA",
    c: "ops",
    l: "infra",
    def: "The measurement, your internal target, and the contractual promise with penalties attached.",
    note: "SLOs give a principled answer to 'is this fast enough' instead of an argument between opinions.",
    depth:
      "A good SLI is measured as close to the user as possible and stated as a ratio of good events to valid events — 'requests served under 300ms / all requests' — rather than as an average. Set the SLO from what users actually need, not from what you currently achieve, and deliberately below 100%: a target of 100% forbids all change and is unachievable anyway given dependencies you do not control. The SLA should always be looser than the SLO, so you have room to react before money is involved.",
  },
  {
    t: "Error budget",
    c: "ops",
    l: "infra",
    def: "The allowed unreliability implied by an SLO. 99.9% permits about 43 minutes down per month.",
    note: "Converts reliability-versus-velocity from a values debate into arithmetic. Budget spent means ship fewer risky changes.",
    depth:
      "Track it over a rolling 30-day window rather than a calendar month, so a bad incident does not get wiped clean by a date change. Burn-rate alerting is the operational form: a fast burn (consuming 5% of the monthly budget in an hour) pages immediately, while a slow burn opens a ticket — which is what stops paging on every minor blip while still catching the sustained degradation. The policy attached to it is the point; a budget with no consequence when exhausted is just a dashboard.",
  },
  {
    t: "Observability",
    c: "ops",
    l: "infra",
    def: "Whether you can diagnose a novel problem from existing telemetry without deploying new code.",
    note: "Monitoring answers questions you predicted. Observability answers questions you did not.",
    depth:
      "The practical test is whether you can slice by a dimension you did not think of in advance — 'errors for tenant X, on API version 2, in region eu-west' — which requires wide, high-cardinality events rather than pre-aggregated counters. That is the argument for structured events with many attributes per request: aggregation throws away the outlier, and the outlier is what you are investigating. The failure mode is having three dashboards and no ability to ask a new question without a deploy.",
  },
  {
    t: "Alert fatigue",
    c: "ops",
    l: "infra",
    def: "So many alerts that engineers stop reading them.",
    note: "Alert on symptoms users feel, not every anomaly. A page must be actionable, urgent and real.",
    depth:
      "Every page should pass three tests: is it real, is it urgent, and is there something a human can do right now — if any answer is no, it is a ticket or a dashboard, not a page. Alerting on causes (CPU at 90%) produces noise, because a system can be at 90% and perfectly healthy; alert on symptoms (error rate, latency, queue age) and let the runbook lead to the cause. Review pages per shift as a real metric, and treat a page that produced no action as a bug in the alert.",
  },
  {
    t: "On-call",
    c: "ops",
    l: "infra",
    def: "A rotation where one engineer is responsible for responding to production incidents.",
    note: "Sustainable on-call requires runbooks, a sane alert budget and time to fix root causes afterwards.",
    depth:
      "The load target most teams borrow from Google is at most two pages per shift; beyond that people stop thinking and start acknowledging. Sustainability comes from structure — a follow-the-sun rotation or compensated night shifts, a handover with open issues, and dedicated time in the next sprint for the fixes the incidents revealed. The strongest cultural rule is that the team who writes the service carries the pager for it, because nothing improves reliability like being woken by your own design decision.",
  },
  {
    t: "Runbook",
    c: "ops",
    l: "infra",
    def: "A written procedure for handling a specific alert or failure.",
    note: "Write it while the incident is fresh. At 3am nobody derives the fix from first principles.",
    depth:
      "Link it directly from the alert, so the responder does not search a wiki at 3am, and write it as steps with copy-pasteable commands and expected output — including how to verify the fix worked and how to escalate if it did not. Anything you write down three times should be a script, and anything scripted and safe should eventually run automatically; the runbook is the staging ground for automation. An unverified runbook is a rumour, so exercise them in game days and update them at the postmortem.",
  },
  {
    t: "Incident severity",
    aka: "SEV levels",
    c: "ops",
    l: "infra",
    def: "A scale from total outage to minor degradation, determining who is woken and how fast.",
    note: "Agree the definitions in advance, because nobody negotiates severity calmly during an outage.",
    depth:
      "Define each level by customer impact with an example attached, not by internal component names, and attach the response to it: who is paged, whether an incident channel and commander are required, how often status updates go out, and whether a postmortem is mandatory. Err upward — over-declaring costs an hour of attention while under-declaring costs the outage. Separate the roles during a real one: an incident commander who coordinates and communicates, and responders who investigate, because the person typing should not also be writing the status page.",
  },
  {
    t: "Blameless postmortem",
    c: "ops",
    l: "craft",
    def: "A written analysis after an incident focused on systemic causes rather than individual fault.",
    note: "Blame produces hiding. If someone could take the system down with one command, the system permitted it.",
    depth:
      "Blameless does not mean accountability-free: the team owns the action items, with named owners and dates, and a postmortem whose actions are never done is theatre. Include a timeline with timestamps, what each responder believed at the time (which is where the real lessons hide), and the counterfactuals you rejected. Push past the first cause — 'bad config was deployed' is a symptom; that config could be deployed without validation, to all regions at once, and took 40 minutes to notice, are three separate fixable facts.",
  },
  {
    t: "MTTR / MTBF",
    c: "ops",
    l: "infra",
    def: "Mean time to recovery, and mean time between failures.",
    note: "Optimising recovery usually beats chasing perfect prevention. Failures are inevitable; long outages are optional.",
    depth:
      "Decompose MTTR to find where the time actually goes: detect, acknowledge, diagnose, mitigate, verify. In most organisations detection and diagnosis dominate, which means better alerting and better observability buy more than a faster deploy pipeline. Beware the mean itself — one 12-hour incident and nine 5-minute ones average to something that describes nothing, so track the distribution. DORA's version of this pair, deployment frequency and change failure rate alongside recovery time, is the more actionable framing for a delivery team.",
  },
  {
    t: "Chaos engineering",
    c: "ops",
    l: "infra",
    def: "Deliberately injecting failure to verify the system survives it.",
    note: "The alternative is discovering your failover does not work at the moment you need it.",
    depth:
      "It is an experiment, not vandalism: state a hypothesis ('the checkout path stays under 500ms if the recommendation service is unavailable'), define the blast radius, run it, and have an abort. Start in staging, start small — kill one pod, add 200ms of latency to one dependency — and only move to production with an automated stop condition. The most valuable early exercises are usually the boring ones: does the database failover actually work, does the backup actually restore, does the on-call actually get paged.",
  },
  {
    t: "Golden signals",
    c: "ops",
    l: "infra",
    def: "Latency, traffic, errors and saturation — the four metrics worth watching on any service.",
    note: "If you can only build four dashboards, build these.",
    depth:
      "Two refinements make them work in practice: measure latency separately for successful and failed requests, because fast failures otherwise flatter your numbers, and treat saturation as the leading indicator — it is the one that predicts the other three, whether it is thread pool utilisation, queue depth or connection pool usage. The USE method (utilisation, saturation, errors) is the resource-side counterpart for machines, while golden signals are the request-side view. Together they cover 'is the service healthy' and 'is the box healthy' without a hundred graphs.",
  },

  // ── SECURITY ──────────────────────────────────────────────────
  {
    t: "Secret",
    c: "security",
    l: "infra",
    def: "Credentials, API keys, tokens — anything that grants access.",
    note: "Never in git, never in logs, never in an error message. Once committed, assume compromised and rotate.",
    depth:
      "A commit cannot be un-made — rewriting history does not remove it from forks, CI caches or anyone's local clone, and bots scan public pushes within seconds, so rotation is the only real response. Prevent it with a pre-commit scanner (gitleaks, trufflehog) plus a server-side push protection. Prefer short-lived, automatically-issued credentials over static keys entirely: OIDC federation between CI and your cloud, or a workload identity, removes the long-lived secret that could leak in the first place.",
  },
  {
    t: "Secret rotation",
    c: "security",
    l: "infra",
    def: "Regularly replacing credentials so a leaked one has a limited useful life.",
    note: "Impossible to do calmly unless the app reads secrets from a manager rather than a hardcoded constant.",
    depth:
      "Rotation requires an overlap window where both the old and new credential are valid, or the swap is an outage — which in turn requires that your provider supports two active keys, and that the application can pick up a new value without a redeploy. Design for it before you need it: the emergency rotation during a suspected breach is not the moment to discover the credential is baked into an image. Automate it on a schedule, and measure the time-to-rotate as a real capability, because that number is your exposure window.",
  },
  {
    t: "Least privilege",
    c: "security",
    l: "infra",
    def: "Every component gets the minimum permissions it needs and nothing more.",
    note: "The single highest-value security habit. A compromised service with read-only access is a much smaller problem.",
    depth:
      "Apply it on every axis, not just IAM: a database user that only needs SELECT should not have DROP, a container should run as non-root with a read-only filesystem, and network policy should deny egress by default so a compromised pod cannot phone home. Start from deny and add what fails, rather than starting broad with an intention to tighten later, which never happens. Watch for privilege creep in long-lived roles, and remember that a wildcard resource in a policy is the same as no policy for anything it matches.",
  },
  {
    t: "SQL injection",
    c: "security",
    l: "data",
    def: "User input interpreted as SQL because it was concatenated into a query string.",
    note: "Solved completely by parameterised queries. Still in the top ten decades later because people still use f-strings.",
    depth:
      "Parameterisation works because the query text and the data travel separately to the server, so nothing in the value can change the parsed statement — escaping is a weaker approach that keeps failing on encodings and edge cases. Identifiers (table and column names) cannot be parameterised, so a dynamic ORDER BY column must be validated against an allowlist. Blind injection needs no visible output, inferring data from timing or error differences, which is why 'the endpoint returns nothing useful' is not a defence. Least privilege limits the damage when it happens anyway.",
  },
  {
    t: "XSS",
    aka: "cross-site scripting",
    c: "security",
    l: "edge",
    def: "Attacker-supplied script executing in another user's browser because output was not escaped.",
    note: "Escape on output, not just input. A Content Security Policy is the second line of defence.",
    depth:
      "Escaping is context-dependent: HTML body, attribute, JavaScript and URL contexts each need different encoding, which is why a single sanitise-on-input pass is insufficient and a template engine's auto-escaping is the right default. Know the three shapes — stored (in your database, hitting every viewer), reflected (in a crafted link), and DOM-based (never touching the server, born from innerHTML). The specific dangerous sinks are innerHTML, dangerouslySetInnerHTML and eval; HttpOnly cookies plus a strict CSP limit what a successful XSS can actually steal.",
  },
  {
    t: "CSRF",
    c: "security",
    l: "edge",
    def: "Tricking a logged-in user's browser into making a state-changing request to your site.",
    note: "Defended with anti-CSRF tokens and SameSite cookies. Only affects cookie-based auth.",
    depth:
      "It works because cookies are attached automatically by origin, so the attacker never needs to read anything — they only need the request to happen. SameSite=Lax is now the browser default and blocks the classic cross-site POST, but it is not complete cover: subdomains are same-site, and GET-based state changes still slip through, which is another reason GET must never mutate. The synchroniser token pattern remains the belt-and-braces answer, and APIs authenticated by an Authorization header rather than a cookie are structurally immune.",
  },
  {
    t: "SSRF",
    c: "security",
    l: "app",
    def: "Making your server fetch a URL an attacker chose, often reaching internal-only services.",
    note: "The classic escalation path into cloud metadata endpoints. Allowlist outbound destinations.",
    depth:
      "The prize is 169.254.169.254, the cloud metadata endpoint, which historically hands out instance credentials to anything that asks — IMDSv2 requiring a token header exists precisely to break this and should be enforced. Denylists fail endlessly (DNS names resolving to private IPs, redirects, IPv6-mapped addresses, decimal-encoded IPs), so allowlist destinations, resolve the hostname and validate the resolved IP, and disable redirect following. The strongest control is architectural: make the fetch from a network segment with no route to anything internal.",
  },
  {
    t: "Hashing vs encryption",
    c: "security",
    l: "app",
    def: "Hashing is one-way. Encryption is reversible with a key.",
    note: "Passwords are hashed with bcrypt or argon2, never encrypted, never stored plainly, never hashed with SHA-256 alone.",
    depth:
      "Password hashes must be deliberately slow — bcrypt with a cost factor, or argon2id with memory and time parameters — because a GPU computes billions of SHA-256 hashes per second and only a handful of bcrypt ones. Tune the cost so verification takes roughly 100–250ms on your hardware, and re-hash on login when you raise it. Compare hashes with a constant-time function to avoid leaking information through timing, and use HMAC rather than a bare hash when you need to prove a message came from someone holding a key.",
  },
  {
    t: "Salt",
    c: "security",
    l: "app",
    def: "Random data added per-password before hashing so identical passwords produce different hashes.",
    note: "Defeats rainbow tables. Modern password hashing libraries handle it for you — let them.",
    depth:
      "It is per-password, not per-application, and it is not secret — bcrypt and argon2 store it inside the output string, which is why one column holds everything needed to verify. Its job is to make precomputation useless and to stop a breach revealing which users share a password. A pepper is the complementary idea: a secret value held outside the database (in a KMS or env config) mixed in before hashing, so a stolen database alone is not enough to start cracking.",
  },
  {
    t: "Encryption at rest / in transit",
    c: "security",
    l: "infra",
    def: "Protecting stored data, and protecting data moving across a network.",
    note: "Usually one configuration flag each. Auditors will ask, so enable them from day one.",
    depth:
      "Understand what disk encryption actually protects against — a stolen or improperly decommissioned disk — and not against an application bug or a compromised credential, because your service reads the data decrypted like everyone else. For genuinely sensitive fields, application-level encryption with a key from a KMS is the stronger control, at the cost of losing the ability to query or index them. Key management is the real work: rotation, envelope encryption, and access policy on the key, since whoever can use the key has the data.",
  },
  {
    t: "Principle of secure defaults",
    c: "security",
    l: "craft",
    def: "The safe configuration is the one you get without doing anything.",
    note: "If security requires remembering an extra step, the step will eventually be forgotten.",
    depth:
      "In practice this means default-deny everywhere: private buckets, closed security groups, authentication required on new routes unless explicitly marked public, and debug mode off unless switched on. Inverting the flag matters — a require_auth=True default fails safe when someone forgets it, while allow_anonymous=False fails open the moment a new code path skips the check. Fail closed on errors too: if the authorization service is unreachable, deny rather than allow, and make the insecure option loud and deliberate to enable.",
  },
  {
    t: "Dependency vulnerability scan",
    aka: "SCA",
    c: "security",
    l: "craft",
    def: "Automated checking of your dependency tree against known vulnerability databases.",
    note: "Most breaches enter through a transitive dependency nobody chose. Run it in CI.",
    depth:
      "Expect a high false-positive rate: a CVE in a code path your application never calls is real in the database and not real for you, so use reachability analysis or triage with a documented suppression rather than either patching everything or ignoring everything. Scan the container image as well as the manifest, since the base OS carries its own packages. Generate an SBOM so that when the next big CVE lands you can answer 'are we affected' in minutes, and keep dependencies current continuously — small frequent upgrades are what make the emergency patch possible.",
  },
  {
    t: "Supply chain attack",
    c: "security",
    l: "craft",
    def: "Compromising a library, build tool or registry to reach everyone who installs it.",
    note: "Lockfiles, pinned versions and verified publishers are the practical mitigations.",
    depth:
      "The vectors are well documented by now: a maintainer account taken over, a typosquatted package name, a malicious post-install script, and dependency confusion where a public package shadows your internal one. Concrete defences are pinning by hash, disabling install scripts where you can, scoping internal packages to a private registry that refuses public fallback, and building in an ephemeral CI runner with least privilege. The build system itself is part of the attack surface — a compromised CI can sign a malicious artifact perfectly, which is what provenance attestation exists to detect.",
  },
  {
    t: "Audit log",
    c: "security",
    l: "data",
    def: "An append-only record of who did what, when.",
    note: "Different from application logs: it is evidence. It must be tamper-resistant and retained deliberately.",
    depth:
      "Record actor, action, target, timestamp, source IP and outcome — including failures, since a run of denied attempts is the signal you most want. Write it somewhere the application cannot rewrite: a separate store with append-only permissions, or an object bucket with versioning and a retention lock. Log administrative reads too when the data is sensitive, because 'who looked at this record' is the question regulators ask. And keep it out of the same fate as the system it audits: if an attacker with database access can edit the log, it is not evidence.",
  },
  {
    t: "Prompt injection",
    c: "security",
    l: "ai",
    def: "Instructions hidden in content the model reads, which the model then follows.",
    note: "The defining security problem of LLM applications. Treat model output derived from untrusted text as untrusted input.",
    depth:
      "There is no known reliable fix, because instructions and data share one channel — a retrieved document, a web page, an email, or an image can carry text the model treats as direction. Direct injection targets your system prompt; indirect injection hides in content the model fetches, which is far more dangerous in an agent with tools. The practical posture is containment rather than prevention: least privilege on every tool, human confirmation before consequential or irreversible actions, output validated against a schema, and the assumption that the exfiltration path (a URL the model can cause to be fetched) is the thing to close.",
  },

  // ── SYSTEMS & LINUX ───────────────────────────────────────────
  {
    t: "stdout / stderr",
    c: "systems",
    l: "systems",
    def: "The two default output streams: normal output and errors.",
    note: "Containers expect logs on stdout. Writing to a file inside a container means the logs die with it.",
    depth:
      "They are separate so a pipeline can consume data on stdout while diagnostics still reach a human on stderr — which is why a CLI's progress messages belong on stderr, not stdout. Buffering is the operational trap: stdout is block-buffered when it is not a terminal, so a crashed container can lose its last lines entirely (fix with PYTHONUNBUFFERED=1 or an explicit flush), while stderr is typically unbuffered. Redirect precisely: 2>&1 merges them, and the order matters, since > file 2>&1 and 2>&1 > file do different things.",
  },
  {
    t: "Environment variable",
    c: "systems",
    l: "infra",
    def: "Configuration passed to a process by its environment rather than baked into code.",
    note: "The Twelve-Factor way to configure. Load them once at startup into a typed settings object.",
    depth:
      "Everything is a string, so parse and validate at startup into typed settings and fail loudly on a missing or malformed value — a service that boots with DEBUG='false' evaluating truthy is a real and common bug. They are inherited by child processes and visible in /proc and crash dumps, which is why they are a weak place for secrets. Read them once at the entry point rather than scattering getenv calls through the code, so configuration is testable and the full set of required variables is discoverable in one file.",
  },
  {
    t: "File descriptor",
    c: "systems",
    l: "systems",
    def: "A handle for an open file, socket or pipe. Every process has a limit.",
    note: "'Too many open files' means you are leaking connections somewhere, not that you need a bigger limit.",
    depth:
      "Every socket counts, so a leak usually lives in HTTP clients or database connections created per request instead of reused — check with lsof -p <pid> or ls /proc/<pid>/fd, and look at what the majority of them point to. Note that a closed TCP connection lingers in TIME_WAIT for around 60 seconds, so a high-churn client can exhaust descriptors or ephemeral ports without leaking anything. Use context managers or defer-style cleanup everywhere, and raise the ulimit only after you have proven the usage is legitimate.",
  },
  {
    t: "Permissions",
    aka: "chmod, chown",
    c: "systems",
    l: "systems",
    def: "Read, write and execute bits for owner, group and everyone.",
    note: "755 for directories and scripts, 644 for files, 600 for secrets. 777 is never the real fix.",
    depth:
      "On a directory the bits mean something different from a file: x is permission to traverse into it, and r is permission to list its contents, so a directory can be enterable but not listable. Ownership is the usual container problem — a volume mounted from the host arrives with the host's UID, and your non-root container user cannot write to it, which is what the numeric mismatch in 'permission denied' is telling you. Also know the special bits: setuid, and the sticky bit that makes /tmp safe for shared use.",
  },
  {
    t: "Symbolic link",
    aka: "symlink",
    c: "systems",
    l: "systems",
    def: "A file that points at another path.",
    note: "How 'current release' directories work. Also how you accidentally deploy the previous version.",
    depth:
      "A symlink stores a path, so it breaks if the target moves and can point at something that does not exist yet; a hard link is a second name for the same inode and cannot cross filesystems. The atomic-deploy trick relies on that path indirection: create the new symlink and rename it over the old one, since rename is atomic and nothing observes a moment with no current directory. Watch two gotchas — relative symlinks resolve against the link's own directory, and Docker's COPY follows and materialises them rather than preserving the link.",
  },
  {
    t: "Pipe and redirect",
    c: "systems",
    l: "systems",
    def: "| sends one command's output into another. > writes to a file, >> appends.",
    note: "grep, awk, sort, uniq, wc composed with pipes will out-perform writing a script for most log questions.",
    depth:
      "The canonical incident one-liner is worth memorising: sort | uniq -c | sort -rn turns any extracted field into a ranked frequency count, which answers 'which endpoint is erroring' in one line. Pipes run concurrently with a small kernel buffer, so a slow consumer applies backpressure to the producer — that is the shell demonstrating the same principle your services need. Remember that > truncates the file the moment the command starts (so cmd > file with file as input destroys it), and that only the last command's exit status survives unless you set pipefail.",
  },
  {
    t: "Exit status in shell",
    aka: "$?",
    c: "systems",
    l: "systems",
    def: "The last command's exit code, available as $?.",
    note: "set -euo pipefail at the top of every bash script. Without it, scripts cheerfully continue after failures.",
    depth:
      "Each flag fixes a specific silent failure: -e exits on error, -u treats an unset variable as an error (rm -rf \"$PREFIX/\" with an empty PREFIX is the cautionary tale), and -o pipefail makes a failing command mid-pipeline fail the whole thing rather than being masked by a successful tail. Know -e's exceptions — it does not trigger inside a condition, or for a command followed by || — and use trap for cleanup on exit. Always quote variables, since an unquoted one containing spaces becomes several arguments.",
  },
  {
    t: "Memory: RSS vs virtual",
    c: "systems",
    l: "systems",
    def: "Resident set size is physical memory actually in use; virtual is address space reserved.",
    note: "Container limits apply to RSS. A scary virtual number is usually nothing to worry about.",
    depth:
      "RSS also double-counts shared pages: two forked workers each report the shared library and copy-on-write parent memory, so summing RSS across processes overstates real usage — PSS (proportional set size) is the honest per-process number. Watch the cgroup's memory.current rather than the host's free, since page cache counts toward a container limit and can trigger reclaim. And a process that frees memory often does not return it to the OS (the allocator keeps it), so flat RSS after a spike is normal rather than a leak.",
  },
  {
    t: "Swap",
    c: "systems",
    l: "systems",
    def: "Disk used as overflow when physical memory runs out.",
    note: "Usually disabled in containers, because swapping makes a process pathologically slow instead of cleanly dead.",
    depth:
      "The failure it causes is worse than the one it prevents: a swapping service is alive and answering health checks while every request takes seconds, so the load balancer keeps sending traffic and nothing recovers — a fast OOM kill and restart is the kinder outcome, which is why Kubernetes traditionally refuses to start with swap enabled. Even with swap off, the kernel can evict page cache and re-read executable pages from disk under pressure, which looks like sudden mysterious slowness. Watch major page faults, not just free memory.",
  },
  {
    t: "Load average",
    c: "systems",
    l: "systems",
    def: "The average number of processes running or waiting, over one, five and fifteen minutes.",
    note: "Compare against core count. Load of 4 on 8 cores is fine; on 2 cores it is a queue.",
    depth:
      "On Linux it counts processes in uninterruptible sleep (blocked on disk I/O) as well as runnable ones, so a high load average with idle CPU means you are I/O-bound, not compute-bound — a distinction the number alone hides. Read the three windows as a trend: 1-minute above 15-minute means it is rising now. Inside a container the value comes from the host, not your cgroup, so it describes the neighbourhood rather than your application; per-cgroup CPU throttling metrics are what actually tell you whether you are being limited.",
  },
  {
    t: "Namespace and cgroup",
    c: "systems",
    l: "systems",
    def: "Kernel features providing isolation and resource limits — the mechanics containers are built from.",
    note: "A container is not a virtual machine. It is a normal process with a restricted view of the system.",
    depth:
      "Namespaces control visibility (PID, network, mount, user, UTS, IPC) and cgroups control consumption (CPU, memory, I/O) — two separate mechanisms that together produce the illusion of a machine. The consequences are practical: the kernel is shared, so a kernel vulnerability crosses the boundary and a container is a weaker isolation boundary than a VM. CPU limits are enforced by throttling within a period rather than by slowing the clock, which is why a latency-sensitive service can be throttled hard while average utilisation looks low.",
  },
  {
    t: "Port binding",
    c: "systems",
    l: "infra",
    def: "A process claiming a network port to accept connections on.",
    note: "'Address already in use' means a previous process still holds it. Ports below 1024 need elevated privileges.",
    depth:
      "A binding is the tuple of address, port and protocol, which is why one process can bind 127.0.0.1:8000 and another 0.0.0.0:8000 and only the second collides with everything. SO_REUSEADDR is what lets a restarting server rebind while old connections sit in TIME_WAIT, and SO_REUSEPORT lets several processes share one port with kernel-side load balancing — the mechanism behind multi-worker servers. Find the holder with lsof -i :8000 or ss -ltnp, and prefer a capability or a proxy over running as root for port 80.",
  },
  {
    t: "Localhost vs 0.0.0.0",
    c: "systems",
    l: "infra",
    def: "Binding to 127.0.0.1 accepts only local connections; 0.0.0.0 accepts from any interface.",
    note: "The single most common reason a containerised app is unreachable from outside the container.",
    depth:
      "Inside a container, localhost is the container's own loopback, so it is also why one container cannot reach another at 127.0.0.1 — use the service name and let DNS resolve it. On a developer machine, host.docker.internal is the escape hatch back to the host. The corollary is a security one: binding a debug server or a database to 0.0.0.0 on a host with a public interface exposes it to the internet, so bind to loopback by default and let a reverse proxy be the only thing listening broadly.",
  },

  // ── AI & LLM ENGINEERING ──────────────────────────────────────
  {
    t: "Token",
    c: "ai",
    l: "ai",
    def: "The unit a model reads and writes — roughly a word fragment. Billing and limits are counted in these.",
    note: "Roughly four characters of English. Code and non-Latin scripts tokenise less efficiently, so they cost more.",
    depth:
      "Tokenisation is why models struggle with character-level tasks — counting letters or reversing a string is hard when 'strawberry' is three opaque tokens rather than ten characters. It also drives cost asymmetry: output tokens typically cost several times input tokens, so a verbose response format is a real line item. Never estimate by dividing characters by four when it matters; count with the model's own tokeniser, especially for JSON, code, and non-English text where the ratio can be double.",
  },
  {
    t: "Context window",
    c: "ai",
    l: "ai",
    def: "The maximum tokens a model can consider at once, covering prompt and response together.",
    note: "Bigger is not free: latency and cost rise, and models attend less reliably to the middle of very long contexts.",
    depth:
      "The 'lost in the middle' effect is measurable: recall is strongest at the beginning and end of a long context and weakest in the middle, so place instructions and the most relevant retrieved chunks at the edges. Cost and latency scale with input length on every call, which is why sending a 100k-token context to answer a one-line question is usually the wrong trade against retrieval. Reserve headroom explicitly for the output — the window is shared, and a prompt that fills it leaves the model no room to answer.",
  },
  {
    t: "Temperature",
    c: "ai",
    l: "ai",
    def: "A sampling parameter controlling randomness. Low is focused and repetitive; high is varied and erratic.",
    note: "Use low values for extraction and classification, higher for ideation. It is not a creativity dial so much as a risk dial.",
    depth:
      "Mechanically it rescales the logits before sampling: below 1 sharpens the distribution toward the most likely token, above 1 flattens it. Note that temperature 0 is near-deterministic, not guaranteed deterministic — batching and floating-point non-associativity on GPUs still produce variation, so never build a test that requires byte-identical output. top_p (nucleus sampling) is the parameter usually worth tuning alongside it, and adjusting both at once makes the effect of either hard to reason about.",
  },
  {
    t: "System prompt",
    c: "ai",
    l: "ai",
    def: "Instructions setting the model's role, constraints and output format before user input arrives.",
    note: "Keep prompts in files, not string literals. You will iterate on them constantly and want them diffable.",
    depth:
      "Treat it as code: version it, review changes, and evaluate before and after, because a prompt edit is a behaviour change shipped without a type checker. Structure beats prose — role, then constraints, then output format, then examples, with delimiters separating instructions from user-supplied content so injected text is visibly data. Be specific about what to do rather than what to avoid, state the failure behaviour explicitly ('if the answer is not in the context, say you do not know'), and keep it stable at the front so prompt caching can apply.",
  },
  {
    t: "Few-shot prompting",
    c: "ai",
    l: "ai",
    def: "Including examples of desired input-output pairs in the prompt.",
    note: "Usually the cheapest large quality gain available. Two good examples often beat a paragraph of instructions.",
    depth:
      "Examples teach format and edge-case handling far more reliably than they teach knowledge, so pick them to cover the boundaries you care about — the ambiguous case, the empty case, the refuse case — rather than three variations of the easy one. Watch for label bias: if all your examples share one output class, the model will over-predict it. Each example costs tokens on every call, which is where dynamic few-shot (retrieving the most similar examples per input) earns its complexity, and prompt caching makes a fixed set nearly free.",
  },
  {
    t: "Structured output",
    aka: "function calling, tool use",
    c: "ai",
    l: "ai",
    def: "Constraining a model to emit JSON matching a schema, or to call a declared function with typed arguments.",
    note: "How you get from 'text generator' to 'component in a program'. Validate the output anyway.",
    depth:
      "Constrained decoding makes the JSON syntactically valid by construction, which is a different guarantee from being semantically right — the model can still invent an id or pick the wrong enum member, so validation stays your job. The schema is part of the prompt: field names and descriptions are read as instructions, so 'iso8601_start_date' with a description outperforms 'date'. Keep schemas flat and shallow, mark truly optional fields as nullable rather than absent, and handle the refusal case, since a model that should decline still has to say so inside your schema.",
  },
  {
    t: "Embedding",
    c: "ai",
    l: "ai",
    def: "A vector of numbers representing meaning, where similar text lands nearby in the space.",
    note: "Embeddings from different models are not comparable. Change the model and you must re-embed everything.",
    depth:
      "Cosine similarity is the usual metric, and it is relative, not absolute — 0.82 means nothing on its own, only in comparison to other scores from the same model, so thresholds must be calibrated per model and per corpus. Asymmetric models expect a prefix distinguishing a query from a document, and skipping it quietly costs recall. Dimensionality is a storage and speed trade (1536 floats is 6KB per chunk before indexing), and re-embedding a corpus is a migration to plan for, not a config change.",
  },
  {
    t: "Vector store",
    c: "ai",
    l: "data",
    def: "A database that indexes vectors for nearest-neighbour search — pgvector, Pinecone, Qdrant, Weaviate.",
    note: "If you already run Postgres, start with pgvector. A separate vector database is a real operational cost.",
    depth:
      "Search is approximate: HNSW and IVFFlat trade recall for speed, so tuning parameters (ef_search, nprobe) moves you along that curve and the default may be missing relevant results silently. Metadata filtering is the feature that decides most architectures — filtering by tenant or date before the vector search is what keeps multi-tenant retrieval correct and fast, and doing it after means you may filter away everything you retrieved. Index build time and memory matter at scale: HNSW is fast to query and expensive to build and hold.",
  },
  {
    t: "Chunking",
    c: "ai",
    l: "ai",
    def: "Splitting documents into pieces before embedding them.",
    note: "Chunk size and overlap dominate retrieval quality more than model choice does. Split on structure, not character counts.",
    depth:
      "Split on the document's own boundaries — headings, sections, function definitions — because a chunk cut mid-sentence embeds a fragment whose meaning is genuinely unclear. Two techniques earn their complexity: prepending the document title and section path to each chunk so it carries its context, and small-to-big retrieval, where you embed small precise chunks but pass the larger surrounding section to the model. Tables and code resist naive splitting badly, and overlap of 10–20% is the usual cheap insurance against a boundary landing on the one sentence that mattered.",
  },
  {
    t: "RAG",
    aka: "retrieval-augmented generation",
    c: "ai",
    l: "ai",
    def: "Retrieve relevant chunks, insert them into the prompt, and have the model answer from them.",
    note: "Most RAG failures are retrieval failures. Measure whether the right chunk was fetched before blaming the model.",
    depth:
      "Evaluate the two stages separately or you will tune blind: retrieval with recall@k and precision (was the answer-bearing chunk in the top k), generation with faithfulness (is the answer supported by what was retrieved). The most common production failure is the missing-context case where the model answers anyway from parametric memory, which is why the prompt must instruct it to decline and why citations should be required. Also plan for the freshness problem — an index built once is wrong the day the source changes, so re-indexing is a pipeline, not a script.",
  },
  {
    t: "Reranking",
    c: "ai",
    l: "ai",
    def: "A second model reordering retrieved candidates by actual relevance before they enter the prompt.",
    note: "Retrieve broadly, rerank tightly. Usually a bigger win than tuning the embedding model.",
    depth:
      "A cross-encoder reads the query and the document together, which is why it is far more accurate than the bi-encoder that produced the embeddings — and far too slow to run over the whole corpus. That asymmetry is the whole design: retrieve 50–100 cheaply, rerank to the top 5, spend the latency budget where it changes the answer. Expect 50–200ms for the rerank call, and note the second benefit — a calibrated relevance score lets you drop everything below a threshold rather than always passing k chunks regardless of quality.",
  },
  {
    t: "Hybrid search",
    c: "ai",
    l: "ai",
    def: "Combining keyword search with vector search.",
    note: "Vectors miss exact identifiers, error codes and product names. Keywords catch what semantics blur.",
    depth:
      "The two systems fail in opposite directions: BM25 nails exact tokens (an error code, a SKU, a surname) and misses paraphrase; embeddings handle paraphrase and blur the exact string. Reciprocal rank fusion is the standard way to combine them because it merges rankings without needing the two score scales to be comparable — which they are not. In practice hybrid is the strongest default for technical corpora, where users search for identifiers as often as concepts, and the keyword half is also what makes results explainable.",
  },
  {
    t: "Hallucination",
    c: "ai",
    l: "ai",
    def: "Fluent, confident, wrong output.",
    note: "The core reliability problem. Grounding, citations and verification reduce it; nothing eliminates it.",
    depth:
      "It is intrinsic to the mechanism — the model is sampling plausible continuations, and there is no separate store of facts to consult — so treat mitigation as engineering rather than a bug to be fixed. What works: ground answers in retrieved text, require span-level citations you can verify programmatically, keep temperature low for factual tasks, and give the model an explicit escape ('say you do not know'). The dangerous shape is the confident specific detail — a plausible case number, a real-looking API method — which is exactly the kind humans do not double-check.",
  },
  {
    t: "Eval",
    c: "ai",
    l: "ai",
    def: "A test suite for non-deterministic output, scored against rubrics, references or a judge model.",
    note: "Build these before optimising anything. Without evals, prompt changes are superstition.",
    depth:
      "Prefer deterministic checks wherever the task allows one — schema validity, exact match on extraction, does the cited span exist — and reserve model grading for genuinely open-ended output. Track cost and latency alongside quality, since a prompt that scores two points higher and costs triple is not obviously a win. Run them in CI on every prompt or model change, expect noise (run multiple samples and compare distributions rather than single scores), and remember that an eval set which stops finding failures has stopped being useful.",
  },
  {
    t: "Golden dataset",
    c: "ai",
    l: "ai",
    def: "A curated set of inputs with known-good outputs used as the benchmark for every change.",
    note: "Start with twenty real examples, including the ones that already failed. Grow it from production traffic.",
    depth:
      "Grow it from real failures: every production complaint becomes a case, which is what keeps it representative rather than a set of examples you happened to imagine. Stratify deliberately across categories, difficulty and edge cases so an aggregate score cannot hide a class that regressed, and hold a portion back that you never tune against — otherwise you overfit the prompt to the benchmark exactly as you would overfit a model. Version it alongside the prompts, since comparing scores across two different datasets means nothing.",
  },
  {
    t: "LLM-as-judge",
    c: "ai",
    l: "ai",
    def: "Using a model to grade another model's output against criteria.",
    note: "Scales evaluation but inherits biases — position, verbosity, self-preference. Calibrate against human labels.",
    depth:
      "The biases are documented and correctable: position bias (swap the order of A and B and average), verbosity bias (longer answers score higher), and self-preference (a model favouring its own outputs, so use a different model as judge where you can). Pairwise comparison is more reliable than absolute scoring, and a 1–5 scale without anchored descriptions per point produces mush. Measure the judge itself — agreement with human labels on a sample — because an uncalibrated judge is a confident number with unknown meaning.",
  },
  {
    t: "Agent",
    c: "ai",
    l: "ai",
    def: "A model in a loop, choosing tools, observing results and deciding the next step.",
    note: "Every loop iteration multiplies error probability. Cap iterations, log every step, and prefer a fixed workflow when one exists.",
    depth:
      "The arithmetic is unforgiving: 95% reliability per step is 60% over ten steps, which is why fewer, more capable tools beat many granular ones and why a deterministic workflow should be preferred wherever the sequence is actually known in advance. Tool descriptions are prompt engineering — ambiguous ones produce wrong tool choices far more often than model capability does. Budget iterations, tokens and wall-clock; make destructive tools require confirmation; and log every step's input and output, because debugging an agent without a trace of its reasoning path is guesswork.",
  },
  {
    t: "Guardrails",
    c: "ai",
    l: "ai",
    def: "Validation applied to model inputs and outputs — schema checks, content filters, refusal detection.",
    note: "The model is a component that can fail. Guardrails are the same input validation you already write elsewhere.",
    depth:
      "Layer them by cost: cheap deterministic checks first (schema, regex, allowlists, length), then a classifier, then a model-based check only if needed — and decide per failure whether to retry, repair, fall back, or refuse. Input guardrails catch injection attempts and out-of-scope requests; output guardrails catch leaked PII, unsupported claims and malformed structure. Every guardrail adds latency and false positives, so measure both, and log what they block: that log is your best early signal of how the system is being misused.",
  },
  {
    t: "Streaming",
    c: "ai",
    l: "edge",
    def: "Sending tokens to the client as they are generated rather than waiting for completion.",
    note: "Does not reduce total latency but transforms perceived speed. Complicates error handling mid-response.",
    depth:
      "The metric it improves is time-to-first-token, and that is the one users feel; total generation time is unchanged. The engineering costs are real: an error after 200 tokens have been sent cannot become a 500, so you need in-band error events and a client that can handle a truncated response. Server-Sent Events over HTTP is the usual transport, buffering proxies must be disabled or they defeat the whole thing, and any output validation you wanted to do now has to happen either incrementally or after the user has already read it.",
  },
  {
    t: "Prompt caching",
    c: "ai",
    l: "ai",
    def: "Reusing computation for an unchanged prompt prefix across calls.",
    note: "Put stable content first and variable content last, and long system prompts become dramatically cheaper.",
    depth:
      "It matches on an exact prefix, so a single changed character early in the prompt — a timestamp, a shuffled example, a user name in the system message — invalidates everything after it. Order accordingly: system instructions, then tools, then few-shot examples, then retrieved context, then the user turn. Caches have a short TTL (minutes), so the benefit is concentrated in multi-turn conversations and high-frequency endpoints, where the discount on cached input tokens is large enough to change the economics of a long system prompt entirely.",
  },
  {
    t: "Fine-tuning vs prompting",
    c: "ai",
    l: "ml",
    def: "Adjusting model weights on your data, versus improving instructions and examples.",
    note: "Try prompting, retrieval, then fine-tuning, in that order. Fine-tuning teaches form far better than it teaches facts.",
    depth:
      "The split is capability versus knowledge: fine-tuning is excellent for style, format, tone and consistent classification behaviour, and a poor way to install facts that change — those belong in retrieval, where they can be updated without a training run. LoRA and other parameter-efficient methods make it cheap enough to try with a few hundred to a few thousand well-curated examples, where quality matters far more than volume. The hidden cost is lifecycle: a fine-tune pins you to a base model, and every upgrade means retraining and re-evaluating.",
  },
  {
    t: "Distillation",
    c: "ai",
    l: "ml",
    def: "Training a smaller model to reproduce a larger model's behaviour.",
    note: "How a slow expensive prototype becomes a fast cheap production path once you have traffic to learn from.",
    depth:
      "The practical recipe is to run the large model in production first, log inputs and outputs, filter that trace to the cases it handled well, and fine-tune a small model on the result — your traffic is the training set, which is why this comes after launch rather than before. Expect a narrower model: it will match the teacher on the distribution you distilled and degrade off it, so keep an escalation path to the larger model for low-confidence or unusual inputs. Check the terms of the teacher model's licence before distilling from it.",
  },
  {
    t: "Token budget",
    c: "ai",
    l: "ai",
    def: "The deliberate allocation of a context window between instructions, retrieved context, history and output.",
    note: "Unmanaged conversation history is the usual cause of gradually rising cost and sudden context-limit errors.",
    depth:
      "Write the allocation down and enforce it in code — for example 2k system, 8k retrieved context, 4k history, 2k reserved output — with a truncation strategy per section rather than one global trim that silently drops your instructions. History is the section that grows without limit: a sliding window is the simple answer, rolling summarisation the better one for long sessions. Count tokens before sending rather than catching the API's context-length error, and log the per-section usage so cost regressions are visible before the bill is.",
  },

  // ── ML TRAINING ───────────────────────────────────────────────
  {
    t: "Train / validation / test split",
    c: "ml",
    l: "ml",
    def: "Data divided into what the model learns from, what you tune against, and what you touch only once.",
    note: "Look at the test set repeatedly and you have leaked it. It is now a validation set and you have no honest estimate.",
    depth:
      "A random split is wrong more often than people assume: time-series data must be split chronologically (training on the future to predict the past is guaranteed leakage), and grouped data must be split by group so the same user or patient never appears on both sides. Stratify to preserve class proportions when a class is rare. Cross-validation gives a variance estimate as well as a point score on small datasets, and the test set should be touched once, at the end, as a decision you make deliberately.",
  },
  {
    t: "Overfitting vs underfitting",
    c: "ml",
    l: "ml",
    def: "Memorising the training data versus failing to learn the pattern at all.",
    note: "Diagnosed by the gap between training and validation performance, not by either number alone.",
    depth:
      "Read the learning curves: both errors high and converged means underfitting (more capacity or better features), a wide and growing gap means overfitting (more data, regularisation, dropout, or early stopping). Note that the classic advice to shrink the model is not the only lever and often not the best one — more data usually beats a smaller model. And beware the third case that looks like neither: good validation performance and poor production performance, which is usually distribution shift or leakage rather than a fitting problem at all.",
  },
  {
    t: "Loss function",
    c: "ml",
    l: "ml",
    def: "The number the training process minimises — how wrong the model currently is.",
    note: "The loss encodes what you actually want. Optimise the wrong loss and the model will satisfy it perfectly.",
    depth:
      "It is not the same as your evaluation metric, and the gap matters: cross-entropy is differentiable and trainable, while the F1 or business KPI you actually care about is not, so you optimise a proxy and evaluate on the real thing. Where costs are asymmetric — a missed fraud costing far more than a false alarm — encode that with class weights or a custom loss rather than hoping a threshold fixes it afterwards. Watch the loss curve during training: a sudden spike to NaN usually means the learning rate is too high or a division is unguarded.",
  },
  {
    t: "Epoch / batch / learning rate",
    c: "ml",
    l: "ml",
    def: "One pass over the data / how many samples per update / how large each update is.",
    note: "Learning rate is the hyperparameter that matters most. Too high diverges; too low never converges.",
    depth:
      "They interact: larger batches give less noisy gradients and typically want a proportionally larger learning rate (the linear scaling rule), while very large batches can generalise slightly worse. Batch size is bounded by GPU memory, and gradient accumulation is how you simulate a large one on a small card. Almost nobody uses a constant learning rate any more — warmup followed by cosine decay is the common default — and a learning-rate finder sweep is a cheap way to bracket the right order of magnitude before a long run.",
  },
  {
    t: "Gradient descent",
    c: "ml",
    l: "ml",
    def: "Iteratively adjusting parameters in the direction that reduces loss.",
    note: "The whole of training in one sentence. Everything else is variations on step size and direction.",
    depth:
      "Stochastic gradient descent uses a mini-batch rather than the full dataset, and that noise is a feature: it is what lets training escape sharp local minima. Adam adds per-parameter adaptive step sizes plus momentum, which is why it is the default for most deep learning, though plain SGD with momentum still generalises better on some vision tasks. The failure modes have names worth recognising — exploding gradients (fix with clipping) and vanishing gradients (why residual connections and normalisation layers exist).",
  },
  {
    t: "Feature engineering",
    c: "ml",
    l: "ml",
    def: "Transforming raw data into inputs a model can learn from.",
    note: "For classical ML this is where most of the performance comes from — far more than model selection.",
    depth:
      "The mechanics that matter: scaling for distance-based and gradient-based models, sensible encoding for categoricals (one-hot for low cardinality, target encoding for high — computed within the training fold, or you have leaked), and cyclical encoding for hour-of-day and day-of-week so 23:00 and 00:00 are near each other. The operational trap is training/serving skew, where a feature is computed one way in the training notebook and another way in the service; a feature store or shared transformation code is what prevents it.",
  },
  {
    t: "Data leakage",
    c: "ml",
    l: "ml",
    def: "Information from the future or from the target sneaking into training features.",
    note: "Produces spectacular offline metrics and a model that fails immediately in production. Suspect it when results look too good.",
    depth:
      "The usual sources: a feature computed after the outcome was known (a status field updated on resolution), scaling or imputation fitted on the whole dataset before splitting, a duplicated row landing on both sides, and target encoding computed across folds. Two habits catch most of it — fit every transformation inside a pipeline on the training fold only, and ask of each feature 'would this value have been available, with this value, at prediction time?'. A single feature with suspiciously high importance is the tell worth chasing.",
  },
  {
    t: "Precision vs recall",
    c: "ml",
    l: "ml",
    def: "Of what you flagged, how much was right / of what was there, how much did you find.",
    note: "You trade one for the other. Which matters depends entirely on whether false positives or false negatives cost more.",
    depth:
      "Both are functions of a threshold, so reporting a single pair without saying which threshold is meaningless — the model outputs a score, and you choose the operating point from the cost of each error type. Precision-recall curves are more informative than ROC on imbalanced data, where a large true-negative count flatters the ROC. F1 is the harmonic mean and assumes the two matter equally, which is rarely true; Fβ lets you weight them, and in practice the threshold is often set by capacity — how many alerts a review team can actually process in a day.",
  },
  {
    t: "Class imbalance",
    c: "ml",
    l: "ml",
    def: "One outcome vastly outnumbering another, as in fraud detection.",
    note: "Accuracy becomes meaningless — predicting 'never fraud' scores 99.9%. Use precision, recall and AUC instead.",
    depth:
      "Resampling changes the base rate, so a model trained on rebalanced data outputs miscalibrated probabilities and needs recalibration if you use the scores rather than just the ranking. Class weights in the loss are usually the cleaner first move; SMOTE-style synthetic oversampling is applied to the training fold only, never before the split. Often the better framing is anomaly detection or ranking rather than classification — and always compare against the trivial baseline, since 'always predict the majority' is the number your model must actually beat.",
  },
  {
    t: "Baseline",
    c: "ml",
    l: "ml",
    def: "The simplest reasonable approach, against which every model must justify itself.",
    note: "Always build it first. A surprising number of deployed models never beat 'predict the most common answer'.",
    depth:
      "Build the trivial one (majority class, or last observed value for a time series — surprisingly strong) and then a simple real one (logistic regression, gradient-boosted trees) before anything deep. The baseline also validates your pipeline end to end: if it scores 0.99, you have leakage, not a great baseline. Include the incumbent — the existing rules engine or the human process — because beating a research benchmark while losing to the heuristic already in production is a common and expensive way to be technically right.",
  },
  {
    t: "Inference",
    c: "ml",
    l: "ml",
    def: "Using a trained model to produce predictions, as opposed to training it.",
    note: "Different constraints entirely: training optimises throughput, inference optimises latency and cost per call.",
    depth:
      "Batch and online inference are different systems: batch scores millions offline overnight and tolerates minutes of latency; online serves one request in milliseconds and needs the features available at request time, which is the harder engineering problem. The optimisation toolkit is quantisation, distillation, ONNX or TensorRT compilation, and dynamic batching to use the accelerator efficiently. Feature parity with training is the recurring failure — the same transformation code must run in both paths, or the model sees inputs it was never trained on.",
  },
  {
    t: "Model registry",
    c: "ml",
    l: "ml",
    def: "Versioned storage of trained models with their metrics, parameters and lineage.",
    note: "'Which model is in production and what data produced it' must have an answer. MLflow exists for this.",
    depth:
      "A registered version should carry the artifact, the training data version, the code commit, the hyperparameters, the eval results and a stage (staging, production, archived) — enough for someone else to reproduce it and for you to roll back to it. Serving should resolve the model by registry stage rather than a hardcoded path, so promotion and rollback are metadata operations. Beware pickle-format artifacts: they embed library versions and are an arbitrary-code-execution risk, which is why ONNX or safetensors is the safer interchange.",
  },
  {
    t: "Experiment tracking",
    c: "ml",
    l: "ml",
    def: "Logging each run's configuration, code version, data version and results.",
    note: "Without it, comparing runs relies on memory and filenames like final_v3_actually_final.pkl.",
    depth:
      "Log automatically at the start of training rather than by hand at the end — git SHA (and whether the tree was dirty), the full config, the dataset hash, the environment, and metrics per epoch — because the run you forget to log is invariably the one that worked. Its real value is comparison across dozens of runs to see which hyperparameter actually mattered. Pair it with a config system (Hydra or equivalent) so a run is fully described by a file you can re-run, not by the arguments someone typed that afternoon.",
  },
  {
    t: "Drift",
    c: "ml",
    l: "ml",
    def: "Production data or relationships changing so a once-accurate model degrades.",
    note: "Models rot silently. Monitor input distributions and outcomes, not just uptime.",
    depth:
      "Separate the kinds: data drift is the input distribution moving, concept drift is the input-output relationship changing (the same features now imply a different outcome), and label delay is what makes the second hard to detect — if the true outcome only arrives 60 days later, accuracy monitoring is 60 days behind. So monitor proxies in the meantime: feature distributions (PSI, KL divergence), prediction distribution, and the rate of low-confidence outputs. Decide the retraining trigger in advance — scheduled, or drift-threshold-based — and keep a champion/challenger comparison so retraining cannot silently make things worse.",
  },
  {
    t: "Reproducibility",
    c: "ml",
    l: "ml",
    def: "Being able to recreate a result exactly — same data, same code, same seed.",
    note: "Version the data alongside the code. Immutable raw data and versioned transformations are the foundation.",
    depth:
      "Bit-exact reproducibility is genuinely hard on GPUs: non-deterministic kernels and floating-point non-associativity mean two runs with the same seed can differ, and forcing determinism (torch.use_deterministic_algorithms) costs speed. Aim for statistical reproducibility — the same conclusion within noise — and report the variance across seeds rather than one number. The infrastructure that makes it possible is unglamorous: pinned dependencies, a containerised environment, seeded generators, and data versioning (DVC, lakeFS) so 'the dataset' means a specific hash.",
  },

  // ── WORKING AS AN ENGINEER ────────────────────────────────────
  {
    t: "Technical debt",
    c: "career",
    l: "craft",
    def: "Accumulated shortcuts that make future change slower.",
    note: "Sometimes worth taking deliberately. The problem is undocumented debt nobody decided to incur.",
    depth:
      "Ward Cunningham's original metaphor was about a deliberate loan taken to ship and learn faster, repaid once you understood the domain — not a synonym for bad code. The useful distinction is deliberate versus accidental and prudent versus reckless, because only one of those four is a real problem. Make it visible: record it where the work is planned, attach the interest ('this adds two days to every change here'), and pay it down alongside features in the same area rather than in a rewrite quarter nobody will fund.",
  },
  {
    t: "Yak shaving",
    c: "career",
    l: "craft",
    def: "The chain of unrelated tasks you must complete before the actual task.",
    note: "Recognising it early is a skill. Timebox the detour or note it and route around.",
    depth:
      "The practical technique is to keep a scratch list as you go: write down each detour rather than following it immediately, and after each one ask whether it is still necessary for the original goal. Timebox at the moment you notice — thirty minutes, then reassess — because the sunk cost of three yaks makes the fourth feel mandatory. Some shaving is genuinely valuable (the broken local setup you just fixed will slow everyone else too); the failure is doing it unconsciously and surfacing a day later with nothing shippable.",
  },
  {
    t: "Bikeshedding",
    c: "career",
    l: "craft",
    def: "Spending disproportionate discussion on trivial details because they are easy to have opinions about.",
    note: "Automate the trivia — formatters, linters, templates — so the arguments become impossible.",
    depth:
      "Parkinson's law of triviality: a committee approving a nuclear plant waves through the reactor and argues for an hour about the bike shed, because everyone can hold an opinion on the shed. The counter is to make the trivial decision unavailable — a formatter with no options, a template, a documented convention — and to name the pattern out loud when it happens, which usually ends it. In review, labelling comments as nits does the same job at a smaller scale, by separating preference from concern.",
  },
  {
    t: "Rubber duck debugging",
    c: "career",
    l: "craft",
    def: "Explaining the problem aloud in detail, which frequently reveals the answer mid-sentence.",
    note: "Works because articulation forces you to check the assumption you skipped over silently.",
    depth:
      "It works by forcing sequential, explicit statement of things you were holding as a compressed intuition — and the assumption you skip when thinking is the one you notice when saying. Writing works as well as speaking, which is why drafting a detailed bug report so often solves the bug. Push it further with the scientific version: state the hypothesis, state what you would expect to observe if it were true, then check. 'It should be impossible for this to be null' is the sentence that most often precedes the answer.",
  },
  {
    t: "Estimation",
    c: "career",
    l: "craft",
    def: "Forecasting effort under uncertainty.",
    note: "Estimate ranges, not points. Break anything longer than three days into pieces you can actually picture.",
    depth:
      "The planning fallacy is systematic and does not improve with experience, because we estimate the path we imagine rather than the path we get. Two corrections help: reference-class forecasting (how long did the last three similar tasks actually take, including the interruptions) and decomposing until each piece is small enough to visualise, since the sum of small estimates is less biased than one big one. Be explicit about what the estimate excludes — review latency, deployment, the unfamiliar codebase — and give a range with the assumptions attached rather than a number that will be quoted back as a commitment.",
  },
  {
    t: "Scope creep",
    c: "career",
    l: "craft",
    def: "Requirements quietly expanding after work has started.",
    note: "Not inherently bad. Untracked is what makes it dangerous — write down what changed and what it cost.",
    depth:
      "The response is not refusal, it is an explicit trade: 'yes, and that adds three days — do we cut X or move the date?' — which turns an invisible slip into a decision someone owns. Distinguish genuine discovery (we learned the requirement was wrong, which is good) from accumulation (a stream of small additions nobody priced). Watch for the self-inflicted version too: gold-plating a solution beyond what was asked is scope creep with your own name on it, and it is the kind least likely to be tracked.",
  },
  {
    t: "Definition of done",
    c: "career",
    l: "craft",
    def: "The agreed bar for calling work complete — tested, reviewed, documented, deployed, monitored.",
    note: "Without one, 'done' means 'it ran on my laptop once' and the remaining 40% appears later as a surprise.",
    depth:
      "Write it once as a team checklist rather than negotiating it per ticket, and include the operational items people forget: metrics and alerts exist, the runbook is updated, the feature flag has an owner, docs reflect the change, and the migration has a rollback. Its second function is estimation honesty — if 'done' includes review and deploy, then estimates that only cover coding are visibly wrong. Keep it short enough to be real; a twenty-item checklist becomes a formality that gets ticked without being read.",
  },
  {
    t: "Design doc",
    aka: "RFC",
    c: "career",
    l: "craft",
    def: "A written proposal circulated for feedback before significant work begins.",
    note: "An hour of writing routinely saves a week of building the wrong thing. Include the alternatives you rejected.",
    depth:
      "The structure that works: context and problem, goals and explicit non-goals, the proposed design, alternatives considered with the reason each was rejected, risks, and a rollout plan. Non-goals and rejected alternatives are the highest-value sections, because they stop the same debate reopening in three months and they show reviewers the shape of your thinking. Circulate early while the design is still changeable, timebox the comment period, and record the decision — an ADR — so a future reader can see why, not just what.",
  },
  {
    t: "Chesterton's fence",
    c: "career",
    l: "craft",
    def: "Do not remove something until you understand why it was put there.",
    note: "That strange conditional is probably a bug fix nobody documented. Use git blame before deleting.",
    depth:
      "The investigation is usually five minutes: git log -S to find the commit that introduced the line, then the PR and the ticket it references. When the archaeology comes up empty, do not simply leave it forever — add a test that captures the behaviour you believe it protects, remove the fence behind a flag, and watch. The complementary error is real too: leaving every fence standing produces code nobody dares change, so the principle is understand-then-decide, not never-remove.",
  },
  {
    t: "Boy Scout rule",
    c: "career",
    l: "craft",
    def: "Leave code slightly better than you found it.",
    note: "Keep cleanup in a separate commit from behaviour change, or review becomes impossible.",
    depth:
      "Slightly is the operative word: rename the misleading variable, add the missing test, delete the dead branch — improvements a reviewer can verify at a glance. A refactor larger than the change it accompanies should be its own PR, or you have made a risky change hard to review and hard to revert. The compounding argument is what makes it worth doing at all: consistent small improvements in the files people actually touch beats a scheduled cleanup project, because the files people touch are the files that matter.",
  },
  {
    t: "Premature optimisation",
    c: "career",
    l: "craft",
    def: "Optimising before measuring where time is actually spent.",
    note: "The corollary is not 'never optimise'. It is 'profile first' — intuition about bottlenecks is reliably wrong.",
    depth:
      "Knuth's full sentence includes 'in about 97% of cases', and the same paragraph insists on not passing up the critical 3% — the quote is an argument for measurement, not for indifference to performance. Profile to find where the time goes (a flame graph makes it obvious in a minute), fix the top item, and measure again, because the second bottleneck is rarely what you predicted. What is not premature is algorithmic choice and data-access shape: an N+1 query or an O(n²) loop over a growing collection is a design error, not an optimisation you deferred.",
  },
  {
    t: "Bus factor",
    c: "career",
    l: "craft",
    def: "How many people must be unavailable before a system becomes unmaintainable.",
    note: "A bus factor of one is the most common serious risk on a team, and the easiest to fix with documentation and pairing.",
    depth:
      "Find it empirically rather than by feel: git history shows which files have exactly one substantial author, and that list is your risk register. The cheap mitigations are ordinary practices used deliberately — rotate who takes work in unfamiliar areas, pair on the scary parts, insist that reviewers of critical systems change over time, and write the design docs and runbooks that make context transferable. Note that the bus factor is about knowledge, not access: a documented system with a departed author is recoverable, an undocumented one with three readers is not.",
  },
];
