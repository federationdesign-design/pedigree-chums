import styles from "./AncientFacts.module.css";

/* Three boxed facts for the Ancient era page, below the map and timeline.
   Text taken from the owner's social slides (slide1b, slide2, slide4), 22 Sept
   2026, with light copy fixes: "there" to "their", "A Roman writer Arrian" to
   "The Roman writer Arrian", and the guard dogs sentence given a verb. The image
   caption on slide 2 ("no doubt a very good boy") is left out, as the image is
   not used here. The Star Carr height sentence was added 22 Sept 2026 to balance
   the middle box: Harcourt (1974), as cited in Journal of Archaeological Science
   (2010), https://www.sciencedirect.com/science/article/abs/pii/S0305440310001974 */

export type Fact = { heading: string; paras: string[] };

const FACTS: Fact[] = [
  {
    heading: "Britain's earliest dogs had no breed standards or pedigrees.",
    paras: [
      "They were shaped by the jobs people needed doing: guarding homes and livestock, following scents, chasing deer and hares.",
      "Classical writers recorded that British hunting dogs were exported overseas, and reported on Celts using dogs in war.",
    ],
  },
  {
    heading: "A 14,000-year-old dog jawbone",
    paras: [
      "Archaeologists have found dogs of very different sizes in early British settlements, from small animals to dogs approaching wolf size.",
      "The dogs at Star Carr in North Yorkshire, around 11,000 years ago, stood between 52 and 61 cm at the shoulder, about the height of a modern Labrador.",
    ],
  },
  {
    heading: "Several generations later",
    paras: [
      "The Roman writer Arrian described swift Celtic coursing hounds that hunted by sight rather than scent.",
      "These early dogs were types shaped by their work and environments.",
      "There were all kinds of dogs, from fast coursing hounds to powerful guard dogs and small practical workers.",
      "Their names, appearance and purpose could change from place to place and one century to the next.",
    ],
  },
];

/* Medieval page boxes (owner request, 22 Sept 2026). Sources: Domesday shares,
   encyclopedia.com "tenants-in-chief"; forest extent and "not always wooded",
   Charter of the Forest summaries; dogs' toes and bows banned, encyclopedia.com
   "forest laws" (Assize of the Forest, 1184); firewood and pig grazing restored,
   History Hit on the 1217 Charter, clause 9. */
/* Saxons 'n' Normans page boxes, 23 September 2026 (owner). Copy flagged for
   owner review. Sources: the Lindisfarne raid of 793 and the Great Heathen Army
   of 865 (Wikipedia: Viking Age, Great Heathen Army); the Five Boroughs of the
   Danelaw, Leicester, Nottingham, Derby, Stamford and Lincoln (Historic UK); Old
   Norse place-name endings -by and -thorpe (standard place-name scholarship);
   the Domesday Book of 1086 (already cited on the Medieval page). */
export const SAXON_FACTS: Fact[] = [
  {
    heading: "One raid started it all (793)",
    paras: [
      "Vikings attacked the monastery at Lindisfarne, off the Northumbrian coast, and the raids went on for years.",
      "By 865 the raiding had turned into an invasion: the Great Heathen Army landed and took East Anglia, Northumbria and much of Mercia.",
    ],
  },
  {
    heading: "Half of England under Danish law",
    paras: [
      "After Alfred beat Guthrum in 878, the two sides drew a line from the Thames up to Bedford and on towards Chester.",
      "Everything north and east of it was the Danelaw, run from five Danish towns: Leicester, Nottingham, Derby, Stamford and Lincoln.",
    ],
  },
  {
    heading: "You can still hear them",
    paras: [
      "Town names ending in -by, like Grimsby, Derby and Whitby, are Old Norse for a farm or village.",
      "So is -thorpe, meaning a smaller settlement. Look at a map of Yorkshire and Lincolnshire and you are looking at where the Vikings settled.",
    ],
  },
];

