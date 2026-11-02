import type { ApplicationVariant, DocumentRecord, Finding, FindingResolution, FindingStatus, RuleDef, ValidationRun } from "./types";
import { buildProfile } from "./profile";
import { runCheck, type CheckContext } from "./checks";
import { getRule } from "@/knowledge/rules";

export const STAGES = [
  { id: "quality", label: "Document quality analysis", categories: ["quality"] },
  { id: "extraction", label: "Information extraction review", categories: ["completeness"] },
  { id: "consistency", label: "Cross-document comparison", categories: ["consistency"] },
  { id: "identity", label: "Identity consistency checks", categories: ["identity"] },
  { id: "rules", label: "Application rule validation", categories: ["format", "eligibility"] },
  { id: "external", label: "Compiling findings & external checks", categories: ["external"] },
] as const;

export interface RunInput {
  variant: ApplicationVariant;
  documents: DocumentRecord[];
  draft: Record<string, string>;
  now?: Date;
}

export function rulesFor(variant: ApplicationVariant): RuleDef[] {
  return variant.ruleIds.map((id) => getRule(id)).filter((r): r is RuleDef => !!r && r.active);
}

/** Runs one stage. Exposed separately so the UI can show real per-stage progress. */
export function runStage(stageId: string, input: RunInput): { findings: Finding[]; ms: number } {
  const t0 = performance.now();
  const stage = STAGES.find((s) => s.id === stageId)!;
  const ctx: CheckContext = {
    now: input.now ?? new Date(),
    variant: input.variant,
    documents: input.documents.filter((d) => d.status !== "failed"),
    draft: input.draft,
    profile: buildProfile(input.documents, input.draft, input.variant),
  };
  const findings = rulesFor(input.variant)
    .filter((r) => (stage.categories as readonly string[]).includes(r.category))
    .flatMap((r) => runCheck(r, ctx));
  return { findings, ms: performance.now() - t0 };
}

export function runValidation(input: RunInput): ValidationRun {
  const stages: ValidationRun["stages"] = [];
  const findings: Finding[] = [];
  for (const s of STAGES) {
    const res = runStage(s.id, input);
    stages.push({ id: s.id, label: s.label, ms: res.ms, count: res.findings.length });
    findings.push(...res.findings);
  }
  return {
    id: `run-${Date.now().toString(36)}`,
    at: (input.now ?? new Date()).toISOString(),
    findings: sortFindings(findings),
    stages,
    ruleVersions: rulesFor(input.variant)[0]?.version ?? "",
  };
}

const STATUS_ORDER: Record<FindingStatus, number> = { action: 0, review: 1, external: 2, passed: 3 };
const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export function sortFindings(f: Finding[]): Finding[] {
  return [...f].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
}

export function isOpenIssue(f: Finding) {
  return f.status === "action" || f.status === "review";
}

/**
 * Carries resolution state across runs. An issue that disappears (or now passes)
 * after a re-check is marked "resolved" with an audit event.
 */
export function reconcile(
  prev: Record<string, FindingResolution>,
  prevRun: ValidationRun | undefined,
  run: ValidationRun,
): Record<string, FindingResolution> {
  const next: Record<string, FindingResolution> = { ...prev };
  const nowKeys = new Map(run.findings.map((f) => [f.key, f]));
  for (const f of run.findings) {
    if (!isOpenIssue(f)) continue;
    const existing = next[f.key];
    if (!existing) {
      next[f.key] = { state: "open", history: [{ at: run.at, state: "open", note: "Detected", runId: run.id }] };
    } else if (existing.state === "resolved") {
      next[f.key] = { state: "open", history: [...existing.history, { at: run.at, state: "open", note: "Detected again after re-check", runId: run.id }] };
    }
  }
  for (const old of prevRun?.findings ?? []) {
    if (!isOpenIssue(old)) continue;
    const now = nowKeys.get(old.key);
    if (now && isOpenIssue(now)) continue;
    const existing = next[old.key];
    if (existing && existing.state !== "resolved") {
      next[old.key] = {
        state: "resolved",
        history: [...existing.history, { at: run.at, state: "resolved", note: now ? "Check passed after re-check" : "No longer detected after re-check", runId: run.id }],
      };
    }
  }
  return next;
}
