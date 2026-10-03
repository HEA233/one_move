"use client";

import { FileText } from "lucide-react";
import type { RescueFact } from "../types";
import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";

type FactStickerProps = {
  fact: RescueFact;
  selected: boolean;
  onSelect: (id: string) => void;
  onViewSource: (id: string, trigger: HTMLButtonElement) => void;
};

export function FactSticker({ fact, selected, onSelect, onViewSource }: FactStickerProps) {
  return (
    <article className={`fact-sticker${selected ? " fact-sticker--selected" : ""}`}>
      <button className="fact-sticker-select" type="button" aria-pressed={selected} onClick={() => onSelect(fact.id)}>
        <span className="fact-sticker-label">{fact.label}</span>
        <strong>{fact.displayValue}</strong>
        {!fact.displayValue.includes(fact.basis) ? <span className="fact-sticker-basis">{fact.basis}</span> : null}
      </button>
      <div className="fact-sticker-footer">
        {fact.reviewStatus === "unreviewed" ? <StatusBadge tone="warning">Not checked</StatusBadge> : <span className="fact-sticker-checked">Checked example</span>}
        <Button
          variant="quiet"
          onClick={(event) => onViewSource(fact.id, event.currentTarget)}
        >
          <FileText aria-hidden="true" size={15} />
          <span>Example source</span>
        </Button>
      </div>
    </article>
  );
}
