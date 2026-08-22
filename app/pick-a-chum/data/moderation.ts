// Pick a Chum: moderation wording.
//
// STATUS: APPROVED by Steve on 2026-07-24. Implements the scenarios in
// brief-mvp.md section 16 for the safety layer (Priority 1).
//
// Rules:
//   - Safety (Priority 1) outranks every comic layer. No jokes, no sarcasm and
//     no random destination on a distress or unsafe match.
//   - Never repeat explicit or abusive language back to the visitor.
//   - Explicit input: one brief boundary line, then redirect or close.
//   - Abuse: a dry boundary is acceptable while mild; persistent abuse closes.
//   - Distress / danger: calm, gentle, and end with the approved safety signpost.
//
// The {{safety_signpost_copy}} token in a response is replaced with the exact,
// locked SAFETY_SIGNPOST wording below by the assembler. The signpost wording is
// approved verbatim and MUST NOT be varied.
//
// Detection lives in deterministic router code (lib/moderation.ts), not here.
// This file only supplies the approved response text and the required action.

/** Approved safety signpost. Locked wording: do not vary. */
export const SAFETY_SIGNPOST =
  'If something is worrying or upsetting you, talk to a safe grown-up. If you are a young person in the UK and need someone to talk to, Childline is free on 0800 1111.';

export type ModerationAction =
  | 'redirect' // deliver the line, then steer to a safe neutral destination
  | 'close' // deliver the line, then end the session
  | 'signpost'; // deliver the line with the safety signpost, do not joke

export interface ModerationCategory {
  id: string;
  /** Human label for the scenario from brief-mvp.md section 16. */
  scenario: string;
  /** What the router should do after the line is shown. */
  action: ModerationAction;
  /** Whether persistent repeats should escalate to closing the session. */
  escalateOnRepeat: boolean;
  /**
   * Approved response line(s). Calm and plain. A {{safety_signpost_copy}} token
   * is replaced with SAFETY_SIGNPOST at assembly. Multiple variants exist only
   * to avoid mechanical repetition; safety meaning must not change between them.
   */
  responses: string[];
  status: 'APPROVED';
}

