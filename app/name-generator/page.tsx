"use client";
import { useState } from "react";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";

// ── CARD IMAGE MAP ─────────────────────────────────────────────────────────────
const CARD_IMAGE: Record<string, string> = {
  "Afghan Hound": "/afghan-card.jpg",
  "Basset Hound": "/basset-card.jpg",
  "Beagle": "/beagle-card.jpg",
  "Bichon Frise": "/bichon-card.jpg",
  "Bloodhound": "/bloodhound-card.jpg",
  "Border Collie": "/collie-card.jpg",
  "Border Terrier": "/border-terrier-card.jpg",
  "Boston Terrier": "/boston-card.jpg",
  "Boxer": "/boxer-card.jpg",
  "Bull Terrier": "/bull-terrier-card.jpg",
  "Bulldog": "/bulldog-card.jpg",
  "Cavalier King Charles Spaniel": "/cavalier-card.jpg",
  "Cavachon": "/cavachon-card.jpg",
  "Cavapoo": "/cavapoo-card.jpg",
  "Chihuahua": "/chihuahua-card.jpg",
  "Cocker Spaniel": "/cocker-card.jpg",
  "Cockapoo": "/cockapoo-card.jpg",
  "Corgi": "/corgi-card.jpg",
  "Dachshund": "/dachshund-card.jpg",
  "Dalmatian": "/dalmation-card.jpg",
  "Doberman Pinscher": "/doberman-card.jpg",
  "French Bulldog": "/french-bulldog-card.jpg",
  "German Shepherd": "/german-sheperd-card.jpg",
  "Golden Retriever": "/golden-retriever-card.jpg",
  "Goldendoodle": "/goldendoodle-card.jpg",
  "Great Dane": "/great-dane-card.jpg",
  "Greyhound": "/greyhound-card.jpg",
  "Irish Setter": "/setter-card.jpg",
  "Irish Wolfhound": "/irish-wolfhound-card.jpg",
  "Italian Greyhound": "/italian-card.jpg",
  "Jack Russell Terrier": "/jack-russel-card.jpg",
  "Jackapoo": "/jackapoo-card.jpg",
  "Labrador": "/lab-card.jpg",
  "Labradoodle": "/labradoodle-card.jpg",
  "Lurcher": "/lurcher-card.jpg",
  "Maltese": "/maltese-card.jpg",
  "Maltipoo": "/maltipoo-card.jpg",
  "Mastiff": "/mastiff-card.jpg",
  "Miniature Schnauzer": "/scnauzer-card.jpg",
  "Old English Sheepdog": "/old-english-card.jpg",
  "Papillon": "/papillion-card.jpg",
  "Pomeranian": "/pomeranian-card.jpg",
  "Poodle": "/poodle-card.jpg",
  "Pug": "/pug-card.jpg",
  "Rottweiler": "/rottweiler-card.jpg",
  "Rough Collie": "/collie-card.jpg",
  "Saint Bernard": "/st-bernard-card.jpg",
  "Shih Tzu": "/shuh-tzu-card.jpg",
  "Siberian Husky": "/husky-card.jpg",
  "Springer Spaniel": "/springer-card.jpg",
  "Staffordshire Bull Terrier": "/staffy-card.jpg",
  "Weimaraner": "/weinaraner-card.jpg",
  "West Highland Terrier": "/west-highland-card.jpg",
  "Whippet": "/whippet-card.jpg",
  "Yorkshire Terrier": "/yorkshire-card.jpg",
};


// ── FUNNY UK PLACE NAMES ───────────────────────────────────────────────────────
const FUNNY_PLACES = new Set([
  "Tooting","Barking","Peckham","Dagenham","Grimethorpe","Woking","Crawley",
  "Croydon","Surbiton","Catford","Neasden","Morden","Plaistow","Purfleet",
  "Rainham","Tilbury","Goodmayes","Hainault","Barkingside","Theydon Bois",
  "Epping","Debden","Loughton","Chigwell","Romford","Hornchurch","Upminster",
  "Basildon","Laindon","Langdon Hills","Pitsea","Benfleet","Leigh-on-Sea",
  "Southend","Shoeburyness","Scunthorpe","Grimsby","Cleethorpes","Hartlepool",
  "Consett","Cramlington","Blyth","Ashington","Workington","Whitehaven",
  "Maryport","Wigton","Carlisle","Skipton","Keighley","Bingley","Shipley",
  "Pudsey","Morley","Batley","Dewsbury","Ossett","Wakefield","Castleford",
  "Pontefract","Featherstone","Hemsworth","Barnsley","Wombwell","Rotherham",
  "Mexborough","Doncaster","Conisbrough","Maltby","Worksop","Retford","Newark",
  "Mansfield","Kirkby","Hucknall","Bulwell","Eastwood","Kimberley","Ilkeston",
  "Heanor","Ripley","Alfreton","Langley Mill","Mold","Clun","Crewe","Nantwich",
  "Winsford","Congleton","Macclesfield","Runcorn","Widnes","Warrington","Wigan",
  "Leigh","Hindley","Ince","Golborne","Skelmersdale","Ormskirk","Burscough",
  "Southport","Formby","Crosby","Bootle","Huyton","Prescot","Whiston",
  "Tillicoultry","Alloa","Sauchie","Tullibody","Dollar","Clackmannan","Alva",
  "Cupar","Auchtermuchty","Ecclefechan","Strathmiglo","Falkland","Freuchie",
  "Kettle","Bow of Fife","Coaltown","Windygates","Lundin Links","Lundin Mill",
  "Upper Largo","Lower Largo","Elie","Pittenweem","Anstruther","Cellardyke",
  "Crail","Dufftown","Keith","Huntly","Inverurie","Kintore","Westhill",
  "Stonehaven","Inverbervie","Montrose","Arbroath","Carnoustie","Monifieth",
  "Broughty Ferry","Lochee","Glamis","Kirriemuir","Forfar","Letham","Brechin",
  "Nether Wallop","Over Wallop","Middle Wallop","Great Snoring","Little Snoring",
  "Upper Slaughter","Lower Slaughter","Great Missenden","Little Missenden",
  "Nether Poppleton","Upper Poppleton","Much Wenlock","Much Hadham","Much Marcle",
  "Long Itchington","Bishops Itchington","Long Buckby","Cold Higham","Naseby",
  "Clipston","Husbands Bosworth","Gilmorton","Bruntingthorpe","Ullesthorpe",
  "Catthorpe","Swinford","Lilbourne","Yelvertoft","Guilsborough","Brixworth",
  "Holcot","Overstone","Yelling","Matching","Matching Tye","Matching Green",
  "Pye Corner","Burnt Mill","Potter Street","Bush Fair","Staple Tye",
  "Halling","Snodland","Cuxton","Wouldham","Burham","Eccles","Aylesford",
  "Ditton","Larkfield","Leybourne","Trottiscliffe","Addington","Wrotham",
  "Borough Green","Ightham","Seal","Kemsing","Otford","Shoreham","Eynsford",
  "Farningham","Horton Kirby","South Darenth","Bean","Betsham","Southfleet",
  "Gravesend","Northfleet","Swanscombe","Greenhithe","Crayford","Slade Green",
  "Erith","Belvedere","Abbey Wood","Thamesmead","Plumstead","Woolwich",
  "Charlton","Greenwich","Deptford","New Cross","Nunhead","Brockley","Crofton Park",
  "Cockfosters","Mudchute","Colliers Wood","Motspur Park","Elephant and Castle",
  "Chessington","Tolworth","Twickenham","Gants Hill","Newbury Park","Roding Valley",
  "Buckhurst Hill","Abridge","Havering","Elm Park","Becontree","Gidea Park",
  "Harold Wood","Emerson Park","Ardleigh Green","Shenfield","Brentwood",
  "Warley","Hutton","Billericay","Wickford","Westcliff","Prittlewell","Thorpe Bay",
  "Oundle","Warmington","Tansor","Cotterstock","Glapthorn","Benefield",
  "Deene","Weldon","Corby","Stanion","Geddington","Weekley","Boughton",
  "Maidwell","Cold Ashby","Hollowell","Creaton","Spratton","Scaldwell",
  "Walgrave","Hannington","Lamport","Raunds","Ringstead","Stanwick","Hargrave",
  "Pertenhall","Kimbolton","Tilbrook","Catworth","Molesworth","Brington",
  "Bythorn","Keyston","Clopton","Thurning",
]);

// ── ABBREVIATION WHITELIST ─────────────────────────────────────────────────────
interface AbbrevEntry { code: string; meaning: string; gender: "boy"|"girl"|"any"; breeds?: string[]; }
const ABBREVS: AbbrevEntry[] = [
  {code:"AC",meaning:"Ace Commander",gender:"boy"},{code:"BB",meaning:"Big Boss",gender:"boy"},
  {code:"BA",meaning:"Bad Attitude",gender:"boy",breeds:["character","boxer"]},
  {code:"BC",meaning:"Boss Commander",gender:"boy"},{code:"BD",meaning:"Big Deal",gender:"boy"},
  {code:"BG",meaning:"Big Gangster",gender:"boy",breeds:["character","boxer"]},
  {code:"BK",meaning:"Boss King",gender:"boy"},{code:"BM",meaning:"Big Money",gender:"boy"},
  {code:"BO",meaning:"Boss Original",gender:"boy"},{code:"BP",meaning:"Big Player",gender:"boy"},
  {code:"CB",meaning:"Certified Boss",gender:"boy"},
  {code:"CK",meaning:"Chaos King",gender:"boy",breeds:["terrier","character"]},
  {code:"CL",meaning:"Certified Lover",gender:"boy"},{code:"CLB",meaning:"Certified Lover Boy",gender:"boy"},
  {code:"DB",meaning:"Da Boss",gender:"boy"},{code:"DC",meaning:"Dream Chaser",gender:"any"},
  {code:"DM",meaning:"Don't Miss",gender:"any"},{code:"DR",meaning:"Da Realest",gender:"boy"},
  {code:"FB",meaning:"Fearless Boss",gender:"boy"},{code:"FL",meaning:"First Lady",gender:"girl"},
  {code:"GC",meaning:"Game Changer",gender:"any"},
  {code:"GM",meaning:"Grand Master",gender:"boy",breeds:["poodle","collie","german"]},
  {code:"HB",meaning:"Head Boss",gender:"boy"},{code:"HC",meaning:"Heart Collector",gender:"boy"},
  {code:"HK",meaning:"Hustle King",gender:"boy"},{code:"HL",meaning:"Heart Lover",gender:"boy"},
  {code:"KB",meaning:"King Boss",gender:"boy"},
  {code:"KC",meaning:"King of Chaos",gender:"boy",breeds:["terrier","character"]},
  {code:"KG",meaning:"King of the Game",gender:"boy"},{code:"KO",meaning:"Knockout",gender:"boy",breeds:["boxer"]},
  {code:"LB",meaning:"Legendary Boss",gender:"boy"},{code:"LC",meaning:"Ladies Choice",gender:"boy"},
  {code:"LG",meaning:"Living Legend",gender:"any",breeds:["giant","sighthound"]},
  {code:"LH",meaning:"Ladies Hero",gender:"boy"},{code:"LK",meaning:"Lady Killer",gender:"boy"},
  {code:"LL",meaning:"Ladies Lover",gender:"boy"},{code:"LM",meaning:"Living Legend",gender:"any"},
  {code:"LP",meaning:"Ladies Pick",gender:"boy"},{code:"MB",meaning:"Master Boss",gender:"boy"},
  {code:"MM",meaning:"Mystery Man",gender:"boy"},{code:"MR",meaning:"Most Respected",gender:"any"},
  {code:"MVP",meaning:"Most Valued Player",gender:"any"},{code:"NA",meaning:"No Apologies",gender:"any"},
  {code:"NB",meaning:"Natural Boss",gender:"boy"},{code:"NF",meaning:"No Fear",gender:"any"},
  {code:"OG",meaning:"Original Gangster",gender:"boy",breeds:["character","boxer","terrier"]},
  {code:"PC",meaning:"Power Commander",gender:"boy"},
  {code:"PG",meaning:"Power Gangster",gender:"boy",breeds:["character","boxer"]},
  {code:"PL",meaning:"Player for Life",gender:"boy"},{code:"QL",meaning:"Queen of Love",gender:"girl"},
  {code:"RB",meaning:"Real Boss",gender:"boy"},{code:"RL",meaning:"Real Lover",gender:"boy"},
  {code:"SC",meaning:"Supreme Commander",gender:"boy",breeds:["character"]},
  {code:"SG",meaning:"Street General",gender:"boy"},{code:"SK",meaning:"Supreme King",gender:"boy"},
  {code:"SL",meaning:"Smooth Lover",gender:"boy"},{code:"TB",meaning:"Top Boss",gender:"boy"},
  {code:"TC",meaning:"Top Cat",gender:"any"},{code:"TG",meaning:"Top Gangster",gender:"boy",breeds:["character","boxer"]},
  {code:"TK",meaning:"The King",gender:"boy"},{code:"TL",meaning:"True Lover",gender:"boy"},
  {code:"TM",meaning:"Top Man",gender:"boy"},{code:"TR",meaning:"The Realest",gender:"boy"},
  {code:"VIP",meaning:"Very Important Person",gender:"any"},
  {code:"YG",meaning:"Young General",gender:"boy"},{code:"YK",meaning:"Young King",gender:"boy"},
  // ── POLICE RANKS ─────────────────────────────────────────────────────────────
  {code:"PC",meaning:"Police Constable",gender:"boy",breeds:["boxer","retriever","default"]},
  {code:"DC",meaning:"Detective Constable",gender:"boy",breeds:["sniffer","default"]},
  {code:"DS",meaning:"Detective Sergeant",gender:"boy",breeds:["sniffer","default"]},
  {code:"DCI",meaning:"Detective Chief Inspector",gender:"boy",breeds:["sniffer","poodle"]},
  {code:"PCSO",meaning:"Police Community Support Officer",gender:"any",breeds:["character","lapdog","terrier"]},
  {code:"Insp",meaning:"Inspector",gender:"boy",breeds:["sniffer","retriever"]},
  // ── ARMY RANKS ────────────────────────────────────────────────────────────────
  {code:"Pte",meaning:"Private",gender:"boy",breeds:["boxer","terrier","character"]},
  {code:"Cpl",meaning:"Corporal",gender:"boy",breeds:["boxer","retriever","german"]},
  {code:"Spr",meaning:"Sapper",gender:"boy",breeds:["terrier"]},
  {code:"Gnr",meaning:"Gunner",gender:"boy",breeds:["terrier","character","sniffer"]},
  {code:"Rfn",meaning:"Rifleman",gender:"boy",breeds:["sighthound","terrier"]},
  {code:"Gdsm",meaning:"Guardsman",gender:"boy",breeds:["gentry","spaniel","german"]},
  {code:"Tpr",meaning:"Trooper",gender:"boy",breeds:["sighthound","retriever"]},
  {code:"Brig",meaning:"Brigadier",gender:"boy",breeds:["spaniel","german","giant"]},
  // ── NAVY RANKS ────────────────────────────────────────────────────────────────
  {code:"Mid",meaning:"Midshipman",gender:"boy"},
  {code:"PO",meaning:"Petty Officer",gender:"boy",breeds:["spaniel","retriever"]},
  // ── RAF RANKS ─────────────────────────────────────────────────────────────────
  {code:"Sqn Ldr",meaning:"Squadron Leader",gender:"boy",breeds:["spaniel","retriever","collie"]},
  {code:"Wg Cdr",meaning:"Wing Commander",gender:"boy",breeds:["spaniel","german","giant"]},
  {code:"Flt Lt",meaning:"Flight Lieutenant",gender:"boy",breeds:["collie","poodle","retriever"]},
  {code:"Plt Off",meaning:"Pilot Officer",gender:"boy",breeds:["collie","poodle"]},
];

