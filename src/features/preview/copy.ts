export const interactionCopy = {
  task: {
    title: "What are you after?",
    description: "Choose a fictional brief. Its original wording stays visible.",
  },
  pick: {
    title: "Which would you pick?",
    description: "Choose a product or none. You can change your pick at any time.",
    confirm: "That's my pick.",
    change: "Change my pick",
    none: "None of these",
    noneResult: "No pick this round. That's a valid choice.",
  },
  reveal: {
    title: "Same product. Different information.",
    description: "Inspect the same product and reveal a fixed shortlist.",
    action: "See the shortlist",
  },
  rescue: {
    title: "One fact. Could it change the shortlist?",
    description: "Add one sourced fact, then compare the fixed result.",
    add: "Add this fact",
    compare: "Compare the shortlist",
    reset: "Reset this example",
  },
  receipt: {
    summary: "See what changed",
    title: "One fact later.",
    disclaimer: "UI fixture — not a shopping recommendation.",
  },
} as const;
