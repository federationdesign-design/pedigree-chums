// Pick a Chum: how to open the pre-order / discount pop-up (Run 0 task 5).
//
// The pop-up is the site's existing OfferModal. It is owned by OfferLauncher,
// which is mounted once in app/layout.tsx and listens on the window for a
// CustomEvent. There is NO React context, no provider and no exported open
// function: the window event is the only public API, and it works from any
// page (including a self-contained Pick a Chum component).
//
// Components involved (do not import them from here; this is a reference):
//   - components/Offer/OfferModal.tsx    the email-capture modal (portaled to body)
//   - components/Offer/OfferLauncher.tsx mounted in app/layout.tsx, owns open state,
//                                        listens for 'pc:open-offer'
//   - components/Offer/OfferCta.tsx      an existing button that fires the same event
//   - components/Offer/startCheckout.ts  the separate Stripe pre-order path
//
// Events on window:
//   'pc:open-offer'    -> opens the OfferModal (fire this)
//   'pc:offer-success' -> dispatched by the modal after a successful subscribe
//
// COMMERCIAL MODEL: confirmed by Steve (see ./campaign.ts). The live model is
// correct: retail £9.99, pre-release £6.99 (30% off) via the Stripe pre-order,
// plus email capture for a launch-day code. Buying intent (bucket B01) opens
// this OfferModal by calling openDiscountPopup() below. Do not hard-code prices;
// read them from campaign.ts.

/** The window CustomEvent name the OfferLauncher listens for. */
export const OPEN_OFFER_EVENT = 'pc:open-offer';

/** The window Event name the OfferModal dispatches after a successful subscribe. */
export const OFFER_SUCCESS_EVENT = 'pc:offer-success';

/**
 * Open the pre-order / discount pop-up from anywhere on the client.
 * No-op during SSR. This is the action behind destination DST001 (Get 30% Off).
 */
export function openDiscountPopup(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_OFFER_EVENT));
}
