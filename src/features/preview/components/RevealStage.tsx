"use client";

/* eslint-disable @next/next/no-img-element -- Fixture art is a local data URL with no image service. */

import { ProductCard } from "./ProductCard";
import { StatusBadge } from "./StatusBadge";
import type { PreviewProduct, RevealFixture } from "../types";
import { Button } from "./Button";

type RevealStageProps = {
  fixture: RevealFixture;
  onRetry: () => void;
};

function statusTone(status: RevealFixture["outcome"]["status"]): "neutral" | "positive" | "warning" | "negative" {
  if (status === "shortlisted") return "positive";
  if (status === "cannot_verify") return "warning";
  if (status === "mismatch" || status === "error") return "negative";
  return "neutral";
}

function Shortlist({ products }: { products: readonly PreviewProduct[] }) {
  return (
    <div className="reveal-shortlist" aria-labelledby="shortlist-heading">
      <div className="scene-subheading">
        <h3 id="shortlist-heading">Supplied shortlist</h3>
        <p>These products come from the selected fixture. No ranking is invented here.</p>
      </div>
      <ul>
        {products.map((product) => <li key={product.id}><ProductCard product={product} /></li>)}
      </ul>
    </div>
  );
}

export function RevealStage({ fixture, onRetry }: RevealStageProps) {
  const { product, outcome } = fixture;

  return (
    <section className="reveal-stage" aria-labelledby="reveal-stage-title">
      <div className="reveal-stage-heading">
        <div>
          <h2 id="reveal-stage-title">{outcome.title}</h2>
        </div>
      </div>

        <div className={`reveal-result reveal-result--${outcome.status}`} aria-live="polite">
          <div className="reveal-result-copy">
            <StatusBadge tone={statusTone(outcome.status)}>{outcome.status === "error" ? "Run failed" : outcome.status === "cannot_verify" ? "Not enough information" : outcome.status === "mismatch" ? "Does not meet" : outcome.status === "shortlisted" ? "On this shortlist" : "Outside shortlist"}</StatusBadge>
            <p>{outcome.detail}</p>
            {outcome.missingField ? <p className="reveal-missing-field">Unconfirmed: {outcome.missingField}</p> : null}
            <span className="preview-fixture-disclosure">UI fixture — not an AI result</span>
            {outcome.retryLabel ? <Button variant="secondary" onClick={onRetry}>{outcome.retryLabel}</Button> : null}
          </div>
          <div className="reveal-result-identity">
            <img src={product.imageSrc} alt="" />
            <span>{product.name}</span>
          </div>
        </div>

      {outcome.shortlist ? <Shortlist products={outcome.shortlist} /> : null}
    </section>
  );
}
