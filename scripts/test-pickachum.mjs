// Pick a Chum: Checkpoint 1 proof harness.
//
// Feeds a battery of inputs through the real engine and asserts the resolved
// priority layer, bucket and action for each, covering the acceptance criteria
// in brief-mvp.md section 19 that are testable without UI. Loads the generated
// data from disk (the browser bundles the same shape) so no JSON import
// attributes are needed. Run: npm run test:pickachum
//
// Exit code is non-zero if any assertion fails.

import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const GEN = join(ROOT, 'app/pick-a-chum/data/generated');
const LIB = join(ROOT, 'app/pick-a-chum/lib');

const read = (f) => JSON.parse(readFileSync(join(GEN, f), 'utf8'));
const data = {
  collieResponses: read('collie-responses.json'),
  destinations: read('destinations.json'),
  faq: read('faq.json'),
  generalKnowledge: read('general-knowledge.json'),
  articles: read('articles.json'),
  transfers: read('transfers.json'),
  copyComponents: read('copy-components.json'),
  dogs: read('dogs.json'),
  misspellings: read('misspellings.json'),
};

const { submit } = await import(pathToFileURL(join(LIB, 'engine.ts')).href);
const { newSession } = await import(pathToFileURL(join(LIB, 'session.ts')).href);

let pass = 0;
let fail = 0;
const rows = [];

function check(input, expect, opts = {}) {
  const session = opts.session ?? newSession();
  const { resolution: r, response } = submit(data, session, input);
  const got = { layer: r.layer, bucket: r.bucket, action: r.action };
  const problems = [];
  for (const k of Object.keys(expect)) {
    if (got[k] !== expect[k]) problems.push(`${k}=${JSON.stringify(got[k])} want ${JSON.stringify(expect[k])}`);
  }
  if (opts.transferTo && r.transferTo !== opts.transferTo) problems.push(`transferTo=${r.transferTo} want ${opts.transferTo}`);
  if (opts.destinationId && (r.destinationId ?? response.destinationId) !== opts.destinationId)
    problems.push(`destinationId=${r.destinationId ?? response.destinationId} want ${opts.destinationId}`);
  if (opts.url && response.url !== opts.url) problems.push(`url=${response.url} want ${opts.url}`);
  if (opts.notAction && r.action === opts.notAction) problems.push(`action must NOT be ${opts.notAction}`);
  if (opts.assert) {
    const msg = opts.assert(r, response, session);
    if (msg) problems.push(msg);
  }
  const ok = problems.length === 0;
  ok ? pass++ : fail++;
  rows.push({ ok, input: input.slice(0, 34), layer: r.layer, bucket: r.bucket ?? '-', action: r.action, note: problems.join('; ') });
  return { r, response, session };
}

// ---- Priority ordering: high-value / high-risk meanings win over comedy ----
check('Hello, how much is the game?', { layer: 2, bucket: 'B01', action: 'open_discount_popup' }); // commercial > greeting
check('How much is it?', { layer: 2, bucket: 'B01', action: 'open_discount_popup' });
check('I want to buy one', { layer: 2, bucket: 'B01', action: 'open_discount_popup' });
check('Can dogs eat chocolate?', { layer: 1, action: 'health_answer' }, { notAction: 'transfer' }); // safety > food transfer
check('Is xylitol toxic to dogs?', { layer: 1, action: 'health_answer' }, { notAction: 'transfer' });

// ---- Navigation, rules, FAQ, content ----
check('Where is the Name Generator?', { layer: 3, bucket: 'B03', action: 'link' }, { destinationId: 'DST008', url: '/name-generator' });
check('Show me Know Your Chum', { layer: 3, bucket: 'B03', action: 'link' }, { destinationId: 'DST006' });
check('How do I play?', { layer: 3, bucket: 'B02', action: 'rules_answer' });
check('Do I need to own a dog?', { layer: 4, bucket: 'B04', action: 'faq_answer' });
// FAQ011 fills {{competition_close_date}} at render, mirroring the /chumspot page.
check('How do I enter the competition?', { layer: 4, bucket: 'B04', action: 'faq_answer' }, {
  assert: (_r, resp) => {
    if (resp.text.includes('{{')) return 'unfilled template token in answer';
    return /\b\d{1,2} [A-Z][a-z]+ \d{4}\b/.test(resp.text) ? null : 'expected a resolved close date (e.g. "31 July 2026")';
  },
});
check('Tell me about working dogs.', { layer: 5, bucket: 'B05', action: 'link' });

