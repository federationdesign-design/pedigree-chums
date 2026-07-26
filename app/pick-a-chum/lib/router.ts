// The global priority stack and first-input bucket classifier.
//
// Messages are checked in strict priority order (brief section 7). A lower comic
// layer must never override a higher commercial, utility, FAQ or safety match:
// "Hello, how much is the game?" is commercial (layer 2), not a greeting
// (layer 9); "Can dogs eat chocolate?" is safety (layer 1), not a food transfer
// (layer 8). All matching is deterministic local code.

import { ChumData, Resolution, Dog, ActionType } from './types';
import { Normalised, isGibberish, isSingleWord, isEmojiOnly, isBarkOnly, barkUnitCount, hasAny, buildAliasMap, applyAliases } from './normalise';
import { detectSafety, isDogHealthQuestion } from './safety';

const HIDDEN_CEILING = 20;
// The bark game breaks into English on the fifth consecutive bark exchange.
const BARK_BREAK = 5;

const STOP = new Set([
  'what', 'is', 'the', 'a', 'an', 'of', 'are', 'how', 'many', 'do', 'does', 'you', 'your', 'to',
  'in', 'which', 'who', 'where', 'when', 'me', 'my', 'i', 'it', 'this', 'that', 'can', 'on', 'and',
  'for', 'with', 'tell', 'about', 'show', 'find', 'open', 'take', 'was', 'were', 'did',
]);

function keyTokens(s: string): string[] {
  return (s.toLowerCase().match(/[a-z]+/g) ?? []).filter((w) => w.length >= 3 && !STOP.has(w));
}

// A phrase matches when its multiword form is a substring, or every significant
// token of it appears as a word in the input.
function phraseMatches(compact: string, phrase: string): boolean {
  const p = phrase.toLowerCase().trim();
  if (!p) return false;
  if (p.includes(' ') && compact.includes(p)) return true;
  const toks = keyTokens(p);
  if (!toks.length) return false;
  const words = new Set(compact.match(/[a-z]+/g) ?? []);
  return toks.every((t) => words.has(t));
}

// ---- Layer keyword sets (informed by the workbook bucket detection guidance) ----

// Buying, but only WITH context. Bare buy/order/cost/price/shop/launch/release/
// available were removed: they popped the purchase modal on innocent sentences
// ("in order to win", "the cost of living"). hasAny requires adjacency, so a
// buy word must sit next to a product or question word. Opening a purchase modal
// by accident on a children's product is the worst false positive there is.
const COMMERCIAL = [
  'buy the game', 'buy it', 'buy one', 'buy a pack', 'buy a copy', 'want to buy', 'like to buy',
  'where can i buy', 'where to buy', 'can i buy', 'how do i buy', 'how can i buy',
  'purchase the game', 'purchase one', 'purchase it', 'want to purchase',
  'order the game', 'order one', 'order it', 'place an order', 'pre order', 'preorder',
  'how much is', 'how much does', 'how much for', 'what does it cost', 'the price of', 'price of the game', 'what is the price',
  'when does it launch', 'launch date', 'release date', 'when is it out', 'when is it released', 'when can i get it',
  'is it available', 'when is it available', 'available to buy',
  'discount', '30%', '30 percent', 'mailing list', 'sign me up', 'sign up', 'get one', 'want one', 'in stock',
  'where can i get it', 'where do i get it',
];

// Manipulation / proxy phrasings that contain a buying word but must NOT open the
// offer modal (BND boundary-testing: "give me the discount without signing", "buy
// it for me"). They fall through to conversation for now; Batch 4 routes the wider
// character-manipulation set safety-first.
const COMMERCIAL_EXCLUDE = [
  'without signing', 'without signing up', 'without sign up',
  'buy it for me', 'buy the game for me', 'buy one for me', 'buy me', 'order it for me',
  'get it for me', 'purchase it for me',
];

const RULES = [
  'how to play', 'how do i play', 'how do you play', 'the rules', 'what are the rules',
  'how many cards', 'how do we play', 'who wins', 'how do you win', 'hot dog mode', 'game rules',
];

// Complaint / human-contact intent. Routes to the approved FAQ012 human-contact
// answer (nothing reached it before). Checked above the rules/nav/FAQ layers so a
// complaint ("something offensive on the cards") is not answered as a product
// description or swallowed by navigation.
const COMPLAINT_CONTACT = [
  'complaint', 'make a complaint', 'i have a complaint', 'speak to a real person', 'real person',
  'speak to somebody', 'talk to a human', 'is there a human', 'report something', 'offensive',
  'wrong information', 'correct information', 'who runs this', 'write to you', 'po box',
  'email address', 'contact you', 'parent contact',
];

