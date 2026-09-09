// Data engineering — Moving data at volume.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
  {
    t: "ETL vs ELT",
    c: "pipelines",
    l: "data",
    def: "Extract-Transform-Load transforms before storing. Extract-Load-Transform stores raw and transforms in the warehouse.",
    note: "ELT won because warehouse compute became cheap and keeping raw data lets you fix transformation bugs retroactively.",
    depth:
      "The strategic difference is reversibility: with ELT the raw landing zone is immutable, so a transformation bug found in March can be fixed and re-derived over January's data, whereas ETL discarded the input and the wrong numbers are all you have. It also separates ownership cleanly — engineers own extraction and loading, analysts own the SQL transformations in dbt. ETL still wins where the raw data must not land at all (PII you are not permitted to store) or where volume makes loading everything genuinely uneconomic.",
  },
  {
    t: "Batch vs streaming",
    c: "pipelines",
    l: "data",
    def: "Processing accumulated data on a schedule, versus processing each record as it arrives.",
    note: "Streaming is not strictly better. Batch is simpler, cheaper, easier to reason about, and enough for most reporting.",
    depth:
      "Streaming's real cost is not throughput, it is that correctness gets harder: late events, out-of-order arrival, exactly-once semantics and windowing all become your problem, and there is no convenient point at which a dataset is 'complete' to validate against. Batch gets a natural checkpoint every run, trivial reprocessing, and a simple mental model. Micro-batching (a job every 5 minutes) covers most of the gap and is the right answer far more often than either extreme; ask what decision the latency actually enables before paying for seconds.",
  },
  {
    t: "DAG",
    aka: "directed acyclic graph",
    c: "pipelines",
    l: "infra",
    def: "A dependency graph of tasks where each runs only after its upstream tasks succeed, with no cycles.",
    note: "The core abstraction of Airflow, Dagster and Prefect. Different from a queue: order and dependencies are explicit.",
    depth:
      "Acyclic is what makes scheduling decidable — a topological sort tells the scheduler what can run now and what runs in parallel. Tasks must be independent processes communicating through storage, not through Python variables, because they may run on different machines; passing data via XCom or its equivalents is for small metadata, not dataframes. The common design error is a DAG with one task doing everything, which throws away the retry granularity and parallelism that were the reason to use an orchestrator.",
  },
  {
    t: "Orchestrator",
    c: "pipelines",
    l: "infra",
    def: "A system that runs DAGs, tracks state, retries failures and backfills history.",
    note: "Use one when steps depend on each other. Use a task queue when jobs are independent. Choosing wrong is a common early mistake.",
    depth:
      "What you are buying is the state store and the UI over it: which run of which task failed, when, with what logs, and a button to re-run from that point over a historical date range. That is the difference from cron, which knows nothing about yesterday. Keep the orchestrator as a scheduler, not a compute engine — tasks should submit work to Spark, dbt or a Kubernetes pod rather than crunching data inside the worker, or the scheduler becomes a single-machine bottleneck and its restarts become data incidents.",
  },
  {
    t: "Backfill",
    c: "pipelines",
    l: "data",
    def: "Re-running a pipeline over historical periods to populate or correct past data.",
    note: "The reason pipelines should be parameterised by date and idempotent per partition.",
    depth:
      "Never let a task read 'now' — the execution date must come in as a parameter, or a backfill of March silently reprocesses today's data. Watch concurrency: backfilling two years of daily partitions at full parallelism will saturate the warehouse and starve production pipelines, so cap it and run off-peak. Late-arriving dimensions are the subtle failure: reprocessing an old day with today's lookup tables produces numbers that never existed, which is why slowly-changing dimensions carry validity ranges.",
  },
  {
    t: "Idempotent partition",
    c: "pipelines",
    l: "data",
    def: "Writing each run's output to a partition it fully owns and can overwrite safely.",
    note: "Makes reruns trivial. Appending instead of overwriting is how duplicate rows silently accumulate for months.",
    depth:
      "The operation you want is atomic replace: write to a temporary location and swap, or use INSERT OVERWRITE / a MERGE keyed on the partition, so a failure mid-write never leaves a half-written partition that downstream jobs will happily read. Match partition granularity to the reprocessing unit — daily partitions mean the smallest correction you can make is one day. Table formats like Iceberg and Delta give you this properly with snapshot isolation and time travel, which is most of why they exist.",
  },
  {
    t: "Data warehouse vs lake",
    c: "pipelines",
    l: "data",
    def: "A warehouse stores structured, modelled data for analytics. A lake stores raw files of any shape.",
    note: "Lakehouse formats such as Iceberg and Delta blur the line by adding transactions and schema to files.",
    depth:
      "The two failure modes are opposite. A warehouse enforces schema on write, so bad data is rejected at the door and every ingestion change is a migration. A lake defers everything to read time, which is flexible until nobody knows what is in it and it becomes a data swamp — the reason a catalogue and ownership metadata are not optional. Lakehouse formats add ACID commits, schema evolution and time travel on top of object storage, and separating storage from compute is what makes them cheap to scale.",
  },
  {
    t: "Columnar storage",
    aka: "Parquet",
    c: "pipelines",
    l: "data",
    def: "Storing values column by column rather than row by row.",
    note: "Analytical queries touch few columns of many rows, so this is dramatically faster and compresses far better.",
    depth:
      "Compression is the multiplier: a column holds one type with repeated values, so dictionary and run-length encoding routinely give 5–10× over row storage, and reading 3 of 200 columns reads 3 columns' worth of bytes. Parquet also stores per-row-group min/max statistics, so a query with a predicate can skip entire chunks without decoding them — which is why sorting data by your common filter column before writing dramatically improves scan pruning. The trade is that single-row lookups and updates are terrible, so keep transactional workloads on a row store.",
  },
  {
    t: "Schema drift",
    c: "pipelines",
    l: "data",
    def: "Upstream data changing shape without warning — a renamed field, a changed type.",
    note: "The most common cause of pipeline breakage. Validate on ingest rather than discovering it in a dashboard.",
    depth:
      "The dangerous drift is silent, not loud: a renamed column produces nulls that average into a plausible-looking number, and an integer that becomes a string may coerce quietly. Defend with a contract validated at ingest (Great Expectations, Pandera, a schema registry) that fails loudly and quarantines the batch, plus alerting on the shape of the data — null rate, distinct count, row count — not only on job success. A schema registry with backwards-compatibility enforcement pushes the failure all the way upstream to the producer, which is where it is cheapest.",
  },
  {
    t: "Data lineage",
    c: "pipelines",
    l: "data",
    def: "The traceable path from a number in a report back through every transformation to its source.",
    note: "The first question after any surprising metric is 'where did this come from'. Lineage is the answer.",
    depth:
      "Table-level lineage answers 'what breaks if I drop this table' and is usually derivable automatically from query logs or a dbt manifest; column-level lineage answers 'which upstream field feeds this number' and is what you actually want during an incident. Its two payoffs are impact analysis before a change and root-cause search after one. Keep it generated, never hand-drawn — a lineage diagram maintained manually is out of date the week after it is drawn, and a confidently wrong map is worse than none.",
  },
  {
    t: "Data quality check",
    c: "pipelines",
    l: "data",
    def: "Assertions on data itself — not null, unique, within range, row count within tolerance.",
    note: "Tests verify your code. Quality checks verify the world. You need both.",
    depth:
      "Split them into blocking and warning: a null primary key should stop the pipeline before downstream tables consume it, while a 20% row-count drop should page a human without necessarily halting everything. Freshness is the check people forget and the one that matters most — a pipeline that silently stopped yesterday leaves a dashboard that looks perfectly fine. Anomaly thresholds should be relative to history rather than absolute, and every check needs an owner, because an alerting check nobody owns is muted within a month.",
  },
  {
    t: "CDC",
    aka: "change data capture",
    c: "pipelines",
    l: "data",
    def: "Streaming a database's change log to other systems instead of polling for modified rows.",
    note: "Near-real-time replication without adding load to the source. Debezium is the common implementation.",
    depth:
      "Log-based CDC reads the WAL or binlog, so it captures deletes and intermediate states that a polling query on updated_at will always miss — that gap is the main reason to use it. Operationally, the replication slot is the thing to watch: if the consumer stops, Postgres retains WAL indefinitely and the source database's disk fills, taking down production. The initial snapshot before streaming can be heavy, schema changes flow through as events your consumers must handle, and the output is a stream of row-level changes that downstream systems must fold into current state themselves.",
  },
  {
    t: "Watermark",
    c: "pipelines",
    l: "data",
    def: "In stream processing, the point up to which all events are assumed to have arrived.",
    note: "Exists because events arrive late and out of order. Deciding how long to wait is a correctness-versus-latency trade.",
    depth:
      "It is a heuristic, not a guarantee: the watermark advances on a rule (max event time seen minus an allowed lateness), so anything arriving after it is late by definition and needs an explicit policy — drop it, send it to a side output, or re-emit a corrected aggregate. Two failure shapes to know: a stalled watermark, where one idle partition holds the whole job back because its clock never advances, and mobile clients with wrong system clocks producing events timestamped next week that push the watermark forward and mark everything else late.",
  },
  {
    t: "Windowing",
    c: "pipelines",
    l: "data",
    def: "Grouping a stream into finite chunks — tumbling, sliding, or session windows — so aggregates are computable.",
    note: "You cannot average an infinite stream. Windows are how streaming borrows batch's ability to finish.",
    depth:
      "Tumbling windows are fixed and non-overlapping (one hourly bucket per event); sliding windows overlap, so one event lands in several and state cost multiplies by the overlap ratio; session windows are dynamic, closing after a gap of inactivity, which is what you want for user behaviour. Windowing is where memory goes: every open window holds state per key, so a high-cardinality key with long windows is an out-of-memory incident with a schedule. Always window on event time rather than processing time, or a consumer lag spike silently reassigns events to the wrong bucket.",
  },
];
