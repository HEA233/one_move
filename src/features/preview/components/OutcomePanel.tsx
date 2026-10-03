import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";
import type { RescueOutcome } from "../types";

type OutcomePanelProps = {
  outcome: RescueOutcome;
  onRetry?: () => void;
};

const outcomeTone = {
  shortlisted: "positive",
  no_change: "neutral",
  more_unfavorable: "warning",
  no_fact: "warning",
  unreviewed: "warning",
  error: "negative",
} as const;

const outcomeLabel = {
  shortlisted: "Shortlist changed",
  no_change: "Shortlist unchanged",
  more_unfavorable: "Different result",
  no_fact: "No checked evidence",
  unreviewed: "Not checked",
  error: "Preview failed",
} as const;

export function OutcomePanel({ outcome, onRetry }: OutcomePanelProps) {
  return (
    <section className={`rescue-outcome rescue-outcome--${outcome.status}`} aria-live="polite" aria-labelledby="rescue-outcome-title">
      <StatusBadge tone={outcomeTone[outcome.status]}>{outcomeLabel[outcome.status]}</StatusBadge>
      <h3 id="rescue-outcome-title">{outcome.title}</h3>
      <p>{outcome.detail}</p>
      {outcome.requiredEvidence ? (
        <p className="rescue-required-evidence"><strong>What would help:</strong> {outcome.requiredEvidence}</p>
      ) : null}
      {outcome.retryLabel && onRetry ? <Button variant="secondary" onClick={onRetry}>{outcome.retryLabel}</Button> : null}
      <span className="preview-fixture-disclosure">UI fixture — not an AI result</span>
    </section>
  );
}