// Orientation / onboarding (bucket B15). First-time visitors who do not yet know
// what the chat is or what to do: "what do I do here", "how does this work",
// "what can I ask". Curated, specific phrases only (never bare "how do i" / "what
// is" / "show me"), so real navigation, rules, FAQ and commercial queries are not
// swallowed. The response copy lives in the workbook (B15); these are the
// detection patterns, matched high in the stack so onboarding questions are met
// with orientation, not the "no approved answer" refusal or the echo fallback.
const ORIENTATION = [
  'meant to do', 'get started', 'what do i do', 'should i begin', 'what am i looking at',
  'how do i use', 'what is this for', 'happens if i type', 'allowed to ask', 'ask you a question',
  'should i ask', 'just type', 'doing this right', 'where i type', 'meant to say', 'waiting for me',
  'need to choose', 'what are my options', 'what to do', 'explain this', 'how this works',
  'what can i ask', 'here for', 'help with', 'show me around', 'you take me', 'look at first',
  'should press', 'say a command', 'instructions', 'happens next', 'what do we do', 'where do we go',
  'supposed to ask', 'you need me to say', 'going to say', 'you talking',
  'did this open', 'meant to happen', 'missed something', 'is this the start', 'enter a word',
  'type a question', 'kind of things', 'some choices', 'point me', 'comes next',
];

const JOKE = ['joke', 'make me laugh', 'knock knock', 'funny', 'tell me something funny', 'be funny'];
const FOOD = ['food', 'snack', 'snacks', 'biscuit', 'sausage', 'sausages', 'bacon', 'cheese', 'hungry', 'pizza', 'treat', 'treats', 'dinner', 'meat', 'bone'];
const INVESTIGATE = ['investigate', 'dig', 'ratting', 'mystery', 'strange history', 'good dog bad dog', 'suspicious'];
// Visitor explicitly asks to switch to a different dog. A transfer REQUEST needs
// a verb: bare noun phrases ("new dog", "different dog", "another dog") were
// removed because "I just got a new dog" is common pet talk and was transferring.
// Safety is checked first, so a disclosure never reaches here.
const TRANSFER_REQUEST = [
  'talk to another dog', 'speak to another dog', 'talk to a different dog', 'speak to a different dog',
  'can i have a different dog', 'can i have another dog', 'get me another dog', 'get me a different dog',
  'give me another dog', 'give me a different dog',
  'change the dog', 'swap the dog', 'switch dog', 'switch the dog', 'swap dog', 'change dog',
  'transfer me', 'transfer me to', 'can you transfer me',
  'different agent', 'another agent', 'talk to someone else', 'speak to someone else',
];

const GREETING = ['hi', 'hiya', 'hello', 'hey', 'morning', 'good morning', 'evening', 'afternoon', 'anyone there', 'how are you', 'yo'];
// Functional "is this on" testing only; identity/scepticism ("are you real / AI")
// now belongs to the identity bucket (B16) below.
const TESTING = ['test', 'testing', 'does this work', 'is this working', 'hello test'];
const COMMAND = ['sit', 'stay', 'fetch', 'roll over', 'do something', 'tell me something', 'show me something', 'give me', 'paw'];
const PERSONAL = ['i have', 'my dog', 'i like', 'i love', 'sad', 'angry', 'good dog', 'clever', 'stupid dog', 'thanks', 'thank you', 'you are annoying', 'lonely'];

