// Working as an engineer — The human protocol.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
  {
    t: "Technical debt",
    c: "career",
    l: "craft",
    def: "Accumulated shortcuts that make future change slower.",
    note: "Sometimes worth taking deliberately. The problem is undocumented debt nobody decided to incur.",
    depth:
      "Ward Cunningham's original metaphor was about a deliberate loan taken to ship and learn faster, repaid once you understood the domain — not a synonym for bad code. The useful distinction is deliberate versus accidental and prudent versus reckless, because only one of those four is a real problem. Make it visible: record it where the work is planned, attach the interest ('this adds two days to every change here'), and pay it down alongside features in the same area rather than in a rewrite quarter nobody will fund.",
  },
  {
    t: "Yak shaving",
    c: "career",
    l: "craft",
    def: "The chain of unrelated tasks you must complete before the actual task.",
    note: "Recognising it early is a skill. Timebox the detour or note it and route around.",
    depth:
      "The practical technique is to keep a scratch list as you go: write down each detour rather than following it immediately, and after each one ask whether it is still necessary for the original goal. Timebox at the moment you notice — thirty minutes, then reassess — because the sunk cost of three yaks makes the fourth feel mandatory. Some shaving is genuinely valuable (the broken local setup you just fixed will slow everyone else too); the failure is doing it unconsciously and surfacing a day later with nothing shippable.",
  },
  {
    t: "Bikeshedding",
    c: "career",
    l: "craft",
    def: "Spending disproportionate discussion on trivial details because they are easy to have opinions about.",
    note: "Automate the trivia — formatters, linters, templates — so the arguments become impossible.",
    depth:
      "Parkinson's law of triviality: a committee approving a nuclear plant waves through the reactor and argues for an hour about the bike shed, because everyone can hold an opinion on the shed. The counter is to make the trivial decision unavailable — a formatter with no options, a template, a documented convention — and to name the pattern out loud when it happens, which usually ends it. In review, labelling comments as nits does the same job at a smaller scale, by separating preference from concern.",
  },
  {
    t: "Rubber duck debugging",
    c: "career",
    l: "craft",
    def: "Explaining the problem aloud in detail, which frequently reveals the answer mid-sentence.",
    note: "Works because articulation forces you to check the assumption you skipped over silently.",
    depth:
      "It works by forcing sequential, explicit statement of things you were holding as a compressed intuition — and the assumption you skip when thinking is the one you notice when saying. Writing works as well as speaking, which is why drafting a detailed bug report so often solves the bug. Push it further with the scientific version: state the hypothesis, state what you would expect to observe if it were true, then check. 'It should be impossible for this to be null' is the sentence that most often precedes the answer.",
  },
  {
    t: "Estimation",
    c: "career",
    l: "craft",
    def: "Forecasting effort under uncertainty.",
    note: "Estimate ranges, not points. Break anything longer than three days into pieces you can actually picture.",
    depth:
      "The planning fallacy is systematic and does not improve with experience, because we estimate the path we imagine rather than the path we get. Two corrections help: reference-class forecasting (how long did the last three similar tasks actually take, including the interruptions) and decomposing until each piece is small enough to visualise, since the sum of small estimates is less biased than one big one. Be explicit about what the estimate excludes — review latency, deployment, the unfamiliar codebase — and give a range with the assumptions attached rather than a number that will be quoted back as a commitment.",
  },
  {
    t: "Scope creep",
    c: "career",
    l: "craft",
    def: "Requirements quietly expanding after work has started.",
    note: "Not inherently bad. Untracked is what makes it dangerous — write down what changed and what it cost.",
    depth:
      "The response is not refusal, it is an explicit trade: 'yes, and that adds three days — do we cut X or move the date?' — which turns an invisible slip into a decision someone owns. Distinguish genuine discovery (we learned the requirement was wrong, which is good) from accumulation (a stream of small additions nobody priced). Watch for the self-inflicted version too: gold-plating a solution beyond what was asked is scope creep with your own name on it, and it is the kind least likely to be tracked.",
  },
  {
    t: "Definition of done",
    c: "career",
    l: "craft",
    def: "The agreed bar for calling work complete — tested, reviewed, documented, deployed, monitored.",
    note: "Without one, 'done' means 'it ran on my laptop once' and the remaining 40% appears later as a surprise.",
    depth:
      "Write it once as a team checklist rather than negotiating it per ticket, and include the operational items people forget: metrics and alerts exist, the runbook is updated, the feature flag has an owner, docs reflect the change, and the migration has a rollback. Its second function is estimation honesty — if 'done' includes review and deploy, then estimates that only cover coding are visibly wrong. Keep it short enough to be real; a twenty-item checklist becomes a formality that gets ticked without being read.",
  },
  {
    t: "Design doc",
    aka: "RFC",
    c: "career",
    l: "craft",
    def: "A written proposal circulated for feedback before significant work begins.",
    note: "An hour of writing routinely saves a week of building the wrong thing. Include the alternatives you rejected.",
    depth:
      "The structure that works: context and problem, goals and explicit non-goals, the proposed design, alternatives considered with the reason each was rejected, risks, and a rollout plan. Non-goals and rejected alternatives are the highest-value sections, because they stop the same debate reopening in three months and they show reviewers the shape of your thinking. Circulate early while the design is still changeable, timebox the comment period, and record the decision — an ADR — so a future reader can see why, not just what.",
  },
  {
    t: "Chesterton's fence",
    c: "career",
    l: "craft",
    def: "Do not remove something until you understand why it was put there.",
    note: "That strange conditional is probably a bug fix nobody documented. Use git blame before deleting.",
    depth:
      "The investigation is usually five minutes: git log -S to find the commit that introduced the line, then the PR and the ticket it references. When the archaeology comes up empty, do not simply leave it forever — add a test that captures the behaviour you believe it protects, remove the fence behind a flag, and watch. The complementary error is real too: leaving every fence standing produces code nobody dares change, so the principle is understand-then-decide, not never-remove.",
  },
  {
    t: "Boy Scout rule",
    c: "career",
    l: "craft",
    def: "Leave code slightly better than you found it.",
    note: "Keep cleanup in a separate commit from behaviour change, or review becomes impossible.",
    depth:
      "Slightly is the operative word: rename the misleading variable, add the missing test, delete the dead branch — improvements a reviewer can verify at a glance. A refactor larger than the change it accompanies should be its own PR, or you have made a risky change hard to review and hard to revert. The compounding argument is what makes it worth doing at all: consistent small improvements in the files people actually touch beats a scheduled cleanup project, because the files people touch are the files that matter.",
  },
  {
    t: "Premature optimisation",
    c: "career",
    l: "craft",
    def: "Optimising before measuring where time is actually spent.",
    note: "The corollary is not 'never optimise'. It is 'profile first' — intuition about bottlenecks is reliably wrong.",
    depth:
      "Knuth's full sentence includes 'in about 97% of cases', and the same paragraph insists on not passing up the critical 3% — the quote is an argument for measurement, not for indifference to performance. Profile to find where the time goes (a flame graph makes it obvious in a minute), fix the top item, and measure again, because the second bottleneck is rarely what you predicted. What is not premature is algorithmic choice and data-access shape: an N+1 query or an O(n²) loop over a growing collection is a design error, not an optimisation you deferred.",
  },
  {
    t: "Bus factor",
    c: "career",
    l: "craft",
    def: "How many people must be unavailable before a system becomes unmaintainable.",
    note: "A bus factor of one is the most common serious risk on a team, and the easiest to fix with documentation and pairing.",
    depth:
      "Find it empirically rather than by feel: git history shows which files have exactly one substantial author, and that list is your risk register. The cheap mitigations are ordinary practices used deliberately — rotate who takes work in unfamiliar areas, pair on the scary parts, insist that reviewers of critical systems change over time, and write the design docs and runbooks that make context transferable. Note that the bus factor is about knowledge, not access: a documented system with a departed author is recoverable, an undocumented one with three readers is not.",
  },
];
