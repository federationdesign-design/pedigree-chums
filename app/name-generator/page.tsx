"use client";
import { useState } from "react";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";

// ── REGISTER TYPES ─────────────────────────────────────────────────────────────
// Every name, title and dog word has a register tag.
// The scorer uses these to measure contrast -- the engine of comedy.
type Register = "grand"|"mundane"|"chaos"|"baby"|"absurd"|"nature"|"ironic"|"aloof"|"food"|"pop";

interface NameEntry { name: string; reg: Register; syllables: number; }
interface TitleEntry { title: string; reg: Register; syllables: number; }
interface WordEntry  { word: string;  reg: Register; firstLetter: string; }

// ── CONTRAST MATRIX ────────────────────────────────────────────────────────────
// How funny is this title register vs this name register?
const CONTRAST: Record<Register, Partial<Record<Register, number>>> = {
  grand:   { baby:5, mundane:5, chaos:4, ironic:4, absurd:3, aloof:2, nature:2, food:3, pop:3, grand:1 },
  mundane: { chaos:5, baby:4, absurd:4, grand:3, ironic:3, nature:2, aloof:2, food:2, pop:2, mundane:1 },
  chaos:   { grand:4, mundane:3, baby:2, ironic:3, absurd:2, nature:1, aloof:1, food:1, pop:1, chaos:1 },
  baby:    { grand:4, mundane:3, chaos:2, absurd:2, ironic:3, nature:1, aloof:1, food:2, pop:1, baby:1 },
  absurd:  { grand:4, mundane:4, baby:3, chaos:3, ironic:3, nature:2, aloof:3, food:2, pop:2, absurd:1 },
  aloof:   { grand:2, mundane:3, baby:2, chaos:2, absurd:3, nature:2, ironic:2, food:1, pop:1, aloof:1 },
  ironic:  { grand:4, mundane:3, baby:3, chaos:3, absurd:3, nature:2, aloof:2, food:2, pop:2, ironic:1 },
  nature:  { grand:3, mundane:2, baby:2, chaos:2, absurd:2, ironic:2, aloof:2, food:1, pop:1, nature:1 },
  food:    { grand:3, mundane:2, baby:3, chaos:2, absurd:2, ironic:2, aloof:1, nature:1, pop:1, food:1 },
  pop:     { grand:3, mundane:2, baby:2, chaos:2, absurd:2, ironic:2, aloof:1, nature:1, food:1, pop:1 },
};

function contrastScore(a: Register, b: Register): number {
  return CONTRAST[a]?.[b] ?? 1;
}

// ── SCORING FUNCTION ───────────────────────────────────────────────────────────
function scoreName(title: TitleEntry, first: NameEntry, dogWord: WordEntry, surname: string): number {
  let score = 0;

  // 1. Contrast: title vs first name (max 5)
  score += contrastScore(title.reg, first.reg);

  // 2. Contrast: first name vs dog word (max 5)
  score += contrastScore(first.reg, dogWord.reg);

  // 3. Alliteration: first name first letter vs dog word first letter (max 3)
  const firstLetter = first.name[0].toLowerCase();
  const wordLetter  = dogWord.word[0].toLowerCase();
  const soundFamilies: Record<string,string> = {b:"bp",p:"bp",d:"dt",t:"dt",g:"gk",k:"gk",f:"fv",v:"fv",s:"sz",z:"sz",m:"mn",n:"mn"};
  if (firstLetter === wordLetter) score += 3;
  else if (soundFamilies[firstLetter] && soundFamilies[firstLetter] === soundFamilies[wordLetter]) score += 1;

  // 4. Rhythm: syllable balance (max 4)
  const total = title.syllables + first.syllables + 1 + countSyllables(surname);
  if (total >= 6 && total <= 10) score += 4;
  else if (total >= 4 && total <= 12) score += 2;
  else score += 0;

  // 5. Recognisability: penalise very long first names (max 3)
  if (first.syllables <= 2) score += 3;
  else if (first.syllables <= 3) score += 2;
  else if (first.syllables <= 4) score += 1;

  // 6. Bonus: title + first name alliteration
  const titleFirst = title.title.replace(/^(The |)/,"")[0]?.toLowerCase();
  if (titleFirst === firstLetter) score += 2;

  // 7. Bonus: all three alliterate
  if (firstLetter === wordLetter && titleFirst === firstLetter) score += 2;

  return score;
}

function countSyllables(word: string): number {
  return word.toLowerCase().replace(/[^aeiouy]+/g,"x").replace(/x+/g,"x").length || 1;
}

// ── PACK BREEDS ────────────────────────────────────────────────────────────────
const PACK_BREEDS = [
  "Afghan Hound","Basset Hound","Beagle","Bichon Frise","Bloodhound",
  "Border Collie","Border Terrier","Boston Terrier","Boxer","Bull Terrier",
  "Bulldog","Cavalier King Charles Spaniel","Cavachon","Cavapoo","Chihuahua",
  "Cocker Spaniel","Cockapoo","Corgi","Dachshund","Dalmatian",
  "Doberman Pinscher","French Bulldog","German Shepherd","Golden Retriever",
  "Goldendoodle","Great Dane","Greyhound","Irish Setter","Irish Wolfhound",
  "Italian Greyhound","Jack Russell Terrier","Jackapoo","Labrador","Labradoodle",
  "Lurcher","Maltese","Maltipoo","Mastiff","Miniature Schnauzer",
  "Old English Sheepdog","Papillon","Pomeranian","Poodle","Pug","Rottweiler",
  "Rough Collie","Saint Bernard","Shih Tzu","Siberian Husky","Springer Spaniel",
  "Staffordshire Bull Terrier","Weimaraner","West Highland Terrier","Whippet",
  "Yorkshire Terrier",
];
const OTHER_BREEDS = [
  "Airedale Terrier","Akita","Alaskan Malamute","Bedlington Terrier",
  "Bernese Mountain Dog","Borzoi","Cairn Terrier","Chesapeake Bay Retriever",
  "Chow Chow","Clumber Spaniel","Deerhound","English Setter","Field Spaniel",
  "Flat-Coated Retriever","Fox Terrier","Gordon Setter","Havanese",
  "Hungarian Vizsla","Leonberger","Lhasa Apso","Newfoundland","Norfolk Terrier",
  "Pointer","Rhodesian Ridgeback","Saluki","Samoyed","Scottish Terrier",
  "Shar Pei","Shiba Inu","Soft Coated Wheaten Terrier","Sussex Spaniel",
  "Tibetan Mastiff","Welsh Springer Spaniel","Welsh Terrier",
];

// ── TITLE BANKS ────────────────────────────────────────────────────────────────
const BOY_TITLES: Record<string, TitleEntry[]> = {
  terrier:    [{"title":"Mr","reg":"mundane","syllables":1}],
  spaniel:    [{"title":"Field Marshal","reg":"grand","syllables":3},{"title":"General","reg":"grand","syllables":3},{"title":"Admiral","reg":"grand","syllables":3},{"title":"Brigadier","reg":"grand","syllables":3},{"title":"Colonel","reg":"grand","syllables":2}],
  retriever:  [{"title":"Colonel","reg":"grand","syllables":2},{"title":"Major","reg":"grand","syllables":2},{"title":"Captain","reg":"grand","syllables":2},{"title":"Commander","reg":"grand","syllables":3}],
  german:     [{"title":"Colonel","reg":"grand","syllables":2},{"title":"Major","reg":"grand","syllables":2},{"title":"Captain","reg":"grand","syllables":2}],
  collie:     [{"title":"Lieutenant","reg":"grand","syllables":3},{"title":"Second Lieutenant","reg":"grand","syllables":4},{"title":"Professor","reg":"grand","syllables":3}],
  boxer:      [{"title":"Sergeant","reg":"grand","syllables":2},{"title":"Corporal","reg":"grand","syllables":3},{"title":"Lance Corporal","reg":"grand","syllables":3}],
  sniffer:    [{"title":"Inspector","reg":"grand","syllables":3},{"title":"Chief Inspector","reg":"grand","syllables":4},{"title":"Superintendent","reg":"grand","syllables":5},{"title":"Commissioner","reg":"grand","syllables":4},{"title":"Judge","reg":"grand","syllables":1}],
  sighthound: [{"title":"Duke","reg":"grand","syllables":1},{"title":"Earl","reg":"grand","syllables":1},{"title":"Lord","reg":"grand","syllables":1},{"title":"Sir","reg":"grand","syllables":1},{"title":"Viscount","reg":"grand","syllables":2},{"title":"Baron","reg":"grand","syllables":2}],
  giant:      [{"title":"Magnificent","reg":"grand","syllables":4},{"title":"Formidable","reg":"grand","syllables":4},{"title":"Legendary","reg":"grand","syllables":4},{"title":"Unstoppable","reg":"grand","syllables":4},{"title":"Great","reg":"grand","syllables":1},{"title":"Duke","reg":"grand","syllables":1},{"title":"Earl","reg":"grand","syllables":1}],
  poodle:     [{"title":"Professor","reg":"grand","syllables":3},{"title":"Doctor","reg":"grand","syllables":2}],
  lapdog:     [{"title":"Reverend","reg":"grand","syllables":3},{"title":"Dean","reg":"grand","syllables":1},{"title":"Bishop","reg":"grand","syllables":2},{"title":"Archdeacon","reg":"grand","syllables":3}],
  character:  [{"title":"Notorious","reg":"grand","syllables":4},{"title":"Incomparable","reg":"grand","syllables":5},{"title":"Inimitable","reg":"grand","syllables":5},{"title":"Illustrious","reg":"grand","syllables":4},{"title":"Baron","reg":"grand","syllables":2},{"title":"Inspector","reg":"grand","syllables":3},{"title":"Judge","reg":"grand","syllables":1}],
  gentry:     [{"title":"Viscount","reg":"grand","syllables":2},{"title":"Baron","reg":"grand","syllables":2},{"title":"Right Honourable","reg":"grand","syllables":4},{"title":"Lord","reg":"grand","syllables":1},{"title":"Sir","reg":"grand","syllables":1}],
  highenergy: [{"title":"Lieutenant","reg":"grand","syllables":3},{"title":"Sergeant","reg":"grand","syllables":2},{"title":"Captain","reg":"grand","syllables":2}],
  lowactivity:[{"title":"Private","reg":"mundane","syllables":2},{"title":"Lance Corporal","reg":"grand","syllables":3},{"title":"Magnificent","reg":"grand","syllables":4}],
  scottish:   [{"title":"Lord","reg":"grand","syllables":1},{"title":"Duke","reg":"grand","syllables":1},{"title":"Sir","reg":"grand","syllables":1},{"title":"Earl","reg":"grand","syllables":1}],
  historical: [{"title":"Notorious","reg":"grand","syllables":4},{"title":"Legendary","reg":"grand","syllables":4},{"title":"Incomparable","reg":"grand","syllables":5}],
  doodle:     [{"title":"Professor","reg":"grand","syllables":3},{"title":"Major","reg":"grand","syllables":2},{"title":"Inspector","reg":"grand","syllables":3},{"title":"Magnificent","reg":"grand","syllables":4}],
  default:    [{"title":"Major","reg":"grand","syllables":2},{"title":"Inspector","reg":"grand","syllables":3},{"title":"Baron","reg":"grand","syllables":2},{"title":"Lord","reg":"grand","syllables":1}],
};

