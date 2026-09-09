// Workers, queues & scheduling — Work that outlives a request.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
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
    level: 1,
    def: "The property of an operation that produces the same result whether it runs once or many times.",
    plain: "Pressing a lift button five times does not call five lifts. An idempotent operation is safe to repeat.",
    example: "A user double-clicks Send invoice and two identical POST requests reach the API within 200 ms. An endpoint keyed on invoice_id sends one email and returns 200 to both.",
    note: "Non-negotiable for background work. A worker can crash after charging a card and before recording it, and the retry will charge again unless you designed for this.",
    depth:
      "Implement it with a uniqueness constraint rather than a check-then-act, which is just a race with better manners: INSERT the operation key and let the database reject the duplicate. Natural idempotency is better still — SET status = 'paid' is safe to repeat, balance = balance + 10 is not, so prefer absolute writes over increments. For external calls you cannot make idempotent, record intent before acting and reconcile after: a row saying 'about to charge, key abc123' is what lets a retry ask the provider what happened instead of guessing.",
    see: ["idempotency-key","idempotent-consumer","at-least-once-vs-exactly-once","exponential-backoff"],
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
];
