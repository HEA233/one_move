"use client";

/* eslint-disable @next/next/no-img-element -- Fixture art is a local data URL with no image service. */

import { useId, useLayoutEffect, useRef } from "react";
import { formatFactBasis, formatFactValue, formatPricePence } from "../format";
import type { CatalogueSnapshot, PreviewProduct, RescueFact } from "../types";
import { StatusBadge } from "./StatusBadge";

type InformationLensProps = {
  product: PreviewProduct;
  snapshot: CatalogueSnapshot;
  view: "product" | "snapshot";
  appliedFact?: RescueFact | null;
  factOrigin?: DOMRect | null;
  onViewChange: (view: "product" | "snapshot") => void;
};

const statusCopy = {
  matched: { label: "Matched", tone: "positive" as const },
  missing: { label: "Not recorded in this snapshot", tone: "warning" as const },
  explicit_false: { label: "Explicitly recorded as false", tone: "neutral" as const },
  does_not_meet: { label: "Does not meet this mission", tone: "negative" as const },
};

export function InformationLens({ product, snapshot, view, onViewChange, appliedFact = null, factOrigin = null }: InformationLensProps) {
  const animatedOriginRef = useRef<DOMRect | null>(null);
  const addedValueRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const target = addedValueRef.current;
    if (!target || !factOrigin || factOrigin === animatedOriginRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animatedOriginRef.current = factOrigin;
    const destination = target.getBoundingClientRect();
    const animation = target.animate([
      { transform: `translate(${factOrigin.left - destination.left}px, ${factOrigin.top - destination.top}px)`, background: "var(--accent)" },
      { transform: "translate(0, 0)", background: "var(--accent-soft)" },
    ], { duration: 300, easing: "ease-out" });
    return () => animation.cancel();
  }, [appliedFact?.id, factOrigin, snapshot.id, view]);
  const tabsId = useId();
  const panelId = `${tabsId}-panel`;

  return (
    <section className="information-lens" aria-labelledby={`${tabsId}-title`}>
      <div className="lens-identity">
        <div className="lens-image-frame">
          <img src={product.imageSrc} alt={product.imageAlt} />
        </div>
        <div className="lens-identity-copy">
          <h2 id={`${tabsId}-title`}>{product.name}</h2>
          <p>{formatPricePence(product.pricePence)}</p>
        </div>
      </div>

      <div className="lens-tabs" role="tablist" aria-label="Information view" onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const nextView = event.key === "Home" ? "product" : event.key === "End" ? "snapshot" : view === "product" ? "snapshot" : "product";
        onViewChange(nextView);
        document.getElementById(`${tabsId}-${nextView}-tab`)?.focus();
      }}>
        <button
          className={view === "product" ? "lens-tab lens-tab--selected" : "lens-tab"}
          id={`${tabsId}-product-tab`}
          type="button"
          role="tab"
          aria-selected={view === "product"}
          tabIndex={view === "product" ? 0 : -1}
          aria-controls={panelId}
          onClick={() => onViewChange("product")}
        >
          Product view
        </button>
        <button
          className={view === "snapshot" ? "lens-tab lens-tab--selected" : "lens-tab"}
          id={`${tabsId}-snapshot-tab`}
          type="button"
          role="tab"
          aria-selected={view === "snapshot"}
          tabIndex={view === "snapshot" ? 0 : -1}
          aria-controls={panelId}
          onClick={() => onViewChange("snapshot")}
        >
          Agent&apos;s catalogue snapshot
        </button>
      </div>

      <div className="lens-panel" id={panelId} role="tabpanel" aria-live="polite" aria-labelledby={view === "product" ? `${tabsId}-product-tab` : `${tabsId}-snapshot-tab`}>
        {view === "product" ? (
          <div className="lens-product-view">
            <dl className="lens-fields">
              {product.facts.map((fact) => (
                <div key={fact.id}>
                  <dt>{fact.label}</dt>
                  <dd>{formatFactValue(fact.value, fact.unit)}</dd>
                  <small>{formatFactBasis(fact.basis)}</small>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <div className="lens-snapshot-view">
            <div className="lens-panel-heading">
              <h3>{snapshot.label}</h3>
              <p>Our test agent · this catalogue snapshot</p>
            </div>
            <dl className="lens-fields lens-snapshot-fields">
              {snapshot.fields.map((field) => {
                const status = statusCopy[field.status];
                return (
                  <div key={field.id} className={appliedFact?.fieldId === field.id ? "lens-field--added" : undefined}>
                    <dt>{field.label}</dt>
                    <dd><span ref={appliedFact?.fieldId === field.id ? addedValueRef : undefined} className={appliedFact?.fieldId === field.id ? "lens-added-value" : undefined}>{field.status === "missing" ? status.label : field.value ?? status.label}</span></dd>
                    {field.value && field.value !== status.label && field.status !== "missing" ? <span className="lens-status"><StatusBadge tone={status.tone}>{status.label}</StatusBadge></span> : null}
                    {field.basis && !field.value?.includes(field.basis) ? <small>{field.basis}</small> : null}
                    {field.explanation && field.explanation.replace(/\.$/, "") !== status.label ? <small>{field.explanation}</small> : null}
                    {appliedFact?.fieldId === field.id ? <small className="lens-added-note">Added fact</small> : null}
                  </div>
                );
              })}
            </dl>
            <details className="lens-raw-details">
              <summary>View raw fields</summary>
              <ul>
                {snapshot.rawFields.map((field) => <li key={field.key}><code>{field.key}</code><span>{field.value}</span></li>)}
              </ul>
            </details>
          </div>
        )}
      </div>
    </section>
  );
}
