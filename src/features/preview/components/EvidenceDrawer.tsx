"use client";

import { useEffect, useRef, type RefObject } from "react";
import { X } from "lucide-react";
import type { RescueFact } from "../types";
import { Button } from "./Button";

type EvidenceDrawerProps = {
  fact: RescueFact;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

export function EvidenceDrawer({ fact, returnFocusRef, onClose }: EvidenceDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerId = `${fact.id}-evidence`;

  useEffect(() => {
    closeRef.current?.focus();
  }, [fact.id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        returnFocusRef.current?.focus();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, returnFocusRef]);

  function closeDrawer() {
    returnFocusRef.current?.focus();
    onClose();
  }

  return (
    <aside className="evidence-drawer" role="dialog" aria-modal="false" aria-labelledby={`${drawerId}-title`}>
      <div className="evidence-drawer-heading">
        <div>
          <p className="product-details-label">Evidence drawer</p>
          <h2 id={`${drawerId}-title`}>{fact.label}: {fact.displayValue}</h2>
        </div>
        <Button ref={closeRef} variant="quiet" aria-label="Close evidence" onClick={closeDrawer}>
          <X aria-hidden="true" size={18} />
          <span>Close</span>
        </Button>
      </div>
      <blockquote>{fact.source.quote}</blockquote>
      <dl className="evidence-meta">
        <div><dt>Source label</dt><dd>{fact.source.label}</dd></div>
        <div><dt>Source type</dt><dd>{fact.source.sourceType}</dd></div>
        <div><dt>Review status</dt><dd>{fact.reviewStatus === "checked" ? "Checked example" : "Unreviewed"}</dd></div>
        <div><dt>Measurement basis</dt><dd>{fact.basis}</dd></div>
      </dl>
      {fact.source.url ? <a href={fact.source.url}>{fact.source.url}</a> : <p className="evidence-no-url">No URL supplied for this fictional source.</p>}
    </aside>
  );
}
