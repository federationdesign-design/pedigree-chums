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
  // Task 15 (S12) presentation: a safety message served under the protected support
  // surface carries a shared header and hides the dog name/avatar/character label.
  header?: string; // e.g. 'HELP AND SUPPORT' above a protected safety response
  hideDogIdentity?: boolean; // true: no dog name, avatar or character label above the response
  ariaLabel?: string; // Task 58: screen-reader label for a non-verbal response (the ':(' / ':)' faces). The UI must render this as the accessible name.
  media?: { src: string; alt: string }; // Task 138: a short looping clip served with the line. Local files only -- nothing fetched at runtime, so what a child sees is what was approved.
  linkLabel?: string; // Task 140: an explicit label for the action link when the target is not a destination/article record (the fetch fall-through to a page bio); actionFor prefers this over destinationName.
  gameOutput?: string; // Task 115: the game's monospace board / sheep tiles / drawing, rendered pre-formatted below the line.
}

// Task 58: screen-reader label for the sad-face emoticon (grief ':(' and the loop's ':)'
// close). Approved by Steve. An emoticon has no useful spoken form, so the UI renders this
// as the accessible name instead.
export const SAD_FACE_SR_LABEL = 'the Collie looks sad';
export const SMILE_FACE_SR_LABEL = 'the Collie smiles';

// Task 140/141: birthday is the one clip reply with no workbook row (its line is the existing smile
// face, so it carries the smile accessible name). Held as a code constant, flagged for workbook
// migration in PLACEHOLDERS.md. (car and balls moved into the workbook in Task 141: B64 / B52-MISC-09;
// their clips now attach in the canned case below, keyed by responseId, like cats.)
const MEDIA_REPLIES: Record<string, { text: string; media: { src: string; alt: string }; ariaLabel?: string }> = {
  'BIRTHDAY-01': { text: ':)', media: { src: '/chat-media/birthday.mp4', alt: 'A birthday celebration' }, ariaLabel: SMILE_FACE_SR_LABEL },
};
// Task 141: canned rows that carry a clip. The clip joins the row's copy, it does not replace it.
const CANNED_MEDIA: Record<string, { src: string; alt: string }> = {
  'B21-CATS-01': { src: '/chat-media/cats.mp4', alt: 'A cat looking back' },
  'COL-B52-MISC-09': { src: '/chat-media/ball.mp4', alt: 'A tennis ball' },
  'COL-B64-CAR-01': { src: '/chat-media/car.mp4', alt: 'A dog enjoying a car ride' },
};

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
const BARK_PRESENTATION: Partial<Record<Dog, { word: string; end: string }>> = {
  collie: COLLIE_BARK,
};
const DOG_PREFIX: Record<Dog, string> = { collie: 'COL', labrador: 'LAB', terrier: 'TER', boxer: 'BOX' };

