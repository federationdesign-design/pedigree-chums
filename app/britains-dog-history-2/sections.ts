// Copied verbatim from app/britains-dog-history/page.tsx at commit 4a3975e.
// DUPLICATED ON PURPOSE rather than imported: version 2 is a separate route
// that will diverge, and the live page must not be able to break because of
// an edit made here.
//
// `era` is carried through unused. Version 2 has no BreedStrip games by
// decision, but dropping the field would make a later re-add a data edit
// rather than a render one.

export type Section = {
  title: string;
  accent: string;
  era?: string; // which breed-strip era shows above this card
  intro: string;
  bullets: string[];
  // One short title per bullet, same order. Only Medieval has these so far.
  bulletTitles?: string[];
  detail: string;
  facts: { text: string; image?: string }[];
  image: string; // /history/<name>.jpg image path; drop art in later
  // Optional scroll-scrubbed video for the sticky top. `image` stays as the
  // poster, so a section without a video, or one whose video has not landed
  // yet, still shows the photograph.
  video?: string;
  imageAlt: string;
};

export const SECTIONS: Section[] = [
  {
    title: "Britain's First Dogs",
    accent: "First Dogs",
    era: "ancient-medieval",
    intro:
      "Britain's earliest dogs came without breed standards or pedigrees. They were shaped by the jobs people needed doing. Some guarded homes and livestock, some followed scents, others chased deer and hares. Classical writers noticed. Strabo recorded British hunting dogs exported overseas, and Celts were said to use dogs in war.",
    bullets: [
      "Swift Celtic hounds and greyhound-like dogs pursued deer, hares and other fast-moving game by sight.",
      "Medieval scent hounds followed an animal's trail by nose, sometimes working together in organised packs.",
      "Dogs protected settlements, livestock, food stores and property, while some helped control cattle and other farm animals. Roman-period evidence also shows dogs being used to chase vermin from buildings.",
      "Hunting with carefully trained hounds became strongly associated with wealthy landowners, although ordinary households also kept practical working dogs.",
    ],
    bulletTitles: ["Chasers", "Trackers", "Guards", "Status"],
    detail:
      "Several generations later, the Roman writer Arrian described swift Celtic coursing hounds that hunted by sight rather than scent. Medieval Britain developed an even wider world of working hounds. Fast dogs chased deer and hares, powerful dogs guarded homes and animals, and scent hounds followed trails in organised packs. These were dog types, rather than standardised modern breeds, and their names, appearance and purpose could change between regions and centuries.",
    facts: [
      { text: "British hunting dogs were valuable enough to be exported across the Channel almost 2,000 years ago.", image: "/history/acident-main-img.jpg" },
      { text: "Arrian, writing in the Roman period, praised Celtic hounds for speed, spirit and their enthusiasm for chasing hares.", image: "/history/greek-harehound.jpg" },
      { text: "Archaeologists have found dogs of very different sizes in early British settlements, from small animals to dogs approaching wolf size.", image: "/history/breeds/Mastiff-and-Alaunt-war-dogs.jpg" },
      { text: "Medieval pictures often show different dogs doing different jobs, including scent hounds hunting in packs and greyhounds held on leads before the chase.", image: "/history/master-of-the-game.jpg" },
    ],
    // Supplied artwork. The filename says "acident": it is spelled that way on
    // disk, so it is spelled that way here.
    image: "/history/acident-main-img.jpg",
    imageAlt: "Early British working dogs, the hunting and guarding types found before breeds were standardised",
  },
  {
    title: "Medieval and Tudor Britain",
    accent: "Tudor Britain",
    /* NO `era`. Britain's First Dogs above now introduces the ancient and
       medieval dogs and carries their run, so this section follows the carousel
       instead of preceding it. Giving it an era again would put a second run of
       the same dogs on the page. */
    intro:
      "Britain's bond with dogs stretches back deep into the Middle Ages, when hounds were prized hunting partners of kings and nobles. By the Tudor age, dogs had also become beloved companions, doted on at the royal court itself.",
    bullets: [
      "Norman kings set aside up to a third of England as royal forest, where only the king could hunt.",
      "Commoners living near a forest had to have their dogs 'lawed', having three toes chopped off, to stop them chasing the king's game.",
      "By Tudor times, Henry VIII kept spaniels, beagles and greyhounds, and owned sixty-five dog leashes.",
      "Ladies of the court adored their little lapdogs, which they fondly called 'comforters'.",
    ],
    bulletTitles: ["Greedy", "Gruesome", "Lavish", "Lapdogs"],
    detail:
      "The forest laws were among the most resented in medieval England, with even a harmless guard dog lamed simply for living near royal land. Yet within a few centuries the mood had utterly changed. At the Tudor court, Henry VIII's pampered lapdogs wore velvet collars stamped with the gold Tudor rose, and Anne Boleyn doted on a little dog named Purkoy. The dog as a treasured companion, not just a working animal, was already taking shape.",
    facts: [
      { text: "Anne Boleyn so loved her lapdog Purkoy that when he died in a fall, no one at court dared to tell her the news.", image: "/history/purkoy.jpg" },
      { text: "Medieval law valued a dog by its job, with a shepherd's dog, a guard dog and a hunting hound each worth a different sum.", image: "/history/medieval-law.jpg" },
      { text: "Mastiff-type 'bandogs' were chained up by day and let loose at night to guard farms from thieves and even wolves.", image: "/history/bandogs.jpg" },
      { text: "One of the first books written in English, 'The Master of Game' from around 1406, was a guide to hunting hounds and their care.", image: "/history/master-of-the-game.jpg" },
    ],
    image: "/history/medieveal-dogs.jpg",
    video: "/history/medieval-tudor-opt.mp4",
    imageAlt: "Medieval hunting hounds and a Tudor lapdog",
  },
  {
    title: "Dogs in the armed forces",
    accent: "armed forces",
    era: "c1500",
    intro:
      "Dogs have marched alongside British soldiers for centuries, as scouts, messengers, guards and mascots. The most famous of all was a white poodle who became a legend of the English Civil War.",
    bullets: [
      "Boy was a white hunting poodle belonging to the Royalist commander Prince Rupert of the Rhine.",
      "He followed his master onto the battlefield and was killed at the Battle of Marston Moor in 1644.",
      "Royalist soldiers adored him and reportedly gave him the rank of Sergeant-Major-General.",
      "He is often remembered as the first official British Army dog.",
      "Judy, a pointer, survived Japanese prisoner-of-war camps and is the only dog ever officially registered as a POW.",
    ],
    bulletTitles: ["Bravery", "In England", "Glorified", "The 1st dog", "POW WOW BOW"],
    detail:
      "Boy was so well known that enemy pamphlets spread wild rumours about him, claiming the dog had magical powers and could not be harmed by weapons. It was propaganda, of course, and at Marston Moor it proved sadly untrue. Yet the little white poodle had already secured his place in British military memory, the first in a long line of dogs to serve the nation.",
    facts: [
      { text: "Parliamentarian propaganda during the Civil War seriously claimed Prince Rupert's poodle was a witch in disguise.", image: "/history/boy.jpg" },
      { text: "The Dickin Medal, the 'Animal VC', has been awarded to 38 dogs since 1943 for bravery in wartime.", image: "/history/animal-vc.jpg" },
      { text: "Crumstone Irma, a search dog in the London Blitz, helped find 191 people buried in bombed buildings.", image: "/history/crumstone-irma.jpg" },
    ],
    image: "/history/boy-the-poodle.jpg",
    imageAlt: "A 17th-century white poodle beside a Civil War cavalier",
  },
{
    title: "Working roots",
    accent: "roots",
    era: "c1700",
    intro:
      "Long before dogs curled up by the fire, they worked for a living. Across Britain, breeds were shaped by the jobs they were needed to do, and you can still see those jobs written into their bodies and behaviour today.",
    bullets: [
      "Herding breeds like the Border Collie were bred to gather and move livestock across the hills.",
      "Terriers were developed to hunt vermin, going to ground after rats, mice and foxes.",
      "Sighthounds such as the Greyhound and Whippet were built for speed and the chase.",
      "Guarding and droving breeds protected homes and moved cattle to market.",
    ],
    bulletTitles: ["Herding", "Ratting", "Catching", "Guarding"],
    detail:
      "A dog's looks are rarely an accident. The Collie's tireless energy, the terrier's boldness, the sighthound's lean frame: each was honed for a purpose over many generations. Understanding that working past is the key to understanding why breeds behave the way they do, a thread that runs right through the pack.",
    facts: [
      { text: "The word 'terrier' comes from the Latin 'terra', meaning earth, after their habit of digging into burrows to flush out prey.", image: "/history/terra.jpg" },
      { text: "Turnspit dogs were bred to run inside a wheel that turned meat roasting over the kitchen fire.", image: "/history/breeds/Turnspitdog-drawing.jpg" },
      { text: "Drovers' dogs walked cattle and sheep hundreds of miles to market, then often found their own way home.", image: "/history/drovers-dogs.jpg" },
      { text: "Water dogs hauled fishing nets and lines for coastal fishermen, their thick coats built to shrug off the cold.", image: "/history/waterdog.jpg" },
    ],
    image: "/history/working-roots.jpeg",
    imageAlt: "A working sheepdog herding livestock on a British hillside",
  },
  {
    title: "Dogs in London",
    accent: "London",
    era: "early1800",
    intro:
      "In the bustling streets of Victorian London, dogs were not just companions, they were engines of trade. For decades, teams of dogs hauled carts of goods through the capital, until the law stepped in.",
    bullets: [
      "Working dogs pulled small carts of milk, bread, fish and other goods for street traders.",
      "The Metropolitan Police Act of 1839 banned dog-drawn carts within 15 miles of Charing Cross.",
      "A national ban on the public highways followed in 1854.",
      "The campaign against dog-carts helped shape Britain's early animal-welfare laws.",
    ],
    bulletTitles: ["Dog taxis, dog carriages", "London dog ban", "More bans on dogs", "It was for the money"],
    detail:
      "The ban was meant to spare dogs from cruelty and to stop carts spooking horses in crowded streets, but it had a heartbreaking side. With the dogs no longer able to earn their keep, many traders could not afford to feed them, and thousands of working dogs were lost. It was a grim chapter, yet it pushed Britain toward treating dogs as animals deserving of protection.",
    facts: [
      { text: "One estimate suggests the 1839 London ban alone led to the loss of more than 3,000 working dogs almost overnight." },
      { text: "During the Great Plague of 1665, dogs were wrongly blamed for spreading the disease and the city ordered them destroyed.", image: "/history/plague.jpg" },
      { text: "London's dog-catcher killed over 4,000 dogs, which likely made things worse by sparing the rats that truly carried the plague.", image: "/history/plague2.jpg" },
      { text: "Winston Churchill, nicknamed the British Bulldog, in fact kept a brown poodle named Rufus who slept by his bed all through the war.", image: "/history/winston-churchill.jpg" },
    ],
    image: "/history/dog-carts.jpg",
    imageAlt: "A Victorian street trader with a dog-drawn cart in London",
  },
  {
    title: "The Victorian turning point",
    accent: "turning point",
    era: "spaniels",
    intro:
      "If one era turned the British dog from worker to companion, it is the Victorian age. In just a few decades, dogs moved from the farmyard into the drawing room, and modern pet keeping was born.",
    bullets: [
      "Queen Victoria was a devoted dog lover who owned more than eighty dogs across her lifetime.",
      "Her childhood companion was a Cavalier King Charles Spaniel named Dash, painted by royal artists.",
      "Britain held the world's first organised dog show in Newcastle in 1859.",
      "Battersea Dogs Home opened in 1860 and the Kennel Club followed in 1873.",
    ],
    bulletTitles: ["Queeny", "Spaniel", "Dog Show", "Dog Home"],
    detail:
      "Victoria's very public affection for her dogs helped make pet keeping fashionable across society. As the middle classes grew, a well-bred dog became a mark of taste and gentility. The first dog show, the founding of Battersea and the arrival of the Kennel Club all came within a single generation, the moment dogs became companions to be celebrated rather than simply animals to be used.",
    facts: [
      { text: "The first dog show, held in Newcastle in 1859, was tacked on to a poultry show and only allowed Pointers and Setters to compete.", image: "/history/first-dog-show.jpg" },
      { text: "From 1867 every owner had to buy a yearly dog licence, costing seven shillings and sixpence, just to keep a dog.", image: "/history/dog-licence.jpg" },
      { text: "Spratt's began selling the first mass-produced dog biscuits around 1860, the very start of the dog-food industry.", image: "/history/dog-biscuit.jpg" },
      { text: "Dog theft grew so common that thieves snatched pampered pets and sold them back to their owners for a ransom.", image: "/history/Dog-theft.jpg" },
    ],
    image: "/history/portrait-of-dash.jpg",
    imageAlt: "A Victorian lady with a small spaniel companion",
  },
  {
    title: "Dogs in popular culture",
    accent: "culture",
    era: "mid1800",
    intro:
      "Some dogs become more than pets, they become legends. No British dog story is more beloved than that of Greyfriars Bobby, the little terrier whose loyalty captured a nation's heart.",
    bullets: [
      "Bobby was a Skye Terrier belonging to John Gray, a night watchman for the Edinburgh City Police.",
      "After Gray died in 1858, Bobby reportedly refused to leave his master's grave.",
      "The story says he kept watch over the grave for fourteen years until his own death in 1872.",
      "A statue and fountain were raised in his honour, and still draw visitors today.",
    ],
    bulletTitles: ["Terrier", "Loyalty", "Legendary", "Immortalised"],
    detail:
      "Historians gently point out that the tale has grown in the telling, and the details are hard to prove. But whether legend or fact, Bobby became a symbol of the devotion a dog can show, retold in books and films ever since. His statue in Edinburgh remains one of Scotland's best-loved landmarks, a monument to the bond between people and their dogs.",
    facts: [
      { text: "Greyfriars Bobby's headstone reads: 'Let his loyalty and devotion be a lesson to us all.'", image: "/history/greyfriars-bobby.jpg" },
      { text: "Charles Dickens gave the villain Bill Sikes a fearful dog called Bull's-eye in Oliver Twist.", image: "/history/dickens.jpg" },
      { text: "The poet Elizabeth Barrett Browning adored her spaniel Flush, later given his own book by Virginia Woolf.", image: "/history/elizabeth-barrett-browning.jpg" },
      { text: "In Peter Pan, the Darling children's devoted nursemaid Nana is a Newfoundland dog.", image: "/history/peterpan.jpg" },
    ],
    image: "/history/bobby.jpeg",
    imageAlt: "The Greyfriars Bobby statue in Edinburgh",
  },
  {
    title: "Dog shows",
    accent: "shows",
    era: "late1800",
    intro:
      "Once dogs became companions worth celebrating, Britain found a new way to honour them: the dog show. From modest beginnings grew Crufts, the most famous dog show in the world.",
    bullets: [
      "Crufts was founded by showman Charles Cruft and first held in 1891 in Islington, London.",
      "The famous Best in Show title was not introduced until 1928.",
      "The first ever Best in Show winner was a Greyhound named Primley Sceptre.",
      "Crufts is now recognised as the largest dog show in the world.",
    ],
    /* Four now, and the new one is SECOND. Titles pair with bullets by position,
       so three against four had shifted every one up a slot: "Greyhound" was
       sitting on the 1928 fact and the largest-show bullet rendered bare.
       This is the only section that was short. Two others carry five titles and
       they are correct: those have five bullets. */
    bulletTitles: ["He wanted to sell more dog biscuits", "Dog Mecca", "Greyhound", "Tonnes of dogs all in 1 place"],
    detail:
      "Charles Cruft had a genius for promotion, and his show quickly became the highlight of the canine calendar. The arrival of the Best in Show award in 1928 gave the event its crowning moment, and that first winner, a Greyhound chosen from nearly ten thousand competitors, set the tone for a contest that still captivates the nation every spring.",
    facts: [
      { text: "Primley Sceptre, the first Best in Show winner, was picked from an entry of 9,466 dogs and described by the judge as 'faultless'." },
      { text: "Charles Cruft was a travelling salesman for Spratt's dog biscuits, and his show helped sell ever more dog food.", image: "/history/james-spratt.jpg" },
      { text: "The first Crufts in 1891 drew 2,437 dogs across 36 breeds; today around 24,000 dogs take part each year.", image: "/history/breeds/crufts-dogshow.jpg" },
      { text: "Charles Cruft never owned a dog himself, for fear of being seen to favour any one breed." },
    ],
    image: "/history/primley-sceptre.jpeg",
    imageAlt: "A Greyhound being presented in a dog show ring",
  },
  {
    title: "Into the modern home",
    accent: "home",
    era: "c1900",
    intro:
      "Through the twentieth century, the dog's place in British life became firmly domestic. No longer just workers or status symbols, dogs settled in as everyday members of the household.",
    bullets: [
      "Dogs became fixtures of family photographs, holidays and daily routines.",
      "Veterinary care, commercial dog food and training advice grew into established industries.",
      "Breeds rose and fell in popularity as fashions and lifestyles changed.",
      "The dog moved from the yard to the hearth, and often to the foot of the bed.",
    ],
    bulletTitles: ["Dogs upstairs", "Dog Doctors", "Dogs as Fashion", "A Dogs Life"],
    detail:
      "As Britain became more urban and homes grew more comfortable, dogs came indoors for good. The relationship deepened from usefulness into genuine companionship. By the end of the century, the question was no longer what a dog could do for you, but simply the pleasure of its company, a shift that set the stage for the boom still unfolding today.",
    facts: [
      { text: "Today around 99 percent of UK dog owners consider their dog to be a full member of the family.", image: "/history/family-dog.jpg" },
      { text: "Around a third of British dogs are now allowed up onto their owner's bed to sleep.", image: "/history/dog-in-bed.jpg" },
      { text: "Some 58 percent of owners buy their dog birthday and Christmas presents.", image: "/history/dog-birthday.jpg" },
      { text: "Pampered pets now enjoy spas, bakeries, dog fashion and even their own social media accounts.", image: "/history/Pampered-pets.jpg" },
    ],
    image: "/history/poodle-bed.jpg",
    imageAlt: "A family relaxing at home with their pet dog",
  },
  {
    title: "Today's boom",
    accent: "boom",
    era: "crosses",
    intro:
      "Britain's dog population is bigger than ever, and still growing. A new generation of owners, and a global pandemic, have reshaped which dogs we choose and why.",
    bullets: [
      "The UK dog population has risen from around 8.2 million in 2011 to between 11 and 13 million today.",
      "More than three million UK households welcomed a new pet during the pandemic.",
      "Younger owners now make up a fast-growing share of the dog-loving population.",
      "Designer crossbreeds like the Cockapoo and Labradoodle have surged in popularity.",
      "The pet-tech market alone, covering smart feeders, cameras and GPS trackers, is now worth over 400 million pounds.",
    ],
    bulletTitles: ["Loads of dogs", "More dogs", "Young pups", "Doo's and Poo's", "Dog Tracking"],
    detail:
      "The most common breeds tell the story of changing tastes. Among dogs of all ages the classic Labrador still leads, but among puppies the French Bulldog and the Cockapoo have raced to the top, a clear sign of the designer-crossbreed boom. The pack brings both worlds together, the old favourites and the new, each with centuries of history behind them.",
    facts: [
      { text: "Among dogs under one year old, the French Bulldog and Cockapoo now rank among the three most common breeds in the UK.", image: "/history/cockapoo-circle.jpg" },
      { text: "British owners now spend around 10 billion pounds a year on their dogs.", image: "/history/10-billion-pounds.jpg" },
      { text: "There are an estimated 13.5 million pet dogs in the UK, living in roughly a third of all households.", image: "/history/britian.jpg" },
    ],
    image: "/history/pappered-dog.jpg",
    imageAlt: "A modern Cockapoo, one of Britain's most popular dogs today",
  },
];
