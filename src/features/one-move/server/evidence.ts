import type { NoteOrigin, NotePatch, PlayerNote, SourceReference } from "../contracts";
import { catalogueCards, catalogueFacts, catalogueSources, type CatalogueCard, type CatalogueFact } from "../catalogue/catalogue";
import { sha256 } from "./hashing";

export interface RenderedCard {
  cardId: string;
  targetBrand: CatalogueCard["brandId"];
  family: CatalogueCard["family"];
  title: string;
  text: string;
  sourceIds: string[];
  sources: SourceReference[];
  patch: NotePatch;
  caveat: string | null;
}

export interface CardExclusion {
  id: string;
  reason:
    | "wrong_brand"
    | "disabled_status"
    | "unsupported_fact"
    | "missing_source"
    | "invalid_patch"
    | "already_prominent"
    | "renderer_rejected";
}

const supportedFactStatuses = new Set(["public_source_checked", "pack_checked"]);

function factIsSupported(fact: CatalogueFact | undefined): fact is CatalogueFact {
  if (!fact || !supportedFactStatuses.has(fact.status) || fact.sourceIds.length === 0 || fact.value === null || fact.value === undefined) return false;
  if (typeof fact.value === "number") return Number.isFinite(fact.value) && fact.unit !== null;
  if (typeof fact.value === "string") return fact.value.trim().length > 0;
  if (typeof fact.value === "boolean") return fact.value === true;
  if (Array.isArray(fact.value)) return fact.value.length > 0 && fact.value.every((entry) => typeof entry === "string" && entry.trim().length > 0);
  return typeof fact.value === "object";
}

function sourceList(ids: readonly string[]): SourceReference[] {
  return ids.map((id) => {
    const source = catalogueSources.get(id);
    if (!source) throw new Error(`Missing source ${id}.`);
    return { id, ...source };
  });
}

function factOrThrow(id: string): CatalogueFact {
  const fact = catalogueFacts.get(id);
  if (!fact || !factIsSupported(fact)) throw new Error(`Fact ${id} is not supported.`);
  return fact;
}

function numberFact(fact: CatalogueFact): number {
  if (typeof fact.value !== "number" || !Number.isFinite(fact.value) || !fact.unit) throw new Error(`Fact ${fact.id} is not a supported number.`);
  return fact.value;
}

function stringFact(fact: CatalogueFact): string {
  if (typeof fact.value !== "string" || fact.value.trim().length === 0) throw new Error(`Fact ${fact.id} is not a supported string.`);
  return fact.value;
}

function booleanFact(fact: CatalogueFact): boolean {
  if (fact.value !== true) throw new Error(`Fact ${fact.id} is not a supported positive statement.`);
  return true;
}

function arrayFact(fact: CatalogueFact): string[] {
  if (!Array.isArray(fact.value) || !fact.value.every((entry) => typeof entry === "string" && entry.trim().length > 0)) throw new Error(`Fact ${fact.id} is not a supported string list.`);
  return fact.value;
}

function renderHighlight(card: CatalogueCard): string {
  const factId = card.factIds[0];
  if (!factId) throw new Error(`Card ${card.id} has no fact.`);
  const fact = factOrThrow(factId);
  switch (card.templateId) {
    case "ct_taste-v1": return stringFact(fact);
    case "ct_caffeine-v1": booleanFact(fact); return "Contains naturally occurring caffeine.";
    case "ct_organic-v1": booleanFact(fact); return "Made with organic ingredients.";
    case "ct_fairtrade-v1": return stringFact(fact);
    case "ct_giveback-v1": {
      if (!fact.value || typeof fact.value !== "object" || Array.isArray(fact.value)) throw new Error(`Fact ${fact.id} is not a donation statement.`);
      const donation = fact.value as { amountPence?: unknown; per?: unknown };
      if (typeof donation.amountPence !== "number" || !Number.isInteger(donation.amountPence) || donation.amountPence < 0 || donation.per !== "unit_sold") throw new Error(`Fact ${fact.id} has an unsafe donation statement.`);
      return `The brand contributes ${donation.amountPence}p per unit sold to its foundation.`;
    }
    case "ct_review-v1": {
      if (!fact.value || typeof fact.value !== "object" || Array.isArray(fact.value)) throw new Error(`Fact ${fact.id} is not a review.`);
      const review = fact.value as { excerpt?: unknown };
      if (typeof review.excerpt !== "string" || review.excerpt.trim().length === 0) throw new Error(`Fact ${fact.id} has no review excerpt.`);
      return `One reviewer wrote: "${review.excerpt}".`;
    }
    case "ct_sugar_number-v1": return `Total sugars: ${numberFact(fact)} ${fact.unit} per 100 ml.`;
    case "ct_energy_number-v1": return `Energy: ${numberFact(fact)} ${fact.unit} per 100 ml.`;
    case "oom_taste-v1": return stringFact(fact);
    case "oom_caffeine-v1": booleanFact(fact); return "The manufacturer describes this drink as caffeine-free.";
    case "oom_added_sugar-v1": booleanFact(fact); return "No added sugar, according to the manufacturer.";
    case "oom_vegan-v1": booleanFact(fact); return "The manufacturer labels this drink suitable for vegans.";
    case "oom_ingredients-v1": return `Ingredient highlights: ${arrayFact(fact).join(", ")}.`;
    case "oom_reviews-v1": {
      if (!fact.value || typeof fact.value !== "object" || Array.isArray(fact.value)) throw new Error(`Fact ${fact.id} is not a review summary.`);
      const review = fact.value as { average?: unknown; count?: unknown };
      if (typeof review.average !== "number" || !Number.isFinite(review.average) || typeof review.count !== "number" || !Number.isInteger(review.count) || review.count < 1) throw new Error(`Fact ${fact.id} has an unsafe review summary.`);
      return `${review.average}/5 from ${review.count} reviews on the brand website.`;
    }
    case "oom_recycling-v1": booleanFact(fact); return "The manufacturer says the can is recyclable.";
    default: throw new Error(`No allowlisted renderer for ${card.templateId}.`);
  }
}

