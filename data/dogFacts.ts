/* THE PIT'S "DID YOU KNOW?" FACTS, 25 September 2026 (owner: random dog facts
   from everything the site already holds, not just the breed write-ups).
   Built once, from:
     1. the history page's "Did you know?" facts (historySections.ts);
     2. the chatbot's approved breed lines (copied from the pick-a-chum branch's
        assembler, where they are BREED_FACTS; not on main otherwise);
     3. the famous dogs (famousDogs.ts), written as a sentence each;
     4. the first sentence of every breed write-up (breedInfo.ts);
     5. the 95 extinct ancestors, rewritten to stand on their own (EXTINCT_REWRITES).
   The pit adds the current level's lineage notes on top and deals the lot from
   a shuffled deck. To add facts, add them to EXTRA_FACTS. */
import { SECTIONS } from "./historySections";
import famousDogs from "./famousDogs";
import { breedInfo } from "./breedInfo";
import { breeds } from "./breeds";

// The chatbot's breed lines, as approved there (pick-a-chum lib/assembler.ts).
const CHATBOT_FACTS = [
  "Labrador ancestors hauled nets through Newfoundland waters. The pond obsession has proper historical backing.",
  "Border Collies move sheep with a hard stare called the eye. The old job still shows.",
  "Boxers were bred to hold large animals until help arrived. Determination, disguised as permanent surprise.",
  "Border Terriers kept pace with horses and followed foxes underground. A lot of dog in very little space.",
  "Cocker Spaniels were bred to flush woodcock from thick cover. That explains the hedge inspections.",
  "Beagles were bred so people could follow the hunt on foot. That voice was designed to travel.",
  "Nottingham lace workers took small Bulldogs to France. American breeders later backed the upright bat ears.",
  "Pugs lived in Chinese imperial courts, sometimes with guards. Important treatment became the working assumption.",
  "German Shepherds were created for long, purposeful work. That famous trot was part of the original plan.",
  "Staffordshire Bull Terriers were handled closely, so steadiness around people mattered from the start.",
];

/* THE EXTINCT ANCESTORS, REWRITTEN FOR THE FACT CARD, 25 September 2026 (owner:
   the 95 lineage notes ending "Now extinct." read as fragments on their own,
   because they rely on the dog's name as a heading and stop dead). Each names
   the dog, says what it was, what it led to (from the lineage), and ends on its
   extinction. Written only from each note and its lineage links, nothing added.
   Used on the fact card only: the learn box and lifted card keep their notes. */
