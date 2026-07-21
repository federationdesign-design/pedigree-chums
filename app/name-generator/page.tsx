"use client";
import React, { useState, useEffect, useRef } from "react";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import ShortlistBar, { type ShortlistEntry } from "./ShortlistBar";
import KnockoutRound from "./KnockoutRound";
import { BANNED_WORDS } from "./bannedWords";

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
  "Saint Bernard": "/st-bernard-card.jpg",
  "Shih Tzu": "/shuh-tzu-card.jpg",
  "Siberian Husky": "/husky-card.jpg",
  "Springer Spaniel": "/springer-card.jpg",
  "Staffordshire Bull Terrier": "/staffy-card.jpg",
  "Weimaraner": "/weinaraner-card.jpg",
  "West Highland Terrier": "/west-highland-card.jpg",
  "Whippet": "/whippet-card.jpg",
  "Yorkshire Terrier": "/yorkshire-card.jpg"
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
  {code:"BB",meaning:"Big Boss",gender:"boy"},
  {code:"BB",meaning:"Big Boss",gender:"boy"},
  {code:"BA",meaning:"Bad Attitude",gender:"boy",breeds:["character","boxer"]},
  {code:"BA",meaning:"Bad Attitude",gender:"boy",breeds:["character","boxer"]},
  {code:"BA",meaning:"Bad Attitude",gender:"boy",breeds:["character","boxer"]},
  {code:"BA",meaning:"Bad Attitude",gender:"boy",breeds:["character","boxer"]},
  {code:"BC",meaning:"Boss Commander",gender:"boy"},
  {code:"BD",meaning:"Big Deal",gender:"boy"},
  {code:"BD",meaning:"Big Deal",gender:"boy"},
  {code:"BG",meaning:"Big Gangster",gender:"boy",breeds:["character","boxer"]},
  {code:"BK",meaning:"Boss King",gender:"boy"},
  {code:"BM",meaning:"Big Money",gender:"boy"},
  {code:"BM",meaning:"Big Money",gender:"boy"},
  {code:"BM",meaning:"Big Money",gender:"boy"},
  {code:"BO",meaning:"Boss Original",gender:"boy"},
  {code:"BO",meaning:"Boss Original",gender:"boy"},
  {code:"BP",meaning:"Big Player",gender:"boy",breeds:["boxer","character","boston","terrier","asian"]},
  {code:"CB",meaning:"Certified Boss",gender:"boy",breeds:["boxer","character","boston","terrier","asian"]},
  {code:"CK",meaning:"Chaos King",gender:"boy",breeds:["terrier","character"]},
  {code:"CLB",meaning:"Certified Lover Boy",gender:"boy"},
  {code:"DB",meaning:"Da Boss",gender:"boy",breeds:["boxer","character","boston","terrier","asian"]},
  {code:"DB",meaning:"Da Boss",gender:"boy",breeds:["boxer","character","boston","terrier","asian"]},
  {code:"DC",meaning:"Dream Chaser",gender:"any"},
  {code:"FL",meaning:"First Lady",gender:"girl"},
  {code:"GC",meaning:"Game Changer",gender:"any"},
  {code:"HB",meaning:"Head Boss",gender:"boy",breeds:["boxer","character","boston","terrier","asian"]},
  {code:"HB",meaning:"Head Boss",gender:"boy",breeds:["boxer","character","boston","terrier","asian"]},
  {code:"HC",meaning:"Heart Collector",gender:"boy"},
  {code:"HK",meaning:"Hong Kong",gender:"boy",breeds:["asian","character"]},
  {code:"HK",meaning:"Hong Kong",gender:"boy",breeds:["asian","character"]},
  {code:"KB",meaning:"King Boss",gender:"boy"},
  {code:"KB",meaning:"King Boss",gender:"boy"},
  {code:"KC",meaning:"King of Chaos",gender:"boy",breeds:["terrier","character"]},
  {code:"KC",meaning:"King of Chaos",gender:"boy",breeds:["terrier","character"]},
  {code:"KO",meaning:"Knockout",gender:"boy",breeds:["boxer"]},
  {code:"LC",meaning:"Ladies Choice",gender:"boy"},
  {code:"LH",meaning:"Ladies Hero",gender:"boy"},
  {code:"LL",meaning:"Ladies Lover",gender:"boy",breeds:["boxer","character","lapdog","asian","terrier","boston","dachshund"]},
  {code:"LL",meaning:"Ladies Lover",gender:"boy",breeds:["boxer","character","lapdog","asian","terrier","boston","dachshund"]},
  {code:"LL",meaning:"Ladies Lover",gender:"boy",breeds:["boxer","character","lapdog","asian","terrier","boston","dachshund"]},
  {code:"LL",meaning:"Ladies Lover",gender:"boy",breeds:["boxer","character","lapdog","asian","terrier","boston","dachshund"]},
  {code:"LP",meaning:"Ladies Pick",gender:"boy"},
  {code:"MB",meaning:"Master Boss",gender:"boy"},
  {code:"MM",meaning:"Mystery Man",gender:"boy"},
  {code:"MM",meaning:"Mystery Man",gender:"boy"},
  {code:"MR",meaning:"Most Respected",gender:"boy"},
  {code:"MVP",meaning:"Most Valued Player",gender:"boy"},
  {code:"NF",meaning:"No Fear",gender:"boy"},
  {code:"OG",meaning:"Original Gangster",gender:"boy",breeds:["character","boxer","terrier","asian","boston"]},
  {code:"OG",meaning:"Original Gangster",gender:"boy",breeds:["character","boxer","terrier","asian","boston"]},
  {code:"OG",meaning:"Original Gangster",gender:"boy",breeds:["character","boxer","terrier","asian","boston"]},
  {code:"PG",meaning:"Power Gangster",gender:"boy",breeds:["character","boxer"]},
  {code:"QL",meaning:"Queen of Love",gender:"girl"},
  {code:"RB",meaning:"Real Boss",gender:"boy"},
  {code:"RL",meaning:"Real Lover",gender:"boy"},
  {code:"TB",meaning:"Top Boss",gender:"boy"},
  {code:"TC",meaning:"Top Cat",gender:"boy"},
  {code:"TC",meaning:"Top Cat",gender:"boy"},
  {code:"TK",meaning:"The King",gender:"boy"},
  {code:"VIP",meaning:"Very Important Person",gender:"any"},
  {code:"YG",meaning:"Young General",gender:"boy",breeds:["boxer","character","boston","terrier","asian"]},
  {code:"YK",meaning:"Young King",gender:"boy"},
  {code:"PC",meaning:"Police Constable",gender:"boy",breeds:["boxer","retriever","default"]},
  {code:"DC",meaning:"Detective Constable",gender:"boy",breeds:["sniffer","default"]},
  {code:"DS",meaning:"Detective Sergeant",gender:"boy",breeds:["sniffer","default"]},
  {code:"DCI",meaning:"Detective Chief Inspector",gender:"boy",breeds:["sniffer","poodle"]},
  {code:"PCSO",meaning:"Police Community Support Officer",gender:"boy",breeds:["character","terrier","boxer"]},
  {code:"Insp",meaning:"Inspector",gender:"boy",breeds:["sniffer","retriever"]},
  {code:"Pte",meaning:"Private",gender:"boy",breeds:["boxer","terrier","character"]},
  {code:"Cpl",meaning:"Corporal",gender:"boy",breeds:["boxer","retriever","german"]},
  {code:"Gnr",meaning:"Gunner",gender:"boy",breeds:["terrier","character","sniffer"]},
  {code:"Rfn",meaning:"Rifleman",gender:"boy",breeds:["sighthound","terrier"]},
  {code:"PO",meaning:"Petty Officer",gender:"boy",breeds:["spaniel","retriever"]},
  {code:"Plt Off",meaning:"Pilot Officer",gender:"boy",breeds:["collie","poodle"]},
  {code:"QC",meaning:"Queen Commander",gender:"girl"},
  {code:"QB",meaning:"Queen Boss",gender:"girl"},
  {code:"QB",meaning:"Queen Boss",gender:"girl"},
  {code:"QG",meaning:"Queen of the Game",gender:"girl"},
  {code:"HQ",meaning:"Her Queenness",gender:"girl"},
  {code:"HH",meaning:"Her Highness",gender:"girl"},
  {code:"BQ",meaning:"Boss Queen",gender:"girl"},
  {code:"DQ",meaning:"Drama Queen",gender:"girl"},
  {code:"DQ",meaning:"Drama Queen",gender:"girl"},
  {code:"GQ",meaning:"Gorgeous Queen",gender:"girl"},
  {code:"LG",meaning:"Lady Gorgeous",gender:"girl"},
  {code:"TC",meaning:"Top Cat",gender:"girl"}
];

const DTRAIN_LETTERS  = ["D"];  // D for Dog -- always
const DTRAIN_SUFFIXES = ["Train","Prince","Money","King","Boss","Smooth","Real","Fresh","Young","Hype"];
const DAWG_PREFIXES   = ["Big","Top","Fresh","Ruff","Mad","Boss","Low","Little","Lil'","Wimpy","Ol'","Sick","Smooth"];
const DAWG_GROUPS     = ["character","boxer","boston"];
const MARIEJ_FIRSTS  = ["Mary","Lisa","Rosa","Lola","Nina","Tina","Gina","Dina","Mona","Fiona","Cara","Sara","Nora","Cora","Vera","Zara","Kara","Lara","Myra","Lyra"];
const MARIEJ_INITIALS = "ABCDJKLMNRST".split("");

// ── RANDOM QUESTIONS ───────────────────────────────────────────────────────────
const QUESTION_BANK: { text: string; options: { label: string; bonus: string[] }[] }[] = [
  { text:"Do you like space?", options:[
    {label:"Yes",bonus:["Luna","Nova","Astro","Apollo","Comet","Orion","Atlas","Jupiter","Saturn","Nebula","Aurora","Eclipse","Cosmos","Titan","Galaxy","Orbit","Meteor","Sirius","Pulsar","Quasar","Vulcan","Pluto","Mercury","Neptune","Galileo","Kepler","Hubble","Vega","Elara","Stella","Astra","Andromeda","Midnight","Twilight","Stardust","Moonbeam","Darkstar","Supernova","Starburst"]},
    {label:"No",bonus:["Biscuit","Pudding","Treacle","Custard","Gravy","Crumble","Dumpling","Toffee","Wobble","Roly","Benny","Norman","Derek"]}
  ]},
  { text:"Do you enjoy smells?", options:[
    {label:"Yes",bonus:["Heather","Sage","Basil","Clover","Sorrel","Flora","Lavender","Rosemary","Jasmine","Bracken","Gorse","Yarrow","Furze","Bramble","Thistle","Hazel","Willow","Rowan","Birch","Thyme","Oregano"]},
    {label:"No",bonus:["Flint","Grit","Gruff","Grunt"]}
  ]},
  { text:"Are you a morning person?", options:[
    {label:"Yes",bonus:["Dawn","Robin","Lark","Crisp","Sparky","Brisk","Perky","Chipper","Sunny","Flash","Bolt","Dart","Dash","Nimble","Zippy","Blaze","Sprint","Rocket"]},
    {label:"No",bonus:["Shadow","Raven","Midnight","Dusk","Mellow","Slumber","Vesper","Nocturne","Murk","Smudge","Umbra","Twilight"]}
  ]},
  { text:"Have you ever talked to a plant?", options:[
    {label:"Yes",bonus:["Willow","Rowan","Hazel","Birch","Clover","Bramble","Heather","Sorrel","Jasmine","Sage","Basil","Thyme","Blossom","Daisy","Flora","Thistle","Yarrow"]},
    {label:"No",bonus:["Flint","Grit","Gruff","Grunt"]}
  ]},
  { text:"Have you ever worn a onesie in public?", options:[
    {label:"Yes",bonus:["Snugglebum","Fifi","Mimi","Lulu","Cuddlekins","Jellybean","Marshmallow","Babbycakes","Poppet","Pudding","Squishface","Booboo","Munchkin","Cupcake","Button","Coco"]},
    {label:"No",bonus:["Norman","Derek","Keith","Brian","Barry","Basil","Kevin","Clive","Trevor","Raymond","Buster","Butch"]}
  ]},
  { text:"Do you believe in ghosts?", options:[
    {label:"Yes",bonus:["Shadow","Raven","Eclipse","Phantom","Wraith","Shade","Murk","Ghost","Spectre","Smoky","Smudge","Umbra","Nightshade","Shadowmoon","Darkstar","Darkside","Midnight","Twilight","Nightfall","Mist"]},
    {label:"No",bonus:["Norman","Derek","Keith","Brian","Barry","Basil","Kevin","Biscuit","Crumble","Custard","Wobble","Roly"]}
  ]},
  { text:"Do you take sugar in your tea?", options:[
    {label:"Yes",bonus:["Biscuit","Pudding","Treacle","Custard","Crumble","Toffee","Sherbet","Smartie","Jammy","Marmalade","Crunchie"]},
    {label:"No",bonus:["Flint","Grit","Gruff","Bolt","Brisk","Crisp"]}
  ]},
  { text:"Do you like myths and legends?", options:[
    {label:"Yes",bonus:["Morgan","Arthur","Percival","Guinevere","Hecate","Circe","Medea","Athena","Hera","Gaia","Calypso","Cassandra","Demeter"]},
    {label:"No",bonus:["Norman","Derek","Keith","Brian","Barry","Kevin","Biscuit","Pudding","Crumble","Wobble","Roly"]}
  ]},
  { text:"Sugar or salt?", options:[
    {label:"Sugar",bonus:["Toffee","Treacle","Custard","Crumble","Pudding","Sherbet","Smartie","Jammy","Marmalade","Crunchie","Biscuit","Jellybean","Skittles"]},
    {label:"Salt",bonus:["Crispy","Crusty","Gherkin","Pretzel","Pickles","Chips","Radish","Parsnip","Cabbage","Pepper","Paprika","Cracker","Sardine","Pickle"]}
  ]},
  { text:"Autumn or summer?", options:[
    {label:"Autumn",bonus:["Rowan","Hazel","Bramble","Conker","Bracken","Russet","Gorse","Birch","Yarrow","Sorrel","Heather","Furze","Thistle","Clover"]},
    {label:"Summer",bonus:["Daisy","Flora","Blossom","Clover","Sunny","Blaze","Flash","Shimmy","Prance","Bounce","Zippy"]}
  ]},
  { text:"How many sides does a circle have?", options:[
    {label:"One",bonus:["Rumpus","Havoc","Chaos","Bonkers","Dingbat","Kerfuffle","Hullabaloo","Ruckus","Mayhem","Mischief","Wobble","Wibble","Fizz","Tumble","Dizzy"]},
    {label:"Two",bonus:["Norman","Derek","Keith","Brian","Barry","Kevin","Basil","Crisp","Flint","Grit"]}
  ]},
  { text:"Tea or coffee?", options:[
    {label:"Tea",bonus:["Willow","Rowan","Clover","Hazel","Bramble","Heather","Birch","Sorrel","Bracken","Thistle","Gorse","Yarrow","Sage","Basil"]},
    {label:"Coffee",bonus:["Espresso","Mocha","Arabica","Scrumpy","Gruff","Grunt","Brisk","Crisp"]}
  ]},
  { text:"Would you rather be invisible or fly?", options:[
    {label:"Invisible",bonus:["Shadow","Ghost","Wraith","Shade","Murk","Mist","Phantom","Spectre","Smoky","Smudge","Eclipse","Dusk","Umbra","Nightshade"]},
    {label:"Fly",bonus:["Falcon","Soar","Glide","Dart","Streak","Bolt","Sprint","Flash","Rocket","Blaze","Dash"]}
  ]},
  { text:"Night owl or early bird?", options:[
    {label:"Night owl",bonus:["Shadow","Raven","Midnight","Dusk","Mellow","Slumber","Vesper","Nocturne","Murk","Smudge","Smoky","Phantom","Umbra","Twilight"]},
    {label:"Early bird",bonus:["Dawn","Lark","Robin","Crisp","Brisk","Zippy","Perky","Chipper","Flash","Sparky","Bounce","Nimble","Sunny"]}
  ]},
  { text:"Are you cool?", options:[
    {label:"Yes",bonus:["Maverick","Diesel","Blaze","Flash","Rocket","Tank","Jax","Gunner","Kodak","Crusher","Hammer","Viper","Falcon","Bolt","Dash"]},
    {label:"No",bonus:["Norman","Derek","Keith","Brian","Barry","Kevin","Basil","Biscuit","Pudding","Crumble","Wobble"]}
  ]},
  { text:"Are you a nerd?", options:[
    {label:"Yes",bonus:["Newton","Einstein","Darwin","Galileo","Kepler","Hubble","Pascal","Socrates","Plato","Pythagoras","Mercury","Bach","Handel"]},
    {label:"No",bonus:["Norman","Derek","Keith","Brian","Barry","Kevin","Basil","Biscuit","Pudding","Wobble","Roly"]}
  ]},
  { text:"Do you make your bed in the morning?", options:[
    {label:"Yes",bonus:["Crisp","Brisk","Bolt","Sprint","Nimble","Flint","Grit"]},
    {label:"No",bonus:["Snugglebum","Pudding","Wobble","Roly","Shuffle","Grumble","Slumber","Mellow","Smudge"]}
  ]},
  { text:"Do you read the terms and conditions?", options:[
    {label:"Yes",bonus:["Norman","Derek","Keith","Brian","Barry","Kevin","Basil","Clive","Raymond","Arthur","Harold","Reginald"]},
    {label:"No",bonus:["Toffee","Treacle","Sherbet","Custard","Pudding","Crumble","Biscuit","Wobble","Roly","Rumpus","Chaos","Havoc"]}
  ]},
  { text:"New book -- break the spine?", options:[
    {label:"Obviously",bonus:["Rumpus","Havoc","Chaos","Bonkers","Maverick","Crash","Smash","Barrel","Charge","Rampage","Reckless","Barge"]},
    {label:"Never",bonus:["Norman","Derek","Keith","Brian","Barry","Kevin","Basil","Crisp","Reginald","Harold"]}
  ]},
  { text:"Reply to texts immediately?", options:[
    {label:"Yes",bonus:["Zippy","Flash","Rocket","Sprint","Bolt","Dart","Dash","Blaze","Streak","Charge","Nimble","Sparky","Brisk"]},
    {label:"No",bonus:["Wobble","Roly","Shuffle","Plod","Mooch","Mellow","Slumber"]}
  ]},
  { text:"Do you eat the crusts?", options:[
    {label:"Yes",bonus:["Norman","Derek","Keith","Brian","Barry","Basil","Kevin","Biscuit","Crispy","Crusty","Grit","Flint"]},
    {label:"No",bonus:["Toffee","Pudding","Custard","Crumble","Wobble","Roly","Poppet","Fifi","Mimi","Lulu","Cupcake"]}
  ]},
  { text:"Ketchup -- fridge or cupboard?", options:[
    {label:"Fridge",bonus:["Toffee","Treacle","Sherbet","Crumble","Custard","Biscuit","Pickle","Gherkin","Cracker","Chips","Pickles"]},
    {label:"Cupboard",bonus:["Norman","Derek","Kevin","Barry","Basil","Clive","Brian","Keith","Raymond","Arthur","Harold"]}
  ]},
  { text:"Escalator -- walk or stand?", options:[
    {label:"Walk",bonus:["Zippy","Flash","Bolt","Sprint","Dash","Dart","Blaze","Streak","Rocket","Charge","Hustle","Surge","Nimble","Brisk"]},
    {label:"Stand",bonus:["Plod","Mooch","Shuffle","Waddle","Lumber","Trundle","Mellow","Wobble"]}
  ]},
  { text:"Party -- kitchen or dance floor?", options:[
    {label:"Kitchen",bonus:["Biscuit","Pudding","Treacle","Custard","Crumble","Toffee","Gherkin","Chips","Pretzel","Pickles","Gravy","Dumpling","Pickle","Sherbet"]},
    {label:"Dance floor",bonus:["Waltz","Foxtrot","Tango","Shimmy","Twirl","Glide","Pirouette","Boogie","Strut","Prance","Salsa","Rumba","Jive","Swing"]}
  ]},
  { text:"Rehearse conversations in your head?", options:[
    {label:"Yes",bonus:["Sherlock","Poirot","Marple","Foyle","Endeavour","Gamache","Alleyn","Tennison","Barnaby"]},
    {label:"No",bonus:["Rumpus","Havoc","Chaos","Bonkers","Dingbat","Kerfuffle","Ruckus","Mayhem","Mischief","Wobble","Fizz"]}
  ]},
  { text:"Do you believe in luck?", options:[
    {label:"Yes",bonus:["Clover","Rowan","Hazel","Bramble","Heather","Bracken","Thistle","Gorse","Yarrow","Birch","Willow","Daisy","Blossom"]},
    {label:"No",bonus:["Flint","Grit","Bolt","Crisp","Brisk","Gruff","Grunt"]}
  ]},
  { text:"Windows or Mac?", options:[
    {label:"Windows",bonus:["Norman","Derek","Keith","Brian","Barry","Kevin","Basil","Clive","Raymond","Arthur","Harold","Reginald"]},
    {label:"Mac",bonus:["Maverick","Rocket","Blaze","Flash","Jax","Bolt","Diesel","Tank","Gunner","Kodak","Crusher","Viper","Falcon"]}
  ]},
  { text:"Are you a good dancer?", options:[
    {label:"Yes",bonus:["Waltz","Foxtrot","Tango","Shimmy","Twirl","Glide","Pirouette","Boogie","Strut","Prance","Salsa","Rumba","Jive","Swing"]},
    {label:"No",bonus:["Plod","Mooch","Shuffle","Lumber","Waddle","Trundle","Wobble","Roly","Clomper","Bumble"]}
  ]},
  { text:"When did you last call your mother?", options:[
    {label:"Recently",bonus:["Biscuit","Pudding","Custard","Crumble","Toffee","Poppet","Blossom","Petal","Rosie","Daisy","Flora","Peaches","Cherry","Berry"]},
    {label:"...",bonus:["Rumpus","Havoc","Chaos","Bonkers","Reckless","Kerfuffle","Mayhem","Ruckus","Mischief","Dingbat","Wobble","Fizz"]}
  ]},
  { text:"What music moves you?", options:[
    {label:"Classical",bonus:["Mozart","Beethoven","Handel","Bach","Brahms","Chopin","Liszt","Schubert","Vivaldi","Purcell","Galileo","Newton","Darwin","Pascal"]},
    {label:"Rock",bonus:["Maverick","Blaze","Bolt","Diesel","Tank","Crusher","Hammer","Flash","Rocket","Gunner","Jax","Viper"]},
    {label:"Jazz",bonus:["Miles","Duke","Billie","Dizzy","Ella","Waltz","Shimmy"]},
    {label:"Pop",bonus:["Shimmy","Sparkle","Boogie","Dazzle","Flash","Bounce","Toffee","Zippy","Smartie","Skittles"]}
  ]},
  { text:"Favourite pizza?", options:[
    {label:"Margherita",bonus:["Basil","Rosemary","Flora","Sage","Oregano","Thyme","Heather","Clover","Sorrel","Lavender","Jasmine"]},
    {label:"Pepperoni",bonus:["Maverick","Rocket","Blaze","Tank","Crusher","Diesel","Gunner","Bolt","Flash","Jax","Viper"]},
    {label:"Hawaiian",bonus:["Mango","Kiwi","Lime","Melon","Peaches","Apricot","Mellow","Sunny","Plum"]},
    {label:"Vegan",bonus:["Willow","Rowan","Hazel","Clover","Bramble","Sorrel","Heather","Yarrow","Birch","Sage","Basil"]}
  ]}
];

function pickThreeQuestions(): number[] {
  const indices = Array.from({length: QUESTION_BANK.length}, (_: unknown, i: number) => i);
  const t = Date.now();
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.abs(t * (i + 1) * 2654435761) / 1e12) % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, 3);
}
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
  pop:      { grand:3, mundane:2, baby:2, chaos:2, absurd:2, informal:2, ironic:2, aloof:1, nature:1, food:1, pop:1 }
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
  spotted: ["Patch","Freckle","Dapple","Motley","Domino","Checkers","Harlequin","Marble","Patches","Dot","Speckle","Splash","Calico"],
  "":      []
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
    h:"glide"
};
  const sf2: Record<string,string> = {
    m:"nasal",n:"nasal",s:"sstop",t:"sstop",p:"sstop",k:"sstop",
    g:"growl",b:"growl",d:"growl",r:"growl",w:"glide2",h:"glide2"
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
  const tf = title.title.replace(/^(Lil'|Ol'|Wee|Baby|Little|Cheeky|Silly|Scruffy|Fluffy|Grumpy|Noisy)\s/,"")[0]?.toLowerCase() ?? "";
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

  // ── PENALISE bare initials as first name ─────────────────────────────────
  if (/^[A-Z]{1,3}$/.test(first.name)) score -= 3;

  // ── PENALISE grand title on baby/food when dog word already contrasts ─────
  if (title.reg === "grand" && (first.reg === "baby" || first.reg === "food") && first.syllables <= 2) {
    const dogContrast = contrastScore(first.reg, dogWord.reg);
    if (dogContrast >= 3) score -= 2;
  }


    // Cartoon-character names -- only work with Dawg as dog word, or chaos/baby title
    const cartoonOnlyWithDawg = new Set(["Tubby","Pudgy","Porky","Wimpy","Doofus","Nincompoop","Scraggy"]);
    if (cartoonOnlyWithDawg.has(first.name)) {
      if (dogWord.word === "Dawg") score += 5;  // perfect match -- Porky Dawg-Jones
      else if (["chaos","baby"].includes(title.reg)) score += 1;  // tolerable with silly title
      else score -= 4;  // penalise -- Baron Tubby Wobble-Harris is wrong register
    }

  // ── Tautology: first name same as or derived from dog word ───────────────────
  // Catches Dasher/Dash, Hunter/Hunt, Dart/Dart etc
  if (first.name.toLowerCase() === dogWord.word.toLowerCase()) score -= 20;
  else if (first.name.toLowerCase().startsWith(dogWord.word.toLowerCase()) ||
           dogWord.word.toLowerCase().startsWith(first.name.toLowerCase())) {
    if (Math.abs(first.name.length - dogWord.word.length) <= 3) score -= 15;
  }

  // ── Surname-fail words (don't hyphenate naturally) ────────────────────────────
  const surnameFails = new Set(["Stalk","Enforce","Devour","Elongate","Extend","Secure","Advance","Launch","Stretch"]);
  if (surnameFails.has(dogWord.word)) score -= 20;

  return score;
}

// ── BREED LISTS ────────────────────────────────────────────────────────────────
const PACK_BREEDS = ["Afghan Hound","Basset Hound","Beagle","Bichon Frise","Bloodhound","Border Collie","Border Terrier","Boston Terrier","Boxer","Bull Terrier","Bulldog","Cavalier King Charles Spaniel","Cavachon","Cavapoo","Chihuahua","Cocker Spaniel","Cockapoo","Corgi","Dachshund","Dalmatian","Doberman Pinscher","French Bulldog","German Shepherd","Golden Retriever","Goldendoodle","Great Dane","Greyhound","Irish Setter","Irish Wolfhound","Italian Greyhound","Jack Russell Terrier","Jackapoo","Labrador","Labradoodle","Lurcher","Maltese","Maltipoo","Mastiff","Miniature Schnauzer","Old English Sheepdog","Papillon","Pomeranian","Poodle","Pug","Rottweiler","Saint Bernard","Shih Tzu","Siberian Husky","Springer Spaniel","Staffordshire Bull Terrier","Weimaraner","West Highland Terrier","Whippet","Yorkshire Terrier"];

// ── TITLE BANKS ────────────────────────────────────────────────────────────────
const BOY_TITLES: Record<string, TitleEntry[]> = {
  // Terriers -- Mr is the joke, no grand title needed
  terrier:    [{title:"Mr",reg:"mundane",syllables:1},{title:"Gobby",reg:"absurd",syllables:2},{title:"Ar Kid",reg:"absurd",syllables:2},{title:"Gaffer",reg:"mundane",syllables:2},{title:"Skipper",reg:"mundane",syllables:2},{title:"Squire",reg:"mundane",syllables:1},{title:"Uncle",reg:"mundane",syllables:2},{title:"Yay Big",reg:"absurd",syllables:2},{title:"Chuddy",reg:"absurd",syllables:2},{title:"Brassic",reg:"absurd",syllables:2},{title:"Two Dogs",reg:"absurd",syllables:2},{title:"Dibble",reg:"absurd",syllables:2},{title:"Hop'along",reg:"absurd",syllables:3},{title:"Jammy",reg:"absurd",syllables:2},{title:"Mucker",reg:"mundane",syllables:2},{title:"Nah Then",reg:"absurd",syllables:2},{title:"Ow Much",reg:"absurd",syllables:2},{title:"Faffin",reg:"absurd",syllables:2}],
  // Spaniels -- working military and police dogs
  spaniel:    [{title:"Field Marshal",reg:"grand",syllables:3},{title:"General",reg:"grand",syllables:3},{title:"Admiral",reg:"grand",syllables:3},{title:"Brigadier",reg:"grand",syllables:3},{title:"Colonel",reg:"grand",syllables:2},{title:"Inspector",reg:"grand",syllables:3},{title:"Chief Inspector",reg:"grand",syllables:4}],
  // Retrievers / Labs -- guide dogs, detection dogs, civic service
  retriever:  [{title:"Commissioner",reg:"grand",syllables:4},{title:"Chief Inspector",reg:"grand",syllables:4},{title:"Inspector",reg:"grand",syllables:3},{title:"Judge",reg:"grand",syllables:1},{title:"Colonel",reg:"grand",syllables:2},{title:"Major",reg:"grand",syllables:2}],
  // German Shepherd / Doberman / Rottweiler / Weimaraner -- military working dogs
  german:     [{title:"Emperor",reg:"grand",syllables:4},{title:"Colonel",reg:"grand",syllables:2},{title:"Major",reg:"grand",syllables:2},{title:"Captain",reg:"grand",syllables:2},{title:"Sergeant Major",reg:"grand",syllables:4},{title:"General",reg:"grand",syllables:3}],
  // Collies -- intelligence not brawn
  collie:     [{title:"Professor",reg:"grand",syllables:3},{title:"Doctor",reg:"grand",syllables:2},{title:"Chief Analyst",reg:"grand",syllables:4},{title:"Commissioner",reg:"grand",syllables:4}],
  // Boxer / Staffie / Bull Terrier -- street respect, civic pomp
  boxer:      [{title:"Sergeant",reg:"grand",syllables:2},{title:"Sir",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Right Honourable",reg:"grand",syllables:4},{title:"Corporal",reg:"grand",syllables:3}],
  // Sniffer dogs -- detectives
  sniffer:    [{title:"Inspector",reg:"grand",syllables:3},{title:"Chief Inspector",reg:"grand",syllables:4},{title:"Commissioner",reg:"grand",syllables:4},{title:"Judge",reg:"grand",syllables:1},{title:"DCI",reg:"grand",syllables:3},{title:"DS",reg:"grand",syllables:2}],
  // Sighthounds -- pure aristocracy
  afghan:     [{title:"Duke",reg:"grand",syllables:1},{title:"Earl",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Baron",reg:"grand",syllables:2},{title:"Viscount",reg:"grand",syllables:2},{title:"Prince",reg:"grand",syllables:1},{title:"Sir",reg:"grand",syllables:1},{title:"Emperor",reg:"grand",syllables:4},{title:"Tsar",reg:"grand",syllables:1},{title:"Marquess",reg:"grand",syllables:2},{title:"Count",reg:"grand",syllables:1},{title:"Silky",reg:"grand",syllables:2}],
  sighthound: [{title:"Duke",reg:"grand",syllables:1},{title:"Earl",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Sir",reg:"grand",syllables:1},{title:"Viscount",reg:"grand",syllables:2},{title:"Baron",reg:"grand",syllables:2}],
  greatdane:  [{title:"Big",reg:"informal",syllables:1},{title:"Little",reg:"informal",syllables:2},{title:"Lil'",reg:"informal",syllables:1},{title:"Ol'",reg:"informal",syllables:1},{title:"Emperor",reg:"grand",syllables:4},{title:"Commander",reg:"grand",syllables:3},{title:"Admiral",reg:"grand",syllables:3},{title:"General",reg:"grand",syllables:3},{title:"Captain",reg:"grand",syllables:2},{title:"Commodore",reg:"grand",syllables:3},{title:"Duke",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Magnificent",reg:"grand",syllables:4},{title:"Legendary",reg:"grand",syllables:4},{title:"Unstoppable",reg:"grand",syllables:4}],
  // Giants -- scale demands grandeur
  giant:      [{title:"Big",reg:"informal",syllables:1},{title:"Little",reg:"informal",syllables:2},{title:"Lil'",reg:"informal",syllables:1},{title:"Ol'",reg:"informal",syllables:1},{title:"Emperor",reg:"grand",syllables:4},{title:"Magnificent",reg:"grand",syllables:4},{title:"Formidable",reg:"grand",syllables:4},{title:"Legendary",reg:"grand",syllables:4},{title:"Great",reg:"grand",syllables:1},{title:"Duke",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1}],
  // Poodle -- academic only
  poodle:     [{title:"Professor",reg:"grand",syllables:3},{title:"Doctor",reg:"grand",syllables:2},{title:"Chief Analyst",reg:"grand",syllables:4},{title:"Maestro",reg:"grand",syllables:3},{title:"Monsieur",reg:"grand",syllables:2},{title:"French",reg:"grand",syllables:1},{title:"Onion",reg:"absurd",syllables:2},{title:"Garlic",reg:"absurd",syllables:2},{title:"Menu",reg:"grand",syllables:2},{title:"Chef",reg:"grand",syllables:1},{title:"C'est la vie",reg:"absurd",syllables:3},{title:"À la",reg:"absurd",syllables:2},{title:"Baguette",reg:"absurd",syllables:2},{title:"Canapé",reg:"absurd",syllables:3},{title:"Chic",reg:"absurd",syllables:1},{title:"Crêpe",reg:"absurd",syllables:1},{title:"Film noir",reg:"absurd",syllables:2},{title:"Parkour",reg:"absurd",syllables:2},{title:"Raconteur",reg:"grand",syllables:3},{title:"Sans",reg:"absurd",syllables:1},{title:"Touché",reg:"absurd",syllables:2},{title:"Après",reg:"absurd",syllables:2},{title:"Début",reg:"absurd",syllables:2},{title:"En suite",reg:"absurd",syllables:2},{title:"Pan Pan",reg:"absurd",syllables:2}],
  // Lapdog -- ecclesiastical pomp
  lapdog:     [{title:"Lil'",reg:"informal",syllables:1},{title:"Baby",reg:"informal",syllables:2},{title:"Little",reg:"informal",syllables:2},{title:"Cheeky",reg:"informal",syllables:2},{title:"Silly",reg:"informal",syllables:2},{title:"Scruffy",reg:"informal",syllables:2},{title:"Fluffy",reg:"informal",syllables:2},{title:"Grumpy",reg:"informal",syllables:2},{title:"Squishy",reg:"informal",syllables:2},{title:"Itsy",reg:"informal",syllables:2},{title:"Teeny",reg:"informal",syllables:2},{title:"Sir",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Prince",reg:"grand",syllables:1},{title:"Duke",reg:"grand",syllables:1},{title:"Count",reg:"grand",syllables:1},{title:"Baron",reg:"grand",syllables:2},{title:"Master",reg:"grand",syllables:2},{title:"Little Lord",reg:"grand",syllables:3},{title:"Reverend",reg:"grand",syllables:3},{title:"Bishop",reg:"grand",syllables:2},{title:"Archdeacon",reg:"grand",syllables:3}],
  // Bulldog specifically -- Churchill energy
  bulldog:    [{title:"Sir",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Right Honourable",reg:"grand",syllables:4},{title:"Field Marshal",reg:"grand",syllables:3}],
  boston:     [{title:"Commissioner",reg:"grand",syllables:4},{title:"Alderman",reg:"grand",syllables:3},{title:"Senator",reg:"grand",syllables:3},{title:"Colonel",reg:"grand",syllables:2},{title:"Judge",reg:"grand",syllables:1},{title:"Captain",reg:"grand",syllables:2},{title:"Boss",reg:"grand",syllables:1},{title:"Chief",reg:"grand",syllables:1},{title:"Major",reg:"grand",syllables:2},{title:"Sheriff",reg:"grand",syllables:2},{title:"Marshal",reg:"grand",syllables:2},{title:"Commodore",reg:"grand",syllables:3}],
  asian:      [{title:"Hong Kong",reg:"grand",syllables:3},{title:"Ninja",reg:"grand",syllables:2},{title:"Ronin",reg:"grand",syllables:2},{title:"Master",reg:"grand",syllables:2},
  {title:"Grand Master",reg:"grand",syllables:3},
  {title:"Dragon",reg:"grand",syllables:2},
  {title:"Emperor",reg:"grand",syllables:4},
  
  {title:"Incomparable",reg:"grand",syllables:5}
],
  // Character breeds -- self-appointed grandeur
  character:  [{title:"Baron",reg:"grand",syllables:2},{title:"Emperor",reg:"grand",syllables:4},{title:"Señor",reg:"grand",syllables:2},{title:"Bandito",reg:"absurd",syllables:3},{title:"Loco",reg:"absurd",syllables:2},{title:"Gremlin",reg:"absurd",syllables:2},{title:"Turbo",reg:"absurd",syllables:2},{title:"Corporal",reg:"grand",syllables:3},{title:"Duke",reg:"grand",syllables:1},{title:"Prince",reg:"grand",syllables:1},{title:"Sir",reg:"grand",syllables:1},{title:"Boss",reg:"grand",syllables:1},{title:"Big",reg:"informal",syllables:1},{title:"Lil'",reg:"informal",syllables:1},{title:"Ol'",reg:"informal",syllables:1},{title:"Mr",reg:"mundane",syllables:1},{title:"Mayhem",reg:"absurd",syllables:2},{title:"Don",reg:"grand",syllables:1}],
  // Gentry -- Dalmatian, OES etc
  gentry:     [{title:"Viscount",reg:"grand",syllables:2},{title:"Baron",reg:"grand",syllables:2},{title:"Right Honourable",reg:"grand",syllables:4},{title:"Lord",reg:"grand",syllables:1},{title:"Sir",reg:"grand",syllables:1}],
  // Dachshund -- absurdly self-important
  dachshund:  [{title:"Field Marshal",reg:"grand",syllables:3},{title:"General",reg:"grand",syllables:3},{title:"Colonel",reg:"grand",syllables:2},{title:"Major",reg:"grand",syllables:2},{title:"Captain",reg:"grand",syllables:2},{title:"Sergeant",reg:"grand",syllables:2},{title:"Corporal",reg:"grand",syllables:3},{title:"Admiral",reg:"grand",syllables:3},{title:"Brigadier",reg:"grand",syllables:3},{title:"Big",reg:"informal",syllables:1},{title:"Lil'",reg:"informal",syllables:1},{title:"Ol'",reg:"informal",syllables:1},{title:"Little",reg:"informal",syllables:2},{title:"Long",reg:"informal",syllables:1},{title:"Shorty",reg:"informal",syllables:2},{title:"Shortstop",reg:"absurd",syllables:2},{title:"Drafty",reg:"absurd",syllables:2},{title:"Magnificent",reg:"grand",syllables:4}],
  corgi:      [{title:"Prince",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Sir",reg:"grand",syllables:1},{title:"Baron",reg:"grand",syllables:2},{title:"Archdruid",reg:"grand",syllables:3},{title:"Bard",reg:"grand",syllables:1},{title:"Captain",reg:"grand",syllables:2},{title:"Sergeant",reg:"grand",syllables:2},{title:"Inspector",reg:"grand",syllables:3},{title:"Mr",reg:"mundane",syllables:1}],
  westie:    [{title:"Wee",reg:"informal",syllables:1},{title:"Laird",reg:"grand",syllables:1},{title:"Auld",reg:"informal",syllables:1},{title:"Big",reg:"informal",syllables:1},{title:"Chieftain",reg:"grand",syllables:2},{title:"Thane",reg:"grand",syllables:2},{title:"Provost",reg:"grand",syllables:2},{title:"Sir",reg:"grand",syllables:1},{title:"Mr",reg:"mundane",syllables:1},{title:"Ol'",reg:"informal",syllables:1}],
  doodle:    [{title:"Fluffy",reg:"informal",syllables:2},{title:"Cheeky",reg:"informal",syllables:2},{title:"Bouncy",reg:"informal",syllables:2},{title:"Little",reg:"informal",syllables:2},{title:"Lil'",reg:"informal",syllables:1},{title:"Wee",reg:"informal",syllables:1},{title:"Sir",reg:"grand",syllables:1},{title:"Captain",reg:"grand",syllables:2},{title:"Professor",reg:"grand",syllables:3},{title:"Baby",reg:"informal",syllables:2},{title:"Snuggle",reg:"informal",syllables:2},{title:"Ol'",reg:"informal",syllables:1}],
  setter:    [{title:"Himself",reg:"grand",syllables:2},{title:"Lord",reg:"grand",syllables:1},{title:"Squire",reg:"grand",syllables:2},{title:"Master",reg:"grand",syllables:2},{title:"Captain",reg:"grand",syllables:2},{title:"Colonel",reg:"grand",syllables:3},{title:"Sir",reg:"grand",syllables:1},{title:"Wild",reg:"informal",syllables:1},{title:"Bold",reg:"informal",syllables:1},{title:"Grand",reg:"grand",syllables:1},{title:"Chieftain",reg:"grand",syllables:2}],
  sheepdog:  [{title:"Squire",reg:"grand",syllables:2},{title:"Farmer",reg:"mundane",syllables:2},{title:"Shepherd",reg:"mundane",syllables:2},{title:"Master",reg:"grand",syllables:2},{title:"Sir",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Colonel",reg:"grand",syllables:3},{title:"Reverend",reg:"grand",syllables:3},{title:"Old",reg:"informal",syllables:1},{title:"Gaffer",reg:"mundane",syllables:2}],
  default:    [{title:"Sir",reg:"grand",syllables:1},{title:"Lord",reg:"grand",syllables:1},{title:"Inspector",reg:"grand",syllables:3},{title:"Baron",reg:"grand",syllables:2}]
};

const GIRL_TITLES: Record<string, TitleEntry[]> = {
  terrier:    [{title:"Miss",reg:"mundane",syllables:1},{title:"Ar Girl",reg:"absurd",syllables:2},{title:"Chook",reg:"absurd",syllables:1},{title:"Lady Muck",reg:"grand",syllables:3},{title:"Lass",reg:"mundane",syllables:1},{title:"Tatty",reg:"absurd",syllables:2},{title:"Belta",reg:"absurd",syllables:2},{title:"Sweets",reg:"absurd",syllables:1},{title:"Bappy",reg:"absurd",syllables:2}],
  spaniel:    [{title:"Dame",reg:"grand",syllables:1},{title:"Lady",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Duchess",reg:"grand",syllables:2},{title:"Viscountess",reg:"grand",syllables:3},{title:"Marchioness",reg:"grand",syllables:3},{title:"Queen",reg:"grand",syllables:1},{title:"Grand Duchess",reg:"grand",syllables:3},{title:"Princess",reg:"grand",syllables:3},{title:"Tsarina",reg:"grand",syllables:3},{title:"Kaiserin",reg:"grand",syllables:3}],
  retriever:  [{title:"Dame",reg:"grand",syllables:1},{title:"Lady",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Viscountess",reg:"grand",syllables:3},{title:"Baroness",reg:"grand",syllables:3},{title:"Queen",reg:"grand",syllables:1},{title:"Princess",reg:"grand",syllables:3},{title:"Matriarch",reg:"grand",syllables:3}],
  german:     [{title:"Countess",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Baroness",reg:"grand",syllables:3},{title:"Lady",reg:"grand",syllables:2},{title:"Kaiserin",reg:"grand",syllables:3},{title:"Tsarina",reg:"grand",syllables:3},{title:"Empress",reg:"grand",syllables:3},{title:"Grand Duchess",reg:"grand",syllables:3},{title:"Valkyrie",reg:"grand",syllables:3},{title:"Warrior Queen",reg:"grand",syllables:4},{title:"Shieldmaiden",reg:"grand",syllables:3}],
  greatdane:  [{title:"Big",reg:"informal",syllables:1},{title:"Little",reg:"informal",syllables:2},{title:"Lil'",reg:"informal",syllables:1},{title:"Ol'",reg:"informal",syllables:1},{title:"Empress",reg:"grand",syllables:3},{title:"Cosmic Queen",reg:"grand",syllables:4},{title:"Star Queen",reg:"grand",syllables:3},{title:"Moon Queen",reg:"grand",syllables:3},{title:"Goddess",reg:"grand",syllables:2},{title:"Titaness",reg:"grand",syllables:3},{title:"Magnificent",reg:"grand",syllables:4},{title:"Legendary",reg:"grand",syllables:4},{title:"Tsarina",reg:"grand",syllables:3},{title:"Valkyrie",reg:"grand",syllables:3},{title:"Duchess",reg:"grand",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Celestia",reg:"grand",syllables:4}],
  collie:     [{title:"Professor",reg:"grand",syllables:3},{title:"Doctor",reg:"grand",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Queen",reg:"grand",syllables:1},{title:"Matriarch",reg:"grand",syllables:3},{title:"Oracle",reg:"grand",syllables:3},{title:"Huntress",reg:"grand",syllables:2}],
  boxer:      [{title:"Dame",reg:"grand",syllables:1},{title:"Lady",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Right Honourable",reg:"grand",syllables:4}],
  sniffer:    [{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Countess",reg:"grand",syllables:2},{title:"Doctor",reg:"grand",syllables:2},{title:"Inspector",reg:"grand",syllables:3},{title:"Detective",reg:"grand",syllables:3},{title:"Duchess",reg:"grand",syllables:2},{title:"Baroness",reg:"grand",syllables:3},{title:"Sergeant",reg:"grand",syllables:2},{title:"Chief Inspector",reg:"grand",syllables:4}],
  afghan:     [{title:"Queen",reg:"grand",syllables:1},{title:"HRH",reg:"grand",syllables:3},{title:"Duchess",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Baroness",reg:"grand",syllables:3},{title:"Viscountess",reg:"grand",syllables:3},{title:"Princess",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Empress",reg:"grand",syllables:2},{title:"Tsarina",reg:"grand",syllables:3},{title:"Regina",reg:"grand",syllables:3},{title:"Contessa",reg:"grand",syllables:3},{title:"Marquise",reg:"grand",syllables:2},{title:"Silky",reg:"grand",syllables:2},{title:"Glossy",reg:"grand",syllables:2},{title:"Shiney",reg:"grand",syllables:2},{title:"Shimmer",reg:"grand",syllables:2}],
  sighthound: [{title:"Duchess",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Viscountess",reg:"grand",syllables:3},{title:"Baroness",reg:"grand",syllables:3},{title:"Marchioness",reg:"grand",syllables:3},{title:"Queen",reg:"grand",syllables:1},{title:"Princess",reg:"grand",syllables:3},{title:"Tsarina",reg:"grand",syllables:3},{title:"Valkyrie",reg:"grand",syllables:3},{title:"Regina",reg:"grand",syllables:3},{title:"Reina",reg:"grand",syllables:2},{title:"Reine",reg:"grand",syllables:1}],
  giant:      [{title:"Big",reg:"informal",syllables:1},{title:"Little",reg:"informal",syllables:2},{title:"Lil'",reg:"informal",syllables:1},{title:"Ol'",reg:"informal",syllables:1},{title:"Empress",reg:"grand",syllables:3},{title:"Queen",reg:"grand",syllables:1},{title:"Magnificent",reg:"grand",syllables:4},{title:"Formidable",reg:"grand",syllables:4},{title:"Legendary",reg:"grand",syllables:4},{title:"Tsarina",reg:"grand",syllables:3},{title:"Titaness",reg:"grand",syllables:3},{title:"Matriarch",reg:"grand",syllables:3},{title:"Warrior Queen",reg:"grand",syllables:4},{title:"Great",reg:"grand",syllables:1},{title:"Duchess",reg:"grand",syllables:2},{title:"Kaiserin",reg:"grand",syllables:3}],
  poodle:     [{title:"Professor",reg:"grand",syllables:3},{title:"Doctor",reg:"grand",syllables:2},{title:"Queen",reg:"grand",syllables:1},{title:"Goddess",reg:"grand",syllables:2},{title:"Oracle",reg:"grand",syllables:3},{title:"Grande Dame",reg:"grand",syllables:3},{title:"Enchantress",reg:"grand",syllables:3},{title:"Chef",reg:"grand",syllables:1},{title:"C'est la vie",reg:"absurd",syllables:3},{title:"À la",reg:"absurd",syllables:2},{title:"Canapé",reg:"absurd",syllables:3},{title:"Chic",reg:"absurd",syllables:1},{title:"Crêpe",reg:"absurd",syllables:1},{title:"Après",reg:"absurd",syllables:2},{title:"Début",reg:"absurd",syllables:2},{title:"En suite",reg:"absurd",syllables:2},{title:"Pan Pan",reg:"absurd",syllables:2}],
  lapdog:     [{title:"Lil'",reg:"informal",syllables:1},{title:"Baby",reg:"informal",syllables:2},{title:"Little",reg:"informal",syllables:2},{title:"Cheeky",reg:"informal",syllables:2},{title:"Silly",reg:"informal",syllables:2},{title:"Scruffy",reg:"informal",syllables:2},{title:"Fluffy",reg:"informal",syllables:2},{title:"Grumpy",reg:"informal",syllables:2},{title:"Squishy",reg:"informal",syllables:2},{title:"Itsy",reg:"informal",syllables:2},{title:"Teeny",reg:"informal",syllables:2},{title:"Queen",reg:"grand",syllables:1},{title:"Princess",reg:"grand",syllables:3},{title:"Goddess",reg:"grand",syllables:2},{title:"Enchantress",reg:"grand",syllables:3},{title:"Crystal Queen",reg:"grand",syllables:4},{title:"Moon Queen",reg:"grand",syllables:3},{title:"Rose Queen",reg:"grand",syllables:2},{title:"Diamond Queen",reg:"grand",syllables:4},{title:"Pearl Queen",reg:"grand",syllables:2}],
  bulldog:    [{title:"Dame",reg:"grand",syllables:1},{title:"Lady",reg:"grand",syllables:2},{title:"Right Honourable",reg:"grand",syllables:4},{title:"Baroness",reg:"grand",syllables:3},{title:"Countess",reg:"grand",syllables:2},{title:"Duchess",reg:"grand",syllables:2},{title:"Princess",reg:"grand",syllables:3},{title:"Madame",reg:"grand",syllables:2},{title:"Most Honourable",reg:"grand",syllables:4},{title:"Queen",reg:"grand",syllables:1},{title:"Warrior Queen",reg:"grand",syllables:4},{title:"Miss",reg:"mundane",syllables:1},{title:"Prime Minister",reg:"grand",syllables:4},{title:"Home Secretary",reg:"grand",syllables:4},{title:"Mrs",reg:"mundane",syllables:2},{title:"Ducky",reg:"informal",syllables:2}],
  boston:     [{title:"Madame",reg:"grand",syllables:2},{title:"Miss",reg:"mundane",syllables:1},{title:"Lady",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Duchess",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Baroness",reg:"grand",syllables:3}],
  asian:      [
  {title:"Empress",reg:"grand",syllables:3},
  {title:"Dragon Lady",reg:"grand",syllables:4},
  {title:"Jade",reg:"grand",syllables:1},
  {title:"Lotus",reg:"grand",syllables:2},
  {title:"Goddess",reg:"grand",syllables:2},
  
  {title:"Incomparable",reg:"grand",syllables:5},
  {title:"Queen",reg:"grand",syllables:1},
  {title:"Geisha",reg:"grand",syllables:2},
  {title:"Madame",reg:"grand",syllables:2}
],
  character:  [{title:"Incomparable",reg:"grand",syllables:5},{title:"Baroness",reg:"grand",syllables:3},{title:"Countess",reg:"grand",syllables:2},{title:"Queen",reg:"grand",syllables:1},{title:"Goddess",reg:"grand",syllables:2},{title:"Valkyrie",reg:"grand",syllables:3},{title:"Enchantress",reg:"grand",syllables:3},{title:"Sorceress",reg:"grand",syllables:3},{title:"Huntress",reg:"grand",syllables:2},{title:"Amazon",reg:"grand",syllables:3},{title:"Oracle",reg:"grand",syllables:3},{title:"Moon Queen",reg:"grand",syllables:3},{title:"Ice Queen",reg:"grand",syllables:3},{title:"Storm Queen",reg:"grand",syllables:3},{title:"Shadow Queen",reg:"grand",syllables:3},{title:"Fire Queen",reg:"grand",syllables:3}],
  dachshund:  [{title:"Countess",reg:"grand",syllables:2},{title:"Miss",reg:"mundane",syllables:1},{title:"Little",reg:"informal",syllables:2},{title:"Empress",reg:"grand",syllables:3},{title:"Baroness",reg:"grand",syllables:3},{title:"Duchess",reg:"grand",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Viscountess",reg:"grand",syllables:3},{title:"Princess",reg:"grand",syllables:3},{title:"Madame",reg:"grand",syllables:2},{title:"Shorty",reg:"informal",syllables:2},{title:"Lil'",reg:"informal",syllables:1},{title:"Big",reg:"informal",syllables:1},{title:"Little Miss",reg:"informal",syllables:3}],
  gentry:     [{title:"Viscountess",reg:"grand",syllables:3},{title:"Baroness",reg:"grand",syllables:3},{title:"Most Honourable",reg:"grand",syllables:4},{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Marchioness",reg:"grand",syllables:3},{title:"Queen",reg:"grand",syllables:1},{title:"Grand Duchess",reg:"grand",syllables:3},{title:"Regina",reg:"grand",syllables:3},{title:"Noble Lady",reg:"grand",syllables:3},{title:"Grande Dame",reg:"grand",syllables:3}],
  corgi:      [{title:"Princess",reg:"grand",syllables:3},{title:"Lady",reg:"grand",syllables:2},{title:"Duchess",reg:"grand",syllables:2},{title:"Countess",reg:"grand",syllables:2},{title:"Bardess",reg:"grand",syllables:2},{title:"Miss",reg:"mundane",syllables:1},{title:"Dame",reg:"grand",syllables:1},{title:"Queen",reg:"grand",syllables:1},{title:"Matriarch",reg:"grand",syllables:3}],
  westie:    [{title:"Wee",reg:"informal",syllables:1},{title:"Auld",reg:"informal",syllables:1},{title:"Big",reg:"informal",syllables:1},{title:"Bonnie",reg:"mundane",syllables:2},{title:"Lassie",reg:"mundane",syllables:2},{title:"Chieftain",reg:"grand",syllables:2},{title:"Provost",reg:"grand",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:2},{title:"Ol'",reg:"informal",syllables:1}],
  doodle:    [{title:"Fluffy",reg:"informal",syllables:2},{title:"Cheeky",reg:"informal",syllables:2},{title:"Bouncy",reg:"informal",syllables:2},{title:"Little",reg:"informal",syllables:2},{title:"Lil'",reg:"informal",syllables:1},{title:"Wee",reg:"informal",syllables:1},{title:"Princess",reg:"grand",syllables:2},{title:"Baby",reg:"informal",syllables:2},{title:"Snuggle",reg:"informal",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Miss",reg:"mundane",syllables:1}],
  setter:    [{title:"Herself",reg:"grand",syllables:2},{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:2},{title:"Wild",reg:"informal",syllables:1},{title:"Bold",reg:"informal",syllables:1},{title:"Grand",reg:"grand",syllables:1},{title:"Squire",reg:"grand",syllables:2},{title:"Chieftain",reg:"grand",syllables:2},{title:"Miss",reg:"mundane",syllables:1}],
  sheepdog:  [{title:"Lady",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:2},{title:"Farmer",reg:"mundane",syllables:2},{title:"Shepherd",reg:"mundane",syllables:2},{title:"Squire",reg:"grand",syllables:2},{title:"Reverend",reg:"grand",syllables:3},{title:"Old",reg:"informal",syllables:1},{title:"Miss",reg:"mundane",syllables:1},{title:"Mrs",reg:"mundane",syllables:1},{title:"Duchess",reg:"grand",syllables:2}],
  default:    [{title:"Lady",reg:"grand",syllables:2},{title:"Baroness",reg:"grand",syllables:3},{title:"Countess",reg:"grand",syllables:2},{title:"Dame",reg:"grand",syllables:1},{title:"Viscountess",reg:"grand",syllables:3},{title:"Queen",reg:"grand",syllables:1},{title:"Princess",reg:"grand",syllables:3},{title:"Matriarch",reg:"grand",syllables:3},{title:"Tsarina",reg:"grand",syllables:3},{title:"Regina",reg:"grand",syllables:3}]
};

// ── NAME BANKS (abbreviated for space -- key groups) ───────────────────────────
const NAMES: Record<string, { boy: NameEntry[]; girl: NameEntry[] }> = {
  lapdog: {
    boy: [{name:"Marvellous",reg:"absurd",syllables:3},{name:"Glorious",reg:"absurd",syllables:3},{name:"Opulent",reg:"grand",syllables:3},{name:"Majestic",reg:"grand",syllables:3},{name:"Fortunatus",reg:"grand",syllables:4},{name:"Casimir",reg:"grand",syllables:3},{name:"Florentine",reg:"grand",syllables:3},{name:"Celestin",reg:"grand",syllables:3},{name:"Alexander",reg:"grand",syllables:4},{name:"Vincent",reg:"grand",syllables:2},{name:"Henry",reg:"grand",syllables:2},{name:"Sebastian",reg:"grand",syllables:4},{name:"Theodore",reg:"grand",syllables:3},{name:"Edward",reg:"grand",syllables:2},{name:"Charles",reg:"grand",syllables:1},{name:"Gabriel",reg:"grand",syllables:3},{name:"Oliver",reg:"mundane",syllables:3},{name:"William",reg:"mundane",syllables:2},{name:"Frederick",reg:"grand",syllables:3},{name:"Maximillian",reg:"grand",syllables:5},{name:"Samuel",reg:"mundane",syllables:3},{name:"Neal",reg:"mundane",syllables:1},{name:"Boffin",reg:"baby",syllables:2},{name:"Grommet",reg:"baby",syllables:2},{name:"Widget",reg:"baby",syllables:2},{name:"Wotsit",reg:"baby",syllables:2},{name:"Thingy",reg:"baby",syllables:2},{name:"Gubbins",reg:"baby",syllables:2},{name:"Puckle",reg:"baby",syllables:2},{name:"Muddle",reg:"baby",syllables:2},{name:"Sprocket",reg:"baby",syllables:2},{name:"Binky",reg:"baby",syllables:2},{name:"Booper",reg:"baby",syllables:2},{name:"Button",reg:"baby",syllables:2},{name:"Pip",reg:"baby",syllables:2},{name:"Titch",reg:"baby",syllables:2},{name:"Squirt",reg:"baby",syllables:2},{name:"Tuppence",reg:"baby",syllables:2},{name:"Munchkin",reg:"baby",syllables:2},{name:"Roly",reg:"baby",syllables:2},{name:"Gizmo",reg:"baby",syllables:2},{name:"Doodle",reg:"baby",syllables:2},{name:"Goober",reg:"baby",syllables:2},{name:"Nugget",reg:"baby",syllables:2},{name:"Peanut",reg:"baby",syllables:2},{name:"Chumley",reg:"absurd",syllables:2},{name:"Peabody",reg:"absurd",syllables:2},{name:"Sherman",reg:"absurd",syllables:2},{name:"Wimpy",reg:"absurd",syllables:2},{name:"Huckleberry",reg:"absurd",syllables:2},{name:"Benny",reg:"absurd",syllables:2},{name:"Foghorn",reg:"absurd",syllables:2},{name:"Philibert",reg:"grand",syllables:2},{name:"Eustache",reg:"grand",syllables:2},{name:"Céléstin",reg:"grand",syllables:2},{name:"Aimé",reg:"grand",syllables:2},{name:"Alain",reg:"grand",syllables:2},{name:"Jasper",reg:"grand",syllables:2},{name:"Jerome",reg:"grand",syllables:2},{name:"Julian",reg:"grand",syllables:3},{name:"Jupiter",reg:"grand",syllables:3},{name:"Joachim",reg:"grand",syllables:3},{name:"Whiskers",reg:"baby",syllables:2},{name:"Brioche",reg:"food",syllables:1},{name:"Donut",reg:"food",syllables:2},{name:"Sundae",reg:"food",syllables:1},{name:"Cheesecake",reg:"food",syllables:3},{name:"Pancake",reg:"food",syllables:2},{name:"Peach",reg:"food",syllables:1},{name:"Blueberry",reg:"food",syllables:3},{name:"Raspberry",reg:"food",syllables:3},{name:"Strawberry",reg:"food",syllables:3},{name:"Lemon",reg:"food",syllables:2},{name:"Apple",reg:"food",syllables:2},{name:"Pancakes",reg:"food",syllables:3},{name:"Cupcakes",reg:"food",syllables:3},{name:"Brownies",reg:"food",syllables:2},{name:"Lemons",reg:"food",syllables:2},{name:"Apples",reg:"food",syllables:2},{name:"Nuggets",reg:"food",syllables:2},{name:"Sardines",reg:"food",syllables:3},{name:"Dollymix",reg:"food",syllables:3},{name:"Malteser",reg:"food",syllables:3},{name:"Milkybar",reg:"food",syllables:3},{name:"Praline",reg:"food",syllables:2},{name:"Pastille",reg:"food",syllables:3},{name:"Fruitella",reg:"food",syllables:3},{name:"Loveheart",reg:"food",syllables:3},{name:"Foamie",reg:"food",syllables:1},{name:"Jellytot",reg:"food",syllables:3},{name:"Fruitgum",reg:"food",syllables:2},{name:"Sweetpea",reg:"food",syllables:2},{name:"Sugarplum",reg:"food",syllables:3},{name:"Sugarpuff",reg:"food",syllables:3},{name:"Sugarcube",reg:"food",syllables:3},{name:"Picnmix",reg:"food",syllables:2},{name:"FruitSalad",reg:"food",syllables:3},{name:"Marzipan",reg:"food",syllables:3},{name:"Icing",reg:"food",syllables:2},{name:"Refreshers",reg:"food",syllables:3}],
    girl: [{name:"Fabulous",reg:"absurd",syllables:3},{name:"Darling",reg:"baby",syllables:2},{name:"Precious",reg:"baby",syllables:2},{name:"Divine",reg:"grand",syllables:2},{name:"Dazzling",reg:"absurd",syllables:2},{name:"Ruby",reg:"grand",syllables:2},{name:"Diamond",reg:"grand",syllables:2},{name:"Pearl",reg:"grand",syllables:1},{name:"Sapphire",reg:"grand",syllables:2},{name:"Crystal",reg:"grand",syllables:2},{name:"Chanel",reg:"grand",syllables:2},{name:"Celestine",reg:"grand",syllables:3},{name:"Aurora",reg:"grand",syllables:3},{name:"Daphne",reg:"grand",syllables:2},{name:"Diana",reg:"grand",syllables:3},{name:"Flora",reg:"nature",syllables:2},{name:"Freya",reg:"grand",syllables:2},{name:"Iris",reg:"nature",syllables:2},{name:"Luna",reg:"grand",syllables:2},{name:"Maeve",reg:"grand",syllables:1},{name:"Ophelia",reg:"grand",syllables:4},{name:"Pandora",reg:"grand",syllables:3},{name:"Venus",reg:"grand",syllables:2},{name:"Violette",reg:"grand",syllables:3},{name:"Juliet",reg:"grand",syllables:3},{name:"Isabella",reg:"grand",syllables:4},{name:"Charlotte",reg:"grand",syllables:2},{name:"Olivia",reg:"mundane",syllables:4},{name:"Victoria",reg:"grand",syllables:4},{name:"Elizabeth",reg:"grand",syllables:4},{name:"Booboo",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Coco",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Cuddlekins",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},{name:"Fluffybum",reg:"baby",syllables:3},{name:"Puddingkins",reg:"baby",syllables:3},{name:"Sprinkles",reg:"food",syllables:2},{name:"Marshmallow",reg:"food",syllables:2},{name:"Meringue",reg:"food",syllables:2},{name:"Smartie",reg:"food",syllables:2},{name:"Gumball",reg:"food",syllables:2},{name:"Taffy",reg:"food",syllables:2},{name:"Cheerio",reg:"food",syllables:2},{name:"Peaches",reg:"food",syllables:2},{name:"Cherry",reg:"food",syllables:2},{name:"Berry",reg:"food",syllables:2},{name:"Plum",reg:"food",syllables:2},{name:"Figgy",reg:"food",syllables:2},{name:"Apricot",reg:"food",syllables:2},{name:"Lime",reg:"food",syllables:2},{name:"Kiwi",reg:"food",syllables:2},{name:"Mango",reg:"food",syllables:2},{name:"Melon",reg:"food",syllables:2},{name:"Pumpkin",reg:"food",syllables:2},{name:"Shortcake",reg:"food",syllables:2},{name:"Doughnut",reg:"food",syllables:2},{name:"Latte",reg:"food",syllables:2},{name:"Crunchie",reg:"food",syllables:2},{name:"Twixie",reg:"food",syllables:2},{name:"Rolo",reg:"food",syllables:2},{name:"Oreo",reg:"food",syllables:2},{name:"Jammy",reg:"food",syllables:2},{name:"Marmalade",reg:"food",syllables:2},{name:"Jasmine",reg:"nature",syllables:2},{name:"Josephine",reg:"grand",syllables:4},{name:"Juliana",reg:"grand",syllables:4},{name:"Jemima",reg:"grand",syllables:3},{name:"Jacqueline",reg:"grand",syllables:3},{name:"Jessamine",reg:"nature",syllables:3},{name:"Juniper",reg:"nature",syllables:3},{name:"Jewel",reg:"grand",syllables:1},{name:"Whiskers",reg:"baby",syllables:2},{name:"Kitty",reg:"baby",syllables:2},{name:"Brioche",reg:"food",syllables:1},{name:"Donut",reg:"food",syllables:2},{name:"Sundae",reg:"food",syllables:1},{name:"Cheesecake",reg:"food",syllables:3},{name:"Pancake",reg:"food",syllables:2},{name:"Peach",reg:"food",syllables:1},{name:"Blueberry",reg:"food",syllables:3},{name:"Raspberry",reg:"food",syllables:3},{name:"Strawberry",reg:"food",syllables:3},{name:"Lemon",reg:"food",syllables:2},{name:"Apple",reg:"food",syllables:2},{name:"Pancakes",reg:"food",syllables:3},{name:"Cupcakes",reg:"food",syllables:3},{name:"Brownies",reg:"food",syllables:2},{name:"Lemons",reg:"food",syllables:2},{name:"Apples",reg:"food",syllables:2},{name:"Nuggets",reg:"food",syllables:2},{name:"Sardines",reg:"food",syllables:3},{name:"Dollymix",reg:"food",syllables:3},{name:"Malteser",reg:"food",syllables:3},{name:"Milkybar",reg:"food",syllables:3},{name:"Praline",reg:"food",syllables:2},{name:"Pastille",reg:"food",syllables:3},{name:"Fruitella",reg:"food",syllables:3},{name:"Loveheart",reg:"food",syllables:3},{name:"Foamie",reg:"food",syllables:1},{name:"Jellytot",reg:"food",syllables:3},{name:"Fruitgum",reg:"food",syllables:2},{name:"Sweetpea",reg:"food",syllables:2},{name:"Sugarplum",reg:"food",syllables:3},{name:"Sugarpuff",reg:"food",syllables:3},{name:"Sugarcube",reg:"food",syllables:3},{name:"Picnmix",reg:"food",syllables:2},{name:"FruitSalad",reg:"food",syllables:3},{name:"Marzipan",reg:"food",syllables:3},{name:"Icing",reg:"food",syllables:2},{name:"Refreshers",reg:"food",syllables:3}]
},
  boxer: {
    boy: [{name:"Doofus",reg:"chaos",syllables:2},{name:"Lummox",reg:"chaos",syllables:2},{name:"Bonkers",reg:"chaos",syllables:2},{name:"Dingbat",reg:"chaos",syllables:2},{name:"Rumpus",reg:"chaos",syllables:2},{name:"Kerfuffle",reg:"chaos",syllables:3},{name:"Hullabaloo",reg:"chaos",syllables:4},{name:"Nincompoop",reg:"chaos",syllables:3},{name:"Goofball",reg:"chaos",syllables:2},{name:"Chuckles",reg:"chaos",syllables:2},{name:"Bozo",reg:"chaos",syllables:2},{name:"Joker",reg:"chaos",syllables:2},{name:"Zebedee",reg:"absurd",syllables:3},{name:"Chaos",reg:"chaos",syllables:2},{name:"Havoc",reg:"chaos",syllables:2},{name:"Ruckus",reg:"chaos",syllables:2},{name:"Bumbles",reg:"chaos",syllables:2},{name:"Bumper",reg:"chaos",syllables:2},{name:"Bumpkin",reg:"chaos",syllables:2},{name:"Stomper",reg:"chaos",syllables:2},{name:"Clomper",reg:"chaos",syllables:2},{name:"Trooper",reg:"chaos",syllables:2},{name:"Rowdy",reg:"chaos",syllables:2},{name:"Bruiser",reg:"chaos",syllables:2},{name:"Bandit",reg:"chaos",syllables:2},{name:"Dodger",reg:"chaos",syllables:2},{name:"Bonzo",reg:"chaos",syllables:2},{name:"Buster",reg:"chaos",syllables:2},{name:"Bruno",reg:"chaos",syllables:2},{name:"Butch",reg:"chaos",syllables:2},{name:"Spike",reg:"chaos",syllables:2},{name:"Bowser",reg:"chaos",syllables:2},{name:"Lobster",reg:"chaos",syllables:2},{name:"Chunk",reg:"chaos",syllables:2},{name:"Tubby",reg:"chaos",syllables:2},{name:"Pudgy",reg:"chaos",syllables:2},{name:"Wagger",reg:"chaos",syllables:2},{name:"Wags",reg:"chaos",syllables:2},{name:"Wiggles",reg:"chaos",syllables:2},{name:"Rex",reg:"mundane",syllables:1},{name:"Max",reg:"mundane",syllables:1},{name:"Tyson",reg:"mundane",syllables:2},{name:"Rocky",reg:"mundane",syllables:2},{name:"Duke",reg:"grand",syllables:1},{name:"Samson",reg:"mundane",syllables:2},{name:"Thor",reg:"grand",syllables:1},{name:"Titan",reg:"grand",syllables:2},{name:"Goliath",reg:"grand",syllables:3},{name:"Blaze",reg:"chaos",syllables:1},{name:"Flash",reg:"chaos",syllables:1},{name:"Rocket",reg:"chaos",syllables:2},{name:"Tank",reg:"chaos",syllables:1},{name:"Diesel",reg:"chaos",syllables:2},{name:"Crusher",reg:"chaos",syllables:2},{name:"Hammer",reg:"chaos",syllables:2},{name:"Maverick",reg:"chaos",syllables:3},{name:"Gunner",reg:"chaos",syllables:2},{name:"Jax",reg:"mundane",syllables:1},{name:"Kodak",reg:"chaos",syllables:2}],
    girl: [{name:"Dizzy",reg:"chaos",syllables:2},{name:"Topsy",reg:"chaos",syllables:2},{name:"Starshadow",reg:"grand",syllables:2},{name:"Astra",reg:"grand",syllables:2},{name:"Bonkers",reg:"chaos",syllables:2},{name:"Wibble",reg:"chaos",syllables:2},{name:"Doolally",reg:"chaos",syllables:3},{name:"Ramshackle",reg:"chaos",syllables:3},{name:"Twinkles",reg:"baby",syllables:2},{name:"Cornflake",reg:"food",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Tutu",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Cuddlekins",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},{name:"Babbycakes",reg:"baby",syllables:3},{name:"Tiddlywink",reg:"baby",syllables:3},{name:"Fluffybum",reg:"baby",syllables:3},{name:"Jellybean",reg:"food",syllables:3},{name:"Candyfloss",reg:"food",syllables:3},{name:"Cupcake",reg:"food",syllables:2},{name:"Athena",reg:"grand",syllables:3},{name:"Beatrix",reg:"grand",syllables:2},{name:"Bella",reg:"grand",syllables:2},{name:"Blaze",reg:"grand",syllables:2},{name:"Cleo",reg:"grand",syllables:1},{name:"Electra",reg:"grand",syllables:3},{name:"Empress",reg:"grand",syllables:2},{name:"Gloria",reg:"grand",syllables:2},{name:"Havoc",reg:"grand",syllables:2},{name:"Imogen",reg:"grand",syllables:3},{name:"Jade",reg:"grand",syllables:2},{name:"Jasmine",reg:"grand",syllables:3},{name:"Justice",reg:"grand",syllables:3},{name:"Kali",reg:"grand",syllables:2},{name:"Leona",reg:"grand",syllables:2},{name:"Liberty",reg:"grand",syllables:2},{name:"Maeve",reg:"grand",syllables:2},{name:"Maxine",reg:"grand",syllables:3},{name:"Nova",reg:"nature",syllables:2},{name:"Olympia",reg:"grand",syllables:2},{name:"Phoebe",reg:"grand",syllables:2},{name:"Rosa",reg:"grand",syllables:2},{name:"Roxanne",reg:"grand",syllables:3},{name:"Ruby",reg:"nature",syllables:1},{name:"Sadie",reg:"grand",syllables:2},{name:"Scarlett",reg:"grand",syllables:2},{name:"Sienna",reg:"grand",syllables:2},{name:"Stella",reg:"nature",syllables:2},{name:"Tara",reg:"grand",syllables:2}]
},

  afghan: {
    boy: [{name:"Pierre",reg:"grand",syllables:1},{name:"Louis",reg:"grand",syllables:2},{name:"Léon",reg:"grand",syllables:1},{name:"Léopold",reg:"grand",syllables:2},{name:"Valentin",reg:"grand",syllables:3},{name:"César",reg:"grand",syllables:2},{name:"Alexander",reg:"grand",syllables:4},{name:"Sebastian",reg:"grand",syllables:3},{name:"Theodore",reg:"grand",syllables:3},{name:"Frederick",reg:"grand",syllables:3},{name:"Gabriel",reg:"grand",syllables:3},{name:"Casimir",reg:"grand",syllables:3},{name:"Jasper",reg:"grand",syllables:2},{name:"Julian",reg:"grand",syllables:3},{name:"Vincent",reg:"grand",syllables:2},{name:"Augustus",reg:"grand",syllables:3},{name:"Ferdinand",reg:"grand",syllables:3},{name:"Montgomery",reg:"grand",syllables:4},{name:"Reginald",reg:"grand",syllables:3},{name:"Rupert",reg:"grand",syllables:2},{name:"Tobias",reg:"grand",syllables:3},{name:"Ulysses",reg:"grand",syllables:3},{name:"Xavier",reg:"grand",syllables:2},{name:"Cormac",reg:"grand",syllables:2},{name:"Lorenzo",reg:"grand",syllables:3},{name:"Magnus",reg:"grand",syllables:2},{name:"Ignatius",reg:"grand",syllables:3},{name:"Miles",reg:"grand",syllables:1},{name:"Lawrence",reg:"grand",syllables:2},{name:"Quentin",reg:"grand",syllables:2},{name:"Edgar",reg:"grand",syllables:2}],
    girl: [{name:"Nonchalance",reg:"grand",syllables:3},{name:"Arabella",reg:"grand",syllables:4},{name:"Cordelia",reg:"grand",syllables:3},{name:"Clementine",reg:"grand",syllables:3},{name:"Georgiana",reg:"grand",syllables:4},{name:"Frederica",reg:"grand",syllables:4},{name:"Lavinia",reg:"grand",syllables:3},{name:"Henrietta",reg:"grand",syllables:4},{name:"Beatrice",reg:"grand",syllables:3},{name:"Constance",reg:"grand",syllables:2},{name:"Eleanor",reg:"grand",syllables:3},{name:"Rosalind",reg:"grand",syllables:3},{name:"Evangeline",reg:"grand",syllables:4},{name:"Guinevere",reg:"grand",syllables:3},{name:"Chanel",reg:"grand",syllables:2},{name:"Ophelia",reg:"grand",syllables:3},{name:"Pandora",reg:"grand",syllables:3},{name:"Violette",reg:"grand",syllables:3},{name:"Isabella",reg:"grand",syllables:4},{name:"Aurora",reg:"grand",syllables:3},{name:"Celestine",reg:"grand",syllables:3},{name:"Athena",reg:"grand",syllables:3},{name:"Olympia",reg:"grand",syllables:4},{name:"Scarlett",reg:"grand",syllables:2},{name:"Sienna",reg:"grand",syllables:3},{name:"Simone",reg:"grand",syllables:2},{name:"Brigitte",reg:"grand",syllables:2},{name:"Giselle",reg:"grand",syllables:2},{name:"Yvette",reg:"grand",syllables:2}]
},
  sighthound: {
    boy: [{name:"Nonchalance",reg:"aloof",syllables:3},{name:"Indifference",reg:"aloof",syllables:4},{name:"Lassitude",reg:"aloof",syllables:3},{name:"Apathy",reg:"aloof",syllables:3},{name:"Miles",reg:"mundane",syllables:1},{name:"Julian",reg:"grand",syllables:3},{name:"Lawrence",reg:"grand",syllables:2},{name:"Richard",reg:"grand",syllables:2},{name:"Quentin",reg:"grand",syllables:2},{name:"Sebastian",reg:"grand",syllables:4},{name:"Vincent",reg:"grand",syllables:2},{name:"Leopold",reg:"grand",syllables:3},{name:"Edgar",reg:"grand",syllables:2},{name:"Dash",reg:"mundane",syllables:2},{name:"Drifter",reg:"mundane",syllables:2},{name:"Dancer",reg:"mundane",syllables:2},{name:"Dart",reg:"mundane",syllables:2},{name:"Duke",reg:"mundane",syllables:2},{name:"Flash",reg:"mundane",syllables:2},{name:"Fleet",reg:"mundane",syllables:2},{name:"Flint",reg:"mundane",syllables:2},{name:"Falcon",reg:"mundane",syllables:2},{name:"Fury",reg:"mundane",syllables:2},{name:"Altair",reg:"grand",syllables:2},{name:"Antimatter",reg:"grand",syllables:4},{name:"Apollo",reg:"grand",syllables:3},{name:"Asteroid",reg:"grand",syllables:3},{name:"Astro",reg:"grand",syllables:2},{name:"Atlas",reg:"grand",syllables:2},{name:"Blackstar",reg:"grand",syllables:2},{name:"Cosmic",reg:"grand",syllables:2},{name:"Cosmo",reg:"grand",syllables:2},{name:"Cosmos",reg:"grand",syllables:2},{name:"Darkside",reg:"grand",syllables:2},{name:"Darkstar",reg:"grand",syllables:2},{name:"Deepspace",reg:"grand",syllables:2},{name:"Draco",reg:"grand",syllables:2},{name:"Galileo",reg:"grand",syllables:4},{name:"Ganymede",reg:"grand",syllables:3},{name:"Hubble",reg:"grand",syllables:2},{name:"Jupiter",reg:"grand",syllables:3},{name:"Kepler",reg:"grand",syllables:2},{name:"Magnetar",reg:"grand",syllables:3},{name:"Mercury",reg:"grand",syllables:3},{name:"Meteor",reg:"grand",syllables:3},{name:"Neptune",reg:"grand",syllables:2},{name:"Orbit",reg:"grand",syllables:2},{name:"Orion",reg:"grand",syllables:3},{name:"Pluto",reg:"grand",syllables:2},{name:"Pulsar",reg:"grand",syllables:2},{name:"Quasar",reg:"grand",syllables:2},{name:"Saturn",reg:"grand",syllables:2},{name:"Sirius",reg:"grand",syllables:3},{name:"Starburst",reg:"grand",syllables:2},{name:"Starwalker",reg:"grand",syllables:3},{name:"Sunspot",reg:"grand",syllables:2},{name:"Titan",reg:"grand",syllables:2},{name:"Vulcan",reg:"grand",syllables:2},{name:"Bloodmoon",reg:"grand",syllables:2},{name:"Moonrock",reg:"grand",syllables:2},{name:"Moonwalker",reg:"grand",syllables:3},{name:"Astral",reg:"grand",syllables:2},{name:"Comet",reg:"grand",syllables:2},{name:"Eclipse",reg:"grand",syllables:2},{name:"Equinox",reg:"grand",syllables:3},{name:"Galaxy",reg:"grand",syllables:3},{name:"Skyfall",reg:"grand",syllables:2},{name:"Skyfire",reg:"grand",syllables:2},{name:"Solaris",reg:"grand",syllables:3},{name:"Solstice",reg:"grand",syllables:2},{name:"Starfall",reg:"grand",syllables:2},{name:"Starshadow",reg:"grand",syllables:2},{name:"Starstone",reg:"grand",syllables:2},{name:"Sunflare",reg:"grand",syllables:2},{name:"Supernova",reg:"grand",syllables:4},{name:"Whirlwind",reg:"grand",syllables:2},{name:"Bluemoon",reg:"grand",syllables:2},{name:"Midnight",reg:"grand",syllables:2},{name:"Moonfall",reg:"grand",syllables:2},{name:"Moonshadow",reg:"grand",syllables:3}],
    girl: [{name:"Ennui",reg:"aloof",syllables:2},{name:"Nonchalance",reg:"aloof",syllables:3},{name:"Austère",reg:"aloof",syllables:2},{name:"Samantha",reg:"mundane",syllables:3},{name:"Bethany",reg:"mundane",syllables:3},{name:"Amanda",reg:"mundane",syllables:3},{name:"Megan",reg:"mundane",syllables:2},{name:"Hannah",reg:"mundane",syllables:2},{name:"Melissa",reg:"mundane",syllables:3},{name:"Nicole",reg:"mundane",syllables:2},{name:"Rachel",reg:"mundane",syllables:2},{name:"Betty",reg:"mundane",syllables:2},{name:"Amy",reg:"mundane",syllables:2},{name:"Emily",reg:"mundane",syllables:3},{name:"Jennifer",reg:"mundane",syllables:3},{name:"Sarah",reg:"mundane",syllables:2},{name:"Lucy",reg:"mundane",syllables:2},{name:"Bailey",reg:"mundane",syllables:2},{name:"Heather",reg:"nature",syllables:2},{name:"Jasmine",reg:"nature",syllables:2},{name:"Duchess",reg:"aloof",syllables:2},{name:"Drifter",reg:"aloof",syllables:2},{name:"Dancer",reg:"aloof",syllables:2},{name:"Fleur",reg:"aloof",syllables:2},{name:"Flair",reg:"aloof",syllables:2},{name:"Frost",reg:"aloof",syllables:2},{name:"Fauna",reg:"aloof",syllables:2},{name:"Flutter",reg:"aloof",syllables:2},{name:"Andromeda",reg:"grand",syllables:4},{name:"Artemis",reg:"grand",syllables:3},{name:"Artemisia",reg:"grand",syllables:5},{name:"Astra",reg:"grand",syllables:2},{name:"Astrid",reg:"grand",syllables:2},{name:"Aurora",reg:"grand",syllables:4},{name:"Dawnstar",reg:"grand",syllables:2},{name:"Elara",reg:"grand",syllables:3},{name:"Luna",reg:"grand",syllables:2},{name:"Lunaris",reg:"grand",syllables:3},{name:"Nebula",reg:"grand",syllables:3},{name:"Nightfall",reg:"grand",syllables:2},{name:"Nightglow",reg:"grand",syllables:2},{name:"Nightshade",reg:"grand",syllables:2},{name:"Nova",reg:"grand",syllables:2},{name:"Penumbra",reg:"grand",syllables:3},{name:"Selene",reg:"grand",syllables:3},{name:"Shadowmoon",reg:"grand",syllables:3},{name:"Silvermoon",reg:"grand",syllables:3},{name:"Starbeam",reg:"grand",syllables:2},{name:"Stardust",reg:"grand",syllables:2},{name:"Starlight",reg:"grand",syllables:2},{name:"Stella",reg:"grand",syllables:2},{name:"Twilight",reg:"grand",syllables:2},{name:"Umbra",reg:"grand",syllables:2},{name:"Vega",reg:"grand",syllables:2},{name:"Vela",reg:"grand",syllables:2},{name:"Goldenmoon",reg:"grand",syllables:3},{name:"Moonbeam",reg:"grand",syllables:2},{name:"Moondust",reg:"grand",syllables:2},{name:"Moonglow",reg:"grand",syllables:2},{name:"Moonlight",reg:"grand",syllables:2},{name:"Astral",reg:"grand",syllables:2},{name:"Comet",reg:"grand",syllables:2},{name:"Eclipse",reg:"grand",syllables:2},{name:"Equinox",reg:"grand",syllables:3},{name:"Galaxy",reg:"grand",syllables:3},{name:"Skyfall",reg:"grand",syllables:2},{name:"Skyfire",reg:"grand",syllables:2},{name:"Solaris",reg:"grand",syllables:3},{name:"Solstice",reg:"grand",syllables:2},{name:"Starfall",reg:"grand",syllables:2},{name:"Starshadow",reg:"grand",syllables:2},{name:"Starstone",reg:"grand",syllables:2},{name:"Sunflare",reg:"grand",syllables:2},{name:"Supernova",reg:"grand",syllables:4},{name:"Whirlwind",reg:"grand",syllables:2},{name:"Bluemoon",reg:"grand",syllables:2},{name:"Midnight",reg:"grand",syllables:2},{name:"Moonfall",reg:"grand",syllables:2},{name:"Moonshadow",reg:"grand",syllables:3}]
},
  sniffer: {
    boy: [{name:"Plodsworth",reg:"absurd",syllables:2},{name:"Glumley",reg:"absurd",syllables:2},{name:"Mourny",reg:"absurd",syllables:2},{name:"Woebegone",reg:"absurd",syllables:3},{name:"Lachrymose",reg:"absurd",syllables:3},{name:"Melancholy",reg:"absurd",syllables:4},{name:"Lugubrious",reg:"absurd",syllables:4},{name:"Gloopington",reg:"absurd",syllables:3},{name:"John",reg:"mundane",syllables:1},{name:"Brian",reg:"mundane",syllables:2},{name:"Raymond",reg:"mundane",syllables:2},{name:"George",reg:"mundane",syllables:1},{name:"Arthur",reg:"mundane",syllables:2},{name:"David",reg:"mundane",syllables:2},{name:"Keith",reg:"mundane",syllables:1},{name:"Derek",reg:"mundane",syllables:2},{name:"Kevin",reg:"mundane",syllables:2},{name:"Trevor",reg:"mundane",syllables:2},{name:"Barry",reg:"mundane",syllables:2},{name:"Norman",reg:"mundane",syllables:2},{name:"Basil",reg:"mundane",syllables:2},{name:"Mugsy",reg:"mundane",syllables:2},{name:"Peabody",reg:"mundane",syllables:2},{name:"Sherman",reg:"mundane",syllables:2},{name:"Scrappy",reg:"mundane",syllables:2},{name:"Spook",reg:"mundane",syllables:2},{name:"Brain",reg:"mundane",syllables:2},{name:"Hunter",reg:"mundane",syllables:2},{name:"Hector",reg:"mundane",syllables:2},{name:"Hugo",reg:"mundane",syllables:2},{name:"Harold",reg:"mundane",syllables:2},{name:"Herbert",reg:"mundane",syllables:2},{name:"Hound",reg:"mundane",syllables:2},{name:"Quest",reg:"mundane",syllables:2},{name:"Quincy",reg:"mundane",syllables:2},{name:"Quentin",reg:"mundane",syllables:2},{name:"Shadow",reg:"mundane",syllables:2},{name:"Sherlock",reg:"mundane",syllables:2},{name:"Sleuth",reg:"mundane",syllables:2},{name:"Scout",reg:"mundane",syllables:2},{name:"Snooper",reg:"mundane",syllables:2},{name:"Snout",reg:"mundane",syllables:2},{name:"Snuffle",reg:"mundane",syllables:2},{name:"Sage",reg:"mundane",syllables:2},{name:"Samson",reg:"mundane",syllables:2},{name:"Turnip",reg:"mundane",syllables:2},{name:"Parsnip",reg:"mundane",syllables:2},{name:"Radish",reg:"mundane",syllables:2},{name:"Cabbage",reg:"mundane",syllables:2},{name:"Lentil",reg:"mundane",syllables:2},{name:"Porridge",reg:"mundane",syllables:2},{name:"Granola",reg:"mundane",syllables:2},{name:"Crumpet",reg:"mundane",syllables:2},{name:"Cobbler",reg:"mundane",syllables:2},{name:"Crumpets",reg:"food",syllables:2}],
    girl: [{name:"Woesworth",reg:"absurd",syllables:2},{name:"Lamentia",reg:"absurd",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:2},{name:"Lollypop",reg:"food",syllables:2},{name:"Gobstopper",reg:"food",syllables:2},{name:"Toffee",reg:"food",syllables:2},{name:"Sherbet",reg:"food",syllables:2},{name:"Humbug",reg:"food",syllables:2},{name:"Agatha",reg:"grand",syllables:2},{name:"Marple",reg:"grand",syllables:2},{name:"Christie",reg:"grand",syllables:2},{name:"Vera",reg:"grand",syllables:2},{name:"Tennison",reg:"grand",syllables:2},{name:"Foyle",reg:"grand",syllables:2},{name:"Cordelia",reg:"grand",syllables:2},{name:"Harriet",reg:"grand",syllables:2},{name:"Endeavour",reg:"grand",syllables:2},{name:"Gamache",reg:"grand",syllables:2},{name:"Cadfael",reg:"grand",syllables:2},{name:"Alleyn",reg:"grand",syllables:2},{name:"Billie",reg:"mundane",syllables:2},{name:"Bessie",reg:"mundane",syllables:2},{name:"Etta",reg:"mundane",syllables:2},{name:"Ella",reg:"mundane",syllables:2},{name:"Nina",reg:"mundane",syllables:2},{name:"Sarah",reg:"mundane",syllables:2},{name:"Dinah",reg:"mundane",syllables:2},{name:"Alberta",reg:"mundane",syllables:2},{name:"Memphis",reg:"mundane",syllables:2},{name:"Sippie",reg:"mundane",syllables:2},{name:"Gertrude",reg:"mundane",syllables:2},{name:"Theodora",reg:"grand",syllables:2},{name:"Araminta",reg:"grand",syllables:2},{name:"Lavinia",reg:"grand",syllables:2},{name:"Wilhelmina",reg:"grand",syllables:2},{name:"Clementine",reg:"grand",syllables:2},{name:"Octavia",reg:"grand",syllables:2},{name:"Millicent",reg:"grand",syllables:2},{name:"Dorothea",reg:"grand",syllables:2},{name:"Eugenia",reg:"grand",syllables:2},{name:"Henrietta",reg:"grand",syllables:2},{name:"Mathilda",reg:"grand",syllables:2},{name:"Rosalind",reg:"grand",syllables:2},{name:"Gwendolyn",reg:"grand",syllables:2},{name:"Arabella",reg:"grand",syllables:2},{name:"Beatrice",reg:"grand",syllables:2},{name:"Constance",reg:"grand",syllables:2},{name:"Prudence",reg:"mundane",syllables:2},{name:"Patience",reg:"mundane",syllables:2},{name:"Temperance",reg:"mundane",syllables:2},{name:"Tallulah",reg:"grand",syllables:2},{name:"Thomasina",reg:"grand",syllables:2},{name:"Thea",reg:"mundane",syllables:2},{name:"Tilda",reg:"mundane",syllables:2},{name:"Tabitha",reg:"mundane",syllables:2},{name:"Geraldine",reg:"mundane",syllables:2},{name:"Griselda",reg:"grand",syllables:2},{name:"Felicity",reg:"mundane",syllables:2},{name:"Florence",reg:"mundane",syllables:2},{name:"Helena",reg:"grand",syllables:2},{name:"Hortense",reg:"grand",syllables:2},{name:"Penelope",reg:"grand",syllables:2},{name:"Portia",reg:"grand",syllables:2},{name:"Beatrix",reg:"grand",syllables:2},{name:"Blanche",reg:"grand",syllables:2},{name:"Dorothy",reg:"mundane",syllables:2},{name:"Delilah",reg:"mundane",syllables:2},{name:"Winifred",reg:"mundane",syllables:2},{name:"Wanda",reg:"mundane",syllables:2},{name:"Clarissa",reg:"grand",syllables:2},{name:"Cressida",reg:"grand",syllables:2},{name:"Rosemary",reg:"mundane",syllables:2},{name:"Rowena",reg:"grand",syllables:2},{name:"Lavender",reg:"mundane",syllables:2},{name:"Leonora",reg:"grand",syllables:2},{name:"Mabel",reg:"mundane",syllables:2},{name:"Marjorie",reg:"mundane",syllables:2},{name:"Muriel",reg:"mundane",syllables:2},{name:"Margot",reg:"mundane",syllables:2},{name:"Edwina",reg:"mundane",syllables:2},{name:"Eleanor",reg:"grand",syllables:2},{name:"Sylvia",reg:"mundane",syllables:2},{name:"Simone",reg:"grand",syllables:2},{name:"Natasha",reg:"mundane",syllables:2},{name:"Nicolette",reg:"grand",syllables:2},{name:"Norma",reg:"mundane",syllables:2},{name:"Adelaide",reg:"grand",syllables:2},{name:"Allegra",reg:"grand",syllables:2},{name:"Crumpets",reg:"food",syllables:2}]
},
  greatdane: {
    boy: [{name:"Astro",reg:"grand",syllables:2},{name:"Cosmo",reg:"grand",syllables:2},{name:"Apollo",reg:"grand",syllables:2},{name:"Nova",reg:"grand",syllables:2},{name:"Eclipse",reg:"grand",syllables:2},{name:"Comet",reg:"grand",syllables:2},{name:"Meteor",reg:"grand",syllables:2},{name:"Asteroid",reg:"grand",syllables:2},{name:"Orbit",reg:"grand",syllables:2},{name:"Galaxy",reg:"grand",syllables:2},{name:"Zenith",reg:"grand",syllables:2},{name:"Pulsar",reg:"grand",syllables:2},{name:"Magnetar",reg:"grand",syllables:2},{name:"Supernova",reg:"grand",syllables:2},{name:"Starburst",reg:"grand",syllables:2},{name:"Darkstar",reg:"grand",syllables:2},{name:"Shadowmoon",reg:"grand",syllables:2},{name:"Draco",reg:"grand",syllables:2},{name:"Altimeter",reg:"grand",syllables:2},{name:"Moonfall",reg:"grand",syllables:2},{name:"Cosmos",reg:"grand",syllables:2},{name:"Galileo",reg:"grand",syllables:2},{name:"Kepler",reg:"grand",syllables:2},{name:"Hubble",reg:"grand",syllables:2},{name:"Atlas",reg:"grand",syllables:2},{name:"Prometheus",reg:"grand",syllables:2},{name:"Jupiter",reg:"grand",syllables:2},{name:"Pluto",reg:"grand",syllables:2},{name:"Mercury",reg:"grand",syllables:2},{name:"Neptune",reg:"grand",syllables:2},{name:"Darkside",reg:"grand",syllables:2},{name:"Antimatter",reg:"grand",syllables:2},{name:"Shadowmoon",reg:"grand",syllables:2},{name:"Teacup",reg:"grand",syllables:2},{name:"Dainty",reg:"grand",syllables:2},{name:"Pocket",reg:"grand",syllables:2},{name:"Dinky",reg:"grand",syllables:2},{name:"Nimble",reg:"grand",syllables:2},{name:"Smidgeon",reg:"grand",syllables:2},{name:"Titchy",reg:"grand",syllables:2},{name:"Lilliput",reg:"grand",syllables:2},{name:"Altair",reg:"grand",syllables:2},{name:"Blackstar",reg:"grand",syllables:2},{name:"Cosmic",reg:"grand",syllables:2},{name:"Deepspace",reg:"grand",syllables:2},{name:"Ganymede",reg:"grand",syllables:3},{name:"Orion",reg:"grand",syllables:3},{name:"Quasar",reg:"grand",syllables:2},{name:"Saturn",reg:"grand",syllables:2},{name:"Sirius",reg:"grand",syllables:3},{name:"Starwalker",reg:"grand",syllables:3},{name:"Sunspot",reg:"grand",syllables:2},{name:"Titan",reg:"grand",syllables:2},{name:"Vulcan",reg:"grand",syllables:2},{name:"Bloodmoon",reg:"grand",syllables:2},{name:"Moonrock",reg:"grand",syllables:2},{name:"Moonwalker",reg:"grand",syllables:3},{name:"Astral",reg:"grand",syllables:2},{name:"Equinox",reg:"grand",syllables:3},{name:"Skyfall",reg:"grand",syllables:2},{name:"Skyfire",reg:"grand",syllables:2},{name:"Solaris",reg:"grand",syllables:3},{name:"Solstice",reg:"grand",syllables:2},{name:"Starfall",reg:"grand",syllables:2},{name:"Starshadow",reg:"grand",syllables:2},{name:"Starstone",reg:"grand",syllables:2},{name:"Sunflare",reg:"grand",syllables:2},{name:"Whirlwind",reg:"grand",syllables:2},{name:"Bluemoon",reg:"grand",syllables:2},{name:"Midnight",reg:"grand",syllables:2},{name:"Moonshadow",reg:"grand",syllables:3}],
    girl: [{name:"Astra",reg:"grand",syllables:2},{name:"Luna",reg:"grand",syllables:2},{name:"Aurora",reg:"grand",syllables:2},{name:"Cassiopeia",reg:"grand",syllables:2},{name:"Nova",reg:"grand",syllables:2},{name:"Eclipse",reg:"grand",syllables:2},{name:"Stella",reg:"grand",syllables:2},{name:"Hydra",reg:"grand",syllables:2},{name:"Starshadow",reg:"grand",syllables:2},{name:"Cosmic",reg:"grand",syllables:2},{name:"Aurora",reg:"grand",syllables:2},{name:"Vela",reg:"grand",syllables:2},{name:"Carina",reg:"grand",syllables:2},{name:"Seraphina",reg:"grand",syllables:2},{name:"Calypso",reg:"grand",syllables:2},{name:"Elara",reg:"grand",syllables:2},{name:"Callisto",reg:"grand",syllables:2},{name:"Ganymede",reg:"grand",syllables:2},{name:"Io",reg:"grand",syllables:2},{name:"Titchy",reg:"grand",syllables:2},{name:"Dainty",reg:"grand",syllables:2},{name:"Pixie",reg:"grand",syllables:2},{name:"Twiggy",reg:"grand",syllables:2},{name:"Petite",reg:"grand",syllables:2},{name:"Speck",reg:"grand",syllables:2},{name:"Smidge",reg:"grand",syllables:2},{name:"Andromeda",reg:"grand",syllables:4},{name:"Artemis",reg:"grand",syllables:3},{name:"Artemisia",reg:"grand",syllables:5},{name:"Astrid",reg:"grand",syllables:2},{name:"Dawnstar",reg:"grand",syllables:2},{name:"Lunaris",reg:"grand",syllables:3},{name:"Nebula",reg:"grand",syllables:3},{name:"Nightfall",reg:"grand",syllables:2},{name:"Nightglow",reg:"grand",syllables:2},{name:"Nightshade",reg:"grand",syllables:2},{name:"Penumbra",reg:"grand",syllables:3},{name:"Selene",reg:"grand",syllables:3},{name:"Shadowmoon",reg:"grand",syllables:3},{name:"Silvermoon",reg:"grand",syllables:3},{name:"Starbeam",reg:"grand",syllables:2},{name:"Stardust",reg:"grand",syllables:2},{name:"Starlight",reg:"grand",syllables:2},{name:"Twilight",reg:"grand",syllables:2},{name:"Umbra",reg:"grand",syllables:2},{name:"Vega",reg:"grand",syllables:2},{name:"Goldenmoon",reg:"grand",syllables:3},{name:"Moonbeam",reg:"grand",syllables:2},{name:"Moondust",reg:"grand",syllables:2},{name:"Moonglow",reg:"grand",syllables:2},{name:"Moonlight",reg:"grand",syllables:2},{name:"Astral",reg:"grand",syllables:2},{name:"Comet",reg:"grand",syllables:2},{name:"Equinox",reg:"grand",syllables:3},{name:"Galaxy",reg:"grand",syllables:3},{name:"Skyfall",reg:"grand",syllables:2},{name:"Skyfire",reg:"grand",syllables:2},{name:"Solaris",reg:"grand",syllables:3},{name:"Solstice",reg:"grand",syllables:2},{name:"Starfall",reg:"grand",syllables:2},{name:"Starstone",reg:"grand",syllables:2},{name:"Sunflare",reg:"grand",syllables:2},{name:"Supernova",reg:"grand",syllables:4},{name:"Whirlwind",reg:"grand",syllables:2},{name:"Bluemoon",reg:"grand",syllables:2},{name:"Midnight",reg:"grand",syllables:2},{name:"Moonfall",reg:"grand",syllables:2},{name:"Moonshadow",reg:"grand",syllables:3}]
},
  giant: {
    boy: [{name:"Teacup",reg:"ironic",syllables:2},{name:"Nimble",reg:"ironic",syllables:2},{name:"Tinykins",reg:"ironic",syllables:3},{name:"Teeny",reg:"ironic",syllables:2},{name:"Smidgeon",reg:"ironic",syllables:2},{name:"Titchy",reg:"ironic",syllables:2},{name:"Dinky",reg:"ironic",syllables:2},{name:"Lilliput",reg:"ironic",syllables:3},{name:"Pocket",reg:"ironic",syllables:2},{name:"Otto",reg:"mundane",syllables:2},{name:"Otis",reg:"mundane",syllables:2},{name:"Remy",reg:"mundane",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Stomper",reg:"chaos",syllables:2},{name:"Clomper",reg:"chaos",syllables:2},{name:"Trooper",reg:"chaos",syllables:2},{name:"Trundles",reg:"chaos",syllables:2},{name:"Lollypop",reg:"chaos",syllables:2},{name:"Shambler",reg:"chaos",syllables:2},{name:"Rumble",reg:"chaos",syllables:2},{name:"Chunk",reg:"chaos",syllables:2},{name:"Tubby",reg:"chaos",syllables:2},{name:"Waddler",reg:"chaos",syllables:2},{name:"Waddles",reg:"chaos",syllables:2},{name:"Thunderpaws",reg:"chaos",syllables:2},{name:"Bumpkin",reg:"chaos",syllables:2},{name:"Goliath",reg:"chaos",syllables:2},{name:"Bruiser",reg:"chaos",syllables:2},{name:"Bowser",reg:"chaos",syllables:2},{name:"Bonzo",reg:"chaos",syllables:2},{name:"Ajax",reg:"grand",syllables:2},{name:"Achilles",reg:"grand",syllables:3},{name:"Atlas",reg:"grand",syllables:2},{name:"Amos",reg:"mundane",syllables:2},{name:"Arnold",reg:"mundane",syllables:2},{name:"Albert",reg:"grand",syllables:2},{name:"Augustus",reg:"grand",syllables:3},{name:"Archibald",reg:"grand",syllables:3},{name:"Ernest",reg:"grand",syllables:2},{name:"Edmund",reg:"grand",syllables:2},{name:"Edgar",reg:"grand",syllables:2},{name:"Edward",reg:"grand",syllables:2},{name:"Elmer",reg:"mundane",syllables:2},{name:"Ezra",reg:"mundane",syllables:2},{name:"Ferdinand",reg:"grand",syllables:3},{name:"Frederick",reg:"grand",syllables:3},{name:"Franklin",reg:"grand",syllables:2},{name:"Fletcher",reg:"mundane",syllables:2},{name:"Floyd",reg:"mundane",syllables:1},{name:"Herbert",reg:"grand",syllables:2},{name:"Harold",reg:"grand",syllables:2},{name:"Henry",reg:"grand",syllables:2},{name:"Hugo",reg:"grand",syllables:2},{name:"Hector",reg:"grand",syllables:2},{name:"Hercules",reg:"grand",syllables:3},{name:"Humphrey",reg:"grand",syllables:2},{name:"Howard",reg:"mundane",syllables:2},{name:"Hamish",reg:"mundane",syllables:2},{name:"Hank",reg:"mundane",syllables:1},{name:"Harvey",reg:"mundane",syllables:2},{name:"Ivan",reg:"grand",syllables:2},{name:"Ignatius",reg:"grand",syllables:4},{name:"Irving",reg:"mundane",syllables:2},{name:"Jasper",reg:"grand",syllables:2},{name:"Jericho",reg:"grand",syllables:3},{name:"Julius",reg:"grand",syllables:3},{name:"Jerome",reg:"grand",syllables:2},{name:"Jefferson",reg:"grand",syllables:3},{name:"Klaus",reg:"grand",syllables:1},{name:"Kristian",reg:"mundane",syllables:3},{name:"Kelvin",reg:"mundane",syllables:2},{name:"Magnus",reg:"grand",syllables:2},{name:"Maximus",reg:"grand",syllables:3},{name:"Malcolm",reg:"grand",syllables:2},{name:"Maurice",reg:"grand",syllables:2},{name:"Montgomery",reg:"grand",syllables:4},{name:"Mortimer",reg:"grand",syllables:3},{name:"Marshall",reg:"grand",syllables:2},{name:"Marco",reg:"grand",syllables:2},{name:"Quentin",reg:"grand",syllables:2},{name:"Ulysses",reg:"grand",syllables:3},{name:"Ursus",reg:"grand",syllables:2},{name:"Victor",reg:"grand",syllables:2},{name:"Vincent",reg:"grand",syllables:2},{name:"Vladimir",reg:"grand",syllables:3},{name:"Xavier",reg:"grand",syllables:3},{name:"Yusuf",reg:"mundane",syllables:2},{name:"Zephyr",reg:"grand",syllables:2},{name:"Zoro",reg:"grand",syllables:2},{name:"Barnaby",reg:"grand",syllables:3},{name:"Boris",reg:"mundane",syllables:2},{name:"Bruno",reg:"mundane",syllables:2},{name:"Caesar",reg:"grand",syllables:2},{name:"Cormac",reg:"grand",syllables:2},{name:"Conrad",reg:"grand",syllables:2},{name:"Desmond",reg:"mundane",syllables:2},{name:"Douglas",reg:"mundane",syllables:2},{name:"Drake",reg:"grand",syllables:1},{name:"Gordon",reg:"mundane",syllables:2},{name:"Graham",reg:"mundane",syllables:2},{name:"Gruff",reg:"grand",syllables:1},{name:"Leopold",reg:"grand",syllables:3},{name:"Lennox",reg:"grand",syllables:2},{name:"Lorenzo",reg:"grand",syllables:3},{name:"Norman",reg:"mundane",syllables:2},{name:"Nelson",reg:"mundane",syllables:2},{name:"Nigel",reg:"mundane",syllables:2},{name:"Percival",reg:"grand",syllables:3},{name:"Patrick",reg:"mundane",syllables:2},{name:"Reginald",reg:"grand",syllables:3},{name:"Roland",reg:"grand",syllables:2},{name:"Rupert",reg:"grand",syllables:2},{name:"Sebastian",reg:"grand",syllables:4},{name:"Solomon",reg:"grand",syllables:3},{name:"Stanley",reg:"mundane",syllables:2},{name:"Theodore",reg:"grand",syllables:4},{name:"Thaddeus",reg:"grand",syllables:3},{name:"Tobias",reg:"grand",syllables:3},{name:"Walter",reg:"grand",syllables:2},{name:"Winston",reg:"grand",syllables:2},{name:"Wilfred",reg:"grand",syllables:2}],
    girl: [{name:"Titchy",reg:"ironic",syllables:2},{name:"WeeDee",reg:"ironic",syllables:2},{name:"Petite",reg:"ironic",syllables:2},{name:"Dinky",reg:"ironic",syllables:2},{name:"Lilliput",reg:"ironic",syllables:3},{name:"Daintybell",reg:"ironic",syllables:3},{name:"Thistledown",reg:"ironic",syllables:3},{name:"Gossamera",reg:"ironic",syllables:3},{name:"Pixie",reg:"ironic",syllables:2},{name:"Twiggy",reg:"ironic",syllables:2},{name:"Speck",reg:"ironic",syllables:1},{name:"Smidge",reg:"ironic",syllables:1},{name:"Milly",reg:"mundane",syllables:2},{name:"Molly",reg:"mundane",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Tiddlywink",reg:"baby",syllables:3},{name:"Boadicea",reg:"grand",syllables:2},{name:"Zenobia",reg:"grand",syllables:2},{name:"Cleopatra",reg:"grand",syllables:2},{name:"Hippolyta",reg:"grand",syllables:2},{name:"Artemisia",reg:"grand",syllables:2},{name:"Theodora",reg:"grand",syllables:2},{name:"Agrippina",reg:"grand",syllables:2},{name:"Livia",reg:"grand",syllables:2},{name:"Octavia",reg:"grand",syllables:2},{name:"Hypatia",reg:"grand",syllables:2},{name:"Aspasia",reg:"grand",syllables:2},{name:"Medea",reg:"grand",syllables:2},{name:"Andromache",reg:"grand",syllables:2},{name:"Cassandra",reg:"grand",syllables:2},{name:"Calypso",reg:"grand",syllables:2},{name:"Circe",reg:"grand",syllables:2},{name:"Demeter",reg:"grand",syllables:2},{name:"Hera",reg:"grand",syllables:2},{name:"Athena",reg:"grand",syllables:2},{name:"Artemis",reg:"grand",syllables:2},{name:"Aphrodite",reg:"grand",syllables:2},{name:"Hecate",reg:"grand",syllables:2},{name:"Gaia",reg:"grand",syllables:2},{name:"Matilda",reg:"grand",syllables:2},{name:"Eleanor",reg:"grand",syllables:2},{name:"Isabeau",reg:"grand",syllables:2},{name:"Blanche",reg:"grand",syllables:2},{name:"Radegund",reg:"grand",syllables:2},{name:"Bathilde",reg:"grand",syllables:2},{name:"Clothilde",reg:"grand",syllables:2},{name:"Etheldreda",reg:"grand",syllables:2},{name:"Victoria",reg:"grand",syllables:2},{name:"Adelaide",reg:"grand",syllables:2},{name:"Charlotte",reg:"grand",syllables:2},{name:"Sophia",reg:"grand",syllables:2},{name:"Helena",reg:"grand",syllables:2},{name:"Wilhelmina",reg:"grand",syllables:2},{name:"Alexandrina",reg:"grand",syllables:2},{name:"Thomasina",reg:"grand",syllables:2},{name:"Christabel",reg:"grand",syllables:2},{name:"Rosalind",reg:"grand",syllables:2},{name:"Guinevere",reg:"grand",syllables:2},{name:"Evangeline",reg:"grand",syllables:2},{name:"Josephine",reg:"grand",syllables:2},{name:"Hildegard",reg:"grand",syllables:2},{name:"Brunhilde",reg:"grand",syllables:2},{name:"Gertrude",reg:"grand",syllables:2},{name:"Ingeborg",reg:"grand",syllables:2},{name:"Elfriede",reg:"grand",syllables:2},{name:"Mathilde",reg:"grand",syllables:2},{name:"Hedwig",reg:"grand",syllables:2},{name:"Mechthild",reg:"grand",syllables:2},{name:"Walburga",reg:"grand",syllables:2},{name:"Kunigunde",reg:"grand",syllables:2},{name:"Sieglinde",reg:"grand",syllables:2},{name:"Kriemhild",reg:"grand",syllables:2},{name:"Gudrun",reg:"grand",syllables:2},{name:"Freya",reg:"grand",syllables:2},{name:"Sigrid",reg:"grand",syllables:2},{name:"Astrid",reg:"grand",syllables:2},{name:"Ragnhild",reg:"grand",syllables:2},{name:"Thyra",reg:"grand",syllables:2},{name:"Gunhild",reg:"grand",syllables:2},{name:"Bergljot",reg:"grand",syllables:2},{name:"Ursula",reg:"grand",syllables:2},{name:"Bjorna",reg:"grand",syllables:2},{name:"Mishka",reg:"grand",syllables:2},{name:"Nanuq",reg:"grand",syllables:2},{name:"Koda",reg:"grand",syllables:2},{name:"Callista",reg:"grand",syllables:2},{name:"Brunhilda",reg:"grand",syllables:2},{name:"Arabella",reg:"grand",syllables:2},{name:"Cordelia",reg:"grand",syllables:2},{name:"Millicent",reg:"grand",syllables:2},{name:"Clementine",reg:"grand",syllables:2},{name:"Hildegarde",reg:"grand",syllables:2},{name:"Constance",reg:"grand",syllables:2},{name:"Prudence",reg:"grand",syllables:2},{name:"Patience",reg:"grand",syllables:2},{name:"Temperance",reg:"grand",syllables:2},{name:"Sophronia",reg:"grand",syllables:2},{name:"Georgiana",reg:"grand",syllables:2},{name:"Frederica",reg:"grand",syllables:2},{name:"Imogen",reg:"grand",syllables:2},{name:"Lavinia",reg:"grand",syllables:2},{name:"Henrietta",reg:"grand",syllables:2},{name:"Beatrice",reg:"grand",syllables:2},{name:"Dorothea",reg:"grand",syllables:2},{name:"Gwendolyn",reg:"grand",syllables:2},{name:"Rowena",reg:"grand",syllables:2},{name:"Rosamund",reg:"grand",syllables:2},{name:"Seraphina",reg:"grand",syllables:2},{name:"Celestine",reg:"grand",syllables:2},{name:"Rhiannon",reg:"grand",syllables:2},{name:"Ceridwen",reg:"grand",syllables:2},{name:"Branwen",reg:"grand",syllables:2},{name:"Gwenllian",reg:"grand",syllables:2},{name:"Arianrhod",reg:"grand",syllables:2},{name:"Blodwen",reg:"grand",syllables:2},{name:"Morfudd",reg:"grand",syllables:2},{name:"Tabitha",reg:"grand",syllables:2},{name:"Tallulah",reg:"grand",syllables:2}]
},
  terrier: {
    boy: [{name:"Chaos",reg:"chaos",syllables:2},{name:"Havoc",reg:"chaos",syllables:2},{name:"Mayhem",reg:"chaos",syllables:2},{name:"Bedlam",reg:"chaos",syllables:2},{name:"Ruckus",reg:"chaos",syllables:2},{name:"Pandemonium",reg:"chaos",syllables:5},{name:"Anarchy",reg:"chaos",syllables:3},{name:"Turmoil",reg:"chaos",syllables:2},{name:"Brouhaha",reg:"chaos",syllables:3},{name:"Kerfuffle",reg:"chaos",syllables:3},{name:"Uproar",reg:"chaos",syllables:2},{name:"Fracas",reg:"chaos",syllables:2},{name:"Commotion",reg:"chaos",syllables:3},{name:"Hullabaloo",reg:"chaos",syllables:4},{name:"Clamour",reg:"chaos",syllables:2},{name:"Rampage",reg:"chaos",syllables:2},{name:"Maelstrom",reg:"chaos",syllables:2},{name:"Melee",reg:"chaos",syllables:2},{name:"Scrumpy",reg:"chaos",syllables:2},{name:"Scamp",reg:"chaos",syllables:2},{name:"Nipper",reg:"chaos",syllables:2},{name:"Scrapper",reg:"chaos",syllables:2},{name:"Ripper",reg:"chaos",syllables:2},{name:"Skitter",reg:"chaos",syllables:2},{name:"Fidget",reg:"chaos",syllables:2},{name:"Rascal",reg:"chaos",syllables:2},{name:"Mischief",reg:"chaos",syllables:2},{name:"Trouble",reg:"chaos",syllables:2},{name:"Rowdy",reg:"chaos",syllables:2},{name:"Digger",reg:"chaos",syllables:2},{name:"Snapper",reg:"chaos",syllables:2},{name:"Scratchy",reg:"chaos",syllables:2},{name:"Scuttle",reg:"chaos",syllables:2},{name:"Sprocket",reg:"chaos",syllables:2},{name:"Spanner",reg:"chaos",syllables:2},{name:"Scamper",reg:"chaos",syllables:2},{name:"Snook",reg:"chaos",syllables:2},{name:"Bouncer",reg:"chaos",syllables:2},{name:"Ruffnut",reg:"chaos",syllables:2},{name:"Scrapper",reg:"chaos",syllables:2},{name:"Nipper",reg:"chaos",syllables:2},{name:"Ripper",reg:"chaos",syllables:2},{name:"Fidget",reg:"chaos",syllables:2},{name:"Mugsy",reg:"chaos",syllables:2},{name:"Taz",reg:"chaos",syllables:2},{name:"Dippy",reg:"chaos",syllables:2},{name:"Loony",reg:"chaos",syllables:2},{name:"Jinks",reg:"chaos",syllables:2},{name:"Ruff",reg:"chaos",syllables:2},{name:"Quickdraw",reg:"chaos",syllables:2},{name:"Spud",reg:"food",syllables:1},{name:"Chippy",reg:"food",syllables:2},{name:"Walnut",reg:"food",syllables:2},{name:"Chestnut",reg:"food",syllables:2},{name:"Almond",reg:"food",syllables:2},{name:"Squash",reg:"food",syllables:1},{name:"Carrot",reg:"food",syllables:2},{name:"Pea",reg:"food",syllables:1},{name:"Carrots",reg:"food",syllables:2},{name:"Liquorice",reg:"food",syllables:3},{name:"Curlywurly",reg:"food",syllables:4},{name:"Tunnock",reg:"food",syllables:2},{name:"Teacake",reg:"food",syllables:2},{name:"Toffo",reg:"food",syllables:2},{name:"Caramac",reg:"food",syllables:3},{name:"Treacletoffee",reg:"food",syllables:3},{name:"Pepperminty",reg:"food",syllables:4},{name:"Parma",reg:"food",syllables:2}],
    girl: [{name:"Frenzina",reg:"chaos",syllables:3},{name:"Pandemonia",reg:"chaos",syllables:4},{name:"Anarchia",reg:"chaos",syllables:4},{name:"Mischief",reg:"chaos",syllables:2},{name:"Turbulence",reg:"chaos",syllables:3},{name:"Whirlwind",reg:"chaos",syllables:2},{name:"Tempest",reg:"chaos",syllables:2},{name:"Gale",reg:"chaos",syllables:1},{name:"Tempesta",reg:"chaos",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Tutu",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Tiddlywink",reg:"baby",syllables:3},{name:"Scrumpy",reg:"chaos",syllables:2},{name:"Scamp",reg:"chaos",syllables:2},{name:"Nipper",reg:"chaos",syllables:2},{name:"Skittles",reg:"chaos",syllables:2},{name:"Fidget",reg:"chaos",syllables:2},{name:"Ruffles",reg:"chaos",syllables:2},{name:"Tangles",reg:"chaos",syllables:2},{name:"Tufty",reg:"chaos",syllables:2},{name:"Pipsqueak",reg:"chaos",syllables:2},{name:"Titch",reg:"chaos",syllables:2},{name:"Snippy",reg:"chaos",syllables:2},{name:"Squirt",reg:"chaos",syllables:2},{name:"Scraggy",reg:"chaos",syllables:2},{name:"Wriggles",reg:"chaos",syllables:2},{name:"Bonnie",reg:"mundane",syllables:2},{name:"Dottie",reg:"mundane",syllables:2},{name:"Dusty",reg:"mundane",syllables:1},{name:"Effie",reg:"mundane",syllables:2},{name:"Elsie",reg:"mundane",syllables:2},{name:"Feisty",reg:"chaos",syllables:1},{name:"Flick",reg:"chaos",syllables:1},{name:"Ginny",reg:"chaos",syllables:1},{name:"Hetty",reg:"mundane",syllables:1},{name:"Josie",reg:"mundane",syllables:2},{name:"Kitty",reg:"mundane",syllables:1},{name:"Lacey",reg:"mundane",syllables:2},{name:"Lassie",reg:"mundane",syllables:2},{name:"Lottie",reg:"mundane",syllables:2},{name:"Maggie",reg:"mundane",syllables:2},{name:"Maisie",reg:"grand",syllables:2},{name:"Meg",reg:"mundane",syllables:1},{name:"Minnie",reg:"mundane",syllables:2},{name:"Molly",reg:"mundane",syllables:1},{name:"Nell",reg:"nature",syllables:1},{name:"Nettle",reg:"chaos",syllables:2},{name:"Nip",reg:"chaos",syllables:1},{name:"Patch",reg:"mundane",syllables:1},{name:"Peggy",reg:"mundane",syllables:1},{name:"Pickle",reg:"mundane",syllables:2},{name:"Pip",reg:"mundane",syllables:1},{name:"Pippa",reg:"mundane",syllables:2},{name:"Plucky",reg:"chaos",syllables:1},{name:"Spud",reg:"food",syllables:1},{name:"Chippy",reg:"food",syllables:2},{name:"Walnut",reg:"food",syllables:2},{name:"Chestnut",reg:"food",syllables:2},{name:"Almond",reg:"food",syllables:2},{name:"Squash",reg:"food",syllables:1},{name:"Carrot",reg:"food",syllables:2},{name:"Pea",reg:"food",syllables:1},{name:"Carrots",reg:"food",syllables:2},{name:"Liquorice",reg:"food",syllables:3},{name:"Curlywurly",reg:"food",syllables:4},{name:"Tunnock",reg:"food",syllables:2},{name:"Teacake",reg:"food",syllables:2},{name:"Toffo",reg:"food",syllables:2},{name:"Caramac",reg:"food",syllables:3},{name:"Treacletoffee",reg:"food",syllables:3},{name:"Pepperminty",reg:"food",syllables:4},{name:"Parma",reg:"food",syllables:2}]
},
  retriever: {
    boy: [{name:"Biscuit",reg:"food",syllables:2},{name:"Pudding",reg:"food",syllables:2},{name:"Custard",reg:"food",syllables:2},{name:"Gravy",reg:"food",syllables:2},{name:"Crumble",reg:"food",syllables:2},{name:"Dumpling",reg:"food",syllables:2},{name:"Jelly",reg:"food",syllables:2},{name:"Sausage",reg:"food",syllables:2},{name:"Treacle",reg:"food",syllables:2},{name:"Syllabub",reg:"food",syllables:3},{name:"Douglas",reg:"mundane",syllables:2},{name:"Barnaby",reg:"grand",syllables:3},{name:"Edmund",reg:"grand",syllables:2},{name:"Herbert",reg:"mundane",syllables:2},{name:"Clarence",reg:"grand",syllables:2},{name:"Frederick",reg:"grand",syllables:3},{name:"Norman",reg:"mundane",syllables:2},{name:"Stanley",reg:"mundane",syllables:2},{name:"Reginald",reg:"grand",syllables:3},{name:"Humphrey",reg:"grand",syllables:2},{name:"Archibald",reg:"grand",syllables:3},{name:"William",reg:"mundane",syllables:2},{name:"Oliver",reg:"mundane",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Scampi",reg:"food",syllables:2},{name:"Nugget",reg:"food",syllables:2},{name:"Popcorn",reg:"food",syllables:2},{name:"Beans",reg:"food",syllables:2},{name:"Sizzle",reg:"food",syllables:2},{name:"Banger",reg:"food",syllables:2},{name:"Crumbs",reg:"food",syllables:2},{name:"Meatball",reg:"food",syllables:2},{name:"Chip",reg:"food",syllables:2},{name:"Chops",reg:"food",syllables:2},{name:"Scraps",reg:"food",syllables:2},{name:"Cookie",reg:"food",syllables:2},{name:"Cracker",reg:"food",syllables:2},{name:"Sprat",reg:"food",syllables:2},{name:"Kipper",reg:"food",syllables:2},{name:"Truffles",reg:"food",syllables:2},{name:"Minnow",reg:"food",syllables:2},{name:"Goose",reg:"chaos",syllables:2},{name:"Fetcher",reg:"chaos",syllables:2},{name:"Wagger",reg:"chaos",syllables:2},{name:"Wags",reg:"chaos",syllables:2},{name:"Lollypop",reg:"chaos",syllables:2},{name:"Slobber",reg:"chaos",syllables:2},{name:"Chomper",reg:"chaos",syllables:2},{name:"Gobbler",reg:"chaos",syllables:2},{name:"Muncher",reg:"chaos",syllables:2},{name:"Barnacle",reg:"chaos",syllables:2},{name:"Shortcake",reg:"food",syllables:2},{name:"Doughnut",reg:"food",syllables:2},{name:"Bagel",reg:"food",syllables:2},{name:"Pretzel",reg:"food",syllables:2},{name:"Chips",reg:"food",syllables:2},{name:"Gherkin",reg:"food",syllables:2},{name:"Porridge",reg:"food",syllables:2},{name:"Granola",reg:"food",syllables:2},{name:"Toastie",reg:"food",syllables:2},{name:"Crusty",reg:"food",syllables:2},{name:"Crispy",reg:"food",syllables:2},{name:"Cobbler",reg:"food",syllables:2},{name:"Strudel",reg:"food",syllables:2},{name:"Tartlet",reg:"food",syllables:2},{name:"Munchie",reg:"food",syllables:2},{name:"Chewy",reg:"food",syllables:2},{name:"Cruncher",reg:"food",syllables:2},{name:"Nibbler",reg:"food",syllables:2},{name:"Scoffy",reg:"food",syllables:2},{name:"Latte",reg:"food",syllables:2},{name:"Molasses",reg:"food",syllables:2},{name:"Turnip",reg:"food",syllables:2},{name:"Parsnip",reg:"food",syllables:2},{name:"Cashew",reg:"food",syllables:2},{name:"Hazelnut",reg:"food",syllables:2},{name:"Nutmeg",reg:"food",syllables:2},{name:"Pepper",reg:"food",syllables:2},{name:"Paprika",reg:"food",syllables:2},{name:"Chutney",reg:"food",syllables:2},{name:"Cyrus",reg:"grand",syllables:2},{name:"Darius",reg:"grand",syllables:3},{name:"Plato",reg:"grand",syllables:2},{name:"Prometheus",reg:"grand",syllables:4},{name:"Pythagoras",reg:"grand",syllables:4},{name:"Socrates",reg:"grand",syllables:3},{name:"Napoleon",reg:"grand",syllables:4},{name:"Pascal",reg:"grand",syllables:2},{name:"Newton",reg:"grand",syllables:2},{name:"Darwin",reg:"grand",syllables:2},{name:"Einstein",reg:"grand",syllables:3},{name:"Cookies",reg:"food",syllables:2},{name:"Crackers",reg:"food",syllables:2},{name:"Sausages",reg:"food",syllables:3},{name:"Dumplings",reg:"food",syllables:2},{name:"Kippers",reg:"food",syllables:2},{name:"Freddo",reg:"food",syllables:2},{name:"Fudgey",reg:"food",syllables:2},{name:"Wagonwheel",reg:"food",syllables:3}],
    girl: [{name:"Treacle",reg:"food",syllables:2},{name:"Trifle",reg:"food",syllables:2},{name:"Muffin",reg:"food",syllables:2},{name:"Pudding",reg:"food",syllables:2},{name:"Eclair",reg:"food",syllables:2},{name:"Crumpet",reg:"food",syllables:2},{name:"Waffle",reg:"food",syllables:2},{name:"Biscuit",reg:"food",syllables:2},{name:"Brownie",reg:"food",syllables:2},{name:"Pavlova",reg:"food",syllables:3},{name:"Charlotte",reg:"mundane",syllables:2},{name:"Margaret",reg:"mundane",syllables:3},{name:"Dorothy",reg:"mundane",syllables:3},{name:"Edith",reg:"mundane",syllables:2},{name:"Florence",reg:"mundane",syllables:2},{name:"Beatrice",reg:"grand",syllables:3},{name:"Constance",reg:"mundane",syllables:2},{name:"Millicent",reg:"grand",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Jellybean",reg:"food",syllables:3},{name:"Candyfloss",reg:"food",syllables:3},{name:"Cupcake",reg:"food",syllables:2},{name:"Truffle",reg:"food",syllables:2},{name:"Nugget",reg:"food",syllables:2},{name:"Popcorn",reg:"food",syllables:2},{name:"Beanbag",reg:"food",syllables:2},{name:"Nibbins",reg:"food",syllables:2},{name:"Cookie",reg:"food",syllables:2},{name:"Cracker",reg:"food",syllables:2},{name:"Kipper",reg:"food",syllables:2},{name:"Sardine",reg:"food",syllables:2},{name:"Prawn",reg:"food",syllables:2},{name:"Pickles",reg:"food",syllables:2},{name:"Pippin",reg:"food",syllables:2},{name:"Pip",reg:"food",syllables:2},{name:"Pipsqueak",reg:"food",syllables:2},{name:"Sprout",reg:"food",syllables:2},{name:"Goose",reg:"food",syllables:2},{name:"Smudge",reg:"food",syllables:2},{name:"Splodge",reg:"food",syllables:2},{name:"Shortcake",reg:"food",syllables:2},{name:"Sprinkles",reg:"food",syllables:2},{name:"Doughnut",reg:"food",syllables:2},{name:"Marshmallow",reg:"food",syllables:2},{name:"Meringue",reg:"food",syllables:2},{name:"Latte",reg:"food",syllables:2},{name:"Peaches",reg:"food",syllables:2},{name:"Cherry",reg:"food",syllables:2},{name:"Berry",reg:"food",syllables:2},{name:"Plum",reg:"food",syllables:2},{name:"Apricot",reg:"food",syllables:2},{name:"Kiwi",reg:"food",syllables:2},{name:"Mango",reg:"food",syllables:2},{name:"Melon",reg:"food",syllables:2},{name:"Smartie",reg:"food",syllables:2},{name:"Gumball",reg:"food",syllables:2},{name:"Taffy",reg:"food",syllables:2},{name:"Rolo",reg:"food",syllables:2},{name:"Cheerio",reg:"food",syllables:2},{name:"Figgy",reg:"food",syllables:2},{name:"Pumpkin",reg:"food",syllables:2},{name:"Athena",reg:"grand",syllables:3},{name:"Calypso",reg:"grand",syllables:3},{name:"Carina",reg:"grand",syllables:3},{name:"Cassandra",reg:"grand",syllables:3},{name:"Circe",reg:"grand",syllables:2},{name:"Cleopatra",reg:"grand",syllables:4},{name:"Demeter",reg:"grand",syllables:3},{name:"Fauna",reg:"nature",syllables:2},{name:"Gaia",reg:"grand",syllables:2},{name:"Hecate",reg:"grand",syllables:3},{name:"Hera",reg:"grand",syllables:2},{name:"Hippolyta",reg:"grand",syllables:4},{name:"Medea",reg:"grand",syllables:3},{name:"Persephone",reg:"grand",syllables:4},{name:"Phoebe",reg:"grand",syllables:2},{name:"Rhea",reg:"grand",syllables:2},{name:"Sappho",reg:"grand",syllables:2},{name:"Seraphina",reg:"grand",syllables:4},{name:"Sophia",reg:"grand",syllables:3},{name:"Sophronia",reg:"grand",syllables:4},{name:"Cookies",reg:"food",syllables:2},{name:"Crackers",reg:"food",syllables:2},{name:"Sausages",reg:"food",syllables:3},{name:"Dumplings",reg:"food",syllables:2},{name:"Kippers",reg:"food",syllables:2},{name:"Freddo",reg:"food",syllables:2},{name:"Fudgey",reg:"food",syllables:2},{name:"Wagonwheel",reg:"food",syllables:3}]
},
  collie: {
    boy: [{name:"Frenetic",reg:"chaos",syllables:3},{name:"Relentless",reg:"absurd",syllables:3},{name:"Obsessive",reg:"absurd",syllables:3},{name:"Tenacious",reg:"absurd",syllables:4},{name:"Resolute",reg:"grand",syllables:3},{name:"Duncan",reg:"mundane",syllables:2},{name:"Angus",reg:"mundane",syllables:2},{name:"Hamish",reg:"mundane",syllables:2},{name:"Rory",reg:"mundane",syllables:2},{name:"Fergus",reg:"mundane",syllables:2},{name:"Malcolm",reg:"mundane",syllables:2},{name:"Sprocket",reg:"chaos",syllables:2},{name:"Spanner",reg:"chaos",syllables:2},{name:"Fidget",reg:"chaos",syllables:2},{name:"Zippy",reg:"chaos",syllables:2},{name:"Zoomer",reg:"chaos",syllables:2},{name:"Whizz",reg:"chaos",syllables:2},{name:"Rocket",reg:"chaos",syllables:2},{name:"Dasher",reg:"chaos",syllables:2},{name:"Scout",reg:"chaos",syllables:2},{name:"Tracker",reg:"chaos",syllables:2},{name:"Chaser",reg:"chaos",syllables:2},{name:"Boffin",reg:"chaos",syllables:2},{name:"Skitter",reg:"chaos",syllables:2},{name:"Badger",reg:"mundane",syllables:2},{name:"Gadget",reg:"absurd",syllables:2},{name:"Genius",reg:"absurd",syllables:2},{name:"Glider",reg:"absurd",syllables:2},{name:"Gatherer",reg:"absurd",syllables:2},{name:"Govern",reg:"absurd",syllables:2},{name:"Grid",reg:"absurd",syllables:2},{name:"Cyrus",reg:"grand",syllables:2},{name:"Darius",reg:"grand",syllables:3},{name:"Plato",reg:"grand",syllables:2},{name:"Prometheus",reg:"grand",syllables:4},{name:"Pythagoras",reg:"grand",syllables:4},{name:"Socrates",reg:"grand",syllables:3},{name:"Napoleon",reg:"grand",syllables:4},{name:"Pascal",reg:"grand",syllables:2},{name:"Newton",reg:"grand",syllables:2},{name:"Darwin",reg:"grand",syllables:2},{name:"Einstein",reg:"grand",syllables:3},{name:"Archie",reg:"grand",syllables:2},{name:"Barney",reg:"grand",syllables:2},{name:"Callum",reg:"grand",syllables:2},{name:"Dougal",reg:"grand",syllables:2},{name:"Finn",reg:"grand",syllables:1},{name:"Fraser",reg:"grand",syllables:2},{name:"Hector",reg:"grand",syllables:2},{name:"Hunter",reg:"grand",syllables:2},{name:"Jasper",reg:"grand",syllables:2},{name:"Jed",reg:"grand",syllables:1},{name:"Jet",reg:"grand",syllables:1},{name:"Lachlan",reg:"grand",syllables:2},{name:"Logan",reg:"grand",syllables:2},{name:"Mac",reg:"grand",syllables:1},{name:"Merlin",reg:"grand",syllables:2},{name:"Murray",reg:"grand",syllables:2},{name:"Oscar",reg:"grand",syllables:2},{name:"Scott",reg:"grand",syllables:1},{name:"Shep",reg:"grand",syllables:1}],
    girl: [{name:"Athena",reg:"grand",syllables:3},{name:"Calypso",reg:"grand",syllables:3},{name:"Carina",reg:"grand",syllables:3},{name:"Cassandra",reg:"grand",syllables:3},{name:"Circe",reg:"grand",syllables:2},{name:"Cleopatra",reg:"grand",syllables:4},{name:"Demeter",reg:"grand",syllables:3},{name:"Fauna",reg:"nature",syllables:2},{name:"Gaia",reg:"grand",syllables:2},{name:"Hecate",reg:"grand",syllables:3},{name:"Hera",reg:"grand",syllables:2},{name:"Hippolyta",reg:"grand",syllables:4},{name:"Medea",reg:"grand",syllables:3},{name:"Persephone",reg:"grand",syllables:4},{name:"Phoebe",reg:"grand",syllables:2},{name:"Rhea",reg:"grand",syllables:2},{name:"Sappho",reg:"grand",syllables:2},{name:"Seraphina",reg:"grand",syllables:4},{name:"Sophia",reg:"grand",syllables:3},{name:"Sophronia",reg:"grand",syllables:4},{name:"Bracken",reg:"nature",syllables:2},{name:"Bramble",reg:"nature",syllables:2},{name:"Bree",reg:"nature",syllables:1},{name:"Briar",reg:"nature",syllables:1},{name:"Brook",reg:"nature",syllables:1},{name:"Clover",reg:"nature",syllables:2},{name:"Coral",reg:"nature",syllables:2},{name:"Dawn",reg:"nature",syllables:1},{name:"Fern",reg:"nature",syllables:1},{name:"Flora",reg:"nature",syllables:2},{name:"Gracie",reg:"nature",syllables:2},{name:"Hazel",reg:"nature",syllables:2},{name:"Heather",reg:"nature",syllables:2},{name:"Holly",reg:"nature",syllables:1},{name:"Iris",reg:"nature",syllables:2},{name:"Lark",reg:"nature",syllables:1},{name:"Laurel",reg:"nature",syllables:2},{name:"Lily",reg:"nature",syllables:1},{name:"Luna",reg:"nature",syllables:2},{name:"Meadow",reg:"nature",syllables:2},{name:"Misty",reg:"nature",syllables:1},{name:"Nell",reg:"nature",syllables:1},{name:"Nova",reg:"nature",syllables:2},{name:"Olive",reg:"nature",syllables:3},{name:"Poppy",reg:"nature",syllables:1},{name:"River",reg:"nature",syllables:2},{name:"Robin",reg:"nature",syllables:2},{name:"Rose",reg:"nature",syllables:2},{name:"Rosie",reg:"nature",syllables:2},{name:"Ruby",reg:"nature",syllables:1},{name:"Sage",reg:"nature",syllables:2},{name:"Scout",reg:"nature",syllables:1},{name:"Skye",reg:"nature",syllables:1},{name:"Sorrel",reg:"nature",syllables:2},{name:"Stella",reg:"nature",syllables:2},{name:"Storm",reg:"nature",syllables:1},{name:"Teal",reg:"nature",syllables:1},{name:"Thistle",reg:"nature",syllables:2},{name:"Violet",reg:"nature",syllables:2},{name:"Willow",reg:"nature",syllables:2},{name:"Wren",reg:"nature",syllables:1},{name:"Yarrow",reg:"nature",syllables:2},{name:"Agatha",reg:"grand",syllables:3},{name:"Beatrix",reg:"grand",syllables:2},{name:"Celia",reg:"grand",syllables:2},{name:"Clara",reg:"grand",syllables:2},{name:"Diana",reg:"grand",syllables:2},{name:"Eleanor",reg:"grand",syllables:3},{name:"Elspeth",reg:"grand",syllables:2},{name:"Grace",reg:"grand",syllables:2},{name:"Harriet",reg:"grand",syllables:2},{name:"Imogen",reg:"grand",syllables:3},{name:"Lorna",reg:"grand",syllables:2},{name:"Maisie",reg:"grand",syllables:2}]
},
  poodle: {
    boy: [{name:"Pierre",reg:"grand",syllables:1},{name:"Jacques",reg:"grand",syllables:1},{name:"François",reg:"grand",syllables:2},{name:"Henri",reg:"grand",syllables:2},{name:"Marcel",reg:"grand",syllables:2},{name:"Gaston",reg:"grand",syllables:2},{name:"Galileo",reg:"grand",syllables:4},{name:"Einstein",reg:"grand",syllables:2},{name:"Socrates",reg:"grand",syllables:3},{name:"Darwin",reg:"grand",syllables:2},{name:"Newton",reg:"grand",syllables:2},{name:"Freud",reg:"grand",syllables:1},{name:"Waltz",reg:"grand",syllables:2},{name:"Wittgenstein",reg:"grand",syllables:2},{name:"Wafture",reg:"grand",syllables:2},{name:"Pythagoras",reg:"grand",syllables:2},{name:"Poirot",reg:"grand",syllables:2},{name:"Arsène",reg:"grand",syllables:2},{name:"Blaise",reg:"grand",syllables:2},{name:"César",reg:"grand",syllables:2},{name:"Émile",reg:"grand",syllables:2},{name:"Félix",reg:"grand",syllables:2},{name:"Guy",reg:"grand",syllables:2},{name:"Hervé",reg:"grand",syllables:2},{name:"Honoré",reg:"grand",syllables:2},{name:"Jules",reg:"grand",syllables:2},{name:"Léon",reg:"grand",syllables:2},{name:"Louis",reg:"grand",syllables:2},{name:"Noël",reg:"grand",syllables:2},{name:"Raoul",reg:"grand",syllables:2},{name:"René",reg:"grand",syllables:2},{name:"Yves",reg:"grand",syllables:2},{name:"Alphonse",reg:"grand",syllables:2},{name:"Anatole",reg:"grand",syllables:2},{name:"Antoine",reg:"grand",syllables:2},{name:"Clément",reg:"grand",syllables:2},{name:"Désiré",reg:"grand",syllables:2},{name:"Edmond",reg:"grand",syllables:2},{name:"Étienne",reg:"grand",syllables:2},{name:"Eugène",reg:"grand",syllables:2},{name:"Gilles",reg:"grand",syllables:2},{name:"Jérôme",reg:"grand",syllables:2},{name:"Julien",reg:"grand",syllables:2},{name:"Léandre",reg:"grand",syllables:2},{name:"Léopold",reg:"grand",syllables:2},{name:"Lucien",reg:"grand",syllables:2},{name:"Séraphin",reg:"grand",syllables:2},{name:"Théodore",reg:"grand",syllables:2},{name:"Valentin",reg:"grand",syllables:2},{name:"Barthélemy",reg:"grand",syllables:2},{name:"Dieudonné",reg:"grand",syllables:2},{name:"Enguerrand",reg:"grand",syllables:2},{name:"Hyacinthe",reg:"grand",syllables:2},{name:"Théophile",reg:"grand",syllables:2},{name:"Toussaint",reg:"grand",syllables:2},{name:"Descartes",reg:"grand",syllables:2}],
    girl: [{name:"Colette",reg:"grand",syllables:2},{name:"Marguerite",reg:"grand",syllables:3},{name:"Simone",reg:"grand",syllables:2},{name:"Yvette",reg:"grand",syllables:2},{name:"Brigitte",reg:"grand",syllables:2},{name:"Claudette",reg:"grand",syllables:2},{name:"Giselle",reg:"grand",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},{name:"Waltz",reg:"grand",syllables:2},{name:"Wisteria",reg:"grand",syllables:2},{name:"Whimsy",reg:"grand",syllables:2},{name:"Wistful",reg:"grand",syllables:2},{name:"Wanderlust",reg:"grand",syllables:2},{name:"Catriona",reg:"mundane",syllables:2},{name:"Eilidh",reg:"mundane",syllables:2},{name:"Shona",reg:"mundane",syllables:2},{name:"Rhona",reg:"mundane",syllables:2},{name:"Sine",reg:"mundane",syllables:2},{name:"Mairead",reg:"mundane",syllables:2},{name:"Iseabail",reg:"mundane",syllables:2},{name:"Marsaili",reg:"mundane",syllables:2},{name:"Seonaid",reg:"mundane",syllables:2},{name:"Muireann",reg:"mundane",syllables:2},{name:"Sorcha",reg:"mundane",syllables:2},{name:"Deirdre",reg:"mundane",syllables:2},{name:"Aoife",reg:"mundane",syllables:2},{name:"Niamh",reg:"mundane",syllables:2},{name:"Grainne",reg:"mundane",syllables:2},{name:"Saoirse",reg:"mundane",syllables:2},{name:"Brigid",reg:"mundane",syllables:2},{name:"Siobhan",reg:"mundane",syllables:2},{name:"Roisin",reg:"mundane",syllables:2},{name:"Nell",reg:"mundane",syllables:2},{name:"Jess",reg:"mundane",syllables:2},{name:"Tess",reg:"mundane",syllables:2},{name:"Bess",reg:"mundane",syllables:2},{name:"Meg",reg:"mundane",syllables:2},{name:"Fleet",reg:"mundane",syllables:2},{name:"Fly",reg:"mundane",syllables:2},{name:"Pip",reg:"mundane",syllables:2},{name:"Dot",reg:"mundane",syllables:2},{name:"Moss",reg:"mundane",syllables:2},{name:"Bracken",reg:"mundane",syllables:2},{name:"Bramble",reg:"mundane",syllables:2},{name:"Sorrel",reg:"mundane",syllables:2},{name:"Clover",reg:"mundane",syllables:2},{name:"Thistle",reg:"mundane",syllables:2},{name:"Rowan",reg:"mundane",syllables:2},{name:"Hazel",reg:"mundane",syllables:2},{name:"Willow",reg:"mundane",syllables:2},{name:"Yarrow",reg:"mundane",syllables:2},{name:"Furze",reg:"mundane",syllables:2},{name:"Gorse",reg:"mundane",syllables:2},{name:"Skye",reg:"mundane",syllables:2},{name:"Scout",reg:"mundane",syllables:2},{name:"Sable",reg:"mundane",syllables:2},{name:"Selkie",reg:"mundane",syllables:2},{name:"Rona",reg:"mundane",syllables:2},{name:"Raven",reg:"mundane",syllables:2},{name:"Rowena",reg:"mundane",syllables:2},{name:"Lorna",reg:"mundane",syllables:2},{name:"Maisie",reg:"mundane",syllables:2},{name:"Mirren",reg:"mundane",syllables:2},{name:"Fenella",reg:"mundane",syllables:2},{name:"Perdita",reg:"mundane",syllables:2},{name:"Portia",reg:"mundane",syllables:2},{name:"Winsome",reg:"mundane",syllables:2},{name:"Wren",reg:"mundane",syllables:2},{name:"Waverly",reg:"mundane",syllables:2},{name:"Glenna",reg:"mundane",syllables:2},{name:"Grace",reg:"mundane",syllables:2},{name:"Bonnie",reg:"mundane",syllables:2},{name:"Blair",reg:"mundane",syllables:2},{name:"Tara",reg:"mundane",syllables:2},{name:"Thea",reg:"mundane",syllables:2},{name:"Tess",reg:"mundane",syllables:2},{name:"Thistle",reg:"mundane",syllables:2},{name:"Nairn",reg:"mundane",syllables:2},{name:"Merna",reg:"mundane",syllables:2},{name:"Leith",reg:"mundane",syllables:2}]
},
  dachshund: {
    boy: [{name:"Elongated",reg:"absurd",syllables:4},{name:"Horizontal",reg:"absurd",syllables:4},{name:"Extended",reg:"absurd",syllables:3},{name:"Protracted",reg:"absurd",syllables:3},{name:"Oblong",reg:"absurd",syllables:2},{name:"Longitudinal",reg:"absurd",syllables:5},{name:"Accordion",reg:"absurd",syllables:4},{name:"Telescopic",reg:"absurd",syllables:4},{name:"Klaus",reg:"grand",syllables:1},{name:"Dieter",reg:"mundane",syllables:2},{name:"Franz",reg:"mundane",syllables:1},{name:"Hans",reg:"mundane",syllables:1},{name:"Otto",reg:"mundane",syllables:2},{name:"Wolfgang",reg:"grand",syllables:2},{name:"Napoleon",reg:"grand",syllables:4},{name:"Rasputin",reg:"grand",syllables:3},{name:"Bruno",reg:"grand",syllables:2},{name:"Heinrich",reg:"grand",syllables:2},{name:"Konrad",reg:"grand",syllables:2},{name:"Helmut",reg:"grand",syllables:2},{name:"Gerhard",reg:"grand",syllables:2},{name:"Walther",reg:"grand",syllables:2},{name:"Bernhard",reg:"grand",syllables:2},{name:"Gottfried",reg:"grand",syllables:2},{name:"Albrecht",reg:"grand",syllables:2},{name:"Sigmund",reg:"grand",syllables:2},{name:"Reinhardt",reg:"grand",syllables:2},{name:"Manfred",reg:"grand",syllables:2},{name:"Dietrich",reg:"grand",syllables:2},{name:"Lothar",reg:"grand",syllables:2},{name:"Maximilian",reg:"grand",syllables:4},{name:"Friedrich",reg:"grand",syllables:2},{name:"Christoph",reg:"grand",syllables:2},{name:"Nikolaus",reg:"grand",syllables:3},{name:"Tobias",reg:"grand",syllables:2},{name:"Sebastian",reg:"grand",syllables:3},{name:"Philipp",reg:"grand",syllables:2},{name:"Matthias",reg:"grand",syllables:2},{name:"Stefan",reg:"grand",syllables:2},{name:"Slinky",reg:"food",syllables:1},{name:"Wurst",reg:"food",syllables:1},{name:"Banger",reg:"food",syllables:2},{name:"Chorizo",reg:"food",syllables:3},{name:"Salami",reg:"food",syllables:3},{name:"Plucky",reg:"chaos",syllables:1},{name:"Gnocchi",reg:"food",syllables:2},{name:"Ravioli",reg:"food",syllables:3},{name:"Tortellini",reg:"food",syllables:4},{name:"Linguine",reg:"food",syllables:2},{name:"Macaroni",reg:"food",syllables:4},{name:"Praline",reg:"food",syllables:2},{name:"Marzipan",reg:"food",syllables:3},{name:"Nougat",reg:"food",syllables:2},{name:"Fondant",reg:"food",syllables:2}],
    girl: [{name:"Slinky",reg:"absurd",syllables:2},{name:"Helga",reg:"mundane",syllables:2},{name:"Greta",reg:"mundane",syllables:2},{name:"Hilde",reg:"mundane",syllables:2},{name:"Ursula",reg:"mundane",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Gretel",reg:"mundane",syllables:2},{name:"Liesel",reg:"mundane",syllables:2},{name:"Anneliese",reg:"mundane",syllables:2},{name:"Hannelore",reg:"mundane",syllables:2},{name:"Wilhelmine",reg:"mundane",syllables:2},{name:"Trudel",reg:"mundane",syllables:2},{name:"Thekla",reg:"mundane",syllables:2},{name:"Therese",reg:"mundane",syllables:2},{name:"Traudel",reg:"mundane",syllables:2},{name:"Gretchen",reg:"mundane",syllables:2},{name:"Gerda",reg:"mundane",syllables:2},{name:"Friedel",reg:"mundane",syllables:2},{name:"Franzi",reg:"mundane",syllables:2},{name:"Hedwig",reg:"mundane",syllables:2},{name:"Inge",reg:"mundane",syllables:2},{name:"Ilse",reg:"mundane",syllables:2},{name:"Klara",reg:"mundane",syllables:2},{name:"Lotte",reg:"mundane",syllables:2},{name:"Leni",reg:"mundane",syllables:2},{name:"Marga",reg:"mundane",syllables:2},{name:"Mathilde",reg:"mundane",syllables:2},{name:"Nanni",reg:"mundane",syllables:2},{name:"Renate",reg:"mundane",syllables:2},{name:"Rosa",reg:"mundane",syllables:2},{name:"Susi",reg:"mundane",syllables:2},{name:"Ulla",reg:"mundane",syllables:2},{name:"Ursel",reg:"mundane",syllables:2},{name:"Vreni",reg:"mundane",syllables:2},{name:"Mitzi",reg:"grand",syllables:2},{name:"Trudy",reg:"grand",syllables:1},{name:"Elfriede",reg:"grand",syllables:3},{name:"Rosalinde",reg:"grand",syllables:4},{name:"Waltraud",reg:"grand",syllables:2},{name:"Brunhilda",reg:"grand",syllables:3},{name:"Dorothea",reg:"grand",syllables:3},{name:"Christiane",reg:"grand",syllables:3},{name:"Brigitte",reg:"grand",syllables:3},{name:"Monika",reg:"grand",syllables:3},{name:"Ingrid",reg:"grand",syllables:2},{name:"Sigrid",reg:"grand",syllables:2},{name:"Frieda",reg:"grand",syllables:2},{name:"Margot",reg:"grand",syllables:2},{name:"Gertrude",reg:"grand",syllables:3},{name:"Trudi",reg:"grand",syllables:2},{name:"Gnocchi",reg:"food",syllables:2},{name:"Ravioli",reg:"food",syllables:3},{name:"Tortellini",reg:"food",syllables:4},{name:"Linguine",reg:"food",syllables:2},{name:"Macaroni",reg:"food",syllables:4},{name:"Praline",reg:"food",syllables:2},{name:"Marzipan",reg:"food",syllables:3},{name:"Nougat",reg:"food",syllables:2},{name:"Fondant",reg:"food",syllables:2}],
  },
  dalmatian: {
    boy: [{name:"Domino",reg:"grand",syllables:3},{name:"Jasper",reg:"grand",syllables:2},{name:"Pongo",reg:"grand",syllables:2},{name:"Dice",reg:"chaos",syllables:2},{name:"Bandit",reg:"chaos",syllables:2},{name:"Inky",reg:"chaos",syllables:1},{name:"Speck",reg:"chaos",syllables:1},{name:"Jett",reg:"chaos",syllables:1},{name:"Pepper",reg:"food",syllables:2},{name:"Dash",reg:"chaos",syllables:1},{name:"Rolo",reg:"food",syllables:2},{name:"Oreo",reg:"food",syllables:2},{name:"Spot",reg:"mundane",syllables:1},{name:"Freckle",reg:"chaos",syllables:2},{name:"Patch",reg:"mundane",syllables:1},{name:"Freckles",reg:"chaos",syllables:2},{name:"Polka",reg:"mundane",syllables:2},{name:"Rorschach",reg:"grand",syllables:2},{name:"Milo",reg:"mundane",syllables:2},{name:"Checkers",reg:"chaos",syllables:2},{name:"Bingo",reg:"chaos",syllables:2},{name:"Marble",reg:"grand",syllables:2},{name:"Ziggy",reg:"chaos",syllables:1},{name:"Arlo",reg:"grand",syllables:2},{name:"Finn",reg:"mundane",syllables:1},{name:"Tux",reg:"chaos",syllables:1},{name:"Romeo",reg:"grand",syllables:2},{name:"Gatsby",reg:"grand",syllables:1},{name:"Ace",reg:"mundane",syllables:2},{name:"Ajax",reg:"grand",syllables:2},{name:"Blot",reg:"chaos",syllables:1},{name:"Bruno",reg:"mundane",syllables:2},{name:"Bullet",reg:"chaos",syllables:2},{name:"Chance",reg:"mundane",syllables:2},{name:"Chief",reg:"mundane",syllables:1},{name:"Cinder",reg:"mundane",syllables:2},{name:"Claude",reg:"mundane",syllables:2},{name:"Dex",reg:"chaos",syllables:1},{name:"Diego",reg:"grand",syllables:2},{name:"Dipper",reg:"chaos",syllables:2},{name:"Ditto",reg:"chaos",syllables:2},{name:"Dodger",reg:"chaos",syllables:2},{name:"Duke",reg:"mundane",syllables:2},{name:"Ember",reg:"mundane",syllables:2},{name:"Lance",reg:"mundane",syllables:2},{name:"Leo",reg:"mundane",syllables:1},{name:"Maverick",reg:"grand",syllables:3},{name:"Max",reg:"mundane",syllables:1},{name:"Nero",reg:"grand",syllables:2},{name:"Pablo",reg:"grand",syllables:2},{name:"Paco",reg:"grand",syllables:2},{name:"Pierre",reg:"grand",syllables:2},{name:"Prince",reg:"grand",syllables:2},{name:"Rascal",reg:"chaos",syllables:2},{name:"Rex",reg:"mundane",syllables:1},{name:"Rico",reg:"mundane",syllables:2},{name:"Roger",reg:"mundane",syllables:2},{name:"Roland",reg:"grand",syllables:2},{name:"Sketch",reg:"chaos",syllables:1},{name:"Stripes",reg:"chaos",syllables:2},{name:"Tango",reg:"mundane",syllables:2},{name:"Titan",reg:"grand",syllables:2}],
    girl: [{name:"Perdita",reg:"grand",syllables:3},{name:"Dotty",reg:"chaos",syllables:1},{name:"Pepper",reg:"food",syllables:2},{name:"Minnie",reg:"mundane",syllables:2},{name:"Freckles",reg:"chaos",syllables:2},{name:"Pippa",reg:"mundane",syllables:2},{name:"Domino",reg:"grand",syllables:3},{name:"Cleo",reg:"grand",syllables:1},{name:"Lottie",reg:"mundane",syllables:2},{name:"Tilly",reg:"mundane",syllables:1},{name:"Dottie",reg:"chaos",syllables:2},{name:"Nelly",reg:"mundane",syllables:1},{name:"Pixie",reg:"chaos",syllables:2},{name:"Speckle",reg:"chaos",syllables:2},{name:"Daisy",reg:"mundane",syllables:1},{name:"Winnie",reg:"mundane",syllables:2},{name:"Stella",reg:"grand",syllables:2},{name:"Bonnie",reg:"grand",syllables:2},{name:"Poppy",reg:"mundane",syllables:1},{name:"Coco",reg:"mundane",syllables:2},{name:"Bessie",reg:"mundane",syllables:2},{name:"Esmeralda",reg:"grand",syllables:4},{name:"Vivienne",reg:"grand",syllables:3},{name:"Aurora",reg:"grand",syllables:3},{name:"Bea",reg:"mundane",syllables:1},{name:"Bella",reg:"mundane",syllables:2},{name:"Blanche",reg:"mundane",syllables:2},{name:"Callie",reg:"mundane",syllables:2},{name:"Carmen",reg:"grand",syllables:2},{name:"Cecilia",reg:"grand",syllables:3},{name:"Circe",reg:"grand",syllables:2},{name:"Clara",reg:"grand",syllables:2},{name:"Colette",reg:"grand",syllables:3},{name:"Delia",reg:"mundane",syllables:2},{name:"Dita",reg:"mundane",syllables:2},{name:"Dot",reg:"mundane",syllables:1},{name:"Fifi",reg:"mundane",syllables:2},{name:"Flora",reg:"mundane",syllables:2},{name:"Gala",reg:"grand",syllables:2},{name:"Gigi",reg:"mundane",syllables:2},{name:"Grace",reg:"grand",syllables:2},{name:"Holly",reg:"mundane",syllables:1},{name:"Honey",reg:"food",syllables:2},{name:"Ines",reg:"mundane",syllables:2},{name:"Isla",reg:"mundane",syllables:2},{name:"Josie",reg:"mundane",syllables:2},{name:"Lacy",reg:"mundane",syllables:1},{name:"Lila",reg:"mundane",syllables:2},{name:"Lily",reg:"mundane",syllables:1},{name:"Lulu",reg:"mundane",syllables:2},{name:"Magpie",reg:"mundane",syllables:2},{name:"Mia",reg:"mundane",syllables:1},{name:"Mimi",reg:"mundane",syllables:2},{name:"Misty",reg:"mundane",syllables:1},{name:"Molly",reg:"mundane",syllables:1},{name:"Nala",reg:"mundane",syllables:2},{name:"Nell",reg:"mundane",syllables:1},{name:"Opal",reg:"mundane",syllables:2},{name:"Orla",reg:"mundane",syllables:2}]
  },
  labradoodle: {
    boy: [{name:"Rufus",reg:"mundane",syllables:2},{name:"Teddy",reg:"mundane",syllables:1},{name:"Murphy",reg:"mundane",syllables:1},{name:"Waffle",reg:"food",syllables:2},{name:"Barney",reg:"mundane",syllables:2},{name:"Alfie",reg:"mundane",syllables:2},{name:"Milo",reg:"mundane",syllables:2},{name:"Biscuit",reg:"food",syllables:2},{name:"Monty",reg:"mundane",syllables:1},{name:"Ziggy",reg:"chaos",syllables:1},{name:"Archie",reg:"mundane",syllables:2},{name:"Noodle",reg:"food",syllables:2},{name:"Bertie",reg:"mundane",syllables:2},{name:"Digby",reg:"mundane",syllables:1},{name:"Chester",reg:"mundane",syllables:2},{name:"Fozzy",reg:"chaos",syllables:1},{name:"Otis",reg:"mundane",syllables:2},{name:"Pickle",reg:"food",syllables:2},{name:"Toby",reg:"mundane",syllables:1},{name:"Wilbur",reg:"mundane",syllables:2},{name:"Cooper",reg:"mundane",syllables:2},{name:"Mungo",reg:"chaos",syllables:2},{name:"Sunny",reg:"mundane",syllables:1},{name:"Bruno",reg:"mundane",syllables:2},{name:"Albie",reg:"mundane",syllables:2},{name:"Bean",reg:"mundane",syllables:1},{name:"Benny",reg:"mundane",syllables:1},{name:"Bernie",reg:"mundane",syllables:2},{name:"Biscotti",reg:"food",syllables:3},{name:"Brody",reg:"mundane",syllables:1},{name:"Buddy",reg:"mundane",syllables:1},{name:"Bumper",reg:"chaos",syllables:2},{name:"Cheddar",reg:"food",syllables:2},{name:"Clancy",reg:"chaos",syllables:1},{name:"Cody",reg:"mundane",syllables:1},{name:"Cosmo",reg:"chaos",syllables:2},{name:"Croissant",reg:"food",syllables:2},{name:"Dougie",reg:"mundane",syllables:2},{name:"Finn",reg:"mundane",syllables:1},{name:"Gonzo",reg:"chaos",syllables:2},{name:"Gus",reg:"mundane",syllables:1},{name:"Harvey",reg:"mundane",syllables:2},{name:"Hugo",reg:"mundane",syllables:2},{name:"Jasper",reg:"mundane",syllables:2},{name:"Lenny",reg:"mundane",syllables:1},{name:"Louie",reg:"mundane",syllables:1},{name:"Marley",reg:"mundane",syllables:2},{name:"Max",reg:"mundane",syllables:1},{name:"Nugget",reg:"food",syllables:2},{name:"Ollie",reg:"mundane",syllables:2},{name:"Oscar",reg:"mundane",syllables:2},{name:"Ozzie",reg:"mundane",syllables:2},{name:"Peanut",reg:"food",syllables:2},{name:"Percy",reg:"mundane",syllables:1},{name:"Remy",reg:"mundane",syllables:1},{name:"Rolo",reg:"food",syllables:2},{name:"Rosco",reg:"chaos",syllables:2},{name:"Rusty",reg:"mundane",syllables:1},{name:"Sid",reg:"mundane",syllables:1},{name:"Smudge",reg:"chaos",syllables:2},{name:"Socks",reg:"chaos",syllables:1},{name:"Taffy",reg:"food",syllables:1},{name:"Woolly",reg:"chaos",syllables:1}],
    girl: [{name:"Mabel",reg:"mundane",syllables:2},{name:"Winnie",reg:"mundane",syllables:2},{name:"Tilly",reg:"mundane",syllables:1},{name:"Daisy",reg:"mundane",syllables:1},{name:"Honey",reg:"food",syllables:2},{name:"Bonnie",reg:"mundane",syllables:2},{name:"Poppy",reg:"mundane",syllables:1},{name:"Nellie",reg:"mundane",syllables:2},{name:"Maisie",reg:"mundane",syllables:2},{name:"Lottie",reg:"mundane",syllables:2},{name:"Maple",reg:"food",syllables:2},{name:"Millie",reg:"mundane",syllables:2},{name:"Betsy",reg:"mundane",syllables:1},{name:"Coco",reg:"mundane",syllables:2},{name:"Flossie",reg:"mundane",syllables:2},{name:"Fudge",reg:"food",syllables:2},{name:"Rosie",reg:"mundane",syllables:2},{name:"Dotty",reg:"mundane",syllables:1},{name:"Peggy",reg:"mundane",syllables:1},{name:"Biscuit",reg:"food",syllables:2},{name:"Caramel",reg:"food",syllables:3},{name:"Toffee",reg:"food",syllables:2},{name:"Truffle",reg:"food",syllables:2},{name:"Gertie",reg:"mundane",syllables:2},{name:"Ruby",reg:"mundane",syllables:1},{name:"Willow",reg:"mundane",syllables:2},{name:"Amber",reg:"food",syllables:2},{name:"Annie",reg:"mundane",syllables:2},{name:"Apricot",reg:"food",syllables:3},{name:"Autumn",reg:"mundane",syllables:2},{name:"Bailey",reg:"mundane",syllables:2},{name:"Biscotti",reg:"food",syllables:3},{name:"Bonbon",reg:"food",syllables:2},{name:"Bubbly",reg:"chaos",syllables:1},{name:"Butterscotch",reg:"food",syllables:3},{name:"Clover",reg:"mundane",syllables:2},{name:"Cookie",reg:"food",syllables:2},{name:"Curly",reg:"chaos",syllables:1},{name:"Ella",reg:"mundane",syllables:2},{name:"Goldie",reg:"mundane",syllables:2},{name:"Hazel",reg:"mundane",syllables:2},{name:"Jessie",reg:"mundane",syllables:2},{name:"Jilly",reg:"mundane",syllables:1},{name:"Lacey",reg:"chaos",syllables:2},{name:"Lola",reg:"mundane",syllables:2},{name:"Maggie",reg:"mundane",syllables:2},{name:"Mango",reg:"food",syllables:2},{name:"Marshmallow",reg:"food",syllables:3},{name:"Minty",reg:"food",syllables:1},{name:"Mocha",reg:"food",syllables:2},{name:"Muffin",reg:"food",syllables:2},{name:"Noodle",reg:"food",syllables:2},{name:"Nutmeg",reg:"food",syllables:2},{name:"Pebbles",reg:"mundane",syllables:2},{name:"Penny",reg:"mundane",syllables:1},{name:"Pepper",reg:"mundane",syllables:2},{name:"Pumpkin",reg:"food",syllables:2},{name:"Sandy",reg:"mundane",syllables:1},{name:"Sherbet",reg:"food",syllables:2},{name:"Sprout",reg:"food",syllables:1},{name:"Suzy",reg:"chaos",syllables:1},{name:"Twix",reg:"food",syllables:1},{name:"Waffles",reg:"food",syllables:2}]
  },
  sheepdog: {
    boy: [{name:"Winston",reg:"grand",syllables:2},{name:"Bertie",reg:"mundane",syllables:2},{name:"Wilbur",reg:"mundane",syllables:2},{name:"Digby",reg:"mundane",syllables:1},{name:"Barnaby",reg:"grand",syllables:2},{name:"Rufus",reg:"mundane",syllables:2},{name:"Monty",reg:"mundane",syllables:1},{name:"Paddington",reg:"grand",syllables:3},{name:"Dougal",reg:"mundane",syllables:2},{name:"Humphrey",reg:"grand",syllables:2},{name:"Teddy",reg:"mundane",syllables:1},{name:"Alfie",reg:"mundane",syllables:2},{name:"Stanley",reg:"mundane",syllables:2},{name:"Mungo",reg:"chaos",syllables:2},{name:"Shaggy",reg:"chaos",syllables:1},{name:"Wally",reg:"chaos",syllables:1},{name:"Bumble",reg:"chaos",syllables:2},{name:"Jasper",reg:"grand",syllables:2},{name:"Archie",reg:"mundane",syllables:2},{name:"Murphy",reg:"mundane",syllables:1},{name:"Bobbin",reg:"chaos",syllables:2},{name:"Wilf",reg:"mundane",syllables:1},{name:"Herbert",reg:"grand",syllables:2},{name:"Barney",reg:"mundane",syllables:2},{name:"Albert",reg:"mundane",syllables:2},{name:"Ambrose",reg:"grand",syllables:3},{name:"Archibald",reg:"grand",syllables:3},{name:"Arthur",reg:"mundane",syllables:2},{name:"Augustus",reg:"grand",syllables:3},{name:"Basil",reg:"grand",syllables:2},{name:"Benedict",reg:"grand",syllables:3},{name:"Bernard",reg:"mundane",syllables:2},{name:"Cecil",reg:"mundane",syllables:2},{name:"Clarence",reg:"mundane",syllables:3},{name:"Clement",reg:"grand",syllables:2},{name:"Clifford",reg:"mundane",syllables:2},{name:"Clive",reg:"mundane",syllables:2},{name:"Colin",reg:"mundane",syllables:2},{name:"Cornelius",reg:"grand",syllables:3},{name:"Desmond",reg:"mundane",syllables:2},{name:"Dudley",reg:"mundane",syllables:2},{name:"Edmund",reg:"mundane",syllables:2},{name:"Edward",reg:"mundane",syllables:2},{name:"Ernest",reg:"mundane",syllables:2},{name:"Fabian",reg:"grand",syllables:2},{name:"Ferdinand",reg:"grand",syllables:3},{name:"Fletcher",reg:"mundane",syllables:2},{name:"Francis",reg:"mundane",syllables:2},{name:"Freddie",reg:"mundane",syllables:2},{name:"Geoffrey",reg:"mundane",syllables:2},{name:"Gilbert",reg:"mundane",syllables:2},{name:"Gordon",reg:"mundane",syllables:2},{name:"Graham",reg:"mundane",syllables:2},{name:"Harold",reg:"mundane",syllables:2},{name:"Hector",reg:"mundane",syllables:2},{name:"Horace",reg:"mundane",syllables:3},{name:"Norman",reg:"mundane",syllables:2},{name:"Oscar",reg:"mundane",syllables:2},{name:"Percy",reg:"mundane",syllables:1},{name:"Phineas",reg:"grand",syllables:2},{name:"Reginald",reg:"grand",syllables:3},{name:"Roland",reg:"grand",syllables:2},{name:"Rupert",reg:"mundane",syllables:2},{name:"Sylvester",reg:"grand",syllables:2}],
    girl: [{name:"Winnie",reg:"mundane",syllables:2},{name:"Nellie",reg:"mundane",syllables:2},{name:"Flossie",reg:"mundane",syllables:2},{name:"Betsy",reg:"mundane",syllables:1},{name:"Peggy",reg:"mundane",syllables:1},{name:"Tilly",reg:"mundane",syllables:1},{name:"Dolly",reg:"mundane",syllables:1},{name:"Maudie",reg:"mundane",syllables:2},{name:"Hattie",reg:"mundane",syllables:2},{name:"Ethel",reg:"mundane",syllables:2},{name:"Connie",reg:"mundane",syllables:2},{name:"Lottie",reg:"mundane",syllables:2},{name:"Gertie",reg:"mundane",syllables:2},{name:"Doris",reg:"mundane",syllables:2},{name:"Bessie",reg:"mundane",syllables:2},{name:"Martha",reg:"mundane",syllables:2},{name:"Nancy",reg:"mundane",syllables:1},{name:"Olive",reg:"mundane",syllables:3},{name:"Woolly",reg:"chaos",syllables:1},{name:"Millie",reg:"mundane",syllables:2},{name:"Daisy",reg:"mundane",syllables:1},{name:"Ada",reg:"mundane",syllables:2},{name:"Agatha",reg:"mundane",syllables:3},{name:"Agnes",reg:"mundane",syllables:2},{name:"Arabella",reg:"grand",syllables:4},{name:"Beatrice",reg:"grand",syllables:3},{name:"Bertha",reg:"mundane",syllables:2},{name:"Bridget",reg:"mundane",syllables:2},{name:"Clara",reg:"grand",syllables:2},{name:"Clementine",reg:"grand",syllables:4},{name:"Constance",reg:"grand",syllables:3},{name:"Cordelia",reg:"grand",syllables:3},{name:"Dora",reg:"mundane",syllables:2},{name:"Dorothy",reg:"mundane",syllables:2},{name:"Edna",reg:"mundane",syllables:2},{name:"Edith",reg:"mundane",syllables:2},{name:"Elspeth",reg:"mundane",syllables:2},{name:"Fluffy",reg:"chaos",syllables:1},{name:"Freda",reg:"mundane",syllables:2},{name:"Gertrude",reg:"mundane",syllables:3},{name:"Grace",reg:"grand",syllables:2},{name:"Harriet",reg:"mundane",syllables:2},{name:"Hilda",reg:"mundane",syllables:2},{name:"Imogen",reg:"grand",syllables:3},{name:"Marjorie",reg:"mundane",syllables:3},{name:"Matilda",reg:"mundane",syllables:3},{name:"Mildred",reg:"mundane",syllables:2},{name:"Muriel",reg:"mundane",syllables:2},{name:"Nora",reg:"mundane",syllables:2},{name:"Patience",reg:"mundane",syllables:3},{name:"Penelope",reg:"grand",syllables:4},{name:"Priscilla",reg:"mundane",syllables:3},{name:"Prudence",reg:"grand",syllables:3},{name:"Rosamund",reg:"grand",syllables:3},{name:"Rosemary",reg:"grand",syllables:3},{name:"Rowena",reg:"mundane",syllables:3},{name:"Shaggy",reg:"chaos",syllables:1},{name:"Tabitha",reg:"mundane",syllables:3},{name:"Thelma",reg:"mundane",syllables:2},{name:"Vera",reg:"mundane",syllables:2},{name:"Winifred",reg:"mundane",syllables:3},{name:"Yvonne",reg:"mundane",syllables:2}]
  },
  westie: {
    boy: [{name:"Sandy",reg:"mundane",syllables:2},{name:"Hamish",reg:"mundane",syllables:2},{name:"Angus",reg:"mundane",syllables:2},{name:"William",reg:"grand",syllables:3},{name:"Robert",reg:"grand",syllables:2},{name:"Rabbie",reg:"mundane",syllables:2},{name:"Dougal",reg:"mundane",syllables:2},{name:"Fergus",reg:"mundane",syllables:2},{name:"Callum",reg:"mundane",syllables:2},{name:"Duncan",reg:"mundane",syllables:2},{name:"Rory",reg:"mundane",syllables:2},{name:"Lachlan",reg:"mundane",syllables:2},{name:"Malcolm",reg:"mundane",syllables:2},{name:"Murray",reg:"mundane",syllables:2},{name:"Alasdair",reg:"grand",syllables:3},{name:"Archie",reg:"mundane",syllables:2},{name:"Fraser",reg:"mundane",syllables:2},{name:"Gordon",reg:"mundane",syllables:2},{name:"Jock",reg:"mundane",syllables:1},{name:"Logan",reg:"mundane",syllables:2},{name:"Ross",reg:"mundane",syllables:1},{name:"Stuart",reg:"mundane",syllables:2},{name:"Wallace",reg:"grand",syllables:2},{name:"Bruce",reg:"grand",syllables:1},{name:"Struan",reg:"mundane",syllables:2},{name:"Tavish",reg:"mundane",syllables:2},{name:"Findlay",reg:"mundane",syllables:2},{name:"Gregor",reg:"mundane",syllables:2},{name:"Haggis",reg:"food",syllables:2},{name:"Neeps",reg:"food",syllables:1},{name:"Tattie",reg:"food",syllables:2},{name:"Whisky",reg:"food",syllables:2},{name:"Broon",reg:"food",syllables:1}],
    girl: [{name:"Morag",reg:"mundane",syllables:2},{name:"Isla",reg:"mundane",syllables:2},{name:"Ailsa",reg:"mundane",syllables:2},{name:"Fiona",reg:"mundane",syllables:3},{name:"Catriona",reg:"mundane",syllables:3},{name:"Eilidh",reg:"mundane",syllables:2},{name:"Shona",reg:"mundane",syllables:2},{name:"Rhona",reg:"mundane",syllables:2},{name:"Senga",reg:"mundane",syllables:2},{name:"Elspeth",reg:"mundane",syllables:2},{name:"Iona",reg:"mundane",syllables:3},{name:"Skye",reg:"mundane",syllables:1},{name:"Lorna",reg:"mundane",syllables:2},{name:"Mhairi",reg:"mundane",syllables:2},{name:"Kirsty",reg:"mundane",syllables:2},{name:"Heather",reg:"mundane",syllables:2},{name:"Bluebell",reg:"mundane",syllables:2},{name:"Effie",reg:"mundane",syllables:2},{name:"Greer",reg:"mundane",syllables:1},{name:"Nessie",reg:"chaos",syllables:2},{name:"Bonnie",reg:"mundane",syllables:2},{name:"Maisie",reg:"mundane",syllables:2},{name:"Agnes",reg:"mundane",syllables:2},{name:"Jean",reg:"mundane",syllables:1}]
  },
  doodle: {
    boy: [{name:"Teddy",reg:"mundane",syllables:2},{name:"Bear",reg:"mundane",syllables:1},{name:"Milo",reg:"mundane",syllables:2},{name:"Louie",reg:"mundane",syllables:2},{name:"Alfie",reg:"mundane",syllables:2},{name:"Archie",reg:"mundane",syllables:2},{name:"Ollie",reg:"mundane",syllables:2},{name:"Charlie",reg:"mundane",syllables:2},{name:"Buddy",reg:"mundane",syllables:2},{name:"Biscuit",reg:"food",syllables:2},{name:"Waffle",reg:"food",syllables:2},{name:"Bagel",reg:"food",syllables:2},{name:"Rolo",reg:"food",syllables:2},{name:"Hugo",reg:"mundane",syllables:2},{name:"Reggie",reg:"mundane",syllables:2},{name:"Frankie",reg:"mundane",syllables:2},{name:"Monty",reg:"mundane",syllables:2},{name:"Barney",reg:"mundane",syllables:2},{name:"Bertie",reg:"mundane",syllables:2},{name:"Dexter",reg:"mundane",syllables:2},{name:"Ziggy",reg:"chaos",syllables:2},{name:"Rufus",reg:"mundane",syllables:2},{name:"Cookie",reg:"food",syllables:2},{name:"Marley",reg:"mundane",syllables:2},{name:"Bailey",reg:"mundane",syllables:2},{name:"Cooper",reg:"mundane",syllables:2},{name:"Toby",reg:"mundane",syllables:2},{name:"Nacho",reg:"food",syllables:2},{name:"Peanut",reg:"food",syllables:2},{name:"Pip",reg:"mundane",syllables:1}],
    girl: [{name:"Luna",reg:"mundane",syllables:2},{name:"Nala",reg:"mundane",syllables:2},{name:"Bella",reg:"mundane",syllables:2},{name:"Daisy",reg:"mundane",syllables:2},{name:"Poppy",reg:"mundane",syllables:2},{name:"Rosie",reg:"mundane",syllables:2},{name:"Willow",reg:"mundane",syllables:2},{name:"Ivy",reg:"mundane",syllables:2},{name:"Coco",reg:"mundane",syllables:2},{name:"Bonnie",reg:"mundane",syllables:2},{name:"Maisie",reg:"mundane",syllables:2},{name:"Lola",reg:"mundane",syllables:2},{name:"Millie",reg:"mundane",syllables:2},{name:"Ruby",reg:"mundane",syllables:2},{name:"Hazel",reg:"mundane",syllables:2},{name:"Nova",reg:"mundane",syllables:2},{name:"Cleo",reg:"mundane",syllables:2},{name:"Winnie",reg:"mundane",syllables:2},{name:"Pixie",reg:"chaos",syllables:2},{name:"Honey",reg:"food",syllables:2},{name:"Marnie",reg:"mundane",syllables:2},{name:"Peaches",reg:"food",syllables:2},{name:"Olive",reg:"mundane",syllables:2},{name:"Pearl",reg:"mundane",syllables:1},{name:"Dolly",reg:"mundane",syllables:2},{name:"Suki",reg:"mundane",syllables:2},{name:"Nutmeg",reg:"food",syllables:2},{name:"Gigi",reg:"mundane",syllables:2},{name:"Mabel",reg:"mundane",syllables:2}]
  },
  setter: {
    boy: [{name:"Seamus",reg:"mundane",syllables:2},{name:"Fergus",reg:"mundane",syllables:2},{name:"Rory",reg:"mundane",syllables:2},{name:"Finn",reg:"mundane",syllables:1},{name:"Cormac",reg:"mundane",syllables:2},{name:"Declan",reg:"mundane",syllables:2},{name:"Padraig",reg:"mundane",syllables:2},{name:"Cillian",reg:"mundane",syllables:2},{name:"Conor",reg:"mundane",syllables:2},{name:"Niall",reg:"mundane",syllables:1},{name:"Oisin",reg:"mundane",syllables:2},{name:"Ronan",reg:"mundane",syllables:2},{name:"Tadhg",reg:"mundane",syllables:1},{name:"Eoin",reg:"mundane",syllables:1},{name:"Donal",reg:"mundane",syllables:2},{name:"Brendan",reg:"mundane",syllables:2},{name:"Cathal",reg:"mundane",syllables:2},{name:"Fionn",reg:"mundane",syllables:1},{name:"Paddy",reg:"mundane",syllables:2},{name:"Flynn",reg:"mundane",syllables:1},{name:"Murphy",reg:"mundane",syllables:2},{name:"Rusty",reg:"chaos",syllables:2},{name:"Copper",reg:"chaos",syllables:2},{name:"Guinness",reg:"food",syllables:2},{name:"Jameson",reg:"food",syllables:3},{name:"Barry",reg:"mundane",syllables:2}],
    girl: [{name:"Niamh",reg:"mundane",syllables:1},{name:"Saoirse",reg:"mundane",syllables:2},{name:"Aoife",reg:"mundane",syllables:2},{name:"Roisin",reg:"mundane",syllables:2},{name:"Sinead",reg:"mundane",syllables:2},{name:"Maeve",reg:"mundane",syllables:1},{name:"Bridget",reg:"mundane",syllables:2},{name:"Orla",reg:"mundane",syllables:2},{name:"Clodagh",reg:"mundane",syllables:2},{name:"Siobhan",reg:"mundane",syllables:2},{name:"Grainne",reg:"mundane",syllables:2},{name:"Nuala",reg:"mundane",syllables:2},{name:"Deirdre",reg:"mundane",syllables:2},{name:"Erin",reg:"mundane",syllables:2},{name:"Molly",reg:"mundane",syllables:2},{name:"Kathleen",reg:"mundane",syllables:2},{name:"Colleen",reg:"mundane",syllables:2},{name:"Shannon",reg:"mundane",syllables:2},{name:"Cara",reg:"mundane",syllables:2},{name:"Aisling",reg:"mundane",syllables:2},{name:"Fiadh",reg:"mundane",syllables:1},{name:"Ginger",reg:"mundane",syllables:2},{name:"Scarlett",reg:"mundane",syllables:2},{name:"Poppy",reg:"mundane",syllables:2}]
  },
  german: {
    boy: [{name:"Heinrich",reg:"grand",syllables:2},{name:"Wolfgang",reg:"grand",syllables:2},{name:"Dieter",reg:"mundane",syllables:2},{name:"Klaus",reg:"mundane",syllables:1},{name:"Reinhard",reg:"grand",syllables:2},{name:"Manfred",reg:"mundane",syllables:2},{name:"Siegfried",reg:"grand",syllables:2},{name:"Konrad",reg:"grand",syllables:2},{name:"Ludwig",reg:"grand",syllables:2},{name:"Friedrich",reg:"grand",syllables:2},{name:"Maximilian",reg:"grand",syllables:5},{name:"Amadeus",reg:"grand",syllables:4},{name:"Beethoven",reg:"grand",syllables:3},{name:"Mozart",reg:"grand",syllables:2},{name:"Panzer",reg:"grand",syllables:2},{name:"Patton",reg:"grand",syllables:2},{name:"Pershing",reg:"grand",syllables:2},{name:"Prussian",reg:"grand",syllables:2},{name:"Praetorian",reg:"grand",syllables:2},{name:"Paladin",reg:"grand",syllables:2},{name:"Hans",reg:"mundane",syllables:2},{name:"Fritz",reg:"mundane",syllables:2},{name:"Heinz",reg:"mundane",syllables:2},{name:"Günther",reg:"mundane",syllables:2},{name:"Helmut",reg:"mundane",syllables:2},{name:"Horst",reg:"mundane",syllables:2},{name:"Jürgen",reg:"mundane",syllables:2},{name:"Bernd",reg:"mundane",syllables:2},{name:"Rolf",reg:"mundane",syllables:2},{name:"Uwe",reg:"mundane",syllables:2},{name:"Gerd",reg:"mundane",syllables:2},{name:"Detlef",reg:"mundane",syllables:2},{name:"Gottfried",reg:"mundane",syllables:2},{name:"Gerhard",reg:"mundane",syllables:2},{name:"Waldemar",reg:"mundane",syllables:2},{name:"Wilhelm",reg:"mundane",syllables:2},{name:"Ernst",reg:"mundane",syllables:2},{name:"Erich",reg:"mundane",syllables:2},{name:"Bruno",reg:"mundane",syllables:2},{name:"Herbert",reg:"mundane",syllables:2},{name:"Hubert",reg:"mundane",syllables:2},{name:"Norbert",reg:"mundane",syllables:2},{name:"Eberhard",reg:"mundane",syllables:2},{name:"Eckhard",reg:"mundane",syllables:2},{name:"Reinhold",reg:"mundane",syllables:2},{name:"Gerhardt",reg:"mundane",syllables:2},{name:"Hasso",reg:"mundane",syllables:2},{name:"Hartmut",reg:"mundane",syllables:2},{name:"Volkmar",reg:"mundane",syllables:2},{name:"Volkbert",reg:"mundane",syllables:2},{name:"Albrecht",reg:"mundane",syllables:2},{name:"Ruprecht",reg:"mundane",syllables:2},{name:"Rüdiger",reg:"mundane",syllables:2},{name:"Burkhard",reg:"mundane",syllables:2},{name:"Engelbert",reg:"mundane",syllables:2},{name:"Adalbert",reg:"mundane",syllables:2},{name:"Wulfhard",reg:"mundane",syllables:2},{name:"Baldur",reg:"mundane",syllables:2},{name:"Lothar",reg:"mundane",syllables:2},{name:"Knut",reg:"mundane",syllables:2},{name:"Kurt",reg:"mundane",syllables:2},{name:"Egon",reg:"mundane",syllables:2},{name:"Kaspar",reg:"mundane",syllables:2},{name:"Leopold",reg:"mundane",syllables:2},{name:"August",reg:"mundane",syllables:2},{name:"Gustav",reg:"mundane",syllables:2},{name:"Dietrich",reg:"mundane",syllables:2},{name:"Ulrich",reg:"mundane",syllables:2},{name:"Werner",reg:"mundane",syllables:2},{name:"Wolfram",reg:"mundane",syllables:2},{name:"Wendelin",reg:"mundane",syllables:2},{name:"Wigbert",reg:"mundane",syllables:2},{name:"Bodo",reg:"mundane",syllables:2},{name:"Hinnerk",reg:"mundane",syllables:2},{name:"Hinrich",reg:"mundane",syllables:2},{name:"Peer",reg:"mundane",syllables:2},{name:"Till",reg:"mundane",syllables:2},{name:"Torsten",reg:"mundane",syllables:2},{name:"Anselm",reg:"mundane",syllables:2},{name:"Armin",reg:"mundane",syllables:2},{name:"Hagen",reg:"mundane",syllables:2},{name:"Heiko",reg:"mundane",syllables:2},{name:"Jochen",reg:"mundane",syllables:2},{name:"Ludger",reg:"mundane",syllables:2},{name:"Rainer",reg:"mundane",syllables:2},{name:"Sönke",reg:"mundane",syllables:2},{name:"Veit",reg:"mundane",syllables:2},{name:"Wenzel",reg:"mundane",syllables:2},{name:"Xaver",reg:"mundane",syllables:2},{name:"Alois",reg:"mundane",syllables:2},{name:"Alfons",reg:"mundane",syllables:2},{name:"Sepp",reg:"mundane",syllables:2},{name:"Franzl",reg:"mundane",syllables:2},{name:"Hansi",reg:"mundane",syllables:2},{name:"Heinzi",reg:"mundane",syllables:2},{name:"Klausi",reg:"mundane",syllables:2},{name:"Günni",reg:"mundane",syllables:2},{name:"Willi",reg:"mundane",syllables:2},{name:"Rudi",reg:"mundane",syllables:2},{name:"Udo",reg:"mundane",syllables:2},{name:"Otfried",reg:"mundane",syllables:2},{name:"Ottokar",reg:"mundane",syllables:2},{name:"Tassilo",reg:"mundane",syllables:2},{name:"Quirin",reg:"mundane",syllables:2},{name:"Korbinian",reg:"mundane",syllables:2},{name:"Nepomuk",reg:"mundane",syllables:2},{name:"Ignaz",reg:"mundane",syllables:2},{name:"Pankraz",reg:"mundane",syllables:2},{name:"Bonifaz",reg:"mundane",syllables:2}],
    girl: [{name:"Hildegard",reg:"grand",syllables:2},{name:"Brunhilde",reg:"grand",syllables:2},{name:"Lieselotte",reg:"grand",syllables:2},{name:"Gertrude",reg:"grand",syllables:2},{name:"Ingeborg",reg:"grand",syllables:2},{name:"Elfriede",reg:"grand",syllables:2},{name:"Mathilde",reg:"grand",syllables:2},{name:"Hedwig",reg:"grand",syllables:2},{name:"Mechthild",reg:"grand",syllables:2},{name:"Hannelore",reg:"grand",syllables:2},{name:"Hildegunde",reg:"grand",syllables:2},{name:"Walburga",reg:"grand",syllables:2},{name:"Kunigunde",reg:"grand",syllables:2},{name:"Liselotte",reg:"grand",syllables:2},{name:"Margarethe",reg:"grand",syllables:2},{name:"Ottilie",reg:"grand",syllables:2},{name:"Rosalinde",reg:"grand",syllables:2},{name:"Sieglinde",reg:"grand",syllables:2},{name:"Ursula",reg:"grand",syllables:2},{name:"Waltraud",reg:"grand",syllables:2},{name:"Friederike",reg:"grand",syllables:2},{name:"Gerhilde",reg:"grand",syllables:2},{name:"Ilsebill",reg:"grand",syllables:2},{name:"Klothilde",reg:"grand",syllables:2},{name:"Leokadia",reg:"grand",syllables:2},{name:"Notburga",reg:"grand",syllables:2},{name:"Petronella",reg:"grand",syllables:2},{name:"Richardis",reg:"grand",syllables:2},{name:"Traudel",reg:"grand",syllables:2},{name:"Trudel",reg:"grand",syllables:2},{name:"Therese",reg:"grand",syllables:2},{name:"Thekla",reg:"grand",syllables:2},{name:"Reserl",reg:"grand",syllables:2},{name:"Lieserl",reg:"grand",syllables:2},{name:"Friedl",reg:"grand",syllables:2},{name:"Christl",reg:"grand",syllables:2},{name:"Annerl",reg:"grand",syllables:2},{name:"Zenzi",reg:"grand",syllables:2},{name:"Vroni",reg:"grand",syllables:2},{name:"Seppie",reg:"grand",syllables:2},{name:"Leni",reg:"grand",syllables:2},{name:"Gretel",reg:"grand",syllables:2},{name:"Helga",reg:"grand",syllables:2},{name:"Hilde",reg:"grand",syllables:2},{name:"Inge",reg:"grand",syllables:2},{name:"Ilse",reg:"grand",syllables:2},{name:"Klara",reg:"grand",syllables:2},{name:"Lotte",reg:"grand",syllables:2},{name:"Marga",reg:"grand",syllables:2},{name:"Nanni",reg:"grand",syllables:2},{name:"Renate",reg:"grand",syllables:2},{name:"Rosa",reg:"grand",syllables:2},{name:"Susi",reg:"grand",syllables:2},{name:"Ulla",reg:"grand",syllables:2},{name:"Ursel",reg:"grand",syllables:2},{name:"Kriemhild",reg:"grand",syllables:2},{name:"Gudrun",reg:"grand",syllables:2},{name:"Gerhild",reg:"grand",syllables:2},{name:"Swanhild",reg:"grand",syllables:2},{name:"Hildrun",reg:"grand",syllables:2},{name:"Walpurga",reg:"grand",syllables:2},{name:"Radegund",reg:"grand",syllables:2},{name:"Clothilde",reg:"grand",syllables:2},{name:"Bertha",reg:"grand",syllables:2},{name:"Stefanie",reg:"grand",syllables:2},{name:"Franziska",reg:"grand",syllables:2},{name:"Veronika",reg:"grand",syllables:2},{name:"Katharina",reg:"grand",syllables:2},{name:"Theresia",reg:"grand",syllables:2},{name:"Josefine",reg:"grand",syllables:2},{name:"Leopoldine",reg:"grand",syllables:2},{name:"Maximiliane",reg:"grand",syllables:2},{name:"Wilhelmine",reg:"grand",syllables:2},{name:"Karolina",reg:"grand",syllables:2},{name:"Antoinette",reg:"grand",syllables:2},{name:"Trixi",reg:"grand",syllables:2},{name:"Traudl",reg:"grand",syllables:2},{name:"Valkyria",reg:"grand",syllables:2},{name:"Brunhilda",reg:"grand",syllables:2},{name:"Gertraud",reg:"grand",syllables:2},{name:"Freya",reg:"grand",syllables:2},{name:"Sigrid",reg:"grand",syllables:2},{name:"Astrid",reg:"grand",syllables:2},{name:"Ragnhild",reg:"grand",syllables:2},{name:"Thyra",reg:"grand",syllables:2},{name:"Gunhild",reg:"grand",syllables:2},{name:"Bergljot",reg:"grand",syllables:2},{name:"Hilda",reg:"grand",syllables:2},{name:"Ingrid",reg:"grand",syllables:2},{name:"Sigrun",reg:"grand",syllables:2},{name:"Gerd",reg:"grand",syllables:2},{name:"Gudrid",reg:"grand",syllables:2},{name:"Hertha",reg:"grand",syllables:2},{name:"Nanna",reg:"grand",syllables:2},{name:"Runa",reg:"grand",syllables:2},{name:"Svea",reg:"grand",syllables:2},{name:"Booboo",reg:"grand",syllables:2},{name:"Mimi",reg:"grand",syllables:2},{name:"Lulu",reg:"grand",syllables:2}]
},
  spaniel: {
    boy: [{name:"Archibald",reg:"grand",syllables:3},{name:"Wellington",reg:"grand",syllables:3},{name:"Rupert",reg:"grand",syllables:2},{name:"Cornelius",reg:"grand",syllables:4},{name:"Peregrine",reg:"grand",syllables:3},{name:"Humphrey",reg:"grand",syllables:2},{name:"Montgomery",reg:"grand",syllables:3},{name:"Algernon",reg:"grand",syllables:3},{name:"Bartholomew",reg:"grand",syllables:4},{name:"Reginald",reg:"grand",syllables:3},{name:"Auberon",reg:"grand",syllables:3},{name:"Lysander",reg:"grand",syllables:3},{name:"Skipper",reg:"chaos",syllables:2},{name:"Fetcher",reg:"chaos",syllables:2},{name:"Wagger",reg:"chaos",syllables:2},{name:"Wags",reg:"chaos",syllables:2},{name:"Splasher",reg:"chaos",syllables:2},{name:"Dasher",reg:"chaos",syllables:2},{name:"Scamper",reg:"chaos",syllables:2},{name:"Bouncer",reg:"chaos",syllables:2},{name:"Jumper",reg:"chaos",syllables:2},{name:"Pouncer",reg:"chaos",syllables:2},{name:"Rusher",reg:"chaos",syllables:2},{name:"Tumbler",reg:"chaos",syllables:2},{name:"Flipper",reg:"chaos",syllables:2},{name:"Dipper",reg:"chaos",syllables:2},{name:"Paddler",reg:"chaos",syllables:2},{name:"Scout",reg:"chaos",syllables:2},{name:"Tracker",reg:"chaos",syllables:2},{name:"Scooper",reg:"chaos",syllables:2},{name:"Springer",reg:"chaos",syllables:2},{name:"Armand",reg:"grand",syllables:2},{name:"Arnaud",reg:"grand",syllables:2},{name:"Auguste",reg:"grand",syllables:2},{name:"Bertrand",reg:"grand",syllables:2},{name:"Edmond",reg:"grand",syllables:2},{name:"Édouard",reg:"grand",syllables:2},{name:"Ferdinand",reg:"grand",syllables:2},{name:"Florent",reg:"grand",syllables:2},{name:"Frédéric",reg:"grand",syllables:2},{name:"Germain",reg:"grand",syllables:2},{name:"Gilbert",reg:"grand",syllables:2},{name:"Guillaume",reg:"grand",syllables:2},{name:"Hubert",reg:"grand",syllables:2},{name:"Hugues",reg:"grand",syllables:2},{name:"Joachim",reg:"grand",syllables:2},{name:"Léonard",reg:"grand",syllables:2},{name:"Marius",reg:"grand",syllables:2},{name:"Maurice",reg:"grand",syllables:2},{name:"Norbert",reg:"grand",syllables:2},{name:"Olivier",reg:"grand",syllables:2},{name:"Patrice",reg:"grand",syllables:2},{name:"Philippe",reg:"grand",syllables:2},{name:"Renaud",reg:"grand",syllables:2},{name:"Rodolphe",reg:"grand",syllables:2},{name:"Roland",reg:"grand",syllables:2},{name:"Sébastien",reg:"grand",syllables:2},{name:"Silvestre",reg:"grand",syllables:2},{name:"Urbain",reg:"grand",syllables:2},{name:"Valère",reg:"grand",syllables:2},{name:"Victor",reg:"grand",syllables:2},{name:"Xavier",reg:"grand",syllables:2},{name:"Cyrus",reg:"grand",syllables:2},{name:"Darius",reg:"grand",syllables:3},{name:"Plato",reg:"grand",syllables:2},{name:"Prometheus",reg:"grand",syllables:4},{name:"Pythagoras",reg:"grand",syllables:4},{name:"Socrates",reg:"grand",syllables:3},{name:"Napoleon",reg:"grand",syllables:4},{name:"Pascal",reg:"grand",syllables:2},{name:"Newton",reg:"grand",syllables:2},{name:"Darwin",reg:"grand",syllables:2},{name:"Einstein",reg:"grand",syllables:3}],
    girl: [{name:"Anna",reg:"grand",syllables:2},{name:"Athena",reg:"grand",syllables:3},{name:"Beatrice",reg:"grand",syllables:3},{name:"Bonnie",reg:"mundane",syllables:2},{name:"Bramble",reg:"nature",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Calypso",reg:"grand",syllables:2},{name:"Clover",reg:"nature",syllables:2},{name:"Carina",reg:"grand",syllables:3},{name:"Cassandra",reg:"grand",syllables:3},{name:"Circe",reg:"grand",syllables:2},{name:"Clementine",reg:"grand",syllables:4},{name:"Cleopatra",reg:"grand",syllables:3},{name:"Cordelia",reg:"grand",syllables:3},{name:"Daisy",reg:"nature",syllables:1},{name:"Dorothy",reg:"nature",syllables:2},{name:"Fauna",reg:"grand",syllables:2},{name:"Frederica",reg:"grand",syllables:4},{name:"Gaia",reg:"grand",syllables:1},{name:"Georgiana",reg:"grand",syllables:3},{name:"Grace",reg:"nature",syllables:2},{name:"Hecate",reg:"grand",syllables:3},{name:"Henrietta",reg:"grand",syllables:3},{name:"Lily",reg:"nature",syllables:1},{name:"Lucy",reg:"mundane",syllables:1},{name:"Lottie",reg:"mundane",syllables:2},{name:"Mabel",reg:"mundane",syllables:2},{name:"Maisie",reg:"mundane",syllables:2},{name:"Millicent",reg:"grand",syllables:3},{name:"Mimi",reg:"mundane",syllables:2},{name:"Molly",reg:"mundane",syllables:1},{name:"Nell",reg:"nature",syllables:1},{name:"Persephone",reg:"grand",syllables:4},{name:"Phoebe",reg:"grand",syllables:2},{name:"Poppy",reg:"nature",syllables:1},{name:"Penny",reg:"mundane",syllables:1},{name:"Rhea",reg:"grand",syllables:1},{name:"Ruby",reg:"nature",syllables:1},{name:"Sappho",reg:"grand",syllables:2},{name:"Seraphina",reg:"grand",syllables:4},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Sophia",reg:"grand",syllables:2},{name:"Cookie",reg:"food",syllables:2},{name:"Butterscotch",reg:"food",syllables:3},{name:"Bella",reg:"grand",syllables:2},{name:"Winnie",reg:"mundane",syllables:2},{name:"Lady",reg:"grand",syllables:1},{name:"Stella",reg:"grand",syllables:2},{name:"Coco",reg:"baby",syllables:2},{name:"Lola",reg:"mundane",syllables:2},{name:"Rosie",reg:"nature",syllables:2},{name:"Sadie",reg:"mundane",syllables:2},{name:"Ginny",reg:"mundane",syllables:1},{name:"Judy",reg:"mundane",syllables:1},{name:"Dori",reg:"mundane",syllables:2},{name:"Pebbles",reg:"nature",syllables:2}]
},
  character: {
    boy: [{name:"Napoleon",reg:"grand",syllables:4},{name:"Rasputin",reg:"grand",syllables:3},{name:"Churchill",reg:"grand",syllables:2},{name:"Waldo",reg:"mundane",syllables:2},{name:"Homer",reg:"mundane",syllables:2},{name:"Gus",reg:"mundane",syllables:1},{name:"Alf",reg:"mundane",syllables:1},{name:"Booboo",reg:"baby",syllables:2},{name:"Noo-Noo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},{name:"Smooshface",reg:"baby",syllables:2},{name:"Goober",reg:"chaos",syllables:2},{name:"Doodle",reg:"chaos",syllables:2},{name:"Gizmo",reg:"chaos",syllables:2},{name:"Spot",reg:"chaos",syllables:2},{name:"Rex",reg:"chaos",syllables:2},{name:"Fido",reg:"chaos",syllables:2},{name:"Rover",reg:"chaos",syllables:2},{name:"Patch",reg:"chaos",syllables:2},{name:"Daffy",reg:"chaos",syllables:2},{name:"Droopy",reg:"chaos",syllables:2},{name:"Foghorn",reg:"chaos",syllables:2},{name:"Porky",reg:"chaos",syllables:2},{name:"Taz",reg:"chaos",syllables:2},{name:"Mugsy",reg:"chaos",syllables:2},{name:"Brain",reg:"chaos",syllables:2},{name:"Spook",reg:"chaos",syllables:2},{name:"Muttley",reg:"chaos",syllables:2},{name:"Chopper",reg:"chaos",syllables:2},{name:"Scrappy",reg:"chaos",syllables:2},{name:"Dippy",reg:"chaos",syllables:2},{name:"Loony",reg:"chaos",syllables:2},{name:"Boink",reg:"chaos",syllables:2},{name:"Boffo",reg:"chaos",syllables:2},{name:"Nifty",reg:"chaos",syllables:2},{name:"Zowie",reg:"chaos",syllables:2},{name:"Wiley",reg:"chaos",syllables:2},{name:"Augie",reg:"chaos",syllables:2},{name:"Henery",reg:"chaos",syllables:2},{name:"Heckle",reg:"chaos",syllables:2},{name:"Jeckle",reg:"chaos",syllables:2},{name:"Woody",reg:"chaos",syllables:2},{name:"Jinks",reg:"chaos",syllables:2},{name:"Ruff",reg:"chaos",syllables:2},{name:"Reddy",reg:"chaos",syllables:2},{name:"Pooch",reg:"chaos",syllables:2},{name:"Bugsy",reg:"chaos",syllables:2},{name:"Cheepy",reg:"chaos",syllables:2},{name:"Peppo",reg:"chaos",syllables:2},{name:"Brutus",reg:"chaos",syllables:2},{name:"Poppet",reg:"chaos",syllables:2},{name:"Mighty",reg:"chaos",syllables:2},{name:"Bumblywink",reg:"chaos",syllables:2},{name:"Snaggleboss",reg:"chaos",syllables:2},{name:"Dastard",reg:"chaos",syllables:2},{name:"Mazilla",reg:"chaos",syllables:2},{name:"Ricochet",reg:"chaos",syllables:2},{name:"Yakker",reg:"chaos",syllables:2},{name:"Quickdraw",reg:"chaos",syllables:2},{name:"Topdog",reg:"chaos",syllables:2},{name:"Silvester",reg:"chaos",syllables:2},{name:"Elmo",reg:"chaos",syllables:2},{name:"Hootenanny",reg:"chaos",syllables:2},{name:"Snickerdoodle",reg:"chaos",syllables:2},{name:"Skedaddle",reg:"chaos",syllables:2},{name:"Benny",reg:"chaos",syllables:2},{name:"Chumley",reg:"chaos",syllables:2},{name:"Huckleberry",reg:"chaos",syllables:2},{name:"Peabody",reg:"chaos",syllables:2},{name:"Sherman",reg:"chaos",syllables:2},{name:"Wimpy",reg:"chaos",syllables:2},{name:"Wiggles",reg:"chaos",syllables:2},{name:"Jitters",reg:"chaos",syllables:2},{name:"Boink",reg:"chaos",syllables:2},{name:"Bungle",reg:"chaos",syllables:2},{name:"Bingo",reg:"chaos",syllables:2},{name:"Snoopy",reg:"chaos",syllables:2},{name:"Scooby",reg:"chaos",syllables:2},{name:"Pluto",reg:"chaos",syllables:2},{name:"Goofy",reg:"chaos",syllables:2},{name:"Bonzo",reg:"chaos",syllables:2},{name:"Clovis",reg:"grand",syllables:2},{name:"Gustave",reg:"grand",syllables:2},{name:"Isidore",reg:"grand",syllables:2},{name:"Narcisse",reg:"grand",syllables:2},{name:"Octave",reg:"grand",syllables:2},{name:"Prosper",reg:"grand",syllables:2},{name:"Modeste",reg:"grand",syllables:2},{name:"Pigeon",reg:"chaos",syllables:2},{name:"Goose",reg:"chaos",syllables:2},{name:"Weasel",reg:"chaos",syllables:2},{name:"Ferret",reg:"chaos",syllables:2},{name:"Otter",reg:"chaos",syllables:2},{name:"Lobster",reg:"chaos",syllables:2},{name:"Prawn",reg:"chaos",syllables:2},{name:"Sprat",reg:"chaos",syllables:2},{name:"Barnacle",reg:"chaos",syllables:2},{name:"Scrumpy",reg:"chaos",syllables:2},{name:"Nipper",reg:"chaos",syllables:2},{name:"Yapper",reg:"chaos",syllables:2},{name:"Snorter",reg:"chaos",syllables:2},{name:"Wriggler",reg:"chaos",syllables:2},{name:"Wobbler",reg:"chaos",syllables:2},{name:"Tumbler",reg:"chaos",syllables:2},{name:"Pogo",reg:"chaos",syllables:2},{name:"Zippy",reg:"chaos",syllables:2},{name:"Whizz",reg:"chaos",syllables:2},{name:"Radish",reg:"food",syllables:2},{name:"Cabbage",reg:"food",syllables:2},{name:"Turnip",reg:"food",syllables:2},{name:"Parsnip",reg:"food",syllables:2},{name:"Lentil",reg:"food",syllables:2},{name:"Chickpea",reg:"food",syllables:2},{name:"Pistachio",reg:"food",syllables:2},{name:"Hazelnut",reg:"food",syllables:2},{name:"Gumball",reg:"food",syllables:2},{name:"Smartie",reg:"food",syllables:2},{name:"Crunchie",reg:"food",syllables:2},{name:"Oreo",reg:"food",syllables:2},{name:"Cheerio",reg:"food",syllables:2},{name:"Granola",reg:"food",syllables:2},{name:"Porridge",reg:"food",syllables:2},{name:"Strudel",reg:"food",syllables:2},{name:"Cobbler",reg:"food",syllables:2},{name:"Pretzel",reg:"food",syllables:2},{name:"Bagel",reg:"food",syllables:2},{name:"Molasses",reg:"food",syllables:2},{name:"Marmalade",reg:"food",syllables:2},{name:"Jammy",reg:"food",syllables:2},{name:"Pepper",reg:"food",syllables:2},{name:"Paprika",reg:"food",syllables:2},{name:"Nutmeg",reg:"food",syllables:2},{name:"Whiskers",reg:"baby",syllables:2},{name:"Taco",reg:"food",syllables:2},{name:"Nacho",reg:"food",syllables:2},{name:"Burrito",reg:"food",syllables:3},{name:"Mustard",reg:"food",syllables:2},{name:"Wham",reg:"food",syllables:1},{name:"Dibdab",reg:"food",syllables:2},{name:"BlackJack",reg:"food",syllables:2},{name:"ColaCube",reg:"food",syllables:3},{name:"Drumstick",reg:"food",syllables:2},{name:"Chewitt",reg:"food",syllables:2},{name:"Chewie",reg:"food",syllables:1},{name:"Wagonwheel",reg:"food",syllables:3},{name:"Aero",reg:"food",syllables:2},{name:"Bounty",reg:"food",syllables:2},{name:"Milkyway",reg:"food",syllables:3},{name:"Minstrel",reg:"food",syllables:2},{name:"Revel",reg:"food",syllables:2}],
    girl: [{name:"Booboo",reg:"baby",syllables:2},{name:"Tutu",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Fifi",reg:"baby",syllables:2},{name:"Lulu",reg:"baby",syllables:2},{name:"Gigi",reg:"baby",syllables:2},{name:"Coco",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Squishface",reg:"baby",syllables:2},{name:"Jellybean",reg:"food",syllables:3},{name:"Cupcake",reg:"food",syllables:2},{name:"Candyfloss",reg:"food",syllables:3},{name:"Wibble",reg:"chaos",syllables:2},{name:"Pixie",reg:"chaos",syllables:2},{name:"Dixie",reg:"chaos",syllables:2},{name:"Mopsy",reg:"chaos",syllables:2},{name:"Fizzle",reg:"chaos",syllables:2},{name:"Nibbles",reg:"chaos",syllables:2},{name:"Tuffy",reg:"chaos",syllables:2},{name:"Toodle",reg:"chaos",syllables:2},{name:"Wizzle",reg:"chaos",syllables:2},{name:"Pipsy",reg:"chaos",syllables:2},{name:"Penelope",reg:"chaos",syllables:2},{name:"Dizzy",reg:"chaos",syllables:2},{name:"Topsy",reg:"chaos",syllables:2},{name:"Whiskers",reg:"baby",syllables:2},{name:"Baguette",reg:"food",syllables:3},{name:"Bijou",reg:"food",syllables:2},{name:"Bonbon",reg:"food",syllables:2},{name:"Brie",reg:"food",syllables:1},{name:"Chanel",reg:"mundane",syllables:2},{name:"Chloe",reg:"mundane",syllables:1},{name:"Eclair",reg:"food",syllables:2},{name:"Jolie",reg:"mundane",syllables:2},{name:"Madeleine",reg:"mundane",syllables:4},{name:"Minette",reg:"mundane",syllables:3},{name:"Mochi",reg:"baby",syllables:2},{name:"Noisette",reg:"food",syllables:3},{name:"Peaches",reg:"baby",syllables:2},{name:"Petite",reg:"food",syllables:3},{name:"Princess",reg:"mundane",syllables:2},{name:"Queenie",reg:"baby",syllables:2},{name:"Ruffles",reg:"baby",syllables:2},{name:"Snorkel",reg:"baby",syllables:2},{name:"Squashy",reg:"baby",syllables:1},{name:"Squishy",reg:"baby",syllables:1},{name:"Stumpy",reg:"baby",syllables:1},{name:"Twiggy",reg:"mundane",syllables:1},{name:"Wobbles",reg:"baby",syllables:2},{name:"Wrinkles",reg:"baby",syllables:2},{name:"Taco",reg:"food",syllables:2},{name:"Nacho",reg:"food",syllables:2},{name:"Burrito",reg:"food",syllables:3},{name:"Mustard",reg:"food",syllables:2},{name:"Wham",reg:"food",syllables:1},{name:"Dibdab",reg:"food",syllables:2},{name:"BlackJack",reg:"food",syllables:2},{name:"ColaCube",reg:"food",syllables:3},{name:"Drumstick",reg:"food",syllables:2},{name:"Chewitt",reg:"food",syllables:2},{name:"Chewie",reg:"food",syllables:1},{name:"Wagonwheel",reg:"food",syllables:3},{name:"Aero",reg:"food",syllables:2},{name:"Bounty",reg:"food",syllables:2},{name:"Milkyway",reg:"food",syllables:3},{name:"Minstrel",reg:"food",syllables:2},{name:"Revel",reg:"food",syllables:2}]
},
  boston: {
    boy: [
    // Gilded Age robber barons / politicians
    {name:"Cornelius",reg:"grand",syllables:4},{name:"Vanderbilt",reg:"grand",syllables:3},
    {name:"Tammany",reg:"grand",syllables:3},{name:"Rockefeller",reg:"grand",syllables:4},
    {name:"Carnegie",reg:"grand",syllables:3},
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
    {name:"Spark",reg:"chaos",syllables:1},{name:"Grit",reg:"chaos",syllables:1}
  ],
    girl: [{name:"Bessie",reg:"mundane",syllables:2},{name:"Clementine",reg:"grand",syllables:4},{name:"Constance",reg:"grand",syllables:3},{name:"Cordelia",reg:"grand",syllables:3},{name:"Dixie",reg:"mundane",syllables:2},{name:"Dollie",reg:"mundane",syllables:2},{name:"Evangeline",reg:"grand",syllables:5},{name:"Florrie",reg:"mundane",syllables:2},{name:"Flossie",reg:"mundane",syllables:2},{name:"Gracie",reg:"mundane",syllables:2},{name:"Hildegarde",reg:"grand",syllables:4},{name:"Josephine",reg:"grand",syllables:4},{name:"Maisie",reg:"mundane",syllables:2},{name:"Mamie",reg:"mundane",syllables:2},{name:"Moxie",reg:"mundane",syllables:2},{name:"Nellie",reg:"mundane",syllables:2},{name:"Peaches",reg:"food",syllables:2},{name:"Sadie",reg:"mundane",syllables:2},{name:"Temperance",reg:"grand",syllables:4},{name:"Trixie",reg:"mundane",syllables:2},{name:"Kathleen",reg:"mundane",syllables:2},{name:"Winnie",reg:"mundane",syllables:2},{name:"Brenda",reg:"mundane",syllables:2},{name:"Priscilla",reg:"grand",syllables:3},{name:"Franny",reg:"mundane",syllables:1},{name:"Debbie",reg:"mundane",syllables:2},{name:"Eleanor",reg:"grand",syllables:3},{name:"Mabel",reg:"mundane",syllables:2},{name:"Doris",reg:"mundane",syllables:2},{name:"Edie",reg:"mundane",syllables:2},{name:"Elsie",reg:"mundane",syllables:2},{name:"Ethel",reg:"mundane",syllables:2},{name:"Hilda",reg:"mundane",syllables:2},{name:"Maudie",reg:"mundane",syllables:2},{name:"Peggy",reg:"mundane",syllables:1},{name:"Nancy",reg:"mundane",syllables:1},{name:"Dotty",reg:"mundane",syllables:1},{name:"Dolly",reg:"mundane",syllables:1},{name:"Rita",reg:"mundane",syllables:2},{name:"Vera",reg:"mundane",syllables:2},{name:"Jean",reg:"mundane",syllables:1},{name:"Joan",reg:"mundane",syllables:1},{name:"Joyce",reg:"mundane",syllables:2},{name:"Marjorie",reg:"grand",syllables:3},{name:"Muriel",reg:"grand",syllables:2},{name:"Audrey",reg:"grand",syllables:2},{name:"Edith",reg:"grand",syllables:2},{name:"Agnes",reg:"grand",syllables:2},{name:"Nora",reg:"mundane",syllables:2},{name:"Hetty",reg:"mundane",syllables:1},{name:"Gertie",reg:"mundane",syllables:2}]
},
  corgi: {
    boy: [{name:"Dai",reg:"grand",syllables:2},{name:"Huw",reg:"grand",syllables:2},{name:"Llew",reg:"grand",syllables:2},{name:"Rhys",reg:"grand",syllables:2},{name:"Bryn",reg:"grand",syllables:2},{name:"Glyn",reg:"grand",syllables:2},{name:"Gwyn",reg:"grand",syllables:2},{name:"Twm",reg:"grand",syllables:2},{name:"Wil",reg:"grand",syllables:2},{name:"Dafydd",reg:"grand",syllables:2},{name:"Dewi",reg:"grand",syllables:2},{name:"Denzil",reg:"grand",syllables:2},{name:"Guto",reg:"grand",syllables:2},{name:"Iolo",reg:"grand",syllables:2},{name:"Iwan",reg:"grand",syllables:2},{name:"Ieuan",reg:"grand",syllables:2},{name:"Iestyn",reg:"grand",syllables:2},{name:"Ifan",reg:"grand",syllables:2},{name:"Hywel",reg:"grand",syllables:2},{name:"Rhodri",reg:"grand",syllables:2},{name:"Gethin",reg:"grand",syllables:2},{name:"Gruff",reg:"grand",syllables:2},{name:"Owain",reg:"grand",syllables:2},{name:"Osian",reg:"grand",syllables:2},{name:"Meurig",reg:"grand",syllables:2},{name:"Mael",reg:"grand",syllables:2},{name:"Emrys",reg:"grand",syllables:2},{name:"Emyr",reg:"grand",syllables:2},{name:"Eurig",reg:"grand",syllables:2},{name:"Elfed",reg:"grand",syllables:2},{name:"Tudur",reg:"grand",syllables:2},{name:"Trefor",reg:"grand",syllables:2},{name:"Arwel",reg:"grand",syllables:2},{name:"Alun",reg:"grand",syllables:2},{name:"Geraint",reg:"grand",syllables:2},{name:"Gareth",reg:"grand",syllables:2},{name:"Idris",reg:"grand",syllables:2},{name:"Morgan",reg:"grand",syllables:2},{name:"Rhun",reg:"grand",syllables:2},{name:"Selwyn",reg:"grand",syllables:2},{name:"Wyn",reg:"grand",syllables:2},{name:"Wynford",reg:"grand",syllables:2},{name:"Carwyn",reg:"grand",syllables:2},{name:"Gwion",reg:"grand",syllables:2},{name:"Harri",reg:"grand",syllables:2},{name:"Llion",reg:"grand",syllables:2},{name:"Pedr",reg:"grand",syllables:2},{name:"Pryderi",reg:"grand",syllables:2},{name:"Sion",reg:"grand",syllables:2},{name:"Steffan",reg:"grand",syllables:2},{name:"Tomos",reg:"grand",syllables:2},{name:"Vaughan",reg:"grand",syllables:2},{name:"Gruffudd",reg:"grand",syllables:2},{name:"Gwilym",reg:"grand",syllables:2},{name:"Caradog",reg:"grand",syllables:2},{name:"Cadwaladr",reg:"grand",syllables:2},{name:"Cadwallon",reg:"grand",syllables:2},{name:"Llewelyn",reg:"grand",syllables:2},{name:"Llywarch",reg:"grand",syllables:2},{name:"Llyr",reg:"grand",syllables:2},{name:"Madoc",reg:"grand",syllables:2},{name:"Mabon",reg:"grand",syllables:2},{name:"Aneurin",reg:"grand",syllables:2},{name:"Dyfrig",reg:"grand",syllables:2},{name:"Talfryn",reg:"grand",syllables:2},{name:"Bleddyn",reg:"grand",syllables:2},{name:"Bedwyr",reg:"grand",syllables:2},{name:"Cledwyn",reg:"grand",syllables:2},{name:"Islwyn",reg:"grand",syllables:2},{name:"Ifor",reg:"grand",syllables:2},{name:"Taliesin",reg:"grand",syllables:2},{name:"Tegid",reg:"grand",syllables:2},{name:"Trystan",reg:"grand",syllables:2},{name:"Berwyn",reg:"grand",syllables:2},{name:"Delwyn",reg:"grand",syllables:2},{name:"Dilwyn",reg:"grand",syllables:2},{name:"Eifion",reg:"grand",syllables:2},{name:"Elidyr",reg:"grand",syllables:2},{name:"Gwyndaf",reg:"grand",syllables:2},{name:"Gwynfor",reg:"grand",syllables:2},{name:"Gwynne",reg:"grand",syllables:2},{name:"Heini",reg:"grand",syllables:2},{name:"Macsen",reg:"grand",syllables:2},{name:"Meredydd",reg:"grand",syllables:2},{name:"Morlais",reg:"grand",syllables:2},{name:"Rhydderch",reg:"grand",syllables:2},{name:"Tecwyn",reg:"grand",syllables:2},{name:"Wmffre",reg:"grand",syllables:2},{name:"Prys",reg:"grand",syllables:2},{name:"Gwilym",reg:"grand",syllables:2}],
    girl: [{name:"Angharad",reg:"grand",syllables:3},{name:"Arianrhod",reg:"grand",syllables:3},{name:"Bethan",reg:"mundane",syllables:2},{name:"Blodwen",reg:"grand",syllables:2},{name:"Branwen",reg:"grand",syllables:2},{name:"Carys",reg:"mundane",syllables:1},{name:"Catrin",reg:"mundane",syllables:2},{name:"Ceinwen",reg:"mundane",syllables:2},{name:"Ceridwen",reg:"grand",syllables:3},{name:"Dilys",reg:"mundane",syllables:1},{name:"Eirlys",reg:"grand",syllables:1},{name:"Elin",reg:"mundane",syllables:2},{name:"Eluned",reg:"grand",syllables:3},{name:"Enfys",reg:"mundane",syllables:1},{name:"Enid",reg:"mundane",syllables:2},{name:"Ffion",reg:"grand",syllables:1},{name:"Glenda",reg:"mundane",syllables:2},{name:"Glenys",reg:"mundane",syllables:1},{name:"Gwen",reg:"mundane",syllables:1},{name:"Gweneth",reg:"mundane",syllables:2},{name:"Gwenllian",reg:"grand",syllables:2},{name:"Llio",reg:"mundane",syllables:1},{name:"Lowri",reg:"mundane",syllables:2},{name:"Mabli",reg:"mundane",syllables:2},{name:"Mair",reg:"mundane",syllables:1},{name:"Mali",reg:"mundane",syllables:2},{name:"Marged",reg:"mundane",syllables:2},{name:"Megan",reg:"mundane",syllables:2},{name:"Morfudd",reg:"grand",syllables:2},{name:"Nerys",reg:"mundane",syllables:1},{name:"Nest",reg:"mundane",syllables:1},{name:"Nesta",reg:"mundane",syllables:2},{name:"Nia",reg:"mundane",syllables:1},{name:"Non",reg:"mundane",syllables:1},{name:"Olwen",reg:"mundane",syllables:2},{name:"Rhian",reg:"mundane",syllables:1},{name:"Rhiannon",reg:"grand",syllables:2},{name:"Rowena",reg:"mundane",syllables:3},{name:"Seren",reg:"mundane",syllables:2},{name:"Sian",reg:"mundane",syllables:1},{name:"Siân",reg:"mundane",syllables:1},{name:"Tangwystl",reg:"grand",syllables:1},{name:"Tegwen",reg:"mundane",syllables:2},{name:"Tesni",reg:"mundane",syllables:2},{name:"Wenna",reg:"mundane",syllables:2}]
},
  asian: {
    boy: [{name:"Phooey",reg:"chaos",syllables:2},{name:"Phony",reg:"chaos",syllables:2},{name:"Philbert",reg:"chaos",syllables:2},{name:"Phreddy",reg:"chaos",syllables:2},{name:"Phumble",reg:"chaos",syllables:2},{name:"Louie",reg:"chaos",syllables:2},{name:"Lenny",reg:"chaos",syllables:2},{name:"Lummox",reg:"chaos",syllables:2},{name:"Mooy",reg:"chaos",syllables:2},{name:"Mugsy",reg:"chaos",syllables:2},{name:"Mochi",reg:"chaos",syllables:2},{name:"Miso",reg:"chaos",syllables:2},{name:"Mongo",reg:"chaos",syllables:2},{name:"Tater",reg:"chaos",syllables:2},{name:"Tumble",reg:"chaos",syllables:2},{name:"Tiger",reg:"chaos",syllables:2},{name:"Wobble",reg:"chaos",syllables:2},{name:"Wumpus",reg:"chaos",syllables:2},{name:"Wonky",reg:"chaos",syllables:2},{name:"Phony",reg:"chaos",syllables:2},{name:"Fumble",reg:"chaos",syllables:2},{name:"Fizz",reg:"chaos",syllables:2},{name:"Spot",reg:"chaos",syllables:2},{name:"Napoleon",reg:"chaos",syllables:2},{name:"Gus",reg:"chaos",syllables:2},{name:"Alf",reg:"chaos",syllables:2},{name:"Homer",reg:"chaos",syllables:2},{name:"Waldo",reg:"chaos",syllables:2},{name:"Winston",reg:"mundane",syllables:2},{name:"Otto",reg:"mundane",syllables:2},{name:"Bertie",reg:"mundane",syllables:2},{name:"Monty",reg:"mundane",syllables:2},{name:"Percy",reg:"mundane",syllables:2},{name:"Reggie",reg:"mundane",syllables:2},{name:"Buster",reg:"chaos",syllables:2},{name:"Gruff",reg:"chaos",syllables:1},{name:"Grunt",reg:"chaos",syllables:1},{name:"Clive",reg:"mundane",syllables:1},{name:"Boris",reg:"mundane",syllables:2},{name:"Derek",reg:"mundane",syllables:2},{name:"Norman",reg:"mundane",syllables:2},{name:"Frank",reg:"mundane",syllables:1},{name:"Dennis",reg:"mundane",syllables:2},{name:"Stanley",reg:"mundane",syllables:2},{name:"Herbert",reg:"mundane",syllables:2},{name:"Ernest",reg:"mundane",syllables:2},{name:"Pudding",reg:"food",syllables:2},{name:"Noodle",reg:"food",syllables:2},{name:"Roly",reg:"chaos",syllables:2},{name:"Snorter",reg:"chaos",syllables:2}],
    girl: [{name:"Jade",reg:"grand",syllables:2},{name:"Jasmine",reg:"grand",syllables:2},{name:"Peony",reg:"grand",syllables:2},{name:"Plum",reg:"grand",syllables:2},{name:"Mochi",reg:"grand",syllables:2},{name:"Yuki",reg:"grand",syllables:2},{name:"Kiku",reg:"grand",syllables:2},{name:"Hana",reg:"grand",syllables:2},{name:"Mei",reg:"grand",syllables:2},{name:"Xiao",reg:"grand",syllables:2},{name:"Zhen",reg:"grand",syllables:2},{name:"Nori",reg:"grand",syllables:2},{name:"Suki",reg:"grand",syllables:2},{name:"Koi",reg:"grand",syllables:2},{name:"Tigress",reg:"grand",syllables:2},{name:"Viper",reg:"grand",syllables:2},{name:"Crane",reg:"grand",syllables:2},{name:"Mariposa",reg:"grand",syllables:2},{name:"Butterfly",reg:"grand",syllables:2},{name:"Booboo",reg:"grand",syllables:2},{name:"Gigi",reg:"grand",syllables:2},{name:"Mimi",reg:"grand",syllables:2},{name:"Fifi",reg:"grand",syllables:2},{name:"Lulu",reg:"grand",syllables:2},{name:"Coco",reg:"grand",syllables:2},{name:"Aiko",reg:"grand",syllables:2},{name:"Amaya",reg:"grand",syllables:3},{name:"Azuki",reg:"grand",syllables:3},{name:"Blossom",reg:"nature",syllables:2},{name:"Cherry",reg:"nature",syllables:1},{name:"Fuji",reg:"nature",syllables:2},{name:"Lotus",reg:"nature",syllables:2},{name:"Miho",reg:"grand",syllables:2},{name:"Misaki",reg:"grand",syllables:3},{name:"Momoko",reg:"grand",syllables:3},{name:"Naomi",reg:"grand",syllables:2},{name:"Orchid",reg:"nature",syllables:2},{name:"Sakura",reg:"nature",syllables:3},{name:"Sayuri",reg:"grand",syllables:3},{name:"Shizuka",reg:"grand",syllables:3},{name:"Sumiko",reg:"grand",syllables:3},{name:"Tamiko",reg:"grand",syllables:3},{name:"Tomoko",reg:"grand",syllables:3},{name:"Yoko",reg:"grand",syllables:2},{name:"Yumi",reg:"grand",syllables:2}]
},
  default: {
    boy: [{name:"Archibald",reg:"grand",syllables:3},{name:"Barnaby",reg:"grand",syllables:3},{name:"Cornelius",reg:"grand",syllables:4},{name:"Douglas",reg:"mundane",syllables:2},{name:"Frederick",reg:"grand",syllables:3},{name:"Herbert",reg:"mundane",syllables:2},{name:"Jasper",reg:"grand",syllables:2},{name:"Lionel",reg:"grand",syllables:3},{name:"Montgomery",reg:"grand",syllables:3},{name:"Norman",reg:"mundane",syllables:2},{name:"Percival",reg:"grand",syllables:3},{name:"Reginald",reg:"grand",syllables:3},{name:"Stanley",reg:"mundane",syllables:2},{name:"Theodore",reg:"grand",syllables:3},{name:"Vincent",reg:"grand",syllables:2},{name:"Booboo",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Altair",reg:"grand",syllables:2},{name:"Antimatter",reg:"grand",syllables:4},{name:"Apollo",reg:"grand",syllables:3},{name:"Asteroid",reg:"grand",syllables:3},{name:"Astro",reg:"grand",syllables:2},{name:"Atlas",reg:"grand",syllables:2},{name:"Blackstar",reg:"grand",syllables:2},{name:"Cosmic",reg:"grand",syllables:2},{name:"Cosmo",reg:"grand",syllables:2},{name:"Cosmos",reg:"grand",syllables:2},{name:"Darkside",reg:"grand",syllables:2},{name:"Darkstar",reg:"grand",syllables:2},{name:"Deepspace",reg:"grand",syllables:2},{name:"Draco",reg:"grand",syllables:2},{name:"Galileo",reg:"grand",syllables:4},{name:"Ganymede",reg:"grand",syllables:3},{name:"Hubble",reg:"grand",syllables:2},{name:"Jupiter",reg:"grand",syllables:3},{name:"Kepler",reg:"grand",syllables:2},{name:"Magnetar",reg:"grand",syllables:3},{name:"Mercury",reg:"grand",syllables:3},{name:"Meteor",reg:"grand",syllables:3},{name:"Neptune",reg:"grand",syllables:2},{name:"Orbit",reg:"grand",syllables:2},{name:"Orion",reg:"grand",syllables:3},{name:"Pluto",reg:"grand",syllables:2},{name:"Pulsar",reg:"grand",syllables:2},{name:"Quasar",reg:"grand",syllables:2},{name:"Saturn",reg:"grand",syllables:2},{name:"Sirius",reg:"grand",syllables:3},{name:"Starburst",reg:"grand",syllables:2},{name:"Starwalker",reg:"grand",syllables:3},{name:"Sunspot",reg:"grand",syllables:2},{name:"Titan",reg:"grand",syllables:2},{name:"Vulcan",reg:"grand",syllables:2},{name:"Astral",reg:"grand",syllables:2},{name:"Comet",reg:"grand",syllables:2},{name:"Eclipse",reg:"grand",syllables:2},{name:"Equinox",reg:"grand",syllables:3},{name:"Galaxy",reg:"grand",syllables:3},{name:"Skyfall",reg:"grand",syllables:2},{name:"Skyfire",reg:"grand",syllables:2},{name:"Solaris",reg:"grand",syllables:3},{name:"Solstice",reg:"grand",syllables:2},{name:"Starfall",reg:"grand",syllables:2},{name:"Starshadow",reg:"grand",syllables:2},{name:"Starstone",reg:"grand",syllables:2},{name:"Sunflare",reg:"grand",syllables:2},{name:"Supernova",reg:"grand",syllables:4},{name:"Whirlwind",reg:"grand",syllables:2},{name:"Cyrus",reg:"grand",syllables:2},{name:"Darius",reg:"grand",syllables:3},{name:"Plato",reg:"grand",syllables:2},{name:"Prometheus",reg:"grand",syllables:4},{name:"Pythagoras",reg:"grand",syllables:4},{name:"Socrates",reg:"grand",syllables:3},{name:"Napoleon",reg:"grand",syllables:4},{name:"Pascal",reg:"grand",syllables:2},{name:"Newton",reg:"grand",syllables:2},{name:"Darwin",reg:"grand",syllables:2},{name:"Einstein",reg:"grand",syllables:3},{name:"Alf",reg:"mundane",syllables:1},{name:"Benny",reg:"mundane",syllables:2},{name:"Blaise",reg:"grand",syllables:2},{name:"Charles",reg:"grand",syllables:2},{name:"Edgar",reg:"grand",syllables:2},{name:"Edmond",reg:"grand",syllables:2},{name:"Edward",reg:"grand",syllables:2},{name:"Gabriel",reg:"grand",syllables:3},{name:"Gus",reg:"mundane",syllables:1},{name:"Guy",reg:"mundane",syllables:1},{name:"Henry",reg:"grand",syllables:2},{name:"Homer",reg:"grand",syllables:2},{name:"Lawrence",reg:"grand",syllables:2},{name:"Lenny",reg:"mundane",syllables:2},{name:"Leopold",reg:"grand",syllables:3},{name:"Louie",reg:"mundane",syllables:3},{name:"Louis",reg:"grand",syllables:2},{name:"Miles",reg:"mundane",syllables:2},{name:"Oliver",reg:"mundane",syllables:3},{name:"Omar",reg:"mundane",syllables:2},{name:"Quentin",reg:"grand",syllables:2},{name:"Richard",reg:"mundane",syllables:2},{name:"Sebastian",reg:"grand",syllables:4},{name:"Sherman",reg:"mundane",syllables:2},{name:"Viper",reg:"grand",syllables:2},{name:"William",reg:"grand",syllables:3},{name:"Bailey",reg:"mundane",syllables:3},{name:"Binky",reg:"baby",syllables:2},{name:"Altimeter",reg:"absurd",syllables:4},{name:"Batfink",reg:"absurd",syllables:2},{name:"Boffin",reg:"absurd",syllables:2},{name:"Chumley",reg:"absurd",syllables:2},{name:"Cornflake",reg:"absurd",syllables:2},{name:"Dragon",reg:"grand",syllables:2},{name:"Drifter",reg:"absurd",syllables:2},{name:"Duke",reg:"grand",syllables:1},{name:"Enguerrand",reg:"grand",syllables:3},{name:"Falcon",reg:"grand",syllables:2},{name:"Fleet",reg:"grand",syllables:1},{name:"Foghorn",reg:"absurd",syllables:2},{name:"Fortunatus",reg:"grand",syllables:4},{name:"Fumble",reg:"chaos",syllables:2},{name:"Gaston",reg:"grand",syllables:2},{name:"Gizmo",reg:"absurd",syllables:2},{name:"Goober",reg:"absurd",syllables:2},{name:"Grommet",reg:"absurd",syllables:2},{name:"Gubbins",reg:"absurd",syllables:2},{name:"Hamid",reg:"mundane",syllables:2},{name:"Henri",reg:"grand",syllables:2},{name:"Huckleberry",reg:"absurd",syllables:4},{name:"Karate",reg:"absurd",syllables:3},{name:"Khalid",reg:"mundane",syllables:2},{name:"Khan",reg:"grand",syllables:1},{name:"Koda",reg:"mundane",syllables:2},{name:"Lummox",reg:"absurd",syllables:2},{name:"Mantis",reg:"absurd",syllables:2},{name:"Marcel",reg:"grand",syllables:2},{name:"Maximillian",reg:"grand",syllables:5},{name:"Mongo",reg:"absurd",syllables:2},{name:"Muddle",reg:"chaos",syllables:2},{name:"Mugsy",reg:"absurd",syllables:2},{name:"Nanuq",reg:"grand",syllables:2},{name:"Nipper",reg:"chaos",syllables:2},{name:"Peabody",reg:"grand",syllables:3},{name:"Penry",reg:"absurd",syllables:2},{name:"Philbert",reg:"absurd",syllables:2},{name:"Philibert",reg:"absurd",syllables:3},{name:"Phony",reg:"absurd",syllables:2},{name:"Phooey",reg:"absurd",syllables:2},{name:"Phreddy",reg:"absurd",syllables:2},{name:"Phumble",reg:"absurd",syllables:2},{name:"Pierre",reg:"grand",syllables:2},{name:"Pip",reg:"mundane",syllables:1},{name:"Puckle",reg:"absurd",syllables:2},{name:"Qadir",reg:"mundane",syllables:2},{name:"Ramshackle",reg:"absurd",syllables:3},{name:"Raoul",reg:"grand",syllables:2},{name:"René",reg:"grand",syllables:2},{name:"Reza",reg:"mundane",syllables:2},{name:"Roly",reg:"baby",syllables:2},{name:"Scamp",reg:"chaos",syllables:1},{name:"Scraggy",reg:"chaos",syllables:2},{name:"Scrumpy",reg:"food",syllables:2},{name:"Spot",reg:"mundane",syllables:1},{name:"Sprocket",reg:"absurd",syllables:2},{name:"Spark",reg:"chaos",syllables:1},{name:"Squirt",reg:"chaos",syllables:1},{name:"Tarkan",reg:"mundane",syllables:2},{name:"Tater",reg:"food",syllables:2},{name:"Tiger",reg:"grand",syllables:2},{name:"Turbulence",reg:"chaos",syllables:3},{name:"Waldo",reg:"absurd",syllables:2},{name:"WeeDee",reg:"absurd",syllables:2},{name:"Wimpy",reg:"absurd",syllables:2},{name:"Wittgenstein",reg:"absurd",syllables:4},{name:"Wonton",reg:"food",syllables:2},{name:"Wumpus",reg:"absurd",syllables:2},{name:"Zen",reg:"grand",syllables:1},{name:"Bonkers",reg:"chaos",syllables:2},{name:"Booper",reg:"baby",syllables:2},{name:"Button",reg:"baby",syllables:2},{name:"Coco",reg:"baby",syllables:2},{name:"Dazzle",reg:"absurd",syllables:2},{name:"Dinky",reg:"baby",syllables:2},{name:"Dizzy",reg:"chaos",syllables:2},{name:"Doodle",reg:"baby",syllables:2},{name:"Fidget",reg:"chaos",syllables:2},{name:"Fizz",reg:"chaos",syllables:1},{name:"Fury",reg:"grand",syllables:2},{name:"Gale",reg:"nature",syllables:1},{name:"Glorious",reg:"grand",syllables:3},{name:"Jellybean",reg:"food",syllables:3},{name:"Lilliput",reg:"absurd",syllables:3},{name:"Majestic",reg:"grand",syllables:3},{name:"Marvellous",reg:"grand",syllables:3},{name:"Mischief",reg:"chaos",syllables:2},{name:"Moxie",reg:"chaos",syllables:2},{name:"Munchkin",reg:"baby",syllables:2},{name:"Nimble",reg:"chaos",syllables:2},{name:"Nugget",reg:"food",syllables:2},{name:"Opulent",reg:"grand",syllables:3},{name:"Peanut",reg:"food",syllables:2},{name:"Pipsqueak",reg:"baby",syllables:2},{name:"Pocket",reg:"baby",syllables:2},{name:"Skittles",reg:"food",syllables:2},{name:"Smidge",reg:"baby",syllables:1},{name:"Smidgeon",reg:"baby",syllables:2},{name:"Snippy",reg:"chaos",syllables:2},{name:"Speck",reg:"baby",syllables:1},{name:"Squishface",reg:"baby",syllables:2},{name:"Tangles",reg:"chaos",syllables:2},{name:"Teacup",reg:"baby",syllables:2},{name:"Tempest",reg:"grand",syllables:2},{name:"Thingy",reg:"absurd",syllables:2},{name:"Titch",reg:"baby",syllables:1},{name:"Titchy",reg:"baby",syllables:2},{name:"Tufty",reg:"baby",syllables:2},{name:"Tumble",reg:"chaos",syllables:2},{name:"Waltz",reg:"grand",syllables:1},{name:"Wibble",reg:"chaos",syllables:2},{name:"Widget",reg:"absurd",syllables:2},{name:"Wobble",reg:"chaos",syllables:2},{name:"Wonky",reg:"chaos",syllables:2},{name:"Wriggles",reg:"chaos",syllables:2},{name:"Frost",reg:"nature",syllables:1},{name:"Phantom",reg:"grand",syllables:2},{name:"Ghost",reg:"grand",syllables:1},{name:"Wraith",reg:"grand",syllables:1},{name:"Shade",reg:"grand",syllables:1},{name:"Mist",reg:"nature",syllables:1},{name:"Smoky",reg:"nature",syllables:2},{name:"Spectre",reg:"grand",syllables:2},{name:"Murk",reg:"grand",syllables:1},{name:"Robin",reg:"nature",syllables:2},{name:"Lark",reg:"nature",syllables:1},{name:"Crisp",reg:"grand",syllables:1},{name:"Sparky",reg:"chaos",syllables:2},{name:"Brisk",reg:"grand",syllables:1},{name:"Perky",reg:"chaos",syllables:2},{name:"Chipper",reg:"chaos",syllables:2},{name:"Sunny",reg:"chaos",syllables:2},{name:"Handel",reg:"grand",syllables:2},{name:"Bach",reg:"grand",syllables:1},{name:"Brahms",reg:"grand",syllables:1},{name:"Chopin",reg:"grand",syllables:2},{name:"Liszt",reg:"grand",syllables:1},{name:"Schubert",reg:"grand",syllables:2},{name:"Vivaldi",reg:"grand",syllables:3},{name:"Purcell",reg:"grand",syllables:2},{name:"Foxtrot",reg:"grand",syllables:2},{name:"Tango",reg:"grand",syllables:2},{name:"Boogie",reg:"chaos",syllables:2},{name:"Rumba",reg:"grand",syllables:2},{name:"Jive",reg:"chaos",syllables:1},{name:"Swing",reg:"chaos",syllables:1},{name:"Conker",reg:"nature",syllables:2},{name:"Russet",reg:"nature",syllables:2},{name:"Birch",reg:"nature",syllables:1},{name:"Espresso",reg:"food",syllables:3},{name:"Mocha",reg:"food",syllables:2},{name:"Arabica",reg:"food",syllables:4},{name:"Pickle",reg:"food",syllables:2},{name:"Reckless",reg:"chaos",syllables:2},{name:"Oregano",reg:"nature",syllables:3},{name:"Thyme",reg:"nature",syllables:1},{name:"Nocturne",reg:"grand",syllables:2},{name:"Mellow",reg:"grand",syllables:2},{name:"Slumber",reg:"grand",syllables:2},{name:"Dusk",reg:"grand",syllables:1},{name:"Scone",reg:"food",syllables:1},{name:"Flapjack",reg:"food",syllables:2},{name:"Horlicks",reg:"food",syllables:2},{name:"Marmite",reg:"food",syllables:2},{name:"Bangers",reg:"food",syllables:2},{name:"Haggis",reg:"food",syllables:2},{name:"Ginger",reg:"food",syllables:2},{name:"Cinnamon",reg:"food",syllables:3},{name:"Scones",reg:"food",syllables:2},{name:"Flapjacks",reg:"food",syllables:2},{name:"Fizzy",reg:"food",syllables:2},{name:"Lolly",reg:"food",syllables:2},{name:"Lollipop",reg:"food",syllables:3},{name:"Jellybaby",reg:"food",syllables:4},{name:"Aniseed",reg:"food",syllables:3},{name:"Peppermint",reg:"food",syllables:3},{name:"Spearmint",reg:"food",syllables:2},{name:"Flake",reg:"food",syllables:1},{name:"Ripple",reg:"food",syllables:2},{name:"Wispa",reg:"food",syllables:2},{name:"Buttons",reg:"food",syllables:2},{name:"Chomp",reg:"food",syllables:1},{name:"Snowball",reg:"food",syllables:2},{name:"Fondant",reg:"food",syllables:2},{name:"Nougat",reg:"food",syllables:2},{name:"Mallow",reg:"food",syllables:2},{name:"Flump",reg:"food",syllables:1},{name:"Gummy",reg:"food",syllables:2},{name:"Winegum",reg:"food",syllables:3},{name:"Honeycomb",reg:"food",syllables:3},{name:"Tablet",reg:"food",syllables:2},{name:"Bubblegum",reg:"food",syllables:3},{name:"Sprinkle",reg:"food",syllables:2},{name:"Hundreds",reg:"food",syllables:2},{name:"Thousands",reg:"food",syllables:2}],
    girl: [{name:"Arabella",reg:"grand",syllables:4},{name:"Beatrice",reg:"grand",syllables:3},{name:"Clementine",reg:"grand",syllables:3},{name:"Dorothy",reg:"mundane",syllables:3},{name:"Eleanor",reg:"grand",syllables:3},{name:"Georgiana",reg:"grand",syllables:4},{name:"Isadora",reg:"grand",syllables:4},{name:"Lavinia",reg:"grand",syllables:4},{name:"Millicent",reg:"grand",syllables:3},{name:"Nora",reg:"mundane",syllables:2},{name:"Prudence",reg:"mundane",syllables:2},{name:"Rosalind",reg:"grand",syllables:3},{name:"Sophronia",reg:"grand",syllables:4},{name:"Tabitha",reg:"grand",syllables:3},{name:"Vivienne",reg:"grand",syllables:3},{name:"Booboo",reg:"baby",syllables:2},{name:"Mimi",reg:"baby",syllables:2},{name:"Snugglebum",reg:"baby",syllables:3},{name:"Wagger",reg:"chaos",syllables:2},{name:"Wobble",reg:"chaos",syllables:2},{name:"Wriggle",reg:"chaos",syllables:2},{name:"Waddle",reg:"chaos",syllables:2},{name:"Wander",reg:"chaos",syllables:2},{name:"Wiggles",reg:"chaos",syllables:2},{name:"Andromeda",reg:"grand",syllables:4},{name:"Artemis",reg:"grand",syllables:3},{name:"Artemisia",reg:"grand",syllables:5},{name:"Astra",reg:"grand",syllables:2},{name:"Astrid",reg:"grand",syllables:2},{name:"Aurora",reg:"grand",syllables:4},{name:"Dawnstar",reg:"grand",syllables:2},{name:"Elara",reg:"grand",syllables:3},{name:"Luna",reg:"grand",syllables:2},{name:"Lunaris",reg:"grand",syllables:3},{name:"Nebula",reg:"grand",syllables:3},{name:"Nightfall",reg:"grand",syllables:2},{name:"Nightglow",reg:"grand",syllables:2},{name:"Nightshade",reg:"grand",syllables:2},{name:"Nova",reg:"grand",syllables:2},{name:"Penumbra",reg:"grand",syllables:3},{name:"Selene",reg:"grand",syllables:3},{name:"Shadowmoon",reg:"grand",syllables:3},{name:"Silvermoon",reg:"grand",syllables:3},{name:"Starbeam",reg:"grand",syllables:2},{name:"Stardust",reg:"grand",syllables:2},{name:"Starlight",reg:"grand",syllables:2},{name:"Stella",reg:"grand",syllables:2},{name:"Twilight",reg:"grand",syllables:2},{name:"Umbra",reg:"grand",syllables:2},{name:"Vega",reg:"grand",syllables:2},{name:"Vela",reg:"grand",syllables:2},{name:"Astral",reg:"grand",syllables:2},{name:"Comet",reg:"grand",syllables:2},{name:"Eclipse",reg:"grand",syllables:2},{name:"Equinox",reg:"grand",syllables:3},{name:"Galaxy",reg:"grand",syllables:3},{name:"Skyfall",reg:"grand",syllables:2},{name:"Skyfire",reg:"grand",syllables:2},{name:"Solaris",reg:"grand",syllables:3},{name:"Solstice",reg:"grand",syllables:2},{name:"Starfall",reg:"grand",syllables:2},{name:"Starshadow",reg:"grand",syllables:2},{name:"Starstone",reg:"grand",syllables:2},{name:"Sunflare",reg:"grand",syllables:2},{name:"Supernova",reg:"grand",syllables:4},{name:"Whirlwind",reg:"grand",syllables:2},{name:"Athena",reg:"grand",syllables:3},{name:"Calypso",reg:"grand",syllables:3},{name:"Carina",reg:"grand",syllables:3},{name:"Cassandra",reg:"grand",syllables:3},{name:"Circe",reg:"grand",syllables:2},{name:"Cleopatra",reg:"grand",syllables:4},{name:"Demeter",reg:"grand",syllables:3},{name:"Fauna",reg:"nature",syllables:2},{name:"Gaia",reg:"grand",syllables:2},{name:"Hecate",reg:"grand",syllables:3},{name:"Hera",reg:"grand",syllables:2},{name:"Hippolyta",reg:"grand",syllables:4},{name:"Medea",reg:"grand",syllables:3},{name:"Persephone",reg:"grand",syllables:4},{name:"Phoebe",reg:"grand",syllables:2},{name:"Rhea",reg:"grand",syllables:2},{name:"Sappho",reg:"grand",syllables:2},{name:"Seraphina",reg:"grand",syllables:4},{name:"Sophia",reg:"grand",syllables:3},{name:"Betty",reg:"mundane",syllables:2},{name:"Camille",reg:"grand",syllables:2},{name:"Christabel",reg:"grand",syllables:3},{name:"Cordelia",reg:"grand",syllables:4},{name:"Dorothea",reg:"grand",syllables:4},{name:"Emily",reg:"mundane",syllables:3},{name:"Florentine",reg:"grand",syllables:4},{name:"Frederica",reg:"grand",syllables:4},{name:"Gertrude",reg:"grand",syllables:2},{name:"Hana",reg:"mundane",syllables:2},{name:"Hannah",reg:"mundane",syllables:2},{name:"Henrietta",reg:"grand",syllables:4},{name:"Hildegard",reg:"grand",syllables:3},{name:"Hildegarde",reg:"grand",syllables:3},{name:"Lucy",reg:"mundane",syllables:2},{name:"Megan",reg:"mundane",syllables:2},{name:"Melissa",reg:"mundane",syllables:3},{name:"Milly",reg:"mundane",syllables:2},{name:"Molly",reg:"mundane",syllables:2},{name:"Patience",reg:"grand",syllables:3},{name:"Rowena",reg:"grand",syllables:3},{name:"Sarah",reg:"mundane",syllables:2},{name:"Sieglinde",reg:"grand",syllables:3},{name:"Sigrid",reg:"grand",syllables:2},{name:"Tallulah",reg:"grand",syllables:3},{name:"Temperance",reg:"grand",syllables:3},{name:"Theodora",reg:"grand",syllables:4},{name:"Thomasina",reg:"grand",syllables:4},{name:"Ursula",reg:"grand",syllables:3},{name:"Wilhelmina",reg:"grand",syllables:5},{name:"Bailey",reg:"mundane",syllables:3},{name:"Binky",reg:"baby",syllables:2},{name:"Babbycakes",reg:"baby",syllables:3},{name:"Boadicea",reg:"grand",syllables:5},{name:"Butterfly",reg:"baby",syllables:3},{name:"Candyfloss",reg:"baby",syllables:3},{name:"Cuddlekins",reg:"baby",syllables:3},{name:"Cupcake",reg:"baby",syllables:2},{name:"Dainty",reg:"baby",syllables:2},{name:"Daintybell",reg:"baby",syllables:3},{name:"Dancer",reg:"grand",syllables:2},{name:"Duchess",reg:"grand",syllables:2},{name:"Elfriede",reg:"grand",syllables:3},{name:"Fifi",reg:"baby",syllables:2},{name:"Flair",reg:"grand",syllables:1},{name:"Fleur",reg:"grand",syllables:1},{name:"Fluffybum",reg:"baby",syllables:3},{name:"Flutter",reg:"baby",syllables:2},{name:"Frenzina",reg:"chaos",syllables:3},{name:"Gigi",reg:"baby",syllables:2},{name:"Gossamera",reg:"absurd",syllables:3},{name:"Hedwig",reg:"grand",syllables:2},{name:"Helena",reg:"grand",syllables:3},{name:"Jade",reg:"mundane",syllables:1},{name:"Jasmine",reg:"nature",syllables:2},{name:"Kriemhild",reg:"grand",syllables:3},{name:"Kunigunde",reg:"grand",syllables:4},{name:"Livia",reg:"grand",syllables:3},{name:"Lulu",reg:"baby",syllables:2},{name:"Mishka",reg:"baby",syllables:2},{name:"Petite",reg:"baby",syllables:2},{name:"Pixie",reg:"baby",syllables:2},{name:"Plum",reg:"food",syllables:1},{name:"Ruffles",reg:"baby",syllables:2},{name:"Tempesta",reg:"grand",syllables:3},{name:"Thistledown",reg:"nature",syllables:3},{name:"Tigress",reg:"grand",syllables:2},{name:"Topsy",reg:"baby",syllables:2},{name:"Tuppence",reg:"baby",syllables:2},{name:"Tutu",reg:"baby",syllables:2},{name:"Twiggy",reg:"baby",syllables:2},{name:"Twinkles",reg:"baby",syllables:2},{name:"Xiao",reg:"mundane",syllables:2},{name:"Yuki",reg:"mundane",syllables:2},{name:"Bonkers",reg:"chaos",syllables:2},{name:"Booper",reg:"baby",syllables:2},{name:"Button",reg:"baby",syllables:2},{name:"Coco",reg:"baby",syllables:2},{name:"Dazzle",reg:"absurd",syllables:2},{name:"Dinky",reg:"baby",syllables:2},{name:"Dizzy",reg:"chaos",syllables:2},{name:"Doodle",reg:"baby",syllables:2},{name:"Fidget",reg:"chaos",syllables:2},{name:"Fizz",reg:"chaos",syllables:1},{name:"Fury",reg:"grand",syllables:2},{name:"Gale",reg:"nature",syllables:1},{name:"Glorious",reg:"grand",syllables:3},{name:"Jellybean",reg:"food",syllables:3},{name:"Lilliput",reg:"absurd",syllables:3},{name:"Majestic",reg:"grand",syllables:3},{name:"Marvellous",reg:"grand",syllables:3},{name:"Mischief",reg:"chaos",syllables:2},{name:"Moxie",reg:"chaos",syllables:2},{name:"Munchkin",reg:"baby",syllables:2},{name:"Nimble",reg:"chaos",syllables:2},{name:"Nugget",reg:"food",syllables:2},{name:"Opulent",reg:"grand",syllables:3},{name:"Peanut",reg:"food",syllables:2},{name:"Pipsqueak",reg:"baby",syllables:2},{name:"Pocket",reg:"baby",syllables:2},{name:"Skittles",reg:"food",syllables:2},{name:"Smidge",reg:"baby",syllables:1},{name:"Smidgeon",reg:"baby",syllables:2},{name:"Snippy",reg:"chaos",syllables:2},{name:"Speck",reg:"baby",syllables:1},{name:"Squishface",reg:"baby",syllables:2},{name:"Tangles",reg:"chaos",syllables:2},{name:"Teacup",reg:"baby",syllables:2},{name:"Tempest",reg:"grand",syllables:2},{name:"Thingy",reg:"absurd",syllables:2},{name:"Titch",reg:"baby",syllables:1},{name:"Titchy",reg:"baby",syllables:2},{name:"Tufty",reg:"baby",syllables:2},{name:"Tumble",reg:"chaos",syllables:2},{name:"Waltz",reg:"grand",syllables:1},{name:"Wibble",reg:"chaos",syllables:2},{name:"Widget",reg:"absurd",syllables:2},{name:"Wonky",reg:"chaos",syllables:2},{name:"Wriggles",reg:"chaos",syllables:2},{name:"Bathilde",reg:"grand",syllables:2},{name:"Branwen",reg:"grand",syllables:2},{name:"Brunhilda",reg:"grand",syllables:3},{name:"Brunhilde",reg:"grand",syllables:3},{name:"Gwenllian",reg:"grand",syllables:3},{name:"Morfudd",reg:"grand",syllables:2},{name:"Rhiannon",reg:"grand",syllables:3},{name:"Shade",reg:"grand",syllables:1},{name:"Mist",reg:"nature",syllables:1},{name:"Smoky",reg:"nature",syllables:2},{name:"Dawn",reg:"nature",syllables:1},{name:"Robin",reg:"nature",syllables:2},{name:"Lark",reg:"nature",syllables:1},{name:"Sparky",reg:"chaos",syllables:2},{name:"Perky",reg:"chaos",syllables:2},{name:"Sunny",reg:"chaos",syllables:2},{name:"Tango",reg:"grand",syllables:2},{name:"Boogie",reg:"chaos",syllables:2},{name:"Twirl",reg:"chaos",syllables:1},{name:"Salsa",reg:"chaos",syllables:2},{name:"Rumba",reg:"grand",syllables:2},{name:"Jive",reg:"chaos",syllables:1},{name:"Swing",reg:"chaos",syllables:1},{name:"Daisy",reg:"nature",syllables:2},{name:"Blossom",reg:"nature",syllables:2},{name:"Russet",reg:"nature",syllables:2},{name:"Birch",reg:"nature",syllables:1},{name:"Buttercup",reg:"nature",syllables:3},{name:"Mocha",reg:"food",syllables:2},{name:"Thyme",reg:"nature",syllables:1},{name:"Rosie",reg:"baby",syllables:2},{name:"Petal",reg:"baby",syllables:2},{name:"Vesper",reg:"grand",syllables:2},{name:"Nocturne",reg:"grand",syllables:2},{name:"Mellow",reg:"grand",syllables:2},{name:"Slumber",reg:"grand",syllables:2},{name:"Dusk",reg:"grand",syllables:1},{name:"Scone",reg:"food",syllables:1},{name:"Flapjack",reg:"food",syllables:2},{name:"Horlicks",reg:"food",syllables:2},{name:"Marmite",reg:"food",syllables:2},{name:"Bangers",reg:"food",syllables:2},{name:"Haggis",reg:"food",syllables:2},{name:"Ginger",reg:"food",syllables:2},{name:"Cinnamon",reg:"food",syllables:3},{name:"Scones",reg:"food",syllables:2},{name:"Flapjacks",reg:"food",syllables:2},{name:"Fizzy",reg:"food",syllables:2},{name:"Lolly",reg:"food",syllables:2},{name:"Lollipop",reg:"food",syllables:3},{name:"Jellybaby",reg:"food",syllables:4},{name:"Aniseed",reg:"food",syllables:3},{name:"Peppermint",reg:"food",syllables:3},{name:"Spearmint",reg:"food",syllables:2},{name:"Flake",reg:"food",syllables:1},{name:"Ripple",reg:"food",syllables:2},{name:"Wispa",reg:"food",syllables:2},{name:"Buttons",reg:"food",syllables:2},{name:"Chomp",reg:"food",syllables:1},{name:"Snowball",reg:"food",syllables:2},{name:"Fondant",reg:"food",syllables:2},{name:"Nougat",reg:"food",syllables:2},{name:"Mallow",reg:"food",syllables:2},{name:"Flump",reg:"food",syllables:1},{name:"Gummy",reg:"food",syllables:2},{name:"Winegum",reg:"food",syllables:3},{name:"Honeycomb",reg:"food",syllables:3},{name:"Tablet",reg:"food",syllables:2},{name:"Bubblegum",reg:"food",syllables:3},{name:"Sprinkle",reg:"food",syllables:2},{name:"Hundreds",reg:"food",syllables:2},{name:"Thousands",reg:"food",syllables:2}]
}
};

// ── DOG WORDS ──────────────────────────────────────────────────────────────────
const DOG_WORDS: Record<string, {word:string,reg:Register,firstLetter:string}[]> = {
  collie: [{word:"Stalk",reg:"nature",firstLetter:"s"},{word:"Crouch",reg:"nature",firstLetter:"c"},{word:"Focus",reg:"nature",firstLetter:"f"},{word:"Watch",reg:"nature",firstLetter:"w"},{word:"Drive",reg:"nature",firstLetter:"d"},{word:"Guide",reg:"nature",firstLetter:"g"},{word:"Nip",reg:"chaos",firstLetter:"n"},{word:"Fetch",reg:"nature",firstLetter:"f"},{word:"Chase",reg:"chaos",firstLetter:"c"},{word:"Cut",reg:"chaos",firstLetter:"c"},{word:"Sweep",reg:"chaos",firstLetter:"s"},{word:"Flank",reg:"nature",firstLetter:"f"},{word:"Pace",reg:"chaos",firstLetter:"p"},{word:"Guard",reg:"grand",firstLetter:"g"},{word:"Corner",reg:"chaos",firstLetter:"c"},{word:"Signal",reg:"nature",firstLetter:"s"},{word:"Listen",reg:"nature",firstLetter:"l"},{word:"Command",reg:"grand",firstLetter:"c"},{word:"Shep",reg:"nature",firstLetter:"s"},{word:"Herd",reg:"nature",firstLetter:"h"},{word:"Weave",reg:"nature",firstLetter:"w"},{word:"Circle",reg:"nature",firstLetter:"c"},{word:"Sprint",reg:"chaos",firstLetter:"s"},{word:"Dart",reg:"chaos",firstLetter:"d"},{word:"Dash",reg:"chaos",firstLetter:"d"},{word:"Track",reg:"nature",firstLetter:"t"},{word:"Patrol",reg:"grand",firstLetter:"p"},{word:"Border",reg:"nature",firstLetter:"b"}],
  spaniel: [{word:"Flush",reg:"nature",firstLetter:"f"},{word:"Fetch",reg:"nature",firstLetter:"f"},{word:"Waggle",reg:"chaos",firstLetter:"w"},{word:"Splash",reg:"chaos",firstLetter:"s"},{word:"Frolic",reg:"chaos",firstLetter:"f"},{word:"Gambol",reg:"chaos",firstLetter:"g"},{word:"Prance",reg:"chaos",firstLetter:"p"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Romp",reg:"chaos",firstLetter:"r"},{word:"Sniff",reg:"nature",firstLetter:"s"},{word:"Paddle",reg:"chaos",firstLetter:"p"},{word:"Wiggle",reg:"chaos",firstLetter:"w"},{word:"Swoop",reg:"chaos",firstLetter:"s"},{word:"Nose",reg:"nature",firstLetter:"n"},{word:"Seek",reg:"nature",firstLetter:"s"},{word:"Trail",reg:"nature",firstLetter:"t"},{word:"Rustle",reg:"chaos",firstLetter:"r"},{word:"Pounce",reg:"chaos",firstLetter:"p"},{word:"Bounce",reg:"chaos",firstLetter:"b"},{word:"Explore",reg:"chaos",firstLetter:"e"},{word:"Snuffle",reg:"chaos",firstLetter:"s"},{word:"Trot",reg:"chaos",firstLetter:"t"},{word:"Dive",reg:"chaos",firstLetter:"d"},{word:"Skitter",reg:"chaos",firstLetter:"s"},{word:"Carry",reg:"nature",firstLetter:"c"}],
  boxer: [{word:"Pounce",reg:"chaos",firstLetter:"p"},{word:"Spring",reg:"chaos",firstLetter:"s"},{word:"Leap",reg:"chaos",firstLetter:"l"},{word:"Hop",reg:"chaos",firstLetter:"h"},{word:"Boing",reg:"chaos",firstLetter:"b"},{word:"Wrestle",reg:"chaos",firstLetter:"w"},{word:"Tussle",reg:"chaos",firstLetter:"t"},{word:"Spar",reg:"chaos",firstLetter:"s"},{word:"Guard",reg:"grand",firstLetter:"g"},{word:"Strut",reg:"chaos",firstLetter:"s"},{word:"Snort",reg:"chaos",firstLetter:"s"},{word:"Huff",reg:"chaos",firstLetter:"h"},{word:"Snuffle",reg:"chaos",firstLetter:"s"},{word:"Grumble",reg:"chaos",firstLetter:"g"},{word:"Bop",reg:"chaos",firstLetter:"b"},{word:"Butt",reg:"chaos",firstLetter:"b"},{word:"Nudge",reg:"chaos",firstLetter:"n"},{word:"Zoom",reg:"chaos",firstLetter:"z"},{word:"Clatter",reg:"chaos",firstLetter:"c"},{word:"Gallop",reg:"chaos",firstLetter:"g"},{word:"Barrel",reg:"chaos",firstLetter:"b"},{word:"Shove",reg:"chaos",firstLetter:"s"},{word:"Skid",reg:"chaos",firstLetter:"s"},{word:"Slam",reg:"chaos",firstLetter:"s"},{word:"Jolt",reg:"chaos",firstLetter:"j"},{word:"Swagger",reg:"grand",firstLetter:"s"},{word:"Puff",reg:"chaos",firstLetter:"p"},{word:"Hurtle",reg:"chaos",firstLetter:"h"},{word:"Play",reg:"chaos",firstLetter:"p"},{word:"Clown",reg:"chaos",firstLetter:"c"},{word:"Wiggle",reg:"chaos",firstLetter:"w"},{word:"Lunge",reg:"chaos",firstLetter:"l"},{word:"Snore",reg:"chaos",firstLetter:"s"},{word:"Sniff",reg:"nature",firstLetter:"s"},{word:"Wag",reg:"nature",firstLetter:"w"},{word:"Thump",reg:"chaos",firstLetter:"t"},{word:"Bowl",reg:"chaos",firstLetter:"b"},{word:"Romp",reg:"chaos",firstLetter:"r"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Punch",reg:"chaos",firstLetter:"p"},{word:"Jab",reg:"chaos",firstLetter:"j"},{word:"Bounce",reg:"chaos",firstLetter:"b"},{word:"Charge",reg:"chaos",firstLetter:"c"},{word:"Stomp",reg:"chaos",firstLetter:"s"},{word:"Rumble",reg:"chaos",firstLetter:"r"},{word:"Crash",reg:"chaos",firstLetter:"c"},{word:"Thud",reg:"chaos",firstLetter:"t"},{word:"Barge",reg:"chaos",firstLetter:"b"},{word:"Bluster",reg:"chaos",firstLetter:"b"}],
  sniffer: [{word:"Sniff",reg:"nature",firstLetter:"s"},{word:"Sleuth",reg:"chaos",firstLetter:"s"},{word:"Hunt",reg:"nature",firstLetter:"h"},{word:"Nose",reg:"nature",firstLetter:"n"},{word:"Track",reg:"nature",firstLetter:"t"},{word:"Scout",reg:"nature",firstLetter:"s"},{word:"Trace",reg:"chaos",firstLetter:"t"},{word:"Hound",reg:"chaos",firstLetter:"h"},{word:"Quest",reg:"chaos",firstLetter:"q"},{word:"Find",reg:"nature",firstLetter:"f"},{word:"Snuffle",reg:"chaos",firstLetter:"s"},{word:"Snout",reg:"chaos",firstLetter:"s"},{word:"Scent",reg:"nature",firstLetter:"s"},{word:"Trail",reg:"nature",firstLetter:"t"},{word:"Follow",reg:"nature",firstLetter:"f"},{word:"Sniffle",reg:"chaos",firstLetter:"s"},{word:"Seek",reg:"nature",firstLetter:"s"},{word:"Search",reg:"chaos",firstLetter:"s"},{word:"Detect",reg:"nature",firstLetter:"d"},{word:"Pursue",reg:"grand",firstLetter:"p"},{word:"Snare",reg:"chaos",firstLetter:"s"},{word:"Roam",reg:"nature",firstLetter:"r"},{word:"Snort",reg:"chaos",firstLetter:"s"},{word:"Prowl",reg:"chaos",firstLetter:"p"},{word:"Probe",reg:"chaos",firstLetter:"p"},{word:"Snoop",reg:"chaos",firstLetter:"s"},{word:"Wander",reg:"chaos",firstLetter:"w"},{word:"Locate",reg:"chaos",firstLetter:"l"},{word:"Spy",reg:"chaos",firstLetter:"s"},{word:"Rootle",reg:"chaos",firstLetter:"r"},{word:"Rummage",reg:"chaos",firstLetter:"r"}],
  afghan: [{word:"Glide",reg:"grand",firstLetter:"g"},{word:"Sweep",reg:"chaos",firstLetter:"s"},{word:"Flow",reg:"nature",firstLetter:"f"},{word:"Drift",reg:"nature",firstLetter:"d"},{word:"Surge",reg:"grand",firstLetter:"s"},{word:"Race",reg:"chaos",firstLetter:"r"},{word:"Flash",reg:"chaos",firstLetter:"f"},{word:"Skim",reg:"nature",firstLetter:"s"},{word:"Streak",reg:"chaos",firstLetter:"s"},{word:"Soar",reg:"grand",firstLetter:"s"},{word:"Float",reg:"nature",firstLetter:"f"},{word:"Stream",reg:"nature",firstLetter:"s"},{word:"Ripple",reg:"nature",firstLetter:"r"},{word:"Whirl",reg:"chaos",firstLetter:"w"},{word:"Sail",reg:"nature",firstLetter:"s"},{word:"Feather",reg:"nature",firstLetter:"f"},{word:"Flicker",reg:"chaos",firstLetter:"f"},{word:"Stride",reg:"grand",firstLetter:"s"},{word:"Prance",reg:"chaos",firstLetter:"p"},{word:"Swish",reg:"chaos",firstLetter:"s"},{word:"Shimmer",reg:"chaos",firstLetter:"s"},{word:"Dash",reg:"chaos",firstLetter:"d"},{word:"Lilt",reg:"chaos",firstLetter:"l"},{word:"Breeze",reg:"nature",firstLetter:"b"},{word:"Curve",reg:"chaos",firstLetter:"c"},{word:"Trail",reg:"nature",firstLetter:"t"},{word:"Whisk",reg:"chaos",firstLetter:"w"},{word:"Wisp",reg:"nature",firstLetter:"w"},{word:"Fly",reg:"nature",firstLetter:"f"},{word:"Chase",reg:"chaos",firstLetter:"c"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Cruise",reg:"chaos",firstLetter:"c"}],
  sighthound: [{word:"Sprint",reg:"chaos",firstLetter:"s"},{word:"Dart",reg:"chaos",firstLetter:"d"},{word:"Bolt",reg:"chaos",firstLetter:"b"},{word:"Flash",reg:"chaos",firstLetter:"f"},{word:"Streak",reg:"chaos",firstLetter:"s"},{word:"Glide",reg:"grand",firstLetter:"g"},{word:"Scorch",reg:"chaos",firstLetter:"s"},{word:"Race",reg:"chaos",firstLetter:"r"},{word:"Sweep",reg:"chaos",firstLetter:"s"},{word:"Dash",reg:"chaos",firstLetter:"d"},{word:"Chase",reg:"chaos",firstLetter:"c"},{word:"Hurtle",reg:"chaos",firstLetter:"h"},{word:"Zoom",reg:"chaos",firstLetter:"z"},{word:"Stream",reg:"nature",firstLetter:"s"},{word:"Slice",reg:"chaos",firstLetter:"s"},{word:"Arrow",reg:"chaos",firstLetter:"a"},{word:"Whip",reg:"chaos",firstLetter:"w"},{word:"Zip",reg:"chaos",firstLetter:"z"},{word:"Surge",reg:"grand",firstLetter:"s"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Leap",reg:"chaos",firstLetter:"l"},{word:"Lunge",reg:"chaos",firstLetter:"l"},{word:"Pace",reg:"chaos",firstLetter:"p"},{word:"Stride",reg:"grand",firstLetter:"s"},{word:"Cruise",reg:"chaos",firstLetter:"c"},{word:"Drift",reg:"nature",firstLetter:"d"},{word:"Float",reg:"nature",firstLetter:"f"},{word:"Flow",reg:"nature",firstLetter:"f"},{word:"Swoop",reg:"chaos",firstLetter:"s"},{word:"Curve",reg:"chaos",firstLetter:"c"},{word:"Arc",reg:"chaos",firstLetter:"a"},{word:"Cut",reg:"chaos",firstLetter:"c"},{word:"Pursue",reg:"grand",firstLetter:"p"},{word:"Course",reg:"chaos",firstLetter:"c"},{word:"Blaze",reg:"grand",firstLetter:"b"},{word:"Shoot",reg:"chaos",firstLetter:"s"}],
  greatdane: [{word:"Orbit",reg:"grand",firstLetter:"o"},{word:"Soar",reg:"grand",firstLetter:"s"},{word:"Surge",reg:"grand",firstLetter:"s"},{word:"Blaze",reg:"grand",firstLetter:"b"},{word:"Streak",reg:"chaos",firstLetter:"s"},{word:"Thunder",reg:"grand",firstLetter:"t"},{word:"Stomp",reg:"chaos",firstLetter:"s"},{word:"Lumber",reg:"chaos",firstLetter:"l"},{word:"Loom",reg:"grand",firstLetter:"l"},{word:"Stride",reg:"grand",firstLetter:"s"},{word:"Tower",reg:"grand",firstLetter:"t"},{word:"Gallop",reg:"chaos",firstLetter:"g"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Boom",reg:"chaos",firstLetter:"b"},{word:"Thump",reg:"chaos",firstLetter:"t"},{word:"Titan",reg:"grand",firstLetter:"t"},{word:"Giant",reg:"grand",firstLetter:"g"},{word:"Regal",reg:"grand",firstLetter:"r"},{word:"Guard",reg:"grand",firstLetter:"g"},{word:"Heave",reg:"chaos",firstLetter:"h"},{word:"Plod",reg:"chaos",firstLetter:"p"},{word:"Barrel",reg:"chaos",firstLetter:"b"},{word:"Swagger",reg:"grand",firstLetter:"s"},{word:"Rise",reg:"chaos",firstLetter:"r"},{word:"Stretch",reg:"chaos",firstLetter:"s"},{word:"Gaze",reg:"chaos",firstLetter:"g"},{word:"Roam",reg:"nature",firstLetter:"r"},{word:"Crash",reg:"chaos",firstLetter:"c"},{word:"Quake",reg:"chaos",firstLetter:"q"},{word:"Boulder",reg:"grand",firstLetter:"b"},{word:"Colossus",reg:"grand",firstLetter:"c"},{word:"Rumble",reg:"chaos",firstLetter:"r"},{word:"March",reg:"grand",firstLetter:"m"},{word:"Drift",reg:"nature",firstLetter:"d"},{word:"Crown",reg:"grand",firstLetter:"c"},{word:"Stand",reg:"chaos",firstLetter:"s"},{word:"Pace",reg:"chaos",firstLetter:"p"},{word:"Sweep",reg:"chaos",firstLetter:"s"},{word:"Thunderclap",reg:"grand",firstLetter:"t"}],
  giant: [{word:"Lumber",reg:"chaos",firstLetter:"l"},{word:"Plod",reg:"chaos",firstLetter:"p"},{word:"Stomp",reg:"chaos",firstLetter:"s"},{word:"Thud",reg:"chaos",firstLetter:"t"},{word:"Rumble",reg:"chaos",firstLetter:"r"},{word:"Sway",reg:"chaos",firstLetter:"s"},{word:"Loom",reg:"grand",firstLetter:"l"},{word:"Thunder",reg:"grand",firstLetter:"t"},{word:"Shamble",reg:"chaos",firstLetter:"s"},{word:"Quake",reg:"chaos",firstLetter:"q"},{word:"Heave",reg:"chaos",firstLetter:"h"},{word:"Haul",reg:"chaos",firstLetter:"h"},{word:"Trudge",reg:"chaos",firstLetter:"t"},{word:"Trample",reg:"chaos",firstLetter:"t"},{word:"Grumble",reg:"chaos",firstLetter:"g"},{word:"Boom",reg:"chaos",firstLetter:"b"},{word:"Bellow",reg:"chaos",firstLetter:"b"},{word:"Snort",reg:"chaos",firstLetter:"s"},{word:"Huff",reg:"chaos",firstLetter:"h"},{word:"Snuffle",reg:"chaos",firstLetter:"s"},{word:"Snore",reg:"chaos",firstLetter:"s"},{word:"Drool",reg:"food",firstLetter:"d"},{word:"Slobber",reg:"food",firstLetter:"s"},{word:"Guard",reg:"grand",firstLetter:"g"},{word:"Watch",reg:"nature",firstLetter:"w"},{word:"Stand",reg:"chaos",firstLetter:"s"},{word:"Brace",reg:"chaos",firstLetter:"b"},{word:"Block",reg:"chaos",firstLetter:"b"},{word:"Shove",reg:"chaos",firstLetter:"s"},{word:"Barge",reg:"chaos",firstLetter:"b"},{word:"Waddle",reg:"chaos",firstLetter:"w"},{word:"Shuffle",reg:"chaos",firstLetter:"s"},{word:"Hunker",reg:"chaos",firstLetter:"h"},{word:"Settle",reg:"chaos",firstLetter:"s"},{word:"Sprawl",reg:"chaos",firstLetter:"s"},{word:"Doze",reg:"chaos",firstLetter:"d"},{word:"Slump",reg:"chaos",firstLetter:"s"},{word:"Sag",reg:"chaos",firstLetter:"s"},{word:"Yawn",reg:"chaos",firstLetter:"y"},{word:"Grunt",reg:"chaos",firstLetter:"g"}],
  poodle: [{word:"Prance",reg:"chaos",firstLetter:"p"},{word:"Strut",reg:"chaos",firstLetter:"s"},{word:"Waltz",reg:"grand",firstLetter:"w"},{word:"Glide",reg:"grand",firstLetter:"g"},{word:"Mince",reg:"chaos",firstLetter:"m"},{word:"Flourish",reg:"grand",firstLetter:"f"},{word:"Pirouette",reg:"grand",firstLetter:"p"},{word:"Pose",reg:"chaos",firstLetter:"p"},{word:"Primp",reg:"chaos",firstLetter:"p"},{word:"Twirl",reg:"chaos",firstLetter:"t"},{word:"Preen",reg:"chaos",firstLetter:"p"},{word:"Flounce",reg:"chaos",firstLetter:"f"},{word:"Parade",reg:"grand",firstLetter:"p"},{word:"Swish",reg:"chaos",firstLetter:"s"},{word:"Sparkle",reg:"chaos",firstLetter:"s"},{word:"Fancy",reg:"chaos",firstLetter:"f"},{word:"Curl",reg:"chaos",firstLetter:"c"},{word:"Bounce",reg:"chaos",firstLetter:"b"},{word:"Trot",reg:"chaos",firstLetter:"t"},{word:"Clip",reg:"chaos",firstLetter:"c"},{word:"Groom",reg:"chaos",firstLetter:"g"},{word:"Puff",reg:"chaos",firstLetter:"p"},{word:"Plume",reg:"chaos",firstLetter:"p"},{word:"Frill",reg:"chaos",firstLetter:"f"},{word:"Swirl",reg:"chaos",firstLetter:"s"},{word:"Dazzle",reg:"grand",firstLetter:"d"},{word:"Skip",reg:"chaos",firstLetter:"s"},{word:"Show",reg:"grand",firstLetter:"s"},{word:"Charm",reg:"grand",firstLetter:"c"},{word:"Shine",reg:"grand",firstLetter:"s"},{word:"Flaunt",reg:"grand",firstLetter:"f"},{word:"Dance",reg:"chaos",firstLetter:"d"},{word:"Twinkle",reg:"grand",firstLetter:"t"},{word:"Poise",reg:"grand",firstLetter:"p"},{word:"Prim",reg:"chaos",firstLetter:"p"},{word:"Froufrou",reg:"chaos",firstLetter:"f"},{word:"Fluff",reg:"chaos",firstLetter:"f"}],
  lapdog: [{word:"Prance",reg:"chaos",firstLetter:"p"},{word:"Bounce",reg:"chaos",firstLetter:"b"},{word:"Waltz",reg:"grand",firstLetter:"w"},{word:"Flounce",reg:"chaos",firstLetter:"f"},{word:"Fluff",reg:"chaos",firstLetter:"f"},{word:"Shimmy",reg:"chaos",firstLetter:"s"},{word:"Pamper",reg:"chaos",firstLetter:"p"},{word:"Flutter",reg:"chaos",firstLetter:"f"},{word:"Sparkle",reg:"chaos",firstLetter:"s"},{word:"Snuggle",reg:"chaos",firstLetter:"s"},{word:"Cuddle",reg:"chaos",firstLetter:"c"},{word:"Perch",reg:"chaos",firstLetter:"p"},{word:"Preen",reg:"chaos",firstLetter:"p"},{word:"Twirl",reg:"chaos",firstLetter:"t"},{word:"Wiggle",reg:"chaos",firstLetter:"w"},{word:"Skip",reg:"chaos",firstLetter:"s"},{word:"Dainty",reg:"chaos",firstLetter:"d"},{word:"Trinket",reg:"chaos",firstLetter:"t"},{word:"Charm",reg:"grand",firstLetter:"c"},{word:"Coax",reg:"chaos",firstLetter:"c"},{word:"Beg",reg:"chaos",firstLetter:"b"},{word:"Nuzzle",reg:"chaos",firstLetter:"n"},{word:"Nestle",reg:"chaos",firstLetter:"n"},{word:"Doze",reg:"chaos",firstLetter:"d"},{word:"Snooze",reg:"chaos",firstLetter:"s"},{word:"Yip",reg:"chaos",firstLetter:"y"},{word:"Yap",reg:"chaos",firstLetter:"y"},{word:"Puff",reg:"chaos",firstLetter:"p"},{word:"Prim",reg:"chaos",firstLetter:"p"},{word:"Pose",reg:"chaos",firstLetter:"p"},{word:"Pout",reg:"chaos",firstLetter:"p"},{word:"Fidget",reg:"chaos",firstLetter:"f"},{word:"Flit",reg:"chaos",firstLetter:"f"},{word:"Glimmer",reg:"chaos",firstLetter:"g"},{word:"Dote",reg:"chaos",firstLetter:"d"},{word:"Spoil",reg:"chaos",firstLetter:"s"},{word:"Fuss",reg:"chaos",firstLetter:"f"}],
  boston: [{word:"Scrap",reg:"chaos",firstLetter:"s"},{word:"Hustle",reg:"chaos",firstLetter:"h"},{word:"Brawl",reg:"chaos",firstLetter:"b"},{word:"Charge",reg:"chaos",firstLetter:"c"},{word:"Dodge",reg:"chaos",firstLetter:"d"},{word:"Rattle",reg:"chaos",firstLetter:"r"},{word:"Jabber",reg:"chaos",firstLetter:"j"},{word:"Strut",reg:"chaos",firstLetter:"s"},{word:"March",reg:"grand",firstLetter:"m"},{word:"Bluster",reg:"chaos",firstLetter:"b"},{word:"Box",reg:"chaos",firstLetter:"b"},{word:"Bob",reg:"chaos",firstLetter:"b"},{word:"Weave",reg:"nature",firstLetter:"w"},{word:"Skitter",reg:"chaos",firstLetter:"s"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Zip",reg:"chaos",firstLetter:"z"},{word:"Zoom",reg:"chaos",firstLetter:"z"},{word:"Scoot",reg:"chaos",firstLetter:"s"},{word:"Swagger",reg:"grand",firstLetter:"s"},{word:"Snort",reg:"chaos",firstLetter:"s"},{word:"Huff",reg:"chaos",firstLetter:"h"},{word:"Snuffle",reg:"chaos",firstLetter:"s"},{word:"Grin",reg:"chaos",firstLetter:"g"},{word:"Goggle",reg:"chaos",firstLetter:"g"},{word:"Wink",reg:"chaos",firstLetter:"w"},{word:"Clatter",reg:"chaos",firstLetter:"c"},{word:"Trot",reg:"chaos",firstLetter:"t"},{word:"Jolt",reg:"chaos",firstLetter:"j"},{word:"Jab",reg:"chaos",firstLetter:"j"},{word:"Spar",reg:"chaos",firstLetter:"s"},{word:"Tussle",reg:"chaos",firstLetter:"t"},{word:"Nudge",reg:"chaos",firstLetter:"n"},{word:"Barge",reg:"chaos",firstLetter:"b"},{word:"Clown",reg:"chaos",firstLetter:"c"},{word:"Chatter",reg:"chaos",firstLetter:"c"}],
  corgi: [{word:"Herd",reg:"nature",firstLetter:"h"},{word:"Drive",reg:"nature",firstLetter:"d"},{word:"Round",reg:"chaos",firstLetter:"r"},{word:"Steer",reg:"chaos",firstLetter:"s"},{word:"Trot",reg:"chaos",firstLetter:"t"},{word:"Gather",reg:"chaos",firstLetter:"g"},{word:"Chase",reg:"chaos",firstLetter:"c"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Nip",reg:"chaos",firstLetter:"n"},{word:"Waddle",reg:"chaos",firstLetter:"w"},{word:"Scurry",reg:"chaos",firstLetter:"s"},{word:"Scoot",reg:"chaos",firstLetter:"s"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Patrol",reg:"grand",firstLetter:"p"},{word:"Circle",reg:"nature",firstLetter:"c"},{word:"Weave",reg:"nature",firstLetter:"w"},{word:"Watch",reg:"nature",firstLetter:"w"},{word:"Guard",reg:"grand",firstLetter:"g"},{word:"Hustle",reg:"chaos",firstLetter:"h"},{word:"Dart",reg:"chaos",firstLetter:"d"},{word:"Dash",reg:"chaos",firstLetter:"d"},{word:"Shuffle",reg:"chaos",firstLetter:"s"},{word:"Tootle",reg:"chaos",firstLetter:"t"},{word:"Wiggle",reg:"chaos",firstLetter:"w"},{word:"Nudge",reg:"chaos",firstLetter:"n"},{word:"Bump",reg:"chaos",firstLetter:"b"},{word:"Bark",reg:"chaos",firstLetter:"b"},{word:"Boss",reg:"chaos",firstLetter:"b"},{word:"Command",reg:"grand",firstLetter:"c"},{word:"Muster",reg:"grand",firstLetter:"m"},{word:"Trail",reg:"nature",firstLetter:"t"},{word:"Flank",reg:"nature",firstLetter:"f"},{word:"Corner",reg:"chaos",firstLetter:"c"},{word:"Fetch",reg:"nature",firstLetter:"f"},{word:"Sprint",reg:"chaos",firstLetter:"s"},{word:"Paddle",reg:"chaos",firstLetter:"p"},{word:"Sploot",reg:"chaos",firstLetter:"s"},{word:"Stump",reg:"chaos",firstLetter:"s"}],
  terrier: [{word:"Dig",reg:"chaos",firstLetter:"d"},{word:"Bolt",reg:"chaos",firstLetter:"b"},{word:"Scrap",reg:"chaos",firstLetter:"s"},{word:"Yap",reg:"chaos",firstLetter:"y"},{word:"Nip",reg:"chaos",firstLetter:"n"},{word:"Dart",reg:"chaos",firstLetter:"d"},{word:"Chase",reg:"chaos",firstLetter:"c"},{word:"Scratch",reg:"chaos",firstLetter:"s"},{word:"Rattle",reg:"chaos",firstLetter:"r"},{word:"Snap",reg:"chaos",firstLetter:"s"},{word:"Burrow",reg:"chaos",firstLetter:"b"},{word:"Tunnel",reg:"chaos",firstLetter:"t"},{word:"Scrabble",reg:"chaos",firstLetter:"s"},{word:"Scurry",reg:"chaos",firstLetter:"s"},{word:"Pounce",reg:"chaos",firstLetter:"p"},{word:"Skitter",reg:"chaos",firstLetter:"s"},{word:"Sniff",reg:"nature",firstLetter:"s"},{word:"Snoop",reg:"chaos",firstLetter:"s"},{word:"Snarl",reg:"chaos",firstLetter:"s"},{word:"Bark",reg:"chaos",firstLetter:"b"},{word:"Bounce",reg:"chaos",firstLetter:"b"},{word:"Wrestle",reg:"chaos",firstLetter:"w"},{word:"Tussle",reg:"chaos",firstLetter:"t"},{word:"Tug",reg:"chaos",firstLetter:"t"},{word:"Shake",reg:"chaos",firstLetter:"s"},{word:"Rummage",reg:"chaos",firstLetter:"r"},{word:"Hustle",reg:"chaos",firstLetter:"h"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Spring",reg:"chaos",firstLetter:"s"},{word:"Patter",reg:"chaos",firstLetter:"p"},{word:"Clatter",reg:"chaos",firstLetter:"c"},{word:"Prowl",reg:"chaos",firstLetter:"p"},{word:"Guard",reg:"grand",firstLetter:"g"},{word:"Challenge",reg:"chaos",firstLetter:"c"},{word:"Patrol",reg:"grand",firstLetter:"p"},{word:"Grit",reg:"chaos",firstLetter:"g"},{word:"Spark",reg:"chaos",firstLetter:"s"}],
  dachshund: [{word:"Dig",reg:"chaos",firstLetter:"d"},{word:"Tunnel",reg:"chaos",firstLetter:"t"},{word:"Burrow",reg:"chaos",firstLetter:"b"},{word:"Sniff",reg:"nature",firstLetter:"s"},{word:"Waddle",reg:"chaos",firstLetter:"w"},{word:"Scuttle",reg:"chaos",firstLetter:"s"},{word:"Wriggle",reg:"chaos",firstLetter:"w"},{word:"Plod",reg:"chaos",firstLetter:"p"},{word:"Nose",reg:"nature",firstLetter:"n"},{word:"Stretch",reg:"chaos",firstLetter:"s"},{word:"Scrabble",reg:"chaos",firstLetter:"s"},{word:"Scoot",reg:"chaos",firstLetter:"s"},{word:"Shuffle",reg:"chaos",firstLetter:"s"},{word:"Wiggle",reg:"chaos",firstLetter:"w"},{word:"Creep",reg:"chaos",firstLetter:"c"},{word:"Crawl",reg:"chaos",firstLetter:"c"},{word:"Poke",reg:"chaos",firstLetter:"p"},{word:"Probe",reg:"chaos",firstLetter:"p"},{word:"Trail",reg:"nature",firstLetter:"t"},{word:"Track",reg:"nature",firstLetter:"t"},{word:"Scent",reg:"nature",firstLetter:"s"},{word:"Snuffle",reg:"chaos",firstLetter:"s"},{word:"Rummage",reg:"chaos",firstLetter:"r"},{word:"Squeeze",reg:"chaos",firstLetter:"s"},{word:"Squirm",reg:"chaos",firstLetter:"s"},{word:"Twist",reg:"chaos",firstLetter:"t"},{word:"Tootle",reg:"chaos",firstLetter:"t"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Scurry",reg:"chaos",firstLetter:"s"},{word:"Patter",reg:"chaos",firstLetter:"p"},{word:"Paddle",reg:"chaos",firstLetter:"p"},{word:"Sprawl",reg:"chaos",firstLetter:"s"},{word:"Curl",reg:"chaos",firstLetter:"c"},{word:"Grumble",reg:"chaos",firstLetter:"g"},{word:"Bark",reg:"chaos",firstLetter:"b"},{word:"Boss",reg:"chaos",firstLetter:"b"},{word:"Brave",reg:"chaos",firstLetter:"b"}],
  german: [{word:"Guard",reg:"grand",firstLetter:"g"},{word:"Patrol",reg:"grand",firstLetter:"p"},{word:"March",reg:"grand",firstLetter:"m"},{word:"Track",reg:"nature",firstLetter:"t"},{word:"Hunt",reg:"nature",firstLetter:"h"},{word:"Search",reg:"chaos",firstLetter:"s"},{word:"Charge",reg:"chaos",firstLetter:"c"},{word:"Defend",reg:"grand",firstLetter:"d"},{word:"Pursue",reg:"grand",firstLetter:"p"},{word:"Breach",reg:"chaos",firstLetter:"b"},{word:"Watch",reg:"nature",firstLetter:"w"},{word:"Work",reg:"chaos",firstLetter:"w"},{word:"Serve",reg:"chaos",firstLetter:"s"},{word:"Shield",reg:"chaos",firstLetter:"s"},{word:"Stand",reg:"chaos",firstLetter:"s"},{word:"Brace",reg:"chaos",firstLetter:"b"},{word:"Hold",reg:"chaos",firstLetter:"h"},{word:"Stalk",reg:"nature",firstLetter:"s"},{word:"Scout",reg:"nature",firstLetter:"s"},{word:"Detect",reg:"nature",firstLetter:"d"},{word:"Follow",reg:"nature",firstLetter:"f"},{word:"Trail",reg:"nature",firstLetter:"t"},{word:"Scent",reg:"nature",firstLetter:"s"},{word:"Retrieve",reg:"nature",firstLetter:"r"},{word:"Herd",reg:"nature",firstLetter:"h"},{word:"Drive",reg:"nature",firstLetter:"d"},{word:"Obey",reg:"chaos",firstLetter:"o"},{word:"Command",reg:"grand",firstLetter:"c"},{word:"Attack",reg:"chaos",firstLetter:"a"},{word:"Strike",reg:"chaos",firstLetter:"s"},{word:"Leap",reg:"chaos",firstLetter:"l"},{word:"Sprint",reg:"chaos",firstLetter:"s"},{word:"Lunge",reg:"chaos",firstLetter:"l"},{word:"Grip",reg:"chaos",firstLetter:"g"},{word:"Haul",reg:"chaos",firstLetter:"h"},{word:"Pull",reg:"chaos",firstLetter:"p"},{word:"Haunt",reg:"chaos",firstLetter:"h"},{word:"Roam",reg:"nature",firstLetter:"r"},{word:"Assert",reg:"grand",firstLetter:"a"},{word:"Muster",reg:"grand",firstLetter:"m"}],
  bulldog: [{word:"Snuffle",reg:"chaos",firstLetter:"s"},{word:"Snore",reg:"chaos",firstLetter:"s"},{word:"Drool",reg:"food",firstLetter:"d"},{word:"Slobber",reg:"food",firstLetter:"s"},{word:"Puff",reg:"chaos",firstLetter:"p"},{word:"Huff",reg:"chaos",firstLetter:"h"},{word:"Pant",reg:"chaos",firstLetter:"p"},{word:"Gruntle",reg:"chaos",firstLetter:"g"},{word:"Wobble",reg:"chaos",firstLetter:"w"},{word:"Sway",reg:"chaos",firstLetter:"s"},{word:"Squat",reg:"chaos",firstLetter:"s"},{word:"Hunker",reg:"chaos",firstLetter:"h"},{word:"Slump",reg:"chaos",firstLetter:"s"},{word:"Sprawl",reg:"chaos",firstLetter:"s"},{word:"Doze",reg:"chaos",firstLetter:"d"},{word:"Snooze",reg:"chaos",firstLetter:"s"},{word:"Squish",reg:"chaos",firstLetter:"s"},{word:"Squash",reg:"chaos",firstLetter:"s"},{word:"Roll",reg:"chaos",firstLetter:"r"},{word:"Bump",reg:"chaos",firstLetter:"b"},{word:"Butt",reg:"chaos",firstLetter:"b"},{word:"Shove",reg:"chaos",firstLetter:"s"},{word:"Nudge",reg:"chaos",firstLetter:"n"},{word:"Bowl",reg:"chaos",firstLetter:"b"},{word:"Stump",reg:"chaos",firstLetter:"s"},{word:"Scoot",reg:"chaos",firstLetter:"s"},{word:"Clomp",reg:"chaos",firstLetter:"c"},{word:"Slouch",reg:"chaos",firstLetter:"s"},{word:"Yawn",reg:"chaos",firstLetter:"y"},{word:"Settle",reg:"chaos",firstLetter:"s"},{word:"Waddle",reg:"chaos",firstLetter:"w"},{word:"Shuffle",reg:"chaos",firstLetter:"s"},{word:"Lumber",reg:"chaos",firstLetter:"l"},{word:"Plod",reg:"chaos",firstLetter:"p"},{word:"Trundle",reg:"chaos",firstLetter:"t"},{word:"Grunt",reg:"chaos",firstLetter:"g"},{word:"Snort",reg:"chaos",firstLetter:"s"},{word:"Grumble",reg:"chaos",firstLetter:"g"},{word:"Heave",reg:"chaos",firstLetter:"h"},{word:"Barge",reg:"chaos",firstLetter:"b"}],
  dalmatian: [{word:"Dash",reg:"chaos",firstLetter:"d"},{word:"Sprint",reg:"chaos",firstLetter:"s"},{word:"Streak",reg:"chaos",firstLetter:"s"},{word:"Bolt",reg:"chaos",firstLetter:"b"},{word:"Flash",reg:"chaos",firstLetter:"f"},{word:"Race",reg:"chaos",firstLetter:"r"},{word:"Chase",reg:"chaos",firstLetter:"c"},{word:"Blaze",reg:"grand",firstLetter:"b"},{word:"Thunder",reg:"grand",firstLetter:"t"},{word:"Charge",reg:"chaos",firstLetter:"c"},{word:"Spot",reg:"chaos",firstLetter:"s"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Leap",reg:"chaos",firstLetter:"l"},{word:"Rocket",reg:"chaos",firstLetter:"r"},{word:"Zoom",reg:"chaos",firstLetter:"z"},{word:"Trail",reg:"nature",firstLetter:"t"},{word:"Coach",reg:"grand",firstLetter:"c"},{word:"Guard",reg:"grand",firstLetter:"g"},{word:"Patrol",reg:"grand",firstLetter:"p"},{word:"Parade",reg:"grand",firstLetter:"p"},{word:"Pace",reg:"chaos",firstLetter:"p"},{word:"Trot",reg:"chaos",firstLetter:"t"},{word:"Stride",reg:"grand",firstLetter:"s"},{word:"Flicker",reg:"chaos",firstLetter:"f"},{word:"Spark",reg:"chaos",firstLetter:"s"},{word:"Flare",reg:"chaos",firstLetter:"f"},{word:"Scorch",reg:"chaos",firstLetter:"s"},{word:"Whizz",reg:"chaos",firstLetter:"w"},{word:"Zip",reg:"chaos",firstLetter:"z"},{word:"Shoot",reg:"chaos",firstLetter:"s"},{word:"Skid",reg:"chaos",firstLetter:"s"},{word:"Rush",reg:"chaos",firstLetter:"r"},{word:"Whirl",reg:"chaos",firstLetter:"w"},{word:"Fleet",reg:"chaos",firstLetter:"f"},{word:"Cruise",reg:"chaos",firstLetter:"c"},{word:"Pursue",reg:"grand",firstLetter:"p"},{word:"Run",reg:"chaos",firstLetter:"r"}],
  labradoodle: [{word:"Bounce",reg:"chaos",firstLetter:"b"},{word:"Waggle",reg:"chaos",firstLetter:"w"},{word:"Fetch",reg:"nature",firstLetter:"f"},{word:"Splosh",reg:"chaos",firstLetter:"s"},{word:"Gambol",reg:"chaos",firstLetter:"g"},{word:"Romp",reg:"chaos",firstLetter:"r"},{word:"Tumble",reg:"chaos",firstLetter:"t"},{word:"Noodle",reg:"chaos",firstLetter:"n"},{word:"Paddle",reg:"chaos",firstLetter:"p"},{word:"Frolic",reg:"chaos",firstLetter:"f"},{word:"Wiggle",reg:"chaos",firstLetter:"w"},{word:"Splash",reg:"chaos",firstLetter:"s"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Skitter",reg:"chaos",firstLetter:"s"},{word:"Scoot",reg:"chaos",firstLetter:"s"},{word:"Snuffle",reg:"chaos",firstLetter:"s"},{word:"Sniff",reg:"nature",firstLetter:"s"},{word:"Nuzzle",reg:"chaos",firstLetter:"n"},{word:"Cuddle",reg:"chaos",firstLetter:"c"},{word:"Flop",reg:"chaos",firstLetter:"f"},{word:"Flump",reg:"chaos",firstLetter:"f"},{word:"Roll",reg:"chaos",firstLetter:"r"},{word:"Wriggle",reg:"chaos",firstLetter:"w"},{word:"Zoom",reg:"chaos",firstLetter:"z"},{word:"Dash",reg:"chaos",firstLetter:"d"},{word:"Chase",reg:"chaos",firstLetter:"c"},{word:"Retrieve",reg:"nature",firstLetter:"r"},{word:"Carry",reg:"nature",firstLetter:"c"},{word:"Shake",reg:"chaos",firstLetter:"s"},{word:"Drip",reg:"chaos",firstLetter:"d"},{word:"Slurp",reg:"food",firstLetter:"s"},{word:"Gobble",reg:"food",firstLetter:"g"},{word:"Munch",reg:"food",firstLetter:"m"},{word:"Plod",reg:"chaos",firstLetter:"p"},{word:"Trot",reg:"chaos",firstLetter:"t"},{word:"Skip",reg:"chaos",firstLetter:"s"},{word:"Play",reg:"chaos",firstLetter:"p"}],
  sheepdog: [{word:"Lumber",reg:"chaos",firstLetter:"l"},{word:"Shamble",reg:"chaos",firstLetter:"s"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Wag",reg:"nature",firstLetter:"w"},{word:"Shuffle",reg:"chaos",firstLetter:"s"},{word:"Trundle",reg:"chaos",firstLetter:"t"},{word:"Amble",reg:"chaos",firstLetter:"a"},{word:"Plod",reg:"chaos",firstLetter:"p"},{word:"Mooch",reg:"chaos",firstLetter:"m"},{word:"Wobble",reg:"chaos",firstLetter:"w"},{word:"Fluff",reg:"chaos",firstLetter:"f"},{word:"Floof",reg:"chaos",firstLetter:"f"},{word:"Puff",reg:"chaos",firstLetter:"p"},{word:"Sway",reg:"chaos",firstLetter:"s"},{word:"Bobble",reg:"chaos",firstLetter:"b"},{word:"Bumble",reg:"chaos",firstLetter:"b"},{word:"Tumble",reg:"chaos",firstLetter:"t"},{word:"Roll",reg:"chaos",firstLetter:"r"},{word:"Sprawl",reg:"chaos",firstLetter:"s"},{word:"Doze",reg:"chaos",firstLetter:"d"},{word:"Snooze",reg:"chaos",firstLetter:"s"},{word:"Snuffle",reg:"chaos",firstLetter:"s"},{word:"Snort",reg:"chaos",firstLetter:"s"},{word:"Grumble",reg:"chaos",firstLetter:"g"},{word:"Gallop",reg:"chaos",firstLetter:"g"},{word:"Romp",reg:"chaos",firstLetter:"r"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Scoot",reg:"chaos",firstLetter:"s"},{word:"Waddle",reg:"chaos",firstLetter:"w"},{word:"Heave",reg:"chaos",firstLetter:"h"},{word:"Loom",reg:"grand",firstLetter:"l"},{word:"Barge",reg:"chaos",firstLetter:"b"},{word:"Bump",reg:"chaos",firstLetter:"b"},{word:"Nudge",reg:"chaos",firstLetter:"n"},{word:"Herd",reg:"nature",firstLetter:"h"},{word:"Guard",reg:"grand",firstLetter:"g"},{word:"Watch",reg:"nature",firstLetter:"w"},{word:"Drift",reg:"nature",firstLetter:"d"},{word:"Drowse",reg:"chaos",firstLetter:"d"}],
  westie: [{word:"Dig",reg:"chaos",firstLetter:"d"},{word:"Bolt",reg:"chaos",firstLetter:"b"},{word:"Scrap",reg:"chaos",firstLetter:"s"},{word:"Yap",reg:"chaos",firstLetter:"y"},{word:"Nip",reg:"chaos",firstLetter:"n"},{word:"Dart",reg:"chaos",firstLetter:"d"},{word:"Chase",reg:"chaos",firstLetter:"c"},{word:"Scratch",reg:"chaos",firstLetter:"s"},{word:"Rattle",reg:"chaos",firstLetter:"r"},{word:"Snap",reg:"chaos",firstLetter:"s"},{word:"Burrow",reg:"chaos",firstLetter:"b"},{word:"Tunnel",reg:"chaos",firstLetter:"t"},{word:"Scrabble",reg:"chaos",firstLetter:"s"},{word:"Scurry",reg:"chaos",firstLetter:"s"},{word:"Pounce",reg:"chaos",firstLetter:"p"},{word:"Skitter",reg:"chaos",firstLetter:"s"},{word:"Sniff",reg:"nature",firstLetter:"s"},{word:"Snoop",reg:"chaos",firstLetter:"s"},{word:"Snarl",reg:"chaos",firstLetter:"s"},{word:"Bark",reg:"chaos",firstLetter:"b"},{word:"Bounce",reg:"chaos",firstLetter:"b"},{word:"Wrestle",reg:"chaos",firstLetter:"w"},{word:"Tussle",reg:"chaos",firstLetter:"t"},{word:"Tug",reg:"chaos",firstLetter:"t"},{word:"Shake",reg:"chaos",firstLetter:"s"},{word:"Rummage",reg:"chaos",firstLetter:"r"},{word:"Hustle",reg:"chaos",firstLetter:"h"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Spring",reg:"chaos",firstLetter:"s"},{word:"Patter",reg:"chaos",firstLetter:"p"},{word:"Clatter",reg:"chaos",firstLetter:"c"},{word:"Prowl",reg:"chaos",firstLetter:"p"},{word:"Guard",reg:"grand",firstLetter:"g"},{word:"Challenge",reg:"chaos",firstLetter:"c"},{word:"Patrol",reg:"grand",firstLetter:"p"},{word:"Grit",reg:"chaos",firstLetter:"g"},{word:"Spark",reg:"chaos",firstLetter:"s"}],
  doodle: [{word:"Bounce",reg:"chaos",firstLetter:"b"},{word:"Waggle",reg:"chaos",firstLetter:"w"},{word:"Fetch",reg:"nature",firstLetter:"f"},{word:"Splosh",reg:"chaos",firstLetter:"s"},{word:"Gambol",reg:"chaos",firstLetter:"g"},{word:"Romp",reg:"chaos",firstLetter:"r"},{word:"Tumble",reg:"chaos",firstLetter:"t"},{word:"Noodle",reg:"chaos",firstLetter:"n"},{word:"Paddle",reg:"chaos",firstLetter:"p"},{word:"Frolic",reg:"chaos",firstLetter:"f"},{word:"Wiggle",reg:"chaos",firstLetter:"w"},{word:"Splash",reg:"chaos",firstLetter:"s"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Bound",reg:"chaos",firstLetter:"b"},{word:"Skitter",reg:"chaos",firstLetter:"s"},{word:"Scoot",reg:"chaos",firstLetter:"s"},{word:"Snuffle",reg:"chaos",firstLetter:"s"},{word:"Sniff",reg:"nature",firstLetter:"s"},{word:"Nuzzle",reg:"chaos",firstLetter:"n"},{word:"Cuddle",reg:"chaos",firstLetter:"c"},{word:"Flop",reg:"chaos",firstLetter:"f"},{word:"Flump",reg:"chaos",firstLetter:"f"},{word:"Roll",reg:"chaos",firstLetter:"r"},{word:"Wriggle",reg:"chaos",firstLetter:"w"},{word:"Zoom",reg:"chaos",firstLetter:"z"},{word:"Dash",reg:"chaos",firstLetter:"d"},{word:"Chase",reg:"chaos",firstLetter:"c"},{word:"Retrieve",reg:"nature",firstLetter:"r"},{word:"Carry",reg:"nature",firstLetter:"c"},{word:"Shake",reg:"chaos",firstLetter:"s"},{word:"Drip",reg:"chaos",firstLetter:"d"},{word:"Slurp",reg:"food",firstLetter:"s"},{word:"Gobble",reg:"food",firstLetter:"g"},{word:"Munch",reg:"food",firstLetter:"m"},{word:"Plod",reg:"chaos",firstLetter:"p"},{word:"Trot",reg:"chaos",firstLetter:"t"},{word:"Skip",reg:"chaos",firstLetter:"s"},{word:"Play",reg:"chaos",firstLetter:"p"}],
  setter: [{word:"Flush",reg:"nature",firstLetter:"f"},{word:"Fetch",reg:"nature",firstLetter:"f"},{word:"Waggle",reg:"chaos",firstLetter:"w"},{word:"Splash",reg:"chaos",firstLetter:"s"},{word:"Frolic",reg:"chaos",firstLetter:"f"},{word:"Gambol",reg:"chaos",firstLetter:"g"},{word:"Prance",reg:"chaos",firstLetter:"p"},{word:"Scamper",reg:"chaos",firstLetter:"s"},{word:"Romp",reg:"chaos",firstLetter:"r"},{word:"Sniff",reg:"nature",firstLetter:"s"},{word:"Paddle",reg:"chaos",firstLetter:"p"},{word:"Wiggle",reg:"chaos",firstLetter:"w"},{word:"Swoop",reg:"chaos",firstLetter:"s"},{word:"Nose",reg:"nature",firstLetter:"n"},{word:"Seek",reg:"nature",firstLetter:"s"},{word:"Trail",reg:"nature",firstLetter:"t"},{word:"Rustle",reg:"chaos",firstLetter:"r"},{word:"Pounce",reg:"chaos",firstLetter:"p"},{word:"Bounce",reg:"chaos",firstLetter:"b"},{word:"Explore",reg:"chaos",firstLetter:"e"},{word:"Snuffle",reg:"chaos",firstLetter:"s"},{word:"Trot",reg:"chaos",firstLetter:"t"},{word:"Dive",reg:"chaos",firstLetter:"d"},{word:"Skitter",reg:"chaos",firstLetter:"s"},{word:"Carry",reg:"nature",firstLetter:"c"}],
  asian: [{word:"Strike",reg:"grand",firstLetter:"s"},{word:"Pounce",reg:"chaos",firstLetter:"p"},{word:"Dodge",reg:"chaos",firstLetter:"d"},{word:"Prowl",reg:"grand",firstLetter:"p"},{word:"Lunge",reg:"chaos",firstLetter:"l"},{word:"Waddle",reg:"chaos",firstLetter:"w"},{word:"Tumble",reg:"chaos",firstLetter:"t"},{word:"Snort",reg:"chaos",firstLetter:"s"},{word:"Shuffle",reg:"chaos",firstLetter:"s"}],
  character: [{word:"Snort",reg:"chaos",firstLetter:"s"},{word:"Waddle",reg:"chaos",firstLetter:"w"},{word:"Tumble",reg:"chaos",firstLetter:"t"},{word:"Bumble",reg:"chaos",firstLetter:"b"},{word:"Wobble",reg:"chaos",firstLetter:"w"},{word:"Totter",reg:"chaos",firstLetter:"t"},{word:"Blunder",reg:"chaos",firstLetter:"b"},{word:"Grumble",reg:"chaos",firstLetter:"g"},{word:"Wheeze",reg:"chaos",firstLetter:"w"},{word:"Puff",reg:"chaos",firstLetter:"p"},{word:"Dawg",reg:"chaos",firstLetter:"d"}],
  default: [{word:"Trot",reg:"mundane",firstLetter:"t"},{word:"Lope",reg:"mundane",firstLetter:"l"},{word:"Prowl",reg:"grand",firstLetter:"p"},{word:"Stride",reg:"grand",firstLetter:"s"},{word:"Roam",reg:"mundane",firstLetter:"r"},{word:"Slink",reg:"aloof",firstLetter:"s"},{word:"Saunter",reg:"mundane",firstLetter:"s"},{word:"Canter",reg:"grand",firstLetter:"c"},{word:"Wander",reg:"mundane",firstLetter:"w"}]
,
  fluffy: [{word:"Fluffington",reg:"chaos",firstLetter:"f"},{word:"Puffsworth",reg:"chaos",firstLetter:"p"},{word:"Woolford",reg:"chaos",firstLetter:"w"},{word:"Cloudton",reg:"chaos",firstLetter:"c"},{word:"Plumeton",reg:"chaos",firstLetter:"p"},{word:"Pillowford",reg:"chaos",firstLetter:"p"},{word:"Silksworth",reg:"chaos",firstLetter:"s"},{word:"Frillford",reg:"chaos",firstLetter:"f"},{word:"Rufflesworth",reg:"chaos",firstLetter:"r"},{word:"Tuffleton",reg:"chaos",firstLetter:"t"},{word:"Marshmallowton",reg:"food",firstLetter:"m"},{word:"Curlsworth",reg:"chaos",firstLetter:"c"},{word:"Wavyford",reg:"chaos",firstLetter:"w"},{word:"Frizzleton",reg:"chaos",firstLetter:"f"},{word:"Bobblesworth",reg:"chaos",firstLetter:"b"},{word:"Poodlington",reg:"chaos",firstLetter:"p"},{word:"Floppington",reg:"chaos",firstLetter:"f"},{word:"Puffball",reg:"chaos",firstLetter:"p"},{word:"Puffling",reg:"chaos",firstLetter:"p"},{word:"Cottonworth",reg:"food",firstLetter:"c"},{word:"Meringueford",reg:"chaos",firstLetter:"m"},{word:"Wisperton",reg:"chaos",firstLetter:"w"},{word:"Wispford",reg:"chaos",firstLetter:"w"},{word:"Matton",reg:"chaos",firstLetter:"m"},{word:"Boingford",reg:"chaos",firstLetter:"b"},{word:"Wobbleton",reg:"chaos",firstLetter:"w"},{word:"Bobbleford",reg:"chaos",firstLetter:"b"},{word:"Pompleton",reg:"chaos",firstLetter:"p"},{word:"Flopsworth",reg:"chaos",firstLetter:"f"},{word:"Doodleton",reg:"chaos",firstLetter:"d"},{word:"Noodleton",reg:"chaos",firstLetter:"n"},{word:"Noodleford",reg:"chaos",firstLetter:"n"},{word:"Buntington",reg:"chaos",firstLetter:"b"}],
  speckled: [{word:"Freckleton",reg:"chaos",firstLetter:"f"},{word:"Spotworth",reg:"chaos",firstLetter:"s"},{word:"Patchley",reg:"chaos",firstLetter:"p"},{word:"Mottleford",reg:"chaos",firstLetter:"m"},{word:"Fleckton",reg:"chaos",firstLetter:"f"},{word:"Brindleton",reg:"chaos",firstLetter:"b"},{word:"Dottington",reg:"chaos",firstLetter:"d"},{word:"Dotsworth",reg:"chaos",firstLetter:"d"},{word:"Spottington",reg:"chaos",firstLetter:"s"},{word:"Spotford",reg:"chaos",firstLetter:"s"},{word:"Splotchton",reg:"chaos",firstLetter:"s"},{word:"Blotton",reg:"chaos",firstLetter:"b"},{word:"Marbleford",reg:"chaos",firstLetter:"m"},{word:"Marbleton",reg:"chaos",firstLetter:"m"},{word:"Piebaldton",reg:"chaos",firstLetter:"p"},{word:"Stripeton",reg:"chaos",firstLetter:"s"},{word:"Dazzleton",reg:"chaos",firstLetter:"d"},{word:"Speckleston",reg:"chaos",firstLetter:"s"},{word:"Speckleton",reg:"chaos",firstLetter:"s"},{word:"Confettiford",reg:"chaos",firstLetter:"c"},{word:"Sprinkleford",reg:"chaos",firstLetter:"s"},{word:"Starryford",reg:"chaos",firstLetter:"s"},{word:"Mosaicton",reg:"chaos",firstLetter:"m"},{word:"Patchworkton",reg:"chaos",firstLetter:"p"},{word:"Patchford",reg:"chaos",firstLetter:"p"},{word:"Patchworthington",reg:"chaos",firstLetter:"p"},{word:"Inkton",reg:"chaos",firstLetter:"i"},{word:"Blobton",reg:"chaos",firstLetter:"b"},{word:"Dotford",reg:"chaos",firstLetter:"d"}],
  scruff: [{word:"Scruffington",reg:"chaos",firstLetter:"s"},{word:"Scruffley",reg:"chaos",firstLetter:"s"},{word:"Scrubbleton",reg:"chaos",firstLetter:"s"},{word:"Ragamuffinton",reg:"chaos",firstLetter:"r"},{word:"Tattersall",reg:"chaos",firstLetter:"t"},{word:"Shaggleton",reg:"chaos",firstLetter:"s"},{word:"Shagford",reg:"chaos",firstLetter:"s"},{word:"Rufflesworth",reg:"chaos",firstLetter:"r"},{word:"Ruffton",reg:"chaos",firstLetter:"r"},{word:"Muddleton",reg:"chaos",firstLetter:"m"},{word:"Grubton",reg:"chaos",firstLetter:"g"},{word:"Muckwell",reg:"chaos",firstLetter:"m"},{word:"Muckton",reg:"chaos",firstLetter:"m"},{word:"Muckford",reg:"chaos",firstLetter:"m"},{word:"Grimton",reg:"chaos",firstLetter:"g"},{word:"Grungeford",reg:"chaos",firstLetter:"g"},{word:"Dishevelton",reg:"chaos",firstLetter:"d"},{word:"Unkempton",reg:"chaos",firstLetter:"u"},{word:"Rumpleford",reg:"chaos",firstLetter:"r"},{word:"Rascalton",reg:"chaos",firstLetter:"r"},{word:"Scampford",reg:"chaos",firstLetter:"s"},{word:"Waifton",reg:"chaos",firstLetter:"w"},{word:"Gutterton",reg:"chaos",firstLetter:"g"},{word:"Ramshackleton",reg:"chaos",firstLetter:"r"},{word:"Ramshacklewell",reg:"chaos",firstLetter:"r"},{word:"Scrumpton",reg:"chaos",firstLetter:"s"},{word:"Nimbleton",reg:"chaos",firstLetter:"n"},{word:"Nimbleford",reg:"chaos",firstLetter:"n"},{word:"Wanderton",reg:"chaos",firstLetter:"w"},{word:"Bedraggleton",reg:"chaos",firstLetter:"b"}],
  hound: [{word:"Houndsley",reg:"chaos",firstLetter:"h"},{word:"Houndsworth",reg:"grand",firstLetter:"h"},{word:"Noseworthy",reg:"grand",firstLetter:"n"},{word:"Sniffington",reg:"chaos",firstLetter:"s"},{word:"Sleuthford",reg:"chaos",firstLetter:"s"},{word:"Trackford",reg:"chaos",firstLetter:"t"},{word:"Noseton",reg:"chaos",firstLetter:"n"},{word:"Scoutford",reg:"chaos",firstLetter:"s"},{word:"Huntington",reg:"grand",firstLetter:"h"},{word:"Huntford",reg:"chaos",firstLetter:"h"},{word:"Bayton",reg:"chaos",firstLetter:"b"},{word:"Bayford",reg:"chaos",firstLetter:"b"},{word:"Bellford",reg:"chaos",firstLetter:"b"},{word:"Bellton",reg:"chaos",firstLetter:"b"},{word:"Jowlsworth",reg:"chaos",firstLetter:"j"},{word:"Jowlton",reg:"chaos",firstLetter:"j"},{word:"Longearton",reg:"chaos",firstLetter:"l"},{word:"Flopearton",reg:"chaos",firstLetter:"f"},{word:"Droopington",reg:"chaos",firstLetter:"d"},{word:"Droolsworth",reg:"chaos",firstLetter:"d"},{word:"Snoutley",reg:"chaos",firstLetter:"s"},{word:"Snoutford",reg:"chaos",firstLetter:"s"},{word:"Snouton",reg:"chaos",firstLetter:"s"},{word:"Muzzleton",reg:"chaos",firstLetter:"m"},{word:"Wrinkleton",reg:"chaos",firstLetter:"w"},{word:"Ambleston",reg:"chaos",firstLetter:"a"},{word:"Snivelton",reg:"chaos",firstLetter:"s"},{word:"Sleepyton",reg:"chaos",firstLetter:"s"},{word:"Dozington",reg:"chaos",firstLetter:"d"},{word:"Slumberton",reg:"chaos",firstLetter:"s"},{word:"Plodlington",reg:"chaos",firstLetter:"p"},{word:"Plodwell",reg:"chaos",firstLetter:"p"},{word:"Earneston",reg:"chaos",firstLetter:"e"},{word:"Bassetford",reg:"chaos",firstLetter:"b"},{word:"Beaglesworth",reg:"chaos",firstLetter:"b"},{word:"Quarryford",reg:"chaos",firstLetter:"q"},{word:"Detectington",reg:"chaos",firstLetter:"d"},{word:"Tracerton",reg:"chaos",firstLetter:"t"},{word:"Trailford",reg:"chaos",firstLetter:"t"}],
  zoom: [{word:"Zoomington",reg:"chaos",firstLetter:"z"},{word:"Zoomwell",reg:"chaos",firstLetter:"z"},{word:"Zoomford",reg:"chaos",firstLetter:"z"},{word:"Vroomton",reg:"chaos",firstLetter:"v"},{word:"Sprintford",reg:"chaos",firstLetter:"s"},{word:"Dashford",reg:"chaos",firstLetter:"d"},{word:"Flashford",reg:"chaos",firstLetter:"f"},{word:"Boltford",reg:"chaos",firstLetter:"b"},{word:"Hurtleton",reg:"chaos",firstLetter:"h"},{word:"Blurton",reg:"chaos",firstLetter:"b"},{word:"Rocketton",reg:"chaos",firstLetter:"r"},{word:"Streakford",reg:"chaos",firstLetter:"s"},{word:"Blazeford",reg:"chaos",firstLetter:"b"},{word:"Whizzton",reg:"chaos",firstLetter:"w"},{word:"Zipford",reg:"chaos",firstLetter:"z"},{word:"Quickton",reg:"chaos",firstLetter:"q"},{word:"Thunderfoot",reg:"chaos",firstLetter:"t"},{word:"Warpton",reg:"chaos",firstLetter:"w"},{word:"Fullpelton",reg:"chaos",firstLetter:"f"},{word:"Leggington",reg:"chaos",firstLetter:"l"},{word:"Legsworth",reg:"chaos",firstLetter:"l"},{word:"Legford",reg:"chaos",firstLetter:"l"},{word:"Streakton",reg:"chaos",firstLetter:"s"},{word:"Blazeton",reg:"chaos",firstLetter:"b"},{word:"Flashton",reg:"chaos",firstLetter:"f"},{word:"Dashton",reg:"chaos",firstLetter:"d"}],
  longtail: [{word:"Wagglesworth",reg:"grand",firstLetter:"w"},{word:"Tailwag",reg:"chaos",firstLetter:"t"},{word:"Waggington",reg:"chaos",firstLetter:"w"},{word:"Tailford",reg:"chaos",firstLetter:"t"},{word:"Waggleton",reg:"chaos",firstLetter:"w"},{word:"Wagford",reg:"chaos",firstLetter:"w"},{word:"Swishton",reg:"chaos",firstLetter:"s"},{word:"Swishford",reg:"chaos",firstLetter:"s"},{word:"Swooshton",reg:"chaos",firstLetter:"s"},{word:"Swayton",reg:"chaos",firstLetter:"s"},{word:"Swayford",reg:"chaos",firstLetter:"s"},{word:"Plumeton",reg:"chaos",firstLetter:"p"},{word:"Plumeford",reg:"chaos",firstLetter:"p"},{word:"Featherton",reg:"chaos",firstLetter:"f"},{word:"Featherford",reg:"chaos",firstLetter:"f"},{word:"Flagford",reg:"chaos",firstLetter:"f"},{word:"Bannerton",reg:"chaos",firstLetter:"b"},{word:"Streamford",reg:"chaos",firstLetter:"s"},{word:"Flourishford",reg:"chaos",firstLetter:"f"},{word:"Fanford",reg:"chaos",firstLetter:"f"},{word:"Fanfare",reg:"chaos",firstLetter:"f"},{word:"Swirlford",reg:"chaos",firstLetter:"s"},{word:"Twizzleton",reg:"chaos",firstLetter:"t"},{word:"Waverton",reg:"chaos",firstLetter:"w"},{word:"Tailwick",reg:"chaos",firstLetter:"t"},{word:"Twizzleford",reg:"chaos",firstLetter:"t"},{word:"Whirlyton",reg:"chaos",firstLetter:"w"},{word:"Spinton",reg:"chaos",firstLetter:"s"},{word:"Spinford",reg:"chaos",firstLetter:"s"}],
  goodboy: [{word:"Goodboy",reg:"chaos",firstLetter:"g"},{word:"Bestboy",reg:"chaos",firstLetter:"b"},{word:"Topboy",reg:"chaos",firstLetter:"t"},{word:"Championford",reg:"chaos",firstLetter:"c"},{word:"Prizeford",reg:"chaos",firstLetter:"p"},{word:"Biscuitwell",reg:"food",firstLetter:"b"},{word:"Welldonton",reg:"chaos",firstLetter:"w"},{word:"Cleverboy",reg:"chaos",firstLetter:"c"},{word:"Cleverton",reg:"chaos",firstLetter:"c"},{word:"Smarton",reg:"chaos",firstLetter:"s"},{word:"Steadfast",reg:"chaos",firstLetter:"s"},{word:"Nobleston",reg:"chaos",firstLetter:"n"},{word:"Gentleton",reg:"chaos",firstLetter:"g"},{word:"Loyalton",reg:"chaos",firstLetter:"l"},{word:"Trueton",reg:"chaos",firstLetter:"t"},{word:"Steadton",reg:"chaos",firstLetter:"s"},{word:"Faithfulton",reg:"chaos",firstLetter:"f"},{word:"Honourton",reg:"chaos",firstLetter:"h"},{word:"Braveton",reg:"chaos",firstLetter:"b"}],
  goodgirl: [{word:"Goodgirl",reg:"chaos",firstLetter:"g"},{word:"Bestgirl",reg:"chaos",firstLetter:"b"},{word:"Topgirl",reg:"chaos",firstLetter:"t"},{word:"Queenton",reg:"chaos",firstLetter:"q"},{word:"Ladyton",reg:"chaos",firstLetter:"l"},{word:"Ladyford",reg:"chaos",firstLetter:"l"},{word:"Nobleton",reg:"chaos",firstLetter:"n"},{word:"Graceton",reg:"chaos",firstLetter:"g"},{word:"Sweeton",reg:"chaos",firstLetter:"s"},{word:"Preciouston",reg:"chaos",firstLetter:"p"},{word:"Cherishton",reg:"chaos",firstLetter:"c"},{word:"Treasureton",reg:"chaos",firstLetter:"t"},{word:"Jewelton",reg:"chaos",firstLetter:"j"},{word:"Gemon",reg:"chaos",firstLetter:"g"},{word:"Pearlon",reg:"chaos",firstLetter:"p"},{word:"Shineton",reg:"chaos",firstLetter:"s"},{word:"Glowton",reg:"chaos",firstLetter:"g"},{word:"Queenford",reg:"chaos",firstLetter:"q"},{word:"Graceford",reg:"chaos",firstLetter:"g"},{word:"Charmford",reg:"chaos",firstLetter:"c"},{word:"Sweetford",reg:"chaos",firstLetter:"s"}]};

// ── REASONING ─────────────────────────────────────────────────────────────────

const REASONING: Record<string, string[]> = {
  lapdog: ["Looks like a small cloud that someone has given opinions.","Perpetually groomed, permanently cheerful, mildly judgmental.","Has maintained this exact hairstyle for several centuries.","Arrives in a room the way a bishop arrives at a christening -- expected, overdressed, and faintly disapproving.","Four hundred years of palace living leaves a dog with very particular ideas about ceremony.","Believes laps are public infrastructure built for its comfort.","Takes up very little space, then somehow takes over the entire room.","Looks delicate, but can negotiate a biscuit like a barrister.","Has the confidence of royalty and the bladder of a teacup.","Turns being carried into a constitutional right.","Small enough for a handbag, grand enough for a procession.","Treats grooming as both necessity and theatre.","Knows exactly who in the room is easiest to manipulate.","Flutters about like a feather with a meal plan.","Has never worked a day in its life and sees no reason to start."],
  boxer: ["Approaches every situation with maximum enthusiasm and minimum strategy.","Loyal, loud, and absolutely convinced that sitting on your lap is a human right.","Looks permanently surprised, even at things it caused.","Never met a stranger. This is not always helpful on military exercises.","Approaches every day as though something brilliant is about to happen. It usually involves a sock.","Boxes with its paws, then acts shocked that furniture was involved.","Has the bounce of a spring and the subtlety of a brass band.","Thinks personal space is a rumour started by cats.","Can make a hallway feel like a rugby tunnel.","Enters every room as though announced by drums.","Has a heroic chest and absolutely no indoor brakes.","Regards every cushion as a wrestling opponent.","Works hard, plays harder, and apologises with its whole face.","Does not walk over to you. It arrives as a friendly collision.","Built like an athlete, behaves like a toddler with sponsorship."],
  afghan: ["Glides into a room the way a sunset enters a valley -- without asking permission.","Has never once been in a hurry. This is not laziness. This is philosophy.","Descended from the dogs of Afghan royalty. Acts accordingly.","The hair alone requires more maintenance than most people's entire lives.","Looks through you with the calm certainty of something that has outlived empires.","Has the face of a tragic poet and the attention span of a moth.","Does not walk across a room. Arrives in instalments, mostly hair.","Needs brushing so often the comb has started paying rent.","Looks elegant until it trips over its own fringe and pretends it meant to.","Has a long face because it has seen your outfit and chosen silence.","Carries itself like royalty, then gets startled by a cushion.","The ears are not ears. They are decorative curtains with opinions.","Moves like silk in a breeze, unless there is a snack involved.","Can look deeply mysterious while having absolutely no idea what is happening.","Owns more hair than sense, and somehow makes that look expensive."],
  sighthound: ["Forty miles per hour of elegant indifference. The earldom was awarded for sheer deportment.","Has always considered the peerage its natural social circle -- if anything, beneath it.","Has been aristocratic since before the British aristocracy was invented.","Moves through the world with the serene confidence of something that has never once been told no.","Can outrun the wind, then sleep like a dropped scarf.","Looks noble until its legs fold up like deckchairs.","Has two settings: dramatic sprint and Victorian fainting couch.","So aerodynamic even its thoughts seem to arrive quietly.","Glides past with the expression of a retired duchess."],
  sniffer: ["Has the air of a detective who solved the case three days ago and is merely waiting for everyone else.","Melancholy eyes, powerful nose, deeply suspicious of everything.","Follows a scent with the focus of a detective who has forgotten why they started.","The most expensive biological detection equipment in the world. Currently investigating a crisp packet."],
  greatdane: ["Large enough to need planning permission, gentle enough to ask nicely.","Moves through a room the way a planet moves through space -- slowly, inevitably, and with gravitational consequences.","Was named Teacup at eight weeks. At eighteen months, the irony became structural.","The size alone demands a cosmic title. The personality insists on it.","Sits on your lap with complete confidence of something that weighs sixty kilograms and has access to a rocket.","Can block a doorway without noticing there is a doorway.","Has the elegance of a statue and the spatial awareness of a wardrobe.","Looks noble until it tries to reverse in a narrow kitchen.","A gentle giant who believes chairs are merely suggestions.","Every tail wag is a minor weather event."],
  giant: ["So large that the title had to match the physical reality.","Was named Teacup at eight weeks. At eighteen months, the irony became structural.","Sits on your lap with complete confidence of something that weighs sixty kilograms.","Operates more like a geographic feature than an animal.","Does not enter a room so much as alter its layout.","Can lean on you with the force of a small shed.","Looks imposing, then asks for a cuddle with tragic sincerity.","Has a bark that makes mugs reconsider their shelf position.","Moves slowly because momentum is a serious commitment.","Occupies the floor like a piece of furniture with feelings."],
  terrier: ["The only dog that regularly picks fights with things three times its size and usually wins.","A terrier would consider a title an unnecessary distraction from the serious business of digging.","Six inches of righteous fury in a jacket of wiry fur.","Has declared war on the postman, the vacuum cleaner, and a leaf. Currently winning two of those."],
  retriever: ["Dependable, cheerful, and utterly convinced every situation calls for a biscuit.","Greets burglars as enthusiastically as family members.","Has never met a puddle it didn't immediately lie down in.","The only animal capable of looking genuinely hurt that there are no more biscuits.","Believes every visitor has arrived to admire them personally.","Carries socks like rare museum treasures.","Has the moral certainty of a dog holding a tennis ball.","Knows exactly where the treats are and pretends this is coincidence.","Approaches water like it has been personally invited.","Turns a simple walk into a wet outdoor expedition.","Has the smile of an optimist and the appetite of a skip.","Can make loyalty look like a full-time profession.","Would happily assist with any task involving crumbs."],
  collie: ["The most intelligent dog in the world and absolutely cannot stop telling you about it.","Herds sheep, children, and visiting relatives with equal efficiency.","Has never once been off duty. Not once. Not even asleep.","Can make eye contact with a gate until the gate feels guilty.","Knows three routes, four commands, and your weakest character flaw.","Would organise a village fete before breakfast if allowed.","Moves like a chess player with paws.","Regards relaxation as poor flock management.","Can spot disorder from across a field and take it personally.","Herds the family into the kitchen with silent judgment.","Understands the word walk and several implied subclauses.","Has the work ethic of a farmer and the anxiety of a project manager.","Will stare at a tennis ball until physics gives in.","Believes every moving object needs a plan.","Can turn a lawn into an operational command centre."],
  poodle: ["The most intelligent dog in the world and considerably better dressed than you.","Originally a water retriever, now primarily a philosopher. The doctorate was inevitable.","Breeds above itself in intelligence and consistently knows it.","Has a haircut that required more consultation than most kitchens.","Can look glamorous while secretly planning a swim.","Knows it is clever, which is where the trouble begins.","Prances like it has just received excellent news about itself.","Has never met a mirror it did not understand immediately.","Looks ornamental, thinks operational.","Turns grooming into architecture.","Can outthink you, then pretend it was all charm.","Carries itself like a professor in evening wear."],
  spaniel: ["Spaniels have commanded hunting parties since the Tudor court. A generalship was long overdue.","Floppy ears and absolute authority -- the spaniel was born to lead.","The Field Marshal of the water meadow and the reed bed since 1600.","Can find a puddle in a drought and enter it sideways.","Has ears so dramatic they deserve their own weather warning.","Flushes birds, furniture, and any quiet moment available.","Believes every hedge contains either treasure or destiny.","Can wag its tail hard enough to stir tea.","Looks innocent with a mouth full of something suspicious.","Moves through brambles like a cheerful mop.","Has never heard the word mud as a criticism.","Can turn a tidy kitchen into a countryside walk.","Fetches with pride, returns with half the field attached.","Has the soul of a poet and the paws of a swamp creature."],
  boston: ["Born in a tuxedo, died in a tuxedo, conducted all affairs in between in a tuxedo.","Looks dressed for a wedding, behaves like it has just found the buffet.","Has the confidence of a pub landlord and the face of a surprised barrister.","Emerged from 1870s Boston with an air of civic authority entirely disproportionate to its size.","Small dog, big opinions, formalwear included at no extra charge."],
  corgi: ["A Welsh dog with a Welsh name feels like the natural order of things.","The Corgi has been a royal dog since before most European monarchies existed. Acts accordingly.","Compact, focused, and absolutely convinced it is in charge of everything within a three-mile radius.","Has herded sheep on hillsides that would make a mountain goat nervous.","Carries itself like a bard who has just composed something very good and knows it.","Short legs, long authority, no patience for nonsense.","Runs the household from ankle height with remarkable efficiency.","Has the bottom of a sofa cushion and the mind of a foreman.","Will herd children, guests, laundry and possibly your thoughts.","Looks cheerful while quietly reorganising the room.","Built low to the ground for maximum bossiness.","Can trot with the urgency of a town crier.","A small dog with the operating system of a farm manager.","Does not follow you about. Supervises you from below.","Believes every hallway is a livestock corridor."],
  asian: ["Carries itself like a Shaolin monk who has taken a vow of snacks.","Two thousand years of Chinese imperial breeding. Acts accordingly.","Has a face that has seen empires rise and fall. Mostly unimpressed.","Small enough for a lap, grand enough for a procession.","The ancient breeds of Asia were temple guardians. This one guards the sofa with equal dedication.","Regards the sofa as ancestral property and guests as temporary staff.","Has the dignity of a palace dog and the snore of a small motorbike.","Can look deeply spiritual while sitting in the laundry basket.","Moves with ceremony, unless there is ham within range.","Believes every doorway is an opportunity for a dramatic entrance.","Has a face that says wisdom, and a body that says biscuit.","Guards the house by judging absolutely everyone who enters.","Carries centuries of history in a very compact wrapper.","Will accept worship, applause, and tiny bits of toast.","Looks like it knows a secret, but it is probably just where the snacks are."],
  character: ["A face like a fist, a personality like a party.","Breathes loudly through every social occasion with complete conviction it is doing this correctly.","Believes it is a much larger dog trapped in a terrible administrative error."],
  dachshund: ["Two thousand years of German engineering went into a dog that cannot reach most surfaces.","Moves through the world like a very short scandal.","The proportions suggest an engineering compromise was made at some point. The dog disagrees.","Has the confidence of a wolf and the clearance of a slipper.","Built like a draught excluder with ambitions.","Can enter a tunnel and come out with a legal opinion.","Long enough to be a queue all by itself.","Thinks steps are a personal insult.","Has excellent ground clearance for a sandwich.","Looks small until it starts making executive decisions.","Can stretch across a sofa like melted toffee.","Has the voice of a much taller animal.","Believes digging is both sport and civic duty.","Moves with the determination of a sausage on business.","Never underestimates itself, and neither should you."],
  greedy: ["Has never met a biscuit it did not consider destiny.","Eats like the bowl personally offended them.","Can hear a cheese wrapper from another postcode.","Believes \u201csharing\u201d means you give them half, then the other half.","Treats dinner like a disappearing act.","Has the table manners of a tiny furry tax collector.","Looks starving exactly seven minutes after breakfast.","Does not beg. Conducts emotional negotiations.","Has never understood why humans invented plates if not for dogs.","Can locate a dropped crumb with military precision.","Believes every walk should include a snack inspection route.","Has a nose for treats and no respect for boundaries.","Would sell the sofa for one sausage.","Thinks \u201cleave it\u201d is a philosophical suggestion.","Eats first, asks questions never.","Can turn one sad glance into half your lunch.","Has never been full, only temporarily interrupted.","Considers the kitchen their natural habitat.","Knows the sound of the treat tin better than their own name.","Approaches every picnic like a legal loophole.","Measures love in biscuits.","Can make an empty bowl look like a humanitarian crisis.","Believes all food is communal if stared at hard enough.","Has the soul of a gourmand and the patience of a vacuum cleaner.","Thinks crumbs are just treats that made a break for it.","Can smell roast chicken through walls, doors and lies.","Accepts payment in ham, cheese or emotional blackmail.","Will sit beautifully for a snack, then immediately invoice you again.","Has never stolen food, only \u201crescued\u201d it.","Lives by one rule: if it fits in the mouth, it was meant to be."],
  default: ["A dog of considerable distinction that has earned its title through sheer presence.","The rank was awarded after careful consideration. The evidence was considerable."]
};

// Breed-specific reasoning pools (keyed by lowercased breed name). Combined with the
// breed's group pool and (for greedy breeds) the greedy pool.
const BREED_REASONING: Record<string, string[]> = {
  "basset hound": ["Has the expression of someone who has seen the bill.","Moves at the speed of important thoughts.","Built low to the ground for serious smell-based administration.","Can make a sigh sound like a legal objection.","Has ears that arrive before the rest of the dog.","Follows a scent like it owes them money.","Looks disappointed in everyone, especially gravity.","Can turn a walk into a slow-motion investigation.","Has the dignity of a judge and the legs of a footstool."],
  "bichon frise": ["Looks like a marshmallow with a social calendar.","Has the confidence of a show pony and the weight of a cushion.","Needs brushing, applause, and possibly a small dressing room.","Can turn a rainy pavement into a grooming emergency.","Has never accepted that puddles are legally allowed.","Looks innocent while shedding tiny clouds of drama.","Travels through life like a meringue with opinions.","Believes laps are thrones and sofas are estates.","Small, white, fluffy, and suspiciously aware of its own charm.","Can get mud on one paw and make it everyone\u2019s problem.","Smiles like it has just been voted most delightful."],
  "bloodhound": ["Has the face of a detective who already knows you did it.","Can follow a scent, a suspicion, and possibly a sandwich.","Looks mournful because the mystery was too easy.","Has ears built for drama and a nose built for evidence.","Investigates crumbs like a senior officer at a crime scene.","Can smell a biscuit through weather, wallpaper, and denial.","Follows trails with the seriousness of a tax inspector.","Has never rushed a case, only drooled on it.","Looks tragic until the treat tin opens.","Can turn a walk into a full inquiry.","Sniffs first, thinks second, reports never.","The nose is in charge; the rest of the dog follows."],
  "border terrier": ["Has a face like an otter and the plans of a burglar.","Looks scruffy because serious work is rarely tidy.","Can squeeze through a gap that legally should not exist.","Small, wiry, and absolutely not backing down.","Has the charm of a farmhand and the nerve of a debt collector.","Regards hedges as invitations.","Looks gentle until something rustles.","Built for rough weather, bad ideas, and excellent snacks.","Has the confidence of a dog twice its height.","Wiry coat, bright eyes, and a suspiciously busy diary."],
  "bulldog": ["Waddles like a pub landlord carrying important news.","Has a face like a disappointed uncle and the heart of a pudding.","Moves slowly because dignity must never be rushed.","Snorts through life with absolute confidence.","Built close to the ground for maximum stubbornness.","Can occupy a doorway like a piece of municipal furniture.","Looks cross, feels soft, snores like a small tractor.","Regards stairs as an overambitious architectural choice.","Has perfected the art of looking busy while doing nothing.","Turns sitting down into a full performance.","Believes every cushion should be tested by committee."],
  "dalmatian": ["Looks like it was designed by someone with excellent timing and a paintbrush.","Spots everywhere, patience optional.","Can turn a walk into a parade without asking.","Built to run beside coaches, now runs beside your shopping bags.","Looks smart enough to know exactly where the mud is.","Every zoomie arrives with punctuation.","Spots trouble, then joins in."],
  "doberman pinscher": ["Looks like the night shift has arrived early.","Stands so neatly it makes other dogs look unassembled.","Has the elegance of a statue and the focus of a guard.","Can make silence feel very well organised.","Looks serious until someone says walk.","Patrols the garden like it has a clipboard.","Loyal enough to make shadows feel redundant."],
  "french bulldog": ["Has ears like satellite dishes and the patience of a toddler.","Looks permanently unimpressed with your life choices.","Small, square, and absolutely sure the chair is theirs.","Can snore with the confidence of heavy machinery.","Walks like a tiny wrestler on a city break.","Has a face built for judgement and naps.","Turns stubbornness into an art form."],
  "greyhound": ["Built for speed, but somehow spends 19 hours a day horizontal.","Has the body of an athlete and the soul of a heated blanket.","Can outrun almost anything, except the urge to nap.","Looks like a lightning bolt that forgot it was retired.","Takes corners like a sports car, then sleeps like a dropped scarf.","Has two settings: dramatic sprint and Victorian fainting couch.","So aerodynamic even its thoughts arrive late.","Looks noble and ancient, until its legs fold up like garden furniture.","The fastest couch potato ever selectively bred by humankind.","Moves like poetry, sleeps like punctuation."],
  "italian greyhound": ["Looks like a drawing of a dog done with one elegant line.","Shivers with the dignity of a duchess in a draught.","Has the speed of a sprinter and the courage of a custard cream.","Can fit in a jumper and still look aristocratic.","Moves like silk, then folds like a deckchair.","Believes radiators are a basic human right.","Has tiny feet and enormous feelings.","Runs fast enough to avoid responsibility.","Looks fragile, then steals the warmest seat.","A pocket-sized noble with a blanket addiction."],
  "jack russell terrier": ["Small dog, large agenda, zero hesitation.","Can hear a crisp packet through brickwork.","Has declared a lifelong rivalry with the garden.","Looks cute until the terrier software loads.","Digging is not a habit. It is a mission statement.","Can turn one tennis ball into a full-time job.","Brave enough to argue with a wheelie bin."],
  "labrador": ["Has never met a biscuit it did not consider destiny.","Believes every bowl is empty in spirit, even when recently filled.","Can find mud with the accuracy of a surveyor.","Thinks water is a lifestyle, not a substance.","Retrieves joyfully, then negotiates over the return.","Has the smile of a saint and the appetite of a skip.","Can hear the fridge open through two walls and a dream.","Will help with anything, especially lunch.","Regards strangers as friends who have not yet produced treats.","Looks guilty only when there is evidence on its nose.","Turns a puddle into a full afternoon\u2019s work.","Can make a tennis ball feel like a royal appointment.","Knows exactly where the treat tin lives.","Approaches life with wet paws and excellent intentions."],
  "lurcher": ["Looks like a greyhound who has been camping.","Fast enough to vanish, scruffy enough to reappear in style.","Has the soul of a poet and the recall of a rumour.","Can look elegant and slightly stolen at the same time.","Moves like wind, sleeps like laundry.","Has perfected the art of suspicious lounging.","Runs like a whisper, naps like a professional."],
  "maltese": ["Looks like a white ribbon with a social life.","Has hair that requires both brushing and diplomacy.","Small enough to carry, grand enough to object.","Can look angelic while sitting on the thing you needed.","Moves like a tiny wedding cake with opinions.","Turns grooming into heritage work.","Has never met a lap it did not improve.","White coat, black eyes, firm agenda.","Looks delicate, negotiates like a market trader."],
  "maltipoo": ["Looks like a cuddly toy with a calendar.","Has curls, charm, and a suspicious understanding of snack timing.","Small enough to scoop, clever enough to exploit it.","Can turn grooming into a social event.","Appears soft, then outsmarts the entire room.","Has never seen a lap it did not consider available.","Floofs about with purpose."],
  "mastiff": ["Has the face of a bouncer and the soul of a doormat.","Moves like a sideboard with feelings.","Can lean gently and still alter your postcode.","Looks terrifying until it asks for a cuddle.","One bark, and even the shed behaves."],
  "miniature schnauzer": ["Has eyebrows that could chair a planning meeting.","Looks like a tiny professor with strong views on pigeons.","Carries a beard like it has wisdom to dispense.","Small dog, large moustache, no patience for nonsense.","Can judge you across a room using only eyebrows.","Looks neat, sounds busy, patrols constantly.","Has the face of a village solicitor and the heart of a terrier."],
  "old english sheepdog": ["Looks like a haystack that learned to love you.","Contains one dog, three rugs, and several lost tennis balls.","Moves like a mop with a wonderful personality.","Has fringe so large it navigates mainly by optimism.","Can hide an entire expression behind its own eyebrows.","Wanders in like a walking cloud from a farmyard pantomime.","Has the build of a sofa and the bounce of a lamb."],
  "papillon": ["Has ears like butterfly wings and the confidence of a headteacher.","Looks delicate, then takes command of the entire household.","Tiny body, giant ears, enormous agenda.","Can flutter into a room and immediately become the main event.","Has the elegance of a toy and the ambition of a general.","Believes being small makes rules easier to ignore.","Listens with ears visible from the next postcode.","Can look sweet while plotting furniture access.","Turns every lap into a reserved seat.","Has enough charm to require supervision."],
  "pomeranian": ["A small cloud with the self-belief of a marching band.","Looks like a powder puff that has appointed itself head of security.","Has more fluff than body and more attitude than sense.","Could be carried by a breeze, but would complain to management.","Barks like it is addressing the House of Lords.","Treats pavements as runways and strangers as audience members.","Has the volume control of a town crier.","Tiny enough for a lap, grand enough for a throne.","Looks decorative until it starts issuing instructions.","Owns a coat that arrives five seconds before the dog.","Believes being small is a clerical error."],
  "poodle": ["Looks like it has a stylist, a diary, and several private opinions.","Can be clipped, curled, and still be the cleverest thing in the room.","Started as a water dog and somehow became a fashion statement.","Has hair with better structure than most office meetings.","Knows tricks you have not taught it yet.","Prances like the pavement owes it applause.","Grooms for sport and thinks for fun.","Looks fancy, works hard, judges quietly.","Can turn a puddle into a performance piece.","Has the brain of a scholar and the ankles of a dancer.","Would solve the puzzle, then pretend it was too easy."],
  "pug": ["Looks ancient, wrinkled, and somehow still very pleased with itself.","Has the walk of a wind-up toy and the confidence of a duke.","Snorts as though providing commentary on the day.","Can make breathing sound like a hobby.","Small body, huge expression, no personal space.","Looks like it has been told a secret and immediately forgotten it.","Treats every cushion as a throne."],
  "rottweiler": ["Looks like security, behaves like someone\u2019s devoted shadow.","Has the posture of a guard and the eyes of a softie.","Can make a garden gate feel properly supervised.","Carries confidence quietly, which is much more impressive.","Would stand between you and danger, then ask for a biscuit.","Has a serious face for deeply unserious household duties.","Patrols the kitchen as though crumbs are a national concern.","Strong, steady, and convinced the sofa is shared property.","Can look imposing while leaning in for a fuss.","Treats loyalty as a full-time job.","Looks like security, behaves like someone\u2019s devoted shadow.","Has the posture of a guard and the eyes of a softie.","Can make a garden gate feel properly supervised.","Carries confidence quietly, which is much more impressive.","Would stand between you and danger, then ask for a biscuit.","Has a serious face for deeply unserious household duties.","Patrols the kitchen as though crumbs are a national concern.","Strong, steady, and convinced the sofa is shared property.","Can look imposing while leaning in for a fuss.","Treats loyalty as a full-time job.","Has the presence of a doorman and the memory of a snack expert.","Knows exactly who belongs, and who has gravy.","Will guard the house, then be defeated by a bath.","Looks built for business, melts for kind voices.","A calm heavyweight with a surprisingly delicate opinion on comfort."],
  "saint bernard": ["Has the size of a wardrobe and the manners of a vicar.","Looks built for mountain rescue, mostly rescues biscuits.","Can block a hallway with charitable intent.","Carries kindness in bulk.","Moves like a snowdrift with paws.","Has a face that says help is coming, after a nap.","Large enough to provide shade at a picnic.","Can make a sofa look like a footstool.","Would rescue you, then lean on you by accident."],
  "shih tzu": ["Looks like a tiny emperor hidden behind excellent hair.","Has a fringe with more personality than some people.","Moves like a footstool with royal connections.","Requires brushing, admiration, and the occasional tribute.","Can look serene while being completely in the way.","Turns a lap into a private residence.","Small, silky, and deeply aware of its status."],
  "siberian husky": ["Looks like it has crossed tundra, complains about a drizzle.","Has the eyes of a wolf and the drama of a choirboy.","Does not bark. Holds meetings.","Can pull a sled but not accept being told no.","Has enough opinions to fill a parish council.","Escapes like the fence was merely decorative.","Looks majestic until it argues with a sock.","Treats cold weather as personality.","Can howl with the sincerity of a folk singer.","Runs on mischief, fur, and theatrical complaint."],
  "staffordshire bull terrier": ["Built like a small barrel and powered entirely by affection.","Has a head like a doorstop and a heart like a radiator.","Approaches cuddles with the force of a friendly rugby tackle.","Smiles as though it has just remembered everyone is brilliant.","Thinks personal space is something other breeds made up.","Can look tough while asking to be tucked in.","Has the body of a bouncer and the soul of a nursery assistant.","Would defend the house, then make friends with the delivery driver.","Loves so hard it needs better brakes.","Carries loyalty in every muscle.","Can turn a sofa into a group hug.","Looks serious for half a second, then becomes pure sunshine."],
  "weimaraner": ["Looks like a silver statue that has spotted a sandwich.","Has the stare of a detective and the body of an athlete.","Follows you so closely it may count as furniture.","Can turn elegance into chaos in three strides.","Grey, graceful, and emotionally attached to your every movement.","Has the energy of a village sports day.","Looks serious until the ears start flapping.","Would like to help with everything, including things already finished.","Can investigate a room without blinking.","Built for work, powered by curiosity."],
  "west highland terrier": ["Looks freshly laundered and ready to start trouble.","A small white dog with the confidence of a pipe band.","Has never accepted that size should limit ambition.","Can find mud in a clean room.","Looks angelic until the digging starts.","Regards every squirrel as unfinished business.","White coat, black nose, enormous self-belief.","Can bark with the authority of a village noticeboard.","Small enough to cuddle, determined enough to negotiate terms."],
  "whippet": ["Built for speed, designed for blankets.","Can reach astonishing speed between two naps.","Looks delicate until it becomes a beige missile.","Has the body of an athlete and the schedule of a cat.","Will sprint like lightning, then demand central heating.","Turns corners like a sports car with anxiety.","Moves like a sketch of the wind.","Has long legs and very strong opinions about comfort.","Can disappear across a field and reappear under a duvet.","Looks noble, sleeps upside down.","Has the energy of a racer and the soul of a hot water bottle."],
};

const GREEDY_BREEDS = new Set<string>(["labrador","golden retriever","labradoodle","goldendoodle","beagle","basset hound","bloodhound","cocker spaniel","springer spaniel","cavalier king charles spaniel","cavapoo","cockapoo","pug","dachshund","bulldog","french bulldog","boxer"]);

// ── NICKNAMES ─────────────────────────────────────────────────────────────────
const NICKNAMES: Record<string,string|string[]> = {
    archibald:["Archie","Arch","Baldie","Baldy"],bartholomew:"Baz",cornelius:"Cornie",reginald:"Reggie",
  algernon:"Algie",peregrine:["Perry","Pip","Pippin","Greenie"],maximillian:"Max",maximilian:"Max",
  humphrey:"Humph",montgomery:"Monty",ferdinand:["Ferdy","Fred","Nando","Fern"],alexander:"Alex",
  sebastian:"Seb",theodore:"Teddy",frederick:"Freddie",wellington:"Welly",
  percival:"Percy",wilfred:"Wilf",sherlock:"Sherl",hercule:"Herc",
  augustus:["Gus","Augie","Auggie","Gussy"],auberon:"Aubs",barnaby:"Barnie",benedictus:"Benny",
  fortunatus:"Forty",celestin:"Cel",florentine:["Flo","Florrie","Tina","Renty"],evangelina:"Evie",
  evangeline:["Eva","Evie","Angie","Lina","Vangie"],celestine:["Celi","Celly","Tina","Stina"],sophronia:"Soph",euphemia:["Effie","Euphie","Mia","Femie","Phemie"],
  wilhelmina:["Willa","Mina","Minnie","Wilma","Billie"],clementine:["Clem","Clemmie","Tiny","Minnie","Tina"],millicent:["Millie","Milly","Missy","Centa","Lissy"],frederica:"Freddie",
  constance:["Connie","Con","Cissy","Coco","Consta"],prudence:["Prue","Prudy","Pru","Denny"],dorothea:["Dora","Dory","Thea","Dotty","Dot"],theodosia:"Teddy",
  philomena:"Philly",seraphine:"Sera",arabella:["Ara","Bella","Belle","Ari","Arby"],georgiana:"Georgie",
  cassiopeia:"Cassie",isadora:"Izzy",pandemonium:"Panda",discombobulate:"Disco",
  hullabaloo:"Hully",pandemonia:"Panda",nonchalance:"Nona",glaciale:"Glayglay",
  langueur:"Langy",indifferencia:"Indie",aloofia:"Loofy",lachrymose:"Lacky",
  plodsworth:"Plodsy",gloopington:"Gloops",frenzina:"Frenzy",woebegone:"Woeby",
  maelstrom:"Maely",existentiale:"Exie",hermeneutique:"Hermy",elongated:"Longy",
  basil:"Baz",nincompoop:"Ninnie",chumbawumba:"Chumba",zippadeedooda:"Zippy",
  snugglebum:"Snugs",cuddlekins:"Cuddles",squishface:"Squish",babbycakes:"Babs",
  tiddlywink:"Tiddles",fluffybum:"Fluffy",smooshface:"Smoosh",jellybean:"Jelly",
  marshmallow:"Marsh",candyfloss:"Candy",puddingkins:"Pudds",lambchop:"Lamby",
  pumpkinhead:"Pumps",hypervigilant:"Hyper",indefatigable:"Indy",infinitesimal:"Tiny",
  imperceptible:"Imp",microscopic:"Micro",diminutive:"Dimmy",gossamera:"Gossie",
  daintybell:"Bell",kerfuffle:"Kerfie",chuckles:"Chuck",pickles:"Picks",
  noodles:"Noods",chipmunk:"Chip",abigail:["Abby","Abbie","Gail","Gayle","Abi"],adelaide:["Addie","Ada","Adele","Lady","Della"],
  adeline:["Addie","Ada","Adele","Lina","Delly"],alexandra:["Alex","Lexi","Lex","Sandra","Sandy"],alexandria:["Alex","Lexi","Andie","Sandra","Ria"],alice:["Ali","Ally","Lissy","Lise","Elsie"],
  alicia:["Ali","Ally","Lissy","Leesh","Cia"],alison:["Ali","Ally","Allie","Sonny","Lissy"],amanda:["Mandy","Manda","Amy","Andie","Mands"],amelia:["Amy","Millie","Mia","Lia","Mel"],
  anastasia:["Ana","Annie","Stasia","Stacey","Tasia"],angela:["Angie","Ange","Angel","Gela","Jelly"],angelica:["Angie","Angel","Jelly","Geli","Lica"],annabel:["Annie","Anna","Belle","Bella","Nabby"],
  belinda:["Belle","Bella","Lindy","Linda","Bindi"],bernadette:["Bernie","Benny","Detta","Etta","Birdie"],bethany:["Beth","Bethy","Annie","Betty","Bess"],beverley:["Bev","Bevvie","Everly","Lee"],
  bridget:["Bridie","Biddy","Bree","Jet","Birdie"],camilla:["Cam","Cammie","Millie","Mila","Cami"],caroline:["Carrie","Carol","Caz","Lina","Callie"],catherine:["Cathy","Cat","Kate","Katie","Kitty"],
  charlotte:["Charlie","Lottie","Char","Lotta","Cherry"],christina:["Chris","Chrissie","Tina","Christy","Nina"],christine:["Chris","Chrissie","Tina","Christy","Teeny"],clarissa:["Clare","Clara","Clarry","Rissa","Issy"],
  cordelia:["Cora","Cordie","Delia","Dilly","Lia"],cornelia:["Cora","Connie","Nell","Nelly","Lia"],danielle:["Dani","Danni","Elle","Ella","Nell"],deborah:["Deb","Debbie","Debs","Debby","Dora"],
  dorothy:["Dot","Dottie","Dolly","Dora","Dory"],elisabeth:["Liz","Lizzie","Beth","Betty","Libby"],elizabeth:["Liz","Lizzie","Beth","Betty","Bess"],eloise:["Ellie","Elsie","Lo","Lulu","Weezy"],
  evelyn:["Evie","Eve","Lyn","Lynn","Ev"],felicity:["Flick","Fliss","Lissy","Fee","City"],frances:["Fran","Franny","Frankie","Fanny","Chessie"],francesca:["Fran","Frankie","Cesca","Chessie","Franny"],
  gabriella:["Gabby","Gabi","Bella","Bri","Ella"],georgina:["Georgie","Gina","Gigi","George","Gia"],geraldine:["Gerry","Geri","Dina","Diney","Deanie"],gillian:["Gill","Gilly","Jill","Jilly","Lian"],
  gwendoline:["Gwen","Gwennie","Wendy","Dolly","Winnie"],harriet:["Hattie","Hatty","Harry","Etta","Harrie"],isabella:["Izzy","Izzie","Bella","Belle","Isa"],isobel:["Izzy","Izzie","Belle","Bella","Ibby"],
  jacqueline:["Jackie","Jacqui","Jack","Lina","Queenie"],jennifer:["Jen","Jenny","Jenna","Jennie","Fer"],jemima:["Jem","Jemma","Mimi","Mima","Jim"],jessica:["Jess","Jessie","Jessa","Sica"],
  juliana:["Jules","Julie","Ana","Annie","Lia"],juliet:["Jules","Julie","Jet","Etta","Lettie"],katherine:["Kathy","Kat","Kate","Katie","Kitty"],kathleen:["Kathy","Kath","Kat","Katie","Lena"],
  kimberley:["Kim","Kimmy","Kimber","Kimi","Lee"],lavender:["Lav","Lavvy","Vendy","Vee","Lenny"],letitia:["Lettie","Letty","Tish","Titia","Tia"],lorraine:["Lori","Lorrie","Raine","Rainy","Lolly"],
  lucinda:["Lucy","Lulu","Cindy","Cinda","Luce"],madeleine:["Maddie","Maddy","Mads","Lena","Delly"],margaret:["Maggie","Meg","Peggy","Daisy","Greta"],marianne:["Mary","Marie","Annie","Maz","Mari"],
  matilda:["Tilly","Tilda","Mattie","Milly","Tils"],melanie:["Mel","Mellie","Lani","Annie","Laney"],meredith:["Merry","Meri","Edith","Edie","Red"],miranda:["Mira","Mandy","Randi","Andie","Mimi"],
  natalia:["Nat","Talia","Tally","Lia","Tilly"],natalie:["Nat","Nattie","Tally","Talia","Lee"],nicola:["Nicki","Nicky","Nic","Cola","Nix"],olivia:["Liv","Livvy","Ollie","Livia","Via"],
  patricia:["Pat","Patty","Trish","Tricia","Patsy"],penelope:["Penny","Nell","Nelly","Poppy","Pen"],philippa:["Pippa","Pip","Philly","Flip","Pips"],priscilla:["Prissy","Cilla","Prisc","Sissy","Rilla"],
  rebecca:["Becky","Becca","Bex","Reba","Becks"],roberta:["Robbie","Bobby","Bobbie","Berta","Bertie"],rosamund:["Rosa","Rosie","Roz","Mundy","Romy"],rosemary:["Rose","Rosie","Romy","Mary","Ro"],
  samantha:["Sam","Sammy","Sammie","Mantha","Mandy"],stephanie:["Steph","Stevie","Steffi","Fanny","Effie"],theresa:["Tess","Tessa","Terry","Resa","Teri"],veronica:["Vera","Ronnie","Roni","Nica","Vee"],
  victoria:["Vicky","Vicki","Tori","Vic","Vix"],winifred:["Winnie","Win","Freddie","Freda","Wyn"],yasmin:["Yaz","Yazzy","Min","Minnie","Yas"],cecilia:["Cece","Cissy","Celia","Lia","Ceci"],
  eugenie:["Genie","Jean","Jenny","Gigi","Eugie"],marigold:["Mari","Mary","Goldie","Maggie","Miggy"],primrose:["Prim","Rosie","Rose","Primmy","Posy"],aurora:["Rora","Rory","Auri","Dawn"],
  diana:["Di","Diney","Annie","Dee"],flora:["Flo","Florrie","Flossie","Lo"],iris:["Rissie","Izzy","Ris","Issy"],ivy:["Ivie","Ive","Iv"],
  rose:["Rosie","Ro","Roz","Posy"],ruby:["Rube","Rubes","Bee"],violet:["Vi","Ettie","Vee","Vio"],clara:["Clare","Clarry","Clary","Lara"],
  vera:["Vee","Verie","Rara"],nora:["Norrie","Norie","Nor"],cora:["Corie","Corrie","Cor"],ada:["Addie","Adie","Dee"],
  grace:["Gracie","Gracey","Ace"],maud:["Maudie","Maddy","Maudy"],edith:["Edie","Eadie","Eddie","Dithy"],ethel:["Ettie","Eth","Thelma","Thel"],
  mabel:["Mab","Mabby","May","Belle"],sybil:["Sib","Sibby","Billie","Sybbie"],enid:["Edie","Niddy","Ena"],agnes:["Aggie","Nessie","Nessa","Aggy"],
  agatha:["Aggie","Aggy","Gatha","Gathie"],dilys:["Dilly","Dil","Lissy"],nerys:["Nery","Nessa","Nerysie"],seren:["Serri","Ren","Sera"],
  cerys:["Cez","Ceri","Rys"],carys:["Caz","Carrie","Cazzy"],lowri:["Lo","Lori","Low"],blodwen:["Blod","Winnie","Wen"],
  bronwen:["Bron","Bronnie","Winnie","Wen"],morwenna:["Mor","Wenna","Morry","Mo"],elspeth:["Elsie","Beth","Effie"],nesta:["Ness","Nessie","Tess"],
  alys:["Ally","Aly","Lissie"],eirlys:["Eira","Lys","Lissy"],mairwen:["Mair","Mary","Wen"],olwen:["Ollie","Winnie","Wen"],
  eluned:["El","Luned","Nellie"],winona:["Winnie","Nona","Win"],maeve:["Mave","Meavy","Evie"],freya:["Frey","Fre","Rey"],
  ingrid:["Ingy","Rid","Inga"],mathilde:["Tilly","Tilda","Mattie","Hildy"],cecily:["Cece","Cissy","Celia","Sissie"],alastair:["Al","Ali","Ally","Astie","Sandy"],
  laurence:["Loz","Lozza","Laurie","Lawrie","Lawie"],llewellyn:["Llew","Lew","Lyn","Welly"],sebastien:["Seb","Sebby","Basty","Baz"],robert:["Rob","Robbie","Bob","Bobby","Bert"],
  james:["Jim","Jimmy","Jamie","Jem"],john:"Jack",jonathan:["Jon","Johnny","Jonny","Nathan"],joseph:["Joe","Joey","Jojo","Seph"],
  thomas:["Tom","Tommy","Thom","Tam"],charles:["Charlie","Charley","Chaz","Chuck"],michael:["Mike","Mikey","Mick","Micky"],david:["Dave","Davey","Davy","Dai"],
  daniel:["Dan","Danny","Danno","Dani"],samuel:["Sam","Sammy","Sammie","Saul"],benjamin:["Ben","Benny","Benji","Benjy"],christopher:["Chris","Chrissy","Kit","Topher"],
  nicholas:["Nick","Nicky","Nico","Cole"],andrew:["Andy","Drew","Ando","Dandy"],anthony:["Tony","Ant","Anton","Nino"],matthew:["Matt","Matty","Mats","Theo"],
  patrick:["Pat","Paddy","Rick","Ricky"],peter:"Pete",stephen:["Steve","Stevie","Steph","Ste"],steven:["Steve","Stevie","Ste","Sven"],
  philip:["Phil","Philly","Pip","Flip"],francis:["Frank","Frankie","Fran","Franny"],george:["Georgie","Geordie","Geo","Georgy"],albert:["Al","Bert","Bertie","Albie"],
  alfred:["Alf","Alfie","Fred","Freddie"],arthur:["Art","Artie","Arty","Thor"],walter:["Walt","Wally","Wat","Wal"],kenneth:["Ken","Kenny","Kent","Kendo"],
  donald:"Don",ronald:["Ron","Ronnie","Rolo","Naldo"],raymond:["Ray","Raymie","Raymo","Mondy"],gerald:["Gerry","Jerry","Gez","Geri"],
  jeremiah:["Jerry","Jez","Jem","Jeremy"],jeremy:["Jez","Jezza","Jerry","Jem"],timothy:["Tim","Timmy","Timo","Mothy"],gregory:["Greg","Gregg","Greggy","Rory"],
  douglas:["Doug","Dougie","Dug","Duggie"],vincent:["Vin","Vince","Vinnie","Vinny"],victor:"Vic",leonard:["Len","Lenny","Leo","Nard"],
  leonardo:"Leo",dominic:["Dom","Dommy","Nick","Nico"],nathaniel:["Nate","Nat","Nathan","Niel"],nathan:"Nate",
  zachary:["Zach","Zack","Zak","Zacky"],zachariah:"Zach",isaac:"Ike",isaiah:"Izzy",
  elijah:"Eli",joshua:["Josh","Joshy","Joss","Jo"],jacob:"Jake",ezekiel:"Zeke",
  emmanuel:["Manny","Manu","Em","Nuel"],maxwell:"Max",augustine:"Gus",bertram:"Bert",
  bernard:["Bernie","Bern","Barney","Nard"],benedict:["Ben","Benny","Ned","Bendy"],brandon:"Bran",bradley:"Brad",
  cameron:["Cam","Cammy","Ron","Ronny"],caspian:"Cas",cecil:"Cec",cedric:"Ced",
  clarence:["Clare","Clarry","Larry","Ren"],clement:["Clem","Clemmy","Clemmie","Cley"],clifford:"Cliff",conrad:"Con",
  cuthbert:"Bert",desmond:["Des","Desi","Dez","Mondy"],dexter:"Dex",edmund:["Ed","Eddie","Ned","Mundy"],
  edwin:["Ed","Eddie","Ned","Winnie"],elliot:["Eli","Ell","Ellis","Lio"],elliott:"Eli",eugene:"Gene",
  fletcher:"Fletch",franklin:"Frank",geoffrey:["Geoff","Jeff","Jeffy","Geo"],gideon:"Gid",
  gilbert:["Gil","Gilly","Bert","Bertie"],gordon:"Gord",graham:"Gray",harold:["Harry","Hal","Haz","Haroldy"],
  harrison:["Harry","Harris","Sonny","Hazza"],howard:"Howie",ignatius:["Iggy","Nate","Nacho","Ignas"],irving:"Irv",
  jackson:"Jack",jasper:"Jas",jefferson:"Jeff",jordan:"Jord",
  julian:"Jules",justin:"Jus",kelvin:"Kel",kendrick:"Ken",
  kingston:"King",kingsley:"King",lachlan:"Lachie",lambert:"Bert",
  lancelot:"Lance",lincoln:"Linc",lionel:"Lion",lucas:"Luke",
  lucian:["Luke","Luc","Luca","Luce"],malcolm:["Mal","Malc","Colm","Malky"],marcus:["Marc","Mark","Marco","Mars"],martin:"Marty",
  maurice:"Mo",mortimer:"Mort",neville:"Nev",nigel:"Nige",
  orlando:["Lando","Orly","Rolly","Landy"],oswald:["Oz","Ozzie","Ossie","Wally"],oscar:"Oz",phineas:"Finn",
  randolph:"Randy",raphael:["Raph","Raffy","Rafe","Raf"],reuben:"Rube",roderick:["Rod","Roddy","Rick","Rory"],
  rodney:"Rod",roger:"Rog",roland:"Roly",rudolph:["Rudy","Rudi","Dolph","Dolf"],
  rupert:["Roo","Rupes","Bertie","Rupe"],russell:"Russ",samson:"Sam",solomon:["Sol","Solly","Sonny","Solo"],
  stuart:"Stu",sylvester:["Sly","Syl","Vester","Ves"],tobias:["Toby","Tobes","Tobe","Bias"],tristan:"Tris",
  ulysses:"Uly",valentine:["Val","Vallie","Tiny","Tino"],vernon:"Vern",wilbert:"Will",
  wilbur:"Will",xavier:"Xav",yorick:"Rick",abraham:["Abe","Bram","Abie","Hammy"],
  adrian:["Ade","Adi","Aidy","Rian"],alan:"Al",alistair:"Al",ambrose:"Amby",
  angus:["Gus","Angie","Angy","Gussy"],arnold:"Arnie",aubrey:"Aub",avery:"Ave",
  baxter:"Bax",broderick:"Brodie",caleb:"Cal",calvin:"Cal",
  carlton:"Carl",chester:"Chet",christian:["Chris","Kit","Christy","Ian"],colin:"Col",
  connor:"Con",cyril:"Cy",damian:"Damo",damien:"Damo",
  dean:"Deano",duncan:"Dunc",elias:"Eli",emanuel:"Manny",
  everett:"Ev",felix:"Fee",finnegan:["Finn","Finny","Fin","Fionn"],finlay:"Finn",
  fintan:"Finn",fitzgerald:"Fitz",gabrielle:"Gabby",gary:"Gaz",
  gavin:"Gav",grayson:"Gray",griffin:"Griff",hadrian:"Ade",
  jerome:"Jerry",joachim:"Jo",joel:"Joe",jonah:"Jo",
  jonas:"Jo",josiah:"Joe",jude:"Judy",julius:"Jules",
  keegan:"Kee",leon:"Leo",levi:"Lev",lorenzo:"Enzo",
  lucius:"Luke",magnus:"Mag",manfred:"Manny",marcellus:"Marc",
  matthias:"Matt",melvin:"Mel",miles:"Milo",milton:"Milt",
  morgan:"Morg",murray:"Muz",nelson:"Nels",aldous:"Al",
  aloysius:"Al",beethoven:"Ludwig",mozart:"Wolfie",handel:"George",
  bach:"Johann",brahms:"Johannes",chopin:"Fred",liszt:"Franz",
  vivaldi:"Antonio",purcell:"Henry",schubert:"Franz",poirot:"Herc",
  endeavour:"Morse",gamache:"Armand",alleyn:"Rory",tennison:"Jane",
  marple:"Miss M",aristotle:"Aris",archimedes:"Archie",artemisia:"Arte",
  christabel:["Chrissie","Christa","Belle","Bella","Tabby"],josephine:"Jo",beatrice:"Bea",imogen:"Immy",
  lavinia:["Liv","Vinnie","Lav","Nia","Vinny"],brunhilde:"Brunny",walburga:"Walby",mechthild:"Mecki",
  etheldreda:"Ethel",vanderbilt:"Vandy",tammany:"Tammy",rockefeller:"Rocky",
  carnegie:"Carnie",rutherford:"Ruthy",grover:"Grove",millard:"Mill",
  beauregard:"Beau",thaddeus:"Thad",harrington:"Harry",roscoe:"Ros",
  hiram:"Hi",elmer:"Elm",wisecrack:"Wise",gawain:"Gaw",
  guinevere:["Gwen","Guin","Vera","Ginny"],brunhilda:"Brunny",ingeborg:"Inge",altair:"Al",
  antimatter:"Anti",asteroid:"Rocky",astral:"Astral",astrid:["Asty","Rid","Asti"],
  blackstar:"Star",bloodmoon:"Blood",bluemoon:"Blue",calypso:"Cal",
  carina:"Cari",cassandra:"Cass",circe:"Circe",cleopatra:"Cleo",
  cosmic:"Cos",cornflake:"Corny",cyrus:"Cy",darius:"Dari",
  darkside:"Dark",dawnstar:"Dawn",deepspace:"Deep",demeter:"Demi",
  dinky:"Dink",doodle:"Dood",draco:"Drake",drifter:"Drift",
  duchess:"Duch",duke:"Duke",eclipse:"Clips",edgar:"Ed",
  edmond:"Ed",edward:["Ed","Eddie","Ted","Teddy","Ned"],einstein:"Ein",elara:"El",
  eleanor:"Ellie",elfriede:"Elfie",emily:"Em",enguerrand:"Eng",
  equinox:"Equi",falcon:"Falk",fauna:"Fauna",fidget:"Fidge",
  flair:"Flair",fleur:"Fleur",foghorn:"Foggy",frost:"Frost",
  fury:"Fury",gabriel:["Gabe","Gabby","Bri","Gabs"],gaia:"Gaia",gale:"Gale",
  galileo:"Gal",galaxy:"Gal",ganymede:"Gany",gaston:"Gus",
  gertrude:"Gertie",gizmo:"Gizmo",glorious:"Glory",goober:"Goob",
  grommet:"Grom",gubbins:"Gubb",gwendolyn:"Gwen",gwenllian:"Gwen",
  hamid:"Ham",hannah:"Han",hana:"Han",hedwig:"Hedwig",
  helena:"Hel",henrietta:["Hetty","Hettie","Etta","Henny","Henri"],henry:["Harry","Hank","Hal","Hen"],hildegard:"Hilde",
  hildegarde:"Hilde",hippolyta:"Hippo",huckleberry:"Huck",jade:"Jade",
  jasmine:"Jas",karate:"Kaz",kepler:"Kep",khalid:"Khal",
  khan:"Khan",koda:"Kod",kriemhild:"Krie",kunigunde:"Kuni",
  lawrence:["Loz","Lozza","Laurie","Larry","Lawie"],leopold:["Leo","Poldy","Lenny","Lee"],lilliput:"Lilli",livia:"Liv",
  louis:"Lou",lucy:"Lu",lulu:"Lu",luna:["Lou","Lunie","Una","Lu"],
  majestic:"Maj",mantis:"Manti",marcel:"Marc",marvellous:"Marv",
  medea:"Med",megan:"Meg",melissa:"Mel",mercury:"Merc",
  meteor:"Mete",milly:"Mil",mishka:"Mish",molly:"Mol",
  moondust:"Moonie",moonglow:"Moonie",moonfall:"Moonie",moonrock:"Rock",
  moonshadow:"Shadow",morfudd:"Mor",moxie:"Mox",muddle:"Mud",
  munchkin:"Munch",nanuq:"Nan",neptune:"Nep",newton:"Newt",
  nightfall:"Nighty",nightglow:"Nighty",nightshade:"Shade",nimble:"Nim",
  nipper:"Nip",nugget:"Nugg",oliver:["Ollie","Olly","Oli","Liv"],omar:"Om",
  opulent:"Op",orbit:"Orbit",orion:"Ori",pascal:"Pas",
  patience:["Patty","Patsy","Tia","Pacey"],peabody:"Peabs",penry:"Pen",persephone:"Percy",
  petite:"Petite",philibert:"Phil",phoebe:"Pheebs",phony:"Phon",
  pierre:"Pete",pip:"Pip",pipsqueak:"Pip",pixie:"Pix",
  plato:"Plato",plum:"Plum",prometheus:"Pro",puckle:"Puck",
  pulsar:"Puls",pythagoras:"Pyth",qadir:"Qad",quasar:"Quas",
  quentin:["Quent","Quin","Quinn","Quinny"],raoul:"Raoul",ramshackle:"Rammy",rené:"Ren",
  reza:"Rez",rhea:"Rhea",rhiannon:["Rhi","Ria","Annie","Nonny"],richard:["Rich","Rick","Ricky","Dick"],
  rosalind:["Rosa","Rosie","Roz","Lindy","Linda"],rowena:"Row",ruffles:"Ruff",sappho:"Saff",
  sarah:"Sal",saturn:"Sat",scamp:"Scamp",scraggy:"Scragg",
  scrumpy:"Scrump",selene:"Sel",seraphina:"Sera",sherman:"Sher",
  sieglinde:"Siggy",sigrid:["Siggy","Rid","Sigi"],silvermoon:"Silver",sirius:"Sir",
  skittles:"Skits",smidge:"Smidge",smidgeon:"Smidge",snippy:"Snip",
  socrates:"Soc",sophia:["Sophie","Soph","Sofie","Phia"],speck:"Speck",sprocket:"Sproc",
  starburst:"Burst",stardust:"Dusty",starfall:"Star",starshadow:"Shadow",
  stella:"Stells",sunflare:"Sunny",sunspot:"Sunny",tabitha:"Tabby",
  tallulah:"Lula",tangles:"Tang",tarkan:"Tark",teacup:"Cup",
  temperance:["Tempy","Tempe","Tenny","Perrie"],tempest:"Temp",tempesta:"Temp",theodora:["Thea","Dora","Dory","Teddy","Theo"],
  thistledown:"Thistle",thomasina:"Tommy",tigress:"Tiggy",titch:"Titch",
  titchy:"Titchy",topsy:"Tops",tufty:"Tuft",tuppence:"Tup",
  turbulence:"Turb",twilight:"Twi",umbra:"Umby",ursula:"Urs",
  vega:"Vega",vela:"Vel",viper:"Vipe",vulcan:"Vulk",
  waltz:"Waltzy",widget:"Widge",william:["Will","Willy","Bill","Billy","Liam"],wimpy:"Wimps",
  wittgenstein:"Witty",wonton:"Won",wriggles:"Wrigg",xiao:"Xiao",
  yuki:"Yuki",zen:"Zen",winston:["Win","Winnie","Sonny","Winty"],otto:"Ot",
  bertie:"Bert",monty:"Monty",percy:"Perce",reggie:"Reg",
  buster:"Bus",gruff:"Gruff",grunt:"Grunt",clive:"Clive",
  boris:"Bo",derek:"Del",norman:"Norm",frank:"Frank",
  dennis:"Den",stanley:["Stan","Stanny","Lee"],herbert:"Herb",ernest:"Ernie",
  pudding:"Pudds",noodle:"Noods",wobble:"Wobs",roly:"Roly",
  snorter:"Snort",louie:"Lou",lenny:"Len",lummox:"Lumps",
  mooy:"Moo",mugsy:"Mugs",mochi:"Mo",miso:"Mis",
  mongo:"Mo",tater:"Tate",tumble:"Tumbs",tiger:"Tige",
  wumpus:"Wumps",wonky:"Wonks",fumble:"Fums",fizz:"Fizz",
  homer:"Home",waldo:"Waldo",napoleon:"Naps",gus:"Gus",
  alf:"Alf",phooey:"Phoo",philbert:"Phil",phreddy:"Fred",
  phumble:"Phum",spot:"Spot",tutu:"Tutu",dizzy:"Dizzy",
  wizzle:"Wizz",wibble:"Wibs",womble:"Womby",bumblebean:"Lulz",
  tumblewick:"TumTum",gobblesnout:"Gobsnot",dafydd:"Daf",gruffudd:"Gruff",
  llewelyn:"Llew",cadwaladr:"Cad",llywarch:"Llyw",meredydd:"Mered",
  rhydderch:"Rhyd",gwynfor:"Gwynn",taliesin:"Tali",aneurin:"Nye",
  caradog:"Crad",bleddyn:"Bled",gwilym:"Gwil",wmffre:"Wmff",
  tecwyn:"Tech",elidyr:"Eli",gwyndaf:"Gwyn",moonbeam:"Moonie",
  starbeam:"Starby",starlight:"Starry",moonlight:"Moony",shadowmoon:"Shadow",
  darkstar:"Darky",moonwalker:"Moonwalk",starwalker:"Starwalk",voidwalker:"Void",
  eventhorizon:"Horizon",supernova:"Nova",magnetar:"Mag",andromeda:"Romy",
  celestia:"Celi",lunaris:"Luna",penumbra:"Penny",spogmai:"Spogi",
  laleh:"Lali",mahsa:"Mahi",noura:"Nouri",lujain:"Lulu",
  maysa:"Mays",zahra:"Zazi",farah:"Fari",sultan:"Sully",
  nawab:"Nabs",zalmay:"Zal",

};


// ── GENERATED NICKNAMES (British hypocorism) ──────────────────────────────

const PLACE_SUFFIXES = [
  "ington","ingham","borough","bury","sworth","worth",
  "ford","ton","by","ley","well","ham","stone","gate",
  "wick","dale","field","don","shaw","thorpe","combe","bourne","mere"
];

function plusY(s: string): string {
  if (s.endsWith("y")) return "";
  if (s.endsWith("e")) return s.slice(0,-1) + "y";
  return s + "y";
}
function plusS(s: string): string {
  if (/[sxz]$/i.test(s) || /sh$/i.test(s) || /ch$/i.test(s)) return "";
  return s + "s";
}
function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : "";
}
function syllableCount(s: string): number {
  return (s.toLowerCase().match(/[aeiou]+/g) || []).length;
}
function pronounceable(s: string): boolean {
  return !/^[^aeiou]{3}/i.test(s);
}

// (a) Compound-surname nickname
function compoundNick(word: string): string[] {
  const w = word.toLowerCase();
  for (const suf of PLACE_SUFFIXES) {
    if (w.endsWith(suf) && w.length > suf.length + 2) {
      const stem = word.slice(0, word.length - suf.length);
      const candidates: string[] = [];
      const y = plusY(stem); if (y && y.toLowerCase() !== w) candidates.push(cap(y));
      if (cap(stem).toLowerCase() !== w) candidates.push(cap(stem));
      const s = plusS(stem); if (s && s.toLowerCase() !== w) candidates.push(cap(s));
      // Only add -o for short stems -- "Fluffo" fine but "Pillowo" ugly
      if (stem.length <= 5) { const o = stem + "o"; if (o.toLowerCase() !== w) candidates.push(cap(o)); }
      return candidates.filter(Boolean);
    }
  }
  return [];
}

// (b) Real-surname nickname
function surnameNick(sn: string, gender: "boy"|"girl"): string[] {
  const s = sn.toLowerCase();
  // strip any compound part (e.g. "Smith-Waggleton" → "smith")
  const base = s.split(/[-\s]/)[0];
  const firstSyll = base.match(/^[^aeiou]*[aeiou]+[^aeiou]*/)?.[0] || base.slice(0,4);
  if (base.endsWith("son")) {
    const stem = base.slice(0, -3);
    return [cap(stem+"s"), cap(stem+"o"), cap(stem+"co")].filter(c => c.toLowerCase() !== s);
  }
  if (base.endsWith("es") || base.endsWith("s")) {
    const stem = base.endsWith("es") ? base.slice(0,-2) : base.slice(0,-1);
    const outA = [cap(firstSyll+"o"), cap(firstSyll+"ey"), cap(firstSyll+"ie")];
    if (gender === "boy") outA.push(cap(stem+"za"));
    return outA.filter(c => c.toLowerCase() !== s);
  }
  const outB = [cap(firstSyll+"o"), cap(firstSyll+"y"), cap(firstSyll+"ie")];
  if (gender === "boy") outB.push(cap(firstSyll+"za"));
  return outB.filter(c => c.toLowerCase() !== s);
}

// Aussie-style nickname suffix: "za" (boys), plus "o" and "ie" for both.
// Bazil -> Baz -> Bazza / Bazo / Bazie. Seed picks which, adding nickname variety.
function aussieSuffix(gender: "boy"|"girl", seed: number): string {
  const pool = gender === "boy" ? ["za", "o", "ie"] : ["y", "o", "ie"];
  return pool[Math.abs(seed) % pool.length];
}

// (c) First-name nickname (whimsy compound)
const WHIMSY_SUFFIXES = /^(.+?)(bum|face|kins|paws|chops|snout|wick|bean|boots|pants)$/i;
function whimsyNick(name: string): string[] {
  const m = name.match(WHIMSY_SUFFIXES);
  if (!m) return [];
  const stem = m[1];
  return [cap(stem), cap(plusS(stem)||""), cap(plusY(stem)||"")].filter(Boolean);
}

// Score a nickname candidate
function scoreNick(cand: string, fullName: string, firstName: string): number {
  if (!cand) return -99;
  let s = 0;
  const sylls = syllableCount(cand);
  s += sylls <= 2 ? 2 : -2;
  if (/[yosi]e?$|ers$/.test(cand.toLowerCase())) s += 1;
  const fullWords = fullName.toLowerCase().split(/[\s\-]+/);
  if (fullWords.includes(cand.toLowerCase())) s -= 3;
  if (cand.toLowerCase() === firstName.toLowerCase()) s -= 2;
  if (pronounceable(cand)) s += 1;
  return s;
}

function bestNickname(params: {
  firstNameStr: string;
  dogWord: string;
  realSurname: string;
  current: string;
  fullName: string;
  gender: "boy"|"girl";
}): string {
  const { firstNameStr, dogWord, realSurname, current, fullName, gender } = params;

  // Don't override a good existing nickname
  const fullWords = fullName.toLowerCase().split(/[\s\-]+/);
  const currentIsGood = current &&
    current !== firstNameStr &&
    !fullWords.includes(current.toLowerCase());
  if (currentIsGood) return current;

  // Gather candidates
  const candidates: Array<{nick: string; priority: number}> = [];

  // Existing lookup (priority 0)
  if (current && current !== firstNameStr) candidates.push({nick: current, priority: 0});

  // (c) First-name whimsy
  whimsyNick(firstNameStr).forEach(n => candidates.push({nick: n, priority: 1}));

  // (a) Compound-surname from dogWord
  compoundNick(dogWord).forEach(n => candidates.push({nick: n, priority: 2}));

  // (b) Real-surname nick
  if (realSurname) surnameNick(realSurname, gender).forEach(n => candidates.push({nick: n, priority: 3}));

  if (!candidates.length) return current || firstNameStr;

  // Score and pick best
  let best = candidates[0];
  let bestScore = -99;
  for (const cand of candidates) {
    const sc = scoreNick(cand.nick, fullName, firstNameStr) - cand.priority * 0.1;
    if (sc > bestScore) { bestScore = sc; best = cand; }
  }
  return best.nick || current || firstNameStr;
}

function getNickname(n: string, seed = 0): string {
  const val = NICKNAMES[n.toLowerCase().replace(/[^a-z]/g,"")];
  if (!val) return "";
  if (typeof val === "string") return val;
  // Pick from array using seed so same name+seed always gives same nickname
  // but different seeds (different rolls) give different nicknames
  const idx = (seed + n.charCodeAt(0)) % val.length;
  return val[idx];
}

function getGroup(breed: string): string {
  const b = breed.toLowerCase();
  if (b === "cavalier king charles spaniel") return "lapdog";
  if (b === "welsh springer spaniel") return "spaniel";
  if (b.includes("spaniel")) return "spaniel";
  if (b.includes("retriever") || b === "labrador" || b === "labradoodle" || b === "goldendoodle") return "retriever";
  if (b === "border collie" || b === "rough collie") return "collie";
  if (["bulldog"].includes(b)) return "bulldog";
  if (["staffordshire bull terrier","boxer","bull terrier","french bulldog"].includes(b)) return "boxer";
  if (["basset hound","bloodhound","beagle"].includes(b)) return "sniffer";
  if (b === "afghan hound") return "afghan";
  if (["greyhound","borzoi","saluki","irish wolfhound","lurcher","whippet","italian greyhound"].includes(b)) return "sighthound";
  if (b === "great dane") return "greatdane";
  if (["mastiff","saint bernard","newfoundland","leonberger"].includes(b)) return "giant";
  if (b === "poodle") return "poodle";
  if (["bichon frise","shih tzu","pomeranian","papillon","maltese","maltipoo","cavapoo","cavachon"].includes(b)) return "lapdog";
  if (b === "dalmatian") return "dalmatian";
  if (b === "dachshund") return "dachshund";
  if (["german shepherd","doberman pinscher","rottweiler","weimaraner"].includes(b)) return "german";
  if (b === "boston terrier") return "boston";
  if (["pug","chow chow","shar pei","shiba inu","akita","lhasa apso","tibetan mastiff","pekingese","japanese chin"].includes(b)) return "asian";
  if (b === "corgi") return "corgi";
  if (["siberian husky","chihuahua"].includes(b)) return "character";
  if (b === "welsh terrier") return "terrier";
  if (b === "west highland terrier") return "westie";
  if (b === "cockapoo" || b === "jackapoo") return "doodle";
  if (b.includes("setter")) return "setter";
  if (b === "old english sheepdog") return "sheepdog";
  if (b.includes("terrier") || b === "miniature schnauzer") return "terrier";
  return "default";
}

function getTraitGroup(breed: string): string[] {
  const b = breed.toLowerCase();
  const traits: string[] = [];
  // fluffy
  if (["poodle","bichon frise","pomeranian","maltese","maltipoo","cavachon",
       "old english sheepdog","samoyed","cavapoo"].some(x => b.includes(x) || b === x)) traits.push("fluffy");
  // speckled
  if (["dalmatian","border collie","cocker spaniel"].some(x => b === x || b.includes(x))) traits.push("speckled");
  // scruff
  if (["lurcher","border terrier","jack russell","west highland","miniature schnauzer","jackapoo"].some(x => b.includes(x))) traits.push("scruff");
  // hound
  if (["basset hound","bloodhound","beagle","greyhound","whippet","afghan hound","irish wolfhound"].some(x => b.includes(x) || b === x)) traits.push("hound");
  // zoom
  if (["boxer","border collie","jack russell","greyhound","whippet","lurcher","italian greyhound",
       "corgi","boston terrier"].some(x => b.includes(x) || b === x)) traits.push("zoom");
  // longtail
  if (["retriever","labrador","spaniel","setter","collie","labradoodle","goldendoodle"].some(x => b.includes(x) || b === x)) traits.push("longtail");
  return traits;
}

// Names that dominate results -- excluded from passes 1-8, allowed only in final pass
const DOMINANT_NAMES = new Set(["William","Booboo","Luna","Klaus","Ernst","Norman","Manfred","Gertrude","Ingeborg","Mayhem","Moonbeam","Flash","Miles","Megan","Maeve","Snugglebum","Venus","Neal","Mischief","Dash","Bolt","Max","Rex","Spot","Fido","Buddy","Bella","Molly","Shadow","Bruno","Lola","Sadie","Lucy","Sam","Zeus","Charlie","Cooper","Daisy","Bear","Astro","Apollo","Nova","Aurora","Cassiopeia","Atlas","Jupiter","Saturn","Cosmos","Comet","Orbit","Titan","Galileo","Kepler","Hubble","Neptune","Orion","Nebula","Sirius","Stardust","Midnight","Twilight","Starburst","Eclipse","Darkstar","Bloodmoon","Supernova","Andromeda","Artemis","Vega","Stella","Selene","Mercury","Pulsar","Quasar","Magnetar","Vulcan","Draco","Pluto","Meteor","Moonwalker","Moonshadow"]);

function pick<T>(arr: T[], seed: number): T { return arr[Math.abs(seed) % arr.length]; }

function generateScored(breed: string, surname: string, gender: "boy"|"girl", seed: number, town = "", colour: DogColour = "", excludeDominant = false, freeRange = false, allowBonus: Set<string> = new Set(), excludeFirstNames: Set<string> = new Set()) {
  const group = getGroup(breed);
  const rawNameBank = (NAMES[group] || NAMES.default)[gender];
  // Passes 1-8 exclude dominant names to force variety from the long tail
  const nameBank = excludeDominant
    ? (rawNameBank.filter((n: NameEntry) => !DOMINANT_NAMES.has(n.name)).length >= 3
        ? rawNameBank.filter((n: NameEntry) => !DOMINANT_NAMES.has(n.name))
        : rawNameBank)
    : rawNameBank;
  const titleBank = gender === "boy" ? (BOY_TITLES[group] || BOY_TITLES.default) : (GIRL_TITLES[group] || GIRL_TITLES.default);
  const wordBank = (() => {
    const base = DOG_WORDS[group] || DOG_WORDS.default;
    const traits = getTraitGroup(breed);
    const genderPool = gender === "girl" ? (DOG_WORDS.goodgirl || []) : (DOG_WORDS.goodboy || []);
    const traitWords = traits.flatMap((t: string) => DOG_WORDS[t] || []);
    const seen = new Set<string>();
    return [...base, ...traitWords, ...genderPool].filter((w: {word:string,reg:string,firstLetter:string}) => {
      if (BANNED_WORDS.has(w.word.toLowerCase())) return false;
      if (seen.has(w.word)) return false;
      seen.add(w.word); return true;
    });
  })();
  const __breedKey = breed.toLowerCase().trim();
  const __reasonPool = [
    ...(BREED_REASONING[__breedKey] || []),
    ...(REASONING[group] || []),
    ...(GREEDY_BREEDS.has(__breedKey) ? (REASONING.greedy || []) : []),
  ];
  const reasoningBank = __reasonPool.length > 0 ? __reasonPool : REASONING.default;
  const title = pick(titleBank, seed);

  // ── SURNAME-AWARE NAME + WORD SELECTION ──────────────────────────────────
  // Prefer names and dog words that alliterate with the surname initial.
  // This makes Donald → Duke/Dash/Dobby etc much more likely.
  const surnameInitial = surname.replace(/-.*/, "")[0]?.toUpperCase() ?? "";
  const soundFamily: Record<string,string> = {B:"BP",P:"BP",D:"DT",T:"DT",G:"GK",K:"GK",F:"FV",V:"FV",S:"SZ",Z:"SZ",M:"MN",N:"MN"};
  const surnameFamily = soundFamily[surnameInitial] ?? surnameInitial;

  // Filter nameBank for names starting with surname initial or sound family
  // excludeFirstNames: names already shown -- never repeat them
  const freshBank = excludeFirstNames.size > 0
    ? nameBank.filter((n: NameEntry) => !excludeFirstNames.has(n.name))
    : nameBank;
  const useFreshBank = freshBank.length >= 1 ? freshBank : nameBank; // use fresh if ANY available

  // Three-tier name picking:
  // Tier 1: alliterating names not yet seen (best -- alliteration + fresh)
  // Tier 2: any name not yet seen (drop alliteration to avoid repeat)
  // Tier 3: full bank (last resort -- all seen, allow repeat rather than crash)
  const alliteratingFresh = useFreshBank.filter((n: NameEntry) =>
    n.name[0].toUpperCase() === surnameInitial ||
    (soundFamily[n.name[0].toUpperCase()] === surnameFamily && surnameFamily.length > 1)
  );
  const matchingNames = nameBank.filter((n: NameEntry) =>
    n.name[0].toUpperCase() === surnameInitial ||
    (soundFamily[n.name[0].toUpperCase()] === surnameFamily && surnameFamily.length > 1)
  );

  let firstName: NameEntry;
  if (!freeRange && alliteratingFresh.length >= 1 && seed % 5 !== 0) {
    // Tier 1: alliterating + not seen yet
    firstName = alliteratingFresh[(seed + 3) % alliteratingFresh.length];
  } else if (useFreshBank.length >= 2) {
    // Tier 2: any fresh name (alliteration exhausted or freeRange pass)
    firstName = useFreshBank[(seed + 3) % useFreshBank.length];
  } else {
    // Tier 3: use any name from fresh bank (should always have some)
    firstName = pick(useFreshBank, seed + 3);
  }

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
  const compoundSuffixes = ["well","ford","by","ton","wick","worth","ley","son","man","sworth","berg","heim","mann","feld","dale","ington","sley","boy","girl","fast","foot","silver","stone","shaw","gate","worthy"];
  const isCompound = dogWordEntry.word.length > 8 || compoundSuffixes.some((s: string) => dogWordEntry.word.toLowerCase().endsWith(s));
  const _sn = surname.trim();
  const baseSurname = !_sn
    ? dogWordEntry.word
    : (useHyphen && !isCompound)
      ? `${dogWordEntry.word}-${_sn}`
      : isCompound
        ? `${dogWordEntry.word} ${_sn}`
        : _sn;
  const effectiveSurname = town || baseSurname || dogWordEntry.word;
  const group2 = getGroup(breed);

  const validAbbrevs = ABBREVS.filter((a: AbbrevEntry) =>
    (a.gender === "any" || a.gender === gender) &&
    (!a.breeds || a.breeds.includes(group2))
  );

  const styleRoll = seed % 13;
  let full = "";
  let nickname = "";

  if (styleRoll === 0 && validAbbrevs.length > 0 && group2 !== "poodle") {
    const abbrev = pick(validAbbrevs, seed + 5);
    const dottedCode = abbrev.code.split("").join(".");
    full = `${dottedCode} (${abbrev.meaning}) ${effectiveSurname}`;
    nickname = abbrev.code;
  } else if (styleRoll === 1 && gender === "boy" && group2 !== "poodle") {
    if (DAWG_GROUPS.includes(group2)) {
      const prefix = pick(DAWG_PREFIXES, seed + 19);
      full = `${prefix}-Dawg ${effectiveSurname}`;
      nickname = "Dawg";
    } else {
      const letter = pick(DTRAIN_LETTERS, seed + 13);
      const suffix = pick(DTRAIN_SUFFIXES, seed + 19);
      full = `${letter}-${suffix} ${effectiveSurname}`;
      nickname = getNickname(firstName.name);
    }
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
  } else if (styleRoll === 6) {
    // McBoatface: [Adj]y [CelticPrefix][Adj][BreedSuffix] Surname
    // Skip or neutralise if surname already has a Celtic/noble prefix
    const surnameHasPrefix = /^(mc|mac|o'|de|van|von|le|di|dal|fitz|ap|ferch|ni)/i.test(surname.trim());
    const mcPool6 = MCFACE_POOL[group2] || MCFACE_POOL.default;
    const mc1 = mcPool6[(seed + 31) % mcPool6.length];
    const mc2 = mcPool6[(seed + 37) % mcPool6.length];
    const mcSuffixPool = MCFACE_SUFFIX[group2] || MCFACE_SUFFIX.default;
    const mcSuffix = mcSuffixPool[(seed + 41) % mcSuffixPool.length];
    // ~1 in 3: emit only the silly middle word + surname (shorter, doubles variety)
    const mcSingle = Math.floor(seed / 13) % 3 === 1;
    if (surnameHasPrefix) {
      // Surname already has a prefix -- use bare compound name, no extra prefix
      full = mcSingle
        ? `${mc2[1]}${mcSuffix} ${effectiveSurname}`
        : `${mc1[0]} ${mc2[1]}${mcSuffix} ${effectiveSurname}`;
    } else {
      const mcPrefixPool = gender === "girl" ? MCFACE_PREFIX_GIRL : MCFACE_PREFIX_BOY;
      const mcPrefix = mcPrefixPool[(seed + 67) % mcPrefixPool.length];
      full = mcSingle
        ? `${mcPrefix}${mc2[1]}${mcSuffix} ${effectiveSurname}`
        : `${mc1[0]} ${mcPrefix}${mc2[1]}${mcSuffix} ${effectiveSurname}`;
    }
    // McFace nickname: use the clean stem (mc1[1]) + aussie suffix (za / o / ie)
    // mc1[1] is already the stripped stem e.g. ["Chompy","Chomp"] -> "Chomp" -> "Chompza"
    const mcNickStem = mc1[1];
    // Strip trailing "le" or "e" before adding the suffix so Wobble->Wobbza, Bounce->Bouncza
    const mcNickBase = mcNickStem.replace(/le$/i,"").replace(/e$/i,"");
    nickname = mcNickBase.charAt(0).toUpperCase() + mcNickBase.slice(1).toLowerCase() + aussieSuffix(gender, seed);
  } else if (styleRoll === 7) {
    // SpongeBob: [Adj][ShortName] [Adj][BodyPart] Surname
    const __sbBk = breed.toLowerCase().trim();
    const __sbCombined = [
      ...(SB_ADJ_BREED[__sbBk] || []),
      ...(SPONGEBOB_ADJ1[group2] || []),
      ...(GREEDY_BREEDS.has(__sbBk) ? SB_ADJ_GREEDY : []),
    ];
    const sbAdjPool = __sbCombined.length > 0 ? __sbCombined : SPONGEBOB_ADJ1.default;
    const sbAdj1 = sbAdjPool[(seed + 43) % sbAdjPool.length];
    const sbAdj2 = sbAdjPool[(seed + 47) % sbAdjPool.length];
    const sbMid = gender === "girl"
      ? SPONGEBOB_MID_GIRL[(seed + 53) % SPONGEBOB_MID_GIRL.length]
      : SPONGEBOB_MID_BOY[(seed + 53) % SPONGEBOB_MID_BOY.length];
    const sbBody = SPONGEBOB_BODY[(seed + 59) % SPONGEBOB_BODY.length];
    // ~2 in 3: emit only ONE silly compound (+ surname) instead of both.
    // "DodgyLin BlustyEars Gemon" -> "DodgyLin Gemon" or "BlustyEars Gemon".
    const sbMode = Math.floor(seed / 13) % 3;
    if (sbMode === 1) {
      full = `${sbAdj1}${sbMid} ${effectiveSurname}`;
    } else if (sbMode === 2) {
      full = `${sbAdj2}${sbBody} ${effectiveSurname}`;
    } else {
      full = `${sbAdj1}${sbMid} ${sbAdj2}${sbBody} ${effectiveSurname}`;
    }
    // Bob → Bobby etc -- always use the expanded form, no fusion
    const sbNickMap: Record<string,string> = {
      Bob:"Bobby",Tom:"Tommy",Tim:"Timmy",Sam:"Sammy",Jim:"Jimmy",
      Ned:"Neddy",Ted:"Teddy",Sid:"Sidney",Baz:"Bazza",Reg:"Reggie",
      Len:"Lenny",Ken:"Kenny",Mick:"Micky",Nick:"Nicky",Pip:"Pippa",
      Alf:"Alfie",Ron:"Ronnie",Don:"Donnie",Gav:"Gavvy",Dez:"Dezzy",
      Val:"Vally",Kay:"Kaykay",Di:"Didi",Mo:"Momo",Jo:"Jojo",
      Dot:"Dottie",Flo:"Florrie",Sue:"Suey",Jan:"Janny",Pam:"Pammy",
      Bev:"Bevvy",Bea:"Beabea",Fran:"Franny",Gail:"Gaily",Sal:"Sally",
      Nan:"Nanny",Babs:"Babsy",Kim:"Kimmy",Lin:"Linny",May:"Maymay"
};
    // Half the time use the friendly map (Baz->Bazza), otherwise an aussie suffix
    // on the stem for variety (Baz->Bazo / Bazie), roughly doubling nickname output.
    nickname = (Math.abs(seed) % 2 === 0)
      ? (sbNickMap[sbMid] || sbMid)
      : (sbMid + aussieSuffix(gender, seed));
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

    if (!nickname) {
      const fn = firstName.name;
      const isWhimsy = /[A-Z][a-z]+(wick|bean|boots|chops|snout|paws|bum|face|nose|bonce|flap|pants)$/.test(fn) ||
                       /^(Noo-Noo|Squishface|Smooshface|Snugglebum|Cuddlekins|Fluffybum|Puddingkins|Babbycakes|Tiddlywink)$/.test(fn);

      // ── SOLUTION 2: ACCIDENTAL ACRONYM ────────────────────────────────────
      // Title initial + First name initial → reads as something mundane/funny
      // Never fire on whimsy compound names -- the comedy brief says if a name
      // won't survive the Mate Test, it's a signal the name itself is weak
      // For multi-word titles, use the LAST word's initial to avoid false matches
      // "Grand Duchess" → D (Duchess), "The Right Honourable" → H (Honourable)
      // Single-word titles use their own initial as normal
      const cleanTitle = title.title.replace(/^(The |Lil'|Ol'|Wee|Baby|Little|Scruffy|Fluffy|Grumpy|Noisy)\s*/,"");
      const titleWords = cleanTitle.trim().split(/\s+/);
      const tI = (titleWords.length > 1 ? titleWords[titleWords.length - 1][0] : titleWords[0]?.[0] ?? "").toUpperCase();
      const nI = fn[0]?.toUpperCase() ?? "";
      const noAcronymTitles = new Set(["Mr","Mrs","Ms","Miss","Dr","Sir","Dame","Lord","Lady"]);

      // ── ACRONYM WHITELIST ─────────────────────────────────────────────────────
      // Rule: BOTH letters must be visibly in the name (title initial + first name initial)
      // AND the combo must be genuinely culturally loaded -- people say it as a thing
      const ACRONYM_PUNS_BOY: Record<string,string> = {
        "DJ":"DJ",   "MC":"MC",   "LL":"LL",   "OG":"O.G.", "TT":"TT",
        "JR":"J.R.", "JK":"J.K.", "DC":"D.C.", "CJ":"C.J.", "AK":"A.K.",
        "CV":"C.V.", "GB":"G.B.", "MP":"M.P.", "GP":"G.P.", "PC":"P.C.",
        "VC":"V.C.", "PG":"P.G.", "NW":"N.W.", "HM":"H.M.", "BP":"B.P.",
        "BR":"B.R.", "BC":"B.C.", "FC":"F.C.", "MK":"M.K.",
      };
// Girl acronym puns -- queen/boss/diva energy, nothing male-coded
const ACRONYM_PUNS_GIRL: Record<string,string> = {
        "BQ":"B.Q.", // Boss Queen
        "HQ":"H.Q.", // Her Queenness
        "QC":"Q.C.", // Queen Commander
        "QG":"Q.G.", // Queen Goddess
        "QR":"Q.R.", // Queen Regent
        "QB":"Q.B.", // Queen Boss
        "QM":"Q.M.", // Queen Magnificent
        "GQ":"G.Q.", // Goddess Queen
        "GG":"G.G.", // Grand Goddess
        "DQ":"D.Q.", // Drama Queen
        "HH":"H.H.", // Her Highness
        "LL":"LL",   // Lady Louise/Lavinia
        "LD":"L.D.", // Lady Divine
        "LB":"L.B.", // Lady Boss
        "LG":"L.G.", // Lady Gorgeous
        "DB":"D.B.", // Duchess Boss
        "DG":"D.G.", // Duchess Gorgeous
        "DL":"D.L.", // Duchess Lovely
        "EB":"E.B.", // Empress Boss
        "EG":"E.G.", // Empress Gorgeous
        "EL":"E.L.", // Empress Lovely
        "PR":"P.R.", // Princess Royal
        "PB":"P.B.", // Princess Boss
        "PG":"P.G.", // Princess Gorgeous
        "RQ":"R.Q.", // Royal Queen
        "CB":"C.B.", // Crown Boss
        "CG":"C.G.", // Crown Gorgeous
        "DC":"D.C.", // Divine Commander
        "DJ":"DJ",   // Duchess/Divine Jackie
        "MC":"MC",   // Magnificent/Majestic Clara
        "NQ":"N.Q.", // Notable Queen
      };
const ACRONYM_PUNS: Record<string,string> = {...ACRONYM_PUNS_BOY, ...ACRONYM_PUNS_GIRL};


      // Hard rule: acronym only fires if BOTH letters appear in the full name
      // tI = title initial, nI = first name initial -- both must be present
      // (they always will be since full = title + firstName + ..., so this is
      // really a sanity check against edge cases)

      // Special cases first
      // 4G: only fires when ALL FOUR elements start with G -- General + G-name + G-word + G-surname
      const dogWordInitial = dogWordEntry?.word?.[0]?.toUpperCase() ?? "";
      const surnameInitialForNick = surname.replace(/-.*/, "")[0]?.toUpperCase() ?? "";
      if (title.title === "General" && nI === "G" && dogWordInitial === "G" && surnameInitialForNick === "G") {
        nickname = "4G";
      } else if (title.title === "Doctor" && firstName.syllables >= 2 && !getNickname(fn) && !isWhimsy) {
        nickname = `Dr ${nI}`;
      } else if (title.title === "Professor" && firstName.syllables >= 2 && !getNickname(fn) && !isWhimsy) {
        nickname = `Prof ${nI}`;
      } else if (!noAcronymTitles.has(title.title) && tI && nI && (gender === "girl" ? ACRONYM_PUNS_GIRL : ACRONYM_PUNS_BOY)[tI + nI] && !isWhimsy && group2 !== "poodle") {
        // Only fire if:
        // 1. First name is real (not whimsy compound)
        // 2. Both letters are genuinely in the name -- hard fail if either is missing
        const isRealish = firstName.reg === "mundane" || firstName.reg === "grand" || firstName.reg === "nature";
        const nameContainsBothLetters = full.toUpperCase().includes(tI) && full.toUpperCase().includes(nI);
        if (isRealish && nameContainsBothLetters) nickname = (gender === "girl" ? ACRONYM_PUNS_GIRL : ACRONYM_PUNS_BOY)[tI + nI];
      }

      // ── SOLUTION 1: MATE TEST ─────────────────────────────────────────────
      // Fallback -- ignore title, ignore dog-word, ignore surname entirely
      // Take the first name. Shorten the way a British mate would.
      // If it's a whimsy compound with no real shortening, just use the name.
      if (!nickname) {
        const naturalNick = getNickname(fn);
        if (naturalNick) {
          nickname = naturalNick;   // Trevor→Trev, Dorothy→Dot, Basil→Baz
        } else {
          // For whimsy names: strip the compound suffix and use the stem
          if (isWhimsy) {
            const stem = fn.replace(/(wick|bean|boots|chops|snout|paws|bum|face|flap|pants)$/i,"").trim();
            nickname = stem.length >= 3 ? stem : fn;
          } else {
            nickname = fn;          // short real name stands alone: Dot, Rex, Gus, Pip
          }
        }
      }
    }
  }

  // ── Universal nickname fallback -- fires for ALL styleRolls ─────────────────
  // Any path that left nickname as "" gets the first name as a minimum
  if (!nickname) {
    const tableNick = getNickname(firstName.name, seed);
    if (tableNick) {
      nickname = tableNick;
    } else {
      // Whimsy compound -- strip suffix, use stem
      const isWhimsy2 = /[A-Z][a-z]+(wick|bean|boots|chops|snout|paws|bum|face|nose|bonce|flap|pants)$/.test(firstName.name);
      if (isWhimsy2) {
        const stem = firstName.name.replace(/(wick|bean|boots|chops|snout|paws|bum|face|flap|pants)$/i,"").trim();
        nickname = stem.length >= 3 ? stem : firstName.name;
      } else {
        nickname = firstName.name;  // bare first name -- always valid
      }
    }
  }

  const reasoning = pick(reasoningBank, seed + 11);
  const score = scoreName(title, firstName, dogWordEntry, surname, colour);

  // ── RESCUE PASS: if score < 15 and name has a title, try bare name ─────────
  // Strip the title and rescore -- sometimes the name is funnier without it
  const RESCUE_THRESHOLD = 15;
  if (score < RESCUE_THRESHOLD && styleRoll >= 4) {
    // Already a no-title style -- return as-is
    return { full, nickname, reasoning, score };
  }
  if (score < RESCUE_THRESHOLD && full.startsWith(title.title + " ")) {
    // Build bare version: just firstName + surname
    const bareFull = `${firstName.name} ${effectiveSurname}`;
    // Score the bare name using a dummy "no title" entry
    const noTitle: TitleEntry = { title: "", reg: "mundane" as Register, syllables: 0 };
    const bareScore = scoreName(noTitle, firstName, dogWordEntry, surname, colour);
    if (bareScore > score) {
      // Bare name scores better -- use it
      const bareNick = getNickname(firstName.name, seed) || nickname;
      return { full: bareFull, nickname: bareNick, reasoning, score: bareScore };
    }
  }

  // ── GENERATED NICKNAME: improve sparse/echo nicknames ────────────────────
  const improvedNick = bestNickname({
    firstNameStr: firstName.name,
    dogWord: dogWordEntry.word,
    realSurname: _sn,
    current: nickname,
    fullName: full,
    gender: gender,
  });
  if (improvedNick) nickname = improvedNick;

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
  B: ["Boffle", "Boffleboots", "Bofflewick", "Boogles", "Boondoggle", "Bumblebean", "Bumbleboots", "Bumblebop", "Bumblebottom", "Bumblechops", "Bumblekins", "Bumblepaws", "Bumblepuff", "Bumblesnack", "Bumblesnout", "Bumblewhisk", "Bumblewick", "Bumblewink", "Bunglebean", "Bungleboots", "Bunglechops", "Bunglepaws", "Bunglepuff", "Bunglewink"],
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
  W: ["Waffleton", "Wafflewhisk", "Waggledorf", "Wagglenose", "Wagglesnack", "Wagglesnort", "Wagglesworth", "Wagglybean", "Wagglyboots", "Wagglychops", "Wagglypaws", "Wagglypuff", "Wagglywhisk", "Wagglywink", "Wibbleton", "Wibblewobble", "Wobblebean", "Wobbleboots", "Wobblebug", "Wobblechops", "Wobblekins", "Wobblepaws", "Wobblepot", "Wobblepuff", "Wobblewhisk", "Wobblewick", "Wobblewink", "Womble", "Womblepaws", "Wompadoodle", "Wompington", "Wompus", "Wompusbean", "Wompusboots", "Wompuschops", "Wompuspuff", "Wompuswhisk", "Wompuswink"]
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
  { pattern: /kins$/i, groups: ["lapdog","character"] }];

function whimsyAllowed(word: string, group: string): boolean {
  for (const rule of WHIMSY_RULES) {
    if (rule.pattern.test(word) && !rule.groups.includes(group)) return false;
  }
  return true;
}

const MCFACE_POOL: Record<string, [string, string][]> = {
  sniffer:    [["Droopy","Droop"],["Drooly","Drool"],["Nosey","Nose"],["Tracky","Track"],["Houndy","Hound"]],
  retriever:  [["Chompy","Chomp"],["Waggy","Wag"],["Gobby","Gob"]],
  terrier:    [["Scratchy","Scratch"],["Nippy","Nip"],["Scrappy","Scrap"],["Bolty","Bolt"],["Ratty","Rat"],["Snappy","Snap"],["Zippy","Zip"]],
  boxer:      [["Snorty","Snort"],["Wobbly","Wobble"],["Boingy","Boing"],["Bumpy","Bump"]],
  character:  [["Snorty","Snort"],["Puffy","Puff"],["Grumbly","Grumble"],["Waddly","Waddle"],["Squishy","Squish"]],
  lapdog:     [["Fluffy","Fluff"],["Boingy","Boing"],["Prancy","Pranc"],["Shimmery","Shimmer"],["Glittery","Glitter"]],
  collie:     [["Herdy","Herd"],["Zippy","Zip"],["Darty","Dart"],["Sprinty","Sprint"]],
  poodle:     [["Prancy","Prance"],["Swishy","Swish"],["Curly","Curl"]],
  sighthound: [["Speedy","Speed"],["Swoopy","Swoop"],["Swoopy","Swoop"],["Darty","Dart"],["Flashy","Flash"],["Gleamy","Gleam"],["Streaky","Streak"]],
  dachshund:  [["Wiggly","Wiggle"],["Stubby","Stubb"]],
  giant:      [["Stompy","Stomp"],["Thumpy","Thump"],["Shakey","Shake"],["Swavy","Sway"]],
  greatdane:  [["Starry","Star"],["Stompy","Stomp"],["Thumpy","Thump"]],
  spaniel:    [["Splashy","Splash"],["Waggy","Wag"],["Fetchy","Fetch"],["Frolicky","Frolic"],["Scampy","Scamp"],["Bouncy","Bounce"]],
  german:     [["Strict","Stric"]],
  asian:      [["Snorty","Snort"],["Waddly","Waddle"],["Grumbly","Grumble"],["Squishy","Squish"],["Puffy","Puff"],["Rolly","Roll"]],
  boston:     [["Strutty","Strutt"],["Scrappy","Scrap"],["Dodgy","Dodge"]],
  afghan:     [["Flowy","Flow"],["Swooshy","Swoosh"]],
  bulldog:    [["Grumbly","Grumble"],["Wobbly","Wobble"],["Jowly","Jowl"],["Rolly","Roll"]],
  sheepdog:    [["Fluffy","Fluff"],["Shaggy","Shagg"],["Wobbly","Wobble"],["Lumbery","Lumber"],["Dozy","Doz"],["Floopy","Floop"],["Poofy","Poof"]],
  dalmatian:   [["Spotty","Spot"],["Dotty","Dot"],["Dashing","Dash"],["Flashy","Flash"],["Streaky","Streak"],["Patchy","Patch"],["Blinky","Blink"],["Freckly","Freck"]],
  labradoodle: [["Bouncy","Bounce"],["Waggy","Wag"],["Fluffy","Fluff"],["Curly","Curl"],["Floppy","Flop"],["Splashy","Splash"],["Wiggly","Wiggle"],["Noodly","Noodl"]],
  corgi:       [["Waddy","Wadd"],["Stumpy","Stump"],["Bossy","Boss"],["Trotty","Trot"],["Nippy","Nip"],["Herdy","Herd"]],
  default:    [["Chompy","Chomp"],["Scrappy","Scrap"],["Waggy","Wag"],["Snappy","Snap"],["Bouncy","Bounce"],["Zippy","Zip"],["Nosy","Nose"]]
};

const SPONGEBOB_ADJ1: Record<string, string[]> = {
  sniffer: ["Droopy","Slobby","Flappy","Snuffly","Lolly","Nosey","Wrinkly","Jowly","Nosebag","Snifter","Bisto","Gravy"],
  retriever: ["Slobby","Chompy","Waggy","Fluffy","Moppy","Scruffy","Soggy","Hungry","Sandy","Biscuit","Crumpet","Muddy","Splashy","Supper","Gobble","Muncher","Scoffy","Doorstop","Dipper","Paddle"],
  terrier: ["Scratchy","Nippy","Yappy","Scruffy","Wiry","Zippy","Grubby","Bolty","Scrappy","Nipper","Titch","Ratty"],
  boxer: ["Wobbly","Clumsy","Bumpy","Bouncy","Snorty","Boingy","Crashy","Biff","Boff","Bonkers","Bouncer","Thumper","Bumble","Clonker","Crashley","Foghorn","Rumble","Jabber","Knuckly","Wobble","Tussle","Pudding"],
  character: ["Snorty","Squashy","Puffy","Grumbly","Waddly","Squinty","Wrinkly","Squishy","Sooty","Sweep","Clanger"],
  lapdog: ["Fluffy","Prancy","Bouncy","Squashy","Flouncy","Glittery","Twinkly","Sparkly","Tuppence","Button","Bunty","Mitten","Poppet","Titch","Mopsy","Flossy","Dolly","Binky","Twinkle","Crumpet","Sugarplum","Dainty","Biscuit"],
  collie: ["Zippy","Herdy","Fidgety","Darty","Sprinty","Circly","Starey","Fixey","Boffin","Fidget","Whizz","Nimble","Weaver","Twitchy","Pacey","Shepster","Bendy","Muster","Corner","Nipley","Brainy","Watchit"],
  poodle: ["Prancy","Strutty","Swishy","Mincy","Curly","Fluffy","Posy","Primmy","Pompon","Froufrou","Prissy","Crimper","Bouffant","Flossy","Mincie","Twizzle","Fancy","Taffeta","Poodlewick","Frilly"],
  sighthound: ["Speedy","Swoopy","Flashy","Streaky","Swishy","Darty","Gleamy","Lanky","Needle","Whippetty","Longshanks","Slinky","Swoosh","Breezy","Twiglet"],
  dachshund: ["Stretchy","Wiggly","Wormy","Scuttly","Squeezy","Stubby","Waggy","Sausagey","Slinky","Doorstop","Longboy","Wriggler","Tunnel","Badger","Stumpy","Scooter","Welly","Stretch","Noodle","Pootle","Banger","Chippy"],
  giant: ["Biggles","Stompy","Loomy","Lumpy","Rumbly","Thumpy","Shakey","Swayzy","Lumber","Hulkley","Boulder","Bargey","Trundle","Clomper","Thudder","Whopper","Dozer"],
  greatdane: ["Cosmo","Starry","Biggles","Orby","Stompy","Loomy","Thumpy","Lofty","Lanky","Tower","Beanstalk","Hagridy","Giantly","Ceiling","Whopper","Loomer"],
  spaniel: ["Splashy","Waggy","Floppy","Bouncy","Scampy","Frolicky","Gambolly","Rompy","Soggy","Flopsy","Mopsy","Splasher","Puddle","Feathery","Waggle","Bouncer","Bracken","Snuffler","Gambol","Scamper","Rustle","Springy"],
  german: ["Patrolly","Stricty","Marchy","Guardy","Drilley","Sentry","Flanky","Breachy"],
  asian: ["Snorty","Grumbly","Waddly","Squishy","Puffy","Wrinkly","Rolly","Stumply","Pekoe","Bunty","Mochi","Dumpling","Snooty","Squidge","Button","Noodle","Pebbly","TeaLeaf","Pagoda","Poppet","Puffin","Squinty","Crinkly"],
  boston: ["Strutty","Hustly","Scrappy","Dodgy","Rattly","Jazzy","Marchy","Blusty","Beanie","Peepers","Goggles","Blinky","Bowtie"],
  afghan: ["Flowy","Swooshy","Glidy","Aloofy","Drifty","Surgy","Swoopy","Sweepy","Silky","Swishy","Fringey","Velvety","Curtain","Topknot","Flicky","Floaty","Regally","Duchess","Shampoo","Glamour","Wispy","Flouncey","Breezy"],
  bulldog: ["Grumbly","Snorty","Wobbly","Jowly","Stuffy","Rolly","Squashy","Blusty"],
  sheepdog: ["Fluffy","Shaggy","Wobbly","Bumbly","Lumbery","Shuffly","Dozy","Floppy","Poofy","Drifty"],
  dalmatian: ["Spotty","Dotty","Dashing","Flashy","Streaky","Zippy","Patchy","Speedy","Blinky","Freckly"],
  labradoodle: ["Bouncy","Waggy","Fluffy","Scruffy","Curly","Floppy","Splashy","Wiggly","Noodly","Gambolly"],
  corgi: ["Waddly","Stumpy","Bossy","Trotty","Nippy","Patrolly","Scurry","Shuffly","Perky","Herdy","Crumpet","Teacake","Tuppence","Waddle","BossyBoots","Titch","Pasty","Cobbler","Biscuit","Hobnob","Nipper","Trotter","Pootle","Butty"],
  default: ["Trotty","Wandy","Prowly","Lopy","Stalky","Canter","Sauntry","Thingummy","Whatsit"]
};

// Breed-specific SpongeBob adjective/name pools (combined with group + greedy).
const SB_ADJ_BREED: Record<string, string[]> = {
  "basset hound": ["Droopy","Flappy","Doormat","Snuffle","Lowry","SoggyEars","Longface","Pudding","Wobble"],
  "bichon frise": ["Flossy","Powderpuff","Meringue","Snowdrop","Bubbles","Bonbon","Dolly","Cotton","Pompon","Cupcake","Flumpy"],
  "bloodhound": ["Snooper","Sherlock","Nosebag","Snifter","Cluey","Pongle","Wrinkles","Snout","Truffle","Bisto","Gravy","Rootle"],
  "border terrier": ["Grizzle","Twiggy","Rascal","Bramble","Nipper","Scruff","Hedgerow","Wiry","Tweedle","Badger"],
  "bulldog": ["Churchill","Grumble","Jowlsy","Stodge","Clumper","Bargey","Huffers","Dumpty","Squidge","Porkpie","Dozer"],
  "dalmatian": ["Dotty","Freckles","Spotsy","Domino","Pongoish","Coachie","Blinker"],
  "doberman pinscher": ["Sentry","Sharpish","Slicker","Watchman","Boots","Gripper","Bastion"],
  "french bulldog": ["Baguette","Truffle","Snorty","Squidge","Bunty","Button","Grumble"],
  "greyhound": ["Noodlelegs","Longshanks","Snoozy","Faintly","Drafty","Bony","Lanky","Blanket","Skimmy","Whizzy"],
  "italian greyhound": ["Twiglet","Noodle","Tippy","Skimpy","Drafty","Whippy","Needle","Slinky","Faintly","Teacup"],
  "jack russell terrier": ["Nipper","Scrappy","Boltie","Digby","Yapper","Pickle","Titch"],
  "labrador": ["Biscuit","Supper","Scoffy","Muddy","Soggy","Welly","Puddle","Bouncer","Taster","Crumb","Gobble","Snaffle","Toastie","Muncher"],
  "lurcher": ["Scruffhound","Hedgerow","Slinky","Poacher","Brindle","Longshanks","Twiglet"],
  "maltese": ["Pearl","Flossy","Cotton","Dolly","Bunty","Mopsy","Sugar","Tuppence","Teacake"],
  "maltipoo": ["Marshmallow","Flump","Bubbles","Mopsy","Biscuit","Poppet","Cupcake"],
  "mastiff": ["Boulder","Dozer","Clumper","Bargey","Tankard"],
  "miniature schnauzer": ["Whiskers","Bristle","Tache","Grizzle","Tweedle","Boffin","Sprocket"],
  "old english sheepdog": ["Dougal","Shaggy","Womble","Bobble","Mopsey","Sooty","Floof"],
  "papillon": ["Flutter","Butterfly","Froufrou","Tippy","Fancy","Ribbon","Bunty","Perky","Flit","Pixie"],
  "pomeranian": ["PomPom","Fluffkin","TinyPuff","Biscuit","Bunty","Dandelion","Fizzy","Tassel","Peppy","Button","Powderpuff"],
  "poodle": ["Pompon","Froufrou","Prissy","Crimper","Bouffant","Flossy","Mincie","Twizzle","Fancy","Taffeta","Frilly"],
  "pug": ["Squidge","Wrinkles","Snorty","Pudding","Crumpet","Dumpling","Button"],
  "rottweiler": ["Bouncer","Sentry","Boots","Bruiser","Tankard","Brock","Gripper","Lockley","Brass","Hobnail","Muzzle","Watchman","Truncheon","Bastion","Clanker","Gunner","Blocker","Boltlock","Grizzle","Stanch","Bramble","Ironpaw","Sprocket","Gatehouse","Keeper"],
  "saint bernard": ["Barrel","Blanket","Biggles","Avalanche","Craggy","Muggy","Dozer","Snowdrift","Boulder"],
  "shih tzu": ["Topknot","Mopsy","Flossy","Bunty","Fringe","Dolly","Tassel"],
  "siberian husky": ["Snowball","Musher","Howly","Frosty","Blizzard","Biscuit","Woolly","Yodel","Sledgy","Icicle"],
  "staffordshire bull terrier": ["Biff","Chunky","Squaddie","Nugget","Bouncer","Tanky","Wagstaff","Brickie","Smiler","Pudding","Bodger","Bossy"],
  "weimaraner": ["Velvet","Silver","Ghostly","Misty","Shadow","Slinker","Gunner","Snooty","Pewter","Moonish"],
  "west highland terrier": ["Cracker","Scrappy","Thistle","Sooty","Shortbread","Nipper","Tattie","Fidget","Bramble"],
  "whippet": ["Whippy","Twiglet","Snoozy","Slinky","Drafty","Lanky","Blanket","Skimmy","Faintly","Needle","Zoomy"],
};
const SB_ADJ_GREEDY: string[] = ["Cracklin","Doorstop","Porkpie","Butty","Bap","Cobbler","Sarnie","Chipolata","Bangers","Mashy","Gravy","Yorkie","Pudding","Crumble","Custard","Trifle","Biscuit","Hobnob","Digestive","Crumpet","Teacake","Toastie","Marmite","Pickledilly","Snaffle","Scoffy","Gobble","Niblet","Chomper","Greedyboots"];

const SPONGEBOB_MID_BOY: string[]  = ["Boboth","Tommy","Timmy","Sammy Sam","Jimithy","Maxspeed","Oscar","Ned","Ted","Sid","Bazanold","Reggy","Len","Ken","Mick","Rick","Nick","Steve","Alf","Kev","Dez","Cuthbert","Ron","Don"];
const SPONGEBOB_MID_GIRL: string[] = ["Susan","Jamula","Pamela","Bev","Dot","Abigail","Kay","Joy","Liz","Linette","Peggy","Valary","Babs","Bea","Francis","Gail","Sally","Annie","Mo","Jenny"];
const SPONGEBOB_BODY: string[]     = ["Pants","Paws","Face","Bum","Draws","Nose","Tail","Snout","Chops","Chomps","Feet","Tum","Belly","Jowls","Bark","Toes","Howl","Woof","Growl","Wag"];

const MCFACE_SUFFIX: Record<string, string[]> = {
  sniffer: ["nose", "snoot", "snout", "find", "track", "hound", "jowls", "sniff"],
  retriever: ["chops", "tum", "bonce", "chomps", "jowls", "paws", "bum", "tail"],
  terrier: ["butt", "chops", "bonce", "snoot", "paws", "tail", "ears"],
  boxer: ["snout", "jowls", "chops", "bonce", "butt", "tum", "snort", "face"],
  character: ["snout", "jowls", "butt", "bonce", "chops", "face", "tum", "belly"],
  lapdog: ["bum", "bonce", "face", "paws", "ears", "tail", "chops", "snoot"],
  collie: ["paws", "tail", "bonce", "butt", "chops", "ears", "face", "snoot"],
  poodle: ["bonce", "face", "snoot", "paws", "chops", "tail", "bum", "ears"],
  sighthound: ["butt", "tail", "paws", "bonce", "face", "snoot", "chops", "ears"],
  dachshund: ["bum", "butt", "tail", "bonce", "tum", "chops", "face", "snoot"],
  giant: ["bonce", "butt", "tum", "jowls", "chops", "paws", "face", "snout"],
  greatdane: ["bonce", "butt", "paws", "tail", "face", "chops", "snoot", "tum"],
  spaniel: ["ears", "paws", "tail", "bonce", "chops", "face", "snoot", "belly"],
  german: ["bonce", "paws", "tail", "face", "chops", "butt", "snoot", "ears"],
  asian: ["snout", "jowls", "tum", "bonce", "chops", "butt", "face", "snort"],
  boston: ["bonce", "butt", "chops", "face", "snoot", "ears", "paws", "tail"],
  afghan: ["tail", "bonce", "face", "paws", "snoot", "butt", "ears", "chops"],
  bulldog: ["jowls", "snout", "chops", "tum", "bonce", "butt", "face", "belly"],
  default: ["bonce", "butt", "face", "chops", "paws", "tail", "snoot", "bum"]
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
  "paisley":"scotland","motherwell":"scotland","hamilton":"scotland"
};

// Regional term pools -- these become first names or nicknames
const REGIONAL_TERMS: Record<string, string[]> = {
  brum: ["Bab","Babby","Babs","OurKid","ArKid","MeBab","Duck","Cock","Cocker","OldBean","Chick","Chucky","Mucker"],
  eastmids: ["Duck","Ducky","Duckie","MeDuck","MyDuck","Love","Luv","Bab","Youth","MeYouth"],
  yorks: ["Love","Luv","Cock","Cocker","OldBean","Lad","Lass","Duck","Pet","Flower","Pal","Kidda"],
  nw: ["Chuck","Chucky","Chuckie","Love","Luv","OurKid","Kidda","Cock","Cocker","Mate","Pal","Mucker","Lad","Lass","Flower","Petal"],
  northeast: ["Pet","Petal","Hinny","Flower","Marra","Love","Luv","BonnyLad","BonnyLass","Lad","Lass","Bairn","Littleun","Youngblood"],
  westcountry: ["Lover","MyLover","MeLover","MyLovely","MeLovely","MyHandsome","MeHandsome","MyBeauty","Love","Luv","Darling","Maid","MyMaid"],
  london: ["Treacle","Sweetheart","Darling","Dear","Love","Luv","Lovely","Babe","Babes","Doll","Dollface","Poppet","Petal","Flower","Guv","Sonny"],
  scotland: ["Hen","WeeHen","Pal","WeePal","Doll","Dollie","Dearie","Love","WeeMan","WeeLass","Lassie","Laddie","Bairn","WeeYin","Bonny"]
};

// Display form of compound terms (stored without spaces, displayed with)
const REGIONAL_DISPLAY: Record<string, string> = {
  OurKid:"Our Kid",ArKid:"Ar Kid",MeBab:"Me Bab",OldBean:"Old Bean",
  MeDuck:"Me Duck",MyDuck:"My Duck",MeYouth:"Me Youth",
  BonnyLad:"Bonny Lad",BonnyLass:"Bonny Lass",Littleun:"Little'un",
  Youngblood:"Young'un",MyLover:"My Lover",MeLover:"Me Lover",
  MyLovely:"My Lovely",MeLovely:"Me Lovely",MyHandsome:"My Handsome",
  MeHandsome:"Me Handsome",MyBeauty:"My Beauty",MyMaid:"My Maid",
  WeeHen:"Wee Hen",WeePal:"Wee Pal",WeeMan:"Wee Man",WeeLass:"Wee Lass",
  WeeYin:"Wee Yin",Dollie:"Dollie",Dearie:"Dearie",Dollface:"Dollface"
};

function getRegionalTerm(town: string, seed: number, gender: "boy"|"girl"): string | null {
  const key = town.toLowerCase().trim();
  const region = REGIONAL_TOWNS[key];
  if (!region) return null;
  const pool = REGIONAL_TERMS[region] || [];
  if (pool.length === 0) return null;
  // Filter by gender -- some terms are gender-specific
  const femPool = ["Lass","WeeYin","WeeLass","Lassie","Maid","MyMaid","Hen","WeeHen","BonnyLass","Dollie","Doll","Dollface"];
  const mascPool = ["Lad","Laddie","WeeMan","BonnyLad","Guv","Sonny","OldBean"];
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
    .map(r => ({ r, final: r.score * 0.6 + comedyScore(r, group) * 0.4 }))
    .sort((a, b) => b.final - a.final)
    .map(x => x.r);
}

// ── GENERATION HELPERS ────────────────────────────────────────────────────────
function runPass(
  breed: string, surname: string, gender: "boy"|"girl",
  baseSeed: number, town: string, colour: DogColour,
  bonusPool1: string[], bonusPool2: string[], excludeDominant = false, freeRange = false,
  excludeFirstNames: Set<string> = new Set()
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
    h:"glide"
};
  const sf2: Record<string,string> = {
    m:"nasal",n:"nasal",s:"sstop",t:"sstop",p:"sstop",k:"sstop",
    g:"growl",b:"growl",d:"growl",r:"growl",w:"glide2",h:"glide2"
};
  function allit(a: string, b: string): boolean {
    const f = a[0]?.toLowerCase() ?? "", w = b[0]?.toLowerCase() ?? "";
    return f === w || (!!sf[f] && sf[f] === sf[w]);
  }

  const raw = Array.from({length:20}, (_, i) => {
    const r = generateScored(breed, surname, gender, baseSeed + i * 17, town, colour, excludeDominant, freeRange, new Set<string>(), excludeFirstNames);
    if (!r) return null;
    const parts = r.full.split(" ");
    const fn = parts[1] ?? "";
    // Extract the dog word from the hyphenated surname
    const lastPart = parts[parts.length - 1] ?? "";
    const dogWord = lastPart.includes("-") ? lastPart.split("-")[0] : "";

    let qBonus = 0;
    if (doubleBonus.has(fn)) qBonus += 12;  // answered multiple questions pointing here -- strong signal
    else if (bonusPool1.includes(fn)) qBonus += 8;  // directly chosen answer
    else if (bonusPool2.includes(fn)) qBonus += 3;  // appeared in unchosen answers

    // If name doesn't alliterate with dog word, try a whimsy replacement
    const isAbbrevStyle = /^[A-Z]\.[A-Z]/.test(parts[0] ?? "");
    const noWhimsyGroups = ["sighthound","german","giant","afghan","poodle","sniffer","bulldog","gentry","asian","dalmatian","greatdane","boxer"];
    // Whimsy replacement: only on roughly 1 in 4 passes, and only when
    // the real name is genuinely weak (not alliterating strongly)
    const whimsySeed = (baseSeed + i * 7) % 4;  // 0,1,2,3 -- only fire on 0
    if (whimsySeed === 0 && dogWord && !allit(fn, dogWord) && !isAbbrevStyle && !noWhimsyGroups.includes(breed ? getGroup(breed) : "")) {
      const letter = dogWord[0].toUpperCase();
      const pool = WHIMSY[letter];
      if (pool && pool.length > 0) {
        const whimsyName = pool[(baseSeed + i * 13) % pool.length];
        if (!whimsyAllowed(whimsyName, getGroup(breed))) { return { ...r, score: r.score + qBonus }; }
        const wParts = [...parts];
        wParts[1] = whimsyName;
        const wFull = wParts.join(" ");
        // Whimsy gets a small bonus for alliteration but must genuinely beat the real name
        const wScore = r.score + 2 + (doubleBonus.has(whimsyName) ? 4 : allBonus.has(whimsyName) ? 2 : 0);
        if (wScore > r.score + qBonus) {
          const wNick = (() => {
            const stem = whimsyName.replace(/(wick|bean|boots|chops|snout|paws|bum|face|nose|bonce|flap|pants|puff|ling|kins)$/i,"").trim();
            return stem.length >= 3 && stem !== whimsyName ? stem : whimsyName;
          })();
          return { ...r, full: wFull, nickname: wNick, score: wScore };
        }
      }
    }

    return { ...r, score: r.score + qBonus };
  }).filter(Boolean) as Result[];

  raw.sort((a,b) => b.score - a.score);

  // Prefix tiebreaker if top score below threshold
  const THRESHOLD = 19;
  if ((raw[0]?.score ?? 0) < THRESHOLD) {
    const group = getGroup(breed);
    const prefixed = Array.from({length:20}, (_, i) => {
      const r = generateScored(breed, surname, gender, baseSeed + i * 17, town, colour, excludeDominant, freeRange, new Set<string>(), excludeFirstNames);
      if (!r) return null;
      let pe: { prefix: string; bonusContrast: number };
      if (gender === "boy") {
        const matching = TITLE_PREFIXES.filter((p: PrefixEntry) => p.breeds.includes(group));
        if (!matching.length) return null;
        pe = matching[(baseSeed + i) % matching.length];
      } else {
        pe = TITLE_PREFIXES_GIRL[(baseSeed + i) % TITLE_PREFIXES_GIRL.length];
      }
      const parts    = r.full.split(" ");
      const firstWord = parts[0];
      const alreadyGrand   = ["Magnificent","Formidable","Legendary","Unstoppable","Great","Notorious","Incomparable","Professor","Doctor","Chief Analyst"];
      const informalTitles = ["Lil'","Baby","Little","Big","Ol'","Cheeky","Silly","Scruffy","Fluffy","Grumpy","Noisy","Squishy","Itsy","Teeny","Ol'"];
      if (alreadyGrand.includes(firstWord) || informalTitles.includes(firstWord)) return null;
      const isDTrain    = /^[A-Z]-/.test(firstWord);
      const isAbbrev    = /^[A-Z]{1,4}$/.test(firstWord);
      const isDotted    = /^[A-Z]\.[A-Z]/.test(firstWord);  // e.g. "B.O", "C.L.B"
      if (isDotted) return null;  // never prefix dotted abbrev names
      const prefixedTitle = pe.prefix + " " + firstWord;
      let rest = parts.slice(1).join(" ");
      if (isDTrain || isAbbrev) {
        const last = parts[parts.length - 1];
        if (last?.includes("-")) {
          const clean = last.split("-").slice(1).join("-");
          rest = [...parts.slice(1, -1), clean].filter(Boolean).join(" ");
        }
      }
      const bonus = r.score >= 14 ? 1 : pe.bonusContrast;
      return { ...r, full: (prefixedTitle + " " + rest).trim(), score: r.score + bonus };
    }).filter(Boolean) as Result[];
    return [...raw, ...prefixed].sort((a,b) => b.score - a.score);
  }
  return raw;
}

type Stage = "inputs"|"question"|"reveal"|"exhausted";
type Result = { full: string; nickname: string; reasoning: string; score: number };
type PrefixEntry = { prefix: string; breeds: string[]; bonusContrast: number; };

const TITLE_PREFIXES_GIRL: { prefix: string; bonusContrast: number }[] = [
  { prefix: "Grand",    bonusContrast: 2 },
  { prefix: "Divine",   bonusContrast: 3 },
  { prefix: "Imperial", bonusContrast: 2 }];

const TITLE_PREFIXES: PrefixEntry[] = [
  { prefix: "Super",  breeds: ["retriever","spaniel","sniffer","lapdog","default","gentry","bulldog"], bonusContrast: 2 },
  { prefix: "Uber",   breeds: ["german","boxer","giant"], bonusContrast: 2 },
  { prefix: "Hyper",  breeds: ["collie","terrier","highenergy"], bonusContrast: 3 },
  { prefix: "Mega",   breeds: ["giant","character","dachshund"], bonusContrast: 2 },
  { prefix: "Ultra",  breeds: ["german","sighthound"], bonusContrast: 2 }];

// --- Surname profanity filter ------------------------------------------
// Substrings that are extremely unlikely to appear inside a real surname.
const PROFANITY_SUBSTR = ["fuck","shit","cunt","bitch","bastard","pussy","asshole","arsehole","wanker","bollock","prick","twat","slut","whore","nigger","nigga","faggot","dickhead","cocksuck","motherfuck","jizz","dildo","minge","wank","spastic","retard","rape","nazi","hitler","paedo","pedo","bellend","fuk","phuck"];
// Words that DO appear inside legitimate surnames (Hancock, Cassidy, Dickens...),
// so only block them when the whole surname IS exactly that word.
const PROFANITY_EXACT = ["dick","cock","ass","arse","tit","tits","fag","cum","knob","fanny","piss","crap","damn","hoe","shite","turd","bum","dyke","git"];

// Real names/places that contain a flagged substring -- never block these.
const PROFANITY_ALLOW = ["scunthorpe","clitheroe","penistone","lightwater","cockermouth","shitterton","assington","cockfosters","cockburn"];

function hasProfanity(raw: string): boolean {
  if (!raw) return false;
  const norm = raw.toLowerCase()
    .replace(/[@4]/g, "a").replace(/3/g, "e").replace(/[1!|]/g, "i")
    .replace(/0/g, "o").replace(/[5$]/g, "s").replace(/7/g, "t")
    .replace(/[^a-z]/g, "");
  if (!norm) return false;
  if (PROFANITY_ALLOW.includes(norm)) return false;
  if (PROFANITY_SUBSTR.some(w => norm.includes(w))) return true;
  if (PROFANITY_EXACT.includes(norm)) return true;
  return false;
}

// Capitalise the first letter of each word (so "smith jones" -> "Smith Jones").
function capWords(s: string): string {
  return s.replace(/(^|[\s-])([a-z])/g, (_m, p, c) => p + c.toUpperCase());
}

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
  const [snError, setSnError] = useState(false);
  const [town, setTown] = useState("");
  const [gender, setGender] = useState<"boy"|"girl">("boy");
  const [stage, setStage] = useState<Stage>("inputs");
  const [results, setResults] = useState<Result[]>([]);
  const [seed, setSeed] = useState(0);
  const [colour, setColour] = useState<DogColour>("");
  const [qIndices, setQIndices] = useState<number[]>(() => pickThreeQuestions());
  const [qAnswers, setQAnswers] = useState<Record<number,string>>({});
  const [qOpen, setQOpen] = useState(false);
  const [qStep, setQStep] = useState(0);   // which of the 3 input questions is showing (one at a time)
  const [snOpen, setSnOpen] = useState(false);
  const [unkeptNames, setUnkeptNames] = useState<ShortlistEntry[]>([]);
  const [shortlist, setShortlist] = useState<ShortlistEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(sessionStorage.getItem("pc_shortlist") || "[]"); } catch { return []; }
  });
  const [landingIdx, setLandingIdx] = useState<number | null>(null);
  const [showLikeCount, setShowLikeCount] = useState(false); // briefly show shortlist count in the heart button
  const [toast, setToast] = useState<string | null>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const [toastTop, setToastTop] = useState(134);
  useEffect(() => {
    if (toast && subRef.current) {
      setToastTop(subRef.current.getBoundingClientRect().top);
    }
  }, [toast]);
  // --- Pool size: total potential outcomes, grows as questions are answered ---
  // Baseline with no answers, plus each answered question's words multiply the pool.
  const BASE_OUTCOMES = 250000;
  const PER_WORD = 12000;
  const [bonusWordsCount, setBonusWordsCount] = useState(0);
  const outcomes = BASE_OUTCOMES + bonusWordsCount * PER_WORD;
  const [showKnockout, setShowKnockout] = useState(false);
  // Quick-fire question state for exhausted mode
  const [qfActive, setQfActive] = useState(false);
  const [qfIndex, setQfIndex] = useState(0);   // which question in RANKED_ORDER we're on
  const [qfCount, setQfCount] = useState(0);   // how many answered this session
  const [qfHadSurname, setQfHadSurname] = useState(false); // surname already set when quick-fire began
  const RANKED_QUESTION_ORDER = [0,29,30,5,2,4,23,8,13,14,28,1,9,10,12,26,7,15,17,27,20,11,18,21,22,3,19,24,25,6,16];
  const [swipeDir, setSwipeDir] = useState<string | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const [usedNicknames, setUsedNicknames] = useState<Set<string>>(new Set());
  const [exhausted, setExhausted] = useState(false);
  const [usedFirstNames, setUsedFirstNames] = useState<Set<string>>(new Set());
  const confettiRef = useRef<((opts: Record<string, unknown>) => void) | null>(null);
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js";
    script.onload = () => { confettiRef.current = (window as unknown as Record<string, unknown>)["confetti"] as (opts: Record<string, unknown>) => void; };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, []);

  function handleGenerate(answersOverride?: Record<number, string>) {
    if (!breed) { alert("Please select a breed"); return; }
    // block obscene surnames
    if (hasProfanity(surname)) {
      setSnError(true);
      setSnOpen(true);
      setToast("Let's keep it clean! Please choose a different surname. 🐾");
      setTimeout(() => setToast(null), 5000);
      return;
    }
    // surname is optional
    const s = Math.floor(Math.random() * 10000);
    setSeed(s);
    setResults([]);
    const effectiveAnswers = answersOverride ?? qAnswers;
    const bonus1: string[] = [];
    const bonus2: string[] = [];
    qIndices.forEach((qi: number, pos: number) => {
      const qItem = QUESTION_BANK[qi];
      const chosen = qAnswers[pos];
      if (!chosen || !qItem) return;
      const chosenOpt = qItem.options.find((o: {label:string;bonus:string[]}) => o.label === chosen);
      if (chosenOpt) bonus1.push(...chosenOpt.bonus);
      qItem.options.filter((o: {label:string;bonus:string[]}) => o.label !== chosen)
        .forEach((o: {label:string;bonus:string[]}) => bonus2.push(...o.bonus));
    });
    const et = FUNNY_PLACES.has(town.trim().toLowerCase()) ? town.trim() : "";
    const p1 = runPass(breed,surname.trim(),gender,s,       et,colour,bonus1,bonus2,true, false,usedFirstNames);
    const p2 = runPass(breed,surname.trim(),gender,s+1009,  et,colour,bonus1,bonus2,true, false,usedFirstNames);
    const p3 = runPass(breed,surname.trim(),gender,s+2003,  et,colour,bonus1,bonus2,true, false,usedFirstNames);
    const p4 = runPass(breed,surname.trim(),gender,s+3001,  et,colour,bonus1,bonus2,false,false,usedFirstNames);
    const p5 = runPass(breed,surname.trim(),gender,s+4007,  et,colour,bonus1,bonus2,true, false,usedFirstNames);
    const p6 = runPass(breed,surname.trim(),gender,s+5003,  et,colour,bonus1,bonus2,true, false,usedFirstNames);
    const p7 = runPass(breed,surname.trim(),gender,s+6011,  et,colour,bonus1,bonus2,true, true, usedFirstNames);
    const p8 = runPass(breed,surname.trim(),gender,s+7013,  et,colour,bonus1,bonus2,true, true, usedFirstNames);
    const p9 = runPass(breed,surname.trim(),gender,s+8009,  et,colour,bonus1,bonus2,false,true, usedFirstNames);
    const top = [p1[0],p2[0],p3[0],p4[0],p5[0],p6[0],p7[0],p8[0],p9[0]].filter(Boolean) as Result[];
    const all = [...p1,...p2,...p3,...p4,...p5,...p6,...p7,...p8,...p9].sort((a,b)=>b.score-a.score);
    const allD = dedupeResults([...top,...all].filter(Boolean) as Result[]).sort((a,b)=>b.score-a.score);
    const sc21 = allD.filter(r=>r.score>=17);
    const ranked = rankResults(sc21, breed ? getGroup(breed) : "default");
    const genResult = ranked.length>0 ? ranked.slice(0,1) : rankResults(allD,breed?getGroup(breed):"default").slice(0,1);
    setUsedNicknames(new Set(genResult.map((r: Result) => r.nickname)));
    setResults(genResult);
    setStage("reveal");
    // Jump back to the top so the reveal (not the footer) is in view after Go
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
  }



  function handleRollAgain() {
    // Keep breed, surname, gender and current question answers -- just new seed
    const s = Math.floor(Math.random() * 10000);
    setSeed(s);
    setResults([]);

    const bonus1: string[] = [];
    const bonus2: string[] = [];
    qIndices.forEach((qi: number, pos: number) => {
      const qItem = QUESTION_BANK[qi];
      const chosen = qAnswers[pos];
      if (!chosen || !qItem) return;
      const chosenOpt = qItem.options.find((o: {label:string;bonus:string[]}) => o.label === chosen);
      if (chosenOpt) bonus1.push(...chosenOpt.bonus);
      qItem.options.filter((o: {label:string;bonus:string[]}) => o.label !== chosen)
        .forEach((o: {label:string;bonus:string[]}) => bonus2.push(...o.bonus));
    });

    const et = FUNNY_PLACES.has(town.trim().toLowerCase()) ? town.trim() : "";
    const p1 = runPass(breed,surname.trim(),gender,s,       et,colour,bonus1,bonus2,true, false,usedFirstNames);
    const p2 = runPass(breed,surname.trim(),gender,s+1009,  et,colour,bonus1,bonus2,true, false,usedFirstNames);
    const p3 = runPass(breed,surname.trim(),gender,s+2003,  et,colour,bonus1,bonus2,true, false,usedFirstNames);
    const p4 = runPass(breed,surname.trim(),gender,s+3001,  et,colour,bonus1,bonus2,false,false,usedFirstNames);
    const p5 = runPass(breed,surname.trim(),gender,s+4007,  et,colour,bonus1,bonus2,true, false,usedFirstNames);
    const p6 = runPass(breed,surname.trim(),gender,s+5003,  et,colour,bonus1,bonus2,true, false,usedFirstNames);
    const p7 = runPass(breed,surname.trim(),gender,s+6011,  et,colour,bonus1,bonus2,true, true, usedFirstNames);
    const p8 = runPass(breed,surname.trim(),gender,s+7013,  et,colour,bonus1,bonus2,true, true, usedFirstNames);
    const p9 = runPass(breed,surname.trim(),gender,s+8009,  et,colour,bonus1,bonus2,false,true, usedFirstNames);
    const top = [p1[0],p2[0],p3[0],p4[0],p5[0],p6[0],p7[0],p8[0],p9[0]].filter(Boolean) as Result[];
    const all = [...p1,...p2,...p3,...p4,...p5,...p6,...p7,...p8,...p9].sort((a,b)=>b.score-a.score);
    const allD = dedupeResults([...top,...all].filter(Boolean) as Result[]).sort((a,b)=>b.score-a.score);
    const sc21 = allD.filter(r=>r.score>=17);
    const ranked = rankResults(sc21, breed ? getGroup(breed) : "default");
    const allRanked = ranked.length>0 ? ranked : rankResults(allD,breed?getGroup(breed):"default");
    const fresh = allRanked.filter((r: Result) => !usedNicknames.has(r.nickname));
    if (fresh.length === 0) {
      setStage("exhausted");
      return;
    }
    const rollResult = fresh.slice(0,1);
    const rollFirstName = rollResult[0]?.full?.split(" ").find((w:string) => w.length > 1 && /^[A-Z]/.test(w) && !w.includes(".")) ?? "";
    setUsedNicknames((prev: Set<string>) => new Set([...prev, ...rollResult.map((r: Result) => r.nickname)]));
    setUsedFirstNames((prev:Set<string>) => rollFirstName ? new Set([...prev, rollFirstName]) : prev);
    setResults(rollResult);
    setStage("reveal");
  }

  function saveToShortlist(r: Result) {
    setShortlist((prev: ShortlistEntry[]) => {
      if (prev.length >= 16) return prev;
      const entry: ShortlistEntry = { full: r.full, nickname: r.nickname, score: r.score, breed };
      const next = [...prev, entry];
      try { sessionStorage.setItem("pc_shortlist", JSON.stringify(next)); } catch {}
      // Briefly flash the count in the heart button, then revert to the heart
      setShowLikeCount(true);
      setTimeout(() => setShowLikeCount(false), 1200);
      if (next.length === 16) {
        // Auto-launch knockout at 16
        setTimeout(() => setShowKnockout(true), 800);
      }
      setLandingIdx(next.length - 1);
      setTimeout(() => setLandingIdx(null), 800);
      return next;
    });
  }
  function removeFromShortlist(idx: number) {
    setShortlist((prev: ShortlistEntry[]) => {
      const next = prev.filter((_: ShortlistEntry, i: number) => i !== idx);
      try { sessionStorage.setItem("pc_shortlist", JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function clearShortlist() { setShortlist([]); try { sessionStorage.removeItem("pc_shortlist"); } catch {} }
  function handleLike(e?: React.MouseEvent) {
    if (confettiRef.current) {
      let x = 0.5, y = 0.62;
      if (e && typeof e.clientX === "number") { x = e.clientX / window.innerWidth; y = e.clientY / window.innerHeight; }
      confettiRef.current({ particleCount: 90, spread: 75, origin: { x, y }, colors: ["#22c55e","#ffe227","#ffffff","#60d394"] });
    }
    if (results.length > 0) saveToShortlist(results[0]);
    setSwipeDir("right");
    setTimeout(() => { setSwipeDir(null); handleRollAgain(); }, 350);
  }
  function handleNope() {
    if (results.length > 0) {
      const r = results[0];
      setUnkeptNames(prev => {
        const entry: ShortlistEntry = { full: r.full, nickname: r.nickname, score: r.score, breed };
        const next = [...prev.filter(e => e.full !== r.full), entry].sort((a,b) => b.score - a.score).slice(0, 20);
        return next;
      });
    }
    setSwipeDir("left");
    setTimeout(() => { setSwipeDir(null); handleRollAgain(); }, 350);
  }
  function startQuickFire() {
    // Find first unanswered question in ranked order
    const firstUnanswered = RANKED_QUESTION_ORDER.find(qi => !(qi in qAnswers));
    if (firstUnanswered === undefined) return; // all answered, nothing to show
    setQfIndex(firstUnanswered);
    setQfCount(0);
    setQfHadSurname(surname.trim() !== "");  // snapshot: skip the surname card if already given
    setQfActive(true);
    setExhausted(false);
    setStage("reveal"); // stay on reveal, quickfire overlay will show
  }

  function answerQuickFire(qi: number, label: string) {
    // Record the answer
    setQAnswers((prev: Record<number, string>) => ({ ...prev, [qi]: label }));
    const qItem = QUESTION_BANK[qi];
    const opt = qItem?.options.find((o: {label:string;bonus:string[]}) => o.label === label);
    setBonusWordsCount((c: number) => c + Math.max(opt ? opt.bonus.length : 0, 3));
    const newCount = qfCount + 1;
    setQfCount(newCount);

    // Always advance to next question -- no interstitial choice
    const nextQ = RANKED_QUESTION_ORDER.find((q: number) =>
      RANKED_QUESTION_ORDER.indexOf(q) > RANKED_QUESTION_ORDER.indexOf(qi) && !(q in qAnswers) && q !== qi
    );
    if (nextQ !== undefined) {
      setQfIndex(nextQ);
    } else {
      // No more questions -- fire results immediately
      fireQuickFireResults({ ...qAnswers, [qi]: label });
    }
  }

  // Quick-fire surname step (the 3rd card, unless a surname was already given).
  // Advances the counter WITHOUT consuming a trivia question -- the pending
  // qfIndex question then shows as the next card.
  function submitQuickFireSurname() {
    if (hasProfanity(surname)) { setSnError(true); return; }
    setSnError(false);
    // A surname personalises heavily -- worth a big chunk of the pool.
    if (surname.trim()) setBonusWordsCount((c: number) => c + 12);
    setQfCount(qfCount + 1);
  }

  function continueQuickFire() {
    const nextQ = RANKED_QUESTION_ORDER.find(q => !(q in qAnswers));
    if (nextQ !== undefined) {
      setQfIndex(nextQ);
    } else {
      fireQuickFireResults(qAnswers);
    }
  }

  function fireQuickFireResults(answers: Record<number, string>) {
    setQfActive(false);
    // Re-run generator with updated answers
    const s = Math.floor(Math.random() * 10000);
    setSeed(s);
    setResults([]);
    setExhausted(false);
    // Trigger generation with new qAnswers already set
    setTimeout(() => handleGenerate(answers), 50);
  }

    function handleStartOver() {
    if (shortlist.length > 0) { if (!window.confirm("Start over? Your liked names stay in your shortlist.")) return; }
    setStage("inputs"); setResults([]); setQAnswers({}); setUsedNicknames(new Set()); setUsedFirstNames(new Set()); setExhausted(false); setQStep(0); setBonusWordsCount(0);
  }
  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }
  function onTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) { if (dx > 0) handleLike(); else handleNope(); }
  }

    const cardImg = breed ? CARD_IMAGE[breed] ?? null : null;

  return (
    <>
      {showKnockout ? (
        <div style={{ padding:"clamp(60px,10vw,120px) clamp(16px,5vw,48px) 0" }}>
          <div style={{ maxWidth:1800, margin:"0 auto" }}>
            <KnockoutRound
              shortlist={shortlist}
              recommended={unkeptNames}
              breed={breed}
              onBack={() => setShowKnockout(false)}
              onRestart={() => {
                setShowKnockout(false);
                setShortlist([]);
                setStage("inputs");
                setResults([]);
                setQAnswers({});
                setUsedNicknames(new Set());
                setUsedFirstNames(new Set());
                setExhausted(false);
                try { sessionStorage.removeItem("pc_shortlist"); } catch {}
              }}
            />
          </div>
        </div>
      ) : (<>
      <Nav />
      <main style={{ padding:"clamp(60px,10vw,120px) clamp(16px,5vw,48px) 10px" }}>
        <style>{`
          .pcm-h1br { display: none; }
          @keyframes pcAnswerIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pcJiggle { 0%,100% { transform: rotate(calc(-1 * var(--jiggle, 0deg))); } 50% { transform: rotate(var(--jiggle, 0deg)); } }
          @media (max-width: 768px) {
            .pcm-panel { max-width: 100% !important; }
            .pcm-qgrid { grid-template-columns: 1fr !important; }
            .pcm-reveal-card { padding-right: clamp(20px,5vw,40px) !important; }
            .pcm-breed-img { display: none !important; }
            .pcm-action { width: 76px !important; height: 76px !important; font-size: 2rem !important; }
            .pcm-calc-banner { padding-left: clamp(20px,4vw,32px) !important; flex-direction: column !important; text-align: center !important; }
            .pcm-calc-img { display: none !important; }
            .pcm-h1br { display: inline !important; }
            .pcm-h1 { font-size: clamp(3.5rem, 12vw, 5.4rem) !important; }
            .pcm-nick { font-size: clamp(2.98rem, 11vw, 3.6rem) !important; margin-top: 10px !important; }
            .pcm-sub { margin-bottom: 20px !important; }
            .pcm-breed-label { display: none !important; }
            .pcm-gender-label { display: none !important; }
            .pcm-breed-select {
              -webkit-appearance: none !important;
              -moz-appearance: none !important;
              appearance: none !important;
              text-align: center !important;
              text-align-last: center !important;
              font-size: 1.15rem !important;
              padding-right: 44px !important;
              background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>") !important;
              background-repeat: no-repeat !important;
              background-position: right 15px center !important;
            }
            .pcm-breed-select option { font-size: 1.05rem; text-align: center; }
            .pcm-boy-btn { background: #1e90ff !important; color: #ffffff !important; }
            .pcm-girl-btn { background: #ff4fa3 !important; color: #ffffff !important; }
          }
        `}</style>
        <div style={{ maxWidth:1800, margin:"0 auto" }}>
          <h1 className="display pcm-h1" style={{ textAlign:"center", marginBottom:16, fontSize:"clamp(3rem,10vw,6.5rem)", color:"#ffffff", lineHeight:0.95 }}>
            Chum <br className="pcm-h1br" /><span className="display-yellow">Name</span> Generator
          </h1>
          <p ref={subRef} className="pcm-sub" style={{ textAlign:"center", color:"#ffffff", fontFamily:"var(--font-body)", fontSize:"clamp(1rem,2.5vw,1.3rem)", fontWeight:600, marginBottom:48 }}>
            {shortlist.length >= 4 && stage !== "inputs"
              ? `You have ${shortlist.length} names! Tap 🏆 Knockout button to decide`
              : "Give your chum the truly 1 in a million personalised to you name"}
          </p>

          {/* ── STAGE 1: INPUTS ── */}
          {fromCalculator && breed && stage === "inputs" && (() => {
            const img = CARD_IMAGE[breed] ?? null;
            return (
              <div className="pcm-calc-banner" style={{
                position:"relative",
                display:"flex", alignItems:"center", gap:16, marginBottom:24,
                background:"linear-gradient(to top right, #00e2ff, #008eff)",
                borderRadius:24,
                padding:"clamp(20px,4vw,32px)",
                paddingLeft: img ? "clamp(160px,38vw,250px)" : "clamp(20px,4vw,32px)",
                boxShadow:"0 18px 40px rgba(10,58,87,0.28)",
                overflow:"visible",
                animation:"fadeInDown 0.4s ease",
                minHeight:"clamp(100px,18vw,140px)"
              }}>
                {img && (
                  <img src={img} alt={breed} className="pcm-calc-img" style={{
                    position:"absolute",
                    left:-12, top:"50%",
                    transform:"translateY(-50%) rotate(-2deg)",
                    width:"clamp(180px,42vw,320px)", height:"auto", borderRadius:14,
                    boxShadow:"0 8px 24px rgba(10,58,87,0.28)",
                    zIndex:2
                  }} />
                )}
                <div>
                  <div style={{ fontFamily:"var(--font-display)", color:"var(--yellow)", fontSize:"clamp(1.8rem,5vw,2.4rem)", lineHeight:1.1 }}>
                    Let’s get a great name for your favourite chum
                  </div>
                  <div style={{ fontFamily:"var(--font-body)", color:"#ffffff", fontSize:"1rem", marginTop:6 }}>
                    Now let&apos;s give {breed} a name.
                  </div>
                </div>
              </div>
            );
          })()}
          {stage === "inputs" && (() => {
            return (
            <div className="pcm-panel" style={{ background:"var(--navy)", borderRadius:20, padding:"clamp(20px,4vw,36px)", maxWidth:"60%", margin:"0 auto", width:"100%" }}>
              {!fromCalculator && (<>
                <label className="pcm-breed-label" style={{ display:"block", color:"var(--yellow)", fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, fontFamily:"var(--font-body)" }}>Your dog&apos;s breed</label>
                <select className="pcm-breed-select" value={breed} onChange={(e: { target: HTMLSelectElement }) => { setBreed(e.target.value); setStage("inputs"); setResults([]); setQAnswers({}); setUsedNicknames(new Set()); setUsedFirstNames(new Set()); setExhausted(false); setShortlist([]); setUnkeptNames([]); try { sessionStorage.removeItem("pc_shortlist"); } catch {} setQIndices(pickThreeQuestions()); setQAnswers({}); setQStep(0); setBonusWordsCount(0); }}
                  style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:breed?"#fff":"rgba(255,255,255,0.4)", fontFamily:"var(--font-body)", fontSize:"0.95rem", marginBottom:20, outline:"none", boxSizing:"border-box" }}>
                  <option value="">-- Select a breed --</option>
                  {PACK_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </>)}
              <label className="pcm-gender-label" style={{ display:"block", color:"var(--yellow)", fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10, fontFamily:"var(--font-body)" }}>Boy or girl?</label>
              <div style={{ display:"flex", gap:10, marginBottom:28 }}>
                {(["boy","girl"] as const).map(g => (
                  <button key={g} className={g==="boy" ? "pcm-boy-btn" : "pcm-girl-btn"} onClick={() => { setGender(g); setStage("inputs"); setResults([]); setQAnswers({}); setUsedNicknames(new Set()); setUsedFirstNames(new Set()); setExhausted(false); setShortlist([]); setUnkeptNames([]); try { sessionStorage.removeItem("pc_shortlist"); } catch {}; }}
                    style={{ flex:1, padding:12, borderRadius:12, border:`1.5px solid ${gender===g?"#ffffff":"rgba(255,255,255,0.15)"}`, background:gender===g?"var(--yellow)":"rgba(255,255,255,0.08)", color:gender===g?"var(--navy)":"#fff", fontFamily:"var(--font-body)", fontSize:"0.9rem", fontWeight:700, cursor:"pointer", textTransform:"capitalize" }}>
                    {g === "boy" ? "Boy" : "Girl"}
                  </button>
                ))}
              </div>
<div style={{ borderTop:"1px solid rgba(255,255,255,0.12)", paddingTop:18, marginBottom: snOpen ? 0 : 22 }}>
                <button
                  onClick={() => setSnOpen((o: boolean) => !o)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:0, marginBottom: snOpen ? 16 : 0 }}>
                  <span style={{ flex:1, textAlign:"center", color:"#ffffff", fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"var(--font-body)" }}>
                    Personalise surname
                    {surname.trim().length > 0 && (
                      <span style={{ marginLeft:8, background:"var(--yellow)", color:"var(--navy)", borderRadius:999, padding:"1px 7px", fontSize:"0.6rem" }}>
                        {surname.trim()}
                      </span>
                    )}
                  </span>
                  <span style={{ color:"var(--yellow)", fontSize:"1rem", lineHeight:1, transform: snOpen ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.2s", display:"inline-block" }}>
                    ▼
                  </span>
                </button>
                {snOpen && (
                  <>
                  <input type="text" value={surname} onChange={(e: { target: HTMLInputElement }) => { const v = capWords(e.target.value); setSurname(v); setSnError(hasProfanity(v)); }}
                    placeholder="e.g. Jones, Clarke, Thompson..." maxLength={60}
                    onKeyDown={(e: { key: string }) => e.key === "Enter" && handleGenerate()}
                    style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${snError?"#ef4444":"rgba(255,255,255,0.15)"}`, background:"rgba(255,255,255,0.08)", color:"#fff", fontFamily:"var(--font-body)", fontSize:"0.95rem", marginBottom: snError ? 8 : 20, outline:"none", boxSizing:"border-box" }} />
                  {snError && (
                    <p style={{ color:"#ff8f8f", fontFamily:"var(--font-body)", fontSize:"0.72rem", fontWeight:700, margin:"0 0 16px", textAlign:"center" }}>
                      Let&apos;s keep it clean! Please choose a different surname. 🐾
                    </p>
                  )}
                  </>
                )}
              </div>
                            <div style={{ borderTop:"1px solid rgba(255,255,255,0.12)", paddingTop:18, marginBottom:22 }}>
                {/* Collapsible header */}
                <button
                  onClick={() => setQOpen((o: boolean) => !o)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:0, marginBottom: qOpen ? 16 : 0 }}>
                  <span style={{ flex:1, textAlign:"center", color:"#ffffff", fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"var(--font-body)" }}>
                    answer some stupid questions
                    {Object.keys(qAnswers).length > 0 && (
                      <span style={{ marginLeft:8, background:"var(--yellow)", color:"var(--navy)", borderRadius:999, padding:"1px 7px", fontSize:"0.6rem" }}>
                        {Object.keys(qAnswers).length}/3
                      </span>
                    )}
                  </span>
                  <span style={{ color:"var(--yellow)", fontSize:"1rem", lineHeight:1, transform: qOpen ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.2s", display:"inline-block" }}>
                    ▼
                  </span>
                </button>
                {/* Questions -- one at a time to save vertical space */}
                {qOpen && (() => {
                  const total = qIndices.length;
                  const step = Math.min(qStep, total - 1);
                  const qi = qIndices[step];
                  const qItem = QUESTION_BANK[qi];
                  if (!qItem) return null;
                  const chosen = qAnswers[step];
                  return (
                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      <div key={qi} style={{ background:"rgba(255,255,255,0.05)", borderRadius:12, padding:"16px 12px", border:`1.5px solid ${chosen?"var(--yellow)":"rgba(255,255,255,0.12)"}`, display:"flex", flexDirection:"column", gap:12 }}>
                        <p style={{ color:"#fff", fontFamily:"var(--font-body)", fontSize:"1rem", fontWeight:700, lineHeight:1.3, margin:0, textAlign:"center" }}>
                          {qItem.text}
                        </p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
                          {qItem.options.map((opt: {label:string;bonus:string[]}, optIdx: number) => (
                            <button key={opt.label}
                              onClick={() => {
                                setQAnswers((prev: Record<number,string>) => ({...prev, [step]: opt.label}));
                                if (qAnswers[step] === undefined) setBonusWordsCount((c: number) => c + Math.max(opt.bonus.length, 3));
                                if (step < total - 1) setTimeout(() => setQStep((s: number) => Math.min(s + 1, total - 1)), 280);
                                else setTimeout(() => handleGenerate(), 340);   // 3rd answered -> straight to results
                              }}
                              style={{ padding:"10px 16px", borderRadius:999, border:`1.5px solid ${chosen===opt.label?"var(--yellow)":"rgba(255,255,255,0.18)"}`, background:chosen===opt.label?"var(--yellow)":"rgba(255,255,255,0.05)", color:chosen===opt.label?"var(--navy)":"rgba(255,255,255,0.85)", fontFamily:"var(--font-body)", fontSize:"0.78rem", fontWeight:700, cursor:"pointer", textAlign:"center", lineHeight:1.2, transition:"background 0.15s, border-color 0.15s, color 0.15s", animation:"pcAnswerIn 0.35s ease both", animationDelay:`${optIdx*0.08}s` }}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {chosen && <p style={{ color:"var(--yellow)", fontSize:"0.62rem", fontWeight:700, margin:0, fontFamily:"var(--font-body)", textAlign:"center" }}>✓ {chosen}</p>}
                      </div>
                      {/* live pool size -- grows as questions are answered */}
                      <p style={{ color:"var(--yellow)", fontFamily:"var(--font-body)", fontSize:"0.8rem", fontWeight:700, textAlign:"center", margin:0 }}>
                        ✨ {outcomes.toLocaleString()} possible names in your pool
                      </p>
                    </div>
                  );
                })()}
              </div>
              <button onClick={() => handleGenerate()} className="display"
                style={{ width:"100%", padding:"26px 16px", borderRadius:14, border:"none", background: breed ? "#22c55e" : "var(--yellow)", color:"var(--navy)", fontSize:"1.9rem", cursor:"pointer", boxShadow:"0 4px 0 rgba(10,58,87,0.4)", letterSpacing:"0.04em" }}>
                Go
              </button>
            </div>
            );
          })()}


          {/* ── STAGE 3: REVEAL ── */}
                    {qfActive && (() => {
            const qfQ = QUESTION_BANK[qfIndex];
            // The 3rd quick-fire card is always the surname prompt -- unless a
            // surname was already entered, in which case we don't ask twice.
            const showSurnameStep = qfCount === 2 && !qfHadSurname;
            return qfQ ? (
              <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,30,60,0.85)",display:"flex",alignItems:"center",justifyContent:"center",padding:"clamp(16px,4vw,40px)"}}>
                <div style={{position:"relative",background:"linear-gradient(to top right,#00e2ff,#008eff)",borderRadius:32,padding:"clamp(24px,5vw,48px)",maxWidth:560,width:"100%",textAlign:"center"}}>
                  {qfCount >= 5 && (
                    <button onClick={() => fireQuickFireResults(qAnswers)} aria-label="Done -- show my names"
                      style={{position:"absolute",top:14,right:14,width:40,height:40,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.6)",background:"rgba(255,255,255,0.15)",color:"#fff",fontSize:"1.4rem",fontWeight:900,lineHeight:1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      ×
                    </button>
                  )}
                  <p style={{fontFamily:"var(--font-body)",fontSize:"0.9rem",fontWeight:700,color:"#fff",marginBottom:14}}>
                    Answer some more questions to unlock more names
                  </p>
                  <p style={{fontFamily:"var(--font-body)",fontSize:"0.75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#ffffff",marginBottom:12}}>
                    Stupid question {qfCount + 1}
                  </p>
                  {qfCount >= 5 && (
                    <p style={{fontFamily:"var(--font-body)",fontSize:"0.72rem",fontWeight:600,color:"rgba(255,255,255,0.85)",marginBottom:12}}>
                      Tap the ✕ any time to see your names now.
                    </p>
                  )}
                  {showSurnameStep ? (
                    <>
                      <p className="display" style={{fontSize:"clamp(1.4rem,4vw,2rem)",color:"#fff",marginBottom:20,lineHeight:1.2}}>
                        Add your name to personalise the results
                      </p>
                      <input type="text" value={surname} autoFocus
                        onChange={(e: { target: HTMLInputElement }) => { const v = capWords(e.target.value); setSurname(v); setSnError(hasProfanity(v)); }}
                        onKeyDown={(e: { key: string }) => e.key === "Enter" && submitQuickFireSurname()}
                        placeholder="e.g. Jones..." maxLength={60}
                        style={{width:"100%",padding:"14px 20px",borderRadius:999,border:`2px solid ${snError?"#ef4444":"rgba(255,255,255,0.4)"}`,background:"rgba(255,255,255,0.12)",color:"#fff",fontFamily:"var(--font-body)",fontSize:"1.05rem",fontWeight:700,textAlign:"center",outline:"none",boxSizing:"border-box",marginBottom:12}} />
                      {snError && (
                        <p style={{fontFamily:"var(--font-body)",fontSize:"0.8rem",fontWeight:700,color:"#ffe0e0",marginBottom:12}}>Let&apos;s keep it clean! 🐾</p>
                      )}
                      <button onClick={() => submitQuickFireSurname()}
                        style={{width:"100%",padding:"14px 24px",borderRadius:999,border:"none",background:"var(--yellow)",color:"var(--navy)",fontFamily:"var(--font-display,'Luckiest Guy',cursive)",fontSize:"1.1rem",letterSpacing:"0.04em",cursor:"pointer"}}>
                        {surname.trim() ? "Add name →" : "Skip →"}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="display" style={{fontSize:"clamp(1.4rem,4vw,2rem)",color:"#fff",marginBottom:28,lineHeight:1.2}}>
                        {qfQ.text}
                      </p>
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {qfQ.options.map((opt:{label:string;bonus:string[]}) => (
                          <button key={opt.label} onClick={() => answerQuickFire(qfIndex, opt.label)}
                            style={{padding:"14px 24px",borderRadius:999,border:"2px solid rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.1)",color:"#fff",fontFamily:"var(--font-body)",fontSize:"1rem",fontWeight:700,cursor:"pointer",transition:"background 0.15s"}}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : null;
          })()}
                    {stage === "reveal" && results.length > 0 && (
            <>
              {results.slice(0,1).map((r: Result) => (
                <div className="pcm-panel" style={{ maxWidth:"60%", margin:"0 auto", width:"100%" }}>
                <div key={r.full} className="pcm-reveal-card" style={{
                  position:"relative",
                  background:"linear-gradient(to top right, #00e2ff, #008eff)",
                  borderRadius:40,
                  padding:"clamp(24px,4vw,40px)",
                  paddingRight: cardImg ? "clamp(190px,45vw,340px)" : "clamp(24px,4vw,40px)",
                  boxShadow:"0 18px 40px rgba(10,58,87,0.28)",
                  overflow:"visible",
                  marginBottom:20
                }}>
                  {/* Breed card */}
                  {cardImg && (
                    <div className="pcm-breed-img" style={{ position:"absolute", right:-12, top:-10, zIndex:2, transform:"rotate(2deg)", transformOrigin:"bottom right", filter:"drop-shadow(0 8px 24px rgba(10,58,87,0.28))" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cardImg} alt={breed} style={{ width:"clamp(180px,42vw,320px)", height:"auto", borderRadius:14, display:"block" }} />
                    </div>
                  )}

                  {/* Score badge */}
                  <div style={{ marginBottom:16 }}>
                    
                  </div>
                  {/* NICKNAME -- the hero name, big */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, marginBottom:4 }}>
                  <button onClick={handleNope} className="pcm-action" style={{ width:112, height:112, borderRadius:"50%", border:"none", background:"#ef4444", color:"#fff", fontSize:"3rem", cursor:"pointer", boxShadow:"0 4px 12px rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
                  {shortlist.length >= 3 ? (
                    (() => {
                      const n = shortlist.length;
                      const t = Math.min(Math.max(n, 8), 16);
                      const jiggle = n >= 8;
                      const angle = (2 + (t - 8) * 0.34).toFixed(2);   // 8 -> 2deg, 14 -> ~4deg
                      const dur = Math.max(0.34, 0.7 - (t - 8) * 0.06).toFixed(2); // 8 -> 0.7s, 14 -> ~0.34s
                      const koStyle: React.CSSProperties = { background:"var(--yellow)", border:"2px solid var(--yellow)", color:"var(--navy)", fontFamily:"var(--font-display,'Luckiest Guy',cursive)", fontSize:"0.9rem", letterSpacing:"0.05em", cursor:"pointer", borderRadius:999, padding:"23px 22px 18px", transformOrigin:"center", animation: jiggle ? `pcJiggle ${dur}s ease-in-out infinite` : undefined };
                      (koStyle as Record<string, string>)["--jiggle"] = `${angle}deg`;
                      return <button onClick={() => { setShowKnockout(true); try { window.scrollTo(0,0); } catch {} }} style={koStyle}>🏆 Knockout</button>;
                    })()
                  ) : (
                    <button onClick={handleStartOver} style={{ background:"transparent", border:"2px solid var(--navy)", color:"var(--navy)", fontFamily:"var(--font-display,'Luckiest Guy',cursive)", fontSize:"0.85rem", letterSpacing:"0.05em", cursor:"pointer", borderRadius:999, padding:"8px 20px" }}>Start over</button>
                  )}
                  <button onClick={(e) => handleLike(e)} className="pcm-action" style={{ width:112, height:112, borderRadius:"50%", border:"none", background:"#22c55e", color:"#fff", fontSize:"3rem", fontFamily: showLikeCount ? "var(--font-display,'Luckiest Guy',cursive)" : undefined, cursor:"pointer", boxShadow:"0 4px 12px rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{showLikeCount ? shortlist.length : "♥"}</button>
                </div>
                  {r.nickname ? (
                    <>
                      <div className="pcm-nick" style={{ fontFamily:"var(--font-display)", fontSize:"clamp(2rem,8vw,3.2rem)", color:"#fff", lineHeight:1, letterSpacing:"0.01em", textAlign:"center", textShadow:"0 2px 12px rgba(10,58,87,0.3)", marginBottom:10 }}>
                        {r.nickname}
                      </div>
                      {/* Full name -- smaller, below */}
                      <div style={{ fontSize:"clamp(0.85rem,2.5vw,1.05rem)", color:"var(--navy)", fontFamily:"var(--font-body)", fontWeight:700, textAlign:"center", marginBottom:16, letterSpacing:"0.01em" }}>
                        {r.full}
                      </div>
                    </>
                  ) : (
                    /* No nickname -- just show full name as hero */
                    <div style={{ fontFamily:"var(--font-display)", fontSize:"clamp(1.5rem,5vw,2.4rem)", color:"#fff", lineHeight:1.1, letterSpacing:"0.01em", textAlign:"center", textShadow:"0 2px 12px rgba(10,58,87,0.3)", marginBottom:16 }}>
                      {r.full}
                    </div>
                  )}
                  {/* Reasoning */}
                  <div style={{ fontSize:"0.8rem", color:"var(--navy)", lineHeight:1.3, borderTop:"1px solid rgba(10,58,87,0.2)", paddingTop:14, fontFamily:"var(--font-body)", textAlign:"center", fontWeight:600 }}>{r.reasoning}</div>
                </div>
                </div>
              ))}

              <div className="pcm-panel" style={{ maxWidth:"60%", margin:"14px auto 0", width:"100%" }}>
                <button onClick={() => startQuickFire()}
                  style={{ display:"block", width:"100%", background:"none", border:"none", borderRadius:0, padding:"6px 16px", fontFamily:"var(--font-body)", fontSize:"0.82rem", fontWeight:700, color:"var(--navy)", textAlign:"center", cursor:"pointer" }}>
                  ✨ {outcomes.toLocaleString()} possible names in your pool
                </button>
              </div>

              <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ position:"relative" }}>

              </div>
            </>
          )}

          {/* ── EXHAUSTED STAGE ── */}
          {stage === "exhausted" && !qfActive && (() => {
            // Auto-launch quickfire immediately -- no interstitial screen
            startQuickFire();
            return null;
          })()}
        </div>
      </main>
      </>
      )}
      {toast && (<div style={{ position:"fixed", top:toastTop, left:"50%", transform:"translateX(-50%)", background:"var(--navy)", color:"#fff", padding:"12px 20px", borderRadius:14, border:"2px solid var(--yellow)", fontFamily:"var(--font-body)", fontSize:"0.82rem", fontWeight:600, zIndex:200, minWidth:"80vw", maxWidth:"90vw", boxSizing:"border-box", textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,0.4)", animation:"toastIn 0.3s ease" }}>{toast}</div>)}
      <div style={{ position:"sticky", bottom:0, zIndex:90 }}>
        {!showKnockout && <ShortlistBar shortlist={shortlist} onRemove={removeFromShortlist} onClear={clearShortlist} onKnockout={() => { setShowKnockout(true); try { window.scrollTo(0,0); } catch {} }} landingIdx={landingIdx} />}
        <Footer />
      </div>
    </>
  );
}
