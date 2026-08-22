"use client";

// ============================================================================
// REMOVE BEFORE COMMIT -- throwaway preview route for Job B.
// Renders ChumKnockout with a sample reveal so the tb_ elimination and the rail
// end-screen can be eyeballed on a real device. NOT part of the feature.
// Deployed to main deliberately for iPhone preview; DELETE app/knockout-preview/
// in the stage 5 cleanup. (Job B preview, 22 Aug 2026.)
// ============================================================================

import ChumKnockout from "../chum-calculator/ChumKnockout";
import { scoreBreed } from "../chum-calculator/ChumCalculator";
import { breeds } from "../../data/breeds";

// A representative core-answer set, just to produce a realistic 8-dog reveal.
const SAMPLE_ANSWERS: Record<string, string> = {
  size: "medium", living: "town_garden", children: "older", other_pets: "none",
  alone: "sometimes", exercise: "medium", experience: "some", grooming: "medium",
  budget: "medium", velcro: "medium", vocal: "low", mobility: "full", coat: "some",
};

export default function KnockoutPreview() {
  const reveal = breeds
    .filter((b) => !b.draft)
    .map((b) => ({ slug: b.slug, name: b.name, image: b.image, score: scoreBreed(b.slug, SAMPLE_ANSWERS) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return (
    <main style={{ padding: 24 }}>
      <p style={{ fontFamily: "var(--font-body), sans-serif", color: "var(--navy, #0a3a57)", fontWeight: 700, textAlign: "center", margin: "0 0 16px" }}>
        PREVIEW ONLY -- throwaway route, remove before commit
      </p>
      <ChumKnockout
        breeds={reveal}
        answers={SAMPLE_ANSWERS}
        onRestart={() => { if (typeof window !== "undefined") window.location.reload(); }}
      />
    </main>
  );
}
