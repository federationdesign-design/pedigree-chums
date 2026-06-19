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
        note: "The earlier dog it all grew from: the fishermen's water dog of Newfoundland, brought to Britain and bred up from there.",
        img: "/history/waterdog.jpg",
        children: [
          { name: "Fishermen's water dogs", note: "The working water dogs the European fishing crews brought across the Atlantic.", img: "/history/breeds/englsih-Fishermen-water-dog-illustration.jpg", value: 34 },
          { name: "Newfoundland landrace dogs", note: "The local island dogs they crossed with once they landed.", img: "/history/breeds/original-Newfoundland-illustration.jpg", value: 21 }
        ]
      },
      {
        name: "British Pointers",
        note: "Crossed in by British breeders for nose and a steady, focused drive in the field.",
        img: "/history/breeds/pointer-photo.jpg",
        value: 17
      },
      {
        name: "British Setters",
        note: "Added biddability and a love of working close with people on the shoot.",
        img: "/history/breeds/english_setter-photo.jpg",
        value: 15
      },
      {
        name: "British Spaniels",
        note: "A touch of spaniel for a soft mouth and real keenness in water and cover.",
        img: "/history/breeds/english-springer-spaniel-photo.jpg",
        value: 13
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
        img: "/history/breeds/german-pinscher-illustration.jpg",
        children: [
          { name: "Old German ratting terriers", note: "Quick vermin dogs of the German farms.", img: "/history/breeds/old-german-ratting-terriers-illustration.jpg", value: 22 },
          { name: "Schnauzer-type farm dogs", note: "Wiry, all-round working dogs of the same region.", img: "/miniature-schnauzer-square.jpg", value: 16 }
        ]
      },
      {
        name: "Rottweiler",
        note: "Brought bone, substance and a steady guarding drive.",
        img: "/Rottweiler-square.jpg",
        children: [
          { name: "Roman drover dogs", note: "Molosser cattle dogs left behind as the Roman legions moved north.", img: "/history/breeds/Roman-drover-dog.jpg", value: 17 },
          { name: "Local German cattle dogs", note: "The butchers' dogs of the town of Rottweil.", img: "/history/breeds/German-cattle-dog.jpg", value: 10 }
        ]
      },
      {
        name: "Black and Tan Terrier",
        note: "Gave the sleek coat, the tan points and the terrier fire. This is the Manchester Terrier line.",
        img: "/history/breeds/Old_English_Black_and_Tan_Terrier-illustration.jpg",
        children: [
          { name: "Old English Black and Tan Terrier", note: "The classic British ratting terrier.", img: "/history/breeds/Old_English_Black_and_Tan_Terrier-illustration.jpg", value: 14 },
          { name: "Whippet", note: "Slipped into some lines for a touch more refinement and speed.", img: "/Whippet-square.jpg", value: 8 }
        ]
      },
      { name: "Greyhound", note: "A dash of sighthound for speed and a clean, elegant outline. We stop the trail here for now.", img: "/greyhound square.jpg", value: 13 }
    ]
  },

  "Cockapoo": {
    name: "Cockapoo",
    note: "One of the original designer crosses, around since the 1960s. Bred to pair the Cocker's friendly nature with the Poodle's low-shedding coat.",
    children: [
      { name: "Cocker Spaniel", note: "Brings the merry, people-loving temperament and those soft spaniel looks.", img: "/cocker-square.jpg", value: 50 },
      { name: "Poodle", note: "Brings the curly, low-shedding coat and a lot of cleverness.", img: "/poodle-square.jpg", value: 50 }
    ]
  },

  "Cavapoo": {
    name: "Cavapoo",
    note: "A gentle lap-dog cross of the Cavalier and the Poodle, usually the toy or miniature Poodle.",
    children: [
      { name: "Cavalier King Charles Spaniel", note: "Brings the sweet, affectionate, easy-going nature.", img: "/Cavalier King Charles Spaniel-square.jpg", value: 50 },
      { name: "Poodle", note: "Brings the low-shedding coat and a quick, trainable brain.", img: "/poodle-square.jpg", value: 50 }
    ]
  },

  "Labradoodle": {
    name: "Labradoodle",
    note: "Coined in Australia in the 1980s, first bred as a low-shedding guide dog by crossing the Labrador with the Poodle.",
    children: [
      { name: "Labrador", note: "Brings the steady, friendly working temperament.", img: "/lab-square.jpg", value: 50 },
      { name: "Poodle", note: "Brings the low-shedding coat that started the whole idea.", img: "/poodle-square.jpg", value: 50 }
    ]
  },

  "Goldendoodle": {
    name: "Goldendoodle",
    note: "A softer, fluffier take on the doodle, crossing the Golden Retriever with the Poodle.",
    children: [
      { name: "Golden Retriever", note: "Brings the gentle, eager-to-please golden temperament.", img: "/golden-square.jpg", value: 50 },
      { name: "Poodle", note: "Brings the curly, low-shedding coat and the smarts.", img: "/poodle-square.jpg", value: 50 }
    ]
  },

  "Maltipoo": {
    name: "Maltipoo",
    note: "A tiny, fluffy companion cross of the Maltese and a toy or miniature Poodle.",
    children: [
      { name: "Maltese", note: "Brings the small size and the gentle, devoted lap-dog nature.", img: "/matlese-square.jpg", value: 50 },
      { name: "Poodle", note: "Brings the soft, low-shedding coat and cleverness.", img: "/poodle-square.jpg", value: 50 }
    ]
  },

  "Jackapoo": {
    name: "Jackapoo",
    note: "A lively little cross of the Jack Russell and the Poodle, full of energy and character.",
    children: [
      { name: "Jack Russell", note: "Brings the bold, bouncy, terrier spirit.", img: "/jack-russel-square.jpg", value: 50 },
      { name: "Poodle", note: "Brings the low-shedding coat and the trainability.", img: "/poodle-square.jpg", value: 50 }
    ]
  },

  "Cavachon": {
    name: "Cavachon",
    note: "A soft, cuddly companion cross of the Cavalier and the Bichon Frise.",
    children: [
      { name: "Cavalier King Charles Spaniel", note: "Brings the affectionate, easy-going lap-dog nature.", img: "/Cavalier King Charles Spaniel-square.jpg", value: 50 },
      { name: "Bichon Frise", note: "Brings the cheerful personality and the fluffy, low-shedding coat.", img: "/bichon-square.jpg", value: 50 }
    ]
  },

  "Puggle": {
    name: "Puggle",
    note: "A cheeky cross of the Pug and the Beagle, with a longer muzzle than a Pug and a big nose for adventure.",
    children: [
      { name: "Pug", note: "Brings the comical, affectionate, people-loving side.", img: "/pug-square.jpg", value: 50 },
      { name: "Beagle", note: "Brings the curious nose and the waggy, sociable streak.", img: "/beagle-square.jpg", value: 50 }
    ]
  }
};

export function getLineage(name: string): LineageNode | null {
  return LINEAGE[name] ?? null;
}
