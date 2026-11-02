// Repairs Devanagari extracted from PDF text layers in *visual* glyph order.
// Many PDFs (including government-issued ones) store shaped glyphs, so extraction
// yields "िप्रया शमार्" instead of "प्रिया शर्मा": the short-i sign (ि) appears before
// its consonant cluster and the reph (र्) after its syllable.

const CONS = "[\\u0915-\\u0939\\u0958-\\u095F]\\u093C?";
const CLUSTER = `(?:${CONS}\\u094D)*${CONS}`;
const MATRAS = "[\\u093E-\\u094C]*";
const I = "\\u093F"; // ि
const REPH = "\\u0930\\u094D"; // र्

const VISUAL_I = new RegExp(`(^|[\\s\\u093E-\\u094C\\u0904-\\u0914\\u0901\\u0902])${I}`);
const TRAILING_REPH = new RegExp(`${REPH}(?=$|[\\s,.\\u0964:])`);

/** True when the text contains sequences that cannot occur in logical order. */
export function looksVisualOrder(s: string): boolean {
  return VISUAL_I.test(s) || TRAILING_REPH.test(s);
}

export function repairVisualOrder(s: string): string {
  if (!looksVisualOrder(s)) return s;
  // 1) Move a pre-base short-i after the cluster that follows it.
  let out = s.replace(new RegExp(`${I}(${CLUSTER})`, "g"), `$1ि`);
  // 2) Move each reph before the syllable it trails.
  out = out.replace(new RegExp(`(${CLUSTER}${MATRAS}[\\u0901\\u0902]?)${REPH}`, "g"), "र्$1");
  return out;
}
