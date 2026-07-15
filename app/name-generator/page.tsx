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

// ── NAME BANKS (from your Numbers file) ───────────────────────────────────────

const NAMES: Record<string, { boy: string[]; girl: string[] }> = {
  lapdog: {
    boy: ["Marvellous","Glorious","Magnificent","Splendid","Resplendent","Imperious","Sumptuous","Opulent","Grandiose","Illustrious","Majestic","Fortunatus","Benedictus","Casimir","Florentine","Celestin","Anselme","Prosper","Alcide","Onésime","Séraphin","Théodule","Nazerene","Alexander","Daniel","Gérard","Rhaeven","Peter","Vincent","Henry","Richard","David","Andrew","Joseph","Gregory","Paul","Leonidas","John","Nicholas","Stanislao","Jacob","Anthony","Michael","Francis","Nathaniel","Theodore","Edward","Gustave","Christopher","Thomas","George","Edmund","Patrick","Julius","Christian","Matthew","Colin","Charles","Gabriel","Oliver","Maximillian","Levie","William","Sebastian","Robert","Simon","Villem","Bernard","Prosper","Samuel","Frederick","Gianmarco","Neal"],
    girl: ["Fabulous","Darling","Precious","Divine","Dazzling","Glorious","Celestial","Heaven","Luminous","Exquisite","Resplendent","Ruby","Diamond","Pearl","Sapphire","Crystal","Opal","Mercedes","Porsche","Chanel","Sequin","Opulent","Magnificent","Gorgeous","Sublime","Transcendence","Adriel","Aerin","Allegra","Amaryllis","Amity","Andromeda","Aoife","Apollonia","Arden","Ariadne","Artemis","Aster","Astraea","Astrid","Aurelia","Aurora","Aveline","Azalea","Briar","Bronwen","Cadence","Calanth","Calliope","Callista","Cassiopeia","Caterina","Celeste","Celestine","Ciela","Circe","Corinna","Cosima","Cressida","Cyra","Dahlia","Danae","Daphne","Delilah","Delphine","Diana","Eira","Ellis","Elodie","Elora","Elowen","Elspeth","Elvira","Emrys","Eulalia","Euphemia","Evadne","Evangeline","Fauna","Faye","Flora","Freya","Gaia","Guinevere","Gwendolyn","Harbor","Harmony","Indigo","Io","Irina","Iris","Isadora","Iselda","Isla","Isolde","Juniper","Laurel","Lavinia","Leda","Lenore","Lilia","Lorelei","Lucia","Luna","Lyra","Maeve","Magnolia","Marceline","Marcella","Melisandre","Melody","Moira","Niamh","Nimue","Oceana","Octavia","Odessa","Odette","Olympia","Ophelia","Orion","Orla","Pandora","Phaedra","Philomena","Polaris","Romina","Rosalia","Rosalind","Rosella","Rowena","Saffron","Saira","Seraphine","Sophronia","Sylvie","Tabitha","Terra","Theodosia","Thomasin","Thora","Ursula","Venus","Violette","Wilhelmina","Wisteria","Yara","Zilpha","Zinnia","Juliet","Isabella","Annabelle","Rosaria","Charlotte","Olivia","Victoria","Naomi","Rebecca","Elizabeth","Jane","Sabrina","Gabrielle","Theodosia","Lotus","Aster","Jonquil","Cosmos","Sorrel"],
  },
  boxer: {
    boy: ["Doofus","Galumph","Lummox","Bonkers","Dingbat","Blunders","Rumpus","Discombobulate","Kerfuffle","Balderdash","Hullabaloo","Codswallop","Nincompoop","Flibbert","Goofball","Chuckles","Booger","Tater Tot","Bubs","Funkbutt","Sparky","Poppyseed","Doublebubble","Lover Boy","Nutmeg","Toots","Bozo","Puddles","Pickles","Shmoopy","Noodles","Wiggle","Chipmunk","Kazoo","Doodle","Winky","Chumbawumba","Zippadeedooda","Butthead","Joker","Pancake","Blinky","Tibor","Zebedee","Bartholomew","Bart","Chaos","Havoc","Ruckus","Shambles","Tumble"],
    girl: ["Dizzy","Topsy","Bonkers","Wibble","Doolally","Piggledy","Turvy","Ramshackle","Teacup","Booboo","Tutu","Heels","Twinkles","Cornflake","Wee-mama","Sasspanties"],
  },
  sighthound: {
    boy: ["Miles","Julian","Lawrence","Nathaniel","Nonchalance","Richard","Quentin","Indifference","Sebastian","Lassitude","Vincent","Alexander","Apathy","Sangfroid","Equanimity","Caleb","Chester","Demetrius","Elias","Leopold","Samuel","Edgar"],
    girl: ["Ennui","Langueur","Nonchalance","Aloofia","Indifferencia","Reservée","Glaciale","Lointaine","Sèche","Austère","Altière","Superbe","Seren","Parker","Elaina","Eurus","Addison","Annais","Emerson","Sava","Ariadne","Saige","Hailey","Elisabeth","Paola","Bailey","Orinthia","Bowie","Annika","Meredyth","Laser","Quin","Bronwyn","Angelica","Eunice","Edith","Taite","Imogen","Elyana","Elrin","Finley","Ezri","Joy","Peyton","Alora","Phoebe","Brook","Melia","Alethea","Temo","Aura","Isla","Zephyr","Callista","Eden","Annette","Samantha","Bethany","Tara","Amanda","Ashley","Megan","Hannah","Brittany","Dora","Tiffany","Corrine","Melissa","Nicole","Keri-Lynn","Rachel","Carla","Jessica","Stephanie","Betty","Amy","Emily","Jennifer","Michelle","Esther","Tamara","Jemima","Amber","Natalie","Jenny","Mary","Danielle","Sarah","Lucy","Lisa","Norma","Anna","Ruth","Kayla","Kimberly","Harper","Lydia","Gwen","Jasmine","Heather","Sorrel","Lotus","Aster","Jonquil","Cosmos"],
  },
  sniffer: {
    boy: ["Plods","Plodsworth","Glumley","Mourny","Trudgewick","Sorrowby","Woebegone","Lachrymose","Dolorous","Melancholy","Lugubrious","Disconsolate","Desolate","Gloopington","John","Brian","Raymond","Malakai","Ian","Alan","George","Arthur","David","Neil","Douglas","Kenneth","Dennis","Robert","Keith","Brigham","Warwick","Andrew","Stephen","Edward","Derek","Charles","Kevin","Martin","Trevor","Peter","Farrell","William","Richard","Miles","Clive","Duncan","Phillip","Graham","Johnny","Joshua","Simon","Gordon","Geoffrey","Ernest","Colin","Barry","Donald","Christopher","Ronald","Norman","Jacek","Kunal","Jared","Ren","Ward","Florent","Oliver","Florian","Zephyr","Basil","Clem"],
    girl: ["Gloomsbury","Woesworth","Mournington","Doleful","Plaintive","Lamentia","Wistfulina","Sorrowful","Droopington","Sadlington","Lacrimosa","Lamentabilis","Lugubria","Tristesse","Melancolie","Despondina","Grievance","Desolata","Morosina","Miseria"],
  },
  giant: {
    boy: ["Teacup","Dainty","Nimble","Tinykins","Tinch","Teeny","Delicate","Petite","Gossamer","Smidgeon","Titchy","Dinky","Lilliput","Miniscule","Infinitesimal","Imperceptible","Diminutive","Microscopic","Pocket","Otto","Otis","Remy","Saul","Silas","HeavyD"],
    girl: ["Titchy","WeeDee","Petite","Dinky","Lilliput","Minikin","Daintybell","Thistledown","Gossamera","Featherina","Pixie","Elfin","Pixy","Twiggy","Mote","Speck","Iota","Smidge","Milly","Molly"],
  },
  terrier: {
    boy: ["Chaos","Havoc","Mayhem","Bedlam","Ruckus","Pandemonium","Anarchy","Turmoil","Brouhaha","Kerfuffle","Uproar","Tumult","Fracas","Commotion","Hubbub","Furore","Hullabaloo","Disturbance","Clamour","Cacophony","Rampage","Maelstrom","Imbroglio","Melee"],
    girl: ["Frenzina","Rampeena","Commotica","Furory","Clamoureena","Pandemonia","Anarchia","Mischief","Turbulence","Whirlwind","Tempest","Gale","Gail","Gayle","Tempesta","Tempestt","Tempist"],
  },
  retriever: {
    boy: ["Biscuit","Pudding","Custard","Gravy","Crumble","Dumpling","Wobble","Jelly","Sausage","Cobbler","Treacle","Dripping","Suet","Spotted Dick","Blancmange","Junket","Syllabub","Flummery","Douglas","Barnaby","Clifford","Edmund","Roderick","Herbert","Aubrey","Bertram","Clarence","Frederick","Gideon","Harold","Lionel","Norman","Stanley","Reginald","Humphrey","Archibald","Montague","Algernon","William","Oliver","Clem","Florian","Basil"],
    girl: ["Treacle","Trifle","Scone","Muffin","Pudding","Doughnut","Eclair","Profiterole","Crumpet","Waffle","Biscuit","Shortbread","Flapjack","Brownie","Sundae","Pavlova","Meringue","Syllabub","Blancmange","Charlotte","Margaret","Dorothy","Patricia","Winifred","Edith","Muriel","Florence","Beatrice","Augusta","Helena","Gertrude","Mildred","Constance","Millicent","Prudence","Euphemia","Hortense"],
  },
  collie: {
    boy: ["Frenetic","Hypervigilant","Relentless","Indefatigable","Obsessive","Perpetual","Ceaseless","Unremitting","Assiduous","Pertinacious","Tenacious","Inexorable","Implacable","Unstoppable","Incessant","Tireless","Unflagging","Unwavering","Resolute","Duncan","Angus","Hamish","Fraser","Ewan","Callum","Rory","Fergus","Malcolm","Alastair"],
    girl: ["Frenzied","Hyperactive","Incessant","Ceaseless","Tireless","Restless","Vigilant","Anxious","Compulsive","Driven","Manic","Feverish","Frantic","Agitated","Overwrought","High-strung","Hyperkinetic","Relentless","Fiona","Catriona","Morag","Isla","Kirsty","Ailsa","Rhona","Shona","Flora","Heather"],
  },
  poodle: {
    boy: ["Existentiale","Absurdisme","Nihilisme","Structurelle","Phenomene","Paradoxe","Dialectique","Epistemique","Ontologie","Hermeneutique","Axiomatique","Tautologie","Syllogisme","Aphorisme","Pierre","Jacques","François","Henri","Marcel","Gaston","Fernand","Théodore","Galileo","Einstein","Socrates","Aristotle","Darwin","Newton","Freud","Virgil","Cicero"],
    girl: ["Dialectique","Epistemique","Ontologie","Semantique","Axiomatique","Hermeneutique","Phenomenologie","Teleologie","Eschatologie","Deontologie","Metaphysique","Colette","Marguerite","Simone","Yvette","Brigitte","Monique","Claudette","Giselle","Hypatia","Cornelia"],
  },
  dachshund: {
    boy: ["Elongated","Stretched","Horizontal","Lengthwise","Extended","Protracted","Oblong","Attenuated","Longitudinal","Interminable","Serpentine","Accordion","Telescopic","Klaus","Dieter","Gunter","Franz","Hans","Otto","Ernst","Wolfgang","Napoleon","Rasputin"],
    girl: ["Slinky","Sinuous","Serpentine","Lithe","Svelte","Streamlined","Sylphlike","Filiform","Ribbonesque","Vermicular","Anguilliform","Linear","Helga","Greta","Hilde","Inge","Ursula","Dagmar","Elke","Renate"],
  },
  german: {
    boy: ["Heinrich","Wolfgang","Dieter","Klaus","Reinhard","Gunther","Manfred","Siegfried","Konrad","Ulrich","Ludwig","Gerhard","Albrecht","Maximilian","Friedrich","Gottfried","Dietrich","Eberhard","Burkhard","Amadeus","Beethoven","Mozart"],
    girl: ["Hildegard","Brunhilde","Lieselotte","Gertrude","Ingeborg","Waltraud","Elfriede","Mathilde","Adelheid","Irmgard","Traudl","Hedwig","Gerhild","Mechthild","Kunigunde","Walburga","Hildegunde","Ermengard"],
  },
  spaniel: {
    boy: ["Archibald","Wellington","Rupert","Alistair","Cedric","Cornelius","Peregrine","Desmond","Humphrey","Everard","Montgomery","Algernon","Bartholomew","Reginald","Auberon","Lysander","Ptolemy","Leofric","Ethelbert","Osric"],
    girl: ["Georgiana","Arabella","Clementine","Millicent","Cordelia","Beatrice","Frederica","Constance","Prudence","Imogen","Sophronia","Wilhelmina","Henrietta","Lavinia","Dorothea","Rosalind","Griselda","Ermengarde","Etheldreda","Aldgitha"],
  },
  scottish: {
    boy: ["Alistair","Angus","Duncan","Fergus","Hamish","Kincaid","Kenneth","Cormac","Fionn","Diarmuid","Oisin","Conor","Tiernan","Brendan","Lucan","Waverly","Heath","Birch","Cedar","Elder","Yarrow","Sage","Bay"],
    girl: ["Niamh","Aoife","Grainne","Siobhan","Deirdre","Orla","Maeve","Brigid","Fiona","Catriona","Morag","Ishbel","Finella","Effie","Nessa","Astrid","Seren","Heather","Laurel","Clary","Alyssum","Thyme","Sorrel","Yarrow"],
  },
  highenergy: {
    boy: ["Rocket","Jax","Buzz","Jett","Dash","Ace","Axel","Maverick","Zephyr","Nash","Bowie","Ziggy","Taz","Zane","Apollo","Fynn","Kort","Rocco","Rocky","Ranger","Samurai","Phoenix","Bolt","Flash","Sprint","Blaze"],
    girl: ["Nova","Blaze","Storm","Zara","Ripley","Waverly","Harlow","Bellamy","Kynlee","Harlynn","Tsunami","Hurricane","Maelstrom","Tempest","Lydia","Jet","Dart","Zip","Streak","Flare"],
  },
  lowactivity: {
    boy: ["Otis","Moby","Waldo","Alf","Homer","Chester","Ralphie","Gus","Beau","Floyd","Lloyd","Cliff","Abner","Roscoe","Stanley","Herbert","Cecil","Leslie","Linus","Snooze","Slumber","Doze","Repose","Loaf","Slouch","Siesta"],
    girl: ["Dotty","Nora","Marge","Bev","Babs","Doris","Ethel","Hilda","Nap","Snooze","Slumber","Drowsy","Dreamy","Mellow","Laze","Pudge","Plump","Cosy","Settle","Repose"],
  },
  noisy: {
    boy: ["Ozzy","Bowie","Rocco","Rocky","Rambo","Buster","Trapper","Blue","Taz","Axel","Bellamy","Clamour","Racket","Din","Uproar","Hullabaloo","Bluster","Bellow","Holler","Holloway","Decibel","Foghorn","Klaxon","Siren","Trumpet"],
    girl: ["Clamoria","Racketina","Dinah","Uproaria","Bellamy","Blusteria","Bellisima","Serenade","Shriek","Wail","Lament","Caterwaul","Yodel","Aria","Soprano","Mezzo","Contralto","Falsetto","Vibrato","Fortissimo"],
  },
  weather: {
    boy: ["Hurricane","Tsunami","Maelstrom","Zephyr","Orion","Storm","Thunder","Tempest","Blizzard","Gale","Squall","Monsoon","Cyclone","Tornado","Vortex","Nimbus","Cumulus","Stratus","Cirrus","Solstice"],
    girl: ["Nova","Winter","Khione","Aura","Zephyr","Aurora","Tempesta","Tempestt","Mistral","Sirocco","Bora","Chinook","Foehn","Haboob","Derecho","Calima","Tramontane","Etesian","Meltemi","Sharav"],
  },
  starwars: {
    boy: ["Anakin","Kenobi","Han","Lando","Ackbar","Finn","Poe","Mace","Qui-Gon","Boba","Jango","Wedge","Biggs","Porkins","Greedo","Jabba","Tarkin","Palpatine","Dooku","Grievous"],
    girl: ["Leia","Padme","Ahsoka","Rey","Jyn","Sabine","Hera","Shaak","Luminara","Aayla","Barriss","Depa","Maz","Rose","Paige","Holdo","Phasma","Enfys","Qi'ra","Boushh"],
  },
  harrypotter: {
    boy: ["Albus","Severus","Neville","Ronald","Draco","Remus","Sirius","Cedric","Lucius","Alastor","Rubeus","Gilderoy","Dumbledore","Voldemort","Quirrell","Snape","Filch","Slughorn","Lockhart","Moody"],
    girl: ["Hermione","Bellatrix","Narcissa","Minerva","Pomfrey","Sprout","Hooch","Sinistra","Trelawney","Umbridge","Lavender","Parvati","Padma","Luna","Ginny","Fleur","Tonks","Andromeda","Molly","Petunia"],
  },
  startrek: {
    boy: ["Geordi","Jean-Luc","Wesley","Worf","Spock","Kirk","Scotty","Bones","Chekov","Sulu","Picard","Riker","Data","Troi","Crusher","LaForge","Wil","Odo","Quark","Bashir"],
    girl: ["Uhura","Troi","Beverly","Guinan","Ro","Kira","Jadzia","Dax","Ezri","Kasidy","Keiko","Lwaxana","Seska","Torres","Janeway","Seven","Kes","Neelix","Tuvok","Chakotay"],
  },
  marvel: {
    boy: ["Logan","Tony","Bruce","Steve","Peter","Bucky","Thor","Clint","Nick","Sam","Rhodey","Scott","Wade","Matt","Danny","Luke","Natasha","Pietro","Vision","Wanda"],
    girl: ["Natasha","Wanda","Carol","Hope","Jessica","Sharon","Pepper","Jane","Sif","Gamora","Nebula","Okoye","Shuri","Valkyrie","Mantis","Yelena","Monica","Agatha","Maria","Nakia"],
  },
  gods: {
    boy: ["Apollo","Jupiter","Mars","Neptune","Hercules","Pluto","Janus","Hermes","Bacchus","Sol","Ares","Hades","Dionysus","Helios","Kronos","Uranus","Prometheus","Zeus","Poseidon","Odysseus","Achilles","Perseus","Orpheus","Theseus","Ajax"],
    girl: ["Venus","Diana","Minerva","Juno","Ceres","Vesta","Aurora","Flora","Luna","Proserpina","Athena","Aphrodite","Hera","Demeter","Artemis","Persephone","Hecate","Nike","Nemesis","Tyche"],
  },
  historical: {
    boy: ["Napoleon","Rasputin","Darwin","Churchill","Beethoven","Michelangelo","Cicero","Charlemagne","Mozart","Freud","Newton","Machiavelli","Hannibal","Genghis","Millard Fillmore","Grover Cleveland","Aristotle","Galileo","Einstein","Socrates"],
    girl: ["Cleopatra","Boudicca","Eleanor","Catherine","Victoria","Josephine","Marie","Florence","Amelia","Harriet","Rosa","Frida","Indira","Golda","Emmeline","Sojourner","Ada","Hypatia","Hildegard","Hatshepsut"],
  },
  animals: {
    boy: ["Bear","Moose","Wolf","Tiger","Falcon","Colt","Lynx","Phoenix","Panda","Sparrow","Buck","Griffin","Hawk","Finch","Drake","Otter","Fox","Jackdaw","Corvid","Lark","Cheetah","Leopard","Eagle","Shark","Dolphin","Bison","Lion","Rhino","Gator"],
    girl: ["Vixen","Fawn","Robin","Wren","Raven","Dove","Lark","Sparrow","Heron","Egret","Magpie","Starling","Bunny","Kitten","Filly","Pony","Tigress","Panther","Viper","Cobra"],
  },
  goofy: {
    boy: ["Gizmo","Kevin","Baxley","Humperdinck","Vernon","Waldo","Gaylord","Gus","Gilbert","Ralphie","Homer","Alf","Floyd","Otis","Buster","Trapper","Jaxley","Axley","Bronx"],
    girl: ["Droplet","Dewdrop","Cornflake","Pickles","Wobble","Pudding","Biscuit","Wibble","Dizzy","Topsy","Muffin","Crumpet","Waffle","Noodle","Spaghetti","Pretzel","Dumpling","Sprout","Turnip","Radish"],
  },
  pompous: {
    boy: ["Archibald","Bartholomew","Cuthbert","Digby","Fillmore","Fletcher","Heathcliff","Huxley","Jasper","Jefferson","Langston","Neville","Oswald","Percival","Peregrine","Prescott","Remington","Seymour","Spencer","Sylvester","Vaughn","Willoughby","Wentworth","Windsor","Ambrose","Ashley","Ezra","Silas","Upton","Americus","Ichabod","Zechariah"],
    girl: ["Sophronia","Millicent","Ermengarde","Etheldreda","Constance","Prudence","Winifred","Hortense","Euphemia","Wilhelmina","Dorothea","Clementine","Araminta","Christabel","Isadora","Philomena"],
  },
  regal: {
    boy: ["Augustus","Caspian","Darius","Edmund","Ferdinand","Magnus","Maximillian","Napoleon","Octavius","Orlando","Percival","Prince","Reginald","Rupert","Sebastian","Solomon","Tiberius","Ulysses","Vincent","Winston","Lysander","Phineas","Horatio","Cornelius","Lando","Coriolanus","Charlemagne","Leopold","Vladilen","Adonis"],
    girl: ["Vivienne","Natalia","Astrid","Lydia","Adalia","Tallulah","Khali","Sabrina","Dolce","Olympia","Andromeda","Cassiopeia","Portia","Zenobia","Cornelia","Lavinia","Octavia","Camilla","Cleopatra","Zethes"],
  },
  default: {
    boy: ["Archibald","Barnaby","Cornelius","Douglas","Edmund","Frederick","Geoffrey","Herbert","Jasper","Lionel","Montgomery","Norman","Oswald","Percival","Quentin","Reginald","Stanley","Theodore","Ulysses","Vincent"],
    girl: ["Arabella","Beatrice","Clementine","Dorothy","Eleanor","Frederica","Georgiana","Helena","Isadora","Lavinia","Millicent","Nora","Octavia","Prudence","Rosalind","Sophronia","Tabitha","Ursula","Vivienne","Winifred"],
  },
};

