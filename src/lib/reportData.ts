import type { Finding, FindingResolution, RuleBasis } from "@/engine/types";
import type { Session } from "@/lib/store/session";

export const DISCLAIMER =
  "This report reflects checks performed by RejectLess using the information and rules available at the time of validation. It is not an official government approval, eligibility certificate or guarantee of application acceptance.";

export const LIMITATIONS = [
  "RejectLess has no access to EPFO, NSP, UIDAI, the Income Tax Department or any bank. Items under 'external verification' were not checked.",
  "Format checks (Aadhaar checksum, PAN and IFSC structure) do not prove that a number is genuine, active or belongs to you.",
  "Name comparisons explain spelling and script variations; a match is not proof of identity and a variation is not proof of a different person.",
  "Text recognition can misread scans. Values you corrected or confirmed are marked as such.",
  "Rules marked 'Verify' rely on reputable secondary reporting because the official text could not be retrieved. Rules marked 'Demo rule' are illustrative.",
  "The IFSC reference used in this build is a dated demonstration snapshot covering fictional banks only.",
];

export const BASIS_LABEL: Record<RuleBasis, string> = {
  official: "official source",
  secondary: "verify — secondary source",
  engine: "RejectLess check",
  demo: "demo rule",
};

export function resolvedIssues(session: Session): { finding: Finding; resolution: FindingResolution }[] {
  const out: { finding: Finding; resolution: FindingResolution }[] = [];
  for (const [key, resolution] of Object.entries(session.resolutions)) {
    if (resolution.state !== "resolved") continue;
    for (let i = session.runs.length - 1; i >= 0; i--) {
      const f = session.runs[i].findings.find((x) => x.key === key && (x.status === "action" || x.status === "review"));
      if (f) {
        out.push({ finding: f, resolution });
        break;
      }
    }
  }
  return out;
}
