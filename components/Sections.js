import { TOOLKIT } from "@/data/toolkit";

const ROUTE = [
  {
    title: "Read the structure of a real repository",
    body: "Open any project you did not write and work out where a request enters and where it ends. Find the entry point, the routes, the place business logic lives, and the place the database is touched.",
    aside: "Terms in play: entry point, layered structure, lockfile, dotfile.",
  },
  {
    title: "Ship one endpoint that writes to a database",
    body: "Validation, a migration, an index, and an error path. Small, but it forces you through the entire vertical slice most tutorials skip.",
    aside: "Terms in play: schema vs model, migration, transaction, N+1 query.",
  },
  {
    title: "Move slow work out of the request",
    body: "Add a queue and a worker. Make the endpoint return in milliseconds and let the job finish later. Then kill the worker mid-job and watch what happens.",
    aside: "Terms in play: enqueue, worker, idempotency, dead letter queue.",
  },
  {
    title: "Make the process die properly",
    body: "Handle SIGTERM. Drain in-flight work. Check the exit code. This single exercise explains more about deployment than any amount of reading.",
    aside: "Terms in play: graceful shutdown, grace period, exit code 137, PID 1.",
  },
  {
    title: "Make it observable",
    body: "Structured logs with a correlation ID, a latency histogram, and one dashboard. Then deliberately break something and see whether your telemetry tells you what happened.",
    aside: "Terms in play: correlation ID, p99, golden signals, alert fatigue.",
  },
  {
    title: "Only now, add the model",
    body: "An LLM feature is an ordinary backend feature with a non-deterministic dependency. Everything above still applies — plus evals, because you cannot assert equality on a paragraph.",
    aside: "Terms in play: structured output, RAG, eval, golden dataset, prompt injection.",
  },
];

export function ReadingPath() {
  return (
    <section className="section" id="path">
      <div className="shell">
        <div className="section-head">
          <p className="eyebrow">Section 02 — How to actually learn this</p>
          <h2>Six things to build, in this order</h2>
          <p>
            The order matters. Each step creates the problem that the next step
            solves, which is the only way this vocabulary stops being trivia and
            starts being memory.
          </p>
        </div>
        <div className="route">
          {ROUTE.map((step, i) => (
            <div className="route-step" key={step.title}>
              <span className="route-num">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h4>{step.title}</h4>
                <p>{step.body}</p>
                <p>{step.aside}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Toolkit() {
  return (
    <section className="section" id="toolkit">
      <div className="shell">
        <div className="section-head">
          <p className="eyebrow">Section 03 — What library for what</p>
          <h2>Reach for these, and know why</h2>
          <p>
            A tool recommendation without a reason is folklore. Each pick below
            carries the trade-off that justifies it, so you can tell when it
            stops being the right answer for your situation.
          </p>
        </div>
        <div className="toolkit-grid">
          {TOOLKIT.map((group) => (
            <div className="tool-card" key={group.job}>
              <div className="tool-job">{group.job}</div>
              <ul className="tool-list">
                {group.picks.map((p) => (
                  <li key={p.name}>
                    <span className="tool-name">{p.name}</span>
                    <span className="tool-why">{p.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="shell">
        <p className="eyebrow" style={{ marginBottom: "1rem" }}>
          Closing note
        </p>
        <p>
          Nobody learns these from a list. You learn them the day a queue backs
          up, a deploy drops requests, or a query that was fine with a thousand
          rows meets a million. What a glossary does is give the feeling a name,
          so that when it happens you can search for the answer instead of
          starting from nothing.
        </p>
        <p style={{ marginTop: "1.5rem" }}>
          Keep this open in a tab. Add your own entries as you collect them —
          the ones you had to learn the hard way are the ones worth writing
          down.
        </p>
      </div>
    </footer>
  );
}