const GIRL_TITLES: Record<string, TitleEntry[]> = {
  terrier:    [{"title":"Miss","reg":"mundane","syllables":1}],
  spaniel:    [{"title":"Dame","reg":"grand","syllables":1},{"title":"Lady","reg":"grand","syllables":2},{"title":"Countess","reg":"grand","syllables":2},{"title":"Duchess","reg":"grand","syllables":2},{"title":"Viscountess","reg":"grand","syllables":3},{"title":"Marchioness","reg":"grand","syllables":3}],
  retriever:  [{"title":"Dame","reg":"grand","syllables":1},{"title":"Lady","reg":"grand","syllables":2},{"title":"Countess","reg":"grand","syllables":2},{"title":"Viscountess","reg":"grand","syllables":3},{"title":"Baroness","reg":"grand","syllables":3}],
  german:     [{"title":"Countess","reg":"grand","syllables":2},{"title":"Dame","reg":"grand","syllables":1},{"title":"Baroness","reg":"grand","syllables":3},{"title":"Lady","reg":"grand","syllables":2}],
  collie:     [{"title":"Professor","reg":"grand","syllables":3},{"title":"Doctor","reg":"grand","syllables":2},{"title":"Lady","reg":"grand","syllables":2},{"title":"Dame","reg":"grand","syllables":1}],
  boxer:      [{"title":"Dame","reg":"grand","syllables":1},{"title":"Lady","reg":"grand","syllables":2},{"title":"Countess","reg":"grand","syllables":2},{"title":"Baroness","reg":"grand","syllables":3}],
  sniffer:    [{"title":"Lady","reg":"grand","syllables":2},{"title":"Dame","reg":"grand","syllables":1},{"title":"Countess","reg":"grand","syllables":2},{"title":"Viscountess","reg":"grand","syllables":3},{"title":"Doctor","reg":"grand","syllables":2}],
  sighthound: [{"title":"Duchess","reg":"grand","syllables":2},{"title":"Countess","reg":"grand","syllables":2},{"title":"Lady","reg":"grand","syllables":2},{"title":"Dame","reg":"grand","syllables":1},{"title":"Viscountess","reg":"grand","syllables":3},{"title":"Baroness","reg":"grand","syllables":3},{"title":"Marchioness","reg":"grand","syllables":3}],
  giant:      [{"title":"Magnificent","reg":"grand","syllables":4},{"title":"Formidable","reg":"grand","syllables":4},{"title":"Legendary","reg":"grand","syllables":4},{"title":"Great","reg":"grand","syllables":1},{"title":"Duchess","reg":"grand","syllables":2},{"title":"Countess","reg":"grand","syllables":2},{"title":"Lady","reg":"grand","syllables":2},{"title":"Dame","reg":"grand","syllables":1}],
  poodle:     [{"title":"Professor","reg":"grand","syllables":3},{"title":"Doctor","reg":"grand","syllables":2}],
  lapdog:     [{"title":"Mother Superior","reg":"grand","syllables":5},{"title":"Prioress","reg":"grand","syllables":3},{"title":"Reverend Mother","reg":"grand","syllables":5}],
  character:  [{"title":"Notorious","reg":"grand","syllables":4},{"title":"Incomparable","reg":"grand","syllables":5},{"title":"Inimitable","reg":"grand","syllables":5},{"title":"Illustrious","reg":"grand","syllables":4},{"title":"Baroness","reg":"grand","syllables":3},{"title":"Countess","reg":"grand","syllables":2}],
  gentry:     [{"title":"Viscountess","reg":"grand","syllables":3},{"title":"Baroness","reg":"grand","syllables":3},{"title":"Most Honourable","reg":"grand","syllables":4},{"title":"Lady","reg":"grand","syllables":2},{"title":"Dame","reg":"grand","syllables":1},{"title":"Marchioness","reg":"grand","syllables":3}],
  highenergy: [{"title":"Lady","reg":"grand","syllables":2},{"title":"Countess","reg":"grand","syllables":2},{"title":"Dame","reg":"grand","syllables":1},{"title":"Duchess","reg":"grand","syllables":2}],
  lowactivity:[{"title":"Lady","reg":"grand","syllables":2},{"title":"Baroness","reg":"grand","syllables":3},{"title":"Magnificent","reg":"grand","syllables":4},{"title":"Countess","reg":"grand","syllables":2}],
  scottish:   [{"title":"Lady","reg":"grand","syllables":2},{"title":"Duchess","reg":"grand","syllables":2},{"title":"Dame","reg":"grand","syllables":1},{"title":"Countess","reg":"grand","syllables":2},{"title":"Marchioness","reg":"grand","syllables":3}],
  historical: [{"title":"Notorious","reg":"grand","syllables":4},{"title":"Legendary","reg":"grand","syllables":4},{"title":"Incomparable","reg":"grand","syllables":5}],
  doodle:     [{"title":"Professor","reg":"grand","syllables":3},{"title":"Doctor","reg":"grand","syllables":2},{"title":"Lady","reg":"grand","syllables":2},{"title":"Magnificent","reg":"grand","syllables":4}],
  default:    [{"title":"Lady","reg":"grand","syllables":2},{"title":"Baroness","reg":"grand","syllables":3},{"title":"Countess","reg":"grand","syllables":2},{"title":"Dame","reg":"grand","syllables":1},{"title":"Viscountess","reg":"grand","syllables":3}],
};

