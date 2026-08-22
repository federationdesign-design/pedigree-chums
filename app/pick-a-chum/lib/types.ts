// Pick a Chum: shared engine types.
//
// The engine is pure, deterministic local code. No network, no LLM, no browser
// APIs. Every classifier takes the data bundle and returns a plain result, so
// the same logic runs in the Next client page (data loaded by the bundler) and
// in the Node test harness (data loaded from disk).

// ---- Generated record shapes (subset of fields the engine reads) ----

export interface CollieResponse {
  responseId: string;
  bucketId: string;
  subtag: string;
  triggers: string[];
  template: string;
  factSource: string;
  defaultRoute: string;
  animationCue: string;
  status: string;
  interjection?: string; // Task 161: the Collie's one-line cut-in when the Labrador answers a dangerous (NEVER-tier) food; empty on every other row
}

export interface Destination {
  destinationId: string;
  name: string;
  family: string; // Play | Learn | Discover | Commercial | Utility ...
  triggerTags: string[];
  campaignState: string;
  weight: string;
  preferredDog: string[];
  resolvedUrl: string | null;
  embedded: boolean;
}

export interface FaqRecord {
  faqId: string;
  canonicalQuestion: string;
  alternativePhrasings: string[];
  resolvedAnswer: string | null;
  cta?: string;
  campaignState: string;
}

export interface GeneralKnowledge {
  questionId: string;
  category: string;
  canonicalQuestion: string;
  correctAnswer: string;
  collieObservation: string;
  alternativePhrasings: string[];
}

export interface Article {
  articleId: string;
  title: string;
  triggerTags: string[];
  preferredDog: string[];
  family: string;
  resolvedUrl: string | null;
  embedded: boolean;
}

export interface TransferRule {
  transferId: string;
  from: string;
  to: string;
  strongTriggers: string[];
  exclusions: string;
  exampleLine: string;
}

export interface CopyComponent {
  componentId: string;
  type: string;
  subgroup: string;
  line: string;
  usageRule: string;
}

export interface DogRecord {
  name: string;
  slug: string;
  detailUrl: string;
  image: string;
  character: string;
  temperament: string[];
  lifespanYears: number | null;
  training: { score: number; label: string } | null;
  health: { generalNote: string; conditions: { name: string; severity: number }[] } | null;
}

// Curated misspelling alias: a canonical high-value word and the known slips
// that should be treated as it (workbook-driven content Steve extends).
export interface MisspellingAlias {
  canonical: string;
  variants: string[];
}

// The full data bundle the engine consumes. Hand-authored records (campaign,
// rules, moderation) are imported directly by the engine since they are plain
// TS; only the generated JSON is injected here.
// A per-dog page-handoff line. Two families share the sheet: NAV_BREED_HANDOFF
// (mid-conversation, hands over a page without ending the chat) and CLOSE_WITH_LINK
// (end of conversation, page as the parting gift). `line` ends with the literal
// [LINK] token; the assembler strips it and attaches the real page link. `dog` is
// the workbook display name (Collie / Labrador / Border Terrier / Boxer).
export interface LinkHandoff {
  family: string;
  responseId: string;
  dog: string;
  line: string;
  status: string;
}

export interface ChumData {
  collieResponses: CollieResponse[];
  // Per-dog response banks (same row shape as Collie). A dog inherits Collie for any bucket it has not
  // written (see banks.ts). Empty until Steve supplies the rows; when empty, every dog is pure Collie.
  labradorResponses: CollieResponse[];
  boxerResponses: CollieResponse[];
  terrierResponses: CollieResponse[];
  destinations: Destination[];
  faq: FaqRecord[];
  generalKnowledge: GeneralKnowledge[];
  articles: Article[];
  transfers: TransferRule[];
  copyComponents: CopyComponent[];
  dogs: DogRecord[];
  linkHandoffs: LinkHandoff[];
  misspellings?: MisspellingAlias[];
}

// ---- Routing result ----

export type Dog = 'collie' | 'labrador' | 'terrier' | 'boxer';

