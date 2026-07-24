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

// The full data bundle the engine consumes. Hand-authored records (campaign,
// rules, moderation) are imported directly by the engine since they are plain
// TS; only the generated JSON is injected here.
export interface ChumData {
  collieResponses: CollieResponse[];
  destinations: Destination[];
  faq: FaqRecord[];
  generalKnowledge: GeneralKnowledge[];
  articles: Article[];
  transfers: TransferRule[];
  copyComponents: CopyComponent[];
  dogs: DogRecord[];
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
  | 'transfer' // specialist handoff to another dog
  | 'converse' // greeting / test / command / statement / random word
  | 'gibberish' // keyboard smash / punctuation / unresolved
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
  gkId?: string;
  moderationId?: string;
  note?: string;
}
