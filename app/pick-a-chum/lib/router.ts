// The global priority stack and first-input bucket classifier.
//
// Messages are checked in strict priority order (brief section 7). A lower comic
// layer must never override a higher commercial, utility, FAQ or safety match:
// "Hello, how much is the game?" is commercial (layer 2), not a greeting
// (layer 9); "Can dogs eat chocolate?" is safety (layer 1), not a food transfer
// (layer 8). All matching is deterministic local code.

import { ChumData, Resolution, Dog, ActionType } from './types';
import { Normalised, isGibberish, isSingleWord, isEmojiOnly, isBarkOnly, barkUnitCount, hasAny, buildAliasMap, applyAliases } from './normalise';
import { detectSafety, isDogHealthQuestion, detectProtectedContinuation, detectPersonalSadness } from './safety';
import { Topic } from './session';

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

// Task 45: the offer modal is about the product, never a dog. A buy/price phrase opens it
// only with an explicit product word (Steve's list), so a dog/breed price question ("how
// much is a labrador") can never infer the product. See the commercial check for the topic
// rule that lets a bare "how much is it" resolve to the game when no breed is in play.
const PRODUCT_WORDS = ['game', 'games', 'pack', 'packs', 'cards', 'card', 'deck', 'set', 'pick a chum'];

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

const GREETING = ['hi', 'hiya', 'hello', 'hey', 'morning', 'good morning', 'evening', 'afternoon', 'anyone there', 'how are you', 'yo'];
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
  'god', 'jesus', 'allah', 'buddha', 'religion', 'religious', 'bible', 'quran',
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
  // A breed follow-up ("how long do they live") OR an explicit "show me the page" request
  // (Task 35), when a breed topic is established, resolves to that breed's page.
  if (breedTopic && (hasAny(n, BREED_FOLLOWUP) || hasAny(n, SHOW_PAGE_TRIGGERS))) {
    const p = BREED_PAGES.find((x) => x.slug === breedTopic);
    if (p) return breedPageRes(p);
  }
  return null;
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
  // Dogs
  'dog', 'dogs', 'doggy', 'puppy', 'pup', 'breed', 'breeds',
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
  if ((hasAny(N, COMMERCIAL) || hasAny(N, PRICE_INTENT)) && !hasAny(N, COMMERCIAL_EXCLUDE)) {
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
  if (hasAny(N, GREETING)) return conv('B09');
  if (hasAny(N, TESTING)) return conv('B10');
  if (hasAny(N, COMMAND)) return conv('B11');
  if (hasAny(N, PERSONAL)) return conv('B12');
  // Single word: NO echo. "bye", "ok", "no", "please", "why" are the commonest
  // single words anyone types, and echoing them ("bye. A noun. Excellent...")
  // reads as broken. Use the non-echoing fallback line. EXCEPT bare "help": it is
  // a help plea, so it takes the approved BARE_HELP clarifier, the same line
  // "can you help me" already gets (Task 11b). A second consecutive clarifier is
  // capped to the fallback (mirrors the safety block's twice-guard).
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
