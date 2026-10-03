/* eslint-disable @next/next/no-img-element -- Fixture art is a local data URL with no image service. */

import { StatusBadge } from "./StatusBadge";
import type { GhostState, PreviewProduct } from "../types";

type GhostRevealProps = {
  product: PreviewProduct;
  state: GhostState;
  replayKey?: number;
};

const results: Record<GhostState, { title: string; detail: string }> = {
  shortlisted: {
    title: "Still on the shelf",
    detail: "This fixed example keeps the product in the shortlist.",
  },
  outside_shortlist: {
    title: "Ghosted",
    detail: "This fixed example leaves the product outside the shortlist.",
  },
  cannot_verify: {
    title: "Cannot verify",
    detail: "This fixed example does not provide enough information.",
  },
};

export function GhostReveal({ product, state, replayKey = 0 }: GhostRevealProps) {
  const result = results[state];

  return (
    <div className={`ghost-reveal ghost-reveal--${state}`}>
      <figure className="ghost-visual">
        <div className={`ghost-stage ghost-stage--${state}`}>
          <img
            key={`${state}-${replayKey}`}
            className="ghost-stage-art"
            src={product.imageSrc}
            alt=""
            aria-hidden="true"
          />
        </div>
        <figcaption className="ghost-product-name">{product.name}</figcaption>
      </figure>
      <div className="ghost-result">
        <span className="ghost-eyebrow">UI fixture — not an AI result</span>
        {state === "cannot_verify" ? <StatusBadge tone="warning">Unverified</StatusBadge> : null}
        <div className="ghost-result-copy" aria-live="polite">
          <h3>{result.title}</h3>
          <p>{result.detail}</p>
        </div>
      </div>
    </div>
  );
}
