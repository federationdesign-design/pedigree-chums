// UK / Irish dog breeds for the history-page strips.
// `strip` assigns each breed to one horizontal scroll (set explicitly so the
// groupings are exact, not guessed from dates). `anchor` only orders breeds
// left-to-right within a strip. `era` is the small date shown on each card.
// `tag` marks status: extinct, a modern cross, or an endangered native breed
// (Kennel Club Vulnerable Native / At Watch lists).
// `image` is the pack's square art where we have it; otherwise a dog icon shows.

export type UKBreed = {
  name: string;
  strip: string;
  era: string;
  anchor: number;
  note: string;
  image?: string;
  tag?: "extinct" | "cross" | "endangered";
};

export const ukBreeds: UKBreed[] = [
  // Ancient to medieval
  { name: "Irish Wolfhound", strip: "ancient-medieval", era: "Ancient", anchor: 100, note: "Towering ancient Irish hound, bred to hunt wolves and guard halls.", image: "/irish-square.png" },
  { name: "English Mastiff", strip: "ancient-medieval", era: "Ancient", anchor: 150, note: "Britain's ancient war and guard dog, prized as far back as Roman times.", image: "/history/breeds/english-mastiff.jpg", tag: "endangered" },
  { name: "Greyhound", strip: "ancient-medieval", era: "Ancient", anchor: 200, note: "The fastest of all dogs, a sighthound in Britain since antiquity.", image: "/history/breeds/greyhound.jpg", tag: "endangered" },
  { name: "Talbot", strip: "ancient-medieval", era: "Medieval", anchor: 1200, note: "White medieval hunting hound, ancestor of the beagle and bloodhound.", image: "/history/breeds/talbot-drawing.jpg", tag: "extinct" },
  { name: "Cardigan Welsh Corgi", strip: "ancient-medieval", era: "Medieval", anchor: 1250, note: "Ancient Welsh cattle dog, the older of the two corgi breeds.", image: "/history/breeds/Welsh_Corgi_Cardigan-photo.jpg", tag: "endangered" },
  { name: "Bloodhound", strip: "ancient-medieval", era: "Medieval", anchor: 1100, note: "Scent hound famed for a nose that can follow a trail days old.", image: "/history/breeds/bloodhound.jpg" },
  { name: "Scottish Deerhound", strip: "ancient-medieval", era: "Medieval", anchor: 1150, note: "Tall, rough-coated Highland hound bred to course red deer.", image: "/history/breeds/ScottishDeerhound-photo.avif" },

  // The 1500s and 1600s
  { name: "Old English Bulldog", strip: "c1500", era: "1500s", anchor: 1550, note: "Stocky bull-baiting dog, ancestor of today's Bulldog.", tag: "extinct" },
  { name: "Skye Terrier", strip: "c1500", era: "1500s", anchor: 1560, note: "Long-bodied, long-coated terrier from Scotland's Isle of Skye.", tag: "endangered" },
  { name: "English Foxhound", strip: "c1500", era: "1500s", anchor: 1570, note: "Pack hound bred on great estates for the fox hunt.", tag: "endangered" },
  { name: "Otterhound", strip: "c1500", era: "1500s", anchor: 1580, note: "Rough-coated, web-footed scent hound bred to hunt otters; now the rarest native breed.", tag: "endangered" },
  { name: "Turnspit Dog", strip: "c1500", era: "c. 1576", anchor: 1576, note: "Short-legged dog bred to run inside a wheel and turn the roasting spit.", tag: "extinct" },
  { name: "Staghound", strip: "c1500", era: "1600s", anchor: 1650, note: "English pack hound used to hunt red deer.", tag: "extinct" },

  // The 1700s
  { name: "Old English Sheepdog", strip: "c1700", era: "1700s", anchor: 1700, note: "Shaggy West-Country drover, once known as the Bobtail.", image: "/old-english-square.png", tag: "endangered" },
  { name: "Scottish Terrier", strip: "c1700", era: "1700s", anchor: 1700, note: "Sturdy Highland earth-dog with a determined streak.", image: "/scotty-square.png" },
  { name: "King Charles Spaniel", strip: "c1700", era: "1700s", anchor: 1710, note: "Royal toy spaniel beloved at the Stuart court.", tag: "endangered" },
  { name: "Pointer", strip: "c1700", era: "1700s", anchor: 1720, note: "Gundog that freezes and 'points' to hidden game birds." },
  { name: "English Setter", strip: "c1700", era: "1700s", anchor: 1730, note: "Feathered bird dog that 'sets' low before the gun.", tag: "endangered" },
  { name: "Dandie Dinmont Terrier", strip: "c1700", era: "1700s", anchor: 1740, note: "Distinctive terrier with a soft top-knot, from the Borders.", tag: "endangered" },
  { name: "Clumber Spaniel", strip: "c1700", era: "1700s", anchor: 1750, note: "Heavy, stately gundog spaniel of the English aristocracy.", tag: "endangered" },
  { name: "Cur", strip: "c1700", era: "1700s", anchor: 1760, note: "Stumpy-tailed drover's dog that nipped cattle heels and ducked the kick.", tag: "extinct" },

  // The early 1800s
  { name: "Beagle", strip: "early1800", era: "c. 1800", anchor: 1800, note: "Small, merry scent hound bred to hunt rabbit and hare.", image: "/beagle-square.png" },
  { name: "Tweed Water Spaniel", strip: "early1800", era: "early 1800s", anchor: 1810, note: "Border water dog absorbed into the Golden Retriever.", tag: "extinct" },
  { name: "Manchester Terrier", strip: "early1800", era: "early 1800s", anchor: 1820, note: "Sleek black-and-tan terrier bred to clear city rats.", tag: "endangered" },
  { name: "Bedlington Terrier", strip: "early1800", era: "early 1800s", anchor: 1825, note: "Lamb-like terrier with surprising grit.", tag: "endangered" },

  // The spaniel explosion
  { name: "English Springer Spaniel", strip: "spaniels", era: "1800s", anchor: 1870, note: "Tireless gundog that springs game from cover." },
  { name: "Welsh Springer Spaniel", strip: "spaniels", era: "1800s", anchor: 1872, note: "Red-and-white Welsh flushing spaniel.", tag: "endangered" },
  { name: "Cocker Spaniel", strip: "spaniels", era: "1800s", anchor: 1874, note: "Merry spaniel named for flushing woodcock.", image: "/cocker-square.png" },
  { name: "Field Spaniel", strip: "spaniels", era: "1800s", anchor: 1876, note: "Elegant working gundog spaniel.", tag: "endangered" },
  { name: "Sussex Spaniel", strip: "spaniels", era: "1800s", anchor: 1878, note: "Golden-liver spaniel that works slow and gives tongue.", tag: "endangered" },
  { name: "Irish Water Spaniel", strip: "spaniels", era: "mid-1800s", anchor: 1880, note: "Curly-coated water retriever with a rat-like tail.", tag: "endangered" },
  { name: "Norfolk Spaniel", strip: "spaniels", era: "1800s", anchor: 1882, note: "Springer-type spaniel later folded into the English Springer.", tag: "extinct" },

  // The mid-1800s
  { name: "Jack Russell Terrier", strip: "mid1800", era: "mid-1800s", anchor: 1840, note: "Bold fox-bolting terrier bred by the Reverend John Russell." },
  { name: "Kerry Blue Terrier", strip: "mid1800", era: "1847", anchor: 1847, note: "Blue-coated Irish all-rounder, first documented in 1847.", tag: "endangered" },
  { name: "Bull Terrier", strip: "mid1800", era: "1800s", anchor: 1850, note: "Egg-headed dog from crossing bulldogs with terriers." },
  { name: "Staffordshire Bull Terrier", strip: "mid1800", era: "1800s", anchor: 1851, note: "Bull-and-terrier fighting dog turned devoted family friend.", image: "/staffy-square.png" },
  { name: "Bullmastiff", strip: "mid1800", era: "Victorian", anchor: 1860, note: "Powerful night dog bred to pin poachers on Victorian estates.", tag: "endangered" },
  { name: "Whippet", strip: "mid1800", era: "1800s", anchor: 1860, note: "The 'poor man's racehorse', a miniature coursing sighthound.", image: "/whippet-square.png" },
  { name: "Lurcher", strip: "mid1800", era: "1800s", anchor: 1861, note: "Sighthound crossed with a working dog, the poacher's companion.", image: "/Lurcher-square.png" },
  { name: "Longdog", strip: "mid1800", era: "1800s", anchor: 1862, note: "A cross of two sighthounds, bred purely for speed." },
  { name: "English White Terrier", strip: "mid1800", era: "1860s", anchor: 1865, note: "Show terrier of the 1860s that died out within decades.", tag: "extinct" },
  { name: "Yorkshire Terrier", strip: "mid1800", era: "mid-1800s", anchor: 1865, note: "Mill-town ratter that became a glamorous toy.", image: "/yorkshire-square.png" },
  { name: "West Highland White Terrier", strip: "mid1800", era: "mid-1800s", anchor: 1866, note: "The plucky white terrier of the Scottish Highlands.", image: "/scotty-square.png" },
  { name: "Airedale Terrier", strip: "mid1800", era: "mid-1800s", anchor: 1867, note: "The 'King of Terriers', largest of the terrier breeds.", tag: "endangered" },
  { name: "Sealyham Terrier", strip: "mid1800", era: "mid-1800s", anchor: 1868, note: "White Welsh terrier bred to take on badgers.", tag: "endangered" },
  { name: "Cairn Terrier", strip: "mid1800", era: "1800s", anchor: 1870, note: "Highland vermin-hunter that flushed prey from rock cairns." },
  { name: "Border Terrier", strip: "mid1800", era: "1800s", anchor: 1870, note: "Tough little fell terrier from the English-Scottish border." },
  { name: "Lakeland Terrier", strip: "mid1800", era: "1800s", anchor: 1871, note: "Fell-pack terrier from the Lake District.", tag: "endangered" },
  { name: "Welsh Terrier", strip: "mid1800", era: "1800s", anchor: 1871, note: "Black-and-tan Welsh terrier for fox and badger.", tag: "endangered" },
  { name: "Fox Terrier", strip: "mid1800", era: "1800s", anchor: 1872, note: "Smart white terrier with a full pedigree kept from 1870." },
  { name: "English Toy Terrier", strip: "mid1800", era: "1800s", anchor: 1873, note: "Tiny black-and-tan toy bred down from the ratting terriers.", tag: "endangered" },

  // The late 1800s
  { name: "Irish Terrier", strip: "late1800", era: "late 1800s", anchor: 1875, note: "Fiery red terrier, the 'daredevil' of Ireland.", tag: "endangered" },
  { name: "Soft-Coated Wheaten Terrier", strip: "late1800", era: "late 1800s", anchor: 1876, note: "Silky-coated Irish farm terrier." },
  { name: "Glen of Imaal Terrier", strip: "late1800", era: "late 1800s", anchor: 1877, note: "Low-slung Wicklow terrier of great strength.", tag: "endangered" },
  { name: "Gordon Setter", strip: "late1800", era: "late 1800s", anchor: 1878, note: "Black-and-tan setter from the Scottish Highlands.", tag: "endangered" },
  { name: "Irish Setter", strip: "late1800", era: "late 1800s", anchor: 1879, note: "Flashy red gundog full of energy." },
  { name: "Curly-Coated Retriever", strip: "late1800", era: "1800s", anchor: 1880, note: "The oldest retriever breed, with a coat of tight curls.", tag: "endangered" },
  { name: "Flat-Coated Retriever", strip: "late1800", era: "1800s", anchor: 1881, note: "Glossy gamekeeper's retriever, ever cheerful." },
  { name: "Labrador Retriever", strip: "late1800", era: "1800s", anchor: 1882, note: "From Newfoundland's water dogs to Britain's favourite breed.", image: "/lab-square.png" },
  { name: "Bearded Collie", strip: "late1800", era: "1800s", anchor: 1883, note: "Shaggy, bouncing Scottish herding dog.", tag: "endangered" },
  { name: "Rough Collie", strip: "late1800", era: "1800s", anchor: 1884, note: "The classic Scottish collie of film and fame.", image: "/border-collie-square.png" },
  { name: "Border Collie", strip: "late1800", era: "1800s", anchor: 1885, note: "The supreme sheepdog, all focus and crouching 'eye'.", image: "/border-collie-square.png" },
  { name: "Golden Retriever", strip: "late1800", era: "late 1800s", anchor: 1890, note: "Bred in the Scottish Highlands by Lord Tweedmouth.", image: "/golden-square.png" },
  { name: "Pembroke Welsh Corgi", strip: "late1800", era: "late 1800s", anchor: 1891, note: "Short-legged Welsh cattle dog, beloved of the Crown.", image: "/corgi-square.png" },
  { name: "Lancashire Heeler", strip: "late1800", era: "1800s", anchor: 1892, note: "Small, agile droving heeler from northern England.", tag: "endangered" },

  // The 1900s
  { name: "Norwich Terrier", strip: "c1900", era: "early 1900s", anchor: 1900, note: "Small, hardy red terrier with prick ears.", tag: "endangered" },
  { name: "Bulldog", strip: "c1900", era: "early 1900s", anchor: 1900, note: "The wrinkled national symbol, bred down from bull-baiting dogs.", image: "/bulldog-square.png" },
  { name: "Cavalier King Charles Spaniel", strip: "c1900", era: "1920s", anchor: 1925, note: "Sweet-natured toy spaniel reconstructed from old portraits.", image: "/Cavalier-Spaniel-square.png" },
  { name: "Patterdale Terrier", strip: "c1900", era: "1900s", anchor: 1950, note: "Hard-as-nails working fell terrier." },
  { name: "Lucas Terrier", strip: "c1900", era: "1900s", anchor: 1950, note: "Gentle terrier from crossing the Sealyham and Norfolk." },
  { name: "Norfolk Terrier", strip: "c1900", era: "1964", anchor: 1964, note: "Drop-eared cousin of the Norwich, split off in 1964." },
  { name: "Northern Inuit Dog", strip: "c1900", era: "1980s", anchor: 1985, note: "Wolf-look companion breed developed in the UK." },

  // Today's crossbreeds
  { name: "Cockapoo", strip: "crosses", era: "1950s", anchor: 2000, note: "Cocker Spaniel crossed with a Poodle; the original 'designer dog'.", image: "/cockapoo-square.png", tag: "cross" },
  { name: "Labradoodle", strip: "crosses", era: "1980s", anchor: 2005, note: "Labrador crossed with a Poodle, first bred as a guide dog.", image: "/Labradoodle-square.png", tag: "cross" },
  { name: "Goldendoodle", strip: "crosses", era: "1990s", anchor: 2010, note: "Golden Retriever crossed with a Poodle.", image: "/goldendoodle-square.png", tag: "cross" },
  { name: "Cavapoo", strip: "crosses", era: "1990s", anchor: 2012, note: "Cavalier King Charles Spaniel crossed with a Poodle.", image: "/Cavapoo-square.png", tag: "cross" },
];
