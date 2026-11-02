"use client";

import type { GrayImage } from "@/engine/quality";

export function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Downscales to at most `maxSide` and converts to luminance for quality analysis. */
export function toGray(src: HTMLCanvasElement, maxSide = 1000): GrayImage {
  const scale = Math.min(1, maxSide / Math.max(src.width, src.height));
  const w = Math.max(1, Math.round(src.width * scale));
  const h = Math.max(1, Math.round(src.height * scale));
  const c = createCanvas(w, h);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0, w, h);
  const rgba = ctx.getImageData(0, 0, w, h).data;
  const data = new Uint8ClampedArray(w * h);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
    data[j] = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
  }
  return { width: w, height: h, data, sourceWidth: src.width, sourceHeight: src.height };
}

export async function fileToCanvas(file: Blob, maxSide = 2200): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(file).catch(() => {
    throw new Error("This image could not be opened. It may be corrupted or in an unsupported format.");
  });
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = createCanvas(bmp.width * scale, bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c;
}

export function canvasToBlob(c: HTMLCanvasElement, type = "image/jpeg", quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode image"))), type, quality));
}

/** Small preview kept for evidence highlighting; the original file is not retained. */
export async function previewBlob(c: HTMLCanvasElement, maxSide = 1400): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(c.width, c.height));
  if (scale === 1) return canvasToBlob(c);
  const p = createCanvas(c.width * scale, c.height * scale);
  p.getContext("2d")!.drawImage(c, 0, 0, p.width, p.height);
  return canvasToBlob(p);
}