// ── NAME BANKS ─────────────────────────────────────────────────────────────────
const NAMES: Record<string, { boy: NameEntry[]; girl: NameEntry[] }> = {
  lapdog: {
    boy: [
      {name:"Marvellous",reg:"absurd",syllables:3},{name:"Glorious",reg:"absurd",syllables:3},{name:"Magnificent",reg:"grand",syllables:4},{name:"Splendid",reg:"grand",syllables:2},{name:"Opulent",reg:"grand",syllables:3},{name:"Grandiose",reg:"grand",syllables:3},{name:"Majestic",reg:"grand",syllables:3},
      {name:"Fortunatus",reg:"grand",syllables:4},{name:"Benedictus",reg:"grand",syllables:4},{name:"Casimir",reg:"grand",syllables:3},{name:"Florentine",reg:"grand",syllables:3},{name:"Celestin",reg:"grand",syllables:3},{name:"Anselme",reg:"grand",syllables:2},{name:"Prosper",reg:"grand",syllables:2},
      {name:"Alexander",reg:"grand",syllables:4},{name:"Vincent",reg:"grand",syllables:2},{name:"Henry",reg:"grand",syllables:2},{name:"Richard",reg:"grand",syllables:2},{name:"Sebastian",reg:"grand",syllables:4},{name:"Theodore",reg:"grand",syllables:3},{name:"Edward",reg:"grand",syllables:2},
      {name:"Charles",reg:"grand",syllables:1},{name:"Gabriel",reg:"grand",syllables:3},{name:"Oliver",reg:"mundane",syllables:3},{name:"William",reg:"mundane",syllables:2},{name:"Frederick",reg:"grand",syllables:3},{name:"Maximillian",reg:"grand",syllables:5},{name:"Samuel",reg:"mundane",syllables:3},
      {name:"Bernard",reg:"mundane",syllables:2},{name:"Gianmarco",reg:"grand",syllables:3},{name:"Neal",reg:"mundane",syllables:1},
    ],
    girl: [
      {name:"Fabulous",reg:"absurd",syllables:3},{name:"Darling",reg:"baby",syllables:2},{name:"Precious",reg:"baby",syllables:2},{name:"Divine",reg:"grand",syllables:2},{name:"Dazzling",reg:"absurd",syllables:2},{name:"Glorious",reg:"absurd",syllables:3},{name:"Luminous",reg:"grand",syllables:3},
      {name:"Exquisite",reg:"grand",syllables:3},{name:"Ruby",reg:"grand",syllables:2},{name:"Diamond",reg:"grand",syllables:2},{name:"Pearl",reg:"grand",syllables:1},{name:"Sapphire",reg:"grand",syllables:2},{name:"Crystal",reg:"grand",syllables:2},{name:"Opal",reg:"grand",syllables:2},
      {name:"Mercedes",reg:"grand",syllables:3},{name:"Porsche",reg:"grand",syllables:1},{name:"Chanel",reg:"grand",syllables:2},{name:"Sequin",reg:"absurd",syllables:2},{name:"Celestine",reg:"grand",syllables:3},{name:"Aurora",reg:"grand",syllables:3},{name:"Calliope",reg:"grand",syllables:4},
      {name:"Cassiopeia",reg:"grand",syllables:5},{name:"Celeste",reg:"grand",syllables:2},{name:"Daphne",reg:"grand",syllables:2},{name:"Diana",reg:"grand",syllables:3},{name:"Evangeline",reg:"grand",syllables:4},{name:"Flora",reg:"nature",syllables:2},{name:"Freya",reg:"grand",syllables:2},
      {name:"Guinevere",reg:"grand",syllables:3},{name:"Iris",reg:"nature",syllables:2},{name:"Isadora",reg:"grand",syllables:4},{name:"Luna",reg:"grand",syllables:2},{name:"Lyra",reg:"grand",syllables:2},{name:"Maeve",reg:"grand",syllables:1},{name:"Ophelia",reg:"grand",syllables:4},
      {name:"Pandora",reg:"grand",syllables:3},{name:"Seraphine",reg:"grand",syllables:3},{name:"Venus",reg:"grand",syllables:2},{name:"Violette",reg:"grand",syllables:3},{name:"Wilhelmina",reg:"grand",syllables:5},{name:"Zinnia",reg:"nature",syllables:2},
      {name:"Juliet",reg:"grand",syllables:3},{name:"Isabella",reg:"grand",syllables:4},{name:"Annabelle",reg:"grand",syllables:3},{name:"Charlotte",reg:"grand",syllables:2},{name:"Olivia",reg:"mundane",syllables:4},{name:"Victoria",reg:"grand",syllables:4},{name:"Elizabeth",reg:"grand",syllables:4},
      {name:"Lotus",reg:"nature",syllables:2},{name:"Aster",reg:"nature",syllables:2},{name:"Cosmos",reg:"nature",syllables:2},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Coco",reg:"baby",syllables:2},{name:"Zaza",reg:"baby",syllables:2},
      {name:"Snugglebum",reg:"baby",syllables:3},{name:"Cuddlekins",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},{name:"Fluffybum",reg:"baby",syllables:3},{name:"Puddingkins",reg:"baby",syllables:3},
    ],
  },
  boxer: {
    boy: [
      {name:"Doofus",reg:"chaos",syllables:2},{name:"Galumph",reg:"chaos",syllables:2},{name:"Lummox",reg:"chaos",syllables:2},{name:"Bonkers",reg:"chaos",syllables:2},{name:"Dingbat",reg:"chaos",syllables:2},{name:"Blunders",reg:"chaos",syllables:2},{name:"Rumpus",reg:"chaos",syllables:2},
      {name:"Kerfuffle",reg:"chaos",syllables:3},{name:"Balderdash",reg:"chaos",syllables:3},{name:"Hullabaloo",reg:"chaos",syllables:4},{name:"Nincompoop",reg:"chaos",syllables:3},{name:"Goofball",reg:"chaos",syllables:2},{name:"Chuckles",reg:"chaos",syllables:2},
      {name:"Tater Tot",reg:"baby",syllables:3},{name:"Bubs",reg:"baby",syllables:1},{name:"Sparky",reg:"chaos",syllables:2},{name:"Bozo",reg:"chaos",syllables:2},{name:"Puddles",reg:"baby",syllables:2},{name:"Pickles",reg:"baby",syllables:2},{name:"Noodles",reg:"baby",syllables:2},
      {name:"Chipmunk",reg:"baby",syllables:2},{name:"Kazoo",reg:"absurd",syllables:2},{name:"Joker",reg:"chaos",syllables:2},{name:"Pancake",reg:"food",syllables:2},{name:"Zebedee",reg:"absurd",syllables:3},{name:"Bartholomew",reg:"grand",syllables:4},
      {name:"Chaos",reg:"chaos",syllables:2},{name:"Havoc",reg:"chaos",syllables:2},{name:"Ruckus",reg:"chaos",syllables:2},{name:"Shambles",reg:"chaos",syllables:2},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Noo-Noo",reg:"baby",syllables:2},{name:"Woo-Woo",reg:"baby",syllables:2},{name:"Goo-Goo",reg:"baby",syllables:2},{name:"Doo-Doo",reg:"baby",syllables:2},
      {name:"Snugglebum",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},{name:"Babbycakes",reg:"baby",syllables:3},{name:"Flufferbum",reg:"baby",syllables:3},
    ],
    girl: [
      {name:"Dizzy",reg:"chaos",syllables:2},{name:"Topsy",reg:"chaos",syllables:2},{name:"Bonkers",reg:"chaos",syllables:2},{name:"Wibble",reg:"chaos",syllables:2},{name:"Doolally",reg:"chaos",syllables:3},{name:"Piggledy",reg:"chaos",syllables:3},{name:"Ramshackle",reg:"chaos",syllables:3},
      {name:"Heels",reg:"chaos",syllables:1},{name:"Twinkles",reg:"baby",syllables:2},{name:"Cornflake",reg:"food",syllables:2},{name:"Sasspanties",reg:"chaos",syllables:3},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Tutu",reg:"baby",syllables:2},{name:"Noo-Noo",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},
      {name:"Snugglebum",reg:"baby",syllables:3},{name:"Cuddlekins",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},{name:"Babbycakes",reg:"baby",syllables:3},{name:"Tiddlywink",reg:"baby",syllables:3},{name:"Fluffybum",reg:"baby",syllables:3},
      {name:"Smooshface",reg:"baby",syllables:2},{name:"Jellybean",reg:"food",syllables:3},{name:"Gumdrop",reg:"food",syllables:2},{name:"Candyfloss",reg:"food",syllables:3},{name:"Marshmallow",reg:"food",syllables:3},{name:"Cupcake",reg:"food",syllables:2},
    ],
  },
  sighthound: {
    boy: [
      {name:"Nonchalance",reg:"aloof",syllables:3},{name:"Indifference",reg:"aloof",syllables:4},{name:"Lassitude",reg:"aloof",syllables:3},{name:"Apathy",reg:"aloof",syllables:3},{name:"Sangfroid",reg:"aloof",syllables:2},{name:"Equanimity",reg:"aloof",syllables:5},
      {name:"Miles",reg:"mundane",syllables:1},{name:"Julian",reg:"grand",syllables:3},{name:"Lawrence",reg:"grand",syllables:2},{name:"Nathaniel",reg:"grand",syllables:4},{name:"Richard",reg:"grand",syllables:2},{name:"Quentin",reg:"grand",syllables:2},{name:"Sebastian",reg:"grand",syllables:4},
      {name:"Vincent",reg:"grand",syllables:2},{name:"Alexander",reg:"grand",syllables:4},{name:"Caleb",reg:"mundane",syllables:2},{name:"Chester",reg:"mundane",syllables:2},{name:"Demetrius",reg:"grand",syllables:4},{name:"Leopold",reg:"grand",syllables:3},{name:"Samuel",reg:"mundane",syllables:3},{name:"Edgar",reg:"grand",syllables:2},
    ],
    girl: [
      {name:"Ennui",reg:"aloof",syllables:2},{name:"Langueur",reg:"aloof",syllables:2},{name:"Nonchalance",reg:"aloof",syllables:3},{name:"Aloofia",reg:"aloof",syllables:4},{name:"Indifferencia",reg:"aloof",syllables:5},{name:"Reservée",reg:"aloof",syllables:3},{name:"Glaciale",reg:"aloof",syllables:3},
      {name:"Lointaine",reg:"aloof",syllables:2},{name:"Austère",reg:"aloof",syllables:2},{name:"Altière",reg:"aloof",syllables:2},{name:"Superbe",reg:"aloof",syllables:2},
      {name:"Samantha",reg:"mundane",syllables:3},{name:"Bethany",reg:"mundane",syllables:3},{name:"Tara",reg:"mundane",syllables:2},{name:"Amanda",reg:"mundane",syllables:3},{name:"Ashley",reg:"mundane",syllables:2},{name:"Megan",reg:"mundane",syllables:2},{name:"Hannah",reg:"mundane",syllables:2},
      {name:"Brittany",reg:"mundane",syllables:3},{name:"Dora",reg:"mundane",syllables:2},{name:"Melissa",reg:"mundane",syllables:3},{name:"Nicole",reg:"mundane",syllables:2},{name:"Rachel",reg:"mundane",syllables:2},{name:"Jessica",reg:"mundane",syllables:3},{name:"Stephanie",reg:"mundane",syllables:3},
      {name:"Betty",reg:"mundane",syllables:2},{name:"Amy",reg:"mundane",syllables:2},{name:"Emily",reg:"mundane",syllables:3},{name:"Jennifer",reg:"mundane",syllables:3},{name:"Jenny",reg:"mundane",syllables:2},{name:"Mary",reg:"mundane",syllables:2},{name:"Sarah",reg:"mundane",syllables:2},
      {name:"Lucy",reg:"mundane",syllables:2},{name:"Anna",reg:"mundane",syllables:2},{name:"Kayla",reg:"mundane",syllables:2},{name:"Bailey",reg:"mundane",syllables:2},{name:"Phoebe",reg:"mundane",syllables:2},{name:"Heather",reg:"nature",syllables:2},{name:"Jasmine",reg:"nature",syllables:2},
    ],
  },
  sniffer: {
    boy: [
      {name:"Plodsworth",reg:"absurd",syllables:2},{name:"Glumley",reg:"absurd",syllables:2},{name:"Mourny",reg:"absurd",syllables:2},{name:"Trudgewick",reg:"absurd",syllables:2},{name:"Woebegone",reg:"absurd",syllables:3},{name:"Lachrymose",reg:"absurd",syllables:3},
      {name:"Dolorous",reg:"absurd",syllables:3},{name:"Melancholy",reg:"absurd",syllables:4},{name:"Lugubrious",reg:"absurd",syllables:4},{name:"Gloopington",reg:"absurd",syllables:3},
      {name:"John",reg:"mundane",syllables:1},{name:"Brian",reg:"mundane",syllables:2},{name:"Raymond",reg:"mundane",syllables:2},{name:"Ian",reg:"mundane",syllables:2},{name:"Alan",reg:"mundane",syllables:2},{name:"George",reg:"mundane",syllables:1},{name:"Arthur",reg:"mundane",syllables:2},
      {name:"David",reg:"mundane",syllables:2},{name:"Neil",reg:"mundane",syllables:1},{name:"Douglas",reg:"mundane",syllables:2},{name:"Kenneth",reg:"mundane",syllables:2},{name:"Dennis",reg:"mundane",syllables:2},{name:"Robert",reg:"mundane",syllables:2},{name:"Keith",reg:"mundane",syllables:1},
      {name:"Andrew",reg:"mundane",syllables:2},{name:"Edward",reg:"mundane",syllables:2},{name:"Derek",reg:"mundane",syllables:2},{name:"Charles",reg:"mundane",syllables:1},{name:"Kevin",reg:"mundane",syllables:2},{name:"Martin",reg:"mundane",syllables:2},{name:"Trevor",reg:"mundane",syllables:2},
      {name:"Peter",reg:"mundane",syllables:2},{name:"William",reg:"mundane",syllables:2},{name:"Richard",reg:"mundane",syllables:2},{name:"Clive",reg:"mundane",syllables:1},{name:"Duncan",reg:"mundane",syllables:2},{name:"Graham",reg:"mundane",syllables:2},{name:"Simon",reg:"mundane",syllables:2},
      {name:"Gordon",reg:"mundane",syllables:2},{name:"Colin",reg:"mundane",syllables:2},{name:"Barry",reg:"mundane",syllables:2},{name:"Donald",reg:"mundane",syllables:2},{name:"Norman",reg:"mundane",syllables:2},{name:"Basil",reg:"mundane",syllables:2},{name:"Oliver",reg:"mundane",syllables:3},
    ],
    girl: [
      {name:"Gloomsbury",reg:"absurd",syllables:3},{name:"Woesworth",reg:"absurd",syllables:2},{name:"Mournington",reg:"absurd",syllables:3},{name:"Doleful",reg:"absurd",syllables:2},{name:"Plaintive",reg:"absurd",syllables:2},{name:"Lamentia",reg:"absurd",syllables:3},
      {name:"Wistfulina",reg:"absurd",syllables:3},{name:"Lacrimosa",reg:"absurd",syllables:4},{name:"Tristesse",reg:"absurd",syllables:2},{name:"Despondina",reg:"absurd",syllables:3},{name:"Desolata",reg:"absurd",syllables:4},{name:"Miseria",reg:"absurd",syllables:4},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Cuddlekins",reg:"baby",syllables:3},{name:"Puddingkins",reg:"baby",syllables:3},
    ],
  },
  giant: {
    boy: [
      {name:"Teacup",reg:"ironic",syllables:2},{name:"Dainty",reg:"ironic",syllables:2},{name:"Nimble",reg:"ironic",syllables:2},{name:"Tinykins",reg:"ironic",syllables:3},{name:"Tinch",reg:"ironic",syllables:1},{name:"Teeny",reg:"ironic",syllables:2},{name:"Delicate",reg:"ironic",syllables:3},
      {name:"Petite",reg:"ironic",syllables:2},{name:"Gossamer",reg:"ironic",syllables:3},{name:"Smidgeon",reg:"ironic",syllables:2},{name:"Titchy",reg:"ironic",syllables:2},{name:"Dinky",reg:"ironic",syllables:2},{name:"Lilliput",reg:"ironic",syllables:3},
      {name:"Miniscule",reg:"ironic",syllables:3},{name:"Microscopic",reg:"ironic",syllables:4},{name:"Pocket",reg:"ironic",syllables:2},{name:"Otto",reg:"mundane",syllables:2},{name:"Otis",reg:"mundane",syllables:2},{name:"Remy",reg:"mundane",syllables:2},{name:"Saul",reg:"mundane",syllables:1},{name:"Silas",reg:"mundane",syllables:2},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Noo-Noo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},
    ],
    girl: [
      {name:"Titchy",reg:"ironic",syllables:2},{name:"WeeDee",reg:"ironic",syllables:2},{name:"Petite",reg:"ironic",syllables:2},{name:"Dinky",reg:"ironic",syllables:2},{name:"Lilliput",reg:"ironic",syllables:3},{name:"Minikin",reg:"ironic",syllables:3},{name:"Daintybell",reg:"ironic",syllables:3},
      {name:"Thistledown",reg:"ironic",syllables:3},{name:"Gossamera",reg:"ironic",syllables:3},{name:"Featherina",reg:"ironic",syllables:4},{name:"Pixie",reg:"ironic",syllables:2},{name:"Elfin",reg:"ironic",syllables:2},{name:"Twiggy",reg:"ironic",syllables:2},
      {name:"Mote",reg:"ironic",syllables:1},{name:"Speck",reg:"ironic",syllables:1},{name:"Smidge",reg:"ironic",syllables:1},{name:"Milly",reg:"mundane",syllables:2},{name:"Molly",reg:"mundane",syllables:2},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Cuddlekins",reg:"baby",syllables:3},{name:"Tiddlywink",reg:"baby",syllables:3},
    ],
  },
  terrier: {
    boy: [
      {name:"Chaos",reg:"chaos",syllables:2},{name:"Havoc",reg:"chaos",syllables:2},{name:"Mayhem",reg:"chaos",syllables:2},{name:"Bedlam",reg:"chaos",syllables:2},{name:"Ruckus",reg:"chaos",syllables:2},{name:"Pandemonium",reg:"chaos",syllables:5},{name:"Anarchy",reg:"chaos",syllables:3},
      {name:"Turmoil",reg:"chaos",syllables:2},{name:"Brouhaha",reg:"chaos",syllables:3},{name:"Kerfuffle",reg:"chaos",syllables:3},{name:"Uproar",reg:"chaos",syllables:2},{name:"Tumult",reg:"chaos",syllables:2},{name:"Fracas",reg:"chaos",syllables:2},{name:"Commotion",reg:"chaos",syllables:3},
      {name:"Hubbub",reg:"chaos",syllables:2},{name:"Furore",reg:"chaos",syllables:3},{name:"Hullabaloo",reg:"chaos",syllables:4},{name:"Clamour",reg:"chaos",syllables:2},{name:"Cacophony",reg:"chaos",syllables:4},{name:"Rampage",reg:"chaos",syllables:2},{name:"Maelstrom",reg:"chaos",syllables:2},{name:"Melee",reg:"chaos",syllables:2},
    ],
    girl: [
      {name:"Frenzina",reg:"chaos",syllables:3},{name:"Rampeena",reg:"chaos",syllables:3},{name:"Commotica",reg:"chaos",syllables:4},{name:"Furory",reg:"chaos",syllables:3},{name:"Clamoureena",reg:"chaos",syllables:4},{name:"Pandemonia",reg:"chaos",syllables:4},{name:"Anarchia",reg:"chaos",syllables:4},
      {name:"Mischief",reg:"chaos",syllables:2},{name:"Turbulence",reg:"chaos",syllables:3},{name:"Whirlwind",reg:"chaos",syllables:2},{name:"Tempest",reg:"chaos",syllables:2},{name:"Gale",reg:"chaos",syllables:1},{name:"Tempesta",reg:"chaos",syllables:3},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Tutu",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Tiddlywink",reg:"baby",syllables:3},
    ],
  },
  retriever: {
    boy: [
      {name:"Biscuit",reg:"food",syllables:2},{name:"Pudding",reg:"food",syllables:2},{name:"Custard",reg:"food",syllables:2},{name:"Gravy",reg:"food",syllables:2},{name:"Crumble",reg:"food",syllables:2},{name:"Dumpling",reg:"food",syllables:2},{name:"Wobble",reg:"chaos",syllables:2},
      {name:"Jelly",reg:"food",syllables:2},{name:"Sausage",reg:"food",syllables:2},{name:"Cobbler",reg:"food",syllables:2},{name:"Treacle",reg:"food",syllables:2},{name:"Blancmange",reg:"food",syllables:2},{name:"Syllabub",reg:"food",syllables:3},{name:"Spotted Dick",reg:"food",syllables:3},
      {name:"Douglas",reg:"mundane",syllables:2},{name:"Barnaby",reg:"grand",syllables:3},{name:"Edmund",reg:"grand",syllables:2},{name:"Roderick",reg:"grand",syllables:3},{name:"Herbert",reg:"mundane",syllables:2},{name:"Clarence",reg:"grand",syllables:2},{name:"Frederick",reg:"grand",syllables:3},
      {name:"Harold",reg:"mundane",syllables:2},{name:"Norman",reg:"mundane",syllables:2},{name:"Stanley",reg:"mundane",syllables:2},{name:"Reginald",reg:"grand",syllables:3},{name:"Humphrey",reg:"grand",syllables:2},{name:"Archibald",reg:"grand",syllables:3},{name:"Algernon",reg:"grand",syllables:3},
      {name:"William",reg:"mundane",syllables:2},{name:"Oliver",reg:"mundane",syllables:3},{name:"Basil",reg:"mundane",syllables:2},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Noo-Noo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},
    ],
    girl: [
      {name:"Treacle",reg:"food",syllables:2},{name:"Trifle",reg:"food",syllables:2},{name:"Scone",reg:"food",syllables:1},{name:"Muffin",reg:"food",syllables:2},{name:"Pudding",reg:"food",syllables:2},{name:"Doughnut",reg:"food",syllables:2},{name:"Eclair",reg:"food",syllables:2},
      {name:"Profiterole",reg:"food",syllables:4},{name:"Crumpet",reg:"food",syllables:2},{name:"Waffle",reg:"food",syllables:2},{name:"Biscuit",reg:"food",syllables:2},{name:"Flapjack",reg:"food",syllables:2},{name:"Brownie",reg:"food",syllables:2},{name:"Pavlova",reg:"food",syllables:3},
      {name:"Meringue",reg:"food",syllables:2},{name:"Charlotte",reg:"mundane",syllables:2},{name:"Margaret",reg:"mundane",syllables:3},{name:"Dorothy",reg:"mundane",syllables:3},{name:"Winifred",reg:"mundane",syllables:3},{name:"Edith",reg:"mundane",syllables:2},{name:"Florence",reg:"mundane",syllables:2},
      {name:"Beatrice",reg:"grand",syllables:3},{name:"Gertrude",reg:"mundane",syllables:2},{name:"Constance",reg:"mundane",syllables:2},{name:"Millicent",reg:"grand",syllables:3},{name:"Prudence",reg:"mundane",syllables:2},{name:"Hortense",reg:"grand",syllables:2},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Jellybean",reg:"food",syllables:3},{name:"Candyfloss",reg:"food",syllables:3},{name:"Cupcake",reg:"food",syllables:2},
    ],
  },
  collie: {
    boy: [
      {name:"Frenetic",reg:"chaos",syllables:3},{name:"Hypervigilant",reg:"absurd",syllables:5},{name:"Relentless",reg:"absurd",syllables:3},{name:"Indefatigable",reg:"absurd",syllables:6},{name:"Obsessive",reg:"absurd",syllables:3},{name:"Perpetual",reg:"absurd",syllables:4},{name:"Ceaseless",reg:"absurd",syllables:2},
      {name:"Tenacious",reg:"absurd",syllables:4},{name:"Inexorable",reg:"absurd",syllables:5},{name:"Unstoppable",reg:"absurd",syllables:4},{name:"Tireless",reg:"absurd",syllables:2},{name:"Resolute",reg:"grand",syllables:3},
      {name:"Duncan",reg:"mundane",syllables:2},{name:"Angus",reg:"mundane",syllables:2},{name:"Hamish",reg:"mundane",syllables:2},{name:"Fraser",reg:"mundane",syllables:2},{name:"Rory",reg:"mundane",syllables:2},{name:"Fergus",reg:"mundane",syllables:2},{name:"Malcolm",reg:"mundane",syllables:2},
    ],
    girl: [
      {name:"Frenzied",reg:"chaos",syllables:2},{name:"Hyperactive",reg:"absurd",syllables:4},{name:"Incessant",reg:"absurd",syllables:3},{name:"Ceaseless",reg:"absurd",syllables:2},{name:"Tireless",reg:"absurd",syllables:2},{name:"Restless",reg:"absurd",syllables:2},{name:"Vigilant",reg:"absurd",syllables:3},
      {name:"Anxious",reg:"absurd",syllables:2},{name:"Compulsive",reg:"absurd",syllables:3},{name:"Driven",reg:"absurd",syllables:2},{name:"Manic",reg:"chaos",syllables:2},{name:"Frantic",reg:"chaos",syllables:2},{name:"Relentless",reg:"absurd",syllables:3},
      {name:"Fiona",reg:"mundane",syllables:3},{name:"Catriona",reg:"mundane",syllables:4},{name:"Morag",reg:"mundane",syllables:2},{name:"Isla",reg:"mundane",syllables:2},{name:"Kirsty",reg:"mundane",syllables:2},{name:"Flora",reg:"nature",syllables:2},{name:"Heather",reg:"nature",syllables:2},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},
    ],
  },
  poodle: {
    boy: [
      {name:"Existentiale",reg:"absurd",syllables:5},{name:"Absurdisme",reg:"absurd",syllables:3},{name:"Nihilisme",reg:"absurd",syllables:3},{name:"Paradoxe",reg:"absurd",syllables:3},{name:"Dialectique",reg:"absurd",syllables:4},{name:"Epistemique",reg:"absurd",syllables:5},{name:"Ontologie",reg:"absurd",syllables:4},
      {name:"Hermeneutique",reg:"absurd",syllables:5},{name:"Axiomatique",reg:"absurd",syllables:5},{name:"Syllogisme",reg:"absurd",syllables:4},
      {name:"Pierre",reg:"grand",syllables:1},{name:"Jacques",reg:"grand",syllables:1},{name:"François",reg:"grand",syllables:2},{name:"Henri",reg:"grand",syllables:2},{name:"Marcel",reg:"grand",syllables:2},{name:"Gaston",reg:"grand",syllables:2},{name:"Théodore",reg:"grand",syllables:3},
      {name:"Galileo",reg:"grand",syllables:4},{name:"Einstein",reg:"grand",syllables:2},{name:"Socrates",reg:"grand",syllables:3},{name:"Aristotle",reg:"grand",syllables:4},{name:"Darwin",reg:"grand",syllables:2},{name:"Newton",reg:"grand",syllables:2},{name:"Freud",reg:"grand",syllables:1},{name:"Cicero",reg:"grand",syllables:3},
    ],
    girl: [
      {name:"Dialectique",reg:"absurd",syllables:4},{name:"Epistemique",reg:"absurd",syllables:5},{name:"Ontologie",reg:"absurd",syllables:4},{name:"Semantique",reg:"absurd",syllables:3},{name:"Phenomenologie",reg:"absurd",syllables:7},{name:"Metaphysique",reg:"absurd",syllables:4},
      {name:"Colette",reg:"grand",syllables:2},{name:"Marguerite",reg:"grand",syllables:3},{name:"Simone",reg:"grand",syllables:2},{name:"Yvette",reg:"grand",syllables:2},{name:"Brigitte",reg:"grand",syllables:2},{name:"Monique",reg:"grand",syllables:2},{name:"Claudette",reg:"grand",syllables:2},{name:"Giselle",reg:"grand",syllables:2},
      {name:"Hypatia",reg:"grand",syllables:4},{name:"Cornelia",reg:"grand",syllables:4},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},
    ],
  },
  dachshund: {
    boy: [
      {name:"Elongated",reg:"absurd",syllables:4},{name:"Stretched",reg:"absurd",syllables:1},{name:"Horizontal",reg:"absurd",syllables:4},{name:"Lengthwise",reg:"absurd",syllables:2},{name:"Extended",reg:"absurd",syllables:3},{name:"Protracted",reg:"absurd",syllables:3},{name:"Oblong",reg:"absurd",syllables:2},
      {name:"Longitudinal",reg:"absurd",syllables:5},{name:"Accordion",reg:"absurd",syllables:4},{name:"Telescopic",reg:"absurd",syllables:4},
      {name:"Klaus",reg:"grand",syllables:1},{name:"Dieter",reg:"mundane",syllables:2},{name:"Gunter",reg:"mundane",syllables:2},{name:"Franz",reg:"mundane",syllables:1},{name:"Hans",reg:"mundane",syllables:1},{name:"Otto",reg:"mundane",syllables:2},{name:"Ernst",reg:"mundane",syllables:1},{name:"Wolfgang",reg:"grand",syllables:2},{name:"Napoleon",reg:"grand",syllables:4},{name:"Rasputin",reg:"grand",syllables:3},
    ],
    girl: [
      {name:"Slinky",reg:"absurd",syllables:2},{name:"Sinuous",reg:"absurd",syllables:3},{name:"Serpentine",reg:"absurd",syllables:3},{name:"Svelte",reg:"absurd",syllables:1},{name:"Streamlined",reg:"absurd",syllables:3},{name:"Filiform",reg:"absurd",syllables:3},{name:"Ribbonesque",reg:"absurd",syllables:3},{name:"Linear",reg:"absurd",syllables:3},
      {name:"Helga",reg:"mundane",syllables:2},{name:"Greta",reg:"mundane",syllables:2},{name:"Hilde",reg:"mundane",syllables:2},{name:"Inge",reg:"mundane",syllables:2},{name:"Ursula",reg:"mundane",syllables:3},{name:"Elke",reg:"mundane",syllables:2},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},
    ],
  },
  german: {
    boy: [
      {name:"Heinrich",reg:"grand",syllables:2},{name:"Wolfgang",reg:"grand",syllables:2},{name:"Dieter",reg:"mundane",syllables:2},{name:"Klaus",reg:"mundane",syllables:1},{name:"Reinhard",reg:"grand",syllables:2},{name:"Gunther",reg:"mundane",syllables:2},{name:"Manfred",reg:"mundane",syllables:2},
      {name:"Siegfried",reg:"grand",syllables:2},{name:"Konrad",reg:"grand",syllables:2},{name:"Ulrich",reg:"grand",syllables:2},{name:"Ludwig",reg:"grand",syllables:2},{name:"Friedrich",reg:"grand",syllables:2},{name:"Albrecht",reg:"grand",syllables:2},{name:"Maximilian",reg:"grand",syllables:5},
      {name:"Amadeus",reg:"grand",syllables:4},{name:"Beethoven",reg:"grand",syllables:3},{name:"Mozart",reg:"grand",syllables:2},
    ],
    girl: [
      {name:"Hildegard",reg:"grand",syllables:3},{name:"Brunhilde",reg:"grand",syllables:3},{name:"Lieselotte",reg:"grand",syllables:4},{name:"Gertrude",reg:"mundane",syllables:2},{name:"Ingeborg",reg:"grand",syllables:3},{name:"Waltraud",reg:"grand",syllables:2},{name:"Elfriede",reg:"grand",syllables:3},
      {name:"Mathilde",reg:"grand",syllables:2},{name:"Adelheid",reg:"grand",syllables:3},{name:"Hedwig",reg:"mundane",syllables:2},{name:"Mechthild",reg:"grand",syllables:2},{name:"Kunigunde",reg:"grand",syllables:4},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},
    ],
  },
  spaniel: {
    boy: [
      {name:"Archibald",reg:"grand",syllables:3},{name:"Wellington",reg:"grand",syllables:3},{name:"Rupert",reg:"grand",syllables:2},{name:"Cornelius",reg:"grand",syllables:4},{name:"Peregrine",reg:"grand",syllables:3},{name:"Humphrey",reg:"grand",syllables:2},{name:"Everard",reg:"grand",syllables:3},
      {name:"Montgomery",reg:"grand",syllables:3},{name:"Algernon",reg:"grand",syllables:3},{name:"Bartholomew",reg:"grand",syllables:4},{name:"Reginald",reg:"grand",syllables:3},{name:"Auberon",reg:"grand",syllables:3},{name:"Lysander",reg:"grand",syllables:3},{name:"Leofric",reg:"grand",syllables:3},
    ],
    girl: [
      {name:"Georgiana",reg:"grand",syllables:4},{name:"Arabella",reg:"grand",syllables:4},{name:"Clementine",reg:"grand",syllables:3},{name:"Millicent",reg:"grand",syllables:3},{name:"Cordelia",reg:"grand",syllables:4},{name:"Beatrice",reg:"grand",syllables:3},{name:"Frederica",reg:"grand",syllables:4},
      {name:"Constance",reg:"grand",syllables:2},{name:"Prudence",reg:"mundane",syllables:2},{name:"Imogen",reg:"grand",syllables:3},{name:"Sophronia",reg:"grand",syllables:4},{name:"Wilhelmina",reg:"grand",syllables:5},{name:"Henrietta",reg:"grand",syllables:4},{name:"Lavinia",reg:"grand",syllables:4},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Cuddlekins",reg:"baby",syllables:3},
    ],
  },
  character: {
    boy: [
      {name:"Notorious",reg:"grand",syllables:4},{name:"Incomparable",reg:"grand",syllables:5},{name:"Inimitable",reg:"grand",syllables:5},{name:"Illustrious",reg:"grand",syllables:4},
      {name:"Napoleon",reg:"grand",syllables:4},{name:"Rasputin",reg:"grand",syllables:3},{name:"Genghis",reg:"grand",syllables:2},{name:"Churchill",reg:"grand",syllables:2},{name:"Mussolini",reg:"grand",syllables:4},
      {name:"Waldo",reg:"mundane",syllables:2},{name:"Otis",reg:"mundane",syllables:2},{name:"Homer",reg:"mundane",syllables:2},{name:"Gus",reg:"mundane",syllables:1},{name:"Alf",reg:"mundane",syllables:1},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Noo-Noo",reg:"baby",syllables:2},{name:"Goo-Goo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},{name:"Smooshface",reg:"baby",syllables:2},
    ],
    girl: [
      {name:"Notorious",reg:"grand",syllables:4},{name:"Incomparable",reg:"grand",syllables:5},{name:"Inimitable",reg:"grand",syllables:5},{name:"Illustrious",reg:"grand",syllables:4},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Tutu",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},{name:"Coco",reg:"baby",syllables:2},
      {name:"Snugglebum",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},{name:"Smooshface",reg:"baby",syllables:2},{name:"Jellybean",reg:"food",syllables:3},{name:"Cupcake",reg:"food",syllables:2},{name:"Candyfloss",reg:"food",syllables:3},
      {name:"Wibble",reg:"chaos",syllables:2},{name:"Dizzy",reg:"chaos",syllables:2},{name:"Topsy",reg:"chaos",syllables:2},{name:"Doolally",reg:"chaos",syllables:3},
    ],
  },
  default: {
    boy: [
      {name:"Archibald",reg:"grand",syllables:3},{name:"Barnaby",reg:"grand",syllables:3},{name:"Cornelius",reg:"grand",syllables:4},{name:"Douglas",reg:"mundane",syllables:2},{name:"Edmund",reg:"grand",syllables:2},{name:"Frederick",reg:"grand",syllables:3},{name:"Geoffrey",reg:"mundane",syllables:2},
      {name:"Herbert",reg:"mundane",syllables:2},{name:"Jasper",reg:"grand",syllables:2},{name:"Lionel",reg:"grand",syllables:3},{name:"Montgomery",reg:"grand",syllables:3},{name:"Norman",reg:"mundane",syllables:2},{name:"Oswald",reg:"grand",syllables:2},{name:"Percival",reg:"grand",syllables:3},
      {name:"Reginald",reg:"grand",syllables:3},{name:"Stanley",reg:"mundane",syllables:2},{name:"Theodore",reg:"grand",syllables:3},{name:"Ulysses",reg:"grand",syllables:3},{name:"Vincent",reg:"grand",syllables:2},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},
    ],
    girl: [
      {name:"Arabella",reg:"grand",syllables:4},{name:"Beatrice",reg:"grand",syllables:3},{name:"Clementine",reg:"grand",syllables:3},{name:"Dorothy",reg:"mundane",syllables:3},{name:"Eleanor",reg:"grand",syllables:3},{name:"Frederica",reg:"grand",syllables:4},{name:"Georgiana",reg:"grand",syllables:4},
      {name:"Helena",reg:"grand",syllables:3},{name:"Isadora",reg:"grand",syllables:4},{name:"Lavinia",reg:"grand",syllables:4},{name:"Millicent",reg:"grand",syllables:3},{name:"Nora",reg:"mundane",syllables:2},{name:"Octavia",reg:"grand",syllables:4},{name:"Prudence",reg:"mundane",syllables:2},
      {name:"Rosalind",reg:"grand",syllables:3},{name:"Sophronia",reg:"grand",syllables:4},{name:"Tabitha",reg:"grand",syllables:3},{name:"Ursula",reg:"grand",syllables:3},{name:"Vivienne",reg:"grand",syllables:3},{name:"Winifred",reg:"mundane",syllables:3},
      {name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},
    ],
  },
};

