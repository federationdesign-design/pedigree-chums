/* Per-era social pages: the seven share-only routes under
   /britains-dog-history/[era]. Additive only, the history index page is not
   touched. See docs/social-pages/BRIEF.md and docs/social-pages/DECISIONS.md.

   Each page is a thin wrapper that reuses the existing BreedStrip slider and the
   existing era intro copy (data/eraIntros.ts). No new copywriting: titles are
   derived from the era name, descriptions from the strips' existing notes.

   `strips` are the uk-breeds `strip` keys, in the order they appear on the
   history page today. Six pages carry one strip; the 1800s page stacks all
   four of its 1800s-region strips (early1800, spaniels, mid1800, late1800),
   per Steve's call on 13 August 2026. The crosses page was added on
   14 August 2026. */

export type EraPage = {
  slug: string;
  /* The heading READERS see. Short and funny by design, and the owner wants it
     left alone (23 September 2026). */
  title: string;
  /* What SEARCH sees, added 23 September 2026. A <title> and a <meta
     description> can differ from the on-page h1, and should here: "Medieval
     Times" is a fine heading and a useless search result. These name the era, the
     dogs and the thing people actually type. Written once, stored here so the
     page component stays free of copy. */
  seoTitle: string;
  seoDescription: string;
  strips: string[]; // uk-breeds strip keys, in history-page order
  intro?: string; // optional lead paragraph under the h1 (added 22 Sept 2026)
};

