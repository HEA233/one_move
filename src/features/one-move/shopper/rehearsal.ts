import type { BrandId, NoteExposurePayload, ProductPlacement, ShopperNote, ShopperProduct } from "./types";
import { pricesPence, priceSources } from "../catalogue/prices";

const sourceS02 = {
  id: "S02",
  title: "ChariTea Mate CAN - official UK shop",
  url: "https://drinkinghelps.co.uk/products/charitea-mate-can",
  checkedDate: "2026-10-03",
  scope: "ChariTea Mate 330 ml can; current page snapshot, not a pack inspection",
} as const;

const sourceS04 = {
  id: "S04",
  title: "OOM Balance - official product page",
  url: "https://oomdrinks.com/products/oom-balance",
  checkedDate: "2026-10-03",
  scope: "OOM Balance; numerical nutrition/full label not established from inspected text",
} as const;

const sourceS05 = {
  id: "S05",
  title: "OOM - official FAQ",
  url: "https://oomdrinks.com/pages/faq",
  checkedDate: "2026-10-03",
  scope: "Manufacturer FAQ; statements apply only where product applicability is confirmed",
} as const;

export const rehearsalProducts: readonly ShopperProduct[] = [
  {
    id: "charitea_mate_can",
    name: "ChariTea Mate",
    variant: "Mate tea can",
    imageSrc: "/one-move/charitea-mate.webp",
    imageAlt: "A dark red ChariTea Mate can photographed upright",
    category: "Sparkling mate tea with citrus",
    pricePence: pricesPence.charitea_mate_can,
    facts: [
      { id: "ct_volume", label: "Can size", displayValue: "330 ml", status: "public_source_checked", basis: "one can", note: null, sourceIds: ["S02"] },
      { id: "ct_caffeine_presence", label: "Caffeine", displayValue: "Contains caffeine", status: "public_source_checked", basis: null, note: "Presence only; no dose or health inference.", sourceIds: ["S02"] },
      { id: "ct_flavour", label: "Flavour", displayValue: "Sparkling mate tea with orange and lemon.", status: "public_source_checked", basis: null, note: null, sourceIds: ["S02"] },
      { id: "ct_sugars", label: "Total sugars", displayValue: "3.9 g", status: "public_source_checked", basis: "per 100 ml", note: "Exact UK can source; check the physical pack before treating it as a pack audit.", sourceIds: ["S02"] },
      { id: "ct_energy", label: "Energy", displayValue: "17 kcal", status: "public_source_checked", basis: "per 100 ml", note: "Numeric label fact, not a health rating.", sourceIds: ["S02"] },
      { id: "ct_ingredients_full", label: "Full ingredients", displayValue: "Not yet checked", status: "needs_verification", basis: null, note: "A highlighted ingredient summary is not the complete ordered label.", sourceIds: [] },
    ],
    sources: [sourceS02, priceSources.charitea_mate_can],
  },
  {
    id: "oom_balance",
    name: "OOM Balance",
    variant: "Peach, blood orange & hops can",
    imageSrc: "/one-move/oom-balance.webp",
    imageAlt: "A pale OOM Balance can photographed upright",
    category: "Lightly sparkling peach, blood orange and hops",
    pricePence: pricesPence.oom_balance,
    facts: [
      { id: "oom_volume", label: "Can size", displayValue: "250 ml", status: "public_source_checked", basis: "one can", note: "The official product page specifies a 250 ml can in its vitamin table.", sourceIds: ["S04"] },
      { id: "oom_caffeine_free", label: "Caffeine", displayValue: "Caffeine-free", status: "public_source_checked", basis: null, note: "Manufacturer statement; no health-effect inference.", sourceIds: ["S05"] },
      { id: "oom_flavour", label: "Flavour", displayValue: "Lightly sparkling peach, blood orange and hops.", status: "public_source_checked", basis: null, note: null, sourceIds: ["S04", "S05"] },
      { id: "oom_no_added_sugar", label: "Sugar statement", displayValue: "No added sugar", status: "public_source_checked", basis: null, note: "This does not mean sugar-free.", sourceIds: ["S04"] },
      { id: "oom_vegan_statement", label: "Dietary statement", displayValue: "Suitable for vegans", status: "public_source_checked", basis: null, note: "Not an allergen-free guarantee.", sourceIds: ["S05"] },
      { id: "oom_ingredient_highlights", label: "Ingredient highlights", displayValue: "Chaga, ashwagandha, L-tyrosine", status: "summary_only", basis: null, note: "Presence only; not a complete ingredient list or a claim about effects.", sourceIds: ["S04"] },
      { id: "oom_sugars", label: "Total sugars", displayValue: "Not yet checked", status: "needs_verification", basis: "per 100 ml", note: "No numeric OOM nutrition claim is active in this rehearsal.", sourceIds: [] },
      { id: "oom_energy", label: "Energy", displayValue: "Not yet checked", status: "needs_verification", basis: "per 100 ml", note: "No numeric OOM nutrition claim is active in this rehearsal.", sourceIds: [] },
    ],
    sources: [sourceS04, sourceS05, priceSources.oom_balance],
  },
];

const rehearsalNotes: Record<BrandId, ShopperNote> = {
  charitea_mate_can: {
    id: "note-ct-taste",
    cardId: "ct_taste",
    targetBrand: "charitea_mate_can",
    text: "Sparkling mate tea with orange and lemon.",
    sourceIds: ["S02"],
    sources: [sourceS02],
    patch: { kind: "highlight", factIds: ["ct_flavour"], templateId: "ct_taste-v1" },
    caveat: null,
    origin: "curated",
    noteHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  },
  oom_balance: {
    id: "note-oom-ingredients",
    cardId: "oom_ingredients",
    targetBrand: "oom_balance",
    text: "The product page highlights chaga, ashwagandha and L-tyrosine.",
    sourceIds: ["S04"],
    sources: [sourceS04],
    patch: { kind: "highlight", factIds: ["oom_ingredient_highlights"], templateId: "oom_ingredients-v1" },
    caveat: "Highlights only, not a complete ingredient list or a claim about effects.",
    origin: "curated",
    noteHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  },
};

export function otherBrand(brandId: BrandId): BrandId {
  return brandId === "charitea_mate_can" ? "oom_balance" : "charitea_mate_can";
}

export function brandSide(placement: ProductPlacement, brandId: BrandId): "left" | "right" {
  return placement.left === brandId ? "left" : "right";
}

export function placementForRound(roundId: string): ProductPlacement {
  const checksum = [...roundId].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return checksum % 2 === 0
    ? { left: "charitea_mate_can", right: "oom_balance" }
    : { left: "oom_balance", right: "charitea_mate_can" };
}

export function orderedProducts(placement: ProductPlacement): readonly ShopperProduct[] {
  const byId = new Map(rehearsalProducts.map((product) => [product.id, product]));
  return [byId.get(placement.left)!, byId.get(placement.right)!];
}

export function rehearsalNoteFor(targetBrand: BrandId): ShopperNote {
  return rehearsalNotes[targetBrand];
}

export function createLocalRoundId(): string {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return `rehearsal-${window.crypto.randomUUID()}`;
  }

  return `rehearsal-${Date.now().toString(36)}`;
}

export function emptyExposure(roundId: string, note: ShopperNote): NoteExposurePayload {
  return {
    roundId,
    noteHash: note.noteHash,
    clientReportedDisplayedAt: new Date().toISOString(),
  };
}
