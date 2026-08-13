"use client";
import { useState } from "react";
import styles from "./proto.module.css";

/*
 * THROWAWAY prototype piece (preorder branch only). A single-column copy of the
 * FAQ ladder from components/FAQ. The shared FAQ hard-codes a two-column grid
 * with its own section heading, so it cannot render as one column inside the
 * right-hand column here; per the brief this is an inline copy, not an extract.
 * The FAQS content is copied verbatim from components/FAQ (editorial copy, em
 * dashes and curly quotes left as published).
 */

type QA = { q: string; a: React.ReactNode };

const FAQS: QA[] = [
  {
    q: "What is Pedigree Chums?",
    a: "Pedigree Chums is a dog-spotting card game — The Dog Bingo Game. The pack has 54 illustrated breed cards, each packed with traits, stats and tell-tale features. You take your chums out into the real world, spot actual dogs, and match them to the cards in your hand. Spot a dog, call it out, claim your chum.",
  },
  {
    q: "How can I buy a pack of Pedigree Chums?",
    a: "Right now you can pre-order online. Hit any “Pre-order” button on the site, pop in your email, and you’ll be first in line when the packs ship — plus you’ll get a discount code to use on launch day.",
  },
  {
    q: "Is Pedigree Chums food?",
    a: "No — despite the name (a cheeky nod to a certain dog-food brand), Pedigree Chums is a card game, not dinner. The only thing your dog gets out of it is the joy of being spotted. Please don’t feed the cards to anyone.",
  },
  {
    q: "How do you play Pedigree Chums?",
    a: "Deal 3–6 chum cards to each player, then head outside. When you spot a real dog that matches one of your cards, call it out and claim the chum. Keep spotting to collect more, and whoever matches the most chums wins. It’s made for walks, car journeys and days at the park — anywhere dogs happen.",
  },
  {
    q: "I have young children — what age range is this game for?",
    a: "It’s designed for ages 7 and up, and plays best with 2 or more people. Younger children can absolutely join in with a grown-up — matching cartoon dogs to real ones is exactly the kind of thing they love.",
  },
  {
    q: "Is it like Top Trumps, where the cards’ facts compete against each other?",
    a: "Sort of! The heart of the game is spotting and matching real dogs, but every card carries real stats and traits — so you can absolutely play a Top Trumps-style round, comparing size, build or temperament to see whose chum comes out on top.",
  },
  {
    q: "Are there any other game modes to keep it fresh?",
    a: (
      <>
        Plenty. There’s <strong>Hot Dogs</strong> — a memory twist where everyone shows their
        hand for a few seconds after the draw, then hides it again. If you remember which dog
        another player is holding and you spot that breed in real life first, you steal their
        chum. You can also play bingo-style (first to complete a row of chums), Top Trumps-style
        stat battles, or make up your own house rules. There’s a whole page on{" "}
        <a href="/hot-dogs" className={styles.faqLink}>Hot Dogs here</a>.
      </>
    ),
  },
  {
    q: "What’s the advice when approaching a dog for the first time?",
    a: "Always ask the owner’s permission first. Let the dog come to you rather than reaching over it — crouch side-on, stay calm, and offer a relaxed hand to sniff before any fuss. Watch the dog’s body language, keep it gentle, and never disturb a working, assistance or service dog. If the dog isn’t interested, that’s okay — give it space.",
  },
  {
    q: "How much does the game cost, and when will it be released?",
    a: "The retail price is £9.99, but right now we’re running a pre-launch discount that brings it down to £6.99 — with free UK mainland delivery included. You can only get the £6.99 price if you pre-order before the game is released; once it’s out, it’s full price. We’re launching very soon — pre-order now to lock in the discount, and we’ll email you a code to use on launch day along with the release date the moment it’s confirmed.",
  },
  {
    q: "Is there any postage cost applied?",
    a: "Free UK mainland delivery is included on pre-orders — no extra postage to pay.",
  },
];

export default function ProtoFaqLadder() {
  const [open, setOpen] = useState<number[]>([]);
  const toggle = (i: number) =>
    setOpen((prev) => (prev.includes(i) ? prev.filter((n) => n !== i) : [...prev, i]));

  return (
    <ul className={styles.faqList}>
      {FAQS.map((item, i) => {
        const isOpen = open.includes(i);
        return (
          <li key={i} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ""}`}>
            <button
              type="button"
              className={styles.faqQuestion}
              aria-expanded={isOpen}
              aria-controls={`proto-faq-panel-${i}`}
              id={`proto-faq-btn-${i}`}
              onClick={() => toggle(i)}
            >
              <span className={styles.faqQText}>{item.q}</span>
              <span className={styles.faqIcon} aria-hidden>
                <span className={styles.faqBar} />
                <span className={`${styles.faqBar} ${styles.faqBarV}`} />
              </span>
            </button>
            <div
              className={styles.faqPanel}
              id={`proto-faq-panel-${i}`}
              role="region"
              aria-labelledby={`proto-faq-btn-${i}`}
            >
              <div className={styles.faqPanelInner}>
                <p className={styles.faqAnswer}>{item.a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
