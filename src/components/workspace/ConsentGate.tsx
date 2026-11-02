"use client";

import { useRouter } from "next/navigation";
import { Cpu, Download, FileLock2, Timer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useActiveSession } from "@/lib/hooks";
import { useSession } from "@/lib/store/session";
import { DOC_TYPES, FIELD_LABELS } from "@/knowledge/documents";

export function ConsentGate() {
  const { session, variant } = useActiveSession();
  const consent = useSession((s) => s.consent);
  const setConsent = useSession((s) => s.setConsent);
  const router = useRouter();
  if (!session || !variant || consent.processing || session.demoScenarioId) return null;

  const fields = Array.from(new Set(variant.documents.flatMap((d) => DOC_TYPES[d.docType].fields)));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal aria-labelledby="consent-title">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-surface shadow-2xl sm:rounded-2xl">
        <div className="p-6 sm:p-7">
          <h2 id="consent-title" className="text-[20px] font-semibold">Before we read your documents</h2>
          <p className="mt-2 text-[14px] text-ink-2">Here is exactly what happens to them. Nothing starts until you agree.</p>

          <ul className="mt-5 space-y-4 text-[14px]">
            <li className="flex gap-3">
              <Cpu className="mt-0.5 size-5 shrink-0 text-accent" />
              <div>
                <p className="font-medium">Processed in this browser</p>
                <p className="text-ink-3">Text recognition and all checks run on your device. Your documents are not uploaded to RejectLess or anyone else.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <FileLock2 className="mt-0.5 size-5 shrink-0 text-accent" />
              <div>
                <p className="font-medium">Only the details this application needs</p>
                <p className="text-ink-3">
                  We extract: {fields.map((f) => FIELD_LABELS[f].toLowerCase()).join(", ")}. For Aadhaar, only the last 4 digits are kept. Why each document is needed is shown in your checklist.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Download className="mt-0.5 size-5 shrink-0 text-accent" />
              <div>
                <p className="font-medium">One external download</p>
                <p className="text-ink-3">
                  For photos and scans, the open-source text-recognition engine (Tesseract) and its English/Hindi language files are downloaded once from the jsDelivr CDN. No document data is sent with that download.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Timer className="mt-0.5 size-5 shrink-0 text-accent" />
              <div>
                <p className="font-medium">Kept for 24 hours of inactivity</p>
                <p className="text-ink-3">
                  Extracted details and small page previews (for showing evidence) are stored in this browser. Original files are not kept after processing.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Trash2 className="mt-0.5 size-5 shrink-0 text-accent" />
              <div>
                <p className="font-medium">Delete any time</p>
                <p className="text-ink-3">The Privacy Centre deletes the session, previews and extracted details from this browser.</p>
              </div>
            </li>
          </ul>
          <p className="mt-5 rounded-lg bg-surface-2 p-3 text-[13px] text-ink-3">
            The AI assistant is off unless you turn it on separately. Even then it receives only a privacy-safe summary of your findings.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-line p-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => router.push("/apply")}>Not now</Button>
          <Button onClick={() => setConsent({ processing: new Date().toISOString() })}>I agree — process my documents locally</Button>
        </div>
      </div>
    </div>
  );
}
