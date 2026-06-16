// UK / Irish dog breeds for the history-page timeline.
// `anchor` is an approximate numeric year used only for left-to-right sorting;
// `era` is what we actually display (ancient breeds get an era label, not a
// false precise year). `tag` marks extinct breeds and modern crosses.
// `image` is the pack's square art where we have it; otherwise a dog icon shows.

export type UKBreed = {
  name: string;
  era: string;
  anchor: number;
  note: string;
  image?: string;
  tag?: "extinct" | "cross";
};

export const ukBreeds: UKBreed[] = [
  // Ancient
  { name: "Irish Wolfhound", era: "Ancient", anchor: 100, note: "Towering ancient Irish hound, bred to hunt wolves and guard halls.", image: "/irish-square.png" },
  { name: "English Mastiff", era: "Ancient", anchor: 150, note: "Britain's ancient war and guard dog, prized as far back as Roman times." },
  { name: "Greyhound", era: "Ancient", anchor: 200, note: "The fastest of all dogs, a sighthound in Britain since antiquity." },

  // Medieval
  { name: "Talbot", era: "Medieval", anchor: 1200, note: "White medieval hunting hound, ancestor of the beagle and bloodhound.", tag: "extinct" },
  { name: "Cardigan Welsh Corgi", era: "Medieval", anchor: 1250, note: "Ancient Welsh cattle dog, the older of the two corgi breeds.", image: "/corgi-square.png" },
  { name: "Bloodhound", era: "Medieval", anchor: 1300, note: "Scent hound famed for a nose that can follow a trail days old.", image: "/bloodhound-square.png" },
  { name: "Scottish Deerhound", era: "Medieval", anchor: 1350, note: "Tall, rough-coated Highland hound bred to course red deer." },

  // 1500s–1600s
  { name: "Old English Bulldog", era: "1500s", anchor: 1550, note: "Stocky bull-baiting dog, ancestor of today's Bulldog.", tag: "extinct" },
  { name: "Skye Terrier", era: "1500s", anchor: 1560, note: "Long-bodied, long-coated terrier from Scotland's Isle of Skye." },
  { name: "English Foxhound", era: "1500s", anchor: 1570, note: "Pack hound bred on great estates for the fox hunt." },
  { name: "Otterhound", era: "1500s", anchor: 1580, note: "Rough-coated, web-footed scent hound bred to hunt otters." },
  { name: "Turnspit Dog", era: "c. 1576", anchor: 1576, note: "Short-legged dog bred to run inside a wheel and turn the roasting spit.", tag: "extinct" },
  { name: "Staghound", era: "1600s", anchor: 1650, note: "English pack hound used to hunt red deer.", tag: "extinct" },

  // 1700s
  { name: "Old English Sheepdog", era: "1700s", anchor: 1700, note: "Shaggy West-Country drover, once known as the Bobtail.", image: "/old-english-square.png" },
  { name: "Scottish Terrier", era: "1700s", anchor: 1700, note: "Sturdy Highland earth-dog with a determined streak.", image: "/scotty-square.png" },
  { name: "King Charles Spaniel", era: "1700s", anchor: 1710, note: "Royal toy spaniel beloved at the Stuart court." },
  { name: "Pointer", era: "1700s", anchor: 1720, note: "Gundog that freezes and 'points' to hidden game birds." },
  { name: "English Setter", era: "1700s", anchor: 1730, note: "Feathered bird dog that 'sets' low before the gun." },
  { name: "Dandie Dinmont Terrier", era: "1700s", anchor: 1740, note: "Distinctive terrier with a soft top-knot, from the Borders." },
  { name: "Clumber Spaniel", era: "1700s", anchor: 1750, note: "Heavy, stately gundog spaniel of the English aristocracy." },
  { name: "Cur", era: "1700s", anchor: 1760, note: "Stumpy-tailed drover's dog that nipped cattle heels and ducked the kick.", tag: "extinct" },

  // 1800s
  { name: "Beagle", era: "c. 1800", anchor: 1800, note: "Small, merry scent hound bred to hunt rabbit and hare.", image: "/beagle-square.png" },
  { name: "Tweed Water Spaniel", era: "early 1800s", anchor: 1810, note: "Border water dog absorbed into the Golden Retriever.", tag: "extinct" },
  { name: "Manchester Terrier", era: "early 1800s", anchor: 1820, note: "Sleek black-and-tan terrier bred to clear city rats." },
  { name: "Bedlington Terrier", era: "early 1800s", anchor: 1825, note: "Lamb-like terrier with surprising grit." },
  { name: "Jack Russell Terrier", era: "mid-1800s", anchor: 1840, note: "Bold fox-bolting terrier bred by the Reverend John Russell." },
  { name: "Kerry Blue Terrier", era: "1847", anchor: 1847, note: "Blue-coated Irish all-rounder, first documented in 1847." },
  { name: "Bull Terrier", era: "1800s", anchor: 1850, note: "Egg-headed dog from crossing bulldogs with terriers." },
  { name: "Staffordshire Bull Terrier", era: "1800s", anchor: 1850, note: "Bull-and-terrier fighting dog turned devoted family friend.", image: "/staffy-square.png" },
  { name: "Bullmastiff", era: "Victorian", anchor: 1860, note: "Powerful night dog bred to pin poachers on Victorian estates." },
  { name: "Whippet", era: "1800s", anchor: 1860, note: "The 'poor man's racehorse', a miniature coursing sighthound.", image: "/whippet-square.png" },
  { name: "Lurcher", era: "1800s", anchor: 1860, note: "Sighthound crossed with a working dog, the poacher's companion.", image: "/Lurcher-square.png" },
  { name: "Longdog", era: "1800s", anchor: 1860, note: "A cross of two sighthounds, bred purely for speed." },
  { name: "English White Terrier", era: "1860s", anchor: 1865, note: "Show terrier of the 1860s that died out within decades.", tag: "extinct" },
  { name: "Yorkshire Terrier", era: "mid-1800s", anchor: 1865, note: "Mill-town ratter that became a glamorous toy.", image: "/yorkshire-square.png" },
  { name: "West Highland White Terrier", era: "mid-1800s", anchor: 1865, note: "The plucky white terrier of the Scottish Highlands.", image: "/scotty-square.png" },
  { name: "Airedale Terrier", era: "mid-1800s", anchor: 1865, note: "The 'King of Terriers', largest of the terrier breeds." },
  { name: "Sealyham Terrier", era: "mid-1800s", anchor: 1865, note: "White Welsh terrier bred to take on badgers." },
  { name: "Cairn Terrier", era: "1800s", anchor: 1870, note: "Highland vermin-hunter that flushed prey from rock cairns." },
  { name: "Border Terrier", era: "1800s", anchor: 1870, note: "Tough little fell terrier from the English-Scottish border." },
  { name: "Lakeland Terrier", era: "1800s", anchor: 1870, note: "Fell-pack terrier from the Lake District." },
  { name: "Welsh Terrier", era: "1800s", anchor: 1870, note: "Black-and-tan Welsh terrier for fox and badger." },
  { name: "Fox Terrier", era: "1800s", anchor: 1870, note: "Smart white terrier with a full pedigree kept from 1870." },
  { name: "Norfolk Spaniel", era: "1800s", anchor: 1870, note: "Springer-type spaniel later folded into the English Springer.", tag: "extinct" },
  { name: "English Springer Spaniel", era: "1800s", anchor: 1875, note: "Tireless gundog that springs game from cover." },
  { name: "Welsh Springer Spaniel", era: "1800s", anchor: 1875, note: "Red-and-white Welsh flushing spaniel." },
  { name: "Cocker Spaniel", era: "1800s", anchor: 1875, note: "Merry spaniel named for flushing woodcock.", image: "/cocker-square.png" },
  { name: "Field Spaniel", era: "1800s", anchor: 1875, note: "Elegant working gundog spaniel." },
  { name: "Sussex Spaniel", era: "1800s", anchor: 1875, note: "Golden-liver spaniel that works slow and gives tongue." },
  { name: "Irish Water Spaniel", era: "mid-1800s", anchor: 1875, note: "Curly-coated water retriever with a rat-like tail." },
  { name: "Irish Terrier", era: "late 1800s", anchor: 1875, note: "Fiery red terrier, the 'daredevil' of Ireland." },
  { name: "Soft-Coated Wheaten Terrier", era: "1800s", anchor: 1875, note: "Silky-coated Irish farm terrier." },
  { name: "Glen of Imaal Terrier", era: "1800s", anchor: 1875, note: "Low-slung Wicklow terrier of great strength." },
  { name: "Gordon Setter", era: "1800s", anchor: 1875, note: "Black-and-tan setter from the Scottish Highlands." },
  { name: "Irish Setter", era: "1800s", anchor: 1875, note: "Flashy red gundog full of energy." },
  { name: "English Toy Terrier", era: "1800s", anchor: 1875, note: "Tiny black-and-tan toy bred down from the ratting terriers." },
  { name: "Curly-Coated Retriever", era: "1800s", anchor: 1880, note: "The oldest retriever breed, with a coat of tight curls." },
  { name: "Flat-Coated Retriever", era: "1800s", anchor: 1880, note: "Glossy gamekeeper's retriever, ever cheerful." },
  { name: "Labrador Retriever", era: "1800s", anchor: 1880, note: "From Newfoundland's water dogs to Britain's favourite breed.", image: "/lab-square.png" },
  { name: "Bearded Collie", era: "1800s", anchor: 1880, note: "Shaggy, bouncing Scottish herding dog." },
  { name: "Rough Collie", era: "1800s", anchor: 1880, note: "The classic Scottish collie of film and fame.", image: "/border-collie-square.png" },
  { name: "Border Collie", era: "1800s", anchor: 1885, note: "The supreme sheepdog, all focus and crouching 'eye'.", image: "/border-collie-square.png" },
  { name: "Golden Retriever", era: "late 1800s", anchor: 1890, note: "Bred in the Scottish Highlands by Lord Tweedmouth.", image: "/golden-square.png" },
  { name: "Pembroke Welsh Corgi", era: "late 1800s", anchor: 1890, note: "Short-legged Welsh cattle dog, beloved of the Crown.", image: "/corgi-square.png" },
  { name: "Lancashire Heeler", era: "1800s", anchor: 1890, note: "Small, agile droving heeler from northern England." },

  // 1900s
  { name: "Norwich Terrier", era: "early 1900s", anchor: 1900, note: "Small, hardy red terrier with prick ears." },
  { name: "Bulldog", era: "early 1900s", anchor: 1900, note: "The wrinkled national symbol, bred down from bull-baiting dogs.", image: "/bulldog-square.png" },
  { name: "Cavalier King Charles Spaniel", era: "1920s", anchor: 1925, note: "Sweet-natured toy spaniel reconstructed from old portraits.", image: "/Cavalier-Spaniel-square.png" },
  { name: "Patterdale Terrier", era: "1900s", anchor: 1950, note: "Hard-as-nails working fell terrier." },
  { name: "Lucas Terrier", era: "1900s", anchor: 1950, note: "Gentle terrier from crossing the Sealyham and Norfolk." },
  { name: "Norfolk Terrier", era: "1964", anchor: 1964, note: "Drop-eared cousin of the Norwich, split off in 1964." },
  { name: "Northern Inuit Dog", era: "1980s", anchor: 1985, note: "Wolf-look companion breed developed in the UK." },

  // Recent crosses (modern end)
  { name: "Cockapoo", era: "1950s", anchor: 2000, note: "Cocker Spaniel crossed with a Poodle; the original 'designer dog'.", image: "/cockapoo-square.png", tag: "cross" },
  { name: "Labradoodle", era: "1980s", anchor: 2005, note: "Labrador crossed with a Poodle, first bred as a guide dog.", image: "/Labradoodle-square.png", tag: "cross" },
  { name: "Goldendoodle", era: "1990s", anchor: 2010, note: "Golden Retriever crossed with a Poodle.", image: "/goldendoodle-square.png", tag: "cross" },
  { name: "Cavapoo", era: "1990s", anchor: 2012, note: "Cavalier King Charles Spaniel crossed with a Poodle.", image: "/Cavapoo-square.png", tag: "cross" },
];
