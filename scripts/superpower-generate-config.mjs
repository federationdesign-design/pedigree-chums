// What's Your Superpower: configuration generator.
//
// Reads the corrected question bank workbook (v4.1, Result Copy sheet already
// carrying the section 8 state table and name set final-1.0) and emits the
// versioned JSON configuration the game builds against. Content is never
// retyped in code: any wording change goes back to the workbook and reruns
// this generator.
//
// The generator fails the build rather than producing output when the
// workbook violates any structural rule (spec section 8, generator behaviour).
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
  "whats_your_superpower_question_bank_v4_1.xlsx"
);
const OUT = join(ROOT, "app", "whats-your-superpower", "data", "config.mvp-4.1.json");

const POWERS = ["Focus", "Vision", "Zoom", "Ideas", "Energy"];
const STATE_IDS = [
  "SINGLE_CLOSE",
  "SINGLE_CLEAR",
  "TIE_TWO",
  "TIE_THREE",
  "TIE_FOUR",
  "TIE_FIVE",
];

// The user-facing interpretations come from specification section 2 (they are
// not held in the workbook). Everything else below is read from the workbook.
const INTERPRETATIONS = {
  Focus: "Stays with the mission.",
  Vision: "Sees where the trail leads.",
  Zoom: "Finds the clue everyone else missed.",
  Ideas: "Creates a route nobody else considered.",
  Energy: "Gets the pack moving.",
};

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
const mvpRows = rows("MVP 15").filter((r) => /^M\d\d$/.test(String(r[0] ?? "")));
const mapRows = rows("Scoring Map").filter((r) => /^M\d\d$/.test(String(r[0] ?? "")));
if (mvpRows.length !== 15) fail(`expected 15 MVP questions, found ${mvpRows.length}`);
if (mapRows.length !== 30) fail(`expected 30 scoring rows, found ${mapRows.length}`);

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

// Cross-check the MVP 15 sheet against the Scoring Map.
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
// answers, six primary and six secondary opportunities per power.
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
  if (primCount[p] !== 6) fail(`${p} has ${primCount[p]} primary opportunities, not 6`);
  if (secCount[p] !== 6) fail(`${p} has ${secCount[p]} secondary opportunities, not 6`);
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

const stateRows = block("State ID", 6);
const resultStates = {};
for (const [stateId, predicate, titleSource, summary, supportingRule] of stateRows) {
  if (!STATE_IDS.includes(stateId)) fail(`unknown state id ${stateId}`);
  if (resultStates[stateId]) fail(`more than one active row for ${stateId}`);
  resultStates[stateId] = { predicate, titleSource, summary, supportingRule };
}
for (const id of STATE_IDS) {
  if (!resultStates[id]) fail(`state ${id} has no active row`);
}
// Required and forbidden placeholders per state.
const needs = {
  SINGLE_CLOSE: ["[MAIN]", "[SUPPORTING]"],
  SINGLE_CLEAR: ["[MAIN]", "[SUPPORTING]"],
  TIE_TWO: ["[POWER_1]", "[POWER_2]", "[SUPPORTING]"],
  TIE_THREE: ["[POWER_1]", "[POWER_2]", "[POWER_3]"],
  TIE_FOUR: ["[POWER_1]", "[POWER_2]", "[POWER_3]", "[POWER_4]"],
  TIE_FIVE: [],
};
for (const id of STATE_IDS) {
  for (const ph of needs[id]) {
    if (!resultStates[id].summary.includes(ph))
      fail(`state ${id} summary is missing required placeholder ${ph}`);
  }
  if (["TIE_THREE", "TIE_FOUR", "TIE_FIVE"].includes(id)) {
    if (resultStates[id].summary.includes("[SUPPORTING]"))
      fail(`forbidden supporting placeholder in ${id}`);
  }
}

const powerRows = block("Power", 5);
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
if (Object.keys(powerMeta).length !== 5) fail("main power copy incomplete");

const comboRows = block("Leading power", 20);
const directionalTitles = {};
for (const [lead, sup, title, line] of comboRows) {
  if (!POWERS.includes(lead) || !POWERS.includes(sup))
    fail(`bad directional pair ${lead}>${sup}`);
  const key = `${lead}>${sup}`;
  if (directionalTitles[key]) fail(`duplicate directional title ${key}`);
  if (!title || !line) fail(`missing directional title or line for ${key}`);
  directionalTitles[key] = { title, line };
}
if (Object.keys(directionalTitles).length !== 20) fail("expected 20 directional titles");

const jointRows = block("Power one", 10);
const jointTitles = {};
for (const [p1, p2, title, line] of jointRows) {
  if (!POWERS.includes(p1) || !POWERS.includes(p2)) fail(`bad joint pair ${p1}+${p2}`);
  const key = [p1, p2]
    .sort((a, b) => POWERS.indexOf(a) - POWERS.indexOf(b))
    .join("+");
  if (jointTitles[key]) fail(`duplicate joint title ${key}`);
  if (!title || !line) fail(`missing joint title or line for ${key}`);
  jointTitles[key] = { title, line };
}
if (Object.keys(jointTitles).length !== 10) fail("expected 10 joint titles");

// Every referenced title must exist: single-leader states reference the
// directional set (all 20 ordered pairs), TIE_TWO the joint set (all 10
// unordered pairs), and the deeper ties the generic title.
for (const a of POWERS)
  for (const b of POWERS)
    if (a !== b && !directionalTitles[`${a}>${b}`])
      fail(`missing directional title for ${a}>${b}`);

const standingRows = block("Result element", 3);
const standing = Object.fromEntries(standingRows.map((r) => [r[0], r[1]]));
for (const k of ["Relative explanation", "Boundary line", "Replay line"]) {
  if (!standing[k]) fail(`missing standing copy: ${k}`);
}

// No main-power title may ever occupy the main title slot: enforce by
// checking the sets are disjoint (spec section 7 / test T34).
const mainTitles = new Set(POWERS.map((p) => powerMeta[p].mainTitle));
for (const { title } of [
  ...Object.values(directionalTitles),
  ...Object.values(jointTitles),
]) {
  if (mainTitles.has(title)) fail(`main-power title ${title} appears in a main title set`);
}

const config = {
  configVersion: "MVP-4.1",
  schemaVersion: "result-contract-1.0",
  nameSet: "final-1.0",
  powers: POWERS,
  powerMeta,
  questions,
  plot: { rawMin: 0, rawMax: RAW_MAX, displayMin: 1, displayMax: 5 },
  closeGapMax: 3,
  resultStates,
  directionalTitles,
  jointTitles,
  powerPackTitle: "The Power Pack",
  copy: {
    gameTitle: "What's Your Superpower?",
    promise:
      "Answer a collection of strange dog-themed questions and reveal your power mix.",
    // PLACEHOLDER_COMPLETION_TIME: approximate completion time is a required
    // entry-screen element (spec section 3) with no value specified anywhere.
    // Logged in PLACEHOLDERS.md for Steve to confirm.
    completionTime: "It takes about two minutes.",
    relativeExplanation: standing["Relative explanation"],
    boundary: standing["Boundary line"],
    replay: standing["Replay line"],
  },
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(config, null, 2) + "\n");
console.log(`wrote ${OUT}`);
console.log(
  `questions=${questions.length} directional=${Object.keys(directionalTitles).length} joint=${Object.keys(jointTitles).length} rawMax=${RAW_MAX}`
);
