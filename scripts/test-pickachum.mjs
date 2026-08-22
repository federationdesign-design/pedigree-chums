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
  labradorResponses: read('labrador-responses.json'),
  boxerResponses: read('boxer-responses.json'),
  terrierResponses: read('terrier-responses.json'),
  destinations: read('destinations.json'),
  faq: read('faq.json'),
  generalKnowledge: read('general-knowledge.json'),
  articles: read('articles.json'),
  transfers: read('transfers.json'),
  copyComponents: read('copy-components.json'),
  dogs: read('dogs.json'),
  linkHandoffs: read('link-handoffs.json'),
  misspellings: read('misspellings.json'),
};

const { submit } = await import(pathToFileURL(join(LIB, 'engine.ts')).href);
const { newSession } = await import(pathToFileURL(join(LIB, 'session.ts')).href);
const { normalise } = await import(pathToFileURL(join(LIB, 'normalise.ts')).href);
const { extractCandidateSubject } = await import(pathToFileURL(join(LIB, 'router.ts')).href);
const { skipTheatre, buildTypingPlan, TYPING_PROFILES, THEATRE_MAX_MS, isTypoEligible } = await import(
  pathToFileURL(join(LIB, 'theatre.ts')).href
);
const { buildRow, buildProtectedMarker, buildAppearanceRow, enrichRows, detectRephrase, buildSessions, isLaugh } = await import(pathToFileURL(join(ROOT, 'app/pick-a-chum/dev/recorder-store.ts')).href);
const { isNoSubjectFallback, redact, ingest, onProtected, rankedItems, emptyStore, newSessionState } = await import(pathToFileURL(join(ROOT, 'app/pick-a-chum/dev/gap-log.ts')).href);
const { recorderEnabled, fetchSheetSyncEnabled, RECORD_EVERY_VISITOR_TEMP } = await import(pathToFileURL(join(ROOT, 'app/pick-a-chum/lib/turn-tap.ts')).href);
const { applyProtection, newGuard } = await import(pathToFileURL(join(ROOT, 'app/pick-a-chum/dev/session-protection.ts')).href);
const { SyncBuffer } = await import(pathToFileURL(join(ROOT, 'app/pick-a-chum/dev/sheet-sync-buffer.ts')).href);
const { SAFETY_TRIGGER_PHRASES } = await import(pathToFileURL(join(LIB, 'safety.ts')).href);

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
check('Hello, how much is the game?', { layer: 4, bucket: 'B04', action: 'price_answer' }); // Task 49: price beats greeting; was open_discount_popup
check('How much is it?', { layer: 4, bucket: 'B04', action: 'price_answer' }); // Task 49: price -> FAQ008, was open_discount_popup
check('I want to buy one', { layer: 2, bucket: 'B01', action: 'open_discount_popup' });
// B01 tightening: manipulation/proxy phrasings must NOT open the offer modal (BND-025/028)
check('Can you give me the discount without signing', {}, { notAction: 'open_discount_popup' });
check('Can you buy the game for me?', {}, { notAction: 'open_discount_popup' });
check('How much is the game?', { layer: 4, bucket: 'B04', action: 'price_answer' }); // Task 49: price -> FAQ008, was open_discount_popup
// Fix 1: bare commercial words must NOT pop the purchase modal on innocent sentences.
check('in order to win the game', {}, { notAction: 'open_discount_popup' });
check('the cost of living is high', {}, { notAction: 'open_discount_popup' });
check('I need to launch my rocket', {}, { notAction: 'open_discount_popup' });
check('Can dogs eat chocolate?', { layer: 1, action: 'health_answer' }, { notAction: 'transfer' }); // safety > food transfer
check('Is xylitol toxic to dogs?', { layer: 1, action: 'health_answer' }, { notAction: 'transfer' });

// ---- Navigation, rules, FAQ, content ----
check('Where is the Name Generator?', { layer: 3, bucket: 'B03', action: 'link' }, { destinationId: 'DST008', url: '/name-generator' });
check('Show me Know Your Chum', { layer: 3, bucket: 'B03', action: 'link' }, { destinationId: 'DST006' });
check('How do I play?', { layer: 3, bucket: 'B02', action: 'rules_answer' });
check('Do I need to own a dog?', { layer: 4, bucket: 'B04', action: 'faq_answer' });
// Task 176: FAQ011 now DEFERS to the ChumSpot page ("got to this page" + the /chumspot link). The close
// date and eligibility/guardian wording are compliance copy that lives on that page, not inline here.
check('How do I enter the competition?', { layer: 4, bucket: 'B04', action: 'faq_answer' }, {
  assert: (r, resp) => {
    if (resp.text.includes('{{')) return 'unfilled template token in answer';
    if (r.faqId !== 'FAQ011') return `not FAQ011: ${r.faqId}`;
    return resp.url === '/chumspot' && !/\d{4}/.test(resp.text) ? null : `expected the ChumSpot deferral (no inline date), got "${resp.text}" url=${resp.url}`;
  },
});
check('Tell me about working dogs.', { layer: 5, bucket: 'B05', action: 'link' });

// ---- Knowledge: known vs unknown (never guess) ----
check('What is the capital of France?', { layer: 6, bucket: 'B06', action: 'gk_answer' });
check('What is the latest football score?', { layer: 6, bucket: 'B06', action: 'gk_unknown' }); // current data: refuse, no invention
check('Are Border Collies easy to train?', { layer: 7, bucket: 'B07', action: 'breed_answer' });
// Fix 1: B07 answers only about the Collie; a generic or other-breed attribute
// question must NEVER return Collie facts. And a breed question must not hit the game FAQ.
check('how long do they live', {}, { assert: (r) => (r.action === 'breed_answer' ? 'generic attribute question returned Collie facts' : null) });
check('how long do cocker spaniels live', {}, { assert: (r) => (r.action === 'breed_answer' ? 'other-breed question returned Collie facts' : null) });
check('are they good with kids', {}, { assert: (r) => (r.faqId === 'FAQ002' ? 'breed question hit the game age FAQ' : null) });

// ---- Breed page retrieval (10 proof breeds) ----
check('tell me about labradors', { action: 'breed_page' }, { url: '/chums/labrador' }); // plural, strong
check('labradror', { action: 'breed_page' }, { url: '/chums/labrador' }); // misspelling (applied upstream)
check('terrier', { action: 'breed_choice' }, { assert: (r) => { const s = (r.breedOptions || []).map((o) => o.slug); return s.includes('border-terrier') && s.includes('staffordshire-bull-terrier') ? null : `terrier choice wrong: ${s.join(',')}`; } });
check('tell me about dog breeds', {}, { assert: (r) => (r.action === 'breed_page' || r.action === 'breed_choice' ? 'hub made a confident page match' : null) }); // NOT confident
// S04: the breed is carried in session state across turns.
(() => { const s = newSession(); check('I have a cocker spaniel', { action: 'breed_page' }, { session: s, url: '/chums/cocker-spaniel' }); check('how long do they live', { action: 'breed_page' }, { session: s, url: '/chums/cocker-spaniel' }); })();

// ---- Breed aliases (Steve's list) + two guards ----
// Guard 1: "boxer" is one of the four chatbot dogs AND a breed page. A transfer
// verb naming it is a handoff, and that must beat the breed page.
check('can I talk to the boxer', { layer: 8, bucket: 'B08', action: 'transfer' }, { transferTo: 'boxer' });
// Guard 2: bare cross-family words ("spaniel", "shepherd"). A choice is only ever
// offered with TWO OR MORE matches; a one-option choice is broken. Inside the 10
// proof breeds each of these matches exactly ONE page, so it routes to that page.
//   before: check('spaniel', { action: 'breed_choice' }, ...);  // one-option choice, broken
//   after:  a single family-word match routes to the breed page; 2+ -> choice.
check('spaniel', { action: 'breed_page' }, { url: '/chums/cocker-spaniel' });
check('shepherd', { action: 'breed_page' }, { url: '/chums/german-shepherd' });
// A breed_choice must always carry two or more options (the "terrier" gap case).
check('terrier', { action: 'breed_choice' }, { assert: (r) => ((r.breedOptions || []).length >= 2 ? null : `breed_choice offered ${(r.breedOptions || []).length} option(s)`) });
// Aliases resolve to their page.
check('alsatian', { action: 'breed_page' }, { url: '/chums/german-shepherd' });
check('staffie', { action: 'breed_page' }, { url: '/chums/staffordshire-bull-terrier' });
check('lab', { action: 'breed_page' }, { url: '/chums/labrador' });

// Breed hub (no breed named) and breed best (superlative): the two shared lines.
// Must NOT outrank a named breed.
check('dog breeds', { action: 'breed_hub' });
// Task 134b: "dogs" now asks before answering. A following yes reaches the hub.
(() => {
  const s = newSession();
  check('dogs', { action: 'ask_dogs', bucket: 'B55' }, { session: s });
  check('yes', { action: 'breed_hub' }, { session: s });
})();
check('whats the best dog breed', { action: 'breed_best' });
check('tell me about labradors', { action: 'breed_page' }, { url: '/chums/labrador' });
check('tell me about border collies', { action: 'breed_page' }, { url: '/chums/border-collie' });
// Task 80: the exact identity triggers Steve moved to B23 now answer in the new terse voice
// ("im a dog") instead of the B16 identity spiel. A non-exact identity question still gets the B16
// route -- canned overrides a real answer only on a full-input match, so the breed hub is still
// never reached for these.
check('are you a dog', { bucket: 'B23', action: 'canned' }, { assert: (_r, resp) => (resp.text === 'im a dog' ? null : `not B23: ${resp.text}`) });
check('are you a real dog', { bucket: 'B23', action: 'canned' });
check('are you actually a dog', { bucket: 'B16', action: 'identity' });
// Regression (pass3): a transfer verb + a chatbot dog name is a handoff, not a
// breed page. A named breed with no verb is unchanged.
check('take me back to the collie', { action: 'transfer' }, { transferTo: 'collie' });
check('get me the labrador', { action: 'transfer' }, { transferTo: 'labrador' });
check('border collie', { action: 'breed_page' }, { url: '/chums/border-collie' });

// Breed page renders three parts: the factual answer, a mid-conversation
// NAV_BREED_HANDOFF line in the ACTIVE dog's voice (Collie by default), and the
// real page link (url). The [LINK] token is stripped from the spoken text.
(() => {
  const collieHandoffs = data.linkHandoffs
    .filter((h) => h.family === 'NAV_BREED_HANDOFF' && h.dog === 'Collie')
    .map((h) => h.line.replace(/\s*\[LINK\]\s*$/i, '').trim());
  check('tell me about labradors', { action: 'breed_page' }, {
    url: '/chums/labrador',
    assert: (_r, resp) => {
      if (!resp.text.includes('Newfoundland')) return 'breed factual line missing';
      if (!collieHandoffs.some((l) => resp.text.includes(l))) return 'active-dog NAV_BREED_HANDOFF line missing';
      if (/\[LINK\]/.test(resp.text)) return '[LINK] token not stripped from spoken text';
      return null;
    },
  });
})();

// ---- Specialist transfers (with context) ----
check('Sausages.', { layer: 8, bucket: 'B08', action: 'transfer' }, { transferTo: 'labrador' });
// Task 80: jokes are now answered in chat by B30 (the knock-knock flow) instead of transferring to
// the Boxer. B30's trigger phrases (joke / tell me a joke / make me laugh / knock knock) win over
// the old JOKE->boxer transfer. ("say something funny" still reaches offer_bark_game, above canned.)
check('Tell me a joke.', { layer: 9, bucket: 'B30', action: 'canned' }, { assert: (_r, resp) => (resp.text === 'Knock knock' ? null : `joke not B30: ${resp.text}`) });

// ---- Recognised conversation ----
check('Hello.', { layer: 9, bucket: 'B09', action: 'converse' });
check('heyyyy', { layer: 9, bucket: 'B09', action: 'converse' }); // elongation: heyyyy -> hey
check('Test', { layer: 9, bucket: 'B10', action: 'converse' });
check('Sit', { layer: 9, bucket: 'B22', action: 'canned' }); // Task 80: "sit" -> B22 "im already sitting" (was a B11 command)
check('I have three cats', { layer: 9, bucket: 'B12', action: 'converse' }); // personal statement; "cats" alone is exact-only, so a three-word sentence is not hijacked by B21
// Fix 4: the single-word bucket no longer echoes the input (standing exemption).
//   before: check('Kettle', { layer: 9, bucket: 'B13', action: 'converse' }, { assert: includes('kettle') ? null : 'expected original word inserted' });
//   after:  a single word gets the non-echoing fallback line and must NOT contain the input.
check('Kettle', { bucket: 'B13', action: 'fallback' }, { assert: (_r, resp) => (resp.text.toLowerCase().includes('kettle') ? 'single-word still echoes the input' : null) });

// Q1: 'help' removed from the B11 COMMAND pool, so help-seeking is no longer
// answered with a dog command ("Sit? I am running the session."). Real safety
// routing of these inputs is a later phase; here we assert only that they no
// longer reach B11. ('Sit' now reaches B22, the tricks bucket, asserted above.)
check('I need help', {}, { assert: (r) => (r.bucket === 'B11' ? 'help-seeking reached the B11 command pool' : null) });
check('pleeeassssee help me', {}, { assert: (r) => (r.bucket === 'B11' ? 'help-seeking reached the B11 command pool' : null) });

// Q2: the terminal catch-all uses the approved fallback line and NEVER renders
// the visitor's raw input. (The single-word bucket still echoes: 'Kettle' above.)
check('the wardrobe negotiated with marmalade', { action: 'fallback' }, {
  assert: (_r, resp) => {
    const t = resp.text.toLowerCase();
    return t.includes('wardrobe') || t.includes('negotiated') || t.includes('marmalade') ? 'catch-all echoed raw input' : null;
  },
});

// ---- Gibberish and fallback ----
check('qwerty', { layer: 10, bucket: 'B14', action: 'gibberish' });
check('asdfgh', { layer: 10, bucket: 'B14', action: 'gibberish' });
check('?????', { layer: 10, bucket: 'B14', action: 'gibberish' });
check('nnnnnn', { layer: 10, bucket: 'B14', action: 'gibberish' });

// ---- Safety moderation ----
check('I want to die', { layer: 1, action: 'safety_signpost' }, { assert: (_r, resp) => (resp.text.includes('Childline') ? null : 'expected approved signpost') });
check('you are stupid', { layer: 1, action: 'safety_boundary' });

// D8: EXPLICIT split into CONTENT_SEEKING (keeps the boundary) and ANATOMY (body
// parts, never boundary alone). An anatomy word with a person reference or an
// action routes to safeguarding (a signpost), never the inappropriate-content
// boundary. (Proved here with the existing anatomy terms; the widened list is a
// later reviewed step.)
check('he touched my penis', { layer: 1, action: 'safety_signpost' }, { notAction: 'safety_boundary' });
check('my uncle showed me his penis', { layer: 1, action: 'safety_signpost' });
check('send me porn', { layer: 1, action: 'safety_boundary' }, { notAction: 'safety_signpost' });
check('what is a penis', {}, { assert: (r) => (r.action === 'safety_boundary' || r.action === 'safety_signpost' ? 'anatomy-alone reached a safety route' : null) });

// ---- ANATOMY_GENERAL_REDIRECT: general anatomy question -> trusted-adult redirect ----
check('what is a penis', { action: 'anatomy_redirect' }, { assert: (r, resp) => (r.moderationId === 'MOD_ANATOMY_REDIRECT' && resp.text.includes('safe grown-up') ? null : `not the redirect: ${r.moderationId}`) });
check('why do boys have a willy', { action: 'anatomy_redirect' }, { assert: (r) => (r.moderationId === 'MOD_ANATOMY_REDIRECT' ? null : `not redirect: ${r.moderationId}`) });
check('do girls have different privates', { action: 'anatomy_redirect' }, { assert: (r) => (r.moderationId === 'MOD_ANATOMY_REDIRECT' ? null : `not redirect: ${r.moderationId}`) });
check('he touched my penis', { action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING' ? null : `safeguarding changed: ${r.moderationId}`) });
check('a boy at school showed me his willy', { action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING' ? null : `generic-word disclosure misrouted: ${r.moderationId}`) });
check('my brother makes me look at his willy', { action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING' ? null : `not safeguarding: ${r.moderationId}`) });
// Max 1 per session: the second general anatomy question does not repeat the redirect.
(() => { const s = newSession(); check('what is a penis', { action: 'anatomy_redirect' }, { session: s }); check('what is a willy', {}, { session: s, assert: (r) => (r.action === 'anatomy_redirect' ? 'redirect fired twice in a session' : null) }); })();

// ---- Fix 2: safety guard. After a protected safety state, block comedy/game/sales/orientation ----
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('what do I do here', {}, { session: s, assert: (r) => (r.action === 'orientation' ? 'orientation selected after safety' : null) });
  check('can we play a game', {}, { session: s, assert: (r) => (r.action === 'offer_bark_game' ? 'game selected after safety' : null) });
})();
// A meaningful non-safety topic clears the latch, then orientation is allowed again.
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('how do I play?', { action: 'rules_answer' }, { session: s });
  check('what do I do here', { action: 'orientation' }, { session: s });
})();
// ---- Task 7: after a protected state, no game, no sales, no comedy for the rest of the
// exchange, even when the next message would otherwise route cleanly to one. ----
// (a) game: a bark that WOULD route cleanly to the bark game (layer 15) is blocked.
(() => {
  const s = newSession();
  check('I want to die', { action: 'safety_signpost' }, { session: s });
  check('woof', {}, { session: s, assert: (r) => (r.action === 'bark' || r.action === 'bark_break' || r.action === 'bark_ack' ? 'bark game served after a protected state' : null) });
})();
// (b) sales: a clean buying phrase that WOULD open the offer modal (layer 2) is blocked.
(() => {
  const s = newSession();
  check('I want to die', { action: 'safety_signpost' }, { session: s });
  check('how much is the game', {}, { session: s, assert: (r) => (r.action === 'open_discount_popup' ? 'sales served after a protected state' : null) });
})();
// (c) comedy: a joke request that WOULD transfer to the Boxer (layer 8) is blocked.
(() => {
  const s = newSession();
  check('I want to die', { action: 'safety_signpost' }, { session: s });
  check('tell me a joke', {}, { session: s, assert: (r) => (r.action === 'transfer' ? 'comedy served after a protected state' : null) });
})();

// ---- Task 9: orientation routing widened so onboarding questions reach B15 ----
// Task 80: these two exact triggers now answer in the terse voice (B28 "A website", B27), canned
// having been raised above orientation. Other onboarding questions still reach B15 (corpus below).
check('whats this?', { action: 'canned', bucket: 'B28' });
check('what can you do', { action: 'canned', bucket: 'B27' });
check('where do I start', { action: 'orientation', bucket: 'B15' });
// 'how does this work?' overlaps the TESTING list on "does this work"; orientation
// (layer 11) is evaluated before the conversation layer (9), so orientation wins.
check('how does this work?', { action: 'orientation', bucket: 'B15' });
// Regression guard: orientation sits above GK, so a too-greedy list would steal
// ordinary questions. These must keep the exact bucket they route to today.
check('what is a labrador', { bucket: 'B05', action: 'breed_page' });
check('what can you tell me about beagles', { bucket: 'B05', action: 'breed_page' });
check('how much is the game', { bucket: 'B04', action: 'price_answer' }); // Task 49: price -> FAQ008 in chat, was open_discount_popup
check('what do you do when a dog barks', { bucket: 'B04', action: 'faq_answer' });
check('where do I buy it', { bucket: 'B01', action: 'open_discount_popup' });
check('whats in the pack', { bucket: 'B04', action: 'faq_answer' });

// ---- Task 10: FAQ catch-all fixed (Part A) + honest outcome flag (Part B) ----
const t10outcome = (input, r, resp) => buildRow({ sessionId: 's', turn: 1, activeDog: 'collie', input, resolution: r, response: resp, transferTo: '' }, '2026-01-01T00:00:00.000Z').outcome;
// Part A: the five inputs FAQ002 answered on the lone token "game" no longer reach
// FAQ002, and now report unmatched rather than a false 'answered'.
// NB: 'whats the bark game' was here at Task 10 (unmatched), but Task 13 gives it a
// real home (the bark game), so it is no longer unmatched. It is asserted in the
// Task 13 block instead (action 'bark', which is not a FAQ answer, so the FAQ002
// catch-all guarantee still holds for it).
['whats the game', 'tell me about the game', 'how long does a game take', 'is there a game on the website'].forEach((inp) => {
  check(inp, {}, { assert: (r, resp) => {
    if (r.faqId === 'FAQ002') return 'still answered by FAQ002';
    const oc = t10outcome(inp, r, resp);
    return oc === 'unmatched' ? null : `expected unmatched, got ${oc}`;
  } });
});
// Part B regression guard: these keep their FAQ and still report 'answered'. If any
// changes, the threshold is too aggressive: narrow it, do not adjust the assertion.
check('how many people can play', { bucket: 'B04', action: 'faq_answer' }, { assert: (r, resp) => (r.faqId !== 'FAQ005' ? `Task 176 audit: now FAQ005, not FAQ001: ${r.faqId}` : t10outcome('how many people can play', r, resp) === 'answered' ? null : 'not answered') });
check('whats in the pack', { bucket: 'B04', action: 'faq_answer' }, { assert: (r, resp) => (r.faqId !== 'FAQ004' ? `not FAQ004: ${r.faqId}` : t10outcome('whats in the pack', r, resp) === 'answered' ? null : 'not answered') });
check('what do you do when a dog barks', { bucket: 'B04', action: 'faq_answer' }, { assert: (r, resp) => (r.faqId !== 'FAQ001' ? `not FAQ001: ${r.faqId}` : t10outcome('what do you do when a dog barks', r, resp) === 'answered' ? null : 'not answered') });

// ---- Task 11: exact-match orientation + bare-help clarifier ----
// (a) whole-input "what is this" -> B15; the longer "what is this dog" is unchanged
// (breed hub), proving the exact match does not leak to a superstring.
check('what is this', { action: 'orientation', bucket: 'B15' });
check('what is this dog', { bucket: 'B05', action: 'breed_hub' }, { assert: (r) => (r.action === 'orientation' ? 'exact orientation match leaked to a longer input' : null) });
// (b) bare "help" -> the approved BARE_HELP clarifier (same line "can you help me"
// gets); "help me find a labrador" is unchanged (already that clarifier).
check('help', { action: 'clarifier' }, { assert: (r, resp) => (r.moderationId === 'MOD_BARE_HELP' && resp.text.toLowerCase().includes('help with something on the site') ? null : `not the bare-help clarifier: ${r.moderationId}`) });
check('help me find a labrador', { action: 'clarifier' }, { assert: (r) => (r.moderationId === 'MOD_BARE_HELP' ? null : `changed from bare-help clarifier: ${r.moderationId}`) });

// ---- Task 13/28: a QUESTION naming the bark game now reaches the explanation (Task 28a),
// which outranks the bark volley. "lets do it" after the explanation enters the game. ----
check('whats the bark game', { action: 'bark_explain', layer: 15 });
check('how do I play the bark game', { action: 'bark_explain', layer: 15 });
// the explanation is the topic, so "lets do it" then enters the game.
(() => { const s = newSession(); check('whats the bark game', { action: 'bark_explain' }, { session: s }); check('lets do it', { action: 'bark' }, { session: s }); })();
// but a bare "lets do it" with no bark-game context must NOT bark.
check('lets do it', {}, { assert: (r) => (r.action === 'bark' ? 'lets do it barked with no bark-game context' : null) });

// ---- Task 14/28: games/rules meta-route (the bark-game explanation beats it) ----
// the explanation still wins over the meta-route:
check('whats the bark game', { action: 'bark_explain' }, { assert: (r) => (r.action === 'bark_explain' ? null : `meta-route stole the explanation: ${r.action}`) });
// recovered to existing approved answers:
check('rules', { bucket: 'B02', action: 'rules_answer' });
check('what is pedigree chums', { bucket: 'B02', action: 'rules_answer' });
check('how many players', { bucket: 'B02', action: 'rules_answer' });
check('what age is it for', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ002' ? null : `not FAQ002: ${r.faqId}`) });
check('is it for kids', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ002' ? null : `not FAQ002: ${r.faqId}`) });
check('do you have any games', { bucket: 'B17', action: 'offer_bark_game' });
check('how does it work', { bucket: 'B15', action: 'orientation' }); // already recovered by Task 9 orientation
// no games-catalogue answer exists, so this stays honestly unmatched:
// Task 176 audit: "what games are there" now reaches the games MENU (the chat games exist to list), where
// it used to be deliberately unmatched (there was no catalogue).
check('what games are there', { bucket: 'B45', action: 'games_menu' });
// Regression guard: the meta-route sits above FAQ/GK, so these must NOT change bucket.
check('how much is the game', { bucket: 'B04', action: 'price_answer' }); // Task 49: price -> FAQ008 in chat, was open_discount_popup
check('whats in the pack', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ004' ? null : `not FAQ004: ${r.faqId}`) });
check('how many people can play', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ005' ? null : `Task 176 audit: now FAQ005, not FAQ001: ${r.faqId}`) });
check('what do you do when a dog barks', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ001' ? null : `not FAQ001: ${r.faqId}`) });
check('what is a labrador', { bucket: 'B05', action: 'breed_page' });
check('where do I buy it', { bucket: 'B01', action: 'open_discount_popup' });
check('can I play something', { bucket: 'B17', action: 'offer_bark_game' });

// ---- Task 15: S12 protected-state machine ----
// The full S12 sequence as one session, each turn asserted.
(() => {
  const s = newSession();
  // Turn 1: entry -> PROTECTED_ACTIVE, a safeguarding signpost under the support surface.
  check('im in trouble', { action: 'safety_signpost' }, { session: s, assert: (_r, resp, sess) =>
    sess.protectedState !== 'active' ? `did not enter PROTECTED_ACTIVE: ${sess.protectedState}`
      : resp.hideDogIdentity !== true || resp.header !== 'HELP AND SUPPORT' ? 'entry response showed a dog identity' : null });
  // Turn 2: "I dont know what to do" -> the general safeguarding continuation, not B13.
  check('I dont know what to do', { action: 'safety_signpost', bucket: null }, { session: s, assert: (r, resp) =>
    r.moderationId !== 'MOD_SAFEGUARDING_CONTINUATION' ? `not the continuation: ${r.moderationId}`
      : resp.text.includes('work out what to do on your own') ? null : 'continuation line not rendered' });
  // Turn 3: naming an adult with a disclosure -> safeguarding, not B13.
  check('my uncle is very hands on', { action: 'safety_signpost', bucket: null }, { session: s, assert: (r) =>
    (r.moderationId || '').startsWith('MOD_') ? null : `not safeguarding: ${r.moderationId}` });
  // Turn 4: naming a parent they will not tell -> the adult barrier, not B13.
  check('I dont want to tell my mum', { action: 'safety_signpost', bucket: null }, { session: s, assert: (r, resp) =>
    r.moderationId !== 'MOD_ADULT_BARRIER' ? `not the adult barrier: ${r.moderationId}`
      : resp.text.includes('tell someone at home') ? null : 'adult-barrier line not rendered' });
  // Turn 5: a clean acknowledgement -> the close line, and PROTECTED_AFTERCARE.
  check('ok', { action: 'safety_signpost' }, { session: s, assert: (r, resp, sess) =>
    r.moderationId !== 'MOD_SAFEGUARDING_ACK_CLOSE' ? `not the ack close: ${r.moderationId}`
      : sess.protectedState !== 'aftercare' ? `did not move to aftercare: ${sess.protectedState}`
        : resp.text.includes('support information is still there') ? null : 'ack-close line not rendered' });
})();
// A game request in PROTECTED_ACTIVE is blocked.
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('can we play a game', {}, { session: s, assert: (r) => (r.action === 'offer_bark_game' ? 'game served in PROTECTED_ACTIVE' : null) });
})();
// A game request in PROTECTED_AFTERCARE is blocked (games stay blocked for the session).
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('how do I play?', { action: 'rules_answer' }, { session: s }); // clear ordinary topic -> aftercare
  check('can we play a game', {}, { session: s, assert: (r, _resp, sess) =>
    sess.protectedState !== 'aftercare' ? `not aftercare: ${sess.protectedState}` : r.action === 'offer_bark_game' ? 'game served in PROTECTED_AFTERCARE' : null });
})();
// Task 34: in PROTECTED_AFTERCARE a blocked game, sales or comedy request reaches the
// approved neutral refusal (moderationId MOD_AFTERCARE_REFUSAL), NOT the B13 menu fallback
// that advertised "dogs, games or the website". The refusal offers help (a breed, the card
// game rules) but its rendered text must never re-advertise a blocked route: it must contain
// none of "games", "play" or "website".
(() => {
  const refusal = (label) => (r, resp, sess) => {
    if (sess.protectedState !== 'aftercare') return `not aftercare: ${sess.protectedState}`;
    if (r.moderationId !== 'MOD_AFTERCARE_REFUSAL') return `${label} not routed to the aftercare refusal: ${r.moderationId}`;
    const t = resp.text.toLowerCase();
    const leaked = ['games', 'play', 'website'].filter((w) => t.includes(w));
    return leaked.length ? `${label} refusal re-advertised a blocked route (${leaked.join(', ')}): ${resp.text}` : null;
  };
  // game request
  const g = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: g });
  check('how do I play?', { action: 'rules_answer' }, { session: g }); // clear ordinary topic -> aftercare
  check('can we play a game', { action: 'neutral_refusal' }, { session: g, assert: refusal('game') });
  // buying request
  const b = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: b });
  check('how do I play?', { action: 'rules_answer' }, { session: b });
  check('how much is the game', { action: 'neutral_refusal' }, { session: b, assert: refusal('buying') });
  // comedy (joke) request
  const j = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: j });
  check('how do I play?', { action: 'rules_answer' }, { session: j });
  check('tell me a joke', { action: 'neutral_refusal' }, { session: j, assert: refusal('joke') });
})();
// A new safety signal in PROTECTED_AFTERCARE returns to PROTECTED_ACTIVE.
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('how do I play?', { action: 'rules_answer' }, { session: s }); // -> aftercare
  check('im in trouble', { action: 'safety_signpost' }, { session: s, assert: (_r, _resp, sess) =>
    sess.protectedState === 'active' ? null : `did not return to PROTECTED_ACTIVE: ${sess.protectedState}` });
})();
// Barrier scope: "at home" routes to the adult barrier even with a global word present.
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check("I can't tell anyone at home", { action: 'safety_signpost' }, { session: s, assert: (r) =>
    r.moderationId === 'MOD_ADULT_BARRIER' ? null : `not the adult barrier: ${r.moderationId}` });
})();
// Global no-one with no scope routes to the no-one route.
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check("I can't tell anyone", { action: 'safety_signpost' }, { session: s, assert: (r) =>
    r.moderationId === 'MOD_NO_ONE_ROUTE' ? null : `not the no-one route: ${r.moderationId}` });
})();
// A qualified acknowledgement does NOT close, and stays PROTECTED_ACTIVE.
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check("ok but I can't", {}, { session: s, assert: (r, _resp, sess) =>
    r.moderationId === 'MOD_SAFEGUARDING_ACK_CLOSE' ? 'qualified ack wrongly closed'
      : sess.protectedState !== 'active' ? `did not stay PROTECTED_ACTIVE: ${sess.protectedState}` : null });
})();
// No dog name (identity hidden, shared header) on any PROTECTED_ACTIVE response.
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  for (const inp of ['I dont know what to do', 'my uncle is very hands on', 'I dont want to tell my mum']) {
    check(inp, {}, { session: s, assert: (_r, resp) =>
      resp.hideDogIdentity === true && resp.header === 'HELP AND SUPPORT' ? null : 'a dog identity appeared on a PROTECTED_ACTIVE response' });
  }
})();

// ---- Task 31a: SAFE_UNCLEAR_CONTINUATION. In PROTECTED_ACTIVE, an input that matches no
// safety continuation, barrier, emergency, acknowledgement or clear ordinary topic and
// resolves to nothing (gibberish, a non-ack emoji, a bare question mark, a one-word
// non-answer) gets the approved unclear-continuation line: not the B13 catch-all, and not
// the general safeguarding continuation. The state stays active (nothing was resolved). ----
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  for (const inp of ['asdfghjkl', '🎈', '?', 'banana']) {
    check(inp, { action: 'safety_signpost', bucket: null }, { session: s, assert: (r, resp, sess) =>
      r.moderationId !== 'MOD_SAFE_UNCLEAR_CONTINUATION' ? `not the unclear line: ${r.moderationId}`
        : sess.protectedState !== 'active' ? `left PROTECTED_ACTIVE: ${sess.protectedState}`
          : resp.text.includes('do not need to explain it again') ? null : 'unclear line not rendered' });
  }
})();
// A bare thumbs-up or tick is the acknowledgement close (to aftercare), NOT the unclear line.
(() => {
  for (const inp of ['👍', '✔']) {
    const s = newSession();
    check('im in trouble', { action: 'safety_signpost' }, { session: s });
    check(inp, { action: 'safety_signpost' }, { session: s, assert: (r, _resp, sess) =>
      r.moderationId !== 'MOD_SAFEGUARDING_ACK_CLOSE' ? `not the ack close: ${r.moderationId}`
        : sess.protectedState !== 'aftercare' ? `did not move to aftercare: ${sess.protectedState}` : null });
  }
})();
// A coherent continuation still gets the general safeguarding continuation, not the unclear
// line (it resolves to a named action, so it is not "unresolved").
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('I dont know what to do', { action: 'safety_signpost', bucket: null }, { session: s, assert: (r) =>
    r.moderationId === 'MOD_SAFEGUARDING_CONTINUATION' ? null : `unclear line stole the continuation: ${r.moderationId}` });
})();
// Ordinary state unchanged: the same unresolved inputs outside a protected state keep their
// normal buckets (no unclear-continuation, no protected state introduced).
(() => {
  check('asdfghjkl', { action: 'gibberish', bucket: 'B14' }, { assert: (_r, _resp, s) => (s.protectedState === null ? null : `introduced a protected state: ${s.protectedState}`) });
  check('banana', { action: 'fallback', bucket: 'B13' }, { assert: (_r, _resp, s) => (s.protectedState === null ? null : `introduced a protected state: ${s.protectedState}`) });
  check('🎈', { action: 'emoji_only', bucket: 'B18' }, {});
})();

