import type { ApplicationDef, DraftFieldDef } from "@/engine/types";

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: "briefcase" | "graduation" | "wheat" | "badge" | "landmark";
}

export const CATEGORIES: Category[] = [
  { id: "employment", name: "Employment & PF", description: "Provident fund withdrawals, pension and settlements.", icon: "briefcase" },
  { id: "education", name: "Scholarships & Education", description: "Central and state scholarships for students.", icon: "graduation" },
  { id: "farmer", name: "Farmer Benefits", description: "Income support and crop-related schemes.", icon: "wheat" },
  { id: "certificates", name: "Certificates & Identity", description: "Income, caste and domicile certificates.", icon: "badge" },
  { id: "other", name: "Other services", description: "Pensions, welfare and social-security schemes.", icon: "landmark" },
];

const yesNo = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const EPF_COMMON: DraftFieldDef[] = [
  { key: "name", label: "Your name as you will enter it", type: "text", maps: "name", help: "Usually exactly as in your Aadhaar." },
  { key: "dob", label: "Date of birth", type: "date", maps: "dob" },
  { key: "father_name", label: "Father's / husband's name", type: "text", maps: "father_name" },
  { key: "doe", label: "Last working day (date of exit)", type: "date", maps: "doe", help: "As recorded by your last employer, if you know it." },
  { key: "account_number", label: "Bank account number", type: "text", maps: "account_number", sensitive: true },
  { key: "ifsc", label: "IFSC", type: "text", maps: "ifsc" },
  {
    key: "pan_linked",
    label: "Is your PAN linked to your UAN?",
    type: "select",
    options: [...yesNo, { value: "unsure", label: "Not sure" }],
  },
];

