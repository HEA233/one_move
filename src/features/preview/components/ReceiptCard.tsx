import { interactionCopy } from "../copy";
import type { ReceiptSummary } from "../types";

type ReceiptCardProps = {
  productName: string;
  receipt: ReceiptSummary;
};

export function ReceiptCard({ productName, receipt }: ReceiptCardProps) {
  return (
    <details className="receipt-card">
      <summary>{interactionCopy.receipt.summary}</summary>
      <div className="receipt-card-body">
        <div className="receipt-card-heading">
          <p className="scene-label">Result record</p>
          <h3>{interactionCopy.receipt.title}</h3>
        </div>
        <dl className="receipt-card-list">
          <div><dt>Your pick</dt><dd>{productName}</dd></div>
          <div><dt>Before</dt><dd>{receipt.before}</dd></div>
          <div><dt>Added</dt><dd>{receipt.added}</dd></div>
          <div><dt>After</dt><dd>{receipt.after}</dd></div>
          <div><dt>Source</dt><dd>{receipt.source}</dd></div>
          {receipt.ranking ? <div><dt>Position</dt><dd>{receipt.ranking.before} → {receipt.ranking.after}</dd></div> : null}
        </dl>
        <p className="receipt-card-disclaimer">{interactionCopy.receipt.disclaimer}</p>
      </div>
    </details>
  );
}
