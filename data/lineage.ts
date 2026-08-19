// Breed lineage data for the "where it comes from" family tree.
//
// These proportions are illustrative best-guess estimates drawn from documented
// breed history and broad community agreement. They are NOT DNA results. Each
// node's `value` is its rough share of its parent's makeup; the leaf values
// under a parent should add up to that parent's own share. `img` is optional
// artwork for a circle (a path under /public); leave it off to show a plain
// coloured circle until a picture exists. The root circle uses the breed's own
// card photo automatically, so it only needs a name and note.

// History-card names (data/uk-breeds.ts) map to lineage keys through
// resolveLineageName. getLineage now runs it too, so a direct getLineage(card)
// resolves the same way lineageArchive already does, instead of only via
// LINEAGE_ALIASES (which stays the source of truth for child-node aliases).
import { resolveLineageName } from "./lineageNames";

export interface LineageNode {
  name: string;
  note: string;
  value?: number;
  img?: string;
  children?: LineageNode[];
}

const LINEAGE: Record<string, LineageNode> = {
  "Deal the cards": {
    name: "Deal the cards",
    note: "Find your pack, gather players, shuffle and deal 3 to 6 cards each.",
    children: [
      {
        name: "Find pack",
        note: "Dig out your Pedigree Chums™ deck.",
        img: "/find-pack-icon.svg",
        value: 1,
        children: [
          {
            name: "Gather players",
            note: "No limit on players. You can even go solo.",
            img: "/friends-icon.svg",
            value: 2,
            children: [
              {
                name: "Shuffle well",
                note: "Give the deck a good shuffle.",
                img: "/shuffle-icon.svg",
                value: 3,
                children: [
                  {
                    name: "Deal cards",
                    note: "Hand out 3 to 6 cards each. Show your hand to the other players, then hide it.",
                    img: "/deal-icon.svg",
                    value: 4,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  "Head outside": {
    name: "Head outside",
    note: "Go for a walk and explore your town or city.",
    children: [
      {
        name: "Head outside",
        note: "Explore your town or city.",
        img: "/go-outside-icon.svg",
        value: 1,
        children: [
          {
            name: "Cards near",
            note: "Keep somewhere easy to pull out.",
            img: "/cards-close-icon.svg",
            value: 2,
            children: [
              {
                name: "Eyes peeled",
                note: "Chums could be in places you wouldn't expect.",
                img: "/look-icon.svg",
                value: 3,
              },
            ],
          },
        ],
      },
    ],
  },
  "Spot real dogs": {
    name: "Spot real dogs",
    note: "Study the dog and check your card.",
    children: [
      {
        name: "Look carefully",
        note: "Study the dog's coat, size and markings.",
        img: "/dogfind-icon.svg",
        value: 1,
        children: [
          {
            name: "Check card",
            note: "Does it match?",
            img: "/check.svg",
            value: 2,
          },
        ],
      },
    ],
  },
  "Match to your chum": {
    name: "Match to your chum",
    note: "Call it out, claim your matched card and help your team.",
    children: [
      {
        name: "Call out",
        note: "Say the breed name. Other players can challenge if they disagree.",
        img: "/shout-icon.svg",
        value: 1,
        children: [
          {
            name: "Claim chum",
            note: "Separate the found chum card.",
            img: "/trun-card-icon.svg",
            value: 2,
          },
        ],
      },
    ],
  },
  "Find more chums": {
    name: "Find more chums",
    note: "The more ground you cover, the more chums you find.",
    children: [
      {
        name: "Explore more",
        note: "The more ground you cover,",
        img: "/explore-more-icon.svg",
        value: 1,
        children: [
          {
            name: "Find more",
            note: "the more chums you find.",
            img: "/more-dogs.svg",
            value: 2,
          },
        ],
      },
    ],
  },
  "Most chums wins": {
    name: "Most chums wins",
    note: "When the walk ends, count up and the most chums wins.",
    children: [
      {
        name: "Finished exploring",
        note: "When the walk ends or your day out is done.",
        img: "/finish-icon.svg",
        value: 1,
        children: [
          {
            name: "Count up",
            note: "Tot up who has the most chums.",
            img: "/count-icon.svg",
            value: 2,
            children: [
              {
                name: "Most wins",
                note: "The player with the most matched chums wins.",
                img: "/winner-icon.svg",
                value: 3,
              },
            ],
          },
        ],
      },
    ],
  },
  "Labrador": {
    name: "Labrador",
    note: "Britain's most popular dog, but it started life on the docks of Newfoundland, not in Labrador at all.",
    children: [
      {
        name: "St John's Water Dog",
        note: "The earlier dog it all grew from: the fishermen's water dog of Newfoundland, brought to Britain and bred up from there. Now extinct.",
        img: "/history/breeds/St-Johns-Water-Dog.jpg",
        children: [
          { name: "Fishermen's water dogs", note: "The working water dogs the European fishing crews brought across the Atlantic.", img: "/history/breeds/Fishermens-water-dogs.jpg", value: 34 },
          { name: "Newfoundland landrace dogs", note: "The local island dogs they crossed with once they landed. Now extinct.", img: "/history/breeds/Newfoundland-landrace-dog.jpg", value: 21 }
        ]
      },
      {
        name: "British Pointers",
        note: "Crossed in by British breeders for nose and a steady, focused drive in the field. Now in-decline.",
        img: "/history/breeds/british-pointers.jpg",
        value: 17
      },
      {
        name: "British Setters",
        note: "Added biddability and a love of working close with people on the shoot. Now in-decline.",
        img: "/history/breeds/british-setters.jpg",
        value: 15
      },
      {
        name: "Water spaniels",
        note: "A touch of spaniel for a soft mouth and real keenness in water and cover. Now extinct.",
        img: "/history/breeds/Water-spaniels.jpg",
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
        img: "/history/breeds/working-German-Pinscher.jpg",
        children: [
          { name: "Old German ratting terriers", note: "Quick vermin dogs of the German farms. Now extinct.", img: "/history/breeds/Affenpinscher-type-small-rough-ratters.jpg", value: 22 },
          { name: "Schnauzer-type farm dogs", note: "Wiry, all-round working dogs of the same region. Now extinct.", img: "/history/breeds/Schnauzer-type-farm-dogs.jpg", value: 16 }
        ]
      },
      {
        name: "Rottweiler",
        note: "Brought bone, substance and a steady guarding drive.",
        img: "/Rottweiler-square.jpg",
        children: [
          { name: "Roman drover dogs", note: "Molosser cattle dogs left behind as the Roman legions moved north. Now extinct.", img: "/history/breeds/Roman-drover-dog.jpg", value: 17 },
          { name: "Local German cattle dogs", note: "The butchers' dogs of the town of Rottweil. Now extinct.",  img: "/history/breeds/Local-German-cattle-dogs.jpg", value: 10 }
        ]
      },
      {
        name: "Manchester Terrier",
        note: "Gave the sleek coat, the tan points and the terrier fire. Developed from the Old English Black and Tan Terrier.",
        img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg",
        children: [
          { name: "Old English Black and Tan Terrier", note: "The classic British ratting terrier, foundation of the Manchester Terrier line.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 14 },
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
      { name: "Jack Russell Terrier", note: "Brings the bold, bouncy, terrier spirit.", img: "/history/breeds/jack_russell_terrier_photo.jpg", value: 50 },
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
      { name: "Beagle", note: "Brings the curious nose and the waggy, sociable streak.", img: "/history/breeds/beagle.jpg", value: 50 }
    ]
  },

  "Bull Terrier": {
    name: "Bull Terrier",
    note: "A Victorian invention. James Hinks set out in the 1860s to build a cleaner, all-white gentleman's companion from the old bull-and-terrier dogs.",
    children: [
      { name: "Bulldog", note: "Brought the power, the broad chest and the determined grip.", img: "/history/breeds/bulldog-photo.jpg", value: 45 },
      { name: "White English Terrier", note: "A now-extinct breed that gave the clean white coat and terrier sharpness.", img: "/history/breeds/english-white-terrier-painting.jpg", value: 40 },
      { name: "Dalmatian", note: "Crossed in for size, substance and a pure white finish.", img: "/Dalmatian-square.jpg", value: 15 }
    ]
  },

  "Boston Terrier": {
    name: "Boston Terrier",
    note: "An American original from 1870s Boston, traced back to a single dog, Hooper's Judge, a bulldog and terrier cross bred smaller and smarter.",
    children: [
      { name: "Bulldog", note: "Brought the stocky frame and the easy-going, affectionate streak.", img: "/history/breeds/bulldog-photo.jpg", value: 55 },
      { name: "White English Terrier", note: "The now-extinct terrier behind the neat build and lively mind.", img: "/history/breeds/english-white-terrier-painting.jpg", value: 45 }
    ]
  },

  "West Highland Terrier": {
    name: "West Highland Terrier",
    note: "Bred from the white pups of the Highland working terriers, kept apart on purpose so they would show up against the heather and rock.",
    children: [
      { name: "Cairn Terrier", note: "The closest cousin, and the main source of the Westie's plucky working type.", img: "/history/breeds/cairns-terrier.jpg", value: 64 },
      { name: "Scottish Terrier", note: "Another of the old Highland terriers sharing the same rugged roots.", img: "/history/breeds/Scottish-Terrier.jpg", value: 22 },
      { name: "Skye Terrier", note: "Part of the same west-coast terrier family that shaped the breed.", img: "/history/breeds/skye-terrier-photo.webp", value: 14 }
    ]
  },

  "Staffordshire Bull Terrier": {
    name: "Staffordshire Bull Terrier",
    note: "A classic bull-and-terrier, bred in the Black Country by crossing the old bulldog with game local terriers for grip and gameness.",
    children: [
      { name: "Bulldog", note: "The old, athletic bull-baiting type, not the modern show dog, for strength and courage.", img: "/history/breeds/Old-English-Bulldog.jpg", value: 55 },
      { name: "Old English Black and Tan Terrier", note: "Added speed, agility and terrier fire to the heavier bulldog base.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 45 }
    ]
  },

  "Yorkshire Terrier": {
    name: "Yorkshire Terrier",
    note: "A working dog before a lap dog. Scottish weavers brought their terriers to the Yorkshire mills in the 1800s and crossed them with local ratters.",
    children: [
      { name: "Paisley Terrier", note: "A long-coated Scottish terrier that gave the silky, flowing coat.", img: "/history/breeds/Paisley-Terrier=photo.jpg", value: 45 },
      { name: "Skye Terrier", note: "Another Scottish terrier behind the long, fine hair.", img: "/history/breeds/skye-terrier-photo.webp", value: 30 },
      { name: "Old English Black and Tan Terrier", note: "Local ratting terriers that brought the size down and the colour in.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 25 }
    ]
  },

  "Border Terrier": {
    name: "Border Terrier",
    note: "A true working terrier from the hills along the English and Scottish border, bred to keep up with the hunt and go to ground after foxes.",
    children: [
      { name: "Bedlington Terrier", note: "Shares the same old Border terrier stock and a common working ancestor.", img: "/history/breeds/Bedlington Terrier-photo.jpg", value: 34 },
      { name: "Dandie Dinmont Terrier", note: "Another Border breed from the same root, raised in the same hills.", img: "/history/breeds/dandie-dinmont-terrier.jpg", value: 33 },
      { name: "Old fell terriers", note: "The hardy fox-working terriers of the fells that shaped the type. Now extinct.", img: "/history/breeds/Old-fell-terriers-Patterdale-Terrier-Working-hunt-terriers.jpg", value: 33 }
    ]
  },

  "Boxer": {
    name: "Boxer",
    note: "Developed in Munich in the 1890s. The FCI names the small Brabant Bullenbeisser as the Boxer's immediate ancestor, with later influence from the English Bulldog to further shorten the muzzle. The result: square-headed, athletic and devoted.",
    img: "/boxer-square.jpg",
    children: [
      {
        name: "Brabant Bullenbeisser",
        note: "The Brabant Bullenbeisser was the smaller, athletic German catch dog whose broad bite, square build and slightly upturned muzzle formed the immediate foundation of the modern Boxer. The FCI explicitly identifies it as the Boxer's direct ancestor. Now extinct.",
        img: "/brabant-bullenbeisser.jpg",
        children: [
          {
            name: "Great Bullenbeisser (Danziger Bullenbeisser)",
            note: "The larger, heavier northern German bull-baiting dog from which the smaller Brabant variant descended. Standing around 60-65cm and 40-50kg, it was used to seize and hold boar, bear and bull by the muzzle. The Brabant line emerged as a smaller, more agile regional type. Now extinct.",
            img: "/history/breeds/great-bullenbeisser.jpg",
            children: [
              {
                name: "Medieval Alaunts and catch dogs",
                note: "European catch dogs descended from dogs brought west by the Alans and other steppe peoples in the early medieval period. Bred across the continent for size, grip and courage in the hunt and in war. Now extinct.",
                img: "/history/breeds/Mastiff-and-Alaunt-war-dogs.jpg",
                value: 55,
              },
              {
                name: "Early Germanic boar hunting dogs",
                note: "Large, rough hunting dogs native to northern Europe, documented in Roman accounts of Germanic tribes. Bred to seize and hold boar and bear rather than chase -- the instinct that defined the Bullenbeisser type. When crossed with the incoming Alaunt lines they produced the distinctly German bull-baiting dog. Now extinct.",
                img: "/history/breeds/Old-German-boarhounds.jpg",
                value: 45,
              },
            ],
          },
          {
            name: "Old English Bulldog",
            note: "The stocky bull-baiting dog of England, crossed into the Brabant line via documented cross-channel exchange of bull-baiting dogs in the 16th and 17th centuries. Contributed the shortened muzzle and broader head. Now extinct.",
            img: "/history/breeds/Old-English-Bulldog.jpg",
            value: 40,
          },
          {
            name: "German Bullenbeisser types",
            note: "A group of regional German catch and hunting dogs bred to seize and hold large prey — boar, bear, bull — by the muzzle. The larger types worked as boarhounds; the smaller Brabant line became the Boxer. Distinct from the taller, rangier German boarhound. Now extinct.",
            img: "/history/breeds/Old-German-boarhounds.jpg",
            children: [
              {
                name: "Medieval Alaunts and catch dogs",
                note: "European catch dogs descended from dogs brought west by the Alans and other steppe peoples in the early medieval period. Bred across the continent for size, grip and courage in the hunt and in war. Now extinct.",
                img: "/history/breeds/Mastiff-and-Alaunt-war-dogs.jpg",
                value: 60,
              },
              {
                name: "Old German farm guards",
                note: "Heavy-boned German estate and farm dogs that contributed size and territorial drive to the Bullenbeisser lines. Now extinct.",
                img: "/history/breeds/Old-German-farm-guards.jpg",
                value: 35,
              },
            ],
          },
        ],
      },
      {
        name: "Old English Bulldog",
        note: "The athletic bull-baiting Bulldog of the early 19th century — leaner and more active than today's breed. Crossed into the early Boxer to further shorten the muzzle and soften temperament. Now extinct.",
        img: "/history/breeds/Old-English-Bulldog.jpg",
        children: [
          {
            name: "English Mastiff",
            note: "The ancient Molosser line of Britain. Gave the Bulldog its bone, bulk and broad head.",
            img: "/history/breeds/english-mastiff-photo.jpg",
            value: 60,
          },
          {
            name: "Ancient Molossers",
            note: "The common deep ancestor of all Mastiff-type dogs across Europe. Now extinct.",
            img: "/history/breeds/Ancient-Molossers.jpg",
            value: 40,
          },
        ],
      },
    ],
  },

  "Bulldog": {
    name: "Bulldog",
    note: "Once a fierce bull-baiting dog, then bred into the gentle, wrinkly companion we know after blood sports were banned in 1835.",
    children: [
      { name: "Old English Bulldog", note: "The athletic bull-baiting dog at the root of it all, leaner and fiercer than today's Bulldog. Now extinct.", img: "/history/breeds/Old-English-Bulldog.jpg", value: 60 },
      { name: "Mastiff", note: "The old Molosser guard-and-war dogs that gave the breed its bulk and broad head.", img: "/history/breeds/medieval-british-mastiff.jpg", value: 25 },
      { name: "Pug", note: "Crossed in during the 1800s to shorten the face and soften the temperament.", img: "/pug-square.jpg", value: 15 }
    ]
  },

  "Whippet": {
    name: "Whippet",
    note: "The poor man's racehorse. Northern miners bred a pocket-sized sighthound for weekend racing and rabbit coursing.",
    children: [
      { name: "Greyhound", note: "The core of the breed, scaled down for speed in a smaller, cheaper-to-keep package.", img: "/greyhound-square.jpg", value: 62 },
      { name: "Old English Black and Tan Terrier", note: "Added grit and gameness for the rabbit-coursing the early dogs were bred for.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 23 },
      { name: "Italian Greyhound", note: "A later refinement for the elegant, fine-boned outline.", img: "/italian-greyhound-square.jpg", value: 15 }
    ]
  },

  "Corgi": {
    name: "Corgi",
    note: "A big dog in a small body. The Pembroke is a true cattle herder, nipping at heels and ducking the kicks.",
    children: [
      { name: "Spitz-type dogs", note: "Foxy-faced Nordic dogs like the Pomeranian and Swedish Vallhund, brought in by Flemish weavers and Viking settlers.", img: "/history/breeds/Northern-Spitz-landraces.jpg",  value: 40 },
      { name: "Cardigan Welsh Corgi", note: "Its close cousin and the older of the two Welsh corgis. The pair share deep Welsh roots and were briefly crossed in the 1930s.", img: "/history/breeds/Welsh_Corgi_Cardigan-photo.jpg", value: 35 },
      { name: "Welsh herding dogs", note: "The old Welsh herding and droving dogs, a long-legged, loose-eyed landrace and the parallel Welsh branch behind the region's sheep-working breeds. Now extinct.", img: "/history/breeds/Welsh-herding-dogs-cluster.jpg", value: 25 }
    ]
  },

  "Golden Retriever": {
    name: "Golden Retriever",
    note: "A Scottish creation. Lord Tweedmouth kept careful records as he built the perfect gundog on his Highland estate from the 1860s.",
    children: [
      { name: "Wavy-Coated Retriever", note: "The yellow retriever at the heart of Tweedmouth's project.", img: "/history/breeds/flatcoated_retriever-photo.jpg", value: 45 },
      { name: "Tweed Water Spaniel", note: "A now-extinct local water dog that gave the gentle nature and love of water.", img: "/history/breeds/tweed-water-spaniel.jpg", value: 30 },
      { name: "Irish Setter", note: "A dash of setter for the rich golden colour.", img: "/history/breeds/irish-setter-photo.jpg", value: 15 },
      { name: "Bloodhound", note: "A little hound blood for tracking power and a good nose.", img: "/history/breeds/modern-bloodhound.jpg", value: 10 }
    ]
  },

  // Family 3, collies and herders (Tudor trail, 10 August). The collie herding
  // line converges on Shepherd's Dog, the medieval card, one or two hops below
  // each named strain, never all flattened onto it directly. Spitz-type dogs is
  // deliberately left a bare leaf: it is the Corgi's Nordic root, correctly kept
  // OFF the Shepherd's Dog herding line, with no honest Tudor terminal (its
  // deeper data is Family 8's Arctic sled dogs). Single-parent value 100 matches
  // the shipped Soft-Coated Wheaten Terrier.
  "Old working collies": {
    name: "Old working collies",
    note: "The old northern hill-collie landrace of Scotland and the borders, the shared working stock the Rough, Smooth and Border collies all grew from. Now extinct.",
    // 19 August 2026: pass-through fixed with the Celtic Heeler fallback.
    // Researched, no documented second parent found: the collie family is a
    // single native British landrace, not a cross of two stocks, so there is
    // nothing real to add. Two folklore candidates were rejected as discredited
    // (both already removed from this project): the Viking herding spitz (given
    // as a Scotch Collie ancestor) and the Polish Lowland Sheepdog (the Bearded
    // Collie 1514 story). Do not redo this search and reach for either. The node
    // carries no value of its own; the repeat below (its own note and img, value
    // 50) makes the node's ring render instead of the single child filling it.
    children: [
      { name: "Shepherd's Dog", note: "The medieval British herding dog, the Sheepdog or Colley that Caius wrote of in 1576. Chaucer's black-faced 'Coll' or 'Coaly' of the 1300s gives the name: Coaly became Colley became Collie. Now extinct.", img: "/history/breeds/medieval-shepherds-dog.jpg", value: 50 },
      { name: "Old working collies", note: "The old northern hill-collie landrace of Scotland and the borders, the shared working stock the Rough, Smooth and Border collies all grew from. Now extinct.", img: "/history/breeds/Old-working-collies-cluster.jpg", value: 50 }
    ]
  },
  "Old Scotch Collie": {
    name: "Old Scotch Collie",
    note: "The old Scottish shepherd's collie, the pre-show hill-herding landrace that fed the working border strain long before it had a name. Now extinct.",
    // 19 August 2026: pass-through fixed with the Celtic Heeler fallback.
    // Researched, no documented second parent found: the collie family is a
    // single native British landrace, not a cross of two stocks, so there is
    // nothing real to add. Two folklore candidates were rejected as discredited
    // (both already removed from this project): the Viking herding spitz (given
    // as a Scotch Collie ancestor) and the Polish Lowland Sheepdog (the Bearded
    // Collie 1514 story). Do not redo this search and reach for either. The node
    // carries no value of its own; the repeat below (its own note and img, value
    // 50) makes the node's ring render instead of the single child filling it.
    children: [
      { name: "Old working collies", note: "The shared old hill-collie landrace it grew from. Now extinct.", img: "/history/breeds/Old-working-collies-cluster.jpg", value: 50 },
      { name: "Old Scotch Collie", note: "The old Scottish shepherd's collie, the pre-show hill-herding landrace that fed the working border strain long before it had a name. Now extinct.", img: "/history/breeds/Old-Scotch-Collie.jpg", value: 50 }
    ]
  },
  "Old hill and bearded collies": {
    name: "Old hill and bearded collies",
    note: "Shaggy upland herding dogs of the same collie family. Now extinct.",
    // 19 August 2026: pass-through fixed with the Celtic Heeler fallback.
    // Researched, no documented second parent found: the collie family is a
    // single native British landrace, not a cross of two stocks, so there is
    // nothing real to add. Two folklore candidates were rejected as discredited
    // (both already removed from this project): the Viking herding spitz (given
    // as a Scotch Collie ancestor) and the Polish Lowland Sheepdog (the Bearded
    // Collie 1514 story). Do not redo this search and reach for either. The node
    // carries no value of its own; the repeat below (its own note and img, value
    // 50) makes the node's ring render instead of the single child filling it.
    children: [
      { name: "Old working collies", note: "The shared old hill-collie landrace of the same family. Now extinct.", img: "/history/breeds/Old-working-collies-cluster.jpg", value: 50 },
      { name: "Old hill and bearded collies", note: "Shaggy upland herding dogs of the same collie family. Now extinct.", img: "/history/breeds/old-hill-and-bearded-collies.jpg", value: 50 }
    ]
  },
  "Old Cumberland herding dogs": {
    name: "Old Cumberland herding dogs",
    note: "Northern English herding dogs from the same border country. Now extinct.",
    // 19 August 2026: pass-through fixed with the Celtic Heeler fallback.
    // Researched, no documented second parent found: the collie family is a
    // single native British landrace, not a cross of two stocks, so there is
    // nothing real to add. Two folklore candidates were rejected as discredited
    // (both already removed from this project): the Viking herding spitz (given
    // as a Scotch Collie ancestor) and the Polish Lowland Sheepdog (the Bearded
    // Collie 1514 story). Do not redo this search and reach for either. The node
    // carries no value of its own; the repeat below (its own note and img, value
    // 50) makes the node's ring render instead of the single child filling it.
    children: [
      { name: "Old working collies", note: "The shared old hill-collie landrace of the border country. Now extinct.", img: "/history/breeds/Old-working-collies-cluster.jpg", value: 50 },
      { name: "Old Cumberland herding dogs", note: "Northern English herding dogs from the same border country. Now extinct.", img: "/history/breeds/cumberland-sheepdog-photo.jpg", value: 50 }
    ]
  },
  "Welsh herding dogs": {
    name: "Welsh herding dogs",
    note: "The old Welsh herding and droving dogs, a long-legged, loose-eyed landrace and the parallel Welsh branch behind the region's sheep-working breeds. Now extinct.",
    // 19 August 2026: added Celtic Heeler as a child here. It used to sit the
    // other way round, with Welsh herding dogs a child of Celtic Heeler, but that
    // edge ran backwards in time (Celtic Heeler is the ancient low-slung stock,
    // Welsh herding dogs the later landrace): the same class of error as the
    // Early badger hunting dogs / Earth Dog edge in the BARE LEAF note just below
    // this root. Reversing it here also fixes the pass-through that Shepherd's
    // Dog alone (100%) left behind. Shepherd's Dog 60, Celtic Heeler 40, sum 100.
    children: [
      { name: "Shepherd's Dog", note: "The medieval British herding dog behind the herding breeds, the Colley of Caius. The parallel Welsh branch reaches the same medieval root. Now extinct.", img: "/history/breeds/medieval-shepherds-dog.jpg", value: 60 },
      { name: "Celtic Heeler", note: "The ancestral low-slung herding dogs brought to Wales by Celtic tribes -- forerunners of both the Cardigan and Pembroke Welsh Corgi. Short legs bred for nipping cattle heels and ducking kicks.", img: "/history/breeds/medieval-corgi.jpg", value: 40 }
    ]
  },
  // Early badger hunting dogs is intentionally left a BARE LEAF. It once had a
  // key here (Family 3) pointing to Earth Dog, but that edge ran backwards in
  // time (Earth Dog is medieval, the badger dogs are pre-Roman) and closed a
  // cycle with Earth Dog's own child of the same name. Cardigan Welsh Corgi
  // reaches Tudor through Welsh herding dogs instead, so no child is needed.
  "Border Collie": {
    name: "Border Collie",
    note: "Widely called the cleverest dog of all, bred purely for the work of gathering and moving sheep on the hills.",
    children: [
      { name: "Old Scotch Collie", note: "The old Scottish shepherd's collie, the pre-show hill-herding landrace that fed the working border strain long before it had a name. Now extinct.", img: "/history/breeds/Old-Scotch-Collie.jpg", value: 50 },
      { name: "Welsh herding dogs", note: "The old Welsh herding and droving dogs, a long-legged, loose-eyed landrace and the parallel Welsh branch behind the region's sheep-working breeds. Now extinct.", img: "/history/breeds/Welsh-herding-dogs-cluster.jpg", value: 25 },
      { name: "Old Cumberland herding dogs", note: "Northern English herding dogs from the same border country. Now extinct.", img: "/history/breeds/cumberland-sheepdog-photo.jpg", value: 25 }
    ]
  },

  "Irish Setter": {
    name: "Irish Setter",
    note: "The flashy red gundog of Ireland, bred to range wide and find game birds across open country.",
    children: [
      { name: "English Setter", note: "The base setter type behind the breed's style and stance.", img: "/history/breeds/british-setters.jpg", value: 35 },
      { name: "Irish Water Spaniel", note: "Native Irish spaniel blood for coat and a love of water.", img: "/history/breeds/irish-water-spaniel.jpg", value: 25 },
      { name: "Gordon Setter", note: "Another setter in the mix, adding substance and steadiness.", img: "/history/breeds/gordon-setter-photo.jpg", value: 20 },
      { name: "Pointer", note: "A touch of pointer for nose and a wide-ranging hunt.", img: "/history/breeds/british-pointers.jpg", value: 20 }
    ]
  },

  "Jack Russell Terrier": {
    name: "Jack Russell Terrier",
    note: "Bred by a hunting parson, the Reverend John Russell, in the early 1800s for a game little terrier that could bolt a fox and keep up with the hounds.",
    children: [
      { name: "Fox Terrier", note: "The old white-bodied fox-working terriers that are the breed's direct foundation.", img: "/history/breeds/fox_terrier-img.jpg", value: 55 },
      { name: "Old English White Terrier", note: "The old white-bodied working terriers of Britain, the stock the named white terriers were drawn from. Now extinct.", img: "/history/breeds/english-white-terrier-painting.jpg", value: 30 },
      { name: "Working hunt terriers", note: "Hardy local terriers kept for going to ground after fox. Now extinct.", img: "/history/breeds/Old-fell-terriers-Patterdale-Terrier-Working-hunt-terriers.jpg", value: 15 }
    ]
  },

  // 18 August 2026: until 1893 all these dogs were bred together as Land Spaniels and classified afterwards by size and colour, per the Kennel Club, so both breeds now take the shared root at the same weight. One litter could produce springer, Sussex and cocker, which is why littermates (Field Spaniel, Sussex Spaniel) have been removed as parents.
  "Cocker Spaniel": {
    name: "Cocker Spaniel",
    note: "The smallest of the old land spaniels, bred to flush, or 'cock', woodcock from cover. For years Cockers and Springers were born in the very same litters, sorted only by working size.",
    children: [
      { name: "Land spaniels", note: "The old English land-spaniel stock that every working spaniel springs from. Now extinct.", img: "/history/breeds/original-land-spaniel.jpg", value: 70 },
      { name: "Welsh Springer Spaniel", note: "A Welsh outcross used to establish the parti-coloured lines.", img: "/history/breeds/welsh-springer-spaniel-photo.jpg", value: 30 }
    ]
  },

  // 18 August 2026: until 1893 all these dogs were bred together as Land Spaniels and classified afterwards by size and colour, per the Kennel Club, so both breeds now take the shared root at the same weight. One litter could produce springer, Sussex and cocker, which is why littermates have been removed as parents.
  "Springer Spaniel": {
    name: "Springer Spaniel",
    note: "The larger land spaniels, bred to 'spring' game from cover for the net, hawk and later the gun. The Cocker's bigger litter-mate, set apart only by size.",
    children: [
      { name: "Land spaniels", note: "The old English land-spaniel stock that every working spaniel springs from. Now extinct.", img: "/history/breeds/original-land-spaniel.jpg", value: 70 },
      { name: "Norfolk Spaniel", note: "A springer-type spaniel later folded into the breed.", img: "/history/breeds/Norfolk-Spaniel.jpg", value: 30 }
    ]
  },

  "Skye Terrier": {
    name: "Skye Terrier",
    note: "One of the oldest terriers in Britain, a long, low, heavy-coated earth dog from the Isle of Skye and the Western Highlands.",
    children: [
      { name: "Old Highland terriers", note: "The old working-terrier stock of the Highlands that every Scottish terrier springs from. Now extinct.", img: "/history/breeds/Old-Highland-terriers.jpg", value: 60 },
      { name: "Skye terrier stock", note: "The long-coated Isle of Skye earth dogs at the root of the whole Highland terrier family. Now endangered.", img: "/history/breeds/Isle-of-Skye-earth-dogs.jpg", value: 40 }
    ]
  },

  "Scottish Terrier": {
    name: "Scottish Terrier",
    note: "The 'diehard' of the Highlands, drawn from the old Scottish terrier stock into a sturdy, short-legged earth dog.",
    children: [
      { name: "Old Highland terriers", note: "The shared Highland working-terrier stock, once all just called Scottish terriers. Now extinct.", img: "/history/breeds/Old-Highland-terriers.jpg", value: 60 },
      { name: "Skye terrier stock", note: "The long-coated island terriers from the same rootstock. Now endangered.", img: "/history/breeds/Isle-of-Skye-earth-dogs.jpg", value: 40 }
    ]
  },

  "Dandie Dinmont Terrier": {
    name: "Dandie Dinmont Terrier",
    note: "A long-bodied terrier of the Anglo-Scottish border with a soft topknot, named after a character in a Walter Scott novel.",
    children: [
      { name: "Old Border terriers", note: "The rough working terriers of the border country, kept by families like the Allans of Holystone. Now extinct.", img: "/history/breeds/Old-Border-terriers.jpg", value: 65 },
      { name: "Skye terrier stock", note: "Long, low Scottish terriers, one suggested source of its weasel shape. Now endangered.", img: "/history/breeds/Isle-of-Skye-earth-dogs.jpg", value: 20 },
      { name: "Otterhound", note: "A little hound blood is thought to have added size and the soft coat.", img: "/history/breeds/otterhound-photo.jpg", value: 15 }
    ]
  },

  "Black and Tan Terrier": {
    name: "Black and Tan Terrier",
    note: "The Old English Terrier, the extinct rough working terrier that nearly every British terrier descends from.",
    children: [
      { name: "Old British ratting terriers", note: "The ancient ratting and vermin dogs kept on farms long before breeds were named. Now extinct.", img: "/history/breeds/Old-British-ratting-terriers.jpg", value: 60 },
      { name: "Earth and hunt terriers", note: "Hardy go-to-ground terriers used to bolt fox and badger. Now extinct.", img: "/history/breeds/Earth-and-hunt-terrier.jpg", value: 40 }
    ]
  },

  "Manchester Terrier": {
    name: "Manchester Terrier",
    note: "A sleek black-and-tan ratting terrier from the rat pits and rabbit-coursing fields of industrial Manchester.",
    children: [
      { name: "Black and Tan Terrier", note: "The old black-and-tan working terrier at its core.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 65 },
      { name: "Whippet", note: "Crossed in for speed and a clean, racy outline.", img: "/history/breeds/whippet-photo.jpg", value: 35 }
    ]
  },

  "Bedlington Terrier": {
    name: "Bedlington Terrier",
    note: "A lithe, lamb-like terrier from the Northumberland mining country, once called the Rothbury or Rodbury Terrier and prized by poachers.",
    children: [
      { name: "Old Border terriers", note: "The local working terriers of the Rothbury and border country. Now extinct.", img: "/history/breeds/Old-Border-terriers.jpg", value: 50 },
      { name: "Whippet", note: "Brought in for speed and the arched, racy back.", img: "/history/breeds/whippet-photo.jpg", value: 30 },
      { name: "Dandie Dinmont Terrier", note: "A close relative from the same border rootstock, sharing the crisp coat and topknot.", img: "/history/breeds/dandie-dinmont-terrier.jpg", value: 20 }
    ]
  },

  // Family 2, Irish, fell and highland terriers (Tudor trail, 10 August).
  // Two roots. The Highland and glen earth dogs go back to the medieval Earth
  // Dog, so they reach Tudor now. The Irish and fell terriers root in the old
  // British black-and-tan working terrier (Old English Black and Tan Terrier),
  // which is a Family 6 writing job, so those lines wait for Family 6. The
  // single-parent value of 100 is deliberate and honest, matching the shipped
  // Soft-Coated Wheaten Terrier, not the valueless-branch shape.
  "Skye terrier stock": {
    name: "Skye terrier stock",
    note: "The long-coated Isle of Skye earth dogs at the root of the whole Highland terrier family. Now extinct.",
    children: [
      { name: "Earth Dog", note: "The old medieval earth-working dog type the Highland earth dogs go back to. Now extinct.", img: "/history/breeds/medieval-earth-dog.jpg", value: 100 }
    ]
  },
  "Low-slung soldiers' dogs": {
    name: "Low-slung soldiers' dogs",
    note: "Short-legged dogs left by Flemish and Hessian soldiers settled in the glen. Now extinct.",
    // 19 August 2026: pass-through fixed with the Celtic Heeler fallback,
    // researched, no documented second parent found. These were imported
    // continental dogs (Flemish, Lowland, German and French soldiers' low dogs,
    // AKC Glen of Imaal Terrier history), so their own ancestry is off-tree; the
    // documented cross with local Irish terriers belongs to the Glen of Imaal,
    // not to these dogs. No suitable existing node, and inventing a continental
    // one is the speculation the brief warns against.
    //
    // 19 August 2026 (later): the self-repeat child was removed. A node should
    // not be its own child, and it leaked into the render's name paths; the level
    // root now carries its own name on the outer ring, so the node returns to its
    // single real parent below.
    children: [
      { name: "Earth Dog", note: "The old low, earth-working dog type behind these short-legged glen dogs. Now extinct.", img: "/history/breeds/medieval-earth-dog.jpg", value: 100 }
    ]
  },
  "Native Irish terriers": {
    name: "Native Irish terriers",
    note: "The old Irish farm-terrier stock shared with the Wheaten and Kerry Blue. Now extinct.",
    // 19 August 2026: pass-through fixed with the Celtic Heeler fallback. The
    // documented origin (Showsight, Wisdom Panel) is a cross of the old British
    // black-and-tan terrier with a racier native Irish red or wheaten terrier,
    // but that second stock is this node's own indigenous base, not a distinct
    // older node, so the self-repeat represents it honestly. Rejected as
    // folklore: the Irish Wolfhound "behind" the Irish terrier ("some people even
    // think", not documented).
    //
    // 19 August 2026 (later): the self-repeat child was removed. A node should
    // not be its own child, and it leaked into the render's name paths; the level
    // root now carries its own name on the outer ring, so the node returns to its
    // single real parent below.
    children: [
      { name: "Old English Black and Tan Terrier", note: "The old British black-and-tan working terrier, the shared ratting stock behind Britain and Ireland's farm terriers. Now extinct.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 100 }
    ]
  },
  "Old fell terriers": {
    name: "Old fell terriers",
    note: "The hardy black-and-tan fox-working terriers of the northern fells. Now extinct.",
    // 19 August 2026: pass-through fixed with the Celtic Heeler fallback. A
    // second parent of Old Border terriers was considered (Wikipedia Fell
    // Terrier: fell terriers "share common ancestry with Border terriers") and
    // rejected: shared common ancestry is a shared-ancestor claim, not descent
    // from them, and Old Border terriers has no strip anchor, so the era check
    // could not be run. No documented second parent.
    //
    // 19 August 2026 (later): the self-repeat child was removed. A node should
    // not be its own child, and it leaked into the render's name paths; the level
    // root now carries its own name on the outer ring, so the node returns to its
    // single real parent below.
    children: [
      { name: "Old English Black and Tan Terrier", note: "The old black-and-tan working terrier stock the fell terriers were bred from. Now extinct.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 100 }
    ]
  },

  "Welsh Terrier": {
    name: "Welsh Terrier",
    note: "A wiry black-and-tan terrier from Wales, bred to face fox, otter and badger underground.",
    children: [
      { name: "Old English Black and Tan Terrier", note: "The old rough black-and-tan working terrier it descends from almost unchanged.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 75 },
      { name: "Old fell terriers", note: "Hardy broken-coated working terriers of the hills. Now extinct.", img: "/history/breeds/Old-fell-terriers-Patterdale-Terrier-Working-hunt-terriers.jpg", value: 25 }
    ]
  },

  "Kerry Blue Terrier": {
    name: "Kerry Blue Terrier",
    note: "Ireland's blue-coated all-rounder from County Kerry, a farm dog, herder, hunter and fighter rolled into one.",
    children: [
      { name: "Soft-Coated Wheaten Terrier", note: "The older native Irish terrier widely held to be its parent.", img: "/history/breeds/soft-coated--wheaten-terrier-photo.jpg", value: 60 },
      // 19 August 2026: this extinct ancestor was wearing a photograph of a living descendant, the Irish Terrier. Repointed to its own artwork.
      { name: "Native Irish terriers", note: "The shared stock of Ireland's working farm terriers. Now extinct.", img: "/history/breeds/native-irish-terriers.jpg", value: 40 }
    ]
  },

  // Family 6, the old English terrier stock (Tudor trail, 10 August). One
  // population, one selection event: the white terriers were bred out of the
  // black-and-tan working stock for coat colour, so only the black and tan needs
  // to reach Tudor and the white line inherits it. Both were the site's most-used
  // bare leaves. Single-parent value 100, matching the shipped Wheaten. Earth Dog
  // is one hop, keeping Kerry Blue's chain (Kerry, Wheaten, Native Irish terriers,
  // OEBT, Earth Dog) at depth 4, inside MAX_LINEAGE_DEPTH.
  "Old English Black and Tan Terrier": {
    name: "Old English Black and Tan Terrier",
    note: "The old British black-and-tan working terrier, the rough ratting and vermin stock much of Britain's terrier blood was drawn from. Now extinct.",
    // 19 August 2026: pass-through fixed with a documented second parent, not
    // the fallback. Wikipedia's "Black and Tan Terrier" traces the breed to the
    // small black-and-tan ratting terriers noted from the sixteenth century, so
    // its children are now Old British ratting terriers (60) and Earth and hunt
    // terriers (40), mirroring how the sibling Black and Tan Terrier root is
    // wired. The previous single Earth Dog link was dropped: the node's own note
    // admitted it was a functional match rather than documented descent.
    children: [
      { name: "Old British ratting terriers", note: "The ancient ratting and vermin dogs kept on farms long before breeds were named. Now extinct.", img: "/history/breeds/Old-British-ratting-terriers.jpg", value: 60 },
      { name: "Earth and hunt terriers", note: "Hardy go-to-ground terriers used to bolt fox and badger. Now extinct.", img: "/history/breeds/Earth-and-hunt-terrier.jpg", value: 40 }
    ]
  },
  "Old English White Terrier": {
    name: "Old English White Terrier",
    note: "The white-bodied working terriers bred out of the black-and-tan stock for coat colour. The split of this line into population and named breed is a useful reconstruction, not a documented distinction: the three white-terrier names all refer to one extinct breed. Now extinct.",
    // 19 August 2026: pass-through fixed with the Celtic Heeler fallback. There
    // is no documented second parent: this is the black-and-tan stock selected
    // for a white coat, and (per this node's own note and Wikipedia) the three
    // white-terrier names refer to one extinct breed. A colour morph of one stock
    // has no second parent.
    //
    // 19 August 2026 (later): the self-repeat child was removed. A node should
    // not be its own child, and it leaked into the render's name paths; the level
    // root now carries its own name on the outer ring, so the node returns to its
    // single real parent below.
    children: [
      { name: "Old English Black and Tan Terrier", note: "The black-and-tan working stock the white terriers were selected out of, for coat colour. Now extinct.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 100 }
    ]
  },

  "English White Terrier": {
    name: "English White Terrier",
    note: "A pricked-ear white terrier, a short-lived show breed drawn from Britain's old white working terriers, now extinct.",
    children: [
      { name: "Old English White Terrier", note: "The white-bodied fox-working terriers found across Britain since the 1700s.", img: "/history/breeds/english-white-terrier-painting.jpg", value: 60 },
      { name: "Old English Black and Tan Terrier", note: "The broader old black-and-tan terrier stock behind it.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 40 }
    ]
  },

  "Airedale Terrier": {
    name: "Airedale Terrier",
    note: "The 'King of Terriers', the largest of them all, made in Yorkshire's Aire valley to hunt otter and water rat.",
    children: [
      { name: "Old English Black and Tan Terrier", note: "The broken-coated working terrier that gave its terrier grit.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 60 },
      { name: "Otterhound", note: "Crossed in for size, a good nose and a love of water.", img: "/history/breeds/otterhound-photo.jpg", value: 40 }
    ]
  },

  "Sealyham Terrier": {
    name: "Sealyham Terrier",
    note: "A stocky white terrier built in Pembrokeshire by Captain John Edwardes to draw badger and otter alongside his hounds.",
    children: [
      { name: "Dandie Dinmont Terrier", note: "Brought in to shorten the leg and add bone.", img: "/history/breeds/dandie-dinmont-terrier.jpg", value: 35 },
      { name: "West Highland White Terrier", note: "Used to set the white coat that kept it from being mistaken for the quarry.", img: "/history/breeds/West-Highland-White-Terrier.jpg", value: 35 },
      { name: "Wire Fox Terrier", note: "Added gameness and a sharp working drive. Now endangered.", img: "/history/breeds/wire-fox-terrier.jpg", value: 30 }
    ]
  },

  "Cairn Terrier": {
    name: "Cairn Terrier",
    note: "A small, shaggy Highland terrier named for the rock cairns it bolted vermin from, the closest of all to the original Scottish working terrier.",
    children: [
      { name: "Skye terrier stock", note: "The island working terriers it was once grouped with as a 'short-haired Skye'. Now endangered.", img: "/history/breeds/Isle-of-Skye-earth-dogs.jpg", value: 55 },
      { name: "Highland mainland terriers", note: "The mainland Highland branch of the same Skye earth-dog stock, shared with the Scottie and Westie. Now extinct.", img: "/history/breeds/Highland-mainland-terriers.jpg", value: 45 }
    ]
  },

  "Lakeland Terrier": {
    name: "Lakeland Terrier",
    note: "A fell terrier from the Lake District, bred to follow fox over the crags and go to ground without flinching.",
    children: [
      { name: "Old fell terriers", note: "The hardy black-and-tan working terriers of the northern fells. Now extinct.", img: "/history/breeds/Old-fell-terriers-Patterdale-Terrier-Working-hunt-terriers.jpg", value: 30 },
      { name: "Old wirehaired fell terriers", note: "The wiry-coated strain of fell terrier behind its broken jacket. Now extinct.", img: "/history/breeds/Old-wirehaired-fell-terrier.jpg", value: 20 },
      { name: "Bedlington Terrier", note: "A near neighbour that lent coat and line.", img: "/history/breeds/Bedlington Terrier-photo.jpg", value: 25 },
      { name: "Wire Fox Terrier", note: "Added smartness and a workmanlike head. Now endangered.", img: "/history/breeds/wire-fox-terrier.jpg", value: 25 }
    ]
  },

  "Fox Terrier": {
    name: "Fox Terrier",
    note: "The classic earth dog of the foxhunt, carried to the field to bolt the fox when it went to ground.",
    children: [
      { name: "Old English Black and Tan Terrier", note: "The smooth and rough black-and-tan terriers at its foundation.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 45 },
      { name: "English White Terrier", note: "Lent the predominantly white, easy-to-see coat.", img: "/history/breeds/english-white-terrier-painting.jpg", value: 25 },
      { name: "Beagle", note: "A dash of hound for nose and cry.", img: "/history/breeds/beagle.jpg", value: 15 },
      { name: "Bull Terrier", note: "A touch of bull blood for grit.", img: "/bull-terrier-square.jpg", value: 15 }
    ]
  },

  "English Toy Terrier": {
    name: "English Toy Terrier",
    note: "A miniature black-and-tan, the toy version of the Manchester Terrier, once a champion rat-pit performer.",
    children: [
      { name: "Manchester Terrier", note: "The black-and-tan ratter it was bred down from.", img: "/history/breeds/manchester-terrior.jpg", value: 70 },
      { name: "Black and Tan Terrier", note: "The older working terrier behind the Manchester.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 30 }
    ]
  },

  "Paisley Terrier": {
    name: "Paisley Terrier",
    note: "A silky, blue show terrier from around Paisley and Clydeside, the glamorous strain of the Skye that helped create the Yorkshire.",
    children: [
      { name: "Skye terrier stock", note: "The long-coated Scottish terriers it was bred for beauty from. Now endangered.", img: "/history/breeds/Isle-of-Skye-earth-dogs.jpg", value: 65 },
      { name: "Old Highland terriers", note: "The working Scottish terriers behind the silky Clydeside strains. Now extinct.", img: "/history/breeds/Old-Highland-terriers.jpg", value: 35 }
    ]
  },

  "Irish Terrier": {
    name: "Irish Terrier",
    note: "The 'daredevil' of Ireland, a fiery red terrier and one of the four native Irish terrier breeds.",
    children: [
      { name: "Native Irish terriers", note: "The old Irish farm-terrier stock shared with the Wheaten and Kerry Blue. Now extinct.", img: "/history/breeds/native-irish-terriers.jpg", value: 60 },
      { name: "Old English Black and Tan Terrier", note: "Wirehaired working terriers that shaped the harsh red coat.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 40 }
    ]
  },

  "Soft-Coated Wheaten Terrier": {
    name: "Soft-Coated Wheaten Terrier",
    note: "The oldest of Ireland's four native terriers, a soft-coated all-purpose farm dog, and the likely parent of the Kerry Blue and Irish Terrier.",
    // 19 August 2026: pass-through fixed with the Celtic Heeler fallback. The
    // Wheaten is the oldest Irish terrier and the progenitor of the Kerry Blue
    // and Irish Terrier (AKC, SCWT Club of GB), so as the foundational native
    // stock it has no documented distinct second parent. Rejected as folklore:
    // Portuguese Water Dog ancestry for the Wheaten.
    //
    // 19 August 2026 (later): the self-repeat child was removed. A node should
    // not be its own child, and it leaked into the render's name paths; the level
    // root now carries its own name on the outer ring, so the node returns to its
    // single real parent below.
    children: [
      { name: "Native Irish terriers", note: "Ireland's old all-purpose working farm terriers. Now extinct.", img: "/history/breeds/native-irish-terriers.jpg", value: 100 }
    ]
  },

  "Glen of Imaal Terrier": {
    name: "Glen of Imaal Terrier",
    note: "A low, powerful terrier from a remote Wicklow valley, one of the four native Irish terriers and quiet for its kind.",
    children: [
      { name: "Native Irish terriers", note: "The old Irish farm-terrier stock, with the Wheaten in its background. Now extinct.", img: "/history/breeds/native-irish-terriers.jpg", value: 60 },
      // 19 August 2026: this extinct ancestor was wearing a photograph of a living descendant, the Dandie Dinmont Terrier. Repointed to its own artwork.
      { name: "Low-slung soldiers' dogs", note: "Short-legged dogs left by Flemish and Hessian soldiers settled in the glen. Now extinct.", img: "/history/breeds/low-slung-soldiers-dogs.jpg", value: 40 }
    ]
  },

  "Norwich Terrier": {
    name: "Norwich Terrier",
    note: "A tiny, sturdy red terrier from East Anglia, made famous by Cambridge students who kept them to bolt rats in the colleges. The prick-eared cousin of the Norfolk.",
    children: [
      { name: "Irish Terrier", note: "Small red Irish terriers in the early Trumpington stock.", img: "/history/breeds/irish-terrier-photo.jpg", value: 40 },
      { name: "Yorkshire Terrier", note: "A bigger silky terrier said to be in the early mix.", img: "/history/breeds/yorkshire-terrier-photo.jpg", value: 30 },
      { name: "Local red ratting terriers", note: "The small working terriers of Norfolk farms and gypsy ratters. Now extinct.", img: "/history/breeds/Local-red-ratting-terriers.jpg", value: 30 }
    ]
  },

  "Patterdale Terrier": {
    name: "Patterdale Terrier",
    note: "A tough, no-nonsense black fell terrier from the Lake District, bred purely to work fox and not for the show ring.",
    children: [
      { name: "Old fell terriers", note: "The black-and-tan working terriers of the northern fells. Now extinct.", img: "/history/breeds/Old-fell-terriers-Patterdale-Terrier-Working-hunt-terriers.jpg", value: 60 },
      { name: "Border Terrier", note: "A close fell neighbour from the same hill stock.", img: "/history/breeds/border-terrier-photo.jpg", value: 25 },
      { name: "Bedlington Terrier", note: "A dash of Bedlington in some northern lines.", img: "/history/breeds/Bedlington Terrier-photo.jpg", value: 15 }
    ]
  },

  "Lucas Terrier": {
    name: "Lucas Terrier",
    note: "A small, friendly working terrier created in the 20th century by Sir Jocelyn Lucas by crossing two existing terriers.",
    children: [
      { name: "Sealyham Terrier", note: "Lucas's own working Sealyhams formed one half of the cross.", img: "/history/breeds/sealyham-terrier-photo.jpg", value: 50 },
      { name: "Norfolk Terrier", note: "Crossed in to bring the size down and add hardy working drive.", img: "/history/breeds/Norfolk-Terrier-photo.jpg", value: 50 }
    ]
  },

  "Norfolk Terrier": {
    name: "Norfolk Terrier",
    note: "The drop-eared twin of the Norwich, the same little red ratting terrier until the two were split by ear type in 1964.",
    children: [
      { name: "Norwich terrier stock", note: "The same East Anglian red terriers, before the ear-type split.", img: "/history/breeds/norwich-terrier-photo.jpg", value: 50 },
      { name: "Irish Terrier", note: "Small red Irish terriers in the early mix.", img: "/history/breeds/irish-terrier-photo.jpg", value: 25 },
      { name: "Yorkshire Terrier", note: "A silky terrier said to add to the early type.", img: "/history/breeds/yorkshire-terrier-photo.jpg", value: 25 }
    ]
  },

  // Family 4, water spaniels (Tudor trail, 10 August). The British and Irish
  // water spaniels root in the Otterhound, the web-footed otter-hunting Tudor
  // hound: a functional-match water-working root, deliberately distinct from the
  // land-spaniel Rache (Family 1) and the continental water dogs (Family 5).
  // Old Irish water dogs reaches Otterhound in parallel, not through the British
  // Water spaniels, so no claim is made that the Irish dogs came from them.
  // Single-parent value 100, matching the shipped Wheaten.
  "Water spaniels": {
    name: "Water spaniels",
    note: "The old rough-coated working water spaniels of Britain's rivers and fens. Now extinct.",
    // LABRADOR PASSES ON A MINOR BRANCH. Labrador reaches Tudor through its 13%
    // Water spaniels branch here, so it reads as green. Its dominant 55% St John's
    // water-dog line still dead-ends until Family 5, which traces its principal
    // ancestry. A green Labrador does NOT mean its main line is finished.
    children: [
      { name: "Otterhound", note: "The web-footed otter-hunting hound, the water-working Tudor root of the water spaniels. A functional match, not documented descent. Now endangered.", img: "/history/breeds/otterhound-photo.jpg", value: 100 }
    ]
  },
  "Old Irish water dogs": {
    name: "Old Irish water dogs",
    note: "The southern and northern water spaniels of Ireland. Now extinct.",
    children: [
      { name: "Otterhound", note: "The web-footed otter-hunting hound, the same water-working Tudor root, reached in parallel with the British water spaniels. Now endangered.", img: "/history/breeds/otterhound-photo.jpg", value: 100 }
    ]
  },
  "English Water Spaniel": {
    name: "English Water Spaniel",
    note: "The extinct native English water spaniel, a working water dog of the fens and rivers. Now extinct.",
    children: [
      { name: "Water spaniels", note: "The broad old British water-spaniel population it came from. Now extinct.", img: "/history/breeds/original-water-spaniel.jpg", value: 100 }
    ]
  },

  "Tweed Water Spaniel": {
    name: "Tweed Water Spaniel",
    note: "An extinct liver-brown water dog from the Scottish Borders and the Tweed valley, famous as a key ancestor of the Golden and Curly-Coated Retrievers.",
    children: [
      { name: "Water spaniels", note: "The local rough-coated water dogs of the Border rivers. Now extinct.", img: "/history/breeds/original-water-spaniel.jpg", value: 55 },
      { name: "St John's Water Dog", note: "Newfoundland fishing-dog blood that added retrieving power. Now extinct.", img: "/history/breeds/St-Johns-Water-Dog.jpg", value: 45 }
    ]
  },

  "Lurcher": {
    name: "Lurcher",
    note: "Not a breed but a type: a sighthound crossed with a working dog, long the poacher's and traveller's companion, fast and quiet.",
    children: [
      { name: "Greyhound", note: "A sighthound for speed and a silent, sweeping run.", img: "/history/breeds/original-greyhound.jpg", value: 50 },
      { name: "Collie or working dog", note: "Herding or pastoral blood for brains and biddability. Now extinct.", img: "/history/breeds/Old-Scotch-Collie.jpg", value: 30 },
      { name: "Old English Black and Tan Terrier", note: "Sometimes terrier blood for grit and a harder coat.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 20 }
    ]
  },

  "Longdog": {
    name: "Longdog",
    note: "A sighthound crossed with another sighthound, bred purely for speed rather than the all-round craft of the lurcher.",
    children: [
      { name: "Greyhound", note: "The foundation of nearly every running dog.", img: "/history/breeds/original-greyhound.jpg", value: 50 },
      { name: "Whippet", note: "Added for nimble, sprinting pace.", img: "/history/breeds/whippet-photo.jpg", value: 25 },
      { name: "Deerhound", note: "Bigger sighthound blood for stamina over rough ground. Now endangered.", img: "/history/breeds/Medieval-Scottish-Deerhound.jpg", value: 25 }
    ]
  },

  "Welsh Springer Spaniel": {
    name: "Welsh Springer Spaniel",
    note: "An old red-and-white Welsh gundog, known for generations as the Welsh Cocker before becoming the Welsh Springer in 1902.",
    children: [
      { name: "Old Welsh land spaniels", note: "The native red-and-white working spaniels of Wales. Now extinct.", img: "/history/breeds/Old-Welsh-land-spaniels.jpg", value: 60 },
      { name: "Land spaniels", note: "The larger flushing spaniels of the same family. Now extinct.", img: "/history/breeds/original-land-spaniel.jpg", value: 40 }
    ]
  },

  "Field Spaniel": {
    name: "Field Spaniel",
    note: "A long, low black spaniel bred up in Victorian show rings from the larger cocking spaniels, once nearly ruined by exaggeration.",
    children: [
      { name: "Land spaniels", note: "The old land-spaniel stock at its foundation. Now extinct.", img: "/history/breeds/original-land-spaniel.jpg", value: 45 },
      { name: "Sussex Spaniel", note: "Lent weight, bone and a longer body.", img: "/history/breeds/Sussex-Spaniel.jpg", value: 35 },
      { name: "Clumber Spaniel", note: "Heavier spaniel blood for substance.", img: "/history/breeds/clumber-spaniel-photo.jpg", value: 20 }
    ]
  },

  "Sussex Spaniel": {
    name: "Sussex Spaniel",
    note: "An old, short-legged, golden-liver spaniel from the county of Sussex, bred to work slowly and give tongue in dense cover.",
    children: [
      { name: "Land spaniels", note: "The native working spaniels of southern England. Now extinct.", img: "/history/breeds/original-land-spaniel.jpg", value: 60 },
      { name: "Heavier working spaniels", note: "Lower, stouter spaniels that fixed its build. Now extinct.", img: "/history/breeds/heavier-working-spaniel.jpg", value: 40 }
    ]
  },

  "Norfolk Spaniel": {
    name: "Norfolk Spaniel",
    note: "An extinct liver-and-white springer-type spaniel, the Victorian forerunner of the English Springer, rolled into that breed in 1903.",
    children: [
      { name: "Land spaniels", note: "The old springing land-spaniel stock at its core. Now extinct.", img: "/history/breeds/original-land-spaniel.jpg", value: 65 },
      { name: "Water spaniels", note: "Water-spaniel blood for the liver colour and a keenness in wet cover. Now extinct.", img: "/history/breeds/original-water-spaniel.jpg", value: 35 }
    ]
  },

  "Toy Trawler Spaniel": {
    name: "Toy Trawler Spaniel",
    note: "An extinct small black-and-tan toy spaniel, a sporting-bred miniature linked to the King Charles and Sussex spaniels.",
    children: [
      { name: "King Charles Spaniel", note: "The toy spaniel at its heart.", img: "/history/breeds/king-charles-spaniel-photo.jpg", value: 60 },
      { name: "Sussex Spaniel", note: "Sporting spaniel blood from the old land-spaniel side.", img: "/history/breeds/Sussex-Spaniel.jpg", value: 40 }
    ]
  },

  "Irish Water Spaniel": {
    name: "Irish Water Spaniel",
    note: "The tallest of the spaniels, a curly liver-brown water dog with a rat-like tail, one of Ireland's old gundog breeds.",
    children: [
      { name: "Old Irish water dogs", note: "The southern and northern water spaniels of Ireland. Now extinct.", img: "/history/breeds/Old-Irish-water-dog.jpg", value: 55 },
      // 19 August 2026: this extinct ancestor was wearing a photograph of a living descendant, the Poodle. Repointed to its own artwork.
      { name: "Continental water dogs", note: "Continental curly water dogs that shaped the coat. Now extinct.", img: "/history/breeds/continental-water-dogs.jpg", value: 45 }
    ]
  },

  "Bullmastiff": {
    name: "Bullmastiff",
    note: "The gamekeeper's night dog, built in Victorian England to track and pin poachers without mauling them. Mostly Mastiff, with Bulldog for grip.",
    children: [
      { name: "English Mastiff", note: "The larger share, for size, scent and a steady nerve.", img: "/history/breeds/english-mastiff-photo.jpg", value: 60 },
      { name: "Old English Bulldog", note: "Bulldog drive and a tenacious grip. Now extinct.", img: "/history/breeds/Old-English-Bulldog.jpg", value: 40 }
    ]
  },

  "Curly-Coated Retriever": {
    name: "Curly-Coated Retriever",
    note: "One of the oldest retrievers, a tall water dog covered in tight curls, the gamekeeper's and poacher's choice for wildfowl.",
    children: [
      { name: "English Water Spaniel", note: "The extinct native water spaniel at its core.", img: "/history/breeds/original-water-spaniel.jpg", value: 35 },
      { name: "St John's Water Dog", note: "Newfoundland fishing-dog blood for retrieving. Now extinct.", img: "/history/breeds/St-Johns-Water-Dog.jpg", value: 30 },
      { name: "Irish Water Spaniel", note: "Its closest relative, sharing the curly water-dog coat.", img: "/history/breeds/irish-water-spaniel.jpg", value: 20 },
      { name: "Poodle", note: "A later touch, often credited for the tight curls.", img: "/poodle-square.jpg", value: 15 }
    ]
  },

  "Flat-Coated Retriever": {
    name: "Flat-Coated Retriever",
    note: "Once called the Wavy-Coated Retriever, the smart, glossy black gundog that was the gamekeeper's favourite before the Labrador rose.",
    children: [
      { name: "St John's Water Dog", note: "The Newfoundland fishing dog behind all the retrievers. Now extinct.", img: "/history/breeds/St-Johns-Water-Dog.jpg", value: 50 },
      { name: "Setter", note: "Setter blood for feathering and a good nose. Now in-decline.", img: "/history/breeds/british-setters.jpg", value: 30 },
      { name: "Water spaniels", note: "Working water spaniels that added drive and a love of wet cover. Now extinct.", img: "/history/breeds/original-water-spaniel.jpg", value: 10 },
      { name: "Shepherd's Dog", note: "Practical medieval working dog used to move and protect sheep, forming an early root of Britain's collie families. An extinct historical type.", img: "/history/breeds/medieval-shepherds-dog.jpg", value: 10 }
    ]
  },

  "Rough Collie": {
    name: "Rough Collie",
    note: "The flowing-coated Scottish herder of farm and film, refined in Victorian times with a touch of Borzoi for its long, noble head.",
    children: [
      { name: "Old working collies", note: "The old northern hill-collie landrace of Scotland and the borders, the shared working stock the Rough, Smooth and Border collies all grew from. Now extinct.", img: "/history/breeds/Old-working-collies-cluster.jpg", value: 65 },
      // 19 August 2026: this extinct ancestor was wearing a photograph of a living descendant, the Bearded Collie. Repointed to its own artwork.
      { name: "Old hill and bearded collies", note: "Shaggy upland herding dogs of the same family. Now extinct.",  img: "/history/breeds/old-hill-and-bearded-collies.jpg", value: 35 }
    ]
  },

  "Gordon Setter": {
    name: "Gordon Setter",
    note: "Scotland's black-and-tan setter, built up at the Duke of Gordon's kennels into a heavier, steady bird dog.",
    children: [
      { name: "Old black-and-tan setters", note: "The setting dogs at its foundation. Now extinct.", img: "/history/breeds/british-setters.jpg", value: 65 },
      { name: "Bloodhound", note: "Thought to have deepened the nose and the black-and-tan.", img: "/history/breeds/modern-bloodhound.jpg", value: 20 },
      // 19 August 2026: the bare "Collie" leaf dead-ended (no tree of its own).
      // Renamed to the "Rough Collie" lineage root so the Setter reaches the
      // collie ancestry; note and img taken from that root. Value unchanged.
      { name: "Rough Collie", note: "The flowing-coated Scottish herder of farm and film, refined in Victorian times with a touch of Borzoi for its long, noble head.", img: "/history/breeds/rough-collie-photo.jpg", value: 15 }
    ]
  },

  "Lancashire Heeler": {
    name: "Lancashire Heeler",
    note: "A tiny, sharp black-and-tan drover's dog from north-west England, used to nip cattle along and clear rats from the farm.",
    children: [
      // 19 August 2026: the bare "Welsh Corgi" leaf dead-ended (no tree of its
      // own). Renamed to the "Celtic Heeler" lineage root, the correct ancestral
      // corgi stock, so it grafts; note and img taken from that root. Value
      // unchanged.
      { name: "Celtic Heeler", note: "The ancestral low-slung herding dogs brought to Wales by Celtic tribes -- forerunners of both the Cardigan and Pembroke Welsh Corgi. Short legs bred for nipping cattle heels and ducking kicks.", img: "/history/breeds/medieval-corgi.jpg", value: 55 },
      { name: "Manchester Terrier", note: "Black-and-tan terrier blood for ratting and colour.", img: "/history/breeds/manchester-terrior.jpg", value: 45 }
    ]
  },

  "Cavalier King Charles Spaniel": {
    name: "Cavalier King Charles Spaniel",
    note: "A 1920s revival of the older, longer-nosed toy spaniel of the Stuart court, bred back from the flat-faced King Charles Spaniel.",
    children: [
      { name: "King Charles Spaniel", note: "The modern flat-faced toy spaniel it was bred back from.", img: "/history/breeds/king-charles-spaniel-photo.jpg", value: 70 },
      { name: "Old sporting toy spaniels", note: "The longer-muzzled toy spaniels of older paintings. Now extinct.", img: "/history/breeds/Old-sporting-toy-spaniels.jpg", value: 30 }
    ]
  },

  // LEFT FAILING ON PURPOSE (Tudor trail, 10 August). A 1980s recreation from
  // arctic sled dogs and German shepherd stock. Neither ancestry is British and
  // neither runs through the Tudor record: Arctic sled dogs reach no era card
  // (there is no arctic or spitz card), and German Shepherd's tree stops at
  // German herding populations even after the step-2 rename. It honestly cannot
  // reach Tudor without inventing a British route it does not have, so it stays
  // failing. That is the correct outcome, not unfinished work.
  "Northern Inuit Dog": {
    name: "Northern Inuit Dog",
    note: "A 1980s British creation, bred to look like a wolf while keeping a gentle, trainable temperament. Famous as the Stark direwolves on screen.",
    children: [
      { name: "Arctic sled dogs", note: "Siberian Husky and Alaskan Malamute for the wolfish looks and coat.", img: "/history/breeds/Arctic-sled-dogs.jpg", value: 55 },
      // Renamed from "German Shepherd Dog" to "German Shepherd" and img switched from the
      // wrong-animal /history/breeds/German-cattle-dog.jpg to /german-shepard-square.jpg so this
      // node grafts onto the German Shepherd lineage root and matches the pack card (15 August 2026).
      { name: "German Shepherd", note: "For size, trainability and a steady working mind.",  img: "/german-shepard-square.jpg", value: 45 }
    ]
  },

  "Cumberland Sheepdog": {
    name: "Cumberland Sheepdog",
    note: "An extinct northern working collie of Cumberland and the border hills, a close relative of the Border Collie that was largely absorbed into it.",
    children: [
      { name: "Old working collies", note: "The old northern hill-collie landrace of Scotland and the borders, the shared working stock the Rough, Smooth and Border collies all grew from. Now extinct.", img: "/history/breeds/Old-working-collies-cluster.jpg", value: 60 },
      { name: "Welsh herding dogs", note: "The old Welsh herding and droving dogs, a long-legged, loose-eyed landrace and the parallel Welsh branch behind the region's sheep-working breeds. Now extinct.", img: "/history/breeds/Welsh-herding-dogs-cluster.jpg", value: 40 }
    ]
  },

  "Toy Bulldog": {
    name: "Toy Bulldog",
    note: "An extinct miniature Bulldog of Victorian England, a small companion bull-type that helped give rise to the French Bulldog.",
    children: [
      { name: "Old English Bulldog", note: "Small specimens of the old bull-baiting dog, bred down in size. Now extinct.", img: "/history/breeds/Old-English-Bulldog.jpg", value: 65 },
      { name: "Pug-type toy dogs", note: "Toy blood sometimes used to fix the small size. Now extinct.", img: "/history/breeds/pug-type-toy-dog.jpg", value: 35 }
    ]
  },

  "Dumfriesshire Hound": {
    name: "Dumfriesshire Hound",
    note: "A pack of big black-and-tan foxhounds bred in Dumfriesshire after the First World War, kept working until the pack was disbanded in 2001.",
    children: [
      { name: "English Foxhound", note: "The foxhound base for the pack.", img: "/history/breeds/english-foxhound.jpg", value: 50 },
      // Split 14 August 2026, from one node "Bloodhound and Gascon hounds".
      // The pack is documented as a three-way cross of English Foxhound,
      // Bloodhound and Grand Bleu de Gascogne, so the two founders are named
      // separately and the former 50 divides evenly between them. Bloodhound is
      // a lineage key in its own right, so that half now grafts its real
      // ancestry in instead of dead-ending.
      { name: "Bloodhound", note: "Bloodhound for size, nose and the black-and-tan.", img: "/history/breeds/modern-bloodhound.jpg", value: 25 },
      { name: "Grand Bleu de Gascogne", note: "The big French blue hound, for scenting power and voice.", img: "/history/breeds/grand-bleu-de-gascogne.jpg", value: 25 }
    ]
  },

  "Irish Wolfhound": {
    name: "Irish Wolfhound",
    note: "A towering ancient hound bred to hunt wolves and guard halls, and one of the tallest dogs in the world.",
    children: [
      { name: "Celtic Hound", note: "The ancient sighthound stock the Celts brought across Europe.", img: "/history/breeds/celtic-hound-remake.jpg", value: 60 },
      { name: "Ancient Molossers", note: "Big mastiff-type blood for the bulk to bring down a wolf. Now extinct.", img: "/history/breeds/Ancient-Molossers.jpg", value: 40 }
    ]
  },

  // The four ancient extinct types below became playable levels on the
  // owner's instruction (4 August): each takes the Celtic Heeler shape, two
  // stock branches, each an even split between one deeper ancestor (the
  // half-size nested circle) and a same-name self-child kept in step by
  // hand. No sourced figures exist for any of this (docs/lineage/BRIEF.md
  // section 12), so the splits follow the section 7 rules. Because these
  // records are also grafted beneath later trees, giving them children
  // makes those host circles sprout the same nested structure, rescaled so
  // no displayed percentage moves.
  "Ancient Mastiff": {
    name: "Ancient Mastiff",
    note: "Powerful British guard and hunting dog praised by Roman writers for courage and strength. An extinct historical type.",
    img: "/history/breeds/ancient-british-mastiff-type.jpg",
    children: [
      {
        name: "Ancient Molossers",
        note: "The huge eastern war and guard dogs at the root of every mastiff. Now extinct.",
        img: "/history/breeds/Ancient-Molossers.jpg",
        children: [
          { name: "Old mastiffs of the ancient East", note: "The huge guard and hunting mastiffs of the ancient East, carved on palace walls thousands of years ago. Now extinct.", img: "/history/breeds/old-mastiffs-of-the-ancient-east.jpg", value: 25 },
          { name: "Ancient Molossers", note: "The huge eastern war and guard dogs at the root of every mastiff. Now extinct.", img: "/history/breeds/Ancient-Molossers.jpg", value: 25 },
        ],
      },
      {
        name: "Alaunt war dogs",
        note: "The fierce war and catch dogs that rode west with mounted warriors. Now extinct.",
        img: "/history/breeds/alunt-war-dogs.jpg",
        children: [
          { name: "Dogs of the Alan horsemen", note: "The big steppe dogs of the Alan horsemen, guarding their camps and herds across the plains. Now extinct.", img: "/history/breeds/dogs-of-the-alan-horsemen.jpg", value: 25 },
          { name: "Alaunt war dogs", note: "The fierce war and catch dogs that rode west with mounted warriors. Now extinct.", img: "/history/breeds/alunt-war-dogs.jpg", value: 25 },
        ],
      },
    ],
  },
  "Celtic Coursing Hound": {
    name: "Celtic Coursing Hound",
    note: "Swift Celtic sight-hunting dog described by classical writers, an early root of later British and Irish sighthounds. An extinct historical type.",
    img: "/history/breeds/ancient-celtic-coursing-hound.jpg",
    children: [
      {
        name: "Gaulish coursing hounds",
        note: "The swift vertragus hounds of Gaul that Roman writers admired for pure speed. Now extinct.",
        img: "/history/breeds/old-gaulish-coursinghounds.jpg",
        children: [
          { name: "Old hunting dogs of the Celts", note: "The native running dogs of Iron Age Europe. Now extinct.", img: "/history/breeds/Old-hunting-dogs-of-the-Celts.jpg", value: 25 },
          { name: "Gaulish coursing hounds", note: "The swift vertragus hounds of Gaul that Roman writers admired for pure speed. Now extinct.", img: "/history/breeds/old-gaulish-coursinghounds.jpg", value: 25 },
        ],
      },
      {
        name: "Ancient eastern sighthounds",
        note: "The slender desert coursing dogs of the old world. Now extinct.",
        img: "/history/breeds/Ancient-eastern-sighthounds.jpg",
        children: [
          { name: "Old desert coursing dogs", note: "The first slender chasing dogs of the old desert lands. Now extinct.", img: "/history/breeds/old-desert-coursing-dogs.jpg", value: 25 },
          { name: "Ancient eastern sighthounds", note: "The slender desert coursing dogs of the old world. Now extinct.", img: "/history/breeds/Ancient-eastern-sighthounds.jpg", value: 25 },
        ],
      },
    ],
  },
  // The five foundation records (docs/lineage/BRIEF.md section 3, Batch 3).
  // Roots by design like the two ancient additions above: no ancestor
  // children, no invented weights, flip-only cards. Referenced by no tree
  // yet; hanging them beneath the six approved trees is Batch 4 and 5 work,
  // gated by the percentage fixture.
  // Batch 5 shared stock entries (owner-approved notes and images,
  // 4 August): top-level so every tree naming these labels grafts the
  // foundation with correct per-host rescaling. Earth Dog is
  // assessed plausible beneath each (the medieval earth dog is the
  // documented functional category terriers continue), so it takes half of
  // each stock per the split rule, Celtic Heeler pattern. The owner accepted
  // the surfacing scope deliberately: these stocks are shared, so the
  // foundation appears in twelve trees (docs/lineage/BRIEF.md section 5).
  "Old Highland terriers": {
    name: "Old Highland terriers",
    note: "The old working-terrier stock of the Highlands that every Scottish terrier springs from. Now extinct.",
    children: [
      { name: "Earth Dog", note: "Small, determined hunting and vermin dog that followed quarry underground. An extinct historical type.", img: "/history/breeds/medieval-earth-dog.jpg", value: 30 },
      { name: "Old Highland terriers", note: "The old working-terrier stock of the Highlands that every Scottish terrier springs from. Now extinct.", img: "/history/breeds/Old-Highland-terriers.jpg", value: 30 },
    ],
  },
  "Old British ratting terriers": {
    name: "Old British ratting terriers",
    note: "The ancient ratting and vermin dogs kept on farms long before breeds were named. Now extinct.",
    children: [
      { name: "Earth Dog", note: "Small, determined hunting and vermin dog that followed quarry underground. An extinct historical type.", img: "/history/breeds/medieval-earth-dog.jpg", value: 30 },
      { name: "Old British ratting terriers", note: "The ancient ratting and vermin dogs kept on farms long before breeds were named. Now extinct.", img: "/history/breeds/Old-British-ratting-terriers.jpg", value: 30 },
    ],
  },
  "Earth and hunt terriers": {
    name: "Earth and hunt terriers",
    note: "Hardy go-to-ground terriers used to bolt fox and badger. Now extinct.",
    children: [
      { name: "Earth Dog", note: "Small, determined hunting and vermin dog that followed quarry underground. An extinct historical type.", img: "/history/breeds/medieval-earth-dog.jpg", value: 20 },
      { name: "Earth and hunt terriers", note: "Hardy go-to-ground terriers used to bolt fox and badger. Now extinct.", img: "/history/breeds/Earth-and-hunt-terrier.jpg", value: 20 },
    ],
  },
  // Playable like the two ancient additions above (owner instruction,
  // 4 August), same Celtic Heeler shape and section 7 rules. This record is
  // grafted inside the Talbot and Rache "Old scenting hounds" branches,
  // which now show this structure nested, rescaled, no displayed figure
  // moves.
  "Celtic Scent Hound": {
    name: "Celtic Scent Hound",
    note: "Early Celtic tracking hound that followed game by scent, representing the roots of later European scent hounds. An extinct historical type.",
    img: "/history/breeds/ancient-celtic-scent-hound.jpg",
    children: [
      {
        name: "Segusian tracking hounds",
        note: "The shaggy Gaulish trail hounds the Romans knew by name, famous for following a scent. Now extinct.",
        img: "/history/breeds/segusian-hounds.jpg",
        children: [
          { name: "Old hunting dogs of the Celts", note: "The native running dogs of Iron Age Europe. Now extinct.", img: "/history/breeds/Old-hunting-dogs-of-the-Celts.jpg", value: 25 },
          { name: "Segusian tracking hounds", note: "The shaggy Gaulish trail hounds the Romans knew by name, famous for following a scent. Now extinct.", img: "/history/breeds/segusian-hounds.jpg", value: 25 },
        ],
      },
      {
        name: "Laconian tracking hounds",
        note: "The keen-nosed hare-tracking hounds of ancient Greece, praised by Greek hunting writers. Now extinct.",
        img: "/history/greek-harehound.jpg",
        children: [
          { name: "Old trail dogs of the ancient East", note: "The early trail-following hunting dogs of the ancient East. Now extinct.", img: "/history/breeds/old-trail-dogs-of-the-ancient-east.jpg", value: 25 },
          { name: "Laconian tracking hounds", note: "The keen-nosed hare-tracking hounds of ancient Greece, praised by Greek hunting writers. Now extinct.", img: "/history/greek-harehound.jpg", value: 25 },
        ],
      },
    ],
  },
  // Playable (owner instruction, 4 August), same shape and rules. Grafted
  // inside the Cur tree's Drover's Dog branch, which now shows
  // this structure nested, rescaled, no displayed figure moves.
  "Livestock Dog": {
    name: "Livestock Dog",
    note: "Broad early working-dog population used to guard, move and control livestock before named British breeds existed. An extinct historical type.",
    img: "/history/breeds/ancient-livestock-dog.jpg",
    children: [
      {
        name: "Celtic herdsmen's dogs",
        note: "The all-round farm dogs of the Celtic tribes, guarding and driving the herds. Now extinct.",
        img: "/history/breeds/celtic-herdsmen-dogs.jpg",
        children: [
          { name: "Old hunting dogs of the Celts", note: "The native running dogs of Iron Age Europe. Now extinct.", img: "/history/breeds/Old-hunting-dogs-of-the-Celts.jpg", value: 25 },
          { name: "Celtic herdsmen's dogs", note: "The all-round farm dogs of the Celtic tribes, guarding and driving the herds. Now extinct.", img: "/history/breeds/celtic-herdsmen-dogs.jpg", value: 25 },
        ],
      },
      {
        name: "Roman shepherd dogs",
        note: "The flock-guarding sheepdogs the Roman farm writers described, kept white so the shepherd knew dog from wolf. Now extinct.",
        img: "/history/breeds/roman-shepherd-dogs.jpg",
        children: [
          { name: "Ancient Molossers", note: "The big flock-guarding stock of the ancient world. Now extinct.", img: "/history/breeds/Ancient-Molossers.jpg", value: 25 },
          { name: "Roman shepherd dogs", note: "The flock-guarding sheepdogs the Roman farm writers described, kept white so the shepherd knew dog from wolf. Now extinct.", img: "/history/breeds/roman-shepherd-dogs.jpg", value: 25 },
        ],
      },
    ],
  },
  "Shepherd's Dog": {
    name: "Shepherd's Dog",
    note: "Practical medieval working dog used to move and protect sheep, forming an early root of Britain's collie families. An extinct historical type.",
    children: [
      { name: "Celtic herdsmen's dogs", note: "The all-round farm dogs of the Celtic tribes, guarding and driving the herds. Now extinct.", img: "/history/breeds/celtic-herdsmen-dogs.jpg", value: 35 },
      { name: "Roman shepherd dogs", note: "The flock-guarding sheepdogs the Roman farm writers described, kept white so the shepherd knew dog from wolf. Now extinct.", img: "/history/breeds/roman-shepherd-dogs.jpg", value: 25 },
      // Added 18 August 2026. The Anglo-Saxon layer is supported by Crabtree's
      // East Anglia zooarchaeology; the Norse layer by the Heath Wood strontium
      // study.
      { name: "Anglo-Saxon herding dogs", note: "Collie-sized herding dogs of Anglo-Saxon England, found at West Stow and Brandon. Now extinct.", img: "/history/breeds/anglo-saxon-herding-dogs.jpg", value: 20 },
      { name: "Norse settlers dogs", note: "Scandinavian dogs brought over with Viking settlement, likely mixed into local herding stock. Now extinct.", img: "/history/breeds/viking-herding-spitz.jpg", value: 20 }
    ]
  },
  "Drover's Dog": {
    name: "Drover's Dog",
    note: "Tough working dog that helped move cattle and sheep over long distances to markets and towns. An extinct historical type.",
    children: [
      { name: "Celtic herdsmen's dogs", note: "The all-round farm dogs of the Celtic tribes, guarding and driving the herds. Now extinct.", img: "/history/breeds/celtic-herdsmen-dogs.jpg", value: 60 },
      { name: "Old British bandogs", note: "The heavy chained dogs of old England, kept tied by day and set loose at night, and put to work by butchers and baiters alike. Now extinct.", img: "/history/breeds/Old-British-bandogs.jpg", value: 40 }
    ]
  },
  "Earth Dog": {
    name: "Earth Dog",
    note: "Small, determined hunting and vermin dog that followed quarry underground. An extinct historical type.",
    children: [
      { name: "Ancient Celtic earth dogs", note: "Pre-Roman low-slung hunting dogs used by Celtic tribes across northern Europe. Now extinct.", img: "/history/breeds/ancient-celtic-earth-dog.jpg", value: 55 },
      { name: "Early badger hunting dogs", note: "The long, low hunting dogs the Celts are said to have brought to Cardiganshire -- short-legged earth dogs bred to pursue badger and fox. Now extinct.", img: "/history/breeds/early-badger-hunting-dogs.jpg", value: 45 }
    ]
  },

  // Family 8, singletons (Tudor trail, 10 August). Old British bandogs roots the
  // Mastiff line in the Ancient Mastiff, the Roman-praised ancient British guard
  // dog: a functional root, not documented descent. Arctic sled dogs wires up the
  // Spitz-type dogs leaf parked in Family 3; it reaches no era card and is not
  // meant to (Nordic stock, outside the British record). Single-parent 100.
  "Old British bandogs": {
    name: "Old British bandogs",
    note: "The heavy chained dogs of old England, kept tied by day and set loose at night, and put to work by butchers and baiters alike. Now extinct.",
    // 19 August 2026: was a single 100% child (Ancient Mastiff), a pass-through
    // that filled the parent circle so the level read as Ancient Mastiff rather
    // than as itself. It was briefly given a Celtic Heeler self-repeat (a child
    // named after the parent), then removed: a node should not be its own child,
    // and that name leaked into isEcho, the pit words and the badge paths.
    //
    // Instead, a display device: TWO identical children, both "Ancient Mastiff",
    // sharing the same note and img, at 50 each, so the level shows two circles
    // rather than one filling the ring. Because the children differ in name from
    // the parent, none of the self-repeat leaks apply. This must NOT be read as
    // two separate ancestors: the node has one documented ancestor, drawn twice
    // on purpose.
    children: [
      { name: "Ancient Mastiff", note: "The ancient British guard and war dog, praised by Roman writers, that the heavy bandogs descend from. A functional root, not documented descent. An extinct historical type.", img: "/history/breeds/ancient-british-mastiff-type.jpg", value: 50 },
      { name: "Ancient Mastiff", note: "The ancient British guard and war dog, praised by Roman writers, that the heavy bandogs descend from. A functional root, not documented descent. An extinct historical type.", img: "/history/breeds/ancient-british-mastiff-type.jpg", value: 50 }
    ]
  },
  "Arctic sled dogs": {
    name: "Arctic sled dogs",
    note: "The Siberian and Alaskan sled dogs, Husky and Malamute, behind the wolfish modern recreations.",
    children: [
      { name: "Spitz-type dogs", note: "The broad northern spitz family the arctic sled dogs belong to, Nordic stock that sits outside the British Tudor record and reaches no era card.", img: "/history/breeds/Northern-Spitz-landraces.jpg", value: 100 }
    ]
  },

  // The brief's worked example (section 3): Ancient Molossers appears as a bare
  // leaf in 11 trees, so each stopped dead at its name. Giving it a real key
  // extends all 11 at once and makes the ancient-East and Alaunt lines reachable
  // from the mastiff and bulldog trees. It is ancient, deeper than the Tudor
  // boundary, so it reaches no era card and moves no count; this is honest tail,
  // not a count job. It briefly wore a Celtic-Heeler self-child; that was removed
  // on 19 August 2026 (a node should not be its own child, and it leaked into the
  // render's name paths). The level root now carries its own name on the outer
  // ring, so it returns to the single Old mastiffs of the ancient East parent.
  "Ancient Molossers": {
    name: "Ancient Molossers",
    note: "The huge eastern war and guard dogs at the root of every mastiff. Now extinct.",
    children: [
      { name: "Old mastiffs of the ancient East", note: "The huge guard and hunting mastiffs of the ancient East, carved on palace walls thousands of years ago. Now extinct.", img: "/history/breeds/old-mastiffs-of-the-ancient-east.jpg", value: 100 }
    ]
  },

  "English Mastiff": {
    name: "English Mastiff",
    note: "Britain's ancient war and guard dog, a giant Molosser prized here since Roman times.",
    children: [
      { name: "Ancient Molossers", note: "The huge eastern war and guard dogs at the root of every mastiff. Now extinct.", img: "/history/breeds/Ancient-Molossers.jpg", value: 60 },
      { name: "Old British bandogs", note: "The heavy chained dogs of old England, kept tied by day and set loose at night, and put to work by butchers and baiters alike. Now extinct.", img: "/history/breeds/Old-British-bandogs.jpg", value: 40 }
    ]
  },

  "Greyhound": {
    name: "Greyhound",
    note: "The fastest of all dogs, a sighthound that has hunted in Britain since antiquity.",
    children: [
      { name: "Celtic Hound", note: "The old running hounds the Celts brought west.", img: "/history/breeds/celtic-hound-remake.jpg", value: 60 },
      { name: "Ancient eastern sighthounds", note: "The slender desert coursing dogs of the old world. Now extinct.", img: "/history/breeds/Ancient-eastern-sighthounds.jpg", value: 40 }
    ]
  },

  "Talbot": {
    name: "Talbot",
    note: "A white medieval scent hound, slow but sure-nosed, and an ancestor of the beagle, foxhound and bloodhound.",
    children: [
      { name: "St Hubert Hound", note: "The monks' scent hound brought over by the Normans.", img: "/history/breeds/St-Hubert-Hound.jpg", value: 60 },
      {
        name: "Old scenting hounds",
        note: "The tracking hounds of medieval lords.",
        img: "/history/breeds/Old-scenting-hounds.jpg",
        // Batch 4, Celtic Heeler pattern (owner-directed): the branch's former
        // 40 splits evenly between the foundation and a same-name self-child,
        // so the ancestor renders as a small circle inside the stock rather
        // than filling it. Branch total stays 40; no displayed figure moves.
        // The self-duplicate must be kept in step with this node by hand.
        children: [
          { name: "Celtic Scent Hound", note: "Early Celtic tracking hound that followed game by scent, representing the roots of later European scent hounds. An extinct historical type.", img: "/history/breeds/ancient-celtic-scent-hound.jpg", value: 20 },
          { name: "Old scenting hounds", note: "The tracking hounds of medieval lords.", img: "/history/breeds/Old-scenting-hounds.jpg", value: 20 },
        ],
      }
    ]
  },

  "Celtic Heeler": {
    name: "Celtic Heeler",
    note: "The ancestral low-slung herding dogs brought to Wales by Celtic tribes -- forerunners of both the Cardigan and Pembroke Welsh Corgi. Short legs bred for nipping cattle heels and ducking kicks.",
    img: "/history/breeds/medieval-corgi.jpg",
    // 19 August 2026: removed the "Welsh herding dogs" sub-ring from here. That
    // edge made Celtic Heeler descend from Welsh herding dogs, which runs
    // backwards in time: Celtic Heeler is the ancestral low-slung stock the
    // Celts brought to Wales, Welsh herding dogs the later Welsh landrace. It is
    // the same class of error as the Early badger hunting dogs / Earth Dog edge
    // recorded in the BARE LEAF note below the Welsh herding dogs root. The edge
    // has been reversed: Celtic Heeler is now a child of that root instead. To
    // avoid leaving Celtic Heeler a single pass-through child, "Old hunting dogs
    // of the Celts" was promoted out of the removed ring into a direct child
    // here. Early badger 60, Old hunting dogs 40. The ring carries no value of
    // its own, so Early badger's 60 is written as two even children of 30
    // (30 + 30 = 60), and 60 + 40 = 100.
    children: [
      {
        name: "Early badger hunting dogs",
        note: "The long, low hunting dogs the Celts are said to have brought to Cardiganshire -- short-legged earth dogs bred to pursue badger and fox. Now extinct.",
        img: "/history/breeds/early-badger-hunting-dogs.jpg",
        // No value of its own. A parent's share is the sum of its children, and
        // d3 adds an owned value ON TOP of them, so carrying both would count
        // this line twice. The two 30s below are Early badger's 60 share written
        // as two even children; the self-duplicate keeps the ancestor in step.
        children: [
          { name: "Ancient Celtic earth dogs", note: "Pre-Roman low-slung hunting dogs used by Celtic tribes across northern Europe. Now extinct.", img: "/history/breeds/ancient-celtic-earth-dog.jpg", value: 30 },
          { name: "Early badger hunting dogs", note: "The long, low hunting dogs the Celts are said to have brought to Cardiganshire -- short-legged earth dogs bred to pursue badger and fox. Now extinct.", img: "/history/breeds/early-badger-hunting-dogs.jpg", value: 30 },
        ],
      },
      { name: "Old hunting dogs of the Celts", note: "The native running dogs of Iron Age Europe. Now extinct.", img: "/history/breeds/Old-hunting-dogs-of-the-Celts.jpg", value: 40 },
    ],
  },

  "Cardigan Welsh Corgi": {
    name: "Cardigan Welsh Corgi",
    note: "The older of the two corgis, an ancient Welsh cattle dog with a long body and a long tail.",
    children: [
      { name: "Early badger hunting dogs", note: "The long, low hunting dogs the Celts are said to have brought to Cardiganshire -- short-legged earth dogs bred to pursue badger and fox. Now extinct.", img: "/history/breeds/early-badger-hunting-dogs.jpg", value: 55 },
      { name: "Welsh herding dogs", note: "The old Welsh herding and droving dogs, a long-legged, loose-eyed landrace and the parallel Welsh branch behind the region's sheep-working breeds. Now extinct.", img: "/history/breeds/Welsh-herding-dogs-cluster.jpg", value: 45 }
    ]
  },

  "Bloodhound": {
    name: "Bloodhound",
    note: "The supreme tracking hound, descended from the St Hubert Hound bred by monks in the Ardennes.",
    children: [
      { name: "St Hubert Hound", note: "The abbey scent hound it descends from almost unchanged.", img: "/history/breeds/St-Hubert-Hound.jpg", value: 60 },
      { name: "Old scenting hounds", note: "The heavy continental tracking hounds of the same line.", img: "/history/breeds/Old-scenting-hounds.jpg", value: 40 }
    ]
  },

  "Scottish Deerhound": {
    name: "Scottish Deerhound",
    note: "A tall, rough-coated sighthound bred to course red deer across the Highlands, close kin to the Irish Wolfhound.",
    children: [
      { name: "Celtic Hound", note: "The ancient sighthound stock of the north.", img: "/history/breeds/celtic-hound-remake.jpg", value: 60 },
      // 18 August 2026: swapped off the Irish Wolfhound photo. The Wolfhound is
      // a living breed and, per the Deerhound's own note, its close kin rather
      // than its ancestor, so this extinct node now carries its own artwork.
      { name: "Rough northern sighthounds", note: "Shaggy-coated coursing dogs built for cold, rough ground. Now extinct.", img: "/history/breeds/rough-northern-sighthounds.jpg", value: 40 }
    ]
  },

  "Celtic Hound": {
    name: "Celtic Hound",
    note: "An ancient running hound of the Celts, the deep root behind the Greyhound, Wolfhound and Deerhound.",
    children: [
      { name: "Ancient eastern sighthounds", note: "The slender coursing dogs of Egypt and the Near East. Now extinct.", img: "/history/breeds/Ancient-eastern-sighthounds.jpg", value: 55 },
      { name: "Old hunting dogs of the Celts", note: "The native running dogs of Iron Age Europe. Now extinct.", img: "/history/breeds/Old-hunting-dogs-of-the-Celts.jpg", value: 45 }
    ]
  },

  "Rache": {
    name: "Rache",
    note: "A medieval hound that hunted by scent in a pack, as opposed to the sight-hunting gazehound.",
    children: [
      { name: "St Hubert Hound", note: "The monks' scent hound the Normans brought over, one strain behind the running pack.", img: "/history/breeds/St-Hubert-Hound.jpg", value: 30 },
      { name: "Talbot", note: "The older white finding-hound stock, the other strain in that pack. A modelled half of the pair, not a recorded mating.", img: "/history/breeds/talbot-hound.jpg", value: 30 },
      {
        name: "Old scenting hounds",
        note: "The native pack hounds of medieval Britain.",
        img: "/history/breeds/Old-scenting-hounds.jpg",
        // Batch 4, Celtic Heeler pattern: even split of the former 40 between
        // the foundation and the same-name self-child. See the Talbot tree
        // for the same pattern; keep the self-duplicate in step by hand.
        children: [
          { name: "Celtic Scent Hound", note: "Early Celtic tracking hound that followed game by scent, representing the roots of later European scent hounds. An extinct historical type.", img: "/history/breeds/ancient-celtic-scent-hound.jpg", value: 20 },
          { name: "Old scenting hounds", note: "The native pack hounds of medieval Britain.", img: "/history/breeds/Old-scenting-hounds.jpg", value: 20 },
        ],
      }
    ]
  },

  "Buckhound": {
    name: "Buckhound",
    note: "A medieval scenting hound kept to hunt buck and fallow deer, sitting between the staghound and the harrier.",
    children: [
      { name: "Old scenting hounds", note: "The deer-hunting pack hounds of the royal forests.", img: "/history/breeds/Old-scenting-hounds.jpg", value: 60 },
      { name: "Talbot", note: "The white medieval hound in its background.", img: "/history/breeds/talbot-hound.jpg", value: 40 }
    ]
  },

  "Southern Hound": {
    name: "Southern Hound",
    note: "A heavy, slow, deep-voiced scent hound of southern England, ancestor of the foxhound, beagle and harrier.",
    children: [
      { name: "Talbot", note: "The white Norman hound at its root.", img: "/history/breeds/talbot-hound.jpg", value: 60 },
      { name: "St Hubert Hound", note: "The abbey scent hounds brought across the Channel.", img: "/history/breeds/St-Hubert-Hound.jpg", value: 40 }
    ]
  },

  // 19 August 2026: period sources treat mastive, bandogge and alaunt as one animal under three names. Caius in 1576 describes the mastive or bandogge as a single type used to bait bulls, and the name Mastiff was applied indiscriminately to all large dogs, so the English Mastiff is a later divergence from the same stock rather than a parent of the bull-baiting dog. The Mastiff child is therefore removed.
  "Old English Bulldog": {
    name: "Old English Bulldog",
    note: "The extinct, athletic bull-baiting dog, leaner and fiercer than today's Bulldog, bred down from ancient war dogs.",
    children: [
      { name: "Old British bandogs", note: "The heavy chained dogs of old England, kept tied by day and set loose at night, and put to work by butchers and baiters alike. Now extinct.", img: "/history/breeds/Old-British-bandogs.jpg", value: 60 },
      { name: "Alaunt war dogs", note: "The extinct Alaunt catch dogs crossed in alongside them. A modelled half of the pair, not a recorded mating. Now extinct.", img: "/history/breeds/alunt-war-dogs.jpg", value: 40 }
    ]
  },

  "English Foxhound": {
    name: "English Foxhound",
    note: "The classic pack hound of the hunt, bred for stamina, voice and a relentless nose over a long day's chase.",
    children: [
      { name: "Southern Hound", note: "The deep-nosed scent hound at its foundation.", img: "/history/breeds/Southern-Hound.jpg", value: 50 },
      { name: "Greyhound", note: "Added for speed and a cleaner, racier build.", img: "/history/breeds/original-greyhound.jpg", value: 30 },
      { name: "Talbot", note: "The old white hound in the deeper background.", img: "/history/breeds/talbot-hound.jpg", value: 20 }
    ]
  },

  "Otterhound": {
    name: "Otterhound",
    note: "A big, rough-coated, web-footed scent hound bred to hunt otter in cold rivers, with a magnificent nose.",
    children: [
      { name: "Bloodhound", note: "Tracking power and a tremendous nose.", img: "/history/breeds/Medieval-Bloodhound.jpg", value: 45 },
      { name: "Southern Hound", note: "Old deep-voiced scent-hound stock.", img: "/history/breeds/Southern-Hound.jpg", value: 30 },
      { name: "Rough water dogs", note: "Shaggy, water-loving dogs for the wet work. Now extinct.", img: "/history/breeds/rough-water-dogs.jpg", value: 25 }
    ]
  },

  "Turnspit Dog": {
    name: "Turnspit Dog",
    note: "An extinct, short-legged kitchen dog bred to trot inside a wheel and turn the roasting spit over the fire.",
    children: [
      { name: "Old short-legged working dogs", note: "The low, long dwarf working type behind it. Now extinct.", img: "/history/breeds/Old-short-legged-working-dogs.jpg", value: 60 },
      { name: "Farm and kitchen curs", note: "The everyday kitchen curs and household mongrels it was bred down from. Now extinct.", img: "/history/breeds/Farm-and-kitchen-curs.jpg", value: 40 }
    ]
  },

  "Staghound": {
    name: "Staghound",
    note: "A large hound kept to hunt red deer, built up from the old scenting hounds and later from the foxhound packs.",
    children: [
      { name: "Southern Hound", note: "The heavy deer-hunting scent hound at its base.", img: "/history/breeds/Southern-Hound.jpg", value: 45 },
      { name: "English Foxhound", note: "Pack-hound blood for pace and a long day's work.", img: "/history/breeds/english-foxhound.jpg", value: 35 },
      { name: "Buckhound", note: "The royal deer hound in its background.", img: "/history/breeds/Buckhound-illustration.jpg", value: 20 }
    ]
  },

  "Beagle": {
    name: "Beagle",
    note: "A small, merry pack hound bred to hunt hare on foot, with a big voice and a busy nose.",
    children: [
      { name: "Talbot", note: "The white Norman hound at the root of the running packs.", img: "/history/breeds/talbot-hound.jpg", value: 40 },
      { name: "Southern Hound", note: "Deep-nosed scent-hound blood.", img: "/history/breeds/Southern-Hound.jpg", value: 35 },
      { name: "Greyhound", note: "A little sighthound for speed and a tidy build.", img: "/history/breeds/original-greyhound.jpg", value: 25 }
    ]
  },

  "Bearded Collie": {
    name: "Bearded Collie",
    note: "A shaggy, bouncy Scottish herding dog, also called the Highland Collie, built for driving sheep and cattle over the hills.",
    children: [
      // Re-keyed 18 August 2026. The old node named the Polish Lowland Sheepdog,
      // which is not extinct, on a conjectural arrival story, and carried an Old
      // English Sheepdog photo. The Old Welsh Grey is a documented extinct Welsh
      // type widely held to be a Bearded Collie ancestor.
      { name: "Old Welsh Grey Sheepdog", note: "A shaggy grey Welsh hill sheepdog, worked loose-eyed and noisy like the Beardie itself. Now extinct.", img: "/history/breeds/old-welsh-grey-sheepdog.jpg", value: 50 },
      { name: "Old working collies", note: "The old northern hill-collie landrace of Scotland and the borders, the shared working stock the Rough, Smooth and Border collies all grew from. Now extinct.", img: "/history/breeds/Old-working-collies-cluster.jpg", value: 50 }
    ]
  },

  "Old English Sheepdog": {
    name: "Old English Sheepdog",
    note: "A big, shaggy, bobtailed drover's dog of the west country, bred to drive sheep and cattle to market.",
    children: [
      { name: "Bearded Collie", note: "The shaggy Scottish herder in its make-up.", img: "/history/breeds/bearded-collie-photo.jpg", value: 55 },
      { name: "Welsh herding dogs", note: "The old Welsh herding and droving dogs, a long-legged, loose-eyed landrace and the parallel Welsh branch behind the region's sheep-working breeds. Now extinct.", img: "/history/breeds/Welsh-herding-dogs-cluster.jpg", value: 45 }
    ]
  },

  // Family 7, toy spaniels and lapdogs (Tudor trail, 10 August). The court toy
  // spaniels are miniaturised sporting spaniels, so they join the land-spaniel
  // line and reach Tudor at the Rache (Family 1's terminal). Not a three-roots
  // breach: those were land vs water spaniels vs water dogs, and these are land.
  // Asian flat-faced toys carries the real oriental blood to the Chinese court
  // lapdogs; it reaches no era card and is not meant to. Mediterranean bichon
  // lapdogs is left a bare leaf for the same reason as Spitz-type dogs: no card
  // to reach, and rooting it in the Barbet line would be a false water-dog claim.
  "Old toy spaniels": {
    name: "Old toy spaniels",
    note: "The small sporting and lap spaniels of Tudor and Stuart England. Now extinct.",
    children: [
      { name: "Land spaniels", note: "The old sporting land-spaniel stock the court toy spaniels were bred down from. Now extinct.", img: "/history/breeds/original-land-spaniel.jpg", value: 100 }
    ]
  },
  "Old sporting toy spaniels": {
    name: "Old sporting toy spaniels",
    note: "The longer-muzzled toy spaniels of the older paintings. Now extinct.",
    children: [
      { name: "Land spaniels", note: "The old sporting land-spaniel stock behind the toy spaniels. Now extinct.", img: "/history/breeds/original-land-spaniel.jpg", value: 100 }
    ]
  },
  "Asian flat-faced toys": {
    name: "Asian flat-faced toys",
    note: "The oriental toy blood, pug and eastern lapdog, that shortened the toy spaniel's muzzle. Now extinct.",
    children: [
      { name: "Ancient Chinese toy dogs", note: "The old Chinese flat-faced lapdogs kept in the imperial court alongside the Pekingese and lion dogs. Now extinct.", img: "/history/breeds/Ancient-Chinese-toy-dogs.jpg", value: 100 }
    ]
  },

  "King Charles Spaniel": {
    name: "King Charles Spaniel",
    note: "The flat-faced toy spaniel of the Stuart court, a lapdog favourite long before its longer-nosed Cavalier cousin.",
    children: [
      { name: "Old toy spaniels", note: "The small sporting and lap spaniels of Tudor and Stuart England. Now extinct.", img: "/history/breeds/Old-sporting-toy-spaniels.jpg", value: 60 },
      { name: "Asian flat-faced toys", note: "Pug and oriental toy blood that shortened the muzzle. Now extinct.", img: "/history/breeds/Asian-flat-faced-toys.jpg", value: 40 }
    ]
  },

  "Pointer": {
    name: "Pointer",
    note: "A lean, fast bird dog that freezes on point to mark hidden game, refined in England from the heavy old Spanish Pointer.",
    children: [
      { name: "English Foxhound", note: "Stamina, drive and a steady temperament.", img: "/history/breeds/english-foxhound.jpg", value: 30 },
      { name: "Greyhound", note: "Speed and a racy, galloping build.", img: "/history/breeds/original-greyhound.jpg", value: 25 },
      { name: "Bloodhound", note: "A deeper nose for finding game.", img: "/history/breeds/Medieval-Bloodhound.jpg", value: 25 },
      { name: "Setter", note: "Setting-dog blood for style and steadiness. Now in-decline.", img: "/history/breeds/british-setters.jpg", value: 20 }
    ]
  },

  "English Setter": {
    name: "English Setter",
    note: "An elegant, feathered bird dog that 'sets', crouching low when it scents game, built up from the old setting spaniels.",
    children: [
      { name: "Old setting spaniels", note: "The crouching land spaniels that marked game for the net. Now extinct.", img: "/history/breeds/old-setting-spaniels.jpg", value: 50 },
      { name: "Pointer", note: "Spanish pointer blood for nose and a firm point.", img: "/history/breeds/british-pointers.jpg", value: 30 },
      { name: "Water spaniels", note: "A little water-spaniel for coat and biddability. Now extinct.", img: "/history/breeds/original-water-spaniel.jpg", value: 20 }
    ]
  },

  // Family 1, land and working spaniels (Tudor trail, 10 August). Caius in
  // 1576 listed the Land spaniel and the Water spaniel as fowling dogs, a
  // category he kept SEPARATE from the hounds, so the hound roots below are a
  // functional reconstruction of the deeper stock, not documented descent.
  // Ranging bird-dog work routes to the Rache (the running scenting hound);
  // the heavy, low spaniels route to the heavy trailing hounds. Both are
  // medieval cards, so either satisfies the era rule.
  "Land spaniels": {
    name: "Land spaniels",
    note: "The old English land-spaniel stock that every working spaniel springs from. Now extinct.",
    children: [
      { name: "Rache", note: "The medieval running scenting hound that ranged and flushed game, the closest in work to a bird dog. Caius listed the land spaniel among the fowling dogs, separate from the hounds, so this older root is a reconstruction, not recorded descent. Now extinct.", img: "/history/breeds/rache.jpg", value: 60 },
      { name: "Talbot", note: "Older white finding-hound stock standing behind the medieval scenting hounds. An inferred deeper root, not documented spaniel descent. Now extinct.", img: "/history/breeds/talbot-hound.jpg", value: 40 }
    ]
  },
  "Old Welsh land spaniels": {
    name: "Old Welsh land spaniels",
    note: "The native red-and-white working spaniels of Wales. Now extinct.",
    children: [
      { name: "Land spaniels", note: "The broader old English land-spaniel stock behind the Welsh variety. Now extinct.", img: "/history/breeds/original-land-spaniel.jpg", value: 60 },
      { name: "Rache", note: "The medieval ranging scenting hound, an inferred deeper root rather than documented descent. Now extinct.", img: "/history/breeds/rache.jpg", value: 40 }
    ]
  },
  "Heavier working spaniels": {
    name: "Heavier working spaniels",
    note: "Lower, stouter spaniels that gave the Sussex and Clumber their weight and bone. Now extinct.",
    children: [
      { name: "Land spaniels", note: "The old land-spaniel stock at the base. Now extinct.", img: "/history/breeds/original-land-spaniel.jpg", value: 55 },
      // 19 August 2026: this extinct ancestor was wearing a photograph of a living descendant, the Bloodhound. Repointed to its own artwork.
      { name: "Basset and heavy hounds", note: "Low, long, heavy hound blood for build and weight. Now extinct.", img: "/history/breeds/basset-and-heavy-hounds.jpg", value: 45 }
    ]
  },
  "Basset and heavy hounds": {
    name: "Basset and heavy hounds",
    note: "Low, long, heavy scenting-hound stock that lent weight and bone to the stouter spaniels. Now extinct.",
    children: [
      { name: "Southern Hound", note: "The heavy, slow, deep-voiced trailing hound, the right match for the stout, low spaniels. Now extinct.", img: "/history/breeds/Southern-Hound.jpg", value: 60 },
      { name: "Bloodhound", note: "The supreme heavy trailing hound of the same deep-nosed line, still bred today.", img: "/history/breeds/Medieval-Bloodhound.jpg", value: 40 }
    ]
  },

  "Clumber Spaniel": {
    name: "Clumber Spaniel",
    note: "The heaviest, slowest spaniel of all, a stocky white gundog built to push through thick cover, developed at Clumber Park.",
    children: [
      { name: "Land spaniels", note: "The heavy Alpine and old land spaniels at its base. Now extinct.", img: "/history/breeds/original-land-spaniel.jpg", value: 55 },
      { name: "Basset and heavy hounds", note: "Low, long hound blood, by tradition Basset Hound, for its build and weight. Now in-decline.", img: "/history/breeds/basset-and-heavy-hounds.jpg", value: 45 }
    ]
  },

  "Cur": {
    name: "Cur",
    note: "Not a breed but a type: the everyday working mongrel of the old farm, used for droving cattle and general work.",
    children: [
      {
        name: "Old working collies",
        note: "The old northern hill-collie landrace of Scotland and the borders, the shared working stock the Rough, Smooth and Border collies all grew from. Now extinct.",
        img: "/history/breeds/Old-working-collies-cluster.jpg",
        // Batch 4, Celtic Heeler pattern at both depths (owner-directed): each
        // generation splits evenly between the older type and a same-name
        // self-child, so each ancestor is a small circle inside its stock.
        // The whole Cur tree is scaled by four (bandogs 45 -> 180) purely to
        // keep the two halvings in whole numbers: every ratio, and so every
        // displayed percentage, is unchanged. Branch shares: collies 55,
        // Drover's 28, Livestock 14. Keep the self-duplicates in step by hand.
        children: [
          {
            name: "Drover's Dog",
            note: "Tough working dog that helped move cattle and sheep over long distances to markets and towns. An extinct historical type.",
            img: "/history/breeds/medieval-drover-dog.jpg",
            children: [
              { name: "Livestock Dog", note: "Broad early working-dog population used to guard, move and control livestock before named British breeds existed. An extinct historical type.", img: "/history/breeds/ancient-livestock-dog.jpg", value: 55 },
              { name: "Drover's Dog", note: "Tough working dog that helped move cattle and sheep over long distances to markets and towns. An extinct historical type.", img: "/history/breeds/medieval-drover-dog.jpg", value: 55 },
            ],
          },
          { name: "Old working collies", note: "The old northern hill-collie landrace of Scotland and the borders, the shared working stock the Rough, Smooth and Border collies all grew from. Now extinct.", img: "/history/breeds/Old-working-collies-cluster.jpg", value: 110 },
        ],
      },
      // Owner decision, option B (3 August): the bandog branch is replaced by
      // heeler stock at the same weight (180 = the scaled 45), since heelers
      // are documented as cur-type drovers' dogs. No foundation grafts inside
      // it, so it takes the full branch value and the split rule does not
      // apply.
      { name: "Old heeler stock", note: "Low, hard-bitten cattle dogs that drove stock by nipping at the heels and ducking the kick. Now extinct as a type.", img: "/history/breeds/old-heeler-stock.jpg", value: 180 }
    ]
  },

  "North Country Beagle": {
    name: "North Country Beagle",
    note: "An extinct, faster, sharper-nosed beagle of northern England, eventually folded into the modern Beagle.",
    children: [
      { name: "Southern Hound", note: "The deep-nosed southern hare-hound stock at its core.", img: "/history/breeds/Southern-Hound.jpg", value: 60 },
      { name: "Talbot", note: "The white Norman hound in the background.", img: "/history/breeds/talbot-hound.jpg", value: 40 }
    ]
  },

  "Old Welsh Grey Sheepdog": {
    name: "Old Welsh Grey Sheepdog",
    note: "An old shaggy grey herding dog of the Welsh hills, a hardy native worker now largely lost. Now extinct.",
    children: [
      {
        name: "Welsh herding dogs",
        note: "The old Welsh herding and droving dogs, a long-legged, loose-eyed landrace and the parallel Welsh branch behind the region's sheep-working breeds. Now extinct.",
        img: "/history/breeds/Welsh-herding-dogs-cluster.jpg",
        // Batch 5, Celtic Heeler pattern, split rule: Shepherd's Dog
        // assessed plausible (AElfric documents the shepherd's dog directly),
        // so it takes half the former 60. Keep the self-duplicate in step.
        children: [
          { name: "Shepherd's Dog", note: "Practical medieval working dog used to move and protect sheep, forming an early root of Britain's collie families. An extinct historical type.", img: "/history/breeds/medieval-shepherds-dog.jpg", value: 30 },
          { name: "Welsh herding dogs", note: "The old Welsh herding and droving dogs, a long-legged, loose-eyed landrace and the parallel Welsh branch behind the region's sheep-working breeds. Now extinct.", img: "/history/breeds/Welsh-herding-dogs-cluster.jpg", value: 30 },
        ],
      },
      {
        name: "Shaggy upland herders",
        note: "Rough-coated hill dogs of the same old type. Now extinct.",
        img: "/history/breeds/Old-working-collies-cluster.jpg",
        // Same pattern and assessment: half of the former 40.
        children: [
          { name: "Shepherd's Dog", note: "Practical medieval working dog used to move and protect sheep, forming an early root of Britain's collie families. An extinct historical type.", img: "/history/breeds/medieval-shepherds-dog.jpg", value: 20 },
          { name: "Shaggy upland herders", note: "Rough-coated hill dogs of the same old type. Now extinct.", img: "/history/breeds/Old-working-collies-cluster.jpg", value: 20 },
        ],
      }
    ]
  },

  "Maltese": {
    name: "Maltese",
    note: "An ancient white lapdog of the Mediterranean, a favourite of Roman ladies and prized for over two thousand years.",
    children: [
      { name: "Ancient Spitz-type dogs", note: "The small spitz-type dogs many historians see as its oldest ancestors, bred down in size over centuries. Now extinct.", img: "/history/breeds/late-early-spitz-northern-proto-spitz.jpg",  value: 55 },
      { name: "Mediterranean bichon lapdogs", note: "The old white bichon-family lapdogs spread around the Mediterranean by ancient traders. Now extinct.", img: "/history/breeds/Mediterranean-bichon-lapdogs.jpg", value: 45 }
    ]
  },

  "Bichon Frise": {
    name: "Bichon Frise",
    note: "A fluffy white charmer of the Mediterranean bichon family, carried between ports by sailors and later a favourite in the French court.",
    children: [
      { name: "Barbet water dogs", note: "The curly Barbet, the water dog the little 'barbichon' dogs were bred down from. Now extinct.", img: "/history/breeds/Barbet-water-dogs.jpg", value: 50 },
      { name: "Mediterranean bichon lapdogs", note: "The old white lapdogs of Malta, Bologna and Tenerife that make up the bichon family. Now extinct.", img: "/history/breeds/Mediterranean-bichon-lapdogs.jpg", value: 50 }
    ]
  },

  // Family 5, water dogs (Tudor trail, 10 August). Old European water dogs is the
  // shared continental water-dog root (both the Barbet/poodle line and the St
  // John's line come off it) and it reaches Tudor at the Otterhound.
  // CONVERGENCE, DELIBERATE: water spaniels (Family 4) and water dogs both reach
  // Otterhound. This is NOT a merge of the roots, which stay distinct populations
  // (Old European water dogs is not Water spaniels); it is the limit of the data,
  // there being only one water card. A defensible functional route beats leaving
  // Labrador's principal 55% St John's line dead-ended while it passes on a 13%
  // branch (the opposite of the Northern Inuit call, where the ancestry had no
  // British or water link at all). The combined-node split job, when it runs,
  // attaches its Barbet-type / Poodle-type outputs onto THIS terminal; it does
  // not need rewriting.
  "Old European water dogs": {
    name: "Old European water dogs",
    note: "The rough water-retrieving dogs of Germany and France that fetched waterfowl for hunters. Now extinct.",
    children: [
      { name: "Otterhound", note: "The web-footed water-working hound, the Tudor root shared with the water spaniels: one water card for both water lines. A functional match, not documented descent. Now endangered.", img: "/history/breeds/otterhound-photo.jpg", value: 100 }
    ]
  },
  "Fishermen's water dogs": {
    name: "Fishermen's water dogs",
    note: "The working water dogs the European fishing crews brought across the Atlantic. Now extinct.",
    children: [
      { name: "Old European water dogs", note: "The old continental water-dog stock they came from. Now extinct.", img: "/history/breeds/Old-European-water-dogs.jpg", value: 100 }
    ]
  },
  "St John's Water Dog": {
    name: "St John's Water Dog",
    note: "The fishermen's water dog of Newfoundland, brought to Britain and bred up from there. Now extinct.",
    children: [
      { name: "Fishermen's water dogs", note: "The working water dogs the European fishing crews brought across the Atlantic. Now extinct.", img: "/history/breeds/Fishermens-water-dogs.jpg", value: 34 },
      { name: "Newfoundland landrace dogs", note: "The local island dogs they crossed with once they landed. Now extinct.", img: "/history/breeds/Newfoundland-landrace-dog.jpg", value: 21 }
    ]
  },

  "Poodle": {
    name: "Poodle",
    note: "Now a clever companion and show dog, but built as a water-retrieving gundog. The name comes from the German 'Pudel', meaning to splash about.",
    children: [
      { name: "Old European water dogs", note: "The rough water-retrieving dogs of Germany and France that fetched waterfowl for hunters. Now extinct.", img: "/history/breeds/Old-European-water-dogs.jpg", value: 55 },
      { name: "Barbet-type water dogs", note: "The curly-coated continental Barbet, an old European water dog and the root of the poodle line. A modelled half of the pair, not a recorded mating. Now extinct.", img: "/history/breeds/barbet.jpg", value: 22.5 },
      { name: "Water spaniels", note: "The British working water-spaniel branch crossed in alongside them, listed separately from the water dogs by Caius in 1576. Now extinct.", img: "/history/breeds/original-water-spaniel.jpg", value: 22.5 }
    ]
  },

  "Pug": {
    name: "Pug",
    note: "A comical, flat-faced toy from ancient China, bred as a companion for emperors before Dutch traders carried it to Europe.",
    children: [
      { name: "Ancient Chinese toy dogs", note: "The old Chinese flat-faced lapdogs kept in the imperial court alongside the Pekingese and lion dogs. Now extinct.", img: "/history/breeds/Ancient-Chinese-toy-dogs.jpg", value: 60 },
      { name: "Eastern lion and lap dogs", note: "The wider family of small eastern companion dogs it shares its roots with. Now extinct.", img: "/history/breeds/Tibetan-temple-dogs.jpg", value: 40 }
    ]
  },
  "Great Dane": {
    name: "Great Dane",
    note: "Germany's giant boarhound, the Deutsche Dogge, built by crossing heavy war mastiffs with tall, fast coursing hounds.",
    children: [
      { name: "Mastiff", note: "The heavy Molosser war and hunting dogs that gave it bulk and bone.", img: "/history/breeds/medieval-british-mastiff.jpg", value: 25 },
      { name: "Alaunt war dogs", note: "The fierce Alaunt catch dogs that gave it a fearless front. A modelled half of the pair, not a recorded mating. Now extinct.", img: "/history/breeds/alunt-war-dogs.jpg", value: 25 },
      { name: "Irish Wolfhound", note: "Tall coursing hounds crossed in for height, reach and the speed to pull down boar.", img: "/history/breeds/irish-wolfhound-photo.jpg", value: 30 },
      { name: "Old German boarhounds", note: "The regional hunting packs that did the real boar work before the breed was fixed. Now extinct.", img: "/history/breeds/Old-German-boarhounds.jpg", value: 20 }
    ]
  },
  "Saint Bernard": {
    name: "Saint Bernard",
    note: "The Alpine rescue dog of the Great St Bernard hospice, grown from Roman farm mastiffs and later thickened with Newfoundland blood.",
    children: [
      { name: "Alpine mastiff farm dogs", note: "The heavy Roman descended valley dogs, the Sennenhund stock, kept for farm and guard work.", img: "/history/breeds/Alpine-mastiff-farm-dogs.jpg", value: 55 },
      { name: "Newfoundland landrace dogs", note: "Crossed in during the 1800s after hard winters thinned the hospice line, adding size and coat. Now extinct.", img: "/history/breeds/Newfoundland-landrace-dog.jpg", value: 25 },
      { name: "Ancient Molossers", note: "The old war dog root every European mastiff traces back to. Now extinct.", img: "/history/breeds/Ancient-Molossers.jpg", value: 20 }
    ]
  },
  "Afghan Hound": {
    name: "Afghan Hound",
    note: "An ancient sighthound from the mountains of Afghanistan, coated long against the cold, one of the oldest coursing lines there is.",
    children: [
      { name: "Ancient eastern sighthounds", note: "The slender desert coursing dogs of the old Silk Road, its deepest root. Now extinct.", img: "/history/breeds/Ancient-eastern-sighthounds.jpg", value: 65 },
      { name: "Mountain coursing hounds", note: "The high altitude hunting dogs that gave it the heavy coat and big feet for rough ground. Now extinct.", img: "/history/breeds/Mountain-coursing-hounds.jpg", value: 35 }
    ]
  },
  "Weimaraner": {
    name: "Weimaraner",
    note: "The grey ghost, a noble gun dog from the Weimar court of Germany, built on old scent trailing and pointing stock.",
    children: [
      { name: "Bloodhound", note: "The heavy German scent trailing hounds, the leithund, behind its nose and tracking drive.", img: "/history/breeds/Medieval-Bloodhound.jpg", value: 40 },
      { name: "Pointer", note: "Continental pointing dogs crossed in for the upright, birdy hunting style.", img: "/history/breeds/british-pointers.jpg", value: 40 },
      { name: "Old German hunting dogs", note: "The all round hunters of the Weimar estates that the courtiers refined into one type. Now extinct.", img: "/history/breeds/German-bracke-scenthounds Old German hunting dogs.jpg", value: 20 }
    ]
  },
  "Dalmatian": {
    name: "Dalmatian",
    note: "The spotted coach dog, named for Dalmatia on the Adriatic coast, bred to trot for miles beside a carriage.",
    children: [
      { name: "Ancient spotted hounds", note: "The old spotted hunting dogs pictured across Europe and the Mediterranean for centuries.", img: "/history/breeds/Ancient-spotted-hounds.jpg", value: 55 },
      { name: "Pointer", note: "Pointing and hound blood that shaped its build and steady working head.", img: "/history/breeds/british-pointers.jpg", value: 30 },
      { name: "Carriage guard dogs", note: "The road dogs kept to run with the horses and mind the coach, the job it was made for. Now extinct.", img: "/history/breeds/Carriage-guard-dogs-Stallpinscher-escorts.jpg", value: 15 }
    ]
  },
  "Rottweiler": {
    name: "Rottweiler",
    note: "The butcher's dog of Rottweil, descended from the drover mastiffs the Roman legions marched over the Alps.",
    children: [
      { name: "Ancient Molossers", note: "The Roman drover and war mastiffs left in the region, the breed's deepest root. Now extinct.", img: "/history/breeds/Ancient-Molossers.jpg", value: 60 },
      { name: "Local German cattle dogs", note: "The herding farm dogs of the Wurttemberg valleys it was crossed with to make a steady drover. Now extinct.", img: "/history/breeds/Local-German-cattle-dogs.jpg", value: 40 }
    ]
  },
  "Basset Hound": {
    name: "Basset Hound",
    note: "A low set French scenthound bred short in the leg on purpose, so hunters could keep up with it on foot.",
    children: [
      { name: "Bloodhound", note: "The St Hubert scent trailing line behind its nose, long ears and deep voice.", img: "/history/breeds/modern-bloodhound.jpg", value: 55 },
      { name: "Basset Artesien Normand", note: "The French basset breed behind it, later crossed with Bloodhound to make the heavier English Basset. Now endangered.", img: "/history/breeds/Basset-Artesien-Normand.jpg", value: 45 }
    ]
  },
  "Italian Greyhound": {
    name: "Italian Greyhound",
    note: "A sighthound shrunk to a lapdog in ancient Italy, all the speed in miniature, kept for warmth and company.",
    children: [
      { name: "Ancient eastern sighthounds", note: "The desert coursing hounds of Egypt and the Near East, the Saluki-like deep root found mummified in the pharaohs' tombs. Now extinct.", img: "/history/breeds/Ancient-eastern-sighthounds.jpg", value: 55 },
      { name: "Mediterranean miniature sighthounds", note: "The small coursing dogs bred down as companions across Greece, Rome and Renaissance Italy. Now extinct.", img: "/history/breeds/Mediterranean-miniature-sighthounds.jpg", value: 45 }
    ]
  },
  "Papillon": {
    name: "Papillon",
    note: "The butterfly dog, a tiny continental spaniel with winged ears, a fixture of European courts for 700 years.",
    children: [
      { name: "Continental toy spaniels", note: "The dwarf spaniels of France, Spain and Italy painted on noble laps through the Renaissance. Now extinct.", img: "/history/breeds/Continental-toy-spaniels.jpg", value: 70 },
      { name: "Old European lapdogs", note: "The wider family of small companion dogs that fed into Europe's toy breeds. Now extinct.", img: "/history/breeds/Old-European-lapdogs.jpg", value: 30 }
    ]
  },
  "Siberian Husky": {
    name: "Siberian Husky",
    note: "The sled dog of the Chukchi people of north east Siberia, bred to pull light loads vast distances in brutal cold.",
    children: [
      { name: "Chukchi sled dogs", note: "The endurance team dogs of the Siberian Arctic, the breed almost unchanged from them. Now extinct.", img: "/history/breeds/Chukchi-sled-dogs.jpg", value: 75 },
      { name: "Ancient Arctic spitz", note: "The wider northern spitz family behind the pricked ears, curled tail and dense double coat. Now extinct.", img: "/history/breeds/Ancient-Arctic-dog-ancestry-Deep-northern-eastern-Eurasian-dog.jpg", value: 25 }
    ]
  },
  "Shih Tzu": {
    name: "Shih Tzu",
    note: "The lion dog of the Chinese imperial court, made by crossing Tibetan holy dogs with the palace's own toys.",
    children: [
      { name: "Tibetan temple dogs", note: "The small long coated holy dogs of Tibet, the Lhasa line, gifted to the Chinese court. Now extinct.", img: "/history/breeds/Tibetan-temple-dogs.jpg", value: 55 },
      { name: "Ancient Chinese toy dogs", note: "The old Chinese flat-faced lapdogs kept in the imperial court alongside the Pekingese and lion dogs. Now extinct.", img: "/history/breeds/Ancient-Chinese-toy-dogs.jpg", value: 45 }
    ]
  },
  "Miniature Schnauzer": {
    name: "Miniature Schnauzer",
    note: "A small German farm ratter, the standard schnauzer shrunk with toy blood into a sharp little vermin dog.",
    children: [
      { name: "Standard Schnauzer farm dogs", note: "The wiry German yard and stable dogs it was bred down from.", img: "/history/breeds/Schnauzer-type-farm-dogs-Stallpinscher-stock.jpg", value: 60 },
      { name: "Affenpinscher", note: "A rough little German monkey faced ratter crossed in to take the size down. Now endangered.", img: "/history/breeds/Affenpinscher-type-small-rough-ratters.jpg", value: 25 },
      { name: "Poodle", note: "A touch of poodle thought to be added for coat and a clever, obedient temperament.", img: "/history/breeds/Poodle-and-Barbet-water-dogs.jpg", value: 15 }
    ]
  },
  "Pomeranian": {
    name: "Pomeranian",
    note: "A spitz shrunk to a toy in the Pomerania region, descended from big Arctic sled and herding dogs.",
    children: [
      { name: "Arctic sled spitz", note: "The large Nordic sled, hunting and herding spitz of Iceland and Lapland, the breed's deep northern root.", img: "/history/breeds/Ancient-Arctic-spitz.jpg", value: 55 },
      { name: "German farm spitz", note: "The Wolfspitz and mid-size German Spitz guard strains of the Pomerania region it was bred straight down from. Now extinct.", img: "/history/breeds/Continental-European-farm-watch-spitz.jpg", value: 45 }
    ]
  },
  "French Bulldog": {
    name: "French Bulldog",
    note: "Born when English lacemakers took their little toy bulldogs to France, where Paris fell for the bat eared result.",
    children: [
      { name: "Bulldog", note: "The English toy bulldogs the Nottingham lace workers carried across to Normandy.", img: "/history/breeds/Old-English-Bulldog.jpg", value: 65 },
      { name: "Parisian ratters and terriers", note: "The city ratting dogs of Paris crossed in, thought to fix the upright bat ears. Now extinct.", img: "/history/breeds/Parisian-ratters-and-terriers.jpg", value: 35 }
    ]
  },
  "Chihuahua": {
    name: "Chihuahua",
    note: "The smallest dog of all, traced to the Techichi companion dogs kept by the peoples of ancient Mexico.",
    children: [
      { name: "Ancient Techichi dogs", note: "The small sacred companion dogs of the Toltec and Aztec, the breed's direct root.", img: "/history/breeds/Ancient-Techichi-dogs.jpg", value: 80 },
      { name: "Small imported dogs", note: "Tiny dogs brought by later traders, thought to add coat and the bold, terrier like spark. Now extinct.", img: "/history/breeds/small-imported-dogs.jpg", value: 20 }
    ]
  },
  "German Shepherd": {
    name: "German Shepherd",
    note: "Standardised from Germany's regional sheep herding dogs into one clever, hard working breed in the 1890s.",
    children: [
      { name: "Thuringian herding dogs", note: "The pricked ear, curl tailed herders of central Germany behind the alert look. Now extinct.", img: "/history/breeds/Thuringian-herding-dogs.jpg", value: 45 },
      { name: "Wurttemberg sheepdogs", note: "The larger, steadier southern herding dogs that gave size and a calm working head. Now extinct.", img: "/history/breeds/Wurttemberg-sheepdogs.jpg", value: 40 },
      { name: "Old German farm guards", note: "Local farm and guard stock folded in as the breed was fixed to a single type. Now extinct.", img: "/history/breeds/Old-German-farm-guards.jpg", value: 15 }
    ]
  },
  "Dachshund": {
    name: "Dachshund",
    note: "The German badger dog, a scenthound bred low and long to follow its quarry straight down into the earth.",
    children: [
      { name: "German bracke scenthounds", note: "The trailing hounds it descends from, dwarfed in the leg to work underground. Now extinct.", img: "/history/breeds/German-bracke-scenthounds Old German hunting dogs.jpg", value: 60 },
      { name: "Old earth terriers", note: "Terrier type earth dogs thought to add the grit for going to ground after badger and fox. Now extinct.", img: "/history/breeds/Old-Earth-Terriers-Dachshund-brand.jpg", value: 25 },
      { name: "Bloodhound", note: "A thread of heavy scent hound blood behind the long nose and dogged tracking.", img: "/history/breeds/Medieval-Bloodhound.jpg", value: 15 }
    ]
  },
};

// Caps how deep a grafted trail runs. This is a LAYOUT guard, not a loop guard:
// loops are handled by the visited set below, not by this. Measured, so a future
// reader need not re-derive it: raising the cap to 6 makes 8 of 100 levels gain
// depth (5 of them gain a further layer at 7), adding up to 21 circles on the
// worst level (Goldendoodle), all mostly-progenitor nodes (+5 rail chums across
// every level combined). It costs two things that worsen with each rung: the
// LineageModal title ladder portrait shrinks from 25px at six rungs to ~21px at
// seven and ~17px at eight on a phone, and the pit crowds, since circle radius
// floors at 21 so deeper circles crowd rather than shrink. It does NOT bind the
// Tudor-era rule: every playable card with the data reaches a Tudor-or-deeper
// ancestor by depth 4 or less, so 5 is already a rung clear.
const MAX_LINEAGE_DEPTH = 5;

// Some circles are labelled with a common name; map it to its lineage key so
// the same history is grafted in wherever the name appears.
const LINEAGE_ALIASES: Record<string, string> = {
  "Jack Russell": "Jack Russell Terrier",
  "Mastiff": "English Mastiff",
  // SUPERSEDED 14 August 2026. The two Talbot spellings ("Talbot hounds",
  // "Talbot hound") used to appear as child nodes across many trees and were
  // aliased here so their branches grafted onto the Talbot's own ancestry.
  // Those five child nodes have now been renamed to "Talbot" in the data, so
  // the aliases are no longer reached. Kept as no-ops in case an older spelling
  // returns; the rarity tier now reads the merged name, which was the point.
  "Talbot hounds": "Talbot",
  "Talbot hound": "Talbot",
};
function aliasName(name: string): string {
  return LINEAGE_ALIASES[name] ?? name;
}

// Graft each child's own documented lineage into its circle, scaling the
// grafted progenitors so they fill that child's share of the parent. An
// internal node drops its own `value` so the pack layout sizes it from its
// children. Groupings (no entry of their own) and cycles stop the recursion.
function expandNode(
  node: LineageNode,
  depth: number,
  visited: Set<string>,
): LineageNode {
  const key = aliasName(node.name);
  const sub = LINEAGE[key];
  const canGraft =
    !!sub &&
    !!sub.children &&
    sub.children.length > 0 &&
    depth < MAX_LINEAGE_DEPTH &&
    !visited.has(key) &&
    (!node.children || node.children.length === 0);

  if (canGraft && sub.children) {
    const share = node.value ?? 0;
    const directTotal = sub.children.reduce((sum, c) => sum + (c.value ?? 0), 0);
    const next = new Set(visited);
    next.add(key);
    let kids: LineageNode[];
    if (directTotal > 0) {
      // Every record grafted before 4 August takes this path unchanged: the
      // frozen fixture figures depend on this exact arithmetic.
      kids = sub.children.map((c) =>
        expandNode({ ...c, value: ((c.value ?? 0) * share) / directTotal }, depth + 1, next),
      );
    } else {
      // A record whose children are valueless branches (the Celtic Heeler
      // shape, first grafted with the four ancient playable levels) carries
      // its weight in the grandchildren. The direct-value total above reads
      // 0 for it, which used to let the leaves through unscaled and move
      // every figure in the host tree, so this shape scales by leaf sum.
      const leafSum = (n: LineageNode): number =>
        n.children && n.children.length
          ? n.children.reduce((s, c) => s + leafSum(c), 0)
          : n.value ?? 0;
      const total = sub.children.reduce((sum, c) => sum + leafSum(c), 0) || 1;
      const scale = share / total;
      const scaleLeaves = (n: LineageNode): LineageNode =>
        n.children && n.children.length
          ? { ...n, value: undefined, children: n.children.map(scaleLeaves) }
          : { ...n, value: (n.value ?? 0) * scale };
      kids = sub.children.map((c) => expandNode(scaleLeaves(c), depth + 1, next));
    }
    // A grafted node drops its own value: its children carry its share, so
    // the d3 sum measure counts the branch once rather than twice and the
    // break-panel share agrees with the leaf-sum breakdown (owner-sanctioned
    // re-baseline, 3 August). Pack geometry is untouched: d3.pack sizes
    // circles from leaves only.
    return { ...node, value: undefined, children: kids };
  }

  if (node.children && node.children.length) {
    const next = new Set(visited);
    next.add(key);
    return {
      ...node,
      children: node.children.map((c) => expandNode(c, depth + 1, next)),
    };
  }

  return node;
}

export function getLineage(name: string): LineageNode | null {
  const root = LINEAGE[aliasName(resolveLineageName(name))];
  if (!root) return null;
  return expandNode({ ...root }, 0, new Set<string>());
}

// Every root in the whole lineage dataset (one authored tree each). Used to
// measure a dog's dataset-wide rarity: how many distinct trees it appears in.
export const LINEAGE_ROOTS: string[] = Object.keys(LINEAGE);
