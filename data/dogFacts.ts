/* THE PIT'S "DID YOU KNOW?" FACTS, 25 September 2026 (owner: random dog facts
   from everything the site already holds, not just the breed write-ups).
   Built once, from:
     1. the history page's "Did you know?" facts (historySections.ts);
     2. the chatbot's approved breed lines (copied from the pick-a-chum branch's
        assembler, where they are BREED_FACTS; not on main otherwise);
     3. the famous dogs (famousDogs.ts), written as a sentence each;
     4. the first sentence of every breed write-up (breedInfo.ts);
     5. the 95 extinct ancestors, rewritten to stand on their own (EXTINCT_REWRITES);
     6. myths and legends, each shown with the truth (MYTHS).
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
   Put into plain English for children the same day (owner): words such as
   steppe and sighthound are explained where they are kept, and terms such as
   "fixed", "stock", "type", "forerunner" and "coursing" are replaced.
   The closing "now extinct" line was taken off every one the same day (owner:
   obvious from the fact, and not the interesting part).
   Used on the fact card only: the learn box and lifted card keep their notes. */
export const EXTINCT_REWRITES: Record<string, string> = {
  "Ancient eastern sighthounds": "Ancient eastern sighthounds were slender, speedy dogs from Egypt and the Near East that hunted by sight, spotting their prey and chasing it down. Their speed was passed west to the Celts' hounds and on into Britain's greyhounds.",
  "Old hunting dogs of the Celts": "The old hunting dogs of the Celts were the running dogs of Iron Age Europe, more than 2,000 years ago. They are the great-great-ancestors of the Celtic hounds, the Celts' sheepdogs and dogs that hunt by smell, a family that leads all the way to today's Greyhound and Bloodhound.",
  "Ancient Molossers": "The Ancient Molossers were big, heavy guard dogs, strong enough to bring down a wolf. Their size and strength went into the English Mastiff, the Irish Wolfhound and the Saint Bernard.",
  "Old Mastiffs of the East": "The Old Mastiffs of the East were huge guard and hunting dogs, carved on palace walls thousands of years ago. Their giant size was passed on to the big guard dogs of Europe.",
  "Medieval Bloodhound": "The Medieval Bloodhound was a heavy, slow hunting dog with an amazing nose, used to follow a trail by smell in the Middle Ages. Today's Bloodhound and Otterhound come from it.",
  "Norman Hound": "The Norman Hound was a big, slow, deep-voiced hunting hound from Normandy, bred from the St Hubert and local hounds. It is said to have come to England with the Normans after 1066 and is believed to stand behind the Talbot and the Bloodhound.",
  "Old scenting Hounds": "The old scenting hounds were the heavy continental tracking dogs that the abbey of St Hubert built its famous hounds from. Through the St Hubert Hound and the Talbot they lead to today's Bloodhound.",
  "Segusian tracking Hounds": "The Segusian hounds were shaggy dogs from Gaul, which is now France. The Romans knew them by name, because they were brilliant at following a smell. They led to later dogs that hunt by smell, including the Norman Hound.",
  "Laconian tracking Hounds": "The Laconian hounds of ancient Greece followed hares by their smell, and Greek writers praised their clever noses. They are among the ancestors of later smell-hunting dogs such as the St Hubert Hound.",
  "Old trail dogs of the East": "The old trail dogs of the East were among the very first dogs bred to follow a trail by smell. They are the earliest ancestors of the Laconian hounds of Greece, and through them of Europe's smell-hunting dogs.",
  "Chien-gris": "The Chien-gris were the grey hounds of the French royal packs. Tradition says they came west with King Louis IX from the Crusades, though that is an old story rather than recorded descent. They are counted among the roots of the Otterhound.",
  "Old British Bandogs": "Bandogs were the heavy chained dogs of old England, kept tied up by day and let loose at night to guard, and worked by butchers and baiters alike. They fed into the English Mastiff and the Old English Bulldog.",
  "Alaunt war dogs": "The Alaunts were fierce war dogs that came west with warriors on horseback from the steppe, the huge grasslands stretching across Eastern Europe and Asia. They were trained to grab large animals and hold on. Their blood runs into the Mastiff, the Great Dane and the Old English Bulldog.",
  "Dogs of the Alan horsemen": "The Alans were horse riders from the steppe, the huge grasslands of Eastern Europe and Asia, and their big dogs guarded camps and herds across the plains. Those dogs became the Alaunts, the war dogs behind the Mastiff and the Great Dane.",
  "Medieval British Mastiff": "The medieval British mastiff was a heavy war and hunting dog that gave later breeds their bulk and bone, including the Great Dane and the Bulldog.",
  "Old German boarhounds": "The old German boarhounds were packs of hunting dogs that did the dangerous job of hunting wild boar, long before anyone had turned them into a proper breed. The Great Dane comes from them.",
  "Old English Bulldog": "The Old English Bulldog was taller, leaner and much fiercer than today's Bulldog. It was used in bull-baiting, a cruel old sport where dogs fought bulls, which was banned in 1835. Today's gentle Bulldog comes from it.",
  "Ancient Chinese toy dogs": "Ancient Chinese toy dogs were the flat-faced lapdogs of the imperial court, kept alongside the Pekingese and the lion dogs. They stand behind the Pug and the Shih Tzu.",
  "Ancient Chinese court dogs": "The Lo-sze were little flat-faced lapdogs bred for the laps and sleeves of the Han court from around 200 BC. They are the oldest root of China's toy dogs and, through them, of the Pug.",
  "Eastern Lion dogs": "The eastern lion dogs were a wider family of small companion dogs from Tibet and China. They are part of the Pug's ancestry.",
  "Tibetan temple dogs": "Tibetan monks bred small, long-coated lion dogs from the 600s and gave them as gifts to the Chinese court. Those temple dogs stand behind the Shih Tzu.",
  "Tibetan village dogs": "Sturdy working dogs in Tibetan villages were the dogs the monks bred their small temple dogs from. Through the temple dogs they lead to the Shih Tzu and the Pug.",
  "Black and Tan Terrier": "The Black and Tan Terrier was a British working terrier, and the white terriers were selected out of it for their coat colour. It also fed into the Manchester Terrier and the Fox Terrier.",
  "Old British ratting Terriers": "Britain's old ratting terriers were farm dogs kept to catch rats and mice, long before breeds had names. They led to the Black and Tan Terrier and the ratting dogs of Paris.",
  "Ancient Celtic earth dogs": "Before the Romans arrived, Celtic tribes across northern Europe kept short-legged hunting dogs that could squeeze into underground burrows. They are the ancestors of Britain's burrow-hunting dogs.",
  "Early Badger hunting dogs": "The Celts are said to have brought long, low hunting dogs to Cardiganshire, short-legged dogs bred to follow badger and fox underground. They stand behind the Cardigan Welsh Corgi and the German ratters.",
  "Earth and hunt terriers": "Earth and hunt terriers were hardy dogs that went underground to bolt foxes and badgers. They fed into the Black and Tan Terrier and the Lurcher.",
  "Old Balkan spotted hounds": "The inland Balkans had old patched hounds, one of the spotted lines counted among the Dalmatian's ancestors.",
  "Medieval Greyhound": "The medieval Greyhound was the noble hunting hound of Norman and Plantagenet England. It was so prized that Canute's Forest Laws of 1016 kept it from commoners, and King John accepted greyhounds as payment of fines. Today's Greyhound descends from it.",
  "Gaulish coursing Hounds": "The vertragus hounds of Gaul, now France, were super-fast dogs that chased animals by sight, and Roman writers admired them for their speed. They led to the Celtic Coursing Hound.",
  "Old Desert coursing dogs": "The first slender, speedy chasing dogs came from the old desert lands. They are the earliest ancestors of the ancient eastern sighthounds, and so of the whole Greyhound family.",
  "The First Setters": "The first setters brought style and steadiness to the shooting dog. Their blood fed into the Pointer, the Wavy-Coated Retriever and the Labrador.",
  "Land Spaniels": "Land spaniels crouched to mark game for the hunters' nets, and every setter was built up from them. They also fed into the toy spaniels and the water spaniels.",
  "Rache": "The rache was a medieval hunting dog that ran ahead and chased birds and animals out of hiding, a lot like a modern gundog. Linking it to the land spaniels is a best guess rather than a recorded fact.",
  "Carriage guard dogs": "Carriage dogs ran alongside the horses and guarded the coach on the road. The Dalmatian was made for exactly that job.",
  "Old German Ratters": "The old German ratters were quick dogs kept on German farms to catch rats and mice. They led to the German Pinscher, the Schnauzer and the Affenpinscher.",
  "Old German farm guards": "The old German farm guards were the dogs that watched over German farms alongside the ratters and cattle dogs. They led to the Schnauzer's ancestors and the German farm spitz dogs.",
  "Roman drover dogs": "Roman armies drove their cattle with them, and the drover dogs left behind along the Rhine and Danube became the root of the Rottweiler and the German cattle dogs.",
  "Schnauzer-type farm dogs": "Wiry, hard-working dogs of the German farms, a bit like today's Schnauzers, were the dogs the German Pinscher came from.",
  "Ancient Spitz dogs": "The old northern spitz dogs spread south from the Arctic and fed into the German farm spitz, the Corgi and the Maltese.",
  "Ancient Arctic Spitz": "The Arctic spitz dogs were thick-coated dogs with pricked ears and curly tails that spread south from the far north. They are the ancestors of the Siberian Husky and the Chukchi sled dogs.",
  "Zhokhov Island sled dogs": "Sled dogs lived on Zhokhov Island in Arctic Siberia around 9,500 years ago, and modern huskies still largely share their genome.",
  "Taimyr wolf": "The Taimyr wolf lived on Siberia's Taimyr Peninsula during the Ice Age, about 35,000 years ago. Northern dog breeds such as the Siberian Husky still carry a part of its ancestry.",
  "Old European water dogs": "The black German Pudel was an old European water dog, said to have been crossed in to give the solid black coat. It fed into the Poodle and the Bichon Frise.",
  "Corded herding dogs": "The Moors are said to have brought corded herding dogs from North Africa into Iberia in the 700s, and they are generally accepted as the root of Europe's water dogs. It is a theory rather than a record.",
  "Portuguese fishing dogs": "Fishing crews on the Atlantic coast of Portugal worked with their own water dogs, which fed into the European water dogs and the fishermen's dogs of Newfoundland.",
  "Local German cattle dogs": "The butchers of Rottweil kept cattle dogs to drive their herds to market. Those dogs are the direct root of the Rottweiler.",
  "Mediterranean miniature sighthounds": "People in ancient Greece, Rome and Renaissance Italy bred small, speedy chasing dogs down in size to keep as pets. They led to the Italian Greyhound and Europe's old lapdogs.",
  "Roman Molossers": "The Romans brought guard mastiffs over the Alps, and those dogs became the Alpine mastiffs behind the Saint Bernard.",
  "Newfoundland landrace dogs": "When hard winters thinned the Saint Bernard hospice line in the 1800s, Newfoundland dogs were crossed in to add size and coat. They also fed into the St John's Water Dog.",
  "Mountain coursing Hounds": "High-altitude hunting dogs gave the Afghan Hound its heavy coat and big feet for rough mountain ground.",
  "Central Asian Tazi hounds": "The Tazi were speedy, feathery-coated dogs of the Central Asian steppe, the huge grasslands of Asia, that hunted by sight. The mountain dogs behind the Afghan Hound came from them.",
  "Scythian steppe dogs": "The Scythians were horse riders who roamed the steppe, the huge grasslands of Eastern Europe and Asia, in ancient times. Their rough-coated chasing dogs may be the Afghan Hound's ancestors, though nobody wrote it down at the time.",
  "Old German hunting dogs": "The nobles of Weimar in Germany took the good all-round hunting dogs on their estates and bred them into one breed, the Weimaraner.",
  "German bracke scenthounds": "The German brackes were hunting dogs that followed a trail by smell. Both the Dachshund and the Weimaraner's ancestors come from them.",
  "Old Welsh Grey Sheepdog": "The Old Welsh Grey was a shaggy grey hill sheepdog from Wales, worked loose-eyed and noisy like the Bearded Collie. It fed into the Beardie and the Old English Sheepdog.",
  "Welsh herding dogs": "Wales had its own long-legged dogs for herding sheep and driving cattle to market. They are behind the Welsh Grey Sheepdog, the Old English Sheepdog and the Corgis.",
  "Celtic herdsmen's dogs": "The Celtic tribes kept all-round farm dogs to guard and drive their herds, and those dogs are part of the root of Britain's shepherd's dogs.",
  "Anglo-Saxon herding dogs": "Collie-sized herding dogs have been dug up at Anglo-Saxon sites such as West Stow and Brandon. They came to Britain with the Anglo-Saxons from across the North Sea, and they led to Britain's sheepdogs.",
  "Continental Germanic herding dogs": "The Saxons and Angles kept herding dogs on the North Sea coastal plain and brought them to Britain when they migrated. Their line also fed into the German Shepherd's ancestors.",
  "Norse settlers dogs": "Viking settlers brought their Scandinavian dogs to Britain, and those dogs were probably mixed in with the local sheepdogs.",
  "Shaggy upland herders": "Shaggy hill sheepdogs of the old kind led to the Welsh Grey Sheepdog and, through it, the Old English Sheepdog.",
  "Old working collies": "The old hill collies of Scotland and the Borders were the working sheepdogs that the Rough, Smooth and Border Collies all grew from.",
  "Old Toy Spaniels": "In Tudor and Stuart times, England had small spaniels for hunting and cuddling. They were the ancestors of the King Charles and Cavalier King Charles Spaniels.",
  "Asian flat-faced toy dogs": "Pug and oriental toy dogs were crossed into the King Charles Spaniel, shortening its muzzle.",
  "Continental toy Spaniels": "Tiny spaniels sat on the laps of rich people in France, Spain and Italy, and appear in paintings from the Renaissance. They are the ancestors of the Papillon.",
  "Old European lapdogs": "Europe's old court lapdogs were crossed with the toy spaniels to make them small, and they fed into the Papillon and the Affenpinscher.",
  "Mediterranean Bichon lapdogs": "Little white fluffy lapdogs were kept around the Mediterranean, and they are the ancestors of the Bichon Frise and the Maltese.",
  "Ancient Melitaean dogs": "Little white dogs were kept on the island of Malta and the Greek islands in ancient times, and they are the Maltese's ancestors.",
  "Chukchi sled dogs": "The Chukchi people of the Siberian Arctic ran endurance sled teams, and the Siberian Husky is almost unchanged from their dogs.",
  "Working hunt Terriers": "Tough local terriers were kept to follow foxes down their holes, and the Jack Russell Terrier was bred from them.",
  "Water Spaniels": "Britain had its own working water spaniels, which Caius listed separately from the water dogs in 1576. They fed into the Poodle, the Wavy-Coated Retriever and the English Setter.",
  "Rough water dogs": "Shaggy, water-loving dogs did the wet work of the hunt, and they fed into the Otterhound.",
  "St John's Water Dog": "The St John's Water Dog was a fishing dog from Newfoundland, and every retriever descends from it, the Labrador included.",
  "Fishermen's water dogs": "European fishing crews brought working water dogs across the Atlantic to Newfoundland, where they became the St John's Water Dog.",
  "Old Irish water dogs": "Ireland had southern and northern water spaniels, joined into one breed, the Irish Water Spaniel, in the 1830s.",
  "Old black-and-tan Setters": "Old black-and-tan hunting dogs that crouched down to show hunters where birds were hiding are the ancestors of the Gordon Setter.",
  "Old hill and bearded Collies": "Shaggy upland herding dogs of the collie family fed into the Rough Collie.",
  "Old Welsh Land Spaniels": "Wales had its own red-and-white hunting spaniels, the ancestors of the Welsh Springer Spaniel.",
  "Old Scottish working Terriers": "The old island working terriers of Scotland were once grouped together as short-haired Skyes. They fed into the Cairn, the Scottish and the Skye Terrier.",
  "Parisian Ratters": "Rat-catching dogs from the streets of Paris were mixed into the French Bulldog, and they are thought to have given it its famous tall bat ears.",
  "Early Mesoamerican dogs": "Lean early dogs lived in ancient Mexico, and the Techichi, the Chihuahua's ancestor, was bred from them.",
  "Small imported dogs": "Later traders brought tiny dogs into Mexico that are thought to have given the Chihuahua its coat and bold, terrier-like spark.",
  "Thuringian herding dogs": "The prick-eared, curl-tailed herding dogs of central Germany gave the German Shepherd its alert look.",
  "Wurttemberg Sheepdogs": "The larger, steadier herding dogs of southern Germany gave the German Shepherd its size and calm working head.",
  "Old earth Terriers": "Tough little terriers are thought to have given the Dachshund its courage for squeezing into burrows after badgers and foxes.",
  "Old Border Terriers": "The local working terriers of Rothbury and the Border country fed into the Bedlington and the Dandie Dinmont Terriers.",
  "Old fell Terriers": "Tough fox-hunting terriers from the fells, the hills of northern England, helped shape the Border Terrier.",
  "Old Scotch Collie": "The Old Scotch Collie was the Scottish shepherd's sheepdog, herding on the hills long before there were dog shows. The Border Collie grew from it.",
  "Old Cumberland herding dogs": "Northern English herding dogs from Cumberland worked the same Border country and fed into the Border Collie.",
  "Brabant Bullenbeisser": "The Brabant Bullenbeisser, which means bull-biter, was a strong, sporty German dog with a square body and a slightly turned-up nose. Dog experts name it as the Boxer's direct ancestor.",
  "Great Bullenbeisser (Danziger Bullenbeisser)": "The Great Bullenbeisser was a big, heavy German dog, weighing up to 50 kilos, trained to grab boar, bears and bulls and hold on. The smaller Brabant Bullenbeisser, the Boxer's ancestor, came from it.",
  "Medieval Alaunts dogs": "Medieval Alaunts were big, brave European dogs that came from the dogs the Alans brought west from the steppe, the huge grasslands of Asia. They were trained to grab large animals in hunts and battles, and they led to the German Bullenbeisser, the Boxer's ancestor.",
  "Early Boar hunting dogs": "Big, rough hunting dogs of northern Europe appear in Roman writings about the Germanic tribes. They were bred to grab and hold wild boar and bears rather than chase them. Mixed with the Alaunts, they made the German bull-biting dogs behind the Boxer.",
  "German Bullenbeisser dogs": "German Bullenbeissers, which means bull-biters, were dogs trained to grab boar, bears and bulls and hold on. The bigger ones hunted boar, and the smaller Brabant line became the Boxer.",
};

