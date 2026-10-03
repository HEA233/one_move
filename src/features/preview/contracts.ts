import { z } from "zod";

export const factBasisSchema = z.enum(["per_100g", "per_serving", "per_pack", "not_applicable", "unknown"]);
export const factSchema = z.object({
  id: z.string().min(1), key: z.string().min(1), label: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  unit: z.string().nullable(), basis: factBasisSchema,
  sourceId: z.string().nullable(), sourceQuote: z.string().nullable(),
  reviewStatus: z.enum(["synthetic", "unreviewed", "reviewed"]), isFictional: z.literal(true),
});
export const sourceSchema = z.object({
  id: z.string().min(1), kind: z.literal("fixture"), label: z.string().min(1), quote: z.string().min(1),
  url: z.string().url().nullable(), capturedAt: z.string().datetime().nullable(),
});
export const productSchema = z.object({
  id: z.string().min(1), isFictional: z.literal(true), name: z.string().min(1),
  imageSrc: z.string().min(1), imageAlt: z.string().min(1),
  pricePence: z.number().int().nonnegative().nullable(), currency: z.literal("GBP"),
  facts: z.array(factSchema).readonly(), sources: z.array(sourceSchema).readonly(),
}).refine((product) => product.facts.every((fact) => fact.sourceId === null || product.sources.some((source) => source.id === fact.sourceId)), { message: "Every fact source must be supplied." });
export const missionSchema = z.object({
  id: z.string().min(1), title: z.string().min(1), description: z.string().min(1), icon: z.custom<import("react").ReactNode>(),
  request: z.string().min(1), constraints: z.array(z.string()).max(3).readonly(), ambiguity: z.string().optional(), isFictional: z.literal(true),
});
export const sourcedFactSchema = factSchema.extend({
  source: z.object({ label: z.string(), quote: z.string(), url: z.string().url().nullable() }).nullable(),
});
export const snapshotFieldSchema = z.object({
  id: z.string(), label: z.string(), status: z.enum(["matched", "missing", "explicit_false", "does_not_meet"]),
  value: z.string().nullable(), basis: z.string().nullable(), explanation: z.string().nullable(),
}).refine((field) => field.status !== "missing" || field.value === null, { message: "Missing fields cannot carry a value." });
export const snapshotSchema = z.object({
  id: z.string(), label: z.string(), fields: z.array(snapshotFieldSchema).readonly(),
  rawFields: z.array(z.object({ key: z.string(), value: z.string() })).readonly(), isFictional: z.literal(true),
});
export const revealOutcomeSchema = z.object({
  status: z.enum(["outside_shortlist", "shortlisted", "cannot_verify", "mismatch", "error"]), title: z.string(), detail: z.string(),
  missingField: z.string().nullable(), shortlist: z.array(productSchema).readonly().nullable(), retryLabel: z.string().nullable(),
}).refine((outcome) => outcome.status !== "error" || outcome.shortlist === null, { message: "Failed runs cannot contain a fallback shortlist." });
export const revealFixtureSchema = z.object({
  id: z.string(), label: z.string(), product: productSchema, snapshot: snapshotSchema, outcome: revealOutcomeSchema, isFictional: z.literal(true),
});
export const rescueFactSchema = z.object({
  id: z.string(), fieldId: z.string(), label: z.string(), displayValue: z.string(), basis: z.string(), reviewStatus: z.enum(["checked", "unreviewed"]),
  source: z.object({ label: z.string(), quote: z.string(), sourceType: z.string(), url: z.string().url().nullable() }), isFictional: z.literal(true),
});
export const rescueDiffSchema = z.object({ field: z.string(), before: z.string(), after: z.string(), basis: z.string(), explanation: z.string() });
export const receiptSchema = z.object({ before: z.string(), added: z.string(), after: z.string(), source: z.string(), ranking: z.object({ before: z.string(), after: z.string() }).optional() });
export const rescueOutcomeSchema = z.object({
  status: z.enum(["shortlisted", "no_change", "more_unfavorable", "no_fact", "unreviewed", "error"]), title: z.string(), detail: z.string(),
  diff: rescueDiffSchema.nullable(), requiredEvidence: z.string().nullable(), retryLabel: z.string().nullable(), receipt: receiptSchema,
});
export const rescueFixtureSchema = z.object({
  id: z.string(), label: z.string(), product: productSchema, snapshot: snapshotSchema, appliedSnapshot: snapshotSchema.nullable(),
  facts: z.array(rescueFactSchema).max(3).readonly(), outcome: rescueOutcomeSchema, isFictional: z.literal(true),
}).refine((fixture) => {
  if (!fixture.appliedSnapshot) return fixture.facts.every((fact) => fact.reviewStatus === "unreviewed");
  const before = fixture.snapshot;
  const after = fixture.appliedSnapshot;
  const changed = after.fields.filter((field, index) => JSON.stringify(field) !== JSON.stringify(before.fields[index]));
  const rawChanged = after.rawFields.filter((field, index) => JSON.stringify(field) !== JSON.stringify(before.rawFields[index]));
  return after.fields.length === before.fields.length && after.rawFields.length === before.rawFields.length && changed.length === 1 && rawChanged.length === 1 && fixture.facts.some((fact) => fact.reviewStatus === "checked" && fact.fieldId === changed[0].id);
}, { message: "A checked fact must change exactly one displayed and raw field." });
