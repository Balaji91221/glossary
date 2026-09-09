// Systems & Linux — The machine underneath.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
  {
    t: "stdout / stderr",
    c: "systems",
    l: "systems",
    def: "The two default output streams: normal output and errors.",
    note: "Containers expect logs on stdout. Writing to a file inside a container means the logs die with it.",
    depth:
      "They are separate so a pipeline can consume data on stdout while diagnostics still reach a human on stderr — which is why a CLI's progress messages belong on stderr, not stdout. Buffering is the operational trap: stdout is block-buffered when it is not a terminal, so a crashed container can lose its last lines entirely (fix with PYTHONUNBUFFERED=1 or an explicit flush), while stderr is typically unbuffered. Redirect precisely: 2>&1 merges them, and the order matters, since > file 2>&1 and 2>&1 > file do different things.",
  },
  {
    t: "Environment variable",
    c: "systems",
    l: "infra",
    def: "Configuration passed to a process by its environment rather than baked into code.",
    note: "The Twelve-Factor way to configure. Load them once at startup into a typed settings object.",
    depth:
      "Everything is a string, so parse and validate at startup into typed settings and fail loudly on a missing or malformed value — a service that boots with DEBUG='false' evaluating truthy is a real and common bug. They are inherited by child processes and visible in /proc and crash dumps, which is why they are a weak place for secrets. Read them once at the entry point rather than scattering getenv calls through the code, so configuration is testable and the full set of required variables is discoverable in one file.",
  },
  {
    t: "File descriptor",
    c: "systems",
    l: "systems",
    def: "A handle for an open file, socket or pipe. Every process has a limit.",
    note: "'Too many open files' means you are leaking connections somewhere, not that you need a bigger limit.",
    depth:
      "Every socket counts, so a leak usually lives in HTTP clients or database connections created per request instead of reused — check with lsof -p <pid> or ls /proc/<pid>/fd, and look at what the majority of them point to. Note that a closed TCP connection lingers in TIME_WAIT for around 60 seconds, so a high-churn client can exhaust descriptors or ephemeral ports without leaking anything. Use context managers or defer-style cleanup everywhere, and raise the ulimit only after you have proven the usage is legitimate.",
  },
  {
    t: "Permissions",
    aka: "chmod, chown",
    c: "systems",
    l: "systems",
    def: "Read, write and execute bits for owner, group and everyone.",
    note: "755 for directories and scripts, 644 for files, 600 for secrets. 777 is never the real fix.",
    depth:
      "On a directory the bits mean something different from a file: x is permission to traverse into it, and r is permission to list its contents, so a directory can be enterable but not listable. Ownership is the usual container problem — a volume mounted from the host arrives with the host's UID, and your non-root container user cannot write to it, which is what the numeric mismatch in 'permission denied' is telling you. Also know the special bits: setuid, and the sticky bit that makes /tmp safe for shared use.",
  },
  {
    t: "Symbolic link",
    aka: "symlink",
    c: "systems",
    l: "systems",
    def: "A file that points at another path.",
    note: "How 'current release' directories work. Also how you accidentally deploy the previous version.",
    depth:
      "A symlink stores a path, so it breaks if the target moves and can point at something that does not exist yet; a hard link is a second name for the same inode and cannot cross filesystems. The atomic-deploy trick relies on that path indirection: create the new symlink and rename it over the old one, since rename is atomic and nothing observes a moment with no current directory. Watch two gotchas — relative symlinks resolve against the link's own directory, and Docker's COPY follows and materialises them rather than preserving the link.",
  },
  {
    t: "Pipe and redirect",
    c: "systems",
    l: "systems",
    def: "| sends one command's output into another. > writes to a file, >> appends.",
    note: "grep, awk, sort, uniq, wc composed with pipes will out-perform writing a script for most log questions.",
    depth:
      "The canonical incident one-liner is worth memorising: sort | uniq -c | sort -rn turns any extracted field into a ranked frequency count, which answers 'which endpoint is erroring' in one line. Pipes run concurrently with a small kernel buffer, so a slow consumer applies backpressure to the producer — that is the shell demonstrating the same principle your services need. Remember that > truncates the file the moment the command starts (so cmd > file with file as input destroys it), and that only the last command's exit status survives unless you set pipefail.",
  },
  {
    t: "Exit status in shell",
    aka: "$?",
    c: "systems",
    l: "systems",
    def: "The last command's exit code, available as $?.",
    note: "set -euo pipefail at the top of every bash script. Without it, scripts cheerfully continue after failures.",
    depth:
      "Each flag fixes a specific silent failure: -e exits on error, -u treats an unset variable as an error (rm -rf \"$PREFIX/\" with an empty PREFIX is the cautionary tale), and -o pipefail makes a failing command mid-pipeline fail the whole thing rather than being masked by a successful tail. Know -e's exceptions — it does not trigger inside a condition, or for a command followed by || — and use trap for cleanup on exit. Always quote variables, since an unquoted one containing spaces becomes several arguments.",
  },
  {
    t: "Memory: RSS vs virtual",
    c: "systems",
    l: "systems",
    def: "Resident set size is physical memory actually in use; virtual is address space reserved.",
    note: "Container limits apply to RSS. A scary virtual number is usually nothing to worry about.",
    depth:
      "RSS also double-counts shared pages: two forked workers each report the shared library and copy-on-write parent memory, so summing RSS across processes overstates real usage — PSS (proportional set size) is the honest per-process number. Watch the cgroup's memory.current rather than the host's free, since page cache counts toward a container limit and can trigger reclaim. And a process that frees memory often does not return it to the OS (the allocator keeps it), so flat RSS after a spike is normal rather than a leak.",
  },
  {
    t: "Swap",
    c: "systems",
    l: "systems",
    def: "Disk used as overflow when physical memory runs out.",
    note: "Usually disabled in containers, because swapping makes a process pathologically slow instead of cleanly dead.",
    depth:
      "The failure it causes is worse than the one it prevents: a swapping service is alive and answering health checks while every request takes seconds, so the load balancer keeps sending traffic and nothing recovers — a fast OOM kill and restart is the kinder outcome, which is why Kubernetes traditionally refuses to start with swap enabled. Even with swap off, the kernel can evict page cache and re-read executable pages from disk under pressure, which looks like sudden mysterious slowness. Watch major page faults, not just free memory.",
  },
  {
    t: "Load average",
    c: "systems",
    l: "systems",
    def: "The average number of processes running or waiting, over one, five and fifteen minutes.",
    note: "Compare against core count. Load of 4 on 8 cores is fine; on 2 cores it is a queue.",
    depth:
      "On Linux it counts processes in uninterruptible sleep (blocked on disk I/O) as well as runnable ones, so a high load average with idle CPU means you are I/O-bound, not compute-bound — a distinction the number alone hides. Read the three windows as a trend: 1-minute above 15-minute means it is rising now. Inside a container the value comes from the host, not your cgroup, so it describes the neighbourhood rather than your application; per-cgroup CPU throttling metrics are what actually tell you whether you are being limited.",
  },
  {
    t: "Namespace and cgroup",
    c: "systems",
    l: "systems",
    def: "Kernel features providing isolation and resource limits — the mechanics containers are built from.",
    note: "A container is not a virtual machine. It is a normal process with a restricted view of the system.",
    depth:
      "Namespaces control visibility (PID, network, mount, user, UTS, IPC) and cgroups control consumption (CPU, memory, I/O) — two separate mechanisms that together produce the illusion of a machine. The consequences are practical: the kernel is shared, so a kernel vulnerability crosses the boundary and a container is a weaker isolation boundary than a VM. CPU limits are enforced by throttling within a period rather than by slowing the clock, which is why a latency-sensitive service can be throttled hard while average utilisation looks low.",
  },
  {
    t: "Port binding",
    c: "systems",
    l: "infra",
    def: "A process claiming a network port to accept connections on.",
    note: "'Address already in use' means a previous process still holds it. Ports below 1024 need elevated privileges.",
    depth:
      "A binding is the tuple of address, port and protocol, which is why one process can bind 127.0.0.1:8000 and another 0.0.0.0:8000 and only the second collides with everything. SO_REUSEADDR is what lets a restarting server rebind while old connections sit in TIME_WAIT, and SO_REUSEPORT lets several processes share one port with kernel-side load balancing — the mechanism behind multi-worker servers. Find the holder with lsof -i :8000 or ss -ltnp, and prefer a capability or a proxy over running as root for port 80.",
  },
  {
    t: "Localhost vs 0.0.0.0",
    c: "systems",
    l: "infra",
    def: "Binding to 127.0.0.1 accepts only local connections; 0.0.0.0 accepts from any interface.",
    note: "The single most common reason a containerised app is unreachable from outside the container.",
    depth:
      "Inside a container, localhost is the container's own loopback, so it is also why one container cannot reach another at 127.0.0.1 — use the service name and let DNS resolve it. On a developer machine, host.docker.internal is the escape hatch back to the host. The corollary is a security one: binding a debug server or a database to 0.0.0.0 on a host with a public interface exposes it to the internet, so bind to loopback by default and let a reverse proxy be the only thing listening broadly.",
  },
];
