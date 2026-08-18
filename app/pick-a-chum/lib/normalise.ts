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
  // Unify the curly apostrophe U+2019 (what iOS/macOS autocorrect produces for
  // "I'm", "can't") to the straight U+0027 the trigger lists are written with, so
  // phone input matches. This is character UNIFICATION, not stripping: the
  // apostrophe stays, so "I'll" -> "i'll" (never "ill") and the dog-illness trap
  // cannot appear. `original` is untouched; only the matched forms are folded.
  // Then collapse any run of 3+ identical characters ("pleeeassssee" -> "pleasee")
  // so stretched words match their base form (runs of 2 like "hello" are kept).
  const lower = original.toLowerCase().replace(/’/g, "'").replace(/(.)\1{2,}/gu, '$1');
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

// True when the message carries no words, only emoji (picture-writing). A
// punctuation-only smash ("?????") is NOT emoji-only; it stays gibberish.
export function isEmojiOnly(n: Normalised): boolean {
  if (n.letters.length > 0) return false;
  return /\p{Extended_Pictographic}/u.test(n.original);
}

// ---- The bark game ----
// Recognised bark units (growls are deliberately excluded: they carry a
// different emotional/safety context). "bow wow" counts as a single unit.
const BARK_ATOMS = ['woof', 'bark', 'ruff', 'arf', 'yap'];
const BARK_WORD = new RegExp(`^(?:${BARK_ATOMS.join('|')})+$`); // one word = one or more atoms
const BARK_ATOM_GLOBAL = new RegExp(BARK_ATOMS.join('|'), 'g');

// Lowercase, drop punctuation, collapse whitespace, and fold "bow wow" into a
// single token so it is treated as one bark unit.
function barkClean(n: Normalised): string {
  return n.lower
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\bbow\s+wow\b/g, ' bowwow ')
    .replace(/\s+/g, ' ')
    .trim();
}

// The whole meaningful message is bark units and nothing else. Mixed language
// ("woof how are you"), semantic questions ("why do dogs bark") and growls do
// not qualify.
export function isBarkOnly(n: Normalised): boolean {
  const s = barkClean(n);
  if (!s) return false;
  return s.split(' ').every((w) => w === 'bowwow' || BARK_WORD.test(w));
}

// Count recognised bark units (repeats within a word count; "bow wow" is one).
export function barkUnitCount(n: Normalised): number {
  const s = barkClean(n);
  if (!s) return 0;
  let count = 0;
  for (const w of s.split(' ')) {
    if (w === 'bowwow') count += 1;
    else count += w.match(BARK_ATOM_GLOBAL)?.length ?? 0;
  }
  return count;
}

// ---- Typo tolerance (deterministic fuzzy matching) ----
//
// Trigger words are matched allowing small edit-distance slips (transposed,
// dropped or doubled letters), scaled by length: tiny words are exact, short
// words tolerate 1 edit, longer words 2. Two guards keep this from false-firing,
// which matters most for the safety and buying layers:
//   1. A real common word is never fuzzed into a trigger (typos are non-words;
//      "lunch" must never become "launch", "books" never "boobs").
//   2. Curated misspelling aliases (workbook, high-value seeds) are applied first
//      via applyAliases, catching predictable slips fuzz is too conservative for.

// Damerau-Levenshtein (optimal string alignment) with an early ceiling at max.
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > max) return max + 1;
  const prevPrev = new Array(bl + 1).fill(0);
  const prev = new Array(bl + 1);
  const cur = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;
  for (let i = 1; i <= al; i++) {
    cur[0] = i;
    let best = cur[0];
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prevPrev[j - 2] + 1); // adjacent transposition
      }
      cur[j] = v;
      if (v < best) best = v;
    }
    if (best > max) return max + 1; // whole row already over budget
    for (let j = 0; j <= bl; j++) {
      prevPrev[j] = prev[j];
      prev[j] = cur[j];
    }
  }
  return prev[bl];
}

// Edits allowed against a target of this length: <=5 exact, 6-8 one, 9+ two.
// Short words are held exact deliberately: at 4-5 letters a single edit reaches
// too many real words (shop/show, cost/cast, order/border, naked/baked), which
// is precisely the false-positive-into-safety-or-buying risk. Predictable slips
// on short high-value words are handled by the curated alias map instead.
export function fuzzThreshold(len: number): number {
  if (len <= 5) return 0;
  if (len <= 8) return 1;
  return 2;
}

