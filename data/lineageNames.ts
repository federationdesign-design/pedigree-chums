// Maps a history-page breed name (data/uk-breeds.ts) to its lineage key in
// data/lineage.ts. Most names match exactly, so only the few that differ are
// listed here; everything else falls through unchanged.
const UK_TO_LINEAGE: Record<string, string> = {
  "Labrador Retriever": "Labrador",
  "Pembroke Welsh Corgi": "Corgi",
  "West Highland White Terrier": "West Highland Terrier",
  "English Springer Spaniel": "Springer Spaniel",
};

export function resolveLineageName(name: string): string {
  return UK_TO_LINEAGE[name] ?? name;
}
