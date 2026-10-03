import { ArrowRight } from "lucide-react";
import type { RescueDiff } from "../types";

export function CatalogueDiff({ diff }: { diff: RescueDiff }) {
  return (
    <section className="catalogue-diff" aria-labelledby="catalogue-diff-title">
      <div className="catalogue-diff-heading">
        <h3 id="catalogue-diff-title">Only one field changed</h3>
      </div>
      <div className="catalogue-diff-row">
        <span className="catalogue-diff-field">{diff.field}</span>
        <span className="catalogue-diff-value catalogue-diff-value--before">{diff.before}</span>
        <ArrowRight aria-hidden="true" size={17} />
        <span className="catalogue-diff-value catalogue-diff-value--after">{diff.after}</span>
        {!diff.after.includes(diff.basis) ? <span className="catalogue-diff-basis">{diff.basis}</span> : null}
      </div>
      <p className="catalogue-diff-explanation">{diff.explanation}</p>
    </section>
  );
}
