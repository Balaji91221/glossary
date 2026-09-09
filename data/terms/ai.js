// AI & LLM engineering — Building on models.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
  {
    t: "Token",
    c: "ai",
    l: "ai",
    def: "The unit a model reads and writes — roughly a word fragment. Billing and limits are counted in these.",
    note: "Roughly four characters of English. Code and non-Latin scripts tokenise less efficiently, so they cost more.",
    depth:
      "Tokenisation is why models struggle with character-level tasks — counting letters or reversing a string is hard when 'strawberry' is three opaque tokens rather than ten characters. It also drives cost asymmetry: output tokens typically cost several times input tokens, so a verbose response format is a real line item. Never estimate by dividing characters by four when it matters; count with the model's own tokeniser, especially for JSON, code, and non-English text where the ratio can be double.",
  },
  {
    t: "Context window",
    c: "ai",
    l: "ai",
    def: "The maximum tokens a model can consider at once, covering prompt and response together.",
    note: "Bigger is not free: latency and cost rise, and models attend less reliably to the middle of very long contexts.",
    depth:
      "The 'lost in the middle' effect is measurable: recall is strongest at the beginning and end of a long context and weakest in the middle, so place instructions and the most relevant retrieved chunks at the edges. Cost and latency scale with input length on every call, which is why sending a 100k-token context to answer a one-line question is usually the wrong trade against retrieval. Reserve headroom explicitly for the output — the window is shared, and a prompt that fills it leaves the model no room to answer.",
  },
  {
    t: "Temperature",
    c: "ai",
    l: "ai",
    def: "A sampling parameter controlling randomness. Low is focused and repetitive; high is varied and erratic.",
    note: "Use low values for extraction and classification, higher for ideation. It is not a creativity dial so much as a risk dial.",
    depth:
      "Mechanically it rescales the logits before sampling: below 1 sharpens the distribution toward the most likely token, above 1 flattens it. Note that temperature 0 is near-deterministic, not guaranteed deterministic — batching and floating-point non-associativity on GPUs still produce variation, so never build a test that requires byte-identical output. top_p (nucleus sampling) is the parameter usually worth tuning alongside it, and adjusting both at once makes the effect of either hard to reason about.",
  },
  {
    t: "System prompt",
    c: "ai",
    l: "ai",
    def: "Instructions setting the model's role, constraints and output format before user input arrives.",
    note: "Keep prompts in files, not string literals. You will iterate on them constantly and want them diffable.",
    depth:
      "Treat it as code: version it, review changes, and evaluate before and after, because a prompt edit is a behaviour change shipped without a type checker. Structure beats prose — role, then constraints, then output format, then examples, with delimiters separating instructions from user-supplied content so injected text is visibly data. Be specific about what to do rather than what to avoid, state the failure behaviour explicitly ('if the answer is not in the context, say you do not know'), and keep it stable at the front so prompt caching can apply.",
  },
  {
    t: "Few-shot prompting",
    c: "ai",
    l: "ai",
    def: "Including examples of desired input-output pairs in the prompt.",
    note: "Usually the cheapest large quality gain available. Two good examples often beat a paragraph of instructions.",
    depth:
      "Examples teach format and edge-case handling far more reliably than they teach knowledge, so pick them to cover the boundaries you care about — the ambiguous case, the empty case, the refuse case — rather than three variations of the easy one. Watch for label bias: if all your examples share one output class, the model will over-predict it. Each example costs tokens on every call, which is where dynamic few-shot (retrieving the most similar examples per input) earns its complexity, and prompt caching makes a fixed set nearly free.",
  },
  {
    t: "Structured output",
    aka: "function calling, tool use",
    c: "ai",
    l: "ai",
    def: "Constraining a model to emit JSON matching a schema, or to call a declared function with typed arguments.",
    note: "How you get from 'text generator' to 'component in a program'. Validate the output anyway.",
    depth:
      "Constrained decoding makes the JSON syntactically valid by construction, which is a different guarantee from being semantically right — the model can still invent an id or pick the wrong enum member, so validation stays your job. The schema is part of the prompt: field names and descriptions are read as instructions, so 'iso8601_start_date' with a description outperforms 'date'. Keep schemas flat and shallow, mark truly optional fields as nullable rather than absent, and handle the refusal case, since a model that should decline still has to say so inside your schema.",
  },
  {
    t: "Embedding",
    c: "ai",
    l: "ai",
    def: "A vector of numbers representing meaning, where similar text lands nearby in the space.",
    note: "Embeddings from different models are not comparable. Change the model and you must re-embed everything.",
    depth:
      "Cosine similarity is the usual metric, and it is relative, not absolute — 0.82 means nothing on its own, only in comparison to other scores from the same model, so thresholds must be calibrated per model and per corpus. Asymmetric models expect a prefix distinguishing a query from a document, and skipping it quietly costs recall. Dimensionality is a storage and speed trade (1536 floats is 6KB per chunk before indexing), and re-embedding a corpus is a migration to plan for, not a config change.",
  },
  {
    t: "Vector store",
    c: "ai",
    l: "data",
    def: "A database that indexes vectors for nearest-neighbour search — pgvector, Pinecone, Qdrant, Weaviate.",
    note: "If you already run Postgres, start with pgvector. A separate vector database is a real operational cost.",
    depth:
      "Search is approximate: HNSW and IVFFlat trade recall for speed, so tuning parameters (ef_search, nprobe) moves you along that curve and the default may be missing relevant results silently. Metadata filtering is the feature that decides most architectures — filtering by tenant or date before the vector search is what keeps multi-tenant retrieval correct and fast, and doing it after means you may filter away everything you retrieved. Index build time and memory matter at scale: HNSW is fast to query and expensive to build and hold.",
  },
  {
    t: "Chunking",
    c: "ai",
    l: "ai",
    def: "Splitting documents into pieces before embedding them.",
    note: "Chunk size and overlap dominate retrieval quality more than model choice does. Split on structure, not character counts.",
    depth:
      "Split on the document's own boundaries — headings, sections, function definitions — because a chunk cut mid-sentence embeds a fragment whose meaning is genuinely unclear. Two techniques earn their complexity: prepending the document title and section path to each chunk so it carries its context, and small-to-big retrieval, where you embed small precise chunks but pass the larger surrounding section to the model. Tables and code resist naive splitting badly, and overlap of 10–20% is the usual cheap insurance against a boundary landing on the one sentence that mattered.",
  },
  {
    t: "RAG",
    aka: "retrieval-augmented generation",
    c: "ai",
    l: "ai",
    def: "Retrieve relevant chunks, insert them into the prompt, and have the model answer from them.",
    note: "Most RAG failures are retrieval failures. Measure whether the right chunk was fetched before blaming the model.",
    depth:
      "Evaluate the two stages separately or you will tune blind: retrieval with recall@k and precision (was the answer-bearing chunk in the top k), generation with faithfulness (is the answer supported by what was retrieved). The most common production failure is the missing-context case where the model answers anyway from parametric memory, which is why the prompt must instruct it to decline and why citations should be required. Also plan for the freshness problem — an index built once is wrong the day the source changes, so re-indexing is a pipeline, not a script.",
  },
  {
    t: "Reranking",
    c: "ai",
    l: "ai",
    def: "A second model reordering retrieved candidates by actual relevance before they enter the prompt.",
    note: "Retrieve broadly, rerank tightly. Usually a bigger win than tuning the embedding model.",
    depth:
      "A cross-encoder reads the query and the document together, which is why it is far more accurate than the bi-encoder that produced the embeddings — and far too slow to run over the whole corpus. That asymmetry is the whole design: retrieve 50–100 cheaply, rerank to the top 5, spend the latency budget where it changes the answer. Expect 50–200ms for the rerank call, and note the second benefit — a calibrated relevance score lets you drop everything below a threshold rather than always passing k chunks regardless of quality.",
  },
  {
    t: "Hybrid search",
    c: "ai",
    l: "ai",
    def: "Combining keyword search with vector search.",
    note: "Vectors miss exact identifiers, error codes and product names. Keywords catch what semantics blur.",
    depth:
      "The two systems fail in opposite directions: BM25 nails exact tokens (an error code, a SKU, a surname) and misses paraphrase; embeddings handle paraphrase and blur the exact string. Reciprocal rank fusion is the standard way to combine them because it merges rankings without needing the two score scales to be comparable — which they are not. In practice hybrid is the strongest default for technical corpora, where users search for identifiers as often as concepts, and the keyword half is also what makes results explainable.",
  },
  {
    t: "Hallucination",
    c: "ai",
    l: "ai",
    level: 1,
    def: "Model output that is fluent and confident but factually wrong or unsupported by any source.",
    plain: "The model writes something that sounds right but is made up, the way a confident person fills a gap in their memory.",
    example: "Asked how to cancel a subscription with the SDK, the model returns client.subscriptions.cancel_now(), a method that does not exist. It reads correctly and fails at runtime.",
    note: "The core reliability problem. Grounding, citations and verification reduce it; nothing eliminates it.",
    depth:
      "It is intrinsic to the mechanism — the model is sampling plausible continuations, and there is no separate store of facts to consult — so treat mitigation as engineering rather than a bug to be fixed. What works: ground answers in retrieved text, require span-level citations you can verify programmatically, keep temperature low for factual tasks, and give the model an explicit escape ('say you do not know'). The dangerous shape is the confident specific detail — a plausible case number, a real-looking API method — which is exactly the kind humans do not double-check.",
    see: ["rag","grounding-citations","eval","llm-as-judge"],
  },
  {
    t: "Eval",
    c: "ai",
    l: "ai",
    def: "A test suite for non-deterministic output, scored against rubrics, references or a judge model.",
    note: "Build these before optimising anything. Without evals, prompt changes are superstition.",
    depth:
      "Prefer deterministic checks wherever the task allows one — schema validity, exact match on extraction, does the cited span exist — and reserve model grading for genuinely open-ended output. Track cost and latency alongside quality, since a prompt that scores two points higher and costs triple is not obviously a win. Run them in CI on every prompt or model change, expect noise (run multiple samples and compare distributions rather than single scores), and remember that an eval set which stops finding failures has stopped being useful.",
  },
  {
    t: "Golden dataset",
    c: "ai",
    l: "ai",
    def: "A curated set of inputs with known-good outputs used as the benchmark for every change.",
    note: "Start with twenty real examples, including the ones that already failed. Grow it from production traffic.",
    depth:
      "Grow it from real failures: every production complaint becomes a case, which is what keeps it representative rather than a set of examples you happened to imagine. Stratify deliberately across categories, difficulty and edge cases so an aggregate score cannot hide a class that regressed, and hold a portion back that you never tune against — otherwise you overfit the prompt to the benchmark exactly as you would overfit a model. Version it alongside the prompts, since comparing scores across two different datasets means nothing.",
  },
  {
    t: "LLM-as-judge",
    c: "ai",
    l: "ai",
    def: "Using a model to grade another model's output against criteria.",
    note: "Scales evaluation but inherits biases — position, verbosity, self-preference. Calibrate against human labels.",
    depth:
      "The biases are documented and correctable: position bias (swap the order of A and B and average), verbosity bias (longer answers score higher), and self-preference (a model favouring its own outputs, so use a different model as judge where you can). Pairwise comparison is more reliable than absolute scoring, and a 1–5 scale without anchored descriptions per point produces mush. Measure the judge itself — agreement with human labels on a sample — because an uncalibrated judge is a confident number with unknown meaning.",
  },
  {
    t: "Agent",
    c: "ai",
    l: "ai",
    def: "A model in a loop, choosing tools, observing results and deciding the next step.",
    note: "Every loop iteration multiplies error probability. Cap iterations, log every step, and prefer a fixed workflow when one exists.",
    depth:
      "The arithmetic is unforgiving: 95% reliability per step is 60% over ten steps, which is why fewer, more capable tools beat many granular ones and why a deterministic workflow should be preferred wherever the sequence is actually known in advance. Tool descriptions are prompt engineering — ambiguous ones produce wrong tool choices far more often than model capability does. Budget iterations, tokens and wall-clock; make destructive tools require confirmation; and log every step's input and output, because debugging an agent without a trace of its reasoning path is guesswork.",
  },
  {
    t: "Guardrails",
    c: "ai",
    l: "ai",
    def: "Validation applied to model inputs and outputs — schema checks, content filters, refusal detection.",
    note: "The model is a component that can fail. Guardrails are the same input validation you already write elsewhere.",
    depth:
      "Layer them by cost: cheap deterministic checks first (schema, regex, allowlists, length), then a classifier, then a model-based check only if needed — and decide per failure whether to retry, repair, fall back, or refuse. Input guardrails catch injection attempts and out-of-scope requests; output guardrails catch leaked PII, unsupported claims and malformed structure. Every guardrail adds latency and false positives, so measure both, and log what they block: that log is your best early signal of how the system is being misused.",
  },
  {
    t: "Streaming",
    c: "ai",
    l: "edge",
    def: "Sending tokens to the client as they are generated rather than waiting for completion.",
    note: "Does not reduce total latency but transforms perceived speed. Complicates error handling mid-response.",
    depth:
      "The metric it improves is time-to-first-token, and that is the one users feel; total generation time is unchanged. The engineering costs are real: an error after 200 tokens have been sent cannot become a 500, so you need in-band error events and a client that can handle a truncated response. Server-Sent Events over HTTP is the usual transport, buffering proxies must be disabled or they defeat the whole thing, and any output validation you wanted to do now has to happen either incrementally or after the user has already read it.",
  },
  {
    t: "Prompt caching",
    c: "ai",
    l: "ai",
    def: "Reusing computation for an unchanged prompt prefix across calls.",
    note: "Put stable content first and variable content last, and long system prompts become dramatically cheaper.",
    depth:
      "It matches on an exact prefix, so a single changed character early in the prompt — a timestamp, a shuffled example, a user name in the system message — invalidates everything after it. Order accordingly: system instructions, then tools, then few-shot examples, then retrieved context, then the user turn. Caches have a short TTL (minutes), so the benefit is concentrated in multi-turn conversations and high-frequency endpoints, where the discount on cached input tokens is large enough to change the economics of a long system prompt entirely.",
  },
  {
    t: "Fine-tuning vs prompting",
    c: "ai",
    l: "ml",
    def: "Adjusting model weights on your data, versus improving instructions and examples.",
    note: "Try prompting, retrieval, then fine-tuning, in that order. Fine-tuning teaches form far better than it teaches facts.",
    depth:
      "The split is capability versus knowledge: fine-tuning is excellent for style, format, tone and consistent classification behaviour, and a poor way to install facts that change — those belong in retrieval, where they can be updated without a training run. LoRA and other parameter-efficient methods make it cheap enough to try with a few hundred to a few thousand well-curated examples, where quality matters far more than volume. The hidden cost is lifecycle: a fine-tune pins you to a base model, and every upgrade means retraining and re-evaluating.",
  },
  {
    t: "Distillation",
    c: "ai",
    l: "ml",
    def: "Training a smaller model to reproduce a larger model's behaviour.",
    note: "How a slow expensive prototype becomes a fast cheap production path once you have traffic to learn from.",
    depth:
      "The practical recipe is to run the large model in production first, log inputs and outputs, filter that trace to the cases it handled well, and fine-tune a small model on the result — your traffic is the training set, which is why this comes after launch rather than before. Expect a narrower model: it will match the teacher on the distribution you distilled and degrade off it, so keep an escalation path to the larger model for low-confidence or unusual inputs. Check the terms of the teacher model's licence before distilling from it.",
  },
  {
    t: "Token budget",
    c: "ai",
    l: "ai",
    def: "The deliberate allocation of a context window between instructions, retrieved context, history and output.",
    note: "Unmanaged conversation history is the usual cause of gradually rising cost and sudden context-limit errors.",
    depth:
      "Write the allocation down and enforce it in code — for example 2k system, 8k retrieved context, 4k history, 2k reserved output — with a truncation strategy per section rather than one global trim that silently drops your instructions. History is the section that grows without limit: a sliding window is the simple answer, rolling summarisation the better one for long sessions. Count tokens before sending rather than catching the API's context-length error, and log the per-section usage so cost regressions are visible before the bill is.",
  },
];
