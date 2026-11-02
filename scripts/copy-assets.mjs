// Copies runtime assets that must be served same-origin from /public.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
mkdirSync(join(pub, "fonts"), { recursive: true });

const copies = [
  ["node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "pdf.worker.min.mjs"],
  ["node_modules/@expo-google-fonts/noto-sans-devanagari/400Regular/NotoSansDevanagari_400Regular.ttf", "fonts/NotoSansDevanagari-Regular.ttf"],
];
for (const [from, to] of copies) {
  copyFileSync(join(root, from), join(pub, to));
  console.log(`copied ${to}`);
}