// ── TITLES ─────────────────────────────────────────────────────────────────────
const TITLES: Record<string, string[]> = {
  terrier:    ["Mr","Miss"],
  spaniel:    ["Field Marshal","General","Admiral","Brigadier","Colonel"],
  retriever:  ["Colonel","Major","Captain","Commander"],
  german:     ["Colonel","Major","Captain"],
  collie:     ["Lieutenant","Second Lieutenant","Professor"],
  boxer:      ["Sergeant","Corporal","Lance Corporal"],
  sniffer:    ["Inspector","Chief Inspector","Superintendent","Commissioner","Judge"],
  sighthound: ["Duke","Duchess","Earl","Countess","Lord","Lady","Sir","Dame","Viscount","Viscountess"],
  giant:      ["The Great","The Magnificent","The Formidable","The Legendary","The Unstoppable"],
  poodle:     ["Professor","Doctor"],
  lapdog:     ["Reverend","Dean","Bishop","Archdeacon"],
  character:  ["The Notorious","The Incomparable","The Inimitable","The Illustrious"],
  gentry:     ["Viscount","Viscountess","Baron","Baroness","The Right Honourable"],
  highenergy: ["Lieutenant","Sergeant","Captain"],
  lowactivity:["Private","Lance Corporal","The Magnificent"],
  scottish:   ["Lord","Lady","Duke","Duchess","Sir","Dame"],
  historical: ["The Notorious","The Legendary","The Incomparable"],
  doodle:     ["Professor","Major","Inspector","The Magnificent"],
  default:    ["Major","Inspector","Baron","Lord"],
};

