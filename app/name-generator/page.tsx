"use client";
import { useState, useEffect } from "react";
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
  "Birmingham",
  "Wolverhampton",
  "Dudley",
  "Walsall",
  "Coventry",
  "Stoke",
  "Derby",
  "Leicester",
  "Nottingham",
  "Loughborough",
  "Lincoln",
  "Leeds",
  "Sheffield",
  "Bradford",
  "Hull",
  "York",
  "Huddersfield",
  "Manchester",
  "Salford",
  "Bolton",
  "Wigan",
  "Liverpool",
  "Blackpool",
  "Newcastle",
  "Sunderland",
  "Middlesbrough",
  "Gateshead",
  "Durham",
  "Bristol",
  "Exeter",
  "Plymouth",
  "Truro",
  "Penzance",
  "Falmouth",
  "Bath",
  "Glasgow",
  "Edinburgh",
  "Aberdeen",
  "Dundee",
  "Inverness",
  "Stirling"]);

// ── ABBREVIATION WHITELIST ─────────────────────────────────────────────────────
interface AbbrevEntry { code: string; meaning: string; gender: "boy"|"girl"|"any"; breeds?: string[]; }
const ABBREVS: AbbrevEntry[] = [
  // ── STREET / SWAGGER -- boxer, terrier, character, bulldog, boston only ───
  {code:"AC",meaning:"Ace Commander",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"BB",meaning:"Big Boss",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"BA",meaning:"Bad Attitude",gender:"boy",breeds:["character","boxer"]},
  {code:"BC",meaning:"Boss Commander",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"BD",meaning:"Big Deal",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"BG",meaning:"Big Gangster",gender:"boy",breeds:["character","boxer"]},
  {code:"BK",meaning:"Boss King",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"BM",meaning:"Big Money",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"BO",meaning:"Boss Original",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"BP",meaning:"Big Player",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"CB",meaning:"Certified Boss",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"CK",meaning:"Chaos King",gender:"boy",breeds:["terrier","character"]},
  {code:"CL",meaning:"Certified Lover",gender:"boy",breeds:["lapdog","character","boxer","spaniel","boston"]},
  {code:"CLB",meaning:"Certified Lover Boy",gender:"boy",breeds:["lapdog","character","boxer","spaniel"]},
  {code:"DB",meaning:"Da Boss",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"DR",meaning:"Da Realest",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"FB",meaning:"Fearless Boss",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"HC",meaning:"Heart Collector",gender:"boy",breeds:["lapdog","character","boxer","spaniel"]},
  {code:"HL",meaning:"Heart Lover",gender:"boy",breeds:["lapdog","character","boxer","spaniel"]},
  {code:"KB",meaning:"King Boss",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"KC",meaning:"King of Chaos",gender:"boy",breeds:["terrier","character"]},
  {code:"KG",meaning:"King of the Game",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"KO",meaning:"Knockout",gender:"boy",breeds:["boxer"]},
  {code:"LB",meaning:"Legendary Boss",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"LC",meaning:"Ladies Choice",gender:"boy",breeds:["lapdog","character","boxer","spaniel","boston"]},
  {code:"LH",meaning:"Ladies Hero",gender:"boy",breeds:["lapdog","character","boxer","spaniel"]},
  {code:"LL",meaning:"Ladies Lover",gender:"boy",breeds:["lapdog","character","boxer","spaniel"]},
  {code:"LP",meaning:"Ladies Pick",gender:"boy",breeds:["lapdog","character","boxer","spaniel"]},
  {code:"MB",meaning:"Master Boss",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"MM",meaning:"Mystery Man",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"NA",meaning:"No Apologies",gender:"any",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"NB",meaning:"Natural Boss",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"NF",meaning:"No Fear",gender:"any",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"OG",meaning:"Original Gangster",gender:"boy",breeds:["character","boxer","terrier"]},
  {code:"PL",meaning:"Player for Life",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"RB",meaning:"Real Boss",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"RL",meaning:"Real Lover",gender:"boy",breeds:["lapdog","character","boxer","spaniel"]},
  {code:"SC",meaning:"Supreme Commander",gender:"boy",breeds:["character","boxer","bulldog"]},
  {code:"SG",meaning:"Street General",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"SK",meaning:"Supreme King",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"SL",meaning:"Smooth Lover",gender:"boy",breeds:["lapdog","character","boxer","spaniel"]},
  {code:"TB",meaning:"Top Boss",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"TG",meaning:"Top Gangster",gender:"boy",breeds:["character","boxer"]},
  {code:"TK",meaning:"The King",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"TL",meaning:"True Lover",gender:"boy",breeds:["lapdog","character","boxer","spaniel"]},
  {code:"TM",meaning:"Top Man",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"TR",meaning:"The Realest",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"YK",meaning:"Young King",gender:"boy",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  // ── UNIVERSAL -- any breed ────────────────────────────────────────────────
  {code:"DC",meaning:"Dream Chaser",gender:"any",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"DM",meaning:"Don't Miss",gender:"any",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"FL",meaning:"First Lady",gender:"girl",breeds:["lapdog","spaniel","retriever","poodle","boston","boxer","character","collie","greatdane","giant"]},
  {code:"GC",meaning:"Game Changer",gender:"any",breeds:["lapdog","spaniel","retriever","poodle","boxer","character","boston","collie","german","dachshund"]},
  {code:"GM",meaning:"Grand Master",gender:"boy",breeds:["poodle","collie","german","sniffer","retriever","spaniel"]},
  {code:"HK",meaning:"Hong Kong",gender:"any",breeds:["asian","character"]},
  {code:"LG",meaning:"Living Legend",gender:"any",breeds:["giant","sighthound","greatdane","collie","retriever"]},
  {code:"LM",meaning:"Living Legend",gender:"any",breeds:["giant","sighthound","greatdane"]},
  {code:"MVP",meaning:"Most Valued Player",gender:"any",breeds:["lapdog","spaniel","retriever","poodle","boston","boxer","character"]},
  {code:"QL",meaning:"Queen of Love",gender:"girl",breeds:["lapdog","spaniel","retriever","collie","sighthound"]},
  {code:"TC",meaning:"Top Cat",gender:"any",breeds:["lapdog","character","boston","asian"]},
  {code:"VIP",meaning:"Very Important Person",gender:"any",breeds:["lapdog","spaniel","retriever","poodle","sighthound","collie","giant","greatdane"]},
  // ── GIRL ABBREVIATIONS ────────────────────────────────────────────────
  {code:"QB",meaning:"Queen Boss",gender:"girl",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"QG",meaning:"Queen of the Game",gender:"girl",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"BQ",meaning:"Boss Queen",gender:"girl",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"DQ",meaning:"Drama Queen",gender:"girl",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"HQ",meaning:"Head Queen",gender:"girl",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"TQ",meaning:"Top Queen",gender:"girl",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"RQ",meaning:"Real Queen",gender:"girl",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"SQ",meaning:"Supreme Queen",gender:"girl",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"NQ",meaning:"No Question",gender:"girl",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"CQ",meaning:"Certified Queen",gender:"girl",breeds:["boxer","character","terrier","bulldog","boston","asian"]},
  {code:"GL",meaning:"Glamour Lady",gender:"girl",breeds:["lapdog","character","boxer","spaniel","boston","poodle"]},
  {code:"GQ",meaning:"Glamour Queen",gender:"girl",breeds:["lapdog","character","boxer","spaniel","boston","poodle"]},
  {code:"FG",meaning:"Fabulous Girl",gender:"girl",breeds:["lapdog","character","boxer","spaniel","boston","poodle"]},
  {code:"DG",meaning:"Dazzling Girl",gender:"girl",breeds:["lapdog","character","boxer","spaniel","boston","poodle"]},
  {code:"SG",meaning:"Superstar Girl",gender:"girl",breeds:["lapdog","character","boxer","spaniel","boston","poodle"]},
  {code:"IT",meaning:"It Girl",gender:"girl",breeds:["lapdog","character","boxer","spaniel","boston","poodle"]},
  {code:"BB",meaning:"Beautiful Boss",gender:"girl",breeds:["lapdog","character","boston","spaniel"]},
  {code:"CB",meaning:"Certified Beauty",gender:"girl",breeds:["lapdog","character","poodle","spaniel"]},
  {code:"PQ",meaning:"Pretty Queen",gender:"girl",breeds:["lapdog","spaniel","poodle"]},
  {code:"VIP",meaning:"Very Important Person",gender:"girl",breeds:["lapdog","spaniel","retriever","poodle","sighthound","collie","giant","greatdane"]},
  {code:"LG",meaning:"Living Legend",gender:"girl",breeds:["giant","sighthound","greatdane","collie","retriever"]},
  {code:"GM",meaning:"Grand Mistress",gender:"girl",breeds:["poodle","collie","german","sniffer","retriever","spaniel"]},
  {code:"Wg Cdr",meaning:"Wing Commander",gender:"girl",breeds:["spaniel","german","giant"]},
  {code:"Sqn Ldr",meaning:"Squadron Leader",gender:"girl",breeds:["spaniel","retriever","collie"]},
  {code:"Flt Lt",meaning:"Flight Lieutenant",gender:"girl",breeds:["collie","poodle","retriever"]},
  // ── POLICE RANKS ─────────────────────────────────────────────────────────
  {code:"PC",meaning:"Police Constable",gender:"boy",breeds:["boxer","retriever","default"]},
  {code:"DC",meaning:"Detective Constable",gender:"boy",breeds:["sniffer","default"]},
  {code:"DS",meaning:"Detective Sergeant",gender:"boy",breeds:["sniffer","default"]},
  {code:"DCI",meaning:"Detective Chief Inspector",gender:"boy",breeds:["sniffer","poodle"]},
  {code:"PCSO",meaning:"Police Community Support Officer",gender:"any",breeds:["character","terrier","boxer"]},
  {code:"Insp",meaning:"Inspector",gender:"boy",breeds:["sniffer","retriever"]},
  // ── ARMY RANKS ───────────────────────────────────────────────────────────,
  {code:"Cpl",meaning:"Corporal",gender:"boy",breeds:["boxer","retriever","german"]},
  {code:"Spr",meaning:"Sapper",gender:"boy",breeds:["terrier"]},
  {code:"Gnr",meaning:"Gunner",gender:"boy",breeds:["terrier","character","sniffer"]},
  {code:"Rfn",meaning:"Rifleman",gender:"boy",breeds:["sighthound","terrier"]},
  {code:"Gdsm",meaning:"Guardsman",gender:"boy",breeds:["spaniel","german"]},
  {code:"Tpr",meaning:"Trooper",gender:"boy",breeds:["sighthound","retriever"]},
  {code:"Brig",meaning:"Brigadier",gender:"boy",breeds:["spaniel","german","giant"]},
  // ── NAVY RANKS ───────────────────────────────────────────────────────────,
  {code:"PO",meaning:"Petty Officer",gender:"boy",breeds:["spaniel","retriever"]},
  // ── RAF RANKS ────────────────────────────────────────────────────────────
  {code:"Sqn Ldr",meaning:"Squadron Leader",gender:"boy",breeds:["spaniel","retriever","collie"]},
  {code:"Wg Cdr",meaning:"Wing Commander",gender:"boy",breeds:["spaniel","german","giant"]},
  {code:"Flt Lt",meaning:"Flight Lieutenant",gender:"boy",breeds:["collie","poodle","retriever"]},
  {code:"Plt Off",meaning:"Pilot Officer",gender:"boy",breeds:["collie","poodle"]}];

const DTRAIN_LETTERS  = ["D"];  // D for Dog -- always
const DTRAIN_SUFFIXES = ["Train","Prince","Money","King","Boss","Smooth","Real","Fresh","Young","Hype"];
const MARIEJ_FIRSTS  = ["Mary","Lisa","Rosa","Lola","Nina","Tina","Gina","Dina","Mona","Fiona","Cara","Sara","Nora","Cora","Vera","Zara","Kara","Lara","Myra","Lyra"];
const MARIEJ_INITIALS = "ABCDJKLMNRST".split("");

// ── RANDOM QUESTIONS ───────────────────────────────────────────────────────────
const QUESTION_BANK: { text: string; options: { label: string; bonus: string[] }[] }[] = [
  {
    text: "Where are you from?",
    options: [
      {label:"Down South", bonus:["Treacle","Sweetheart","Darling","Dear","Doll","Dollface","Poppet","Petal","Flower","Lovely","Babe","Babes","Guv","Sonny","Lover","Maid","MyLover","MyHandsome","MyBeauty"]},
      {label:"The Midlands", bonus:["Bab","Babby","Babs","OurKid","ArKid","Duck","Ducky","Duckie","Cock","Cocker","Chick","Chucky","Mucker","Youth","MeDuck","MyDuck"]},
      {label:"Up North", bonus:["Chuck","Chucky","Pet","Petal","Hinny","Marra","BonnyLad","BonnyLass","Lad","Lass","Kidda","Cock","Cocker","Flower","Love","Luv","Bairn"]},
      {label:"Scotland", bonus:["Hen","WeeHen","WeePal","Doll","Dollie","Dearie","Lassie","Laddie","Bairn","WeeYin","WeeMan","WeeLass","Bonny","Pal"]},
      {label:"Somewhere else", bonus:["Love","Luv","Darling","Dear","Pet","Petal","Sweetheart","Honey","Sugar","Babe","Flower","Pal","Mate","Duck","Lovely"]}
    ]
  },
  { text:"Do you like space?", options:[
    {label:"Yes",bonus:["Luna","Nova","Orion","Astro","Astrid","Comet","Nebula","Aurora","Cassiopeia","Cosmo","Cosimo","Galileo","Kepler","Eclipse","Stellar","Vega","Lyra","Polaris","Orbit","Cosmos","Titan","Atlas","Jupiter","Saturn","Darkstar","Moonbeam","Stardust","Celestia","Lunaris","Astra","Solaris","Quasar","Pulsar"]},
    {label:"No", bonus:["Biscuit","Pudding","Treacle","Custard","Gravy","Crumble","Sausage","Dumpling","Wobble"]},
  ]},
  { text:"Do you enjoy smells?", options:[
    {label:"Yes",bonus:["Jasmine","Heather","Sage","Basil","Clover","Juniper","Cedar","Sorrel","Flora","Lavender","Mint","Rosemary","Thyme","Blossom"]},
    {label:"No", bonus:["Flint","Stone","Slate","Steel","Grit","Iron","Chrome","Cinder","Concrete"]},
  ]},
  { text:"Are you a morning person?", options:[
    {label:"Yes",bonus:["Dawn","Sparky","Sunny","Breezy","Zippy","Perky","Dewy","Lark","Robin","Crisp","Chipper","Bright","Fresh"]},
    {label:"No", bonus:["Midnight","Vesper","Luna","Eclipse","Nocturne","Raven","Shadow","Dusk","Twilight","Phantom","Slumber","Mellow"]},
  ]},
  { text:"Have you ever talked to a plant?", options:[
    {label:"Yes",bonus:["Fern","Ivy","Willow","Daisy","Skye","Moss","Briar","Bloom","Rowan","Clover","Hazel","Birch","Cedar","Ash","Bramble"]},
    {label:"No", bonus:["Brick","Steel","Chrome","Concrete","Gravel","Slate","Cinder","Iron"]},
  ]},
  { text:"Have you ever worn a onesie in public?", options:[
    {label:"Yes",bonus:["Snugglebum","Fluffy","Booboo","Fifi","Mimi","Puddingkins","Lulu","Noo-Noo","Cuddlekins","Fluffybum","Jellybean","Candyfloss","Tiddlywink"]},
    {label:"No", bonus:["Dapper","Debonair","Suave","Sharp","Immaculate","Sterling","Pristine","Sleek","Trim","Tailored"]},
  ]},
  { text:"Do you believe in ghosts?", options:[
    {label:"Yes",bonus:["Ghost","Shadow","Phantom","Midnight","Eclipse","Misty","Spectre","Vesper","Wraith","Shade","Spirit","Wisp","Echo","Mist","Void"]},
    {label:"No", bonus:["Solid","Grounded","Flint","Stone","Anchor","Boulder","Bedrock","Steadfast","Grit","Granite"]},
  ]},
  { text:"Do you take sugar in your tea?", options:[
    {label:"Yes",bonus:["Honey","Toffee","Fudge","Caramel","Treacle","Sherbet","Bonbon","Butterscotch","Jellybean","Gumdrop","Sweetpea","Syrup","Custard","Pudding","Lollipop"]},
    {label:"No", bonus:["Bitter","Tonic","Brisk","Sharp","Crisp","Earl","Assam","Pekoe","Darjeeling"]},
  ]},
  { text:"Do you like myths and legends?", options:[
    {label:"Yes",bonus:["Orpheus","Perseus","Achilles","Heracles","Theseus","Ajax","Odysseus","Circe","Phoenix","Griffin","Merlin","Lancelot","Morgan","Oberon","Avalon","Medusa","Pegasus","Icarus","Apollo","Artemis"]},
    {label:"No", bonus:["Norman","Derek","Keith","Brian","Barry","Colin","Basil","Kevin","Biscuit","Custard"]},
  ]},
  { text:"Sugar or salt?", options:[
    {label:"Sugar",bonus:["Honey","Fudge","Caramel","Toffee","Treacle","Butterscotch","Sherbet","Bonbon","Mellow","Syrup","Candy","Nectar","Praline"]},
    {label:"Salt", bonus:["Brine","Flint","Gravel","Sharp","Crisp","Gruff","Stone","Slate","Tonic","Crag","Grit","Granite","Rust"]},
  ]},
  { text:"Autumn or summer?", options:[
    {label:"Autumn",bonus:["Amber","Russet","Conker","Chestnut","Bramble","Hazel","Harvest","Ember","Copper","Acorn","Tawny","Sienna","Cinnamon","Mist","Dusk"]},
    {label:"Summer",bonus:["Sunny","Blaze","Sandy","Breeze","Dazzle","Shimmer","Freckle","Goldie","Honey","Wildflower","Surf","Coral","Azure","Radiant","Glow","Lemon"]},
  ]},
  { text:"How many sides does a circle have?", options:[
    {label:"None",bonus:["Ace","Boss","Stone","Flint","Blade","Steel","Iron","Frost","Sharp","Crisp","Direct","Decisive","Clean","Bolt"]},
    {label:"One", bonus:["Infinite","Spiral","Orbit","Cycle","Curve","Eternal","Continuum","Loop","Cosmos","Omega","Zen","Endless","Void","Paradox"]},
  ]},
  { text:"Tea or coffee?", options:[
    {label:"Tea",   bonus:["Earl","Darjeeling","Assam","Oolong","Chamomile","Pekoe","Brew","Steep","Mellow","Proper","Crumpet","Scone","Biscuit"]},
    {label:"Coffee",bonus:["Espresso","Cortado","Arabica","Mocha","Crema","Grind","Press","Dark","Roast","Intense","Robust","Bold","Bitter","Jet"]},
  ]},
  { text:"Would you rather be invisible or fly?", options:[
    {label:"Invisible",bonus:["Ghost","Shadow","Phantom","Spectre","Wraith","Shade","Mist","Wisp","Echo","Blur","Fade","Smoke"]},
    {label:"Fly",      bonus:["Falcon","Hawk","Eagle","Icarus","Pegasus","Cloud","Nimbus","Soar","Glide","Swift","Dart","Streak","Apex"]},
  ]},
  { text:"Night owl or early bird?", options:[
    {label:"Night owl",  bonus:["Midnight","Vesper","Luna","Eclipse","Nocturne","Raven","Shadow","Dusk","Twilight","Phantom","Sable","Noir","Obsidian","Onyx"]},
    {label:"Early bird", bonus:["Dawn","Lark","Robin","Crisp","Dewy","Sparky","Sunny","Chirpy","Bright","Breezy","Perky","Glow","Fresh","Zippy"]},
  ]},
  { text:"Are you cool?", options:[
    {label:"Yes",bonus:["Ace","Slick","Smooth","Ice","Frost","Suave","Sharp","Dapper","Blade","Shadow","Chrome","Silk","Velvet","Steel","Noir"]},
    {label:"No", bonus:["Goofy","Doofus","Dingbat","Goofball","Wonky","Doolally","Bumbly","Topsy","Wibble","Clumsy","Wobble","Bumble","Scatty"]},
  ]},
  { text:"Are you a nerd?", options:[
    {label:"Yes",bonus:["Kepler","Copernicus","Turing","Pascal","Euler","Archimedes","Pythagoras","Worf","Spock","Data","Hubble","Fibonacci","Bohr","Lovelace"]},
    {label:"No", bonus:["Maverick","Rebel","Wildcard","Outlaw","Renegade","Rogue","Hotshot","Bandit","Flash","Blaze","Bolt","Rocket","Dash"]},
  ]},
  { text:"Do you make your bed in the morning?", options:[
    {label:"Yes",bonus:["Pristine","Crisp","Sterling","Proper","Immaculate","Dapper","Sharp","Composed","Prim","Trim","Precise","Neat","Buff"]},
    {label:"No", bonus:["Rumple","Tumble","Shambles","Chaos","Muddle","Scruffy","Slouch","Sprawl","Tangle","Topple","Wobble","Raggle","Jumble"]},
  ]},
  { text:"Do you read the terms and conditions?", options:[
    {label:"Yes",bonus:["Prudence","Constance","Diligent","Earnest","Steadfast","Thorough","Scholar","Counsel","Careful","Measured","Exact","Vigilant"]},
    {label:"No", bonus:["Maverick","Reckless","Wildcard","Rogue","Rebel","Outlaw","Carefree","Breezy","Blithe","Nonchalance","Audacious","Brazen"]},
  ]},
  { text:"New book -- break the spine?", options:[
    {label:"Yes",bonus:["Battered","Beloved","Weathered","Story","Chapter","Thumbed","Worn","Creased","Dogear","Tattered","Frayed","Loved"]},
    {label:"No", bonus:["Pristine","Ivory","Pearl","Gilt","Vellum","Parchment","Folio","Lacquer","Crisp","Mint","Immaculate"]},
  ]},
  { text:"Reply to texts immediately?", options:[
    {label:"Yes",bonus:["Swift","Prompt","Flash","Zip","Dart","Ready","Alert","Keen","Sprightly","Rapid","Instant","Snappy","Brisk"]},
    {label:"No", bonus:["Languid","Aloof","Nonchalance","Glaciale","Unhurried","Mellow","Drift","Mosey","Saunter","Laze","Meander"]},
  ]},
  { text:"Do you eat the crusts?", options:[
    {label:"Yes",bonus:["Sturdy","Grit","Solid","Wholesome","Hearty","Stalwart","Steadfast","Biscuit","Dependable","Robust","Trusty","Stout"]},
    {label:"No", bonus:["Delicate","Dainty","Precious","Refined","Particular","Fussy","Finicky","Petite","Prim","Gentle","Soft","Tender"]},
  ]},
  { text:"Ketchup -- fridge or cupboard?", options:[
    {label:"Fridge",   bonus:["Chilled","Crisp","Precise","Measured","Exact","Rigorous","Rational","Careful","Scientific","Correct","Orderly"]},
    {label:"Cupboard", bonus:["Instinct","Bold","Brazen","Fearless","Reckless","Maverick","Audacious","Daring","Bravado","Gutsy","Rogue","Defiant"]},
  ]},
  { text:"Escalator -- walk or stand?", options:[
    {label:"Walk",  bonus:["Rocket","Dash","Sprint","Bolt","Charge","Hustle","Drive","Momentum","Relentless","Surge","Blaze","Flash","Rapid"]},
    {label:"Stand", bonus:["Repose","Mellow","Saunter","Drift","Amble","Mosey","Languid","Unhurried","Serene","Composed","Placid","Still","Calm"]},
  ]},
  { text:"Party -- kitchen or dance floor?", options:[
    {label:"Kitchen",     bonus:["Sage","Thoughtful","Ember","Hearth","Warmth","Steady","Quiet","Considered","Mellow","Grounded","Earnest"]},
    {label:"Dance floor", bonus:["Showtime","Dazzle","Shimmy","Foxtrot","Sashay","Tango","Boogie","Ziggy","Sparkle","Strut","Glitter","Flash"]},
  ]},
  { text:"Rehearse conversations in your head?", options:[
    {label:"Yes",bonus:["Considered","Measured","Ponder","Ruminate","Reflect","Muse","Contemplate","Deliberate","Thoughtful","Nuanced","Meticulous"]},
    {label:"No", bonus:["Blurt","Spark","Candid","Frank","Brash","Forthright","Bold","Direct","Unfiltered","Raw","Spontaneous","Impulsive"]},
  ]},
  { text:"Do you believe in luck?", options:[
    {label:"Yes",bonus:["Lucky","Fortune","Charm","Clover","Wishbone","Serendipity","Kismet","Fate","Fortuna","Star","Chance","Destiny","Omen"]},
    {label:"No", bonus:["Grit","Hustle","Grind","Steel","Forge","Drive","Muscle","Tenacity","Earn","Build","Craft","Toil","Persist","Relentless"]},
  ]},
  { text:"Windows or Mac?", options:[
    {label:"Windows",bonus:["Pixel","Glitch","Buffer","Crash","Reboot","Patch","Clippy","Loading","Freeze","Spinner","Update","Error"]},
    {label:"Mac",    bonus:["Retina","Safari","Sleek","Minimal","Studio","Render","Siri","Fusion","Carbon","Silicon","Spotlight","Aluminium"]},
  ]},
  { text:"Are you a good dancer?", options:[
    {label:"Yes",bonus:["Foxtrot","Tango","Waltz","Sashay","Shimmy","Twirl","Glide","Pirouette","Boogie","Strut","Salsa","Rumba","Swing","Jive"]},
    {label:"No", bonus:["Lumber","Shuffle","Plod","Stumble","Wobble","Trundle","Sway","Stomp","Clump","Blunder","Flail","Lurch","Stagger"]},
  ]},
  { text:"When did you last call your mother?", options:[
    {label:"Recently",     bonus:["Loyal","Faithful","Devoted","True","Steadfast","Beloved","Darling","Treasure","Precious","Cherished","Noble","Gallant"]},
    {label:"Not recently", bonus:["Rogue","Rebel","Outlaw","Maverick","Renegade","Wildcard","Trouble","Chaos","Rascal","Scamp","Scoundrel","Vagabond"]},
  ]},
  { text:"What music moves you?", options:[
    {label:"Classic / Jazz",    bonus:["Sinatra","Ella","Billie","Miles","Duke","Dizzy","Satchmo","Monk","Coltrane","Armstrong","Holiday"]},
    {label:"Rock / Indie",      bonus:["Bowie","Jagger","Lennon","Hendrix","Cobain","Strummer","Iggy","Lemmy","Morrissey","Ziggy","Riff","Thunder"]},
    {label:"Pop",               bonus:["Presley","Freddie","Elton","George","Prince","Kylie","Adele","Showtime","Glitter","Dazzle","Sparkle"]},
    {label:"Hip Hop / R&B",     bonus:["Ghost","Shadow","Ice","Smooth","Phantom","Ace","Blaze","Hustle","Flex","Drip","Hype","Vibe","Wave"]},
    {label:"Country",           bonus:["Dolly","Hank","Waylon","Willie","Cash","Loretta","Patsy","Emmylou","Harvest","Dusty","Rusty","Prairie"]},
    {label:"Electronic / Dance",bonus:["Moby","Orbital","Prodigy","Massive","Tricky","Bass","Pulse","Beat","Rhythm","Tempo","Sync","Surge"]},
    {label:"Metal",             bonus:["Ozzy","Lemmy","Dio","Riff","Thunder","Havoc","Chaos","Rampage","Iron","Steel","Blade","Hammer","Fury"]},
    {label:"Classical",         bonus:["Mozart","Bach","Handel","Vivaldi","Chopin","Liszt","Mahler","Brahms","Elgar","Purcell","Cadence","Forte"]},
  ]},
  { text:"Favourite pizza?", options:[
    {label:"Margherita", bonus:["Pearl","Ivory","Simple","Pure","Classic","Refined","Elegant","Clean","Minimal","Pristine","Delicate","Noble"]},
    {label:"Pepperoni",  bonus:["Biscuit","Buddy","Champ","Sunny","Lucky","Faithful","Happy","Reliable","Steady","True","Trusty","Solid","Warm"]},
    {label:"Meat feast", bonus:["Boss","Havoc","Chaos","Thunder","Blaze","Savage","Titan","Goliath","Maximus","Beast","Rampage","Fury","Brute"]},
    {label:"Vegetarian", bonus:["Flora","Basil","Sage","Clover","Bloom","Meadow","Willow","Fern","Ivy","Petal","Briar","Moss","Leaf","Blossom"]},
    {label:"Hawaiian",   bonus:["Maverick","Wildcard","Renegade","Rebel","Outlaw","Bonkers","Doolally","Chaos","Rogue","Breezy","Carefree","Bold"]},
  ]},
];

function pickOneQuestion(seed: number): number {
  const t = Date.now() & 0x7fffffff;
  return Math.abs((seed ^ t) % QUESTION_BANK.length);
}
// ── REGISTER TYPES ─────────────────────────────────────────────────────────────
type DogColour = "black"|"white"|"brown"|"red"|"golden"|"grey"|"blue"|"spotted"|"";

type Register = "grand"|"mundane"|"chaos"|"baby"|"absurd"|"nature"|"ironic"|"aloof"|"food"|"pop"|"informal"|"pedigree";

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
  pop:      { grand:3, mundane:2, baby:2, chaos:2, absurd:2, informal:2, ironic:2, aloof:1, nature:1, food:1, pop:1, pedigree:2 },
  pedigree: { grand:1, mundane:3, chaos:5, baby:5, food:4, absurd:4, ironic:3, informal:3, aloof:2, nature:2, pop:2, pedigree:1 },
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

function scoreName(title: TitleEntry, first: NameEntry, dogWord: WordEntry, surname: string, colour: DogColour = "", group = ""): number {
  let score = 0;

  // ── CONTRAST (unchanged) ──────────────────────────────────────────────────
  score += contrastScore(title.reg, first.reg);
  score += contrastScore(first.reg, dogWord.reg);

  // ── ALLITERATION (heavily weighted -- the engine of comedy) ──────────────
  const fl = first.name[0].toLowerCase();
  const wl = dogWord.word[0].toLowerCase();
  const sl = surname.replace(/-.*/, "")[0]?.toLowerCase() ?? ""; // base surname initial
  const sf: Record<string,string> = {
    b:"labial",p:"labial",m:"labial",w:"labial",
    d:"dental",t:"dental",n:"dental",
    g:"velar",k:"velar",q:"velar",c:"velar",
    f:"fric",v:"fric",
    s:"sib",z:"sib",x:"sib",
    l:"liquid",r:"liquid",
    h:"glide",
  };
  const sf2: Record<string,string> = {
    m:"nasal",n:"nasal",s:"sstop",t:"sstop",p:"sstop",k:"sstop",
    g:"growl",b:"growl",d:"growl",r:"growl",w:"glide2",h:"glide2",
  };

  // ── Surname participation in alliteration ──────────────────────────────────
  // Does the surname initial join the alliteration chain?
  const surnameInChain = sl !== "" && (sl === fl || sl === wl || (sf[sl] && sf[sl] === sf[fl]));
  const surnameClashes  = sl !== "" && sl !== fl && sl !== wl && !(sf[sl] && sf[sl] === sf[fl]);

  // First name <-> dog word alliteration (core comedy unit)
  // Amplified when surname joins, penalised when surname clashes
  if (fl === wl) {
    if (surnameInChain)  score += 7;  // name+word+surname all rhyme -- maximum
    else if (surnameClashes) score += 3;  // name+word rhyme but surname breaks it
    else score += 5;  // name+word rhyme, neutral surname
  } else if (sf[fl] && sf[fl] === sf[wl]) {
    score += surnameInChain ? 3 : 2;  // sound-family match
  }

  // Title initial <-> first name
  const tf = title.title.replace(/^(Lil'|Ol'|Wee|Baby|Little|Daft|Cheeky|Silly|Scruffy|Fluffy|Grumpy|Noisy)\s/,"")[0]?.toLowerCase() ?? "";
  if (tf === fl) score += 3;

  // Triple alliteration: title + name + dog word
  if (fl === wl && tf === fl) score += 4;

  // Surname alliteration bonus: dog word matches surname
  if (wl === sl && sl !== "") score += 2;

  // Surname matches first name too
  if (fl === sl && sl !== "") score += 1;

  // Full four-way: title + name + dogword + surname
  if (tf === fl && fl === wl && wl === sl) score += 3;  // bumped from 2 to 3

  // ── RHYTHM ────────────────────────────────────────────────────────────────
  const total = title.syllables + first.syllables + 1 + countSyllables(surname);
  if (total >= 5 && total <= 9) score += 4;
  else if (total >= 3 && total <= 12) score += 2;

  // ── SHORT PUNCHY NAMES score higher ───────────────────────────────────────
  if (first.syllables <= 2) score += 3;
  else if (first.syllables <= 3) score += 2;
  else if (first.syllables <= 4) score += 1;

  // ── COLOUR BONUS ──────────────────────────────────────────────────────────
  score += colourScore(first.name, colour as DogColour);

  // ── FOOD/CHAOS FIRST NAME BONUS ───────────────────────────────────────────
  if (first.reg === "food" && first.syllables <= 2) score += 2;
  if (first.reg === "chaos" && first.syllables <= 2) score += 1;

  // ── PENALISE grand title on baby/food when dog word already contrasts ─────
  if (title.reg === "grand" && (first.reg === "baby" || first.reg === "food") && first.syllables <= 2) {
    const dogContrast = contrastScore(first.reg, dogWord.reg);
    if (dogContrast >= 3) score -= 2;
  }

  // ── PENALISE stacked compound titles (e.g. "Chief Inspector" + grand name) ─
  // Multi-word titles are already grand -- pairing with another grand name = pompous not funny
  if (title.title.includes(" ") && first.reg === "grand") score -= 3;
  if (title.title.includes(" ") && first.reg === "pedigree") score -= 1;


    // ── Lapdog-only baby names penalised on other breeds ────────────────────────
    const lapdogOnlyNames = new Set(["Babbycakes","Booboo","Bubbly","Cupcake","Fluffybum","Lulu","Smooshface","Squishface"]);
    if (lapdogOnlyNames.has(first.name) && group !== "lapdog" && group !== "labradoodle") score -= 8;

    // ── Penalise first name = dog word (Lurk Lurk, Tumble Tumble) ──────────────
    if (first.name.toLowerCase() === dogWord.word.toLowerCase()) score -= 8;

    // ── Penalise title = first name (Sultan Sultan, Sifu Sifu) ─────────────────
    if (title.title.toLowerCase() === first.name.toLowerCase()) score -= 8;
    const titleFirstWord = title.title.split(" ")[0].toLowerCase();
    if (titleFirstWord.length > 2 && first.name.toLowerCase().startsWith(titleFirstWord)) score -= 5;

    // ── Penalise title word echoing dog word (Fluffy...Fluff = tautology) ──────
    const titleStem = title.title.toLowerCase().replace(/y$/,"").replace(/ly$/,"").slice(0,4);
    const wordStem  = dogWord.word.toLowerCase().slice(0,4);
    if (titleStem.length >= 3 && titleStem === wordStem) score -= 4;


  // ── CAP alliteration bonus at +12 to prevent runaway inflation ──────────────
  const rawAllit = score; // score so far is mostly alliteration + contrast
  // (cap applied implicitly by not letting alliteration-only names dominate)

  // ── CHARACTER BONUS -- levels the field for non-alliterative names ──────────
  // Alliteration gives +14 free points. Non-alliterative names need a boost
  // when they earn their place through contrast and real character instead.
  const hasStrongAllit = first.name[0]?.toLowerCase() === dogWord.word[0]?.toLowerCase();
  const regContrast = contrastScore(title.reg, first.reg);
  const isRealName = ["mundane","grand","pedigree","nature"].includes(first.reg);
  const titleIsIronic = ["ironic","absurd"].includes(title.reg);
  // Ironic titles (Notorious, Legendary) + real names also earn the levelling bonus
  const earnBonus = !hasStrongAllit && (isRealName || (titleIsIronic && first.reg === "mundane"));
  if (earnBonus) {
    // Base levelling bonus -- closes the gap with alliterative names
    if (regContrast >= 4) score += 5;
    else if (regContrast >= 3) score += 3;
    // Extra for strong contrast + short punchy name
    if (regContrast >= 5 && first.syllables <= 2) score += 3;
    else if (regContrast >= 4 && first.syllables <= 3) score += 2;
    // Grand title + real mundane name is always a good combo
    if (first.reg === "mundane" && first.syllables <= 2 && title.reg === "grand") score += 2;
    if (first.reg === "pedigree" && !first.name.includes(" ")) score += 2;
  } else if (!earnBonus) {
    // Already alliterating -- tiny boost only for 1-syllable contrast punch
    if (regContrast >= 5 && first.syllables === 1) score += 1;
  }

  // ── QUALITY FILTER -- breed character check ───────────────────────────────
  const dignifiedGroups = new Set(["collie","retriever","sighthound","german","spaniel",
    "giant","afghan","poodle","sniffer","greatdane","welsh","dalmatian","sheepdog","lurcher"]);
  const whimsyPattern = /paws|bean|boots|puff|whisk|wick|wink|snout|chops|bonce|flap|wiggle|wobble|bumble|scramble|grumble|noodle|puddle|doodle|fizzle|jiggle|toodle|mumble|rumble/i;
  const isDignified = dignifiedGroups.has(group);
  // Penalise whimsy compound names on dignified breeds
  if (isDignified && whimsyPattern.test(first.name)) score -= 8;
  // Penalise chaos-register first names on dignified breeds
  if (isDignified && first.reg === "chaos" && first.syllables > 2) score -= 5;
  // Penalise long two-word pedigree names that clutter (e.g. "Bold Ambition Bolt-Barker")
  if (first.name.includes(" ") && first.name.length > 10 && isDignified) score -= 3;
  // Bonus for short real-looking names on any breed
  if (/^[A-Z][a-z]{1,7}$/.test(first.name)) score += 2;
  // Penalise very long compound whimsy names anywhere
  if (whimsyPattern.test(first.name) && first.name.length > 12) score -= 3;
    // Cartoon-character names -- only work with Dawg as dog word, or chaos/baby title
    const cartoonOnlyWithDawg = new Set(["Tubby","Pudgy","Porky","Wimpy","Doofus","Nincompoop","Scraggy"]);
    if (cartoonOnlyWithDawg.has(first.name)) {
      if (dogWord.word === "Dawg") score += 5;  // perfect match -- Porky Dawg-Jones
      else if (["chaos","baby"].includes(title.reg)) score += 1;  // tolerable with silly title
      else score -= 4;  // penalise -- Baron Tubby Wobble-Harris is wrong register
    }

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
  spaniel:    [{title:"Field Marshal",reg:"grand",syllables:3},{title:"General",reg:"grand",syllables:3},{title:"Admiral",reg:"grand",syllables:3},{title:"Brigadier",reg:"grand",syllables:3},{title:"Colonel",reg:"grand",syllables:2},{title:"Inspector",reg:"grand",syllables:3},{title:"Chief Inspector",reg:"grand",syllables:4},{title:"Ch.",reg:"grand",syllables:1}],
  // Retrievers / Labs -- guide dogs, detection dogs, civic service
  retriever:  [{title:"Commissioner",reg:"grand",syllables:4},{title:"Chief Inspector",reg:"grand",syllables:4},{title:"Inspector",reg:"grand",syllables:3},{title:"Judge",reg:"grand",syllables:1},{title:"Colonel",reg:"grand",syllables:2},{title:"Major",reg:"grand",syllables:2},{title:"Ch.",reg:"grand",syllables:1}],
  // German Shepherd / Doberman / Rottweiler / Weimaraner -- military working dogs
  german:     [{title:"Emperor",reg:"grand",syllables:4},{title:"Colonel",reg:"grand",syllables:2},{title:"Major",reg:"grand",syllables:2},{title:"Captain",reg:"grand",syllables:2},{title:"Sergeant Major",reg:"grand",syllables:4},{title:"General",reg:"grand",syllables:3}],
  // Collies -- intelligence not brawn
  collie:     [{title:"Professor",reg:"grand",syllables:3},{title:"Doctor",reg:"grand",syllables:2},{title:"Chief Analyst",reg:"grand",syllables:4},{title:"Commissioner",reg:"grand",syllables:4}],
  // Boxer / Staffie / Bull Terrier -- street respect, civic pomp
  boxer:      [{title:"Sergeant",reg:"grand",syllables:2},{title:"Sir",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Right Honourable",reg:"grand",syllables:4},{title:"Corporal",reg:"grand",syllables:3}],
  // Sniffer dogs -- detectives
  sniffer:    [{title:"Inspector",reg:"grand",syllables:3},{title:"Chief Inspector",reg:"grand",syllables:4},{title:"Commissioner",reg:"grand",syllables:4},{title:"Judge",reg:"grand",syllables:1},{title:"DCI",reg:"grand",syllables:3},{title:"DS",reg:"grand",syllables:2},{title:"Ch.",reg:"grand",syllables:1}],
  // Sighthounds -- pure aristocracy
  afghan:     [{title:"Khan",reg:"grand",syllables:1},{title:"Nawab",reg:"grand",syllables:2},{title:"Sultan",reg:"grand",syllables:2},{title:"Amir",reg:"grand",syllables:2},{title:"Duke",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Malik",reg:"grand",syllables:2}],
  sighthound: [{title:"Duke",reg:"grand",syllables:1},{title:"Earl",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Sir",reg:"grand",syllables:1},{title:"Viscount",reg:"grand",syllables:2},{title:"Baron",reg:"grand",syllables:2},{title:"Ch.",reg:"grand",syllables:1}],
  greatdane:  [{title:"Emperor",reg:"grand",syllables:4},{title:"Commander",reg:"grand",syllables:3},{title:"Admiral",reg:"grand",syllables:3},{title:"General",reg:"grand",syllables:3},{title:"Captain",reg:"grand",syllables:2},{title:"Commodore",reg:"grand",syllables:3},{title:"Duke",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Magnificent",reg:"grand",syllables:4},{title:"Legendary",reg:"grand",syllables:4},{title:"Unstoppable",reg:"grand",syllables:4}],
  // Giants -- scale demands grandeur
  giant:      [{title:"Emperor",reg:"grand",syllables:4},{title:"Magnificent",reg:"grand",syllables:4},{title:"Formidable",reg:"grand",syllables:4},{title:"Legendary",reg:"grand",syllables:4},{title:"Great",reg:"grand",syllables:1},{title:"Duke",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1}],
  // Poodle -- academic only
  poodle:     [{title:"Professor",reg:"grand",syllables:3},{title:"Doctor",reg:"grand",syllables:2},{title:"Chief Analyst",reg:"grand",syllables:4}],
  // Lapdog -- ecclesiastical pomp
  lapdog:     [{title:"Reverend",reg:"grand",syllables:3},{title:"Archdeacon",reg:"grand",syllables:3},{title:"Sir",reg:"grand",syllables:1}],
  // Bulldog specifically -- Churchill energy
  bulldog:    [{title:"Sir",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Right Honourable",reg:"grand",syllables:4},{title:"Field Marshal",reg:"grand",syllables:3}],
  boston:     [{title:"Commissioner",reg:"grand",syllables:4},{title:"Alderman",reg:"grand",syllables:3},{title:"Senator",reg:"grand",syllables:3},{title:"Colonel",reg:"grand",syllables:2},{title:"Judge",reg:"grand",syllables:1},{title:"Captain",reg:"grand",syllables:2},{title:"Boss",reg:"grand",syllables:1},{title:"Chief",reg:"grand",syllables:1},{title:"Major",reg:"grand",syllables:2},{title:"Sheriff",reg:"grand",syllables:2},{title:"Marshal",reg:"grand",syllables:2},{title:"Commodore",reg:"grand",syllables:3}],
  asian:      [
  {title:"Hong Kong",reg:"grand",syllables:3},
  {title:"Sifu",reg:"grand",syllables:2},
  {title:"Sensei",reg:"grand",syllables:2},
  {title:"Shifu",reg:"grand",syllables:2},
  {title:"Shogun",reg:"grand",syllables:2},
  {title:"Samurai",reg:"grand",syllables:3},
  {title:"Ninja",reg:"grand",syllables:2},
  {title:"Ronin",reg:"grand",syllables:2},
  {title:"Master",reg:"grand",syllables:2},
  {title:"Grand Master",reg:"grand",syllables:3},
  {title:"Dragon",reg:"grand",syllables:2},
  {title:"Emperor",reg:"grand",syllables:4},
  {title:"Notorious",reg:"grand",syllables:4},
  {title:"Incomparable",reg:"grand",syllables:5}
],
  // Character breeds -- self-appointed grandeur
  character:  [{title:"Notorious",reg:"grand",syllables:4},{title:"Incomparable",reg:"grand",syllables:5},{title:"Baron",reg:"grand",syllables:2}],
  // Gentry -- Dalmatian, OES etc
  gentry:     [{title:"Viscount",reg:"grand",syllables:2},{title:"Baron",reg:"grand",syllables:2},{title:"Right Honourable",reg:"grand",syllables:4},{title:"Lord",reg:"grand",syllables:1},{title:"Sir",reg:"grand",syllables:1}],
  // Dachshund -- absurdly self-important
  dachshund:  [{title:"Notorious",reg:"grand",syllables:4},{title:"Incomparable",reg:"grand",syllables:5},{title:"Field Marshal",reg:"grand",syllables:3},{title:"General",reg:"grand",syllables:3}],
  welsh:      [{title:"Prince",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Sir",reg:"grand",syllables:1},{title:"Baron",reg:"grand",syllables:2},{title:"Archdruid",reg:"grand",syllables:3},{title:"Bard",reg:"grand",syllables:1},{title:"Captain",reg:"grand",syllables:2},{title:"Sergeant",reg:"grand",syllables:2},{title:"Inspector",reg:"grand",syllables:3},{title:"Mr",reg:"mundane",syllables:1}],
  default:    [{title:"Sir",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Inspector",reg:"grand",syllables:3},{title:"Baron",reg:"grand",syllables:2}],
  dalmatian:  [{title:"Lord",reg:"grand",syllables:1},{title:"Sir",reg:"grand",syllables:1},{title:"Baron",reg:"grand",syllables:2},{title:"Viscount",reg:"grand",syllables:2},{title:"Major",reg:"grand",syllables:2}],
  sheepdog:   [{title:"Professor",reg:"grand",syllables:3},{title:"Doctor",reg:"grand",syllables:2},{title:"Sir",reg:"grand",syllables:1},{title:"Baron",reg:"grand",syllables:2}],
  lurcher:    [{title:"Mr",reg:"mundane",syllables:1},{title:"The Legendary",reg:"grand",syllables:4},{title:"Sir",reg:"grand",syllables:1}],
};

const GIRL_TITLES: Record<string, TitleEntry[]> = {
  terrier:    [{title:"Miss",reg:"mundane",syllables:1}],
  spaniel:    [{title:"Dame",reg:"grand",syllables:1},{title:"Lady",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Duchess",reg:"grand",syllables:2},{title:"Viscountess",reg:"grand",syllables:3},{title:"Marchioness",reg:"grand",syllables:3},{title:"Queen",reg:"grand",syllables:1},{title:"Grand Duchess",reg:"grand",syllables:3},{title:"Princess",reg:"grand",syllables:3},{title:"Tsarina",reg:"grand",syllables:3},{title:"Kaiserin",reg:"grand",syllables:3}],
  retriever:  [{title:"Dame",reg:"grand",syllables:1},{title:"Lady",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Viscountess",reg:"grand",syllables:3},{title:"Baroness",reg:"grand",syllables:3},{title:"Queen",reg:"grand",syllables:1},{title:"Princess",reg:"grand",syllables:3},{title:"Matriarch",reg:"grand",syllables:3},{title:"Maharani",reg:"grand",syllables:4}],
  german:     [{title:"Countess",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Baroness",reg:"grand",syllables:3},{title:"Lady",reg:"grand",syllables:2},{title:"Kaiserin",reg:"grand",syllables:3},{title:"Tsarina",reg:"grand",syllables:3},{title:"Empress",reg:"grand",syllables:3},{title:"Grand Duchess",reg:"grand",syllables:3},{title:"Valkyrie",reg:"grand",syllables:3},{title:"Warrior Queen",reg:"grand",syllables:4},{title:"Shieldmaiden",reg:"grand",syllables:3}],
  greatdane:  [{title:"Empress",reg:"grand",syllables:3},{title:"Cosmic Queen",reg:"grand",syllables:4},{title:"Star Queen",reg:"grand",syllables:3},{title:"Moon Queen",reg:"grand",syllables:3},{title:"Goddess",reg:"grand",syllables:2},{title:"Titaness",reg:"grand",syllables:3},{title:"Magnificent",reg:"grand",syllables:4},{title:"Legendary",reg:"grand",syllables:4},{title:"Tsarina",reg:"grand",syllables:3},{title:"Valkyrie",reg:"grand",syllables:3},{title:"Duchess",reg:"grand",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Celestia",reg:"grand",syllables:4}],
  collie:     [{title:"Professor",reg:"grand",syllables:3},{title:"Doctor",reg:"grand",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Queen",reg:"grand",syllables:1},{title:"Matriarch",reg:"grand",syllables:3},{title:"Oracle",reg:"grand",syllables:3},{title:"Huntress",reg:"grand",syllables:2}],
  boxer:      [{title:"Dame",reg:"grand",syllables:1},{title:"Lady",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Right Honourable",reg:"grand",syllables:4}],
  sniffer:    [{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Countess",reg:"grand",syllables:2},{title:"Doctor",reg:"grand",syllables:2},{title:"Duchess",reg:"grand",syllables:2},{title:"Baroness",reg:"grand",syllables:3}],
  afghan:     [{title:"Begum",reg:"grand",syllables:2},{title:"Bibi",reg:"grand",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Duchess",reg:"grand",syllables:2},{title:"Sultana",reg:"grand",syllables:3},{title:"Ranee",reg:"grand",syllables:2}],
  sighthound: [{title:"Duchess",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Viscountess",reg:"grand",syllables:3},{title:"Baroness",reg:"grand",syllables:3},{title:"Marchioness",reg:"grand",syllables:3},{title:"Queen",reg:"grand",syllables:1},{title:"Princess",reg:"grand",syllables:3},{title:"Maharani",reg:"grand",syllables:4},{title:"Rani",reg:"grand",syllables:2},{title:"Tsarina",reg:"grand",syllables:3},{title:"Valkyrie",reg:"grand",syllables:3},{title:"Regina",reg:"grand",syllables:3},{title:"Reina",reg:"grand",syllables:2},{title:"Reine",reg:"grand",syllables:1},{title:"Malika",reg:"grand",syllables:3}],
  giant:      [{title:"Empress",reg:"grand",syllables:3},{title:"Queen",reg:"grand",syllables:1},{title:"Magnificent",reg:"grand",syllables:4},{title:"Formidable",reg:"grand",syllables:4},{title:"Legendary",reg:"grand",syllables:4},{title:"Tsarina",reg:"grand",syllables:3},{title:"Titaness",reg:"grand",syllables:3},{title:"Matriarch",reg:"grand",syllables:3},{title:"Warrior Queen",reg:"grand",syllables:4},{title:"Great",reg:"grand",syllables:1},{title:"Duchess",reg:"grand",syllables:2},{title:"Kaiserin",reg:"grand",syllables:3},{title:"Maharani",reg:"grand",syllables:4}],
  poodle:     [{title:"Professor",reg:"grand",syllables:3},{title:"Doctor",reg:"grand",syllables:2},{title:"Queen",reg:"grand",syllables:1},{title:"Goddess",reg:"grand",syllables:2},{title:"Oracle",reg:"grand",syllables:3},{title:"Grande Dame",reg:"grand",syllables:3},{title:"Enchantress",reg:"grand",syllables:3}],
  lapdog:     [{title:"Lil'",reg:"informal",syllables:1},{title:"Baby",reg:"informal",syllables:2},{title:"Little",reg:"informal",syllables:2},{title:"Daft",reg:"informal",syllables:1},{title:"Cheeky",reg:"informal",syllables:2},{title:"Silly",reg:"informal",syllables:2},{title:"Scruffy",reg:"informal",syllables:2},{title:"Fluffy",reg:"informal",syllables:2},{title:"Grumpy",reg:"informal",syllables:2},{title:"Squishy",reg:"informal",syllables:2},{title:"Itsy",reg:"informal",syllables:2},{title:"Teeny",reg:"informal",syllables:2},{title:"Queen",reg:"grand",syllables:1},{title:"Princess",reg:"grand",syllables:3},{title:"Goddess",reg:"grand",syllables:2},{title:"Enchantress",reg:"grand",syllables:3},{title:"Crystal Queen",reg:"grand",syllables:4},{title:"Moon Queen",reg:"grand",syllables:3},{title:"Rose Queen",reg:"grand",syllables:2},{title:"Diamond Queen",reg:"grand",syllables:4},{title:"Pearl Queen",reg:"grand",syllables:2}],
  bulldog:    [{title:"Dame",reg:"grand",syllables:1},{title:"Lady",reg:"grand",syllables:2},{title:"Right Honourable",reg:"grand",syllables:4}],
  boston:     [{title:"Madame",reg:"grand",syllables:2},{title:"Miss",reg:"mundane",syllables:1},{title:"Lady",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Duchess",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Baroness",reg:"grand",syllables:3}],
  asian:      [
  {title:"Empress",reg:"grand",syllables:3},
  {title:"Dragon Lady",reg:"grand",syllables:4},
  {title:"Jade",reg:"grand",syllables:1},
  {title:"Lotus",reg:"grand",syllables:2},
  {title:"Goddess",reg:"grand",syllables:2},
  {title:"Notorious",reg:"grand",syllables:4},
  {title:"Incomparable",reg:"grand",syllables:5},
  {title:"Queen",reg:"grand",syllables:1},
  {title:"Geisha",reg:"grand",syllables:2},
  {title:"Madame",reg:"grand",syllables:2}
],
  character:  [{title:"Notorious",reg:"grand",syllables:4},{title:"Incomparable",reg:"grand",syllables:5},{title:"Baroness",reg:"grand",syllables:3},{title:"Countess",reg:"grand",syllables:2},{title:"Queen",reg:"grand",syllables:1},{title:"Goddess",reg:"grand",syllables:2},{title:"Valkyrie",reg:"grand",syllables:3},{title:"Enchantress",reg:"grand",syllables:3},{title:"Sorceress",reg:"grand",syllables:3},{title:"Huntress",reg:"grand",syllables:2},{title:"Amazon",reg:"grand",syllables:3},{title:"Oracle",reg:"grand",syllables:3},{title:"Moon Queen",reg:"grand",syllables:3},{title:"Ice Queen",reg:"grand",syllables:3},{title:"Storm Queen",reg:"grand",syllables:3},{title:"Shadow Queen",reg:"grand",syllables:3},{title:"Fire Queen",reg:"grand",syllables:3}],
  dachshund:  [{title:"Notorious",reg:"grand",syllables:4},{title:"Incomparable",reg:"grand",syllables:5},{title:"Countess",reg:"grand",syllables:2}],
  gentry:     [{title:"Viscountess",reg:"grand",syllables:3},{title:"Baroness",reg:"grand",syllables:3},{title:"Most Honourable",reg:"grand",syllables:4},{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Marchioness",reg:"grand",syllables:3},{title:"Queen",reg:"grand",syllables:1},{title:"Grand Duchess",reg:"grand",syllables:3},{title:"Maharani",reg:"grand",syllables:4},{title:"Regina",reg:"grand",syllables:3},{title:"Noble Lady",reg:"grand",syllables:3},{title:"Grande Dame",reg:"grand",syllables:3}],
  welsh:      [{title:"Princess",reg:"grand",syllables:3},{title:"Lady",reg:"grand",syllables:2},{title:"Duchess",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Bardess",reg:"grand",syllables:2},{title:"Miss",reg:"mundane",syllables:1},{title:"Dame",reg:"grand",syllables:1},{title:"Queen",reg:"grand",syllables:1},{title:"Matriarch",reg:"grand",syllables:3},{title:"Druidess",reg:"grand",syllables:3},{title:"Enchantress",reg:"grand",syllables:3}],
  default:    [{title:"Lady",reg:"grand",syllables:2},{title:"Baroness",reg:"grand",syllables:3},{title:"Countess",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Viscountess",reg:"grand",syllables:3},{title:"Queen",reg:"grand",syllables:1},{title:"Princess",reg:"grand",syllables:3},{title:"Matriarch",reg:"grand",syllables:3},{title:"Maharani",reg:"grand",syllables:4},{title:"Tsarina",reg:"grand",syllables:3},{title:"Regina",reg:"grand",syllables:3},{title:"Rani",reg:"grand",syllables:2},{title:"Malika",reg:"grand",syllables:3}],


  dalmatian:  [{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Duchess",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Miss",reg:"mundane",syllables:1}],
  sheepdog:   [{title:"Professor",reg:"grand",syllables:3},{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Matriarch",reg:"grand",syllables:3},{title:"Duchess",reg:"grand",syllables:2}],
  lurcher:    [{title:"Mrs",reg:"mundane",syllables:1},{title:"Miss",reg:"mundane",syllables:1},{title:"Lady",reg:"grand",syllables:2}],
};

// ── NAME BANKS (abbreviated for space -- key groups) ───────────────────────────
const NAMES: Record<string, { boy: NameEntry[]; girl: NameEntry[] }> = {
  lapdog: {
    boy: [{name:"Marvellous",reg:"absurd",syllables:3},{name:"Glorious",reg:"absurd",syllables:3},{name:"Opulent",reg:"grand",syllables:3},{name:"Majestic",reg:"grand",syllables:3},{name:"Fortunatus",reg:"grand",syllables:4},{name:"Benedictus",reg:"grand",syllables:4},{name:"Casimir",reg:"grand",syllables:3},{name:"Florentine",reg:"grand",syllables:3},{name:"Celestin",reg:"grand",syllables:3},{name:"Alexander",reg:"grand",syllables:4},{name:"Vincent",reg:"grand",syllables:2},{name:"Henry",reg:"grand",syllables:2},{name:"Sebastian",reg:"grand",syllables:4},{name:"Theodore",reg:"grand",syllables:3},{name:"Edward",reg:"grand",syllables:2},{name:"Charles",reg:"grand",syllables:1},{name:"Gabriel",reg:"grand",syllables:3},{name:"Oliver",reg:"mundane",syllables:3},{name:"William",reg:"mundane",syllables:2},{name:"Frederick",reg:"grand",syllables:3},{name:"Maximillian",reg:"grand",syllables:5},{name:"Samuel",reg:"mundane",syllables:3},{name:"Neal",reg:"mundane",syllables:1},{name:"Grommet",reg:"baby",syllables:2},{name:"Widget",reg:"baby",syllables:2},{name:"Wotsit",reg:"baby",syllables:2},{name:"Thingy",reg:"baby",syllables:2},{name:"Gubbins",reg:"baby",syllables:2},{name:"Puckle",reg:"baby",syllables:2},{name:"Muddle",reg:"baby",syllables:2},{name:"Binky",reg:"baby",syllables:2},{name:"Booper",reg:"baby",syllables:2},{name:"Button",reg:"baby",syllables:2},{name:"Pip",reg:"baby",syllables:2},{name:"Titch",reg:"baby",syllables:2},{name:"Squirt",reg:"baby",syllables:2},{name:"Tuppence",reg:"baby",syllables:2},{name:"Munchkin",reg:"baby",syllables:2},{name:"Roly",reg:"baby",syllables:2},{name:"Gizmo",reg:"baby",syllables:2},{name:"Doodle",reg:"baby",syllables:2},{name:"Goober",reg:"baby",syllables:2},{name:"Nugget",reg:"baby",syllables:2},{name:"Peanut",reg:"baby",syllables:2},{name:"Chumley",reg:"absurd",syllables:2},{name:"Peabody",reg:"absurd",syllables:2},{name:"Sherman",reg:"absurd",syllables:2},{name:"Wimpy",reg:"absurd",syllables:2},{name:"Huckleberry",reg:"absurd",syllables:2},{name:"Benny",reg:"absurd",syllables:2},{name:"Foghorn",reg:"absurd",syllables:2},{name:"Philibert",reg:"grand",syllables:2},{name:"Eustache",reg:"grand",syllables:2},{name:"Céléstin",reg:"grand",syllables:2},{name:"Aimé",reg:"grand",syllables:2},{name:"Alain",reg:"grand",syllables:2},{name:"Ovation",reg:"pedigree",syllables:3},{name:"Laureate",reg:"pedigree",syllables:3},{name:"Criterion",reg:"pedigree",syllables:4},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Revelation",reg:"pedigree",syllables:4},{name:"Dedication",reg:"pedigree",syllables:4},{name:"Reputation",reg:"pedigree",syllables:4},{name:"Satisfaction",reg:"pedigree",syllables:4},{name:"Nomination",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Cause Celebre",reg:"pedigree",syllables:4},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Grand Finale",reg:"pedigree",syllables:4},{name:"First Edition",reg:"pedigree",syllables:4},{name:"Last Waltz",reg:"pedigree",syllables:3},{name:"True Grit",reg:"pedigree",syllables:2},{name:"Bold Ambition",reg:"pedigree",syllables:4},{name:"Noble Cause",reg:"pedigree",syllables:3},{name:"Plain Sailing",reg:"pedigree",syllables:3},{name:"Full Circle",reg:"pedigree",syllables:3},{name:"Open Season",reg:"pedigree",syllables:4},{name:"Top Drawer",reg:"pedigree",syllables:3},{name:"High Society",reg:"pedigree",syllables:4},{name:"Good Authority",reg:"pedigree",syllables:5},{name:"Dark Star",reg:"pedigree",syllables:2},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Wild Rover",reg:"pedigree",syllables:3},{name:"Jukebox Hero",reg:"pedigree",syllables:4},{name:"Major Tom",reg:"pedigree",syllables:3},{name:"Golden Years",reg:"pedigree",syllables:4},{name:"Forever Young",reg:"pedigree",syllables:4},{name:"Purple Rain",reg:"pedigree",syllables:3},{name:"Bright Eyes",reg:"pedigree",syllables:2},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Moorgate",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Chalcroft",reg:"pedigree",syllables:2},{name:"Brandywell",reg:"pedigree",syllables:3},{name:"Millbrook",reg:"pedigree",syllables:2},{name:"Ashgrove",reg:"pedigree",syllables:2},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2}],
    girl: [{name:"Fabulous",reg:"absurd",syllables:3},{name:"Darling",reg:"baby",syllables:2},{name:"Precious",reg:"baby",syllables:2},{name:"Divine",reg:"grand",syllables:2},{name:"Dazzling",reg:"absurd",syllables:2},{name:"Ruby",reg:"grand",syllables:2},{name:"Diamond",reg:"grand",syllables:2},{name:"Pearl",reg:"grand",syllables:1},{name:"Sapphire",reg:"grand",syllables:2},{name:"Crystal",reg:"grand",syllables:2},{name:"Chanel",reg:"grand",syllables:2},{name:"Celestine",reg:"grand",syllables:3},{name:"Aurora",reg:"grand",syllables:3},{name:"Daphne",reg:"grand",syllables:2},{name:"Diana",reg:"grand",syllables:3},{name:"Flora",reg:"nature",syllables:2},{name:"Freya",reg:"grand",syllables:2},{name:"Iris",reg:"nature",syllables:2},{name:"Luna",reg:"grand",syllables:2},{name:"Maeve",reg:"grand",syllables:1},{name:"Ophelia",reg:"grand",syllables:4},{name:"Pandora",reg:"grand",syllables:3},{name:"Venus",reg:"grand",syllables:2},{name:"Violette",reg:"grand",syllables:3},{name:"Juliet",reg:"grand",syllables:3},{name:"Isabella",reg:"grand",syllables:4},{name:"Charlotte",reg:"grand",syllables:2},{name:"Olivia",reg:"mundane",syllables:4},{name:"Victoria",reg:"grand",syllables:4},{name:"Elizabeth",reg:"grand",syllables:4},{name:"Booboo",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Coco",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Cuddlekins",reg:"baby",syllables:3},{name:"Puddingkins",reg:"baby",syllables:3},{name:"Sprinkles",reg:"food",syllables:2},{name:"Marshmallow",reg:"food",syllables:2},{name:"Meringue",reg:"food",syllables:2},{name:"Smartie",reg:"food",syllables:2},{name:"Gumball",reg:"food",syllables:2},{name:"Taffy",reg:"food",syllables:2},{name:"Cheerio",reg:"food",syllables:2},{name:"Peaches",reg:"food",syllables:2},{name:"Cherry",reg:"food",syllables:2},{name:"Berry",reg:"food",syllables:2},{name:"Plum",reg:"food",syllables:2},{name:"Figgy",reg:"food",syllables:2},{name:"Apricot",reg:"food",syllables:2},{name:"Lime",reg:"food",syllables:2},{name:"Kiwi",reg:"food",syllables:2},{name:"Mango",reg:"food",syllables:2},{name:"Melon",reg:"food",syllables:2},{name:"Pumpkin",reg:"food",syllables:2},{name:"Shortcake",reg:"food",syllables:2},{name:"Doughnut",reg:"food",syllables:2},{name:"Latte",reg:"food",syllables:2},{name:"Crunchie",reg:"food",syllables:2},{name:"Twixie",reg:"food",syllables:2},{name:"Rolo",reg:"food",syllables:2},{name:"Oreo",reg:"food",syllables:2},{name:"Jammy",reg:"food",syllables:2},{name:"Marmalade",reg:"food",syllables:2},{name:"Sensation",reg:"pedigree",syllables:3},{name:"Fascination",reg:"pedigree",syllables:4},{name:"Celebration",reg:"pedigree",syllables:4},{name:"Mystification",reg:"pedigree",syllables:5},{name:"Observation",reg:"pedigree",syllables:4},{name:"Anticipation",reg:"pedigree",syllables:5},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Scarlett",reg:"pedigree",syllables:2},{name:"Daydream",reg:"pedigree",syllables:2},{name:"Moonraker",reg:"pedigree",syllables:3},{name:"Nightfall",reg:"pedigree",syllables:2},{name:"Summerset",reg:"pedigree",syllables:3},{name:"Cry Baby",reg:"pedigree",syllables:3},{name:"Moon River",reg:"pedigree",syllables:3},{name:"Sweet Sensation",reg:"pedigree",syllables:4},{name:"Pure Distinction",reg:"pedigree",syllables:4},{name:"Rare Occasion",reg:"pedigree",syllables:4},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Scarlett O'Hara",reg:"pedigree",syllables:4},{name:"Lady Madonna",reg:"pedigree",syllables:5},{name:"California",reg:"pedigree",syllables:5},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Roxanne",reg:"pedigree",syllables:2},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Hayward",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2},{name:"Squishface",reg:"baby",syllables:2},{name:"Smooshface",reg:"baby",syllables:2},{name:"Fluffybum",reg:"baby",syllables:3},{name:"Babbycakes",reg:"baby",syllables:3}],
  },
  boxer: {
    boy: [{name:"Doofus",reg:"chaos",syllables:2},{name:"Galumph",reg:"chaos",syllables:2},{name:"Lummox",reg:"chaos",syllables:2},{name:"Bonkers",reg:"chaos",syllables:2},{name:"Dingbat",reg:"chaos",syllables:2},{name:"Rumpus",reg:"chaos",syllables:2},{name:"Kerfuffle",reg:"chaos",syllables:3},{name:"Hullabaloo",reg:"chaos",syllables:4},{name:"Nincompoop",reg:"chaos",syllables:3},{name:"Goofball",reg:"chaos",syllables:2},{name:"Chuckles",reg:"chaos",syllables:2},{name:"Bozo",reg:"chaos",syllables:2},{name:"Pickles",reg:"baby",syllables:2},{name:"Noodles",reg:"baby",syllables:2},{name:"Chipmunk",reg:"baby",syllables:2},{name:"Kazoo",reg:"absurd",syllables:2},{name:"Joker",reg:"chaos",syllables:2},{name:"Pancake",reg:"food",syllables:2},{name:"Zebedee",reg:"absurd",syllables:3},{name:"Chaos",reg:"chaos",syllables:2},{name:"Havoc",reg:"chaos",syllables:2},{name:"Ruckus",reg:"chaos",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Noo-Noo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Bumbles",reg:"chaos",syllables:2},{name:"Bumper",reg:"chaos",syllables:2},{name:"Bumpkin",reg:"chaos",syllables:2},{name:"Stomper",reg:"chaos",syllables:2},{name:"Clomper",reg:"chaos",syllables:2},{name:"Trooper",reg:"chaos",syllables:2},{name:"Rowdy",reg:"chaos",syllables:2},{name:"Bruiser",reg:"chaos",syllables:2},{name:"Bandit",reg:"chaos",syllables:2},{name:"Dodger",reg:"chaos",syllables:2},{name:"Bonzo",reg:"chaos",syllables:2},{name:"Buster",reg:"chaos",syllables:2},{name:"Bruno",reg:"chaos",syllables:2},{name:"Butch",reg:"chaos",syllables:2},{name:"Spike",reg:"chaos",syllables:2},{name:"Bowser",reg:"chaos",syllables:2},{name:"Lobster",reg:"chaos",syllables:2},{name:"Chunk",reg:"chaos",syllables:2},{name:"Tubby",reg:"chaos",syllables:2},{name:"Pudgy",reg:"chaos",syllables:2},{name:"Wagger",reg:"chaos",syllables:2},{name:"Wags",reg:"chaos",syllables:2},{name:"Wiggles",reg:"chaos",syllables:2},{name:"Munchie",reg:"food",syllables:2},{name:"Chewy",reg:"food",syllables:2},{name:"Cruncher",reg:"food",syllables:2},{name:"Scoffy",reg:"food",syllables:2},{name:"Nibbler",reg:"food",syllables:2},{name:"Bagel",reg:"food",syllables:2},{name:"Pretzel",reg:"food",syllables:2},{name:"Chips",reg:"food",syllables:2},{name:"Gherkin",reg:"food",syllables:2},{name:"Porridge",reg:"food",syllables:2},{name:"Granola",reg:"food",syllables:2},{name:"Toastie",reg:"food",syllables:2},{name:"Crusty",reg:"food",syllables:2},{name:"Crispy",reg:"food",syllables:2},{name:"Cobbler",reg:"food",syllables:2},{name:"Strudel",reg:"food",syllables:2},{name:"Radish",reg:"food",syllables:2},{name:"Cabbage",reg:"food",syllables:2},{name:"Lentil",reg:"food",syllables:2},{name:"Chickpea",reg:"food",syllables:2},{name:"Pistachio",reg:"food",syllables:2},{name:"Cashew",reg:"food",syllables:2},{name:"Molasses",reg:"food",syllables:2},{name:"Pepper",reg:"food",syllables:2},{name:"Paprika",reg:"food",syllables:2},{name:"Chutney",reg:"food",syllables:2},{name:"Marmalade",reg:"food",syllables:2},{name:"Jammy",reg:"food",syllables:2},{name:"Rambo",reg:"chaos",syllables:2},{name:"Rocky",reg:"chaos",syllables:2},{name:"Drago",reg:"chaos",syllables:2},{name:"Clubber",reg:"chaos",syllables:2},{name:"Cobra",reg:"chaos",syllables:2},{name:"Bronson",reg:"grand",syllables:2},{name:"Dutch",reg:"mundane",syllables:1},{name:"Conan",reg:"grand",syllables:2},{name:"Blade",reg:"chaos",syllables:1},{name:"Riddick",reg:"chaos",syllables:2},{name:"Diesel",reg:"chaos",syllables:2},{name:"Dolph",reg:"mundane",syllables:1},{name:"Sly",reg:"mundane",syllables:1},{name:"Arnie",reg:"mundane",syllables:2},{name:"Chuck",reg:"mundane",syllables:1},{name:"Bruce",reg:"mundane",syllables:1},{name:"Clint",reg:"mundane",syllables:1},{name:"Django",reg:"chaos",syllables:2},{name:"Shaft",reg:"chaos",syllables:1},{name:"Snake",reg:"chaos",syllables:1},{name:"Maverick",reg:"chaos",syllables:3},{name:"Riggs",reg:"chaos",syllables:1},{name:"Deckard",reg:"mundane",syllables:2},{name:"Max",reg:"mundane",syllables:1},{name:"Fury",reg:"chaos",syllables:2},{name:"Dredd",reg:"chaos",syllables:1},{name:"Statham",reg:"mundane",syllables:2},{name:"Walker",reg:"mundane",syllables:2},{name:"Norris",reg:"mundane",syllables:2},{name:"McClane",reg:"chaos",syllables:2}],
    girl: [{name:"Dizzy",reg:"chaos",syllables:2},{name:"Topsy",reg:"chaos",syllables:2},{name:"Moonbeam",reg:"grand",syllables:2},{name:"Starbeam",reg:"grand",syllables:2},{name:"Starlight",reg:"grand",syllables:2},{name:"Moonlight",reg:"grand",syllables:2},{name:"Midnight",reg:"grand",syllables:2},{name:"Moonshadow",reg:"grand",syllables:2},{name:"Starshadow",reg:"grand",syllables:2},{name:"Moonglow",reg:"grand",syllables:2},{name:"Nightglow",reg:"grand",syllables:2},{name:"Moonstone",reg:"grand",syllables:2},{name:"Stardust",reg:"grand",syllables:2},{name:"Celestia",reg:"grand",syllables:2},{name:"Lunaris",reg:"grand",syllables:2},{name:"Nightshade",reg:"grand",syllables:2},{name:"Goldenmoon",reg:"grand",syllables:2},{name:"Bluemoon",reg:"grand",syllables:2},{name:"Crescent",reg:"grand",syllables:2},{name:"Andromeda",reg:"grand",syllables:2},{name:"Astra",reg:"grand",syllables:2},{name:"Solstice",reg:"grand",syllables:2},{name:"Penumbra",reg:"grand",syllables:2},{name:"Umbra",reg:"grand",syllables:2},{name:"Starfall",reg:"grand",syllables:2},{name:"Moonfire",reg:"grand",syllables:2},{name:"Starfire",reg:"grand",syllables:2},{name:"Dawnstar",reg:"grand",syllables:2},{name:"Eventide",reg:"grand",syllables:2},{name:"Silvermoon",reg:"grand",syllables:2},{name:"Bloodmoon",reg:"grand",syllables:2},{name:"Twilight",reg:"grand",syllables:2},{name:"Bonkers",reg:"chaos",syllables:2},{name:"Wibble",reg:"chaos",syllables:2},{name:"Doolally",reg:"chaos",syllables:3},{name:"Ramshackle",reg:"chaos",syllables:3},{name:"Twinkles",reg:"baby",syllables:2},{name:"Cornflake",reg:"food",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Tutu",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Cuddlekins",reg:"baby",syllables:3},{name:"Tiddlywink",reg:"baby",syllables:3},{name:"Jellybean",reg:"food",syllables:3},{name:"Candyfloss",reg:"food",syllables:3},{name:"Cupcake",reg:"food",syllables:2}],
  },

  afghan: {
    boy: [{name:"Aryan",reg:"aloof",syllables:2},{name:"Darius",reg:"aloof",syllables:2},{name:"Cyrus",reg:"aloof",syllables:2},{name:"Rustam",reg:"aloof",syllables:2},{name:"Zalmay",reg:"aloof",syllables:2},{name:"Tariq",reg:"aloof",syllables:2},{name:"Hamid",reg:"aloof",syllables:2},{name:"Khalid",reg:"aloof",syllables:2},{name:"Nawab",reg:"aloof",syllables:2},{name:"Sultan",reg:"aloof",syllables:2},{name:"Amir",reg:"aloof",syllables:2},{name:"Malik",reg:"aloof",syllables:2},{name:"Khan",reg:"aloof",syllables:2},{name:"Reza",reg:"aloof",syllables:2},{name:"Yusuf",reg:"aloof",syllables:2},{name:"Omar",reg:"aloof",syllables:2},{name:"Samir",reg:"aloof",syllables:2},{name:"Tarkan",reg:"aloof",syllables:2},{name:"Idris",reg:"aloof",syllables:2},{name:"Zafar",reg:"aloof",syllables:2},{name:"Bashir",reg:"aloof",syllables:2},{name:"Nasir",reg:"aloof",syllables:2},{name:"Kabir",reg:"aloof",syllables:2},{name:"Zahir",reg:"aloof",syllables:2},{name:"Qadir",reg:"aloof",syllables:2}],
    girl: [{name:"Mina",reg:"aloof",syllables:1},{name:"Lema",reg:"aloof",syllables:1},{name:"Nila",reg:"aloof",syllables:1},{name:"Zari",reg:"aloof",syllables:1},{name:"Huma",reg:"aloof",syllables:1},{name:"Pari",reg:"aloof",syllables:1},{name:"Roya",reg:"aloof",syllables:1},{name:"Zoya",reg:"aloof",syllables:1},{name:"Wafa",reg:"aloof",syllables:1},{name:"Sana",reg:"aloof",syllables:1},{name:"Shab",reg:"aloof",syllables:1},{name:"Laleh",reg:"aloof",syllables:1},{name:"Arya",reg:"aloof",syllables:1},{name:"Mahsa",reg:"aloof",syllables:1},{name:"Nazo",reg:"aloof",syllables:1},{name:"Spogmai",reg:"aloof",syllables:1},{name:"Bibi",reg:"aloof",syllables:1},{name:"Gul",reg:"aloof",syllables:1},{name:"Naz",reg:"aloof",syllables:1},{name:"Rona",reg:"aloof",syllables:1},{name:"Noor",reg:"aloof",syllables:1},{name:"Aya",reg:"aloof",syllables:1},{name:"Amal",reg:"aloof",syllables:1},{name:"Hala",reg:"aloof",syllables:1},{name:"Hana",reg:"aloof",syllables:1},{name:"Lina",reg:"aloof",syllables:1},{name:"Lama",reg:"aloof",syllables:1},{name:"Leen",reg:"aloof",syllables:1},{name:"Reem",reg:"aloof",syllables:1},{name:"Rima",reg:"aloof",syllables:1},{name:"Dana",reg:"aloof",syllables:1},{name:"Dima",reg:"aloof",syllables:1},{name:"Maha",reg:"aloof",syllables:1},{name:"Mona",reg:"aloof",syllables:1},{name:"Nada",reg:"aloof",syllables:1},{name:"Ruba",reg:"aloof",syllables:1},{name:"Saba",reg:"aloof",syllables:1},{name:"Sama",reg:"aloof",syllables:1},{name:"Salma",reg:"aloof",syllables:1},{name:"Yara",reg:"aloof",syllables:1},{name:"Huda",reg:"aloof",syllables:1},{name:"Suha",reg:"aloof",syllables:1},{name:"May",reg:"aloof",syllables:1},{name:"Tala",reg:"aloof",syllables:1},{name:"Farah",reg:"aloof",syllables:1},{name:"Lujain",reg:"aloof",syllables:1},{name:"Maysa",reg:"aloof",syllables:1},{name:"Noura",reg:"aloof",syllables:1},{name:"Zahra",reg:"aloof",syllables:1}],
  },
  sighthound: {
    boy: [{name:"Nonchalance",reg:"aloof",syllables:3},{name:"Indifference",reg:"aloof",syllables:4},{name:"Lassitude",reg:"aloof",syllables:3},{name:"Apathy",reg:"aloof",syllables:3},{name:"Sangfroid",reg:"aloof",syllables:2},{name:"Miles",reg:"mundane",syllables:1},{name:"Julian",reg:"grand",syllables:3},{name:"Lawrence",reg:"grand",syllables:2},{name:"Richard",reg:"grand",syllables:2},{name:"Quentin",reg:"grand",syllables:2},{name:"Sebastian",reg:"grand",syllables:4},{name:"Vincent",reg:"grand",syllables:2},{name:"Leopold",reg:"grand",syllables:3},{name:"Edgar",reg:"grand",syllables:2},{name:"Dash",reg:"mundane",syllables:2},{name:"Drifter",reg:"mundane",syllables:2},{name:"Dancer",reg:"mundane",syllables:2},{name:"Dart",reg:"mundane",syllables:2},{name:"Duke",reg:"mundane",syllables:2},{name:"Flash",reg:"mundane",syllables:2},{name:"Fleet",reg:"mundane",syllables:2},{name:"Flint",reg:"mundane",syllables:2},{name:"Falcon",reg:"mundane",syllables:2},{name:"Fury",reg:"mundane",syllables:2},{name:"Ovation",reg:"pedigree",syllables:3},{name:"Laureate",reg:"pedigree",syllables:3},{name:"Criterion",reg:"pedigree",syllables:4},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Revelation",reg:"pedigree",syllables:4},{name:"Dedication",reg:"pedigree",syllables:4},{name:"Reputation",reg:"pedigree",syllables:4},{name:"Satisfaction",reg:"pedigree",syllables:4},{name:"Nomination",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Cause Celebre",reg:"pedigree",syllables:4},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Grand Finale",reg:"pedigree",syllables:4},{name:"First Edition",reg:"pedigree",syllables:4},{name:"Last Waltz",reg:"pedigree",syllables:3},{name:"True Grit",reg:"pedigree",syllables:2},{name:"Bold Ambition",reg:"pedigree",syllables:4},{name:"Noble Cause",reg:"pedigree",syllables:3},{name:"Plain Sailing",reg:"pedigree",syllables:3},{name:"Full Circle",reg:"pedigree",syllables:3},{name:"Open Season",reg:"pedigree",syllables:4},{name:"Top Drawer",reg:"pedigree",syllables:3},{name:"High Society",reg:"pedigree",syllables:4},{name:"Good Authority",reg:"pedigree",syllables:5},{name:"Dark Star",reg:"pedigree",syllables:2},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Wild Rover",reg:"pedigree",syllables:3},{name:"Jukebox Hero",reg:"pedigree",syllables:4},{name:"Major Tom",reg:"pedigree",syllables:3},{name:"Golden Years",reg:"pedigree",syllables:4},{name:"Forever Young",reg:"pedigree",syllables:4},{name:"Purple Rain",reg:"pedigree",syllables:3},{name:"Bright Eyes",reg:"pedigree",syllables:2},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Moorgate",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Chalcroft",reg:"pedigree",syllables:2},{name:"Brandywell",reg:"pedigree",syllables:3},{name:"Millbrook",reg:"pedigree",syllables:2},{name:"Ashgrove",reg:"pedigree",syllables:2},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2}],
    girl: [{name:"Ennui",reg:"aloof",syllables:2},{name:"Nonchalance",reg:"aloof",syllables:3},{name:"Austère",reg:"aloof",syllables:2},{name:"Samantha",reg:"mundane",syllables:3},{name:"Bethany",reg:"mundane",syllables:3},{name:"Amanda",reg:"mundane",syllables:3},{name:"Megan",reg:"mundane",syllables:2},{name:"Hannah",reg:"mundane",syllables:2},{name:"Melissa",reg:"mundane",syllables:3},{name:"Nicole",reg:"mundane",syllables:2},{name:"Rachel",reg:"mundane",syllables:2},{name:"Betty",reg:"mundane",syllables:2},{name:"Amy",reg:"mundane",syllables:2},{name:"Emily",reg:"mundane",syllables:3},{name:"Jennifer",reg:"mundane",syllables:3},{name:"Sarah",reg:"mundane",syllables:2},{name:"Lucy",reg:"mundane",syllables:2},{name:"Bailey",reg:"mundane",syllables:2},{name:"Heather",reg:"nature",syllables:2},{name:"Jasmine",reg:"nature",syllables:2},{name:"Duchess",reg:"aloof",syllables:2},{name:"Drifter",reg:"aloof",syllables:2},{name:"Dazzle",reg:"aloof",syllables:2},{name:"Dancer",reg:"aloof",syllables:2},{name:"Fleur",reg:"aloof",syllables:2},{name:"Flair",reg:"aloof",syllables:2},{name:"Frost",reg:"aloof",syllables:2},{name:"Fauna",reg:"aloof",syllables:2},{name:"Flutter",reg:"aloof",syllables:2},{name:"Sensation",reg:"pedigree",syllables:3},{name:"Fascination",reg:"pedigree",syllables:4},{name:"Celebration",reg:"pedigree",syllables:4},{name:"Mystification",reg:"pedigree",syllables:5},{name:"Observation",reg:"pedigree",syllables:4},{name:"Anticipation",reg:"pedigree",syllables:5},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Scarlett",reg:"pedigree",syllables:2},{name:"Daydream",reg:"pedigree",syllables:2},{name:"Moonraker",reg:"pedigree",syllables:3},{name:"Nightfall",reg:"pedigree",syllables:2},{name:"Summerset",reg:"pedigree",syllables:3},{name:"Cry Baby",reg:"pedigree",syllables:3},{name:"Moon River",reg:"pedigree",syllables:3},{name:"Sweet Sensation",reg:"pedigree",syllables:4},{name:"Pure Distinction",reg:"pedigree",syllables:4},{name:"Rare Occasion",reg:"pedigree",syllables:4},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Scarlett O'Hara",reg:"pedigree",syllables:4},{name:"Lady Madonna",reg:"pedigree",syllables:5},{name:"California",reg:"pedigree",syllables:5},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Roxanne",reg:"pedigree",syllables:2},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Hayward",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2}],
  },
  sniffer: {
    boy: [{name:"Plodsworth",reg:"absurd",syllables:2},{name:"Glumley",reg:"absurd",syllables:2},{name:"Mourny",reg:"absurd",syllables:2},{name:"Woebegone",reg:"absurd",syllables:3},{name:"Lachrymose",reg:"absurd",syllables:3},{name:"Melancholy",reg:"absurd",syllables:4},{name:"Lugubrious",reg:"absurd",syllables:4},{name:"Gloopington",reg:"absurd",syllables:3},{name:"John",reg:"mundane",syllables:1},{name:"Brian",reg:"mundane",syllables:2},{name:"Raymond",reg:"mundane",syllables:2},{name:"George",reg:"mundane",syllables:1},{name:"Arthur",reg:"mundane",syllables:2},{name:"David",reg:"mundane",syllables:2},{name:"Keith",reg:"mundane",syllables:1},{name:"Derek",reg:"mundane",syllables:2},{name:"Kevin",reg:"mundane",syllables:2},{name:"Trevor",reg:"mundane",syllables:2},{name:"Barry",reg:"mundane",syllables:2},{name:"Norman",reg:"mundane",syllables:2},{name:"Basil",reg:"mundane",syllables:2},{name:"Mugsy",reg:"mundane",syllables:2},{name:"Peabody",reg:"mundane",syllables:2},{name:"Sherman",reg:"mundane",syllables:2},{name:"Scrappy",reg:"mundane",syllables:2},{name:"Spook",reg:"mundane",syllables:2},{name:"Brain",reg:"mundane",syllables:2},{name:"Hunter",reg:"mundane",syllables:2},{name:"Hector",reg:"mundane",syllables:2},{name:"Hugo",reg:"mundane",syllables:2},{name:"Harold",reg:"mundane",syllables:2},{name:"Herbert",reg:"mundane",syllables:2},{name:"Hound",reg:"mundane",syllables:2},{name:"Quest",reg:"mundane",syllables:2},{name:"Quincy",reg:"mundane",syllables:2},{name:"Quentin",reg:"mundane",syllables:2},{name:"Shadow",reg:"mundane",syllables:2},{name:"Sherlock",reg:"mundane",syllables:2},{name:"Sleuth",reg:"mundane",syllables:2},{name:"Snooper",reg:"mundane",syllables:2},{name:"Snout",reg:"mundane",syllables:2},{name:"Snuffle",reg:"mundane",syllables:2},{name:"Sage",reg:"mundane",syllables:2},{name:"Samson",reg:"mundane",syllables:2},{name:"Turnip",reg:"mundane",syllables:2},{name:"Parsnip",reg:"mundane",syllables:2},{name:"Radish",reg:"mundane",syllables:2},{name:"Cabbage",reg:"mundane",syllables:2},{name:"Lentil",reg:"mundane",syllables:2},{name:"Porridge",reg:"mundane",syllables:2},{name:"Granola",reg:"mundane",syllables:2},{name:"Crumpet",reg:"mundane",syllables:2},{name:"Cobbler",reg:"mundane",syllables:2},{name:"Ovation",reg:"pedigree",syllables:3},{name:"Laureate",reg:"pedigree",syllables:3},{name:"Criterion",reg:"pedigree",syllables:4},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Revelation",reg:"pedigree",syllables:4},{name:"Dedication",reg:"pedigree",syllables:4},{name:"Reputation",reg:"pedigree",syllables:4},{name:"Satisfaction",reg:"pedigree",syllables:4},{name:"Nomination",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Cause Celebre",reg:"pedigree",syllables:4},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Grand Finale",reg:"pedigree",syllables:4},{name:"First Edition",reg:"pedigree",syllables:4},{name:"Last Waltz",reg:"pedigree",syllables:3},{name:"True Grit",reg:"pedigree",syllables:2},{name:"Bold Ambition",reg:"pedigree",syllables:4},{name:"Noble Cause",reg:"pedigree",syllables:3},{name:"Plain Sailing",reg:"pedigree",syllables:3},{name:"Full Circle",reg:"pedigree",syllables:3},{name:"Open Season",reg:"pedigree",syllables:4},{name:"Top Drawer",reg:"pedigree",syllables:3},{name:"High Society",reg:"pedigree",syllables:4},{name:"Good Authority",reg:"pedigree",syllables:5},{name:"Dark Star",reg:"pedigree",syllables:2},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Wild Rover",reg:"pedigree",syllables:3},{name:"Jukebox Hero",reg:"pedigree",syllables:4},{name:"Major Tom",reg:"pedigree",syllables:3},{name:"Golden Years",reg:"pedigree",syllables:4},{name:"Forever Young",reg:"pedigree",syllables:4},{name:"Purple Rain",reg:"pedigree",syllables:3},{name:"Bright Eyes",reg:"pedigree",syllables:2},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Moorgate",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Chalcroft",reg:"pedigree",syllables:2},{name:"Brandywell",reg:"pedigree",syllables:3},{name:"Millbrook",reg:"pedigree",syllables:2},{name:"Ashgrove",reg:"pedigree",syllables:2},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2}],
    girl: [{name:"Woesworth",reg:"absurd",syllables:2},{name:"Lamentia",reg:"absurd",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:2},{name:"Lollypop",reg:"food",syllables:2},{name:"Gobstopper",reg:"food",syllables:2},{name:"Toffee",reg:"food",syllables:2},{name:"Sherbet",reg:"food",syllables:2},{name:"Humbug",reg:"food",syllables:2},{name:"Agatha",reg:"grand",syllables:2},{name:"Marple",reg:"grand",syllables:2},{name:"Christie",reg:"grand",syllables:2},{name:"Vera",reg:"grand",syllables:2},{name:"Tennison",reg:"grand",syllables:2},{name:"Foyle",reg:"grand",syllables:2},{name:"Cordelia",reg:"grand",syllables:2},{name:"Harriet",reg:"grand",syllables:2},{name:"Endeavour",reg:"grand",syllables:2},{name:"Gamache",reg:"grand",syllables:2},{name:"Cadfael",reg:"grand",syllables:2},{name:"Alleyn",reg:"grand",syllables:2},{name:"Billie",reg:"mundane",syllables:2},{name:"Bessie",reg:"mundane",syllables:2},{name:"Etta",reg:"mundane",syllables:2},{name:"Ella",reg:"mundane",syllables:2},{name:"Nina",reg:"mundane",syllables:2},{name:"Sarah",reg:"mundane",syllables:2},{name:"Dinah",reg:"mundane",syllables:2},{name:"Alberta",reg:"mundane",syllables:2},{name:"Memphis",reg:"mundane",syllables:2},{name:"Sippie",reg:"mundane",syllables:2},{name:"Gertrude",reg:"mundane",syllables:2},{name:"Theodora",reg:"grand",syllables:2},{name:"Araminta",reg:"grand",syllables:2},{name:"Lavinia",reg:"grand",syllables:2},{name:"Wilhelmina",reg:"grand",syllables:2},{name:"Clementine",reg:"grand",syllables:2},{name:"Octavia",reg:"grand",syllables:2},{name:"Millicent",reg:"grand",syllables:2},{name:"Dorothea",reg:"grand",syllables:2},{name:"Eugenia",reg:"grand",syllables:2},{name:"Henrietta",reg:"grand",syllables:2},{name:"Mathilda",reg:"grand",syllables:2},{name:"Rosalind",reg:"grand",syllables:2},{name:"Gwendolyn",reg:"grand",syllables:2},{name:"Arabella",reg:"grand",syllables:2},{name:"Beatrice",reg:"grand",syllables:2},{name:"Constance",reg:"grand",syllables:2},{name:"Prudence",reg:"mundane",syllables:2},{name:"Patience",reg:"mundane",syllables:2},{name:"Temperance",reg:"mundane",syllables:2},{name:"Tallulah",reg:"grand",syllables:2},{name:"Thomasina",reg:"grand",syllables:2},{name:"Thea",reg:"mundane",syllables:2},{name:"Tilda",reg:"mundane",syllables:2},{name:"Tabitha",reg:"mundane",syllables:2},{name:"Geraldine",reg:"mundane",syllables:2},{name:"Griselda",reg:"grand",syllables:2},{name:"Felicity",reg:"mundane",syllables:2},{name:"Florence",reg:"mundane",syllables:2},{name:"Helena",reg:"grand",syllables:2},{name:"Hortense",reg:"grand",syllables:2},{name:"Penelope",reg:"grand",syllables:2},{name:"Portia",reg:"grand",syllables:2},{name:"Beatrix",reg:"grand",syllables:2},{name:"Blanche",reg:"grand",syllables:2},{name:"Dorothy",reg:"mundane",syllables:2},{name:"Delilah",reg:"mundane",syllables:2},{name:"Winifred",reg:"mundane",syllables:2},{name:"Wanda",reg:"mundane",syllables:2},{name:"Clarissa",reg:"grand",syllables:2},{name:"Cressida",reg:"grand",syllables:2},{name:"Rosemary",reg:"mundane",syllables:2},{name:"Rowena",reg:"grand",syllables:2},{name:"Lavender",reg:"mundane",syllables:2},{name:"Leonora",reg:"grand",syllables:2},{name:"Mabel",reg:"mundane",syllables:2},{name:"Marjorie",reg:"mundane",syllables:2},{name:"Muriel",reg:"mundane",syllables:2},{name:"Margot",reg:"mundane",syllables:2},{name:"Edwina",reg:"mundane",syllables:2},{name:"Eleanor",reg:"grand",syllables:2},{name:"Sylvia",reg:"mundane",syllables:2},{name:"Simone",reg:"grand",syllables:2},{name:"Natasha",reg:"mundane",syllables:2},{name:"Nicolette",reg:"grand",syllables:2},{name:"Norma",reg:"mundane",syllables:2},{name:"Adelaide",reg:"grand",syllables:2},{name:"Allegra",reg:"grand",syllables:2},{name:"Sensation",reg:"pedigree",syllables:3},{name:"Fascination",reg:"pedigree",syllables:4},{name:"Celebration",reg:"pedigree",syllables:4},{name:"Mystification",reg:"pedigree",syllables:5},{name:"Observation",reg:"pedigree",syllables:4},{name:"Anticipation",reg:"pedigree",syllables:5},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Scarlett",reg:"pedigree",syllables:2},{name:"Daydream",reg:"pedigree",syllables:2},{name:"Moonraker",reg:"pedigree",syllables:3},{name:"Nightfall",reg:"pedigree",syllables:2},{name:"Summerset",reg:"pedigree",syllables:3},{name:"Cry Baby",reg:"pedigree",syllables:3},{name:"Moon River",reg:"pedigree",syllables:3},{name:"Sweet Sensation",reg:"pedigree",syllables:4},{name:"Pure Distinction",reg:"pedigree",syllables:4},{name:"Rare Occasion",reg:"pedigree",syllables:4},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Scarlett O'Hara",reg:"pedigree",syllables:4},{name:"Lady Madonna",reg:"pedigree",syllables:5},{name:"California",reg:"pedigree",syllables:5},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Roxanne",reg:"pedigree",syllables:2},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Hayward",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2}],
  },
  greatdane: {
    boy: [{name:"Astro",reg:"grand",syllables:2},{name:"Cosmo",reg:"grand",syllables:2},{name:"Orion",reg:"grand",syllables:2},{name:"Apollo",reg:"grand",syllables:2},{name:"Nova",reg:"grand",syllables:2},{name:"Nebula",reg:"grand",syllables:2},{name:"Eclipse",reg:"grand",syllables:2},{name:"Comet",reg:"grand",syllables:2},{name:"Meteor",reg:"grand",syllables:2},{name:"Asteroid",reg:"grand",syllables:2},{name:"Orbit",reg:"grand",syllables:2},{name:"Galaxy",reg:"grand",syllables:2},{name:"Zenith",reg:"grand",syllables:2},{name:"Quasar",reg:"grand",syllables:2},{name:"Pulsar",reg:"grand",syllables:2},{name:"Magnetar",reg:"grand",syllables:2},{name:"Supernova",reg:"grand",syllables:2},{name:"Starburst",reg:"grand",syllables:2},{name:"Darkstar",reg:"grand",syllables:2},{name:"Shadowmoon",reg:"grand",syllables:2},{name:"Moonwalker",reg:"grand",syllables:2},{name:"Starwalker",reg:"grand",syllables:2},{name:"Voidwalker",reg:"grand",syllables:2},{name:"Draco",reg:"grand",syllables:2},{name:"Sirius",reg:"grand",syllables:2},{name:"Altair",reg:"grand",syllables:2},{name:"Altimeter",reg:"grand",syllables:2},{name:"Moonrock",reg:"grand",syllables:2},{name:"Stardust",reg:"grand",syllables:2},{name:"Moonfall",reg:"grand",syllables:2},{name:"Starfall",reg:"grand",syllables:2},{name:"Dawnstar",reg:"grand",syllables:2},{name:"Skyfire",reg:"grand",syllables:2},{name:"Starfire",reg:"grand",syllables:2},{name:"Eventide",reg:"grand",syllables:2},{name:"Solaris",reg:"grand",syllables:2},{name:"Lunaris",reg:"grand",syllables:2},{name:"Polaris",reg:"grand",syllables:2},{name:"Cosmos",reg:"grand",syllables:2},{name:"Galileo",reg:"grand",syllables:2},{name:"Kepler",reg:"grand",syllables:2},{name:"Hubble",reg:"grand",syllables:2},{name:"Titan",reg:"grand",syllables:2},{name:"Atlas",reg:"grand",syllables:2},{name:"Prometheus",reg:"grand",syllables:2},{name:"Jupiter",reg:"grand",syllables:2},{name:"Saturn",reg:"grand",syllables:2},{name:"Pluto",reg:"grand",syllables:2},{name:"Mercury",reg:"grand",syllables:2},{name:"Neptune",reg:"grand",syllables:2},{name:"Vulcan",reg:"grand",syllables:2},{name:"Moonbeam",reg:"grand",syllables:2},{name:"Starbeam",reg:"grand",syllables:2},{name:"Starlight",reg:"grand",syllables:2},{name:"Midnight",reg:"grand",syllables:2},{name:"Darkside",reg:"grand",syllables:2},{name:"Bloodmoon",reg:"grand",syllables:2},{name:"Outerrim",reg:"grand",syllables:2},{name:"Deepspace",reg:"grand",syllables:2},{name:"Antimatter",reg:"grand",syllables:2},{name:"Celestial",reg:"grand",syllables:2},{name:"Astral",reg:"grand",syllables:2},{name:"Crescent",reg:"grand",syllables:2},{name:"Sunspot",reg:"grand",syllables:2},{name:"Earthshine",reg:"grand",syllables:2},{name:"Moonrise",reg:"grand",syllables:2},{name:"Nightfall",reg:"grand",syllables:2},{name:"Nightshade",reg:"grand",syllables:2},{name:"Shadowmoon",reg:"grand",syllables:2},{name:"Blackstar",reg:"grand",syllables:2},{name:"Starstone",reg:"grand",syllables:2},{name:"Teacup",reg:"grand",syllables:2},{name:"Dainty",reg:"grand",syllables:2},{name:"Pocket",reg:"grand",syllables:2},{name:"Dinky",reg:"grand",syllables:2},{name:"Nimble",reg:"grand",syllables:2},{name:"Smidgeon",reg:"grand",syllables:2},{name:"Titchy",reg:"grand",syllables:2},{name:"Lilliput",reg:"grand",syllables:2}],
    girl: [{name:"Astra",reg:"grand",syllables:2},{name:"Luna",reg:"grand",syllables:2},{name:"Aurora",reg:"grand",syllables:2},{name:"Celestia",reg:"grand",syllables:2},{name:"Andromeda",reg:"grand",syllables:2},{name:"Cassiopeia",reg:"grand",syllables:2},{name:"Lyra",reg:"grand",syllables:2},{name:"Vega",reg:"grand",syllables:2},{name:"Nova",reg:"grand",syllables:2},{name:"Nebula",reg:"grand",syllables:2},{name:"Eclipse",reg:"grand",syllables:2},{name:"Stella",reg:"grand",syllables:2},{name:"Solstice",reg:"grand",syllables:2},{name:"Equinox",reg:"grand",syllables:2},{name:"Penumbra",reg:"grand",syllables:2},{name:"Umbra",reg:"grand",syllables:2},{name:"Hydra",reg:"grand",syllables:2},{name:"Starlight",reg:"grand",syllables:2},{name:"Moonlight",reg:"grand",syllables:2},{name:"Moonshadow",reg:"grand",syllables:2},{name:"Starshadow",reg:"grand",syllables:2},{name:"Moonglow",reg:"grand",syllables:2},{name:"Starglow",reg:"grand",syllables:2},{name:"Moonbeam",reg:"grand",syllables:2},{name:"Starbeam",reg:"grand",syllables:2},{name:"Moonstone",reg:"grand",syllables:2},{name:"Stardust",reg:"grand",syllables:2},{name:"Celestia",reg:"grand",syllables:2},{name:"Lunaris",reg:"grand",syllables:2},{name:"Dawnstar",reg:"grand",syllables:2},{name:"Eventide",reg:"grand",syllables:2},{name:"Twilight",reg:"grand",syllables:2},{name:"Midnight",reg:"grand",syllables:2},{name:"Crescent",reg:"grand",syllables:2},{name:"Bloodmoon",reg:"grand",syllables:2},{name:"Silvermoon",reg:"grand",syllables:2},{name:"Goldenmoon",reg:"grand",syllables:2},{name:"Nightglow",reg:"grand",syllables:2},{name:"Moonfire",reg:"grand",syllables:2},{name:"Starfire",reg:"grand",syllables:2},{name:"Nightshade",reg:"grand",syllables:2},{name:"Cosmic",reg:"grand",syllables:2},{name:"Aurora",reg:"grand",syllables:2},{name:"Solaris",reg:"grand",syllables:2},{name:"Astraea",reg:"grand",syllables:2},{name:"Vela",reg:"grand",syllables:2},{name:"Carina",reg:"grand",syllables:2},{name:"Seraphina",reg:"grand",syllables:2},{name:"Andromeda",reg:"grand",syllables:2},{name:"Titania",reg:"grand",syllables:2},{name:"Calypso",reg:"grand",syllables:2},{name:"Elara",reg:"grand",syllables:2},{name:"Callisto",reg:"grand",syllables:2},{name:"Ganymede",reg:"grand",syllables:2},{name:"Io",reg:"grand",syllables:2},{name:"Titchy",reg:"grand",syllables:2},{name:"Dainty",reg:"grand",syllables:2},{name:"Pixie",reg:"grand",syllables:2},{name:"Twiggy",reg:"grand",syllables:2},{name:"Petite",reg:"grand",syllables:2},{name:"Speck",reg:"grand",syllables:2},{name:"Smidge",reg:"grand",syllables:2}],
  },
  giant: {
    boy: [{name:"Teacup",reg:"ironic",syllables:2},{name:"Dainty",reg:"ironic",syllables:2},{name:"Nimble",reg:"ironic",syllables:2},{name:"Tinykins",reg:"ironic",syllables:3},{name:"Teeny",reg:"ironic",syllables:2},{name:"Petite",reg:"ironic",syllables:2},{name:"Gossamer",reg:"ironic",syllables:3},{name:"Smidgeon",reg:"ironic",syllables:2},{name:"Titchy",reg:"ironic",syllables:2},{name:"Dinky",reg:"ironic",syllables:2},{name:"Lilliput",reg:"ironic",syllables:3},{name:"Pocket",reg:"ironic",syllables:2},{name:"Otto",reg:"mundane",syllables:2},{name:"Otis",reg:"mundane",syllables:2},{name:"Remy",reg:"mundane",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Stomper",reg:"chaos",syllables:2},{name:"Clomper",reg:"chaos",syllables:2},{name:"Trooper",reg:"chaos",syllables:2},{name:"Trundles",reg:"chaos",syllables:2},{name:"Lolloper",reg:"chaos",syllables:2},{name:"Shambler",reg:"chaos",syllables:2},{name:"Rumble",reg:"chaos",syllables:2},{name:"Chunk",reg:"chaos",syllables:2},{name:"Tubby",reg:"chaos",syllables:2},{name:"Waddler",reg:"chaos",syllables:2},{name:"Waddles",reg:"chaos",syllables:2},{name:"Thunderpaws",reg:"chaos",syllables:2},{name:"Bumpkin",reg:"chaos",syllables:2},{name:"Goliath",reg:"chaos",syllables:2},{name:"Bruiser",reg:"chaos",syllables:2},{name:"Bowser",reg:"chaos",syllables:2},{name:"Bonzo",reg:"chaos",syllables:2},{name:"Ovation",reg:"pedigree",syllables:3},{name:"Laureate",reg:"pedigree",syllables:3},{name:"Criterion",reg:"pedigree",syllables:4},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Revelation",reg:"pedigree",syllables:4},{name:"Dedication",reg:"pedigree",syllables:4},{name:"Reputation",reg:"pedigree",syllables:4},{name:"Satisfaction",reg:"pedigree",syllables:4},{name:"Nomination",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Cause Celebre",reg:"pedigree",syllables:4},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Grand Finale",reg:"pedigree",syllables:4},{name:"First Edition",reg:"pedigree",syllables:4},{name:"Last Waltz",reg:"pedigree",syllables:3},{name:"True Grit",reg:"pedigree",syllables:2},{name:"Bold Ambition",reg:"pedigree",syllables:4},{name:"Noble Cause",reg:"pedigree",syllables:3},{name:"Plain Sailing",reg:"pedigree",syllables:3},{name:"Full Circle",reg:"pedigree",syllables:3},{name:"Open Season",reg:"pedigree",syllables:4},{name:"Top Drawer",reg:"pedigree",syllables:3},{name:"High Society",reg:"pedigree",syllables:4},{name:"Good Authority",reg:"pedigree",syllables:5},{name:"Dark Star",reg:"pedigree",syllables:2},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Wild Rover",reg:"pedigree",syllables:3},{name:"Jukebox Hero",reg:"pedigree",syllables:4},{name:"Major Tom",reg:"pedigree",syllables:3},{name:"Golden Years",reg:"pedigree",syllables:4},{name:"Forever Young",reg:"pedigree",syllables:4},{name:"Purple Rain",reg:"pedigree",syllables:3},{name:"Bright Eyes",reg:"pedigree",syllables:2},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Moorgate",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Chalcroft",reg:"pedigree",syllables:2},{name:"Brandywell",reg:"pedigree",syllables:3},{name:"Millbrook",reg:"pedigree",syllables:2},{name:"Ashgrove",reg:"pedigree",syllables:2},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2}],
    girl: [{name:"Titchy",reg:"ironic",syllables:2},{name:"WeeDee",reg:"ironic",syllables:2},{name:"Petite",reg:"ironic",syllables:2},{name:"Dinky",reg:"ironic",syllables:2},{name:"Lilliput",reg:"ironic",syllables:3},{name:"Daintybell",reg:"ironic",syllables:3},{name:"Thistledown",reg:"ironic",syllables:3},{name:"Gossamera",reg:"ironic",syllables:3},{name:"Pixie",reg:"ironic",syllables:2},{name:"Twiggy",reg:"ironic",syllables:2},{name:"Speck",reg:"ironic",syllables:1},{name:"Smidge",reg:"ironic",syllables:1},{name:"Milly",reg:"mundane",syllables:2},{name:"Molly",reg:"mundane",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Tiddlywink",reg:"baby",syllables:3},{name:"Boadicea",reg:"grand",syllables:2},{name:"Zenobia",reg:"grand",syllables:2},{name:"Cleopatra",reg:"grand",syllables:2},{name:"Hippolyta",reg:"grand",syllables:2},{name:"Artemisia",reg:"grand",syllables:2},{name:"Theodora",reg:"grand",syllables:2},{name:"Agrippina",reg:"grand",syllables:2},{name:"Livia",reg:"grand",syllables:2},{name:"Octavia",reg:"grand",syllables:2},{name:"Hypatia",reg:"grand",syllables:2},{name:"Aspasia",reg:"grand",syllables:2},{name:"Sappho",reg:"grand",syllables:2},{name:"Medea",reg:"grand",syllables:2},{name:"Titania",reg:"grand",syllables:2},{name:"Andromache",reg:"grand",syllables:2},{name:"Cassandra",reg:"grand",syllables:2},{name:"Calypso",reg:"grand",syllables:2},{name:"Circe",reg:"grand",syllables:2},{name:"Persephone",reg:"grand",syllables:2},{name:"Demeter",reg:"grand",syllables:2},{name:"Hera",reg:"grand",syllables:2},{name:"Athena",reg:"grand",syllables:2},{name:"Artemis",reg:"grand",syllables:2},{name:"Aphrodite",reg:"grand",syllables:2},{name:"Hecate",reg:"grand",syllables:2},{name:"Selene",reg:"grand",syllables:2},{name:"Rhea",reg:"grand",syllables:2},{name:"Gaia",reg:"grand",syllables:2},{name:"Matilda",reg:"grand",syllables:2},{name:"Eleanor",reg:"grand",syllables:2},{name:"Isabeau",reg:"grand",syllables:2},{name:"Blanche",reg:"grand",syllables:2},{name:"Radegund",reg:"grand",syllables:2},{name:"Bathilde",reg:"grand",syllables:2},{name:"Clothilde",reg:"grand",syllables:2},{name:"Etheldreda",reg:"grand",syllables:2},{name:"Victoria",reg:"grand",syllables:2},{name:"Adelaide",reg:"grand",syllables:2},{name:"Charlotte",reg:"grand",syllables:2},{name:"Sophia",reg:"grand",syllables:2},{name:"Helena",reg:"grand",syllables:2},{name:"Wilhelmina",reg:"grand",syllables:2},{name:"Alexandrina",reg:"grand",syllables:2},{name:"Thomasina",reg:"grand",syllables:2},{name:"Christabel",reg:"grand",syllables:2},{name:"Rosalind",reg:"grand",syllables:2},{name:"Guinevere",reg:"grand",syllables:2},{name:"Evangeline",reg:"grand",syllables:2},{name:"Josephine",reg:"grand",syllables:2},{name:"Hildegard",reg:"grand",syllables:2},{name:"Brunhilde",reg:"grand",syllables:2},{name:"Gertrude",reg:"grand",syllables:2},{name:"Ingeborg",reg:"grand",syllables:2},{name:"Elfriede",reg:"grand",syllables:2},{name:"Mathilde",reg:"grand",syllables:2},{name:"Hedwig",reg:"grand",syllables:2},{name:"Mechthild",reg:"grand",syllables:2},{name:"Walburga",reg:"grand",syllables:2},{name:"Kunigunde",reg:"grand",syllables:2},{name:"Sieglinde",reg:"grand",syllables:2},{name:"Kriemhild",reg:"grand",syllables:2},{name:"Gudrun",reg:"grand",syllables:2},{name:"Freya",reg:"grand",syllables:2},{name:"Sigrid",reg:"grand",syllables:2},{name:"Astrid",reg:"grand",syllables:2},{name:"Ragnhild",reg:"grand",syllables:2},{name:"Thyra",reg:"grand",syllables:2},{name:"Gunhild",reg:"grand",syllables:2},{name:"Bergljot",reg:"grand",syllables:2},{name:"Ursula",reg:"grand",syllables:2},{name:"Bjorna",reg:"grand",syllables:2},{name:"Mishka",reg:"grand",syllables:2},{name:"Nanuq",reg:"grand",syllables:2},{name:"Koda",reg:"grand",syllables:2},{name:"Callista",reg:"grand",syllables:2},{name:"Brunhilda",reg:"grand",syllables:2},{name:"Arabella",reg:"grand",syllables:2},{name:"Cordelia",reg:"grand",syllables:2},{name:"Millicent",reg:"grand",syllables:2},{name:"Clementine",reg:"grand",syllables:2},{name:"Hildegarde",reg:"grand",syllables:2},{name:"Constance",reg:"grand",syllables:2},{name:"Prudence",reg:"grand",syllables:2},{name:"Patience",reg:"grand",syllables:2},{name:"Temperance",reg:"grand",syllables:2},{name:"Sophronia",reg:"grand",syllables:2},{name:"Georgiana",reg:"grand",syllables:2},{name:"Frederica",reg:"grand",syllables:2},{name:"Imogen",reg:"grand",syllables:2},{name:"Lavinia",reg:"grand",syllables:2},{name:"Henrietta",reg:"grand",syllables:2},{name:"Beatrice",reg:"grand",syllables:2},{name:"Dorothea",reg:"grand",syllables:2},{name:"Gwendolyn",reg:"grand",syllables:2},{name:"Rowena",reg:"grand",syllables:2},{name:"Rosamund",reg:"grand",syllables:2},{name:"Seraphina",reg:"grand",syllables:2},{name:"Celestine",reg:"grand",syllables:2},{name:"Rhiannon",reg:"grand",syllables:2},{name:"Ceridwen",reg:"grand",syllables:2},{name:"Branwen",reg:"grand",syllables:2},{name:"Gwenllian",reg:"grand",syllables:2},{name:"Arianrhod",reg:"grand",syllables:2},{name:"Blodwen",reg:"grand",syllables:2},{name:"Morfudd",reg:"grand",syllables:2},{name:"Tabitha",reg:"grand",syllables:2},{name:"Tallulah",reg:"grand",syllables:2},{name:"Sensation",reg:"pedigree",syllables:3},{name:"Fascination",reg:"pedigree",syllables:4},{name:"Celebration",reg:"pedigree",syllables:4},{name:"Mystification",reg:"pedigree",syllables:5},{name:"Observation",reg:"pedigree",syllables:4},{name:"Anticipation",reg:"pedigree",syllables:5},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Scarlett",reg:"pedigree",syllables:2},{name:"Daydream",reg:"pedigree",syllables:2},{name:"Moonraker",reg:"pedigree",syllables:3},{name:"Nightfall",reg:"pedigree",syllables:2},{name:"Summerset",reg:"pedigree",syllables:3},{name:"Cry Baby",reg:"pedigree",syllables:3},{name:"Moon River",reg:"pedigree",syllables:3},{name:"Sweet Sensation",reg:"pedigree",syllables:4},{name:"Pure Distinction",reg:"pedigree",syllables:4},{name:"Rare Occasion",reg:"pedigree",syllables:4},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Scarlett O'Hara",reg:"pedigree",syllables:4},{name:"Lady Madonna",reg:"pedigree",syllables:5},{name:"California",reg:"pedigree",syllables:5},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Roxanne",reg:"pedigree",syllables:2},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Hayward",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2}],
  },
  terrier: {
    boy: [{name:"Chaos",reg:"chaos",syllables:2},{name:"Havoc",reg:"chaos",syllables:2},{name:"Mayhem",reg:"chaos",syllables:2},{name:"Bedlam",reg:"chaos",syllables:2},{name:"Ruckus",reg:"chaos",syllables:2},{name:"Pandemonium",reg:"chaos",syllables:5},{name:"Anarchy",reg:"chaos",syllables:3},{name:"Turmoil",reg:"chaos",syllables:2},{name:"Kerfuffle",reg:"chaos",syllables:3},{name:"Uproar",reg:"chaos",syllables:2},{name:"Fracas",reg:"chaos",syllables:2},{name:"Commotion",reg:"chaos",syllables:3},{name:"Hullabaloo",reg:"chaos",syllables:4},{name:"Clamour",reg:"chaos",syllables:2},{name:"Rampage",reg:"chaos",syllables:2},{name:"Maelstrom",reg:"chaos",syllables:2},{name:"Melee",reg:"chaos",syllables:2},{name:"Scrumpy",reg:"chaos",syllables:2},{name:"Scamp",reg:"chaos",syllables:2},{name:"Nipper",reg:"chaos",syllables:2},{name:"Scrapper",reg:"chaos",syllables:2},{name:"Ripper",reg:"chaos",syllables:2},{name:"Skitter",reg:"chaos",syllables:2},{name:"Fidget",reg:"chaos",syllables:2},{name:"Rascal",reg:"chaos",syllables:2},{name:"Mischief",reg:"chaos",syllables:2},{name:"Trouble",reg:"chaos",syllables:2},{name:"Rowdy",reg:"chaos",syllables:2},{name:"Digger",reg:"chaos",syllables:2},{name:"Snapper",reg:"chaos",syllables:2},{name:"Scratchy",reg:"chaos",syllables:2},{name:"Scuttle",reg:"chaos",syllables:2},{name:"Spanner",reg:"chaos",syllables:2},{name:"Scamper",reg:"chaos",syllables:2},{name:"Snook",reg:"chaos",syllables:2},{name:"Bouncer",reg:"chaos",syllables:2},{name:"Ruffnut",reg:"chaos",syllables:2},{name:"Scrapper",reg:"chaos",syllables:2},{name:"Nipper",reg:"chaos",syllables:2},{name:"Ripper",reg:"chaos",syllables:2},{name:"Fidget",reg:"chaos",syllables:2},{name:"Mugsy",reg:"chaos",syllables:2},{name:"Taz",reg:"chaos",syllables:2},{name:"Dippy",reg:"chaos",syllables:2},{name:"Loony",reg:"chaos",syllables:2},{name:"Jinks",reg:"chaos",syllables:2},{name:"Ruff",reg:"chaos",syllables:2},{name:"Quickdraw",reg:"chaos",syllables:2},{name:"Brouhaha",reg:"chaos",syllables:3}],
    girl: [{name:"Frenzina",reg:"chaos",syllables:3},{name:"Rampeena",reg:"chaos",syllables:3},{name:"Pandemonia",reg:"chaos",syllables:4},{name:"Anarchia",reg:"chaos",syllables:4},{name:"Mischief",reg:"chaos",syllables:2},{name:"Turbulence",reg:"chaos",syllables:3},{name:"Whirlwind",reg:"chaos",syllables:2},{name:"Tempest",reg:"chaos",syllables:2},{name:"Gale",reg:"chaos",syllables:1},{name:"Tempesta",reg:"chaos",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Tutu",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Tiddlywink",reg:"baby",syllables:3},{name:"Scrumpy",reg:"chaos",syllables:2},{name:"Scamp",reg:"chaos",syllables:2},{name:"Nipper",reg:"chaos",syllables:2},{name:"Skittles",reg:"chaos",syllables:2},{name:"Fidget",reg:"chaos",syllables:2},{name:"Ruffles",reg:"chaos",syllables:2},{name:"Tangles",reg:"chaos",syllables:2},{name:"Tufty",reg:"chaos",syllables:2},{name:"Pipsqueak",reg:"chaos",syllables:2},{name:"Titch",reg:"chaos",syllables:2},{name:"Snippy",reg:"chaos",syllables:2},{name:"Squirt",reg:"chaos",syllables:2},{name:"Scraggy",reg:"chaos",syllables:2},{name:"Wriggles",reg:"chaos",syllables:2}],
  },
  retriever: {
    boy: [{name:"Biscuit",reg:"food",syllables:2},{name:"Pudding",reg:"food",syllables:2},{name:"Custard",reg:"food",syllables:2},{name:"Gravy",reg:"food",syllables:2},{name:"Crumble",reg:"food",syllables:2},{name:"Dumpling",reg:"food",syllables:2},{name:"Jelly",reg:"food",syllables:2},{name:"Sausage",reg:"food",syllables:2},{name:"Treacle",reg:"food",syllables:2},{name:"Syllabub",reg:"food",syllables:3},{name:"Douglas",reg:"mundane",syllables:2},{name:"Barnaby",reg:"grand",syllables:3},{name:"Edmund",reg:"grand",syllables:2},{name:"Herbert",reg:"mundane",syllables:2},{name:"Clarence",reg:"grand",syllables:2},{name:"Frederick",reg:"grand",syllables:3},{name:"Norman",reg:"mundane",syllables:2},{name:"Stanley",reg:"mundane",syllables:2},{name:"Reginald",reg:"grand",syllables:3},{name:"Humphrey",reg:"grand",syllables:2},{name:"Archibald",reg:"grand",syllables:3},{name:"William",reg:"mundane",syllables:2},{name:"Oliver",reg:"mundane",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Scampi",reg:"food",syllables:2},{name:"Nugget",reg:"food",syllables:2},{name:"Popcorn",reg:"food",syllables:2},{name:"Beans",reg:"food",syllables:2},{name:"Sizzle",reg:"food",syllables:2},{name:"Banger",reg:"food",syllables:2},{name:"Crumbs",reg:"food",syllables:2},{name:"Meatball",reg:"food",syllables:2},{name:"Chip",reg:"food",syllables:2},{name:"Chops",reg:"food",syllables:2},{name:"Scraps",reg:"food",syllables:2},{name:"Cookie",reg:"food",syllables:2},{name:"Cracker",reg:"food",syllables:2},{name:"Sprat",reg:"food",syllables:2},{name:"Kipper",reg:"food",syllables:2},{name:"Truffles",reg:"food",syllables:2},{name:"Minnow",reg:"food",syllables:2},{name:"Goose",reg:"chaos",syllables:2},{name:"Fetcher",reg:"chaos",syllables:2},{name:"Wagger",reg:"chaos",syllables:2},{name:"Wags",reg:"chaos",syllables:2},{name:"Lolloper",reg:"chaos",syllables:2},{name:"Chomper",reg:"chaos",syllables:2},{name:"Gobbler",reg:"chaos",syllables:2},{name:"Muncher",reg:"chaos",syllables:2},{name:"Barnacle",reg:"chaos",syllables:2},{name:"Shortcake",reg:"food",syllables:2},{name:"Doughnut",reg:"food",syllables:2},{name:"Bagel",reg:"food",syllables:2},{name:"Pretzel",reg:"food",syllables:2},{name:"Chips",reg:"food",syllables:2},{name:"Gherkin",reg:"food",syllables:2},{name:"Porridge",reg:"food",syllables:2},{name:"Granola",reg:"food",syllables:2},{name:"Toastie",reg:"food",syllables:2},{name:"Crusty",reg:"food",syllables:2},{name:"Crispy",reg:"food",syllables:2},{name:"Cobbler",reg:"food",syllables:2},{name:"Strudel",reg:"food",syllables:2},{name:"Tartlet",reg:"food",syllables:2},{name:"Munchie",reg:"food",syllables:2},{name:"Chewy",reg:"food",syllables:2},{name:"Cruncher",reg:"food",syllables:2},{name:"Nibbler",reg:"food",syllables:2},{name:"Scoffy",reg:"food",syllables:2},{name:"Latte",reg:"food",syllables:2},{name:"Molasses",reg:"food",syllables:2},{name:"Turnip",reg:"food",syllables:2},{name:"Parsnip",reg:"food",syllables:2},{name:"Cashew",reg:"food",syllables:2},{name:"Hazelnut",reg:"food",syllables:2},{name:"Nutmeg",reg:"food",syllables:2},{name:"Pepper",reg:"food",syllables:2},{name:"Paprika",reg:"food",syllables:2},{name:"Chutney",reg:"food",syllables:2},{name:"Ovation",reg:"pedigree",syllables:3},{name:"Laureate",reg:"pedigree",syllables:3},{name:"Criterion",reg:"pedigree",syllables:4},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Revelation",reg:"pedigree",syllables:4},{name:"Dedication",reg:"pedigree",syllables:4},{name:"Reputation",reg:"pedigree",syllables:4},{name:"Satisfaction",reg:"pedigree",syllables:4},{name:"Nomination",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Cause Celebre",reg:"pedigree",syllables:4},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Grand Finale",reg:"pedigree",syllables:4},{name:"First Edition",reg:"pedigree",syllables:4},{name:"Last Waltz",reg:"pedigree",syllables:3},{name:"True Grit",reg:"pedigree",syllables:2},{name:"Bold Ambition",reg:"pedigree",syllables:4},{name:"Noble Cause",reg:"pedigree",syllables:3},{name:"Plain Sailing",reg:"pedigree",syllables:3},{name:"Full Circle",reg:"pedigree",syllables:3},{name:"Open Season",reg:"pedigree",syllables:4},{name:"Top Drawer",reg:"pedigree",syllables:3},{name:"High Society",reg:"pedigree",syllables:4},{name:"Good Authority",reg:"pedigree",syllables:5},{name:"Dark Star",reg:"pedigree",syllables:2},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Wild Rover",reg:"pedigree",syllables:3},{name:"Jukebox Hero",reg:"pedigree",syllables:4},{name:"Major Tom",reg:"pedigree",syllables:3},{name:"Golden Years",reg:"pedigree",syllables:4},{name:"Forever Young",reg:"pedigree",syllables:4},{name:"Purple Rain",reg:"pedigree",syllables:3},{name:"Bright Eyes",reg:"pedigree",syllables:2},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Moorgate",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Chalcroft",reg:"pedigree",syllables:2},{name:"Brandywell",reg:"pedigree",syllables:3},{name:"Millbrook",reg:"pedigree",syllables:2},{name:"Ashgrove",reg:"pedigree",syllables:2},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2}],
    girl: [{name:"Treacle",reg:"food",syllables:2},{name:"Trifle",reg:"food",syllables:2},{name:"Muffin",reg:"food",syllables:2},{name:"Pudding",reg:"food",syllables:2},{name:"Eclair",reg:"food",syllables:2},{name:"Crumpet",reg:"food",syllables:2},{name:"Waffle",reg:"food",syllables:2},{name:"Biscuit",reg:"food",syllables:2},{name:"Brownie",reg:"food",syllables:2},{name:"Pavlova",reg:"food",syllables:3},{name:"Charlotte",reg:"mundane",syllables:2},{name:"Margaret",reg:"mundane",syllables:3},{name:"Dorothy",reg:"mundane",syllables:3},{name:"Edith",reg:"mundane",syllables:2},{name:"Florence",reg:"mundane",syllables:2},{name:"Beatrice",reg:"grand",syllables:3},{name:"Constance",reg:"mundane",syllables:2},{name:"Millicent",reg:"grand",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Jellybean",reg:"food",syllables:3},{name:"Candyfloss",reg:"food",syllables:3},{name:"Cupcake",reg:"food",syllables:2},{name:"Truffle",reg:"food",syllables:2},{name:"Nugget",reg:"food",syllables:2},{name:"Popcorn",reg:"food",syllables:2},{name:"Beanbag",reg:"food",syllables:2},{name:"Nibbins",reg:"food",syllables:2},{name:"Cookie",reg:"food",syllables:2},{name:"Cracker",reg:"food",syllables:2},{name:"Kipper",reg:"food",syllables:2},{name:"Sardine",reg:"food",syllables:2},{name:"Prawn",reg:"food",syllables:2},{name:"Pickles",reg:"food",syllables:2},{name:"Pippin",reg:"food",syllables:2},{name:"Pip",reg:"food",syllables:2},{name:"Pipsqueak",reg:"food",syllables:2},{name:"Sprout",reg:"food",syllables:2},{name:"Goose",reg:"food",syllables:2},{name:"Smudge",reg:"food",syllables:2},{name:"Splodge",reg:"food",syllables:2},{name:"Shortcake",reg:"food",syllables:2},{name:"Sprinkles",reg:"food",syllables:2},{name:"Doughnut",reg:"food",syllables:2},{name:"Marshmallow",reg:"food",syllables:2},{name:"Meringue",reg:"food",syllables:2},{name:"Latte",reg:"food",syllables:2},{name:"Peaches",reg:"food",syllables:2},{name:"Cherry",reg:"food",syllables:2},{name:"Berry",reg:"food",syllables:2},{name:"Plum",reg:"food",syllables:2},{name:"Apricot",reg:"food",syllables:2},{name:"Kiwi",reg:"food",syllables:2},{name:"Mango",reg:"food",syllables:2},{name:"Melon",reg:"food",syllables:2},{name:"Smartie",reg:"food",syllables:2},{name:"Gumball",reg:"food",syllables:2},{name:"Taffy",reg:"food",syllables:2},{name:"Rolo",reg:"food",syllables:2},{name:"Cheerio",reg:"food",syllables:2},{name:"Figgy",reg:"food",syllables:2},{name:"Pumpkin",reg:"food",syllables:2},{name:"Sensation",reg:"pedigree",syllables:3},{name:"Fascination",reg:"pedigree",syllables:4},{name:"Celebration",reg:"pedigree",syllables:4},{name:"Mystification",reg:"pedigree",syllables:5},{name:"Observation",reg:"pedigree",syllables:4},{name:"Anticipation",reg:"pedigree",syllables:5},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Scarlett",reg:"pedigree",syllables:2},{name:"Daydream",reg:"pedigree",syllables:2},{name:"Moonraker",reg:"pedigree",syllables:3},{name:"Nightfall",reg:"pedigree",syllables:2},{name:"Summerset",reg:"pedigree",syllables:3},{name:"Cry Baby",reg:"pedigree",syllables:3},{name:"Moon River",reg:"pedigree",syllables:3},{name:"Sweet Sensation",reg:"pedigree",syllables:4},{name:"Pure Distinction",reg:"pedigree",syllables:4},{name:"Rare Occasion",reg:"pedigree",syllables:4},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Scarlett O'Hara",reg:"pedigree",syllables:4},{name:"Lady Madonna",reg:"pedigree",syllables:5},{name:"California",reg:"pedigree",syllables:5},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Roxanne",reg:"pedigree",syllables:2},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Hayward",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2}],
  },
  collie: {
    boy: [{name:"Roy",reg:"mundane",syllables:1},{name:"Glen",reg:"mundane",syllables:1},{name:"Cap",reg:"mundane",syllables:1},{name:"Ben",reg:"mundane",syllables:1},{name:"Tam",reg:"mundane",syllables:1},{name:"Rob",reg:"mundane",syllables:1},{name:"Craig",reg:"mundane",syllables:1},{name:"Duncan",reg:"mundane",syllables:2},{name:"Angus",reg:"mundane",syllables:2},{name:"Hamish",reg:"mundane",syllables:2},{name:"Rory",reg:"mundane",syllables:2},{name:"Fergus",reg:"mundane",syllables:2},{name:"Malcolm",reg:"mundane",syllables:2},{name:"Alasdair",reg:"mundane",syllables:3},{name:"Callum",reg:"mundane",syllables:2},{name:"Fraser",reg:"mundane",syllables:2},{name:"Lachlan",reg:"mundane",syllables:2},{name:"Brodie",reg:"mundane",syllables:2},{name:"Gregor",reg:"mundane",syllables:2},{name:"Bracken",reg:"nature",syllables:2},{name:"Briar",reg:"nature",syllables:2},{name:"Flint",reg:"nature",syllables:1},{name:"Ash",reg:"nature",syllables:1},{name:"Storm",reg:"nature",syllables:1},{name:"Chase",reg:"mundane",syllables:1},{name:"Drift",reg:"mundane",syllables:1},{name:"Sage",reg:"mundane",syllables:1},{name:"Logic",reg:"mundane",syllables:2},{name:"Instinct",reg:"mundane",syllables:2},{name:"Focus",reg:"mundane",syllables:2},{name:"Radar",reg:"mundane",syllables:2},{name:"Tracker",reg:"mundane",syllables:2},{name:"Ovation",reg:"pedigree",syllables:3},{name:"Laureate",reg:"pedigree",syllables:3},{name:"Criterion",reg:"pedigree",syllables:4},{name:"Distinction",reg:"pedigree",syllables:3},{name:"True Grit",reg:"pedigree",syllables:2},{name:"Bold Ambition",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Forever Young",reg:"pedigree",syllables:4},{name:"Dark Star",reg:"pedigree",syllables:2},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"First Edition",reg:"pedigree",syllables:4},{name:"Wild Rover",reg:"pedigree",syllables:3},{name:"Resolute",reg:"grand",syllables:3},{name:"Steadfast",reg:"grand",syllables:2},{name:"Valiant",reg:"grand",syllables:3},{name:"Gallant",reg:"grand",syllables:2},{name:"Zippy",reg:"chaos",syllables:2},{name:"Rocket",reg:"chaos",syllables:2},{name:"Dash",reg:"chaos",syllables:1}],
    girl: [{name:"Meg",reg:"mundane",syllables:1},{name:"Nell",reg:"mundane",syllables:1},{name:"Jess",reg:"mundane",syllables:1},{name:"Tess",reg:"mundane",syllables:1},{name:"Bess",reg:"mundane",syllables:1},{name:"Fly",reg:"mundane",syllables:1},{name:"Dot",reg:"mundane",syllables:1},{name:"Moss",reg:"mundane",syllables:1},{name:"Glen",reg:"mundane",syllables:1},{name:"Shep",reg:"mundane",syllables:1},{name:"Catriona",reg:"mundane",syllables:4},{name:"Eilidh",reg:"mundane",syllables:2},{name:"Shona",reg:"mundane",syllables:2},{name:"Rhona",reg:"mundane",syllables:2},{name:"Fiona",reg:"mundane",syllables:3},{name:"Morag",reg:"mundane",syllables:2},{name:"Isla",reg:"mundane",syllables:2},{name:"Skye",reg:"mundane",syllables:1},{name:"Rona",reg:"mundane",syllables:2},{name:"Mirren",reg:"mundane",syllables:2},{name:"Lorna",reg:"mundane",syllables:2},{name:"Maisie",reg:"mundane",syllables:2},{name:"Fenella",reg:"mundane",syllables:3},{name:"Bonnie",reg:"mundane",syllables:2},{name:"Briar",reg:"nature",syllables:2},{name:"Bracken",reg:"nature",syllables:2},{name:"Bramble",reg:"nature",syllables:2},{name:"Heather",reg:"nature",syllables:2},{name:"Rowan",reg:"nature",syllables:2},{name:"Hazel",reg:"nature",syllables:2},{name:"Thistle",reg:"nature",syllables:2},{name:"Clover",reg:"nature",syllables:2},{name:"Sorrel",reg:"nature",syllables:2},{name:"Sensation",reg:"pedigree",syllables:3},{name:"Fascination",reg:"pedigree",syllables:4},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Celebration",reg:"pedigree",syllables:4},{name:"Anticipation",reg:"pedigree",syllables:5},{name:"Scarlett",reg:"pedigree",syllables:2},{name:"Moonraker",reg:"pedigree",syllables:3},{name:"Daydream",reg:"pedigree",syllables:2},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Rosalind",reg:"grand",syllables:3},{name:"Cordelia",reg:"grand",syllables:4},{name:"Guinevere",reg:"grand",syllables:4},{name:"Rowena",reg:"grand",syllables:3},{name:"Imogen",reg:"grand",syllables:3},{name:"Perdita",reg:"grand",syllables:3},{name:"Portia",reg:"grand",syllables:2},{name:"Beatrice",reg:"grand",syllables:3}],
  },
  poodle: {
    boy: [{name:"Existentiale",reg:"absurd",syllables:5},{name:"Paradoxe",reg:"absurd",syllables:3},{name:"Hermeneutique",reg:"absurd",syllables:5},{name:"Pierre",reg:"grand",syllables:1},{name:"Jacques",reg:"grand",syllables:1},{name:"François",reg:"grand",syllables:2},{name:"Henri",reg:"grand",syllables:2},{name:"Marcel",reg:"grand",syllables:2},{name:"Gaston",reg:"grand",syllables:2},{name:"Galileo",reg:"grand",syllables:4},{name:"Einstein",reg:"grand",syllables:2},{name:"Socrates",reg:"grand",syllables:3},{name:"Darwin",reg:"grand",syllables:2},{name:"Newton",reg:"grand",syllables:2},{name:"Freud",reg:"grand",syllables:1},{name:"Waltz",reg:"grand",syllables:2},{name:"Wittgenstein",reg:"grand",syllables:2},{name:"Plato",reg:"grand",syllables:2},{name:"Pythagoras",reg:"grand",syllables:2},{name:"Poirot",reg:"grand",syllables:2},{name:"Proust",reg:"grand",syllables:2},{name:"Pascal",reg:"grand",syllables:2},{name:"Arsène",reg:"grand",syllables:2},{name:"Blaise",reg:"grand",syllables:2},{name:"César",reg:"grand",syllables:2},{name:"Émile",reg:"grand",syllables:2},{name:"Félix",reg:"grand",syllables:2},{name:"Guy",reg:"grand",syllables:2},{name:"Hervé",reg:"grand",syllables:2},{name:"Honoré",reg:"grand",syllables:2},{name:"Jules",reg:"grand",syllables:2},{name:"Léon",reg:"grand",syllables:2},{name:"Louis",reg:"grand",syllables:2},{name:"Noël",reg:"grand",syllables:2},{name:"Raoul",reg:"grand",syllables:2},{name:"René",reg:"grand",syllables:2},{name:"Yves",reg:"grand",syllables:2},{name:"Alphonse",reg:"grand",syllables:2},{name:"Anatole",reg:"grand",syllables:2},{name:"Antoine",reg:"grand",syllables:2},{name:"Camille",reg:"grand",syllables:2},{name:"Clément",reg:"grand",syllables:2},{name:"Désiré",reg:"grand",syllables:2},{name:"Edmond",reg:"grand",syllables:2},{name:"Étienne",reg:"grand",syllables:2},{name:"Eugène",reg:"grand",syllables:2},{name:"Gilles",reg:"grand",syllables:2},{name:"Jérôme",reg:"grand",syllables:2},{name:"Julien",reg:"grand",syllables:2},{name:"Léandre",reg:"grand",syllables:2},{name:"Léopold",reg:"grand",syllables:2},{name:"Lucien",reg:"grand",syllables:2},{name:"Séraphin",reg:"grand",syllables:2},{name:"Théodore",reg:"grand",syllables:2},{name:"Valentin",reg:"grand",syllables:2},{name:"Barthélemy",reg:"grand",syllables:2},{name:"Dieudonné",reg:"grand",syllables:2},{name:"Enguerrand",reg:"grand",syllables:2},{name:"Hyacinthe",reg:"grand",syllables:2},{name:"Théophile",reg:"grand",syllables:2},{name:"Toussaint",reg:"grand",syllables:2}],
    girl: [{name:"Colette",reg:"grand",syllables:2},{name:"Marguerite",reg:"grand",syllables:3},{name:"Simone",reg:"grand",syllables:2},{name:"Yvette",reg:"grand",syllables:2},{name:"Brigitte",reg:"grand",syllables:2},{name:"Claudette",reg:"grand",syllables:2},{name:"Giselle",reg:"grand",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},{name:"Waltz",reg:"grand",syllables:2},{name:"Wisteria",reg:"grand",syllables:2},{name:"Whimsy",reg:"grand",syllables:2},{name:"Wistful",reg:"grand",syllables:2},{name:"Wanderlust",reg:"grand",syllables:2},{name:"Catriona",reg:"mundane",syllables:2},{name:"Eilidh",reg:"mundane",syllables:2},{name:"Shona",reg:"mundane",syllables:2},{name:"Rhona",reg:"mundane",syllables:2},{name:"Sine",reg:"mundane",syllables:2},{name:"Mairead",reg:"mundane",syllables:2},{name:"Iseabail",reg:"mundane",syllables:2},{name:"Marsaili",reg:"mundane",syllables:2},{name:"Seonaid",reg:"mundane",syllables:2},{name:"Muireann",reg:"mundane",syllables:2},{name:"Sorcha",reg:"mundane",syllables:2},{name:"Deirdre",reg:"mundane",syllables:2},{name:"Aoife",reg:"mundane",syllables:2},{name:"Niamh",reg:"mundane",syllables:2},{name:"Grainne",reg:"mundane",syllables:2},{name:"Saoirse",reg:"mundane",syllables:2},{name:"Brigid",reg:"mundane",syllables:2},{name:"Siobhan",reg:"mundane",syllables:2},{name:"Roisin",reg:"mundane",syllables:2},{name:"Nell",reg:"mundane",syllables:2},{name:"Jess",reg:"mundane",syllables:2},{name:"Tess",reg:"mundane",syllables:2},{name:"Bess",reg:"mundane",syllables:2},{name:"Meg",reg:"mundane",syllables:2},{name:"Fleet",reg:"mundane",syllables:2},{name:"Fly",reg:"mundane",syllables:2},{name:"Pip",reg:"mundane",syllables:2},{name:"Dot",reg:"mundane",syllables:2},{name:"Moss",reg:"mundane",syllables:2},{name:"Bracken",reg:"mundane",syllables:2},{name:"Bramble",reg:"mundane",syllables:2},{name:"Sorrel",reg:"mundane",syllables:2},{name:"Clover",reg:"mundane",syllables:2},{name:"Thistle",reg:"mundane",syllables:2},{name:"Rowan",reg:"mundane",syllables:2},{name:"Hazel",reg:"mundane",syllables:2},{name:"Willow",reg:"mundane",syllables:2},{name:"Yarrow",reg:"mundane",syllables:2},{name:"Furze",reg:"mundane",syllables:2},{name:"Gorse",reg:"mundane",syllables:2},{name:"Skye",reg:"mundane",syllables:2},{name:"Sable",reg:"mundane",syllables:2},{name:"Selkie",reg:"mundane",syllables:2},{name:"Rona",reg:"mundane",syllables:2},{name:"Raven",reg:"mundane",syllables:2},{name:"Rowena",reg:"mundane",syllables:2},{name:"Lorna",reg:"mundane",syllables:2},{name:"Maisie",reg:"mundane",syllables:2},{name:"Mirren",reg:"mundane",syllables:2},{name:"Fenella",reg:"mundane",syllables:2},{name:"Perdita",reg:"mundane",syllables:2},{name:"Portia",reg:"mundane",syllables:2},{name:"Winsome",reg:"mundane",syllables:2},{name:"Wren",reg:"mundane",syllables:2},{name:"Waverly",reg:"mundane",syllables:2},{name:"Glenna",reg:"mundane",syllables:2},{name:"Grace",reg:"mundane",syllables:2},{name:"Bonnie",reg:"mundane",syllables:2},{name:"Blair",reg:"mundane",syllables:2},{name:"Tara",reg:"mundane",syllables:2},{name:"Thea",reg:"mundane",syllables:2},{name:"Tess",reg:"mundane",syllables:2},{name:"Thistle",reg:"mundane",syllables:2},{name:"Nairn",reg:"mundane",syllables:2},{name:"Merna",reg:"mundane",syllables:2},{name:"Leith",reg:"mundane",syllables:2},{name:"Sensation",reg:"pedigree",syllables:3},{name:"Fascination",reg:"pedigree",syllables:4},{name:"Celebration",reg:"pedigree",syllables:4},{name:"Mystification",reg:"pedigree",syllables:5},{name:"Observation",reg:"pedigree",syllables:4},{name:"Anticipation",reg:"pedigree",syllables:5},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Scarlett",reg:"pedigree",syllables:2},{name:"Daydream",reg:"pedigree",syllables:2},{name:"Moonraker",reg:"pedigree",syllables:3},{name:"Nightfall",reg:"pedigree",syllables:2},{name:"Summerset",reg:"pedigree",syllables:3},{name:"Cry Baby",reg:"pedigree",syllables:3},{name:"Moon River",reg:"pedigree",syllables:3},{name:"Sweet Sensation",reg:"pedigree",syllables:4},{name:"Pure Distinction",reg:"pedigree",syllables:4},{name:"Rare Occasion",reg:"pedigree",syllables:4},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Scarlett O'Hara",reg:"pedigree",syllables:4},{name:"Lady Madonna",reg:"pedigree",syllables:5},{name:"California",reg:"pedigree",syllables:5},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Roxanne",reg:"pedigree",syllables:2},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Hayward",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2}],
  },
  dachshund: {
    boy: [{name:"Elongated",reg:"absurd",syllables:4},{name:"Horizontal",reg:"absurd",syllables:4},{name:"Extended",reg:"absurd",syllables:3},{name:"Protracted",reg:"absurd",syllables:3},{name:"Oblong",reg:"absurd",syllables:2},{name:"Longitudinal",reg:"absurd",syllables:5},{name:"Accordion",reg:"absurd",syllables:4},{name:"Telescopic",reg:"absurd",syllables:4},{name:"Klaus",reg:"grand",syllables:1},{name:"Dieter",reg:"mundane",syllables:2},{name:"Franz",reg:"mundane",syllables:1},{name:"Hans",reg:"mundane",syllables:1},{name:"Otto",reg:"mundane",syllables:2},{name:"Wolfgang",reg:"grand",syllables:2},{name:"Napoleon",reg:"grand",syllables:4},{name:"Rasputin",reg:"grand",syllables:3}],
    girl: [{name:"Slinky",reg:"absurd",syllables:2},{name:"Helga",reg:"mundane",syllables:2},{name:"Greta",reg:"mundane",syllables:2},{name:"Hilde",reg:"mundane",syllables:2},{name:"Ursula",reg:"mundane",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Gretel",reg:"mundane",syllables:2},{name:"Liesel",reg:"mundane",syllables:2},{name:"Anneliese",reg:"mundane",syllables:2},{name:"Hannelore",reg:"mundane",syllables:2},{name:"Wilhelmine",reg:"mundane",syllables:2},{name:"Trudel",reg:"mundane",syllables:2},{name:"Thekla",reg:"mundane",syllables:2},{name:"Therese",reg:"mundane",syllables:2},{name:"Traudel",reg:"mundane",syllables:2},{name:"Gretchen",reg:"mundane",syllables:2},{name:"Gerda",reg:"mundane",syllables:2},{name:"Friedel",reg:"mundane",syllables:2},{name:"Franzi",reg:"mundane",syllables:2},{name:"Hedwig",reg:"mundane",syllables:2},{name:"Inge",reg:"mundane",syllables:2},{name:"Ilse",reg:"mundane",syllables:2},{name:"Klara",reg:"mundane",syllables:2},{name:"Lotte",reg:"mundane",syllables:2},{name:"Leni",reg:"mundane",syllables:2},{name:"Marga",reg:"mundane",syllables:2},{name:"Mathilde",reg:"mundane",syllables:2},{name:"Nanni",reg:"mundane",syllables:2},{name:"Renate",reg:"mundane",syllables:2},{name:"Rosa",reg:"mundane",syllables:2},{name:"Susi",reg:"mundane",syllables:2},{name:"Ulla",reg:"mundane",syllables:2},{name:"Ursel",reg:"mundane",syllables:2},{name:"Vreni",reg:"mundane",syllables:2}],
  },
  german: {
    boy: [{name:"Heinrich",reg:"grand",syllables:2},{name:"Wolfgang",reg:"grand",syllables:2},{name:"Dieter",reg:"mundane",syllables:2},{name:"Klaus",reg:"mundane",syllables:1},{name:"Reinhard",reg:"grand",syllables:2},{name:"Manfred",reg:"mundane",syllables:2},{name:"Siegfried",reg:"grand",syllables:2},{name:"Konrad",reg:"grand",syllables:2},{name:"Ludwig",reg:"grand",syllables:2},{name:"Friedrich",reg:"grand",syllables:2},{name:"Maximilian",reg:"grand",syllables:5},{name:"Amadeus",reg:"grand",syllables:4},{name:"Beethoven",reg:"grand",syllables:3},{name:"Mozart",reg:"grand",syllables:2},{name:"Panzer",reg:"grand",syllables:2},{name:"Patton",reg:"grand",syllables:2},{name:"Pershing",reg:"grand",syllables:2},{name:"Prussian",reg:"grand",syllables:2},{name:"Praetorian",reg:"grand",syllables:2},{name:"Paladin",reg:"grand",syllables:2},{name:"Hans",reg:"mundane",syllables:2},{name:"Fritz",reg:"mundane",syllables:2},{name:"Heinz",reg:"mundane",syllables:2},{name:"Günther",reg:"mundane",syllables:2},{name:"Helmut",reg:"mundane",syllables:2},{name:"Horst",reg:"mundane",syllables:2},{name:"Jürgen",reg:"mundane",syllables:2},{name:"Bernd",reg:"mundane",syllables:2},{name:"Rolf",reg:"mundane",syllables:2},{name:"Uwe",reg:"mundane",syllables:2},{name:"Gerd",reg:"mundane",syllables:2},{name:"Detlef",reg:"mundane",syllables:2},{name:"Gottfried",reg:"mundane",syllables:2},{name:"Gerhard",reg:"mundane",syllables:2},{name:"Waldemar",reg:"mundane",syllables:2},{name:"Wilhelm",reg:"mundane",syllables:2},{name:"Ernst",reg:"mundane",syllables:2},{name:"Erich",reg:"mundane",syllables:2},{name:"Bruno",reg:"mundane",syllables:2},{name:"Herbert",reg:"mundane",syllables:2},{name:"Hubert",reg:"mundane",syllables:2},{name:"Norbert",reg:"mundane",syllables:2},{name:"Eberhard",reg:"mundane",syllables:2},{name:"Eckhard",reg:"mundane",syllables:2},{name:"Reinhold",reg:"mundane",syllables:2},{name:"Gerhardt",reg:"mundane",syllables:2},{name:"Hasso",reg:"mundane",syllables:2},{name:"Hartmut",reg:"mundane",syllables:2},{name:"Volkmar",reg:"mundane",syllables:2},{name:"Volkbert",reg:"mundane",syllables:2},{name:"Albrecht",reg:"mundane",syllables:2},{name:"Ruprecht",reg:"mundane",syllables:2},{name:"Rüdiger",reg:"mundane",syllables:2},{name:"Burkhard",reg:"mundane",syllables:2},{name:"Engelbert",reg:"mundane",syllables:2},{name:"Adalbert",reg:"mundane",syllables:2},{name:"Wulfhard",reg:"mundane",syllables:2},{name:"Baldur",reg:"mundane",syllables:2},{name:"Lothar",reg:"mundane",syllables:2},{name:"Knut",reg:"mundane",syllables:2},{name:"Kurt",reg:"mundane",syllables:2},{name:"Egon",reg:"mundane",syllables:2},{name:"Kaspar",reg:"mundane",syllables:2},{name:"Leopold",reg:"mundane",syllables:2},{name:"August",reg:"mundane",syllables:2},{name:"Gustav",reg:"mundane",syllables:2},{name:"Dietrich",reg:"mundane",syllables:2},{name:"Ulrich",reg:"mundane",syllables:2},{name:"Werner",reg:"mundane",syllables:2},{name:"Wolfram",reg:"mundane",syllables:2},{name:"Wendelin",reg:"mundane",syllables:2},{name:"Wigbert",reg:"mundane",syllables:2},{name:"Bodo",reg:"mundane",syllables:2},{name:"Hinnerk",reg:"mundane",syllables:2},{name:"Hinrich",reg:"mundane",syllables:2},{name:"Peer",reg:"mundane",syllables:2},{name:"Till",reg:"mundane",syllables:2},{name:"Torsten",reg:"mundane",syllables:2},{name:"Anselm",reg:"mundane",syllables:2},{name:"Armin",reg:"mundane",syllables:2},{name:"Hagen",reg:"mundane",syllables:2},{name:"Heiko",reg:"mundane",syllables:2},{name:"Jochen",reg:"mundane",syllables:2},{name:"Ludger",reg:"mundane",syllables:2},{name:"Rainer",reg:"mundane",syllables:2},{name:"Sönke",reg:"mundane",syllables:2},{name:"Veit",reg:"mundane",syllables:2},{name:"Wenzel",reg:"mundane",syllables:2},{name:"Xaver",reg:"mundane",syllables:2},{name:"Alois",reg:"mundane",syllables:2},{name:"Alfons",reg:"mundane",syllables:2},{name:"Sepp",reg:"mundane",syllables:2},{name:"Franzl",reg:"mundane",syllables:2},{name:"Hansi",reg:"mundane",syllables:2},{name:"Heinzi",reg:"mundane",syllables:2},{name:"Klausi",reg:"mundane",syllables:2},{name:"Günni",reg:"mundane",syllables:2},{name:"Willi",reg:"mundane",syllables:2},{name:"Rudi",reg:"mundane",syllables:2},{name:"Udo",reg:"mundane",syllables:2},{name:"Otfried",reg:"mundane",syllables:2},{name:"Ottokar",reg:"mundane",syllables:2},{name:"Tassilo",reg:"mundane",syllables:2},{name:"Quirin",reg:"mundane",syllables:2},{name:"Korbinian",reg:"mundane",syllables:2},{name:"Nepomuk",reg:"mundane",syllables:2},{name:"Ignaz",reg:"mundane",syllables:2},{name:"Pankraz",reg:"mundane",syllables:2},{name:"Bonifaz",reg:"mundane",syllables:2}],
    girl: [{name:"Hildegard",reg:"grand",syllables:2},{name:"Brunhilde",reg:"grand",syllables:2},{name:"Lieselotte",reg:"grand",syllables:2},{name:"Gertrude",reg:"grand",syllables:2},{name:"Ingeborg",reg:"grand",syllables:2},{name:"Elfriede",reg:"grand",syllables:2},{name:"Mathilde",reg:"grand",syllables:2},{name:"Hedwig",reg:"grand",syllables:2},{name:"Mechthild",reg:"grand",syllables:2},{name:"Hannelore",reg:"grand",syllables:2},{name:"Hildegunde",reg:"grand",syllables:2},{name:"Walburga",reg:"grand",syllables:2},{name:"Kunigunde",reg:"grand",syllables:2},{name:"Liselotte",reg:"grand",syllables:2},{name:"Margarethe",reg:"grand",syllables:2},{name:"Ottilie",reg:"grand",syllables:2},{name:"Rosalinde",reg:"grand",syllables:2},{name:"Sieglinde",reg:"grand",syllables:2},{name:"Ursula",reg:"grand",syllables:2},{name:"Waltraud",reg:"grand",syllables:2},{name:"Friederike",reg:"grand",syllables:2},{name:"Gerhilde",reg:"grand",syllables:2},{name:"Ilsebill",reg:"grand",syllables:2},{name:"Klothilde",reg:"grand",syllables:2},{name:"Leokadia",reg:"grand",syllables:2},{name:"Notburga",reg:"grand",syllables:2},{name:"Petronella",reg:"grand",syllables:2},{name:"Richardis",reg:"grand",syllables:2},{name:"Traudel",reg:"grand",syllables:2},{name:"Trudel",reg:"grand",syllables:2},{name:"Therese",reg:"grand",syllables:2},{name:"Thekla",reg:"grand",syllables:2},{name:"Reserl",reg:"grand",syllables:2},{name:"Lieserl",reg:"grand",syllables:2},{name:"Friedl",reg:"grand",syllables:2},{name:"Christl",reg:"grand",syllables:2},{name:"Annerl",reg:"grand",syllables:2},{name:"Zenzi",reg:"grand",syllables:2},{name:"Vroni",reg:"grand",syllables:2},{name:"Seppie",reg:"grand",syllables:2},{name:"Leni",reg:"grand",syllables:2},{name:"Gretel",reg:"grand",syllables:2},{name:"Helga",reg:"grand",syllables:2},{name:"Hilde",reg:"grand",syllables:2},{name:"Inge",reg:"grand",syllables:2},{name:"Ilse",reg:"grand",syllables:2},{name:"Klara",reg:"grand",syllables:2},{name:"Lotte",reg:"grand",syllables:2},{name:"Marga",reg:"grand",syllables:2},{name:"Nanni",reg:"grand",syllables:2},{name:"Renate",reg:"grand",syllables:2},{name:"Rosa",reg:"grand",syllables:2},{name:"Susi",reg:"grand",syllables:2},{name:"Ulla",reg:"grand",syllables:2},{name:"Ursel",reg:"grand",syllables:2},{name:"Kriemhild",reg:"grand",syllables:2},{name:"Gudrun",reg:"grand",syllables:2},{name:"Gerhild",reg:"grand",syllables:2},{name:"Swanhild",reg:"grand",syllables:2},{name:"Hildrun",reg:"grand",syllables:2},{name:"Walpurga",reg:"grand",syllables:2},{name:"Radegund",reg:"grand",syllables:2},{name:"Clothilde",reg:"grand",syllables:2},{name:"Bertha",reg:"grand",syllables:2},{name:"Stefanie",reg:"grand",syllables:2},{name:"Franziska",reg:"grand",syllables:2},{name:"Veronika",reg:"grand",syllables:2},{name:"Katharina",reg:"grand",syllables:2},{name:"Theresia",reg:"grand",syllables:2},{name:"Josefine",reg:"grand",syllables:2},{name:"Leopoldine",reg:"grand",syllables:2},{name:"Maximiliane",reg:"grand",syllables:2},{name:"Wilhelmine",reg:"grand",syllables:2},{name:"Karolina",reg:"grand",syllables:2},{name:"Antoinette",reg:"grand",syllables:2},{name:"Trixi",reg:"grand",syllables:2},{name:"Traudl",reg:"grand",syllables:2},{name:"Valkyria",reg:"grand",syllables:2},{name:"Brunhilda",reg:"grand",syllables:2},{name:"Gertraud",reg:"grand",syllables:2},{name:"Freya",reg:"grand",syllables:2},{name:"Sigrid",reg:"grand",syllables:2},{name:"Astrid",reg:"grand",syllables:2},{name:"Ragnhild",reg:"grand",syllables:2},{name:"Thyra",reg:"grand",syllables:2},{name:"Gunhild",reg:"grand",syllables:2},{name:"Bergljot",reg:"grand",syllables:2},{name:"Hilda",reg:"grand",syllables:2},{name:"Ingrid",reg:"grand",syllables:2},{name:"Sigrun",reg:"grand",syllables:2},{name:"Gerd",reg:"grand",syllables:2},{name:"Gudrid",reg:"grand",syllables:2},{name:"Hertha",reg:"grand",syllables:2},{name:"Nanna",reg:"grand",syllables:2},{name:"Runa",reg:"grand",syllables:2},{name:"Svea",reg:"grand",syllables:2},{name:"Booboo",reg:"grand",syllables:2},{name:"Mimi",reg:"grand",syllables:2},{name:"Lulu",reg:"grand",syllables:2}],
  },
  spaniel: {
    boy: [{name:"Archibald",reg:"grand",syllables:3},{name:"Wellington",reg:"grand",syllables:3},{name:"Rupert",reg:"grand",syllables:2},{name:"Cornelius",reg:"grand",syllables:4},{name:"Peregrine",reg:"grand",syllables:3},{name:"Humphrey",reg:"grand",syllables:2},{name:"Montgomery",reg:"grand",syllables:3},{name:"Algernon",reg:"grand",syllables:3},{name:"Bartholomew",reg:"grand",syllables:4},{name:"Reginald",reg:"grand",syllables:3},{name:"Auberon",reg:"grand",syllables:3},{name:"Lysander",reg:"grand",syllables:3},{name:"Skipper",reg:"chaos",syllables:2},{name:"Fetcher",reg:"chaos",syllables:2},{name:"Wagger",reg:"chaos",syllables:2},{name:"Wags",reg:"chaos",syllables:2},{name:"Splasher",reg:"chaos",syllables:2},{name:"Dasher",reg:"chaos",syllables:2},{name:"Scamper",reg:"chaos",syllables:2},{name:"Bouncer",reg:"chaos",syllables:2},{name:"Jumper",reg:"chaos",syllables:2},{name:"Pouncer",reg:"chaos",syllables:2},{name:"Rusher",reg:"chaos",syllables:2},{name:"Tumbler",reg:"chaos",syllables:2},{name:"Flipper",reg:"chaos",syllables:2},{name:"Dipper",reg:"chaos",syllables:2},{name:"Paddler",reg:"chaos",syllables:2},{name:"Tracker",reg:"chaos",syllables:2},{name:"Scooper",reg:"chaos",syllables:2},{name:"Springer",reg:"chaos",syllables:2},{name:"Armand",reg:"grand",syllables:2},{name:"Arnaud",reg:"grand",syllables:2},{name:"Auguste",reg:"grand",syllables:2},{name:"Bertrand",reg:"grand",syllables:2},{name:"Edmond",reg:"grand",syllables:2},{name:"Édouard",reg:"grand",syllables:2},{name:"Ferdinand",reg:"grand",syllables:2},{name:"Florent",reg:"grand",syllables:2},{name:"Frédéric",reg:"grand",syllables:2},{name:"Germain",reg:"grand",syllables:2},{name:"Gilbert",reg:"grand",syllables:2},{name:"Guillaume",reg:"grand",syllables:2},{name:"Hubert",reg:"grand",syllables:2},{name:"Hugues",reg:"grand",syllables:2},{name:"Joachim",reg:"grand",syllables:2},{name:"Jocelyn",reg:"grand",syllables:2},{name:"Léonard",reg:"grand",syllables:2},{name:"Marius",reg:"grand",syllables:2},{name:"Maurice",reg:"grand",syllables:2},{name:"Norbert",reg:"grand",syllables:2},{name:"Olivier",reg:"grand",syllables:2},{name:"Patrice",reg:"grand",syllables:2},{name:"Philippe",reg:"grand",syllables:2},{name:"Renaud",reg:"grand",syllables:2},{name:"Rodolphe",reg:"grand",syllables:2},{name:"Roland",reg:"grand",syllables:2},{name:"Sébastien",reg:"grand",syllables:2},{name:"Silvestre",reg:"grand",syllables:2},{name:"Urbain",reg:"grand",syllables:2},{name:"Valère",reg:"grand",syllables:2},{name:"Victor",reg:"grand",syllables:2},{name:"Xavier",reg:"grand",syllables:2},{name:"Ovation",reg:"pedigree",syllables:3},{name:"Laureate",reg:"pedigree",syllables:3},{name:"Criterion",reg:"pedigree",syllables:4},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Revelation",reg:"pedigree",syllables:4},{name:"Dedication",reg:"pedigree",syllables:4},{name:"Reputation",reg:"pedigree",syllables:4},{name:"Satisfaction",reg:"pedigree",syllables:4},{name:"Nomination",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Cause Celebre",reg:"pedigree",syllables:4},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Grand Finale",reg:"pedigree",syllables:4},{name:"First Edition",reg:"pedigree",syllables:4},{name:"Last Waltz",reg:"pedigree",syllables:3},{name:"True Grit",reg:"pedigree",syllables:2},{name:"Bold Ambition",reg:"pedigree",syllables:4},{name:"Noble Cause",reg:"pedigree",syllables:3},{name:"Plain Sailing",reg:"pedigree",syllables:3},{name:"Full Circle",reg:"pedigree",syllables:3},{name:"Open Season",reg:"pedigree",syllables:4},{name:"Top Drawer",reg:"pedigree",syllables:3},{name:"High Society",reg:"pedigree",syllables:4},{name:"Good Authority",reg:"pedigree",syllables:5},{name:"Dark Star",reg:"pedigree",syllables:2},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Wild Rover",reg:"pedigree",syllables:3},{name:"Jukebox Hero",reg:"pedigree",syllables:4},{name:"Major Tom",reg:"pedigree",syllables:3},{name:"Golden Years",reg:"pedigree",syllables:4},{name:"Forever Young",reg:"pedigree",syllables:4},{name:"Purple Rain",reg:"pedigree",syllables:3},{name:"Bright Eyes",reg:"pedigree",syllables:2},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Moorgate",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Chalcroft",reg:"pedigree",syllables:2},{name:"Brandywell",reg:"pedigree",syllables:3},{name:"Millbrook",reg:"pedigree",syllables:2},{name:"Ashgrove",reg:"pedigree",syllables:2},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2}],
    girl: [{name:"Georgiana",reg:"grand",syllables:4},{name:"Arabella",reg:"grand",syllables:4},{name:"Clementine",reg:"grand",syllables:3},{name:"Millicent",reg:"grand",syllables:3},{name:"Cordelia",reg:"grand",syllables:4},{name:"Beatrice",reg:"grand",syllables:3},{name:"Frederica",reg:"grand",syllables:4},{name:"Constance",reg:"grand",syllables:2},{name:"Imogen",reg:"grand",syllables:3},{name:"Sophronia",reg:"grand",syllables:4},{name:"Henrietta",reg:"grand",syllables:4},{name:"Lavinia",reg:"grand",syllables:4},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Sensation",reg:"pedigree",syllables:3},{name:"Fascination",reg:"pedigree",syllables:4},{name:"Celebration",reg:"pedigree",syllables:4},{name:"Mystification",reg:"pedigree",syllables:5},{name:"Observation",reg:"pedigree",syllables:4},{name:"Anticipation",reg:"pedigree",syllables:5},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Scarlett",reg:"pedigree",syllables:2},{name:"Daydream",reg:"pedigree",syllables:2},{name:"Moonraker",reg:"pedigree",syllables:3},{name:"Nightfall",reg:"pedigree",syllables:2},{name:"Summerset",reg:"pedigree",syllables:3},{name:"Cry Baby",reg:"pedigree",syllables:3},{name:"Moon River",reg:"pedigree",syllables:3},{name:"Sweet Sensation",reg:"pedigree",syllables:4},{name:"Pure Distinction",reg:"pedigree",syllables:4},{name:"Rare Occasion",reg:"pedigree",syllables:4},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Scarlett O'Hara",reg:"pedigree",syllables:4},{name:"Lady Madonna",reg:"pedigree",syllables:5},{name:"California",reg:"pedigree",syllables:5},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Roxanne",reg:"pedigree",syllables:2},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Hayward",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2}],
  },
  character: {
    boy: [{name:"Napoleon",reg:"grand",syllables:4},{name:"Rasputin",reg:"grand",syllables:3},{name:"Churchill",reg:"grand",syllables:2},{name:"Waldo",reg:"mundane",syllables:2},{name:"Homer",reg:"mundane",syllables:2},{name:"Gus",reg:"mundane",syllables:1},{name:"Alf",reg:"mundane",syllables:1},{name:"Booboo",reg:"baby",syllables:2},{name:"Noo-Noo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Goober",reg:"chaos",syllables:2},{name:"Doodle",reg:"chaos",syllables:2},{name:"Gizmo",reg:"chaos",syllables:2},{name:"Spot",reg:"chaos",syllables:2},{name:"Rex",reg:"chaos",syllables:2},{name:"Fido",reg:"chaos",syllables:2},{name:"Rover",reg:"chaos",syllables:2},{name:"Patch",reg:"chaos",syllables:2},{name:"Daffy",reg:"chaos",syllables:2},{name:"Droopy",reg:"chaos",syllables:2},{name:"Foghorn",reg:"chaos",syllables:2},{name:"Porky",reg:"chaos",syllables:2},{name:"Taz",reg:"chaos",syllables:2},{name:"Mugsy",reg:"chaos",syllables:2},{name:"Brain",reg:"chaos",syllables:2},{name:"Spook",reg:"chaos",syllables:2},{name:"Muttley",reg:"chaos",syllables:2},{name:"Chopper",reg:"chaos",syllables:2},{name:"Scrappy",reg:"chaos",syllables:2},{name:"Dippy",reg:"chaos",syllables:2},{name:"Loony",reg:"chaos",syllables:2},{name:"Boink",reg:"chaos",syllables:2},{name:"Boffo",reg:"chaos",syllables:2},{name:"Nifty",reg:"chaos",syllables:2},{name:"Zowie",reg:"chaos",syllables:2},{name:"Wiley",reg:"chaos",syllables:2},{name:"Augie",reg:"chaos",syllables:2},{name:"Henery",reg:"chaos",syllables:2},{name:"Heckle",reg:"chaos",syllables:2},{name:"Jeckle",reg:"chaos",syllables:2},{name:"Woody",reg:"chaos",syllables:2},{name:"Jinks",reg:"chaos",syllables:2},{name:"Ruff",reg:"chaos",syllables:2},{name:"Reddy",reg:"chaos",syllables:2},{name:"Pooch",reg:"chaos",syllables:2},{name:"Bugsy",reg:"chaos",syllables:2},{name:"Cheepy",reg:"chaos",syllables:2},{name:"Peppo",reg:"chaos",syllables:2},{name:"Brutus",reg:"chaos",syllables:2},{name:"Poppet",reg:"chaos",syllables:2},{name:"Mighty",reg:"chaos",syllables:2},{name:"Bumblywink",reg:"chaos",syllables:2},{name:"Snaggleboss",reg:"chaos",syllables:2},{name:"Dastard",reg:"chaos",syllables:2},{name:"Mazilla",reg:"chaos",syllables:2},{name:"Ricochet",reg:"chaos",syllables:2},{name:"Yakker",reg:"chaos",syllables:2},{name:"Quickdraw",reg:"chaos",syllables:2},{name:"Topdog",reg:"chaos",syllables:2},{name:"Silvester",reg:"chaos",syllables:2},{name:"Elmo",reg:"chaos",syllables:2},{name:"Hootenanny",reg:"chaos",syllables:2},{name:"Snickerdoodle",reg:"chaos",syllables:2},{name:"Skedaddle",reg:"chaos",syllables:2},{name:"Benny",reg:"chaos",syllables:2},{name:"Chumley",reg:"chaos",syllables:2},{name:"Huckleberry",reg:"chaos",syllables:2},{name:"Peabody",reg:"chaos",syllables:2},{name:"Sherman",reg:"chaos",syllables:2},{name:"Wimpy",reg:"chaos",syllables:2},{name:"Wiggles",reg:"chaos",syllables:2},{name:"Jitters",reg:"chaos",syllables:2},{name:"Boink",reg:"chaos",syllables:2},{name:"Bungle",reg:"chaos",syllables:2},{name:"Bingo",reg:"chaos",syllables:2},{name:"Snoopy",reg:"chaos",syllables:2},{name:"Scooby",reg:"chaos",syllables:2},{name:"Pluto",reg:"chaos",syllables:2},{name:"Goofy",reg:"chaos",syllables:2},{name:"Bonzo",reg:"chaos",syllables:2},{name:"Clovis",reg:"grand",syllables:2},{name:"Gustave",reg:"grand",syllables:2},{name:"Isidore",reg:"grand",syllables:2},{name:"Narcisse",reg:"grand",syllables:2},{name:"Octave",reg:"grand",syllables:2},{name:"Prosper",reg:"grand",syllables:2},{name:"Modeste",reg:"grand",syllables:2},{name:"Pigeon",reg:"chaos",syllables:2},{name:"Goose",reg:"chaos",syllables:2},{name:"Weasel",reg:"chaos",syllables:2},{name:"Ferret",reg:"chaos",syllables:2},{name:"Otter",reg:"chaos",syllables:2},{name:"Lobster",reg:"chaos",syllables:2},{name:"Prawn",reg:"chaos",syllables:2},{name:"Sprat",reg:"chaos",syllables:2},{name:"Barnacle",reg:"chaos",syllables:2},{name:"Scrumpy",reg:"chaos",syllables:2},{name:"Nipper",reg:"chaos",syllables:2},{name:"Yapper",reg:"chaos",syllables:2},{name:"Snorter",reg:"chaos",syllables:2},{name:"Wriggler",reg:"chaos",syllables:2},{name:"Wobbler",reg:"chaos",syllables:2},{name:"Tumbler",reg:"chaos",syllables:2},{name:"Pogo",reg:"chaos",syllables:2},{name:"Zippy",reg:"chaos",syllables:2},{name:"Whizz",reg:"chaos",syllables:2},{name:"Radish",reg:"food",syllables:2},{name:"Cabbage",reg:"food",syllables:2},{name:"Turnip",reg:"food",syllables:2},{name:"Parsnip",reg:"food",syllables:2},{name:"Lentil",reg:"food",syllables:2},{name:"Chickpea",reg:"food",syllables:2},{name:"Pistachio",reg:"food",syllables:2},{name:"Hazelnut",reg:"food",syllables:2},{name:"Gumball",reg:"food",syllables:2},{name:"Smartie",reg:"food",syllables:2},{name:"Crunchie",reg:"food",syllables:2},{name:"Oreo",reg:"food",syllables:2},{name:"Cheerio",reg:"food",syllables:2},{name:"Granola",reg:"food",syllables:2},{name:"Porridge",reg:"food",syllables:2},{name:"Strudel",reg:"food",syllables:2},{name:"Cobbler",reg:"food",syllables:2},{name:"Pretzel",reg:"food",syllables:2},{name:"Bagel",reg:"food",syllables:2},{name:"Molasses",reg:"food",syllables:2},{name:"Marmalade",reg:"food",syllables:2},{name:"Jammy",reg:"food",syllables:2},{name:"Pepper",reg:"food",syllables:2},{name:"Paprika",reg:"food",syllables:2},{name:"Nutmeg",reg:"food",syllables:2},{name:"Rambo",reg:"chaos",syllables:2},{name:"Rocky",reg:"chaos",syllables:2},{name:"Cobra",reg:"chaos",syllables:2},{name:"Dutch",reg:"mundane",syllables:1},{name:"Conan",reg:"grand",syllables:2},{name:"Blade",reg:"chaos",syllables:1},{name:"Sly",reg:"mundane",syllables:1},{name:"Arnie",reg:"mundane",syllables:2},{name:"Chuck",reg:"mundane",syllables:1},{name:"Bruce",reg:"mundane",syllables:1},{name:"Clint",reg:"mundane",syllables:1},{name:"Snake",reg:"chaos",syllables:1},{name:"Maverick",reg:"chaos",syllables:3},{name:"Max",reg:"mundane",syllables:1},{name:"Fury",reg:"chaos",syllables:2},{name:"Dredd",reg:"chaos",syllables:1}],
    girl: [{name:"Booboo",reg:"baby",syllables:2},{name:"Tutu",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},{name:"Coco",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Jellybean",reg:"food",syllables:3},{name:"Cupcake",reg:"food",syllables:2},{name:"Candyfloss",reg:"food",syllables:3},{name:"Wibble",reg:"chaos",syllables:2},{name:"Pixie",reg:"chaos",syllables:2},{name:"Dixie",reg:"chaos",syllables:2},{name:"Mopsy",reg:"chaos",syllables:2},{name:"Fizzle",reg:"chaos",syllables:2},{name:"Nibbles",reg:"chaos",syllables:2},{name:"Tuffy",reg:"chaos",syllables:2},{name:"Toodle",reg:"chaos",syllables:2},{name:"Wizzle",reg:"chaos",syllables:2},{name:"Pipsy",reg:"chaos",syllables:2},{name:"Penelope",reg:"chaos",syllables:2},{name:"Dizzy",reg:"chaos",syllables:2},{name:"Topsy",reg:"chaos",syllables:2}],
  },
  boston: {
    boy: [
    // Gilded Age robber barons / politicians
    {name:"Cornelius",reg:"grand",syllables:4},{name:"Vanderbilt",reg:"grand",syllables:3},
    {name:"Tammany",reg:"grand",syllables:3},{name:"Rockefeller",reg:"grand",syllables:4},
    {name:"Carnegie",reg:"grand",syllables:3},{name:"JP",reg:"mundane",syllables:2},
    {name:"Ulysses",reg:"grand",syllables:3},{name:"Rutherford",reg:"grand",syllables:3},
    {name:"Chester",reg:"mundane",syllables:2},{name:"Grover",reg:"mundane",syllables:2},
    {name:"Millard",reg:"mundane",syllables:2},{name:"Franklin",reg:"grand",syllables:3},
    {name:"Theodore",reg:"grand",syllables:3},{name:"Woodrow",reg:"grand",syllables:2},
    // Classic American first names
    {name:"Beauregard",reg:"grand",syllables:4},{name:"Thaddeus",reg:"grand",syllables:3},
    {name:"Montgomery",reg:"grand",syllables:3},{name:"Jefferson",reg:"grand",syllables:3},
    {name:"Algernon",reg:"grand",syllables:3},{name:"Cornelius",reg:"grand",syllables:4},
    {name:"Fitzgerald",reg:"grand",syllables:3},{name:"Harrington",reg:"grand",syllables:3},
    {name:"Mortimer",reg:"grand",syllables:3},{name:"Percival",reg:"grand",syllables:3},
    {name:"Seward",reg:"mundane",syllables:2},{name:"Elbridge",reg:"mundane",syllables:2},
    {name:"Roscoe",reg:"mundane",syllables:2},{name:"Rufus",reg:"mundane",syllables:2},
    {name:"Hiram",reg:"mundane",syllables:2},{name:"Ezra",reg:"mundane",syllables:2},
    {name:"Levi",reg:"mundane",syllables:2},{name:"Silas",reg:"mundane",syllables:2},
    {name:"Elmer",reg:"mundane",syllables:2},{name:"Homer",reg:"mundane",syllables:2},
    // Vaudeville / street energy
    {name:"Scrappy",reg:"chaos",syllables:2},{name:"Mugsy",reg:"chaos",syllables:2},
    {name:"Knuckles",reg:"chaos",syllables:2},{name:"Buster",reg:"chaos",syllables:2},
    {name:"Rowdy",reg:"chaos",syllables:2},{name:"Dodger",reg:"chaos",syllables:2},
    {name:"Rascal",reg:"chaos",syllables:2},{name:"Scamp",reg:"chaos",syllables:2},
    {name:"Bandit",reg:"chaos",syllables:2},{name:"Wisecrack",reg:"chaos",syllables:2},
    {name:"Hotdog",reg:"chaos",syllables:2},{name:"Moxie",reg:"chaos",syllables:2},
    {name:"Spunk",reg:"chaos",syllables:1},{name:"Grit",reg:"chaos",syllables:1}
  ],
    girl: [
    // Gilded Age society women / Vaudeville stars
    {name:"Arabella",reg:"grand",syllables:4},{name:"Cordelia",reg:"grand",syllables:4},
    {name:"Millicent",reg:"grand",syllables:3},{name:"Clementine",reg:"grand",syllables:3},
    {name:"Evangeline",reg:"grand",syllables:4},{name:"Josephine",reg:"grand",syllables:4},
    {name:"Hildegarde",reg:"grand",syllables:3},{name:"Constance",reg:"grand",syllables:2},
    {name:"Prudence",reg:"mundane",syllables:2},{name:"Patience",reg:"mundane",syllables:3},
    {name:"Temperance",reg:"mundane",syllables:3},{name:"Florrie",reg:"mundane",syllables:2},
    {name:"Maisie",reg:"mundane",syllables:2},{name:"Bessie",reg:"mundane",syllables:2},
    {name:"Nellie",reg:"mundane",syllables:2},{name:"Sadie",reg:"mundane",syllables:2},
    {name:"Mamie",reg:"mundane",syllables:2},{name:"Gracie",reg:"mundane",syllables:2},
    // Vaudeville energy
    {name:"Dixie",reg:"chaos",syllables:2},{name:"Lottie",reg:"chaos",syllables:2},
    {name:"Flossie",reg:"chaos",syllables:2},{name:"Goldie",reg:"chaos",syllables:2},
    {name:"Fanny",reg:"chaos",syllables:2},{name:"Dollie",reg:"chaos",syllables:2},
    {name:"Trixie",reg:"chaos",syllables:2},{name:"Winnie",reg:"chaos",syllables:2},
    {name:"Kitty",reg:"chaos",syllables:2},{name:"Peaches",reg:"food",syllables:2},
    {name:"Moxie",reg:"chaos",syllables:2},{name:"Spunk",reg:"chaos",syllables:1},{name:"Moonbeam",reg:"grand",syllables:2},{name:"Starbeam",reg:"grand",syllables:2},{name:"Starlight",reg:"grand",syllables:2},{name:"Moonlight",reg:"grand",syllables:2},{name:"Midnight",reg:"grand",syllables:2},{name:"Darkstar",reg:"grand",syllables:2},{name:"Blackstar",reg:"grand",syllables:2},{name:"Moonstone",reg:"grand",syllables:2},{name:"Stardust",reg:"grand",syllables:2},{name:"Starfall",reg:"grand",syllables:2},{name:"Moonglow",reg:"grand",syllables:2},{name:"Starglow",reg:"grand",syllables:2},{name:"Nightshade",reg:"grand",syllables:2},{name:"Nightfall",reg:"grand",syllables:2},{name:"Skyfire",reg:"grand",syllables:2},{name:"Starfire",reg:"grand",syllables:2},{name:"Shadowmoon",reg:"grand",syllables:2},{name:"Moonwalker",reg:"grand",syllables:2},{name:"Starwalker",reg:"grand",syllables:2},{name:"Voidwalker",reg:"grand",syllables:2},{name:"Quasar",reg:"grand",syllables:2},{name:"Pulsar",reg:"grand",syllables:2},{name:"Supernova",reg:"grand",syllables:2},{name:"Magnetar",reg:"grand",syllables:2},{name:"Starburst",reg:"grand",syllables:2},{name:"Sunspot",reg:"grand",syllables:2},{name:"Celestia",reg:"grand",syllables:2},{name:"Solaris",reg:"grand",syllables:2},{name:"Lunaris",reg:"grand",syllables:2},{name:"Zenith",reg:"grand",syllables:2},{name:"Draco",reg:"grand",syllables:2},{name:"Sirius",reg:"grand",syllables:2},{name:"Altair",reg:"grand",syllables:2},{name:"Andromeda",reg:"grand",syllables:2},{name:"Umbra",reg:"grand",syllables:2},{name:"Penumbra",reg:"grand",syllables:2},{name:"Eventide",reg:"grand",syllables:2},{name:"Skyfall",reg:"grand",syllables:2},{name:"Moonfire",reg:"grand",syllables:2},{name:"Starshadow",reg:"grand",syllables:2},{name:"Moonshadow",reg:"grand",syllables:2},{name:"Starstone",reg:"grand",syllables:2},{name:"Moonrock",reg:"grand",syllables:2},{name:"Moondust",reg:"grand",syllables:2},{name:"Skydust",reg:"grand",syllables:2},{name:"Moonfall",reg:"grand",syllables:2},{name:"Dawnstar",reg:"grand",syllables:2},{name:"Nightglow",reg:"grand",syllables:2},{name:"Moonflare",reg:"grand",syllables:2},{name:"Starflare",reg:"grand",syllables:2},{name:"Sunflare",reg:"grand",syllables:2},{name:"Moonrise",reg:"grand",syllables:2},{name:"Crescent",reg:"grand",syllables:2},{name:"Darkside",reg:"grand",syllables:2},{name:"Bloodmoon",reg:"grand",syllables:2},{name:"Bluemoon",reg:"grand",syllables:2},{name:"Goldenmoon",reg:"grand",syllables:2},{name:"Silvermoon",reg:"grand",syllables:2}
  ],
  },
  welsh: {
    boy: [{name:"Dai",reg:"grand",syllables:2},{name:"Huw",reg:"grand",syllables:2},{name:"Llew",reg:"grand",syllables:2},{name:"Rhys",reg:"grand",syllables:2},{name:"Bryn",reg:"grand",syllables:2},{name:"Glyn",reg:"grand",syllables:2},{name:"Gwyn",reg:"grand",syllables:2},{name:"Twm",reg:"grand",syllables:2},{name:"Wil",reg:"grand",syllables:2},{name:"Dafydd",reg:"grand",syllables:2},{name:"Dewi",reg:"grand",syllables:2},{name:"Denzil",reg:"grand",syllables:2},{name:"Guto",reg:"grand",syllables:2},{name:"Iolo",reg:"grand",syllables:2},{name:"Iwan",reg:"grand",syllables:2},{name:"Ieuan",reg:"grand",syllables:2},{name:"Iestyn",reg:"grand",syllables:2},{name:"Ifan",reg:"grand",syllables:2},{name:"Hywel",reg:"grand",syllables:2},{name:"Rhodri",reg:"grand",syllables:2},{name:"Gethin",reg:"grand",syllables:2},{name:"Gruff",reg:"grand",syllables:2},{name:"Owain",reg:"grand",syllables:2},{name:"Osian",reg:"grand",syllables:2},{name:"Meurig",reg:"grand",syllables:2},{name:"Mael",reg:"grand",syllables:2},{name:"Emrys",reg:"grand",syllables:2},{name:"Emyr",reg:"grand",syllables:2},{name:"Eurig",reg:"grand",syllables:2},{name:"Elfed",reg:"grand",syllables:2},{name:"Tudur",reg:"grand",syllables:2},{name:"Trefor",reg:"grand",syllables:2},{name:"Arwel",reg:"grand",syllables:2},{name:"Alun",reg:"grand",syllables:2},{name:"Geraint",reg:"grand",syllables:2},{name:"Gareth",reg:"grand",syllables:2},{name:"Idris",reg:"grand",syllables:2},{name:"Morgan",reg:"grand",syllables:2},{name:"Rhun",reg:"grand",syllables:2},{name:"Selwyn",reg:"grand",syllables:2},{name:"Wyn",reg:"grand",syllables:2},{name:"Wynford",reg:"grand",syllables:2},{name:"Carwyn",reg:"grand",syllables:2},{name:"Gwion",reg:"grand",syllables:2},{name:"Harri",reg:"grand",syllables:2},{name:"Llion",reg:"grand",syllables:2},{name:"Pedr",reg:"grand",syllables:2},{name:"Pryderi",reg:"grand",syllables:2},{name:"Sion",reg:"grand",syllables:2},{name:"Steffan",reg:"grand",syllables:2},{name:"Tomos",reg:"grand",syllables:2},{name:"Vaughan",reg:"grand",syllables:2},{name:"Gruffudd",reg:"grand",syllables:2},{name:"Gwilym",reg:"grand",syllables:2},{name:"Caradog",reg:"grand",syllables:2},{name:"Cadwaladr",reg:"grand",syllables:2},{name:"Cadwallon",reg:"grand",syllables:2},{name:"Llewelyn",reg:"grand",syllables:2},{name:"Llywarch",reg:"grand",syllables:2},{name:"Llyr",reg:"grand",syllables:2},{name:"Madoc",reg:"grand",syllables:2},{name:"Mabon",reg:"grand",syllables:2},{name:"Aneurin",reg:"grand",syllables:2},{name:"Dyfrig",reg:"grand",syllables:2},{name:"Talfryn",reg:"grand",syllables:2},{name:"Bleddyn",reg:"grand",syllables:2},{name:"Bedwyr",reg:"grand",syllables:2},{name:"Cledwyn",reg:"grand",syllables:2},{name:"Islwyn",reg:"grand",syllables:2},{name:"Ifor",reg:"grand",syllables:2},{name:"Taliesin",reg:"grand",syllables:2},{name:"Tegid",reg:"grand",syllables:2},{name:"Trystan",reg:"grand",syllables:2},{name:"Berwyn",reg:"grand",syllables:2},{name:"Delwyn",reg:"grand",syllables:2},{name:"Dilwyn",reg:"grand",syllables:2},{name:"Eifion",reg:"grand",syllables:2},{name:"Elidyr",reg:"grand",syllables:2},{name:"Gwyndaf",reg:"grand",syllables:2},{name:"Gwynfor",reg:"grand",syllables:2},{name:"Gwynne",reg:"grand",syllables:2},{name:"Heini",reg:"grand",syllables:2},{name:"Macsen",reg:"grand",syllables:2},{name:"Meredydd",reg:"grand",syllables:2},{name:"Morlais",reg:"grand",syllables:2},{name:"Rhydderch",reg:"grand",syllables:2},{name:"Tecwyn",reg:"grand",syllables:2},{name:"Wmffre",reg:"grand",syllables:2},{name:"Prys",reg:"grand",syllables:2},{name:"Gwilym",reg:"grand",syllables:2}],
    girl: [{name:"Seren",reg:"grand",syllables:2},{name:"Elin",reg:"grand",syllables:2},{name:"Ffion",reg:"grand",syllables:2},{name:"Megan",reg:"grand",syllables:2},{name:"Bethan",reg:"grand",syllables:2},{name:"Rhiannon",reg:"grand",syllables:2},{name:"Ceridwen",reg:"grand",syllables:2},{name:"Branwen",reg:"grand",syllables:2},{name:"Morfudd",reg:"grand",syllables:2},{name:"Nest",reg:"grand",syllables:2},{name:"Tangwystl",reg:"grand",syllables:2},{name:"Gwenllian",reg:"grand",syllables:2},{name:"Olwen",reg:"grand",syllables:2},{name:"Arianrhod",reg:"grand",syllables:2},{name:"Blodwen",reg:"grand",syllables:2},{name:"Catrin",reg:"grand",syllables:2},{name:"Eluned",reg:"grand",syllables:2},{name:"Enid",reg:"grand",syllables:2},{name:"Nerys",reg:"grand",syllables:2},{name:"Siân",reg:"grand",syllables:2},{name:"Angharad",reg:"grand",syllables:2},{name:"Carys",reg:"grand",syllables:2},{name:"Dilys",reg:"grand",syllables:2},{name:"Enfys",reg:"grand",syllables:2},{name:"Glenda",reg:"grand",syllables:2},{name:"Gwen",reg:"grand",syllables:2},{name:"Gweneth",reg:"grand",syllables:2},{name:"Lowri",reg:"grand",syllables:2},{name:"Mair",reg:"grand",syllables:2},{name:"Mali",reg:"grand",syllables:2},{name:"Marged",reg:"grand",syllables:2},{name:"Nesta",reg:"grand",syllables:2},{name:"Non",reg:"grand",syllables:2},{name:"Nia",reg:"grand",syllables:2},{name:"Rhian",reg:"grand",syllables:2},{name:"Rowena",reg:"grand",syllables:2},{name:"Tegwen",reg:"grand",syllables:2},{name:"Tesni",reg:"grand",syllables:2},{name:"Wenna",reg:"grand",syllables:2},{name:"Eirlys",reg:"grand",syllables:2}],
  },
  asian: {
    boy: [{name:"Phooey",reg:"chaos",syllables:2},{name:"Phony",reg:"chaos",syllables:2},{name:"Philbert",reg:"chaos",syllables:2},{name:"Phreddy",reg:"chaos",syllables:2},{name:"Phoebe",reg:"chaos",syllables:2},{name:"Phumble",reg:"chaos",syllables:2},{name:"Louie",reg:"chaos",syllables:2},{name:"Lenny",reg:"chaos",syllables:2},{name:"Lummox",reg:"chaos",syllables:2},{name:"Lotus",reg:"chaos",syllables:2},{name:"Lychee",reg:"chaos",syllables:2},{name:"Mooy",reg:"chaos",syllables:2},{name:"Mugsy",reg:"chaos",syllables:2},{name:"Mochi",reg:"chaos",syllables:2},{name:"Miso",reg:"chaos",syllables:2},{name:"Mongo",reg:"chaos",syllables:2},{name:"Tutu",reg:"chaos",syllables:2},{name:"Tater",reg:"chaos",syllables:2},{name:"Tumble",reg:"chaos",syllables:2},{name:"Tiger",reg:"chaos",syllables:2},{name:"Tofu",reg:"chaos",syllables:2},{name:"Wonton",reg:"chaos",syllables:2},{name:"Wobble",reg:"chaos",syllables:2},{name:"Wumpus",reg:"chaos",syllables:2},{name:"Wonky",reg:"chaos",syllables:2},{name:"Phony",reg:"chaos",syllables:2},{name:"Fumble",reg:"chaos",syllables:2},{name:"Fizz",reg:"chaos",syllables:2},{name:"Karate",reg:"chaos",syllables:2},{name:"Ninja",reg:"chaos",syllables:2},{name:"Samurai",reg:"chaos",syllables:2},{name:"Shogun",reg:"chaos",syllables:2},{name:"Ronin",reg:"chaos",syllables:2},{name:"Dragon",reg:"chaos",syllables:2},{name:"Sifu",reg:"chaos",syllables:2},{name:"Sensei",reg:"chaos",syllables:2},{name:"Wukong",reg:"chaos",syllables:2},{name:"Mushu",reg:"chaos",syllables:2},{name:"Shifu",reg:"chaos",syllables:2},{name:"Oogway",reg:"chaos",syllables:2},{name:"Po",reg:"chaos",syllables:2},{name:"Mantis",reg:"chaos",syllables:2},{name:"Crane",reg:"chaos",syllables:2},{name:"Viper",reg:"chaos",syllables:2},{name:"Confucius",reg:"chaos",syllables:2},{name:"Buddha",reg:"chaos",syllables:2},{name:"Zen",reg:"chaos",syllables:2},{name:"Koi",reg:"chaos",syllables:2},{name:"Jade",reg:"chaos",syllables:2},{name:"Lotus",reg:"chaos",syllables:2},{name:"Penry",reg:"chaos",syllables:2},{name:"Spot",reg:"chaos",syllables:2},{name:"Batfink",reg:"chaos",syllables:2},{name:"Napoleon",reg:"chaos",syllables:2},{name:"Gus",reg:"chaos",syllables:2},{name:"Alf",reg:"chaos",syllables:2},{name:"Homer",reg:"chaos",syllables:2},{name:"Waldo",reg:"chaos",syllables:2}],
    girl: [{name:"Lotus",reg:"grand",syllables:2},{name:"Jade",reg:"grand",syllables:2},{name:"Jasmine",reg:"grand",syllables:2},{name:"Peony",reg:"grand",syllables:2},{name:"Plum",reg:"grand",syllables:2},{name:"Lychee",reg:"grand",syllables:2},{name:"Mochi",reg:"grand",syllables:2},{name:"Yuki",reg:"grand",syllables:2},{name:"Sakura",reg:"grand",syllables:2},{name:"Kiku",reg:"grand",syllables:2},{name:"Hana",reg:"grand",syllables:2},{name:"Mei",reg:"grand",syllables:2},{name:"Xiao",reg:"grand",syllables:2},{name:"Zhen",reg:"grand",syllables:2},{name:"Nori",reg:"grand",syllables:2},{name:"Suki",reg:"grand",syllables:2},{name:"Koi",reg:"grand",syllables:2},{name:"Panda",reg:"grand",syllables:2},{name:"Tigress",reg:"grand",syllables:2},{name:"Viper",reg:"grand",syllables:2},{name:"Crane",reg:"grand",syllables:2},{name:"Mariposa",reg:"grand",syllables:2},{name:"Butterfly",reg:"grand",syllables:2},{name:"Booboo",reg:"grand",syllables:2},{name:"Gigi",reg:"grand",syllables:2},{name:"Mimi",reg:"grand",syllables:2},{name:"Fifi",reg:"grand",syllables:2},{name:"Lulu",reg:"grand",syllables:2},{name:"Coco",reg:"grand",syllables:2}],
  },
  bulldog: {
    boy: [{name:"Winston",reg:"grand",syllables:2},{name:"Churchill",reg:"grand",syllables:2},{name:"Buster",reg:"chaos",syllables:2},{name:"Bruno",reg:"chaos",syllables:2},{name:"Butch",reg:"chaos",syllables:1},{name:"Chunk",reg:"chaos",syllables:1},{name:"Basil",reg:"mundane",syllables:2},{name:"Bernard",reg:"mundane",syllables:2},{name:"Bert",reg:"mundane",syllables:1},{name:"Bill",reg:"mundane",syllables:1},{name:"Bob",reg:"mundane",syllables:1},{name:"Boris",reg:"grand",syllables:2},{name:"Brutus",reg:"grand",syllables:2},{name:"Bullseye",reg:"chaos",syllables:2},{name:"Bingo",reg:"chaos",syllables:2},{name:"Bramble",reg:"nature",syllables:2},{name:"Grumble",reg:"chaos",syllables:2},{name:"Grunt",reg:"chaos",syllables:1},{name:"Growler",reg:"chaos",syllables:2},{name:"Goliath",reg:"grand",syllables:3},{name:"Gareth",reg:"mundane",syllables:2},{name:"Gordon",reg:"mundane",syllables:2},{name:"Harold",reg:"mundane",syllables:2},{name:"Herbert",reg:"mundane",syllables:2},{name:"Hector",reg:"grand",syllables:2},{name:"Horace",reg:"mundane",syllables:2},{name:"Humphrey",reg:"grand",syllables:2},{name:"Waddle",reg:"chaos",syllables:2},{name:"Wellington",reg:"grand",syllables:3},{name:"Wobble",reg:"chaos",syllables:2},{name:"Rambo",reg:"chaos",syllables:2},{name:"Rocky",reg:"chaos",syllables:2},{name:"Cobra",reg:"chaos",syllables:2},{name:"Dutch",reg:"mundane",syllables:1},{name:"Conan",reg:"grand",syllables:2},{name:"Blade",reg:"chaos",syllables:1},{name:"Sly",reg:"mundane",syllables:1},{name:"Arnie",reg:"mundane",syllables:2},{name:"Chuck",reg:"mundane",syllables:1},{name:"Bruce",reg:"mundane",syllables:1},{name:"Clint",reg:"mundane",syllables:1},{name:"Snake",reg:"chaos",syllables:1},{name:"Maverick",reg:"chaos",syllables:3},{name:"Max",reg:"mundane",syllables:1},{name:"Fury",reg:"chaos",syllables:2},{name:"Dredd",reg:"chaos",syllables:1}],
    girl: [{name:"Bess",reg:"mundane",syllables:1},{name:"Babs",reg:"mundane",syllables:1},{name:"Bunty",reg:"mundane",syllables:2},{name:"Betty",reg:"mundane",syllables:2},{name:"Beryl",reg:"mundane",syllables:2},{name:"Brenda",reg:"mundane",syllables:2},{name:"Bridget",reg:"mundane",syllables:2},{name:"Blanche",reg:"grand",syllables:1},{name:"Barbara",reg:"mundane",syllables:3},{name:"Winnie",reg:"mundane",syllables:2},{name:"Wilhelmina",reg:"grand",syllables:5},{name:"Vera",reg:"mundane",syllables:2},{name:"Violet",reg:"mundane",syllables:3},{name:"Victoria",reg:"grand",syllables:4},{name:"Gladys",reg:"mundane",syllables:2},{name:"Grace",reg:"mundane",syllables:1},{name:"Gertrude",reg:"mundane",syllables:2},{name:"Dot",reg:"mundane",syllables:1},{name:"Dorothy",reg:"mundane",syllables:3},{name:"Ethel",reg:"mundane",syllables:2},{name:"Edna",reg:"mundane",syllables:2},{name:"Enid",reg:"mundane",syllables:2},{name:"Hilda",reg:"mundane",syllables:2},{name:"Harriet",reg:"mundane",syllables:3},{name:"Hazel",reg:"mundane",syllables:2},{name:"Mabel",reg:"mundane",syllables:2},{name:"Marge",reg:"mundane",syllables:1},{name:"Margaret",reg:"mundane",syllables:3},{name:"Wobble",reg:"chaos",syllables:2},{name:"Grumble",reg:"chaos",syllables:2}],
  },
  dalmatian: {
    boy: [{name:"Spot",reg:"mundane",syllables:1},{name:"Patch",reg:"mundane",syllables:1},{name:"Dash",reg:"mundane",syllables:1},{name:"Domino",reg:"mundane",syllables:3},{name:"Dapper",reg:"grand",syllables:2},{name:"Dots",reg:"mundane",syllables:1},{name:"Duke",reg:"grand",syllables:1},{name:"Dazzle",reg:"chaos",syllables:2},{name:"Pepper",reg:"mundane",syllables:2},{name:"Pongo",reg:"mundane",syllables:2},{name:"Perdita",reg:"grand",syllables:3},{name:"Sterling",reg:"grand",syllables:2},{name:"Speckle",reg:"mundane",syllables:2},{name:"Dapper",reg:"grand",syllables:2},{name:"Harlequin",reg:"grand",syllables:3},{name:"Jasper",reg:"grand",syllables:2},{name:"Jagger",reg:"mundane",syllables:2},{name:"Flash",reg:"chaos",syllables:1},{name:"Freckle",reg:"mundane",syllables:2},{name:"Marble",reg:"mundane",syllables:2}],
    girl: [{name:"Dot",reg:"mundane",syllables:1},{name:"Dixie",reg:"mundane",syllables:2},{name:"Dottie",reg:"mundane",syllables:2},{name:"Dapple",reg:"mundane",syllables:2},{name:"Della",reg:"mundane",syllables:2},{name:"Diana",reg:"grand",syllables:3},{name:"Duchess",reg:"grand",syllables:2},{name:"Pearl",reg:"grand",syllables:1},{name:"Pepper",reg:"mundane",syllables:2},{name:"Pippa",reg:"mundane",syllables:2},{name:"Penny",reg:"mundane",syllables:2},{name:"Patch",reg:"mundane",syllables:1},{name:"Perdita",reg:"grand",syllables:3},{name:"Polka",reg:"mundane",syllables:2},{name:"Phoebe",reg:"mundane",syllables:2},{name:"Freckle",reg:"mundane",syllables:2},{name:"Marble",reg:"mundane",syllables:2},{name:"Speckle",reg:"mundane",syllables:2},{name:"Stella",reg:"grand",syllables:2},{name:"Spotty",reg:"mundane",syllables:2}],
  },
  sheepdog: {
    boy: [{name:"Shaggy",reg:"mundane",syllables:2},{name:"Shambles",reg:"chaos",syllables:2},{name:"Shuffle",reg:"chaos",syllables:2},{name:"Shaun",reg:"mundane",syllables:1},{name:"Sherpa",reg:"mundane",syllables:2},{name:"Shedlock",reg:"mundane",syllables:2},{name:"Scruffy",reg:"chaos",syllables:2},{name:"Scruff",reg:"chaos",syllables:1},{name:"Woolly",reg:"mundane",syllables:2},{name:"Woofer",reg:"chaos",syllables:2},{name:"Wallace",reg:"mundane",syllables:2},{name:"Wellington",reg:"grand",syllables:3},{name:"Wendell",reg:"mundane",syllables:2},{name:"Wentworth",reg:"grand",syllables:2},{name:"Mop",reg:"chaos",syllables:1},{name:"Mopsy",reg:"chaos",syllables:2},{name:"Mattock",reg:"mundane",syllables:2},{name:"Merlin",reg:"grand",syllables:2},{name:"Barnaby",reg:"grand",syllables:3},{name:"Bogart",reg:"grand",syllables:2}],
    girl: [{name:"Shaggy",reg:"mundane",syllables:2},{name:"Sheila",reg:"mundane",syllables:2},{name:"Shirley",reg:"mundane",syllables:2},{name:"Shauna",reg:"mundane",syllables:2},{name:"Woolly",reg:"mundane",syllables:2},{name:"Winsome",reg:"mundane",syllables:2},{name:"Wendy",reg:"mundane",syllables:2},{name:"Winifred",reg:"mundane",syllables:3},{name:"Mopsy",reg:"chaos",syllables:2},{name:"Mop",reg:"chaos",syllables:1},{name:"Matilda",reg:"grand",syllables:3},{name:"Mabel",reg:"mundane",syllables:2},{name:"Millicent",reg:"grand",syllables:3},{name:"Bernadette",reg:"grand",syllables:4},{name:"Bungle",reg:"chaos",syllables:2},{name:"Berta",reg:"mundane",syllables:2},{name:"Blanche",reg:"grand",syllables:1},{name:"Flossie",reg:"mundane",syllables:2},{name:"Fluffy",reg:"baby",syllables:2},{name:"Flossy",reg:"mundane",syllables:2}],
  },
  lurcher: {
    boy: [{name:"Gary",reg:"mundane",syllables:2},{name:"Paul",reg:"mundane",syllables:1},{name:"Pete",reg:"mundane",syllables:1},{name:"Dave",reg:"mundane",syllables:1},{name:"Steve",reg:"mundane",syllables:1},{name:"Kev",reg:"mundane",syllables:1},{name:"Mick",reg:"mundane",syllables:1},{name:"Andy",reg:"mundane",syllables:2},{name:"Tony",reg:"mundane",syllables:2},{name:"Tommy",reg:"mundane",syllables:2},{name:"Jimmy",reg:"mundane",syllables:2},{name:"Bobby",reg:"mundane",syllables:2},{name:"Ronnie",reg:"mundane",syllables:2},{name:"Ricky",reg:"mundane",syllables:2},{name:"Billy",reg:"mundane",syllables:2},{name:"Georgie",reg:"mundane",syllables:2},{name:"Alfie",reg:"mundane",syllables:2},{name:"Eddie",reg:"mundane",syllables:2},{name:"Scrumpy",reg:"chaos",syllables:2},{name:"Weasel",reg:"chaos",syllables:2},{name:"Ferret",reg:"chaos",syllables:2},{name:"Lurk",reg:"chaos",syllables:1},{name:"Flash",reg:"chaos",syllables:1},{name:"Whip",reg:"chaos",syllables:1},{name:"Bolt",reg:"chaos",syllables:1},{name:"Ghost",reg:"mundane",syllables:1},{name:"Shadow",reg:"mundane",syllables:2},{name:"Scrap",reg:"chaos",syllables:1},{name:"Nipper",reg:"chaos",syllables:2},{name:"Dart",reg:"chaos",syllables:1},{name:"Streak",reg:"chaos",syllables:1},{name:"Pip",reg:"mundane",syllables:1},{name:"Pop",reg:"mundane",syllables:1}],
    girl: [{name:"Kayleigh",reg:"mundane",syllables:3},{name:"Tracey",reg:"mundane",syllables:2},{name:"Sharon",reg:"mundane",syllables:2},{name:"Tammy",reg:"mundane",syllables:2},{name:"Gerty",reg:"mundane",syllables:2},{name:"Bev",reg:"mundane",syllables:1},{name:"Donna",reg:"mundane",syllables:2},{name:"Karen",reg:"mundane",syllables:2},{name:"Trish",reg:"mundane",syllables:1},{name:"Chelle",reg:"mundane",syllables:1},{name:"Steph",reg:"mundane",syllables:1},{name:"Jess",reg:"mundane",syllables:1},{name:"Leanne",reg:"mundane",syllables:2},{name:"Tina",reg:"mundane",syllables:2},{name:"Kim",reg:"mundane",syllables:1},{name:"Mandy",reg:"mundane",syllables:2},{name:"Sandy",reg:"mundane",syllables:2},{name:"Candy",reg:"mundane",syllables:2},{name:"Shelley",reg:"mundane",syllables:2},{name:"Kerry",reg:"mundane",syllables:2},{name:"Wisp",reg:"mundane",syllables:1},{name:"Pip",reg:"mundane",syllables:1},{name:"Midge",reg:"mundane",syllables:1},{name:"Sprat",reg:"chaos",syllables:1},{name:"Ghost",reg:"mundane",syllables:1},{name:"Flick",reg:"chaos",syllables:1},{name:"Streak",reg:"chaos",syllables:1},{name:"Whip",reg:"chaos",syllables:1},{name:"Sprite",reg:"mundane",syllables:1},{name:"Nell",reg:"mundane",syllables:1},{name:"Sal",reg:"mundane",syllables:1},{name:"Dot",reg:"mundane",syllables:1}],
  },
  labradoodle: {
    boy: [{name:"Biscuit",reg:"food",syllables:2},{name:"Cookie",reg:"food",syllables:2},{name:"Muffin",reg:"food",syllables:2},{name:"Waffle",reg:"food",syllables:2},{name:"Pudding",reg:"food",syllables:2},{name:"Doodle",reg:"chaos",syllables:2},{name:"Bouncer",reg:"chaos",syllables:2},{name:"Fluffy",reg:"baby",syllables:2},{name:"Boing",reg:"chaos",syllables:1},{name:"Fuzzy",reg:"baby",syllables:2},{name:"Curly",reg:"mundane",syllables:2},{name:"Buddy",reg:"mundane",syllables:2},{name:"Sunny",reg:"mundane",syllables:2},{name:"Rusty",reg:"mundane",syllables:2},{name:"Teddy",reg:"baby",syllables:2},{name:"Bentley",reg:"grand",syllables:2},{name:"Barney",reg:"mundane",syllables:2},{name:"Bailey",reg:"mundane",syllables:2},{name:"Charlie",reg:"mundane",syllables:2},{name:"Cooper",reg:"mundane",syllables:2}],
    girl: [{name:"Cupcake",reg:"food",syllables:2},{name:"Muffin",reg:"food",syllables:2},{name:"Cookie",reg:"food",syllables:2},{name:"Biscuit",reg:"food",syllables:2},{name:"Honey",reg:"food",syllables:2},{name:"Caramel",reg:"food",syllables:3},{name:"Toffee",reg:"food",syllables:2},{name:"Coco",reg:"food",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Bubbly",reg:"baby",syllables:2},{name:"Flossy",reg:"mundane",syllables:2},{name:"Doodles",reg:"chaos",syllables:2},{name:"Bouncy",reg:"chaos",syllables:2},{name:"Fluffy",reg:"baby",syllables:2},{name:"Curly",reg:"mundane",syllables:2},{name:"Rosie",reg:"mundane",syllables:2},{name:"Bella",reg:"mundane",syllables:2},{name:"Daisy",reg:"mundane",syllables:2},{name:"Poppy",reg:"mundane",syllables:2},{name:"Millie",reg:"mundane",syllables:2}],
  },
  default: {
    boy: [{name:"Archibald",reg:"grand",syllables:3},{name:"Barnaby",reg:"grand",syllables:3},{name:"Cornelius",reg:"grand",syllables:4},{name:"Douglas",reg:"mundane",syllables:2},{name:"Frederick",reg:"grand",syllables:3},{name:"Herbert",reg:"mundane",syllables:2},{name:"Jasper",reg:"grand",syllables:2},{name:"Lionel",reg:"grand",syllables:3},{name:"Montgomery",reg:"grand",syllables:3},{name:"Norman",reg:"mundane",syllables:2},{name:"Percival",reg:"grand",syllables:3},{name:"Reginald",reg:"grand",syllables:3},{name:"Stanley",reg:"mundane",syllables:2},{name:"Theodore",reg:"grand",syllables:3},{name:"Vincent",reg:"grand",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Ovation",reg:"pedigree",syllables:3},{name:"Laureate",reg:"pedigree",syllables:3},{name:"Criterion",reg:"pedigree",syllables:4},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Revelation",reg:"pedigree",syllables:4},{name:"Dedication",reg:"pedigree",syllables:4},{name:"Reputation",reg:"pedigree",syllables:4},{name:"Satisfaction",reg:"pedigree",syllables:4},{name:"Nomination",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Cause Celebre",reg:"pedigree",syllables:4},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Grand Finale",reg:"pedigree",syllables:4},{name:"First Edition",reg:"pedigree",syllables:4},{name:"Last Waltz",reg:"pedigree",syllables:3},{name:"True Grit",reg:"pedigree",syllables:2},{name:"Bold Ambition",reg:"pedigree",syllables:4},{name:"Noble Cause",reg:"pedigree",syllables:3},{name:"Plain Sailing",reg:"pedigree",syllables:3},{name:"Full Circle",reg:"pedigree",syllables:3},{name:"Open Season",reg:"pedigree",syllables:4},{name:"Top Drawer",reg:"pedigree",syllables:3},{name:"High Society",reg:"pedigree",syllables:4},{name:"Good Authority",reg:"pedigree",syllables:5},{name:"Dark Star",reg:"pedigree",syllables:2},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Wild Rover",reg:"pedigree",syllables:3},{name:"Jukebox Hero",reg:"pedigree",syllables:4},{name:"Major Tom",reg:"pedigree",syllables:3},{name:"Golden Years",reg:"pedigree",syllables:4},{name:"Forever Young",reg:"pedigree",syllables:4},{name:"Purple Rain",reg:"pedigree",syllables:3},{name:"Bright Eyes",reg:"pedigree",syllables:2},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Moorgate",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Chalcroft",reg:"pedigree",syllables:2},{name:"Brandywell",reg:"pedigree",syllables:3},{name:"Millbrook",reg:"pedigree",syllables:2},{name:"Ashgrove",reg:"pedigree",syllables:2},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2}],
    girl: [{name:"Arabella",reg:"grand",syllables:4},{name:"Beatrice",reg:"grand",syllables:3},{name:"Clementine",reg:"grand",syllables:3},{name:"Dorothy",reg:"mundane",syllables:3},{name:"Eleanor",reg:"grand",syllables:3},{name:"Georgiana",reg:"grand",syllables:4},{name:"Isadora",reg:"grand",syllables:4},{name:"Lavinia",reg:"grand",syllables:4},{name:"Millicent",reg:"grand",syllables:3},{name:"Nora",reg:"mundane",syllables:2},{name:"Prudence",reg:"mundane",syllables:2},{name:"Rosalind",reg:"grand",syllables:3},{name:"Sophronia",reg:"grand",syllables:4},{name:"Tabitha",reg:"grand",syllables:3},{name:"Vivienne",reg:"grand",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Wagger",reg:"chaos",syllables:2},{name:"Wobble",reg:"chaos",syllables:2},{name:"Wriggle",reg:"chaos",syllables:2},{name:"Waddle",reg:"chaos",syllables:2},{name:"Wander",reg:"chaos",syllables:2},{name:"Wiggles",reg:"chaos",syllables:2},{name:"Sensation",reg:"pedigree",syllables:3},{name:"Fascination",reg:"pedigree",syllables:4},{name:"Celebration",reg:"pedigree",syllables:4},{name:"Mystification",reg:"pedigree",syllables:5},{name:"Observation",reg:"pedigree",syllables:4},{name:"Anticipation",reg:"pedigree",syllables:5},{name:"Temptation",reg:"pedigree",syllables:3},{name:"Distinction",reg:"pedigree",syllables:3},{name:"Scarlett",reg:"pedigree",syllables:2},{name:"Daydream",reg:"pedigree",syllables:2},{name:"Moonraker",reg:"pedigree",syllables:3},{name:"Nightfall",reg:"pedigree",syllables:2},{name:"Summerset",reg:"pedigree",syllables:3},{name:"Cry Baby",reg:"pedigree",syllables:3},{name:"Moon River",reg:"pedigree",syllables:3},{name:"Sweet Sensation",reg:"pedigree",syllables:4},{name:"Pure Distinction",reg:"pedigree",syllables:4},{name:"Rare Occasion",reg:"pedigree",syllables:4},{name:"Silver Lining",reg:"pedigree",syllables:4},{name:"Golden Moment",reg:"pedigree",syllables:4},{name:"Standing Ovation",reg:"pedigree",syllables:5},{name:"Final Curtain",reg:"pedigree",syllables:4},{name:"Scarlett O'Hara",reg:"pedigree",syllables:4},{name:"Lady Madonna",reg:"pedigree",syllables:5},{name:"California",reg:"pedigree",syllables:5},{name:"Vienna",reg:"pedigree",syllables:3},{name:"Roxanne",reg:"pedigree",syllables:2},{name:"Waterloo",reg:"pedigree",syllables:3},{name:"Fernando",reg:"pedigree",syllables:3},{name:"Hayward",reg:"pedigree",syllables:2},{name:"Winterbourne",reg:"pedigree",syllables:3},{name:"Thornfield",reg:"pedigree",syllables:2},{name:"Oakmere",reg:"pedigree",syllables:2}],
  },
};

// ── DOG WORDS ──────────────────────────────────────────────────────────────────
const DOG_WORDS: Record<string, WordEntry[]> = {
  spaniel:    [{word:"Flush",reg:"nature",firstLetter:"f"},{word:"Fetch",reg:"nature",firstLetter:"f"},{word:"Waggle",reg:"chaos",firstLetter:"w"},{word:"Splash",reg:"chaos",firstLetter:"s"},{word:"Frolic",reg:"chaos",firstLetter:"f"},{word:"Prance",reg:"grand",firstLetter:"p"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Romp",reg:"chaos",firstLetter:"r"},{word:"Paddle",reg:"mundane",firstLetter:"p"}],
  retriever:  [{word:"Fetch",reg:"nature",firstLetter:"f"},{word:"Wag",reg:"baby",firstLetter:"w"},{word:"Scoff",reg:"food",firstLetter:"s"},{word:"Snuffle",reg:"baby",firstLetter:"s"},{word:"Mooch",reg:"mundane",firstLetter:"m"},{word:"Slurp",reg:"food",firstLetter:"s"},{word:"Devour",reg:"food",firstLetter:"d"},{word:"Bound",reg:"chaos",firstLetter:"b"}],
  collie:     [{word:"Herd",reg:"grand",firstLetter:"h"},{word:"Dart",reg:"chaos",firstLetter:"d"},{word:"Circle",reg:"grand",firstLetter:"c"},{word:"Weave",reg:"grand",firstLetter:"w"},{word:"Dash",reg:"chaos",firstLetter:"d"},{word:"Sprint",reg:"chaos",firstLetter:"s"},{word:"Round",reg:"grand",firstLetter:"r"},{word:"Border",reg:"grand",firstLetter:"b"}],
  boxer:      [{word:"Charge",reg:"chaos",firstLetter:"c"},{word:"Barrel",reg:"chaos",firstLetter:"b"},{word:"Blunder",reg:"chaos",firstLetter:"b"},{word:"Crash",reg:"chaos",firstLetter:"c"},{word:"Bounce",reg:"chaos",firstLetter:"b"},{word:"Wobble",reg:"chaos",firstLetter:"w"},{word:"Stumble",reg:"chaos",firstLetter:"s"},{word:"Bumble",reg:"baby",firstLetter:"b"},{word:"Bluster",reg:"chaos",firstLetter:"b"},{word:"Gambol",reg:"chaos",firstLetter:"g"}],
  sniffer:    [{word:"Sniff",reg:"mundane",firstLetter:"s"},{word:"Sleuth",reg:"grand",firstLetter:"s"},{word:"Hunt",reg:"grand",firstLetter:"h"},{word:"Nose",reg:"mundane",firstLetter:"n"},{word:"Track",reg:"grand",firstLetter:"t"},{word:"Hound",reg:"grand",firstLetter:"h"},{word:"Quest",reg:"grand",firstLetter:"q"},{word:"Finder",reg:"grand",firstLetter:"f"}],
  afghan:     [{word:"Glide",reg:"grand",firstLetter:"g"},{word:"Sweep",reg:"grand",firstLetter:"s"},{word:"Flow",reg:"grand",firstLetter:"f"},{word:"Drift",reg:"grand",firstLetter:"d"},{word:"Surge",reg:"grand",firstLetter:"s"},{word:"Race",reg:"chaos",firstLetter:"r"},{word:"Flash",reg:"chaos",firstLetter:"f"},{word:"Streak",reg:"chaos",firstLetter:"s"},{word:"Soar",reg:"grand",firstLetter:"s"}],
  sighthound: [{word:"Sprint",reg:"grand",firstLetter:"s"},{word:"Dart",reg:"chaos",firstLetter:"d"},{word:"Bolt",reg:"chaos",firstLetter:"b"},{word:"Flash",reg:"chaos",firstLetter:"f"},{word:"Streak",reg:"chaos",firstLetter:"s"},{word:"Glide",reg:"grand",firstLetter:"g"},{word:"Scorch",reg:"chaos",firstLetter:"s"},{word:"Race",reg:"chaos",firstLetter:"r"},{word:"Sweep",reg:"grand",firstLetter:"s"}],
  greatdane:  [{word:"Orbit",reg:"grand",firstLetter:"o"},{word:"Launch",reg:"grand",firstLetter:"l"},{word:"Soar",reg:"grand",firstLetter:"s"},{word:"Surge",reg:"grand",firstLetter:"s"},{word:"Blaze",reg:"chaos",firstLetter:"b"},{word:"Streak",reg:"chaos",firstLetter:"s"},{word:"Thunder",reg:"chaos",firstLetter:"t"},{word:"Stomp",reg:"chaos",firstLetter:"s"},{word:"Lumber",reg:"chaos",firstLetter:"l"}],
  giant:      [{word:"Lumber",reg:"chaos",firstLetter:"l"},{word:"Plod",reg:"mundane",firstLetter:"p"},{word:"Stomp",reg:"chaos",firstLetter:"s"},{word:"Thud",reg:"chaos",firstLetter:"t"},{word:"Rumble",reg:"chaos",firstLetter:"r"},{word:"Sway",reg:"grand",firstLetter:"s"},{word:"Thunder",reg:"chaos",firstLetter:"t"},{word:"Shamble",reg:"chaos",firstLetter:"s"},{word:"Quake",reg:"chaos",firstLetter:"q"}],
  poodle:     [{word:"Prance",reg:"grand",firstLetter:"p"},{word:"Strut",reg:"grand",firstLetter:"s"},{word:"Waltz",reg:"grand",firstLetter:"w"},{word:"Glide",reg:"grand",firstLetter:"g"},{word:"Mince",reg:"grand",firstLetter:"m"},{word:"Flourish",reg:"grand",firstLetter:"f"},{word:"Pirouette",reg:"grand",firstLetter:"p"},{word:"Pose",reg:"grand",firstLetter:"p"},{word:"Primp",reg:"grand",firstLetter:"p"}],
  lapdog:     [{word:"Prance",reg:"grand",firstLetter:"p"},{word:"Bounce",reg:"baby",firstLetter:"b"},{word:"Waltz",reg:"grand",firstLetter:"w"},{word:"Fluff",reg:"baby",firstLetter:"f"},{word:"Pamper",reg:"baby",firstLetter:"p"},{word:"Flutter",reg:"baby",firstLetter:"f"},{word:"Sparkle",reg:"grand",firstLetter:"s"}],
  boston:     [{word:"Scrap",reg:"chaos",firstLetter:"s"},{word:"Hustle",reg:"chaos",firstLetter:"h"},{word:"Brawl",reg:"chaos",firstLetter:"b"},{word:"Charge",reg:"chaos",firstLetter:"c"},{word:"Dodge",reg:"chaos",firstLetter:"d"},{word:"Rattle",reg:"chaos",firstLetter:"r"},{word:"Jabber",reg:"chaos",firstLetter:"j"},{word:"Strut",reg:"grand",firstLetter:"s"},{word:"March",reg:"grand",firstLetter:"m"},{word:"Bluster",reg:"chaos",firstLetter:"b"}],
  welsh:      [{word:"Herd",reg:"grand",firstLetter:"h"},{word:"Chase",reg:"chaos",firstLetter:"c"},{word:"Round",reg:"grand",firstLetter:"r"},{word:"Trot",reg:"mundane",firstLetter:"t"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Circle",reg:"grand",firstLetter:"c"},{word:"Weave",reg:"grand",firstLetter:"w"}],
  asian:      [{word:"Strike",reg:"grand",firstLetter:"s"},{word:"Pounce",reg:"chaos",firstLetter:"p"},{word:"Dodge",reg:"chaos",firstLetter:"d"},{word:"Prowl",reg:"grand",firstLetter:"p"},{word:"Stalk",reg:"grand",firstLetter:"s"},{word:"Lunge",reg:"chaos",firstLetter:"l"},{word:"Waddle",reg:"chaos",firstLetter:"w"},{word:"Tumble",reg:"chaos",firstLetter:"t"},{word:"Snort",reg:"chaos",firstLetter:"s"},{word:"Shuffle",reg:"chaos",firstLetter:"s"}],
  character:  [{word:"Snort",reg:"chaos",firstLetter:"s"},{word:"Waddle",reg:"chaos",firstLetter:"w"},{word:"Tumble",reg:"chaos",firstLetter:"t"},{word:"Bumble",reg:"chaos",firstLetter:"b"},{word:"Wobble",reg:"chaos",firstLetter:"w"},{word:"Totter",reg:"chaos",firstLetter:"t"},{word:"Blunder",reg:"chaos",firstLetter:"b"},{word:"Grumble",reg:"chaos",firstLetter:"g"},{word:"Wheeze",reg:"chaos",firstLetter:"w"},{word:"Puff",reg:"chaos",firstLetter:"p"},{word:"Dawg",reg:"chaos",firstLetter:"d"}],
  terrier:    [{word:"Bolt",reg:"chaos",firstLetter:"b"},{word:"Dig",reg:"chaos",firstLetter:"d"},{word:"Scrap",reg:"chaos",firstLetter:"s"},{word:"Rumpus",reg:"chaos",firstLetter:"r"},{word:"Rattle",reg:"chaos",firstLetter:"r"},{word:"Pounce",reg:"chaos",firstLetter:"p"},{word:"Yap",reg:"chaos",firstLetter:"y"},{word:"Scurry",reg:"chaos",firstLetter:"s"},{word:"Burrow",reg:"chaos",firstLetter:"b"}],
  german:     [{word:"March",reg:"grand",firstLetter:"m"},{word:"Drill",reg:"grand",firstLetter:"d"},{word:"Patrol",reg:"grand",firstLetter:"p"},{word:"Guard",reg:"grand",firstLetter:"g"},{word:"Flank",reg:"grand",firstLetter:"f"},{word:"Advance",reg:"grand",firstLetter:"a"},{word:"Interceptor",reg:"grand",firstLetter:"i"},{word:"Secure",reg:"grand",firstLetter:"s"},{word:"Enforce",reg:"grand",firstLetter:"e"}],
  bulldog:    [{word:"Waddle",reg:"chaos",firstLetter:"w"},{word:"Shuffle",reg:"chaos",firstLetter:"s"},{word:"Lumber",reg:"chaos",firstLetter:"l"},{word:"Grunt",reg:"chaos",firstLetter:"g"},{word:"Snort",reg:"chaos",firstLetter:"s"},{word:"Grumble",reg:"chaos",firstLetter:"g"},{word:"Heave",reg:"chaos",firstLetter:"h"},{word:"Barge",reg:"chaos",firstLetter:"b"},{word:"Plod",reg:"mundane",firstLetter:"p"},{word:"Trundle",reg:"chaos",firstLetter:"t"}],
  dachshund:  [{word:"Scuttle",reg:"chaos",firstLetter:"s"},{word:"Waddle",reg:"chaos",firstLetter:"w"},{word:"Burrow",reg:"chaos",firstLetter:"b"},{word:"Squeeze",reg:"chaos",firstLetter:"s"},{word:"Tunnel",reg:"chaos",firstLetter:"t"},{word:"Wriggle",reg:"chaos",firstLetter:"w"},{word:"Slither",reg:"chaos",firstLetter:"s"},{word:"Stretch",reg:"absurd",firstLetter:"s"}],
  lurcher:    [{word:"Bolt",reg:"chaos",firstLetter:"b"},{word:"Flash",reg:"chaos",firstLetter:"f"},{word:"Streak",reg:"chaos",firstLetter:"s"},{word:"Dart",reg:"chaos",firstLetter:"d"},{word:"Lurk",reg:"mundane",firstLetter:"l"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Nip",reg:"chaos",firstLetter:"n"},{word:"Sprint",reg:"chaos",firstLetter:"s"},{word:"Ghost",reg:"mundane",firstLetter:"g"},{word:"Slip",reg:"mundane",firstLetter:"s"}],
  dalmatian:  [{word:"Dash",reg:"chaos",firstLetter:"d"},{word:"Dart",reg:"chaos",firstLetter:"d"},{word:"Dazzle",reg:"grand",firstLetter:"d"},{word:"Sprint",reg:"chaos",firstLetter:"s"},{word:"Spot",reg:"mundane",firstLetter:"s"},{word:"Flash",reg:"chaos",firstLetter:"f"},{word:"Frolic",reg:"chaos",firstLetter:"f"}],
  sheepdog:   [{word:"Shuffle",reg:"chaos",firstLetter:"s"},{word:"Shamble",reg:"chaos",firstLetter:"s"},{word:"Shaggle",reg:"chaos",firstLetter:"s"},{word:"Wobble",reg:"chaos",firstLetter:"w"},{word:"Wander",reg:"mundane",firstLetter:"w"},{word:"Mooch",reg:"mundane",firstLetter:"m"},{word:"Mosey",reg:"mundane",firstLetter:"m"},{word:"Bumble",reg:"chaos",firstLetter:"b"},{word:"Blunder",reg:"chaos",firstLetter:"b"}],
  labradoodle:[{word:"Boing",reg:"chaos",firstLetter:"b"},{word:"Flop",reg:"chaos",firstLetter:"f"},{word:"Wriggle",reg:"chaos",firstLetter:"w"},{word:"Nuzzle",reg:"baby",firstLetter:"n"},{word:"Waggle",reg:"chaos",firstLetter:"w"},{word:"Bounce",reg:"chaos",firstLetter:"b"},{word:"Fluff",reg:"baby",firstLetter:"f"},{word:"Wiggle",reg:"chaos",firstLetter:"w"},{word:"Snuggle",reg:"baby",firstLetter:"s"},{word:"Frolic",reg:"chaos",firstLetter:"f"}],
  default:    [{word:"Trot",reg:"mundane",firstLetter:"t"},{word:"Lope",reg:"mundane",firstLetter:"l"},{word:"Prowl",reg:"grand",firstLetter:"p"},{word:"Stride",reg:"grand",firstLetter:"s"},{word:"Roam",reg:"mundane",firstLetter:"r"},{word:"Slink",reg:"aloof",firstLetter:"s"},{word:"Stalk",reg:"grand",firstLetter:"s"},{word:"Saunter",reg:"mundane",firstLetter:"s"},{word:"Canter",reg:"grand",firstLetter:"c"},{word:"Wander",reg:"mundane",firstLetter:"w"}],
};

// ── REASONING ─────────────────────────────────────────────────────────────────
const REASONING: Record<string, string[]> = {
  lapdog:    ["Looks like a small cloud that someone has given opinions.","Perpetually groomed, permanently cheerful, mildly judgmental.","Has maintained this exact hairstyle for several centuries.","Arrives in a room the way a bishop arrives at a christening -- expected, overdressed, and faintly disapproving.","Four hundred years of palace living leaves a dog with very particular ideas about ceremony."],
  boxer:     ["Approaches every situation with maximum enthusiasm and minimum strategy.","Loyal, loud, and absolutely convinced that sitting on your lap is a human right.","Looks permanently surprised, even at things it caused.","Never met a stranger. This is not always helpful on military exercises.","Approaches every day as though something brilliant is about to happen. It usually involves a sock."],
  afghan:    ["Glides into a room the way a sunset enters a valley -- without asking permission.","Has never once been in a hurry. This is not laziness. This is philosophy.","Descended from the dogs of Afghan royalty. Acts accordingly.","The hair alone requires more maintenance than most people's entire lives.","Looks through you with the calm certainty of something that has outlived empires."],
  sighthound:["Forty miles per hour of elegant indifference. The earldom was awarded for sheer deportment.","Has always considered the peerage its natural social circle -- if anything, beneath it.","Has been aristocratic since before the British aristocracy was invented.","Moves through the world with the serene confidence of something that has never once been told no."],
  sniffer:   ["Has the air of a detective who solved the case three days ago and is merely waiting for everyone else.","Melancholy eyes, powerful nose, deeply suspicious of everything.","Follows a scent with the focus of a detective who has forgotten why they started.","The most expensive biological detection equipment in the world. Currently investigating a crisp packet."],
  greatdane: ["Astro from The Jetsons was a Great Dane. This dog carries on that tradition with considerably more gravitas.","Moves through a room the way a planet moves through space -- slowly, inevitably, and with gravitational consequences.","Was named Teacup at eight weeks. At eighteen months, the irony became structural.","The size alone demands a cosmic title. The personality insists on it.","Sits on your lap with complete confidence of something that weighs sixty kilograms and has access to a rocket."],
  giant:     ["So large that the title had to match the physical reality.","Was named Teacup at eight weeks. At eighteen months, the irony became structural.","Sits on your lap with complete confidence of something that weighs sixty kilograms.","Operates more like a geographic feature than an animal."],
  terrier:   ["The only dog that regularly picks fights with things three times its size and usually wins.","A terrier would consider a title an unnecessary distraction from the serious business of digging.","Six inches of righteous fury in a jacket of wiry fur.","Has declared war on the postman, the vacuum cleaner, and a leaf. Currently winning two of those."],
  retriever: ["Dependable, cheerful, and utterly convinced every situation calls for a biscuit.","Greets burglars as enthusiastically as family members.","Has never met a puddle it didn't immediately lie down in.","The only animal capable of looking genuinely hurt that there are no more biscuits."],
  collie:    ["The most intelligent dog in the world and absolutely cannot stop telling you about it.","Herds sheep, children, and visiting relatives with equal efficiency.","Has never once been off duty. Not once. Not even asleep."],
  poodle:    ["The most intelligent dog in the world and considerably better dressed than you.","Originally a water retriever, now primarily a philosopher. The doctorate was inevitable.","Breeds above itself in intelligence and consistently knows it."],
  spaniel:   ["Spaniels have commanded hunting parties since the Tudor court. A generalship was long overdue.","Floppy ears and absolute authority -- the spaniel was born to lead.","The Field Marshal of the water meadow and the reed bed since 1600."],
  boston:    ["Born in a tuxedo, died in a tuxedo, conducted all affairs in between in a tuxedo.","The most opinionated small dog in American history. Has views on tariffs.","Carries itself like a Tammany Hall ward boss who has seen things.","Emerged from 1870s Boston with an air of civic authority entirely disproportionate to its size.","Looks like it once ran for alderman and nearly won."],
  welsh:     ["A Welsh dog with a Welsh name feels like the natural order of things.","The Corgi has been a royal dog since before most European monarchies existed. Acts accordingly.","Compact, focused, and absolutely convinced it is in charge of everything within a three-mile radius.","Has herded sheep on hillsides that would make a mountain goat nervous.","Carries itself like a bard who has just composed something very good and knows it."],
  asian:     ["Carries itself like a Shaolin monk who has taken a vow of snacks.","Two thousand years of Chinese imperial breeding. Acts accordingly.","Has a face that has seen empires rise and fall. Mostly unimpressed.","Hong Kong Phooey was a bumbling janitor dog who thought he was a kung fu master. This dog has no such doubts.","The ancient breeds of Asia were temple guardians. This one guards the sofa with equal dedication."],
  character: ["A face like a fist, a personality like a party.","Breathes loudly through every social occasion with complete conviction it is doing this correctly.","Believes it is a much larger dog trapped in a terrible administrative error."],
  dachshund: ["Two thousand years of German engineering went into a dog that cannot reach most surfaces.","Moves through the world like a very short scandal.","The proportions suggest an engineering compromise was made at some point. The dog disagrees."],
  lurcher:   ["Built for speed, owned for love. A lurcher never outruns its loyalty.","Thin as a whip and twice as fast. The poacher's dog, the traveller's companion.","Looks like it's done a runner from something. Probably has.","Part greyhound, part mystery. All dog.","The working man's racehorse. Faster than it looks, smarter than it lets on."],
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
  chipmunk:"Chip",glen:"Glen",roy:"Roy",cap:"Cap",ben:"Ben",tam:"Tam",rob:"Rob",meg:"Meg",nell:"Nell",jess:"Jess",tess:"Tess",bess:"Bess",fly:"Fly",dot:"Dot",moss:"Moss",
  // German/Nordic names
  trudel:"Tru",traudel:"Traud",traudl:"Traud",
  thekla:"Divi",thyra:"Chook",theresia:"Terri",trixi:"Trixi",therese:"Terri",
  theresa:"Terri",thea:"Thea",tilda:"Tilly",tabitha:"Tabs",tallulah:"Lula",
  thomasina:"Tommy",theodora:"Teddie",temperance:"Tempy",
  hannelore:"Hanni",hildegunde:"Hilde",walburga:"Walby",mechthild:"Mechi",
  adelheid:"Addie",kunigunde:"Kuni",liselotte:"Lisi",margarethe:"Grete",
  ottilie:"Ottie",rosalinde:"Rosi",sieglinde:"Lindy",waltraud:"Traud",
  elfriede:"Elfi",friederike:"Friedi",gerhilde:"Gerhi",ilsebill:"Ilsi",
  klothilde:"Klothy",leokadia:"Leo",notburga:"Notty",petronella:"Petra",
  richardis:"Richi",
  // Scottish/Irish names
  catriona:"Cait",eilidh:"Eli",seonaid:"Shona",marsaili:"Mari",muireann:"Muri",
  aoife:"Eefa",niamh:"Nee",grainne:"Granya",saoirse:"Sersha",siobhan:"Shiv",
  // Pedigree register nicknames
  mystification:"Mysty",fascination:"Fasci",anticipation:"Tici",
  sensation:"Senny",distinction:"Disti",temptation:"Tempy",revelation:"Revi",
  celebration:"Celly",observation:"Obsy",nomination:"Nomi",satisfaction:"Sati",
  tutu:"Tutu",dizzy:"Dizzy",wizzle:"Wizz",wibble:"Wibs",womble:"Womby",
  bumblebean:"Lulz",tumblewick:"TumTum",gobblesnout:"Gobsnot",
  dafydd:"Daf",gruffudd:"Gruff",llewelyn:"Llew",cadwaladr:"Cad",llywarch:"Llyw",
  meredydd:"Mered",rhydderch:"Rhyd",gwynfor:"Gwynn",taliesin:"Tali",
  aneurin:"Nye",caradog:"Crad",bleddyn:"Bled",gwilym:"Gwil",
  wmffre:"Wmff",tecwyn:"Tech",elidyr:"Eli",gwyndaf:"Gwyn",
  moonbeam:"Moonie",starbeam:"Starby",starlight:"Starry",moonlight:"Moony",
  shadowmoon:"Shadow",darkstar:"Darky",moonwalker:"Moonwalk",starwalker:"Starwalk",
  voidwalker:"Void",eventhorizon:"Horizon",supernova:"Nova",magnetar:"Mag",
  andromeda:"Romy",celestia:"Celi",lunaris:"Luna",penumbra:"Penny",
  spogmai:"Spogi",laleh:"Lali",mahsa:"Mahi",noura:"Nouri",lujain:"Lulu",maysa:"Mays",zahra:"Zazi",farah:"Fari",sultan:"Sully",nawab:"Nabs",zalmay:"Zal",
};

function getNickname(n: string): string { return NICKNAMES[n.toLowerCase().replace(/[^a-z]/g,"")] || ""; }

function getGroup(breed: string): string {
  const b = breed.toLowerCase();
  if (b === "cavalier king charles spaniel") return "lapdog";
  if (b === "welsh springer spaniel") return "welsh";
  if (b.includes("spaniel")) return "spaniel";
  if (b.includes("retriever") || b === "labrador") return "retriever";
  if (b === "border collie" || b === "rough collie") return "collie";
  if (b === "bulldog") return "bulldog";
  if (b === "dalmatian") return "dalmatian";
  if (b === "old english sheepdog") return "sheepdog";
  if (["staffordshire bull terrier","boxer","bull terrier","french bulldog"].includes(b)) return "boxer";
  if (["basset hound","bloodhound","beagle"].includes(b)) return "sniffer";
  if (b === "afghan hound") return "afghan";
  if (b === "lurcher") return "lurcher";
  if (["greyhound","borzoi","saluki","irish wolfhound","whippet","italian greyhound"].includes(b)) return "sighthound";
  if (b === "great dane") return "greatdane";
  if (["mastiff","saint bernard","newfoundland","leonberger"].includes(b)) return "giant";
  if (b === "poodle") return "poodle";
  if (["bichon frise","shih tzu","pomeranian","papillon","maltese","maltipoo","cavapoo","cavachon"].includes(b)) return "lapdog";
  if (b === "dachshund") return "dachshund";
  if (["german shepherd","doberman pinscher","rottweiler","weimaraner"].includes(b)) return "german";
  if (b === "boston terrier") return "boston";
  if (["irish setter","gordon setter","english setter"].includes(b)) return "retriever";
  if (b === "labradoodle") return "labradoodle";
  if (["cockapoo","jackapoo","goldendoodle"].includes(b)) return "retriever";
  if (b.includes("terrier") || ["miniature schnauzer","west highland terrier"].includes(b)) return "terrier";
  if (["pug","chow chow","shar pei","shiba inu","akita","lhasa apso","tibetan mastiff","pekingese","japanese chin"].includes(b)) return "asian";
  if (b === "corgi") return "welsh";
  if (["siberian husky","chihuahua"].includes(b)) return "character";
  if (b === "welsh terrier") return "welsh";
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

  // ── SURNAME-AWARE NAME + WORD SELECTION ──────────────────────────────────
  // Prefer names and dog words that alliterate with the surname initial.
  // This makes Donald → Duke/Dash/Dobby etc much more likely.
  const surnameInitial = surname.replace(/-.*/, "")[0]?.toUpperCase() ?? "";
  const soundFamily: Record<string,string> = {B:"BP",P:"BP",D:"DT",T:"DT",G:"GK",K:"GK",F:"FV",V:"FV",S:"SZ",Z:"SZ",M:"MN",N:"MN"};
  const surnameFamily = soundFamily[surnameInitial] ?? surnameInitial;

  // Filter nameBank for names starting with surname initial or sound family
  const matchingNames = nameBank.filter((n: NameEntry) =>
    n.name[0].toUpperCase() === surnameInitial ||
    (soundFamily[n.name[0].toUpperCase()] === surnameFamily && surnameFamily.length > 1)
  );
  // Use matching names ~60% of passes (seeds divisible by 5 use random pick for variety)
  const useMatchingName = matchingNames.length >= 2 && (seed % 5 !== 0);
  const firstName = useMatchingName
    ? matchingNames[(seed + 3) % matchingNames.length]
    : pick(nameBank, seed + 3);

  // Filter wordBank for dog words starting with surname initial or sound family
  const matchingWords = wordBank.filter((w: WordEntry) =>
    w.firstLetter.toUpperCase() === surnameInitial ||
    (soundFamily[w.firstLetter.toUpperCase()] === surnameFamily && surnameFamily.length > 1)
  );
  const useMatchingWord = matchingWords.length >= 2 && (seed % 7 !== 0);
  const dogWordEntry = useMatchingWord
    ? matchingWords[(seed + 7) % matchingWords.length]
    : pick(wordBank, seed + 7);
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

  const noTitleBreeds = ["labrador","labradoodle","goldendoodle"];
  const noAbbrevBreeds = ["lurcher","collie","retriever","sighthound","german","spaniel","giant","afghan","poodle","sniffer","greatdane","welsh","dalmatian","sheepdog","default"];
  const rawStyleRoll = seed % 13;
  const styleRoll = noTitleBreeds.includes(breed.toLowerCase()) ? 4 : (noAbbrevBreeds.includes(group2) && rawStyleRoll === 0) ? 4 : rawStyleRoll;
  let full = "";
  let nickname = "";

  if (styleRoll === 0 && validAbbrevs.length > 0) {
    const abbrev = pick(validAbbrevs, seed + 5);
    const dottedCode = abbrev.code.split("").join(".");
    full = `${dottedCode} (${abbrev.meaning}) ${effectiveSurname}`;
    // Derive nickname from meaning -- first word of meaning, shortened if long
    const meaningWords = abbrev.meaning.split(" ");
    const firstMWord = meaningWords[0];
    const lastMWord = meaningWords[meaningWords.length - 1];
    // Pick the most interesting word (last if it's longer/more distinctive)
    const nickWord = lastMWord.length > firstMWord.length ? lastMWord : firstMWord;
    nickname = nickWord.length <= 5 ? nickWord : nickWord.slice(0, 5);
  } else if (styleRoll === 1 && gender === "boy") {
    const letter = pick(DTRAIN_LETTERS, seed + 13);
    const suffix = pick(DTRAIN_SUFFIXES, seed + 19);
    full = `${letter}-${suffix} ${effectiveSurname}`;
    nickname = getNickname(firstName.name);
  } else if (styleRoll === 2 && gender === "girl") {
    const fName = pick(MARIEJ_FIRSTS, seed + 7);
    const mInit = pick(MARIEJ_INITIALS, seed + 23);
    full = `${fName} ${mInit} ${effectiveSurname}`;
    // Mary J nickname -- double the first name syllable
    const mjNick = getNickname(fName);
    if (mjNick) {
      nickname = mjNick;
    } else {
      // Double the short name: Dina->Dindin, Nina->Nini, Lisa->Lislis
      const half = fName.slice(0, Math.max(3, Math.ceil(fName.length / 2)));
      nickname = half + half.toLowerCase();
      nickname = nickname.charAt(0).toUpperCase() + nickname.slice(1);
    }
  } else if (styleRoll === 3 && gender === "boy" && ["dachshund","character","terrier","collie"].includes(group2)) {
    // Reversed descriptor: "Extended General Burrow-Patterson" -- adjective before title
    const descriptors = ["Extended","Horizontal","Stretched","Relentless","Obsessive","Notorious","Incomparable","Frenetic","Unstoppable","Legendary","Indefatigable","Tenacious"];
    const descriptor = pick(descriptors, seed + 29);
    const baseTitle = pick(titleBank, seed).title;
    full = `${descriptor} ${baseTitle} ${firstName.name} ${effectiveSurname}`;
    nickname = getNickname(firstName.name);
  } else if (styleRoll === 4) {
    // No title -- the name is the whole joke
    full = `${firstName.name} ${effectiveSurname}`;
    nickname = getNickname(firstName.name);
  } else if (styleRoll === 5) {
    // Single descriptor word only -- no rank/title, just an adjective
    const bareDescriptors = ["Magnificent","Notorious","Legendary","Unstoppable","Incomparable",
      "Formidable","Glorious","Relentless","Tremendous","Outrageous","Marvellous","Indefatigable",
      "Preposterous","Spectacular","Phenomenal","Extraordinary","Stupendous","Unbelievable"];
    const descriptor = pick(bareDescriptors, seed + 41);
    full = `${descriptor} ${firstName.name} ${effectiveSurname}`;
    nickname = getNickname(firstName.name);
  } else if (styleRoll === 6 && !["collie","retriever","sighthound","german","spaniel","welsh","giant","afghan","poodle","sniffer"].includes(group2)) {
    // McBoatface: [Adj]y [CelticPrefix][Adj][BreedSuffix] Surname -- only chaotic breeds
    // Skip or neutralise if surname already has a Celtic/noble prefix
    const surnameHasPrefix = /^(mc|mac|o'|de|van|von|le|di|dal|fitz|ap|ferch|ni)/i.test(surname.trim());
    const mcPool6 = MCFACE_POOL[group2] || MCFACE_POOL.default;
    const mc1 = mcPool6[(seed + 31) % mcPool6.length];
    const mc2 = mcPool6[(seed + 37) % mcPool6.length];
    const mcSuffixPool = MCFACE_SUFFIX[group2] || MCFACE_SUFFIX.default;
    const mcSuffix = mcSuffixPool[(seed + 41) % mcSuffixPool.length];
    if (surnameHasPrefix) {
      // Surname already has a prefix -- use bare compound name, no extra prefix
      full = `${mc1[0]} ${mc2[1]}${mcSuffix} ${effectiveSurname}`;
    } else {
      const mcPrefixPool = gender === "girl" ? MCFACE_PREFIX_GIRL : MCFACE_PREFIX_BOY;
      const mcPrefix = mcPrefixPool[(seed + 67) % mcPrefixPool.length];
      if (surnameHasPrefix) {
      full = `${mc1[0]} ${mc2[1]}${mcSuffix} ${effectiveSurname}`;
    } else {
      full = `${mc1[0]} ${mcPrefix}${mc2[1]}${mcSuffix} ${effectiveSurname}`;
    }
    }
    // McFace nickname: first 3-4 chars of stem + za/zy
    const mcStemRaw = mc1[0].toLowerCase(); // e.g. "lollopy"
    const mcNickStem = mcStemRaw.length > 5 ? mcStemRaw.slice(0,4) : mcStemRaw.slice(0,3);
    nickname = mcNickStem.charAt(0).toUpperCase() + mcNickStem.slice(1) + "za";
  } else if (styleRoll === 7 && ["boxer","terrier","character","lapdog","boston","asian","dachshund","bulldog","default"].includes(group2)) {
    // SpongeBob: [Adj][ShortName] [Adj][BodyPart] Surname -- only chaotic breeds
    const sbAdjPool = SPONGEBOB_ADJ1[group2] || SPONGEBOB_ADJ1.default;
    const sbAdj1 = sbAdjPool[(seed + 43) % sbAdjPool.length];
    const sbAdj2 = sbAdjPool[(seed + 47) % sbAdjPool.length];
    const sbMid = gender === "girl"
      ? SPONGEBOB_MID_GIRL[(seed + 53) % SPONGEBOB_MID_GIRL.length]
      : SPONGEBOB_MID_BOY[(seed + 53) % SPONGEBOB_MID_BOY.length];
    const sbBody = SPONGEBOB_BODY[(seed + 59) % SPONGEBOB_BODY.length];
    full = `${sbAdj1}${sbMid} ${sbAdj2}${sbBody} ${effectiveSurname}`;
    // Bob → Bobby etc -- always use the expanded form, no fusion
    const sbNickMap: Record<string,string> = {
      Bob:"Bobby",Tom:"Tommy",Tim:"Timmy",Sam:"Sammy",Jim:"Jimmy",
      Ned:"Neddy",Ted:"Teddy",Sid:"Sidney",Baz:"Bazza",Reg:"Reggie",
      Len:"Lenny",Ken:"Kenny",Mick:"Micky",Nick:"Nicky",Pip:"Pippa",
      Alf:"Alfie",Ron:"Ronnie",Don:"Donnie",Gav:"Gavvy",Dez:"Dezzy",
      Val:"Vally",Kay:"Kaykay",Di:"Didi",Mo:"Momo",Jo:"Jojo",
      Dot:"Dottie",Flo:"Florrie",Sue:"Suey",Jan:"Janny",Pam:"Pammy",
      Bev:"Bevvy",Bea:"Beabea",Fran:"Franny",Gail:"Gaily",Sal:"Sally",
      Nan:"Nanny",Babs:"Babsy",Kim:"Kimmy",Lin:"Linny",May:"Maymay",
    };
    nickname = sbNickMap[sbMid] || sbMid;
  } else {
    // Regional term override -- if town matches a region, use local endearment as first name
    const regionalTerm = getRegionalTerm(town, seed, gender);
    const displayFirst = regionalTerm && (seed % 4 === 0)  // ~25% of standard passes
      ? regionalTerm
      : firstName.name;
    full = `${title.title} ${displayFirst} ${effectiveSurname}`;
    if (regionalTerm && seed % 4 === 0) nickname = displayFirst;
    if (title.title === "Itsy") nickname = "Bitsy";
    if (title.title === "Hong Kong") nickname = "HK";
    // Multi-word title → abbreviate title to initials, keep first name
    if (title.title.includes(" ") && !nickname) {
      const titleInitials = title.title.split(" ").map((w: string) => w[0]).join("");
      nickname = `${titleInitials} ${firstName.name}`;
    }
    // Single-word title + surname → title initial + surname initial (e.g. Grand Thyra Thomas → GT)
    if (!title.title.includes(" ") && !nickname && surname.length > 0) {
      const ti = title.title[0].toUpperCase();
      const si = surname.replace(/-.*/, "")[0]?.toUpperCase() ?? "";
      const twoLetter = ti + si;
      const blockedTwo = new Set(["GT","MB","MP","PM","GP","DI","PC","DC","DS","BS"]);
      if (!blockedTwo.has(twoLetter) && ti !== si) {
        const fi = firstName.name[0].toUpperCase();
        if (fi === ti || fi === si) nickname = twoLetter;
      }
    }
    const tInit = title.title.replace(/^(Lil'|Ol'|Wee|Baby|Little|Daft|Cheeky|Silly|Scruffy|Fluffy|Grumpy|Noisy)\s/,"")[0]?.toUpperCase() || "";
    const nInit = firstName.name[0]?.toUpperCase() || "";
    const initials2 = tInit + nInit;
    const matched = validAbbrevs.find((a: AbbrevEntry) => a.code === initials2);
    const naturalNick = getNickname(firstName.name);
    if (naturalNick) {
      // Always prefer the natural nickname from the table first
      nickname = naturalNick;
    } else if (matched) {
      // Abbreviation match -- use special cases
      if (matched.code === "DC" && gender === "girl") nickname = "Dixy";
      else if (matched.code === "DC" && gender === "boy") nickname = "Dicky";
      else nickname = matched.code;
    } else {
      if (naturalNick) {
        nickname = naturalNick;
      } else {
        const fn = firstName.name;
        // If the first name is short enough, use it directly as the nickname
        if (fn.length <= 4) {
          nickname = fn;
        } else {
          // Try acronym -- only if pronounceable, different from name, not a known abbreviation
          const acronym = full.split(" ").filter(w => /^[A-Za-z]/.test(w)).map(w => w[0]).join("").toUpperCase();
          const vowelRatio = (acronym.match(/[AEIOU]/g) || []).length / Math.max(acronym.length, 1);
          const acronymIsName = fn.toUpperCase().startsWith(acronym);
          // Block acronyms that match well-known UK/common abbreviations
          const blockedAcronyms = new Set(["JSA","ESA","PIP","DLA","NHS","BBC","ITV","VAT","DWP","MOT","MP","PM","GP","PC","DC","FC","AFC","CID","RAC","AA","RAC","HMRC","DVLA","DSS","CSA","ASBO","GCSE","BTEC"]);
          if (acronym.length >= 2 && acronym.length <= 4 && vowelRatio >= 0.25 && !acronymIsName && !blockedAcronyms.has(acronym)) {
            nickname = acronym;
          } else {
            // Shorten first name -- first 3-4 chars + s
            const stem = fn.length > 6 ? fn.slice(0, 4) : fn.slice(0, 3);
            nickname = (stem + "s").replace(/ss$/,"s").replace(/([aeiou])s$/i,"$1s");
            nickname = nickname.charAt(0).toUpperCase() + nickname.slice(1).toLowerCase();
          }
        }
      }
    }
  }

  // Fallback nickname -- always have one
  if (!nickname) {
    const firstNameStr = firstName.name;
    // Try contracting to first syllable + y/ie
    const vowelMatch = firstNameStr.match(/^([^aeiou]*[aeiou]+[^aeiou]*)/i);
    if (vowelMatch && vowelMatch[1].length < firstNameStr.length) {
      const stem = vowelMatch[1];
      nickname = stem.length <= 3 ? stem + "y" : stem.slice(0, 4);
      nickname = nickname.charAt(0).toUpperCase() + nickname.slice(1).toLowerCase();
    } else {
      nickname = firstNameStr.slice(0, 3);
    }
  }
  const reasoning = pick(reasoningBank, seed + 11);
  // styleRoll 4 = no title -- score WITHOUT title so it competes fairly
  // and add bonus when the name itself carries triple alliteration
  const noTitleEntry: TitleEntry = { title: "", reg: "mundane" as Register, syllables: 0 };
  const scoringTitle = styleRoll === 4 ? noTitleEntry : title;
  const baseScore = scoreName(scoringTitle, firstName, dogWordEntry, surname, colour, group);

  // Bare name triple-alliteration bonus -- Prudence Prowl-Phillips doesn't need a title
  let bareBonus = 0;
  if (styleRoll === 4) {
    const fl = firstName.name[0].toLowerCase();
    const wl = dogWordEntry.word[0].toLowerCase();
    const sl = surname[0].toLowerCase();
    if (fl === wl && wl === sl) bareBonus = 8;       // triple P/W/S alliteration
    else if (fl === wl && fl === sl) bareBonus = 8;
    else if (fl === wl || (fl === sl && fl === wl)) bareBonus = 5;
    else if (fl === sl || wl === sl) bareBonus = 3;  // two-way with surname
  }

  const score = styleRoll === 0 ? baseScore + 4 : styleRoll === 4 ? baseScore + bareBonus : baseScore;

  // ── RESCUE PASS: if score < 15 and name has a title, try bare name ─────────
  // Strip the title and rescore -- sometimes the name is funnier without it
  const RESCUE_THRESHOLD = 18;
  if (score < RESCUE_THRESHOLD && styleRoll >= 4) {
    // Already a no-title style -- return as-is
    return { full, nickname, reasoning, score };
  }
  if (score < RESCUE_THRESHOLD && full.startsWith(title.title + " ")) {
    // Build bare version: just firstName + surname
    const bareFull = `${firstName.name} ${effectiveSurname}`;
    // Score the bare name using a dummy "no title" entry
    const noTitle: TitleEntry = { title: "", reg: "mundane" as Register, syllables: 0 };
    const bareScore = scoreName(noTitle, firstName, dogWordEntry, surname, colour, group);
    if (bareScore > score) {
      // Bare name scores better -- use it
      const bareNick = getNickname(firstName.name) || nickname;
      return { full: bareFull, nickname: bareNick, reasoning, score: bareScore };
    }
  }

  return { full, nickname, reasoning, score };
}


// ── DEDUPLICATION ─────────────────────────────────────────────────────────────
// Pick top results ensuring no repeated first names, titles, or dog words
const ONCE_ONLY_WORDS = new Set(["Track","Trace","Sleuth","Detect","Quest","Hunt","Scout","Find","Hound","Nose","Sniff","Snuffle"]);

function dedupeResults(candidates: Result[], limit = 10): Result[] {
  const usedFirstNames  = new Set<string>();
  const usedTitles      = new Set<string>();
  const usedDogWords    = new Set<string>();
  const out: Result[] = [];
  for (const r of candidates) {
    if (!r) continue;
    const parts   = r.full.split(" ");
    const title   = parts[0];
    // For abbrev style "B.O (Boss Original) Surname", treat whole meaning as firstName for dedup
    const isAbbrevFull = /^[A-Z]\.[A-Z]/.test(title);
    const firstName = isAbbrevFull
      ? parts.slice(1, parts.length - 1).join(" ")  // "(Boss Original)"
      : parts[1] ?? "";
    // Extract dog word from hyphenated surname (e.g. "Sniff-Taylor" -> "Sniff")
    const surnamepart = parts[parts.length - 1] ?? "";
    const dogWord = surnamepart.includes("-") ? surnamepart.split("-")[0] : "";
    const wordInName = [...ONCE_ONLY_WORDS].find(w => r.full.includes(" " + w + " ") || r.full.includes(" " + w + "-"));
    if (wordInName && usedDogWords.has(wordInName)) continue;
    if (wordInName) usedDogWords.add(wordInName);
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


const WHIMSY: Record<string, string[]> = {
  B: ["Boffle", "Boffleboots", "Bofflewick", "Boogles", "Boondoggle", "Bumbershoot", "Bumblebean", "Bumbleboots", "Bumblebop", "Bumblebottom", "Bumblechops", "Bumblekins", "Bumblepaws", "Bumblepuff", "Bumblesnack", "Bumblesnout", "Bumblewhisk", "Bumblewick", "Bumblewink", "Bunglebean", "Bungleboots", "Bunglechops", "Bunglepaws", "Bunglepuff", "Bunglewink"],
  C: ["Crankle", "Cranklebean", "Cranklesnout", "Cranklewhisk", "Crankypants", "Crinklebean", "Crinkleboots", "Crinklechops", "Crinklepaws", "Crinklepot", "Crinklepuff", "Crinklewhisk", "Crinklewink", "Crumbkins", "Crumblepaws", "Crumblewick", "Crumbly", "Crumblypaws", "Crumbsnout", "Crumpadoodle", "Crumpaloo", "Crumpetboots", "Crumpetchops", "Crumpetface", "Crumpetpuff", "Crumpetwhisk", "Crumpetwink", "Crumpkin", "Crumpypaws", "Crumpypuff", "Crumpysnout"],
  D: ["Dinglebean", "Dingleberry", "Dingleboots", "Dinglechops", "Dinglepaws", "Dinglepuff", "Dinglewhisk", "Dinglewick", "Dinglewink", "Doodlebean", "Doodleberry", "Doodleboots", "Doodlebug", "Doodlechops", "Doodlepaws", "Doodleplop", "Doodlepuff", "Doodlewhisk", "Doodlewick", "Doodlewink"],
  F: ["Fidgetbean", "Fidgetwick", "Fizzlebean", "Fizzlebiscuit", "Fizzleboots", "Fizzlebop", "Fizzlebump", "Fizzlechops", "Fizzlenose", "Fizzlepaws", "Fizzlepuff", "Fizzlewhisk", "Fizzlewink", "Fizzwick", "Flapdoodle", "Flapjack", "Flibbert", "Flopsydoo", "Fluffernugget", "Fumblebean", "Fumbleboots", "Fumblebum", "Fumblechops", "Fumblepaws", "Fumblepuff", "Fumblewhisk", "Fumblewick", "Fumblewink", "Fuzzlebean", "Fuzzleboots", "Fuzzlebug", "Fuzzlechops", "Fuzzlenoodle", "Fuzzlepaws", "Fuzzlepuff", "Fuzzleton", "Fuzzlewhisk", "Fuzzlewink", "Fuzzleworth"],
  G: ["Gobblebean", "Gobbleboots", "Gobblechops", "Gobblepaws", "Gobblepuff", "Gobblesnout", "Gobblewhisk", "Gobblewick", "Gobblewink", "Gobstopper", "Grizzlebean", "Grumblebean", "Grumbleboots", "Grumblechops", "Grumblepaws", "Grumblepuff", "Grumblewhisk", "Grumblewick", "Grumblewink", "Grumpkin", "Grumpysnout"],
  J: ["Jibberjab", "Jigglebean", "Jitterbean", "Jitterboots", "Jitterbug", "Jitterchops", "Jitterpaws", "Jitterpuff", "Jitterwhisk", "Jitterwick", "Jitterwink", "Jollybean", "Jollysnout", "Jollywick", "Jumblepaws", "Jumblewick"],
  M: ["Muddlebean", "Muddleboots", "Muddlebug", "Muddlechops", "Muddlefoot", "Muddlepaws", "Muddlepuff", "Muddlewhisk", "Muddlewink", "Mumblebum", "Mumblewick", "Munchaloo", "Munchbucket", "Munchkinstein", "Munchybean", "Munchysnout", "Munchywick"],
  N: ["Nibber", "Nibberbean", "Nibberboots", "Nibberchops", "Nibberpaws", "Nibberpuff", "Nibbersnout", "Nibberton", "Nibberwhisk", "Nibberwink", "Nibblesworth", "Niblet", "Nibletboots", "Nibsnack", "Noodlebean", "Noodleboots", "Noodlebug", "Noodlechops", "Noodleface", "Noodlepaws", "Noodlepuff", "Noodlewhisk", "Noodlewick", "Noodlewink"],
  P: ["Picklewick", "Pipsnort", "Pipsqueaker", "Pipsqueakle", "Plonker", "Pompadoodle", "Pompawhisk", "Pompomble", "Poppycock", "Puddlebean", "Puddleboots", "Puddlebum", "Puddlechops", "Puddlefoot", "Puddlekins", "Puddlepaws", "Puddlepop", "Puddlepuff", "Puddlewhisk", "Puddlewick", "Puddlewink", "Pumpernickel"],
  Q: ["Quibble", "Quibblebean", "Quibbleboots", "Quibblechops", "Quibblepaws", "Quibblepuff", "Quibbleton", "Quibblewhisk", "Quibblewink", "Quirkle", "Quirklebean", "Quirkleboots", "Quirklewink", "Quirkypants", "Quirkysnout"],
  R: ["Razzlebean", "Razzleboots", "Razzlechops", "Razzledazzle", "Razzlepaws", "Razzlepuff", "Razzlesnout", "Razzlewhisk", "Razzlewick", "Razzlewink", "Rumblebean", "Rumbleboots", "Rumblechops", "Rumblekins", "Rumblepaws", "Rumblepuff", "Rumblewhisk", "Rumblewink"],
  S: ["Scramblebean", "Scramblefoot", "Scritchyboo", "Scrufflebump", "Scrumble", "Scrumbleboots", "Scrumblepaws", "Scrumblewick", "Scrungle", "Skedoodle", "Snaffle", "Snazzle", "Snazzlebean", "Snazzleboots", "Snazzlechops", "Snazzlepaws", "Snazzlepuff", "Snazzlewhisk", "Snazzlewink", "Snickerbean", "Snickerboots", "Snickerchops", "Snickerpaws", "Snickerpuff", "Snickerwhisk", "Snickerwick", "Snickerwink", "Snorklebean", "Snortbucket", "Snortle", "Snortleberry", "Snortleboots", "Snortlepuff", "Snortlewick", "Snufflebean", "Snuffleboots", "Snufflechops", "Snufflepaws", "Snufflepot", "Snufflepuff", "Snufflewhisk", "Snufflewink", "Snuzzle", "Sprocketbean", "Sproing", "Squabblepaws", "Squibble", "Squibblebean", "Squibbleboots", "Squibblechops", "Squibblepaws", "Squibblepuff", "Squibblewhisk", "Squibblewink", "Squigglebean", "Squigglesnack", "Squiggleton", "Squigglewick"],
  T: ["Taterbean", "Taterboots", "Taterbug", "Taterchops", "Taterpaws", "Taterpuff", "Taterwhisk", "Taterwink", "Ticklewick", "Tizzy", "Tizzytoes", "Toodlebean", "Toodleboots", "Toodlebug", "Toodlechops", "Toodlepaws", "Toodlepop", "Toodlepuff", "Toodlewhisk", "Toodlewink", "Tootlesnout", "Tootlewick", "Tumblebean", "Tumbleboots", "Tumblechops", "Tumblepaws", "Tumblepuff", "Tumblewhisk", "Tumblewick", "Tumblewink"],
  W: ["Waffleton", "Wafflewhisk", "Waggledorf", "Wagglenose", "Wagglesnack", "Wagglesnort", "Wagglesworth", "Wagglybean", "Wagglyboots", "Wagglychops", "Wagglypaws", "Wagglypuff", "Wagglywhisk", "Wagglywink", "Wibbleton", "Wibblewobble", "Wobblebean", "Wobbleboots", "Wobblebug", "Wobblechops", "Wobblekins", "Wobblepaws", "Wobblepot", "Wobblepuff", "Wobblewhisk", "Wobblewick", "Wobblewink", "Womble", "Womblepaws", "Wompadoodle", "Wompington", "Wompus", "Wompusbean", "Wompusboots", "Wompuschops", "Wompuspuff", "Wompuswhisk", "Wompuswink"],
};


const WHIMSY_RULES: { pattern: RegExp; groups: string[] }[] = [
  // Doodle words -- doodle/poo breeds only
  { pattern: /doodle/i, groups: ["retriever","lapdog","spaniel","default"] },
  // Snout words -- flat-faced breeds
  { pattern: /snout/i,  groups: ["boxer","character","bulldog","lapdog"] },
  // Bug words -- small energetic breeds
  { pattern: /bug$/i,   groups: ["terrier","character","lapdog","collie"] },
  // Bum/bottom words -- lapdog/character only
  { pattern: /(bum$|bottom$)/i, groups: ["lapdog","character","boxer"] },
  // Berry/plop -- character/lapdog only
  { pattern: /(berry$|plop$)/i, groups: ["character","lapdog","terrier"] },
  // Kins -- lapdog only, too cutesy
  { pattern: /kins$/i, groups: ["lapdog","character"] },
];

function whimsyAllowed(word: string, group: string): boolean {
  for (const rule of WHIMSY_RULES) {
    if (rule.pattern.test(word) && !rule.groups.includes(group)) return false;
  }
  return true;
}

const MCFACE_POOL: Record<string, [string, string][]> = {
  sniffer:    [["Sniffy","Sniff"],["Droopy","Droop"],["Lollopy","Lollop"],["Nosey","Nose"],["Tracky","Track"],["Houndy","Hound"],["Questy","Quest"]],
  retriever:  [["Chompy","Chomp"],["Waggy","Wag"],["Fetchy","Fetch"],["Munchy","Munch"],["Gobby","Gob"],["Licky","Lick"],["Biscuity","Biscuit"]],
  terrier:    [["Diggy","Dig"],["Scratchy","Scratch"],["Nippy","Nip"],["Yappy","Yap"],["Scrappy","Scrap"],["Bolty","Bolt"],["Ratty","Rat"],["Snappy","Snap"],["Zippy","Zip"]],
  boxer:      [["Snorty","Snort"],["Wobbly","Wobble"],["Boingy","Boing"],["Bumpy","Bump"],["Clumsy","Clums"],["Galumphy","Galumph"],["Blundery","Blunder"],["Crashy","Crash"]],
  character:  [["Snorty","Snort"],["Wheezy","Wheeze"],["Puffy","Puff"],["Grumbly","Grumble"],["Waddly","Waddle"],["Squashy","Squash"],["Squishy","Squish"],["Wriggly","Wriggle"]],
  lapdog:     [["Fluffy","Fluff"],["Bouncy","Bounce"],["Prancy","Prance"],["Squashy","Squash"],["Flouncy","Flounce"],["Shimmery","Shimmer"],["Pampery","Pamper"],["Glittery","Glitter"]],
  collie:     [["Herdy","Herd"],["Zippy","Zip"],["Circly","Circle"],["Darty","Dart"],["Sprinty","Sprint"],["Frenzy","Frenz"],["Intense","Intens"],["Obsessy","Obsess"]],
  poodle:     [["Prancy","Prance"],["Strutty","Strutt"],["Swishy","Swish"],["Mincy","Mince"],["Posy","Pose"],["Primy","Prim"],["Flouncy","Flounce"],["Curly","Curl"]],
  sighthound: [["Speedy","Speed"],["Slinky","Slink"],["Swoopy","Swoop"],["Darty","Dart"],["Flashy","Flash"],["Gleamy","Gleam"],["Streaky","Streak"],["Racy","Race"]],
  dachshund:  [["Stretchy","Stretch"],["Wiggly","Wiggle"],["Wormy","Worm"],["Scuttly","Scuttle"],["Squeezy","Squeeze"],["Wriggly","Wriggle"],["Stubby","Stubb"],["Squirmy","Squirm"]],
  giant:      [["Massive","Massive"],["Stompy","Stomp"],["Loomy","Loom"],["Thumpy","Thump"],["Rumbly","Rumble"],["Lumpy","Lump"],["Shakey","Shake"],["Swavy","Sway"]],
  greatdane:  [["Cosmic","Cosmic"],["Starry","Star"],["Massive","Massive"],["Orbital","Orbit"],["Stompy","Stomp"],["Galactic","Galactic"],["Loomy","Loom"],["Thumpy","Thump"]],
  spaniel:    [["Splashy","Splash"],["Waggy","Wag"],["Fetchy","Fetch"],["Frolicky","Frolic"],["Scampy","Scamp"],["Bouncy","Bounce"],["Gamby","Gamb"],["Rompy","Romp"]],
  german:     [["Patrolly","Patrol"],["Marcy","Marc"],["Drilley","Drill"],["Guardy","Guard"],["Securey","Secure"],["Breachy","Breach"],["Flanky","Flank"],["Strict","Strict"]],
  asian:      [["Snorty","Snort"],["Waddly","Waddle"],["Grumbly","Grumble"],["Wheezy","Wheeze"],["Squishy","Squish"],["Puffy","Puff"],["Stumply","Stumpl"],["Rolly","Roll"]],
  boston:     [["Strutty","Strutt"],["Hustly","Hustle"],["Scrappy","Scrap"],["Dodgy","Dodge"],["Rattly","Rattle"],["Jazzy","Jazz"],["Marcy","Marc"],["Blusty","Blust"]],
  afghan:     [["Flowy","Flow"],["Swooshy","Swoosh"],["Glidy","Glide"],["Aloofy","Aloof"],["Drifty","Drift"],["Surgy","Surge"],["Sweepy","Sweep"],["Soary","Soar"]],
  bulldog:    [["Grumbly","Grumble"],["Snorty","Snort"],["Wobbly","Wobble"],["Jowly","Jowl"],["Stuffy","Stuff"],["Rolly","Roll"],["Blustey","Blust"],["Squashy","Squash"]],
  default:    [["Trotty","Trot"],["Wandy","Wand"],["Prowly","Prowl"],["Lopy","Lop"],["Slinky","Slink"],["Stalky","Stalk"],["Sauntry","Sauntr"],["Canty","Cant"]],
};

const SPONGEBOB_ADJ1: Record<string, string[]> = {
  sniffer:    ["Droopy","Slobby","Flappy","Snuffly","Lollopy","Nosey","Wrinkly","Jowly"],
  retriever:  ["Slobby","Chompy","Waggy","Fluffy","Moppy","Scruffy","Soggy","Hungry"],
  terrier:    ["Scratchy","Nippy","Yappy","Scruffy","Wiry","Zippy","Grubby","Bolty"],
  boxer:      ["Wobbly","Clumsy","Bumpy","Bouncy","Snorty","Galumphy","Boingy","Crashy"],
  character:  ["Snorty","Squashy","Puffy","Grumbly","Waddly","Squinty","Wrinkly","Squishy"],
  lapdog:     ["Fluffy","Prancy","Bouncy","Squashy","Flouncy","Glittery","Twinkly","Sparkly"],
  collie:     ["Zippy","Herdy","Frenzy","Darty","Sprinty","Circly","Intense","Obsessy"],
  poodle:     ["Prancy","Strutty","Swishy","Mincy","Curly","Fluffy","Posy","Primy"],
  sighthound: ["Speedy","Slinky","Swoopy","Flashy","Streaky","Swishy","Darty","Gleamy"],
  dachshund:  ["Stretchy","Wiggly","Wormy","Scuttly","Squeezy","Stubby","Waggy","Longey"],
  giant:      ["Massive","Stompy","Loomy","Lumpy","Rumbly","Thumpy","Shakey","Swavy"],
  greatdane:  ["Cosmic","Starry","Massive","Orbital","Stompy","Galactic","Loomy","Thumpy"],
  spaniel:    ["Splashy","Waggy","Floppy","Bouncy","Scampy","Frolicky","Gamby","Rompy"],
  german:     ["Patrolly","Strict","Marcey","Guardy","Drilley","Securey","Flanky","Breachy"],
  asian:      ["Snorty","Grumbly","Waddly","Squishy","Puffy","Wrinkly","Rolly","Stumply"],
  boston:     ["Strutty","Hustly","Scrappy","Dodgy","Rattly","Jazzy","Marcey","Blusty"],
  afghan:     ["Flowy","Swooshy","Glidy","Aloofy","Drifty","Surgy","Swoopy","Sweepy"],
  bulldog:    ["Grumbly","Snorty","Wobbly","Jowly","Stuffy","Rolly","Squashy","Blusty"],
  default:    ["Trotty","Wandy","Prowly","Lopy","Slinky","Stalky","Canty","Sauntry"],
};

const SPONGEBOB_MID_BOY: string[]  = ["Bob","Tom","Tim","Sam","Jim","Max","Rex","Ned","Ted","Sid","Baz","Reg","Len","Ken","Mick","Rick","Nick","Pip","Alf","Kev","Dez","Gav","Ron","Don"];
const SPONGEBOB_MID_GIRL: string[] = ["Sue","Jan","Pam","Bev","Dot","Flo","Kay","May","Kim","Lin","Nan","Val","Babs","Bea","Fran","Gail","Sal","Di","Mo","Jo"];
const SPONGEBOB_BODY: string[]     = ["Pants","Paws","Face","Bum","Ears","Nose","Tail","Snout","Chops","Flaps","Feet","Tum","Belly","Bonce","Jowls","Snoot","Chomps","Whiskers","Flops"];

const MCFACE_SUFFIX: Record<string, string[]> = {
  sniffer: ["nose", "snoot", "snout", "find", "track", "hound", "jowls", "flaps"],
  retriever: ["chops", "tum", "bonce", "chomps", "jowls", "paws", "bum", "tail"],
  terrier: ["butt", "chops", "bonce", "snoot", "paws", "tail", "whiskers", "ears"],
  boxer: ["snout", "jowls", "chops", "bonce", "butt", "tum", "flaps", "face"],
  character: ["snout", "jowls", "butt", "bonce", "chops", "face", "tum", "flaps"],
  lapdog: ["bum", "bonce", "face", "paws", "ears", "tail", "chops", "snoot"],
  collie: ["paws", "tail", "bonce", "butt", "chops", "ears", "face", "snoot"],
  poodle: ["bonce", "face", "snoot", "paws", "chops", "tail", "bum", "ears"],
  sighthound: ["butt", "tail", "paws", "bonce", "face", "snoot", "chops", "ears"],
  dachshund: ["bum", "butt", "tail", "bonce", "tum", "chops", "face", "snoot"],
  giant: ["bonce", "butt", "tum", "jowls", "chops", "paws", "face", "snout"],
  greatdane: ["bonce", "butt", "paws", "tail", "face", "chops", "snoot", "tum"],
  spaniel: ["ears", "flaps", "paws", "tail", "bonce", "chops", "face", "snoot"],
  german: ["bonce", "paws", "tail", "face", "chops", "butt", "snoot", "ears"],
  asian: ["snout", "jowls", "tum", "bonce", "chops", "butt", "face", "flaps"],
  boston: ["bonce", "butt", "chops", "face", "snoot", "ears", "paws", "tail"],
  afghan: ["tail", "bonce", "face", "paws", "snoot", "butt", "ears", "chops"],
  bulldog: ["jowls", "snout", "chops", "tum", "bonce", "butt", "face", "flaps"],
  default: ["bonce", "butt", "face", "chops", "paws", "tail", "snoot", "bum"],
};

const MCFACE_PREFIX_BOY: string[]  = ["Mc","Mc","Mc","Mac","Mac","O'","O'","Fitz","Fitz","De","Von","Van","Le","Ap","Dal","Di"];
const MCFACE_PREFIX_GIRL: string[] = ["Mc","Mc","Mc","Mac","Mac","O'","O'","Fitz","De","Von","Van","Le","Ferch","Dal","Di","Ni"];


// ── REGIONAL TERMS OF ENDEARMENT ──────────────────────────────────────────────
// Keyed by lowercase town/city name → region key
const REGIONAL_TOWNS: Record<string, string> = {
  // Birmingham & Black Country
  "birmingham":"brum","wolverhampton":"brum","dudley":"brum","walsall":"brum",
  "west bromwich":"brum","sandwell":"brum","solihull":"brum","coventry":"brum",
  "stoke-on-trent":"brum","stoke on trent":"brum","stoke":"brum",
  "lichfield":"brum","tamworth":"brum","cannock":"brum","stafford":"brum",
  // East Midlands
  "derby":"eastmids","leicester":"eastmids","nottingham":"eastmids",
  "loughborough":"eastmids","mansfield":"eastmids","lincoln":"eastmids",
  "northampton":"eastmids","chesterfield":"eastmids","burton":"eastmids",
  // Yorkshire
  "leeds":"yorks","sheffield":"yorks","bradford":"yorks","hull":"yorks",
  "york":"yorks","harrogate":"yorks","wakefield":"yorks","huddersfield":"yorks",
  "rotherham":"yorks","barnsley":"yorks","doncaster":"yorks","halifax":"yorks",
  // Lancashire & North West
  "manchester":"nw","salford":"nw","bolton":"nw","wigan":"nw","burnley":"nw",
  "blackburn":"nw","blackpool":"nw","preston":"nw","liverpool":"nw",
  "chester":"nw","warrington":"nw","rochdale":"nw","oldham":"nw","bury":"nw",
  "stockport":"nw","lancaster":"nw","accrington":"nw",
  // North East
  "newcastle":"northeast","sunderland":"northeast","middlesbrough":"northeast",
  "gateshead":"northeast","durham":"northeast","hartlepool":"northeast",
  "darlington":"northeast","stockton":"northeast","redcar":"northeast",
  // West Country & Cornwall
  "bristol":"westcountry","exeter":"westcountry","plymouth":"westcountry",
  "truro":"westcountry","penzance":"westcountry","falmouth":"westcountry",
  "torquay":"westcountry","bath":"westcountry","taunton":"westcountry",
  "bodmin":"westcountry","newquay":"westcountry","st ives":"westcountry",
  "barnstaple":"westcountry","yeovil":"westcountry","glastonbury":"westcountry",
  // London & South East
  "london":"london","croydon":"london","romford":"london","barking":"london",
  "peckham":"london","brixton":"london","hackney":"london","islington":"london",
  "camden":"london","brighton":"london","southend":"london","basildon":"london",
  "chatham":"london","maidstone":"london","guildford":"london","oxford":"london",
  "cambridge":"london","ipswich":"london","norwich":"london","colchester":"london",
  "chelmsford":"london","canterbury":"london","eastbourne":"london",
  // Scotland
  "glasgow":"scotland","edinburgh":"scotland","aberdeen":"scotland",
  "dundee":"scotland","inverness":"scotland","stirling":"scotland",
  "perth":"scotland","falkirk":"scotland","kilmarnock":"scotland",
  "paisley":"scotland","motherwell":"scotland","hamilton":"scotland",
};

// Regional term pools -- these become first names or nicknames
const REGIONAL_TERMS: Record<string, string[]> = {
  brum: ["Bab","Babby","Babs","OurKid","ArKid","MeBab","Duck","Cock","Cocker","OldCock","Chick","Chucky","Mucker"],
  eastmids: ["Duck","Ducky","Duckie","MeDuck","MyDuck","Love","Luv","Bab","Youth","MeYouth"],
  yorks: ["Love","Luv","Cock","Cocker","OldCock","Lad","Lass","Duck","Pet","Flower","Pal","Kidda"],
  nw: ["Chuck","Chucky","Chuckie","Love","Luv","OurKid","Kidda","Cock","Cocker","Mate","Pal","Mucker","Lad","Lass","Flower","Petal"],
  northeast: ["Pet","Petal","Hinny","Flower","Marra","Love","Luv","BonnyLad","BonnyLass","Lad","Lass","Bairn","Littleun","Youngblood"],
  westcountry: ["Lover","MyLover","MeLover","MyLovely","MeLovely","MyHandsome","MeHandsome","MyBeauty","Love","Luv","Darling","Maid","MyMaid"],
  london: ["Treacle","Sweetheart","Darling","Dear","Love","Luv","Lovely","Babe","Babes","Doll","Dollface","Poppet","Petal","Flower","Guv","Sonny"],
  scotland: ["Hen","WeeHen","Pal","WeePal","Doll","Dollie","Dearie","Love","WeeMan","WeeLass","Lassie","Laddie","Bairn","WeeYin","Bonny"],
};

// Display form of compound terms (stored without spaces, displayed with)
const REGIONAL_DISPLAY: Record<string, string> = {
  OurKid:"Our Kid",ArKid:"Ar Kid",MeBab:"Me Bab",OldCock:"Old Cock",
  MeDuck:"Me Duck",MyDuck:"My Duck",MeYouth:"Me Youth",
  BonnyLad:"Bonny Lad",BonnyLass:"Bonny Lass",Littleun:"Little'un",
  Youngblood:"Young'un",MyLover:"My Lover",MeLover:"Me Lover",
  MyLovely:"My Lovely",MeLovely:"Me Lovely",MyHandsome:"My Handsome",
  MeHandsome:"Me Handsome",MyBeauty:"My Beauty",MyMaid:"My Maid",
  WeeHen:"Wee Hen",WeePal:"Wee Pal",WeeMan:"Wee Man",WeeLass:"Wee Lass",
  WeeYin:"Wee Yin",Dollie:"Dollie",Dearie:"Dearie",Dollface:"Dollface",
};

function getRegionalTerm(town: string, seed: number, gender: "boy"|"girl"): string | null {
  const key = town.toLowerCase().trim();
  const region = REGIONAL_TOWNS[key];
  if (!region) return null;
  const pool = REGIONAL_TERMS[region] || [];
  if (pool.length === 0) return null;
  // Filter by gender -- some terms are gender-specific
  const femPool = ["Lass","WeeYin","WeeLass","Lassie","Maid","MyMaid","Hen","WeeHen","BonnyLass","Dollie","Doll","Dollface"];
  const mascPool = ["Lad","Laddie","WeeMan","BonnyLad","Guv","Sonny","OldCock"];
  const filtered = pool.filter(t => {
    if (gender === "girl" && mascPool.includes(t)) return false;
    if (gender === "boy" && femPool.includes(t)) return false;
    return true;
  });
  const chosen = filtered[(seed + 13) % filtered.length];
  return REGIONAL_DISPLAY[chosen] || chosen;
}


// ── COMEDY TIEBREAK SCORE ─────────────────────────────────────────────────────
// When multiple candidates score 21+, this picks the genuinely funniest one.
// Operates on different axes from the alliteration-based rawScore.

function comedyScore(result: Result, group: string): number {
  let c = 0;
  const full = result.full;
  const nick = result.nickname || "";
  const parts = full.split(" ");
  const firstName = parts.length >= 2 ? parts[parts.length - 2] : "";
  const titlePart = parts.slice(0, -2).join(" ");

  // ── Register collision: gap between title grandeur and name chaos ──────────
  // Grand title + chaos/baby/food name = maximum comedy
  const grandTitles = ["Emperor","Empress","Baron","Baroness","Archdruid","Commissioner","Field Marshal","Admiral","Archdeacon","Magnificent","Legendary","Incomparable","Notorious","Countess","Viscountess","Marchioness","Archdruid","Bard","Shogun","Grand Master","Cosmic Queen","Star Queen","Warrior Queen"];
  const isGrandTitle = grandTitles.some(t => titlePart.includes(t));
  const chaosFirstNames = ["Biscuit","Pudding","Treacle","Duck","Cocker","Bab","Our Kid","Chick","Chuck","Hinny","Wobble","Bumble","Doodle","Squiggle","Muffin","Radish","Cabbage","Turnip","Pickle","Biscuity","Snorty","Droopy","Wiggly"];
  const isChaosName = chaosFirstNames.some(n => firstName.toLowerCase().includes(n.toLowerCase()));
  if (isGrandTitle && isChaosName) c += 5;
  else if (isGrandTitle) c += 2;
  else if (isChaosName) c += 3;

  // ── Phonaesthetic pleasure: mouth-feel of the first name ──────────────────
  const fn = firstName.toLowerCase();
  // Double letters / repeated consonants
  if (/(.)/.test(fn)) c += 2;
  // Inherently funny endings
  if (/([bglmpw]le|um[bp]|og[gs]?|ub[bs]?|unk|wig|wob|bum|puf|snor)/.test(fn)) c += 2;
  // Funny consonant clusters (W, F, G, B sounds)
  if ((fn.match(/[wfgbp]/g) || []).length >= 2) c += 1;
  // Welsh/Germanic/unusual spelling = cultural placement
  if (/dd|ff|ll|ck$|tz|ph|wh/.test(fn)) c += 2;

  // ── Cultural specificity: does the name place the dog in a real world ─────
  const culturalGroups = ["welsh","german","asian","boston","dalmatian","sheepdog","greatdane","afghan","sighthound"];
  if (culturalGroups.includes(group)) c += 2;
  // McFace / SpongeBob styles have built-in comedy
  if (/Mc[A-Z]/.test(full) || /[A-Z][a-z]+[A-Z][a-z]+\s[A-Z][a-z]+[A-Z][a-z]+/.test(full)) c += 3;

  // ── Nickname punchline: is the nickname funnier than the name? ────────────
  if (nick && nick !== firstName) {
    // Nickname is meaningfully different
    if (nick.length <= 5 && firstName.length > 6) c += 2; // compression = punchline
    if (/z$|x$|y$/.test(nick.toLowerCase())) c += 1;      // Wizz, Lulz, Narcy etc
  }
  if (!nick) c -= 1;

  // ── Rhythm: STRONG-weak pattern across the full name ─────────────────────
  const syllCount = full.replace(/[^aeiou]/gi,"").length;
  if (syllCount >= 6 && syllCount <= 10) c += 2;

  // ── Surprise density: unexpected elements per word ───────────────────────
  const wordCount = parts.length;
  const surprises = (isGrandTitle ? 1 : 0) + (isChaosName ? 1 : 0) + (nick && nick !== firstName ? 1 : 0);
  if (surprises >= 2 && wordCount <= 3) c += 2; // multiple surprises, compact name

  return c;
}

// ── FINAL RANKING: blend rawScore + comedyScore ───────────────────────────────
function rankResults(results: Result[], group: string): Result[] {
  if (results.length <= 1) return results;
  return results
    .map(r => ({ r, final: r.score * 10 + comedyScore(r, group) }))
    .sort((a, b) => b.final - a.final)
    .map(x => x.r);
}

// ── GENERATION HELPERS ────────────────────────────────────────────────────────
function runPass(
  breed: string, surname: string, gender: "boy"|"girl",
  baseSeed: number, town: string, colour: DogColour,
  bonusPool1: string[], bonusPool2: string[]
): Result[] {
  const doubleBonus = new Set(bonusPool1.filter(n => bonusPool2.includes(n)));
  const allBonus    = new Set([...bonusPool1, ...bonusPool2]);

  const sf: Record<string,string> = {
    b:"labial",p:"labial",m:"labial",w:"labial",
    d:"dental",t:"dental",n:"dental",
    g:"velar",k:"velar",q:"velar",c:"velar",
    f:"fric",v:"fric",
    s:"sib",z:"sib",x:"sib",
    l:"liquid",r:"liquid",
    h:"glide",
  };
  const sf2: Record<string,string> = {
    m:"nasal",n:"nasal",s:"sstop",t:"sstop",p:"sstop",k:"sstop",
    g:"growl",b:"growl",d:"growl",r:"growl",w:"glide2",h:"glide2",
  };
  function allit(a: string, b: string): boolean {
    const f = a[0]?.toLowerCase() ?? "", w = b[0]?.toLowerCase() ?? "";
    return f === w || (!!sf[f] && sf[f] === sf[w]);
  }

  const raw = Array.from({length:20}, (_, i) => {
    const r = generateScored(breed, surname, gender, baseSeed + i * 17, town, colour);
    if (!r) return null;
    const parts = r.full.split(" ");
    const fn = parts[1] ?? "";
    // Extract the dog word from the hyphenated surname
    const lastPart = parts[parts.length - 1] ?? "";
    const dogWord = lastPart.includes("-") ? lastPart.split("-")[0] : "";

    let qBonus = 0;
    if (doubleBonus.has(fn)) qBonus += 4;
    else if (allBonus.has(fn)) qBonus += 2;

    // If name doesn't alliterate with dog word, try a whimsy replacement
    const isAbbrevStyle = /^[A-Z]\.[A-Z]/.test(parts[0] ?? "");
    const noWhimsyGroups = ["sighthound","german","giant","afghan","poodle","sniffer","bulldog","collie","retriever","spaniel","welsh"];
    if (dogWord && !allit(fn, dogWord) && !isAbbrevStyle && !noWhimsyGroups.includes(breed ? getGroup(breed) : "")) {
      const letter = dogWord[0].toUpperCase();
      const pool = WHIMSY[letter];
      if (pool && pool.length > 0) {
        const whimsyName = pool[(baseSeed + i * 7) % pool.length];
        // Check breed restrictions on this whimsy word
        if (!whimsyAllowed(whimsyName, getGroup(breed))) { return { ...r, score: r.score + qBonus }; }
        // Build a whimsy version and score it
        const wParts = [...parts];
        wParts[1] = whimsyName;
        const wFull = wParts.join(" ");
        // +5 for alliteration + 3 for short name (whimsy names are all 2-3 syl)
        const wScore = r.score + 5 + (doubleBonus.has(whimsyName) ? 4 : allBonus.has(whimsyName) ? 2 : 0);
        // Only use whimsy if it scores better
        if (wScore > r.score + qBonus) {
          // Derive nickname from the whimsy word -- cut before first 'le' or doubled consonant
          // e.g. Grumblepaws→Grumbs, Noodlepuff→Noods, Crinkleboots→Crinks
          const wLow = whimsyName.toLowerCase();
          const cons = new Set("bcdfghjklmnpqrstvwxyz".split(""));
          let wCut = wLow.length;
          for (let wi = 2; wi < wLow.length - 1; wi++) {
            if (wLow[wi] === "l" && wLow[wi+1] === "e" && cons.has(wLow[wi-1])) { wCut = wi; break; }
          }
          for (let wi = 2; wi < wLow.length - 1; wi++) {
            if (wLow[wi] === wLow[wi-1] && cons.has(wLow[wi]) && wi < wCut) { wCut = wi; break; }
          }
          wCut = Math.max(wCut, 3);
          let wStem = wLow.slice(0, wCut).replace(/[aeiou]+$/, "");
          if (wStem.length < 3) wStem = wLow.slice(0, 4).replace(/[aeiou]+$/, "");
          const wNick = wStem.charAt(0).toUpperCase() + wStem.slice(1) + "s";
          return { ...r, full: wFull, nickname: wNick, score: wScore };
        }
      }
    }

    return { ...r, score: r.score + qBonus };
  }).filter(Boolean) as Result[];

  raw.sort((a,b) => b.score - a.score);


  return raw;
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
  ];

const TITLE_PREFIXES: PrefixEntry[] = [
  { prefix: "Super",  breeds: ["retriever","spaniel","sniffer","lapdog","default","bulldog"], bonusContrast: 2 },
  { prefix: "Uber",   breeds: ["german","boxer","giant"], bonusContrast: 2 },
  { prefix: "Hyper",  breeds: ["collie","terrier","highenergy"], bonusContrast: 3 },
  { prefix: "Mega",   breeds: ["giant","character","dachshund"], bonusContrast: 2 },
  { prefix: "Ultra",  breeds: ["german","sighthound"], bonusContrast: 2 }];

export default function NameGeneratorPage() {
  const [breed, setBreed] = useState("");
  const [fromCalculator, setFromCalculator] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const b = params.get("breed") || "";
    if (b) {
      setBreed(b);
      setFromCalculator(true);
    }
  }, []);

  const [surname, setSurname] = useState("");
  const [town, setTown] = useState("");
  const [gender, setGender] = useState<"boy"|"girl">("boy");
  const [stage, setStage] = useState<Stage>("inputs");
  const [results, setResults] = useState<Result[]>([]);
  const [seed, setSeed] = useState(0);
  const [colour, setColour] = useState<DogColour>("");
  const [qIndex, setQIndex] = useState<number>(0);

  function handleGenerate() {
    if (!breed) { alert("Please select a breed"); return; }
    if (!surname.trim()) { alert("Please enter your surname"); return; }
    const s = Math.floor(Math.random() * 10000);
    setSeed(s);
    setResults([]);
    const qi = pickOneQuestion(s);
    setQIndex(qi);
    const showQuestion = Math.random() < 0.33;
    if (showQuestion) {
      setStage("question");
    } else {
      // Skip questions, generate directly with empty bonus pools
      const townMatch2 = FUNNY_PLACES.has(town.trim());
      const et = townMatch2 ? town.trim() : "";
      const p1 = runPass(breed, surname.trim(), gender, s,        et, colour, [], []);
      const p2 = runPass(breed, surname.trim(), gender, s + 1000, et, colour, [], []);
      const p3 = runPass(breed, surname.trim(), gender, s + 2000, et, colour, [], []);
      const p4 = runPass(breed, surname.trim(), gender, s + 3000, et, colour, [], []);
      const p5 = runPass(breed, surname.trim(), gender, s + 4000, et, colour, [], []);
      const p6 = runPass(breed, surname.trim(), gender, s + 5000, et, colour, [], []);
      const p7 = runPass(breed, surname.trim(), gender, s + 6000, et, colour, [], []);
      const p8 = runPass(breed, surname.trim(), gender, s + 7000, et, colour, [], []);
      const p9 = runPass(breed, surname.trim(), gender, s + 8000, et, colour, [], []);
      const top3 = [p1[0], p2[0], p3[0], p4[0], p5[0], p6[0], p7[0], p8[0], p9[0]].filter(Boolean) as Result[];
      const all3 = [...p1, ...p2, ...p3, ...p4, ...p5, ...p6, ...p7, ...p8, ...p9].sort((a,b) => b.score - a.score);
      const allD = dedupeResults([...top3, ...all3].filter(Boolean) as Result[]).sort((a,b) => b.score - a.score);
      const sc21 = allD.filter(r => r.score >= 22);
      const ranked = rankResults(sc21, breed ? getGroup(breed) : "default");
      setResults(ranked.length > 0 ? ranked.slice(0,5) : rankResults(allD, breed ? getGroup(breed) : "default").slice(0,5));
      setStage("reveal");
    }
  }

  function handleAnswer(answer: string) {
    const townMatch = FUNNY_PLACES.has(town.trim());
    const effectiveTown = townMatch ? town.trim() : "";

    const qItem = QUESTION_BANK[qIndex];
    const bonus1: string[] = qItem?.options?.flatMap((o: {label:string;bonus:string[]}) => o.bonus) ?? [];
    const bonus2: string[] = [];

    // Three independent passes with offset seeds for maximum variety
    const pass1 = runPass(breed, surname.trim(), gender, seed,           effectiveTown, colour, bonus1, bonus2);
    const pass2 = runPass(breed, surname.trim(), gender, seed + 1000,    effectiveTown, colour, bonus1, bonus2);
    const pass3 = runPass(breed, surname.trim(), gender, seed + 2000,    effectiveTown, colour, bonus1, bonus2);
    const pass4 = runPass(breed, surname.trim(), gender, seed + 3000,    effectiveTown, colour, bonus1, bonus2);
    const pass5 = runPass(breed, surname.trim(), gender, seed + 4000,    effectiveTown, colour, bonus1, bonus2);
    const pass6 = runPass(breed, surname.trim(), gender, seed + 5000,    effectiveTown, colour, bonus1, bonus2);
    const pass7 = runPass(breed, surname.trim(), gender, seed + 6000,    effectiveTown, colour, bonus1, bonus2);
    const pass8 = runPass(breed, surname.trim(), gender, seed + 7000,    effectiveTown, colour, bonus1, bonus2);
    const pass9 = runPass(breed, surname.trim(), gender, seed + 8000,    effectiveTown, colour, bonus1, bonus2);

    // Take top scorer from each pass, then merge all three full lists
    // This guarantees the cream from each independent roll is represented
    const topFromEach = [pass1[0], pass2[0], pass3[0], pass4[0], pass5[0], pass6[0], pass7[0], pass8[0], pass9[0]].filter(Boolean) as Result[];
    const allCandidates = [...pass1, ...pass2, ...pass3, ...pass4, ...pass5, ...pass6, ...pass7, ...pass8, ...pass9];
    allCandidates.sort((a,b) => b.score - a.score);

    // Ensure top picks from each pass appear in results
    const merged = [...topFromEach, ...allCandidates];
    const allDeduped = dedupeResults(merged.filter(Boolean) as Result[]).sort((a,b) => b.score - a.score);
    const scored21 = allDeduped.filter(r => r.score >= 17);
    const ranked2 = rankResults(scored21, breed ? getGroup(breed) : "default");
    setResults(ranked2.length > 0 ? ranked2.slice(0,5) : rankResults(allDeduped, breed ? getGroup(breed) : "default").slice(0,5));
    setStage("reveal");
  }

  function handleRollAgain() {
    const s = Math.floor(Math.random() * 10000);
    setSeed(s);
    setResults([]);
    const qi = pickOneQuestion(s);
    setQIndex(qi);
    const showQuestion = Math.random() < 0.33;
    if (showQuestion) {
      setStage("question");
    } else {
      // Skip questions, generate directly with empty bonus pools
      const townMatch2 = FUNNY_PLACES.has(town.trim());
      const et = townMatch2 ? town.trim() : "";
      const p1 = runPass(breed, surname.trim(), gender, s,        et, colour, [], []);
      const p2 = runPass(breed, surname.trim(), gender, s + 1000, et, colour, [], []);
      const p3 = runPass(breed, surname.trim(), gender, s + 2000, et, colour, [], []);
      const p4 = runPass(breed, surname.trim(), gender, s + 3000, et, colour, [], []);
      const p5 = runPass(breed, surname.trim(), gender, s + 4000, et, colour, [], []);
      const p6 = runPass(breed, surname.trim(), gender, s + 5000, et, colour, [], []);
      const p7 = runPass(breed, surname.trim(), gender, s + 6000, et, colour, [], []);
      const p8 = runPass(breed, surname.trim(), gender, s + 7000, et, colour, [], []);
      const p9 = runPass(breed, surname.trim(), gender, s + 8000, et, colour, [], []);
      const top3 = [p1[0], p2[0], p3[0], p4[0], p5[0], p6[0], p7[0], p8[0], p9[0]].filter(Boolean) as Result[];
      const all3 = [...p1, ...p2, ...p3, ...p4, ...p5, ...p6, ...p7, ...p8, ...p9].sort((a,b) => b.score - a.score);
      const allD = dedupeResults([...top3, ...all3].filter(Boolean) as Result[]).sort((a,b) => b.score - a.score);
      const sc21 = allD.filter(r => r.score >= 22);
      const ranked = rankResults(sc21, breed ? getGroup(breed) : "default");
      setResults(ranked.length > 0 ? ranked.slice(0,5) : rankResults(allD, breed ? getGroup(breed) : "default").slice(0,5));
      setStage("reveal");
    }
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
          {fromCalculator && breed && stage === "inputs" && (() => {
            const img = CARD_IMAGE[breed] ?? null;
            return (
              <div style={{
                display:"flex", alignItems:"center", gap:16, marginBottom:24,
                background:"var(--navy)", borderRadius:16, padding:"14px 18px",
                animation:"fadeInDown 0.4s ease"
              }}>
                {img && (
                  <img src={img} alt={breed} style={{
                    width:64, height:"auto", borderRadius:10, flexShrink:0,
                    transform:"rotate(-2deg)", boxShadow:"0 4px 16px rgba(0,0,0,0.25)"
                  }} />
                )}
                <div>
                  <div style={{ fontFamily:"var(--font-display)", color:"var(--yellow)", fontSize:"clamp(0.9rem,2.5vw,1.1rem)", lineHeight:1.2 }}>
                    Found your best chum!
                  </div>
                  <div style={{ fontFamily:"var(--font-body)", color:"var(--blue-sky)", fontSize:"0.85rem", marginTop:4 }}>
                    Now let&apos;s give {breed} a name.
                  </div>
                </div>
              </div>
            );
          })()}
          {stage === "inputs" && (
            <div style={{ background:"var(--navy)", borderRadius:20, padding:"clamp(20px,4vw,36px)" }}>
              {!fromCalculator && (<>
                <label style={{ display:"block", color:"var(--yellow)", fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, fontFamily:"var(--font-body)" }}>Your dog&apos;s breed</label>
                <select value={breed} onChange={(e: { target: HTMLSelectElement }) => setBreed(e.target.value)}
                  style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:breed?"#fff":"rgba(255,255,255,0.4)", fontFamily:"var(--font-body)", fontSize:"0.95rem", marginBottom:20, outline:"none", boxSizing:"border-box" }}>
                  <option value="">-- Select a breed --</option>
                  <optgroup label="Pedigree Chums Pack Breeds">
                    {PACK_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </optgroup>
                  <optgroup label="Other Breeds">
                    {OTHER_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </optgroup>
                </select>
              </>)}

              <label style={{ display:"block", color:"var(--yellow)", fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, fontFamily:"var(--font-body)" }}>Your surname</label>
              <input type="text" value={surname} onChange={(e: { target: HTMLInputElement }) => setSurname(e.target.value)}
                placeholder="e.g. Jones, Clarke, Thompson-Alexander..."
                maxLength={60} onKeyDown={(e: { key: string }) => e.key === "Enter" && handleGenerate()}
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

          {/* ── STAGE 2: QUESTIONS ── */}
          {stage === "question" && (() => {
            const qItem = QUESTION_BANK[qIndex];
            return (
              <div style={{ background:"var(--navy)", borderRadius:20, padding:"clamp(24px,5vw,48px)", paddingTop:"clamp(80px,12vw,120px)" }}>
                <p className="display" style={{ fontSize:"clamp(1.2rem,3.5vw,1.8rem)", color:"#fff", marginBottom:32, lineHeight:1.3, textAlign:"center" }}>
                  {qItem.text}
                </p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center" }}>
                  {qItem.options.map((opt: {label:string;bonus:string[]}) => (
                    <button key={opt.label} onClick={() => handleAnswer(opt.label)}
                      style={{ padding:"12px 22px", borderRadius:12, border:"2px solid rgba(255,255,255,0.25)", background:"rgba(255,255,255,0.08)", color:"#fff", fontFamily:"var(--font-body)", fontSize:"0.95rem", fontWeight:700, cursor:"pointer" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── STAGE 3: REVEAL ── */}
          {stage === "reveal" && results.length > 0 && (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:16, marginBottom:20 }}>
                {results.map((r: Result, i: number) => (
                  <div key={i} style={{
                    position:"relative",
                    background:"linear-gradient(to top right, #00e2ff, #008eff)",
                    borderRadius:40,
                    padding:"clamp(20px,3.5vw,32px)",
                    paddingRight: cardImg ? "clamp(150px,38vw,240px)" : "clamp(20px,3.5vw,32px)",
                    boxShadow:"0 18px 40px rgba(10,58,87,0.28)",
                    overflow:"visible"
                  }}>
                    {/* Breed card -- rotated 2deg, anchored to top-right corner of box */}
                    {cardImg && (
                      <div style={{
                        position:"absolute",
                        right:-12,
                        top:-110,
                        zIndex:2,
                        transform:"rotate(2deg)",
                        transformOrigin:"bottom right",
                        filter:"drop-shadow(0 8px 24px rgba(10,58,87,0.28))"
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cardImg} alt={breed} style={{ width:"clamp(140px,35vw,220px)", height:"auto", borderRadius:14, display:"block" }} />
                      </div>
                    )}
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      {i === 0 && <div style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--navy)", background:"var(--yellow)", padding:"4px 14px", borderRadius:999, fontFamily:"var(--font-body)" }}>Top pick</div>}
                      <div style={{ fontSize:"0.65rem", fontWeight:700, fontFamily:"var(--font-body)", color:"#fff", background: r.score >= 22 ? "rgba(147,51,234,0.7)" : "rgba(10,58,87,0.3)", padding:"4px 10px", borderRadius:999 }}>{r.score}</div>
                    </div>
                    <div style={{ fontFamily:"var(--font-display)", fontSize:"clamp(1.3rem,5vw,1.9rem)", color:"#fff", marginBottom:8, lineHeight:1.1, letterSpacing:"0.01em", textAlign:"center", textShadow:"0 2px 8px rgba(10,58,87,0.3)" }}>{r.full}</div>
                    {r.nickname && (
                      <div style={{ fontSize:"clamp(1rem,3vw,1.1rem)", color:"var(--navy)", fontStyle:"italic", marginBottom:14, fontFamily:"var(--font-body)", fontWeight:700, textAlign:"center" }}>
                        Known to friends as: {r.nickname}
                      </div>
                    )}
                    <div style={{ fontSize:"clamp(1rem,3vw,1.15rem)", color:"var(--navy)", lineHeight:1.6, borderTop:"1px solid rgba(10,58,87,0.2)", paddingTop:12, fontFamily:"var(--font-body)", textAlign:"center", fontWeight:500 }}>{r.reasoning}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:12 }}>
                <button onClick={handleRollAgain} className="display"
                  style={{ flex:1, padding:15, borderRadius:14, border:"3px solid var(--navy)", background:"transparent", color:"var(--navy)", fontSize:"clamp(0.9rem,2vw,1.1rem)", cursor:"pointer", letterSpacing:"0.04em" }}>
                  Roll again
                </button>
                <button onClick={() => { setStage("inputs"); setResults([]); setQIndex(0); }} className="display"
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
