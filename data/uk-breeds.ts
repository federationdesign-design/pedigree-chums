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
  // Ancient, then Medieval: split into two strips (owner request, 4 August)
  { name: "Irish Wolfhound", strip: "ancient", era: "Ancient", anchor: 100, note: "Towering ancient Irish hound, bred to hunt wolves and guard halls.", image: "/woldhound-square.jpg", tag: "endangered" },
  // Owner research (4 August): the modern Mastiff and Greyhound are living
  // breeds superseded on the early timelines by the ancient-type records.
  // Each moves to its modern formalisation point: the Mastiff to 1883, when
  // the standard type was refined, and the Greyhound to the 1700s.
  { name: "Mastiff", strip: "late1800", era: "late 1800s", anchor: 1883, note: "Britain's ancient war and guard dog, known since Roman times.", image: "/mastiff-square.jpg", tag: "endangered" },
  { name: "Greyhound", strip: "c1700", era: "1700s", anchor: 1745, note: "The fastest of all dogs, a sighthound in Britain since antiquity.", image: "/greyhound-square.jpg", tag: "in-decline" },
  // The two ancient additions (docs/lineage/BRIEF.md section 4): extinct
  // historical types placed beside their modern descendants. The Mastiff and
  // Greyhound rows above are deliberately untouched.
  { name: "Ancient Mastiff", strip: "ancient", era: "Ancient", anchor: 140, note: "Powerful British guard and hunting dog praised by Roman writers for courage and strength.", image: "/history/breeds/ancient-british-mastiff-type.jpg", tag: "extinct" },
  { name: "Celtic Coursing Hound", strip: "ancient", era: "Ancient", anchor: 190, note: "Swift Celtic sight-hunting dog described by classical writers, an early root of later British and Irish sighthounds.", image: "/history/breeds/ancient-celtic-coursing-hound.jpg", tag: "extinct" },
  // The five foundation records (docs/lineage/BRIEF.md section 3, Batch 3):
  // extinct historical types, flip-only cards under the root-only rule.
  // Referenced by no tree yet; Batches 4 and 5 do the grafting.
  { name: "Celtic Scent Hound", strip: "ancient", era: "Ancient", anchor: 210, note: "Early Celtic tracking hound that followed game by scent, representing the roots of later European scent hounds.", image: "/history/breeds/ancient-celtic-scent-hound.jpg", tag: "extinct" },
  { name: "Livestock Dog", strip: "ancient", era: "Ancient", anchor: 220, note: "Broad early working-dog population used to guard, move and control livestock before named British breeds existed.", image: "/history/breeds/ancient-livestock-dog.jpg", tag: "extinct" },
  // 19 August 2026: medieval strip. era is an honest band label ("Medieval"),
  // never a bare year; anchor is purely an ordering device, never shown to the
  // user, so an anchor must not be read as a researched date. All nine are
  // banded "Medieval". Rache's anchor moved from 1150 to 1160 to break its tie
  // with Scottish Deerhound and give a stable sort.
  { name: "Shepherd's Dog", strip: "medieval", era: "Medieval", anchor: 1050, note: "Practical medieval working dog used to move and protect sheep, forming an early root of Britain's collie families.", image: "/history/breeds/medieval-shepherds-dog.jpg", tag: "extinct" },
  { name: "Drover's Dog", strip: "medieval", era: "Medieval", anchor: 1060, note: "Tough working dog that helped move cattle and sheep over long distances to markets and towns.", image: "/history/breeds/medieval-drover-dog.jpg", tag: "extinct" },
  { name: "Earth Dog", strip: "medieval", era: "Medieval", anchor: 1070, note: "Small, determined hunting and vermin dog that followed quarry underground.", image: "/history/breeds/medieval-earth-dog.jpg", tag: "extinct" },
  { name: "Talbot", strip: "medieval", era: "Medieval", anchor: 1200, note: "White medieval hound, ancestor of the beagle and bloodhound.", image: "/history/breeds/talbot-hound.jpg", tag: "extinct" },

  { name: "Bloodhound", strip: "medieval", era: "Medieval", anchor: 1100, note: "Scent hound famed for a nose that can follow a trail days old.", image: "/bloodhound-square.jpg", tag: "endangered" },
  { name: "Scottish Deerhound", strip: "medieval", era: "Medieval", anchor: 1150, note: "Tall, rough-coated Highland hound bred to course red deer.", image: "/history/breeds/Medieval-Scottish-Deerhound.jpg", tag: "endangered" },

  // The 1500s and 1600s
  // 19 August 2026: c1500 strip. era is an honest band label, never a bare year
  // and never carrying a "c." hedge, since a band already implies approximation;
  // anchor is purely an ordering device, never shown to the user. Turnspit Dog's
  // "c. 1576" became "1500s". Staghound (anchor 1650) and Bearded Collie (1660)
  // sit in this strip deliberately: strip membership is an editorial grouping,
  // not arithmetic.
  { name: "Old English Bulldog", strip: "c1500", era: "1500s", anchor: 1550, note: "Stocky bull-baiting dog, ancestor of today's Bulldog.", image: "/history/breeds/Old-English-Bulldog.jpg", tag: "extinct" },
  { name: "Skye Terrier", strip: "c1500", era: "1500s", anchor: 1560, note: "Long-bodied, long-coated terrier from Scotland's Isle of Skye.", image: "/history/breeds/skye-terrier-photo.webp", tag: "endangered" },
  { name: "English Foxhound", strip: "c1500", era: "1500s", anchor: 1570, note: "Pack hound bred on great estates for the fox hunt.", image: "/history/breeds/english-foxhound.jpg", tag: "in-decline" },
  { name: "Otterhound", strip: "c1500", era: "1500s", anchor: 1575, note: "Web-footed otter-hunting hound, now the rarest native breed.", image: "/history/breeds/otterhound-photo.jpg", tag: "endangered" },
  { name: "Turnspit Dog", strip: "c1500", era: "1500s", anchor: 1576, note: "Short-legged dog bred to run in a wheel and turn the spit.", image: "/history/breeds/Turnspitdog-drawing-remake.jpg", tag: "extinct" },
  { name: "Staghound", strip: "c1500", era: "1600s", anchor: 1650, note: "English pack hound used to hunt red deer.", image: "/history/breeds/staghound.jpg", tag: "extinct" },

  // The 1700s
  { name: "Old English Sheepdog", strip: "c1700", era: "1700s", anchor: 1700, note: "Shaggy West-Country drover, once known as the Bobtail.", image: "/old-english-square.jpg", tag: "endangered" },
  { name: "Scottish Terrier", strip: "c1700", era: "1700s", anchor: 1700, note: "Sturdy Highland earth-dog with a determined streak.", image: "/history/breeds/scottish-terrier-image.jpg", tag: "in-decline" },
  { name: "King Charles Spaniel", strip: "c1700", era: "1700s", anchor: 1710, note: "Royal toy spaniel beloved at the Stuart court.", image: "/history/breeds/king-charles-spaniel-photo.jpg", tag: "endangered" },
  { name: "Pointer", strip: "c1700", era: "1700s", anchor: 1720, note: "Gundog that freezes and 'points' to hidden game birds.", image: "/history/breeds/pointer-photo.jpg", tag: "in-decline" },
  { name: "English Setter", strip: "c1700", era: "1700s", anchor: 1730, note: "Feathered bird dog that 'sets' low before the gun.", image: "/history/breeds/english_setter-photo.jpg", tag: "endangered" },
  { name: "Dandie Dinmont Terrier", strip: "c1700", era: "1700s", anchor: 1740, note: "Distinctive terrier with a soft top-knot, from the Borders.", image: "/history/breeds/dandie-dinmont-terrier.jpg", tag: "endangered" },
  { name: "Clumber Spaniel", strip: "c1700", era: "1700s", anchor: 1750, note: "Heavy, stately gundog spaniel of the English aristocracy.", image: "/history/breeds/clumber-spaniel-photo.jpg", tag: "endangered" },
  { name: "Cur", strip: "c1700", era: "1700s", anchor: 1760, note: "Stumpy-tailed drover's dog that nipped heels and ducked the kick.", image: "/history/breeds/cur-dog.jpg", tag: "extinct" },

  // The early 1800s
  { name: "Beagle", strip: "c1500", era: "1500s", anchor: 1555, note: "Small, merry scent hound bred to hunt rabbit and hare.", image: "/beagle-square.jpg" , tag: "popular" },
  // 19 August 2026: Tweed Water Spaniel moved into the spaniels strip. It is the
  // earliest spaniel in the set and now leads the Spaniel Explosion strip on
  // editorial grounds, alongside the Irish Water Spaniel moved there for the same
  // reason; its earlier "early 1800s" era band (anchor 1810, ahead of the Irish
  // Water Spaniel at 1834) is deliberate, so it sorts first in the strip.
  { name: "Tweed Water Spaniel", strip: "spaniels", era: "early 1800s", anchor: 1810, note: "Border water dog absorbed into the Golden Retriever.", image: "/history/breeds/tweed-water-spaniel.jpg", tag: "extinct" },
  // 19 August 2026: early1800 group era labels reconciled with the file
  // convention. era is an honest band label, never a bare year; anchor is purely
  // an ordering device, never shown to the user, so an anchor must not be read as
  // a researched date. Lurcher (1802) and Longdog (1803) read "1800s" and are now
  // banded as "early 1800s" like the rest of the strip.
  { name: "Manchester Terrier", strip: "early1800", era: "early 1800s", anchor: 1820, note: "Sleek black-and-tan terrier bred to clear city rats.", image: "/history/breeds/manchester-terrior.jpg", tag: "endangered" },
  { name: "Bedlington Terrier", strip: "early1800", era: "early 1800s", anchor: 1825, note: "Lamb-like terrier with surprising grit.", image: "/history/breeds/Bedlington Terrier-photo.jpg", tag: "endangered" },

  // The spaniel explosion
  // 19 August 2026: spaniels group era labels reconciled with the file
  // convention. era is an honest band label, never a bare year; anchor is purely
  // an ordering device, never shown to the user, so an anchor must not be read as
  // a researched date. Every dog here is late 1800s by date (anchors 1870 to
  // 1882), so all seven now read "late 1800s". The group stands as its own strip
  // for editorial reasons, being the Spaniel Explosion, not because it sits in a
  // different period. Toy Trawler Spaniel's anchor moved from 1878 to 1879 to
  // break its tie with Sussex Spaniel and give a stable sort.
  { name: "English Springer Spaniel", strip: "spaniels", era: "late 1800s", anchor: 1870, note: "Tireless gundog that springs game from cover.", image: "/springer-square.jpg", tag: "popular" },
  { name: "Welsh Springer Spaniel", strip: "spaniels", era: "late 1800s", anchor: 1872, note: "Red-and-white Welsh flushing spaniel.", image: "/history/breeds/welsh-springer-spaniel-photo.jpg", tag: "endangered" },
  { name: "Cocker Spaniel", strip: "spaniels", era: "late 1800s", anchor: 1874, note: "Merry spaniel named for flushing woodcock.", image: "/cooker-square.jpg", tag: "popular" },
  { name: "Field Spaniel", strip: "spaniels", era: "late 1800s", anchor: 1876, note: "Elegant working gundog spaniel.", image: "/history/breeds/field-spaniel-photo.jpg", tag: "endangered" },
  { name: "Sussex Spaniel", strip: "spaniels", era: "late 1800s", anchor: 1878, note: "Golden-liver spaniel that works slow and gives tongue.", image: "/history/breeds/Sussex-Spaniel.jpg", tag: "endangered" },
  // 19 August 2026: Irish Water Spaniel moved into the spaniels strip. It is the
  // earliest of the spaniels and leads the Spaniel Explosion strip on editorial
  // grounds; its earlier "mid 1800s" era band (anchor 1834, against the others'
  // 1870 to 1882) is deliberate, so it sorts first in the strip.
  { name: "Irish Water Spaniel", strip: "spaniels", era: "mid 1800s", anchor: 1834, note: "Curly-coated water retriever with a rat-like tail.", image: "/history/breeds/irish-water-spaniel-photo.jpg", tag: "endangered" },
  { name: "Norfolk Spaniel", strip: "spaniels", era: "late 1800s", anchor: 1882, note: "Springer-type spaniel later folded into the English Springer.", image: "/history/breeds/norfolk-spaniel-painting.jpg", tag: "extinct" },

  // The mid-1800s
  // 19 August 2026: mid1800 group era labels reconciled with the file
  // convention. era is an honest band label, never a bare year and never carrying
  // a "c." hedge, since a band already implies approximation; anchor is purely an
  // ordering device, never shown to the user, so an anchor must not be read as a
  // researched date. Jack Russell at anchor 1820, and Fox Terrier, Sealyham and
  // Whippet at 1872 to 1880, sit outside a strict mid-1800s reading but stay in
  // this strip deliberately: strip membership is an editorial grouping, not
  // arithmetic.
  { name: "Jack Russell Terrier", strip: "mid1800", era: "1820s", anchor: 1820, note: "Bold fox-bolting terrier bred by the Reverend John Russell.", image: "/jack-russel-square.jpg", tag: "trending" },
  { name: "Kerry Blue Terrier", strip: "mid1800", era: "1840s", anchor: 1847, note: "Blue-coated Irish all-rounder, first documented in 1847.", image: "/history/breeds/Kerry_Blue_Terrier_photo.jpg", tag: "endangered" },
  { name: "Bull Terrier", strip: "early1800", era: "early 1800s", anchor: 1830, note: "Egg-headed dog from crossing bulldogs with terriers.", image: "/bull-terrier-square37.jpg" , tag: "in-decline" },
  { name: "Staffordshire Bull Terrier", strip: "early1800", era: "early 1800s", anchor: 1832, note: "Bull-and-terrier fighting dog turned devoted family friend.", image: "/staffy-square.jpg", tag: "popular" },
  { name: "Bullmastiff", strip: "mid1800", era: "1860s", anchor: 1866, note: "Powerful night dog bred to pin poachers on Victorian estates.", image: "/history/breeds/Bullmastiff-photo.jpg", tag: "endangered" },
  { name: "Whippet", strip: "mid1800", era: "1880s", anchor: 1880, note: "The 'poor man's racehorse', a miniature coursing sighthound.", image: "/Whippet-square.jpg" , tag: "popular" },
  { name: "Lurcher", strip: "early1800", era: "early 1800s", anchor: 1802, note: "Sighthound crossed with a working dog, the poacher's companion.", image: "/lercher-square.jpg" , tag: "popular" },
  { name: "Longdog", strip: "early1800", era: "early 1800s", anchor: 1803, note: "A cross of two sighthounds, bred purely for speed.", image: "/history/breeds/long-dog-photo.jpg" , tag: "endangered" },
  { name: "English White Terrier", strip: "mid1800", era: "1860s", anchor: 1860, note: "Show terrier of the 1860s that died out within decades.", image: "/history/breeds/english-white-terrier-painting.jpg", tag: "extinct" },
  { name: "Yorkshire Terrier", strip: "mid1800", era: "1860s", anchor: 1863, note: "Mill-town ratter that became a glamorous toy.", image: "/yorkshire-square.jpg" , tag: "in-decline" },
  // 19 August 2026: late1800 group era and anchor reconciled with the file
  // convention. era is an honest band label, never a bare year; anchor is purely
  // an ordering device, never shown to the user, so an anchor must not be read as
  // a researched date. The Mastiff's "1883" and the three "1800s" labels
  // (Labrador Retriever, Border Collie, Lancashire Heeler) were coarser or more
  // precise than their neighbours and are now banded consistently as "late
  // 1800s". The Cardigan Welsh Corgi's anchor moved from 1919 to 1880 because
  // 1919 placed it outside its own strip and sorted it after the Pembroke, when
  // the Cardigan is generally held to be the older of the two Welsh corgi types.
  // The Cardigan's claimed deeper antiquity is handled in data/lineage.ts through
  // the Celtic Heeler root rather than by moving it to an earlier strip.
  { name: "West Highland White Terrier", strip: "late1800", era: "late 1800s", anchor: 1870, note: "The plucky white terrier of the Scottish Highlands.", image: "/west-highland-square.jpg" , tag: "in-decline" },
  { name: "Airedale Terrier", strip: "mid1800", era: "1850s", anchor: 1853, note: "The 'King of Terriers', largest of the terrier breeds.", image: "/history/breeds/airedale-terrier-photo.jpg", tag: "in-decline" },
  { name: "Sealyham Terrier", strip: "mid1800", era: "1870s", anchor: 1875, note: "White Welsh terrier bred to take on badgers.", image: "/history/breeds/sealyham-terrier-photo.jpg", tag: "endangered" },
  { name: "Cairn Terrier", strip: "late1800", era: "late 1800s", anchor: 1871, note: "Highland vermin-hunter that flushed prey from rock cairns.", image: "/history/breeds/cairn-terrier-photo.jpg", tag: "in-decline" },
  { name: "Border Terrier", strip: "late1800", era: "late 1800s", anchor: 1874, note: "Tough little fell terrier from the English-Scottish border.", image: "/border terrier-square.jpg" , tag: "popular" },
  { name: "Lakeland Terrier", strip: "late1800", era: "late 1800s", anchor: 1872, note: "Fell-pack terrier from the Lake District.", image: "/history/breeds/lakeland-terrier-photo.jpg", tag: "endangered" },
  { name: "Welsh Terrier", strip: "early1800", era: "early 1800s", anchor: 1805, note: "Black-and-tan Welsh terrier for fox and badger.", image: "/history/breeds/welsh-terrier-photo.jpg", tag: "endangered" },
  { name: "Fox Terrier", strip: "mid1800", era: "1870s", anchor: 1872, note: "Smart white terrier with a full pedigree kept from 1870.", image: "/history/breeds/fox_terrier-img.jpg", tag: "in-decline" },
  { name: "English Toy Terrier", strip: "mid1800", era: "1850s", anchor: 1856, note: "Tiny black-and-tan toy bred down from the ratting terriers.", image: "/history/breeds/English-Toy-Terrier.jpg",  tag: "endangered" },

  // The late 1800s
  { name: "Irish Terrier", strip: "late1800", era: "late 1800s", anchor: 1875, note: "Fiery red terrier, the 'daredevil' of Ireland.", image: "/history/breeds/irish-terrier-photo.jpg", tag: "in-decline" },
  { name: "Soft-Coated Wheaten Terrier", strip: "late1800", era: "late 1800s", anchor: 1876, note: "Silky-coated Irish farm terrier.", image: "/history/breeds/soft-coated--wheaten-terrier-photo.jpg", tag: "endangered" },
  { name: "Glen of Imaal Terrier", strip: "late1800", era: "late 1800s", anchor: 1877, note: "Low-slung Wicklow terrier of great strength.", image: "/history/breeds/glen-of-Imaal-terrier.jpg", tag: "endangered" },
  { name: "Gordon Setter", strip: "late1800", era: "late 1800s", anchor: 1878, note: "Black-and-tan setter from the Scottish Highlands.", image: "/history/breeds/gordon-setter-photo.jpg", tag: "endangered" },
  { name: "Irish Setter", strip: "late1800", era: "late 1800s", anchor: 1879, note: "Flashy red gundog full of energy.", image: "/irish-square.png" , tag: "in-decline" },
  { name: "Basset Hound", strip: "late1800", era: "late 1800s", anchor: 1880, note: "Low-slung scenthound refined in Victorian England.", image: "/basset-square.jpg" , tag: "in-decline" },
  { name: "Curly-Coated Retriever", strip: "mid1800", era: "1850s", anchor: 1850, note: "The oldest retriever breed, with a coat of tight curls.", image: "/history/breeds/Curly-Coated-Retriever-photo.jpg", tag: "endangered" },
  { name: "Flat-Coated Retriever", strip: "mid1800", era: "1850s", anchor: 1854, note: "Glossy gamekeeper's retriever, ever cheerful.", image: "/history/breeds/flatcoated_retriever-photo.jpg" , tag: "endangered" },
  { name: "Labrador Retriever", strip: "late1800", era: "late 1800s", anchor: 1882, note: "From Newfoundland's water dogs to Britain's favourite breed.", image: "/lab-square.jpg", tag: "popular" },
  { name: "Bearded Collie", strip: "c1500", era: "1600s", anchor: 1660, note: "Shaggy, bouncing Scottish herding dog.", image: "/history/breeds/bearded-collie-photo.jpg", tag: "endangered" },
  { name: "Rough Collie", strip: "mid1800", era: "1860s", anchor: 1862, note: "The classic Scottish collie of film and fame.", image: "/history/breeds/rough-collie-photo.jpg", tag: "in-decline" },
  { name: "Border Collie", strip: "late1800", era: "late 1800s", anchor: 1885, note: "The supreme sheepdog, all focus and crouching 'eye'.", image: "/collie-square.jpg" , tag: "popular" },
  { name: "Golden Retriever", strip: "late1800", era: "late 1800s", anchor: 1890, note: "Bred in the Scottish Highlands by Lord Tweedmouth.", image: "/golden-square.jpg", tag: "popular" },
  { name: "Celtic Heeler", strip: "ancient", era: "Ancient", anchor: 900, note: "Low-slung Celtic cattle heeler, forerunner of both Welsh Corgis.", image: "/history/breeds/medieval-corgi.jpg", tag: "extinct" },
  { name: "Cardigan Welsh Corgi", strip: "late1800", era: "late 1800s", anchor: 1880, note: "The older, long-tailed corgi, first shown in 1919.", image: "/history/breeds/Welsh_Corgi_Cardigan-photo.jpg", tag: "endangered" },
  { name: "Pembroke Welsh Corgi", strip: "late1800", era: "late 1800s", anchor: 1891, note: "Short-legged Welsh cattle dog, beloved of the Crown.", image: "/corgi-square.jpg", tag: "trending" },
  { name: "Lancashire Heeler", strip: "late1800", era: "late 1800s", anchor: 1892, note: "Small, agile droving heeler from northern England.", image: "/history/breeds/lancashire-heelers-photo.jpg", tag: "endangered" },

  // The 1900s
  // 19 August 2026: c1900 group era and anchor reconciled with the file
  // convention. era is an honest band label, never a bare year; anchor is purely
  // an ordering device, never shown to the user, so an anchor must not be read as
  // a researched date. Norfolk Terrier moved from anchor 1964 to 1905: 1964 was
  // the Kennel Club split from the Norwich, not the breed's origin. The
  // drop-eared Norwich existed by 1914 and the Norwich was recognised in 1932.
  // This matters because the Lucas Terrier was bred from the Norfolk in the late
  // 1940s, so the parent must sort before the child. Lucas Terrier moved from
  // 1950 to 1948, developed by Sir Jocelyn Lucas at his Ilmer Kennels from small
  // Sealyhams crossed with Norfolk Terriers. Patterdale Terrier's 1950s band is
  // unverified and flagged for a later check.
  { name: "Norwich Terrier", strip: "c1900", era: "early 1900s", anchor: 1900, note: "Small, hardy red terrier with prick ears.", image: "/history/breeds/norwich-terrier-photo.jpg", tag: "endangered" },
  { name: "Bulldog", strip: "mid1800", era: "1850s", anchor: 1858, note: "The wrinkled national symbol, bred down from bull-baiting dogs.", image: "/bulldog-square.jpg", tag: "popular" },
  { name: "Cavalier King Charles Spaniel", strip: "c1900", era: "1920s", anchor: 1925, note: "Sweet-natured toy spaniel reconstructed from old portraits.", image: "/cav-spaniel-square.jpg" , tag: "popular" },
  { name: "Patterdale Terrier", strip: "c1900", era: "1950s", anchor: 1950, note: "Hard-as-nails working fell terrier.", image: "/history/breeds/Patterdale-Terrier-photo.jpg" , tag: "popular" },
  { name: "Lucas Terrier", strip: "c1900", era: "1940s", anchor: 1948, note: "Gentle terrier from crossing the Sealyham and Norfolk.", image: "/history/breeds/Lucas-Terrier-photo.jpg" , tag: "endangered" },
  { name: "Norfolk Terrier", strip: "c1900", era: "early 1900s", anchor: 1905, note: "Drop-eared cousin of the Norwich, split off in 1964.", image: "/history/breeds/Norfolk-Terrier-photo.jpg", tag: "in-decline" },
  { name: "Northern Inuit Dog", strip: "c1900", era: "1980s", anchor: 1985, note: "Wolf-look companion breed developed in the UK.", image: "/history/breeds/Northern Inuit Dog-photo.jpg" , tag: "endangered" },

  // Today's crossbreeds
  // 19 August 2026: era and anchor brought into line with the convention now
  // used across this file. The era field is an honest band label, never a bare
  // year, using forms like "1960s", "late 1800s", "Medieval" and "Ancient". The
  // anchor field is purely an ordering device and is never shown to the user, so
  // an anchor year must not be read as a researched date. The previous crosses
  // anchors of 2000 to 2015 were ordering fiction that contradicted every era
  // label. Cockapoo, Goldendoodle and Labradoodle are researched to the decade;
  // the four 1990s dogs are spaced two years apart only to give a stable sort.
  { name: "Cockapoo", strip: "crosses", era: "1960s", anchor: 1960, note: "Cocker Spaniel crossed with a Poodle; the original 'designer dog'.", image: "/Cockapoo-square.jpg", tag: "trending" },
  { name: "Labradoodle", strip: "crosses", era: "1980s", anchor: 1988, note: "Labrador crossed with a Poodle, first bred as a guide dog.", image: "/Labradoodle-square.jpg", tag: "trending" },
  { name: "Goldendoodle", strip: "crosses", era: "1960s", anchor: 1969, note: "Golden Retriever crossed with a Poodle.", image: "/Goldendoodle-square.jpg", tag: "trending" },
  { name: "Cavapoo", strip: "crosses", era: "1990s", anchor: 1990, note: "Cavalier King Charles Spaniel crossed with a Poodle.", image: "/Cavapoo-square.jpg", tag: "trending" },
  /* The other three crosses that have chum pages of their own (owner request,
     5 August). Notes follow the existing pattern and restate each cross from
     the pack record's own "cross Bred from" line; the era and anchor are a
     best-effort ordering after the four above and are flagged for approval. */
  { name: "Cavachon", strip: "crosses", era: "1990s", anchor: 1992, note: "Cavalier King Charles Spaniel crossed with a Bichon Frise.", image: "/Cavachon-square.jpg", tag: "trending" },
  { name: "Maltipoo", strip: "crosses", era: "1990s", anchor: 1994, note: "Maltese crossed with a Poodle.", image: "/multipoo-square.jpg", tag: "trending" },
  { name: "Jackapoo", strip: "crosses", era: "1990s", anchor: 1996, note: "Jack Russell Terrier crossed with a Poodle.", image: "/jackapoo-square.jpg", tag: "trending" },
  { name: "Celtic Hound", strip: "ancient", era: "Ancient", anchor: 80, note: "Ancient Celtic war and hunting hound, forebear of the Wolfhound.", tag: "extinct", image: "/history/breeds/celtic-hound-remake.jpg" },
  { name: "Rache", strip: "medieval", era: "Medieval", anchor: 1160, note: "Medieval scenting hound that hunted by nose in the pack.", tag: "extinct", image: "/history/breeds/rache.jpg" },
  { name: "Buckhound", strip: "medieval", era: "Medieval", anchor: 1220, note: "Medieval pack hound bred to hunt the smaller fallow buck.", tag: "extinct", image: "/history/breeds/Buckhound-illustration.jpg" },
  { name: "Southern Hound", strip: "medieval", era: "Medieval", anchor: 1300, note: "Heavy, deep-voiced scent hound descended from the Talbot.", tag: "extinct", image: "/history/breeds/Southern-Hound.jpg" },
  { name: "Black and Tan Terrier", strip: "c1700", era: "1700s", anchor: 1710, note: "One of the earliest terriers, ancestor of the fell terriers.", tag: "extinct", image: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg" },
  { name: "North Country Beagle", strip: "c1700", era: "1700s", anchor: 1720, note: "Swift northern hound, bred away into the modern Beagle by 1800.", tag: "extinct", image: "/history/breeds/North-Country-Beagle.jpg" },
  { name: "Old Welsh Grey Sheepdog", strip: "c1700", era: "1700s", anchor: 1740, note: "Shaggy grey Welsh hill herder, kin to the Bearded Collie.", tag: "extinct", image: "/history/breeds/old-welsh-grey-sheepdog.jpg" },
  { name: "Paisley Terrier", strip: "mid1800", era: "1860s", anchor: 1865, note: "Silky Scottish show terrier, forerunner of the Yorkshire Terrier.", tag: "extinct", image: "/history/breeds/Paisley-Terrier=photo.jpg" },
  { name: "Toy Trawler Spaniel", strip: "spaniels", era: "late 1800s", anchor: 1879, note: "Small Victorian companion spaniel bred from the King Charles.", tag: "extinct", image: "/history/breeds/Toy-Trawler-Spaniel.jpg" },
  { name: "Cumberland Sheepdog", strip: "c1900", era: "early 1900s", anchor: 1910, note: "Northern herder folded into the Border Collie in the early 1900s.", image: "/history/breeds/cumberland-sheepdog.jpg", tag: "extinct" },
  { name: "Toy Bulldog", strip: "c1900", era: "early 1900s", anchor: 1914, note: "Miniature Victorian companion Bulldog, last recorded in 1914.", image: "/history/breeds/toy-bulldog.jpg", tag: "extinct" },
  { name: "Dumfriesshire Hound", strip: "c1900", era: "1920s", anchor: 1920, note: "Tall black-and-tan Scottish foxhound of the Galloway hills.", tag: "extinct", image: "/history/breeds/Dumfriesshire-Hound.jpg" },

  // 19 August 2026: 23 extinct British ancestor types that already exist as
  // lineage roots in data/lineage.ts but had no history-strip card. First, these
  // are extinct types rather than recognised breeds: before the nineteenth
  // century dogs were types, not breeds, and each has a documented job role,
  // appearance and temperament. Second, every anchor was computed to sit after
  // the dog's own ancestors and before the dogs it feeds, so the ordering is
  // derived and must not be changed casually; the one exception is Low-slung
  // soldiers' dogs at 1575, set from the Elizabethan Glen of Imaal settlement
  // rather than arithmetic. Third, these anchors are ordering devices, not
  // researched dates: only the era band is shown to the user. Notes and images
  // are taken from each node's lineage entry, trimmed to strip-note length.
  { name: "Old British bandogs", strip: "ancient", era: "Ancient", anchor: 600, note: "Heavy chained guard dogs of old England, set loose at night and worked by butchers and baiters.", image: "/history/breeds/Old-British-bandogs.jpg", tag: "extinct" },
  { name: "Old Highland terriers", strip: "medieval", era: "Medieval", anchor: 1315, note: "The old working-terrier stock of the Highlands that every Scottish terrier springs from.", image: "/history/breeds/Old-Highland-terriers.jpg", tag: "extinct" },
  { name: "Old working collies", strip: "medieval", era: "Medieval", anchor: 1355, note: "The old hill-collie landrace of Scotland and the borders, behind the Rough, Smooth and Border collies.", image: "/history/breeds/Old-working-collies-cluster.jpg", tag: "extinct" },
  { name: "Welsh herding dogs", strip: "medieval", era: "Medieval", anchor: 1375, note: "The old Welsh herding and droving dogs, a long-legged, loose-eyed landrace behind the region's sheep-working breeds.", image: "/history/breeds/Welsh-herding-dogs-cluster.jpg", tag: "extinct" },
  { name: "Old British ratting terriers", strip: "medieval", era: "Medieval", anchor: 1390, note: "The ancient ratting and vermin dogs kept on farms long before breeds were named.", image: "/history/breeds/Old-British-ratting-terriers.jpg", tag: "extinct" },
  { name: "Earth and hunt terriers", strip: "medieval", era: "Medieval", anchor: 1392, note: "Hardy go-to-ground terriers used to bolt fox and badger.", image: "/history/breeds/Earth-and-hunt-terrier.jpg", tag: "extinct" },
  { name: "Old English Black and Tan Terrier", strip: "medieval", era: "Medieval", anchor: 1436, note: "The old British black-and-tan working terrier, the rough ratting stock much of Britain's terrier blood came from.", image: "/history/breeds/Old-English-Black-and-Tan-Terrier.jpg", tag: "extinct" },
  { name: "Land spaniels", strip: "medieval", era: "Medieval", anchor: 1475, note: "The old English land-spaniel stock that every working spaniel springs from.", image: "/history/breeds/original-land-spaniel.jpg", tag: "extinct" },
  { name: "Old Welsh land spaniels", strip: "c1500", era: "1500s", anchor: 1511, note: "The native red-and-white working spaniels of Wales.", image: "/history/breeds/Old-Welsh-land-spaniels.jpg", tag: "extinct" },
  { name: "Basset and heavy hounds", strip: "c1500", era: "1500s", anchor: 1525, note: "Low, long, heavy scenting-hound stock that lent weight and bone to the stouter spaniels.", image: "/history/breeds/basset-and-heavy-hounds.jpg", tag: "extinct" },
  { name: "Low-slung soldiers' dogs", strip: "c1500", era: "late 1500s", anchor: 1575, note: "Short-legged dogs left by Flemish and Hessian soldiers settled in the glen.", image: "/history/breeds/low-slung-soldiers-dogs.jpg", tag: "extinct" },
  { name: "Old toy spaniels", strip: "c1500", era: "1600s", anchor: 1650, note: "The small sporting and lap spaniels of Tudor and Stuart England.", image: "/history/breeds/Old-sporting-toy-spaniels.jpg", tag: "extinct" },
  { name: "Water spaniels", strip: "c1500", era: "1600s", anchor: 1653, note: "The old rough-coated working water spaniels of Britain's rivers and fens.", image: "/history/breeds/original-water-spaniel.jpg", tag: "extinct" },
  { name: "Old Irish water dogs", strip: "c1700", era: "1700s", anchor: 1705, note: "The southern and northern water spaniels of Ireland.", image: "/history/breeds/Old-Irish-water-dog.jpg", tag: "extinct" },
  { name: "Old fell terriers", strip: "c1700", era: "1700s", anchor: 1745, note: "The hardy black-and-tan fox-working terriers of the northern fells.", image: "/history/breeds/Old-fell-terriers-Patterdale-Terrier-Working-hunt-terriers.jpg", tag: "extinct" },
  { name: "Old English White Terrier", strip: "c1700", era: "1700s", anchor: 1760, note: "The white-bodied working terriers bred out of the black-and-tan stock for coat colour.", image: "/history/breeds/english-white-terrier-painting.jpg", tag: "extinct" },
  { name: "Native Irish terriers", strip: "c1700", era: "1700s", anchor: 1787, note: "The old Irish farm-terrier stock shared with the Wheaten and Kerry Blue.", image: "/history/breeds/native-irish-terriers.jpg", tag: "extinct" },
  { name: "English Water Spaniel", strip: "c1700", era: "1700s", anchor: 1790, note: "The native English water spaniel, a working water dog of the fens and rivers.", image: "/history/breeds/original-water-spaniel.jpg", tag: "extinct" },
  { name: "Old hill and bearded collies", strip: "early1800", era: "early 1800s", anchor: 1802, note: "Shaggy upland herding dogs of the same collie family.", image: "/history/breeds/old-hill-and-bearded-collies.jpg", tag: "extinct" },
  { name: "Heavier working spaniels", strip: "early1800", era: "early 1800s", anchor: 1818, note: "Lower, stouter spaniels that gave the Sussex and Clumber their weight and bone.", image: "/history/breeds/heavier-working-spaniel.jpg", tag: "extinct" },
  { name: "Old Scotch Collie", strip: "early1800", era: "early 1800s", anchor: 1825, note: "The old Scottish shepherd's collie, the pre-show hill-herding landrace behind the working border strain.", image: "/history/breeds/Old-Scotch-Collie.jpg", tag: "extinct" },
  { name: "Old Cumberland herding dogs", strip: "early1800", era: "early 1800s", anchor: 1826, note: "Northern English herding dogs from the same border country.", image: "/history/breeds/cumberland-sheepdog-photo.jpg", tag: "extinct" },
  { name: "Old sporting toy spaniels", strip: "mid1800", era: "mid 1800s", anchor: 1865, note: "The longer-muzzled toy spaniels of the older paintings.", image: "/history/breeds/Old-sporting-toy-spaniels.jpg", tag: "extinct" },
];