// ── DOG WORDS ──────────────────────────────────────────────────────────────────
const DOG_WORDS: Record<string, string[]> = {
  spaniel:    ["Flush","Fetch","Bound","Waggle","Splash","Scamper","Frolic","Gambol","Romp","Prance","Paddle","Plunge","Dive","Retrieve","Quarter","Sweep","Spring"],
  retriever:  ["Fetch","Bound","Wag","Leap","Paddle","Gambol","Romp","Gallop","Lollop","Caper","Carry","Swim","Splash","Beg","Inhale","Devour","Scoff","Snuffle","Mooch","Slurp"],
  collie:     ["Herd","Steer","Dart","Circle","Round","Weave","Dash","Sprint","Nip","Gather","Muster","Drive","Pen","Eye","Crouch","Stalk","Creep","Border","Flank","Cast"],
  boxer:      ["Charge","Bark","Rumble","Barge","Barrel","Lumber","Blunder","Crash","Thump","Bellow","Bounce","Lurch","Careen","Wobble","Stumble","Gallumph","Bluster","Swagger","Strut","Bluff"],
  sniffer:    ["Sniff","Snuffle","Nose","Trail","Track","Plod","Mosey","Amble","Trundle","Dawdle","Meander","Wander","Shuffle","Loiter","Linger","Tarry","Saunter","Trudge","Drag","Lumber"],
  sighthound: ["Sprint","Dart","Bolt","Flash","Streak","Glide","Sweep","Flow","Bound","Skim","Blur","Fly","Race","Course","Career","Hurtle","Shoot","Zoom","Whizz","Scorch"],
  giant:      ["Lumber","Plod","Amble","Stomp","Thud","Rumble","Clump","Trundle","Trudge","Sway","Heave","Haul","Loom","Lurch","Hulk","Shamble","Blunder","Crash","Quake","Thunder"],
  poodle:     ["Prance","Trot","Strut","Waltz","Sashay","Glide","Mince","Bounce","Flourish","Pirouette","Posture","Pose","Primp","Preen","Coiffure","Pompadour","Quiff","Plume"],
  lapdog:     ["Prance","Bounce","Trot","Waltz","Flounce","Sashay","Fluff","Frolic","Gambol","Shimmy","Preen","Primp","Pamper","Coddle","Cosset","Indulge","Fuss","Flutter","Simper","Glitter"],
  character:  ["Snort","Waddle","Snuffle","Tumble","Bumble","Toddle","Trundle","Wobble","Shuffle","Bustle","Totter","Teeter","Blunder","Grumble","Wheeze","Puff","Snore","Honk","Grunt","Rumble"],
  gentry:     ["Trot","Canter","Prance","Stride","Saunter","Amble","March","Parade","Promenade","Gallop","Traipse","Meander","Perambulate","Traverse","Patrol"],
  highenergy: ["Sprint","Zoom","Dash","Bolt","Leap","Bound","Hurtle","Rocket","Blast","Shoot","Career","Charge","Race","Tear","Fly","Streak","Flash","Zip","Whizz","Zap"],
  lowactivity:["Snooze","Slumber","Doze","Laze","Loaf","Mooch","Slouch","Loll","Dawdle","Amble","Shuffle","Plod","Saunter","Mosey","Drool","Snore","Yawn","Stretch","Flop","Sprawl"],
  weather:    ["Storm","Thunder","Gale","Squall","Gust","Blast","Surge","Howl","Roar","Rage","Tempest","Torrent","Billow","Swirl","Eddy","Vortex","Spiral","Churn","Lash"],
  scottish:   ["Stride","Bound","Lope","Gallop","Sweep","Range","Rove","Wander","Roam","Trek","Hike","Tramp","March","Ramble","Traipse","Mooch","Saunter","Amble","Meander","Drift"],
  german:     ["March","Drill","Patrol","Guard","Sentinel","Flank","Advance","Retreat","Deploy","Manoeuvre","Intercept","Apprehend","Secure","Maintain","Enforce","Uphold","Execute","Report","Assess","Breach"],
  doodle:     ["Bounce","Bound","Leap","Caper","Romp","Frolic","Gambol","Cavort","Prance","Scamper","Scuttle","Scurry","Skitter","Scoot","Zoom","Zip","Zap","Whizz","Whoosh","Dash"],
  terrier:    ["Bolt","Dig","Scrap","Scruff","Rumpus","Rattle","Scuttle","Scrabble","Pounce","Bristle","Snarl","Snap","Nip","Yap","Skitter","Scurry","Ferret","Burrow","Tunnel","Scramble"],
  default:    ["Trot","Bound","Wag","Prance","Romp","Caper","Gambol","Frolic","Scamper","Saunter","Amble","Mosey","Ramble","Wander","Meander","Traipse","Mooch","Loaf","Dawdle","Pootle"],
};

