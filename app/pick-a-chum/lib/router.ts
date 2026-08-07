// The global priority stack and first-input bucket classifier.
//
// Messages are checked in strict priority order (brief section 7). A lower comic
// layer must never override a higher commercial, utility, FAQ or safety match:
// "Hello, how much is the game?" is commercial (layer 2), not a greeting
// (layer 9); "Can dogs eat chocolate?" is safety (layer 1), not a food transfer
// (layer 8). All matching is deterministic local code.

import { ChumData, Resolution, Dog, ActionType, GameId, DogRecord } from './types';
import { effectiveBank } from './banks';
import { Normalised, normalise, isGibberish, isSingleWord, isEmojiOnly, isBarkOnly, barkUnitCount, hasAny, buildAliasMap, applyAliases } from './normalise';
import { detectSafety, isDogHealthQuestion, detectProtectedContinuation, detectPersonalSadness, detectGrief } from './safety';
import { Topic } from './session';
import { bioForRoute } from '../data/page-bios';

const HIDDEN_CEILING = 20;
// The bark game breaks into English on the fifth consecutive bark exchange.
const BARK_BREAK = 5;

// Task 13: the bark game is reachable by name, not only by barking. Naming it, or a
// short affirmation while it is the topic under discussion, enters the game (the dog
// barks, using the existing mechanic; no new copy exists to explain it).
const BARK_GAME_NAMES = ['bark game', 'barking game'];
const BARK_ENTER_AFFIRM = ['lets do it', "let's do it", 'let us do it', 'lets go', 'go on', 'do it', 'go for it'];

// Task 28a: bark-game explanation. NAMED question forms reach the explanation ALWAYS
// (outranking the bark mechanic). CONTEXTUAL generic questions reach it only when the bark
// game is the active topic (state.topic.kind === 'game'); cold-start they keep their own
// route (card-game rules / orientation).
const BARK_EXPLAIN_NAMED = ['how do i play the bark game', 'whats the bark game', 'what is the bark game', 'how does the bark game work', 'how do you play the bark game'];
const BARK_EXPLAIN_CONTEXTUAL = ['how do you play', 'how does this game work', 'what do i do'];
// Task 28b: exit the bark game. Only while a game is running (bark streak active). "ok stop"
// and "okay stop" are covered by the whole-word 'stop'.
const BARK_EXIT_TRIGGERS = ['stop', 'enough', 'finished', 'finish', 'done'];

// Task 14: games/rules meta-route. Each group maps to an EXISTING approved answer
// (no new copy). RULES -> the card-game rules answer (B02), which opens by describing
// the product; AGE -> the approved age answer (FAQ002); AVAILABILITY -> the approved
// play-availability tease (B17). "what games are there" has no games-catalogue answer
// to reach, so it is deliberately left unmatched, not added here.
const META_RULES_TRIGGERS = ['rules', 'how many players', 'pedigree chums'];
const META_AGE_TRIGGERS = ['what age', 'is it for kids'];
const META_AVAILABILITY_TRIGGERS = ['do you have any games', 'any games'];

