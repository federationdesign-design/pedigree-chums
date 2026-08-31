// Themed mini pit backgrounds, one per era strip on the dog history page.
//
// A level swaps the pit's flat blue gradient for a full-bleed picture and a
// ground strip along the bottom. The picture is decoration. The ground strip is
// real: the pit's physics floor is rebuilt from its drawn surface, so circles
// come to rest on the earth you can see rather than on a hidden straight line.
//
// Adding a level:
//   1. drop the artwork and the ground strip into public/levels/
//   2. add an entry here, keyed by the era string BreedStrip already passes
//   3. re-sample the ground strip's surface (see floorProfile below)
// Eras with no entry keep the plain blue gradient, so this can be rolled out
// one era at a time without touching anything else.

export type LevelTheme = {
  // Full-bleed artwork, as SVG. It is loaded through an <img>, never inlined:
  // that keeps the file's own blend modes sealed inside the image, where they
  // cannot reach the pit's SVG and disturb its paint order.
  // Scaled to the stage height and centred, so the crop comes off the left and
  // right and the middle of the picture is what you see.
  bg: string;
  // Flat colours behind the artwork, top to bottom, for the strip of stage the
  // cropped picture cannot reach on a very tall screen.
  sky: [string, string];
  // The ground strip, drawn at full stage width along the bottom edge.
  floor: string;
  // The ground strip's own width divided by its height. The on-screen band
  // height is derived from this and the stage width, so art and physics scale
  // together and cannot drift apart.
  floorAspect: number;
  // The drawn surface, sampled left to right as a fraction of the strip's own
  // height, where 0 is the top edge of the file. The physics floor is built as
  // a run of stepped slabs following these numbers, which is how the main pit
  // does its uneven floor (see commit 770173e: a fromVertices floor came out
  // jagged and was replaced with stepped rectangles).
  floorProfile: number[];
  // The LEARN wash, the tilted slab that slides across the start screen. It is
  // mix-blend-mode: overlay, so it tints the backdrop rather than painting over
  // it. Optional: an era without one keeps the stylesheet's pink.
  wash?: string;
  /* The props slot: the objects that drop in together part way through, in
     place of the pit's stick, big stick and rock. Any length. The first two
     arrive together and the rest follow one after another, so the original
     rhythm holds however many there are.
     Omit it and the era keeps the default three.
     Typed loosely on purpose: the kinds themselves are the pit's business, and
     naming them here would make this data file depend on the component. */
  props?: string[];
  /* Props for ONE level, keyed by the dog's name, overriding the era's set
     above. Some levels want fewer objects on the floor than their era does.
     Most specific wins: this, then the era's props, then the pit's default
     three. A name with no entry simply takes the era's set. */
  propsByLevel?: Record<string, string[]>;
};

/* The ancient-era pit artwork, shared three ways since the strip split:
   the live page's "ancient" and "medieval" strips and the slider's combined
   "ancient-medieval" run all use it, so no level's look changed with the
   split. Medieval gets its own artwork whenever one lands: give the key its
   own entry and delete the alias below. */
const THEMES: Record<string, LevelTheme> = {
  "ancient-medieval": {
    bg: "/levels/ancient-bg.svg",
    sky: ["#20033b", "#255075"],
    floor: "/levels/ancient-floor.svg",
    floorAspect: 567.5 / 57.6,
    // measured from the artwork: 0.0696 at the far left, dipping to 0.1043,
    // then climbing steadily to 0.0000 at the right hand edge
    floorProfile: [
      0.0696, 0.1043, 0.0957, 0.0957, 0.087, 0.087, 0.0783, 0.0783,
      0.0696, 0.0696, 0.0609, 0.0609, 0.0522, 0.0522, 0.0435, 0.0435,
      0.0348, 0.0261, 0.0261, 0.0174, 0.0174, 0.0087, 0.0087, 0.0,
    ],
  },
  // Tudor times. The wall is a JPEG and the ground a PNG, which is fine: both
  // are loaded through an <img> exactly as the ancient SVGs are, and a painted
  // texture is smaller and truer as a raster than as traced vectors.
  c1500: {
    bg: "/levels/tudor-bg.jpg",
    // Sampled from the top and bottom 24 rows of the artwork, so the band the
    // crop cannot reach meets the picture without a seam.
    sky: ["#3e200d", "#58391e"],
    floor: "/levels/tudor-floor.png",
    floorAspect: 1600 / 223,
    // This strip's top edge is dead flat. Measured at 24 points across the
    // artwork and every one reads zero, so the physics floor is a straight
    // line. Nothing is wrong: there is simply no relief in this ground to
    // follow, unlike the ancient one.
    floorProfile: [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    wash: "#fdf251",
    // Tudor swaps the woodland props for household ones.
    props: ["newspaper", "fork", "shoe"],
    /* Three levels in the middle of the Tudor run keep the fork alone. The
       newspaper and the shoe are the two big ones, and on these the floor was
       too crowded to play on. Turnspit Dog and Bearded Collie, either side of
       them, keep all three. */
    propsByLevel: {
      "English Foxhound": ["fork"],
      Otterhound: ["fork"],
      Staghound: ["fork"],
    },
  },
};
THEMES["ancient"] = THEMES["ancient-medieval"];
THEMES["medieval"] = THEMES["ancient-medieval"];

// REVERTED TO STANDARD (owner request): ancient, medieval and Tudor drop back to
// the plain body gradient and the flat pit-bottom floor, the same as every other
// level, art AND physics together. The floor reserve and the stepped physics floor
// both hang off a non-null theme, so returning null reverts the lot (background,
// floor height and props). Every THEMES entry and every asset below is kept intact
// on disk: flip THEMES_ENABLED back to true to bring the themes back.
const THEMES_ENABLED = false;
export function levelThemeFor(era?: string): LevelTheme | null {
  if (!THEMES_ENABLED) return null;
  return (era && THEMES[era]) || null;
}

/* PROPS ARE NOT THEME ART, AND THIS IS THE SPLIT (31 August 2026, owner
   request). THEMES_ENABLED reverted the backgrounds, the sky gradients and the
   stepped physics floors, and because the props hung off the same theme object
   they were reverted too. That was never the intention: the art came off, the
   toys were supposed to stay available.

   So props get their own lookup and their own flag. propsFor does NOT call
   levelThemeFor and does NOT read THEMES_ENABLED, which means a level can have
   its own set of things to knock about while its pit keeps the plain gradient
   and the flat floor like every other level.

   Do NOT re-route this through levelThemeFor to save a few lines. The whole
   point is that the two can be switched independently.

   Returns null when there is nothing specific to say, and the pit falls back to
   its own DEFAULT_PROPS. Ordering is most specific first: the named level, then
   the era, then nothing. */
const PROPS_ENABLED = true;
export function propsFor(era?: string, levelName?: string): string[] | null {
  if (!PROPS_ENABLED) return null;
  const theme = (era && THEMES[era]) || null;
  if (!theme) return null;
  const byLevel = levelName ? theme.propsByLevel?.[levelName] : undefined;
  if (byLevel?.length) return byLevel;
  if (theme.props?.length) return theme.props;
  return null;
}
