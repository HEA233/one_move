import "server-only";
import { z } from "zod";
import rawCatalogue from "./catalogue.json";

const sourceSchema = z
  .object({
    title: z.string().min(1),
    url: z.string().url().nullable(),
    checkedDate: z.string().date().nullable(),
    scope: z.string().min(1),
  })
  .strict();

const productSchema = z
  .object({
    id: z.enum(["charitea_mate_can", "oom_balance"]),
    name: z.string().min(1),
    variant: z.string().min(1),
    imagePath: z.string().nullable(),
    imageHint: z.string().min(1),
    fullLabelFactId: z.string().min(1),
    volumeFactId: z.string().min(1),
    caffeineFactId: z.string().min(1),
    caffeineFieldMeaning: z.enum(["presence", "absence"]),
    barcode: z.string().nullable(),
  })
  .strict();

const factSchema = z
  .object({
    id: z.string().min(1),
    brandId: z.enum(["charitea_mate_can", "oom_balance"]),
    key: z.string().min(1),
    value: z.unknown(),
    unit: z.string().nullable(),
    basis: z.string().nullable(),
    kind: z.string().min(1),
    status: z.enum(["public_source_checked", "pack_checked", "needs_verification", "conflict", "hypothetical"]),
    sourceIds: z.array(z.string()),
    checkedDate: z.string().date().nullable(),
    packChecked: z.boolean(),
    note: z.string().nullable(),
  })
  .strict();

const cardPatchSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("price"), discountPence: z.literal(50) }).strict(),
  z.object({ kind: z.literal("highlight"), factIds: z.array(z.string()).min(1), templateId: z.string().min(1) }).strict(),
]);

const cardSchema = z
  .object({
    id: z.string().min(1),
    brandId: z.enum(["charitea_mate_can", "oom_balance"]),
    family: z.enum(["price", "taste", "proof", "trust"]),
    title: z.string().min(1),
    shopperTextTemplate: z.string().min(1),
    factIds: z.array(z.string()),
    sourceIds: z.array(z.string()),
    reasonTags: z.array(z.enum(["taste", "purpose", "sugar_calories", "ingredients", "price", "packaging_brand", "other"])),
    priority: z.number().int(),
    status: z.enum(["ready", "needs_verification", "disabled"]),
    patch: cardPatchSchema,
    templateId: z.string().min(1),
    caveat: z.string().nullable(),
    version: z.string().min(1),
    titleAudience: z.string().min(1),
    playerSelectable: z.literal(false),
    allocation: z.literal("server_only_once_per_round"),
    selectionVersion: z.string().min(1),
  })
  .strict();

export const catalogueSchema = z
  .object({
    schemaVersion: z.string().min(1),
    catalogueVersion: z.string().min(1),
    preparedDate: z.string().date(),
    warning: z.string().min(1),
    productIds: z.array(z.enum(["charitea_mate_can", "oom_balance"])).length(2),
    products: z.array(productSchema).length(2),
    game: z
      .object({
        missionId: z.string().min(1),
        missionText: z.string().min(1),
        priceMode: z.literal("reference_retail"),
        currency: z.literal("GBP"),
        priceDisclosure: z.string().min(1),
        discountPence: z.literal(50),
        maxReasons: z.literal(2),
        maxOtherCharacters: z.literal(160),
        switchPoints: z.literal(10),
        stayPoints: z.literal(-10),
        abortPoints: z.literal(0),
        scoreOwner: z.string().min(1),
        interactionModel: z.literal("single_shopper_system_move"),
        moveCount: z.literal(1),
        selectionPolicy: z.literal("contextual_v2"),
        defaultSelector: z.literal("curated"),
        brandView: z.literal("optional_read_only"),
        requiresBrandPresence: z.literal(false),
        requiresRoomCreation: z.literal(false),
        scoreVisibility: z.literal("after_final_only"),
        collectiveLeaderboard: z.literal(false),
        maxActiveRoundPerSession: z.literal(1),
      })
      .strict(),
    sources: z.record(z.string().min(1), sourceSchema),
    facts: z.array(factSchema).min(1),
    cards: z.array(cardSchema).length(19),
    disabledIdeas: z.array(z.string()),
    interpretation: z.string().min(1),
    templateRules: z
      .object({
        purpose: z.string().min(1),
        arrayFormatting: z.string().min(1),
        nestedFactAccess: z.string().min(1),
        computedPriceTokens: z.string().min(1),
        onUnknown: z.string().min(1),
      })
      .strict(),
    revisionNote: z.string().min(1),
    automaticSelection: z.unknown(),
  })
  .strict();

export const catalogue = catalogueSchema.parse(rawCatalogue);
export type Catalogue = z.infer<typeof catalogueSchema>;
export type CatalogueFact = Catalogue["facts"][number];
export type CatalogueCard = Catalogue["cards"][number];
export type CatalogueProduct = Catalogue["products"][number];
export type CatalogueSource = Catalogue["sources"][string];

export const catalogueFacts = new Map(catalogue.facts.map((fact) => [fact.id, fact]));
export const catalogueSources = new Map(Object.entries(catalogue.sources));
export const catalogueCards = new Map(catalogue.cards.map((card) => [card.id, card]));

export function otherBrand(brandId: CatalogueProduct["id"]): CatalogueProduct["id"] {
  return brandId === "charitea_mate_can" ? "oom_balance" : "charitea_mate_can";
}
