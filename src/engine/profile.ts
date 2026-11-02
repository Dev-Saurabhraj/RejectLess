import type { ApplicationVariant, BBox, DocTypeId, DocumentRecord, ExtractionMethod, FieldKey } from "./types";
import { DOC_TYPES } from "@/knowledge/documents";

export interface ProfileValue {
  key: FieldKey;
  source: "document" | "draft";
  docId?: string;
  docType?: DocTypeId;
  docLabel: string;
  value: string;
  confidence: number;
  page?: number;
  bbox?: BBox;
  method: ExtractionMethod;
  status: "extracted" | "confirmed" | "edited" | "entered";
}

export type Profile = Partial<Record<FieldKey, ProfileValue[]>>;

export const DRAFT_LABEL = "Your application details";

export function buildProfile(docs: DocumentRecord[], draft: Record<string, string>, variant?: ApplicationVariant): Profile {
  const profile: Profile = {};
  const push = (v: ProfileValue) => {
    (profile[v.key] ??= []).push(v);
  };
  for (const doc of docs) {
    if (doc.status === "failed" || doc.status === "processing" || doc.status === "uploaded") continue;
    const label = DOC_TYPES[doc.typeId]?.short ?? doc.fileName;
    for (const f of doc.fields) {
      if (!f.value) continue;
      push({
        key: f.key,
        source: "document",
        docId: doc.id,
        docType: doc.typeId,
        docLabel: label,
        value: f.value,
        confidence: f.confidence,
        page: f.page,
        bbox: f.bbox,
        method: f.method,
        status: f.status,
      });
    }
  }
  for (const def of variant?.draftFields ?? []) {
    const v = draft[def.key]?.trim();
    if (def.maps && v) {
      push({ key: def.maps, source: "draft", docLabel: DRAFT_LABEL, value: v, confidence: 1, method: "manual", status: "entered" });
    }
  }
  return profile;
}

export function firstValue(profile: Profile, key: FieldKey, preferDocs: DocTypeId[] = []): ProfileValue | undefined {
  const vals = profile[key] ?? [];
  for (const t of preferDocs) {
    const v = vals.find((x) => x.docType === t);
    if (v) return v;
  }
  return vals.find((v) => v.source === "document") ?? vals[0];
}
