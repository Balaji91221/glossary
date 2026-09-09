// Process lifecycle — Starting, running, dying.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
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
];
