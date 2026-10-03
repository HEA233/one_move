import type { BrandId } from "../contracts";

export function otherBrand(brandId: BrandId): BrandId {
  return brandId === "charitea_mate_can" ? "oom_balance" : "charitea_mate_can";
}

export function deriveTarget(initialBrand: BrandId): BrandId {
  return otherBrand(initialBrand);
}

export function deriveOutcome(initialBrand: BrandId, finalBrand: BrandId): { switched: boolean; storyDelta: 10 | -10 } {
  const switched = finalBrand !== initialBrand;
  return { switched, storyDelta: switched ? 10 : -10 };
}
