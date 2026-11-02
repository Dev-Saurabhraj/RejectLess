import Link from "next/link";
import { ArrowRight, FileSearch, GitCompareArrows, Languages, Lock, ScrollText, ShieldCheck, Trash2, Laptop } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site";
import { btn, Card, Eyebrow } from "@/components/ui";

const steps = [
  { n: "1", title: "Choose your application", body: "Pick what you are applying for. We show exactly what will be checked — before you share anything." },
  { n: "2", title: "Add your documents", body: "Upload PDFs or photos. They are read inside your browser, not uploaded to a server." },
  { n: "3", title: "Run the readiness check", body: "Every document is compared with the others and with the rules for your application." },
  { n: "4", title: "Fix what needs fixing", body: "Each issue explains why it matters, shows the evidence, and tells you how to correct it." },
  { n: "5", title: "Get your report", body: "Download a readiness report to take with you — to the portal, the bank or a help centre." },
];

const why = [
  { Icon: ScrollText, title: "Application-specific checks", body: "Rules for each claim type, with sources and dates. Rules we could not confirm officially are marked \"Verify\"." },
  { Icon: GitCompareArrows, title: "Cross-document comparison", body: "Your name, date of birth and bank details are compared across every document — and with what you plan to enter." },
  { Icon: Languages, title: "Understands Indian names", body: "Saurabh or Sourabh, सौरभ or Saurabh: spelling and script variations are explained, not just flagged." },
  { Icon: FileSearch, title: "Evidence for every finding", body: "See which document, which field and which page produced each result." },
  { Icon: ShieldCheck, title: "Honest about limits", body: "We separate format checks from things only EPFO, NSP or your bank can confirm." },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pt-20">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[13px] text-ink-2">
              <span className="size-1.5 rounded-full bg-accent" /> Now supporting EPF withdrawals and the Central Sector Scholarship
            </p>
            <h1 className="text-[38px] font-semibold leading-[1.08] tracking-tight sm:text-[52px]">
              Before you submit, make sure everything is right.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2">
              Check your documents, catch inconsistencies and understand what needs fixing before submitting your application.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/apply" className={btn("primary", "lg")}>
                Check my application <ArrowRight className="size-4" />
              </Link>
              <Link href="/demo" className={btn("secondary", "lg")}>Explore the demo</Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-[13px] text-ink-3">
              <Lock className="size-3.5" /> No sign-up. Documents stay on your device.
            </p>
          </div>

          {/* Product glimpse — a real finding layout, not a fake dashboard */}
          <Card className="overflow-hidden shadow-[0_24px_60px_-30px_rgba(30,33,36,0.35)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <div>
                <p className="text-[13px] font-medium">EPF final settlement · Form 19</p>
                <p className="text-[12px] text-ink-3">Example finding</p>
              </div>
              <span className="rounded-full bg-review-soft px-2.5 py-0.5 text-[12px] font-medium text-review">Needs review</span>
            </div>
            <div className="space-y-4 px-5 py-5">
              <p className="font-medium">Possible name variation</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[14px]">
                <span className="text-ink-3">Aadhaar</span>
                <span>Saurabh Kumar</span>
                <span className="text-ink-3">Bank passbook</span>
                <span>
                  S<mark className="rounded bg-review-soft px-0.5 text-review">ou</mark>rabh Kumar
                </span>
                <span className="text-ink-3">PAN</span>
                <span>Saurabh Kumar</span>
              </div>
              <p className="rounded-lg bg-surface-2 p-3 text-[13px] leading-relaxed text-ink-2">
                &ldquo;au&rdquo; and &ldquo;ou&rdquo; are common spellings of the same sound. This often isn&rsquo;t a different person — but EPFO matches bank and
                Aadhaar names, so confirm which spelling is correct.
              </p>
              <p className="text-[13px] text-ink-3">
                Next step: ask your bank branch to correct the name using your Aadhaar.
              </p>
            </div>
          </Card>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-2 max-w-2xl text-[30px] font-semibold tracking-tight">Find problems while they are still easy to fix.</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-5">
              {steps.map((s) => (
                <li key={s.n} className="relative">
                  <span className="flex size-8 items-center justify-center rounded-full border border-line-strong bg-bg text-[13px] font-semibold">{s.n}</span>
                  <p className="mt-3 font-medium">{s.title}</p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-3">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Why */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Eyebrow>Why RejectLess</Eyebrow>
          <h2 className="mt-2 max-w-2xl text-[30px] font-semibold tracking-tight">Built around the mistakes that actually get applications returned.</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {why.map(({ Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-3">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <Card className="grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_1.2fr]">
            <div>
              <Eyebrow>Privacy</Eyebrow>
              <h2 className="mt-2 text-[28px] font-semibold tracking-tight">Your documents are yours.</h2>
              <p className="mt-3 text-ink-2 leading-relaxed">
                RejectLess was designed so that it does not need your documents on a server. Here is what that means in practice.
              </p>
              <Link href="/privacy" className={btn("secondary", "md", "mt-6")}>Open the Privacy Centre</Link>
            </div>
            <ul className="space-y-5 text-[15px]">
              <li className="flex gap-3">
                <Laptop className="mt-0.5 size-5 shrink-0 text-accent" />
                <span><strong className="font-medium">Processed in your browser.</strong> Text recognition and every check run on your device.</span>
              </li>
              <li className="flex gap-3">
                <Lock className="mt-0.5 size-5 shrink-0 text-accent" />
                <span><strong className="font-medium">Only what is needed.</strong> We extract only the fields your application needs, and keep only the last 4 digits of your Aadhaar.</span>
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" />
                <span><strong className="font-medium">AI is optional.</strong> If you turn on the AI assistant, it receives a summary of your findings — never your documents, names or numbers.</span>
              </li>
              <li className="flex gap-3">
                <Trash2 className="mt-0.5 size-5 shrink-0 text-accent" />
                <span><strong className="font-medium">Delete any time.</strong> Sessions expire after 24 hours of inactivity, and you can delete everything with one click.</span>
              </li>
            </ul>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