// ── REASONING ─────────────────────────────────────────────────────────────────
const REASONING: Record<string, string[]> = {
  lapdog:     ["Looks like a small cloud that someone has given opinions. The Bishop was the natural conclusion.","Perpetually groomed, permanently cheerful, mildly judgmental. Dean of the Diocese of the Sitting Room.","Has maintained this exact hairstyle for several centuries. An Archdeacon of consistency.","Four hundred years of palace living leaves a dog with very particular ideas about ceremony.","Arrives in a room the way a bishop arrives at a christening -- expected, overdressed, and faintly disapproving."],
  boxer:      ["Approaches every situation with maximum enthusiasm and minimum strategy. Corporal material.","Loyal, loud, and absolutely convinced that sitting on your lap is a human right.","Looks permanently surprised, even at things it caused. The Sergeant's face says it all.","Never met a stranger. This is not always helpful on military exercises.","Approaches every day as though something brilliant is about to happen. It usually involves a sock."],
  sighthound: ["Forty miles per hour of elegant indifference. The earldom was awarded for sheer deportment.","Has always considered the peerage its natural social circle -- if anything, beneath it.","Has been aristocratic since before the British aristocracy was invented.","Moves through the world with the serene confidence of something that has never once been told no.","Sleeps seventeen hours a day with the dignity of someone who has earned it through noble lineage."],
  sniffer:    ["Has the air of a detective who solved the case three days ago and is merely waiting for everyone else.","Melancholy eyes, powerful nose, deeply suspicious of everything. Classic Chief Inspector.","Follows a scent with the focus of a detective who has forgotten why they started.","A nose more powerful than any instrument, deployed entirely in the service of biscuit detection.","The most expensive biological detection equipment in the world. Currently investigating a crisp packet."],
  giant:      ["So large that the title had to match the physical reality. The Great was barely adequate.","The Magnificent was awarded at the first meeting. There was no second opinion.","Operates more like a geographic feature than an animal. The Formidable.","Sits on your lap with complete confidence of something that weighs sixty kilograms.","Was named Teacup at eight weeks. At eighteen months, the irony became structural."],
  terrier:    ["The only dog that regularly picks fights with things three times its size and usually wins.","A terrier would consider a title an unnecessary distraction from the serious business of digging.","Bred to chase rats down mines. Has never once revised its threat assessment since.","Six inches of righteous fury in a jacket of wiry fur.","Has declared war on the postman, the vacuum cleaner, and a leaf. Currently winning two of those."],
  retriever:  ["Dependable, cheerful, and utterly convinced every situation calls for a biscuit.","Greets burglars as enthusiastically as family members -- promoted on charm alone.","Has never met a puddle it didn't immediately lie down in.","Approaches every command with enthusiasm and then sits on your foot.","The only animal capable of looking genuinely hurt that there are no more biscuits."],
  collie:     ["The most intelligent dog in the world and absolutely cannot stop telling you about it.","Herds sheep, children, and visiting relatives with equal efficiency.","The Professor is the only rank that explains the permanently disappointed expression.","Has never once been off duty. Not once. Not even asleep."],
  poodle:     ["The most intelligent dog in the world and considerably better dressed than you.","Originally a water retriever, now primarily a philosopher. The doctorate was inevitable.","Regards the standard trim as a personal affront. Professor suits it far better.","Breeds above itself in intelligence and consistently knows it."],
  spaniel:    ["Spaniels have commanded hunting parties since the Tudor court. A generalship was long overdue.","Spent centuries giving orders to beaters and retrievers. Command suits it naturally.","Floppy ears and absolute authority -- the spaniel was born to lead.","The Field Marshal of the water meadow and the reed bed since 1600."],
  character:  ["A face like a fist, a personality like a party. The Incomparable was the most accurate description.","Breathes loudly through every social occasion with complete conviction it is doing this correctly.","Believes it is a much larger dog trapped in a terrible administrative error.","Looks directly into your eyes and then does exactly what it was going to do anyway."],
  dachshund:  ["Two thousand years of German engineering went into a dog that cannot reach most surfaces.","Six inches tall and absolutely convinced it could take a badger. The Notorious was the only honest title.","Moves through the world like a very short scandal.","The proportions suggest an engineering compromise was made at some point. The dog disagrees."],
  historical: ["Named after one of history's most consequential figures. The dog has thus far failed to live up to this.","The name carries the weight of empires. The dog is currently eating a shoe.","Named in the full knowledge that visitors would have to say it out loud with a straight face."],
  goofy:      ["The name was chosen at eight weeks. At eighteen months, everyone agreed it still fitted perfectly.","A dog of absolutely no pretension whatsoever, and deeply comfortable with this.","Could not be intimidating if it tried. It tries constantly."],
  default:    ["A dog of considerable distinction that has earned its title through sheer presence.","The rank was awarded after careful consideration. The evidence was considerable.","A distinguished animal that requires no historical precedent for its own importance."],
};

