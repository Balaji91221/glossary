"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, LAYERS, resolveLayer } from "@/data/taxonomy";

function Highlight({ text, query }) {
  if (!query || query.length < 2) return text;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safe})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i}>{part}</mark>
    ) : (
      part
    )
  );
}

export default function Glossary({ terms, activeLayer, onLayerChange }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(null);
  const inputRef = useRef(null);

  // "/" focuses search — the convention every developer already knows.
  useEffect(() => {
    function onKey(e) {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setQuery("");
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return terms.filter((t) => {
      if (category && t.c !== category) return false;
      if (activeLayer && resolveLayer(t.l).id !== activeLayer) return false;
      if (q && !t.search.includes(q)) return false;
      return true;
    });
  }, [terms, query, category, activeLayer]);

  const grouped = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      cat,
      items: filtered.filter((t) => t.c === cat.id),
    })).filter((g) => g.items.length > 0);
  }, [filtered]);

  const counts = useMemo(() => {
    const base = terms.filter(
      (t) => !activeLayer || resolveLayer(t.l).id === activeLayer
    );
    return CATEGORIES.reduce((acc, c) => {
      acc[c.id] = base.filter((t) => t.c === c.id).length;
      return acc;
    }, {});
  }, [terms, activeLayer]);

  return (
    <section className="section" id="glossary">
      <div className="shell">
        <div className="section-head">
          <p className="eyebrow">Section 01 — The glossary</p>
          <h2>Every word, and how it bites</h2>
          <p>
            Filter by area, by where a term lives in a running system, or just
            type. Definitions are deliberately short; the indented line
            underneath each one is the part that matters on a Tuesday afternoon
            when something is broken.
          </p>
        </div>

        <div className="controls">
          <div className="searchbar">
            <span className="eyebrow" aria-hidden="true">
              Find
            </span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="idempotent, backpressure, SIGTERM, chunking…"
              aria-label="Search all terms"
            />
            <span className="kbd">press /</span>
          </div>

          <div className="filter-row">
            <button
              className="chip"
              data-on={!category && !activeLayer}
              onClick={() => {
                setCategory(null);
                onLayerChange(null);
              }}
            >
              All {terms.length}
            </button>
            {Object.values(LAYERS).map((l) => (
              <button
                key={l.id}
                className="chip"
                data-on={activeLayer === l.id}
                title={l.blurb}
                onClick={() =>
                  onLayerChange(activeLayer === l.id ? null : l.id)
                }
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="filter-row">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className="chip"
                data-on={category === c.id}
                disabled={counts[c.id] === 0}
                style={counts[c.id] === 0 ? { opacity: 0.3 } : undefined}
                onClick={() => setCategory(category === c.id ? null : c.id)}
              >
                {c.name}
                <span className="chip-count">{counts[c.id]}</span>
              </button>
            ))}
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="empty">
            <strong>Nothing matches that yet.</strong>
            Try a shorter word, or clear the filters above.
          </div>
        ) : (
          grouped.map(({ cat, items }) => (
            <div className="cat-block" key={cat.id} id={cat.id}>
              <div className="cat-head">
                <h3>{cat.name}</h3>
                <span className="eyebrow">
                  {cat.kicker} · {items.length}
                </span>
              </div>
              <p className="cat-summary">{cat.summary}</p>
              <div className="term-grid">
                {items.map((t) => (
                  <article className="term" key={t.id}>
                    <div className="term-top">
                      <div>
                        <span className="term-name">
                          <Highlight text={t.t} query={query} />
                        </span>
                        {t.aka && <span className="term-aka">aka {t.aka}</span>}
                      </div>
                      <span className="layer-tag">{resolveLayer(t.l).label}</span>
                    </div>
                    <p className="term-def">
                      <Highlight text={t.def} query={query} />
                    </p>
                    <p className="term-note">
                      <Highlight text={t.note} query={query} />
                    </p>
                    {t.depth && (
                      <details className="term-depth">
                        <summary>In depth</summary>
                        <p className="term-depth-body">
                          <Highlight text={t.depth} query={query} />
                        </p>
                      </details>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
