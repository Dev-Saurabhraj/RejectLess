"use client";

import clsx from "clsx";
import type { DocStatus } from "@/engine/types";
import { Spinner } from "@/components/ui";

const META: Record<DocStatus | "missing", { label: string; cls: string }> = {
  missing: { label: "Not provided", cls: "text-ink-3 bg-black/[0.04]" },
  uploaded: { label: "Uploaded", cls: "text-ink-2 bg-black/[0.05]" },
  processing: { label: "Processing", cls: "text-external bg-external-soft" },
  analysed: { label: "Analysed", cls: "text-pass bg-pass-soft" },
  needs_attention: { label: "Needs attention", cls: "text-review bg-review-soft" },
  failed: { label: "Could not read", cls: "text-action bg-action-soft" },
};

export function DocStatusPill({ status, stage }: { status: DocStatus | "missing"; stage?: string }) {
  const m = META[status];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap", m.cls)}>
      {status === "processing" && <Spinner className="size-3 border-[1.5px]" />}
      {status === "processing" && stage ? stage : m.label}
    </span>
  );
}