// ---- Knowledge: known vs unknown (never guess) ----
check('What is the capital of France?', { layer: 6, bucket: 'B06', action: 'gk_answer' });
check('What is the latest football score?', { layer: 6, bucket: 'B06', action: 'gk_unknown' }); // current data: refuse, no invention
check('Are Border Collies easy to train?', { layer: 7, bucket: 'B07', action: 'breed_answer' });

// ---- Specialist transfers (with context) ----
check('Sausages.', { layer: 8, bucket: 'B08', action: 'transfer' }, { transferTo: 'labrador' });
check('Tell me a joke.', { layer: 8, bucket: 'B08', action: 'transfer' }, { transferTo: 'boxer' });

// ---- Recognised conversation ----
check('Hello.', { layer: 9, bucket: 'B09', action: 'converse' });
check('Test', { layer: 9, bucket: 'B10', action: 'converse' });
check('Sit', { layer: 9, bucket: 'B11', action: 'converse' });
check('I am bored.', { layer: 9, bucket: 'B12', action: 'converse' });
check('Kettle', { layer: 9, bucket: 'B13', action: 'converse' }, { assert: (_r, resp) => (resp.text.toLowerCase().includes('kettle') ? null : 'expected original word inserted') });

// ---- Gibberish and fallback ----
check('qwerty', { layer: 10, bucket: 'B14', action: 'gibberish' });
check('asdfgh', { layer: 10, bucket: 'B14', action: 'gibberish' });
check('?????', { layer: 10, bucket: 'B14', action: 'gibberish' });
check('nnnnnn', { layer: 10, bucket: 'B14', action: 'gibberish' });

// ---- Safety moderation ----
check('I want to die', { layer: 1, action: 'safety_signpost' }, { assert: (_r, resp) => (resp.text.includes('Childline') ? null : 'expected approved signpost') });
check('you are stupid', { layer: 1, action: 'safety_boundary' });

// ---- Orientation / onboarding cold-start corpus (bucket B15, layer 11) ----
// First-time visitors who do not yet know what the chat is or what to do. All
// must land in the dedicated orientation bucket, never the gk_unknown refusal or
// the converse echo. Copy is written by Steve in the workbook; routing is asserted here.
const ORIENTATION_CORPUS = [
  'What am I meant to do here?', 'How do I get started?', 'What do I do first?', 'Where should I begin?',
  'What am I looking at?', 'How do I use this?', 'What is this for?', 'What happens if I type something?',
  'What am I allowed to ask?', 'Can I ask you a question?', 'What should I ask you?', 'Do I just type anything?',
  'Am I doing this right?', 'Is this where I type?', 'What am I meant to say?', 'Are you waiting for me?',
  'Do I need to choose something?', 'What are my options?', 'Can you show me what to do?', 'Can you explain this?',
  'Can you tell me how this works?', 'What can I ask about?', 'What are you here for?', 'What do you help with?',
  'Can you show me around?', 'Where can you take me?', 'What should I look at first?', 'Is there something I should press?',
  'Do I need to say a command?', 'Are there any instructions?', 'Where are the instructions?', 'What happens next?',
  'What do we do now?', 'Where do we go from here?', 'What am I supposed to ask?', 'Do you need me to say something?',
  'Are you going to say anything?', 'Why aren’t you talking?', 'Are you listening?', 'Did this open properly?',
  'Is something meant to happen?', 'Have I missed something?', 'Is this the start?', 'Do I need to enter a word?',
  'Can I type a question here?', 'What kind of things can you answer?', 'Can you give me some choices?',
  'Can you point me in the right direction?', 'Can you tell me what comes next?', 'So, what do I do with you?',
];
for (const q of ORIENTATION_CORPUS) check(q, { layer: 11, bucket: 'B15', action: 'orientation' });

