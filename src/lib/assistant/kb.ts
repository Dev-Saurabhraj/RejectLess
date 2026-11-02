import { RULES } from "@/knowledge/rules";
import { APPLICATIONS } from "@/knowledge/applications";
import { SOURCES } from "@/knowledge/sources";

// The assistant's knowledge base: every chunk is either derived from the rule pack
// or a curated guidance note with its own source. The model may only answer from these.

export interface KbChunk {
  id: string;
  title: string;
  text: string;
  sourceIds: string[];
  /** "verify" = depends on secondary reporting; the answer must say so. */
  confidence: "official" | "verify" | "general";
  appIds?: string[];
}

const GUIDES: KbChunk[] = [
  {
    id: "G-UAN-PROFILE",
    title: "Correcting name, date of birth or gender in your UAN profile",
    text:
      "Log in to the EPFO member portal and look for the option to modify basic details (Manage → Modify Basic Details). Enter the details exactly as in Aadhaar and attach the supporting document asked for. Reports say that since January 2025, members whose UAN is linked to a verified Aadhaar can make some corrections without employer approval; others need their employer to approve, or a joint declaration signed by the member and employer. Check the options shown on the portal for your account.",
    sourceIds: ["epfo-member-portal"],
    confidence: "verify",
    appIds: ["epfo-withdrawal"],
  },
  {
    id: "G-BANK-NAME",
    title: "Correcting your name in bank records",
    text:
      "Visit your home branch with your Aadhaar and PAN (originals and copies) and ask for a KYC / name correction. Ask for a reprint of the passbook first page after the correction. Some banks allow this through net banking or video KYC. Use the spelling that matches your Aadhaar and your UAN profile.",
    sourceIds: ["rejectless-method"],
    confidence: "general",
  },
  {
    id: "G-AADHAAR-UPDATE",
    title: "Updating details in Aadhaar",
    text:
      "Demographic details in Aadhaar are updated through UIDAI's official channels: the myAadhaar portal for some updates, or an Aadhaar enrolment / update centre with supporting documents. UIDAI limits how many times name, date of birth and gender can be changed. Correct Aadhaar only if Aadhaar itself is wrong — otherwise correct the other record to match Aadhaar.",
    sourceIds: ["uidai"],
    confidence: "official",
  },
  {
    id: "G-PAN-CORRECTION",
    title: "Correcting details in PAN",
    text:
      "PAN details are corrected through the 'Changes or Correction in PAN Data' service offered via the Income Tax Department's authorised agencies (Protean / UTIITSL). After the correction is processed, a fresh e-PAN can be downloaded. Corrections usually need proof of identity and date of birth, such as Aadhaar.",
    sourceIds: ["pan-services"],
    confidence: "official",
  },
  {
    id: "G-UAN-BANK",
    title: "Linking (seeding) a bank account to your UAN",
    text:
      "In the EPFO member portal, use the KYC section to add or change the bank account number and IFSC. Reports from April 2025 say the change is authenticated with an Aadhaar OTP and no longer needs employer approval, and that cancelled cheque or passbook images are no longer uploaded for online claims. The account must be in your own name.",
    sourceIds: ["bs-cheque-2025", "theprint-cheque-2025", "epfo-member-portal"],
    confidence: "verify",
    appIds: ["epfo-withdrawal"],
  },
  {
    id: "G-DOE",
    title: "When your date of exit is missing",
    text:
      "Final settlement and pension withdrawal claims depend on a date of exit in EPFO's records. Ask your former employer to update it through the employer portal. The member portal may also offer an option to mark the date of exit yourself in some cases — check the options shown for your account.",
    sourceIds: ["epfo-member-portal"],
    confidence: "verify",
    appIds: ["epfo-withdrawal"],
  },
  {
    id: "G-TDS",
    title: "Tax deducted at source (TDS) on EPF withdrawals",
    text:
      "Secondary sources report that TDS applies when continuous service is under 5 years and the amount is ₹50,000 or more. The reported rate is 10% when PAN is available and 20% without PAN (since 1 April 2023). If your total income is below the taxable limit, you may submit a declaration so TDS is not deducted: Forms 15G / 15H earlier, and Form 121 from 1 April 2026 under the Income-tax Act, 2025. Confirm the current form on the Income Tax Department's portal.",
    sourceIds: ["tds-192a-summary", "incometax-portal"],
    confidence: "verify",
    appIds: ["epfo-withdrawal"],
  },
  {
    id: "G-EPF-2026",
    title: "What changed with the EPF Scheme, 2026",
    text:
      "The Employees' Provident Funds Scheme, 2026 (G.S.R. 525(E), 29 June 2026) replaced the 1952 scheme. Reported changes: full final settlement after leaving a job needs 12 continuous months without EPF-covered employment (earlier 2 months); partial withdrawals need 12 months of membership and are grouped into essential needs, housing and special circumstances; at least 25% of the balance must stay in the account; final pension withdrawal reportedly needs 36 months after exit. RejectLess could not retrieve the gazette text itself, so these rules are marked 'Verify'.",
    sourceIds: ["egazette", "bs-epf-2026", "taxguru-epf-2026", "tribune-cbt-2025"],
    confidence: "verify",
    appIds: ["epfo-withdrawal"],
  },
  {
    id: "G-NAME-VARIANTS",
    title: "Why Indian names are spelt differently across records",
    text:
      "Names written in Indian scripts can be romanised in several ways: 'au' and 'ou' (Saurabh / Sourabh), 'ee' and 'i' (Suneel / Sunil), 'v' and 'w', 'sh' and 's', or a doubled letter. Records made by different offices often use different spellings. A spelling variant is not proof of a different person, but official systems often compare names strictly, so it is safest to make the records match.",
    sourceIds: ["rejectless-method"],
    confidence: "general",
  },
  {
    id: "G-EXTERNAL",
    title: "What 'External verification' means",
    text:
      "Some conditions depend on records that only the official system holds — for example whether your Aadhaar is verified in your UAN, whether your bank account is seeded, or a board's percentile cut-off. RejectLess has no access to these systems and never claims to have verified them. Check them yourself on the official portal or with the relevant office.",
    sourceIds: ["epfo-member-portal", "nsp-portal"],
    confidence: "general",
  },
  {
    id: "G-NSP-DBT",
    title: "Scholarship payments, Aadhaar seeding and your bank account",
    text:
      "Central scholarships on NSP are paid by direct benefit transfer. The bank account should be in the student's own name and linked (seeded) with Aadhaar for DBT — ask your bank to seed Aadhaar to the account. Your institute verifies your application on NSP before it moves forward.",
    sourceIds: ["nsp-portal", "csss-summary"],
    confidence: "verify",
    appIds: ["nsp-csss"],
  },
  {
    id: "G-INCOME-CERT",
    title: "Getting a fresh income certificate",
    text:
      "Income certificates are issued by state authorities, usually through the state's e-district or service portal or a Common Service Centre. Validity rules differ by state. Make sure the certificate shows total family income from all sources and the same parent's name as your school records.",
    sourceIds: ["rejectless-method"],
    confidence: "general",
    appIds: ["nsp-csss"],
  },
  {
    id: "G-PRIVACY",
    title: "What the AI assistant can see",
    text:
      "When AI answers are turned on, RejectLess sends your question (with numbers and known names removed), the application type, short privacy-safe summaries of findings and the relevant knowledge-base passages. It never sends documents, images, names, dates of birth or identifiers. Without AI, answers are assembled from the knowledge base on your device.",
    sourceIds: ["rejectless-method"],
    confidence: "general",
  },
];