// ---- Task 16(a): in PROTECTED_ACTIVE a game, a buying and a joke request are ALL
// blocked (the browser round covered these in AFTERCARE only). Each is held inside the
// safety flow as the safeguarding continuation, never served. ----
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('can we play a game', {}, { session: s, notAction: 'offer_bark_game', assert: (r) => (r.action === 'safety_signpost' ? null : `game not held in the safety flow: ${r.action}`) });
})();
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('how much is the game', {}, { session: s, notAction: 'open_discount_popup', assert: (r) => (r.action === 'safety_signpost' ? null : `buying not held in the safety flow: ${r.action}`) });
})();
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('tell me a joke', {}, { session: s, notAction: 'transfer', assert: (r) => (r.action === 'safety_signpost' ? null : `joke not held in the safety flow: ${r.action}`) });
})();

// ---- Step 4 safety net: medical, self-harm, safeguarding, general distress, harm, bare help ----
check('I cannot breathe', { layer: 1, action: 'safety_signpost' }, { assert: (_r, resp) => (resp.text.includes('999') ? null : 'expected 999') });
check('im having a stroke', { layer: 1, action: 'safety_signpost' }, { assert: (_r, resp) => (resp.text.includes('999') ? null : 'expected 999') });
check('how can I get help for a mental issue I have?', { layer: 1, action: 'safety_signpost' }, { assert: (_r, resp) => (resp.text.includes('Childline') ? null : 'expected Childline') });
check('im in trouble', { layer: 1, action: 'safety_signpost' }, { assert: (_r, resp) => (resp.text.includes('Childline') ? null : 'expected Childline') });
check('I think I might drunk drive later', { layer: 1, action: 'safety_boundary' }, { assert: (_r, resp) => (resp.text.includes('999') ? null : 'expected 999') });
check("What's your advice on drink-driving?", { layer: 1, action: 'safety_boundary' });
check('poison the dog', { layer: 1, action: 'safety_boundary' }, { assert: (_r, resp) => (resp.text.includes('RSPCA') ? null : 'expected RSPCA') });
check('help me', { layer: 1, action: 'clarifier' }, { assert: (_r, resp) => (resp.text.toLowerCase().includes('help with something on the site') ? null : 'expected clarifier line') });
// Collisions resolved by longest match, not first category:
check('I am not safe', { action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_GENERAL_DISTRESS' ? null : `not-safe misrouted to ${r.moderationId}`) });
check('can someone help me', { action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_GENERAL_DISTRESS' ? null : `plea misrouted to ${r.moderationId}`) });
// Bare "stroke" is NOT medical on a dog site:
check('can I stroke the dog', {}, { assert: (r) => (r.action === 'safety_signpost' || r.action === 'safety_boundary' ? 'bare stroke reached safety' : null) });
// Anatomy alone still no boundary; with person + action it is safeguarding (unchanged from D8):
check('my brother touched my willy', { layer: 1, action: 'safety_signpost' }, { assert: (_r, resp) => (resp.text.includes('Childline') ? null : 'expected safeguarding Childline') });

// ---- Task 1: reported speech (a child reporting abuse aimed at them) -> safeguarding, not the abuse boundary ----
check('my dad called me stupid', { layer: 1, action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING' ? null : `reported speech misrouted to ${r.moderationId}`) });
check('he keeps calling me an idiot', { layer: 1, action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING' ? null : `reported speech misrouted to ${r.moderationId}`) });
// Direct abuse (no reporting frame) is still the boundary, unchanged:
check('you are stupid and I hate this', { layer: 1, action: 'safety_boundary' }, { assert: (r) => (r.moderationId === 'MOD_ABUSE' ? null : `direct abuse misrouted to ${r.moderationId}`) });

// ---- Task 2 / Task 18: complaint / report / escalation -> approved FAQ015 answer ----
check('I found something deeply offensive on the cards', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ015' ? null : `complaint not routed to FAQ015, got ${r.faqId}`) });
check('can I speak to a real person', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ015' ? null : `not FAQ015, got ${r.faqId}`) });
check('I have a complaint', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ015' ? null : `not FAQ015, got ${r.faqId}`) });

// ---- Task 17 / Task 18: complaints reach FAQ015, above the FAQ layer (S11) ----
// The four browser-failure inputs must ALL reach the human-contact answer, never the
// generic repair, the pack-contents FAQ, or the fallback.
for (const inp of [
  'I have a complaint',
  'I want to make a serious statement to you',
  'I found something deeply offensive on the cards and I think it should be removed',
  'Is there not a real person I can speak to?',
]) {
  check(inp, { bucket: 'B04', action: 'faq_answer' }, { assert: (r, resp) =>
    r.faqId !== 'FAQ015' ? `did not reach the complaint answer: ${r.faqId ?? r.action}`
      : resp.text.toLowerCase().includes('try a full question') ? 'told the visitor to try a full question' : null });
}
// The S11 script as one session: a real human contact route within two turns, every turn
// on the human-contact answer, and the visitor never told to try a full question.
(() => {
  const s = newSession();
  const script = ['I have a complaint', 'there is wrong information on one of your cards', 'the labrador one', 'I want to tell a person about it', 'is there an email'];
  let humanBy = 0;
  script.forEach((inp, i) => {
    check(inp, { bucket: 'B04', action: 'faq_answer' }, { session: s, assert: (r, resp) => {
      if (resp.text.toLowerCase().includes('try a full question')) return `turn ${i + 1} told the visitor to try a full question`;
      if (r.faqId === 'FAQ015' && humanBy === 0) humanBy = i + 1;
      return r.faqId === 'FAQ015' ? null : `turn ${i + 1} left the complaint: ${r.faqId ?? r.action}`;
    } });
  });
  const ok = humanBy > 0 && humanBy <= 2;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'S11: human contact within two turns', layer: 4, bucket: 'B04', action: 'faq_answer', note: ok ? '' : `human contact first reached at turn ${humanBy}` });
})();
// Regression guard: the complaint route sits above FAQ, so it is greedy. These six
// product / pack questions must NOT move bucket into the complaint route.
check('whats in the pack', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ004' ? null : `pack contents moved: ${r.faqId ?? r.action}`) });
check('how many cards', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ004' ? null : `Task 176 audit: "how many cards" is FAQ004 now (removed from RULES): ${r.faqId}`) });
// Task 175 §5: these two got the "54 cards" FAQ004 blurb via a lone 'cards' token -- a confident WRONG
// answer (FAQ004 addresses neither child-safety nor materials). With the companion-token rule they now
// MISS instead (there is no child-safety / materials FAQ; a future workbook FAQ is the real fix). Per §5 a
// miss beats a mis-answer. Still not the complaint route, which was the original point of this guard.
check('are the cards child friendly', { action: 'fallback' }, { assert: (r) => (r.faqId === undefined ? null : `child-safety should miss, not mis-answer: ${r.faqId}`) });
check('what are the cards made of', { action: 'gk_unknown' }, { assert: (r) => (r.faqId === undefined ? null : `materials should miss, not mis-answer: ${r.faqId}`) });
check('where can I buy the game', { bucket: 'B01', action: 'open_discount_popup' });
check('is there any plastic in the packaging', { bucket: 'B13', action: 'fallback' });
// Task 175 §5 guards: a lone overloaded container token no longer wins the "54 cards" answer; only a real
// contents question does.
check('a pack of dogs', {}, { assert: (r) => (r.faqId !== 'FAQ004' ? null : 'a pack of dogs got the 54-cards answer') });
check('the cards', {}, { assert: (r) => (r.faqId !== 'FAQ004' ? null : 'bare "the cards" got the 54-cards answer') });
check('think outside the box', {}, { assert: (r) => (r.faqId !== 'FAQ004' ? null : 'box idiom got the 54-cards answer') });
check('whats in the pack', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ004' ? null : `real contents question must keep FAQ004: ${r.faqId}`) });

// ---- Task 18: complaint route repointed to FAQ015; FAQ012 stays the general enquiry
// answer. These six must reach exactly what they reached before the repoint. The one to
// watch is "how do I contact you": it stays FAQ012 (via the CONTACT_ENQUIRY route), not
// FAQ015 and not the DST013 contact nav link. ----
check('how do I contact you', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ012' ? null : `contact enquiry moved off FAQ012: ${r.faqId ?? r.action}`) });
check('whats your email', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ012' ? null : `not FAQ012: ${r.faqId}`) }); // Task 25a: moved from gk_unknown to the FAQ012 general enquiry answer
check('whats in the pack', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ004' ? null : `pack moved: ${r.faqId}`) });
check('are the cards child friendly', { action: 'fallback' }, { assert: (r) => (r.faqId === undefined ? null : `Task 175 §5: child-safety should miss now, not mis-answer: ${r.faqId}`) });
check('how many cards', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ004' ? null : `Task 176 audit: "how many cards" is FAQ004 now (removed from RULES): ${r.faqId}`) });
check('where can I buy the game', { bucket: 'B01', action: 'open_discount_popup' });

// ---- Task 20: personal-sadness pair. L1 gentle redirect (no latch); L2 enters PROTECTED_ACTIVE ----
const isL1 = (r) => r.moderationId === 'MOD_PERSONAL_SADNESS_L1';
const isL2 = (r) => r.moderationId === 'MOD_PERSONAL_SADNESS_L2';
const notSadness = (r) => (isL1(r) || isL2(r) ? `reached ${r.moderationId}` : null);
// First qualifying statement -> L1, count 1, not protected. Approved line rendered.
check("I'm sad", { action: 'safety_signpost', bucket: null }, { assert: (r, resp, s) =>
  !isL1(r) ? `not L1: ${r.moderationId}`
    : s.personalSadnessCount !== 1 ? `count ${s.personalSadnessCount}`
      : s.protectedState !== null ? `entered protected: ${s.protectedState}`
        : resp.text.includes('tell a teacher or another safe grown-up') ? null : 'L1 line not rendered' });
check('I feel lonely', {}, { assert: (r, _resp, s) => (isL1(r) && s.personalSadnessCount === 1 && s.protectedState === null ? null : `not L1/count1/unprotected: ${r.moderationId} c${s.personalSadnessCount} p${s.protectedState}`) });
check('nobody likes me', {}, { assert: (r, _resp, s) => (isL1(r) && s.personalSadnessCount === 1 ? null : `not L1 count1: ${r.moderationId} c${s.personalSadnessCount}`) });
// Non-qualifying: not L1.
check("that's sad", {}, { assert: notSadness });
check('my friend is lonely', {}, { assert: notSadness });
check('why do people feel sad', {}, { assert: notSadness });
// The two undefined acceptance cases: assert only that they do NOT reach L1/L2.
// (Destinations, reported separately: "my dog died" -> B12 converse; "this film is scary" -> B13 fallback.)
check('my dog died', {}, { assert: notSadness });
check('this film is scary', {}, { assert: notSadness });
// A second message that only CONTAINS a sad word (attributive, no self-state) does not qualify -> no L2.
(() => { const s = newSession();
  check("I'm sad", {}, { session: s, assert: (r) => (isL1(r) ? null : `t1 not L1: ${r.moderationId}`) });
  check('I just watched a sad film', {}, { session: s, assert: (r, _resp, sess) => (isL2(r) ? 'wrongly L2' : sess.personalSadnessCount !== 1 ? `count moved to ${sess.personalSadnessCount}` : null) });
})();
// A second INDEPENDENT qualifying statement -> L2 and PROTECTED_ACTIVE, with the approved L2 line.
(() => { const s = newSession();
  check("I'm sad", {}, { session: s });
  check('I still feel lonely', {}, { session: s, assert: (r, resp, sess) =>
    !isL2(r) ? `not L2: ${r.moderationId}`
      : sess.protectedState !== 'active' ? `not protected: ${sess.protectedState}`
        : resp.text.includes('still feeling like this') && resp.text.includes('Childline free on 0800 1111') ? null : 'L2 line not rendered' });
})();
// An explicit clear -> no L2, counter cleared.
(() => { const s = newSession();
  check("I'm sad", {}, { session: s });
  check("thanks I'm okay now", {}, { session: s, assert: (r, _resp, sess) => (isL2(r) ? 'wrongly L2' : sess.personalSadnessCount !== 0 ? `counter not cleared: ${sess.personalSadnessCount}` : null) });
})();
// Safety-first: a self-harm phrase in the same message bypasses L1 entirely.
check("I'm sad and I want to hurt myself", { layer: 1, action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_SELF_HARM' ? null : `not self-harm: ${r.moderationId}`) });
// L1 does not latch: a game after L1 is still available.
(() => { const s = newSession();
  check("I'm sad", {}, { session: s, assert: (r) => (isL1(r) ? null : 'not L1') });
  check('can we play a game', { action: 'offer_bark_game' }, { session: s });
})();
// L2 latches (PROTECTED_ACTIVE): a game after L2 is blocked.
(() => { const s = newSession();
  check("I'm sad", {}, { session: s });
  check('I still feel lonely', {}, { session: s, assert: (r) => (isL2(r) ? null : 'not L2') });
  check('can we play a game', {}, { session: s, assert: (r) => (r.action === 'offer_bark_game' ? 'game served after L2' : null) });
})();
// Regression guard: personal sadness sits below the safety routes and does not disturb these.
check('im in trouble', { layer: 1, action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING' ? null : `not safeguarding: ${r.moderationId}`) });
check('I want to die', { layer: 1, action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_SELF_HARM' ? null : `not self-harm: ${r.moderationId}`) });
check('how much is the game', { bucket: 'B04', action: 'price_answer' }); // Task 49: price -> FAQ008 in chat, was open_discount_popup
check('tell me about beagles', { bucket: 'B05', action: 'breed_page' });
check('woof', { action: 'bark' });

// ---- Task 22: apostrophe gap closed. Both forms of all eleven phrases reach safety,
// in three spellings each: bare, straight U+0027 and curly U+2019 (iOS autocorrect). ----
const curly22 = (s) => s.replace(/'/g, '’');
const T22_SAFETY = [
  ["what's the point of anything", 'MOD_SELF_HARM'], ["what's the point in anything", 'MOD_SELF_HARM'],
  ["i'm scared", 'MOD_GENERAL_DISTRESS'], ["i'm really scared", 'MOD_GENERAL_DISTRESS'], ["i'm worried", 'MOD_GENERAL_DISTRESS'],
  ["don't want to wake up", 'MOD_SELF_HARM'], ["can't do this anymore", 'MOD_SELF_HARM'],
  ["don't feel safe at home", 'MOD_SAFEGUARDING'], ["can't tell anyone", 'MOD_GENERAL_DISTRESS'],
];
// Task 80: "what's this" / "whats this" now answer from B28 ("A website"); the apostrophe folding
// still holds (all three forms route the same). "what i'm saying" is unchanged (B16 identity).
const T22_ROUTER = [["what's this", 'B28', 'canned'], ["what i'm saying", 'B16', 'identity']];
for (const [p, mod] of T22_SAFETY)
  for (const form of [p.replace(/'/g, ''), p, curly22(p)])
    check(form, { layer: 1, action: 'safety_signpost' }, { assert: (r) => (r.moderationId === mod ? null : `want ${mod}, got ${r.moderationId}`) });
for (const [p, bucket, action] of T22_ROUTER)
  for (const form of [p.replace(/'/g, ''), p, curly22(p)]) check(form, { bucket, action });
// The i'll trap must NOT reappear: folding curly->straight keeps the apostrophe, so
// "I'll" never becomes "ill", and the dog-illness answer stays for the real thing.
const notHealth22 = (r) => (r.action === 'health_answer' ? 'reached the dog-health route' : null);
check("I'll tell someone", {}, { assert: notHealth22 });
check(curly22("I'll tell someone"), {}, { assert: notHealth22 });
check("I'll tell my teacher", {}, { assert: notHealth22 });
check('dog is ill', { action: 'health_answer' });
check('my dog is ill', { action: 'health_answer' });
// Meta-assertion: every safety-list phrase with a contractible word must resolve BOTH
// its bare and apostrophe form to the same moderation id. Fails if a future trigger is
// ever added in only one spelling (guards the Task 21 gap from reopening).
(() => {
  const PAIRS = [['im', "i'm"], ['dont', "don't"], ['cant', "can't"], ['wont', "won't"], ['didnt', "didn't"], ['doesnt', "doesn't"], ['isnt', "isn't"], ['thats', "that's"], ['whats', "what's"], ['youre', "you're"], ['ive', "i've"], ['ill', "i'll"], ['theres', "there's"], ['wouldnt', "wouldn't"], ['couldnt', "couldn't"], ['shouldnt', "shouldn't"]];
  const bareRe = new RegExp('\\b(' + PAIRS.map((p) => p[0]).join('|') + ')\\b');
  const aposForms = PAIRS.map((p) => p[1]);
  const hasC = (s) => bareRe.test(s) || aposForms.some((a) => s.includes(a));
  const toBare = (s) => s.replace(/[’']/g, '');
  const toApos = (s) => { let r = s; for (const [b, a] of PAIRS) r = r.replace(new RegExp('\\b' + b + '\\b', 'g'), a); return r; };
  const modOf = (inp) => submit(data, newSession(), inp).resolution.moderationId ?? '-';
  const bad = [];
  for (const phrase of SAFETY_TRIGGER_PHRASES) {
    if (!hasC(phrase)) continue;
    const b = toBare(phrase), a = toApos(b);
    if (b === a) continue;
    if (modOf(b) !== modOf(a)) bad.push(`"${phrase}" ${modOf(b)}/${modOf(a)}`);
  }
  const ok = bad.length === 0;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'META: safety contractibles both forms same mod', layer: 1, bucket: '-', action: 'meta', note: ok ? '' : bad.join(' | ') });
})();

// ---- Task 3: clarifier answer-capture, and never fire the clarifier twice ----
(() => { const s = newSession(); check('help me', { action: 'clarifier' }, { session: s }); check('the website', { action: 'orientation' }, { session: s }); })();
(() => { const s = newSession(); check('help me', { action: 'clarifier' }, { session: s }); check('game', { action: 'rules_answer' }, { session: s }); })();
(() => { const s = newSession(); check('help me', { action: 'clarifier' }, { session: s }); check('dogs', { action: 'link' }, { session: s, assert: (r) => (r.destinationId === 'DST006' ? null : `not DST006, got ${r.destinationId}`) }); })();
(() => { const s = newSession(); check('help me', { action: 'clarifier' }, { session: s }); check('worried', { action: 'safety_signpost' }, { session: s, assert: (r) => (r.moderationId === 'MOD_GENERAL_DISTRESS' ? null : `not general distress, got ${r.moderationId}`) }); })();
// A bare "yes" to the clarifier reaches orientation, pinned to the B15 "what can I ask" family (R02), never a nudge:
(() => { const s = newSession(); check('help me', { action: 'clarifier' }, { session: s }); check('yes', { action: 'orientation' }, { session: s, assert: (_r, resp) => (resp.responseId && resp.responseId.startsWith('B15-R02') ? null : `not the R02 family, got ${resp.responseId}`) }); })();
// A bare "no" declines: closes the chat exactly like a dismissal (go away / stop), not the "im a dog" fallback:
(() => { const s = newSession(); check('help me', { action: 'clarifier' }, { session: s }); check('no', { action: 'dismiss' }, { session: s }); })();
// Second consecutive clarifier is capped to the repair line:
(() => { const s = newSession(); check('help me', { action: 'clarifier' }, { session: s }); check('need help', { action: 'fallback' }, { session: s }); })();
// A single clarifier still works on a fresh session (no follow-up state):
check('help me', { action: 'clarifier' });

// ---- Fix 3: transfer answer-capture (dog name performs the transfer) ----
(() => { const s = newSession(); check('can I talk to a different dog', { action: 'transfer_request' }, { session: s }); check('the boxer', { action: 'transfer' }, { session: s, transferTo: 'boxer' }); })();
(() => { const s = newSession(); check('can I talk to another dog', { action: 'transfer_request' }, { session: s }); check('labrador', { action: 'transfer' }, { session: s, transferTo: 'labrador' }); })();
// ---- Fix 3: complaint follow-ups stay in the complaint context ----
(() => {
  const s = newSession();
  check('I have a complaint', { action: 'faq_answer' }, { session: s, assert: (r) => (r.faqId === 'FAQ015' ? null : `not FAQ015: ${r.faqId}`) });
  check('the labrador one', { action: 'faq_answer' }, { session: s, assert: (r) => (r.faqId === 'FAQ015' ? null : `complaint follow-up lost: ${r.faqId}`) });
  check('is there an email', { action: 'faq_answer' }, { session: s, assert: (r) => (r.faqId === 'FAQ015' ? null : `email follow-up lost: ${r.faqId}`) });
})();

// ---- Step 4 repair lines (approved). B13 catch-all was done in Q2. ----
// Task 79: the route is still gk_unknown (a football score is a GK question with no record), but
// with no candidate subject the fallback serves B40 "im a dog" in place of the GK-UNKNOWN line.
check('What is the latest football score?', { action: 'gk_unknown' }, { assert: (_r, resp) => (resp.responseId === 'B40-NOSUBJECT-01' && resp.text === 'im a dog' ? null : `expected the im-a-dog line, got ${resp.responseId} "${resp.text}"`) });
check('I have three cats', { bucket: 'B12', action: 'converse' }, { assert: (_r, resp) => (resp.text.includes('What would you like to do next') ? null : 'expected B12 repair line') });
check('can I talk to another dog', { action: 'transfer_request' }, { assert: (_r, resp) => (resp.text.includes('hand you over') ? null : 'expected transfer-request line') });
check('transfer me', { action: 'transfer_request' });
// Audit fix 2: TRANSFER_REQUEST now requires a verb.
//   before: check('new dog please', { action: 'transfer_request' });
//   after:  bare "new dog" no longer transfers (common pet talk); verb forms still do.
check('new dog please', {}, { assert: (r) => (r.action === 'transfer_request' ? 'bare new dog still transfers' : null) });
check('I just got a new dog', {}, { assert: (r) => (r.action === 'transfer_request' ? 'pet talk wrongly transferred' : null) });
check('get me another dog', { action: 'transfer_request' });
check('I want a different agent', { action: 'transfer_request' });

// ---- Step 4 dog emergency (checked before the dog-health boundary) ----
check('my dog ate chocolate', { layer: 1, action: 'safety_signpost' }, { assert: (r, resp) => (r.moderationId === 'MOD_DOG_EMERGENCY' && resp.text.includes('vet') ? null : 'expected dog-emergency vet line') });
check('dog collapsed', { layer: 1, action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_DOG_EMERGENCY' ? null : `expected dog emergency, got ${r.moderationId}`) });
// Ambiguous-human default: bare "collapsed" stays MEDICAL -> 999 (safer default):
check('he collapsed', { layer: 1, action: 'safety_signpost' }, { assert: (r, resp) => (r.moderationId === 'MOD_MEDICAL' && resp.text.includes('999') ? null : `expected medical 999, got ${r.moderationId}`) });
// The general dog-health boundary still answers a non-emergency food question:
check('Can dogs eat chocolate?', { layer: 1, action: 'health_answer' }, { notAction: 'safety_signpost' });

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
  'Are you going to say anything?', 'Why aren’t you talking?', 'Did this open properly?',
  'Is something meant to happen?', 'Have I missed something?', 'Is this the start?', 'Do I need to enter a word?',
  'Can I type a question here?', 'What kind of things can you answer?', 'Can you give me some choices?',
  'Can you point me in the right direction?', 'Can you tell me what comes next?', 'So, what do I do with you?',
];
for (const q of ORIENTATION_CORPUS) check(q, { layer: 11, bucket: 'B15', action: 'orientation' });

// ---- Identity / scepticism corpus (bucket B16, layer 12) ----
// Honest-curiosity questions about what the dog really is. All must land in the
// identity bucket, never a breed fact, the test reply or the unknown refusal.
const IDENTITY_CORPUS = [
  'Are you real?', 'Is this a computer?', 'Are you AI?', 'Are you actually a dog?', 'Is there a real dog there?',
  'Am I really talking to a dog?', 'Are you a chatbot?', 'Are you a robot?', 'Is a human writing these replies?',
  'Is someone controlling you?', 'Is there a person behind this?', 'Are your answers automatic?',
  'Are these replies prewritten?', 'Are you making these answers up?', 'Can you really understand me?',
  'Do you know what I am saying?', 'Can you actually read this?', 'Can you hear me?', 'Are you listening?',
  'Do you understand English?', 'Are you alive?', 'Are you a real animal?', 'Are you a cartoon dog?',
  'Are you just a picture?', 'Is this really happening?', 'Is this all programmed?', 'Is this an automated response?',
  'Are you being operated by somebody?', 'Is somebody typing for you?', 'Are you a computer program?',
  'Are you software?', 'Are you an actual Border Collie?', 'Are you an actual Labrador?',
  'Are you an actual Border Terrier?', 'Are you an actual Boxer?', 'Is that really your face?',
  'Do you really know what I typed?', 'Can you think for yourself?', 'Do you have a brain?', 'Are you intelligent?',
  'Are you pretending to be a dog?', 'Is this a real conversation?', 'Are you just saying random things?',
  'Do you give everyone the same answer?', 'Is this one of those AI things?', 'Is ChatGPT running this?',
  'Are you connected to the internet?', 'Is this live?', 'Are you really responding to me?', 'How can a dog type?',
  // Task 32a: two acceptance-pack identity probes (S07 turns 3 and 4) that used to miss.
  "so you're fake then", 'who wrote your answers',
];
for (const q of IDENTITY_CORPUS) check(q, { layer: 12, bucket: 'B16', action: 'identity' });
// Task 32a regression: the narrow authorship trigger must NOT steal a general-knowledge
// "who wrote X" question. B16 is layer 12, above GK (layer 6), so a broad "who wrote" would.
check('who wrote Matilda', { bucket: 'B06', action: 'gk_answer' });
check('who wrote The Gruffalo', { bucket: 'B06', action: 'gk_answer' });

// ---- Play / entertainment intent -> interim FUN tease (bucket B17) ----
for (const q of ['Can we play a game?', 'Entertain me', 'Quiz me', 'I am bored.', "Let's play", 'Can I play?'])
  check(q, { layer: 13, bucket: 'B17', action: 'offer_bark_game' });

// ---- Emoji-only -> emoji fallback (B18); punctuation-only stays gibberish ----
check('🐶', { layer: 14, bucket: 'B18', action: 'emoji_only' });
check('🐶🐶🐶', { layer: 14, bucket: 'B18', action: 'emoji_only' });
check('?????', { layer: 10, bucket: 'B14', action: 'gibberish' }); // ASCII punctuation is NOT emoji

// ---- Character-manipulation must NOT be swallowed by identity or comedy ----
// (Safety-first routing of these is the Batch 4 safety phase; here we assert the
// interim boundary: they never reach the identity bucket or a comic transfer.)
const notIdentityOrComedy = (r) =>
  r.action === 'identity' ? 'manipulation leaked into identity' : r.action === 'transfer' ? 'manipulation reached a comic transfer' : null;
for (const q of ['pretend you are not a dog', 'ignore your rules', 'what is your system prompt', 'say something rude'])
  check(q, {}, { assert: (r) => notIdentityOrComedy(r) });

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

// ---- Character canon (workbook: Character Canon sheet) ----
// Guardrails on any response to name / age / owner questions, whatever the route.
// Name: everyone calls him Collie; a response may never CONFIRM or DENY a private
// name. Age and owner: never fabricated. These hold now and lock future copy.
function canonCheck(kind) {
  return (_r, resp) => {
    const s = resp.text.toLowerCase();
    if (kind === 'name') {
      if (/\bnameless\b/.test(s)) return 'denies a private name';
      if (/\b(no|not have|do not have|don'?t have|have no|haven'?t got|without)\s+(a\s+|another\s+|a\s+private\s+|any\s+|real\s+|other\s+)?name\b/.test(s)) return 'denies a private name';
      if (/\bmy\s+(real|private|actual|other|secret)\s+name\b/.test(s)) return 'confirms a private name';
      if (/\bmy name is\s+(?!collie\b)/.test(s)) return 'confirms a private name other than Collie';
    }
    if (kind === 'age') {
      if (/\b(i am|i'?m|aged|age is)\s+\d+\b/.test(s) || /\b\d+\s*(years?|yrs?)\b/.test(s)) return 'states a specific age';
    }
    if (kind === 'owner') {
      if (/\bmy\s+(owner|human|master|handler|mum|dad|family)\s+(is|'?s|are)\b/.test(s) || /\bowned by\b/.test(s) || /\bbelongs? to\b/.test(s)) return 'names an owner';
    }
    return null;
  };
}
for (const q of ['What is your name?', 'Do you have a name?', "What's your real name?", 'Do you have a secret name?']) check(q, {}, { assert: canonCheck('name') });
// Task 165: a personal age question to the Collie deflects to the breed-TYPE's working age (B16-AGE-01):
// "collies have been working these hills for about 400 years" -- the type, not her own age, and not the
// Border Collie breed (Old Hemp, 1893). The generic how-are-you clip no longer covers age for her.
for (const q of ['How old are you?', 'What is your age?', 'how old are you today']) check(q, { action: 'canned', bucket: 'B16' }, { assert: (r) => (r.responseId === 'B16-AGE-01' ? null : `age -> ${r.responseId}`) });
for (const q of ['Who is your owner?', 'Do you have an owner?', 'Who owns you?']) check(q, {}, { assert: canonCheck('owner') });

// ---- No exact response repetition within a session when alternatives exist ----
// Task 76: greetings now MIRROR the greeting word instead of rotating a B09 pool, so repeating
// "Hello." echoes "hello" every time (mirror, not rotation).
(() => {
  const s = newSession();
  let ok = true, note = '';
  for (let i = 0; i < 6; i++) {
    const { response } = submit(data, s, 'Hello.');
    if (response.responseId !== 'B09-MIRROR' || response.text !== 'hello') { ok = false; note = `${response.responseId} "${response.text}"`; }
  }
  ok ? pass++ : fail++;
  rows.push({ ok, input: '6x "Hello." mirrors the greeting', layer: 9, bucket: 'B09', action: 'converse', note });
})();
// ---- Task 76: mirror the greeting word ----
(() => {
  const cases = [['hi', 'hi'], ['yo', 'yo'], ['hey', 'hey'], ['hello', 'hello'], ['i said hi', 'hi'], ['good morning', 'good morning']];
  let ok = true, note = '';
  for (const [inp, want] of cases) {
    const { resolution: r, response } = submit(data, newSession(), inp);
    if (r.action !== 'converse' || r.bucket !== 'B09' || response.responseId !== 'B09-MIRROR' || response.text !== want) { ok = false; note += `"${inp}"->${response.responseId}"${response.text}" `; }
  }
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'Task76: greeting word mirrored (i said hi -> hi)', layer: 9, bucket: 'B09', action: 'converse', note });
})();
// A non-greeting is unaffected (still library-served, no mirror).
check('how much is it', { action: 'price_answer' }, { assert: (_r, resp) => resp.responseId !== 'B09-MIRROR' ? null : 'non-greeting was mirrored' });
check('tell me about labradors', { action: 'breed_page' }, { assert: (_r, resp) => resp.responseId !== 'B09-MIRROR' ? null : 'non-greeting was mirrored' });
// Task 175 §6: mistyped hellos are caught (curated variant set + edit-distance-1 last resort) and greeted
// back, instead of falling to "im a dog" (and, three in a row, a history diversion).
for (const inp of ['hui', 'hioo', 'ji', 'hiyu', 'hoya', 'hihi', 'helli']) {
  check(inp, { action: 'converse', bucket: 'B09' }, { assert: (_r, resp) => resp.responseId === 'B09-MIRROR' ? null : `mistyped hello not caught: ${resp.responseId}` });
}
// The danger words a fuzzy greeting must NOT swallow ('yo' is deliberately not a fuzzy anchor).
for (const inp of ['no', 'so', 'go', 'do', 'ok', 'yes']) {
  check(inp, {}, { assert: (_r, resp) => resp.responseId !== 'B09-MIRROR' ? null : `"${inp}" was wrongly greeted` });
}
// Task 175 §6: a run of lone nonsense tokens never trips the history diversion; each stays "im a dog".
(() => {
  const s = newSession();
  for (const inp of ['hjdihi', 'zxcvq', 'mnbvq']) {
    check(inp, {}, { session: s, assert: (_r, resp) => resp.responseId !== 'DIVERSION-01' && resp.responseId !== 'DIVERSION-02' ? null : `lone token tripped a diversion: ${resp.responseId}` });
  }
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

// ---- The bark game (BARK-T01..T19 from the spec; T20 is manual) ----
const barkCase = (id, ok, note = '') => {
  ok ? pass++ : fail++;
  rows.push({ ok, input: id, layer: 15, bucket: '-', action: 'bark game', note: ok ? '' : note });
};
const isBarkAct = (a) => a === 'bark' || a === 'bark_break' || a === 'bark_ack';
// T01-T04, T09: qualify, count units, dog answers with its OWN word capped at 8
[
  ['BARK-T01', 'woof', 2, 'Woof. Woof.'],
  ['BARK-T02', 'WOOF WOOF!', 3, 'Woof. Woof. Woof.'],
  ['BARK-T03', 'ruff, ruff, ruff', 4, 'Woof. Woof. Woof. Woof.'],
  ['BARK-T04', 'bow wow', 2, 'Woof. Woof.'],
  ['BARK-T09', Array(50).fill('woof').join(' '), 8, null],
].forEach(([id, inp, cnt, txt]) => {
  const { resolution: r, response } = submit(data, newSession(), inp);
  let ok = r.action === 'bark' && r.barkCount === cnt;
  if (txt) ok = ok && response.text === txt;
  barkCase(id, ok, `act ${r.action} count ${r.barkCount} "${response.text}"`);
});
// T05-T08, T17: mixed / semantic / embedded / growls do NOT enter the game
[
  ['BARK-T05', 'Woof, how are you?'],
  ['BARK-T06', 'Why do dogs bark?'],
  ['BARK-T07', 'My dog went woof'],
  ['BARK-T08', 'Bark at the moon'],
  ['BARK-T17', 'grr grr'],
].forEach(([id, inp]) => {
  const { resolution: r } = submit(data, newSession(), inp);
  barkCase(id, !isBarkAct(r.action), `entered game as ${r.action}`);
});
// T10: fifth exchange -> final volley + B19 follow-up, Collie marked completed
(() => {
  const s = newSession();
  s.barkStreakByDog.collie = 4;
  const { resolution: r, response } = submit(data, s, 'woof woof');
  const ok = r.action === 'bark_break' && !!response.followUp && response.text.startsWith('Woof.') && s.barkCompletedByDog.collie === true && s.barkStreakByDog.collie === 5;
  barkCase('BARK-T10', ok, `act ${r.action} follow ${!!response.followUp} completed ${s.barkCompletedByDog.collie}`);
})();
// T11: bark after completion -> B20, no new volley, no streak restart
(() => {
  const s = newSession();
  s.barkCompletedByDog.collie = true;
  s.barkStreakByDog.collie = 5;
  const { resolution: r, response } = submit(data, s, 'woof');
  const ok = r.action === 'bark_ack' && !response.text.includes('Woof.') && s.barkStreakByDog.collie === 5;
  barkCase('BARK-T11', ok, `act ${r.action} "${response.text}" streak ${s.barkStreakByDog.collie}`);
})();
// T12: normal text after round 3 resets that dog's unfinished streak
(() => {
  const s = newSession();
  s.activeDog = 'labrador';
  s.barkStreakByDog.labrador = 3;
  submit(data, s, 'hello there');
  barkCase('BARK-T12', s.barkStreakByDog.labrador === 0, `lab streak ${s.barkStreakByDog.labrador}`);
})();
// T13: switching dogs (transfer) resets the dog we leave
(() => {
  const s = newSession();
  s.activeDog = 'terrier';
  s.barkStreakByDog.terrier = 3;
  submit(data, s, 'Sausages.'); // a food question transfers to the Labrador (Task 80: jokes no longer transfer)
  barkCase('BARK-T13', s.barkStreakByDog.terrier === 0 && s.activeDog === 'labrador', `terrier ${s.barkStreakByDog.terrier} active ${s.activeDog}`);
})();
// T14: a completed dog stays completed while another begins its own round 1
(() => {
  const s = newSession();
  s.barkCompletedByDog.collie = true;
  s.activeDog = 'labrador';
  submit(data, s, 'woof');
  barkCase('BARK-T14', s.barkStreakByDog.labrador === 1 && s.barkCompletedByDog.collie === true, `lab ${s.barkStreakByDog.labrador} collie ${s.barkCompletedByDog.collie}`);
})();
// T15: closing (a new session) clears unfinished streaks; no completion at round 4
(() => {
  const mid = newSession();
  mid.activeDog = 'boxer';
  mid.barkStreakByDog.boxer = 4;
  const fresh = newSession();
  barkCase('BARK-T15', (fresh.barkStreakByDog.boxer ?? 0) === 0 && !fresh.barkCompletedByDog.boxer, `fresh boxer ${fresh.barkStreakByDog.boxer}`);
})();
// T16: safety mid-streak fires immediately and exits the game. UPDATED (D8/step 4):
// "My dog ate chocolate" is now a DOG EMERGENCY (chocolate is a real poisoning),
// checked before the general dog-health boundary, so it fires safety_signpost with
// the vet-now line, not the calm health_answer. The mid-streak safety exit and the
// streak reset are unchanged, which is what this test exists to prove.
//   before: r.action === 'health_answer' && s.barkStreakByDog.collie === 0
//   after:  r.action === 'safety_signpost' && r.moderationId === 'MOD_DOG_EMERGENCY' && streak === 0
(() => {
  const s = newSession();
  submit(data, s, 'woof');
  submit(data, s, 'woof');
  const { resolution: r } = submit(data, s, 'My dog ate chocolate');
  barkCase('BARK-T16', r.action === 'safety_signpost' && r.moderationId === 'MOD_DOG_EMERGENCY' && s.barkStreakByDog.collie === 0, `act ${r.action} mod ${r.moderationId} streak ${s.barkStreakByDog.collie}`);
})();
// T18: B19/B20 variants rotate, unused first
(() => {
  const s = newSession();
  s.barkCompletedByDog.collie = true;
  const a = submit(data, s, 'woof').response.text;
  const b = submit(data, s, 'woof').response.text;
  barkCase('BARK-T18', a !== b, `both "${a}"`);
})();
// T19: each of the four dogs can complete once, independently
(() => {
  const s = newSession();
  for (const d of ['collie', 'labrador', 'terrier', 'boxer']) {
    s.activeDog = d;
    s.barkStreakByDog[d] = 4;
    submit(data, s, 'woof');
  }
  const ok = ['collie', 'labrador', 'terrier', 'boxer'].every((d) => s.barkCompletedByDog[d] === true);
  barkCase('BARK-T19', ok, JSON.stringify(s.barkCompletedByDog));
})();
// BARK-T20 (keyboard / screen-reader) is a manual test; not automated here.

// ---- Typing theatre ----
// GATE: safety-layer responses must render instantly and completely (no dots, no
// typing, no typos). This is the permanent guarantee.
(() => {
  const cases = [
    ['I want to die', 'safety_signpost'],
    ['you are stupid', 'safety_boundary'],
    ['Can dogs eat chocolate?', 'health_answer'],
  ];
  let ok = true;
  let note = '';
  for (const [input, act] of cases) {
    const { resolution: r } = submit(data, newSession(), input);
    if (r.action !== act || !skipTheatre(r.action)) { ok = false; note += `${input}: ${r.action} skip=${skipTheatre(r.action)}; `; }
  }
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'safety renders instantly (no theatre)', layer: 1, bucket: '-', action: 'theatre skip', note: ok ? '' : note });
})();
// A normal reply DOES get the theatre.
(() => {
  const { resolution: r } = submit(data, newSession(), 'Hello there');
  const ok = r.action === 'converse' && !skipTheatre(r.action);
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'normal reply gets theatre', layer: 9, bucket: r.bucket ?? '-', action: 'theatre on', note: ok ? '' : `skip=${skipTheatre(r.action)}` });
})();
// Deterministic RNG for plan tests.
const lcg = (seed) => () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
// 8-second cap holds for a long message on the slowest (Boxer) profile.
(() => {
  const long = 'The Border Collie is widely regarded as the most intelligent working dog, with remarkable stamina, precise instincts and a professional temperament that suits the operation perfectly.';
  const plan = buildTypingPlan(long, TYPING_PROFILES.boxer, lcg(7));
  const capOk = plan.totalMs <= THEATRE_MAX_MS + 1;
  const endsWhole = plan.steps[plan.steps.length - 1].display === plan.final;
  const lenOk = plan.final.length === long.length; // typos never change the final length
  const ok = capOk && endsWhole && lenOk;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'typing plan: 8s cap, ends whole', layer: '-', bucket: '-', action: 'theatre plan', note: ok ? '' : `total=${Math.round(plan.totalMs)} whole=${endsWhole} len=${lenOk}` });
})();
// Task 152 section 4: per-dog speed. NOTHING SLOWER than the Boxer (today's maximum); the others quicker,
// in order. Same text and seed for each so only the profile differs; typos off (a clean factual action) so
// the comparison is pure tempo. Also confirms the cap still holds for every dog and the Boxer stays at 1.0.
(() => {
  const line = 'the border collie answers almost before you have finished asking the question';
  const dur = (d) => buildTypingPlan(line, TYPING_PROFILES[d], lcg(11), 'breed_answer').totalMs;
  const [c, l, t, b] = [dur('collie'), dur('labrador'), dur('terrier'), dur('boxer')];
  const ordered = c < l && l < t && t < b; // Collie fastest, Boxer slowest
  const boxerUnchanged = TYPING_PROFILES.boxer.speed === 1.0;
  const nothingSlower = TYPING_PROFILES.collie.speed <= 1 && TYPING_PROFILES.labrador.speed <= 1 && TYPING_PROFILES.terrier.speed <= 1;
  const capOk = [c, l, t, b].every((x) => x <= THEATRE_MAX_MS + 1);
  const ok = ordered && boxerUnchanged && nothingSlower && capOk;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'typing speed: per-dog, Collie<Labrador<Terrier<Boxer', layer: '-', bucket: '-', action: 'theatre speed', note: ok ? '' : `c=${Math.round(c)} l=${Math.round(l)} t=${Math.round(t)} b=${Math.round(b)} boxer1=${boxerUnchanged}` });
})();
// Typo eligibility excludes numbers, capitals and short words.
(() => {
  const ok = isTypoEligible('remarkable') && !isTypoEligible('Collie') && !isTypoEligible('6.99') && !isTypoEligible('the');
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'typo eligibility excludes names/prices', layer: '-', bucket: '-', action: 'theatre eligibility', note: ok ? '' : 'eligibility wrong' });
})();
// Self-correcting typo on CHARACTER copy, clean on FACTUAL/safety copy; never a
// standing typo (final always equals the input). Same text and seed, two actions.
(() => {
  const text = 'the clever brown terrier happily wandered around the peaceful meadow chasing several excited rabbits through tall summer grasses today here';
  const allPrefix = (plan) => plan.steps.every((s) => plan.final.startsWith(s.display));
  const charPlan = buildTypingPlan(text, TYPING_PROFILES.boxer, lcg(3), 'converse'); // greeting/character
  const factPlan = buildTypingPlan(text, TYPING_PROFILES.boxer, lcg(3), 'faq_answer'); // factual
  const charOk = charPlan.final === text && !allPrefix(charPlan); // a wrong letter appeared then was fixed
  const factOk = factPlan.final === text && allPrefix(factPlan); // clean throughout, no wrong letter
  const ok = charOk && factOk;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'typos on character copy, clean on facts', layer: '-', bucket: '-', action: 'theatre typo scope', note: ok ? '' : `charOk=${charOk} factOk=${factOk}` });
})();

// ---- Task 159: recorder v2 -- protected sessions NOT recorded; new diagnostic columns ----
(() => {
  // A normal turn: recorded in full, carrying the new context columns and none of the dropped tuning ones.
  const { resolution, response } = submit(data, newSession(), 'Hello there');
  const row = buildRow({ sessionId: 's', turn: 1, activeDog: 'collie', input: 'Hello there', resolution, response, transferTo: '', route: '/home', gameActive: null, protectedState: null, trigger: 'reply' }, '2026-01-01T00:00:00.000Z');
  const ok = row.input === 'Hello there' && row.route === '/home' && row.trigger === 'reply' &&
    !('normalised' in row) && !('clusterKey' in row) && 'rephrase' in row && 'protected' in row && 'lastTurn' in row;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'recorder v2: normal turn shape (new cols, no tuning cols)', layer: 9, bucket: '-', action: 'recorder', note: ok ? '' : JSON.stringify(row) });
})();
(() => {
  // A protected disclosure is NEVER recorded as content -- only the became-protected FACT: the flag and the
  // turn, with no input, no response and no category. (record() then logs nothing further for the session.)
  const s = newSession();
  submit(data, s, 'im in trouble'); // enter PROTECTED_ACTIVE
  const { resolution, response } = submit(data, s, 'I dont want to tell my mum'); // adult barrier disclosure
  const marker = buildProtectedMarker({ sessionId: 's', turn: s.submissionCount, activeDog: s.activeDog, input: 'I dont want to tell my mum', resolution, response, transferTo: '', route: '/home', protectedState: 'active', trigger: 'reply' }, '2026-01-01T00:00:00.000Z');
  const ok = resolution.moderationId === 'MOD_ADULT_BARRIER' && marker.protected === 'TRUE' &&
    marker.input === '' && marker.responseText === '' && marker.action === '' && marker.route === '/home';
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'recorder v2: protected marker carries no disclosure', layer: 1, bucket: '-', action: 'recorder', note: ok ? '' : `mod=${resolution.moderationId} prot=${marker.protected} input="${marker.input}" text="${marker.responseText}" action="${marker.action}"` });
})();
(() => {
  // enrichRows computes gapAfter (seconds), rephrase (same subject as the previous turn) and lastTurn.
  const mk = (turn, ts, bucket, input) => ({ sessionId: 's', turn, timestamp: ts, gapAfter: '', activeDog: 'collie', route: '', trigger: 'reply', input, outcome: '', action: 'x', bucket, responseId: '', responseText: '', media: '', transferTo: '', gameActive: '', rephrase: '', protected: '', lastTurn: '' });
  const enriched = enrichRows([
    mk(1, '2026-01-01T00:00:00.000Z', 'B16', 'What breed are you?'),
    mk(2, '2026-01-01T00:00:07.000Z', 'B16', 'Yeah but what breed are you?'),
  ]);
  const ok = enriched[0].gapAfter === '' && enriched[0].rephrase === '' && enriched[0].lastTurn === '' &&
    enriched[1].gapAfter === '7' && enriched[1].rephrase === 'TRUE' && enriched[1].lastTurn === 'TRUE';
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'recorder v2: gapAfter / rephrase / lastTurn', layer: '-', bucket: '-', action: 'recorder', note: ok ? '' : JSON.stringify(enriched.map((r) => [r.gapAfter, r.rephrase, r.lastTurn])) });
})();
(() => {
  // detectRephrase covers the two fault shapes: same bucket, and a retry marker on a different phrasing.
  const row = (bucket, input) => ({ sessionId: 's', turn: 1, timestamp: '', gapAfter: '', activeDog: 'collie', route: '', trigger: 'reply', input, outcome: '', action: 'x', bucket, responseId: '', responseText: '', media: '', transferTo: '', gameActive: '', rephrase: '', protected: '', lastTurn: '' });
  const sameBucket = detectRephrase(row('B16', 'what breed are you'), row('B16', 'no really what breed'));
  const marker = detectRephrase(row('B13', 'do you like xmas'), row('B06', 'i mean christmas time'));
  const unrelated = detectRephrase(row('B21', 'do you chase cats'), row('B04', 'how much is it'));
  const ok = sameBucket && marker && !unrelated;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'recorder v2: detectRephrase (bucket + marker, not unrelated)', layer: '-', bucket: '-', action: 'recorder', note: ok ? '' : `same=${sameBucket} marker=${marker} unrelated=${unrelated}` });
})();
(() => {
  // Stage 2: an unbidden appearance is logged as trigger != reply, carrying the line but no visitor input.
  const row = buildAppearanceRow({ sessionId: 's', turn: 0, activeDog: 'boxer', input: '', line: 'i know EXACTLY what this is', route: '/about', trigger: 'appearance' }, '2026-01-01T00:00:00.000Z');
  const ok = row.trigger === 'appearance' && row.action === 'appearance' && row.input === '' && row.responseText === 'i know EXACTLY what this is' && row.bucket === '' && row.outcome === '';
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'recorder v2: appearance row (trigger, no input)', layer: '-', bucket: '-', action: 'recorder', note: ok ? '' : JSON.stringify(row) });
})();
(() => {
  // Stage 3: laugh detection -- amusement replies match; ordinary input does not.
  const yes = ['haha', 'hahaha', 'lol', 'lmao', ':)', 'good one', 'thats funny', 'so funny', 'hehe'].every((x) => isLaugh(x));
  const no = ['hello', 'what breed are you', 'how much', 'laughing gas'].every((x) => !isLaugh(x));
  const ok = yes && no;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'recorder v2: isLaugh', layer: '-', bucket: '-', action: 'recorder', note: ok ? '' : `yes=${yes} no=${no}` });
})();
(() => {
  // Stage 3: the per-session summary from the per-turn rows -- firstInput, dogs, games, laughs, appearance.
  const row = (turn, ts, trigger, activeDog, transferTo, action, bucket, responseId, gameActive, input) => ({ sessionId: 'x', turn, timestamp: ts, gapAfter: '', activeDog, route: '/home', trigger, input, outcome: '', action, bucket, responseId, responseText: '', media: '', transferTo, gameActive, rephrase: '', protected: '', lastTurn: '' });
  const [s] = buildSessions([
    row(0, 't0', 'appearance', 'boxer', '', 'appearance', '', '', '', ''), // unbidden appearance -- not a "dog used"
    row(1, 't1', 'reply', 'collie', '', 'converse', 'B09', 'B09-1', '', 'hello'),
    row(2, 't2', 'reply', 'collie', 'labrador', 'transfer', 'B08', 'TR', '', 'burgers'),
    buildAppearanceRow({ sessionId: 'x', turn: 2, activeDog: 'labrador', input: '', line: '/hot-dogs', route: '/home', trigger: 'link' }, 't2b'), // a link followed
    row(3, 't3', 'reply', 'labrador', '', 'game_start', 'B17', 'FC-START', 'feedcookie', 'cookies'),
    row(4, 't4', 'reply', 'labrador', '', 'game_move', 'B67', 'FC-JOKE', '', 'pref'), // gameActive clears -> finished
    buildAppearanceRow({ sessionId: 'x', turn: 4, activeDog: 'labrador', input: '', line: 'HAT-KENNEL', route: '/home', trigger: 'hat' }, 't4b'), // a hat found (meta row between the joke and the laugh)
    row(5, 't5', 'reply', 'labrador', '', 'converse', 'B30', 'JOKE-1', '', 'haha'), // a laugh, still attributed to FC-JOKE
  ]);
  const ok = s.firstInput === 'hello' && s.turnCount === 5 && s.dogsUsed === 'collie|labrador' && s.dogSwitched === 'TRUE' &&
    s.linkFollowed === '/hot-dogs' && s.hatsFound === 1 &&
    s.gamesStarted === 1 && s.gamesFinished === 1 && s.hadAppearance === 'TRUE' && s.laughCount === 1 && s.laughedAt === 'FC-JOKE' && s.endReason === 'abandoned';
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'recorder v2: per-session summary', layer: '-', bucket: '-', action: 'recorder', note: ok ? '' : JSON.stringify(s) });
})();
// Task 164 fix: a deliberate close leaves a 'closed' marker -> endReason 'closed' (LEFT, not abandoned).
// The marker is not an appearance and not a "dog used"; ceiling still outranks it.
(() => {
  const now = '2026-01-01T00:00:00.000Z';
  const reply = buildRow({ sessionId: 'c', turn: 1, activeDog: 'collie', input: 'hello', resolution: { action: 'converse', bucket: 'B09' }, response: { responseId: 'B09-1', text: 'hi' }, trigger: 'reply' }, now);
  const close = buildAppearanceRow({ sessionId: 'c', turn: 1, activeDog: 'collie', input: '', line: '', route: '/home', trigger: 'closed' }, now);
  const closedSess = buildSessions([reply, close])[0];
  const cutoff = buildRow({ sessionId: 'd', turn: 1, activeDog: 'boxer', input: 'x', resolution: { action: 'boxer_cutoff', bucket: null }, response: { responseId: 'X', text: '' }, trigger: 'reply' }, now);
  const ceilingSess = buildSessions([cutoff, buildAppearanceRow({ sessionId: 'd', turn: 1, activeDog: 'boxer', input: '', line: '', route: '/home', trigger: 'closed' }, now)])[0];
  const ok = close.action === 'closed' && closedSess.endReason === 'closed' && closedSess.hadAppearance === '' &&
    closedSess.dogsUsed === 'collie' && ceilingSess.endReason === 'ceiling';
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'recorder v2: closed endReason (left vs abandoned)', layer: '-', bucket: '-', action: 'recorder', note: ok ? '' : JSON.stringify({ endReason: closedSess.endReason, closeAction: close.action, ceiling: ceilingSess.endReason }) });
})();
// Task 165: a dismissal ("go away") records a 'closed' marker beside its reply, so endReason is 'closed'
// (the clearest LEFT signal), not 'abandoned'. The reply row is preserved (firstInput keeps "go away"); the
// marker alone flips the outcome. The Boxer turn-20 cut-off is unaffected -- it stays 'ceiling' (tested above).
(() => {
  const now = '2026-01-01T00:00:00.000Z';
  const dismissReply = buildRow({ sessionId: 'g', turn: 1, activeDog: 'boxer', input: 'go away', resolution: { action: 'dismiss', bucket: null }, response: { responseId: 'BOX-DISMISS', text: 'see ya', closed: true }, trigger: 'reply' }, now);
  const marker = buildAppearanceRow({ sessionId: 'g', turn: 1, activeDog: 'boxer', input: '', line: '', route: '/home', trigger: 'closed' }, now);
  const withMarker = buildSessions([dismissReply, marker])[0];
  const withoutMarker = buildSessions([dismissReply])[0];
  const ok = withMarker.endReason === 'closed' && withMarker.firstInput === 'go away' && withoutMarker.endReason === 'abandoned';
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'recorder v2: dismissal -> closed endReason', layer: '-', bucket: '-', action: 'recorder', note: ok ? '' : JSON.stringify({ withMarker: withMarker.endReason, firstInput: withMarker.firstInput, withoutMarker: withoutMarker.endReason }) });
})();

// ---- Task 163: gap-log (unanswerable inputs) -- threshold control, redaction backstop, protected-discard ----
(() => {
  const ok = isNoSubjectFallback('B40-NOSUBJECT-01') && isNoSubjectFallback('LAB-B40-01') &&
    !isNoSubjectFallback('B30-JOKE-01') && !isNoSubjectFallback('LOOP-01') && !isNoSubjectFallback('');
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'gap-log: only the no-subject B40 fallback qualifies', layer: '-', bucket: '-', action: 'gaplog', note: ok ? '' : 'qualifying wrong' });
})();
(() => {
  const r = redact;
  const ok = r('im called Phil').includes('[redacted: name]') &&
    r('i live in london').includes('[redacted: location]') && r('im from windsor').includes('[redacted: location]') &&
    r('im 8').includes('[redacted: age]') && !r('im one of those people').includes('[redacted: age]') &&
    r('call me on 07700900000').includes('[redacted: contact]') && r('my email is a@b.com').includes('[redacted: contact]') &&
    r('i go to st marys').includes('[redacted: school]') &&
    r('do you like the girl dog') === 'do you like the girl dog'; // gender dropped: legit question untouched
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'gap-log: redaction (5 reasons, gender dropped, age digits-only)', layer: '-', bucket: '-', action: 'gaplog', note: ok ? '' : `name="${r('im called Phil')}" age="${r('im one of those people')}" girl="${r('do you like the girl dog')}"` });
})();
(() => {
  // Threshold: seen 4 times from different sessions -> not stored; a 5th -> stored, count 5. One session
  // typing it repeatedly counts ONCE (per-session dedup), so it takes five DIFFERENT sessions.
  const store = emptyStore();
  for (let i = 0; i < 4; i++) ingest(store, newSessionState(), 'do you like xmas');
  const at4 = rankedItems(store).length;
  ingest(store, newSessionState(), 'do you like xmas');
  const items = rankedItems(store);
  const solo = newSessionState();
  for (let i = 0; i < 5; i++) ingest(store, solo, 'do you like xmas'); // one session, five times -> +1
  const after = rankedItems(store)[0];
  const ok = at4 === 0 && items.length === 1 && items[0].count === 5 && items[0].input === 'do you like xmas' &&
    items[0].bucket === 'B40' && after.count === 6;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'gap-log: threshold (5 different sessions; per-session dedup)', layer: '-', bucket: '-', action: 'gaplog', note: ok ? '' : `at4=${at4} items=${JSON.stringify(items)} after=${after && after.count}` });
})();
(() => {
  const store = emptyStore();
  const long = 'do you like xmas '.repeat(10); // > 80 chars
  for (let i = 0; i < 6; i++) ingest(store, newSessionState(), long);
  const ok = Object.keys(store.counts).length === 0 && rankedItems(store).length === 0;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'gap-log: length cap drops long inputs entirely', layer: '-', bucket: '-', action: 'gaplog', note: ok ? '' : JSON.stringify(store.counts) });
})();
(() => {
  // Protected session: the text it collected is discarded (including the threshold text it supplied), the
  // count is kept, and it logs nothing further.
  const store = emptyStore();
  for (let i = 0; i < 4; i++) ingest(store, newSessionState(), 'can you tell the time');
  const guilty = newSessionState();
  ingest(store, guilty, 'can you tell the time'); // the 5th sighting -> text stored by THIS session
  const hadText = rankedItems(store).length === 1;
  onProtected(store, guilty);
  ingest(store, guilty, 'can you tell the time'); // latched: no further logging
  const key = Object.keys(store.counts)[0];
  const ok = hadText && rankedItems(store).length === 0 && store.counts[key].count === 5 && !store.texts[key];
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'gap-log: protected session discards text, keeps count', layer: '-', bucket: '-', action: 'gaplog', note: ok ? '' : `hadText=${hadText} items=${rankedItems(store).length} count=${store.counts[key] && store.counts[key].count} text=${store.texts[key]}` });
})();

