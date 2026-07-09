export interface FamousDog {
  name: string;
  type: string;
  knownFor: string;
  sourceUrl: string;
}

const famousDogs: Record<string, FamousDog[]> = {
  "afghan-hound": [
    { name: "What-a-Mess", type: "Animated", knownFor: "What-a-Mess books and TV series", sourceUrl: "https://en.wikipedia.org/wiki/What-a-Mess" },
  ],
  "basset-hound": [
    { name: "Droopy", type: "Animated", knownFor: "Droopy cartoons", sourceUrl: "https://en.wikipedia.org/wiki/Droopy" },
    { name: "Toby", type: "Animated", knownFor: "The Great Mouse Detective", sourceUrl: "https://en.wikipedia.org/wiki/The_Great_Mouse_Detective" },
    { name: "Flash", type: "Live-action TV", knownFor: "The Dukes of Hazzard", sourceUrl: "https://en.wikipedia.org/wiki/Flash_(dog)" },
    { name: "Lafayette", type: "Animated", knownFor: "The Aristocats", sourceUrl: "https://en.wikipedia.org/wiki/The_Aristocats" },
  ],
  "beagle": [
    { name: "Snoopy", type: "Animated", knownFor: "Peanuts", sourceUrl: "https://www.thekennelclub.org.uk/blog/6-top-dogs-in-comic-books/" },
    { name: "Shiloh", type: "Live-action film", knownFor: "Shiloh", sourceUrl: "https://en.wikipedia.org/wiki/Shiloh_(Naylor_novel)" },
    { name: "Underdog", type: "Animated", knownFor: "Underdog", sourceUrl: "https://en.wikipedia.org/wiki/Underdog_(TV_series)" },
  ],
  "bloodhound": [
    { name: "Trusty", type: "Animated", knownFor: "Lady and the Tramp", sourceUrl: "https://en.wikipedia.org/wiki/Lady_and_the_Tramp" },
    { name: "Copper", type: "Animated", knownFor: "The Fox and the Hound", sourceUrl: "https://en.wikipedia.org/wiki/The_Fox_and_the_Hound" },
    { name: "Wylie Burp", type: "Animated", knownFor: "An American Tail: Fievel Goes West", sourceUrl: "https://en.wikipedia.org/wiki/An_American_Tail:_Fievel_Goes_West" },
  ],
  "border-collie": [
    { name: "Shep", type: "Real", knownFor: "Blue Peter dog", sourceUrl: "https://en.wikipedia.org/wiki/Blue_Peter_pets" },
    { name: "Meg", type: "Real", knownFor: "Blue Peter dog", sourceUrl: "https://en.wikipedia.org/wiki/Blue_Peter_pets" },
    { name: "Fly", type: "Live-action film", knownFor: "Babe", sourceUrl: "https://en.wikipedia.org/wiki/Babe_(film)" },
    { name: "Dog", type: "Comics", knownFor: "Footrot Flats", sourceUrl: "https://en.wikipedia.org/wiki/Footrot_Flats" },
  ],
  "border-terrier": [
    { name: "Baxter", type: "Live-action film", knownFor: "Anchorman films", sourceUrl: "https://en.wikipedia.org/wiki/Anchorman:_The_Legend_of_Ron_Burgundy" },
  ],
  "boston-terrier": [
    { name: "Sergeant Stubby", type: "Real", knownFor: "First World War decorated war dog", sourceUrl: "https://en.wikipedia.org/wiki/Sergeant_Stubby" },
  ],
  "bull-terrier": [
    { name: "Bull's-eye", type: "Literature", knownFor: "Oliver Twist and Oliver!", sourceUrl: "https://en.wikipedia.org/wiki/Bull%27s-eye_(dog)" },
    { name: "Scud", type: "Animated", knownFor: "Toy Story", sourceUrl: "https://en.wikipedia.org/wiki/List_of_fictional_dogs_in_animated_film" },
    { name: "Sparky", type: "Animated", knownFor: "Frankenweenie", sourceUrl: "https://en.wikipedia.org/wiki/Frankenweenie_(2012_film)" },
    { name: "Spuds MacKenzie", type: "Advertising", knownFor: "International advertising mascot", sourceUrl: "https://en.wikipedia.org/wiki/Spuds_MacKenzie" },
  ],
  "bulldog": [
    { name: "Spike", type: "Animated", knownFor: "Tom and Jerry", sourceUrl: "https://en.wikipedia.org/wiki/Spike_and_Tyke" },
    { name: "Tyke", type: "Animated", knownFor: "Tom and Jerry", sourceUrl: "https://en.wikipedia.org/wiki/Spike_and_Tyke" },
    { name: "Churchill", type: "Advertising", knownFor: "Churchill Insurance mascot", sourceUrl: "https://en.wikipedia.org/wiki/Churchill_Insurance" },
    { name: "Tillman", type: "Real", knownFor: "Skateboarding and surfing dog", sourceUrl: "https://en.wikipedia.org/wiki/Tillman_(dog)" },
  ],
  "cavalier-king-charles-spaniel": [
    { name: "Dash", type: "Real", knownFor: "Queen Victoria's companion", sourceUrl: "https://en.wikipedia.org/wiki/Dash_(spaniel)" },
  ],
  "chihuahua": [
    { name: "Bruiser Woods", type: "Live-action film", knownFor: "Legally Blonde films", sourceUrl: "https://en.wikipedia.org/wiki/Legally_Blonde" },
    { name: "Tito", type: "Animated", knownFor: "Oliver & Company", sourceUrl: "https://en.wikipedia.org/wiki/Oliver_%26_Company" },
    { name: "Chloe", type: "Live-action film", knownFor: "Beverly Hills Chihuahua", sourceUrl: "https://en.wikipedia.org/wiki/Beverly_Hills_Chihuahua" },
    { name: "Ren Höek", type: "Animated", knownFor: "The Ren & Stimpy Show", sourceUrl: "https://en.wikipedia.org/wiki/Ren_H%C3%B6ek" },
  ],
  "cocker-spaniel": [
    { name: "Lady", type: "Animated", knownFor: "Lady and the Tramp", sourceUrl: "https://en.wikipedia.org/wiki/Lady_and_the_Tramp" },
    { name: "Flush", type: "Literature", knownFor: "Flush: A Biography by Virginia Woolf", sourceUrl: "https://en.wikipedia.org/wiki/Flush:_A_Biography" },
    { name: "Checkers", type: "Real", knownFor: "Richard Nixon's Checkers speech dog", sourceUrl: "https://en.wikipedia.org/wiki/Checkers_speech" },
  ],
  "corgi": [
    { name: "Susan", type: "Real", knownFor: "Foundation dog of Queen Elizabeth II's Corgi line", sourceUrl: "https://www.thekennelclub.org.uk/media-centre/2018/april/corgis-and-the-queen-celebrating-the-breed-that-the-queen-made-popular/" },
    { name: "Muick", type: "Real", knownFor: "One of Queen Elizabeth II's final Corgis", sourceUrl: "https://en.wikipedia.org/wiki/Royal_corgis" },
    { name: "Ein", type: "Animated", knownFor: "Cowboy Bebop", sourceUrl: "https://en.wikipedia.org/wiki/Ein_(Cowboy_Bebop)" },
    { name: "Rex", type: "Animated", knownFor: "The Queen's Corgi", sourceUrl: "https://en.wikipedia.org/wiki/The_Queen%27s_Corgi" },
  ],
  "dachshund": [
    { name: "Slinky Dog", type: "Animated", knownFor: "Toy Story", sourceUrl: "https://en.wikipedia.org/wiki/Slinky_Dog" },
    { name: "Buddy", type: "Animated", knownFor: "The Secret Life of Pets", sourceUrl: "https://en.wikipedia.org/wiki/The_Secret_Life_of_Pets" },
    { name: "Waldi", type: "Real", knownFor: "1972 Munich Olympic Games mascot", sourceUrl: "https://en.wikipedia.org/wiki/Waldi" },
  ],
  "dalmatian": [
    { name: "Pongo", type: "Literature / animation", knownFor: "The Hundred and One Dalmatians", sourceUrl: "https://en.wikipedia.org/wiki/The_Hundred_and_One_Dalmatians" },
    { name: "Perdita", type: "Literature / animation", knownFor: "The Hundred and One Dalmatians", sourceUrl: "https://en.wikipedia.org/wiki/The_Hundred_and_One_Dalmatians" },
    { name: "Marshall", type: "Animated", knownFor: "PAW Patrol", sourceUrl: "https://en.wikipedia.org/wiki/PAW_Patrol" },
    { name: "Oddball", type: "Live-action film", knownFor: "102 Dalmatians", sourceUrl: "https://en.wikipedia.org/wiki/102_Dalmatians" },
  ],
  "doberman-pinscher": [
    { name: "Alpha", type: "Animated", knownFor: "Up", sourceUrl: "https://en.wikipedia.org/wiki/Up_(2009_film)" },
    { name: "Roscoe and DeSoto", type: "Animated", knownFor: "Oliver & Company", sourceUrl: "https://en.wikipedia.org/wiki/Oliver_%26_Company" },
    { name: "Zeus and Apollo", type: "Live-action TV", knownFor: "Magnum, P.I.", sourceUrl: "https://en.wikipedia.org/wiki/Magnum,_P.I." },
  ],
  "french-bulldog": [
    { name: "Stella", type: "Live-action TV", knownFor: "Modern Family", sourceUrl: "https://en.wikipedia.org/wiki/Stella_(Modern_Family)" },
  ],
  "german-shepherd": [
    { name: "Rin Tin Tin", type: "Real", knownFor: "International screen star", sourceUrl: "https://en.wikipedia.org/wiki/Rin_Tin_Tin" },
    { name: "Strongheart", type: "Real", knownFor: "Early canine film star", sourceUrl: "https://en.wikipedia.org/wiki/Strongheart" },
    { name: "Inspector Rex", type: "Live-action TV", knownFor: "Kommissar Rex / Inspector Rex", sourceUrl: "https://en.wikipedia.org/wiki/Inspector_Rex" },
  ],
  "golden-retriever": [
    { name: "Goldie", type: "Real", knownFor: "Blue Peter dog", sourceUrl: "https://en.wikipedia.org/wiki/Blue_Peter_pets" },
    { name: "Bonnie", type: "Real", knownFor: "Blue Peter dog -- Goldie's daughter", sourceUrl: "https://en.wikipedia.org/wiki/Blue_Peter_pets" },
    { name: "Shadow", type: "Live-action film", knownFor: "Homeward Bound: The Incredible Journey", sourceUrl: "https://en.wikipedia.org/wiki/Homeward_Bound:_The_Incredible_Journey" },
    { name: "Dug", type: "Animated", knownFor: "Up", sourceUrl: "https://en.wikipedia.org/wiki/Dug_(Up)" },
  ],
  "great-dane": [
    { name: "Scooby-Doo", type: "Animated", knownFor: "Scooby-Doo franchise", sourceUrl: "https://www.thekennelclub.org.uk/media-centre/2020/july/scooby-dooby-down-mystery-of-great-dane-popularity-plunge/" },
    { name: "Marmaduke", type: "Comics / film", knownFor: "Marmaduke", sourceUrl: "https://en.wikipedia.org/wiki/Marmaduke" },
    { name: "Astro", type: "Animated", knownFor: "The Jetsons", sourceUrl: "https://en.wikipedia.org/wiki/Astro_(The_Jetsons)" },
    { name: "Giant George", type: "Real", knownFor: "Former Guinness World Record holder for tallest living dog", sourceUrl: "https://en.wikipedia.org/wiki/Giant_George" },
  ],
  "greyhound": [
    { name: "Santa's Little Helper", type: "Animated", knownFor: "The Simpsons", sourceUrl: "https://en.wikipedia.org/wiki/Santa%27s_Little_Helper" },
    { name: "Mick the Miller", type: "Real", knownFor: "Famous British racing Greyhound", sourceUrl: "https://en.wikipedia.org/wiki/Mick_the_Miller" },
    { name: "Master McGrath", type: "Real", knownFor: "Celebrated Irish coursing Greyhound", sourceUrl: "https://en.wikipedia.org/wiki/Master_McGrath" },
  ],
  "irish-setter": [
    { name: "Big Red", type: "Literature / film", knownFor: "Big Red", sourceUrl: "https://en.wikipedia.org/wiki/Big_Red_(novel)" },
  ],
  "irish-wolfhound": [
    { name: "Gelert", type: "Legend", knownFor: "The legend of Gelert and Llywelyn the Great", sourceUrl: "https://www.nationaltrust.org.uk/visit/wales/craflwyn-and-beddgelert/discover-the-legend-of-gelert" },
    { name: "Chief", type: "Animated", knownFor: "The Fox and the Hound", sourceUrl: "https://en.wikipedia.org/wiki/The_Fox_and_the_Hound" },
  ],
  "jack-russell-terrier": [
    { name: "Eddie", type: "Live-action TV", knownFor: "Frasier", sourceUrl: "https://en.wikipedia.org/wiki/Eddie_(Frasier)" },
    { name: "Uggie", type: "Real", knownFor: "The Artist", sourceUrl: "https://en.wikipedia.org/wiki/Uggie" },
    { name: "Milo", type: "Live-action film", knownFor: "The Mask", sourceUrl: "https://en.wikipedia.org/wiki/The_Mask_(1994_film)" },
    { name: "Max", type: "Animated", knownFor: "The Secret Life of Pets", sourceUrl: "https://en.wikipedia.org/wiki/The_Secret_Life_of_Pets" },
    { name: "Wishbone", type: "Live-action TV", knownFor: "Wishbone", sourceUrl: "https://en.wikipedia.org/wiki/Wishbone_(TV_series)" },
  ],
  "labrador": [
    { name: "Marley", type: "Literature / film", knownFor: "Marley & Me", sourceUrl: "https://en.wikipedia.org/wiki/Marley_%26_Me" },
    { name: "Endal", type: "Real", knownFor: "Decorated assistance dog noted for lifesaving actions", sourceUrl: "https://en.wikipedia.org/wiki/Endal" },
    { name: "Bouncer", type: "Live-action TV", knownFor: "Neighbours", sourceUrl: "https://en.wikipedia.org/wiki/Bouncer_(Neighbours)" },
    { name: "Luath", type: "Literature / film", knownFor: "The Incredible Journey", sourceUrl: "https://en.wikipedia.org/wiki/The_Incredible_Journey" },
  ],
  "mastiff": [
    { name: "Fang", type: "Literature", knownFor: "Harry Potter novels", sourceUrl: "https://en.wikipedia.org/wiki/Magical_creatures_in_Harry_Potter" },
    { name: "Hercules", type: "Live-action film", knownFor: "The Sandlot", sourceUrl: "https://en.wikipedia.org/wiki/The_Sandlot" },
    { name: "Zorba", type: "Real", knownFor: "Former record-holder for heaviest and longest dog", sourceUrl: "https://en.wikipedia.org/wiki/Zorba_(dog)" },
  ],
  "miniature-schnauzer": [
    { name: "Colin", type: "Live-action TV", knownFor: "Spaced", sourceUrl: "https://en.wikipedia.org/wiki/Spaced" },
  ],
  "old-english-sheepdog": [
    { name: "Dulux dog", type: "Advertising", knownFor: "Dulux paint advertising mascot", sourceUrl: "https://en.wikipedia.org/wiki/Dulux" },
    { name: "Digby", type: "Live-action film", knownFor: "Digby, the Biggest Dog in the World", sourceUrl: "https://en.wikipedia.org/wiki/Digby,_the_Biggest_Dog_in_the_World" },
    { name: "Max", type: "Animated", knownFor: "The Little Mermaid", sourceUrl: "https://en.wikipedia.org/wiki/The_Little_Mermaid_(1989_film)" },
    { name: "Ambrosius", type: "Live-action film", knownFor: "Labyrinth", sourceUrl: "https://en.wikipedia.org/wiki/Labyrinth_(1986_film)" },
  ],
  "pomeranian": [
    { name: "Gidget", type: "Animated", knownFor: "The Secret Life of Pets", sourceUrl: "https://en.wikipedia.org/wiki/The_Secret_Life_of_Pets" },
    { name: "Boo", type: "Real", knownFor: "Widely followed social-media dog", sourceUrl: "https://en.wikipedia.org/wiki/Boo_(dog)" },
    { name: "Marco", type: "Real", knownFor: "Queen Victoria's Pomeranian", sourceUrl: "https://en.wikipedia.org/wiki/Pomeranian_dog" },
  ],
  "poodle": [
    { name: "Roly", type: "Live-action TV", knownFor: "EastEnders", sourceUrl: "https://en.wikipedia.org/wiki/Roly_(dog)" },
    { name: "Georgette", type: "Animated", knownFor: "Oliver & Company", sourceUrl: "https://en.wikipedia.org/wiki/Oliver_%26_Company" },
    { name: "Daphne", type: "Live-action film", knownFor: "Look Who's Talking Now", sourceUrl: "https://en.wikipedia.org/wiki/Look_Who%27s_Talking_Now" },
  ],
  "pug": [
    { name: "Frank", type: "Live-action film", knownFor: "Men in Black films", sourceUrl: "https://en.wikipedia.org/wiki/Frank_the_Pug" },
    { name: "Percy", type: "Animated", knownFor: "Pocahontas", sourceUrl: "https://en.wikipedia.org/wiki/Pocahontas_(1995_film)" },
    { name: "Mel", type: "Animated", knownFor: "The Secret Life of Pets", sourceUrl: "https://en.wikipedia.org/wiki/The_Secret_Life_of_Pets" },
    { name: "Willy", type: "Live-action TV", knownFor: "EastEnders", sourceUrl: "https://en.wikipedia.org/wiki/List_of_EastEnders_characters" },
  ],
  "rottweiler": [
    { name: "Carl", type: "Literature", knownFor: "Good Dog, Carl", sourceUrl: "https://en.wikipedia.org/wiki/Good_Dog,_Carl" },
    { name: "Muzzle", type: "Animated", knownFor: "Road Rovers", sourceUrl: "https://en.wikipedia.org/wiki/Road_Rovers" },
  ],
  "saint-bernard": [
    { name: "Beethoven", type: "Live-action film", knownFor: "Beethoven franchise", sourceUrl: "https://en.wikipedia.org/wiki/Beethoven_(film)" },
    { name: "Barry", type: "Real", knownFor: "Historic Alpine rescue dog", sourceUrl: "https://en.wikipedia.org/wiki/Barry_(dog)" },
    { name: "Nana", type: "Literature / animation", knownFor: "Peter Pan adaptations", sourceUrl: "https://en.wikipedia.org/wiki/Nana_(Peter_Pan)" },
  ],
  "shih-tzu": [
    { name: "Bonny", type: "Live-action film", knownFor: "Seven Psychopaths", sourceUrl: "https://en.wikipedia.org/wiki/Seven_Psychopaths" },
  ],
  "siberian-husky": [
    { name: "Togo", type: "Real", knownFor: "1925 serum run to Nome", sourceUrl: "https://en.wikipedia.org/wiki/Togo_(dog)" },
    { name: "Balto", type: "Real / animation", knownFor: "1925 serum run to Nome", sourceUrl: "https://en.wikipedia.org/wiki/Balto" },
    { name: "Demon", type: "Live-action film", knownFor: "Snow Dogs", sourceUrl: "https://en.wikipedia.org/wiki/Snow_Dogs" },
  ],
  "springer-spaniel": [
    { name: "Buster", type: "Real", knownFor: "PDSA Dickin Medal recipient and arms-detection dog", sourceUrl: "https://en.wikipedia.org/wiki/Buster_(dog)" },
  ],
  "staffordshire-bull-terrier": [
    { name: "Sox", type: "Real", knownFor: "PDSA Order of Merit recipient, police dog", sourceUrl: "https://www.pdsa.org.uk/what-we-do/animal-awards-programme" },
  ],
  "weimaraner": [
    { name: "Man Ray", type: "Real", knownFor: "William Wegman's photographic muse", sourceUrl: "https://en.wikipedia.org/wiki/William_Wegman_(photographer)" },
    { name: "Fay Ray", type: "Real", knownFor: "William Wegman's photographic work", sourceUrl: "https://en.wikipedia.org/wiki/William_Wegman_(photographer)" },
  ],
  "west-highland-terrier": [
    { name: "Wee Jock", type: "Live-action TV", knownFor: "Hamish Macbeth", sourceUrl: "https://en.wikipedia.org/wiki/Hamish_Macbeth_(TV_series)" },
    { name: "Cesar dog", type: "Advertising", knownFor: "Cesar dog-food mascot", sourceUrl: "https://en.wikipedia.org/wiki/Cesar_(dog_food)" },
  ],
  "whippet": [
    { name: "Ashley Whippet", type: "Real", knownFor: "Pioneering canine Frisbee performer", sourceUrl: "https://en.wikipedia.org/wiki/Ashley_Whippet" },
  ],
  "yorkshire-terrier": [
    { name: "Smoky", type: "Real", knownFor: "Second World War therapy and war dog", sourceUrl: "https://en.wikipedia.org/wiki/Smoky_(dog)" },
    { name: "Mr Famous", type: "Real", knownFor: "Audrey Hepburn's Yorkshire Terrier", sourceUrl: "https://en.wikipedia.org/wiki/Audrey_Hepburn" },
    { name: "Dante", type: "Live-action film", knownFor: "Show Dogs", sourceUrl: "https://en.wikipedia.org/wiki/Show_Dogs" },
  ],
};

export default famousDogs;
