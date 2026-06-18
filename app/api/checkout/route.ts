import Stripe from "stripe";
import { NextResponse } from "next/server";

// POST /api/checkout
//
// Creates a Stripe Checkout Session for a single pre-order of the game and
// returns its hosted URL. The client redirects the visitor to that URL.
// Everything sensitive is read from environment variables (set in Vercel,
// nothing committed):
//
//   STRIPE_SECRET_KEY         - Stripe secret key (required)
//   STRIPE_PREORDER_PRICE_ID  - the Price id for the pre-order (required), e.g. price_...
//   STRIPE_SHIPPING_RATE_ID   - the £0 "Free UK mainland delivery" shipping rate (optional), e.g. shr_...
//   STRIPE_AUTOMATIC_TAX      - "true" to enable Stripe Tax (only if Tax + an origin address are set up)
//   PREORDER_DISPATCH_NOTE    - the expected-dispatch line shown before payment
//
// The Price should have its tax behaviour set to "inclusive" so the £6.99 the
// customer sees is exactly what they pay (VAT is the 1/6 inside it).

export const runtime = "nodejs";

const DEFAULT_DISPATCH_NOTE =
  "This is a pre-order. We will email you a dispatch confirmation as soon as your pack is on its way.";

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PREORDER_PRICE_ID;

  if (!key || !priceId) {
    console.error("Stripe checkout is not configured (STRIPE_SECRET_KEY / STRIPE_PREORDER_PRICE_ID).");
    return NextResponse.json(
      { error: "Pre-orders are not available just yet. Please try again shortly." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(key);
  const origin = new URL(req.url).origin;
  const shippingRate = process.env.STRIPE_SHIPPING_RATE_ID;
  const automaticTax = process.env.STRIPE_AUTOMATIC_TAX === "true";
  const dispatchNote = process.env.PREORDER_DISPATCH_NOTE || DEFAULT_DISPATCH_NOTE;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      shipping_address_collection: { allowed_countries: ["GB"] },
      ...(shippingRate ? { shipping_options: [{ shipping_rate: shippingRate }] } : {}),
      billing_address_collection: "auto",
      automatic_tax: { enabled: automaticTax },
      custom_text: {
        submit: {
          // Shown directly above the pay button so the dispatch expectation is
          // clear before payment (a requirement for pre-orders).
          message: dispatchNote.slice(0, 1200),
        },
      },
      success_url: `${origin}/preorder/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/preorder/cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session error:", err);
    return NextResponse.json(
      { error: "Sorry, we could not start checkout. Please try again." },
      { status: 502 }
    );
  }
}