export function renderCard(card: CatalogueCard, pricesPence: Record<CatalogueCard["brandId"], number>): RenderedCard {
  const sourceIds = [...card.sourceIds];
  const sources = sourceList(sourceIds);
  if (card.patch.kind === "price") {
    const beforePricePence = pricesPence[card.brandId];
    if (!Number.isInteger(beforePricePence) || beforePricePence <= 0) throw new Error(`Price for ${card.brandId} is invalid.`);
    const afterPricePence = beforePricePence - card.patch.discountPence;
    if (!Number.isInteger(afterPricePence) || afterPricePence <= 0) throw new Error(`Price patch for ${card.id} is invalid.`);
    return {
      cardId: card.id,
      targetBrand: card.brandId,
      family: card.family,
      title: card.title,
      text: `Game price: £${(beforePricePence / 100).toFixed(2)} to £${(afterPricePence / 100).toFixed(2)}.`,
      sourceIds,
      sources,
      patch: { kind: "price", factIds: [], beforePricePence, afterPricePence, discountPence: 50 },
      caveat: card.caveat,
    };
  }

  const text = renderHighlight(card);
  return {
    cardId: card.id,
    targetBrand: card.brandId,
    family: card.family,
    title: card.title,
    text,
    sourceIds,
    sources,
    patch: { kind: "highlight", factIds: [...card.patch.factIds], templateId: card.patch.templateId },
    caveat: card.caveat,
  };
}

export function makePlayerNote(rendered: RenderedCard, origin: NoteOrigin): PlayerNote {
  const note = {
    id: rendered.cardId,
    cardId: rendered.cardId,
    targetBrand: rendered.targetBrand,
    text: rendered.text,
    sourceIds: rendered.sourceIds,
    sources: rendered.sources,
    patch: rendered.patch,
    caveat: rendered.caveat,
    origin,
  } satisfies Omit<PlayerNote, "noteHash">;
  const hashableNote = {
    cardId: note.cardId,
    targetBrand: note.targetBrand,
    text: note.text,
    sourceIds: note.sourceIds,
    sources: note.sources,
    patch: note.patch,
    caveat: note.caveat,
  };
  return { ...note, noteHash: sha256(hashableNote) };
}

export function computeEligibility(
  targetBrand: CatalogueCard["brandId"],
  pricesPence: Record<CatalogueCard["brandId"], number>,
  alreadyProminentFactIds: readonly string[] = [],
): { eligible: CatalogueCard[]; excluded: CardExclusion[]; considered: string[] } {
  const prominent = new Set(alreadyProminentFactIds);
  const eligible: CatalogueCard[] = [];
  const excluded: CardExclusion[] = [];

  for (const card of catalogueCards.values()) {
    if (card.brandId !== targetBrand) {
      excluded.push({ id: card.id, reason: "wrong_brand" });
      continue;
    }
    if (card.status !== "ready") {
      excluded.push({ id: card.id, reason: "disabled_status" });
      continue;
    }
    if (card.patch.kind === "highlight" && card.patch.factIds.length > 0 && card.patch.factIds.every((id) => prominent.has(id))) {
      excluded.push({ id: card.id, reason: "already_prominent" });
      continue;
    }
    if (card.factIds.some((id) => !factIsSupported(catalogueFacts.get(id)))) {
      excluded.push({ id: card.id, reason: "unsupported_fact" });
      continue;
    }
    if (card.sourceIds.some((id) => !catalogueSources.has(id))) {
      excluded.push({ id: card.id, reason: "missing_source" });
      continue;
    }
    try {
      renderCard(card, pricesPence);
    } catch {
      excluded.push({ id: card.id, reason: card.patch.kind === "price" ? "invalid_patch" : "renderer_rejected" });
      continue;
    }
    eligible.push(card);
  }

  return { eligible, excluded, considered: eligible.map((card) => card.id) };
}
