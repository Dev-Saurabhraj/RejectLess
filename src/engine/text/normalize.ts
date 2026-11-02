import { hasDevanagari, transliterate } from "./transliterate";

const HONORIFICS = new Set([
  "mr", "mrs", "ms", "miss", "dr", "shri", "sri", "shree", "smt", "srimati", "shrimati", "kumari", "km", "kum", "late", "md",
  "श्री", "श्रीमती", "सुश्री", "कुमारी", "डॉ",
]);

/** Relationship prefixes that sometimes appear in name fields (S/O, D/O, W/O, C/O). */
const RELATION_RE = /\b(s|d|w|c)\s*\/\s*o\b.*$/i;

/** Unicode-normalises, strips honorifics and punctuation, collapses whitespace. */
export function cleanName(input: string): string {
  let s = input.normalize("NFC").replace(RELATION_RE, "");
  s = s.replace(/[.,'`’"()\-_/\\]+/g, " ").replace(/\s+/g, " ").trim();
  const tokens = s.split(" ").filter((t) => t && !HONORIFICS.has(t.toLowerCase()));
  return tokens.join(" ");
}

export function nameTokens(input: string): { original: string; latin: string; script: "latin" | "devanagari" }[] {
  return cleanName(input)
    .split(" ")
    .filter(Boolean)
    .map((t) => {
      const dev = hasDevanagari(t);
      return { original: t, latin: transliterate(t).toLowerCase().replace(/[^a-z]/g, ""), script: (dev ? "devanagari" : "latin") as "latin" | "devanagari" };
    })
    .filter((t) => t.latin.length > 0);
}

/**
 * Phonetic key tuned for romanised Indian names. Collapses spelling variants that
 * usually represent the same pronunciation (Saurabh/Sourabh, Suneel/Sunil,
 * Mohammad/Muhammed is NOT collapsed — vowels u/o stay distinct except long forms).
 */
export function phoneticKey(latin: string): string {
  let s = latin.toLowerCase().replace(/[^a-z]/g, "");
  const rules: [RegExp, string][] = [
    [/aa/g, "a"],
    [/ee/g, "i"],
    [/oo/g, "u"],
    [/ou/g, "o"],
    [/au/g, "o"],
    [/ay$/g, "e"],
    [/ai/g, "e"],
    [/w/g, "v"],
    [/ph/g, "f"],
    [/z/g, "j"],
    [/q/g, "k"],
    [/ck/g, "k"],
    [/x/g, "ks"],
    [/chh/g, "c"],
    [/ch/g, "c"],
    [/sh/g, "s"],
    [/([kgjtdbp])h/g, "$1"],
    [/y$/g, "i"],
  ];
  for (const [re, rep] of rules) s = s.replace(re, rep);
  s = s.replace(/(.)\1+/g, "$1");
  return s;
}

export function normaliseForCompare(input: string): string {
  return nameTokens(input)
    .map((t) => t.latin)
    .join(" ");
}

export function isDevanagari(s: string): boolean {
  return hasDevanagari(s);
}
