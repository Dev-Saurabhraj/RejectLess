import { describe, expect, it } from "vitest";
import type { TextLine } from "../types";
import { classify, extractFields } from ".";

const L = (texts: string[]): TextLine[] => texts.map((text, i) => ({ text, page: 1, confidence: 0.95, bbox: { x: 0.1, y: i * 0.05, w: 0.5, h: 0.04 } }));

describe("Aadhaar extraction", () => {
  it("reads names above the DOB line, skipping card furniture", () => {
    const lines = L(["भारत सरकार", "Government of India", "सौरभ कुमार", "Saurabh Kumar", "PHOTO", "जन्म तिथि / DOB: 05/08/1998", "पुरुष / MALE", "XXXX XXXX 7316"]);
    expect(classify(lines).typeId).toBe("aadhaar");
    const { fields } = extractFields("aadhaar", lines, "ocr");
    const get = (k: string) => fields.find((f) => f.key === k)?.value;
    expect(get("name")).toBe("Saurabh Kumar");
    expect(get("name_local")).toBe("सौरभ कुमार");
    expect(get("dob")).toBe("1998-08-05");
    expect(get("aadhaar_number")).toBe("XXXX XXXX 7316");
  });

  it("accepts OCR-misread masking characters", () => {
    const { fields } = extractFields("aadhaar", L(["Priya Sharma", "DOB: 23/11/2006", "KXXX XXXK 2287"]), "ocr");
    expect(fields.find((f) => f.key === "aadhaar_number")?.value).toBe("XXXX XXXX 2287");
  });

  it("keeps only the masked number and the checksum result for a full Aadhaar", () => {
    const { fields } = extractFields("aadhaar", L(["Amit Verma", "DOB: 01/01/1990", "2345 6789 0124"]), "ocr");
    const a = fields.find((f) => f.key === "aadhaar_number")!;
    expect(a.value).toBe("XXXX XXXX 0124");
    expect(a.minimised?.evaluable).toBe(true);
  });
});

describe("other documents", () => {
  it("bank passbook with OCR row merging", () => {
    const lines = L(["Bharat Demo Bank", "SAVINGS ACCOUNT PASSBOOK", "Branch: Kankarbagh, Patna IFSC: BDBK0001234", "Account Holder Name: Sourabh Kumar", "Account No.: 30451287690"]);
    expect(classify(lines).typeId).toBe("bank_passbook");
    const { fields } = extractFields("bank_passbook", lines, "ocr");
    const get = (k: string) => fields.find((f) => f.key === k)?.value;
    expect(get("ifsc")).toBe("BDBK0001234");
    expect(get("branch")).toBe("Kankarbagh, Patna");
    expect(get("account_holder")).toBe("Sourabh Kumar");
    expect(get("account_number")).toBe("30451287690");
  });

  it("Hindi income certificate", () => {
    const lines = L(["आय प्रमाण पत्र", "Income Certificate", "आवेदक का नाम: प्रिया शर्मा", "पिता का नाम: महेश शर्मा", "वार्षिक पारिवारिक आय: ₹ 3,20,000", "जारी करने की तिथि: 12/07/2026", "जारीकर्ता: तहसीलदार, जयपुर"]);
    expect(classify(lines).typeId).toBe("income_certificate");
    const { fields } = extractFields("income_certificate", lines, "text-layer");
    const get = (k: string) => fields.find((f) => f.key === k)?.value;
    expect(get("name")).toBe("प्रिया शर्मा");
    expect(get("father_name")).toBe("महेश शर्मा");
    expect(get("annual_income")).toBe("320000");
    expect(get("issue_date")).toBe("2026-07-12");
  });

  it("keeps an unparseable date instead of dropping it", () => {
    const { fields } = extractFields("marksheet_12", L(["Name of Candidate: PRIYA SHARMA", "Date of Birth: 11/23/2006", "Roll No.: SR2604417", "Aggregate Percentage: 91.40"]), "ocr");
    expect(fields.find((f) => f.key === "dob")?.value).toBe("11/23/2006");
  });
});
