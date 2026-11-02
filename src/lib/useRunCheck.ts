"use client";

import { useState } from "react";
import type { Finding, ValidationRun } from "@/engine/types";
import { STAGES, runStage, rulesFor, sortFindings } from "@/engine/run";
import { useSession } from "@/lib/store/session";
import { getVariant } from "@/knowledge/applications";
import type { Session } from "@/lib/store/session";

/** Changes whenever a document, a corrected value or the user's details change. */
export function inputSignature(s: Session): string {
  const docs = s.documents
    .filter((d) => d.status !== "processing")
    .map((d) => `${d.id}.${d.version}.${d.typeId}.${d.status}:${d.fields.map((f) => `${f.key}=${f.value}`).join(",")}`);
  return JSON.stringify([docs, s.draft]);
}

export type StageState = { status: "idle" | "running" | "done"; ms?: number; count?: number };

// Yield so each stage paints. setTimeout (not rAF) keeps working in background tabs.
const nextFrame = () => new Promise<void>((r) => setTimeout(r, 0));

/** Runs the readiness check stage by stage (real work, no artificial delays) and records the run. */
export function useRunCheck() {
  const recordRun = useSession((s) => s.recordRun);
  const [stages, setStages] = useState<Record<string, StageState>>({});
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<ValidationRun>();

  async function run(): Promise<ValidationRun | undefined> {
    const session = useSession.getState().session;
    const variant = session ? getVariant(session.appId, session.variantId) : undefined;
    if (!session || !variant) return;
    setRunning(true);
    setLastRun(undefined);
    setStages(Object.fromEntries(STAGES.map((s) => [s.id, { status: "idle" }])));
    const input = { variant, documents: session.documents, draft: session.draft };
    const all: Finding[] = [];
    const timings: ValidationRun["stages"] = [];
    for (const s of STAGES) {
      setStages((st) => ({ ...st, [s.id]: { status: "running" } }));
      await nextFrame();
      const res = runStage(s.id, input);
      all.push(...res.findings);
      timings.push({ id: s.id, label: s.label, ms: res.ms, count: res.findings.length });
      setStages((st) => ({ ...st, [s.id]: { status: "done", ms: res.ms, count: res.findings.length } }));
    }
    const result: ValidationRun = {
      id: `run-${Date.now().toString(36)}`,
      at: new Date().toISOString(),
      findings: sortFindings(all),
      stages: timings,
      ruleVersions: rulesFor(variant)[0]?.version ?? "",
      inputSig: inputSignature(session),
    };
    recordRun(result);
    setLastRun(result);
    setRunning(false);
    return result;
  }

  return { run, running, stages, lastRun };
}
