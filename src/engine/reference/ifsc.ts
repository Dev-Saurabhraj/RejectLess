// IFSC reference snapshot.
//
// LIMITATION (shown in the UI): this bundled snapshot contains only the FICTIONAL banks
// used by the demo sandbox. A production build would bundle a dated extract of the RBI
// IFSC list (or the open Razorpay IFSC dataset derived from it). A code that is not in
// the snapshot is reported as "could not be checked", never as "invalid".

export interface IfscEntry {
  ifsc: string;
  bank: string;
  branch: string;
  city: string;
  state: string;
  status: "active" | "merged";
  mergedInto?: string;
  note?: string;
}

export const IFSC_SNAPSHOT = {
  id: "demo-ifsc-snapshot",
  label: "RejectLess demo IFSC snapshot (fictional banks only)",
  asOf: "2026-10-15",
  fictional: true,
  entries: [
    { ifsc: "BDBK0001234", bank: "Bharat Demo Bank", branch: "Kankarbagh", city: "Patna", state: "Bihar", status: "active" },
    { ifsc: "BDBK0004521", bank: "Bharat Demo Bank", branch: "Hazratganj", city: "Lucknow", state: "Uttar Pradesh", status: "active" },
    { ifsc: "BDBK0000777", bank: "Bharat Demo Bank", branch: "Civil Lines", city: "Jaipur", state: "Rajasthan", status: "active" },
    { ifsc: "JSBX0002210", bank: "Janata Sample Bank", branch: "Sector 17", city: "Chandigarh", state: "Chandigarh", status: "active" },
    { ifsc: "JSBX0000915", bank: "Janata Sample Bank", branch: "MP Nagar", city: "Bhopal", state: "Madhya Pradesh", status: "active" },
    {
      ifsc: "UDCB0000318",
      bank: "Udaya Demo Co-operative Bank",
      branch: "Ashok Rajpath",
      city: "Patna",
      state: "Bihar",
      status: "merged",
      mergedInto: "BDBK0001234",
      note: "Fictional merger used in the demo: branch codes of the merged bank were replaced.",
    },
  ] satisfies IfscEntry[],
};

export function lookupIfsc(code: string): IfscEntry | undefined {
  const c = code.replace(/\s/g, "").toUpperCase();
  return IFSC_SNAPSHOT.entries.find((e) => e.ifsc === c);
}

export function bankCodeKnown(code: string): string | undefined {
  const prefix = code.replace(/\s/g, "").toUpperCase().slice(0, 4);
  return IFSC_SNAPSHOT.entries.find((e) => e.ifsc.startsWith(prefix))?.bank;
}
