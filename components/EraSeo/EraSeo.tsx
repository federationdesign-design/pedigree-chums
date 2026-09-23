import type { Fact } from "../AncientFacts/AncientFacts";

/* STRUCTURED DATA for an era page, 23 September 2026 (owner: SEO work).

   Three schemas, all from content already on the page, none of it invented:
     Article        so the page can be dated and attributed. Google favours
                    history content it can date, and nothing here carried a date.
     BreadcrumbList so results show Home > Britain's dog history > the era rather
                    than a bare URL.
     FAQPage        built from the page's own "Did you know?" boxes. This is the
                    schema that earns the expandable result, and the boxes are
                    already written as a question-and-answer pair: a heading and
                    the paragraphs under it.

   JSON-LD is rendered as one script tag. No client JavaScript. */

type Props = {
  url: string;
  headline: string;
  description: string;
  eraTitle: string;
  published?: string;
  modified?: string;
  facts?: Fact[];
  image?: string;
};

const SITE = "https://www.pedigreechums.co.uk";

export default function EraSeo({ url, headline, description, eraTitle, published, modified, facts, image }: Props) {
  const full = `${SITE}${url}`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      "@id": `${full}#article`,
      headline,
      description,
      mainEntityOfPage: full,
      inLanguage: "en-GB",
      isPartOf: { "@type": "WebSite", name: "Pedigree Chums", url: SITE },
      publisher: { "@type": "Organization", name: "Pedigree Chums", url: SITE },
      ...(published ? { datePublished: published } : {}),
      ...(modified ? { dateModified: modified } : {}),
      ...(image ? { image: `${SITE}${image}` } : {}),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Britain's dog history", item: `${SITE}/britains-dog-history` },
        { "@type": "ListItem", position: 3, name: eraTitle, item: full },
      ],
    },
  ];

  if (facts && facts.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: facts.map((f) => ({
        "@type": "Question",
        name: f.heading,
        acceptedAnswer: { "@type": "Answer", text: f.paras.join(" ") },
      })),
    });
  }

  return (
    <script
      type="application/ld+json"
      // The payload is our own content, serialised by JSON.stringify.
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
