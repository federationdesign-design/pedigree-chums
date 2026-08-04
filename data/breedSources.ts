/* Per-dog outbound sources, shown on the back of a card.
   Owner instruction (4 August): every extinct dog names its OWN sources.
   Until now one shared list of three (Strabo, Of Englishe Dogges, the list of
   extinct breeds) sat on every playable ancient and medieval card. Those three
   are Celtic Hound's own sources and stay with it alone.

   This map IS the gate: a dog with no entry shows no links, so nothing has to
   be filtered by era any more and a Tudor dog can carry sources without the
   whole c1500 run carrying them too.

   Every URL below was checked for a 200 before it was written here. The tone
   only picks the disc colour, in list order.

   These are sources for the dog, not the deeper stock inside its tree, and the
   choice of which page best represents each dog is the agent's; the owner has
   not signed them off yet. */

export type BreedSource = { href: string; tone: "blue" | "green" | "black" };

export const BREED_SOURCES: Record<string, BreedSource[]> = {
  // The original three, kept exactly as they were.
  "Celtic Hound": [
    { href: "https://penelope.uchicago.edu/Thayer/e/roman/texts/strabo/4e%2A.html", tone: "blue" },
    { href: "https://www.gutenberg.org/cache/epub/78013/pg78013-images.html", tone: "green" },
    { href: "https://en.wikipedia.org/wiki/List_of_extinct_dog_breeds", tone: "black" },
  ],

  // Ancient.
  "Ancient Mastiff": [
    { href: "https://en.wikipedia.org/wiki/Dogs_of_Roman_Britain", tone: "blue" },
    { href: "https://en.wikipedia.org/wiki/Molossus_(dog)", tone: "green" },
  ],
  "Celtic Coursing Hound": [
    // The Greyhound article carries the vertragus, Arrian's Celtic coursing dog.
    { href: "https://en.wikipedia.org/wiki/Greyhound", tone: "blue" },
    { href: "https://penelope.uchicago.edu/encyclopaedia_romana/miscellanea/canes/canes.html", tone: "green" },
  ],
  "Celtic Scent Hound": [
    // Covers Arrian on the Segusiae, the Gaulish trailing hounds.
    { href: "https://en.wikipedia.org/wiki/Scent_hound", tone: "blue" },
  ],
  "Livestock Dog": [
    // Varro, De Re Rustica book 2, on the shepherd's dog.
    { href: "https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Varro/de_Re_Rustica/2*.html", tone: "blue" },
    { href: "https://en.wikipedia.org/wiki/Sheep_dog", tone: "green" },
  ],
  "Celtic Heeler": [
    { href: "https://en.wikipedia.org/wiki/Cardigan_Welsh_Corgi", tone: "blue" },
  ],

  // Medieval.
  "Shepherd's Dog": [
    { href: "https://en.wikipedia.org/wiki/Welsh_Sheepdog", tone: "blue" },
  ],
  "Drover's Dog": [
    { href: "https://en.wikipedia.org/wiki/Drovers%27_road", tone: "blue" },
  ],
  "Earth Dog": [
    { href: "https://en.wikipedia.org/wiki/Terrier", tone: "blue" },
  ],
  Talbot: [
    { href: "https://en.wikipedia.org/wiki/Talbot_(dog_breed)", tone: "blue" },
  ],
  Rache: [
    { href: "https://en.wikipedia.org/wiki/Rache", tone: "blue" },
    { href: "https://en.wikipedia.org/wiki/Limer", tone: "green" },
  ],
  "Southern Hound": [
    { href: "https://en.wikipedia.org/wiki/Southern_Hound", tone: "blue" },
  ],
  Buckhound: [
    { href: "https://en.wikipedia.org/wiki/Buckhound", tone: "blue" },
  ],

  // Tudor and later.
  "Turnspit Dog": [
    { href: "https://en.wikipedia.org/wiki/Turnspit_dog", tone: "blue" },
  ],
  Staghound: [
    { href: "https://en.wikipedia.org/wiki/Staghound", tone: "blue" },
  ],
  "Old English Bulldog": [
    { href: "https://en.wikipedia.org/wiki/Old_English_Bulldog", tone: "blue" },
    { href: "https://en.wikipedia.org/wiki/Bull-baiting", tone: "green" },
  ],
};

export function sourcesFor(name: string): BreedSource[] {
  return BREED_SOURCES[name] ?? [];
}
