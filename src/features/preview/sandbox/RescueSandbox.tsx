"use client";

import { useRef, useState } from "react";
import { Button } from "../components/Button";
import { CatalogueDiff } from "../components/CatalogueDiff";
import { EvidenceDrawer } from "../components/EvidenceDrawer";
import { FactSticker } from "../components/FactSticker";
import { InformationLens } from "../components/InformationLens";
import { OutcomePanel } from "../components/OutcomePanel";
import { SandboxScene } from "../components/SandboxScene";
import { rescueFixtures } from "../fixtures";
import { interactionCopy } from "../copy";
import { ReceiptCard } from "../components/ReceiptCard";

export function RescueSandbox() {
  const [fixtureId, setFixtureId] = useState(rescueFixtures[0].id);
  const [view, setView] = useState<"product" | "snapshot">("snapshot");
  const [selectedFactId, setSelectedFactId] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [compared, setCompared] = useState(false);
  const [evidenceFactId, setEvidenceFactId] = useState<string | null>(null);
  const factShelfRef = useRef<HTMLDivElement>(null);
  const [factOrigin, setFactOrigin] = useState<DOMRect | null>(null);
  const evidenceTriggerRef = useRef<HTMLButtonElement>(null);
  const fixture = rescueFixtures.find((candidate) => candidate.id === fixtureId) ?? rescueFixtures[0];
  const selectedFact = fixture.facts.find((fact) => fact.id === selectedFactId) ?? null;
  const evidenceFact = fixture.facts.find((fact) => fact.id === evidenceFactId) ?? null;
  const outcomeIsImmediate = fixture.outcome.status === "no_fact" || fixture.outcome.status === "unreviewed";

  function changeFixture(nextId: string) {
    setFixtureId(nextId);
    setView("snapshot");
    setSelectedFactId(null);
    setFactOrigin(null);
    setApplied(false);
    setCompared(false);
    setEvidenceFactId(null);
  }

  function selectFact(factId: string) {
    setSelectedFactId((current) => current === factId ? null : factId);
    setFactOrigin(null);
    setApplied(false);
    setCompared(false);
  }

  function resetExample() {
    setSelectedFactId(null);
    setFactOrigin(null);
    setApplied(false);
    setCompared(false);
    setEvidenceFactId(null);
  }

  function retryExample() {
    setFactOrigin(null);
    setApplied(false);
    setCompared(false);
  }

  const canApply = Boolean(selectedFact && selectedFact.reviewStatus === "checked" && !applied);

  return (
    <SandboxScene title={interactionCopy.rescue.title} description={interactionCopy.rescue.description}>
      <section className="rescue-scene" aria-labelledby="rescue-fixture-label">
        <div className="rescue-controls">
          <label className="preview-field" htmlFor="rescue-fixture">
            <span id="rescue-fixture-label">Rescue fixture</span>
            <select id="rescue-fixture" value={fixtureId} onChange={(event) => changeFixture(event.target.value)}>
              {rescueFixtures.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
            </select>
          </label>
        </div>

        <section className="fact-sticker-section" aria-labelledby="fact-sticker-title">
          <div className="scene-subheading">
            <h2 id="fact-sticker-title">Choose one fact</h2>
          </div>
          {fixture.facts.length ? (
            <div className="fact-sticker-list" ref={factShelfRef}>
              {fixture.facts.map((fact) => (
                <FactSticker
                  key={fact.id}
                  fact={fact}
                  selected={selectedFactId === fact.id}
                  onSelect={selectFact}
                  onViewSource={(factId, trigger) => {
                    evidenceTriggerRef.current = trigger;
                    setEvidenceFactId(factId);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="fact-empty-state">
              <p>No checked fact is available in this fixture.</p>
              <p>The preview will not generate a fact to fill the gap.</p>
            </div>
          )}
        </section>

        <div className="rescue-apply-area">
          {selectedFact?.reviewStatus === "unreviewed" ? <p className="rescue-apply-note">This fact can be viewed, but it cannot be applied as checked evidence.</p> : null}
          {selectedFact && applied ? <p className="rescue-apply-note rescue-apply-note--applied">Added to this local catalogue fixture.</p> : null}
          <Button variant="primary" disabled={!canApply} onClick={() => {
            setFactOrigin(factShelfRef.current?.querySelector('[aria-pressed="true"] strong')?.getBoundingClientRect() ?? null);
            setView("snapshot");
            setApplied(true);
          }}>{interactionCopy.rescue.add}</Button>
          <Button variant="quiet" onClick={resetExample}>{interactionCopy.rescue.reset}</Button>
        </div>

        <InformationLens product={fixture.product} snapshot={applied && fixture.appliedSnapshot ? fixture.appliedSnapshot : fixture.snapshot} view={view} onViewChange={setView} appliedFact={applied ? selectedFact : null} factOrigin={factOrigin} />

        {applied ? (
          <>
            {fixture.outcome.diff ? <CatalogueDiff diff={fixture.outcome.diff} /> : null}
            {!compared ? <Button className="rescue-compare-button" variant="secondary" onClick={() => setCompared(true)}>{interactionCopy.rescue.compare}</Button> : null}
          </>
        ) : null}

        {outcomeIsImmediate || compared ? <OutcomePanel outcome={fixture.outcome} onRetry={retryExample} /> : null}

        {outcomeIsImmediate || compared ? <ReceiptCard key={fixture.id} productName={fixture.product.name} receipt={fixture.outcome.receipt} /> : null}

        {evidenceFact ? <EvidenceDrawer fact={evidenceFact} returnFocusRef={evidenceTriggerRef} onClose={() => setEvidenceFactId(null)} /> : null}
      </section>
    </SandboxScene>
  );
}
