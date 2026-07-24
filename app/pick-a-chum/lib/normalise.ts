// Message normalisation and low-level input detectors. Pure functions.

export interface Normalised {
  original: string; // exactly what the visitor typed (trimmed)
  lower: string; // lowercased
  compact: string; // lowercased, collapsed whitespace, no surrounding punctuation
  words: string[]; // tokenised alphabetic words
  letters: string; // just the a-z letters, lowercased
}

export function normalise(input: string): Normalised {
  const original = (input ?? '').trim();
  const lower = original.toLowerCase();
  const compact = lower.replace(/\s+/g, ' ').replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').trim();
  const words = lower.match(/[a-z]+/g) ?? [];
  const letters = (lower.match(/[a-z]/g) ?? []).join('');
  return { original, lower, compact, words, letters };
}

// Adjacent-keyboard runs (qwerty rows) used to spot keyboard smashes.
const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function hasKeyboardRun(s: string, min = 4): boolean {
  for (const row of KEY_ROWS) {
    for (let i = 0; i + min <= row.length; i++) {
      const run = row.slice(i, i + min);
      if (s.includes(run) || s.includes([...run].reverse().join(''))) return true;
    }
  }
  return false;
}

// A short word list is enough to tell "real word" gibberish (kettle) from a
// keyboard smash (qwerty) without a dictionary: we look at structure, not
// meaning. Random-real-word handling happens later in bucket classification.
export function isGibberish(n: Normalised): boolean {
  const s = n.compact.replace(/\s+/g, '');
  if (!s) return true; // empty / punctuation-only
  if (!/[a-z]/i.test(s) && /[\p{P}\p{S}]/u.test(n.original)) return true; // punctuation / symbols only
  if (n.letters.length === 1) return true; // single letter
  if (hasKeyboardRun(n.letters)) return true; // qwerty, asdf, ...
  if (/^(.)\1{2,}$/.test(n.letters)) return true; // nnnn, aaaa
  // Long letter string with no vowels is almost certainly a smash (hjklhjkl).
  if (n.letters.length >= 4 && !/[aeiou]/.test(n.letters)) return true;
  // Single long token with a very low vowel ratio and no spaces.
  if (n.words.length <= 1 && n.letters.length >= 6) {
    const vowels = (n.letters.match(/[aeiou]/g) ?? []).length;
    if (vowels / n.letters.length < 0.2) return true;
  }
  return false;
}

// True when the whole message is a single recognisable token (a random noun
// like "kettle" or "tractor"): one word, plausible vowel structure, not gibberish.
export function isSingleWord(n: Normalised): boolean {
  return n.words.length === 1 && n.words[0].length >= 3 && !isGibberish(n);
}

/** Does the compact message contain any of these whole words or phrases? */
export function hasAny(n: Normalised, needles: string[]): boolean {
  return needles.some((needle) => {
    const t = needle.toLowerCase();
    if (t.includes(' ')) return n.compact.includes(t);
    return new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(n.compact);
  });
}
