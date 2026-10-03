import { z } from "zod";

export const BRAND_IDS = ["charitea_mate_can", "oom_balance"] as const;
export const REASON_KEYS = [
  "taste",
  "purpose",
  "sugar_calories",
  "ingredients",
  "price",
  "packaging_brand",
  "other",
] as const;
export const STRATEGY_FAMILIES = ["price", "taste", "proof", "trust"] as const;
export const SERVER_PHASES = [
  "choosing",
  "preparing_move",
  "awaiting_rechoice",
  "finished",
  "aborted",
] as const;
export const EVIDENCE_MODES = ["recorded_pilot", "rehearsal", "fixture"] as const;
export const SELECTION_ORIGINS = [
  "curated",
  "live_model",
  "curated_timeout",
  "curated_invalid",
  "curated_unavailable",
] as const;
export const NOTE_ORIGINS = ["curated", "curated_fallback", "live"] as const;

export type BrandId = (typeof BRAND_IDS)[number];
export type ReasonKey = (typeof REASON_KEYS)[number];
export type StrategyFamily = (typeof STRATEGY_FAMILIES)[number];
export type ServerPhase = (typeof SERVER_PHASES)[number];
export type EvidenceMode = (typeof EVIDENCE_MODES)[number];
export type SelectionOrigin = (typeof SELECTION_ORIGINS)[number];
export type NoteOrigin = (typeof NOTE_ORIGINS)[number];

export const brandIdSchema = z.enum(BRAND_IDS);
export const reasonKeySchema = z.enum(REASON_KEYS);
export const serverPhaseSchema = z.enum(SERVER_PHASES);
export const strategyFamilySchema = z.enum(STRATEGY_FAMILIES);
export const evidenceModeSchema = z.enum(EVIDENCE_MODES);
export const selectionOriginSchema = z.enum(SELECTION_ORIGINS);
export const noteOriginSchema = z.enum(NOTE_ORIGINS);

export const productPlacementSchema = z
  .object({ left: brandIdSchema, right: brandIdSchema })
  .strict()
  .refine((placement) => placement.left !== placement.right, "Product placement must contain both products.");

export type ProductPlacement = z.infer<typeof productPlacementSchema>;

export const sourceReferenceSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    url: z.string().url().nullable(),
    checkedDate: z.string().date().nullable(),
    scope: z.string().min(1),
  })
  .strict();

export type SourceReference = z.infer<typeof sourceReferenceSchema>;

export const notePatchSchema = z
  .discriminatedUnion("kind", [
    z
      .object({
        kind: z.literal("price"),
        factIds: z.array(z.string()).max(0),
        beforePricePence: z.number().int().positive().optional(),
        afterPricePence: z.number().int().positive().optional(),
        discountPence: z.literal(50).optional(),
      })
      .strict(),
    z
      .object({
        kind: z.literal("highlight"),
        factIds: z.array(z.string().min(1)).min(1),
        templateId: z.string().min(1).optional(),
      })
      .strict(),
  ]);

export type NotePatch = z.infer<typeof notePatchSchema>;

export const publicProductFactSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    displayValue: z.string().min(1),
    status: z.enum(["public_source_checked", "needs_verification", "summary_only"]),
    basis: z.string().nullable(),
    note: z.string().nullable(),
    sourceIds: z.array(z.string()),
  })
  .strict();

export type PublicProductFact = z.infer<typeof publicProductFactSchema>;

export const publicProductSchema = z
  .object({
    id: brandIdSchema,
    name: z.string().min(1),
    variant: z.string().min(1),
    imageSrc: z.string().min(1),
    imageAlt: z.string().min(1),
    category: z.string().min(1),
    facts: z.array(publicProductFactSchema),
    sources: z.array(sourceReferenceSchema),
  })
  .strict();

export type PublicProduct = z.infer<typeof publicProductSchema>;

export const playerNoteSchema = z
  .object({
    id: z.string().min(1).optional(),
    cardId: z.string().min(1),
    targetBrand: brandIdSchema,
    text: z.string().min(1),
    sourceIds: z.array(z.string().min(1)).min(1),
    sources: z.array(sourceReferenceSchema).min(1),
    patch: notePatchSchema,
    caveat: z.string().nullable(),
    origin: noteOriginSchema,
    noteHash: z.string().min(1),
  })
  .strict();

export type PlayerNote = z.infer<typeof playerNoteSchema>;

