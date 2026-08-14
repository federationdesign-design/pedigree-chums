// Shared score-milestone constants. Both the main pit (PackPit) and the mini pit
// (LineageModal) celebrate every 5,000 points with the same escalating labels, so
// these live here rather than in either pit, to stop the two drifting apart.
// Extracted from PackPit on 14 August 2026.
export const MS_STEP = 5000;
export const MS_LABELS = ["Yapp Yapp Yapp", "Bark Bark Bark", "Woof Woof Woof", "Yapp Bark Woof", "Hoooowwwwllllllll", "Are you done?", "maybe enter the site now?"];

// The label for a reached milestone: the labels escalate, then hold on the last
// line for every milestone past the seventh. Shared so both pits index identically.
export function milestoneLabel(reached: number): string {
  return MS_LABELS[Math.min(reached / MS_STEP - 1, MS_LABELS.length - 1)];
}
