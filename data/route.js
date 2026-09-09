// The learning path: six things to build, in order. Each step names the terms
// it exercises by slug, so the validator can check the links and the page can
// render them as anchors.

export const ROUTE = [
  {
    title: "Read the structure of a real repository",
    body: "Open any project you did not write and work out where a request enters and where it ends. Find the entry point, the routes, the place business logic lives, and the place the database is touched.",
    terms: ["entry-point", "layered-structure", "lockfile", "dotfile"],
  },
  {
    title: "Ship one endpoint that writes to a database",
    body: "Validation, a migration, an index, and an error path. Small, but it forces you through the entire vertical slice most tutorials skip.",
    terms: ["schema-vs-model", "migration", "transaction", "n-1-query"],
  },
  {
    title: "Move slow work out of the request",
    body: "Add a queue and a worker. Make the endpoint return in milliseconds and let the job finish later. Then kill the worker mid-job and watch what happens.",
    terms: ["enqueue", "worker", "idempotency", "dead-letter-queue"],
  },
  {
    title: "Make the process die properly",
    body: "Handle SIGTERM. Drain in-flight work. Check the exit code. This single exercise explains more about deployment than any amount of reading.",
    terms: ["graceful-shutdown", "grace-period", "exit-code", "pid-1"],
  },
  {
    title: "Make it observable",
    body: "Structured logs with a correlation ID, a latency histogram, and one dashboard. Then deliberately break something and see whether your telemetry tells you what happened.",
    terms: ["correlation-id", "percentiles", "golden-signals", "alert-fatigue"],
  },
  {
    title: "Only now, add the model",
    body: "An LLM feature is an ordinary backend feature with a non-deterministic dependency. Everything above still applies, plus evals, because you cannot assert equality on a paragraph.",
    terms: ["structured-output", "rag", "eval", "golden-dataset", "prompt-injection"],
  },
];