// ── NICKNAME LOGIC ─────────────────────────────────────────────────────────────
function getNickname(firstName: string): string {
  const n = firstName;
  const l = n.toLowerCase();
  // If it's already short, use as-is
  if (n.length <= 4) return n;
  // Common natural shortenings
  const shortcuts: Record<string, string> = {
    archibald: "Archie", bartholomew: "Baz", cornelius: "Cornie", reginald: "Reggie",
    algernon: "Algie", peregrine: "Perry", maximillian: "Max", maximilian: "Max",
    humphrey: "Humph", montgomery: "Monty", ferdinand: "Ferdie", alexander: "Alex",
    sebastian: "Seb", cornelius2: "Cornie", theodore: "Teddy", frederick: "Freddie",
    desmond: "Dez", wellington: "Welly", percival: "Percy", lysander: "Ly",
    evander: "Evan", auberon: "Aubs", wilfred: "Wilf", sherlock: "Sherl",
    hercule: "Herc", augustus: "Gus", cornelius3: "Neil", superintendent: "Super",
    nonchalance: "Nona", glaciale: "Glayglay",
    evangelina: "Evie", evangeline: "Evie", celestine: "Celly", sophronia: "Soph",
    euphemia: "Effie", wilhelmina: "Billie", clementine: "Clem", millicent: "Millie",
    frederica: "Freddie", constance: "Connie", prudence: "Prue", dorothea: "Dot",
    pandemonium: "Panda", discombobulate: "Disco", hullabaloo: "Hulla",
    frenzina: "Fren", pandemonia: "Panda", anarchia: "Anar", tempesta: "Tempe",
    lachrymose: "Lachs", lugubrious: "Lugsy", disconsolate: "Disco",
    existentiale: "Exist", hermeneutique: "Herm", phenomenologie: "Phenom",
    hypervigilant: "Hyper", indefatigable: "Indy", pertinacious: "Percy",
    plodsworth: "Plods", glumley: "Glum", trudgewick: "Trudge", gloopington: "Gloops",
    humperdinck: "Humps", bartholomew2: "Baz", elongated: "Longy",
    infinitesimal: "Infini", imperceptible: "Imp", microscopic: "Micro",
    diminutive: "Dimmy", gossamera: "Gossie", daintybell: "Dainty",
    discombobulate2: "Disco", nincompoop: "Ninnie", flibbert: "Flib",
    doublebubble: "Dubbs", chumbawumba: "Chumba", zippadeedooda: "Zippy",
    fortissimo: "Forti", contralto: "Contri", bellisima: "Bella",
  };
  if (shortcuts[l]) return shortcuts[l];
  // Concept words -- just take first 4-5 chars and add y/ie
  const conceptWords = ["chaos","havoc","mayhem","bedlam","ruckus","anarchy","turmoil","uproar","tumult","fracas","commotion","furore","clamour","rampage","imbroglio","mischief","turbulence","whirlwind","nonchalance","indifference","lassitude","apathy","sangfroid","equanimity","melancholy","lugubrious","elongated","horizontal","protracted","longitudinal","serpentine","accordion","telescopic","snooze","slumber","decibel","foghorn","klaxon","hurricane","tsunami","maelstrom","blizzard","cyclone","tornado"];
  if (conceptWords.includes(l)) {
    return n.slice(0,4) + (n[3] === n[3].toLowerCase() ? "y" : "ie");
  }
  // Default: first syllable + ie/y
  if (l.endsWith("ia") || l.endsWith("ina") || l.endsWith("eena")) {
    return n.slice(0, Math.min(5, n.length - 2));
  }
  // Just take first 4 chars
  return n.slice(0, 4);
}

