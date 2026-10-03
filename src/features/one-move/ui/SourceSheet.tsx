"use client";

/* eslint-disable @next/next/no-img-element -- Local product derivatives are intentionally rendered without remote image optimisation. */

import { useEffect, useRef, type RefObject } from "react";
import { shopperCopy } from "../copy/copy";
import type { ShopperNote, ShopperProduct } from "../shopper/types";
import styles from "./OneMove.module.css";

type SourceSheetProps = {
  product?: ShopperProduct;
  note?: ShopperNote;
  returnFocusRef: RefObject<HTMLElement | null>;
  onClose: () => void;
};

export function SourceSheet({ product, note, returnFocusRef, onClose }: SourceSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const title = product ? `${product.name}: ${shopperCopy.details}` : shopperCopy.revealSource;

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>("button, a[href], textarea, input, [tabindex]:not([tabindex='-1'])"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (returnFocusRef.current) {
        returnFocusRef.current.focus();
      } else {
        previouslyFocused?.focus();
      }
    };
  }, [onClose, returnFocusRef]);

  function close() {
    onClose();
  }

  return (
    <div className={styles.sheetBackdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div className={styles.sheet} ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby="one-move-sheet-title">
        <div className={styles.sheetHeader}>
          <h2 id="one-move-sheet-title">{title}</h2>
          <button className={styles.sheetClose} ref={closeRef} type="button" onClick={close}>
            Close
          </button>
        </div>
        {product ? (
          <>
            <div className={styles.sheetProduct}>
              <img src={product.imageSrc} alt={product.imageAlt} />
              <div>
                <p>{product.variant}</p>
                <p>{product.category}</p>
                <p className={styles.badgeNote}>Pretend game price: £2.50. Not a real offer.</p>
              </div>
            </div>
            <dl className={styles.factList}>
              {product.facts.map((fact) => (
                <div className={styles.factRow} key={fact.id}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.displayValue}</dd>
                  {fact.note ? <p className={styles.factNote}>{fact.note}</p> : null}
                </div>
              ))}
            </dl>
            <SourceList sources={product.sources} />
          </>
        ) : note ? (
          <>
            <div className={styles.revealNote}>
              <p>{note.text}</p>
              {note.caveat ? <p className={styles.caveat}>{note.caveat}</p> : null}
            </div>
            <p className={styles.helper}>{note.origin === "curated_fallback" ? shopperCopy.fallbackOrigin : note.origin === "live" ? shopperCopy.liveOrigin : shopperCopy.curatedOrigin}</p>
            <SourceList sources={note.sources} />
          </>
        ) : (
          <p className={styles.helper}>{shopperCopy.sourceMissing}</p>
        )}
      </div>
    </div>
  );
}

function SourceList({ sources }: { sources: readonly ShopperProduct["sources"][number][] }) {
  return (
    <section className={styles.sourceBlock} aria-labelledby="one-move-source-title">
      <h3 id="one-move-source-title">Source notes</h3>
      <div className={styles.sourceList}>
        {sources.length > 0 ? sources.map((source) => (
          <div key={source.id}>
            <strong>{source.title}</strong>
            <p>{source.scope}</p>
            <p>Checked {source.checkedDate ?? "date not recorded"}.</p>
            {source.url ? (
              <a href={source.url} target="_blank" rel="noreferrer">
                Open source
              </a>
            ) : null}
          </div>
        )) : <p>{shopperCopy.sourceMissing}</p>}
      </div>
    </section>
  );
}