function ruleChunks(): KbChunk[] {
  return RULES.filter((r) => r.check !== "info_note").map((r) => ({
    id: `R-${r.id}`,
    title: r.title,
    text: `${r.description} Why it matters: ${r.whyItMatters} What to do: ${r.recommendation}${r.basis === "demo" ? " (This is a demonstration rule, not an official requirement.)" : ""}`,
    sourceIds: r.sourceIds,
    confidence: r.basis === "official" ? "official" : r.basis === "secondary" ? "verify" : "general",
  }));
}

function appChunks(): KbChunk[] {
  return APPLICATIONS.filter((a) => a.status === "available").flatMap((a) =>
    a.variants.map((v) => ({
      id: `A-${a.id}-${v.id}`,
      title: `${a.name}: ${v.name} (${v.formName})`,
      text: `${v.summary} Who it is for: ${v.whoFor} Conditions: ${v.conditions.join(" ")} Documents: ${v.documents.map((d) => `${d.docType.replace(/_/g, " ")} (${d.need}) — ${d.why}`).join(" ")}`,
      sourceIds: a.sourceIds,
      confidence: "verify" as const,
      appIds: [a.id],
    })),
  );
}

export const KB: KbChunk[] = [...GUIDES, ...ruleChunks(), ...appChunks()];

export function chunkSources(c: KbChunk) {
  return c.sourceIds.map((id) => SOURCES.find((s) => s.id === id)).filter(Boolean);
}