// ── BREED GROUP LOOKUP ─────────────────────────────────────────────────────────
function getGroup(breed: string): string {
  const b = breed.toLowerCase();
  if (b.includes("spaniel") && !b.includes("cavalier")) return "spaniel";
  if (b === "cavalier king charles spaniel") return "lapdog";
  if (b.includes("retriever") || b === "labrador" || b === "labradoodle" || b === "goldendoodle") return "retriever";
  if (b === "border collie" || b === "rough collie") return "collie";
  if (["staffordshire bull terrier","boxer","bull terrier","bulldog","french bulldog"].includes(b)) return "boxer";
  if (["basset hound","bloodhound","beagle"].includes(b)) return "sniffer";
  if (["greyhound","afghan hound","borzoi","saluki","irish wolfhound","lurcher","whippet","italian greyhound"].includes(b)) return "sighthound";
  if (["great dane","mastiff","saint bernard","newfoundland","leonberger"].includes(b)) return "giant";
  if (b === "poodle") return "poodle";
  if (["bichon frise","shih tzu","pomeranian","papillon","maltese","maltipoo","cavapoo","cavachon"].includes(b)) return "lapdog";
  if (["dachshund"].includes(b)) return "dachshund";
  if (["german shepherd","doberman pinscher","rottweiler","weimaraner"].includes(b)) return "german";
  if (["dalmatian","old english sheepdog","bernese mountain dog"].includes(b)) return "gentry";
  if (["pug","siberian husky","chihuahua","corgi","boston terrier"].includes(b)) return "character";
  if (b.includes("terrier") || b === "miniature schnauzer") return "terrier";
  if (["scottish terrier","cairn terrier","west highland terrier","deerhound"].includes(b)) return "scottish";
  if (["irish setter","hungarian vizsla","pointer","weimaraner"].includes(b)) return "highenergy";
  if (["chow chow","shar pei","lhasa apso","tibetan mastiff"].includes(b)) return "lowactivity";
  if (b.includes("doodle") || b.includes("poo") || b === "jackapoo") return "doodle";
  return "default";
}

