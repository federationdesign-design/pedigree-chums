import BreedStrip from "../../app/britains-dog-history/BreedStrip";
import { levelsWithin } from "../../data/levels";
import { ukBreeds, type UKBreed } from "../../data/uk-breeds";
import { breeds } from "../../data/breeds";
import styles from "./LevelSlider.module.css";

/* THE LEVELS THAT MADE THIS DOG, at the foot of a chum page, 20 September 2026.

   IT IS THE ERA PAGE'S OWN STRIP (owner: it should look like the slider on the dog
   history page, same corner elements, and flip round). BreedStrip is rendered with
   a fixed list instead of an era, so the cards, the corners, the flip and the
   sideways scroll are the era page's exactly, not a lookalike to keep in step.

   OLDEST ERA FIRST, then THE CHUM ITSELF LAST (owner: a final playable level for
   the dog the page is about). Its ancestors lead to it, so it closes the row.
   Every ancestor card goes to its level page; the chum's own card opens the game
   here, because a chum has no level page. See BreedStrip's playName.

   EVERY CHUM PAGE GETS A STRIP NOW. Before this, 13 chums with no British ancestry
   recorded showed nothing; they now show a single card, their own, which plays.

   THE CHUM'S CARD comes from the strip data when the chum has an entry there, 31
   of the 54 do, so it looks like its neighbours: the archive painting, the era,
   the status. The other 23 have no entry, so their card is built from the chum
   record instead, with the card art and "Today" as its era.

   `mobile` only adds room at the foot, because the phone page pins its icon rail
   over the bottom of the screen and the strip would sit under it. */
function selfCard(chum: string): UKBreed {
  const uk = ukBreeds.find((u) => u.name === chum);
  if (uk) return uk;
  const pack = breeds.find((b) => b.name === chum);
  return {
    name: chum,
    strip: "c1900",
    era: "Today",
    anchor: 9999,
    note: pack?.character ?? "",
    image: pack?.image,
  };
}

export default function LevelSlider({ chum, mobile = false }: { chum: string; mobile?: boolean }) {
  const self = selfCard(chum);
  const levels = [...levelsWithin(chum).filter((b) => b.name !== chum), self];
  const era = levels[0].strip;
  return (
    <section className={`${styles.wrap} ${mobile ? styles.mobile : ""}`.trim()} aria-label={`The dogs that went into making the ${chum}`}>
      <BreedStrip
        era={era}
        only={levels}
        label="Learn more about the dogs that went into making the"
        labelName={chum}
        playName={chum}
      />
    </section>
  );
}
