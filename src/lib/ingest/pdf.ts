"use client";

import type { TextLine } from "@/engine/types";
import { repairVisualOrder } from "@/engine/text/devanagariRepair";
import { createCanvas } from "./raster";

type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;

function getPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((m) => {
      // Served from /public (copied at install time) so it runs same-origin.
      m.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return m;
    });
  }
  return pdfjsPromise;
}

export interface PdfPage {
  canvas: HTMLCanvasElement;
  lines: TextLine[];
  width: number;
  height: number;
}

export const MAX_PDF_PAGES = 4;

export async function readPdf(data: ArrayBuffer): Promise<{ pages: PdfPage[]; totalPages: number }> {
  const pdfjs = await getPdfJs();
  const task = pdfjs.getDocument({ data: new Uint8Array(data) });
  let doc;
  try {
    doc = await task.promise;
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (/password/i.test(msg)) throw new Error("This PDF is password-protected. Please upload an unprotected copy.");
    throw new Error("This PDF could not be opened. It may be corrupted.");
  }
  const pages: PdfPage[] = [];
  const n = Math.min(doc.numPages, MAX_PDF_PAGES);
  for (let p = 1; p <= n; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // "print" intent renders without requestAnimationFrame, so processing continues
    // when the tab is in the background (rAF is paused there).
    await page.render({ canvas, canvasContext: ctx, viewport, intent: "print" }).promise;

    const tc = await page.getTextContent();
    const W = viewport.width;
    const H = viewport.height;
    const raw: TextLine[] = [];
    for (const item of tc.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
      const fontH = Math.hypot(item.transform[2], item.transform[3]) * viewport.scale;
      const w = item.width * viewport.scale;
      raw.push({
        text: repairVisualOrder(item.str),
        page: p,
        confidence: 0.99,
        bbox: { x: x / W, y: (y - fontH) / H, w: w / W, h: (fontH * 1.25) / H },
      });
    }
    pages.push({ canvas, lines: mergeLines(raw), width: W, height: H });
    page.cleanup();
  }
  const totalPages = doc.numPages;
  await task.destroy();
  return { pages, totalPages };
}

/** Joins text items that sit on the same baseline into a single line (left to right). */
function mergeLines(items: TextLine[]): TextLine[] {
  const sorted = [...items].sort((a, b) => a.bbox.y - b.bbox.y || a.bbox.x - b.bbox.x);
  const lines: TextLine[][] = [];
  for (const it of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last[0].bbox.y - it.bbox.y) < it.bbox.h * 0.4) last.push(it);
    else lines.push([it]);
  }
  return lines.map((group) => {
    group.sort((a, b) => a.bbox.x - b.bbox.x);
    // Items far apart on the same row are kept as separate lines (two-column layouts).
    const out: TextLine[] = [];
    for (const it of group) {
      const prev = out[out.length - 1];
      if (prev && it.bbox.x - (prev.bbox.x + prev.bbox.w) < 0.04) {
        const x2 = Math.max(prev.bbox.x + prev.bbox.w, it.bbox.x + it.bbox.w);
        prev.text = `${prev.text} ${it.text}`;
        prev.bbox = { ...prev.bbox, w: x2 - prev.bbox.x, h: Math.max(prev.bbox.h, it.bbox.h) };
      } else out.push({ ...it });
    }
    return out;
  }).flat();
}
