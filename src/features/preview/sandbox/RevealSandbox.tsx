"use client";

import { useState } from "react";
import { InformationLens } from "../components/InformationLens";
import { RevealStage } from "../components/RevealStage";
import { SandboxScene } from "../components/SandboxScene";
import { revealFixtures } from "../fixtures";
import { interactionCopy } from "../copy";
import { Button } from "../components/Button";

export function RevealSandbox() {
  const [fixtureId, setFixtureId] = useState(revealFixtures[0].id);
  const [view, setView] = useState<"product" | "snapshot">("product");
  const [revealed, setRevealed] = useState(false);
  const fixture = revealFixtures.find((candidate) => candidate.id === fixtureId) ?? revealFixtures[0];

  function changeFixture(nextId: string) {
    setFixtureId(nextId);
    setView("product");
    setRevealed(false);
  }

  return (
    <SandboxScene title={interactionCopy.reveal.title} description={interactionCopy.reveal.description}>
      <section className="reveal-scene" aria-labelledby="reveal-fixture-label">
        <div className="reveal-controls">
          <label className="preview-field" htmlFor="reveal-fixture">
            <span id="reveal-fixture-label">Reveal fixture</span>
            <select id="reveal-fixture" value={fixtureId} onChange={(event) => changeFixture(event.target.value)}>
              {revealFixtures.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
            </select>
          </label>
          <div className="button-row">
            <Button variant="primary" disabled={revealed} onClick={() => setRevealed(true)}>{interactionCopy.reveal.action}</Button>
            {revealed ? <Button variant="quiet" onClick={() => setRevealed(false)}>{interactionCopy.rescue.reset}</Button> : null}
          </div>
        </div>
        <InformationLens product={fixture.product} snapshot={fixture.snapshot} view={view} onViewChange={setView} />
        {revealed ? <RevealStage fixture={fixture} onRetry={() => setRevealed(false)} /> : null}
      </section>
    </SandboxScene>
  );
}
