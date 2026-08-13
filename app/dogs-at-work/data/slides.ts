// The single source of truth for the Dogs at Work page. One entry per slide,
// each pairing one blue panel with one article. To add articles five through
// twelve, append entries here; every article needs its own paired panel.
//
// Blue panel copy is transcribed verbatim from brief v3.0 Appendix A, which is
// the cleaned source of truth. Em dashes were converted to hyphens (Steve, 13 Aug
// 2026), superseding the earlier "may retain" note (CLAUDE.md Dogs at Work
// amendment 2). Article card strings are migrated from
// the former inline ARTICLES array in page.tsx, with the section 11 changes:
// article 3 retitled and re-sub-labelled, article 4 added.
//
// Importing this module runs build-time validation as a side effect.

import type { Slide } from "./types";
import { validateSlides } from "./validate";

// Panel split (Steve, 12 Aug 2026): the deck now carries eight blue panels, not
// six. This is a reorganisation of the existing Appendix A copy, not new bodies:
// every heading, body and emphasis marker below is unchanged. The two panels that
// each carried two headings are split one heading per slide, which is where the
// two extra slides come from:
//   - "Why dogs love doing" and "Why we love dogs doing" (was one slide) split.
//   - "What we owe dogs" and "What dogs often get" (was one slide) split.
// The six real articles stay in editorial order across the first six slides; the
// last two slides (7 and 8) reuse articles 1 and 2, as agreed, so every panel has
// a paired article. Do not merge these back into six: the split is deliberate.

// Hero swap (Steve, 11 Aug 2026): the scent-carousel lab scene that was on
// article 2 moves to article 3, where it shows the bio-detection subject; and
// article3_hero.jpg (the black Labrador in a harness) moves to article 2. The
// files keep their original names; only which article uses each has changed.
// Alt text below is agent-suggested from the images, pending Steve's confirmation.

// Article 5 (search and rescue): blue panel 5, the index card dek and the hero
// alt text were all supplied by Steve (11 Aug 2026) and are inlined on the slide
// below. The hero image (/search_rescue_dogs.jpg) and the article route were
// already real. No placeholders remain on this slide.

// Article 6 (guide dogs): blue panel 6, the index card dek, the hero image
// (/guide_dog_image.jpg) and the hero alt were all supplied by Steve (11 to 12
// Aug 2026) and are inlined below. No placeholders remain on this slide.

// Articles 1 and 2, reused by slides 7 and 8 (see the panel-split note above).
// Declared once and referenced twice so the reuse is literal, not a re-typed copy
// that could drift.
const ARTICLE_BIO_DETECTION: Slide["article"] = {
  family: "Medical",
  subLabel: "Bio-detection dogs",
  headline: "The Dogs Teaching Medicine How to Smell Disease",
  dek: `In 2025, two dogs called Bumper and Peanut sniffed out Parkinson's disease in a double-blind trial with up to 98% specificity. They are not replacing doctors. They may be doing something stranger: proving disease has a smell, so the machines of the future know what to look for. The dog doesn't become the machine. The dog invents it.`,
  image: "/Bumper-and-peatnut.jpg",
  imageAlt: "Bumper and Peanut, the golden retriever and black Labrador from the bio-detection study",
  ctaLabel: "Bumper and Peanut",
  href: "/dogs-at-work/the-dogs-teaching-medicine-how-to-smell-disease",
};

const ARTICLE_MEDICAL_ALERT: Slide["article"] = {
  family: "Medical",
  subLabel: "Medical alert dogs",
  headline: "The Colleague Who Never Clocks Off",
  dek: `A medical alert dog learns one person so completely it can warn them their own body is about to go wrong - often before they know themselves. That's not a pet. That's a colleague. Even if the only wages are dinner and the occasional stolen sausage.`,
  image: "/article3_hero.jpg",
  imageAlt: "A black Labrador in a white assistance-dog harness standing beside its seated owner indoors",
  ctaLabel: "Bramble",
  href: "/dogs-at-work/the-colleague-who-never-clocks-off",
};

