"use client";

import { useEffect, useState } from "react";
import { AsyncStatePanel } from "./components/AsyncStatePanel";
import { Button } from "./components/Button";
import { FactPowerUp } from "./components/FactPowerUp";
import { FixtureDisclosure } from "./components/StatusBadge";
import { GhostReveal } from "./components/GhostReveal";
import { ImageFileInput } from "./components/ImageFileInput";
import { MissionCard } from "./components/MissionCard";
import { ProductCard } from "./components/ProductCard";
import { SandboxRouteNav } from "./components/SandboxRouteNav";
import { ShareLink } from "./components/ShareLink";
import { StatusBadge } from "./components/StatusBadge";
import { missions, products, sourcedFact } from "./fixtures";
import type { GhostState } from "./types";

type AsyncState = "idle" | "loading" | "error" | "empty";
type FactOutcome = "idle" | "rescue_succeeded" | "no_change" | "no_eligible_fact";

const asyncPanelCopy = {
  idle: { title: "Ready to preview", description: "Choose a state above." },
  loading: { title: "Loading example", description: "This is a fixed loading state." },
  error: { title: "Example failed", description: "This fixture shows an error message." },
  empty: { title: "Nothing to show", description: "This fixture contains no items." },
} satisfies Record<AsyncState, { title: string; description: string }>;

