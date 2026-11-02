import Link from "next/link";
import { btn } from "./ui";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 font-semibold tracking-tight text-ink ${className}`} aria-label="RejectLess home">
      <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
        <rect x="1" y="1" width="26" height="26" rx="8" fill="var(--accent)" />
        <path d="M8 14.5l4 4 8-9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[17px]">RejectLess</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 text-[14px] text-ink-2 md:flex">
          <Link className="rounded-lg px-3 py-2 hover:bg-black/[0.04]" href="/#how">How it works</Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-black/[0.04]" href="/apply">Applications</Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-black/[0.04]" href="/privacy">Privacy</Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-black/[0.04]" href="/demo">Demo</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/demo" className={btn("ghost", "sm", "md:hidden")}>Demo</Link>
          <Link href="/apply" className={btn("primary", "sm")}>Check my application</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-[14px] sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-ink-3">
            An independent preparation tool. Not affiliated with EPFO, NSP or any government body. It does not submit applications or guarantee approval.
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-medium">Product</p>
          <ul className="space-y-1.5 text-ink-3">
            <li><Link href="/#how" className="hover:text-ink">How it works</Link></li>
            <li><Link href="/apply" className="hover:text-ink">Supported applications</Link></li>
            <li><Link href="/demo" className="hover:text-ink">Demo sandbox</Link></li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="font-medium">Trust</p>
          <ul className="space-y-1.5 text-ink-3">
            <li><Link href="/privacy" className="hover:text-ink">Privacy Centre</Link></li>
            <li><Link href="/about#methodology" className="hover:text-ink">Methodology & sources</Link></li>
            <li><Link href="/about#terms" className="hover:text-ink">Terms</Link></li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="font-medium">About</p>
          <ul className="space-y-1.5 text-ink-3">
            <li><Link href="/about" className="hover:text-ink">About RejectLess</Link></li>
            <li><Link href="/about#limitations" className="hover:text-ink">Limitations</Link></li>
            <li><Link href="/about#feedback" className="hover:text-ink">Feedback</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
