"use client";
import { useState } from "react";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";

const PACK_BREEDS = [
  "Afghan Hound","Basset Hound","Beagle","Bichon Frise","Bloodhound",
  "Border Collie","Border Terrier","Boston Terrier","Boxer","Bull Terrier",
  "Bulldog","Cavalier King Charles Spaniel","Cavachon","Cavapoo","Chihuahua",
  "Cocker Spaniel","Cockapoo","Corgi","Dachshund","Dalmatian",
  "Doberman Pinscher","French Bulldog","German Shepherd","Golden Retriever",
  "Goldendoodle","Great Dane","Greyhound","Irish Setter","Irish Wolfhound",
  "Italian Greyhound","Jack Russell Terrier","Jackapoo","Labrador","Labradoodle",
  "Lurcher","Maltese","Maltipoo","Mastiff","Miniature Schnauzer",
  "Old English Sheepdog","Papillon","Pomeranian","Poodle","Pug","Rottweiler",
  "Rough Collie","Saint Bernard","Shih Tzu","Siberian Husky","Springer Spaniel",
  "Staffordshire Bull Terrier","Weimaraner","West Highland Terrier","Whippet",
  "Yorkshire Terrier",
];

const OTHER_BREEDS = [
  "Airedale Terrier","Akita","Alaskan Malamute","Bedlington Terrier",
  "Bernese Mountain Dog","Borzoi","Cairn Terrier","Chesapeake Bay Retriever",
  "Chow Chow","Clumber Spaniel","Deerhound","English Setter","Field Spaniel",
  "Flat-Coated Retriever","Fox Terrier","Gordon Setter","Havanese",
  "Hungarian Vizsla","Leonberger","Lhasa Apso","Newfoundland","Norfolk Terrier",
  "Pointer","Rhodesian Ridgeback","Saluki","Samoyed","Scottish Terrier",
  "Shar Pei","Shiba Inu","Soft Coated Wheaten Terrier","Sussex Spaniel",
  "Tibetan Mastiff","Welsh Springer Spaniel","Welsh Terrier",
];

const DOG_WORDS_BY_GROUP: Record<string, string[]> = {
  terrier:   ["Bolt","Dig","Scrap","Scruff","Rumpus","Rattle","Scuttle","Scrabble","Pounce","Bristle"],
  spaniel:   ["Flush","Fetch","Bound","Waggle","Splash","Scamper","Frolic","Gambol","Romp","Prance"],
  retriever: ["Fetch","Bound","Wag","Leap","Paddle","Gambol","Romp","Gallop","Lollop","Caper"],
  collie:    ["Herd","Steer","Dart","Circle","Round","Weave","Dash","Sprint","Nip","Gather"],
  tough:     ["Charge","Bark","Rumble","Barge","Barrel","Lumber","Blunder","Crash","Thump","Bellow"],
  sniffer:   ["Sniff","Snuffle","Nose","Trail","Track","Plod","Mosey","Amble","Trundle","Dawdle"],
  sighthound:["Sprint","Dart","Bolt","Flash","Streak","Glide","Sweep","Flow","Bound","Skim"],
  giant:     ["Lumber","Plod","Amble","Stomp","Thud","Rumble","Clump","Trundle","Trudge","Sway"],
  poodle:    ["Prance","Trot","Strut","Waltz","Sashay","Glide","Mince","Bounce","Flourish","Pirouette"],
  lapdog:    ["Prance","Bounce","Trot","Waltz","Flounce","Sashay","Fluff","Frolic","Gambol","Shimmy"],
  character: ["Snort","Waddle","Snuffle","Tumble","Bumble","Toddle","Trundle","Wobble","Shuffle","Bustle"],
  gentry:    ["Trot","Canter","Prance","Stride","Saunter","Amble","March","Parade","Promenade","Gallop"],
  doodle:    ["Bounce","Bound","Leap","Caper","Romp","Frolic","Gambol","Cavort","Prance","Scamper"],
  default:   ["Trot","Bound","Wag","Prance","Romp","Caper","Gambol","Frolic","Scamper","Saunter"],
};

type BreedData = {
  titles: string[];
  boyNames: string[];
  girlNames: string[];
  reasoning: string[];
  nickname?: (first: string) => string | null;
};

function blend(breed: string, name: string): string | null {
  const b = breed.toLowerCase().replace(/[^a-z]/g, "");
  const n = name.toLowerCase();
  for (let bl = 3; bl <= Math.min(b.length, 6); bl++) {
    const chunk = b.slice(0, bl);
    for (let nl = 1; nl < n.length - 1; nl++) {
      if (n.slice(nl).startsWith(chunk[chunk.length - 1]) || chunk.endsWith(n[nl])) {
        const candidate = name.slice(0, nl) + breed.slice(0, bl).charAt(0).toUpperCase() + breed.slice(1, bl) + name.slice(nl + chunk.length - 1);
        if (candidate.length >= 5 && candidate.length <= 12 && candidate !== name) {
          return candidate.charAt(0).toUpperCase() + candidate.slice(1);
        }
      }
    }
  }
  return null;
}

