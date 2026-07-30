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
};

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
  },
};

export function levelThemeFor(era?: string): LevelTheme | null {
  return (era && THEMES[era]) || null;
}