/* MYTHS AND LEGENDS, 25 September 2026 (owner: the stories we chose not to put in
   the family trees, and the common myths about dogs). Each is shown clearly as a
   myth or a legend, with the truth alongside, so nothing false is passed off as
   fact. The fact card gives them their own heading ("Myth buster!" or "Legend
   has it"): see factHeadFor. */
type Myth = { kind: "Myth" | "Legend"; claim: string; truth: string };
const MYTHS: Myth[] = [
  { kind: "Myth", claim: "Dogs only see in black and white.", truth: "Dogs can see some colours, mostly blues and yellows. Reds and greens just look greyish to them." },
  { kind: "Myth", claim: "One dog year is the same as seven human years.", truth: "Dogs grow up much faster at first, so a one-year-old dog is more like a teenager. Small dogs usually age more slowly than big ones." },
  { kind: "Myth", claim: "A warm, dry nose means a dog is ill.", truth: "A dog's nose can be warm or dry for lots of harmless reasons, like napping in the sun. It is not a good way to tell if a dog is poorly." },
  { kind: "Myth", claim: "Dogs cool down by sweating, like us.", truth: "Dogs cool down mostly by panting. They only sweat a tiny bit, through the pads of their paws." },
  { kind: "Myth", claim: "Saint Bernards carried little barrels of brandy round their necks.", truth: "The famous barrel comes from paintings, especially one by the artist Edwin Landseer. The monks' real rescue dogs did not carry them." },
  { kind: "Myth", claim: "Barry, the famous rescue dog, was killed by a traveller who mistook him for a wolf.", truth: "That is just a story. Barry retired to the city of Bern and died of old age in 1814, and you can still see him in the Natural History Museum there." },
  { kind: "Myth", claim: "The Labrador comes from Labrador in Canada.", truth: "Its ancestors came from Newfoundland, the island next door. British breeders gave it the name Labrador later." },
  { kind: "Myth", claim: "Dalmatian puppies are born with their spots.", truth: "Dalmatian puppies are born pure white. Their spots start to appear when they are about two weeks old." },
  { kind: "Myth", claim: "Basenjis cannot make any noise.", truth: "Basenjis do not bark like other dogs, but they can make a funny yodelling sound instead." },
  { kind: "Myth", claim: "A wagging tail always means a happy dog.", truth: "Dogs also wag when they are excited, nervous or unsure. How high the tail is held tells you more than the wag." },
  { kind: "Myth", claim: "You can't teach an old dog new tricks.", truth: "Dogs can learn new things at any age. Older dogs may just take a little longer." },
  { kind: "Myth", claim: "A dog's mouth is cleaner than a person's.", truth: "Dogs' mouths are full of germs too, just different ones from ours." },
  { kind: "Myth", claim: "Dogs only eat grass when they feel ill.", truth: "Lots of healthy dogs munch on grass, and most of them are not sick afterwards." },
  { kind: "Myth", claim: "A special law lets Cavalier King Charles Spaniels into the Houses of Parliament.", truth: "There is no such law. It is a popular story, but it is not true." },
  { kind: "Myth", claim: "Greyhounds need huge amounts of exercise.", truth: "Greyhounds are sprinters. They love a short, fast run, then a very long nap, which is why they are called 40-mile-an-hour couch potatoes." },
  { kind: "Myth", claim: "Huskies are part wolf.", truth: "Siberian Huskies are completely domestic dogs. They just look a little like wolves." },
  { kind: "Myth", claim: "The Poodle comes from France.", truth: "The name comes from the German word Pudel, from an old word for splashing in water, because it began as a German water dog. France later made it its national dog." },
  { kind: "Myth", claim: "The Poodle's fancy haircut is just for show.", truth: "It began as a practical clip for swimming. Hair was left on the chest and joints to keep them warm, and trimmed elsewhere so the dog could swim more easily." },
  { kind: "Myth", claim: "Dachshunds were bred to look like sausages just for fun.", truth: "Dachshund means badger dog in German. Their long, low bodies were made for squeezing down badger holes." },
  { kind: "Myth", claim: "Bulldogs' flat faces were bred for fighting bulls.", truth: "The old bull-baiting Bulldog had a longer face. The very flat face came much later, when Bulldogs were bred for their looks at dog shows." },
  { kind: "Myth", claim: "A dog with a guilty look knows it has been naughty.", truth: "Scientists have found that the guilty look is mostly a reaction to being told off, not a sign the dog feels guilty." },
  { kind: "Myth", claim: "Dogs and cats are always enemies.", truth: "Plenty of dogs and cats live together happily, especially if they grow up together." },
  { kind: "Legend", claim: "Lord Orford crossed his greyhounds with a bulldog in the 1700s to give them more courage.", truth: "Many greyhound fans tell this story, but it is hard to prove, so we have left it out of our Greyhound family tree." },
  { kind: "Legend", claim: "The Chien-gris, the grey hounds of the French kings, came back from the Crusades with King Louis IX.", truth: "It is an old story, but nobody has found records to prove it." },
  { kind: "Legend", claim: "The Norman Hound came to England with William the Conqueror in 1066.", truth: "It is often said, and it may be true, but there is no written record from the time to prove it." },
  { kind: "Legend", claim: "Prince Llywelyn killed his loyal dog Gelert, thinking it had hurt his baby, and the dog's grave is at Beddgelert in Wales.", truth: "The grave was probably made up in the 1700s by a local innkeeper to bring visitors to the village." },
  { kind: "Legend", claim: "Greyfriars Bobby guarded his master's grave in Edinburgh for 14 years.", truth: "That is the famous story, but some historians think it grew in the telling, and there may even have been more than one Bobby." },
  { kind: "Legend", claim: "The Pekingese was born when a lion fell in love with a tiny marmoset monkey.", truth: "It is a sweet old Chinese story, but Pekingese simply come from the little dogs of the Chinese royal court." },
  { kind: "Legend", claim: "In Welsh folklore, fairies rode Corgis, and the marks on a Corgi's back show where the fairy saddle sat.", truth: "It is a lovely fairy tale. The markings are just part of the Corgi's coat." },
  { kind: "Legend", claim: "The Chow Chow got its blue-black tongue by licking up drops of paint while the sky was being painted blue.", truth: "It is a fun story, but the Chow's dark tongue is just its natural colour." },
  { kind: "Legend", claim: "A Pug called Pompey saved Prince William of Orange in 1572 by barking to wake him when enemies crept up.", truth: "It is a famous story from the Netherlands, and Pugs became favourites of the Dutch royal family afterwards." },
  { kind: "Legend", claim: "A huge black ghost dog called Black Shuck burst into churches in Suffolk during a terrible storm in 1577.", truth: "It is an East Anglian ghost story. The scorch marks on the door of Blythburgh church are still called the devil's fingerprints." },
  { kind: "Legend", claim: "The Afghan Hound was one of the dogs Noah took onto the Ark.", truth: "It is an old story told about the breed, but there is no real evidence for it." },
  { kind: "Legend", claim: "The Dalmatian comes from Dalmatia, in Croatia.", truth: "The name comes from there, but nobody is sure where the breed first began, as spotted dogs appear in old pictures from many places." },
];
const MYTH_LEAD: Record<Myth["kind"], [string, string]> = { Myth: ["Myth:", "The truth:"], Legend: ["Legend:", "What we know:"] };
// The heading the fact card shows for a fact, worked out from how it begins.
export function factHeadFor(fact: string): string {
  if (fact.startsWith("Myth:")) return "Myth buster!";
  if (fact.startsWith("Legend:")) return "Legend has it";
  return "Did you know?";
}

