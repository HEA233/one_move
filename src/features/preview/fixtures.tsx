import { BookOpen, CircleHelp, Leaf } from "lucide-react";
import type { CatalogueSnapshot, Mission, PreviewProduct, ProductSource, RescueFixture, RevealFixture, SourcedFact } from "./types";

function packageImage(name: string, colour: string, panel: string): string {
  const namespace = "http://www.w3.org/2000/svg";
  const artwork = `<svg xmlns="${namespace}" viewBox="0 0 400 300"><rect width="400" height="300" fill="#eee9dc"/><rect x="125" y="28" width="150" height="244" rx="14" fill="${colour}" stroke="#25251f" stroke-width="3"/><path d="M125 70h150" stroke="#25251f" stroke-width="3"/><rect x="140" y="92" width="120" height="108" rx="8" fill="${panel}"/><text x="200" y="127" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="700" fill="#25251f">${name.split(" ")[0]}</text><text x="200" y="151" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="10" fill="#25251f">SYNTHETIC PACK</text><path d="M157 174h86" stroke="#25251f" stroke-width="2"/><circle cx="200" cy="227" r="17" fill="${panel}" stroke="#25251f" stroke-width="2"/></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(artwork)}`;
}

export const missions: readonly Mission[] = [
  {
    id: "crisp-snack",
    title: "A crisp afternoon snack",
    description: "Find a light bite for a walk between meetings.",
    icon: <Leaf aria-hidden="true" size={22} strokeWidth={1.8} />,
    request: "I want a crisp snack for a walk between meetings.",
    constraints: ["Light bite", "For an afternoon walk"],
    isFictional: true,
  },
  {
    id: "desk-drawer",
    title: "Keep one in the desk drawer",
    description: "Choose a small snack for a long workday.",
    icon: <BookOpen aria-hidden="true" size={22} strokeWidth={1.8} />,
    request: "Keep one small snack in my desk drawer for a long workday.",
    constraints: ["Small pack", "Desk-drawer friendly"],
    isFictional: true,
  },
  {
    id: "unclear-brief",
    title: "Something filling, not too sweet",
    description: "The original wording is shown without inventing thresholds.",
    icon: <CircleHelp aria-hidden="true" size={22} strokeWidth={1.8} />,
    request: "I need something filling, but not too sweet.",
    constraints: ["Original wording only"],
    ambiguity: "Filling and not too sweet are not converted into nutrition rules in this preview.",
    isFictional: true,
  },
];

export const products: readonly PreviewProduct[] = [
  {
    id: "morrow-oat-square",
    isFictional: true,
    name: "Morrow Oat Square",
    imageSrc: packageImage("Morrow Oat Square", "#9cac54", "#f5f1e8"),
    imageAlt: "Fictional green Morrow Oat Square package illustration",
    currency: "GBP",
    pricePence: 125,
    facts: [
      { id: "oat-fibre", key: "fibre", sourceId: "oat-source", sourceQuote: "Fibre 4 g per 100 g", reviewStatus: "synthetic", label: "Fibre", value: 4, unit: "g", basis: "per_100g", isFictional: true },
      { id: "oat-vegan", key: "vegan", sourceId: "oat-source", sourceQuote: "Vegan stated on the example pack", reviewStatus: "synthetic", label: "Vegan", value: true, unit: null, basis: "not_applicable", isFictional: true },
    ],
    sources: [{ id: "oat-source", kind: "fixture", url: null, capturedAt: null, label: "Example source", quote: "Fibre 4 g per 100 g; vegan stated on the example pack." }],
  },
  {
    id: "pebble-cocoa-bite",
    isFictional: true,
    name: "Pebble Cocoa Bite",
    imageSrc: packageImage("Pebble Cocoa Bite", "#806257", "#f2d7a4"),
    imageAlt: "Fictional cocoa coloured Pebble Cocoa Bite package illustration",
    currency: "GBP",
    pricePence: null,
    facts: [
      { id: "cocoa-protein", key: "protein", sourceId: null, sourceQuote: null, reviewStatus: "synthetic", label: "Protein", value: null, unit: "g", basis: "per_pack", isFictional: true },
      { id: "cocoa-vegan", key: "vegan", sourceId: "cocoa-source", sourceQuote: "Vegan: no.", reviewStatus: "synthetic", label: "Vegan", value: false, unit: null, basis: "not_applicable", isFictional: true },
      { id: "cocoa-salt", key: "salt", sourceId: "cocoa-source", sourceQuote: "Salt: 0 g.", reviewStatus: "synthetic", label: "Salt", value: 0, unit: "g", basis: "unknown", isFictional: true },
    ],
    sources: [{ id: "cocoa-source", kind: "fixture", url: null, capturedAt: null, label: "Example source", quote: "Vegan: no. Salt: 0 g. Price was not supplied." }],
  },
];

