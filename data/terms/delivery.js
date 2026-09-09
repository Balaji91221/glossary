// Git, CI/CD & delivery — Getting it to users.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
  {
    t: "Commit",
    c: "delivery",
    l: "craft",
    def: "A recorded snapshot of changes with a message explaining why.",
    note: "The message should explain intent, not restate the diff. 'Fix bug' helps nobody in eight months.",
    depth:
      "A commit is a full tree snapshot addressed by a hash of its content plus its parents, which is why history is tamper-evident and why rewriting one changes every hash after it. Aim for one logical change per commit: it is the unit that revert, cherry-pick and bisect all operate on, so a commit mixing a rename with a bug fix cannot be undone cleanly. Use git add -p to split work you did in one sitting into commits that each make sense, and write the body to answer why, since the diff already answers what.",
  },
  {
    t: "Branch",
    c: "delivery",
    l: "craft",
    def: "An independent line of development that can be merged back later.",
    note: "Short-lived branches merge cleanly. A branch open for three weeks becomes a conflict resolution project.",
    depth:
      "A branch is a movable pointer to a commit — creating one is writing 40 bytes to a file, which is why branching is free and why deleting a merged branch loses nothing. The cost is not the branch, it is the divergence: conflict probability grows with both time and the number of people touching the same files. Trunk-based development with feature flags is the alternative that keeps integration continuous, and it is the practice that lets teams deploy many times a day without a merge queue full of week-old branches.",
  },
  {
    t: "Merge vs rebase",
    c: "delivery",
    l: "craft",
    def: "Merge combines two histories with a merge commit. Rebase replays your commits on top of another branch for linear history.",
    note: "Rebase your own unshared work freely. Never rebase a branch others have pulled.",
    depth:
      "Rebase creates new commits with new hashes, so anyone who pulled the old ones now has a divergent history — which is why the rule is about sharing, not about taste. If you must force-push a rebased branch, use --force-with-lease so you cannot overwrite work someone pushed while you were rewriting. Squash-merge gives a clean main and discards intermediate commits, which is a real loss when bisecting a large PR. Whichever the team picks, pick one: mixed strategies produce a history nobody can read.",
  },
  {
    t: "Merge conflict",
    c: "delivery",
    l: "craft",
    def: "Two branches changed the same lines and git needs a human to decide.",
    note: "Not an error. Frequent small merges make them rare and trivial.",
    depth:
      "Git merges by content within a three-way comparison against the common ancestor, which is why a conflict means two edits to the same region and not simply two edits to the same file. The dangerous case is the semantic conflict that merges cleanly and is still wrong — one branch renames a function, another adds a caller, git is satisfied and the build is not. Resolve with the ancestor visible (merge.conflictStyle = zdiff3), always run the tests after resolving, and enable rerere so you do not re-resolve the same conflict on every rebase.",
  },
  {
    t: "Pull request",
    aka: "PR, MR",
    c: "delivery",
    l: "craft",
    def: "A proposed change, opened for review before merging.",
    note: "Small PRs get real review. A 2,000-line PR gets 'LGTM' and a rubber stamp.",
    depth:
      "There is measured evidence for a ceiling around 200–400 changed lines, beyond which defect detection falls off sharply — reviewer attention, not diligence, is the constraint. Give it a description that says what changed, why, and how you verified it, and stack dependent PRs rather than submitting one enormous change. Separate mechanical changes (a rename, a reformat) into their own PR so the reviewer's attention lands on the ten lines that carry the risk rather than the six hundred that do not.",
  },
  {
    t: "Code review",
    c: "delivery",
    l: "craft",
    def: "Another engineer reading a change for correctness, clarity and risk before it ships.",
    note: "Review the design, not the formatting. Ask questions instead of issuing verdicts.",
    depth:
      "Its highest-value output is often not the defects found but the knowledge spread — a second person who now understands that subsystem, which is a direct improvement to the bus factor. Label comments by weight ('nit:', 'question:', 'blocking:') so the author knows what must change; unlabelled preferences read as requirements and stall the PR. Latency is the metric that matters most: a review that arrives a day later has forced a context switch that costs more than the review saved.",
  },
  {
    t: "Cherry-pick",
    c: "delivery",
    l: "craft",
    def: "Applying one specific commit onto another branch.",
    note: "How an urgent fix reaches a release branch without dragging along everything else on main.",
    depth:
      "It creates a new commit with a different hash and the same content, so the change now exists twice in history and a later merge between the branches may conflict with itself. Use -x to record the original SHA in the message, which is what lets someone six months later work out that these two commits are the same fix. Repeatedly cherry-picking between long-lived branches is a signal your branching model is wrong — the sustainable pattern is fix on main, then cherry-pick to the release branch, never the other direction.",
  },
  {
    t: "Revert vs reset",
    c: "delivery",
    l: "craft",
    def: "Revert creates a new commit undoing an old one. Reset moves the branch pointer and rewrites history.",
    note: "Revert on shared branches, always. Reset only on local work nobody has seen.",
    depth:
      "Know the three resets: --soft moves the pointer and keeps everything staged, --mixed (the default) unstages but keeps your files, --hard discards working-tree changes irrecoverably. Reverting a merge commit needs -m 1 to say which parent is the mainline, and it has a trap — re-merging that branch later will do nothing, because git considers those commits already merged, so you must revert the revert. And almost nothing is truly lost: git reflog keeps unreferenced commits for 90 days by default.",
  },
  {
    t: "Bisect",
    c: "delivery",
    l: "craft",
    def: "Binary-searching history to find the commit that introduced a bug.",
    note: "git bisect finds the culprit in twenty commits with about five tests. Criminally underused.",
    depth:
      "Ten steps cover a thousand commits, and git bisect run <script> automates the whole thing if you can write a command that exits non-zero on the bug — which turns an afternoon of guessing into a coffee break. Two requirements make it work: every commit must build (a reason to keep main green), and the reproduction must be deterministic, since a flaky check sends the search down the wrong half. Mark unbuildable commits 'skip' rather than guessing, and it is just as effective for finding when a performance regression appeared.",
  },
  {
    t: "CI",
    aka: "continuous integration",
    c: "delivery",
    l: "craft",
    def: "Every push automatically builds, lints and tests the code.",
    note: "Its value is proportional to how fast it runs. A twenty-minute pipeline gets circumvented.",
    depth:
      "Speed comes from caching dependencies keyed on the lockfile hash, parallelising the suite across shards, and running the fast checks (lint, types, unit) before the slow ones so failures return in a minute. A broken main is an emergency for the whole team, since every subsequent push now sees a red build and stops learning anything from it. Keep the pipeline definition in the repo, and make it runnable locally — a CI-only build step is a step nobody can debug.",
  },
  {
    t: "CD",
    aka: "continuous deployment",
    c: "delivery",
    l: "infra",
    def: "Passing builds ship to production automatically without a human gate.",
    note: "Requires real tests, fast rollback and feature flags. The payoff is that deploys become unremarkable.",
    depth:
      "Distinguish delivery from deployment: continuous delivery means every build is releasable and a human presses the button; continuous deployment removes the button. The counter-intuitive result from DORA's research is that frequent small deploys correlate with lower change-failure rates, because each one carries less risk and is easier to attribute. The prerequisites are non-negotiable — automated verification you trust, backwards-compatible migrations, a rollback that takes a minute, and monitoring good enough to notice within one.",
  },
  {
    t: "Artifact",
    c: "delivery",
    l: "infra",
    def: "The built output that actually gets deployed — a container image, a wheel, a jar.",
    note: "Build once, promote the same artifact through environments. Rebuilding per environment means you tested something else.",
    depth:
      "Address it by immutable digest rather than a tag: :latest and even :v1.2.3 can be repointed, so a rollback may not return the bytes you tested. Configuration therefore has to come from the environment at run time, since the same image must run in staging and production unchanged. Stamp provenance into it — commit SHA, build time, pipeline id — so a running instance can tell you exactly what it is, and keep a retention policy or your registry bill grows forever.",
  },
  {
    t: "Container image",
    c: "delivery",
    l: "infra",
    def: "A layered, immutable filesystem snapshot containing your app and its dependencies.",
    note: "Layers cache: put dependency installation before copying source and rebuilds drop from minutes to seconds.",
    depth:
      "Layers are stacked and additive, which is why deleting a file in a later layer does not shrink the image and why a secret copied in and removed later is still extractable from history — use build secrets or a multi-stage build instead. Order Dockerfile instructions by rate of change: base, system packages, lockfile, dependency install, then source. Pin the base image by digest, run as a non-root user, and add a .dockerignore, or you will ship .git and node_modules into the build context and wonder why it takes four minutes.",
  },
  {
    t: "Multi-stage build",
    c: "delivery",
    l: "infra",
    def: "Compiling in a heavy builder image, then copying only the results into a small runtime image.",
    note: "Turns a 1.2GB image into 150MB. Smaller images deploy faster and expose less attack surface.",
    depth:
      "The security gain is as large as the size gain: no compiler, no package manager and no build credentials in the shipped image, so an attacker who lands inside has far fewer tools. Distroless or Alpine as the final stage takes it further — but Alpine uses musl, which can break Python wheels and change DNS behaviour, so measure rather than assume. Name your stages and target them (--target=test) so CI can run the test stage and production can build the runtime stage from the same Dockerfile.",
  },
  {
    t: "Rolling deploy",
    c: "delivery",
    l: "infra",
    def: "Replacing instances gradually so the service stays up throughout.",
    note: "Requires that old and new versions can coexist — which constrains how you change database schemas.",
    depth:
      "The controls are maxSurge and maxUnavailable: surge adds extra pods before removing old ones (needs spare capacity but never dips below full strength), unavailable allows a temporary reduction. Because both versions serve traffic simultaneously, every change must be backwards-compatible in both directions for the duration — schema, API contract, cache format and queue message shape. Rollback is a second rolling update, so it takes as long as the deploy did, which is the main practical difference from blue-green.",
  },
  {
    t: "Blue-green deploy",
    c: "delivery",
    l: "infra",
    def: "Two complete environments; deploy to the idle one, then switch traffic.",
    note: "Instant rollback by flipping back. Costs double infrastructure during the switch.",
    depth:
      "The switch is atomic for new connections and not for existing ones, so in-flight requests and open WebSockets still need draining. The database is the part that is not duplicated, which is where the strategy actually bites: green's migrations must leave blue working, or rollback is impossible whatever the traffic layer says. Prefer switching at the load balancer over DNS, since DNS caching means some clients keep hitting blue for the length of the TTL and you never get a clean cutover.",
  },
  {
    t: "Canary release",
    c: "delivery",
    l: "infra",
    def: "Routing a small percentage of traffic to the new version and watching metrics before proceeding.",
    note: "Catches problems that only appear under real traffic. Needs good metrics to be meaningful.",
    depth:
      "Compare the canary against the baseline on the same signals at the same moment — error rate, p99 latency, saturation — rather than against yesterday, since traffic patterns move. Give it enough volume and enough time to be statistically meaningful: 1% of traffic for 90 seconds proves nothing about an error that occurs once in ten thousand requests. Automate the abort on a threshold breach, because the entire point is catching it before a human notices, and be aware that sticky sessions and caches can leave the canary serving an unrepresentative slice of users.",
  },
  {
    t: "Rollback",
    c: "delivery",
    l: "infra",
    def: "Returning to the previous known-good version.",
    note: "A deploy strategy is only as good as its undo. Practise rollbacks before you need one at 3am.",
    depth:
      "Measure it in minutes and rehearse it, because during an incident rollback should be the reflex, not a decision requiring analysis — diagnose after service is restored. The database is what makes it hard: a migration that dropped a column cannot be rolled back by redeploying the old image, which is precisely why expand/contract exists and why destructive steps ship in a later release than the code that stopped needing them. Roll forward instead when the previous version has a known worse bug, but that should be a considered exception.",
  },
  {
    t: "Feature flag",
    c: "delivery",
    l: "app",
    def: "A runtime switch letting you ship code disabled and enable it later without redeploying.",
    note: "Decouples deploy from release. Also accumulates into permanent debt unless you delete flags after rollout.",
    depth:
      "Separate the kinds, because they have different lifetimes: release toggles live weeks and must be deleted, experiment flags run for a defined test, ops kill-switches are permanent by design, and permission flags are really entitlements and belong in your authorization model. Every flag doubles the possible code paths, so two interacting flags mean four states you are unlikely to test. Give each one an owner and an expiry date at creation, and default to off in a way that fails safe if the flag service is unreachable.",
  },
  {
    t: "Semantic versioning",
    aka: "semver",
    c: "delivery",
    l: "craft",
    def: "MAJOR.MINOR.PATCH — breaking change, new feature, bug fix.",
    note: "A major bump is a promise you are breaking something. Respect it and your consumers can upgrade confidently.",
    depth:
      "0.x means all bets are off — anything may break in a minor bump, which is why so many dependency ranges behave surprisingly for pre-1.0 packages. What counts as breaking is broader than the signature: tightening validation, changing a default, or altering timing can break consumers who depended on the old behaviour (Hyrum's law). Note that semver describes intent and cannot enforce it, which is why a lockfile still matters, and applications (as opposed to libraries) are often better served by date or build versioning.",
  },
  {
    t: "Infrastructure as code",
    aka: "IaC",
    c: "delivery",
    l: "infra",
    def: "Declaring servers, networks and permissions in version-controlled files — Terraform, Pulumi, CloudFormation.",
    note: "Makes infrastructure reviewable, repeatable and recoverable. Clicking in a console is not reproducible.",
    depth:
      "The state file is the whole system's weak point: it records what Terraform believes exists, must live in remote storage with locking so two applies cannot race, and contains secrets in plaintext. Drift — someone changing a resource in the console — is detected by plan and is the reason console access to production should be read-only. Always read the plan before applying (destroy-and-recreate hides in there), and separate state per environment so a mistake in staging cannot reach production.",
  },
  {
    t: "Environment",
    c: "delivery",
    l: "infra",
    def: "An isolated deployment of the system — local, dev, staging, production.",
    note: "The only difference between them should be configuration and data. Code divergence defeats the purpose.",
    depth:
      "Staging's value is proportional to its similarity, and the differences that matter most are usually data volume and traffic shape — a query that is instant against 10,000 seeded rows is a timeout against 40 million. Never copy production data down without anonymising; generate representative synthetic data instead. Beware environment-conditional code (if ENV == 'production'), which means the path you tested is not the path you run; use configuration values rather than branches, so the shape of the code is identical everywhere.",
  },
];
