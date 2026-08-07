// Shared helper used by every "Pre-order now" button (pitch panel CTA and the
// sticky card). Checkout is now embedded on /preorder rather than a hosted
// redirect, so this simply sends the visitor to that page, where Stripe's
// EmbeddedCheckout mounts. Kept as a single helper so every entry point routes
// the same way.
export async function startCheckout(): Promise<void> {
  window.location.href = "/preorder";
}
