import { describe, expect, it } from "vitest";
import { compareNames, type NameOutcome } from "./nameMatch";
import { transliterate } from "../text/transliterate";

describe("transliterate", () => {
  it.each([
    ["सौरभ", "saurabh"],
    ["कुमार", "kumaar"],
    ["राजकुमार", "raajkumaar"],
    ["अमित", "amit"],
    ["सुनील", "suneel"],
    ["कृष्ण", "krishna"],
    ["कमला", "kamlaa"],
    ["प्रिया", "priyaa"],
    ["शर्मा", "sharmaa"],
    ["आनंद", "aanand"],
    ["संजय", "sanjay"],
    ["मोहम्मद", "mohammad"],
  ])("%s → %s", (dev, latin) => {
    expect(transliterate(dev)).toBe(latin);
  });
});

const cases: [string, string, NameOutcome][] = [
  // identical / script
  ["Saurabh Kumar", "Saurabh Kumar", "consistent"],
  ["SAURABH  KUMAR", "saurabh kumar", "consistent"],
  ["Shri Saurabh Kumar", "Saurabh Kumar", "consistent"],
  ["सौरभ कुमार", "Saurabh Kumar", "consistent"],
  ["प्रिया शर्मा", "Priya Sharma", "consistent"],
  ["सुनील यादव", "Suneel Yadav", "consistent"],
  ["अमित वर्मा", "Amit Verma", "consistent"],
  ["Rahul Kumar S/O Ramesh Kumar", "Rahul Kumar", "consistent"],
  // spelling variants
  ["Saurabh Kumar", "Sourabh Kumar", "minor_variation"],
  ["Sunil Yadav", "Suneel Yadav", "minor_variation"],
  ["Mohd Irfan", "Mohd Irfaan", "minor_variation"],
  ["Sanjay Gupta", "Sanjai Gupta", "minor_variation"],
  ["Vikas Sharma", "Wikas Sharma", "minor_variation"],
  ["Pooja Singh", "Puja Singh", "minor_variation"],
  ["Lakshmi Devi", "Laxmi Devi", "minor_variation"],
  // structure differences
  ["Raj Kumar", "Kumar Raj", "minor_variation"],
  ["A. Kumar", "Amit Kumar", "minor_variation"],
  ["Amit Kumar Verma", "Amit Verma", "minor_variation"],
  // genuinely different
  ["Saurabh Kumar", "Gaurav Kumar", "mismatch"],
  ["Priya Sharma", "Riya Verma", "mismatch"],
  ["Amit Kumar", "Sumit Kumar", "mismatch"],
  ["Rakesh Yadav", "Ramesh Yadav", "mismatch"],
  ["Neha Gupta", "Sneha Gupta", "mismatch"],
  // missing
  ["", "Saurabh", "insufficient"],
];

describe("compareNames", () => {
  it.each(cases)("%s vs %s → %s", (a, b, expected) => {
    expect(compareNames(a, b).outcome).toBe(expected);
  });

  it("explains a vowel transliteration variant", () => {
    const r = compareNames("Saurabh Kumar", "Sourabh Kumar");
    expect(r.signals.join(" ")).toMatch(/au.*ou/);
    expect(r.abstract).not.toMatch(/saurabh|sourabh/i);
  });

  it("flags script difference", () => {
    const r = compareNames("सौरभ कुमार", "Saurabh Kumar");
    expect(r.scriptDiffers).toBe(true);
    expect(r.pairs.every((p) => p.kind === "transliteration")).toBe(true);
  });
});