// Stable action names asserted by the test harness.
export type ActionType =
  | 'safety_signpost' // distress / unsafe: calm line + signpost, no joke
  | 'safety_boundary' // explicit / abuse: one boundary line
  | 'health_answer' // dog health / food toxicity: general info, never transfer
  | 'open_discount_popup' // commercial: open OfferModal
  | 'link' // navigation / FAQ / breed / article: go to a destination
  | 'rules_answer' // how to play: in-chat rules record
  | 'faq_answer' // canonical FAQ answer
  | 'gk_answer' // known general-knowledge answer
  | 'gk_unknown' // general knowledge with no approved record: no guess
  | 'breed_answer' // fact about the active breed
  | 'self_breed' // Task 157: the ACTIVE dog recognises its OWN breed and remarks on it ("what breed are you", "are you a terrier", "tell me about your breed") -- per-dog, in character, never a card recital
  | 'orientation' // onboarding: what is this / what do I do / how does this work
  | 'identity' // sceptical / identity: are you real, are you AI, how can a dog type
  | 'offer_bark_game' // Task 28: play/game request -> offer the ready bark game (was fun_tease)
  | 'bark_explain' // Task 28: a question about the bark game -> the explanation (outranks the bark volley)
  | 'bark_exit' // Task 28: stop/enough/done while a game is running -> the exit line
  | 'emoji_only' // message is only unmapped emoji
  | 'bark' // bark-only message: mirror the bark at count + 1
  | 'bark_break' // the dog breaks the bark game into English (configured streak)
  | 'bark_ack' // post-break bark acknowledgement (rotation)
  | 'transfer' // specialist handoff to another dog
  | 'converse' // greeting / test / command / statement / random word
  | 'gibberish' // keyboard smash / punctuation / unresolved
  | 'fallback' // terminal catch-all: unresolved free text, approved line, never echoes raw input
  | 'clarifier' // bare help-seeking: ask whether it is a site question or a worry
  | 'neutral_refusal' // Task 34: PROTECTED_AFTERCARE decline of a blocked game/sales/comedy request (no safety surface)
  | 'goodbye' // Task 36: a farewell (whole-message match) -> the approved goodbye line
  | 'dismiss' // Task 165: a dismissal ("go away" / "leave me alone" / "get lost") -> the dog's own goodbye, then the chat closes (session cut-off). Boxer "stop" is excluded (his third-stop gag keeps that word).
  | 'out_of_scope' // Task 37: a valid question on a topic the site does not cover -> the approved out-of-scope line (never the repair ladder)
  | 'grief' // Task 58: a dog bereavement (died / lost / old-unwell) -> the gentle ':(' line; below urgent safety, above the loop, never reaches the loop
  | 'canned' // Task 80: a conversational bucket (B21-B39) matched on its column-D triggers; serves the specific responseId. Sits above the non-answer zone (gk_unknown / fallback), below every real route.
  | 'games_menu' // Task 123 fix: the B45 games menu. "are there games"/"play" serve B45-GAMELIST-01 ("Game?"); a following "yes" serves B45-GAMELIST-02 (the list). Serves the specific responseId, like canned.
  | 'ask_dogs' // Task 134b: B55. "dogs" asks rather than answering; a following yes goes to the breed hub.
  | 'ask_breeds' // Task 134b: B55. "breeds" asks; a following yes goes to the breed hub.
  | 'ask_games' // Task 134b: B56. "games" asks; a following yes serves the B45 list.
  | 'tricks_menu' // Task 134: B54. "tricks" serves COL-B54-TRICKS-01 ("I do tricks"); a following "yes" serves TRICKS-02 (the list). Serves the specific responseId, like canned.
  | 'paw' // Task 138: she offers a paw, served as a short clip rather than a line.
  | 'page_bio' // Task 140: "what is this page" -> the bio for the page the visitor is standing on (from usePathname). Fires only with a page context; never inside a protected state.
  | 'media_reply' // Task 140: a short owner-approved line served with a clip (birthday/car/balls). The specific line + clip is selected by responseId; never inside a protected state.
  | 'how_are_you' // Task 142: a personal question with no in-world answer (how are you / how old are you / are you human) -> one of three deflection clips at random.
  | 'good_boy' // Task 142: praise (good boy/girl/dog, clever girl, well done) -> the wagging-tail clip.
  | 'name_ack' // Task 142: a name statement (my name is X) -> acknowledge once with the visitor's name, then drop it (never stored).
  | 'name_deflect' // Task 142: an attempt to name HER (are you Dave / hello Dave / can I name you) -> she deflects without accepting or storing a name.
  | 'dog_lifespan' // Task 142: "how long do dogs live" (generic) -> a real general lifespan answer + the breed explorer link. ("how long do they live" stays B48.)
  | 'death_answer' // Task 142: the death cluster (can you die / are you dead / can i kill you) -> the in-character "I cannot die" line; persistence escalates to safeguarding.
  | 'god_answer' // Task 145: the god cluster (belief / which-god / generic) -> a real answer + the Anubis essay link. responseId selects GOD-BELIEF / GOD-WHICH / GOD-READ.
  | 'religion_dumb' // Task 145: a named religion (christian/hindu/...) -> she plays dumb, "whats <religion>?" (the matched word rides on `mirror`). Rhetorical, no state.
  | 'religion_self' // Task 145: "whats your religion" -> "im a dog".
  | 'maths_answer' // Task 145: an arithmetic expression -> the Collie answers easy sums correctly and hard ones absurdly wrong; the other three always guess absurdly. Computed in the assembler from the input and active dog.
  | 'dog_fact' // Task 134: B57. A dog fact chosen AT RANDOM, not by rotation, and not repeated until the session has used all twenty.
  | 'price_answer' // Task 49: a price question -> FAQ008's text in chat; NOT a MEANINGFUL_TOPIC, so the safety machine holds/refuses it like buying
  | 'buy_clarify' // Task 175: a bare get-question with no product/dog ("where can I get") -> "The card game?"; a following yes opens the pre-order. Blocked in aftercare like the rest of commerce.
  | 'transfer_request' // visitor asks to switch to a different dog
  | 'anatomy_redirect' // general anatomy question (no disclosure): redirect to a safe grown-up
  | 'breed_page' // confident named-breed match: link to that breed's page
  | 'breed_choice' // two breeds within the confidence gap: offer both
  | 'breed_hub' // a breed question with no breed named: the shared hub line
  | 'breed_best' // a superlative "best dog" question: the shared refuse-to-pick line
  | 'play_dead' // Task 78: visual trick -- the Collie image goes black until the next message
  | 'roll_over' // Task 78: visual trick -- the Collie image rotates 180deg, then :)
  | 'random_link' // Task 111: "fetch" -> a rotating Play/Learn/Discover destination link
  | 'game_start' // Task 115: enter one of the three in-chat games by name
  | 'game_move' // Task 115: a move inside the active game (a number / letter / guess)
  | 'game_exit' // Task 115: leave the active game ("stop"/"enough"/...)
  | 'boxer_cutoff'; // hidden ceiling reached