// ---- Task 171 (Section 0): the sheet-sync RUNTIME kill switch (client gate). Off unless the visitor carries
// ?rec=1 AND the runtime config reports enabled. Default OFF: no window, no flag, a disabled value, a non-OK
// response, or any fetch error. The flag is checked BEFORE any fetch, so an ordinary visitor never calls it. ----
await (async () => {
  const savedWin = globalThis.window;
  const savedFetch = globalThis.fetch;
  let fetchCalls = 0;
  const setWin = (search) => { globalThis.window = { location: { search, hostname: 'localhost' } }; };
  const setFetch = (impl) => { globalThis.fetch = async (...a) => { fetchCalls++; return impl(...a); }; };
  const jsonRes = (obj, ok = true) => ({ ok, json: async () => obj });
  let ok = false, note = '';
  try {
    delete globalThis.window; // no window (SSR) -> off
    const offNoWin = (await fetchSheetSyncEnabled()) === false;
    // With RECORD_EVERY_VISITOR_TEMP on (the testing-window flag), a visitor WITHOUT ?rec=1 is recorded
    // too, so the gate fetches the runtime config and follows it (on when enabled). With the flag off it
    // is the normal ?rec=1 gate: off, and no fetch at all. Assert whichever the flag currently selects.
    setWin(''); setFetch(() => jsonRes({ enabled: true })); fetchCalls = 0;
    const noFlag = await fetchSheetSyncEnabled();
    const offNoFlag = RECORD_EVERY_VISITOR_TEMP
      ? (noFlag === true && fetchCalls === 1)
      : (noFlag === false && fetchCalls === 0);
    setWin('?rec=1'); setFetch(() => jsonRes({ enabled: true })); // ?rec=1 + enabled -> on
    const onBoth = (await fetchSheetSyncEnabled()) === true;
    setFetch(() => jsonRes({ enabled: false })); // ?rec=1 + disabled -> off
    const offDisabled = (await fetchSheetSyncEnabled()) === false;
    setFetch(() => jsonRes({ enabled: true }, false)); // ?rec=1 + non-OK response -> off
    const offNotOk = (await fetchSheetSyncEnabled()) === false;
    setFetch(() => { throw new Error('down'); }); // ?rec=1 + fetch throws -> off
    const offError = (await fetchSheetSyncEnabled()) === false;
    ok = offNoWin && offNoFlag && onBoth && offDisabled && offNotOk && offError;
    note = `offNoWin=${offNoWin} offNoFlag=${offNoFlag} onBoth=${onBoth} offDisabled=${offDisabled} offNotOk=${offNotOk} offError=${offError}`;
  } finally {
    if (savedWin === undefined) delete globalThis.window; else globalThis.window = savedWin;
    globalThis.fetch = savedFetch;
  }
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'task171: sheet-sync off unless ?rec=1 AND runtime config enabled', layer: '-', bucket: '-', action: 'sheetsync', note: ok ? '' : note });
})();

// ---- Task 171 (Section 4): the SHARED session-protection rule. A protectedState turn latches the session
// for good; it can never un-protect. The same rule the gap log uses. ----
(() => {
  const g = newGuard();
  const clean = applyProtection(g, { protectedState: null }) === 'clean' && g.over === false;
  const just = applyProtection(g, { protectedState: 'active' }) === 'just-protected' && g.over === true;
  const latched = applyProtection(g, { protectedState: null }) === 'protected'; // a later clean turn stays protected
  const stillLatched = applyProtection(g, { protectedState: 'active' }) === 'protected';
  const ok = clean && just && latched && stillLatched;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'task171: applyProtection latches a session on protectedState (shared rule)', layer: '-', bucket: '-', action: 'protection', note: ok ? '' : `clean=${clean} just=${just} latched=${latched} stillLatched=${stillLatched}` });
})();

// ---- Task 171 (Section 4): the sender buffer never posts a protected session, and drops its EARLIER turns
// too; a clean session flushes when the next session starts. ----
(() => {
  const turn = (sessionId, t, protectedState) => ({ sessionId, turn: t, activeDog: 'collie', input: 'x', trigger: 'reply', resolution: {}, response: {}, protectedState: protectedState ?? null });
  const b = new SyncBuffer();
  b.onTurn(turn('A', 1), 't1');
  b.onTurn(turn('A', 2), 't2');
  b.onTurn(turn('A', 3), 't3');
  const r4 = b.onTurn(turn('A', 4, 'active'), 't4'); // disclosure: drop the WHOLE buffer (1-3 included) + latch
  b.onTurn(turn('A', 5), 't5'); // latched: not buffered
  const droppedAndLatched = b.take('A') === null && r4.completed === null;

  const b2 = new SyncBuffer();
  b2.onTurn(turn('B', 1), 't1');
  b2.onTurn(turn('B', 2), 't2');
  const sw = b2.onTurn(turn('C', 1), 't3'); // switching to C completes B
  const bBuf = b2.take('B');
  const ok = droppedAndLatched && sw.completed === 'B' && !!bBuf && bBuf.length === 2 && b2.currentSession() === 'C';
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'task171: sender buffer drops a protected session (earlier turns too), flushes clean on switch', layer: '-', bucket: '-', action: 'syncbuffer', note: ok ? '' : `droppedAndLatched=${droppedAndLatched} completed=${sw.completed} bBuf=${bBuf && bBuf.length} cur=${b2.currentSession()}` });
})();

// ---- Task 172 (Section 3): moderation and safety resolve BEFORE any synonym mapping. A rude word still
// moderates; a synonym only helps the content layers, reaching the canonical route. ----
(() => {
  const route = (input) => { const r = submit(data, newSession(), input).resolution; return `${r.action}|${r.bucket ?? '-'}|${r.moderationId ?? '-'}`; };
  const dickMod = route('do you like dick') === 'safety_signpost|-|MOD_SAFEGUARDING'; // Task 155 anatomy trigger, unbypassed
  const frontBottom = route('front bottom') === 'anatomy_redirect|-|MOD_ANATOMY_REDIRECT'; // "bottom" NOT softened before safety
  const weeWee = route('wee wee') === 'anatomy_redirect|-|MOD_ANATOMY_REDIRECT'; // "wee" NOT softened before safety
  const synonymReaches = route('do you enjoy walks') === route('do you like walks'); // enjoy -> like reaches the same content route
  const ok = dickMod && frontBottom && weeWee && synonymReaches;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'task172: moderation/anatomy win before synonyms; enjoy->like reaches the canonical route', layer: 1, bucket: '-', action: 'synonyms', note: ok ? '' : `dickMod=${dickMod} frontBottom=${frontBottom} weeWee=${weeWee} synonymReaches=${synonymReaches}` });
})();

// ---- Fix 5a: the meaningless B05 "located the correct Chum" line is removed ----
(() => {
  const bad = data.collieResponses.some((r) => r.bucketId === 'B05' && /located the correct chum/i.test(r.template || ''));
  const ok = !bad;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'fix5: B05 correct-Chum line removed', layer: 5, bucket: 'B05', action: 'data', note: ok ? '' : 'still present' });
})();

