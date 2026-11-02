import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleHelp, FileUp, Lock, MessageCircleQuestion, TriangleAlert, UserRound } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site";
import { btn } from "@/components/ui";

const steps = [
  { Icon: UserRound, title: "Tell us about you", body: "A few taps: who you are, where you live and what you're applying for." },
  { Icon: FileUp, title: "Add your documents", body: "One at a time. They're read on your phone or computer — never uploaded." },
  { Icon: MessageCircleQuestion, title: "Fix what's flagged", body: "See each problem in plain words, why it matters and how to fix it." },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-5 pb-16 pt-14 text-center sm:pt-24">
          <p className="rise inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[13px] text-ink-2">
            <span className="size-1.5 rounded-full bg-accent" /> For EPF withdrawals and scholarships
          </p>
          <h1 className="rise rise-2 mt-6 text-[40px] font-semibold leading-[1.08] tracking-tight sm:text-[56px]">
            Before you submit, make sure everything is right.
          </h1>
          <p className="rise rise-3 mx-auto mt-5 max-w-xl text-[18px] leading-relaxed text-ink-2">
            Answer a few questions, add your documents, and we&rsquo;ll tell you exactly what needs fixing — in plain language.
          </p>
          <div className="rise rise-4 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/start" className={btn("primary", "lg", "w-full px-7 sm:w-auto")}>
              Get started <ArrowRight className="size-4" />
            </Link>
            <Link href="/demo" className={btn("ghost", "lg", "w-full sm:w-auto")}>Try a demo first</Link>
          </div>
          <p className="rise rise-4 mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] text-ink-3">
            <span className="inline-flex items-center gap-1.5"><Lock className="size-3.5" /> No sign-up</span>
            <span>Documents stay on your device</span>
            <span>Free</span>
          </p>
        </section>

        {/* What you get: a glimpse of the result screen */}
        <section className="mx-auto max-w-md px-5 pb-20" aria-label="Example result">
          <div className="rise rise-4 rounded-2xl border border-line bg-surface p-5 shadow-[0_24px_60px_-34px_rgba(30,33,36,0.45)]">
            <p className="text-[13px] text-ink-3">Example result</p>
            <p className="mt-1 text-[20px] font-semibold">2 things to fix before you apply</p>
            <ul className="mt-4 space-y-2.5 text-left text-[14px]">
              <li className="flex items-start gap-3 rounded-xl bg-action-soft px-3.5 py-3">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-action" />
                <span><span className="font-medium">Your IFSC has changed.</span> <span className="text-ink-2">Your bank merged; use the new code.</span></span>
              </li>
              <li className="flex items-start gap-3 rounded-xl bg-review-soft px-3.5 py-3">
                <CircleHelp className="mt-0.5 size-4 shrink-0 text-review" />
                <span><span className="font-medium">Name spelt differently.</span> <span className="text-ink-2">Saurabh on Aadhaar, Sourabh at the bank.</span></span>
              </li>
              <li className="flex items-center gap-3 px-3.5 py-1 text-ink-3">
                <CheckCircle2 className="size-4 shrink-0 text-pass" /> 17 other checks passed
              </li>
            </ul>
          </div>
        </section>

        <section id="how" className="scroll-mt-20 border-t border-line bg-surface">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <h2 className="text-center text-[28px] font-semibold tracking-tight">How it works</h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3">
              {steps.map(({ Icon, title, body }, i) => (
                <li key={title} className="text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <p className="mt-4 text-[13px] font-medium text-ink-3">Step {i + 1}</p>
                  <p className="mt-1 text-[17px] font-semibold">{title}</p>
                  <p className="mx-auto mt-2 max-w-[260px] text-[14px] leading-relaxed text-ink-2">{body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-12 text-center">
              <Link href="/start" className={btn("primary", "lg")}>
                Get started <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-14 text-center">
          <Lock className="mx-auto size-5 text-accent" />
          <p className="mt-3 text-[17px] font-medium">Your documents never leave your device.</p>
          <p className="mx-auto mt-2 max-w-lg text-[14px] leading-relaxed text-ink-2">
            Everything is read in your browser. The optional AI helper only sees a summary — never your documents, names or numbers.{" "}
            <Link href="/privacy" className="font-medium text-accent hover:underline">How we protect you</Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
