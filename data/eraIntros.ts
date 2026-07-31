/* THE ERA INTRO COPY: the title, one word per line, and the line under it.

   IT LIVES HERE BECAUSE TWO THINGS NEED IT. The history slider draws it at the
   head of each vertical run, and the pit draws the same words on the screen it
   shows when a round crosses from one era into the next, so a player carrying
   on inside the pit sees what a reader on the page would have seen. Neither can
   own the copy, because the pit is shared by both history pages.

   Keyed by era, the same key `strip` uses in uk-breeds.ts. An era with no entry
   simply gets no intro, which is the switch to use if one is ever pulled. */

export type EraIntro = { words: string[]; note: string };

export const ERA_INTRO: Record<string, EraIntro> = {
  "ancient-medieval": {
    /* Back to the original three lines. The arrow is the word "to". */
    words: ["Ancient\u2192", "Medieval", "Dogs"],
    note: "At the start of time we did not have writing, so we can only really tell what has happened after we started writing stuff down",
  },
  c1500: {
    words: ["Tudor", "Times", "Dogs"],
    note: "The Tudors kept dogs for work and for show, and started writing down which was which",
  },
  c1700: {
    words: ["The", "1700s", "Dogs"],
    note: "Farms, hunts and city streets each wanted a different dog, so Britain started building them",
  },
  early1800: {
    words: ["The Early", "1800s", "Dogs"],
    note: "Britain was changing fast, and the dogs changed with it",
  },
  spaniels: {
    words: ["The Spaniel", "Explosion"],
    note: "One kind of dog split into many, and the spaniel family got very big very quickly",
  },
  mid1800: {
    words: ["The", "Mid-1800s", "Dogs"],
    note: "Dog shows arrived, and how a dog looked started to matter as much as what it did",
  },
  late1800: {
    words: ["The Late", "1800s", "Dogs"],
    note: "The Kennel Club began writing the rules, and breeds became official",
  },
  c1900: {
    words: ["The", "1900s", "Dogs"],
    note: "Dogs moved off the farm and into the front room",
  },
  crosses: {
    words: ["Today's", "Crossbreeds"],
    note: "Two breeds, one dog, and a lot of arguments about what to call it",
  },
};
