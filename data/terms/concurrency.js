// Concurrency — More than one thing at once.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
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
    l: "edge",
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
