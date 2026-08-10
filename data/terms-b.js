export const TERMS_B = [
  // ── DATA & STATE ──────────────────────────────────────────────
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
    def: "Fetching a list, then issuing one more query per item — 101 queries where 2 would do.",
    note: "Invisible in development with 10 rows, catastrophic in production with 10,000. Fixed by joins or eager loading.",
    depth:
      "The cost is round trips, not database work — 100 queries at 1ms of network each is 100ms of pure waiting even though every query is instant. Fixes ranked: a join or a second query with WHERE id = ANY(...), eager loading in the ORM, or DataLoader-style batching in GraphQL where the shape of the resolver tree makes it structural. Catch them automatically by asserting a query-count budget in tests, since the bug is invisible to any assertion about correctness.",
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

  // ── APIs & NETWORKING ─────────────────────────────────────────
  {
    t: "REST",
    c: "api",
    l: "edge",
    def: "An architectural style modelling the API as resources at URLs, manipulated with HTTP verbs.",
    note: "Nouns in the path, verbs in the method. /users/42/orders, not /getUserOrders?id=42.",
    depth:
      "Working with HTTP rather than tunnelling through it is what pays: correct verbs make GET cacheable by every proxy in the path, ETags and If-None-Match make conditional requests cheap, and 404 versus 409 tells a client something without parsing a body. Full REST as Fielding defined it includes hypermedia, which almost nobody implements and which is fine. Be pragmatic where resources do not fit — an action like POST /orders/42/cancel is clearer than contorting the model to avoid a verb.",
  },
  {
    t: "GraphQL",
    c: "api",
    l: "edge",
    def: "A query language where the client specifies exactly which fields it wants in one request.",
    note: "Solves over-fetching for complex clients. Trades it for caching difficulty and N+1 problems on the server.",
    depth:
      "Two operational costs arrive with it. Resolvers execute per field, so nested lists generate the N+1 pattern by construction, and DataLoader-style per-request batching is not optional. And because a client can request an arbitrarily deep, expensive query, a public endpoint needs query depth limits, complexity scoring and persisted queries — otherwise one crafted query is a denial of service. HTTP caching mostly stops working because everything is a POST to one URL, pushing caching into your resolvers.",
  },
  {
    t: "gRPC",
    c: "api",
    l: "edge",
    def: "A binary RPC protocol using Protocol Buffers over HTTP/2.",
    note: "Fast and strongly typed, the common choice for service-to-service traffic. Awkward directly from browsers.",
    depth:
      "The schema is the contract and it evolves by rule: never reuse or renumber a field tag, add new fields as optional, and reserve deleted ones so a future author cannot recycle the number. HTTP/2 multiplexes many calls over one long-lived connection, which is fast and defeats connection-level load balancers — you need an L7 proxy or client-side balancing or all traffic pins to one backend. Streaming in all four combinations is built in, and grpc-web plus a proxy is what makes it reachable from a browser.",
  },
  {
    t: "WebSocket",
    c: "api",
    l: "edge",
    def: "A persistent two-way connection, so the server can push without being asked.",
    note: "Stateful, which complicates load balancing and deploys. Use Server-Sent Events if you only need one direction.",
    depth:
      "Each connection is memory plus a file descriptor held for its lifetime, so 50,000 concurrent clients is a capacity planning exercise, not a detail. Fan-out across instances needs a backplane — Redis pub/sub or similar — because the user you want to notify is connected to a different pod. Send application-level pings, since a dead TCP connection can look alive for minutes, and expect every deploy to disconnect everyone, so the client needs reconnect with backoff and the server needs a way to resend anything missed.",
  },
  {
    t: "Idempotent method",
    c: "api",
    l: "edge",
    def: "GET, PUT and DELETE produce the same state however many times they are called. POST does not.",
    note: "Clients retry on timeout without knowing whether the first attempt landed. Design assuming they will.",
    depth:
      "Idempotent and safe are different properties: GET and HEAD are safe (no state change at all), while DELETE is idempotent but not safe — and the distinction matters because intermediaries feel free to retry safe methods on their own. This is why a GET that mutates is a real bug: a link prefetcher or a crawler will trigger it. When POST is genuinely required, an idempotency key restores retry safety, and it is the standard because timeouts never tell you which side of the write they landed on.",
  },
  {
    t: "HTTP status codes",
    c: "api",
    l: "edge",
    def: "2xx success, 3xx redirect, 4xx caller's fault, 5xx server's fault.",
    note: "401 means not authenticated; 403 means authenticated but not permitted. Returning 200 with an error body defeats every monitoring tool you own.",
    depth:
      "The class boundary is an operational one: 5xx should page you and 4xx should not, so mapping a validation failure to 500 poisons your error budget with user typos. Learn the specific ones that carry information — 201 with a Location header, 202 for accepted-and-processing-asynchronously, 409 for a state conflict, 422 for a well-formed request that fails business rules, 503 with Retry-After for shedding load. Deliberately returning 404 instead of 403 is a legitimate choice when the existence of a resource is itself confidential.",
  },
  {
    t: "429 Too Many Requests",
    c: "api",
    l: "edge",
    def: "The rate-limit response, ideally with a Retry-After header telling the client when to return.",
    note: "Honouring Retry-After is the difference between a well-behaved client and a denial-of-service source.",
    depth:
      "Send the whole picture: X-RateLimit-Limit, -Remaining and -Reset let a well-written client slow down before it is refused, which is far cheaper for both sides than a wall of rejections. On your own client side, treat 429 as retryable with backoff but count it against a global budget — retrying a rate limit aggressively is how you stay rate-limited. Note the difference from 503: 429 says you specifically are asking too often, 503 says the service as a whole is out of capacity.",
  },
  {
    t: "Authentication vs authorization",
    aka: "authn / authz",
    c: "api",
    l: "edge",
    def: "Authentication proves who you are. Authorization decides what you may do.",
    note: "Two separate systems that people merge into one confused middleware and regret later.",
    depth:
      "Authentication happens once at the edge; authorization has to happen at every resource, because the question 'may this user see this specific record' cannot be answered by a token alone. That is the source of the most common serious API bug — an authenticated user changing an id in the URL and reading somebody else's data (IDOR). Push the tenant or owner check into the query itself (WHERE id = ? AND account_id = ?) rather than a separate if-statement, so forgetting it returns nothing rather than everything.",
  },
  {
    t: "JWT",
    aka: "JSON Web Token",
    c: "api",
    l: "edge",
    def: "A signed token carrying claims about the user, verifiable without a database lookup.",
    note: "Stateless and fast, but genuinely hard to revoke. Keep expiry short and pair with refresh tokens.",
    depth:
      "Signed is not encrypted — the payload is base64, readable by anyone holding the token, so never put secrets in it. Validate strictly: pin the expected algorithm rather than trusting the header (the alg: none and RS256-to-HS256 confusions are classics), and check iss, aud and exp, not just the signature. Revocation is the real constraint: 15-minute access tokens with rotating refresh tokens and a small denylist is the standard compromise, because a stateless token you can instantly revoke is just a session with extra steps.",
  },
  {
    t: "OAuth2",
    c: "api",
    l: "edge",
    def: "A delegation protocol letting a user grant an application limited access to their data elsewhere.",
    note: "'Sign in with Google' is OIDC layered on OAuth2. Never implement the flow yourself from scratch.",
    depth:
      "Authorization code with PKCE is the flow to use for everything with a user, including single-page and mobile apps; the implicit flow is deprecated and client credentials is for machine-to-machine only. The parameters exist for reasons — state prevents CSRF on the callback, PKCE prevents a stolen code being redeemed by another app, and redirect URIs must be exact-matched or you have built an open redirect that leaks codes. Remember the layering: OAuth2 grants access to APIs, OIDC's id_token is the part that says who logged in.",
  },
  {
    t: "Session",
    c: "api",
    l: "edge",
    def: "Server-side state identified by a cookie, revocable at any moment.",
    note: "Less fashionable than JWT and often the better choice, particularly for browser-facing apps.",
    depth:
      "The cookie flags are the security model: HttpOnly (JavaScript cannot read it, so XSS cannot steal it), Secure, and SameSite=Lax or Strict for CSRF. Store sessions in Redis rather than instance memory so any pod can serve any request and sticky sessions stop being necessary. Rotate the session id on login to prevent fixation, keep both an idle timeout and an absolute one, and give the user a way to see and revoke active sessions — the instant revocation JWTs cannot do is the entire reason to prefer this.",
  },
  {
    t: "CORS",
    c: "api",
    l: "edge",
    def: "A browser rule blocking cross-origin requests unless the server explicitly permits them.",
    note: "A browser-only mechanism and not a security boundary — curl ignores it entirely. It stops other websites, not attackers.",
    depth:
      "It protects the user's credentials, not your server: the browser blocks a script on evil.com from reading a response your API returned with the user's cookies attached. Note that the request usually still reaches you and executes — CORS hides the response, so a non-idempotent GET has already run. Never combine Access-Control-Allow-Origin: * with Allow-Credentials: true (browsers refuse it, and reflecting the Origin header to work around it means any site can read authenticated responses). Echo an origin only from an allowlist.",
  },
  {
    t: "Preflight request",
    c: "api",
    l: "edge",
    def: "An automatic OPTIONS request browsers send before certain cross-origin calls.",
    note: "The invisible cause of 'it works in Postman but not the browser'.",
    depth:
      "It fires when the request is not 'simple' — any custom header such as Authorization, a JSON content type, or a method beyond GET/POST/HEAD — and the response must list the allowed methods and headers explicitly, wildcards included. Access-Control-Max-Age caches the answer (browsers cap it around 2 hours, Chrome at 600s) which matters because otherwise every API call becomes two round trips. Preflights must not require authentication: the browser sends OPTIONS without credentials, so auth middleware that rejects it breaks every cross-origin call.",
  },
  {
    t: "Webhook",
    c: "api",
    l: "edge",
    def: "An inversion of polling: the other service calls your endpoint when something happens.",
    note: "Always verify the signature, always respond fast and process asynchronously, always expect duplicates.",
    depth:
      "The correct handler shape is: verify the HMAC over the raw body (not the re-serialised JSON, whose key order will differ), check the timestamp to block replays, enqueue, return 200 in milliseconds. Providers time out at a few seconds and retry with backoff, so slow processing manufactures the duplicates you then have to deduplicate by event id. Also expect out-of-order delivery — 'subscription cancelled' can arrive before 'subscription created' — so treat events as hints and re-fetch authoritative state when it matters.",
  },
  {
    t: "Polling vs long polling",
    c: "api",
    l: "edge",
    def: "Asking repeatedly for updates, versus holding the request open until there is something to say.",
    note: "Polling is simple and wasteful. Choose it anyway when volume is low — simplicity has real value.",
    depth:
      "Do the arithmetic before choosing: 10,000 clients polling every 5 seconds is 2,000 requests per second of mostly-empty responses, which is when the waste stops being theoretical. Cheap improvements first — ETag plus If-None-Match turns most polls into a 304 with no body and no query. Long polling holds a connection per waiting client, so it has the same capacity profile as WebSockets without the protocol; Server-Sent Events is usually the better one-directional answer, since it reconnects automatically and rides ordinary HTTP.",
  },
  {
    t: "Rate limiting",
    c: "api",
    l: "edge",
    def: "Capping how many requests a client may make in a window.",
    note: "Token bucket permits bursts; leaky bucket smooths them. Rate limit by user, not just by IP.",
    depth:
      "Fixed windows have a boundary flaw — a client can send the full quota at 11:59:59 and again at 12:00:00, doubling the intended rate — so use a sliding window or a token bucket. Enforce it in shared storage (a Redis INCR with an expiry, or a Lua script for atomicity) or each instance enforces its own limit and the effective cap multiplies by replica count. Limit different things separately: login attempts per account, expensive endpoints per user, and everything per IP as a coarse backstop, remembering that NAT puts an office behind one address.",
  },
  {
    t: "Timeout",
    c: "api",
    l: "edge",
    def: "The maximum time to wait for a response before giving up.",
    note: "Every outbound call needs one. A missing timeout turns one slow dependency into a total outage as threads pile up.",
    depth:
      "There are several and libraries default them separately: connect, read/socket, and total request time — an HTTP client with only a connect timeout will still hang forever on a server that accepts and never replies. Budget them as a hierarchy: if your endpoint promises 2 seconds, three downstream calls cannot each be allowed 2. Set the caller's timeout above the callee's own, or the callee finishes work nobody is listening for. Deadline propagation (passing remaining time downstream) is what makes this rigorous in a service mesh.",
  },
  {
    t: "Circuit breaker",
    c: "api",
    l: "edge",
    def: "After repeated failures, stop calling a dependency entirely for a cool-down period.",
    note: "Protects both sides: you fail fast, they get room to recover instead of being hammered while down.",
    depth:
      "Three states: closed (normal), open (fail immediately without calling), half-open (let a single trial request through and close again if it succeeds). Trip on an error rate over a rolling window with a minimum request volume, not on a raw count, or a breaker opens on two failures out of three requests at 3am. It must be paired with a fallback — cached data, a default, a degraded response — because a breaker without one only converts a slow failure into a fast one, which is better for the system and identical for the user.",
  },
  {
    t: "Retry storm",
    aka: "cascading failure",
    c: "api",
    l: "infra",
    def: "Retries amplifying load on an already-failing service until the whole system collapses.",
    note: "This is why retries need backoff, jitter, and a hard cap. Naive retry logic converts a blip into an outage.",
    depth:
      "Amplification multiplies through layers: 3 retries at each of three tiers is 27 requests for one user action, so a service already at capacity receives an order of magnitude more load precisely when it can least handle it. Retry at one layer only — usually the outermost, closest to the user's intent — and make the others fail fast. A retry budget (cap retries at, say, 10% of total requests) is the systemic control, and load shedding at the receiving end is what stops the collapse when everything upstream still misbehaves.",
  },
  {
    t: "Graceful degradation",
    c: "api",
    l: "app",
    def: "Serving a reduced but useful response when a dependency is unavailable.",
    note: "Recommendations down? Show popular items. Partial service beats an error page nearly every time.",
    depth:
      "It starts with classifying dependencies as critical or optional and writing it down — the database behind checkout is critical, the recommendation service is not, and code should treat them differently rather than uniformly try/except. Make the degradation visible: a stale-data banner or a metric that counts fallback activations, because the real danger is degrading silently for three weeks. Feature flags give you the manual version of the same control, letting you switch off an expensive feature during an incident instead of hoping a breaker does it.",
  },
  {
    t: "Pagination",
    c: "api",
    l: "edge",
    def: "Returning results in pages. Offset-based is simple; cursor-based is stable under concurrent inserts.",
    note: "Offset pagination on a live feed shows duplicates and skips items. Use cursors for anything that changes.",
    depth:
      "OFFSET also degrades: the database must produce and discard every skipped row, so page 5,000 is slow in a way page 1 never suggested. Keyset pagination — WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT 20 — is O(1) per page and needs the tie-breaker column, since timestamps collide. Cursors should be opaque (encode the key, do not expose it), and a total count is expensive enough that most large APIs simply return has_more instead.",
  },
  {
    t: "API versioning",
    c: "api",
    l: "edge",
    def: "Serving multiple contract versions — /v1/, /v2/ — so clients migrate on their own schedule.",
    note: "You cannot force mobile clients to update. Once published, an API is a promise.",
    depth:
      "Most changes should not need a version at all: adding an optional field or a new endpoint is backwards-compatible if clients tolerate unknown fields, which is worth stating in your docs as a contract. Reserve a version bump for removals, renames, type changes and semantic changes — and note that changing the meaning of a field while keeping its name is the breaking change nobody catches. Version in the path for simplicity, keep the number of live versions small, and publish a deprecation date with usage metrics per version so you can prove who is still on v1.",
  },
  {
    t: "Contract",
    aka: "OpenAPI, Swagger",
    c: "api",
    l: "edge",
    def: "A machine-readable specification of every endpoint, parameter, and response shape.",
    note: "Generates docs, clients, and tests from one source. FastAPI produces it automatically from your schemas.",
    depth:
      "The choice is spec-first (design the contract, generate server stubs and client SDKs, parallelise front-end and back-end work) or code-first (generate the spec from types, which cannot drift because it is derived). Either beats a hand-written document that lies. The spec is also executable leverage: diff it in CI to detect breaking changes automatically, drive contract tests, and generate typed clients so a renamed field is a compile error in the consumer rather than a null at runtime.",
  },
  {
    t: "Load balancer",
    c: "api",
    l: "infra",
    def: "A component distributing incoming traffic across many instances.",
    note: "Also handles TLS termination, health checks, and draining. Prerequisite for horizontal scaling.",
    depth:
      "Layer 4 forwards TCP and is fast but blind; layer 7 understands HTTP and can route by path, retry idempotent requests and terminate TLS. The algorithm matters more than people expect: round-robin is fine for uniform requests, and least-connections is much better when durations vary, because round-robin will happily hand a new request to the instance already stuck on ten slow ones. Health checks should hit a readiness endpoint, not /, and the deregistration delay is what makes deploys invisible.",
  },
  {
    t: "Reverse proxy",
    c: "api",
    l: "infra",
    def: "A server sitting in front of your application, forwarding requests to it.",
    note: "Nginx, Caddy, Envoy. Handles TLS, compression, static files and rate limiting so your app does not have to.",
    depth:
      "It is also a buffer: nginx reads a slow client's request fully before forwarding, which protects your application workers from Slowloris-style attacks that hold connections open by trickling bytes. Watch three settings — proxy_read_timeout (60s by default and the cause of many mysterious 504s), client_max_body_size (1MB by default, the cause of most 413s on upload), and X-Forwarded-For, which your app must be configured to trust or every client IP in your logs is the proxy's.",
  },
  {
    t: "API gateway",
    c: "api",
    l: "edge",
    def: "A single entry point in front of many services, centralising auth, rate limits and routing.",
    note: "Removes duplicated cross-cutting logic from every service. Becomes a bottleneck if you put business logic in it.",
    depth:
      "It earns its place by doing what every service would otherwise duplicate: token validation, rate limiting, request id injection, and a consistent error shape. The failure mode has a name — the smart pipe — where routing rules accumulate transformations and conditionals until deploying a feature means editing gateway config, and the gateway becomes a shared bottleneck owned by nobody. Keep it dumb, keep the config in version control with the services, and remember services must still authorize internally: a gateway that authenticates does not mean the service can trust any caller.",
  },
  {
    t: "DNS",
    c: "api",
    l: "infra",
    def: "The system translating names into IP addresses.",
    note: "It is always DNS. Propagation delay and cached negative lookups explain a suspicious share of 'it works for me'.",
    depth:
      "Caching happens at several layers you do not control — resolver, OS, and the application runtime, and some HTTP clients and JVMs cache a resolved address for the process's lifetime, so a failover changes the record and your service keeps calling the dead IP. Lower the TTL to 60s days before a planned migration, since the change only takes effect after the old TTL expires. Know the record types you actually use (A, AAAA, CNAME, and why a CNAME cannot sit at the apex), and be aware that negative answers are cached too, so a record created a minute ago can stay NXDOMAIN for a while.",
  },
  {
    t: "TLS / HTTPS",
    c: "api",
    l: "edge",
    def: "Encryption in transit, plus verification that the server is who it claims to be.",
    note: "Certificate expiry is an entirely preventable outage that still happens constantly. Automate renewal and alert on it.",
    depth:
      "The handshake costs a round trip (TLS 1.3) or two (1.2), which is why connection reuse and keep-alive matter more than the cipher choice. Certificates are chains: a browser may accept a server that curl rejects because the browser had the intermediate cached and your server failed to send it, so always serve the full chain. Alert at 30 and 14 days remaining, monitor from outside your network, and remember that internal service-to-service TLS needs the same automation — a self-signed cert that someone made by hand in 2023 is a scheduled outage nobody has scheduled.",
  },
  {
    t: "Idempotent retry budget",
    c: "api",
    l: "edge",
    def: "A cap on what fraction of total traffic may be retries.",
    note: "Prevents the system from spending all its capacity retrying itself during a partial failure.",
    depth:
      "Implement it as a token bucket per client-service pair, refilled from successful requests: retries can consume up to about 10% of the success rate, and when the bucket empties, failures propagate immediately instead of being retried. The property this buys is that retry load scales with success, so a dependency at 0% availability receives zero retry amplification rather than the maximum. It is the client-side complement to load shedding, and Google's SRE book documents it as one of the highest-leverage protections against cascading failure.",
  },

  // ── ARCHITECTURE ──────────────────────────────────────────────
  {
    t: "Monolith",
    c: "architecture",
    l: "craft",
    def: "One deployable application containing all functionality.",
    note: "The correct default for most teams. A well-structured monolith beats badly-drawn microservices every time.",
    depth:
      "What it gives you is enormous and easy to undervalue: refactoring across boundaries with a compiler's help, real transactions across your whole domain, one place to look in a debugger, and no network between components. What it costs is coupled deploys, one shared resource profile, and a test suite whose runtime grows with the company. Notice that most of those costs are addressable — modularise, split the test suite, use feature flags to decouple deploy from release — while the distributed-systems costs of splitting are not.",
  },
  {
    t: "Microservices",
    c: "architecture",
    l: "craft",
    def: "Many small independently deployable services, each owning its data.",
    note: "Trades in-process function calls for network calls that can fail. Buys independent scaling and deploys. Know which you need.",
    depth:
      "The honest prerequisites are organisational and operational: independent deploy pipelines, distributed tracing, centralised logging, contract tests, and a team per service — Conway's law means the split only holds if the org matches it. The reliability arithmetic is unforgiving too: a request touching five services at 99.9% each is 99.5% overall, so resilience patterns are mandatory rather than nice. If two services must deploy together or share a database, they are one service with extra latency.",
  },
  {
    t: "Modular monolith",
    c: "architecture",
    l: "craft",
    def: "A single deployable with strictly enforced internal module boundaries.",
    note: "Most of the discipline of microservices, none of the distributed-systems tax. Underrated.",
    depth:
      "Enforcement is the whole trick, and it must be mechanical: an import linter, an architecture test, or a build system that fails when billing imports from inventory's internals rather than its public interface. Give each module its own schema or table prefix and forbid cross-module joins, so extraction later is a mechanical change rather than an archaeology project. The payoff is optionality — you keep in-process calls and one deploy today, and any module that outgrows the process already has a clean seam to leave through.",
  },
  {
    t: "Coupling vs cohesion",
    c: "architecture",
    l: "craft",
    def: "Coupling is how much modules depend on each other. Cohesion is how related the contents of one module are.",
    note: "Aim for low coupling and high cohesion. Nearly every structural argument reduces to this pair.",
    depth:
      "Coupling comes in flavours with very different costs: temporal (A must run before B), data (both read the same table), and content (A reaches into B's internals) — and a shared database is the highest-cost form because a schema change breaks a service that never imported anything. The empirical proxy for cohesion is co-change: files that always change together belong together, which you can literally mine from git history. Low cohesion is why a util/ package eventually depends on everything and everything depends on it.",
  },
  {
    t: "Stateless service",
    c: "architecture",
    l: "app",
    def: "A service holding no per-user memory between requests, so any instance can serve any request.",
    note: "The precondition for horizontal scaling. Push state into the database, cache, or the token.",
    depth:
      "The state that sneaks in is rarely a variable named state: an in-memory rate limiter that becomes ten limiters, a local file upload directory, a scheduler timer running in every replica, an in-process cache that makes two users see different answers. Test it by killing a random instance mid-session and confirming nobody notices. Note that stateless does not mean caching is banned — it means the correctness of a request must not depend on which instance served the previous one.",
  },
  {
    t: "Horizontal vs vertical scaling",
    c: "architecture",
    l: "infra",
    def: "More machines versus a bigger machine.",
    note: "Vertical is simpler and has a ceiling. Horizontal is unbounded and requires statelessness.",
    depth:
      "Vertical scaling is under-rated and often the right first move: a machine with 128 cores and 1TB of RAM costs less than the engineering time to shard, and it usually needs a restart rather than a redesign. Its limits are the ceiling and the single failure domain — one box means one outage. Horizontal adds coordination cost that grows with instance count (connection pools, cache coherence, distributed locks), and the shared database is usually the real ceiling, so adding stateless replicas past a point moves the bottleneck without lifting it.",
  },
  {
    t: "Dependency injection",
    c: "architecture",
    l: "app",
    def: "Passing a component its dependencies rather than letting it construct them internally.",
    note: "The thing that makes testing possible. If a class instantiates its own database client, you cannot test it without a database.",
    depth:
      "You rarely need a framework — constructor arguments plus one composition root at the entry point covers most applications, and the wiring being explicit is a feature when you are reading unfamiliar code. Frameworks (FastAPI's Depends, Spring, Guice) add scoping, which is where they earn their keep: request-scoped sessions and singleton clients. The design pressure it creates is the real benefit: a constructor with nine dependencies is telling you the class does nine things.",
  },
  {
    t: "Inversion of control",
    c: "architecture",
    l: "app",
    def: "The framework calls your code rather than your code calling the framework.",
    note: "Why you write a route handler and never write the loop that accepts sockets.",
    depth:
      "The cost is that control flow becomes invisible — you cannot follow a call chain to find out why your handler ran, so you have to know the framework's lifecycle: middleware order, startup and shutdown hooks, and where exceptions are caught. Two practical consequences: an exception thrown in a place the framework does not expect may be swallowed and logged in a format you never see, and initialisation order bugs (using a client before the startup hook created it) present as null rather than as a stack trace at the real cause.",
  },
  {
    t: "Single source of truth",
    c: "architecture",
    l: "data",
    def: "One authoritative location for each piece of data or configuration.",
    note: "Two places that must agree will eventually disagree, silently, at the worst time.",
    depth:
      "When duplication is genuinely required — a cache, a search index, a read model — make the relationship explicit and one-directional: a derived copy is rebuilt from the source, never edited, and can be thrown away and regenerated at any time. That regenerability is the test. The same applies to configuration: an environment variable and a config file that both set a timeout will disagree eventually, so pick one owner and have the other read from it, ideally with a reconciliation check that alerts on divergence.",
  },
  {
    t: "Separation of concerns",
    c: "architecture",
    l: "craft",
    def: "Each component handles one aspect of the system and does not reach into others.",
    note: "The principle behind layering, and the reason a route handler should never contain SQL.",
    depth:
      "The practical test is the reason for change: if a function must be edited both when the tax rules change and when the email template changes, it holds two concerns. Cross-cutting concerns — logging, auth, tracing, transactions — are the hard case, since they touch everything by nature; handle them in middleware or decorators so they appear once rather than in every function. Beware of splitting for its own sake: three files that must always be edited together are not separated concerns, they are one concern with extra imports.",
  },
  {
    t: "Event-driven architecture",
    c: "architecture",
    l: "app",
    def: "Services emit events about what happened; interested services subscribe and react.",
    note: "Decouples producers from consumers, at the cost of making end-to-end flow much harder to trace.",
    depth:
      "Events state facts in the past tense (OrderPlaced) and must not name a recipient — the moment an event says 'send confirmation email', it is a command wearing a costume and the coupling is back. Debugging is genuinely harder: there is no stack trace across a broker, so correlation ids and distributed tracing are prerequisites rather than improvements. Choose the payload deliberately: a thin event with just an id forces every consumer to call back for details, while a fat event is self-contained and immediately stale.",
  },
  {
    t: "CQRS",
    c: "architecture",
    l: "data",
    def: "Command Query Responsibility Segregation — separate models for writing and for reading.",
    note: "Genuinely useful when read and write loads differ wildly. Overkill almost everywhere else.",
    depth:
      "There is a spectrum, and the cheap end is often enough: separate read and write methods in one class, then separate models over one database, then a fully separate read store updated asynchronously. Only the last introduces eventual consistency, and with it the UI problem where a user saves and immediately does not see their change — which is why teams that adopt it usually end up returning the new state from the command anyway. Justify it with a real asymmetry (1000:1 read/write, or reads needing a shape writes cannot serve), not with tidiness.",
  },
  {
    t: "Event sourcing",
    c: "architecture",
    l: "data",
    def: "Storing the sequence of events that occurred rather than the current state, deriving state by replay.",
    note: "Perfect audit history and time travel. Also schema evolution pain that lasts for years.",
    depth:
      "Replaying from the beginning stops being viable quickly, so you need snapshots every N events plus projections that materialise queryable views — and rebuilding a projection is a batch job you must be able to run in production. The permanent cost is that events are immutable: a v1 event written three years ago must still be readable by today's code, so you carry upcasters forever. GDPR erasure is the other structural problem, since you cannot delete from an append-only log; the standard answer is crypto-shredding, storing personal data encrypted and destroying the key.",
  },
  {
    t: "Saga",
    c: "architecture",
    l: "app",
    def: "A sequence of local transactions across services, with compensating actions to undo earlier steps on failure.",
    note: "How you get something transaction-shaped when a distributed transaction is not available.",
    depth:
      "Compensation is not rollback — you cannot un-charge a card, you issue a refund, which is a new visible fact — so the intermediate states must be legal in your domain and in your UI. Two styles: choreography, where each service reacts to events (simple at three steps, unreadable at eight), and orchestration, where a coordinator holds the state machine explicitly and is usually worth the extra component. Every step needs an idempotent compensator, and you must handle the case where the compensator itself fails, which is why a saga needs durable state and a stuck-saga alert.",
  },
  {
    t: "Idempotent consumer",
    c: "architecture",
    l: "app",
    def: "A message handler safe to invoke repeatedly with the same message.",
    note: "The practical alternative to chasing exactly-once delivery. Build this and duplicate messages stop mattering.",
    depth:
      "Implement with a processed-messages table keyed on the event id, written in the same transaction as the effect — that atomicity is the point, since recording separately reopens the crash window you were closing. Give the table a TTL matched to the broker's maximum retry horizon so it does not grow forever. Where the handler's effect is naturally idempotent (an upsert, an absolute state set), skip the table entirely; where it is an external call, pass an idempotency key derived from the event id and let the provider deduplicate.",
  },
  {
    t: "Twelve-Factor App",
    c: "architecture",
    l: "craft",
    def: "A set of principles for cloud-native apps: config in the environment, stateless processes, logs to stdout.",
    note: "Two decades old and still the fastest way to make an application deployable anywhere.",
    depth:
      "The factors that still carry the most weight: config in the environment (so one image runs in every environment), logs as an event stream to stdout (so the platform owns collection, not your app), dev/prod parity, and treating backing services as attached resources reachable by URL. Two have aged: strict statelessness is awkward for a stateful service, and secrets in environment variables are now considered weak, since they leak into crash dumps, child processes and /proc — a secrets manager or mounted file is the current practice.",
  },
  {
    t: "Bounded context",
    c: "architecture",
    l: "craft",
    def: "A boundary within which a term has one precise meaning.",
    note: "'Customer' means something different to billing and to support. Forcing one shared model is how schemas become unusable.",
    depth:
      "The tell that you have crossed one is a field like status with fourteen possible values, half of which are meaningless to any given consumer — that is two models fused into one. Contexts connect through explicit relationships (shared kernel, customer/supplier, anti-corruption layer), and naming which one you have prevents the accidental version where one team's refactor breaks another. Contexts are also the most defensible line to split services along, because a boundary drawn where the language changes tends to be where change itself stops propagating.",
  },
  {
    t: "Anti-corruption layer",
    c: "architecture",
    l: "app",
    def: "A translation layer isolating your model from an external system's model.",
    note: "Keeps a vendor's strange data shapes from colonising your entire codebase.",
    depth:
      "Concretely it is one module that owns the vendor SDK, converts their types to yours, maps their error codes to your exceptions, and is the only place their names appear — so migrating from Stripe to Adyen, or absorbing a breaking API change, is a change in one directory. It is also the natural place for retries, the circuit breaker, and the recorded fixtures your tests replay. The cost is a layer of mapping code that feels redundant on day one and saves a quarter of work the first time the vendor changes anything.",
  },
  {
    t: "Blast radius",
    c: "architecture",
    l: "infra",
    def: "How much of the system a single failure can take down.",
    note: "The metric behind bulkheads, cell-based architecture, and not sharing one database between everything.",
    depth:
      "Reduce it along whichever axis your failures actually travel: by tenant (cells, so one customer's traffic spike cannot affect another's), by region, by dependency (separate pools), and by change (canary and progressive rollout, so a bad deploy meets 1% of traffic first). Shared infrastructure is where it silently grows — one Redis, one cluster, one IAM role, one CI runner — and the question worth asking in design review is simply: if this component is entirely gone for an hour, who notices?",
  },
  {
    t: "Bulkhead",
    c: "architecture",
    l: "infra",
    def: "Isolating resources so one overloaded component cannot consume the capacity of others.",
    note: "Separate thread pools or connection pools per dependency. Named after ship compartments, for the obvious reason.",
    depth:
      "Without it, one slow dependency consumes the shared pool and every endpoint fails, including the ones that never call it — the failure spreads through a resource, not through a code path. Partition by dependency (a pool of 10 for the payment provider, 5 for search) and accept the lower utilisation as the price of containment. Cap concurrency per dependency rather than only setting timeouts, since a timeout still lets 500 requests pile up for 2 seconds each. The tenant-level version of the same idea is cell-based architecture.",
  },

  // ── DATA ENGINEERING ──────────────────────────────────────────
  {
    t: "ETL vs ELT",
    c: "pipelines",
    l: "data",
    def: "Extract-Transform-Load transforms before storing. Extract-Load-Transform stores raw and transforms in the warehouse.",
    note: "ELT won because warehouse compute became cheap and keeping raw data lets you fix transformation bugs retroactively.",
    depth:
      "The strategic difference is reversibility: with ELT the raw landing zone is immutable, so a transformation bug found in March can be fixed and re-derived over January's data, whereas ETL discarded the input and the wrong numbers are all you have. It also separates ownership cleanly — engineers own extraction and loading, analysts own the SQL transformations in dbt. ETL still wins where the raw data must not land at all (PII you are not permitted to store) or where volume makes loading everything genuinely uneconomic.",
  },
  {
    t: "Batch vs streaming",
    c: "pipelines",
    l: "data",
    def: "Processing accumulated data on a schedule, versus processing each record as it arrives.",
    note: "Streaming is not strictly better. Batch is simpler, cheaper, easier to reason about, and enough for most reporting.",
    depth:
      "Streaming's real cost is not throughput, it is that correctness gets harder: late events, out-of-order arrival, exactly-once semantics and windowing all become your problem, and there is no convenient point at which a dataset is 'complete' to validate against. Batch gets a natural checkpoint every run, trivial reprocessing, and a simple mental model. Micro-batching (a job every 5 minutes) covers most of the gap and is the right answer far more often than either extreme; ask what decision the latency actually enables before paying for seconds.",
  },
  {
    t: "DAG",
    aka: "directed acyclic graph",
    c: "pipelines",
    l: "infra",
    def: "A dependency graph of tasks where each runs only after its upstream tasks succeed, with no cycles.",
    note: "The core abstraction of Airflow, Dagster and Prefect. Different from a queue: order and dependencies are explicit.",
    depth:
      "Acyclic is what makes scheduling decidable — a topological sort tells the scheduler what can run now and what runs in parallel. Tasks must be independent processes communicating through storage, not through Python variables, because they may run on different machines; passing data via XCom or its equivalents is for small metadata, not dataframes. The common design error is a DAG with one task doing everything, which throws away the retry granularity and parallelism that were the reason to use an orchestrator.",
  },
  {
    t: "Orchestrator",
    c: "pipelines",
    l: "infra",
    def: "A system that runs DAGs, tracks state, retries failures and backfills history.",
    note: "Use one when steps depend on each other. Use a task queue when jobs are independent. Choosing wrong is a common early mistake.",
    depth:
      "What you are buying is the state store and the UI over it: which run of which task failed, when, with what logs, and a button to re-run from that point over a historical date range. That is the difference from cron, which knows nothing about yesterday. Keep the orchestrator as a scheduler, not a compute engine — tasks should submit work to Spark, dbt or a Kubernetes pod rather than crunching data inside the worker, or the scheduler becomes a single-machine bottleneck and its restarts become data incidents.",
  },
  {
    t: "Backfill",
    c: "pipelines",
    l: "data",
    def: "Re-running a pipeline over historical periods to populate or correct past data.",
    note: "The reason pipelines should be parameterised by date and idempotent per partition.",
    depth:
      "Never let a task read 'now' — the execution date must come in as a parameter, or a backfill of March silently reprocesses today's data. Watch concurrency: backfilling two years of daily partitions at full parallelism will saturate the warehouse and starve production pipelines, so cap it and run off-peak. Late-arriving dimensions are the subtle failure: reprocessing an old day with today's lookup tables produces numbers that never existed, which is why slowly-changing dimensions carry validity ranges.",
  },
  {
    t: "Idempotent partition",
    c: "pipelines",
    l: "data",
    def: "Writing each run's output to a partition it fully owns and can overwrite safely.",
    note: "Makes reruns trivial. Appending instead of overwriting is how duplicate rows silently accumulate for months.",
    depth:
      "The operation you want is atomic replace: write to a temporary location and swap, or use INSERT OVERWRITE / a MERGE keyed on the partition, so a failure mid-write never leaves a half-written partition that downstream jobs will happily read. Match partition granularity to the reprocessing unit — daily partitions mean the smallest correction you can make is one day. Table formats like Iceberg and Delta give you this properly with snapshot isolation and time travel, which is most of why they exist.",
  },
  {
    t: "Data warehouse vs lake",
    c: "pipelines",
    l: "data",
    def: "A warehouse stores structured, modelled data for analytics. A lake stores raw files of any shape.",
    note: "Lakehouse formats such as Iceberg and Delta blur the line by adding transactions and schema to files.",
    depth:
      "The two failure modes are opposite. A warehouse enforces schema on write, so bad data is rejected at the door and every ingestion change is a migration. A lake defers everything to read time, which is flexible until nobody knows what is in it and it becomes a data swamp — the reason a catalogue and ownership metadata are not optional. Lakehouse formats add ACID commits, schema evolution and time travel on top of object storage, and separating storage from compute is what makes them cheap to scale.",
  },
  {
    t: "Columnar storage",
    aka: "Parquet",
    c: "pipelines",
    l: "data",
    def: "Storing values column by column rather than row by row.",
    note: "Analytical queries touch few columns of many rows, so this is dramatically faster and compresses far better.",
    depth:
      "Compression is the multiplier: a column holds one type with repeated values, so dictionary and run-length encoding routinely give 5–10× over row storage, and reading 3 of 200 columns reads 3 columns' worth of bytes. Parquet also stores per-row-group min/max statistics, so a query with a predicate can skip entire chunks without decoding them — which is why sorting data by your common filter column before writing dramatically improves scan pruning. The trade is that single-row lookups and updates are terrible, so keep transactional workloads on a row store.",
  },
  {
    t: "Schema drift",
    c: "pipelines",
    l: "data",
    def: "Upstream data changing shape without warning — a renamed field, a changed type.",
    note: "The most common cause of pipeline breakage. Validate on ingest rather than discovering it in a dashboard.",
    depth:
      "The dangerous drift is silent, not loud: a renamed column produces nulls that average into a plausible-looking number, and an integer that becomes a string may coerce quietly. Defend with a contract validated at ingest (Great Expectations, Pandera, a schema registry) that fails loudly and quarantines the batch, plus alerting on the shape of the data — null rate, distinct count, row count — not only on job success. A schema registry with backwards-compatibility enforcement pushes the failure all the way upstream to the producer, which is where it is cheapest.",
  },
  {
    t: "Data lineage",
    c: "pipelines",
    l: "data",
    def: "The traceable path from a number in a report back through every transformation to its source.",
    note: "The first question after any surprising metric is 'where did this come from'. Lineage is the answer.",
    depth:
      "Table-level lineage answers 'what breaks if I drop this table' and is usually derivable automatically from query logs or a dbt manifest; column-level lineage answers 'which upstream field feeds this number' and is what you actually want during an incident. Its two payoffs are impact analysis before a change and root-cause search after one. Keep it generated, never hand-drawn — a lineage diagram maintained manually is out of date the week after it is drawn, and a confidently wrong map is worse than none.",
  },
  {
    t: "Data quality check",
    c: "pipelines",
    l: "data",
    def: "Assertions on data itself — not null, unique, within range, row count within tolerance.",
    note: "Tests verify your code. Quality checks verify the world. You need both.",
    depth:
      "Split them into blocking and warning: a null primary key should stop the pipeline before downstream tables consume it, while a 20% row-count drop should page a human without necessarily halting everything. Freshness is the check people forget and the one that matters most — a pipeline that silently stopped yesterday leaves a dashboard that looks perfectly fine. Anomaly thresholds should be relative to history rather than absolute, and every check needs an owner, because an alerting check nobody owns is muted within a month.",
  },
  {
    t: "CDC",
    aka: "change data capture",
    c: "pipelines",
    l: "data",
    def: "Streaming a database's change log to other systems instead of polling for modified rows.",
    note: "Near-real-time replication without adding load to the source. Debezium is the common implementation.",
    depth:
      "Log-based CDC reads the WAL or binlog, so it captures deletes and intermediate states that a polling query on updated_at will always miss — that gap is the main reason to use it. Operationally, the replication slot is the thing to watch: if the consumer stops, Postgres retains WAL indefinitely and the source database's disk fills, taking down production. The initial snapshot before streaming can be heavy, schema changes flow through as events your consumers must handle, and the output is a stream of row-level changes that downstream systems must fold into current state themselves.",
  },
  {
    t: "Watermark",
    c: "pipelines",
    l: "data",
    def: "In stream processing, the point up to which all events are assumed to have arrived.",
    note: "Exists because events arrive late and out of order. Deciding how long to wait is a correctness-versus-latency trade.",
    depth:
      "It is a heuristic, not a guarantee: the watermark advances on a rule (max event time seen minus an allowed lateness), so anything arriving after it is late by definition and needs an explicit policy — drop it, send it to a side output, or re-emit a corrected aggregate. Two failure shapes to know: a stalled watermark, where one idle partition holds the whole job back because its clock never advances, and mobile clients with wrong system clocks producing events timestamped next week that push the watermark forward and mark everything else late.",
  },
  {
    t: "Windowing",
    c: "pipelines",
    l: "data",
    def: "Grouping a stream into finite chunks — tumbling, sliding, or session windows — so aggregates are computable.",
    note: "You cannot average an infinite stream. Windows are how streaming borrows batch's ability to finish.",
    depth:
      "Tumbling windows are fixed and non-overlapping (one hourly bucket per event); sliding windows overlap, so one event lands in several and state cost multiplies by the overlap ratio; session windows are dynamic, closing after a gap of inactivity, which is what you want for user behaviour. Windowing is where memory goes: every open window holds state per key, so a high-cardinality key with long windows is an out-of-memory incident with a schedule. Always window on event time rather than processing time, or a consumer lag spike silently reassigns events to the wrong bucket.",
  },
];