export const EXTINCT_REWRITES: Record<string, string> = {
  "Ancient eastern sighthounds": "Ancient eastern sighthounds were the slender, fast coursing dogs of Egypt and the Near East. Their speed was carried west into the Celtic hounds and on into Britain's sighthounds, but the old eastern type itself is now extinct.",
  "Old hunting dogs of the Celts": "The old hunting dogs of the Celts were the native running dogs of Iron Age Europe. They sit at the root of the Celtic Hound, the Celtic scent hounds and the Celts' herding dogs, a family that stretches all the way to today's Greyhound and Bloodhound. The dogs themselves are now extinct.",
  "Ancient Molossers": "The Ancient Molossers were big, heavy mastiff-type dogs with enough bulk to bring down a wolf. Their weight went into the English Mastiff, the Irish Wolfhound and the Saint Bernard, though the Molossers themselves are now extinct.",
  "Old Mastiffs of the East": "The Old Mastiffs of the East were huge guard and hunting dogs of the ancient East, carved on palace walls thousands of years ago. Their size runs through the Molossers and on into the big guarding breeds of Europe. They are now extinct.",
  "Medieval Bloodhound": "The Medieval Bloodhound was the heavy, deep-nosed, slow trailing hound of the medieval hunt, the dog behind today's Bloodhound and Otterhound before either took its modern shape. That older form is now extinct.",
  "Norman Hound": "The Norman Hound was a big, slow, deep-voiced hunting hound from Normandy, bred from the St Hubert and local hounds. It is said to have come to England with the Normans after 1066 and is believed to stand behind the Talbot and the Bloodhound. It is now extinct.",
  "Old scenting Hounds": "The old scenting hounds were the heavy continental tracking dogs that the abbey of St Hubert built its famous hounds from. Through the St Hubert Hound and the Talbot they lead to today's Bloodhound. They are now extinct.",
  "Segusian tracking Hounds": "The Segusian hounds were shaggy trail hounds from Gaul, known to the Romans by name and famous for following a scent. They fed into the Celtic scent hounds, the Norman Hound and the German brackes. They are now extinct.",
  "Laconian tracking Hounds": "The Laconian hounds of ancient Greece tracked hares by scent, and Greek hunting writers praised their keen noses. Their line is counted among the roots of the Celtic scent hounds and the St Hubert Hound. They are now extinct.",
  "Old trail dogs of the East": "The old trail dogs of the East were among the first hunting dogs bred to follow a trail by scent. They are the earliest root of the Laconian hounds of Greece, and through them of Europe's scent hounds. They are now extinct.",
  "Chien-gris": "The Chien-gris were the grey hounds of the French royal packs. Tradition says they came west with King Louis IX from the Crusades, though that is an old story rather than recorded descent. They are counted among the roots of the Otterhound, and they are now extinct.",
  "Old British Bandogs": "Bandogs were the heavy chained dogs of old England, kept tied up by day and let loose at night to guard, and worked by butchers and baiters alike. They fed into the English Mastiff and the Old English Bulldog. They are now extinct.",
  "Alaunt war dogs": "The Alaunts were fierce war and catch dogs that came west with mounted steppe warriors. Their blood runs into the Mastiff, the Great Dane and the Old English Bulldog, but the Alaunt itself is now extinct.",
  "Dogs of the Alan horsemen": "The Alans were horsemen of the steppe, and their big dogs guarded camps and herds across the plains. Those dogs became the Alaunts, the war dogs behind the Mastiff and the Great Dane. They are now extinct.",
  "Medieval British Mastiff": "The medieval British mastiff was a heavy war and hunting dog that gave later breeds their bulk and bone, including the Great Dane and the Bulldog. It is now extinct.",
  "Old German boarhounds": "The old German boarhounds were regional hunting packs that did the dangerous work of boar hunting long before any breed was fixed. They are the direct forerunners of the Great Dane, and they are now extinct.",
  "Old English Bulldog": "The Old English Bulldog was the athletic bull-baiting dog at the root of today's Bulldog, leaner and fiercer than the modern breed. It also fed into the Boxer's German ancestors. It is now extinct.",
  "Ancient Chinese toy dogs": "Ancient Chinese toy dogs were the flat-faced lapdogs of the imperial court, kept alongside the Pekingese and the lion dogs. They stand behind the Pug and the Shih Tzu, and they are now extinct.",
  "Ancient Chinese court dogs": "The Lo-sze were little flat-faced lapdogs bred for the laps and sleeves of the Han court from around 200 BC. They are the oldest root of China's toy dogs and, through them, of the Pug. They are now extinct.",
  "Eastern Lion dogs": "The eastern lion dogs were a wider family of small companion dogs from Tibet and China. They are part of the Pug's ancestry, and as a family they are now extinct.",
  "Tibetan temple dogs": "Tibetan monks bred small, long-coated lion dogs from the 600s and gave them as gifts to the Chinese court. Those temple dogs stand behind the Shih Tzu, and they are now extinct.",
  "Tibetan village dogs": "Sturdy Tibetan working dogs were the stock the monks' small temple dogs were bred out of. Through the temple dogs they lead to the Shih Tzu and the Pug. They are now extinct.",
  "Black and Tan Terrier": "The Black and Tan Terrier was a British working terrier, and the white terriers were selected out of it for their coat colour. It also fed into the Manchester Terrier and the Fox Terrier. It is now extinct.",
  "Old British ratting Terriers": "Britain's old ratting terriers were vermin dogs kept on farms long before breeds had names. They fed into the Black and Tan Terrier and the ratting dogs of Paris. They are now extinct.",
  "Ancient Celtic earth dogs": "Celtic tribes across northern Europe kept low-slung hunting dogs for going to ground before the Romans arrived. They are the root of Britain's earth dogs and badger dogs, and they are now extinct.",
  "Early Badger hunting dogs": "The Celts are said to have brought long, low hunting dogs to Cardiganshire, short-legged dogs bred to follow badger and fox underground. They stand behind the Cardigan Welsh Corgi and the German ratters, and they are now extinct.",
  "Earth and hunt terriers": "Earth and hunt terriers were hardy dogs that went underground to bolt foxes and badgers. They fed into the Black and Tan Terrier and the Lurcher, and they are now extinct.",
  "Old Balkan spotted hounds": "The inland Balkans had old patched hounds, one of the spotted lines counted among the Dalmatian's ancestors. They are now extinct.",
  "Medieval Greyhound": "The medieval Greyhound was the noble hunting hound of Norman and Plantagenet England. It was so prized that Canute's Forest Laws of 1016 kept it from commoners, and King John accepted greyhounds as payment of fines. Today's Greyhound descends from it; the medieval form is now extinct.",
  "Gaulish coursing Hounds": "The vertragus hounds of Gaul were swift coursing dogs that Roman writers admired for pure speed. They fed into the Celtic Coursing Hound, and they are now extinct.",
  "Old Desert coursing dogs": "The first slender chasing dogs came from the old desert lands. They are the earliest root of the ancient eastern sighthounds, and so of the Greyhound family. They are now extinct.",
  "The First Setters": "The first setters brought style and steadiness to the shooting dog. Their blood fed into the Pointer, the Wavy-Coated Retriever and the Labrador, but the early setters themselves are now extinct.",
  "Land Spaniels": "Land spaniels crouched to mark game for the hunters' nets, and every setter was built up from them. They also fed into the toy spaniels and the water spaniels. They are now extinct.",
  "Rache": "The rache was a medieval running hound that ranged and flushed game, the closest in its work to a bird dog. Linking it to the land spaniels is a reconstruction rather than recorded descent, since Caius listed the land spaniel separately. It is now extinct.",
  "Carriage guard dogs": "Carriage dogs ran alongside the horses and guarded the coach on the road. The Dalmatian was made for exactly that job. The older carriage dogs are now extinct.",
  "Old German Ratters": "The old German ratters were quick vermin dogs on German farms. They fed into the German Pinscher, the Schnauzer and the Affenpinscher, and they are now extinct.",
  "Old German farm guards": "Old German farm guards were the dogs that worked alongside the ratters and cattle dogs on German farms. They fed into the Schnauzer-type farm dogs and the German spitz, and they are now extinct.",
  "Roman drover dogs": "Roman armies drove their cattle with them, and the drover dogs left behind along the Rhine and Danube became the root of the Rottweiler and the German cattle dogs. The Roman dogs themselves are now extinct.",
  "Schnauzer-type farm dogs": "Wiry, all-round working dogs of the German farms were the type the German Pinscher came out of. They are now extinct.",
  "Ancient Spitz dogs": "The old northern spitz dogs spread south from the Arctic and fed into the German farm spitz, the Corgi and the Maltese. They are now extinct.",
  "Ancient Arctic Spitz": "The Arctic spitz family spread south from the far north. It stands behind the Siberian Husky and the Chukchi sled dogs, and as the ancient type it is now extinct.",
  "Zhokhov Island sled dogs": "Sled dogs lived on Zhokhov Island in Arctic Siberia around 9,500 years ago, and modern huskies still largely share their genome. They are now extinct.",
  "Taimyr wolf": "The Taimyr wolf lived on Siberia's Taimyr Peninsula during the Ice Age, about 35,000 years ago. Northern dog breeds such as the Siberian Husky still carry a part of its ancestry. It is now extinct.",
  "Old European water dogs": "The black German Pudel was an old European water dog, said to have been crossed in to give the solid black coat. It fed into the Poodle and the Bichon Frise, and it is now extinct.",
  "Corded herding dogs": "The Moors are said to have brought corded herding dogs from North Africa into Iberia in the 700s, and they are generally accepted as the root of Europe's water dogs. It is a theory rather than a record. They are now extinct.",
  "Portuguese fishing dogs": "Fishing crews on the Atlantic coast of Portugal worked with their own water dogs, which fed into the European water dogs and the fishermen's dogs of Newfoundland. They are now extinct.",
  "Local German cattle dogs": "The butchers of Rottweil kept cattle dogs to drive their herds to market. Those dogs are the direct root of the Rottweiler, and they are now extinct.",
  "Mediterranean miniature sighthounds": "Small coursing dogs were bred down as companions across Greece, Rome and Renaissance Italy. They lead to the Italian Greyhound and Europe's old lapdogs, and they are now extinct.",
  "Roman Molossers": "The Romans brought guard mastiffs over the Alps, and those dogs became the Alpine mastiffs behind the Saint Bernard. The Roman dogs are now extinct.",
  "Newfoundland landrace dogs": "When hard winters thinned the Saint Bernard hospice line in the 1800s, Newfoundland dogs were crossed in to add size and coat. They also fed into the St John's Water Dog, and they are now extinct.",
  "Mountain coursing Hounds": "High-altitude hunting dogs gave the Afghan Hound its heavy coat and big feet for rough mountain ground. Those mountain hounds are now extinct.",
  "Central Asian Tazi hounds": "The Tazi were feathered sighthounds of the Central Asian steppe, and the mountain hounds behind the Afghan Hound were bred up from them. They are now extinct.",
  "Scythian steppe dogs": "The Scythians were horse nomads of the ancient steppe, and their rough-coated coursing hounds are a likely root of the Afghan Hound's line, though not a recorded one. They are now extinct.",
  "Old German hunting dogs": "The courtiers of Weimar refined their estates' all-round hunting dogs into one type, the Weimaraner. The older hunting dogs are now extinct.",
  "German bracke scenthounds": "The German brackes were trailing hounds, and they are at the base of both the Dachshund and the Weimaraner's line. They are now extinct.",
  "Old Welsh Grey Sheepdog": "The Old Welsh Grey was a shaggy grey hill sheepdog from Wales, worked loose-eyed and noisy like the Bearded Collie. It fed into the Beardie and the Old English Sheepdog, and it is now extinct.",
  "Welsh herding dogs": "Wales had its own long-legged, loose-eyed herding and droving dogs. They stand behind the Welsh Grey Sheepdog, the Old English Sheepdog and the Corgis, and they are now extinct.",
  "Celtic herdsmen's dogs": "The Celtic tribes kept all-round farm dogs to guard and drive their herds, and those dogs are part of the root of Britain's shepherd's dogs. They are now extinct.",
  "Anglo-Saxon herding dogs": "Collie-sized herding dogs have been found at Anglo-Saxon sites such as West Stow and Brandon. They came with the Anglo-Saxons from the North Sea coast rather than from native Celtic stock, and they fed into Britain's shepherd's dogs. They are now extinct.",
  "Continental Germanic herding dogs": "The Saxons and Angles kept herding dogs on the North Sea coastal plain and brought them to Britain when they migrated. Their line also fed into the German Shepherd's ancestors. They are now extinct.",
  "Norse settlers dogs": "Viking settlers brought Scandinavian dogs to Britain, and they were likely mixed into the local herding stock. Those Norse dogs are now extinct.",
  "Shaggy upland herders": "Rough-coated hill dogs of the old herding type fed into the Welsh Grey Sheepdog and, through it, the Old English Sheepdog. They are now extinct.",
  "Old working collies": "The old hill collies of Scotland and the Borders were the shared working stock that the Rough, Smooth and Border Collies all grew from. They are now extinct.",
  "Old Toy Spaniels": "Tudor and Stuart England had small sporting and lap spaniels, the forerunners of the King Charles and Cavalier King Charles Spaniels. They are now extinct.",
  "Asian flat-faced toy dogs": "Pug and oriental toy dogs were crossed into the King Charles Spaniel, shortening its muzzle. Those Asian toy dogs are now extinct.",
  "Continental toy Spaniels": "Dwarf spaniels were painted on noble laps across France, Spain and Italy through the Renaissance, and they are the forerunners of the Papillon. They are now extinct.",
  "Old European lapdogs": "Europe's old court lapdogs were crossed with the toy spaniels to make them small, and they fed into the Papillon and the Affenpinscher. They are now extinct.",
  "Mediterranean Bichon lapdogs": "White bichon lapdogs were kept around the Mediterranean, and they are the forerunners of the Bichon Frise and the Maltese. They are now extinct.",
  "Ancient Melitaean dogs": "Little white dogs were kept on ancient Malta and the Greek islands, and they are the Maltese's forerunners. They are now extinct.",
  "Chukchi sled dogs": "The Chukchi people of the Siberian Arctic ran endurance sled teams, and the Siberian Husky is almost unchanged from their dogs. The original Chukchi dogs are now extinct.",
  "Working hunt Terriers": "Hardy local terriers were kept for going to ground after foxes, and the Jack Russell Terrier was bred from them. They are now extinct.",
  "Water Spaniels": "Britain had its own working water spaniels, which Caius listed separately from the water dogs in 1576. They fed into the Poodle, the Wavy-Coated Retriever and the English Setter, and they are now extinct.",
  "Rough water dogs": "Shaggy, water-loving dogs did the wet work of the hunt, and they fed into the Otterhound. They are now extinct.",
  "St John's Water Dog": "The St John's Water Dog was a fishing dog from Newfoundland, and every retriever descends from it, the Labrador included. It is now extinct.",
  "Fishermen's water dogs": "European fishing crews brought working water dogs across the Atlantic to Newfoundland, where they became the St John's Water Dog. They are now extinct.",
  "Old Irish water dogs": "Ireland had southern and northern water spaniels, joined into one breed, the Irish Water Spaniel, in the 1830s. The older types are now extinct.",
  "Old black-and-tan Setters": "Old black-and-tan setting dogs are the foundation of the Gordon Setter. They are now extinct.",
  "Old hill and bearded Collies": "Shaggy upland herding dogs of the collie family fed into the Rough Collie. They are now extinct.",
  "Old Welsh Land Spaniels": "Wales had its own native red-and-white working spaniels, the forerunners of the Welsh Springer Spaniel. They are now extinct.",
  "Old Scottish working Terriers": "The old island working terriers of Scotland were once grouped together as short-haired Skyes. They fed into the Cairn, the Scottish and the Skye Terrier, and they are now extinct.",
  "Parisian Ratters": "Ratting dogs from the city of Paris were crossed into the French Bulldog, and they are thought to have fixed its upright bat ears. They are now extinct.",
  "Early Mesoamerican dogs": "Lean early dogs lived in ancient Mexico, and the Techichi, the Chihuahua's ancestor, was bred from them. They are now extinct.",
  "Small imported dogs": "Later traders brought tiny dogs into Mexico that are thought to have given the Chihuahua its coat and bold, terrier-like spark. They are now extinct.",
  "Thuringian herding dogs": "The prick-eared, curl-tailed herding dogs of central Germany gave the German Shepherd its alert look. They are now extinct.",
  "Wurttemberg Sheepdogs": "The larger, steadier herding dogs of southern Germany gave the German Shepherd its size and calm working head. They are now extinct.",
  "Old earth Terriers": "Terrier-type earth dogs are thought to have given the Dachshund its grit for going underground after badger and fox. They are now extinct.",
  "Old Border Terriers": "The local working terriers of Rothbury and the Border country fed into the Bedlington and the Dandie Dinmont Terriers. They are now extinct.",
  "Old fell Terriers": "Hardy fox-working terriers of the fells shaped the Border Terrier's type. They are now extinct.",
  "Old Scotch Collie": "The Old Scotch Collie was the Scottish shepherd's hill-herding dog, working the hills long before there were dog shows. It fed the working strain that became the Border Collie, and it is now extinct.",
  "Old Cumberland herding dogs": "Northern English herding dogs from Cumberland worked the same Border country and fed into the Border Collie. They are now extinct.",
  "Brabant Bullenbeisser": "The Brabant Bullenbeisser was a smaller, athletic German catch dog with a broad bite, a square build and a slightly upturned muzzle. The FCI names it as the Boxer's direct ancestor. It is now extinct.",
  "Great Bullenbeisser (Danziger Bullenbeisser)": "The Great Bullenbeisser was a heavy northern German dog, around 60 to 65cm tall and 40 to 50kg, used to seize and hold boar, bear and bull. The smaller Brabant type, the Boxer's ancestor, came from it. It is now extinct.",
  "Medieval Alaunts dogs": "Medieval Alaunts were European catch dogs bred from the dogs the Alans and other steppe peoples brought west. They were bred for size, grip and courage in the hunt and in war, and they fed into the German Bullenbeisser, the Boxer's ancestor. They are now extinct.",
  "Early Boar hunting dogs": "Large, rough hunting dogs of northern Europe appear in Roman accounts of the Germanic tribes, bred to seize and hold boar and bear. Crossed with the Alaunt lines, they produced the German bull-baiting dog behind the Boxer. They are now extinct.",
  "German Bullenbeisser dogs": "German Bullenbeissers were regional catch dogs bred to seize boar, bear and bull by the muzzle. The larger ones worked as boarhounds, and the smaller Brabant line became the Boxer. They are now extinct.",
};

