// Data & state — Keeping the truth.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
  {
    t: "Transaction",
    c: "data",
    l: "data",
    def: "A group of database operations that either all succeed or all roll back together.",
    note: "The unit of correctness. If two writes must both happen or neither, they belong in one transaction.",
    depth:
      "Its boundaries are a design decision, not a detail: too narrow and you lose atomicity, too wide and you hold locks across a slow HTTP call while everyone else queues. Keep external calls, queue publishes and file writes outside — a rollback cannot un-send an email. Long transactions have a second cost in Postgres: they hold back the oldest visible snapshot, so autovacuum cannot reclaim dead rows and the table bloats while the transaction sits open.",
  },
  {
    t: "ACID",
    c: "data",
    l: "data",
    def: "Atomicity, Consistency, Isolation, Durability — the guarantees a relational database makes about transactions.",
    note: "The reason Postgres is the boring correct default. Give these up only when you can name what you get back.",
    depth:
      "Each letter has a price and a dial. Durability is fsync on commit, which is why synchronous_commit = off makes writes dramatically faster and risks the last few hundred milliseconds on a crash. Isolation is the one vendors interpret loosely — 'ACID compliant' usually means read committed, not serializable. Consistency here means your declared constraints hold, which is not the C in CAP; the two words are unrelated despite the acronyms sitting next to each other in every interview.",
  },
  {
    t: "Isolation level",
    c: "data",
    l: "data",
    def: "How much concurrent transactions can see of each other — read committed, repeatable read, serializable.",
    note: "Higher isolation means fewer anomalies and more contention. Most defaults are read committed, which permits more weirdness than people assume.",
    depth:
      "Name the anomalies and the levels stop being abstract: dirty read (seeing uncommitted data), non-repeatable read (the same row changes mid-transaction), phantom read (new rows appear), and write skew, where two transactions each read a valid state and write results that are jointly invalid — the classic 'both on-call doctors sign out simultaneously' bug. Read committed allows all but the first. Serializable prevents them and can abort your transaction with a serialization failure, so any code using it needs a retry loop.",
  },
  {
    t: "ORM",
    aka: "Object Relational Mapper",
    c: "data",
    l: "data",
    def: "A library mapping database rows to language objects — SQLAlchemy, Prisma, Hibernate.",
    note: "Convenient until it silently generates 400 queries. Learn to read the SQL your ORM emits.",
    depth:
      "The leaks are all about laziness and identity: a lazily-loaded relationship issues a query the moment you touch it, often inside a template or a loop far from the code that fetched the parent, and the session's identity map means the object you hold may be older than the row. Turn on SQL echo in development, use eager loading (joinedload, selectinload, include) deliberately, and accept that some reports are just SQL. The ORM is for the 90% of CRUD where hand-writing SQL is noise, not for the 10% where the query is the product.",
  },
  {
    t: "Migration",
    c: "data",
    l: "data",
    def: "A versioned, ordered script that changes database schema so every environment stays in sync.",
    note: "Write them to be backwards-compatible: deploy code that works with both old and new schema, then migrate, then clean up.",
    depth:
      "The expand/contract sequence is the whole discipline: add the new nullable column, deploy code writing both, backfill in batches, switch reads, then drop the old column in a later release — five steps because at every moment two versions of your code are running. Know which operations lock: adding a column with a volatile default rewrites the table, and CREATE INDEX takes a write lock unless you say CONCURRENTLY. Always set a short lock_timeout, or a migration waiting behind one long query silently blocks every write to that table.",
  },
  {
    t: "Index",
    c: "data",
    l: "data",
    def: "An auxiliary lookup structure that makes reads on a column fast.",
    note: "Missing indexes are the number one cause of slow APIs. Excess indexes slow every write. Both are real costs.",
    depth:
      "A B-tree index is only usable left-to-right: an index on (tenant_id, created_at) serves a filter on tenant_id and a filter on both, but not one on created_at alone. Wrapping the column in a function (WHERE lower(email) = …) disables it unless you built an expression index to match. Beyond the default B-tree there are GIN for arrays and JSONB, partial indexes for a hot subset (WHERE deleted_at IS NULL), and covering indexes that let the query be answered from the index alone. Check pg_stat_user_indexes for the ones nobody has scanned since the last deploy.",
  },
  {
    t: "Query plan",
    aka: "EXPLAIN",
    c: "data",
    l: "data",
    def: "The database's description of how it intends to execute your query.",
    note: "'Seq Scan' on a large table means no index is being used. Learning to read EXPLAIN output is the highest-leverage database skill.",
    depth:
      "Use EXPLAIN (ANALYZE, BUFFERS) — plain EXPLAIN gives estimates, ANALYZE actually runs it and shows reality. The single most useful comparison is estimated rows versus actual rows: a plan that expected 10 and found 400,000 chose a nested loop that will never finish, and the cause is usually stale statistics or a correlation the planner cannot see. Note that a sequential scan is the correct choice when you are reading most of a table, and remember to multiply node costs by loops when reading inner nodes.",
  },
  {
    t: "N+1 query",
    c: "data",
    l: "data",
    level: 1,
    def: "A query pattern that loads a list with one query, then runs one more query for every item in that list.",
    plain: "Asking the database for 100 orders, then going back 100 separate times to ask who placed each one, instead of asking once.",
    example: "An endpoint lists 200 orders and shows each customer's name; the ORM lazily loads customer per order, so it runs 1 + 200 queries. At 2 ms of network each, the page spends 400 ms waiting; a join or selectinload makes it 2 queries.",
    note: "Invisible in development with 10 rows, catastrophic in production with 10,000. Fixed by joins or eager loading.",
    depth:
      "The cost is round trips, not database work — 100 queries at 1ms of network each is 100ms of pure waiting even though every query is instant. Fixes ranked: a join or a second query with WHERE id = ANY(...), eager loading in the ORM, or DataLoader-style batching in GraphQL where the shape of the resolver tree makes it structural. Catch them automatically by asserting a query-count budget in tests, since the bug is invisible to any assertion about correctness.",
    see: ["orm","query-plan","index","connection-pool"],
  },
  {
    t: "Connection pool",
    c: "data",
    l: "data",
    def: "A managed set of reusable database connections shared across requests.",
    note: "Pool exhaustion is a classic outage: every connection held by a slow query, every new request queuing behind it.",
    depth:
      "Sizing is multiplicative and people forget: 10 pods × 4 workers × a pool of 20 is 800 connections against a Postgres whose max_connections is 100. Each Postgres connection is a process costing several megabytes, so more is not better — a small pool plus PgBouncer in transaction mode usually beats a large one. Always set an acquisition timeout so exhaustion surfaces as a fast error rather than a hang, and never hold a connection across an external API call.",
  },
  {
    t: "Optimistic locking",
    c: "data",
    l: "data",
    def: "Assume no conflict; check a version number on write and retry if it changed underneath you.",
    note: "Scales better than locking rows upfront, because the common case takes no lock at all.",
    depth:
      "Mechanically: UPDATE … SET value = ?, version = version + 1 WHERE id = ? AND version = ?, then check the affected row count — zero means somebody else won and you must re-read and retry. It fits long think-times, like a user editing a form for five minutes, where holding a lock is unthinkable. It converts contention into retries, so it degrades badly on a genuinely hot row: at high conflict rates you spend all your capacity retrying, and pessimistic locking becomes the faster option.",
  },
  {
    t: "Pessimistic locking",
    aka: "SELECT FOR UPDATE",
    c: "data",
    l: "data",
    def: "Locking a row when you read it so nobody else can modify it until you finish.",
    note: "Correct under heavy contention, but every lock is a queue and every queue is a latency source.",
    depth:
      "The lock lives until the transaction ends, which is why the transaction must be short and must never contain an HTTP call. Two variants earn their keep: SKIP LOCKED, which turns a table into a work queue by letting each worker grab different unlocked rows, and NOWAIT, which fails immediately instead of queuing. Lock rows in a consistent order (sort by id) or two concurrent multi-row updates will deadlock — and remember FOR UPDATE on a query with no index locks far more than you intended.",
  },
  {
    t: "Replication",
    aka: "primary / replica",
    c: "data",
    l: "data",
    def: "Copying writes from a primary database to read-only replicas.",
    note: "Spreads read load and provides failover. Introduces lag, which introduces bugs.",
    depth:
      "Asynchronous replication acknowledges the commit before the replica has it, so a failover can lose the last few transactions; synchronous waits and makes every write as slow as your slowest replica. Monitor lag in bytes and seconds, and know that a long-running query on a replica can either block replay or get cancelled by it, depending on hot_standby_feedback. Failover is the part to rehearse: promoting a replica is easy, and pointing every application at the new primary without split-brain is where the incident actually happens.",
  },
  {
    t: "Eventual consistency",
    c: "data",
    l: "data",
    def: "Replicas converge on the same state, but not instantly.",
    note: "Write then immediately read from a replica and you may not see your own change. Read from primary after writes, or design the UI to not care.",
    depth:
      "The useful vocabulary is session guarantees: read-your-writes (you see your own change), monotonic reads (you never see time go backwards), and consistent prefix. Implement read-your-writes cheaply by pinning a user to the primary for a few seconds after a write, or by passing the write's log position and having the replica wait for it. The nastiest bugs are the ones where consistency is only violated for 50ms — they pass every test and appear in production as 'I saved it and it disappeared'.",
  },
  {
    t: "Sharding",
    aka: "horizontal partitioning",
    c: "data",
    l: "data",
    def: "Splitting one logical table across multiple databases by a key such as customer ID.",
    note: "The last resort of scaling. Cross-shard joins and rebalancing are genuinely hard. Exhaust every other option first.",
    depth:
      "The shard key decides everything and cannot practically be changed later: pick one that appears in nearly every query (tenant_id), or every read becomes a scatter-gather across all shards. Hash sharding spreads load but destroys range queries; range sharding keeps them and creates hotspots. Use consistent hashing or a fixed number of logical shards mapped onto physical ones, so adding capacity moves a fraction of the data rather than all of it. Before sharding, try read replicas, partitioning within one database, and archiving cold rows — most 'we need to shard' turns out to be a missing index.",
  },
  {
    t: "Normalisation vs denormalisation",
    c: "data",
    l: "data",
    def: "Storing each fact once and joining, versus duplicating data to avoid joins.",
    note: "Normalise until it hurts, denormalise until it works. Duplicated data must have one owner responsible for updating it.",
    depth:
      "Third normal form is the sane default for transactional systems: one fact, one place, and updates cannot leave two copies disagreeing. Denormalise on evidence, and prefer a mechanism that maintains itself — a materialised view, a counter cache updated in the same transaction, a projection built from events — over a duplicated column that a future developer will forget to write. Analytics is the honest exception: a star schema is denormalised on purpose because the data is immutable once loaded, which removes the update problem entirely.",
  },
  {
    t: "Soft delete",
    c: "data",
    l: "data",
    def: "Marking a row deleted_at rather than removing it.",
    note: "Preserves history and enables undo, but every single query must now remember to filter. Forgetting once resurrects deleted data.",
    depth:
      "Enforce the filter structurally rather than by memory — a view or a default query scope that excludes deleted rows, so the unfiltered version has to be asked for explicitly. Unique constraints are the classic collision: a soft-deleted user still occupies their email address, so you need a partial unique index (WHERE deleted_at IS NULL) or a nulled-out column. And soft delete is not GDPR erasure; when a regulator says delete, they mean the bytes, which usually means a separate hard-delete job.",
  },
  {
    t: "Cache",
    c: "data",
    l: "data",
    def: "Fast temporary storage of expensive results, usually keyed with a TTL.",
    note: "Caching is easy. Invalidation — knowing when the copy became wrong — is the actual problem.",
    depth:
      "Know the patterns by name: cache-aside (read miss → load → populate, the default), read-through, write-through and write-behind. Measure hit rate before and after — a cache below roughly 80% hits often costs more in complexity and extra round trips than it saves. Include a version or schema tag in the key so a deploy that changes the serialised shape cannot deserialise last week's objects, and never cache anything user-specific under a key that omits the user id, which is how one customer sees another's dashboard.",
  },
  {
    t: "TTL",
    aka: "time to live",
    c: "data",
    l: "data",
    def: "How long a cached value stays valid before expiring.",
    note: "Short TTLs waste the cache; long ones serve stale data. Stagger them so entries do not all expire at once.",
    depth:
      "Derive it from tolerance for staleness, not from a round number: if the business can live with a 5-minute-old count, a 5-minute TTL turns a per-request query into 12 queries an hour. Add ±10% jitter as a default so a batch populated together does not expire together. Note that Redis eviction is not the same as expiry — under maxmemory with an LRU policy, keys disappear before their TTL, so nothing may assume a key it just wrote still exists.",
  },
  {
    t: "Cache invalidation",
    c: "data",
    l: "data",
    def: "Removing or refreshing a cached value when the underlying truth changes.",
    note: "Write-through, write-behind, and event-driven invalidation are the three families. Pick one deliberately rather than mixing them accidentally.",
    depth:
      "Deleting the key beats updating it: two concurrent writers updating a cached value can interleave and leave the stale one last, whereas a delete makes the next reader re-derive from the source. Key design is what makes invalidation possible — if a single key holds a composed dashboard, any change invalidates all of it, so cache the parts. When you cannot enumerate dependents, versioned namespaces are the escape hatch: bump user:42:v and every key under the old version becomes unreachable and expires on its own.",
  },
  {
    t: "Cache stampede",
    c: "data",
    l: "data",
    def: "Mass simultaneous cache misses overwhelming the origin.",
    note: "Same shape as the thundering herd. The fix is a lock on rebuild plus serving stale-while-revalidate.",
    depth:
      "The worst version is a cold start after a Redis restart or a flush, when every key misses at once and the database receives your entire read traffic with no cache in front of it — which is why a cache your system cannot survive losing is not a cache, it is an undeclared dependency. Defences: warm critical keys on boot, hold a short per-key rebuild lock so one request recomputes while others serve stale, and rate-limit origin fetches so the database sees a survivable trickle rather than a wall.",
  },
  {
    t: "Blob storage",
    aka: "object storage, S3",
    c: "data",
    l: "data",
    def: "Storage for large unstructured files, addressed by key rather than queried.",
    note: "Never store uploaded files in your database. Store them in object storage and keep the URL in the row.",
    depth:
      "Uploads and downloads should not pass through your application at all: issue a presigned URL and let the client talk to S3 directly, or a single 200MB upload occupies a worker for its whole duration. Objects are immutable — you replace, never patch — and listing is a paginated scan, not a query, so any lookup you need must live in your database. Lifecycle rules move cold objects to cheaper tiers automatically, and versioning plus a deny-delete policy is what makes the bucket ransomware-resistant.",
  },
  {
    t: "Backup vs snapshot",
    c: "data",
    l: "data",
    def: "A backup is an exportable copy of data. A snapshot is a point-in-time image of a volume.",
    note: "An untested backup is a rumour. Restore drills are the only proof.",
    depth:
      "State the two numbers explicitly: RPO, how much data you can afford to lose (set by backup frequency plus WAL archiving), and RTO, how long a restore takes — a 2TB database that restores in six hours means a six-hour outage, whatever the backup schedule says. Snapshots usually live in the same account and region as the thing they protect, so they survive a disk failure and not a compromised account; a real backup is offsite, versioned and immutable. Point-in-time recovery via continuous WAL shipping is what lets you rewind to the minute before the bad DELETE.",
  },
  {
    t: "Data retention",
    c: "data",
    l: "data",
    def: "Policy for how long data is kept before deletion, often legally mandated.",
    note: "GDPR and similar laws make 'we keep everything forever' a liability rather than an asset.",
    depth:
      "Retention has to be enforced by a job, not by a wiki page, and the job has to reach every copy — the warehouse, the search index, the backups, the logs, the CSV someone exported to a bucket in 2021. Different classes get different clocks: financial records may be legally required for seven years while behavioural logs should expire in 90 days, so one global setting is always wrong. Deleting on schedule is also a performance feature; the fastest query is the one against a table that is not carrying a decade of dead rows.",
  },
  {
    t: "PII",
    aka: "personally identifiable information",
    c: "data",
    l: "data",
    def: "Data identifying a specific person — names, emails, addresses, device IDs.",
    note: "Know where yours lives before someone asks you to delete it. Never log it.",
    depth:
      "It spreads further than the obvious columns: an IP address, a device id, a precise timestamp and a free-text support ticket are all PII, and combining three non-identifying fields frequently re-identifies someone. Practical controls are structural — tag PII columns in the schema, redact at the logging formatter so nobody has to remember at each call site, and keep production data out of staging by generating fake data instead of copying and masking. Special categories (health, biometrics, politics) carry stricter rules and belong in a separate, more tightly controlled store.",
  },
];
