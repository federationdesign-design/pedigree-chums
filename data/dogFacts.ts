/* THE PIT'S "DID YOU KNOW?" FACTS, 25 September 2026 (owner: random dog facts
   from everything the site already holds, not just the breed write-ups).
   Built once, from:
     1. the history page's "Did you know?" facts (historySections.ts);
     2. the chatbot's approved breed lines (copied from the pick-a-chum branch's
        assembler, where they are BREED_FACTS; not on main otherwise);
     3. the famous dogs (famousDogs.ts), written as a sentence each;
     4. the first sentence of every breed write-up (breedInfo.ts);
     5. the 95 extinct ancestors, rewritten to stand on their own (EXTINCT_REWRITES);
     6. myths and legends, each shown with the truth (MYTHS);
     7. facts from the site's own Dogs at Work and Good Dog Bad Dog articles (ARTICLE_FACTS).
   The pit adds the current level's lineage notes on top and deals the lot from
   a shuffled deck. To add facts, add them to EXTRA_FACTS. */
import { SECTIONS } from "./historySections";
import famousDogs from "./famousDogs";
import { breedInfo } from "./breedInfo";
import { breeds } from "./breeds";
import { ukBreeds } from "./uk-breeds";
import { getLineage, LINEAGE_ROOTS, type LineageNode } from "./lineage";
import { packArt } from "./packArt";

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
  "Great Bullenbeisser (Danziger Bullenbeisser)": "The Great Bullenbeisser was a big, heavy German dog, weighing up to 50kg, trained to grab boar, bears and bulls and hold on. The smaller Brabant Bullenbeisser, the Boxer's ancestor, came from it.",
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

/* FROM THE SITE'S OWN ARTICLES, 25 September 2026 (owner: the Dogs at Work and
   Good Dog Bad Dog pieces are full of facts). Each is rewritten to stand on its
   own and names its subject, and each comes only from what the article already
   says: the guide dog and medical alert costs from the Dogs at Work cost panel,
   the medal dogs, the noses and the search dogs from their articles, and Anubis,
   Argos, Bull's-eye, Gelert, Greyfriars Bobby, Lassie, the Baskerville hound and
   Odin from Good Dog Bad Dog. Left out on purpose: the grimmer Victorian figures
   and film release details that date quickly. */
const ARTICLE_FACTS: string[] = [
  "A guide dog costs more than £55,000 over its life, from being born to retiring.",
  "Training a medical alert dog costs about £29,000, yet the dogs are given free to the people who need them, paid for almost entirely by donations.",
  "Guide dogs are trained to refuse to walk on if it would be unsafe, even when their owner has told them to go.",
  "Guide dogs learn to cope with kerbs, traffic, buses, shops, other dogs, cats and birds, so they are not trained in an empty field.",
  "In a survey by the charity Guide Dogs, 95 out of every 100 people with sight loss said they had been forced into the road by cars parked on the pavement.",
  "Medical alert dogs can smell tiny changes in a person's body, and warn them before a problem such as a dangerous drop in blood sugar.",
  "In 2009 a Labrador called Daisy kept pawing at her owner's chest until she got it checked. It was cancer, caught early, and her owner, Dr Claire Guest, went on to start the charity Medical Detection Dogs.",
  "In 2004, dogs trained by the charity that became Medical Detection Dogs picked out samples from people with bladder cancer far more often than chance, a result published in the British Medical Journal.",
  "In 2025, two dogs called Bumper and Peanut sniffed out Parkinson's disease from a swab of skin, in a test where nobody in the room knew the answers.",
  "A dog's nose is tens of thousands of times more sensitive than ours.",
  "In November 2025, an electronic nose inspired by dogs began a trial at Milton Keynes University Hospital, sniffing more than 500 samples for prostate cancer.",
  "Digital detection dogs can find hidden memory cards and hard drives, because every piece of digital storage gives off the same tiny chemical smell.",
  "Only about one dog in fifty passes the tests to become a digital detection dog.",
  "Britain's first digital detection dogs worked for Devon and Cornwall Police, and one of them was a Labrador called Rob.",
  "Search and rescue dogs that air-scent do not follow footsteps. They sniff for human scent carried on the wind, zigzagging until they find the person.",
  "Trailing search dogs are given something that smells of the missing person, and then follow that one person's trail.",
  "Volunteer search dog teams in Britain can be called out in any weather, by day or by night.",
  "A sheepdog's first move towards the flock is called the lift, the moment it reaches the sheep and gets them moving.",
  "Sheepdog trials are based on real farm work: gathering the sheep, bringing them to the shepherd, driving them and penning them.",
  "During the Blitz, a German Shepherd called Crumstone Irma helped rescue 191 people from bombed buildings in London, and won the Dickin Medal in 1945.",
  "The Dickin Medal is known as the animals' Victoria Cross. A dog called Khan won it in 1945 for saving a soldier from drowning under heavy shellfire.",
  "After the war, the soldier Khan had saved asked to see him again at a parade in 1947, and Khan's family gave the dog to him.",
  "A search dog called Appollo was the first search dog to arrive at Ground Zero after the attacks on New York in 2001.",
  "In December 1944, a shepherd called John Dagg and his sheepdog climbed through fog and snow in the Cheviot Hills to reach the crew of a crashed American bomber.",
  "When Britain first issued dog licences in 1867, 830,000 were bought, at five shillings (25p) each.",
  "The animal long called the Egyptian jackal turned out, when scientists tested its DNA, to be a kind of wolf.",
  "Dogs were the first animals ever to live with people. Scientists have found dogs living alongside hunters in Europe and western Asia 14,000 to 16,000 years ago, before farming began.",
  "The word dog first appears in Old English as docga. The older word was hund, which gave us the word hound.",
  "Anubis, the ancient Egyptian god of the dead, had the head of a dog-like animal, and his black colour stood for the rich, dark soil of the River Nile.",
  "In Greek myths, a monstrous three-headed dog called Cerberus guarded the gates of the underworld.",
  "Egyptian gods really did reach Britain, carried along Roman roads when the Romans ruled here.",
  "In Homer's Odyssey, written around 2,700 years ago, the old dog Argos recognises his master Odysseus when he comes home after 20 years away, even though Odysseus is in disguise.",
  "A Roman coin made in 82 BC shows the hero Odysseus with his faithful dog Argos.",
  "The Hellenic Hound is the only Greek dog breed recognised by the world's main dog-breed organisation, and it is thought to come from the Laconian hounds of ancient Greece.",
  "Oliver Twist came out between 1837 and 1839, and Dickens's own illustrator, George Cruikshank, soon started drawing Bull's-eye differently from the shaggy dog in the book.",
  "The village of Beddgelert in North Wales has a name usually translated as Gelert's grave, and a stone memorial to the dog stands there beside the River Glaslyn.",
  "Greyfriars Bobby was a real little terrier who lived in Edinburgh and died in January 1872. Visitors rub the nose of his bronze statue so often that it shines.",
  "Lassie first appeared in a magazine story by Eric Knight in 1938, then in the book Lassie Come-Home in 1940, and in a film in 1943.",
  "In the original Lassie story, set in Yorkshire, Lassie is a Rough Collie who belongs to a boy called Joe Carraclough.",
  "In The Hound of the Baskervilles, the terrifying glowing hound on the moor turns out to be a real dog that the villain has made look ghostly.",
  "In the 2026 film Heart of the Beast, the German Shepherd Odin is played by a dog called Uber, who was a real search and rescue dog before he was an actor.",
];

// Any facts written straight in here join the pool too.
export const EXTRA_FACTS: string[] = [];

/* TEN FACTS FOR EVERY CHUM, brief 5, from 27 September 2026 (owner: a returning
   player meets the same chums level after level, so each needs at least ten
   facts; target library about 3,000). Researched one chum per batch, thinnest
   first, each checked against sources listed in that batch's review document,
   never over 150 words, and each names its dog. Keyed by the pack name, which
   becomes each fact's FACT_SUBJECT so its picture leads and it is chosen when
   that chum is caught or chained.
   Batch 1 (J18-241): Jackapoo, 9 new facts (1 existing, 10 in all).
   Batch 2 (J18-245): Cavachon, 9 new facts (1 existing, 10 in all).
   Batch 3 (J18-253): Cavapoo, 9 new facts (1 existing, 10 in all). */
