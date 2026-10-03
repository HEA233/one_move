import { describe, expect, it } from "vitest";
import { interactionCopy } from "./copy";

describe("shared interaction copy", () => {
  it("keeps the primary actions and fixture disclaimers consistent", () => {
    expect(interactionCopy.task.title).toBe("What are you after?");
    expect(interactionCopy.pick.confirm).toBe("That's my pick.");
    expect(interactionCopy.pick.noneResult).toBe("No pick this round. That's a valid choice.");
    expect(interactionCopy.reveal.action).toBe("See the shortlist");
    expect(interactionCopy.rescue.compare).toBe("Compare the shortlist");
    expect(interactionCopy.receipt.disclaimer).toBe("UI fixture — not a shopping recommendation.");
    expect(JSON.stringify(interactionCopy)).not.toMatch(/AI-powered magic|Beat the AI|You failed/);
  });
});
