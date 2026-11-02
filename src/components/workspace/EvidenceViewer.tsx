"use client";

import clsx from "clsx";
import { ImageOff } from "lucide-react";
import type { BBox } from "@/engine/types";
import { usePreviewUrl } from "@/lib/hooks";
import { Spinner } from "@/components/ui";

export interface Highlight {
  bbox: BBox;
  label: string;
  active?: boolean;
  tone?: "accent" | "review" | "action";
}

export function EvidenceViewer({ docId, page = 1, version = 0, highlights = [], className }: { docId: string; page?: number; version?: number; highlights?: Highlight[]; className?: string }) {
  const url = usePreviewUrl(docId, page, version);
  if (!url) {
    return (
      <div className={clsx("flex aspect-[4/3] items-center justify-center rounded-xl border border-line bg-surface-2 text-[13px] text-ink-3", className)}>
        <Spinner className="mr-2" /> Loading preview…
      </div>
    );
  }
  return (
    <div className={clsx("relative overflow-hidden rounded-xl border border-line bg-surface-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Document preview (stored only in this browser)" className="block h-auto w-full select-none" draggable={false} />
      {highlights.map((h, i) => (
        <div
          key={i}
          className={clsx(
            "pointer-events-none absolute rounded-[3px] transition-all",
            h.active ? "ring-2 ring-offset-1" : "ring-1",
            h.tone === "action" ? "bg-action/15 ring-action" : h.tone === "review" ? "bg-review/15 ring-review" : "bg-accent/12 ring-accent",
            !h.active && "opacity-60",
          )}
          style={{
            left: `${Math.max(0, h.bbox.x * 100 - 0.4)}%`,
            top: `${Math.max(0, h.bbox.y * 100 - 0.4)}%`,
            width: `${h.bbox.w * 100 + 0.8}%`,
            height: `${h.bbox.h * 100 + 0.8}%`,
          }}
          title={h.label}
        />
      ))}
    </div>
  );
}

export function NoPreview() {
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-[13px] text-ink-3">
      <ImageOff className="size-5" /> No preview available
    </div>
  );
}