export const CHUM_FACTS: Record<string, string[]> = {
  Jackapoo: [
    "The Jackapoo, a cross of the Jack Russell Terrier and the Poodle, is thought to have been first bred on purpose in the USA in the 1980s or 1990s. It was part of a wave of so-called designer dogs: puppies from two different pure breeds, mixed to make a family pet. That makes the Jackapoo unusual in its own family tree. Its Jack Russell parent was bred for hunting and its Poodle parent for fetching from water, but the Jackapoo was bred from the very start simply to be a companion.",
    "The Jackapoo goes by at least ten names. Jack-a-poo, Jackadoodle, Jackapoodle, Jackpoo, Poojack and Poo-Jack are all the same cross of a Jack Russell Terrier and a Poodle. A pure breed has a breed club that settles on one official name, but the Jackapoo has no such club, so breeders and owners made up their own, joining the Jack from one parent to the poo or doodle from the other.",
    "A Jackapoo's Poodle parent is almost always a Miniature or Toy Poodle, not a Standard. Poodles come in three sizes, and a Standard Poodle is far taller than a Jack Russell Terrier, so the small sizes are used to keep the Jackapoo little. Even so, a Jackapoo can stand anywhere from about 24 to 38cm tall and weigh from 5 to 12kg, depending mostly on the size of its Poodle parent.",
    "The Jack Russell side of the Jackapoo is named after a real man. John Russell, known as Jack, was a student at Oxford who loved fox hunting. The story goes that in 1819, near the village of Marston, he met a milkman with a little white terrier with tan patches over her eyes and ears, and bought her on the spot. She was called Trump, and Russell began his famous line of hunting terriers with her. He later had to sell his dogs more than once when money ran short, so nobody today can prove their dog descends from Trump.",
    "Why are so many Jack Russells white? Hunters chasing a fox wanted a terrier they could never mistake for the fox itself, so John Russell chose mostly white dogs, starting with his terrier Trump. A Jackapoo does not always keep that white coat. It can take its looks from either parent, and its Poodle side comes in many solid colours, from black and brown to apricot and cream.",
    "The Jackapoo is not recognised as a breed by the Kennel Club or any other major kennel club, so there is no official description of how one should look. Puppies in the same litter can turn out quite differently, some with a short, rough terrier coat and some curly like a Poodle. In 2009 an American club for crossbreeds, the International Designer Canine Association, did add the Jackapoo to its list, but that is not the same as being a recognised breed.",
    "Breeders describe Jackapoos by generation. A first-generation, or F1, Jackapoo has one Jack Russell Terrier parent and one Poodle parent. Puppies from two Jackapoos are called F2, and a Jackapoo bred back to a Poodle is usually called F1b. Every puppy inherits a random mix of genes from both sides, so no breeder can promise exactly how a Jackapoo puppy will turn out.",
    "The man behind the Jackapoo's terrier side had little time for dog shows. John Russell was a founding member of the Kennel Club in 1873 and judged Fox Terriers at a show at Crystal Palace in London in 1874, but he never showed his own dogs. He said his working terriers were as different from the show dogs as a wild rose is from a garden rose. What mattered to him was a dog that could do its job, not one that won prizes.",
    "The Poodle half of a Jackapoo comes from one of the quickest learners of all dogs. In his 1994 book The Intelligence of Dogs, the psychologist Stanley Coren ranked breeds by how fast they learned and obeyed commands, using reports from obedience judges. The Poodle came second, behind only the Border Collie. A Jackapoo can pick up that quickness along with the Jack Russell's energy, which is why owners are advised to keep one busy with games and training.",
  ],
  // Batch 2 (J18-245): 9 new, 10 in all.
  Cavachon: [
    "The Cavachon, a cross of the Cavalier King Charles Spaniel and the Bichon Frise, is usually traced to one kennel. Gleneden Kennels in Berryville, Virginia, in the USA, says it bred the first planned litter in 1996. The aim was a small, cheerful family dog with a coat that sheds less, and breeders hoped that mixing two breeds would mean fewer health problems. Cavachons may well have been born by accident before then, but 1996 is when people began breeding them on purpose.",
    "The Cavachon is not recognised as a breed by the American Kennel Club or by the Kennel Club in Britain, so it has no official standard and no single name. It is also called the Cavashon, the Cavalier Bichon and the King Charles Bichon. Most Cavachons have one Cavalier King Charles Spaniel parent and one Bichon Frise parent, so no breeder can promise exactly how the puppies will turn out.",
    "A Cavachon's coat can come out anywhere between its two parents: soft and wavy like a Cavalier King Charles Spaniel, or tightly curly like a Bichon Frise. The curlier the coat, the less it tends to shed. But a coat that does not shed keeps on growing, so a curly Cavachon needs a trip to the groomer every six to eight weeks. And shedding less is not the same as being allergy-free: no dog can promise that.",
    "The Cavachon's Cavalier side was brought back by an American's prize money. In the 1920s Roswell Eldridge came to England looking for the long-nosed little spaniels he had seen in paintings from the time of King Charles II, but found only flat-faced ones. From 1926 he offered £25 at Crufts for the dog and bitch most like the old paintings. A dog called Ann's Son became the model for the new breed, but Eldridge died a month before the 1928 show. The Kennel Club recognised the Cavalier in 1945.",
    "The Cavachon's Cavalier half is named after King Charles II, who loved his dogs so much it annoyed people. In 1667 the diarist Samuel Pepys watched the king at a council meeting and grumbled that he spent it playing with his dog instead of minding the business. Charles's dogs were stolen so often that one newspaper advert, thought to be written by the king himself, asked: will they never leave robbing his Majesty? Must he not keep a dog?",
    "Many Cavachons have chestnut and white patches, a colour the Cavalier calls Blenheim, after Blenheim Palace, where the Dukes of Marlborough kept red and white spaniels. Some have a chestnut spot in the middle of the forehead. Legend says that in 1704 the Duchess of Marlborough, waiting for news of her husband at the Battle of Blenheim, pressed her thumb on the head of her pregnant spaniel, and the puppies were born with a thumbprint spot. It is a lovely story, but only a story.",
    "The Cavachon's Bichon Frise side has sailed a long way. Little white dogs like it travelled with sailors around the Mediterranean, and one kind became so linked with the Canary Island of Tenerife that it was called the Bichon Tenerife. When France wrote down the breed's official description in 1933, it was given its modern name, Bichon Frise, meaning curly bichon. Bichon itself is thought to be short for barbichon, meaning little barbet, a shaggy water dog.",
    "The Bichon Frise side of the Cavachon was once a royal fashion accessory. In France, King Henri III, who ruled from 1574 to 1589, is said to have loved his little white dogs so much that he carried them everywhere in a basket hung round his neck on ribbons. The dogs were bathed, trimmed and perfumed, and French still has a verb, bichonner, meaning to pamper, which is said to come from them.",
    "The Bichon Frise side of the Cavachon went from palaces to the streets. When the little white dogs fell out of fashion with the rich, they did not disappear. By the late 1800s they were trotting beside organ grinders and doing tricks in circuses and at fairs, earning their keep by making crowds laugh. That knack for performing helped the breed survive, long before anyone thought of crossing one with a Cavalier King Charles Spaniel to make the Cavachon.",
  ],
  // Batch 3 (J18-253): 9 new, 10 in all.
  Cavapoo: [
    "Nobody knows for certain where the Cavapoo, a cross of the Cavalier King Charles Spaniel and the Poodle, was first bred. Some say the USA in the 1950s, but the cross really took off in Australia in the 1990s, during the craze for Poodle crosses that followed the Labradoodle. Breeders wanted a small, gentle family dog with the Cavalier's sweet nature and the Poodle's low-shedding coat.",
    "In Australia the Cavapoo is called the Cavoodle, while in Britain and America it is usually the Cavapoo, and some call it the Cavadoodle. Each name joins Cav, from the Cavalier King Charles Spaniel, to poo or doodle, from the Poodle. The cross is so popular in Australia that when Anthony Albanese became Prime Minister in 2022, his Cavoodle, Toto, was nicknamed Australia's First Dog.",
    "The Cavalier in Cavapoo comes from a war. In the English Civil War of the 1640s, the soldiers who fought for King Charles I were nicknamed Cavaliers, and those who fought for Parliament were called Roundheads. The little spaniels loved by Charles I and his son Charles II were only given the Cavalier name in the 1920s, to tell the long-nosed dogs apart from the flat-faced King Charles Spaniel.",
    "Both halves of the Cavapoo can be found on the same side of the English Civil War. King Charles I loved his little spaniels, and his nephew Prince Rupert, the most famous Cavalier general, took his white hunting Poodle, Boye, almost everywhere, even into battle. Parliament's supporters spread stories that Boye had magic powers. Sadly, Boye was killed at the Battle of Marston Moor in 1644.",
    "The Cavalier side of the Cavapoo has been a lapdog for more than 400 years. In 1570 the doctor John Caius described a little spaniel he called the spaniel gentle, or comforter, kept as a lapdog by fine ladies. In Tudor times these small spaniels warmed their owners' laps and feet, and people even believed they drew fleas away from them.",
    "Little spaniels like the Cavapoo's Cavalier ancestors appear in royal paintings. In 1635 the painter Anthony van Dyck painted the three eldest children of King Charles I with a spaniel. The king was cross that his son, the future Charles II, was shown wearing a skirt, which only younger children wore then. So Van Dyck painted the children again, with the prince in breeches, and this time two spaniels.",
    "King Charles II let his little spaniels, the ancestors of the Cavapoo's Cavalier side, go almost everywhere with him, even into his bedroom, where he let them have their puppies. After the king died in 1685, the writer John Evelyn grumbled in his diary that the dogs had made the bedroom, and indeed the whole royal court, smelly.",
    "The Poodle side of the Cavapoo helped the American army start using dogs. In 1942, during the Second World War, a Poodle breeder called Alene Erlanger set up Dogs for Defense, which asked American families to lend their pets to the armed forces. Poodles were on the army's first list of war dogs, praised for how quickly they learned, and some worked as guard dogs in America, though they did not go overseas.",
    "A Cavapoo is a small dog, usually about 23 to 33cm tall and weighing 4 to 10kg, depending mostly on whether its Poodle parent was a Toy or a Miniature. Its coat can be silky like a Cavalier King Charles Spaniel's or curly like a Poodle's, in colours from apricot and red to cream, black, brown and white.",
  ],
};

const firstSentence = (t: string): string => {
  const m = t.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (m ? m[0] : t).trim();
};
const factFromWriteUp = (t: string): string => {
  const sentences = t.match(/[^.!?]+[.!?]+(?=\s|$)/g)?.map((x) => x.trim()) ?? [t.trim()];
  const out: string[] = [];
  for (const sen of sentences) {
    if (/^In our family tree/i.test(sen)) break;
    out.push(sen);
    if (out.length === 2) break;
  }
  return out.join(" ") || firstSentence(t);
};
const withArticle = (name: string) => (/^[aeiou]/i.test(name) ? `an ${name}` : `a ${name}`);

