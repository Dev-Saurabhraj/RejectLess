"use client";

import { useEffect, useState } from "react";
import { useActiveSession } from "@/lib/hooks";
import type { GuideStep } from "@/lib/store/session";
import { GuideProgress } from "@/components/guide/common";
import { DocumentsStep } from "@/components/guide/DocumentsStep";
import { ConfirmStep } from "@/components/guide/ConfirmStep";
import { DetailsStep } from "@/components/guide/DetailsStep";
import { CheckStep } from "@/components/guide/CheckStep";
import { ResultsStep } from "@/components/guide/ResultsStep";

const ORDER: GuideStep[] = ["documents", "confirm", "details", "check", "results"];

/** The guided flow: one clear step at a time. Detailed views stay available under "All details". */
export default function GuidePage() {
  const { session, latestRun } = useActiveSession();
  const step: GuideStep = session?.guideStep === "results" && !latestRun ? "check" : (session?.guideStep ?? "documents");
  // Slide forward or back depending on where the user came from.
  const [shown, setShown] = useState({ step, dir: "step-fwd" });
  if (shown.step !== step) setShown({ step, dir: ORDER.indexOf(step) >= ORDER.indexOf(shown.step) ? "step-fwd" : "step-back" });
  const dir = shown.dir;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);
  if (!session) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <GuideProgress step={step} />
      <div key={step} className={`${dir} pt-8`}>
        {step === "documents" && <DocumentsStep />}
        {step === "confirm" && <ConfirmStep />}
        {step === "details" && <DetailsStep />}
        {step === "check" && <CheckStep />}
        {step === "results" && <ResultsStep />}
      </div>
    </div>
  );
}
