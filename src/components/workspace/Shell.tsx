"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { ReactNode } from "react";
import { FlaskConical, MessageCircleQuestion, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/site";
import { btn, Spinner } from "@/components/ui";
import { useActiveSession } from "@/lib/hooks";
import { useUi } from "@/lib/store/ui";
import { isOpenIssue } from "@/engine/run";
import { ConsentGate } from "./ConsentGate";
import { AssistantPanel } from "./AssistantPanel";
import { DemoGuide } from "./DemoGuide";

const STAGES = [
  { href: "/workspace", label: "Prepare" },
  { href: "/workspace/review", label: "Review documents" },
  { href: "/workspace/profile", label: "Profile" },
  { href: "/workspace/check", label: "Check" },
  { href: "/workspace/findings", label: "Findings" },
  { href: "/workspace/report", label: "Report" },
];

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { session, hydrated, app, variant, latestRun } = useActiveSession();
  const openAssistant = useUi((s) => s.openAssistant);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-ink-3">
        <Spinner /> Loading your session from this browser…
      </div>
    );
  }

  if (!session || !app || !variant) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-line">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
            <Logo />
          </div>
        </header>
        <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-6 py-20 text-center">
          <p className="text-[22px] font-semibold">No active session</p>
          <p className="mt-2 text-ink-2">
            Sessions live only in this browser and expire after 24 hours of inactivity — or were deleted. Start a new check or try the demo.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/apply" className={btn("primary")}>Start a new check</Link>
            <Link href="/demo" className={btn("secondary")}>Open the demo</Link>
          </div>
        </main>
      </div>
    );
  }

  const openIssues = latestRun?.findings.filter(isOpenIssue).length ?? 0;
  const analysed = session.documents.filter((d) => d.status === "analysed" || d.status === "needs_attention").length;
  const badge: Record<string, string | undefined> = {
    "/workspace": session.documents.length ? `${analysed}/${session.documents.length}` : undefined,
    "/workspace/findings": latestRun ? String(openIssues) : undefined,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Logo className="shrink-0 [&>span]:hidden sm:[&>span]:inline" />
          <span className="hidden h-5 w-px bg-line-strong sm:block" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium leading-tight">
              {app.shortName} · {variant.name}
            </p>
            <p className="truncate text-[12px] text-ink-3 tabular">
              Session {session.id}
              {session.demoScenarioId && <span className="ml-2 font-medium text-external">Demo · fictional data</span>}
            </p>
          </div>
          <span className="hidden sm:block">
            <Link href="/privacy" className={btn("ghost", "sm")}>
              <ShieldCheck className="size-4" /> Privacy
            </Link>
          </span>
          <button onClick={() => openAssistant()} className={btn("secondary", "sm")}>
            <MessageCircleQuestion className="size-4" /> <span className="hidden sm:inline">Ask</span>
          </button>
        </div>
        <nav aria-label="Workspace stages" className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
          <ol className="flex min-w-max gap-1 pb-2">
            {STAGES.map((s, i) => {
              const active = s.href === "/workspace" ? pathname === "/workspace" : pathname.startsWith(s.href);
              return (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                      active ? "bg-ink text-white" : "text-ink-2 hover:bg-black/[0.05]",
                    )}
                  >
                    <span className={clsx("tabular text-[11px]", active ? "text-white/70" : "text-ink-3")}>{i + 1}</span>
                    {s.label}
                    {badge[s.href] && (
                      <span className={clsx("rounded-full px-1.5 text-[11px] tabular", active ? "bg-white/20" : "bg-black/[0.06]")}>{badge[s.href]}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="border-t border-line py-4 text-center text-[12px] text-ink-3">
        RejectLess is an independent preparation tool — not a government service. It does not submit applications or guarantee approval.
        {session.demoScenarioId && (
          <span className="ml-1 inline-flex items-center gap-1 text-external">
            <FlaskConical className="size-3" /> All data in this session is fictional.
          </span>
        )}
      </footer>

      <ConsentGate />
      <AssistantPanel />
      {session.demoScenarioId && <DemoGuide />}
    </div>
  );
}
