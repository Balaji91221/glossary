"use client";

import { LAYERS } from "@/data/taxonomy";

const PATH = [
  {
    layer: "edge",
    name: "Arrives",
    desc: "A request reaches the edge. Protocol, identity, rate limits.",
  },
  {
    layer: "app",
    name: "Decides",
    desc: "Your code validates, routes, and works out what should happen.",
  },
  {
    layer: "data",
    name: "Persists",
    desc: "Truth is read or written. Transactions, indexes, caches.",
  },
  {
    layer: "app",
    name: "Defers",
    desc: "Slow work is enqueued for a worker and answered immediately.",
  },
  {
    layer: "infra",
    name: "Observes",
    desc: "Logs, metrics and traces record what just happened.",
  },
];

export default function Hero({ termCount, categoryCount, activeLayer, onPick }) {
  return (
    <header className="hero">
      <div className="shell">
        <p className="eyebrow">A reference for people who build things</p>
        <h1 className="hero-title">
          The vocabulary is the <em>map</em>.
        </h1>
        <p className="hero-lede">
          Every term below is one an engineer will use in front of you without
          explaining it. Each entry says what it means, then the part nobody
          writes down: the specific way it goes wrong once real traffic arrives.
          Read it end to end, or search when a word ambushes you in a code
          review.
        </p>

        <div className="hero-stats">
          <div>
            <span className="stat-num">{termCount}</span>
            <span className="eyebrow">terms defined</span>
          </div>
          <div>
            <span className="stat-num">{categoryCount}</span>
            <span className="eyebrow">areas covered</span>
          </div>
          <div>
            <span className="stat-num">4</span>
            <span className="eyebrow">system layers</span>
          </div>
          <div>
            <span className="stat-num">0</span>
            <span className="eyebrow">prior experience assumed</span>
          </div>
        </div>

        <div className="path">
          <div className="path-head">
            <span className="eyebrow">
              The life of one request — pick a stage to filter
            </span>
            {activeLayer && (
              <button className="chip" onClick={() => onPick(null)}>
                Clear filter ✕
              </button>
            )}
          </div>
          <div className="path-track">
            {PATH.map((node, i) => (
              <button
                key={node.name}
                className="path-node"
                data-active={activeLayer === node.layer}
                onClick={() =>
                  onPick(activeLayer === node.layer ? null : node.layer)
                }
                aria-pressed={activeLayer === node.layer}
              >
                <span className="path-node-idx">
                  {String(i + 1).padStart(2, "0")} · {LAYERS[node.layer].label}
                </span>
                <span className="path-node-name">{node.name}</span>
                <span className="path-node-desc">{node.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
