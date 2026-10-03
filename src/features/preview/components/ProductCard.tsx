"use client";

/* eslint-disable @next/next/no-img-element -- Fixture art uses a local data URL and image errors use the native browser event. */

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { formatFactBasis, formatFactValue, formatPricePence } from "../format";
import type { PreviewProduct } from "../types";

type ProductCardProps = {
  product: PreviewProduct;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: (id: string) => void;
};

export function ProductCard({ product, selected = false, disabled = false, onSelect }: ProductCardProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const hasImageError = failedSource === product.imageSrc;
  const cardClassName = `product-card${selected ? " product-card--selected" : ""}`;
  const contents = (
    <>
      <span className="product-card-image-wrap">
        {hasImageError || !product.imageSrc ? (
          <span className="product-card-image-fallback" role="img" aria-label="Image not available">
            <ImageOff aria-hidden="true" size={22} strokeWidth={1.7} />
            <span>Image not available</span>
          </span>
        ) : (
          // The fixture artwork is an authored local data image. No remote image is requested.
          <img
            className="product-card-image"
            src={product.imageSrc}
            alt={product.imageAlt}
            onError={() => setFailedSource(product.imageSrc)}
          />
        )}
      </span>
      <span className="product-card-main">
        <span className="product-card-name">{product.name}</span>
        <span className="product-card-price">{formatPricePence(product.pricePence)}</span>
      </span>
      <span className="product-card-facts">
        {product.facts.map((fact) => (
          <span className="product-fact" key={fact.id}>
            <span className="product-fact-label">{fact.label}</span>
            <span className="product-fact-value">{formatFactValue(fact.value, fact.unit)}</span>
            <span className="product-fact-basis">{formatFactBasis(fact.basis)}</span>
          </span>
        ))}
      </span>
      {onSelect ? <span className="product-card-selection" aria-hidden="true">{selected ? "Selected" : "Select product"}</span> : null}
    </>
  );

  if (onSelect) {
    return (
      <button
        className={cardClassName}
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        onClick={() => onSelect(product.id)}
      >
        {contents}
      </button>
    );
  }

  return <article className={`${cardClassName}${disabled ? " product-card--disabled" : ""}`}>{contents}</article>;
}
