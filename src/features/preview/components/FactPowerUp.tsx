"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, FileText } from "lucide-react";
import { formatFactBasis, formatFactValue } from "../format";
import type { SourcedFact } from "../types";
import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";

type FactPowerUpProps = {
  fact: SourcedFact;
  selected: boolean;
  disabled?: boolean;
  outcome: "idle" | "rescue_succeeded" | "no_change" | "no_eligible_fact";
  onSelect: (id: string) => void;
};

const outcomeDetails = {
  rescue_succeeded: { label: "Rescue succeeded", tone: "positive" as const, detail: "Fixed visual example" },
  no_change: { label: "No change", tone: "neutral" as const, detail: "Fixed visual example" },
  no_eligible_fact: { label: "No eligible fact", tone: "warning" as const, detail: null },
};

export function FactPowerUp({ fact, selected, disabled = false, outcome, onSelect }: FactPowerUpProps) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const sourceId = `${fact.id}-source`;
  const outcomeDetail = outcome === "idle" ? null : outcomeDetails[outcome];
  const selectionDisabled = disabled || outcome === "no_eligible_fact";

  return (
    <article className="fact-card">
      <div className="fact-card-content">
        <div>
          <p className="fact-card-label">{fact.label}</p>
          <p className="fact-card-value">{formatFactValue(fact.value, fact.unit)}</p>
          <p className="fact-card-basis">{formatFactBasis(fact.basis)}</p>
        </div>
        <div className="fact-card-actions">
          <Button
            variant={selected ? "primary" : "secondary"}
            aria-pressed={selected}
            disabled={selectionDisabled}
            onClick={() => onSelect(fact.id)}
          >
            Select fact
          </Button>
          <Button
            variant="quiet"
            aria-expanded={sourceOpen}
            aria-controls={sourceId}
            onClick={() => setSourceOpen((open) => !open)}
          >
            <FileText aria-hidden="true" size={16} />
            <span>View source</span>
            <ChevronDown aria-hidden="true" size={15} className={sourceOpen ? "source-chevron source-chevron--open" : "source-chevron"} />
          </Button>
        </div>
      </div>

      {outcomeDetail ? (
        <div className="fact-outcome" aria-live="polite">
          <StatusBadge tone={outcomeDetail.tone}>{outcomeDetail.label}</StatusBadge>
          {outcomeDetail.detail ? <span className="fact-outcome-detail">{outcomeDetail.detail}</span> : null}
          <span className="preview-fixture-disclosure">UI fixture — not an AI result</span>
        </div>
      ) : null}

      <div className="fact-source" id={sourceId} hidden={!sourceOpen}>
        {fact.source ? (
          <>
            <p className="fact-source-label">{fact.source.label}</p>
            <blockquote>{fact.source.quote}</blockquote>
            {fact.source.url ? (
              <a className="fact-source-url" href={fact.source.url}>
                {fact.source.url}
                <ExternalLink aria-hidden="true" size={14} />
              </a>
            ) : null}
          </>
        ) : (
          <p>No source supplied</p>
        )}
      </div>
    </article>
  );
}