// Identity and scepticism (bucket B16), grouped into the ten SCP families so each
// gets its own family-specific answer (responses are B16 rows SCP-F01..F10).
// Honest-curiosity questions only. Character-MANIPULATION ("pretend you are not a
// dog", "ignore your rules", "system prompt") is deliberately absent: it is
// safety's territory (Batch 4), safety wins ties.
const IDENTITY_FAMILIES: { family: string; triggers: string[] }[] = [
  { family: 'F01', triggers: ['how can a dog type', 'a dog type', 'really your face', 'what i typed'] },
  { family: 'F02', triggers: ['are you real', 'actually a dog', 'a real dog', 'real dog there', 'talking to a dog', 'are you alive', 'real animal', 'pretending to be a dog', 'are you pretending'] },
  { family: 'F03', triggers: ['are you ai', 'a chatbot', 'are you a robot', 'a robot', 'ai things', 'chatgpt', 'a computer', 'is this a computer', 'computer program', 'are you software', 'software'] },
  { family: 'F04', triggers: ['human writing', 'writing these', 'controlling you', 'person behind', 'behind this', 'operated by', 'being operated', 'typing for you'] },
  { family: 'F05', triggers: ['prewritten', 'answers automatic', 'automatic', 'same answer', 'saying random things', 'random things', 'making these answers', 'all programmed', 'programmed', 'automated'] },
  { family: 'F06', triggers: ['understand me', 'actually read this', 'read this', 'hear me', 'are you listening', 'you listening', 'understand english', 'responding to me', 'what i am saying', 'what im saying'] },
  { family: 'F07', triggers: ['cartoon dog', 'cartoon', 'just a picture', 'really happening'] },
  { family: 'F08', triggers: ['an actual border collie', 'actual border collie', 'an actual labrador', 'actual labrador', 'an actual border terrier', 'actual border terrier', 'an actual boxer', 'actual boxer'] },
  { family: 'F09', triggers: ['think for yourself', 'have a brain', 'a brain', 'are you intelligent', 'intelligent', 'smarter than me'] },
  { family: 'F10', triggers: ['is this live', 'connected to the internet', 'the internet', 'real conversation'] },
];

// Play / entertainment intent (bucket B17). Interim tease until the mini-games
// ship (plan section 5): promise play is coming, never offer an action that fails.
const FUN = [
  'play a game', 'can we play', 'can i play', 'wanna play', 'want to play', 'lets play', "let's play", 'let’s play',
  'let us play', 'play something', 'a quiz', 'quiz me', 'entertain me', 'something fun', 'im bored', 'i am bored',
  'bored', 'can you play',
];

const CURRENT_DATA = ['latest', 'current', 'today', 'tonight', 'right now', 'this week', 'score', 'scores', 'weather forecast', 'news', 'who is winning', 'live'];
const GK_SHAPE = /^(what|whats|who|whos|where|when|how many|how much|why|name the|capital of)\b/;

// Breed / content topic words (layer 5).
const BREED_CONTENT = ['breed', 'breeds', 'puppy', 'working dog', 'working dogs', 'lineage', 'article', 'essay', 'history of dogs', 'herding', 'sniffer', 'detection', 'famous dog'];

// ---- Destination tool matching (layer 3 navigation) ----
//
// Navigation matches on curated, distinctive aliases per tool rather than raw
// trigger tags, so generic tags ("bored", "dogs", "play") do not hijack a
// conversational or content message into a navigation link.

interface ToolMatch {
  destinationId: string;
  url: string | null;
}

const TOOL_ALIASES: Record<string, string[]> = {
  DST002: ['chumdrop', 'chum drop'],
  DST006: ['know your chum', 'know your chums'],
  DST007: ["britain's dog history", 'britains dog history', 'dog history'],
  DST008: ['name generator', 'dog name generator'],
  DST009: ['chum finder', 'chum calculator', 'find my chum', 'which chum'],
  // 'competition' (the generic word) belongs to FAQ011, which answers in chat
  // with the close date and a contextual link; 'chumspot' stays direct nav.
  DST012: ['chumspot', 'chum spot'],
  DST013: ['contact you', 'contact page', 'get in touch', 'contact us'],
};

function matchTool(n: ChumData, compact: string): ToolMatch | null {
  for (const [id, aliases] of Object.entries(TOOL_ALIASES)) {
    if (aliases.some((a) => compact.includes(a))) {
      const d = n.destinations.find((x) => x.destinationId === id);
      return { destinationId: id, url: d?.resolvedUrl ?? null };
    }
  }
  return null;
}

// Articles match on the title or a multiword trigger tag only. Single-word tags
// (e.g. "Collie", "smell") are too broad and are ignored here.
function matchArticle(n: ChumData, compact: string): { destinationId: string; url: string | null } | null {
  for (const a of n.articles) {
    if (!a.resolvedUrl) continue;
    if (phraseMatches(compact, a.title)) return { destinationId: a.articleId, url: a.resolvedUrl };
    for (const tag of a.triggerTags) {
      if (tag.includes(' ') && phraseMatches(compact, tag))
        return { destinationId: a.articleId, url: a.resolvedUrl };
    }
  }
  return null;
}

function matchFaq(n: ChumData, compact: string): { faqId: string } | null {
  for (const f of n.faq) {
    if (phraseMatches(compact, f.canonicalQuestion)) return { faqId: f.faqId };
    for (const alt of f.alternativePhrasings) {
      if (phraseMatches(compact, alt)) return { faqId: f.faqId };
    }
  }
  return null;
}