export const MEDIEVAL_FACTS: Fact[] = [
  {
    heading: "The Domesday Book (1086)",
    paras: [
      "Twenty years after conquering England, William the Conqueror had his officials record who held what: land, animals, mills and people, in almost every corner of England.",
      "It showed the king kept about a fifth of the land for himself, the church held about a quarter, and his barons held about half.",
    ],
  },
  {
    heading: "A forest without trees?",
    paras: [
      "A royal forest was not always a wood. It could include heaths, fields, wetlands and even whole villages.",
      "By the early 1200s, almost a third of England was under the king's forest law, and the deer and wild boar living there belonged to the king alone.",
    ],
  },
  {
    heading: "Mind your dog's toes!",
    paras: [
      "Inside a royal forest, nobody could carry a bow and arrows, and dogs had their toes clipped so they could not chase the king's deer.",
      "In 1217 the Charter of the Forest gave ordinary people some of their rights back, like collecting firewood and letting their pigs graze.",
    ],
  },
];

/* Tudor 'n' Stuart page boxes (owner request, 22 Sept 2026: non-royal facts, the
   fork and the shoe with a dog-chewing joke, and a cultural event). Sources:
   Thomas Coryat and the fork, Coryat's Crudities (1611), Wikipedia; heels from
   Persian riders and the 1599 Persian mission to Europe, Elizabeth Semmelhack,
   Bata Shoe Museum, via BBC News; Crab as the only dog Shakespeare wrote into a
   play, AKC Family Dog (2024). The Globe opening in 1599 is common knowledge. */
export const TUDOR_FACTS: Fact[] = [
  {
    heading: "Fork! How rude!",
    paras: [
      "In 1608 a traveller from Somerset called Thomas Coryat saw Italians eating with forks and brought the habit home. Most people still ate with a knife and their fingers, and his friends teased him with the nickname 'Furcifer', the fork-carrier.",
      "The family dog, meanwhile, decided a fork was just a very small, very pointy bone.",
    ],
  },
  {
    heading: "Heels were for horse riders",
    paras: [
      "High heels began as riding boots for Persian horsemen, to keep their feet firmly in the stirrups. After Persian visitors toured Europe in 1599, rich European men went wild for heeled shoes.",
      "Then, as now, dogs had their own view of fancy new shoes: an expensive chew toy.",
    ],
  },
  {
    heading: "A dog steals the show",
    paras: [
      "In 1599 the Globe Theatre opened on London's Bankside, where ordinary Londoners could stand and watch a play for a penny.",
      "Shakespeare only ever wrote one dog into his plays: Crab, in The Two Gentlemen of Verona. Crab never says a word, and still steals every scene.",
    ],
  },
];

/* 1700s page boxes (owner request, 22 Sept 2026): how the Dutch grew powerful,
   how Britain copied their model, and how the money built an empire. Sources:
   Wikipedia, Financial Revolution (reforms modelled on Dutch practice, first
   government bonds 1693, Bank of England 1694); Tontine Coffee-House (the loan
   that founded the Bank was to rebuild the navy after a crushing defeat);
   predictivehistory.com and UK Parliament (parliament-backed borrowing let
   Britain outspend France and fund the empire). The Dutch East India Company
   (1602) and the Raid on the Medway (1667) are standard history. The 1784 ban on
   publicly displaying orange in Holland, carrots included, is from contemporary
   accounts of 16 June 1784 (The Retrospectors; christiandevotionals substack). */
export const EIGHTEENTH_FACTS: Fact[] = [
  {
    heading: "The Dutch ruled the waves",
    paras: [
      "In the 1600s the small Dutch Republic had some of the biggest trading fleets in the world, and its East India Company, set up in 1602, sold shares to ordinary investors.",
      "In 1667 the Dutch navy even sailed up the River Medway in Kent, burned English warships and towed away the fleet's flagship, the Royal Charles.",
      "Orange was the colour of William's family, and it stayed political for a long time. In 1784 Holland banned showing orange in public, and market sellers had to keep the green tops over their carrots so nobody took offence.",
    ],
  },
  {
    heading: "Copying the Dutch",
    paras: [
      "Rich English merchants admired how the Dutch raised money. When William arrived, England copied their ideas: the first government bonds in 1693, then the Bank of England in 1694.",
      "The Bank's very first job was lending money to the government to rebuild the navy.",
    ],
  },
  {
    heading: "From island to empire",
    paras: [
      "Because Parliament promised to pay back what it borrowed, Britain could borrow more cheaply than its rivals. That money paid for a huge navy.",
      "Through the 1700s a small island nation fought old enemies like France and Spain, and new rivals, on the other side of the world, laying the foundations of the British Empire.",
    ],
  },
];