export const APPLICATIONS: ApplicationDef[] = [
  {
    id: "epfo-withdrawal",
    categoryId: "employment",
    name: "EPF withdrawal & settlement",
    shortName: "EPFO",
    authority: "Employees' Provident Fund Organisation (EPFO)",
    description:
      "Prepare an online claim to withdraw your provident fund or pension contributions. RejectLess checks your documents and the details you plan to enter before you file on the EPFO member portal.",
    audience: "Salaried employees and former employees with a UAN",
    status: "available",
    officialPortal: "https://unifiedportal-mem.epfindia.gov.in/memberinterface/",
    rulePackVersion: "2026.11.1",
    lastReviewed: "2026-11-02",
    notices: [
      "Rules updated for the Employees' Provident Funds Scheme, 2026 (G.S.R. 525(E), 29 June 2026). Some conditions are taken from reputable reporting because the official text could not be retrieved — these are marked \"Verify\".",
      "Since April 2025, EPFO does not require a cheque or passbook image for online claims. RejectLess uses them only to check your bank details.",
    ],
    sourceIds: ["epfo-portal", "egazette", "bs-epf-2026"],
    variants: [
      {
        id: "final-settlement",
        name: "Final PF settlement",
        formName: "Form 19 (composite claim)",
        summary: "Withdraw your full PF balance after leaving employment.",
        whoFor: "Members who have retired, or who have been out of EPF-covered employment for 12 continuous months.",
        conditions: [
          "12 continuous months without EPF-covered employment after your date of exit (unless retired). Previously 2 months.",
          "TDS may apply if your service is under 5 years and the amount is ₹50,000 or more. PAN reduces the rate.",
          "Your Aadhaar, UAN profile and bank account must be linked and match.",
        ],
        documents: [
          { docType: "aadhaar", need: "required", why: "To compare your name, date of birth and gender with your UAN profile and bank records." },
          { docType: "epf_passbook", need: "required", why: "Gives your dates of joining and exit and your balance, which decide eligibility and TDS." },
          { docType: "bank_passbook", need: "required", why: "To check the account number, IFSC and account holder name you will enter. Not uploaded to EPFO." },
          { docType: "pan", need: "conditional", why: "Needed to avoid higher TDS when service is under 5 years and the amount is ₹50,000 or more.", condition: "tds" },
          { docType: "cancelled_cheque", need: "recommended", why: "An extra source to cross-check the account number and IFSC." },
        ],
        ruleIds: [
          "GEN-DOCS", "GEN-QUALITY", "GEN-KEYFIELDS", "EPF-NAME", "GEN-DOB-CONSISTENCY", "EPF-FATHER", "GEN-AADHAAR-FORMAT",
          "GEN-PAN-FORMAT", "GEN-PAN-SURNAME", "GEN-ACCOUNT-CONSISTENCY", "GEN-IFSC-CONSISTENCY", "GEN-IFSC-FORMAT", "GEN-IFSC-REFERENCE",
          "EPF-DOE-PRESENT", "EPF-DATE-ORDER", "EPF-FINAL-WAIT", "EPF-TDS-PAN", "EPF-BANK-NOTE", "EPF-EXTERNAL",
        ],
        draftFields: [...EPF_COMMON],
      },
      {
        id: "pension-withdrawal",
        name: "Pension withdrawal benefit",
        formName: "Form 10C",
        summary: "Withdraw your pension (EPS) contribution when you have less than 10 years of service.",
        whoFor: "Members with under 10 years of eligible service who have left covered employment.",
        conditions: [
          "Eligible service must be less than 10 years. With 10 years or more, you get a pension or scheme certificate instead.",
          "Reported waiting period after exit: 36 months (previously 2 months), unless you have reached 58.",
          "Sources disagree on whether a 6-month minimum service still applies.",
        ],
        documents: [
          { docType: "aadhaar", need: "required", why: "To compare your name and date of birth with your UAN profile." },
          { docType: "epf_passbook", need: "required", why: "Gives your service dates, which decide whether you can withdraw the pension amount." },
          { docType: "bank_passbook", need: "required", why: "To check the bank details you will enter." },
          { docType: "cancelled_cheque", need: "recommended", why: "An extra source to cross-check the account number and IFSC." },
        ],
        ruleIds: [
          "GEN-DOCS", "GEN-QUALITY", "GEN-KEYFIELDS", "EPF-NAME", "GEN-DOB-CONSISTENCY", "GEN-AADHAAR-FORMAT", "GEN-ACCOUNT-CONSISTENCY",
          "GEN-IFSC-CONSISTENCY", "GEN-IFSC-FORMAT", "GEN-IFSC-REFERENCE", "EPF-DOE-PRESENT", "EPF-DATE-ORDER", "EPF-10C-SERVICE",
          "EPF-10C-MIN", "EPF-10C-WAIT", "EPF-BANK-NOTE", "EPF-EXTERNAL",
        ],
        draftFields: EPF_COMMON.filter((f) => f.key !== "pan_linked"),
      },
      {
        id: "partial-withdrawal",
        name: "Partial withdrawal (advance)",
        formName: "Form 31",
        summary: "Withdraw part of your PF for illness, education, marriage, housing or special circumstances.",
        whoFor: "Members (including current employees) with at least 12 months of membership.",
        conditions: [
          "Reported minimum membership: 12 months for all purposes (previously 5–7 years for some).",
          "At least 25% of your balance must stay in the account.",
          "Minimum withdrawal reported as ₹1,000. Limits on how often you can withdraw for each purpose.",
        ],
        documents: [
          { docType: "aadhaar", need: "required", why: "To compare your name and date of birth with your UAN profile." },
          { docType: "epf_passbook", need: "required", why: "Gives your membership period and balance, which decide eligibility and the maximum amount." },
          { docType: "bank_passbook", need: "required", why: "To check the bank details you will enter." },
          { docType: "cancelled_cheque", need: "recommended", why: "An extra source to cross-check the account number and IFSC." },
        ],
        ruleIds: [
          "GEN-DOCS", "GEN-QUALITY", "GEN-KEYFIELDS", "EPF-NAME", "GEN-DOB-CONSISTENCY", "GEN-AADHAAR-FORMAT", "GEN-ACCOUNT-CONSISTENCY",
          "GEN-IFSC-CONSISTENCY", "GEN-IFSC-FORMAT", "GEN-IFSC-REFERENCE", "EPF-31-MEMBERSHIP", "EPF-31-AMOUNT", "EPF-31-PURPOSE",
          "EPF-BANK-NOTE", "EPF-EXTERNAL",
        ],
        draftFields: [
          ...EPF_COMMON.filter((f) => f.key !== "doe" && f.key !== "pan_linked"),
          {
            key: "purpose",
            label: "Purpose of withdrawal",
            type: "select",
            options: [
              { value: "essential", label: "Essential needs — illness, education, marriage" },
              { value: "housing", label: "Housing — purchase, construction, repayment" },
              { value: "special", label: "Special circumstances" },
            ],
          },
          { key: "amount", label: "Amount you want to withdraw (₹)", type: "number" },
        ],
      },
    ],
  },
  {
    id: "nsp-csss",
    categoryId: "education",
    name: "Central Sector Scholarship (PM-USP CSSS)",
    shortName: "NSP · CSSS",
    authority: "Ministry of Education, via the National Scholarship Portal",
    description:
      "Merit-cum-means scholarship for college and university students who scored above the 80th percentile in Class XII. RejectLess checks your certificates and bank details before you apply on NSP.",
    audience: "Students in regular undergraduate or postgraduate courses",
    status: "available",
    officialPortal: "https://scholarships.gov.in/",
    rulePackVersion: "2026.11.1",
    lastReviewed: "2026-11-02",
    notices: [
      "Eligibility conditions are taken from reputable summaries; check the current scheme guidelines on NSP. Conditions marked \"Verify\" have not been confirmed against the official text.",
    ],
    sourceIds: ["nsp-portal", "education-ministry", "csss-summary"],
    variants: [
      {
        id: "fresh",
        name: "Fresh application",
        formName: "NSP application (fresh)",
        summary: "First-year application after Class XII.",
        whoFor: "Students starting a regular UG course who scored above the 80th percentile of their board in Class XII.",
        conditions: [
          "Above the 80th percentile of successful candidates in your board and stream in Class XII.",
          "Annual family income below ₹4.5 lakh.",
          "Enrolled in a regular course (not distance or correspondence).",
          "Not receiving any other scholarship.",
          "Bank account in your own name, linked to Aadhaar for direct benefit transfer.",
        ],
        documents: [
          { docType: "aadhaar", need: "required", why: "To compare your name and date of birth with your other records." },
          { docType: "marksheet_12", need: "required", why: "Your Class XII marks are the basis of eligibility." },
          { docType: "income_certificate", need: "required", why: "Shows your family income is below the limit." },
          { docType: "bonafide_certificate", need: "required", why: "Shows you are enrolled in a regular course." },
          { docType: "bank_passbook", need: "required", why: "To check that the account is in your own name and the details are correct." },
        ],
        ruleIds: [
          "GEN-DOCS", "GEN-QUALITY", "GEN-KEYFIELDS", "NSP-NAME", "GEN-DOB-CONSISTENCY", "NSP-FATHER", "GEN-AADHAAR-FORMAT",
          "NSP-OWN-ACCOUNT", "GEN-ACCOUNT-CONSISTENCY", "GEN-IFSC-CONSISTENCY", "GEN-IFSC-FORMAT", "GEN-IFSC-REFERENCE",
          "NSP-INCOME", "NSP-INCOME-MATCH", "NSP-INCOME-RECENT", "NSP-REGULAR", "NSP-MARKS", "NSP-OTHER-SCHOLARSHIP", "NSP-EXTERNAL",
        ],
        draftFields: [
          { key: "name", label: "Student name as you will enter it", type: "text", maps: "name" },
          { key: "dob", label: "Date of birth", type: "date", maps: "dob" },
          { key: "father_name", label: "Father's / guardian's name", type: "text", maps: "father_name" },
          { key: "annual_income", label: "Annual family income (₹)", type: "number", maps: "annual_income" },
          { key: "account_number", label: "Bank account number", type: "text", maps: "account_number", sensitive: true },
          { key: "ifsc", label: "IFSC", type: "text", maps: "ifsc" },
          { key: "other_scholarship", label: "Are you receiving any other scholarship?", type: "select", options: yesNo },
        ],
      },
    ],
  },
  {
    id: "pm-kisan",
    categoryId: "farmer",
    name: "PM-KISAN registration",
    shortName: "PM-KISAN",
    authority: "Ministry of Agriculture & Farmers Welfare",
    description: "Income support for landholding farmer families.",
    audience: "Farmers",
    status: "coming_soon",
    rulePackVersion: "—",
    lastReviewed: "—",
    notices: [],
    sourceIds: [],
    variants: [],
  },
  {
    id: "income-certificate",
    categoryId: "certificates",
    name: "Income certificate application",
    shortName: "Income certificate",
    authority: "State revenue departments",
    description: "State-issued income certificates. Requirements differ by state.",
    audience: "Residents applying through e-district portals",
    status: "coming_soon",
    rulePackVersion: "—",
    lastReviewed: "—",
    notices: [],
    sourceIds: [],
    variants: [],
  },
  {
    id: "old-age-pension",
    categoryId: "other",
    name: "Old-age pension (NSAP)",
    shortName: "NSAP",
    authority: "Ministry of Rural Development",
    description: "Social assistance pensions for elderly citizens.",
    audience: "Senior citizens",
    status: "coming_soon",
    rulePackVersion: "—",
    lastReviewed: "—",
    notices: [],
    sourceIds: [],
    variants: [],
  },
];

export function getApplication(id: string) {
  return APPLICATIONS.find((a) => a.id === id);
}

export function getVariant(appId: string, variantId: string) {
  return getApplication(appId)?.variants.find((v) => v.id === variantId);
}