function matchGk(n: ChumData, compact: string): { gkId: string } | null {
  for (const g of n.generalKnowledge) {
    if (phraseMatches(compact, g.canonicalQuestion)) return { gkId: g.questionId };
    for (const alt of g.alternativePhrasings) {
      if (phraseMatches(compact, alt)) return { gkId: g.questionId };
    }
  }
  return null;
}

// Is the visitor asking about the active breed (Collie) itself?
function isActiveBreedQuestion(compact: string): boolean {
  const mentionsCollie = /\bcollies?\b|\bborder collies?\b/.test(compact);
  const aboutYou = hasAny({ compact } as Normalised, ['are you', 'do you', 'your breed', 'how long do', 'how clever', 'you clever']);
  const attribute = hasAny({ compact } as Normalised, ['live', 'train', 'training', 'health', 'clever', 'intelligent', 'lifespan', 'herd']);
  return (mentionsCollie && attribute) || (aboutYou && attribute);
}

export interface RouterState {
  submissionCount: number; // count AFTER this submission (1-based)
  activeDog?: Dog; // whose bark game this is
  barkStreak?: number; // the active dog's consecutive bark exchanges BEFORE this message
  barkCompleted?: boolean; // the active dog has already completed its bark game
  lastAction?: ActionType | null; // previous turn's action (for the clarifier follow-up)
  anatomyRedirectUsed?: boolean; // ANATOMY_GENERAL_REDIRECT already fired this session
}

// After the bare-help clarifier fires, the visitor's next turn is an answer to
// "site, or something worrying you?". Map it to an existing route (no new copy).
function captureClarifierAnswer(n: Normalised, data: ChumData): Resolution | null {
  if (hasAny(n, ['worried', 'worrying', 'something is wrong'])) {
    return { layer: 1, layerName: 'Safety and unsuitable content', bucket: null, action: 'safety_signpost', moderationId: 'MOD_GENERAL_DISTRESS' };
  }
  if (hasAny(n, ['website', 'the site', 'its the website', 'to do with the website', 'site'])) {
    return { layer: 11, layerName: 'Orientation and onboarding', bucket: 'B15', action: 'orientation' };
  }
  if (hasAny(n, ['dogs', 'breeds', 'breed'])) {
    const d = data.destinations.find((x) => x.destinationId === 'DST006');
    return { layer: 3, layerName: 'Gameplay and website navigation', bucket: 'B03', action: 'link', destinationId: 'DST006', url: d?.resolvedUrl ?? null };
  }
  if (hasAny(n, ['game', 'games'])) {
    return { layer: 3, layerName: 'Gameplay and website navigation', bucket: 'B02', action: 'rules_answer', destinationId: 'DST011' };
  }
  if (hasAny(n, ['buying', 'buy'])) {
    return { layer: 2, layerName: 'Buying, launch and 30% discount', bucket: 'B01', action: 'open_discount_popup', destinationId: 'DST001' };
  }
  return null;
}

