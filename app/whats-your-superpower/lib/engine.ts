// What's Your Superpower: result-contract engine (schema result-contract-1.0).
//
// Pure, deterministic functions over the stored answer array. No content
// lives here: every title, line and summary template comes from the generated
// configuration. Scores are always derived from the answer array; nothing is
// ever incremented by a click.

export const POWERS = ["Focus", "Vision", "Zoom", "Ideas", "Energy"] as const;
export type Power = (typeof POWERS)[number];
export type AnswerLetter = "A" | "B";
export type StateId =
  | "SINGLE_CLOSE"
  | "SINGLE_CLEAR"
  | "TIE_TWO"
  | "TIE_THREE"
  | "TIE_FOUR"
  | "TIE_FIVE";

export interface AnswerOption {
  copy: string;
  primary: Power;
  primaryPoints: number;
  secondary: Power;
  secondaryPoints: number;
}

export interface Question {
  id: string;
  copy: string;
  answers: { A: AnswerOption; B: AnswerOption };
}

export interface PowerMeta {
  mainTitle: string;
  relativeDescription: string;
  packContribution: string;
  interpretation: string;
}

export interface GameConfig {
  configVersion: string;
  schemaVersion: string;
  nameSet: string;
  powers: readonly Power[];
  powerMeta: Record<Power, PowerMeta>;
  questions: Question[];
  plot: { rawMin: number; rawMax: number; displayMin: number; displayMax: number };
  closeGapMax: number;
  resultStates: Record<
    StateId,
    { predicate: string; titleSource: string; summary: string; supportingRule: string }
  >;
  directionalTitles: Record<string, { title: string; line: string }>;
  jointTitles: Record<string, { title: string; line: string }>;
  powerPackTitle: string;
  copy: {
    gameTitle: string;
    promise: string;
    completionTime: string;
    relativeExplanation: string;
    boundary: string;
    replay: string;
  };
}

export type ResultLayout = "single" | "pair" | "pack";

export interface ResolvedResult {
  stateId: StateId;
  layout: ResultLayout;
  leadingPowers: Power[];
  supportingPower: Power | null;
  titleKey: string;
  title: string;
  line: string | null;
  summary: string;
  raw: Record<Power, number>;
  plot: Record<Power, number>;
  chartPrimaryEmphasisSet: Power[];
  chartSecondaryEmphasisSet: Power[];
}

export function scoreAnswers(
  answers: readonly AnswerLetter[],
  config: GameConfig
): { raw: Record<Power, number>; primarySelections: Record<Power, number> } {
  const raw = Object.fromEntries(POWERS.map((p) => [p, 0])) as Record<Power, number>;
  const primarySelections = Object.fromEntries(POWERS.map((p) => [p, 0])) as Record<
    Power,
    number
  >;
  config.questions.forEach((q, i) => {
    const a = q.answers[answers[i]];
    raw[a.primary] += a.primaryPoints;
    raw[a.secondary] += a.secondaryPoints;
    primarySelections[a.primary] += 1;
  });
  return { raw, primarySelections };
}

// Deterministic supporting-power tie-break: greater raw score is already
// applied by the caller; among candidates, the greater number of primary
// selections wins, then fixed power order.
function pickSupporting(
  candidates: Power[],
  primarySelections: Record<Power, number>
): Power {
  if (candidates.length === 1) return candidates[0];
  const best = Math.max(...candidates.map((p) => primarySelections[p]));
  const filtered = candidates.filter((p) => primarySelections[p] === best);
  return [...filtered].sort((a, b) => POWERS.indexOf(a) - POWERS.indexOf(b))[0];
}

function substitute(
  template: string,
  leading: Power[],
  supporting: Power | null
): string {
  let out = template;
  if (supporting !== null) out = out.replaceAll("[SUPPORTING]", supporting);
  out = out.replaceAll("[MAIN]", leading[0]);
  leading.forEach((p, i) => {
    out = out.replaceAll(`[POWER_${i + 1}]`, p);
  });
  return out;
}

export function resolveResult(
  answers: readonly AnswerLetter[],
  config: GameConfig
): ResolvedResult {
  if (answers.length !== config.questions.length) {
    throw new Error(
      `expected ${config.questions.length} answers, got ${answers.length}`
    );
  }
  const { raw, primarySelections } = scoreAnswers(answers, config);

  // Raw scores, never plot values, determine rank.
  const top = Math.max(...POWERS.map((p) => raw[p]));
  const leadingPowers = POWERS.filter((p) => raw[p] === top);
  const n = leadingPowers.length;

  let supportingPower: Power | null = null;
  let gap = 0;
  if (n <= 2) {
    const rest = POWERS.filter((p) => !leadingPowers.includes(p));
    const second = Math.max(...rest.map((p) => raw[p]));
    supportingPower = pickSupporting(
      rest.filter((p) => raw[p] === second),
      primarySelections
    );
    gap = top - second;
  }

  let stateId: StateId;
  let layout: ResultLayout;
  let titleKey: string;
  let title: string;
  let line: string | null;
  if (n === 1) {
    stateId = gap <= config.closeGapMax ? "SINGLE_CLOSE" : "SINGLE_CLEAR";
    layout = "single";
    titleKey = `COMBO:${leadingPowers[0]}>${supportingPower}`;
    const t = config.directionalTitles[`${leadingPowers[0]}>${supportingPower}`];
    title = t.title;
    line = t.line;
  } else if (n === 2) {
    stateId = "TIE_TWO";
    layout = "pair";
    titleKey = `LEVEL:${[...leadingPowers].sort().join("+")}`;
    const t = config.jointTitles[leadingPowers.join("+")];
    title = t.title;
    line = t.line;
  } else {
    stateId = n === 3 ? "TIE_THREE" : n === 4 ? "TIE_FOUR" : "TIE_FIVE";
    layout = "pack";
    titleKey = "GENERIC:power_pack";
    title = config.powerPackTitle;
    line = null;
  }

  const summary = substitute(
    config.resultStates[stateId].summary,
    leadingPowers,
    supportingPower
  );

  // Internal plotting conversion only; never shown and never used for rank.
  const { rawMin, rawMax, displayMin, displayMax } = config.plot;
  const plot = Object.fromEntries(
    POWERS.map((p) => [
      p,
      displayMin + ((displayMax - displayMin) * (raw[p] - rawMin)) / (rawMax - rawMin),
    ])
  ) as Record<Power, number>;

  return {
    stateId,
    layout,
    leadingPowers,
    supportingPower,
    titleKey,
    title,
    line,
    summary,
    raw,
    plot,
    chartPrimaryEmphasisSet: leadingPowers,
    chartSecondaryEmphasisSet: supportingPower !== null ? [supportingPower] : [],
  };
}