// ── DOG WORD BANKS ─────────────────────────────────────────────────────────────
const DOG_WORDS: Record<string, WordEntry[]> = {
  spaniel:    [{word:"Flush",reg:"nature",firstLetter:"f"},{word:"Fetch",reg:"nature",firstLetter:"f"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Waggle",reg:"chaos",firstLetter:"w"},{word:"Splash",reg:"chaos",firstLetter:"s"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Frolic",reg:"chaos",firstLetter:"f"},{word:"Gambol",reg:"chaos",firstLetter:"g"},{word:"Prance",reg:"grand",firstLetter:"p"},{word:"Spring",reg:"chaos",firstLetter:"s"},{word:"Paddle",reg:"chaos",firstLetter:"p"},{word:"Romp",reg:"chaos",firstLetter:"r"}],
  retriever:  [{word:"Fetch",reg:"nature",firstLetter:"f"},{word:"Wag",reg:"baby",firstLetter:"w"},{word:"Paddle",reg:"chaos",firstLetter:"p"},{word:"Lollop",reg:"chaos",firstLetter:"l"},{word:"Galumph",reg:"chaos",firstLetter:"g"},{word:"Scoff",reg:"food",firstLetter:"s"},{word:"Snuffle",reg:"baby",firstLetter:"s"},{word:"Mooch",reg:"mundane",firstLetter:"m"},{word:"Slurp",reg:"food",firstLetter:"s"},{word:"Devour",reg:"food",firstLetter:"d"},{word:"Inhale",reg:"food",firstLetter:"i"},{word:"Bound",reg:"chaos",firstLetter:"b"}],
  collie:     [{word:"Herd",reg:"grand",firstLetter:"h"},{word:"Dart",reg:"chaos",firstLetter:"d"},{word:"Circle",reg:"grand",firstLetter:"c"},{word:"Weave",reg:"grand",firstLetter:"w"},{word:"Dash",reg:"chaos",firstLetter:"d"},{word:"Sprint",reg:"chaos",firstLetter:"s"},{word:"Gather",reg:"grand",firstLetter:"g"},{word:"Muster",reg:"grand",firstLetter:"m"},{word:"Stalk",reg:"chaos",firstLetter:"s"},{word:"Border",reg:"grand",firstLetter:"b"},{word:"Cast",reg:"grand",firstLetter:"c"}],
  boxer:      [{word:"Charge",reg:"chaos",firstLetter:"c"},{word:"Barrel",reg:"chaos",firstLetter:"b"},{word:"Blunder",reg:"chaos",firstLetter:"b"},{word:"Crash",reg:"chaos",firstLetter:"c"},{word:"Bounce",reg:"chaos",firstLetter:"b"},{word:"Lurch",reg:"chaos",firstLetter:"l"},{word:"Wobble",reg:"chaos",firstLetter:"w"},{word:"Stumble",reg:"chaos",firstLetter:"s"},{word:"Gallumph",reg:"chaos",firstLetter:"g"},{word:"Swagger",reg:"grand",firstLetter:"s"},{word:"Bluster",reg:"chaos",firstLetter:"b"},{word:"Bumble",reg:"baby",firstLetter:"b"}],
  sniffer:    [{word:"Sniff",reg:"mundane",firstLetter:"s"},{word:"Snuffle",reg:"mundane",firstLetter:"s"},{word:"Trail",reg:"mundane",firstLetter:"t"},{word:"Track",reg:"mundane",firstLetter:"t"},{word:"Plod",reg:"mundane",firstLetter:"p"},{word:"Mosey",reg:"mundane",firstLetter:"m"},{word:"Amble",reg:"mundane",firstLetter:"a"},{word:"Dawdle",reg:"mundane",firstLetter:"d"},{word:"Meander",reg:"mundane",firstLetter:"m"},{word:"Shuffle",reg:"mundane",firstLetter:"s"},{word:"Trudge",reg:"mundane",firstLetter:"t"},{word:"Lumber",reg:"mundane",firstLetter:"l"}],
  sighthound: [{word:"Sprint",reg:"grand",firstLetter:"s"},{word:"Dart",reg:"chaos",firstLetter:"d"},{word:"Bolt",reg:"chaos",firstLetter:"b"},{word:"Flash",reg:"chaos",firstLetter:"f"},{word:"Streak",reg:"chaos",firstLetter:"s"},{word:"Glide",reg:"grand",firstLetter:"g"},{word:"Flow",reg:"grand",firstLetter:"f"},{word:"Skim",reg:"grand",firstLetter:"s"},{word:"Scorch",reg:"chaos",firstLetter:"s"},{word:"Race",reg:"chaos",firstLetter:"r"},{word:"Sweep",reg:"grand",firstLetter:"s"},{word:"Blur",reg:"chaos",firstLetter:"b"}],
  giant:      [{word:"Lumber",reg:"chaos",firstLetter:"l"},{word:"Plod",reg:"mundane",firstLetter:"p"},{word:"Stomp",reg:"chaos",firstLetter:"s"},{word:"Thud",reg:"chaos",firstLetter:"t"},{word:"Rumble",reg:"chaos",firstLetter:"r"},{word:"Trundle",reg:"mundane",firstLetter:"t"},{word:"Sway",reg:"grand",firstLetter:"s"},{word:"Loom",reg:"chaos",firstLetter:"l"},{word:"Hulk",reg:"grand",firstLetter:"h"},{word:"Thunder",reg:"chaos",firstLetter:"t"},{word:"Shamble",reg:"chaos",firstLetter:"s"},{word:"Quake",reg:"chaos",firstLetter:"q"}],
  poodle:     [{word:"Prance",reg:"grand",firstLetter:"p"},{word:"Strut",reg:"grand",firstLetter:"s"},{word:"Waltz",reg:"grand",firstLetter:"w"},{word:"Sashay",reg:"grand",firstLetter:"s"},{word:"Glide",reg:"grand",firstLetter:"g"},{word:"Mince",reg:"grand",firstLetter:"m"},{word:"Flourish",reg:"grand",firstLetter:"f"},{word:"Pirouette",reg:"grand",firstLetter:"p"},{word:"Pose",reg:"grand",firstLetter:"p"},{word:"Primp",reg:"grand",firstLetter:"p"},{word:"Preen",reg:"grand",firstLetter:"p"},{word:"Pompadour",reg:"grand",firstLetter:"p"}],
  lapdog:     [{word:"Prance",reg:"grand",firstLetter:"p"},{word:"Bounce",reg:"baby",firstLetter:"b"},{word:"Waltz",reg:"grand",firstLetter:"w"},{word:"Flounce",reg:"grand",firstLetter:"f"},{word:"Sashay",reg:"grand",firstLetter:"s"},{word:"Fluff",reg:"baby",firstLetter:"f"},{word:"Frolic",reg:"chaos",firstLetter:"f"},{word:"Shimmy",reg:"grand",firstLetter:"s"},{word:"Pamper",reg:"baby",firstLetter:"p"},{word:"Flutter",reg:"baby",firstLetter:"f"},{word:"Simper",reg:"grand",firstLetter:"s"},{word:"Glitter",reg:"grand",firstLetter:"g"}],
  character:  [{word:"Snort",reg:"chaos",firstLetter:"s"},{word:"Waddle",reg:"chaos",firstLetter:"w"},{word:"Tumble",reg:"chaos",firstLetter:"t"},{word:"Bumble",reg:"chaos",firstLetter:"b"},{word:"Toddle",reg:"baby",firstLetter:"t"},{word:"Wobble",reg:"chaos",firstLetter:"w"},{word:"Totter",reg:"chaos",firstLetter:"t"},{word:"Blunder",reg:"chaos",firstLetter:"b"},{word:"Grumble",reg:"chaos",firstLetter:"g"},{word:"Wheeze",reg:"chaos",firstLetter:"w"},{word:"Puff",reg:"chaos",firstLetter:"p"},{word:"Snore",reg:"mundane",firstLetter:"s"}],
  terrier:    [{word:"Bolt",reg:"chaos",firstLetter:"b"},{word:"Dig",reg:"chaos",firstLetter:"d"},{word:"Scrap",reg:"chaos",firstLetter:"s"},{word:"Scruff",reg:"chaos",firstLetter:"s"},{word:"Rumpus",reg:"chaos",firstLetter:"r"},{word:"Rattle",reg:"chaos",firstLetter:"r"},{word:"Pounce",reg:"chaos",firstLetter:"p"},{word:"Bristle",reg:"chaos",firstLetter:"b"},{word:"Snap",reg:"chaos",firstLetter:"s"},{word:"Yap",reg:"chaos",firstLetter:"y"},{word:"Scurry",reg:"chaos",firstLetter:"s"},{word:"Burrow",reg:"chaos",firstLetter:"b"}],
  german:     [{word:"March",reg:"grand",firstLetter:"m"},{word:"Drill",reg:"grand",firstLetter:"d"},{word:"Patrol",reg:"grand",firstLetter:"p"},{word:"Guard",reg:"grand",firstLetter:"g"},{word:"Flank",reg:"grand",firstLetter:"f"},{word:"Advance",reg:"grand",firstLetter:"a"},{word:"Deploy",reg:"grand",firstLetter:"d"},{word:"Intercept",reg:"grand",firstLetter:"i"},{word:"Secure",reg:"grand",firstLetter:"s"},{word:"Enforce",reg:"grand",firstLetter:"e"},{word:"Execute",reg:"grand",firstLetter:"e"},{word:"Breach",reg:"grand",firstLetter:"b"}],
  default:    [{word:"Trot",reg:"mundane",firstLetter:"t"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Wag",reg:"baby",firstLetter:"w"},{word:"Prance",reg:"grand",firstLetter:"p"},{word:"Romp",reg:"chaos",firstLetter:"r"},{word:"Caper",reg:"chaos",firstLetter:"c"},{word:"Frolic",reg:"chaos",firstLetter:"f"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Saunter",reg:"mundane",firstLetter:"s"},{word:"Gambol",reg:"chaos",firstLetter:"g"},{word:"Ramble",reg:"mundane",firstLetter:"r"},{word:"Mooch",reg:"mundane",firstLetter:"m"}],
};