// Task 157 (§3): each dog's own take on its breed, drawn from that breed's fact + character on its chum
// page, in that dog's voice. DRAFT COPY -- reported for owner approval, not final (the same data the
// Boxer's /about misreads came from). The Collie is the dry organiser; the Labrador is food-and-water
// enthusiasm; the Boxer is confidently boisterous; the Terrier is blunt.
const SELF_BREED_LINES: Record<Dog, string> = {
  collie: 'A Border Collie. We hold more world records than any breed going, and yes, I keep count. Bred to work, wired to think. I do not sit still well.',
  labrador: 'Labrador!! best friend in the country, officially it says so. we can even smell when a person is poorly. also i love water. and food. mostly food.',
  boxer: 'a Boxer! named after boxing, on account of standing up and sparring with our paws. i have never actually boxed. i wave. big, soft, brilliant with kids.',
  terrier: 'Border Terrier. bred to go down holes after foxes and rats. small, stubborn, dont back down. dont let the size fool you.',
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

    // Task 78: the two visual tricks. The response text is minimal -- the effect is the image going
    // black / rolling over, driven by the resolution action in the experience. play_dead has no bubble
    // (the black image is the answer); roll_over lands on ':)' after the rotation.
    case 'play_dead':
      return { responseId: 'PLAY-DEAD', text: '', dog };
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
      return { responseId: res.gameLine ?? res.action, text: res.gameText ?? '', gameOutput: res.gameDisplay ?? undefined, dog, ...(res.url ? { url: res.url, destinationId: res.destinationId } : {}), ...(res.gameMedia ? { media: res.gameMedia } : {}), ...(res.gameFollowUp ? { followUp: res.gameFollowUp } : {}) };

    // Task 111: "fetch" hands back a rotating Play/Learn/Discover link (deterministic rotation via the
    // session's offered set), instead of the old B11 command voice. The line comes from the B03 link
    // bank, filled with the destination name.
    case 'random_link': {
      // Task 140: fetch falls through to the page bios once B03's lines are all used this session.
      // B03's lines were written to be thrown and are funnier, so they go first; the bios cover
      // everywhere else and never run short. Concrete routes only (the dynamic breed route has no
      // single link), rotated by usedResponseIds so a bio is not repeated until all have been used.
      // The bio carries its own link label (many bio pages have no destination record).
      const b03pool = data.collieResponses.filter((x) => x.bucketId === 'B03');
      const b03unused = b03pool.filter((x) => !session.usedResponseIds.includes(x.responseId));
      if (b03pool.length > 0 && b03unused.length === 0) {
        const bios = PAGE_BIOS.filter((b) => !b.route.includes('['));
        const unusedBios = bios.filter((b) => !session.usedResponseIds.includes(`FETCH-BIO-${b.route}`));
        const pick = (unusedBios.length ? unusedBios : bios)[0];
        const dest = data.destinations.find((x) => x.resolvedUrl === pick.route);
        return { responseId: `FETCH-BIO-${pick.route}`, text: pick.bio, dog, destinationId: dest?.destinationId, url: pick.route, linkLabel: dest?.name ?? pick.name, followUp: 'play again? just say fetch' };
      }
      // Task 137: the destination follows the LINE, not the other way round.
      // Five of the six B03 templates name a specific place in their text, so
      // choosing a response and a destination independently guaranteed a
      // mismatch -- "The Dog Name Generator is ready" linking to Know Your
      // Chums. Match the named place to its destination; only R01, which uses
      // the token, gets a free pick.
      const r = pickResponse(data, 'B03', session.usedResponseIds);
      const named = r ? data.destinations.find((d) => !!d.resolvedUrl && r.template.includes(d.name)) : null;
      const dest = named
        ? { id: named.destinationId, name: named.name, url: named.resolvedUrl }
        : pickDestination(data, session.offeredDestinationIds);
      const name = dest?.name ?? 'the site';
      const text = r ? fill(r.template, baseContext(n, name)) : `${name} is here.`;
      // Task 135: fetch is a game, so it invites another go. The chat is not
      // minimised on this link (see fetchGame in the experience), so the
      // follow-up still has somewhere to land.
      return { responseId: r?.responseId ?? 'FETCH-LINK', text, dog, destinationId: dest?.id, url: dest?.url ?? null, followUp: 'play again? just say fetch' };
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
      // Task 142: praise -> the wagging-tail clip. The clip is the answer, so there is no line.
      return { responseId: 'GOOD-BOY-01', text: '', dog, media: { src: '/chat-media/goodboy.mp4', alt: 'A dog wagging its tail' } };

    case 'how_are_you': {
      // Task 142: a personal question with no in-world answer -> one of three deflection clips, chosen
      // AT RANDOM and not repeated until all three have been used this session (the B57 fact pattern).
      const clips = [
        { responseId: 'HOWAREYOU-1', src: '/chat-media/howareyou1.mp4', alt: 'A dog typing at a computer' },
        { responseId: 'HOWAREYOU-2', src: '/chat-media/howareyou2.mp4', alt: 'A dog with a weary stare' },
        { responseId: 'HOWAREYOU-3', src: '/chat-media/howareyou3.mp4', alt: 'A corgi looking busy' },
      ];
      // Task 142 (change 2): the three clips convey completely different feelings, so a visitor who
      // sees one gets the SAME one again. Pick one per session and keep it (reuse the one already
      // served this session; otherwise choose at random).
      const prior = clips.find((x) => session.usedResponseIds.includes(x.responseId));
      const pick = prior ?? clips[Math.floor(Math.random() * clips.length)];
      return { responseId: pick.responseId, text: '', dog, media: { src: pick.src, alt: pick.alt } };
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
    case 'games_menu': // Task 123 fix: B45 games menu (GAMELIST-01 question / -02 list); serves res.responseId like canned.
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
      if (res.destinationId) {
        const dest = data.destinations.find((d) => d.destinationId === res.destinationId);
        return { responseId: rid, text, dog, destinationId: res.destinationId, url: res.url ?? dest?.resolvedUrl ?? null, ...(media ? { media } : {}) };
      }
      return { responseId: rid, text, dog, ...(media ? { media } : {}) };
    }

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
      const r = pickResponse(data, 'B02', session.usedResponseIds);
      const text = r ? fill(r.template, baseContext(n)) : RULES.summary;
      return { responseId: r?.responseId ?? 'B02', text, dog, destinationId: 'DST011' };
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
      // Fill render-time tokens in the approved answer (e.g. competition_close_date).
      const answer = fill(f?.resolvedAnswer ?? '', ctx);
      const r = pickResponse(data, 'B04', session.usedResponseIds);
      const wrapper = r ? fill(r.template, ctx) : '';
      const text = [answer, wrapper].filter(Boolean).join(' ').trim() || 'That is a fair question.';
      // Contextual link added by structure, not copy: resolve the FAQ's CTA to a
      // real destination route (e.g. Competition -> /chumspot). No raw URL lives
      // in the answer text.
      const dest = data.destinations.find((d) => d.name === f?.cta || d.destinationId === f?.cta);
      const url = dest?.resolvedUrl ?? (f?.cta && f.cta.startsWith('/') ? f.cta : null);
      const out: Assembled = { responseId: f ? `B04-${f.faqId}` : 'B04', text, dog, url, destinationId: dest?.destinationId };
      // Task 140: the hot-dog clip joins the existing FAQ007 answer (the answer text is unchanged).
      // Suppressed inside a protected state so no new clip surfaces during a safeguarding exchange
      // (FAQ007 is a meaningful topic, so it can serve there; the clip must not).
      if (res.faqId === 'FAQ007' && session.protectedState === null) {
        out.media = { src: '/chat-media/hotdog.mp4', alt: 'Hot dogs' };
      }
      return out;
    }

    case 'price_answer': {
      // Task 49: the in-chat price answer, rendered from FAQ008 but through a distinct action so
      // the S12 safety machine treats it like buying (non-meaningful, blocked in a protected
      // state). Same assembly as faq_answer for FAQ008: the approved answer plus a B04 wrapper.
      const f = data.faq.find((x) => x.faqId === 'FAQ008');
      const ctx = baseContext(n);
      const answer = fill(f?.resolvedAnswer ?? '', ctx);
      const r = pickResponse(data, 'B04', session.usedResponseIds);
      const wrapper = r ? fill(r.template, ctx) : '';
      const text = [answer, wrapper].filter(Boolean).join(' ').trim() || 'That is a fair question.';
      return { responseId: 'B04-FAQ008', text, dog };
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
      return { responseId: 'BARK_GAME_EXIT', text: 'Good barking. That is enough for now. You can ask me about a dog breed or how the card game works.', dog };

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
      // Round five: the final bark volley, then (after a pause, in the UI) the
      // English break line as a second message.
      const r = pickBark(data, 'B19', dog, session.usedResponseIds);
      const followUp = r ? fill(r.template, baseContext(n)) : BARK_BREAK_PLACEHOLDER;
      return { responseId: r?.responseId ?? 'B19', text: barkVolley(dog, res.barkCount ?? 2), dog, followUp };
    }

    case 'bark_ack': {
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