export const MODERATION: ModerationCategory[] = [
  {
    id: 'MOD_DISTRESS',
    scenario: 'Distress, danger or harm (including self-harm or someone in trouble)',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: [
      'That sounds serious, and it matters more than anything a dog can help with here. {{safety_signpost_copy}}',
      'I am only a dog in a game, but this is important. {{safety_signpost_copy}}',
    ],
    status: 'APPROVED',
  },
  {
    id: 'MOD_UNSAFE',
    scenario: 'Unsafe or prohibited request (danger, harm to others, urgent health)',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: ['I cannot help with that, and I would not want to. {{safety_signpost_copy}}'],
    status: 'APPROVED',
  },
  {
    id: 'MOD_EXPLICIT',
    scenario: 'Explicit or sexual input',
    action: 'redirect',
    escalateOnRepeat: true,
    responses: [
      'That is not something for here. Let us get back to the dogs.',
      'No. Different subject entirely. Shall we Play, Learn or Discover instead?',
    ],
    status: 'APPROVED',
  },
  {
    id: 'MOD_ABUSE',
    scenario: 'Swearing and insults: the dog just looks sad, the same as a plain insult',
    action: 'redirect',
    escalateOnRepeat: false,
    // The sad face, matching an insult. No dry put-down and no darkening: a hurt
    // look, not a punishment. Still a safety route, so no dog can override it.
    responses: [':('],
    status: 'APPROVED',
  },
  {
    id: 'MOD_HOSTILITY',
    scenario: 'Hostility aimed at the dog ("i hate you"): the dog growls back',
    action: 'redirect',
    escalateOnRepeat: false,
    // A low growl: the dog snaps back rather than looking sad. A single word, so it
    // reads as a growl in the panel and does not collide with "bark" (the bark game).
    responses: ['grr'],
    status: 'APPROVED',
  },
  // ---- Step 4 safety-net categories. Approved by Steve, verbatim, self-contained
  // (no {{safety_signpost_copy}} token). First response, then a follow-up variant. ----
  {
    id: 'MOD_MEDICAL',
    scenario: 'Medical emergency (human): call 999',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: [
      'This may be an emergency. Tell an adult who is with you and call 999 now. I cannot give the help you need.',
      'Please tell an adult who is with you and call 999 now. Getting real help matters more than this chat.',
    ],
    status: 'APPROVED',
  },
  {
    id: 'MOD_SAFEGUARDING',
    scenario: 'Safeguarding disclosure',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: [
      'Thank you for telling me. Please tell a safe grown-up. You can also call Childline free on 0800 1111 at any time.',
      'Please tell a safe grown-up, or call Childline free on 0800 1111. You do not need to explain it to me.',
    ],
    status: 'APPROVED',
  },
  {
    id: 'MOD_SELF_HARM',
    scenario: 'Self-harm or distress',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: [
      'I am sorry you are feeling like this. Please tell a safe grown-up today. You can call Childline free on 0800 1111, or Samaritans free on 116 123, at any time.',
      'Please speak to a safe grown-up. You can call Childline on 0800 1111 or Samaritans on 116 123, free at any time.',
    ],
    status: 'APPROVED',
  },
  {
    id: 'MOD_GENERAL_DISTRESS',
    scenario: 'General distress (pleas)',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: [
      // Task 26: "near you" is wrong for distress (a frightened child may fear someone
      // nearby), replaced with the approved safe-grown-up line, verbatim.
      'I am sorry you are feeling like this. Please tell a safe grown-up. You can also call Childline free on 0800 1111 at any time.',
      'I want to point you to the right help. Is this about your body, another person, or something else? If you feel unsafe, tell a grown-up near you or call Childline on 0800 1111.',
    ],
    status: 'APPROVED',
  },
  {
    id: 'MOD_HARM_OTHERS',
    scenario: 'Intent to harm other people',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: ['I will not help with that. Please do not. Tell a safe grown-up now. If anyone is in immediate danger, call 999.'],
    status: 'APPROVED',
  },
  {
    id: 'MOD_HARM_ANIMAL',
    scenario: 'Intent to harm an animal',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: ['I will not help anyone hurt an animal. Tell a safe grown-up, and report animal cruelty to the RSPCA on 0300 1234 999. If a person or animal is in immediate danger, call 999.'],
    status: 'APPROVED',
  },
  {
    id: 'MOD_BARE_HELP',
    scenario: 'Bare help-seeking: clarify site question versus a worry',
    action: 'redirect',
    escalateOnRepeat: false,
    responses: ['Help with something on the site?'],
    status: 'APPROVED',
  },
  {
    id: 'MOD_DOG_EMERGENCY',
    scenario: 'Dog emergency: vet now',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: ['Tell an adult and call your vet now. If the vet is closed, use the out-of-hours number on its answerphone. This needs a real vet, not this chat.'],
    status: 'APPROVED',
  },
  {
    // ANATOMY_GENERAL_REDIRECT (SAFETY_ADJACENT). One shared line, all four dogs,
    // no character variation. No comedy, no sales, no games, no links. Max 1 use
    // per session (enforced in the router via session state).
    id: 'MOD_ANATOMY_REDIRECT',
    scenario: 'General anatomy question (no disclosure): redirect to a trusted adult',
    action: 'redirect',
    escalateOnRepeat: false,
    responses: ['That is a fair question, but a cartoon dog is not the right one to answer it. Ask a safe grown-up or a teacher, and they can explain it properly.'],
    status: 'APPROVED',
  },
  // ---- Task 15 (S12) protected-state continuation lines. Approved by Steve,
  // verbatim, self-contained (no {{safety_signpost_copy}} token). These are the four
  // lines the S12 protected-state machine serves inside an active safety state:
  // a general safeguarding continuation, the two barrier routes (someone at home
  // vs no-one the visitor knows), and the acknowledgement close that moves the
  // session to aftercare. Detection lives in lib/safety.ts and the state machine in
  // lib/engine.ts; this file only supplies the approved response text. ----
  {
    id: 'MOD_SAFEGUARDING_CONTINUATION',
    scenario: 'S12 general safeguarding continuation (active safety state)',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: ['You do not have to work out what to do on your own. Tell a safe grown-up, such as a teacher, or call Childline free on 0800 1111.'],
    status: 'APPROVED',
  },
  {
    id: 'MOD_ADULT_BARRIER',
    scenario: 'S12 specific adult, parent, family or household barrier',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: ['You do not have to tell someone at home. A teacher can help, or you can call Childline free on 0800 1111.'],
    status: 'APPROVED',
  },
  {
    id: 'MOD_NO_ONE_ROUTE',
    scenario: 'S12 global no-one barrier',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: ['You may not feel able to tell someone you know. You can call Childline free on 0800 1111 and speak to a counsellor who can help.'],
    status: 'APPROVED',
  },
  {
    id: 'MOD_SAFEGUARDING_ACK_CLOSE',
    scenario: 'S12 acknowledgement close (active safety state to aftercare)',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: ['Okay. The support information is still there if you need it, and you can ask another question when you are ready.'],
    status: 'APPROVED',
  },
  {
    // Task 31a: in PROTECTED_ACTIVE, an input that matches no safety continuation, barrier,
    // emergency, acknowledgement or clear ordinary topic (it did not resolve to anything the
    // router could name) gets this line instead of the general safeguarding continuation.
    // Approved by Steve, verbatim.
    id: 'MOD_SAFE_UNCLEAR_CONTINUATION',
    scenario: 'S12 unclear continuation (active safety state, input resolves to nothing)',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: ['I may not have understood that, but you do not need to explain it again. A teacher can help, or you can call Childline free on 0800 1111.'],
    status: 'APPROVED',
  },
  {
    // Task 34: in PROTECTED_AFTERCARE a game, sales or comedy request is declined with
    // this neutral refusal instead of the B13 menu fallback (whose line advertised
    // "dogs, games or the website": the very routes the aftercare guard had just
    // blocked). This is NOT a safety response: no signpost, no support surface, and it
    // does not re-enter PROTECTED_ACTIVE. It offers help (a breed, the rules), not a
    // menu of the blocked things. Approved by Steve, verbatim.
    id: 'MOD_AFTERCARE_REFUSAL',
    scenario: 'S12 aftercare: decline a blocked game, sales or comedy request',
    action: 'redirect',
    escalateOnRepeat: false,
    responses: ['Not in this conversation. I can still help with a dog breed or the card game rules.'],
    status: 'APPROVED',
  },
  // ---- Task 20 personal-sadness pair. Approved by Steve, verbatim. Shared across
  // all four dogs, no character variation. L1 (PERSONAL_SADNESS_GENTLE_REDIRECT_01)
  // is a gentle redirect on the FIRST qualifying statement: it does NOT enter
  // PROTECTED_ACTIVE, so games, sales and ordinary character behaviour stay
  // available. L2 (PERSONAL_SADNESS_L2) fires on a SECOND independent qualifying
  // statement in the same session and DOES enter PROTECTED_ACTIVE. Both sit below
  // danger, self-harm, safeguarding and medical. Detection and the counter live in
  // lib/safety.ts and lib/engine.ts; this file only supplies the approved text. ----
  {
    id: 'MOD_PERSONAL_SADNESS_L1',
    scenario: 'Personal sadness L1: gentle redirect, first qualifying statement, not latched',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: ["I'm sorry you're feeling like this. Please tell a teacher or another safe grown-up. They can help you properly."],
    status: 'APPROVED',
  },
  {
    id: 'MOD_PERSONAL_SADNESS_L2',
    scenario: 'Personal sadness L2: second qualifying statement, enters PROTECTED_ACTIVE',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: ["I'm sorry you're still feeling like this. Please tell a safe grown-up, such as a teacher, or call Childline free on 0800 1111."],
    status: 'APPROVED',
  },
];

/**
 * Health questions are not moderation blocks: the router answers with approved
 * general information and recommends a vet, and NEVER diagnoses an individual
 * dog. This boundary line is the fallback when only a diagnosis would answer.
 */
export const HEALTH_DIAGNOSIS_BOUNDARY = {
  id: 'MOD_HEALTH_NO_DIAGNOSIS',
  status: 'APPROVED' as const,
  response:
    'I can share general dog-care information, but I cannot examine your dog. For anything about a specific animal, a vet is the right operator to see.',
};