const BREED_DATA: Record<string, BreedData> = {
  "Cocker Spaniel": {
    titles: ["Field Marshal","General","Admiral","Brigadier"],
    boyNames: ["Archibald","Cornelius","Peregrine","Reginald","Bartholomew","Montgomery","Algernon","Humphrey"],
    girlNames: ["Georgiana","Arabella","Clementine","Millicent","Sophronia","Wilhelmina","Henrietta","Lavinia"],
    reasoning: [
      "Cocker Spaniels have commanded hunting parties since Tudor times -- a Field Marshal was the only appropriate rank.",
      "The Cocker Spaniel spent centuries giving orders to beaters and retrievers. A generalship was long overdue.",
      "Floppy ears and an air of absolute authority -- the Cocker Spaniel was born to command.",
    ],
  },
  "Springer Spaniel": {
    titles: ["Field Marshal","General","Admiral","Brigadier","Colonel"],
    boyNames: ["Wellington","Rupert","Alistair","Cedric","Desmond","Everard","Percival","Godfrey"],
    girlNames: ["Cordelia","Beatrice","Frederica","Constance","Prudence","Dorothea","Imogen","Rosalind"],
    reasoning: [
      "The Springer Spaniel has been flushing game for the British aristocracy since the 1600s. Only a field command would do.",
      "Bred to spring into action at a moment's notice. The military found this exceptionally useful.",
      "A dog that has spent centuries outrunning everyone else on the estate deserves to outrank them too.",
    ],
  },
  "Cavalier King Charles Spaniel": {
    titles: ["Reverend","Dean","Bishop","Archdeacon"],
    boyNames: ["Sebastian","Rupert","Charles","Auberon","Crispin","Fabian","Jasper","Quentin"],
    girlNames: ["Celestine","Evangeline","Seraphina","Ottoline","Isadora","Verity","Araminta","Flavia"],
    reasoning: [
      "Named after a king, draped in silk cushions all day -- the Church was the only institution grand enough.",
      "The Cavalier King Charles Spaniel has maintained the air of a bishop who considers most matters beneath him.",
      "Four hundred years of palace living leaves a dog with very particular ideas about ceremony and precedent.",
    ],
  },
  "Labrador": {
    titles: ["Colonel","Major","Captain","Commander"],
    boyNames: ["Douglas","Barnaby","Clifford","Edmund","Roderick","Jasper","Theodore","Herbert"],
    girlNames: ["Margaret","Dorothy","Patricia","Winifred","Edith","Muriel","Florence","Beatrice"],
    reasoning: [
      "The Labrador has guided, retrieved, and served with unwavering loyalty. Colonel was the minimum acceptable rank.",
      "Dependable, cheerful, and utterly convinced that every situation calls for a biscuit. Classic Major energy.",
      "The Labrador approaches every command with enthusiasm and then sits on your foot. A natural Captain.",
    ],
  },
  "Golden Retriever": {
    titles: ["Colonel","Major","Captain","Commander"],
    boyNames: ["Aubrey","Bertram","Clarence","Dudley","Frederick","Gideon","Harold","Lionel"],
    girlNames: ["Augusta","Beatrix","Cecily","Diana","Eleanor","Frances","Gwendolen","Helena"],
    reasoning: [
      "The Golden Retriever is so relentlessly good-natured that the rank of Colonel barely does it justice.",
      "Bred to retrieve anything, anywhere, with a smile. The military found this attitude highly suspicious.",
      "A dog that greets burglars as enthusiastically as family members -- promoted to Major on charm alone.",
    ],
  },
  "German Shepherd": {
    titles: ["Colonel","Major","Captain"],
    boyNames: ["Heinrich","Wolfgang","Dieter","Klaus","Reinhard","Gunther","Manfred","Siegfried"],
    girlNames: ["Hildegard","Brunhilde","Lieselotte","Gertrude","Ingeborg","Waltraud","Elfriede","Mathilde"],
    reasoning: [
      "The German Shepherd brings both the discipline and the paperwork. A Colonel through and through.",
      "Engineered for precision, loyalty and mild intimidation. The Major's office practically chose itself.",
      "A dog that has never once been off duty. Not once. The Captain's bars were practically hereditary.",
    ],
  },
  "Greyhound": {
    titles: ["Duke","Earl","Lord","Sir","Viscount"],
    boyNames: ["Auberon","Lysander","Phineas","Caspian","Orlando","Leander","Tarquin","Evander"],
    girlNames: ["Araminta","Isadora","Thessaly","Calliope","Delphine","Evangeline","Iphigenia","Seraphina"],
    reasoning: [
      "Greyhounds have graced royal courts since ancient Egypt. A Dukedom was frankly the modest option.",
      "The Greyhound has always considered the aristocracy its natural social circle -- if anything, peers beneath it.",
      "Forty miles per hour of elegant indifference. The earldom was awarded for sheer deportment.",
    ],
  },
  "Afghan Hound": {
    titles: ["Duke","Duchess","Earl","Countess","Lord","Lady"],
    boyNames: ["Scheherazade","Babur","Darius","Xerxes","Cyrus","Iskander","Tamerlane","Jahan"],
    girlNames: ["Roxana","Scheherazade","Zuleika","Fatima","Shahrzad","Nasrin","Parisa","Yasmin"],
    reasoning: [
      "The Afghan Hound has been aristocratic since before the British aristocracy was invented.",
      "A dog that takes longer to groom than most peers take to dress for the Lords. Naturally, a Duchess.",
      "The Afghan Hound moves through the world as though everything in it is mildly disappointing. Very noble.",
    ],
  },
  "Whippet": {
    titles: ["Lord","Lady","Sir","Dame","Viscount","Viscountess"],
    boyNames: ["Philip","Felix","Hugo","Cecil","Algernon","Crispin","Julian","Miles"],
    girlNames: ["Pippa","Felicity","Honor","Cecily","Arabella","Christabel","Juliet","Miranda"],
    reasoning: [
      "Whippets are the working man's Greyhound but arrive at the finish line with considerably more dignity.",
      "Lean, fast, and perpetually cold. The title was partly compensation for the draught.",
      "The Whippet has maintained an air of wounded nobility since the Industrial Revolution. A lordship was only fair.",
    ],
  },
  "Lurcher": {
    titles: ["Lord","Sir","Viscount","Baron"],
    boyNames: ["Fletcher","Archer","Hunter","Catcher","Ranger","Walker","Strider","Rover"],
    girlNames: ["Fleur","Sylvia","Heather","Rowena","Willa","Maren","Petra","Aldith"],
    reasoning: [
      "The Lurcher was bred by poachers to outrun the gamekeeper. The lordship came later, when sides were swapped.",
      "Half sight hound, half sheepdog, entirely convinced of its own superiority. Landed gentry to the bone.",
      "The Lurcher has been quietly ignoring orders from people of considerably higher rank for centuries.",
    ],
  },
  "Staffordshire Bull Terrier": {
    titles: ["Sergeant","Corporal","Lance Corporal"],
    boyNames: ["Trevor","Gary","Dwayne","Kevin","Darren","Shane","Wayne","Dean"],
    girlNames: ["Sharon","Tracy","Donna","Beverley","Cheryl","Leanne","Stacey","Kylie"],
    reasoning: [
      "The Staffie is the Sergeant who everyone actually respects while pretending to respect the Colonel.",
      "Loyal, loud, and absolutely convinced that sitting on your lap is a human right. Classic Corporal.",
      "The Staffordshire Bull Terrier has never met a stranger. This is not always helpful on military exercises.",
    ],
  },
  "Boxer": {
    titles: ["Sergeant","Corporal","Lance Corporal"],
    boyNames: ["Rocky","Buster","Bruno","Rex","Chip","Flash","Biff","Knuckles"],
    girlNames: ["Roxie","Bonnie","Blaze","Pepper","Stella","Gracie","Ruby","Floss"],
    reasoning: [
      "The Boxer approaches every situation with maximum enthusiasm and minimum strategy. Corporal material.",
      "A dog that looks permanently surprised, even at things it caused. The Sergeant's face says it all.",
      "The Boxer has never walked anywhere it could bounce. The Lance Corporal stripe was for effort.",
    ],
  },
  "Bulldog": {
    titles: ["Sergeant","Corporal","Lance Corporal"],
    boyNames: ["Winston","Churchill","Cromwell","Harold","Reginald","Lionel","Norman","Stanley"],
    girlNames: ["Vera","Edna","Mabel","Hilda","Gladys","Doris","Ethel","Agnes"],
    reasoning: [
      "The British Bulldog is the physical embodiment of not moving unless absolutely necessary. Sergeant of the watch.",
      "Built like a small sofa with opinions. The Corporal rank was awarded for sheer immovability.",
      "The Bulldog has been the mascot of British stubbornness since the eighteenth century. A natural Sergeant.",
    ],
  },
  "Basset Hound": {
    titles: ["Inspector","Chief Inspector","Superintendent","Commissioner","Judge"],
    boyNames: ["Barnaby","Mortimer","Sherlock","Hercule","Wilfred","Algernon","Cuthbert","Reginald"],
    girlNames: ["Agatha","Millicent","Gertrude","Prudence","Constance","Lavinia","Hortense","Winifred"],
    reasoning: [
      "The Basset Hound has the air of a detective who solved the case three days ago and is merely waiting for everyone else to catch up.",
      "Melancholy eyes, powerful nose, deeply suspicious of everything. The Inspectorate was the natural career path.",
      "The Basset Hound investigates the garden with the thoroughness of a Superintendent who has seen too much.",
    ],
  },
  "Beagle": {
    titles: ["Inspector","Chief Inspector","Superintendent","Commissioner"],
    boyNames: ["Nigel","Clive","Roger","Derek","Graham","Barry","Keith","Colin"],
    girlNames: ["Janet","Susan","Carol","Linda","Barbara","Sheila","Diane","Patricia"],
    reasoning: [
      "The Beagle follows a scent with the single-minded focus of a detective who has forgotten why they started.",
      "Nose down, ears trailing, completely ignoring your calls. The Chief Inspector of its own investigation.",
      "The Beagle has never once been distracted from a scent. This is admirable in a dog and alarming in a Commissioner.",
    ],
  },
  "Bloodhound": {
    titles: ["Chief Inspector","Superintendent","Commissioner","Judge"],
    boyNames: ["Sherlock","Watson","Lestrade","Morse","Frost","Taggart","Wexford","Dalziel"],
    girlNames: ["Lynley","Tennison","Banks","Vera","Lewis","Foyle","Scott","Bucket"],
    reasoning: [
      "The Bloodhound has the most powerful nose in the animal kingdom and the expression of someone who sincerely regrets it.",
      "A dog that can follow a scent four days old across seventeen miles of countryside. Commissioner was the floor, not the ceiling.",
      "The Bloodhound takes its investigative duties extremely seriously. The rest of the time it sleeps on the sofa.",
    ],
  },
  "Border Collie": {
    titles: ["Lieutenant","Second Lieutenant","Professor"],
    boyNames: ["Duncan","Angus","Hamish","Fraser","Ewan","Callum","Rory","Fergus"],
    girlNames: ["Fiona","Catriona","Morag","Isla","Kirsty","Ailsa","Rhona","Shona"],
    reasoning: [
      "The Border Collie is the most intelligent dog in the world and absolutely cannot stop telling you about it.",
      "A dog that herds sheep, children, and visiting relatives with equal efficiency. The Lieutenant does the actual work.",
      "The Professor is the only rank that explains why a Border Collie looks permanently disappointed in your life choices.",
    ],
  },
  "Poodle": {
    titles: ["Professor","Doctor"],
    boyNames: ["Pierre","Jacques","François","Henri","Marcel","Gaston","Fernand","Théodore"],
    girlNames: ["Colette","Marguerite","Simone","Yvette","Brigitte","Monique","Claudette","Giselle"],
    reasoning: [
      "The Poodle is the most intelligent dog in the world after the Border Collie, and considerably better dressed.",
      "Originally a water retriever, now primarily a philosopher. The doctorate was a natural progression.",
      "The Poodle regards the standard trim as a personal affront to its dignity. Professor suits it far better.",
    ],
  },
  "Dachshund": {
    titles: ["The Notorious","The Incomparable","The Inimitable","The Illustrious"],
    boyNames: ["Klaus","Dieter","Gunter","Franz","Hans","Otto","Ernst","Wolfgang"],
    girlNames: ["Helga","Greta","Hilde","Inge","Ursula","Dagmar","Elke","Renate"],
    reasoning: [
      "The Dachshund is six inches tall and absolutely convinced it could take a badger. The Notorious was the only honest title.",
      "Two thousand years of German engineering went into a dog that cannot reach most surfaces. The Incomparable.",
      "The Dachshund moves through the world like a very short scandal. The Notorious was practically inevitable.",
    ],
  },
  "Pug": {
    titles: ["The Notorious","The Incomparable","The Inimitable","The Illustrious"],
    boyNames: ["Napoleon","Pugsley","Monty","Winston","Buster","Frank","Hugo","Boris"],
    girlNames: ["Margo","Edna","Tallulah","Cleo","Dolly","Minnie","Lulu","Fifi"],
    reasoning: [
      "The Pug has been snoring in royal bedchambers since the Ming dynasty. The Notorious was understating it.",
      "A face like a fist, a personality like a party. The Incomparable was the most accurate available description.",
      "The Pug breathes loudly through every social occasion with complete confidence. The Illustrious Pug.",
    ],
  },
  "Chihuahua": {
    titles: ["The Notorious","The Incomparable","The Inimitable","The Illustrious"],
    boyNames: ["Carlos","Miguel","Diego","Fernando","Eduardo","Rodrigo","Alejandro","Manuel"],
    girlNames: ["Carmela","Rosita","Pilar","Conchita","Dolores","Esperanza","Marisol","Lupita"],
    reasoning: [
      "The Chihuahua believes it is a Great Dane trapped in a terrible administrative error. The Notorious fits.",
      "The smallest dog in the world with the largest threat assessment of any living creature. The Incomparable.",
      "The Chihuahua once attempted to see off a lorry. The lorry backed down. The Inimitable.",
    ],
  },
  "Great Dane": {
    titles: ["The Great","The Magnificent","The Formidable","The Legendary"],
    boyNames: ["Magnus","Sigurd","Bjorn","Erik","Leif","Gunnar","Harald","Thorvald"],
    girlNames: ["Astrid","Sigrid","Ingrid","Freya","Thyra","Ragnhild","Gudrun","Bergljot"],
    reasoning: [
      "The Great Dane is the size of a small horse and has absolutely no idea. The Great was barely adequate.",
      "A dog that can rest its chin on a dining table without effort. The Magnificent earned at every meal.",
      "The Great Dane sits on your lap with the complete confidence of something that weighs sixty kilograms. The Formidable.",
    ],
  },
  "Mastiff": {
    titles: ["The Great","The Magnificent","The Formidable","The Unstoppable","The Legendary"],
    boyNames: ["Caesar","Augustus","Brutus","Maximus","Tiberius","Claudius","Hadrian","Trajan"],
    girlNames: ["Augusta","Livia","Claudia","Valeria","Flavia","Julia","Cornelia","Octavia"],
    reasoning: [
      "The Mastiff guarded the estates of English nobles for a thousand years. The Great is the minimum courtesy.",
      "The Mastiff is technically classified as a dog but operates more like a geographic feature. The Formidable.",
      "A dog that Roman emperors kept for war. The Legendary understates the historical record somewhat.",
    ],
  },
  "Saint Bernard": {
    titles: ["The Great","The Magnificent","The Formidable","The Legendary"],
    boyNames: ["Bernard","Anselm","Augustine","Benedict","Boniface","Clement","Dominic","Francis"],
    girlNames: ["Agnes","Brigid","Clare","Felicity","Gertrude","Hildegard","Marguerite","Scholastica"],
    reasoning: [
      "The Saint Bernard has rescued travellers in the Alps for three hundred years, often with a small barrel of brandy. The Great.",
      "The Magnificent Saint Bernard arrives at exactly the right moment, usually through a snowdrift.",
      "A dog that carries its own refreshments to a rescue. The Legendary does not capture the full achievement.",
    ],
  },
  "Irish Wolfhound": {
    titles: ["The Great","The Legendary","Duke","Earl","Lord"],
    boyNames: ["Cormac","Fionn","Diarmuid","Oisin","Conor","Fergus","Tiernan","Brendan"],
    girlNames: ["Niamh","Aoife","Grainne","Siobhan","Deirdre","Orla","Maeve","Brigid"],
    reasoning: [
      "The Irish Wolfhound was bred to pull Norse warriors from their horses. The Great is historically conservative.",
      "The tallest dog in the world, bred for battle. A Dukedom seemed the minimum social acknowledgement.",
      "The Irish Wolfhound has been the companion of Irish kings since before records began. The Legendary.",
    ],
  },
  "Siberian Husky": {
    titles: ["The Notorious","The Incomparable","The Inimitable"],
    boyNames: ["Balto","Togo","Nanook","Kodiak","Denali","Yukon","Klondike","Sitka"],
    girlNames: ["Nanuq","Siku","Kaya","Sakari","Talini","Anana","Suka","Kira"],
    reasoning: [
      "The Siberian Husky has pulled sleds three thousand miles through the Arctic and then howled about it. The Notorious.",
      "A dog that can run all day, talk all evening, and escape from any enclosure ever devised. The Incomparable.",
      "The Husky looks directly into your eyes and then does exactly what it was going to do anyway. The Inimitable.",
    ],
  },
  "Corgi": {
    titles: ["The Notorious","The Incomparable","The Illustrious"],
    boyNames: ["Owen","Rhys","Gareth","Ifor","Emrys","Caradoc","Llewelyn","Tudor"],
    girlNames: ["Bronwen","Cerys","Megan","Sian","Angharad","Morfudd","Nerys","Olwen"],
    reasoning: [
      "The Corgi has lived in palaces for ninety years and is under no illusions about who runs them. The Notorious.",
      "Eleven inches tall, herds cattle by nipping their heels. The Incomparable is barely half the story.",
      "The Corgi was the preferred companion of the longest-reigning British monarch. The Illustrious barely covers it.",
    ],
  },
  "Rottweiler": {
    titles: ["Colonel","Major","Captain"],
    boyNames: ["Bruno","Kaiser","Rommel","Blücher","Sepp","Ludwig","Ulrich","Konrad"],
    girlNames: ["Brunhilde","Adelheid","Irmgard","Lieselotte","Traudl","Hedwig","Elfriede","Gertrud"],
    reasoning: [
      "The Rottweiler drove cattle to Roman markets and never once lost count. Colonel was the natural outcome.",
      "A dog of extraordinary loyalty and zero tolerance for nonsense. The Major runs a tight ship.",
      "The Rottweiler has been serious about its responsibilities since the Roman Empire. The Captain concurs.",
    ],
  },
  "Doberman Pinscher": {
    titles: ["Colonel","Major","Captain"],
    boyNames: ["Karl","Friedrich","Albrecht","Maximilian","Kasimir","Leopold","Thaddeus","Viktor"],
    girlNames: ["Eleonore","Frederike","Albertine","Maximiliane","Leopoldine","Wilhelmine","Ernestine","Henriette"],
    reasoning: [
      "The Doberman was bred by a tax collector who wanted protection on his rounds. It remains overqualified for most work.",
      "Elegant, fast, and faintly terrifying. The Colonel's office was the obvious destination.",
      "The Doberman has never once not been on duty. Not even asleep. Especially not asleep.",
    ],
  },
  "Dalmatian": {
    titles: ["Viscount","Baron","The Right Honourable","Baroness"],
    boyNames: ["Pongo","Sebastian","Jasper","Horace","Crispin","Dashiell","Monty","Rupert"],
    girlNames: ["Perdita","Cadence","Portia","Vivienne","Cecily","Ottoline","Clarissa","Vivian"],
    reasoning: [
      "The Dalmatian once ran alongside carriages for the landed gentry. Viscount is the appropriate rank for such service.",
      "A dog that arrives like a formal announcement and departs like a scandal. The Right Honourable.",
      "The Dalmatian has been the most recognisable dog in England since the coaching era. A Barony was the least it deserved.",
    ],
  },
  "Old English Sheepdog": {
    titles: ["Baron","Baroness","Viscount","Viscountess"],
    boyNames: ["Archie","Shaggy","Rumpus","Mopsy","Greybeard","Woolly","Barnacle","Fluffington"],
    girlNames: ["Mopsy","Flossie","Woolly","Bramble","Thatch","Cloudberry","Dindle","Teasel"],
    reasoning: [
      "The Old English Sheepdog arrives in every situation looking like it has walked through a hedge. A Baron of hedges.",
      "So much fur that nobody has ever seen its face clearly. The Viscountcy came with the territory.",
      "The Old English Sheepdog herded and guarded for centuries, usually while completely obscuring its own vision.",
    ],
  },
  "Rough Collie": {
    titles: ["Lieutenant","Second Lieutenant","Professor"],
    boyNames: ["Lassie","Bruce","Douglas","Kenneth","Malcolm","Alastair","Ewan","Dougal"],
    girlNames: ["Lassie","Flora","Heather","Morag","Ishbel","Finella","Effie","Nessa"],
    reasoning: [
      "The Rough Collie has been rescuing people from wells since the Victorian era and expects some recognition.",
      "The Professor is the only rank that explains the slightly disappointed expression when you do something wrong.",
      "The Rough Collie always knows where you are and where you should be instead. Lieutenant at minimum.",
    ],
  },
  "Weimaraner": {
    titles: ["Colonel","Major","Captain","Commander"],
    boyNames: ["Wilhelm","Dieter","Ernst","Horst","Rolf","Bernd","Jürgen","Hartmut"],
    girlNames: ["Hannelore","Renate","Waltraud","Sigrid","Inge","Uschi","Heike","Jutta"],
    reasoning: [
      "The Grey Ghost of Germany -- bred for nobility, used for everything. The Colonel's silver coat matched the rank.",
      "The Weimaraner was the preferred hunting dog of the Duke of Weimar. A Major was practically a demotion.",
      "Ghost-grey, fast and utterly focused. The Captain's commission was awarded for sheer presence.",
    ],
  },
  "French Bulldog": {
    titles: ["The Notorious","The Incomparable","The Inimitable"],
    boyNames: ["Gaston","Napoléon","Gustave","Edouard","Fernand","Armand","Théophile","Clément"],
    girlNames: ["Colette","Juliette","Amélie","Madeleine","Suzette","Babette","Claudette","Geneviève"],
    reasoning: [
      "The French Bulldog breathes like a set of antique bellows and has never once let this affect its confidence. The Notorious.",
      "Brought from England to France and somehow claimed by both as a cultural achievement. The Incomparable.",
      "The French Bulldog sleeps for twenty hours a day with absolute conviction it is doing this correctly. The Inimitable.",
    ],
  },
  "Bichon Frise": {
    titles: ["Reverend","Dean","Bishop","Archdeacon"],
    boyNames: ["Florentine","Celestin","Anselme","Théodule","Prosper","Alcide","Onésime","Séraphin"],
    girlNames: ["Célestine","Angélique","Séraphine","Hyacinthe","Thérèse","Blandine","Clothilde","Euphrasie"],
    reasoning: [
      "The Bichon Frise looks like a small cloud that someone has given opinions. The Reverend was the natural conclusion.",
      "Perpetually groomed, permanently cheerful, mildly judgmental. Dean of the Diocese of the Sitting Room.",
      "The Bichon Frise has maintained this exact hairstyle since the French Renaissance. An Archdeacon of consistency.",
    ],
  },
  "Shih Tzu": {
    titles: ["Reverend","Dean","Bishop","Archdeacon"],
    boyNames: ["Ming","Qing","Han","Tang","Song","Wei","Zhou","Liu"],
    girlNames: ["Mei","Lan","Hua","Xiu","Rui","Ying","Jing","Fang"],
    reasoning: [
      "The Shih Tzu lived in Chinese imperial palaces for a thousand years. The Bishopric was a step down, frankly.",
      "A dog bred purely for companionship and completely aware of it. The Dean of the comfortable life.",
      "The Shih Tzu has a beard, a moustache, and a permanent expression of theological disapproval. The Reverend.",
    ],
  },
  "Pomeranian": {
    titles: ["Reverend","Dean","Bishop","Archdeacon"],
    boyNames: ["Fritz","Kurt","Wilhelm","Günther","Eberhard","Lothar","Dietrich","Gerhard"],
    girlNames: ["Elfriede","Ingeborg","Anneliese","Hannelore","Walburga","Kunigunde","Hildegunde","Mechthild"],
    reasoning: [
      "The Pomeranian is the size of a large teacup and considers itself a Great Dane of the clergy. The Bishop.",
      "Queen Victoria kept thirty-five Pomeranians. The Archdeacon is merely the most senior of the survivors.",
      "The Pomeranian requires grooming twice daily and a confirmation of its own importance at least hourly. The Dean.",
    ],
  },
  "Papillon": {
    titles: ["Reverend","Dean","Bishop","Archdeacon"],
    boyNames: ["Papillon","Lafayette","Voltaire","Rousseau","Montesquieu","Beaumarchais","Mirabeau","Condorcet"],
    girlNames: ["Papillonne","Colette","Simone","Violette","Miette","Lisette","Nanette","Cosette"],
    reasoning: [
      "The Papillon has butterfly ears and the manner of a Bishop who has already heard your confession and found it wanting.",
      "The French courts adored the Papillon. The Dean of the butterfly wing of the palace chapel.",
      "The Papillon flutters into every room and sits in judgement. The Archdeacon of Impeccable Ear Management.",
    ],
  },
  "Maltese": {
    titles: ["Reverend","Dean","Bishop"],
    boyNames: ["Angelo","Marco","Paolo","Luca","Nico","Sergio","Carlo","Bruno"],
    girlNames: ["Maria","Sofia","Elena","Lucia","Anna","Rosa","Carla","Giulia"],
    reasoning: [
      "The Maltese has been the lapdog of Mediterranean nobility since Ancient Greece. The Reverend of the silk cushion.",
      "Two thousand years of sitting on expensive surfaces and being adored. The Dean of Dignified Repose.",
      "The Maltese is small enough to fit in a sleeve and has been living in them since the Roman Empire. Bishop.",
    ],
  },
  "Yorkshire Terrier": {
    titles: ["Mr","Miss"],
    boyNames: ["Ernie","Herbert","Stanley","Cyril","Wilfred","Alf","Bert","Norman"],
    girlNames: ["Ethel","Vera","Hilda","Doris","Gladys","Mabel","Enid","Edith"],
    reasoning: [
      "The Yorkshire Terrier was bred by mill workers to catch rats. It has never forgotten this and neither has the rat.",
      "The only dog that can terrorise a full-grown Alsatian while fitting in a handbag. Mr suits it perfectly.",
      "From the wool mills of the West Riding, the Yorkie asked for no grand titles -- it didn't need them.",
    ],
  },
};