const DTRAIN_LETTERS  = ["A","B","C","D","E","G","J","K","L","M","R","S","T"];
const DTRAIN_SUFFIXES = ["Train","Prince","Money","King","Boss","Smooth","Real","Fresh","Young","Hype"];
const MARIEJ_FIRSTS  = ["Mary","Lisa","Rosa","Lola","Nina","Tina","Gina","Dina","Mona","Fiona","Cara","Sara","Nora","Cora","Vera","Zara","Kara","Lara","Myra","Lyra"];
const MARIEJ_INITIALS = "ABCDJKLMNRST".split("");

// ── RANDOM QUESTIONS ───────────────────────────────────────────────────────────
const QUESTIONS = [
  "Do you like space?",
  "Have you ever eaten a whole pizza alone?",
  "Do you consider yourself a morning person?",
  "Have you ever talked to a plant?",
  "Do you prefer baths or showers?",
  "Have you ever worn a onesie in public?",
];

// ── REGISTER TYPES ─────────────────────────────────────────────────────────────
type DogColour = "black"|"white"|"brown"|"red"|"golden"|"grey"|"blue"|"spotted"|"";

type Register = "grand"|"mundane"|"chaos"|"baby"|"absurd"|"nature"|"ironic"|"aloof"|"food"|"pop"|"informal";

interface NameEntry  { name: string; reg: Register; syllables: number; }
interface TitleEntry { title: string; reg: Register; syllables: number; }
interface WordEntry  { word: string; reg: Register; firstLetter: string; }

// ── CONTRAST MATRIX ────────────────────────────────────────────────────────────
const CONTRAST: Record<Register, Partial<Record<Register, number>>> = {
  grand:    { baby:5, mundane:5, chaos:4, ironic:4, absurd:3, informal:4, aloof:2, nature:2, food:3, pop:3, grand:1 },
  mundane:  { chaos:5, baby:4, absurd:4, grand:3, ironic:3, informal:3, nature:2, aloof:2, food:2, pop:2, mundane:1 },
  informal: { baby:5, chaos:4, absurd:4, grand:4, ironic:4, mundane:3, nature:2, aloof:2, food:3, pop:2, informal:1 },
  chaos:    { grand:4, mundane:3, baby:2, ironic:3, absurd:2, informal:2, nature:1, aloof:1, food:1, pop:1, chaos:1 },
  baby:     { grand:4, mundane:3, chaos:2, absurd:2, ironic:3, informal:2, nature:1, aloof:1, food:2, pop:1, baby:1 },
  absurd:   { grand:4, mundane:4, baby:3, chaos:3, ironic:3, informal:3, nature:2, aloof:3, food:2, pop:2, absurd:1 },
  aloof:    { grand:2, mundane:3, baby:2, chaos:2, absurd:3, informal:2, nature:2, ironic:2, food:1, pop:1, aloof:1 },
  ironic:   { grand:4, mundane:3, baby:3, chaos:3, absurd:3, informal:3, nature:2, aloof:2, food:2, pop:2, ironic:1 },
  nature:   { grand:3, mundane:2, baby:2, chaos:2, absurd:2, informal:2, ironic:2, aloof:2, food:1, pop:1, nature:1 },
  food:     { grand:3, mundane:2, baby:3, chaos:2, absurd:2, informal:2, ironic:2, aloof:1, nature:1, pop:1, food:1 },
  pop:      { grand:3, mundane:2, baby:2, chaos:2, absurd:2, informal:2, ironic:2, aloof:1, nature:1, food:1, pop:1 },
};

function contrastScore(a: Register, b: Register): number {
  return CONTRAST[a]?.[b] ?? 1;
}

const COLOUR_BONUS: Record<DogColour, string[]> = {
  black:   ["Shadow","Ghost","Phantom","Midnight","Eclipse","Raven","Onyx","Crow","Jet","Coal","Noir","Obsidian","Night","Ace","Blackjack","Panther","Cobra","Reaper","Dark"],
  white:   ["Frost","Crystal","Diamond","Pearl","Cloud","Blizzard","Ivory","Chalk","Silver","Dove","Luna","Casper","Snow","Ice","Frosty","Snowflake","Vanilla","Coconut","Cotton"],
  brown:   ["Cocoa","Mocha","Chestnut","Toffee","Walnut","Hazel","Treacle","Fudge","Brownie","Caramel","Biscuit","Russet","Copper","Bronze","Mahogany","Rusty","Grizzly","Chocolate","Truffle"],
  red:     ["Ruby","Amber","Copper","Russet","Flame","Blaze","Fox","Ember","Sienna","Scarlett","Rusty","Ginger","Auburn","Cinnamon","Maple","Crimson","Garnet","Jasper","Brick"],
  golden:  ["Goldie","Honey","Butter","Saffron","Sunny","Marigold","Primrose","Biscuit","Custard","Dandelion","Sandy","Gold","Sunshine","Buttercup","Caramel","Toffee","Harvest"],
  grey:    ["Silver","Sterling","Slate","Ash","Smoke","Misty","Dove","Steel","Pewter","Flint","Stone","Chrome","Mercury","Graphite","Smoky","Fog","Mist","Cloudy","Cinder"],
  blue:    ["Blue","Indigo","Cobalt","Slate","Steel","Denim","Azure","Ocean","Navy","Sapphire","Cerulean","Aqua","Teal","Marine","Storm","Rain","Ink"],
  spotted: ["Patch","Freckle","Dapple","Motley","Domino","Checkers","Harlequin","Marble","Patches","Dot","Speckle","Pip","Splash","Calico"],
  "":      [],
};

function colourScore(firstName: string, col: DogColour): number {
  if (!col) return 0;
  const matches = COLOUR_BONUS[col] || [];
  return matches.some(m => m.toLowerCase() === firstName.toLowerCase()) ? 3 : 0;
}

function countSyllables(word: string): number {
  return word.toLowerCase().replace(/[^aeiouy]+/g,"x").replace(/x+/g,"x").length || 1;
}

function scoreName(title: TitleEntry, first: NameEntry, dogWord: WordEntry, surname: string, colour: DogColour = ""): number {
  let score = 0;
  score += contrastScore(title.reg, first.reg);
  score += contrastScore(first.reg, dogWord.reg);
  const fl = first.name[0].toLowerCase();
  const wl = dogWord.word[0].toLowerCase();
  const sf: Record<string,string> = {b:"bp",p:"bp",d:"dt",t:"dt",g:"gk",k:"gk",f:"fv",v:"fv",s:"sz",z:"sz",m:"mn",n:"mn"};
  if (fl === wl) score += 3;
  else if (sf[fl] && sf[fl] === sf[wl]) score += 1;
  const total = title.syllables + first.syllables + 1 + countSyllables(surname);
  if (total >= 5 && total <= 9) score += 4;
  else if (total >= 3 && total <= 12) score += 2;
  if (first.syllables <= 2) score += 3;
  else if (first.syllables <= 3) score += 2;
  else if (first.syllables <= 4) score += 1;
  const tf = title.title.replace(/^(Lil'|Ol'|Wee|Baby|Little|Daft|Cheeky|Silly|Scruffy|Fluffy|Grumpy|Noisy)\s/,"")[0]?.toLowerCase();
  if (tf === fl) score += 2;
  if (fl === wl && tf === fl) score += 2;
  score += colourScore(first.name, colour as DogColour);
  return score;
}

// ── BREED LISTS ────────────────────────────────────────────────────────────────
const PACK_BREEDS = ["Afghan Hound","Basset Hound","Beagle","Bichon Frise","Bloodhound","Border Collie","Border Terrier","Boston Terrier","Boxer","Bull Terrier","Bulldog","Cavalier King Charles Spaniel","Cavachon","Cavapoo","Chihuahua","Cocker Spaniel","Cockapoo","Corgi","Dachshund","Dalmatian","Doberman Pinscher","French Bulldog","German Shepherd","Golden Retriever","Goldendoodle","Great Dane","Greyhound","Irish Setter","Irish Wolfhound","Italian Greyhound","Jack Russell Terrier","Jackapoo","Labrador","Labradoodle","Lurcher","Maltese","Maltipoo","Mastiff","Miniature Schnauzer","Old English Sheepdog","Papillon","Pomeranian","Poodle","Pug","Rottweiler","Rough Collie","Saint Bernard","Shih Tzu","Siberian Husky","Springer Spaniel","Staffordshire Bull Terrier","Weimaraner","West Highland Terrier","Whippet","Yorkshire Terrier"];
const OTHER_BREEDS = ["Airedale Terrier","Akita","Alaskan Malamute","Bedlington Terrier","Bernese Mountain Dog","Borzoi","Cairn Terrier","Chesapeake Bay Retriever","Chow Chow","Clumber Spaniel","Deerhound","English Setter","Field Spaniel","Flat-Coated Retriever","Fox Terrier","Gordon Setter","Havanese","Hungarian Vizsla","Leonberger","Lhasa Apso","Newfoundland","Norfolk Terrier","Pointer","Rhodesian Ridgeback","Saluki","Samoyed","Scottish Terrier","Shar Pei","Shiba Inu","Soft Coated Wheaten Terrier","Sussex Spaniel","Tibetan Mastiff","Welsh Springer Spaniel","Welsh Terrier"];

