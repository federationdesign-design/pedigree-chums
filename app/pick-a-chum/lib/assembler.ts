// Response assembler (brief section 15). Combines an approved fact if needed, a
// character line, a pivot and a destination, filling placeholder tokens from the
// central campaign, rules, FAQ, knowledge and destination records. Rotation
// avoids repeating an exact line or destination within a session.

import { ChumData, Resolution, Dog, CollieResponse } from './types';
import { effectiveBank } from './banks';
import { Normalised } from './normalise';
import { Session } from './session';
import { CAMPAIGN } from '../data/campaign';
import { RULES } from '../data/rules';
import { bioForRoute, PAGE_BIOS } from '../data/page-bios';
import { MODERATION, HEALTH_DIAGNOSIS_BOUNDARY, SAFETY_SIGNPOST } from '../data/moderation';

export interface Assembled {
  responseId: string;
  text: string;
  dog: Dog;
  destinationId?: string;
  url?: string | null;
  openPopup?: boolean;
  transferTo?: Dog;
  closed?: boolean;
  followUp?: string; // a second message sent after a short pause (bark-game break)
  followUpMedia?: { src: string; alt: string }; // Task 166: a clip carried on that follow-up (a red cookie: reaction first, clip + reason a beat later)
  // Task 176: a multi-message FAQ answer. The first message is `text`/`url`; these are the REST, each its
  // own bubble after a pause, each optionally carrying its own link. Not concatenated -- separate messages.
  sequence?: { text: string; url?: string | null; destinationId?: string }[];
  // Task 15 (S12) presentation: a safety message served under the protected support
  // surface carries a shared header and hides the dog name/avatar/character label.
  header?: string; // e.g. 'HELP AND SUPPORT' above a protected safety response
  hideDogIdentity?: boolean; // true: no dog name, avatar or character label above the response
  ariaLabel?: string; // Task 58: screen-reader label for a non-verbal response (the ':(' / ':)' faces). The UI must render this as the accessible name.
  media?: { src: string; alt: string }; // Task 138: a short looping clip served with the line. Local files only -- nothing fetched at runtime, so what a child sees is what was approved.
  linkLabel?: string; // Task 140: an explicit label for the action link when the target is not a destination/article record (the fetch fall-through to a page bio); actionFor prefers this over destinationName.
  gameOutput?: string; // Task 115: the game's monospace board / sheep tiles / drawing, rendered pre-formatted below the line.
  gameCorrect?: string; // Task 178 §4: a correct answer -- the word to celebrate (fires the win animation)
  interjection?: { dog: Dog; line: string }; // Task 161: a one-line aside from ANOTHER dog (the Collie), played after the active dog's line WITHOUT changing the active dog.
}

// Task 58: screen-reader label for the sad-face emoticon (grief ':(' and the loop's ':)'
// close). Approved by Steve. An emoticon has no useful spoken form, so the UI renders this
// as the accessible name instead.
export const SAD_FACE_SR_LABEL = 'the Collie looks sad';
export const SMILE_FACE_SR_LABEL = 'the Collie smiles';
export const DEAD_FACE_SR_LABEL = 'the dog plays dead';

// Task 140/141: birthday is the one clip reply with no workbook row (its line is the existing smile
// face, so it carries the smile accessible name). Held as a code constant, flagged for workbook
// migration in PLACEHOLDERS.md. (car and balls moved into the workbook in Task 141: B64 / B52-MISC-09;
// their clips now attach in the canned case below, keyed by responseId, like cats.)
const MEDIA_REPLIES: Record<string, { text: string; media: { src: string; alt: string }; ariaLabel?: string }> = {
  // Task 176 (clip accessibility): owner copy, verbatim. Birthday moves from the ':)' face to real words
  // ("party hat"), so the smile SR label is dropped (the words are self-describing now).
  'BIRTHDAY-01': { text: 'party hat', media: { src: '/chat-media/birthday.mp4', alt: 'A birthday celebration' } },
  // Task 156: any mention of hats plays the hats clip. Not a hat-hunt hat itself.
  'HATS-01': { text: 'I brought you a hat', media: { src: '/chat-media/hats.mp4', alt: 'A dog in a hat' } },
};
// Task 141: canned rows that carry a clip. The clip joins the row's copy, it does not replace it.
const CANNED_MEDIA: Record<string, { src: string; alt: string }> = {
  'B21-CATS-01': { src: '/chat-media/cats.mp4', alt: 'A cat looking back' },
  'COL-B52-MISC-09': { src: '/chat-media/ball.mp4', alt: 'A tennis ball' },
  'COL-B64-CAR-01': { src: '/chat-media/car.mp4', alt: 'A dog enjoying a car ride' },
};

// Fetch sometimes brings back a physical THING instead of a page link -- the tennis ball, the newspaper, the
// hat clip (the hat reuses HATS-01's hats.mp4). The engine's fetchCount rotates them 1-in-4 so it is never
// the same thing twice, and never a page every time. The two emoji ARE the thing he dropped at your feet;
// each carries a screen-reader name (a lone glyph reads poorly), the same treatment the ":)" reply uses.
const FETCH_THINGS: { id: string; text: string; ariaLabel?: string; media?: { src: string; alt: string } }[] = [
  { id: 'FETCH-THING-BALL', text: '🎾', ariaLabel: 'He fetched a tennis ball' },
  { id: 'FETCH-THING-NEWSPAPER', text: '🗞️', ariaLabel: 'He fetched a newspaper' },
  { id: 'FETCH-THING-HAT', text: 'I brought you a hat', media: { src: '/chat-media/hats.mp4', alt: 'A dog in a hat' } },
];

const DOG_LABEL: Record<Dog, string> = {
  collie: 'Collie',
  labrador: 'Labrador',
  terrier: 'Border Terrier',
  boxer: 'Boxer',
};

// Shown only until the workbook B15 orientation rows carry real copy (logged in
// PLACEHOLDERS.md). Deliberately not final copy: Steve writes the Collie voice.
const ORIENTATION_PLACEHOLDER = '[B15 orientation line, copy pending: Steve to write in the Collie voice]';
// Terminal catch-all line. Approved by Steve. MUST NOT contain {{input}}: the
// catch-all never echoes the visitor's raw words.
const FALLBACK_LINE = 'I am not sure what you want me to do with that. Try a full question, or choose dogs, games or the website.';
// Bark-game break and post-break acknowledgement: copy pending (logged in
// PLACEHOLDERS.md). Steve writes these families into the workbook (B19 / B20).
const BARK_BREAK_PLACEHOLDER = '[B19 bark-break line, copy pending]';
const BARK_ACK_PLACEHOLDER = '[B20 bark-acknowledgement line, copy pending]';