function getBreedGroup(breed: string): string {
  const b = breed.toLowerCase();
  if (b.includes("terrier") || b === "miniature schnauzer") return "terrier";
  if (b.includes("spaniel") || b === "cocker spaniel" || b === "springer spaniel") return "spaniel";
  if (b.includes("retriever") || b === "labrador" || b === "golden retriever") return "retriever";
  if (b === "border collie" || b === "rough collie") return "collie";
  if (b === "staffordshire bull terrier" || b === "boxer" || b === "bull terrier" || b === "bulldog") return "tough";
  if (b === "basset hound" || b === "bloodhound" || b === "beagle") return "sniffer";
  if (b === "greyhound" || b === "afghan hound" || b === "borzoi" || b === "saluki" || b === "irish wolfhound" || b === "lurcher" || b === "whippet" || b === "italian greyhound") return "sighthound";
  if (b === "great dane" || b === "mastiff" || b === "saint bernard" || b === "newfoundland" || b === "leonberger") return "giant";
  if (b === "poodle") return "poodle";
  if (b === "cavalier king charles spaniel" || b === "shih tzu" || b === "pomeranian" || b === "papillon" || b === "maltese" || b === "bichon frise") return "lapdog";
  if (b === "dachshund" || b === "pug" || b === "siberian husky" || b === "chihuahua" || b === "corgi") return "character";
  if (b === "dalmatian" || b === "old english sheepdog" || b === "bernese mountain dog") return "gentry";
  if (b.includes("doodle") || b.includes("poo") || b.includes("apoo")) return "doodle";
  return "default";
}