// ── REASONING ──────────────────────────────────────────────────────────────────
const REASONING: Record<string, string[]> = {
  lapdog:     ["Looks like a small cloud that someone has given opinions. The Bishop was the natural conclusion.","Perpetually groomed, permanently cheerful, mildly judgmental. Dean of the Diocese of the Sitting Room.","Has maintained this exact hairstyle for several centuries. An Archdeacon of consistency.","Arrives in a room the way a bishop arrives at a christening -- expected, overdressed, and faintly disapproving.","Four hundred years of palace living leaves a dog with very particular ideas about ceremony."],
  boxer:      ["Approaches every situation with maximum enthusiasm and minimum strategy. Corporal material.","Loyal, loud, and absolutely convinced that sitting on your lap is a human right.","Looks permanently surprised, even at things it caused. The Sergeant's face says it all.","Never met a stranger. This is not always helpful on military exercises.","Approaches every day as though something brilliant is about to happen. It usually involves a sock."],
  sighthound: ["Forty miles per hour of elegant indifference. The earldom was awarded for sheer deportment.","Has always considered the peerage its natural social circle -- if anything, beneath it.","Has been aristocratic since before the British aristocracy was invented.","Moves through the world with the serene confidence of something that has never once been told no.","Sleeps seventeen hours a day with the dignity of someone who has earned it through noble lineage."],
  sniffer:    ["Has the air of a detective who solved the case three days ago and is merely waiting for everyone else.","Melancholy eyes, powerful nose, deeply suspicious of everything. Classic Chief Inspector.","Follows a scent with the focus of a detective who has forgotten why they started.","A nose more powerful than any instrument, deployed entirely in the service of biscuit detection.","The most expensive biological detection equipment in the world. Currently investigating a crisp packet."],
  giant:      ["So large that the title had to match the physical reality. Great was barely adequate.","The Magnificent was awarded at the first meeting. There was no second opinion.","Operates more like a geographic feature than an animal. The Formidable.","Sits on your lap with complete confidence of something that weighs sixty kilograms.","Was named Teacup at eight weeks. At eighteen months, the irony became structural."],
  terrier:    ["The only dog that regularly picks fights with things three times its size and usually wins.","A terrier would consider a title an unnecessary distraction from the serious business of digging.","Bred to chase rats down mines. Has never once revised its threat assessment since.","Six inches of righteous fury in a jacket of wiry fur.","Has declared war on the postman, the vacuum cleaner, and a leaf. Currently winning two of those."],
  retriever:  ["Dependable, cheerful, and utterly convinced every situation calls for a biscuit.","Greets burglars as enthusiastically as family members -- promoted on charm alone.","Has never met a puddle it didn't immediately lie down in.","Approaches every command with enthusiasm and then sits on your foot.","The only animal capable of looking genuinely hurt that there are no more biscuits."],
  collie:     ["The most intelligent dog in the world and absolutely cannot stop telling you about it.","Herds sheep, children, and visiting relatives with equal efficiency.","The Professor is the only rank that explains the permanently disappointed expression.","Has never once been off duty. Not once. Not even asleep."],
  poodle:     ["The most intelligent dog in the world and considerably better dressed than you.","Originally a water retriever, now primarily a philosopher. The doctorate was inevitable.","Regards the standard trim as a personal affront. Professor suits it far better.","Breeds above itself in intelligence and consistently knows it."],
  spaniel:    ["Spaniels have commanded hunting parties since the Tudor court. A generalship was long overdue.","Spent centuries giving orders to beaters and retrievers. Command suits it naturally.","Floppy ears and absolute authority -- the spaniel was born to lead.","The Field Marshal of the water meadow and the reed bed since 1600."],
  character:  ["A face like a fist, a personality like a party. The Incomparable was the most accurate description.","Breathes loudly through every social occasion with complete conviction it is doing this correctly.","Believes it is a much larger dog trapped in a terrible administrative error.","Looks directly into your eyes and then does exactly what it was going to do anyway."],
  dachshund:  ["Two thousand years of German engineering went into a dog that cannot reach most surfaces.","Six inches tall and absolutely convinced it could take a badger. Notorious was the only honest title.","Moves through the world like a very short scandal.","The proportions suggest an engineering compromise was made at some point. The dog disagrees."],
  default:    ["A dog of considerable distinction that has earned its title through sheer presence.","The rank was awarded after careful consideration. The evidence was considerable.","A distinguished animal that requires no historical precedent for its own importance."],
};

