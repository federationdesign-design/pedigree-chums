// What's Your Superpower: configuration generator.
//
// Reads the question bank workbook (v4.3, MVP 10 / Scoring Map / Result Copy
// sheets carrying the section 8 state table, the sidekick reasons and name set
// final-1.0) and emits the versioned JSON configuration the game builds
// against. Content is never retyped in code: any wording change goes back to
// the workbook and reruns this generator.
//
// The generator fails the build rather than producing output when the workbook
// violates any structural rule (spec section 8, generator behaviour).
//
// Nothing here derives a length from a literal. The question count comes from
// the workbook (Q), the power count from the fixed power list (P), and every
// count that used to be a hard-coded 15 / 30 / 6 is derived from those two, so
// the same generator round-trips whatever size the question set becomes.
//
// Usage: node scripts/superpower-generate-config.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORKBOOK = join(
  ROOT,
  "superpower game",
  "whats_your_superpower_question_bank_v4_3.xlsx"
);
const OUT = join(ROOT, "app", "whats-your-superpower", "data", "config.mvp-4.3.json");

const POWERS = ["Focus", "Vision", "Zoom", "Ideas", "Energy"];
const P = POWERS.length;
const STATE_IDS = [
  "SINGLE_CLOSE",
  "SINGLE_CLEAR",
  "TIE_TWO",
  "TIE_THREE",
  "TIE_FOUR",
  "TIE_FIVE",
];
// The three deeper ties award a sidekick role instead of a power (spec s7).
const SIDEKICK_STATES = ["TIE_THREE", "TIE_FOUR", "TIE_FIVE"];

// The user-facing interpretations come from specification section 2 (they are
// not held in the workbook). The entry-screen title, promise and completion
// time come from section 3. Everything else below is read from the workbook.
const INTERPRETATIONS = {
  Focus: "Stays with the mission.",
  Vision: "Sees where the trail leads.",
  Zoom: "Finds the clue everyone else missed.",
  Ideas: "Creates a route nobody else considered.",
  Energy: "Gets the pack moving.",
};
const GAME_TITLE = "What's Your Superpower?";
const PROMISE =
  "Answer a collection of strange dog-themed questions and reveal your power mix.";
// PLACEHOLDER_COMPLETION_TIME: approximate completion time is a required
// entry-screen element (spec section 3) with no value specified anywhere. This
// is the best-effort stand-in, logged in PLACEHOLDERS.md for Steve to confirm.
const COMPLETION_TIME = "Takes about two minutes.";

function fail(msg) {
  console.error(`GENERATOR FAILURE: ${msg}`);
  process.exit(1);
}

const wb = XLSX.read(readFileSync(WORKBOOK), { type: "buffer" });
function rows(sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) fail(`missing sheet ${sheetName}`);
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
}

// ---------------------------------------------------------------- questions
const mvpRows = rows("MVP 10").filter((r) => /^M\d\d$/.test(String(r[0] ?? "")));
const mapRows = rows("Scoring Map").filter((r) => /^M\d\d$/.test(String(r[0] ?? "")));
const Q = mvpRows.length;
if (Q === 0) fail("no MVP questions found in the workbook");
if (mapRows.length !== 2 * Q)
  fail(`expected ${2 * Q} scoring rows for ${Q} questions, found ${mapRows.length}`);

const questions = [];
for (const r of mvpRows) {
  const [id, , copy] = r;
  const answers = {};
  for (const letter of ["A", "B"]) {
    const m = mapRows.find((x) => x[0] === id && x[1] === letter);
    if (!m) fail(`no scoring row for ${id}${letter}`);
    const [, , answerCopy, primary, pPts, secondary, sPts] = m;
    if (!POWERS.includes(primary) || !POWERS.includes(secondary))
      fail(`unknown power in ${id}${letter}`);
    if (pPts !== 2 || sPts !== 1) fail(`bad points in ${id}${letter}: ${pPts}/${sPts}`);
    answers[letter] = {
      copy: answerCopy,
      primary,
      primaryPoints: 2,
      secondary,
      secondaryPoints: 1,
    };
  }
  questions.push({ id, copy, answers });
}
questions.sort((a, b) => a.id.localeCompare(b.id));

// Cross-check the MVP sheet against the Scoring Map.
for (const r of mvpRows) {
  const [id, , , aCopy, aPrim, aSec, bCopy, bPrim, bSec] = r;
  const q = questions.find((x) => x.id === id);
  if (q.answers.A.copy !== aCopy || q.answers.B.copy !== bCopy)
    fail(`answer copy mismatch between sheets for ${id}`);
  if (q.answers.A.primary !== aPrim || q.answers.A.secondary !== aSec)
    fail(`answer A powers mismatch for ${id}`);
  if (q.answers.B.primary !== bPrim || q.answers.B.secondary !== bSec)
    fail(`answer B powers mismatch for ${id}`);
}

// Structural rules: four distinct powers per question, no power on both
// answers, and an equal number of primary and secondary opportunities per
// power. With 2*Q opportunities of each kind spread over P powers, a balanced
// set gives exactly 2*Q/P of each. Derived, never a literal.
if ((2 * Q) % P !== 0)
  fail(`${2 * Q} opportunities do not divide evenly across ${P} powers`);
