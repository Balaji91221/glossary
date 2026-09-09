// Security — Assuming bad input.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
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
];
