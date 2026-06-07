// All 54 breed-card images live in /public as card.jpg, card2.jpg ... card54.jpg.
// They are referenced here so any section can pull from one list. The filenames
// are not breed-mapped yet, so the "featured" picks below are placeholders you
// can reorder to surface specific breeds (Labrador, Cocker Spaniel, Corgi, etc.).
export const cards: string[] = [
  "/card.jpg",
  ...Array.from({ length: 53 }, (_, i) => `/card${i + 2}.jpg`),
];

// The single card that floats in the hero (swap to your Labrador card).
export const heroCard = cards[0];