export const exposureSummarySchema = z
  .object({
    issuedAt: z.string().datetime().nullable(),
    clientReportedDisplayedAt: z.string().datetime().nullable(),
    acknowledgedAt: z.string().datetime().nullable(),
    acknowledgementSource: z.enum(["exposure_endpoint", "final_payload"]).nullable(),
  })
  .strict();

export type ExposureSummary = z.infer<typeof exposureSummarySchema>;

export const playerStateSchema = z
  .object({
    protocolVersion: z.string().min(1),
    campaignId: z.string().min(1),
    roundId: z.string().uuid(),
    roundIndex: z.number().int().positive(),
    isReplay: z.boolean(),
    evidenceMode: evidenceModeSchema,
    revision: z.number().int().nonnegative(),
    phase: serverPhaseSchema,
    placement: productPlacementSchema,
    products: z.array(publicProductSchema).length(2),
    pricesPence: z.record(brandIdSchema, z.number().int().positive()),
    initialBrand: brandIdSchema.nullable(),
    targetBrand: brandIdSchema.nullable(),
    reasonKeys: z.array(reasonKeySchema).max(2),
    note: playerNoteSchema.nullable(),
    exposure: exposureSummarySchema,
    finalBrand: brandIdSchema.nullable(),
    switched: z.boolean().nullable(),
    storyDelta: z.union([z.literal(10), z.literal(-10)]).nullable(),
    abortReason: z.enum(["user_left", "no_eligible_move", "technical_error", "expired"]).nullable(),
  })
  .strict();

export type PlayerState = z.infer<typeof playerStateSchema>;

export const commandIdSchema = z.string().uuid();
export const expectedRevisionSchema = z.number().int().nonnegative();

const commandEnvelope = {
  commandId: commandIdSchema,
  expectedRevision: expectedRevisionSchema,
} as const;

export const startRequestSchema = z
  .object({
    campaignId: z.string().min(1).max(120).optional(),
    startCommandId: commandIdSchema.optional(),
  })
  .strict();

export const initialRequestSchema = z
  .object({
    ...commandEnvelope,
    initialBrand: brandIdSchema,
    reasonKeys: z.array(reasonKeySchema).max(2).refine((keys) => new Set(keys).size === keys.length, "Reasons must be unique."),
    other: z.string().max(160).optional(),
  })
  .strict();

export const ensureMoveRequestSchema = z.object(commandEnvelope).strict();

export const exposureRequestSchema = z
  .object({
    commandId: commandIdSchema,
    noteHash: z.string().regex(/^[a-f0-9]{64}$/),
    clientReportedDisplayedAt: z.string().datetime(),
  })
  .strict();

export const finalRequestSchema = z
  .object({
    ...commandEnvelope,
    finalBrand: brandIdSchema,
    noteHash: z.string().regex(/^[a-f0-9]{64}$/),
    exposureAcknowledgement: z
      .object({
        noteHash: z.string().regex(/^[a-f0-9]{64}$/),
        clientReportedDisplayedAt: z.string().datetime(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const abortRequestSchema = z
  .object({
    ...commandEnvelope,
    reason: z.enum(["user_left", "technical_error", "expired"]),
  })
  .strict();

export const againRequestSchema = z.object(commandEnvelope).strict();

export type StartRequest = z.infer<typeof startRequestSchema>;
export type InitialRequest = z.infer<typeof initialRequestSchema>;
export type EnsureMoveRequest = z.infer<typeof ensureMoveRequestSchema>;
export type ExposureRequest = z.infer<typeof exposureRequestSchema>;
export type FinalRequest = z.infer<typeof finalRequestSchema>;
export type AbortRequest = z.infer<typeof abortRequestSchema>;
export type AgainRequest = z.infer<typeof againRequestSchema>;

export const errorCodeSchema = z.enum([
  "invalid_request",
  "unauthorised",
  "not_found",
  "conflict",
  "stale_revision",
  "unavailable",
  "internal_error",
]);

export const errorResponseSchema = z
  .object({
    error: z.object({ code: errorCodeSchema, message: z.string().min(1) }).strict(),
    state: playerStateSchema.optional(),
  })
  .strict();

export type ErrorCode = z.infer<typeof errorCodeSchema>;

export interface CommandAcknowledgement {
  commandId: string;
  action: string;
  replayed: boolean;
}

export interface CommandResult {
  acknowledgement: CommandAcknowledgement;
  state: PlayerState;
}

export interface StartResult {
  state: PlayerState;
  created: boolean;
}
