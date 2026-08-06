// What's Your Superpower: result-contract verification harness.
//
// Enumerates all 32,768 answer arrays through the production engine and
// configuration, emits one canonical semantic record per array (schema
// result-contract-2.0), and checks:
//
//   1. the SHA-256 of the canonical blob matches the approved value in
//      whats_your_superpower_golden_hash_v4_2.txt
//   2. the six result-state counts match the locked fire rates (spec s15)
//   3. every rendered title | summary pair matches the approved golden
//      results file exactly (72 distinct strings)
//   4. structural criteria: every array totals 45 raw points, raw scores
//      stay within 0..18, exactly one title from the correct set (T34),
//      chart emphasis sets agree with the text sets (T36), and the three
//      sidekick states award no power and emphasise nothing (T39)
//
// Usage: npx tsx scripts/superpower-verify-contract.mts

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  POWERS,
  resolveResult,
  type AnswerLetter,
  type GameConfig,
  type StateId,
} from "../app/whats-your-superpower/lib/engine";
import rawConfig from "../app/whats-your-superpower/data/config.mvp-4.2.json";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = rawConfig as unknown as GameConfig;

const EXPECTED_HASH =
  "ce3437e9f3e326b90e8f67cd9ab93e81064c752cb82de956dddf91fc95da8a5b";
const EXPECTED_COUNTS: Record<StateId, number> = {
  SINGLE_CLOSE: 22064,
  SINGLE_CLEAR: 3901,
  TIE_TWO: 5959,
  TIE_THREE: 785,
  TIE_FOUR: 39,
  TIE_FIVE: 20,
};
// Three states award a power, three award a sidekick role (spec section 7).
const SIDEKICK_STATES = new Set<StateId>(["TIE_THREE", "TIE_FOUR", "TIE_FIVE"]);
const N = 2 ** config.questions.length;

let failures = 0;
function check(ok: boolean, label: string): void {
  if (!ok) {
    failures += 1;
    console.error(`FAIL ${label}`);
  }
}

const stateCounts = new Map<string, number>();
const rendered = new Map<string, number>();
const records: string[] = [];
const directionalSet = new Set(
  Object.values(config.directionalTitles).map((t) => t.title)
);
const jointSet = new Set(Object.values(config.jointTitles).map((t) => t.title));
const sidekickSet = new Set(
  Object.values(config.sidekickRoles).map((r) => r.title)
);
const mainPowerTitles = new Set(POWERS.map((p) => config.powerMeta[p].mainTitle));

for (let i = 0; i < N; i += 1) {
  const pattern = i.toString(2).padStart(15, "0");
  const answers = [...pattern].map((b) => (b === "0" ? "A" : "B")) as AnswerLetter[];
  const r = resolveResult(answers, config);
  const answerPattern = answers.join("");

  // Descriptive block keys per layout (spec section 10). Part of the canonical
  // record, so a layout change moves the hash.
  const blocks =
    r.layout === "single"
      ? [
          "combination_line",
          "summary",
          `main_block:${r.leadingPowers[0]}`,
          `supporting_block:${r.supportingPower}`,
          "relative_explanation",
          "boundary",
          "restart",
        ]
      : r.layout === "pair"
        ? [
            "joint_line",
            "summary",
            ...r.leadingPowers.map((p) => `leader_block:${p}`),
            `supporting_block:${r.supportingPower}`,
            "relative_explanation",
            "boundary",
            "restart",
          ]
        : [
            "summary",
            "reason_1",
            "reason_2",
            "reason_3",
            "relative_explanation",
            "boundary",
            "restart",
          ];

  // Canonical record: fields in sorted key order, compact separators, so the
  // byte stream matches the reference harness exactly.
  records.push(
    JSON.stringify({
      answerPattern,
      awardsPower: r.awardsPower,
      chartPrimaryEmphasisSet: r.chartPrimaryEmphasisSet,
      chartSecondaryEmphasisSet: r.chartSecondaryEmphasisSet,
      descriptiveBlockKeys: blocks,
      leadingPowers: r.leadingPowers,
      stateId: r.stateId,
      summaryKey: r.stateId,
      supportingPower: r.supportingPower,
      titleKey: r.titleKey,
    })
  );

  stateCounts.set(r.stateId, (stateCounts.get(r.stateId) ?? 0) + 1);
  const key = `${r.title} | ${r.summary}`;
  rendered.set(key, (rendered.get(key) ?? 0) + 1);

  // Structural criteria, checked on every array.
  const total = POWERS.reduce((s, p) => s + r.raw[p], 0);
  if (total !== 45) check(false, `${answerPattern} total ${total}`);
  for (const p of POWERS) {
    if (r.raw[p] < config.plot.rawMin || r.raw[p] > config.plot.rawMax)
      check(false, `${answerPattern} ${p} out of range: ${r.raw[p]}`);
  }
  // T34: exactly one title from the correct set; main-power titles never in
  // the main slot.
  if (mainPowerTitles.has(r.title)) check(false, `${answerPattern} main-power title in slot`);
  const expectedSet =
    r.layout === "single"
      ? directionalSet
      : r.layout === "pair"
        ? jointSet
        : sidekickSet;
  if (!expectedSet.has(r.title))
    check(false, `${answerPattern} title from wrong set: ${r.title}`);
  if (r.layout === "sidekick" && r.title !== config.sidekickRoles[r.stateId as "TIE_THREE" | "TIE_FOUR" | "TIE_FIVE"].title)
    check(false, `${answerPattern} sidekick role title wrong`);

  // T39: the three sidekick states award no power, emphasise nothing, carry
  // exactly three reasons and never expose a supporting power.
  const isSidekick = SIDEKICK_STATES.has(r.stateId);
  if (isSidekick !== (r.layout === "sidekick"))
    check(false, `${answerPattern} layout disagrees with state`);
  if (r.awardsPower === isSidekick)
    check(false, `${answerPattern} awardsPower wrong for ${r.stateId}`);
  if (isSidekick) {
    if (r.reasons.length !== 3) check(false, `${answerPattern} expected 3 reasons`);
    if (r.supportingPower !== null)
      check(false, `${answerPattern} sidekick exposes a supporting power`);
    if (r.chartPrimaryEmphasisSet.length !== 0 || r.chartSecondaryEmphasisSet.length !== 0)
      check(false, `${answerPattern} sidekick emphasis not empty`);
    if (r.line !== null) check(false, `${answerPattern} sidekick has a title line`);
  } else {
    if (r.reasons.length !== 0) check(false, `${answerPattern} award result has reasons`);
  }

  // T36: for results that award a power, chart emphasis sets equal the text
  // sets. For sidekick results both are empty, covered above.
  if (!isSidekick) {
    if (r.chartPrimaryEmphasisSet.join() !== r.leadingPowers.join())
      check(false, `${answerPattern} primary emphasis mismatch`);
    const expectedSecondary = r.supportingPower === null ? "" : r.supportingPower;
    if (r.chartSecondaryEmphasisSet.join() !== expectedSecondary)
      check(false, `${answerPattern} secondary emphasis mismatch`);
  }
}