function pick<T>(arr: T[], seed: number): T { return arr[Math.abs(seed) % arr.length]; }

function makeName(breed: string, surname: string, gender: "boy"|"girl", seed: number) {
  const group = getGroup(breed);
  const nameBank = NAMES[group] || NAMES.default;
  const titleBank = TITLES[group] || TITLES.default;
  const wordBank = DOG_WORDS[group] || DOG_WORDS.default;
  const reasoningBank = REASONING[group] || REASONING.default;

  const title = pick(titleBank, seed);
  const firstName = pick(gender === "boy" ? nameBank.boy : nameBank.girl, seed + 3);
  const alreadyHyphenated = surname.includes("-");
  const dogWord = pick(wordBank, seed + 7);
  const fullSurname = alreadyHyphenated ? surname : `${dogWord}-${surname}`;
  const full = `${title} ${firstName} ${fullSurname}`;
  const reasoning = pick(reasoningBank, seed + 11);
  const nickname = getNickname(firstName);

  return { full, nickname, reasoning };
}

type Result = { full: string; nickname: string; reasoning: string };

export default function NameGeneratorPage() {
  const [breed, setBreed] = useState("");
  const [surname, setSurname] = useState("");
  const [gender, setGender] = useState<"boy"|"girl">("boy");
  const [results, setResults] = useState<Result[]|null>(null);

  function generate() {
    if (!breed) { alert("Please select a breed"); return; }
    if (!surname.trim()) { alert("Please enter your surname"); return; }
    const s = Math.floor(Math.random() * 997);
    const deduped: Result[] = [];
    const usedTitles = new Set<string>();
    for (let i = 0; i < 20 && deduped.length < 3; i++) {
      const n = makeName(breed, surname.trim(), gender, s + i * 13);
      const t = n.full.split(" ")[0] + n.full.split(" ")[1];
      if (!usedTitles.has(t)) { usedTitles.add(t); deduped.push(n); }
    }
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
              maxLength={60} onKeyDown={e => e.key === "Enter" && generate()}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", fontFamily: "var(--font-body)", fontSize: "0.95rem", marginBottom: 20, outline: "none", boxSizing: "border-box" }} />

            <label style={{ display: "block", color: "var(--yellow)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontFamily: "var(--font-body)" }}>Boy or girl?</label>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {(["boy","girl"] as const).map(g => (
                <button key={g} onClick={() => setGender(g)}
                  style={{ flex: 1, padding: 12, borderRadius: 12, border: `1.5px solid ${gender===g?"var(--yellow)":"rgba(255,255,255,0.15)"}`, background: gender===g?"var(--yellow)":"rgba(255,255,255,0.08)", color: gender===g?"var(--navy)":"#fff", fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>
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
            <div key={i} style={{ background: "#fff", borderRadius: 18, padding: "clamp(16px,3vw,28px)", marginBottom: 16, borderTop: "5px solid var(--yellow)", boxShadow: "0 2px 16px rgba(10,58,87,0.08)" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--blue-sky)", marginBottom: 8, fontFamily: "var(--font-body)" }}>Option {i + 1}</div>
              <div className="display" style={{ fontSize: "clamp(1.2rem,3vw,1.7rem)", color: "var(--navy)", marginBottom: 4, lineHeight: 1.2 }}>{n.full}</div>
              {n.nickname && n.nickname !== n.full.split(" ")[1] && (
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
