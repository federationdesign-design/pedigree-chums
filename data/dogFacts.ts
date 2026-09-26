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
import { TOPIC_FACTS } from "./topicFacts"; // J18-295

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
   Batch 23 (J18-285): Weimaraner, 5 new facts (6 existing, 11 in all).
   Batch 24 (J18-286): Rottweiler, 5 new facts (6 existing, 11 in all).
   Batch 25 (J18-287): Basset Hound, 6 new facts (5 existing, 11 in all).
   Batch 26 (J18-288): Bichon Frise, 4 new facts (11 existing, most through the Cavachon; 15 in all).
   Batch 27 (J18-291): West Highland Terrier, 5 new facts (5 existing, 10 in all).
   Batch 28 (J18-292): six chums in one pass (owner): Springer Spaniel, Irish Wolfhound,
   Chihuahua, Afghan Hound, Dachshund and Boxer, 26 new facts.
   ANCESTOR DOGS, batch 1 (J18-304): 5 more facts each for 20 of the 95 ancestor dogs,
   keyed by their node names so each fact leads with that ancestor's picture.
   ANCESTOR DOGS, batch 2 (J18-306): 5 more each for 20 more ancestors with a real
   written history (owner chose history-only; the thin groups keep what they have). */
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
  // Batch 24 (J18-286): 5 new, 11 in all.
  Rottweiler: [
    "The Rottweiler is named after the German town of Rottweil, and the town's name comes from red tiles. When the Roman remains there were dug up, the red roof tiles of an old Roman villa gave the place its name, das rote Wil, meaning the red villa, which became Rottweil.",
    "The Rottweiler was once called the Rottweiler Metzgerhund, the butcher's dog of Rottweil. It drove cattle to market and pulled carts loaded with meat. The story goes that after a sale, a butcher would tie his money purse around his Rottweiler's neck for the journey home, because no robber would dare to take it.",
    "When railways arrived in the mid-1800s, cattle no longer needed to be walked to market, and the Rottweiler almost vanished. At a dog show in Heilbronn in 1882, only one Rottweiler turned up, and not a very good one. A few people who loved the breed kept it going.",
    "The Rottweiler was saved by a new job. In the years before the First World War, police forces needed strong, clever dogs, and in 1910 the German Police Dog Association made the Rottweiler one of its official police breeds. In the two world wars, Rottweilers served as messenger, ambulance, cart-pulling and guard dogs.",
    "Rottweilers were first shown in Britain at Crufts in 1936, and the Kennel Club gave the breed its own separate register in 1966. Today, besides being family pets, Rottweilers work as search and rescue dogs, police dogs and even guide dogs, and some still herd cattle as their ancestors did.",
  ],
  // Batch 25 (J18-287): 6 new, 11 in all.
  "Basset Hound": [
    "The Basset Hound's name comes from the French word bas, meaning low, so basset means something like the rather low one. The breed is said to have been started by monks in France in the Middle Ages, who wanted a hound that could hunt through thick undergrowth with its nose close to the ground.",
    "The first Basset Hounds known in Britain arrived in 1866, when Lord Galway was given a pair by a French count. He named them Basset and Belle. In a letter that year, Lord Galway used the words Basset Hound, the first time the name appears in British writing for this breed.",
    "Sir Everett Millais, son of the famous painter John Everett Millais, is called the father of the Basset Hound in England. He showed his first Basset, a dog called Model, in 1875. In 1880 he gathered so many Bassets at the Wolverhampton dog show that the Kennel Club recognised the breed that same year.",
    "In the 1890s, worried that British Basset Hounds were too closely related, Sir Everett Millais crossed one with a Bloodhound called Inoculation, using artificial insemination, one of the earliest times this was done with dogs. The Bloodhound blood gave the Basset Hound its long, low ears and sad, noble face.",
    "Princess Alexandra, later Queen Alexandra, made the Basset Hound fashionable. In the 1880s she set up a pack at Sandringham, the royal estate in Norfolk, and showed her Bassets at dog shows. Soon even people in Britain who never went hunting wanted a Basset Hound.",
    "Fred Basset is a Basset Hound in a British newspaper comic strip, created by the cartoonist Alex Graham in 1963. Fred's thoughts appear in bubbles as he watches the odd behaviour of his human family, and the strip has been printed in newspapers around the world.",
  ],
  // Batch 26 (J18-288): 4 new, 15 in all.
  "Bichon Frise": [
    "The Bichon Frise's full French name is Bichon à Poil Frisé, meaning the bichon with curly hair. Bichon may come from barbichon, a little Barbet, or may simply be an old French word for a small dog. In 1933, when the breed was going by two names, Ténériffe and Bichon, the new name Bichon Frise was chosen to describe its curly coat.",
    "The Bichon Frise nearly disappeared twice, after the First and Second World Wars. A few French and Belgian breeders gathered the little white dogs from the streets and saved the breed. The first Bichon Frise entered in the French stud book, in October 1934, was a female called Ida.",
    "The Bichon Frise reached America in 1956, when Hélène and François Picault from Dieppe in France arrived with six Bichons and bred the first American litter. The breed came to Britain in the late 1950s and was recognised by the Kennel Club in the 1970s. Today it is one of the best-loved small dogs in both countries.",
    "Little white dogs like the Bichon Frise appear in paintings by great artists over hundreds of years, including the Spanish painter Francisco Goya and the English painter Sir Joshua Reynolds. In the 1800s the Bichon came back into fashion in France under the Emperor Napoleon III, when it was known as the Ténériffe.",
  ],
  // Batch 27 (J18-291): 5 new, 10 in all.
  "West Highland Terrier": [
    "Before it was the West Highland Terrier, the Westie went by several names, each after the family who bred it. It was the Poltalloch Terrier on Colonel Malcolm's estate in Argyll, the Roseneath Terrier on the Duke of Argyll's, and the Pittenweem Terrier in Fife. Colonel Malcolm did not want the credit, and in 1903 he asked for his white terriers to be given a new name.",
    "The West Highland Terrier was recognised by the Kennel Club in 1907, and appeared at Crufts for the first time that same year. Its full name, the West Highland White Terrier, first appears in print in 1908, in a book about otter hunting, chosen to describe where the dogs came from and their white coat.",
    "The West Highland Terrier has a short, thick tail shaped like a carrot, and it is said to be strong enough for a hunter to pull the little dog out of a burrow by it. Its double coat, a harsh white outer layer over a soft undercoat, sheds dirt and water, which kept it going in the cold, wet Highlands.",
    "The West Highland Terrier's cheerful white face is one of the most famous in advertising. For many years a black Scottish Terrier and a white Westie have appeared together as the symbol of a Scotch whisky, and a Westie has long been the face of a well-known brand of dog food.",
    "The Malcolm family's white terriers at Poltalloch in Argyll are thought to go back as far as the time of King James I, around 400 years ago. The Malcolms are still the lairds of Poltalloch today, and the old kennels where the West Highland Terrier was bred are now a family home.",
  ],
  // Batch 28 (J18-292): Springer Spaniel, 5 new.
  "Springer Spaniel": [
    "The Springer Spaniel and the Cocker Spaniel were once born in the same litters. In the 1800s, the puppies were sorted by weight: the smaller ones, under about 11kg, became Cockers and hunted woodcock, and the bigger ones became Springers, which made birds spring up into the air for the hunter.",
    "The Springer Spaniel has one of the longest family records of any dog. In 1812 the Boughey family of Aqualate in Shropshire bred a spaniel called Mop 1, and for over a century they kept a stud book of his descendants. One of them, Velox Powder, won twenty field trials.",
    "The Kennel Club recognised the English Springer Spaniel as a breed of its own in 1902. The next year, a liver and white dog called Beechgrove Will became the first English Springer Spaniel ever to win a Challenge Certificate at a dog show.",
    "Working Springer Spaniels and show Springer Spaniels look so different that they could be two breeds. Show dogs are heavier, with long ears and a thick, feathery coat. Working dogs are lighter and faster. The two types have been bred apart for at least 70 years.",
    "The Springer Spaniel's tireless nose and love of searching make it one of Britain's favourite sniffer dogs. Springers work with the police, the armed forces and border officers, hunting out drugs, weapons and explosives, and treat every search as a game.",
  ],
  // Batch 28 (J18-292): Irish Wolfhound, 5 new.
  "Irish Wolfhound": [
    "The greatest hero of Irish legend is named after an Irish Wolfhound-type dog. As a boy called Sétanta, he killed the fierce guard dog of Culann the smith in self-defence, and then offered to guard Culann's house himself until a new dog was trained. From then on he was called Cú Chulainn, the Hound of Culann.",
    "Irish Wolfhounds were once such prized gifts for kings and queens across Europe that too many left Ireland. In 1652 Oliver Cromwell banned sending them abroad, because the wolves they hunted were becoming a danger again. Ireland's last wolf is said to have been killed in 1786, and after that the Irish Wolfhound almost disappeared.",
    "The Irish Wolfhound was brought back from the edge of extinction by a British army officer, Captain George Augustus Graham. From the 1860s he gathered the last dogs of the old type and crossed them with Scottish Deerhounds, Great Danes and even a Borzoi. In 1885 he founded the Irish Wolfhound Club.",
    "Since 1902 the Irish Wolfhound has been the mascot of the Irish Guards, a regiment of the British Army. The regiment's Wolfhound still marches with the soldiers on parade, dressed in its own ceremonial coat, a tradition that has lasted well over a hundred years.",
    "The Irish Wolfhound is the tallest dog breed in the world. A big male can stand about 80 to 90cm at the shoulder, and when it stands on its back legs it can be taller than a grown man. Yet the breed is famous for being gentle and calm, a true gentle giant.",
  ],
  // Batch 28 (J18-292): Chihuahua, 4 new.
  "Chihuahua": [
    "The Chihuahua is named after Chihuahua, a state in northern Mexico. In the mid-1800s, American travellers crossing the border found tiny dogs there and bought them in local markets. At first people called them Arizona dogs or Texas dogs, but the name Chihuahua stuck.",
    "The first Chihuahua registered by the American Kennel Club, in 1904, was called Midget. He belonged to a man named H. Raynor from Texas. Within a few years the breed had its first show champion, and today the Chihuahua is popular all over the world, including Britain.",
    "The Chihuahua is the smallest dog breed in the world. In 2023 a Chihuahua called Pearl was named by Guinness World Records as the shortest living dog, just 9.14cm tall, which is about the length of a lollipop stick. She took the title from another Chihuahua, Miracle Milly, who was a relative of hers.",
    "The Chihuahua comes in two coats: smooth, with short glossy hair, and long, with soft, feathery fur. Chihuahuas are famous for burrowing under blankets, cushions and even piles of washing, curling up somewhere warm and snug, which suits such a small dog.",
  ],
  // Batch 28 (J18-292): Afghan Hound, 4 new.
  "Afghan Hound": [
    "The first famous Afghan Hound in Britain was Zardin, brought back from India by Captain John Barff in 1907. His long coat caused a sensation, and Queen Alexandra asked for him to be brought to Buckingham Palace so she could see him. Zardin became the model for the breed's first standard, written in 1912.",
    "Today's Afghan Hounds come from two groups of dogs brought to Britain in the 1920s. The Bell-Murray dogs, from 1920, were lighter desert hounds with thinner coats. The Ghazni dogs, brought from Kabul by Mary Amps in 1925, were heavily coated mountain hounds. Breeders argued over which was best, but in the end the two were mixed.",
    "In 2005 an Afghan Hound puppy called Snuppy became the first dog ever to be cloned. He was made by scientists in South Korea from the skin cells of a three-year-old Afghan Hound, and TIME magazine named him the invention of the year.",
    "The artist Pablo Picasso loved his Afghan Hound, Kabul, and painted an Afghan Hound in a picture in 1962. The Afghan Hound's glamorous looks also made it a toy star: Barbie was given a pet Afghan Hound called Beauty.",
  ],
  // Batch 28 (J18-292): Dachshund, 4 new.
  "Dachshund": [
    "The Dachshund came to Britain in the 1840s as a royal present. Dachshunds were sent from Germany to Prince Albert, Queen Victoria's husband, and lived in the kennels at Windsor Castle, where they were used on shoots in Windsor Forest. By the 1870s, hundreds more were being brought over from Germany.",
    "Queen Victoria loved her Dachshunds, and several were painted for her. She is said to have declared that nothing turns a man's home into a castle more quickly than a Dachshund, which was easy for her to say, as she lived in several.",
    "The Dachshund Club was founded in England in 1881, seven years before the first Dachshund club in Germany, the breed's own homeland. British fans helped set down what a Dachshund should look like.",
    "During the First World War, the Dachshund suffered for being German. In Britain and America it was used in cartoons as a symbol of the enemy, and some owners were mocked in the street. In America, some people even called their Dachshunds liberty hounds to protect them. After the war, the little dog slowly won back its popularity.",
  ],
  // Batch 28 (J18-292): Boxer, 4 new.
  "Boxer": [
    "Nobody knows for certain where the Boxer's name comes from. One popular idea is that it comes from the way Boxers play, standing up on their back legs and batting with their front paws like a boxer in the ring. Others think the name simply grew out of the old German names for its ancestors.",
    "The first Boxer club was founded in Munich, Germany, in 1895, and the first Boxers were shown at a dog show for Saint Bernards there. The first Boxer ever entered in the breed's stud book, in 1904, was a dog called Mühlbauer's Flocki.",
    "The most important Boxer breeder of all was a woman, Friederun Stockmann. Born in 1891 in Riga, she went to Munich to study art, met her husband through his Boxer, Pluto, and spent her life breeding Boxers. Her dogs helped shape the Boxer all over the world.",
    "Boxers served in both world wars as messenger dogs, carrying packs and standing guard. After the Second World War, soldiers took Boxers home with them, and the breed became a favourite family dog. In 1951 a Boxer called Bang Away won Best in Show at America's famous Westminster dog show.",
  ],
  // ANCESTOR DOGS, batch 1 (J18-304): 5 more facts each for 20 ancestor dogs.
  "Ancient Molossers": [
    "The Ancient Molossers are named after the Molossians, a people of Epirus in north-western Greece, whose big dogs were famous across the ancient world.",
    "The Greek writer Aristotle, more than 2,300 years ago, praised the Molossian dogs as especially brave, and said the sheepdogs among them were the best of all.",
    "The Jennings Dog, a large marble statue in the British Museum, is thought to show a Molossian hound, sitting alert with its head turned, as if it has heard something.",
    "The Romans prized the Ancient Molossers as guard dogs for houses and farms, and the poet Virgil advised farmers to feed Molossian dogs well, to keep thieves and wolves away.",
    "Historians still debate what the Ancient Molossers looked like. Some think they were heavy mastiffs, while others think the name covered several kinds of large Greek dog, including sheepdogs and hounds.",
  ],
  "Laconian tracking Hounds": [
    "The Laconian hounds came from Laconia, the region around the Greek city of Sparta, and were also called Spartan hounds.",
    "The Greek writer Xenophon wrote a whole book about hunting with hounds, the Cynegeticus, about 2,400 years ago, much of it about Laconian hounds and how to train them.",
    "Xenophon advised giving Laconian hounds short names that were easy to call, and suggested names such as Psyche, meaning spirit, and Hybris, meaning cheek.",
    "In Shakespeare's A Midsummer Night's Dream, Duke Theseus boasts that his hounds are bred out of the Spartan kind, meaning they descend from the famous Laconian hounds.",
    "Ancient Greek writers told a story that Laconian hounds were a cross between dogs and foxes. It is not true, because dogs and foxes cannot breed, but it shows how clever and quick the hounds seemed.",
  ],
  "Segusian tracking Hounds": [
    "The Segusian hounds were named after the Segusiavi, a Celtic people who lived in Gaul, in the area around modern Lyon in France.",
    "The Greek writer Arrian, in the 100s AD, described Segusian hounds as shaggy and rather ugly, with a mournful, pleading howl as they followed a trail.",
    "Arrian said Segusian hounds were slow, but excellent at following a scent, a bit like a modern Bloodhound or Basset.",
    "Because they worked by smell rather than speed, Segusian hounds are thought to be among the early ancestors of Europe's scenthounds, the dogs that later became the Bloodhound and Beagle's forebears.",
    "The Segusian hounds' loud, sad-sounding howl while hunting was so well known that ancient writers compared it to the cries of beggars.",
  ],
  "Gaulish coursing Hounds": [
    "The Gaulish coursing hounds were called vertragi by the Romans. The name is thought to come from a Celtic word meaning very fast.",
    "Arrian, a Greek writer who lived under Roman rule, owned a vertragus bitch called Horme, meaning Impulse or Rush, and wrote that she was the fastest and cleverest hound he had ever known.",
    "Arrian wrote about his hound Horme sleeping beside him and greeting him with joy, one of the earliest written descriptions of a dog as a loving pet as well as a hunter.",
    "The Roman poet Martial wrote a short poem about a vertragus that hunted not for itself but for its master, bringing back a hare unharmed.",
    "The Gaulish coursing hounds hunted hares by sight, just as Greyhounds and Whippets do today, and many experts think they were among the ancestors of those breeds.",
  ],
  "Norman Hound": [
    "The Norman Hound was a big, heavy hound, usually white with markings, with long ears and a deep, bell-like voice that carried far across the countryside.",
    "The Norman Hound was slow but steady. Hunters on horseback could keep up with it easily, which suited the grand, slow hunts of medieval nobles.",
    "The Norman Hound is thought to be one of the ancestors of the old English Southern Hound and the Talbot, a white hound that became a famous symbol in English heraldry.",
    "Several English pubs are still called The Talbot, after the white hound descended from Norman-type hunting dogs.",
    "Norman Hounds are thought to have hunted deer and boar in the royal forests that William the Conqueror and his sons set aside for hunting.",
  ],
  "Rache": [
    "Rache was a medieval English and Scottish word for a hunting hound that tracked by scent. In old Scots it was spelled ratch.",
    "A female hunting hound was once called a brach, a word related to rache. Shakespeare uses it several times, including in King Lear.",
    "In medieval hunts, the raches found and followed the scent of the deer or boar, while faster hounds and heavy dogs took over for the chase and the kill.",
    "Medieval hunting books tell how raches were fed, kennelled and trained by hunt servants, and how their different voices in the pack helped the hunters follow the chase.",
    "The word rache comes from Old English ræcc, meaning a hunting dog, and is one of the oldest English words for a type of dog.",
  ],
  "Medieval Greyhound": [
    "The Book of St Albans, printed in 1486, describes the perfect Medieval Greyhound: headed like a snake, necked like a drake, footed like a cat, tailed like a rat.",
    "In medieval Britain, owning a Greyhound was a sign of high rank. Knights and nobles were often painted or carved with Greyhounds at their side.",
    "The Greyhound appears on the coats of arms of many noble families, and was one of the royal badges of King Henry VII.",
    "Medieval Greyhounds wore fine collars, some decorated with silver, gold or velvet, as a sign of their owner's wealth.",
    "Myth: The name Greyhound means the dogs were always grey. The truth: Nobody is sure where the name comes from. It may come from an Old English word meaning dog-hound, and Greyhounds come in many colours.",
  ],
  "Alaunt war dogs": [
    "In The Canterbury Tales, Geoffrey Chaucer describes a king's chariot guarded by 20 or more white alaunts, as big as young bulls, wearing muzzles and collars of gold.",
    "In the 1380s, the French nobleman Gaston Phoebus wrote a famous hunting book describing three kinds of alaunt: the gentle alaunt, the alaunt veautre used for boar, and the butcher's alaunt that guarded meat.",
    "Gaston Phoebus warned that alaunts could be headstrong and dangerous if badly trained, but said a good one was the best of all dogs for holding a dangerous animal.",
    "The Alano Español, a Spanish breed of catch dog still kept today, is thought by many to be a descendant of the medieval alaunt.",
    "Alaunts were named after the Alans, horse-riding people from the steppe who brought their big dogs west into Europe around 1,600 years ago.",
  ],
  "Chien-gris": [
    "The Chien-gris, meaning grey dog in French, was a hunting hound kept in the royal kennels of the kings of France during the Middle Ages.",
    "The Chien-gris was prized for hunting deer. French kings kept packs of them for centuries, until newer types of hound took their place.",
    "By the 1500s and 1600s the Chien-gris had become rare, and it later disappeared as a separate type of hound.",
    "Like many old hound types, the Chien-gris faded away as fashions in hunting changed and breeders crossed hounds to make faster packs.",
    "The Chien-gris is one of the hounds that helped shape later French scenthounds, which in turn influenced hunting hounds across Europe and in Britain.",
  ],
  "Zhokhov Island sled dogs": [
    "Zhokhov Island lies in the Arctic Ocean, north of Siberia. About 9,500 years ago, people there were already using dogs to pull sledges across the ice.",
    "Studies of the Zhokhov Island dog bones suggest their owners chose dogs of a certain size, about 16 to 25kg, which is the ideal weight for pulling sledges without overheating.",
    "The Zhokhov Island people seem to have kept some larger dogs too, perhaps for hunting polar bears and reindeer.",
    "A 2020 study of the DNA of a Zhokhov Island dog found that modern sled dogs, such as Greenland sledge dogs and Siberian Huskies, are closely related to it.",
    "The Zhokhov Island sled dogs show that dogs had already been bred for special jobs, like pulling sledges, around 9,500 years ago.",
  ],
  "Taimyr wolf": [
    "The Taimyr wolf is known from a single small bone found on the Taimyr Peninsula in northern Siberia and dated to about 35,000 years ago.",
    "In 2015, scientists read the DNA of the Taimyr wolf bone and found it came from a population of wolves that split off around the time wolves and dogs went their separate ways.",
    "The Taimyr wolf's DNA suggested that dogs may have split from wolves earlier than many scientists had thought, perhaps more than 27,000 years ago.",
    "Some northern dogs, such as Siberian Huskies and Greenland sledge dogs, still carry a small amount of DNA from ancient wolves like the Taimyr wolf.",
    "The Taimyr wolf lived in a cold world of mammoths, woolly rhinos and cave lions, on the huge grasslands of the last Ice Age.",
  ],
  "Early Mesoamerican dogs": [
    "Dogs reached Mexico and Central America with the first people who travelled south through the Americas, thousands of years ago.",
    "In western Mexico, potters of the Colima culture, around 2,000 years ago, made many clay figures of plump little dogs, which were often placed in tombs.",
    "The Aztecs kept several kinds of dog, including the hairless Xoloitzcuintli and a small dog called the Techichi, and believed dogs could guide souls to the afterlife.",
    "The Maya of Mexico and Central America kept dogs too, and dog bones have been found at many Maya sites, some in special burials.",
    "Some of the ancient dogs of Mexico were hairless, a trait still seen today in the Mexican Hairless Dog, the Xoloitzcuintli.",
  ],
  "Ancient Melitaean dogs": [
    "The Melitaean dogs are named after Melita, an ancient place name. Some think it meant the island of Malta, others the island of Mljet in Croatia.",
    "The Greek writer Aristotle mentioned the little Melitaean dogs over 2,300 years ago, describing them as well-proportioned despite being small.",
    "Small, fluffy dogs like the Melitaean dogs appear on ancient Greek vases, often with children or women.",
    "In ancient Rome, little Melitaean dogs were fashionable lapdogs, and rich Roman ladies are said to have carried them in their sleeves or on their laps.",
    "The Roman writer Strabo described the small Melitaean dogs as a favourite pet, and they are thought to be the ancestors of today's Maltese.",
  ],
  "Portuguese fishing dogs": [
    "Portuguese fishing dogs helped fishermen by diving into the sea to herd fish into nets, fetch broken nets and lost gear, and swim messages between boats.",
    "Portuguese fishing dogs were often clipped with the back half of the body shaved and the front left furry, to help them swim while keeping their chest warm.",
    "The Portuguese fishing dog is known today as the Portuguese Water Dog, or Cão de Água, which means water dog in Portuguese.",
    "By the 1930s, as fishing boats changed, the Portuguese Water Dog had almost died out. A businessman, Vasco Bensaude, rescued the breed by collecting and breeding the last dogs.",
    "Portuguese Water Dogs have webbed feet and a waterproof coat, and can dive underwater, a rare skill for a dog.",
  ],
  "Corded herding dogs": [
    "Corded herding dogs, such as the Hungarian Komondor and Puli, have coats that naturally twist into long cords, like dreadlocks.",
    "A corded coat protected herding dogs from bad weather and from the teeth of wolves, and helped the white Komondor blend in with a flock of sheep.",
    "The Komondor was bred to guard sheep on its own, deciding for itself when a threat was coming, rather than waiting for a shepherd's orders.",
    "The cords of a Komondor's coat take about two years to form, and a full-grown coat can reach the ground and take days to dry after a bath.",
    "The Puli, a smaller corded dog, was used to herd sheep in Hungary, and is said to be so agile that it can jump onto a sheep's back to turn the flock.",
  ],
  "Ancient Chinese court dogs": [
    "Ancient Chinese court dogs were treated like royalty. Emperor Ling of the Han dynasty, who ruled in the 100s AD, is said to have given his dogs official ranks and titles.",
    "In the Chinese imperial court, the smallest dogs were called sleeve dogs, because courtiers carried them inside the wide sleeves of their robes.",
    "Legend says that stealing one of the emperor's palace dogs in ancient China was punishable by death. It is a famous story, though historians are not sure it was really the law.",
    "The Pekingese is descended from ancient Chinese court dogs. For centuries, they were kept only inside the palaces of the emperors in Beijing.",
    "When British soldiers looted the Summer Palace in Beijing in 1860, they took five small palace dogs to Britain. One, named Looty, was given to Queen Victoria.",
  ],
  "Old Mastiffs of the East": [
    "Great stone carvings from the palace of the Assyrian king Ashurbanipal, about 2,650 years old, show huge mastiff-like hunting dogs. They are now in the British Museum.",
    "The Assyrian palace carvings show the big dogs on leads, being led out for a royal lion hunt, with heavy heads and powerful bodies.",
    "Tiny clay models of mastiff-like dogs, each with its name written on it, were buried under an Assyrian palace doorway as guardians. Names included ones meaning Don't think, bite!",
    "The Tibetan Mastiff is thought to descend from ancient guard dogs of the East, and in Tibet it still guards flocks and homes from wolves and snow leopards.",
    "Ancient writers described huge dogs from India and the East that were said to fight lions. The stories were exaggerated, but they show how impressive these dogs seemed.",
  ],
  "Medieval British Mastiff": [
    "Legend says that at the Battle of Agincourt in 1415, the knight Sir Piers Legh was wounded, and his Mastiff stood over him and guarded him for hours.",
    "The Mastiffs of Lyme Hall in Cheshire, home of the Legh family, were kept for hundreds of years and were said to descend from Sir Piers Legh's loyal Mastiff at Agincourt.",
    "In medieval England, farmers and householders kept mastiffs as guard dogs, often chained up by day and let loose at night to deter thieves.",
    "In some medieval royal forests, farmers' mastiffs had their front toes cut, an old law called lawing, so they could not chase the king's deer.",
    "The word mastiff probably comes from an old French word meaning tame, or a house dog, because mastiffs lived at home as guards.",
  ],
  "Medieval Bloodhound": [
    "Medieval Bloodhounds were called sleuth hounds in Scotland, from sleuth, an old word for a trail. That is why a detective is still sometimes called a sleuth.",
    "Legend says that Robert the Bruce was once chased by his enemies with a Bloodhound, and escaped by wading down a stream so the dog lost his scent.",
    "Medieval Bloodhounds were used not only for hunting deer, but also for tracking outlaws and cattle thieves along the border between England and Scotland.",
    "The name Bloodhound may mean a hound of pure blood, bred carefully by nobles, rather than a dog that likes blood.",
    "Medieval Bloodhounds could follow a trail that was days old, a skill that later made the Bloodhound famous with police around the world.",
  ],
  "Central Asian Tazi hounds": [
    "In Kazakhstan, the Tazy hound is so valued that it is treated as a national treasure, and there are programmes to protect the breed.",
    "In Central Asia, Tazi hounds have long hunted alongside golden eagles. The hound chases the fox or hare, and the eagle swoops down to catch it.",
    "The Tazi hounds of Central Asia have long, silky ears and feathered tails, and are built to run fast over open steppe.",
    "In Kazakh tradition, a good Tazy was so valuable that it was said to be worth the same as a fine horse.",
    "Tazi hounds are thought to be relatives of the Saluki and the Afghan Hound, part of a family of ancient sighthounds stretching from the Middle East to Central Asia.",
  ],
  // ANCESTOR DOGS, batch 2 (J18-306): 5 more facts each for 20 more ancestor dogs.
  "Old scenting Hounds": [
    "The Southern Hound was a big, slow, heavy British scenthound with long ears and a deep, bell-like voice. It had almost disappeared by the 1800s, but its blood lives on in later hounds.",
    "The Talbot, a white medieval scenthound, gave its name and its image to the Talbot family, the Earls of Shrewsbury, who put a Talbot hound on their coat of arms.",
    "In A Midsummer Night's Dream, Shakespeare describes hounds matched in mouth like bells, because hunters chose hounds whose voices blended together like a peal of church bells.",
    "When a scenthound picks up a scent and starts to bay, hunters say it is giving tongue, or giving voice, which tells everyone the trail has been found.",
    "In the 1700s, British breeders made the old slow scenthounds faster for chasing foxes, creating the English Foxhound, which could keep up with hunters on galloping horses.",
  ],
  "Dogs of the Alan horsemen": [
    "The Alans were horse-riding nomads from the steppe north of the Caucasus mountains. They spoke a language related to Persian, and were cousins of the Scythians and Sarmatians.",
    "In the early 400s AD, groups of Alans crossed the River Rhine into the Roman Empire and travelled through Gaul into Spain, bringing their big dogs with them.",
    "Some Alans settled in Gaul, in what is now France, around the city of Orléans, and their dogs may have spread from there.",
    "The Ossetians, who live in the Caucasus mountains today, are thought to be descendants of the ancient Alans.",
    "Roman writers described the Alans as living in covered wagons and moving from pasture to pasture with their herds, which their dogs helped guard.",
  ],
  "Old German boarhounds": [
    "Hunting wild boar was dangerous, because a boar's tusks could badly wound a dog. Some German boarhounds were given padded or armoured coats to protect them.",
    "German princes kept huge kennels of boarhounds for grand hunts, bred specially to be both strong and fast enough to catch and hold a boar.",
    "The Great Dane is not Danish. In the 1700s, the French naturalist Buffon called it the grand Danois, meaning the big Dane, and the name stuck in English.",
    "In German, the Great Dane is called the Deutsche Dogge, meaning German mastiff. German breeders agreed on that name around 1880.",
    "The German statesman Otto von Bismarck loved Great Danes, and his dogs, one of them called Tyras, became famous across Germany.",
  ],
  "Tibetan temple dogs": [
    "The Lhasa Apso's Tibetan name is said to be Abso Seng Kye, meaning bark lion sentinel dog, because it guarded the inside of monasteries and homes.",
    "By tradition, Lhasa Apsos were never sold. They were given as precious gifts, sometimes by the Dalai Lama to Chinese emperors and honoured visitors.",
    "Tibetan Spaniels are said to have sat on the high walls of monasteries, watching the valley and barking to warn of anyone approaching.",
    "The Tibetan Terrier is not really a terrier. In Tibet it was called the holy dog, believed to bring good luck, and was never sold.",
    "The Tibetan Terrier came to Britain through Dr Agnes Greig, a doctor in India in the 1920s, who was given one as a thank-you gift after treating a patient.",
  ],
  "Old British ratting Terriers": [
    "In Victorian London, some pubs held rat pits, where terriers were timed to see how quickly they could kill rats. It was cruel, but hugely popular at the time.",
    "The most famous rat-pit terrier was Billy, who in 1823 is said to have killed 100 rats in about five and a half minutes.",
    "Jack Black called himself Rat and Mole Destroyer to Queen Victoria. He caught rats with terriers and ferrets, and also bred and sold dogs.",
    "Rat-baiting slowly faded away in the early 1900s, as people came to see it as cruel and new animal welfare laws were passed.",
    "The Manchester Terrier and the English Toy Terrier descend from the smart black and tan ratting terriers kept in the cities of northern England.",
  ],
  "The First Setters": [
    "Before guns were good enough to shoot flying birds, setting dogs crouched down beside the hidden birds, and hunters crept up and threw a net over the birds and the dog together.",
    "The English writer Gervase Markham explained how to train a setting dog in 1621, showing that setters were already well known in Britain 400 years ago.",
    "Setters get their name from setting, meaning to crouch or sit, the way early setters dropped low to show where birds were hiding.",
    "Edward Laverack spent about 50 years in the 1800s breeding his own line of English Setters, and his dogs shaped the show English Setter.",
    "Richard Purcell Llewellin bred a famous line of working English Setters in the 1800s, and setters from his line are still called Llewellin setters.",
  ],
  "Welsh herding dogs": [
    "The medieval Welsh laws of Hywel Dda, from the 900s, set out what different dogs were worth. A good herdsman's dog was valued as highly as the best ox.",
    "Welsh drovers walked huge herds of cattle all the way to markets in England, with dogs to keep them moving. It is said some dogs found their own way home alone afterwards.",
    "Welsh sheepdogs traditionally work with a loose eye, moving freely and often barking, rather than stalking the sheep in a crouch.",
    "The Welsh Sheepdog Society was formed in 1997 to protect the traditional Welsh working sheepdog, which was being replaced by Border Collies.",
    "Welsh hill farmers bred their sheepdogs for work on steep, rough ground, choosing dogs for stamina and good sense rather than looks.",
  ],
  "Norse settlers dogs": [
    "The Norwegian Buhund is an old Norse farm dog. Its name comes from bu, meaning a farm or homestead, and hund, meaning dog.",
    "The Swedish Vallhund looks very like a Welsh Corgi, and people still argue whether Vikings took Corgi-type dogs to Scandinavia or brought Vallhund-type dogs to Britain.",
    "The Norwegian Lundehund was bred to climb cliffs and pull puffins from their burrows. It has six toes on each foot and can bend its head right back over its shoulders.",
    "In the Icelandic Njáls saga, the hero Gunnar has a loyal hound called Sámr, which guards his home and warns him of danger.",
    "Norse settlers brought farm dogs to the islands of Shetland and Orkney, and those island dogs may have helped shape the small herding dogs of the north.",
  ],
  "Old Irish water dogs": [
    "The Irish Water Spaniel was shaped by Justin McCarthy of Dublin in the 1830s to 1850s. His dog Boatswain, born in 1834, is known as the father of the breed.",
    "The Irish Water Spaniel has a coat of tight curls all over, except for its tail, which is almost bare and is called a rat tail.",
    "The Irish Water Spaniel is the tallest of all the spaniel breeds, and has a curly topknot of hair on its head.",
    "Shakespeare mentions a water-spaniel in The Two Gentlemen of Verona, showing that water dogs were well known in Britain and Ireland 400 years ago.",
    "The Irish Water Spaniel's oily, curly coat keeps it warm and dry in cold water, perfect for fetching ducks from Irish lakes and bogs.",
  ],
  "Old black-and-tan Setters": [
    "The Gordon Setter is named after the 4th Duke of Gordon, who bred black-and-tan setters at Gordon Castle in Scotland in the 1820s.",
    "The Gordon Setter was first called the Gordon Castle Setter, after the Duke of Gordon's home.",
    "The Gordon Setter is the heaviest of the setters, built for steady work on the Scottish moors rather than for speed.",
    "A story told about the Gordon Setter says that a clever Collie was once bred into the Duke of Gordon's setters to make them smarter.",
    "The world's first dog show, held in Newcastle upon Tyne in 1859, was only for Pointers and Setters, and black-and-tan setters were among the dogs shown.",
  ],
  "Old hill and bearded Collies": [
    "The Bearded Collie nearly disappeared in the 1900s. It was saved after 1944 by Mrs G. O. Willison, who ordered a Shetland Sheepdog puppy and was sent a Bearded Collie, called Jeannie, by mistake.",
    "Mrs Willison searched for a male to breed with her Bearded Collie Jeannie, and found one called Bailie. Almost all Bearded Collies today descend from those two dogs.",
    "A story says Polish sailors traded Polish Lowland Sheepdogs in Scotland in 1514, and that they helped create the Bearded Collie. It is a nice tale, but nobody can prove it.",
    "Old names for the Bearded Collie include the Highland Collie and the Mountain Collie, because it worked the sheep and cattle of the Scottish hills.",
    "Bearded Collies are famous for their bouncy energy. Shepherds say a good Beardie can work all day in wind, rain and snow.",
  ],
  "Old Scottish working Terriers": [
    "King James VI of Scotland, who became James I of England, is said to have sent a gift of small terriers from Argyll to the King of France.",
    "The Cairn Terrier is named after cairns, the piles of stones on Scottish hillsides where foxes and other animals hid, and where these little terriers went in after them.",
    "Queen Victoria kept Skye Terriers, which helped make the breed fashionable in the 1800s.",
    "The Scottish Terrier is sometimes nicknamed the Diehard, a name linked with its brave, stubborn character.",
    "The American President Franklin D. Roosevelt had a Scottish Terrier called Fala, who went almost everywhere with him and even has a statue at his memorial.",
  ],
  "Thuringian herding dogs": [
    "In 1899 a German cavalry officer, Max von Stephanitz, bought a sheepdog called Hektor at a dog show, renamed him Horand von Grafrath, and made him the first registered German Shepherd.",
    "The club for German Shepherd dogs was founded on 22 April 1899, and Max von Stephanitz led it for many years.",
    "Max von Stephanitz's motto for the German Shepherd was utility and intelligence. He wanted a working dog, not just a handsome one.",
    "After the First World War, Britain renamed the German Shepherd the Alsatian Wolf Dog, to avoid the word German. The Kennel Club only brought back the name German Shepherd in 1977.",
    "Horand von Grafrath, the first registered German Shepherd, came partly from the sharp, prick-eared herding dogs of Thuringia in central Germany.",
  ],
  "Old Desert coursing dogs": [
    "The Saluki is one of the oldest known types of dog. Slim, feathered hounds like it appear in ancient Egyptian and Middle Eastern art thousands of years old.",
    "Among Bedouin people, the Saluki was so honoured that it was called el hor, the noble one, and was allowed to sleep in the family tent.",
    "Salukis hunted gazelles and hares in the desert, sometimes together with trained falcons that helped slow the prey down.",
    "Some ancient Egyptians had their hunting hounds mummified and buried with them, so they could hunt together in the afterlife.",
    "The Saluki was recognised by the Kennel Club in Britain in 1923, after British officers and travellers brought them back from the Middle East.",
  ],
  "Schnauzer-type farm dogs": [
    "The word Schnauzer comes from the German Schnauze, meaning snout or muzzle, because of the dog's bearded, moustached face.",
    "The Standard Schnauzer was first shown at a dog show in Hanover, Germany, in 1879, where it was called a wire-haired Pinscher.",
    "There are three sizes of Schnauzer: the Miniature, the Standard and the Giant. The Giant Schnauzer worked with cattle drovers and butchers in Bavaria.",
    "The Schnauzer's wiry coat protected it from bad weather and from bites by the rats it caught in stables and barns.",
    "Schnauzer-type dogs guarded farm carts on the way to market in southern Germany, staying with the goods while the farmer was busy.",
  ],
  "Old working collies": [
    "The first known sheepdog trial was held at Bala in north Wales in 1873, and was watched by a big crowd of farmers and visitors.",
    "The International Sheep Dog Society was founded in 1906 to improve working sheepdogs, and it still keeps the stud book for working Border Collies.",
    "A dog called Old Hemp, born in Northumberland in 1893, was such a brilliant sheepdog that he is known as the father of the Border Collie.",
    "The BBC television series One Man and His Dog, first shown in 1976, made sheepdog trials famous across Britain.",
    "Nobody is sure where the word collie comes from. One idea is that it comes from an old Scots word for the black-faced sheep the dogs herded.",
  ],
  "Old fell Terriers": [
    "In the Lake District, fell packs hunt on foot across the steep fells, and tough fell terriers were bred to work with them.",
    "The Patterdale Terrier is named after the village of Patterdale in the Lake District, where hardy black working terriers were bred.",
    "Fell terriers were bred with narrow chests so they could squeeze into the rocky gaps among borrans, the heaps of boulders on the fellsides.",
    "The Patterdale Terrier is not recognised by the Kennel Club. It is bred for work rather than for looks, so Patterdales vary a lot in appearance.",
    "The Lakeland Terrier, a tidier cousin of the old fell terriers, was recognised by the Kennel Club in the 1920s.",
  ],
  "Carriage guard dogs": [
    "Carriage dogs, especially Dalmatians, ran alongside or beneath horse-drawn coaches, clearing the way and guarding the horses and luggage at inns overnight.",
    "Carriage dogs often slept in the stables with the horses, and were thought to calm them and keep thieves away.",
    "In America, Dalmatians ran ahead of horse-drawn fire engines to clear the streets, which is why Dalmatians are still linked with fire stations.",
    "In Georgian and Victorian Britain, a smart Dalmatian trotting beside a fine carriage was a sign of a wealthy household.",
    "Carriage dogs needed great stamina, as they might run many miles a day alongside the horses. Dalmatians are still known for their endless energy.",
  ],
  "Old German Ratters": [
    "The Affenpinscher's name means monkey terrier in German, because of its cheeky, monkey-like face.",
    "German coaching inns and stables kept small pinscher-type ratters to keep down the rats that ate the horses' food.",
    "The German Pinscher almost died out after the Second World War. It was saved in the 1950s by a breeder called Werner Jung, who searched for the last dogs.",
    "Myth: The Miniature Pinscher is a small version of the Dobermann. The truth: It is a much older breed of German ratter, and only looks like a tiny Dobermann.",
    "In 2013 an Affenpinscher called Banana Joe won Best in Show at America's Westminster Kennel Club Dog Show, the first of his breed to do so.",
  ],
  "Old hunting dogs of the Celts": [
    "The early Irish Brehon laws set out fines for injuring or killing another person's hound, showing how valuable hunting dogs were.",
    "In Irish legend, the hero Fionn mac Cumhaill had two great hounds, Bran and Sceólang, who were said to be his cousins under a magic spell.",
    "The Greek writer Strabo wrote that the Celts of Gaul used dogs in war as well as in hunting, and that some of their best dogs came from Britain.",
    "The Irish word cú means hound, and it appears in the names of many ancient Irish heroes, as a sign of courage and loyalty.",
    "The old hunting dogs of the Celts are among the ancestors of today's Irish Wolfhound, Scottish Deerhound and Greyhound.",
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
  // Batch 24 (J18-286): Rottweiler.
  { match: "The Rottweiler is named after the German town of Rottweil", q: "Where does the name of the town of Rottweil come from?", options: ["The red tiles of a Roman villa", "A rotten wheel", "A red river"], answer: 0, evidence: "red roof tiles" },
  { match: "The Rottweiler was once called the Rottweiler Metzgerhund", q: "What did butchers tie around their Rottweiler's neck?", options: ["Their money purse", "A bell", "A string of sausages"], answer: 0, evidence: "money purse" },
  { match: "When railways arrived in the mid-1800s, cattle no longer needed", q: "How many Rottweilers came to the Heilbronn dog show in 1882?", options: ["Only one", "About a hundred", "Over a thousand"], answer: 0, evidence: "only one Rottweiler" },
  { match: "The Rottweiler was saved by a new job", q: "What job saved the Rottweiler in 1910?", options: ["Police dog", "Circus dog", "Sheepdog"], answer: 0, evidence: "police breeds" },
  { match: "Rottweilers were first shown in Britain at Crufts in 1936", q: "In which year were Rottweilers first shown at Crufts?", options: ["1936", "1836", "2006"], answer: 0, evidence: "in 1936" },
  // Batch 25 (J18-287): Basset Hound.
  { match: "The Basset Hound's name comes from the French word bas", q: "What does the French word bas mean?", options: ["Low", "Big", "Sad"], answer: 0, evidence: "meaning low" },
  { match: "The first Basset Hounds known in Britain arrived in 1866", q: "What were Lord Galway's first two Basset Hounds called?", options: ["Basset and Belle", "Bill and Ben", "Bob and Bess"], answer: 0, evidence: "Basset and Belle" },
  { match: "Sir Everett Millais, son of the famous painter", q: "Who is called the father of the Basset Hound in England?", options: ["Sir Everett Millais", "Charles Dickens", "Lord Nelson"], answer: 0, evidence: "Sir Everett Millais" },
  { match: "In the 1890s, worried that British Basset Hounds were too closely related", q: "What was the Bloodhound in the 1890s Basset Hound cross called?", options: ["Inoculation", "Injection", "Medicine"], answer: 0, evidence: "called Inoculation" },
  { match: "Princess Alexandra, later Queen Alexandra, made the Basset Hound fashionable", q: "Where did Princess Alexandra keep her pack of Basset Hounds?", options: ["Sandringham", "Balmoral", "Windsor Castle"], answer: 0, evidence: "at Sandringham" },
  // Batch 26 (J18-288): Bichon Frise.
  { match: "The Bichon Frise's full French name is Bichon à Poil Frisé", q: "What does frisé mean in the Bichon Frise's name?", options: ["Curly", "Frozen", "Fluffy"], answer: 0, evidence: "curly" },
  { match: "The Bichon Frise nearly disappeared twice", q: "What was the first Bichon Frise in the French stud book called?", options: ["Ida", "Fifi", "Belle"], answer: 0, evidence: "called Ida" },
  { match: "The Bichon Frise reached America in 1956", q: "How many Bichons did the Picaults bring to America in 1956?", options: ["Six", "Sixty", "One"], answer: 0, evidence: "six Bichons" },
  { match: "Little white dogs like the Bichon Frise appear in paintings", q: "Which Spanish painter put little white dogs like the Bichon Frise in his pictures?", options: ["Francisco Goya", "Pablo Picasso", "Salvador Dalí"], answer: 0, evidence: "Francisco Goya" },
  // Batch 27 (J18-291): West Highland Terrier.
  { match: "Before it was the West Highland Terrier, the Westie went by several names", q: "What was the Westie called on Colonel Malcolm's estate?", options: ["The Poltalloch Terrier", "The Edinburgh Terrier", "The Loch Ness Terrier"], answer: 0, evidence: "Poltalloch Terrier" },
  { match: "The West Highland Terrier was recognised by the Kennel Club in 1907", q: "In which year did the Westie first appear at Crufts?", options: ["1907", "1807", "2007"], answer: 0, evidence: "1907" },
  { match: "The West Highland Terrier has a short, thick tail shaped like a carrot", q: "What is the Westie's strong tail said to be for?", options: ["Pulling it out of a burrow", "Swimming faster", "Scaring away birds"], answer: 0, evidence: "pull the little dog out of a burrow" },
  { match: "The West Highland Terrier's cheerful white face is one of the most famous in advertising", q: "Which dog appears with the Westie as the symbol of a Scotch whisky?", options: ["A black Scottish Terrier", "A brown Labrador", "A spotty Dalmatian"], answer: 0, evidence: "black Scottish Terrier" },
  { match: "The Malcolm family's white terriers at Poltalloch", q: "What are the old Poltalloch kennels used as today?", options: ["A family home", "A museum", "A hotel"], answer: 0, evidence: "family home" },
  // Batch 28 (J18-292): Springer Spaniel.
  { match: "The Springer Spaniel and the Cocker Spaniel were once born in the same litters", q: "How were Springer and Cocker puppies once sorted?", options: ["By their weight", "By their colour", "By their bark"], answer: 0, evidence: "sorted by weight" },
  { match: "The Springer Spaniel has one of the longest family records", q: "What was the Boughey family's first Springer Spaniel called?", options: ["Mop 1", "Bucket 1", "Brush 1"], answer: 0, evidence: "Mop 1" },
  { match: "The Kennel Club recognised the English Springer Spaniel as a breed of its own in 1902", q: "In which year did the Kennel Club recognise the English Springer Spaniel?", options: ["1902", "1802", "2002"], answer: 0, evidence: "in 1902" },
  { match: "The Springer Spaniel's tireless nose and love of searching", q: "What do sniffer Springer Spaniels treat every search as?", options: ["A game", "A chore", "A race"], answer: 0, evidence: "as a game" },
  // Batch 28 (J18-292): Irish Wolfhound.
  { match: "The greatest hero of Irish legend is named after an Irish Wolfhound-type dog", q: "What does the name Cú Chulainn mean?", options: ["The Hound of Culann", "The Wolf of Ireland", "The Giant of Culann"], answer: 0, evidence: "Hound of Culann" },
  { match: "Irish Wolfhounds were once such prized gifts", q: "Who banned sending Irish Wolfhounds abroad in 1652?", options: ["Oliver Cromwell", "King Henry VIII", "Queen Victoria"], answer: 0, evidence: "Oliver Cromwell" },
  { match: "The Irish Wolfhound was brought back from the edge of extinction", q: "Who brought the Irish Wolfhound back from near extinction?", options: ["Captain George Augustus Graham", "Sir Walter Scott", "Charles Darwin"], answer: 0, evidence: "Captain George Augustus Graham" },
  { match: "Since 1902 the Irish Wolfhound has been the mascot of the Irish Guards", q: "Which regiment has an Irish Wolfhound as its mascot?", options: ["The Irish Guards", "The Royal Navy", "The Scots Guards"], answer: 0, evidence: "Irish Guards" },
  { match: "The Irish Wolfhound is the tallest dog breed in the world", q: "What is the Irish Wolfhound the tallest of?", options: ["All dog breeds", "All hounds in Ireland", "Only puppies"], answer: 0, evidence: "tallest dog breed in the world" },
  // Batch 28 (J18-292): Chihuahua.
  { match: "The Chihuahua is named after Chihuahua, a state in northern Mexico", q: "What is the Chihuahua named after?", options: ["A state in Mexico", "A Mexican king", "A type of chilli"], answer: 0, evidence: "a state in northern Mexico" },
  { match: "The first Chihuahua registered by the American Kennel Club", q: "What was the first Chihuahua registered in America called?", options: ["Midget", "Tiny", "Speck"], answer: 0, evidence: "called Midget" },
  { match: "The Chihuahua is the smallest dog breed in the world", q: "How tall was Pearl, the shortest living dog, in 2023?", options: ["9.14cm", "91.4cm", "19cm"], answer: 0, evidence: "9.14cm" },
  { match: "The Chihuahua comes in two coats", q: "Where do Chihuahuas famously like to burrow?", options: ["Under blankets and cushions", "In sandpits", "Down rabbit holes"], answer: 0, evidence: "burrowing under blankets" },
  // Batch 28 (J18-292): Afghan Hound.
  { match: "The first famous Afghan Hound in Britain was Zardin", q: "Who asked to see Zardin at Buckingham Palace?", options: ["Queen Alexandra", "Queen Victoria", "King Henry VIII"], answer: 0, evidence: "Queen Alexandra" },
  { match: "Today's Afghan Hounds come from two groups of dogs", q: "Where did Mary Amps bring her Ghazni dogs from?", options: ["Kabul", "Paris", "Cairo"], answer: 0, evidence: "from Kabul" },
  { match: "In 2005 an Afghan Hound puppy called Snuppy", q: "What was Snuppy the first dog ever to be?", options: ["Cloned", "Sent into space", "On television"], answer: 0, evidence: "cloned" },
  { match: "The artist Pablo Picasso loved his Afghan Hound", q: "What was Barbie's Afghan Hound called?", options: ["Beauty", "Fluffy", "Princess"], answer: 0, evidence: "called Beauty" },
  // Batch 28 (J18-292): Dachshund.
  { match: "The Dachshund came to Britain in the 1840s as a royal present", q: "Who were the first Dachshunds in Britain sent to?", options: ["Prince Albert", "King George III", "Charles Dickens"], answer: 0, evidence: "Prince Albert" },
  { match: "Queen Victoria loved her Dachshunds", q: "What did Queen Victoria say a Dachshund turns a home into?", options: ["A castle", "A zoo", "A palace"], answer: 0, evidence: "into a castle" },
  { match: "The Dachshund Club was founded in England in 1881", q: "Where was the first Dachshund club founded?", options: ["England", "Germany", "France"], answer: 0, evidence: "founded in England" },
  { match: "During the First World War, the Dachshund suffered for being German", q: "What did some Americans call their Dachshunds in the First World War?", options: ["Liberty hounds", "Freedom dogs", "Peace pups"], answer: 0, evidence: "liberty hounds" },
  // Batch 28 (J18-292): Boxer.
  { match: "Nobody knows for certain where the Boxer's name comes from", q: "How do Boxers play that may have given them their name?", options: ["Batting with their front paws", "Rolling in boxes", "Jumping over fences"], answer: 0, evidence: "front paws" },
  { match: "The first Boxer club was founded in Munich, Germany, in 1895", q: "In which city was the first Boxer club founded?", options: ["Munich", "London", "Paris"], answer: 0, evidence: "Munich" },
  { match: "The most important Boxer breeder of all was a woman, Friederun Stockmann", q: "What did Friederun Stockmann go to Munich to study?", options: ["Art", "Medicine", "Music"], answer: 0, evidence: "study art" },
  { match: "Boxers served in both world wars as messenger dogs", q: "Which Boxer won Best in Show at Westminster in 1951?", options: ["Bang Away", "Knock Out", "Punch Line"], answer: 0, evidence: "Bang Away" },
  // J18-311: questions for the topic facts, part 1 (guide dogs to wolves). Answers are in each fact (evidence).
  { match: "Britain's first four guide dogs", q: "What breed were Britain's first four guide dogs?", options: ["German Shepherds","Labradors","Poodles"], answer: 0, evidence: "German Shepherds" },
  { match: "Britain's guide dogs began in a", q: "Where were Britain's first guide dogs trained?", options: ["In a lock-up garage","In a castle","On a ship"], answer: 0, evidence: "lock-up garage" },
  { match: "The Guide Dogs for the Blind Association", q: "Where did Captain Liakhoff, the first permanent guide dog trainer, come from?", options: ["Russia","France","Canada"], answer: 0, evidence: "Russian army officer" },
  { match: "The world's first guide dog school", q: "In which country did the world's first guide dog school open?", options: ["Germany","Spain","Japan"], answer: 0, evidence: "Germany" },
  { match: "America's first famous guide dog", q: "What was Morris Frank's guide dog really called before he renamed her Buddy?", options: ["Kiss","Hug","Wink"], answer: 0, evidence: "really called Kiss" },
  { match: "The Seeing Eye, the famous American", q: "Where does the name The Seeing Eye come from?", options: ["A line in the Bible","A song","A poem about owls"], answer: 0, evidence: "line in the Bible" },
  { match: "A guide dog does not know where", q: "Who decides where a guide dog team is going?", options: ["The person","The dog","A satnav"], answer: 0, evidence: "The person plans the route" },
  { match: "Guide dogs cannot tell a red traffic", q: "Can guide dogs tell a red traffic light from a green one?", options: ["Yes","No"], answer: 1, evidence: "cannot tell a red traffic light" },
  { match: "A guide dog wears a harness with", q: "What does a guide dog's harness have for the owner to hold?", options: ["A stiff handle","A long rope","A bell"], answer: 0, evidence: "stiff handle" },
  { match: "Before training, a guide dog puppy", q: "What are the volunteer families who look after guide dog puppies called?", options: ["Puppy raisers","Puppy racers","Pup keepers"], answer: 0, evidence: "puppy raisers" },
  { match: "Most guide dogs in Britain today", q: "Which breeds are most of Britain's guide dogs today?", options: ["Labradors and Golden Retrievers","Chihuahuas and Pugs","Greyhounds and Whippets"], answer: 0, evidence: "Labradors, Golden Retrievers" },
  { match: "Under British law, shops, restaurants", q: "Which law protects the right of guide dog owners to go into shops and taxis?", options: ["The Equality Act 2010","The Dog Act 1066","The Harness Law 1999"], answer: 0, evidence: "Equality Act 2010" },
  { match: "You should never stroke, feed or", q: "What should you do before saying hello to a guide dog?", options: ["Ask the owner first","Give it a biscuit","Call its name"], answer: 0, evidence: "ask the owner first" },
  { match: "Guide dogs usually retire at around", q: "At about what age do guide dogs usually retire?", options: ["Ten","Three","Twenty"], answer: 0, evidence: "around ten years old" },
  { match: "Puppies in the same guide dog litter", q: "How are puppies in the same guide dog litter often named?", options: ["With the same first letter","After planets","With numbers"], answer: 0, evidence: "same letter" },
  { match: "A wall painting found in the ruins", q: "Which buried Roman town may show a blind man led by a dog?", options: ["Herculaneum","Hadrian's Wall","Londinium"], answer: 0, evidence: "Herculaneum" },
  { match: "A statue of a guide dog stands", q: "In which town does a statue mark Britain's first guide dogs?", options: ["Wallasey","Whitby","Windsor"], answer: 0, evidence: "Wallasey" },
  { match: "The idea for The Seeing Eye began", q: "How did Morris Frank first hear about guide dogs?", options: ["A magazine article","A radio show","A film"], answer: 0, evidence: "magazine article" },
  { match: "The charity Medical Detection Dogs", q: "What did Dr Claire Guest's dog Daisy alert her to?", options: ["An early breast cancer","A gas leak","A lost key"], answer: 0, evidence: "early breast cancer" },
  { match: "Medical detection dogs do two different", q: "Where do bio-detection dogs work?", options: ["In a laboratory","On a farm","At an airport"], answer: 0, evidence: "laboratory" },
  { match: "In a study published in 2025, two", q: "Which illness did Bumper and Peanut learn to smell?", options: ["Parkinson's disease","Chickenpox","Hay fever"], answer: 0, evidence: "Parkinson's disease" },
  { match: "Bio-detection dogs often work at", q: "What is the row of sample stands a detection dog sniffs along called?", options: ["A scent carousel","A sniff-o-matic","A smell ladder"], answer: 0, evidence: "scent carousel" },
  { match: "Illness can change a person's smell", q: "What are the tiny chemicals our bodies give off called?", options: ["Volatile organic compounds","Vanishing orange crystals","Very old chemicals"], answer: 0, evidence: "volatile organic compounds" },
  { match: "A dog's nose has up to 300 million", q: "About how many scent receptors can a dog's nose have?", options: ["300 million","3 thousand","30"], answer: 0, evidence: "300 million" },
  { match: "In 2020 and 2021, dogs trained", q: "Which illness were dogs shown to sniff out in 2020 and 2021?", options: ["COVID-19","Measles","Mumps"], answer: 0, evidence: "COVID-19" },
  { match: "In a 2018 study, dogs were trained", q: "What did dogs sniff to find children with malaria?", options: ["Socks","Hats","Pencils"], answer: 0, evidence: "socks" },
  { match: "In the Netherlands, a Beagle called", q: "What breed was Cliff, who sniffed out a hospital stomach bug?", options: ["Beagle","Boxer","Bulldog"], answer: 0, evidence: "Beagle" },
  { match: "Some dogs are trained to warn people", q: "Which charity in Sheffield trains seizure alert dogs?", options: ["Support Dogs","Sheffield Sniffers","Paws Up"], answer: 0, evidence: "Support Dogs" },
  { match: "Diabetes alert dogs can smell when", q: "What can a diabetes alert dog smell?", options: ["Blood sugar going too low or too high","Rain coming","Burnt toast"], answer: 0, evidence: "blood sugar" },
  { match: "Some medical alert dogs help people", q: "What might an allergy alert dog sniff out?", options: ["Nuts","Socks","Soap"], answer: 0, evidence: "nuts" },
  { match: "Myth: A dog can diagnose your cancer", q: "Do doctors use dogs to diagnose cancer?", options: ["Yes","No"], answer: 1, evidence: "not used by doctors to diagnose" },
  { match: "Trials with dogs have been run", q: "Which hospital has run a dog trial on prostate cancer?", options: ["Milton Keynes University Hospital","Hogwarts Infirmary","St Barks"], answer: 0, evidence: "Milton Keynes University Hospital" },
  { match: "According to Medical Detection", q: "A dog noticing a smell at parts per trillion is like spotting a teaspoon of sugar in what?", options: ["Two Olympic swimming pools","A cup of tea","A bath"], answer: 0, evidence: "two Olympic-sized swimming pools" },
  { match: "To a medical detection dog, the", q: "What does a medical detection dog get when it finds the special smell?", options: ["A reward","A medal","A haircut"], answer: 0, evidence: "reward" },
  { match: "Medical alert dogs are assistance", q: "What do medical alert dogs wear to show they are working?", options: ["A jacket","A hat","Sunglasses"], answer: 0, evidence: "jacket" },
  { match: "Scientists are trying to build", q: "What are scientists trying to build that copies a dog's nose?", options: ["Electronic noses","Robot tails","Sniffing hats"], answer: 0, evidence: "electronic noses" },
  { match: "Britain's mountain search dogs began with", q: "Which mountain rescue leader started Britain's mountain search dogs?", options: ["Hamish MacInnes","Hamish McHaggis","Harry Mountain"], answer: 0, evidence: "Hamish MacInnes" },
  { match: "Hamish MacInnes could not take", q: "What were Hamish MacInnes's two German Shepherds called?", options: ["Rangi and Tiki","Rex and Rover","Snow and Ice"], answer: 0, evidence: "Rangi and Tiki" },
  { match: "The first national training course", q: "Where was the first national training course for British mountain rescue dogs held?", options: ["Glencoe","Blackpool","Brighton"], answer: 0, evidence: "Glencoe" },
  { match: "The Search and Rescue Dog Association", q: "What is the Search and Rescue Dog Association known as?", options: ["SARDA","SNIFFA","DOGGO"], answer: 0, evidence: "SARDA" },
  { match: "Early British search dogs were", q: "In the old grading, which letter was given to a dog that had found someone on a real call-out?", options: ["C","A","Z"], answer: 0, evidence: "C for a dog" },
  { match: "Hamish MacInnes, who started Britain's", q: "What did Hamish MacInnes invent?", options: ["The first all-metal ice axe","The first dog lead","The first sledge"], answer: 0, evidence: "all-metal ice axe" },
  { match: "Some search dogs are trailing dogs", q: "What is a trailing dog given before it starts searching?", options: ["Something the missing person has worn or touched","A map","A whistle"], answer: 0, evidence: "worn or touched" },
  { match: "Avalanche dogs can find people", q: "What can avalanche dogs find?", options: ["People buried under snow","Lost gloves","Snowmen"], answer: 0, evidence: "buried under snow" },
  { match: "Search dogs are trained with the", q: "To a search dog, training is like which game?", options: ["Hide and seek","Snakes and ladders","Musical chairs"], answer: 0, evidence: "hide and seek" },
  { match: "A search dog working at night usually", q: "What might a search dog wear on its collar at night?", options: ["A light and a bell","A crown","A scarf"], answer: 0, evidence: "a light" },
  { match: "During the Blitz in London, a stray", q: "Who took in the Blitz rescue dog Rip?", options: ["An air raid warden","A king","A baker"], answer: 0, evidence: "air raid warden" },
  { match: "Beauty, a Wire Fox Terrier who", q: "How many animals is Beauty said to have found under bombed buildings?", options: ["63","6","600"], answer: 0, evidence: "63 animals" },
  { match: "Some British fire and rescue services", q: "After which country's 2023 earthquake did UK search dogs help?", options: ["Turkey","Iceland","Canada"], answer: 0, evidence: "Turkey in 2023" },
  { match: "Water search dogs can work from", q: "Where can water search dogs work from?", options: ["A boat","A plane","A bus"], answer: 0, evidence: "from a boat" },
  { match: "Mountain and lowland search dogs", q: "Are British search dogs trained to ignore sheep and deer?", options: ["Yes","No"], answer: 0, evidence: "ignore sheep, deer" },
  { match: "Most search and rescue dogs in", q: "Where do most British search and rescue dogs live?", options: ["At home with their handlers","In a police station","On mountains"], answer: 0, evidence: "family pets with their handlers" },
  { match: "An emotional support dog is a pet", q: "Is an emotional support dog trained to do special tasks?", options: ["Yes","No"], answer: 1, evidence: "not trained to do special tasks" },
  { match: "Therapy dogs visit hospitals, care", q: "Where might a therapy dog visit?", options: ["Hospitals and care homes","Space stations","Submarines"], answer: 0, evidence: "hospitals, care homes" },
  { match: "The charity Pets As Therapy was", q: "When was the charity Pets As Therapy founded?", options: ["1983","1883","2023"], answer: 0, evidence: "1983" },
  { match: "Stroking a friendly dog can make", q: "Which calming hormone can stroking a dog release?", options: ["Oxytocin","Octopin","Toastin"], answer: 0, evidence: "oxytocin" },
  { match: "In 2015, scientists in Japan found", q: "What made oxytocin rise in dogs and owners in a 2015 study?", options: ["Gazing into each other's eyes","Eating cake","Running a race"], answer: 0, evidence: "gazed into each other's eyes" },
  { match: "Some schools and libraries run", q: "How can reading to a dog help children?", options: ["It builds their confidence","It makes them taller","It makes the dog read"], answer: 0, evidence: "more confident" },
  { match: "In 2016, scientists from the University", q: "Which university showed that dogs can recognise human emotions?", options: ["University of Lincoln","University of Barkshire","University of Mars"], answer: 0, evidence: "University of Lincoln" },
  { match: "Mental health assistance dogs are", q: "Do mental health assistance dogs have legal rights of access in Britain?", options: ["Yes","No"], answer: 0, evidence: "do have legal rights of access" },
  { match: "Hearing Dogs for Deaf People was", q: "What colour coats do Hearing Dogs wear?", options: ["Burgundy","Bright green","Silver"], answer: 0, evidence: "burgundy" },
  { match: "Many universities invite therapy", q: "When do many universities invite therapy dogs onto campus?", options: ["At exam time","At Christmas only","On sports day"], answer: 0, evidence: "exam time" },
  { match: "Any breed can be an emotional support", q: "Which breeds can be emotional support dogs?", options: ["Any breed","Only Labradors","Only small dogs"], answer: 0, evidence: "Any breed" },
  { match: "In the United States, emotional", q: "From 2021, which animals do US airlines have to accept in the cabin?", options: ["Trained service dogs","Emotional support peacocks","Any pet"], answer: 0, evidence: "trained service dogs" },
  { match: "Visits from therapy dogs can help", q: "Who can therapy dog visits help in care homes?", options: ["People living with dementia","Pilots","Footballers"], answer: 0, evidence: "dementia" },
  { match: "A therapy dog's visits are short", q: "Why are a therapy dog's visits kept short?", options: ["Comforting strangers is tiring","Dogs get bored of chairs","Hospitals close early"], answer: 0, evidence: "tiring" },
  { match: "Pets As Therapy also runs a reading", q: "What is the Pets As Therapy reading scheme called?", options: ["Read2Dogs","Paws4Books","BarkReads"], answer: 0, evidence: "Read2Dogs" },
  { match: "Winston Churchill's wartime dog", q: "What was Winston Churchill's wartime Poodle called?", options: ["Rufus","Rover","Rex"], answer: 0, evidence: "Rufus" },
  { match: "Rufus, Churchill's Poodle, went", q: "Which American President did Rufus travel across the Atlantic to meet?", options: ["Franklin Roosevelt","George Washington","Abraham Lincoln"], answer: 0, evidence: "Franklin Roosevelt" },
  { match: "Churchill's first Poodle, Rufus", q: "What was Churchill's second Poodle called?", options: ["Rufus II","Rover II","Doodle"], answer: 0, evidence: "Rufus II" },
  { match: "Winston Churchill's first dog was", q: "What did young Winston Churchill sell to buy his Bulldog Dodo?", options: ["His bicycle","His hat","His books"], answer: 0, evidence: "sold his bicycle" },
  { match: "Clement Attlee, who became Prime", q: "What breed was Clement Attlee's dog Ting?", options: ["Airedale Terrier","Pug","Great Dane"], answer: 0, evidence: "Airedale Terrier" },
  { match: "Harold Wilson, Prime Minister in", q: "What was Harold Wilson's yellow Labrador called?", options: ["Paddy","Patch","Percy"], answer: 0, evidence: "Paddy" },
  { match: "In 2019, Boris Johnson and his", q: "What was the name of Boris Johnson's Jack Russell cross?", options: ["Dilyn","Dylan","Delia"], answer: 0, evidence: "Dilyn" },
  { match: "Dilyn, Boris Johnson's dog, was", q: "Why could Dilyn's puppy farm not sell him?", options: ["His jaw was crooked","He was too big","He could talk"], answer: 0, evidence: "jaw was crooked" },
  { match: "Dilyn's owners used his story to", q: "What is the rule that stops pet shops selling puppies they did not breed called?", options: ["Lucy's Law","Larry's Law","Dilyn's Rule"], answer: 0, evidence: "Lucy's Law" },
  { match: "When Dilyn the dog moved into Downing", q: "What is the name of the Downing Street cat?", options: ["Larry","Garry","Harry"], answer: 0, evidence: "Larry" },
  { match: "Rishi Sunak brought Nova, a fox", q: "What was Rishi Sunak's fox red Labrador called?", options: ["Nova","Nova-Rova","Nancy"], answer: 0, evidence: "Nova" },
  { match: "Nova the Labrador made her first", q: "What did Nova get a special version of from the Royal British Legion?", options: ["A poppy dog collar","A medal","A hat"], answer: 0, evidence: "poppy dog collar" },
  { match: "Nova, Rishi Sunak's Labrador, and", q: "Who usually won when Nova and Larry the cat fell out?", options: ["Larry","Nova","It was always a draw"], answer: 0, evidence: "Larry usually won" },
  { match: "Larry, the Downing Street cat, came from Battersea Dogs and Cats Home, the famou", q: "Where did Larry the Downing Street cat come from?", options: ["Battersea Dogs and Cats Home","A pet shop","The Tower of London"], answer: 0, evidence: "Battersea Dogs and Cats Home" },
  { match: "The British War Dog School was", q: "Where was the British War Dog School based?", options: ["Shoeburyness in Essex","Brighton","Aberdeen"], answer: 0, evidence: "Shoeburyness" },
  { match: "In the First World War, messenger", q: "Where did First World War messenger dogs carry their messages?", options: ["In tins on their collars","In their mouths","Under their tails"], answer: 0, evidence: "tins on their collars" },
  { match: "Bing, an Alsatian and Collie cross", q: "What was Bing the paradog's real name?", options: ["Brian","Barry","Bob"], answer: 0, evidence: "real name was Brian" },
  { match: "Bing the paradog jumped into Normandy", q: "On which famous day did Bing jump into Normandy?", options: ["D-Day","Christmas Day","Bonfire Night"], answer: 0, evidence: "D-Day" },
  { match: "Army paradogs had their own harness", q: "What did paradogs expect when they landed?", options: ["A tasty reward","A bath","A nap"], answer: 0, evidence: "tasty reward" },
  { match: "After D-Day, army dogs worked with", q: "Why were dogs useful for finding some landmines after D-Day?", options: ["Some mines had no metal","Dogs could dig faster","Mines smelled of sausages"], answer: 0, evidence: "without metal" },
  { match: "Judy, a Pointer, was the ship's", q: "What breed was Judy, the ship's dog held in a prison camp?", options: ["Pointer","Poodle","Pug"], answer: 0, evidence: "Pointer" },
  { match: "Theo, an English Springer Spaniel", q: "What breed was Theo, who searched for bombs in Afghanistan?", options: ["English Springer Spaniel","Dalmatian","Beagle"], answer: 0, evidence: "English Springer Spaniel" },
  { match: "The Dickin Medal is a bronze medal", q: "What do the colours on the Dickin Medal ribbon stand for?", options: ["Water, earth and air","Fire, ice and snow","Day, night and dusk"], answer: 0, evidence: "water, earth and air" },
  { match: "The Dickin Medal was created in", q: "Which animals won the very first Dickin Medals?", options: ["Pigeons","Horses","Cats"], answer: 0, evidence: "three pigeons" },
  { match: "Kuno, a Belgian Malinois, served", q: "What was Kuno fitted with after being injured?", options: ["Artificial paws","A new tail","Wings"], answer: 0, evidence: "artificial paws" },
  { match: "Britain's military dogs are trained", q: "Where are Britain's military dogs trained?", options: ["Melton Mowbray","Milton Keynes","Morecambe"], answer: 0, evidence: "Melton Mowbray" },
  { match: "The Animals in War Memorial in", q: "What words are on the Animals in War Memorial?", options: ["They had no choice","Good dogs all","Paws for thought"], answer: 0, evidence: "They had no choice" },
  { match: "Military dogs often retire at around", q: "Where do many retired military dogs go to live?", options: ["With their old handler","In a palace","At the zoo"], answer: 0, evidence: "old handler" },
  { match: "Laika was the first animal ever", q: "What was the name of the spacecraft that carried Laika?", options: ["Sputnik 2","Apollo 11","Rover 1"], answer: 0, evidence: "Sputnik 2" },
  { match: "Laika was a stray dog found on", q: "Where was Laika found?", options: ["On the streets of Moscow","In a pet shop","On a farm in Wales"], answer: 0, evidence: "streets of Moscow" },
  { match: "Myth: Laika lived happily in orbit", q: "Did Laika come back from space?", options: ["Yes","No"], answer: 1, evidence: "never any plan to bring her home" },
  { match: "The name Laika means barker in", q: "What does the name Laika mean in Russian?", options: ["Barker","Flyer","Sleeper"], answer: 0, evidence: "barker" },
  { match: "In 2008 a monument to Laika was", q: "What does the 2008 monument to Laika show her standing on?", options: ["A rocket","The Moon","A kennel"], answer: 0, evidence: "top of a rocket" },
  { match: "The first dogs to go into space", q: "Which two dogs were the first to go into space and come back alive?", options: ["Dezik and Tsygan","Belka and Strelka","Rex and Rover"], answer: 0, evidence: "Dezik and Tsygan" },
  { match: "In August 1960 two dogs, Belka", q: "Which two dogs orbited the Earth in 1960 and came home safely?", options: ["Belka and Strelka","Ant and Dec","Salt and Pepper"], answer: 0, evidence: "Belka and Strelka" },
  { match: "One of Strelka's puppies, called", q: "Who was given Strelka's puppy Pushinka as a present?", options: ["Caroline Kennedy","The Queen","Elvis Presley"], answer: 0, evidence: "Caroline Kennedy" },
  { match: "In 1966 two Soviet dogs, Veterok", q: "How many days did Veterok and Ugolyok spend in orbit?", options: ["22","2","222"], answer: 0, evidence: "22 days" },
  { match: "Just weeks before Yuri Gagarin", q: "What does the space dog name Zvezdochka mean?", options: ["Little Star","Big Moon","Fast Rocket"], answer: 0, evidence: "Little Star" },
  { match: "In March 1961, a dog called Chernushka", q: "Who flew with Chernushka in 1961?", options: ["A dummy cosmonaut","A cat","A chimpanzee"], answer: 0, evidence: "dummy cosmonaut" },
  { match: "While the Soviet Union sent dogs", q: "Which animals did the USA mainly use on early test flights?", options: ["Monkeys and chimpanzees","Dogs","Parrots"], answer: 0, evidence: "monkeys and chimpanzees" },
  { match: "Astro, the Great Dane in the 1960s", q: "What breed is Astro in The Jetsons?", options: ["Great Dane","Chihuahua","Poodle"], answer: 0, evidence: "Great Dane" },
  { match: "In A Grand Day Out, the first Wallace", q: "Why did Wallace want to fly to the Moon in A Grand Day Out?", options: ["He heard it was made of cheese","To find Gromit","To play golf"], answer: 0, evidence: "made of cheese" },
  { match: "K-9 is a robot dog in the British", q: "Where does K-9, the robot dog in Doctor Who, keep his laser gun?", options: ["In his nose","In his tail","In his collar"], answer: 0, evidence: "laser gun in his nose" },
  { match: "In May 1969, the Apollo 10 astronauts", q: "What did the Apollo 10 astronauts nickname their lunar module?", options: ["Snoopy","Scooby","Pluto"], answer: 0, evidence: "Snoopy" },
  { match: "Space Buddies is a 2009 Disney", q: "What breed are the puppies in Disney's Space Buddies?", options: ["Golden Retrievers","Dalmatians","Pugs"], answer: 0, evidence: "Golden Retriever" },
  { match: "Something that looks like a dog's", q: "If something looks like a dog's dinner, what is it?", options: ["A mess","Delicious","Very tidy"], answer: 0, evidence: "a mess" },
  { match: "To work like a dog means to work", q: "What does working like a dog mean?", options: ["Working very hard","Barking at work","Sleeping all day"], answer: 0, evidence: "work very hard" },
  { match: "Myth: It's raining cats and dogs", q: "Do we know where the phrase raining cats and dogs comes from?", options: ["Yes","No"], answer: 1, evidence: "Nobody knows" },
  { match: "Let sleeping dogs lie means do", q: "Which old poet wrote that it is not good to wake a sleeping dog?", options: ["Geoffrey Chaucer","William Wordsworth","Roald Dahl"], answer: 0, evidence: "Geoffrey Chaucer" },
  { match: "The dog days are the hottest days", q: "Which star are the dog days of summer linked to?", options: ["Sirius, the Dog Star","The North Star","The Sun"], answer: 0, evidence: "Sirius" },
  { match: "Every dog has its day means everyone", q: "Which Shakespeare play uses every dog has its day?", options: ["Hamlet","Macbeth","The Tempest"], answer: 0, evidence: "Hamlet" },
  { match: "Barking up the wrong tree means", q: "What does barking up the wrong tree mean?", options: ["Looking in the wrong place","Being too noisy","Climbing badly"], answer: 0, evidence: "looking in the wrong place" },
  { match: "If you are in the doghouse, someone", q: "In Peter Pan, where does Mr Darling live after treating Nana badly?", options: ["In her kennel","In a tree house","On a pirate ship"], answer: 0, evidence: "lives in her kennel" },
  { match: "A dog-eared book has page corners", q: "What is a dog-eared book?", options: ["One with folded page corners","One chewed by a dog","One about dogs"], answer: 0, evidence: "folded down" },
  { match: "The top dog is the winner, and", q: "Who is the underdog?", options: ["The one expected to lose","The winner","The smallest dog"], answer: 0, evidence: "expected to lose" },
  { match: "A dogsbody is someone who does", q: "In the Royal Navy, what was dogsbody first slang for?", options: ["Pease pudding","Sea biscuits","Old socks"], answer: 0, evidence: "pease pudding" },
  { match: "A dog in the manger is someone", q: "In Aesop's fable, which animal does the dog in the manger snap at?", options: ["An ox","A cat","A horse"], answer: 0, evidence: "ox" },
  { match: "Let the dog see the rabbit is a", q: "What does let the dog see the rabbit mean?", options: ["Give someone space to do the job","Show off your pet","Go hunting"], answer: 0, evidence: "give someone space" },
  { match: "To see a man about a dog is a polite", q: "What is to see a man about a dog?", options: ["A polite excuse for leaving","A trip to the vet","A dog show"], answer: 0, evidence: "polite excuse" },
  { match: "A dog-eat-dog world is one where", q: "What kind of world is a dog-eat-dog world?", options: ["Everyone out for themselves","Everyone kind","Everyone hungry"], answer: 0, evidence: "out for themselves" },
  { match: "A shaggy dog story is a long, rambling", q: "What is a shaggy dog story?", options: ["A long, rambling joke with a silly ending","A true story","A story about a hairy dog"], answer: 0, evidence: "long, rambling joke" },
  { match: "A three dog night is an extremely", q: "How cold is a three dog night?", options: ["Extremely cold","Quite warm","Just right"], answer: 0, evidence: "extremely cold" },
  { match: "In Cockney rhyming slang, the dog", q: "In Cockney rhyming slang, what does dog and bone mean?", options: ["Telephone","Home","Scone"], answer: 0, evidence: "telephone" },
  { match: "A dog is for life, not just for Christmas was written in 1978 by Clarissa Baldwin of the National", q: "Which charity's slogan is A dog is for life, not just for Christmas?", options: ["Dogs Trust","The RSPCA","The Kennel Club"], answer: 0, evidence: "Dogs Trust" },
  { match: "People who fight like cat and dog", q: "Do many cats and dogs live together happily?", options: ["Yes","No"], answer: 0, evidence: "live together happily" },
  { match: "To be like a dog with two tails", q: "What does being like a dog with two tails mean?", options: ["Extremely happy","Very confused","Very tired"], answer: 0, evidence: "extremely happy" },
  { match: "A dog-leg is a sharp bend, in a", q: "What is a dog-leg?", options: ["A sharp bend","A dog's walk","A kind of sausage"], answer: 0, evidence: "sharp bend" },
  { match: "Doggerel is clumsy, badly written", q: "What is doggerel?", options: ["Badly written poetry","A small dog","A dog's bark"], answer: 0, evidence: "badly written poetry" },
  { match: "A sop to Cerberus is a small bribe", q: "How many heads did Cerberus have?", options: ["Three","Two","Seven"], answer: 0, evidence: "three-headed" },
  { match: "Winston Churchill called his times", q: "What did Winston Churchill call his times of deep sadness?", options: ["His black dog","His grey cloud","His old boot"], answer: 0, evidence: "black dog" },
  { match: "On ships, the dog watches are two", q: "How long does each dog watch last on a ship?", options: ["Two hours","Four hours","Ten minutes"], answer: 0, evidence: "two hours" },
  { match: "A dogfight is a close air battle", q: "What is a dogfight in the air?", options: ["A close battle between fighter planes","A kite contest","A storm"], answer: 0, evidence: "fighter planes" },
  { match: "Fit as a butcher's dog is a British", q: "What does fit as a butcher's dog mean?", options: ["Very fit and healthy","Very hungry","Very lazy"], answer: 0, evidence: "very fit and healthy" },
  { match: "Let slip the dogs of war comes", q: "Which Shakespeare play has let slip the dogs of war?", options: ["Julius Caesar","Romeo and Juliet","Twelfth Night"], answer: 0, evidence: "Julius Caesar" },
  { match: "Some wild plants have dog in their", q: "Which wild flower has dog in its name?", options: ["Dog rose","Dog daisy tree","Dog tulip"], answer: 0, evidence: "dog rose" },
  { match: "Man's best friend became a famous", q: "What was the dog in the man's best friend court case called?", options: ["Old Drum","Old Shep","Old Yeller"], answer: 0, evidence: "Old Drum" },
  { match: "In his 1994 book The Intelligence of Dogs, the psychologist Stanley Coren ranked breeds by how fast they learn and obey commands", q: "Which breed came first in Stanley Coren's ranking of quick learners?", options: ["Border Collie","Bulldog","Pug"], answer: 0, evidence: "Border Collie came first" },
  { match: "Stanley Coren found that the quickest-learning", q: "How many repetitions did the quickest breeds need to learn a new command?", options: ["Fewer than five","About fifty","Over a hundred"], answer: 0, evidence: "fewer than five" },
  { match: "Stanley Coren said there are three", q: "How many kinds of dog intelligence did Stanley Coren describe?", options: ["Three","Ten","One"], answer: 0, evidence: "three kinds" },
  { match: "A Border Collie called Chaser", q: "How many toy names did Chaser the Border Collie learn?", options: ["1,022","12","102,000"], answer: 0, evidence: "1,022" },
  { match: "In 2004 scientists reported that", q: "About how many toy names did Rico the Border Collie know?", options: ["About 200","About 2","About 20,000"], answer: 0, evidence: "about 200 toys" },
  { match: "Only a few dogs are gifted word", q: "Which breed are most gifted word-learning dogs?", options: ["Border Collies","Bulldogs","Chihuahuas"], answer: 0, evidence: "mostly Border Collies" },
  { match: "Dogs are brilliant at following", q: "Who finds it easier to follow a pointing finger?", options: ["Dogs","Wolves raised by people","Neither"], answer: 0, evidence: "Wolves raised by people find it much harder" },
  { match: "Stanley Coren estimated that an", q: "About how many words and signals can an average dog understand, according to Stanley Coren?", options: ["Around 165","Around 5","Around 5,000"], answer: 0, evidence: "around 165" },
  { match: "In 2016, scientists in Hungary", q: "Which machine did scientists scan dogs' brains in, while the dogs lay still?", options: ["An MRI machine","A washing machine","A photocopier"], answer: 0, evidence: "MRI machine" },
  { match: "Dogs seem to understand fairness", q: "What did dogs do when another dog got a treat for the same trick and they got nothing?", options: ["Stopped doing the trick","Did it faster","Went to sleep"], answer: 0, evidence: "stopped doing the trick" },
  { match: "A 2013 study at the University", q: "When were dogs more likely to sneak forbidden food?", options: ["When the room was dark","When music played","At breakfast"], answer: 0, evidence: "room was dark" },
  { match: "When a dog looks guilty after doing", q: "Do dogs look guilty even when they have done nothing wrong, if they are scolded?", options: ["Yes","No"], answer: 0, evidence: "whether or not they actually misbehaved" },
  { match: "Dogs often catch yawns from people", q: "What do dogs often catch from their owners?", options: ["Yawns","Colds","Hiccups"], answer: 0, evidence: "catch yawns" },
  { match: "Some dogs have been taught to press", q: "What do some dogs press to play recorded words?", options: ["Buttons","Pianos","Keyboards"], answer: 0, evidence: "press buttons" },
  { match: "A dog's brain is roughly the size", q: "About how big is a dog's brain?", options: ["The size of a lemon","The size of a pea","The size of a football"], answer: 0, evidence: "size of a lemon" },
  { match: "Clever breeds can be harder to", q: "What might a bored Border Collie herd?", options: ["Children","Cars","Clouds"], answer: 0, evidence: "herding children" },
  { match: "Some scientists think dogs can", q: "In a 2011 study, when did dogs greet their owners more excitedly?", options: ["After two hours apart","After 30 minutes apart","After 30 seconds apart"], answer: 0, evidence: "after two hours" },
  { match: "Poodles, second in Stanley Coren's", q: "What were Poodles once trained as, because they learned tricks so fast?", options: ["Circus performers","Chefs","Postmen"], answer: 0, evidence: "circus performers" },
  { match: "Stanley Coren's ranking placed", q: "Which breed came last in Stanley Coren's ranking?", options: ["Afghan Hound","Border Collie","Poodle"], answer: 0, evidence: "Afghan Hound last" },
  { match: "Dogs can learn hand signals as", q: "Why can deaf dogs be trained just as well as hearing dogs?", options: ["They can learn hand signals","They read books","They lip-read"], answer: 0, evidence: "hand signals" },
  { match: "In experiments, dogs often give", q: "Who tends to give up on an impossible puzzle and look to a person for help?", options: ["Dogs","Wolves","Foxes"], answer: 0, evidence: "dogs often give up" },
  { match: "Dogs can learn to tell toys apart", q: "Which colours can dogs see well enough to tell toys apart?", options: ["Blue and yellow","Red and green","Pink and purple"], answer: 0, evidence: "blue and yellow" },
  { match: "The Family Dog Project at Eötvös", q: "In which city is the Family Dog Project?", options: ["Budapest","Barcelona","Birmingham"], answer: 0, evidence: "Budapest" },
  { match: "Scientists have found that dogs", q: "What is the training method where a dog copies a person's action called?", options: ["Do As I Do","Simon Says","Follow the Leader"], answer: 0, evidence: "Do As I Do" },
  { match: "Training a dog with rewards, such", q: "Which works better when training a dog?", options: ["Rewards","Punishment","Shouting"], answer: 0, evidence: "work better than punishment" },
  { match: "The Labrador is seventh in Stanley", q: "Where did the Labrador come in Stanley Coren's ranking?", options: ["Seventh","First","Last"], answer: 0, evidence: "seventh" },
  { match: "Some dogs can tell when their owner", q: "What clue might tell a dog its owner is about to leave?", options: ["Picking up keys","Opening a book","Brushing teeth"], answer: 0, evidence: "picking up keys" },
  { match: "Dogs can be taught to understand", q: "How long should dog training sessions usually be?", options: ["A few minutes","Three hours","All day"], answer: 0, evidence: "a few minutes" },
  { match: "Clever dogs are not only big working", q: "Which tiny toy spaniel came eighth in Stanley Coren's ranking?", options: ["Papillon","Pug","Pekingese"], answer: 0, evidence: "Papillon" },
  { match: "Many sheepdog handlers use whistles", q: "What do many sheepdog handlers use to give commands?", options: ["Whistles","Trumpets","Drums"], answer: 0, evidence: "whistles" },
  { match: "A dog's nose print is unique, just", q: "Which part of a dog is unique, like a human fingerprint?", options: ["Its nose print","Its tail","Its bark"], answer: 0, evidence: "nose print" },
  { match: "Dogs can smell with each nostril", q: "Can a dog smell with each nostril separately?", options: ["Yes","No"], answer: 0, evidence: "each nostril separately" },
  { match: "When a dog breathes out, the air", q: "Where does the air leave a dog's nose when it breathes out?", options: ["Through slits at the side","Through its ears","Straight ahead"], answer: 0, evidence: "slits at the side" },
  { match: "Dogs have a special smell organ", q: "What is the special smell organ in the roof of a dog's mouth called?", options: ["Jacobson's organ","Johnson's organ","The sniff box"], answer: 0, evidence: "Jacobson's organ" },
  { match: "Dogs are not colour-blind, but", q: "Which colours do dogs mainly see?", options: ["Blues and yellows","Reds and greens","Only black and white"], answer: 0, evidence: "blues and yellows" },
  { match: "Dogs see better than us in dim", q: "What makes a dog's eyes glow in the dark in photos?", options: ["The tapetum lucidum","Tiny torches","Moonlight"], answer: 0, evidence: "tapetum lucidum" },
  { match: "Dogs have a third eyelid, a thin", q: "How many eyelids does a dog have on each eye?", options: ["Three","Two","One"], answer: 0, evidence: "third eyelid" },
  { match: "A dog has around 18 muscles in", q: "About how many muscles are in each of a dog's ears?", options: ["18","2","180"], answer: 0, evidence: "18 muscles" },
  { match: "Puppies are born with their eyes", q: "At about what age do puppies' eyes open?", options: ["Two weeks","Two days","Two months"], answer: 0, evidence: "two weeks" },
  { match: "A dog is pregnant for about 63", q: "How long is a dog pregnant for?", options: ["About 63 days","About nine months","About a week"], answer: 0, evidence: "63 days" },
  { match: "Puppies have 28 baby teeth, which", q: "How many adult teeth does a dog have?", options: ["42","28","100"], answer: 0, evidence: "42 adult teeth" },
  { match: "Dogs mostly cool down by panting", q: "How do dogs mostly cool down?", options: ["By panting","By sweating","By sneezing"], answer: 0, evidence: "panting" },
  { match: "Dogs dream. Like people, they have", q: "Do dogs dream?", options: ["Yes","No"], answer: 0, evidence: "Dogs dream" },
  { match: "Dogs have far fewer taste buds", q: "Who has more taste buds, dogs or people?", options: ["People","Dogs","Both the same"], answer: 0, evidence: "about 9,000 in a human" },
  { match: "A wet dog can shake off about 70", q: "How much of the water in its fur can a wet dog shake off in about four seconds?", options: ["About 70 per cent","About 7 per cent","All of it"], answer: 0, evidence: "70 per cent" },
  { match: "A study in 2007 found that dogs", q: "Which way do dogs wag their tails more when they see someone they like?", options: ["To the right","To the left","Up and down"], answer: 0, evidence: "more to the right" },
  { match: "Chocolate is poisonous to dogs", q: "Which chemical in chocolate is poisonous to dogs?", options: ["Theobromine","Vitamin C","Salt"], answer: 0, evidence: "theobromine" },
  { match: "The old rule that one dog year", q: "Is one dog year really equal to seven human years?", options: ["Yes","No"], answer: 1, evidence: "not accurate" },
  { match: "Small dogs usually live longer", q: "Which usually live longer, small dogs or big dogs?", options: ["Small dogs","Big dogs","Both the same"], answer: 0, evidence: "Small dogs usually live longer" },
  { match: "Most dogs have a wider field of", q: "About how wide is most dogs' field of view?", options: ["240 degrees","90 degrees","360 degrees"], answer: 0, evidence: "240 degrees" },
  { match: "Dogs walk on their toes. The part", q: "What is the part of a dog's back leg that looks like a backwards knee?", options: ["Its ankle","Its elbow","Its hip"], answer: 0, evidence: "really its ankle" },
  { match: "The dewclaw is a small extra toe", q: "What is the small extra toe high on a dog's leg called?", options: ["The dewclaw","The dew toe","The thumb claw"], answer: 0, evidence: "dewclaw" },
  { match: "All dogs belong to the same species", q: "Do all dogs, from a Chihuahua to a Great Dane, belong to the same species?", options: ["Yes","No"], answer: 0, evidence: "same species" },
  { match: "There are more than 340 dog breeds", q: "About how many dog breeds are recognised around the world?", options: ["More than 340","About 30","Over 10,000"], answer: 0, evidence: "more than 340" },
  { match: "Scientists have found that a single", q: "Which gene plays a big part in whether a dog is small or large?", options: ["IGF1","DOG1","BIG2"], answer: 0, evidence: "IGF1" },
  { match: "Dogs' wet noses help them smell", q: "Why does a dog's wet nose help it smell?", options: ["Mucus catches scent particles","It keeps the nose cool","It cleans the fur"], answer: 0, evidence: "catches tiny scent particles" },
  { match: "Dogs sleep a lot, often 12 to 14", q: "How many hours a day do dogs often sleep?", options: ["12 to 14","2 to 4","20 to 22"], answer: 0, evidence: "12 to 14 hours" },
  { match: "Dogs have scent glands between", q: "Where do dogs have scent glands?", options: ["Between their toes","On their ears","In their tails"], answer: 0, evidence: "between their toes" },
  { match: "A dog's sense of hearing can pick", q: "How much farther away can a dog hear sounds than a person?", options: ["About four times","About twice","About a hundred times"], answer: 0, evidence: "four times farther" },
  { match: "Trained dogs can often tell identical", q: "Can trained dogs tell identical twins apart by smell?", options: ["Yes","No"], answer: 0, evidence: "tell identical twins apart" },
  { match: "Scientists in Sweden found that", q: "What can dogs digest better than wolves, thanks to extra gene copies?", options: ["Starch","Grass","Bones"], answer: 0, evidence: "digest starch" },
  { match: "Research at the University of Portsmouth", q: "What special muscle do dogs have that wolves do not?", options: ["One to raise their inner eyebrows","One to wiggle their tails","One to close their noses"], answer: 0, evidence: "raise their inner eyebrows" },
  { match: "The Basenji, an African breed", q: "What sound does the Basenji make instead of barking?", options: ["A yodel","A squeak","A moo"], answer: 0, evidence: "yodelling" },
  { match: "The RSPCA is the oldest animal", q: "In what kind of place was the RSPCA founded in 1824?", options: ["A London coffee house","A castle","A railway station"], answer: 0, evidence: "coffee house" },
  { match: "Among the founders of the RSPCA", q: "Which famous campaigner against slavery helped found the RSPCA?", options: ["William Wilberforce","William Shakespeare","William the Conqueror"], answer: 0, evidence: "William Wilberforce" },
  { match: "The RSPCA began as the Society", q: "Which queen let the RSPCA add Royal to its name?", options: ["Queen Victoria","Queen Elizabeth I","Queen Anne"], answer: 0, evidence: "Queen Victoria" },
  { match: "Richard Martin, one of the founders", q: "What was Richard Martin's nickname?", options: ["Humanity Dick","Kindly Ken","Martin the Mighty"], answer: 0, evidence: "Humanity Dick" },
  { match: "Battersea Dogs and Cats Home began", q: "Who started the home that became Battersea Dogs and Cats Home?", options: ["Mary Tealby","Mary Poppins","Mary Berry"], answer: 0, evidence: "Mary Tealby" },
  { match: "Battersea Dogs and Cats Home moved", q: "In what year did the home move to Battersea?", options: ["1871","1971","1771"], answer: 0, evidence: "1871" },
  { match: "Charles Dickens visited the home", q: "Which famous writer visited the home and wrote about it in 1862?", options: ["Charles Dickens","Roald Dahl","J. K. Rowling"], answer: 0, evidence: "Charles Dickens" },
  { match: "Battersea Dogs and Cats Home started", q: "When did Battersea start taking in cats?", options: ["1883","1983","1783"], answer: 0, evidence: "1883" },
  { match: "Battersea Dogs and Cats Home has three centres", q: "Which motor racing circuit is near one of Battersea's centres?", options: ["Brands Hatch","Silverstone","Monaco"], answer: 0, evidence: "Brands Hatch" },
  { match: "Dogs Trust began in 1891 as the", q: "What was Dogs Trust first called?", options: ["The National Canine Defence League","The Barking Brigade","The Dog Squad"], answer: 0, evidence: "National Canine Defence League" },
  { match: "The National Canine Defence League", q: "When did the National Canine Defence League become Dogs Trust?", options: ["2003","1903","1803"], answer: 0, evidence: "2003" },
  { match: "Dogs Trust is famous for its promise", q: "What does Dogs Trust promise never to do?", options: ["Put down a healthy dog","Close on Sundays","Take in puppies"], answer: 0, evidence: "never to put down a healthy dog" },
  { match: "Dogs Trust has around 20 rehoming", q: "What are Dogs Trust's training classes called?", options: ["Dog School","Paw College","Bark Academy"], answer: 0, evidence: "Dog School" },
  { match: "Dogs Trust runs the Hope Project", q: "Who does the Dogs Trust Hope Project help?", options: ["People who are homeless","Pilots","Farmers"], answer: 0, evidence: "homeless" },
  { match: "Blue Cross began in 1897 as Our", q: "Which animals did Blue Cross first care for?", options: ["The working horses of London","Pet goldfish","Zoo lions"], answer: 0, evidence: "working horses of London" },
  { match: "Blue Cross got its name from a", q: "Where did Blue Cross's name come from?", options: ["A fund's blue cross symbol","A blue-coated dog","A blue church"], answer: 0, evidence: "blue cross symbol" },
  { match: "Blue Cross opened one of the first", q: "Where did Blue Cross open one of Britain's first animal hospitals?", options: ["Victoria, London","Edinburgh Castle","Blackpool Tower"], answer: 0, evidence: "Victoria, London" },
  { match: "Woodgreen Pets Charity was founded", q: "Who founded Woodgreen Pets Charity?", options: ["Louisa Snow","Louisa Rain","Louise Sunshine"], answer: 0, evidence: "Louisa Snow" },
  { match: "Woodgreen began in a house on Lordship", q: "Where did Woodgreen get its name?", options: ["Wood Green in north London","A green wood in Kent","A green dog"], answer: 0, evidence: "Wood Green, north London" },
  { match: "In 1987 Woodgreen opened its main", q: "Where is Woodgreen's main centre?", options: ["Godmanchester","Manchester","Colchester"], answer: 0, evidence: "Godmanchester" },
  { match: "Woodgreen became famous on television", q: "In which TV series does Woodgreen appear?", options: ["The Dog House","Doctor Who","Blue Peter"], answer: 0, evidence: "The Dog House" },
  { match: "The National Animal Welfare Trust, known", q: "What is the National Animal Welfare Trust known as?", options: ["NAWT","NAWDOG","TRUSTY"], answer: 0, evidence: "NAWT" },
  { match: "The National Animal Welfare Trust runs Trindledown", q: "What is Trindledown Farm?", options: ["A retirement home for elderly pets","A sheep farm","A dog show"], answer: 0, evidence: "retirement home for elderly pets" },
  { match: "Guide Dogs, the British charity, breeds most", q: "Near which town is Guide Dogs' National Centre?", options: ["Leamington Spa","Loch Ness","Land's End"], answer: 0, evidence: "Leamington Spa" },
  { match: "Guide Dogs is paid for almost entirely", q: "How much does a guide dog cost the person who needs it?", options: ["Nothing","A pound a week","A million pounds"], answer: 0, evidence: "free to the person" },
  { match: "The PDSA, the People's Dispensary", q: "What does PDSA stand for?", options: ["People's Dispensary for Sick Animals","Pets' Dinner and Snack Association","Poodle Dog Safety Agency"], answer: 0, evidence: "People's Dispensary for Sick Animals" },
  { match: "The PDSA's first free animal clinic", q: "Where did the PDSA's first free animal clinic open?", options: ["A basement in Whitechapel","A tent in Hyde Park","A barn in Devon"], answer: 0, evidence: "basement in Whitechapel" },
  { match: "The Kennel Club, founded in 1873", q: "Which famous dog show does the Kennel Club run?", options: ["Crufts","Barkfest","Pawprint Live"], answer: 0, evidence: "Crufts" },
  { match: "Most UK rescue charities microchip", q: "By 2016, what did the law say all dogs in England, Scotland and Wales must have?", options: ["A microchip","A passport","A hat"], answer: 0, evidence: "microchipped" },
  { match: "The RSPCA has been protecting animals", q: "For how many years has the RSPCA been protecting animals?", options: ["More than 200","About 20","About 2,000"], answer: 0, evidence: "more than 200 years" },
  { match: "Every dog alive today descends", q: "Did dogs come from today's grey wolves?", options: ["Yes","No"], answer: 1, evidence: "did not come from today's grey wolves" },
  { match: "Scientists think dogs split from", q: "Which was the first animal ever tamed by people?", options: ["The dog","The cow","The horse"], answer: 0, evidence: "first animal ever to be tamed" },
  { match: "One of the oldest known dogs was", q: "In which country was the ancient Bonn-Oberkassel dog found?", options: ["Germany","Egypt","Wales"], answer: 0, evidence: "Germany" },
  { match: "Dogs and wolves are so closely", q: "Can dogs and wolves still have puppies together?", options: ["Yes","No"], answer: 0, evidence: "can still have puppies together" },
  { match: "Wolves once lived all over Britain", q: "By about when had wolves disappeared from England?", options: ["Around 1500","Around 1950","Around 100"], answer: 0, evidence: "around 1500" },
  { match: "According to an old story, the", q: "How many wolf skins did King Edgar demand each year from a Welsh king?", options: ["300","3","3,000"], answer: 0, evidence: "300 wolf skins" },
  { match: "Legend says the last wolf in Scotland", q: "What was the name of the hunter said to have killed Scotland's last wolf?", options: ["MacQueen","MacDonald","MacWolf"], answer: 0, evidence: "MacQueen" },
  { match: "Wolves live in family groups called", q: "What are wolf family groups called?", options: ["Packs","Herds","Flocks"], answer: 0, evidence: "packs" },
  { match: "Myth: Wolf packs are ruled by a", q: "Who usually leads a wild wolf pack?", options: ["The parents","The fiercest fighter","The youngest pup"], answer: 0, evidence: "led by the parents" },
  { match: "Adult wolves rarely bark, but dogs", q: "Which bark more, adult wolves or dogs?", options: ["Dogs","Wolves","They bark the same"], answer: 0, evidence: "dogs bark a lot" },
  { match: "Wolves and dogs have the same number", q: "How many adult teeth do wolves and dogs have?", options: ["42","24","100"], answer: 0, evidence: "42" },
  { match: "Many dogs have floppy ears, curly", q: "What do scientists call floppy ears, curly tails and white patches in tamed animals?", options: ["The domestication syndrome","The fluffy effect","The pet puzzle"], answer: 0, evidence: "domestication syndrome" },
  { match: "In a famous experiment in Russia", q: "Which animals did Russian scientists breed for tameness from 1959?", options: ["Foxes","Bears","Wolves"], answer: 0, evidence: "foxes" },
  { match: "Wolves were reintroduced to Yellowstone", q: "In which American national park were wolves reintroduced in 1995?", options: ["Yellowstone","Disneyland","Central Park"], answer: 0, evidence: "Yellowstone" },
  { match: "Some dog breeds were created by", q: "Which breed was created by crossing dogs with wolves?", options: ["Czechoslovakian Wolfdog","Pug","Dachshund"], answer: 0, evidence: "Czechoslovakian Wolfdog" },
  { match: "Wolves hunt as a team, chasing", q: "About how fast can wolves run in short bursts?", options: ["About 60km/h","About 6km/h","About 600km/h"], answer: 0, evidence: "60km/h" },
  { match: "The grey wolf is the largest member", q: "What is the largest wild member of the dog family?", options: ["The grey wolf","The fox","The jackal"], answer: 0, evidence: "grey wolf is the largest" },
  { match: "In the legend of how Rome began", q: "Who were saved by a she-wolf in the legend of Rome?", options: ["Romulus and Remus","Robin and Marian","Castor and Pollux"], answer: 0, evidence: "Romulus and Remus" },
  { match: "Wild wolves usually live only about", q: "How long do wild wolves usually live?", options: ["About 6 to 8 years","About 30 years","About 1 year"], answer: 0, evidence: "6 to 8 years" },
  // J18-312: questions for the topic facts, part 2 (archaeology, literature and music, religion and folklore).
  { match: "The oldest known dog in Britain", q: "Where did Britain's oldest known dog live?", options: ["Gough's Cave in Cheddar Gorge","Stonehenge","Loch Ness"], answer: 0, evidence: "Gough's Cave" },
  { match: "Gough's Cave in Cheddar Gorge is", q: "What is the famous ancient human found in Gough's Cave called?", options: ["Cheddar Man","Stilton Man","Brie Boy"], answer: 0, evidence: "Cheddar Man" },
  { match: "The Gough's Cave dog jawbone was", q: "Where had the Gough's Cave dog jawbone been sitting for years?", options: ["The Natural History Museum","A farmer's shed","A school cupboard"], answer: 0, evidence: "Natural History Museum" },
  { match: "In 2026 scientists announced the", q: "In which country were the 15,800-year-old puppies found?", options: ["Turkey","Norway","Brazil"], answer: 0, evidence: "Turkey" },
  { match: "Dogs were living with people across", q: "Which came first, living with people: dogs, sheep or cats?", options: ["Dogs","Sheep","Cats"], answer: 0, evidence: "Dogs came first" },
  { match: "At ʿAin Mallaha in Israel, archaeologists", q: "What was the woman at ʿAin Mallaha buried with her hand resting on?", options: ["A puppy","A cat","A bowl"], answer: 0, evidence: "resting on a puppy" },
  { match: "At Bonn-Oberkassel in Germany", q: "What do the Bonn-Oberkassel dog's bones show?", options: ["It was nursed through an illness","It could swim","It was a champion"], answer: 0, evidence: "nursed it" },
  { match: "Archaeologists can tell an ancient", q: "Compared with wolves, what kind of snouts do early dogs usually have?", options: ["Shorter","Longer","Pointier"], answer: 0, evidence: "shorter snouts" },
  { match: "At Star Carr, a famous Stone Age", q: "Near which seaside town is the Stone Age site of Star Carr?", options: ["Scarborough","Brighton","Blackpool"], answer: 0, evidence: "Scarborough" },
  { match: "Ancient Egyptians buried millions", q: "About how many animal mummies are thought to be in the Dog Catacombs at Saqqara?", options: ["Around 8 million","Around 800","Around 8"], answer: 0, evidence: "8 million" },
  { match: "Ancient Egyptians sometimes gave", q: "In whose tomb was a decorated leather dog collar found?", options: ["Maiherpri","Tutankhamun","Cleopatra"], answer: 0, evidence: "Maiherpri" },
  { match: "At Ashkelon, an ancient city on", q: "How many dogs were buried in the cemetery at Ashkelon?", options: ["More than 1,000","About 10","Exactly 101"], answer: 0, evidence: "more than 1,000 dogs" },
  { match: "When Mount Vesuvius erupted in", q: "How did archaeologists make a cast of the Pompeii guard dog?", options: ["By pouring plaster into the space in the ash","By carving marble","By knitting it"], answer: 0, evidence: "poured plaster" },
  { match: "At Pompeii, some houses had floor", q: "What does Cave canem mean?", options: ["Beware of the dog","Welcome home","Wipe your paws"], answer: 0, evidence: "beware of the dog" },
  { match: "Roman roof tiles found at sites", q: "What did dogs leave on Roman roof tiles at Vindolanda?", options: ["Paw prints","Bite marks","Fur"], answer: 0, evidence: "paw prints" },
  { match: "British hunting dogs were famous", q: "Where were British hunting dogs exported to in ancient times?", options: ["Rome","America","Australia"], answer: 0, evidence: "exported to Rome" },
  { match: "Viking chiefs were sometimes buried", q: "Which Viking ship burials included dogs?", options: ["Gokstad and Oseberg","Titanic and Mary Rose","Cutty Sark"], answer: 0, evidence: "Gokstad and Oseberg" },
  { match: "In ancient China, dogs were sometimes", q: "Where were dogs buried under coffins in Shang dynasty China?", options: ["In small pits","On rooftops","In rivers"], answer: 0, evidence: "small pits" },
  { match: "Dogs travelled to the Americas", q: "Where are some of the earliest dog burials in North America?", options: ["The Koster site in Illinois","Times Square","The Grand Canyon"], answer: 0, evidence: "Koster site" },
  { match: "In Peru, the Chiribaya people buried", q: "How did the Chiribaya people of Peru bury some of their dogs?", options: ["Wrapped in blankets with food","In boxes of gold","In the sea"], answer: 0, evidence: "wrapped in blankets" },
  { match: "The Aztecs of Mexico kept a hairless", q: "Which hairless dog did the Aztecs keep?", options: ["The Xoloitzcuintli","The Chihuahua","The Pug"], answer: 0, evidence: "Xoloitzcuintli" },
  { match: "Archaeologists use radiocarbon", q: "What do archaeologists use to work out how old dog bones are?", options: ["Radiocarbon dating","A tape measure","Counting whiskers"], answer: 0, evidence: "radiocarbon dating" },
  { match: "In Sweden, at a Stone Age cemetery", q: "What is the Stone Age cemetery in Sweden where dogs had their own graves called?", options: ["Skateholm","Stockholm","Snowdon"], answer: 0, evidence: "Skateholm" },
  { match: "The first farmers who came to Britain", q: "When did the first farmers bring dogs to Britain?", options: ["About 6,000 years ago","About 600 years ago","About 60 years ago"], answer: 0, evidence: "6,000 years ago" },
  { match: "Dogs appear in some of the oldest", q: "In which country are rock carvings of hunters with dogs at least 8,000 years old?", options: ["Saudi Arabia","Iceland","Japan"], answer: 0, evidence: "Saudi Arabia" },
  { match: "At Cuween Hill, a Stone Age tomb", q: "How many dog skulls were found at Cuween Hill on Orkney?", options: ["24","2","240"], answer: 0, evidence: "24 dogs" },
  { match: "When Henry VIII's warship the Mary", q: "What nickname was given to the dog found on the Mary Rose?", options: ["Hatch","Mast","Anchor"], answer: 0, evidence: "Hatch" },
  { match: "DNA tests on Hatch, the Mary Rose", q: "What job did ship dogs like Hatch probably do?", options: ["Catch rats","Steer the ship","Cook dinner"], answer: 0, evidence: "catch rats" },
  { match: "At Lydney Park in Gloucestershire", q: "What is the famous small bronze dog from the Roman temple at Lydney Park called?", options: ["The Lydney Dog","The Bronze Barker","The Temple Terrier"], answer: 0, evidence: "Lydney Dog" },
  { match: "Archaeologists think dogs were", q: "What were dogs linked with at the Lydney Park temple?", options: ["Healing","Fishing","Singing"], answer: 0, evidence: "healing" },
  { match: "The Jennings Dog, a large Roman", q: "Where is the Jennings Dog statue kept?", options: ["The British Museum","The Louvre","Buckingham Palace"], answer: 0, evidence: "British Museum" },
  { match: "Two Roman marble statues of greyhounds", q: "What are the Townley Greyhounds shown doing?", options: ["Playing together","Sleeping","Eating"], answer: 0, evidence: "playing together" },
  { match: "In ancient Egypt, a royal guard", q: "Near which famous monument was the royal guard dog Abuwtiyuw buried?", options: ["The Great Pyramid","Stonehenge","The Colosseum"], answer: 0, evidence: "Great Pyramid" },
  { match: "In the tomb of the young Egyptian", q: "Which god's figure guarded Tutankhamun's treasure?", options: ["Anubis","Zeus","Thor"], answer: 0, evidence: "Anubis" },
  { match: "In ancient China, people made clay", q: "During which Chinese dynasty were clay model dogs often buried with the dead?", options: ["Han","Ming","Tang"], answer: 0, evidence: "Han dynasty" },
  { match: "Beside Lake Baikal in Siberia", q: "Beside which lake was a dog buried like a person 7,000 years ago?", options: ["Lake Baikal","Lake Windermere","Loch Lomond"], answer: 0, evidence: "Lake Baikal" },
  { match: "In a 2020 study of ancient dog", q: "By about 11,000 years ago, how many different families of dogs were there?", options: ["At least five","Only one","Over a hundred"], answer: 0, evidence: "at least five" },
  { match: "Dingoes reached Australia about", q: "In which cave were the oldest dingo bones found?", options: ["Madura Cave","Batman Cave","Crystal Cave"], answer: 0, evidence: "Madura Cave" },
  { match: "Some Native American peoples used", q: "What is a travois?", options: ["A frame of two poles pulled by a dog","A dog's bed","A hunting horn"], answer: 0, evidence: "frame of two poles" },
  { match: "The Coast Salish people of north-west", q: "What was the Coast Salish woolly dog's fur used for?", options: ["Weaving blankets","Stuffing pillows","Making paintbrushes"], answer: 0, evidence: "weave blankets" },
  { match: "Fossilised dog poo, called coprolites", q: "What is fossilised dog poo called?", options: ["Coprolites","Doggolites","Pooplites"], answer: 0, evidence: "coprolites" },
  { match: "Cats were tamed much later than", q: "On which island was the oldest known pet cat found?", options: ["Cyprus","Crete","Corfu"], answer: 0, evidence: "Cyprus" },
  { match: "In 1881 a pet cemetery began in", q: "In which London park did a pet cemetery begin in 1881?", options: ["Hyde Park","Regent's Park","Battersea Park"], answer: 0, evidence: "Hyde Park" },
  { match: "The scientific study of animal", q: "What is the study of animal bones from ancient sites called?", options: ["Zooarchaeology","Zoology","Dogology"], answer: 0, evidence: "zooarchaeology" },
  { match: "Early dogs were probably about", q: "About what size were early dogs?", options: ["A Collie or large Labrador","A Chihuahua","A pony"], answer: 0, evidence: "Collie or large Labrador" },
  { match: "Some scientists think wolves became", q: "What is the theory that wolves became dogs by scavenging round human camps called?", options: ["The commensal route","The camping theory","The scrap road"], answer: 0, evidence: "commensal route" },
  { match: "On many medieval tombs in British", q: "What is often carved at the feet of a stone knight on a medieval tomb?", options: ["A dog","A cat","A horse"], answer: 0, evidence: "carved dog" },
  { match: "Some Roman writers gave advice", q: "What did the Roman dog name Ferox mean?", options: ["Fierce","Fluffy","Fast"], answer: 0, evidence: "meaning fierce" },
  { match: "Ancient footprints of a child and", q: "In which cave were ancient footprints of a child and a dog-like animal found?", options: ["Chauvet Cave","Wookey Hole","Fingal's Cave"], answer: 0, evidence: "Chauvet Cave" },
  { match: "In ancient Mesopotamia, in what", q: "Which Mesopotamian goddess of healing were dogs linked with?", options: ["Gula","Isis","Freya"], answer: 0, evidence: "Gula" },
  { match: "Some ancient Egyptian dogs were", q: "What were some Egyptian dogs wrapped in when mummified?", options: ["Linen","Paper","Leaves"], answer: 0, evidence: "linen" },
  { match: "Tiny bones of lapdogs found at", q: "What do the tiny lapdog bones at Roman sites show?", options: ["People bred very small dogs as pets","Dogs were smaller then","Romans ate lapdogs"], answer: 0, evidence: "breeding very small dogs as pets" },
  { match: "The only dog to appear on stage", q: "What is the name of the only dog to appear on stage in a Shakespeare play?", options: ["Crab","Lobster","Shrimp"], answer: 0, evidence: "Crab" },
  { match: "In Geoffrey Chaucer's The Canterbury", q: "In The Canterbury Tales, what does the Prioress feed her little dogs?", options: ["Roast meat, milk and fine white bread","Porridge and peas","Fish and chips"], answer: 0, evidence: "roast meat, milk and fine white bread" },
  { match: "Sir Walter Scott, the Scottish", q: "What was Sir Walter Scott's huge Deerhound called?", options: ["Maida","Mabel","Molly"], answer: 0, evidence: "Maida" },
  { match: "The Dandie Dinmont Terrier is named", q: "Which terrier is named after a character in a Walter Scott novel?", options: ["The Dandie Dinmont","The Jack Russell","The Border Terrier"], answer: 0, evidence: "Dandie Dinmont" },
  { match: "Lord Byron, the poet, loved his", q: "What was Lord Byron's Newfoundland called?", options: ["Boatswain","Captain","Anchor"], answer: 0, evidence: "Boatswain" },
  { match: "Elizabeth Barrett Browning's spaniel", q: "What did Elizabeth Barrett Browning pay to get her stolen spaniel Flush back?", options: ["A ransom","Nothing","A poem"], answer: 0, evidence: "paid a ransom" },
  { match: "Charles Dickens kept many dogs", q: "What was Charles Dickens's little Pomeranian called?", options: ["Mrs Bouncer","Mrs Bounty","Miss Fluffy"], answer: 0, evidence: "Mrs Bouncer" },
  { match: "In Charles Dickens's novel Dombey", q: "In Dombey and Son, what is Florence Dombey's scruffy dog called?", options: ["Diogenes","Dennis","Digby"], answer: 0, evidence: "Diogenes" },
  { match: "In Charles Dickens's David Copperfield", q: "In David Copperfield, what is Dora's tiny spoilt dog called?", options: ["Jip","Jack","Jet"], answer: 0, evidence: "Jip" },
  { match: "In Jane Austen's Mansfield Park", q: "In Mansfield Park, which dog does lazy Lady Bertram keep on the sofa?", options: ["A pug","A Great Dane","A greyhound"], answer: 0, evidence: "pug" },
  { match: "Emily Brontë, author of Wuthering", q: "What was Emily Brontë's loyal dog called?", options: ["Keeper","Guardian","Watcher"], answer: 0, evidence: "Keeper" },
  { match: "Anne Brontë, the youngest of the", q: "What was Anne Brontë's King Charles Spaniel called?", options: ["Flossy","Fluffy","Floppy"], answer: 0, evidence: "Flossy" },
  { match: "In Charlotte Brontë's Jane Eyre", q: "In Jane Eyre, what is Mr Rochester's dog called?", options: ["Pilot","Captain","Sailor"], answer: 0, evidence: "Pilot" },
  { match: "The author Thomas Hardy had a wire-haired", q: "What was Thomas Hardy's terrier, famous for biting visitors, called?", options: ["Wessex","Dorset","Sussex"], answer: 0, evidence: "Wessex" },
  { match: "In Arthur Conan Doyle's The Sign", q: "What is the sniffer dog Sherlock Holmes borrows in The Sign of Four called?", options: ["Toby","Watson","Moriarty"], answer: 0, evidence: "Toby" },
  { match: "In the Sherlock Holmes story Silver", q: "In Silver Blaze, what did the dog do in the night-time?", options: ["Nothing","Barked all night","Ran away"], answer: 0, evidence: "the dog did nothing" },
  { match: "In Jerome K. Jerome's comic book", q: "What is the Fox Terrier in Three Men in a Boat called?", options: ["Montmorency","Montgomery","Monty Python"], answer: 0, evidence: "Montmorency" },
  { match: "J. M. Barrie, who wrote Peter Pan", q: "Which of J. M. Barrie's dogs was the model for Nana in Peter Pan?", options: ["Luath","Porthos","Rover"], answer: 0, evidence: "Luath" },
  { match: "Rudyard Kipling wrote a whole book", q: "Which kind of dog tells the story in Kipling's Thy Servant a Dog?", options: ["An Aberdeen Terrier","A Poodle","A Bloodhound"], answer: 0, evidence: "Aberdeen Terrier" },
  { match: "In Rudyard Kipling's Just So story", q: "In The Cat That Walked by Himself, what does the Wild Dog become?", options: ["First Friend","First Enemy","First Hunter"], answer: 0, evidence: "First Friend" },
  { match: "In Rudyard Kipling's The Jungle Book, the", q: "Who raises Mowgli in The Jungle Book?", options: ["A family of wolves","A family of bears","A family of monkeys"], answer: 0, evidence: "family of wolves" },
  { match: "In the Jeeves stories by P. G", q: "Where does the terrier Bartholomew chase Bertie Wooster?", options: ["On to the top of a wardrobe","Up a tree","Into a pond"], answer: 0, evidence: "top of a wardrobe" },
  { match: "In Enid Blyton's Famous Five books", q: "In the Famous Five, whose dog is Timmy?", options: ["George's","Julian's","Anne's"], answer: 0, evidence: "belongs to George" },
  { match: "In Enid Blyton's Secret Seven books", q: "What is the Secret Seven's dog called?", options: ["Scamper","Scruffy","Sniffer"], answer: 0, evidence: "Scamper" },
  { match: "In George Orwell's Animal Farm", q: "In Animal Farm, how many puppies does Napoleon secretly raise?", options: ["Nine","Two","Ninety"], answer: 0, evidence: "nine puppies" },
  { match: "Beatrix Potter's The Tale of Jemima Puddle-Duck features", q: "Who rescues Jemima Puddle-Duck from the fox?", options: ["Kep the Collie","Mr Tod","Peter Rabbit"], answer: 0, evidence: "Kep" },
  { match: "In Beatrix Potter's The Tale of the Pie and", q: "In The Tale of the Pie and the Patty-Pan, what kind of pie does Duchess worry about?", options: ["Mouse pie","Apple pie","Pork pie"], answer: 0, evidence: "mouse pie" },
  { match: "Michael Morpurgo, the former Children's", q: "Which Michael Morpurgo book follows a Greyhound through many owners?", options: ["Born to Run","War Horse","Kensuke's Kingdom"], answer: 0, evidence: "Born to Run" },
  { match: "In the first Harry Potter book", q: "What is the three-headed dog in the first Harry Potter book called?", options: ["Fluffy","Fang","Norbert"], answer: 0, evidence: "Fluffy" },
  { match: "In the Harry Potter books, Sirius", q: "What can Sirius Black turn into in Harry Potter?", options: ["A big black dog","A cat","A stag"], answer: 0, evidence: "big black dog" },
  { match: "In Terry Pratchett's Discworld", q: "What is the small talking dog in Terry Pratchett's Discworld called?", options: ["Gaspode","Gandalf","Gusto"], answer: 0, evidence: "Gaspode" },
  { match: "Dodie Smith, author of The Hundred", q: "What was Dodie Smith's first Dalmatian called?", options: ["Pongo","Perdita","Patch"], answer: 0, evidence: "Pongo" },
  { match: "Dodie Smith wrote a sequel to The", q: "What is the sequel to The Hundred and One Dalmatians called?", options: ["The Starlight Barking","Two Hundred Dalmatians","Spots Again"], answer: 0, evidence: "The Starlight Barking" },
  { match: "In Richard Adams's The Plague Dogs", q: "In The Plague Dogs, where do Rowf and Snitter try to survive?", options: ["The Lake District","Scotland's islands","London's sewers"], answer: 0, evidence: "Lake District" },
  { match: "In Dick King-Smith's The Sheep-Pig", q: "In The Sheep-Pig, which dog adopts Babe?", options: ["Fly, a Border Collie","Rex, a Rottweiler","Bob, a Beagle"], answer: 0, evidence: "Fly" },
  { match: "Spot, the little puppy in the lift-the-flap", q: "Who created Spot the puppy?", options: ["Eric Hill","Mick Inkpen","Beatrix Potter"], answer: 0, evidence: "Eric Hill" },
  { match: "Kipper, the friendly dog in the", q: "Who created Kipper the dog?", options: ["Mick Inkpen","Eric Hill","Roald Dahl"], answer: 0, evidence: "Mick Inkpen" },
  { match: "Shirley Hughes's 1977 picture book", q: "In Shirley Hughes's book, what is Dogger?", options: ["A toy dog","A real puppy","A dog's bed"], answer: 0, evidence: "toy dog" },
  { match: "The Yorkshire vet Alf Wight, writing", q: "What breed was James Herriot's pampered Tricki Woo?", options: ["Pekingese","Poodle","Pug"], answer: 0, evidence: "Pekingese" },
  { match: "In Gerald Durrell's My Family and", q: "On which Greek island did Gerald Durrell grow up with his dog Roger?", options: ["Corfu","Crete","Cyprus"], answer: 0, evidence: "Corfu" },
  { match: "In Bram Stoker's Dracula, from", q: "In Dracula, in which Yorkshire town does the vampire arrive as a huge dog?", options: ["Whitby","Leeds","York"], answer: 0, evidence: "Whitby" },
  { match: "In 1786 the Scottish poet Robert", q: "What are the two dogs in Robert Burns's The Twa Dogs called?", options: ["Caesar and Luath","Rex and Rover","Spot and Patch"], answer: 0, evidence: "Caesar and Luath" },
  { match: "In 1805 Charles Gough died on the", q: "On which Lake District mountain did Charles Gough die, with his dog staying by him?", options: ["Helvellyn","Snowdon","Ben Nevis"], answer: 0, evidence: "Helvellyn" },
  { match: "The poet Matthew Arnold wrote Geist's", q: "What was the Dachshund in Matthew Arnold's poem Geist's Grave called?", options: ["Geist","Ghost","Gus"], answer: 0, evidence: "Geist" },
  { match: "Robert Louis Stevenson, author", q: "Which author of Treasure Island wrote The Character of Dogs?", options: ["Robert Louis Stevenson","Charles Dickens","Lewis Carroll"], answer: 0, evidence: "Robert Louis Stevenson" },
  { match: "In 1570 Dr John Caius, a physician", q: "Who wrote the first book about the kinds of English dogs, in 1570?", options: ["Dr John Caius","Dr Dolittle","Dr Johnson"], answer: 0, evidence: "John Caius" },
  { match: "The Master of Game, written between", q: "Who wrote The Master of Game?", options: ["Edward, Duke of York","Henry VIII","King Arthur"], answer: 0, evidence: "Edward, Duke of York" },
  { match: "In the old Welsh tale Culhwch and", q: "What is King Arthur's hound called in Culhwch and Olwen?", options: ["Cafall","Excalibur","Merlin"], answer: 0, evidence: "Cafall" },
  { match: "In the Cornish legend of Tristan", q: "What is Tristan's loyal dog called?", options: ["Husdent","Hotdog","Hector"], answer: 0, evidence: "Husdent" },
  { match: "Rudyard Kipling's story Garm, a", q: "What breed is the dog in Kipling's Garm, a Hostage?", options: ["Bull Terrier","Poodle","Whippet"], answer: 0, evidence: "Bull Terrier" },
  { match: "In The Snowman and the Snowdog", q: "What does the boy build in The Snowman and the Snowdog?", options: ["A snow dog","A snow cat","A snow castle"], answer: 0, evidence: "snow dog" },
  { match: "In the film and stage musical Oliver!", q: "What is Bill Sikes's dog in Oliver! called?", options: ["Bull's-eye","Bullseye Bob","Target"], answer: 0, evidence: "Bull's-eye" },
  { match: "In Enid Blyton's Barney mysteries", q: "What is the dog in Enid Blyton's Barney mysteries called?", options: ["Loony","Looney Tune","Lucky"], answer: 0, evidence: "Loony" },
  { match: "Sir Edward Elgar's Enigma Variations", q: "Which composer wrote a piece about a Bulldog called Dan falling into the River Wye?", options: ["Sir Edward Elgar","Mozart","Paul McCartney"], answer: 0, evidence: "Elgar" },
  { match: "The Beatles' song Martha My Dear", q: "Which Beatles song is named after Paul McCartney's Old English Sheepdog?", options: ["Martha My Dear","Hey Jude","Yellow Submarine"], answer: 0, evidence: "Martha My Dear" },
  { match: "The Beatles recorded a song called", q: "In which Beatles song does Paul McCartney bark?", options: ["Hey Bulldog","Help!","Let It Be"], answer: 0, evidence: "Hey Bulldog" },
  { match: "How Much Is That Doggie in the", q: "Who was the first British woman to top the UK charts, singing How Much Is That Doggie in the Window?", options: ["Lita Roza","Vera Lynn","Adele"], answer: 0, evidence: "Lita Roza" },
  { match: "Led Zeppelin's 1971 song Black", q: "Which band's song Black Dog was named after a black Labrador?", options: ["Led Zeppelin","The Beatles","Queen"], answer: 0, evidence: "Led Zeppelin" },
  { match: "Pink Floyd's song Seamus, from", q: "What was the howling dog in Pink Floyd's song Seamus called?", options: ["Seamus","Sean","Sammy"], answer: 0, evidence: "Seamus" },
  { match: "David Bowie's 1974 album Diamond", q: "Which David Bowie album imagines gangs of Diamond Dogs?", options: ["Diamond Dogs","Space Oddity","Heroes"], answer: 0, evidence: "Diamond Dogs" },
  { match: "Florence and the Machine's song", q: "Which band had a hit with Dog Days Are Over?", options: ["Florence and the Machine","Oasis","Coldplay"], answer: 0, evidence: "Florence and the Machine" },
  { match: "Kate Bush's 1985 album Hounds of", q: "Which Kate Bush album is named after hounds?", options: ["Hounds of Love","Wuthering Heights","The Kick Inside"], answer: 0, evidence: "Hounds of Love" },
  { match: "The nursery rhyme Old Mother Hubbard", q: "In the nursery rhyme, what does Old Mother Hubbard go to fetch her dog?", options: ["A bone","A ball","A biscuit"], answer: 0, evidence: "a bone" },
  { match: "In the nursery rhyme Hey Diddle", q: "In Hey Diddle Diddle, what does the little dog do?", options: ["Laughs","Sings","Sneezes"], answer: 0, evidence: "little dog laughs" },
  { match: "The children's song about a farmer's", q: "What is the farmer's dog called in the spelling song?", options: ["Bingo","Bongo","Banjo"], answer: 0, evidence: "Bingo" },
  { match: "In the counting song This Old Man", q: "How does every verse of This Old Man end?", options: ["Give the dog a bone","Give the cat a mouse","Give the man a hat"], answer: 0, evidence: "give the dog a bone" },
  { match: "The Cumbrian hunting song D'ye", q: "Which Cumbrian hunting song names hounds called Ranter, Ringwood, Bellman and True?", options: ["D'ye Ken John Peel","Old MacDonald","Greensleeves"], answer: 0, evidence: "John Peel" },
  { match: "In the Bible, dogs are mentioned", q: "About how many times are dogs mentioned in the Bible?", options: ["Around 40","Around 4","Around 4,000"], answer: 0, evidence: "around 40 times" },
  { match: "In the Book of Tobit, found in", q: "In the Book of Tobit, who travels with Tobias and his dog?", options: ["The angel Raphael","King David","Noah"], answer: 0, evidence: "angel Raphael" },
  { match: "In a story Jesus told in the Gospel", q: "In Jesus's story, what do the dogs do for the poor man Lazarus?", options: ["Lick his sores","Bring him bread","Guard his house"], answer: 0, evidence: "lick his sores" },
  { match: "Saint Roch is known as the patron", q: "Who is known as the patron saint of dogs?", options: ["Saint Roch","Saint George","Saint Patrick"], answer: 0, evidence: "Saint Roch" },
  { match: "In medieval France, a greyhound", q: "What kind of dog was Guinefort, honoured as a saint in medieval France?", options: ["A greyhound","A poodle","A bulldog"], answer: 0, evidence: "greyhound called Guinefort" },
  { match: "Saint Hubert is the patron saint", q: "Who is Saint Hubert the patron saint of?", options: ["Hunters","Bakers","Sailors"], answer: 0, evidence: "patron saint of hunters" },
  { match: "The Saint Bernard dog is named", q: "In which mountains did Saint Bernard of Menthon found a shelter for travellers?", options: ["The Swiss Alps","The Pennines","The Himalayas"], answer: 0, evidence: "Swiss Alps" },
  { match: "The Dominican friars were nicknamed", q: "What does the Latin pun Domini canes mean?", options: ["The hounds of the Lord","The dogs of the town","The lord of the dogs"], answer: 0, evidence: "hounds of the Lord" },
  { match: "In some old Orthodox Christian", q: "In some Orthodox icons, which saint is painted with the head of a dog?", options: ["Saint Christopher","Saint Nicholas","Saint Andrew"], answer: 0, evidence: "Saint Christopher" },
  { match: "Every year around 4 October, the", q: "On whose feast day do many churches hold a blessing of the animals?", options: ["Saint Francis of Assisi","Saint Valentine","Saint Swithin"], answer: 0, evidence: "Saint Francis of Assisi" },
  { match: "From the 1500s to the 1800s, many", q: "What was the job of a church dog whipper?", options: ["Drive stray dogs out of church","Walk the vicar's dog","Ring the bells"], answer: 0, evidence: "drive stray dogs out of church" },
  { match: "Some old Welsh churches still have", q: "What were dog tongs used for in old Welsh churches?", options: ["Removing unruly dogs","Serving sausages","Lighting candles"], answer: 0, evidence: "remove them from services" },
  { match: "In the Quran, the story of the", q: "In the Quran story, who guarded the Companions of the Cave?", options: ["Their faithful dog","A lion","An eagle"], answer: 0, evidence: "faithful dog" },
  { match: "In Islamic tradition, the dog of", q: "What is the dog of the Companions of the Cave often called?", options: ["Qitmir","Qasim","Qamar"], answer: 0, evidence: "Qitmir" },
  { match: "A famous saying of the Prophet", q: "In the saying of the Prophet Muhammad, what did the man fetch for a thirsty dog?", options: ["Water from a well","Milk from a cow","Juice from a tree"], answer: 0, evidence: "water" },
  { match: "In Hindu tradition, Yama, the god", q: "How many eyes do the dogs of Yama, the Hindu god of death, have?", options: ["Four each","One each","Ten each"], answer: 0, evidence: "four-eyed dogs" },
  { match: "In the Hindu epic the Mahabharata", q: "In the Mahabharata, who does the faithful dog turn out to be?", options: ["The god Dharma","A prince","A tiger"], answer: 0, evidence: "god Dharma" },
  { match: "The Hindu god Bhairava, a fierce", q: "Which Hindu god rides a dog?", options: ["Bhairava","Ganesh","Krishna"], answer: 0, evidence: "Bhairava" },
  { match: "In the ancient Hindu Rig Veda", q: "In the Rig Veda, what does Sarama, the god Indra's dog, track down?", options: ["Stolen cows","Lost gold","Hidden rivers"], answer: 0, evidence: "stolen cows" },
  { match: "In Nepal, during the festival of", q: "In which country is Kukur Tihar, a festival day for dogs, celebrated?", options: ["Nepal","Norway","New Zealand"], answer: 0, evidence: "Nepal" },
  { match: "In Zoroastrian funerals, a dog", q: "What does sagdid, the Zoroastrian funeral ritual, mean?", options: ["Seen by a dog","Sung by a dog","Sent with a dog"], answer: 0, evidence: "seen by a dog" },
  { match: "In the Chinese zodiac, the Dog", q: "People born in the Chinese Year of the Dog are said to be what?", options: ["Loyal and honest","Sneaky and sly","Lazy and sleepy"], answer: 0, evidence: "loyal and honest" },
  { match: "Myth: The stone animals guarding", q: "What are Chinese foo dogs really?", options: ["Guardian lions","Guardian dogs","Guardian dragons"], answer: 0, evidence: "guardian lions" },
  { match: "At many Japanese Shinto shrines", q: "What are the stone guardians at Japanese Shinto shrines called?", options: ["Komainu","Kitsune","Kaiju"], answer: 0, evidence: "komainu" },
  { match: "The Aztecs of Mexico believed a", q: "What did the Aztecs believe a dog helped the dead cross?", options: ["A great river","A mountain","A desert"], answer: 0, evidence: "great river" },
  { match: "In Norse myth, a monstrous blood-stained", q: "In Norse myth, what is the blood-stained hound guarding Hel called?", options: ["Garm","Fenrir","Loki"], answer: 0, evidence: "Garm" },
  { match: "In Welsh legend, Cŵn Annwn are", q: "What colour are the ears of the Cŵn Annwn?", options: ["Red","Green","Blue"], answer: 0, evidence: "red ears" },
  { match: "In British folklore, the Wild Hunt", q: "When is the Wild Hunt said to race across the sky?", options: ["On stormy nights","On sunny mornings","On birthdays"], answer: 0, evidence: "stormy nights" },
  { match: "In Greek myth, the goddess Hecate", q: "Which Greek goddess of crossroads and magic was often shown with dogs?", options: ["Hecate","Athena","Aphrodite"], answer: 0, evidence: "Hecate" },
  { match: "In Greek myth, Laelaps was a magical", q: "Which god turned the dog Laelaps and the fox into stone?", options: ["Zeus","Poseidon","Hermes"], answer: 0, evidence: "Zeus" },
  { match: "In ancient Egypt, as well as Anubis", q: "What does the name of the Egyptian god Wepwawet mean?", options: ["Opener of the ways","Guardian of the gold","Barker at the moon"], answer: 0, evidence: "opener of the ways" },
  { match: "In ancient Egyptian belief, Anubis", q: "What did Anubis weigh a dead person's heart against?", options: ["A feather","A stone","A bone"], answer: 0, evidence: "feather" },
  { match: "The word cynic comes from the Greek", q: "What does the word cynic come from?", options: ["The Greek for dog-like","The Latin for cat","The French for grumpy"], answer: 0, evidence: "dog-like" },
  { match: "In English folklore, a church grim", q: "What was a church grim in English folklore?", options: ["A guardian spirit, often a black dog","A grumpy vicar","A church bell"], answer: 0, evidence: "guardian spirit" },
  { match: "In Yorkshire folklore, the Barghest", q: "What is the huge black dog of Yorkshire folklore called?", options: ["The Barghest","The Beast of Bodmin","Black Shuck"], answer: 0, evidence: "Barghest" },
  { match: "Some Buddhist stories, called Jataka", q: "What are the Buddhist stories of the Buddha's earlier lives called?", options: ["Jataka tales","Just So stories","Grimm tales"], answer: 0, evidence: "Jataka tales" },
  { match: "In Christian art, a dog in a painting", q: "What does a dog usually stand for in Christian art?", options: ["Loyalty and faithfulness","Greed","Danger"], answer: 0, evidence: "loyalty and faithfulness" },
  { match: "The name Fido, a popular name for", q: "What does the Latin word fidus, behind the name Fido, mean?", options: ["Faithful","Fluffy","Fast"], answer: 0, evidence: "faithful" },
  { match: "In some Christian traditions, Saint", q: "What does Saint Roch's dog carry in its mouth in paintings?", options: ["A loaf of bread","A bone","A key"], answer: 0, evidence: "loaf of bread" },
  { match: "In the Scottish Highlands, the", q: "What colour is the Cù Sìth, the Scottish fairy dog?", options: ["Green","Pink","Gold"], answer: 0, evidence: "green" },
  { match: "In medieval bestiaries, illustrated", q: "What did medieval bestiaries say a dog's tongue could do?", options: ["Heal wounds by licking","Tell the future","Taste gold"], answer: 0, evidence: "heal wounds" },
  // J18-313: questions for the dog's wild relatives (all 300 facts checked).
  { match: "The dog belongs to a family of", q: "What is the scientific name for the dog family?", options: ["Canidae","Felidae","Doggidae"], answer: 0, evidence: "Canidae" },
  { match: "Wild members of the dog family", q: "On which continent is there no wild member of the dog family?", options: ["Antarctica","Africa","Asia"], answer: 0, evidence: "except Antarctica" },
  { match: "Dogs belong to a large group of", q: "Into which two branches is the Carnivora split?", options: ["Dog-like and cat-like","Big and small","Land and sea"], answer: 0, evidence: "dog-like animals and the cat-like animals" },
  { match: "The dog-like branch of meat-eaters", q: "Which sea animals are cousins of the dog?", options: ["Seals and walruses","Sharks and whales","Crabs and lobsters"], answer: 0, evidence: "seals" },
  { match: "Myth: Hyenas are a kind of wild", q: "Are hyenas more closely related to dogs or to cats?", options: ["Cats","Dogs","Neither"], answer: 0, evidence: "more closely related to cats" },
  { match: "Myth: Meerkats are related to dogs", q: "What kind of animal is a meerkat?", options: ["A mongoose","A small dog","A rodent"], answer: 0, evidence: "kind of mongoose" },
  { match: "Myth: Raccoons and raccoon dogs", q: "Which is a true member of the dog family?", options: ["The raccoon dog","The raccoon","Both"], answer: 0, evidence: "raccoon dog is a true member" },
  { match: "Myth: The Tasmanian tiger, or thylacine", q: "Where did the Tasmanian tiger carry its babies?", options: ["In a pouch","On its back","In its mouth"], answer: 0, evidence: "in a pouch" },
  { match: "The earliest members of the dog", q: "What was one of the first members of the dog family called?", options: ["Hesperocyon","Hyperdog","Hesperus"], answer: 0, evidence: "Hesperocyon" },
  { match: "Dogs, wolves, coyotes and golden", q: "Can foxes breed with dogs?", options: ["Yes","No"], answer: 1, evidence: "Foxes cannot breed with dogs" },
  { match: "A pet dog has 78 chromosomes, the", q: "How many chromosomes does a pet dog have?", options: ["78","46","12"], answer: 0, evidence: "78 chromosomes" },
  { match: "The coyote lives across North and", q: "The word coyote comes from the language of which people?", options: ["The Aztecs","The Vikings","The Romans"], answer: 0, evidence: "Aztecs" },
  { match: "Coyotes have moved into big cities", q: "Which big city have coyotes moved into?", options: ["Chicago","Paris","Cairo"], answer: 0, evidence: "Chicago" },
  { match: "Coyotes are sometimes called song", q: "What are coyotes sometimes called, because of their chorus?", options: ["Song dogs","Sing-alongs","Yip dogs"], answer: 0, evidence: "song dogs" },
  { match: "Coyotes can run at up to about", q: "About how fast can a coyote run?", options: ["65km/h","6km/h","650km/h"], answer: 0, evidence: "65km/h" },
  { match: "When coyotes breed with pet dogs", q: "What are the puppies of a coyote and a pet dog called?", options: ["Coydogs","Doggotes","Coypups"], answer: 0, evidence: "coydogs" },
  { match: "In many Native American stories", q: "What is Coyote usually in Native American stories?", options: ["A clever trickster","A wise king","A scary monster"], answer: 0, evidence: "trickster" },
  { match: "The black-backed jackal of southern", q: "What does the black-backed jackal have along its back?", options: ["A dark saddle of fur","A white stripe","Spikes"], answer: 0, evidence: "dark saddle" },
  { match: "The side-striped jackal of Africa", q: "What colour is the tip of the side-striped jackal's tail?", options: ["White","Black","Red"], answer: 0, evidence: "white tip to its tail" },
  { match: "In 2015, scientists found that", q: "What are the golden jackals of Africa now called?", options: ["The African golden wolf","The desert fox","The sand jackal"], answer: 0, evidence: "African golden wolf" },
  { match: "The word jackal comes, through", q: "Which language does the word jackal come from?", options: ["Persian","Latin","Welsh"], answer: 0, evidence: "Persian" },
  { match: "The red fox is the most widespread", q: "What is the most widespread wild meat-eater on Earth?", options: ["The red fox","The lion","The polar bear"], answer: 0, evidence: "red fox is the most widespread" },
  { match: "Red foxes were taken to Australia", q: "Why were red foxes taken to Australia?", options: ["So settlers could hunt them","To catch rabbits","As pets"], answer: 0, evidence: "so that settlers could hunt them" },
  { match: "Foxes started moving into British", q: "When did foxes start moving into British towns and cities?", options: ["The 1930s","The 1830s","The 2000s"], answer: 0, evidence: "1930s" },
  { match: "A female fox is called a vixen", q: "What is a female fox called?", options: ["A vixen","A doe","A hen"], answer: 0, evidence: "vixen" },
  { match: "A fox catches mice under snow or", q: "What might foxes use to aim their pounce?", options: ["The Earth's magnetic field","The stars","The wind"], answer: 0, evidence: "magnetic field" },
  { match: "Foxes often bury spare food to", q: "What is it called when a fox buries spare food?", options: ["Caching","Stashing","Hoarding"], answer: 0, evidence: "caching" },
  { match: "Unlike most members of the dog", q: "What shape are a fox's pupils?", options: ["Slit-shaped","Round","Square"], answer: 0, evidence: "slit-shaped" },
  { match: "A red fox's bushy tail is called", q: "What is a red fox's bushy tail called?", options: ["A brush","A broom","A plume"], answer: 0, evidence: "brush" },
  { match: "In medieval European stories, a", q: "What was the sly fox in medieval stories called?", options: ["Reynard","Richard","Rupert"], answer: 0, evidence: "Reynard" },
  { match: "Roald Dahl's Fantastic Mr Fox", q: "Who are the three nasty farmers in Fantastic Mr Fox?", options: ["Boggis, Bunce and Bean","Tom, Dick and Harry","Huey, Dewey and Louie"], answer: 0, evidence: "Boggis, Bunce and Bean" },
  { match: "Hunting foxes with packs of dogs", q: "Which law banned hunting foxes with dogs in England and Wales?", options: ["The Hunting Act 2004","The Fox Act 1066","The Countryside Code"], answer: 0, evidence: "Hunting Act 2004" },
  { match: "The Arctic fox's coat changes with", q: "What colour is the Arctic fox's winter coat?", options: ["White","Red","Black"], answer: 0, evidence: "white in winter" },
  { match: "The Arctic fox can survive temperatures", q: "Where does the Arctic fox have fur to keep warm?", options: ["On the soles of its feet","On its tongue","Inside its ears only"], answer: 0, evidence: "soles of its feet" },
  { match: "Arctic foxes sometimes follow polar", q: "Which animal do Arctic foxes follow for scraps?", options: ["Polar bears","Penguins","Walruses"], answer: 0, evidence: "polar bears" },
  { match: "When it sleeps, an Arctic fox wraps", q: "What does an Arctic fox wrap round itself like a blanket?", options: ["Its tail","Snow","Moss"], answer: 0, evidence: "tail" },
  { match: "A few Arctic foxes have a blue-grey", q: "What are Arctic foxes with blue-grey coats called?", options: ["Blue foxes","Grey ghosts","Ice foxes"], answer: 0, evidence: "blue foxes" },
  { match: "The fennec fox of the Sahara Desert", q: "Which is the smallest member of the dog family?", options: ["The fennec fox","The Chihuahua","The kit fox"], answer: 0, evidence: "fennec fox of the Sahara Desert is the smallest" },
  { match: "The fennec fox has the largest", q: "How long can a fennec fox's ears be?", options: ["Up to 15cm","Up to 1cm","Up to 1 metre"], answer: 0, evidence: "15cm" },
  { match: "The fennec fox is the national", q: "What is Algeria's football team nicknamed?", options: ["Les Fennecs","Les Renards","Les Loups"], answer: 0, evidence: "Les Fennecs" },
  { match: "The grey fox of North America is", q: "What can the grey fox do that most canids cannot?", options: ["Climb trees","Swim underwater","Fly"], answer: 0, evidence: "climb trees" },
  { match: "The bat-eared fox of Africa uses", q: "What does the bat-eared fox mostly eat?", options: ["Termites and beetles","Zebras","Fish"], answer: 0, evidence: "termites and beetles" },
  { match: "The bat-eared fox has more teeth", q: "About how many teeth can a bat-eared fox have?", options: ["48","12","100"], answer: 0, evidence: "up to 48" },
  { match: "Blanford's fox, which lives in", q: "What can Blanford's fox climb like a cat?", options: ["Steep rocky cliffs","Palm trees","Buildings"], answer: 0, evidence: "rocky cliffs" },
  { match: "The Tibetan fox, from the high", q: "What is the Tibetan fox famous for?", options: ["Its square-looking face","Its blue fur","Its long tail"], answer: 0, evidence: "square-looking face" },
  { match: "Darwin's fox lives only in Chile", q: "In which country does Darwin's fox live?", options: ["Chile","China","Canada"], answer: 0, evidence: "Chile" },
  { match: "The island fox lives only on six", q: "About how big is the island fox?", options: ["The size of a house cat","The size of a horse","The size of a mouse"], answer: 0, evidence: "size of a house cat" },
  { match: "The raccoon dog is the only member", q: "Which member of the dog family becomes sleepy and inactive in winter?", options: ["The raccoon dog","The fennec fox","The dingo"], answer: 0, evidence: "raccoon dog is the only" },
  { match: "In Japan, the raccoon dog is called", q: "What is the raccoon dog called in Japan?", options: ["Tanuki","Kitsune","Shiba"], answer: 0, evidence: "tanuki" },
  { match: "Raccoon dogs were brought to western", q: "Why were raccoon dogs brought to western Russia?", options: ["To be farmed for fur","To guard sheep","To pull sledges"], answer: 0, evidence: "farmed for their fur" },
  { match: "The African wild dog is also called", q: "Why is the African wild dog called the painted dog?", options: ["Its patchy coat pattern","It rolls in paint","It lives near artists"], answer: 0, evidence: "unique pattern" },
  { match: "The African wild dog's scientific", q: "What does Lycaon pictus mean?", options: ["Painted wolf","Spotted dog","Wild hunter"], answer: 0, evidence: "painted wolf" },
  { match: "African wild dogs have only four", q: "How many toes do African wild dogs have on their front feet?", options: ["Four","Five","Six"], answer: 0, evidence: "four toes" },
  { match: "In 2017 scientists found that African", q: "How do African wild dogs seem to vote on going hunting?", options: ["By sneezing","By howling","By wagging"], answer: 0, evidence: "sneezing" },
  { match: "African wild dogs are among the", q: "Who catch their prey more often, African wild dogs or lions?", options: ["African wild dogs","Lions","Both the same"], answer: 0, evidence: "more often than lions" },
  { match: "The dhole, or Asian wild dog, is", q: "How do dholes communicate?", options: ["With whistling calls","By singing","With drums"], answer: 0, evidence: "whistling calls" },
  { match: "In Rudyard Kipling's The Second", q: "In which Kipling story does Mowgli fight a pack of dholes?", options: ["Red Dog","Rikki-Tikki-Tavi","The White Seal"], answer: 0, evidence: "Red Dog" },
  { match: "The dingo is Australia's wild dog", q: "What is Australia's largest land predator?", options: ["The dingo","The kangaroo","The koala"], answer: 0, evidence: "largest land predator" },
  { match: "Dingoes rarely bark. Instead they", q: "What do dingoes do instead of barking?", options: ["Howl","Squeak","Purr"], answer: 0, evidence: "howl" },
  { match: "The Dingo Fence in south-eastern", q: "About how long is the Dingo Fence?", options: ["5,600km","56km","56,000km"], answer: 0, evidence: "5,600km" },
  { match: "Dingoes have very flexible joints", q: "What can dingoes turn, which helps them climb?", options: ["Their wrists","Their ears","Their tails"], answer: 0, evidence: "turn their wrists" },
  { match: "Unlike pet dogs, which can have", q: "How often do female dingoes usually breed?", options: ["Once a year","Twice a year","Every month"], answer: 0, evidence: "once a year" },
  { match: "The New Guinea singing dog is famous", q: "What is special about the New Guinea singing dog's howl?", options: ["It slides up and down like a song","It is silent","It sounds like a cat"], answer: 0, evidence: "slides up and down" },
  { match: "The bush dog of South America has", q: "What does the bush dog look more like than a dog?", options: ["A small bear or a weasel","A cat","A rabbit"], answer: 0, evidence: "small bear or a weasel" },
  { match: "Bush dogs have partly webbed feet", q: "What helps bush dogs swim well?", options: ["Partly webbed feet","Flippers","A long tail"], answer: 0, evidence: "webbed feet" },
  { match: "The maned wolf of South America", q: "Why does the maned wolf have very long legs?", options: ["To see over tall grass","To climb trees","To swim"], answer: 0, evidence: "see over tall grass" },
  { match: "The maned wolf eats a lot of fruit", q: "What is the maned wolf's favourite fruit called?", options: ["The wolf apple","The dog pear","The fox berry"], answer: 0, evidence: "wolf apple" },
  { match: "Brazil's 200 real banknote, introduced", q: "Which country's banknote shows a maned wolf?", options: ["Brazil","Britain","Belgium"], answer: 0, evidence: "Brazil" },
  { match: "The Ethiopian wolf is the rarest", q: "Which is the rarest member of the dog family in the world?", options: ["The Ethiopian wolf","The red fox","The coyote"], answer: 0, evidence: "Ethiopian wolf is the rarest" },
  { match: "The Ethiopian wolf lives mostly", q: "What does the Ethiopian wolf mostly eat?", options: ["Giant mole-rats","Fish","Fruit"], answer: 0, evidence: "giant mole-rats" },
  { match: "The red wolf of the south-eastern", q: "In which US state do the last wild red wolves live?", options: ["North Carolina","California","Texas"], answer: 0, evidence: "North Carolina" },
  { match: "The dire wolf was a big wolf-like", q: "When did the dire wolf die out?", options: ["About 13,000 years ago","About 130 years ago","About 13 million years ago"], answer: 0, evidence: "13,000 years ago" },
  { match: "More than 4,000 dire wolves have", q: "Where have more than 4,000 dire wolves been found?", options: ["The La Brea Tar Pits","Stonehenge","Loch Ness"], answer: 0, evidence: "La Brea Tar Pits" },
  { match: "The Falkland Islands wolf was the", q: "What was the Falkland Islands wolf known for?", options: ["Being so tame it walked up to people","Being huge","Being blue"], answer: 0, evidence: "so tame" },
  { match: "Charles Darwin visited the Falkland", q: "Who predicted the Falklands wolf would soon be wiped out?", options: ["Charles Darwin","Charles Dickens","Captain Cook"], answer: 0, evidence: "Charles Darwin" },
  { match: "The Japanese wolf, a small wolf", q: "When is the Japanese wolf believed to have died out?", options: ["1905","1705","2005"], answer: 0, evidence: "1905" },
  { match: "The short-eared dog lives in the", q: "Where does the shy short-eared dog live?", options: ["The Amazon rainforest","The Sahara","The Arctic"], answer: 0, evidence: "Amazon rainforest" },
  { match: "Coyotes and American badgers sometimes", q: "Which animal sometimes hunts together with coyotes?", options: ["The American badger","The bald eagle","The bison"], answer: 0, evidence: "badgers" },
  { match: "Coyotes live in every state of", q: "Which US state has no coyotes?", options: ["Hawaii","Texas","Alaska"], answer: 0, evidence: "except Hawaii" },
  { match: "A running coyote usually carries", q: "How does a running coyote usually carry its tail?", options: ["Low, pointing down","Straight up","Curled over its back"], answer: 0, evidence: "tail low" },
  { match: "In recent years scientists moved", q: "What is the new group for black-backed and side-striped jackals called?", options: ["Lupulella","Lupinella","Jackalina"], answer: 0, evidence: "Lupulella" },
  { match: "Jackal pairs sing duets, howling", q: "How do jackal pairs tell others the territory is taken?", options: ["By howling duets","By drumming","By digging"], answer: 0, evidence: "duets" },
  { match: "In the old Indian fables of the", q: "In which old Indian fables are jackals clever tricksters?", options: ["The Panchatantra","Aesop's Fables","The Jungle Book"], answer: 0, evidence: "Panchatantra" },
  { match: "In Rudyard Kipling's The Jungle Book, Tabaqui", q: "What is the jackal in The Jungle Book called?", options: ["Tabaqui","Baloo","Akela"], answer: 0, evidence: "Tabaqui" },
  { match: "Golden jackals eat almost anything", q: "Which fruit do golden jackals even eat from vineyards?", options: ["Grapes","Apples","Bananas"], answer: 0, evidence: "grapes" },
  { match: "A fox's home is called an earth", q: "What is a fox's home called?", options: ["An earth","A sett","A drey"], answer: 0, evidence: "earth" },
  { match: "Fox cubs are usually born in March", q: "What colour are fox cubs when they are born?", options: ["Dark brown","Bright red","White"], answer: 0, evidence: "dark brown" },
  { match: "Red foxes are not always red. Some", q: "What are black foxes with silver-tipped fur called?", options: ["Silver foxes","Night foxes","Shadow foxes"], answer: 0, evidence: "silver foxes" },
  { match: "Foxes eat a surprising number of", q: "What do foxes pull out of lawns on damp nights?", options: ["Earthworms","Carrots","Flowers"], answer: 0, evidence: "earthworms" },
  { match: "Wild red foxes usually live only", q: "How long do wild red foxes usually live?", options: ["Two or three years","Twenty years","Fifty years"], answer: 0, evidence: "two or three years" },
  { match: "Foxes make many sounds besides", q: "What is the fox's chattering noise called?", options: ["Gekkering","Giggling","Gargling"], answer: 0, evidence: "gekkering" },
  { match: "The red fox's scientific name is", q: "What is the red fox's scientific name?", options: ["Vulpes vulpes","Canis canis","Foxus rufus"], answer: 0, evidence: "Vulpes vulpes" },
  { match: "Foxes are famous for stealing things", q: "What have urban foxes been known to steal from golf courses?", options: ["Golf balls","Flags","Golf carts"], answer: 0, evidence: "golf balls" },
  { match: "The red fox is the only wild member", q: "What is the only wild member of the dog family in Britain today?", options: ["The red fox","The wolf","The jackal"], answer: 0, evidence: "only wild member" },
  { match: "In 2019 scientists reported that", q: "About how far did the young Arctic fox walk from Svalbard to Canada?", options: ["3,500km","35km","35,000km"], answer: 0, evidence: "3,500km" },
  { match: "When there are plenty of lemmings", q: "How many cubs can an Arctic fox have in a good lemming year?", options: ["More than 20","Just one","Exactly two"], answer: 0, evidence: "more than 20" },
  { match: "The Arctic fox was the only land", q: "Which was the only land mammal in Iceland when people first arrived?", options: ["The Arctic fox","The reindeer","The polar bear"], answer: 0, evidence: "only land mammal living in Iceland" },
  { match: "Fennec foxes sleep through the", q: "When do fennec foxes come out to hunt?", options: ["At night","At midday","Only in winter"], answer: 0, evidence: "at night" },
  { match: "A fennec fox can leap about 60cm", q: "About how high can a fennec fox leap straight up?", options: ["60cm","6cm","6 metres"], answer: 0, evidence: "60cm" },
  { match: "The name fennec comes from fanak", q: "What does the Arabic word fanak mean?", options: ["Fox","Sand","Ears"], answer: 0, evidence: "Arabic word for fox" },
  { match: "The raccoon dog's scientific name", q: "What does the raccoon dog's scientific name, Nyctereutes, mean?", options: ["Night wanderer","Masked bandit","River swimmer"], answer: 0, evidence: "night wanderer" },
  { match: "African wild dogs live in packs", q: "In most African wild dog packs, how many pairs have pups?", options: ["One","Every pair","None"], answer: 0, evidence: "only one pair" },
  { match: "When African wild dogs come back", q: "Who eats first when African wild dogs come back from a hunt?", options: ["The pups","The pack leaders","The oldest dog"], answer: 0, evidence: "pups are allowed to eat first" },
  { match: "Dholes keep in touch in the thick", q: "Why are dholes sometimes called whistling dogs?", options: ["Their high whistling calls","They whistle for taxis","Their tails whistle"], answer: 0, evidence: "whistling calls" },
  { match: "The word dingo comes from the Dharug", q: "The word dingo comes from the language of which people?", options: ["The Dharug people of the Sydney area","The Maori","The Vikings"], answer: 0, evidence: "Dharug" },
  { match: "Most dingoes are a sandy ginger", q: "What colour are most dingoes?", options: ["Sandy ginger","Spotted","Blue"], answer: 0, evidence: "sandy ginger" },
  { match: "The dingoes of K'gari, an island", q: "What was the island of K'gari once called?", options: ["Fraser Island","Treasure Island","Dingo Island"], answer: 0, evidence: "Fraser Island" },
  { match: "New Guinea singing dogs are very", q: "What colour do New Guinea singing dogs' eyes glow in the dark?", options: ["Bright green","Red","Blue"], answer: 0, evidence: "bright green" },
  { match: "Bush dogs often live in burrows", q: "Whose burrows do bush dogs often live in?", options: ["Armadillos'","Rabbits'","Badgers'"], answer: 0, evidence: "armadillos" },
  { match: "Female bush dogs mark their territory", q: "How do female bush dogs mark their territory?", options: ["By doing a handstand","By singing","By digging holes"], answer: 0, evidence: "handstand" },
  { match: "By eating the wolf apple fruit", q: "How does the maned wolf help spread the wolf apple plant?", options: ["Through the seeds in its droppings","By planting them","By carrying them in its mane"], answer: 0, evidence: "seeds in its droppings" },
  { match: "The maned wolf gets its name from", q: "Where is the maned wolf's mane?", options: ["On its neck and shoulders","On its tail","On its legs"], answer: 0, evidence: "neck and shoulders" },
  { match: "Ethiopian wolves live in family", q: "Do Ethiopian wolves usually hunt alone or as a pack?", options: ["Alone","As a pack","With foxes"], answer: 0, evidence: "hunts alone" },
  { match: "Ethiopian wolves live high in the", q: "Above what height do Ethiopian wolves mostly live?", options: ["3,000 metres","300 metres","30 metres"], answer: 0, evidence: "3,000 metres" },
  { match: "In 2024 scientists reported that", q: "What do Ethiopian wolves lick from red hot poker flowers?", options: ["Sweet nectar","Dew","Pollen"], answer: 0, evidence: "nectar" },
  { match: "One of the biggest dangers to Ethiopian", q: "What disease caught from village dogs threatens Ethiopian wolves?", options: ["Rabies","Hay fever","Mumps"], answer: 0, evidence: "rabies" },
  { match: "The red wolf was declared extinct", q: "When were red wolves released back into the wild?", options: ["1987","1887","2017"], answer: 0, evidence: "1987" },
  { match: "Every red wolf alive today descends", q: "How many wolves are all red wolves alive today descended from?", options: ["14","140","4"], answer: 0, evidence: "14 wolves" },
  { match: "The dire wolf was heavier than", q: "Which large Ice Age animals did dire wolves hunt?", options: ["Horses and bison","Dinosaurs","Elephants and whales"], answer: 0, evidence: "horses and bison" },
  { match: "In 2025 an American company, Colossal", q: "Which company announced wolf pups it called dire wolves in 2025?", options: ["Colossal Biosciences","Jurassic Labs","Wolfcorp"], answer: 0, evidence: "Colossal Biosciences" },
  { match: "Dire wolves became famous around", q: "In which TV series do the Stark children raise dire wolf pups?", options: ["Game of Thrones","Doctor Who","Blue Peter"], answer: 0, evidence: "Game of Thrones" },
  { match: "Millions of years ago, North America", q: "What were the borophagines known for?", options: ["Crushing bones","Climbing trees","Swimming"], answer: 0, evidence: "cracking bones" },
  { match: "The largest member of the dog family", q: "What was the largest member of the dog family ever known?", options: ["Epicyon","The grey wolf","The Great Dane"], answer: 0, evidence: "Epicyon" },
  { match: "The culpeo, or Andean fox, is the", q: "What is the culpeo also called?", options: ["The Andean fox","The Amazon wolf","The Chilean dog"], answer: 0, evidence: "Andean fox" },
  { match: "The swift fox disappeared from", q: "How was the swift fox brought back to Canada?", options: ["By releasing foxes bred in captivity","By a boat from Africa","It walked back by itself"], answer: 0, evidence: "bred in captivity" },
  { match: "The island fox of California nearly", q: "Which bird nearly wiped out the island fox?", options: ["The golden eagle","The seagull","The owl"], answer: 0, evidence: "golden eagles" },
  { match: "The corsac fox lives on the dry", q: "Where does the corsac fox live?", options: ["The grasslands of Central Asia","The Arctic","The Amazon"], answer: 0, evidence: "Central Asia" },
  { match: "The Bengal fox of India has a black", q: "What colour is the tip of the Bengal fox's tail?", options: ["Black","White","Red"], answer: 0, evidence: "black tip" },
  { match: "The Cape fox is the only true fox", q: "What is the only true fox living in southern Africa?", options: ["The Cape fox","The red fox","The fennec fox"], answer: 0, evidence: "Cape fox" },
  { match: "The hoary fox of Brazil is small", q: "What does the hoary fox of Brazil mostly eat?", options: ["Termites","Fish","Fruit"], answer: 0, evidence: "termites" },
  { match: "All members of the dog family have special", q: "What are the scissor-like cheek teeth of the dog family called?", options: ["Carnassials","Canines","Molars"], answer: 0, evidence: "carnassials" },
  { match: "Unlike cats, most members of the", q: "Can most members of the dog family pull their claws back in like cats?", options: ["Yes","No"], answer: 1, evidence: "cannot pull their claws back in" },
  { match: "The smallest member of the dog", q: "What is the largest wild member of the dog family?", options: ["The grey wolf","The coyote","The dingo"], answer: 0, evidence: "largest wild one is the grey wolf" },
  { match: "Members of the dog family reached", q: "How did the dog family reach South America?", options: ["Across a land bridge","By swimming","On ships"], answer: 0, evidence: "land bridge" },
  { match: "Dogs, wolves, coyotes, jackals", q: "Which group do foxes belong to?", options: ["A separate branch from wolves","The wolf-like branch","The cat family"], answer: 0, evidence: "Foxes form a separate branch" },
  { match: "Myth: Wild dogs are just pet dogs", q: "Have African wild dogs, dholes and bush dogs ever been tamed?", options: ["Yes","No"], answer: 1, evidence: "never been tamed" },
  { match: "A dog that has gone wild is called", q: "What is a dog that has gone wild called?", options: ["Feral","Fierce","Free-range"], answer: 0, evidence: "feral" },
  { match: "Scientists study wild members of", q: "What are the cameras that photograph passing animals called?", options: ["Camera traps","Bird boxes","Nature cams"], answer: 0, evidence: "camera traps" },
  { match: "The Arctic wolf, a white grey wolf", q: "What does the Arctic wolf hunt?", options: ["Musk oxen and Arctic hares","Penguins","Seals only"], answer: 0, evidence: "musk oxen" },
  { match: "The Mexican wolf, or lobo, is the", q: "What is the Mexican wolf also called?", options: ["The lobo","The loco","The lupo"], answer: 0, evidence: "lobo" },
  { match: "The Arabian wolf is one of the", q: "About how much does the small Arabian wolf weigh?", options: ["18kg","80kg","1.8kg"], answer: 0, evidence: "18kg" },
  { match: "Wolves in Italy nearly died out", q: "In which mountains did Italy's last wolves survive in the 1970s?", options: ["The Apennines","The Alps","The Pyrenees"], answer: 0, evidence: "Apennine" },
  { match: "Wolves have been returning to parts", q: "When did wolves come back to Denmark?", options: ["2012","1912","1812"], answer: 0, evidence: "2012" },
  { match: "The Iberian wolf of Spain and Portugal", q: "Where does the Iberian wolf have a white patch?", options: ["On its upper lip","On its tail","On its ears"], answer: 0, evidence: "upper lip" },
  { match: "Northern Inuit dogs, a British", q: "Which British dogs played the dire wolf pups in Game of Thrones?", options: ["Northern Inuit dogs","Border Collies","Great Danes"], answer: 0, evidence: "Northern Inuit" },
  { match: "Grey wolves do not all look grey", q: "Are all grey wolves grey?", options: ["Yes","No"], answer: 1, evidence: "do not all look grey" },
  { match: "In 2021, scientists gave the dire", q: "What does Aenocyon dirus, the dire wolf's new name, mean?", options: ["Terrible wolf","Ancient dog","Giant fox"], answer: 0, evidence: "terrible wolf" },
  { match: "On the islands of Sardinia and", q: "On which islands did the Sardinian dhole live?", options: ["Sardinia and Corsica","Sicily and Malta","Crete and Cyprus"], answer: 0, evidence: "Sardinia and Corsica" },
  { match: "The word canine means to do with", q: "What does lupine mean?", options: ["Wolf-like","Fox-like","Dog-like"], answer: 0, evidence: "lupine means wolf-like" },
  { match: "The study of dogs, their breeds", q: "What is the study of dogs, their breeds and history called?", options: ["Cynology","Dogology","Canistry"], answer: 0, evidence: "cynology" },
  { match: "Crying wolf means raising a false", q: "What does crying wolf mean?", options: ["Raising a false alarm","Being very sad","Howling at night"], answer: 0, evidence: "false alarm" },
  { match: "To keep the wolf from the door", q: "What does keeping the wolf from the door mean?", options: ["Having just enough money to avoid going hungry","Keeping pets inside","Locking up at night"], answer: 0, evidence: "just enough money" },
  { match: "To wolf down your food means to", q: "What does wolfing down your food mean?", options: ["Eating very fast and greedily","Sharing it","Eating very slowly"], answer: 0, evidence: "very fast and greedily" },
  { match: "Letting the fox guard the henhouse", q: "What does letting the fox guard the henhouse mean?", options: ["Putting the wrong person in charge","Being very careful","Keeping chickens safe"], answer: 0, evidence: "most likely to steal or spoil" },
  { match: "An old book with brown spots on", q: "What is an old book with brown spots on its pages said to be?", options: ["Foxed","Wolfed","Dogged"], answer: 0, evidence: "foxed" },
  { match: "In Aesop's fable The Fox and the Grapes", q: "Which saying comes from The Fox and the Grapes?", options: ["Sour grapes","Sweet dreams","Top dog"], answer: 0, evidence: "sour grapes" },
  { match: "In Aesop's fable The Fox and the Crow, a", q: "In The Fox and the Crow, what does the crow drop?", options: ["Cheese","A worm","A feather"], answer: 0, evidence: "cheese" },
  { match: "In Scotland and northern England", q: "What is an old name for a fox in Scotland and northern England?", options: ["A tod","A tad","A tib"], answer: 0, evidence: "tod" },
  { match: "In Britain, foxes are sometimes", q: "Which politician is behind the fox's nickname Charlie?", options: ["Charles James Fox","Charles Darwin","Charlie Chaplin"], answer: 0, evidence: "Charles James Fox" },
  { match: "Leicester City Football Club is", q: "Which football club is nicknamed the Foxes?", options: ["Leicester City","Liverpool","Leeds United"], answer: 0, evidence: "Leicester City" },
  { match: "Basil Brush, a cheeky fox puppet", q: "What is Basil Brush's famous catchphrase?", options: ["Boom Boom","Ta-da","Yabba Dabba Doo"], answer: 0, evidence: "Boom Boom" },
  { match: "In Beatrix Potter's The Tale of Mr. Tod", q: "In The Tale of Mr. Tod, which badger does Mr Tod battle?", options: ["Tommy Brock","Brian Badger","Billy Brush"], answer: 0, evidence: "Tommy Brock" },
  { match: "In 2011, a fox was found living", q: "What did the builders call the fox found on the 72nd floor of the Shard?", options: ["Romeo","Rover","Rocky"], answer: 0, evidence: "Romeo" },
  { match: "Red foxes have a scent gland on", q: "What is the scent gland on top of a red fox's tail sometimes called?", options: ["The violet gland","The rose gland","The blue gland"], answer: 0, evidence: "violet gland" },
  { match: "A fox's footprint is narrower and", q: "How does a fox walk?", options: ["In a straight line","In zigzags","In circles"], answer: 0, evidence: "straight line" },
  { match: "Scientists at the University of", q: "Which university has studied urban foxes since the 1970s?", options: ["The University of Bristol","The University of Oxford","The University of Glasgow"], answer: 0, evidence: "University of Bristol" },
  { match: "The number of red foxes in Britain", q: "About how many red foxes are estimated to live in Britain?", options: ["Around 350,000","Around 3,500","Around 35 million"], answer: 0, evidence: "350,000" },
  { match: "In Japanese folklore, the kitsune", q: "How many tails do the most powerful kitsune have?", options: ["Nine","Two","Twenty"], answer: 0, evidence: "nine tails" },
  { match: "Foxes are the messengers of Inari", q: "Which Japanese god's messengers are foxes?", options: ["Inari","Raijin","Amaterasu"], answer: 0, evidence: "Inari" },
  { match: "In Korean folklore, the kumiho", q: "What is the Korean nine-tailed fox spirit called?", options: ["Kumiho","Kitsune","Kappa"], answer: 0, evidence: "kumiho" },
  { match: "In Aztec mythology, Huehuecoyotl", q: "What does Huehuecoyotl mean?", options: ["Old coyote","Young fox","Singing wolf"], answer: 0, evidence: "old coyote" },
  { match: "The BBC series Dynasties, narrated", q: "Which BBC series followed a pack of painted wolves in Zimbabwe?", options: ["Dynasties","Blue Planet","Springwatch"], answer: 0, evidence: "Dynasties" },
  { match: "The Ethiopian wolf was once called", q: "What was the Ethiopian wolf once called?", options: ["The Simien fox","The mountain dog","The red jackal"], answer: 0, evidence: "Simien fox" },
  { match: "The Bale Mountains in Ethiopia", q: "Which mountains are the Ethiopian wolf's stronghold?", options: ["The Bale Mountains","The Atlas Mountains","The Alps"], answer: 0, evidence: "Bale Mountains" },
  { match: "In Brazil, the maned wolf is called", q: "What is the maned wolf nicknamed in Brazil?", options: ["Fox on stilts","Wolf on wheels","Dog in boots"], answer: 0, evidence: "fox on stilts" },
  { match: "The bush dog is sometimes called", q: "What is the bush dog sometimes called?", options: ["The vinegar dog","The pickle dog","The salt dog"], answer: 0, evidence: "vinegar dog" },
  { match: "The African wild dog is one of", q: "Which place in Botswana is one of the African wild dog's last strongholds?", options: ["The Okavango Delta","The Sahara","Table Mountain"], answer: 0, evidence: "Okavango Delta" },
  { match: "Coyotes are very adaptable parents", q: "What do coyotes often do when they are hunted?", options: ["Have more pups","Leave the country","Hibernate"], answer: 0, evidence: "more pups" },
  { match: "In the Arctic, where there are", q: "How long can Arctic fox dens be used for?", options: ["Hundreds of years","A single night","One summer"], answer: 0, evidence: "hundreds of years" },
  { match: "Unlike most foxes, the bat-eared", q: "In bat-eared fox families, who does much of the babysitting?", options: ["The father","The grandmother","A neighbour"], answer: 0, evidence: "father does much of the babysitting" },
  { match: "New Guinea singing dogs are kept", q: "What can the New Guinea singing dog's howl sound like?", options: ["Whale song","A car alarm","A trumpet"], answer: 0, evidence: "whale song" },
  { match: "Foxes, wolves and coyotes all mark", q: "How do foxes, wolves and coyotes leave a visible sign and scent on the ground?", options: ["By scratching it","By rolling on it","By sneezing on it"], answer: 0, evidence: "scratching the ground" },
  { match: "Members of the dog family that live in hot", q: "Why do members of the dog family in hot places often have big ears?", options: ["To lose heat","To scare enemies","To catch rain"], answer: 0, evidence: "lose heat" },
  { match: "Many members of the dog family keep in touch", q: "Which of these barks and screams instead of howling?", options: ["Foxes","Wolves","Dingoes"], answer: 0, evidence: "foxes bark and scream" },
  { match: "Most members of the dog family have litters", q: "What are pups of the dog family like when they are born?", options: ["Blind and helpless","Able to run","Fully grown"], answer: 0, evidence: "blind and helpless" },
  { match: "The Sechuran fox, a small fox from", q: "Where does the Sechuran fox live?", options: ["The coastal deserts of Peru and Ecuador","The Arctic","Scotland"], answer: 0, evidence: "Peru and Ecuador" },
  { match: "Red foxes in Britain have their", q: "When do young British foxes leave home?", options: ["By autumn","In spring","Never"], answer: 0, evidence: "by autumn" },
  { match: "Fox cubs are sometimes found alone", q: "What should you do if you find a fox cub alone?", options: ["Watch from a distance first","Take it home","Chase it"], answer: 0, evidence: "watching from a distance" },
  { match: "Foxes can catch a skin disease", q: "What is the skin disease that makes foxes' fur fall out called?", options: ["Mange","Mumps","Moult"], answer: 0, evidence: "mange" },
  { match: "The coyote was nicknamed the prairie", q: "What did early European settlers nickname the coyote?", options: ["The prairie wolf","The desert dog","The song wolf"], answer: 0, evidence: "prairie wolf" },
  { match: "In some parts of North America", q: "In which national park did coyote numbers fall when wolves came back?", options: ["Yellowstone","Yosemite","Snowdonia"], answer: 0, evidence: "Yellowstone" },
  { match: "The dhole's scientific name, Cuon", q: "What does Cuon alpinus, the dhole's scientific name, mean?", options: ["Mountain dog","Red wolf","Forest fox"], answer: 0, evidence: "mountain dog" },
  { match: "The maned wolf's scientific name", q: "What does the maned wolf's scientific name mean?", options: ["Golden dog with a short tail","Red wolf with long legs","Tall fox"], answer: 0, evidence: "golden dog with a short tail" },
  { match: "The raccoon dog is common in Finland", q: "In which northern European country is the raccoon dog common?", options: ["Finland","Spain","Greece"], answer: 0, evidence: "Finland" },
  { match: "Island foxes are so small because", q: "What is the pattern of island animals becoming smaller called?", options: ["Island dwarfism","Island shrinking","Sea squeeze"], answer: 0, evidence: "island dwarfism" },
  { match: "The Japanese wolf appears in old", q: "What did the Japanese wolf protect farmers' crops from?", options: ["Deer and wild boar","Locusts","Floods"], answer: 0, evidence: "deer and wild boar" },
  { match: "In 2018, scientists found that", q: "On which island were coyote-like animals found with red wolf DNA?", options: ["Galveston Island","Isle of Wight","Easter Island"], answer: 0, evidence: "Galveston Island" },
  { match: "Bush dogs have been seen hunting", q: "Which huge rodents have bush dogs been seen hunting?", options: ["Capybaras","Beavers","Hamsters"], answer: 0, evidence: "capybaras" },
  { match: "Dingoes on the island of K'gari", q: "What are visitors to K'gari warned never to do?", options: ["Feed the dingoes","Take photos","Swim"], answer: 0, evidence: "never to feed them" },
  { match: "Dholes are sometimes called red", q: "What are dholes sometimes called?", options: ["Red dogs","Blue dogs","Night dogs"], answer: 0, evidence: "red dogs" },
  { match: "The Tibetan fox lives on the high", q: "Which animal does the Tibetan fox follow to catch escaping pikas?", options: ["Brown bears","Yaks","Snow leopards"], answer: 0, evidence: "brown bears" },
  { match: "The pampas fox of South America's", q: "What does the pampas fox do when threatened?", options: ["Plays dead","Climbs a tree","Barks loudly"], answer: 0, evidence: "play dead" },
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
  const pool = [...new Set([...history, ...CHATBOT_FACTS, ...famousFacts(), ...breedLines, ...Object.values(EXTINCT_REWRITES), ...MYTHS.map((m) => `${MYTH_LEAD[m.kind][0]} ${m.claim} ${MYTH_LEAD[m.kind][1]} ${m.truth}`), ...ARTICLE_FACTS, ...chumLines, ...Object.values(TOPIC_FACTS).flat(), ...EXTRA_FACTS].map((f) => f.trim()))].filter((f) => f.length > 20);
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
