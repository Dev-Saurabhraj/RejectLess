"use client";

import { Card } from "@/components/ui";
import { useActiveSession } from "@/lib/hooks";
import { useSession } from "@/lib/store/session";

export function DraftForm({ compact = false }: { compact?: boolean }) {
  const { session, variant } = useActiveSession();
  const setDraft = useSession((s) => s.setDraft);
  if (!session || !variant) return null;

  return (
    <Card className="p-5">
      <p className="font-medium">What you plan to enter</p>
      <p className="mt-1 text-[13px] text-ink-3">
        The details you will type on the official portal. They are compared with your documents. Optional — leave blank what you don&rsquo;t know.
      </p>
      <div className={compact ? "mt-4 grid gap-3 sm:grid-cols-2" : "mt-4 space-y-3"}>
        {variant.draftFields.map((f) => (
          <label key={f.key} className="block">
            <span className="text-[13px] font-medium text-ink-2">{f.label}</span>
            {f.type === "select" ? (
              <select
                value={session.draft[f.key] ?? ""}
                onChange={(e) => setDraft(f.key, e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-[14px]"
              >
                <option value="">Select…</option>
                {f.options!.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type === "date" ? "date" : "text"}
                inputMode={f.type === "number" || f.key === "account_number" ? "numeric" : undefined}
                autoComplete="off"
                spellCheck={false}
                value={session.draft[f.key] ?? ""}
                onChange={(e) => setDraft(f.key, f.key === "ifsc" ? e.target.value.toUpperCase() : e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-[14px] tabular"
              />
            )}
            {f.help && <span className="mt-1 block text-[12px] text-ink-3">{f.help}</span>}
          </label>
        ))}
      </div>
    </Card>
  );
}
