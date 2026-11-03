import { describe, expect, it } from "vitest";
import { decodeRejection, redactNotice } from "./rejection";

describe("notice redaction", () => {
  it("masks identifiers, numbers, PAN, phone, email and dates before anything reaches the AI", () => {
    const { text, removed } = redactNotice(
      "Claim ID: UPLKO260911234567 for member Saurabh Kumar, PAN ABCPK1234L, UAN 100987654321, mobile 9876543210, email s@example.com, dated 02/11/2026. Reason: DATE OF EXIT NOT AVAILABLE.",
      null,
    );
    expect(text).not.toMatch(/UPLKO260911234567|ABCPK1234L|100987654321|9876543210|example\.com|02\/11\/2026/);
    expect(text).toMatch(/\[ID\]|\[NUMBER\]/);
    expect(text).toMatch(/\[PAN\]/);
    expect(text).toMatch(/DATE OF EXIT NOT AVAILABLE/);
    expect(removed).toBeGreaterThanOrEqual(5);
  });
});

describe("rejection decoder", () => {
  it("recognises an EPFO date-of-exit rejection", () => {
    const d = decodeRejection("CLAIM REJECTED\nReason: DATE OF EXIT NOT AVAILABLE IN THE SYSTEM. MEMBER STILL IN SERVICE.", "epfo-withdrawal");
    expect(d[0]?.reason.id).toBe("epf-date-of-exit");
    expect(d[0].evidence[0]).toMatch(/DATE OF EXIT/);
  });
  it("recognises an NSP Aadhaar-seeding failure and a PM-KISAN e-KYC hold", () => {
    expect(decodeRejection("Payment failed: Aadhaar not seeded with bank account (NPCI)", "nsp-csss")[0]?.reason.id).toBe("nsp-bank-seeding");
    expect(decodeRejection("Status: eKYC pending for registration no. UP123", "pm-kisan")[0]?.reason.id).toBe("pmk-ekyc");
  });
  it("recognises a defective-return notice and returns nothing for unknown text", () => {
    expect(decodeRejection("Notice u/s 139(9): return is defective", "income-tax-return")[0]?.reason.id).toBe("itr-defective");
    expect(decodeRejection("Dear applicant, thank you for your patience.", "nsp-csss")).toHaveLength(0);
  });
  it("searches all applications when none is given", () => {
    expect(decodeRejection("PAN is inoperative").map((d) => d.reason.id)).toContain("itr-pan-inoperative");
  });
});