/* 1800s page boxes (owner request, 22 Sept 2026). Sources: Metropolitan Police
   Act 1839 section 56 and its 40 shilling penalty, and the extension to the rest
   of England and Wales in 1854 (Wikipedia, Drafting (dog); Wikipedia, Victorian
   morality); the Newcastle show of 28 to 29 June 1859, tacked onto a poultry show,
   60 dogs, pointers and setters only, shotguns as prizes (Canine Chronicle;
   BRANCH, Philip Howell; Project Upland); the Kennel Club 1873 and Battersea 1860
   are standard history. */
export const NINETEENTH_FACTS: Fact[] = [
  {
    heading: "Banned overnight",
    paras: [
      "From 1 January 1840, using a dog to pull a cart anywhere within 15 miles of Charing Cross cost you a fine of forty shillings, and five pounds if you did it again.",
      "In 1854 the ban spread to the rest of England and Wales. Cart dogs simply vanished from British streets.",
    ],
  },
  {
    heading: "A show for two breeds",
    paras: [
      "Britain's first organised dog show was held in Newcastle Town Hall in June 1859, tacked onto a poultry show. Only 60 dogs came, and only pointers and setters were allowed.",
      "The prizes were not rosettes. They were shotguns, made by one of the organisers.",
    ],
  },
  {
    heading: "Who says what a breed is?",
    paras: [
      "Battersea Dogs Home opened in 1860, and the Kennel Club followed in 1873: the first organisation in the world to write down what each breed should look like.",
      "From then on a dog could be judged not on what it could do, but on how closely it matched a description in a book.",
    ],
  },
];

/* 1900s page boxes (owner request, 22 Sept 2026). Sources: the NARPAC leaflet and
   the 1939 pet panic (Wikipedia, British pet massacre; Hilda Kean, The Great Cat
   and Dog Massacre, 2017; Dogs Trust for the NCDL speaking out); the PDSA Dickin
   Medal, founded December 1943, 75 recipients including 38 dogs (PDSA; Historic
   England); Rip as the Air Raid Patrol's first search dog, credited with finding
   over 100 people (PDSA). */
export const TWENTIETH_FACTS: Fact[] = [
  {
    heading: "One sentence, one panic",
    paras: [
      "The 1939 leaflet was mostly about moving pets to the countryside. One line at the end said that if you could not, it really was kindest to have them destroyed.",
      "That single sentence is blamed for hundreds of thousands of deaths. Nobody was ever ordered to do anything.",
    ],
  },
  {
    heading: "The stray who saved 100 people",
    paras: [
      "Rip was a stray until an air raid warden fed him during the Blitz. He became the Air Raid Patrol's first search dog, without a day of training.",
      "He is believed to have found more than 100 people buried under bombed buildings, and search dogs have worked that way ever since.",
    ],
  },
  {
    heading: "A medal for animals",
    paras: [
      "In 1943 Maria Dickin, who founded the PDSA, created a medal for animal bravery. It is known as the animals' Victoria Cross.",
      "It has gone to 75 animals: 38 dogs, 32 pigeons, four horses and one very good cat.",
    ],
  },
];

/* `facts` lets other era pages reuse the same heading, boxes and styling
   (22 Sept 2026); Ancient passes nothing and gets its own boxes as before. */
export default function AncientFacts({ facts = FACTS }: { facts?: Fact[] }) {
  return (
    <>
      {/* Section heading above the three boxes (owner request, 22 Sept 2026). */}
      <h2 className={`display ${styles.factsTitle}`}>
        Did <span className="display-yellow">you</span> know?
      </h2>
    <div className={styles.grid}>
      {facts.map((f) => (
        <section key={f.heading} className={styles.box}>
          <h3 className={styles.boxTitle}>{f.heading}</h3>
          {f.paras.map((p) => (
            <p key={p} className={styles.text}>
              {p}
            </p>
          ))}
        </section>
      ))}
    </div>
    </>
  );
}