/* FACT-CHECKED OVERRIDES, 25 September 2026 (owner: "Bull's-eye was not a Bull
   Terrier, the breed had not been invented yet"). The famous dogs are written
   from a template ("[dog] from [story] is a [breed]"), which flattens cases where
   the breed depends on the version, came later than the story, or is uncertain.
   Each of these was checked; the fact below replaces the template's. null leaves
   the dog out of the facts entirely (unverified). Keyed "breed-slug|dog name".
   The breed pages' own famous-dog lists are untouched by this. Since the rewrite
   below, every famous dog is listed here, so the template is only a fallback
   for a dog added to famousDogs.ts later. */
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
  /* EVERY OTHER FAMOUS DOG, WITH ITS STORY, 25 September 2026 (owner: "Carl from
     Good Dog, Carl is a Rottweiler" says nothing if you do not know the book).
     Each now says what the book, film, show or event is, when (where certain),
     and what the dog does in it, before its breed. Details not certain are left
     out rather than guessed. */
  "afghan-hound|What-a-Mess": "What-a-Mess is a scruffy, accident-prone Afghan Hound puppy from a series of children's books by the comedy writer Frank Muir, which were later turned into a TV cartoon.",
  "basset-hound|Droopy": "Droopy is a slow-talking, sad-faced Basset Hound from old cartoons first made in 1943. However fast the villain runs, calm little Droopy is always there first.",
  "basset-hound|Toby": "In Disney's 1986 film The Great Mouse Detective, Toby is Sherlock Holmes's Basset Hound, who helps the mouse detective Basil follow a trail by smell.",
  "basset-hound|Lafayette": "In Disney's 1970 film The Aristocats, Lafayette is one of two farm dogs who chase the villainous butler Edgar. He is a Basset Hound.",
  "beagle|Snoopy": "Snoopy is Charlie Brown's pet Beagle in the Peanuts comic strip by Charles Schulz, which began in 1950. He is famous for sleeping on the roof of his kennel and pretending to be a flying ace.",
  "bloodhound|Trusty": "In Disney's 1955 film Lady and the Tramp, Trusty is Lady's old neighbour, a Bloodhound who keeps saying he has lost his sense of smell, until he helps save the day.",
  "bloodhound|Copper": "In Disney's 1981 film The Fox and the Hound, Copper is a hound puppy who becomes best friends with a fox cub called Tod, even though he is being trained to hunt foxes.",
  "border-collie|Shep": "Shep was a Border Collie on the BBC children's programme Blue Peter in the 1970s. His presenter John Noakes made the catchphrase \"Get down, Shep!\" famous.",
  "border-collie|Meg": "Meg was a Border Collie who appeared on the BBC children's programme Blue Peter, one of a long line of Blue Peter dogs.",
  "border-collie|Fly": "In the 1995 film Babe, Fly is the farm's Border Collie who takes the little pig Babe under her wing, and teaches him how to herd sheep.",
  "border-collie|Dog": "Footrot Flats is a comic strip from New Zealand about a sheep farm, told by a hard-working sheepdog who is simply called Dog.",
  "bull-terrier|Sparky": "In Tim Burton's 2012 film Frankenweenie, a boy called Victor uses science to bring his beloved dog Sparky back to life. Sparky is a Bull Terrier.",
  "bull-terrier|Spuds MacKenzie": "Spuds MacKenzie was a Bull Terrier who became a famous mascot in American TV adverts in the 1980s.",
  "bulldog|Spike": "In the Tom and Jerry cartoons, Spike is the tough Bulldog who protects Jerry the mouse and gets very cross when Tom the cat disturbs him.",
  "bulldog|Tyke": "In the Tom and Jerry cartoons, Tyke is Spike the Bulldog's little puppy, and Spike will do anything to keep him safe.",
  "bulldog|Churchill": "Churchill is the nodding Bulldog in the Churchill Insurance adverts, famous for saying \"Oh yes!\"",
  "bulldog|Tillman": "Tillman was a real Bulldog from California who became famous for skateboarding and surfing, and once set a world record as the fastest dog on a skateboard.",
  "chihuahua|Tito": "In Disney's 1988 film Oliver & Company, a doggy version of Oliver Twist, Tito is the tiny, excitable Chihuahua in Fagin's gang of street dogs.",
  "chihuahua|Ren H\u00f6ek": "Ren H\u00f6ek is the bad-tempered Chihuahua in the 1990s cartoon The Ren & Stimpy Show, which follows his crazy adventures with his friend Stimpy the cat.",
  "cocker-spaniel|Lady": "In Disney's 1955 film Lady and the Tramp, Lady is a pampered Cocker Spaniel who falls for a street dog called Tramp. They share the famous plate of spaghetti.",
  "cocker-spaniel|Flush": "Flush is a 1933 book by Virginia Woolf that tells the real life of the poet Elizabeth Barrett Browning through the eyes of her pet Cocker Spaniel, Flush.",
  "corgi|Susan": "Susan was the Corgi given to the future Queen Elizabeth II for her 18th birthday in 1944. Almost all the Queen's later Corgis came from her.",
  "corgi|Muick": "Muick was one of the very last Corgis owned by Queen Elizabeth II, who kept Corgis for most of her life.",
  "corgi|Ein": "In the Japanese cartoon series Cowboy Bebop, Ein is a Corgi who travels through space with a crew of bounty hunters, and is secretly a super-clever dog.",
  "corgi|Rex": "In the 2019 animated film The Queen's Corgi, Rex is the Queen's favourite Corgi, who gets lost outside the palace and has to find his way home.",
  "dachshund|Slinky Dog": "In Toy Story, Slinky Dog is a toy Dachshund with a metal spring for a middle, which lets him stretch really far. He is one of Woody's best friends.",
  "dachshund|Buddy": "In the 2016 film The Secret Life of Pets, Buddy is a laid-back Dachshund who lives in the same block of flats as the hero, Max.",
  "dachshund|Waldi": "Waldi, a stripy Dachshund, was the mascot of the 1972 Olympic Games in Munich, the very first official Olympic mascot.",
  "dalmatian|Pongo": "In Dodie Smith's 1956 book The Hundred and One Dalmatians, later a Disney film, Pongo is the Dalmatian dad who sets out to rescue his stolen puppies from the wicked Cruella de Vil.",
  "dalmatian|Perdita": "In Disney's 1961 film One Hundred and One Dalmatians, Perdita is Pongo's partner and the mum of the puppies that the wicked Cruella de Vil steals to make a spotty fur coat. In Dodie Smith's original book she is called Missis.",
  "dalmatian|Marshall": "In the TV cartoon PAW Patrol, Marshall is the fire pup, a clumsy but brave Dalmatian who puts out fires and helps anyone who gets hurt.",
  "dalmatian|Oddball": "In the 2000 film 102 Dalmatians, Oddball is a Dalmatian puppy born without any spots, who spends the film wishing she had some.",
  "doberman-pinscher|Alpha": "In Disney Pixar's 2009 film Up, Alpha is the fierce Doberman who leads a pack of dogs. His talking collar breaks and makes his voice go funny and squeaky.",
  "french-bulldog|Stella": "In the American TV comedy Modern Family, Stella is the French Bulldog belonging to Jay, the grumpy grandad of the family.",
  "german-shepherd|Rin Tin Tin": "Rin Tin Tin was a German Shepherd puppy rescued from a battlefield in France at the end of the First World War by an American soldier. He grew up to be a huge Hollywood film star in the 1920s.",
  "german-shepherd|Strongheart": "Strongheart was a German Shepherd who starred in films in the 1920s, one of the very first dog film stars.",
  "german-shepherd|Inspector Rex": "Inspector Rex is an Austrian TV series from 1994 about a German Shepherd police dog who helps detectives solve crimes in Vienna.",
  "golden-retriever|Goldie": "Goldie was a Golden Retriever on the BBC children's programme Blue Peter from the late 1970s.",
  "golden-retriever|Bonnie": "Bonnie was a Golden Retriever on the BBC children's programme Blue Peter, and the daughter of Goldie, the Blue Peter dog before her.",
  "golden-retriever|Shadow": "In the 1993 film Homeward Bound, Shadow is a wise old Golden Retriever who leads a young Bulldog and a cat on a long, dangerous journey home across the mountains.",
  "golden-retriever|Dug": "In Disney Pixar's 2009 film Up, Dug is a friendly Golden Retriever whose special collar lets him talk. He is easily distracted, especially by squirrels.",
  "great-dane|Scooby-Doo": "Scooby-Doo is a cowardly, snack-loving Great Dane who solves spooky mysteries with his best friend Shaggy, in cartoons that began in 1969.",
  "great-dane|Marmaduke": "Marmaduke is a huge, clumsy Great Dane from an American comic strip that began in 1954, and was later made into films.",
  "great-dane|Astro": "Astro is the family dog in The Jetsons, a 1960s cartoon about a family living in a future world of flying cars. He is a Great Dane.",
  "great-dane|Giant George": "Giant George was a Great Dane from America who once held the world record for the tallest dog alive.",
  "greyhound|Santa's Little Helper": "In The Simpsons, Santa's Little Helper is the family's pet Greyhound. Homer and Bart adopted him in the very first episode, after he lost a race.",
  "greyhound|Mick the Miller": "Mick the Miller was a racing Greyhound who won the English Greyhound Derby in 1929 and 1930, and became a national hero.",
  "greyhound|Master McGrath": "Master McGrath was an Irish Greyhound who won the Waterloo Cup, the biggest hare-coursing race of Victorian times, three times, and was even taken to meet Queen Victoria.",
  "irish-setter|Big Red": "Big Red is a 1945 book by Jim Kjelgaard, later a Disney film, about a beautiful Irish Setter show dog and the boy who looks after him in the woods.",
  "jack-russell-terrier|Eddie": "In the American TV comedy Frasier, Eddie is Martin Crane's Jack Russell Terrier, famous for staring at Frasier, which drives him mad.",
  "jack-russell-terrier|Uggie": "Uggie was a Jack Russell Terrier who starred in The Artist, a 2011 black-and-white silent film that won the Oscar for Best Picture.",
  "jack-russell-terrier|Milo": "In the 1994 film The Mask, Milo is the loyal Jack Russell Terrier belonging to the hero, Stanley. At one point Milo puts on the magic mask himself.",
  "jack-russell-terrier|Max": "In the 2016 film The Secret Life of Pets, Max is a Jack Russell Terrier whose happy life in New York is turned upside down when his owner brings home another dog.",
  "labrador|Marley": "Marley & Me is a 2005 book by John Grogan, later a film, about his family's lovable but hugely naughty Labrador, Marley.",
  "labrador|Endal": "Endal was a British Labrador assistance dog. When his owner, a former Navy officer, was knocked out, Endal put him into the recovery position and fetched help.",
  "labrador|Bouncer": "Bouncer was the Labrador in the Australian TV soap Neighbours in the late 1980s, and one of its best-loved characters.",
  "labrador|Luath": "The Incredible Journey is a 1961 book by Sheila Burnford about three pets travelling hundreds of miles home across Canada. Luath, the young Labrador, leads the way.",
  "mastiff|Zorba": "Zorba was an English Mastiff who once held the world record for the heaviest and longest dog ever measured.",
  "miniature-schnauzer|Colin": "In the Channel 4 comedy Spaced, from 1999, Colin is the Miniature Schnauzer adopted by one of the main characters, Daisy.",
  "old-english-sheepdog|Dulux dog": "An Old English Sheepdog has starred in the Dulux paint adverts since the 1960s, so the breed is often called the Dulux dog.",
  "old-english-sheepdog|Digby": "Digby, the Biggest Dog in the World is a 1973 British film about an Old English Sheepdog who drinks an experimental liquid and grows to a giant size.",
  "old-english-sheepdog|Max": "In Disney's 1989 film The Little Mermaid, Max is Prince Eric's big, shaggy Old English Sheepdog.",
  "old-english-sheepdog|Ambrosius": "In the 1986 fantasy film Labyrinth, Ambrosius is the Old English Sheepdog ridden like a horse by the tiny fox knight, Sir Didymus.",
  "pomeranian|Boo": "Boo was a fluffy Pomeranian from America who became famous online as the world's cutest dog, with millions of fans.",
  "pomeranian|Marco": "Queen Victoria fell in love with Pomeranians on a trip to Italy, and her little dog Marco helped make the breed popular in Britain.",
  "poodle|Roly": "Roly was the Poodle who lived at the Queen Vic pub in the BBC soap EastEnders in the 1980s and 1990s.",
  "poodle|Georgette": "In Disney's 1988 film Oliver & Company, Georgette is a spoilt, prize-winning Poodle who is very jealous of the kitten Oliver.",
  "pug|Frank": "In the Men in Black films, Frank looks like a Pug, but he is really a talking alien in disguise.",
  "pug|Percy": "In Disney's 1995 film Pocahontas, Percy is the spoilt Pug belonging to the greedy Governor Ratcliffe.",
  "pug|Willy": "Willy was the Pug belonging to Ethel Skinner, one of the best-loved characters in the BBC soap EastEnders.",
  "rottweiler|Carl": "Good Dog, Carl is a picture book by Alexandra Day, first published in 1985, about a Rottweiler called Carl who looks after a baby while its mother goes out.",
  "saint-bernard|Beethoven": "In the 1992 film Beethoven, a huge, slobbery Saint Bernard puppy moves in with the Newton family and causes chaos as he grows.",
  "siberian-husky|Togo": "In 1925, sled dog teams raced medicine across Alaska to save the town of Nome from a deadly illness. Togo, a Siberian Husky, led his team on the longest and most dangerous part of the journey.",
  "siberian-husky|Balto": "Balto was the Siberian Husky who led the last team into the town of Nome with life-saving medicine in 1925. There is a statue of him in Central Park, New York, and a 1995 cartoon film about him.",
  "springer-spaniel|Buster": "Buster was an English Springer Spaniel who sniffed out hidden weapons and explosives with British soldiers in Iraq in 2003, and won the Dickin Medal for bravery.",
  "weimaraner|Man Ray": "Man Ray was a Weimaraner photographed by the American artist William Wegman in the 1970s, often dressed up in funny costumes.",
  "weimaraner|Fay Ray": "Fay Ray was a Weimaraner who became the star of the American artist William Wegman's photographs, after his first dog, Man Ray.",
  "west-highland-terrier|Wee Jock": "In the 1990s BBC Scotland series Hamish Macbeth, Wee Jock is the West Highland Terrier belonging to the village policeman, Hamish.",
  "west-highland-terrier|Cesar dog": "A West Highland White Terrier has starred for years in the adverts for Cesar dog food.",
  "whippet|Ashley Whippet": "In 1974 a Whippet called Ashley ran onto the pitch at a big baseball game in America and wowed the crowd by catching flying discs, which helped start frisbee competitions for dogs.",
  "yorkshire-terrier|Smoky": "Smoky was a tiny Yorkshire Terrier found by American soldiers in the jungle during the Second World War. She once pulled a telegraph wire through a narrow pipe, saving days of dangerous work.",
  "yorkshire-terrier|Mr Famous": "Mr Famous was the actress Audrey Hepburn's Yorkshire Terrier, who even appeared with her in the 1957 film Funny Face.",
};
function famousFacts(): string[] {
  const nameOf = new Map(breeds.filter((b) => !!b.slug).map((b) => [b.slug, b.name]));
  const note = (fact: string, slug: string) => { const b = nameOf.get(slug); if (b) FACT_SUBJECT.set(fact.trim(), b); };
  const out: string[] = [];
  for (const [slug, dogs] of Object.entries(famousDogs)) {
    const breed = nameOf.get(slug);
    if (!breed) continue;
    for (const d of dogs) {
      const key = `${slug}|${d.name}`;
      if (key in FAMOUS_OVERRIDES) {
        const fixed = FAMOUS_OVERRIDES[key];
        if (fixed) { out.push(fixed); note(fixed, slug); }
        continue;
      }
      const known = d.knownFor.trim();
      const made = (d.type.startsWith("Real")
        ? `${d.name}, the ${known.charAt(0).toLowerCase() + known.slice(1)}, was ${withArticle(breed)}.`
        : `${d.name} from ${known} is ${withArticle(breed)}.`);
      out.push(made);
      note(made, slug);
    }
  }
  return out;
}