// Per-breed SHARED factual answer (no dog voice). Task 39: the ten v6 "Brief Aligned
// Pass" first-contact rewrites (curly apostrophes normalised to straight), held as code
// constants (not workbook rows); migrate into the workbook with the other breed copy later.
// VERIFIED 29 July 2026 against Kennel Club, breed club and heritage
// sources. All ten claims supported. Two notes: the French Bulldog line
// restores "Nottingham" per the Kennel Club's own wording. The
// Staffordshire line is accurate but deliberately omits that the close
// handling took place in fighting pits; the Staffordshire Bull Terrier
// Heritage Centre records that fighting dogs were handled in the pit by
// owners and judges and so were bred to be trustworthy with humans. That
// omission is an editorial decision for a children's product, not an
// oversight.
const BREED_FACTS: Record<string, string> = {
  labrador:
    'Labrador ancestors hauled nets through Newfoundland waters. The pond obsession has proper historical backing.',
  'border-collie':
    'Border Collies move sheep with a hard stare called the eye. The old job still shows.',
  boxer:
    'Boxers were bred to hold large animals until help arrived. Determination, disguised as permanent surprise.',
  'border-terrier':
    'Border Terriers kept pace with horses and followed foxes underground. A lot of dog in very little space.',
  'cocker-spaniel':
    'Cocker Spaniels were bred to flush woodcock from thick cover. That explains the hedge inspections.',
  beagle:
    'Beagles were bred so people could follow the hunt on foot. That voice was designed to travel.',
  'french-bulldog':
    'Nottingham lace workers took small Bulldogs to France. American breeders later backed the upright bat ears.',
  pug:
    'Pugs lived in Chinese imperial courts, sometimes with guards. Important treatment became the working assumption.',
  'german-shepherd':
    'German Shepherds were created for long, purposeful work. That famous trot was part of the original plan.',
  'staffordshire-bull-terrier':
    'Staffordshire Bull Terriers were handled closely, so steadiness around people mattered from the start.',
};

// Shared lines (Steve's approved copy, no character variation) for a breed question
// with no breed named. BREED_HUB attaches the /chums index page as its [LINK];
// BREED_BEST has no destination.
// Task 91: shortened to match BREED_BEST's terse shape (was 26 words after two one-word turns).
// NOTE: this is an assembler constant, not a workbook row (it predates the workbook, flagged for
// migration with the other constants); Steve expected a workbook row.
const BREED_HUB_LINE = 'We are a pack of 54. Name one.';
const BREED_BEST_LINE =
  "There are 54 Chums. Name a breed and I'll explain its original job.";

// Bark presentation: only the Collie is wired live. Labrador/Terrier/Boxer bark
// words and their B19/B20 English lines are PARKED with the Phase 3 voice
// package; the per-dog state machine still runs for them, but their responses
// render a parked marker until Phase 3.
const COLLIE_BARK = { word: 'Woof', end: '.' };
// Task 165: each dog's own bark word, so a non-Collie no longer barks the Collie's "Woof." DRAFT copy,
// pending owner approval (same status as SELF_BREED_LINES). The Boxer is a big deep "Ruff", the Terrier a
// small sharp "Yap", the Labrador an eager "Boof".
const BARK_PRESENTATION: Partial<Record<Dog, { word: string; end: string }>> = {
  collie: COLLIE_BARK,
  labrador: { word: 'Boof', end: '!' },
  terrier: { word: 'Yap', end: '!' },
  boxer: { word: 'Ruff', end: '!' },
};
// Task 165: each non-Collie dog's own bark-game BREAK (the English line after round five) and post-break
// ACKNOWLEDGEMENT, so they no longer fall back to the Collie's B19/B20 rows (the Task 157 interim, the same
// class of fault as the Boxer serving her knock-knock). The Collie keeps her real bank rows (COL-B19/B20).
// DRAFT copy, pending owner approval. No em dashes, no links in the dialogue (house rules).
const BARK_BREAK_LINES: Partial<Record<Dog, string>> = {
  labrador: 'ok ok i cant keep this up, my tongue has gone all floppy. that was BRILLIANT though. again? or we could go and find a snack.',
  terrier: 'right, thats enough of that. my throat is not built for a long shift. you bark alright, for a human.',
  boxer: 'AH i lost count, i always lose count. that was the best conversation ive ever had and it was all barking. one more? no? ok.',
};
const BARK_ACK_LINES: Partial<Record<Dog, string>> = {
  labrador: 'good barking. best barking. im telling everyone. right, whats next, a walk or some food.',
  terrier: 'not bad at all. we are done though. ask me something proper, or go and dig about the site.',
  boxer: 'top barking!! we should start a band. anyway, ask me anything, im full of facts. some of them are even true.',
};
// Task 165: each dog's own bark-game EXIT (the "stop" line), so it is no longer the one shared Collie
// string for every dog (same fault class as the break and the acknowledgement). DRAFT copy.
const BARK_EXIT_LINES: Record<Dog, string> = {
  collie: 'Good barking. That is enough for now. Ask me about a dog breed, or how the card game works.',
  labrador: 'ok im done, im all barked out, that was ACE. ask me anything now, or we could go and find some food.',
  terrier: 'right, thats us finished. good enough. ask me something proper now, or go and dig about the site.',
  boxer: 'phew, im done, my bark ran clean out. GREAT game. ask me anything now, im basically an encyclopedia. a wrong one.',
};
const DOG_PREFIX: Record<Dog, string> = { collie: 'COL', labrador: 'LAB', terrier: 'TER', boxer: 'BOX' };

// Task 157 (§3): each dog's own take on its breed, drawn from that breed's fact + character on its chum
// page, in that dog's voice. DRAFT COPY -- reported for owner approval, not final (the same data the
// Boxer's /about misreads came from). The Collie is the dry organiser; the Labrador is food-and-water
// enthusiasm; the Boxer is confidently boisterous; the Terrier is blunt.
const SELF_BREED_LINES: Record<Dog, string> = {
  collie: 'A Border Collie. We hold more world records than any breed going, and yes, I keep count. Bred to work, wired to think. I do not sit still well.',
  labrador: 'Labrador!! best friend in the country, officially it says so. we can even smell when a person is poorly. also i love water. and food. mostly food.',
  // Task 165: reworded so it no longer repeats his /about misread (the "named after boxing / spar with our
  // paws" line), which a visitor who read that page would already have seen. Fresh angle, same voice. DRAFT.
  boxer: 'a Boxer! big, soft, and completely convinced im helping. brilliant with kids, hopeless at sitting still. all heart, all bounce, and not a lot of plan.',
  terrier: 'Border Terrier. bred to go down holes after foxes and rats. small, stubborn, dont back down. dont let the size fool you.',
};

// Task 165: the games menu LIST is now per-dog. Each dog offers only the games it can actually start
// (Treat Trail is Labrador-only, Missing Biscuit Terrier-only, DO NOT PRESS THAT BUTTON Boxer-only; the
// Collie keeps her three plus the bark game). Before this, every dog served the Collie's B45-GAMELIST-02
// row and so offered games it could not start. DRAFT copy, pending owner approval (same status as
// SELF_BREED_LINES).
// Each dog's menu is `line` (the served text, verbatim) PLUS `items` (the same games as tappable pills:
// label + the exact start `phrase` the router accepts). The two live together so the pills ARE that dog's
// menu content, not a separate hardcoded list, and can never drift from the text. The `phrase` values are
// verified to start each game (dog-gated) -- tapping a pill sends the phrase through the identical submit
// path as typing it, so typing keeps working unchanged.
export interface GamesMenuItem { label: string; phrase: string; }
export interface GamesMenu { line: string; items: GamesMenuItem[]; }
export const GAMES_MENU: Record<Dog, GamesMenu> = {
  collie: {
    line: 'Nine-Square, Missing Sheep, or Kennel Sketch. Or say woof for the bark game. Say one.',
    items: [
      { label: 'Nine-Square', phrase: 'nine square' },
      { label: 'Missing Sheep', phrase: 'missing sheep' },
      { label: 'Kennel Sketch', phrase: 'kennel sketch' },
      { label: 'Bark game', phrase: 'woof' },
    ],
  },
  labrador: {
    line: 'Treat Trail, or Feed the Dog a Cookie. Say one and we start.',
    items: [
      { label: 'Treat Trail', phrase: 'treat trail' },
      { label: 'Feed the Dog a Cookie', phrase: 'feed the dog a cookie' },
    ],
  },
  terrier: {
    line: 'The Case of the Missing Biscuit. Say the word and we crack it.',
    items: [{ label: 'The Case of the Missing Biscuit', phrase: 'missing biscuit' }],
  },
  boxer: {
    line: 'DO NOT PRESS THAT BUTTON. thats the one. say mini game.',
    items: [{ label: 'DO NOT PRESS THAT BUTTON', phrase: 'do not press that button' }],
  },
};

