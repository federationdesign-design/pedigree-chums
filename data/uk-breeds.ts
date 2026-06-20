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
  tag?: "extinct" | "trending" | "popular" | "endangered" | "in-decline";
};

export const ukBreeds: UKBreed[] = [
  // Ancient to medieval
  { name: "Irish Wolfhound", strip: "ancient-medieval", era: "Ancient", anchor: 100, note: "Towering ancient Irish hound, bred to hunt wolves and guard halls.", image: "/history/breeds/irish-wolfhound-photo.jpg", tag: "endangered" },
  { name: "English Mastiff", strip: "ancient-medieval", era: "Ancient", anchor: 150, note: "Britain's ancient war and guard dog, prized as far back as Roman times.", image: "/history/breeds/english-mastiff-photo.jpg", tag: "endangered" },
  { name: "Greyhound", strip: "ancient-medieval", era: "Ancient", anchor: 200, note: "The fastest of all dogs, a sighthound in Britain since antiquity.", image: "/history/breeds/original-greyhound.jpg", tag: "in-decline" },
  { name: "Talbot", strip: "ancient-medieval", era: "Medieval", anchor: 1200, note: "White medieval hunting hound, ancestor of the beagle and bloodhound.", image: "/history/breeds/talbot-hound.jpg", tag: "extinct" },
  { name: "Cardigan Welsh Corgi", strip: "ancient-medieval", era: "Medieval", anchor: 1250, note: "Ancient Welsh cattle dog, the older of the two corgi breeds.", image: "/history/breeds/Welsh_Corgi_Cardigan-photo.jpg", tag: "endangered" },
  { name: "Bloodhound", strip: "ancient-medieval", era: "Medieval", anchor: 1100, note: "Scent hound famed for a nose that can follow a trail days old.", image: "/history/breeds/Medieval-Bloodhound.jpg", tag: "endangered" },
  { name: "Scottish Deerhound", strip: "ancient-medieval", era: "Medieval", anchor: 1150, note: "Tall, rough-coated Highland hound bred to course red deer.", image: "/history/breeds/Medieval-Scottish-Deerhound.jpg", tag: "endangered" },

  // The 1500s and 1600s
  { name: "Old English Bulldog", strip: "c1500", era: "1500s", anchor: 1550, note: "Stocky bull-baiting dog, ancestor of today's Bulldog.", image: "/history/breeds/Old-English-Bulldog.jpg", tag: "extinct" },
  { name: "Skye Terrier", strip: "c1500", era: "1500s", anchor: 1560, note: "Long-bodied, long-coated terrier from Scotland's Isle of Skye.", image: "/history/breeds/skye-terrier-photo.webp", tag: "endangered" },
  { name: "English Foxhound", strip: "c1500", era: "1500s", anchor: 1570, note: "Pack hound bred on great estates for the fox hunt.", image: "/history/breeds/english-foxhound.jpg", tag: "in-decline" },
  { name: "Otterhound", strip: "c1500", era: "1500s", anchor: 1580, note: "Rough-coated, web-footed scent hound bred to hunt otters; now the rarest native breed.", image: "/history/breeds/otterhound-photo.jpg", tag: "endangered" },
  { name: "Turnspit Dog", strip: "c1500", era: "c. 1576", anchor: 1576, note: "Short-legged dog bred to run inside a wheel and turn the roasting spit.", image: "/history/breeds/Turnspitdog-drawing-remake.jpg", tag: "extinct" },
  { name: "Staghound", strip: "c1500", era: "1600s", anchor: 1650, note: "English pack hound used to hunt red deer.", image: "/history/breeds/staghound.jpg", tag: "extinct" },

  // The 1700s
  { name: "Old English Sheepdog", strip: "c1700", era: "1700s", anchor: 1700, note: "Shaggy West-Country drover, once known as the Bobtail.", image: "/history/breeds/Old-English-Sheepdog.jpg", tag: "endangered" },
  { name: "Scottish Terrier", strip: "c1700", era: "1700s", anchor: 1700, note: "Sturdy Highland earth-dog with a determined streak.", image: "/history/breeds/scottish-terrier-image.jpg", tag: "in-decline" },
  { name: "King Charles Spaniel", strip: "c1700", era: "1700s", anchor: 1710, note: "Royal toy spaniel beloved at the Stuart court.", image: "/history/breeds/king-charles-spaniel-photo.jpg", tag: "endangered" },
  { name: "Pointer", strip: "c1700", era: "1700s", anchor: 1720, note: "Gundog that freezes and 'points' to hidden game birds.", image: "/history/breeds/pointer-photo.jpg", tag: "in-decline" },
  { name: "English Setter", strip: "c1700", era: "1700s", anchor: 1730, note: "Feathered bird dog that 'sets' low before the gun.", image: "/history/breeds/english_setter-photo.jpg", tag: "endangered" },
  { name: "Dandie Dinmont Terrier", strip: "c1700", era: "1700s", anchor: 1740, note: "Distinctive terrier with a soft top-knot, from the Borders.", image: "/history/breeds/dandie-dinmont-terrier-photo.jpeg", tag: "endangered" },
  { name: "Clumber Spaniel", strip: "c1700", era: "1700s", anchor: 1750, note: "Heavy, stately gundog spaniel of the English aristocracy.", image: "/history/breeds/clumber-spaniel-photo.jpg", tag: "endangered" },
  { name: "Cur", strip: "c1700", era: "1700s", anchor: 1760, note: "Stumpy-tailed drover's dog that nipped cattle heels and ducked the kick.", image: "/history/breeds/cur-dog.jpg", tag: "extinct" },

  // The early 1800s
  { name: "Beagle", strip: "c1500", era: "1500s", anchor: 1555, note: "Small, merry scent hound bred to hunt rabbit and hare.", image: "/history/breeds/beagle.jpg" },
  { name: "Tweed Water Spaniel", strip: "early1800", era: "early 1800s", anchor: 1810, note: "Border water dog absorbed into the Golden Retriever.", image: "/history/breeds/water-spaniel-illustration.jpg", tag: "extinct" },
  { name: "Manchester Terrier", strip: "early1800", era: "early 1800s", anchor: 1820, note: "Sleek black-and-tan terrier bred to clear city rats.", image: "/history/breeds/manchester-terrior.jpg", tag: "endangered" },
  { name: "Bedlington Terrier", strip: "early1800", era: "early 1800s", anchor: 1825, note: "Lamb-like terrier with surprising grit.", image: "/history/breeds/Bedlington Terrier-photo.jpg", tag: "endangered" },

  // The spaniel explosion
  { name: "English Springer Spaniel", strip: "spaniels", era: "1800s", anchor: 1870, note: "Tireless gundog that springs game from cover.", image: "/history/breeds/english-springer-spaniel-photo.jpg", tag: "popular" },
  { name: "Welsh Springer Spaniel", strip: "spaniels", era: "1800s", anchor: 1872, note: "Red-and-white Welsh flushing spaniel.", image: "/history/breeds/welsh-springer-spaniel-photo.jpg", tag: "endangered" },
  { name: "Cocker Spaniel", strip: "spaniels", era: "1800s", anchor: 1874, note: "Merry spaniel named for flushing woodcock.", image: "/history/breeds/cocker_spaniel-photo.jpg", tag: "popular" },
  { name: "Field Spaniel", strip: "spaniels", era: "1800s", anchor: 1876, note: "Elegant working gundog spaniel.", image: "/history/breeds/field-spaniel-photo.jpg", tag: "endangered" },
  { name: "Sussex Spaniel", strip: "spaniels", era: "1800s", anchor: 1878, note: "Golden-liver spaniel that works slow and gives tongue.", image: "/history/breeds/sussex-spaniel-drawing.jpg", tag: "endangered" },
  { name: "Irish Water Spaniel", strip: "mid1800", era: "1830s", anchor: 1834, note: "Curly-coated water retriever with a rat-like tail.", image: "/history/breeds/irish-water-spaniel.jpg", tag: "endangered" },
  { name: "Norfolk Spaniel", strip: "spaniels", era: "1800s", anchor: 1882, note: "Springer-type spaniel later folded into the English Springer.", image: "/history/breeds/norfolk-spaniel-painting.jpg", tag: "extinct" },

  // The mid-1800s
  { name: "Jack Russell Terrier", strip: "mid1800", era: "c. 1820s", anchor: 1820, note: "Bold fox-bolting terrier bred by the Reverend John Russell.", image: "/history/breeds/jack_russell_terrier_photo.jpg", tag: "trending" },
  { name: "Kerry Blue Terrier", strip: "mid1800", era: "1847", anchor: 1847, note: "Blue-coated Irish all-rounder, first documented in 1847.", image: "/history/breeds/Kerry_Blue_Terrier_photo.jpg", tag: "endangered" },
  { name: "Bull Terrier", strip: "early1800", era: "early 1800s", anchor: 1830, note: "Egg-headed dog from crossing bulldogs with terriers.", image: "/history/breeds/Bull-Terrier-photo.jpg" },
  { name: "Staffordshire Bull Terrier", strip: "early1800", era: "early 1800s", anchor: 1832, note: "Bull-and-terrier fighting dog turned devoted family friend.", image: "/history/breeds/staffordshire-bull-terrier-photo.jpg", tag: "popular" },
  { name: "Bullmastiff", strip: "mid1800", era: "1860s", anchor: 1866, note: "Powerful night dog bred to pin poachers on Victorian estates.", image: "/history/breeds/Bullmastiff-photo.jpg", tag: "endangered" },
  { name: "Whippet", strip: "mid1800", era: "1880s", anchor: 1880, note: "The 'poor man's racehorse', a miniature coursing sighthound.", image: "/history/breeds/whippet-photo.jpg" },
  { name: "Lurcher", strip: "early1800", era: "1800s", anchor: 1802, note: "Sighthound crossed with a working dog, the poacher's companion.", image: "/history/breeds/lurcher-photo.jpg" },
  { name: "Longdog", strip: "early1800", era: "1800s", anchor: 1803, note: "A cross of two sighthounds, bred purely for speed.", image: "/history/breeds/long-dog-photo.jpg" },
  { name: "English White Terrier", strip: "mid1800", era: "1860s", anchor: 1860, note: "Show terrier of the 1860s that died out within decades.", image: "/history/breeds/english-white-terrier-painting.jpg", tag: "extinct" },
  { name: "Yorkshire Terrier", strip: "mid1800", era: "1860s", anchor: 1863, note: "Mill-town ratter that became a glamorous toy.", image: "/history/breeds/yorkshire-terrier-photo.jpg" },
  { name: "West Highland White Terrier", strip: "mid1800", era: "late 1800s", anchor: 1885, note: "The plucky white terrier of the Scottish Highlands.", image: "/history/breeds/west-highland-white-terrier-photo.jpg" },
  { name: "Airedale Terrier", strip: "mid1800", era: "1850s", anchor: 1853, note: "The 'King of Terriers', largest of the terrier breeds.", image: "/history/breeds/airedale-terrier-photo.jpg", tag: "in-decline" },
  { name: "Sealyham Terrier", strip: "mid1800", era: "1870s", anchor: 1875, note: "White Welsh terrier bred to take on badgers.", image: "/history/breeds/sealyham-terrier-photo.jpg", tag: "endangered" },
  { name: "Cairn Terrier", strip: "mid1800", era: "late 1800s", anchor: 1888, note: "Highland vermin-hunter that flushed prey from rock cairns.", image: "/history/breeds/cairn-terrier-photo.jpg", tag: "in-decline" },
  { name: "Border Terrier", strip: "late1800", era: "late 1800s", anchor: 1874, note: "Tough little fell terrier from the English-Scottish border.", image: "/history/breeds/border-terrier-photo.jpg" },
  { name: "Lakeland Terrier", strip: "mid1800", era: "late 1800s", anchor: 1891, note: "Fell-pack terrier from the Lake District.", image: "/history/breeds/lakeland-terrier-photo.jpg", tag: "endangered" },
  { name: "Welsh Terrier", strip: "early1800", era: "early 1800s", anchor: 1805, note: "Black-and-tan Welsh terrier for fox and badger.", image: "/history/breeds/welsh-terrier-photo.jpg", tag: "endangered" },
  { name: "Fox Terrier", strip: "mid1800", era: "1870s", anchor: 1872, note: "Smart white terrier with a full pedigree kept from 1870.", image: "/history/breeds/fox_terrier-img.jpg", tag: "in-decline" },
  { name: "English Toy Terrier", strip: "mid1800", era: "1850s", anchor: 1856, note: "Tiny black-and-tan toy bred down from the ratting terriers.", image: "/history/breeds/english-toy-terrier-photo.jpg", tag: "endangered" },

  // The late 1800s
  { name: "Irish Terrier", strip: "late1800", era: "late 1800s", anchor: 1875, note: "Fiery red terrier, the 'daredevil' of Ireland.", image: "/history/breeds/irish-terrier-photo.jpg", tag: "in-decline" },
  { name: "Soft-Coated Wheaten Terrier", strip: "late1800", era: "late 1800s", anchor: 1876, note: "Silky-coated Irish farm terrier.", image: "/history/breeds/soft-coated--wheaten-terrier-photo.jpg", tag: "endangered" },
  { name: "Glen of Imaal Terrier", strip: "late1800", era: "late 1800s", anchor: 1877, note: "Low-slung Wicklow terrier of great strength.", image: "/history/breeds/glen-of-Imaal-terrier.jpg", tag: "endangered" },
  { name: "Gordon Setter", strip: "late1800", era: "late 1800s", anchor: 1878, note: "Black-and-tan setter from the Scottish Highlands.", image: "/history/breeds/gordon-setter-photo.jpg", tag: "endangered" },
  { name: "Irish Setter", strip: "late1800", era: "late 1800s", anchor: 1879, note: "Flashy red gundog full of energy.", image: "/history/breeds/irish-setter-photo.jpg" },
  { name: "Curly-Coated Retriever", strip: "mid1800", era: "1850s", anchor: 1850, note: "The oldest retriever breed, with a coat of tight curls.", image: "/history/breeds/Curly-Coated-Retriever-photo.jpg", tag: "endangered" },
  { name: "Flat-Coated Retriever", strip: "mid1800", era: "1850s", anchor: 1854, note: "Glossy gamekeeper's retriever, ever cheerful.", image: "/history/breeds/flatcoated_retriever-photo.jpg" },
  { name: "Labrador Retriever", strip: "late1800", era: "1800s", anchor: 1882, note: "From Newfoundland's water dogs to Britain's favourite breed.", image: "/history/breeds/Labrador-retriever-photo.jpg", tag: "popular" },
  { name: "Bearded Collie", strip: "c1500", era: "1600s", anchor: 1660, note: "Shaggy, bouncing Scottish herding dog.", image: "/history/breeds/bearded-collie-photo.jpg", tag: "endangered" },
  { name: "Rough Collie", strip: "mid1800", era: "1860s", anchor: 1862, note: "The classic Scottish collie of film and fame.", image: "/history/breeds/rough-collie-photo.jpg", tag: "in-decline" },
  { name: "Border Collie", strip: "late1800", era: "1800s", anchor: 1885, note: "The supreme sheepdog, all focus and crouching 'eye'.", image: "/history/breeds/Border_Collie_photo.jpg" },
  { name: "Golden Retriever", strip: "late1800", era: "late 1800s", anchor: 1890, note: "Bred in the Scottish Highlands by Lord Tweedmouth.", image: "/history/breeds/golden-retriever-photo.jpg", tag: "popular" },
  { name: "Pembroke Welsh Corgi", strip: "late1800", era: "late 1800s", anchor: 1891, note: "Short-legged Welsh cattle dog, beloved of the Crown.", image: "/history/breeds/Pembroke-Welsh-Corgi-photo.jpg", tag: "trending" },
  { name: "Lancashire Heeler", strip: "late1800", era: "1800s", anchor: 1892, note: "Small, agile droving heeler from northern England.", image: "/history/breeds/lancashire-heelers-photo.jpg", tag: "endangered" },

  // The 1900s
  { name: "Norwich Terrier", strip: "c1900", era: "early 1900s", anchor: 1900, note: "Small, hardy red terrier with prick ears.", image: "/history/breeds/norwich-terrier-photo.jpg", tag: "endangered" },
  { name: "Bulldog", strip: "mid1800", era: "mid-1800s", anchor: 1840, note: "The wrinkled national symbol, bred down from bull-baiting dogs.", image: "/history/breeds/bulldog-image.jpg", tag: "popular" },
  { name: "Cavalier King Charles Spaniel", strip: "c1900", era: "1920s", anchor: 1925, note: "Sweet-natured toy spaniel reconstructed from old portraits.", image: "/history/breeds/cavalier_king_charles_spaniel-photo.jpg" },
  { name: "Patterdale Terrier", strip: "c1900", era: "1900s", anchor: 1950, note: "Hard-as-nails working fell terrier.", image: "/history/breeds/Patterdale-Terrier-photo.jpg" },
  { name: "Lucas Terrier", strip: "c1900", era: "1900s", anchor: 1950, note: "Gentle terrier from crossing the Sealyham and Norfolk.", image: "/history/breeds/Lucas-Terrier-photo.jpg" },
  { name: "Norfolk Terrier", strip: "c1900", era: "1964", anchor: 1964, note: "Drop-eared cousin of the Norwich, split off in 1964.", image: "/history/breeds/Norfolk-Terrier-photo.jpg", tag: "in-decline" },
  { name: "Northern Inuit Dog", strip: "c1900", era: "1980s", anchor: 1985, note: "Wolf-look companion breed developed in the UK.", image: "/history/breeds/Northern Inuit Dog-photo.jpg" },

  // Today's crossbreeds
  { name: "Cockapoo", strip: "crosses", era: "1950s", anchor: 2000, note: "Cocker Spaniel crossed with a Poodle; the original 'designer dog'.", image: "/cockapoo-square.png", tag: "trending" },
  { name: "Labradoodle", strip: "crosses", era: "1980s", anchor: 2005, note: "Labrador crossed with a Poodle, first bred as a guide dog.", image: "/Labradoodle-square.png", tag: "trending" },
  { name: "Goldendoodle", strip: "crosses", era: "1990s", anchor: 2010, note: "Golden Retriever crossed with a Poodle.", image: "/goldendoodle-square.png", tag: "trending" },
  { name: "Cavapoo", strip: "crosses", era: "1990s", anchor: 2012, note: "Cavalier King Charles Spaniel crossed with a Poodle.", image: "/Cavapoo-square.png", tag: "trending" },
  { name: "Celtic Hound", strip: "ancient-medieval", era: "Ancient", anchor: 80, note: "Ancient war and hunting sighthound of the Celtic tribes, remembered as the legendary forebear of the Irish Wolfhound and Scottish Deerhound.", tag: "extinct", image: "/history/breeds/celtic-hound-remake.jpg" },
  { name: "Rache", strip: "ancient-medieval", era: "Medieval", anchor: 1150, note: "Medieval scenting hound that hunted by nose in the pack, an old type whose name fell from use as foxhounds and beagles emerged.", tag: "extinct", image: "/history/breeds/rache.jpg" },
  { name: "Buckhound", strip: "ancient-medieval", era: "Medieval", anchor: 1220, note: "Medieval pack hound bred to hunt the smaller fallow buck, lighter and faster than the great staghounds.", tag: "extinct", image: "/history/breeds/Buckhound-illustration.jpg" },
  { name: "Southern Hound", strip: "ancient-medieval", era: "Medieval", anchor: 1300, note: "Heavy, deep-voiced scent hound descended from the Talbot, absorbed into the foxhound and beagle packs that replaced it.", tag: "extinct", image: "/history/breeds/Southern-Hound.jpg" },
  { name: "Black and Tan Terrier", strip: "c1700", era: "1700s", anchor: 1710, note: "One of the earliest terriers, the working ancestor behind the fell terriers and the Welsh Terrier.", tag: "extinct", image: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg" },
  { name: "North Country Beagle", strip: "c1700", era: "1700s", anchor: 1720, note: "Swift northern hunting hound bred away into the modern Beagle by the early 1800s.", tag: "extinct", image: "/history/breeds/North-Country-Beagle.jpg" },
  { name: "Old Welsh Grey Sheepdog", strip: "c1700", era: "1700s", anchor: 1740, note: "Shaggy grey Welsh hill herder, close kin to the Bearded Collie, lost as smooth-coated collies took the farms.", tag: "extinct", image: "/history/breeds/Old-Welsh-Grey-Sheepdog.jpg" },
  { name: "Paisley Terrier", strip: "mid1800", era: "1860s", anchor: 1865, note: "Silky-coated Scottish show terrier bred from the Skye Terrier, and the direct forerunner of the Yorkshire Terrier.", tag: "extinct", image: "/history/breeds/Paisley-Terrier=photo.jpg" },
  { name: "Toy Trawler Spaniel", strip: "spaniels", era: "1800s", anchor: 1878, note: "Small Victorian companion spaniel bred down from the early King Charles and the old Sussex Spaniel.", tag: "extinct", image: "/history/breeds/toy-Trawler-Spaniel-painting.jpg" },
  { name: "Cumberland Sheepdog", strip: "c1900", era: "Early 1900s", anchor: 1910, note: "Northern herding dog folded into the Border Collie in the early 1900s, also claimed as an Australian Shepherd ancestor.", tag: "extinct", image: "/history/breeds/cumberland-sheepdog-photo.jpg" },
  { name: "Toy Bulldog", strip: "c1900", era: "to 1914", anchor: 1914, note: "Miniature Bulldog kept as a Victorian companion, last recorded in 1914 after the French Bulldog eclipsed it.", tag: "extinct", image: "/history/breeds/toy-bulldog-illustration.jpg" },
  { name: "Dumfriesshire Hound", strip: "c1900", era: "1920s", anchor: 1920, note: "Tall black-and-tan Scottish foxhound of the Galloway hills, its Lockerbie pack disbanded in 2001 with bloodlines left only in France.", tag: "extinct", image: "/history/breeds/Dumfriesshire-Hound.jpg" },
];