export const SLIDES: Slide[] = [
  {
    id: "bio-detection",
    order: 1,
    published: "live",
    panel: {
      // Panel 1 only: each section carries a thumbnail beside its heading. The
      // three images are wired (Steve supplied dog_working_img1..3.jpg); alt text
      // is still owed, so a clearly named placeholder alt is used and logged in
      // PLACEHOLDERS.md and docs/dogs-at-work/NEEDS_STEVE.md. Image order mirrors
      // the concept: the dog's game, then the human's job, then the payment.
      sections: [
        {
          subheading: "To the dog; *it's a game.*",
          body: `Working dogs do not know they have jobs. To a sheepdog, moving livestock is instinct, training and the best game in the world. To a detection dog, finding the scent is a puzzle with a reward at the end. To a medical alert dog, noticing that their human smells wrong is not a shift pattern. It is just what they do.`,
          thumbnail: { src: "/dog_working_img1.jpg", alt: "a working sheepdog moving sheep across a field" },
        },
        {
          subheading: "*To humans,* it's a job.",
          body: `It only becomes work when humans benefit from it. This series looks at the dogs that help Britain function - the noses at the border, the paws on the hills, the search dogs in the woods, the assistance dogs beside their people, and the bio-detection dogs helping scientists ask whether disease has a smell.`,
          thumbnail: { src: "/dog_working_img2.jpg", alt: "a shepherd watching over a flock" },
        },
        {
          subheading: "The payment; *very different*",
          body: `They are paid in food, shelter, praise, tennis balls, head strokes and the occasional stolen sausage. But their value is measured in time, safety, independence, science and trust. This is about that hidden workforce, and the question behind every wagging tail: if dogs give us this much, what do we owe them back?`,
          thumbnail: { src: "/dog_working_img3.jpg", alt: "banknotes and coins" },
        },
      ],
    },
    article: ARTICLE_BIO_DETECTION,
  },
  {
    id: "medical-alert",
    order: 2,
    published: "live",
    panel: {
      sections: [
        {
          subheading: "Why *dogs love* doing",
          body: `**Dogs seem happiest when they have something to do.**

For thousands of years they have been selected to chase, retrieve, guard, herd, track, dig, carry and solve problems alongside people, so many of those behaviours are deeply rewarding in their own right. A Labrador fetching a ball, a Collie rounding up the family, or a Terrier digging furiously under a hedge may look like play to us, but to the dog they are using the same instincts, senses and problem-solving skills their ancestors relied on for real jobs.

"Work" does not need to mean employment: anything that gives a dog a purpose, a challenge and the chance to use the abilities it was built for can provide the satisfaction of a job well done.`,
        },
      ],
    },
    article: ARTICLE_MEDICAL_ALERT,
  },
  {
    id: "electronic-nose",
    order: 3,
    published: "live",
    panel: {
      sections: [
        {
          subheading: "Why *we* love dogs *doing*",
          body: `**For thousands of years, their enthusiasm has made our lives easier.**

They herd animals we could never control alone, find people we cannot see, retrieve things we cannot reach, guard homes and livestock, guide people through the world and use extraordinary noses to detect drugs, explosives, disease and even signs of some cancers. What looks like a dog happily following its instincts can save humans hours of work, enormous effort and sometimes lives.

Perhaps that is the remarkable bargain at the heart of our relationship with dogs: the jobs we desperately need doing are often the very things they absolutely love to do.`,
        },
      ],
    },
    article: {
      family: "Medical",
      subLabel: "Bio-detection dogs",
      headline: "The Machine That May Owe Dogs a Biscuit",
      dek: `In Milton Keynes, scientists are building an electronic nose to sniff out prostate cancer - trained on data the dogs gathered first. The dog wrote the manual for its own replacement, and it could not care less. It just wants its biscuit. This is the last piece of the medical trilogy.`,
      image: "/never-clocking-off.jpg",
      imageAlt: "A detection dog sniffing a stainless-steel scent-sample carousel in a research laboratory as staff observe",
      ctaLabel: "Bio-detection dogs",
      // Slug unchanged: the retitle does not move the route.
      href: "/dogs-at-work/the-electronic-nose",
    },
  },
  {
    id: "sheepdogs",
    order: 4,
    published: "live",
    panel: {
      sections: [
        {
          subheading: "What we *owe dogs*",
          body: `Far more than affection. For centuries they have guarded our homes, protected livestock, carried messages, found the lost, hunted food, controlled vermin, pulled loads, guided people, served in war and rescue, and taken on countless jobs simply because working beside us became part of their lives.

What we owe them is responsible care, patience, safety, companionship and the chance to use the instincts and abilities we deliberately bred into them.

After everything dogs have done for us, the least we can do is make sure their lives are not only useful to humans, but good for them too.`,
        },
      ],
    },
    article: {
      family: "Rural and Traditional",
      subLabel: "Sheepdogs",
      headline: "The Farm Worker With Four Legs",
      dek: `To the shepherd it is labour saved. To the dog it is the best game ever invented: find the sheep, get behind them, bring them home. Nobody has told it otherwise.`,
      image: "/sheepdogs_job.jpg",
      imageAlt: "a black and white Border Collie sitting in long grass in a field",
      ctaLabel: "Sheepdogs",
      // Route is built at checkpoint 7; the link resolves once that lands.
      href: "/dogs-at-work/the-farm-worker-with-four-legs",
    },
  },
  {
    id: "search-rescue",
    order: 5,
    // Fully resolved (Steve, 11 Aug): blue panel 5, the card dek and the hero alt
    // are supplied and inlined. The hero image is real; the article route is built.
    published: "live",
    panel: {
      sections: [
        {
          subheading: "What dogs *often get*",
          body: `They get food, shelter, protection, veterinary care, companionship and a place inside our families. Many live warm, comfortable lives filled with walks, play, affection and jobs chosen for enjoyment rather than survival.

But dogs have not always received a fair return and that is still the case in modern times for some dogs. The same animals bred to work beside us can be neglected, abandoned or treated as just tools, or status symbols and disposable possessions.

Some spend their lives bored and under-stimulated, while others are pushed into jobs or environments that damage their welfare.`,
        },
      ],
    },
    article: {
      family: "Emergency",
      subLabel: "Search and rescue dogs",
      headline: "The Dog That Finds You When Nobody Else Can",
      dek: `Air scent, trailing, water. A dog covers ground people cannot, in the dark, in the rain, for a toy and a bit of praise.`,
      image: "/search_rescue_dogs.jpg",
      imageAlt: "a search and rescue dog working across open moorland",
      ctaLabel: "Search and rescue dogs",
      href: "/dogs-at-work/the-dog-that-finds-you-when-nobody-else-can",
    },
  },
  {
    id: "guide-dogs",
    order: 6,
    // Live (Steve, 11 Aug): blue panel 6 and the card dek are supplied and inlined.
    // The hero image is supplied too (Steve, 12 Aug). One placeholder remains: the
    // hero alt, outstanding until Steve sends it.
    published: "live",
    panel: {
      // This panel is the only one that uses a bullet list, so the component
      // supports both prose and bulleted content. It is indented a further 20px
      // (deck.module.css .blueIndent); WorkDeck keys that on the panel carrying
      // bullets, not on a slide order, so this styling follows the copy if the
      // deck is reordered again.
      sections: [
        {
          subheading: "Working dogs *do not* *know* they have jobs",
          bullets: [
            "**To a sheepdog**, moving livestock is instinct, training and the best game in the world.",
            "**To a detection dog**, finding the scent is a puzzle and an instinct with a reward at the end.",
            "**To a medical alert dog**, noticing that their human smells wrong is not a shift pattern.",
          ],
        },
        {
          body: `Results in:`,
          bullets: [
            "Search dogs in the woods finding lost people",
            "The bio-detection dogs helping identify disease by smell",
          ],
        },
        // DELIBERATE, do not "fix": the concept renders these two closing lines
        // ("It is just what they do." and "It only becomes work...") one size
        // larger than the surrounding body. That size step was declined (Steve,
        // option 1) to keep exactly two inline markers. Size is NOT an axis the
        // markers carry: *text* is emphasis (the --emphasis yellow) and **text**
        // is bold, neither changes size. Do not add a third marker or a
        // per-section size field to reproduce the step-up.
        {
          body: `It is just what they do. *It only becomes work when humans benefit from it.*`,
        },
        {
          body: `*They are paid in food, shelter, praise, tennis balls, head strokes and the occasional stolen sausage. But their value is measured in time, safety, independence, science and trust.*`,
        },
      ],
    },
    article: {
      family: "People",
      subLabel: "Guide dogs",
      headline: "The Dog That Gives You Your World Back",
      dek: `A guide dog does not give somebody their sight back. It gives them the confidence to go, and that turns out to be almost as valuable.`,
      // Hero and alt supplied by Steve (12 Aug 2026).
      image: "/guide_dog_image.jpg",
      imageAlt: "a man with a white cane sitting on a park bench beside a black Labrador in a yellow guide-dog harness",
      ctaLabel: "Guide dogs",
      href: "/dogs-at-work/the-dog-that-gives-you-your-world-back",
    },
  },
  {
    // Slide 7: the "Some jobs cannot be done by people alone" panel, paired with a
    // reuse of article 1 (see the panel-split note at the top).
    id: "some-jobs-people-alone",
    order: 7,
    published: "live",
    panel: {
      sections: [
        {
          subheading: "Some jobs cannot be done by *people alone*",
          body: `There are things a human search team simply cannot do. See through vegetation. Cover a hillside in the dark. Read the air.

A dog does not replace the people. It gives them information they could not otherwise reach, and it works for a toy and a bit of praise.

That is the pattern across every job in this series: not a dog doing a human's work, but a dog doing something we cannot.`,
        },
      ],
    },
    article: ARTICLE_BIO_DETECTION,
  },
  {
    // Slide 8: the "What we get back is bigger than the task" panel, paired with a
    // reuse of article 2 (see the panel-split note at the top).
    id: "bigger-than-the-task",
    order: 8,
    published: "live",
    panel: {
      sections: [
        {
          subheading: "What we get back is *bigger than the task*",
          body: `The job description is always small. Find the scent. Move the sheep. Get to the kerb safely.

What comes back is rarely small. Earlier diagnosis. A working farm. A career, a bus journey, an ordinary life somebody had started avoiding.

The dog does the task. The value shows up somewhere else entirely.`,
        },
      ],
    },
    article: ARTICLE_MEDICAL_ALERT,
  },
];

validateSlides(SLIDES);
