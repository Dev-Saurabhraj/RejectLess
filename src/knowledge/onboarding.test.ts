import { describe, expect, it } from "vitest";
import { GOALS, goalsFor, recommendPf, stateNote } from "./onboarding";
import { getVariant } from "./applications";

describe("recommendPf", () => {
  it("suggests a partial withdrawal while still working", () => {
    expect(recommendPf({ leftJob: "no", years: "1to5", age58: "no" }).goalId).toBe("epf-partial");
  });
  it("suggests a partial withdrawal within 12 months of leaving, with final settlement later", () => {
    const r = recommendPf({ leftJob: "yes", monthsSinceLeft: "1to12", years: "1to5", age58: "no" });
    expect(r.goalId).toBe("epf-partial");
    expect(r.later).toMatch(/12 months/);
  });
  it("suggests final settlement after 12 months, mentioning pension after 36", () => {
    const r = recommendPf({ leftJob: "yes", monthsSinceLeft: "gt36", years: "1to5", age58: "no" });
    expect(r.goalId).toBe("epf-final");
    expect(r.later).toMatch(/Form 10C/);
  });
  it("does not offer pension withdrawal after 10+ years", () => {
    expect(recommendPf({ leftJob: "yes", monthsSinceLeft: "gt36", years: "gt10", age58: "no" }).later).toBeUndefined();
  });
  it("suggests final settlement at 58", () => {
    expect(recommendPf({ leftJob: "no", years: "gt10", age58: "yes" }).goalId).toBe("epf-final");
  });
});

describe("goals", () => {
  it("every available goal points to a real application variant", () => {
    for (const g of GOALS.filter((x) => !x.comingSoon)) expect(getVariant(g.appId!, g.variantId!)).toBeTruthy();
  });
  it("current employees are not offered final settlement", () => {
    expect(goalsFor("employee").map((g) => g.id)).not.toContain("epf-final");
  });
  it("state notes never invent state-specific rules", () => {
    expect(stateNote("nsp-csss", "BR")).toMatch(/hasn't verified Bihar/);
    expect(stateNote("epf-final", "UP")).toMatch(/central scheme/);
  });
});