// ── NICKNAME WHITELIST ─────────────────────────────────────────────────────────
const NICKNAMES: Record<string, string> = {
  archibald:"Archie", bartholomew:"Baz", cornelius:"Cornie", reginald:"Reggie",
  algernon:"Algie", peregrine:"Perry", maximillian:"Max", maximilian:"Max",
  humphrey:"Humph", montgomery:"Monty", ferdinand:"Ferdie", alexander:"Alex",
  sebastian:"Seb", theodore:"Teddy", frederick:"Freddie", desmond:"Dez",
  wellington:"Welly", percival:"Percy", wilfred:"Wilf", sherlock:"Sherl",
  hercule:"Herc", augustus:"Gus", auberon:"Aubs", barnaby:"Barnie",
  benedictus:"Benny", fortunatus:"Forty", celestin:"Cel", florentine:"Flo",
  evangelina:"Evie", evangeline:"Evie", celestine:"Celly", sophronia:"Soph",
  euphemia:"Effie", wilhelmina:"Billie", clementine:"Clem", millicent:"Millie",
  frederica:"Freddie", constance:"Connie", prudence:"Prue", dorothea:"Dot",
  theodosia:"Teddy", philomena:"Philly", seraphine:"Sera", arabella:"Bella",
  georgiana:"Georgie", cassiopeia:"Cassie", andromeda:"Andi", isadora:"Izzy",
  pandemonium:"Panda", discombobulate:"Disco", hullabaloo:"Hully", pandemonia:"Panda",
  nonchalance:"Nona", glaciale:"Glayglay", langueur:"Langy", indifferencia:"Indie",
  aloofia:"Loofy", lachrymose:"Lacky", plodsworth:"Plodsy", gloopington:"Gloops",
  frenzina:"Frenzy", woebegone:"Woeby", maelstrom:"Maely", existentiale:"Exie",
  hermeneutique:"Hermy", elongated:"Longy", basil:"Baz", nincompoop:"Ninnie",
  chumbawumba:"Chumba", zippadeedooda:"Zippy", fortissimo:"Forty", bellisima:"Bella",
  snugglebum:"Snugs", cuddlekins:"Cuddles", squishface:"Squish", babbycakes:"Babs",
  piddlekins:"Piddle", tiddlywink:"Tiddles", fluffybum:"Fluffy", smooshface:"Smoosh",
  jellybean:"Jelly", marshmallow:"Marsh", candyfloss:"Candy", puddingkins:"Pudds",
  lambchop:"Lamby", fluffernutter:"Nutter", pumpkinhead:"Pumps",
  hypervigilant:"Hyper", indefatigable:"Indy", infinitesimal:"Tiny",
  imperceptible:"Imp", microscopic:"Micro", diminutive:"Dimmy",
  gossamera:"Gossie", daintybell:"Bell", galumph:"Lumphy", kerfuffle:"Kerfie",
  chuckles:"Chuck", pickles:"Picks", noodles:"Noods", chipmunk:"Chip",
};

