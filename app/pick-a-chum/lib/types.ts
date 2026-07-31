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
  | 'out_of_scope' // Task 37: a valid question on a topic the site does not cover -> the approved out-of-scope line (never the repair ladder)
  | 'grief' // Task 58: a dog bereavement (died / lost / old-unwell) -> the gentle ':(' line; below urgent safety, above the loop, never reaches the loop
  | 'canned' // Task 80: a conversational bucket (B21-B39) matched on its column-D triggers; serves the specific responseId. Sits above the non-answer zone (gk_unknown / fallback), below every real route.
  | 'price_answer' // Task 49: a price question -> FAQ008's text in chat; NOT a MEANINGFUL_TOPIC, so the safety machine holds/refuses it like buying
  | 'transfer_request' // visitor asks to switch to a different dog
  | 'anatomy_redirect' // general anatomy question (no disclosure): redirect to a safe grown-up
  | 'breed_page' // confident named-breed match: link to that breed's page
  | 'breed_choice' // two breeds within the confidence gap: offer both
  | 'breed_hub' // a breed question with no breed named: the shared hub line
  | 'breed_best' // a superlative "best dog" question: the shared refuse-to-pick line
  | 'play_dead' // Task 78: visual trick -- the Collie image goes black until the next message
  | 'roll_over' // Task 78: visual trick -- the Collie image rotates 180deg, then :)
  | 'random_link' // Task 111: "fetch" -> a rotating Play/Learn/Discover destination link
  | 'boxer_cutoff'; // hidden ceiling reached

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
  barkCount?: number; // dog bark units to render this round (visitor count + 1, capped)
  note?: string;
  breedSlug?: string; // breed_page: the matched breed's slug
  breedTitle?: string; // breed_page: the matched breed's display title (for placeholder copy)
  breedOptions?: { title: string; slug: string; url: string }[]; // breed_choice: the two options
  griefCategory?: string; // Task 58: which grief scenario matched (GRIEF-01 died / GRIEF-02 lost / GRIEF-03 old-unwell); all serve the same ':(' line
  mirror?: string; // Task 76: the greeting word to echo back for a B09 greeting (the only response built from the input)
  responseId?: string; // Task 80: the specific canned-conversation row (B21-B39) the input matched; the assembler serves that row's template
}