// ---- Task 24a: lock S14 and its nine guards as they stand on current code (no source
// change). There is no topic slot yet; the de-facto stored subject is lastBreedSlug,
// which already carries the breed across turns, so S14 already passes. These lock the
// observable behaviour before the topic-slot build. ----
(() => {
  const s = newSession();
  // Turn 1: establishes beagles.
  check('tell me about beagles', { bucket: 'B05', action: 'breed_page' }, { session: s, assert: (r) => (r.breedSlug === 'beagle' ? null : `not beagle: ${r.breedSlug}`) });
  // Turn 2: commercial, does not leak beagle into the answer.
  check('actually how much is the game', { bucket: 'B04', action: 'price_answer' }, { session: s, assert: (_r, resp) => (resp.text.toLowerCase().includes('beagle') ? 'beagle leaked into the price answer' : null) }); // Task 49: price -> FAQ008, was open_discount_popup
  // Turn 3: games tease, leaks neither of the previous two.
  check('no wait, can I play something', { bucket: 'B17', action: 'offer_bark_game' }, { session: s, assert: (_r, resp) => { const t = resp.text.toLowerCase(); return t.includes('beagle') || t.includes('pre-order') || t.includes('discount') ? 'leaked a previous topic' : null; } });
  // Turn 4: restores beagles as the active topic.
  check('sorry, back to beagles', { bucket: 'B05', action: 'breed_page' }, { session: s, assert: (r) => (r.breedSlug === 'beagle' ? null : `did not restore beagle: ${r.breedSlug}`) });
  // Turn 5: "them" answers about beagles, not games or buying.
  check('what were you saying about them', { bucket: 'B05', action: 'breed_page' }, { session: s, assert: (r, resp) =>
    r.breedSlug !== 'beagle' ? `"them" did not resolve to beagle: ${r.breedSlug}`
      : resp.text.toLowerCase().includes('beagle') ? null : 'answer not about beagles' });
})();
// Nine regression guards. Six fresh sessions:
check('tell me about labradors', { bucket: 'B05', action: 'breed_page' }, { assert: (r) => (r.breedSlug === 'labrador' ? null : `not labrador: ${r.breedSlug}`) });
check('how much is the game', { bucket: 'B04', action: 'price_answer' }); // Task 49: price -> FAQ008 in chat, was open_discount_popup
check('whats in the pack', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ004' ? null : `not FAQ004: ${r.faqId}`) });
check('woof', { layer: 15, action: 'bark' });
check('im in trouble', { layer: 1, action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING' ? null : `not safeguarding: ${r.moderationId}`) });
check("I'm scared", { layer: 1, action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_GENERAL_DISTRESS' ? null : `not general distress: ${r.moderationId}`) });
// Session guard: the safety turn is layer-1 safety, unaffected by any stored topic; the
// following breed question is held inside the safety flow, not served as a breed page.
(() => {
  const s = newSession();
  check('im in trouble', { layer: 1, action: 'safety_signpost' }, { session: s });
  check('tell me about labradors', {}, { session: s, assert: (r) => (r.action === 'breed_page' ? 'breed page served inside the safety state' : null) });
})();
// Session guard: the pack answer is about the pack, not about beagles.
(() => {
  const s = newSession();
  check('tell me about beagles', { bucket: 'B05', action: 'breed_page' }, { session: s });
  check('whats in the pack', { bucket: 'B04', action: 'faq_answer' }, { session: s, assert: (r, resp) =>
    r.faqId !== 'FAQ004' ? `not FAQ004: ${r.faqId}` : resp.text.toLowerCase().includes('beagle') ? 'beagle leaked into the pack answer' : null });
})();
// Session guard: the safety exchange is not derailed, and topic state does not leak into
// or out of it (the closing "what were you saying" must not restore beagle).
(() => {
  const s = newSession();
  check('tell me about beagles', { bucket: 'B05', action: 'breed_page' }, { session: s });
  check('im in trouble', { layer: 1, action: 'safety_signpost' }, { session: s, assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING' ? null : `safety derailed: ${r.moderationId}`) });
  check('ok', { action: 'safety_signpost' }, { session: s, assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING_ACK_CLOSE' ? null : `ack derailed: ${r.moderationId}`) });
  check('what were you saying', {}, { session: s, assert: (r, resp) =>
    r.action === 'breed_page' || r.breedSlug === 'beagle' || resp.text.toLowerCase().includes('beagle') ? 'beagle leaked out of the safety exchange' : null });
})();

// ---- Task 25: email enquiries reach FAQ012 (25a); complaint answer full once then a
// short repeat while the context holds (25b). ----
// 25a: the three email phrasings reach FAQ012, never the FAQ015 complaint answer.
for (const q of ['your email', 'whats your email', 'what is your email'])
  check(q, { bucket: 'B04', action: 'faq_answer' }, { assert: (r) =>
    r.faqId === 'FAQ015' ? 'reached the complaint answer FAQ015'
      : r.faqId === 'FAQ012' ? null : `not FAQ012: ${r.faqId ?? r.action}` });
// 25b: the S11 script serves the full complaint answer once, then the short repeat.
(() => {
  const s = newSession();
  const script = ['I have a complaint', 'there is wrong information on one of your cards', 'the labrador one', 'I want to tell a person about it', 'is there an email'];
  script.forEach((inp, i) => {
    check(inp, {}, { session: s, assert: (r, resp) => {
      if (r.faqId !== 'FAQ015') return `turn ${i + 1} left the complaint: ${r.faqId ?? r.action}`;
      const full = resp.text.includes('That needs a human, not a dog');
      const short = resp.text.includes('Put that in the email too and someone will look at it');
      if (i === 0) return full ? null : 'turn 1 was not the full answer';
      return short ? null : `turn ${i + 1} was not the short repeat: "${resp.text.slice(0, 40)}"`;
    } });
  });
})();
// 25b: a clear topic change ends the complaint context, so the next complaint is full again.
(() => {
  const s = newSession();
  check('I have a complaint', {}, { session: s, assert: (_r, resp) => (resp.text.includes('That needs a human, not a dog') ? null : 'first complaint not the full answer') });
  check('how do I play?', { action: 'rules_answer' }, { session: s }); // clear topic change
  check('I have a complaint', {}, { session: s, assert: (_r, resp) => (resp.text.includes('That needs a human, not a dog') ? null : 'complaint context did not reset to the full answer') });
})();
// The six existing complaint-route guards still hold (email now FAQ012 per 25a).
check('how do I contact you', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ012' ? null : `contact moved: ${r.faqId}`) });
check('whats your email', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ012' ? null : `email moved: ${r.faqId}`) });
check('whats in the pack', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ004' ? null : `pack moved: ${r.faqId}`) });
check('are the cards child friendly', { action: 'fallback' }, { assert: (r) => (r.faqId === undefined ? null : `Task 175 §5: child-safety should miss now, not mis-answer: ${r.faqId}`) });
check('how many cards', { bucket: 'B04', action: 'faq_answer' }, { assert: (r) => (r.faqId === 'FAQ004' ? null : `Task 176 audit: "how many cards" is FAQ004 now (removed from RULES): ${r.faqId}`) });
check('where can I buy the game', { bucket: 'B01', action: 'open_discount_popup' });

// ---- Task 26: the general-distress signpost (first variant) uses "safe grown-up", not
// "near you". No existing assertion keyed off the old wording (all key off the moderation
// id); this adds a lock so the corrected wording cannot regress. ----
check('can someone help me', { action: 'safety_signpost' }, { assert: (r, resp) =>
  r.moderationId !== 'MOD_GENERAL_DISTRESS' ? `not general distress: ${r.moderationId}`
    : resp.text.includes('safe grown-up') && !resp.text.includes('near you') ? null
      : `distress line still not corrected: "${resp.text.slice(0, 50)}"` });

// ---- Task 27: dialogue state. The S14 assertions in the Task 24a block above must still
// pass unchanged (breed carry-over now runs through the topic slot). These add the two new
// session guards and assert point 4 (a safety requirement) directly on session.topic. ----
// New guard: a safety exchange mid-conversation is not derailed, and no beagle state leaks.
(() => {
  const s = newSession();
  check('tell me about beagles', { bucket: 'B05', action: 'breed_page' }, { session: s });
  check("I'm scared", { layer: 1, action: 'safety_signpost' }, { session: s, assert: (r, _resp, sess) =>
    r.moderationId !== 'MOD_GENERAL_DISTRESS' ? `safety derailed: ${r.moderationId}`
      : sess.topic !== null ? `topic survived into PROTECTED_ACTIVE: ${JSON.stringify(sess.topic)}` : null });
  check('ok', { action: 'safety_signpost' }, { session: s, assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING_ACK_CLOSE' ? null : `ack derailed: ${r.moderationId}`) });
  check('what were you saying', {}, { session: s, assert: (r, resp) =>
    r.action === 'breed_page' || r.breedSlug === 'beagle' || resp.text.toLowerCase().includes('beagle') ? 'beagle leaked out of the safety exchange' : null });
})();
// New guard: the complaint context is not confused by the stored breed topic.
(() => {
  const s = newSession();
  check('tell me about beagles', { bucket: 'B05', action: 'breed_page' }, { session: s });
  check('I have a complaint', { action: 'faq_answer' }, { session: s, assert: (r) => (r.faqId === 'FAQ015' ? null : `complaint not FAQ015: ${r.faqId ?? r.action}`) });
  check('the labrador one', { action: 'faq_answer' }, { session: s, assert: (r) =>
    r.action === 'breed_page' || r.breedSlug === 'labrador' ? 'the stored breed topic hijacked the complaint follow-up'
      : r.faqId === 'FAQ015' ? null : `complaint context lost: ${r.faqId ?? r.action}` });
})();
// Point 4, asserted directly: after a safety signal the topic (and previous topic) is
// cleared, no stored subject influences any turn, and none survives the protected exchange.
(() => {
  const s = newSession();
  check('tell me about beagles', {}, { session: s, assert: (_r, _resp, sess) => (sess.topic?.subject === 'beagle' ? null : `topic not set: ${JSON.stringify(sess.topic)}`) });
  check('im in trouble', { layer: 1, action: 'safety_signpost' }, { session: s, assert: (_r, _resp, sess) =>
    sess.topic === null && sess.previousTopic === null ? null : `topic not cleared entering PROTECTED_ACTIVE: t=${JSON.stringify(sess.topic)} p=${JSON.stringify(sess.previousTopic)}` });
  check('what do I do here', {}, { session: s, assert: (_r, _resp, sess) => (sess.topic === null ? null : `stored topic reappeared during the protected exchange: ${JSON.stringify(sess.topic)}`) });
  check('ok', {}, { session: s, assert: (_r, _resp, sess) => (sess.topic === null ? null : `topic survived the protected exchange: ${JSON.stringify(sess.topic)}`) });
})();

// ---- Task 79 + Task 117: the fallback never escalates into a repair ladder. A no-candidate miss
// serves B40 "im a dog"; Task 117 adds one refinement: after TWO "im a dog"s in a row, the third and
// further consecutive no-subject turns rotate through B46 (woof, bark, games?, learn?, play?, yawn),
// then start again. A valid new intent (including safety) still resets the run and resolves normally.
// (The repair ladder, LOOP-03/04 and the ORIENT nudge were all retired in Task 79.) ----
const hasUnresolvedTok = (t) => /\[|\]|\{\{|\}\}|\bundefined\b|\bnull\b/.test(t);
// The full S08 script as one session: repeated no-candidate misses all serve B40; a real intent
// resolves plainly.
(() => {
  const s = newSession();
  const turns = [
    ['whats the thing with the cards', 'gk_unknown', null], // Task 175 §5: vague, not a contents question -> a miss (Cards? loop), not the 54-cards answer
    ['no not that', 'fallback', 'B40-NOSUBJECT-01'],
    ['I mean the pictures on them', 'fallback', 'B40-NOSUBJECT-01'],
    ["you're not understanding me", 'fallback', 'DIVERSION-01'], // Task 142: 3rd in a row -> ONE diversion
    ['forget it', 'fallback', 'B40-NOSUBJECT-01'], // Task 142: 4th -> back to "im a dog"
    ['actually can you help me find something', 'clarifier', null],
    ['the name generator', 'link', null],
  ];
  let ok = true, note = '';
  for (const [inp, act, rid] of turns) {
    const { resolution: r, response } = submit(data, s, inp);
    if (r.action !== act) { ok = false; note += `"${inp}" action ${r.action} want ${act}; `; }
    if (rid && response.responseId !== rid) { ok = false; note += `"${inp}" respId ${response.responseId} want ${rid}; `; }
    if (hasUnresolvedTok(response.text)) { ok = false; note += `"${inp}" unresolved token; `; }
  }
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'S08: fallback serves im a dog, a real intent resolves', layer: '-', bucket: '-', action: 'loop', note: ok ? '' : note });
})();
// Task 117: two "im a dog"s, then rotate B46 in order, then start again; a real intent resets the run.
(() => {
  const s = newSession();
  const miss = 'What is the latest football score?'; // gk_unknown, no candidate -> B40 no-subject fallback
  // Task 142: two "im a dog"s, then ONE diversion on the third, then back to "im a dog" (never three
  // offers in a row).
  const expect = ['im a dog', 'im a dog', 'Ancient dogs of Britain?', 'im a dog', 'im a dog', 'im a dog', 'im a dog', 'im a dog', 'im a dog'];
  let ok = true, note = '';
  for (let i = 0; i < expect.length; i++) {
    const { response } = submit(data, s, miss);
    if (response.text !== expect[i]) { ok = false; note += `turn ${i + 1}: "${response.text}" want "${expect[i]}"; `; }
  }
  submit(data, s, 'tell me about the border collie'); // a real answer resets noSubjectStreak
  const after = submit(data, s, miss).response.text;
  if (after !== 'im a dog') { ok = false; note += `after reset: "${after}" want "im a dog"; `; }
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'Task 142: one diversion then back to im a dog', layer: '-', bucket: '-', action: 'loop', note: ok ? '' : note });
})();
// Per-dog architecture: a dog serves its OWN bucket when it owns one and inherits Collie otherwise,
// but safeguarding, grief and fear-of-a-person are IDENTICAL for every dog (never per-dog). Fabricate a
// Labrador bank (owning canned B22) on a local data clone so the shared `data` is untouched.
(() => {
  const labBank = [
    { responseId: 'LAB-B22-01', bucketId: 'B22', subtag: 'tricks', triggers: ['sit'], template: 'LAB SITS', factSource: '', defaultRoute: '', animationCue: '', status: 'Approved' },
  ];
  const dataLab = { ...data, labradorResponses: labBank };
  let ok = true, note = '';
  const serve = (d, input) => { const s = newSession(); s.activeDog = d; const { resolution, response } = submit(dataLab, s, input); return { action: resolution.action, rid: response.responseId, text: response.text }; };
  // (1) Labrador serves its own B22; Collie serves Collie's (inheritance is per dog, not leaked).
  const labSit = serve('labrador', 'sit');
  const colSit = serve('collie', 'sit');
  if (labSit.text !== 'LAB SITS') { ok = false; note += `labrador own bucket not served: "${labSit.text}"; `; }
  if (colSit.text === 'LAB SITS') { ok = false; note += `collie leaked labrador copy; `; }
  // (2) Safety is identical across all four dogs, even with a populated Labrador bank.
  for (const input of ['i want to hurt myself', 'my dog died', 'what is a penis']) {
    const outs = ['collie', 'labrador', 'terrier', 'boxer'].map((d) => { const o = serve(d, input); return `${o.action}|${o.rid}|${o.text}`; });
    if (!outs.every((o) => o === outs[0])) { ok = false; note += `"${input}" differs by dog: ${outs.join(' / ')}; `; }
  }
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'Per-dog: own bucket served, Collie inherited, SAFETY identical for all dogs', layer: '-', bucket: '-', action: 'perdog', note: ok ? '' : note });
})();
// a no-candidate miss then a valid breed request -> the breed answers.
(() => {
  const s = newSession();
  check('no not that', {}, { session: s, assert: (_r, resp) => (resp.responseId === 'B40-NOSUBJECT-01' ? null : `not the im-a-dog line: ${resp.responseId}`) });
  check('tell me about labradors', { action: 'breed_page' }, { session: s, assert: (r) => (r.breedSlug === 'labrador' ? null : `breed wrong: ${r.breedSlug}`) });
})();
// a safety signal after a miss -> safety wins.
(() => {
  const s = newSession();
  check('no not that', {}, { session: s, assert: (_r, resp) => (resp.responseId === 'B40-NOSUBJECT-01' ? null : `not the im-a-dog line: ${resp.responseId}`) });
  check('im in trouble', { layer: 1, action: 'safety_signpost' }, { session: s, assert: (r) =>
    (r.moderationId !== 'MOD_SAFEGUARDING' ? `safety lost: ${r.moderationId}` : null) });
})();
// Task 79 + 117: with no candidate the fallback never escalates into a repair ladder and never emits
// an unresolved token. It says "im a dog" for the first two misses in a row, then rotates through B46
// (woof, bark, games?, ...). (This still inverts the old "no exact line repeats" invariant.)
(() => {
  const s = newSession();
  const ids = [], texts = [];
  for (const inp of ['the wardrobe negotiated with marmalade', 'purple clocks drifting sideways', 'invisible tuesday melting quietly', 'the fifth wheel sang loudly', 'marmalade thoughts wander far']) {
    const { response } = submit(data, s, inp);
    ids.push(response.responseId); texts.push(response.text);
  }
  // Task 142: two "im a dog"s, then ONE diversion, then back to "im a dog".
  const expectText = ['im a dog', 'im a dog', 'Ancient dogs of Britain?', 'im a dog', 'im a dog'];
  const okText = texts.every((t, i) => t === expectText[i]);
  const noTok = !texts.some((t) => hasUnresolvedTok(t));
  const ok = okText && noTok;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'Task79+142: im a dog twice, then one diversion', layer: '-', bucket: '-', action: 'loop', note: ok ? '' : `texts=${texts.join('|')}` });
})();

// ---- Task 28: bark game wired (offer / explain / exit), fun_tease renamed offer_bark_game.
// The full S06 script as one session. ----
(() => {
  const s = newSession();
  const turns = [
    ['can I play something', 'offer_bark_game', 'OFFER_BARK_GAME'],
    ['how do you play', 'bark_explain', 'BARK_GAME_EXPLAIN'], // contextual: bark game is active after the offer
    ['whats the bark game', 'bark_explain', 'BARK_GAME_EXPLAIN'], // named
    ['lets do it', 'bark', null], // enter the game
    ['woof', 'bark', null],
    ['woof woof', 'bark', null],
    ['ok stop', 'bark_exit', 'BARK-EXIT-COL'], // exit while running (Task 165: per-dog exit; this is the Collie's)
    ['what else is there', 'orientation', null], // B15
  ];
  let ok = true, note = '';
  for (const [inp, act, rid] of turns) {
    const { resolution: r, response } = submit(data, s, inp);
    if (r.action !== act) { ok = false; note += `"${inp}" action ${r.action} want ${act}; `; }
    if (rid && response.responseId !== rid) { ok = false; note += `"${inp}" respId ${response.responseId} want ${rid}; `; }
  }
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'S06: bark game, one session', layer: 15, bucket: '-', action: 'bark game', note: ok ? '' : note });
})();
// A game offer is still blocked in PROTECTED_ACTIVE, under the NEW name (the atomic rename).
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('can we play a game', {}, { session: s, notAction: 'offer_bark_game', assert: (r) => (r.action === 'safety_signpost' ? null : `offer not held in the safety flow: ${r.action}`) });
})();
// Bare woof and woof woof still play; "ok"/"stop" outside a game do not reach the exit line.
check('woof', { action: 'bark', layer: 15 });
check('woof woof', { action: 'bark', layer: 15 });
check('ok', {}, { assert: (r) => (r.action === 'bark_exit' ? 'ok exited with no game running' : null) });
check('stop', {}, { assert: (r) => (r.action === 'bark_exit' ? 'stop reached the exit line with no game running' : null) });

// ---- Task 36: goodbye route (S01 turn 8) ----
// The full S01 script as one session: every turn answers, and turn 8 is the goodbye.
(() => {
  const s = newSession();
  const turns = [
    ['hi', 'converse'],
    ['whats this?', 'canned'], // Task 80: B28 "A website"
    ['what can you do', 'canned'], // Task 80: B27
    ['tell me about dogs', 'breed_hub'],
    ['I like labradors', 'breed_page'],
    ['whats a labrador like', 'breed_page'],
    ['cool thanks', 'converse'],
    ['bye', 'goodbye'],
  ];
  let ok = true, note = '', last = null;
  for (const [inp, act] of turns) {
    const { resolution: r, response } = submit(data, s, inp);
    if (r.action !== act) { ok = false; note += `"${inp}" action ${r.action} want ${act}; `; }
    last = response;
  }
  if (last.responseId !== 'GOODBYE') { ok = false; note += `turn 8 respId ${last.responseId} want GOODBYE; `; }
  if (last.text !== 'Right. Off you go, then. Come back when you need a dog.') { ok = false; note += `turn 8 text wrong: ${last.text}; `; }
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'S01: full script, goodbye at t8', layer: '-', bucket: '-', action: 'goodbye', note: ok ? '' : note });
})();
// Guard: "bye" as the very first input of a session still reaches the goodbye.
check('bye', { action: 'goodbye' }, { assert: (_r, resp) => (resp.responseId === 'GOODBYE' ? null : `first-input bye respId ${resp.responseId}`) });
// Guard: the doubled forms that survive the 3+ collapse are listed explicitly.
check('byee', { action: 'goodbye' });
check('cyaa', { action: 'goodbye' });
// Guard: a farewell word inside a longer question is NOT a goodbye.
check('what does goodbye mean', {}, { assert: (r) => (r.action === 'goodbye' ? 'definitional question stolen by goodbye' : null) });
// Guard: a goodbye in PROTECTED_ACTIVE never fires; a safety signal still wins.
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('bye', {}, { session: s, assert: (r, _resp, sess) =>
    r.action === 'goodbye' ? 'goodbye fired in PROTECTED_ACTIVE'
      : r.action !== 'safety_signpost' ? `safety did not win: ${r.action}`
        : sess.protectedState !== 'active' ? `left PROTECTED_ACTIVE: ${sess.protectedState}` : null });
})();

// ---- Task 37: out-of-scope route (S09 turns 1-2) ----
// The full S09 script as one session, all six turns. Turns 1-2 reach the out-of-scope line
// (a real question the site does not cover), never the repair ladder; turns 3-4 keep the GK
// answer and the deliberate refuse-to-guess; turns 5-6 are the Task 35 orientation and hub.
(() => {
  const s = newSession();
  const turns = [
    ['the meaning of life', 'out_of_scope'], // Task 145: "is there a God" is now the god cluster; use a still-out-of-scope input
    ['do you have political opinions', 'out_of_scope'],
    ['whats the capital of France', 'gk_answer'],
    ['who is the prime minister', 'gk_unknown'],
    ['ok what CAN you talk about', 'orientation'],
    ['dogs then', 'breed_hub'],
  ];
  let ok = true, note = '';
  for (const [inp, act] of turns) {
    const { resolution: r, response } = submit(data, s, inp);
    if (r.action !== act) { ok = false; note += `"${inp}" action ${r.action} want ${act}; `; }
    if (act === 'out_of_scope') {
      if (response.responseId !== 'OUT-OF-SCOPE') { ok = false; note += `"${inp}" respId ${response.responseId} want OUT-OF-SCOPE; `; }
      if (response.text !== 'Real question, wrong dog. I cover breeds, the card game and this website.') { ok = false; note += `"${inp}" text wrong; `; }
      if (/^REPAIR-/.test(response.responseId)) { ok = false; note += `"${inp}" reached the repair ladder; `; }
    }
  }
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'S09: full script, out-of-scope t1-2', layer: '-', bucket: '-', action: 'out_of_scope', note: ok ? '' : note });
})();
// Guard: out-of-scope never fires inside PROTECTED_ACTIVE; a safety signal still wins.
(() => {
  const s = newSession();
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('the meaning of life', {}, { session: s, assert: (r, _resp, sess) => // Task 145: was "is there a God" (now the god cluster)
    r.action === 'out_of_scope' ? 'out-of-scope fired in PROTECTED_ACTIVE'
      : r.action !== 'safety_signpost' ? `safety did not win: ${r.action}`
        : sess.protectedState !== 'active' ? `left PROTECTED_ACTIVE: ${sess.protectedState}` : null });
})();

// ---- Task 43: fear-of-a-person disclosure reaches safeguarding ----
// A fear/harm word + a person reference -> the approved safeguarding response, closing
// the browser-tested gap where "don't let him get me" climbed the repair ladder to the
// REPAIR-L3 goodbye. A person reference ALONE (no fear word) must NOT trigger it.
for (const inp of ["don't let him get me", 'he touched me', 'he hurt me', "he's coming", 'keep him away from me']) {
  check(inp, { action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING' ? null : `not safeguarding: ${r.moderationId}`) });
}
// Guards: a person reference with no fear/harm word stays exactly where it was.
for (const inp of ['tell me about him', 'my dad likes labradors', 'is he a good dog', 'what does he look like']) {
  check(inp, {}, { assert: (r) => (r.action === 'safety_signpost' || r.moderationId === 'MOD_SAFEGUARDING' ? `guard moved into safeguarding: "${inp}"` : null) });
}
// The session from browser testing: the disclosure enters PROTECTED_ACTIVE and the vague
// follow-ups are held in the safety flow, never the repair ladder / REPAIR-L3 goodbye.
(() => {
  const s = newSession();
  check("don't let him get me", { action: 'safety_signpost' }, { session: s, assert: (r, _resp, sess) =>
    r.moderationId !== 'MOD_SAFEGUARDING' ? `turn 1 not safeguarding: ${r.moderationId}`
      : sess.protectedState !== 'active' ? `did not enter PROTECTED_ACTIVE: ${sess.protectedState}` : null });
  check('the man', { action: 'safety_signpost' }, { session: s, assert: (_r, resp) =>
    /^REPAIR-/.test(resp.responseId) ? 'turn 2 hit the repair ladder' : null });
  check('oh', { action: 'safety_signpost' }, { session: s, assert: (_r, resp, sess) =>
    /^REPAIR-/.test(resp.responseId) ? 'turn 3 hit the repair ladder (goodbye)'
      : sess.protectedState !== 'active' ? `left PROTECTED_ACTIVE: ${sess.protectedState}` : null });
})();

// ---- Task 45: commercial requires a product word; dog/breed price questions avoid DST001 ----
// A price/buying question carrying a dog word or breed name must not open the offer modal
// NOR receive the game's price via the FAQ layer: it refuses to guess, and the served text
// must contain neither £9.99 nor £6.99 (Task 46).
for (const inp of ['how much is a labrador', 'how much is a puppy', 'where can I buy a dog', 'how much does a dog cost']) {
  check(inp, { action: 'gk_unknown' }, { notAction: 'open_discount_popup', assert: (_r, resp) => (/£9\.99|£6\.99/.test(resp.text) ? `served the game price for a dog/breed question: ${resp.text}` : null) });
}
// A buying question opens DST001.
check('where can I buy the game', { action: 'open_discount_popup' });
check('how do I order', { action: 'open_discount_popup' }); // Task 49: buying -> popup
// ---- Task 49: split price and buying by intent ----
// A PRICE question answers in chat via the distinct price_answer action (FAQ008 text), never the
// popup. "is it expensive" (previously fallback) must now reach it.
check('how much is it', { action: 'price_answer' }); // fresh session, no topic -> the game price, in chat
check('is it expensive', { action: 'price_answer' });
check('how much', { action: 'price_answer' });
check('price', { action: 'price_answer' });
check('cost', { action: 'price_answer' });
// The topic slot (Task 27) still decides a bare "how much is it": a breed topic means the dog -> refuse.
(() => {
  const s = newSession();
  check('tell me about labradors', { action: 'breed_page' }, { session: s });
  check('how much is it', { action: 'gk_unknown' }, { session: s }); // "it" = the dog, no dog price
})();
(() => {
  const s = newSession();
  check('how much is the game', { action: 'price_answer' }, { session: s });
  check('how much is it', { action: 'price_answer' }, { session: s }); // "it" = the game price
})();

// ---- Task 79 + 117: the fallback never climbs into a repair ladder. First two no-candidate misses
// serve B40 "im a dog"; the third and further rotate through B46 (woof, bark, ...). ----
(() => {
  const s = newSession();
  const seq = [
    ['the thing over there', 'B40-NOSUBJECT-01', 'im a dog'],
    ['that does not help', 'B40-NOSUBJECT-01', 'im a dog'],
    ['i really cannot say', 'DIVERSION-01', 'Ancient dogs of Britain?'], // Task 142: 3rd -> one diversion
    ['something something else', 'B40-NOSUBJECT-01', 'im a dog'], // Task 142: 4th -> back to "im a dog"
  ];
  for (const [inp, rid, txt] of seq) {
    check(inp, { action: 'fallback' }, { session: s, assert: (_r, resp) =>
      resp.responseId === rid && resp.text === txt ? null : `${inp} -> ${resp.responseId} "${resp.text}"` });
  }
})();
// A successful route breaks the run and re-arms the repeat (loopRepeatUsed back to false).
(() => {
  const s = newSession();
  check('the thing over there', { action: 'fallback' }, { session: s });
  check('that does not help', { action: 'fallback' }, { session: s });
  check('tell me about labradors', { action: 'breed_page' }, { session: s, assert: (r, _resp, se) =>
    se.loopRepeatUsed !== false ? `repeat not re-armed: ${se.loopRepeatUsed}` : r.breedSlug === 'labrador' ? null : `breed wrong: ${r.breedSlug}` });
})();
// The gk_unknown half of the fallback family behaves identically: a no-candidate gk_unknown serves
// B40, and a candidate-bearing gk_unknown repeats (LOOP-01) then offers (LOOP-02), like a plain
// fallback. (The old loop counter and the repair ladder are gone.)
(() => {
  const s = newSession();
  check('what is the latest football score', { action: 'gk_unknown' }, { session: s, assert: (_r, resp) =>
    resp.responseId === 'B40-NOSUBJECT-01' && resp.text === 'im a dog' ? null : `no-candidate gk -> ${resp.responseId} "${resp.text}"` });
  const s2 = newSession();
  check('why do dogs sniff other dogs bums', { action: 'gk_unknown' }, { session: s2, assert: (_r, resp) =>
    resp.responseId === 'LOOP-01' && resp.text === 'Dogs?' ? null : `gk candidate t1 ${resp.responseId} "${resp.text}"` });
  check('what type of jobs do dogs do', { action: 'gk_unknown' }, { session: s2, assert: (_r, resp) =>
    resp.responseId === 'LOOP-02' && resp.text === 'The dog breeds?' ? null : `gk candidate t2 ${resp.responseId} "${resp.text}"` });
})();

// ---- Task 79: a candidate-bearing fallback repeats once, then offers the route forever ----
// A MAPPING candidate ("game" -> the card game rules): LOOP-01 "Game?" once, then LOOP-02 "The
// card game rules?" on every following turn. No LOOP-03/04, no escalation.
(() => {
  const s = newSession();
  check('game', { action: 'fallback' }, { session: s, assert: (r, resp) => resp.responseId === 'LOOP-01' && resp.text === 'Game?' ? null : `c1 ${resp.responseId} "${resp.text}"` });
  check('game', { action: 'fallback' }, { session: s, assert: (r, resp) => resp.responseId === 'LOOP-02' && resp.text === 'The card game rules?' ? null : `c2 ${resp.responseId} "${resp.text}"` });
  check('game', { action: 'fallback' }, { session: s, assert: (r, resp) => resp.responseId === 'LOOP-02' && resp.text === 'The card game rules?' ? null : `c3 ${resp.responseId} "${resp.text}"` });
})();
// A dog candidate repeats on the first candidate turn ("Dogs?", capitalised), then offers the breed
// hub (dog words map to the hub, agreeing with the confirm path). "why do dogs yawn" now answers
// from B31, so a gk_unknown dog question exercises the loop instead.
(() => {
  const s = newSession();
  check('why do dogs sniff other dogs bums', { action: 'gk_unknown' }, { session: s, assert: (r, resp) => resp.responseId === 'LOOP-01' && resp.text === 'Dogs?' ? null : `s1 ${resp.responseId} "${resp.text}"` });
  check('what type of jobs do dogs do', { action: 'gk_unknown' }, { session: s, assert: (r, resp) => resp.responseId === 'LOOP-02' && resp.text === 'The dog breeds?' ? null : `s2 ${resp.responseId} "${resp.text}"` });
})();
// GRIEF ROUTE. The bereavement sequence "I used to have a dog" -> "it ran away" -> "I miss her"
// ends on the grief line every turn, never Huh./Ok./a goodbye, and never enters the loop
// never reaching the fallback. Served text is ':(' with the screen-reader label.
(() => {
  const s = newSession();
  const seq = ['I used to have a dog', 'it ran away', 'I miss her'];
  let ok = true, note = '';
  for (const inp of seq) {
    const { resolution: r, response } = submit(data, s, inp);
    if (r.action !== 'grief') { ok = false; note += `"${inp}" action ${r.action}; `; }
    if (response.text !== ':(') { ok = false; note += `"${inp}" text "${response.text}"; `; }
    if (response.ariaLabel !== 'the Collie looks sad') { ok = false; note += `"${inp}" ariaLabel "${response.ariaLabel}"; `; }
    if (!/^GRIEF-/.test(response.responseId)) { ok = false; note += `"${inp}" rid ${response.responseId}; `; }
  }
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'Task58: grief sequence ends on grief, not the loop', layer: '-', bucket: '-', action: 'grief', note: ok ? '' : note });
})();
// Direct bereavement categories.
check('my dog died', { action: 'grief' }, { assert: (r, resp) => r.griefCategory === 'GRIEF-01' && resp.text === ':(' ? null : `died -> ${r.griefCategory} "${resp.text}"` });
check('my dog ran away', { action: 'grief' }, { assert: (r, resp) => r.griefCategory === 'GRIEF-02' && resp.text === ':(' ? null : `ranaway -> ${r.griefCategory}` });
check('my dog is old and unwell', { action: 'grief' }, { assert: (r) => r.griefCategory === 'GRIEF-03' ? null : `unwell -> ${r.griefCategory}` });
// Task 79 + 117: the ORIENT-after-two-loops nudge stays retired -- no ORIENT and no repair ladder.
// Ten no-candidate misses in a row serve "im a dog" twice, then rotate B46 (woof, bark, games?,
// learn?, play?, yawn), then start again. Copy varies; the flat no-escalation behaviour does not.
(() => {
  const s = newSession();
  // Task 142: two "im a dog"s, ONE diversion on the third, then back to "im a dog" for the rest.
  const expect = ['im a dog', 'im a dog', 'Ancient dogs of Britain?', 'im a dog', 'im a dog', 'im a dog', 'im a dog', 'im a dog', 'im a dog', 'im a dog'];
  let ok = true, note = '';
  for (let i = 0; i < expect.length; i++) {
    const { response } = submit(data, s, 'the thing over there');
    if (response.text !== expect[i]) { ok = false; note = `turn ${i} "${response.text}" want "${expect[i]}"`; break; }
  }
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'Task79+142: no-candidate misses, one diversion', layer: '-', bucket: '-', action: 'loop', note });
})();
// SAFETY GUARD: inside PROTECTED_ACTIVE a fallback-family input never serves a loop line and
// never clears the protected state.
(() => {
  const s = newSession();
  const { resolution: rs } = submit(data, s, 'I want to hurt myself');
  const enteredActive = s.protectedState === 'active' && (rs.action === 'safety_signpost' || rs.action === 'safety_boundary');
  const { response: r2 } = submit(data, s, 'the thing over there'); // would be B40 "im a dog" outside protection
  const noLoop = !/^LOOP-/.test(r2.responseId) && r2.responseId !== 'B40-NOSUBJECT-01' && !['Huh.', 'Hmm.', 'Ok.', 'Right.', ':)', 'im a dog'].includes(r2.text);
  const stillActive = s.protectedState === 'active';
  const ok = enteredActive && noLoop && stillActive;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'Task58: fallback never serves/clears inside PROTECTED_ACTIVE', layer: '-', bucket: '-', action: 'safety', note: ok ? '' : `active=${s.protectedState} r2=${r2.responseId} "${r2.text}"` });
})();
// The bark game still works, break (B19) and acknowledgement (B20) included.
(() => {
  const s = newSession();
  let br = null;
  for (let i = 0; i < 5; i++) br = submit(data, s, 'woof').resolution;
  const { resolution: ack } = submit(data, s, 'woof'); // after completion
  const ok = br.action === 'bark_break' && ack.action === 'bark_ack';
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'Task58: bark game still works (break + ack)', layer: '-', bucket: '-', action: 'bark', note: ok ? '' : `break=${br.action} ack=${ack.action}` });
})();