/* THE DOGS IN A FACT, 26 September 2026 (owner: show round pictures of the dogs a
   fact is about). Two ways in:
     1. names: every dog with a picture (the 54 pack breeds and every lineage dog)
        is matched against the fact's words, longest name first so "Italian
        Greyhound" wins over "Greyhound", and each match is removed before the
        next so a name is never counted twice;
     2. groups and traits, only when no dog is named: a keyword list (terriers,
        sighthounds, flat faces, curly tails and so on) tied to well-known pack
        breeds. Flat faces come from the breed data's own skull field.
   At most FACT_DOGS_MAX, in the order they appear. */
export type FactDog = { name: string; img: string };
export const FACT_DOGS_MAX = 5; // five, 26 September 2026 (owner; was six)
let dogIndex: { names: string[]; img: Map<string, string>; shortOf: Map<string, string>; hist: Map<string, string>; canon: Map<string, string>; pack: Set<string> } | null = null;
function buildDogIndex() {
  if (dogIndex) return dogIndex;
  const img = new Map<string, string>();
  for (const b of breeds.filter((x) => !!x.slug && !!x.image)) img.set(b.name, packArt(b.name) ?? b.image);
  /* AND EVERY DOG ON THE HISTORY PAGE, 26 September 2026 (owner: a fact about the
     Longdog showed the sighthound group instead of the Longdog). The history
     page's breeds (ukBreeds) carry their own pictures and were not in here. */
  for (const b of ukBreeds) if (b.image && !img.has(b.name)) img.set(b.name, packArt(b.name) ?? b.image);
  for (const r of LINEAGE_ROOTS) {
    const l = getLineage(r);
    if (!l) continue;
    const w = (x: LineageNode) => { if (x.img && !img.has(x.name)) img.set(x.name, packArt(x.name) ?? x.img); for (const k of x.children ?? []) w(k); };
    w(l);
  }
  /* SHORT FORMS, 27 September 2026: people drop a dog's last word ("the Dandie
     Dinmont", "the Jack Russell", "the Sealyham"). A short form is kept when two or
     more words are left, or when one distinctive word is left that no other dog
     starts with and that is not a common word (Border, Welsh, Irish and so on). */
  const COMMON = new Set(["Border", "Welsh", "Irish", "English", "Scottish", "German", "Old", "Great", "Ancient", "Medieval", "Black", "White", "Bull", "Fox", "Toy", "Water", "Cocker", "Springer", "Field", "Norfolk", "Norwich", "Skye", "Kerry", "Early", "Local", "Celtic", "British", "French", "Italian", "American", "Mountain", "Northern", "Rough", "Smooth", "Standard", "Miniature", "Golden", "Flat", "Curly", "Soft", "Wire", "King", "Cairn", "Lakeland", "Manchester", "Boston", "Tibetan", "Chinese", "Asian", "Roman", "Norman", "Southern", "North", "Continental", "Mediterranean",
    // Places, which facts mention as places (the River Aire "in Yorkshire").
    "Yorkshire", "Sussex", "Staffordshire", "Lancashire", "Newfoundland", "Clumber", "Bedlington", "Dumfriesshire", "Airedale"]);
  const LAST = /\s+(Terriers?|Spaniels?|Hounds?|Retrievers?|Dogs?|Sheepdogs?|Setters?|Collies?|Pinschers?)$/;
  const firstWordCount = new Map<string, number>();
  for (const n of img.keys()) { const w = n.split(/\s+/)[0]; firstWordCount.set(w, (firstWordCount.get(w) ?? 0) + 1); }
  const shortOf = new Map<string, string>();
  for (const n of img.keys()) {
    if (!LAST.test(n)) continue;
    const short = n.replace(LAST, "");
    const words = short.split(/\s+/);
    // Never a short form starting "The" ("The First Setters" would become "The First").
    if (/^The\b/.test(short)) continue;
    const ok = words.length >= 2 || (words.length === 1 && short.length >= 6 && !COMMON.has(short) && (firstWordCount.get(short) ?? 0) === 1);
    if (ok && !img.has(short) && !shortOf.has(short)) shortOf.set(short, n);
  }
  const names = [...img.keys(), ...shortOf.keys()].filter((n) => n.length >= 3).sort((a, b) => b.length - a.length);
  /* REAL AND CARTOON, 27 September 2026 (owner: a Westie fact showed the Westie's
     cartoon twice, under two names, and never its real historic picture). */
  const pack = new Set(breeds.filter((x) => !!x.slug && !!x.image).map((x) => x.name));
  const isCartoon = (src: string) => /-square\.|\/faces\/|^\/breeds\//.test(src) || [...pack].some((p) => packArt(p) === src);
  // A pack breed's real picture: the lineage's own picture of it, or the history
  // page's, whichever is not the cartoon.
  const hist = new Map<string, string>();
  for (const b of ukBreeds) if (b.image && !isCartoon(b.image)) hist.set(b.name, b.image);
  for (const r of LINEAGE_ROOTS) {
    const l = getLineage(r);
    if (!l) continue;
    const w = (x: LineageNode) => { if (x.img && !isCartoon(x.img) && !hist.has(x.name)) hist.set(x.name, x.img); for (const k of x.children ?? []) w(k); };
    w(l);
  }
  // Two names for one dog: a name whose cartoon is a pack breed's cartoon IS that
  // pack breed ("West Highland White Terrier" is the pack's "West Highland Terrier").
  const canon = new Map<string, string>();
  for (const n of img.keys()) {
    if (pack.has(n)) continue;
    const art = packArt(n);
    const p = art ? [...pack].find((pk) => packArt(pk) === art) : undefined;
    if (p) canon.set(n, p);
  }
  dogIndex = { names, img, shortOf, hist, canon, pack };
  return dogIndex;
}
const PACK = (pred: (name: string) => boolean) => () => breeds.filter((b) => !!b.slug && !!b.image && pred(b.name)).map((b) => b.name);
/* A MIX OF CARTOON AND REAL, 26 September 2026 (owner): a group or trait shows the
   pack's cartoon dogs and real historic dogs in turn (see dogsForFact). */
