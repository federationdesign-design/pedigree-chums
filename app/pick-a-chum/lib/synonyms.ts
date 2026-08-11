import { MisspellingAlias, buildAliasMap } from './normalise';

// Task 172: a synonym table. Words that mean the same thing normalise to ONE canonical form for the CONTENT
// matching layers, so a different word for the same idea stops missing. It reuses the misspelling mechanism
// (buildAliasMap / applyAliases), and is applied at a SECOND applyAliases point in resolve(), AFTER every
// safety, moderation and sensitive route has already resolved on the ORIGINAL words (Section 3 of the brief).
// That ordering is the safety guarantee: a synonym can never soften a rude word past a guard, because the
// guards have already seen the rude word.
//
// CONSERVATIVE, and evidence-light on purpose: the gap log and the recorder's Turns sheet are EMPTY (no
// tester data yet), so this is the brief's obvious families MINUS the polysemous or breed-context words a
// corpus pass flagged as mis-routing unrelated inputs. Dropped: behind, bottom (both sit inside anatomy
// triggers "front bottom"/"wee wee" is the wee case, and both are common words), giant / mini / large (breed
// context: giant/miniature schnauzer, large breed), treat (the Treat Trail game), tea, fancy (fancy dress),
// and the food family (dinner / snack already reach the food transfer). DO NOT add a word here without
// running scripts/../.scratch/corpus.mjs before and after: a synonym touches every bucket at once.
export const SYNONYMS: MisspellingAlias[] = [
  { canonical: 'bum', variants: ['ass', 'arse', 'butt', 'backside'] },
  { canonical: 'smell', variants: ['sniff'] },
  { canonical: 'poo', variants: ['poop'] },
  { canonical: 'big', variants: ['huge', 'massive'] },
  { canonical: 'small', variants: ['little', 'tiny'] },
  { canonical: 'fast', variants: ['quick', 'speedy'] },
  { canonical: 'like', variants: ['love', 'enjoy'] },
];

// Built once at module load (the map is immutable), unlike the misspelling map which resolve() rebuilds per
// call from workbook data. Same shape, so applyAliases treats them identically.
export const SYNONYM_MAP = buildAliasMap(SYNONYMS);
