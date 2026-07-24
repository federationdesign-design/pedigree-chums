// Pick a Chum: central campaign configuration.
//
// The brief (section 11.1) requires price, launch date and campaign wording to
// live in ONE central place, never repeated inside response text. Response
// templates reference the placeholder tokens below ({{price_answer}} etc.) and
// the assembler fills them from here.
//
// COMMERCIAL MODEL: confirmed by Steve. The live site is correct. Retail £9.99,
// pre-release discount price £6.99 (the "30% off" is that £9.99 -> £6.99
// relationship), free UK mainland delivery. The discount is taken by pre-ordering
// online before launch via the Stripe pre-order, and email sign-ups also receive
// a code and the release date on launch day. So the Collie CAN point at the live
// pre-order, not only a mailing list.
//
// Buying intent (bucket B01) opens the existing OfferModal, via
// openDiscountPopup() in ./discount-popup.ts (window event 'pc:open-offer').
//
// Still unconfirmed: the exact launch DATE (the site says "launching very soon").
// See agent/NEEDS_STEVE.md and PLACEHOLDERS.md.

export type CampaignState = 'PRE_LAUNCH' | 'LIVE' | 'SOLD_OUT' | 'PAUSED';

export interface CampaignConfig {
  state: CampaignState;
  /** The commercial model (prices, discount, delivery) is confirmed. */
  confirmed: boolean;
  /** The launch date specifically is not yet known. */
  launchDateConfirmed: boolean;
  currency: string;
  retailPrice: string;
  discountedPrice: string;
  discountLabel: string;
  /** Not public yet. */
  launchDate: string | null;
  /** The action buying intent (B01) triggers. */
  preLaunchAction: 'open-offer-modal';
  /** Placeholder-token answers referenced by response templates. */
  answers: {
    price_answer: string;
    launch_answer: string;
    delivery_answer: string;
    discount_answer: string;
  };
}

export const CAMPAIGN: CampaignConfig = {
  state: 'PRE_LAUNCH',
  confirmed: true,
  launchDateConfirmed: false,
  currency: 'GBP',
  retailPrice: '£9.99',
  discountedPrice: '£6.99',
  discountLabel: '30% off (£9.99 down to £6.99)',
  launchDate: null,
  preLaunchAction: 'open-offer-modal',
  answers: {
    price_answer:
      'The retail price is £9.99, with a pre-launch price of £6.99 if you pre-order before launch, and free UK mainland delivery.',
    launch_answer:
      'We are launching very soon. The exact date is not public yet, so pre-order now to lock in the discount and we will email you the release date and your code.',
    delivery_answer: 'Free UK mainland delivery is included on pre-orders.',
    discount_answer:
      'Pre-order before launch to get the game for £6.99 instead of £9.99, about 30% off, with a code emailed on launch day.',
  },
};
