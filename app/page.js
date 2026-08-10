"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import Glossary from "@/components/Glossary";
import { ReadingPath, Toolkit, Footer } from "@/components/Sections";
import { TERMS } from "@/data";
import { CATEGORIES } from "@/data/taxonomy";

export default function Page() {
  const [activeLayer, setActiveLayer] = useState(null);

  return (
    <>
      <div className="masthead">
        <div className="shell masthead-inner">
          <span className="wordmark">
            The Engineer&apos;s <span>Field Manual</span>
          </span>
          <nav>
            <a href="#glossary">Glossary</a>
            <a href="#path">Learning path</a>
            <a href="#toolkit">Toolkit</a>
          </nav>
        </div>
      </div>

      <main>
        <Hero
          termCount={TERMS.length}
          categoryCount={CATEGORIES.length}
          activeLayer={activeLayer}
          onPick={setActiveLayer}
        />
        <Glossary
          terms={TERMS}
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
        />
        <ReadingPath />
        <Toolkit />
      </main>

      <Footer />
    </>
  );
}
