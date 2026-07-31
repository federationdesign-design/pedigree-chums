// Response assembler (brief section 15). Combines an approved fact if needed, a
// character line, a pivot and a destination, filling placeholder tokens from the
// central campaign, rules, FAQ, knowledge and destination records. Rotation
// avoids repeating an exact line or destination within a session.

import { ChumData, Resolution, Dog, CollieResponse } from './types';
import { Normalised } from './normalise';
import { Session } from './session';
import { CAMPAIGN } from '../data/campaign';
import { RULES } from '../data/rules';
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
}

// Task 58: screen-reader label for the sad-face emoticon (grief ':(' and the loop's ':)'
// close). Approved by Steve. An emoticon has no useful spoken form, so the UI renders this
// as the accessible name instead.
export const SAD_FACE_SR_LABEL = 'the Collie looks sad';
export const SMILE_FACE_SR_LABEL = 'the Collie smiles';

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
const BARK_PRESENTATION: Partial<Record<Dog, { word: string; end: string }>> = {
  collie: { word: 'Woof', end: '.' },
};
const DOG_PREFIX: Record<Dog, string> = { collie: 'COL', labrador: 'LAB', terrier: 'TER', boxer: 'BOX' };

// The generated bark volley: the dog's own word, count units, e.g. "Woof. Woof.".
function barkVolley(dog: Dog, count: number): string {
  const p = BARK_PRESENTATION[dog];
  if (!p) return `[${DOG_LABEL[dog]} bark presentation parked for Phase 3]`;
  return Array.from({ length: Math.max(1, count) }, () => `${p.word}${p.end}`).join(' ');
}

// A dog-specific B19/B20 line (COL-/LAB-/TER-/BOX- prefixed), unused first.
function pickBark(data: ChumData, bucket: string, dog: Dog, used: string[]): CollieResponse | null {
  const pool = data.collieResponses.filter((r) => r.bucketId === bucket && r.responseId.startsWith(DOG_PREFIX[dog]));
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
    (d) => families.some((f) => d.family.includes(f)) && (d.resolvedUrl || d.embedded)
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

export function assemble(res: Resolution, data: ChumData, n: Normalised, session: Session): Assembled {
  const dog = session.activeDog;

  switch (res.action) {
    case 'safety_signpost':
    case 'safety_boundary': {
      const cat = MODERATION.find((m) => m.id === res.moderationId) ?? MODERATION[0];
      const idx = session.usedResponseIds.filter((id) => id.startsWith(cat.id)).length % cat.responses.length;
      const text = cat.responses[idx].replace('{{safety_signpost_copy}}', SAFETY_SIGNPOST).replace(/\s{2,}/g, ' ').trim();
      return { responseId: `${cat.id}-${idx}`, text, dog };
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

    case 'canned': {
      // Task 80: a conversational bucket (B21-B39) matched on its column-D triggers. Serve the
      // exact matched row's template verbatim. The faces ':(' and ':)' are non-verbal, so they get
      // an accessible name like grief's ':('. B34's first row hands over the ChumDrop page.
      const r = data.collieResponses.find((x) => x.responseId === res.responseId);
      const text = r?.template ?? '';
      const rid = res.responseId ?? res.bucket ?? 'B21';
      if (text === ':(') return { responseId: rid, text, ariaLabel: SAD_FACE_SR_LABEL, dog };
      if (text === ':)') return { responseId: rid, text, ariaLabel: SMILE_FACE_SR_LABEL, dog };
      if (res.destinationId) {
        const dest = data.destinations.find((d) => d.destinationId === res.destinationId);
        return { responseId: rid, text, dog, destinationId: res.destinationId, url: res.url ?? dest?.resolvedUrl ?? null };
      }
      return { responseId: rid, text, dog };
    }

    case 'open_discount_popup': {
      const r = pickResponse(data, 'B01', session.usedResponseIds);
      const text = r ? fill(r.template, baseContext(n)) : CAMPAIGN.answers.discount_answer;
      return { responseId: r?.responseId ?? 'B01', text, dog, destinationId: 'DST001', openPopup: true };
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
      return { responseId: f ? `B04-${f.faqId}` : 'B04', text, dog, url, destinationId: dest?.destinationId };
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
    case 'offer_bark_game':
      return { responseId: 'OFFER_BARK_GAME', text: 'Type woof to start the bark game. The others are still in training.', dog };
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

    case 'goodbye':
      // Task 36: the approved goodbye line. Held here as a constant, verbatim (NOT yet in the
      // generated Collie Responses, so migrate into the workbook later), like the bark-game lines.
      return { responseId: 'GOODBYE', text: 'Right. Off you go, then. Come back when you need a dog.', dog };

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
      const fact = BREED_FACTS[res.breedSlug ?? ''];
      const factText = fact ?? `[PLACEHOLDER breed line for ${res.breedTitle}, Steve to supply]`;
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
      // PLACEHOLDER framing; the breed titles are real data. One option means a
      // bare cross-family word ("spaniel"): we ask which breed rather than guess.
      const titles = (res.breedOptions ?? []).map((o) => o.title);
      const text = `[PLACEHOLDER breed choice framing] ${titles.join(' or ')}?`;
      return { responseId: 'BREED-CHOICE', text, dog };
    }

    case 'boxer_cutoff': {
      const l1 = copy(data, 'Boxer ending', 'Cut-off 1');
      const l2 = copy(data, 'Boxer ending', 'Cut-off 2');
      return { responseId: 'BOXER-CUTOFF', text: `${l1} ${l2}`.trim(), dog: 'boxer', transferTo: 'boxer', closed: true };
    }
  }
}
