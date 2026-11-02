"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { ActionBar, StepTitle } from "./common";
import { useActiveSession } from "@/lib/hooks";
import { useSession } from "@/lib/store/session";

export function DetailsStep() {
  const { session, variant } = useActiveSession();
  const setDraft = useSession((s) => s.setDraft);
  const setGuideStep = useSession((s) => s.setGuideStep);
  if (!session || !variant) return null;
  const filled = variant.draftFields.filter((f) => session.draft[f.key]).length;

  return (
    <div>
      <StepTitle
        title="What will you type on the portal?"
        sub="We compare it with your documents to catch typos before EPFO or NSP does. Leave blank anything you're not sure about."
      />
      <div className="space-y-5">
        {variant.draftFields.map((f) => (
          <label key={f.key} className="block">
            <span className="text-[15px] font-medium">{f.label}</span>
            {f.help && <span className="mt-0.5 block text-[13px] text-ink-3">{f.help}</span>}
            {f.type === "select" ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {f.options!.map((o) => (
                  <button
                    type="button"
                    key={o.value}
                    onClick={() => setDraft(f.key, session.draft[f.key] === o.value ? "" : o.value)}
                    className={`rounded-xl border px-4 py-2.5 text-left text-[14px] transition-colors ${session.draft[f.key] === o.value ? "border-accent bg-accent text-white" : "border-line-strong bg-surface hover:border-ink-3"}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type={f.type === "date" ? "date" : "text"}
                inputMode={f.type === "number" || f.key === "account_number" ? "numeric" : undefined}
                autoComplete="off"
                spellCheck={false}
                value={session.draft[f.key] ?? ""}
                onChange={(e) => setDraft(f.key, f.key === "ifsc" ? e.target.value.toUpperCase() : e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-line-strong bg-surface px-4 text-[16px] tabular"
              />
            )}
          </label>
        ))}
      </div>
      <ActionBar>
        <Button size="lg" variant="ghost" onClick={() => setGuideStep("confirm")}>Back</Button>
        <Button size="lg" onClick={() => setGuideStep("check")}>
          {filled ? "Check my application" : "Skip and check"} <ArrowRight className="size-4" />
        </Button>
      </ActionBar>
    </div>
  );
}