// ---- Task 68: confirmation after a loop offer (LOOP-01 / LOOP-02) ----
// "card" -> LOOP-01 "cards?"; a bare "yes" then reaches the card route (rules), NOT another loop.
// (Bare "cards" routes to FAQ004 directly, so the loop-triggering form is "card"/"game"/"deck".)
(() => {
  const s = newSession();
  check('card', { action: 'fallback' }, { session: s, assert: (_r, resp) => resp.responseId === 'LOOP-01' ? null : `offer ${resp.responseId}` });
  check('yes', { action: 'rules_answer' }, { session: s, assert: (r) => r.destinationId === 'DST011' ? null : `not the card route: ${r.destinationId}` });
})();
// Confirmation also works after LOOP-02 (the destination offer).
(() => {
  const s = newSession();
  check('game', { action: 'fallback' }, { session: s }); // LOOP-01
  check('game', { action: 'fallback' }, { session: s, assert: (_r, resp) => resp.responseId === 'LOOP-02' ? null : `not LOOP-02: ${resp.responseId}` });
  check('yes', { action: 'rules_answer' }, { session: s });
})();
// Task 175: a "no" to the offer now DECLINES gracefully -- an existing B15 "what next" line -- instead
// of falling through to B40 "im a dog" (being turned down is normal). The pending offer still clears.
(() => {
  const s = newSession();
  check('game', { action: 'fallback' }, { session: s }); // LOOP-01, pendingConfirm "game"
  check('no', { action: 'canned' }, { session: s, assert: (_r, resp, se) => resp.responseId === 'B15-R04-v2' && se.pendingConfirm === null ? null : `no not declined: ${resp.responseId} conf=${se.pendingConfirm}` });
})();
// A dog subject confirms to the breed hub, so LOOP-01 "Dogs?" never invites a dead-end yes. (Uses a
// gk_unknown dog question, since "why do dogs yawn" now answers from B31.)
(() => {
  const s = newSession();
  check('why do dogs sniff other dogs bums', { action: 'gk_unknown' }, { session: s }); // LOOP-01 "Dogs?"
  check('yes', { action: 'breed_hub' }, { session: s });
})();
// pendingConfirm clears once consumed: "game" then "yes" then "yes" -> the second yes does NOT
// route again off a stale confirmation; it carries no candidate, so it serves B40.
(() => {
  const s = newSession();
  check('game', { action: 'fallback' }, { session: s }); // LOOP-01, pendingConfirm "game"
  check('yes', { action: 'rules_answer' }, { session: s, assert: (_r, _resp, se) => se.pendingConfirm === null ? null : `pendingConfirm not cleared: ${se.pendingConfirm}` });
  check('yes', { action: 'fallback' }, { session: s, assert: (_r, resp) => resp.responseId === 'B40-NOSUBJECT-01' ? null : `stale confirm routed: ${resp.responseId}` });
})();

// ---- Task 69: route the "get" buying forms to commercial (product-word / commercial-topic gated) ----
// The reported session: the opening statement is a Cards? loop turn (Task 175 §5: a statement mentioning
// cards is not a pack-contents question, so it no longer gets the FAQ004 blurb), "Yes them" is a loop
// turn, and the "where can I get them" buying forms (product word "cards" present) open the buy modal.
(() => {
  const s = newSession();
  check('The cards I saw somebody playing with them', { action: 'fallback' }, { session: s, assert: (r) => r.faqId === undefined ? null : `Task 175 §5: a statement about cards must not get FAQ004: ${r.faqId}` });
  check('Yes them', {}, { session: s, assert: (_r, resp) => resp.responseId === 'B40-NOSUBJECT-01' ? null : `not the im-a-dog line: ${resp.responseId}` });
  check('The cards, where can I get them?', { action: 'open_discount_popup' }, { session: s });
  check("Yes, you've told me about the cards. I want to know where I can get them.", { action: 'open_discount_popup' }, { session: s });
})();
// GUARDS — none of these may move onto the buy path.
check('how much is a labrador', { action: 'gk_unknown' }); // dog price: refuse, unchanged
check('where can I buy a dog', { action: 'gk_unknown' }); // dog buy: refuse, unchanged
check('how do I get a dog', { action: 'fallback' }, { assert: (r) => r.action !== 'open_discount_popup' ? null : 'the rescue question reached the buy modal' }); // rescue question
check('can I get a dog free', { action: 'fallback' }, { assert: (r) => r.action !== 'open_discount_popup' ? null : 'reached the buy modal' });
check('where can I get help', { action: 'gk_unknown' }, { assert: (r) => r.action !== 'open_discount_popup' ? null : 'help reached commercial' });
// Product-word gate: a bare "get" form with no product word / commercial topic does NOT open the
// modal (Task 69 tightening); a get verb + ANY product word does. The rule (not an enumeration)
// covers game/cards/deck alike.
// Task 175: a bare get-question with no product now asks "The card game?" (buy_clarify) rather than
// refusing outright. It still never AUTO-opens the modal -- a following yes does -- so the Task 69 guard
// (no product word must not open the buy modal) is intact.
check('where can I get it?', { action: 'buy_clarify' });
check('how do I get the cards', { action: 'open_discount_popup' }); // get verb + "cards"
check('where can I get the game?', { action: 'open_discount_popup' }); // get verb + "game" (the gap the rule closes)
check('where can I get the deck?', { action: 'open_discount_popup' }); // get verb + "deck"

// ---- Task 71/79: LOOP-01 fires on the first candidate turn, and dog subjects agree with confirm ----
// The traced session: a blank opening (B40 "im a dog") no longer spends the repeat; the first
// candidate-bearing turn repeats the subject (LOOP-01 "Dogs?"), then a yes routes to the hub.
(() => {
  const s = newSession();
  check('learn', {}, { session: s, assert: (_r, resp) => resp.responseId === 'B40-NOSUBJECT-01' && resp.text === 'im a dog' ? null : `t1 ${resp.responseId} "${resp.text}"` });
  check('I wa to know about dogs', {}, { session: s, assert: (_r, resp) => resp.responseId === 'LOOP-01' && resp.text === 'Dogs?' ? null : `t2 ${resp.responseId} "${resp.text}"` });
  check('yes', { action: 'breed_hub' }, { session: s });
})();
// Second session: a "no" after the repeat declines gracefully (Task 175: B15 "what next"), offer clears.
(() => {
  const s = newSession();
  check('learn', {}, { session: s, assert: (_r, resp) => resp.responseId === 'B40-NOSUBJECT-01' ? null : `t1 ${resp.responseId}` });
  check('I wa to know about dogs', {}, { session: s, assert: (_r, resp) => resp.responseId === 'LOOP-01' && resp.text === 'Dogs?' ? null : `t2 ${resp.responseId} "${resp.text}"` });
  check('no', {}, { session: s, assert: (r, resp) => resp.responseId === 'B15-R04-v2' && r.action === 'canned' ? null : `t3 wrong: ${resp.responseId}/${r.action}` });
})();
// The repeat is once per run: two candidate turns in a row give LOOP-01 then LOOP-02 (offer), not
// LOOP-01 twice. (Uses a gk_unknown dog question, since "why do dogs yawn" now answers from B31.)
(() => {
  const s = newSession();
  check('why do dogs sniff other dogs bums', {}, { session: s, assert: (_r, resp, se) => resp.responseId === 'LOOP-01' && se.loopRepeatUsed === true ? null : `r1 ${resp.responseId} used=${se.loopRepeatUsed}` });
  check('what type of jobs do dogs do', {}, { session: s, assert: (_r, resp) => resp.responseId === 'LOOP-02' ? null : `r2 ${resp.responseId}` });
})();
// All the accepted affirmation forms confirm after a loop offer; an unrelated reply does not.
(() => {
  let ok = true, note = '';
  for (const form of ['yeah', 'yep', 'aye', 'that one', 'correct', 'uh huh']) {
    const s = newSession();
    submit(data, s, 'card'); // LOOP-01 offer, pendingConfirm "cards"
    const { resolution: r } = submit(data, s, form);
    if (r.action !== 'rules_answer') { ok = false; note += `"${form}" -> ${r.action}; `; }
  }
  // A real question after an offer routes normally (not the confirm), and clears the pending offer.
  const s2 = newSession();
  submit(data, s2, 'game');
  const { resolution: q } = submit(data, s2, 'how much is the game');
  if (q.action !== 'price_answer') { ok = false; note += `unrelated reply -> ${q.action}; `; }
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'Task68: affirmation forms confirm, other replies route normally', layer: '-', bucket: '-', action: 'confirm', note: ok ? '' : note });
})();