const exampleSource = (id: string, quote: string): ProductSource => ({
  id,
  kind: "fixture", url: null, capturedAt: null,
  label: "Example source",
  quote,
});

export const pickProducts: readonly PreviewProduct[] = [
  products[0],
  products[1],
  {
    id: "luma-seed-crisp",
    isFictional: true,
    name: "Luma Seed Crisp",
    imageSrc: packageImage("Luma Seed Crisp", "#647b78", "#e1e9dc"),
    imageAlt: "Fictional blue-green Luma Seed Crisp package illustration",
    currency: "GBP",
    pricePence: 240,
    facts: [
      { id: "luma-pack", key: "pack_size", sourceId: "luma-source", sourceQuote: "Pack size 50 g.", reviewStatus: "synthetic", label: "Pack size", value: 50, unit: "g", basis: "per_pack", isFictional: true },
      { id: "luma-vegan", key: "vegan", sourceId: "luma-source", sourceQuote: "Vegan stated on the example pack.", reviewStatus: "synthetic", label: "Vegan", value: true, unit: null, basis: "not_applicable", isFictional: true },
    ],
    sources: [exampleSource("luma-source", "Pack size 50 g. Vegan stated on the example pack.")],
  },
  {
    id: "bramble-rice-cloud",
    isFictional: true,
    name: "Bramble Rice Cloud",
    imageSrc: packageImage("Bramble Rice Cloud", "#bf8664", "#f2e4d2"),
    imageAlt: "Fictional terracotta Bramble Rice Cloud package illustration",
    currency: "GBP",
    pricePence: 90,
    facts: [
      { id: "bramble-sugar", key: "sugar", sourceId: "bramble-source", sourceQuote: "Sugar 0 g per pack.", reviewStatus: "synthetic", label: "Sugar", value: 0, unit: "g", basis: "per_pack", isFictional: true },
      { id: "bramble-vegan", key: "vegan", sourceId: null, sourceQuote: null, reviewStatus: "synthetic", label: "Vegan", value: null, unit: null, basis: "unknown", isFictional: true },
    ],
    sources: [exampleSource("bramble-source", "Sugar 0 g per pack. No vegan statement supplied.")],
  },
  {
    id: "nettled-orchard-chew",
    isFictional: true,
    name: "Nettled Orchard Chew",
    imageSrc: packageImage("Nettled Orchard Chew", "#aa9c59", "#f5efd0"),
    imageAlt: "Fictional yellow-green Nettled Orchard Chew package illustration",
    currency: "GBP",
    pricePence: 310,
    facts: [
      { id: "nettled-serving", key: "serving", sourceId: "nettled-source", sourceQuote: "One piece per serving.", reviewStatus: "synthetic", label: "Serving", value: 1, unit: "piece", basis: "per_serving", isFictional: true },
      { id: "nettled-protein", key: "protein", sourceId: "nettled-source", sourceQuote: "Protein 2 g per serving.", reviewStatus: "synthetic", label: "Protein", value: 2, unit: "g", basis: "per_serving", isFictional: true },
    ],
    sources: [exampleSource("nettled-source", "One piece per serving. Protein 2 g per serving.")],
  },
  {
    id: "long-name-cracker",
    isFictional: true,
    name: "A Very Long Fictional Product Name for a Small Cracker Pack",
    imageSrc: packageImage("Long Fictional Cracker", "#8b6e65", "#eadbd2"),
    imageAlt: "Fictional mauve A Very Long Fictional Product package illustration",
    currency: "GBP",
    pricePence: 480,
    facts: [
      { id: "long-pack", key: "pack_size", sourceId: "long-source", sourceQuote: "Six pieces per pack.", reviewStatus: "synthetic", label: "Pack size", value: 6, unit: "pieces", basis: "per_pack", isFictional: true },
      { id: "long-allergen", key: "allergen_note", sourceId: null, sourceQuote: null, reviewStatus: "synthetic", label: "Allergen note", value: null, unit: null, basis: "unknown", isFictional: true },
    ],
    sources: [exampleSource("long-source", "Six pieces per pack. Allergen note was not supplied.")],
  },
];