// Common English words that must never be fuzzed INTO a trigger. Real words are
// rarely the typo a visitor meant; keeping them exact stops benign input from
// crossing into safety or buying (the near-neighbours are listed deliberately:
// lunch/launch, books/boobs, baked/naked, cast/cost, shot/shut/shit, prize...).
const COMMON_WORDS = new Set([
  'the', 'and', 'for', 'are', 'you', 'your', 'this', 'that', 'with', 'have', 'from', 'they', 'what',
  'when', 'where', 'which', 'them', 'then', 'than', 'here', 'there', 'their', 'about', 'would', 'could',
  'should', 'like', 'love', 'read', 'reading', 'books', 'book', 'baked', 'bake', 'cake', 'lunch', 'brunch',
  'dinner', 'cast', 'coat', 'coast', 'cost', 'lost', 'most', 'post', 'past', 'best', 'test', 'shot', 'shut',
  'ship', 'shop', 'shift', 'short', 'sort', 'port', 'sport', 'born', 'corn', 'horn', 'worn', 'work', 'word',
  'world', 'ward', 'warm', 'want', 'wait', 'rude', 'dude', 'node', 'nude', 'nuke', 'name', 'game', 'came',
  'come', 'some', 'same', 'time', 'take', 'make', 'made', 'mode', 'mood', 'good', 'food', 'foot', 'wood',
  'moon', 'noon', 'soon', 'room', 'boom', 'boot', 'boat', 'boats', 'boots', 'boats', 'prize', 'pride', 'price',
  'prime', 'six', 'sit', 'set', 'sat', 'say', 'saw', 'sad', 'see', 'sea', 'sex', 'box', 'boy', 'bay', 'buy',
  'but', 'bit', 'big', 'bad', 'bag', 'much', 'match', 'mush', 'muck', 'lucky', 'money', 'honey', 'funny',
  'sunny', 'happy', 'story', 'sorry', 'today', 'kettle', 'cattle', 'little', 'letter', 'better', 'people',
  'please', 'thanks', 'thank', 'hello', 'help', 'dog', 'dogs', 'cat', 'cats', 'play', 'player', 'card', 'cards',
  'talk', 'talking', 'listen', 'idea', 'idiom', 'chit', 'chat', 'chap',
  // near-neighbours of 6+ letter triggers (still fuzzed): launch/lunch, dinner/diner|winner
  'lunch', 'diner', 'winner', 'sinner', 'hunger', 'hunter', 'better', 'butter', 'matter',
  // Task 176 (audit): "order" is one edit from "border" and was reaching a Border Terrier breed page.
  // Held exact so it never fuzzes into a breed; "order the game" still matches exactly.
  'order',
]);

// True if word matches target exactly, or is a genuine (non-common-word) typo
// within the length-scaled edit budget.
export function wordFuzzyEq(word: string, target: string): boolean {
  if (word === target) return true;
  const k = fuzzThreshold(target.length);
  if (k === 0) return false;
  if (COMMON_WORDS.has(word)) return false;
  if (Math.abs(word.length - target.length) > k) return false;
  return editDistance(word, target, k) <= k;
}

// A multiword phrase, matched as consecutive fuzzy words (order and adjacency
// preserved, unlike a loose bag-of-words), so "how mcuh" still reads as "how much".
function phraseFuzzy(words: string[], needleWords: string[]): boolean {
  const m = needleWords.length;
  if (!m || words.length < m) return false;
  for (let i = 0; i + m <= words.length; i++) {
    let ok = true;
    for (let k = 0; k < m; k++) {
      if (!wordFuzzyEq(words[i + k], needleWords[k])) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/** Does the compact message contain any of these whole words or phrases, allowing typos? */
export function hasAny(n: Normalised, needles: string[]): boolean {
  const words = n.words ?? (n.compact.match(/[a-z]+/g) ?? []);
  return needles.some((needle) => {
    const t = needle.toLowerCase();
    if (t.includes(' ')) {
      if (n.compact.includes(t)) return true; // exact phrase
      return phraseFuzzy(words, t.split(/\s+/)); // typo-tolerant phrase
    }
    return words.some((w) => wordFuzzyEq(w, t));
  });
}

// ---- Misspelling aliases (curated, workbook-driven) ----

export interface MisspellingAlias {
  canonical: string;
  variants: string[];
}

/** Build a variant -> canonical lookup from the workbook alias list. */
export function buildAliasMap(aliases: MisspellingAlias[] | undefined): Map<string, string> {
  const m = new Map<string, string>();
  for (const a of aliases ?? []) {
    const canon = a.canonical.toLowerCase();
    for (const v of a.variants) m.set(v.toLowerCase(), canon);
  }
  return m;
}

/** Replace curated misspellings with their canonical word before matching. */
export function applyAliases(n: Normalised, aliasMap: Map<string, string>): Normalised {
  if (!aliasMap.size) return n;
  const swap = (w: string) => aliasMap.get(w) ?? w;
  const words = n.words.map(swap);
  const compact = n.compact.replace(/[a-z]+/g, (w) => aliasMap.get(w) ?? w);
  const lower = n.lower.replace(/[a-z]+/g, (w) => aliasMap.get(w) ?? w);
  return { ...n, lower, compact, words, letters: words.join('') };
}
