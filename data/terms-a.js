// Each entry: term, aka, category, layer, def (what it is), note (why it bites),
// depth (the mechanism underneath, for when the one-liner is not enough).

export const TERMS_A = [
  // ── PROJECT STRUCTURE ─────────────────────────────────────────
  {
    t: "Repository",
    aka: "repo",
    c: "structure",
    l: "craft",
    def: "A project tracked by version control, containing its full history of changes.",
    note: "A monorepo holds many deployable services in one repo; a polyrepo gives each its own. Monorepos make shared code easy and CI slow.",
    depth:
      "The real axis is not one repo or many, it is whether a change that spans two services can be one atomic commit. Monorepos buy that and pay for it with tooling: once every push runs every test suite, you need affected-target detection (Nx, Turborepo, Bazel) or CI time grows with the org chart. Polyrepos give you fast, obvious CI and hand you version skew instead — service A pinned to v1.2 of the shared client while B is on v2.0, and the bug lives in the gap.",
  },
  {
    t: "Root",
    c: "structure",
    l: "craft",
    def: "The outermost folder of a project. A 'root-level file' sits directly inside it, not nested.",
    note: "Config lives at the root by convention so tools can find it without being told where to look.",
    depth:
      "Most tools locate the root by walking upward from the current directory until they find a marker — .git, package.json, pyproject.toml — which is why running a command from a subfolder usually still works, and why it occasionally picks up the wrong project in a monorepo. When a linter mysteriously uses different rules in CI than locally, the first thing to check is which directory each one started the upward walk from.",
  },
  {
    t: "Entry point",
    c: "structure",
    l: "app",
    def: "The first file executed when a program starts — main.py, index.js, __main__.py.",
    note: "One codebase often has several: an API entry point, a worker entry point, a scheduler entry point. Same code, different doors.",
    depth:
      "The entry point is where the runtime hands control to you, so it is also the only place with the whole picture: it reads config, builds the dependency graph, and wires it into a server or a consumer loop. Keep it dumb and declarative — everything it constructs should be constructible in a test without it. The tell that you got this wrong is a test that has to import main to get at a database session.",
  },
  {
    t: "Source vs build",
    aka: "src/ vs dist/",
    c: "structure",
    l: "craft",
    def: "src/ is what humans write. dist/ or build/ is the compiled, bundled output a machine generates from it.",
    note: "Never edit build output — it is overwritten on the next build. If a fix only exists in dist/, it does not exist.",
    depth:
      "Build output should be reproducible from source plus a lockfile and nothing else — that property is what lets CI throw away the artifact and rebuild it identically. Source maps are the bridge back: they let a stack trace from minified production code point at the line you actually wrote, which is why shipping them (to an error tracker, not necessarily to the public) turns unreadable incidents into ordinary ones.",
  },
  {
    t: "Module",
    c: "structure",
    l: "app",
    def: "A single file of reusable code that can be imported elsewhere.",
    note: "A package is a folder of modules. In Python, __init__.py is what promotes a folder to a package.",
    depth:
      "Import is not free and not lazy: importing a module runs every top-level statement in it, once, and caches the result. That is why a database connection opened at module level connects the moment anything imports the file — including your test collector. It is also how circular imports bite: A imports B while B is still half-executed, and B's names do not exist yet. Move the shared thing to a third module, or import inside the function.",
  },
  {
    t: "Package manifest",
    aka: "package.json, pyproject.toml",
    c: "structure",
    l: "craft",
    def: "The file declaring a project's name, dependencies, scripts, and tool configuration.",
    note: "pyproject.toml is the modern Python standard and absorbs setup.py, requirements.txt and most linter configs into one place.",
    depth:
      "The manifest declares ranges — ^1.4.0, >=2,<3 — which is a statement of intent about compatibility, not a build input. Ranges are what let a security patch reach you without a code change, and what let an unrelated upgrade break you at 3am. Split dependencies from dev-dependencies properly: anything in the main list ends up in your production image, and a test framework in there is both weight and attack surface.",
  },
  {
    t: "Lockfile",
    aka: "uv.lock, package-lock.json, poetry.lock",
    c: "structure",
    l: "craft",
    def: "A generated file pinning the exact resolved version of every dependency, including transitive ones.",
    note: "Commit it. Never hand-edit it. It is the difference between 'works on my machine' and reproducible builds.",
    depth:
      "The lockfile records the whole resolved graph plus content hashes, so an install verifies bytes rather than trusting a version number — this is what stops a republished tarball silently changing under you. Use the install command that honours it strictly (npm ci, uv sync --frozen, poetry install --sync) in CI and Docker; plain npm install is allowed to update the lock, which means your image can differ from your teammate's for reasons nobody recorded. A conflicted lockfile is regenerated, never merged by hand.",
  },
  {
    t: "Constraints file",
    c: "structure",
    l: "craft",
    def: "A list that caps versions of whatever gets installed without itself requesting any packages.",
    note: "Useful for saying 'whatever pulls in urllib3, it must stay below 2.0' across an entire dependency tree.",
    depth:
      "It is a filter applied during resolution rather than a request, which is exactly what you want for a policy that must hold across many services: one shared constraints file, referenced by all of them, no duplicated pins. The npm equivalent is an overrides block, Yarn calls it resolutions. Treat every entry as debt with a reason attached — write the ticket number in a comment, because an unexplained cap outlives the incident that caused it by years.",
  },
  {
    t: "Transitive dependency",
    c: "structure",
    l: "craft",
    def: "A library you never asked for, installed because something you did ask for needs it.",
    note: "Most of your node_modules is transitive. Most supply-chain vulnerabilities arrive this way too.",
    depth:
      "You cannot audit what you cannot see: npm ls <pkg> and pip tree show why something is present and who pulled it in, which is the first question in any CVE triage. Depth matters more than count — a package four levels down is maintained by someone you will never contact, on a release schedule you cannot influence. The practical defences are a lockfile with hashes, automated dependency PRs so upgrades are small, and refusing to add a package that pulls in fifty of its own to save you eight lines.",
  },
  {
    t: "Vendoring",
    c: "structure",
    l: "craft",
    def: "Copying third-party source directly into your repo instead of installing it from a registry.",
    note: "Done when you need to patch a library or depend on something unpublished. The cost is that upstream fixes no longer reach you automatically.",
    depth:
      "Prefer a recorded patch over a copy: patch-package and poetry's patch support keep a diff in the repo instead of a fork, so upgrading tells you loudly when the patch no longer applies rather than silently keeping your stale version. If you must vendor, record the upstream URL and commit SHA in a header comment — the failure mode is not the copy, it is that in eighteen months nobody can tell what was changed or why.",
  },
  {
    t: "Virtual environment",
    aka: ".venv",
    c: "structure",
    l: "craft",
    def: "An isolated Python installation per project, so two projects can use different versions of the same library.",
    note: "Always gitignored. If you ever commit .venv, your repo becomes hundreds of megabytes of machine-specific binaries.",
    depth:
      "Activation is nothing magical — it prepends the venv's bin/ to PATH so python and pip resolve there first. That is why a cron job or a systemd unit that does not activate anything runs the system interpreter and fails with ImportError; the fix is to invoke the absolute path /srv/app/.venv/bin/python directly, which needs no activation at all. Inside a container the isolation is already provided by the image, so many teams skip the venv there deliberately.",
  },
  {
    t: "Makefile",
    c: "structure",
    l: "craft",
    def: "A file of named command shortcuts — make test, make run, make lint.",
    note: "The cheapest onboarding document there is. If a new hire has to read your CI config to learn how to run tests, write a Makefile.",
    depth:
      "Its real value is that CI and humans run the identical command, so 'passes locally, fails in CI' stops being a mystery about invocation. Two gotchas: recipe lines must be indented with a literal tab, and each line runs in its own shell, so cd only lasts one line. Declare non-file targets with .PHONY, or a directory named test will make make decide there is nothing to do.",
  },
  {
    t: "Layered structure",
    aka: "controllers → services → repositories → models",
    c: "structure",
    l: "app",
    def: "Organising code so each layer only talks to the one beside it: routes validate, services decide, repositories fetch, models describe.",
    note: "The rule that makes it work is 'thin routes': a controller should read like a table of contents, never like the actual logic.",
    depth:
      "The direction of dependency is the whole point: the service layer must not know it is being called over HTTP, which is what lets the same function serve a REST route, a queue consumer, and a CLI command. Concretely, no Request object and no HTTPException below the controller — services raise domain errors and the controller maps them to status codes. The moment a repository imports anything web-shaped, the layering has become decoration.",
  },
  {
    t: "Repository pattern",
    c: "structure",
    l: "data",
    def: "A layer that hides database access behind intention-revealing methods like find_by_email().",
    note: "Pays for itself the first time you mock the database in a test or swap the storage engine without touching business logic.",
    depth:
      "Keep the abstraction honest about laziness: returning an ORM query object rather than a materialised list leaks the session out of the repository, and the query then runs somewhere that has no idea it is touching a database — often inside a loop. Return concrete lists or domain objects. Be pragmatic about the swap-the-database promise too; it rarely happens, and testability plus one place to add caching or query logging is enough justification on its own.",
  },
  {
    t: "Schema vs model",
    aka: "DTO",
    c: "structure",
    l: "app",
    def: "A model maps to a database table. A schema defines what the API accepts and returns.",
    note: "Keeping them separate is deliberate — it stops internal columns like password_hash leaking into a response by accident.",
    depth:
      "You usually want three, not two: a create schema, an update schema where every field is optional, and a read schema that is the only thing ever serialised outward. Whitelisting beats blacklisting — a response model that lists the fields it emits cannot leak a column added next quarter, whereas an exclude list silently can. This split is also what makes API versioning possible: v1 and v2 schemas can differ while the table stays one shape.",
  },
  {
    t: "Feature-first vs type-first",
    c: "structure",
    l: "craft",
    def: "Grouping files by what they do (auth/, billing/) versus by what they are (components/, services/).",
    note: "Type-first is fine until the project is large. Feature-first scales because a change usually touches one folder.",
    depth:
      "The measurable test is how many folders a typical pull request touches — if adding one field means editing five sibling directories, your layout is fighting your changes. Feature-first also gives you a natural place for the boring stuff a feature owns (its migrations, its fixtures, its tests) and a seam to extract a service along later. The cost is discipline about shared code: without a clear common/ or core/, features start importing each other sideways and you get a distributed monolith in a single repo.",
  },
  {
    t: "Absolute vs relative path",
    c: "structure",
    l: "systems",
    def: "Absolute starts at the filesystem root (/home/app/src/main.py). Relative starts from where you are (./utils, ../config).",
    note: "'./' means this folder, '../' means go up one. Path bugs are almost always about which directory the process was started from.",
    depth:
      "A relative path resolves against the process's current working directory, not the file that contains the string — which is why open('data/seed.json') works from the repo root and breaks under a systemd unit or a container with a different WORKDIR. Build paths from the module's own location instead: Path(__file__).parent / 'data' / 'seed.json' in Python, import.meta.url in ESM. Anything user-supplied must additionally be resolved and checked to still sit inside the intended directory, or ../../etc/passwd becomes a feature.",
  },
  {
    t: "Dotfile",
    c: "structure",
    l: "systems",
    def: "A file whose name begins with a dot — .env, .gitignore, .eslintrc — hidden by default on Unix systems.",
    note: "ls -a shows them. Most of a project's real configuration hides here.",
    depth:
      "Hidden is a shell and file-manager convention, not a permission — a dot buys you exactly zero security, which is why .env belongs in .gitignore and out of any Docker build context. The corollary bites in deployment: cp -r src/. and glob patterns like * skip dotfiles, so config quietly fails to copy and the app starts with defaults. Ship a committed .env.example listing every key with dummy values, so a missing variable is a diff rather than a runtime surprise.",
  },
  {
    t: "README",
    c: "structure",
    l: "craft",
    def: "The front door of a repository: what this is, how to run it, how to test it.",
    note: "Judge it by one question — can a new engineer get the project running from this file alone?",
    depth:
      "Order it by what a stranger needs first: one sentence on what the thing is, then the exact commands to run it, then how to run the tests, then architecture. Every command in it should be copy-pasteable and actually run — a README with a stale command is worse than none, because it costs a reader twenty minutes before they distrust it. The cheapest way to keep it true is to have CI run the same commands the README lists.",
  },

  // ── WORKERS, QUEUES & SCHEDULING ──────────────────────────────
  {
    t: "Synchronous request",
    c: "async",
    l: "edge",
    def: "The default web model: a request arrives, the work happens, the response goes back while the client waits.",
    note: "Fine under a second. Beyond that, browsers time out and each slow request occupies a process that could serve someone else.",
    depth:
      "The hidden cost is concurrency, not latency: with a pool of 4 workers × 2 threads, eight simultaneous 10-second requests mean the ninth caller waits behind them even though the CPU is idle. Little's Law makes it concrete — required concurrency equals arrival rate times service time, so 20 requests/second at 400ms needs 8 slots minimum, before any headroom. Every layer in front has its own patience too: an ALB idle timeout of 60s and an nginx proxy_read_timeout of 60s will cut the connection long before your handler returns.",
  },
  {
    t: "Worker",
    c: "async",
    l: "app",
    def: "A long-running background process that pulls jobs off a queue and executes them. Same codebase as the API, different entry point.",
    note: "Workers scale independently of the API. That independence is the entire reason the pattern exists.",
    depth:
      "Deploy them as a separate process type with their own replica count, memory limit and alerting — a worker doing PDF rendering wants 2GB and no request timeout, while the API wants 256MB and a strict one. Concurrency inside a worker is a second dial: prefork processes for CPU-bound work, threads or gevent for I/O-bound, and getting that choice wrong shows up as either idle CPU or memory that scales with concurrency. Scale on queue depth or oldest-message age, never on worker CPU, which is flat while a queue backs up.",
  },
  {
    t: "Queue",
    aka: "message broker",
    c: "async",
    l: "data",
    def: "The mailbox between producer and consumer. The API writes a message; a worker reads it later.",
    note: "Redis, RabbitMQ, SQS, Kafka. It buffers spikes, survives crashes, and decouples who asks from who does.",
    depth:
      "The families differ in what happens after a message is read. A log (Kafka, Kinesis) keeps messages for a retention window and tracks a per-consumer offset, so you can replay yesterday; a broker (SQS, RabbitMQ, Redis) deletes on acknowledgement, so a bug that consumed and dropped a message is unrecoverable. Redis as a broker is fast and loses data on failover unless configured otherwise, which is fine for thumbnail jobs and not for payments. Ordering is per-partition or per-FIFO-group, never global — if two messages must be processed in order, they must share a key.",
  },
  {
    t: "Producer / consumer",
    c: "async",
    l: "app",
    def: "Producers put messages on a queue. Consumers take them off. Neither knows the other exists.",
    note: "This anonymity is the point — you can add consumers, replace them, or take them offline without touching the producer.",
    depth:
      "What they do share is the message format, and that is now a contract with no compiler behind it. Version the payload from day one, add fields rather than renaming them, and deploy consumers that understand the new shape before producers that emit it — during a rolling deploy both versions are live simultaneously. A schema registry (Avro, Protobuf) turns that discipline into an enforced check; a bare JSON dict turns it into an incident the week someone renames user_id to userId.",
  },
  {
    t: "Enqueue",
    c: "async",
    l: "app",
    def: "Serialising a job's name and arguments and pushing it onto the queue. Takes milliseconds.",
    note: "task.delay(user_id) does not run the task. Confusing enqueue with execute is the classic first-week mistake.",
    depth:
      "Enqueueing inside a database transaction is the subtle version of the same confusion: the worker can pick the job up and query for a row the transaction has not committed yet, so the task fails on a record that certainly exists. Either enqueue after commit (an after_commit hook) or use the transactional outbox — write the message to a table in the same transaction and let a relay publish it. The reverse ordering fails too: commit first, crash before enqueue, and the job is lost with no trace.",
  },
  {
    t: "Task",
    aka: "job",
    c: "async",
    l: "app",
    def: "A unit of background work: a function plus the arguments it was called with.",
    note: "Keep tasks thin — pull out arguments, call a service, return. Logic in services stays testable without a running broker.",
    depth:
      "Arguments must survive serialisation, which quietly rules out objects, database sessions, file handles and anything with a __dict__ full of surprises. Give every task an explicit time limit — a soft limit that raises inside the job so it can clean up, and a hard one that kills it — because the default in most frameworks is no limit at all, and one hung task holds a slot forever. Name tasks by module path and never rename them casually: messages already sitting in the queue reference the old name and will fail to route.",
  },
  {
    t: "Scheduler",
    aka: "Celery Beat, cron",
    c: "async",
    l: "infra",
    def: "A process that enqueues jobs because of time rather than because a user acted.",
    note: "It does almost nothing itself: wakes, checks the schedule, drops a message, sleeps. Workers still do the work.",
    depth:
      "It needs durable state to answer 'did I already fire the 2am run?' after a restart — Beat keeps a schedule file, Kubernetes CronJob keeps last-schedule-time in the API server. Missed windows are a policy decision: if the scheduler was down from 01:55 to 02:10, do you run late or skip? Kubernetes exposes startingDeadlineSeconds for exactly this, and the default of catching up can fire a burst of skipped runs at once. Timezone is the other trap — most schedulers default to UTC, so a 09:00 job drifts an hour twice a year relative to your users.",
  },
  {
    t: "Run exactly one scheduler",
    c: "async",
    l: "infra",
    def: "The rule that only a single scheduler instance may be active, enforced by leader election or a distributed lock.",
    note: "Bundle the scheduler into an API you scale to three replicas and every user gets three copies of the weekly email. Extremely common, extremely embarrassing.",
    depth:
      "Two enforcement styles: a single-replica Deployment, which is simple and has a gap while the pod reschedules, or leader election over a lock with a TTL, which survives node loss but requires the loser to actually stop. Even with a lock, duplicates are possible — a paused holder can wake after its TTL expired believing it still leads — so the jobs themselves should be idempotent on a period key like 'weekly-digest-2026-W32'. That key, unique-indexed in a table, is the belt to the lock's braces.",
  },
  {
    t: "Cron expression",
    c: "async",
    l: "infra",
    def: "Five fields — minute, hour, day-of-month, month, day-of-week — describing a recurring time.",
    note: "0 2 * * * is 2am daily. */5 * * * * is every five minutes. 0 9 * * 1 is 9am Monday. Verify with a cron parser, never by eye.",
    depth:
      "Day-of-month and day-of-week are OR'd, not AND'd, when both are set: 0 0 13 * 5 runs every 13th and every Friday, not only Friday the 13th. Ranges that do not divide evenly wrap badly — */7 in the minutes field fires at 0,7,…,56 and then again at 0, a four-minute gap you did not ask for. Never schedule anything meaningful at 02:30 local time; on the spring DST transition that hour does not exist, and in autumn it happens twice.",
  },
  {
    t: "Priority queue",
    c: "async",
    l: "data",
    def: "Separate queues by urgency — critical, default, low — with workers assigned to each.",
    note: "Without this, a nightly batch of 50,000 analytics jobs delays every password-reset email behind it.",
    depth:
      "Prefer dedicated worker pools per queue over one pool consuming several, because a shared pool with a strict priority order starves the low queue completely under sustained load, and weighted consumption is fiddly to tune. Partition by latency requirement rather than by importance — everything feels important, but only some things have a human waiting. Watch oldest-message-age per queue separately; an aggregate depth metric hides a low-priority queue that has not drained in three days.",
  },
  {
    t: "Backpressure",
    c: "async",
    l: "infra",
    def: "The signal that work is arriving faster than it can be processed, visible as growing queue depth.",
    note: "Queue depth is the single best health metric for an async system. If it rises and never drains, you are under-provisioned.",
    depth:
      "Depth alone is ambiguous — 10,000 messages is fine at 5,000/second and a disaster at 5/second — so alert on age of the oldest message, which is directly in user-visible units. Derive drain time as depth divided by (throughput minus arrival rate); when that denominator goes negative, no amount of waiting helps and you must either add consumers or shed load. Real backpressure means the producer feels it: a bounded queue that rejects with 429 protects the system, while an unbounded one just relocates the failure to memory.",
  },
  {
    t: "Idempotency",
    c: "async",
    l: "app",
    def: "The property that running an operation twice produces the same result as running it once.",
    note: "Non-negotiable for background work. A worker can crash after charging a card and before recording it, and the retry will charge again unless you designed for this.",
    depth:
      "Implement it with a uniqueness constraint rather than a check-then-act, which is just a race with better manners: INSERT the operation key and let the database reject the duplicate. Natural idempotency is better still — SET status = 'paid' is safe to repeat, balance = balance + 10 is not, so prefer absolute writes over increments. For external calls you cannot make idempotent, record intent before acting and reconcile after: a row saying 'about to charge, key abc123' is what lets a retry ask the provider what happened instead of guessing.",
  },
  {
    t: "Exponential backoff",
    c: "async",
    l: "app",
    def: "Waiting progressively longer between retries — 1s, 2s, 4s, 8s — instead of retrying immediately.",
    note: "Retrying instantly against a struggling service is indistinguishable from attacking it.",
    depth:
      "Cap the delay (typically 30–60s) and cap total attempts, or a doubling sequence reaches hours and the job outlives its own relevance. Only retry what can succeed later: timeouts, 429, 502/503/504 and connection resets yes; 400 and 422 never, because the payload will still be wrong in eight seconds. Honour Retry-After when the server sends one — it knows more than your formula does — and remember that backoff protects the callee, while a circuit breaker is what protects the caller from waiting through all of it.",
  },
  {
    t: "Jitter",
    c: "async",
    l: "app",
    def: "Random variation added to backoff delays so retrying clients do not synchronise.",
    note: "Without jitter, ten thousand clients that failed together retry together, forever, in waves.",
    depth:
      "Full jitter — sleep a random value between 0 and the current backoff ceiling — beats adding a small random offset, because the latter keeps the herd's shape and merely blurs its edges. The same reasoning applies well beyond retries: stagger cache TTLs, health-check intervals and cron minutes across instances, or you have built a synchronised load spike on purpose. Anything where every client uses the identical constant is a thundering herd waiting for a trigger.",
  },
  {
    t: "Dead letter queue",
    aka: "DLQ",
    c: "async",
    l: "data",
    def: "A holding queue for messages that failed repeatedly and will never succeed.",
    note: "Its purpose is containment. Its failure mode is that nobody ever looks at it — alert on DLQ depth.",
    depth:
      "Alert on any message arriving, not on a depth threshold: one poisoned payment message matters, and a threshold of 100 means you learn about it on the hundredth. Store enough to act — the original body, the failure reason, the stack trace, the attempt count — because a DLQ holding bare payloads tells you what failed and never why. Redriving needs a plan too: replay after the fix is deployed, in small batches, and be certain the consumer is idempotent, since some of those messages did partially succeed.",
  },
  {
    t: "Poison message",
    c: "async",
    l: "data",
    def: "A malformed job that crashes any worker consuming it, gets retried, and crashes the next one.",
    note: "One bad message can halt an entire pipeline. Retry limits plus a DLQ are the standard defence.",
    depth:
      "It is worst in ordered systems: a Kafka partition cannot advance past a message the consumer refuses to commit, so one bad record blocks every later record for that key. Distinguish the two shapes — a payload your parser rejects (deserialise defensively and DLQ immediately, no retries, it will never parse) from one that triggers a code path bug (retry-limit it, since a fix may make it succeed). Validating at the edge of the consumer, before any business logic, is what keeps the second category small.",
  },
  {
    t: "Fan-out",
    c: "async",
    l: "app",
    def: "One job spawning many smaller jobs — 'email all users' becoming 10,000 individually retryable tasks.",
    note: "Far better than one enormous job: failure is isolated to a single recipient rather than restarting everything.",
    depth:
      "The fan-out job itself must be careful: loading 10 million ids into memory to enqueue them is its own outage, so page through with a keyset cursor and enqueue in chunks. Downstream capacity is the other half — 10,000 jobs hitting a third-party API at 100 requests/second means you have built a self-inflicted rate-limit breach, so throttle at the worker or spread with a per-job delay. If you need to know when all of it finished, you need an explicit counter or a chord/callback primitive; queues do not tell you that on their own.",
  },
  {
    t: "Pass IDs, not objects",
    c: "async",
    l: "app",
    def: "Sending user_id=42 to a task rather than a serialised user object.",
    note: "Arguments sit in a queue and go stale. Fetch fresh data inside the task or you will act on a snapshot from ten minutes ago.",
    depth:
      "Two other reasons reinforce it: a serialised object embeds a schema that a rolling deploy may no longer be able to load, and payload size matters — SQS caps a message at 256KB and brokers slow down long before that. The exception is when the snapshot is the point. An audit event or a price at time of order must carry its values, because re-reading later gives you a different, wrong answer. Deleted rows are the standard gap: a task holding only an id must tolerate the row being gone by the time it runs.",
  },
  {
    t: "Visibility timeout",
    c: "async",
    l: "data",
    def: "How long a claimed message stays hidden from other consumers before returning to the queue.",
    note: "Set shorter than your job runtime and the job runs twice concurrently. Set far too long and crashed jobs take an hour to recover.",
    depth:
      "Size it against your p99 job duration with real headroom, not the average — SQS defaults to 30 seconds, which is under most real jobs. For work with a long tail, extend the timeout mid-flight (SQS ChangeMessageVisibility, Kafka's heartbeat thread) rather than picking a pessimistic constant that delays every genuine crash recovery. The equivalent knob in Kafka is max.poll.interval.ms: exceed it and the broker decides you are dead, rebalances the partition to someone else, and your completed work fails to commit.",
  },
  {
    t: "At-least-once vs exactly-once",
    c: "async",
    l: "data",
    def: "Delivery guarantees. At-least-once may duplicate; exactly-once is expensive and often partially fictional.",
    note: "The practical answer is at-least-once delivery plus idempotent consumers. Stop chasing exactly-once at the broker.",
    depth:
      "The impossibility is in the acknowledgement, not the transport: ack before processing and a crash loses the message (at-most-once), ack after and a crash duplicates it (at-least-once), and no ordering of two independent systems removes the window. Kafka's exactly-once is real but narrow — it covers read-process-write entirely within Kafka via transactions and offsets; the moment your side effect is an email or a Stripe charge, the guarantee stops at the boundary. Effectively-once is the honest goal: duplicates delivered, deduplicated on a key by the consumer.",
  },
  {
    t: "Heartbeat",
    c: "async",
    l: "infra",
    def: "A periodic signal from a long-running job proving it is still alive and progressing.",
    note: "Without one, a hung job is indistinguishable from a slow one and nothing ever reclaims it.",
    depth:
      "Make it prove progress, not liveness — a heartbeat emitted from a background thread keeps reporting healthy while the main loop is deadlocked, which is the most expensive kind of green dashboard. Emit it from the work loop itself, carrying a counter or an offset. The timeout should be a few missed intervals (heartbeat every 10s, declare dead at 30–45s), because a single missed beat is usually a GC pause or a network blip, and a hair-trigger produces reclaim storms under load.",
  },
  {
    t: "Chunking long jobs",
    c: "async",
    l: "app",
    def: "Splitting multi-hour work into checkpointed segments so a retry resumes rather than restarts.",
    note: "A four-hour job that dies at hour three and starts over is a job that never finishes.",
    depth:
      "Persist the cursor in the same transaction as the work it covers, or a crash between the two gives you either repeated or skipped rows. Use a keyset cursor (WHERE id > last_id ORDER BY id LIMIT 1000), not OFFSET, whose cost grows with the offset and whose results shift when rows are inserted underneath you. Sizing the chunk is a trade: small chunks mean more checkpoint overhead and faster recovery, and anything under roughly a minute per chunk usually keeps you inside the visibility timeout comfortably.",
  },
  {
    t: "Debounce vs throttle",
    c: "async",
    l: "app",
    def: "Debounce waits for activity to stop before acting. Throttle acts at most once per interval regardless.",
    note: "Search-as-you-type is debounce. Rate-limited API calls are throttle. Mixing them up produces very confusing bugs.",
    depth:
      "Debounce has an unbounded worst case: continuous input means it never fires, which is why a save-on-type feature needs a max-wait (fire at least every 5s regardless) or the user loses work. Throttle has leading and trailing variants, and the trailing edge is what most people actually want — otherwise the final state after a burst is never applied. Both need a cancel path on unmount or shutdown, or the timer fires into a component or process that no longer exists.",
  },
  {
    t: "Daemon",
    c: "async",
    l: "infra",
    def: "Any process designed to run continuously in the background rather than exit after a task.",
    note: "Workers, schedulers and web servers are all daemons. A cron job is not.",
    depth:
      "The classic Unix double-fork ritual (detach, setsid, redirect stdio) is obsolete in a container: your process should stay in the foreground, log to stdout, and let the supervisor — systemd, Docker, Kubernetes — own restart and log collection. Self-daemonising in a container is how you end up with a PID 1 that exits immediately and an orchestrator that thinks the job succeeded. A long-lived process also means anything you leak accumulates, so cached objects, unclosed sockets and growing in-memory dicts show up as a slow upward slope on a memory graph.",
  },

  // ── PROCESS LIFECYCLE ─────────────────────────────────────────
  {
    t: "Signal",
    c: "lifecycle",
    l: "infra",
    def: "A message the operating system sends a process. SIGTERM asks it to stop; SIGKILL forces it to.",
    note: "SIGTERM can be caught and handled. SIGKILL cannot — no cleanup code runs, no connections close.",
    depth:
      "Signals interrupt whatever the process was doing, so a handler runs in a constrained context — in C only async-signal-safe calls are legal, and in Python the handler runs between bytecodes on the main thread, which is why a signal never interrupts a blocking C extension call. Practical consequences: set a flag and let the main loop act on it rather than doing real work in the handler, and know the useful ones by name — SIGHUP (reload config, by convention), SIGINT (Ctrl-C), SIGQUIT, SIGUSR1/2 for whatever the application defines.",
  },
  {
    t: "SIGTERM",
    c: "lifecycle",
    l: "infra",
    def: "The polite shutdown signal. Kubernetes and Docker send it first and give you a grace period.",
    note: "Handling it is what makes a deploy invisible. Ignoring it makes every deploy drop in-flight requests.",
    depth:
      "In Kubernetes the signal and the endpoint removal happen concurrently, not in sequence, so the pod can still receive traffic for a second or two after SIGTERM lands while proxies update. The standard fix is a preStop hook that sleeps 5–15 seconds, or a handler that fails readiness first and only then stops accepting connections. Note that Docker sends the signal only to PID 1, and a second SIGTERM during shutdown usually means an impatient operator — decide whether that escalates to an immediate exit.",
  },
  {
    t: "SIGKILL",
    c: "lifecycle",
    l: "infra",
    def: "Immediate, uncatchable termination. Sent after the grace period expires.",
    note: "If your worker is mid-job when this lands, the job is lost or retried — which is precisely why idempotency matters.",
    depth:
      "The kernel reclaims memory, file descriptors and sockets, so nothing leaks at the OS level — what is lost is everything above it: buffered writes not yet fsynced, an open database transaction (rolled back on connection close, eventually), an in-memory queue of pending metrics. Design so that a SIGKILL at any instant is survivable, since that is exactly what an OOM kill or a node failure gives you with no warning at all. If you see repeated 137s, the grace period is too short or the shutdown handler is blocking on something.",
  },
  {
    t: "Graceful shutdown",
    c: "lifecycle",
    l: "infra",
    def: "On SIGTERM: stop accepting new work, finish what is in flight, close resources, then exit cleanly.",
    note: "The most under-implemented feature in backend engineering, and the one users notice most when it is missing.",
    depth:
      "The order matters and is worth writing down: fail readiness → stop accepting new connections or stop polling the queue → wait for in-flight work with a timeout shorter than the grace period → flush logs, metrics and traces → close pools → exit 0. Each step needs its own deadline, because an unbounded wait for a stuck request converts a graceful shutdown into a SIGKILL anyway. For workers the equivalent is warm shutdown: finish the current message, do not claim another, and let the broker keep anything unacked.",
  },
  {
    t: "Draining",
    c: "lifecycle",
    l: "edge",
    def: "The phase where a load balancer stops sending new traffic to an instance while existing requests complete.",
    note: "Must begin before SIGTERM arrives, otherwise there is a window where requests route to a dying process.",
    depth:
      "Drain time must exceed your longest normal request plus the health-check detection window — with a check every 10s and a threshold of 2 failures, the balancer needs 20 seconds just to notice. Long-lived connections are the hard case: WebSockets and streaming responses will not finish on their own, so they need an application-level 'reconnect now' message, and HTTP keep-alive connections should be closed with a Connection: close on the way out. Deregistration delay is the AWS name for this dial; the default of 300 seconds is often far more than you need and slows every deploy.",
  },
  {
    t: "Grace period",
    c: "lifecycle",
    l: "infra",
    def: "The time between SIGTERM and SIGKILL. Thirty seconds by default in Kubernetes.",
    note: "If your longest request takes 45 seconds, the default is already truncating it. Tune it deliberately.",
    depth:
      "The budget is shared: terminationGracePeriodSeconds covers the preStop hook and the shutdown handler together, so a 15-second sleep leaves 15 seconds of the default 30 for actual draining. Set it from your p99 plus the drain delay, and set the application's own in-flight timeout slightly lower so you always exit on your own terms. Batch workers may legitimately need minutes — but a very long grace period also means a very slow rollout and a very slow node drain, so it is a real trade, not a free safety margin.",
  },
  {
    t: "Exit code",
    c: "lifecycle",
    l: "infra",
    def: "The number a process returns on exit. Zero means success; anything else means failure.",
    note: "137 is SIGKILL (128+9) and usually means out-of-memory. 143 is SIGTERM. Reading exit codes shortcuts hours of guessing.",
    depth:
      "Anything above 128 is 128 plus the signal number, so 139 is SIGSEGV (11) and 134 is SIGABRT (6) — a segfault and an assertion failure respectively, which are very different investigations. Ordinary codes are conventions: 1 is generic failure, 2 is usually a usage error, 126 means found but not executable, 127 means command not found (nearly always a PATH or typo problem inside a container). In a shell pipeline $? gives you only the last command's code; set -o pipefail is what makes the middle of a pipe able to fail the script.",
  },
  {
    t: "OOM kill",
    c: "lifecycle",
    l: "infra",
    def: "The kernel terminating a process that exceeded its memory limit, with no warning and no cleanup.",
    note: "Shows up as a container that restarts under load with exit code 137 and suspiciously empty logs.",
    depth:
      "Inside a container the cgroup limit is what binds, and the process cannot see it — Python and the JVM historically read the host's total memory and size their heaps for a machine they do not have. Check dmesg or kubectl describe pod for the OOMKilled reason rather than inferring from the code. The usual causes are unbounded in-memory accumulation (reading a whole file, a query with no LIMIT, an unbounded cache), fragmentation in long-lived processes, and forgetting that each prefork worker holds its own copy, so limit divided by worker count is the real per-worker budget.",
  },
  {
    t: "PID 1",
    c: "lifecycle",
    l: "infra",
    def: "The first process in a container, responsible for forwarding signals and reaping dead children.",
    note: "A shell script as PID 1 often swallows SIGTERM entirely. Use exec, or an init like tini.",
    depth:
      "PID 1 is special in two ways: the kernel does not apply default signal actions to it, so a process with no SIGTERM handler simply ignores the signal, and it inherits every orphan and must reap them. Shell-form CMD in a Dockerfile (CMD python app.py) runs under /bin/sh -c and puts the shell at PID 1; exec-form (CMD with a JSON array) or exec in an entrypoint script puts your process there instead. Use --init or tini when your process legitimately spawns children it does not wait on.",
  },
  {
    t: "Zombie process",
    c: "lifecycle",
    l: "systems",
    def: "A finished process whose exit status was never collected by its parent, so its entry lingers.",
    note: "Harmless individually, fatal in bulk — they consume process table slots until nothing new can start.",
    depth:
      "A zombie holds no memory and no descriptors — only a PID and an exit status waiting to be read — which is why they are invisible on a memory graph and only surface as fork failures once you hit the PID limit. ps shows them as state Z or <defunct>. You cannot kill a zombie, it is already dead; you fix the parent, which must call wait()/waitpid() or ignore SIGCHLD explicitly. In containers this is nearly always the missing-init problem, and if the parent dies the zombies are reparented to PID 1 and reaped there.",
  },
  {
    t: "Orphan process",
    c: "lifecycle",
    l: "systems",
    def: "A child process whose parent died, leaving it adopted by PID 1.",
    note: "In containers without a real init, orphans accumulate and nothing reaps them.",
    depth:
      "Orphans are alive and still consuming resources, which is the difference from zombies and why they matter more: a subprocess started with Popen and never waited on keeps running after your worker exits, holding a port or a lock. Kill process groups rather than single PIDs (kill -TERM -<pgid>, or start with start_new_session=True so you have a group to target). In Kubernetes the container's PID namespace usually cleans this up on pod termination, but a supervisor pattern inside one container does not get that for free.",
  },
  {
    t: "Liveness probe",
    c: "lifecycle",
    l: "infra",
    def: "A health check asking 'are you alive?' — failure triggers a restart.",
    note: "Make it cheap and dependency-free. A liveness probe that checks the database will restart every pod during a database blip.",
    depth:
      "It should answer one question: is this process so broken that only a restart can fix it — deadlocked event loop, wedged thread pool. A static 200 from a handler on the same loop as your traffic already proves more than it looks like, since a blocked loop cannot answer it. Give it a generous failureThreshold and a real initialDelaySeconds or startupProbe, because a slow-booting app restarted mid-boot is an infinite loop that looks like a crash. If a restart would not help, it does not belong in liveness.",
  },
  {
    t: "Readiness probe",
    c: "lifecycle",
    l: "infra",
    def: "A check asking 'can you serve traffic right now?' — failure removes you from the load balancer without restarting.",
    note: "This is the one that should check dependencies. Confusing the two probes causes restart storms.",
    depth:
      "Check only dependencies you cannot serve any request without, and check them cheaply — SELECT 1 against a pool, not a real query, and never a fan-out to five downstream services, which turns one partner's outage into your own total unavailability. If every replica fails readiness at once you have taken yourself offline more effectively than the underlying fault would have. Readiness is also the correct switch to flip first in graceful shutdown, and the correct way to hold traffic while a cache warms.",
  },
  {
    t: "Restart policy",
    aka: "CrashLoopBackOff",
    c: "lifecycle",
    l: "infra",
    def: "Rules for what happens when a process exits — always restart, restart on failure, never.",
    note: "CrashLoopBackOff means it keeps dying on startup. Read the logs from the previous container, not the current one.",
    depth:
      "The backoff doubles from 10s to a 5-minute ceiling, which is why a bad deploy looks fast for the first minute and then appears to stall — and why kubectl logs --previous (or the crashed container's logs) is the only place the actual traceback lives. Distinguish the shapes: instant crashes are almost always config or a missing environment variable; crashes a few minutes in are usually OOM; crashes exactly at the probe interval mean a probe is killing a healthy process. Batch jobs want restart: on-failure with a backoff limit, not always, or a permanently broken job retries forever.",
  },
  {
    t: "Cold start",
    c: "lifecycle",
    l: "infra",
    def: "The latency of a process that must initialise before serving its first request.",
    note: "The defining tax of serverless, and the reason a 'scale to zero' setup can feel slow to real users.",
    depth:
      "It has layers: container pull and start, runtime boot, your imports, then connection pools and any model or cache warm-up — and imports are usually the surprise, since one heavy library at module scope can cost hundreds of milliseconds on every cold path. The mitigations are provisioned concurrency, keeping a minimum replica count above zero, lazy-importing what the request may not need, and shrinking the image. It is a tail-latency problem, not an average one: p50 looks fine while p99 carries the whole cost, which is exactly the percentile users complain about.",
  },

  // ── CONCURRENCY ───────────────────────────────────────────────
  {
    t: "Process vs thread",
    c: "concurrency",
    l: "systems",
    def: "A process owns its memory. Threads live inside a process and share its memory.",
    note: "Sharing is why threads are fast and why they are dangerous. Processes are isolated and expensive.",
    depth:
      "Numbers make the trade concrete: a thread costs roughly 8MB of reserved stack and microseconds to create; a process costs a full address space and milliseconds, though fork's copy-on-write means the memory is shared until written. Isolation is the real dividing line — one thread segfaulting takes the whole process down, while one crashed worker process is just a restart. That is why prefork servers (Gunicorn, Unicorn) dominate for user-facing code: a memory leak or a crash is contained and recycled with max-requests.",
  },
  {
    t: "Concurrency vs parallelism",
    c: "concurrency",
    l: "systems",
    def: "Concurrency is dealing with many things by interleaving. Parallelism is doing many things simultaneously on multiple cores.",
    note: "One barista alternating between orders is concurrent. Two baristas are parallel. Most web workloads only need the first.",
    depth:
      "Pick by where the time goes: if a request spends 95% of its 200ms waiting on the database and an API, concurrency alone gets you enormous throughput on one core, and adding cores changes almost nothing. Amdahl's law is the ceiling on the other side — a workload that is 10% serial can never go more than 10× faster no matter how many cores you buy. Measure first, because 'make it parallel' applied to an I/O-bound service adds coordination cost and complexity to fix a bottleneck that was never CPU.",
  },
  {
    t: "GIL",
    aka: "Global Interpreter Lock",
    c: "concurrency",
    l: "systems",
    def: "CPython's lock permitting only one thread to execute Python bytecode at a time.",
    note: "Threads still help for I/O waiting. For CPU-bound work you need processes — multiprocessing, or a different language.",
    depth:
      "The lock is released around blocking I/O and inside C extensions that opt in, which is why NumPy, Pillow and database drivers can genuinely use multiple cores from threads while pure-Python loops cannot. CPU-bound Python threads are worse than useless: they add lock contention and context switching for zero throughput. The escape hatches are multiprocessing, a native extension, or Python 3.13's optional free-threaded build — still experimental, and the ecosystem's C extensions are the long pole.",
  },
  {
    t: "Blocking call",
    c: "concurrency",
    l: "app",
    def: "Code that sits idle waiting for I/O — a network response, a disk read — occupying its thread the whole time.",
    note: "A single blocking call inside an async function freezes the entire event loop and every other request on it.",
    depth:
      "The tell is that latency degrades for every concurrent request at once, not just the slow endpoint — one 2-second requests.get() in an async handler stalls every other coroutine on that loop for 2 seconds. Beyond obvious I/O, the usual culprits are CPU-heavy work (bcrypt, JSON over a few megabytes, image resizing), synchronous database drivers, and time.sleep. The fix is an async client, or pushing the work off the loop with run_in_executor / asyncio.to_thread. Python's asyncio debug mode will name any callback that ran longer than 100ms.",
  },
  {
    t: "Event loop",
    c: "concurrency",
    l: "app",
    def: "The scheduler inside an async runtime that decides which suspended coroutine resumes next.",
    note: "Single-threaded by design. Its throughput depends entirely on nothing hogging it.",
    depth:
      "Underneath it is epoll or kqueue: the loop asks the kernel which of ten thousand file descriptors are ready, then runs the callbacks for those, forever. Scheduling is cooperative, which means fair only if every coroutine yields — there is no preemption to rescue you from a tight loop. Two operational consequences: loop lag (the delay between when a callback was due and when it ran) is the health metric worth graphing, and running one loop per core via separate processes is how you use the whole machine.",
  },
  {
    t: "async / await",
    aka: "coroutine",
    c: "concurrency",
    l: "app",
    def: "Syntax for functions that can suspend at await points, letting one thread serve thousands of waiting connections.",
    note: "Async does not make code faster. It makes waiting cheap, which is a different thing.",
    depth:
      "Sequential awaits are still sequential: three awaited calls of 100ms each take 300ms, and asyncio.gather is what makes them 100ms. A coroutine does nothing until awaited or scheduled as a task, so a forgotten await is a silent no-op with a warning at best. Fire-and-forget needs care too — keep a reference to any created task or it can be garbage-collected mid-flight, and always give concurrent work a timeout and a cancellation path, since cancellation in async code is a real control-flow path that your cleanup must handle.",
  },
  {
    t: "Race condition",
    c: "concurrency",
    l: "app",
    def: "Two operations touching shared state at once, where the outcome depends on timing.",
    note: "Reproduces on production and never on your laptop. Suspect one whenever a bug is intermittent.",
    depth:
      "The classic shape is check-then-act: 'if no user with this email, create one' run twice concurrently creates two users, because the gap between the check and the write is where the other request lives. Fixes in order of preference: a database unique constraint (let the engine arbitrate), an atomic operation such as INSERT … ON CONFLICT, then explicit locking. Load — not correctness of reasoning — is what surfaces these, so reproduce with concurrent requests rather than by reading the code harder.",
  },
  {
    t: "Lock / mutex",
    c: "concurrency",
    l: "app",
    def: "A guard ensuring only one execution path enters a critical section at a time.",
    note: "Correct and slow beats fast and wrong, but hold locks for the shortest possible time.",
    depth:
      "Never do I/O inside a lock: an HTTP call under a mutex serialises every caller behind the slowest network round trip, and turns a p99 blip into a queue. Always acquire with a context manager or try/finally so an exception cannot leave it held, and prefer a timeout on acquisition so a bug surfaces as an error rather than a hang. Know your lock types — a reentrant lock lets the same thread re-acquire (which plain mutexes deadlock on), and a read/write lock lets many readers proceed when writes are rare.",
  },
  {
    t: "Deadlock",
    c: "concurrency",
    l: "app",
    def: "Two processes each holding a lock the other needs. Neither can proceed, forever.",
    note: "Prevented by always acquiring locks in the same order everywhere in the codebase.",
    depth:
      "All four Coffman conditions must hold — mutual exclusion, hold-and-wait, no preemption, circular wait — and consistent lock ordering is simply the cheapest one to break. Databases deadlock the same way and detect it: Postgres aborts one transaction with SQLSTATE 40P01 after deadlock_timeout, so the application must be prepared to retry. Common source: two transactions updating the same set of rows in different orders, fixed by sorting the ids before you update. Symptom to recognise: throughput goes to zero while CPU is idle and nothing times out.",
  },
  {
    t: "Distributed lock",
    c: "concurrency",
    l: "data",
    def: "A lock held in shared storage (usually Redis) so only one instance across many machines acts.",
    note: "How you enforce 'exactly one scheduler'. Must have a TTL, or a crashed holder blocks everyone permanently.",
    depth:
      "SET key value NX PX 30000 acquires it; release must be a Lua script comparing a unique token before deleting, or you will delete a lock someone else acquired after your TTL expired. That is the fundamental flaw: a GC pause or a network partition can leave you believing you hold a lock you lost, so a distributed lock is an optimisation for avoiding duplicate work, not a safety guarantee for correctness. When correctness is required, add a fencing token the resource checks, or make the operation idempotent and stop relying on the lock.",
  },
  {
    t: "Atomic operation",
    c: "concurrency",
    l: "data",
    def: "An operation that completes entirely or not at all, with no observable intermediate state.",
    note: "Prefer an atomic database increment over read-modify-write in application code. The database is better at this than you are.",
    depth:
      "The workhorses are UPDATE … SET n = n + 1 (one statement, one row lock), INSERT … ON CONFLICT DO UPDATE, Redis INCR and SETNX, and compare-and-swap via an optimistic version column — UPDATE … WHERE version = 7, then check that one row was affected. Atomicity is scoped: atomic per row in a database, per key in Redis, and never across two different systems, which is why 'write to Postgres and publish to Kafka' is a distributed-transaction problem that needs an outbox rather than hope.",
  },
  {
    t: "Thundering herd",
    c: "concurrency",
    l: "data",
    def: "A cache entry expires and hundreds of requests simultaneously stampede the database to rebuild it.",
    note: "Fixed with a rebuild lock, staggered TTLs, or serving stale data while one request refreshes.",
    depth:
      "Stale-while-revalidate is usually the best answer: keep serving the expired value and let exactly one request (holding a short lock) recompute, so latency never spikes and the origin sees one query instead of five hundred. Probabilistic early expiry — each reader refreshes with a small chance that grows as the TTL approaches — spreads the work with no lock at all. The same pattern appears without caches: a mass client reconnect after a deploy, or every cron firing on the hour. Jitter your TTLs by ±10% as a default habit.",
  },
  {
    t: "Idempotency key",
    c: "concurrency",
    l: "api",
    def: "A client-supplied unique identifier letting a server recognise and ignore a duplicate request.",
    note: "The standard mechanism for safe payment retries. Stripe made it the industry norm for a reason.",
    depth:
      "Store the key with the response you returned and replay it byte-for-byte on a repeat, so the client's retry gets the original 201 and resource id rather than a 409 it has to interpret. Scope keys per endpoint and per account, expire them after 24 hours or so, and handle the in-flight case explicitly — a second request arriving while the first is still processing should get 409 Conflict, not a second charge. Hashing the request body against the key catches the client bug where the same key is reused for different payloads.",
  },
  {
    t: "Backpressure vs buffering",
    c: "concurrency",
    l: "infra",
    def: "Backpressure slows the producer. Buffering absorbs the excess in memory.",
    note: "Unbounded buffers do not solve overload, they postpone it and convert it into an out-of-memory kill.",
    depth:
      "A buffer is correct for smoothing bursts and wrong for a sustained rate mismatch — if arrival exceeds service rate on average, no buffer size is enough, it only sets how long until the failure. Bound every queue and decide the policy at the boundary: block the producer (TCP's own window does this), drop oldest, drop newest, or reject with 429. Latency is the hidden cost of a deep buffer: a queue of 10,000 items at 100/second adds 100 seconds of delay to every item, so work completes but nobody wants it any more.",
  },
];
