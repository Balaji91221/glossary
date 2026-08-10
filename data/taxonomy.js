// The spine of the manual. Categories are *what kind of thing* a term is;
// layers are *where in a running system* you meet it.

export const LAYERS = {
  edge: {
    id: "edge",
    label: "Edge",
    blurb: "Where traffic arrives. Clients, protocols, gateways, auth.",
  },
  app: {
    id: "app",
    label: "Application",
    blurb: "Your code. Routes, services, workers, models, prompts.",
  },
  data: {
    id: "data",
    label: "Data",
    blurb: "Where truth is kept. Databases, queues, caches, vectors.",
  },
  infra: {
    id: "infra",
    label: "Infrastructure",
    blurb: "What it all runs on. Processes, containers, pipelines, alerts.",
  },
  craft: {
    id: "craft",
    label: "Craft",
    blurb: "How work gets made. Structure, testing, review, delivery.",
  },
  systems: {
    id: "systems",
    label: "Machine",
    blurb: "The operating system underneath. Memory, files, permissions.",
  },
  ai: {
    id: "ai",
    label: "Model",
    blurb: "Anything specific to building on top of language models.",
  },
  ml: {
    id: "ml",
    label: "Training",
    blurb: "Producing a model rather than calling one.",
  },
};

// A handful of terms are tagged with a category id as their layer; map them.
export const LAYER_ALIASES = { api: "edge" };

export function resolveLayer(id) {
  return LAYERS[LAYER_ALIASES[id] || id] || LAYERS.craft;
}

export const CATEGORIES = [
  {
    id: "structure",
    name: "Project structure",
    kicker: "Where code lives",
    summary:
      "The shape of a repository is the first documentation anyone reads. These terms describe how a codebase is laid out and why the layout is a design decision rather than housekeeping.",
  },
  {
    id: "async",
    name: "Workers, queues & scheduling",
    kicker: "Work that outlives a request",
    summary:
      "Everything here follows from one problem: some work takes longer than a user will wait. Write the job down, answer immediately, let another process do it.",
  },
  {
    id: "lifecycle",
    name: "Process lifecycle",
    kicker: "Starting, running, dying",
    summary:
      "Programs are born, take signals, and are asked to stop. Deployments are just controlled killing, so how a process dies decides whether users notice.",
  },
  {
    id: "concurrency",
    name: "Concurrency",
    kicker: "More than one thing at once",
    summary:
      "The difference between interleaving work and truly doing it in parallel, and the specific ways shared state betrays you.",
  },
  {
    id: "data",
    name: "Data & state",
    kicker: "Keeping the truth",
    summary:
      "Databases are where mistakes become permanent. Transactions, indexes, migrations, and the query patterns that quietly make an API slow.",
  },
  {
    id: "api",
    name: "APIs & networking",
    kicker: "Talking between machines",
    summary:
      "Protocols, status codes, identity, and the failure handling that separates a demo from a service. Depth here pays back forever.",
  },
  {
    id: "architecture",
    name: "Architecture",
    kicker: "Arranging the pieces",
    summary:
      "How systems are divided, how the divisions are justified, and the vocabulary senior engineers use to argue about them.",
  },
  {
    id: "pipelines",
    name: "Data engineering",
    kicker: "Moving data at volume",
    summary:
      "Batch and streaming, warehouses and lakes, and the orchestration tools that run dependency graphs instead of fire-and-forget jobs.",
  },
  {
    id: "testing",
    name: "Testing & quality",
    kicker: "Proving it works",
    summary:
      "The pyramid, the doubles, and the reason a flaky test is worse than no test at all.",
  },
  {
    id: "delivery",
    name: "Git, CI/CD & delivery",
    kicker: "Getting it to users",
    summary:
      "Version control, review, and the strategies for replacing running software without anyone noticing.",
  },
  {
    id: "ops",
    name: "Operations & observability",
    kicker: "Knowing what's happening",
    summary:
      "Logs, metrics, traces, percentiles, and the discipline of alerting on what users feel rather than on everything that moves.",
  },
  {
    id: "security",
    name: "Security",
    kicker: "Assuming bad input",
    summary:
      "The attacks worth knowing by name, the defences that actually work, and the habits that keep credentials out of your git history.",
  },
  {
    id: "systems",
    name: "Systems & Linux",
    kicker: "The machine underneath",
    summary:
      "Memory, file descriptors, permissions, and the shell literacy that turns a production incident from mysterious into merely annoying.",
  },
  {
    id: "ai",
    name: "AI & LLM engineering",
    kicker: "Building on models",
    summary:
      "Tokens, retrieval, agents, evaluation, and the reliability problems that only exist when your program's output is non-deterministic.",
  },
  {
    id: "ml",
    name: "ML training",
    kicker: "Making the model",
    summary:
      "The vocabulary of training runs: loss, overfitting, splits, and the metrics that matter when accuracy is a lie.",
  },
  {
    id: "career",
    name: "Working as an engineer",
    kicker: "The human protocol",
    summary:
      "Estimation, debt, review etiquette, on-call, and the practices that decide whether a team compounds or thrashes.",
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);
