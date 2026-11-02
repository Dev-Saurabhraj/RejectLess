"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { BasisTag, Button, Card, Eyebrow } from "@/components/ui";
import { getApplication } from "@/knowledge/applications";
import { DOC_TYPES } from "@/knowledge/documents";
import { rulesFor } from "@/engine/run";
import { useSession } from "@/lib/store/session";

const NEED_LABEL = { required: "Needed", conditional: "Sometimes needed", recommended: "Optional" } as const;

export function VariantPicker({ appId }: { appId: string }) {
  const app = getApplication(appId)!;
  const [variantId, setVariantId] = useState(app.variants[0].id);
  const variant = app.variants.find((v) => v.id === variantId)!;
  const rules = rulesFor(variant).filter((r) => r.check !== "info_note");
  const router = useRouter();
  const { session, startSession } = useSession();

  function start() {
    if (session && session.documents.length > 0) {
      const ok = window.confirm("Starting a new check will delete your current session and its documents from this browser. Continue?");
      if (!ok) return;
    }
    startSession(app.id, variant.id);
    router.push("/workspace");
  }

  return (
    <div className="mt-10">
      {app.variants.length > 1 && (
        <>
          <Eyebrow>Which claim are you preparing?</Eyebrow>
          <div role="radiogroup" className="mt-3 grid gap-3 sm:grid-cols-3">
            {app.variants.map((v) => (
              <button
                key={v.id}
                role="radio"
                aria-checked={v.id === variantId}
                onClick={() => setVariantId(v.id)}
                className={clsx(
                  "rounded-xl border p-4 text-left transition-colors",
                  v.id === variantId ? "border-accent bg-accent-soft/60 ring-1 ring-accent" : "border-line bg-surface hover:border-line-strong",
                )}
              >
                <p className="font-medium">{v.name}</p>
                <p className="mt-0.5 text-[12px] text-ink-3">{v.formName}</p>
                <p className="mt-2 text-[13px] leading-snug text-ink-2">{v.summary}</p>
              </button>
            ))}
          </div>
        </>
      )}

      <Card className="mt-6 divide-y divide-line">
        <div className="p-5 sm:p-6">
          <p className="text-[13px] text-ink-3">Who this is for</p>
          <p className="mt-1">{variant.whoFor}</p>
        </div>
        <div className="p-5 sm:p-6">
          <p className="font-medium">Important conditions</p>
          <ul className="mt-3 space-y-2 text-[14px] text-ink-2">
            {variant.conditions.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-3" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5 sm:p-6">
          <p className="font-medium">Documents you will need</p>
          <ul className="mt-3 space-y-3">
            {variant.documents.map((d) => (
              <li key={d.docType} className="flex gap-3">
                <FileText className="mt-0.5 size-4 shrink-0 text-ink-3" />
                <div className="text-[14px]">
                  <p>
                    <span className="font-medium">{DOC_TYPES[d.docType].label}</span>
                    <span className={clsx("ml-2 rounded px-1.5 py-px text-[11px]", d.need === "required" ? "bg-ink text-white" : "border border-line-strong text-ink-3")}>
                      {NEED_LABEL[d.need]}
                    </span>
                  </p>
                  <p className="mt-0.5 text-ink-3">{d.why}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5 sm:p-6">
          <p className="font-medium">What RejectLess will check ({rules.length})</p>
          <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {rules.map((r) => (
              <li key={r.id} className="flex items-start gap-2 text-[14px]">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                <span className="flex-1">
                  {r.title} <BasisTag basis={r.basis} />
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-start gap-3 bg-surface-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="text-[13px] text-ink-3">No documents are needed to start. You will be asked for consent before anything is processed.</p>
          <Button size="lg" onClick={start}>
            Start preparing <ArrowRight className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
