// APIs & networking — Talking between machines.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
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
];