export const ERA_PAGES: EraPage[] = [
  {
    slug: "ancient",
    title: "Ancient Times",
    seoTitle:
      "Ancient Dogs of Britain: Celtic Hounds, Doggerland and the First Dogs",
    seoDescription:
      "How dogs reached Britain when it was still joined to Europe by Doggerland, and the Celtic hounds, mastiffs and herding dogs the Romans found here. Maps, dates and the breeds they became.",
    strips: ["ancient"],
    /* Owner request, 22 Sept 2026. Dogger Bank is named after doggers, medieval
       Dutch cod-fishing boats (Wikipedia: Dogger Bank; Dogger (boat)). */
    intro:
      "In ancient times, Britain was not an island. It was connected to mainland Europe by Doggerland. But we are sorry to report that Doggerland has nothing to do with dogs! It is named after the Dogger Bank in the North Sea, which got its name from doggers, the medieval Dutch fishing boats that sailed there to catch cod.",
  },
  {
    /* NEW ERA, 22 September 2026 (owner): the 600 years between Britain becoming
       an island and 1066, which the timeline used to jump. Nine dogs moved here
       from the ancient and medieval strips. Sources for the intro: the Roman
       invasion of 43 and the end of Roman rule in 410; the Anglo-Saxon kingdoms;
       the first Viking raid on Lindisfarne in 793; Alfred's victory at Edington
       in 878 and the Danelaw that followed; Aethelstan's single kingdom of
       England in 927 (Wikipedia: Roman Britain, Danelaw, Treaty of Alfred and
       Guthrum, Great Heathen Army). */
    slug: "saxons",
    title: "Saxons 'n' Normans",
    seoTitle:
      "Saxon and Norman Dogs: Who Owned Britain from the Romans to 1066",
    seoDescription:
      "Romans, Saxons, Vikings and Normans each took Britain and each brought dogs. An interactive map of who held what, the forest laws that followed, and the nine breeds of the period.",
    strips: ["saxon"],
    intro:
      "For six hundred years Britain belonged to whoever had just arrived. The Romans came in AD 43 and left in 410. Then Anglo-Saxon kingdoms filled the map, Viking raiders took the north and east until Alfred stopped them in 878, and in 1066 the Normans took the lot. Every wave brought its own dogs, and Britain kept the best of each.",
  },
  {
    slug: "medieval",
    title: "Medieval Times",
    seoTitle:
      "Medieval Dogs in Britain: Forest Laws, Royal Hunts and Hunting Hounds",
    seoDescription:
      "William the Conqueror turned huge areas into royal forests, and dogs paid the price. The hunting hounds, terriers and herding dogs of medieval Britain, with a playable map of the forests.",
    strips: ["medieval"],
    /* Owner request, 22 Sept 2026 (option A: the accurate 1066 story; the 1688
       "invitation" story belongs to William III, not the Conqueror). Sources:
       English Heritage and History.com on 1066; forest-law restrictions per
       History Hit and encyclopedia.com "forest laws".

       REWRITTEN 22 Sept 2026 to the owner's words, with two corrections kept:
       1066 is the START of the medieval period in England, not the end, and the
       king who disbelieved William was Harold Godwinson, Edward the Confessor's
       brother-in-law, not his son (Edward had no children). The forest sentence
       moved to the King's Forests panel, where the map shows it. */
    intro:
      "In 1066, at the start of the medieval period, William, a duke from Normandy in France, sailed to England proclaiming that the old English king had promised him the crown when he died. He had to fight for it, because the new English king, Harold, did not believe him. He won the Battle of Hastings, took the throne and became known as William the Conqueror.",
  },
  /* Renamed from "Tudor Times" (owner, 22 Sept 2026): the strip covers the 1500s
     AND 1600s. Slug kept as "tudor" so shared links still work. */
  {
    slug: "tudor",
    title: "Tudor 'n' Stuart Times",
    seoTitle:
      "Tudor and Stuart Dogs: Britain's First Book of Dogs, 1576",
    seoDescription:
      "John Caius wrote the first book about English dogs in 1576, naming types we have since lost. Tudor and Stuart Britain's dogs, its post roads and the breeds that survived.",
    strips: ["c1500"],
    /* Owner request, 22 Sept 2026. Sources: a signpost's "post" is the wooden
       pole, while the letter post comes from horses "posted" in relays; a 1697
       Act let magistrates put direction posts where highways crossed, and the
       oldest surviving fingerpost, near Chipping Campden, is dated 1669
       (Wikipedia, Fingerpost; Country Life). */
    intro:
      "Signposts and the post sound related, but they are not: a signpost is named after a wooden pole, while the letter post comes from horses \"posted\" in relays along the road. Britain got its first direction posts in the late 1600s, and the oldest still standing, from 1669, is near Chipping Campden. Dogs, of course, treated every new post as a message board of their own.",
  },
  {
    slug: "1700s",
    title: "The 1700s",
    seoTitle:
      "Georgian Dogs and the 1700s: Trade, Empire and the Pug's Arrival",
    seoDescription:
      "How Britain's ships, debts and empire shaped its dogs in the 1700s, from pugs arriving with William of Orange to the sporting breeds of the Georgian era.",
    strips: ["c1700"],
    /* Owner request, 22 Sept 2026: the William of Orange story, saved for this
       page. Sources: The National Archives (the Immortal Seven's letter of 30
       June 1688, Edward Russell coded as "35"); UK Parliament (landing at Brixham,
       5 November 1688, James II fled to France); Wikipedia, Pug (a pug travelled
       with William and Mary in 1688). */
    intro:
      "In 1688, seven powerful English lords secretly wrote to William of Orange, the leader of the Dutch Republic, asking him to come and replace King James II. Their letter even used code numbers instead of names. William landed at Brixham with a Dutch army, James fled to France, and William and his wife Mary became king and queen. They brought their pugs with them, and Britain has loved the pug ever since.",
  },
  {
    slug: "1800s",
    title: "The 1800s",
    seoTitle:
      "Victorian Dogs: The Dog Cart Ban, the Kennel Club and the Breed Explosion",
    seoDescription:
      "London banned dog carts in 1839 and thousands of dogs were destroyed. By 1900 Britain was inventing breeds by the dozen. The Victorian century that made the modern dog.",
    strips: ["early1800", "spaniels", "mid1800", "late1800"],
    /* Owner request, 22 Sept 2026. Sources: Metropolitan Police Act 1839 s.56,
       banning dogs from drawing carts within 15 miles of Charing Cross from 1
       January 1840; more than 3,000 dogs destroyed as a result (David Lamb,
       "Carting Dogs in Chandler's Ford"); the first organised dog show, Newcastle,
       June 1859 (BRANCH, Philip Howell); the Kennel Club, 1873. */
    intro:
      "At the start of the 1800s, dogs worked for a living, hauling carts of milk and bread through London. Then in 1839 a law banned dog carts within 15 miles of Charing Cross, and more than 3,000 dogs are said to have been destroyed, because a dog that could not earn its keep still had to be fed. By the end of the same century Britain was queuing to admire dogs at shows, inventing breeds and writing rules for them. Same country, same dogs, and a completely different idea of what a dog is for.",
  },
  {
    slug: "1900s",
    title: "The 1900s",
    seoTitle:
      "Dogs in Wartime Britain: The 1939 Pet Massacre and the Dickin Medal",
    seoDescription:
      "In one week of September 1939 Britain destroyed 400,000 pets. Four years later it was giving dogs medals. Wartime rationing, the Dickin Medal dogs and the century's breeds.",
    strips: ["c1900"],
    /* Owner request, 22 Sept 2026. Sources: the NARPAC leaflet "Advice to Animal
       Owners" and the September 1939 pet panic, about 400,000 in the first days
       and an estimated 750,000 in all (Wikipedia, British pet massacre; Hilda
       Kean, 2017); the PDSA Dickin Medal, founded December 1943 by Maria Dickin
       (PDSA). */
    intro:
      "In September 1939, within days of war being declared, British families queued outside animal clinics to have their pets put to sleep. About 400,000 cats and dogs went in the first week, and perhaps 750,000 in all. No law told anyone to do it: a government leaflet had simply said it would be kindest, and fear did the rest. Four years later the same country invented a medal for brave animals, and started pinning it on dogs.",
  },
  {
    slug: "crosses",
    title: "Today's Crossbreeds",
    seoTitle:
      "Crossbreed Dogs in Britain: Cockapoos, Labradoodles and Today's Pack",
    seoDescription:
      "Why Britain fell for the crossbreed, how the cockapoo and labradoodle were made, and where today's most popular dogs came from.",
    strips: ["crosses"],
  },
];

export function eraPageBySlug(slug: string): EraPage | undefined {
  return ERA_PAGES.find((p) => p.slug === slug);
}
