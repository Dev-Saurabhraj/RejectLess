"use client";

import type { Finding } from "@/engine/types";
import type { Session } from "@/lib/store/session";
import { getApplication } from "@/knowledge/applications";
import { isOpenIssue } from "@/engine/run";
import { nameTokens } from "@/engine/text/normalize";
import { retrieve } from "./retrieval";
import { ROLES, WORK_TYPES, stateName } from "@/knowledge/onboarding";
import { KB, type KbChunk } from "./kb";

export interface AssistantAnswer {
  text: string;
  citations: KbChunk[];
  mode: "local" | "ai";
  /** False when the model cited nothing we gave it — shown as "not verified". */
  grounded: boolean;
  followUps?: string[];
  note?: string;
}

const RULE_GUIDES: Record<string, string[]> = {
  "EPF-NAME": ["G-NAME-VARIANTS", "G-UAN-PROFILE", "G-BANK-NAME"],
  "NSP-NAME": ["G-NAME-VARIANTS", "G-BANK-NAME"],
  "GEN-DOB-CONSISTENCY": ["G-UAN-PROFILE", "G-AADHAAR-UPDATE", "G-PAN-CORRECTION"],
  "EPF-FATHER": ["G-UAN-PROFILE"],
  "GEN-ACCOUNT-CONSISTENCY": ["G-UAN-BANK"],
  "GEN-IFSC-CONSISTENCY": ["G-UAN-BANK"],
  "GEN-IFSC-REFERENCE": ["G-UAN-BANK"],
  "GEN-IFSC-FORMAT": ["G-UAN-BANK"],
  "EPF-DOE-PRESENT": ["G-DOE"],
  "EPF-TDS-PAN": ["G-TDS"],
  "GEN-DOCS": ["G-TDS"],
  "EPF-FINAL-WAIT": ["G-EPF-2026"],
  "EPF-10C-WAIT": ["G-EPF-2026"],
  "EPF-31-MEMBERSHIP": ["G-EPF-2026"],
  "EPF-31-AMOUNT": ["G-EPF-2026"],
  "EPF-EXTERNAL": ["G-EXTERNAL"],
  "NSP-EXTERNAL": ["G-EXTERNAL", "G-NSP-DBT"],
  "NSP-OWN-ACCOUNT": ["G-NSP-DBT"],
  "NSP-INCOME-RECENT": ["G-INCOME-CERT"],
  "NSP-FATHER": ["G-INCOME-CERT"],
  "GEN-PAN-SURNAME": ["G-PAN-CORRECTION"],
};

export function guidesFor(f?: Finding): string[] {
  if (!f) return [];
  return [`R-${f.ruleId}`, ...(RULE_GUIDES[f.ruleId] ?? [])];
}

// ---------------------------------------------------------------------------- privacy

/** Removes identifiers and the applicant's known names from free text before it leaves the device. */
export function redact(text: string, session: Session | null): { text: string; removed: number } {
  let removed = 0;
  const sub = (re: RegExp, label: string) => {
    text = text.replace(re, () => {
      removed++;
      return `[${label}]`;
    });
  };
  sub(/\b[A-Z]{5}\d{4}[A-Z]\b/gi, "PAN");
  sub(/\b[A-Z]{4}[0O][A-Z0-9]{6}\b/gi, "IFSC");
  sub(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, "NUMBER");
  sub(/\b\d{9,18}\b/g, "NUMBER");
  sub(/\b[6-9]\d{9}\b/g, "PHONE");
  sub(/[\w.+-]+@[\w-]+\.[\w.]+/g, "EMAIL");
  sub(/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/g, "DATE");
  const names = new Set<string>();
  for (const d of session?.documents ?? []) {
    for (const f of d.fields) {
      if (["name", "name_local", "father_name", "account_holder"].includes(f.key)) {
        nameTokens(f.value).forEach((t) => t.original.length >= 3 && names.add(t.original));
      }
    }
  }
  for (const n of ["name", "father_name"]) {
    nameTokens(session?.draft[n] ?? "").forEach((t) => t.original.length >= 3 && names.add(t.original));
  }
  for (const n of names) {
    const re = new RegExp(`(^|[^\\p{L}])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^\\p{L}])`, "giu");
    text = text.replace(re, (_m, pre) => {
      removed++;
      return `${pre}[NAME]`;
    });
  }
  return { text, removed };
}

