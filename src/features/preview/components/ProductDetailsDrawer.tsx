"use client";

/* eslint-disable @next/next/no-img-element -- Fixture art is a local data URL with no image service. */

import { useEffect, useRef, type RefObject } from "react";
import { X } from "lucide-react";
import { formatFactBasis, formatFactValue, formatPricePence } from "../format";
import type { PreviewProduct } from "../types";
import { Button } from "./Button";

type ProductDetailsDrawerProps = {
  product: PreviewProduct;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

export function ProductDetailsDrawer({ product, returnFocusRef, onClose }: ProductDetailsDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerId = `${product.id}-details`;

  useEffect(() => {
    closeRef.current?.focus();
  }, [product.id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        returnFocusRef.current?.focus();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, returnFocusRef]);

  function closeDrawer() {
    returnFocusRef.current?.focus();
    onClose();
  }

  return (
    <aside className="product-details-drawer" id={drawerId} role="dialog" aria-modal="false" aria-labelledby={`${drawerId}-title`}>
      <div className="product-details-heading">
        <div>
          <p className="product-details-label">Product details</p>
          <h2 id={`${drawerId}-title`}>{product.name}</h2>
        </div>
        <Button ref={closeRef} variant="quiet" aria-label={`Close details for ${product.name}`} onClick={closeDrawer}>
          <X aria-hidden="true" size={18} />
          <span>Close</span>
        </Button>
      </div>
      <div className="product-details-body">
        <img className="product-details-image" src={product.imageSrc} alt={product.imageAlt} />
        <div className="product-details-copy">
          <dl className="product-details-list">
            <div>
              <dt>Price</dt>
              <dd>{formatPricePence(product.pricePence)}</dd>
            </div>
            {product.facts.map((fact) => (
              <div key={fact.id}>
                <dt>{fact.label}</dt>
                <dd>{formatFactValue(fact.value, fact.unit)}</dd>
                <small>{formatFactBasis(fact.basis)}</small>
              </div>
            ))}
          </dl>
          <div className="product-details-source">
            <p className="product-details-label">Source note</p>
            {product.sources?.length ? (
              product.sources.map((source) => (
                <p key={source.id}><strong>{source.label}:</strong> {source.quote}</p>
              ))
            ) : (
              <p>No example source supplied.</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