// Any facts written straight in here join the pool too.
export const EXTRA_FACTS: string[] = [];

const firstSentence = (t: string): string => {
  const m = t.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (m ? m[0] : t).trim();
};
const withArticle = (name: string) => (/^[aeiou]/i.test(name) ? `an ${name}` : `a ${name}`);

function famousFacts(): string[] {
  const nameOf = new Map(breeds.filter((b) => !!b.slug).map((b) => [b.slug, b.name]));
  const out: string[] = [];
  for (const [slug, dogs] of Object.entries(famousDogs)) {
    const breed = nameOf.get(slug);
    if (!breed) continue;
    for (const d of dogs) {
      const known = d.knownFor.trim();
      out.push(d.type.startsWith("Real")
        ? `${d.name}, the ${known.charAt(0).toLowerCase() + known.slice(1)}, was ${withArticle(breed)}.`
        : `${d.name} from ${known} is ${withArticle(breed)}.`);
    }
  }
  return out;
}

let cache: string[] | null = null;
// Every fact in the pool, each once, longer than a scrap.
export function allDogFacts(): string[] {
  if (cache) return cache;
  const history = SECTIONS.flatMap((s) => s.facts.map((f) => f.text));
  const breedLines = Object.values(breedInfo as Record<string, string>).map(firstSentence);
  cache = [...new Set([...history, ...CHATBOT_FACTS, ...famousFacts(), ...breedLines, ...Object.values(EXTINCT_REWRITES), ...EXTRA_FACTS].map((f) => f.trim()))].filter((f) => f.length > 20);
  return cache;
}