// ---- Typo tolerance: typo'd inputs route like their clean versions ----
// Tolerance covers words of 6+ letters (where a single edit rarely reaches
// another real word); short high-value words (buy, shop, play) rely on the
// curated alias map, demonstrated by discont -> discount.
check('I want to purchace one', { layer: 2, bucket: 'B01', action: 'open_discount_popup' }); // purchace->purchase
check('wheres the discont code', { layer: 2, bucket: 'B01', action: 'open_discount_popup' }); // alias discont->discount
check('I love sausges', { layer: 8, bucket: 'B08', action: 'transfer' }, { transferTo: 'labrador' }); // sausges->sausages
check('how do i get statred?', { layer: 11, bucket: 'B15', action: 'orientation' }); // statred->started
check('any instrcutions?', { layer: 11, bucket: 'B15', action: 'orientation' }); // instrcutions->instructions
check('what kind of thigns can you answer?', { layer: 11, bucket: 'B15', action: 'orientation' }); // thigns->things

// ---- Safety keeps priority AND tolerance under typos (never fall through to comedy) ----
check('sucide', { layer: 1, action: 'safety_signpost' }, { assert: (_r, resp) => (resp.text.includes('Childline') ? null : 'expected signpost') }); // sucide->suicide
check('I want to kill myslef', { layer: 1, action: 'safety_signpost' }); // myslef->myself
check('you are stuipd', { layer: 1, action: 'safety_boundary' }); // stuipd->stupid

// ---- Negative: fuzziness must NOT drag benign near-neighbours into safety or buying ----
const FORBID = ['safety_signpost', 'safety_boundary', 'open_discount_popup', 'health_answer'];
function checkClean(input) {
  const { resolution: r } = submit(data, newSession(), input);
  const ok = !FORBID.includes(r.action);
  ok ? pass++ : fail++;
  rows.push({ ok, input: input.slice(0, 34), layer: r.layer, bucket: r.bucket ?? '-', action: r.action, note: ok ? '' : `LEAKED into ${r.action}` });
}
// lunch!=launch(buy), books!=boobs, baked!=naked, cast!=cost(buy), shot/shut!=shit, boxer(name) benign
[
  'I had my lunch', 'I love reading books', 'we baked a cake today', 'the cast was great',
  'he took a shot on goal', 'can you shut the door', 'my favourite is a boxer', 'I read lots of books',
].forEach(checkClean);

// ---- No exact response repetition within a session when alternatives exist ----
(() => {
  const s = newSession();
  const seen = new Set();
  let dup = null;
  for (let i = 0; i < 6; i++) {
    const { response } = submit(data, s, 'Hello.');
    if (seen.has(response.responseId)) dup = response.responseId;
    seen.add(response.responseId);
  }
  const ok = !dup;
  ok ? pass++ : fail++;
  rows.push({ ok, input: '6x "Hello." (rotation)', layer: 9, bucket: 'B09', action: 'converse', note: ok ? '' : `repeated ${dup}` });
})();

// ---- No dog speaks before the visitor ----
(() => {
  const s = newSession();
  const ok = s.submissionCount === 0 && s.previousDogs[0] === 'collie';
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'silent opening', layer: '-', bucket: '-', action: 'no message before input', note: ok ? '' : 'session started non-silent' });
})();

// ---- Hidden ceiling near 20 -> Boxer cut-off ----
(() => {
  const s = newSession();
  let last;
  for (let i = 0; i < 20; i++) last = submit(data, s, 'Hello.');
  const ok = last.resolution.action === 'boxer_cutoff' && last.response.closed === true;
  ok ? pass++ : fail++;
  rows.push({ ok, input: '20 submissions', layer: last.resolution.layer, bucket: last.resolution.bucket ?? '-', action: last.resolution.action, note: ok ? '' : 'no Boxer cut-off at ceiling' });
})();

// ---- Report ----
const pad = (s, n) => String(s).padEnd(n);
console.log('\nPick a Chum: Checkpoint 1 proof\n' + '='.repeat(78));
console.log(pad('ok', 4) + pad('input', 36) + pad('layer', 6) + pad('bucket', 7) + 'action');
console.log('-'.repeat(78));
for (const r of rows) {
  console.log(pad(r.ok ? 'PASS' : 'FAIL', 4) + pad(r.input, 36) + pad(r.layer, 6) + pad(r.bucket, 7) + r.action + (r.note ? `  <- ${r.note}` : ''));
}
console.log('-'.repeat(78));
console.log(`${pass} passed, ${fail} failed, ${pass + fail} total`);
process.exit(fail ? 1 : 0);