// Any facts written straight in here join the pool too.
export const EXTRA_FACTS: string[] = [];

const firstSentence = (t: string): string => {
  const m = t.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (m ? m[0] : t).trim();
};
const withArticle = (name: string) => (/^[aeiou]/i.test(name) ? `an ${name}` : `a ${name}`);

/* FACT-CHECKED OVERRIDES, 25 September 2026 (owner: "Bull's-eye was not a Bull
   Terrier, the breed had not been invented yet"). The famous dogs are written
   from a template ("[dog] from [story] is a [breed]"), which flattens cases where
   the breed depends on the version, came later than the story, or is uncertain.
   Each of these was checked; the fact below replaces the template's. null leaves
   the dog out of the facts entirely (unverified). Keyed "breed-slug|dog name".
   The breed pages' own famous-dog lists are untouched by this. */
const FAMOUS_OVERRIDES: Record<string, string | null> = {
  // Dickens only calls him "a white shaggy dog"; the Bull Terrier dates from the 1860s.
  "bull-terrier|Bull's-eye": "In Oliver Twist (1838), Dickens described Bill Sikes's dog Bull's-eye only as a white, shaggy dog. He is usually shown as a Bull Terrier on stage and screen, but that breed was not developed until the 1860s.",
  // Queen Victoria's Dash (1830s) was a King Charles Spaniel; the Cavalier dates from the 1920s.
  "cavalier-king-charles-spaniel|Dash": "Queen Victoria's much-loved dog Dash was a King Charles Spaniel. The Cavalier King Charles Spaniel, bred to look like the toy spaniels of old paintings, was only developed in the 1920s.",
  // The books call Fang a boarhound; the films cast Neapolitan Mastiffs.
  "mastiff|Fang": "In the Harry Potter books, Hagrid's dog Fang is a boarhound, an old name for a Great Dane. In the films he was played by Neapolitan Mastiffs.",
  // Barrie's Nana is a Newfoundland; Disney made her a Saint Bernard.
  "saint-bernard|Nana": "In J. M. Barrie's Peter Pan, the Darling children's nurse Nana is a Newfoundland. Disney's film made her a Saint Bernard.",
  // A stray of uncertain breed.
  "boston-terrier|Sergeant Stubby": "Sergeant Stubby was a stray, usually described as a Boston Terrier type, who became a decorated war dog in the First World War.",
  // An Irish Wolfhound in Disney's film only; the novel's Chief is a different hound.
  "irish-wolfhound|Chief": "In Disney's film The Fox and the Hound, the old hunting dog Chief is an Irish Wolfhound. In the original novel he is a different kind of hound.",
  // A legend, so hedged.
  "irish-wolfhound|Gelert": "In the Welsh legend of Llywelyn the Great, his faithful hound Gelert is traditionally said to have been a wolfhound.",
  // Barry lived before the breed was formalised.
  "saint-bernard|Barry": "Barry, the famous rescue dog of the Great St Bernard Hospice in the early 1800s, was one of the hospice dogs that became the Saint Bernard breed.",
  // Say who he is in the film (owner, 25 September 2026).
  "bull-terrier|Scud": "In Toy Story, Scud is the snarling dog that belongs to Sid, the toy-wrecking boy next door. He is a Bull Terrier.",
  // Not found in the PDSA's records; left out until verified.
  "staffordshire-bull-terrier|Sox": null,
};
function famousFacts(): string[] {
  const nameOf = new Map(breeds.filter((b) => !!b.slug).map((b) => [b.slug, b.name]));
  const out: string[] = [];
  for (const [slug, dogs] of Object.entries(famousDogs)) {
    const breed = nameOf.get(slug);
    if (!breed) continue;
    for (const d of dogs) {
      const key = `${slug}|${d.name}`;
      if (key in FAMOUS_OVERRIDES) {
        const fixed = FAMOUS_OVERRIDES[key];
        if (fixed) out.push(fixed);
        continue;
      }
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
  cache = [...new Set([...history, ...CHATBOT_FACTS, ...famousFacts(), ...breedLines, ...Object.values(EXTINCT_REWRITES), ...MYTHS.map((m) => `${MYTH_LEAD[m.kind][0]} ${m.claim} ${MYTH_LEAD[m.kind][1]} ${m.truth}`), ...EXTRA_FACTS].map((f) => f.trim()))].filter((f) => f.length > 20);
  return cache;
}