const EXPECTED_OPPS = (2 * Q) / P;
const primCount = Object.fromEntries(POWERS.map((p) => [p, 0]));
const secCount = Object.fromEntries(POWERS.map((p) => [p, 0]));
for (const q of questions) {
  const four = [
    q.answers.A.primary,
    q.answers.A.secondary,
    q.answers.B.primary,
    q.answers.B.secondary,
  ];
  if (new Set(four).size !== 4) fail(`${q.id} does not use four distinct powers`);
  primCount[q.answers.A.primary] += 1;
  primCount[q.answers.B.primary] += 1;
  secCount[q.answers.A.secondary] += 1;
  secCount[q.answers.B.secondary] += 1;
}
for (const p of POWERS) {
  if (primCount[p] !== EXPECTED_OPPS)
    fail(`${p} has ${primCount[p]} primary opportunities, not ${EXPECTED_OPPS}`);
  if (secCount[p] !== EXPECTED_OPPS)
    fail(`${p} has ${secCount[p]} secondary opportunities, not ${EXPECTED_OPPS}`);
}

// Theoretical raw range per power, derived rather than hard-coded.
const rawMax = {};
for (const p of POWERS) {
  let max = 0;
  for (const q of questions) {
    const pts = (a) =>
      (a.primary === p ? a.primaryPoints : 0) + (a.secondary === p ? a.secondaryPoints : 0);
    max += Math.max(pts(q.answers.A), pts(q.answers.B));
  }
  rawMax[p] = max;
}
const maxes = new Set(Object.values(rawMax));
if (maxes.size !== 1) fail(`raw maxima differ across powers: ${JSON.stringify(rawMax)}`);
const RAW_MAX = [...maxes][0];

// ------------------------------------------------------------- result copy
const rc = rows("Result Copy");
function block(headerCell, count) {
  const i = rc.findIndex((r) => r[0] === headerCell);
  if (i < 0) fail(`Result Copy block header ${headerCell} not found`);
  return rc.slice(i + 1, i + 1 + count);
}
// Two blocks both open with "State ID" (the state table and the sidekick
// reasons). Disambiguate the sidekick block by its second header cell.
function blockAfter(matcher, count) {
  const i = rc.findIndex(matcher);
  if (i < 0) fail("expected block header not found");
  return rc.slice(i + 1, i + 1 + count);
}

// The state table has no predicate column: state selection is the engine's
// logic, not a workbook predicate, so predicate is emitted empty.
const stateRows = block("State ID", STATE_IDS.length);
const resultStates = {};
for (const [stateId, summary, titleSource, supportingRule] of stateRows) {
  if (!STATE_IDS.includes(stateId)) fail(`unknown state id ${stateId}`);
  if (resultStates[stateId]) fail(`more than one active row for ${stateId}`);
  resultStates[stateId] = { predicate: "", titleSource, summary, supportingRule };
}
for (const id of STATE_IDS) {
  if (!resultStates[id]) fail(`state ${id} has no active row`);
}
// Required and forbidden placeholders per state. The sidekick states carry
// fixed copy with no power placeholders; a supporting placeholder is forbidden.
const needs = {
  SINGLE_CLOSE: ["[MAIN]", "[SUPPORTING]"],
  SINGLE_CLEAR: ["[MAIN]", "[SUPPORTING]"],
  TIE_TWO: ["[POWER_1]", "[POWER_2]", "[SUPPORTING]"],
  TIE_THREE: [],
  TIE_FOUR: [],
  TIE_FIVE: [],
};
for (const id of STATE_IDS) {
  for (const ph of needs[id]) {
    if (!resultStates[id].summary.includes(ph))
      fail(`state ${id} summary is missing required placeholder ${ph}`);
  }
  if (SIDEKICK_STATES.includes(id)) {
    if (resultStates[id].summary.includes("[SUPPORTING]"))
      fail(`forbidden supporting placeholder in ${id}`);
  }
}

const powerRows = block("Power", P);
const powerMeta = {};
for (const [power, mainTitle, relativeDescription, packContribution] of powerRows) {
  if (!POWERS.includes(power)) fail(`unknown power ${power} in main power copy`);
  powerMeta[power] = {
    mainTitle,
    relativeDescription,
    packContribution,
    interpretation: INTERPRETATIONS[power],
  };
}
if (Object.keys(powerMeta).length !== P) fail("main power copy incomplete");

// P*(P-1) ordered pairs, P*(P-1)/2 unordered pairs: fixed by the power set.
const DIRECTIONAL_COUNT = P * (P - 1);
const JOINT_COUNT = (P * (P - 1)) / 2;

