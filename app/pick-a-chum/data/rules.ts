// Pick a Chum: game rules content record.
//
// There is no dedicated rules / how-to-play route on the site and none is
// planned (confirmed by Steve). Instead the rules live here as a content record
// the dogs answer with directly. This is the canonical source for the workbook's
// {{approved_rule_summary}}, {{deal_answer}} and {{win_condition}} placeholders
// and for destination DST011 (Full game rules), which is answered in-chat rather
// than by opening a page.
//
// Wording is drawn from the approved live-site FAQ ("How do you play"). The six
// stages were confirmed by Steve and mirror the step tree in data/lineage.ts.

export interface RuleStage {
  order: number;
  label: string;
  detail: string;
}

export interface GameRules {
  summary: string;
  stages: RuleStage[];
  dealAnswer: string;
  winCondition: string;
  playerCount: string;
  ageGuidance: string;
}

export const RULES: GameRules = {
  summary:
    'Pedigree Chums is a dog-spotting card game. Deal a few chum cards to each player, head outside, and match the cards to real dogs you spot. Whoever matches the most chums wins.',
  stages: [
    { order: 1, label: 'Deal the cards', detail: 'Deal 3 to 6 chum cards to each player.' },
    { order: 2, label: 'Head outside', detail: 'Take the game out on a walk, a car journey or a day at the park, anywhere dogs happen.' },
    { order: 3, label: 'Spot real dogs', detail: 'Watch for real dogs out in the world.' },
    { order: 4, label: 'Match your chum', detail: 'When a real dog matches one of your cards, call it out and claim the chum.' },
    { order: 5, label: 'Find more chums', detail: 'Keep spotting to collect more chums.' },
    { order: 6, label: 'Most chums win', detail: 'Whoever has matched the most chums wins.' },
  ],
  dealAnswer: 'Deal 3 to 6 chum cards to each player.',
  winCondition: 'Whoever matches the most chums wins.',
  playerCount: 'Plays best with 2 or more people.',
  ageGuidance: 'Designed for ages 7 and up; younger children can join in with a grown-up.',
};
