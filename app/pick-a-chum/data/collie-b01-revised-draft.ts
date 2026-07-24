// Pick a Chum: DRAFT revised Collie B01 (buying) responses.
//
// STATUS: DRAFT FOR APPROVAL at STOP 1. Not final. The workbook's live B01 bank
// was written for a mailing-list-only pre-launch ("Not yet. Buying comes later").
// Steve confirmed the live pre-order model, so these revisions let the Collie
// point at the actual pre-order: £6.99 (30% off £9.99), free UK mainland
// delivery, opened via the OfferModal (destination DST001, openDiscountPopup()).
//
// Prices come from campaign.ts placeholder tokens where possible; no launch DATE
// is stated (still TBC). Once approved, these paste into the workbook's Collie
// Responses B01 rows so the workbook stays the single editing surface.

export interface CollieResponseDraft {
  responseId: string;
  subtag: string;
  template: string;
  defaultRoute: string;
  animationCue: string;
  status: 'DRAFT_FOR_APPROVAL';
}

export const COLLIE_B01_REVISED_DRAFT: CollieResponseDraft[] = [
  {
    responseId: 'B01-R01',
    subtag: 'General purchase interest',
    template:
      'Aye, good instinct. You can pre-order now and lock the price at £6.99, a tidy 30% off the £9.99, with free UK mainland delivery. I will open the form.',
    defaultRoute: 'Get 30% Off',
    animationCue: 'EARS_UP',
    status: 'DRAFT_FOR_APPROVAL',
  },
  {
    responseId: 'B01-R02',
    subtag: 'Can I buy now?',
    template:
      'You can. Pre-order is open: £6.99 instead of £9.99, delivery free on the UK mainland. Buying before launch is the organised move, so let us do the organised thing.',
    defaultRoute: 'Get 30% Off',
    animationCue: 'EARS_UP',
    status: 'DRAFT_FOR_APPROVAL',
  },
  {
    responseId: 'B01-R03',
    subtag: 'Price question',
    template:
      '{{price_answer}} The sensible action is to pre-order at £6.99 now and be done with it. I will open it.',
    defaultRoute: 'Get 30% Off',
    animationCue: 'HEAD_TILT_SMALL',
    status: 'DRAFT_FOR_APPROVAL',
  },
  {
    responseId: 'B01-R04',
    subtag: 'Discount question',
    template:
      '{{discount_answer}} No code to hunt for: pre-order and the £6.99 is applied. Measurable, and difficult to argue with.',
    defaultRoute: 'Get 30% Off',
    animationCue: 'EARS_UP',
    status: 'DRAFT_FOR_APPROVAL',
  },
  {
    responseId: 'B01-R05',
    subtag: 'Launch date',
    template:
      '{{launch_answer}} I will not invent a date I do not have. What I can do is secure your £6.99 now.',
    defaultRoute: 'Get 30% Off',
    animationCue: 'HEAD_TILT_SMALL',
    status: 'DRAFT_FOR_APPROVAL',
  },
  {
    responseId: 'B01-R06',
    subtag: 'Pre-order request',
    template:
      'The correct department, finally. Pre-order is open at £6.99, 30% off, free UK mainland delivery. Opening the form.',
    defaultRoute: 'Get 30% Off',
    animationCue: 'PUPPY_EYES',
    status: 'DRAFT_FOR_APPROVAL',
  },
  {
    responseId: 'B01-R07',
    subtag: 'Sign-up command',
    template:
      'An instruction with an outcome. I will open the pre-order and discount sign-up. Put your email to work.',
    defaultRoute: 'Get 30% Off',
    animationCue: 'PUPPY_EYES',
    status: 'DRAFT_FOR_APPROVAL',
  },
  {
    responseId: 'B01-R08',
    subtag: 'Delivery question',
    template:
      '{{delivery_answer}} While we are being practical, pre-order at £6.99 and the delivery sorts itself.',
    defaultRoute: 'Get 30% Off',
    animationCue: 'HEAD_TILT_SMALL',
    status: 'DRAFT_FOR_APPROVAL',
  },
  {
    responseId: 'B01-R09',
    subtag: 'Pack interest',
    template:
      'Excellent judgement. Pre-order now and it costs £6.99 rather than £9.99, delivered free on the UK mainland. I will open it.',
    defaultRoute: 'Get 30% Off',
    animationCue: 'POSITIVE_RESPONSE',
    status: 'DRAFT_FOR_APPROVAL',
  },
  {
    responseId: 'B01-R10',
    subtag: 'Shop location',
    template:
      'The pre-order is the door that works right now: £6.99, 30% off, free UK mainland delivery. I will take you straight to it.',
    defaultRoute: 'Get 30% Off',
    animationCue: 'HEAD_TILT_SMALL',
    status: 'DRAFT_FOR_APPROVAL',
  },
];
