export const pricesPence = { charitea_mate_can: 195, oom_balance: 300 } as const;

export const priceSources = {
  charitea_mate_can: {
    id: "PRICE_CT",
    title: "ChariTea single-can price — provided by the organiser",
    url: null,
    checkedDate: "2026-10-03",
    scope: "£1.95 per can, supplied by the organiser; retailer not specified. Excludes delivery.",
  },
  oom_balance: {
    id: "PRICE_OOM",
    title: "OOM Balance single can — Common Ground",
    url: "https://thecommonstore.co.uk/products/oom-balance-12-pack?variant=58023724646782",
    checkedDate: "2026-10-03",
    scope: "£3.00 for the Single variant; retailer-specific listed price. Excludes delivery.",
  },
} as const;
