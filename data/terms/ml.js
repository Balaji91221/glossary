// ML training — Making the model.
// Every entry follows docs/style-guide.md. Fields, in order:
//   t, aka?, c, l, level, def, plain, example, note, depth, see
// Keep foundational (level 1) terms near the top of the file.

export const TERMS = [
  {
    t: "Train / validation / test split",
    c: "ml",
    l: "ml",
    def: "Data divided into what the model learns from, what you tune against, and what you touch only once.",
    note: "Look at the test set repeatedly and you have leaked it. It is now a validation set and you have no honest estimate.",
    depth:
      "A random split is wrong more often than people assume: time-series data must be split chronologically (training on the future to predict the past is guaranteed leakage), and grouped data must be split by group so the same user or patient never appears on both sides. Stratify to preserve class proportions when a class is rare. Cross-validation gives a variance estimate as well as a point score on small datasets, and the test set should be touched once, at the end, as a decision you make deliberately.",
  },
  {
    t: "Overfitting vs underfitting",
    c: "ml",
    l: "ml",
    def: "Memorising the training data versus failing to learn the pattern at all.",
    note: "Diagnosed by the gap between training and validation performance, not by either number alone.",
    depth:
      "Read the learning curves: both errors high and converged means underfitting (more capacity or better features), a wide and growing gap means overfitting (more data, regularisation, dropout, or early stopping). Note that the classic advice to shrink the model is not the only lever and often not the best one — more data usually beats a smaller model. And beware the third case that looks like neither: good validation performance and poor production performance, which is usually distribution shift or leakage rather than a fitting problem at all.",
  },
  {
    t: "Loss function",
    c: "ml",
    l: "ml",
    def: "The number the training process minimises — how wrong the model currently is.",
    note: "The loss encodes what you actually want. Optimise the wrong loss and the model will satisfy it perfectly.",
    depth:
      "It is not the same as your evaluation metric, and the gap matters: cross-entropy is differentiable and trainable, while the F1 or business KPI you actually care about is not, so you optimise a proxy and evaluate on the real thing. Where costs are asymmetric — a missed fraud costing far more than a false alarm — encode that with class weights or a custom loss rather than hoping a threshold fixes it afterwards. Watch the loss curve during training: a sudden spike to NaN usually means the learning rate is too high or a division is unguarded.",
  },
  {
    t: "Epoch / batch / learning rate",
    c: "ml",
    l: "ml",
    def: "One pass over the data / how many samples per update / how large each update is.",
    note: "Learning rate is the hyperparameter that matters most. Too high diverges; too low never converges.",
    depth:
      "They interact: larger batches give less noisy gradients and typically want a proportionally larger learning rate (the linear scaling rule), while very large batches can generalise slightly worse. Batch size is bounded by GPU memory, and gradient accumulation is how you simulate a large one on a small card. Almost nobody uses a constant learning rate any more — warmup followed by cosine decay is the common default — and a learning-rate finder sweep is a cheap way to bracket the right order of magnitude before a long run.",
  },
  {
    t: "Gradient descent",
    c: "ml",
    l: "ml",
    def: "Iteratively adjusting parameters in the direction that reduces loss.",
    note: "The whole of training in one sentence. Everything else is variations on step size and direction.",
    depth:
      "Stochastic gradient descent uses a mini-batch rather than the full dataset, and that noise is a feature: it is what lets training escape sharp local minima. Adam adds per-parameter adaptive step sizes plus momentum, which is why it is the default for most deep learning, though plain SGD with momentum still generalises better on some vision tasks. The failure modes have names worth recognising — exploding gradients (fix with clipping) and vanishing gradients (why residual connections and normalisation layers exist).",
  },
  {
    t: "Feature engineering",
    c: "ml",
    l: "ml",
    def: "Transforming raw data into inputs a model can learn from.",
    note: "For classical ML this is where most of the performance comes from — far more than model selection.",
    depth:
      "The mechanics that matter: scaling for distance-based and gradient-based models, sensible encoding for categoricals (one-hot for low cardinality, target encoding for high — computed within the training fold, or you have leaked), and cyclical encoding for hour-of-day and day-of-week so 23:00 and 00:00 are near each other. The operational trap is training/serving skew, where a feature is computed one way in the training notebook and another way in the service; a feature store or shared transformation code is what prevents it.",
  },
  {
    t: "Data leakage",
    c: "ml",
    l: "ml",
    def: "Information from the future or from the target sneaking into training features.",
    note: "Produces spectacular offline metrics and a model that fails immediately in production. Suspect it when results look too good.",
    depth:
      "The usual sources: a feature computed after the outcome was known (a status field updated on resolution), scaling or imputation fitted on the whole dataset before splitting, a duplicated row landing on both sides, and target encoding computed across folds. Two habits catch most of it — fit every transformation inside a pipeline on the training fold only, and ask of each feature 'would this value have been available, with this value, at prediction time?'. A single feature with suspiciously high importance is the tell worth chasing.",
  },
  {
    t: "Precision vs recall",
    c: "ml",
    l: "ml",
    def: "Of what you flagged, how much was right / of what was there, how much did you find.",
    note: "You trade one for the other. Which matters depends entirely on whether false positives or false negatives cost more.",
    depth:
      "Both are functions of a threshold, so reporting a single pair without saying which threshold is meaningless — the model outputs a score, and you choose the operating point from the cost of each error type. Precision-recall curves are more informative than ROC on imbalanced data, where a large true-negative count flatters the ROC. F1 is the harmonic mean and assumes the two matter equally, which is rarely true; Fβ lets you weight them, and in practice the threshold is often set by capacity — how many alerts a review team can actually process in a day.",
  },
  {
    t: "Class imbalance",
    c: "ml",
    l: "ml",
    def: "One outcome vastly outnumbering another, as in fraud detection.",
    note: "Accuracy becomes meaningless — predicting 'never fraud' scores 99.9%. Use precision, recall and AUC instead.",
    depth:
      "Resampling changes the base rate, so a model trained on rebalanced data outputs miscalibrated probabilities and needs recalibration if you use the scores rather than just the ranking. Class weights in the loss are usually the cleaner first move; SMOTE-style synthetic oversampling is applied to the training fold only, never before the split. Often the better framing is anomaly detection or ranking rather than classification — and always compare against the trivial baseline, since 'always predict the majority' is the number your model must actually beat.",
  },
  {
    t: "Baseline",
    c: "ml",
    l: "ml",
    def: "The simplest reasonable approach, against which every model must justify itself.",
    note: "Always build it first. A surprising number of deployed models never beat 'predict the most common answer'.",
    depth:
      "Build the trivial one (majority class, or last observed value for a time series — surprisingly strong) and then a simple real one (logistic regression, gradient-boosted trees) before anything deep. The baseline also validates your pipeline end to end: if it scores 0.99, you have leakage, not a great baseline. Include the incumbent — the existing rules engine or the human process — because beating a research benchmark while losing to the heuristic already in production is a common and expensive way to be technically right.",
  },
  {
    t: "Inference",
    c: "ml",
    l: "ml",
    def: "Using a trained model to produce predictions, as opposed to training it.",
    note: "Different constraints entirely: training optimises throughput, inference optimises latency and cost per call.",
    depth:
      "Batch and online inference are different systems: batch scores millions offline overnight and tolerates minutes of latency; online serves one request in milliseconds and needs the features available at request time, which is the harder engineering problem. The optimisation toolkit is quantisation, distillation, ONNX or TensorRT compilation, and dynamic batching to use the accelerator efficiently. Feature parity with training is the recurring failure — the same transformation code must run in both paths, or the model sees inputs it was never trained on.",
  },
  {
    t: "Model registry",
    c: "ml",
    l: "ml",
    def: "Versioned storage of trained models with their metrics, parameters and lineage.",
    note: "'Which model is in production and what data produced it' must have an answer. MLflow exists for this.",
    depth:
      "A registered version should carry the artifact, the training data version, the code commit, the hyperparameters, the eval results and a stage (staging, production, archived) — enough for someone else to reproduce it and for you to roll back to it. Serving should resolve the model by registry stage rather than a hardcoded path, so promotion and rollback are metadata operations. Beware pickle-format artifacts: they embed library versions and are an arbitrary-code-execution risk, which is why ONNX or safetensors is the safer interchange.",
  },
  {
    t: "Experiment tracking",
    c: "ml",
    l: "ml",
    def: "Logging each run's configuration, code version, data version and results.",
    note: "Without it, comparing runs relies on memory and filenames like final_v3_actually_final.pkl.",
    depth:
      "Log automatically at the start of training rather than by hand at the end — git SHA (and whether the tree was dirty), the full config, the dataset hash, the environment, and metrics per epoch — because the run you forget to log is invariably the one that worked. Its real value is comparison across dozens of runs to see which hyperparameter actually mattered. Pair it with a config system (Hydra or equivalent) so a run is fully described by a file you can re-run, not by the arguments someone typed that afternoon.",
  },
  {
    t: "Drift",
    c: "ml",
    l: "ml",
    def: "Production data or relationships changing so a once-accurate model degrades.",
    note: "Models rot silently. Monitor input distributions and outcomes, not just uptime.",
    depth:
      "Separate the kinds: data drift is the input distribution moving, concept drift is the input-output relationship changing (the same features now imply a different outcome), and label delay is what makes the second hard to detect — if the true outcome only arrives 60 days later, accuracy monitoring is 60 days behind. So monitor proxies in the meantime: feature distributions (PSI, KL divergence), prediction distribution, and the rate of low-confidence outputs. Decide the retraining trigger in advance — scheduled, or drift-threshold-based — and keep a champion/challenger comparison so retraining cannot silently make things worse.",
  },
  {
    t: "Reproducibility",
    c: "ml",
    l: "ml",
    def: "Being able to recreate a result exactly — same data, same code, same seed.",
    note: "Version the data alongside the code. Immutable raw data and versioned transformations are the foundation.",
    depth:
      "Bit-exact reproducibility is genuinely hard on GPUs: non-deterministic kernels and floating-point non-associativity mean two runs with the same seed can differ, and forcing determinism (torch.use_deterministic_algorithms) costs speed. Aim for statistical reproducibility — the same conclusion within noise — and report the variance across seeds rather than one number. The infrastructure that makes it possible is unglamorous: pinned dependencies, a containerised environment, seeded generators, and data versioning (DVC, lakeFS) so 'the dataset' means a specific hash.",
  },
];