const GROUP_DATA: Record<string, Omit<BreedData, "nickname">> = {
  terrier: {
    titles: ["Mr","Miss"],
    boyNames: ["Sid","Eric","Norman","Bert","Ron","Les","Dave","Ken","Jim","Ted"],
    girlNames: ["Betty","Vera","Edna","Nora","Marg","Dot","Bev","Pam","Jan","Sue"],
    reasoning: [
      "Terriers ask for no grand titles. They have always earned their place through sheer refusal to give up.",
      "A terrier would consider a title an unnecessary distraction from the serious business of digging.",
      "The only dog that regularly picks fights with things three times its size and wins. Mr says it all.",
    ],
  },
  spaniel: {
    titles: ["Field Marshal","General","Admiral","Brigadier","Colonel"],
    boyNames: ["Archibald","Wellington","Rupert","Alistair","Cedric","Cornelius","Peregrine","Desmond","Humphrey","Everard"],
    girlNames: ["Georgiana","Arabella","Clementine","Millicent","Cordelia","Beatrice","Frederica","Constance","Prudence","Imogen"],
    reasoning: [
      "Spaniels have commanded hunting parties since the Tudor court. A generalship was long overdue.",
      "The spaniel spent centuries giving orders to beaters and retrievers. Command suits it naturally.",
      "Floppy ears and absolute authority -- the spaniel was born to lead.",
    ],
  },
  retriever: {
    titles: ["Colonel","Major","Captain","Commander"],
    boyNames: ["Douglas","Barnaby","Clifford","Edmund","Roderick","Herbert","Aubrey","Bertram","Clarence","Frederick"],
    girlNames: ["Margaret","Dorothy","Patricia","Winifred","Edith","Muriel","Florence","Beatrice","Augusta","Helena"],
    reasoning: [
      "Retrievers serve with unwavering loyalty and cheerful enthusiasm. Colonel was the minimum acceptable rank.",
      "Dependable, cheerful, and convinced every situation calls for a biscuit. Classic Major energy.",
      "The retriever approaches every command with enthusiasm and then sits on your foot. A natural Captain.",
    ],
  },
  collie: {
    titles: ["Lieutenant","Second Lieutenant","Professor"],
    boyNames: ["Duncan","Angus","Hamish","Fraser","Ewan","Callum","Rory","Fergus","Malcolm","Alastair"],
    girlNames: ["Fiona","Catriona","Morag","Isla","Kirsty","Ailsa","Rhona","Shona","Flora","Heather"],
    reasoning: [
      "The most intelligent dog in the world and completely unable to stop demonstrating it.",
      "A dog that herds sheep, children, and visiting relatives with equal efficiency. The Lieutenant does the actual work.",
      "The Professor is the only rank that explains why it looks permanently disappointed in your life choices.",
    ],
  },
  tough: {
    titles: ["Sergeant","Corporal","Lance Corporal"],
    boyNames: ["Trevor","Gary","Dwayne","Kevin","Rocky","Buster","Bruno","Chip","Flash","Reg"],
    girlNames: ["Sharon","Tracy","Donna","Beverley","Roxie","Bonnie","Blaze","Pepper","Ruby","Stella"],
    reasoning: [
      "Loyal, loud, and absolutely convinced sitting on your lap is a human right. Classic Corporal.",
      "The Sergeant who everyone actually respects while pretending to respect the Colonel.",
      "Never met a stranger. This is not always helpful on military exercises.",
    ],
  },
  sniffer: {
    titles: ["Inspector","Chief Inspector","Superintendent","Commissioner","Judge"],
    boyNames: ["Barnaby","Mortimer","Sherlock","Hercule","Wilfred","Algernon","Cuthbert","Nigel","Clive","Roger"],
    girlNames: ["Agatha","Millicent","Gertrude","Prudence","Constance","Lavinia","Janet","Susan","Carol","Linda"],
    reasoning: [
      "A nose more powerful than any instrument ever devised. The Inspectorate was the natural career path.",
      "Melancholy eyes, extraordinary nose, deeply suspicious of everything. Classic Chief Inspector.",
      "Follows a scent with single-minded focus of a detective who has forgotten why they started.",
    ],
  },
  sighthound: {
    titles: ["Duke","Duchess","Earl","Countess","Lord","Lady","Sir","Dame","Viscount","Viscountess"],
    boyNames: ["Auberon","Lysander","Phineas","Caspian","Orlando","Leander","Tarquin","Evander","Philip","Felix"],
    girlNames: ["Araminta","Isadora","Thessaly","Calliope","Delphine","Evangeline","Iphigenia","Seraphina","Pippa","Felicity"],
    reasoning: [
      "Aristocrats to their bones -- they have graced royal courts since ancient times.",
      "The earldom was awarded purely for deportment. The speed was merely incidental.",
      "A dog that has always considered the peerage its natural social circle -- if anything, beneath it.",
    ],
  },
  giant: {
    titles: ["The Great","The Magnificent","The Formidable","The Legendary","The Unstoppable"],
    boyNames: ["Magnus","Caesar","Augustus","Maximus","Sigurd","Bjorn","Bernard","Anselm"],
    girlNames: ["Augusta","Astrid","Sigrid","Ingrid","Freya","Livia","Cornelia","Octavia"],
    reasoning: [
      "So large that the title had to match the physical reality. The Great was barely adequate.",
      "The Magnificent was awarded at the first meeting. There was no second opinion.",
      "A dog that operates more like a geographic feature than an animal. The Formidable.",
    ],
  },
  poodle: {
    titles: ["Professor","Doctor"],
    boyNames: ["Pierre","Jacques","François","Henri","Marcel","Gaston","Fernand","Théodore"],
    girlNames: ["Colette","Marguerite","Simone","Yvette","Brigitte","Monique","Claudette","Giselle"],
    reasoning: [
      "The Poodle is the most intelligent dog in the world and considerably better dressed than you.",
      "Originally a water retriever, now primarily a philosopher. The doctorate was inevitable.",
      "The Poodle regards the standard trim as a personal affront. Professor suits it far better.",
    ],
  },
  lapdog: {
    titles: ["Reverend","Dean","Bishop","Archdeacon"],
    boyNames: ["Florentine","Celestin","Anselme","Sebastian","Rupert","Charles","Angelo","Marco"],
    girlNames: ["Célestine","Angélique","Séraphine","Colette","Juliette","Amélie","Maria","Sofia"],
    reasoning: [
      "Looks like a small cloud that someone has given opinions. The Reverend was the natural conclusion.",
      "Perpetually groomed, permanently cheerful, mildly judgmental. Dean of the Diocese of the Sitting Room.",
      "Has maintained this exact hairstyle for several centuries. An Archdeacon of consistency.",
    ],
  },
  character: {
    titles: ["The Notorious","The Incomparable","The Inimitable","The Illustrious"],
    boyNames: ["Napoleon","Klaus","Dieter","Gunter","Franz","Hans","Pugsley","Monty","Winston","Boris"],
    girlNames: ["Helga","Greta","Margo","Edna","Tallulah","Cleo","Dolly","Minnie","Lulu","Fifi"],
    reasoning: [
      "A dog of legendary personality that treats rules as interesting suggestions. The Notorious.",
      "Approaches every situation with maximum confidence and minimum regard for consequences. The Incomparable.",
      "Breathes loudly through every social occasion with complete conviction it is doing this correctly. The Inimitable.",
    ],
  },
  gentry: {
    titles: ["Viscount","Viscountess","Baron","Baroness","The Right Honourable"],
    boyNames: ["Pongo","Sebastian","Jasper","Horace","Crispin","Archie","Monty","Rupert","Cecil","Edmund"],
    girlNames: ["Perdita","Cadence","Portia","Vivienne","Cecily","Ottoline","Clarissa","Flossie","Mopsy","Thatch"],
    reasoning: [
      "Landed gentry from the coaching era. The Viscountcy came with the estate.",
      "Arrives like a formal announcement and departs like a scandal. The Right Honourable.",
      "The most recognisable dog in England since the Georgian period. A Barony was the least.",
    ],
  },
  doodle: {
    titles: ["Professor","Major","Inspector","The Magnificent"],
    boyNames: ["Archie","Oscar","Buddy","Charlie","Monty","Teddy","Rufus","Dexter","Hugo","Otis"],
    girlNames: ["Bella","Poppy","Luna","Rosie","Daisy","Lola","Coco","Ellie","Molly","Tilly"],
    reasoning: [
      "The crossbreed that got the intelligence of one parent and the fur of the other. The Professor of the hybrid arts.",
      "Twice the breed for the price of one -- the Major of pragmatic solutions.",
      "A dog with no historical precedent and absolutely no self-doubt about this. The Magnificent.",
    ],
  },
  default: {
    titles: ["Major","Inspector","The Distinguished","Baron","Lord"],
    boyNames: ["Archibald","Barnaby","Cornelius","Douglas","Edmund","Frederick","Geoffrey","Herbert"],
    girlNames: ["Arabella","Beatrice","Clementine","Dorothy","Eleanor","Frederica","Georgiana","Helena"],
    reasoning: [
      "A dog of considerable distinction that has earned its title through sheer presence.",
      "The rank was awarded after careful consideration of the evidence. The evidence was considerable.",
      "A distinguished animal that does not require historical precedent for its own importance.",
    ],
  },
};

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function makeName(breed: string, surname: string, gender: "boy" | "girl", seed: number) {
  const data: BreedData = BREED_DATA[breed] || {
    ...GROUP_DATA[getBreedGroup(breed)],
    nickname: undefined,
  };

  const titles = data.titles;
  const names = gender === "boy" ? data.boyNames : data.girlNames;
  const isMrMiss = titles.length === 2 && (titles[0] === "Mr" || titles[0] === "Miss");
  const title = isMrMiss
    ? (gender === "boy" ? "Mr" : "Miss")
    : pick(titles, seed);

  const firstName = pick(names, seed + 1);

  const group = getBreedGroup(breed);
  const wordBank = DOG_WORDS_BY_GROUP[group] || DOG_WORDS_BY_GROUP["default"];
  const dogWord = pick(wordBank, seed + 2);
  const alreadyHyphenated = surname.includes("-");
  const fullSurname = alreadyHyphenated ? surname : `${dogWord}-${surname}`;
  const full = `${title} ${firstName} ${fullSurname}`;

  const reasoning = pick(data.reasoning, seed + 3);

  const breedWord = breed.split(" ")[0];
  const nick = blend(breedWord, firstName);

  return { full, nickname: nick || "", reasoning };
}

