"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Check, ChevronDown, FlaskConical, Wrench } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { useActiveSession } from "@/lib/hooks";
import { applyFix } from "@/lib/actions";
import { useSession } from "@/lib/store/session";
import { getCustomScenario } from "@/demo/custom";

export function DemoGuide() {
  const { session, scenario: seeded } = useActiveSession();
  const scenario = session?.demoScenarioId === "custom" ? getCustomScenario() : seeded;
  const [open, setOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1400);
  const [busy, setBusy] = useState<string>();
  const activity = useSession((s) => s.session?.activity);
  const applied = (activity ?? []).filter((a) => a.text.startsWith("Demo fix applied: ")).map((a) => a.text.slice(18));
  if (!scenario) return null;

  async function run(id: string) {
    const fix = scenario!.fixes.find((f) => f.id === id)!;
    setBusy(id);
    try {
      await applyFix(fix);
      useSession.getState().log(`Demo fix applied: ${fix.label}`);
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <aside className="fixed bottom-3 left-3 z-40 w-[min(360px,calc(100vw-24px))] rounded-2xl border border-external/25 bg-surface shadow-xl">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-4 py-3 text-left" aria-expanded={open}>
        <FlaskConical className="size-4 text-external" />
        <span className="flex-1 text-[13px] font-medium">
          Demo {scenario.number} · {scenario.title}
        </span>
        <ChevronDown className={clsx("size-4 text-ink-3 transition-transform", !open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-line px-4 pb-4 pt-3 text-[13px]">
          <p className="text-ink-2">{scenario.story}</p>
          <p className="rounded-lg bg-external-soft p-2.5 text-[#24406a]">
            <span className="font-medium">Expected: </span>
            {scenario.expected}
          </p>
          {scenario.fixes.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 font-medium">
                <Wrench className="size-3.5" /> Simulate a correction
              </p>
              <ul className="space-y-2">
                {scenario.fixes.map((f) => {
                  const done = applied.includes(f.label);
                  return (
                    <li key={f.id} className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="font-medium">{f.label}</p>
                        <p className="text-ink-3">{f.description}</p>
                      </div>
                      <Button size="sm" variant={done ? "ghost" : "secondary"} disabled={!!busy || done} onClick={() => run(f.id)}>
                        {busy === f.id ? <Spinner /> : done ? <Check className="size-4" /> : "Apply"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-ink-3">
                After applying, <Link href="/workspace/check" className="font-medium text-accent underline-offset-2 hover:underline">run the check again</Link> to see findings resolve.
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
