// Structural validators. These check FORMAT only — never authenticity or existence.

// Verhoeff tables (used by the Aadhaar number checksum digit).
const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 8, 7, 6, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
const INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

export function verhoeffValid(num: string): boolean {
  let c = 0;
  const digits = num.split("").reverse().map(Number);
  for (let i = 0; i < digits.length; i++) c = D[c][P[i % 8][digits[i]]];
  return c === 0;
}

export function verhoeffCheckDigit(num: string): number {
  let c = 0;
  const digits = num.split("").reverse().map(Number);
  for (let i = 0; i < digits.length; i++) c = D[c][P[(i + 1) % 8][digits[i]]];
  return INV[c];
}

export interface FormatResult {
  valid: boolean;
  /** Whether the input could be evaluated at all (e.g. masked numbers cannot). */
  evaluable: boolean;
  reasons: string[];
}

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export function checkAadhaarFormat(value: string): FormatResult {
  if (/[xX*•]/.test(value)) {
    return { valid: true, evaluable: false, reasons: ["The number is masked, so only the visible digits can be read — the checksum cannot be evaluated."] };
  }
  const d = digitsOnly(value);
  const reasons: string[] = [];
  if (d.length !== 12) reasons.push(`Expected 12 digits, found ${d.length}.`);
  else {
    if (/^[01]/.test(d)) reasons.push("Aadhaar numbers do not start with 0 or 1.");
    if (!verhoeffValid(d)) reasons.push("The final checksum digit does not match the other digits (Verhoeff check) — likely a misread or typo.");
  }
  return { valid: reasons.length === 0, evaluable: true, reasons };
}

export const PAN_HOLDER_TYPES: Record<string, string> = {
  P: "Individual",
  C: "Company",
  H: "Hindu Undivided Family",
  F: "Firm",
  A: "Association of Persons",
  T: "Trust",
  B: "Body of Individuals",
  L: "Local Authority",
  J: "Artificial Juridical Person",
  G: "Government",
};

export function checkPanFormat(value: string): FormatResult & { holderType?: string } {
  const v = value.replace(/\s/g, "").toUpperCase();
  const reasons: string[] = [];
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v)) {
    reasons.push("PAN should be 10 characters: 5 letters, 4 digits, 1 letter (e.g. ABCPE1234F).");
    return { valid: false, evaluable: true, reasons };
  }
  const holderType = PAN_HOLDER_TYPES[v[3]];
  if (!holderType) reasons.push(`The 4th character "${v[3]}" is not a recognised holder-type code.`);
  else if (v[3] !== "P") reasons.push(`The 4th character "${v[3]}" indicates a ${holderType} PAN, not an individual's PAN.`);
  return { valid: reasons.length === 0, evaluable: true, reasons, holderType };
}

export function checkIfscFormat(value: string): FormatResult {
  const v = value.replace(/\s/g, "").toUpperCase();
  const reasons: string[] = [];
  if (v.length !== 11) reasons.push(`IFSC should be 11 characters, found ${v.length}.`);
  else {
    if (!/^[A-Z]{4}/.test(v)) reasons.push("The first 4 characters (bank code) should be letters.");
    if (v[4] !== "0") reasons.push(`The 5th character should be zero (0), found "${v[4]}". A letter 'O' here is a common typo.`);
    if (!/^[A-Z0-9]{6}$/.test(v.slice(5))) reasons.push("The last 6 characters (branch code) should be letters or digits.");
  }
  return { valid: reasons.length === 0, evaluable: true, reasons };
}

// ---------------------------------------------------------------------------
// Dates

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

export interface ParsedDate {
  y: number;
  m?: number;
  d?: number;
  precision: "day" | "year";
}

/** Parses common Indian date formats. Ambiguous numeric dates are read as DD/MM/YYYY. */
export function parseDate(input: string | undefined): ParsedDate | null {
  if (!input) return null;
  const s = input.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return mk(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{4})$/);
  if (m) return mk(+m[3], +m[2], +m[1]);
  m = s.match(/^(\d{1,2})[\s\-]([A-Za-z]{3,9})[\s\-,]+(\d{4})$/);
  if (m && MONTHS[m[2].slice(0, 3).toLowerCase()]) return mk(+m[3], MONTHS[m[2].slice(0, 3).toLowerCase()], +m[1]);
  m = s.match(/^(\d{4})$/);
  if (m) return { y: +m[1], precision: "year" };
  return null;
}

function mk(y: number, mo: number, d: number): ParsedDate | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCMonth() !== mo - 1) return null;
  return { y, m: mo, d, precision: "day" };
}

export function toISO(p: ParsedDate): string {
  if (p.precision === "year") return String(p.y);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

export function formatDate(p: ParsedDate | null): string {
  if (!p) return "—";
  if (p.precision === "year") return `${p.y} (year only)`;
  return `${String(p.d).padStart(2, "0")}-${String(p.m).padStart(2, "0")}-${p.y}`;
}

export function toDate(p: ParsedDate): Date {
  return new Date(Date.UTC(p.y, (p.m ?? 1) - 1, p.d ?? 1));
}

/** Whole months between two dates (b - a). */
export function monthsBetween(a: Date, b: Date): number {
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) months--;
  return months;
}

export function ageOn(dob: ParsedDate, on: Date): number {
  return Math.floor(monthsBetween(toDate(dob), on) / 12);
}

// ---------------------------------------------------------------------------
// Amounts

/** Parses "₹ 4,20,000", "Rs. 420000/-", "4.2 lakh". */
export function parseAmount(input: string | undefined): number | null {
  if (!input) return null;
  const s = input.toLowerCase().replace(/[₹,\s]|rs\.?|inr|\/-/g, "");
  const lakh = s.match(/^([\d.]+)(lakh|lac|l)$/);
  if (lakh) return Math.round(parseFloat(lakh[1]) * 100000);
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

// ---------------------------------------------------------------------------
// Masking — applied whenever identifiers are displayed or exported.

export function maskIdentifier(key: string, value: string): string {
  if (!value) return value;
  const d = value.replace(/\s/g, "");
  switch (key) {
    case "aadhaar_number":
      return d.length >= 4 ? `XXXX XXXX ${d.slice(-4)}` : value;
    case "account_number":
      return d.length > 4 ? `${"X".repeat(Math.max(0, d.length - 4))}${d.slice(-4)}` : value;
    case "pan_number":
      return d.length === 10 ? `${d.slice(0, 2)}XXXXX${d.slice(-3)}` : value;
    case "uan":
    case "member_id":
      return d.length > 4 ? `${"X".repeat(d.length - 4)}${d.slice(-4)}` : value;
    default:
      return value;
  }
}
