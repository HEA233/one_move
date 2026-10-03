import "server-only";
import type { PublicProduct, ProductPlacement, BrandId } from "../contracts";
import { catalogue, type CatalogueFact } from "../catalogue/catalogue";
import { sha256 } from "./hashing";

const imagePaths: Record<BrandId, { src: string; alt: string }> = {
  charitea_mate_can: {
    src: "/one-move/charitea-mate.webp",
    alt: "A dark red ChariTea Mate can photographed upright",
  },
  oom_balance: {
    src: "/one-move/oom-balance.webp",
    alt: "A pale OOM Balance can photographed upright",
  },
};

function factLabel(fact: CatalogueFact): string {
  switch (fact.key) {
    case "volume": return "Can size";
    case "caffeine_presence":
    case "caffeine_free": return "Caffeine";
    case "flavour": return "Flavour";
    case "total_sugars": return "Total sugars";
    case "energy": return "Energy";
    case "ingredient_summary":
    case "ingredient_highlights": return "Ingredient highlights";
    case "no_added_sugar": return "Sugar statement";
    case "vegan": return "Dietary statement";
    case "recyclable_can": return "Can";
    case "organic": return "Organic statement";
    case "fairtrade_ingredients": return "Sourcing statement";
    case "donation": return "Foundation statement";
    case "review_excerpt": return "Review";
    case "review_summary": return "Reviews";
    default: return fact.key;
  }
}

function factDisplayValue(fact: CatalogueFact): string {
  if (fact.value === null || fact.value === undefined) return "Not yet checked";
  if (typeof fact.value === "boolean") {
    if (fact.value === false) return "No";
    if (fact.key === "caffeine_free") return "Caffeine-free";
    if (fact.key === "caffeine_presence") return "Contains caffeine";
    if (fact.key === "no_added_sugar") return "No added sugar";
    if (fact.key === "vegan") return "Suitable for vegans";
    if (fact.key === "recyclable_can") return "Recyclable can";
    return "Yes";
  }
  if (typeof fact.value === "number") return `${fact.value}${fact.unit ? ` ${fact.unit}` : ""}`;
  if (typeof fact.value === "string") return fact.value;
  if (Array.isArray(fact.value)) return fact.value.join(", ");
  if (fact.key === "donation") return "Statement available in source sheet";
  if (fact.key === "review_excerpt") return "One review available in source sheet";
  if (fact.key === "review_summary") return "Review snapshot available in source sheet";
  return "Available in source sheet";
}

function publicFact(fact: CatalogueFact): PublicProduct["facts"][number] {
  return {
    id: fact.id,
    label: factLabel(fact),
    displayValue: factDisplayValue(fact),
    status: fact.kind === "ingredient_highlights" ? "summary_only" : fact.status === "public_source_checked" || fact.status === "pack_checked" ? "public_source_checked" : "needs_verification",
    basis: fact.basis === "per_100_ml" ? "per 100 ml" : fact.basis === "one_can" ? "one can" : fact.basis,
    note: fact.note,
    sourceIds: [...fact.sourceIds],
  };
}

export function placementForRound(roundId: string): ProductPlacement {
  const digest = sha256(roundId);
  return Number.parseInt(digest.slice(-2), 16) % 2 === 0
    ? { left: "charitea_mate_can", right: "oom_balance" }
    : { left: "oom_balance", right: "charitea_mate_can" };
}

export function publicProducts(): PublicProduct[] {
  return catalogue.products.map((product) => ({
    id: product.id,
    name: product.name,
    variant: product.variant,
    imageSrc: imagePaths[product.id].src,
    imageAlt: imagePaths[product.id].alt,
    category: product.id === "charitea_mate_can" ? "Sparkling mate tea with citrus" : "Lightly sparkling peach, blood orange and hops",
    facts: catalogue.facts.filter((fact) => fact.brandId === product.id).map(publicFact),
    sources: [...new Set(catalogue.facts.filter((fact) => fact.brandId === product.id).flatMap((fact) => fact.sourceIds))].map((id) => {
      const source = catalogue.sources[id];
      return { id, ...source };
    }),
  }));
}

export interface BaselineSnapshot {
  protocolVersion: string;
  catalogueVersion: string;
  campaignId: string;
  placement: ProductPlacement;
  pricesPence: Record<BrandId, number>;
  products: PublicProduct[];
  hash: string;
}

export function createBaselineSnapshot(roundId: string, campaignId: string): BaselineSnapshot {
  const snapshot = {
    protocolVersion: "2.0",
    catalogueVersion: catalogue.catalogueVersion,
    campaignId,
    placement: placementForRound(roundId),
    pricesPence: { ...catalogue.game.basePricePence },
    products: publicProducts(),
  } satisfies Omit<BaselineSnapshot, "hash">;
  return { ...snapshot, hash: sha256(snapshot) };
}
