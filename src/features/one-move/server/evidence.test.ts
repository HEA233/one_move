import { describe, expect, it } from "vitest";
import { catalogueCards, catalogueFacts, catalogue } from "../catalogue/catalogue";
import { brandIdSchema, finalRequestSchema, initialRequestSchema, playerStateSchema } from "../contracts";
import { computeEligibility, makePlayerNote, renderCard } from "./evidence";
import { selectCuratedCard } from "./selection-policy";

const prices = { charitea_mate_can: 250, oom_balance: 250 } as const;

describe("ONE MOVE Agent B contracts and evidence", () => {
  it("keeps the full 19-card catalogue while gating the two unsupported OOM numbers", () => {
    expect(catalogue.cards).toHaveLength(19);
    expect(catalogueCards.get("oom_sugar_number")?.status).toBe("needs_verification");
    expect(catalogueCards.get("oom_energy_number")?.status).toBe("needs_verification");

    const oom = computeEligibility("oom_balance", prices);
    expect(oom.eligible.map((card) => card.id)).toEqual([
      "oom_price",
      "oom_taste",
      "oom_caffeine",
      "oom_added_sugar",
      "oom_vegan",
      "oom_ingredients",
      "oom_reviews",
      "oom_recycling",
    ]);
    expect(oom.excluded.filter(({ reason }) => reason === "disabled_status").map(({ id }) => id)).toEqual([
      "oom_sugar_number",
      "oom_energy_number",
    ]);
  });

  it("renders only allowlisted factual text and subtracts exactly 50 pence", () => {
    const priceCard = catalogueCards.get("oom_price");
    const reviewCard = catalogueCards.get("ct_review");
    if (!priceCard || !reviewCard) throw new Error("Fixture cards missing.");

    const price = renderCard(priceCard, prices);
    expect(price.text).toBe("Game price: £2.50 to £2.00.");
    expect(price.patch).toMatchObject({ kind: "price", beforePricePence: 250, afterPricePence: 200, discountPence: 50 });

    const review = renderCard(reviewCard, prices);
    expect(review.text).toBe('One reviewer wrote: "Tastes like proper tea".');
    expect(review.text).not.toMatch(/best|healthy|effective|conversion/i);
    expect(makePlayerNote(review, "curated").noteHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("does not render unknown values as zero and excludes a prominent unchanged fact", () => {
    const oom = computeEligibility("oom_balance", prices, ["oom_caffeine_free"]);
    expect(oom.excluded.find((item) => item.id === "oom_caffeine")?.reason).toBe("already_prominent");
    expect(catalogueFacts.get("oom_sugars")?.value).toBeNull();
    expect(oom.eligible.some((card) => card.id === "oom_sugar_number")).toBe(false);
  });

  it("uses reason overlap, priority, then card ID to choose exactly one card", () => {
    const charitea = computeEligibility("charitea_mate_can", prices);
    const selected = selectCuratedCard(charitea.eligible, ["sugar_calories", "other"]);
    expect(selected?.card.id).toBe("ct_sugar_number");
    expect(selected?.consideredCardIds).toEqual(charitea.considered);
    expect(selected?.selectionProbability).toBe(1);
    expect(selected?.assignmentProbabilityMeaning).toBe("conditional_deterministic_assignment");

    const noContext = selectCuratedCard(charitea.eligible, ["other"]);
    expect(noContext?.card.id).toBe("ct_taste");
  });

  it("keeps request schemas strict and never accepts client-owned selection fields", () => {
    const base = { commandId: "00000000-0000-4000-8000-000000000001", expectedRevision: 0 };
    expect(initialRequestSchema.safeParse({ ...base, initialBrand: "oom_balance", reasonKeys: [], points: 10 }).success).toBe(false);
    expect(finalRequestSchema.safeParse({ ...base, finalBrand: "oom_balance", noteHash: "0".repeat(64), targetBrand: "oom_balance" }).success).toBe(false);
    expect(brandIdSchema.safeParse("mindfuel").success).toBe(false);
    expect(playerStateSchema.safeParse({}).success).toBe(false);
  });
});
