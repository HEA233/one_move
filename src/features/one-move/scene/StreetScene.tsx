"use client";

import type { BrandId, ProductPlacement, ShopperProduct } from "../shopper/types";
import styles from "../ui/OneMove.module.css";

export type VisitorPosition = "junction" | "left" | "right";
export type ShopMood = "neutral" | "warm" | "thoughtful";

type StreetSceneProps = {
  products: readonly ShopperProduct[];
  placement: ProductPlacement;
  visitorPosition: VisitorPosition;
  envelopeTarget?: "left" | "right" | null;
  moodByBrand?: Partial<Record<BrandId, ShopMood>>;
};

export function StreetScene({ products, placement, visitorPosition, envelopeTarget = null, moodByBrand = {} }: StreetSceneProps) {
  const byId = new Map(products.map((product) => [product.id, product]));
  const leftProduct = byId.get(placement.left)!;
  const rightProduct = byId.get(placement.right)!;

  return (
    <div className={styles.street} data-testid="street-scene" role="img" aria-label="A hand-drawn street with two drink shops and a little visitor">
      <svg className={styles.streetSvg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className={styles.cloud} d="M5 16c1-3 5-3 6-1 2-3 7-2 7 2H5Z" />
        <path className={styles.cloud} d="M79 12c1.3-2.4 4.4-2.4 5.2-.5 2-2 5.2-.8 5.2 2H79Z" />
        <path className={styles.streetPath} d="M50 100C48 82 48 73 50 62C54 50 39 45 25 42M50 62C55 52 67 47 75 42" />
        <path className={styles.streetPathOutline} d="M50 100C48 82 48 73 50 62C54 50 39 45 25 42M50 62C55 52 67 47 75 42" />
        <path className={styles.grass} d="M7 73l2-3m0 3 3-2m76 6 2-3m-1 3 3-1M42 19l2-3m0 3 3-2m-33 42 2-3m0 3 3-2" />
        <ShopArt product={leftProduct} side="left" mood={moodByBrand[leftProduct.id] ?? "neutral"} />
        <ShopArt product={rightProduct} side="right" mood={moodByBrand[rightProduct.id] ?? "neutral"} />
      </svg>
      <div className={`${styles.visitor} ${visitorPosition === "junction" ? styles.visitorJunction : visitorPosition === "left" ? styles.visitorLeft : styles.visitorRight}`} aria-hidden="true">
        <span className={styles.visitorHead} />
        <span className={styles.visitorBody} />
      </div>
      {envelopeTarget ? <div className={`${styles.envelope} ${envelopeTarget === "left" ? styles.envelopeLeft : styles.envelopeRight}`} aria-hidden="true">✉</div> : null}
    </div>
  );
}

function ShopArt({ product, side, mood }: { product: ShopperProduct; side: "left" | "right"; mood: ShopMood }) {
  const x = side === "left" ? 8 : 59;
  const windowX = side === "left" ? 16 : 67;
  const doorX = side === "left" ? 36 : 87;
  const moodClass = mood === "warm" ? styles.moodWarm : mood === "thoughtful" ? styles.moodThoughtful : styles.shopWindow;

  return (
    <g>
      <image href={product.imageSrc} x={windowX} y="18" width="17" height="26" preserveAspectRatio="xMidYMid meet" />
      <g transform={`translate(${side === "left" ? 3 : 86} 32) scale(0.3) translate(${-x} -22)`}>
      <path className={styles.shopBody} d={`M${x} 29l5-7h28l5 7v19H${x}Z`} />
      <path className={`${styles.shopAwning} ${side === "right" ? styles.shopAwningAlt : ""}`} d={`M${x + 1} 29h44l-2 5H${x + 3}Z`} />
      <rect className={styles.shopWindow} x={windowX} y="29" width="17" height="13" rx="1.4" />
      <rect className={styles.shopDoor} x={doorX} y="34" width="5" height="14" rx="1" />
      <circle className={moodClass} cx={x + 39} cy="40" r="2.7" />
      <circle cx={x + 38.2} cy="39.5" r="0.35" fill="#30382F" />
      <circle cx={x + 39.8} cy="39.5" r="0.35" fill="#30382F" />
      {mood === "warm" ? <path d={`M${x + 38} 41q1.1 1 2.2 0`} fill="none" stroke="#30382F" strokeWidth="0.35" /> : null}
      {mood === "thoughtful" ? <path d={`M${x + 38} 41h2`} fill="none" stroke="#30382F" strokeWidth="0.35" /> : null}
      </g>
      <text className={styles.shopName} x={windowX + 8.5} y="50">{product.name}</text>
      <text className={styles.shopTinyLabel} x={windowX + 8.5} y="55">{product.variant}</text>
    </g>
  );
}