// Task 115: the in-chat games. Task 164 adds the Boxer's 'buttonpanel' (DO NOT PRESS THAT BUTTON).
export type GameId = 'ninesquare' | 'missingsheep' | 'kennelsketch' | 'treattrail' | 'missingbiscuit' | 'feedcookie' | 'buttonpanel';

export interface Resolution {
  layer: number; // 1..10 priority layer that won
  layerName: string;
  bucket: string | null; // B01..B14, or null for pure safety
  action: ActionType;
  // Optional detail depending on action:
  destinationId?: string;
  url?: string | null;
  transferTo?: Dog;
  faqId?: string;
  faqMatchStrength?: number; // FAQ match confidence: 0 = lone common token (no match), >=1 = a distinctive signal or full-phrase substring. Consumed by the outcome flag so a weak match reports as unmatched, not answered.
  gkId?: string;
  moderationId?: string;
  responseFamily?: string; // e.g. identity family 'F01'..'F10' for family-specific copy
  orientationFamily?: string; // orientation: pin the B15 pick to one family (e.g. 'R02' = the "what can I ask" lines) instead of the full B15 rotation. Used by the bare-help clarifier's "yes".
  barkCount?: number; // dog bark units to render this round (visitor count + 1, capped)
  note?: string;
  breedSlug?: string; // breed_page: the matched breed's slug
  breedTitle?: string; // breed_page: the matched breed's display title (for placeholder copy)
  breedOptions?: { title: string; slug: string; url: string }[]; // breed_choice: the two options
  griefCategory?: string; // Task 58: which grief scenario matched (GRIEF-01 died / GRIEF-02 lost / GRIEF-03 old-unwell); all serve the same ':(' line
  pageBioRoute?: string; // Task 140: the pathname the page-bio answer is for; the assembler resolves the bio and substitutes {{BREED}} from the slug
  personName?: string; // Task 142: the visitor's name from a name statement, capitalised for a one-off acknowledgement. NEVER stored on the session.
  mirror?: string; // Task 76: the greeting word to echo back for a B09 greeting (the only response built from the input)
  responseId?: string; // Task 80: the specific canned-conversation row (B21-B39) the input matched; the assembler serves that row's template
  // Task 115: game routing. `game` is the game a start/move/exit targets. The engine processes the move
  // before assembly and fills `gameLine` (the B4x responseId to serve), `gameText` (that copy, with
  // {{WORD}}/{{ANSWER}} substituted) and `gameDisplay` (the monospace board / tiles / drawing).
  game?: GameId;
  gameLine?: string;
  gameText?: string;
  gameDisplay?: string;
  gameMedia?: { src: string; alt: string }; // Task 149: a clip served with a game turn (feed-cookie, every fifth)
  gameFollowUp?: string; // Task 151: a second message served after a beat (the cookie give-up "zzz")
  gameFollowUpMedia?: { src: string; alt: string }; // Task 166: a clip carried on the follow-up (a red cookie's clip arrives with the reason, a beat after his reaction)
  gameCorrect?: string; // Task 178 §4: a correct answer -- the word to celebrate (the UI fires the win animation)
}
