"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { CheckCircle2, ChevronDown, CircleHelp, Download, ExternalLink, Globe2, MessageCircleQuestion, Pencil, RotateCw, TriangleAlert, Upload } from "lucide-react";
import type { Finding } from "@/engine/types";
import { isOpenIssue } from "@/engine/run";
import { Button, Spinner } from "@/components/ui";
import { FindingDetail } from "@/components/workspace/FindingDetail";
import { ActionBar } from "./common";
import { useActiveSession } from "@/lib/hooks";
import { useSession } from "@/lib/store/session";
import { useUi } from "@/lib/store/ui";
import { addFiles } from "@/lib/actions";
import { ACCEPTED } from "@/lib/ingest/pipeline";
import { resolvedIssues } from "@/lib/reportData";
import { DOC_TYPES } from "@/knowledge/documents";
import { DRAFT_LABEL } from "@/engine/profile";
import { inputSignature } from "@/lib/useRunCheck";

export function ResultsStep() {
  const { session, app, latestRun } = useActiveSession();
  const setGuideStep = useSession((s) => s.setGuideStep);
  const [busy, setBusy] = useState(false);
  if (!session || !app || !latestRun) return null;

  const issues = latestRun.findings.filter(isOpenIssue);
  const action = issues.filter((f) => f.status === "action");
  const external = latestRun.findings.filter((f) => f.status === "external");
  const passed = latestRun.findings.filter((f) => f.status === "passed");
  const fixed = resolvedIssues(session);
  const changedSinceRun = !!latestRun.inputSig && latestRun.inputSig !== inputSignature(session);

  async function download() {
    setBusy(true);
    try {
      const { downloadReport } = await import("@/lib/report");
      await downloadReport(useSession.getState().session!);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-7">
        {issues.length ? (
          <>
            <p className="mb-2 text-[13px] font-medium text-accent">Your results</p>
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">
              {issues.length} thing{issues.length > 1 ? "s" : ""} to look at before you apply
            </h1>
            <p className="mt-2 text-[16px] text-ink-2">
              {action.length ? `${action.length} need${action.length === 1 ? "s" : ""} fixing. ` : ""}Start from the top — each one says what to do.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="mb-3 size-10 text-pass" />
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">Everything we could check looks right</h1>
            <p className="mt-2 text-[16px] text-ink-2">
              Before you apply, confirm the {external.reduce((n, f) => n + Math.max(1, f.signals.length), 0)} items below on the official portal. This isn&rsquo;t an approval — only {app.shortName} can approve your application.
            </p>
          </>
        )}
      </div>

      {changedSinceRun && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent-soft/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px]">You changed something since this check. Check again to see if it&rsquo;s fixed.</p>
          <Button onClick={() => setGuideStep("check")}>
            <RotateCw className="size-4" /> Check again
          </Button>
        </div>
      )}

      <ul className="space-y-3">
        {issues.map((f, i) => (
          <IssueCard key={f.key} f={f} index={i} />
        ))}
      </ul>

      {fixed.length > 0 && (
        <Section icon={<CheckCircle2 className="size-4 text-pass" />} title={`Fixed (${fixed.length})`} defaultOpen>
          <ul className="space-y-1.5">
            {fixed.map(({ finding }) => (
              <li key={finding.key} className="flex items-center gap-2 text-[15px]">
                <CheckCircle2 className="size-4 text-pass" /> {finding.title}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section icon={<Globe2 className="size-4 text-external" />} title="Confirm on the official portal" defaultOpen={!issues.length}>
        <ul className="space-y-2 text-[15px] text-ink-2">
          {external.flatMap((f) => (f.signals.length ? f.signals : [f.summary])).map((s) => (
            <li key={s} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-external" /> {s}
            </li>
          ))}
        </ul>
        {app.officialPortal && (
          <a href={app.officialPortal} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-[14px] font-medium text-accent hover:underline">
            Open the official portal <ExternalLink className="size-3.5" />
          </a>
        )}
      </Section>

      <Section icon={<CheckCircle2 className="size-4 text-pass" />} title={`Checks passed (${passed.length})`}>
        <ul className="space-y-1.5 text-[14px] text-ink-2">
          {passed.map((f) => (
            <li key={f.key}>
              <span className="text-ink">{f.title}</span> — {f.summary}
            </li>
          ))}
        </ul>
      </Section>

      <ActionBar>
        <Button size="lg" variant="ghost" onClick={() => setGuideStep("check")}>
          <RotateCw className="size-4" /> Check again
        </Button>
        <Button size="lg" variant={issues.length ? "secondary" : "primary"} onClick={download} disabled={busy}>
          {busy ? <Spinner /> : <Download className="size-4" />} Download report
        </Button>
      </ActionBar>
    </div>
  );
}

function Section({ icon, title, children, defaultOpen = false }: { icon: React.ReactNode; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mt-4 rounded-2xl border border-line bg-surface">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-5 py-4 text-left" aria-expanded={open}>
        {icon}
        <span className="flex-1 font-medium">{title}</span>
        <ChevronDown className={clsx("size-4 text-ink-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="rise px-5 pb-5">{children}</div>}
    </section>
  );
}

/** The most useful next action for a finding, in the user's terms. */
function primaryAction(f: Finding) {
  if (f.ruleId === "GEN-DOCS") return { kind: "add" as const };
  // The engine already knows when the typed details are the odd one out.
  if (f.abstract.includes("application draft is the odd one out")) return { kind: "details" as const };
  // Eligibility results (waiting periods, TDS, limits) are facts to act on, not document errors.
  if (!["consistency", "identity", "quality", "format", "completeness"].includes(f.category)) return undefined;
  const first = f.observations[0];
  const differing = f.observations.find((o) => o.value !== first?.value);
  if (differing && differing.docLabel === DRAFT_LABEL) return { kind: "details" as const };
  const target = (differing?.docId ? differing : f.observations.find((o) => o.docId)) ?? undefined;
  if (target?.docId) return { kind: "replace" as const, docId: target.docId, label: target.docLabel };
  if (f.observations.some((o) => o.docLabel === DRAFT_LABEL)) return { kind: "details" as const };
  return undefined;
}

function IssueCard({ f, index }: { f: Finding; index: number }) {
  const { session } = useActiveSession();
  const setGuideStep = useSession((s) => s.setGuideStep);
  const unskipDoc = useSession((s) => s.unskipDoc);
  const setResolution = useSession((s) => s.setResolution);
  const openAssistant = useUi((s) => s.openAssistant);
  const [why, setWhy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const res = session?.resolutions[f.key];
  const act = primaryAction(f);
  const replacing = act?.kind === "replace" ? session?.documents.find((d) => d.id === act.docId) : undefined;
  const isAction = f.status === "action";

  return (
    <li className="rise rounded-2xl border border-line bg-surface p-5" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex items-start gap-3">
        {isAction ? <TriangleAlert className="mt-1 size-5 shrink-0 text-action" /> : <CircleHelp className="mt-1 size-5 shrink-0 text-review" />}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium uppercase tracking-wide text-ink-3">{isAction ? "Needs fixing" : "Worth checking"}</p>
          <h2 className="mt-0.5 text-[18px] font-semibold leading-snug">{f.title}</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{f.summary}</p>
          <p className="mt-3 rounded-xl bg-surface-2 px-4 py-3 text-[15px] leading-relaxed">
            <span className="font-medium">What to do: </span>
            {f.recommendation}
          </p>
          {res?.state === "confirmed_correct" && <p className="mt-2 text-[13px] text-pass">You confirmed this is fine.</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {act?.kind === "replace" && (
              <>
                <Button onClick={() => input.current?.click()} disabled={replacing?.status === "processing"}>
                  {replacing?.status === "processing" ? <Spinner /> : <Upload className="size-4" />} Upload corrected {act.label}
                </Button>
                <input
                  ref={input}
                  type="file"
                  accept={ACCEPTED.join(",")}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) addFiles(Array.from(e.target.files), { replaceId: act.docId });
                    e.target.value = "";
                  }}
                />
              </>
            )}
            {act?.kind === "details" && (
              <Button onClick={() => setGuideStep("details")}>
                <Pencil className="size-4" /> Edit my details
              </Button>
            )}
            {act?.kind === "add" && (
              <Button
                onClick={() => {
                  const t = f.key.split(":")[1] as keyof typeof DOC_TYPES | undefined;
                  if (t && DOC_TYPES[t]) unskipDoc(t);
                  setGuideStep("documents");
                }}
              >
                <Upload className="size-4" /> Add it now
              </Button>
            )}
            <Button variant="secondary" onClick={() => openAssistant(f.key)}>
              <MessageCircleQuestion className="size-4" /> Explain this
            </Button>
            <Button variant="ghost" onClick={() => setWhy(!why)} aria-expanded={why}>
              {why ? "Hide evidence" : "Show evidence"}
            </Button>
            {!isAction && res?.state !== "confirmed_correct" && (
              <Button variant="ghost" onClick={() => setResolution(f.key, "confirmed_correct", "You confirmed the values are correct as they are.")}>
                It&rsquo;s fine
              </Button>
            )}
          </div>
        </div>
      </div>
      {why && (
        <div className="rise mt-5 border-t border-line pt-5">
          <FindingDetail finding={f} resolution={res} />
        </div>
      )}
    </li>
  );
}
