import { describe, expect, it } from "vitest";
import { missions, pickProducts, rescueFixtures, revealFixtures, sourcedFact } from "./fixtures";
import { productSchema, factSchema, missionSchema, revealFixtureSchema, rescueFixtureSchema, sourcedFactSchema } from "./contracts";

describe("fictional display contracts", () => {
  it("validates the complete inventory without converting unknown, false or zero", () => {
    const products = pickProducts.map((product) => productSchema.parse(product));
    expect(products).toHaveLength(6);
    expect(products[1].pricePence).toBeNull();
    expect(products[1].facts.map((fact) => fact.value)).toEqual([null, false, 0]);
    expect(missions.map((mission) => missionSchema.parse(mission))).toHaveLength(3);
    expect(revealFixtures.map((fixture) => revealFixtureSchema.parse(fixture))).toHaveLength(5);
    expect(rescueFixtures.map((fixture) => rescueFixtureSchema.parse(fixture))).toHaveLength(6);
    expect(sourcedFactSchema.parse(sourcedFact).basis).toBe("per_100g");
  });
  it("rejects fractional prices, non-fictional records and ambiguous nutrition bases", () => {
    expect(productSchema.safeParse({ ...pickProducts[0], pricePence: 1.25 }).success).toBe(false);
    expect(productSchema.safeParse({ ...pickProducts[0], isFictional: false }).success).toBe(false);
    expect(factSchema.safeParse({ ...pickProducts[0].facts[0], basis: "per bag maybe" }).success).toBe(false);
  });
  it("rejects facts whose sources are missing or whose rescue changes cover multiple fields", () => {
    expect(productSchema.safeParse({ ...pickProducts[0], sources: [] }).success).toBe(false);
    const fixture = rescueFixtures[0];
    expect(rescueFixtureSchema.safeParse({ ...fixture, appliedSnapshot: {
      ...fixture.appliedSnapshot!, rawFields: [{ key: "budget", value: "changed" }, ...fixture.appliedSnapshot!.rawFields.slice(1)],
    } }).success).toBe(false);
  });
});