const FACT_GROUPS: { re: RegExp; dogs: () => string[]; hist: string[] }[] = [
  { re: /\bflat[- ]faced|brachycephalic|short[- ]nosed|flat faces?\b/i, dogs: () => breeds.filter((b) => !!b.slug && !!b.image && b.skull === "flat").map((b) => b.name), hist: ["Asian flat-faced toy dogs", "Ancient Chinese toy dogs"] },
  { re: /\bspitz|curl(?:y|ed)[- ]tail|pointed ears|prick(?:ed)? ears|sled/i, dogs: () => ["Siberian Husky", "Pomeranian"], hist: ["Chukchi sled dogs", "Ancient Arctic Spitz", "Ancient Spitz dogs"] },
  { re: /\bsighthounds?\b|\bcoursing\b/i, dogs: () => ["Greyhound", "Whippet", "Afghan Hound", "Irish Wolfhound"], hist: ["Medieval Greyhound", "Celtic Coursing Hound", "Ancient eastern sighthounds"] },
  { re: /\bscent ?hounds?\b|by smell|\bhounds?\b/i, dogs: () => ["Beagle", "Bloodhound", "Basset Hound"], hist: ["Talbot", "Southern Hound", "St Hubert Hound"] },
  { re: /\bterriers?\b/i, dogs: PACK((n) => /Terrier/.test(n)), hist: ["Black and Tan Terrier", "English White Terrier", "Earth Dog"] },
  { re: /\bspaniels?\b/i, dogs: PACK((n) => /Spaniel/.test(n)), hist: ["Land Spaniels", "Norfolk Spaniel", "English Water Spaniel"] },
  { re: /\bretrievers?\b|\bgundogs?\b/i, dogs: PACK((n) => /Retriever|Labrador/.test(n)), hist: ["Wavy-Coated Retriever", "St John's Water Dog"] },
  { re: /\bsheepdogs?\b|\bherding\b|\bherders?\b|\bcollies?\b|\bshepherd'?s? dogs?\b/i, dogs: () => ["Border Collie", "Old English Sheepdog", "German Shepherd", "Corgi"], hist: ["Old Scotch Collie", "Old Welsh Grey Sheepdog", "Shepherd's Dogs"] },
  { re: /\blapdogs?\b|\btoy dogs?\b|\btoy breeds?\b|\bcompanion\b/i, dogs: () => ["Pug", "Chihuahua", "Pomeranian", "Cavalier King Charles Spaniel", "Yorkshire Terrier"], hist: ["Old Toy Spaniels", "Continental toy Spaniels", "Old European lapdogs"] },
  { re: /\bguard dogs?\b|\bmastiffs?\b/i, dogs: () => ["Mastiff", "Rottweiler", "Doberman Pinscher", "Great Dane"], hist: ["Ancient Mastiff", "Old British Bandogs", "Old English Bulldog"] },
  { re: /\bwater dogs?\b/i, dogs: () => ["Poodle", "Labrador", "Golden Retriever"], hist: ["St John's Water Dog", "Old European water dogs", "Tweed Water Spaniel"] },
];
const escRe = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// A name as a pattern that also takes its plural: -s, or -ies for a -y name (Huskies).
const namePat = (n: string) => (/y$/.test(n) ? `${escRe(n.slice(0, -1))}(?:y|ies)` : `${escRe(n)}s?`);
/* EVERYDAY SHORT NAMES, 26 September 2026: the names people use, pointing at the
   breed, for facts that say "Huskies" or "Westies". */
const FACT_ALIASES: Record<string, string> = {
  Husky: "Siberian Husky", Westie: "West Highland Terrier", Staffie: "Staffordshire Bull Terrier",
  Staffy: "Staffordshire Bull Terrier", Yorkie: "Yorkshire Terrier", Lab: "Labrador", Frenchie: "French Bulldog",
  Dobermann: "Doberman Pinscher", Doberman: "Doberman Pinscher", Alsatian: "German Shepherd",
};
export function dogsForFact(fact: string): FactDog[] {
  const { names, img, shortOf, hist, canon, pack } = buildDogIndex();
  let rest = fact;
  const found: { name: string; at: number }[] = [];
  for (const n of names) {
    // Short names (Pug, Cur) match only with their capital, so an ordinary word
    // cannot set them off; longer names match in any case.
    const flags = n.length <= 4 ? "" : "i";
    const re = new RegExp(`\\b${namePat(n)}\\b`, flags);
    const m = re.exec(rest);
    if (!m) continue;
    found.push({ name: shortOf.get(n) ?? n, at: m.index });
    rest = rest.replace(new RegExp(`\\b${namePat(n)}\\b`, "g" + flags), (x) => " ".repeat(x.length));
  }
  // Then the everyday short names, on what is left.
  for (const [short, full] of Object.entries(FACT_ALIASES)) {
    const re = new RegExp(`\\b${namePat(short)}\\b`);
    const m = re.exec(rest);
    if (!m || !img.has(full)) continue;
    found.push({ name: full, at: m.index });
    rest = rest.replace(new RegExp(`\\b${namePat(short)}\\b`, "g"), (x) => " ".repeat(x.length));
  }
  let out = found.sort((a, b) => a.at - b.at).map((f) => f.name);
  let groupMode = false;
  // The dog the fact is about always leads (FACT_SUBJECT), under its own name or
  // the nearest one with a picture ("German Shepherd Dog" is the pack's "German Shepherd").
  allDogFacts();
  const subject = FACT_SUBJECT.get(fact.trim());
  if (subject) {
    const tries = [subject, SUBJECT_PICTURE[subject] ?? "", subject.replace(/\s+(Dog|Retriever)$/, ""), shortOf.get(subject.replace(/\s+(Terriers?|Spaniels?|Hounds?)$/, "")) ?? "", FACT_ALIASES[subject] ?? ""];
    const hit = tries.find((t) => t && img.has(t));
    if (hit) out = [hit, ...out.filter((n) => n !== hit)];
  }
  // The group fallback only when no dog is named and no article dog is either.
  if (!out.length && !STORY_DOGS.some((d) => d.re.test(fact))) {
    const g = FACT_GROUPS.find((gr) => gr.re.test(fact));
    if (g) {
      // Real and cartoon in turn, the real (older) dog first: historic, pack, historic...
      const a = g.hist, b = g.dogs();
      out = [];
      for (let i = 0; i < Math.max(a.length, b.length); i++) { if (a[i]) out.push(a[i]); if (b[i]) out.push(b[i]); }
      groupMode = true;
    }
  }
  const story = STORY_DOGS.filter((d) => d.re.test(fact));
  const lead: FactDog[] = [];
  for (const d of story) { lead.push({ name: d.name, img: d.img }); for (const r of d.related) if (img.has(r)) lead.push({ name: r, img: img.get(r)! }); }
  /* Each dog once, under its pack name if it has one. A pack breed shows its real
     historic picture FIRST and its cartoon after, the older dog before the chum
     (owner, 27 September 2026); in a group fallback, where the list already
     alternates real and cartoon dogs, each pack breed shows just its cartoon. */
  const pics = (n: string): FactDog[] => {
    const c = canon.get(n) ?? n;
    if (pack.has(c)) {
      const cartoon = { name: c, img: packArt(c) ?? img.get(c)! };
      const real = hist.get(c) ?? hist.get(n);
      return real && !groupMode ? [{ name: c, img: real }, cartoon] : [cartoon];
    }
    return img.has(n) ? [{ name: n, img: hist.get(n) ?? img.get(n)! }] : [];
  };
  const named: FactDog[] = [...new Set(out.map((n) => canon.get(n) ?? n))].flatMap(pics);
  const leadPics: FactDog[] = lead.flatMap((d) => (img.has(d.name) || canon.has(d.name) ? pics(d.name) : [d]));
  const seenImgs = new Set<string>();
  return [...leadPics, ...named].filter((d) => (seenImgs.has(d.img) ? false : (seenImgs.add(d.img), true))).slice(0, FACT_DOGS_MAX);
}

/* THE DOG EACH FACT IS ABOUT, 27 September 2026 (owner: a Dandie Dinmont fact
   showed other terriers but not the Dandie Dinmont; a dog a fact is about must
   always be shown). Filled as the pool is built, from where each fact came:
   its breed write-up, its extinct-ancestor entry or its famous dog. dogsForFact
   puts this dog first, whatever the name matching finds. */
const FACT_SUBJECT = new Map<string, string>();
/* RICHER FACTS, researched batch by batch, 27 September 2026 (owner: every fact
   should teach something real about the dog, its history and what we asked it to
   do, the way the Manchester Terrier fact explains rat-baiting; never over 150
   words). Keyed by the fact as it was; the fact card shows the richer version.
   Fact card only: the history page and the learn box keep their own text. Each
   was checked against sources before it went in (see the batch review notes). */
const FACT_ENRICH: Record<string, string> = {
  // The Greyhound's speed, and whether a Longdog beats it (owner, 27 September 2026, J18-249).
  "A Longdog is not a breed, but a cross between two sighthounds, usually made to be as fast as possible for chasing.":
    "A Longdog is not a breed, but a cross between two sighthounds, dogs that hunt by spotting their prey and outrunning it. Usually one parent is a Greyhound, the fastest dog in the world over a short sprint, which can reach about 69km/h (43mph) in a race. The other parent is often a Saluki, a Deerhound or a Whippet. So a Longdog is not usually faster than a Greyhound. The second parent is added for other gifts: the stamina to keep running for longer, or the agility to turn sharply after a hare. The Saluki, for example, is thought to beat the Greyhound over longer distances.",
  // More context for a reader who knows nothing about Corgis (owner, 27 September 2026, J18-248).
  "The Pembroke kept the Welsh cattle dog's job, but grew into a slightly different kind of Corgi from the Cardigan.":
    "Wales has two kinds of Corgi, the Cardigan and the Pembroke, named after the old Welsh counties of Cardiganshire and Pembrokeshire where each was found. Both were cattle dogs, small farm dogs that moved cows along by nipping at their heels. The Cardigan is thought to be the older of the two. The Pembroke is usually said to come from little spitz-type dogs brought to Pembrokeshire by Flemish weavers who settled there in the 1100s. You can tell them apart by the tail: the Cardigan has a long one, while many Pembrokes have only a short one, and the Cardigan is the bigger dog. The Kennel Club counted them as one breed until 1934. The Pembroke is the Corgi Queen Elizabeth II loved.",
  "The Mastiff is today's version of Britain's very old, heavy guard dogs.":
    "The Mastiff is Britain's ancient giant guard dog. When the Romans invaded in 55 BC, they found the Britons already had huge, brave mastiff-type dogs that beat the Romans' own dogs in fights, and some were shipped to Rome to fight wild animals in the Colosseum. Over the centuries Mastiffs guarded estates, helped gamekeepers and hunted wolves. By the end of the Second World War, only one Mastiff was left in Britain, a female called Nydia of Frithend, and the breed was saved by fourteen dogs sent back from America.",
  "The Westie was bred from the white puppies born among Scotland's old Highland terriers.":
    "The Westie was bred in Argyll, in the west of Scotland, from the white puppies born among the old Highland terriers. The story goes that Colonel Edward Donald Malcolm of Poltalloch shot one of his own reddish terriers by mistake, thinking it was a fox coming out of the bushes, and decided to breed only white dogs that could never be confused with a fox. At first they were called Poltalloch Terriers, and they appeared at Crufts as West Highland White Terriers in 1907.",
  "In Peter Pan, the Darling children's devoted nursemaid Nana is a Newfoundland dog.":
    "In Peter Pan, the Darling children's devoted nursemaid Nana is a Newfoundland dog, based on J. M. Barrie's own black-and-white Newfoundland, Luath. In the first stage play in 1904, Nana was played by an actor in a dog costume modelled on Luath's coat, and the actor, Arthur Lupino, visited Barrie's home to study how Luath moved. Barrie's earlier dog was a Saint Bernard called Porthos, which may be why Disney made Nana a Saint Bernard in its film.",
  "Boxers were bred to hold large animals until help arrived. Determination, disguised as permanent surprise.":
    "Boxers come from the German Bullenbeisser, meaning bull-biter, a dog that grabbed bears, wild boar and deer and held on until the hunters arrived. Crossed with British Bulldogs, they became the Boxer, first shown at a dog show in Munich in the 1890s. Boxers were among the first dogs Germany used as police dogs, and in the First World War they carried messages and packs and stood guard. Soldiers took Boxers home after the Second World War, which made them popular around the world.",
  "Cocker Spaniels were bred to flush woodcock from thick cover. That explains the hedge inspections.":
    "The Cocker Spaniel is named after the woodcock, a bird it was bred to flush out of thick undergrowth for hunters. For centuries, Britain's land spaniels were bred together and only sorted afterwards by size, so a cocker was simply a spaniel weighing under 25 pounds (about 11kg), while bigger ones became springers. The Kennel Club only recognised the Cocker as a breed of its own in 1893. That old woodcock job is why Cockers still love pushing their noses into hedges.",
  "The Buckhound was a big British hunting dog, kept in packs to hunt fallow deer.":
    "The Buckhound was a big British hunting dog, kept in packs to hunt fallow deer. The royal pack, the Royal Buckhounds, was set up under Edward III in the 1300s and kept by kings and queens for over 500 years. Queen Anne, when she became too ill to ride, had paths cut through Windsor Forest so she could follow the hunt in a carriage. Later, the deer was often released from a cart and caught again unharmed, and in 1901 Edward VII disbanded the pack to save money.",
};
/* THE GOOD DOG BAD DOG DOGS, 26 September 2026 (owner: a Gelert fact showed no
   Gelert). A fact naming one of the articles' dogs shows the article's own picture
   of it first, then its related dog: Gelert and the Irish Wolfhound, Lassie and the
   Rough Collie, and so on. Conan Doyle's hound is a cross of bloodhound and mastiff. */
const STORY_DOGS: { re: RegExp; name: string; img: string; related: string[] }[] = [
  { re: /\bGelert\b|\bBeddgelert\b/, name: "Gelert", img: "/gelert-painting.jpg", related: ["Irish Wolfhound"] },
  { re: /\bGreyfriars Bobby\b/, name: "Greyfriars Bobby", img: "/greyfryers-bobby.jpg", related: ["Skye Terrier"] },
  { re: /\bLassie\b/, name: "Lassie", img: "/lassie-img.jpg", related: ["Rough Collie"] },
  { re: /\bBull's-eye\b/, name: "Bull's-eye", img: "/bulls-eye-img.jpg", related: ["Bull Terrier"] },
  { re: /\bBaskervilles?\b/, name: "The Hound of the Baskervilles", img: "/hound-of-the-baskervilles.jpg", related: ["Bloodhound", "Mastiff"] },
  { re: /\bOdin\b/, name: "Odin", img: "/obin-uber-hero-img.jpg", related: ["German Shepherd"] },
  { re: /\bArgos\b/, name: "Argos", img: "/history/Argos-hero.jpg", related: ["Laconian tracking Hounds"] },
  { re: /\bAnubis\b/, name: "Anubis", img: "/history/Anubis-hero.jpg", related: [] },
];
// A subject whose picture is filed under another name.
const SUBJECT_PICTURE: Record<string, string> = {
  Deerhound: "Scottish Deerhound", "White English Terrier": "English White Terrier", "Farm and kitchen curs": "Cur",
  Setter: "English Setter", Collie: "Rough Collie", "Collie or working dog": "Old working collies",
};
/* QUIZ QUESTIONS, 27 September 2026 (owner: a multiple-choice or yes/no question
   under some facts, worth points; only where a real question exists, never made
   up). Every answer is in the fact itself: `evidence` is the words in the fact
   that prove it, checked when the pool is built, so a fact reworded later simply
   loses its question rather than showing a wrong one. `match` picks the fact. */
export type FactQuiz = { q: string; options: string[]; answer: number };
const FACT_QUIZ: (FactQuiz & { match: string; evidence: string })[] = [
  { match: "Perdita is Pongo's partner", q: "What is the name of the wicked woman who wants to make the puppies into a fur coat?", options: ["Cruella de Vil", "Crumbella de Ville", "Cruellie de Spot"], answer: 0, evidence: "Cruella de Vil" },
  { match: "Snoopy is Charlie Brown's pet", q: "Who is Snoopy's owner?", options: ["Charlie Brown", "Charlie Green", "Charlie Bone"], answer: 0, evidence: "Charlie Brown" },
  { match: "Shep was a Border Collie on the BBC", q: "Which presenter made \"Get down, Shep!\" famous?", options: ["John Noakes", "John Nokes-a-lot", "Joan Oaks"], answer: 0, evidence: "John Noakes" },
  { match: "Balto was the Siberian Husky", q: "Which town did Balto's team race the medicine to?", options: ["Nome", "Gnome", "Home"], answer: 0, evidence: "Nome" },
  { match: "In 1925, sled dog teams raced medicine", q: "Did Togo's team run the shortest part of the journey?", options: ["Yes", "No"], answer: 1, evidence: "longest and most dangerous" },
  { match: "Lassie first appeared in a magazine story", q: "Who first wrote about Lassie?", options: ["Eric Knight", "Eric Night-Night", "Erica Knit"], answer: 0, evidence: "Eric Knight" },
  { match: "Greyfriars Bobby was a real little terrier", q: "Which city did Greyfriars Bobby live in?", options: ["Edinburgh", "Edin-burger", "Edenbury"], answer: 0, evidence: "Edinburgh" },
  { match: "Scooby-Doo is a cowardly", q: "What kind of dog is Scooby-Doo?", options: ["Great Dane", "Great Pain", "Grate Dean"], answer: 0, evidence: "Great Dane" },
  { match: "Santa's Little Helper is the family's pet", q: "What kind of dog is Santa's Little Helper?", options: ["Greyhound", "Grayhund", "Greyhoof"], answer: 0, evidence: "Greyhound" },
  { match: "Myth: Dalmatian puppies are born with their spots", q: "What colour are Dalmatian puppies when they are born?", options: ["Pure white", "Spotty", "Jet black"], answer: 0, evidence: "pure white" },
  { match: "Myth: Basenjis cannot make any noise", q: "What sound can a Basenji make instead of barking?", options: ["A yodel", "A moo", "A quack"], answer: 0, evidence: "yodelling" },
  { match: "Myth: Dachshunds were bred to look like sausages", q: "What does Dachshund mean in German?", options: ["Badger dog", "Sausage dog", "Hot dog"], answer: 0, evidence: "badger dog" },
  { match: "The Turnspit Dog had one of the strangest jobs", q: "What did the Turnspit Dog run inside?", options: ["A wheel", "A barrel", "A teapot"], answer: 0, evidence: "wheel" },
  { match: "Waldi, a stripy Dachshund", q: "Which Olympic Games had Waldi as its mascot?", options: ["Munich 1972", "London 2012", "Paris 1924"], answer: 0, evidence: "1972 Olympic Games in Munich" },
  { match: "Smoky was a tiny Yorkshire Terrier", q: "What did Smoky pull through a narrow pipe?", options: ["A telegraph wire", "A sausage", "A kite string"], answer: 0, evidence: "telegraph wire" },
  { match: "Rin Tin Tin was a German Shepherd puppy", q: "Where was Rin Tin Tin rescued from?", options: ["A battlefield in France", "A Hollywood car park", "A London zoo"], answer: 0, evidence: "battlefield in France" },
  { match: "The Dickin Medal is known as the animals'", q: "The Dickin Medal is known as the animals' what?", options: ["Victoria Cross", "Olympic gold", "Blue Peter badge"], answer: 0, evidence: "Victoria Cross" },
  { match: "Crumstone Irma, a search dog in the London Blitz", q: "How many people did Crumstone Irma help find?", options: ["191", "19", "1,091"], answer: 0, evidence: "191" },
  { match: "a Labrador called Daisy kept pawing", q: "Which charity did Dr Claire Guest go on to start?", options: ["Medical Detection Dogs", "Dogs With Sniffers", "The Nose Knows"], answer: 0, evidence: "Medical Detection Dogs" },
  { match: "A guide dog costs more than", q: "Does a guide dog cost more than \u00a355,000 over its life?", options: ["Yes", "No"], answer: 0, evidence: "more than \u00a355,000" },
  { match: "Myth: Saint Bernards carried little barrels", q: "Did the monks' real rescue dogs carry barrels of brandy?", options: ["Yes", "No"], answer: 1, evidence: "did not carry them" },
  { match: "Myth: The Labrador comes from Labrador", q: "Where did the Labrador's ancestors really come from?", options: ["Newfoundland", "Labrador", "New Zealand"], answer: 0, evidence: "Newfoundland" },
  { match: "Legend: The Chow Chow got its blue-black tongue", q: "What colour is a Chow Chow's tongue?", options: ["Blue-black", "Pink", "Green"], answer: 0, evidence: "blue-black" },
  { match: "Myth: Dogs only see in black and white", q: "Which colours can dogs see best?", options: ["Blues and yellows", "Reds and greens", "Only black and white"], answer: 0, evidence: "blues and yellows" },
  { match: "Myth: One dog year is the same as seven", q: "Is one dog year really the same as seven human years?", options: ["Yes", "No"], answer: 1, evidence: "Myth: One dog year" },
  { match: "Mick the Miller was a racing Greyhound", q: "Which race did Mick the Miller win in 1929 and 1930?", options: ["The English Greyhound Derby", "The Grand National", "The Boat Race"], answer: 0, evidence: "English Greyhound Derby" },
  { match: "Only about one dog in fifty passes", q: "How many dogs pass the tests to become digital detection dogs?", options: ["About one in fifty", "Every single one", "About half"], answer: 0, evidence: "one dog in fifty" },
  { match: "a star of rat-baiting, a cruel Victorian contest", q: "Where were rat-baiting contests usually held?", options: ["In pubs", "In churches", "In schools"], answer: 0, evidence: "cellars of pubs" },
  { match: "Uggie was a Jack Russell Terrier", q: "What kind of film was The Artist, starring Uggie?", options: ["A silent film", "A musical", "A cartoon"], answer: 0, evidence: "silent film" },
  { match: "Endal was a British Labrador assistance dog", q: "What did Endal do when his owner was knocked out?", options: ["Put him in the recovery position", "Sang to him", "Ran away"], answer: 0, evidence: "recovery position" },
  { match: "Marley & Me is a 2005 book", q: "Who wrote Marley & Me?", options: ["John Grogan", "John Groan", "Joan Grogger"], answer: 0, evidence: "John Grogan" },
  { match: "Legend: Prince Llywelyn killed his loyal dog Gelert", q: "Who probably made up Gelert's grave?", options: ["A local innkeeper", "A king", "A wizard"], answer: 0, evidence: "local innkeeper" },
  /* ONE FOR EVERY CHUM, 27 September 2026 (owner: more questions, so players
     actually meet them). Each on that chum's own fact, answer in its text. */
  { match: "In the Welsh legend of Llywelyn the Great", q: "In the Welsh legend, what kind of dog was Gelert said to be?", options: ["A wolfhound", "A poodle", "A pug"], answer: 0, evidence: "wolfhound" },
  { match: "The Bloodhound is the great tracking expert", q: "How does the Bloodhound follow a trail?", options: ["By smell", "By sight", "By listening"], answer: 0, evidence: "by smell" },
  { match: "Mastiff-type 'bandogs' were chained up", q: "When were bandogs let loose to guard farms?", options: ["At night", "At lunchtime", "On Sundays"], answer: 0, evidence: "let loose at night" },
  { match: "The Great Dane grew from the old German boarhounds", q: "What dangerous animal did the Great Dane's ancestors hunt?", options: ["Wild boar", "Lions", "Sharks"], answer: 0, evidence: "wild boar" },
  { match: "The Bull Terrier comes from bulldog-and-terrier crosses", q: "The Bull Terrier comes from crosses of which two kinds of dog?", options: ["Bulldogs and terriers", "Poodles and pugs", "Collies and corgis"], answer: 0, evidence: "bulldog-and-terrier" },
  { match: "Alpha is the fierce Doberman", q: "In the film Up, what goes wrong with Alpha's talking collar?", options: ["His voice goes squeaky", "It plays music", "It turns him invisible"], answer: 0, evidence: "squeaky" },
  { match: "The Saint Bernard comes from the mountain farm dogs", q: "Who kept the Saint Bernard's ancestors in the Alps?", options: ["Monks", "Pirates", "Knights"], answer: 0, evidence: "monks" },
  { match: "The Afghan Hound is a long-haired hunting dog", q: "How did the Afghan Hound hunt?", options: ["By sight", "By smell", "By listening"], answer: 0, evidence: "hunted by sight" },
  { match: "The Weimaraner was bred at the German court", q: "Where was the Weimaraner first bred?", options: ["The German court of Weimar", "A Welsh farm", "A French palace"], answer: 0, evidence: "court of Weimar" },
  { match: "The Dalmatian was a carriage and working dog", q: "What was the Dalmatian's old job?", options: ["Running with carriages", "Herding sheep", "Sitting on laps"], answer: 0, evidence: "carriage and working dog" },
  { match: "The Rottweiler is a German cattle, butcher's and guard dog", q: "Which German town gave the Rottweiler its name?", options: ["Rottweil", "Rotterdam", "Rothenburg"], answer: 0, evidence: "Rottweil" },
  { match: "The Old English Sheepdog began as a practical dog", q: "What did the Old English Sheepdog first do?", options: ["Drove cattle and sheep", "Guarded castles", "Pulled sleds"], answer: 0, evidence: "driving cattle and sheep" },
  { match: "The Basset Hound was bred as a slow, low hunting dog", q: "Why does the Basset Hound move slowly?", options: ["So people on foot can keep up", "Because it is lazy", "To save energy for swimming"], answer: 0, evidence: "people on foot can keep up" },
  { match: "The Cavalier King Charles Spaniel was bred on purpose", q: "What did breeders use to bring back the Cavalier's look?", options: ["Old British paintings", "Photographs", "Statues"], answer: 0, evidence: "old British paintings" },
  { match: "Winston Churchill, nicknamed the British Bulldog", q: "What kind of dog did Winston Churchill actually keep?", options: ["A poodle", "A bulldog", "A beagle"], answer: 0, evidence: "poodle named Rufus" },
  { match: "The Italian Greyhound is a tiny, elegant sighthound", q: "The Italian Greyhound is like which dog, shrunk down?", options: ["A Greyhound", "A Great Dane", "A Bulldog"], answer: 0, evidence: "Greyhound shrunk down" },
  { match: "The Papillon is the butterfly-eared cousin", q: "What does Papillon mean in French?", options: ["Butterfly", "Pillow", "Puppy"], answer: 0, evidence: "French for butterfly" },
  { match: "Susan was the Corgi given to the future Queen", q: "How old was the future Queen when she was given Susan?", options: ["18", "8", "80"], answer: 0, evidence: "18th birthday" },
  { match: "The Bichon Frise is a fluffy white pet dog", q: "What does the Bichon Frise look like?", options: ["A powder puff", "A mop", "A teddy bear"], answer: 0, evidence: "powder puff" },
  { match: "The Maltese is a tiny white lapdog", q: "Which dog is the Maltese related to?", options: ["The Bichon", "The Boxer", "The Beagle"], answer: 0, evidence: "related to the Bichon" },
  { match: "The Boston Terrier was bred in America", q: "Which country was the Boston Terrier bred in?", options: ["America", "Scotland", "Australia"], answer: 0, evidence: "bred in America" },
  { match: "Beagles were bred so people could follow the hunt on foot", q: "How did people follow a Beagle hunt?", options: ["On foot", "On horseback", "By boat"], answer: 0, evidence: "on foot" },
  { match: "The Siberian Husky comes from the Chukchi sled dogs", q: "Which sled dogs does the Siberian Husky come from?", options: ["The Chukchi sled dogs", "The Viking sled dogs", "The Roman sled dogs"], answer: 0, evidence: "Chukchi sled dogs" },
  { match: "The Shih Tzu was bred at the Chinese royal court", q: "What does Shih Tzu mean?", options: ["Lion dog", "Tiny dog", "Tea dog"], answer: 0, evidence: "means lion dog" },
  { match: "The Jackapoo is a mix of the Jack Russell", q: "The Jackapoo is a mix of the Jack Russell and which dog?", options: ["Poodle", "Pug", "Pointer"], answer: 0, evidence: "Jack Russell Terrier and the Poodle" },
  { match: "The Cavachon is a modern mix", q: "The Cavachon mixes the Cavalier and which dog?", options: ["Bichon Frise", "Boxer", "Beagle"], answer: 0, evidence: "Bichon Frise" },
  { match: "The Cavapoo is a modern mix", q: "The Cavapoo mixes the Cavalier and which dog?", options: ["Poodle", "Pug", "Papillon"], answer: 0, evidence: "and the Poodle" },
  { match: "The Miniature Schnauzer was bred down in size", q: "What skill did the Miniature Schnauzer keep?", options: ["Rat-catching", "Swimming", "Herding"], answer: 0, evidence: "rat-catching" },
  { match: "The Greyhound is Britain's version of a very old kind of dog", q: "How does the Greyhound hunt?", options: ["By sight", "By smell", "By digging"], answer: 0, evidence: "hunts by sight" },
  { match: "The Lurcher is not one breed", q: "Is the Lurcher a breed of its own?", options: ["Yes", "No"], answer: 1, evidence: "not one breed" },
  { match: "The Whippet was bred as a smaller sighthound", q: "What did the Whippet catch?", options: ["Rabbits", "Deer", "Foxes"], answer: 0, evidence: "catching rabbits" },
  { match: "The Maltipoo is a modern mix", q: "The Maltipoo mixes the Maltese and which dog?", options: ["Poodle", "Pug", "Pomeranian"], answer: 0, evidence: "Maltese and the Poodle" },
  { match: "The Goldendoodle is a modern mix", q: "The Goldendoodle mixes the Golden Retriever and which dog?", options: ["Poodle", "Pointer", "Pug"], answer: 0, evidence: "Golden Retriever and the Poodle" },
  { match: "The Cockapoo is a mix of the Cocker Spaniel", q: "The Cockapoo mixes the Poodle and which dog?", options: ["Cocker Spaniel", "Corgi", "Collie"], answer: 0, evidence: "Cocker Spaniel and the Poodle" },
  { match: "Wee Jock is the West Highland Terrier", q: "What is the West Highland Terrier called in Hamish Macbeth?", options: ["Wee Jock", "Wee Jimmy", "Big Jock"], answer: 0, evidence: "Wee Jock" },
  { match: "The Pomeranian is the smallest of the German farm spitz dogs", q: "Which queen loved Pomeranians?", options: ["Queen Victoria", "Queen Anne", "Queen Mary"], answer: 0, evidence: "Queen Victoria" },
  { match: "The French Bulldog began with small bulldogs", q: "Who took the French Bulldog's ancestors to France?", options: ["Lace workers from Nottingham", "French sailors", "Roman soldiers"], answer: 0, evidence: "lace workers from Nottingham" },
  { match: "Staffordshire Bull Terriers were handled closely", q: "What mattered for Staffordshire Bull Terriers from the start?", options: ["Steadiness around people", "Running fast", "Barking loudly"], answer: 0, evidence: "steadiness around people" },
  { match: "The Chihuahua comes from the little pet dogs of ancient Mexico", q: "Which country does the Chihuahua come from?", options: ["Mexico", "China", "Chile"], answer: 0, evidence: "ancient Mexico" },
  { match: "German Shepherds were created for long, purposeful work", q: "Which part of the German Shepherd's movement was planned?", options: ["Its trot", "Its jump", "Its swim"], answer: 0, evidence: "trot" },
  { match: "Pugs lived in Chinese imperial courts", q: "Where did Pugs once live?", options: ["In Chinese imperial courts", "In French lighthouses", "In Scottish castles"], answer: 0, evidence: "Chinese imperial courts" },
  { match: "The Labradoodle was first bred from the Labrador", q: "What was the Labradoodle first bred to be?", options: ["An assistance dog", "A racing dog", "A guard dog"], answer: 0, evidence: "assistance dog" },
  { match: "The Yorkshire Terrier began among the rat-catching dogs", q: "Where did the Yorkshire Terrier begin?", options: ["Northern mill towns", "London palaces", "Welsh farms"], answer: 0, evidence: "northern mill towns" },
  { match: "Parliamentarian propaganda during the Civil War", q: "What did Civil War propaganda claim Prince Rupert's poodle was?", options: ["A witch in disguise", "A spy", "A king"], answer: 0, evidence: "witch in disguise" },
  { match: "Slinky Dog is a toy Dachshund", q: "What does Slinky Dog have for a middle?", options: ["A metal spring", "A rubber band", "A sausage"], answer: 0, evidence: "metal spring" },
  { match: "The poet Elizabeth Barrett Browning adored her spaniel Flush", q: "Who wrote a book about Flush?", options: ["Virginia Woolf", "Charles Dickens", "Beatrix Potter"], answer: 0, evidence: "Virginia Woolf" },
  { match: "Border Terriers kept pace with horses", q: "What did Border Terriers follow underground?", options: ["Foxes", "Rabbits", "Moles"], answer: 0, evidence: "foxes underground" },
  { match: "Border Collies move sheep with a hard stare", q: "What is the Border Collie's hard stare called?", options: ["The eye", "The glare", "The look"], answer: 0, evidence: "called the eye" },
  { match: "The Cocker Spaniel is named after the woodcock", q: "What is the Cocker Spaniel named after?", options: ["The woodcock", "The cockerel", "The cuckoo"], answer: 0, evidence: "woodcock" },
  { match: "The Golden Retriever was bred on purpose in the Scottish Highlands", q: "Why was the Golden Retriever bred with a soft mouth?", options: ["To carry birds without damaging them", "To eat quietly", "To bark softly"], answer: 0, evidence: "without damaging them" },
  { match: "Labrador ancestors hauled nets", q: "Where did the Labrador's ancestors haul nets?", options: ["Newfoundland waters", "The River Thames", "Lake Windermere"], answer: 0, evidence: "Newfoundland waters" },
  { match: "Eddie is Martin Crane's Jack Russell Terrier", q: "In Frasier, what does Eddie do that drives Frasier mad?", options: ["Stares at him", "Sings", "Steals his hat"], answer: 0, evidence: "staring at Frasier" },
  { match: "Boxers come from the German Bullenbeisser", q: "What does Bullenbeisser mean?", options: ["Bull-biter", "Bear-hugger", "Boar-chaser"], answer: 0, evidence: "bull-biter" },
  { match: "The Irish Setter was bred from older Irish setting dogs", q: "What colour is the Irish Setter?", options: ["Red", "Blue", "Green"], answer: 0, evidence: "red gundog" },
  // Batch 1 (J18-241): Jackapoo. Each answer is in its fact (evidence).
  { match: "The Jack Russell side of the Jackapoo is named after a real man", q: "What was the name of the terrier Jack Russell bought from a milkman?", options: ["Trump", "Tramp", "Trumpet"], answer: 0, evidence: "She was called Trump" },
  { match: "A Jackapoo's Poodle parent is almost always", q: "Which Poodles are usually crossed to make a Jackapoo?", options: ["Miniature or Toy Poodles", "Standard Poodles", "Mammoth Poodles"], answer: 0, evidence: "Miniature or Toy Poodle" },
  { match: "Why are so many Jack Russells white?", q: "Why did John Russell choose mostly white terriers?", options: ["So hunters would not mistake them for the fox", "So they would show up in the snow", "Because white dogs were in fashion"], answer: 0, evidence: "never mistake for the fox" },
  { match: "The Poodle half of a Jackapoo comes from one of the quickest learners", q: "Where did the Poodle come in Stanley Coren's ranking of quick learners?", options: ["Second", "First", "Tenth"], answer: 0, evidence: "The Poodle came second" },
  { match: "The Jackapoo goes by at least ten names", q: "Why does the Jackapoo have so many names?", options: ["It has no breed club to choose one", "It was named by a computer", "Every owner must invent one"], answer: 0, evidence: "no such club" },
  // Batch 2 (J18-245): Cavachon.
  { match: "says it bred the first planned litter in 1996", q: "In which year was the first planned Cavachon litter bred?", options: ["1996", "1896", "1966"], answer: 0, evidence: "in 1996" },
  { match: "From 1926 he offered £25 at Crufts", q: "How much prize money did Roswell Eldridge offer at Crufts?", options: ["£25", "£5", "£500"], answer: 0, evidence: "£25" },
  { match: "In 1667 the diarist Samuel Pepys", q: "What did Samuel Pepys say King Charles II did at a council meeting?", options: ["Played with his dog", "Fell asleep", "Ate a whole cake"], answer: 0, evidence: "playing with his dog" },
  { match: "Legend says that in 1704 the Duchess of Marlborough", q: "In the legend, what made the Blenheim spot?", options: ["The Duchess's thumb", "A drop of paint", "A bee sting"], answer: 0, evidence: "pressed her thumb" },
  { match: "so linked with the Canary Island of Tenerife", q: "Which island gave the Bichon Tenerife its name?", options: ["Tenerife", "Malta", "Jersey"], answer: 0, evidence: "Canary Island of Tenerife" },
  { match: "King Henri III, who ruled from 1574 to 1589", q: "How did King Henri III carry his little dogs?", options: ["In a basket round his neck", "In his crown", "In a wheelbarrow"], answer: 0, evidence: "basket hung round his neck" },
  { match: "Wales has two kinds of Corgi, the Cardigan and the Pembroke", q: "Until which year did the Kennel Club count the two Corgis as one breed?", options: ["1934", "1834", "1994"], answer: 0, evidence: "until 1934" },
  { match: "A Longdog is not a breed, but a cross between two sighthounds, dogs that hunt", q: "How fast can a Greyhound run in a race?", options: ["About 69km/h (43mph)", "About 29km/h (18mph)", "About 150km/h (93mph)"], answer: 0, evidence: "about 69km/h (43mph)" },
  // Batch 3 (J18-253): Cavapoo.
  { match: "In Australia the Cavapoo is called the Cavoodle", q: "What is the Cavapoo called in Australia?", options: ["The Cavoodle", "The Kangapoo", "The Cavapup"], answer: 0, evidence: "called the Cavoodle" },
  { match: "The Cavalier in Cavapoo comes from a war", q: "What were the soldiers who fought for King Charles I nicknamed?", options: ["Cavaliers", "Roundheads", "Redcoats"], answer: 0, evidence: "nicknamed Cavaliers" },
  { match: "Both halves of the Cavapoo can be found on the same side", q: "What was the name of Prince Rupert's Poodle?", options: ["Boye", "Rover", "Bouncer"], answer: 0, evidence: "Poodle, Boye" },
  { match: "In 1570 the doctor John Caius described a little spaniel", q: "What did John Caius call the little lapdog spaniel?", options: ["The comforter", "The cuddler", "The snuggler"], answer: 0, evidence: "comforter" },
  { match: "In 1635 the painter Anthony van Dyck painted", q: "Why was King Charles I cross with Van Dyck's first painting?", options: ["His son was shown in a skirt", "The dogs looked too big", "The king was left out"], answer: 0, evidence: "wearing a skirt" },
  { match: "a Poodle breeder called Alene Erlanger set up Dogs for Defense", q: "What was Alene Erlanger's wartime scheme called?", options: ["Dogs for Defense", "Pups for Peace", "Hounds for Heroes"], answer: 0, evidence: "Dogs for Defense" },
];
export function quizFor(fact: string): FactQuiz | null {
  const low = fact.toLowerCase();
  const hit = FACT_QUIZ.find((z) => fact.includes(z.match) && low.includes(z.evidence.toLowerCase()));
  return hit ? { q: hit.q, options: hit.options, answer: hit.answer } : null;
}
let cache: string[] | null = null;
/* FACTS BY DOG, 27 September 2026 (owner: a fact shown for a chum collect or a
   chain should be about that chum or a dog in the chain). Built once, the first
   time it is asked for, from the same dogsForFact that picks each fact's
   pictures, so "about this dog" means exactly "shows this dog". */
let byDog: Map<string, string[]> | null = null;
export function factsAboutDog(name: string): string[] {
  if (!byDog) {
    byDog = new Map();
    for (const f of allDogFacts()) for (const d of dogsForFact(f)) {
      const list = byDog.get(d.name) ?? [];
      if (!list.includes(f)) list.push(f);
      byDog.set(d.name, list);
    }
  }
  return byDog.get(name) ?? [];
}
// Every fact in the pool, each once, longer than a scrap.
export function allDogFacts(): string[] {
  if (cache) return cache;
  const history = SECTIONS.flatMap((s) => s.facts.map((f) => f.text));
  /* THE FIRST TWO SENTENCES, 25 September 2026 (owner: one sentence on its own,
     such as "The Collie comes from Britain's old working sheepdogs.", was too bare
     to learn from). A write-up's second sentence usually carries the detail, so
     the fact takes up to two, stopping before the "In our family tree" line,
     which only makes sense beside the tree. */
  const breedLines = Object.entries(breedInfo as Record<string, string>).map(([name, text]) => {
    const f = factFromWriteUp(text).trim();
    FACT_SUBJECT.set(f, name);
    return f;
  });
  for (const [name, text] of Object.entries(EXTINCT_REWRITES)) FACT_SUBJECT.set(text.trim(), name);
  const chumLines = Object.entries(CHUM_FACTS).flatMap(([name, list]) => list.map((f) => { FACT_SUBJECT.set(f.trim(), name); return f; }));
  const pool = [...new Set([...history, ...CHATBOT_FACTS, ...famousFacts(), ...breedLines, ...Object.values(EXTINCT_REWRITES), ...MYTHS.map((m) => `${MYTH_LEAD[m.kind][0]} ${m.claim} ${MYTH_LEAD[m.kind][1]} ${m.truth}`), ...ARTICLE_FACTS, ...chumLines, ...EXTRA_FACTS].map((f) => f.trim()))].filter((f) => f.length > 20);
  // The richer versions (FACT_ENRICH), keeping each fact's own dog (FACT_SUBJECT).
  cache = pool.map((f) => {
    const rich = FACT_ENRICH[f];
    if (!rich) return f;
    const subj = FACT_SUBJECT.get(f);
    if (subj) FACT_SUBJECT.set(rich, subj);
    return rich;
  });
  return cache;
}
