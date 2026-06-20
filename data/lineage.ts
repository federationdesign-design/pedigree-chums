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
        name: "Water spaniels",
        note: "A touch of spaniel for a soft mouth and real keenness in water and cover.",
        img: "/history/breeds/water-spaniel-illustration.jpg",
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
        img: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg",
        children: [
          { name: "Old English Black and Tan Terrier", note: "The classic British ratting terrier.", img: "/history/breeds/Old-British-ratting-terriers.jpg", value: 14 },
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
      { name: "Jack Russell Terrier", note: "Brings the bold, bouncy, terrier spirit.", img: "/jackrussel-square.jpg", value: 50 },
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
      { name: "Bulldog", note: "Brought the power, the broad chest and the determined grip.", img: "/history/breeds/Old-English-Bulldog.jpg", value: 45 },
      { name: "White English Terrier", note: "A now-extinct breed that gave the clean white coat and terrier sharpness.", img: "/history/breeds/english-white-terrier-painting.jpg", value: 40 },
      { name: "Dalmatian", note: "Crossed in for size, substance and a pure white finish.", img: "/Dalmatian-square.jpg", value: 15 }
    ]
  },

  "Boston Terrier": {
    name: "Boston Terrier",
    note: "An American original from 1870s Boston, traced back to a single dog, Hooper's Judge, a bulldog and terrier cross bred smaller and smarter.",
    children: [
      { name: "Bulldog", note: "Brought the stocky frame and the easy-going, affectionate streak.", img: "/history/breeds/Old-English-Bulldog.jpg", value: 55 },
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
      { name: "Bulldog", note: "The old, athletic bull-baiting type, not the modern show dog, for strength and courage.", img: "/history/breeds/Old-English-Bulldog.jpg", value: 55 },
      { name: "Old English Black and Tan Terrier", note: "Added speed, agility and terrier fire to the heavier bulldog base.", img: "/history/breeds/Old-British-ratting-terriers.jpg", value: 45 }
    ]
  },

  "Yorkshire Terrier": {
    name: "Yorkshire Terrier",
    note: "A working dog before a lap dog. Scottish weavers brought their terriers to the Yorkshire mills in the 1800s and crossed them with local ratters.",
    children: [
      { name: "Paisley Terrier", note: "A long-coated Scottish terrier that gave the silky, flowing coat.", img: "/history/breeds/Paisley-Terrier=photo.jpg", value: 45 },
      { name: "Skye Terrier", note: "Another Scottish terrier behind the long, fine hair.", img: "/history/breeds/skye-terrier-photo.webp", value: 30 },
      { name: "Old English Black and Tan Terrier", note: "Local ratting terriers that brought the size down and the colour in.", img: "/history/breeds/Old-British-ratting-terriers.jpg", value: 25 }
    ]
  },

  "Border Terrier": {
    name: "Border Terrier",
    note: "A true working terrier from the hills along the English and Scottish border, bred to keep up with the hunt and go to ground after foxes.",
    children: [
      { name: "Bedlington Terrier", note: "Shares the same old Border terrier stock and a common working ancestor.", img: "/history/breeds/Bedlington Terrier-photo.jpg", value: 34 },
      { name: "Dandie Dinmont Terrier", note: "Another Border breed from the same root, raised in the same hills.", img: "/history/breeds/dandie-dinmont-terrier-photo.jpeg", value: 33 },
      { name: "Old fell terriers", note: "The hardy fox-working terriers of the fells that shaped the type.", img: "/history/breeds/Patterdale-Terrier-photo.jpg", value: 33 }
    ]
  },

  "Bulldog": {
    name: "Bulldog",
    note: "Once a fierce bull-baiting dog, then bred into the gentle, wrinkly companion we know after blood sports were banned in 1835.",
    children: [
      { name: "Old English Bulldog", note: "The athletic bull-baiting dog at the root of it all, leaner and fiercer than today's Bulldog.", img: "/history/breeds/Old-English-Bulldog.jpg", value: 60 },
      { name: "Mastiff", note: "The old Molosser guard-and-war dogs that gave the breed its bulk and broad head.", img: "/mastiff-square.jpg", value: 25 },
      { name: "Pug", note: "Crossed in during the 1800s to shorten the face and soften the temperament.", img: "/pug-square.jpg", value: 15 }
    ]
  },

  "Whippet": {
    name: "Whippet",
    note: "The poor man's racehorse. Northern miners bred a pocket-sized sighthound for weekend racing and rabbit coursing.",
    children: [
      { name: "Greyhound", note: "The core of the breed, scaled down for speed in a smaller, cheaper-to-keep package.", img: "/greyhound-square.jpg", value: 62 },
      { name: "Old English Black and Tan Terrier", note: "Added grit and gameness for the rabbit-coursing the early dogs were bred for.", img: "/history/breeds/Old-British-ratting-terriers.jpg", value: 23 },
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
      { name: "Bloodhound", note: "A little hound blood for tracking power and a good nose.", img: "/history/breeds/Medieval-Bloodhound.jpg", value: 10 }
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
      { name: "Water spaniels", note: "Working water spaniels that added drive and a love of wet cover.", img: "/history/breeds/water-spaniel-illustration.jpg", value: 30 },
      { name: "Welsh Springer Spaniel", note: "A close cousin from the same springing-spaniel root.", img: "/history/breeds/welsh-springer-spaniel-photo.jpg", value: 25 }
    ]
  },

  "Skye Terrier": {
    name: "Skye Terrier",
    note: "One of the oldest terriers in Britain, a long, low, heavy-coated earth dog from the Isle of Skye and the Western Highlands.",
    children: [
      { name: "Old Highland terriers", note: "The old working-terrier stock of the Highlands that every Scottish terrier springs from.", img: "/history/breeds/cairn-terrier-photo.jpg", value: 60 },
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
    note: "A lithe, lamb-like terrier from the Northumberland mining country, once called the Rothbury or Rodbury Terrier and prized by poachers.",
    children: [
      { name: "Old Border terriers", note: "The local working terriers of the Rothbury and border country.", img: "/history/breeds/border-terrier-photo.jpg", value: 50 },
      { name: "Whippet", note: "Brought in for speed and the arched, racy back.", img: "/history/breeds/whippet-photo.jpg", value: 30 },
      { name: "Dandie Dinmont Terrier", note: "A close relative from the same border rootstock, sharing the crisp coat and topknot.", img: "/history/breeds/dandie-dinmont-terrier-photo.jpeg", value: 20 }
    ]
  },

  "Welsh Terrier": {
    name: "Welsh Terrier",
    note: "A wiry black-and-tan terrier from Wales, bred to face fox, otter and badger underground.",
    children: [
      { name: "Old English Black and Tan Terrier", note: "The old rough black-and-tan working terrier it descends from almost unchanged.", img: "/history/breeds/Old-British-ratting-terriers.jpg", value: 75 },
      { name: "Old fell terriers", note: "Hardy broken-coated working terriers of the hills.", img: "/history/breeds/Patterdale-Terrier-photo.jpg", value: 25 }
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
      { name: "Old English White Terrier", note: "The white-bodied fox-working terriers found across Britain since the 1700s.", img: "/history/breeds/english-white-terrier-painting.jpg", value: 60 },
      { name: "Old English Black and Tan Terrier", note: "The broader old black-and-tan terrier stock behind it.", img: "/history/breeds/Old-British-ratting-terriers.jpg", value: 40 }
    ]
  },

  "Airedale Terrier": {
    name: "Airedale Terrier",
    note: "The 'King of Terriers', the largest of them all, made in Yorkshire's Aire valley to hunt otter and water rat.",
    children: [
      { name: "Old English Black and Tan Terrier", note: "The broken-coated working terrier that gave its terrier grit.", img: "/history/breeds/Old-British-ratting-terriers.jpg", value: 60 },
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
      { name: "Skye terrier stock", note: "The island working terriers it was once grouped with as a 'short-haired Skye'.", img: "/history/breeds/skye-terrier-photo.webp", value: 55 },
      { name: "Highland mainland terriers", note: "The old Highland earth-dog stock shared with the Scottie and Westie.", img: "/history/breeds/scottish-terrier-image.jpg", value: 45 }
    ]
  },

  "Lakeland Terrier": {
    name: "Lakeland Terrier",
    note: "A fell terrier from the Lake District, bred to follow fox over the crags and go to ground without flinching.",
    children: [
      { name: "Old fell terriers", note: "The hardy black-and-tan working terriers of the northern fells.", img: "/history/breeds/Patterdale-Terrier-photo.jpg", value: 50 },
      { name: "Bedlington Terrier", note: "A near neighbour that lent coat and line.", img: "/history/breeds/Bedlington Terrier-photo.jpg", value: 25 },
      { name: "Wire Fox Terrier", note: "Added smartness and a workmanlike head.", img: "/history/breeds/fox_terrier-img.jpg", value: 25 }
    ]
  },

  "Fox Terrier": {
    name: "Fox Terrier",
    note: "The classic earth dog of the foxhunt, carried to the field to bolt the fox when it went to ground.",
    children: [
      { name: "Old English Black and Tan Terrier", note: "The smooth and rough black-and-tan terriers at its foundation.", img: "/history/breeds/Old-British-ratting-terriers.jpg", value: 45 },
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
      { name: "Skye terrier stock", note: "The long-coated Scottish terriers it was bred for beauty from.", img: "/history/breeds/skye-terrier-photo.webp", value: 65 },
      { name: "Old Highland terriers", note: "The working Scottish terriers behind the silky Clydeside strains.", img: "/history/breeds/cairn-terrier-photo.jpg", value: 35 }
    ]
  },

  "Irish Terrier": {
    name: "Irish Terrier",
    note: "The 'daredevil' of Ireland, a fiery red terrier and one of the four native Irish terrier breeds.",
    children: [
      { name: "Native Irish terriers", note: "The old Irish farm-terrier stock shared with the Wheaten and Kerry Blue.", img: "/history/breeds/irish-terrier-photo.jpg", value: 60 },
      { name: "Old English Black and Tan Terrier", note: "Wirehaired working terriers that shaped the harsh red coat.", img: "/history/breeds/Old-British-ratting-terriers.jpg", value: 40 }
    ]
  },

  "Soft-Coated Wheaten Terrier": {
    name: "Soft-Coated Wheaten Terrier",
    note: "The oldest of Ireland's four native terriers, a soft-coated all-purpose farm dog, and the likely parent of the Kerry Blue and Irish Terrier.",
    children: [
      { name: "Native Irish terriers", note: "Ireland's old all-purpose working farm terriers.", img: "/history/breeds/irish-terrier-photo.jpg", value: 100 }
    ]
  },

  "Glen of Imaal Terrier": {
    name: "Glen of Imaal Terrier",
    note: "A low, powerful terrier from a remote Wicklow valley, one of the four native Irish terriers and quiet for its kind.",
    children: [
      { name: "Native Irish terriers", note: "The old Irish farm-terrier stock, with the Wheaten in its background.", img: "/history/breeds/irish-terrier-photo.jpg", value: 60 },
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
      { name: "Old fell terriers", note: "The black-and-tan working terriers of the northern fells.", img: "/history/breeds/Patterdale-Terrier-photo.jpg", value: 60 },
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

  "Tweed Water Spaniel": {
    name: "Tweed Water Spaniel",
    note: "An extinct liver-brown water dog from the Scottish Borders and the Tweed valley, famous as a key ancestor of the Golden and Curly-Coated Retrievers.",
    children: [
      { name: "Water spaniels", note: "The local rough-coated water dogs of the Border rivers.", img: "/history/breeds/water-spaniel-illustration.jpg", value: 55 },
      { name: "St John's Water Dog", note: "Newfoundland fishing-dog blood that added retrieving power.", img: "/history/breeds/original-Newfoundland-illustration.jpg", value: 45 }
    ]
  },

  "Lurcher": {
    name: "Lurcher",
    note: "Not a breed but a type: a sighthound crossed with a working dog, long the poacher's and traveller's companion, fast and quiet.",
    children: [
      { name: "Greyhound", note: "A sighthound for speed and a silent, sweeping run.", img: "/history/breeds/original-greyhound.jpg", value: 50 },
      { name: "Collie or working dog", note: "Herding or pastoral blood for brains and biddability.", img: "/history/breeds/rough-collie-photo.jpg", value: 30 },
      { name: "Old English Black and Tan Terrier", note: "Sometimes terrier blood for grit and a harder coat.", img: "/history/breeds/Old-British-ratting-terriers.jpg", value: 20 }
    ]
  },

  "Longdog": {
    name: "Longdog",
    note: "A sighthound crossed with another sighthound, bred purely for speed rather than the all-round craft of the lurcher.",
    children: [
      { name: "Greyhound", note: "The foundation of nearly every running dog.", img: "/history/breeds/original-greyhound.jpg", value: 50 },
      { name: "Whippet", note: "Added for nimble, sprinting pace.", img: "/history/breeds/whippet-photo.jpg", value: 25 },
      { name: "Deerhound", note: "Bigger sighthound blood for stamina over rough ground.", img: "/history/breeds/Medieval-Scottish-Deerhound.jpg", value: 25 }
    ]
  },

  "Welsh Springer Spaniel": {
    name: "Welsh Springer Spaniel",
    note: "An old red-and-white Welsh gundog, known for generations as the Welsh Cocker before becoming the Welsh Springer in 1902.",
    children: [
      { name: "Old Welsh land spaniels", note: "The native red-and-white working spaniels of Wales.", img: "/history/breeds/cocker_spaniel-photo.jpg", value: 60 },
      { name: "Land spaniels", note: "The larger flushing spaniels of the same family.", img: "/history/breeds/norfolk-spaniel-painting.jpg", value: 40 }
    ]
  },

  "Field Spaniel": {
    name: "Field Spaniel",
    note: "A long, low black spaniel bred up in Victorian show rings from the larger cocking spaniels, once nearly ruined by exaggeration.",
    children: [
      { name: "Land spaniels", note: "The old land-spaniel stock at its foundation.", img: "/history/breeds/norfolk-spaniel-painting.jpg", value: 45 },
      { name: "Sussex Spaniel", note: "Lent weight, bone and a longer body.", img: "/history/breeds/sussex-spaniel-drawing.jpg", value: 35 },
      { name: "Clumber Spaniel", note: "Heavier spaniel blood for substance.", img: "/history/breeds/clumber-spaniel-photo.jpg", value: 20 }
    ]
  },

  "Sussex Spaniel": {
    name: "Sussex Spaniel",
    note: "An old, short-legged, golden-liver spaniel from the county of Sussex, bred to work slowly and give tongue in dense cover.",
    children: [
      { name: "Land spaniels", note: "The native working spaniels of southern England.", img: "/history/breeds/norfolk-spaniel-painting.jpg", value: 60 },
      { name: "Heavier working spaniels", note: "Lower, stouter spaniels that fixed its build.", img: "/history/breeds/clumber-spaniel-photo.jpg", value: 40 }
    ]
  },

  "Norfolk Spaniel": {
    name: "Norfolk Spaniel",
    note: "An extinct liver-and-white springer-type spaniel, the Victorian forerunner of the English Springer, rolled into that breed in 1903.",
    children: [
      { name: "Land spaniels", note: "The old land-spaniel stock it grew from.", img: "/history/breeds/norfolk-spaniel-painting.jpg", value: 100 }
    ]
  },

  "Toy Trawler Spaniel": {
    name: "Toy Trawler Spaniel",
    note: "An extinct small black-and-tan toy spaniel, a sporting-bred miniature linked to the King Charles and Sussex spaniels.",
    children: [
      { name: "King Charles Spaniel", note: "The toy spaniel at its heart.", img: "/history/breeds/king-charles-spaniel-photo.jpg", value: 60 },
      { name: "Sussex Spaniel", note: "Sporting spaniel blood from the old land-spaniel side.", img: "/history/breeds/sussex-spaniel-drawing.jpg", value: 40 }
    ]
  },

  "Irish Water Spaniel": {
    name: "Irish Water Spaniel",
    note: "The tallest of the spaniels, a curly liver-brown water dog with a rat-like tail, one of Ireland's old gundog breeds.",
    children: [
      { name: "Old Irish water dogs", note: "The southern and northern water spaniels of Ireland.", img: "/history/breeds/water-spaniel-illustration.jpg", value: 55 },
      { name: "Poodle and Barbet water dogs", note: "Continental curly water dogs that shaped the coat.", img: "/poodle-square.jpg", value: 45 }
    ]
  },

  "Bullmastiff": {
    name: "Bullmastiff",
    note: "The gamekeeper's night dog, built in Victorian England to track and pin poachers without mauling them. Mostly Mastiff, with Bulldog for grip.",
    children: [
      { name: "English Mastiff", note: "The larger share, for size, scent and a steady nerve.", img: "/history/breeds/english-mastiff-photo.jpg", value: 60 },
      { name: "Old English Bulldog", note: "Bulldog drive and a tenacious grip.", img: "/history/breeds/Old-English-Bulldog.jpg", value: 40 }
    ]
  },

  "Curly-Coated Retriever": {
    name: "Curly-Coated Retriever",
    note: "One of the oldest retrievers, a tall water dog covered in tight curls, the gamekeeper's and poacher's choice for wildfowl.",
    children: [
      { name: "English Water Spaniel", note: "The extinct native water spaniel at its core.", img: "/history/breeds/englsih-Fishermen-water-dog-illustration.jpg", value: 35 },
      { name: "St John's Water Dog", note: "Newfoundland fishing-dog blood for retrieving.", img: "/history/breeds/original-Newfoundland-illustration.jpg", value: 30 },
      { name: "Irish Water Spaniel", note: "Its closest relative, sharing the curly water-dog coat.", img: "/history/breeds/irish-water-spaniel.jpg", value: 20 },
      { name: "Poodle", note: "A later touch, often credited for the tight curls.", img: "/poodle-square.jpg", value: 15 }
    ]
  },

  "Flat-Coated Retriever": {
    name: "Flat-Coated Retriever",
    note: "Once called the Wavy-Coated Retriever, the smart, glossy black gundog that was the gamekeeper's favourite before the Labrador rose.",
    children: [
      { name: "St John's Water Dog", note: "The Newfoundland fishing dog behind all the retrievers.", img: "/history/breeds/original-Newfoundland-illustration.jpg", value: 50 },
      { name: "Setter", note: "Setter blood for feathering and a good nose.", img: "/history/breeds/english_setter-photo.jpg", value: 30 },
      { name: "Water spaniel and Collie", note: "A little water-spaniel and collie for coat and brains.", img: "/history/breeds/water-spaniel-illustration.jpg", value: 20 }
    ]
  },

  "Rough Collie": {
    name: "Rough Collie",
    note: "The flowing-coated Scottish herder of farm and film, refined in Victorian times with a touch of Borzoi for its long, noble head.",
    children: [
      { name: "Old working collies", note: "The hardy Scottish farm-collie stock at its heart.", img: "/history/breeds/Border_Collie_photo.jpg", value: 65 },
      { name: "Old hill and bearded collies", note: "Shaggy upland herding dogs of the same family.", img: "/history/breeds/bearded-collie-photo.jpg", value: 35 }
    ]
  },

  "Gordon Setter": {
    name: "Gordon Setter",
    note: "Scotland's black-and-tan setter, built up at the Duke of Gordon's kennels into a heavier, steady bird dog.",
    children: [
      { name: "Old black-and-tan setters", note: "The setting dogs at its foundation.", img: "/history/breeds/english_setter-photo.jpg", value: 65 },
      { name: "Bloodhound", note: "Thought to have deepened the nose and the black-and-tan.", img: "/history/breeds/Medieval-Bloodhound.jpg", value: 20 },
      { name: "Collie", note: "A little collie for steadiness, by tradition.", img: "/history/breeds/rough-collie-photo.jpg", value: 15 }
    ]
  },

  "Lancashire Heeler": {
    name: "Lancashire Heeler",
    note: "A tiny, sharp black-and-tan drover's dog from north-west England, used to nip cattle along and clear rats from the farm.",
    children: [
      { name: "Welsh Corgi", note: "The low, heel-nipping cattle dog at its base.", img: "/history/breeds/Pembroke-Welsh-Corgi-photo.jpg", value: 55 },
      { name: "Manchester Terrier", note: "Black-and-tan terrier blood for ratting and colour.", img: "/history/breeds/manchester-terrior.jpg", value: 45 }
    ]
  },

  "Cavalier King Charles Spaniel": {
    name: "Cavalier King Charles Spaniel",
    note: "A 1920s revival of the older, longer-nosed toy spaniel of the Stuart court, bred back from the flat-faced King Charles Spaniel.",
    children: [
      { name: "King Charles Spaniel", note: "The modern flat-faced toy spaniel it was bred back from.", img: "/history/breeds/king-charles-spaniel-photo.jpg", value: 70 },
      { name: "Old sporting toy spaniels", note: "The longer-muzzled toy spaniels of older paintings.", img: "/history/breeds/toy-Trawler-Spaniel-painting.jpg", value: 30 }
    ]
  },

  "Northern Inuit Dog": {
    name: "Northern Inuit Dog",
    note: "A 1980s British creation, bred to look like a wolf while keeping a gentle, trainable temperament. Famous as the Stark direwolves on screen.",
    children: [
      { name: "Arctic sled dogs", note: "Siberian Husky and Alaskan Malamute for the wolfish looks and coat.", img: "/husky-square.jpg", value: 55 },
      { name: "German Shepherd Dog", note: "For size, trainability and a steady working mind.", img: "/german-shepard-square.jpg", value: 45 }
    ]
  },

  "Cumberland Sheepdog": {
    name: "Cumberland Sheepdog",
    note: "An extinct northern working collie of Cumberland and the border hills, a close relative of the Border Collie that was largely absorbed into it.",
    children: [
      { name: "Old working collies", note: "The old British herding-collie stock it sprang from.", img: "/history/breeds/Border_Collie_photo.jpg", value: 60 },
      { name: "Welsh and hill sheepdogs", note: "Related upland herding dogs of the same type.", img: "/history/breeds/Old-Welsh-Grey-Sheepdog.jpg", value: 40 }
    ]
  },

  "Toy Bulldog": {
    name: "Toy Bulldog",
    note: "An extinct miniature Bulldog of Victorian England, a small companion bull-type that helped give rise to the French Bulldog.",
    children: [
      { name: "Old English Bulldog", note: "Small specimens of the old bull-baiting dog, bred down in size.", img: "/history/breeds/Old-English-Bulldog.jpg", value: 65 },
      { name: "Pug-type toy dogs", note: "Toy blood sometimes used to fix the small size.", img: "/pug-square.jpg", value: 35 }
    ]
  },

  "Dumfriesshire Hound": {
    name: "Dumfriesshire Hound",
    note: "A pack of big black-and-tan foxhounds bred in Dumfriesshire after the First World War, kept working until the pack was disbanded in 2001.",
    children: [
      { name: "English Foxhound", note: "The foxhound base for the pack.", img: "/history/breeds/english-foxhound.jpg", value: 50 },
      { name: "Bloodhound and Gascon hounds", note: "Bloodhound and French Grand Bleu de Gascogne for size, nose and the black-and-tan.", img: "/history/breeds/bloodhound-photo.jpg", value: 50 }
    ]
  },

  "Irish Wolfhound": {
    name: "Irish Wolfhound",
    note: "A towering ancient hound bred to hunt wolves and guard halls, and one of the tallest dogs in the world.",
    children: [
      { name: "Celtic Hound", note: "The ancient sighthound stock the Celts brought across Europe.", img: "/history/breeds/celtic-hound-remake.jpg", value: 60 },
      { name: "Ancient Molossers", note: "Big mastiff-type blood for the bulk to bring down a wolf.", img: "/history/breeds/Ancient-Molossers.jpg", value: 40 }
    ]
  },

  "English Mastiff": {
    name: "English Mastiff",
    note: "Britain's ancient war and guard dog, a giant Molosser prized here since Roman times.",
    children: [
      { name: "Ancient Molossers", note: "The huge eastern war and guard dogs at the root of every mastiff.", img: "/history/breeds/Ancient-Molossers.jpg", value: 60 },
      { name: "Old British bandogs", note: "The heavy chained guard dogs of early Britain.", img: "/history/breeds/Old-British-bandogs.jpg", value: 40 }
    ]
  },

  "Greyhound": {
    name: "Greyhound",
    note: "The fastest of all dogs, a sighthound that has hunted in Britain since antiquity.",
    children: [
      { name: "Celtic Hound", note: "The old running hounds the Celts brought west.", img: "/history/breeds/celtic-hound-remake.jpg", value: 60 },
      { name: "Ancient eastern sighthounds", note: "The slender desert coursing dogs of the old world.", img: "/history/breeds/Ancient-eastern-sighthounds.jpg", value: 40 }
    ]
  },

  "Talbot": {
    name: "Talbot",
    note: "A white medieval scent hound, slow but sure-nosed, and an ancestor of the beagle, foxhound and bloodhound.",
    children: [
      { name: "St Hubert Hound", note: "The monks' scent hound brought over by the Normans.", img: "/history/breeds/St-Hubert-Hound.jpg", value: 60 },
      { name: "Old scenting hounds", note: "The tracking hounds of medieval lords.", img: "/history/breeds/Old-scenting-hounds.jpg", value: 40 }
    ]
  },

  "Cardigan Welsh Corgi": {
    name: "Cardigan Welsh Corgi",
    note: "The older of the two corgis, an ancient Welsh cattle dog with a long body and a long tail.",
    children: [
      { name: "Teckel (Dachshund) family", note: "The long, low hunting dogs the Celts are said to have brought to Cardiganshire.", img: "/Dachshund-square.jpg", value: 55 },
      { name: "Old Welsh herding dogs", note: "Local working dogs that made it a nimble cattle herder.", img: "/history/breeds/Old-Welsh-Grey-Sheepdog.jpg", value: 45 }
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
      { name: "Rough northern sighthounds", note: "Shaggy-coated coursing dogs built for cold, rough ground.", img: "/history/breeds/irish-wolfhound-photo.jpg", value: 40 }
    ]
  },

  "Celtic Hound": {
    name: "Celtic Hound",
    note: "An ancient running hound of the Celts, the deep root behind the Greyhound, Wolfhound and Deerhound.",
    children: [
      { name: "Ancient eastern sighthounds", note: "The slender coursing dogs of Egypt and the Near East.", img: "/history/breeds/Ancient-eastern-sighthounds.jpg", value: 55 },
      { name: "Old hunting dogs of the Celts", note: "The native running dogs of Iron Age Europe.", img: "/history/breeds/Old-hunting-dogs-of-the-Celts.jpg", value: 45 }
    ]
  },

  "Rache": {
    name: "Rache",
    note: "A medieval hound that hunted by scent in a pack, as opposed to the sight-hunting gazehound.",
    children: [
      { name: "St Hubert and Talbot hounds", note: "The Norman scent hounds behind the running pack.", img: "/history/breeds/talbot-hound.jpg", value: 60 },
      { name: "Old scenting hounds", note: "The native pack hounds of medieval Britain.", img: "/history/breeds/Old-scenting-hounds.jpg", value: 40 }
    ]
  },

  "Buckhound": {
    name: "Buckhound",
    note: "A medieval scenting hound kept to hunt buck and fallow deer, sitting between the staghound and the harrier.",
    children: [
      { name: "Old scenting hounds", note: "The deer-hunting pack hounds of the royal forests.", img: "/history/breeds/Old-scenting-hounds.jpg", value: 60 },
      { name: "Talbot hounds", note: "The white medieval hound in its background.", img: "/history/breeds/talbot-hound.jpg", value: 40 }
    ]
  },

  "Southern Hound": {
    name: "Southern Hound",
    note: "A heavy, slow, deep-voiced scent hound of southern England, ancestor of the foxhound, beagle and harrier.",
    children: [
      { name: "Talbot hounds", note: "The white Norman hound at its root.", img: "/history/breeds/talbot-hound.jpg", value: 60 },
      { name: "St Hubert Hound", note: "The abbey scent hounds brought across the Channel.", img: "/history/breeds/St-Hubert-Hound.jpg", value: 40 }
    ]
  },

  "Old English Bulldog": {
    name: "Old English Bulldog",
    note: "The extinct, athletic bull-baiting dog, leaner and fiercer than today's Bulldog, bred down from ancient war dogs.",
    children: [
      { name: "Mastiff and Alaunt war dogs", note: "The big Molossers and the extinct Alaunt that gave it bulk and a broad jaw.", img: "/history/breeds/Mastiff-and-Alaunt-war-dogs.jpg", value: 60 },
      { name: "Old British bandogs", note: "The heavy butcher's and baiting dogs of old England.", img: "/history/breeds/Old-British-bandogs.jpg", value: 40 }
    ]
  },

  "English Foxhound": {
    name: "English Foxhound",
    note: "The classic pack hound of the hunt, bred for stamina, voice and a relentless nose over a long day's chase.",
    children: [
      { name: "Southern Hound", note: "The deep-nosed scent hound at its foundation.", img: "/history/breeds/Southern-Hound.jpg", value: 50 },
      { name: "Greyhound", note: "Added for speed and a cleaner, racier build.", img: "/history/breeds/original-greyhound.jpg", value: 30 },
      { name: "Talbot hound", note: "The old white hound in the deeper background.", img: "/history/breeds/talbot-hound.jpg", value: 20 }
    ]
  },

  "Otterhound": {
    name: "Otterhound",
    note: "A big, rough-coated, web-footed scent hound bred to hunt otter in cold rivers, with a magnificent nose.",
    children: [
      { name: "Bloodhound", note: "Tracking power and a tremendous nose.", img: "/history/breeds/Medieval-Bloodhound.jpg", value: 45 },
      { name: "Southern Hound", note: "Old deep-voiced scent-hound stock.", img: "/history/breeds/Southern-Hound.jpg", value: 30 },
      { name: "Rough water dogs", note: "Shaggy, water-loving dogs for the wet work.", img: "/history/breeds/water-spaniel-illustration.jpg", value: 25 }
    ]
  },

  "Turnspit Dog": {
    name: "Turnspit Dog",
    note: "An extinct, short-legged kitchen dog bred to trot inside a wheel and turn the roasting spit over the fire.",
    children: [
      { name: "Old short-legged working dogs", note: "The low, long dwarf working type behind it.", img: "/Dachshund-square.jpg", value: 60 },
      { name: "Farm and kitchen curs", note: "The everyday working mongrels of the household.", img: "/history/breeds/Cur-dog-drawing.jpg", value: 40 }
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
      { name: "Talbot hound", note: "The white Norman hound at the root of the running packs.", img: "/history/breeds/talbot-hound.jpg", value: 40 },
      { name: "Southern Hound", note: "Deep-nosed scent-hound blood.", img: "/history/breeds/Southern-Hound.jpg", value: 35 },
      { name: "Greyhound", note: "A little sighthound for speed and a tidy build.", img: "/history/breeds/original-greyhound.jpg", value: 25 }
    ]
  },

  "Bearded Collie": {
    name: "Bearded Collie",
    note: "A shaggy, bouncy Scottish herding dog, also called the Highland Collie, built for driving sheep and cattle over the hills.",
    children: [
      { name: "Shaggy lowland herders", note: "Polish Lowland sheepdogs said to have come ashore in Scotland.", img: "/history/breeds/Old-English-Sheepdog.jpg", value: 50 },
      { name: "Native Scottish collies", note: "The local working herding dogs they were crossed with.", img: "/history/breeds/Border_Collie_photo.jpg", value: 50 }
    ]
  },

  "Old English Sheepdog": {
    name: "Old English Sheepdog",
    note: "A big, shaggy, bobtailed drover's dog of the west country, bred to drive sheep and cattle to market.",
    children: [
      { name: "Bearded Collie", note: "The shaggy Scottish herder in its make-up.", img: "/history/breeds/bearded-collie-photo.jpg", value: 55 },
      { name: "Shaggy droving herders", note: "Old continental and Welsh droving dogs of the same heavy-coated type.", img: "/history/breeds/Old-Welsh-Grey-Sheepdog.jpg", value: 45 }
    ]
  },

  "King Charles Spaniel": {
    name: "King Charles Spaniel",
    note: "The flat-faced toy spaniel of the Stuart court, a lapdog favourite long before its longer-nosed Cavalier cousin.",
    children: [
      { name: "Old toy spaniels", note: "The small sporting and lap spaniels of Tudor and Stuart England.", img: "/history/breeds/cocker_spaniel-photo.jpg", value: 60 },
      { name: "Asian flat-faced toys", note: "Pug and oriental toy blood that shortened the muzzle.", img: "/pug-square.jpg", value: 40 }
    ]
  },

  "Pointer": {
    name: "Pointer",
    note: "A lean, fast bird dog that freezes on point to mark hidden game, refined in England from the heavy old Spanish Pointer.",
    children: [
      { name: "English Foxhound", note: "Stamina, drive and a steady temperament.", img: "/history/breeds/english-foxhound.jpg", value: 30 },
      { name: "Greyhound", note: "Speed and a racy, galloping build.", img: "/history/breeds/original-greyhound.jpg", value: 25 },
      { name: "Bloodhound", note: "A deeper nose for finding game.", img: "/history/breeds/Medieval-Bloodhound.jpg", value: 25 },
      { name: "Setter", note: "Setting-dog blood for style and steadiness.", img: "/history/breeds/english_setter-photo.jpg", value: 20 }
    ]
  },

  "English Setter": {
    name: "English Setter",
    note: "An elegant, feathered bird dog that 'sets', crouching low when it scents game, built up from the old setting spaniels.",
    children: [
      { name: "Old setting spaniels", note: "The crouching land spaniels that marked game for the net.", img: "/history/breeds/sussex-spaniel-drawing.jpg", value: 50 },
      { name: "Pointer", note: "Spanish pointer blood for nose and a firm point.", img: "/history/breeds/pointer-photo.jpg", value: 30 },
      { name: "Water spaniels", note: "A little water-spaniel for coat and biddability.", img: "/history/breeds/water-spaniel-illustration.jpg", value: 20 }
    ]
  },

  "Clumber Spaniel": {
    name: "Clumber Spaniel",
    note: "The heaviest, slowest spaniel of all, a stocky white gundog built to push through thick cover, developed at Clumber Park.",
    children: [
      { name: "Land spaniels", note: "The heavy Alpine and old land spaniels at its base.", img: "/history/breeds/norfolk-spaniel-painting.jpg", value: 55 },
      { name: "Basset and heavy hounds", note: "Low, long hound blood, by tradition Basset Hound, for its build and weight.", img: "/history/breeds/bloodhound-photo.jpg", value: 45 }
    ]
  },

  "Cur": {
    name: "Cur",
    note: "Not a breed but a type: the everyday working mongrel of the old farm, used for droving cattle and general work.",
    children: [
      { name: "Herding collies", note: "Sheep- and cattle-droving blood for the work.", img: "/history/breeds/Border_Collie_photo.jpg", value: 55 },
      { name: "Old working bandogs", note: "Tougher guarding and yard-dog stock.", img: "/history/breeds/Old-British-bandogs.jpg", value: 45 }
    ]
  },

  "North Country Beagle": {
    name: "North Country Beagle",
    note: "An extinct, faster, sharper-nosed beagle of northern England, eventually folded into the modern Beagle.",
    children: [
      { name: "Southern Hound", note: "The deep-nosed southern hare-hound stock at its core.", img: "/history/breeds/Southern-Hound.jpg", value: 60 },
      { name: "Talbot hound", note: "The white Norman hound in the background.", img: "/history/breeds/talbot-hound.jpg", value: 40 }
    ]
  },

  "Old Welsh Grey Sheepdog": {
    name: "Old Welsh Grey Sheepdog",
    note: "An old shaggy grey herding dog of the Welsh hills, a hardy native worker now largely lost.",
    children: [
      { name: "Old Welsh herding collies", note: "The native working herding stock of Wales.", img: "/history/breeds/Border_Collie_photo.jpg", value: 60 },
      { name: "Shaggy upland herders", note: "Rough-coated hill dogs of the same old type.", img: "/history/breeds/bearded-collie-photo.jpg", value: 40 }
    ]
  },

  "Maltese": {
    name: "Maltese",
    note: "An ancient white lapdog of the Mediterranean, a favourite of Roman ladies and prized for over two thousand years.",
    children: [
      { name: "Ancient Spitz-type dogs", note: "The small spitz-type dogs many historians see as its oldest ancestors, bred down in size over centuries.", img: "/Pomeranian-square.jpg", value: 55 },
      { name: "Mediterranean bichon lapdogs", note: "The old white bichon-family lapdogs spread around the Mediterranean by ancient traders.", img: "/bichon-square.jpg", value: 45 }
    ]
  },

  "Bichon Frise": {
    name: "Bichon Frise",
    note: "A fluffy white charmer of the Mediterranean bichon family, carried between ports by sailors and later a favourite in the French court.",
    children: [
      { name: "Barbet water dogs", note: "The curly Barbet, the water dog the little 'barbichon' dogs were bred down from.", img: "/history/breeds/water-spaniel-illustration.jpg", value: 50 },
      { name: "Mediterranean bichon lapdogs", note: "The old white lapdogs of Malta, Bologna and Tenerife that make up the bichon family.", img: "/maltese-squares.png", value: 50 }
    ]
  },

  "Poodle": {
    name: "Poodle",
    note: "Now a clever companion and show dog, but built as a water-retrieving gundog. The name comes from the German 'Pudel', meaning to splash about.",
    children: [
      { name: "Old European water dogs", note: "The rough water-retrieving dogs of Germany and France that fetched waterfowl for hunters.", img: "/history/breeds/englsih-Fishermen-water-dog-illustration.jpg", value: 55 },
      { name: "Barbet and water spaniels", note: "The curly-coated Barbet, the old water dog at the root of the whole poodle and bichon family.", img: "/history/breeds/water-spaniel-illustration.jpg", value: 45 }
    ]
  },

  "Pug": {
    name: "Pug",
    note: "A comical, flat-faced toy from ancient China, bred as a companion for emperors before Dutch traders carried it to Europe.",
    children: [
      { name: "Ancient Chinese toy dogs", note: "The old Chinese flat-faced lapdogs kept in the imperial court alongside the Pekingese and lion dogs.", img: "/pug-square.jpg", value: 60 },
      { name: "Eastern lion and lap dogs", note: "The wider family of small eastern companion dogs it shares its roots with.", img: "/Pomeranian-square.jpg", value: 40 }
    ]
  },
  "Great Dane": {
    name: "Great Dane",
    note: "Germany's giant boarhound, the Deutsche Dogge, built by crossing heavy war mastiffs with tall, fast coursing hounds.",
    children: [
      { name: "Mastiff and Alaunt war dogs", note: "The heavy Molosser war and hunting dogs that gave it bulk, bone and a fearless front.", img: "/history/breeds/Mastiff-and-Alaunt-war-dogs.jpg", value: 50 },
      { name: "Irish Wolfhound", note: "Tall coursing hounds crossed in for height, reach and the speed to pull down boar.", value: 30 },
      { name: "Old German boarhounds", note: "The regional hunting packs that did the real boar work before the breed was fixed.", value: 20 }
    ]
  },
  "Saint Bernard": {
    name: "Saint Bernard",
    note: "The Alpine rescue dog of the Great St Bernard hospice, grown from Roman farm mastiffs and later thickened with Newfoundland blood.",
    children: [
      { name: "Alpine mastiff farm dogs", note: "The heavy Roman descended valley dogs, the Sennenhund stock, kept for farm and guard work.", value: 55 },
      { name: "Newfoundland landrace dogs", note: "Crossed in during the 1800s after hard winters thinned the hospice line, adding size and coat.", img: "/history/breeds/original-Newfoundland-illustration.jpg", value: 25 },
      { name: "Ancient Molossers", note: "The old war dog root every European mastiff traces back to.", img: "/history/breeds/Ancient-Molossers.jpg", value: 20 }
    ]
  },
  "Afghan Hound": {
    name: "Afghan Hound",
    note: "An ancient sighthound from the mountains of Afghanistan, coated long against the cold, one of the oldest coursing lines there is.",
    children: [
      { name: "Ancient eastern sighthounds", note: "The slender desert coursing dogs of the old Silk Road, its deepest root.", img: "/history/breeds/Ancient-eastern-sighthounds.jpg", value: 65 },
      { name: "Mountain coursing hounds", note: "The high altitude hunting dogs that gave it the heavy coat and big feet for rough ground.", value: 35 }
    ]
  },
  "Weimaraner": {
    name: "Weimaraner",
    note: "The grey ghost, a noble gun dog from the Weimar court of Germany, built on old scent trailing and pointing stock.",
    children: [
      { name: "Bloodhound", note: "The heavy German scent trailing hounds, the leithund, behind its nose and tracking drive.", value: 40 },
      { name: "Pointer", note: "Continental pointing dogs crossed in for the upright, birdy hunting style.", value: 40 },
      { name: "Old German hunting dogs", note: "The all round hunters of the Weimar estates that the courtiers refined into one type.", value: 20 }
    ]
  },
  "Dalmatian": {
    name: "Dalmatian",
    note: "The spotted coach dog, named for Dalmatia on the Adriatic coast, bred to trot for miles beside a carriage.",
    children: [
      { name: "Ancient spotted hounds", note: "The old spotted hunting dogs pictured across Europe and the Mediterranean for centuries.", value: 55 },
      { name: "Pointer", note: "Pointing and hound blood that shaped its build and steady working head.", value: 30 },
      { name: "Carriage guard dogs", note: "The road dogs kept to run with the horses and mind the coach, the job it was made for.", value: 15 }
    ]
  },
  "Rottweiler": {
    name: "Rottweiler",
    note: "The butcher's dog of Rottweil, descended from the drover mastiffs the Roman legions marched over the Alps.",
    children: [
      { name: "Ancient Molossers", note: "The Roman drover and war mastiffs left in the region, the breed's deepest root.", img: "/history/breeds/Ancient-Molossers.jpg", value: 60 },
      { name: "Local German cattle dogs", note: "The herding farm dogs of the Wurttemberg valleys it was crossed with to make a steady drover.", value: 40 }
    ]
  },
  "Basset Hound": {
    name: "Basset Hound",
    note: "A low set French scenthound bred short in the leg on purpose, so hunters could keep up with it on foot.",
    children: [
      { name: "Bloodhound", note: "The St Hubert scent trailing line behind its nose, long ears and deep voice.", value: 55 },
      { name: "Basset Artesien Normand", note: "The French basset breed behind it, later crossed with Bloodhound to make the heavier English Basset.", img: "/history/breeds/Basset-Artesien-Normand.jpg", value: 45 }
    ]
  },
  "Italian Greyhound": {
    name: "Italian Greyhound",
    note: "A sighthound shrunk to a lapdog in ancient Italy, all the speed in miniature, kept for warmth and company.",
    children: [
      { name: "Ancient eastern sighthounds", note: "The small Mediterranean coursing dogs it descends from, prized since antiquity.", img: "/history/breeds/Ancient-eastern-sighthounds.jpg", value: 65 },
      { name: "Companion miniaturisation", note: "Generations of breeding for the smallest, most elegant dogs as court companions.", value: 35 }
    ]
  },
  "Papillon": {
    name: "Papillon",
    note: "The butterfly dog, a tiny continental spaniel with winged ears, a fixture of European courts for 700 years.",
    children: [
      { name: "Continental toy spaniels", note: "The dwarf spaniels of France, Spain and Italy painted on noble laps through the Renaissance.", value: 70 },
      { name: "Old European lapdogs", note: "The wider family of small companion dogs that fed into Europe's toy breeds.", value: 30 }
    ]
  },
  "Siberian Husky": {
    name: "Siberian Husky",
    note: "The sled dog of the Chukchi people of north east Siberia, bred to pull light loads vast distances in brutal cold.",
    children: [
      { name: "Chukchi sled dogs", note: "The endurance team dogs of the Siberian Arctic, the breed almost unchanged from them.", value: 75 },
      { name: "Ancient Arctic spitz", note: "The wider northern spitz family behind the pricked ears, curled tail and dense double coat.", value: 25 }
    ]
  },
  "Shih Tzu": {
    name: "Shih Tzu",
    note: "The lion dog of the Chinese imperial court, made by crossing Tibetan holy dogs with the palace's own toys.",
    children: [
      { name: "Tibetan temple dogs", note: "The small long coated holy dogs of Tibet, the Lhasa line, gifted to the Chinese court.", value: 55 },
      { name: "Ancient Chinese toy dogs", note: "The flat faced palace lapdogs, the Pekingese side, it was bred with behind the walls.", img: "/pug-square.jpg", value: 45 }
    ]
  },
  "Miniature Schnauzer": {
    name: "Miniature Schnauzer",
    note: "A small German farm ratter, the standard schnauzer shrunk with toy blood into a sharp little vermin dog.",
    children: [
      { name: "Standard Schnauzer farm dogs", note: "The wiry German yard and stable dogs it was bred down from.", value: 60 },
      { name: "Affenpinscher", note: "A rough little German monkey faced ratter crossed in to take the size down.", value: 25 },
      { name: "Poodle", note: "A touch of poodle thought to be added for coat and a clever, biddable head.", value: 15 }
    ]
  },
  "Pomeranian": {
    name: "Pomeranian",
    note: "A spitz shrunk to a toy in the Pomerania region, descended from big Arctic sled and herding dogs.",
    children: [
      { name: "Large German spitz", note: "The sturdy Wolfspitz and sled type dogs it was bred down from, many times its size.", value: 75 },
      { name: "Companion miniaturisation", note: "Generations of breeding for ever smaller lap dogs once it reached the royal courts.", value: 25 }
    ]
  },
  "French Bulldog": {
    name: "French Bulldog",
    note: "Born when English lacemakers took their little toy bulldogs to France, where Paris fell for the bat eared result.",
    children: [
      { name: "Bulldog", note: "The English toy bulldogs the Nottingham lace workers carried across to Normandy.", value: 65 },
      { name: "Parisian ratters and terriers", note: "The city ratting dogs of Paris crossed in, thought to fix the upright bat ears.", value: 35 }
    ]
  },
  "Chihuahua": {
    name: "Chihuahua",
    note: "The smallest dog of all, traced to the Techichi companion dogs kept by the peoples of ancient Mexico.",
    children: [
      { name: "Ancient Techichi dogs", note: "The small sacred companion dogs of the Toltec and Aztec, the breed's direct root.", value: 80 },
      { name: "Small imported dogs", note: "Tiny dogs brought by later traders, thought to add coat and the bold, terrier like spark.", value: 20 }
    ]
  },
  "German Shepherd": {
    name: "German Shepherd",
    note: "Standardised from Germany's regional sheep herding dogs into one clever, hard working breed in the 1890s.",
    children: [
      { name: "Thuringian herding dogs", note: "The pricked ear, curl tailed herders of central Germany behind the alert look.", value: 45 },
      { name: "Wurttemberg sheepdogs", note: "The larger, steadier southern herding dogs that gave size and a calm working head.", value: 40 },
      { name: "Old German farm guards", note: "Local farm and guard stock folded in as the breed was fixed to a single type.", value: 15 }
    ]
  },
  "Dachshund": {
    name: "Dachshund",
    note: "The German badger dog, a scenthound bred low and long to follow its quarry straight down into the earth.",
    children: [
      { name: "German bracke scenthounds", note: "The trailing hounds it descends from, dwarfed in the leg to work underground.", value: 60 },
      { name: "Old earth terriers", note: "Terrier type earth dogs thought to add the grit for going to ground after badger and fox.", value: 25 },
      { name: "Bloodhound", note: "A thread of heavy scent hound blood behind the long nose and dogged tracking.", value: 15 }
    ]
  },
};

const MAX_LINEAGE_DEPTH = 5;

// Some circles are labelled with a common name; map it to its lineage key so
// the same history is grafted in wherever the name appears.
const LINEAGE_ALIASES: Record<string, string> = {
  "Jack Russell": "Jack Russell Terrier",
  "Mastiff": "English Mastiff",
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
    const total = sub.children.reduce((sum, c) => sum + (c.value ?? 0), 0) || 1;
    const next = new Set(visited);
    next.add(key);
    const kids = sub.children.map((c) =>
      expandNode({ ...c, value: ((c.value ?? 0) * share) / total }, depth + 1, next),
    );
    const { value: _omit, ...rest } = node;
    return { ...rest, children: kids };
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
  const root = LINEAGE[aliasName(name)];
  if (!root) return null;
  return expandNode({ ...root }, 0, new Set<string>());
}