export interface AiPayload {
  question: string;
  application: string;
  /** Onboarding answers only (role, work type, state) — never identifiers. */
  context?: string;
  findings: { id: string; title: string; status: string; severity: string; summary: string; basis: string; focus: boolean }[];
  passages: { id: string; title: string; text: string; confidence: string }[];
}

function profileContext(session: Session): string | undefined {
  const p = session.profile;
  if (!p) return undefined;
  const role = ROLES.find((r) => r.id === p.role)?.label;
  const work = WORK_TYPES.find((w) => w.id === p.work)?.label;
  return [role && `User: ${role}`, work && `Work: ${work}`, p.state && `State: ${stateName(p.state)}`].filter(Boolean).join("; ");
}

export function buildPayload(question: string, session: Session, focusKey?: string): { payload: AiPayload; chunks: KbChunk[]; redactedCount: number } {
  const app = getApplication(session.appId);
  const variant = app?.variants.find((v) => v.id === session.variantId);
  const run = session.runs[session.runs.length - 1];
  const focus = run?.findings.find((f) => f.key === focusKey);
  const relevant = (run?.findings ?? []).filter((f) => isOpenIssue(f) || f.status === "external" || f.key === focusKey).slice(0, 12);
  const red = redact(question, session);
  const chunks = retrieve(`${red.text} ${focus ? `${focus.title} ${focus.abstract}` : ""}`, { appId: session.appId, boostIds: guidesFor(focus), k: 6 }).map((r) => r.chunk);
  return {
    payload: {
      question: red.text.slice(0, 600),
      application: `${app?.name ?? ""} — ${variant?.name ?? ""} (${variant?.formName ?? ""})`,
      context: profileContext(session),
      findings: relevant.map((f, i) => ({
        id: `F${i + 1}`,
        title: f.title,
        status: f.status,
        severity: f.severity,
        // The abstract is generated by the engine without names, numbers or dates.
        summary: f.abstract,
        basis: f.basis,
        focus: f.key === focusKey,
      })),
      passages: chunks.map((c) => ({ id: c.id, title: c.title, text: c.text, confidence: c.confidence })),
    },
    chunks,
    redactedCount: red.removed,
  };
}

// ---------------------------------------------------------------------------- local (no AI) answers

const has = (q: string, words: string[]) => words.some((w) => q.includes(w));