// The generated bark volley: the dog's own word, count units, e.g. "Woof. Woof.".
// Task 157: until each dog's own bark voice ships (Phase 3), a dog with no presentation barks the
// Collie's "Woof." rather than leaking the parked placeholder to a visitor -- same class of fault as
// the breed-choice placeholder fixed in Task 142.
function barkVolley(dog: Dog, count: number): string {
  const p = BARK_PRESENTATION[dog] ?? COLLIE_BARK;
  return Array.from({ length: Math.max(1, count) }, () => `${p.word}${p.end}`).join(' ');
}

// A dog-specific B19/B20 line (COL-/LAB-/TER-/BOX- prefixed), unused first.
// Task 157: B19/B20 are Collie-only for now, so a dog with no rows of its own FALLS BACK to the Collie's
// (COL-) lines instead of rendering the "copy pending" placeholder in the bark break / acknowledgement.
function pickBark(data: ChumData, bucket: string, dog: Dog, used: string[]): CollieResponse | null {
  const own = data.collieResponses.filter((r) => r.bucketId === bucket && r.responseId.startsWith(DOG_PREFIX[dog]));
  const pool = own.length ? own : data.collieResponses.filter((r) => r.bucketId === bucket && r.responseId.startsWith('COL'));
  return pool.find((r) => !used.includes(r.responseId)) ?? pool[0] ?? null;
}

// Fill {{token}} placeholders from a context map. Unknown tokens are dropped and
// stray double spaces collapsed, so a partial context never leaks braces.
function fill(template: string, ctx: Record<string, string>): string {
  return template
    .replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, key) => ctx[key] ?? '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Last calendar day of the current month, formatted for UK. Mirrors the
// /chumspot competition page (components: app/chumspot/ChumSpotClient.tsx) EXACTLY
// so the chatbot and that page can never state different closing dates.
function competitionCloseDate(): string {
  return new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function baseContext(n: Normalised, destName = ''): Record<string, string> {
  return {
    competition_close_date: competitionCloseDate(),
    price_answer: CAMPAIGN.answers.price_answer,
    launch_answer: CAMPAIGN.answers.launch_answer,
    delivery_answer: CAMPAIGN.answers.delivery_answer,
    discount_answer: CAMPAIGN.answers.discount_answer,
    approved_rule_summary: RULES.summary,
    rule_summary: RULES.summary,
    deal_answer: RULES.dealAnswer,
    win_condition: RULES.winCondition,
    player_count_answer: RULES.playerCount,
    age_answer: RULES.ageGuidance,
    input: n.original,
    destination_name: destName,
    food_word: n.original.replace(/[.!?]+$/, ''),
    topic: n.original.replace(/[.!?]+$/, ''),
  };
}

// Task 176: the dog's own FAQ answers (owner copy), served verbatim -- no B04 flourish appended.
// Encodings in the FAQ "Canonical answer" cell:
//   ~~~  rotate: pick one of several alternates (FAQ001's three how-to-play lines)
//   |||  sequence: several messages played in turn, not one long line (FAQ009, FAQ012)
//   [[/path]]  a per-message link token: stripped from the text, wired as a structural link
const FAQ_ROTATE = '~~~';
const FAQ_SEQ = '|||';
// Pull a per-message link out of a sequence step, returning the cleaned text + the target path.
function faqStep(raw: string): { text: string; url?: string | null } {
  const m = raw.match(/\[\[([^\]]+)\]\]/);
  const url = m ? m[1].trim() : null;
  const text = raw.replace(/\[\[[^\]]+\]\]/g, '').replace(/\s{2,}/g, ' ').trim();
  return { text, url };
}
// Rotate through ~~~ alternates by the turn count, so a visitor asking twice hears different lines.
function faqRotate(raw: string, session: Session): string {
  const alts = raw.split(FAQ_ROTATE).map((s) => s.trim()).filter(Boolean);
  if (!alts.length) return raw.trim();
  return alts[(session.submissionCount ?? 1) % alts.length] ?? alts[0];
}

// Pick a bucket response, preferring one not used this session (rotation). Falls
// back to reuse only when every alternative has been used.
function pickResponse(data: ChumData, bucket: string, used: string[]): CollieResponse | null {
  const pool = data.collieResponses.filter((r) => r.bucketId === bucket);
  if (!pool.length) return null;
  return pool.find((r) => !used.includes(r.responseId)) ?? pool[0];
}

function copy(data: ChumData, type: string, subgroup?: string): string {
  const c = data.copyComponents.find((x) => x.type === type && (!subgroup || x.subgroup === subgroup));
  return c ? c.line : '';
}

// Deterministic destination rotation for conversational / fallback routes: first
// Play/Learn/Discover destination with a real target not offered yet this session.
function pickDestination(data: ChumData, offered: string[]): { id: string; name: string; url: string | null } | null {
  const families = ['Play', 'Learn', 'Discover'];
  const pool = data.destinations.filter(
    // Task 137: a real page only. Embedded destinations have no resolvedUrl,
    // so the text named one place while the link went somewhere else.
    (d) => families.some((f) => d.family.includes(f)) && !!d.resolvedUrl
  );
  const choice = pool.find((d) => !offered.includes(d.destinationId)) ?? pool[0];
  return choice ? { id: choice.destinationId, name: choice.name, url: choice.resolvedUrl } : null;
}

// The active dog's mid-conversation handoff line (NAV_BREED_HANDOFF family),
// deterministically rotated by turn count (never Math.random), with the trailing
// [LINK] token stripped (the page link is attached as the action button). Empty if
// the dog has no handoff lines.
function navHandoff(data: ChumData, dog: Dog, session: Session): string {
  const pool = data.linkHandoffs.filter((h) => h.family === 'NAV_BREED_HANDOFF' && h.dog === DOG_LABEL[dog]);
  if (!pool.length) return '';
  return pool[session.submissionCount % pool.length].line.replace(/\s*\[LINK\]\s*$/i, '').trim();
}