// 1: canonical hash.
const header = `config=${config.configVersion};schema=${config.schemaVersion};arrays=${N};nameset=${config.nameSet};sidekick=${config.sidekickSet}`;
const blob = `${header}\n${records.join("\n")}\n`;
const digest = createHash("sha256").update(blob, "utf8").digest("hex");
check(digest === EXPECTED_HASH, `canonical hash\n  expected ${EXPECTED_HASH}\n  actual   ${digest}`);

// 2: locked state counts.
for (const [state, expected] of Object.entries(EXPECTED_COUNTS)) {
  const actual = stateCounts.get(state) ?? 0;
  check(actual === expected, `state count ${state}: expected ${expected}, got ${actual}`);
}
check(
  [...stateCounts.values()].reduce((a, b) => a + b, 0) === N,
  "state counts total 32768"
);

// 3: rendered output matches the approved golden results file.
const goldenPath = join(
  ROOT,
  "superpower game",
  "whats_your_superpower_golden_results_v4_2.csv"
);
const golden = new Map<string, number>();
for (const lineText of readFileSync(goldenPath, "utf8").trim().split("\n").slice(1)) {
  const m = lineText.match(/^(\d+),([\d.]+),"(.*)","(.*)"$/);
  if (!m) {
    check(false, `unparseable golden row: ${lineText}`);
    continue;
  }
  golden.set(`${m[3]} | ${m[4]}`, Number(m[1]));
}
check(golden.size === rendered.size, `distinct results: golden ${golden.size}, engine ${rendered.size}`);
for (const [key, count] of golden) {
  if ((rendered.get(key) ?? 0) !== count)
    check(false, `golden mismatch (${rendered.get(key) ?? 0} vs ${count}): ${key}`);
}
for (const key of rendered.keys()) {
  if (!golden.has(key)) check(false, `engine produced unapproved result: ${key}`);
}

console.log(`header:  ${header}`);
console.log(`SHA-256: ${digest}`);
for (const [state, expected] of Object.entries(EXPECTED_COUNTS)) {
  const actual = stateCounts.get(state) ?? 0;
  console.log(
    `  ${state.padEnd(13)} ${String(actual).padStart(6)}  ${((100 * actual) / N).toFixed(3)}%  ${
      actual === expected ? "ok" : "MISMATCH"
    }`
  );
}
const awarded = [...stateCounts.entries()]
  .filter(([s]) => !SIDEKICK_STATES.has(s as StateId))
  .reduce((a, [, n]) => a + n, 0);
console.log(
  `power awarded ${awarded} (${((100 * awarded) / N).toFixed(3)}%)  sidekick ${N - awarded} (${(
    (100 * (N - awarded)) /
    N
  ).toFixed(3)}%)`
);
console.log(`distinct rendered results: ${rendered.size}`);
if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nall result-contract checks passed");
