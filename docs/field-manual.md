# The Engineer's Field Manual

289 terms across 16 areas and 8 layers of a running system.

Each entry has three parts: **what it is**, **how it bites** in production, and **in depth** — the mechanism underneath, for when the one-liner is not enough.

Generated from `data/terms-*.js` by `npm run export:md`. Edit the data, not this file.

## Contents

- [Project structure](#structure) — Where code lives · 19 terms
- [Workers, queues & scheduling](#async) — Work that outlives a request · 24 terms
- [Process lifecycle](#lifecycle) — Starting, running, dying · 15 terms
- [Concurrency](#concurrency) — More than one thing at once · 14 terms
- [Data & state](#data) — Keeping the truth · 24 terms
- [APIs & networking](#api) — Talking between machines · 29 terms
- [Architecture](#architecture) — Arranging the pieces · 20 terms
- [Data engineering](#pipelines) — Moving data at volume · 14 terms
- [Testing & quality](#testing) — Proving it works · 14 terms
- [Git, CI/CD & delivery](#delivery) — Getting it to users · 22 terms
- [Operations & observability](#ops) — Knowing what's happening · 16 terms
- [Security](#security) — Assuming bad input · 15 terms
- [Systems & Linux](#systems) — The machine underneath · 13 terms
- [AI & LLM engineering](#ai) — Building on models · 23 terms
- [ML training](#ml) — Making the model · 15 terms
- [Working as an engineer](#career) — The human protocol · 12 terms

<a id="structure"></a>

## Project structure

*Where code lives*

The shape of a repository is the first documentation anyone reads. These terms describe how a codebase is laid out and why the layout is a design decision rather than housekeeping.

### Repository *(aka repo)*

`Craft`

A project tracked by version control, containing its full history of changes.

> A monorepo holds many deployable services in one repo; a polyrepo gives each its own. Monorepos make shared code easy and CI slow.

The real axis is not one repo or many, it is whether a change that spans two services can be one atomic commit. Monorepos buy that and pay for it with tooling: once every push runs every test suite, you need affected-target detection (Nx, Turborepo, Bazel) or CI time grows with the org chart. Polyrepos give you fast, obvious CI and hand you version skew instead — service A pinned to v1.2 of the shared client while B is on v2.0, and the bug lives in the gap.

### Root

`Craft`

The outermost folder of a project. A 'root-level file' sits directly inside it, not nested.

> Config lives at the root by convention so tools can find it without being told where to look.

Most tools locate the root by walking upward from the current directory until they find a marker — .git, package.json, pyproject.toml — which is why running a command from a subfolder usually still works, and why it occasionally picks up the wrong project in a monorepo. When a linter mysteriously uses different rules in CI than locally, the first thing to check is which directory each one started the upward walk from.

### Entry point

`Application`

The first file executed when a program starts — main.py, index.js, __main__.py.

> One codebase often has several: an API entry point, a worker entry point, a scheduler entry point. Same code, different doors.

The entry point is where the runtime hands control to you, so it is also the only place with the whole picture: it reads config, builds the dependency graph, and wires it into a server or a consumer loop. Keep it dumb and declarative — everything it constructs should be constructible in a test without it. The tell that you got this wrong is a test that has to import main to get at a database session.

### Source vs build *(aka src/ vs dist/)*

`Craft`

src/ is what humans write. dist/ or build/ is the compiled, bundled output a machine generates from it.

> Never edit build output — it is overwritten on the next build. If a fix only exists in dist/, it does not exist.

Build output should be reproducible from source plus a lockfile and nothing else — that property is what lets CI throw away the artifact and rebuild it identically. Source maps are the bridge back: they let a stack trace from minified production code point at the line you actually wrote, which is why shipping them (to an error tracker, not necessarily to the public) turns unreadable incidents into ordinary ones.

### Module

`Application`

A single file of reusable code that can be imported elsewhere.

> A package is a folder of modules. In Python, __init__.py is what promotes a folder to a package.

Import is not free and not lazy: importing a module runs every top-level statement in it, once, and caches the result. That is why a database connection opened at module level connects the moment anything imports the file — including your test collector. It is also how circular imports bite: A imports B while B is still half-executed, and B's names do not exist yet. Move the shared thing to a third module, or import inside the function.

### Package manifest *(aka package.json, pyproject.toml)*

`Craft`

The file declaring a project's name, dependencies, scripts, and tool configuration.

> pyproject.toml is the modern Python standard and absorbs setup.py, requirements.txt and most linter configs into one place.

The manifest declares ranges — ^1.4.0, >=2,<3 — which is a statement of intent about compatibility, not a build input. Ranges are what let a security patch reach you without a code change, and what let an unrelated upgrade break you at 3am. Split dependencies from dev-dependencies properly: anything in the main list ends up in your production image, and a test framework in there is both weight and attack surface.

### Lockfile *(aka uv.lock, package-lock.json, poetry.lock)*

`Craft`

A generated file pinning the exact resolved version of every dependency, including transitive ones.

> Commit it. Never hand-edit it. It is the difference between 'works on my machine' and reproducible builds.

The lockfile records the whole resolved graph plus content hashes, so an install verifies bytes rather than trusting a version number — this is what stops a republished tarball silently changing under you. Use the install command that honours it strictly (npm ci, uv sync --frozen, poetry install --sync) in CI and Docker; plain npm install is allowed to update the lock, which means your image can differ from your teammate's for reasons nobody recorded. A conflicted lockfile is regenerated, never merged by hand.

### Constraints file

`Craft`

A list that caps versions of whatever gets installed without itself requesting any packages.

> Useful for saying 'whatever pulls in urllib3, it must stay below 2.0' across an entire dependency tree.

It is a filter applied during resolution rather than a request, which is exactly what you want for a policy that must hold across many services: one shared constraints file, referenced by all of them, no duplicated pins. The npm equivalent is an overrides block, Yarn calls it resolutions. Treat every entry as debt with a reason attached — write the ticket number in a comment, because an unexplained cap outlives the incident that caused it by years.

### Transitive dependency

`Craft`

A library you never asked for, installed because something you did ask for needs it.

> Most of your node_modules is transitive. Most supply-chain vulnerabilities arrive this way too.

You cannot audit what you cannot see: npm ls <pkg> and pip tree show why something is present and who pulled it in, which is the first question in any CVE triage. Depth matters more than count — a package four levels down is maintained by someone you will never contact, on a release schedule you cannot influence. The practical defences are a lockfile with hashes, automated dependency PRs so upgrades are small, and refusing to add a package that pulls in fifty of its own to save you eight lines.

### Vendoring

`Craft`

Copying third-party source directly into your repo instead of installing it from a registry.

> Done when you need to patch a library or depend on something unpublished. The cost is that upstream fixes no longer reach you automatically.

Prefer a recorded patch over a copy: patch-package and poetry's patch support keep a diff in the repo instead of a fork, so upgrading tells you loudly when the patch no longer applies rather than silently keeping your stale version. If you must vendor, record the upstream URL and commit SHA in a header comment — the failure mode is not the copy, it is that in eighteen months nobody can tell what was changed or why.

### Virtual environment *(aka .venv)*

`Craft`

An isolated Python installation per project, so two projects can use different versions of the same library.

> Always gitignored. If you ever commit .venv, your repo becomes hundreds of megabytes of machine-specific binaries.

Activation is nothing magical — it prepends the venv's bin/ to PATH so python and pip resolve there first. That is why a cron job or a systemd unit that does not activate anything runs the system interpreter and fails with ImportError; the fix is to invoke the absolute path /srv/app/.venv/bin/python directly, which needs no activation at all. Inside a container the isolation is already provided by the image, so many teams skip the venv there deliberately.

### Makefile

`Craft`

A file of named command shortcuts — make test, make run, make lint.

> The cheapest onboarding document there is. If a new hire has to read your CI config to learn how to run tests, write a Makefile.

Its real value is that CI and humans run the identical command, so 'passes locally, fails in CI' stops being a mystery about invocation. Two gotchas: recipe lines must be indented with a literal tab, and each line runs in its own shell, so cd only lasts one line. Declare non-file targets with .PHONY, or a directory named test will make make decide there is nothing to do.

### Layered structure *(aka controllers → services → repositories → models)*

`Application`

Organising code so each layer only talks to the one beside it: routes validate, services decide, repositories fetch, models describe.

> The rule that makes it work is 'thin routes': a controller should read like a table of contents, never like the actual logic.

The direction of dependency is the whole point: the service layer must not know it is being called over HTTP, which is what lets the same function serve a REST route, a queue consumer, and a CLI command. Concretely, no Request object and no HTTPException below the controller — services raise domain errors and the controller maps them to status codes. The moment a repository imports anything web-shaped, the layering has become decoration.

### Repository pattern

`Data`

A layer that hides database access behind intention-revealing methods like find_by_email().

> Pays for itself the first time you mock the database in a test or swap the storage engine without touching business logic.

Keep the abstraction honest about laziness: returning an ORM query object rather than a materialised list leaks the session out of the repository, and the query then runs somewhere that has no idea it is touching a database — often inside a loop. Return concrete lists or domain objects. Be pragmatic about the swap-the-database promise too; it rarely happens, and testability plus one place to add caching or query logging is enough justification on its own.

### Schema vs model *(aka DTO)*

`Application`

A model maps to a database table. A schema defines what the API accepts and returns.

> Keeping them separate is deliberate — it stops internal columns like password_hash leaking into a response by accident.

You usually want three, not two: a create schema, an update schema where every field is optional, and a read schema that is the only thing ever serialised outward. Whitelisting beats blacklisting — a response model that lists the fields it emits cannot leak a column added next quarter, whereas an exclude list silently can. This split is also what makes API versioning possible: v1 and v2 schemas can differ while the table stays one shape.

### Feature-first vs type-first

`Craft`

Grouping files by what they do (auth/, billing/) versus by what they are (components/, services/).

> Type-first is fine until the project is large. Feature-first scales because a change usually touches one folder.

The measurable test is how many folders a typical pull request touches — if adding one field means editing five sibling directories, your layout is fighting your changes. Feature-first also gives you a natural place for the boring stuff a feature owns (its migrations, its fixtures, its tests) and a seam to extract a service along later. The cost is discipline about shared code: without a clear common/ or core/, features start importing each other sideways and you get a distributed monolith in a single repo.

### Absolute vs relative path

`Machine`

Absolute starts at the filesystem root (/home/app/src/main.py). Relative starts from where you are (./utils, ../config).

> './' means this folder, '../' means go up one. Path bugs are almost always about which directory the process was started from.

A relative path resolves against the process's current working directory, not the file that contains the string — which is why open('data/seed.json') works from the repo root and breaks under a systemd unit or a container with a different WORKDIR. Build paths from the module's own location instead: Path(__file__).parent / 'data' / 'seed.json' in Python, import.meta.url in ESM. Anything user-supplied must additionally be resolved and checked to still sit inside the intended directory, or ../../etc/passwd becomes a feature.

### Dotfile

`Machine`

A file whose name begins with a dot — .env, .gitignore, .eslintrc — hidden by default on Unix systems.

> ls -a shows them. Most of a project's real configuration hides here.

Hidden is a shell and file-manager convention, not a permission — a dot buys you exactly zero security, which is why .env belongs in .gitignore and out of any Docker build context. The corollary bites in deployment: cp -r src/. and glob patterns like * skip dotfiles, so config quietly fails to copy and the app starts with defaults. Ship a committed .env.example listing every key with dummy values, so a missing variable is a diff rather than a runtime surprise.

### README

`Craft`

The front door of a repository: what this is, how to run it, how to test it.

> Judge it by one question — can a new engineer get the project running from this file alone?

Order it by what a stranger needs first: one sentence on what the thing is, then the exact commands to run it, then how to run the tests, then architecture. Every command in it should be copy-pasteable and actually run — a README with a stale command is worse than none, because it costs a reader twenty minutes before they distrust it. The cheapest way to keep it true is to have CI run the same commands the README lists.

<a id="async"></a>

## Workers, queues & scheduling

*Work that outlives a request*

Everything here follows from one problem: some work takes longer than a user will wait. Write the job down, answer immediately, let another process do it.

### Synchronous request

`Edge`

The default web model: a request arrives, the work happens, the response goes back while the client waits.

> Fine under a second. Beyond that, browsers time out and each slow request occupies a process that could serve someone else.

The hidden cost is concurrency, not latency: with a pool of 4 workers × 2 threads, eight simultaneous 10-second requests mean the ninth caller waits behind them even though the CPU is idle. Little's Law makes it concrete — required concurrency equals arrival rate times service time, so 20 requests/second at 400ms needs 8 slots minimum, before any headroom. Every layer in front has its own patience too: an ALB idle timeout of 60s and an nginx proxy_read_timeout of 60s will cut the connection long before your handler returns.

### Worker

`Application`

A long-running background process that pulls jobs off a queue and executes them. Same codebase as the API, different entry point.

> Workers scale independently of the API. That independence is the entire reason the pattern exists.

Deploy them as a separate process type with their own replica count, memory limit and alerting — a worker doing PDF rendering wants 2GB and no request timeout, while the API wants 256MB and a strict one. Concurrency inside a worker is a second dial: prefork processes for CPU-bound work, threads or gevent for I/O-bound, and getting that choice wrong shows up as either idle CPU or memory that scales with concurrency. Scale on queue depth or oldest-message age, never on worker CPU, which is flat while a queue backs up.

### Queue *(aka message broker)*

`Data`

The mailbox between producer and consumer. The API writes a message; a worker reads it later.

> Redis, RabbitMQ, SQS, Kafka. It buffers spikes, survives crashes, and decouples who asks from who does.

The families differ in what happens after a message is read. A log (Kafka, Kinesis) keeps messages for a retention window and tracks a per-consumer offset, so you can replay yesterday; a broker (SQS, RabbitMQ, Redis) deletes on acknowledgement, so a bug that consumed and dropped a message is unrecoverable. Redis as a broker is fast and loses data on failover unless configured otherwise, which is fine for thumbnail jobs and not for payments. Ordering is per-partition or per-FIFO-group, never global — if two messages must be processed in order, they must share a key.

### Producer / consumer

`Application`

Producers put messages on a queue. Consumers take them off. Neither knows the other exists.

> This anonymity is the point — you can add consumers, replace them, or take them offline without touching the producer.

What they do share is the message format, and that is now a contract with no compiler behind it. Version the payload from day one, add fields rather than renaming them, and deploy consumers that understand the new shape before producers that emit it — during a rolling deploy both versions are live simultaneously. A schema registry (Avro, Protobuf) turns that discipline into an enforced check; a bare JSON dict turns it into an incident the week someone renames user_id to userId.

### Enqueue

`Application`

Serialising a job's name and arguments and pushing it onto the queue. Takes milliseconds.

> task.delay(user_id) does not run the task. Confusing enqueue with execute is the classic first-week mistake.

Enqueueing inside a database transaction is the subtle version of the same confusion: the worker can pick the job up and query for a row the transaction has not committed yet, so the task fails on a record that certainly exists. Either enqueue after commit (an after_commit hook) or use the transactional outbox — write the message to a table in the same transaction and let a relay publish it. The reverse ordering fails too: commit first, crash before enqueue, and the job is lost with no trace.

### Task *(aka job)*

`Application`

A unit of background work: a function plus the arguments it was called with.

> Keep tasks thin — pull out arguments, call a service, return. Logic in services stays testable without a running broker.

Arguments must survive serialisation, which quietly rules out objects, database sessions, file handles and anything with a __dict__ full of surprises. Give every task an explicit time limit — a soft limit that raises inside the job so it can clean up, and a hard one that kills it — because the default in most frameworks is no limit at all, and one hung task holds a slot forever. Name tasks by module path and never rename them casually: messages already sitting in the queue reference the old name and will fail to route.

### Scheduler *(aka Celery Beat, cron)*

`Infrastructure`

A process that enqueues jobs because of time rather than because a user acted.

> It does almost nothing itself: wakes, checks the schedule, drops a message, sleeps. Workers still do the work.

It needs durable state to answer 'did I already fire the 2am run?' after a restart — Beat keeps a schedule file, Kubernetes CronJob keeps last-schedule-time in the API server. Missed windows are a policy decision: if the scheduler was down from 01:55 to 02:10, do you run late or skip? Kubernetes exposes startingDeadlineSeconds for exactly this, and the default of catching up can fire a burst of skipped runs at once. Timezone is the other trap — most schedulers default to UTC, so a 09:00 job drifts an hour twice a year relative to your users.

### Run exactly one scheduler

`Infrastructure`

The rule that only a single scheduler instance may be active, enforced by leader election or a distributed lock.

> Bundle the scheduler into an API you scale to three replicas and every user gets three copies of the weekly email. Extremely common, extremely embarrassing.

Two enforcement styles: a single-replica Deployment, which is simple and has a gap while the pod reschedules, or leader election over a lock with a TTL, which survives node loss but requires the loser to actually stop. Even with a lock, duplicates are possible — a paused holder can wake after its TTL expired believing it still leads — so the jobs themselves should be idempotent on a period key like 'weekly-digest-2026-W32'. That key, unique-indexed in a table, is the belt to the lock's braces.

### Cron expression

`Infrastructure`

Five fields — minute, hour, day-of-month, month, day-of-week — describing a recurring time.

> 0 2 * * * is 2am daily. */5 * * * * is every five minutes. 0 9 * * 1 is 9am Monday. Verify with a cron parser, never by eye.

Day-of-month and day-of-week are OR'd, not AND'd, when both are set: 0 0 13 * 5 runs every 13th and every Friday, not only Friday the 13th. Ranges that do not divide evenly wrap badly — */7 in the minutes field fires at 0,7,…,56 and then again at 0, a four-minute gap you did not ask for. Never schedule anything meaningful at 02:30 local time; on the spring DST transition that hour does not exist, and in autumn it happens twice.

### Priority queue

`Data`

Separate queues by urgency — critical, default, low — with workers assigned to each.

> Without this, a nightly batch of 50,000 analytics jobs delays every password-reset email behind it.

Prefer dedicated worker pools per queue over one pool consuming several, because a shared pool with a strict priority order starves the low queue completely under sustained load, and weighted consumption is fiddly to tune. Partition by latency requirement rather than by importance — everything feels important, but only some things have a human waiting. Watch oldest-message-age per queue separately; an aggregate depth metric hides a low-priority queue that has not drained in three days.

### Backpressure

`Infrastructure`

The signal that work is arriving faster than it can be processed, visible as growing queue depth.

> Queue depth is the single best health metric for an async system. If it rises and never drains, you are under-provisioned.

Depth alone is ambiguous — 10,000 messages is fine at 5,000/second and a disaster at 5/second — so alert on age of the oldest message, which is directly in user-visible units. Derive drain time as depth divided by (throughput minus arrival rate); when that denominator goes negative, no amount of waiting helps and you must either add consumers or shed load. Real backpressure means the producer feels it: a bounded queue that rejects with 429 protects the system, while an unbounded one just relocates the failure to memory.

### Idempotency

`Application`

The property of an operation that produces the same result whether it runs once or many times.

> Non-negotiable for background work. A worker can crash after charging a card and before recording it, and the retry will charge again unless you designed for this.

Implement it with a uniqueness constraint rather than a check-then-act, which is just a race with better manners: INSERT the operation key and let the database reject the duplicate. Natural idempotency is better still — SET status = 'paid' is safe to repeat, balance = balance + 10 is not, so prefer absolute writes over increments. For external calls you cannot make idempotent, record intent before acting and reconcile after: a row saying 'about to charge, key abc123' is what lets a retry ask the provider what happened instead of guessing.

### Exponential backoff

`Application`

Waiting progressively longer between retries — 1s, 2s, 4s, 8s — instead of retrying immediately.

> Retrying instantly against a struggling service is indistinguishable from attacking it.

Cap the delay (typically 30–60s) and cap total attempts, or a doubling sequence reaches hours and the job outlives its own relevance. Only retry what can succeed later: timeouts, 429, 502/503/504 and connection resets yes; 400 and 422 never, because the payload will still be wrong in eight seconds. Honour Retry-After when the server sends one — it knows more than your formula does — and remember that backoff protects the callee, while a circuit breaker is what protects the caller from waiting through all of it.

### Jitter

`Application`

Random variation added to backoff delays so retrying clients do not synchronise.

> Without jitter, ten thousand clients that failed together retry together, forever, in waves.

Full jitter — sleep a random value between 0 and the current backoff ceiling — beats adding a small random offset, because the latter keeps the herd's shape and merely blurs its edges. The same reasoning applies well beyond retries: stagger cache TTLs, health-check intervals and cron minutes across instances, or you have built a synchronised load spike on purpose. Anything where every client uses the identical constant is a thundering herd waiting for a trigger.

### Dead letter queue *(aka DLQ)*

`Data`

A holding queue for messages that failed repeatedly and will never succeed.

> Its purpose is containment. Its failure mode is that nobody ever looks at it — alert on DLQ depth.

Alert on any message arriving, not on a depth threshold: one poisoned payment message matters, and a threshold of 100 means you learn about it on the hundredth. Store enough to act — the original body, the failure reason, the stack trace, the attempt count — because a DLQ holding bare payloads tells you what failed and never why. Redriving needs a plan too: replay after the fix is deployed, in small batches, and be certain the consumer is idempotent, since some of those messages did partially succeed.

### Poison message

`Data`

A malformed job that crashes any worker consuming it, gets retried, and crashes the next one.

> One bad message can halt an entire pipeline. Retry limits plus a DLQ are the standard defence.

It is worst in ordered systems: a Kafka partition cannot advance past a message the consumer refuses to commit, so one bad record blocks every later record for that key. Distinguish the two shapes — a payload your parser rejects (deserialise defensively and DLQ immediately, no retries, it will never parse) from one that triggers a code path bug (retry-limit it, since a fix may make it succeed). Validating at the edge of the consumer, before any business logic, is what keeps the second category small.

### Fan-out

`Application`

One job spawning many smaller jobs — 'email all users' becoming 10,000 individually retryable tasks.

> Far better than one enormous job: failure is isolated to a single recipient rather than restarting everything.

The fan-out job itself must be careful: loading 10 million ids into memory to enqueue them is its own outage, so page through with a keyset cursor and enqueue in chunks. Downstream capacity is the other half — 10,000 jobs hitting a third-party API at 100 requests/second means you have built a self-inflicted rate-limit breach, so throttle at the worker or spread with a per-job delay. If you need to know when all of it finished, you need an explicit counter or a chord/callback primitive; queues do not tell you that on their own.

### Pass IDs, not objects

`Application`

Sending user_id=42 to a task rather than a serialised user object.

> Arguments sit in a queue and go stale. Fetch fresh data inside the task or you will act on a snapshot from ten minutes ago.

Two other reasons reinforce it: a serialised object embeds a schema that a rolling deploy may no longer be able to load, and payload size matters — SQS caps a message at 256KB and brokers slow down long before that. The exception is when the snapshot is the point. An audit event or a price at time of order must carry its values, because re-reading later gives you a different, wrong answer. Deleted rows are the standard gap: a task holding only an id must tolerate the row being gone by the time it runs.

### Visibility timeout

`Data`

How long a claimed message stays hidden from other consumers before returning to the queue.

> Set shorter than your job runtime and the job runs twice concurrently. Set far too long and crashed jobs take an hour to recover.

Size it against your p99 job duration with real headroom, not the average — SQS defaults to 30 seconds, which is under most real jobs. For work with a long tail, extend the timeout mid-flight (SQS ChangeMessageVisibility, Kafka's heartbeat thread) rather than picking a pessimistic constant that delays every genuine crash recovery. The equivalent knob in Kafka is max.poll.interval.ms: exceed it and the broker decides you are dead, rebalances the partition to someone else, and your completed work fails to commit.

### At-least-once vs exactly-once

`Data`

Delivery guarantees. At-least-once may duplicate; exactly-once is expensive and often partially fictional.

> The practical answer is at-least-once delivery plus idempotent consumers. Stop chasing exactly-once at the broker.

The impossibility is in the acknowledgement, not the transport: ack before processing and a crash loses the message (at-most-once), ack after and a crash duplicates it (at-least-once), and no ordering of two independent systems removes the window. Kafka's exactly-once is real but narrow — it covers read-process-write entirely within Kafka via transactions and offsets; the moment your side effect is an email or a Stripe charge, the guarantee stops at the boundary. Effectively-once is the honest goal: duplicates delivered, deduplicated on a key by the consumer.

### Heartbeat

`Infrastructure`

A periodic signal from a long-running job proving it is still alive and progressing.

> Without one, a hung job is indistinguishable from a slow one and nothing ever reclaims it.

Make it prove progress, not liveness — a heartbeat emitted from a background thread keeps reporting healthy while the main loop is deadlocked, which is the most expensive kind of green dashboard. Emit it from the work loop itself, carrying a counter or an offset. The timeout should be a few missed intervals (heartbeat every 10s, declare dead at 30–45s), because a single missed beat is usually a GC pause or a network blip, and a hair-trigger produces reclaim storms under load.

### Chunking long jobs

`Application`

Splitting multi-hour work into checkpointed segments so a retry resumes rather than restarts.

> A four-hour job that dies at hour three and starts over is a job that never finishes.

Persist the cursor in the same transaction as the work it covers, or a crash between the two gives you either repeated or skipped rows. Use a keyset cursor (WHERE id > last_id ORDER BY id LIMIT 1000), not OFFSET, whose cost grows with the offset and whose results shift when rows are inserted underneath you. Sizing the chunk is a trade: small chunks mean more checkpoint overhead and faster recovery, and anything under roughly a minute per chunk usually keeps you inside the visibility timeout comfortably.

### Debounce vs throttle

`Application`

Debounce waits for activity to stop before acting. Throttle acts at most once per interval regardless.

> Search-as-you-type is debounce. Rate-limited API calls are throttle. Mixing them up produces very confusing bugs.

Debounce has an unbounded worst case: continuous input means it never fires, which is why a save-on-type feature needs a max-wait (fire at least every 5s regardless) or the user loses work. Throttle has leading and trailing variants, and the trailing edge is what most people actually want — otherwise the final state after a burst is never applied. Both need a cancel path on unmount or shutdown, or the timer fires into a component or process that no longer exists.

### Daemon

`Infrastructure`

Any process designed to run continuously in the background rather than exit after a task.

> Workers, schedulers and web servers are all daemons. A cron job is not.

The classic Unix double-fork ritual (detach, setsid, redirect stdio) is obsolete in a container: your process should stay in the foreground, log to stdout, and let the supervisor — systemd, Docker, Kubernetes — own restart and log collection. Self-daemonising in a container is how you end up with a PID 1 that exits immediately and an orchestrator that thinks the job succeeded. A long-lived process also means anything you leak accumulates, so cached objects, unclosed sockets and growing in-memory dicts show up as a slow upward slope on a memory graph.

<a id="lifecycle"></a>

## Process lifecycle

*Starting, running, dying*

Programs are born, take signals, and are asked to stop. Deployments are just controlled killing, so how a process dies decides whether users notice.

### Signal

`Infrastructure`

A message the operating system sends a process. SIGTERM asks it to stop; SIGKILL forces it to.

> SIGTERM can be caught and handled. SIGKILL cannot — no cleanup code runs, no connections close.

Signals interrupt whatever the process was doing, so a handler runs in a constrained context — in C only async-signal-safe calls are legal, and in Python the handler runs between bytecodes on the main thread, which is why a signal never interrupts a blocking C extension call. Practical consequences: set a flag and let the main loop act on it rather than doing real work in the handler, and know the useful ones by name — SIGHUP (reload config, by convention), SIGINT (Ctrl-C), SIGQUIT, SIGUSR1/2 for whatever the application defines.

### SIGTERM

`Infrastructure`

The polite shutdown signal. Kubernetes and Docker send it first and give you a grace period.

> Handling it is what makes a deploy invisible. Ignoring it makes every deploy drop in-flight requests.

In Kubernetes the signal and the endpoint removal happen concurrently, not in sequence, so the pod can still receive traffic for a second or two after SIGTERM lands while proxies update. The standard fix is a preStop hook that sleeps 5–15 seconds, or a handler that fails readiness first and only then stops accepting connections. Note that Docker sends the signal only to PID 1, and a second SIGTERM during shutdown usually means an impatient operator — decide whether that escalates to an immediate exit.

### SIGKILL

`Infrastructure`

Immediate, uncatchable termination. Sent after the grace period expires.

> If your worker is mid-job when this lands, the job is lost or retried — which is precisely why idempotency matters.

The kernel reclaims memory, file descriptors and sockets, so nothing leaks at the OS level — what is lost is everything above it: buffered writes not yet fsynced, an open database transaction (rolled back on connection close, eventually), an in-memory queue of pending metrics. Design so that a SIGKILL at any instant is survivable, since that is exactly what an OOM kill or a node failure gives you with no warning at all. If you see repeated 137s, the grace period is too short or the shutdown handler is blocking on something.

### Graceful shutdown

`Infrastructure`

On SIGTERM: stop accepting new work, finish what is in flight, close resources, then exit cleanly.

> The most under-implemented feature in backend engineering, and the one users notice most when it is missing.

The order matters and is worth writing down: fail readiness → stop accepting new connections or stop polling the queue → wait for in-flight work with a timeout shorter than the grace period → flush logs, metrics and traces → close pools → exit 0. Each step needs its own deadline, because an unbounded wait for a stuck request converts a graceful shutdown into a SIGKILL anyway. For workers the equivalent is warm shutdown: finish the current message, do not claim another, and let the broker keep anything unacked.

### Draining

`Edge`

The phase where a load balancer stops sending new traffic to an instance while existing requests complete.

> Must begin before SIGTERM arrives, otherwise there is a window where requests route to a dying process.

Drain time must exceed your longest normal request plus the health-check detection window — with a check every 10s and a threshold of 2 failures, the balancer needs 20 seconds just to notice. Long-lived connections are the hard case: WebSockets and streaming responses will not finish on their own, so they need an application-level 'reconnect now' message, and HTTP keep-alive connections should be closed with a Connection: close on the way out. Deregistration delay is the AWS name for this dial; the default of 300 seconds is often far more than you need and slows every deploy.

### Grace period

`Infrastructure`

The time between SIGTERM and SIGKILL. Thirty seconds by default in Kubernetes.

> If your longest request takes 45 seconds, the default is already truncating it. Tune it deliberately.

The budget is shared: terminationGracePeriodSeconds covers the preStop hook and the shutdown handler together, so a 15-second sleep leaves 15 seconds of the default 30 for actual draining. Set it from your p99 plus the drain delay, and set the application's own in-flight timeout slightly lower so you always exit on your own terms. Batch workers may legitimately need minutes — but a very long grace period also means a very slow rollout and a very slow node drain, so it is a real trade, not a free safety margin.

### Exit code

`Infrastructure`

The number a process returns on exit. Zero means success; anything else means failure.

> 137 is SIGKILL (128+9) and usually means out-of-memory. 143 is SIGTERM. Reading exit codes shortcuts hours of guessing.

Anything above 128 is 128 plus the signal number, so 139 is SIGSEGV (11) and 134 is SIGABRT (6) — a segfault and an assertion failure respectively, which are very different investigations. Ordinary codes are conventions: 1 is generic failure, 2 is usually a usage error, 126 means found but not executable, 127 means command not found (nearly always a PATH or typo problem inside a container). In a shell pipeline $? gives you only the last command's code; set -o pipefail is what makes the middle of a pipe able to fail the script.

### OOM kill

`Infrastructure`

The kernel terminating a process that exceeded its memory limit, with no warning and no cleanup.

> Shows up as a container that restarts under load with exit code 137 and suspiciously empty logs.

Inside a container the cgroup limit is what binds, and the process cannot see it — Python and the JVM historically read the host's total memory and size their heaps for a machine they do not have. Check dmesg or kubectl describe pod for the OOMKilled reason rather than inferring from the code. The usual causes are unbounded in-memory accumulation (reading a whole file, a query with no LIMIT, an unbounded cache), fragmentation in long-lived processes, and forgetting that each prefork worker holds its own copy, so limit divided by worker count is the real per-worker budget.

### PID 1

`Infrastructure`

The first process in a container, responsible for forwarding signals and reaping dead children.

> A shell script as PID 1 often swallows SIGTERM entirely. Use exec, or an init like tini.

PID 1 is special in two ways: the kernel does not apply default signal actions to it, so a process with no SIGTERM handler simply ignores the signal, and it inherits every orphan and must reap them. Shell-form CMD in a Dockerfile (CMD python app.py) runs under /bin/sh -c and puts the shell at PID 1; exec-form (CMD with a JSON array) or exec in an entrypoint script puts your process there instead. Use --init or tini when your process legitimately spawns children it does not wait on.

### Zombie process

`Machine`

A finished process whose exit status was never collected by its parent, so its entry lingers.

> Harmless individually, fatal in bulk — they consume process table slots until nothing new can start.

A zombie holds no memory and no descriptors — only a PID and an exit status waiting to be read — which is why they are invisible on a memory graph and only surface as fork failures once you hit the PID limit. ps shows them as state Z or <defunct>. You cannot kill a zombie, it is already dead; you fix the parent, which must call wait()/waitpid() or ignore SIGCHLD explicitly. In containers this is nearly always the missing-init problem, and if the parent dies the zombies are reparented to PID 1 and reaped there.

### Orphan process

`Machine`

A child process whose parent died, leaving it adopted by PID 1.

> In containers without a real init, orphans accumulate and nothing reaps them.

Orphans are alive and still consuming resources, which is the difference from zombies and why they matter more: a subprocess started with Popen and never waited on keeps running after your worker exits, holding a port or a lock. Kill process groups rather than single PIDs (kill -TERM -<pgid>, or start with start_new_session=True so you have a group to target). In Kubernetes the container's PID namespace usually cleans this up on pod termination, but a supervisor pattern inside one container does not get that for free.

### Liveness probe

`Infrastructure`

A health check asking 'are you alive?' — failure triggers a restart.

> Make it cheap and dependency-free. A liveness probe that checks the database will restart every pod during a database blip.

It should answer one question: is this process so broken that only a restart can fix it — deadlocked event loop, wedged thread pool. A static 200 from a handler on the same loop as your traffic already proves more than it looks like, since a blocked loop cannot answer it. Give it a generous failureThreshold and a real initialDelaySeconds or startupProbe, because a slow-booting app restarted mid-boot is an infinite loop that looks like a crash. If a restart would not help, it does not belong in liveness.

### Readiness probe

`Infrastructure`

A check asking 'can you serve traffic right now?' — failure removes you from the load balancer without restarting.

> This is the one that should check dependencies. Confusing the two probes causes restart storms.

Check only dependencies you cannot serve any request without, and check them cheaply — SELECT 1 against a pool, not a real query, and never a fan-out to five downstream services, which turns one partner's outage into your own total unavailability. If every replica fails readiness at once you have taken yourself offline more effectively than the underlying fault would have. Readiness is also the correct switch to flip first in graceful shutdown, and the correct way to hold traffic while a cache warms.

### Restart policy *(aka CrashLoopBackOff)*

`Infrastructure`

Rules for what happens when a process exits — always restart, restart on failure, never.

> CrashLoopBackOff means it keeps dying on startup. Read the logs from the previous container, not the current one.

The backoff doubles from 10s to a 5-minute ceiling, which is why a bad deploy looks fast for the first minute and then appears to stall — and why kubectl logs --previous (or the crashed container's logs) is the only place the actual traceback lives. Distinguish the shapes: instant crashes are almost always config or a missing environment variable; crashes a few minutes in are usually OOM; crashes exactly at the probe interval mean a probe is killing a healthy process. Batch jobs want restart: on-failure with a backoff limit, not always, or a permanently broken job retries forever.

### Cold start

`Infrastructure`

The latency of a process that must initialise before serving its first request.

> The defining tax of serverless, and the reason a 'scale to zero' setup can feel slow to real users.

It has layers: container pull and start, runtime boot, your imports, then connection pools and any model or cache warm-up — and imports are usually the surprise, since one heavy library at module scope can cost hundreds of milliseconds on every cold path. The mitigations are provisioned concurrency, keeping a minimum replica count above zero, lazy-importing what the request may not need, and shrinking the image. It is a tail-latency problem, not an average one: p50 looks fine while p99 carries the whole cost, which is exactly the percentile users complain about.

<a id="concurrency"></a>

## Concurrency

*More than one thing at once*

The difference between interleaving work and truly doing it in parallel, and the specific ways shared state betrays you.

### Process vs thread

`Machine`

A process owns its memory. Threads live inside a process and share its memory.

> Sharing is why threads are fast and why they are dangerous. Processes are isolated and expensive.

Numbers make the trade concrete: a thread costs roughly 8MB of reserved stack and microseconds to create; a process costs a full address space and milliseconds, though fork's copy-on-write means the memory is shared until written. Isolation is the real dividing line — one thread segfaulting takes the whole process down, while one crashed worker process is just a restart. That is why prefork servers (Gunicorn, Unicorn) dominate for user-facing code: a memory leak or a crash is contained and recycled with max-requests.

### Concurrency vs parallelism

`Machine`

Concurrency is dealing with many things by interleaving. Parallelism is doing many things simultaneously on multiple cores.

> One barista alternating between orders is concurrent. Two baristas are parallel. Most web workloads only need the first.

Pick by where the time goes: if a request spends 95% of its 200ms waiting on the database and an API, concurrency alone gets you enormous throughput on one core, and adding cores changes almost nothing. Amdahl's law is the ceiling on the other side — a workload that is 10% serial can never go more than 10× faster no matter how many cores you buy. Measure first, because 'make it parallel' applied to an I/O-bound service adds coordination cost and complexity to fix a bottleneck that was never CPU.

### GIL *(aka Global Interpreter Lock)*

`Machine`

CPython's lock permitting only one thread to execute Python bytecode at a time.

> Threads still help for I/O waiting. For CPU-bound work you need processes — multiprocessing, or a different language.

The lock is released around blocking I/O and inside C extensions that opt in, which is why NumPy, Pillow and database drivers can genuinely use multiple cores from threads while pure-Python loops cannot. CPU-bound Python threads are worse than useless: they add lock contention and context switching for zero throughput. The escape hatches are multiprocessing, a native extension, or Python 3.13's optional free-threaded build — still experimental, and the ecosystem's C extensions are the long pole.

### Blocking call

`Application`

Code that sits idle waiting for I/O — a network response, a disk read — occupying its thread the whole time.

> A single blocking call inside an async function freezes the entire event loop and every other request on it.

The tell is that latency degrades for every concurrent request at once, not just the slow endpoint — one 2-second requests.get() in an async handler stalls every other coroutine on that loop for 2 seconds. Beyond obvious I/O, the usual culprits are CPU-heavy work (bcrypt, JSON over a few megabytes, image resizing), synchronous database drivers, and time.sleep. The fix is an async client, or pushing the work off the loop with run_in_executor / asyncio.to_thread. Python's asyncio debug mode will name any callback that ran longer than 100ms.

### Event loop

`Application`

The scheduler inside an async runtime that decides which suspended coroutine resumes next.

> Single-threaded by design. Its throughput depends entirely on nothing hogging it.

Underneath it is epoll or kqueue: the loop asks the kernel which of ten thousand file descriptors are ready, then runs the callbacks for those, forever. Scheduling is cooperative, which means fair only if every coroutine yields — there is no preemption to rescue you from a tight loop. Two operational consequences: loop lag (the delay between when a callback was due and when it ran) is the health metric worth graphing, and running one loop per core via separate processes is how you use the whole machine.

### async / await *(aka coroutine)*

`Application`

Syntax for functions that can suspend at await points, letting one thread serve thousands of waiting connections.

> Async does not make code faster. It makes waiting cheap, which is a different thing.

Sequential awaits are still sequential: three awaited calls of 100ms each take 300ms, and asyncio.gather is what makes them 100ms. A coroutine does nothing until awaited or scheduled as a task, so a forgotten await is a silent no-op with a warning at best. Fire-and-forget needs care too — keep a reference to any created task or it can be garbage-collected mid-flight, and always give concurrent work a timeout and a cancellation path, since cancellation in async code is a real control-flow path that your cleanup must handle.

### Race condition

`Application`

Two operations touching shared state at once, where the outcome depends on timing.

> Reproduces on production and never on your laptop. Suspect one whenever a bug is intermittent.

The classic shape is check-then-act: 'if no user with this email, create one' run twice concurrently creates two users, because the gap between the check and the write is where the other request lives. Fixes in order of preference: a database unique constraint (let the engine arbitrate), an atomic operation such as INSERT … ON CONFLICT, then explicit locking. Load — not correctness of reasoning — is what surfaces these, so reproduce with concurrent requests rather than by reading the code harder.

### Lock / mutex

`Application`

A guard ensuring only one execution path enters a critical section at a time.

> Correct and slow beats fast and wrong, but hold locks for the shortest possible time.

Never do I/O inside a lock: an HTTP call under a mutex serialises every caller behind the slowest network round trip, and turns a p99 blip into a queue. Always acquire with a context manager or try/finally so an exception cannot leave it held, and prefer a timeout on acquisition so a bug surfaces as an error rather than a hang. Know your lock types — a reentrant lock lets the same thread re-acquire (which plain mutexes deadlock on), and a read/write lock lets many readers proceed when writes are rare.

### Deadlock

`Application`

Two processes each holding a lock the other needs. Neither can proceed, forever.

> Prevented by always acquiring locks in the same order everywhere in the codebase.

All four Coffman conditions must hold — mutual exclusion, hold-and-wait, no preemption, circular wait — and consistent lock ordering is simply the cheapest one to break. Databases deadlock the same way and detect it: Postgres aborts one transaction with SQLSTATE 40P01 after deadlock_timeout, so the application must be prepared to retry. Common source: two transactions updating the same set of rows in different orders, fixed by sorting the ids before you update. Symptom to recognise: throughput goes to zero while CPU is idle and nothing times out.

### Distributed lock

`Data`

A lock held in shared storage (usually Redis) so only one instance across many machines acts.

> How you enforce 'exactly one scheduler'. Must have a TTL, or a crashed holder blocks everyone permanently.

SET key value NX PX 30000 acquires it; release must be a Lua script comparing a unique token before deleting, or you will delete a lock someone else acquired after your TTL expired. That is the fundamental flaw: a GC pause or a network partition can leave you believing you hold a lock you lost, so a distributed lock is an optimisation for avoiding duplicate work, not a safety guarantee for correctness. When correctness is required, add a fencing token the resource checks, or make the operation idempotent and stop relying on the lock.

### Atomic operation

`Data`

An operation that completes entirely or not at all, with no observable intermediate state.

> Prefer an atomic database increment over read-modify-write in application code. The database is better at this than you are.

The workhorses are UPDATE … SET n = n + 1 (one statement, one row lock), INSERT … ON CONFLICT DO UPDATE, Redis INCR and SETNX, and compare-and-swap via an optimistic version column — UPDATE … WHERE version = 7, then check that one row was affected. Atomicity is scoped: atomic per row in a database, per key in Redis, and never across two different systems, which is why 'write to Postgres and publish to Kafka' is a distributed-transaction problem that needs an outbox rather than hope.

### Thundering herd

`Data`

A cache entry expires and hundreds of requests simultaneously stampede the database to rebuild it.

> Fixed with a rebuild lock, staggered TTLs, or serving stale data while one request refreshes.

Stale-while-revalidate is usually the best answer: keep serving the expired value and let exactly one request (holding a short lock) recompute, so latency never spikes and the origin sees one query instead of five hundred. Probabilistic early expiry — each reader refreshes with a small chance that grows as the TTL approaches — spreads the work with no lock at all. The same pattern appears without caches: a mass client reconnect after a deploy, or every cron firing on the hour. Jitter your TTLs by ±10% as a default habit.

### Idempotency key

`Edge`

A client-supplied unique identifier letting a server recognise and ignore a duplicate request.

> The standard mechanism for safe payment retries. Stripe made it the industry norm for a reason.

Store the key with the response you returned and replay it byte-for-byte on a repeat, so the client's retry gets the original 201 and resource id rather than a 409 it has to interpret. Scope keys per endpoint and per account, expire them after 24 hours or so, and handle the in-flight case explicitly — a second request arriving while the first is still processing should get 409 Conflict, not a second charge. Hashing the request body against the key catches the client bug where the same key is reused for different payloads.

### Backpressure vs buffering

`Infrastructure`

Backpressure slows the producer. Buffering absorbs the excess in memory.

> Unbounded buffers do not solve overload, they postpone it and convert it into an out-of-memory kill.

A buffer is correct for smoothing bursts and wrong for a sustained rate mismatch — if arrival exceeds service rate on average, no buffer size is enough, it only sets how long until the failure. Bound every queue and decide the policy at the boundary: block the producer (TCP's own window does this), drop oldest, drop newest, or reject with 429. Latency is the hidden cost of a deep buffer: a queue of 10,000 items at 100/second adds 100 seconds of delay to every item, so work completes but nobody wants it any more.

<a id="data"></a>

## Data & state

*Keeping the truth*

Databases are where mistakes become permanent. Transactions, indexes, migrations, and the query patterns that quietly make an API slow.

### Transaction

`Data`

A group of database operations that either all succeed or all roll back together.

> The unit of correctness. If two writes must both happen or neither, they belong in one transaction.

Its boundaries are a design decision, not a detail: too narrow and you lose atomicity, too wide and you hold locks across a slow HTTP call while everyone else queues. Keep external calls, queue publishes and file writes outside — a rollback cannot un-send an email. Long transactions have a second cost in Postgres: they hold back the oldest visible snapshot, so autovacuum cannot reclaim dead rows and the table bloats while the transaction sits open.

### ACID

`Data`

Atomicity, Consistency, Isolation, Durability — the guarantees a relational database makes about transactions.

> The reason Postgres is the boring correct default. Give these up only when you can name what you get back.

Each letter has a price and a dial. Durability is fsync on commit, which is why synchronous_commit = off makes writes dramatically faster and risks the last few hundred milliseconds on a crash. Isolation is the one vendors interpret loosely — 'ACID compliant' usually means read committed, not serializable. Consistency here means your declared constraints hold, which is not the C in CAP; the two words are unrelated despite the acronyms sitting next to each other in every interview.

### Isolation level

`Data`

How much concurrent transactions can see of each other — read committed, repeatable read, serializable.

> Higher isolation means fewer anomalies and more contention. Most defaults are read committed, which permits more weirdness than people assume.

Name the anomalies and the levels stop being abstract: dirty read (seeing uncommitted data), non-repeatable read (the same row changes mid-transaction), phantom read (new rows appear), and write skew, where two transactions each read a valid state and write results that are jointly invalid — the classic 'both on-call doctors sign out simultaneously' bug. Read committed allows all but the first. Serializable prevents them and can abort your transaction with a serialization failure, so any code using it needs a retry loop.

### ORM *(aka Object Relational Mapper)*

`Data`

A library mapping database rows to language objects — SQLAlchemy, Prisma, Hibernate.

> Convenient until it silently generates 400 queries. Learn to read the SQL your ORM emits.

The leaks are all about laziness and identity: a lazily-loaded relationship issues a query the moment you touch it, often inside a template or a loop far from the code that fetched the parent, and the session's identity map means the object you hold may be older than the row. Turn on SQL echo in development, use eager loading (joinedload, selectinload, include) deliberately, and accept that some reports are just SQL. The ORM is for the 90% of CRUD where hand-writing SQL is noise, not for the 10% where the query is the product.

### Migration

`Data`

A versioned, ordered script that changes database schema so every environment stays in sync.

> Write them to be backwards-compatible: deploy code that works with both old and new schema, then migrate, then clean up.

The expand/contract sequence is the whole discipline: add the new nullable column, deploy code writing both, backfill in batches, switch reads, then drop the old column in a later release — five steps because at every moment two versions of your code are running. Know which operations lock: adding a column with a volatile default rewrites the table, and CREATE INDEX takes a write lock unless you say CONCURRENTLY. Always set a short lock_timeout, or a migration waiting behind one long query silently blocks every write to that table.

### Index

`Data`

An auxiliary lookup structure that makes reads on a column fast.

> Missing indexes are the number one cause of slow APIs. Excess indexes slow every write. Both are real costs.

A B-tree index is only usable left-to-right: an index on (tenant_id, created_at) serves a filter on tenant_id and a filter on both, but not one on created_at alone. Wrapping the column in a function (WHERE lower(email) = …) disables it unless you built an expression index to match. Beyond the default B-tree there are GIN for arrays and JSONB, partial indexes for a hot subset (WHERE deleted_at IS NULL), and covering indexes that let the query be answered from the index alone. Check pg_stat_user_indexes for the ones nobody has scanned since the last deploy.

### Query plan *(aka EXPLAIN)*

`Data`

The database's description of how it intends to execute your query.

> 'Seq Scan' on a large table means no index is being used. Learning to read EXPLAIN output is the highest-leverage database skill.

Use EXPLAIN (ANALYZE, BUFFERS) — plain EXPLAIN gives estimates, ANALYZE actually runs it and shows reality. The single most useful comparison is estimated rows versus actual rows: a plan that expected 10 and found 400,000 chose a nested loop that will never finish, and the cause is usually stale statistics or a correlation the planner cannot see. Note that a sequential scan is the correct choice when you are reading most of a table, and remember to multiply node costs by loops when reading inner nodes.

### N+1 query

`Data`

A query pattern that loads a list with one query, then runs one more query for every item in that list.

> Invisible in development with 10 rows, catastrophic in production with 10,000. Fixed by joins or eager loading.

The cost is round trips, not database work — 100 queries at 1ms of network each is 100ms of pure waiting even though every query is instant. Fixes ranked: a join or a second query with WHERE id = ANY(...), eager loading in the ORM, or DataLoader-style batching in GraphQL where the shape of the resolver tree makes it structural. Catch them automatically by asserting a query-count budget in tests, since the bug is invisible to any assertion about correctness.

### Connection pool

`Data`

A managed set of reusable database connections shared across requests.

> Pool exhaustion is a classic outage: every connection held by a slow query, every new request queuing behind it.

Sizing is multiplicative and people forget: 10 pods × 4 workers × a pool of 20 is 800 connections against a Postgres whose max_connections is 100. Each Postgres connection is a process costing several megabytes, so more is not better — a small pool plus PgBouncer in transaction mode usually beats a large one. Always set an acquisition timeout so exhaustion surfaces as a fast error rather than a hang, and never hold a connection across an external API call.

### Optimistic locking

`Data`

Assume no conflict; check a version number on write and retry if it changed underneath you.

> Scales better than locking rows upfront, because the common case takes no lock at all.

Mechanically: UPDATE … SET value = ?, version = version + 1 WHERE id = ? AND version = ?, then check the affected row count — zero means somebody else won and you must re-read and retry. It fits long think-times, like a user editing a form for five minutes, where holding a lock is unthinkable. It converts contention into retries, so it degrades badly on a genuinely hot row: at high conflict rates you spend all your capacity retrying, and pessimistic locking becomes the faster option.

### Pessimistic locking *(aka SELECT FOR UPDATE)*

`Data`

Locking a row when you read it so nobody else can modify it until you finish.

> Correct under heavy contention, but every lock is a queue and every queue is a latency source.

The lock lives until the transaction ends, which is why the transaction must be short and must never contain an HTTP call. Two variants earn their keep: SKIP LOCKED, which turns a table into a work queue by letting each worker grab different unlocked rows, and NOWAIT, which fails immediately instead of queuing. Lock rows in a consistent order (sort by id) or two concurrent multi-row updates will deadlock — and remember FOR UPDATE on a query with no index locks far more than you intended.

### Replication *(aka primary / replica)*

`Data`

Copying writes from a primary database to read-only replicas.

> Spreads read load and provides failover. Introduces lag, which introduces bugs.

Asynchronous replication acknowledges the commit before the replica has it, so a failover can lose the last few transactions; synchronous waits and makes every write as slow as your slowest replica. Monitor lag in bytes and seconds, and know that a long-running query on a replica can either block replay or get cancelled by it, depending on hot_standby_feedback. Failover is the part to rehearse: promoting a replica is easy, and pointing every application at the new primary without split-brain is where the incident actually happens.

### Eventual consistency

`Data`

Replicas converge on the same state, but not instantly.

> Write then immediately read from a replica and you may not see your own change. Read from primary after writes, or design the UI to not care.

The useful vocabulary is session guarantees: read-your-writes (you see your own change), monotonic reads (you never see time go backwards), and consistent prefix. Implement read-your-writes cheaply by pinning a user to the primary for a few seconds after a write, or by passing the write's log position and having the replica wait for it. The nastiest bugs are the ones where consistency is only violated for 50ms — they pass every test and appear in production as 'I saved it and it disappeared'.

### Sharding *(aka horizontal partitioning)*

`Data`

Splitting one logical table across multiple databases by a key such as customer ID.

> The last resort of scaling. Cross-shard joins and rebalancing are genuinely hard. Exhaust every other option first.

The shard key decides everything and cannot practically be changed later: pick one that appears in nearly every query (tenant_id), or every read becomes a scatter-gather across all shards. Hash sharding spreads load but destroys range queries; range sharding keeps them and creates hotspots. Use consistent hashing or a fixed number of logical shards mapped onto physical ones, so adding capacity moves a fraction of the data rather than all of it. Before sharding, try read replicas, partitioning within one database, and archiving cold rows — most 'we need to shard' turns out to be a missing index.

### Normalisation vs denormalisation

`Data`

Storing each fact once and joining, versus duplicating data to avoid joins.

> Normalise until it hurts, denormalise until it works. Duplicated data must have one owner responsible for updating it.

Third normal form is the sane default for transactional systems: one fact, one place, and updates cannot leave two copies disagreeing. Denormalise on evidence, and prefer a mechanism that maintains itself — a materialised view, a counter cache updated in the same transaction, a projection built from events — over a duplicated column that a future developer will forget to write. Analytics is the honest exception: a star schema is denormalised on purpose because the data is immutable once loaded, which removes the update problem entirely.

### Soft delete

`Data`

Marking a row deleted_at rather than removing it.

> Preserves history and enables undo, but every single query must now remember to filter. Forgetting once resurrects deleted data.

Enforce the filter structurally rather than by memory — a view or a default query scope that excludes deleted rows, so the unfiltered version has to be asked for explicitly. Unique constraints are the classic collision: a soft-deleted user still occupies their email address, so you need a partial unique index (WHERE deleted_at IS NULL) or a nulled-out column. And soft delete is not GDPR erasure; when a regulator says delete, they mean the bytes, which usually means a separate hard-delete job.

### Cache

`Data`

Fast temporary storage of expensive results, usually keyed with a TTL.

> Caching is easy. Invalidation — knowing when the copy became wrong — is the actual problem.

Know the patterns by name: cache-aside (read miss → load → populate, the default), read-through, write-through and write-behind. Measure hit rate before and after — a cache below roughly 80% hits often costs more in complexity and extra round trips than it saves. Include a version or schema tag in the key so a deploy that changes the serialised shape cannot deserialise last week's objects, and never cache anything user-specific under a key that omits the user id, which is how one customer sees another's dashboard.

### TTL *(aka time to live)*

`Data`

How long a cached value stays valid before expiring.

> Short TTLs waste the cache; long ones serve stale data. Stagger them so entries do not all expire at once.

Derive it from tolerance for staleness, not from a round number: if the business can live with a 5-minute-old count, a 5-minute TTL turns a per-request query into 12 queries an hour. Add ±10% jitter as a default so a batch populated together does not expire together. Note that Redis eviction is not the same as expiry — under maxmemory with an LRU policy, keys disappear before their TTL, so nothing may assume a key it just wrote still exists.

### Cache invalidation

`Data`

Removing or refreshing a cached value when the underlying truth changes.

> Write-through, write-behind, and event-driven invalidation are the three families. Pick one deliberately rather than mixing them accidentally.

Deleting the key beats updating it: two concurrent writers updating a cached value can interleave and leave the stale one last, whereas a delete makes the next reader re-derive from the source. Key design is what makes invalidation possible — if a single key holds a composed dashboard, any change invalidates all of it, so cache the parts. When you cannot enumerate dependents, versioned namespaces are the escape hatch: bump user:42:v and every key under the old version becomes unreachable and expires on its own.

### Cache stampede

`Data`

Mass simultaneous cache misses overwhelming the origin.

> Same shape as the thundering herd. The fix is a lock on rebuild plus serving stale-while-revalidate.

The worst version is a cold start after a Redis restart or a flush, when every key misses at once and the database receives your entire read traffic with no cache in front of it — which is why a cache your system cannot survive losing is not a cache, it is an undeclared dependency. Defences: warm critical keys on boot, hold a short per-key rebuild lock so one request recomputes while others serve stale, and rate-limit origin fetches so the database sees a survivable trickle rather than a wall.

### Blob storage *(aka object storage, S3)*

`Data`

Storage for large unstructured files, addressed by key rather than queried.

> Never store uploaded files in your database. Store them in object storage and keep the URL in the row.

Uploads and downloads should not pass through your application at all: issue a presigned URL and let the client talk to S3 directly, or a single 200MB upload occupies a worker for its whole duration. Objects are immutable — you replace, never patch — and listing is a paginated scan, not a query, so any lookup you need must live in your database. Lifecycle rules move cold objects to cheaper tiers automatically, and versioning plus a deny-delete policy is what makes the bucket ransomware-resistant.

### Backup vs snapshot

`Data`

A backup is an exportable copy of data. A snapshot is a point-in-time image of a volume.

> An untested backup is a rumour. Restore drills are the only proof.

State the two numbers explicitly: RPO, how much data you can afford to lose (set by backup frequency plus WAL archiving), and RTO, how long a restore takes — a 2TB database that restores in six hours means a six-hour outage, whatever the backup schedule says. Snapshots usually live in the same account and region as the thing they protect, so they survive a disk failure and not a compromised account; a real backup is offsite, versioned and immutable. Point-in-time recovery via continuous WAL shipping is what lets you rewind to the minute before the bad DELETE.

### Data retention

`Data`

Policy for how long data is kept before deletion, often legally mandated.

> GDPR and similar laws make 'we keep everything forever' a liability rather than an asset.

Retention has to be enforced by a job, not by a wiki page, and the job has to reach every copy — the warehouse, the search index, the backups, the logs, the CSV someone exported to a bucket in 2021. Different classes get different clocks: financial records may be legally required for seven years while behavioural logs should expire in 90 days, so one global setting is always wrong. Deleting on schedule is also a performance feature; the fastest query is the one against a table that is not carrying a decade of dead rows.

### PII *(aka personally identifiable information)*

`Data`

Data identifying a specific person — names, emails, addresses, device IDs.

> Know where yours lives before someone asks you to delete it. Never log it.

It spreads further than the obvious columns: an IP address, a device id, a precise timestamp and a free-text support ticket are all PII, and combining three non-identifying fields frequently re-identifies someone. Practical controls are structural — tag PII columns in the schema, redact at the logging formatter so nobody has to remember at each call site, and keep production data out of staging by generating fake data instead of copying and masking. Special categories (health, biometrics, politics) carry stricter rules and belong in a separate, more tightly controlled store.

<a id="api"></a>

## APIs & networking

*Talking between machines*

Protocols, status codes, identity, and the failure handling that separates a demo from a service. Depth here pays back forever.

### REST

`Edge`

An architectural style modelling the API as resources at URLs, manipulated with HTTP verbs.

> Nouns in the path, verbs in the method. /users/42/orders, not /getUserOrders?id=42.

Working with HTTP rather than tunnelling through it is what pays: correct verbs make GET cacheable by every proxy in the path, ETags and If-None-Match make conditional requests cheap, and 404 versus 409 tells a client something without parsing a body. Full REST as Fielding defined it includes hypermedia, which almost nobody implements and which is fine. Be pragmatic where resources do not fit — an action like POST /orders/42/cancel is clearer than contorting the model to avoid a verb.

### GraphQL

`Edge`

A query language where the client specifies exactly which fields it wants in one request.

> Solves over-fetching for complex clients. Trades it for caching difficulty and N+1 problems on the server.

Two operational costs arrive with it. Resolvers execute per field, so nested lists generate the N+1 pattern by construction, and DataLoader-style per-request batching is not optional. And because a client can request an arbitrarily deep, expensive query, a public endpoint needs query depth limits, complexity scoring and persisted queries — otherwise one crafted query is a denial of service. HTTP caching mostly stops working because everything is a POST to one URL, pushing caching into your resolvers.

### gRPC

`Edge`

A binary RPC protocol using Protocol Buffers over HTTP/2.

> Fast and strongly typed, the common choice for service-to-service traffic. Awkward directly from browsers.

The schema is the contract and it evolves by rule: never reuse or renumber a field tag, add new fields as optional, and reserve deleted ones so a future author cannot recycle the number. HTTP/2 multiplexes many calls over one long-lived connection, which is fast and defeats connection-level load balancers — you need an L7 proxy or client-side balancing or all traffic pins to one backend. Streaming in all four combinations is built in, and grpc-web plus a proxy is what makes it reachable from a browser.

### WebSocket

`Edge`

A persistent two-way connection, so the server can push without being asked.

> Stateful, which complicates load balancing and deploys. Use Server-Sent Events if you only need one direction.

Each connection is memory plus a file descriptor held for its lifetime, so 50,000 concurrent clients is a capacity planning exercise, not a detail. Fan-out across instances needs a backplane — Redis pub/sub or similar — because the user you want to notify is connected to a different pod. Send application-level pings, since a dead TCP connection can look alive for minutes, and expect every deploy to disconnect everyone, so the client needs reconnect with backoff and the server needs a way to resend anything missed.

### Idempotent method

`Edge`

GET, PUT and DELETE produce the same state however many times they are called. POST does not.

> Clients retry on timeout without knowing whether the first attempt landed. Design assuming they will.

Idempotent and safe are different properties: GET and HEAD are safe (no state change at all), while DELETE is idempotent but not safe — and the distinction matters because intermediaries feel free to retry safe methods on their own. This is why a GET that mutates is a real bug: a link prefetcher or a crawler will trigger it. When POST is genuinely required, an idempotency key restores retry safety, and it is the standard because timeouts never tell you which side of the write they landed on.

### HTTP status codes

`Edge`

2xx success, 3xx redirect, 4xx caller's fault, 5xx server's fault.

> 401 means not authenticated; 403 means authenticated but not permitted. Returning 200 with an error body defeats every monitoring tool you own.

The class boundary is an operational one: 5xx should page you and 4xx should not, so mapping a validation failure to 500 poisons your error budget with user typos. Learn the specific ones that carry information — 201 with a Location header, 202 for accepted-and-processing-asynchronously, 409 for a state conflict, 422 for a well-formed request that fails business rules, 503 with Retry-After for shedding load. Deliberately returning 404 instead of 403 is a legitimate choice when the existence of a resource is itself confidential.

### 429 Too Many Requests

`Edge`

The rate-limit response, ideally with a Retry-After header telling the client when to return.

> Honouring Retry-After is the difference between a well-behaved client and a denial-of-service source.

Send the whole picture: X-RateLimit-Limit, -Remaining and -Reset let a well-written client slow down before it is refused, which is far cheaper for both sides than a wall of rejections. On your own client side, treat 429 as retryable with backoff but count it against a global budget — retrying a rate limit aggressively is how you stay rate-limited. Note the difference from 503: 429 says you specifically are asking too often, 503 says the service as a whole is out of capacity.

### Authentication vs authorization *(aka authn / authz)*

`Edge`

Authentication proves who you are. Authorization decides what you may do.

> Two separate systems that people merge into one confused middleware and regret later.

Authentication happens once at the edge; authorization has to happen at every resource, because the question 'may this user see this specific record' cannot be answered by a token alone. That is the source of the most common serious API bug — an authenticated user changing an id in the URL and reading somebody else's data (IDOR). Push the tenant or owner check into the query itself (WHERE id = ? AND account_id = ?) rather than a separate if-statement, so forgetting it returns nothing rather than everything.

### JWT *(aka JSON Web Token)*

`Edge`

A signed token carrying claims about the user, verifiable without a database lookup.

> Stateless and fast, but genuinely hard to revoke. Keep expiry short and pair with refresh tokens.

Signed is not encrypted — the payload is base64, readable by anyone holding the token, so never put secrets in it. Validate strictly: pin the expected algorithm rather than trusting the header (the alg: none and RS256-to-HS256 confusions are classics), and check iss, aud and exp, not just the signature. Revocation is the real constraint: 15-minute access tokens with rotating refresh tokens and a small denylist is the standard compromise, because a stateless token you can instantly revoke is just a session with extra steps.

### OAuth2

`Edge`

A delegation protocol letting a user grant an application limited access to their data elsewhere.

> 'Sign in with Google' is OIDC layered on OAuth2. Never implement the flow yourself from scratch.

Authorization code with PKCE is the flow to use for everything with a user, including single-page and mobile apps; the implicit flow is deprecated and client credentials is for machine-to-machine only. The parameters exist for reasons — state prevents CSRF on the callback, PKCE prevents a stolen code being redeemed by another app, and redirect URIs must be exact-matched or you have built an open redirect that leaks codes. Remember the layering: OAuth2 grants access to APIs, OIDC's id_token is the part that says who logged in.

### Session

`Edge`

Server-side state identified by a cookie, revocable at any moment.

> Less fashionable than JWT and often the better choice, particularly for browser-facing apps.

The cookie flags are the security model: HttpOnly (JavaScript cannot read it, so XSS cannot steal it), Secure, and SameSite=Lax or Strict for CSRF. Store sessions in Redis rather than instance memory so any pod can serve any request and sticky sessions stop being necessary. Rotate the session id on login to prevent fixation, keep both an idle timeout and an absolute one, and give the user a way to see and revoke active sessions — the instant revocation JWTs cannot do is the entire reason to prefer this.

### CORS

`Edge`

A browser rule blocking cross-origin requests unless the server explicitly permits them.

> A browser-only mechanism and not a security boundary — curl ignores it entirely. It stops other websites, not attackers.

It protects the user's credentials, not your server: the browser blocks a script on evil.com from reading a response your API returned with the user's cookies attached. Note that the request usually still reaches you and executes — CORS hides the response, so a non-idempotent GET has already run. Never combine Access-Control-Allow-Origin: * with Allow-Credentials: true (browsers refuse it, and reflecting the Origin header to work around it means any site can read authenticated responses). Echo an origin only from an allowlist.

### Preflight request

`Edge`

An automatic OPTIONS request browsers send before certain cross-origin calls.

> The invisible cause of 'it works in Postman but not the browser'.

It fires when the request is not 'simple' — any custom header such as Authorization, a JSON content type, or a method beyond GET/POST/HEAD — and the response must list the allowed methods and headers explicitly, wildcards included. Access-Control-Max-Age caches the answer (browsers cap it around 2 hours, Chrome at 600s) which matters because otherwise every API call becomes two round trips. Preflights must not require authentication: the browser sends OPTIONS without credentials, so auth middleware that rejects it breaks every cross-origin call.

### Webhook

`Edge`

An inversion of polling: the other service calls your endpoint when something happens.

> Always verify the signature, always respond fast and process asynchronously, always expect duplicates.

The correct handler shape is: verify the HMAC over the raw body (not the re-serialised JSON, whose key order will differ), check the timestamp to block replays, enqueue, return 200 in milliseconds. Providers time out at a few seconds and retry with backoff, so slow processing manufactures the duplicates you then have to deduplicate by event id. Also expect out-of-order delivery — 'subscription cancelled' can arrive before 'subscription created' — so treat events as hints and re-fetch authoritative state when it matters.

### Polling vs long polling

`Edge`

Asking repeatedly for updates, versus holding the request open until there is something to say.

> Polling is simple and wasteful. Choose it anyway when volume is low — simplicity has real value.

Do the arithmetic before choosing: 10,000 clients polling every 5 seconds is 2,000 requests per second of mostly-empty responses, which is when the waste stops being theoretical. Cheap improvements first — ETag plus If-None-Match turns most polls into a 304 with no body and no query. Long polling holds a connection per waiting client, so it has the same capacity profile as WebSockets without the protocol; Server-Sent Events is usually the better one-directional answer, since it reconnects automatically and rides ordinary HTTP.

### Rate limiting

`Edge`

Capping how many requests a client may make in a window.

> Token bucket permits bursts; leaky bucket smooths them. Rate limit by user, not just by IP.

Fixed windows have a boundary flaw — a client can send the full quota at 11:59:59 and again at 12:00:00, doubling the intended rate — so use a sliding window or a token bucket. Enforce it in shared storage (a Redis INCR with an expiry, or a Lua script for atomicity) or each instance enforces its own limit and the effective cap multiplies by replica count. Limit different things separately: login attempts per account, expensive endpoints per user, and everything per IP as a coarse backstop, remembering that NAT puts an office behind one address.

### Timeout

`Edge`

The maximum time to wait for a response before giving up.

> Every outbound call needs one. A missing timeout turns one slow dependency into a total outage as threads pile up.

There are several and libraries default them separately: connect, read/socket, and total request time — an HTTP client with only a connect timeout will still hang forever on a server that accepts and never replies. Budget them as a hierarchy: if your endpoint promises 2 seconds, three downstream calls cannot each be allowed 2. Set the caller's timeout above the callee's own, or the callee finishes work nobody is listening for. Deadline propagation (passing remaining time downstream) is what makes this rigorous in a service mesh.

### Circuit breaker

`Edge`

After repeated failures, stop calling a dependency entirely for a cool-down period.

> Protects both sides: you fail fast, they get room to recover instead of being hammered while down.

Three states: closed (normal), open (fail immediately without calling), half-open (let a single trial request through and close again if it succeeds). Trip on an error rate over a rolling window with a minimum request volume, not on a raw count, or a breaker opens on two failures out of three requests at 3am. It must be paired with a fallback — cached data, a default, a degraded response — because a breaker without one only converts a slow failure into a fast one, which is better for the system and identical for the user.

### Retry storm *(aka cascading failure)*

`Infrastructure`

Retries amplifying load on an already-failing service until the whole system collapses.

> This is why retries need backoff, jitter, and a hard cap. Naive retry logic converts a blip into an outage.

Amplification multiplies through layers: 3 retries at each of three tiers is 27 requests for one user action, so a service already at capacity receives an order of magnitude more load precisely when it can least handle it. Retry at one layer only — usually the outermost, closest to the user's intent — and make the others fail fast. A retry budget (cap retries at, say, 10% of total requests) is the systemic control, and load shedding at the receiving end is what stops the collapse when everything upstream still misbehaves.

### Graceful degradation

`Application`

Serving a reduced but useful response when a dependency is unavailable.

> Recommendations down? Show popular items. Partial service beats an error page nearly every time.

It starts with classifying dependencies as critical or optional and writing it down — the database behind checkout is critical, the recommendation service is not, and code should treat them differently rather than uniformly try/except. Make the degradation visible: a stale-data banner or a metric that counts fallback activations, because the real danger is degrading silently for three weeks. Feature flags give you the manual version of the same control, letting you switch off an expensive feature during an incident instead of hoping a breaker does it.

### Pagination

`Edge`

Returning results in pages. Offset-based is simple; cursor-based is stable under concurrent inserts.

> Offset pagination on a live feed shows duplicates and skips items. Use cursors for anything that changes.

OFFSET also degrades: the database must produce and discard every skipped row, so page 5,000 is slow in a way page 1 never suggested. Keyset pagination — WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT 20 — is O(1) per page and needs the tie-breaker column, since timestamps collide. Cursors should be opaque (encode the key, do not expose it), and a total count is expensive enough that most large APIs simply return has_more instead.

### API versioning

`Edge`

Serving multiple contract versions — /v1/, /v2/ — so clients migrate on their own schedule.

> You cannot force mobile clients to update. Once published, an API is a promise.

Most changes should not need a version at all: adding an optional field or a new endpoint is backwards-compatible if clients tolerate unknown fields, which is worth stating in your docs as a contract. Reserve a version bump for removals, renames, type changes and semantic changes — and note that changing the meaning of a field while keeping its name is the breaking change nobody catches. Version in the path for simplicity, keep the number of live versions small, and publish a deprecation date with usage metrics per version so you can prove who is still on v1.

### Contract *(aka OpenAPI, Swagger)*

`Edge`

A machine-readable specification of every endpoint, parameter, and response shape.

> Generates docs, clients, and tests from one source. FastAPI produces it automatically from your schemas.

The choice is spec-first (design the contract, generate server stubs and client SDKs, parallelise front-end and back-end work) or code-first (generate the spec from types, which cannot drift because it is derived). Either beats a hand-written document that lies. The spec is also executable leverage: diff it in CI to detect breaking changes automatically, drive contract tests, and generate typed clients so a renamed field is a compile error in the consumer rather than a null at runtime.

### Load balancer

`Infrastructure`

A component distributing incoming traffic across many instances.

> Also handles TLS termination, health checks, and draining. Prerequisite for horizontal scaling.

Layer 4 forwards TCP and is fast but blind; layer 7 understands HTTP and can route by path, retry idempotent requests and terminate TLS. The algorithm matters more than people expect: round-robin is fine for uniform requests, and least-connections is much better when durations vary, because round-robin will happily hand a new request to the instance already stuck on ten slow ones. Health checks should hit a readiness endpoint, not /, and the deregistration delay is what makes deploys invisible.

### Reverse proxy

`Infrastructure`

A server sitting in front of your application, forwarding requests to it.

> Nginx, Caddy, Envoy. Handles TLS, compression, static files and rate limiting so your app does not have to.

It is also a buffer: nginx reads a slow client's request fully before forwarding, which protects your application workers from Slowloris-style attacks that hold connections open by trickling bytes. Watch three settings — proxy_read_timeout (60s by default and the cause of many mysterious 504s), client_max_body_size (1MB by default, the cause of most 413s on upload), and X-Forwarded-For, which your app must be configured to trust or every client IP in your logs is the proxy's.

### API gateway

`Edge`

A single entry point in front of many services, centralising auth, rate limits and routing.

> Removes duplicated cross-cutting logic from every service. Becomes a bottleneck if you put business logic in it.

It earns its place by doing what every service would otherwise duplicate: token validation, rate limiting, request id injection, and a consistent error shape. The failure mode has a name — the smart pipe — where routing rules accumulate transformations and conditionals until deploying a feature means editing gateway config, and the gateway becomes a shared bottleneck owned by nobody. Keep it dumb, keep the config in version control with the services, and remember services must still authorize internally: a gateway that authenticates does not mean the service can trust any caller.

### DNS

`Infrastructure`

The system translating names into IP addresses.

> It is always DNS. Propagation delay and cached negative lookups explain a suspicious share of 'it works for me'.

Caching happens at several layers you do not control — resolver, OS, and the application runtime, and some HTTP clients and JVMs cache a resolved address for the process's lifetime, so a failover changes the record and your service keeps calling the dead IP. Lower the TTL to 60s days before a planned migration, since the change only takes effect after the old TTL expires. Know the record types you actually use (A, AAAA, CNAME, and why a CNAME cannot sit at the apex), and be aware that negative answers are cached too, so a record created a minute ago can stay NXDOMAIN for a while.

### TLS / HTTPS

`Edge`

Encryption in transit, plus verification that the server is who it claims to be.

> Certificate expiry is an entirely preventable outage that still happens constantly. Automate renewal and alert on it.

The handshake costs a round trip (TLS 1.3) or two (1.2), which is why connection reuse and keep-alive matter more than the cipher choice. Certificates are chains: a browser may accept a server that curl rejects because the browser had the intermediate cached and your server failed to send it, so always serve the full chain. Alert at 30 and 14 days remaining, monitor from outside your network, and remember that internal service-to-service TLS needs the same automation — a self-signed cert that someone made by hand in 2023 is a scheduled outage nobody has scheduled.

### Idempotent retry budget

`Edge`

A cap on what fraction of total traffic may be retries.

> Prevents the system from spending all its capacity retrying itself during a partial failure.

Implement it as a token bucket per client-service pair, refilled from successful requests: retries can consume up to about 10% of the success rate, and when the bucket empties, failures propagate immediately instead of being retried. The property this buys is that retry load scales with success, so a dependency at 0% availability receives zero retry amplification rather than the maximum. It is the client-side complement to load shedding, and Google's SRE book documents it as one of the highest-leverage protections against cascading failure.

<a id="architecture"></a>

## Architecture

*Arranging the pieces*

How systems are divided, how the divisions are justified, and the vocabulary senior engineers use to argue about them.

### Monolith

`Craft`

One deployable application containing all functionality.

> The correct default for most teams. A well-structured monolith beats badly-drawn microservices every time.

What it gives you is enormous and easy to undervalue: refactoring across boundaries with a compiler's help, real transactions across your whole domain, one place to look in a debugger, and no network between components. What it costs is coupled deploys, one shared resource profile, and a test suite whose runtime grows with the company. Notice that most of those costs are addressable — modularise, split the test suite, use feature flags to decouple deploy from release — while the distributed-systems costs of splitting are not.

### Microservices

`Craft`

Many small independently deployable services, each owning its data.

> Trades in-process function calls for network calls that can fail. Buys independent scaling and deploys. Know which you need.

The honest prerequisites are organisational and operational: independent deploy pipelines, distributed tracing, centralised logging, contract tests, and a team per service — Conway's law means the split only holds if the org matches it. The reliability arithmetic is unforgiving too: a request touching five services at 99.9% each is 99.5% overall, so resilience patterns are mandatory rather than nice. If two services must deploy together or share a database, they are one service with extra latency.

### Modular monolith

`Craft`

A single deployable with strictly enforced internal module boundaries.

> Most of the discipline of microservices, none of the distributed-systems tax. Underrated.

Enforcement is the whole trick, and it must be mechanical: an import linter, an architecture test, or a build system that fails when billing imports from inventory's internals rather than its public interface. Give each module its own schema or table prefix and forbid cross-module joins, so extraction later is a mechanical change rather than an archaeology project. The payoff is optionality — you keep in-process calls and one deploy today, and any module that outgrows the process already has a clean seam to leave through.

### Coupling vs cohesion

`Craft`

Coupling is how much modules depend on each other. Cohesion is how related the contents of one module are.

> Aim for low coupling and high cohesion. Nearly every structural argument reduces to this pair.

Coupling comes in flavours with very different costs: temporal (A must run before B), data (both read the same table), and content (A reaches into B's internals) — and a shared database is the highest-cost form because a schema change breaks a service that never imported anything. The empirical proxy for cohesion is co-change: files that always change together belong together, which you can literally mine from git history. Low cohesion is why a util/ package eventually depends on everything and everything depends on it.

### Stateless service

`Application`

A service holding no per-user memory between requests, so any instance can serve any request.

> The precondition for horizontal scaling. Push state into the database, cache, or the token.

The state that sneaks in is rarely a variable named state: an in-memory rate limiter that becomes ten limiters, a local file upload directory, a scheduler timer running in every replica, an in-process cache that makes two users see different answers. Test it by killing a random instance mid-session and confirming nobody notices. Note that stateless does not mean caching is banned — it means the correctness of a request must not depend on which instance served the previous one.

### Horizontal vs vertical scaling

`Infrastructure`

More machines versus a bigger machine.

> Vertical is simpler and has a ceiling. Horizontal is unbounded and requires statelessness.

Vertical scaling is under-rated and often the right first move: a machine with 128 cores and 1TB of RAM costs less than the engineering time to shard, and it usually needs a restart rather than a redesign. Its limits are the ceiling and the single failure domain — one box means one outage. Horizontal adds coordination cost that grows with instance count (connection pools, cache coherence, distributed locks), and the shared database is usually the real ceiling, so adding stateless replicas past a point moves the bottleneck without lifting it.

### Dependency injection

`Application`

Passing a component its dependencies rather than letting it construct them internally.

> The thing that makes testing possible. If a class instantiates its own database client, you cannot test it without a database.

You rarely need a framework — constructor arguments plus one composition root at the entry point covers most applications, and the wiring being explicit is a feature when you are reading unfamiliar code. Frameworks (FastAPI's Depends, Spring, Guice) add scoping, which is where they earn their keep: request-scoped sessions and singleton clients. The design pressure it creates is the real benefit: a constructor with nine dependencies is telling you the class does nine things.

### Inversion of control

`Application`

The framework calls your code rather than your code calling the framework.

> Why you write a route handler and never write the loop that accepts sockets.

The cost is that control flow becomes invisible — you cannot follow a call chain to find out why your handler ran, so you have to know the framework's lifecycle: middleware order, startup and shutdown hooks, and where exceptions are caught. Two practical consequences: an exception thrown in a place the framework does not expect may be swallowed and logged in a format you never see, and initialisation order bugs (using a client before the startup hook created it) present as null rather than as a stack trace at the real cause.

### Single source of truth

`Data`

One authoritative location for each piece of data or configuration.

> Two places that must agree will eventually disagree, silently, at the worst time.

When duplication is genuinely required — a cache, a search index, a read model — make the relationship explicit and one-directional: a derived copy is rebuilt from the source, never edited, and can be thrown away and regenerated at any time. That regenerability is the test. The same applies to configuration: an environment variable and a config file that both set a timeout will disagree eventually, so pick one owner and have the other read from it, ideally with a reconciliation check that alerts on divergence.

### Separation of concerns

`Craft`

Each component handles one aspect of the system and does not reach into others.

> The principle behind layering, and the reason a route handler should never contain SQL.

The practical test is the reason for change: if a function must be edited both when the tax rules change and when the email template changes, it holds two concerns. Cross-cutting concerns — logging, auth, tracing, transactions — are the hard case, since they touch everything by nature; handle them in middleware or decorators so they appear once rather than in every function. Beware of splitting for its own sake: three files that must always be edited together are not separated concerns, they are one concern with extra imports.

### Event-driven architecture

`Application`

Services emit events about what happened; interested services subscribe and react.

> Decouples producers from consumers, at the cost of making end-to-end flow much harder to trace.

Events state facts in the past tense (OrderPlaced) and must not name a recipient — the moment an event says 'send confirmation email', it is a command wearing a costume and the coupling is back. Debugging is genuinely harder: there is no stack trace across a broker, so correlation ids and distributed tracing are prerequisites rather than improvements. Choose the payload deliberately: a thin event with just an id forces every consumer to call back for details, while a fat event is self-contained and immediately stale.

### CQRS

`Data`

Command Query Responsibility Segregation — separate models for writing and for reading.

> Genuinely useful when read and write loads differ wildly. Overkill almost everywhere else.

There is a spectrum, and the cheap end is often enough: separate read and write methods in one class, then separate models over one database, then a fully separate read store updated asynchronously. Only the last introduces eventual consistency, and with it the UI problem where a user saves and immediately does not see their change — which is why teams that adopt it usually end up returning the new state from the command anyway. Justify it with a real asymmetry (1000:1 read/write, or reads needing a shape writes cannot serve), not with tidiness.

### Event sourcing

`Data`

Storing the sequence of events that occurred rather than the current state, deriving state by replay.

> Perfect audit history and time travel. Also schema evolution pain that lasts for years.

Replaying from the beginning stops being viable quickly, so you need snapshots every N events plus projections that materialise queryable views — and rebuilding a projection is a batch job you must be able to run in production. The permanent cost is that events are immutable: a v1 event written three years ago must still be readable by today's code, so you carry upcasters forever. GDPR erasure is the other structural problem, since you cannot delete from an append-only log; the standard answer is crypto-shredding, storing personal data encrypted and destroying the key.

### Saga

`Application`

A sequence of local transactions across services, with compensating actions to undo earlier steps on failure.

> How you get something transaction-shaped when a distributed transaction is not available.

Compensation is not rollback — you cannot un-charge a card, you issue a refund, which is a new visible fact — so the intermediate states must be legal in your domain and in your UI. Two styles: choreography, where each service reacts to events (simple at three steps, unreadable at eight), and orchestration, where a coordinator holds the state machine explicitly and is usually worth the extra component. Every step needs an idempotent compensator, and you must handle the case where the compensator itself fails, which is why a saga needs durable state and a stuck-saga alert.

### Idempotent consumer

`Application`

A message handler safe to invoke repeatedly with the same message.

> The practical alternative to chasing exactly-once delivery. Build this and duplicate messages stop mattering.

Implement with a processed-messages table keyed on the event id, written in the same transaction as the effect — that atomicity is the point, since recording separately reopens the crash window you were closing. Give the table a TTL matched to the broker's maximum retry horizon so it does not grow forever. Where the handler's effect is naturally idempotent (an upsert, an absolute state set), skip the table entirely; where it is an external call, pass an idempotency key derived from the event id and let the provider deduplicate.

### Twelve-Factor App

`Craft`

A set of principles for cloud-native apps: config in the environment, stateless processes, logs to stdout.

> Two decades old and still the fastest way to make an application deployable anywhere.

The factors that still carry the most weight: config in the environment (so one image runs in every environment), logs as an event stream to stdout (so the platform owns collection, not your app), dev/prod parity, and treating backing services as attached resources reachable by URL. Two have aged: strict statelessness is awkward for a stateful service, and secrets in environment variables are now considered weak, since they leak into crash dumps, child processes and /proc — a secrets manager or mounted file is the current practice.

### Bounded context

`Craft`

A boundary within which a term has one precise meaning.

> 'Customer' means something different to billing and to support. Forcing one shared model is how schemas become unusable.

The tell that you have crossed one is a field like status with fourteen possible values, half of which are meaningless to any given consumer — that is two models fused into one. Contexts connect through explicit relationships (shared kernel, customer/supplier, anti-corruption layer), and naming which one you have prevents the accidental version where one team's refactor breaks another. Contexts are also the most defensible line to split services along, because a boundary drawn where the language changes tends to be where change itself stops propagating.

### Anti-corruption layer

`Application`

A translation layer isolating your model from an external system's model.

> Keeps a vendor's strange data shapes from colonising your entire codebase.

Concretely it is one module that owns the vendor SDK, converts their types to yours, maps their error codes to your exceptions, and is the only place their names appear — so migrating from Stripe to Adyen, or absorbing a breaking API change, is a change in one directory. It is also the natural place for retries, the circuit breaker, and the recorded fixtures your tests replay. The cost is a layer of mapping code that feels redundant on day one and saves a quarter of work the first time the vendor changes anything.

### Blast radius

`Infrastructure`

How much of the system a single failure can take down.

> The metric behind bulkheads, cell-based architecture, and not sharing one database between everything.

Reduce it along whichever axis your failures actually travel: by tenant (cells, so one customer's traffic spike cannot affect another's), by region, by dependency (separate pools), and by change (canary and progressive rollout, so a bad deploy meets 1% of traffic first). Shared infrastructure is where it silently grows — one Redis, one cluster, one IAM role, one CI runner — and the question worth asking in design review is simply: if this component is entirely gone for an hour, who notices?

### Bulkhead

`Infrastructure`

Isolating resources so one overloaded component cannot consume the capacity of others.

> Separate thread pools or connection pools per dependency. Named after ship compartments, for the obvious reason.

Without it, one slow dependency consumes the shared pool and every endpoint fails, including the ones that never call it — the failure spreads through a resource, not through a code path. Partition by dependency (a pool of 10 for the payment provider, 5 for search) and accept the lower utilisation as the price of containment. Cap concurrency per dependency rather than only setting timeouts, since a timeout still lets 500 requests pile up for 2 seconds each. The tenant-level version of the same idea is cell-based architecture.

<a id="pipelines"></a>

## Data engineering

*Moving data at volume*

Batch and streaming, warehouses and lakes, and the orchestration tools that run dependency graphs instead of fire-and-forget jobs.

### ETL vs ELT

`Data`

Extract-Transform-Load transforms before storing. Extract-Load-Transform stores raw and transforms in the warehouse.

> ELT won because warehouse compute became cheap and keeping raw data lets you fix transformation bugs retroactively.

The strategic difference is reversibility: with ELT the raw landing zone is immutable, so a transformation bug found in March can be fixed and re-derived over January's data, whereas ETL discarded the input and the wrong numbers are all you have. It also separates ownership cleanly — engineers own extraction and loading, analysts own the SQL transformations in dbt. ETL still wins where the raw data must not land at all (PII you are not permitted to store) or where volume makes loading everything genuinely uneconomic.

### Batch vs streaming

`Data`

Processing accumulated data on a schedule, versus processing each record as it arrives.

> Streaming is not strictly better. Batch is simpler, cheaper, easier to reason about, and enough for most reporting.

Streaming's real cost is not throughput, it is that correctness gets harder: late events, out-of-order arrival, exactly-once semantics and windowing all become your problem, and there is no convenient point at which a dataset is 'complete' to validate against. Batch gets a natural checkpoint every run, trivial reprocessing, and a simple mental model. Micro-batching (a job every 5 minutes) covers most of the gap and is the right answer far more often than either extreme; ask what decision the latency actually enables before paying for seconds.

### DAG *(aka directed acyclic graph)*

`Infrastructure`

A dependency graph of tasks where each runs only after its upstream tasks succeed, with no cycles.

> The core abstraction of Airflow, Dagster and Prefect. Different from a queue: order and dependencies are explicit.

Acyclic is what makes scheduling decidable — a topological sort tells the scheduler what can run now and what runs in parallel. Tasks must be independent processes communicating through storage, not through Python variables, because they may run on different machines; passing data via XCom or its equivalents is for small metadata, not dataframes. The common design error is a DAG with one task doing everything, which throws away the retry granularity and parallelism that were the reason to use an orchestrator.

### Orchestrator

`Infrastructure`

A system that runs DAGs, tracks state, retries failures and backfills history.

> Use one when steps depend on each other. Use a task queue when jobs are independent. Choosing wrong is a common early mistake.

What you are buying is the state store and the UI over it: which run of which task failed, when, with what logs, and a button to re-run from that point over a historical date range. That is the difference from cron, which knows nothing about yesterday. Keep the orchestrator as a scheduler, not a compute engine — tasks should submit work to Spark, dbt or a Kubernetes pod rather than crunching data inside the worker, or the scheduler becomes a single-machine bottleneck and its restarts become data incidents.

### Backfill

`Data`

Re-running a pipeline over historical periods to populate or correct past data.

> The reason pipelines should be parameterised by date and idempotent per partition.

Never let a task read 'now' — the execution date must come in as a parameter, or a backfill of March silently reprocesses today's data. Watch concurrency: backfilling two years of daily partitions at full parallelism will saturate the warehouse and starve production pipelines, so cap it and run off-peak. Late-arriving dimensions are the subtle failure: reprocessing an old day with today's lookup tables produces numbers that never existed, which is why slowly-changing dimensions carry validity ranges.

### Idempotent partition

`Data`

Writing each run's output to a partition it fully owns and can overwrite safely.

> Makes reruns trivial. Appending instead of overwriting is how duplicate rows silently accumulate for months.

The operation you want is atomic replace: write to a temporary location and swap, or use INSERT OVERWRITE / a MERGE keyed on the partition, so a failure mid-write never leaves a half-written partition that downstream jobs will happily read. Match partition granularity to the reprocessing unit — daily partitions mean the smallest correction you can make is one day. Table formats like Iceberg and Delta give you this properly with snapshot isolation and time travel, which is most of why they exist.

### Data warehouse vs lake

`Data`

A warehouse stores structured, modelled data for analytics. A lake stores raw files of any shape.

> Lakehouse formats such as Iceberg and Delta blur the line by adding transactions and schema to files.

The two failure modes are opposite. A warehouse enforces schema on write, so bad data is rejected at the door and every ingestion change is a migration. A lake defers everything to read time, which is flexible until nobody knows what is in it and it becomes a data swamp — the reason a catalogue and ownership metadata are not optional. Lakehouse formats add ACID commits, schema evolution and time travel on top of object storage, and separating storage from compute is what makes them cheap to scale.

### Columnar storage *(aka Parquet)*

`Data`

Storing values column by column rather than row by row.

> Analytical queries touch few columns of many rows, so this is dramatically faster and compresses far better.

Compression is the multiplier: a column holds one type with repeated values, so dictionary and run-length encoding routinely give 5–10× over row storage, and reading 3 of 200 columns reads 3 columns' worth of bytes. Parquet also stores per-row-group min/max statistics, so a query with a predicate can skip entire chunks without decoding them — which is why sorting data by your common filter column before writing dramatically improves scan pruning. The trade is that single-row lookups and updates are terrible, so keep transactional workloads on a row store.

### Schema drift

`Data`

Upstream data changing shape without warning — a renamed field, a changed type.

> The most common cause of pipeline breakage. Validate on ingest rather than discovering it in a dashboard.

The dangerous drift is silent, not loud: a renamed column produces nulls that average into a plausible-looking number, and an integer that becomes a string may coerce quietly. Defend with a contract validated at ingest (Great Expectations, Pandera, a schema registry) that fails loudly and quarantines the batch, plus alerting on the shape of the data — null rate, distinct count, row count — not only on job success. A schema registry with backwards-compatibility enforcement pushes the failure all the way upstream to the producer, which is where it is cheapest.

### Data lineage

`Data`

The traceable path from a number in a report back through every transformation to its source.

> The first question after any surprising metric is 'where did this come from'. Lineage is the answer.

Table-level lineage answers 'what breaks if I drop this table' and is usually derivable automatically from query logs or a dbt manifest; column-level lineage answers 'which upstream field feeds this number' and is what you actually want during an incident. Its two payoffs are impact analysis before a change and root-cause search after one. Keep it generated, never hand-drawn — a lineage diagram maintained manually is out of date the week after it is drawn, and a confidently wrong map is worse than none.

### Data quality check

`Data`

Assertions on data itself — not null, unique, within range, row count within tolerance.

> Tests verify your code. Quality checks verify the world. You need both.

Split them into blocking and warning: a null primary key should stop the pipeline before downstream tables consume it, while a 20% row-count drop should page a human without necessarily halting everything. Freshness is the check people forget and the one that matters most — a pipeline that silently stopped yesterday leaves a dashboard that looks perfectly fine. Anomaly thresholds should be relative to history rather than absolute, and every check needs an owner, because an alerting check nobody owns is muted within a month.

### CDC *(aka change data capture)*

`Data`

Streaming a database's change log to other systems instead of polling for modified rows.

> Near-real-time replication without adding load to the source. Debezium is the common implementation.

Log-based CDC reads the WAL or binlog, so it captures deletes and intermediate states that a polling query on updated_at will always miss — that gap is the main reason to use it. Operationally, the replication slot is the thing to watch: if the consumer stops, Postgres retains WAL indefinitely and the source database's disk fills, taking down production. The initial snapshot before streaming can be heavy, schema changes flow through as events your consumers must handle, and the output is a stream of row-level changes that downstream systems must fold into current state themselves.

### Watermark

`Data`

In stream processing, the point up to which all events are assumed to have arrived.

> Exists because events arrive late and out of order. Deciding how long to wait is a correctness-versus-latency trade.

It is a heuristic, not a guarantee: the watermark advances on a rule (max event time seen minus an allowed lateness), so anything arriving after it is late by definition and needs an explicit policy — drop it, send it to a side output, or re-emit a corrected aggregate. Two failure shapes to know: a stalled watermark, where one idle partition holds the whole job back because its clock never advances, and mobile clients with wrong system clocks producing events timestamped next week that push the watermark forward and mark everything else late.

### Windowing

`Data`

Grouping a stream into finite chunks — tumbling, sliding, or session windows — so aggregates are computable.

> You cannot average an infinite stream. Windows are how streaming borrows batch's ability to finish.

Tumbling windows are fixed and non-overlapping (one hourly bucket per event); sliding windows overlap, so one event lands in several and state cost multiplies by the overlap ratio; session windows are dynamic, closing after a gap of inactivity, which is what you want for user behaviour. Windowing is where memory goes: every open window holds state per key, so a high-cardinality key with long windows is an out-of-memory incident with a schedule. Always window on event time rather than processing time, or a consumer lag spike silently reassigns events to the wrong bucket.

<a id="testing"></a>

## Testing & quality

*Proving it works*

The pyramid, the doubles, and the reason a flaky test is worse than no test at all.

### Unit test

`Craft`

A test of one function or class in isolation, with dependencies replaced by fakes.

> Fast enough to run on every save. If it needs a database, it is not a unit test.

Test behaviour through the public interface, not implementation: a test that asserts a private method was called breaks on every refactor while catching nothing, which is how suites become an obstacle rather than a safety net. Structure each one as arrange/act/assert with a name that states the expectation ('rejects_expired_token'), so a failure report reads as a specification. Aim for milliseconds — a suite you can run on save changes how you work; a two-minute one gets run at the end, by which point you have written the bug.

### Integration test

`Craft`

A test of several real components working together — usually app plus real database.

> Where most genuine bugs actually live. Testcontainers makes these practical.

Use the real dependency, not an in-memory substitute: SQLite standing in for Postgres will not reproduce your JSONB queries, your constraint behaviour or your isolation level, so the test passes and production does not. Isolate runs by wrapping each test in a transaction that rolls back, or by truncating between tests — a shared, accumulating database is the leading cause of tests that pass alone and fail in a suite. Keep one container per session rather than per test, or the fixture cost dominates the runtime.

### End-to-end test *(aka E2E)*

`Craft`

Driving the whole system the way a user would, through the real interface.

> Highest confidence, slowest, flakiest. Keep a handful covering critical paths, not hundreds.

Almost all E2E flakiness is timing: sleep-based waits and CSS-selector coupling. Wait for a condition (an element visible, a request settled) rather than a duration, and select by accessible role or a stable data-testid so a class rename does not break twenty tests. Pick the flows by revenue and risk — signup, checkout, login — and accept that everything else is better covered lower down. Capture a video, a trace and a screenshot on failure, because a red CI run with only a stack trace is nearly unactionable.

### Test pyramid

`Craft`

Many fast unit tests, fewer integration tests, a small number of end-to-end tests.

> Invert it and your suite takes an hour, fails randomly, and everyone stops trusting it.

The economics behind the shape: cost per test and time to diagnose both rise as you go up, while the realism of what is being verified rises too. The 'testing trophy' argument shifts weight toward integration tests, and for a typical web service it is often right — that is where the wiring bugs are. What matters more than the exact ratio is feedback time: a suite over ten minutes stops being run before pushing, and a suite that is not run before pushing is documentation.

### Mock / stub / fake

`Craft`

A mock records how it was called. A stub returns canned answers. A fake is a working lightweight implementation.

> Over-mocking produces tests that verify your code calls the functions you wrote, which proves nothing.

Prefer a fake — an in-memory repository implementing the same interface — because it exercises real behaviour and survives refactoring, whereas a mock encodes today's call sequence into the test. Only mock at genuine boundaries you do not own, and even there prefer recorded fixtures (VCR-style) so the canned response is a real one. The unavoidable risk with any double is drift: your mock returns the shape the vendor had last year, so a contract test against the real thing is what keeps the whole edifice honest.

### Fixture

`Craft`

Reusable setup — a test database, a seeded user, a configured client.

> pytest fixtures with scopes are the cleanest version of this idea in any language.

Scope is the performance dial and the isolation risk in one: session-scoped for expensive immutable things (a container, an app instance), function-scoped for anything a test mutates. Prefer factories with sensible defaults over static seed data — user_factory(plan='pro') states what the test depends on, while a shared fixtures.json means nobody dares change a row. The anti-pattern to watch for is a fixture that sets up more than the test needs, which quietly couples every test to details it never asked about.

### Flaky test

`Craft`

A test that passes and fails without the code changing.

> Worse than no test, because it trains the team to ignore red builds. Fix it or delete it — do not retry it.

The usual causes are enumerable: real time (a test that fails at midnight or month end), test-order dependence through shared state, unawaited async work, network calls, and random data without a fixed seed. Diagnose order-dependence by shuffling the suite deliberately, and time-dependence by freezing the clock. Auto-retry is a trap — it hides the exact race your test just caught in production code. If you cannot fix it today, quarantine it out of the blocking suite with an owner and a date rather than leaving it to erode trust.

### Coverage

`Craft`

The percentage of lines executed while tests run.

> A weak proxy. You can reach 100% with zero assertions. Useful for finding untested files, useless as a target.

Branch coverage is meaningfully stronger than line coverage — a line with an `and` in it can be fully covered with one of its conditions never exercised. Enforcing a global percentage produces assertion-free tests written to satisfy the gate; a diff-coverage check on changed lines only is far more useful and much harder to game. If you want to know whether your tests actually catch anything, mutation testing (mutmut, Stryker) changes the code and checks a test notices, which is the real question coverage is a proxy for.

### Regression

`Craft`

Something that used to work and now does not.

> Every bug fix deserves a test that fails before the fix and passes after. That is how regressions stop recurring.

Write the failing test first and watch it fail — a test written after the fix may be passing for reasons unrelated to the bug, and you will never know. Reproduce at the lowest level that still exhibits the fault: a unit test pinning the off-by-one is worth more than an E2E test of the whole flow. When the same area regresses repeatedly, the test is treating a symptom; the recurrence is telling you the design permits the mistake, which is a refactor, not another assertion.

### Property-based testing

`Craft`

Asserting invariants over generated inputs rather than hand-written examples.

> Hypothesis and fast-check find the empty string, the negative number, and the emoji you never thought of.

The work is naming the invariant: round-tripping (parse(serialise(x)) == x), commutativity, idempotence, or agreement with an obvious slow reference implementation. Shrinking is the feature that makes it practical — the library reduces a 400-character failing input to the two-character minimum that still breaks, handing you the actual cause. It shines on parsers, serialisers, date arithmetic and anything with fiddly boundaries, and libraries can persist the failing seed so a found counterexample becomes a permanent regression test.

### Snapshot test

`Craft`

Recording output and failing when it changes.

> Cheap coverage for rendering. Dangerous when people update snapshots reflexively without reading the diff.

It is a change detector, not a correctness check — it tells you output differs, never that it is right, and the first recording is accepted without anyone verifying it. Keep snapshots small and focused so a diff is readable; a 500-line DOM dump gets approved unread every time. Anything volatile (timestamps, ids, ordering) must be normalised or the test is flaky by construction. They are strongest as a safety net during a refactor that should change nothing, and weakest as your primary assertion.

### Linter / formatter / type checker

`Craft`

Catches likely bugs / rewrites style automatically / verifies types statically.

> ruff, black, mypy in Python. Formatting should never be a code review topic — automate it away.

Adopt them incrementally on an existing codebase or the first run produces a 4,000-file diff nobody can review: format in one isolated commit (and add it to .git-blame-ignore-revs so blame still works), then ratchet the linter and the type checker module by module rather than globally. Run the identical versions locally and in CI, pinned, or you get disagreements that are purely tooling. A pre-commit hook keeps the feedback fast, and CI enforces it for anyone who skipped the hook.

### Static analysis

`Craft`

Inspecting code without running it to find bugs, security issues or dead code.

> Free defect detection in CI. Type hints turn a whole class of runtime errors into build errors.

The families worth running are different tools: type checking, security-focused scanners (Semgrep, Bandit, CodeQL) that look for injection and unsafe patterns, and dead-code or complexity analysis. The economics turn on false positives — a scanner that cries wolf gets ignored within two weeks, so tune the ruleset down to what your team will actually act on and fail the build only on those. Static analysis proves the absence of specific mistakes, never the presence of correct behaviour; it complements tests rather than substituting.

### Test double for time

`Craft`

Injecting a clock so tests control 'now' instead of depending on the real one.

> Tests that fail at midnight, at month end, or in another timezone all come from calling datetime.now() directly.

Make the clock a dependency — pass a callable, or use freezegun / vi.useFakeTimers — so tests can assert what happens at a leap day, at a DST boundary, or when a token expires, without sleeping. The same discipline applies to randomness (inject a seeded generator) and to uuid generation. Store and compute in UTC and convert only at the presentation edge, since almost every timezone bug is a naive datetime that picked up the server's local zone somewhere in the middle.

<a id="delivery"></a>

## Git, CI/CD & delivery

*Getting it to users*

Version control, review, and the strategies for replacing running software without anyone noticing.

### Commit

`Craft`

A recorded snapshot of changes with a message explaining why.

> The message should explain intent, not restate the diff. 'Fix bug' helps nobody in eight months.

A commit is a full tree snapshot addressed by a hash of its content plus its parents, which is why history is tamper-evident and why rewriting one changes every hash after it. Aim for one logical change per commit: it is the unit that revert, cherry-pick and bisect all operate on, so a commit mixing a rename with a bug fix cannot be undone cleanly. Use git add -p to split work you did in one sitting into commits that each make sense, and write the body to answer why, since the diff already answers what.

### Branch

`Craft`

An independent line of development that can be merged back later.

> Short-lived branches merge cleanly. A branch open for three weeks becomes a conflict resolution project.

A branch is a movable pointer to a commit — creating one is writing 40 bytes to a file, which is why branching is free and why deleting a merged branch loses nothing. The cost is not the branch, it is the divergence: conflict probability grows with both time and the number of people touching the same files. Trunk-based development with feature flags is the alternative that keeps integration continuous, and it is the practice that lets teams deploy many times a day without a merge queue full of week-old branches.

### Merge vs rebase

`Craft`

Merge combines two histories with a merge commit. Rebase replays your commits on top of another branch for linear history.

> Rebase your own unshared work freely. Never rebase a branch others have pulled.

Rebase creates new commits with new hashes, so anyone who pulled the old ones now has a divergent history — which is why the rule is about sharing, not about taste. If you must force-push a rebased branch, use --force-with-lease so you cannot overwrite work someone pushed while you were rewriting. Squash-merge gives a clean main and discards intermediate commits, which is a real loss when bisecting a large PR. Whichever the team picks, pick one: mixed strategies produce a history nobody can read.

### Merge conflict

`Craft`

Two branches changed the same lines and git needs a human to decide.

> Not an error. Frequent small merges make them rare and trivial.

Git merges by content within a three-way comparison against the common ancestor, which is why a conflict means two edits to the same region and not simply two edits to the same file. The dangerous case is the semantic conflict that merges cleanly and is still wrong — one branch renames a function, another adds a caller, git is satisfied and the build is not. Resolve with the ancestor visible (merge.conflictStyle = zdiff3), always run the tests after resolving, and enable rerere so you do not re-resolve the same conflict on every rebase.

### Pull request *(aka PR, MR)*

`Craft`

A proposed change, opened for review before merging.

> Small PRs get real review. A 2,000-line PR gets 'LGTM' and a rubber stamp.

There is measured evidence for a ceiling around 200–400 changed lines, beyond which defect detection falls off sharply — reviewer attention, not diligence, is the constraint. Give it a description that says what changed, why, and how you verified it, and stack dependent PRs rather than submitting one enormous change. Separate mechanical changes (a rename, a reformat) into their own PR so the reviewer's attention lands on the ten lines that carry the risk rather than the six hundred that do not.

### Code review

`Craft`

Another engineer reading a change for correctness, clarity and risk before it ships.

> Review the design, not the formatting. Ask questions instead of issuing verdicts.

Its highest-value output is often not the defects found but the knowledge spread — a second person who now understands that subsystem, which is a direct improvement to the bus factor. Label comments by weight ('nit:', 'question:', 'blocking:') so the author knows what must change; unlabelled preferences read as requirements and stall the PR. Latency is the metric that matters most: a review that arrives a day later has forced a context switch that costs more than the review saved.

### Cherry-pick

`Craft`

Applying one specific commit onto another branch.

> How an urgent fix reaches a release branch without dragging along everything else on main.

It creates a new commit with a different hash and the same content, so the change now exists twice in history and a later merge between the branches may conflict with itself. Use -x to record the original SHA in the message, which is what lets someone six months later work out that these two commits are the same fix. Repeatedly cherry-picking between long-lived branches is a signal your branching model is wrong — the sustainable pattern is fix on main, then cherry-pick to the release branch, never the other direction.

### Revert vs reset

`Craft`

Revert creates a new commit undoing an old one. Reset moves the branch pointer and rewrites history.

> Revert on shared branches, always. Reset only on local work nobody has seen.

Know the three resets: --soft moves the pointer and keeps everything staged, --mixed (the default) unstages but keeps your files, --hard discards working-tree changes irrecoverably. Reverting a merge commit needs -m 1 to say which parent is the mainline, and it has a trap — re-merging that branch later will do nothing, because git considers those commits already merged, so you must revert the revert. And almost nothing is truly lost: git reflog keeps unreferenced commits for 90 days by default.

### Bisect

`Craft`

Binary-searching history to find the commit that introduced a bug.

> git bisect finds the culprit in twenty commits with about five tests. Criminally underused.

Ten steps cover a thousand commits, and git bisect run <script> automates the whole thing if you can write a command that exits non-zero on the bug — which turns an afternoon of guessing into a coffee break. Two requirements make it work: every commit must build (a reason to keep main green), and the reproduction must be deterministic, since a flaky check sends the search down the wrong half. Mark unbuildable commits 'skip' rather than guessing, and it is just as effective for finding when a performance regression appeared.

### CI *(aka continuous integration)*

`Craft`

Every push automatically builds, lints and tests the code.

> Its value is proportional to how fast it runs. A twenty-minute pipeline gets circumvented.

Speed comes from caching dependencies keyed on the lockfile hash, parallelising the suite across shards, and running the fast checks (lint, types, unit) before the slow ones so failures return in a minute. A broken main is an emergency for the whole team, since every subsequent push now sees a red build and stops learning anything from it. Keep the pipeline definition in the repo, and make it runnable locally — a CI-only build step is a step nobody can debug.

### CD *(aka continuous deployment)*

`Infrastructure`

Passing builds ship to production automatically without a human gate.

> Requires real tests, fast rollback and feature flags. The payoff is that deploys become unremarkable.

Distinguish delivery from deployment: continuous delivery means every build is releasable and a human presses the button; continuous deployment removes the button. The counter-intuitive result from DORA's research is that frequent small deploys correlate with lower change-failure rates, because each one carries less risk and is easier to attribute. The prerequisites are non-negotiable — automated verification you trust, backwards-compatible migrations, a rollback that takes a minute, and monitoring good enough to notice within one.

### Artifact

`Infrastructure`

The built output that actually gets deployed — a container image, a wheel, a jar.

> Build once, promote the same artifact through environments. Rebuilding per environment means you tested something else.

Address it by immutable digest rather than a tag: :latest and even :v1.2.3 can be repointed, so a rollback may not return the bytes you tested. Configuration therefore has to come from the environment at run time, since the same image must run in staging and production unchanged. Stamp provenance into it — commit SHA, build time, pipeline id — so a running instance can tell you exactly what it is, and keep a retention policy or your registry bill grows forever.

### Container image

`Infrastructure`

A layered, immutable filesystem snapshot containing your app and its dependencies.

> Layers cache: put dependency installation before copying source and rebuilds drop from minutes to seconds.

Layers are stacked and additive, which is why deleting a file in a later layer does not shrink the image and why a secret copied in and removed later is still extractable from history — use build secrets or a multi-stage build instead. Order Dockerfile instructions by rate of change: base, system packages, lockfile, dependency install, then source. Pin the base image by digest, run as a non-root user, and add a .dockerignore, or you will ship .git and node_modules into the build context and wonder why it takes four minutes.

### Multi-stage build

`Infrastructure`

Compiling in a heavy builder image, then copying only the results into a small runtime image.

> Turns a 1.2GB image into 150MB. Smaller images deploy faster and expose less attack surface.

The security gain is as large as the size gain: no compiler, no package manager and no build credentials in the shipped image, so an attacker who lands inside has far fewer tools. Distroless or Alpine as the final stage takes it further — but Alpine uses musl, which can break Python wheels and change DNS behaviour, so measure rather than assume. Name your stages and target them (--target=test) so CI can run the test stage and production can build the runtime stage from the same Dockerfile.

### Rolling deploy

`Infrastructure`

Replacing instances gradually so the service stays up throughout.

> Requires that old and new versions can coexist — which constrains how you change database schemas.

The controls are maxSurge and maxUnavailable: surge adds extra pods before removing old ones (needs spare capacity but never dips below full strength), unavailable allows a temporary reduction. Because both versions serve traffic simultaneously, every change must be backwards-compatible in both directions for the duration — schema, API contract, cache format and queue message shape. Rollback is a second rolling update, so it takes as long as the deploy did, which is the main practical difference from blue-green.

### Blue-green deploy

`Infrastructure`

Two complete environments; deploy to the idle one, then switch traffic.

> Instant rollback by flipping back. Costs double infrastructure during the switch.

The switch is atomic for new connections and not for existing ones, so in-flight requests and open WebSockets still need draining. The database is the part that is not duplicated, which is where the strategy actually bites: green's migrations must leave blue working, or rollback is impossible whatever the traffic layer says. Prefer switching at the load balancer over DNS, since DNS caching means some clients keep hitting blue for the length of the TTL and you never get a clean cutover.

### Canary release

`Infrastructure`

Routing a small percentage of traffic to the new version and watching metrics before proceeding.

> Catches problems that only appear under real traffic. Needs good metrics to be meaningful.

Compare the canary against the baseline on the same signals at the same moment — error rate, p99 latency, saturation — rather than against yesterday, since traffic patterns move. Give it enough volume and enough time to be statistically meaningful: 1% of traffic for 90 seconds proves nothing about an error that occurs once in ten thousand requests. Automate the abort on a threshold breach, because the entire point is catching it before a human notices, and be aware that sticky sessions and caches can leave the canary serving an unrepresentative slice of users.

### Rollback

`Infrastructure`

Returning to the previous known-good version.

> A deploy strategy is only as good as its undo. Practise rollbacks before you need one at 3am.

Measure it in minutes and rehearse it, because during an incident rollback should be the reflex, not a decision requiring analysis — diagnose after service is restored. The database is what makes it hard: a migration that dropped a column cannot be rolled back by redeploying the old image, which is precisely why expand/contract exists and why destructive steps ship in a later release than the code that stopped needing them. Roll forward instead when the previous version has a known worse bug, but that should be a considered exception.

### Feature flag

`Application`

A runtime switch letting you ship code disabled and enable it later without redeploying.

> Decouples deploy from release. Also accumulates into permanent debt unless you delete flags after rollout.

Separate the kinds, because they have different lifetimes: release toggles live weeks and must be deleted, experiment flags run for a defined test, ops kill-switches are permanent by design, and permission flags are really entitlements and belong in your authorization model. Every flag doubles the possible code paths, so two interacting flags mean four states you are unlikely to test. Give each one an owner and an expiry date at creation, and default to off in a way that fails safe if the flag service is unreachable.

### Semantic versioning *(aka semver)*

`Craft`

MAJOR.MINOR.PATCH — breaking change, new feature, bug fix.

> A major bump is a promise you are breaking something. Respect it and your consumers can upgrade confidently.

0.x means all bets are off — anything may break in a minor bump, which is why so many dependency ranges behave surprisingly for pre-1.0 packages. What counts as breaking is broader than the signature: tightening validation, changing a default, or altering timing can break consumers who depended on the old behaviour (Hyrum's law). Note that semver describes intent and cannot enforce it, which is why a lockfile still matters, and applications (as opposed to libraries) are often better served by date or build versioning.

### Infrastructure as code *(aka IaC)*

`Infrastructure`

Declaring servers, networks and permissions in version-controlled files — Terraform, Pulumi, CloudFormation.

> Makes infrastructure reviewable, repeatable and recoverable. Clicking in a console is not reproducible.

The state file is the whole system's weak point: it records what Terraform believes exists, must live in remote storage with locking so two applies cannot race, and contains secrets in plaintext. Drift — someone changing a resource in the console — is detected by plan and is the reason console access to production should be read-only. Always read the plan before applying (destroy-and-recreate hides in there), and separate state per environment so a mistake in staging cannot reach production.

### Environment

`Infrastructure`

An isolated deployment of the system — local, dev, staging, production.

> The only difference between them should be configuration and data. Code divergence defeats the purpose.

Staging's value is proportional to its similarity, and the differences that matter most are usually data volume and traffic shape — a query that is instant against 10,000 seeded rows is a timeout against 40 million. Never copy production data down without anonymising; generate representative synthetic data instead. Beware environment-conditional code (if ENV == 'production'), which means the path you tested is not the path you run; use configuration values rather than branches, so the shape of the code is identical everywhere.

<a id="ops"></a>

## Operations & observability

*Knowing what's happening*

Logs, metrics, traces, percentiles, and the discipline of alerting on what users feel rather than on everything that moves.

### Logs, metrics, traces

`Infrastructure`

Discrete events, numeric time series, and the path of one request across services.

> The three pillars. Logs say what happened, metrics say how much, traces say where the time went.

Their costs scale differently, which should drive what you emit: metrics are cheap and aggregate (bounded by cardinality), logs are expensive per event and scale with traffic, traces are usually sampled for exactly that reason. The practical workflow is to alert on metrics, find the affected requests through traces, and read logs for the detail — which only works if all three carry the same trace id. OpenTelemetry is the vendor-neutral way to emit them, and instrumenting through it is what keeps you from rewriting everything when the backend changes.

### Structured logging

`Infrastructure`

Emitting logs as JSON with named fields rather than prose sentences.

> Turns logs into a queryable dataset. Grepping unstructured strings does not scale past one server.

The message should be a stable constant with the variables as fields — log('payment failed', order_id=…, reason=…) rather than an f-string — because a constant message is groupable and countable while an interpolated one has infinite distinct values. Bind context once per request (user id, trace id, tenant) so every subsequent line carries it automatically. Two rules that save incidents: never log secrets or PII (redact in the formatter, not at each call site), and use levels meaningfully, since a service that logs everything at INFO has no signal left.

### Correlation ID *(aka trace ID, request ID)*

`Infrastructure`

A unique identifier attached to a request and propagated through every service and job it touches.

> Without it, debugging a distributed system means guessing which log lines belong together.

Generate it at the edge if absent, accept it if present (W3C traceparent is the standard header), and carry it through every hop — including the queue, which is where propagation usually breaks, because a message published without the trace context orphans everything the worker does. Store it in a context-local so logging picks it up automatically rather than being threaded through every signature. Returning it in the response header is what lets a user paste one string into a support ticket and give you the entire request.

### Percentiles *(aka p50, p95, p99)*

`Infrastructure`

The latency below which that percentage of requests complete.

> Averages hide pain. p50 can look excellent while p99 means your largest customer times out every time.

Percentiles do not average: you cannot take the mean of per-instance p99s and get the cluster's p99 — you need histograms that aggregate correctly, which is why Prometheus histogram buckets exist and why the bucket boundaries must be chosen to bracket your SLO. Remember that a page making 20 backend calls will hit the p99 of something roughly one time in five, so tail latency is far more visible to users than its name suggests. Watch p99.9 for the biggest customers, whose requests are the largest and slowest by nature.

### Cardinality

`Infrastructure`

The number of distinct label combinations on a metric.

> Adding user_id as a metric label will bankrupt your monitoring bill and possibly your monitoring system.

It multiplies: 5 endpoints × 10 status codes × 3 regions is 150 series, and adding a customer id with 10,000 values makes it 1.5 million — each one a separate time series stored and indexed forever. The rule is that labels must be bounded and low-cardinality (endpoint, method, status), and unbounded identifiers belong in logs or traces where high cardinality is the point. Watch for accidental sources: a URL path with an id in it, an error message used as a label, or a user-agent string.

### SLI / SLO / SLA

`Infrastructure`

The measurement, your internal target, and the contractual promise with penalties attached.

> SLOs give a principled answer to 'is this fast enough' instead of an argument between opinions.

A good SLI is measured as close to the user as possible and stated as a ratio of good events to valid events — 'requests served under 300ms / all requests' — rather than as an average. Set the SLO from what users actually need, not from what you currently achieve, and deliberately below 100%: a target of 100% forbids all change and is unachievable anyway given dependencies you do not control. The SLA should always be looser than the SLO, so you have room to react before money is involved.

### Error budget

`Infrastructure`

The allowed unreliability implied by an SLO. 99.9% permits about 43 minutes down per month.

> Converts reliability-versus-velocity from a values debate into arithmetic. Budget spent means ship fewer risky changes.

Track it over a rolling 30-day window rather than a calendar month, so a bad incident does not get wiped clean by a date change. Burn-rate alerting is the operational form: a fast burn (consuming 5% of the monthly budget in an hour) pages immediately, while a slow burn opens a ticket — which is what stops paging on every minor blip while still catching the sustained degradation. The policy attached to it is the point; a budget with no consequence when exhausted is just a dashboard.

### Observability

`Infrastructure`

Whether you can diagnose a novel problem from existing telemetry without deploying new code.

> Monitoring answers questions you predicted. Observability answers questions you did not.

The practical test is whether you can slice by a dimension you did not think of in advance — 'errors for tenant X, on API version 2, in region eu-west' — which requires wide, high-cardinality events rather than pre-aggregated counters. That is the argument for structured events with many attributes per request: aggregation throws away the outlier, and the outlier is what you are investigating. The failure mode is having three dashboards and no ability to ask a new question without a deploy.

### Alert fatigue

`Infrastructure`

So many alerts that engineers stop reading them.

> Alert on symptoms users feel, not every anomaly. A page must be actionable, urgent and real.

Every page should pass three tests: is it real, is it urgent, and is there something a human can do right now — if any answer is no, it is a ticket or a dashboard, not a page. Alerting on causes (CPU at 90%) produces noise, because a system can be at 90% and perfectly healthy; alert on symptoms (error rate, latency, queue age) and let the runbook lead to the cause. Review pages per shift as a real metric, and treat a page that produced no action as a bug in the alert.

### On-call

`Infrastructure`

A rotation where one engineer is responsible for responding to production incidents.

> Sustainable on-call requires runbooks, a sane alert budget and time to fix root causes afterwards.

The load target most teams borrow from Google is at most two pages per shift; beyond that people stop thinking and start acknowledging. Sustainability comes from structure — a follow-the-sun rotation or compensated night shifts, a handover with open issues, and dedicated time in the next sprint for the fixes the incidents revealed. The strongest cultural rule is that the team who writes the service carries the pager for it, because nothing improves reliability like being woken by your own design decision.

### Runbook

`Infrastructure`

A written procedure for handling a specific alert or failure.

> Write it while the incident is fresh. At 3am nobody derives the fix from first principles.

Link it directly from the alert, so the responder does not search a wiki at 3am, and write it as steps with copy-pasteable commands and expected output — including how to verify the fix worked and how to escalate if it did not. Anything you write down three times should be a script, and anything scripted and safe should eventually run automatically; the runbook is the staging ground for automation. An unverified runbook is a rumour, so exercise them in game days and update them at the postmortem.

### Incident severity *(aka SEV levels)*

`Infrastructure`

A scale from total outage to minor degradation, determining who is woken and how fast.

> Agree the definitions in advance, because nobody negotiates severity calmly during an outage.

Define each level by customer impact with an example attached, not by internal component names, and attach the response to it: who is paged, whether an incident channel and commander are required, how often status updates go out, and whether a postmortem is mandatory. Err upward — over-declaring costs an hour of attention while under-declaring costs the outage. Separate the roles during a real one: an incident commander who coordinates and communicates, and responders who investigate, because the person typing should not also be writing the status page.

### Blameless postmortem

`Craft`

A written analysis after an incident focused on systemic causes rather than individual fault.

> Blame produces hiding. If someone could take the system down with one command, the system permitted it.

Blameless does not mean accountability-free: the team owns the action items, with named owners and dates, and a postmortem whose actions are never done is theatre. Include a timeline with timestamps, what each responder believed at the time (which is where the real lessons hide), and the counterfactuals you rejected. Push past the first cause — 'bad config was deployed' is a symptom; that config could be deployed without validation, to all regions at once, and took 40 minutes to notice, are three separate fixable facts.

### MTTR / MTBF

`Infrastructure`

Mean time to recovery, and mean time between failures.

> Optimising recovery usually beats chasing perfect prevention. Failures are inevitable; long outages are optional.

Decompose MTTR to find where the time actually goes: detect, acknowledge, diagnose, mitigate, verify. In most organisations detection and diagnosis dominate, which means better alerting and better observability buy more than a faster deploy pipeline. Beware the mean itself — one 12-hour incident and nine 5-minute ones average to something that describes nothing, so track the distribution. DORA's version of this pair, deployment frequency and change failure rate alongside recovery time, is the more actionable framing for a delivery team.

### Chaos engineering

`Infrastructure`

Deliberately injecting failure to verify the system survives it.

> The alternative is discovering your failover does not work at the moment you need it.

It is an experiment, not vandalism: state a hypothesis ('the checkout path stays under 500ms if the recommendation service is unavailable'), define the blast radius, run it, and have an abort. Start in staging, start small — kill one pod, add 200ms of latency to one dependency — and only move to production with an automated stop condition. The most valuable early exercises are usually the boring ones: does the database failover actually work, does the backup actually restore, does the on-call actually get paged.

### Golden signals

`Infrastructure`

Latency, traffic, errors and saturation — the four metrics worth watching on any service.

> If you can only build four dashboards, build these.

Two refinements make them work in practice: measure latency separately for successful and failed requests, because fast failures otherwise flatter your numbers, and treat saturation as the leading indicator — it is the one that predicts the other three, whether it is thread pool utilisation, queue depth or connection pool usage. The USE method (utilisation, saturation, errors) is the resource-side counterpart for machines, while golden signals are the request-side view. Together they cover 'is the service healthy' and 'is the box healthy' without a hundred graphs.

<a id="security"></a>

## Security

*Assuming bad input*

The attacks worth knowing by name, the defences that actually work, and the habits that keep credentials out of your git history.

### Secret

`Infrastructure`

Credentials, API keys, tokens — anything that grants access.

> Never in git, never in logs, never in an error message. Once committed, assume compromised and rotate.

A commit cannot be un-made — rewriting history does not remove it from forks, CI caches or anyone's local clone, and bots scan public pushes within seconds, so rotation is the only real response. Prevent it with a pre-commit scanner (gitleaks, trufflehog) plus a server-side push protection. Prefer short-lived, automatically-issued credentials over static keys entirely: OIDC federation between CI and your cloud, or a workload identity, removes the long-lived secret that could leak in the first place.

### Secret rotation

`Infrastructure`

Regularly replacing credentials so a leaked one has a limited useful life.

> Impossible to do calmly unless the app reads secrets from a manager rather than a hardcoded constant.

Rotation requires an overlap window where both the old and new credential are valid, or the swap is an outage — which in turn requires that your provider supports two active keys, and that the application can pick up a new value without a redeploy. Design for it before you need it: the emergency rotation during a suspected breach is not the moment to discover the credential is baked into an image. Automate it on a schedule, and measure the time-to-rotate as a real capability, because that number is your exposure window.

### Least privilege

`Infrastructure`

Every component gets the minimum permissions it needs and nothing more.

> The single highest-value security habit. A compromised service with read-only access is a much smaller problem.

Apply it on every axis, not just IAM: a database user that only needs SELECT should not have DROP, a container should run as non-root with a read-only filesystem, and network policy should deny egress by default so a compromised pod cannot phone home. Start from deny and add what fails, rather than starting broad with an intention to tighten later, which never happens. Watch for privilege creep in long-lived roles, and remember that a wildcard resource in a policy is the same as no policy for anything it matches.

### SQL injection

`Data`

User input interpreted as SQL because it was concatenated into a query string.

> Solved completely by parameterised queries. Still in the top ten decades later because people still use f-strings.

Parameterisation works because the query text and the data travel separately to the server, so nothing in the value can change the parsed statement — escaping is a weaker approach that keeps failing on encodings and edge cases. Identifiers (table and column names) cannot be parameterised, so a dynamic ORDER BY column must be validated against an allowlist. Blind injection needs no visible output, inferring data from timing or error differences, which is why 'the endpoint returns nothing useful' is not a defence. Least privilege limits the damage when it happens anyway.

### XSS *(aka cross-site scripting)*

`Edge`

Attacker-supplied script executing in another user's browser because output was not escaped.

> Escape on output, not just input. A Content Security Policy is the second line of defence.

Escaping is context-dependent: HTML body, attribute, JavaScript and URL contexts each need different encoding, which is why a single sanitise-on-input pass is insufficient and a template engine's auto-escaping is the right default. Know the three shapes — stored (in your database, hitting every viewer), reflected (in a crafted link), and DOM-based (never touching the server, born from innerHTML). The specific dangerous sinks are innerHTML, dangerouslySetInnerHTML and eval; HttpOnly cookies plus a strict CSP limit what a successful XSS can actually steal.

### CSRF

`Edge`

Tricking a logged-in user's browser into making a state-changing request to your site.

> Defended with anti-CSRF tokens and SameSite cookies. Only affects cookie-based auth.

It works because cookies are attached automatically by origin, so the attacker never needs to read anything — they only need the request to happen. SameSite=Lax is now the browser default and blocks the classic cross-site POST, but it is not complete cover: subdomains are same-site, and GET-based state changes still slip through, which is another reason GET must never mutate. The synchroniser token pattern remains the belt-and-braces answer, and APIs authenticated by an Authorization header rather than a cookie are structurally immune.

### SSRF

`Application`

Making your server fetch a URL an attacker chose, often reaching internal-only services.

> The classic escalation path into cloud metadata endpoints. Allowlist outbound destinations.

The prize is 169.254.169.254, the cloud metadata endpoint, which historically hands out instance credentials to anything that asks — IMDSv2 requiring a token header exists precisely to break this and should be enforced. Denylists fail endlessly (DNS names resolving to private IPs, redirects, IPv6-mapped addresses, decimal-encoded IPs), so allowlist destinations, resolve the hostname and validate the resolved IP, and disable redirect following. The strongest control is architectural: make the fetch from a network segment with no route to anything internal.

### Hashing vs encryption

`Application`

Hashing is one-way. Encryption is reversible with a key.

> Passwords are hashed with bcrypt or argon2, never encrypted, never stored plainly, never hashed with SHA-256 alone.

Password hashes must be deliberately slow — bcrypt with a cost factor, or argon2id with memory and time parameters — because a GPU computes billions of SHA-256 hashes per second and only a handful of bcrypt ones. Tune the cost so verification takes roughly 100–250ms on your hardware, and re-hash on login when you raise it. Compare hashes with a constant-time function to avoid leaking information through timing, and use HMAC rather than a bare hash when you need to prove a message came from someone holding a key.

### Salt

`Application`

Random data added per-password before hashing so identical passwords produce different hashes.

> Defeats rainbow tables. Modern password hashing libraries handle it for you — let them.

It is per-password, not per-application, and it is not secret — bcrypt and argon2 store it inside the output string, which is why one column holds everything needed to verify. Its job is to make precomputation useless and to stop a breach revealing which users share a password. A pepper is the complementary idea: a secret value held outside the database (in a KMS or env config) mixed in before hashing, so a stolen database alone is not enough to start cracking.

### Encryption at rest / in transit

`Infrastructure`

Protecting stored data, and protecting data moving across a network.

> Usually one configuration flag each. Auditors will ask, so enable them from day one.

Understand what disk encryption actually protects against — a stolen or improperly decommissioned disk — and not against an application bug or a compromised credential, because your service reads the data decrypted like everyone else. For genuinely sensitive fields, application-level encryption with a key from a KMS is the stronger control, at the cost of losing the ability to query or index them. Key management is the real work: rotation, envelope encryption, and access policy on the key, since whoever can use the key has the data.

### Principle of secure defaults

`Craft`

The safe configuration is the one you get without doing anything.

> If security requires remembering an extra step, the step will eventually be forgotten.

In practice this means default-deny everywhere: private buckets, closed security groups, authentication required on new routes unless explicitly marked public, and debug mode off unless switched on. Inverting the flag matters — a require_auth=True default fails safe when someone forgets it, while allow_anonymous=False fails open the moment a new code path skips the check. Fail closed on errors too: if the authorization service is unreachable, deny rather than allow, and make the insecure option loud and deliberate to enable.

### Dependency vulnerability scan *(aka SCA)*

`Craft`

Automated checking of your dependency tree against known vulnerability databases.

> Most breaches enter through a transitive dependency nobody chose. Run it in CI.

Expect a high false-positive rate: a CVE in a code path your application never calls is real in the database and not real for you, so use reachability analysis or triage with a documented suppression rather than either patching everything or ignoring everything. Scan the container image as well as the manifest, since the base OS carries its own packages. Generate an SBOM so that when the next big CVE lands you can answer 'are we affected' in minutes, and keep dependencies current continuously — small frequent upgrades are what make the emergency patch possible.

### Supply chain attack

`Craft`

Compromising a library, build tool or registry to reach everyone who installs it.

> Lockfiles, pinned versions and verified publishers are the practical mitigations.

The vectors are well documented by now: a maintainer account taken over, a typosquatted package name, a malicious post-install script, and dependency confusion where a public package shadows your internal one. Concrete defences are pinning by hash, disabling install scripts where you can, scoping internal packages to a private registry that refuses public fallback, and building in an ephemeral CI runner with least privilege. The build system itself is part of the attack surface — a compromised CI can sign a malicious artifact perfectly, which is what provenance attestation exists to detect.

### Audit log

`Data`

An append-only record of who did what, when.

> Different from application logs: it is evidence. It must be tamper-resistant and retained deliberately.

Record actor, action, target, timestamp, source IP and outcome — including failures, since a run of denied attempts is the signal you most want. Write it somewhere the application cannot rewrite: a separate store with append-only permissions, or an object bucket with versioning and a retention lock. Log administrative reads too when the data is sensitive, because 'who looked at this record' is the question regulators ask. And keep it out of the same fate as the system it audits: if an attacker with database access can edit the log, it is not evidence.

### Prompt injection

`Model`

Instructions hidden in content the model reads, which the model then follows.

> The defining security problem of LLM applications. Treat model output derived from untrusted text as untrusted input.

There is no known reliable fix, because instructions and data share one channel — a retrieved document, a web page, an email, or an image can carry text the model treats as direction. Direct injection targets your system prompt; indirect injection hides in content the model fetches, which is far more dangerous in an agent with tools. The practical posture is containment rather than prevention: least privilege on every tool, human confirmation before consequential or irreversible actions, output validated against a schema, and the assumption that the exfiltration path (a URL the model can cause to be fetched) is the thing to close.

<a id="systems"></a>

## Systems & Linux

*The machine underneath*

Memory, file descriptors, permissions, and the shell literacy that turns a production incident from mysterious into merely annoying.

### stdout / stderr

`Machine`

The two default output streams: normal output and errors.

> Containers expect logs on stdout. Writing to a file inside a container means the logs die with it.

They are separate so a pipeline can consume data on stdout while diagnostics still reach a human on stderr — which is why a CLI's progress messages belong on stderr, not stdout. Buffering is the operational trap: stdout is block-buffered when it is not a terminal, so a crashed container can lose its last lines entirely (fix with PYTHONUNBUFFERED=1 or an explicit flush), while stderr is typically unbuffered. Redirect precisely: 2>&1 merges them, and the order matters, since > file 2>&1 and 2>&1 > file do different things.

### Environment variable

`Infrastructure`

Configuration passed to a process by its environment rather than baked into code.

> The Twelve-Factor way to configure. Load them once at startup into a typed settings object.

Everything is a string, so parse and validate at startup into typed settings and fail loudly on a missing or malformed value — a service that boots with DEBUG='false' evaluating truthy is a real and common bug. They are inherited by child processes and visible in /proc and crash dumps, which is why they are a weak place for secrets. Read them once at the entry point rather than scattering getenv calls through the code, so configuration is testable and the full set of required variables is discoverable in one file.

### File descriptor

`Machine`

A handle for an open file, socket or pipe. Every process has a limit.

> 'Too many open files' means you are leaking connections somewhere, not that you need a bigger limit.

Every socket counts, so a leak usually lives in HTTP clients or database connections created per request instead of reused — check with lsof -p <pid> or ls /proc/<pid>/fd, and look at what the majority of them point to. Note that a closed TCP connection lingers in TIME_WAIT for around 60 seconds, so a high-churn client can exhaust descriptors or ephemeral ports without leaking anything. Use context managers or defer-style cleanup everywhere, and raise the ulimit only after you have proven the usage is legitimate.

### Permissions *(aka chmod, chown)*

`Machine`

Read, write and execute bits for owner, group and everyone.

> 755 for directories and scripts, 644 for files, 600 for secrets. 777 is never the real fix.

On a directory the bits mean something different from a file: x is permission to traverse into it, and r is permission to list its contents, so a directory can be enterable but not listable. Ownership is the usual container problem — a volume mounted from the host arrives with the host's UID, and your non-root container user cannot write to it, which is what the numeric mismatch in 'permission denied' is telling you. Also know the special bits: setuid, and the sticky bit that makes /tmp safe for shared use.

### Symbolic link *(aka symlink)*

`Machine`

A file that points at another path.

> How 'current release' directories work. Also how you accidentally deploy the previous version.

A symlink stores a path, so it breaks if the target moves and can point at something that does not exist yet; a hard link is a second name for the same inode and cannot cross filesystems. The atomic-deploy trick relies on that path indirection: create the new symlink and rename it over the old one, since rename is atomic and nothing observes a moment with no current directory. Watch two gotchas — relative symlinks resolve against the link's own directory, and Docker's COPY follows and materialises them rather than preserving the link.

### Pipe and redirect

`Machine`

| sends one command's output into another. > writes to a file, >> appends.

> grep, awk, sort, uniq, wc composed with pipes will out-perform writing a script for most log questions.

The canonical incident one-liner is worth memorising: sort | uniq -c | sort -rn turns any extracted field into a ranked frequency count, which answers 'which endpoint is erroring' in one line. Pipes run concurrently with a small kernel buffer, so a slow consumer applies backpressure to the producer — that is the shell demonstrating the same principle your services need. Remember that > truncates the file the moment the command starts (so cmd > file with file as input destroys it), and that only the last command's exit status survives unless you set pipefail.

### Exit status in shell *(aka $?)*

`Machine`

The last command's exit code, available as $?.

> set -euo pipefail at the top of every bash script. Without it, scripts cheerfully continue after failures.

Each flag fixes a specific silent failure: -e exits on error, -u treats an unset variable as an error (rm -rf "$PREFIX/" with an empty PREFIX is the cautionary tale), and -o pipefail makes a failing command mid-pipeline fail the whole thing rather than being masked by a successful tail. Know -e's exceptions — it does not trigger inside a condition, or for a command followed by || — and use trap for cleanup on exit. Always quote variables, since an unquoted one containing spaces becomes several arguments.

### Memory: RSS vs virtual

`Machine`

Resident set size is physical memory actually in use; virtual is address space reserved.

> Container limits apply to RSS. A scary virtual number is usually nothing to worry about.

RSS also double-counts shared pages: two forked workers each report the shared library and copy-on-write parent memory, so summing RSS across processes overstates real usage — PSS (proportional set size) is the honest per-process number. Watch the cgroup's memory.current rather than the host's free, since page cache counts toward a container limit and can trigger reclaim. And a process that frees memory often does not return it to the OS (the allocator keeps it), so flat RSS after a spike is normal rather than a leak.

### Swap

`Machine`

Disk used as overflow when physical memory runs out.

> Usually disabled in containers, because swapping makes a process pathologically slow instead of cleanly dead.

The failure it causes is worse than the one it prevents: a swapping service is alive and answering health checks while every request takes seconds, so the load balancer keeps sending traffic and nothing recovers — a fast OOM kill and restart is the kinder outcome, which is why Kubernetes traditionally refuses to start with swap enabled. Even with swap off, the kernel can evict page cache and re-read executable pages from disk under pressure, which looks like sudden mysterious slowness. Watch major page faults, not just free memory.

### Load average

`Machine`

The average number of processes running or waiting, over one, five and fifteen minutes.

> Compare against core count. Load of 4 on 8 cores is fine; on 2 cores it is a queue.

On Linux it counts processes in uninterruptible sleep (blocked on disk I/O) as well as runnable ones, so a high load average with idle CPU means you are I/O-bound, not compute-bound — a distinction the number alone hides. Read the three windows as a trend: 1-minute above 15-minute means it is rising now. Inside a container the value comes from the host, not your cgroup, so it describes the neighbourhood rather than your application; per-cgroup CPU throttling metrics are what actually tell you whether you are being limited.

### Namespace and cgroup

`Machine`

Kernel features providing isolation and resource limits — the mechanics containers are built from.

> A container is not a virtual machine. It is a normal process with a restricted view of the system.

Namespaces control visibility (PID, network, mount, user, UTS, IPC) and cgroups control consumption (CPU, memory, I/O) — two separate mechanisms that together produce the illusion of a machine. The consequences are practical: the kernel is shared, so a kernel vulnerability crosses the boundary and a container is a weaker isolation boundary than a VM. CPU limits are enforced by throttling within a period rather than by slowing the clock, which is why a latency-sensitive service can be throttled hard while average utilisation looks low.

### Port binding

`Infrastructure`

A process claiming a network port to accept connections on.

> 'Address already in use' means a previous process still holds it. Ports below 1024 need elevated privileges.

A binding is the tuple of address, port and protocol, which is why one process can bind 127.0.0.1:8000 and another 0.0.0.0:8000 and only the second collides with everything. SO_REUSEADDR is what lets a restarting server rebind while old connections sit in TIME_WAIT, and SO_REUSEPORT lets several processes share one port with kernel-side load balancing — the mechanism behind multi-worker servers. Find the holder with lsof -i :8000 or ss -ltnp, and prefer a capability or a proxy over running as root for port 80.

### Localhost vs 0.0.0.0

`Infrastructure`

Binding to 127.0.0.1 accepts only local connections; 0.0.0.0 accepts from any interface.

> The single most common reason a containerised app is unreachable from outside the container.

Inside a container, localhost is the container's own loopback, so it is also why one container cannot reach another at 127.0.0.1 — use the service name and let DNS resolve it. On a developer machine, host.docker.internal is the escape hatch back to the host. The corollary is a security one: binding a debug server or a database to 0.0.0.0 on a host with a public interface exposes it to the internet, so bind to loopback by default and let a reverse proxy be the only thing listening broadly.

<a id="ai"></a>

## AI & LLM engineering

*Building on models*

Tokens, retrieval, agents, evaluation, and the reliability problems that only exist when your program's output is non-deterministic.

### Token

`Model`

The unit a model reads and writes — roughly a word fragment. Billing and limits are counted in these.

> Roughly four characters of English. Code and non-Latin scripts tokenise less efficiently, so they cost more.

Tokenisation is why models struggle with character-level tasks — counting letters or reversing a string is hard when 'strawberry' is three opaque tokens rather than ten characters. It also drives cost asymmetry: output tokens typically cost several times input tokens, so a verbose response format is a real line item. Never estimate by dividing characters by four when it matters; count with the model's own tokeniser, especially for JSON, code, and non-English text where the ratio can be double.

### Context window

`Model`

The maximum tokens a model can consider at once, covering prompt and response together.

> Bigger is not free: latency and cost rise, and models attend less reliably to the middle of very long contexts.

The 'lost in the middle' effect is measurable: recall is strongest at the beginning and end of a long context and weakest in the middle, so place instructions and the most relevant retrieved chunks at the edges. Cost and latency scale with input length on every call, which is why sending a 100k-token context to answer a one-line question is usually the wrong trade against retrieval. Reserve headroom explicitly for the output — the window is shared, and a prompt that fills it leaves the model no room to answer.

### Temperature

`Model`

A sampling parameter controlling randomness. Low is focused and repetitive; high is varied and erratic.

> Use low values for extraction and classification, higher for ideation. It is not a creativity dial so much as a risk dial.

Mechanically it rescales the logits before sampling: below 1 sharpens the distribution toward the most likely token, above 1 flattens it. Note that temperature 0 is near-deterministic, not guaranteed deterministic — batching and floating-point non-associativity on GPUs still produce variation, so never build a test that requires byte-identical output. top_p (nucleus sampling) is the parameter usually worth tuning alongside it, and adjusting both at once makes the effect of either hard to reason about.

### System prompt

`Model`

Instructions setting the model's role, constraints and output format before user input arrives.

> Keep prompts in files, not string literals. You will iterate on them constantly and want them diffable.

Treat it as code: version it, review changes, and evaluate before and after, because a prompt edit is a behaviour change shipped without a type checker. Structure beats prose — role, then constraints, then output format, then examples, with delimiters separating instructions from user-supplied content so injected text is visibly data. Be specific about what to do rather than what to avoid, state the failure behaviour explicitly ('if the answer is not in the context, say you do not know'), and keep it stable at the front so prompt caching can apply.

### Few-shot prompting

`Model`

Including examples of desired input-output pairs in the prompt.

> Usually the cheapest large quality gain available. Two good examples often beat a paragraph of instructions.

Examples teach format and edge-case handling far more reliably than they teach knowledge, so pick them to cover the boundaries you care about — the ambiguous case, the empty case, the refuse case — rather than three variations of the easy one. Watch for label bias: if all your examples share one output class, the model will over-predict it. Each example costs tokens on every call, which is where dynamic few-shot (retrieving the most similar examples per input) earns its complexity, and prompt caching makes a fixed set nearly free.

### Structured output *(aka function calling, tool use)*

`Model`

Constraining a model to emit JSON matching a schema, or to call a declared function with typed arguments.

> How you get from 'text generator' to 'component in a program'. Validate the output anyway.

Constrained decoding makes the JSON syntactically valid by construction, which is a different guarantee from being semantically right — the model can still invent an id or pick the wrong enum member, so validation stays your job. The schema is part of the prompt: field names and descriptions are read as instructions, so 'iso8601_start_date' with a description outperforms 'date'. Keep schemas flat and shallow, mark truly optional fields as nullable rather than absent, and handle the refusal case, since a model that should decline still has to say so inside your schema.

### Embedding

`Model`

A vector of numbers representing meaning, where similar text lands nearby in the space.

> Embeddings from different models are not comparable. Change the model and you must re-embed everything.

Cosine similarity is the usual metric, and it is relative, not absolute — 0.82 means nothing on its own, only in comparison to other scores from the same model, so thresholds must be calibrated per model and per corpus. Asymmetric models expect a prefix distinguishing a query from a document, and skipping it quietly costs recall. Dimensionality is a storage and speed trade (1536 floats is 6KB per chunk before indexing), and re-embedding a corpus is a migration to plan for, not a config change.

### Vector store

`Data`

A database that indexes vectors for nearest-neighbour search — pgvector, Pinecone, Qdrant, Weaviate.

> If you already run Postgres, start with pgvector. A separate vector database is a real operational cost.

Search is approximate: HNSW and IVFFlat trade recall for speed, so tuning parameters (ef_search, nprobe) moves you along that curve and the default may be missing relevant results silently. Metadata filtering is the feature that decides most architectures — filtering by tenant or date before the vector search is what keeps multi-tenant retrieval correct and fast, and doing it after means you may filter away everything you retrieved. Index build time and memory matter at scale: HNSW is fast to query and expensive to build and hold.

### Chunking

`Model`

Splitting documents into pieces before embedding them.

> Chunk size and overlap dominate retrieval quality more than model choice does. Split on structure, not character counts.

Split on the document's own boundaries — headings, sections, function definitions — because a chunk cut mid-sentence embeds a fragment whose meaning is genuinely unclear. Two techniques earn their complexity: prepending the document title and section path to each chunk so it carries its context, and small-to-big retrieval, where you embed small precise chunks but pass the larger surrounding section to the model. Tables and code resist naive splitting badly, and overlap of 10–20% is the usual cheap insurance against a boundary landing on the one sentence that mattered.

### RAG *(aka retrieval-augmented generation)*

`Model`

Retrieve relevant chunks, insert them into the prompt, and have the model answer from them.

> Most RAG failures are retrieval failures. Measure whether the right chunk was fetched before blaming the model.

Evaluate the two stages separately or you will tune blind: retrieval with recall@k and precision (was the answer-bearing chunk in the top k), generation with faithfulness (is the answer supported by what was retrieved). The most common production failure is the missing-context case where the model answers anyway from parametric memory, which is why the prompt must instruct it to decline and why citations should be required. Also plan for the freshness problem — an index built once is wrong the day the source changes, so re-indexing is a pipeline, not a script.

### Reranking

`Model`

A second model reordering retrieved candidates by actual relevance before they enter the prompt.

> Retrieve broadly, rerank tightly. Usually a bigger win than tuning the embedding model.

A cross-encoder reads the query and the document together, which is why it is far more accurate than the bi-encoder that produced the embeddings — and far too slow to run over the whole corpus. That asymmetry is the whole design: retrieve 50–100 cheaply, rerank to the top 5, spend the latency budget where it changes the answer. Expect 50–200ms for the rerank call, and note the second benefit — a calibrated relevance score lets you drop everything below a threshold rather than always passing k chunks regardless of quality.

### Hybrid search

`Model`

Combining keyword search with vector search.

> Vectors miss exact identifiers, error codes and product names. Keywords catch what semantics blur.

The two systems fail in opposite directions: BM25 nails exact tokens (an error code, a SKU, a surname) and misses paraphrase; embeddings handle paraphrase and blur the exact string. Reciprocal rank fusion is the standard way to combine them because it merges rankings without needing the two score scales to be comparable — which they are not. In practice hybrid is the strongest default for technical corpora, where users search for identifiers as often as concepts, and the keyword half is also what makes results explainable.

### Hallucination

`Model`

Model output that is fluent and confident but factually wrong or unsupported by any source.

> The core reliability problem. Grounding, citations and verification reduce it; nothing eliminates it.

It is intrinsic to the mechanism — the model is sampling plausible continuations, and there is no separate store of facts to consult — so treat mitigation as engineering rather than a bug to be fixed. What works: ground answers in retrieved text, require span-level citations you can verify programmatically, keep temperature low for factual tasks, and give the model an explicit escape ('say you do not know'). The dangerous shape is the confident specific detail — a plausible case number, a real-looking API method — which is exactly the kind humans do not double-check.

### Eval

`Model`

A test suite for non-deterministic output, scored against rubrics, references or a judge model.

> Build these before optimising anything. Without evals, prompt changes are superstition.

Prefer deterministic checks wherever the task allows one — schema validity, exact match on extraction, does the cited span exist — and reserve model grading for genuinely open-ended output. Track cost and latency alongside quality, since a prompt that scores two points higher and costs triple is not obviously a win. Run them in CI on every prompt or model change, expect noise (run multiple samples and compare distributions rather than single scores), and remember that an eval set which stops finding failures has stopped being useful.

### Golden dataset

`Model`

A curated set of inputs with known-good outputs used as the benchmark for every change.

> Start with twenty real examples, including the ones that already failed. Grow it from production traffic.

Grow it from real failures: every production complaint becomes a case, which is what keeps it representative rather than a set of examples you happened to imagine. Stratify deliberately across categories, difficulty and edge cases so an aggregate score cannot hide a class that regressed, and hold a portion back that you never tune against — otherwise you overfit the prompt to the benchmark exactly as you would overfit a model. Version it alongside the prompts, since comparing scores across two different datasets means nothing.

### LLM-as-judge

`Model`

Using a model to grade another model's output against criteria.

> Scales evaluation but inherits biases — position, verbosity, self-preference. Calibrate against human labels.

The biases are documented and correctable: position bias (swap the order of A and B and average), verbosity bias (longer answers score higher), and self-preference (a model favouring its own outputs, so use a different model as judge where you can). Pairwise comparison is more reliable than absolute scoring, and a 1–5 scale without anchored descriptions per point produces mush. Measure the judge itself — agreement with human labels on a sample — because an uncalibrated judge is a confident number with unknown meaning.

### Agent

`Model`

A model in a loop, choosing tools, observing results and deciding the next step.

> Every loop iteration multiplies error probability. Cap iterations, log every step, and prefer a fixed workflow when one exists.

The arithmetic is unforgiving: 95% reliability per step is 60% over ten steps, which is why fewer, more capable tools beat many granular ones and why a deterministic workflow should be preferred wherever the sequence is actually known in advance. Tool descriptions are prompt engineering — ambiguous ones produce wrong tool choices far more often than model capability does. Budget iterations, tokens and wall-clock; make destructive tools require confirmation; and log every step's input and output, because debugging an agent without a trace of its reasoning path is guesswork.

### Guardrails

`Model`

Validation applied to model inputs and outputs — schema checks, content filters, refusal detection.

> The model is a component that can fail. Guardrails are the same input validation you already write elsewhere.

Layer them by cost: cheap deterministic checks first (schema, regex, allowlists, length), then a classifier, then a model-based check only if needed — and decide per failure whether to retry, repair, fall back, or refuse. Input guardrails catch injection attempts and out-of-scope requests; output guardrails catch leaked PII, unsupported claims and malformed structure. Every guardrail adds latency and false positives, so measure both, and log what they block: that log is your best early signal of how the system is being misused.

### Streaming

`Edge`

Sending tokens to the client as they are generated rather than waiting for completion.

> Does not reduce total latency but transforms perceived speed. Complicates error handling mid-response.

The metric it improves is time-to-first-token, and that is the one users feel; total generation time is unchanged. The engineering costs are real: an error after 200 tokens have been sent cannot become a 500, so you need in-band error events and a client that can handle a truncated response. Server-Sent Events over HTTP is the usual transport, buffering proxies must be disabled or they defeat the whole thing, and any output validation you wanted to do now has to happen either incrementally or after the user has already read it.

### Prompt caching

`Model`

Reusing computation for an unchanged prompt prefix across calls.

> Put stable content first and variable content last, and long system prompts become dramatically cheaper.

It matches on an exact prefix, so a single changed character early in the prompt — a timestamp, a shuffled example, a user name in the system message — invalidates everything after it. Order accordingly: system instructions, then tools, then few-shot examples, then retrieved context, then the user turn. Caches have a short TTL (minutes), so the benefit is concentrated in multi-turn conversations and high-frequency endpoints, where the discount on cached input tokens is large enough to change the economics of a long system prompt entirely.

### Fine-tuning vs prompting

`Training`

Adjusting model weights on your data, versus improving instructions and examples.

> Try prompting, retrieval, then fine-tuning, in that order. Fine-tuning teaches form far better than it teaches facts.

The split is capability versus knowledge: fine-tuning is excellent for style, format, tone and consistent classification behaviour, and a poor way to install facts that change — those belong in retrieval, where they can be updated without a training run. LoRA and other parameter-efficient methods make it cheap enough to try with a few hundred to a few thousand well-curated examples, where quality matters far more than volume. The hidden cost is lifecycle: a fine-tune pins you to a base model, and every upgrade means retraining and re-evaluating.

### Distillation

`Training`

Training a smaller model to reproduce a larger model's behaviour.

> How a slow expensive prototype becomes a fast cheap production path once you have traffic to learn from.

The practical recipe is to run the large model in production first, log inputs and outputs, filter that trace to the cases it handled well, and fine-tune a small model on the result — your traffic is the training set, which is why this comes after launch rather than before. Expect a narrower model: it will match the teacher on the distribution you distilled and degrade off it, so keep an escalation path to the larger model for low-confidence or unusual inputs. Check the terms of the teacher model's licence before distilling from it.

### Token budget

`Model`

The deliberate allocation of a context window between instructions, retrieved context, history and output.

> Unmanaged conversation history is the usual cause of gradually rising cost and sudden context-limit errors.

Write the allocation down and enforce it in code — for example 2k system, 8k retrieved context, 4k history, 2k reserved output — with a truncation strategy per section rather than one global trim that silently drops your instructions. History is the section that grows without limit: a sliding window is the simple answer, rolling summarisation the better one for long sessions. Count tokens before sending rather than catching the API's context-length error, and log the per-section usage so cost regressions are visible before the bill is.

<a id="ml"></a>

## ML training

*Making the model*

The vocabulary of training runs: loss, overfitting, splits, and the metrics that matter when accuracy is a lie.

### Train / validation / test split

`Training`

Data divided into what the model learns from, what you tune against, and what you touch only once.

> Look at the test set repeatedly and you have leaked it. It is now a validation set and you have no honest estimate.

A random split is wrong more often than people assume: time-series data must be split chronologically (training on the future to predict the past is guaranteed leakage), and grouped data must be split by group so the same user or patient never appears on both sides. Stratify to preserve class proportions when a class is rare. Cross-validation gives a variance estimate as well as a point score on small datasets, and the test set should be touched once, at the end, as a decision you make deliberately.

### Overfitting vs underfitting

`Training`

Memorising the training data versus failing to learn the pattern at all.

> Diagnosed by the gap between training and validation performance, not by either number alone.

Read the learning curves: both errors high and converged means underfitting (more capacity or better features), a wide and growing gap means overfitting (more data, regularisation, dropout, or early stopping). Note that the classic advice to shrink the model is not the only lever and often not the best one — more data usually beats a smaller model. And beware the third case that looks like neither: good validation performance and poor production performance, which is usually distribution shift or leakage rather than a fitting problem at all.

### Loss function

`Training`

The number the training process minimises — how wrong the model currently is.

> The loss encodes what you actually want. Optimise the wrong loss and the model will satisfy it perfectly.

It is not the same as your evaluation metric, and the gap matters: cross-entropy is differentiable and trainable, while the F1 or business KPI you actually care about is not, so you optimise a proxy and evaluate on the real thing. Where costs are asymmetric — a missed fraud costing far more than a false alarm — encode that with class weights or a custom loss rather than hoping a threshold fixes it afterwards. Watch the loss curve during training: a sudden spike to NaN usually means the learning rate is too high or a division is unguarded.

### Epoch / batch / learning rate

`Training`

One pass over the data / how many samples per update / how large each update is.

> Learning rate is the hyperparameter that matters most. Too high diverges; too low never converges.

They interact: larger batches give less noisy gradients and typically want a proportionally larger learning rate (the linear scaling rule), while very large batches can generalise slightly worse. Batch size is bounded by GPU memory, and gradient accumulation is how you simulate a large one on a small card. Almost nobody uses a constant learning rate any more — warmup followed by cosine decay is the common default — and a learning-rate finder sweep is a cheap way to bracket the right order of magnitude before a long run.

### Gradient descent

`Training`

Iteratively adjusting parameters in the direction that reduces loss.

> The whole of training in one sentence. Everything else is variations on step size and direction.

Stochastic gradient descent uses a mini-batch rather than the full dataset, and that noise is a feature: it is what lets training escape sharp local minima. Adam adds per-parameter adaptive step sizes plus momentum, which is why it is the default for most deep learning, though plain SGD with momentum still generalises better on some vision tasks. The failure modes have names worth recognising — exploding gradients (fix with clipping) and vanishing gradients (why residual connections and normalisation layers exist).

### Feature engineering

`Training`

Transforming raw data into inputs a model can learn from.

> For classical ML this is where most of the performance comes from — far more than model selection.

The mechanics that matter: scaling for distance-based and gradient-based models, sensible encoding for categoricals (one-hot for low cardinality, target encoding for high — computed within the training fold, or you have leaked), and cyclical encoding for hour-of-day and day-of-week so 23:00 and 00:00 are near each other. The operational trap is training/serving skew, where a feature is computed one way in the training notebook and another way in the service; a feature store or shared transformation code is what prevents it.

### Data leakage

`Training`

Information from the future or from the target sneaking into training features.

> Produces spectacular offline metrics and a model that fails immediately in production. Suspect it when results look too good.

The usual sources: a feature computed after the outcome was known (a status field updated on resolution), scaling or imputation fitted on the whole dataset before splitting, a duplicated row landing on both sides, and target encoding computed across folds. Two habits catch most of it — fit every transformation inside a pipeline on the training fold only, and ask of each feature 'would this value have been available, with this value, at prediction time?'. A single feature with suspiciously high importance is the tell worth chasing.

### Precision vs recall

`Training`

Of what you flagged, how much was right / of what was there, how much did you find.

> You trade one for the other. Which matters depends entirely on whether false positives or false negatives cost more.

Both are functions of a threshold, so reporting a single pair without saying which threshold is meaningless — the model outputs a score, and you choose the operating point from the cost of each error type. Precision-recall curves are more informative than ROC on imbalanced data, where a large true-negative count flatters the ROC. F1 is the harmonic mean and assumes the two matter equally, which is rarely true; Fβ lets you weight them, and in practice the threshold is often set by capacity — how many alerts a review team can actually process in a day.

### Class imbalance

`Training`

One outcome vastly outnumbering another, as in fraud detection.

> Accuracy becomes meaningless — predicting 'never fraud' scores 99.9%. Use precision, recall and AUC instead.

Resampling changes the base rate, so a model trained on rebalanced data outputs miscalibrated probabilities and needs recalibration if you use the scores rather than just the ranking. Class weights in the loss are usually the cleaner first move; SMOTE-style synthetic oversampling is applied to the training fold only, never before the split. Often the better framing is anomaly detection or ranking rather than classification — and always compare against the trivial baseline, since 'always predict the majority' is the number your model must actually beat.

### Baseline

`Training`

The simplest reasonable approach, against which every model must justify itself.

> Always build it first. A surprising number of deployed models never beat 'predict the most common answer'.

Build the trivial one (majority class, or last observed value for a time series — surprisingly strong) and then a simple real one (logistic regression, gradient-boosted trees) before anything deep. The baseline also validates your pipeline end to end: if it scores 0.99, you have leakage, not a great baseline. Include the incumbent — the existing rules engine or the human process — because beating a research benchmark while losing to the heuristic already in production is a common and expensive way to be technically right.

### Inference

`Training`

Using a trained model to produce predictions, as opposed to training it.

> Different constraints entirely: training optimises throughput, inference optimises latency and cost per call.

Batch and online inference are different systems: batch scores millions offline overnight and tolerates minutes of latency; online serves one request in milliseconds and needs the features available at request time, which is the harder engineering problem. The optimisation toolkit is quantisation, distillation, ONNX or TensorRT compilation, and dynamic batching to use the accelerator efficiently. Feature parity with training is the recurring failure — the same transformation code must run in both paths, or the model sees inputs it was never trained on.

### Model registry

`Training`

Versioned storage of trained models with their metrics, parameters and lineage.

> 'Which model is in production and what data produced it' must have an answer. MLflow exists for this.

A registered version should carry the artifact, the training data version, the code commit, the hyperparameters, the eval results and a stage (staging, production, archived) — enough for someone else to reproduce it and for you to roll back to it. Serving should resolve the model by registry stage rather than a hardcoded path, so promotion and rollback are metadata operations. Beware pickle-format artifacts: they embed library versions and are an arbitrary-code-execution risk, which is why ONNX or safetensors is the safer interchange.

### Experiment tracking

`Training`

Logging each run's configuration, code version, data version and results.

> Without it, comparing runs relies on memory and filenames like final_v3_actually_final.pkl.

Log automatically at the start of training rather than by hand at the end — git SHA (and whether the tree was dirty), the full config, the dataset hash, the environment, and metrics per epoch — because the run you forget to log is invariably the one that worked. Its real value is comparison across dozens of runs to see which hyperparameter actually mattered. Pair it with a config system (Hydra or equivalent) so a run is fully described by a file you can re-run, not by the arguments someone typed that afternoon.

### Drift

`Training`

Production data or relationships changing so a once-accurate model degrades.

> Models rot silently. Monitor input distributions and outcomes, not just uptime.

Separate the kinds: data drift is the input distribution moving, concept drift is the input-output relationship changing (the same features now imply a different outcome), and label delay is what makes the second hard to detect — if the true outcome only arrives 60 days later, accuracy monitoring is 60 days behind. So monitor proxies in the meantime: feature distributions (PSI, KL divergence), prediction distribution, and the rate of low-confidence outputs. Decide the retraining trigger in advance — scheduled, or drift-threshold-based — and keep a champion/challenger comparison so retraining cannot silently make things worse.

### Reproducibility

`Training`

Being able to recreate a result exactly — same data, same code, same seed.

> Version the data alongside the code. Immutable raw data and versioned transformations are the foundation.

Bit-exact reproducibility is genuinely hard on GPUs: non-deterministic kernels and floating-point non-associativity mean two runs with the same seed can differ, and forcing determinism (torch.use_deterministic_algorithms) costs speed. Aim for statistical reproducibility — the same conclusion within noise — and report the variance across seeds rather than one number. The infrastructure that makes it possible is unglamorous: pinned dependencies, a containerised environment, seeded generators, and data versioning (DVC, lakeFS) so 'the dataset' means a specific hash.

<a id="career"></a>

## Working as an engineer

*The human protocol*

Estimation, debt, review etiquette, on-call, and the practices that decide whether a team compounds or thrashes.

### Technical debt

`Craft`

Accumulated shortcuts that make future change slower.

> Sometimes worth taking deliberately. The problem is undocumented debt nobody decided to incur.

Ward Cunningham's original metaphor was about a deliberate loan taken to ship and learn faster, repaid once you understood the domain — not a synonym for bad code. The useful distinction is deliberate versus accidental and prudent versus reckless, because only one of those four is a real problem. Make it visible: record it where the work is planned, attach the interest ('this adds two days to every change here'), and pay it down alongside features in the same area rather than in a rewrite quarter nobody will fund.

### Yak shaving

`Craft`

The chain of unrelated tasks you must complete before the actual task.

> Recognising it early is a skill. Timebox the detour or note it and route around.

The practical technique is to keep a scratch list as you go: write down each detour rather than following it immediately, and after each one ask whether it is still necessary for the original goal. Timebox at the moment you notice — thirty minutes, then reassess — because the sunk cost of three yaks makes the fourth feel mandatory. Some shaving is genuinely valuable (the broken local setup you just fixed will slow everyone else too); the failure is doing it unconsciously and surfacing a day later with nothing shippable.

### Bikeshedding

`Craft`

Spending disproportionate discussion on trivial details because they are easy to have opinions about.

> Automate the trivia — formatters, linters, templates — so the arguments become impossible.

Parkinson's law of triviality: a committee approving a nuclear plant waves through the reactor and argues for an hour about the bike shed, because everyone can hold an opinion on the shed. The counter is to make the trivial decision unavailable — a formatter with no options, a template, a documented convention — and to name the pattern out loud when it happens, which usually ends it. In review, labelling comments as nits does the same job at a smaller scale, by separating preference from concern.

### Rubber duck debugging

`Craft`

Explaining the problem aloud in detail, which frequently reveals the answer mid-sentence.

> Works because articulation forces you to check the assumption you skipped over silently.

It works by forcing sequential, explicit statement of things you were holding as a compressed intuition — and the assumption you skip when thinking is the one you notice when saying. Writing works as well as speaking, which is why drafting a detailed bug report so often solves the bug. Push it further with the scientific version: state the hypothesis, state what you would expect to observe if it were true, then check. 'It should be impossible for this to be null' is the sentence that most often precedes the answer.

### Estimation

`Craft`

Forecasting effort under uncertainty.

> Estimate ranges, not points. Break anything longer than three days into pieces you can actually picture.

The planning fallacy is systematic and does not improve with experience, because we estimate the path we imagine rather than the path we get. Two corrections help: reference-class forecasting (how long did the last three similar tasks actually take, including the interruptions) and decomposing until each piece is small enough to visualise, since the sum of small estimates is less biased than one big one. Be explicit about what the estimate excludes — review latency, deployment, the unfamiliar codebase — and give a range with the assumptions attached rather than a number that will be quoted back as a commitment.

### Scope creep

`Craft`

Requirements quietly expanding after work has started.

> Not inherently bad. Untracked is what makes it dangerous — write down what changed and what it cost.

The response is not refusal, it is an explicit trade: 'yes, and that adds three days — do we cut X or move the date?' — which turns an invisible slip into a decision someone owns. Distinguish genuine discovery (we learned the requirement was wrong, which is good) from accumulation (a stream of small additions nobody priced). Watch for the self-inflicted version too: gold-plating a solution beyond what was asked is scope creep with your own name on it, and it is the kind least likely to be tracked.

### Definition of done

`Craft`

The agreed bar for calling work complete — tested, reviewed, documented, deployed, monitored.

> Without one, 'done' means 'it ran on my laptop once' and the remaining 40% appears later as a surprise.

Write it once as a team checklist rather than negotiating it per ticket, and include the operational items people forget: metrics and alerts exist, the runbook is updated, the feature flag has an owner, docs reflect the change, and the migration has a rollback. Its second function is estimation honesty — if 'done' includes review and deploy, then estimates that only cover coding are visibly wrong. Keep it short enough to be real; a twenty-item checklist becomes a formality that gets ticked without being read.

### Design doc *(aka RFC)*

`Craft`

A written proposal circulated for feedback before significant work begins.

> An hour of writing routinely saves a week of building the wrong thing. Include the alternatives you rejected.

The structure that works: context and problem, goals and explicit non-goals, the proposed design, alternatives considered with the reason each was rejected, risks, and a rollout plan. Non-goals and rejected alternatives are the highest-value sections, because they stop the same debate reopening in three months and they show reviewers the shape of your thinking. Circulate early while the design is still changeable, timebox the comment period, and record the decision — an ADR — so a future reader can see why, not just what.

### Chesterton's fence

`Craft`

Do not remove something until you understand why it was put there.

> That strange conditional is probably a bug fix nobody documented. Use git blame before deleting.

The investigation is usually five minutes: git log -S to find the commit that introduced the line, then the PR and the ticket it references. When the archaeology comes up empty, do not simply leave it forever — add a test that captures the behaviour you believe it protects, remove the fence behind a flag, and watch. The complementary error is real too: leaving every fence standing produces code nobody dares change, so the principle is understand-then-decide, not never-remove.

### Boy Scout rule

`Craft`

Leave code slightly better than you found it.

> Keep cleanup in a separate commit from behaviour change, or review becomes impossible.

Slightly is the operative word: rename the misleading variable, add the missing test, delete the dead branch — improvements a reviewer can verify at a glance. A refactor larger than the change it accompanies should be its own PR, or you have made a risky change hard to review and hard to revert. The compounding argument is what makes it worth doing at all: consistent small improvements in the files people actually touch beats a scheduled cleanup project, because the files people touch are the files that matter.

### Premature optimisation

`Craft`

Optimising before measuring where time is actually spent.

> The corollary is not 'never optimise'. It is 'profile first' — intuition about bottlenecks is reliably wrong.

Knuth's full sentence includes 'in about 97% of cases', and the same paragraph insists on not passing up the critical 3% — the quote is an argument for measurement, not for indifference to performance. Profile to find where the time goes (a flame graph makes it obvious in a minute), fix the top item, and measure again, because the second bottleneck is rarely what you predicted. What is not premature is algorithmic choice and data-access shape: an N+1 query or an O(n²) loop over a growing collection is a design error, not an optimisation you deferred.

### Bus factor

`Craft`

How many people must be unavailable before a system becomes unmaintainable.

> A bus factor of one is the most common serious risk on a team, and the easiest to fix with documentation and pairing.

Find it empirically rather than by feel: git history shows which files have exactly one substantial author, and that list is your risk register. The cheap mitigations are ordinary practices used deliberately — rotate who takes work in unfamiliar areas, pair on the scary parts, insist that reviewers of critical systems change over time, and write the design docs and runbooks that make context transferable. Note that the bus factor is about knowledge, not access: a documented system with a departed author is recoverable, an undocumented one with three readers is not.