const comboRows = block("Leading power", DIRECTIONAL_COUNT);
const directionalTitles = {};
for (const [lead, sup, title, line] of comboRows) {
  if (!POWERS.includes(lead) || !POWERS.includes(sup))
    fail(`bad directional pair ${lead}>${sup}`);
  const key = `${lead}>${sup}`;
  if (directionalTitles[key]) fail(`duplicate directional title ${key}`);
  if (!title || !line) fail(`missing directional title or line for ${key}`);
  directionalTitles[key] = { title, line };
}
if (Object.keys(directionalTitles).length !== DIRECTIONAL_COUNT)
  fail(`expected ${DIRECTIONAL_COUNT} directional titles`);

const jointRows = block("Power one", JOINT_COUNT);
const jointTitles = {};
for (const [p1, p2, title, line] of jointRows) {
  if (!POWERS.includes(p1) || !POWERS.includes(p2)) fail(`bad joint pair ${p1}+${p2}`);
  // Keyed in fixed power order, never alphabetically: engine.ts looks the key
  // up with leadingPowers.join("+"), which is fixed power order (CLAUDE.md).
  const key = [p1, p2]
    .sort((a, b) => POWERS.indexOf(a) - POWERS.indexOf(b))
    .join("+");
  if (jointTitles[key]) fail(`duplicate joint title ${key}`);
  if (!title || !line) fail(`missing joint title or line for ${key}`);
  jointTitles[key] = { title, line };
}
if (Object.keys(jointTitles).length !== JOINT_COUNT)
  fail(`expected ${JOINT_COUNT} joint titles`);

// Every referenced title must exist: single-leader states reference the
// directional set (all ordered pairs), TIE_TWO the joint set (all unordered
// pairs), and the deeper ties a sidekick role.
for (const a of POWERS)
  for (const b of POWERS)
    if (a !== b && !directionalTitles[`${a}>${b}`])
      fail(`missing directional title for ${a}>${b}`);

// Sidekick reasons: one row per sidekick state, a role title, then three
// reasons held as reason 1 in one cell and reasons 2 and 3 pipe-joined in the
// next. Rendered as three bullets for TIE_THREE, TIE_FOUR and TIE_FIVE.
const sidekickRows = blockAfter(
  (r) => r[0] === "State ID" && r[1] === "Role title",
  SIDEKICK_STATES.length
);
const sidekickRoles = {};
for (const [stateId, title, reason1, reasonRest] of sidekickRows) {
  if (!SIDEKICK_STATES.includes(stateId)) fail(`unknown sidekick state ${stateId}`);
  if (sidekickRoles[stateId]) fail(`more than one sidekick row for ${stateId}`);
  if (!title) fail(`missing sidekick role title for ${stateId}`);
  const reasons = [reason1, ...String(reasonRest ?? "").split(" | ")].map((s) =>
    String(s).trim()
  );
  if (reasons.length !== 3 || reasons.some((s) => !s))
    fail(`sidekick ${stateId} must have exactly three non-empty reasons`);
  sidekickRoles[stateId] = { title, reasons };
}
for (const id of SIDEKICK_STATES) {
  if (!sidekickRoles[id]) fail(`sidekick state ${id} has no reasons row`);
  // The role title and the state's titleSource are the same string, authored
  // in two places; a mismatch means the workbook drifted.
  if (sidekickRoles[id].title !== resultStates[id].titleSource)
    fail(`sidekick title for ${id} disagrees with its state titleSource`);
}

const standingRows = block("Element", 3);
const standing = Object.fromEntries(standingRows.map((r) => [r[0], r[1]]));
for (const k of ["Relative explanation", "Boundary line", "Replay line"]) {
  if (!standing[k]) fail(`missing standing copy: ${k}`);
}

// No main-power title may ever occupy the main title slot: enforce by checking
// the sets are disjoint (spec section 7 / test T34).
const mainTitles = new Set(POWERS.map((p) => powerMeta[p].mainTitle));
for (const { title } of [
  ...Object.values(directionalTitles),
  ...Object.values(jointTitles),
]) {
  if (mainTitles.has(title)) fail(`main-power title ${title} appears in a main title set`);
}

const config = {
  configVersion: "MVP-4.3",
  schemaVersion: "result-contract-2.0",
  nameSet: "final-1.0",
  sidekickSet: "1.0",
  powers: POWERS,
  powerMeta,
  questions,
  plot: { rawMin: 0, rawMax: RAW_MAX, displayMin: 1, displayMax: 5 },
  closeGapMax: 3,
  resultStates,
  directionalTitles,
  jointTitles,
  sidekickRoles,
  copy: {
    relativeExplanation: standing["Relative explanation"],
    boundary: standing["Boundary line"],
    replay: standing["Replay line"],
    gameTitle: GAME_TITLE,
    promise: PROMISE,
    completionTime: COMPLETION_TIME,
  },
};

mkdirSync(dirname(OUT), { recursive: true });
// No trailing newline: the committed config carries none, and this generator
// must reproduce it byte for byte.
writeFileSync(OUT, JSON.stringify(config, null, 2));
console.log(`wrote ${OUT}`);
console.log(
  `questions=${Q} directional=${Object.keys(directionalTitles).length} joint=${Object.keys(jointTitles).length} sidekick=${Object.keys(sidekickRoles).length} oppsPerPower=${EXPECTED_OPPS} rawMax=${RAW_MAX}`
);
