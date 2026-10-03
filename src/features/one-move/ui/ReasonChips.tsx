"use client";

import type { ReasonKey } from "../shopper/types";
import { shopperCopy } from "../copy/copy";
import styles from "./OneMove.module.css";

const reasonKeys: readonly ReasonKey[] = ["taste", "purpose", "sugar_calories", "ingredients", "price", "packaging_brand", "other"];

type ReasonChipsProps = {
  selected: readonly ReasonKey[];
  otherText: string;
  onChange: (keys: ReasonKey[]) => void;
  onOtherTextChange: (value: string) => void;
};

export function ReasonChips({ selected, otherText, onChange, onOtherTextChange }: ReasonChipsProps) {
  function toggle(key: ReasonKey) {
    if (selected.includes(key)) {
      onChange(selected.filter((current) => current !== key));
      return;
    }

    if (selected.length >= 2) return;
    onChange([...selected, key]);
  }

  return (
    <div>
      <div className={styles.reasonGrid} aria-label="Optional reasons">
        {reasonKeys.map((key) => (
          <button
            className={styles.reasonChip}
            key={key}
            type="button"
            aria-pressed={selected.includes(key)}
            disabled={!selected.includes(key) && selected.length >= 2}
            onClick={() => toggle(key)}
          >
            {shopperCopy.reasonLabels[key]}
          </button>
        ))}
      </div>
      <p className={styles.reasonCount}>{selected.length} of 2 clues selected</p>
      {selected.includes("other") ? (
        <div className={styles.otherField}>
          <label htmlFor="one-move-other">{shopperCopy.whyOther}</label>
          <textarea
            id="one-move-other"
            value={otherText}
            maxLength={160}
            placeholder={shopperCopy.whyPlaceholder}
            onChange={(event) => onOtherTextChange(event.target.value)}
            aria-describedby="one-move-other-hint"
          />
          <p className={styles.otherHint} id="one-move-other-hint">
            {shopperCopy.whyPrivacy} {otherText.length}/160
          </p>
        </div>
      ) : null}
    </div>
  );
}
