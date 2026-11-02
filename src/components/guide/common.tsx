"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { GuideStep } from "@/lib/store/session";

export const GUIDE_STAGES: { id: GuideStep[]; label: string }[] = [
  { id: ["documents"], label: "Documents" },
  { id: ["confirm"], label: "Confirm" },
  { id: ["details"], label: "Your details" },
  { id: ["check", "results"], label: "Results" },
];

export function GuideProgress({ step }: { step: GuideStep }) {
  const idx = GUIDE_STAGES.findIndex((s) => s.id.includes(step));
  return (
    <ol className="flex items-center gap-2" aria-label="Your progress">
      {GUIDE_STAGES.map((s, i) => (
        <li key={s.label} className="flex flex-1 flex-col gap-1.5">
          <span className={clsx("h-1.5 rounded-full transition-colors duration-500", i <= idx ? "bg-accent" : "bg-line")} />
          <span className={clsx("flex items-center gap-1 truncate whitespace-nowrap text-[11px] sm:text-[12px]", i === idx ? "font-medium text-ink" : "text-ink-3")}>
            {i < idx && <Check className="hidden size-3 shrink-0 text-accent sm:block" />}
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function StepTitle({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="mb-2 text-[13px] font-medium text-accent">{eyebrow}</p>}
      <h1 className="text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]">{title}</h1>
      {sub && <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{sub}</p>}
    </div>
  );
}

/** Bottom action bar: sticky on phones so the next step is always one thumb away. */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-8 border-t border-line bg-bg/95 px-5 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">{children}</div>
    </div>
  );
}
