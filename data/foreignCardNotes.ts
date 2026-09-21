/* SHORT BACKS FOR THE FOREIGN CARDS, 21 September 2026 (owner: on the cards with no
   level, the write-ups on the yellow card backs need about half the words so they fit).

   ONLY THE CARD BACK. Each dog's full note stays in data/lineage.ts and is still what the
   game, the ancestor popovers and the lift layer show; this file is read by the chum
   page slider alone (foreignCardsWithin), so shortening here cannot change them.

   THE RULE: at most half the original word count, rounded up, keeping the one fact that
   identifies the dog. "Now extinct." and "Now endangered." are dropped from the text
   because the card now shows them as its status band on the FRONT, the same red EXTINCT
   band the era-strip cards wear, so nothing is lost. */
export const FOREIGN_CARD_NOTES: Record<string, string> = {
  "Affenpinscher": "Rough little German monkey-faced ratter.",
  "Alaunt war dogs": "Fierce war dogs of mounted warriors.",
  "Alpine Mastiff farm dogs": "Heavy Roman-descended Swiss farm dogs.",
  "Ancient Arctic Spitz": "Northern spitz family: pricked ears, curled tails.",
  "Ancient Chinese toy dogs": "Flat-faced lapdogs of the Chinese imperial court.",
  "Ancient Spitz dogs": "Foxy-faced Nordic dogs brought by Viking settlers.",
  "Ancient Techichi dogs": "Sacred companion dogs of the Aztec.",
  "Ancient eastern sighthounds": "Slender coursing dogs of ancient Egypt.",
  "Ancient spotted Hounds": "Old spotted hunting dogs of Europe.",
  "Arctic sled Spitz": "Big Nordic sled and herding spitz.",
  "Basset Artesien Normand": "French basset behind the English Basset.",
  "Brabant Bullenbeisser": "The smaller, athletic German catch dog the FCI names as the Boxer's direct ancestor.",
  "Chien-gris": "Grey hounds of the French royal packs, said to come from the Crusades.",
  "Chukchi sled dogs": "Endurance sled dogs of the Siberian Arctic.",
  "Continental Germanic herding dogs": "Saxon and Angle herding dogs that crossed to Britain with their people.",
  "Continental toy Spaniels": "Dwarf spaniels on Renaissance noble laps.",
  "Dogs of the Alan horsemen": "Big steppe dogs guarding Alan camps and herds.",
  "Early Badger hunting dogs": "Long, low Celtic earth dogs bred for badger and fox.",
  "Early Boar hunting dogs": "Rough northern European dogs bred to seize and hold boar and bear. Crossed with Alaunts, they made the German bull-baiter.",
  "Eastern Lion dogs": "Small eastern companion dogs, the lion-dog family.",
  "Gaulish coursing Hounds": "Swift Gaulish hounds Roman writers admired.",
  "German Bullenbeisser dogs": "German catch dogs bred to seize boar, bear and bull. The big ones hunted boar; the small Brabant line became the Boxer.",
  "German Pinscher": "Sharp German farm and ratting dog.",
  "German bracke scenthounds": "German trailing hounds, short-legged for ground work.",
  "German farm Spitz": "Guard spitz of Pomerania, Wolfspitz type.",
  "Great Bullenbeisser (Danziger Bullenbeisser)": "The big northern German bull-baiter, about 60cm, bred to seize boar, bear and bull. The smaller Brabant type came from it.",
  "Laconian tracking Hounds": "Keen-nosed hare hounds of ancient Greece.",
  "Local German cattle dogs": "Butchers' dogs of Rottweil.",
  "Medieval Alaunts dogs": "European catch dogs from the Alans' steppe dogs, bred for size, grip and courage.",
  "Mediterranean Bichon lapdogs": "White lapdogs of Malta, Bologna and Tenerife.",
  "Mediterranean miniature sighthounds": "Small sighthound companions of Greece and Rome.",
  "Mountain coursing Hounds": "Heavy-coated, big-footed mountain hunting hounds.",
  "Newfoundland landrace dogs": "Water dogs crossed in during the 1800s.",
  "Norse settlers dogs": "Scandinavian dogs of the Viking settlers.",
  "Old Desert coursing dogs": "Early slender desert chasing dogs.",
  "Old European lapdogs": "Small companions behind Europe's toy breeds.",
  "Old European water dogs": "The curly Barbet, root of the bichons.",
  "Old German Ratters": "Quick German farm ratters.",
  "Old German boarhounds": "Regional German boar-hunting packs.",
  "Old German farm guards": "Local German farm and guard stock.",
  "Old German hunting dogs": "All-round hunters of the Weimar estates.",
  "Old Mastiffs of the East": "Huge ancient mastiffs carved on palace walls.",
  "Old hunting dogs of the Celts": "Iron Age European running dogs.",
  "Old trail dogs of the East": "Ancient eastern trail hounds.",
  "Parisian Ratters": "Paris ratters, thought to add bat ears.",
  "Portuguese fishing dogs": "Curly water dogs of the Portuguese cod fleets.",
  "Roman drover dogs": "Cattle dogs left by Roman legions.",
  "Schnauzer farm dogs": "Wiry German yard and stable dogs.",
  "Schnauzer-type farm dogs": "Wiry German all-round workers.",
  "Segusian tracking Hounds": "Shaggy Gaulish scent hounds the Romans named.",
  "Shaggy upland herders": "Rough-coated old hill herders.",
  "Small imported dogs": "Tiny traders' dogs adding coat and spark.",
  "Thuringian herding dogs": "Prick-eared, curl-tailed central German herders.",
  "Tibetan temple dogs": "Long-coated holy dogs of Tibet.",
  "Wurttemberg Sheepdogs": "Big, calm southern German herders.",
};

/* The status the full note ends on, for the card's front band. */
export function statusFromNote(note: string | undefined): "extinct" | "endangered" | undefined {
  if (!note) return undefined;
  if (/Now extinct\./i.test(note)) return "extinct";
  if (/Now endangered\./i.test(note)) return "endangered";
  return undefined;
}
