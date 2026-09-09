// Architecture — Arranging the pieces.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
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
];
