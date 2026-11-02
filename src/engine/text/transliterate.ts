// Rule-based Devanagari → Latin transliteration tuned for Indian personal names.
// Produces common "popular" spellings (e.g. सौरभ → saurabh, राजकुमार → rajkumar)
// rather than strict ISO-15919, and applies Hindi schwa deletion.

const VOWELS: Record<string, string> = {
  "अ": "a", "आ": "aa", "इ": "i", "ई": "ee", "उ": "u", "ऊ": "oo", "ऋ": "ri",
  "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "ऍ": "e", "ऑ": "o",
};

const MATRAS: Record<string, string> = {
  "ा": "aa", "ि": "i", "ी": "ee", "ु": "u", "ू": "oo", "ृ": "ri",
  "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॅ": "e", "ॉ": "o",
};

const CONSONANTS: Record<string, string> = {
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "n",
  "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "n",
  "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
  "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
  "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
  "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh",
  "ष": "sh", "स": "s", "ह": "h", "ळ": "l",
  "क़": "q", "ख़": "kh", "ग़": "g", "ज़": "z", "ड़": "r", "ढ़": "rh", "फ़": "f", "य़": "y",
};

const NUKTA = "़";
const VIRAMA = "्";
const ANUSVARA = "ं";
const CHANDRABINDU = "ँ";
const VISARGA = "ः";

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

export function hasDevanagari(s: string): boolean {
  return /[ऀ-ॿ]/.test(s);
}

interface Syllable {
  consonants: string[]; // romanised consonant cluster
  vowel: string; // romanised vowel ("a" = inherent schwa)
  inherent: boolean; // vowel is the implicit schwa
  nasal: string; // trailing anusvara/chandrabindu
  conjunctFinal: boolean;
}

function transliterateWord(word: string): string {
  const chars = Array.from(word.normalize("NFC"));
  const syllables: Syllable[] = [];
  let i = 0;
  let pending: string[] = [];

  while (i < chars.length) {
    let ch = chars[i];
    if (chars[i + 1] === NUKTA && CONSONANTS[ch + NUKTA]) {
      ch = ch + NUKTA;
      i++;
    }
    if (CONSONANTS[ch]) {
      pending.push(CONSONANTS[ch]);
      const next = chars[i + 1];
      if (next === VIRAMA) {
        i += 2;
        continue; // cluster continues
      }
      if (next && MATRAS[next]) {
        syllables.push({ consonants: pending, vowel: MATRAS[next], inherent: false, nasal: "", conjunctFinal: pending.length > 1 });
        pending = [];
        i += 2;
      } else {
        syllables.push({ consonants: pending, vowel: "a", inherent: true, nasal: "", conjunctFinal: pending.length > 1 });
        pending = [];
        i += 1;
      }
      continue;
    }
    if (VOWELS[ch]) {
      syllables.push({ consonants: [], vowel: VOWELS[ch], inherent: false, nasal: "", conjunctFinal: false });
      i++;
      continue;
    }
    if (ch === ANUSVARA || ch === CHANDRABINDU) {
      const last = syllables[syllables.length - 1];
      if (last) last.nasal = "n";
      i++;
      continue;
    }
    if (ch === VISARGA) {
      const last = syllables[syllables.length - 1];
      if (last) last.nasal += "h";
      i++;
      continue;
    }
    const d = DEVANAGARI_DIGITS.indexOf(ch);
    if (d >= 0) {
      syllables.push({ consonants: [String(d)], vowel: "", inherent: false, nasal: "", conjunctFinal: false });
      i++;
      continue;
    }
    // Unknown character (Latin, punctuation) — pass through.
    syllables.push({ consonants: [ch], vowel: "", inherent: false, nasal: "", conjunctFinal: false });
    i++;
  }
  if (pending.length) {
    syllables.push({ consonants: pending, vowel: "", inherent: false, nasal: "", conjunctFinal: false });
  }

  // Schwa deletion. 1) final schwa (unless the word is one syllable or ends in a conjunct).
  const n = syllables.length;
  const deleted = new Array<boolean>(n).fill(false);
  if (n > 1) {
    const last = syllables[n - 1];
    if (last.inherent && !last.nasal && !last.conjunctFinal) deleted[n - 1] = true;
  }
  // 2) medial schwa in V C(a) C V contexts, scanning left to right.
  for (let k = 1; k < n - 1; k++) {
    const s = syllables[k];
    if (!s.inherent || s.nasal) continue;
    const prev = syllables[k - 1];
    const next = syllables[k + 1];
    const prevHasVowel = prev.vowel !== "" && !deleted[k - 1];
    const nextHasVowel = next.vowel !== "" && !deleted[k + 1] && next.consonants.length > 0;
    // Not before a conjunct (मोहम्मद keeps "moham-"), and only for single consonants.
    if (prevHasVowel && nextHasVowel && s.consonants.length === 1 && next.consonants.length === 1) {
      deleted[k] = true;
      k++; // avoid deleting two consecutive schwas
    }
  }

  let out = "";
  syllables.forEach((s, idx) => {
    out += s.consonants.join("");
    if (!deleted[idx]) out += s.vowel;
    if (s.nasal) {
      // anusvara before labials is pronounced 'm'
      const next = syllables[idx + 1];
      const labial = next && /^[pbm]/.test(next.consonants[0] ?? "");
      out += s.nasal.replace("n", labial ? "m" : "n");
    }
  });
  return out;
}

/** Transliterates any Devanagari runs in `s`; Latin text passes through unchanged. */
export function transliterate(s: string): string {
  if (!hasDevanagari(s)) return s;
  return s
    .split(/(\s+)/)
    .map((part) => (hasDevanagari(part) ? transliterateWord(part) : part))
    .join("");
}