export function answerLocally(question: string, session: Session, focusKey?: string): AssistantAnswer {
  const q = question.toLowerCase();
  const run = session.runs[session.runs.length - 1];
  const focus = run?.findings.find((f) => f.key === focusKey);
  const note = /[ऀ-ॿ]/.test(question) ? "Answers in Hindi need AI mode. This answer is from the knowledge base in English." : undefined;
  const byId = (id: string) => KB.find((c) => c.id === id);

  if (!focus && has(q, ["next", "what should i do", "where do i start", "priority", "first"])) {
    const open = (run?.findings ?? []).filter((f) => f.status === "action").concat((run?.findings ?? []).filter((f) => f.status === "review"));
    if (!run) return { text: "Run the readiness check first — then I can tell you what to fix and in what order.", citations: [], mode: "local", grounded: true, note };
    if (!open.length) {
      const ext = run.findings.find((f) => f.status === "external");
      return {
        text: `No open issues were found. Before applying, check the items only the official system can confirm${ext ? `: ${ext.signals.slice(0, 3).join(" ")}` : "."} Then download your readiness report.`,
        citations: [byId("G-EXTERNAL")!],
        mode: "local",
        grounded: true,
        note,
      };
    }
    const lines = open.slice(0, 4).map((f, i) => `${i + 1}. **${f.title}** — ${f.recommendation}`);
    return {
      text: `Start with the items marked "Action required", most serious first:\n\n${lines.join("\n")}\n\nAfter fixing, run the check again so RejectLess can confirm the fix.`,
      citations: open.slice(0, 4).map((f) => byId(`R-${f.ruleId}`)).filter(Boolean) as KbChunk[],
      mode: "local",
      grounded: true,
      note,
    };
  }

  if (focus) {
    const guides = guidesFor(focus).map(byId).filter(Boolean) as KbChunk[];
    const how = guides.find((g) => g.id.startsWith("G-") && g.id !== "G-NAME-VARIANTS" && g.id !== "G-EXTERNAL");
    let text: string;
    if (has(q, ["why", "matter", "important", "reject"])) {
      text = `${focus.summary}\n\n**Why it matters:** ${focus.whyItMatters}`;
    } else if (has(q, ["which document", "which doc", "what document", "where"])) {
      const docs = Array.from(new Set(focus.observations.map((o) => o.docLabel)));
      text = `This finding is based on: ${docs.join(", ") || "your application details"}.\n\n${focus.recommendation}`;
    } else if (has(q, ["source", "official", "rule", "proof"])) {
      text = `This check is rule ${focus.ruleId}. ${focus.basis === "secondary" ? "It is based on reputable reporting; the official text could not be confirmed, so check the official portal." : focus.basis === "engine" ? "It is a RejectLess data-quality check, not an official requirement." : focus.basis === "demo" ? "It is a demonstration rule, not an official requirement." : "It comes from an official source."} The sources are listed on the finding.`;
    } else {
      text = `**What to do:** ${focus.recommendation}${how ? `\n\n**How:** ${how.text}` : ""}`;
    }
    if (focus.ruleId.endsWith("NAME")) text += `\n\n${byId("G-NAME-VARIANTS")!.text}`;
    return { text, citations: guides.slice(0, 3), mode: "local", grounded: true, note };
  }

  const hits = retrieve(question, { appId: session.appId, k: 3 });
  if (!hits.length) {
    return {
      text: "I could not find anything in RejectLess's knowledge base about that. I can only answer from verified material about your application, so I would rather not guess. Try asking about a specific finding, or check the official portal.",
      citations: [],
      mode: "local",
      grounded: true,
      note,
    };
  }
  const [top, ...rest] = hits;
  return {
    text: `**${top.chunk.title}**\n\n${top.chunk.text}${rest.length ? `\n\nRelated: ${rest.map((r) => r.chunk.title).join("; ")}.` : ""}`,
    citations: hits.map((h) => h.chunk),
    mode: "local",
    grounded: true,
    note,
  };
}

// ---------------------------------------------------------------------------- AI answers (opt-in)

export async function aiStatus(): Promise<{ enabled: boolean; model?: string; provider?: string }> {
  try {
    const r = await fetch("/api/assistant", { method: "GET" });
    return await r.json();
  } catch {
    return { enabled: false };
  }
}

export async function answerWithAi(payload: AiPayload, chunks: KbChunk[]): Promise<AssistantAnswer> {
  const r = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  if (!r.ok) {
    const msg = (await r.json().catch(() => ({})))?.error;
    throw new Error(msg || `The AI service returned an error (${r.status}).`);
  }
  const data = (await r.json()) as { answer: string; citations: string[]; followUps?: string[] };
  // Only accept citations that point to passages we actually provided.
  const valid = (data.citations ?? []).map((id) => chunks.find((c) => c.id === id)).filter(Boolean) as KbChunk[];
  // Inline citation tags are shown as source chips instead; tolerate spacing and commas inside the brackets.
  const text = data.answer
    .replace(/\[\s*([A-Z]-[A-Za-z0-9-]+(?:\s*,\s*[A-Z]-[A-Za-z0-9-]+)*)\s*\]/g, (m, ids: string) => (ids.split(/\s*,\s*/).every((id) => chunks.some((c) => c.id === id)) ? "" : m))
    .replace(/[ \t]+([.,;:])/g, "$1")
    .replace(/ {2,}/g, " ")
    .trim();
  return { text, citations: valid, mode: "ai", grounded: valid.length > 0, followUps: data.followUps?.slice(0, 3) };
}