function getNickname(firstName: string): string {
  return NICKNAMES[firstName.toLowerCase().replace(/[^a-z]/g,"")] || "";
}

// ── BREED GROUP ────────────────────────────────────────────────────────────────
function getGroup(breed: string): string {
  const b = breed.toLowerCase();
  if (b === "cavalier king charles spaniel") return "lapdog";
  if (b.includes("spaniel")) return "spaniel";
  if (b.includes("retriever") || b === "labrador" || b === "labradoodle" || b === "goldendoodle") return "retriever";
  if (b === "border collie" || b === "rough collie") return "collie";
  if (["staffordshire bull terrier","boxer","bull terrier","bulldog","french bulldog"].includes(b)) return "boxer";
  if (["basset hound","bloodhound","beagle"].includes(b)) return "sniffer";
  if (["greyhound","afghan hound","borzoi","saluki","irish wolfhound","lurcher","whippet","italian greyhound"].includes(b)) return "sighthound";
  if (["great dane","mastiff","saint bernard","newfoundland","leonberger"].includes(b)) return "giant";
  if (b === "poodle") return "poodle";
  if (["bichon frise","shih tzu","pomeranian","papillon","maltese","maltipoo","cavapoo","cavachon"].includes(b)) return "lapdog";
  if (b === "dachshund") return "dachshund";
  if (["german shepherd","doberman pinscher","rottweiler","weimaraner"].includes(b)) return "german";
  if (["pug","siberian husky","chihuahua","corgi","boston terrier"].includes(b)) return "character";
  if (b.includes("terrier") || b === "miniature schnauzer") return "terrier";
  if (b.includes("doodle") || b.includes("poo") || b === "jackapoo") return "default";
  return "default";
}

