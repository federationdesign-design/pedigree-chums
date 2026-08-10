// Build-time validation for the Dogs at Work slide record.
//
// This runs as a module side effect the first time the record is imported
// (see slides.ts). A budget breach, a missing pair, a missing image or a
// missing alt throws and fails `next build` with the offending slide and
// field named. A soft warning fires at 90% of budget so a wall is never hit
// without notice. The CSS line clamp in the page styles is the third net;
// this is the first.

import type { Slide } from "./types";
import { FAMILY_PILL_LABEL } from "./types";

// Character budgets, from brief v3.0 section 9. Set from the longest real
// launch string plus roughly fifteen per cent headroom.
export const BUDGETS = {
  family: 12, // "Emergency" is 9
  subLabel: 24, // "Bio-detection dogs" is 18
  headline: 55, // longest live headline is 47
  dek: 380, // longest live dek is 334
  ctaLabel: 24, // longest label "Bio-detection dogs" is 18
  // Section 9 gives 34, derived from "The payment; very different" (27). But
  // Appendix A panel 4's bold lead, "Working dogs do not know they have jobs",
  // is 39, so the section 9 figure was measured incompletely. The copy is
  // supplied and locked, so per section 9's own rule (longest real string plus
  // ~15% headroom) the budget is 39 + 15% -> 45. Reported as a discrepancy.
  panelSubheading: 45,
  panelBodyTotal: 1500, // longest panel body totals ~1,350
} as const;

const WARN_AT = 0.9;

// Total characters of prose and bullet text carried by a blue panel, across
// every section. Subheadings are budgeted separately.
function panelBodyLength(slide: Slide): number {
  let total = 0;
  for (const section of slide.panel.sections) {
    if (section.body) total += section.body.length;
    if (section.bullets) for (const b of section.bullets) total += b.length;
  }
  return total;
}

function check(
  errors: string[],
  slideId: string,
  field: string,
  value: string,
  budget: number,
): void {
  const len = value.length;
  if (len > budget) {
    errors.push(
      `[dogs-at-work] slide "${slideId}": ${field} is ${len} characters, over the ${budget} budget: ${JSON.stringify(value)}`,
    );
  } else if (len >= budget * WARN_AT) {
    // Non-fatal: surfaces in the build log before the wall is hit.
    console.warn(
      `[dogs-at-work] slide "${slideId}": ${field} is ${len}/${budget} characters (over ${Math.round(WARN_AT * 100)}%).`,
    );
  }
}

export function validateSlides(slides: Slide[]): void {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const seenOrders = new Set<number>();

  for (const slide of slides) {
    const id = slide.id || "(missing id)";

    if (!slide.id) errors.push(`[dogs-at-work] a slide is missing its id.`);
    if (seenIds.has(slide.id)) errors.push(`[dogs-at-work] duplicate slide id "${id}".`);
    seenIds.add(slide.id);

    if (typeof slide.order !== "number") {
      errors.push(`[dogs-at-work] slide "${id}": order must be a number.`);
    } else if (seenOrders.has(slide.order)) {
      errors.push(`[dogs-at-work] slide "${id}": duplicate order ${slide.order}.`);
    }
    seenOrders.add(slide.order);

    // Every article requires a matching blue panel. In this record the pair is
    // explicit (one object), so the failure mode is an empty panel.
    if (!slide.panel || slide.panel.sections.length === 0) {
      errors.push(`[dogs-at-work] slide "${id}": blue panel has no sections (missing pair).`);
    } else {
      const subheaded = slide.panel.sections.filter((s) => s.subheading).length;
      if (subheaded > 3) {
        errors.push(
          `[dogs-at-work] slide "${id}": blue panel has ${subheaded} subheaded sections, maximum is 3.`,
        );
      }
      for (const section of slide.panel.sections) {
        if (section.subheading) {
          check(errors, id, "panel subheading", section.subheading, BUDGETS.panelSubheading);
        }
        if (!section.body && !section.bullets) {
          errors.push(`[dogs-at-work] slide "${id}": a blue panel section has neither body nor bullets.`);
        }
      }
      const bodyLen = panelBodyLength(slide);
      if (bodyLen > BUDGETS.panelBodyTotal) {
        errors.push(
          `[dogs-at-work] slide "${id}": blue panel body totals ${bodyLen} characters, over the ${BUDGETS.panelBodyTotal} budget.`,
        );
      } else if (bodyLen >= BUDGETS.panelBodyTotal * WARN_AT) {
        console.warn(
          `[dogs-at-work] slide "${id}": blue panel body is ${bodyLen}/${BUDGETS.panelBodyTotal} characters (over 90%).`,
        );
      }

      // Panel thumbnails are optional (panel 1 only). A panel without them is
      // valid and must not fail. When present, each needs a src and alt.
      if (slide.panel.thumbnails) {
        slide.panel.thumbnails.forEach((t, i) => {
          if (!t.src) errors.push(`[dogs-at-work] slide "${id}": panel thumbnail ${i + 1} is missing its src.`);
          if (!t.alt) errors.push(`[dogs-at-work] slide "${id}": panel thumbnail ${i + 1} is missing its alt text.`);
        });
      }
    }

    const a = slide.article;
    if (!a) {
      errors.push(`[dogs-at-work] slide "${id}": article is missing.`);
      continue;
    }

    // Required article fields. A missing image or alt fails the build.
    if (!a.image) errors.push(`[dogs-at-work] slide "${id}": article image path is missing.`);
    if (!a.imageAlt) errors.push(`[dogs-at-work] slide "${id}": article image alt text is missing.`);
    if (!a.href) errors.push(`[dogs-at-work] slide "${id}": article href is missing.`);

    // The family budget governs the pill label ("Rural"), not the full family
    // name stored in the data ("Rural and Traditional").
    check(errors, id, "family pill", FAMILY_PILL_LABEL[a.family], BUDGETS.family);
    check(errors, id, "sub-label", a.subLabel, BUDGETS.subLabel);
    check(errors, id, "headline", a.headline, BUDGETS.headline);
    check(errors, id, "dek", a.dek, BUDGETS.dek);
    check(errors, id, "call to action label", a.ctaLabel, BUDGETS.ctaLabel);
  }

  if (errors.length > 0) {
    throw new Error(
      `Dogs at Work slide record failed validation:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }
}