type Result = { full: string; nickname: string; reasoning: string };

export default function NameGeneratorPage() {
  const [breed, setBreed] = useState("");
  const [surname, setSurname] = useState("");
  const [gender, setGender] = useState<"boy" | "girl">("boy");
  const [results, setResults] = useState<Result[] | null>(null);
  const [seed, setSeed] = useState(0);

  function generate() {
    if (!breed) { alert("Please select a breed"); return; }
    if (!surname.trim()) { alert("Please enter your surname"); return; }
    const newSeed = Math.floor(Math.random() * 1000);
    setSeed(newSeed);
    const names = [
      makeName(breed, surname.trim(), gender, newSeed),
      makeName(breed, surname.trim(), gender, newSeed + 7),
      makeName(breed, surname.trim(), gender, newSeed + 17),
    ];
    const seen = new Set<string>();
    const deduped = names.map((n, i) => {
      let attempt = n;
      let tries = 0;
      while (seen.has(attempt.full.split(" ")[0] + attempt.full.split(" ")[1]) && tries < 10) {
        attempt = makeName(breed, surname.trim(), gender, newSeed + 7 * (i + 1) + tries * 3);
        tries++;
      }
      seen.add(attempt.full.split(" ")[0] + attempt.full.split(" ")[1]);
      return attempt;
    });
    setResults(deduped);
  }

  return (
    <>
      <Nav />
      <main style={{ minHeight: "100vh", padding: "clamp(60px,10vw,120px) clamp(16px,5vw,48px) 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h1 className="display" style={{ textAlign: "center", marginBottom: 8 }}>
            Chum <span className="display-yellow">Name</span> Generator
          </h1>
          <p style={{ textAlign: "center", color: "var(--navy)", fontFamily: "var(--font-body)", fontSize: "1rem", fontWeight: 600, marginBottom: 40 }}>
            Give your dog the title they truly deserve
          </p>

          <div style={{ background: "var(--navy)", borderRadius: 20, padding: "clamp(20px,4vw,36px)", marginBottom: 24 }}>
            <label style={{ display: "block", color: "var(--yellow)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "var(--font-body)" }}>Your dog&apos;s breed</label>
            <select value={breed} onChange={e => setBreed(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: breed ? "#fff" : "rgba(255,255,255,0.4)", fontFamily: "var(--font-body)", fontSize: "0.95rem", marginBottom: 20, outline: "none", boxSizing: "border-box" }}>
              <option value="">-- Select a breed --</option>
              <optgroup label="Pedigree Chums Pack Breeds">
                {PACK_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
              </optgroup>
              <optgroup label="Other Breeds">
                {OTHER_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
              </optgroup>
            </select>

            <label style={{ display: "block", color: "var(--yellow)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "var(--font-body)" }}>Your surname</label>
            <input type="text" value={surname} onChange={e => setSurname(e.target.value)}
              placeholder="e.g. Jones, Clarke, Thompson-Alexander..."
              maxLength={60}
              onKeyDown={e => e.key === "Enter" && generate()}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", fontFamily: "var(--font-body)", fontSize: "0.95rem", marginBottom: 20, outline: "none", boxSizing: "border-box" }} />

            <label style={{ display: "block", color: "var(--yellow)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontFamily: "var(--font-body)" }}>Boy or girl?</label>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {(["boy","girl"] as const).map(g => (
                <button key={g} onClick={() => setGender(g)}
                  style={{ flex: 1, padding: 12, borderRadius: 12, border: `1.5px solid ${gender === g ? "var(--yellow)" : "rgba(255,255,255,0.15)"}`, background: gender === g ? "var(--yellow)" : "rgba(255,255,255,0.08)", color: gender === g ? "var(--navy)" : "#fff", fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>
                  {g === "boy" ? "Boy" : "Girl"}
                </button>
              ))}
            </div>

            <button onClick={generate} className="display"
              style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", background: "var(--yellow)", color: "var(--navy)", fontSize: "1.3rem", cursor: "pointer", boxShadow: "0 4px 0 rgba(10,58,87,0.4)", letterSpacing: "0.04em" }}>
              Find my chum&apos;s name
            </button>
          </div>

          {results && results.map((n, i) => (
            <div key={`${seed}-${i}`} style={{ background: "#fff", borderRadius: 18, padding: "clamp(16px,3vw,28px)", marginBottom: 16, borderTop: "5px solid var(--yellow)", boxShadow: "0 2px 16px rgba(10,58,87,0.08)" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--blue-sky)", marginBottom: 8, fontFamily: "var(--font-body)" }}>Option {i + 1}</div>
              <div className="display" style={{ fontSize: "clamp(1.2rem,3vw,1.7rem)", color: "var(--navy)", marginBottom: 4, lineHeight: 1.2 }}>{n.full}</div>
              {n.nickname && (
                <div style={{ fontSize: "0.85rem", color: "var(--blue-deep)", fontStyle: "italic", marginBottom: 14, fontFamily: "var(--font-body)", fontWeight: 600 }}>
                  Known to friends as: {n.nickname}
                </div>
              )}
              <div style={{ fontSize: "0.85rem", color: "#444", lineHeight: 1.65, borderTop: "1px solid #eee", paddingTop: 14, fontFamily: "var(--font-body)" }}>{n.reasoning}</div>
            </div>
          ))}

          {results && (
            <button onClick={generate} className="display"
              style={{ width: "100%", padding: 15, borderRadius: 14, border: "3px solid var(--navy)", background: "transparent", color: "var(--navy)", fontSize: "1.2rem", cursor: "pointer", letterSpacing: "0.04em", marginTop: 8 }}>
              Try again
            </button>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
