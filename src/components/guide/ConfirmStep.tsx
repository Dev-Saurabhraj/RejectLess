"use client";

import { useState } from "react";
import { ArrowRight, Check, Eye, Pencil } from "lucide-react";
import type { DocumentRecord, ExtractedField, FieldKey } from "@/engine/types";
import { compareNames } from "@/engine/identity/nameMatch";
import { digitsOnly, formatDate, maskIdentifier, parseDate } from "@/engine/validators";
import { Button } from "@/components/ui";
import { EvidenceViewer } from "@/components/workspace/EvidenceViewer";
import { ActionBar, StepTitle } from "./common";
import { useActiveSession } from "@/lib/hooks";
import { useSession } from "@/lib/store/session";
import { DOC_TYPES, FIELD_LABELS, SENSITIVE_FIELDS } from "@/knowledge/documents";

const NAMES: FieldKey[] = ["name", "account_holder", "father_name"];
const COMPARED: FieldKey[] = ["name", "account_holder", "father_name", "dob", "account_number", "ifsc"];

interface Item {
  doc: DocumentRecord;
  field: ExtractedField;
  reason: "unclear" | "differs";
}

function norm(key: FieldKey, v: string) {
  if (key === "dob") {
    const p = parseDate(v);
    return p ? formatDate(p) : v;
  }
  if (key === "account_number") return digitsOnly(v);
  return v.replace(/\s/g, "").toUpperCase();
}

export function display(key: FieldKey, v: string) {
  if (SENSITIVE_FIELDS.includes(key)) return maskIdentifier(key, v);
  if (["dob", "doj", "doe", "issue_date"].includes(key)) {
    const p = parseDate(v);
    return p ? formatDate(p) : v;
  }
  return v;
}

/** Values worth a second look: read with low confidence, or different from the same detail elsewhere. */
function itemsToConfirm(docs: DocumentRecord[]): Item[] {
  const ready = docs.filter((d) => d.status === "analysed" || d.status === "needs_attention");
  const out: Item[] = [];
  const seen = new Set<string>();
  const push = (doc: DocumentRecord, field: ExtractedField, reason: Item["reason"]) => {
    const k = `${doc.id}:${field.key}`;
    if (seen.has(k) || field.status !== "extracted" || field.minimised) return;
    seen.add(k);
    out.push({ doc, field, reason });
  };
  for (const key of COMPARED) {
    const group = ready.flatMap((d) =>
      d.fields.filter((f) => (NAMES.includes(key) && key !== "father_name" ? f.key === "name" || f.key === "account_holder" : f.key === key)).map((f) => ({ d, f })),
    );
    if (group.length < 2) continue;
    const [first, ...rest] = group;
    for (const g of rest) {
      const same = NAMES.includes(key) ? compareNames(first.f.value, g.f.value).outcome === "consistent" : norm(key, first.f.value) === norm(key, g.f.value);
      if (!same) {
        push(first.d, first.f, "differs");
        push(g.d, g.f, "differs");
      }
    }
  }
  for (const d of ready) for (const f of d.fields) if (f.confidence < 0.8) push(d, f, "unclear");
  return out;
}

export function ConfirmStep() {
  const { session } = useActiveSession();
  const setGuideStep = useSession((s) => s.setGuideStep);
  const [initial] = useState(() => (session ? itemsToConfirm(session.documents) : []));
  if (!session) return null;
  // Keep the list stable while the user works through it; read live values from the session.
  const live = (it: Item) => session.documents.find((d) => d.id === it.doc.id)?.fields.find((f) => f.key === it.field.key) ?? it.field;
  const remaining = initial.filter((it) => live(it).status === "extracted").length;

  const name = session.documents.flatMap((d) => d.fields).find((f) => f.key === "name");
  const docs = session.documents.filter((d) => d.status !== "failed");

  return (
    <div>
      {initial.length ? (
        <StepTitle
          title={`Check ${initial.length} detail${initial.length > 1 ? "s" : ""} we read`}
          sub="We only want to know if we read your documents correctly. If documents disagree with each other, we'll explain that in your results."
        />
      ) : (
        <StepTitle title="Everything was read clearly" sub={`We read ${docs.reduce((s, d) => s + d.fields.length, 0)} details from ${docs.length} documents${name ? `, starting with your name: ${name.value}` : ""}.`} />
      )}

      <ul className="space-y-3">
        {initial.map((it) => (
          <ConfirmCard key={`${it.doc.id}:${it.field.key}`} item={it} field={live(it)} />
        ))}
      </ul>

      <ActionBar>
        <Button size="lg" onClick={() => setGuideStep("details")}>
          {remaining ? "Skip and continue" : "Continue"} <ArrowRight className="size-4" />
        </Button>
      </ActionBar>
    </div>
  );
}

function ConfirmCard({ item, field }: { item: Item; field: ExtractedField }) {
  const confirmField = useSession((s) => s.confirmField);
  const editField = useSession((s) => s.editField);
  const [editing, setEditing] = useState(false);
  const [show, setShow] = useState(false);
  const [value, setValue] = useState(field.value);
  const done = field.status !== "extracted";
  const docLabel = DOC_TYPES[item.doc.typeId].short;

  return (
    <li className={`rounded-2xl border bg-surface p-5 transition-colors ${done ? "border-pass/30" : "border-line"}`}>
      <p className="text-[13px] text-ink-3">
        {FIELD_LABELS[field.key]} on your {docLabel}
        {item.reason === "differs" && !done && <span className="ml-2 rounded-full bg-review-soft px-2 py-0.5 text-[12px] text-review">differs from another document</span>}
        {item.reason === "unclear" && !done && <span className="ml-2 rounded-full bg-black/[0.05] px-2 py-0.5 text-[12px] text-ink-2">hard to read</span>}
      </p>
      {editing ? (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            editField(item.doc.id, field.key, value.trim());
            setEditing(false);
          }}
        >
          <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-line-strong px-3 text-[16px]" aria-label={`Correct ${FIELD_LABELS[field.key]}`} />
          <Button type="submit">Save</Button>
        </form>
      ) : (
        <p className="mt-1 break-words text-[20px] font-medium">{display(field.key, field.value)}</p>
      )}
      {done ? (
        <p className="mt-3 flex items-center gap-1.5 text-[14px] text-pass">
          <Check className="size-4" /> {field.status === "edited" ? "Corrected" : "Confirmed"}
        </p>
      ) : (
        !editing && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => confirmField(item.doc.id, field.key)}>
              <Check className="size-4" /> That&rsquo;s what it says
            </Button>
            <Button variant="ghost" onClick={() => (setValue(field.value), setEditing(true))}>
              <Pencil className="size-4" /> Fix it
            </Button>
            {field.bbox && (
              <Button variant="ghost" onClick={() => setShow(!show)}>
                <Eye className="size-4" /> {show ? "Hide" : "Show on document"}
              </Button>
            )}
          </div>
        )
      )}
      {show && field.bbox && (
        <EvidenceViewer docId={item.doc.id} page={field.page} version={item.doc.version} highlights={[{ bbox: field.bbox, label: FIELD_LABELS[field.key], active: true }]} className="mt-4 max-h-80 overflow-auto" />
      )}
    </li>
  );
}
