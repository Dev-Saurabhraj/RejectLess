"use client";

import type { DocTypeId, DocumentRecord } from "@/engine/types";
import { newId, savePreviews, transientLines, useSession } from "@/lib/store/session";
import { processFile } from "@/lib/ingest/pipeline";
import { reExtract } from "@/lib/ingest/pipeline";
import { DOC_TYPES } from "@/knowledge/documents";
import { getApplication } from "@/knowledge/applications";
import type { Fix, Scenario } from "@/demo/scenarios";

// One document at a time: OCR is memory-heavy, especially on phones.
let queue: Promise<unknown> = Promise.resolve();
const progressListeners = new Set<(docId: string, stage: string) => void>();

export function onDocProgress(fn: (docId: string, stage: string) => void) {
  progressListeners.add(fn);
  return () => {
    progressListeners.delete(fn);
  };
}

function emit(docId: string, stage: string) {
  progressListeners.forEach((fn) => fn(docId, stage));
}

export function addFiles(files: File[], opts: { forcedType?: DocTypeId; synthetic?: boolean; replaceId?: string } = {}): Promise<void>[] {
  const store = useSession.getState();
  if (!store.session) throw new Error("No active session");
  return files.map((file) => {
    const existing = opts.replaceId ? store.session!.documents.find((d) => d.id === opts.replaceId) : undefined;
    const id = existing?.id ?? newId("doc");
    const placeholder: DocumentRecord = {
      id,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      typeId: opts.forcedType ?? existing?.typeId ?? "unknown",
      typeConfidence: 0,
      typeSource: opts.forcedType ? "user" : "auto",
      status: "processing",
      pageCount: 0,
      pageSizes: [],
      fields: [],
      missingFields: [],
      addedAt: new Date().toISOString(),
      version: (existing?.version ?? 0) + 1,
      synthetic: !!opts.synthetic,
    };
    if (existing) store.updateDocument(id, placeholder);
    else store.addDocument(placeholder);

    const job = queue.then(async () => {
      try {
        const res = await processFile(file, opts.forcedType, (stage) => emit(id, stage));
        await savePreviews(id, res.previews);
        transientLines.set(id, { lines: res.lines, method: res.record.textMethod === "text-layer" ? "text-layer" : "ocr", typeId: res.record.typeId });
        useSession.getState().updateDocument(id, { ...res.record });
        useSession.getState().log(
          `${existing ? "Replaced" : "Added"} ${DOC_TYPES[res.record.typeId].short} (${res.record.textMethod === "text-layer" ? "digital PDF" : "text recognition"}, ${res.record.fields.length} fields)`,
        );
      } catch (e) {
        useSession.getState().updateDocument(id, { status: "failed", error: (e as Error).message || "This file could not be processed." });
      } finally {
        emit(id, "");
      }
    });
    queue = job.catch(() => undefined);
    return job;
  });
}

/** Changes the document type and re-extracts from in-memory text (if still available). */
export function changeDocType(docId: string, typeId: DocTypeId): boolean {
  const t = transientLines.get(docId);
  if (!t) return false;
  const { fields, missingFields } = reExtract(t.lines, typeId, t.method);
  transientLines.set(docId, { ...t, typeId });
  useSession.getState().updateDocument(docId, {
    typeId,
    typeSource: "user",
    typeConfidence: 1,
    fields,
    missingFields,
    status: missingFields.length ? "needs_attention" : "analysed",
  });
  useSession.getState().log(`Document type set to ${DOC_TYPES[typeId].short}`);
  return true;
}

export async function loadScenario(s: Scenario) {
  const app = getApplication(s.appId)!;
  const store = useSession.getState();
  store.startSession(app.id, s.variantId, s.id);
  store.setDraftAll({ ...s.draft });
  const { specToFile } = await import("@/demo/package");
  const files = [];
  for (const spec of s.docs) files.push(await specToFile(spec));
  return Promise.all(addFiles(files, { synthetic: true }));
}

export async function applyFix(fix: Fix) {
  const store = useSession.getState();
  if (!store.session) return;
  if (fix.draftPatch) {
    store.setDraftAll({ ...store.session.draft, ...fix.draftPatch });
    store.log(`Updated application details: ${Object.keys(fix.draftPatch).join(", ")}`);
  }
  if (fix.doc) {
    const { specToFile } = await import("@/demo/package");
    const file = await specToFile(fix.doc);
    const target = fix.replaces ? store.session.documents.find((d) => d.typeId === fix.replaces) : undefined;
    await Promise.all(addFiles([file], { synthetic: true, replaceId: target?.id }));
  }
}
