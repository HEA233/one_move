"use client";

/* eslint-disable @next/next/no-img-element -- Product derivatives are local public assets and retain their authored crop. */

import type { ShopperNote, ShopperProduct } from "../shopper/types";
import { formatPrice, shopperCopy } from "../copy/copy";
import styles from "./OneMove.module.css";

type ProductCardProps = {
  product: ShopperProduct;
  selected?: boolean;
  compact?: boolean;
  onChoose?: (brandId: ShopperProduct["id"]) => void;
  onDetails: (product: ShopperProduct, trigger: HTMLButtonElement) => void;
  note?: ShopperNote | null;
  showNote?: boolean;
  onNoteSource?: (note: ShopperNote, trigger: HTMLButtonElement) => void;
};

function displayFacts(product: ShopperProduct) {
  return product.facts.filter((fact) => fact.id.includes("volume") || fact.id.includes("caffeine")).slice(0, 2);
}

export function ProductCard({ product, selected = false, compact = false, onChoose, onDetails, note = null, showNote = false, onNoteSource }: ProductCardProps) {
  const changedPrice = note?.targetBrand === product.id && note.patch.kind === "price" ? note.patch.afterPricePence : null;
  const price = changedPrice ?? product.pricePence;
  const cardClassName = `${styles.productCard}${selected ? ` ${styles.productCardSelected}` : ""}${compact ? ` ${styles.productCardCompact}` : ""}`;
  const facts = displayFacts(product);

  return (
    <article className={cardClassName} data-product-id={product.id}>
      <div className={styles.productImageFrame}>
        <img className={styles.productImage} src={product.imageSrc} alt={product.imageAlt} />
      </div>
      <div className={styles.productCardBody}>
        <strong className={styles.productName}>{product.name}</strong>
        <span className={styles.productVariant}>{product.variant}</span>
        <span className={styles.productCategory}>{product.category}</span>
        <span className={styles.productPrice}>
          {formatPrice(price)} <span className={styles.productVariant}>{changedPrice !== null ? "simulated offer" : "per can"}</span>
        </span>
      </div>
      {facts.length > 0 ? (
        <dl className={styles.factList}>
          {facts.map((fact) => (
            <div className={styles.factRow} key={fact.id}>
              <dt>{fact.label}</dt>
              <dd>{fact.displayValue}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {showNote && note ? (
        <div className={styles.noteCard} data-testid={`note-for-${product.id}`}>
          <p className={styles.noteText}>{note.text}</p>
          <span className={styles.noteOrigin}>
            {note.origin === "live" ? shopperCopy.liveOrigin : note.origin === "curated_fallback" ? shopperCopy.fallbackOrigin : shopperCopy.curatedOrigin}
          </span>
          {onNoteSource ? (
            <button className={styles.noteSourceButton} type="button" onClick={(event) => onNoteSource(note, event.currentTarget)}>
              {shopperCopy.revealSource}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className={styles.productCardActions}>
        {onChoose ? (
          <button
            className={styles.productChoiceButton}
            type="button"
            aria-pressed={selected}
            onClick={() => onChoose(product.id)}
          >
            {selected ? "Picked" : "Choose this drink"}
          </button>
        ) : null}
        <button className={styles.detailsButton} type="button" onClick={(event) => onDetails(product, event.currentTarget)}>
          {shopperCopy.details}
        </button>
      </div>
    </article>
  );
}
