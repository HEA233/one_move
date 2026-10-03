import type { ProductFact } from "./types";

export function formatPricePence(pricePence: number | null): string {
  if (pricePence === null) {
    return "Price not available";
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pricePence / 100);
}

export function formatFactValue(value: string | number | boolean | null, unit: string | null): string {
  if (value === null) {
    return "Not available";
  }

  if (value === false) {
    return "No";
  }

  if (value === true) {
    return "Yes";
  }

  const text = String(value);
  if (!unit) {
    return text;
  }

  return unit === "%" ? `${text}${unit}` : `${text} ${unit}`;
}

export function formatFactBasis(basis: ProductFact["basis"] | null): string {
  if (!basis || basis === "unknown") {
    return "Basis not available";
  }

  if (basis === "not_applicable") {
    return "Not applicable";
  }

  return { per_100g: "per 100 g", per_serving: "per serving", per_pack: "per pack" }[basis];
}

export function isAbsoluteWebUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

export function isLocalPreviewUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}
