import { z } from "zod";
import type { ModelInput } from "./provider";

const textSchema = z.strictObject({ item: z.string(), colour: z.string(), quantity: z.number().int(), price: z.number().nullable() });
const imageSchema = z.strictObject({ label: z.string(), quantity: z.number().int(), unit: z.string(), batch: z.string(), price: z.number().nullable() });
export const textSmokeInput: ModelInput<z.infer<typeof textSchema>> = {
  text: "Item: Example notebook. Colour: blue. Quantity: 2. No price is provided.",
  validator: textSchema, jsonSchema: z.toJSONSchema(textSchema),
  fixture: { item: "Example notebook", colour: "blue", quantity: 2, price: null }, promptVersion: "prep-text-v1", schemaVersion: "prep-text-v1",
};
export const imageSmokeInput: ModelInput<z.infer<typeof imageSchema>> = {
  text: "Extract label, quantity, unit, batch and price exactly as shown in the synthetic image. Preserve a missing price as null.",
  validator: imageSchema, jsonSchema: z.toJSONSchema(imageSchema),
  fixture: { label: "TEST FIXTURE", quantity: 2, unit: "pieces", batch: "A17", price: null }, promptVersion: "prep-image-v1", schemaVersion: "prep-image-v1",
};
