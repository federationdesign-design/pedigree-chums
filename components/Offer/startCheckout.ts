// Shared helper used by every "Pre-order now" button (pitch panel CTA, the
// offer modal, and the sticky card). It asks the server to create a Checkout
// Session and then sends the visitor to Stripe's hosted payment page. On
// success the browser navigates away, so callers only need to handle the error
// case and reset their own loading state.
export async function startCheckout(): Promise<void> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });

  const data: { url?: string; error?: string } = await res
    .json()
    .catch(() => ({}));

  if (!res.ok || !data.url) {
    throw new Error(data.error || "Could not start checkout. Please try again.");
  }

  window.location.href = data.url;
}
