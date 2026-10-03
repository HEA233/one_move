import type { BrandId, ReasonKey } from "../shopper/types";

export const shopperCopy = {
  welcomeTitle: "Two drinks. One little detour.",
  welcomeBody: "Pick a drink for your afternoon break. The other shop gets one little note, then you choose again.",
  consent: "This is a pretend shopping game using real products. Your choices and optional reasons are recorded to explore responses to different notes.",
  priceDisclosure: "Prices per can, excluding delivery. See product details for sources.",
  start: "Take a little wander",
  pickTitle: "Where are you heading?",
  pickHelper: "Two drinks for your afternoon. Which one would you pick?",
  pickConfirm: "That's my pick",
  details: "What's in it?",
  leave: "Leave this round",
  whyTitle: "What caught your eye?",
  whyHelper: "Up to two clues, or skip this bit.",
  whyOther: "Something else",
  whyPlaceholder: "A little detail...",
  whyPrivacy: "Please leave out names or personal health details.",
  whySend: "Off we go",
  whySkip: "Keep it a mystery",
  waitTitle: "A little note is on its way.",
  waitHelper: "Your first pick is saved. Staying with it is fine.",
  revealTitle: "A note from the other shop.",
  revealIntro: "We've added a detail to our product description:",
  revealPriceIntro: "What if we offered you 50p off?",
  revealQuestion: "Would you give us another look?",
  revealNext: "Have another look",
  revealSource: "View source",
  finalTitle: "Same two drinks. One thing changed.",
  finalHelper: "Stick or switch - either is fine.",
  stay: "Still {initialBrand}",
  switch: "Let's try {targetBrand}",
  saving: "Tucking your choice away...",
  resultSwitchTitle: "A little plot twist.",
  resultSwitchBody: "You picked {finalBrand} this time. Choice saved.",
  resultStayTitle: "Still your pick. Lovely.",
  resultStayBody: "You stayed with {finalBrand}. Choice saved.",
  resultFootnote: "One observed choice, not a sale.",
  diaryLabel: "The shop's comeback tally",
  diaryScope: "Story points, not your score.",
  diarySwitch: "A little comeback: +10 story points.",
  diaryStay: "No comeback this round: -10 story points.",
  replay: "Take another wander",
  replayNote: "A fresh round. Repeat plays are logged separately.",
  done: "All done",
  abortTitle: "Taking another path?",
  abortBody: "This round ended without a score. Thanks for stopping by.",
  noCardsTitle: "No checked note this time.",
  noCardsBody: "We haven't got a supported comeback for this round. No score, no guesswork.",
  reconnecting: "A wobbly connection. Finding your street...",
  retry: "Try reconnecting",
  retryChoice: "Save this choice again",
  stale: "Your street has moved on. Catching up...",
  invalidRound: "This little street is no longer available.",
  newRound: "Start a fresh wander",
  slowNote: "The note is taking a moment. You can wait or leave without a score.",
  saveError: "We couldn't save that choice yet. Retry sends the same choice, not a new one.",
  sourceMissing: "This detail has not been checked yet.",
  curatedOrigin: "Curated note from checked facts",
  liveOrigin: "AI-selected note from checked facts",
  fallbackOrigin: "Curated note - AI selection was unavailable",
  rehearsalBadge: "Local rehearsal - not a saved research round",
  fixtureBadge: "Fictional UI example - not a participant result",
  reasonLabels: {
    taste: "Taste",
    purpose: "What it does / caffeine",
    sugar_calories: "Sugar & calories",
    ingredients: "Ingredients",
    price: "Price",
    packaging_brand: "Packaging & brand",
    other: "Something else",
  } satisfies Record<ReasonKey, string>,
} as const;

export function interpolateCopy(template: string, values: Record<string, string>): string {
  return template.replace(/\{([^}]+)\}/g, (_, key: string) => values[key] ?? "");
}

export function brandName(brandId: BrandId): string {
  return brandId === "charitea_mate_can" ? "ChariTea Mate" : "OOM Balance";
}

export function formatPrice(pricePence: number): string {
  return `£${(pricePence / 100).toFixed(2)}`;
}
