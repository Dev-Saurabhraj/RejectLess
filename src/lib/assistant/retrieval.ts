import { KB, type KbChunk } from "./kb";

// Lexical BM25 retrieval over the (small, public) knowledge base. Runs locally.
// The KB is a few dozen passages, so BM25 with light synonym expansion is
// accurate and instant; an embedding model would add a large download for little gain.

const STOP = new Set(
  "a an the is are was were be to of and or in on for with my me i you your it this that what why how do does can should which where when who from by as at not no if will".split(" "),
);

const SYNONYMS: Record<string, string[]> = {
  fix: ["correct", "correction", "update", "change"],
  correct: ["correction", "update", "fix"],
  name: ["spelling", "spelt"],
  bank: ["account", "ifsc", "passbook"],
  pf: ["epf", "provident"],
  withdraw: ["withdrawal", "settlement", "claim"],
  tax: ["tds"],
  dob: ["birth"],
  birth: ["dob"],
  scholarship: ["nsp"],
  aadhaar: ["uidai", "aadhar"],
  aadhar: ["aadhaar"],
  wait: ["waiting", "months"],
  exit: ["leaving", "doe"],
};

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFC")
    .split(/[^a-z0-9ऀ-ॿ]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

interface Index {
  docs: { chunk: KbChunk; tf: Map<string, number>; len: number }[];
  df: Map<string, number>;
  avgLen: number;
}

let index: Index | null = null;

function build(): Index {
  const docs = KB.map((chunk) => {
    const toks = tokenize(`${chunk.title} ${chunk.title} ${chunk.text}`);
    const tf = new Map<string, number>();
    toks.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    return { chunk, tf, len: toks.length };
  });
  const df = new Map<string, number>();
  docs.forEach((d) => d.tf.forEach((_, t) => df.set(t, (df.get(t) ?? 0) + 1)));
  return { docs, df, avgLen: docs.reduce((s, d) => s + d.len, 0) / docs.length };
}

export function retrieve(query: string, opts: { k?: number; appId?: string; boostIds?: string[] } = {}): { chunk: KbChunk; score: number }[] {
  index ??= build();
  const k1 = 1.2;
  const b = 0.75;
  const N = index.docs.length;
  const q = tokenize(query).flatMap((t) => [t, ...(SYNONYMS[t] ?? [])]);
  const scored = index.docs.map((d) => {
    let score = 0;
    for (const t of q) {
      const f = d.tf.get(t);
      if (!f) continue;
      const n = index!.df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += (idf * f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / index!.avgLen));
    }
    if (opts.appId && d.chunk.appIds && !d.chunk.appIds.includes(opts.appId)) score *= 0.2;
    if (opts.boostIds?.includes(d.chunk.id)) score += 3;
    return { chunk: d.chunk, score };
  });
  return scored
    .filter((s) => s.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.k ?? 5);
}