export const revealFixtures: readonly RevealFixture[] = [
  {
    id: "outside-shortlist",
    label: "A · Outside shortlist",
    product: pickProducts[0],
    snapshot: {
      id: "snapshot-outside",
      label: "Catalogue snapshot A",
      fields: [
        { id: "outside-budget", label: "Budget", status: "matched", value: "Matched", basis: null, explanation: null },
        { id: "outside-vegan", label: "Vegan", status: "missing", value: null, basis: null, explanation: "Not recorded in this snapshot." },
        { id: "outside-pack", label: "Pack size", status: "matched", value: "40 g", basis: "per pack", explanation: null },
      ],
      rawFields: [
        { key: "budget", value: "matched" },
        { key: "vegan", value: "missing" },
        { key: "pack_size", value: "40 g per pack" },
      ],
      isFictional: true,
    } satisfies CatalogueSnapshot,
    outcome: {
      status: "outside_shortlist",
      title: "Not on this shortlist.",
      detail: "Let's look at the information behind it.",
      missingField: null,
      shortlist: [pickProducts[1], pickProducts[2], pickProducts[3]],
      retryLabel: null,
    },
    isFictional: true,
  },
  {
    id: "already-shortlisted",
    label: "B · Already shortlisted",
    product: pickProducts[0],
    snapshot: {
      id: "snapshot-included",
      label: "Catalogue snapshot B",
      fields: [
        { id: "included-budget", label: "Budget", status: "matched", value: "Matched", basis: null, explanation: null },
        { id: "included-vegan", label: "Vegan", status: "explicit_false", value: "No", basis: "as supplied", explanation: "Explicitly recorded as false." },
        { id: "included-pack", label: "Pack size", status: "matched", value: "40 g", basis: "per pack", explanation: null },
      ],
      rawFields: [
        { key: "budget", value: "matched" },
        { key: "vegan", value: "false" },
        { key: "pack_size", value: "40 g per pack" },
      ],
      isFictional: true,
    } satisfies CatalogueSnapshot,
    outcome: {
      status: "shortlisted",
      title: "Same pick. Let's see why.",
      detail: "The product is already in this supplied shortlist. You can still inspect its information.",
      missingField: null,
      shortlist: [pickProducts[0], pickProducts[2], pickProducts[3]],
      retryLabel: null,
    },
    isFictional: true,
  },
  {
    id: "cannot-verify",
    label: "C · Not enough information",
    product: pickProducts[2],
    snapshot: {
      id: "snapshot-unknown",
      label: "Catalogue snapshot C",
      fields: [
        { id: "unknown-budget", label: "Budget", status: "matched", value: "Matched", basis: null, explanation: null },
        { id: "unknown-vegan", label: "Vegan", status: "missing", value: null, basis: null, explanation: "Not recorded in this snapshot." },
        { id: "unknown-pack", label: "Pack size", status: "matched", value: "50 g", basis: "per pack", explanation: null },
      ],
      rawFields: [
        { key: "budget", value: "matched" },
        { key: "vegan", value: "missing" },
        { key: "pack_size", value: "50 g per pack" },
      ],
      isFictional: true,
    } satisfies CatalogueSnapshot,
    outcome: {
      status: "cannot_verify",
      title: "Not enough information.",
      detail: "Vegan status was not confirmed. That is different from a negative value.",
      missingField: "Vegan",
      shortlist: [pickProducts[0], pickProducts[1]],
      retryLabel: null,
    },
    isFictional: true,
  },
  {
    id: "budget-mismatch",
    label: "D · Outside the budget",
    product: pickProducts[5],
    snapshot: {
      id: "snapshot-mismatch",
      label: "Catalogue snapshot D",
      fields: [
        { id: "mismatch-budget", label: "Budget", status: "does_not_meet", value: "£4.80 per pack", basis: "per pack", explanation: "The supplied price is above the £3.00 budget." },
        { id: "mismatch-vegan", label: "Vegan", status: "missing", value: null, basis: null, explanation: "Not recorded in this snapshot." },
        { id: "mismatch-pack", label: "Pack size", status: "matched", value: "6 pieces", basis: "per pack", explanation: null },
      ],
      rawFields: [
        { key: "budget", value: "does_not_meet: £4.80 per pack" },
        { key: "vegan", value: "missing" },
        { key: "pack_size", value: "6 pieces per pack" },
      ],
      isFictional: true,
    } satisfies CatalogueSnapshot,
    outcome: {
      status: "mismatch",
      title: "Outside the budget.",
      detail: "The supplied price is £4.80 per pack, above the £3.00 mission budget. A label cannot change that fact.",
      missingField: null,
      shortlist: [pickProducts[0], pickProducts[2], pickProducts[3]],
      retryLabel: null,
    },
    isFictional: true,
  },
  {
    id: "run-error",
    label: "E · No agent result",
    product: pickProducts[1],
    snapshot: {
      id: "snapshot-error",
      label: "Catalogue snapshot E",
      fields: [
        { id: "error-budget", label: "Budget", status: "matched", value: "Matched", basis: null, explanation: null },
        { id: "error-vegan", label: "Vegan", status: "explicit_false", value: "No", basis: "as supplied", explanation: "Explicitly recorded as false." },
        { id: "error-pack", label: "Pack size", status: "missing", value: null, basis: null, explanation: "Not recorded in this snapshot." },
      ],
      rawFields: [
        { key: "budget", value: "matched" },
        { key: "vegan", value: "false" },
        { key: "pack_size", value: "missing" },
      ],
      isFictional: true,
    } satisfies CatalogueSnapshot,
    outcome: {
      status: "error",
      title: "No shortlist available.",
      detail: "The supplied run failed before it returned a list. Nothing is being invented as a fallback.",
      missingField: null,
      shortlist: null,
      retryLabel: "Try this fixture again",
    },
    isFictional: true,
  },
];

