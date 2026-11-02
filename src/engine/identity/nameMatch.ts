import { nameTokens, phoneticKey } from "../text/normalize";
import { jaroWinkler, levenshtein } from "../text/similarity";

export type NameOutcome = "consistent" | "minor_variation" | "mismatch" | "insufficient";

export type TokenMatchKind = "exact" | "transliteration" | "phonetic" | "initial" | "near" | "none";

export interface TokenPair {
  a: string;
  b: string;
  kind: TokenMatchKind;
  note: string;
}

export interface NameComparison {
  outcome: NameOutcome;
  pairs: TokenPair[];
  unmatchedA: string[];
  unmatchedB: string[];
  reordered: boolean;
  scriptDiffers: boolean;
  /** Human-readable signals, in the order they were established. */
  signals: string[];
  /** Short description safe for AI use — contains no name text. */
  abstract: string;
}

interface Tok {
  original: string;
  latin: string;
  script: "latin" | "devanagari";
  key: string;
  idx: number;
}

const KIND_RANK: Record<TokenMatchKind, number> = { exact: 5, transliteration: 4, phonetic: 3, near: 2, initial: 1, none: 0 };

function matchTokens(a: Tok, b: Tok): { kind: TokenMatchKind; note: string } {
  const crossScript = a.script !== b.script;
  if (!crossScript && a.original.toLowerCase() === b.original.toLowerCase()) return { kind: "exact", note: "identical" };
  if (crossScript && a.key === b.key) return { kind: "transliteration", note: "same name written in Devanagari and Latin script" };
  if (a.latin === b.latin) return { kind: "exact", note: "identical after normalisation" };
  if (a.key === b.key) return { kind: "phonetic", note: describeSpellingDiff(a.latin, b.latin) };
  if ((a.latin.length === 1 && b.latin.startsWith(a.latin)) || (b.latin.length === 1 && a.latin.startsWith(b.latin))) {
    return { kind: "initial", note: "one record uses an initial" };
  }
  const dist = levenshtein(a.key, b.key);
  const jw = jaroWinkler(a.key, b.key);
  // Vowels are the least reliable part of a romanised Indian name; consonants carry identity.
  // A difference confined to vowels is a plausible variant; a consonant difference
  // (Rakesh/Ramesh, Neha/Sneha) is treated as a different name.
  const sameSkeleton = skeleton(a.key) === skeleton(b.key) && skeleton(a.key).length >= 2;
  if (crossScript && sameSkeleton && jw >= 0.8) {
    return { kind: "transliteration", note: "same name in different scripts (vowel spelling differs, which is common across scripts)" };
  }
  if (sameSkeleton && dist === 1) return { kind: "near", note: `differs by one vowel (similarity ${jw.toFixed(2)})` };
  return { kind: "none", note: `different (similarity ${jw.toFixed(2)})` };
}

function skeleton(key: string): string {
  return key.replace(/[aeiou]/g, "");
}

function describeSpellingDiff(a: string, b: string): string {
  const pairs: [RegExp, string][] = [
    [/au|ou/, "'au' / 'ou' vowel spelling"],
    [/ee|i/, "'ee' / 'i' vowel spelling"],
    [/oo|u/, "'oo' / 'u' vowel spelling"],
    [/aa/, "long 'aa' vs short 'a'"],
    [/w|v/, "'v' / 'w' spelling"],
    [/sh/, "'sh' / 's' spelling"],
    [/h/, "an aspirated 'h' spelling"],
    [/(.)\1/, "a doubled letter"],
  ];
  for (const [re, label] of pairs) {
    if (re.test(a) !== re.test(b) || (re.test(a) && a.replace(re, "") !== b.replace(re, ""))) return `common transliteration variant (${label})`;
  }
  return "common transliteration variant";
}