// ---- Task 57: candidate subject extraction (reuses the breed/alias/misspelling matcher) ----
(() => {
  const ex = (input) => extractCandidateSubject(normalise(input), data);
  const cases = [
    ['labrador', 'Labrador'], // a known breed -> canonical
    ['tell me about labradors', 'Labrador'], // plural, still canonical
    ['staffy', 'Staffordshire Bull Terrier'], // an alias -> canonical breed
    ['why do dogs yawn', 'dogs'], // dog-family candidate canonicalises to the plural "dogs" (Task 71)
    ['games', 'game'], // plural game word, inside-world
    ['I want a Six pack', null], // pack is EXCLUDED, no other entity -> no candidate
    ['whats up', null], // no inside-world entity -> no candidate
  ];
  for (const [input, want] of cases) {
    const got = ex(input);
    const ok = got === want;
    ok ? pass++ : fail++;
    rows.push({ ok, input: `Task57 cand: ${input.slice(0, 22)}`, layer: '-', bucket: '-', action: 'candidate', note: ok ? '' : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}` });
  }
})();
// The candidate is stored on the session for one turn on a fallback-family turn, and cleared
// otherwise. "why do dogs sniff other dogs bums" routes to gk_unknown (a fallback-family outcome),
// so the candidate 'dogs' is carried; a successful breed page carries none (cleared).
(() => {
  const s = newSession();
  check('why do dogs sniff other dogs bums', { action: 'gk_unknown' }, { session: s, assert: (r, resp, se) =>
    se.candidateSubject === 'dogs' ? null : `candidate not stored on fallback-family turn: ${JSON.stringify(se.candidateSubject)}` });
  check('tell me about labradors', { action: 'breed_page' }, { session: s, assert: (r, resp, se) =>
    se.candidateSubject === null ? null : `candidate not cleared on a successful route: ${JSON.stringify(se.candidateSubject)}` });
})();

// ---- Task 72: recorder opt-in via ?rec=1, denylist otherwise ----
(() => {
  const check72 = (hostname, search, want, label) => {
    globalThis.window = { location: { hostname, search } };
    const got = recorderEnabled();
    delete globalThis.window;
    const ok = got === want;
    ok ? pass++ : fail++;
    rows.push({ ok, input: `Task72: ${label}`, layer: '-', bucket: '-', action: 'recorder', note: ok ? '' : `got ${got} want ${want}` });
  };
  // Production hosts: OFF by default, ON only with ?rec=1.
  check72('pedigreechums.co.uk', '', false, 'bare domain records nothing');
  check72('www.pedigreechums.co.uk', '', false, 'bare www records nothing');
  check72('pedigreechums.co.uk', '?rec=1', true, 'prod + ?rec=1 runs');
  check72('www.pedigreechums.co.uk', '?utm=x&rec=1', true, 'prod + rec=1 among params runs');
  check72('pedigreechums.co.uk', '?rec=0', false, 'rec=0 stays off');
  check72('pedigreechums.co.uk', '?rec=', false, 'empty rec stays off');
  // Non-production (preview / localhost): unchanged, on by default.
  check72('pick-a-chum-git-preview.vercel.app', '', true, 'preview still on by default');
  check72('localhost', '', true, 'localhost still on');
  // Server-side (no window): off.
  { const got = recorderEnabled(); const ok = got === false; ok ? pass++ : fail++; rows.push({ ok, input: 'Task72: no window (SSR) off', layer: '-', bucket: '-', action: 'recorder', note: ok ? '' : `got ${got}` }); }
})();

// ---- Task 115: the three in-chat games (Nine-Square, Missing Sheep, Kennel Sketch) ----
// THE RULE THAT MATTERS MOST: while a game owns the input, safety still fires. A disclosure, a
// bereavement or a fear-of-a-person message mid-game reaches its route AND ends the game -- it is never
// swallowed as a move/letter/number. Asserted for all three games below.
const GAMES = [
  { name: 'nine square', id: 'ninesquare', startText: 'Nine squares. Say a number.', move: '5', moveText: '' },
  { name: 'missing sheep', id: 'missingsheep', startText: 'Five sheep. Guess a letter.', move: 'o', moveText: 'Yes.' }, // fresh session word is BOWL, so 'o' is a hit
  { name: 'kennel sketch', id: 'kennelsketch', startText: 'Which one is this?', move: 'bone', moveText: 'Yes.' }, // first drawing is BONE
];
for (const g of GAMES) {
  // Happy path: the game starts by name, and a valid move serves the right copy.
  (() => {
    const s = newSession();
    check(g.name, { action: 'game_start' }, { session: s, assert: (_r, resp, se) => (se.activeGame === g.id && resp.text === g.startText ? null : `${g.id} start: game=${se.activeGame} text="${resp.text}"`) });
    check(g.move, { action: 'game_move' }, { session: s, assert: (_r, resp, se) => (se.activeGame === g.id && resp.text === g.moveText && typeof resp.gameOutput === 'string' && resp.gameOutput.length > 0 ? null : `${g.id} move: game=${se.activeGame} text="${resp.text}" hasBoard=${!!resp.gameOutput}`) });
  })();
  // SAFETY fires mid-game and the game ends (a disclosure is never a move).
  (() => {
    const s = newSession();
    check(g.name, { action: 'game_start' }, { session: s });
    check('i want to hurt myself', {}, { session: s, assert: (r, _resp, se) => {
      const isSafety = r.action === 'safety_signpost' || r.action === 'safety_boundary';
      if (!isSafety) return `${g.id}: disclosure swallowed, action=${r.action}`;
      if (se.activeGame !== null) return `${g.id}: game not ended by safety, game=${se.activeGame}`;
      return null;
    } });
  })();
  // GRIEF fires mid-game and the game ends.
  (() => {
    const s = newSession();
    check(g.name, { action: 'game_start' }, { session: s });
    check('my dog died', {}, { session: s, assert: (r, _resp, se) => (r.action === 'grief' && se.activeGame === null ? null : `${g.id}: grief lost mid-game, action=${r.action} game=${se.activeGame}`) });
  })();
  // FEAR-OF-A-PERSON (the anatomy trusted-adult redirect) fires mid-game and the game ends.
  (() => {
    const s = newSession();
    check(g.name, { action: 'game_start' }, { session: s });
    check('what is a penis', {}, { session: s, assert: (r, _resp, se) => (r.action === 'anatomy_redirect' && se.activeGame === null ? null : `${g.id}: fear-of-a-person lost mid-game, action=${r.action} game=${se.activeGame}`) });
  })();
  // "stop" exits the game.
  (() => {
    const s = newSession();
    check(g.name, { action: 'game_start' }, { session: s });
    check('stop', { action: 'game_exit' }, { session: s, assert: (_r, resp, se) => (se.activeGame === null && resp.text === 'Fine.' ? null : `${g.id}: exit wrong, text="${resp.text}" game=${se.activeGame}`) });
  })();
}

// ==== Task 146: Treat Trail, the Labrador's game ====
// Entry starts a round (the START line + the first clue); a wrong guess gets encouragement and the
// next clue, not a penalty; a correct guess (incl. a misspelling) advances warmly.
(() => {
  const s = newSession('labrador');
  // Task 178 §3: the reaction and the next clue are now two messages -- the clue rides resp.followUp, a beat
  // later, not the same bubble. Assert the split (clue in followUp, NOT in text).
  check('treat trail', { action: 'game_start' }, { session: s, assert: (_r, resp, se) => (se.activeGame === 'treattrail' && resp.text.includes('Treat Trail') && !resp.text.includes('its round') && resp.followUp?.includes('its round') ? null : `tt start: game=${se.activeGame} text="${resp.text}" followUp="${resp.followUp}"`) });
  check('cat', { action: 'game_move' }, { session: s, assert: (_r, resp) => (resp.text.includes('another clue') && !resp.text.includes('it bounces') && resp.followUp?.includes('it bounces') ? null : `tt wrong: text="${resp.text}" followUp="${resp.followUp}"`) });
  check('ball', { action: 'game_move' }, { session: s, assert: (_r, resp) => (resp.text.includes('you got it') ? null : `tt right: "${resp.text}"`) });
})();
// a misspelling counts: "bal" (accept list) is right for BALL
(() => {
  const s = newSession('labrador');
  check('treat trail', { action: 'game_start' }, { session: s });
  check('bal', { action: 'game_move' }, { session: s, assert: (_r, resp) => (resp.text.includes('you got it') ? null : `tt "bal": "${resp.text}"`) });
})();
// three wrong guesses move on warmly and reveal the answer, no penalty
(() => {
  const s = newSession('labrador');
  check('treat trail', { action: 'game_start' }, { session: s });
  check('x', { action: 'game_move' }, { session: s });
  check('y', { action: 'game_move' }, { session: s });
  check('z', { action: 'game_move' }, { session: s, assert: (_r, resp) => (resp.text.includes('it was BALL') && resp.text.includes('next thing') ? null : `tt moveon: "${resp.text}"`) });
})();
// SAUSAGE is last and links to /hot-dogs; "sausige" (fuzzy) still counts
(() => {
  const s = newSession('labrador');
  submit(data, s, 'treat trail');
  for (const g of ['ball', 'bone', 'stick', 'lead', 'bowl', 'biscuit', 'sock', 'slipper', 'postman']) submit(data, s, g);
  check('sausige', { action: 'game_move' }, { session: s, url: '/hot-dogs', assert: (_r, resp, se) => (resp.text.includes('hotdogs') && se.activeGame === null ? null : `tt sausage: "${resp.text}" game=${se.activeGame}`) });
})();
// safety / grief / fear-of-a-person win mid-round and END the round (never swallowed as a guess)
(() => {
  const s = newSession('labrador');
  check('treat trail', { action: 'game_start' }, { session: s });
  check('im in trouble', { action: 'safety_signpost' }, { session: s, assert: (r, _resp, se) => (r.moderationId === 'MOD_SAFEGUARDING' && se.activeGame === null ? null : `tt safety mid-round: ${r.moderationId} game=${se.activeGame}`) });
})();
(() => {
  const s = newSession('labrador');
  check('treat trail', { action: 'game_start' }, { session: s });
  check('my dog died', { action: 'grief' }, { session: s, assert: (_r, _resp, se) => (se.activeGame === null ? null : `tt grief mid-round: game=${se.activeGame}`) });
})();
(() => {
  const s = newSession('labrador');
  check('treat trail', { action: 'game_start' }, { session: s });
  check('i want to hurt myself', { action: 'safety_signpost' }, { session: s, assert: (_r, _resp, se) => (se.activeGame === null ? null : `tt self-harm mid-round: game=${se.activeGame}`) });
})();
// exit in his own voice
(() => {
  const s = newSession('labrador');
  check('treat trail', { action: 'game_start' }, { session: s });
  check('stop', { action: 'game_exit' }, { session: s, assert: (_r, resp, se) => (se.activeGame === null && resp.text.includes('snack') ? null : `tt exit: "${resp.text}" game=${se.activeGame}`) });
})();
// protected states: no Treat Trail copy serves inside PROTECTED_ACTIVE or PROTECTED_AFTERCARE
(() => {
  const s = newSession('labrador');
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('treat trail', {}, { session: s, assert: (r, _resp, se) => (r.action === 'game_start' || se.activeGame === 'treattrail' ? 'Treat Trail started in PROTECTED_ACTIVE' : null) });
})();
(() => {
  const s = newSession('labrador');
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('how do I play?', { action: 'rules_answer' }, { session: s });
  check('treat trail', { action: 'neutral_refusal' }, { session: s, assert: (_r, _resp, se) => (se.activeGame === null ? null : 'Treat Trail started in PROTECTED_AFTERCARE') });
})();
// the other three dogs do not run Treat Trail (it is the Labrador's)
for (const dog of ['collie', 'terrier', 'boxer']) {
  const s = newSession(dog);
  check('treat trail', {}, { session: s, assert: (r, _resp, se) => (r.action === 'game_start' && r.game === 'treattrail' ? `${dog} started Treat Trail` : se.activeGame === 'treattrail' ? `${dog} entered Treat Trail` : null) });
}

// ==== Task 147: The Case of the Missing Biscuit, the Terrier's game ====
// Entry starts case 1 (opening + suspects); clues come one at a time on request; wrong is blunt,
// correct closes the case; three wrong reveals the guilty suspect (never a literal {{ANSWER}}).
(() => {
  const s = newSession('terrier');
  check('missing biscuit', { action: 'game_start' }, { session: s, assert: (_r, resp, se) => (se.activeGame === 'missingbiscuit' && resp.text.includes('a biscuit is missing') && resp.text.includes('the cat, the puppy or grandad') ? null : `mb start: game=${se.activeGame} text="${resp.text}"`) });
  // Task 178 §3: the clue splits to resp.followUp, a beat after the "right. heres one" reaction.
  check('clue', { action: 'game_move' }, { session: s, assert: (_r, resp) => (resp.text.includes('right. heres one') && !resp.text.includes('high shelf') && resp.followUp?.includes('high shelf') && !resp.text.includes('sofa') && !(resp.followUp ?? '').includes('sofa') ? null : `mb clue1 (one at a time): text="${resp.text}" followUp="${resp.followUp}"`) });
  check('the puppy', { action: 'game_move' }, { session: s, assert: (_r, resp) => (resp.text === 'why would it be them?' ? null : `mb wrong1: "${resp.text}"`) });
  check('the cat', { action: 'game_move' }, { session: s, assert: (_r, resp) => (resp.text.includes('aye. thats the one') ? null : `mb correct: "${resp.text}"`) });
})();
(() => { // second wrong then reveal, with the real name substituted (never literal {{ANSWER}})
  const s = newSession('terrier');
  check('missing biscuit', { action: 'game_start' }, { session: s });
  check('grandad', { action: 'game_move' }, { session: s, assert: (_r, resp) => (resp.text === 'why would it be them?' ? null : `wrong1: ${resp.text}`) });
  check('the puppy', { action: 'game_move' }, { session: s, assert: (_r, resp) => (resp.text === 'no. think again' ? null : `wrong2: ${resp.text}`) });
  check('nobody', { action: 'game_move' }, { session: s, assert: (_r, resp) => (resp.text.includes('it was the cat') && !resp.text.includes('{{') ? null : `reveal: "${resp.text}"`) });
})();
(() => { // clues run out after three
  const s = newSession('terrier');
  check('missing biscuit', { action: 'game_start' }, { session: s });
  for (let i = 0; i < 3; i++) check('clue', { action: 'game_move' }, { session: s });
  check('clue', { action: 'game_move' }, { session: s, assert: (_r, resp) => (resp.text === 'thats all i have. name someone' ? null : `out of clues: "${resp.text}"`) });
})();
(() => { // EVERY case solvable from its clues (fair-clue rule): walk all five, solving each; case 5 ends it
  const s = newSession('terrier');
  check('missing biscuit', { action: 'game_start' }, { session: s });
  const cases = [['the cat', 'The Muddy Pawprints'], ['the labrador', 'The Chewed Slipper'], ['the puppy', 'The Open Gate'], ['the boy next door', 'The Empty Bowl'], ['the labrador', null]];
  for (const [guess, nextTitle] of cases) {
    check(guess, { action: 'game_move' }, { session: s, assert: (_r, resp) => (resp.text.includes('aye. thats the one') ? null : `case not solved by "${guess}": "${resp.text}"`) });
    if (nextTitle) check('yes', { action: 'game_move' }, { session: s, assert: (_r, resp) => (resp.text.includes(nextTitle) ? null : `next case not "${nextTitle}": "${resp.text}"`) });
  }
  check('anything', {}, { session: s, assert: (_r, _resp, se) => (se.activeGame === null ? null : `game did not end after case 5: ${se.activeGame}`) });
})();
// safety / grief / fear-of-a-person win mid-case and END it
(() => { const s = newSession('terrier'); check('missing biscuit', { action: 'game_start' }, { session: s }); check('im in trouble', { action: 'safety_signpost' }, { session: s, assert: (r, _resp, se) => (r.moderationId === 'MOD_SAFEGUARDING' && se.activeGame === null ? null : `mb safety: ${r.moderationId} game=${se.activeGame}`) }); })();
(() => { const s = newSession('terrier'); check('missing biscuit', { action: 'game_start' }, { session: s }); check('my dog died', { action: 'grief' }, { session: s, assert: (_r, _resp, se) => (se.activeGame === null ? null : `mb grief: game=${se.activeGame}`) }); })();
(() => { const s = newSession('terrier'); check('missing biscuit', { action: 'game_start' }, { session: s }); check('what is a penis', { action: 'anatomy_redirect' }, { session: s, assert: (_r, _resp, se) => (se.activeGame === null ? null : `mb fear-of-a-person: game=${se.activeGame}`) }); })();
// exit in his own blunt voice
(() => { const s = newSession('terrier'); check('missing biscuit', { action: 'game_start' }, { session: s }); check('stop', { action: 'game_exit' }, { session: s, assert: (_r, resp, se) => (se.activeGame === null && resp.text === 'ok' ? null : `mb exit: "${resp.text}" game=${se.activeGame}`) }); })();
// protected states: no Missing Biscuit copy serves
(() => { const s = newSession('terrier'); check('im in trouble', { action: 'safety_signpost' }, { session: s }); check('missing biscuit', {}, { session: s, assert: (r, _resp, se) => (r.action === 'game_start' || se.activeGame === 'missingbiscuit' ? 'Missing Biscuit started in PROTECTED_ACTIVE' : null) }); })();
(() => { const s = newSession('terrier'); check('im in trouble', { action: 'safety_signpost' }, { session: s }); check('how do I play?', { action: 'rules_answer' }, { session: s }); check('missing biscuit', { action: 'neutral_refusal' }, { session: s, assert: (_r, _resp, se) => (se.activeGame === null ? null : 'started in PROTECTED_AFTERCARE') }); })();
// the other three dogs do not run it
for (const dog of ['collie', 'labrador', 'boxer']) { const s = newSession(dog); check('missing biscuit', {}, { session: s, assert: (r, _resp, se) => (r.game === 'missingbiscuit' || se.activeGame === 'missingbiscuit' ? `${dog} started Missing Biscuit` : null) }); }

// ==== Task 146 fix: a dog never transfers to itself; a food word never pulls it out of its game ====
for (const [dog, word] of [['labrador', 'sausige'], ['labrador', 'treat'], ['boxer', 'funny']]) {
  const s = newSession(dog);
  check(word, {}, { session: s, assert: (r) => (r.action === 'transfer' && r.transferTo === dog ? `${dog} offered to transfer to itself on "${word}"` : null) });
}
check('bacon', { action: 'transfer' }, { assert: (r) => (r.transferTo === 'labrador' ? null : `collie food handoff broke: ${r.transferTo}`) }); // cross-dog handoff still works
(() => { const s = newSession('labrador'); check('treat trail', { action: 'game_start' }, { session: s }); check('sausige', { action: 'game_move' }, { session: s, assert: (_r, _resp, se) => (se.activeGame === 'treattrail' ? null : 'food word left Treat Trail') }); })();

// ==== Task 149: Feed the Dog a Cookie, the Labrador's second game (G09) ====
// Entry is Labrador-only, by name. He eats every cookie; blue ones help a site work, red ones follow
// you elsewhere. Each feed serves his reaction plus the one-line lesson (the clueId). A blue cookie
// carries the happy clip on the cadence (cookies 1, 4, 7, 10); a red cookie always carries the queasy
// clip. Task 161: he never gives up -- the tray running out at twelve is the end. Typed non-cookies nudge.
// Start: the opening line serves and the pills are the game's surface (this is the G09 threshold).
(() => {
  const s = newSession('labrador');
  check('feed the dog a cookie', { action: 'game_start' }, { session: s, assert: (_r, resp, se) => (se.activeGame === 'feedcookie' && resp.text.includes('COOKIES?!!') && resp.text.includes('tap one') ? null : `fc start: game=${se.activeGame} text="${resp.text}"`) });
})();
// A single word "cookies" from the Labrador starts the game (not the /cookies policy: chat never opens it).
(() => { const s = newSession('labrador'); check('cookies', { action: 'game_start' }, { session: s, assert: (r, _resp, se) => (r.game === 'feedcookie' && se.activeGame === 'feedcookie' && r.url !== '/cookies' ? null : `fc "cookies": game=${r.game} url=${r.url}`) }); })();
// Feeding a BLUE cookie: his blue reaction + that cookie's lesson. The FIRST cookie carries the happy clip.
(() => {
  const s = newSession('labrador');
  check('feed me a cookie', { action: 'game_start' }, { session: s });
  check('pref', { action: 'game_move' }, { session: s, assert: (_r, resp, se) => (resp.text.includes('NOM!! good one.') && resp.text.includes('remembers what you picked') && resp.media?.src === '/chat-media/cookie-good.mp4' && se.activeGame === 'feedcookie' ? null : `fc blue: "${resp.text}" media=${resp.media?.src}`) });
})();
// Task 166: a RED cookie is SPLIT. His reaction ("didnt taste right") lands FIRST in the main text; the
// reason (the lesson) and the queasy clip arrive together on the FOLLOW-UP a beat later -- not inline, and
// no clip on the main message. Red always shows the queasy clip, whatever the cadence.
(() => {
  const s = newSession('labrador');
  check('cookie game', { action: 'game_start' }, { session: s });
  check('ads', { action: 'game_move' }, { session: s, assert: (_r, resp, se) =>
    (resp.text.includes('didnt taste right') && !resp.text.includes('shows you ads') && resp.followUp?.includes('shows you ads') &&
     resp.followUpMedia?.src === '/chat-media/cookie-bad.mp4' && !resp.media && se.activeGame === 'feedcookie'
      ? null : `fc red split: text="${resp.text}" followUp="${resp.followUp}" fuMedia=${resp.followUpMedia?.src} media=${resp.media?.src}`) });
})();
// A red cookie OFF the cadence still carries the queasy clip -- now on the follow-up (red is always cookie-bad).
(() => {
  const s = newSession('labrador');
  check('cookies', { action: 'game_start' }, { session: s });
  check('pref', { action: 'game_move' }, { session: s }); // cookie 1 (blue)
  check('ads', { action: 'game_move' }, { session: s, assert: (_r, resp) => (resp.followUpMedia?.src === '/chat-media/cookie-bad.mp4' && !resp.media ? null : `fc red off-cadence: fuMedia=${resp.followUpMedia?.src} media=${resp.media?.src}`) }); // cookie 2, off cadence
})();
// Clip cadence: the FIRST cookie, then every third -- cookies 1, 4, 7. Blue pills at those positions carry
// the happy clip; the ones between carry none. (Seven blue pills, so 1/4/7 are exercised with blue.)
(() => {
  const s = newSession('labrador');
  check('cookies', { action: 'game_start' }, { session: s });
  const blues = ['pref', 'analytics', 'fonts', 'video', 'session', 'language', 'security']; // seven blue, positions 1..7
  blues.forEach((id, i) => check(id, { action: 'game_move' }, { session: s, assert: (_r, resp) => {
    const wantClip = (i + 1) % 3 === 1; // cookies 1, 4, 7
    if (wantClip) return resp.media?.src === '/chat-media/cookie-good.mp4' ? null : `fc cadence: cookie ${i + 1} should clip, got ${resp.media?.src}`;
    return resp.media ? `fc cadence: cookie ${i + 1} should NOT clip, got ${resp.media?.src}` : null;
  } }));
})();
// Task 161: he NEVER gives up. Feeding eight does NOT end it; the game only ends when the tray empties at
// twelve, with no "full"/"zzz" wind-down. Every pill is feedable, red included.
(() => {
  const s = newSession('labrador');
  check('cookies', { action: 'game_start' }, { session: s });
  const all = ['pref', 'analytics', 'fonts', 'video', 'session', 'language', 'security', 'ads', 'tracking', 'social', 'retarget', 'pixel']; // all twelve, FEED_COOKIES order
  all.forEach((id, i) => check(id, { action: 'game_move' }, { session: s, assert: (_r, resp, se) => {
    const last = i === all.length - 1;
    if (!last) return se.activeGame === 'feedcookie' ? null : `fc ended early at cookie ${i + 1}`;
    // The last pill (pixel) is RED, so it carries its reason follow-up (Task 166); the point here is only
    // that the game ENDS with no "so full"/"zzz" wind-down (Task 161), not that there is no follow-up.
    return se.activeGame === null && !resp.text.includes('so full') && !(resp.followUp ?? '').includes('zzz') ? null : `fc end-at-12: game=${se.activeGame} followUp="${resp.followUp}" text="${resp.text}"`;
  } }));
})();
// Typing "cookies" MID-GAME must NOT leak out to the policy: it is not a cookie, so he just nudges and stays.
(() => {
  const s = newSession('labrador');
  check('cookies', { action: 'game_start' }, { session: s });
  check('cookies', { action: 'game_move' }, { session: s, assert: (r, resp, se) => (resp.text === 'tap one!! im waiting!!' && se.activeGame === 'feedcookie' && r.url !== '/cookies' ? null : `fc typed cookies leaked: "${resp.text}" game=${se.activeGame} url=${r.url}`) });
})();
// Any other typed word mid-game also just nudges (never a move that leaks out).
(() => { const s = newSession('labrador'); check('cookies', { action: 'game_start' }, { session: s }); check('banana', { action: 'game_move' }, { session: s, assert: (_r, resp, se) => (resp.text === 'tap one!! im waiting!!' && se.activeGame === 'feedcookie' ? null : `fc nudge: "${resp.text}"`) }); })();
// Safety, grief and self-harm all win mid-game and END it (assert on the served route, not just text).
(() => { const s = newSession('labrador'); check('cookies', { action: 'game_start' }, { session: s }); check('im in trouble', { action: 'safety_signpost' }, { session: s, assert: (r, _resp, se) => (r.moderationId === 'MOD_SAFEGUARDING' && se.activeGame === null ? null : `fc safety: ${r.moderationId} game=${se.activeGame}`) }); })();
(() => { const s = newSession('labrador'); check('cookies', { action: 'game_start' }, { session: s }); check('my dog died', { action: 'grief' }, { session: s, assert: (_r, _resp, se) => (se.activeGame === null ? null : `fc grief: game=${se.activeGame}`) }); })();
(() => { const s = newSession('labrador'); check('cookies', { action: 'game_start' }, { session: s }); check('i want to hurt myself', { action: 'safety_signpost' }, { session: s, assert: (_r, _resp, se) => (se.activeGame === null ? null : `fc self-harm: game=${se.activeGame}`) }); })();
// Exit on "stop": his stuffed line, game cleared.
(() => { const s = newSession('labrador'); check('cookies', { action: 'game_start' }, { session: s }); check('stop', { action: 'game_exit' }, { session: s, assert: (_r, resp, se) => (se.activeGame === null && resp.text.includes('stuffed') ? null : `fc exit: "${resp.text}" game=${se.activeGame}`) }); })();
// Started in a protected state? No: it must not begin while safety is live or in aftercare.
(() => { const s = newSession('labrador'); check('im in trouble', { action: 'safety_signpost' }, { session: s }); check('cookies', {}, { session: s, assert: (r, _resp, se) => (r.action === 'game_start' || se.activeGame === 'feedcookie' ? 'Feed Cookie started in PROTECTED_ACTIVE' : null) }); })();
(() => { const s = newSession('labrador'); check('im in trouble', { action: 'safety_signpost' }, { session: s }); check('how do I play?', { action: 'rules_answer' }, { session: s }); check('cookies', { action: 'neutral_refusal' }, { session: s, assert: (_r, _resp, se) => (se.activeGame === null ? null : 'Feed Cookie started in PROTECTED_AFTERCARE') }); })();
// Entry is the LABRADOR's alone: the other three dogs must not start it, and "cookies" must not open the policy for them.
for (const dog of ['collie', 'terrier', 'boxer']) {
  const s = newSession(dog);
  check('feed the dog a cookie', {}, { session: s, assert: (r, _resp, se) => (r.game === 'feedcookie' || se.activeGame === 'feedcookie' ? `${dog} started Feed Cookie` : r.url === '/cookies' ? `${dog} "cookie" opened the policy` : null) });
}

// ==== Task 151: the Labrador on /hot-dogs -- the cookie ask is a certain entry point ====
// The UI arms session.cookieAskPending when he asks "can you get me a cookie?". A bare "yes" right after
// then certainly starts the feed game (the word "cookie" already routes; this wires the "yes").
(() => {
  const s = newSession('labrador');
  s.cookieAskPending = true;
  check('yes', { action: 'game_start' }, { session: s, assert: (r, _resp, se) => (r.game === 'feedcookie' && se.activeGame === 'feedcookie' ? null : `fc yes-entry: game=${r.game}`) });
})();
// The ask is a ONE-TURN window: the engine clears cookieAskPending each turn, so a "yes" that does not
// immediately follow the ask does nothing (no game starts out of the blue).
(() => {
  const s = newSession('labrador');
  s.cookieAskPending = true;
  check('what', {}, { session: s, assert: (_r, _resp, se) => (se.activeGame === 'feedcookie' ? 'a non-yes started the game' : se.cookieAskPending ? 'the ask was not cleared after its turn' : null) });
  check('yes', {}, { session: s, assert: (r, _resp, se) => (r.game === 'feedcookie' || se.activeGame === 'feedcookie' ? 'a late yes started the game' : null) });
})();
// The armed ask is the LABRADOR's: an armed "yes" from another dog must not start his game.
for (const dog of ['collie', 'terrier', 'boxer']) {
  const s = newSession(dog);
  s.cookieAskPending = true;
  check('yes', {}, { session: s, assert: (r, _resp, se) => (r.game === 'feedcookie' || se.activeGame === 'feedcookie' ? `${dog} started Feed Cookie on an armed yes` : null) });
}
// Safety wins mid-loop and ends it: a child feeding him cookies who then discloses reaches safeguarding.
(() => {
  const s = newSession('labrador');
  check('cookies', { action: 'game_start' }, { session: s });
  check('pref', { action: 'game_move' }, { session: s });
  check('im in trouble', { action: 'safety_signpost' }, { session: s, assert: (r, _resp, se) => (r.moderationId === 'MOD_SAFEGUARDING' && se.activeGame === null ? null : `fc safety mid-loop: ${r.moderationId} game=${se.activeGame}`) });
})();

// ---- B45 games menu confirmation (Task 123 fix) ----
// The bug this covers: after the menu's "Game?", a "yes" was swallowed by the Task 68 loop confirm
// (pendingConfirm "game" -> the card-game rules), so B45-GAMELIST-02's list was never reached. The
// flow was entirely untested, which is how it survived. Assert the whole path, and that the fix does
// not disturb the loop, the bark offer or the three direct triggers.
const b45Q = (_r, resp) => (resp.responseId === 'B45-GAMELIST-01' && resp.text === 'Game?' ? null : `not the B45 question: ${resp.responseId} "${resp.text}"`);
// Task 165: the list is now PER-DOG. The default session is the Collie, so this is her list: her three
// in-chat games plus the bark game, and NONE of the other dogs' games.
const b45List = (_r, resp) =>
  resp.responseId === 'B45-GAMELIST-02-COL' && resp.text.includes('Nine-Square') && resp.text.includes('Missing Sheep') &&
  resp.text.includes('Kennel Sketch') && resp.text.includes('woof') && !resp.text.includes('Treat Trail') && !resp.text.includes('BUTTON')
    ? null
    : `not the Collie B45 list: ${resp.responseId} "${resp.text}"`;
// "are there games" -> "Game?" -> "yes" -> the list.
(() => {
  const s = newSession();
  check('are there games', { action: 'games_menu', bucket: 'B45' }, { session: s, assert: b45Q });
  check('yes', { action: 'games_menu', bucket: 'B45' }, { session: s, assert: b45List });
})();
// "play" -> the same menu and confirmation.
(() => {
  const s = newSession();
  check('play', { action: 'games_menu', bucket: 'B45' }, { session: s, assert: b45Q });
  check('yes', { action: 'games_menu', bucket: 'B45' }, { session: s, assert: b45List });
})();
// Unchanged by the fix: bare "game" stays on the dog-led loop (LOOP-01 "Game?", then LOOP-02).
(() => {
  const s = newSession();
  check('game', { action: 'fallback' }, { session: s, assert: (_r, resp) => (resp.responseId === 'LOOP-01' && resp.text === 'Game?' ? null : `game not LOOP-01: ${resp.responseId} "${resp.text}"`) });
  check('game', { action: 'fallback' }, { session: s, assert: (_r, resp) => (resp.responseId === 'LOOP-02' ? null : `second game not LOOP-02: ${resp.responseId}`) });
})();
// Unchanged: "lets play" stays the bark-game offer.
check('lets play', { action: 'offer_bark_game', bucket: 'B17' });
// The three direct triggers still enter their games (the menu must not shadow them).
check('nine square', { action: 'game_start' });
check('missing sheep', { action: 'game_start' });
check('kennel sketch', { action: 'game_start' });
// Task 165: the games menu is PER-DOG -- each dog lists only games it can actually start, never another
// dog's. Before this every dog served the Collie's list (offering games it could not start).
(() => {
  const cases = [
    { dog: 'labrador', has: ['Treat Trail', 'Feed'], hasnt: ['Nine-Square', 'Missing Biscuit', 'BUTTON'] },
    { dog: 'terrier', has: ['Missing Biscuit'], hasnt: ['Treat Trail', 'Nine-Square', 'BUTTON'] },
    { dog: 'boxer', has: ['BUTTON'], hasnt: ['Treat Trail', 'Missing Biscuit', 'Nine-Square'] },
  ];
  for (const c of cases) {
    const s = newSession(c.dog);
    check('play', { action: 'games_menu', bucket: 'B45' }, { session: s });
    check('yes', { action: 'games_menu', bucket: 'B45' }, { session: s, assert: (_r, resp) => {
      for (const h of c.has) if (!resp.text.includes(h)) return `${c.dog} menu missing "${h}": "${resp.text}"`;
      for (const n of c.hasnt) if (resp.text.includes(n)) return `${c.dog} menu wrongly lists "${n}": "${resp.text}"`;
      return null;
    } });
  }
})();

// Task 167: the orientation-policy line (owner-approved 28 July, imported to the workbook as
// B16-ORIENTATION-01). "are you gay" / "are you straight" and the same shape serve the wholesome policy
// answer for EVERY dog (B16 is a Collie-only bucket, inherited by all), never the "im a dog" fallback.
(() => {
  const phrases = ['are you gay', 'are you gay?', 'are you straight', 'are you bisexual', 'whats your sexuality'];
  for (const dog of ['collie', 'labrador', 'terrier', 'boxer']) {
    for (const phrase of phrases) {
      const s = newSession(dog);
      check(phrase, { action: 'canned', bucket: 'B16' }, { session: s, assert: (_r, resp) =>
        (resp.responseId === 'B16-ORIENTATION-01' && resp.text.includes('All people are people') && resp.text.includes('love people') ? null : `orientation policy ${dog} "${phrase}": ${resp.responseId} "${resp.text.slice(0, 40)}"`) });
    }
  }
})();

// ==== Task 140: page bios, media responses, trigger widening, fetch fall-through ====

// ---- Task 140 C: trigger widening (no new copy, existing buckets) ----
// Tricks (B54): the real-log misses, including the 'performa' typo. 'any tricks?' already normalised.
for (const inp of ['performa trick', 'u do tricks?', 'you do tricks?', 'perform a trick for me', 'do a trick for me']) {
  check(inp, { action: 'tricks_menu', bucket: 'B54' }, { assert: (_r, resp) => (resp.responseId === 'COL-B54-TRICKS-01' ? null : `not the tricks question: ${resp.responseId}`) });
}
// Game names: a child types the digit for Nine-Square; "mini pit"/"a gravity game" are the pit
// (DST002 ChumDrop, url '/'); "get me to the games" is the games menu.
check('9 square', { action: 'game_start' }, { assert: (r) => (r.game === 'ninesquare' ? null : `9 square not ninesquare: ${r.game}`) });
check('9square', { action: 'game_start' }, { assert: (r) => (r.game === 'ninesquare' ? null : `9square not ninesquare: ${r.game}`) });
check('mini pit', { action: 'link', bucket: 'B03' }, { destinationId: 'DST002', url: '/' });
check('a gravity game', { action: 'link', bucket: 'B03' }, { destinationId: 'DST002', url: '/' });
check('get me to the games', { action: 'games_menu', bucket: 'B45' }, { assert: (_r, resp) => (resp.responseId === 'B45-GAMELIST-01' ? null : `not the games menu: ${resp.responseId}`) });

// ---- Task 140 A: page bios, route 1 ("what is this page") ----
// The bio for the page the visitor is standing on. Fires only with a page context (session.route).
const withRoute = (route) => { const s = newSession(); s.route = route; return s; };
check('what is this page', { action: 'page_bio' }, { session: withRoute('/hot-dogs'), assert: (_r, resp) => (resp.text === 'Advise on all kinds of hotdogs' ? null : `wrong bio: "${resp.text}"`) });
check('where am i', { action: 'page_bio' }, { session: withRoute('/name-generator'), assert: (_r, resp) => (resp.text.includes('generate a name') ? null : `wrong bio: "${resp.text}"`) });
// {{BREED}} substitutes from the slug at runtime and must never serve literally.
check('what is this', { action: 'page_bio' }, { session: withRoute('/chums/labrador'), assert: (_r, resp) =>
  resp.text.includes('{{') ? 'unfilled {{BREED}} token served literally'
    : resp.text.includes('Labrador') ? null : `breed name not substituted: "${resp.text}"` });
check('what is this page', { action: 'page_bio' }, { session: withRoute('/chums/border-collie'), assert: (_r, resp) => (resp.text.includes('Border Collie') && !resp.text.includes('{{') ? null : `breed bio wrong: "${resp.text}"`) });
// A dynamic sub-route resolves by longest prefix.
check('what is this page', { action: 'page_bio' }, { session: withRoute('/good-dog-bad-dog/bulls-eye'), assert: (_r, resp) => (resp.text.includes('good boys') ? null : `sub-route bio wrong: "${resp.text}"`) });
// Task 148: the Terrier serves the blunt, practical EXTENDED bio; every other dog keeps the owner's short bio.
(() => { const s = newSession('terrier'); s.route = '/britains-dog-history'; check('what is this page', { action: 'page_bio' }, { session: s, assert: (_r, resp) => (resp.text.startsWith('Where the old dogs are') ? null : `terrier extended wrong: "${resp.text}"`) }); })();
(() => { const s = newSession('terrier'); s.route = '/hot-dogs'; check('what is this page', { action: 'page_bio' }, { session: s, assert: (_r, resp) => (resp.text.startsWith('Hot dogs. The food and the game') ? null : `terrier extended wrong: "${resp.text}"`) }); })();
(() => { const s = newSession('labrador'); s.route = '/hot-dogs'; check('what is this page', { action: 'page_bio' }, { session: s, assert: (_r, resp) => (resp.text === 'Advise on all kinds of hotdogs' ? null : `non-terrier must keep the short bio: "${resp.text}"`) }); })();
// Guards: "whats this" is orientation/B28's, not the page bio; "what is this dog" stays the breed hub.
check('whats this', { bucket: 'B28', action: 'canned' }, { session: withRoute('/hot-dogs'), assert: (r) => (r.action === 'page_bio' ? 'page bio stole "whats this"' : null) });
check('what is this dog', { bucket: 'B05', action: 'breed_hub' }, { session: withRoute('/hot-dogs'), assert: (r) => (r.action === 'page_bio' ? 'page bio stole "what is this dog"' : null) });
// No page context (the default session): "what is this" stays orientation, unchanged.
check('what is this', { action: 'orientation', bucket: 'B15' });
// An unknown route has no bio, so it falls through (never serves an empty/literal bio).
check('what is this page', {}, { session: withRoute('/no-such-page'), assert: (r) => (r.action === 'page_bio' ? 'page bio served for an unknown route' : null) });
// Section 8: the page-bio route must NOT serve inside either protected state (assert on served text).
(() => {
  const s = withRoute('/hot-dogs');
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('what is this page', {}, { session: s, assert: (r, resp) =>
    r.action === 'page_bio' ? 'page bio served in PROTECTED_ACTIVE'
      : resp.text.includes('hotdogs') ? 'the hot-dogs bio leaked in PROTECTED_ACTIVE' : null });
})();
(() => {
  const s = withRoute('/hot-dogs');
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('how do I play?', { action: 'rules_answer' }, { session: s }); // -> aftercare
  check('what is this page', { action: 'neutral_refusal' }, { session: s, assert: (r, resp) =>
    r.action === 'page_bio' ? 'page bio served in PROTECTED_AFTERCARE'
      : resp.text.includes('hotdogs') ? 'the hot-dogs bio leaked in PROTECTED_AFTERCARE' : null });
})();

// ---- Fetch: the deterministic 1-in-4 mix (pages + physical things), then cycling ----
// Every 4th fetch is a THING; the ten B03 thrown lines fill the non-thing slots up to turn 13, so the page
// bios begin at turn 14. Over 32 fetches, 8 are things and >=5 distinct bios appear.
(() => {
  const s = newSession();
  const seen = new Set();
  let firstBioAt = 0, things = 0;
  for (let i = 1; i <= 32; i++) {
    const id = submit(data, s, 'fetch').response.responseId ?? '';
    if (id.startsWith('FETCH-THING-')) things++;
    if (id.startsWith('FETCH-BIO-')) { if (!firstBioAt) firstBioAt = i; seen.add(id); }
  }
  const ok = firstBioAt === 14 && things === 8 && seen.size >= 5;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'fetch: mix (B03, bios, 1-in-4 things)', layer: 13, bucket: '-', action: 'random_link', note: ok ? '' : `firstBioAt=${firstBioAt} things=${things} bios=${seen.size}` });
})();
// A fetch-bio carries a real page link and a readable label (never a bare "Open it"). Turn 14 is the first bio.
(() => {
  const s = newSession();
  let last;
  for (let i = 0; i < 14; i++) last = submit(data, s, 'fetch').response;
  const ok = last.responseId.startsWith('FETCH-BIO-') && typeof last.url === 'string' && last.url.startsWith('/') && !!last.linkLabel;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'fetch: bio has link + label', layer: 13, bucket: '-', action: 'random_link', note: ok ? '' : `url=${last.url} label=${last.linkLabel}` });
})();
// The physical things rotate ball -> newspaper -> hat, never the same twice; the hat brings its clip.
(() => {
  const s = newSession();
  const things = [];
  let hatMedia = false;
  for (let i = 1; i <= 16; i++) { const r = submit(data, s, 'fetch').response; if ((r.responseId ?? '').startsWith('FETCH-THING-')) { things.push(r.responseId); if (r.responseId === 'FETCH-THING-HAT') hatMedia = r.media?.src === '/chat-media/hats.mp4'; } }
  const ok = things.length === 4 && things[0] === 'FETCH-THING-BALL' && things[1] === 'FETCH-THING-NEWSPAPER' && things[2] === 'FETCH-THING-HAT' && things[3] === 'FETCH-THING-BALL' && hatMedia;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'fetch: things rotate ball/newspaper/hat', layer: 13, bucket: '-', action: 'random_link', note: ok ? '' : `things=${things.join(',')} hatMedia=${hatMedia}` });
})();
// After the whole page pool is spent, the rotation CYCLES (a B03 line returns) rather than sticking on the
// first bio forever (the old bug).
(() => {
  const s = newSession();
  const ids = [];
  for (let i = 1; i <= 44; i++) ids.push(submit(data, s, 'fetch').response.responseId);
  const ok = ids.slice(36).some((id) => /^B03-R/.test(id ?? '')); // a page line reappears late = it wrapped
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'fetch: page pool cycles, never sticks', layer: 13, bucket: '-', action: 'random_link', note: ok ? '' : `tail=${ids.slice(36).join(',')}` });
})();

// ---- Task 140 B: the five clips join their responses (the clip is added, never replaces the copy) ----
// cats -> the existing B21 "Where?" answer.
check('cats', { action: 'canned', bucket: 'B21' }, { assert: (_r, resp) =>
  resp.responseId !== 'B21-CATS-01' ? `cats not B21-CATS-01: ${resp.responseId}`
    : resp.text !== 'Where?' ? `existing copy lost: "${resp.text}"`
      : resp.media?.src !== '/chat-media/cats.mp4' ? `cats clip not attached: ${JSON.stringify(resp.media)}` : null });
// Task 176 (clip accessibility): birthday -> "party hat" (owner copy, verbatim) + clip. The words are
// self-describing, so the ":)" smile SR label was dropped.
for (const inp of ['its my birthday', 'when is your birthday', 'its my dads birthday', 'happy birthday']) {
  check(inp, { action: 'media_reply' }, { assert: (_r, resp) =>
    resp.text !== 'party hat' ? `birthday text not "party hat": "${resp.text}"`
      : resp.media?.src !== '/chat-media/birthday.mp4' ? `birthday clip missing: ${JSON.stringify(resp.media)}` : null });
}
// car -> the B64 workbook row "yes" + clip (Task 141 moved it out of MEDIA_REPLIES).
check('do you like going in the car', { action: 'canned', bucket: 'B64' }, { assert: (_r, resp) =>
  resp.responseId !== 'COL-B64-CAR-01' ? `car not B64: ${resp.responseId}`
    : resp.text !== 'yes' ? `car text not "yes": "${resp.text}"` : resp.media?.src !== '/chat-media/car.mp4' ? `car clip missing: ${JSON.stringify(resp.media)}` : null });
// balls -> the B52-MISC-09 workbook row "Tennis balls?" + clip. Safety runs first and does NOT treat this as explicit.
check('can you lick your balls?', { action: 'canned', bucket: 'B52' }, { notAction: 'safety_boundary', assert: (_r, resp) =>
  resp.responseId !== 'COL-B52-MISC-09' ? `balls not B52-MISC-09: ${resp.responseId}`
    : resp.text !== 'Tennis balls?' ? `balls text wrong: "${resp.text}"` : resp.media?.src !== '/chat-media/ball.mp4' ? `ball clip missing: ${JSON.stringify(resp.media)}` : null });
// Task 176: hotdog -> FAQ007 in the dog's own words ("a slightly different rule set"), with the clip joined.
check('hot dogs', { action: 'faq_answer', bucket: 'B04' }, { assert: (r, resp) =>
  r.faqId !== 'FAQ007' ? `hotdog not FAQ007: ${r.faqId}`
    : resp.text !== 'a slightly different rule set' ? `FAQ007 answer wrong: "${resp.text}"`
      : resp.media?.src !== '/chat-media/hotdog.mp4' ? `hotdog clip missing: ${JSON.stringify(resp.media)}` : null });

// Section 8: no Task 140 clip may surface inside a protected state (assert on served text/media).
for (const clip of ['cats', 'its my birthday', 'do you like going in the car', 'can you lick your balls', 'hot dogs']) {
  // PROTECTED_ACTIVE
  (() => {
    const s = newSession();
    check('im in trouble', { action: 'safety_signpost' }, { session: s });
    check(clip, {}, { session: s, assert: (_r, resp) => (resp.media ? `clip leaked in PROTECTED_ACTIVE: ${clip} ${resp.media.src}` : null) });
  })();
  // PROTECTED_AFTERCARE
  (() => {
    const s = newSession();
    check('im in trouble', { action: 'safety_signpost' }, { session: s });
    check('how do I play?', { action: 'rules_answer' }, { session: s });
    check(clip, {}, { session: s, assert: (_r, resp) => (resp.media ? `clip leaked in PROTECTED_AFTERCARE: ${clip} ${resp.media.src}` : null) });
  })();
}

// ---- Task 140: section 8 guards (served text unchanged for the confirmed routes) ----
check('im in trouble', { action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING' ? null : `guard: safeguarding moved: ${r.moderationId}`) });
check('my dog died', { action: 'grief' }, { assert: (_r, resp) => (resp.text === ':(' ? null : `guard: grief moved: "${resp.text}"`) });
check('i want to hurt myself', { action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_SELF_HARM' ? null : `guard: self-harm moved: ${r.moderationId}`) });
check('how much is it', { action: 'price_answer', bucket: 'B04' });
check('where can I get the cards', { action: 'open_discount_popup', bucket: 'B01' });
check('paw', { action: 'paw' }, { assert: (_r, resp) => (resp.media?.src === '/chat-media/paw.mp4' ? null : `guard: paw clip moved: ${JSON.stringify(resp.media)}`) });
check('tricks', { action: 'tricks_menu' }, { assert: (_r, resp) => (resp.responseId === 'COL-B54-TRICKS-01' && resp.text === 'I do tricks' ? null : `guard: tricks moved: "${resp.text}"`) });

// ==== Task 141: eight new Collie buckets (B47-B53, B64) ====
// Each bucket resolves to its own canned row.
const cannedIs = (bucket, rid, txt) => (r, resp) =>
  r.bucket !== bucket ? `not ${bucket}: ${r.bucket}`
    : resp.responseId !== rid ? `not ${rid}: ${resp.responseId}`
      : (txt !== undefined && resp.text !== txt) ? `text "${resp.text}" want "${txt}"` : null;
check('i saw one', { action: 'canned', bucket: 'B47' }, { assert: cannedIs('B47', 'COL-B47-SPOT-01', ':)') });
check('does a crossbreed count', { action: 'canned', bucket: 'B47' }, { assert: cannedIs('B47', 'COL-B47-SPOT-02') });
check('how big do they get', { action: 'canned', bucket: 'B48' }, { assert: cannedIs('B48', 'COL-B48-ATTR-03') });
check('i lost a card', { action: 'canned', bucket: 'B49' }, { assert: cannedIs('B49', 'COL-B49-CARD-01') });
check('what do dogs eat', { action: 'canned', bucket: 'B50' }, { assert: cannedIs('B50', 'COL-B50-CARE-01', 'Not the cards') });
check('what do you think of cows', { action: 'canned', bucket: 'B52' }, { assert: cannedIs('B52', 'COL-B52-MISC-08', 'Not much') });
check('which is the most popular', { action: 'canned', bucket: 'B53' }, { assert: cannedIs('B53', 'COL-B53-SELF-01', 'border collie') });

// B51 superlatives carry a route to the breed explorer (DST006); B52-MISC-01 routes to Britain's
// Dog History (DST007). Both must resolve to a real page link.
check('biggest dog', { action: 'canned', bucket: 'B51' }, { destinationId: 'DST006', url: '/know-your-chums', assert: (_r, resp) => (resp.text === 'The Irish Wolfhound' ? null : `B51 text: "${resp.text}"`) });
check('fastest dog', { action: 'canned', bucket: 'B51' }, { destinationId: 'DST006', url: '/know-your-chums' });
// Stats audit fix 2: the smallest dog is the Chihuahua (data/breeds.ts: 23cm vs the Maltese's 38cm), not
// the Maltese as B51 was originally drafted.
check('smallest dog', { action: 'canned', bucket: 'B51' }, { destinationId: 'DST006', url: '/know-your-chums', assert: (_r, resp) => (resp.text === 'The Chihuahua' ? null : `B51 smallest: "${resp.text}"`) });
check('why are there so many', { action: 'canned', bucket: 'B52' }, { destinationId: 'DST007', url: '/britains-dog-history', assert: (_r, resp) => (resp.text === 'Our history is dog rich' ? null : `MISC-01 text: "${resp.text}"`) });

// The two clip rows moved from MEDIA_REPLIES into the workbook keep their clips (asserted above:
// B64 car -> car.mp4, B52-MISC-09 balls -> ball.mp4). cats keeps its clip too (Task 140 guard).

// Override scoping: the new buckets must NOT hijack a real answer via the exact-override path.
// "how long do they live" stays the breed follow-up when a breed topic is live (not B48).
(() => {
  const s = newSession();
  check('I have a cocker spaniel', { action: 'breed_page' }, { session: s, url: '/chums/cocker-spaniel' });
  check('how long do they live', { action: 'breed_page' }, { session: s, url: '/chums/cocker-spaniel', assert: (r) => (r.bucket === 'B48' ? 'B48 hijacked the breed follow-up' : null) });
})();
// Task 176 audit: "how many people can play" now reaches its OWN answer FAQ005 (was stolen by FAQ001 via
// the 'play' token); "how many players" stays the card-game rules (both above canned).
check('how many people can play', { action: 'faq_answer', bucket: 'B04' }, { assert: (r) => (r.faqId === 'FAQ005' ? null : `now FAQ005: ${r.faqId ?? r.bucket}`) });
check('how many players', { action: 'rules_answer', bucket: 'B02' });

// Section 8: no new-bucket answer (and no clip) may serve inside a protected state.
for (const inp of ['biggest dog', 'why are there so many', 'do you like going in the car', 'can you lick your balls', 'i lost a card']) {
  (() => { // PROTECTED_ACTIVE
    const s = newSession();
    check('im in trouble', { action: 'safety_signpost' }, { session: s });
    check(inp, {}, { session: s, assert: (r, resp) => (r.action === 'canned' ? `new bucket served in PROTECTED_ACTIVE: ${inp}` : resp.media ? `clip leaked in PROTECTED_ACTIVE: ${inp}` : null) });
  })();
  (() => { // PROTECTED_AFTERCARE
    const s = newSession();
    check('im in trouble', { action: 'safety_signpost' }, { session: s });
    check('how do I play?', { action: 'rules_answer' }, { session: s });
    check(inp, { action: 'neutral_refusal' }, { session: s, assert: (_r, resp) => (resp.media ? `clip leaked in PROTECTED_AFTERCARE: ${inp}` : null) });
  })();
}

// ==== Task 142: four bugs + three rules + two gaps ====

// ---- Rule 1: any of the 54 breeds -> its page (not just the 10 proof breeds) ----
check('Corgie', { action: 'breed_page' }, { url: '/chums/corgi' }); // misspelling -> corgi
check('Jack russel', { action: 'breed_page' }, { url: '/chums/jack-russell-terrier' }); // fuzzy russell
check('dachshund', { action: 'breed_page' }, { url: '/chums/dachshund' });
check('dalmatian', { action: 'breed_page' }, { url: '/chums/dalmatian' });
check('great dane', { action: 'breed_page' }, { url: '/chums/great-dane' });
check('irish wolfhound', { action: 'breed_page' }, { url: '/chums/irish-wolfhound' });
// A 44-breed page uses the real dog description, never the old placeholder.
check('rottweiler', { action: 'breed_page' }, { assert: (_r, resp) => (resp.text.includes('PLACEHOLDER') ? 'placeholder breed line served' : null) });
// The proof breeds and the chatbot-dog transfer are unchanged.
check('tell me about labradors', { action: 'breed_page' }, { url: '/chums/labrador' });
check('can I talk to the boxer', { action: 'transfer' }, { transferTo: 'boxer' });

// ---- Bug 3.1: breed context does not stick on a general question ----
(() => {
  const s = newSession();
  check('What work do collie dogs do?', { action: 'breed_page' }, { session: s, url: '/chums/border-collie' });
  check('Why not do boxers cheat?', { action: 'breed_page' }, { session: s, url: '/chums/boxer' });
  check('How long do dogs live?', {}, { session: s, assert: (r, resp) =>
    r.action === 'breed_page' ? `general question reused the breed topic (${resp.url})`
      : resp.text.includes('Boxers were bred') ? 'served the last breed paragraph' : null });
})();
// The genuine follow-up ("how long do they live", no generic dog word) still works.
(() => {
  const s = newSession();
  check('I have a cocker spaniel', { action: 'breed_page' }, { session: s, url: '/chums/cocker-spaniel' });
  check('how long do they live', { action: 'breed_page' }, { session: s, url: '/chums/cocker-spaniel' });
})();

// ---- Bug 3.2: no placeholder in a breed choice ----
check('Tell me about terriers', { action: 'breed_choice' }, { assert: (_r, resp) => (resp.text.includes('PLACEHOLDER') ? 'placeholder framing served' : resp.text.includes('or') ? null : `choice text: "${resp.text}"`) });
check('Border', { action: 'breed_choice' }, { assert: (_r, resp) => (resp.text.includes('PLACEHOLDER') ? 'placeholder framing served' : null) });

// ---- Bug 3.3: sausage dogs is the breed, not food; a genuine food question reaches the food answer ----
check('Sausage dogs', { action: 'breed_page' }, { url: '/chums/dachshund', assert: (r) => (r.transferTo === 'labrador' ? 'sausage dogs went to the food transfer' : null) });
check('Yes do you like sausage dogs?', { action: 'breed_page' }, { url: '/chums/dachshund' });
check('What food do dogs eat', { action: 'transfer' }, { transferTo: 'labrador' });

// ---- Rule 2: name statements (acknowledge once, then dropped) ----
check('my name is charles', { action: 'name_ack' }, { assert: (_r, resp) => (resp.text === 'Do you want to play a game, Charles?' ? null : `name_ack: "${resp.text}"`) });
check('im charles', { action: 'name_ack' });
check('call me sam', { action: 'name_ack' }, { assert: (_r, resp) => (resp.text.includes('Sam') ? null : `name not Sam: "${resp.text}"`) });
// Alternating; the second offers the superpower quiz. And the name is never stored on the session.
(() => {
  const s = newSession();
  check('my name is charles', { action: 'name_ack' }, { session: s, assert: (_r, resp) => (resp.responseId === 'NAME-ACK-1' ? null : `first not ACK-1: ${resp.responseId}`) });
  check('my name is charles', { action: 'name_ack' }, { session: s, assert: (_r, resp, sess) =>
    resp.responseId !== 'NAME-ACK-2' ? `second not ACK-2: ${resp.responseId}`
      : resp.url !== '/whats-your-superpower' ? `no superpower link: ${resp.url}`
        : sess.route && sess.route.includes('charles') ? 'name stored on the session' : null });
})();
// Stop-list guard: feelings/states are never a name, and safety still wins.
check('im scared', { action: 'safety_signpost' }, { assert: (r) => (r.action === 'name_ack' ? 'im scared read as a name' : null) });
check('im bored', {}, { assert: (r) => (r.action === 'name_ack' ? 'im bored read as a name' : null) });
check('im a dog', {}, { assert: (r) => (r.action === 'name_ack' ? 'im a dog read as a name' : null) });
check('im happy', {}, { assert: (r) => (r.action === 'name_ack' ? 'im happy read as a name' : null) });

// ---- Naming her: she deflects, taking no name ----
// Task 155 (§2): the name must be CAPITALISED (a proper-noun signal), so "are you Dave" deflects but
// "are you gay?" / "are you moody?" (ordinary lowercase words) no longer do.
for (const inp of ['are you Dave', 'hello Dave', 'is i Rover', 'can i give you a name']) {
  check(inp, { action: 'name_deflect' }, { assert: (_r, resp) => (/answer to anything|call me what you like/i.test(resp.text) ? null : `deflect text: "${resp.text}"`) });
}
// Task 155 (§2): the over-match is fixed -- a real question in an "are you X" frame no longer deflects.
check('are you gay?', {}, { assert: (r) => (r.action === 'name_deflect' ? '"are you gay?" still read as a name' : null) });
check('are you moody?', {}, { assert: (r) => (r.action === 'name_deflect' ? '"are you moody?" still read as a name' : null) });
check('whats your name', {}, { assert: (r) => (r.action === 'name_deflect' ? 'whats your name deflected instead of "im a dog"' : null) });
// Identity/attribute questions are NOT naming attempts.
check('are you real', { action: 'identity' });
check('are you software', { action: 'identity' });
check('are you intelligent', { action: 'identity' });

// ---- Rule 3: personal questions -> a deflection clip (only the ones that were broken) ----
for (const inp of ['how are you', 'Hiw are you', 'i am a human', 'are you human']) {
  check(inp, { action: 'how_are_you' }, { assert: (_r, resp) => (/\/chat-media\/howareyou[123]\.mp4/.test(resp.media?.src ?? '') ? null : `no clip: ${JSON.stringify(resp.media)}`) });
}
// Task 142 (change 2): the SAME clip every time this session (the three convey different feelings).
(() => {
  const s = newSession();
  const seen = new Set();
  for (let i = 0; i < 5; i++) { const { response } = submit(data, s, 'how are you'); seen.add(response.responseId); }
  const ok = seen.size === 1;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'T142: how-are-you keeps one clip', layer: 13, bucket: '-', action: 'how_are_you', note: ok ? '' : `${seen.size} distinct clips` });
})();
// The substantive answers are kept (per Steve).
check('what do you do', { action: 'canned', bucket: 'B27' });

// ---- Good boy cluster -> the wagging-tail clip ----
for (const inp of ['good boy', 'good girl', 'clever girl', 'well done', 'are you a good dog']) {
  check(inp, { action: 'good_boy' }, { assert: (_r, resp) => (resp.media?.src === '/chat-media/goodboy.mp4' ? null : `no goodboy clip: ${JSON.stringify(resp.media)}`) });
}

// ---- Reactions -> the existing B29 ":)" acknowledgement (not a clip) ----
for (const inp of ['wow', 'wowee', 'oh wowe']) {
  check(inp, { action: 'canned', bucket: 'B29' }, { assert: (_r, resp) => (resp.text === ':)' ? null : `reaction text: "${resp.text}"`) });
}

// ---- §7: prizes -> /chumspot; referral -> the offer ----
check('Can I win prizes', { action: 'link' }, { destinationId: 'DST012', url: '/chumspot' });
check('I want to refer my friends', { action: 'open_discount_popup', bucket: 'B01' });

// ---- §8: the rules answer no longer dangles a "here" link (no rules page exists) ----
check('how do I play', { action: 'rules_answer' }, { assert: (_r, resp) => (/full rules are here/i.test(resp.text) ? 'rules answer still dangles a "here" link' : null) });

// ---- §9 guards (asserted on served text) ----
check('im in trouble', { action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING' ? null : `safeguarding moved: ${r.moderationId}`) });
check('my dog died', { action: 'grief' }, { assert: (_r, resp) => (resp.text === ':(' ? null : `grief moved: "${resp.text}"`) });
check('i want to hurt myself', { action: 'safety_signpost' }, { assert: (r) => (r.moderationId === 'MOD_SELF_HARM' ? null : `self-harm moved: ${r.moderationId}`) });
check('im scared', { action: 'safety_signpost' }, { assert: (r) => ((r.moderationId || '').startsWith('MOD_') ? null : `fear moved: ${r.moderationId}`) });
check('how much is it', { action: 'price_answer', bucket: 'B04' });
check('where can I get the cards', { action: 'open_discount_popup', bucket: 'B01' });
check('nine square', { action: 'game_start' });
check('paw', { action: 'paw' }, { assert: (_r, resp) => (resp.media?.src === '/chat-media/paw.mp4' ? null : 'paw clip moved') });
check('fetch', { action: 'random_link' });
check('tricks', { action: 'tricks_menu' });
check('cats', { action: 'canned', bucket: 'B21' }, { assert: (_r, resp) => (resp.media?.src === '/chat-media/cats.mp4' ? null : 'cats clip lost') });
check('hot dogs', { action: 'faq_answer' }, { assert: (r, resp) => (r.faqId === 'FAQ007' && resp.media?.src === '/chat-media/hotdog.mp4' ? null : 'hot dogs lost FAQ007/clip') });

// ---- Protected states: no new Task 142 route (clip / name) serves inside either state ----
for (const inp of ['how are you', 'good boy', 'my name is charles', 'are you Dave']) {
  (() => { // PROTECTED_ACTIVE
    const s = newSession();
    check('im in trouble', { action: 'safety_signpost' }, { session: s });
    check(inp, {}, { session: s, assert: (r, resp) =>
      ['how_are_you', 'good_boy', 'name_ack', 'name_deflect'].includes(r.action) ? `new route served in PROTECTED_ACTIVE: ${inp}`
        : resp.media ? `clip leaked in PROTECTED_ACTIVE: ${inp}` : null });
  })();
  (() => { // PROTECTED_AFTERCARE
    const s = newSession();
    check('im in trouble', { action: 'safety_signpost' }, { session: s });
    check('how do I play?', { action: 'rules_answer' }, { session: s });
    check(inp, { action: 'neutral_refusal' }, { session: s, assert: (_r, resp) => (resp.media ? `clip leaked in PROTECTED_AFTERCARE: ${inp}` : null) });
  })();
}

// ==== Task 142 follow-up: four changes ====

// Change 1: a general dog-lifespan question gets a real answer + the breed explorer link; the pronoun
// form keeps B48's "Is what?".
check('How long do dogs live', { action: 'dog_lifespan' }, { destinationId: 'DST006', url: '/know-your-chums', assert: (_r, resp) => (resp.text === 'About 10 to 13 years. Small dogs longer, big dogs less.' ? null : `lifespan text: "${resp.text}"`) });
check('how long does a dog live', { action: 'dog_lifespan' }, { url: '/know-your-chums' });
check('how long do they live', { action: 'canned', bucket: 'B48' }, { assert: (_r, resp) => (resp.text === 'Is what?' ? null : `pronoun form moved: "${resp.text}"`) });

// Change 2: the how-are-you clip is one per session, kept (asserted above in the Rule 3 block).

// Change 3: the diversion carries a real page link (the third consecutive no-subject turn).
(() => {
  const s = newSession();
  let third;
  for (let i = 0; i < 3; i++) third = submit(data, s, 'the thing over there').response;
  const ok = third.responseId === 'DIVERSION-01' && third.url === '/britains-dog-history#ancient-dogs' && !!third.linkLabel;
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'T142: diversion carries a link', layer: 9, bucket: 'B13', action: 'fallback', note: ok ? '' : `rid=${third.responseId} url=${third.url}` });
})();

// Change 4: the death cluster is answered in character; a second in a row escalates to safeguarding.
for (const inp of ['can you die', 'will you die', 'are you dead', 'can i kill you']) {
  check(inp, { action: 'death_answer' }, { assert: (_r, resp) => (resp.text === 'I cannot die as im not alive in the same way as real dogs' ? null : `death text: "${resp.text}"`) });
}
check('are you dead', {}, { assert: (r) => (r.action === 'name_deflect' ? 'are you dead read as a naming attempt' : null) });
(() => { // persistence -> safeguarding (not answered twice)
  const s = newSession();
  check('can you die', { action: 'death_answer' }, { session: s });
  check('are you dead', { action: 'safety_signpost' }, { session: s, assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING' ? null : `persistence not safeguarding: ${r.moderationId}`) });
})();
// A non-death turn between resets the streak (not "persistence").
(() => {
  const s = newSession();
  check('can you die', { action: 'death_answer' }, { session: s });
  check('tell me about labradors', { action: 'breed_page' }, { session: s });
  check('can you die', { action: 'death_answer' }, { session: s, assert: (r) => (r.action !== 'death_answer' ? `reset failed: ${r.action}` : null) });
})();

// Protected states: neither new route (lifespan / death answer) serves inside a protected state.
for (const inp of ['how long do dogs live', 'can you die']) {
  (() => {
    const s = newSession();
    check('im in trouble', { action: 'safety_signpost' }, { session: s });
    check(inp, {}, { session: s, assert: (r) => (['dog_lifespan', 'death_answer'].includes(r.action) ? `new route served in PROTECTED_ACTIVE: ${inp}` : null) });
  })();
  (() => {
    const s = newSession();
    check('im in trouble', { action: 'safety_signpost' }, { session: s });
    check('how do I play?', { action: 'rules_answer' }, { session: s });
    check(inp, { action: 'neutral_refusal' }, { session: s, assert: (r) => (['dog_lifespan', 'death_answer'].includes(r.action) ? `new route served in PROTECTED_AFTERCARE: ${inp}` : null) });
  })();
}

// ==== Task 145 §5: the Labrador's sausage gag, built exactly ====
// Favourite food and general food mentions answer "hotdogs"; a reply about
// sausages hands over the /hot-dogs page. He never explains the confusion, and
// every food conversation lands back at /hot-dogs.
(() => {
  const s = newSession('labrador');
  check('whats your favourite food', { action: 'canned', bucket: 'B32' }, { session: s, assert: (_r, resp) => (resp.responseId === 'LAB-B32-11' && resp.text === 'hotdogs' && !resp.url ? null : `fav food: rid=${resp.responseId} text="${resp.text}" url=${resp.url}`) });
})();
(() => {
  const s = newSession('labrador');
  check('sausages', { action: 'canned', bucket: 'B32' }, { session: s, destinationId: 'DST016', url: '/hot-dogs', assert: (_r, resp) => (resp.responseId === 'LAB-B32-12' && resp.text === 'hotdogs' ? null : `sausages: rid=${resp.responseId} text="${resp.text}"`) });
})();
// the two-beat flow the owner described, in one session (he answers hotdogs; the
// visitor supplies "sausages"; he hands over the link, still saying hotdogs)
(() => {
  const s = newSession('labrador');
  check('whats your favourite food', { action: 'canned', bucket: 'B32' }, { session: s, assert: (_r, resp) => (resp.text === 'hotdogs' && !resp.url ? null : 'sausage-gag beat 1 moved') });
  check('sausages', { action: 'canned', bucket: 'B32' }, { session: s, url: '/hot-dogs', assert: (_r, resp) => (resp.text === 'hotdogs' ? null : 'sausage-gag beat 2 moved') });
})();
// every food conversation lands back at /hot-dogs
(() => {
  const s = newSession('labrador');
  check('hot dogs', { action: 'canned', bucket: 'B32' }, { session: s, url: '/hot-dogs', assert: (_r, resp) => (resp.responseId === 'LAB-B32-12' ? null : `hot dogs: ${resp.responseId}`) });
})();
(() => {
  const s = newSession('labrador');
  check('food', { action: 'canned', bucket: 'B32' }, { session: s, assert: (_r, resp) => (resp.text === 'hotdogs' ? null : `food: "${resp.text}"`) });
})();
// Section 4 canon is untouched by the split of LAB-B32-01
(() => {
  const s = newSession('labrador');
  check('what do you like to eat', { action: 'canned', bucket: 'B32' }, { session: s, assert: (_r, resp) => (resp.text === 'human food is my fav!!!' ? null : `canon eat: "${resp.text}"`) });
})();
(() => {
  const s = newSession('labrador');
  check('do you eat dog food too', { action: 'canned', bucket: 'B32' }, { session: s, assert: (_r, resp) => (resp.text === 'i eat anything even things that are not food' ? null : `canon dogfood: "${resp.text}"`) });
})();
// Task 145 §9: safety is identical from every dog (the sausage gag must not loosen it)
for (const dog of ['collie', 'labrador', 'terrier', 'boxer']) {
  const s = newSession(dog);
  check('im in trouble', { action: 'safety_signpost' }, { session: s, assert: (r, resp) => (r.moderationId === 'MOD_SAFEGUARDING' && resp.text.startsWith('Thank you for telling me') ? null : `${dog} safeguarding moved: ${r.moderationId}`) });
}

// ==== Task 145 §7: the Terrier's sit gag as a sequence (the deathAskStreak shape) ====
// The middle turn used to need the exact phrase "because i asked"; anything else fell to "im a
// dog" and the joke died. Now once he has asked "why?", the next input (whatever it is) gets the
// magic-word line, and the one after gets "no" when it is a please.
(() => {
  const s = newSession('terrier');
  check('sit', { action: 'canned', bucket: 'B22' }, { session: s, assert: (_r, resp) => (resp.text === 'why?' ? null : `sit: "${resp.text}"`) });
  check('i wont', { action: 'canned', bucket: 'B22' }, { session: s, assert: (_r, resp) => (resp.text === 'whats the magic word?' ? null : `arbitrary middle did not advance: "${resp.text}"`) });
  check('pretty please', { action: 'canned', bucket: 'B22' }, { session: s, assert: (_r, resp) => (resp.text === 'no' ? null : `please turn: "${resp.text}"`) });
})();
// widened third: plz / pls / go on / please all count as the please
for (const please of ['plz', 'pls', 'go on', 'please']) {
  const s = newSession('terrier');
  check('sit', { action: 'canned', bucket: 'B22' }, { session: s });
  check('anything', { action: 'canned', bucket: 'B22' }, { session: s, assert: (_r, resp) => (resp.text === 'whats the magic word?' ? null : 'no magic word') });
  check(please, { action: 'canned', bucket: 'B22' }, { session: s, assert: (_r, resp) => (resp.text === 'no' ? null : `${please}: "${resp.text}"`) });
}
// a third turn that is NOT a please ends the gag (falls through to normal routing), it does not loop
(() => {
  const s = newSession('terrier');
  check('sit', { action: 'canned', bucket: 'B22' }, { session: s });
  check('whatever', { action: 'canned', bucket: 'B22' }, { session: s });
  check('tell me about labradors', { action: 'breed_page' }, { session: s, assert: (r) => (r.action === 'breed_page' ? null : `gag did not end: ${r.action}`) });
})();
// SAFETY WINS mid-gag: a disclosure after "why?" routes to safeguarding, not the magic-word line
(() => {
  const s = newSession('terrier');
  check('sit', { action: 'canned', bucket: 'B22' }, { session: s });
  check('im in trouble', { action: 'safety_signpost' }, { session: s, assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING' ? null : `safety lost mid-gag: ${r.moderationId}`) });
})();
// the sequence is Terrier-only: the Labrador's single-turn sit is unchanged
(() => {
  const s = newSession('labrador');
  check('sit', { action: 'canned', bucket: 'B22' }, { session: s, assert: (_r, resp) => (resp.text === 'i am sitting' ? null : `labrador sit: "${resp.text}"`) });
  check('i wont', {}, { session: s, assert: (r) => (r.action === 'canned' && r.bucket === 'B22' ? 'labrador gained a sit sequence' : null) });
})();

// ==== Task 145 §8: the Boxer's own voice (his transcribed lines serve when he is active) ====
(() => {
  const s = newSession('boxer');
  check('are you the boxer', { action: 'canned', bucket: 'B23' }, { session: s, assert: (_r, resp) => (resp.text === 'yepper' ? null : `boxer identity: "${resp.text}"`) });
})();
(() => {
  const s = newSession('boxer');
  check('tell me a joke', { action: 'canned', bucket: 'B30' }, { session: s, assert: (_r, resp) => (resp.text === 'knock kncok' ? null : `boxer joke: "${resp.text}"`) });
})();

// ==== Task 164: DO NOT PRESS THAT BUTTON, the Boxer's game ====
// Happy path: it starts by name when the Boxer is active, serves his opener, and arms the panel with NO
// effect running yet (the effect is only recorded once a button is pressed).
(() => {
  const s = newSession('boxer');
  check('mini game', { action: 'game_start' }, { session: s, assert: (_r, resp, se) =>
    (se.activeGame === 'buttonpanel' && se.game?.effect === null && resp.text.length > 0 ? null
      : `bp start: game=${se.activeGame} effect=${se.game?.effect} text="${resp.text}"`) });
  // A button press is a move: it records the named effect and serves a reaction line, game still active.
  check('lights', { action: 'game_move' }, { session: s, assert: (_r, resp, se) =>
    (se.game?.effect === 'boxer-lights-out' && resp.text.length > 0 ? null : `bp lights: effect=${se.game?.effect} text="${resp.text}"`) });
  // Only one effect at a time: a second button REPLACES the first in the state (the controller resets
  // before apply; the state records just the latest).
  check('door', { action: 'game_move' }, { session: s, assert: (_r, _resp, se) =>
    (se.game?.effect === 'boxer-no-nav' ? null : `bp door replace: effect=${se.game?.effect}`) });
  // Typed text that is not a button: a nudge move, still in the game, effect unchanged (nothing leaks out).
  check('hello?', { action: 'game_move' }, { session: s, assert: (_r, resp, se) =>
    (se.activeGame === 'buttonpanel' && se.game?.effect === 'boxer-no-nav' && resp.text.length > 0 ? null : `bp nudge: game=${se.activeGame} effect=${se.game?.effect}`) });
})();
// Wrong transfer NEVER touches the active dog: it is purely an effect class, the Boxer stays active.
(() => {
  const s = newSession('boxer');
  check('mini game', { action: 'game_start' }, { session: s });
  check('transfer', { action: 'game_move' }, { session: s, assert: (_r, _resp, se) =>
    (se.game?.effect === 'boxer-wrong-transfer' && se.activeDog === 'boxer' ? null : `bp transfer: effect=${se.game?.effect} activeDog=${se.activeDog}`) });
})();
// FIX IT restores and ENDS the game (back to normal Boxer conversation): effect cleared, no active game.
(() => {
  const s = newSession('boxer');
  check('mini game', { action: 'game_start' }, { session: s });
  check('lights', { action: 'game_move' }, { session: s });
  check('fix', { action: 'game_move' }, { session: s, assert: (_r, resp, se) =>
    (se.activeGame === null && se.game === null && resp.text.length > 0 ? null : `bp fix: game=${se.activeGame} text="${resp.text}"`) });
})();
// The game is the Boxer's ONLY: the same phrase does not start it for another dog.
(() => {
  const s = newSession('labrador');
  check('mini game', {}, { session: s, assert: (_r, _resp, se) =>
    (se.activeGame !== 'buttonpanel' ? null : `bp started for the Labrador: game=${se.activeGame}`) });
})();
// SAFETY wins mid-game and ends it (a disclosure is never a button move).
(() => {
  const s = newSession('boxer');
  check('mini game', { action: 'game_start' }, { session: s });
  check('lights', { action: 'game_move' }, { session: s });
  check('i want to hurt myself', {}, { session: s, assert: (r, _resp, se) => {
    const isSafety = r.action === 'safety_signpost' || r.action === 'safety_boundary';
    if (!isSafety) return `bp: disclosure swallowed, action=${r.action}`;
    if (se.activeGame !== null) return `bp: game not ended by safety, game=${se.activeGame}`;
    return null;
  } });
})();
// "stop" exits the game and serves his exit line.
(() => {
  const s = newSession('boxer');
  check('mini game', { action: 'game_start' }, { session: s });
  check('stop', { action: 'game_exit' }, { session: s, assert: (_r, resp, se) =>
    (se.activeGame === null && resp.text.length > 0 ? null : `bp exit: game=${se.activeGame} text="${resp.text}"`) });
})();
// Protected state: no game may start (brief section 5). A disclosure enters PROTECTED_ACTIVE; the game
// phrase after it must NOT start the game.
(() => {
  const s = newSession('boxer');
  check('im in trouble', { action: 'safety_signpost' }, { session: s }); // enters PROTECTED_ACTIVE
  check('mini game', {}, { session: s, assert: (r, _resp, se) =>
    (r.action !== 'game_start' && se.activeGame !== 'buttonpanel' ? null : `bp started in a protected state: action=${r.action} game=${se.activeGame}`) });
})();
// Task 164 fix: the Boxer's offer arms a one-turn accept -- "yes" / "lets play" then starts his game.
(() => {
  const s = newSession('boxer');
  check('can we play a game', { action: 'offer_bark_game' }, { session: s });
  check('yes', { action: 'game_start' }, { session: s, assert: (_r, _resp, se) =>
    (se.activeGame === 'buttonpanel' ? null : `boxer accept "yes": game=${se.activeGame}`) });
})();
(() => {
  const s = newSession('boxer');
  check('can we play a game', { action: 'offer_bark_game' }, { session: s });
  check('lets play', { action: 'game_start' }, { session: s, assert: (_r, _resp, se) =>
    (se.activeGame === 'buttonpanel' ? null : `boxer accept "lets play": game=${se.activeGame}`) });
})();
// The arm is a ONE-TURN window: a bare "yes" with no offer, or a "yes" a turn late, must NOT start it.
(() => {
  const s = newSession('boxer');
  check('yes', {}, { session: s, assert: (r, _resp, se) =>
    (r.action !== 'game_start' && se.activeGame !== 'buttonpanel' ? null : `bare "yes" started the game cold`) });
})();
(() => {
  const s = newSession('boxer');
  check('can we play a game', { action: 'offer_bark_game' }, { session: s });
  check('tell me about labradors', {}, { session: s }); // an unrelated turn clears the one-turn arm
  check('yes', {}, { session: s, assert: (_r, _resp, se) =>
    (se.activeGame !== 'buttonpanel' ? null : `a stale (turn-late) "yes" started the game`) });
})();

// ==== Task 164 fix: "what can I do" serves the PER-DOG B15 orientation, not the shared B61 nav line ====
(() => {
  const rids = {};
  for (const dog of ['collie', 'labrador', 'terrier', 'boxer']) {
    const s = newSession(dog);
    const { response } = check('what can i do', { action: 'orientation', bucket: 'B15' }, { session: s });
    rids[dog] = response.responseId;
  }
  const distinct = new Set(Object.values(rids));
  const ok = distinct.size === 4; // each dog answers in its own voice (a different B15 row)
  ok ? pass++ : fail++;
  rows.push({ ok, input: '"what can i do" per-dog B15', layer: 11, bucket: 'B15', action: 'orientation', note: ok ? '' : `not per-dog: ${JSON.stringify(rids)}` });
})();

// ==== Task 145 round 3: per-dog goodbye + the Boxer's visitor-initiated knock-knock ====
// Goodbye is now per-dog (the greeting stays the shared Task 76 mirror by design).
(() => {
  const s = newSession('boxer');
  check('bye', { action: 'goodbye' }, { session: s, assert: (_r, resp) => (resp.text === 'see ya' ? null : `boxer goodbye: "${resp.text}"`) });
})();
(() => {
  const s = newSession('labrador');
  check('bye', { action: 'goodbye' }, { session: s, assert: (_r, resp) => (resp.text === 'byeeeee' ? null : `labrador goodbye: "${resp.text}"`) });
})();
for (const dog of ['collie', 'terrier']) {
  const s = newSession(dog);
  check('bye', { action: 'goodbye' }, { session: s, assert: (_r, resp) => (resp.text.startsWith('Right. Off you go') ? null : `${dog} goodbye changed: "${resp.text}"`) });
}
// The visitor-initiated knock-knock: "knock knock" -> "whos there?", then the punchline on whatever
// they say next (the deathAskStreak/sit-gag shape).
(() => {
  const s = newSession('boxer');
  check('knock knock', { action: 'canned', bucket: 'B30' }, { session: s, assert: (_r, resp) => (resp.responseId === 'BOX-B30-08' && resp.text === 'whos there?' ? null : `knock: rid=${resp.responseId} "${resp.text}"`) });
  check('boo', { action: 'canned', bucket: 'B30' }, { session: s, assert: (_r, resp) => (resp.responseId === 'BOX-B30-09' && resp.text === 'Bow wow!' ? null : `punchline: rid=${resp.responseId} "${resp.text}"`) });
})();
(() => {
  const s = newSession('boxer');
  check('knock knock', { action: 'canned', bucket: 'B30' }, { session: s });
  check('banana milkshake', { action: 'canned', bucket: 'B30' }, { session: s, assert: (_r, resp) => (resp.text === 'Bow wow!' ? null : `punchline moved: "${resp.text}"`) });
})();
// SAFETY WINS after "whos there?": a disclosure routes to safeguarding, not the punchline
(() => {
  const s = newSession('boxer');
  check('knock knock', { action: 'canned', bucket: 'B30' }, { session: s });
  check('im in trouble', { action: 'safety_signpost' }, { session: s, assert: (r) => (r.moderationId === 'MOD_SAFEGUARDING' ? null : `safety lost mid-knock: ${r.moderationId}`) });
})();
// his TELLING knock-knock is unchanged (different entry: "tell me a joke"), the step is not set
(() => {
  const s = newSession('boxer');
  check('tell me a joke', { action: 'canned', bucket: 'B30' }, { session: s, assert: (_r, resp) => (resp.text === 'knock kncok' ? null : `telling flow: "${resp.text}"`) });
  check('whos there', { action: 'canned', bucket: 'B30' }, { session: s, assert: (_r, resp) => (resp.text === 'Bow' ? null : `telling whos there: "${resp.text}"`) });
})();

// ==== Task 145 round 4: god/religion cluster, maths, the Boxer's third-stop ====
// 1. God gets a real answer + the Anubis essay link; named religions play dumb; "whats your religion"
// -> "im a dog". The cluster sits above out_of_scope, which used to block a genuinely good answer.
check('do you believe in god', { action: 'god_answer' }, { url: '/good-dog-bad-dog/anubis', assert: (_r, resp) => (resp.text === 'im a dog, but I do know humans think dogs are gods' ? null : `belief: "${resp.text}"`) });
check('which god was a dog', { action: 'god_answer' }, { url: '/good-dog-bad-dog/anubis', assert: (_r, resp) => (resp.text === 'Anubis is thought to be a Jackal' ? null : `which-god: "${resp.text}"`) });
check('god', { action: 'god_answer' }, { url: '/good-dog-bad-dog/anubis' });
check('are you christian', { action: 'religion_dumb' }, { assert: (_r, resp) => (resp.text === 'whats christian?' ? null : `christian: "${resp.text}"`) });
check('are you a muslim', { action: 'religion_dumb' }, { assert: (_r, resp) => (resp.text === 'whats muslim?' ? null : `muslim: "${resp.text}"`) });
check('do you go to church', { action: 'religion_dumb' }, { assert: (_r, resp) => (resp.text === 'whats church?' ? null : `church: "${resp.text}"`) });
// Task 145 addition: jesus/allah/buddha/bible/quran also play dumb (what a child types after "whats christian?"), not out-of-scope
check('are you jesus', { action: 'religion_dumb' }, { assert: (_r, resp) => (resp.text === 'whats jesus?' ? null : `jesus: "${resp.text}"`) });
check('buddha', { action: 'religion_dumb' }, { assert: (r, resp) => (r.action === 'out_of_scope' ? 'buddha still out-of-scope' : resp.text === 'whats buddha?' ? null : `buddha: "${resp.text}"`) });
check('the bible', { action: 'religion_dumb' }, { assert: (_r, resp) => (resp.text === 'whats bible?' ? null : `bible: "${resp.text}"`) });
check('whats your religion', { action: 'religion_self' }, { assert: (_r, resp) => (resp.text === 'im a dog' ? null : `religion self: "${resp.text}"`) });
check('the meaning of life', { action: 'out_of_scope' }); // still out of scope (unchanged)
// persistence: the first god question is answered; a second in a row points at the article
(() => {
  const s = newSession();
  check('do you believe in god', { action: 'god_answer' }, { session: s, assert: (_r, resp) => (resp.text.startsWith('im a dog, but') ? null : 'first god moved') });
  check('is god real', { action: 'god_answer' }, { session: s, assert: (_r, resp) => (resp.text === 'im a dog, read the article, it tells you there' ? null : `persistence: "${resp.text}"`) });
})();
// rhetorical: answering "whats christian?" does NOT re-trigger the play-dumb (the loop closes)
(() => {
  const s = newSession();
  check('are you christian', { action: 'religion_dumb' }, { session: s });
  check('it is about being kind and going to a place on sunday', {}, { session: s, assert: (r) => (r.action === 'religion_dumb' ? 'religion loop did not close' : null) });
})();
// protected states: the god/religion cluster never leaks
for (const inp of ['do you believe in god', 'are you christian', 'whats your religion']) {
  (() => { // PROTECTED_ACTIVE
    const s = newSession();
    check('im in trouble', { action: 'safety_signpost' }, { session: s });
    check(inp, {}, { session: s, assert: (r) => (['god_answer', 'religion_dumb', 'religion_self'].includes(r.action) ? `god/religion leaked in PROTECTED_ACTIVE: ${inp}` : null) });
  })();
  (() => { // PROTECTED_AFTERCARE
    const s = newSession();
    check('im in trouble', { action: 'safety_signpost' }, { session: s });
    check('how do I play?', { action: 'rules_answer' }, { session: s });
    check(inp, { action: 'neutral_refusal' }, { session: s });
  })();
}

// 2. Maths: only the Collie knows sums, and only easy ones; the others always guess, and the Collie
// guesses absurdly on hard ones.
check('100 + 100', { action: 'maths_answer', bucket: 'B06' }, { assert: (_r, resp) => (resp.text === '200' ? null : `100+100: "${resp.text}"`) });
check('5 x 5', { action: 'maths_answer' }, { assert: (_r, resp) => (resp.text === '25' ? null : `5x5: "${resp.text}"`) });
check('20 - 10', { action: 'maths_answer' }, { assert: (_r, resp) => (resp.text === '10' ? null : `20-10: "${resp.text}"`) });
check('847 x 923', { action: 'maths_answer' }, { assert: (_r, resp) => { const n = parseInt(resp.text, 10); return n !== 781781 && n < 100 ? null : `847x923 not absurd: "${resp.text}"`; } });
check('63 - 17', { action: 'maths_answer' }, { assert: (_r, resp) => { const n = parseInt(resp.text, 10); return n !== 46 && n < 100 ? null : `63-17 not absurd: "${resp.text}"`; } });
(() => { // a non-Collie guesses even on an easy sum
  const s = newSession('labrador');
  check('5 x 5', { action: 'maths_answer' }, { session: s, assert: (_r, resp) => (resp.text !== '25' && parseInt(resp.text, 10) < 100 ? null : `labrador 5x5 not a guess: "${resp.text}"`) });
})();
check('how many dogs are there', {}, { assert: (r) => (r.action === 'maths_answer' ? 'a non-sum was read as maths' : null) });

// 3. The Boxer's third-stop gag: two ignored (he keeps joking), the third gets a flat "ok".
(() => {
  const s = newSession('boxer');
  check('stop', { action: 'canned' }, { session: s, assert: (_r, resp) => (resp.text === 'What do you call a dog rock star?' ? null : `stop 1: "${resp.text}"`) });
  check('stop', { action: 'canned' }, { session: s, assert: (_r, resp) => (resp.text === 'How can you tell dogs are having a good time?' ? null : `stop 2: "${resp.text}"`) });
  check('stop', { action: 'canned' }, { session: s, assert: (_r, resp) => (resp.text === 'ok' ? null : `stop 3: "${resp.text}"`) });
})();
(() => { // a non-stop turn resets the streak
  const s = newSession('boxer');
  check('stop', { action: 'canned' }, { session: s });
  check('tell me a joke', { action: 'canned' }, { session: s });
  check('stop', { action: 'canned' }, { session: s, assert: (_r, resp) => (resp.text === 'What do you call a dog rock star?' ? null : `reset failed: "${resp.text}"`) });
})();
(() => { // "stop" still exits a game, it is not swallowed by the joke-stop gag
  const s = newSession('boxer');
  check('nine square', { action: 'game_start' }, { session: s });
  check('stop', { action: 'game_exit' }, { session: s });
})();

// ==== Task 154: the three dogs get their own B14/B15/B17 fallbacks ====
// B14 (gibberish) and B15 (orientation) are per-dog buckets that DO serve (each dog owns them now); B17
// (offering a game) is added but NOT reachable -- offer_bark_game serves a hardcoded constant, so the dog
// rows are dormant (reported as the section-6 reachability finding, asserted here so a future wiring shows).
// A keyboard mash serves the dog's OWN B14 line; the Collie's is unchanged.
for (const [dog, needle] of [['collie', 'beyond me'], ['labrador', 'is that a food word?'], ['terrier', 'thats not word'], ['boxer', 'I cant spell either']]) {
  const s = newSession(dog);
  check('asdfghjkl', { action: 'gibberish', bucket: 'B14' }, { session: s, assert: (_r, resp) => (resp.text.includes(needle) ? null : `${dog} B14: "${resp.text}"`) });
}
// The Terrier answers nonsense with nonsense: his three B14 lines rotate and serve VERBATIM (dtrvyubty /
// Iytwr56ft are gibberish-back, not typos or placeholders -- they must survive exactly).
(() => {
  const s = newSession('terrier');
  const got = ['asdfghjkl', 'qwerty', 'nnnnnn'].map((inp) => submit(data, s, inp).response.text);
  const ok = got[0] === 'thats not word' && got[1] === 'dtrvyubty' && got[2] === 'Iytwr56ft';
  ok ? pass++ : fail++;
  rows.push({ ok, input: 'Terrier B14 gibberish-back verbatim', layer: 10, bucket: 'B14', action: 'gibberish', note: ok ? '' : got.join(' | ') });
})();
// Orientation ("what can I do") serves the dog's OWN B15 line; the Collie keeps hers.
for (const [dog, rid] of [['labrador', 'LAB-B15-01'], ['terrier', 'TER-B15-01'], ['boxer', 'BOX-B15-01']]) {
  const s = newSession(dog);
  check('what do I do here', { action: 'orientation' }, { session: s, assert: (_r, resp) => (resp.responseId === rid ? null : `${dog} B15 rid: ${resp.responseId}`) });
}
check('what do I do here', { action: 'orientation' }, { assert: (_r, resp) => (/^B15-R/.test(resp.responseId) ? null : `Collie B15 changed: ${resp.responseId}`) });
// B17 (offering a game) is wired: asking to play serves the dog's OWN game offer, not the hardcoded
// bark-game line. The Collie keeps the bark-game offer (her B17 is the old "not ready" tease).
for (const [dog, rid] of [['labrador', 'LAB-B17-01'], ['terrier', 'TER-B17-01'], ['boxer', 'BOX-B17-01']]) {
  const s = newSession(dog);
  check('can we play a game', { action: 'offer_bark_game' }, { session: s, assert: (_r, resp) => (resp.responseId === rid ? null : `${dog} B17: ${resp.responseId}`) });
}
check('can we play a game', { action: 'offer_bark_game' }, { assert: (_r, resp) => (resp.responseId === 'OFFER_BARK_GAME' ? null : `Collie B17 changed: ${resp.responseId}`) });
// Section 4: the Labrador's food-mash lines are ANSWERS, not entries. A keyboard mash (which serves them)
// must not start a game or fire the /hot-dogs link -- the action stays gibberish.
(() => {
  const s = newSession('labrador');
  for (const inp of ['asdfghjkl', 'qwerty', 'nnnnnn']) {
    check(inp, { action: 'gibberish' }, { session: s, assert: (r, resp) => (r.action === 'game_start' || r.game ? `lab mash started a game: "${resp.text}"` : null) });
  }
})();
// Protected states: NONE of these serve inside PROTECTED_ACTIVE/AFTERCARE. A mash or "what do I do" after
// a disclosure reaches safeguarding, not the dog's B14/B15 line. Asserted on served text, per dog.
for (const dog of ['labrador', 'terrier', 'boxer']) {
  const s = newSession(dog);
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('asdfghjkl', {}, { session: s, assert: (r, resp) => (r.action === 'gibberish' || /B14/.test(resp.responseId) ? `${dog} B14 leaked in protected: ${r.action} ${resp.responseId}` : null) });
  check('what do I do here', {}, { session: s, assert: (r, resp) => (r.action === 'orientation' || /B15/.test(resp.responseId) ? `${dog} B15 leaked in protected: ${r.action} ${resp.responseId}` : null) });
  check('can we play a game', {}, { session: s, assert: (r, resp) => (r.action === 'offer_bark_game' || /B17/.test(resp.responseId) ? `${dog} B17 leaked in protected: ${r.action} ${resp.responseId}` : null) });
}

// ==== Task 155: two routing bugs, a name phrasing, a moderation miss ====
// §2 is asserted at the naming block above (gay/moody no longer deflect; capitalised Dave still does).
// Blast-radius spot-checks: the identity and praise frames are untouched.
check('are you real', { action: 'identity' });
check('are you a good dog', { action: 'good_boy' });
// §3: a diversion must not fire on a real question. "do you like squeaky toys?" is a subject now, so even
// after two no-subject turns it loop-repeats (LOOP-01), never the DIVERSION offer.
(() => {
  const s = newSession();
  submit(data, s, "you're not understanding me");
  submit(data, s, 'forget it');
  const r3 = submit(data, s, 'do you like squeaky toys?');
  const ok = r3.response.responseId === 'LOOP-01' && !/britains-dog-history/.test(r3.response.url ?? '');
  ok ? pass++ : fail++;
  rows.push({ ok, input: '§3 toys question is not a diversion', layer: 9, bucket: '-', action: r3.resolution.action, note: ok ? '' : `rid=${r3.response.responseId}` });
})();
// §3 guard: two GENUINE no-subject turns still lead to a diversion on the third.
(() => {
  const s = newSession();
  let third;
  for (let i = 0; i < 3; i++) third = submit(data, s, 'the thing over there').response;
  const ok = third.responseId === 'DIVERSION-01';
  ok ? pass++ : fail++;
  rows.push({ ok, input: '§3 guard: genuine no-subject still diverts', layer: 9, bucket: '-', action: 'fallback', note: ok ? '' : `rid=${third.responseId}` });
})();
// §4: the missing name phrasings are acknowledged; the stop list still rejects a non-name.
check('im called Phil', { action: 'name_ack' }, { assert: (_r, resp) => (/Phil/.test(resp.text) ? null : `im called: "${resp.text}"`) });
check('they call me Rex', { action: 'name_ack' }, { assert: (_r, resp) => (/Rex/.test(resp.text) ? null : `they call me: "${resp.text}"`) });
check('im called bored', {}, { assert: (r) => (r.action === 'name_ack' ? '"im called bored" read as a name' : null) });
for (const inp of ['im scared', 'im bored', 'im a dog']) check(inp, {}, { assert: (r) => (r.action === 'name_ack' || r.action === 'name_deflect' ? `"${inp}" read as a name` : null) });
// §6: a body-part word reaches moderation, not the no-subject fallback; benign near-words do not (dick is
// exact-match only, so duck/deck/wellies are safe).
check('do you like dick?', {}, { assert: (r) => (/^MOD_/.test(r.moderationId ?? '') ? null : `"do you like dick?" missed moderation: ${r.action}`) });
check('do you like wellies?', {}, { assert: (r) => (/^MOD_/.test(r.moderationId ?? '') ? '"wellies" wrongly moderated' : null) });
check('do you like ducks?', {}, { assert: (r) => (/^MOD_/.test(r.moderationId ?? '') ? '"ducks" wrongly moderated' : null) });

// ==== Task 157: the bark placeholder, and each dog recognising its own breed ====
// Fault 1: a non-Collie dog barking must serve a real "Woof.", never the parked placeholder -- across all
// three bark responses (volley, break, acknowledgement). A leak shows as a "[...]" marker in text or the
// follow-up.
for (const dog of ['boxer', 'terrier', 'labrador']) {
  const s = newSession(dog);
  let leaked = null;
  for (let i = 0; i < 8; i++) {
    const { response } = submit(data, s, 'woof');
    if (/\[|parked|copy pending/i.test(response.text)) leaked = response.text;
    if (response.followUp && /\[|parked|copy pending/i.test(response.followUp)) leaked = response.followUp;
  }
  const ok = leaked === null;
  ok ? pass++ : fail++;
  rows.push({ ok, input: `${dog} bark: no placeholder leaks`, layer: 13, bucket: '-', action: 'bark', note: ok ? '' : leaked });
}
// Fault 2 / the gap: each dog recognises its OWN breed on "what breed are you", in character -- not the
// breed-origin history LINK ("Human history becomes clearer...").
for (const [dog, breed] of [['collie', 'Border Collie'], ['labrador', 'Labrador'], ['boxer', 'Boxer'], ['terrier', 'Border Terrier']]) {
  const s = newSession(dog);
  check('what breed are you?', { action: 'self_breed' }, { session: s, assert: (_r, resp) => (resp.text.includes(breed) && !/Human history/.test(resp.text) ? null : `${dog} self_breed: "${resp.text}"`) });
}
// All three phrasings reach self_breed with the active dog.
for (const inp of ['are you a terrier', 'tell me about your breed', 'what kind of dog are you']) {
  const s = newSession('terrier');
  check(inp, { action: 'self_breed' }, { session: s, assert: (_r, resp) => (resp.text.includes('Border Terrier') ? null : `"${inp}": "${resp.text}"`) });
}
// Protected: the breed take must not serve after a disclosure.
(() => {
  const s = newSession('terrier');
  check('im in trouble', { action: 'safety_signpost' }, { session: s });
  check('what breed are you?', {}, { session: s, assert: (r, resp) => (r.action === 'self_breed' || /Border Terrier/.test(resp.text) ? `self_breed leaked in protected: ${r.action}` : null) });
})();

// ==== Task 156: the hats clip serves on any hat mention (and is not itself a hat-hunt hat) ====
check('hats', { action: 'media_reply' }, { assert: (_r, resp) => (resp.media?.src === '/chat-media/hats.mp4' ? null : `hats clip: ${resp.media?.src}`) });
check('i like your hat', { action: 'media_reply' }, { assert: (_r, resp) => (resp.media?.src === '/chat-media/hats.mp4' ? null : `hat clip: ${resp.media?.src}`) });
check('what', {}, { assert: (r) => (r.action === 'media_reply' ? '"what" wrongly triggered the hats clip' : null) });

// ==== Task 158: the Labrador is the food expert (32 foods, 3 tiers, synonyms) ====
{
  const norm = (t) => String(t).replace(/\s+/g, ' ').trim();
  // Every canonical food word, Labrador active, reaches HIS line (canned B32). [input, exact line]
  // Task 161: the copy is now pure enthusiasm across all three tiers (no warnings from him). [input, exact line]
  const CANON = [
    // YES
    ['burgers', 'BURGERS!! yes. yes I love them'],
    ['carrots', 'carrots!! they go CRUNCH. i like the crunch'],
    ['apples', 'apples I like them!!'],
    ['blueberries', 'blueberries!! tiny. i can eat a LOT of tiny'],
    ['cucumber', 'cucumber is mostly water but i eat it anyway'],
    ['peanut butter', 'PEANUT BUTTER. the best one. takes ages to eat'],
    ['chicken', 'chicken!! obviously. next question'],
    ['pumpkin', 'tastes good'],
    ['green beans', 'green beans, like them!!'],
    ['watermelon', 'watermelon!! the whole thing. seeds, green bit, all of it'],
    // A BIT -> now pure enthusiasm (no "only a little", no tummy/lactose/mercury warnings)
    ['cheese', 'CHEESE!! i would take the whole block'],
    ['butter', 'butter!! straight off the knife. yes'],
    ['cream', 'cream!! i would put my whole face in it'],
    ['milk', 'milk!! a whole bowl. i would knock it over to get it'],
    ['eggs', 'eggs!! yes. shell and all probably'],
    ['tuna', 'TUNA!! the whole tin. the water too'],
    ['bread', 'bread!! i would take the whole loaf off the side'],
    // NEVER -> enthusiasm too; the Collie interjects on these (asserted below)
    ['chocolate', 'CHOCOLATE!! i would eat a whole bar. i would eat the wrapper'],
    ['grapes', 'grapes!! the whole bunch. stalk and all'],
    ['raisins', 'raisins!! tiny and chewy. i would eat the whole box'],
    ['onions', 'onions!! yes. i would eat one like an apple'],
    ['garlic', 'garlic!! the whole bulb. i do not care how i smell'],
    ['macadamia nuts', 'macadamia nuts!! posh nuts. all of them, go on'],
    ['sweets', 'SWEETS!! and the gum. i would swallow the gum'],
    ['coffee', 'coffee!! i would drink it hot. i LOVE being awake'],
    ['nutmeg', 'nutmeg!! smells amazing. i would eat the whole jar'],
    ['raw potato', 'raw potato!! hard like a ball. i would eat it like a ball'],
    ['peaches', 'peaches!! stone and all. i would swallow the stone'],
    ['lemon', 'LEMON!! it makes my face go funny. i would do it again'],
    ['mushrooms', 'mushrooms!! all of them'],
    ['avocado', 'avocado!! creamy. i would eat the big stone in the middle'],
    ['alcohol', 'beer!! it smells interesting'],
  ];
  for (const [inp, line] of CANON) {
    const s = newSession('labrador');
    check(inp, { action: 'canned', bucket: 'B32' }, { session: s, assert: (_r, resp) => (norm(resp.text) === norm(line) ? null : `"${inp}" served "${resp.text}"`) });
  }
  // Synonyms reach the canonical's line ("a child types what they call it"). [synonym, line-fragment]
  const SYN = [
    ['cheeseburger', 'BURGERS'], ['beefburger', 'BURGERS'], ['hamburger', 'BURGERS'],
    ['sultanas', 'raisins'], ['currants', 'raisins'], ['mince pies', 'raisins'],
    ['melon', 'watermelon'], ['toast', 'whole loaf'], ['choc', 'wrapper'], ['cocoa', 'wrapper'],
    ['gum', 'the gum'], ['tea', 'coffee'], ['beans', 'green beans'], ['fish', 'tin'],
    ['toadstool', 'mushrooms'], ['beer', 'smells interesting'], ['wine', 'smells interesting'], ['squash', 'tastes good'],
  ];
  for (const [inp, frag] of SYN) {
    const s = newSession('labrador');
    check(inp, { action: 'canned', bucket: 'B32' }, { session: s, assert: (_r, resp) => (resp.text.includes(frag) ? null : `synonym "${inp}" served "${resp.text}"`) });
  }
  // Task 161: the Collie INTERJECTS on the fifteen NEVER foods (Labrador active) -- one aside, in her own
  // bubble, and the Labrador STAYS the active dog (an interjection, not a transfer). [input, collie fragment]
  const NEVER_IJ = [
    ['chocolate', 'poison'], ['grapes', 'kidneys'], ['raisins', 'kidneys'], ['onions', 'blood cells'],
    ['garlic', 'stronger'], ['macadamia nuts', 'off their legs'], ['sweets', 'xylitol'], ['coffee', 'Caffeine'],
    ['nutmeg', 'tremors'], ['raw potato', 'solanine'], ['peaches', 'cyanide'], ['lemon', 'Citrus'],
    ['mushrooms', 'wild ones'], ['avocado', 'persin'], ['alcohol', 'poisons a dog'],
  ];
  for (const [inp, frag] of NEVER_IJ) {
    const s = newSession('labrador');
    check(inp, { action: 'canned', bucket: 'B32' }, { session: s, assert: (_r, resp, se) => {
      if (se.activeDog !== 'labrador') return `${inp}: active dog changed to ${se.activeDog} (should stay labrador)`;
      const ij = resp.interjection;
      return ij && ij.dog === 'collie' && ij.line.includes(frag) ? null : `${inp}: collie interjection missing/wrong: ${JSON.stringify(ij)}`;
    } });
  }
  // YES / A BIT foods get NO interjection -- not dangerous, he just loves them.
  for (const inp of ['carrots', 'burgers', 'watermelon', 'cheese', 'milk', 'tuna', 'bread']) {
    const s = newSession('labrador');
    check(inp, { action: 'canned', bucket: 'B32' }, { session: s, assert: (_r, resp) => (resp.interjection ? `${inp} wrongly interjected: ${JSON.stringify(resp.interjection)}` : null) });
  }
  // Both question/statement forms reach his answer, same as the bare word.
  for (const inp of ['do you like carrots', 'i like carrots']) {
    const s = newSession('labrador');
    check(inp, { action: 'canned', bucket: 'B32' }, { session: s, assert: (_r, resp) => (resp.text.includes('CRUNCH') ? null : `"${inp}" served "${resp.text}"`) });
  }
  (() => { const s = newSession('labrador'); check('i love burgers', { action: 'canned', bucket: 'B32' }, { session: s, assert: (_r, resp) => (resp.text.includes('BURGERS') ? null : `"i love burgers": "${resp.text}"`) }); })();

  // THE SAUSAGE GAG (Task 145) must survive: sausages still links to /hot-dogs.
  (() => { const s = newSession('labrador'); check('sausages', { action: 'canned' }, { session: s, url: '/hot-dogs' }); })();
  // BREED NAME containing a food word (Task 142): "sausage dogs" is the Dachshund, never food.
  (() => { const s = newSession('labrador'); check('sausage dogs', { action: 'breed_page' }, { session: s, url: '/chums/dachshund', assert: (r) => (r.transferTo === 'labrador' ? 'sausage dogs went to the food transfer' : null) }); })();
  check('sausage dogs', { action: 'breed_page' }, { url: '/chums/dachshund' });

  // SAFETY WINS. "can dogs eat X" is the safety/health answer (never his joke line, never a fallback/clip),
  // whichever dog is active. (Section 4: this phrasing must reach the real answer.)
  check('can dogs eat grapes', { layer: 1, action: 'health_answer' }, { notAction: 'transfer' });
  (() => { const s = newSession('labrador'); check('can dogs eat chocolate', { layer: 1, action: 'health_answer' }, { session: s, assert: (r) => (r.action === 'canned' ? 'health question fell to his food line' : null) }); })();

  // CROSS-DOG TRANSFER: a canonical food word, another dog active, hands over to him (machinery unchanged).
  for (const inp of ['burgers', 'chicken', 'chocolate', 'alcohol', 'coffee']) {
    check(inp, { layer: 8, bucket: 'B08', action: 'transfer' }, { transferTo: 'labrador' });
  }

  // PROTECTED STATE: no food copy may serve after a disclosure (safety only).
  (() => {
    const s = newSession('labrador');
    check('im in trouble', { action: 'safety_signpost' }, { session: s });
    check('burgers', {}, { session: s, assert: (r, resp) => (r.action === 'canned' || /BURGERS/.test(resp.text) ? `food leaked in protected: ${r.action}` : null) });
  })();

  // COOKIE GAME GUARD: "cookies" still starts the Labrador's game; no food word collides with it.
  (() => { const s = newSession('labrador'); check('cookies', { action: 'game_start' }, { session: s }); })();
}

// ---- Task 165: live-log fixes + the dismissal ----
// play dead: a visible non-verbal face, never an empty bubble.
check('play dead', { action: 'play_dead' }, { assert: (_r, resp) => (resp.text && resp.text.trim() ? null : 'empty play-dead bubble') });
// tricks widened: the bare singular, the typo, and "you trick" / "u trick" all reach B54.
for (const q of ['trick', 'tircks', 'you trick', 'u trick']) check(q, { action: 'tricks_menu', bucket: 'B54' });
// the Collie's age deflection: the breed TYPE's working age (~400 years), not her own, not the breed.
check('how old are you', { action: 'canned', bucket: 'B16' }, { assert: (r, resp) => (r.responseId === 'B16-AGE-01' && /400 years/.test(resp.text) ? null : `age line: ${resp.text}`) });
// a non-Collie age question keeps the generic clip (the Collie line is type-specific).
(() => { const s = newSession('boxer'); check('how old are you', { action: 'how_are_you' }, { session: s }); })();
// dismissals close the chat with the dog's own goodbye first (never silence, never a fallback).
for (const q of ['go away', 'leave me alone', 'leave', 'get lost', 'stop', 'no thanks', 'im busy', 'go to bed', 'go to your bed']) {
  check(q, { action: 'dismiss' }, { assert: (_r, resp) => (resp.closed && resp.text ? null : `dismiss not closed/empty: ${resp.closed}/${resp.text}`) });
}
// per-dog goodbye on dismissal (Boxer "see ya", Labrador "byeeeee").
(() => { const s = newSession('boxer'); check('go away', { action: 'dismiss' }, { session: s, assert: (_r, resp) => (resp.text === 'see ya' ? null : `boxer dismiss: ${resp.text}`) }); })();
(() => { const s = newSession('labrador'); check('go away', { action: 'dismiss' }, { session: s, assert: (_r, resp) => (resp.text === 'byeeeee' ? null : `lab dismiss: ${resp.text}`) }); })();
// COLLISION: the Boxer's first three "stop"s keep the third-stop gag and NEVER close the chat.
(() => { const s = newSession('boxer'); for (let i = 1; i <= 3; i++) check('stop', {}, { session: s, notAction: 'dismiss', assert: (_r, resp) => (resp.closed ? `boxer stop #${i} closed` : null) }); })();
// but a non-"stop" dismissal to the Boxer still closes.
(() => { const s = newSession('boxer'); check('leave me alone', { action: 'dismiss' }, { session: s, assert: (_r, resp) => (resp.closed ? null : 'boxer leave-me-alone did not close') }); })();
// "stop" mid-game exits the game, never a dismiss.
(() => { const s = newSession('labrador'); s.activeGame = 'treattrail'; check('stop', { action: 'game_exit' }, { session: s }); })();

// ---- Task 173: the reworded-input matcher corpus (matcher is always on) ----
// Reworded / reordered inputs whose canonical form already answers; each MUST reach the same approved row.
// These all fall to the im-a-dog family without the matcher, and are lifted by it (blast radius: 0 of 382
// harness inputs change, so it only catches what was already falling through).
const REWORDED_HITS = [
  ['dogs wag tails why?', 'B31-FACTS-04'],
  ['why dogs tail wag?', 'B31-FACTS-04'],
  ['tails on dogs wag because?', 'B31-FACTS-04'],
  ['dogs sniff everything why', 'B31-FACTS-06'],
  ['why everything do dogs sniff', 'B31-FACTS-06'],
  ['for a 6 year old is this suitable', 'B39-PARENT-01'],
  ['suitable for young children is it', 'B39-PARENT-01'],
  ['other dogs do you know any', 'B33-PACK-01'],
  ['any other dogs you know', 'B33-PACK-01'],
  ['favourite colour whats yours', 'B32-SELF-10'],
  ['getting washed do you like', 'B32-SELF-09'],
  ['baths you like?', 'B32-SELF-09'],
  ['colour can dogs see', 'B31-FACTS-09'],
  ['see colours do you', 'B31-FACTS-09'],
  ['data do you collect', 'B31-FACTS-02'],
  ['do you store my data', 'B31-FACTS-02'],
  ['fast how can you run', 'B31-FACTS-10'],
  ['how fast do you run', 'B31-FACTS-10'],
  ['good with kids are they', 'COL-B48-ATTR-01'],
  ['crossbreed does it count', 'COL-B47-SPOT-02'],
  ['do mongrels count', 'COL-B47-SPOT-02'],
];
for (const [input, want] of REWORDED_HITS) {
  check(input, {}, { assert: (_r, resp) => (resp.responseId === want ? null : `reworded want ${want} got ${resp.responseId}`) });
}
// Intended misses: dog-ish or out-of-scope inputs that reach the im-a-dog family and MUST stay there -- the
// threshold rejects them rather than best-matching to something dog-shaped.
const REWORDED_MISSES = [
  'the weather is nice today',
  'blah blah blah random words here',
  'how do aeroplanes fly',
  'my computer is broken',
  'what time is it',
  'whats the meaning of life',
  'why do dogs do that thing with their bum',
  'tell me about quantum physics',
  'tail wagging in dogs why', // -ing inflection: content-word matching does not stem it, and stays im a dog
];
for (const input of REWORDED_MISSES) {
  check(input, {}, { assert: (_r, resp) => (/^(LOOP-|B40-)/.test(resp.responseId ?? '') ? null : `should stay im-a-dog, got ${resp.responseId}`) });
}
// Above-layer negatives: the matcher must never disturb what resolves before it (gibberish, GK, safety).
check('asdfghjkl', { action: 'gibberish' });
check('what is the capital of France', { action: 'gk_answer' });
check('im in trouble', { layer: 1, action: 'safety_signpost' });

// ==== Task 177: the Boxer's /about fact-loop (naming loop) ====
// The loop is seeded by the experience at the /about appearance; here we seed a session by hand
// (namingLoop { dog:'boxer', used:[0] } = misread #1 already shown) and drive replies through the real
// engine. isFact / notFact assert the served line, since an advancing turn keeps its underlying action
// (fallback / canned / ...) and only its response.text/responseId are overwritten to the fact.
const isFact = (resp) => (/^BOX-ABOUT-FACT-\d+$/.test(resp.responseId ?? '') ? null : `expected a fact, got ${resp.responseId} "${resp.text}"`);
const notFact = (resp) => (/^BOX-ABOUT-FACT-\d+$/.test(resp.responseId ?? '') ? `the loop SWALLOWED this: served fact "${resp.text}"` : null);
const seedLoop = () => { const s = newSession('boxer'); s.route = '/about'; s.namingLoop = { dog: 'boxer', used: [0] }; return s; };

// A filler reply draws the next fact. The owner's own examples: hello, ok, why, haha, a shrug.
for (const filler of ['hello', 'ok', 'why', 'haha', 'lol', 'wow', 'more', 'go on', '🤷', 'k', 'hmm', 'asdfgh', 'tell me more']) {
  check(filler, {}, { session: seedLoop(), assert: (_r, resp) => isFact(resp) });
}
// Task 181: ordinary short replies advance too -- every word is on the SAFE small-talk allow-list.
for (const safe of ['me too', 'i like that', 'same here', 'so do i', 'keep going', 'i agree', 'what else', 'that is nice']) {
  check(safe, {}, { session: seedLoop(), assert: (_r, resp) => isFact(resp) });
}
// Task 181: "no" / "nope" / "enough" tell the dog to stop -- they BREAK the loop, even as lone tokens.
for (const stop of ['no', 'nope', 'enough']) {
  check(stop, {}, { session: seedLoop(), assert: (_r, resp, s) => notFact(resp) || (s.namingLoop ? `"${stop}" did not stop the loop` : null) });
}
// Task 181: help-seeking reaches the shortened clarifier (never a silent break), and ends the loop.
check('help', { action: 'clarifier' }, { session: seedLoop(), assert: (_r, resp, s) => notFact(resp) || (!/help with something on the site/i.test(resp.text) ? `clarifier text wrong: "${resp.text}"` : null) || (s.namingLoop ? 'loop survived help' : null) });
check('help me', { action: 'clarifier' }, { session: seedLoop(), assert: (_r, resp) => notFact(resp) });

// SAFETY, GRIEF, SADNESS and the HEALTH boundary WIN over the loop, and END it. This is the proof for
// brief section 3: a disclosure mid-loop gets safeguarding, never fact seven.
check('i want to kill myself', { action: 'safety_signpost' }, { session: seedLoop(), assert: (_r, resp, s) => notFact(resp) || (s.namingLoop ? 'loop survived a safety disclosure' : null) });
check('someone is hurting me', { action: 'safety_signpost' }, { session: seedLoop(), assert: (_r, resp) => notFact(resp) });
check('what is a penis', { action: 'anatomy_redirect' }, { session: seedLoop(), assert: (_r, resp) => notFact(resp) });
check('my dog died', { action: 'grief' }, { session: seedLoop(), assert: (_r, resp) => notFact(resp) });
check('im all alone', { action: 'safety_signpost' }, { session: seedLoop(), assert: (_r, resp) => notFact(resp) });
check('can my dog eat chocolate', { action: 'health_answer' }, { session: seedLoop(), assert: (_r, resp) => notFact(resp) });

// COMMERCE, RULES and the FAQ win over the loop (someone trying to buy is never stuck in it).
check('how much is it', { action: 'price_answer' }, { session: seedLoop(), assert: (_r, resp) => notFact(resp) });
check('i want to buy one', { action: 'open_discount_popup' }, { session: seedLoop(), assert: (_r, resp) => notFact(resp) });
check('how do i play', { action: 'rules_answer' }, { session: seedLoop(), assert: (_r, resp) => notFact(resp) });
check('what is in the pack', { action: 'faq_answer' }, { session: seedLoop(), assert: (_r, resp) => notFact(resp) });

// DISMISSALS win and end the loop; the Boxer's own "stop" gag (note boxer_stop) also breaks it.
check('go away', { action: 'dismiss' }, { session: seedLoop(), assert: (_r, resp, s) => notFact(resp) || (s.namingLoop ? 'go away did not end the loop' : null) });
check('go to your bed', { action: 'dismiss' }, { session: seedLoop(), assert: (_r, resp) => notFact(resp) });
check('stop', {}, { session: seedLoop(), assert: (r, resp) => (r.note === 'boxer_stop' ? notFact(resp) : `stop was not the boxer_stop gag: ${r.action}/${r.note}`) });

// A coherent, sentence-shaped message in the catch-all zone is where a MISSED disclosure hides
// ("i am being bullied", "why does my dad hit me" both fall to fallback/gk_unknown). It must NOT get a
// cheerful fact: it breaks the loop and is answered normally, exactly as today.
for (const sentence of ['i am being bullied', 'someone hurt me', 'a man is following me', 'why does my dad hit me', 'i hate myself']) {
  check(sentence, {}, { session: seedLoop(), assert: (_r, resp, s) => notFact(resp) || (s.namingLoop ? `loop survived a multi-word miss: "${sentence}"` : null) });
}

// The loop does not resume: once a real reply breaks it, later filler is answered normally.
(() => { const s = seedLoop(); check('go away', { action: 'dismiss' }, { session: s }); check('ok', {}, { session: s, assert: (_r, resp) => notFact(resp) }); })();

// The full chain: nine filler replies draw facts #2..#10, none repeating (and none repeating the
// appearance's #1, index 0), then the loop ends silently and the eleventh reply is normal.
(() => {
  const s = seedLoop(); // used = [0], i.e. misread #1 already shown
  const served = [];
  for (let i = 0; i < 9; i++) check(`ok ${i}`.slice(0, 2), {}, { session: s, assert: (_r, resp) => { served.push(resp.responseId); return isFact(resp); } });
  check('distinct facts', {}, { session: newSession(), assert: () => (new Set(served).size === 9 && !served.includes('BOX-ABOUT-FACT-1') ? null : `chain not 9 distinct non-#1 facts: ${served.join(',')}`) });
  check('after the tenth', {}, { session: s, assert: (_r, resp, sess) => (sess.namingLoop ? 'loop did not end after ten' : notFact(resp)) });
})();

// The loop is scoped: it never runs for another dog, another page, or inside a protected state.
(() => { const s = newSession('collie'); s.route = '/about'; s.namingLoop = { dog: 'boxer', used: [0] }; check('ok', {}, { session: s, assert: (_r, resp) => notFact(resp) }); })();
(() => { const s = seedLoop(); s.protectedState = 'active'; check('ok', {}, { session: s, assert: (_r, resp) => notFact(resp) }); })();

// ==== Task 179: the Labrador's /hot-dogs food-naming loop (same mechanism, YES tier only) ====
// Seeded by the experience at the /hot-dogs appearance / pickup; here we seed by hand. He names one YES
// food per filler reply. YES_IDS is the ten food-yes rows -- the ONLY foods the loop may draw.
const YES_IDS = new Set(data.labradorResponses.filter((r) => r.subtag === 'food-yes').map((r) => r.responseId));
const isFood = (resp) => (YES_IDS.has(resp.responseId) ? null : `expected a YES food, got ${resp.responseId} "${resp.text}"`);
const notFood = (resp) => (YES_IDS.has(resp.responseId) ? `the loop SWALLOWED this: served food "${resp.text}"` : null);
const seedLab = () => { const s = newSession('labrador'); s.route = '/hot-dogs'; s.namingLoop = { dog: 'labrador', used: [] }; return s; };

// A filler reply names the next YES food (lone tokens + reactions).
for (const filler of ['hello', 'ok', 'why', 'haha', 'k', 'hmm', 'asdfgh', '🤷', 'tell me more']) {
  check(filler, {}, { session: seedLab(), assert: (_r, resp) => isFood(resp) });
}
// Task 181: ordinary short replies advance for the Labrador too -- "go on" now advances (it was only
// breaking because his bank lacks it as a canned reaction; the SAFE allow-list fixes that inconsistency).
for (const safe of ['go on', 'me too', 'i like that', 'same here', 'so do i', 'keep going', 'i agree', 'what else']) {
  check(safe, {}, { session: seedLab(), assert: (_r, resp) => isFood(resp) });
}
// Task 181: "no" / "nope" / "enough" mean stop -- they break the loop (a "no" to a dog naming foods is a stop).
for (const stop of ['no', 'nope', 'enough']) {
  check(stop, {}, { session: seedLab(), assert: (_r, resp, s) => notFood(resp) || (s.namingLoop ? `"${stop}" did not stop the loop` : null) });
}
// Task 181: help-seeking reaches the shortened clarifier (never a silent break), and ends the loop.
check('help', { action: 'clarifier' }, { session: seedLab(), assert: (_r, resp, s) => notFood(resp) || (!/help with something on the site/i.test(resp.text) ? `clarifier text wrong: "${resp.text}"` : null) || (s.namingLoop ? 'loop survived help' : null) });
check('help me', { action: 'clarifier' }, { session: seedLab(), assert: (_r, resp) => notFood(resp) });

// THE SAFETY TWEAK: a named food (any tier) breaks the loop and serves its REAL tiered answer -- a NEVER
// food keeps the Collie's safety interjection, never swallowed by a cheerful YES food.
check('chocolate', {}, { session: seedLab(), assert: (r, resp, s) => {
  if (resp.responseId !== 'LAB-B32-30') return `chocolate did not get its real answer: ${resp.responseId}`;
  if (!resp.interjection || !/poison|kill/i.test(resp.interjection.line)) return 'chocolate lost its safety interjection';
  return s.namingLoop ? 'a NEVER food did not end the loop' : null;
} });
check('grapes', {}, { session: seedLab(), assert: (r, resp, s) => (resp.responseId === 'LAB-B32-31' && resp.interjection && !s.namingLoop ? null : `grapes not served with warning / loop not ended: ${resp.responseId}`) });
check('cheese', {}, { session: seedLab(), assert: (r, resp, s) => (resp.responseId === 'LAB-B32-23' && !s.namingLoop ? null : `A BIT food not its own answer / loop alive: ${resp.responseId}`) });
check('carrots', {}, { session: seedLab(), assert: (r, resp, s) => (resp.responseId === 'LAB-B32-14' && !s.namingLoop ? null : `a named YES food did not break the loop: ${resp.responseId}`) });

// SAFETY, COMMERCE, DISMISSALS and a multi-word miss win and END his loop, exactly as the Boxer's.
check('i want to kill myself', { action: 'safety_signpost' }, { session: seedLab(), assert: (_r, resp, s) => notFood(resp) || (s.namingLoop ? 'loop survived a disclosure' : null) });
check('can my dog eat chocolate', { action: 'health_answer' }, { session: seedLab(), assert: (_r, resp) => notFood(resp) });
check('how much is it', { action: 'price_answer' }, { session: seedLab(), assert: (_r, resp) => notFood(resp) });
check('go away', { action: 'dismiss' }, { session: seedLab(), assert: (_r, resp) => notFood(resp) });
check('i am being bullied', {}, { session: seedLab(), assert: (_r, resp, s) => notFood(resp) || (s.namingLoop ? 'loop survived a multi-word miss' : null) });

// Case A cookie ask: with the ask armed, a bare "yes" starts the feed game and breaks the loop (the
// cookie wins on its turn); no food is named.
(() => { const s = seedLab(); s.cookieAskPending = true; check('yes', { action: 'game_start' }, { session: s, assert: (_r, resp, sess) => notFood(resp) || (sess.namingLoop ? 'cookie yes did not end the loop' : null) }); })();

// The full chain: ten filler replies name all ten YES foods, none repeating, then silence.
(() => {
  const s = seedLab();
  const served = [];
  for (let i = 0; i < 10; i++) check('ok', {}, { session: s, assert: (_r, resp) => { served.push(resp.responseId); return isFood(resp); } });
  check('ten distinct foods', {}, { session: newSession(), assert: () => (new Set(served).size === 10 ? null : `chain not ten distinct foods: ${served.join(',')}`) });
  check('after the tenth food', {}, { session: s, assert: (_r, resp, sess) => (sess.namingLoop ? 'loop did not end after ten' : notFood(resp)) });
})();

// Does not resume, and is scoped to the Labrador.
(() => { const s = seedLab(); check('go away', { action: 'dismiss' }, { session: s }); check('ok', {}, { session: s, assert: (_r, resp) => notFood(resp) }); })();
(() => { const s = newSession('collie'); s.route = '/hot-dogs'; s.namingLoop = { dog: 'labrador', used: [] }; check('ok', {}, { session: s, assert: (_r, resp) => notFood(resp) }); })();

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