export function PreviewSandbox() {
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [missionsDisabled, setMissionsDisabled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [productsDisabled, setProductsDisabled] = useState(false);
  const [revealState, setRevealState] = useState<GhostState>("outside_shortlist");
  const [replayKey, setReplayKey] = useState(0);
  const [factSelected, setFactSelected] = useState(false);
  const [factOutcome, setFactOutcome] = useState<FactOutcome>("rescue_succeeded");
  const [asyncState, setAsyncState] = useState<AsyncState>("idle");
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/sandbox`);
  }, []);

  const panelCopy = asyncPanelCopy[asyncState];

  return (
    <div className="preview-page">
      <section className="preview-intro" aria-labelledby="preview-title">
        <h1 id="preview-title">A place on the shelf. Or a ghost.</h1>
        <p>Explore independent component states with fictional products.</p>
        <nav className="preview-anchor-nav" aria-label="Preview sections">
          <a href="#reveal">Reveal</a>
          <a href="#cards">Cards</a>
          <a href="#facts">Facts</a>
          <a href="#states">States</a>
          <a href="#image-share">Image &amp; link</a>
        </nav>
      </section>

      <SandboxRouteNav />

      <section className="preview-section preview-section--reveal" id="reveal" aria-labelledby="reveal-heading">
        <div className="preview-section-heading">
          <h2 id="reveal-heading">One place on the shelf</h2>
          <p>Change the supplied state and see what stays visible.</p>
        </div>
        <div className="ghost-demo">
          <GhostReveal product={products[0]} state={revealState} replayKey={replayKey} />
          <div className="demo-controls ghost-controls">
            <label className="preview-field" htmlFor="ghost-state">
              <span>Reveal fixture state</span>
              <select id="ghost-state" value={revealState} onChange={(event) => setRevealState(event.target.value as GhostState)}>
                <option value="shortlisted">Still on the shelf</option>
                <option value="outside_shortlist">Ghosted</option>
                <option value="cannot_verify">Cannot verify</option>
              </select>
            </label>
            <Button variant="secondary" onClick={() => setReplayKey((value) => value + 1)}>Replay animation</Button>
          </div>
        </div>
      </section>

      <section className="preview-section" id="cards" aria-labelledby="cards-heading">
        <div className="preview-section-heading">
          <h2 id="cards-heading">Missions and products</h2>
          <p>Each selection belongs to its own small example.</p>
        </div>

        <div className="preview-subsection">
          <div className="preview-subsection-heading">
            <h3>Choose a mission</h3>
            <label className="preview-toggle">
              <input type="checkbox" checked={missionsDisabled} onChange={(event) => setMissionsDisabled(event.target.checked)} />
              <span>Disable mission selection</span>
            </label>
          </div>
          <div className="mission-grid">
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                id={mission.id}
                title={mission.title}
                description={mission.description}
                icon={mission.icon}
                selected={selectedMission === mission.id}
                disabled={missionsDisabled}
                onSelect={(id) => setSelectedMission((current) => current === id ? null : id)}
              />
            ))}
          </div>
        </div>

        <div className="preview-subsection">
          <div className="preview-subsection-heading">
            <h3>Choose a product</h3>
            <label className="preview-toggle">
              <input type="checkbox" checked={productsDisabled} onChange={(event) => setProductsDisabled(event.target.checked)} />
              <span>Disable product selection</span>
            </label>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                selected={selectedProduct === product.id}
                disabled={productsDisabled}
                onSelect={(id) => setSelectedProduct((current) => current === id ? null : id)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="preview-section" id="facts" aria-labelledby="facts-heading">
        <div className="preview-section-heading">
          <h2 id="facts-heading">Add one sourced fact</h2>
          <p>Selection, source details and the supplied outcome stay separate.</p>
        </div>
        <div className="fact-demo-controls">
          <label className="preview-field" htmlFor="fact-outcome">
            <span>Fact outcome fixture</span>
            <select id="fact-outcome" value={factOutcome} onChange={(event) => setFactOutcome(event.target.value as FactOutcome)}>
              <option value="idle">No outcome</option>
              <option value="rescue_succeeded">Rescue succeeded</option>
              <option value="no_change">No change</option>
              <option value="no_eligible_fact">No eligible fact</option>
            </select>
          </label>
        </div>
        <FactPowerUp
          fact={sourcedFact}
          selected={factSelected}
          outcome={factOutcome}
          onSelect={() => setFactSelected((current) => !current)}
        />
      </section>

      <section className="preview-section" id="states" aria-labelledby="states-heading">
        <div className="preview-section-heading">
          <h2 id="states-heading">Loading, error and empty</h2>
          <p>Choose a display state. Nothing retries or runs in the background.</p>
        </div>
        <div className="async-demo-controls">
          <label className="preview-field" htmlFor="async-state">
            <span>Panel state</span>
            <select id="async-state" value={asyncState} onChange={(event) => setAsyncState(event.target.value as AsyncState)}>
              <option value="idle">Idle</option>
              <option value="loading">Loading</option>
              <option value="error">Error</option>
              <option value="empty">Empty</option>
            </select>
          </label>
          <FixtureDisclosure />
        </div>
        {asyncState === "error" ? (
          <AsyncStatePanel
            state="error"
            title={panelCopy.title}
            description={panelCopy.description}
            action={{ label: "Reset example", onClick: () => setAsyncState("idle") }}
          />
        ) : asyncState === "empty" ? (
          <AsyncStatePanel state="empty" title={panelCopy.title} description={panelCopy.description} />
        ) : asyncState === "loading" ? (
          <AsyncStatePanel state="loading" title={panelCopy.title} description={panelCopy.description} />
        ) : (
          <AsyncStatePanel state="idle" title={panelCopy.title} description={panelCopy.description} />
        )}
      </section>

      <section className="preview-section" id="image-share" aria-labelledby="image-share-heading">
        <div className="preview-section-heading">
          <h2 id="image-share-heading">Image and share link</h2>
          <p>Choose a file for this page only, or copy its current local address.</p>
        </div>
        <div className="image-share-grid">
          <ImageFileInput id="preview-image" label="Choose a local image" />
          <div className="share-link-panel">
            <h3>Share this preview</h3>
            <p className="supporting-copy">The QR code is generated on this page.</p>
            {shareUrl ? <ShareLink url={shareUrl} /> : <p className="supporting-copy">Preparing the local link.</p>}
          </div>
        </div>
      </section>

      <section className="preview-section preview-section--last" aria-labelledby="buttons-heading">
        <div className="preview-section-heading">
          <h2 id="buttons-heading">Buttons and status</h2>
          <p>Button variants and status labels remain clear without colour alone.</p>
        </div>
        <div className="button-status-demo">
          <div className="button-row" aria-label="Button examples">
            <Button variant="primary">Continue</Button>
            <Button variant="secondary" disabled>Unavailable</Button>
            <Button variant="quiet" loading loadingLabel="Loading example">Continue</Button>
          </div>
          <div className="status-row" aria-label="Status examples">
            <StatusBadge tone="neutral">Ready</StatusBadge>
            <StatusBadge tone="positive">Available</StatusBadge>
            <StatusBadge tone="warning">Unverified</StatusBadge>
            <StatusBadge tone="negative">Excluded</StatusBadge>
          </div>
        </div>
      </section>
    </div>
  );
}
