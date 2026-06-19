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
          { name: "Old English Black and Tan Terrier", note: "The classic British ratting terrier.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 14 },
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
      { name: "Jack Russell", note: "Brings the bold, bouncy, terrier spirit.", img: "/jackrussel-square.jpg", value: 50 },
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
  },

  "Bull Terrier": {
    name: "Bull Terrier",
    note: "A Victorian invention. James Hinks set out in the 1860s to build a cleaner, all-white gentleman's companion from the old bull-and-terrier dogs.",
    children: [
      { name: "Bulldog", note: "Brought the power, the broad chest and the determined grip.", img: "/history/breeds/old-engish-bulldog.webp", value: 45 },
      { name: "White English Terrier", note: "A now-extinct breed that gave the clean white coat and terrier sharpness.", img: "/history/breeds/english-white-terrier-painting.jpg", value: 40 },
      { name: "Dalmatian", note: "Crossed in for size, substance and a pure white finish.", img: "/Dalmatian-square.jpg", value: 15 }
    ]
  },

  "Boston Terrier": {
    name: "Boston Terrier",
    note: "An American original from 1870s Boston, traced back to a single dog, Hooper's Judge, a bulldog and terrier cross bred smaller and smarter.",
    children: [
      { name: "Bulldog", note: "Brought the stocky frame and the easy-going, affectionate streak.", img: "/history/breeds/old-engish-bulldog.webp", value: 55 },
      { name: "White English Terrier", note: "The now-extinct terrier behind the neat build and lively mind.", img: "/history/breeds/english-white-terrier-painting.jpg", value: 45 }
    ]
  },

  "West Highland Terrier": {
    name: "West Highland Terrier",
    note: "Bred from the white pups of the Highland working terriers, kept apart on purpose so they would show up against the heather and rock.",
    children: [
      { name: "Cairn Terrier", note: "The closest cousin, and the main source of the Westie's plucky working type.", img: "/history/breeds/cairn-terrier-photo.jpg", value: 64 },
      { name: "Scottish Terrier", note: "Another of the old Highland terriers sharing the same rugged roots.", img: "/history/breeds/scottish-terrier-image.jpg", value: 22 },
      { name: "Skye Terrier", note: "Part of the same west-coast terrier family that shaped the breed.", img: "/history/breeds/skye-terrier-photo.webp", value: 14 }
    ]
  },

  "Staffordshire Bull Terrier": {
    name: "Staffordshire Bull Terrier",
    note: "A classic bull-and-terrier, bred in the Black Country by crossing the old bulldog with game local terriers for grip and gameness.",
    children: [
      { name: "Bulldog", note: "The old, athletic bull-baiting type, not the modern show dog, for strength and courage.", img: "/history/breeds/old-engish-bulldog.webp", value: 55 },
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
      { name: "Dandie Dinmont Terrier", note: "Another Border breed from the same root, raised in the same hills.", img: "/history/breeds/dandie-dinmont-terrier-photo.jpeg", value: 33 },
      { name: "Local fell terriers", note: "The hardy fox-working terriers of the fells that shaped the type.", img: "/history/breeds/Patterdale-Terrier-photo.jpg", value: 33 }
    ]
  },

  "Bulldog": {
    name: "Bulldog",
    note: "Once a fierce bull-baiting dog, then bred into the gentle, wrinkly companion we know after blood sports were banned in 1835.",
    children: [
      { name: "Old English Bulldog", note: "The athletic bull-baiting dog at the root of it all, leaner and fiercer than today's Bulldog.", img: "/history/breeds/old-engish-bulldog.webp", value: 60 },
      { name: "Mastiff", note: "The old Molosser guard-and-war dogs that gave the breed its bulk and broad head.", img: "/mastiff-square.jpg", value: 25 },
      { name: "Pug", note: "Crossed in during the 1800s to shorten the face and soften the temperament.", img: "/pug-square.jpg", value: 15 }
    ]
  },

  "Whippet": {
    name: "Whippet",
    note: "The poor man's racehorse. Northern miners bred a pocket-sized sighthound for weekend racing and rabbit coursing.",
    children: [
      { name: "Greyhound", note: "The core of the breed, scaled down for speed in a smaller, cheaper-to-keep package.", img: "/greyhound-square.jpg", value: 62 },
      { name: "Terriers", note: "Added grit and gameness for the rabbit-coursing the early dogs were bred for.", img: "/history/breeds/manchester-terrior.jpg", value: 23 },
      { name: "Italian Greyhound", note: "A later refinement for the elegant, fine-boned outline.", img: "/italian-greyhound-square.jpg", value: 15 }
    ]
  },

  "Corgi": {
    name: "Corgi",
    note: "A big dog in a small body. The Pembroke is a true cattle herder, nipping at heels and ducking the kicks.",
    children: [
      { name: "Spitz-type dogs", note: "Foxy-faced Nordic dogs like the Pomeranian and Swedish Vallhund, brought in by Flemish weavers and Viking settlers.", img: "/Pomeranian-square.jpg", value: 40 },
      { name: "Cardigan Welsh Corgi", note: "Its close cousin and the older of the two Welsh corgis. The pair share deep Welsh roots and were briefly crossed in the 1930s.", img: "/history/breeds/Welsh_Corgi_Cardigan-photo.jpg", value: 35 },
      { name: "Welsh herding dogs", note: "Local Welsh working stock that shaped it into a low, nimble cattle dog.", img: "/history/breeds/Old-Welsh-Grey-Sheepdog.jpg", value: 25 }
    ]
  },

  "Golden Retriever": {
    name: "Golden Retriever",
    note: "A Scottish creation. Lord Tweedmouth kept careful records as he built the perfect gundog on his Highland estate from the 1860s.",
    children: [
      { name: "Wavy-Coated Retriever", note: "The yellow retriever at the heart of Tweedmouth's project.", img: "/history/breeds/flatcoated_retriever-photo.jpg", value: 45 },
      { name: "Tweed Water Spaniel", note: "A now-extinct local water dog that gave the gentle nature and love of water.", img: "/history/breeds/water-spaniel-illustration.jpg", value: 30 },
      { name: "Irish Setter", note: "A dash of setter for the rich golden colour.", img: "/history/breeds/irish-setter-photo.jpg", value: 15 },
      { name: "Bloodhound", note: "A little hound blood for tracking power and a good nose.", img: "/history/breeds/bloodhound-photo.jpg", value: 10 }
    ]
  },

  "Border Collie": {
    name: "Border Collie",
    note: "Widely called the cleverest dog of all, bred purely for the work of gathering and moving sheep on the hills.",
    children: [
      { name: "Old Scotch Collie", note: "The hardy hill-collie stock at the heart of the breed, traced to one famous dog, Old Hemp.", img: "/history/breeds/rough-collie-photo.jpg", value: 50 },
      { name: "Welsh sheepdogs", note: "Local Welsh herding dogs that fed into the working type along the border.", img: "/history/breeds/Old-Welsh-Grey-Sheepdog.jpg", value: 25 },
      { name: "Cumberland sheepdogs", note: "Northern English herding dogs from the same border country.", img: "/history/breeds/cumberland-sheepdog-photo.jpg", value: 25 }
    ]
  },

  "Irish Setter": {
    name: "Irish Setter",
    note: "The flashy red gundog of Ireland, bred to range wide and find game birds across open country.",
    children: [
      { name: "English Setter", note: "The base setter type behind the breed's style and stance.", img: "/history/breeds/english_setter-photo.jpg", value: 35 },
      { name: "Irish Water Spaniel", note: "Native Irish spaniel blood for coat and a love of water.", img: "/history/breeds/irish-water-spaniel.jpg", value: 25 },
      { name: "Gordon Setter", note: "Another setter in the mix, adding substance and steadiness.", img: "/history/breeds/gordon-setter-photo.jpg", value: 20 },
      { name: "Pointer", note: "A touch of pointer for nose and a wide-ranging hunt.", img: "/history/breeds/pointer-photo.jpg", value: 20 }
    ]
  },

  "Jack Russell Terrier": {
    name: "Jack Russell Terrier",
    note: "Bred by a hunting parson, the Reverend John Russell, in the early 1800s for a game little terrier that could bolt a fox and keep up with the hounds.",
    children: [
      { name: "Fox Terrier", note: "The old white-bodied fox-working terriers that are the breed's direct foundation.", img: "/history/breeds/fox_terrier-img.jpg", value: 55 },
      { name: "Old English White Terrier", note: "A now-extinct terrier behind the mostly white coat.", img: "/history/breeds/english-white-terrier-painting.jpg", value: 30 },
      { name: "Working hunt terriers", note: "Hardy local terriers kept for going to ground after fox.", img: "/history/breeds/Patterdale-Terrier-photo.jpg", value: 15 }
    ]
  },

  "Cocker Spaniel": {
    name: "Cocker Spaniel",
    note: "The smallest of the old land spaniels, bred to flush, or 'cock', woodcock from cover. For years Cockers and Springers were born in the very same litters, sorted only by working size.",
    children: [
      { name: "Land spaniels", note: "The old English land-spaniel stock that every working spaniel springs from.", img: "/history/breeds/norfolk-spaniel-painting.jpg", value: 55 },
      { name: "Field Spaniel", note: "A close gundog cousin from the same spaniel family.", img: "/history/breeds/field-spaniel-photo.jpg", value: 25 },
      { name: "Sussex Spaniel", note: "A heavier, golden-liver spaniel that lent bone and a rich coat.", img: "/history/breeds/sussex-spaniel-drawing.jpg", value: 20 }
    ]
  },

  "Springer Spaniel": {
    name: "Springer Spaniel",
    note: "The larger land spaniels, bred to 'spring' game from cover for the net, hawk and later the gun. The Cocker's bigger litter-mate, set apart only by size.",
    children: [
      { name: "Norfolk Spaniel", note: "A springer-type spaniel later folded into the breed.", img: "/history/breeds/norfolk-spaniel-painting.jpg", value: 45 },
      { name: "Old water spaniels", note: "Working water spaniels that added drive and a love of wet cover.", img: "/history/breeds/water-spaniel-illustration.jpg", value: 30 },
      { name: "Welsh Springer Spaniel", note: "A close cousin from the same springing-spaniel root.", img: "/history/breeds/welsh-springer-spaniel-photo.jpg", value: 25 }
    ]
  },

  "Skye Terrier": {
    name: "Skye Terrier",
    note: "One of the oldest terriers in Britain, a long, low, heavy-coated earth dog from the Isle of Skye and the Western Highlands.",
    children: [
      { name: "Ancient Highland terriers", note: "The old working-terrier stock of the Highlands that every Scottish terrier springs from.", img: "/history/breeds/cairn-terrier-photo.jpg", value: 60 },
      { name: "Isle of Skye earth dogs", note: "Hardy island dogs bred to bolt fox, otter and badger from the rocks.", img: "/history/breeds/scottish-terrier-image.jpg", value: 40 }
    ]
  },

  "Scottish Terrier": {
    name: "Scottish Terrier",
    note: "The 'diehard' of the Highlands, drawn from the old Scottish terrier stock into a sturdy, short-legged earth dog.",
    children: [
      { name: "Old Highland terriers", note: "The shared Highland working-terrier stock, once all just called Scottish terriers.", img: "/history/breeds/cairn-terrier-photo.jpg", value: 60 },
      { name: "Skye terrier stock", note: "The long-coated island terriers from the same rootstock.", img: "/history/breeds/skye-terrier-photo.webp", value: 40 }
    ]
  },

  "Dandie Dinmont Terrier": {
    name: "Dandie Dinmont Terrier",
    note: "A long-bodied terrier of the Anglo-Scottish border with a soft topknot, named after a character in a Walter Scott novel.",
    children: [
      { name: "Old Border terriers", note: "The rough working terriers of the border country, kept by families like the Allans of Holystone.", img: "/history/breeds/border-terrier-photo.jpg", value: 65 },
      { name: "Skye terrier stock", note: "Long, low Scottish terriers, one suggested source of its weasel shape.", img: "/history/breeds/skye-terrier-photo.webp", value: 20 },
      { name: "Otterhound", note: "A little hound blood is thought to have added size and the soft coat.", img: "/history/breeds/otterhound-photo.jpg", value: 15 }
    ]
  },

  "Black and Tan Terrier": {
    name: "Black and Tan Terrier",
    note: "The Old English Terrier, the extinct rough working terrier that nearly every British terrier descends from.",
    children: [
      { name: "Old British ratting terriers", note: "The ancient ratting and vermin dogs kept on farms long before breeds were named.", img: "/history/breeds/old-german-ratting-terriers-illustration.jpg", value: 60 },
      { name: "Earth and hunt terriers", note: "Hardy go-to-ground terriers used to bolt fox and badger.", img: "/history/breeds/Old_English_Black_and_Tan_Terrier-illustration.jpg", value: 40 }
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
    note: "A lithe, lamb-like terrier from the Northumberland mining country, once called the Rothbury Terrier and prized by poachers.",
    children: [
      { name: "Rothbury terriers", note: "The local working terriers of the Rothbury and border country.", img: "/history/breeds/border-terrier-photo.jpg", value: 50 },
      { name: "Whippet", note: "Brought in for speed and the arched, racy back.", img: "/history/breeds/whippet-photo.jpg", value: 30 },
      { name: "Dandie Dinmont Terrier", note: "A close relative from the same border rootstock, sharing the crisp coat and topknot.", img: "/history/breeds/dandie-dinmont-terrier-photo.jpeg", value: 20 }
    ]
  },

  "Welsh Terrier": {
    name: "Welsh Terrier",
    note: "A wiry black-and-tan terrier from Wales, bred to face fox, otter and badger underground.",
    children: [
      { name: "Old English Black and Tan Terrier", note: "The old rough black-and-tan working terrier it descends from almost unchanged.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 75 },
      { name: "Old wirehaired fell terriers", note: "Hardy broken-coated working terriers of the hills.", img: "/history/breeds/Old_English_Black_and_Tan_Terrier-illustration.jpg", value: 25 }
    ]
  },

  "Kerry Blue Terrier": {
    name: "Kerry Blue Terrier",
    note: "Ireland's blue-coated all-rounder from County Kerry, a farm dog, herder, hunter and fighter rolled into one.",
    children: [
      { name: "Soft-Coated Wheaten Terrier", note: "The older native Irish terrier widely held to be its parent.", img: "/history/breeds/soft-coated--wheaten-terrier-photo.jpg", value: 60 },
      { name: "Native Irish terriers", note: "The shared stock of Ireland's working farm terriers.", img: "/history/breeds/irish-terrier-photo.jpg", value: 40 }
    ]
  },

  "English White Terrier": {
    name: "English White Terrier",
    note: "A pricked-ear white terrier, a short-lived show breed drawn from Britain's old white working terriers, now extinct.",
    children: [
      { name: "Old white working terriers", note: "The white-bodied fox-working terriers found across Britain since the 1700s.", img: "/history/breeds/fox_terrier-img.jpg", value: 60 },
      { name: "Old English Terrier stock", note: "The broader old black-and-tan terrier stock behind it.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 40 }
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
      { name: "Dandie Dinmont Terrier", note: "Brought in to shorten the leg and add bone.", img: "/history/breeds/dandie-dinmont-terrier-photo.jpeg", value: 35 },
      { name: "West Highland White Terrier", note: "Used to set the white coat that kept it from being mistaken for the quarry.", img: "/history/breeds/west-highland-white-terrier-photo.jpg", value: 35 },
      { name: "Wire Fox Terrier", note: "Added gameness and a sharp working drive.", img: "/history/breeds/fox_terrier-img.jpg", value: 30 }
    ]
  },

  "Cairn Terrier": {
    name: "Cairn Terrier",
    note: "A small, shaggy Highland terrier named for the rock cairns it bolted vermin from, the closest of all to the original Scottish working terrier.",
    children: [
      { name: "Isle of Skye terriers", note: "The island working terriers it was once grouped with as a 'short-haired Skye'.", img: "/history/breeds/skye-terrier-photo.webp", value: 55 },
      { name: "Highland mainland terriers", note: "The old Highland earth-dog stock shared with the Scottie and Westie.", img: "/history/breeds/scottish-terrier-image.jpg", value: 45 }
    ]
  },

  "Lakeland Terrier": {
    name: "Lakeland Terrier",
    note: "A fell terrier from the Lake District, bred to follow fox over the crags and go to ground without flinching.",
    children: [
      { name: "Old fell terriers", note: "The hardy black-and-tan working terriers of the northern fells.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 50 },
      { name: "Bedlington Terrier", note: "A near neighbour that lent coat and line.", img: "/history/breeds/Bedlington Terrier-photo.jpg", value: 25 },
      { name: "Wire Fox Terrier", note: "Added smartness and a workmanlike head.", img: "/history/breeds/fox_terrier-img.jpg", value: 25 }
    ]
  },

  "Fox Terrier": {
    name: "Fox Terrier",
    note: "The classic earth dog of the foxhunt, carried to the field to bolt the fox when it went to ground.",
    children: [
      { name: "Old English Black and Tan Terrier", note: "The smooth and rough black-and-tan terriers at its foundation.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 45 },
      { name: "English White Terrier", note: "Lent the predominantly white, easy-to-see coat.", img: "/history/breeds/english-white-terrier-painting.jpg", value: 25 },
      { name: "Beagle", note: "A dash of hound for nose and cry.", img: "/beagle-square.jpg", value: 15 },
      { name: "Bull Terrier", note: "A touch of bull blood for grit.", img: "/bull-terrier-square.jpg", value: 15 }
    ]
  },

  "English Toy Terrier": {
    name: "English Toy Terrier",
    note: "A miniature black-and-tan, the toy version of the Manchester Terrier, once a champion rat-pit performer.",
    children: [
      { name: "Manchester Terrier", note: "The black-and-tan ratter it was bred down from.", img: "/history/breeds/manchester-terrior.jpg", value: 70 },
      { name: "Black and Tan Terrier", note: "The older working terrier behind the Manchester.", img: "/history/breeds/Old_English_Black_and_Tan_Terrier-illustration.jpg", value: 30 }
    ]
  },

  "Paisley Terrier": {
    name: "Paisley Terrier",
    note: "A silky, blue show terrier from around Paisley and Clydeside, the glamorous strain of the Skye that helped create the Yorkshire.",
    children: [
      { name: "Skye terrier stock", note: "The long-coated Scottish terriers it was bred for beauty from.", img: "/history/breeds/skye-terrier-photo.webp", value: 65 },
      { name: "Old Scotch terriers", note: "The working Scottish terriers behind the silky Clydeside strains.", img: "/history/breeds/scottish-terrier-image.jpg", value: 35 }
    ]
  },

  "Irish Terrier": {
    name: "Irish Terrier",
    note: "The 'daredevil' of Ireland, a fiery red terrier and one of the four native Irish terrier breeds.",
    children: [
      { name: "Native Irish terriers", note: "The old Irish farm-terrier stock shared with the Wheaten and Kerry Blue.", img: "/history/breeds/soft-coated--wheaten-terrier-photo.jpg", value: 60 },
      { name: "Old black and tan terriers", note: "Wirehaired working terriers that shaped the harsh red coat.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 40 }
    ]
  },

  "Soft-Coated Wheaten Terrier": {
    name: "Soft-Coated Wheaten Terrier",
    note: "The oldest of Ireland's four native terriers, a soft-coated all-purpose farm dog, and the likely parent of the Kerry Blue and Irish Terrier.",
    children: [
      { name: "Native Irish farm terriers", note: "Ireland's old all-purpose working terriers, kept by farmers, not gentry.", img: "/history/breeds/irish-terrier-photo.jpg", value: 60 },
      { name: "Old Gaelic working terriers", note: "The rugged native stock of the Irish countryside.", img: "/history/breeds/glen-of-Imaal-terrier.jpg", value: 40 }
    ]
  },

  "Glen of Imaal Terrier": {
    name: "Glen of Imaal Terrier",
    note: "A low, powerful terrier from a remote Wicklow valley, one of the four native Irish terriers and quiet for its kind.",
    children: [
      { name: "Native Irish terriers", note: "The old Irish farm-terrier stock, with the Wheaten in its background.", img: "/history/breeds/soft-coated--wheaten-terrier-photo.jpg", value: 60 },
      { name: "Low-slung soldiers' dogs", note: "Short-legged dogs left by Flemish and Hessian soldiers settled in the glen.", img: "/history/breeds/dandie-dinmont-terrier-photo.jpeg", value: 40 }
    ]
  },

  "Norwich Terrier": {
    name: "Norwich Terrier",
    note: "A tiny, sturdy red terrier from East Anglia, made famous by Cambridge students who kept them to bolt rats in the colleges. The prick-eared cousin of the Norfolk.",
    children: [
      { name: "Irish Terrier", note: "Small red Irish terriers in the early Trumpington stock.", img: "/history/breeds/irish-terrier-photo.jpg", value: 40 },
      { name: "Yorkshire Terrier", note: "A bigger silky terrier said to be in the early mix.", img: "/history/breeds/yorkshire-terrier-photo.jpg", value: 30 },
      { name: "Local red ratting terriers", note: "The small working terriers of Norfolk farms and gypsy ratters.", img: "/history/breeds/Old_English_Black_and_Tan_Terrier-illustration.jpg", value: 30 }
    ]
  },

  "Patterdale Terrier": {
    name: "Patterdale Terrier",
    note: "A tough, no-nonsense black fell terrier from the Lake District, bred purely to work fox and not for the show ring.",
    children: [
      { name: "Old fell terriers", note: "The black-and-tan working terriers of the northern fells.", img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", value: 60 },
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
};


export function getLineage(name: string): LineageNode | null {
  return LINEAGE[name] ?? null;
}