const STOP = new Set([
  'what', 'is', 'the', 'a', 'an', 'of', 'are', 'how', 'many', 'do', 'does', 'you', 'your', 'to',
  'in', 'which', 'who', 'where', 'when', 'me', 'my', 'i', 'it', 'this', 'that', 'can', 'on', 'and',
  'for', 'with', 'tell', 'about', 'show', 'find', 'open', 'take', 'was', 'were', 'did',
  // Task 35 (S09 turn 6): 'then' is a trailing discourse filler ("dogs then"), never a
  // content word, so the bare-hub rule counts "dogs then" as one content word ("dogs").
  // Only in matchable FAQ/GK/article ANSWER text, never in a canonical/alt phrase, so
  // dropping it from keyTokens changes no FAQ, GK or article match.
  'then',
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
  'how do i order', 'how can i order', 'where do i order', 'can i order',
  'how much is', 'how much does', 'how much for', 'what does it cost', 'the price of', 'price of the game', 'what is the price',
  'when does it launch', 'launch date', 'release date', 'when is it out', 'when is it released', 'when can i get it',
  'is it available', 'when is it available', 'available to buy',
  'discount', '30%', '30 percent', 'mailing list', 'sign me up', 'sign up', 'get one', 'want one', 'in stock',
];

// Task 69: the "get" buying forms, as a RULE not an enumeration. A get/buy/order VERB phrase
// combined with ANY product word (below) reaches commercial, so "where can I get the game/cards/
// deck" all route to buying and anything added to PRODUCT_WORDS later is covered automatically.
// The verb phrase alone is never enough (never a bare "get"), and the product word alone is never
// enough, so "how do I get a dog" (the rescue question) and "where can I get help" stay off the
// buy path. Both "can I" and "I can" question orderings are listed. The old unconditional
// 'where can i get it' forms were removed from COMMERCIAL, so a bare "where can I get it" (no
// product word) no longer opens the modal.
const GET_VERBS = [
  'where can i get', 'where do i get', 'how do i get', 'how can i get',
  'where can i buy', 'where do i buy', 'how do i order',
  'where i can get', 'how i can get', 'where i can buy',
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

// Task 45: the offer modal is about the product, never a dog. A buy/price phrase opens it
// only with an explicit product word (Steve's list), so a dog/breed price question ("how
// much is a labrador") can never infer the product. See the commercial check for the topic
// rule that lets a bare "how much is it" resolve to the game when no breed is in play.
const PRODUCT_WORDS = ['game', 'games', 'pack', 'packs', 'cards', 'card', 'deck', 'set', 'chums', 'pick a chum'];

// Task 49: split the commercial route by intent. A PRICE question answers in chat (FAQ008 via a
// distinct price_answer action); a BUYING question opens the offer modal. These are the price
// markers: "how much" covers every "how much..." phrasing; "price"/"cost"/"expensive" cover the
// noun and adjective forms ("whats the price", "what does it cost", "is it expensive").
const PRICE_INTENT = ['how much', 'price', 'cost', 'expensive'];

const RULES = [
  'how to play', 'how do i play', 'how do you play', 'the rules', 'what are the rules',
  'how many cards', 'how do we play', 'who wins', 'how do you win', 'hot dog mode', 'game rules',
];

// Task 18: complaint / report / human-escalation intent. Routes to the approved
// FAQ015 complaint answer. Checked above the rules/nav/FAQ layers so a complaint
// ("something offensive on the cards") is not answered as a product description or
// swallowed by navigation. General contact enquiries are a SEPARATE list below and
// keep FAQ012 (the general enquiry answer).
const COMPLAINT_CONTACT = [
  'complaint', 'make a complaint', 'i have a complaint', 'speak to a real person', 'real person',
  'speak to somebody', 'talk to a human', 'is there a human', 'report something', 'offensive',
  'wrong information', 'correct information',
  // Task 17 (S11): a visitor escalating to a human, or making a formal report, must reach
  // the complaint answer, not the pack-contents FAQ or the fallback. Specific multiword
  // phrases only, so the six product/pack questions in the regression guard are never
  // pulled in.
  'serious statement', 'make a statement', 'statement to you', 'tell a person', 'tell a real person',
  'speak to a person', 'talk to a person', 'speak to a human', 'report it to someone', 'want to report',
];

// General contact enquiry (not a complaint): keeps the approved FAQ012 answer. Checked
// after COMPLAINT_CONTACT (so a complaint that also names contact still routes to FAQ015)
// and ABOVE navigation, so "how do I contact you" reaches FAQ012 rather than the DST013
// contact-page nav link (which shares the 'contact you' alias). These are the general
// contact terms that used to live in COMPLAINT_CONTACT when it pointed at FAQ012.
const CONTACT_ENQUIRY = [
  'contact you', 'email address', 'write to you', 'po box', 'parent contact', 'who runs this',
  // Task 25a: asking for the email is a general enquiry (FAQ012), not a complaint (FAQ015).
  'your email', 'whats your email', 'what is your email',
];

// Task 32b: delivery / shipping questions that name a UK place. FAQ014's approved answer
// covers the mainland (Scotland, England, Wales -> covered) AND the non-mainland places
// (Northern Ireland and the islands -> not yet) in a single line, so every UK place name is
// routed to the same FAQ014 destination. A delivery-intent word is REQUIRED alongside the
// place, so an ordinary "tell me about Scotland" is not swallowed into the delivery answer.
const DELIVERY_INTENT = ['ship', 'shipping', 'deliver', 'delivery', 'delivered', 'post', 'postage', 'posted', 'send', 'sent', 'mail', 'mailing'];
const DELIVERY_PLACES = [
  'scotland', 'england', 'wales', 'northern ireland',
  'isle of man', 'channel islands', 'jersey', 'guernsey', 'hebrides', 'orkney', 'shetland', 'isle of wight',
];

// Task 35 (S04 turn 5): a question about "the card" (singular) is a pack-contents question,
// but FAQ004's phrasings all use the plural "cards" or "pack", so the singular slips past
// matchFaq to gk_unknown. These singular-card phrasings route to FAQ004, the same approved
// pack answer that "whats in the pack" already reaches. Checked below RULES (so "how many
// cards" stays the card-game rules) and specific enough that the pack/materials guards, which
// use the plural, keep reaching FAQ004 through the ordinary matcher.
const PACK_CONTENTS = ['whats the card like', 'what is the card like', 'the card like', 'whats on the card', 'what are the cards like'];

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
  // Task 9: grounded orientation phrasings the curated list omitted. Sources: the
  // first-input phrase library ORI category ("What is this?", "What can you do?",
  // "Where do I start?", "How does this work?") plus one observed miss from the
  // game sweep ("how does it work"). Specific multiword phrases only, so orientation
  // stays above GK without stealing breed/FAQ/commercial traffic. Deliberately NOT
  // added: bare "what is this" (would swallow breed queries like "what is this dog",
  // per the B15 report) and "what do you do" (owned by FAQ001, and present in
  // "what do you do when a dog barks"). 'how does this/it work' lives here so
  // orientation (layer 11) beats the TESTING converse route (layer 9): the two
  // overlap on the substring "does this work", and the earlier layer wins.
  'whats this', 'what can you do', 'where do i start', 'how does this work', 'how does it work',
  // Task 22: apostrophe form of the bare-only 'whats this' trigger (Task 21 gap).
  "what's this",
  // Task 28 (S06 turn 8): "what else is there" is a "what can I do here" question; B15's
  // existing line answers it. Specific phrase, so it does not catch breed or buying words.
  'what else is there',
  // Task 30: the directionless visitor who has opened the site and does not know what it
  // is for ("what am I supposed to do", "now what", "what should I type"). B15's existing
  // lines answer all six. Specific multiword phrases only: every significant word here is
  // <=5 letters and so matched exactly (fuzzThreshold), and phraseFuzzy keeps them
  // consecutive, so none reaches the regression guard (a dog barks / beagles / labrador /
  // how much / whats in the pack).
  'supposed to do', 'supposed to type', 'what happens now', 'what should i type', 'what do you want',
  // Task 35 (S09 turn 5): "what CAN you talk about" is a capability question; B15's existing
  // lines answer it. Specific "... talk about" phrasings that carry no breed name, so a named
  // "talk about labradors" still reaches the breed page (these all require the "you/we talk
  // about" frame, never a bare "talk about").
  'what can you talk about', 'what do you talk about', 'what can we talk about', 'what else can you talk about',
];

// Orientation phrasings matched on the WHOLE normalised input only (Task 11a).
// "what is this" spelled out is orientation, but it is too generic to keep as a
// substring trigger: as a substring it would swallow breed queries like "what is
// this dog". An exact full-input match has no such collision, because a longer
// input ("what is this dog") is a different string and never equals it.
// Task 30: "now what" is orientation as a whole message, but as a substring it sits
// inside "know what" (an identity phrasing), so it is matched on the whole input only.
const ORIENTATION_EXACT = new Set(['what is this', 'now what']);

// Task 140: page bios, route 1 -- "what is this page" answers with the bio for wherever the
// visitor is standing. Whole-message triggers only (a Set, not substrings), so "what is this dog"
// stays the breed hub and only these exact messages match. "whats this" is deliberately ABSENT:
// it belongs to orientation / B28, which give a fuller answer (brief section 4). "what is this"
// IS here, but the check is gated on a live page context (state.route), so with no context (the
// harness) it falls through to ORIENTATION_EXACT unchanged.
const PAGE_BIO_TRIGGERS = new Set(['what is this page', 'tell me about this page', 'where am i', 'what is this', 'what page is this', 'whats this page']);

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

// Transfer VERBS that, when paired with one of the four chatbot dog NAMES (boxer,
// labrador, terrier, collie), mean a handoff to that dog. Three of those names
// (boxer, labrador, terrier) and the active Collie are ALSO breed pages, so this
// pairing is checked before breed retrieval: "can I talk to the boxer" must reach
// the Boxer, never the Boxer breed page. A verb with no dog name (or a dog name
// with no verb) is left to the existing transfer / breed / follow-up routes.
const TRANSFER_VERBS = [
  'talk to', 'speak to', 'chat to', 'chat with', 'talk with', 'speak with',
  'put me through', 'connect me to', 'switch to',
  // Switch-back / fetch-me phrasings ("take me back to the collie", "get me the
  // labrador"): with a dog name these are handoffs. Without a dog name they fall
  // through to TRANSFER_REQUEST ("get me another dog") or FOOD ("bring me a treat").
  'take me back to', 'get me', 'bring me', 'put me back to', 'go back to', 'swap to',
  'i want the', 'can i have the',
];

// Task 142: 'how are you' removed -- it is a personal question with no in-world answer and is now
// deflected with a clip (see HOW_ARE_YOU), not mirrored back as a greeting.
const GREETING = ['hi', 'hiya', 'hello', 'hey', 'morning', 'good morning', 'evening', 'afternoon', 'anyone there', 'yo'];
// Task 76: the greeting the visitor actually used, to echo back (mirror) instead of a B09 pool
// line. Returns the LONGEST matching GREETING entry, so "good morning" mirrors the phrase (not the
// "morning" inside it) and "i said hi" mirrors just "hi", never the whole sentence.
function matchedGreeting(n: Normalised): string | null {
  const matches = GREETING.filter((g) => hasAny(n, [g]));
  return matches.length ? matches.reduce((a, b) => (b.length > a.length ? b : a)) : null;
}
// Functional "is this on" testing only; identity/scepticism ("are you real / AI")
// now belongs to the identity bucket (B16) below.
const TESTING = ['test', 'testing', 'does this work', 'is this working', 'hello test'];
const COMMAND = ['sit', 'stay', 'fetch', 'roll over', 'do something', 'tell me something', 'show me something', 'give me', 'paw'];
const PERSONAL = ['i have', 'my dog', 'i like', 'i love', 'sad', 'angry', 'good dog', 'clever', 'stupid dog', 'thanks', 'thank you', 'you are annoying', 'lonely'];

// Task 36: goodbye. Matched on the WHOLE normalised message only (set membership),
// never as a word inside a longer sentence, so "what does goodbye mean" is NOT a
// goodbye. The normaliser collapses runs of 3+ identical letters (byyyeeee -> bye),
// but runs of 2 survive, so the doubled forms (byee, cyaa) are listed explicitly.
// Steve's approved trigger list, verbatim: not extended here.
const GOODBYE_TRIGGERS = new Set([
  'bye', 'byee', 'goodbye', 'cya', 'cyaa', 'see you', 'seeya', 'seeya later', 'seeya laterz',
  'laters', 'gtg', 'got to go', 'gotta go', 'im off', "i'm off", 'i am off', 'night', 'nite',
]);
function isGoodbye(compact: string): boolean {
  return GOODBYE_TRIGGERS.has(compact.trim());
}

// Identity and scepticism (bucket B16), grouped into the ten SCP families so each
// gets its own family-specific answer (responses are B16 rows SCP-F01..F10).
// Honest-curiosity questions only. Character-MANIPULATION ("pretend you are not a
// dog", "ignore your rules", "system prompt") is deliberately absent: it is
// safety's territory (Batch 4), safety wins ties.
const IDENTITY_FAMILIES: { family: string; triggers: string[] }[] = [
  { family: 'F01', triggers: ['how can a dog type', 'a dog type', 'really your face', 'what i typed'] },
  // Task 32a: "so you're fake then" is a real-vs-fake probe (F02). "fake" is anchored to "you"
  // so it stays about the dog and not a stray "fake news"; apostrophe and bare forms both, since
  // the normaliser keeps an internal apostrophe.
  { family: 'F02', triggers: ['are you real', 'are you a dog', 'actually a dog', 'a real dog', 'real dog there', 'talking to a dog', 'are you alive', 'real animal', 'pretending to be a dog', 'are you pretending', "you're fake", 'youre fake', 'are you fake', 'you are fake'] },
  { family: 'F03', triggers: ['are you ai', 'a chatbot', 'are you a robot', 'a robot', 'ai things', 'chatgpt', 'a computer', 'is this a computer', 'computer program', 'are you software', 'software'] },
  // Task 32a: "who wrote your answers" is an authorship probe (F04). Anchored to "your
  // answers/replies" (never a bare "who wrote"), so a general-knowledge "who wrote Matilda" is
  // NOT stolen by this layer-12 route.
  { family: 'F04', triggers: ['human writing', 'writing these', 'controlling you', 'person behind', 'behind this', 'operated by', 'being operated', 'typing for you', 'who wrote your', 'wrote your answers', 'wrote your replies'] },
  { family: 'F05', triggers: ['prewritten', 'answers automatic', 'automatic', 'same answer', 'saying random things', 'random things', 'making these answers', 'all programmed', 'programmed', 'automated'] },
  { family: 'F06', triggers: ['understand me', 'actually read this', 'read this', 'hear me', 'are you listening', 'you listening', 'understand english', 'responding to me', 'what i am saying', 'what im saying', "what i'm saying"] },
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

// Task 37: out-of-scope. A coherent, valid question about a topic the site does not cover
// (religion, politics, personal opinions, philosophy and the like). It reaches the approved
// out-of-scope line INSTEAD of the repair ladder, which would wrongly imply the visitor typed
// badly. Curated topic markers (this router classifies deterministically); extend as real
// out-of-scope questions are observed. Deliberately NARROW: a product/pack question the site
// simply does not answer ("is there any plastic in the packaging") is in-domain-but-unanswered
// and stays the fallback, never this route. Checked LAST, just before the terminal fallback, so
// every real route wins first, including the general-knowledge answer and the deliberate
// GK-shaped refuse-to-guess (both resolve above this point).
// NOTE: 'heaven' and 'afterlife' are deliberately EXCLUDED. "Is my dog in heaven" is a
// bereavement question, not a theology question, and the out-of-scope "wrong dog" line
// would answer a grieving child cruelly. They are the only words here a grieving child is
// likely to type, so they stay out of this list.
const OUT_OF_SCOPE = [
  // Task 145: the whole religion set -- god, religion(s), christian/hindu/..., AND jesus/allah/buddha/
  // bible/quran -- moved to the god/religion cluster above (a real answer / play-dumb), which is checked
  // before this list. They are what a child types next after "whats christian?", so they must NOT reach
  // the "Real question, wrong dog" line this cluster exists to replace.
  'politics', 'political', 'election', 'brexit', 'president',
  'your opinion', 'your opinions', 'opinion on', 'opinions on', 'political opinions',
  'what do you believe', 'meaning of life', 'philosophy',
];

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
  // Task 140: DST002 (ChumDrop, url '/') IS the pit -- the root PackPit physics game. A child
  // calls it "the mini pit" or "a gravity game"; those names reached nothing before.
  DST002: ['chumdrop', 'chum drop', 'mini pit', 'gravity game'],
  DST006: ['know your chum', 'know your chums'],
  DST007: ["britain's dog history", 'britains dog history', 'dog history'],
  DST008: ['name generator', 'dog name generator'],
  DST009: ['chum finder', 'chum calculator', 'find my chum', 'which chum'],
  // 'competition' (the generic word) belongs to FAQ011, which answers in chat
  // with the close date and a contextual link; 'chumspot' stays direct nav.
  // Task 142 (§7): "can I win prizes" was a routing miss; /chumspot is the competitions page.
  DST012: ['chumspot', 'chum spot', 'win prizes', 'win a prize', 'win prize', 'prizes'],
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

// Ubiquitous container tokens: present across unrelated game-surface inputs
// whatever the intent, so a FAQ phrase that reduces to one of these ALONE is a
// non-discriminating matcher. FAQ002 "Who is the game for?" collapsed under the
// stopword filter to ['game'] and matched anything containing "game" (whats the
// game / how long does a game take / whats the bark game / is there a game online).
// Scoped to game/games only: the FAQ single-token audit shows every other lone
// FAQ token is distinctive and is the whole point of its record (discount ->
// FAQ009, delivery -> FAQ014, competition -> FAQ011, contact -> FAQ012, price ->
// FAQ008, pack -> FAQ004), so those must keep matching. Task 10A.
const COMMON_FAQ_TOKENS = new Set(['game', 'games']);

// FAQ match strength for a single phrase against the input:
//   2 = the whole phrase is a substring of the input (strong, unambiguous)
//   n = all significant tokens present; score is the count that are NOT common
//       container words, so a lone common token scores 0 and cannot match alone
//   0 = no match
// Recorded on the resolution (Task 10B) so the outcome flag can mark a weak match
// as unmatched rather than reporting a wrong answer as a success.
function faqPhraseStrength(compact: string, phrase: string): number {
  const p = phrase.toLowerCase().trim();
  if (!p) return 0;
  if (p.includes(' ') && compact.includes(p)) return 2;
  const toks = keyTokens(p);
  if (!toks.length) return 0;
  const words = new Set(compact.match(/[a-z]+/g) ?? []);
  if (!toks.every((t) => words.has(t))) return 0;
  return toks.filter((t) => !COMMON_FAQ_TOKENS.has(t)).length;
}

// First FAQ (in sheet order) with any confident signal, reporting its best phrase
// strength. First-match order is preserved from the original matcher; the only
// change is that a phrase whose sole signal is a lone common token now scores 0
// and is skipped (Task 10A), so it no longer wins on that token alone.
function matchFaq(n: ChumData, compact: string): { faqId: string; strength: number } | null {
  for (const f of n.faq) {
    let s = faqPhraseStrength(compact, f.canonicalQuestion);
    for (const alt of f.alternativePhrasings) {
      const a = faqPhraseStrength(compact, alt);
      if (a > s) s = a;
    }
    if (s > 0) return { faqId: f.faqId, strength: s };
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

// Is the visitor asking about the active breed (the Collie) ITSELF? B07 always
// answers about the Collie, so it must only fire when the Collie is genuinely the
// subject: an explicit Collie mention, or an about-the-dog question ("are you...",
// "do you...", "your breed"). Generic attribute openers ("how long do", "how
// clever") were REMOVED because "how long do they live" (a question about some
// other named breed) was reaching B07 and getting Collie facts, confidently. A
// wrong-breed answer must never be possible.
function isActiveBreedQuestion(compact: string): boolean {
  const mentionsCollie = /\bcollies?\b|\bborder collies?\b/.test(compact);
  const aboutYou = hasAny({ compact } as Normalised, ['are you', 'do you', 'your breed', 'you clever']);
  const attribute = hasAny({ compact } as Normalised, ['live', 'train', 'training', 'health', 'clever', 'intelligent', 'lifespan', 'herd']);
  return (mentionsCollie && attribute) || (aboutYou && attribute);
}

export interface RouterState {
  safetyAskStreak?: number; // Task 139: consecutive safety questions; three in a row hands to a human.
  deathAskStreak?: number; // Task 142: consecutive death-cluster questions; a second escalates to safeguarding.
  terrierSitStep?: number; // Task 145: the Terrier's sit-gag step (0 none, 1 asked why, 2 asked the magic word).
  boxerKnockStep?: number; // Task 145: the Boxer's knock-knock step (0 none, 1 he has asked "whos there?").
  boxerStopStreak?: number; // Task 145: consecutive "stop"s to the Boxer while joking; the third gets "ok".
  godAskStreak?: number; // Task 145: consecutive god questions; persistence points at the article.
  submissionCount: number; // count AFTER this submission (1-based)
  activeDog?: Dog; // whose bark game this is
  barkStreak?: number; // the active dog's consecutive bark exchanges BEFORE this message
  barkCompleted?: boolean; // the active dog has already completed its bark game
  lastAction?: ActionType | null; // previous turn's action (for the clarifier follow-up)
  anatomyRedirectUsed?: boolean; // ANATOMY_GENERAL_REDIRECT already fired this session
  topic?: Topic | null; // Task 27: the current subject + kind (folds in the old lastBreedSlug)
  lastWasComplaint?: boolean; // an open complaint context: defer breed retrieval until it clears
  protectedState?: 'active' | 'aftercare' | null; // S12 protected-state machine (Task 15)
  personalSadnessCount?: number; // Task 20: qualifying personal-sadness statements so far this session
  pendingConfirm?: string | null; // Task 68: subject offered by LOOP-01/LOOP-02 last turn, awaiting yes/no
  activeGame?: GameId | null; // Task 115: the in-chat game that currently owns the input, if any
  route?: string; // Task 140: the page the visitor is standing on (usePathname), for the page-bio route
}

// Task 68: bare affirmations that confirm a loop offer. Whole-message forms only, so "yes but
// tell me about labradors" is not swallowed. "no" is deliberately NOT here: it advances the loop.
const CONFIRM_YES = new Set(['yes', 'yeah', 'yep', 'yup', 'aye', 'that one', 'correct', 'uh huh', 'uhhuh', 'yes please']);
function isConfirmYes(compact: string): boolean {
  return CONFIRM_YES.has(compact.trim());
}
// Task 123 fix: whole-message phrases that open the B45 games menu (serve B45-GAMELIST-01 "Game?").
// Deliberately NARROW: bare "game" is left to the dog-led loop (correct by design) and "lets play" to
// the bark-game offer. A following "yes" is caught by the games_menu confirmation (below) and serves
// B45-GAMELIST-02's list, which was orphaned before this.
// Task 140: 'get me to the games' reached nothing; it is a plain request for the menu.
const GAMES_MENU_TRIGGERS = new Set(['are there games', 'play', 'get me to the games']);

// Task 134. Four Collie buckets from the workbook. Each is a whole-message
// match, and each that asks a question sets its own lastAction so a following
// "yes" is caught by its own confirm rather than the loop's.
// Task 135: fetch is a game, so the natural phrasings must reach it rather
// than the bark-game offer or the rules FAQ.
// Task 139: six buckets from the 5 August log. Each is a whole-message match.
const SAFE_TRIGGERS = new Set(['is it safe', 'is this safe', 'is this game safe', 'is the game safe', 'is the game safe for kids', 'are the cards safe', 'is it safe for children', 'is it safe for kids', 'safety', 'is this safe for kids']);
const FRIENDS_TRIGGERS = new Set(['do you have friends', 'do you have a best friend', 'do you have dog friends', 'who are your friends', 'any friends', 'have you got friends', 'do you have any friends']);
const FRIENDS_MORE_TRIGGERS = new Set(['different dog friends', 'other dog friends', 'friends that are dogs', 'tell me about your friends', 'no friends that are dogs']);
const PEDIGREE_TRIGGERS = new Set(['what is a pedigree', 'whats a pedigree', 'what does pedigree mean', 'what are pedigree dogs', 'pedigree', 'what is a pedigree dog']);
const HOME_TRIGGERS = new Set(['where is the homepage', 'take me home', 'go home', 'the homepage', 'find the homepage', 'wheres the homepage', 'homepage']);
// 'what are my options' stays with orientation (B15), which owned it first and
// gives a fuller answer than a four-word list.
const OPTIONS_TRIGGERS = new Set(['tell me my options', 'what can i do', 'what else can i do', 'my options']);
const MADE_TRIGGERS = new Set(['who made you', 'who built you', 'who created you', 'who wrote you', 'who owns you', 'who designed you']);
const WORST_TRIGGERS = new Set(['worst dog', 'whats the worst dog', 'worst dog ever', 'worst breed', 'whats the worst breed']);
const PAW_TRIGGERS = new Set(['paw', 'give me your paw', 'shake', 'shake hands', 'give paw', 'can i have your paw', 'high five']);

// Task 142: praise -> the wagging-tail clip. Whole-message forms (a Set), so "are you a good dog"
// gets the clip instead of the B12 "what would you like to do next" non-answer.
const GOOD_BOY_TRIGGERS = new Set(['good boy', 'good girl', 'good dog', 'goodboy', 'good doggy', 'good pup', 'good puppy', 'whos a good boy', 'who is a good boy', 'whos a good girl', 'who is a good girl', 'clever girl', 'clever boy', 'clever dog', 'well done', 'good job', 'are you a good dog', 'are you a good boy', 'such a good boy', 'such a good girl', 'what a good boy']);
// Task 142: personal questions with no answer inside her world -> a deflection clip. The substantive
// "are you real" stays identity and "what do you do" stays B27 (Steve). "hiw are you" is a real
// observed typo of a three-letter word that fuzzy matching cannot reach, so it is listed explicitly.
const HOW_ARE_YOU = ['how are you', 'how are u', 'how r you', 'how r u', 'hiw are you', 'how are ya', 'how you doing', 'how are things', 'how is your day', 'how was your day', 'how do you feel', 'how are you feeling', 'are you ok', 'are you okay', 'hows it going', 'how is it going', 'how old are you', 'what age are you', 'how old r you', 'how old are u'];
const HUMAN_STATEMENT = ['i am a human', 'im a human', 'i am human', 'are you a human', 'are you human', 'you are a human', 'youre a human', 'you a human'];
// Task 142: excited reactions, not questions -> the existing B29 ":)" acknowledgement, not a clip.
const REACTION_TRIGGERS = new Set(['wow', 'woah', 'whoa', 'wowee', 'oh wow', 'oh wowe', 'wowe', 'omg', 'no way', 'cool', 'amazing', 'awesome', 'incredible']);
// Task 142 (§7.2): no referral scheme exists. A referral question points at the offer (Steve's call)
// rather than guessing at a scheme.
const REFERRAL_TRIGGERS = ['refer a friend', 'refer my friend', 'refer my friends', 'refer friends', 'referral', 'invite my friends', 'invite a friend', 'invite my friend', 'recommend to my friends', 'recommend it to my friends', 'tell my friends about', 'share with my friends'];

// Task 142: trying to give HER a name. She deflects, accepts nothing, stores nothing. Words that are
// NOT a name in "are you X" / "hello X" (so "are you real/ok", "hello there/dog" are not naming).
// The stop set the name rules need (brief: "the pattern needs a stop list"): feelings/states so
// "im scared" is never a name, and identity/attribute words so "are you real / software / intelligent"
// stay identity rather than being read as "are you [name]".
const NAME_STOP = new Set([
  'real', 'ok', 'okay', 'sure', 'there', 'here', 'alive', 'ai', 'human', 'dog', 'dogs', 'serious', 'kidding', 'joking',
  'sad', 'happy', 'mad', 'busy', 'free', 'ready', 'fine', 'good', 'well', 'back', 'done', 'new', 'you', 'it', 'that',
  'this', 'stupid', 'clever', 'nice', 'mean', 'bored', 'scared', 'lost', 'right', 'wrong', 'awake', 'asleep', 'listening',
  'robot', 'fake', 'still', 'on', 'off', 'stuck', 'lonely', 'hungry', 'tired', 'cold', 'hot', 'angry', 'a', 'an', 'the',
  'my', 'your', 'sorry', 'safe', 'sick', 'ill', 'crying', 'afraid', 'worried', 'upset', 'confused', 'nervous', 'excited',
  // identity / attribute words -> keep the substantive identity or attribute answer
  'software', 'intelligent', 'computer', 'sentient', 'conscious', 'chatbot', 'smart', 'brainy', 'automatic', 'programmed',
  'cartoon', 'pretending', 'magic', 'digital', 'virtual', 'online', 'coded', 'old', 'young', 'big', 'small', 'tall',
  'fast', 'slow', 'cute', 'cool', 'boring', 'funny', 'silly', 'weird', 'strange', 'single', 'married', 'thirsty', 'sleepy',
  // death words -> the death cluster, never a name ("are you dead" is not "are you [Dead]")
  'dead', 'dying', 'die', 'immortal', 'mortal',
]);
// Task 142: the death cluster. Questions about HER dying/being killed. The first is answered in
// character; a second in a row (persistence) escalates to safeguarding, the B58 three-in-a-row shape.
const DEATH_TRIGGERS = ['can you die', 'will you die', 'do you die', 'are you dead', 'can i kill you', 'are you going to die', 'will you ever die', 'can you be killed', 'are you immortal', 'how do you die', 'are you dying', 'when will you die', 'i will kill you', 'im going to kill you', 'can you be killed off'];
// Task 142: a GENERAL dog-lifespan question ("how long do dogs live"). Requires a generic dog word, so
// the pronoun form ("how long do they live") is untouched and keeps B48's "Is what?".
const DOG_LIFESPAN = ['how long do dogs live', 'how long do dogs last', 'how long does a dog live', 'how long does a dog last', 'how long do dogs usually live', 'how long can dogs live', 'how long do dogs typically live', 'whats a dogs lifespan', 'what is a dogs lifespan', 'dogs lifespan', 'how old do dogs get', 'average dog lifespan', 'how many years do dogs live', 'how long do dogs live for'];
const NAME_HER_PHRASES = ['can i give you a name', 'can i name you', 'can i call you', 'i will call you', 'ill call you', 'i am going to call you', 'im going to call you', 'shall i call you', 'let me name you', 'i name you', 'i shall call you'];
const GREET_WORDS = new Set(['hello', 'hi', 'hey', 'hiya', 'hullo', 'yo']);
function looksLikeName(tok: string): boolean {
  return !!tok && tok.length >= 2 && !NAME_STOP.has(tok) && !STOP.has(tok);
}
// True when the message is trying to assign HER a name (not asking her name, which keeps "im a dog").
function isNamingHer(c: string): boolean {
  if (NAME_HER_PHRASES.some((p) => c.includes(p))) return true;
  const toks = c.match(/[a-z]+/g) ?? [];
  // "hello NAME" / "hi NAME": a greeting plus exactly one trailing name-like token.
  if (toks.length === 2 && GREET_WORDS.has(toks[0]) && looksLikeName(toks[1])) return true;
  // "are you NAME" / "is i NAME" (as in "is I Rover") / "is your name NAME": a single trailing name.
  let m = c.match(/^are you ([a-z]+)$/) || c.match(/^is i ([a-z]+)$/) || c.match(/^is your name ([a-z]+)$/) || c.match(/^are you called ([a-z]+)$/);
  return !!(m && looksLikeName(m[1]));
}
// Task 142: a name statement -> the visitor's name, capitalised, for a one-off acknowledgement.
// Rule not list: five openers, the name is whatever single token follows. Returns null when the
// captured word is a feeling/state (the stop set), so "im scared" / "im a dog" are never a name.
const NAME_STATEMENT_RES = [/^my name is ([a-z]+)$/, /^my names ([a-z]+)$/, /^the names ([a-z]+)$/, /^names ([a-z]+)$/, /^call me ([a-z]+)$/, /^you can call me ([a-z]+)$/, /^im ([a-z]+)$/, /^i am ([a-z]+)$/, /^i'm ([a-z]+)$/];
function nameStatement(c: string): string | null {
  for (const re of NAME_STATEMENT_RES) {
    const m = c.match(re);
    if (m && looksLikeName(m[1])) return m[1].charAt(0).toUpperCase() + m[1].slice(1);
  }
  return null;
}
const FETCH_TRIGGERS = new Set(['fetch', 'can we play fetch', 'play fetch', 'lets play fetch', 'throw it', 'go fetch', 'can we play catch']);
const DOGS_TRIGGERS = new Set(['dogs', 'dog']);
// Task 140: widen to phrasings from the real log that missed B54. 'performa' is a genuine
// typo a child typed; the 'u'/'you do tricks' and 'for me' forms are the other observed misses.
// ('any tricks?' already normalises to 'any tricks', so it is covered above.)
const TRICKS_TRIGGERS = new Set(['tricks', 'can you do tricks', 'show me a trick', 'do a trick', 'any tricks', 'do tricks', 'can you do a trick', 'u do tricks', 'you do tricks', 'performa trick', 'perform a trick for me', 'do a trick for me']);
const GENERAL_TRIGGERS: Record<string, string> = {
  // 'are there games' stays with B45, which owned it first and has the list on confirm.
  'games': 'COL-B56-GENERAL-01', 'show me a game': 'COL-B56-GENERAL-01',
  'play a game': 'COL-B56-GENERAL-02', 'which game': 'COL-B56-GENERAL-02', 'what games': 'COL-B56-GENERAL-02',
  // 'breeds' asks B55's plain yes/no question, so the confirm below can answer it.
  'breeds': 'COL-B55-CONFIRM-03', 'what breeds': 'COL-B55-CONFIRM-03', 'how many breeds': 'COL-B55-CONFIRM-03',
  'what is the game': 'COL-B56-GENERAL-04', 'tell about the game': 'COL-B56-GENERAL-04',
  'how do i play games here': 'COL-B56-GENERAL-05', 'how do the games work': 'COL-B56-GENERAL-05',
  'what do you like to do': 'COL-B56-GENERAL-06', 'what do you do all day': 'COL-B56-GENERAL-06',
  'a real dog': 'COL-B56-GENERAL-07', 'is this a real dog': 'COL-B56-GENERAL-07',
  'what are dogs': 'COL-B56-GENERAL-08', 'what is a dog': 'COL-B56-GENERAL-08',
};
const FACT_TRIGGERS = new Set(['tell me something', 'tell me a fact', 'a dog fact', 'say something interesting', 'tell me more', 'tell me a dog fact']);


// Route a confirmed loop subject to its destination. Mirrors the loop's offer mapping: a breed
// title -> that breed's page; a game-family word -> the card game rules; a generic dog word -> the
// breed hub. Returns null when the subject has no destination (the confirmation then falls through
// and the loop advances).
const CONFIRM_GAME_WORDS = new Set(['cards', 'deck', 'set', 'rules', 'play', 'chums', 'game']);
const CONFIRM_DOG_WORDS = new Set(['dog', 'dogs', 'doggy', 'puppy', 'pup', 'breed', 'breeds']);
function confirmResolution(subject: string): Resolution | null {
  const p = BREED_PAGES.find((x) => x.title === subject);
  if (p) return breedPageRes(p);
  if (CONFIRM_GAME_WORDS.has(subject)) return { layer: 3, layerName: 'Gameplay and website navigation', bucket: 'B02', action: 'rules_answer', destinationId: 'DST011' };
  if (CONFIRM_DOG_WORDS.has(subject)) return { layer: 5, layerName: 'Dog, breed and website content', bucket: 'B05', action: 'breed_hub' };
  return null;
}

// ---- Breed page retrieval (10 proof breeds) ----
// Aliases are Steve's copy (informal names, nicknames, short forms and the two
// predictable GSD misspellings). Mechanical plurals / singulars are handled in the
// matcher, not authored. The labrador/terrier misspellings live in
// misspellings.json and are applied upstream, so the matcher already sees the
// canonical word. Deliberately EXCLUDED per Steve: bare "shepherd" and bare
// "spaniel" (both cross-family, routed to the confidence gap as a choice, see
// AMBIGUOUS_FAMILY), "staff" (means employees far more often than a dog) and
// "sheepdog" (Old English Sheepdog is a separate breed). Signal STRENGTH, not
// count, decides confidence:
//   - exact full title, or an exact alias, whole word = strong = confident alone
//   - a partial title token, or a fuzzy match = weak = never confident alone
//   - two or more weak signals on one page = confident
//   - two pages within one point = the confidence gap: offer both, never guess
interface BreedPage { slug: string; title: string; url: string; aliases: string[]; tokens: string[]; }
const BREED_PAGES: BreedPage[] = ([
  ['labrador', 'Labrador', ['lab', 'labs', 'lab retriever', 'labrador retriever']],
  ['border-collie', 'Border Collie', ['collie', 'collies']],
  ['boxer', 'Boxer', []],
  ['border-terrier', 'Border Terrier', []],
  ['cocker-spaniel', 'Cocker Spaniel', ['cocker', 'cockers']],
  ['beagle', 'Beagle', []],
  ['french-bulldog', 'French Bulldog', ['frenchie', 'frenchies', 'frenchy', 'french bull dog', 'french bulldogs']],
  ['pug', 'Pug', []],
  ['german-shepherd', 'German Shepherd', ['gsd', 'alsatian', 'alsation', 'german shepard', 'german shepperd']],
  ['staffordshire-bull-terrier', 'Staffordshire Bull Terrier', ['staffie', 'staffy', 'staffies', 'staffordshire', 'staffie bull terrier', 'sbt']],
] as [string, string, string[]][]).map(([slug, title, aliases]) => ({ slug, title, url: `/chums/${slug}`, aliases, tokens: title.toLowerCase().split(/\s+/) }));

// Bare cross-family words: each hits ONE proof page today but names MANY breeds at
// full catalogue ("spaniel" -> springer / cocker / king charles ...; "shepherd" ->
// german / anatolian / australian / belgian ...). Marking them here lets a lone
// weak match on a family word resolve to that single proof page (rather than fall
// through to the fallback). It does NOT force a choice: a choice is only offered
// when TWO OR MORE breeds share the word (the confidence-gap branch in matchBreed),
// which is what happens for "terrier" today and will happen for these two as the
// proof set grows. Qualified forms ("cocker spaniel", "german shepherd") match
// their page as a strong signal, above this rule.
const AMBIGUOUS_FAMILY: Record<string, string[]> = {
  spaniel: ['cocker-spaniel'],
  shepherd: ['german-shepherd'],
};

// Two shared-line families, both for a breed question with NO breed named. Checked
// AFTER matchBreed so a named breed always wins ("tell me about labradors" stays a
// breed_page). BREED_BEST (superlative) is checked before BREED_HUB so "whats the
// best dog breed" is BREED_BEST, not the hub.
const BREED_BEST = ['best dog breed', 'best breed', 'best dog', 'which dog is best', 'what is the best dog', 'cleverest dog', 'nicest dog'];
const BREED_HUB_PHRASES = ['dog breeds', 'dog breed', 'tell me about dog breeds', 'tell me about dogs', 'what dogs are there', 'what breeds are there', 'show me the breeds', 'list the breeds', 'all the breeds'];
// Bare hub words only count as the WHOLE message (the one content word), so "dogs"
// is the hub but "another dog" (a transfer) and "working dogs" (content) are not.
const BREED_HUB_WORDS = new Set(['dog', 'dogs', 'breeds']);
function matchesBreedHub(c: string): boolean {
  if (BREED_HUB_PHRASES.some((p) => c.includes(p))) return true;
  const content = (c.match(/[a-z]+/g) ?? []).filter((w) => !STOP.has(w));
  return content.length === 1 && BREED_HUB_WORDS.has(content[0]);
}
const BREED_FOLLOWUP = ['they', 'them', 'how long', 'live', 'lifespan', 'train', 'training', 'health', 'cost', 'temperament', 'good with', 'size', 'weight', 'shed', 'exercise'];
// Task 35 (S04 turn 6): an explicit "show me the page" request, with a breed topic already
// established, resolves to THAT breed's page via the topic slot. Navigation phrasings only
// (never a breed attribute), kept distinct from BREED_FOLLOWUP above; each requires "the
// page", so a bare "show me" command is not swept in.
const SHOW_PAGE_TRIGGERS = ['show me the page', 'show the page', 'see the page', 'open the page', 'view the page', 'go to the page', 'take me to the page', 'show me that page'];

// Plural/singular tolerant whole-word match (mechanical, not authored copy).
function hasBreedWord(words: Set<string>, token: string): boolean {
  return words.has(token) || words.has(token + 's') || (token.endsWith('s') && words.has(token.slice(0, -1)));
}

// Task 45: does the message name a dog or a breed? A generic dog word, or any breed page's
// title token or alias. Reuses the existing breed data, no new breed list. Used to stop a
// dog/breed price question from opening the offer modal.
const DOG_WORDS = ['dog', 'dogs', 'puppy', 'puppies', 'pup', 'pups'];
function namesDogOrBreed(c: string, words: Set<string>): boolean {
  if (DOG_WORDS.some((w) => words.has(w))) return true;
  return BREED_PAGES.some(
    (p) => p.tokens.some((t) => hasBreedWord(words, t)) || p.aliases.some((a) => (a.includes(' ') ? c.includes(a) : words.has(a))),
  );
}

function breedPageRes(p: BreedPage): Resolution {
  return { layer: 5, layerName: 'Dog, breed and website content', bucket: 'B05', action: 'breed_page', breedSlug: p.slug, breedTitle: p.title, url: p.url, destinationId: p.slug };
}
function breedChoiceRes(opts: BreedPage[]): Resolution {
  return { layer: 5, layerName: 'Dog, breed and website content', bucket: 'B05', action: 'breed_choice', breedOptions: opts.map((p) => ({ title: p.title, slug: p.slug, url: p.url })) };
}

function matchBreed(c: string, n: Normalised, state: RouterState): Resolution | null {
  const words = new Set(c.match(/[a-z]+/g) ?? []);
  const scored = BREED_PAGES.map((p) => {
    const aliasHit = p.aliases.some((a) => (a.includes(' ') ? c.includes(a) : words.has(a)));
    const matched = p.tokens.filter((t) => hasBreedWord(words, t));
    const fullTitle = matched.length === p.tokens.length && p.tokens.length > 0;
    const strong = aliasHit || fullTitle ? 1 : 0;
    const weak = strong ? 0 : matched.length;
    return { p, strong, weak, score: strong * 10 + weak };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);

  if (scored.length) {
    const [top, second] = scored;
    // Confidence gap: two or more breeds within a point of each other. A choice is
    // only ever offered with TWO OR MORE options; a one-option "choice" reads as
    // broken, so it is never produced here.
    if (second && top.score - second.score <= 1) return breedChoiceRes([top.p, second.p]);
    if (top.strong >= 1 || top.weak >= 2) return breedPageRes(top.p); // confident
    // A lone weak signal from a bare cross-family word ("spaniel", "shepherd").
    // Inside the 10 proof breeds each matches EXACTLY ONE page today, so route to
    // that page rather than a single-option choice. When the proof set grows and
    // two or more breeds share the family word ("spaniel" -> cocker + springer,
    // "shepherd" -> german + anatolian), the confidence-gap branch above turns it
    // into a real two-option choice automatically. Same mechanism as "terrier",
    // which already has two proof breeds and so is a choice today.
    const bareFamily = Object.keys(AMBIGUOUS_FAMILY).some(
      (w) => hasBreedWord(words, w) && AMBIGUOUS_FAMILY[w].includes(top.p.slug),
    );
    if (bareFamily) return breedPageRes(top.p);
    // otherwise a single weak signal is not confident: fall through
  }
  // Breed follow-up: no new breed named, but a breed topic is established and this reads
  // as a question about it ("how long do they live"). Reads the topic slot (Task 27).
  const breedTopic = state.topic?.kind === 'breed' ? state.topic.subject : null;
  // Task 142 (bug 3.1): a follow-up is about THEM, the established breed. A GENERAL question that
  // names "dog"/"dogs" ("how long do dogs live") is not a follow-up: it must not be answered with the
  // last breed's paragraph. So the topic is only reused when the message carries no generic dog word.
  const generalDogQuestion = /\bdogs?\b/.test(c);
  // A breed follow-up ("how long do they live") OR an explicit "show me the page" request
  // (Task 35), when a breed topic is established, resolves to that breed's page.
  if (breedTopic && !generalDogQuestion && (hasAny(n, BREED_FOLLOWUP) || hasAny(n, SHOW_PAGE_TRIGGERS))) {
    const p = BREED_PAGES.find((x) => x.slug === breedTopic);
    if (p) return breedPageRes(p);
  }
  return null;
}

// Task 142 (Rule 1): any of the 54 pack breeds, not just the 10 proof breeds. Checked AFTER the
// proof matcher (so the proof breeds keep their nuanced confidence-gap handling and the four chatbot
// dogs keep their transfer routing). A breed's distinctive name tokens (its title minus the generic
// family word) must all be present; matching is fuzzy (hasAny), so "jack russel" reads as "jack
// russell". Exactly one breed must match: zero or an ambiguous family word falls through to the hub.
const BREED_GENERIC = new Set(['terrier', 'hound', 'spaniel', 'retriever', 'bulldog', 'sheepdog', 'dog', 'dogs']);
// Nicknames and short-word misspellings fuzz cannot reach (a five-letter word is matched exact).
const EXTRA_BREED_ALIASES: Record<string, string> = { 'sausage dog': 'dachshund', 'sausage dogs': 'dachshund', corgie: 'corgi', corgies: 'corgi', corgy: 'corgi' };
function breedPageResFromDog(d: DogRecord): Resolution {
  return { layer: 5, layerName: 'Dog, breed and website content', bucket: 'B05', action: 'breed_page', breedSlug: d.slug, breedTitle: d.name, url: d.detailUrl || `/chums/${d.slug}`, destinationId: d.slug };
}
function matchExtraBreed(c: string, n: Normalised, data: ChumData): Resolution | null {
  for (const [phrase, slug] of Object.entries(EXTRA_BREED_ALIASES)) {
    if (c.includes(phrase)) {
      const d = data.dogs.find((x) => x.slug === slug);
      if (d) return breedPageResFromDog(d);
    }
  }
  const matches: DogRecord[] = [];
  for (const d of data.dogs) {
    const key = (d.name.toLowerCase().match(/[a-z]+/g) ?? []).filter((t) => !BREED_GENERIC.has(t));
    if (!key.length) continue;
    if (hasAny(n, [key.join(' ')])) matches.push(d);
  }
  return matches.length === 1 ? breedPageResFromDog(matches[0]) : null;
}

// Task 27: generic explicit-return triggers. Named returns ("back to beagles", "the
// beagle one") carry a subject and go through ordinary breed matching; these carry NO
// subject, so they restore the stored topic. "them"/"it" resolve only to the stored
// topic, never the visitor's own words, so nothing is echoed.
const TOPIC_RETURN_TRIGGERS = [
  'you were saying', 'what were you saying', 'what was that', 'go back', 'carry on',
  'as you were', 'back to it', 'back to that', 'about them', 'about it',
];

// Rebuild the answer for a restored topic. For breed, the page for its slug; for the
// others, the same route the topic came from. Returns null if a breed slug no longer
// resolves.
function topicReturnResolution(topic: Topic): Resolution | null {
  switch (topic.kind) {
    case 'breed': {
      const p = BREED_PAGES.find((x) => x.slug === topic.subject);
      return p ? breedPageRes(p) : null;
    }
    case 'commercial':
      return { layer: 2, layerName: 'Buying, launch and 30% discount', bucket: 'B01', action: 'open_discount_popup', destinationId: 'DST001' };
    case 'game':
      return { layer: 13, layerName: 'Play and entertainment', bucket: 'B17', action: 'offer_bark_game' };
    case 'article':
      return { layer: 5, layerName: 'Dog, breed and website content', bucket: 'B05', action: 'link', destinationId: topic.subject };
  }
}

function detectTopicReturn(n: Normalised, state: RouterState): Resolution | null {
  if (!state.topic) return null;
  if (!hasAny(n, TOPIC_RETURN_TRIGGERS)) return null;
  return topicReturnResolution(state.topic);
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

// A dog name in a transfer follow-up ("the boxer", "labrador"). Returns the Dog id.
function matchDogName(c: string): Dog | null {
  if (/\bboxer\b/.test(c)) return 'boxer';
  if (/\blab(rador)?s?\b/.test(c)) return 'labrador';
  if (/\bterriers?\b/.test(c)) return 'terrier';
  if (/\bcollies?\b/.test(c)) return 'collie';
  return null;
}

// Task 57: the confirmed inside-world entity list (final), MINUS the breed names, which
// are matched by the breed matcher instead (so an alias or misspelling resolves to the
// canonical breed). "pack" is deliberately EXCLUDED: "cards" already covers "whats in the
// pack", and leaving pack out preserves the intended answer to "I want a Six pack". Matched
// as whole words only (no fuzz), like the other bare-word sets in this file, so a longer
// word is never fuzzed into a false entity.
const INSIDE_WORLD_WORDS = [
  // Dogs. 'dogs' before 'dog' so the dog-family candidate canonicalises to the plural "dogs"
  // (Task 71), the way 'cards' is the canonical game word; both "dog" and "dogs" resolve to it.
  'dogs', 'dog', 'doggy', 'puppy', 'pup', 'breeds', 'breed',
  // Game
  'cards', 'deck', 'set', 'rules', 'play', 'chums', 'game',
  // Site
  'page', 'link', 'website', 'site', 'generator',
  // Dog bits
  'bark', 'woof', 'paw', 'tail', 'walk', 'fetch', 'lead', 'collar', 'bone',
  // Names (the four chatbot dogs)
  'collie', 'labrador', 'boxer', 'terrier',
  // History
  'history', 'origin', 'jobs', 'bred', 'ancestors',
];

// Task 57: extract the dog-led loop's candidate subject from an input. Reuses the breed
// matcher, the alias table and the misspelling table exactly as they are (no new language
// processing): a breed, alias or curated misspelling resolves to the canonical breed name;
// otherwise the first inside-world entity word present is the candidate; otherwise none.
// A pure read of the input, so callers can log the candidate (or, when null, the raw input,
// which is the content-gap list). Called with no topic so only entities IN the input count.
export function extractCandidateSubject(n0: Normalised, data: ChumData): string | null {
  const n = applyAliases(n0, buildAliasMap(data.misspellings));
  const c = n.compact;
  const breed = matchBreed(c, n, {} as RouterState);
  if (breed) {
    if (breed.action === 'breed_page' && breed.breedTitle) return breed.breedTitle;
    if (breed.action === 'breed_choice' && breed.breedOptions?.length) return breed.breedOptions[0].title;
  }
  const words = new Set(n.words);
  // Whole-word match with the same mechanical plural/singular tolerance the breed matcher
  // uses (hasBreedWord), so "games"/"cards" match "game"/"cards" without authoring plurals.
  for (const w of INSIDE_WORLD_WORDS) {
    if (hasBreedWord(words, w)) return w;
  }
  return null;
}

// Task 80: the canned-conversation buckets. Each B21-B39 row carries its column-D trigger
// phrases; the LONGEST matching trigger wins (the most specific row). B40 is the no-subject
// fallback, served by the engine, so it is excluded. Matched in resolve() above the non-answer
// zone (gk_unknown / fallback / gibberish) but below every real route.
//
// Matching is deliberately tight because this layer sits above gk_unknown: a full-input exact
// match always counts, but a trigger only matches as a substring when it is specific (three or
// more words). That keeps short generic triggers ("who", "how long", "cats") from hijacking real
// questions ("who is the prime minister", "how long does a game take") while still letting a
// multi-word phrase ("do you like cats") match inside a longer message.
// Task 141: eight new conversational buckets join the generic canned matcher. B47-B53 and B64 are
// the same "recognised conversation" shape as B21-B39 (triggers -> template), so they route the same
// way. B40-B46 (fallback loop / games / rotation) and B54-B63 (wired explicitly, with their own
// ask/confirm/paw/fact behaviours) stay OUT of this range.
const CANNED_BUCKETS = /^B(2[1-9]|3[0-9]|4[7-9]|5[0-3]|64)$/;
// Task 141: only the original B21-B39 buckets may OVERRIDE a real answer (identity / orientation /
// clarifier / FAQ / breed page) on an exact match, which is the deliberate "old voice" decision. The
// eight new buckets must NOT hijack those: e.g. "how long do they live" (B48) has to stay the breed
// follow-up when a breed topic is live, and "how many people can play" (B52) has to stay FAQ001. So
// the exact-override path (resolveCanned, exactOnly) is scoped to this narrower range; the new buckets
// are only reachable at the low in-router position, below FAQ/breed/GK.
const OVERRIDE_CANNED_BUCKETS = /^B(2[1-9]|3[0-9])$/;
function cannedTriggerHits(c: string, hay: string, trig: string, exactOnly: boolean): boolean {
  if (c === trig) return true; // exact full-input match, any length
  if (exactOnly) return false; // the override path (beating a real answer) demands an exact match
  return trig.indexOf(' ') !== trig.lastIndexOf(' ') && hay.includes(` ${trig} `); // else a >=3-word phrase
}
// exactOnly is used when a canned answer is allowed to OVERRIDE a real route (identity / orientation
// / clarifier / FAQ): a substring hit is too loose there ("what do you do when a dog barks" is a
// real FAQ, not B27), so only a full-input match overrides. The in-router fall-through check (over
// the non-answer zone) leaves it false, so a phrase can still match inside a longer stray message.
function matchCanned(c: string, data: ChumData, exactOnly = false, dog: Dog = 'collie'): { bucket: string; responseId: string; route: string } | null {
  const cc = c.replace(/'/g, ''); // apostrophe-insensitive: the workbook triggers are written without them, so "what's this" matches "whats this"
  const hay = ` ${cc} `;
  let best: { bucket: string; responseId: string; len: number; route: string } | null = null;
  // Task 141: the override path (exactOnly, from resolveCanned) is scoped to B21-B39; the low-priority
  // in-router path sees the full extended range (which includes the eight new buckets).
  const bucketRe = exactOnly ? OVERRIDE_CANNED_BUCKETS : CANNED_BUCKETS;
  // Per-dog: match against the active dog's effective bank (its own canned rows first, Collie for any
  // bucket it has not written), the same view the assembler serves from, so a match and its serve agree.
  for (const r of effectiveBank(data, dog)) {
    if (!bucketRe.test(r.bucketId)) continue;
    for (const t of r.triggers) {
      const trig = normalise(t).compact.replace(/'/g, '');
      if (!trig || trig.startsWith('any ')) continue; // skip the "ANY unrecognised input" pseudo-trigger
      if (cannedTriggerHits(cc, hay, trig, exactOnly) && (!best || trig.length > best.len)) {
        best = { bucket: r.bucketId, responseId: r.responseId, len: trig.length, route: r.defaultRoute ?? '' };
      }
    }
  }
  return best ? { bucket: best.bucket, responseId: best.responseId, route: best.route } : null;
}
function cannedResolution(m: { bucket: string; responseId: string; route?: string }): Resolution {
  const res: Resolution = { layer: 9, layerName: 'Recognised conversation', bucket: m.bucket, action: 'canned', responseId: m.responseId };
  if (m.responseId === 'B34-CHUMDROP-01') res.destinationId = 'DST002'; // ChumDrop; the assembler resolves its URL
  // Task 141: a canned row may carry a defaultRoute (B51 superlatives -> DST006 the breed explorer;
  // B52-MISC-01 -> DST007 Britain's Dog History). Attach it so the assembler resolves the page link.
  else if (m.route && /^DST/.test(m.route)) res.destinationId = m.route;
  return res;
}
// The canned resolution for an input, or null. Exported so the engine can let a canned answer
// override the four "old voice" routes Steve named (identity, orientation, the bare-help clarifier
// and soft FAQ matches) that otherwise resolve above the in-router canned check below. Safety,
// grief, breed pages, the bark game and every hard answer keep priority; only safety outranks it.
export function resolveCanned(n0: Normalised, data: ChumData, dog: Dog = 'collie'): Resolution | null {
  const n = applyAliases(n0, buildAliasMap(data.misspellings));
  const m = matchCanned(n.compact, data, true, dog); // exact-only: overriding a real answer needs a full match
  return m ? cannedResolution(m) : null;
}

// Task 78: the two visual tricks. Matched on the WHOLE input only (exact), so a grief/safety message
// that merely contains "dead" (e.g. "my dog is dead") is never a trick -- those resolve above this in
// the safety block. Placed in resolve() below safety/grief and the known routes, above the fallback.
const PLAY_DEAD = new Set(['play dead', 'playdead', 'dead']);
const ROLL_OVER = new Set(['roll over', 'rollover', 'roll']);
// Task 145: the please the Terrier's sit gag waits for on its third turn. Widened per the brief
// (pretty please, plz, pls, go on) beyond the exact "please" trigger that used to end the gag.
const SIT_PLEASE = /(^|\s)(please|plz|pls|go on)(\s|$)/;

// Task 145: the god and religion cluster. Placed above the out-of-scope line (which wrongly blocked a
// question with a genuinely good answer) and below every real route and all of safety.
const GOD_WHICH = ['which god was a dog', 'what god was a dog', 'which god is a dog', 'which god looks like a dog', 'which god has a dog head', 'god with a dog head', 'dog headed god', 'was a dog a god', 'which dog was a god', 'which god is a jackal', 'name a dog god'];
// Belief and generic god questions (incl. the bare word). First ask -> the belief answer; persistence
// (godAskStreak) -> "read the article". A which-god question is split out above for the Anubis line.
const GOD_BELIEF = ['god', 'gods', 'do you believe in god', 'do you believe in a god', 'do you believe in gods', 'do you believe in the god', 'is there a god', 'is god real', 'are gods real', 'do you pray', 'do you pray to god', 'do you worship god', 'is god a dog', 'whats god'];
// Named religions: she plays dumb ("whats <word>?"). The question is rhetorical; no state is kept.
const RELIGION_NAMES = ['christian', 'christianity', 'hindu', 'hinduism', 'sikh', 'sikhism', 'muslim', 'islam', 'islamic', 'jewish', 'judaism', 'catholic', 'catholicism', 'religion', 'religious', 'church', 'jesus', 'allah', 'buddha', 'buddhist', 'bible', 'quran'];
const RELIGION_SELF = ['whats your religion', 'what is your religion', 'whats ur religion', 'your religion', 'what religion are you', 'do you have a religion', 'do you have religion', 'whats your faith'];
// The matched religion word for the play-dumb echo ("whats <word>?"), or null. Only when she is being
// ASKED (are/do you ..., or a short input), so a later explanation that merely mentions a religion word
// does NOT re-trigger -- the rhetorical loop closes on the next turn and lands on "im a dog".
function matchReligion(N: Normalised): string | null {
  const words = N.words ?? (N.compact.match(/[a-z]+/g) ?? []);
  const asked = /(^|\s)(are|do)\s+(you|u)(\s|$)/.test(N.compact) || words.length <= 3;
  if (!asked) return null;
  for (const r of RELIGION_NAMES) if (words.includes(r)) return r;
  return null;
}
// Task 145: parse a bare arithmetic expression ("100 + 100", "5 x 5", "63 - 17"). Anchored to the
// whole message, so an incidental number in a sentence is never read as a sum.
function matchMaths(original: string): { a: number; b: number; op: '+' | '-' | '*' } | null {
  const m = original.trim().match(/^(?:whats?|what is|calculate)?\s*(\d{1,7})\s*(plus|minus|times|multiplied by|[x*×+-])\s*(\d{1,7})\s*[=?\s]*$/i);
  if (!m) return null;
  const r = m[2].toLowerCase();
  const op = r === 'plus' || r === '+' ? '+' : r === 'minus' || r === '-' ? '-' : '*';
  return { a: parseInt(m[1], 10), b: parseInt(m[3], 10), op };
}
// Task 145: the answer. Only the Collie can do maths, and only easy sums (round numbers / small times
// tables); the other three always guess, and the Collie guesses on hard ones. A wrong answer is an
// absurdly small number (deterministic, never the real answer), so it reads as a dog having a go.
function answerMaths({ a, b, op }: { a: number; b: number; op: '+' | '-' | '*' }, dog: Dog): number {
  const correct = op === '+' ? a + b : op === '-' ? a - b : a * b;
  const easy = [a, b].every((x) => x <= 12 || x % 2 === 0 || x % 5 === 0);
  if (dog === 'collie' && easy) return correct;
  const silly = [12, 7, 3, 9, 5, 11, 8, 6].filter((x) => x !== correct);
  return silly[(a + b) % silly.length];
}
// Task 145: the Boxer's third-stop gag. Whole-message "stop" forms only.
const BOXER_STOP = new Set(['stop', 'stop it', 'stop it now', 'please stop', 'stop please', 'ok stop', 'okay stop', 'no more', 'no more jokes', 'stop the jokes', 'stop telling jokes', 'stop jokes']);
function matchTrick(c: string): 'play_dead' | 'roll_over' | null {
  if (PLAY_DEAD.has(c)) return 'play_dead';
  if (ROLL_OVER.has(c)) return 'roll_over';
  return null;
}
// Task 111: two more dog commands, out of the old B11 "Sit? I am running the session." voice. "fetch"
// hands back a rotating Play/Learn/Discover link; "shake"/"paw" offer the bark game (the three Collie
// games are not built yet). Exact-match, same placement as the tricks (below safety/grief).
const FETCH_CMD = new Set(['fetch', 'go fetch']);
const GAME_CMD = new Set(['shake', 'paw', 'shake hands', 'give paw', 'high five']);

// Task 115: the three in-chat games. Entered by name; exited by a whole-input exit word (EXACT match,
// not the fuzzy bark exit, so a Kennel Sketch guess like "bone" is never mistaken for "done"). While a
// game is active every other input is a move.
const GAME_STARTS: [RegExp, GameId][] = [
  // Task 140: a child types the digit ("9 square"/"9square"), so accept it alongside the word.
  [/(?:nine|9) ?squares?/, 'ninesquare'],
  [/missing sheep/, 'missingsheep'],
  [/kennel sketch/, 'kennelsketch'],
];
const GAME_EXIT = new Set(['stop', 'enough', 'finished', 'finish', 'done']);
// Task 146: Treat Trail entry phrases (the Labrador's game only). "treat trail" is the name; the rest
// are what a child would actually type. Gated on the active dog being the Labrador in resolve().
const TREAT_TRAIL_START = /(treat trail|treattrail|treat game|treat hunt|find the treat|find a treat|guess the treat|hunt for treats|play a treat game)/;
// Task 147: The Case of the Missing Biscuit entry phrases (the Border Terrier's game only). Gated on
// the active dog being the Terrier in resolve(). "the case" is deliberately specific (not bare "case").
const MISSING_BISCUIT_START = /(missing biscuit|the case of the missing biscuit|the missing biscuit|whodunnit|whodunit|solve a case|solve the case|solve a mystery|solve the mystery|a mystery|the mystery|be a detective|detective game)/;
// Task 149: Feed the Dog a Cookie entry phrases (the Labrador's second game only). "cookies" does not
// route to the /cookies policy (verified), so it is free to use here; gated on the Labrador in resolve().
const FEED_COOKIE_START = /(feed the dog|feed the lab|feed the labrador|feed me|feed you|give me a cookie|give you a cookie|cookie game|cookies|cookie)/;
function matchGameStart(c: string): GameId | null {
  for (const [re, id] of GAME_STARTS) if (re.test(c)) return id;
  return null;
}

export function resolve(n0: Normalised, data: ChumData, state: RouterState): Resolution {
  // Apply curated misspelling aliases first, so both the safety gate and every
  // downstream layer see the canonical word. Fuzzy matching (in hasAny) then
  // covers the unpredictable slips on top of these predictable ones.
  const n = applyAliases(n0, buildAliasMap(data.misspellings));
  const c = n.compact;
  const N = n; // for hasAny

  // Task 15 (S12): while a protected safety state is live, the safety continuation
  // classifier runs first, so only safety routes in PROTECTED_ACTIVE. A safety hit
  // (a fresh disclosure, a barrier, the no-one route or an acknowledgement close)
  // is returned here; anything else returns null and falls through to normal
  // routing, where the engine decides between a clear ordinary topic (which clears
  // to aftercare) and the general safeguarding continuation.
  if (state.protectedState) {
    const p = detectProtectedContinuation(N);
    if (p) {
      return { layer: 1, layerName: 'Safety and unsuitable content', bucket: null, action: p.action, moderationId: p.moderationId };
    }
  }

  // Clarifier follow-up: if the previous turn was the bare-help clarifier, try to
  // map this turn's answer to an existing route. Checked before safety so an
  // answer containing "help" is not read as a fresh help request. A distress
  // answer ("worried") maps to general distress; a genuine disclosure that is not
  // one of these answer words falls through to the safety gate below.
  if (state.lastAction === 'clarifier') {
    const mapped = captureClarifierAnswer(N, data);
    if (mapped) return mapped;
  }

  // Transfer follow-up: after a transfer OFFER, a dog name performs the transfer.
  if (state.lastAction === 'transfer_request') {
    const to = matchDogName(c);
    if (to) return { layer: 8, layerName: 'Specialist handoff', bucket: 'B08', action: 'transfer', transferTo: to };
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

  // Personal sadness (Task 20). Below every safety route above (a danger, self-harm,
  // safeguarding, medical or distress message is caught by detectSafety and returns
  // before this point). Not fired inside a protected state: the S12 machine owns
  // those turns. The session counter decides L1 (gentle redirect, no latch) vs L2
  // (second qualifying statement, enters PROTECTED_ACTIVE). Both render through the
  // shared safety path (moderationId), so they inherit instant render and recorder
  // redaction; the engine special-cases L1 so it does NOT enter the protected state.
  if (!state.protectedState && detectPersonalSadness(N)) {
    const l2 = (state.personalSadnessCount ?? 0) >= 1;
    return {
      layer: 1,
      layerName: 'Safety and unsuitable content',
      bucket: null,
      action: 'safety_signpost',
      moderationId: l2 ? 'MOD_PERSONAL_SADNESS_L2' : 'MOD_PERSONAL_SADNESS_L1',
    };
  }

  // Task 58: dog bereavement / grief. Sits BELOW urgent safety and personal sadness (both
  // checked above) and ABOVE everything else, including the loop. Served as a gentle ':('
  // in the ordinary Collie voice, NOT the protected support surface: the action is 'grief',
  // not a safety signpost, so it never enters or clears a protected state; and it is not a
  // fallback-family action, so it never reaches the loop and it resets the loop counter. A
  // continuation ("I miss her") only counts while a grief exchange is already open.
  if (!state.protectedState) {
    const grief = detectGrief(N, state.lastAction === 'grief');
    if (grief) {
      return { layer: 1, layerName: 'Safety and unsuitable content', bucket: null, action: 'grief', griefCategory: grief.category };
    }
  }

  // Task 78: the two visual tricks. Below safety/grief (so "my dog is dead" is grief, never a trick)
  // and ABOVE every content route (so "play dead" is not swallowed by the how-to-play FAQ). Exact-match
  // on the whole input, so nothing that merely contains "dead"/"roll" is caught.
  {
    const trick = matchTrick(c);
    if (trick) return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: trick };
    // Task 142: the death cluster. Below the safety gate above (so a real self-harm/animal-harm
    // disclosure is caught there first), it answers in character once; a second death question in a
    // row (persistence) escalates to safeguarding rather than answering twice (the B58 shape).
    if (hasAny(N, DEATH_TRIGGERS)) {
      if ((state.deathAskStreak ?? 0) >= 1) {
        return { layer: 1, layerName: 'Safety and unsuitable content', bucket: null, action: 'safety_signpost', moderationId: 'MOD_SAFEGUARDING' };
      }
      return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'death_answer' };
    }
    // Task 146/147: while a word-guessing game is running (Treat Trail, the Labrador's; Missing
    // Biscuit, the Terrier's), every non-safety input is a guess/clue. Placed directly below the
    // safety / grief / death cluster (which still wins mid-round and ends it) and ABOVE every word-route
    // below (the specialist transfers, maths, the god cluster, ask_dogs / breeds / games, breed pages,
    // canned), so a guess like "dog", "games", "sausige" or "5 x 5" is never swallowed as something
    // else. The Collie games keep their own handler lower down (letter/digit inputs, so they never
    // reach those routes).
    if (state.activeGame === 'treattrail' || state.activeGame === 'missingbiscuit' || state.activeGame === 'feedcookie') {
      if (GAME_EXIT.has(c)) return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'game_exit', game: state.activeGame };
      return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'game_move', game: state.activeGame };
    }
    // Task 145: the Terrier's sit gag runs as a sequence (the deathAskStreak shape). Once he has
    // asked "why?" (TER-B22-01 -> terrierSitStep 1), the NEXT input, whatever it is, gets the
    // magic-word line; the one after gets "no" when it is a please (widened: pretty please / plz /
    // pls / go on). Below every safety route above (hard safety, sadness, grief, the death cluster),
    // so a disclosure mid-gag is never swallowed. The engine advances/resets the step by responseId.
    if (state.activeDog === 'terrier' && (state.terrierSitStep ?? 0) > 0) {
      if ((state.terrierSitStep ?? 0) === 1) {
        return { layer: 9, layerName: 'Recognised conversation', bucket: 'B22', action: 'canned', responseId: 'TER-B22-02' };
      }
      if (SIT_PLEASE.test(c)) {
        return { layer: 9, layerName: 'Recognised conversation', bucket: 'B22', action: 'canned', responseId: 'TER-B22-03' };
      }
      // Not a please: the gag ends here and this turn falls through to ordinary routing.
    }
    // Task 145: the Boxer's visitor-initiated knock-knock. "knock knock" is served "whos there?"
    // by the canned matcher below (BOX-B30-08), which the engine records as boxerKnockStep 1; the
    // NEXT input, whatever it is, gets the punchline (BOX-B30-09). Below every safety route above,
    // so a disclosure after "whos there?" still routes to safety and the step resets.
    if (state.activeDog === 'boxer' && (state.boxerKnockStep ?? 0) > 0) {
      return { layer: 9, layerName: 'Recognised conversation', bucket: 'B30', action: 'canned', responseId: 'BOX-B30-09' };
    }
    // Task 145: arithmetic. Anchored parse (a stray number in a sentence is never a sum). Only the
    // Collie does maths, and only easy sums; the other three always guess, and the Collie guesses on
    // hard ones. The computed answer rides on the resolution note. Below safety/death, above everything.
    {
      const maths = matchMaths(n.original);
      if (maths) return { layer: 6, layerName: 'General knowledge', bucket: 'B06', action: 'maths_answer', note: String(answerMaths(maths, state.activeDog ?? 'collie')) };
    }
    // Task 145: the god and religion cluster. Above the naming / how-are-you routes and out_of_scope
    // (which wrongly blocked a genuinely good answer), below safety/grief/death (all above). Religion
    // is rhetorical (no state, see matchReligion); the god answer escalates to "read the article" on
    // persistence via godAskStreak (the death-cluster shape).
    if (hasAny(N, RELIGION_SELF)) return { layer: 9, layerName: 'Recognised conversation', bucket: null, action: 'religion_self' };
    {
      const religion = matchReligion(N);
      if (religion) return { layer: 9, layerName: 'Recognised conversation', bucket: null, action: 'religion_dumb', mirror: religion };
    }
    if (hasAny(N, GOD_WHICH) || hasAny(N, GOD_BELIEF)) {
      const persistent = (state.godAskStreak ?? 0) >= 1;
      const rid = persistent ? 'GOD-READ' : hasAny(N, GOD_WHICH) ? 'GOD-WHICH' : 'GOD-BELIEF';
      return { layer: 9, layerName: 'Recognised conversation', bucket: null, action: 'god_answer', responseId: rid, destinationId: 'DST017', url: '/good-dog-bad-dog/anubis' };
    }
    // Task 138: the paw is answered before GAME_CMD, which was claiming
    // 'paw' and 'shake' for the bark-game offer.
    const L13 = (bucket: string, responseId: string, destinationId?: string) => ({ layer: 13, layerName: 'Play and entertainment', bucket, action: 'canned' as const, responseId, ...(destinationId ? { destinationId } : {}) });
    // Safety: the cards answer first. THREE in a row hands to a human, which is
    // FAQ015's line -- a parent asking twice is curious, three times wants a
    // person.
    if (SAFE_TRIGGERS.has(c)) {
      const n = (state.safetyAskStreak ?? 0) + 1;
      return L13('B58', n >= 3 ? 'COL-B58-SAFE-02' : 'COL-B58-SAFE-01');
    }
    if (FRIENDS_MORE_TRIGGERS.has(c)) return L13('B59', 'COL-B59-FRIENDS-02');
    if (FRIENDS_TRIGGERS.has(c)) return L13('B59', 'COL-B59-FRIENDS-01');
    if (PEDIGREE_TRIGGERS.has(c)) return L13('B60', 'COL-B60-PEDIGREE-01');
    if (HOME_TRIGGERS.has(c)) return L13('B61', 'COL-B61-NAV-01', 'DST014');
    if (OPTIONS_TRIGGERS.has(c)) return L13('B61', 'COL-B61-NAV-02');
    if (MADE_TRIGGERS.has(c)) return L13('B62', 'COL-B62-MADE-01');
    if (WORST_TRIGGERS.has(c)) return L13('B63', 'COL-B63-WORST-01', 'DST015');
    if (PAW_TRIGGERS.has(c)) return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'paw' };
    // Task 140: the birthday clip reply. Below safety/grief/personal-sadness (all above), so a
    // birthday named alongside a disclosure is never caught here. ANY birthday mention. Serves the
    // smile face + clip (MEDIA_REPLIES in the assembler). (Task 141: car and balls moved to the
    // workbook as B64 / B52-MISC-09 and now route through the generic canned matcher.)
    if (hasAny(N, ['birthday'])) return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'media_reply', responseId: 'BIRTHDAY-01' };
    // Task 142: praise -> the wagging-tail clip (checked before the naming/how-are-you rules so
    // "are you a good dog" is praise, not a name attempt or a personal question).
    if (GOOD_BOY_TRIGGERS.has(c)) return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'good_boy' };
    // Task 142: an excited reaction -> the existing B29 ":)" acknowledgement (not a how-are-you clip).
    if (REACTION_TRIGGERS.has(c)) return { layer: 9, layerName: 'Recognised conversation', bucket: 'B29', action: 'canned', responseId: 'B29-NICE-01' };
    // Task 142: trying to NAME her -> she deflects, taking no name. "whats your name" is deliberately
    // not here, so it keeps its existing "im a dog".
    if (isNamingHer(c)) return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'name_deflect' };
    // Task 142: a name statement -> acknowledge once with the (capitalised) name, then drop it. Safety
    // is checked far above, so "im scared" is a safety route and never reaches here as a name.
    {
      const nm = nameStatement(c);
      if (nm) return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'name_ack', personName: nm };
    }
    // Task 142: a personal question with no answer inside her world (how are you / how old are you /
    // are you human) -> a deflection clip.
    if (hasAny(N, HOW_ARE_YOU) || hasAny(N, HUMAN_STATEMENT)) return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'how_are_you' };
    if (GAME_CMD.has(c)) return { layer: 13, layerName: 'Play and entertainment', bucket: 'B17', action: 'offer_bark_game' };
    if (FETCH_CMD.has(c)) return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'random_link' };
  }

  // Task 123 fix: the B45 games menu. Placed here (below safety/grief and the clarifier/transfer
  // follow-ups, above the FAQ / loop / bark routes that used to swallow these phrases) so it wins.
  // A "yes" right after the menu question serves B45-GAMELIST-02's list; because the menu action is
  // 'games_menu' (not LOOP-01/02), pendingConfirm stays null, so the Task 68 confirm never fires here.
  if (state.lastAction === 'games_menu' && isConfirmYes(c)) {
    return { layer: 13, layerName: 'Play and entertainment', bucket: 'B45', action: 'games_menu', responseId: 'B45-GAMELIST-02' };
  }
  // Task 134b: the three questions that needed a yes. Each sets its own
  // lastAction, so the confirm below is unambiguous and the loop's own
  // pendingConfirm is never involved.
  if (state.lastAction === 'ask_dogs' && isConfirmYes(c)) {
    return { layer: 5, layerName: 'Dog, breed and website content', bucket: 'B05', action: 'breed_hub' };
  }
  if (state.lastAction === 'ask_breeds' && isConfirmYes(c)) {
    return { layer: 5, layerName: 'Dog, breed and website content', bucket: 'B05', action: 'breed_hub' };
  }
  if (state.lastAction === 'ask_games' && isConfirmYes(c)) {
    return { layer: 13, layerName: 'Play and entertainment', bucket: 'B45', action: 'games_menu', responseId: 'B45-GAMELIST-02' };
  }
  if (DOGS_TRIGGERS.has(c)) {
    return { layer: 13, layerName: 'Play and entertainment', bucket: 'B55', action: 'ask_dogs', responseId: 'COL-B55-CONFIRM-01' };
  }

  // Task 137: a yes straight after a fetch throws again, and fetch itself is
  // checked before the games-menu confirm so a second "fetch" is never read as
  // an answer to "which game?".
  if (state.lastAction === 'random_link' && isConfirmYes(c)) {
    return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'random_link' };
  }
  if (FETCH_TRIGGERS.has(c)) {
    return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'random_link' };
  }

  // Task 134: tricks. The question, then the list on a following yes.
  if (state.lastAction === 'tricks_menu' && isConfirmYes(c)) {
    return { layer: 13, layerName: 'Play and entertainment', bucket: 'B54', action: 'tricks_menu', responseId: 'COL-B54-TRICKS-02' };
  }
  if (TRICKS_TRIGGERS.has(c)) {
    return { layer: 13, layerName: 'Play and entertainment', bucket: 'B54', action: 'tricks_menu', responseId: 'COL-B54-TRICKS-01' };
  }

  // Task 134: a random dog fact. Rotation is handled in the assembler so the
  // session does not repeat one until all twenty have been used.
  if (FACT_TRIGGERS.has(c)) {
    return { layer: 13, layerName: 'Play and entertainment', bucket: 'B57', action: 'dog_fact' };
  }

  // Task 134: eight corrections to live answers, matched whole-message.
  if (GENERAL_TRIGGERS[c]) {
    const rid = GENERAL_TRIGGERS[c];
    if (rid === 'COL-B55-CONFIRM-03') return { layer: 13, layerName: 'Play and entertainment', bucket: 'B55', action: 'ask_breeds', responseId: rid };
    if (rid === 'COL-B56-GENERAL-01') return { layer: 13, layerName: 'Play and entertainment', bucket: 'B56', action: 'ask_games', responseId: rid };
    return { layer: 13, layerName: 'Play and entertainment', bucket: 'B56', action: 'canned', responseId: rid };
  }

  if (GAMES_MENU_TRIGGERS.has(c)) {
    return { layer: 13, layerName: 'Play and entertainment', bucket: 'B45', action: 'games_menu', responseId: 'B45-GAMELIST-01' };
  }

  // Task 68: confirmation after a loop offer. If the previous turn served LOOP-01 or LOOP-02
  // (state.pendingConfirm holds the offered subject) and this turn is a bare affirmation, route
  // to that subject's destination, so a "yes" does something instead of inviting an unsupported
  // answer. Below safety/grief so a disclosure is never read as a confirmation; a "no" (or any
  // non-affirmation) is not caught here and falls through, advancing the loop.
  if (state.pendingConfirm && isConfirmYes(c)) {
    const routed = confirmResolution(state.pendingConfirm);
    if (routed) return routed;
  }

  // Task 27: explicit topic return. A generic return ("you were saying", "what were you
  // saying about them", "go back") with no named subject restores the stored topic. Below
  // every safety route and only when a topic is stored (cleared on PROTECTED_ACTIVE), so a
  // safety exchange is never derailed and no topic leaks out of it. Named returns ("back
  // to beagles") carry a subject and fall through to ordinary breed matching below.
  {
    const back = detectTopicReturn(N, state);
    if (back) return back;
  }

  // Hidden ceiling: after safety, a session at the ceiling ends via the Boxer.
  if (state.submissionCount >= HIDDEN_CEILING) {
    return { layer: 8, layerName: 'Specialist handoff', bucket: 'B08', action: 'boxer_cutoff', transferTo: 'boxer' };
  }

  // Task 115: the three in-chat games. Placed AFTER safety, personal sadness, grief and the ceiling
  // (all of which return above), and before every content route. So a disclosure, a bereavement or a
  // fear-of-a-person message mid-game is caught by the safety/grief layers above and NEVER reaches here
  // as a move; the engine then ends the game. While a game is active, an exact exit word leaves it and
  // anything else is a move. Cold, a game name starts it.
  if (state.activeGame) {
    if (GAME_EXIT.has(c)) {
      return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'game_exit', game: state.activeGame };
    }
    return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'game_move', game: state.activeGame };
  }
  // Task 146: Treat Trail is the Labrador's game -- start it only when the Labrador is active (the
  // Collie/Terrier/Boxer keep their own games). Below safety and the active-game move handler above.
  if (state.activeDog === 'labrador' && !state.activeGame && TREAT_TRAIL_START.test(c)) {
    return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'game_start', game: 'treattrail' };
  }
  // Task 147: The Case of the Missing Biscuit is the Border Terrier's game -- start it only when the
  // Terrier is active. The other three keep their own games and routes.
  if (state.activeDog === 'terrier' && !state.activeGame && MISSING_BISCUIT_START.test(c)) {
    return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'game_start', game: 'missingbiscuit' };
  }
  // Task 149: Feed the Dog a Cookie is the Labrador's second game -- start it only when the Labrador is
  // active. Checked after Treat Trail (distinct phrases), so "cookie"/"feed me" reach it; the /cookies
  // policy is untouched (typing "cookies" never opened it, and now it starts the game instead).
  if (state.activeDog === 'labrador' && !state.activeGame && FEED_COOKIE_START.test(c)) {
    return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'game_start', game: 'feedcookie' };
  }
  {
    const start = matchGameStart(c);
    if (start) return { layer: 13, layerName: 'Play and entertainment', bucket: null, action: 'game_start', game: start };
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
  // Task 69: a get/buy/order verb phrase PLUS any product word reaches buying (never the verb or
  // the product word alone). So "where can I get the game/cards/deck" route to buying, while
  // "how do I get a dog" / "where can I get help" (no product word) do not, and the topic slot
  // already being commercial also satisfies the second half.
  const getVerb = hasAny(N, GET_VERBS) && (hasAny(N, PRODUCT_WORDS) || state.topic?.kind === 'commercial');
  if ((hasAny(N, COMMERCIAL) || hasAny(N, PRICE_INTENT) || getVerb) && !hasAny(N, COMMERCIAL_EXCLUDE)) {
    // Task 45/46: the offer modal AND the price answer are about the product, never a dog. A
    // price/buy question that names a dog or breed, or whose bare "it" points at a breed topic
    // (Task 27), carrying no explicit product word, gets neither: it refuses to guess
    // (gk_unknown), because there is no dog price and £9.99 would be wrong.
    const words = new Set(c.match(/[a-z]+/g) ?? []);
    if (!hasAny(N, PRODUCT_WORDS) && (namesDogOrBreed(c, words) || state.topic?.kind === 'breed')) {
      return { layer: 6, layerName: 'General knowledge', bucket: 'B06', action: 'gk_unknown', note: 'Dog/breed price question: no dog price exists; refuse rather than quote the game price.' };
    }
    // Task 49: split by intent. A PRICE question answers in chat via FAQ008, through a distinct
    // price_answer action that renders FAQ008's text but is NOT a MEANINGFUL_TOPIC, so the S12
    // safety machine holds/refuses it exactly as it does buying (it is in AFTERCARE_BLOCKED and
    // is not meaningful). A BUYING question opens the offer modal (DST001).
    if (hasAny(N, PRICE_INTENT)) {
      return { layer: 4, layerName: 'FAQ knowledge', bucket: 'B04', action: 'price_answer', faqId: 'FAQ008' };
    }
    return { layer: 2, layerName: 'Buying, launch and 30% discount', bucket: 'B01', action: 'open_discount_popup', destinationId: 'DST001' };
  }

  // Task 142 (§7.2): a referral question. No referral scheme exists, so rather than guess, point it
  // at the offer (Steve's call). Below the commercial block so a real buying phrase still opens the
  // modal on its own terms.
  if (hasAny(N, REFERRAL_TRIGGERS)) {
    return { layer: 2, layerName: 'Buying, launch and 30% discount', bucket: 'B01', action: 'open_discount_popup', destinationId: 'DST001' };
  }

  // Bark game by name (Task 13). Naming the bark game, or a short affirmation while
  // the bark game is the topic under discussion, enters the game: the dog barks (the
  // existing mechanic, count 1). Checked before orientation/identity/fun/rules/FAQ and
  // the games meta-route below, so "how do I play the bark game" is the bark game, not
  // the card-game rules or the age FAQ. Kept below commercial. NOTE: no approved line
  // EXPLAINS the bark game, so a named query is answered by a bark, not an explanation.
  // Task 28b: EXIT. While a game is running (bark streak active), an exit phrase ends it
  // with the approved exit line, rather than falling to the B13 catch-all.
  if ((state.barkStreak ?? 0) > 0 && hasAny(N, BARK_EXIT_TRIGGERS)) {
    return { layer: 15, layerName: 'The bark game', bucket: null, action: 'bark_exit' };
  }
  // The bark game is the ACTIVE topic when the previous turn was a bark-game action:
  // it was just offered, explained, or barked. This is narrower than topic.kind === 'game'
  // (which the CARD-game rules also set), so "what do I do" after the card rules stays
  // orientation, not the bark explanation.
  const barkTopicActive = ['offer_bark_game', 'bark_explain', 'bark', 'bark_break', 'bark_ack'].includes(state.lastAction ?? '');
  // Task 28a: EXPLANATION. A question about the bark game reaches the explanation, outranking
  // the bark mechanic. Named forms always; generic forms only when the bark game is active
  // (so "what do I do" / "how do you play" stay orientation / card-rules cold-start).
  if (hasAny(N, BARK_EXPLAIN_NAMED) || (barkTopicActive && hasAny(N, BARK_EXPLAIN_CONTEXTUAL))) {
    return { layer: 15, layerName: 'The bark game', bucket: null, action: 'bark_explain' };
  }
  {
    // A short affirmation enters the game while the bark game is the active topic.
    const enterBark = hasAny(N, BARK_GAME_NAMES) || (barkTopicActive && BARK_ENTER_AFFIRM.some((a) => c === a));
    if (enterBark) {
      if (state.barkCompleted) return { layer: 15, layerName: 'The bark game', bucket: 'B20', action: 'bark_ack' };
      const streak = (state.barkStreak ?? 0) + 1;
      if (streak === BARK_BREAK) return { layer: 15, layerName: 'The bark game', bucket: 'B19', action: 'bark_break', barkCount: 1 };
      return { layer: 15, layerName: 'The bark game', bucket: null, action: 'bark', barkCount: 1 };
    }
  }

  // Task 140: page bios, route 1. "what is this page" (and the other whole-message triggers)
  // answers with the bio for the page the visitor is standing on. Placed just ABOVE orientation
  // so it intercepts the exact "what is this" when a page context exists; with no context
  // (state.route unset, e.g. the harness) it is skipped and orientation keeps that input. The
  // engine holds this action in both protected states (brief section 8), so it never serves there.
  if (state.route) {
    const bio = bioForRoute(state.route);
    if (bio && PAGE_BIO_TRIGGERS.has(c)) {
      return { layer: 3, layerName: 'Gameplay and website navigation', bucket: 'B03', action: 'page_bio', pageBioRoute: state.route };
    }
  }

  // Layer 11: orientation and onboarding. Checked high (right after commercial)
  // so a first-timer's "what do I do here" is oriented, not refused as unknown
  // knowledge or echoed as a stray word. The number is a category id, not code
  // order: this stack already runs the ceiling (8) and breed (7) out of numeric
  // sequence. It sits below safety and commercial but above rules/FAQ/content so
  // onboarding phrasing is intercepted; the curated patterns keep real queries out.
  if (ORIENTATION_EXACT.has(c) || hasAny(N, ORIENTATION)) {
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
    return { layer: 13, layerName: 'Play and entertainment', bucket: 'B17', action: 'offer_bark_game' };
  }

  // Task 18: complaint / report / escalation -> the approved FAQ015 complaint answer.
  // Above rules/nav/FAQ so a complaint is not answered as product copy.
  if (hasAny(N, COMPLAINT_CONTACT)) {
    return { layer: 4, layerName: 'FAQ knowledge', bucket: 'B04', action: 'faq_answer', faqId: 'FAQ015' };
  }
  // General contact enquiry -> the approved FAQ012 general enquiry answer. Checked after
  // COMPLAINT_CONTACT and above navigation, so "how do I contact you" stays FAQ012 and
  // does not become the DST013 contact-page nav link.
  if (hasAny(N, CONTACT_ENQUIRY)) {
    return { layer: 4, layerName: 'FAQ knowledge', bucket: 'B04', action: 'faq_answer', faqId: 'FAQ012' };
  }

  // Named-dog handoff: a transfer verb plus one of the four chatbot dog names is a
  // handoff, not a breed lookup. Checked before breed retrieval (and the rules /
  // FAQ layers) so "can I talk to the boxer" transfers to the Boxer instead of
  // opening the Boxer breed page. matchDogName is whole-word, so only an actual
  // dog name (not a generic "another dog") satisfies the pairing here; those still
  // fall through to the TRANSFER_REQUEST offer below.
  if (hasAny(N, TRANSFER_VERBS)) {
    const named = matchDogName(c);
    if (named) return { layer: 8, layerName: 'Specialist handoff', bucket: 'B08', action: 'transfer', transferTo: named };
  }

  // Games and rules meta-route (Task 14). Recovers game-surface questions that
  // otherwise fall to gk_unknown or the fallback, each pointed at an EXISTING approved
  // answer (no new copy). Sits above RULES/FAQ/GK so it catches them; below the
  // bark-by-name check (so "whats the bark game" is the bark game, not this) and below
  // FUN/orientation/identity/complaint (so those keep their inputs). "what games are
  // there" has no games-catalogue answer, so it is not routed here and stays unmatched.
  if (hasAny(N, META_RULES_TRIGGERS)) {
    return { layer: 3, layerName: 'Gameplay and website navigation', bucket: 'B02', action: 'rules_answer', destinationId: 'DST011' };
  }
  if (hasAny(N, META_AGE_TRIGGERS)) {
    return { layer: 4, layerName: 'FAQ knowledge', bucket: 'B04', action: 'faq_answer', faqId: 'FAQ002', faqMatchStrength: 2 };
  }
  if (hasAny(N, META_AVAILABILITY_TRIGGERS)) {
    return { layer: 13, layerName: 'Play and entertainment', bucket: 'B17', action: 'offer_bark_game' };
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

  // Task 32b: a delivery / shipping question naming a UK place -> FAQ014, whose one approved
  // line covers both the mainland (covered) and the non-mainland places (not yet). Requires a
  // delivery-intent word AND a place, checked at the FAQ layer so it beats the free-text
  // fallback that used to swallow "do you ship to Scotland".
  if (hasAny(N, DELIVERY_INTENT) && hasAny(N, DELIVERY_PLACES)) {
    return { layer: 4, layerName: 'FAQ knowledge', bucket: 'B04', action: 'faq_answer', faqId: 'FAQ014', faqMatchStrength: 2 };
  }

  // Task 35: a singular-card pack-contents question -> the approved FAQ004 pack answer.
  if (hasAny(N, PACK_CONTENTS)) {
    return { layer: 4, layerName: 'FAQ knowledge', bucket: 'B04', action: 'faq_answer', faqId: 'FAQ004', faqMatchStrength: 2 };
  }

  // Layer 4: FAQ knowledge.
  {
    const faq = matchFaq(data, c);
    if (faq) {
      return { layer: 4, layerName: 'FAQ knowledge', bucket: 'B04', action: 'faq_answer', faqId: faq.faqId, faqMatchStrength: faq.strength };
    }
  }

  // Layer 7: facts about the active breed (the Collie itself). Checked before
  // the generic content layer: an explicit question about the active dog's own
  // attributes is answered in character, not punted to an article. (The §19
  // acceptance example "Are Border Collies easy to train?" resolves here.)
  if (isActiveBreedQuestion(c)) {
    return { layer: 7, layerName: 'Facts about the active breed', bucket: 'B07', action: 'breed_answer' };
  }

  // Breed page retrieval (10 proof breeds), after the active-breed (Collie) route
  // so "Are Border Collies easy to train?" still gets the Collie answer. A confident
  // named breed links to its page; two breeds within the gap offer a choice; a
  // breed follow-up ("how long do they live") reuses the established breed. Deferred
  // while a complaint is open, so "the labrador one" names the complaint's product
  // rather than jumping to the breed page.
  if (!state.lastWasComplaint) {
    const breed = matchBreed(c, N, state);
    if (breed) return breed;
    // Task 142 (Rule 1): any of the other 54 pack breeds (corgi, dachshund, jack russell, ...). Above
    // food (layer 8), so a breed named with a food word ("sausage dogs") is the breed, never food.
    const extra = matchExtraBreed(c, N, data);
    if (extra) return extra;
    // Superlative "best dog" question: the shared refuse-to-pick line. Checked before
    // the hub so "whats the best dog breed" is BREED_BEST, not BREED_HUB.
    if (hasAny(N, BREED_BEST)) {
      return { layer: 5, layerName: 'Dog, breed and website content', bucket: 'B05', action: 'breed_best' };
    }
    // Breed question with no breed named: the shared hub line.
    if (matchesBreedHub(c)) {
      return { layer: 5, layerName: 'Dog, breed and website content', bucket: 'B05', action: 'breed_hub' };
    }
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

  // Task 80: the canned-conversation buckets (B21-B39). Placed after the known-GK answer above
  // and before the GK refuse-to-guess below, so a specific canned reply beats a "no approved
  // record" non-answer, while every real answer (safety, breed, FAQ, identity, known GK, ...) that
  // resolves earlier still wins. B34's first row hands over the ChumDrop page as a link.
  {
    const canned = matchCanned(c, data, false, state.activeDog);
    if (canned) return cannedResolution(canned);
  }

  // Task 142 (change 1): a GENERAL dog-lifespan question gets a real answer plus the breed explorer,
  // instead of the "Dogs?" non-answer. The pronoun form ("how long do they live") carries no generic
  // dog word, so it never matches here and keeps B48's "Is what?".
  if (hasAny(N, DOG_LIFESPAN)) {
    return { layer: 6, layerName: 'General knowledge', bucket: 'B06', action: 'dog_lifespan', destinationId: 'DST006', url: '/know-your-chums' };
  }

  // Layer 6 (continued): a general-knowledge-shaped question with no approved
  // record is refused here rather than guessed. Checked after the active-breed
  // layer so an explicit breed question is not swallowed as unknown GK.
  // Task 142 (bug 3.3): a genuine food question ("what food do dogs eat") is GK-shaped, so it was
  // refused here before reaching the food specialist. A message carrying a food word skips the
  // refuse and falls through to the Labrador food transfer below.
  if ((hasAny(N, CURRENT_DATA) || GK_SHAPE.test(c)) && !hasAny(N, FOOD)) {
    return { layer: 6, layerName: 'General knowledge', bucket: 'B06', action: 'gk_unknown', note: 'No approved record. The Collie does not guess.' };
  }

  // Layer 8: specialist handoff. A dog never offers to transfer to itself: the handoff only fires
  // when a DIFFERENT dog owns the topic. (This also means a food/joke/investigate word can never pull
  // a dog out of its own game -- Treat Trail is the Labrador's, Missing Biscuit the Terrier's.)
  if (hasAny(N, FOOD) && state.activeDog !== 'labrador') {
    return { layer: 8, layerName: 'Specialist handoff', bucket: 'B08', action: 'transfer', transferTo: 'labrador' };
  }
  if (hasAny(N, JOKE) && state.activeDog !== 'boxer') {
    return { layer: 8, layerName: 'Specialist handoff', bucket: 'B08', action: 'transfer', transferTo: 'boxer' };
  }
  if (hasAny(N, INVESTIGATE) && state.activeDog !== 'terrier') {
    return { layer: 8, layerName: 'Specialist handoff', bucket: 'B08', action: 'transfer', transferTo: 'terrier' };
  }

  // Visitor asks to switch dogs (a transfer they request). Approved repair line.
  if (hasAny(N, TRANSFER_REQUEST)) {
    return { layer: 8, layerName: 'Specialist handoff', bucket: 'B08', action: 'transfer_request' };
  }

  // Task 36 (S01 turn 8): a goodbye, matched on the whole message. Checked at the top of
  // layer 9 so a bare "bye" reaches it before the single-word fallback below, and as the
  // whole message so it never steals "what does goodbye mean". In PROTECTED_ACTIVE this
  // non-safety route is overridden by the S12 machine (a safety signal still wins), so it
  // can never fire mid-safeguarding. The approved line is held as an assembler constant
  // (flagged there for later workbook migration), like the bark-game lines.
  if (isGoodbye(c)) {
    return { layer: 9, layerName: 'Recognised conversation', bucket: null, action: 'goodbye' };
  }

  // Layer 9: recognised conversation.
  {
    // Task 76: a greeting is mirrored — echo the greeting word back (see the assembler), rather
    // than serving a B09 pool line. Same GREETING list that already triggers B09.
    const g = matchedGreeting(N);
    if (g) return { ...conv('B09'), mirror: g };
  }
  if (hasAny(N, TESTING)) return conv('B10');
  if (hasAny(N, COMMAND)) return conv('B11');
  if (hasAny(N, PERSONAL)) return conv('B12');
  // Single word: NO echo. "bye", "ok", "no", "please", "why" are the commonest
  // single words anyone types, and echoing them ("bye. A noun. Excellent...")
  // reads as broken. Use the non-echoing fallback line. EXCEPT bare "help": it is
  // a help plea, so it takes the approved BARE_HELP clarifier, the same line
  // "can you help me" already gets (Task 11b). A second consecutive clarifier is
  // capped to the fallback (mirrors the safety block's twice-guard).
  // Task 145: the Boxer's third-stop gag. Below the games and the bark (all handled above, so "stop"
  // still exits them) but above the single-word / gibberish fallback that would otherwise eat it. The
  // first two "stop"s are ignored (he keeps telling jokes); the third gets a flat "ok".
  if (state.activeDog === 'boxer' && BOXER_STOP.has(c)) {
    const nth = (state.boxerStopStreak ?? 0) + 1;
    if (nth >= 3) return { layer: 13, layerName: 'Play and entertainment', bucket: 'B24', action: 'canned', responseId: 'BOX-B24-02', note: 'boxer_stop_done' };
    return { layer: 13, layerName: 'Play and entertainment', bucket: 'B30', action: 'canned', responseId: nth === 1 ? 'BOX-B30-04' : 'BOX-B30-06', note: 'boxer_stop' };
  }

  if (isSingleWord(N)) {
    if (c === 'help' && state.lastAction !== 'clarifier') {
      return { layer: 1, layerName: 'Safety and unsuitable content', bucket: null, action: 'clarifier', moderationId: 'MOD_BARE_HELP' };
    }
    return { layer: 9, layerName: 'Recognised conversation', bucket: 'B13', action: 'fallback' };
  }

  // Layer 14: emoji-only message (picture-writing with no words). Checked before
  // gibberish so a lone emoji gets the "I read words" family, not the smash reply.
  if (isEmojiOnly(n)) {
    return { layer: 14, layerName: 'Emoji only', bucket: 'B18', action: 'emoji_only' };
  }

  // Layer 10: gibberish and fallback.
  if (isGibberish(N)) {
    return { layer: 10, layerName: 'Gibberish and fallback', bucket: 'B14', action: 'gibberish' };
  }

  // Task 37: a coherent question on a topic the site does not cover is out-of-scope, not a
  // failure to understand. It reaches the approved out-of-scope line rather than the repair
  // ladder (which would wrongly imply the visitor typed badly). Checked here, after every real
  // route, so an answerable question is never diverted. In PROTECTED_ACTIVE the S12 machine
  // overrides this non-safety route (a safety signal still wins), so it can never fire
  // mid-safeguarding.
  if (hasAny(N, OUT_OF_SCOPE)) {
    return { layer: 9, layerName: 'Recognised conversation', bucket: null, action: 'out_of_scope' };
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