function rescueSnapshot(id: string, label: string, fields: CatalogueSnapshot["fields"], rawFields: CatalogueSnapshot["rawFields"]): CatalogueSnapshot {
  return { id, label, fields, rawFields, isFictional: true };
}

function rescueFact(id: string, label: string, displayValue: string, basis: string, reviewStatus: "checked" | "unreviewed", quote: string): RescueFixture["facts"][number] {
  return {
    id,
    label,
    fieldId: { "rescue-protein": "rescue-success-protein", "rescue-fibre": "rescue-same-fibre", "rescue-price": "rescue-worse-price", "rescue-vegan-unreviewed": "rescue-unreviewed-vegan", "rescue-error-protein": "rescue-error-protein" }[id]!,
    displayValue,
    basis,
    reviewStatus,
    source: { label: "Example source", quote, sourceType: "Synthetic package text", url: null },
    isFictional: true,
  };
}

export const rescueFixtures: readonly RescueFixture[] = [
  {
    id: "rescue-shortlisted",
    label: "A · Enters shortlist",
    product: pickProducts[0],
    snapshot: rescueSnapshot(
      "rescue-snapshot-success",
      "Catalogue baseline",
      [
        { id: "rescue-success-budget", label: "Budget", status: "matched", value: "Matched", basis: null, explanation: null },
        { id: "rescue-success-protein", label: "Protein", status: "missing", value: null, basis: null, explanation: "Not recorded in this snapshot." },
        { id: "rescue-success-pack", label: "Pack size", status: "matched", value: "40 g", basis: "per pack", explanation: null },
      ],
      [{ key: "budget", value: "matched" }, { key: "protein", value: "missing" }, { key: "pack_size", value: "40 g per pack" }],
    ),
    facts: [rescueFact("rescue-protein", "Protein", "18 g per pack", "per pack", "checked", "Protein 18 g per pack")],
    appliedSnapshot: rescueSnapshot("rescue-snapshot-success-applied", "Catalogue after adding the fact", [
      { id: "rescue-success-budget", label: "Budget", status: "matched", value: "Matched", basis: null, explanation: null },
      { id: "rescue-success-protein", label: "Protein", status: "matched", value: "18 g per pack", basis: "per pack", explanation: null },
      { id: "rescue-success-pack", label: "Pack size", status: "matched", value: "40 g", basis: "per pack", explanation: null },
    ], [{ key: "budget", value: "matched" }, { key: "protein", value: "18 g per pack" }, { key: "pack_size", value: "40 g per pack" }]),
    outcome: {
      status: "shortlisted",
      title: "Made the shortlist.",
      detail: "The supplied fixture shows the product entering the shortlist after the protein field is added.",
      diff: { field: "Protein", before: "not recorded", after: "18 g per pack", basis: "per pack", explanation: "The catalogue snapshot now includes the supplied protein fact." },
      requiredEvidence: null,
      retryLabel: null,
      receipt: { before: "outside the shortlist", added: "18 g protein per pack", after: "in the shortlist", source: "Example source" },
    },
    isFictional: true,
  },
  {
    id: "rescue-no-change",
    label: "B · Same shortlist",
    product: pickProducts[0],
    snapshot: rescueSnapshot(
      "rescue-snapshot-same",
      "Catalogue baseline",
      [
        { id: "rescue-same-budget", label: "Budget", status: "matched", value: "Matched", basis: null, explanation: null },
        { id: "rescue-same-fibre", label: "Fibre", status: "missing", value: null, basis: null, explanation: "Not recorded in this snapshot." },
        { id: "rescue-same-pack", label: "Pack size", status: "matched", value: "40 g", basis: "per pack", explanation: null },
      ],
      [{ key: "budget", value: "matched" }, { key: "fibre", value: "missing" }, { key: "pack_size", value: "40 g per pack" }],
    ),
    facts: [rescueFact("rescue-fibre", "Fibre", "4 g per 100 g", "per 100 g", "checked", "Fibre 4 g per 100 g")],
    appliedSnapshot: rescueSnapshot("rescue-snapshot-same-applied", "Catalogue after adding the fact", [
      { id: "rescue-same-budget", label: "Budget", status: "matched", value: "Matched", basis: null, explanation: null },
      { id: "rescue-same-fibre", label: "Fibre", status: "matched", value: "4 g per 100 g", basis: "per 100 g", explanation: null },
      { id: "rescue-same-pack", label: "Pack size", status: "matched", value: "40 g", basis: "per pack", explanation: null },
    ], [{ key: "budget", value: "matched" }, { key: "fibre", value: "4 g per 100 g" }, { key: "pack_size", value: "40 g per pack" }]),
    outcome: {
      status: "no_change",
      title: "More information. Same shortlist.",
      detail: "The supplied fixture keeps the shortlist unchanged after adding fibre.",
      diff: { field: "Fibre", before: "not recorded", after: "4 g per 100 g", basis: "per 100 g", explanation: "The fact was added, but the supplied outcome stays the same." },
      requiredEvidence: null,
      retryLabel: null,
      receipt: { before: "outside the shortlist", added: "4 g fibre per 100 g", after: "outside the shortlist", source: "Example source" },
    },
    isFictional: true,
  },
  {
    id: "rescue-more-unfavorable",
    label: "C · More unfavorable",
    product: pickProducts[5],
    snapshot: rescueSnapshot(
      "rescue-snapshot-worse",
      "Catalogue baseline",
      [
        { id: "rescue-worse-price", label: "Price", status: "missing", value: null, basis: null, explanation: "Not recorded in this snapshot." },
        { id: "rescue-worse-pack", label: "Pack size", status: "matched", value: "6 pieces", basis: "per pack", explanation: null },
      ],
      [{ key: "price", value: "missing" }, { key: "pack_size", value: "6 pieces per pack" }],
    ),
    facts: [rescueFact("rescue-price", "Price", "£4.80 per pack", "per pack", "checked", "Price £4.80 per pack")],
    appliedSnapshot: rescueSnapshot("rescue-snapshot-worse-applied", "Catalogue after adding the fact", [
      { id: "rescue-worse-price", label: "Price", status: "does_not_meet", value: "£4.80 per pack", basis: "per pack", explanation: "Above the £3.00 budget." },
      { id: "rescue-worse-pack", label: "Pack size", status: "matched", value: "6 pieces", basis: "per pack", explanation: null },
    ], [{ key: "price", value: "£4.80 per pack" }, { key: "pack_size", value: "6 pieces per pack" }]),
    outcome: {
      status: "more_unfavorable",
      title: "A clearer picture. A different result.",
      detail: "The supplied price confirms that this product is above the £3.00 budget. That is a fixture outcome, not a program error.",
      diff: { field: "Price", before: "not recorded", after: "£4.80 per pack", basis: "per pack", explanation: "The added checked price confirms the budget mismatch." },
      requiredEvidence: null,
      retryLabel: null,
      receipt: { before: "price not recorded", added: "£4.80 per pack", after: "outside the budget", source: "Example source" },
    },
    isFictional: true,
  },
  {
    id: "rescue-no-fact",
    label: "D · No checked fact",
    product: pickProducts[2],
    snapshot: rescueSnapshot(
      "rescue-snapshot-empty",
      "Catalogue baseline",
      [
        { id: "rescue-empty-budget", label: "Budget", status: "matched", value: "Matched", basis: null, explanation: null },
        { id: "rescue-empty-vegan", label: "Vegan", status: "missing", value: null, basis: null, explanation: "Not recorded in this snapshot." },
        { id: "rescue-empty-pack", label: "Pack size", status: "matched", value: "50 g", basis: "per pack", explanation: null },
      ],
      [{ key: "budget", value: "matched" }, { key: "vegan", value: "missing" }, { key: "pack_size", value: "50 g per pack" }],
    ),
    facts: [],
    appliedSnapshot: null,
    outcome: {
      status: "no_fact",
      title: "No checked fact to add yet.",
      detail: "This fixture has no eligible fact. It needs a checked source for price, pack size or another explicit mission field.",
      diff: null,
      requiredEvidence: "A checked source with a complete value and measurement basis.",
      retryLabel: null,
      receipt: { before: "information incomplete", added: "No checked fact added", after: "baseline unchanged", source: "No checked source" },
    },
    isFictional: true,
  },
  {
    id: "rescue-unreviewed",
    label: "E · Unreviewed fact",
    product: pickProducts[2],
    snapshot: rescueSnapshot(
      "rescue-snapshot-unreviewed",
      "Catalogue baseline",
      [
        { id: "rescue-unreviewed-budget", label: "Budget", status: "matched", value: "Matched", basis: null, explanation: null },
        { id: "rescue-unreviewed-vegan", label: "Vegan", status: "missing", value: null, basis: null, explanation: "Not recorded in this snapshot." },
        { id: "rescue-unreviewed-pack", label: "Pack size", status: "matched", value: "50 g", basis: "per pack", explanation: null },
      ],
      [{ key: "budget", value: "matched" }, { key: "vegan", value: "missing" }, { key: "pack_size", value: "50 g per pack" }],
    ),
    facts: [rescueFact("rescue-vegan-unreviewed", "Vegan", "Vegan — stated on the packaging", "as stated", "unreviewed", "Vegan stated on the example packaging")],
    appliedSnapshot: null,
    outcome: {
      status: "unreviewed",
      title: "This fact is not checked yet.",
      detail: "You can inspect the example source, but an unreviewed fact cannot be applied as checked evidence.",
      diff: null,
      requiredEvidence: "A review pass that confirms the source and its exact wording.",
      retryLabel: null,
      receipt: { before: "vegan status missing", added: "Fact not applied", after: "baseline unchanged", source: "Example source · unreviewed" },
    },
    isFictional: true,
  },
  {
    id: "rescue-error",
    label: "F · Result failed",
    product: pickProducts[0],
    snapshot: rescueSnapshot(
      "rescue-snapshot-error",
      "Catalogue baseline",
      [
        { id: "rescue-error-budget", label: "Budget", status: "matched", value: "Matched", basis: null, explanation: null },
        { id: "rescue-error-protein", label: "Protein", status: "missing", value: null, basis: null, explanation: "Not recorded in this snapshot." },
        { id: "rescue-error-pack", label: "Pack size", status: "matched", value: "40 g", basis: "per pack", explanation: null },
      ],
      [{ key: "budget", value: "matched" }, { key: "protein", value: "missing" }, { key: "pack_size", value: "40 g per pack" }],
    ),
    facts: [rescueFact("rescue-error-protein", "Protein", "18 g per pack", "per pack", "checked", "Protein 18 g per pack")],
    appliedSnapshot: rescueSnapshot("rescue-snapshot-error-applied", "Catalogue after adding the fact", [
      { id: "rescue-error-budget", label: "Budget", status: "matched", value: "Matched", basis: null, explanation: null },
      { id: "rescue-error-protein", label: "Protein", status: "matched", value: "18 g per pack", basis: "per pack", explanation: null },
      { id: "rescue-error-pack", label: "Pack size", status: "matched", value: "40 g", basis: "per pack", explanation: null },
    ], [{ key: "budget", value: "matched" }, { key: "protein", value: "18 g per pack" }, { key: "pack_size", value: "40 g per pack" }]),
    outcome: {
      status: "error",
      title: "The preview could not finish.",
      detail: "The supplied after fixture failed. The selected fact stays visible, and no successful result is substituted.",
      diff: null,
      requiredEvidence: null,
      retryLabel: "Retry this example",
      receipt: { before: "outside the shortlist", added: "18 g protein per pack", after: "no result returned", source: "Example source" },
    },
    isFictional: true,
  },
];

export const sourcedFact: SourcedFact = {
  id: "oat-protein", key: "protein", sourceId: "protein-source", sourceQuote: "Protein 3.2 g per 100 g", reviewStatus: "synthetic",
  label: "Protein",
  value: 3.2,
  unit: "g",
  basis: "per_100g",
  isFictional: true,
  source: {
    label: "Synthetic package label",
    quote: "Protein 3.2 g per 100 g",
    url: null,
  },
};
