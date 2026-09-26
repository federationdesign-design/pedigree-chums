/* SAVE CODES: THE CODE ITSELF, 27 September 2026 (owner, J18-315). Three dog words
   and two digits, such as PUG-BONE-SAUSAGE-42. With 100 words that is 100 x 100 x
   100 x 100 = 100 million codes, so guessing someone else's is impractical, and the
   fetch route is rate limited as well. A code holds no personal data, so a guessed
   one would only ever show game progress.

   The words are short, friendly and easy to spell for a child, with no two that
   look alike, and no letters that are easy to confuse. normaliseCode() accepts a
   code typed in any case, with spaces or dashes, and returns it in one form. */
export const CODE_WORDS = [
  "PUG", "BONE", "PAW", "WOOF", "BARK", "TAIL", "SNOUT", "FETCH", "BALL", "STICK",
  "SAUSAGE", "BISCUIT", "PUPPY", "BEAGLE", "BOXER", "COLLIE", "CORGI", "HUSKY", "POODLE", "TERRIER",
  "SPANIEL", "SETTER", "WHIPPET", "LURCHER", "MASTIFF", "HOUND", "SHEEPDOG", "SPOTTY", "FLUFFY", "SCRUFFY",
  "WAGGY", "JUMPY", "ZOOMY", "SNUGGLE", "CUDDLE", "SNIFF", "SPLASH", "PUDDLE", "MUDDY", "BOUNCY",
  "KENNEL", "BASKET", "COLLAR", "LEAD", "WALKIES", "TREAT", "DINNER", "GRAVY", "CRUNCH", "MUNCH",
  "HOWL", "YAP", "GROWL", "SNORE", "YAWN", "WHISKER", "NOSE", "EARS", "PAWPRINT", "FRISBEE",
  "RABBIT", "SQUIRREL", "DUCK", "PIGEON", "BADGER", "FOX", "OTTER", "HEDGEHOG", "SHEEP", "PONY",
  "MEADOW", "HILL", "RIVER", "FOREST", "MOOR", "BEACH", "GARDEN", "PARK", "FIELD", "BARN",
  "ROCKET", "COMET", "STAR", "MOON", "SUNNY", "RAINY", "WINDY", "SNOWY", "FROSTY", "STORMY",
  "HAPPY", "LUCKY", "BRAVE", "CLEVER", "SPEEDY", "SLEEPY", "CHEEKY", "JOLLY", "PLUCKY", "DOTTY",
] as const;

const WORD_SET = new Set<string>(CODE_WORDS);

export function makeCode(rand: () => number = Math.random): string {
  const w = () => CODE_WORDS[Math.floor(rand() * CODE_WORDS.length)];
  const n = String(Math.floor(rand() * 100)).padStart(2, "0");
  return `${w()}-${w()}-${w()}-${n}`;
}

/** A typed code in its one stored form, or null if it cannot be a code. */
export function normaliseCode(input: string): string | null {
  const parts = input.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  if (parts.length !== 4) return null;
  const [a, b, c, n] = parts;
  if (!WORD_SET.has(a) || !WORD_SET.has(b) || !WORD_SET.has(c) || !/^\d{2}$/.test(n)) return null;
  return `${a}-${b}-${c}-${n}`;
}
