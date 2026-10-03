"use client";

/* eslint-disable @next/next/no-img-element -- Fixture art is a local data URL with no image service. */

import { useRef, useState } from "react";
import { Button } from "../components/Button";
import { ProductCard } from "../components/ProductCard";
import { ProductDetailsDrawer } from "../components/ProductDetailsDrawer";
import { SandboxScene } from "../components/SandboxScene";
import { pickProducts } from "../fixtures";
import { interactionCopy } from "../copy";

export function PickSandbox() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [noneSelected, setNoneSelected] = useState(false);
  const [detailsProductId, setDetailsProductId] = useState<string | null>(null);
  const detailsTriggerRef = useRef<HTMLButtonElement>(null);
  const selectedProduct = pickProducts.find((product) => product.id === selectedProductId) ?? null;
  const detailsProduct = pickProducts.find((product) => product.id === detailsProductId) ?? null;

  function chooseProduct(productId: string) {
    setSelectedProductId(productId);
    setNoneSelected(false);
  }

  function chooseNone() {
    setSelectedProductId(null);
    setNoneSelected(true);
  }

  function resetExample() {
    setSelectedProductId(null);
    setNoneSelected(false);
    setDetailsProductId(null);
  }

  return (
    <SandboxScene title={interactionCopy.pick.title} description={interactionCopy.pick.description}>
      <section className="pick-scene" aria-labelledby="scene-title">
        <div className="pick-products-grid">
          {pickProducts.map((product) => (
            <div className="pick-product-card" key={product.id}>
              <ProductCard product={product} selected={selectedProductId === product.id} />
              <div className="pick-product-actions">
                <Button
                  variant={selectedProductId === product.id ? "primary" : "secondary"}
                  aria-pressed={selectedProductId === product.id}
                  onClick={() => chooseProduct(product.id)}
                >
                  {selectedProductId === product.id ? "Your pick" : interactionCopy.pick.confirm}
                </Button>
                <Button
                  variant="quiet"
                  onClick={(event) => {
                    detailsTriggerRef.current = event.currentTarget;
                    setDetailsProductId(product.id);
                  }}
                >
                  View product details
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className={`pick-selection${noneSelected ? " pick-selection--none" : ""}`} aria-live="polite">
          {selectedProduct ? (
            <>
              <img src={selectedProduct.imageSrc} alt="" />
              <div className="pick-selection-copy">
                <span className="scene-label">Your pick</span>
                <strong>{selectedProduct.name}</strong>
                <span>Selection noted locally for this preview.</span>
              </div>
              <div className="pick-selection-actions">
                <Button variant="quiet" onClick={() => setSelectedProductId(null)}>{interactionCopy.pick.change}</Button>
                <Button variant="quiet" onClick={chooseNone}>{interactionCopy.pick.none}</Button>
              </div>
            </>
          ) : noneSelected ? (
            <div className="pick-selection-none-copy">
              <strong>{interactionCopy.pick.noneResult}</strong>
              <Button variant="secondary" onClick={() => setNoneSelected(false)}>Choose a product instead</Button>
            </div>
          ) : (
            <div className="pick-selection-none-copy">
              <strong>Nothing held yet.</strong>
              <Button variant="secondary" onClick={chooseNone}>{interactionCopy.pick.none}</Button>
            </div>
          )}
          <Button className="pick-reset-button" variant="quiet" onClick={resetExample}>{interactionCopy.rescue.reset}</Button>
        </div>

        {detailsProduct ? (
          <ProductDetailsDrawer
            product={detailsProduct}
            returnFocusRef={detailsTriggerRef}
            onClose={() => setDetailsProductId(null)}
          />
        ) : null}
      </section>
    </SandboxScene>
  );
}
