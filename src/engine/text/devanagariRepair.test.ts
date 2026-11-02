import { describe, expect, it } from "vitest";
import { looksVisualOrder, repairVisualOrder } from "./devanagariRepair";

describe("repairVisualOrder", () => {
  it.each([
    ["िप्रया शमार्", "प्रिया शर्मा"],
    ["वािषर्क पािरवािरक आय: ₹ 3,20,000", "वार्षिक पारिवारिक आय: ₹ 3,20,000"],
  ])("%s → %s", (visual, logical) => {
    expect(repairVisualOrder(visual)).toBe(logical);
  });

  it.each(["सौरभ कुमार", "मोहम्मद इरफ़ान", "कृष्ण", "प्रिया शर्मा", "वार्षिक आय", "निवासी", "किशोर"])("leaves logical text alone: %s", (s) => {
    expect(looksVisualOrder(s)).toBe(false);
    expect(repairVisualOrder(s)).toBe(s);
  });
});
