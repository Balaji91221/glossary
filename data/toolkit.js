// "What library for what" — the map a student actually needs when starting.
// Pick has a reason attached; a recommendation without a reason is folklore.

export const TOOLKIT = [
  {
    job: "Build an HTTP API",
    picks: [
      { name: "FastAPI", why: "Async, typed, and generates OpenAPI docs from your schemas for free." },
      { name: "Django REST", why: "When you want an admin panel, ORM, auth and migrations included." },
      { name: "Express / NestJS", why: "The JavaScript equivalents — Nest if you want structure enforced." },
      { name: "Go net/http", why: "Standard library is enough; brilliant for high-throughput services." },
    ],
  },
  {
    job: "Validate incoming data",
    picks: [
      { name: "Pydantic", why: "Parses and validates into typed objects. The backbone of FastAPI." },
      { name: "Zod", why: "The TypeScript equivalent, with types inferred from the schema." },
    ],
  },
  {
    job: "Talk to a database",
    picks: [
      { name: "PostgreSQL", why: "The correct boring default. JSON, full text, vectors, and real transactions." },
      { name: "SQLAlchemy", why: "The Python ORM. Powerful, and lets you drop to raw SQL when needed." },
      { name: "Alembic", why: "Migrations for SQLAlchemy — versioned, ordered, reversible." },
      { name: "Prisma / Drizzle", why: "TypeScript ORMs; Drizzle stays closer to SQL." },
      { name: "SQLite", why: "For local development, tests, and a surprising number of real production apps." },
    ],
  },
  {
    job: "Run background jobs",
    picks: [
      { name: "RQ", why: "Start here. Redis-only, tiny, and the queue model becomes obvious immediately." },
      { name: "Celery", why: "The mature default once you need priorities, routing and scheduling." },
      { name: "Dramatiq", why: "A modern middle ground with far less configuration than Celery." },
      { name: "BullMQ", why: "The Node equivalent, Redis-backed." },
    ],
  },
  {
    job: "Schedule recurring work",
    picks: [
      { name: "Celery Beat", why: "If you already run Celery. Remember: exactly one instance." },
      { name: "APScheduler", why: "In-process scheduling for single-instance apps." },
      { name: "cron / systemd timers", why: "The OS already does this. Do not build what exists." },
    ],
  },
  {
    job: "Run dependent pipelines",
    picks: [
      { name: "Airflow", why: "The industry standard for DAGs. Heavy, but everyone knows it." },
      { name: "Dagster", why: "Asset-oriented, better typing and testing story." },
      { name: "Prefect", why: "Lightest to adopt if your pipelines are already Python functions." },
    ],
  },
  {
    job: "Cache and coordinate",
    picks: [
      { name: "Redis", why: "Cache, queue, distributed lock, rate limiter. One dependency, many jobs." },
    ],
  },
  {
    job: "Stream events",
    picks: [
      { name: "Kafka", why: "Durable, replayable log for high-volume event streams." },
      { name: "Redpanda", why: "Kafka-compatible with far less operational burden." },
      { name: "NATS", why: "Lightweight messaging when you do not need replay." },
    ],
  },
  {
    job: "Test",
    picks: [
      { name: "pytest", why: "Fixtures and parametrisation make it the best test runner in any language." },
      { name: "Testcontainers", why: "Real Postgres in your integration tests, disposed automatically." },
      { name: "Hypothesis", why: "Property-based testing — finds the inputs you would never write." },
      { name: "Playwright", why: "End-to-end browser testing that is not flaky by default." },
    ],
  },
  {
    job: "Keep code clean",
    picks: [
      { name: "ruff", why: "Linter and formatter in one, fast enough to run on save." },
      { name: "mypy / pyright", why: "Static typing turns a class of runtime errors into build errors." },
      { name: "pre-commit", why: "Runs the checks before the commit exists, not after CI fails." },
    ],
  },
  {
    job: "Package and deploy",
    picks: [
      { name: "Docker", why: "The universal artifact format. Learn multi-stage builds early." },
      { name: "uv", why: "Python dependency resolution and locking, dramatically faster than pip." },
      { name: "Kubernetes", why: "Only when you genuinely have many services. Otherwise it is a second job." },
      { name: "Terraform", why: "Infrastructure as reviewable, version-controlled code." },
    ],
  },
  {
    job: "Observe production",
    picks: [
      { name: "OpenTelemetry", why: "Vendor-neutral instrumentation. Instrument once, switch backends later." },
      { name: "Prometheus + Grafana", why: "The default metrics and dashboards stack." },
      { name: "Sentry", why: "Error tracking with stack traces and release correlation." },
      { name: "structlog", why: "Structured JSON logs with context bound per request." },
    ],
  },
  {
    job: "Build on LLMs",
    picks: [
      { name: "Provider SDKs", why: "Start with the raw SDK. Understand the loop before adopting a framework." },
      { name: "pgvector", why: "Vector search inside Postgres you already run. Add a vector DB only when this stops working." },
      { name: "LiteLLM", why: "One interface across providers, useful for fallbacks and cost routing." },
      { name: "Instructor", why: "Structured outputs validated into Pydantic models." },
    ],
  },
  {
    job: "Evaluate LLM output",
    picks: [
      { name: "A CSV and a script", why: "Genuinely how most good eval suites start. Do not over-tool this." },
      { name: "Ragas", why: "Retrieval-specific metrics: is the right context being fetched at all?" },
      { name: "Langfuse", why: "Tracing and dataset management for LLM apps." },
    ],
  },
  {
    job: "Train models",
    picks: [
      { name: "scikit-learn", why: "Classical ML, and the baseline your deep model must beat." },
      { name: "PyTorch", why: "The research and production default for neural networks." },
      { name: "MLflow", why: "Experiment tracking and model registry." },
      { name: "DVC", why: "Version control for datasets, so results stay reproducible." },
    ],
  },
];
