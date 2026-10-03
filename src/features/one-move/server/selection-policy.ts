import type { ReasonKey } from "../contracts";
import type { CatalogueCard } from "../catalogue/catalogue";

export const SELECTION_POLICY_VERSION = "contextual_v2" as const;

export interface CuratedSelection {
  card: CatalogueCard;
  relevance: number;
  consideredCardIds: string[];
  selectionProbability: 1;
  assignmentProbabilityMeaning: "conditional_deterministic_assignment";
}

const semanticReasonKeys = new Set<Exclude<ReasonKey, "other">>([
  "taste",
  "purpose",
  "sugar_calories",
  "ingredients",
  "price",
  "packaging_brand",
]);

function isSemanticReason(key: ReasonKey): key is Exclude<ReasonKey, "other"> {
  return key !== "other" && semanticReasonKeys.has(key);
}

export function selectCuratedCard(cards: readonly CatalogueCard[], reasonKeys: readonly ReasonKey[]): CuratedSelection | null {
  if (cards.length === 0) return null;
  const semanticReasons = new Set(reasonKeys.filter(isSemanticReason));
  const ranked = cards
    .map((card) => {
      const overlap = card.reasonTags.filter((tag): tag is Exclude<ReasonKey, "other"> => isSemanticReason(tag) && semanticReasons.has(tag)).length;
      return { card, relevance: overlap * 2 };
    })
    .sort((left, right) => right.relevance - left.relevance || left.card.priority - right.card.priority || left.card.id.localeCompare(right.card.id));
  const selected = ranked[0];
  if (!selected) return null;
  return {
    card: selected.card,
    relevance: selected.relevance,
    consideredCardIds: cards.map((card) => card.id),
    selectionProbability: 1,
    assignmentProbabilityMeaning: "conditional_deterministic_assignment",
  };
}