export function assemble(res: Resolution, data0: ChumData, n: Normalised, session: Session): Assembled {
  const dog = session.activeDog;
  // Per-dog architecture: swap in the active dog's effective response bank (its own rows per owned
  // bucket, Collie otherwise; protected buckets always Collie). Every pickResponse, the canned find and
  // pickBark below read data.collieResponses, so they all become dog-aware here with no per-call change.
  // Only the response bank is scoped; every other array (faq, gk, destinations, dogs...) is shared.
  const data: ChumData = dog === 'collie' ? data0 : { ...data0, collieResponses: effectiveBank(data0, dog) };

  switch (res.action) {
    case 'safety_signpost':
    case 'safety_boundary': {
      const cat = MODERATION.find((m) => m.id === res.moderationId) ?? MODERATION[0];
      const idx = session.usedResponseIds.filter((id) => id.startsWith(cat.id)).length % cat.responses.length;
      const text = cat.responses[idx].replace('{{safety_signpost_copy}}', SAFETY_SIGNPOST).replace(/\s{2,}/g, ' ').trim();
      const rid = `${cat.id}-${idx}`;
      // A bare ':(' safety line (MOD_ABUSE) is non-verbal, so it gets the same accessible
      // name grief and the canned faces use, rather than being read as punctuation.
      if (text === ':(') return { responseId: rid, text, ariaLabel: SAD_FACE_SR_LABEL, dog };
      return { responseId: rid, text, dog };
    }

    case 'health_answer':
      return { responseId: HEALTH_DIAGNOSIS_BOUNDARY.id, text: HEALTH_DIAGNOSIS_BOUNDARY.response, dog };

    case 'grief':
      // Task 58: a dog bereavement. The dog just looks sad; it does not try to fix it or say
      // something clumsy. All three scenarios (GRIEF-01/02/03) share this one gentle line.
      return { responseId: res.griefCategory ?? 'GRIEF', text: ':(', ariaLabel: SAD_FACE_SR_LABEL, dog };

    // Task 78: the two visual tricks. The effect is the image going black / rolling over, driven by the
    // resolution action in the experience. roll_over lands on ':)' after the rotation.
    // Task 165: play_dead used to send an EMPTY bubble (the blackout alone was the answer), which read as a
    // broken, silent turn in live testing. It now lands on a non-verbal 'x_x' face -- the same convention as
    // roll_over's ':)' -- so there is always a visible reply, with the blackout still playing behind it.
    case 'play_dead':
      return { responseId: 'PLAY-DEAD', text: 'x_x', ariaLabel: DEAD_FACE_SR_LABEL, dog };
    case 'roll_over':
      return { responseId: 'ROLL-OVER', text: ':)', dog };

    // Task 115: the three in-chat games. The engine has already processed the move and put the copy
    // (with {{WORD}}/{{ANSWER}} substituted) and the monospace display on the resolution; the assembler
    // just packages them. The display renders in a monospace, pre-formatted block (the UI's .gameOutput).
    case 'game_start':
    case 'game_move':
    case 'game_exit':
      // Task 146: a Treat Trail finale carries the /hot-dogs link (res.url / destinationId).
      // Task 149: a Feed the Dog a Cookie turn carries a clip every fifth cookie (res.gameMedia).
      // Task 151: the cookie give-up carries a follow-up beat, the sleepy "zzz" (res.gameFollowUp).
      return { responseId: res.gameLine ?? res.action, text: res.gameText ?? '', gameOutput: res.gameDisplay ?? undefined, dog, ...(res.url ? { url: res.url, destinationId: res.destinationId } : {}), ...(res.gameMedia ? { media: res.gameMedia } : {}), ...(res.gameFollowUp ? { followUp: res.gameFollowUp } : {}), ...(res.gameFollowUpMedia ? { followUpMedia: res.gameFollowUpMedia } : {}), ...(res.gameCorrect ? { gameCorrect: res.gameCorrect } : {}) };

    // Task 111: "fetch" hands back a rotating Play/Learn/Discover link (deterministic rotation via the
    // session's offered set), instead of the old B11 command voice. The line comes from the B03 link
    // bank, filled with the destination name.
    case 'random_link': {
      // Fetch is a deterministic 1-in-4 MIX: every 4th throw brings back a physical THING (rotating ball ->
      // newspaper -> hat), the other three a PAGE. Pages run the ordered pool [B03 thrown lines first (written
      // to be thrown, funnier), then the page bios], indexed by a page counter MODULO the pool size -- so once
      // all are spent it CYCLES from the top rather than sticking on the first bio forever (the old bug). The
      // engine's session.fetchCount (the pre-turn value) drives both, so the same count reproduces the same
      // sequence -- deterministic, and it guarantees the variety (never a thing every time, never a page every
      // time). Concrete routes only (the dynamic breed route has no single link).
      const B03 = data.collieResponses.filter((x) => x.bucketId === 'B03');
      const bios = PAGE_BIOS.filter((b) => !b.route.includes('['));
      const poolSize = B03.length + bios.length;
      const fetchNo = (session.fetchCount ?? 0) + 1; // this fetch's 1-based ordinal
      if (fetchNo % 4 === 0) {
        // A thing: one per completed group of four, rotating through FETCH_THINGS.
        const thing = FETCH_THINGS[(fetchNo / 4 - 1) % FETCH_THINGS.length];
        return { responseId: thing.id, text: thing.text, dog, ...(thing.ariaLabel ? { ariaLabel: thing.ariaLabel } : {}), ...(thing.media ? { media: thing.media } : {}), followUp: 'play again? just say fetch' };
      }
      // A page. pagesSoFar = fetches so far minus the things among them (one per completed four).
      const pagesSoFar = fetchNo - 1 - Math.floor((fetchNo - 1) / 4);
      const idx = poolSize ? pagesSoFar % poolSize : 0;
      if (idx < B03.length) {
        // Task 137: the destination follows the LINE (five B03 templates name a specific place; R01/R10 use
        // the token and get a free pick), so the text and its link never mismatch.
        const r = B03[idx];
        const named = data.destinations.find((d) => !!d.resolvedUrl && r.template.includes(d.name));
        const dest = named ? { id: named.destinationId, name: named.name, url: named.resolvedUrl } : pickDestination(data, session.offeredDestinationIds);
        const name = dest?.name ?? 'the site';
        const text = fill(r.template, baseContext(n, name));
        // Task 135: fetch is a game, so it invites another go (the chat is not minimised on this link).
        return { responseId: r.responseId, text, dog, destinationId: dest?.id, url: dest?.url ?? null, followUp: 'play again? just say fetch' };
      }
      // A page bio (carries its own link label; many bio pages have no destination record).
      const bio = bios[idx - B03.length];
      const dest = data.destinations.find((x) => x.resolvedUrl === bio.route);
      return { responseId: `FETCH-BIO-${bio.route}`, text: bio.bio, dog, destinationId: dest?.destinationId, url: bio.route, linkLabel: dest?.name ?? bio.name, followUp: 'play again? just say fetch' };
    }

    case 'paw': {
      // Task 138: the paw from the identity game, as a short loop.
      return { responseId: 'PAW-01', text: 'paw', dog, media: { src: '/chat-media/paw.mp4', alt: 'A dog offering its paw' } };
    }

    case 'media_reply': {
      // Task 140/141: the birthday clip reply (the smile face + clip). Selected by responseId.
      const m = MEDIA_REPLIES[res.responseId ?? ''] ?? MEDIA_REPLIES['BIRTHDAY-01'];
      const out: Assembled = { responseId: res.responseId ?? 'MEDIA-REPLY', text: m.text, dog, media: m.media };
      if (m.ariaLabel) out.ariaLabel = m.ariaLabel;
      return out;
    }

    case 'good_boy':
      // Task 176 (clip accessibility): the wagging-tail clip now carries a spoken line so it works for a
      // screen reader, images-off, reduced motion or a missed loop. The ':)' keeps the smile SR label the
      // system gives every ':)' glyph. Owner copy, verbatim.
      return { responseId: 'GOOD-BOY-01', text: ':)', ariaLabel: SMILE_FACE_SR_LABEL, dog, media: { src: '/chat-media/goodboy.mp4', alt: 'A dog wagging its tail' } };

    case 'how_are_you': {
      // Task 142: a personal question with no in-world answer -> one of three deflection clips, chosen
      // AT RANDOM and not repeated until all three have been used this session (the B57 fact pattern).
      // Task 176 (clip accessibility): each clip now carries the dog's spoken line (owner copy, verbatim),
      // so the answer survives without the video -- screen reader, images-off, reduced motion, missed loop.
      const clips = [
        { responseId: 'HOWAREYOU-1', src: '/chat-media/howareyou1.mp4', alt: 'A dog typing at a computer', text: 'busy busy busy how are you' },
        { responseId: 'HOWAREYOU-2', src: '/chat-media/howareyou2.mp4', alt: 'A dog with a weary stare', text: 'bored' },
        { responseId: 'HOWAREYOU-3', src: '/chat-media/howareyou3.mp4', alt: 'A corgi looking busy', text: 'im working' },
      ];
      // Task 142 (change 2): the three clips convey completely different feelings, so a visitor who
      // sees one gets the SAME one again. Pick one per session and keep it (reuse the one already
      // served this session; otherwise choose at random).
      const prior = clips.find((x) => session.usedResponseIds.includes(x.responseId));
      const pick = prior ?? clips[Math.floor(Math.random() * clips.length)];
      return { responseId: pick.responseId, text: pick.text, dog, media: { src: pick.src, alt: pick.alt } };
    }

    case 'name_ack': {
      // Task 142: acknowledge the visitor's name ONCE, then drop it (the name is never stored on the
      // session). Two lines, alternating by how often each has been used; the second offers the
      // superpower quiz. The name comes from the resolution, capitalised in the router.
      const name = res.personName ?? 'you';
      const used1 = session.usedResponseIds.filter((id) => id === 'NAME-ACK-1').length;
      const used2 = session.usedResponseIds.filter((id) => id === 'NAME-ACK-2').length;
      if (used2 < used1) {
        return { responseId: 'NAME-ACK-2', text: `Do you want to see if you have super powers, ${name}?`, dog, destinationId: 'superpower', url: '/whats-your-superpower', linkLabel: "What's Your Superpower" };
      }
      return { responseId: 'NAME-ACK-1', text: `Do you want to play a game, ${name}?`, dog };
    }

    case 'name_deflect': {
      // Task 142: someone tried to name her. She deflects, accepts nothing, stores nothing. Two lines,
      // alternating. Owner copy.
      const usedA = session.usedResponseIds.filter((id) => id === 'NAME-DEFLECT-1').length;
      const usedB = session.usedResponseIds.filter((id) => id === 'NAME-DEFLECT-2').length;
      return usedB < usedA
        ? { responseId: 'NAME-DEFLECT-2', text: 'Call me what you like.', dog }
        : { responseId: 'NAME-DEFLECT-1', text: 'I answer to anything.', dog };
    }

    case 'dog_lifespan':
      // Task 142 (change 1): a real general lifespan answer + the breed explorer link (DST006). The
      // pronoun form "how long do they live" stays B48 ("Is what?").
      return { responseId: 'DOG-LIFESPAN', text: 'About 10 to 13 years. Small dogs longer, big dogs less.', dog, destinationId: 'DST006', url: '/know-your-chums' };

    case 'death_answer':
      // Task 142 (change 4): the death cluster, answered in character once. Persistence is escalated
      // to safeguarding by the router/engine, so this line never serves twice in a row.
      return { responseId: 'DEATH-01', text: 'I cannot die as im not alive in the same way as real dogs', dog };

    case 'god_answer': {
      // Task 145: the god cluster. A real answer plus the Anubis essay link (dogs as gods). Three
      // variants by responseId; the generic / persistent form points at the article.
      const text =
        res.responseId === 'GOD-WHICH'
          ? 'Anubis is thought to be a Jackal'
          : res.responseId === 'GOD-READ'
            ? 'im a dog, read the article, it tells you there'
            : 'im a dog, but I do know humans think dogs are gods';
      return { responseId: res.responseId ?? 'GOD-BELIEF', text, dog, destinationId: res.destinationId, url: res.url ?? null };
    }

    case 'religion_dumb':
      // Task 145: a named religion -> she plays dumb, echoing the (whitelisted) religion word.
      return { responseId: 'RELIGION-DUMB', text: `whats ${res.mirror}?`, dog };

    case 'religion_self':
      // Task 145: "whats your religion" -> she is a dog.
      return { responseId: 'RELIGION-SELF', text: 'im a dog', dog };

    case 'maths_answer':
      // Task 145: the computed answer (correct for the Collie on easy sums, absurd otherwise) is
      // carried on the resolution note by the router, which knows the active dog.
      return { responseId: 'MATHS', text: res.note ?? '', dog };

    case 'page_bio': {
      // Task 140: the bio for the page the visitor is standing on (owner copy, page-bios.ts). On
      // the breed page the line carries {{BREED}}, substituted from the slug at runtime (the dog's
      // display name, else the slug title-cased); it must never serve the literal token.
      const route = res.pageBioRoute ?? '/';
      const bio = bioForRoute(route);
      if (!bio) return { responseId: 'PAGE-BIO', text: '', dog };
      // Task 148: the Terrier gives the blunt, practical extended version ("what it is for, what to do
      // when you get there"); every other dog keeps the owner's short bio.
      let text = dog === 'terrier' && bio.extended ? bio.extended : bio.bio;
      if (bio.route.includes('[')) {
        const slug = route.split('?')[0].replace(/\/+$/, '').split('/').pop() ?? '';
        const breed = data.dogs.find((d) => d.slug === slug)?.name
          ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
        text = text.replace(/\{\{\s*BREED\s*\}\}/gi, breed);
      }
      return { responseId: `PAGE-BIO-${bio.route}`, text, dog };
    }

    case 'dog_fact': {
      // Task 134: B57. Chosen AT RANDOM rather than by rotation, and not
      // repeated until the session has used all twenty. usedResponseIds is the
      // session's own record, so the pool empties and refills on its own.
      const pool = data.collieResponses.filter((x) => x.bucketId === 'B57');
      const unseen = pool.filter((x) => !session.usedResponseIds.includes(x.responseId));
      const from = unseen.length > 0 ? unseen : pool;
      const pick = from[Math.floor(Math.random() * from.length)];
      return { responseId: pick?.responseId ?? 'B57', text: pick?.template ?? '', dog };
    }

    case 'ask_dogs':
    case 'ask_breeds':
    case 'ask_games':
    case 'tricks_menu': // Task 134: B54, the question then the list. Serves res.responseId like canned.
    case 'games_menu':
      // Task 123 fix: B45 games menu (GAMELIST-01 question / -02 list); serves res.responseId like canned.
      // Task 165: the LIST (GAMELIST-02) is now PER-DOG, so a dog offers only games it can start. The
      // QUESTION (GAMELIST-01) stays shared and falls through to the canned serve below.
      if (res.responseId === 'B45-GAMELIST-02') {
        return { responseId: `B45-GAMELIST-02-${DOG_PREFIX[dog]}`, text: GAMES_MENU[dog].line, dog };
      }
    // falls through
    case 'canned': {
      // Task 80: a conversational bucket (B21-B39) matched on its column-D triggers. Serve the
      // exact matched row's template verbatim. The faces ':(' and ':)' are non-verbal, so they get
      // an accessible name like grief's ':('. B34's first row hands over the ChumDrop page.
      const r = data.collieResponses.find((x) => x.responseId === res.responseId);
      const text = r?.template ?? '';
      const rid = res.responseId ?? res.bucket ?? 'B21';
      if (text === ':(') return { responseId: rid, text, ariaLabel: SAD_FACE_SR_LABEL, dog };
      if (text === ':)') return { responseId: rid, text, ariaLabel: SMILE_FACE_SR_LABEL, dog };
      // Task 141: a canned row may carry a clip (cats/ball/car), which joins its copy, and/or a
      // route (B51 -> DST006 the breed explorer; B52-MISC-01 -> DST007 Britain's Dog History), which
      // the assembler resolves to a page link. The clip is a local file only.
      const media = CANNED_MEDIA[rid];
      // Task 161: a Labrador dangerous-food (NEVER-tier) row carries a Collie interjection -- one line she
      // cuts in with after his greedy answer. Attached here so send() plays it as an aside, never a transfer.
      const interjection = r?.interjection ? { dog: 'collie' as Dog, line: r.interjection } : undefined;
      if (res.destinationId) {
        const dest = data.destinations.find((d) => d.destinationId === res.destinationId);
        return { responseId: rid, text, dog, destinationId: res.destinationId, url: res.url ?? dest?.resolvedUrl ?? null, ...(media ? { media } : {}), ...(interjection ? { interjection } : {}) };
      }
      return { responseId: rid, text, dog, ...(media ? { media } : {}), ...(interjection ? { interjection } : {}) };
    }

    case 'buy_clarify':
      // Task 175: the bare-get clarifier. A short question the visitor answers yes/no; a yes opens the
      // pre-order (routed in the router). Owner-specified copy, kept inline like the other clarifier lines.
      return { responseId: 'BUY-CLARIFY-01', text: 'The card game?', dog };

    case 'open_discount_popup': {
      const r = pickResponse(data, 'B01', session.usedResponseIds);
      const text = r ? fill(r.template, baseContext(n)) : CAMPAIGN.answers.discount_answer;
      // Task 144: DST001 is now a real route. She sends the visitor to the
      // /discount-code capture page (a nav link that ends the chat) rather than
      // opening the OfferModal in place. Falls back to the literal route if the
      // generated record has not picked up the resolvedUrl.
      const dest = data.destinations.find((d) => d.destinationId === 'DST001');
      return {
        responseId: r?.responseId ?? 'B01',
        text,
        dog,
        destinationId: 'DST001',
        url: dest?.resolvedUrl ?? '/discount-code',
      };
    }

    case 'rules_answer': {
      // Task 176: "how do I play" is FAQ001 -- serve the owner's how-to-play alternates (rotated), not the
      // old B02 pool. The full rules page (DST011) stays attached as the structural link.
      const f = data.faq.find((x) => x.faqId === 'FAQ001');
      const raw = fill(f?.resolvedAnswer ?? '', baseContext(n));
      const text = raw ? faqRotate(raw, session) : RULES.summary;
      return { responseId: 'B02-FAQ001', text, dog, destinationId: 'DST011' };
    }

    case 'link': {
      const dest = data.destinations.find((d) => d.destinationId === res.destinationId);
      const art = data.articles.find((a) => a.articleId === res.destinationId);
      const name = dest?.name ?? art?.title ?? 'the right place';
      const bucket = res.bucket ?? 'B03';
      const r = pickResponse(data, bucket, session.usedResponseIds);
      const text = r ? fill(r.template, baseContext(n, name)) : `${name} is here.`;
      return { responseId: r?.responseId ?? bucket, text, dog, destinationId: res.destinationId, url: res.url ?? dest?.resolvedUrl ?? art?.resolvedUrl ?? null };
    }

    case 'faq_answer': {
      const f = data.faq.find((x) => x.faqId === res.faqId);
      const ctx = baseContext(n);
      // Fill render-time tokens in the answer (e.g. competition_close_date).
      const raw = fill(f?.resolvedAnswer ?? '', ctx);
      // The CTA link for a single-message answer, resolved by structure not copy (FAQ007 -> /hot-dogs via
      // the literal path, FAQ011 -> Competition -> /chumspot). No raw URL ever lives in the answer text.
      const dest = data.destinations.find((d) => d.name === f?.cta || d.destinationId === f?.cta);
      const ctaUrl = dest?.resolvedUrl ?? (f?.cta && f.cta.startsWith('/') ? f.cta : null);
      // Task 176: a |||-sequence FAQ (FAQ009, FAQ012) plays as SEPARATE messages -- first is the reply, the
      // rest ride Assembled.sequence, each with its own [[/path]] link. No B04 flourish is ever appended.
      if (raw.includes(FAQ_SEQ)) {
        const steps = raw.split(FAQ_SEQ).map((s) => faqStep(s)).filter((s) => s.text || s.url);
        const first = steps[0] ?? { text: '', url: null };
        return {
          responseId: `B04-${res.faqId}`,
          text: first.text || 'That is a fair question.',
          dog,
          // Sequence messages carry their OWN [[/path]] links only -- no CTA fallback (it stapled a stray
          // mailto onto FAQ012's "who").
          url: first.url ?? null,
          sequence: steps.slice(1).map((s) => ({ text: s.text, url: s.url })),
        };
      }
      // Task 176: the answer is exactly the owner's line (rotated if it carries ~~~) -- no B04 wrapper.
      const text = (raw.includes(FAQ_ROTATE) ? faqRotate(raw, session) : raw) || 'That is a fair question.';
      const out: Assembled = { responseId: f ? `B04-${f.faqId}` : 'B04', text, dog, url: ctaUrl, destinationId: dest?.destinationId };
      // Task 140: the hot-dog clip joins the FAQ007 answer. Suppressed inside a protected state.
      if (res.faqId === 'FAQ007' && session.protectedState === null) {
        out.media = { src: '/chat-media/hotdog.mp4', alt: 'Hot dogs' };
      }
      return out;
    }

    case 'price_answer': {
      // Task 49: the in-chat price answer, rendered from FAQ008 but through a distinct action so
      // the S12 safety machine treats it like buying (non-meaningful, blocked in a protected
      // state). Same assembly as faq_answer for FAQ008: the approved answer plus a B04 wrapper.
      // Task 176: FAQ008 in the dog's own words, no B04 flourish appended.
      const f = data.faq.find((x) => x.faqId === 'FAQ008');
      const answer = fill(f?.resolvedAnswer ?? '', baseContext(n));
      return { responseId: 'B04-FAQ008', text: answer || 'That is a fair question.', dog };
    }

    case 'gk_answer': {
      const g = data.generalKnowledge.find((x) => x.questionId === res.gkId);
      const pivot = copy(data, 'Collie pivot', 'Geordie');
      const text = g ? `${g.correctAnswer}. ${g.collieObservation} ${pivot}`.replace(/\.\./g, '.').trim() : 'Answered.';
      return { responseId: g ? g.questionId : 'GK', text, dog };
    }

    case 'gk_unknown': {
      // Approved repair line (Steve).
      const text = 'I missed that. Try saying it differently. Or ask about a breed or the card game.';
      return { responseId: 'GK-UNKNOWN', text, dog };
    }

    case 'breed_answer': {
      const collie = data.dogs.find((d) => d.slug === 'border-collie');
      const bits = collie
        ? `${collie.character} Typical working life is around ${collie.lifespanYears} years, and on training we are, professionally speaking, ${collie.training?.label.toLowerCase()}.`
        : 'We maintain a strong professional record.';
      return { responseId: 'B07-COLLIE', text: bits.replace(/\s{2,}/g, ' ').trim(), dog };
    }

    // Task 157 (§3): the active dog recognises its OWN breed, in character, drawn from that breed's own
    // fact + character on its chum page (never a card recital). DRAFT COPY, pending owner approval --
    // reported for sign-off, not final.
    case 'self_breed':
      return { responseId: `SELF-BREED-${DOG_PREFIX[dog]}`, text: SELF_BREED_LINES[dog], dog };

    case 'orientation': {
      const r = pickResponse(data, 'B15', session.usedResponseIds);
      const text = r ? fill(r.template, baseContext(n)) : ORIENTATION_PLACEHOLDER;
      return { responseId: r?.responseId ?? 'B15', text, dog };
    }

    case 'identity': {
      // Family-specific: pick from this SCP family's variants (SCP-F0x-*), rotating.
      const fam = res.responseFamily;
      const pool = fam
        ? data.collieResponses.filter((r) => r.bucketId === 'B16' && r.responseId.startsWith(`SCP-${fam}`))
        : [];
      const r = pool.find((x) => !session.usedResponseIds.includes(x.responseId)) ?? pool[0] ?? pickResponse(data, 'B16', session.usedResponseIds);
      const text = r ? fill(r.template, baseContext(n)) : 'I am exactly what I appear to be, and busy with it.';
      return { responseId: r?.responseId ?? 'B16', text, dog };
    }

    // Task 28: the bark-game offer, explanation and exit. Three approved lines, wired as
    // constants (provided by Steve directly; NOT yet in the generated Collie Responses, so
    // move them into the workbook later). No character variation.
    // Task 154: each dog now offers its OWN game via its B17 row (the Labrador's treat trail, the
    // Terrier's missing biscuit, the Boxer's mini game). Served from the swapped per-dog bank, so it only
    // fires for a dog that has WRITTEN B17; the Collie keeps the bark-game offer (her B17 is the old
    // "not ready" tease, and she is the bark game's home). offer_bark_game is blocked in protected states
    // (AFTERCARE_BLOCKED), so a game offer never surfaces after a disclosure.
    case 'offer_bark_game': {
      if (dog !== 'collie') {
        const r = pickResponse(data, 'B17', session.usedResponseIds);
        if (r && r.responseId !== 'FUN-TEASE-v1' && r.responseId !== 'FUN-TEASE-v2' && r.responseId !== 'FUN-TEASE-v3') {
          return { responseId: r.responseId, text: fill(r.template, baseContext(n)), dog };
        }
      }
      return { responseId: 'OFFER_BARK_GAME', text: 'Type woof to start the bark game. The others are still in training.', dog };
    }
    case 'bark_explain':
      return { responseId: 'BARK_GAME_EXPLAIN', text: 'Type one or more woofs and I will always bark once more than you do. Type stop when you have finished.', dog };
    case 'bark_exit':
      // Task 165: per-dog exit line (was one shared Collie string for every dog).
      return { responseId: `BARK-EXIT-${DOG_PREFIX[dog]}`, text: BARK_EXIT_LINES[dog], dog };

    case 'emoji_only': {
      const r = pickResponse(data, 'B18', session.usedResponseIds);
      const text = r ? fill(r.template, baseContext(n)) : 'I work better with words. Type what you mean.';
      return { responseId: r?.responseId ?? 'B18', text, dog };
    }

    case 'bark': {
      // The dog's own bark word, count units (generated, not from copy).
      return { responseId: 'BARK', text: barkVolley(dog, res.barkCount ?? 2), dog };
    }

    case 'bark_break': {
      // Round five: the final bark volley, then (after a pause, in the UI) the English break line as a
      // second message. Task 165: the Collie keeps her real bank rows (rotating COL-B19); the other three
      // now speak their OWN break line rather than falling back to hers.
      if (dog !== 'collie') {
        return { responseId: `BARK-BREAK-${DOG_PREFIX[dog]}`, text: barkVolley(dog, res.barkCount ?? 2), dog, followUp: BARK_BREAK_LINES[dog] ?? BARK_BREAK_PLACEHOLDER };
      }
      const r = pickBark(data, 'B19', dog, session.usedResponseIds);
      const followUp = r ? fill(r.template, baseContext(n)) : BARK_BREAK_PLACEHOLDER;
      return { responseId: r?.responseId ?? 'B19', text: barkVolley(dog, res.barkCount ?? 2), dog, followUp };
    }

    case 'bark_ack': {
      // Task 165: each non-Collie dog acknowledges in its own voice; the Collie keeps her bank rows.
      if (dog !== 'collie') {
        return { responseId: `BARK-ACK-${DOG_PREFIX[dog]}`, text: BARK_ACK_LINES[dog] ?? BARK_ACK_PLACEHOLDER, dog };
      }
      const r = pickBark(data, 'B20', dog, session.usedResponseIds);
      const text = r ? fill(r.template, baseContext(n)) : BARK_ACK_PLACEHOLDER;
      return { responseId: r?.responseId ?? 'B20', text, dog };
    }

    case 'transfer': {
      const to = res.transferTo ?? 'labrador';
      const toLabel = DOG_LABEL[to];
      const rule = data.transfers.find((t) => t.from === 'Collie' && t.to === toLabel);
      const out = rule?.exampleLine ?? `This needs the ${toLabel}.`;
      const inType = to === 'labrador' ? 'Labrador transfer-in' : to === 'boxer' ? 'Boxer transfer-in' : 'Terrier transfer-in';
      const incoming = fill(copy(data, inType), baseContext(n));
      const returning = session.previousDogs.includes(to) ? 'And yes, you again. ' : '';
      const text = `${out} ${returning}${incoming}`.replace(/\s{2,}/g, ' ').trim();
      return { responseId: `TR-${to}`, text, dog, transferTo: to };
    }

    case 'converse': {
      const bucket = res.bucket ?? 'B09';
      if (res.mirror) {
        // Task 76: mirror the greeting — echo the greeting word the visitor used, verbatim. This
        // is the ONLY response built from the input; every other answer comes from the library.
        return { responseId: 'B09-MIRROR', text: res.mirror, dog };
      }
      if (bucket === 'B12') {
        // Approved B12 repair line (replaces the old personal-statement pool).
        return { responseId: 'B12-REPAIR', text: 'All right. What would you like to do next: talk about dogs, play something or find a page?', dog };
      }
      const r = pickResponse(data, bucket, session.usedResponseIds);
      const dest = pickDestination(data, session.offeredDestinationIds);
      const text = r ? fill(r.template, baseContext(n, dest?.name ?? '')) : 'Noted.';
      return { responseId: r?.responseId ?? bucket, text, dog, destinationId: dest?.id, url: dest?.url ?? null };
    }

    case 'gibberish': {
      const r = pickResponse(data, 'B14', session.usedResponseIds);
      const dest = pickDestination(data, session.offeredDestinationIds);
      const text = r ? fill(r.template, baseContext(n, dest?.name ?? '')) : 'Did you lean on your keyboard?';
      return { responseId: r?.responseId ?? 'B14', text, dog, destinationId: dest?.id, url: dest?.url ?? null };
    }

    case 'fallback':
      // Terminal catch-all. Approved line, no {{input}}, so raw text is never echoed.
      return { responseId: 'B13-FALLBACK', text: FALLBACK_LINE, dog };

    case 'clarifier': {
      // Bare help-seeking: the approved clarifier line, no raw-input echo.
      const cat = MODERATION.find((m) => m.id === res.moderationId) ?? MODERATION[0];
      return { responseId: cat.id, text: cat.responses[0], dog };
    }

    case 'goodbye': {
      // Task 36: the Collie's approved goodbye constant. Task 145: a dog with its own goodbye line
      // (Copy Components "<Dog> goodbye", e.g. Boxer "see ya", Labrador "byeeeee") speaks it instead;
      // the Collie and any dog without one keep the constant. The greeting stays the shared Task 76
      // mirror by design (Steve): only goodbye is per-dog.
      const ownGoodbye = copy(data, `${DOG_LABEL[dog]} goodbye`);
      return ownGoodbye
        ? { responseId: `${DOG_PREFIX[dog]}-GOODBYE`, text: ownGoodbye, dog }
        : { responseId: 'GOODBYE', text: 'Right. Off you go, then. Come back when you need a dog.', dog };
    }

    case 'dismiss': {
      // Task 165: "go away" and its kin close the chat, but with the dog's own goodbye first, so the
      // dismissal reads as the dog taking the hint, not being ignored. Same per-dog goodbye line as above
      // (Boxer "see ya", Labrador "byeeeee"); the dogs without one get a short "ok" rather than the long
      // constant. closed: true ends the session (engine sets session.closed), so the panel closes after
      // the line is read, exactly like the Boxer cut-off.
      const ownGoodbye = copy(data, `${DOG_LABEL[dog]} goodbye`);
      return { responseId: `${DOG_PREFIX[dog]}-DISMISS`, text: ownGoodbye || 'ok', dog, closed: true };
    }

    case 'out_of_scope':
      // Task 37: the approved out-of-scope line. Held here as a constant, verbatim (NOT yet in the
      // generated Collie Responses, so migrate into the workbook later), like the goodbye line.
      return { responseId: 'OUT-OF-SCOPE', text: 'Real question, wrong dog. I cover breeds, the card game and this website.', dog };

    case 'neutral_refusal': {
      // Task 34: PROTECTED_AFTERCARE decline of a blocked game, sales or comedy request.
      // The approved refusal line (MODERATION), rendered as an ordinary dog line: no
      // support surface, no signpost, and no menu re-advertising the blocked routes.
      const cat = MODERATION.find((m) => m.id === res.moderationId) ?? MODERATION[0];
      return { responseId: cat.id, text: cat.responses[0], dog };
    }

    case 'transfer_request':
      // Visitor asked to switch dogs. Approved repair line.
      return { responseId: 'TRANSFER-REQUEST', text: 'All right. Choose another dog from the pack and I will hand you over.', dog };

    case 'anatomy_redirect': {
      // General anatomy question: approved trusted-adult redirect. No links.
      const cat = MODERATION.find((m) => m.id === res.moderationId) ?? MODERATION[0];
      return { responseId: cat.id, text: cat.responses[0], dog };
    }

    case 'breed_page': {
      // Three parts, as specced: the SHARED factual answer (no dog voice), then a
      // mid-conversation handoff line in the ACTIVE dog's voice (NAV_BREED_HANDOFF
      // family), then the page link. Four breeds' facts are filled but
      // DRAFT-UNVERIFIED (not approved: claims still need checking against the breed
      // pages and a Kennel Club source before merge, see PLACEHOLDERS.md); the other
      // six show a marked placeholder. The handoff line ends with the literal [LINK]
      // token: strip it here, since the UI renders the page link as the action
      // button. The link (url) is real.
      // Task 142 (Rule 1): the ten proof breeds have a curated one-liner; the other 44 pack breeds
      // use their real description from the dog database (never the old placeholder).
      const fact = BREED_FACTS[res.breedSlug ?? ''] ?? data.dogs.find((d) => d.slug === res.breedSlug)?.character?.trim();
      const factText = fact ?? `${res.breedTitle} is one of the pack.`;
      const handoff = navHandoff(data, dog, session);
      const text = handoff ? `${factText} ${handoff}` : factText;
      return { responseId: `BREED-${res.breedSlug}`, text, dog, destinationId: res.breedSlug, url: res.url ?? null };
    }

    case 'breed_hub': {
      // Shared hub line + the active dog's handoff, with the breed index attached as the
      // contextual [LINK]. Task 48: repointed from the /chums stub ("Chums index - hello") to
      // DST006 /know-your-chums, the real breed explorer (the route-map already treats it as
      // the Know Your Chums index; individual dog pages stay at /chums/<slug>).
      const handoff = navHandoff(data, dog, session);
      const text = handoff ? `${BREED_HUB_LINE} ${handoff}` : BREED_HUB_LINE;
      return { responseId: 'BREED-HUB', text, dog, destinationId: 'DST006', url: '/know-your-chums' };
    }

    case 'breed_best': {
      // Shared refuse-to-pick line. No destination exists for "best dog", so there
      // is no link. The NAV_BREED_HANDOFF lines are all link pointers ("...here:"),
      // so appending one with no link would dangle; the line stands alone (it already
      // ends with its own invitation).
      return { responseId: 'BREED-BEST', text: BREED_BEST_LINE, dog };
    }

    case 'breed_choice': {
      // Task 142 (bug 3.2): no more placeholder. The two real breed titles are offered as a plain
      // question ("Border Collie or Border Terrier?"), which is the whole answer.
      const titles = (res.breedOptions ?? []).map((o) => o.title);
      return { responseId: 'BREED-CHOICE', text: `${titles.join(' or ')}?`, dog };
    }

    case 'boxer_cutoff': {
      const l1 = copy(data, 'Boxer ending', 'Cut-off 1');
      const l2 = copy(data, 'Boxer ending', 'Cut-off 2');
      return { responseId: 'BOXER-CUTOFF', text: `${l1} ${l2}`.trim(), dog: 'boxer', transferTo: 'boxer', closed: true };
    }
  }
}
