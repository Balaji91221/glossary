// Project structure — Where code lives.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
  {
    t: "Repository",
    aka: "repo",
    c: "structure",
    l: "craft",
    def: "A project tracked by version control, containing its full history of changes.",
    note: "A monorepo holds many deployable services in one repo; a polyrepo gives each its own. Monorepos make shared code easy and CI slow.",
    depth:
      "The real axis is not one repo or many, it is whether a change that spans two services can be one atomic commit. Monorepos buy that and pay for it with tooling: once every push runs every test suite, you need affected-target detection (Nx, Turborepo, Bazel) or CI time grows with the org chart. Polyrepos give you fast, obvious CI and hand you version skew instead — service A pinned to v1.2 of the shared client while B is on v2.0, and the bug lives in the gap.",
  },
  {
    t: "Root",
    c: "structure",
    l: "craft",
    def: "The outermost folder of a project. A 'root-level file' sits directly inside it, not nested.",
    note: "Config lives at the root by convention so tools can find it without being told where to look.",
    depth:
      "Most tools locate the root by walking upward from the current directory until they find a marker — .git, package.json, pyproject.toml — which is why running a command from a subfolder usually still works, and why it occasionally picks up the wrong project in a monorepo. When a linter mysteriously uses different rules in CI than locally, the first thing to check is which directory each one started the upward walk from.",
  },
  {
    t: "Entry point",
    c: "structure",
    l: "app",
    def: "The first file executed when a program starts — main.py, index.js, __main__.py.",
    note: "One codebase often has several: an API entry point, a worker entry point, a scheduler entry point. Same code, different doors.",
    depth:
      "The entry point is where the runtime hands control to you, so it is also the only place with the whole picture: it reads config, builds the dependency graph, and wires it into a server or a consumer loop. Keep it dumb and declarative — everything it constructs should be constructible in a test without it. The tell that you got this wrong is a test that has to import main to get at a database session.",
  },
  {
    t: "Source vs build",
    aka: "src/ vs dist/",
    c: "structure",
    l: "craft",
    def: "src/ is what humans write. dist/ or build/ is the compiled, bundled output a machine generates from it.",
    note: "Never edit build output — it is overwritten on the next build. If a fix only exists in dist/, it does not exist.",
    depth:
      "Build output should be reproducible from source plus a lockfile and nothing else — that property is what lets CI throw away the artifact and rebuild it identically. Source maps are the bridge back: they let a stack trace from minified production code point at the line you actually wrote, which is why shipping them (to an error tracker, not necessarily to the public) turns unreadable incidents into ordinary ones.",
  },
  {
    t: "Module",
    c: "structure",
    l: "app",
    def: "A single file of reusable code that can be imported elsewhere.",
    note: "A package is a folder of modules. In Python, __init__.py is what promotes a folder to a package.",
    depth:
      "Import is not free and not lazy: importing a module runs every top-level statement in it, once, and caches the result. That is why a database connection opened at module level connects the moment anything imports the file — including your test collector. It is also how circular imports bite: A imports B while B is still half-executed, and B's names do not exist yet. Move the shared thing to a third module, or import inside the function.",
  },
  {
    t: "Package manifest",
    aka: "package.json, pyproject.toml",
    c: "structure",
    l: "craft",
    def: "The file declaring a project's name, dependencies, scripts, and tool configuration.",
    note: "pyproject.toml is the modern Python standard and absorbs setup.py, requirements.txt and most linter configs into one place.",
    depth:
      "The manifest declares ranges — ^1.4.0, >=2,<3 — which is a statement of intent about compatibility, not a build input. Ranges are what let a security patch reach you without a code change, and what let an unrelated upgrade break you at 3am. Split dependencies from dev-dependencies properly: anything in the main list ends up in your production image, and a test framework in there is both weight and attack surface.",
  },
  {
    t: "Lockfile",
    aka: "uv.lock, package-lock.json, poetry.lock",
    c: "structure",
    l: "craft",
    def: "A generated file pinning the exact resolved version of every dependency, including transitive ones.",
    note: "Commit it. Never hand-edit it. It is the difference between 'works on my machine' and reproducible builds.",
    depth:
      "The lockfile records the whole resolved graph plus content hashes, so an install verifies bytes rather than trusting a version number — this is what stops a republished tarball silently changing under you. Use the install command that honours it strictly (npm ci, uv sync --frozen, poetry install --sync) in CI and Docker; plain npm install is allowed to update the lock, which means your image can differ from your teammate's for reasons nobody recorded. A conflicted lockfile is regenerated, never merged by hand.",
  },
  {
    t: "Constraints file",
    c: "structure",
    l: "craft",
    def: "A list that caps versions of whatever gets installed without itself requesting any packages.",
    note: "Useful for saying 'whatever pulls in urllib3, it must stay below 2.0' across an entire dependency tree.",
    depth:
      "It is a filter applied during resolution rather than a request, which is exactly what you want for a policy that must hold across many services: one shared constraints file, referenced by all of them, no duplicated pins. The npm equivalent is an overrides block, Yarn calls it resolutions. Treat every entry as debt with a reason attached — write the ticket number in a comment, because an unexplained cap outlives the incident that caused it by years.",
  },
  {
    t: "Transitive dependency",
    c: "structure",
    l: "craft",
    def: "A library you never asked for, installed because something you did ask for needs it.",
    note: "Most of your node_modules is transitive. Most supply-chain vulnerabilities arrive this way too.",
    depth:
      "You cannot audit what you cannot see: npm ls <pkg> and pip tree show why something is present and who pulled it in, which is the first question in any CVE triage. Depth matters more than count — a package four levels down is maintained by someone you will never contact, on a release schedule you cannot influence. The practical defences are a lockfile with hashes, automated dependency PRs so upgrades are small, and refusing to add a package that pulls in fifty of its own to save you eight lines.",
  },
  {
    t: "Vendoring",
    c: "structure",
    l: "craft",
    def: "Copying third-party source directly into your repo instead of installing it from a registry.",
    note: "Done when you need to patch a library or depend on something unpublished. The cost is that upstream fixes no longer reach you automatically.",
    depth:
      "Prefer a recorded patch over a copy: patch-package and poetry's patch support keep a diff in the repo instead of a fork, so upgrading tells you loudly when the patch no longer applies rather than silently keeping your stale version. If you must vendor, record the upstream URL and commit SHA in a header comment — the failure mode is not the copy, it is that in eighteen months nobody can tell what was changed or why.",
  },
  {
    t: "Virtual environment",
    aka: ".venv",
    c: "structure",
    l: "craft",
    def: "An isolated Python installation per project, so two projects can use different versions of the same library.",
    note: "Always gitignored. If you ever commit .venv, your repo becomes hundreds of megabytes of machine-specific binaries.",
    depth:
      "Activation is nothing magical — it prepends the venv's bin/ to PATH so python and pip resolve there first. That is why a cron job or a systemd unit that does not activate anything runs the system interpreter and fails with ImportError; the fix is to invoke the absolute path /srv/app/.venv/bin/python directly, which needs no activation at all. Inside a container the isolation is already provided by the image, so many teams skip the venv there deliberately.",
  },
  {
    t: "Makefile",
    c: "structure",
    l: "craft",
    def: "A file of named command shortcuts — make test, make run, make lint.",
    note: "The cheapest onboarding document there is. If a new hire has to read your CI config to learn how to run tests, write a Makefile.",
    depth:
      "Its real value is that CI and humans run the identical command, so 'passes locally, fails in CI' stops being a mystery about invocation. Two gotchas: recipe lines must be indented with a literal tab, and each line runs in its own shell, so cd only lasts one line. Declare non-file targets with .PHONY, or a directory named test will make make decide there is nothing to do.",
  },
  {
    t: "Layered structure",
    aka: "controllers → services → repositories → models",
    c: "structure",
    l: "app",
    def: "Organising code so each layer only talks to the one beside it: routes validate, services decide, repositories fetch, models describe.",
    note: "The rule that makes it work is 'thin routes': a controller should read like a table of contents, never like the actual logic.",
    depth:
      "The direction of dependency is the whole point: the service layer must not know it is being called over HTTP, which is what lets the same function serve a REST route, a queue consumer, and a CLI command. Concretely, no Request object and no HTTPException below the controller — services raise domain errors and the controller maps them to status codes. The moment a repository imports anything web-shaped, the layering has become decoration.",
  },
  {
    t: "Repository pattern",
    c: "structure",
    l: "data",
    def: "A layer that hides database access behind intention-revealing methods like find_by_email().",
    note: "Pays for itself the first time you mock the database in a test or swap the storage engine without touching business logic.",
    depth:
      "Keep the abstraction honest about laziness: returning an ORM query object rather than a materialised list leaks the session out of the repository, and the query then runs somewhere that has no idea it is touching a database — often inside a loop. Return concrete lists or domain objects. Be pragmatic about the swap-the-database promise too; it rarely happens, and testability plus one place to add caching or query logging is enough justification on its own.",
  },
  {
    t: "Schema vs model",
    aka: "DTO",
    c: "structure",
    l: "app",
    def: "A model maps to a database table. A schema defines what the API accepts and returns.",
    note: "Keeping them separate is deliberate — it stops internal columns like password_hash leaking into a response by accident.",
    depth:
      "You usually want three, not two: a create schema, an update schema where every field is optional, and a read schema that is the only thing ever serialised outward. Whitelisting beats blacklisting — a response model that lists the fields it emits cannot leak a column added next quarter, whereas an exclude list silently can. This split is also what makes API versioning possible: v1 and v2 schemas can differ while the table stays one shape.",
  },
  {
    t: "Feature-first vs type-first",
    c: "structure",
    l: "craft",
    def: "Grouping files by what they do (auth/, billing/) versus by what they are (components/, services/).",
    note: "Type-first is fine until the project is large. Feature-first scales because a change usually touches one folder.",
    depth:
      "The measurable test is how many folders a typical pull request touches — if adding one field means editing five sibling directories, your layout is fighting your changes. Feature-first also gives you a natural place for the boring stuff a feature owns (its migrations, its fixtures, its tests) and a seam to extract a service along later. The cost is discipline about shared code: without a clear common/ or core/, features start importing each other sideways and you get a distributed monolith in a single repo.",
  },
  {
    t: "Absolute vs relative path",
    c: "structure",
    l: "systems",
    def: "Absolute starts at the filesystem root (/home/app/src/main.py). Relative starts from where you are (./utils, ../config).",
    note: "'./' means this folder, '../' means go up one. Path bugs are almost always about which directory the process was started from.",
    depth:
      "A relative path resolves against the process's current working directory, not the file that contains the string — which is why open('data/seed.json') works from the repo root and breaks under a systemd unit or a container with a different WORKDIR. Build paths from the module's own location instead: Path(__file__).parent / 'data' / 'seed.json' in Python, import.meta.url in ESM. Anything user-supplied must additionally be resolved and checked to still sit inside the intended directory, or ../../etc/passwd becomes a feature.",
  },
  {
    t: "Dotfile",
    c: "structure",
    l: "systems",
    def: "A file whose name begins with a dot — .env, .gitignore, .eslintrc — hidden by default on Unix systems.",
    note: "ls -a shows them. Most of a project's real configuration hides here.",
    depth:
      "Hidden is a shell and file-manager convention, not a permission — a dot buys you exactly zero security, which is why .env belongs in .gitignore and out of any Docker build context. The corollary bites in deployment: cp -r src/. and glob patterns like * skip dotfiles, so config quietly fails to copy and the app starts with defaults. Ship a committed .env.example listing every key with dummy values, so a missing variable is a diff rather than a runtime surprise.",
  },
  {
    t: "README",
    c: "structure",
    l: "craft",
    def: "The front door of a repository: what this is, how to run it, how to test it.",
    note: "Judge it by one question — can a new engineer get the project running from this file alone?",
    depth:
      "Order it by what a stranger needs first: one sentence on what the thing is, then the exact commands to run it, then how to run the tests, then architecture. Every command in it should be copy-pasteable and actually run — a README with a stale command is worse than none, because it costs a reader twenty minutes before they distrust it. The cheapest way to keep it true is to have CI run the same commands the README lists.",
  },
];
