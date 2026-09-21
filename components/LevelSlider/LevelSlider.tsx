import BreedStrip from "../../app/britains-dog-history/BreedStrip";
import { ancestorCardsWithin, foreignCardsWithin, stripCardFor } from "../../data/levels";
import styles from "./LevelSlider.module.css";

/* THE LEVELS THAT MADE THIS DOG, at the foot of a chum page, 20 September 2026.

   IT IS THE ERA PAGE'S OWN STRIP (owner: it should look like the slider on the dog
   history page, same corner elements, and flip round). BreedStrip is rendered with
   a fixed list instead of an era, so the cards, the corners, the flip and the
   sideways scroll are the era page's exactly, not a lookalike to keep in step.

   OLDEST ERA FIRST, then THE CHUM ITSELF LAST (owner: a final playable level for
   the dog the page is about). Its ancestors lead to it, so it closes the row.
   Every card, the ancestors and the chum itself, opens its level HERE, through
   the time tunnel from the card, exactly as the era page does (owner, 20
   September 2026). The chum's own card needs playName because it is a chum, a
   "learn" card that would otherwise send the visitor to the page they are on.

   EVERY CHUM PAGE GETS A STRIP NOW. Before this, 13 chums with no British ancestry
   recorded showed nothing; they now show a single card, their own, which plays.

   THE CHUM'S CARD comes from the strip data when the chum has an entry there, 31
   of the 54 do, so it looks like its neighbours: the archive painting, the era,
   the status. The other 23 have no entry, so their card is built from the chum
   record instead, with the card art and "Today" as its era.

   `mobile` only adds room at the foot, because the phone page pins its icon rail
   over the bottom of the screen and the strip would sit under it. */
export default function LevelSlider({ chum, mobile = false }: { chum: string; mobile?: boolean }) {
  /* Foreign progenitors first, deepest first, then the levels and chum ancestors in
     era order, then the page's own dog last. See foreignCardsWithin. */
  const self = stripCardFor(chum);
  const levels = [...foreignCardsWithin(chum), ...ancestorCardsWithin(chum), self];
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
