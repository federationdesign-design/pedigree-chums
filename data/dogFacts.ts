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
   Batch 3 (J18-253): Cavapoo, 9 new facts (1 existing, 10 in all).
   Batch 4 (J18-257): Maltipoo, 9 new facts (1 existing, 10 in all).
   Batch 5 (J18-258): Goldendoodle, 9 new facts (1 existing, 10 in all).
   Batch 6 (J18-261): Labradoodle, 9 new facts (1 existing, 10 in all).
   Batch 7 (J18-265): Doberman, 9 new facts (2 existing, 11 in all).
   Batch 8 (J18-266): Miniature Schnauzer, 8 new facts (2 existing, 10 in all).
   Batch 9 (J18-267): Lurcher, 8 new facts (2 existing, 10 in all).
   Batch 10 (J18-268): Cockapoo, 8 new facts (2 existing, 10 in all).
   Batch 11 (J18-270): Staffordshire Bull Terrier, 8 new facts (2 existing, 10 in all).
   Batch 12 (J18-271): Irish Setter, 8 new facts (2 existing, 10 in all).
   Batch 13 (J18-272): Italian Greyhound, 7 new facts (3 existing, 10 in all).
   Batch 14 (J18-274): Boston Terrier, 7 new facts (3 existing, 10 in all).
   Batch 15 (J18-275): Pomeranian, 7 new facts (3 existing, 10 in all).
   Batch 16 (J18-276): Yorkshire Terrier, 7 new facts (3 existing, 10 in all).
   Batch 17 (J18-277): Border Terrier, 7 new facts (3 existing, 10 in all).
   Batch 18 (J18-278): Papillon, 6 new facts (4 existing, 10 in all).
   Batch 19 (J18-279): Beagle, 6 new facts (4 existing, 10 in all).
   Batch 20 (J18-281): Shih Tzu, 6 new facts (4 existing, 10 in all).
   Batch 21 (J18-283): Whippet, 5 new facts (7 existing, 12 in all).
   Batch 22 (J18-284): French Bulldog, 6 new facts (4 existing, 10 in all).
   Batch 23 (J18-285): Weimaraner, 5 new facts (6 existing, 11 in all). */
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
  // Batch 4 (J18-257): 9 new, 10 in all.
  Maltipoo: [
    "The Maltipoo, a cross of the Maltese and the Poodle, first appeared in the USA in the late 1980s or the 1990s, but nobody has ever claimed to have bred the first one. Breeders wanted a tiny, cuddly companion with the Maltese's small size and soft coat and the Poodle's quick brain, and the Maltipoo became one of the smallest dogs of the Poodle-cross craze.",
    "The Maltipoo has also been called the Moodle, the Maltoodle, the Maltipoodle and the Malt-A-Poo. Dog clubs in America still cannot agree on the spelling: some use Malt-A-Poo and others Maltipoo. Maltipoo is the name most breeders now use, joining the Malti of the Maltese to the poo of the Poodle. None of the big kennel clubs recognise it as a breed.",
    "The Maltese side of the Maltipoo is one of the oldest pet dogs we know of. On a Greek vase from about 500 BC, found at Vulci in Italy, a little dog with a pointed nose was painted beside the word melitaie, meaning a dog from Melita. Melita is the old name for Malta, but there was also an island called Melita off the coast of what is now Croatia, so nobody is quite sure which island these dogs came from.",
    "The Greek thinker Aristotle wrote about the Maltipoo's Maltese ancestors around 370 BC, calling them Melitaean dogs and comparing them to a weasel-like animal. That makes the Maltese one of the earliest pet dogs to be written about by name, more than 2,300 years before anyone crossed one with a Poodle to make a Maltipoo.",
    "In Roman times, the poet Martial wrote a poem about a little white lapdog called Issa, who belonged to his friend Publius. Many people think Issa was a Maltese, the ancestor that gives the Maltipoo half its name. Martial says Issa was more playful than a sparrow, and that Publius had her portrait painted so she would never be forgotten, a picture so lifelike you could not tell the dog from the painting.",
    "People in ancient Greece loved the Maltipoo's Maltese ancestors so much that one writer poked fun at it. Around 300 BC, Theophrastus described a show-off who, when his little dog from Melita died, put up a memorial stone for it. Those little Melitaean lapdogs are the ancestors of the Maltese, the dog behind the Malti in Maltipoo.",
    "The people of Sybaris, an ancient Greek city famous for its luxury, loved their little Melitaean lapdogs so much that, according to the writer Athenaeus, they took them everywhere, even to the gym. Those tiny white dogs were ancestors of the Maltese, which gives the Maltipoo half of its name. The word sybarite, meaning someone who loves luxury, comes from that city.",
    "The Maltese side of the Maltipoo has had many names over the centuries. In Latin it was Canis Melitaeus, and in English it has been called the Ancient Dog of Malta, the Roman Ladies' Dog and the Maltese Lion Dog. The Kennel Club in Britain settled on plain Maltese in the 1800s.",
    "A Maltipoo is tiny, usually weighing about 2 to 7kg and standing no more than 38cm tall, depending mostly on whether its Poodle parent was a Toy or a Miniature. The Maltese side has a long, silky, pure white coat, but Poodles come in many colours, so Maltipoos come in more colours than the Maltese, with coats anywhere from silky to curly.",
  ],
  // Batch 5 (J18-258): 9 new, 10 in all.
  Goldendoodle: [
    "The Goldendoodle, a cross of the Golden Retriever and the Poodle, was first widely bred in the 1990s in the USA and Australia. It followed the Labradoodle and the Cockapoo, and some breeders hoped for a larger family dog than the Cockapoo, with the Golden Retriever's friendly nature and the Poodle's low-shedding coat. Some were also bred to work as therapy and assistance dogs.",
    "In Australia and New Zealand the Goldendoodle is called the Groodle. Elsewhere Goldendoodle is the usual name, joining Golden, from the Golden Retriever, to doodle, the playful nickname given to many Poodle crosses. Whatever the name, it is not recognised as a breed by any major kennel club, including Dogs Australia and the American Kennel Club.",
    "The first Goldendoodles all had a Standard Poodle parent, so they were big dogs. As they caught on, people asked for smaller ones, and breeders began crossing Golden Retrievers with Miniature Poodles, and later Toy Poodles, too. That is why a Goldendoodle can now be anything from a small lap-sized dog to a large one, depending on which size of Poodle was its parent.",
    "The Goldendoodle's Golden Retriever side began with a single yellow puppy. In 1865 Dudley Marjoribanks, later Lord Tweedmouth, bought a yellow retriever called Nous from a cobbler in Brighton, the only yellow puppy in a litter of black ones. In 1868 he bred Nous with Belle, a Tweed Water Spaniel, at Guisachan, his Highland estate, and their yellow puppies, including Crocus, Cowslip and Primrose, founded the Golden Retriever.",
    "For years people told a story that the Golden Retriever, the golden half of the Goldendoodle, came from a troupe of Russian circus dogs that Lord Tweedmouth bought after seeing them perform. It was a good story, but it was wrong. In 1952 his own handwritten record book was published, and it showed that the breed really began with his yellow retriever Nous and a water spaniel called Belle.",
    "Golden Retrievers, one half of the Goldendoodle, go back to their birthplace for a party. Owners bring them to the ruins of Guisachan House in the Scottish Highlands, where the first litter was born in 1868. There were 188 Golden Retrievers at the 2006 gathering and 361 at the breed's 150th birthday in 2018, and in 2023 the club counted 466, from 12 countries.",
    "Belle, the mother of the first Golden Retrievers and so an ancestor of every Goldendoodle, was a Tweed Water Spaniel, a breed that is now extinct. Tweed Water Spaniels had curly, liver-brown coats and looked rather like the Irish Water Spaniel. So a Goldendoodle's curls may come from its Poodle parent, but its golden side has curly water dogs in its past too.",
    "The Poodle side of the Goldendoodle once hunted for buried treasure. In Victorian England and France, small Poodle-type dogs were trained to sniff out truffles, rare fungi that grow underground and are prized by cooks. A dog book of 1886 described the truffle dog as a small, nearly pure Poodle. Poodles were also retrievers of ducks and famous performers in circuses.",
    "The Goldendoodle can be a working dog as well as a pet. Goldendoodles have worked as guide dogs, assistance dogs and therapy dogs, and one study even tested whether they could sniff out peanuts in food for people with nut allergies. Both of their parents are working breeds: the Golden Retriever fetches birds for hunters, and the Poodle began as a water retriever.",
  ],
  // Batch 6 (J18-261): 9 new, 10 in all.
  Labradoodle: [
    "The Labradoodle, a cross of the Labrador and the Poodle, began with a letter. In the 1980s Wally Conron, who bred puppies for the Royal Guide Dog Association of Australia, heard from a blind woman in Hawaii whose husband was allergic to dogs. She needed a guide dog that would not make him ill. Poodles shed little hair, so he tried 33 Standard Poodles over three years, but none of them made the grade as a guide dog.",
    "The first planned Labradoodle litter was born in Australia in 1989. Wally Conron mated his Labrador, Brandy, with a Standard Poodle called Harley, and three puppies arrived: Simon, Sheik and Sultan. Clippings of their coats and samples of their spit were posted to Hawaii and tested on the woman's allergic husband, and only Sultan passed, so Sultan became the first Labradoodle guide dog.",
    "Sultan, the very first Labradoodle guide dog, flew from Australia to Hawaii to work for the blind woman whose husband was allergic to most dogs. He did the job for about ten years. Sultan proved the idea could work: a dog with the Labrador's gentle, steady nature for guiding, and a coat the family could live with.",
    "The name Labradoodle was partly a sales trick. Wally Conron's first crossbred puppies needed families to look after them while they grew up, but nobody wanted to take in a crossbreed. So he gave them a catchy name and told people there was an exciting new dog. Suddenly everyone wanted one. He went on to breed 31 Labradoodles for guide-dog work, and most of them became guide dogs.",
    "The man who bred the first Labradoodles later said it was his biggest regret. In 2019 Wally Conron said he felt he had opened a Pandora's box, because the Labradoodle's fame led many breeders to cross dogs for money rather than for health and good temper. He worried about Labradoodles with painful hip and elbow problems, and wished people would take more care.",
    "The word Labradoodle is British, and older than most people think. In 1955 Donald Campbell, who set world speed records on water in his boat Bluebird, wrote a book called Into the Water Barrier. In it he described his dog Maxie, which he had owned since 1949: a black Labrador and Poodle cross with thick, curly hair, which he called a Labradoodle.",
    "Many people buy a Labradoodle believing it will not cause allergies, but scientists have tested that idea. A 2012 study in the Netherlands measured a common dog allergen in the coats of hundreds of dogs, and Labradoodles and Poodles actually had more of it in their coats than Labradors did. The air in their owners' homes held no less either. Allergies come mostly from skin flakes and spit, not hair, so no dog is truly allergy-free.",
    "In the 1990s, breeders in Australia carried on from Wally Conron's first Labradoodles. Instead of always crossing a Labrador with a Poodle, they bred Labradoodles with each other and added a few other breeds, hoping to make the coat, size and temper more predictable. Their dogs became known as Australian Labradoodles, though they are still not recognised as a breed by any major kennel club.",
    "The Labradoodle is still a working dog as well as a pet. Guide Dogs Victoria, where the first Labradoodles were bred, no longer breeds them, but other guide and assistance dog groups in Australia and elsewhere still do. Both of the Labradoodle's parents are hard workers: the Labrador is the world's best-known guide dog, and the Poodle began as a retriever of ducks from water.",
  ],
  // Batch 7 (J18-265): 9 new, 11 in all.
  "Doberman Pinscher": [
    "Louis Dobermann, the man the Dobermann is named after, had a lot of jobs in the German town of Apolda in the 1800s: tax collector, night watchman, dogcatcher, and keeper of the town's dog pound. That last job was the useful one. With a pound full of dogs to choose from, he picked the strongest, bravest and cleverest to breed his guard dogs from.",
    "Nobody knows exactly which dogs Louis Dobermann mixed to make the Dobermann, because he kept no written records. Experts believe the Rottweiler, the German Pinscher, the Weimaraner and old German sheepdogs were among them, with perhaps some Greyhound for speed and Manchester Terrier for its sleek black-and-tan coat.",
    "When Louis Dobermann died in 1894, a distillery owner in Apolda called Otto Göller carried on his work. Göller kept around 80 Dobermanns at his home, founded the first Dobermann club in 1899, and was so proud of the breed that his distillery even made a drink called Real Dobermann Bitter.",
    "In Britain and most of the world the breed is called the Dobermann, with two n's, after Louis Dobermann. In America it is the Doberman Pinscher, with one n. Pinscher is a German word for a type of lively terrier-like dog, and most countries dropped it because the Dobermann grew into a much bigger guard dog that no longer looked like one.",
    "During the Second World War, a Doberman called Kurt served with the United States Marines on the Pacific island of Guam in 1944. He warned about 250 Marines that a large enemy force was ahead, but he was badly hurt in the fighting and became the first of the war dogs to die on Guam. A bronze statue of Kurt, called Always Faithful, now stands over the war dogs' graves there.",
    "In his 1994 book The Intelligence of Dogs, the psychologist Stanley Coren ranked breeds by how quickly they learned and obeyed commands. The Dobermann came fifth, behind only the Border Collie, the Poodle, the German Shepherd and the Golden Retriever. That quick brain is one reason Dobermanns have worked as police dogs, guard dogs and war dogs.",
    "Many people picture the Dobermann with tall, pointed ears and a very short tail, but those come from cutting them when the dog is a puppy. In Britain it is against the law to crop a dog's ears, and tail docking has been banned for pet dogs since 2007, so British Dobermanns keep their natural floppy ears and long tails.",
    "The town of Apolda in Germany is proud of the dog it gave the world. A statue of Louis Dobermann, who was born there in 1834 and died there in 1894, stands in the town. Apolda held its first dog market in 1863, and Dobermann's early guard dogs were shown there long before the breed first appeared at a proper dog show in the 1890s.",
    "A Dobermann's short, smooth coat comes in black, blue, fawn or red, always with rust-coloured markings on the face, chest and legs. That sleek coat helps it look powerful and alert, which was the point: Louis Dobermann wanted a dog whose looks alone would make anyone think twice before causing trouble.",
  ],
  // Batch 8 (J18-266): 8 new, 10 in all.
  "Miniature Schnauzer": [
    "The first recorded Miniature Schnauzer was a black female called Findel, in Germany in 1888. The breed was first shown as a breed of its own in 1899. German farmers wanted a smaller version of their Standard Schnauzer: a tough, clever little ratter that could keep barns and stables free of rats and mice while living happily alongside the farm family.",
    "Nobody wrote down exactly how the Miniature Schnauzer was made, but most experts think German breeders crossed small Standard Schnauzers with smaller breeds such as the Affenpinscher, and perhaps the Poodle and the Miniature Pinscher. At first the little dogs were not even called Schnauzers: they were known as Wire-haired Pinschers.",
    "The Miniature Schnauzer is named after its face. In German, schnauze means snout, and schnauz means a big bushy moustache, like a walrus's. The name seems to have stuck after a wire-haired dog called Schnauzer won its class at a dog show in Hanover in 1879, and the Miniature Schnauzer's bristly beard and eyebrows still show why.",
    "The Miniature Schnauzer is the smallest of three Schnauzer breeds. The Standard Schnauzer is the oldest and the original, the Miniature was bred down from it to catch rats, and the Giant Schnauzer was bred up from it in Bavaria to help drive cattle. All three share the same whiskery face and wiry coat.",
    "Where a Miniature Schnauzer is shown depends on the country. In America it is judged with the terriers, but in Britain, Australia and New Zealand it is in the Utility group. Experts point out it is not really a terrier at all: it does not come from the British terriers and does not have a typical terrier's temper, coat or head.",
    "A Miniature Schnauzer's most famous colour is salt and pepper, a grey made of hairs banded in black and white. It can also be black and silver or solid black. Pure white and patched Miniature Schnauzers are bred too, but not every kennel club accepts those colours.",
    "People often say the Miniature Schnauzer's ancestors appear in old art. The painter Albrecht Dürer drew a scruffy dog that looks like a Schnauzer around 1500. But a famous statue in Stuttgart of a night watchman with a Schnauzer at his feet, dated 1620, turns out to be no proof at all: its sculptor was born in 1853.",
    "Miniature Schnauzers first arrived in the United States in 1925, and the American Kennel Club recognised the breed the following year. Many people believe almost every pedigree Miniature Schnauzer in America goes back to the handful of dogs imported in those first years. Today it is one of the most popular breeds there.",
  ],
  // Batch 9 (J18-267): 8 new, 10 in all.
  Lurcher: [
    "The word Lurcher was first written down with its dog meaning in 1668. It probably comes from an old verb, to lurch, a form of lurk, meaning to lurk about or to steal. Many people also say it comes from the Romani word lur, meaning thief. Either way, the name suits a dog that was famous for sneaking off with the rich man's rabbits.",
    "For centuries the Lurcher was known as the poacher's dog. From 1389 until 1831, English law let only people who owned enough land keep dogs for hunting. Poor families who hunted on someone else's land needed a dog that was fast, clever and quiet, and a Lurcher could slip out at night and bring home a rabbit or hare for the pot.",
    "The story goes that poachers crossed Greyhounds with scruffy farm dogs so that a Lurcher would not look like a Greyhound, the dog of the rich, and would not attract a gamekeeper's attention. Historians point out there is little written proof of this, but the idea of the Lurcher as the ordinary family's hunting dog has stuck.",
    "The most popular Lurcher of all is a Greyhound crossed with a Collie. The Greyhound gives it speed, and the sheepdog gives it brains and a willingness to listen, which a Greyhound on its own is not famous for. Terriers, Whippets, Deerhounds and Salukis have all gone into Lurchers too, depending on what each owner wanted the dog to do.",
    "Gypsy and Traveller families in Britain and Ireland have kept Lurchers for hundreds of years, as hunting dogs and as companions on the road. Many of them prized a smooth-coated Lurcher that was mostly Greyhound, because it could run all day, and looked down on dogs with too little sighthound in them.",
    "A Lurcher can be almost any size or colour. Because it is a cross rather than a breed, one can be as small as a Whippet and another as big as a Deerhound, though most are about the size of a Greyhound. Coats range from sleek and smooth to rough and wiry, depending on the dogs in its family.",
    "The Lurcher differs from its cousin the Longdog in one simple way. A Longdog is a cross of two sighthounds, such as a Greyhound and a Saluki. A Lurcher is a sighthound crossed with a different kind of dog, such as a Collie or a terrier. Neither is recognised as a breed by the Kennel Club, and neither has an official standard.",
    "Hare coursing, the old sport of racing dogs after hares, is now against the law in England, Scotland and Wales. So most Lurchers today are family pets rather than hunters. They are known as gentle, easy-going dogs indoors, happy to sprint round a field and then curl up on the sofa for the rest of the day.",
  ],
  // Batch 10 (J18-268): 8 new, 10 in all.
  Cockapoo: [
    "The Cockapoo is one of the oldest designer dogs of all. The first Cockapoos were recorded in the USA in the 1950s, probably by accident, when pet Cocker Spaniels and Poodles met. People liked the puppies so much that by the 1960s breeders were crossing the two on purpose, decades before the Labradoodle made Poodle crosses famous.",
    "Disney may have helped create the Cockapoo. After the 1955 film Lady and the Tramp, whose heroine Lady is a Cocker Spaniel, Cocker Spaniels became hugely popular in America. Many families wanted the Cocker's sweet nature with the Poodle's low-shedding coat, and breeders were happy to cross the two to make Cockapoos.",
    "There are two kinds of Cocker Spaniel, and so two kinds of Cockapoo. In America most Cockapoos have an American Cocker Spaniel parent, a smaller dog with a rounder head. In Britain the Cockapoo's Cocker parent is usually the English Cocker Spaniel, which is a separate breed. Some people call that cross an English Cockapoo.",
    "The Cockapoo goes by several names. In Britain it is often spelled Cockerpoo, some call it the Cock-a-Poo, and in Australia and New Zealand it is known as the Spoodle. All of them mean the same thing: a dog with one Cocker Spaniel parent and one Poodle parent, or Cockapoo parents of its own.",
    "Cockapoos arrived in Britain in the late 1990s and early 2000s, and demand shot up during the Covid lockdowns, when many families wanted a dog at home. Between 2019 and 2020 the average price of a Cockapoo puppy in the UK rose by 168%, and in 2022 it was one of the most expensive kinds of dog in the country, at an average of about £1,336.",
    "Not every Cockapoo is a sofa dog. The Cocker Spaniel side was bred to flush birds for hunters, and in Britain some Cockapoos, often called Cockerpoos there, now work as gundogs on shoots, finding and fetching birds. Country magazines that once laughed at the cross as a passing fad have started taking them seriously.",
    "Cockapoos come in different sizes, set mostly by which size of Poodle was the parent. Toy Cockapoos weigh about 3 to 5kg and Miniature Cockapoos about 6 to 8kg, while those with a Standard Poodle parent are bigger still. That is why two Cockapoos out on a walk can look quite different.",
    "Cockapoo fans in America set up clubs in the late 1990s and early 2000s, including the Cockapoo Club of America and the American Cockapoo Club. They have written a standard for how a Cockapoo should look and behave, and hope the American Kennel Club will one day recognise it as a breed. For now, no major kennel club does.",
  ],
  // Batch 11 (J18-270): 8 new, 10 in all.
  "Staffordshire Bull Terrier": [
    "The Staffordshire Bull Terrier comes from the Black Country, the busy industrial area around Birmingham and south Staffordshire. Its bull-and-terrier ancestors were bred for cruel sports such as dog fighting and rat-killing contests. Bull-baiting was banned in 1835 and dog fighting was made illegal too, and over time the Staffie became what it is today: a loyal family pet.",
    "The Staffordshire Bull Terrier was recognised by the Kennel Club on 25 May 1935. The club that asked for it began at a pub, the Cross Guns in Cradley Heath, run by Joe and Lil Mallen. Before then the dogs had no written pedigrees and went by names such as bull and terrier, or half-and-half.",
    "The very first Staffordshire Bull Terrier club was a tiny affair. Only nine or ten people came to its first meeting at the Cross Guns pub in Cradley Heath in 1935, and the landlady, Lil Mallen, even lent one of them the five shillings he needed to join. Its first show was held just nine weeks later.",
    "In the 1880s, the regimental Staffordshire Bull Terrier was travelling by train in Egypt with his regiment, the South Staffordshire Regiment. He jumped from the moving train and was given up for lost, but several days later he limped into the regiment's new camp, about 200 miles away. He had followed them all the way.",
    "The regiments of Staffordshire have kept a Staffordshire Bull Terrier as their mascot since the 1800s, and every one is called Watchman. By 2018 there had been six Watchmen. Each is given by the people of Burton upon Trent, comes from a family of dogs bred in Cannock, and still marches at parades and ceremonies.",
    "The Staffordshire Bull Terrier is sometimes nicknamed the nanny dog, because Staffies are famous for loving children, and the Kennel Club recommends the breed for families. But experts stress that the nickname should not be taken literally: no dog, however gentle, should ever be left alone with young children.",
    "Many people think the Staffordshire Bull Terrier is a banned breed, but it is not. Britain's Dangerous Dogs Act bans the Pit Bull and a few other types, and stocky Staffies are sometimes mistaken for them. A well-bred, well-raised Staffie is legal to own and is usually a friendly, people-loving dog.",
    "The Staffordshire Bull Terrier has been voted Britain's favourite dog in an ITV television poll, yet Staffies are also one of the most common dogs in rescue centres. Battersea once took in about 2,000 in a single year, and they wait longer for a new home than most dogs, often because of their unfair tough-guy image.",
  ],
  // Batch 12 (J18-271): 8 new, 10 in all.
  "Irish Setter": [
    "In Irish, the Irish Setter is called Madra Rua, which means red dog, and it is also known as the Red Setter. In the 1800s people sometimes called it the Irish Spaniel, because setters began as spaniels. An English farming book of 1616 already describes a sort of land spaniel called a setter, used to find game birds.",
    "The first Irish Setters were not all red. Most were red and white, which made them easier for hunters to spot in the fields. Then, in the early 1800s, the Earl of Enniskillen declared that he would keep nothing but solid red setters in his kennels, red became the fashion, and the red Irish Setter took over.",
    "Nearly every Irish Setter alive today goes back to one dog, Champion Palmerston, born in Ireland in 1862. His owner thought his long, narrow head made him look too fine for hunting and ordered him to be drowned. A dog lover saved him instead, and Palmerston became a star of the show ring and the father of the modern breed.",
    "After Champion Palmerston's success at dog shows, Irish Setters split into two types. Show Irish Setters are bigger and heavier, with thicker, longer coats that look spectacular in the ring. Field Irish Setters, bred for hunting, are lighter, leaner and quicker. Both belong to the same breed.",
    "When solid red became the fashion, the old Irish Red and White Setter nearly disappeared. A handful of people in remote parts of Ireland kept it going, including a clergyman, Rev. Noble Huston, who recorded his puppies in his parish register. Thanks to them the Irish Red and White Setter survived as a separate breed, cousin to today's red Irish Setter.",
    "Two Irish Setters have lived in the White House. President Harry Truman had one called Mike, and President Richard Nixon had one called King Timahoe, named after a village in County Kildare in Ireland. The breed's glossy red coat made it a favourite with photographers.",
    "Irish Setters were among the first dogs to star at British dog shows. In 1860, a show in Birmingham gave Irish Setters their very own section, one of the first times the breed was judged on its own. In Ireland they were working dogs, galloping back and forth across the moors and wetlands ahead of the hunter to find game birds.",
    "An Irish Setter's rich red coat comes from the same kind of gene that gives many people red hair. The dog has two copies of a version of the gene that turns dark colour off in its coat, leaving only red. That is why two red Irish Setters always have red puppies, and why the breed never throws a black or brown one.",
  ],
  // Batch 13 (J18-272): 7 new, 10 in all.
  "Italian Greyhound": [
    "King Frederick the Great of Prussia loved his Italian Greyhounds so much that he asked to be buried beside them at Sanssouci, his summer palace. His wish was ignored when he died in 1786, and for two centuries he lay elsewhere. Finally, in 1991, his body was moved to Sanssouci and buried near the graves of eleven of his greyhounds.",
    "Frederick the Great's Italian Greyhounds lived like royalty. His favourite, Biche, was painted by the court painter wearing a collar with the king's name on it, and his dogs went with him on his military campaigns. The servant who looked after them was told to address each dog politely, with the formal German word Sie, as if speaking to a lady or gentleman.",
    "The Italian Greyhound was a favourite of British royalty for centuries. Anne of Denmark, the wife of King James I, kept them in the early 1600s, and the breed was known in England by the reign of Charles I. Later, Queen Victoria kept Italian Greyhounds too, which helped make the little hound fashionable in Victorian Britain.",
    "Myth: The Cave canem, beware of the dog, signs in the doorways of Pompeii were warnings not to tread on tiny Italian Greyhounds. The truth: there is no evidence for this charming story. The most famous Cave canem mosaic, in Pompeii's House of the Tragic Poet, shows a big, snarling guard dog on a chain, not a little hound.",
    "The Italian Greyhound nearly vanished in the 1900s. The upheaval of the two world wars left so few in Europe that breeders had to work hard to build the numbers back up, while American breeders brought dogs over from Europe to keep the breed going there. The Italian Greyhound Club in Britain, founded in 1900, helped keep the breed going.",
    "A story is told that in the 1800s an African chief was so charmed by an Italian Greyhound that he offered 200 cattle in exchange for a single dog. Whether or not it happened exactly like that, it shows how rare and precious these little hounds once seemed to people who had never seen anything like them.",
    "The Italian Greyhound gets its name from Renaissance Italy, where the little hound was a favourite of rich and noble families such as the Medici. Small, slender hounds much like it appear in paintings by famous artists over hundreds of years, sitting beside their owners or curled up at their feet.",
  ],
  // Batch 14 (J18-274): 7 new, 10 in all.
  "Boston Terrier": [
    "Nearly every Boston Terrier goes back to one dog from England. Around 1870, a Boston man called Robert Hooper bought a dog named Judge, a cross of a Bulldog and an English White Terrier, a British breed that is now extinct. Judge was a dark brindle dog with a white stripe down his face, and he became the father of the Boston Terrier.",
    "In 1893 the Boston Terrier became the first breed made in the United States to be recognised by the American Kennel Club. Its fans had first called their club the American Bull Terrier Club, and the dogs were nicknamed roundheads, before the name was changed to honour the city of Boston.",
    "The Boston Terrier is nicknamed the American Gentleman. Partly that is its neat black-and-white coat, which looks like a smart tuxedo, and partly its polite, friendly manners. Its coat can be black, brindle or seal, a black with a reddish shine, but always with white markings.",
    "The city of Boston is proud of its dog. In 1979 Massachusetts made the Boston Terrier its official state dog, and Boston University has had a Boston Terrier called Rhett as its mascot since 1922.",
    "The deaf and blind American writer Helen Keller owned a Boston Terrier called Sir Thomas, nicknamed Phiz, a present from her classmates at Radcliffe College. The dog was said to be fussy about who he made friends with, but he took to Helen Keller straight away.",
    "The first Boston Terriers were much bigger and heavier than today's, with longer snouts, and some were used for fighting. Breeders made them smaller and flatter-faced to be friendly pets. That flat face gives the Boston Terrier its sweet look, but it can also make breathing harder, so a good breeder chooses dogs that breathe easily.",
    "Despite its name, the Boston Terrier is not really a terrier at all: it was never bred to dig after foxes or rats. In 1923, when the American Kennel Club set up a new group called Non-Sporting, for dogs that did not fit the hunting, herding or terrier groups, the Boston Terrier was the first breed put in it.",
  ],
  // Batch 15 (J18-275): 7 new, 10 in all.
  Pomeranian: [
    "The Pomeranian is named after Pomerania, a region on the Baltic coast that is now part of northern Poland and eastern Germany. The name comes from old Slavic words, po more, meaning land by the sea. The Pomeranian's ancestors there were much bigger spitz dogs with thick coats and curly tails, used for work such as herding and guarding.",
    "Pomeranians first came to Britain with royalty. In 1767 Queen Charlotte, the German-born wife of King George III, brought two with her, called Phebe and Mercury, and the painter Thomas Gainsborough painted them. They look like big, fluffy spitz dogs, and are thought to have weighed as much as 14 to 23kg, many times the size of a Pomeranian today.",
    "The Pomeranian has shrunk enormously. When the Kennel Club began in 1873, the first ones shown weighed about 8kg. Queen Victoria loved the smaller ones, and during her lifetime the breed's size was halved. Today a Pomeranian usually weighs only about 2 to 3kg, small enough to sit in a large handbag.",
    "Queen Victoria kept as many as 35 Pomeranians in her kennels. Her last favourite was a little white Pomeranian called Turi. When she was dying at Osborne House on the Isle of Wight in January 1901, she asked for Turi to be brought to her, and he was beside her bed at the end.",
    "When the Titanic sank in 1912, only a few dogs survived, and two of them were Pomeranians. Being so small, they could be carried by their owners into the lifeboats, while most of the other dogs on board were lost.",
    "The Pomeranian comes in a huge range of colours, more than most other breeds: orange, cream, black, white, chocolate, blue, sable and many mixtures. Queen Victoria's famous Marco was a red sable, and orange and red Pomeranians are still among the best known today.",
    "Myth: The artist Michelangelo had a pet Pomeranian that sat on a silk cushion and watched him paint the Sistine Chapel. The truth: there is no evidence for this story. The Pomeranian as we know it was only developed in Britain in the 1800s, hundreds of years after Michelangelo, who died in 1564.",
  ],
  // Batch 16 (J18-276): 7 new, 10 in all.
  "Yorkshire Terrier": [
    "Almost every Yorkshire Terrier alive today goes back to one dog, Huddersfield Ben. He was born in Huddersfield in 1865, bred by a draper called William Eastwood, and later owned by Mary Ann Foster of Bradford. Ben won 74 prizes at dog shows and in ratting contests, and so many breeders wanted his puppies that he became known as the father of the breed.",
    "Huddersfield Ben, the father of the Yorkshire Terrier, died young: in 1871, aged just six, he was run over by a horse-drawn carriage. His body was stuffed and put on show in a glass case. It was last seen on the mantelpiece of a pub in the north of England between the two world wars, and nobody knows where it is now.",
    "The Yorkshire Terrier has Scottish roots. Early Yorkies were called Broken-haired Terriers, and Huddersfield Ben's family tree includes Paisley Terriers, small silky terriers from Scotland. Many Scottish workers moved south to the busy mills of Yorkshire, and their little terriers came with them.",
    "The smallest dog ever recorded was a Yorkshire Terrier called Sylvia, owned by Arthur Marples of Blackburn. When she died in 1945, aged about two, she stood just 6.3cm tall at the shoulder and weighed about 113g, roughly the weight of an apple. She was small enough to fit in a matchbox.",
    "In 1997 a Yorkshire Terrier called Champion Ozmilion Mystification became the first Yorkie ever to win Best in Show at Crufts, the world's biggest dog show. His win, over thousands of much bigger dogs, showed that a tiny terrier from the mill towns could beat the best of them.",
    "A Yorkshire Terrier puppy is born black with tan markings, and its coat slowly changes colour as it grows up, usually turning a steel blue and tan. The adult coat is made of fine, silky hair that keeps on growing, more like human hair than fur. That is why show Yorkies have hair down to the floor, and why many pet Yorkies wear a bow to keep it out of their eyes.",
    "The Yorkshire Terrier started out bigger than it is now. Huddersfield Ben weighed about 5kg, but his puppies were often under 3kg, and breeders kept choosing the smallest. Today a Yorkshire Terrier weighs no more than about 3kg, but it still has the brave, busy nature of the ratters it came from.",
  ],
  // Batch 17 (J18-277): 7 new, 10 in all.
  "Border Terrier": [
    "The Border Terrier comes from the Border country, the wild, hilly land on both sides of the line between England and Scotland, around the Cheviot Hills. The weather there is often cold, wet and windy, so the dogs needed to be tough. Shepherds, farmers and huntsmen kept them to drive out foxes that had gone to ground.",
    "Before it was called the Border Terrier, the breed had other names taken from the Northumberland valleys where it lived, such as the Coquetdale Terrier and the Reedwater Terrier. By about 1880 it had become known as the Border Terrier, after the Border Foxhounds, the local hunt it worked with.",
    "Two Border families made the Border Terrier. The Robsons and the Dodds ran the Border Foxhounds and kept the best terriers to work with them, passing their dogs down from father to son. Years later, the grandsons of the two families were the ones who asked the Kennel Club to recognise the breed.",
    "The first Border Terrier ever registered with the Kennel Club was a dog called The Moss Trooper, in 1913. At first the Kennel Club turned the breed down, in 1914, but it was finally recognised in 1920. That June, fans met in Hawick in the Scottish Borders to form the Border Terrier Club, and its first standard was written by Jacob Robson and John Dodd.",
    "The Border Terrier's breed standard describes its head as being like an otter's: broad and flat on top, with a short, strong muzzle. Along with its small V-shaped ears that fold forward and its bright, keen expression, that otter head is what makes a Border Terrier easy to recognise.",
    "In about 1896, the huntsman Jacob Robson wrote that the best Border Terriers weighed about 15 to 18 pounds, roughly 7 to 8kg. Anything bigger, he said, could not follow its fox underground so well. The breed's wiry, weatherproof coat kept it dry in the rain and wind of the hills.",
    "A Border Terrier's coat comes in a few set colours: red, wheaten, grizzle and tan, or blue and tan. Grizzle means a mix of dark and light hairs, which gives a slightly grey, pepper-and-salt look. The rough outer coat is usually tidied by hand-stripping, pulling out the old hairs, rather than clipping.",
  ],
  // Batch 18 (J18-278): 6 new, 10 in all.
  Papillon: [
    "The Papillon only got its butterfly name in the late 1800s, when a type with big, upright, fringed ears became fashionable. People said the ears looked like a butterfly's open wings, and the white stripe, or blaze, down the middle of the Papillon's face looked like the butterfly's body. Before that, it was simply called a dwarf spaniel.",
    "Not every Papillon has butterfly ears. The older type, with soft drooping ears, is called the Phalène, French for moth, because a resting moth folds its wings down. Both kinds can be born in the same litter of Papillon puppies. In some countries they are counted as two breeds, in others as two versions of one.",
    "Legend: Marie Antoinette, Queen of France, walked to the guillotine in 1793 clutching her little Papillon, and the dog was saved and cared for in a Paris house still called the Papillon House. What we know: it is a famous story, but historians think it is almost certainly untrue. Papillon experts themselves point out that she would hardly have taken a beloved dog to her execution.",
    "The Papillon was a favourite of the French royal court. Madame de Pompadour, the powerful friend of King Louis XV, is said to have kept two, called Inès and Mimi. Little dwarf spaniels were even sent to the French court from Italy and Spain, travelling all the way on the backs of mules.",
    "In his 1994 book The Intelligence of Dogs, the psychologist Stanley Coren ranked the Papillon eighth of all the breeds he studied for learning and obeying commands. It was the only toy breed in his top ten, beating many far bigger working dogs, and Papillons today are stars at dog agility.",
    "The Papillon was once also called the Squirrel Spaniel, because its long, feathered tail curls up over its back like a squirrel's. The breed was slow to catch on in Britain, but the Papillon Club was formed in England in 1924, and today these tiny spaniels are popular all over the country.",
  ],
  // Batch 19 (J18-279): 6 new, 10 in all.
  Beagle: [
    "Long ago there were Beagles so small they were called Glove Beagles, because they could sit on a hunter's glove. Kings Edward II and Henry VII kept packs of them. Queen Elizabeth I had Pocket Beagles, only 20 to 23cm tall, which rode along in saddlebags on the hunt and were let loose to chase through thick bushes where bigger hounds could not go.",
    "Queen Elizabeth I called her little Pocket Beagles her singing Beagles, because of their musical, baying voices. She is said to have entertained guests at royal dinners by letting the tiny hounds trot about the table among the plates and cups.",
    "The word Beagle first appears in English writing around 1475, but nobody knows for certain where it comes from. For hundreds of years it was used for almost any small hunting hound, and those early Beagles looked quite different from the Beagle we know today.",
    "The modern Beagle began with a pack kept by the Reverend Phillip Honeywood in Essex in the 1830s. His Beagles were chosen for their hunting skill rather than their looks, and they were small and pure white. A later breeder, Thomas Johnson, made them more alike in looks, and bred both smooth-coated and rough-coated Beagles. The rough-coated kind has since died out.",
    "The famous ship HMS Beagle was named after the dog. On its voyage from 1831 to 1836 it carried the young naturalist Charles Darwin, whose discoveries led to his ideas about evolution. In 2003 a British spacecraft sent to land on Mars was named Beagle 2 after the ship, and so, in the end, after the Beagle.",
    "A Beagle's nose is so good that Beagles are used around the world as detection dogs at airports, sniffing travellers' bags for food, plants and meat that are not allowed into the country because they could carry pests or diseases. Their small size and friendly nature mean they do not frighten passengers.",
  ],
  // Batch 20 (J18-281): 6 new, 10 in all.
  "Shih Tzu": [
    "The Shih Tzu is sometimes called the chrysanthemum dog, because the hair on its face grows out in every direction, like the petals of a chrysanthemum flower. Its name comes from the Chinese word for lion, and it was bred to look like the little lions of Chinese and Buddhist art.",
    "In the Chinese emperor's palace, Shih Tzus were bred by court servants who competed to produce the most beautiful dog. If the emperor liked one, its picture was painted on the palace hangings and its breeder was said to have made the book. As a reward, he could be given the income from farmland growing rice.",
    "The Shih Tzu owes a great deal to the Empress Dowager Cixi, who ruled China in the late 1800s. In her palace, the Forbidden City in Beijing, she kept kennels of Pugs, Pekingese and Shih Tzus, and oversaw their breeding. After she died in 1908 her kennels were broken up, and careful breeding of the Shih Tzu in China faded away.",
    "Every Shih Tzu in the world today descends from just 14 dogs. After the Communist revolution in China, the little palace dogs were seen as symbols of royal power, and the breed is believed to have died out there. Luckily, a handful had already been taken to England and Norway, and one Pekingese was later added, making 14 in all.",
    "The first Shih Tzus came to England with Lady Brownrigg, who brought them back from China around 1930. At first the Kennel Club muddled them up with a Tibetan breed and called them Apsos. In 1935 the Shih Tzu Club in England wrote the breed's first European standard, and the dogs were officially named Shih Tzu.",
    "In 1952 a newcomer to the breed in England crossed a Shih Tzu with a Pekingese without telling anyone first, and when it came out it caused an uproar among breeders. But with so few Shih Tzus in the world, the new blood is now thought to have helped keep the breed healthier.",
  ],
  // Batch 21 (J18-283): 5 new, 12 in all.
  Whippet: [
    "The Whippet was called the poor man's racehorse. In the coal-mining and mill towns of northern England in the 1800s, working families raced their Whippets in rag races: each owner stood at the finish line waving a rag, and the dogs sprinted flat out towards them. Until the First World War, Whippet racing was more popular than Greyhound racing.",
    "Before it was called the Whippet, the breed was nicknamed the snap dog, for the speed with which it snapped up rabbits. For a long time the word whippet was used for any quick little dog. The name may come from an old word, wappet, meaning a small, yapping dog.",
    "In a mining family, the Whippet was much more than a pet. It could win prize money at the races and catch a rabbit for the family's dinner, so it was looked after like a treasure. It was said that no racehorse got more care than a miner's Whippet, and it was not unusual for one to share its owner's meals and even his pillow.",
    "The Whippet Club, set up in 1899, was the first Whippet breed club in the world. The Whippet had been recognised by the Kennel Club as a breed of its own only a few years before. Today there are eleven Whippet breed clubs in the UK, and the Whippet is one of the most popular hounds in the country.",
    "A racing Whippet can reach about 56km/h (35mph), and Whippets have been timed running 200 yards in under 12 seconds. For its size, it is one of the fastest dogs there is. Yet at home the Whippet is famously calm and gentle, and very fond of a warm, soft bed.",
  ],
  // Batch 22 (J18-284): 6 new, 10 in all.
  "French Bulldog": [
    "The French Bulldog's first name was the Bouledogue Français. In French, boule means ball and dogue means mastiff, so the name describes a round little mastiff-type dog. The dogs had come from England, but it was in France that they got their name and became a breed of their own.",
    "In 1800s Paris, the French Bulldog was the dog of ordinary working people: butchers, café owners and shopkeepers. English breeders did a busy trade selling their smallest bulldogs across the Channel, and before long fashionable Parisians wanted a French Bulldog too.",
    "The most famous French Bulldog in art was Bouboule, who belonged to Madame Palmyre, owner of a Paris café called La Souris, meaning The Mouse. The painter Henri de Toulouse-Lautrec painted Bouboule in 1897. The little dog was famous for weeing on the ankles of any customer who tried to stroke him.",
    "The French Bulldog's bat ears were won in a row. At a big American dog show in 1897, the judge would only choose French Bulldogs with folded rose ears, like an English Bulldog's. Their American owners were furious, set up the world's first French Bulldog club, and insisted on the tall bat ears, which became the breed's trademark.",
    "There was one French Bulldog on the Titanic, a dog called Gamin de Pycombe. A young banker, Robert Daniel, had just bought him in England for the large sum of £150. Robert Daniel survived the sinking in 1912, but his French Bulldog did not.",
    "In Britain, the Kennel Club first recognised the breed in the early 1900s under its French name, the Bouledogue Français. In 1912 the name was changed to the French Bulldog, the name we use today. More than a century later, the French Bulldog became one of the most popular dogs in Britain.",
  ],
  // Batch 23 (J18-285): 5 new, 11 in all.
  Weimaraner: [
    "The Weimaraner was created at the court of Grand Duke Karl August of Weimar, in Germany, in the early 1800s. He was a keen hunter who wanted a dog brave enough for big game such as bears, boars and wolves. The Weimaraner's famous grey colour was not planned: it seems to have simply turned up along the way.",
    "The Weimaraner is nicknamed the Grey Ghost, for its sleek silver-grey coat and the silent way it moves through woods and fields. Its coat can be anything from mouse-grey to silver. Weimaraner puppies are even born with faint stripes, which fade within a few days.",
    "For a long time the Weimaraner was a closely guarded secret. From 1897, the German Weimaraner Club allowed nobody to buy one unless they joined the club, and breeding was strictly controlled. If a Weimaraner was ever sold to someone outside the club, it was secretly neutered first, so the buyer could never breed from it.",
    "In 1928 an American hunter, Howard Knight, was allowed to join the German Weimaraner Club, the first outsider ever accepted. He promised to protect the breed, but the club still sent him two neutered Weimaraners. He kept trying, and in 1938 he finally received dogs he could breed from, which began the breed in America.",
    "After the Second World War, soldiers brought Weimaraners home from Germany, and the breed at last spread around the world. The Kennel Club in Britain recognised the Weimaraner in 1955. In America it became a star when President Dwight D. Eisenhower took his Weimaraner, Heidi, to live in the White House.",
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
  // Batch 4 (J18-257): Maltipoo.
  { match: "The Maltipoo has also been called the Moodle", q: "Which of these has also been used as a name for the Maltipoo?", options: ["The Moodle", "The Moopoo", "The Maltbone"], answer: 0, evidence: "the Moodle" },
  { match: "On a Greek vase from about 500 BC, found at Vulci", q: "Which old name for Malta was written on the Greek vase, as melitaie?", options: ["Melita", "Mellow", "Molten"], answer: 0, evidence: "from Melita" },
  { match: "The Greek thinker Aristotle wrote about the Maltipoo's", q: "Which Greek thinker wrote about Melitaean dogs around 370 BC?", options: ["Aristotle", "Archimedes", "Homer"], answer: 0, evidence: "Aristotle" },
  { match: "the poet Martial wrote a poem about a little white lapdog called Issa", q: "What was the name of Publius's little white lapdog?", options: ["Issa", "Fido", "Rex"], answer: 0, evidence: "called Issa" },
  { match: "The people of Sybaris, an ancient Greek city", q: "Where did the people of Sybaris even take their lapdogs?", options: ["To the gym", "To the moon", "To school"], answer: 0, evidence: "even to the gym" },
  // Batch 5 (J18-258): Goldendoodle.
  { match: "In Australia and New Zealand the Goldendoodle is called the Groodle", q: "What is the Goldendoodle called in Australia?", options: ["The Groodle", "The Goldie", "The Kangadoodle"], answer: 0, evidence: "called the Groodle" },
  { match: "The Goldendoodle's Golden Retriever side began with a single yellow puppy", q: "Who did Lord Tweedmouth buy Nous from?", options: ["A cobbler in Brighton", "A king in London", "A farmer in Wales"], answer: 0, evidence: "cobbler in Brighton" },
  { match: "For years people told a story that the Golden Retriever", q: "What did people once wrongly believe the first Golden Retrievers were?", options: ["Russian circus dogs", "Royal guard dogs", "Arctic sled dogs"], answer: 0, evidence: "Russian circus dogs" },
  { match: "Golden Retrievers, one half of the Goldendoodle, go back to their birthplace", q: "How many Golden Retrievers were counted at Guisachan in 2023?", options: ["466", "46", "4,660"], answer: 0, evidence: "466" },
  { match: "The Poodle side of the Goldendoodle once hunted for buried treasure", q: "What did small Poodle-type dogs sniff out in Victorian England and France?", options: ["Truffles", "Diamonds", "Fossils"], answer: 0, evidence: "sniff out truffles" },
  // Batch 6 (J18-261): Labradoodle.
  { match: "began with a letter. In the 1980s Wally Conron", q: "How many Standard Poodles did Wally Conron try as guide dogs?", options: ["33", "3", "300"], answer: 0, evidence: "33 Standard Poodles" },
  { match: "The first planned Labradoodle litter was born in Australia in 1989", q: "Which puppy from the first litter passed the allergy test?", options: ["Sultan", "Simon", "Sheik"], answer: 0, evidence: "only Sultan passed" },
  { match: "The name Labradoodle was partly a sales trick", q: "Why did Wally Conron give his puppies a catchy name?", options: ["Nobody wanted to take in a crossbreed", "To win a prize", "A king asked him to"], answer: 0, evidence: "nobody wanted to take in a crossbreed" },
  { match: "The word Labradoodle is British, and older than most people think", q: "Who called his dog a Labradoodle in a 1955 book?", options: ["Donald Campbell", "Roald Dahl", "Enid Blyton"], answer: 0, evidence: "Donald Campbell" },
  { match: "A 2012 study in the Netherlands measured a common dog allergen", q: "Where do dog allergies mostly come from?", options: ["Skin flakes and spit", "Hair", "Paws"], answer: 0, evidence: "skin flakes and spit" },
  /* QUIZ BATCH (J18-261, brief 4, 27 September 2026): questions on existing chum
     facts that had none. Each answer is in its fact (evidence). */
  { match: "Tudor London's bear gardens set mastiffs against bears", q: "When was bear-baiting with mastiffs finally banned?", options: ["1835", "1935", "1735"], answer: 0, evidence: "until 1835" },
  { match: "When the Romans invaded in 55 BC, they found the Britons", q: "How many Mastiffs were left in Britain at the end of the Second World War?", options: ["One", "Fifty", "Five hundred"], answer: 0, evidence: "only one Mastiff was left" },
  { match: "Zorba was an English Mastiff", q: "What record did Zorba the English Mastiff hold?", options: ["Heaviest and longest dog", "Fastest dog", "Loudest bark"], answer: 0, evidence: "heaviest and longest" },
  { match: "Giant George was a Great Dane", q: "What record did Giant George hold?", options: ["Tallest dog alive", "Oldest dog alive", "Fastest dog alive"], answer: 0, evidence: "tallest dog alive" },
  { match: "The word 'terrier' comes from the Latin", q: "Which Latin word does 'terrier' come from?", options: ["Terra, meaning earth", "Terror, meaning fear", "Tiara, meaning crown"], answer: 0, evidence: "'terra', meaning earth" },
  { match: "In Tim Burton's 2012 film Frankenweenie", q: "What is the name of Victor's Bull Terrier in Frankenweenie?", options: ["Sparky", "Spot", "Sparkle"], answer: 0, evidence: "Sparky" },
  { match: "The Doberman was created in Germany in the late 1800s by a tax collector", q: "Who created the Doberman?", options: ["A tax collector", "A baker", "A sailor"], answer: 0, evidence: "tax collector" },
  { match: "In the 1992 film Beethoven", q: "What kind of dog is Beethoven in the 1992 film?", options: ["A Saint Bernard", "A Great Dane", "A Poodle"], answer: 0, evidence: "Saint Bernard puppy" },
  { match: "Man Ray was a Weimaraner photographed", q: "Which artist photographed Man Ray the Weimaraner?", options: ["William Wegman", "Pablo Picasso", "David Hockney"], answer: 0, evidence: "William Wegman" },
  { match: "Carriage dogs ran alongside the horses and guarded the coach", q: "What job was the Dalmatian made for?", options: ["Running beside carriages", "Herding sheep", "Pulling sleds"], answer: 0, evidence: "ran alongside the horses" },
  { match: "In the 2000 film 102 Dalmatians, Oddball", q: "What is special about Oddball in 102 Dalmatians?", options: ["She has no spots", "She has blue spots", "She can fly"], answer: 0, evidence: "without any spots" },
  { match: "The butchers of Rottweil kept cattle dogs", q: "Who kept the cattle dogs of Rottweil?", options: ["The butchers", "The bakers", "The monks"], answer: 0, evidence: "butchers of Rottweil" },
  { match: "An Old English Sheepdog has starred in the Dulux paint adverts", q: "Which adverts made the Old English Sheepdog famous?", options: ["Dulux paint", "Andrex toilet roll", "Churchill insurance"], answer: 0, evidence: "Dulux paint" },
  { match: "In December 1944, a shepherd called John Dagg", q: "Who did John Dagg and his sheepdog climb through the snow to reach?", options: ["The crew of a crashed bomber", "A lost king", "A stranded ship"], answer: 0, evidence: "crashed American bomber" },
  { match: "The word dog first appears in Old English as docga", q: "Which old word gave us the word hound?", options: ["Hund", "Hood", "Hunt"], answer: 0, evidence: "hund" },
  { match: "Droopy is a slow-talking, sad-faced Basset Hound", q: "When were the first Droopy cartoons made?", options: ["1943", "1993", "1843"], answer: 0, evidence: "1943" },
  { match: "Myth: Bulldogs' flat faces were bred for fighting bulls", q: "How did Bulldogs get their very flat faces?", options: ["Bred for their looks at dog shows", "From fighting bulls", "From swimming"], answer: 0, evidence: "bred for their looks" },
  { match: "Tillman was a real Bulldog from California", q: "What record did Tillman the Bulldog set?", options: ["Fastest dog on a skateboard", "Tallest dog", "Longest ears"], answer: 0, evidence: "fastest dog on a skateboard" },
  { match: "Legend: In Welsh folklore, fairies rode Corgis", q: "In Welsh folklore, who rode Corgis?", options: ["Fairies", "Knights", "Giants"], answer: 0, evidence: "fairies rode Corgis" },
  { match: "Master McGrath was an Irish Greyhound", q: "Which queen did Master McGrath meet?", options: ["Queen Victoria", "Queen Elizabeth I", "Queen Anne"], answer: 0, evidence: "Queen Victoria" },
  { match: "The medieval Greyhound was the noble hunting hound", q: "What did King John accept greyhounds as?", options: ["Payment of fines", "Crowns", "Wedding gifts"], answer: 0, evidence: "payment of fines" },
  { match: "Myth: Greyhounds need huge amounts of exercise", q: "What are Greyhounds nicknamed?", options: ["40-mile-an-hour couch potatoes", "Rocket dogs", "Lazy lightning"], answer: 0, evidence: "couch potatoes" },
  { match: "In 1974 a Whippet called Ashley ran onto the pitch", q: "What did Ashley the Whippet catch?", options: ["Flying discs", "Baseballs", "Fish"], answer: 0, evidence: "flying discs" },
  { match: "Myth: Huskies are part wolf", q: "Are Siberian Huskies part wolf?", options: ["Yes", "No"], answer: 1, evidence: "completely domestic dogs" },
  { match: "Tibetan monks bred small, long-coated lion dogs", q: "Who bred the small lion dogs behind the Shih Tzu?", options: ["Tibetan monks", "Roman soldiers", "Viking sailors"], answer: 0, evidence: "Tibetan monks" },
  { match: "Sergeant Stubby was a stray", q: "In which war did Sergeant Stubby serve?", options: ["The First World War", "The Second World War", "The English Civil War"], answer: 0, evidence: "First World War" },
  { match: "Myth: A special law lets Cavalier King Charles Spaniels into the Houses of Parliament", q: "Is there a law letting Cavaliers into the Houses of Parliament?", options: ["Yes", "No"], answer: 1, evidence: "There is no such law" },
  { match: "The Chukchi sled dogs were bred by", q: "Who bred the sled dogs behind the Siberian Husky?", options: ["The Chukchi people", "The Vikings", "The Romans"], answer: 0, evidence: "Chukchi people" },
  // Batch 7 (J18-265): Doberman.
  { match: "had a lot of jobs in the German town of Apolda", q: "Which of Louis Dobermann's jobs gave him lots of dogs to choose from?", options: ["Keeper of the dog pound", "Baker", "Circus ringmaster"], answer: 0, evidence: "keeper of the town's dog pound" },
  { match: "a distillery owner in Apolda called Otto Göller", q: "What drink did Otto Göller's distillery make?", options: ["Real Dobermann Bitter", "Dobermann Cola", "Pinscher Pop"], answer: 0, evidence: "Real Dobermann Bitter" },
  { match: "a Doberman called Kurt served with the United States Marines", q: "What is the statue of Kurt on Guam called?", options: ["Always Faithful", "Forever Brave", "Good Boy"], answer: 0, evidence: "Always Faithful" },
  { match: "The Dobermann came fifth, behind only the Border Collie", q: "Where did the Dobermann come in Stanley Coren's ranking of quick learners?", options: ["Fifth", "First", "Fiftieth"], answer: 0, evidence: "came fifth" },
  { match: "In Britain it is against the law to crop a dog's ears", q: "Why do British Dobermanns keep their floppy ears?", options: ["Cropping ears is against the law", "They are a different breed", "Their ears never grow"], answer: 0, evidence: "against the law to crop" },
  // Batch 8 (J18-266): Miniature Schnauzer.
  { match: "The first recorded Miniature Schnauzer was a black female called Findel", q: "What was the name of the first recorded Miniature Schnauzer?", options: ["Findel", "Fritz", "Frieda"], answer: 0, evidence: "called Findel" },
  { match: "The Miniature Schnauzer is named after its face", q: "What does the German word schnauze mean?", options: ["Snout", "Sausage", "Snow"], answer: 0, evidence: "schnauze means snout" },
  { match: "Where a Miniature Schnauzer is shown depends on the country", q: "In which group is the Miniature Schnauzer shown in Britain?", options: ["Utility", "Terrier", "Toy"], answer: 0, evidence: "Utility group" },
  { match: "A Miniature Schnauzer's most famous colour is salt and pepper", q: "What is the Miniature Schnauzer's famous grey colour called?", options: ["Salt and pepper", "Fish and chips", "Bread and butter"], answer: 0, evidence: "salt and pepper" },
  { match: "People often say the Miniature Schnauzer's ancestors appear in old art", q: "Why is the Stuttgart statue no proof that Schnauzers are old?", options: ["Its sculptor was born in 1853", "It is made of chocolate", "It shows a cat"], answer: 0, evidence: "born in 1853" },
  // Batch 9 (J18-267): Lurcher.
  { match: "The word Lurcher was first written down with its dog meaning in 1668", q: "What did the old English verb to lurch mean?", options: ["To lurk about or to steal", "To sneeze loudly", "To dance a jig"], answer: 0, evidence: "lurk about or to steal" },
  { match: "For centuries the Lurcher was known as the poacher's dog", q: "Until which year could only landowners legally keep hunting dogs in England?", options: ["1831", "1931", "1731"], answer: 0, evidence: "until 1831" },
  { match: "The most popular Lurcher of all is a Greyhound crossed with a Collie", q: "Which dog is most often crossed with a Greyhound to make a Lurcher?", options: ["A Collie", "A Pug", "A Chihuahua"], answer: 0, evidence: "crossed with a Collie" },
  { match: "The Lurcher differs from its cousin the Longdog in one simple way", q: "What is a Longdog?", options: ["A cross of two sighthounds", "A very long Dachshund", "A Lurcher that has grown up"], answer: 0, evidence: "cross of two sighthounds" },
  { match: "Hare coursing, the old sport of racing dogs after hares", q: "Is hare coursing allowed in England today?", options: ["Yes", "No"], answer: 1, evidence: "against the law" },
  // Batch 10 (J18-268): Cockapoo.
  { match: "The Cockapoo is one of the oldest designer dogs of all", q: "When were the first Cockapoos recorded?", options: ["The 1950s", "The 1850s", "The 2010s"], answer: 0, evidence: "in the 1950s" },
  { match: "Disney may have helped create the Cockapoo", q: "Which Disney film helped make Cocker Spaniels popular in America?", options: ["Lady and the Tramp", "101 Dalmatians", "The Fox and the Hound"], answer: 0, evidence: "Lady and the Tramp" },
  { match: "The Cockapoo goes by several names", q: "What is the Cockapoo called in Australia and New Zealand?", options: ["The Spoodle", "The Cockaroo", "The Poodlecock"], answer: 0, evidence: "the Spoodle" },
  { match: "Cockapoos arrived in Britain in the late 1990s", q: "By how much did the price of a Cockapoo puppy rise between 2019 and 2020?", options: ["168%", "16%", "1,680%"], answer: 0, evidence: "168%" },
  { match: "Not every Cockapoo is a sofa dog", q: "What job do some Cockapoos now do on British shoots?", options: ["Gundogs", "Sheepdogs", "Sled dogs"], answer: 0, evidence: "work as gundogs" },
  // Batch 11 (J18-270): Staffordshire Bull Terrier.
  { match: "The Staffordshire Bull Terrier was recognised by the Kennel Club on 25 May 1935", q: "In which year did the Kennel Club recognise the Staffordshire Bull Terrier?", options: ["1935", "1835", "1985"], answer: 0, evidence: "25 May 1935" },
  { match: "The very first Staffordshire Bull Terrier club was a tiny affair", q: "Where did the first Staffordshire Bull Terrier club meet?", options: ["A pub in Cradley Heath", "A castle in Stafford", "A school in Birmingham"], answer: 0, evidence: "pub in Cradley Heath" },
  { match: "the regimental Staffordshire Bull Terrier was travelling by train in Egypt", q: "How far did the regiment's Staffie travel to find it again?", options: ["About 200 miles", "About 2 miles", "About 2,000 miles"], answer: 0, evidence: "about 200 miles" },
  { match: "The regiments of Staffordshire have kept a Staffordshire Bull Terrier as their mascot", q: "What is every Staffordshire regimental mascot called?", options: ["Watchman", "Sentry", "Guardsman"], answer: 0, evidence: "called Watchman" },
  { match: "Many people think the Staffordshire Bull Terrier is a banned breed", q: "Is the Staffordshire Bull Terrier banned in Britain?", options: ["Yes", "No"], answer: 1, evidence: "but it is not" },
  // Batch 12 (J18-271): Irish Setter.
  { match: "In Irish, the Irish Setter is called Madra Rua", q: "What does Madra Rua mean?", options: ["Red dog", "Rain dog", "Royal dog"], answer: 0, evidence: "means red dog" },
  { match: "The first Irish Setters were not all red", q: "Which earl would keep nothing but solid red setters?", options: ["The Earl of Enniskillen", "The Earl of Sandwich", "Earl Grey"], answer: 0, evidence: "Earl of Enniskillen" },
  { match: "Nearly every Irish Setter alive today goes back to one dog, Champion Palmerston", q: "Which dog is the father of nearly every modern Irish Setter?", options: ["Champion Palmerston", "Big Red", "King Timahoe"], answer: 0, evidence: "Champion Palmerston" },
  { match: "When solid red became the fashion, the old Irish Red and White Setter", q: "Where did Rev. Noble Huston record his setter puppies?", options: ["In his parish register", "In a cookbook", "On the church door"], answer: 0, evidence: "parish register" },
  { match: "Two Irish Setters have lived in the White House", q: "Which president owned an Irish Setter called King Timahoe?", options: ["Richard Nixon", "Abraham Lincoln", "Barack Obama"], answer: 0, evidence: "Richard Nixon" },
  // Batch 13 (J18-272): Italian Greyhound.
  { match: "King Frederick the Great of Prussia loved his Italian Greyhounds so much", q: "In which year was Frederick the Great finally buried beside his greyhounds?", options: ["1991", "1791", "1891"], answer: 0, evidence: "in 1991" },
  { match: "Frederick the Great's Italian Greyhounds lived like royalty", q: "How did Frederick's dog servant have to speak to the dogs?", options: ["Politely, like a lady or gentleman", "In a whisper", "In Latin"], answer: 0, evidence: "formal German word Sie" },
  { match: "Myth: The Cave canem, beware of the dog", q: "What does Cave canem mean?", options: ["Beware of the dog", "Dogs live in caves", "Feed the dog"], answer: 0, evidence: "beware of the dog" },
  { match: "A story is told that in the 1800s an African chief", q: "What did the African chief offer for one Italian Greyhound?", options: ["200 cattle", "2 goats", "A gold crown"], answer: 0, evidence: "200 cattle" },
  { match: "The Italian Greyhound gets its name from Renaissance Italy", q: "Where does the Italian Greyhound get its name from?", options: ["Renaissance Italy", "Modern Rome", "An Italian restaurant"], answer: 0, evidence: "Renaissance Italy" },
  // Batch 14 (J18-274): Boston Terrier.
  { match: "Nearly every Boston Terrier goes back to one dog from England", q: "What was the name of the dog behind nearly all Boston Terriers?", options: ["Judge", "Mayor", "Captain"], answer: 0, evidence: "named Judge" },
  { match: "In 1893 the Boston Terrier became the first breed made in the United States", q: "In which year did the American Kennel Club recognise the Boston Terrier?", options: ["1893", "1993", "1793"], answer: 0, evidence: "In 1893" },
  { match: "The Boston Terrier is nicknamed the American Gentleman", q: "What is the Boston Terrier's nickname?", options: ["The American Gentleman", "The Boston Bruiser", "The Tea Party Terrier"], answer: 0, evidence: "American Gentleman" },
  { match: "The city of Boston is proud of its dog", q: "What is the name of Boston University's Boston Terrier mascot?", options: ["Rhett", "Scarlett", "Rex"], answer: 0, evidence: "called Rhett" },
  { match: "The deaf and blind American writer Helen Keller owned a Boston Terrier", q: "Who gave Helen Keller her Boston Terrier?", options: ["Her college classmates", "The President", "A circus owner"], answer: 0, evidence: "her classmates" },
  // Batch 15 (J18-275): Pomeranian.
  { match: "The Pomeranian is named after Pomerania, a region on the Baltic coast", q: "What does the name Pomerania mean?", options: ["Land by the sea", "Land of fluff", "Mountain land"], answer: 0, evidence: "land by the sea" },
  { match: "Pomeranians first came to Britain with royalty", q: "Which queen brought Pomeranians to Britain in 1767?", options: ["Queen Charlotte", "Queen Elizabeth I", "Queen Boudicca"], answer: 0, evidence: "Queen Charlotte" },
  { match: "Queen Victoria kept as many as 35 Pomeranians in her kennels", q: "Which Pomeranian was beside Queen Victoria at the end of her life?", options: ["Turi", "Marco", "Boo"], answer: 0, evidence: "called Turi" },
  { match: "When the Titanic sank in 1912, only a few dogs survived", q: "How many Pomeranians survived the sinking of the Titanic?", options: ["Two", "Twenty", "None"], answer: 0, evidence: "two of them were Pomeranians" },
  { match: "Myth: The artist Michelangelo had a pet Pomeranian", q: "Did Michelangelo's Pomeranian really watch him paint the Sistine Chapel?", options: ["Yes", "No"], answer: 1, evidence: "no evidence" },
  // Batch 16 (J18-276): Yorkshire Terrier.
  { match: "Almost every Yorkshire Terrier alive today goes back to one dog, Huddersfield Ben", q: "In which town was Huddersfield Ben born?", options: ["Huddersfield", "Harrogate", "Hull"], answer: 0, evidence: "born in Huddersfield" },
  { match: "Huddersfield Ben, the father of the Yorkshire Terrier, died young", q: "Where was Huddersfield Ben's stuffed body last seen?", options: ["On a pub mantelpiece", "In the Tower of London", "On a ship"], answer: 0, evidence: "mantelpiece of a pub" },
  { match: "The smallest dog ever recorded was a Yorkshire Terrier called Sylvia", q: "What was Sylvia, the smallest dog ever recorded, small enough to fit in?", options: ["A matchbox", "A shoebox", "A teapot"], answer: 0, evidence: "fit in a matchbox" },
  { match: "In 1997 a Yorkshire Terrier called Champion Ozmilion Mystification", q: "In which year did a Yorkshire Terrier first win Best in Show at Crufts?", options: ["1997", "1897", "2017"], answer: 0, evidence: "In 1997" },
  { match: "A Yorkshire Terrier puppy is born black with tan markings", q: "What colour is a Yorkshire Terrier puppy when it is born?", options: ["Black with tan markings", "Pink", "Pure white"], answer: 0, evidence: "born black with tan markings" },
  // Batch 17 (J18-277): Border Terrier.
  { match: "Before it was called the Border Terrier, the breed had other names", q: "What was one old name for the Border Terrier?", options: ["The Coquetdale Terrier", "The Cornish Terrier", "The Cotswold Terrier"], answer: 0, evidence: "Coquetdale Terrier" },
  { match: "Two Border families made the Border Terrier", q: "Which two families made the Border Terrier?", options: ["The Robsons and the Dodds", "The Smiths and the Joneses", "The Browns and the Greens"], answer: 0, evidence: "Robsons and the Dodds" },
  { match: "The first Border Terrier ever registered with the Kennel Club", q: "What was the first Border Terrier registered with the Kennel Club called?", options: ["The Moss Trooper", "The Border Reiver", "The Fox Hunter"], answer: 0, evidence: "The Moss Trooper" },
  { match: "The Border Terrier's breed standard describes its head", q: "Which animal's head is the Border Terrier's said to be like?", options: ["An otter's", "A fox's", "A seal's"], answer: 0, evidence: "like an otter's" },
  { match: "A Border Terrier's coat comes in a few set colours", q: "What does grizzle mean in a Border Terrier's coat?", options: ["A mix of dark and light hairs", "A curly coat", "A bald patch"], answer: 0, evidence: "mix of dark and light hairs" },
  // Batch 18 (J18-278): Papillon.
  { match: "The Papillon only got its butterfly name in the late 1800s", q: "Which part of the Papillon's face looks like a butterfly's body?", options: ["The white stripe, or blaze", "Its nose", "Its whiskers"], answer: 0, evidence: "blaze" },
  { match: "Not every Papillon has butterfly ears", q: "What is a Papillon with drooping ears called?", options: ["A Phalène, or moth", "A Chenille, or caterpillar", "A Bourdon, or bumblebee"], answer: 0, evidence: "Phalène, French for moth" },
  { match: "Legend: Marie Antoinette, Queen of France, walked to the guillotine", q: "What do historians think of the story of Marie Antoinette's Papillon?", options: ["It is almost certainly untrue", "It is proven true", "It was really a cat"], answer: 0, evidence: "almost certainly untrue" },
  { match: "The Papillon was a favourite of the French royal court", q: "Who is said to have kept Papillons called Inès and Mimi?", options: ["Madame de Pompadour", "Madame Tussaud", "Madame Curie"], answer: 0, evidence: "Madame de Pompadour" },
  { match: "The Papillon was once also called the Squirrel Spaniel", q: "Why was the Papillon once called the Squirrel Spaniel?", options: ["Its tail curls over its back", "It climbs trees", "It eats nuts"], answer: 0, evidence: "curls up over its back" },
  // Batch 19 (J18-279): Beagle.
  { match: "Long ago there were Beagles so small they were called Glove Beagles", q: "How tall were Queen Elizabeth I's Pocket Beagles?", options: ["20 to 23cm", "1 metre", "5cm"], answer: 0, evidence: "20 to 23cm" },
  { match: "Queen Elizabeth I called her little Pocket Beagles her singing Beagles", q: "What did Queen Elizabeth I call her Pocket Beagles?", options: ["Her singing Beagles", "Her dancing Beagles", "Her flying Beagles"], answer: 0, evidence: "singing Beagles" },
  { match: "The modern Beagle began with a pack kept by the Reverend Phillip Honeywood", q: "What colour were Reverend Honeywood's Beagles?", options: ["Pure white", "Jet black", "Bright orange"], answer: 0, evidence: "pure white" },
  { match: "The famous ship HMS Beagle was named after the dog", q: "Which scientist sailed on HMS Beagle?", options: ["Charles Darwin", "Isaac Newton", "Albert Einstein"], answer: 0, evidence: "Charles Darwin" },
  { match: "A Beagle's nose is so good that Beagles are used around the world as detection dogs", q: "Where do Beagles sniff bags for food that is not allowed in?", options: ["At airports", "At bakeries", "At schools"], answer: 0, evidence: "at airports" },
  // Batch 20 (J18-281): Shih Tzu.
  { match: "The Shih Tzu is sometimes called the chrysanthemum dog", q: "Why is the Shih Tzu called the chrysanthemum dog?", options: ["Its face hair grows out like petals", "It smells of flowers", "It likes to eat flowers"], answer: 0, evidence: "like the petals" },
  { match: "In the Chinese emperor's palace, Shih Tzus were bred by court servants", q: "What could the breeder of the emperor's favourite Shih Tzu be given?", options: ["Income from rice farmland", "A golden crown", "A pet tiger"], answer: 0, evidence: "growing rice" },
  { match: "The Shih Tzu owes a great deal to the Empress Dowager Cixi", q: "Which empress kept Shih Tzus in the Forbidden City?", options: ["Empress Dowager Cixi", "Queen Victoria", "Catherine the Great"], answer: 0, evidence: "Empress Dowager Cixi" },
  { match: "Every Shih Tzu in the world today descends from just 14 dogs", q: "From how many dogs does every Shih Tzu today descend?", options: ["14", "140", "4"], answer: 0, evidence: "just 14 dogs" },
  { match: "The first Shih Tzus came to England with Lady Brownrigg", q: "What did the Kennel Club first wrongly call Lady Brownrigg's Shih Tzus?", options: ["Apsos", "Pugs", "Poodles"], answer: 0, evidence: "called them Apsos" },
  // Batch 21 (J18-283): Whippet.
  { match: "The Whippet was called the poor man's racehorse", q: "In a rag race, what did Whippets run towards?", options: ["Their owner waving a rag", "A sausage on a string", "A moving car"], answer: 0, evidence: "waving a rag" },
  { match: "Before it was called the Whippet, the breed was nicknamed the snap dog", q: "What was the Whippet's old nickname?", options: ["The snap dog", "The zoom dog", "The flash dog"], answer: 0, evidence: "snap dog" },
  { match: "In a mining family, the Whippet was much more than a pet", q: "What could a miner's Whippet catch for the family's dinner?", options: ["A rabbit", "A fish", "A chicken"], answer: 0, evidence: "catch a rabbit" },
  { match: "The Whippet Club, set up in 1899", q: "When was the world's first Whippet breed club set up?", options: ["1899", "1999", "1799"], answer: 0, evidence: "set up in 1899" },
  { match: "A racing Whippet can reach about 56km/h", q: "About how fast can a racing Whippet run?", options: ["About 56km/h (35mph)", "About 10km/h (6mph)", "About 150km/h (93mph)"], answer: 0, evidence: "56km/h (35mph)" },
  // Batch 22 (J18-284): French Bulldog.
  { match: "The French Bulldog's first name was the Bouledogue Français", q: "What does boule mean in Bouledogue?", options: ["Ball", "Bull", "Bread"], answer: 0, evidence: "boule means ball" },
  { match: "The most famous French Bulldog in art was Bouboule", q: "Which painter painted Bouboule the French Bulldog?", options: ["Henri de Toulouse-Lautrec", "Pablo Picasso", "Claude Monet"], answer: 0, evidence: "Toulouse-Lautrec" },
  { match: "The French Bulldog's bat ears were won in a row", q: "Which ears did the American owners insist on?", options: ["Tall bat ears", "Folded rose ears", "Long floppy ears"], answer: 0, evidence: "tall bat ears" },
  { match: "There was one French Bulldog on the Titanic", q: "What was the French Bulldog on the Titanic called?", options: ["Gamin de Pycombe", "Pierre le Chien", "Boule de Neige"], answer: 0, evidence: "Gamin de Pycombe" },
  { match: "In Britain, the Kennel Club first recognised the breed in the early 1900s", q: "In which year was the name changed to French Bulldog?", options: ["1912", "1812", "2012"], answer: 0, evidence: "In 1912" },
  // Batch 23 (J18-285): Weimaraner.
  { match: "The Weimaraner was created at the court of Grand Duke Karl August", q: "Which big animals were early Weimaraners bred to hunt?", options: ["Bears, boars and wolves", "Mice and rats", "Ducks and geese"], answer: 0, evidence: "bears, boars and wolves" },
  { match: "The Weimaraner is nicknamed the Grey Ghost", q: "What is the Weimaraner's nickname?", options: ["The Grey Ghost", "The Silver Bullet", "The Grey Wolf"], answer: 0, evidence: "Grey Ghost" },
  { match: "For a long time the Weimaraner was a closely guarded secret", q: "What did you have to do to buy a Weimaraner in Germany from 1897?", options: ["Join the Weimaraner Club", "Hunt a bear", "Live in Weimar"], answer: 0, evidence: "joined the club" },
  { match: "In 1928 an American hunter, Howard Knight", q: "In which year did Howard Knight finally get Weimaraners he could breed from?", options: ["1938", "1838", "2038"], answer: 0, evidence: "in 1938" },
  { match: "After the Second World War, soldiers brought Weimaraners home", q: "Which American president had a Weimaraner called Heidi?", options: ["Dwight D. Eisenhower", "Abraham Lincoln", "Barack Obama"], answer: 0, evidence: "Eisenhower" },
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
