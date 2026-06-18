// Breed lineage data for the "where it comes from" family tree.
//
// These proportions are illustrative best-guess estimates drawn from documented
// breed history and broad community agreement. They are NOT DNA results. Each
// node's `value` is its rough share of its parent's makeup; the leaf values
// under a parent should add up to that parent's own share. `img` is optional
// artwork for a circle (a path under /public); leave it off to show a plain
// coloured circle until a picture exists. The root circle uses the breed's own
// card photo automatically, so it only needs a name and note.

export interface LineageNode {
  name: string;
  note: string;
  value?: number;
  img?: string;
  children?: LineageNode[];
}

const LINEAGE: Record<string, LineageNode> = {
  "Labrador": {
    name: "Labrador",
    note: "Britain's most popular dog, but it started life on the docks of Newfoundland, not in Labrador at all.",
    children: [
      {
        name: "St John's Water Dog",
        note: "The fishermen's dog of Newfoundland, and the heart of the Labrador. It hauled nets and fetched fish from the cold Atlantic.",
        children: [
          { name: "Fishermen's water dogs", note: "Working water dogs the European fishing crews brought across the Atlantic.", value: 47 },
          { name: "Newfoundland landrace dogs", note: "The local island dogs they crossed with on arrival.", value: 25 }
        ]
      },
      {
        name: "British gundog refining",
        note: "Once the dogs reached England in the 1800s, breeders polished them into the retriever we know.",
        children: [
          { name: "Wavy and flat-coated retrievers", note: "Early British retrievers used to fix the type.", value: 16 },
          { name: "Setter and pointer crosses", note: "A little gundog blood for nose and biddability.", value: 12 }
        ]
      }
    ]
  },

  "Doberman Pinscher": {
    name: "Doberman Pinscher",
    note: "A young breed with a known recipe. Created in Germany around 1890 by Louis Dobermann, who wanted a sleek, fearless dog to guard him on his tax rounds.",
    children: [
      {
        name: "German Pinscher",
        note: "The base type, and where the name comes from: a sharp German farm and ratting dog.",
        children: [
          { name: "Old German ratting terriers", note: "Quick vermin dogs of the German farms.", value: 22 },
          { name: "Schnauzer-type farm dogs", note: "Wiry, all-round working dogs of the same region.", value: 16 }
        ]
      },
      {
        name: "Rottweiler",
        note: "Brought bone, substance and a steady guarding drive.",
        img: "/Rottweiler-square.jpg",
        children: [
          { name: "Roman drover dogs", note: "Molosser cattle dogs left behind as the Roman legions moved north.", value: 17 },
          { name: "Local German cattle dogs", note: "The butchers' dogs of the town of Rottweil.", value: 10 }
        ]
      },
      {
        name: "Black and Tan Terrier",
        note: "Gave the sleek coat, the tan points and the terrier fire. This is the Manchester Terrier line.",
        img: "/history/breeds/Old_English_Black_and_Tan_Terrier-illustration.jpg",
        children: [
          { name: "Old English Black and Tan Terrier", note: "The classic British ratting terrier.", value: 14 },
          { name: "Whippet", note: "Slipped into some lines for a touch more refinement and speed.", value: 8 }
        ]
      },
      { name: "Greyhound", note: "A dash of sighthound for speed and a clean, elegant outline. We stop the trail here for now.", img: "/history/breeds/greyhound-photo.jpg", value: 13 }
    ]
  }
};

export function getLineage(name: string): LineageNode | null {
  return LINEAGE[name] ?? null;
}
