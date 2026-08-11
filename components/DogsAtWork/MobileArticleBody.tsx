import * as React from "react";

// Shared mobile interleave for the Dogs at Work article pages. On mobile the
// sidebar cards move into the body, each rendered directly above the H2 it is
// paired with; cards with pairWith "tail" stack after the last section. Desktop
// is unaffected: it renders the same cards, from the same list, in the sticky
// sidebar. The pairing is explicit by heading id, never inferred from array
// order, so inserting a card or a heading cannot silently reshuffle the rest
// (the same rule as the blue-panel/article pairing on the index).

export type BodyBlock = string | { h: string; id: string };

export interface ArticleCard {
  id: string;
  // A heading id from the body, or "tail" for the end bucket.
  pairWith: string;
  node: React.ReactNode;
}

export default function MobileArticleBody({
  body,
  cards,
  bodyClassName,
  subheadClassName,
  slotClassName,
}: {
  body: BodyBlock[];
  cards: ArticleCard[];
  bodyClassName: string;
  subheadClassName: string;
  slotClassName: string;
}) {
  const slot = (c: ArticleCard) => (
    <div key={c.id} className={slotClassName}>
      {c.node}
    </div>
  );
  const tail = cards.filter((c) => c.pairWith === "tail");
  return (
    <div className={bodyClassName}>
      {body.map((b, i) => {
        if (typeof b === "string") return <p key={`p${i}`}>{b}</p>;
        const paired = cards.filter((c) => c.pairWith === b.id);
        return (
          <React.Fragment key={`h${i}`}>
            {paired.map(slot)}
            <h2 id={b.id} className={subheadClassName}>{b.h}</h2>
          </React.Fragment>
        );
      })}
      {tail.map(slot)}
    </div>
  );
}
