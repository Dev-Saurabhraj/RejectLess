"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, FileUp, Languages, Search, ShieldCheck, Sparkles } from "lucide-react";
import clsx from "clsx";
import { Button, Spinner } from "@/components/ui";
import { decodeRejection, decodeWithAi, readNotice, redactNotice, type AiDecoded, type Decoded } from "@/lib/rejection";
import { REJECTION_REASONS } from "@/knowledge/rejections";
import { getRule } from "@/knowledge/rules";
import { verificationsFor } from "@/knowledge/verifications";
import { APPLICATIONS } from "@/knowledge/applications";
import { useActiveSession } from "@/lib/hooks";
import { useSession } from "@/lib/store/session";
import { aiStatus } from "@/lib/assistant/assistant";

/**
 * Upload or paste a rejection notice. Two readings, both shown:
 *  1. deterministic — the notice is OCR'd on device and matched against known reasons;
 *  2. AI (opt-in) — the REDACTED text plus the known-reason catalogue go to the AI route, which
 *     returns a plain-language reading in English and Hindi, mapped back to known reasons.
 */
export function RejectionDecoder({ onAskAi }: { onAskAi?: (question: string) => void }) {
  const { session } = useActiveSession();
  const consent = useSession((s) => s.consent);
  const setConsent = useSession((s) => s.setConsent);
  const [appId, setAppId] = useState<string | undefined>(session?.appId);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string>();
  const [result, setResult] = useState<Decoded[]>();
  const [ai, setAi] = useState<AiDecoded>();
  const [aiError, setAiError] = useState<string>();
  const [sent, setSent] = useState<{ text: string; removed: number }>();
  const [showSent, setShowSent] = useState(false);
  const [hindi, setHindi] = useState(false);
  const [status, setStatus] = useState<{ enabled: boolean; model?: string }>({ enabled: false });
  const [askConsent, setAskConsent] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const verifications = appId ? verificationsFor(appId, session?.profile?.state) : [];
  const aiOn = !!consent.ai && status.enabled;

  useEffect(() => {
    void aiStatus().then(setStatus);
  }, []);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setBusy("Reading the notice on your device…");
    try {
      const r = await readNotice(f);
      setText(r.text);
      await decode(r.text);
    } catch (e) {
      setResult([]);
      alert((e as Error).message);
    } finally {
      setBusy(undefined);
    }
  }

  async function decode(t: string) {
    const local = decodeRejection(t, appId);
    setResult(local);
    setAi(undefined);
    setAiError(undefined);
    if (!aiOn) return;
    await runAi(t);
  }

  async function runAi(t: string) {
    const red = redactNotice(t, session);
    setSent(red);
    setBusy("Asking the AI to read the (redacted) notice…");
    try {
      setAi(await decodeWithAi(red.text, appId));
    } catch (e) {
      setAiError((e as Error).message);
    } finally {
      setBusy(undefined);
    }
  }

  const knownById = (id: string | null) => (id ? REJECTION_REASONS.find((r) => r.id === id) : undefined);

  return (
    <div className="space-y-4 text-[14px]">
      <p className="text-ink-2">Upload the rejection letter, returned-claim message or notice (photo, screenshot or PDF) — or paste its text. It is read on this device and matched against known reasons; with AI on, a redacted copy is also explained by the AI.</p>
      <label className="block">
        <span className="font-semibold">Which application?</span>
        <select value={appId ?? ""} onChange={(e) => setAppId(e.target.value || undefined)} className="mt-1 h-10 w-full border border-line-strong bg-surface px-2">
          <option value="">Any</option>
          {APPLICATIONS.filter((a) => a.status === "available").map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => input.current?.click()} disabled={!!busy}><FileUp className="size-4" /> Upload the notice</Button>
        <input ref={input} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => (onFile(e.target.files?.[0]), (e.target.value = ""))} />
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="…or paste the text of the notice here" className="w-full border border-line-strong px-3 py-2" />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => decode(text)} disabled={!text.trim() || !!busy}><Search className="size-4" /> Decode</Button>
        <button onClick={() => setHindi(!hindi)} className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent underline underline-offset-2"><Languages className="size-3.5" /> {hindi ? "English" : "हिंदी में"}</button>
        {busy && <span className="inline-flex items-center gap-2 text-ink-3"><Spinner /> {busy}</span>}
      </div>

      {/* AI mode switch, mirroring the assistant's consent */}
      <div className="border border-line bg-surface-2 px-3 py-2 text-[13px]">
        {aiOn ? (
          <p className="inline-flex items-center gap-1.5 text-pass"><Sparkles className="size-3.5" /> AI reading is on ({status.model}). Only a redacted copy of the notice is sent.</p>
        ) : status.enabled ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>AI reading is off — results below are from the known-reason catalogue only.</span>
            <Button size="sm" variant="secondary" onClick={() => setAskConsent(true)}><Sparkles className="size-3.5" /> Turn on AI reading</Button>
          </div>
        ) : (
          <span className="text-ink-3">AI reading is not configured on this server (no GROQ_API_KEY); catalogue matching still works.</span>
        )}
        {askConsent && (
          <div className="mt-2 border border-external/25 bg-external-soft p-3 text-[#24406a]">
            <p className="font-semibold">What is sent to the AI</p>
            <p className="mt-1">The notice text after redaction — names, Aadhaar/PAN/UAN/account/claim numbers, phones, emails and dates are replaced with tags — plus our list of known reasons. Never the image, never your documents. You can see the exact text sent after each decode.</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => { setConsent({ ai: new Date().toISOString() }); setAskConsent(false); if (text.trim()) void runAi(text); }}>Turn on</Button>
              <Button size="sm" variant="ghost" onClick={() => setAskConsent(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* 1. AI reading */}
      {aiError && <p className="border border-review/30 bg-review-soft px-3 py-2 text-[#5f3a05]">{aiError}</p>}
      {ai && (
        <section className="gov-panel">
          <div className="gov-panel-head"><Sparkles className="size-4" /> AI reading <span className="ml-auto text-[11px] font-normal opacity-80">confidence: {ai.confidence}</span></div>
          <div className="space-y-3 p-4">
            <p className={clsx(hindi && "font-dev")}>{hindi ? ai.summaryHi || ai.summary : ai.summary}</p>
            {ai.deadline && <p className="border-l-4 border-saffron bg-saffron-soft px-3 py-2 text-[13px]"><span className="font-semibold">Deadline mentioned: </span>{ai.deadline}</p>}
            <ol className="space-y-3">
              {ai.reasons.map((r, i) => {
                const k = knownById(r.knownId);
                return (
                  <li key={i} className="border border-line p-3">
                    <p className="font-semibold">{hindi ? r.titleHi || r.title : r.title}</p>
                    <p className={clsx("mt-1 text-ink-2", hindi && "font-dev")}>{hindi ? r.meaningHi || r.meaning : r.meaning}</p>
                    {r.evidence && <p className="mt-1 text-[12px] text-ink-3">From the notice: “{r.evidence}”</p>}
                    {k ? (
                      <>
                        <p className="mt-2 inline-flex items-center gap-1 text-[12px] text-pass"><ShieldCheck className="size-3.5" /> Matches a verified reason: {k.title}</p>
                        <ol className="mt-1 list-decimal space-y-1 pl-5 text-ink-2">{k.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                      </>
                    ) : (
                      <>
                        <p className="mt-2 text-[12px] text-review">AI reading — not in our verified catalogue; confirm on the portal.</p>
                        {r.steps.length > 0 && <ol className="mt-1 list-decimal space-y-1 pl-5 text-ink-2">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol>}
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
            {sent && (
              <div className="text-[12px]">
                <button onClick={() => setShowSent(!showSent)} className="inline-flex items-center gap-1 text-ink-3 underline-offset-2 hover:underline">
                  <ChevronDown className={clsx("size-3 transition-transform", showSent && "rotate-180")} /> {showSent ? "Hide" : "Show"} exactly what was sent ({sent.removed} item{sent.removed === 1 ? "" : "s"} masked)
                </button>
                {showSent && <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap bg-ink p-3 text-[11px] leading-snug text-white/90">{sent.text}</pre>}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. Catalogue matches */}
      {result && result.length === 0 && !ai && (
        <div className="border border-line bg-surface-2 p-4">
          <p className="font-semibold">No known rejection reason matched.</p>
          <p className="mt-1 text-ink-2">{aiOn ? "The AI reading above is all we have for this wording." : "Turn on AI reading to have the notice explained, or ask the assistant."} The text was read on this device.</p>
          {onAskAi && text.trim() && !aiOn && (
            <Button size="sm" className="mt-3" onClick={() => onAskAi(`My ${appId ?? "application"} was rejected with this message: "${text.slice(0, 400)}". What does it mean and what should I do?`)}>
              Ask the assistant (names and numbers are removed first)
            </Button>
          )}
        </div>
      )}

      {result && result.length > 0 && (
        <section>
          <p className="mb-2 inline-flex items-center gap-1.5 font-bold text-accent"><ShieldCheck className="size-4" /> Matched known reasons ({result.length})</p>
          <ol className="space-y-3">
            {result.map(({ reason, evidence }, i) => (
              <li key={reason.id} className="gov-panel">
                <div className="gov-panel-head">{i + 1}. {hindi ? reason.titleHi : reason.title}</div>
                <div className="space-y-2 p-4">
                  <p className={clsx("text-ink-2", hindi && "font-dev")}>{hindi ? reason.meaningHi : reason.meaning}</p>
                  <p className="text-[12px] text-ink-3">Found in the notice: {evidence.map((e) => `“${e.slice(0, 90)}”`).join(" · ")}</p>
                  <p className="font-semibold">{hindi ? "क्या करें" : "What to do"}</p>
                  <ol className="list-decimal space-y-1 pl-5 text-ink-2">
                    {reason.steps.map((s) => <li key={s}>{s}</li>)}
                  </ol>
                  {reason.verifyIds?.length ? (
                    <ul className="space-y-1 text-[13px]">
                      {reason.verifyIds.map((vid) => {
                        const v = verifications.find((x) => x.id === vid);
                        return v ? (
                          <li key={vid}>
                            <a href={v.portal.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-accent underline underline-offset-2">{v.title} <ExternalLink className="size-3.5" /></a> — {v.enter}
                          </li>
                        ) : null;
                      })}
                    </ul>
                  ) : null}
                  <p className="text-[12px] text-ink-3">
                    RejectLess checks for this as {reason.ruleIds.map((id) => `${getRule(id)?.title ?? id} (${id})`).join(", ")}. {reason.basis === "secondary" ? "Wording as commonly seen; confirm on the portal." : ""} Run a new check after fixing it.
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
