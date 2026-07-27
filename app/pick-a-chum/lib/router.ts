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
];

// Orientation phrasings matched on the WHOLE normalised input only (Task 11a).
// "what is this" spelled out is orientation, but it is too generic to keep as a
// substring trigger: as a substring it would swallow breed queries like "what is
// this dog". An exact full-input match has no such collision, because a longer
// input ("what is this dog") is a different string and never equals it.
const ORIENTATION_EXACT = new Set(['what is this']);

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

// Identity and scepticism (bucket B16), grouped into the ten SCP families so each
// gets its own family-specific answer (responses are B16 rows SCP-F01..F10).
// Honest-curiosity questions only. Character-MANIPULATION ("pretend you are not a
// dog", "ignore your rules", "system prompt") is deliberately absent: it is
// safety's territory (Batch 4), safety wins ties.
const IDENTITY_FAMILIES: { family: string; triggers: string[] }[] = [
  { family: 'F01', triggers: ['how can a dog type', 'a dog type', 'really your face', 'what i typed'] },
  { family: 'F02', triggers: ['are you real', 'are you a dog', 'actually a dog', 'a real dog', 'real dog there', 'talking to a dog', 'are you alive', 'real animal', 'pretending to be a dog', 'are you pretending'] },
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
  lastBreedSlug?: string | null; // the breed established earlier, for follow-up questions
  lastWasComplaint?: boolean; // an open complaint context: defer breed retrieval until it clears
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

// Plural/singular tolerant whole-word match (mechanical, not authored copy).
function hasBreedWord(words: Set<string>, token: string): boolean {
  return words.has(token) || words.has(token + 's') || (token.endsWith('s') && words.has(token.slice(0, -1)));
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
  // Breed follow-up: no new breed named, but one is established and this reads as a
  // question about it ("how long do they live").
  if (state.lastBreedSlug && hasAny(n, BREED_FOLLOWUP)) {
    const p = BREED_PAGES.find((x) => x.slug === state.lastBreedSlug);
    if (p) return breedPageRes(p);
  }
  return null;
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
    return { layer: 13, layerName: 'Play and entertainment', bucket: 'B17', action: 'fun_tease' };
  }

  // Complaint / human-contact: route to the approved FAQ012 human-contact answer.
  // Above rules/nav/FAQ so a complaint is not answered as product copy.
  if (hasAny(N, COMPLAINT_CONTACT)) {
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