// ── TITLE BANKS ────────────────────────────────────────────────────────────────
const BOY_TITLES: Record<string, TitleEntry[]> = {
  // Terriers -- Mr is the joke, no grand title needed
  terrier:    [{title:"Mr",reg:"mundane",syllables:1}],
  // Spaniels -- working military and police dogs
  spaniel:    [{title:"Field Marshal",reg:"grand",syllables:3},{title:"General",reg:"grand",syllables:3},{title:"Admiral",reg:"grand",syllables:3},{title:"Brigadier",reg:"grand",syllables:3},{title:"Colonel",reg:"grand",syllables:2},{title:"Inspector",reg:"grand",syllables:3},{title:"Chief Inspector",reg:"grand",syllables:4}],
  // Retrievers / Labs -- guide dogs, detection dogs, civic service
  retriever:  [{title:"Commissioner",reg:"grand",syllables:4},{title:"Chief Inspector",reg:"grand",syllables:4},{title:"Inspector",reg:"grand",syllables:3},{title:"Judge",reg:"grand",syllables:1},{title:"Colonel",reg:"grand",syllables:2},{title:"Major",reg:"grand",syllables:2}],
  // German Shepherd / Doberman / Rottweiler / Weimaraner -- military working dogs
  german:     [{title:"Colonel",reg:"grand",syllables:2},{title:"Major",reg:"grand",syllables:2},{title:"Captain",reg:"grand",syllables:2},{title:"Sergeant Major",reg:"grand",syllables:4},{title:"General",reg:"grand",syllables:3}],
  // Collies -- intelligence not brawn
  collie:     [{title:"Professor",reg:"grand",syllables:3},{title:"Doctor",reg:"grand",syllables:2},{title:"Chief Analyst",reg:"grand",syllables:4},{title:"Commissioner",reg:"grand",syllables:4}],
  // Boxer / Staffie / Bull Terrier -- street respect, civic pomp
  boxer:      [{title:"Sergeant",reg:"grand",syllables:2},{title:"Sir",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Right Honourable",reg:"grand",syllables:4},{title:"Corporal",reg:"grand",syllables:3}],
  // Sniffer dogs -- detectives
  sniffer:    [{title:"Inspector",reg:"grand",syllables:3},{title:"Chief Inspector",reg:"grand",syllables:4},{title:"Commissioner",reg:"grand",syllables:4},{title:"Judge",reg:"grand",syllables:1},{title:"DCI",reg:"grand",syllables:3},{title:"DS",reg:"grand",syllables:2}],
  // Sighthounds -- pure aristocracy
  sighthound: [{title:"Duke",reg:"grand",syllables:1},{title:"Earl",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Sir",reg:"grand",syllables:1},{title:"Viscount",reg:"grand",syllables:2},{title:"Baron",reg:"grand",syllables:2}],
  // Giants -- scale demands grandeur
  giant:      [{title:"Magnificent",reg:"grand",syllables:4},{title:"Formidable",reg:"grand",syllables:4},{title:"Legendary",reg:"grand",syllables:4},{title:"Great",reg:"grand",syllables:1},{title:"Duke",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1}],
  // Poodle -- academic only
  poodle:     [{title:"Professor",reg:"grand",syllables:3},{title:"Doctor",reg:"grand",syllables:2},{title:"Chief Analyst",reg:"grand",syllables:4}],
  // Lapdog -- ecclesiastical pomp
  lapdog:     [{title:"Reverend",reg:"grand",syllables:3},{title:"Bishop",reg:"grand",syllables:2},{title:"Archdeacon",reg:"grand",syllables:3},{title:"Sir",reg:"grand",syllables:1}],
  // Bulldog specifically -- Churchill energy
  bulldog:    [{title:"Sir",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Right Honourable",reg:"grand",syllables:4},{title:"Field Marshal",reg:"grand",syllables:3}],
  // Character breeds -- self-appointed grandeur
  character:  [{title:"Notorious",reg:"grand",syllables:4},{title:"Incomparable",reg:"grand",syllables:5},{title:"Inimitable",reg:"grand",syllables:5},{title:"Illustrious",reg:"grand",syllables:4},{title:"Baron",reg:"grand",syllables:2}],
  // Gentry -- Dalmatian, OES etc
  gentry:     [{title:"Viscount",reg:"grand",syllables:2},{title:"Baron",reg:"grand",syllables:2},{title:"Right Honourable",reg:"grand",syllables:4},{title:"Lord",reg:"grand",syllables:1},{title:"Sir",reg:"grand",syllables:1}],
  // Dachshund -- absurdly self-important
  dachshund:  [{title:"Notorious",reg:"grand",syllables:4},{title:"Incomparable",reg:"grand",syllables:5},{title:"Field Marshal",reg:"grand",syllables:3},{title:"General",reg:"grand",syllables:3}],
  default:    [{title:"Sir",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Inspector",reg:"grand",syllables:3},{title:"Baron",reg:"grand",syllables:2}],
};

const GIRL_TITLES: Record<string, TitleEntry[]> = {
  terrier:    [{title:"Miss",reg:"mundane",syllables:1}],
  spaniel:    [{title:"Dame",reg:"grand",syllables:1},{title:"Lady",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Duchess",reg:"grand",syllables:2},{title:"Viscountess",reg:"grand",syllables:3},{title:"Marchioness",reg:"grand",syllables:3}],
  retriever:  [{title:"Dame",reg:"grand",syllables:1},{title:"Lady",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Viscountess",reg:"grand",syllables:3},{title:"Baroness",reg:"grand",syllables:3}],
  german:     [{title:"Countess",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Baroness",reg:"grand",syllables:3},{title:"Lady",reg:"grand",syllables:2}],
  collie:     [{title:"Professor",reg:"grand",syllables:3},{title:"Doctor",reg:"grand",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1}],
  boxer:      [{title:"Dame",reg:"grand",syllables:1},{title:"Lady",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Right Honourable",reg:"grand",syllables:4}],
  sniffer:    [{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Countess",reg:"grand",syllables:2},{title:"Doctor",reg:"grand",syllables:2},{title:"Inspector",reg:"grand",syllables:3},{title:"Detective",reg:"grand",syllables:3},{title:"Duchess",reg:"grand",syllables:2},{title:"Baroness",reg:"grand",syllables:3},{title:"Sergeant",reg:"grand",syllables:2},{title:"Chief Inspector",reg:"grand",syllables:4}],
  sighthound: [{title:"Duchess",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Viscountess",reg:"grand",syllables:3},{title:"Baroness",reg:"grand",syllables:3},{title:"Marchioness",reg:"grand",syllables:3}],
  giant:      [{title:"Magnificent",reg:"grand",syllables:4},{title:"Formidable",reg:"grand",syllables:4},{title:"Legendary",reg:"grand",syllables:4},{title:"Great",reg:"grand",syllables:1},{title:"Duchess",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1}],
  poodle:     [{title:"Professor",reg:"grand",syllables:3},{title:"Doctor",reg:"grand",syllables:2}],
  lapdog:     [{title:"Lil'",reg:"informal",syllables:1},{title:"Ol'",reg:"informal",syllables:1},{title:"Baby",reg:"informal",syllables:2},{title:"Little",reg:"informal",syllables:2},{title:"Daft",reg:"informal",syllables:1},{title:"Cheeky",reg:"informal",syllables:2},{title:"Silly",reg:"informal",syllables:2},{title:"Scruffy",reg:"informal",syllables:2},{title:"Fluffy",reg:"informal",syllables:2},{title:"Grumpy",reg:"informal",syllables:2},{title:"Squishy",reg:"informal",syllables:2},{title:"Itsy",reg:"informal",syllables:2},{title:"Teeny",reg:"informal",syllables:2}],
  bulldog:    [{title:"Dame",reg:"grand",syllables:1},{title:"Lady",reg:"grand",syllables:2},{title:"Right Honourable",reg:"grand",syllables:4}],
  character:  [{title:"Notorious",reg:"grand",syllables:4},{title:"Incomparable",reg:"grand",syllables:5},{title:"Inimitable",reg:"grand",syllables:5},{title:"Illustrious",reg:"grand",syllables:4},{title:"Baroness",reg:"grand",syllables:3},{title:"Countess",reg:"grand",syllables:2}],
  dachshund:  [{title:"Notorious",reg:"grand",syllables:4},{title:"Incomparable",reg:"grand",syllables:5},{title:"Illustrious",reg:"grand",syllables:4},{title:"Countess",reg:"grand",syllables:2}],
  gentry:     [{title:"Viscountess",reg:"grand",syllables:3},{title:"Baroness",reg:"grand",syllables:3},{title:"Most Honourable",reg:"grand",syllables:4},{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Marchioness",reg:"grand",syllables:3}],
  default:    [{title:"Lady",reg:"grand",syllables:2},{title:"Baroness",reg:"grand",syllables:3},{title:"Countess",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Viscountess",reg:"grand",syllables:3}],
};

// ── NAME BANKS (abbreviated for space -- key groups) ───────────────────────────
const NAMES: Record<string, { boy: NameEntry[]; girl: NameEntry[] }> = {
  lapdog: {
    boy: [{name:"Marvellous",reg:"absurd",syllables:3},{name:"Glorious",reg:"absurd",syllables:3},{name:"Opulent",reg:"grand",syllables:3},{name:"Majestic",reg:"grand",syllables:3},{name:"Fortunatus",reg:"grand",syllables:4},{name:"Benedictus",reg:"grand",syllables:4},{name:"Casimir",reg:"grand",syllables:3},{name:"Florentine",reg:"grand",syllables:3},{name:"Celestin",reg:"grand",syllables:3},{name:"Alexander",reg:"grand",syllables:4},{name:"Vincent",reg:"grand",syllables:2},{name:"Henry",reg:"grand",syllables:2},{name:"Sebastian",reg:"grand",syllables:4},{name:"Theodore",reg:"grand",syllables:3},{name:"Edward",reg:"grand",syllables:2},{name:"Charles",reg:"grand",syllables:1},{name:"Gabriel",reg:"grand",syllables:3},{name:"Oliver",reg:"mundane",syllables:3},{name:"William",reg:"mundane",syllables:2},{name:"Frederick",reg:"grand",syllables:3},{name:"Maximillian",reg:"grand",syllables:5},{name:"Samuel",reg:"mundane",syllables:3},{name:"Neal",reg:"mundane",syllables:1},{name:"Boffin",reg:"baby",syllables:2},{name:"Grommet",reg:"baby",syllables:2},{name:"Widget",reg:"baby",syllables:2},{name:"Wotsit",reg:"baby",syllables:2},{name:"Thingy",reg:"baby",syllables:2},{name:"Gubbins",reg:"baby",syllables:2},{name:"Puckle",reg:"baby",syllables:2},{name:"Muddle",reg:"baby",syllables:2},{name:"Sprocket",reg:"baby",syllables:2},{name:"Binky",reg:"baby",syllables:2},{name:"Booper",reg:"baby",syllables:2},{name:"Button",reg:"baby",syllables:2},{name:"Pip",reg:"baby",syllables:2},{name:"Titch",reg:"baby",syllables:2},{name:"Squirt",reg:"baby",syllables:2},{name:"Tuppence",reg:"baby",syllables:2},{name:"Munchkin",reg:"baby",syllables:2},{name:"Roly",reg:"baby",syllables:2},{name:"Gizmo",reg:"baby",syllables:2},{name:"Doodle",reg:"baby",syllables:2},{name:"Goober",reg:"baby",syllables:2},{name:"Nugget",reg:"baby",syllables:2},{name:"Peanut",reg:"baby",syllables:2}],
    girl: [{name:"Fabulous",reg:"absurd",syllables:3},{name:"Darling",reg:"baby",syllables:2},{name:"Precious",reg:"baby",syllables:2},{name:"Divine",reg:"grand",syllables:2},{name:"Dazzling",reg:"absurd",syllables:2},{name:"Ruby",reg:"grand",syllables:2},{name:"Diamond",reg:"grand",syllables:2},{name:"Pearl",reg:"grand",syllables:1},{name:"Sapphire",reg:"grand",syllables:2},{name:"Crystal",reg:"grand",syllables:2},{name:"Chanel",reg:"grand",syllables:2},{name:"Celestine",reg:"grand",syllables:3},{name:"Aurora",reg:"grand",syllables:3},{name:"Daphne",reg:"grand",syllables:2},{name:"Diana",reg:"grand",syllables:3},{name:"Flora",reg:"nature",syllables:2},{name:"Freya",reg:"grand",syllables:2},{name:"Iris",reg:"nature",syllables:2},{name:"Luna",reg:"grand",syllables:2},{name:"Maeve",reg:"grand",syllables:1},{name:"Ophelia",reg:"grand",syllables:4},{name:"Pandora",reg:"grand",syllables:3},{name:"Venus",reg:"grand",syllables:2},{name:"Violette",reg:"grand",syllables:3},{name:"Juliet",reg:"grand",syllables:3},{name:"Isabella",reg:"grand",syllables:4},{name:"Charlotte",reg:"grand",syllables:2},{name:"Olivia",reg:"mundane",syllables:4},{name:"Victoria",reg:"grand",syllables:4},{name:"Elizabeth",reg:"grand",syllables:4},{name:"Booboo",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Coco",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Cuddlekins",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},{name:"Fluffybum",reg:"baby",syllables:3},{name:"Puddingkins",reg:"baby",syllables:3}],
  },
  boxer: {
    boy: [{name:"Doofus",reg:"chaos",syllables:2},{name:"Galumph",reg:"chaos",syllables:2},{name:"Lummox",reg:"chaos",syllables:2},{name:"Bonkers",reg:"chaos",syllables:2},{name:"Dingbat",reg:"chaos",syllables:2},{name:"Rumpus",reg:"chaos",syllables:2},{name:"Kerfuffle",reg:"chaos",syllables:3},{name:"Hullabaloo",reg:"chaos",syllables:4},{name:"Nincompoop",reg:"chaos",syllables:3},{name:"Goofball",reg:"chaos",syllables:2},{name:"Chuckles",reg:"chaos",syllables:2},{name:"Bozo",reg:"chaos",syllables:2},{name:"Pickles",reg:"baby",syllables:2},{name:"Noodles",reg:"baby",syllables:2},{name:"Chipmunk",reg:"baby",syllables:2},{name:"Kazoo",reg:"absurd",syllables:2},{name:"Joker",reg:"chaos",syllables:2},{name:"Pancake",reg:"food",syllables:2},{name:"Zebedee",reg:"absurd",syllables:3},{name:"Chaos",reg:"chaos",syllables:2},{name:"Havoc",reg:"chaos",syllables:2},{name:"Ruckus",reg:"chaos",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Noo-Noo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},{name:"Bumbles",reg:"chaos",syllables:2},{name:"Bumper",reg:"chaos",syllables:2},{name:"Bumpkin",reg:"chaos",syllables:2},{name:"Stomper",reg:"chaos",syllables:2},{name:"Clomper",reg:"chaos",syllables:2},{name:"Trooper",reg:"chaos",syllables:2},{name:"Rowdy",reg:"chaos",syllables:2},{name:"Bruiser",reg:"chaos",syllables:2},{name:"Bandit",reg:"chaos",syllables:2},{name:"Dodger",reg:"chaos",syllables:2},{name:"Bonzo",reg:"chaos",syllables:2},{name:"Buster",reg:"chaos",syllables:2},{name:"Bruno",reg:"chaos",syllables:2},{name:"Butch",reg:"chaos",syllables:2},{name:"Spike",reg:"chaos",syllables:2},{name:"Bowser",reg:"chaos",syllables:2},{name:"Lobster",reg:"chaos",syllables:2},{name:"Chunk",reg:"chaos",syllables:2},{name:"Tubby",reg:"chaos",syllables:2},{name:"Pudgy",reg:"chaos",syllables:2},{name:"Wagger",reg:"chaos",syllables:2},{name:"Wags",reg:"chaos",syllables:2},{name:"Wiggles",reg:"chaos",syllables:2}],
    girl: [{name:"Dizzy",reg:"chaos",syllables:2},{name:"Topsy",reg:"chaos",syllables:2},{name:"Bonkers",reg:"chaos",syllables:2},{name:"Wibble",reg:"chaos",syllables:2},{name:"Doolally",reg:"chaos",syllables:3},{name:"Ramshackle",reg:"chaos",syllables:3},{name:"Twinkles",reg:"baby",syllables:2},{name:"Cornflake",reg:"food",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Tutu",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Cuddlekins",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},{name:"Babbycakes",reg:"baby",syllables:3},{name:"Tiddlywink",reg:"baby",syllables:3},{name:"Fluffybum",reg:"baby",syllables:3},{name:"Jellybean",reg:"food",syllables:3},{name:"Candyfloss",reg:"food",syllables:3},{name:"Cupcake",reg:"food",syllables:2}],
  },
  sighthound: {
    boy: [{name:"Nonchalance",reg:"aloof",syllables:3},{name:"Indifference",reg:"aloof",syllables:4},{name:"Lassitude",reg:"aloof",syllables:3},{name:"Apathy",reg:"aloof",syllables:3},{name:"Sangfroid",reg:"aloof",syllables:2},{name:"Miles",reg:"mundane",syllables:1},{name:"Julian",reg:"grand",syllables:3},{name:"Lawrence",reg:"grand",syllables:2},{name:"Richard",reg:"grand",syllables:2},{name:"Quentin",reg:"grand",syllables:2},{name:"Sebastian",reg:"grand",syllables:4},{name:"Vincent",reg:"grand",syllables:2},{name:"Leopold",reg:"grand",syllables:3},{name:"Edgar",reg:"grand",syllables:2}],
    girl: [{name:"Ennui",reg:"aloof",syllables:2},{name:"Langueur",reg:"aloof",syllables:2},{name:"Nonchalance",reg:"aloof",syllables:3},{name:"Aloofia",reg:"aloof",syllables:4},{name:"Glaciale",reg:"aloof",syllables:3},{name:"Reservée",reg:"aloof",syllables:3},{name:"Austère",reg:"aloof",syllables:2},{name:"Samantha",reg:"mundane",syllables:3},{name:"Bethany",reg:"mundane",syllables:3},{name:"Amanda",reg:"mundane",syllables:3},{name:"Megan",reg:"mundane",syllables:2},{name:"Hannah",reg:"mundane",syllables:2},{name:"Melissa",reg:"mundane",syllables:3},{name:"Nicole",reg:"mundane",syllables:2},{name:"Rachel",reg:"mundane",syllables:2},{name:"Betty",reg:"mundane",syllables:2},{name:"Amy",reg:"mundane",syllables:2},{name:"Emily",reg:"mundane",syllables:3},{name:"Jennifer",reg:"mundane",syllables:3},{name:"Sarah",reg:"mundane",syllables:2},{name:"Lucy",reg:"mundane",syllables:2},{name:"Bailey",reg:"mundane",syllables:2},{name:"Heather",reg:"nature",syllables:2},{name:"Jasmine",reg:"nature",syllables:2}],
  },
  sniffer: {
    boy: [{name:"Plodsworth",reg:"absurd",syllables:2},{name:"Glumley",reg:"absurd",syllables:2},{name:"Mourny",reg:"absurd",syllables:2},{name:"Woebegone",reg:"absurd",syllables:3},{name:"Lachrymose",reg:"absurd",syllables:3},{name:"Melancholy",reg:"absurd",syllables:4},{name:"Lugubrious",reg:"absurd",syllables:4},{name:"Gloopington",reg:"absurd",syllables:3},{name:"John",reg:"mundane",syllables:1},{name:"Brian",reg:"mundane",syllables:2},{name:"Raymond",reg:"mundane",syllables:2},{name:"George",reg:"mundane",syllables:1},{name:"Arthur",reg:"mundane",syllables:2},{name:"David",reg:"mundane",syllables:2},{name:"Keith",reg:"mundane",syllables:1},{name:"Derek",reg:"mundane",syllables:2},{name:"Kevin",reg:"mundane",syllables:2},{name:"Trevor",reg:"mundane",syllables:2},{name:"Barry",reg:"mundane",syllables:2},{name:"Norman",reg:"mundane",syllables:2},{name:"Basil",reg:"mundane",syllables:2}],
    girl: [{name:"Woesworth",reg:"absurd",syllables:2},{name:"Lamentia",reg:"absurd",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:2},{name:"Lollypop",reg:"food",syllables:2},{name:"Gobstopper",reg:"food",syllables:2},{name:"Toffee",reg:"food",syllables:2},{name:"Sherbet",reg:"food",syllables:2},{name:"Humbug",reg:"food",syllables:2},{name:"Agatha",reg:"grand",syllables:2},{name:"Marple",reg:"grand",syllables:2},{name:"Christie",reg:"grand",syllables:2},{name:"Vera",reg:"grand",syllables:2},{name:"Tennison",reg:"grand",syllables:2},{name:"Foyle",reg:"grand",syllables:2},{name:"Cordelia",reg:"grand",syllables:2},{name:"Harriet",reg:"grand",syllables:2},{name:"Endeavour",reg:"grand",syllables:2},{name:"Gamache",reg:"grand",syllables:2},{name:"Cadfael",reg:"grand",syllables:2},{name:"Alleyn",reg:"grand",syllables:2},{name:"Billie",reg:"mundane",syllables:2},{name:"Bessie",reg:"mundane",syllables:2},{name:"Etta",reg:"mundane",syllables:2},{name:"Ella",reg:"mundane",syllables:2},{name:"Nina",reg:"mundane",syllables:2},{name:"Sarah",reg:"mundane",syllables:2},{name:"Dinah",reg:"mundane",syllables:2},{name:"Alberta",reg:"mundane",syllables:2},{name:"Memphis",reg:"mundane",syllables:2},{name:"Sippie",reg:"mundane",syllables:2},{name:"Gertrude",reg:"mundane",syllables:2},{name:"Theodora",reg:"grand",syllables:2},{name:"Araminta",reg:"grand",syllables:2},{name:"Lavinia",reg:"grand",syllables:2},{name:"Wilhelmina",reg:"grand",syllables:2},{name:"Clementine",reg:"grand",syllables:2},{name:"Octavia",reg:"grand",syllables:2},{name:"Millicent",reg:"grand",syllables:2},{name:"Dorothea",reg:"grand",syllables:2},{name:"Eugenia",reg:"grand",syllables:2},{name:"Henrietta",reg:"grand",syllables:2},{name:"Mathilda",reg:"grand",syllables:2},{name:"Rosalind",reg:"grand",syllables:2},{name:"Gwendolyn",reg:"grand",syllables:2},{name:"Arabella",reg:"grand",syllables:2},{name:"Beatrice",reg:"grand",syllables:2},{name:"Constance",reg:"grand",syllables:2},{name:"Prudence",reg:"mundane",syllables:2},{name:"Patience",reg:"mundane",syllables:2},{name:"Temperance",reg:"mundane",syllables:2},{name:"Tallulah",reg:"grand",syllables:2},{name:"Thomasina",reg:"grand",syllables:2},{name:"Thea",reg:"mundane",syllables:2},{name:"Tilda",reg:"mundane",syllables:2},{name:"Tabitha",reg:"mundane",syllables:2},{name:"Geraldine",reg:"mundane",syllables:2},{name:"Griselda",reg:"grand",syllables:2},{name:"Felicity",reg:"mundane",syllables:2},{name:"Florence",reg:"mundane",syllables:2},{name:"Helena",reg:"grand",syllables:2},{name:"Hortense",reg:"grand",syllables:2},{name:"Penelope",reg:"grand",syllables:2},{name:"Portia",reg:"grand",syllables:2},{name:"Beatrix",reg:"grand",syllables:2},{name:"Blanche",reg:"grand",syllables:2},{name:"Dorothy",reg:"mundane",syllables:2},{name:"Delilah",reg:"mundane",syllables:2},{name:"Winifred",reg:"mundane",syllables:2},{name:"Wanda",reg:"mundane",syllables:2},{name:"Clarissa",reg:"grand",syllables:2},{name:"Cressida",reg:"grand",syllables:2},{name:"Rosemary",reg:"mundane",syllables:2},{name:"Rowena",reg:"grand",syllables:2},{name:"Lavender",reg:"mundane",syllables:2},{name:"Leonora",reg:"grand",syllables:2},{name:"Mabel",reg:"mundane",syllables:2},{name:"Marjorie",reg:"mundane",syllables:2},{name:"Muriel",reg:"mundane",syllables:2},{name:"Margot",reg:"mundane",syllables:2},{name:"Edwina",reg:"mundane",syllables:2},{name:"Eleanor",reg:"grand",syllables:2},{name:"Sylvia",reg:"mundane",syllables:2},{name:"Simone",reg:"grand",syllables:2},{name:"Natasha",reg:"mundane",syllables:2},{name:"Nicolette",reg:"grand",syllables:2},{name:"Norma",reg:"mundane",syllables:2},{name:"Adelaide",reg:"grand",syllables:2},{name:"Allegra",reg:"grand",syllables:2}],
  },
  giant: {
    boy: [{name:"Teacup",reg:"ironic",syllables:2},{name:"Dainty",reg:"ironic",syllables:2},{name:"Nimble",reg:"ironic",syllables:2},{name:"Tinykins",reg:"ironic",syllables:3},{name:"Teeny",reg:"ironic",syllables:2},{name:"Petite",reg:"ironic",syllables:2},{name:"Gossamer",reg:"ironic",syllables:3},{name:"Smidgeon",reg:"ironic",syllables:2},{name:"Titchy",reg:"ironic",syllables:2},{name:"Dinky",reg:"ironic",syllables:2},{name:"Lilliput",reg:"ironic",syllables:3},{name:"Pocket",reg:"ironic",syllables:2},{name:"Otto",reg:"mundane",syllables:2},{name:"Otis",reg:"mundane",syllables:2},{name:"Remy",reg:"mundane",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Stomper",reg:"chaos",syllables:2},{name:"Clomper",reg:"chaos",syllables:2},{name:"Trooper",reg:"chaos",syllables:2},{name:"Trundles",reg:"chaos",syllables:2},{name:"Lolloper",reg:"chaos",syllables:2},{name:"Shambler",reg:"chaos",syllables:2},{name:"Rumble",reg:"chaos",syllables:2},{name:"Chunk",reg:"chaos",syllables:2},{name:"Tubby",reg:"chaos",syllables:2},{name:"Waddler",reg:"chaos",syllables:2},{name:"Waddles",reg:"chaos",syllables:2},{name:"Thunderpaws",reg:"chaos",syllables:2},{name:"Bumpkin",reg:"chaos",syllables:2},{name:"Goliath",reg:"chaos",syllables:2},{name:"Bruiser",reg:"chaos",syllables:2},{name:"Bowser",reg:"chaos",syllables:2},{name:"Bonzo",reg:"chaos",syllables:2}],
    girl: [{name:"Titchy",reg:"ironic",syllables:2},{name:"WeeDee",reg:"ironic",syllables:2},{name:"Petite",reg:"ironic",syllables:2},{name:"Dinky",reg:"ironic",syllables:2},{name:"Lilliput",reg:"ironic",syllables:3},{name:"Daintybell",reg:"ironic",syllables:3},{name:"Thistledown",reg:"ironic",syllables:3},{name:"Gossamera",reg:"ironic",syllables:3},{name:"Pixie",reg:"ironic",syllables:2},{name:"Twiggy",reg:"ironic",syllables:2},{name:"Speck",reg:"ironic",syllables:1},{name:"Smidge",reg:"ironic",syllables:1},{name:"Milly",reg:"mundane",syllables:2},{name:"Molly",reg:"mundane",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Tiddlywink",reg:"baby",syllables:3}],
  },
  terrier: {
    boy: [{name:"Chaos",reg:"chaos",syllables:2},{name:"Havoc",reg:"chaos",syllables:2},{name:"Mayhem",reg:"chaos",syllables:2},{name:"Bedlam",reg:"chaos",syllables:2},{name:"Ruckus",reg:"chaos",syllables:2},{name:"Pandemonium",reg:"chaos",syllables:5},{name:"Anarchy",reg:"chaos",syllables:3},{name:"Turmoil",reg:"chaos",syllables:2},{name:"Brouhaha",reg:"chaos",syllables:3},{name:"Kerfuffle",reg:"chaos",syllables:3},{name:"Uproar",reg:"chaos",syllables:2},{name:"Fracas",reg:"chaos",syllables:2},{name:"Commotion",reg:"chaos",syllables:3},{name:"Hullabaloo",reg:"chaos",syllables:4},{name:"Clamour",reg:"chaos",syllables:2},{name:"Rampage",reg:"chaos",syllables:2},{name:"Maelstrom",reg:"chaos",syllables:2},{name:"Melee",reg:"chaos",syllables:2},{name:"Scrumpy",reg:"chaos",syllables:2},{name:"Scamp",reg:"chaos",syllables:2},{name:"Nipper",reg:"chaos",syllables:2},{name:"Scrapper",reg:"chaos",syllables:2},{name:"Ripper",reg:"chaos",syllables:2},{name:"Skitter",reg:"chaos",syllables:2},{name:"Fidget",reg:"chaos",syllables:2},{name:"Rascal",reg:"chaos",syllables:2},{name:"Mischief",reg:"chaos",syllables:2},{name:"Trouble",reg:"chaos",syllables:2},{name:"Rowdy",reg:"chaos",syllables:2},{name:"Digger",reg:"chaos",syllables:2},{name:"Snapper",reg:"chaos",syllables:2},{name:"Scratchy",reg:"chaos",syllables:2},{name:"Scuttle",reg:"chaos",syllables:2},{name:"Sprocket",reg:"chaos",syllables:2},{name:"Spanner",reg:"chaos",syllables:2},{name:"Scamper",reg:"chaos",syllables:2},{name:"Snook",reg:"chaos",syllables:2},{name:"Bouncer",reg:"chaos",syllables:2}],
    girl: [{name:"Frenzina",reg:"chaos",syllables:3},{name:"Rampeena",reg:"chaos",syllables:3},{name:"Pandemonia",reg:"chaos",syllables:4},{name:"Anarchia",reg:"chaos",syllables:4},{name:"Mischief",reg:"chaos",syllables:2},{name:"Turbulence",reg:"chaos",syllables:3},{name:"Whirlwind",reg:"chaos",syllables:2},{name:"Tempest",reg:"chaos",syllables:2},{name:"Gale",reg:"chaos",syllables:1},{name:"Tempesta",reg:"chaos",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Tutu",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Tiddlywink",reg:"baby",syllables:3},{name:"Scrumpy",reg:"chaos",syllables:2},{name:"Scamp",reg:"chaos",syllables:2},{name:"Nipper",reg:"chaos",syllables:2},{name:"Skittles",reg:"chaos",syllables:2},{name:"Fidget",reg:"chaos",syllables:2},{name:"Ruffles",reg:"chaos",syllables:2},{name:"Tangles",reg:"chaos",syllables:2},{name:"Tufty",reg:"chaos",syllables:2},{name:"Pipsqueak",reg:"chaos",syllables:2},{name:"Titch",reg:"chaos",syllables:2},{name:"Snippy",reg:"chaos",syllables:2},{name:"Squirt",reg:"chaos",syllables:2},{name:"Scraggy",reg:"chaos",syllables:2},{name:"Wriggles",reg:"chaos",syllables:2}],
  },
  retriever: {
    boy: [{name:"Biscuit",reg:"food",syllables:2},{name:"Pudding",reg:"food",syllables:2},{name:"Custard",reg:"food",syllables:2},{name:"Gravy",reg:"food",syllables:2},{name:"Crumble",reg:"food",syllables:2},{name:"Dumpling",reg:"food",syllables:2},{name:"Jelly",reg:"food",syllables:2},{name:"Sausage",reg:"food",syllables:2},{name:"Treacle",reg:"food",syllables:2},{name:"Syllabub",reg:"food",syllables:3},{name:"Douglas",reg:"mundane",syllables:2},{name:"Barnaby",reg:"grand",syllables:3},{name:"Edmund",reg:"grand",syllables:2},{name:"Herbert",reg:"mundane",syllables:2},{name:"Clarence",reg:"grand",syllables:2},{name:"Frederick",reg:"grand",syllables:3},{name:"Norman",reg:"mundane",syllables:2},{name:"Stanley",reg:"mundane",syllables:2},{name:"Reginald",reg:"grand",syllables:3},{name:"Humphrey",reg:"grand",syllables:2},{name:"Archibald",reg:"grand",syllables:3},{name:"William",reg:"mundane",syllables:2},{name:"Oliver",reg:"mundane",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Scampi",reg:"food",syllables:2},{name:"Nugget",reg:"food",syllables:2},{name:"Popcorn",reg:"food",syllables:2},{name:"Beans",reg:"food",syllables:2},{name:"Sizzle",reg:"food",syllables:2},{name:"Banger",reg:"food",syllables:2},{name:"Crumbs",reg:"food",syllables:2},{name:"Meatball",reg:"food",syllables:2},{name:"Chip",reg:"food",syllables:2},{name:"Chops",reg:"food",syllables:2},{name:"Scraps",reg:"food",syllables:2},{name:"Cookie",reg:"food",syllables:2},{name:"Cracker",reg:"food",syllables:2},{name:"Sprat",reg:"food",syllables:2},{name:"Kipper",reg:"food",syllables:2},{name:"Truffles",reg:"food",syllables:2},{name:"Minnow",reg:"food",syllables:2},{name:"Goose",reg:"chaos",syllables:2},{name:"Fetcher",reg:"chaos",syllables:2},{name:"Wagger",reg:"chaos",syllables:2},{name:"Wags",reg:"chaos",syllables:2},{name:"Lolloper",reg:"chaos",syllables:2},{name:"Slobber",reg:"chaos",syllables:2},{name:"Chomper",reg:"chaos",syllables:2},{name:"Gobbler",reg:"chaos",syllables:2},{name:"Muncher",reg:"chaos",syllables:2},{name:"Barnacle",reg:"chaos",syllables:2}],
    girl: [{name:"Treacle",reg:"food",syllables:2},{name:"Trifle",reg:"food",syllables:2},{name:"Muffin",reg:"food",syllables:2},{name:"Pudding",reg:"food",syllables:2},{name:"Eclair",reg:"food",syllables:2},{name:"Crumpet",reg:"food",syllables:2},{name:"Waffle",reg:"food",syllables:2},{name:"Biscuit",reg:"food",syllables:2},{name:"Brownie",reg:"food",syllables:2},{name:"Pavlova",reg:"food",syllables:3},{name:"Charlotte",reg:"mundane",syllables:2},{name:"Margaret",reg:"mundane",syllables:3},{name:"Dorothy",reg:"mundane",syllables:3},{name:"Edith",reg:"mundane",syllables:2},{name:"Florence",reg:"mundane",syllables:2},{name:"Beatrice",reg:"grand",syllables:3},{name:"Constance",reg:"mundane",syllables:2},{name:"Millicent",reg:"grand",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Jellybean",reg:"food",syllables:3},{name:"Candyfloss",reg:"food",syllables:3},{name:"Cupcake",reg:"food",syllables:2},{name:"Truffle",reg:"food",syllables:2},{name:"Nugget",reg:"food",syllables:2},{name:"Popcorn",reg:"food",syllables:2},{name:"Beanbag",reg:"food",syllables:2},{name:"Nibbins",reg:"food",syllables:2},{name:"Cookie",reg:"food",syllables:2},{name:"Cracker",reg:"food",syllables:2},{name:"Kipper",reg:"food",syllables:2},{name:"Sardine",reg:"food",syllables:2},{name:"Prawn",reg:"food",syllables:2},{name:"Pickles",reg:"food",syllables:2},{name:"Pippin",reg:"food",syllables:2},{name:"Pip",reg:"food",syllables:2},{name:"Pipsqueak",reg:"food",syllables:2},{name:"Sprout",reg:"food",syllables:2},{name:"Goose",reg:"food",syllables:2},{name:"Smudge",reg:"food",syllables:2},{name:"Splodge",reg:"food",syllables:2}],
  },
  collie: {
    boy: [{name:"Frenetic",reg:"chaos",syllables:3},{name:"Relentless",reg:"absurd",syllables:3},{name:"Obsessive",reg:"absurd",syllables:3},{name:"Ceaseless",reg:"absurd",syllables:2},{name:"Tenacious",reg:"absurd",syllables:4},{name:"Tireless",reg:"absurd",syllables:2},{name:"Resolute",reg:"grand",syllables:3},{name:"Duncan",reg:"mundane",syllables:2},{name:"Angus",reg:"mundane",syllables:2},{name:"Hamish",reg:"mundane",syllables:2},{name:"Rory",reg:"mundane",syllables:2},{name:"Fergus",reg:"mundane",syllables:2},{name:"Malcolm",reg:"mundane",syllables:2},{name:"Sprocket",reg:"chaos",syllables:2},{name:"Spanner",reg:"chaos",syllables:2},{name:"Fidget",reg:"chaos",syllables:2},{name:"Zippy",reg:"chaos",syllables:2},{name:"Zoomer",reg:"chaos",syllables:2},{name:"Whizz",reg:"chaos",syllables:2},{name:"Rocket",reg:"chaos",syllables:2},{name:"Dasher",reg:"chaos",syllables:2},{name:"Scout",reg:"chaos",syllables:2},{name:"Tracker",reg:"chaos",syllables:2},{name:"Chaser",reg:"chaos",syllables:2},{name:"Boffin",reg:"chaos",syllables:2},{name:"Skitter",reg:"chaos",syllables:2},{name:"Badger",reg:"mundane",syllables:2}],
    girl: [{name:"Frenzied",reg:"chaos",syllables:2},{name:"Incessant",reg:"absurd",syllables:3},{name:"Ceaseless",reg:"absurd",syllables:2},{name:"Tireless",reg:"absurd",syllables:2},{name:"Restless",reg:"absurd",syllables:2},{name:"Anxious",reg:"absurd",syllables:2},{name:"Manic",reg:"chaos",syllables:2},{name:"Frantic",reg:"chaos",syllables:2},{name:"Fiona",reg:"mundane",syllables:3},{name:"Morag",reg:"mundane",syllables:2},{name:"Isla",reg:"mundane",syllables:2},{name:"Kirsty",reg:"mundane",syllables:2},{name:"Flora",reg:"nature",syllables:2},{name:"Heather",reg:"nature",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3}],
  },
  poodle: {
    boy: [{name:"Existentiale",reg:"absurd",syllables:5},{name:"Paradoxe",reg:"absurd",syllables:3},{name:"Dialectique",reg:"absurd",syllables:4},{name:"Ontologie",reg:"absurd",syllables:4},{name:"Hermeneutique",reg:"absurd",syllables:5},{name:"Syllogisme",reg:"absurd",syllables:4},{name:"Pierre",reg:"grand",syllables:1},{name:"Jacques",reg:"grand",syllables:1},{name:"François",reg:"grand",syllables:2},{name:"Henri",reg:"grand",syllables:2},{name:"Marcel",reg:"grand",syllables:2},{name:"Gaston",reg:"grand",syllables:2},{name:"Galileo",reg:"grand",syllables:4},{name:"Einstein",reg:"grand",syllables:2},{name:"Socrates",reg:"grand",syllables:3},{name:"Darwin",reg:"grand",syllables:2},{name:"Newton",reg:"grand",syllables:2},{name:"Freud",reg:"grand",syllables:1}],
    girl: [{name:"Dialectique",reg:"absurd",syllables:4},{name:"Epistemique",reg:"absurd",syllables:5},{name:"Ontologie",reg:"absurd",syllables:4},{name:"Semantique",reg:"absurd",syllables:3},{name:"Metaphysique",reg:"absurd",syllables:4},{name:"Colette",reg:"grand",syllables:2},{name:"Marguerite",reg:"grand",syllables:3},{name:"Simone",reg:"grand",syllables:2},{name:"Yvette",reg:"grand",syllables:2},{name:"Brigitte",reg:"grand",syllables:2},{name:"Claudette",reg:"grand",syllables:2},{name:"Giselle",reg:"grand",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2}],
  },
  dachshund: {
    boy: [{name:"Elongated",reg:"absurd",syllables:4},{name:"Horizontal",reg:"absurd",syllables:4},{name:"Extended",reg:"absurd",syllables:3},{name:"Protracted",reg:"absurd",syllables:3},{name:"Oblong",reg:"absurd",syllables:2},{name:"Longitudinal",reg:"absurd",syllables:5},{name:"Accordion",reg:"absurd",syllables:4},{name:"Telescopic",reg:"absurd",syllables:4},{name:"Klaus",reg:"grand",syllables:1},{name:"Dieter",reg:"mundane",syllables:2},{name:"Franz",reg:"mundane",syllables:1},{name:"Hans",reg:"mundane",syllables:1},{name:"Otto",reg:"mundane",syllables:2},{name:"Wolfgang",reg:"grand",syllables:2},{name:"Napoleon",reg:"grand",syllables:4},{name:"Rasputin",reg:"grand",syllables:3}],
    girl: [{name:"Slinky",reg:"absurd",syllables:2},{name:"Sinuous",reg:"absurd",syllables:3},{name:"Serpentine",reg:"absurd",syllables:3},{name:"Streamlined",reg:"absurd",syllables:3},{name:"Filiform",reg:"absurd",syllables:3},{name:"Linear",reg:"absurd",syllables:3},{name:"Helga",reg:"mundane",syllables:2},{name:"Greta",reg:"mundane",syllables:2},{name:"Hilde",reg:"mundane",syllables:2},{name:"Ursula",reg:"mundane",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3}],
  },
  german: {
    boy: [{name:"Heinrich",reg:"grand",syllables:2},{name:"Wolfgang",reg:"grand",syllables:2},{name:"Dieter",reg:"mundane",syllables:2},{name:"Klaus",reg:"mundane",syllables:1},{name:"Reinhard",reg:"grand",syllables:2},{name:"Manfred",reg:"mundane",syllables:2},{name:"Siegfried",reg:"grand",syllables:2},{name:"Konrad",reg:"grand",syllables:2},{name:"Ludwig",reg:"grand",syllables:2},{name:"Friedrich",reg:"grand",syllables:2},{name:"Maximilian",reg:"grand",syllables:5},{name:"Amadeus",reg:"grand",syllables:4},{name:"Beethoven",reg:"grand",syllables:3},{name:"Mozart",reg:"grand",syllables:2}],
    girl: [{name:"Hildegard",reg:"grand",syllables:3},{name:"Brunhilde",reg:"grand",syllables:3},{name:"Lieselotte",reg:"grand",syllables:4},{name:"Gertrude",reg:"mundane",syllables:2},{name:"Ingeborg",reg:"grand",syllables:3},{name:"Elfriede",reg:"grand",syllables:3},{name:"Mathilde",reg:"grand",syllables:2},{name:"Hedwig",reg:"mundane",syllables:2},{name:"Mechthild",reg:"grand",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2}],
  },
  spaniel: {
    boy: [{name:"Archibald",reg:"grand",syllables:3},{name:"Wellington",reg:"grand",syllables:3},{name:"Rupert",reg:"grand",syllables:2},{name:"Cornelius",reg:"grand",syllables:4},{name:"Peregrine",reg:"grand",syllables:3},{name:"Humphrey",reg:"grand",syllables:2},{name:"Montgomery",reg:"grand",syllables:3},{name:"Algernon",reg:"grand",syllables:3},{name:"Bartholomew",reg:"grand",syllables:4},{name:"Reginald",reg:"grand",syllables:3},{name:"Auberon",reg:"grand",syllables:3},{name:"Lysander",reg:"grand",syllables:3},{name:"Skipper",reg:"chaos",syllables:2},{name:"Fetcher",reg:"chaos",syllables:2},{name:"Wagger",reg:"chaos",syllables:2},{name:"Wags",reg:"chaos",syllables:2},{name:"Splasher",reg:"chaos",syllables:2},{name:"Dasher",reg:"chaos",syllables:2},{name:"Scamper",reg:"chaos",syllables:2},{name:"Bouncer",reg:"chaos",syllables:2},{name:"Jumper",reg:"chaos",syllables:2},{name:"Pouncer",reg:"chaos",syllables:2},{name:"Rusher",reg:"chaos",syllables:2},{name:"Tumbler",reg:"chaos",syllables:2},{name:"Flipper",reg:"chaos",syllables:2},{name:"Dipper",reg:"chaos",syllables:2},{name:"Paddler",reg:"chaos",syllables:2},{name:"Scout",reg:"chaos",syllables:2},{name:"Tracker",reg:"chaos",syllables:2},{name:"Scooper",reg:"chaos",syllables:2},{name:"Springer",reg:"chaos",syllables:2}],
    girl: [{name:"Georgiana",reg:"grand",syllables:4},{name:"Arabella",reg:"grand",syllables:4},{name:"Clementine",reg:"grand",syllables:3},{name:"Millicent",reg:"grand",syllables:3},{name:"Cordelia",reg:"grand",syllables:4},{name:"Beatrice",reg:"grand",syllables:3},{name:"Frederica",reg:"grand",syllables:4},{name:"Constance",reg:"grand",syllables:2},{name:"Imogen",reg:"grand",syllables:3},{name:"Sophronia",reg:"grand",syllables:4},{name:"Henrietta",reg:"grand",syllables:4},{name:"Lavinia",reg:"grand",syllables:4},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3}],
  },
  character: {
    boy: [{name:"Napoleon",reg:"grand",syllables:4},{name:"Rasputin",reg:"grand",syllables:3},{name:"Churchill",reg:"grand",syllables:2},{name:"Waldo",reg:"mundane",syllables:2},{name:"Homer",reg:"mundane",syllables:2},{name:"Gus",reg:"mundane",syllables:1},{name:"Alf",reg:"mundane",syllables:1},{name:"Booboo",reg:"baby",syllables:2},{name:"Noo-Noo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},{name:"Smooshface",reg:"baby",syllables:2},{name:"Goober",reg:"chaos",syllables:2},{name:"Doodle",reg:"chaos",syllables:2},{name:"Gizmo",reg:"chaos",syllables:2},{name:"Spot",reg:"chaos",syllables:2},{name:"Rex",reg:"chaos",syllables:2},{name:"Fido",reg:"chaos",syllables:2},{name:"Rover",reg:"chaos",syllables:2},{name:"Patch",reg:"chaos",syllables:2},{name:"Bingo",reg:"chaos",syllables:2},{name:"Snoopy",reg:"chaos",syllables:2},{name:"Scooby",reg:"chaos",syllables:2},{name:"Pluto",reg:"chaos",syllables:2},{name:"Goofy",reg:"chaos",syllables:2},{name:"Bonzo",reg:"chaos",syllables:2},{name:"Pigeon",reg:"chaos",syllables:2},{name:"Goose",reg:"chaos",syllables:2},{name:"Weasel",reg:"chaos",syllables:2},{name:"Ferret",reg:"chaos",syllables:2},{name:"Otter",reg:"chaos",syllables:2},{name:"Lobster",reg:"chaos",syllables:2},{name:"Prawn",reg:"chaos",syllables:2},{name:"Sprat",reg:"chaos",syllables:2},{name:"Barnacle",reg:"chaos",syllables:2},{name:"Scrumpy",reg:"chaos",syllables:2},{name:"Nipper",reg:"chaos",syllables:2},{name:"Yapper",reg:"chaos",syllables:2},{name:"Snorter",reg:"chaos",syllables:2},{name:"Wriggler",reg:"chaos",syllables:2},{name:"Wobbler",reg:"chaos",syllables:2},{name:"Tumbler",reg:"chaos",syllables:2},{name:"Pogo",reg:"chaos",syllables:2},{name:"Zippy",reg:"chaos",syllables:2},{name:"Whizz",reg:"chaos",syllables:2}],
    girl: [{name:"Booboo",reg:"baby",syllables:2},{name:"Tutu",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},{name:"Coco",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},{name:"Jellybean",reg:"food",syllables:3},{name:"Cupcake",reg:"food",syllables:2},{name:"Candyfloss",reg:"food",syllables:3},{name:"Wibble",reg:"chaos",syllables:2},{name:"Dizzy",reg:"chaos",syllables:2},{name:"Topsy",reg:"chaos",syllables:2}],
  },
  default: {
    boy: [{name:"Archibald",reg:"grand",syllables:3},{name:"Barnaby",reg:"grand",syllables:3},{name:"Cornelius",reg:"grand",syllables:4},{name:"Douglas",reg:"mundane",syllables:2},{name:"Frederick",reg:"grand",syllables:3},{name:"Herbert",reg:"mundane",syllables:2},{name:"Jasper",reg:"grand",syllables:2},{name:"Lionel",reg:"grand",syllables:3},{name:"Montgomery",reg:"grand",syllables:3},{name:"Norman",reg:"mundane",syllables:2},{name:"Percival",reg:"grand",syllables:3},{name:"Reginald",reg:"grand",syllables:3},{name:"Stanley",reg:"mundane",syllables:2},{name:"Theodore",reg:"grand",syllables:3},{name:"Vincent",reg:"grand",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3}],
    girl: [{name:"Arabella",reg:"grand",syllables:4},{name:"Beatrice",reg:"grand",syllables:3},{name:"Clementine",reg:"grand",syllables:3},{name:"Dorothy",reg:"mundane",syllables:3},{name:"Eleanor",reg:"grand",syllables:3},{name:"Georgiana",reg:"grand",syllables:4},{name:"Isadora",reg:"grand",syllables:4},{name:"Lavinia",reg:"grand",syllables:4},{name:"Millicent",reg:"grand",syllables:3},{name:"Nora",reg:"mundane",syllables:2},{name:"Prudence",reg:"mundane",syllables:2},{name:"Rosalind",reg:"grand",syllables:3},{name:"Sophronia",reg:"grand",syllables:4},{name:"Tabitha",reg:"grand",syllables:3},{name:"Vivienne",reg:"grand",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3}],
  },
};

// ── DOG WORDS ──────────────────────────────────────────────────────────────────
const DOG_WORDS: Record<string, WordEntry[]> = {
  spaniel:    [{word:"Flush",reg:"nature",firstLetter:"f"},{word:"Fetch",reg:"nature",firstLetter:"f"},{word:"Waggle",reg:"chaos",firstLetter:"w"},{word:"Splash",reg:"chaos",firstLetter:"s"},{word:"Frolic",reg:"chaos",firstLetter:"f"},{word:"Gambol",reg:"chaos",firstLetter:"g"},{word:"Prance",reg:"grand",firstLetter:"p"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Romp",reg:"chaos",firstLetter:"r"}],
  retriever:  [{word:"Fetch",reg:"nature",firstLetter:"f"},{word:"Wag",reg:"baby",firstLetter:"w"},{word:"Paddle",reg:"chaos",firstLetter:"p"},{word:"Lollop",reg:"chaos",firstLetter:"l"},{word:"Galumph",reg:"chaos",firstLetter:"g"},{word:"Scoff",reg:"food",firstLetter:"s"},{word:"Snuffle",reg:"baby",firstLetter:"s"},{word:"Mooch",reg:"mundane",firstLetter:"m"},{word:"Slurp",reg:"food",firstLetter:"s"},{word:"Devour",reg:"food",firstLetter:"d"},{word:"Bound",reg:"chaos",firstLetter:"b"}],
  collie:     [{word:"Herd",reg:"grand",firstLetter:"h"},{word:"Dart",reg:"chaos",firstLetter:"d"},{word:"Circle",reg:"grand",firstLetter:"c"},{word:"Weave",reg:"grand",firstLetter:"w"},{word:"Dash",reg:"chaos",firstLetter:"d"},{word:"Sprint",reg:"chaos",firstLetter:"s"},{word:"Gather",reg:"grand",firstLetter:"g"},{word:"Stalk",reg:"chaos",firstLetter:"s"},{word:"Border",reg:"grand",firstLetter:"b"}],
  boxer:      [{word:"Charge",reg:"chaos",firstLetter:"c"},{word:"Barrel",reg:"chaos",firstLetter:"b"},{word:"Blunder",reg:"chaos",firstLetter:"b"},{word:"Crash",reg:"chaos",firstLetter:"c"},{word:"Bounce",reg:"chaos",firstLetter:"b"},{word:"Wobble",reg:"chaos",firstLetter:"w"},{word:"Stumble",reg:"chaos",firstLetter:"s"},{word:"Gallumph",reg:"chaos",firstLetter:"g"},{word:"Bumble",reg:"baby",firstLetter:"b"},{word:"Bluster",reg:"chaos",firstLetter:"b"}],
  sniffer:    [{word:"Sniff",reg:"mundane",firstLetter:"s"},{word:"Sleuth",reg:"grand",firstLetter:"s"},{word:"Hunt",reg:"grand",firstLetter:"h"},{word:"Nose",reg:"mundane",firstLetter:"n"},{word:"Scout",reg:"grand",firstLetter:"s"},{word:"Hound",reg:"grand",firstLetter:"h"},{word:"Quest",reg:"grand",firstLetter:"q"},{word:"Find",reg:"grand",firstLetter:"f"},{word:"Detect",reg:"grand",firstLetter:"d"},{word:"Snuffle",reg:"mundane",firstLetter:"s"}],
  sighthound: [{word:"Sprint",reg:"grand",firstLetter:"s"},{word:"Dart",reg:"chaos",firstLetter:"d"},{word:"Bolt",reg:"chaos",firstLetter:"b"},{word:"Flash",reg:"chaos",firstLetter:"f"},{word:"Streak",reg:"chaos",firstLetter:"s"},{word:"Glide",reg:"grand",firstLetter:"g"},{word:"Skim",reg:"grand",firstLetter:"s"},{word:"Scorch",reg:"chaos",firstLetter:"s"},{word:"Race",reg:"chaos",firstLetter:"r"},{word:"Sweep",reg:"grand",firstLetter:"s"}],
  giant:      [{word:"Lumber",reg:"chaos",firstLetter:"l"},{word:"Plod",reg:"mundane",firstLetter:"p"},{word:"Stomp",reg:"chaos",firstLetter:"s"},{word:"Thud",reg:"chaos",firstLetter:"t"},{word:"Rumble",reg:"chaos",firstLetter:"r"},{word:"Sway",reg:"grand",firstLetter:"s"},{word:"Loom",reg:"chaos",firstLetter:"l"},{word:"Thunder",reg:"chaos",firstLetter:"t"},{word:"Shamble",reg:"chaos",firstLetter:"s"},{word:"Quake",reg:"chaos",firstLetter:"q"}],
  poodle:     [{word:"Prance",reg:"grand",firstLetter:"p"},{word:"Strut",reg:"grand",firstLetter:"s"},{word:"Waltz",reg:"grand",firstLetter:"w"},{word:"Sashay",reg:"grand",firstLetter:"s"},{word:"Glide",reg:"grand",firstLetter:"g"},{word:"Mince",reg:"grand",firstLetter:"m"},{word:"Flourish",reg:"grand",firstLetter:"f"},{word:"Pirouette",reg:"grand",firstLetter:"p"},{word:"Pose",reg:"grand",firstLetter:"p"},{word:"Primp",reg:"grand",firstLetter:"p"}],
  lapdog:     [{word:"Prance",reg:"grand",firstLetter:"p"},{word:"Bounce",reg:"baby",firstLetter:"b"},{word:"Waltz",reg:"grand",firstLetter:"w"},{word:"Flounce",reg:"grand",firstLetter:"f"},{word:"Sashay",reg:"grand",firstLetter:"s"},{word:"Fluff",reg:"baby",firstLetter:"f"},{word:"Shimmy",reg:"grand",firstLetter:"s"},{word:"Pamper",reg:"baby",firstLetter:"p"},{word:"Flutter",reg:"baby",firstLetter:"f"},{word:"Glitter",reg:"grand",firstLetter:"g"}],
  character:  [{word:"Snort",reg:"chaos",firstLetter:"s"},{word:"Waddle",reg:"chaos",firstLetter:"w"},{word:"Tumble",reg:"chaos",firstLetter:"t"},{word:"Bumble",reg:"chaos",firstLetter:"b"},{word:"Wobble",reg:"chaos",firstLetter:"w"},{word:"Totter",reg:"chaos",firstLetter:"t"},{word:"Blunder",reg:"chaos",firstLetter:"b"},{word:"Grumble",reg:"chaos",firstLetter:"g"},{word:"Wheeze",reg:"chaos",firstLetter:"w"},{word:"Puff",reg:"chaos",firstLetter:"p"}],
  terrier:    [{word:"Bolt",reg:"chaos",firstLetter:"b"},{word:"Dig",reg:"chaos",firstLetter:"d"},{word:"Scrap",reg:"chaos",firstLetter:"s"},{word:"Rumpus",reg:"chaos",firstLetter:"r"},{word:"Rattle",reg:"chaos",firstLetter:"r"},{word:"Pounce",reg:"chaos",firstLetter:"p"},{word:"Snap",reg:"chaos",firstLetter:"s"},{word:"Yap",reg:"chaos",firstLetter:"y"},{word:"Scurry",reg:"chaos",firstLetter:"s"},{word:"Burrow",reg:"chaos",firstLetter:"b"}],
  german:     [{word:"March",reg:"grand",firstLetter:"m"},{word:"Drill",reg:"grand",firstLetter:"d"},{word:"Patrol",reg:"grand",firstLetter:"p"},{word:"Guard",reg:"grand",firstLetter:"g"},{word:"Flank",reg:"grand",firstLetter:"f"},{word:"Advance",reg:"grand",firstLetter:"a"},{word:"Intercept",reg:"grand",firstLetter:"i"},{word:"Secure",reg:"grand",firstLetter:"s"},{word:"Enforce",reg:"grand",firstLetter:"e"},{word:"Breach",reg:"grand",firstLetter:"b"}],
  dachshund:  [{word:"Scuttle",reg:"chaos",firstLetter:"s"},{word:"Waddle",reg:"chaos",firstLetter:"w"},{word:"Burrow",reg:"chaos",firstLetter:"b"},{word:"Squeeze",reg:"chaos",firstLetter:"s"},{word:"Tunnel",reg:"chaos",firstLetter:"t"},{word:"Wriggle",reg:"chaos",firstLetter:"w"},{word:"Slither",reg:"chaos",firstLetter:"s"},{word:"Stretch",reg:"absurd",firstLetter:"s"},{word:"Extend",reg:"absurd",firstLetter:"e"},{word:"Elongate",reg:"absurd",firstLetter:"e"}],
  default:    [{word:"Trot",reg:"mundane",firstLetter:"t"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Wag",reg:"baby",firstLetter:"w"},{word:"Prance",reg:"grand",firstLetter:"p"},{word:"Romp",reg:"chaos",firstLetter:"r"},{word:"Caper",reg:"chaos",firstLetter:"c"},{word:"Frolic",reg:"chaos",firstLetter:"f"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Saunter",reg:"mundane",firstLetter:"s"},{word:"Gambol",reg:"chaos",firstLetter:"g"}],
};

// ── REASONING ─────────────────────────────────────────────────────────────────
const REASONING: Record<string, string[]> = {
  lapdog:    ["Looks like a small cloud that someone has given opinions.","Perpetually groomed, permanently cheerful, mildly judgmental.","Has maintained this exact hairstyle for several centuries.","Arrives in a room the way a bishop arrives at a christening -- expected, overdressed, and faintly disapproving.","Four hundred years of palace living leaves a dog with very particular ideas about ceremony."],
  boxer:     ["Approaches every situation with maximum enthusiasm and minimum strategy.","Loyal, loud, and absolutely convinced that sitting on your lap is a human right.","Looks permanently surprised, even at things it caused.","Never met a stranger. This is not always helpful on military exercises.","Approaches every day as though something brilliant is about to happen. It usually involves a sock."],
  sighthound:["Forty miles per hour of elegant indifference. The earldom was awarded for sheer deportment.","Has always considered the peerage its natural social circle -- if anything, beneath it.","Has been aristocratic since before the British aristocracy was invented.","Moves through the world with the serene confidence of something that has never once been told no."],
  sniffer:   ["Has the air of a detective who solved the case three days ago and is merely waiting for everyone else.","Melancholy eyes, powerful nose, deeply suspicious of everything.","Follows a scent with the focus of a detective who has forgotten why they started.","The most expensive biological detection equipment in the world. Currently investigating a crisp packet."],
  giant:     ["So large that the title had to match the physical reality.","Was named Teacup at eight weeks. At eighteen months, the irony became structural.","Sits on your lap with complete confidence of something that weighs sixty kilograms.","Operates more like a geographic feature than an animal."],
  terrier:   ["The only dog that regularly picks fights with things three times its size and usually wins.","A terrier would consider a title an unnecessary distraction from the serious business of digging.","Six inches of righteous fury in a jacket of wiry fur.","Has declared war on the postman, the vacuum cleaner, and a leaf. Currently winning two of those."],
  retriever: ["Dependable, cheerful, and utterly convinced every situation calls for a biscuit.","Greets burglars as enthusiastically as family members.","Has never met a puddle it didn't immediately lie down in.","The only animal capable of looking genuinely hurt that there are no more biscuits."],
  collie:    ["The most intelligent dog in the world and absolutely cannot stop telling you about it.","Herds sheep, children, and visiting relatives with equal efficiency.","Has never once been off duty. Not once. Not even asleep."],
  poodle:    ["The most intelligent dog in the world and considerably better dressed than you.","Originally a water retriever, now primarily a philosopher. The doctorate was inevitable.","Breeds above itself in intelligence and consistently knows it."],
  spaniel:   ["Spaniels have commanded hunting parties since the Tudor court. A generalship was long overdue.","Floppy ears and absolute authority -- the spaniel was born to lead.","The Field Marshal of the water meadow and the reed bed since 1600."],
  character: ["A face like a fist, a personality like a party.","Breathes loudly through every social occasion with complete conviction it is doing this correctly.","Believes it is a much larger dog trapped in a terrible administrative error."],
  dachshund: ["Two thousand years of German engineering went into a dog that cannot reach most surfaces.","Moves through the world like a very short scandal.","The proportions suggest an engineering compromise was made at some point. The dog disagrees."],
  default:   ["A dog of considerable distinction that has earned its title through sheer presence.","The rank was awarded after careful consideration. The evidence was considerable."],
};

// ── NICKNAMES ─────────────────────────────────────────────────────────────────
const NICKNAMES: Record<string,string> = {
  archibald:"Archie",bartholomew:"Baz",cornelius:"Cornie",reginald:"Reggie",algernon:"Algie",
  peregrine:"Perry",maximillian:"Max",maximilian:"Max",humphrey:"Humph",montgomery:"Monty",
  ferdinand:"Ferdie",alexander:"Alex",sebastian:"Seb",theodore:"Teddy",frederick:"Freddie",
  wellington:"Welly",percival:"Percy",wilfred:"Wilf",sherlock:"Sherl",hercule:"Herc",
  augustus:"Gus",auberon:"Aubs",barnaby:"Barnie",benedictus:"Benny",fortunatus:"Forty",
  celestin:"Cel",florentine:"Flo",evangelina:"Evie",evangeline:"Evie",celestine:"Celly",
  sophronia:"Soph",euphemia:"Effie",wilhelmina:"Billie",clementine:"Clem",millicent:"Millie",
  frederica:"Freddie",constance:"Connie",prudence:"Prue",dorothea:"Dot",theodosia:"Teddy",
  philomena:"Philly",seraphine:"Sera",arabella:"Bella",georgiana:"Georgie",cassiopeia:"Cassie",
  isadora:"Izzy",pandemonium:"Panda",discombobulate:"Disco",hullabaloo:"Hully",pandemonia:"Panda",
  nonchalance:"Nona",glaciale:"Glayglay",langueur:"Langy",indifferencia:"Indie",aloofia:"Loofy",
  lachrymose:"Lacky",plodsworth:"Plodsy",gloopington:"Gloops",frenzina:"Frenzy",woebegone:"Woeby",
  maelstrom:"Maely",existentiale:"Exie",hermeneutique:"Hermy",elongated:"Longy",basil:"Baz",
  nincompoop:"Ninnie",chumbawumba:"Chumba",zippadeedooda:"Zippy",snugglebum:"Snugs",
  cuddlekins:"Cuddles",squishface:"Squish",babbycakes:"Babs",tiddlywink:"Tiddles",
  fluffybum:"Fluffy",smooshface:"Smoosh",jellybean:"Jelly",marshmallow:"Marsh",
  candyfloss:"Candy",puddingkins:"Pudds",lambchop:"Lamby",pumpkinhead:"Pumps",
  hypervigilant:"Hyper",indefatigable:"Indy",infinitesimal:"Tiny",imperceptible:"Imp",
  microscopic:"Micro",diminutive:"Dimmy",gossamera:"Gossie",daintybell:"Bell",
  galumph:"Lumphy",kerfuffle:"Kerfie",chuckles:"Chuck",pickles:"Picks",noodles:"Noods",
  chipmunk:"Chip",
};

function getNickname(n: string): string { return NICKNAMES[n.toLowerCase().replace(/[^a-z]/g,"")] || ""; }

function getGroup(breed: string): string {
  const b = breed.toLowerCase();
  if (b === "cavalier king charles spaniel") return "lapdog";
  if (b.includes("spaniel")) return "spaniel";
  if (b.includes("retriever") || b === "labrador" || b === "labradoodle" || b === "goldendoodle") return "retriever";
  if (b === "border collie" || b === "rough collie") return "collie";
  if (["bulldog"].includes(b)) return "bulldog";
  if (["staffordshire bull terrier","boxer","bull terrier","french bulldog"].includes(b)) return "boxer";
  if (["basset hound","bloodhound","beagle"].includes(b)) return "sniffer";
  if (["greyhound","afghan hound","borzoi","saluki","irish wolfhound","lurcher","whippet","italian greyhound"].includes(b)) return "sighthound";
  if (["great dane","mastiff","saint bernard","newfoundland","leonberger"].includes(b)) return "giant";
  if (b === "poodle") return "poodle";
  if (["bichon frise","shih tzu","pomeranian","papillon","maltese","maltipoo","cavapoo","cavachon"].includes(b)) return "lapdog";
  if (b === "dachshund") return "dachshund";
  if (["german shepherd","doberman pinscher","rottweiler","weimaraner"].includes(b)) return "german";
  if (["pug","siberian husky","chihuahua","corgi","boston terrier"].includes(b)) return "character";
  if (b.includes("terrier") || b === "miniature schnauzer") return "terrier";
  return "default";
}

function pick<T>(arr: T[], seed: number): T { return arr[Math.abs(seed) % arr.length]; }

function generateScored(breed: string, surname: string, gender: "boy"|"girl", seed: number, town = "", colour: DogColour = "") {
  const group = getGroup(breed);
  const nameBank = (NAMES[group] || NAMES.default)[gender];
  const titleBank = gender === "boy" ? (BOY_TITLES[group] || BOY_TITLES.default) : (GIRL_TITLES[group] || GIRL_TITLES.default);
  const wordBank = DOG_WORDS[group] || DOG_WORDS.default;
  const reasoningBank = REASONING[group] || REASONING.default;
  const title = pick(titleBank, seed);
  const firstName = pick(nameBank, seed + 3);
  const dogWordEntry = pick(wordBank, seed + 7);
  const alreadyHyphenated = surname.includes("-");
  // Only hyphenate if dog word adds contrast against the first name
  const wordContrast = contrastScore(dogWordEntry.reg, firstName.reg);
  const noHyphenGroups = ["sniffer"];
  const useHyphen = !alreadyHyphenated && wordContrast >= 2 && !noHyphenGroups.includes(group);
  const baseSurname = useHyphen ? `${dogWordEntry.word}-${surname}` : surname;
  const effectiveSurname = town || baseSurname;
  const group2 = getGroup(breed);

  const validAbbrevs = ABBREVS.filter((a: AbbrevEntry) =>
    (a.gender === "any" || a.gender === gender) &&
    (!a.breeds || a.breeds.includes(group2))
  );

  const styleRoll = seed % 13;
  let full = "";
  let nickname = "";

  if (styleRoll === 0 && validAbbrevs.length > 0) {
    const abbrev = pick(validAbbrevs, seed + 5);
    full = `${abbrev.code} ${effectiveSurname}`;
    nickname = abbrev.meaning;
  } else if (styleRoll === 1 && gender === "boy") {
    const letter = pick(DTRAIN_LETTERS, seed + 13);
    const suffix = pick(DTRAIN_SUFFIXES, seed + 19);
    full = `${letter}-${suffix} ${effectiveSurname}`;
  } else if (styleRoll === 2 && gender === "girl") {
    const fName = pick(MARIEJ_FIRSTS, seed + 7);
    const mInit = pick(MARIEJ_INITIALS, seed + 23);
    full = `${fName} ${mInit} ${effectiveSurname}`;
  } else {
    full = `${title.title} ${firstName.name} ${effectiveSurname}`;
    const tInit = title.title.replace(/^(Lil'|Ol'|Wee|Baby|Little|Daft|Cheeky|Silly|Scruffy|Fluffy|Grumpy|Noisy)\s/,"")[0]?.toUpperCase() || "";
    const nInit = firstName.name[0]?.toUpperCase() || "";
    const initials2 = tInit + nInit;
    const matched = validAbbrevs.find((a: AbbrevEntry) => a.code === initials2);
    if (matched) {
      nickname = `${matched.code} — ${matched.meaning}`;
    } else {
      nickname = getNickname(firstName.name);
    }
  }

  const reasoning = pick(reasoningBank, seed + 11);
  const score = scoreName(title, firstName, dogWordEntry, surname, colour);
  return { full, nickname, reasoning, score };
}


// ── DEDUPLICATION ─────────────────────────────────────────────────────────────
// Pick top results ensuring no repeated first names, titles, or dog words
function dedupeResults(candidates: Result[], limit = 10): Result[] {
  const usedFirstNames  = new Set<string>();
  const usedTitles      = new Set<string>();
  const usedDogWords    = new Set<string>();
  const out: Result[] = [];
  for (const r of candidates) {
    if (!r) continue;
    const parts   = r.full.split(" ");
    const title   = parts[0];
    const firstName = parts[1] ?? "";
    // Extract dog word from hyphenated surname (e.g. "Sniff-Taylor" -> "Sniff")
    const surnamepart = parts[parts.length - 1] ?? "";
    const dogWord = surnamepart.includes("-") ? surnamepart.split("-")[0] : "";
    if (usedFirstNames.has(firstName)) continue;
    if (usedTitles.has(title)) continue;
    if (dogWord && usedDogWords.has(dogWord)) continue;
    usedFirstNames.add(firstName);
    usedTitles.add(title);
    if (dogWord) usedDogWords.add(dogWord);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}

type Stage = "inputs"|"question"|"reveal";
type Result = { full: string; nickname: string; reasoning: string; score: number };
type PrefixEntry = { prefix: string; breeds: string[]; bonusContrast: number; };

const TITLE_PREFIXES_GIRL: { prefix: string; bonusContrast: number }[] = [
  { prefix: "Grand",    bonusContrast: 2 },
  { prefix: "Supreme",  bonusContrast: 2 },
  { prefix: "Divine",   bonusContrast: 3 },
  { prefix: "Imperial", bonusContrast: 2 },
  { prefix: "Arch",     bonusContrast: 2 },
  { prefix: "High",     bonusContrast: 2 },
  { prefix: "Ultra",    bonusContrast: 2 },
  { prefix: "Très",     bonusContrast: 3 },
];

const TITLE_PREFIXES: PrefixEntry[] = [
  { prefix: "Super",  breeds: ["retriever","spaniel","sniffer","lapdog","default","gentry","bulldog"], bonusContrast: 2 },
  { prefix: "Uber",   breeds: ["german","boxer","giant"], bonusContrast: 2 },
  { prefix: "Hyper",  breeds: ["collie","terrier","highenergy"], bonusContrast: 3 },
  { prefix: "Mega",   breeds: ["giant","character","dachshund"], bonusContrast: 2 },
  { prefix: "Ultra",  breeds: ["german","sighthound"], bonusContrast: 2 },
];

export default function NameGeneratorPage() {
  const [breed, setBreed] = useState("");
  const [surname, setSurname] = useState("");
  const [town, setTown] = useState("");
  const [gender, setGender] = useState<"boy"|"girl">("boy");
  const [stage, setStage] = useState<Stage>("inputs");
  const [question, setQuestion] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [seed, setSeed] = useState(0);
  const [colour, setColour] = useState<DogColour>("");

  function handleGenerate() {
    if (!breed) { alert("Please select a breed"); return; }
    if (!surname.trim()) { alert("Please enter your surname"); return; }
    const s = Math.floor(Math.random() * 10000);
    setSeed(s);
    setQuestion(QUESTIONS[s % QUESTIONS.length]);
    setStage("question");
  }

  function handleAnswer() {
    const townMatch = FUNNY_PLACES.has(town.trim());
    const effectiveTown = townMatch ? town.trim() : "";
    const candidates = Array.from({length:20},(_,i) => generateScored(breed, surname.trim(), gender, seed + i * 17, effectiveTown, colour));
    candidates.sort((a,b) => b.score - a.score);
    const THRESHOLD2 = 19;
    const topScore2 = candidates[0]?.score ?? 0;
    let finalCandidates2 = candidates;
    if (topScore2 < THRESHOLD2) {
      const group2b = getGroup(breed);
      const prefixPass = Array.from({length:20},(_,i) => {
        const r = generateScored(breed, surname.trim(), gender, seed + i * 17, effectiveTown, colour);
        if (!r) return null;
        let pe: { prefix: string; bonusContrast: number };
        if (gender === "boy") {
          const matching = TITLE_PREFIXES.filter((p: PrefixEntry) => p.breeds.includes(group2b));
          if (!matching.length) return null;
          pe = matching[(seed + i) % matching.length];
        } else {
          pe = TITLE_PREFIXES_GIRL[(seed + i) % TITLE_PREFIXES_GIRL.length];
        }
        const prefixedTitle = pe.prefix + " " + r.full.split(" ")[0];
        const rest = r.full.split(" ").slice(1).join(" ");
        return { ...r, full: prefixedTitle + " " + rest, score: r.score + pe.bonusContrast };
      }).filter(Boolean) as Result[];
      finalCandidates2 = [...candidates, ...prefixPass].sort((a,b) => b.score - a.score);
    }
    setResults(dedupeResults(finalCandidates2.filter(Boolean) as Result[]));
    setStage("reveal");
  }

  function handleRollAgain() {
    const s = Math.floor(Math.random() * 10000);
    setSeed(s);
    setQuestion(QUESTIONS[s % QUESTIONS.length]);
    setStage("question");
  }

  const cardImg = breed ? CARD_IMAGE[breed] ?? null : null;

  return (
    <>
      <Nav />
      <main style={{ minHeight:"100vh", padding:"clamp(60px,10vw,120px) clamp(16px,5vw,48px) 80px" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <h1 className="display" style={{ textAlign:"center", marginBottom:16, fontSize:"clamp(3rem,10vw,6.5rem)", color:"var(--navy)", lineHeight:0.95 }}>
            Chum <span className="display-yellow">Name</span> Generator
          </h1>
          <p style={{ textAlign:"center", color:"var(--navy)", fontFamily:"var(--font-body)", fontSize:"clamp(1rem,2.5vw,1.3rem)", fontWeight:600, marginBottom:48 }}>
            Give your dog the title they truly deserve
          </p>

          {/* ── STAGE 1: INPUTS ── */}
          {stage === "inputs" && (
            <div style={{ background:"var(--navy)", borderRadius:20, padding:"clamp(20px,4vw,36px)" }}>
              <label style={{ display:"block", color:"var(--yellow)", fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, fontFamily:"var(--font-body)" }}>Your dog&apos;s breed</label>
              <select value={breed} onChange={(e: {target: HTMLSelectElement}) => setBreed(e.target.value)}
                style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:breed?"#fff":"rgba(255,255,255,0.4)", fontFamily:"var(--font-body)", fontSize:"0.95rem", marginBottom:20, outline:"none", boxSizing:"border-box" }}>
                <option value="">-- Select a breed --</option>
                <optgroup label="Pedigree Chums Pack Breeds">
                  {PACK_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                </optgroup>
                <optgroup label="Other Breeds">
                  {OTHER_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                </optgroup>
              </select>

              <label style={{ display:"block", color:"var(--yellow)", fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, fontFamily:"var(--font-body)" }}>Your surname</label>
              <input type="text" value={surname} onChange={(e: {target: HTMLInputElement}) => setSurname(e.target.value)}
                placeholder="e.g. Jones, Clarke, Thompson-Alexander..."
                maxLength={60} onKeyDown={(e: {key: string}) => e.key === "Enter" && handleGenerate()}
                style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontFamily:"var(--font-body)", fontSize:"0.95rem", marginBottom:20, outline:"none", boxSizing:"border-box" }} />

              <label style={{ display:"block", color:"var(--yellow)", fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10, fontFamily:"var(--font-body)" }}>Boy or girl?</label>
              <div style={{ display:"flex", gap:10, marginBottom:24 }}>
                {(["boy","girl"] as const).map(g => (
                  <button key={g} onClick={() => setGender(g)}
                    style={{ flex:1, padding:12, borderRadius:12, border:`1.5px solid ${gender===g?"var(--yellow)":"rgba(255,255,255,0.15)"}`, background:gender===g?"var(--yellow)":"rgba(255,255,255,0.08)", color:gender===g?"var(--navy)":"#fff", fontFamily:"var(--font-body)", fontSize:"0.9rem", fontWeight:700, cursor:"pointer", textTransform:"capitalize" }}>
                    {g === "boy" ? "Boy" : "Girl"}
                  </button>
                ))}
              </div>

              <button onClick={handleGenerate} className="display"
                style={{ width:"100%", padding:16, borderRadius:14, border:"none", background:"var(--yellow)", color:"var(--navy)", fontSize:"1.3rem", cursor:"pointer", boxShadow:"0 4px 0 rgba(10,58,87,0.4)", letterSpacing:"0.04em" }}>
                Find my chum&apos;s name
              </button>
            </div>
          )}

          {/* ── STAGE 2: RANDOM QUESTION ── */}
          {stage === "question" && (
            <div style={{ background:"var(--navy)", borderRadius:20, padding:"clamp(24px,5vw,48px)", textAlign:"center" }}>
              <p style={{ color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-body)", fontSize:"0.75rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:24 }}>One quick question</p>
              <p className="display" style={{ fontSize:"clamp(1.4rem,4vw,2rem)", color:"#fff", marginBottom:40, lineHeight:1.3 }}>
                {question}
              </p>
              <div style={{ display:"flex", gap:12 }}>
                <button onClick={handleAnswer}
                  style={{ flex:1, padding:"16px", borderRadius:14, border:"none", background:"var(--yellow)", color:"var(--navy)", fontFamily:"var(--font-body)", fontSize:"1.1rem", fontWeight:700, cursor:"pointer" }}>
                  Yes
                </button>
                <button onClick={handleAnswer}
                  style={{ flex:1, padding:"16px", borderRadius:14, border:"2px solid rgba(255,255,255,0.3)", background:"transparent", color:"#fff", fontFamily:"var(--font-body)", fontSize:"1.1rem", fontWeight:700, cursor:"pointer" }}>
                  No
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 3: REVEAL ── */}
          {stage === "reveal" && results.length > 0 && (
            <>
              {cardImg && (
                <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cardImg} alt={breed} style={{ width:160, height:"auto", borderRadius:16, boxShadow:"0 8px 32px rgba(10,58,87,0.25)" }} />
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:16, marginBottom:20 }}>
                {results.map((r: {full:string;nickname:string;reasoning:string;score:number}, i: number) => (
                  <div key={i} style={{ background:"#fff", borderRadius:18, padding:"clamp(16px,2.5vw,24px)", borderTop:`5px solid ${i === 0 ? "var(--yellow)" : "var(--blue-sky)"}`, boxShadow:"0 2px 16px rgba(10,58,87,0.08)" }}>
                    {i === 0 && <div style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--yellow)", background:"var(--navy)", display:"inline-block", padding:"2px 8px", borderRadius:6, marginBottom:8, fontFamily:"var(--font-body)" }}>Top pick</div>}
                    <div className="display" style={{ fontSize:"clamp(1rem,2.5vw,1.4rem)", color:"var(--navy)", marginBottom:4, lineHeight:1.2 }}>{r.full}</div>
                    {r.nickname && (
                      <div style={{ fontSize:"0.8rem", color:"var(--blue-deep)", fontStyle:"italic", marginBottom:10, fontFamily:"var(--font-body)", fontWeight:600 }}>
                        Known to friends as: {r.nickname}
                      </div>
                    )}
                    <div style={{ fontSize:"0.8rem", color:"#555", lineHeight:1.6, borderTop:"1px solid #eee", paddingTop:10, fontFamily:"var(--font-body)" }}>{r.reasoning}</div>
                    <div style={{ fontSize:"0.65rem", color:"#ccc", marginTop:8, fontFamily:"var(--font-body)" }}>score: {r.score}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", gap:12 }}>
                <button onClick={handleRollAgain} className="display"
                  style={{ flex:1, padding:15, borderRadius:14, border:"3px solid var(--navy)", background:"transparent", color:"var(--navy)", fontSize:"clamp(0.9rem,2vw,1.1rem)", cursor:"pointer", letterSpacing:"0.04em" }}>
                  Roll again
                </button>
                <button onClick={() => { setStage("inputs"); setResults([]); }} className="display"
                  style={{ flex:1, padding:15, borderRadius:14, border:"none", background:"var(--navy)", color:"var(--yellow)", fontSize:"clamp(0.9rem,2vw,1.1rem)", cursor:"pointer", letterSpacing:"0.04em" }}>
                  Start over
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
