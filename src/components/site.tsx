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
    <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Logo />
        <nav className="flex items-center gap-1 text-[14px] text-ink-2">
          <Link className="hidden rounded-lg px-3 py-2 hover:bg-black/[0.04] sm:block" href="/#how">How it works</Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-black/[0.04]" href="/demo">Demo</Link>
          <Link className="hidden rounded-lg px-3 py-2 hover:bg-black/[0.04] sm:block" href="/privacy">Privacy</Link>
          <Link href="/start" className={btn("primary", "sm", "ml-2")}>Get started</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-8 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md">An independent preparation tool — not a government service. It never submits applications or promises approval.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/about" className="hover:text-ink">About</Link>
          <Link href="/about#methodology" className="hover:text-ink">Sources</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/about#terms" className="hover:text-ink">Terms</Link>
          <Link href="/apply" className="hover:text-ink">All applications</Link>
        </nav>
      </div>
    </footer>
  );
}
