// Operations & observability — Knowing what's happening.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
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
];
