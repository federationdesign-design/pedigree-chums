// Shared score-milestone data. The celebration component (MilestoneMessage) is one
// shared, pit-agnostic piece; only the thresholds and copy differ between the pits,
// so each pit imports its own MilestoneScale and they cannot drift the treatment.
// Split into per-pit configs on 14 August 2026 (was one MS_STEP/MS_LABELS pair).
export type MilestoneScale = { step: number; labels: string[] };

// The label for a reached milestone: the labels escalate, then hold on the last for
// every milestone past the last named one. One implementation, shared by both pits.
export function milestoneLabel(scale: MilestoneScale, reached: number): string {
  return scale.labels[Math.min(reached / scale.step - 1, scale.labels.length - 1)];
}

// Main pit: every 5,000, the original labels. Unchanged.
export const MAIN_PIT_MILESTONES: MilestoneScale = {
  step: 5000,
  labels: ["Yapp Yapp Yapp", "Bark Bark Bark", "Woof Woof Woof", "Yapp Bark Woof", "Hoooowwwwllllllll", "Are you done?", "maybe enter the site now?"],
};

// Mini pit: every 50,000, an order of magnitude over the main pit. The pit scores
// each % circle's figure on EVERY collision (throttled 220ms per circle, not once
// per circle), so a busy level runs to the hundreds of thousands and into the
// millions; 5,000 would fire hundreds of times. Two labels diverge from the main
// pit set: "Mad score" and "Crazy points".
export const MINI_PIT_MILESTONES: MilestoneScale = {
  step: 50000,
  labels: ["Yapp Yapp Yapp", "Bark Bark Bark", "Woof Woof Woof", "Yapp Bark Woof", "Hoooowwwwllllllll", "Mad score", "Crazy points"],
};
