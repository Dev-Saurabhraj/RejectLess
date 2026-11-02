import { describe, expect, it } from "vitest";
import { checkAadhaarFormat, checkIfscFormat, checkPanFormat, maskIdentifier, parseAmount, parseDate, verhoeffCheckDigit, verhoeffValid } from ".";

describe("verhoeff", () => {
  it("round-trips a generated check digit", () => {
    const base = "23456789012";
    const full = base + verhoeffCheckDigit(base);
    expect(verhoeffValid(full)).toBe(true);
    expect(checkAadhaarFormat(full).valid).toBe(true);
    const typo = full.slice(0, 5) + ((+full[5] + 1) % 10) + full.slice(6);
    expect(checkAadhaarFormat(typo).valid).toBe(false);
  });
  it("treats masked numbers as not evaluable", () => {
    expect(checkAadhaarFormat("XXXX XXXX 1234").evaluable).toBe(false);
  });
});

describe("PAN", () => {
  it("accepts individual PAN", () => expect(checkPanFormat("ABCPK1234F").valid).toBe(true));
  it("flags company PAN", () => expect(checkPanFormat("ABCCK1234F").valid).toBe(false));
  it("flags bad structure", () => expect(checkPanFormat("ABCPK12345").valid).toBe(false));
});

describe("IFSC", () => {
  it("accepts valid", () => expect(checkIfscFormat("BDBK0001234").valid).toBe(true));
  it("flags letter O in 5th position", () => {
    const r = checkIfscFormat("BDBKO001234");
    expect(r.valid).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/zero/);
  });
});

describe("dates & amounts", () => {
  it("parses formats", () => {
    expect(parseDate("05/08/1998")).toMatchObject({ y: 1998, m: 8, d: 5 });
    expect(parseDate("05-Aug-1998")).toMatchObject({ y: 1998, m: 8, d: 5 });
    expect(parseDate("1998-08-05")).toMatchObject({ y: 1998, m: 8, d: 5 });
    expect(parseDate("1998")).toMatchObject({ y: 1998, precision: "year" });
    expect(parseDate("31/02/2000")).toBeNull();
  });
  it("parses Indian amounts", () => {
    expect(parseAmount("₹ 4,20,000")).toBe(420000);
    expect(parseAmount("Rs. 1,85,000/-")).toBe(185000);
    expect(parseAmount("4.5 lakh")).toBe(450000);
  });
  it("masks identifiers", () => {
    expect(maskIdentifier("aadhaar_number", "234567890123")).toBe("XXXX XXXX 0123");
    expect(maskIdentifier("account_number", "12345678901")).toBe("XXXXXXX8901");
  });
});