function pick<T>(arr: T[], seed: number): T { return arr[Math.abs(seed) % arr.length]; }

// ── MAIN GENERATOR ─────────────────────────────────────────────────────────────
function generateScored(breed: string, surname: string, gender: "boy"|"girl", baseSeed: number): { full: string; nickname: string; reasoning: string; score: number } | null {
  const group = getGroup(breed);
  const nameBank = (NAMES[group] || NAMES.default)[gender];
  const titleBank = gender === "boy" ? (BOY_TITLES[group] || BOY_TITLES.default) : (GIRL_TITLES[group] || GIRL_TITLES.default);
  const wordBank = DOG_WORDS[group] || DOG_WORDS.default;
  const reasoningBank = REASONING[group] || REASONING.default;

  const title = pick(titleBank, baseSeed);
  const firstName = pick(nameBank, baseSeed + 3);
  const dogWordEntry = pick(wordBank, baseSeed + 7);
  const alreadyHyphenated = surname.includes("-");
  const fullSurname = alreadyHyphenated ? surname : `${dogWordEntry.word}-${surname}`;
  const full = `${title.title} ${firstName.name} ${fullSurname}`;
  const reasoning = pick(reasoningBank, baseSeed + 11);
  const nickname = getNickname(firstName.name);
  const score = scoreName(title, firstName, dogWordEntry, surname);

  return { full, nickname, reasoning, score };
}

// ── UI ─────────────────────────────────────────────────────────────────────────
type Result = { full: string; nickname: string; reasoning: string; score: number };

export default function NameGeneratorPage() {
  const [breed, setBreed] = useState("");
  const [surname, setSurname] = useState("");
  const [gender, setGender] = useState<"boy"|"girl">("boy");
  const [results, setResults] = useState<Result[]|null>(null);

  function generate() {
    if (!breed) { alert("Please select a breed"); return; }
    if (!surname.trim()) { alert("Please enter your surname"); return; }
    const baseSeed = Math.floor(Math.random() * 10000);

    // Generate 15 candidates, score each, pick top 3 with different titles
    const candidates: Result[] = [];
    for (let i = 0; i < 15; i++) {
      const r = generateScored(breed, surname.trim(), gender, baseSeed + i * 17);
      if (r) candidates.push(r);
    }
    candidates.sort((a, b) => b.score - a.score);

    // Pick top 3 with different first words (title) to ensure variety
    const usedTitles = new Set<string>();
    const final: Result[] = [];
    for (const c of candidates) {
      const titleWord = c.full.split(" ")[0];
      if (!usedTitles.has(titleWord) && final.length < 3) {
        usedTitles.add(titleWord);
        final.push(c);
      }
    }
    // Fallback if not enough variety
    while (final.length < 3 && candidates.length > final.length) {
      final.push(candidates[final.length]);
    }

    setResults(final);
  }

  return (
    <>
      <Nav />
      <main style={{ minHeight:"100vh", padding:"clamp(60px,10vw,120px) clamp(16px,5vw,48px) 80px" }}>
        <div style={{ maxWidth:680, margin:"0 auto" }}>
          <h1 className="display" style={{ textAlign:"center", marginBottom:8 }}>
            Chum <span className="display-yellow">Name</span> Generator
          </h1>
          <p style={{ textAlign:"center", color:"var(--navy)", fontFamily:"var(--font-body)", fontSize:"1rem", fontWeight:600, marginBottom:40 }}>
            Give your dog the title they truly deserve
          </p>

          <div style={{ background:"var(--navy)", borderRadius:20, padding:"clamp(20px,4vw,36px)", marginBottom:24 }}>
            <label style={{ display:"block", color:"var(--yellow)", fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, fontFamily:"var(--font-body)" }}>Your dog&apos;s breed</label>
            <select value={breed} onChange={e => setBreed(e.target.value)}
              style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:breed?"#fff":"rgba(255,255,255,0.4)", fontFamily:"var(--font-body)", fontSize:"0.95rem", marginBottom:20, outline:"none", boxSizing:"border-box" }}>
              <option value="">-- Select a breed --</option>
              <optgroup label="Pedigree Chums Pack Breeds">
                {PACK_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
              </optgroup>
              <optgroup label="Other Breeds">
                {OTHER_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
              </optgroup>
            </select>

            <label style={{ display:"block", color:"var(--yellow)", fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, fontFamily:"var(--font-body)" }}>Your surname</label>
            <input type="text" value={surname} onChange={e => setSurname(e.target.value)}
              placeholder="e.g. Jones, Clarke, Thompson-Alexander..."
              maxLength={60} onKeyDown={e => e.key === "Enter" && generate()}
              style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontFamily:"var(--font-body)", fontSize:"0.95rem", marginBottom:20, outline:"none", boxSizing:"border-box" }} />

            <label style={{ display:"block", color:"var(--yellow)", fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10, fontFamily:"var(--font-body)" }}>Boy or girl?</label>
            <div style={{ display:"flex", gap:10, marginBottom:24 }}>
              {(["boy","girl"] as const).map(g => (
                <button key={g} onClick={() => setGender(g)}
                  style={{ flex:1, padding:12, borderRadius:12, border:`1.5px solid ${gender===g?"var(--yellow)":"rgba(255,255,255,0.15)"}`, background:gender===g?"var(--yellow)":"rgba(255,255,255,0.08)", color:gender===g?"var(--navy)":"#fff", fontFamily:"var(--font-body)", fontSize:"0.9rem", fontWeight:700, cursor:"pointer", textTransform:"capitalize" }}>
                  {g === "boy" ? "Boy" : "Girl"}
                </button>
              ))}
            </div>

            <button onClick={generate} className="display"
              style={{ width:"100%", padding:16, borderRadius:14, border:"none", background:"var(--yellow)", color:"var(--navy)", fontSize:"1.3rem", cursor:"pointer", boxShadow:"0 4px 0 rgba(10,58,87,0.4)", letterSpacing:"0.04em" }}>
              Find my chum&apos;s name
            </button>
          </div>

          {results && results.map((n, i) => (
            <div key={i} style={{ background:"#fff", borderRadius:18, padding:"clamp(16px,3vw,28px)", marginBottom:16, borderTop:"5px solid var(--yellow)", boxShadow:"0 2px 16px rgba(10,58,87,0.08)" }}>
              <div style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--blue-sky)", marginBottom:8, fontFamily:"var(--font-body)" }}>Option {i + 1}</div>
              <div className="display" style={{ fontSize:"clamp(1.2rem,3vw,1.7rem)", color:"var(--navy)", marginBottom:4, lineHeight:1.2 }}>{n.full}</div>
              {n.nickname && (
                <div style={{ fontSize:"0.85rem", color:"var(--blue-deep)", fontStyle:"italic", marginBottom:14, fontFamily:"var(--font-body)", fontWeight:600 }}>
                  Known to friends as: {n.nickname}
                </div>
              )}
              <div style={{ fontSize:"0.85rem", color:"#444", lineHeight:1.65, borderTop:"1px solid #eee", paddingTop:14, fontFamily:"var(--font-body)" }}>{n.reasoning}</div>
            </div>
          ))}

          {results && (
            <button onClick={generate} className="display"
              style={{ width:"100%", padding:15, borderRadius:14, border:"3px solid var(--navy)", background:"transparent", color:"var(--navy)", fontSize:"1.2rem", cursor:"pointer", letterSpacing:"0.04em", marginTop:8 }}>
              Try again
            </button>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