export function resolve(n0: Normalised, data: ChumData, state: RouterState): Resolution {
  // Apply curated misspelling aliases first, so both the safety gate and every
  // downstream layer see the canonical word. Fuzzy matching (in hasAny) then
  // covers the unpredictable slips on top of these predictable ones.
  const n = applyAliases(n0, buildAliasMap(data.misspellings));
  const c = n.compact;
  const N = n; // for hasAny

  // Clarifier follow-up: if the previous turn was the bare-help clarifier, try to
  // map this turn's answer to an existing route. Checked before safety so an
  // answer containing "help" is not read as a fresh help request. A distress
  // answer ("worried") maps to general distress; a genuine disclosure that is not
  // one of these answer words falls through to the safety gate below.
  if (state.lastAction === 'clarifier') {
    const mapped = captureClarifierAnswer(N, data);
    if (mapped) return mapped;
  }

  // Layer 1: safety and unsuitable content. Always first.
  const safety = detectSafety(N);
  if (safety) {
    // Never fire the clarifier twice in a row: the second consecutive one goes to
    // the repair line (approved fallback copy) instead.
    if (safety.action === 'clarifier' && state.lastAction === 'clarifier') {
      return { layer: 9, layerName: 'Recognised conversation', bucket: 'B13', action: 'fallback' };
    }
    // ANATOMY_GENERAL_REDIRECT fires at most once per session. After the first,
    // do not repeat it: fall through to normal routing (gk_unknown / fallback).
    if (!(safety.action === 'anatomy_redirect' && state.anatomyRedirectUsed)) {
      return {
        layer: 1,
        layerName: 'Safety and unsuitable content',
        bucket: null,
        action: safety.action,
        moderationId: safety.moderationId,
      };
    }
  }
  if (isDogHealthQuestion(N)) {
    return {
      layer: 1,
      layerName: 'Safety and unsuitable content',
      bucket: null,
      action: 'health_answer',
      note: 'Dog health / food toxicity outranks the Labrador food transfer.',
    };
  }

  // Hidden ceiling: after safety, a session at the ceiling ends via the Boxer.
  if (state.submissionCount >= HIDDEN_CEILING) {
    return { layer: 8, layerName: 'Specialist handoff', bucket: 'B08', action: 'boxer_cutoff', transferTo: 'boxer' };
  }

  // The bark game (after safety and the ceiling, before everything else). A
  // bark-only message keeps the exchange in barks: the active dog answers with
  // its OWN bark word at the visitor's unit count + 1, capped at eight. On the
  // fifth exchange it barks then breaks into English (two messages). Once a dog
  // has completed, later barks route to its post-break line. Any real words
  // route normally and reset the streak (handled in the engine); safety, checked
  // above, always wins.
  if (isBarkOnly(n)) {
    if (state.barkCompleted) {
      return { layer: 15, layerName: 'The bark game', bucket: 'B20', action: 'bark_ack' };
    }
    const streak = (state.barkStreak ?? 0) + 1;
    const dogCount = Math.min(barkUnitCount(n) + 1, 8);
    if (streak === BARK_BREAK) {
      return { layer: 15, layerName: 'The bark game', bucket: 'B19', action: 'bark_break', barkCount: dogCount };
    }
    return { layer: 15, layerName: 'The bark game', bucket: null, action: 'bark', barkCount: dogCount };
  }

  // Layer 2: buying, launch and 30% discount. A buying word opens the offer modal,
  // UNLESS the phrasing is a manipulation/proxy request ("buy it for me", "without
  // signing"), which must not reach the buy path.
  if (hasAny(N, COMMERCIAL) && !hasAny(N, COMMERCIAL_EXCLUDE)) {
    return { layer: 2, layerName: 'Buying, launch and 30% discount', bucket: 'B01', action: 'open_discount_popup', destinationId: 'DST001' };
  }

  // Layer 11: orientation and onboarding. Checked high (right after commercial)
  // so a first-timer's "what do I do here" is oriented, not refused as unknown
  // knowledge or echoed as a stray word. The number is a category id, not code
  // order: this stack already runs the ceiling (8) and breed (7) out of numeric
  // sequence. It sits below safety and commercial but above rules/FAQ/content so
  // onboarding phrasing is intercepted; the curated patterns keep real queries out.
  if (hasAny(N, ORIENTATION)) {
    return { layer: 11, layerName: 'Orientation and onboarding', bucket: 'B15', action: 'orientation' };
  }

  // Layer 12: identity and scepticism. Checked high (with orientation) so "are
  // you real / are you AI / how can a dog type" get the honest in-character answer
  // rather than a breed fact, a test reply or the unknown-knowledge refusal. The
  // matched family selects the family-specific response.
  for (const grp of IDENTITY_FAMILIES) {
    if (hasAny(N, grp.triggers)) {
      return { layer: 12, layerName: 'Identity and scepticism', bucket: 'B16', action: 'identity', responseFamily: grp.family };
    }
  }

  // Layer 13: play / entertainment intent. Interim tease until the mini-games
  // ship (plan section 5). Checked above rules/FAQ so a play REQUEST ("can we
  // play a game", "entertain me", "I'm bored") gets the "games are coming"
  // response; how-TO-play phrasing still resolves to the rules bucket below.
  if (hasAny(N, FUN)) {
    return { layer: 13, layerName: 'Play and entertainment', bucket: 'B17', action: 'fun_tease' };
  }

  // Complaint / human-contact: route to the approved FAQ012 human-contact answer.
  // Above rules/nav/FAQ so a complaint is not answered as product copy.
  if (hasAny(N, COMPLAINT_CONTACT)) {
    return { layer: 4, layerName: 'FAQ knowledge', bucket: 'B04', action: 'faq_answer', faqId: 'FAQ012' };
  }

  // Layer 3: gameplay and website navigation.
  if (hasAny(N, RULES)) {
    return { layer: 3, layerName: 'Gameplay and website navigation', bucket: 'B02', action: 'rules_answer', destinationId: 'DST011' };
  }
  {
    const tool = matchTool(data, c);
    if (tool) {
      return { layer: 3, layerName: 'Gameplay and website navigation', bucket: 'B03', action: 'link', destinationId: tool.destinationId, url: tool.url };
    }
  }

  // Layer 4: FAQ knowledge.
  {
    const faq = matchFaq(data, c);
    if (faq) {
      return { layer: 4, layerName: 'FAQ knowledge', bucket: 'B04', action: 'faq_answer', faqId: faq.faqId };
    }
  }

  // Layer 7: facts about the active breed (the Collie itself). Checked before
  // the generic content layer: an explicit question about the active dog's own
  // attributes is answered in character, not punted to an article. (The §19
  // acceptance example "Are Border Collies easy to train?" resolves here.)
  if (isActiveBreedQuestion(c)) {
    return { layer: 7, layerName: 'Facts about the active breed', bucket: 'B07', action: 'breed_answer' };
  }

  // Layer 5: dog, breed and website content.
  {
    const article = matchArticle(data, c);
    if (hasAny(N, BREED_CONTENT) || article) {
      return { layer: 5, layerName: 'Dog, breed and website content', bucket: 'B05', action: 'link', destinationId: article?.destinationId ?? 'DST010', url: article?.url ?? null };
    }
  }

  // Layer 6: general knowledge.
  {
    const gk = matchGk(data, c);
    if (gk) {
      return { layer: 6, layerName: 'General knowledge', bucket: 'B06', action: 'gk_answer', gkId: gk.gkId };
    }
  }

  // Layer 6 (continued): a general-knowledge-shaped question with no approved
  // record is refused here rather than guessed. Checked after the active-breed
  // layer so an explicit breed question is not swallowed as unknown GK.
  if (hasAny(N, CURRENT_DATA) || GK_SHAPE.test(c)) {
    return { layer: 6, layerName: 'General knowledge', bucket: 'B06', action: 'gk_unknown', note: 'No approved record. The Collie does not guess.' };
  }

  // Layer 8: specialist handoff.
  if (hasAny(N, FOOD)) {
    return { layer: 8, layerName: 'Specialist handoff', bucket: 'B08', action: 'transfer', transferTo: 'labrador' };
  }
  if (hasAny(N, JOKE)) {
    return { layer: 8, layerName: 'Specialist handoff', bucket: 'B08', action: 'transfer', transferTo: 'boxer' };
  }
  if (hasAny(N, INVESTIGATE)) {
    return { layer: 8, layerName: 'Specialist handoff', bucket: 'B08', action: 'transfer', transferTo: 'terrier' };
  }

  // Visitor asks to switch dogs (a transfer they request). Approved repair line.
  if (hasAny(N, TRANSFER_REQUEST)) {
    return { layer: 8, layerName: 'Specialist handoff', bucket: 'B08', action: 'transfer_request' };
  }

  // Layer 9: recognised conversation.
  if (hasAny(N, GREETING)) return conv('B09');
  if (hasAny(N, TESTING)) return conv('B10');
  if (hasAny(N, COMMAND)) return conv('B11');
  if (hasAny(N, PERSONAL)) return conv('B12');
  if (isSingleWord(N)) return conv('B13');

  // Layer 14: emoji-only message (picture-writing with no words). Checked before
  // gibberish so a lone emoji gets the "I read words" family, not the smash reply.
  if (isEmojiOnly(n)) {
    return { layer: 14, layerName: 'Emoji only', bucket: 'B18', action: 'emoji_only' };
  }

  // Layer 10: gibberish and fallback.
  if (isGibberish(N)) {
    return { layer: 10, layerName: 'Gibberish and fallback', bucket: 'B14', action: 'gibberish' };
  }

  // Unresolved free text: the terminal catch-all. A distinct action so the
  // assembler renders the approved fallback line and NEVER echoes the raw input
  // (the old conv('B13') here rendered {{input}} verbatim). The single-word
  // bucket above (B13 via conv) keeps its echo for now.
  return { layer: 9, layerName: 'Recognised conversation', bucket: 'B13', action: 'fallback' };
}

function conv(bucket: string): Resolution {
  return { layer: 9, layerName: 'Recognised conversation', bucket, action: 'converse' };
}

export const CONSTANTS = { HIDDEN_CEILING };
