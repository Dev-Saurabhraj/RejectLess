"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import { STAGES } from "@/engine/run";
import { Spinner } from "@/components/ui";
import { StepTitle } from "./common";
import { useRunCheck } from "@/lib/useRunCheck";
import { useSession } from "@/lib/store/session";

const PLAIN: Record<string, string> = {
  quality: "Checking your scans are readable",
  extraction: "Checking every detail was found",
  consistency: "Comparing your documents with each other",
  identity: "Matching your name and date of birth",
  rules: "Applying the rules for your application",
  external: "Listing what only the portal can confirm",
};

export function CheckStep() {
  const { run, stages, lastRun } = useRunCheck();
  const setGuideStep = useSession((s) => s.setGuideStep);
  const processing = useSession((s) => s.session?.documents.some((d) => d.status === "processing"));
  const started = useRef(false);

  useEffect(() => {
    if (started.current || processing) return;
    started.current = true;
    void run();
  }, [processing, run]);

  useEffect(() => {
    if (!lastRun) return;
    // Let the final tick register before moving to the results.
    const t = setTimeout(() => setGuideStep("results"), 500);
    return () => clearTimeout(t);
  }, [lastRun, setGuideStep]);

  return (
    <div>
      <StepTitle title={processing ? "Finishing reading your documents…" : "Checking your application"} sub="This runs on your device." />
      <ol className="space-y-3">
        {STAGES.map((s) => {
          const st = stages[s.id]?.status;
          return (
            <li key={s.id} className={clsx("flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors", st === "running" ? "bg-surface" : "")}>
              <span className={clsx("flex size-7 items-center justify-center rounded-full", st === "done" ? "bg-pass-soft text-pass" : st === "running" ? "text-accent" : "text-ink-3")}>
                {st === "done" ? <Check className="size-4" /> : st === "running" ? <Spinner /> : <span className="size-2 rounded-full bg-line-strong" />}
              </span>
              <span className={clsx("text-[16px]", st ? "text-ink" : "text-ink-3")}>{PLAIN[s.id]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
