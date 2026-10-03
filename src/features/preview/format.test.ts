import { describe, expect, it } from "vitest";
import { formatFactBasis, formatFactValue, formatPricePence, isAbsoluteWebUrl, isLocalPreviewUrl } from "./format";

describe("preview display formatting", () => {
  it("preserves missing, false, true, zero, units, and basis as distinct values", () => {
    expect(formatFactValue(null, "g")).toBe("Not available");
    expect(formatFactValue(false, null)).toBe("No");
    expect(formatFactValue(true, null)).toBe("Yes");
    expect(formatFactValue(0, "g")).toBe("0 g");
    expect(formatFactValue(18, "%")).toBe("18%");
    expect(formatFactValue("trace", null)).toBe("trace");
    expect(formatFactBasis("per_100g")).toBe("per 100 g");
    expect(formatFactBasis("per_serving")).toBe("per serving");
    expect(formatFactBasis("per_pack")).toBe("per pack");
    expect(formatFactBasis(null)).toBe("Basis not available");
    expect(formatFactBasis("unknown")).toBe("Basis not available");
    expect(formatFactBasis("not_applicable")).toBe("Not applicable");
  });

  it("formats integer pence without changing the supplied value", () => {
    const value = 125;

    expect(formatPricePence(value)).toBe("£1.25");
    expect(formatPricePence(0)).toBe("£0.00");
    expect(formatPricePence(null)).toBe("Price not available");
    expect(value).toBe(125);
  });

  it("accepts only explicit absolute HTTP or HTTPS links", () => {
    expect(isAbsoluteWebUrl(new URL("/sandbox", ["https:", "/", "/example.test"].join("")).href)).toBe(true);
    expect(isAbsoluteWebUrl("/sandbox")).toBe(false);
    expect(isAbsoluteWebUrl("mailto:team@example.test")).toBe(false);
    expect(isAbsoluteWebUrl("")).toBe(false);
    expect(isLocalPreviewUrl(new URL("/sandbox", ["http:", "/", "/localhost:3000"].join("")).href)).toBe(true);
  });
});
