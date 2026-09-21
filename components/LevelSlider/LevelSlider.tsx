import BreedStrip from "../../app/britains-dog-history/BreedStrip";
import { levelsWithin } from "../../data/levels";
import styles from "./LevelSlider.module.css";

/* THE LEVELS THAT MADE THIS DOG, at the foot of a chum page, 20 September 2026.

   IT IS THE ERA PAGE'S OWN STRIP (owner: it should look like the slider on the dog
   history page, same corner elements, and flip round). BreedStrip is rendered with
   a fixed list instead of an era, so the cards, the corners, the flip and the
   sideways scroll are the era page's exactly, not a lookalike to keep in step.

   A tap goes to the level's own page; see BreedStrip's `only`.

   NOTHING AT ALL for a chum with no British ancestry recorded, rather than an empty
   strip. 13 of the 54 are like that.

   `mobile` only adds room at the foot, because the phone page pins its icon rail
   over the bottom of the screen and the strip would sit under it. */
export default function LevelSlider({ chum, mobile = false }: { chum: string; mobile?: boolean }) {
  const levels = levelsWithin(chum);
  if (!levels.length) return null;
  const era = levels[0].strip;
  return (
    <section className={`${styles.wrap} ${mobile ? styles.mobile : ""}`.trim()} aria-label={`The dogs that made the ${chum}`}>
      <BreedStrip era={era} only={levels} label={`The dogs that made the ${chum}`} />
    </section>
  );
}
