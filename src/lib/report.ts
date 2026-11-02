"use client";

import type { Finding } from "@/engine/types";
import type { Session } from "@/lib/store/session";
import { getApplication } from "@/knowledge/applications";
import { DOC_TYPES, SENSITIVE_FIELDS } from "@/knowledge/documents";
import { maskIdentifier } from "@/engine/validators";
import type { FieldKey } from "@/engine/types";
import { getSource } from "@/knowledge/sources";
import { rulesFor } from "@/engine/run";
import { transliterate, hasDevanagari } from "@/engine/text/transliterate";
import { BASIS_LABEL, DISCLAIMER, LIMITATIONS, resolvedIssues } from "./reportData";

/** jsPDF's built-in fonts cover Latin-1 only: transliterate Devanagari and replace symbols. */
function safe(s: string): string {
  let out = hasDevanagari(s) ? `${transliterate(s)} (transliterated)` : s;
  out = out
    .replace(/₹\s?/g, "Rs. ")
    .replace(/↔/g, "<->")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/–/g, "-");
  return out.replace(/[^\x00-\xFF—•·]/g, "");
}

export async function downloadReport(session: Session) {
  const { jsPDF } = await import("jspdf");
  const app = getApplication(session.appId)!;
  const variant = app.variants.find((v) => v.id === session.variantId)!;
  const run = session.runs[session.runs.length - 1];
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = M;

  const ensure = (h: number) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
  };
  const text = (s: string, size = 10, opts: { bold?: boolean; color?: [number, number, number]; indent?: number; gap?: number } = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? [30, 33, 36]));
    const lines = doc.splitTextToSize(safe(s), W - M * 2 - (opts.indent ?? 0)) as string[];
    for (const line of lines) {
      ensure(size * 1.35);
      doc.text(line, M + (opts.indent ?? 0), y);
      y += size * 1.35;
    }
    y += opts.gap ?? 2;
  };
  const heading = (s: string) => {
    ensure(40);
    y += 10;
    doc.setDrawColor(229, 224, 214);
    doc.line(M, y - 12, W - M, y - 12);
    text(s, 13, { bold: true, gap: 4 });
  };

  // Header
  doc.setFillColor(15, 110, 95);
  doc.rect(0, 0, W, 6, "F");
  text("RejectLess — Application Readiness Report", 18, { bold: true, gap: 2 });
  text(`${app.name}: ${variant.name} (${variant.formName})`, 11, { color: [71, 76, 82] });
  text(`Session reference ${session.id}   ·   Generated ${new Date().toLocaleString("en-IN")}`, 9, { color: [107, 112, 118] });
  if (run) text(`Validation run: ${new Date(run.at).toLocaleString("en-IN")}   ·   Rule pack ${run.ruleVersions}`, 9, { color: [107, 112, 118] });
  if (session.demoScenarioId) text("DEMO SESSION — all people, documents and identifiers are fictional.", 9, { bold: true, color: [53, 89, 140] });
  y += 6;
  text(DISCLAIMER, 9, { color: [107, 112, 118], gap: 6 });

  if (!run) {
    text("No readiness check has been run in this session.", 11, { bold: true });
  } else {
    const by = (s: string) => run.findings.filter((f) => f.status === s);
    heading("Summary");
    text(`Action required: ${by("action").length}    Needs review: ${by("review").length}    External verification: ${by("external").length}    Passed: ${by("passed").length}    Resolved during session: ${resolvedIssues(session).length}`, 10);

    heading("Documents reviewed");
    if (!session.documents.length) text("None.", 10);
    session.documents.forEach((d) =>
      text(
        `• ${DOC_TYPES[d.typeId].label} — ${d.fileName} (${d.status === "failed" ? "could not be read" : d.textMethod === "text-layer" ? "digital PDF text" : "on-device text recognition"}${d.version > 1 ? `, version ${d.version}` : ""}${d.synthetic ? ", fictional" : ""})`,
        10,
      ),
    );

    const issue = (f: Finding) => {
      const res = session.resolutions[f.key];
      text(`${f.title}  [${f.status === "action" ? "Action required" : "Needs review"} · ${f.severity} · ${BASIS_LABEL[f.basis]}]`, 10.5, { bold: true });
      text(f.summary, 10, { indent: 10 });
      f.observations.slice(0, 6).forEach((o) =>
        text(`${o.docLabel} — ${o.fieldLabel}: ${SENSITIVE_FIELDS.includes(o.field as FieldKey) ? maskIdentifier(String(o.field), o.value) : o.value}`, 9, { indent: 18, color: [71, 76, 82] }),
      );
      text(`What to do: ${f.recommendation}`, 10, { indent: 10 });
      if (res?.state === "confirmed_correct") text("You confirmed these values are correct.", 9, { indent: 10, color: [29, 115, 72] });
      if (res?.state === "acknowledged") text("Marked by you for follow-up.", 9, { indent: 10, color: [107, 112, 118] });
      y += 4;
    };

    heading("Issues to resolve");
    const open = [...by("action"), ...by("review")];
    if (!open.length) text("No open issues were found by the checks RejectLess could perform.", 10);
    open.forEach(issue);

    heading("Resolved during this session");
    const resolved = resolvedIssues(session);
    if (!resolved.length) text("None.", 10);
    resolved.forEach(({ finding, resolution }) => {
      text(`Resolved: ${finding.title}`, 10, { bold: true });
      resolution.history.forEach((h) => text(`${new Date(h.at).toLocaleString("en-IN")} — ${h.note}`, 9, { indent: 12, color: [71, 76, 82] }));
    });

    heading("Needs official (external) verification");
    by("external").forEach((f) => {
      text(f.title, 10, { bold: true });
      text(f.summary, 10, { indent: 10 });
      f.signals.forEach((s) => text(`• ${s}`, 9.5, { indent: 18 }));
    });

    heading("Checks passed");
    by("passed").forEach((f) => text(`• ${f.title} — ${f.summary}`, 9.5));

    heading("Recommended next steps");
    const steps = [
      ...by("action").map((f) => f.recommendation),
      ...(by("review").length ? ["Review the items marked 'Needs review' against your original documents."] : []),
      "Confirm the external verification items on the official portal.",
      `Apply on the official portal: ${app.officialPortal ?? "the authority's website"}.`,
    ];
    Array.from(new Set(steps)).slice(0, 8).forEach((s, i) => text(`${i + 1}. ${s}`, 10));

    heading("Checks performed");
    rulesFor(variant)
      .filter((r) => r.check !== "info_note")
      .forEach((r) => text(`${r.id} v${r.version} — ${r.title} (${BASIS_LABEL[r.basis]}; last verified ${r.lastVerified})`, 9));

    heading("References");
    const ids = Array.from(new Set(run.findings.flatMap((f) => f.sourceIds)));
    ids.forEach((id) => {
      const s = getSource(id);
      if (s) text(`• ${s.title} — ${s.publisher} (${s.kind}). ${s.url.startsWith("/") ? "RejectLess methodology page" : s.url}. Accessed ${s.accessedOn}.`, 9);
    });
  }

  heading("Limitations");
  LIMITATIONS.forEach((l) => text(`• ${l}`, 9.5));

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`RejectLess · ${session.id} · page ${i} of ${pages} · not an official document`, M, H - 24);
  }
  doc.save(`RejectLess-readiness-${session.id}.pdf`);
}