export function compareNames(nameA: string | undefined, nameB: string | undefined): NameComparison {
  const empty: NameComparison = {
    outcome: "insufficient",
    pairs: [],
    unmatchedA: [],
    unmatchedB: [],
    reordered: false,
    scriptDiffers: false,
    signals: ["One or both names are missing or unreadable, so they cannot be compared."],
    abstract: "Name comparison not possible: a value is missing.",
  };
  if (!nameA?.trim() || !nameB?.trim()) return empty;

  const A: Tok[] = nameTokens(nameA).map((t, idx) => ({ ...t, key: phoneticKey(t.latin), idx }));
  const B: Tok[] = nameTokens(nameB).map((t, idx) => ({ ...t, key: phoneticKey(t.latin), idx }));
  if (!A.length || !B.length) return empty;

  // Greedy best-first assignment over all token pairs.
  const candidates: { i: number; j: number; kind: TokenMatchKind; note: string; posPenalty: number }[] = [];
  A.forEach((a, i) =>
    B.forEach((b, j) => {
      const m = matchTokens(a, b);
      if (m.kind !== "none") candidates.push({ i, j, ...m, posPenalty: Math.abs(i - j) });
    }),
  );
  candidates.sort((x, y) => KIND_RANK[y.kind] - KIND_RANK[x.kind] || x.posPenalty - y.posPenalty);
  const usedA = new Set<number>();
  const usedB = new Set<number>();
  const chosen: typeof candidates = [];
  for (const c of candidates) {
    if (usedA.has(c.i) || usedB.has(c.j)) continue;
    usedA.add(c.i);
    usedB.add(c.j);
    chosen.push(c);
  }
  chosen.sort((x, y) => x.i - y.i);

  const pairs: TokenPair[] = chosen.map((c) => ({ a: A[c.i].original, b: B[c.j].original, kind: c.kind, note: c.note }));
  const unmatchedA = A.filter((_, i) => !usedA.has(i)).map((t) => t.original);
  const unmatchedB = B.filter((_, j) => !usedB.has(j)).map((t) => t.original);
  const jOrder = chosen.map((c) => c.j);
  const reordered = jOrder.some((j, k) => k > 0 && j < jOrder[k - 1]);
  const scriptDiffers = A.some((t) => t.script === "devanagari") !== B.some((t) => t.script === "devanagari");

  const signals: string[] = [];
  if (scriptDiffers) signals.push("The names are written in different scripts; Devanagari was transliterated to Latin before comparing.");
  for (const p of pairs) {
    if (p.kind === "exact") signals.push(`"${p.a}" matches "${p.b}".`);
    else if (p.kind === "transliteration") signals.push(`"${p.a}" and "${p.b}" are the same name in different scripts.`);
    else if (p.kind === "phonetic") signals.push(`"${p.a}" vs "${p.b}": ${p.note}. These usually sound the same but are spelt differently.`);
    else if (p.kind === "initial") signals.push(`"${p.a}" vs "${p.b}": one record uses an initial instead of the full name.`);
    else if (p.kind === "near") signals.push(`"${p.a}" vs "${p.b}": ${p.note}. Could be a typo or a different name.`);
  }
  if (reordered) signals.push("The same name parts appear in a different order.");
  if (unmatchedA.length) signals.push(`Name part(s) with no counterpart: ${unmatchedA.map((t) => `"${t}"`).join(", ")}.`);
  if (unmatchedB.length) signals.push(`Name part(s) with no counterpart: ${unmatchedB.map((t) => `"${t}"`).join(", ")}.`);

  const kinds = pairs.map((p) => p.kind);
  const strongCount = kinds.filter((k) => k === "exact" || k === "transliteration").length;
  const unmatchedTotal = unmatchedA.length + unmatchedB.length;

  let outcome: NameOutcome;
  if (unmatchedA.length && unmatchedB.length) {
    // Each side has parts the other doesn't — e.g. Saurabh Kumar vs Gaurav Kumar.
    outcome = "mismatch";
  } else if (pairs.length === 0) {
    outcome = "mismatch";
  } else if (unmatchedTotal === 0 && strongCount === pairs.length && !reordered) {
    outcome = "consistent";
  } else if (unmatchedTotal <= 1 && pairs.length >= 1 && kinds.every((k) => k !== "none")) {
    // One missing middle name or a spelling/initial variation.
    outcome = pairs.length === 1 && unmatchedTotal === 1 && strongCount === 0 ? "mismatch" : "minor_variation";
  } else {
    outcome = "mismatch";
  }

  const abstractParts: string[] = [];
  if (scriptDiffers) abstractParts.push("names are in different scripts (Devanagari vs Latin)");
  const counts = (k: TokenMatchKind) => kinds.filter((x) => x === k).length;
  if (counts("phonetic")) abstractParts.push(`${counts("phonetic")} name part(s) differ only by a common transliteration spelling variant`);
  if (counts("initial")) abstractParts.push(`${counts("initial")} name part(s) use an initial in one record`);
  if (counts("near")) abstractParts.push(`${counts("near")} name part(s) differ by one character`);
  if (reordered) abstractParts.push("name parts are in a different order");
  if (unmatchedTotal) abstractParts.push(`${unmatchedTotal} name part(s) appear in only one record`);
  if (strongCount) abstractParts.push(`${strongCount} name part(s) match exactly`);
  const abstract = `Outcome: ${outcome.replace("_", " ")}. ${abstractParts.join("; ") || "names are identical"}.`;

  return { outcome, pairs, unmatchedA, unmatchedB, reordered, scriptDiffers, signals, abstract };
}
