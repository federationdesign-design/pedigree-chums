import Stripe from "stripe";
import { NextResponse } from "next/server";
import { sendOrderConfirmation } from "../../../lib/orderEmail";

// POST /api/stripe-webhook
//
// Stripe calls this when events happen. We verify the signature, then on a
// completed checkout we send the branded confirmation email. The Stripe
// Dashboard remains the order book / "to ship" list, so no database is needed
// for launch.
//
//   STRIPE_SECRET_KEY      - Stripe secret key (required)
//   STRIPE_WEBHOOK_SECRET  - signing secret for THIS endpoint (required), e.g. whsec_...
//   PREORDER_DISPATCH_NOTE - reused in the email so the dispatch line matches checkout
//
// Add the endpoint in Stripe (Developers > Webhooks) pointing at
// https://www.pedigreechums.co.uk/api/stripe-webhook and subscribe to
// "checkout.session.completed". Copy the signing secret into Vercel.

export const runtime = "nodejs";

const DEFAULT_DISPATCH_NOTE =
  "This is a pre-order. We will email you a dispatch confirmation as soon as your pack is on its way.";

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!key || !whSecret) {
    console.error("Stripe webhook is not configured (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET).");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const stripe = new Stripe(key);
  const sig = req.headers.get("stripe-signature");
  const body = await req.text(); // raw body is required for signature verification

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig ?? "", whSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const to = session.customer_details?.email || session.customer_email || "";

    if (to) {
      try {
        await sendOrderConfirmation({
          to,
          amountTotal: session.amount_total,
          currency: session.currency,
          orderRef: session.id,
          dispatchNote: process.env.PREORDER_DISPATCH_NOTE || DEFAULT_DISPATCH_NOTE,
        });
      } catch (err) {
        // Best effort: never fail the webhook because of an email problem, or
        // Stripe will retry the whole event. Log it for follow-up instead.
        console.error("Order confirmation email failed:", err);
      }
    } else {
      console.error("checkout.session.completed had no customer email:", session.id);
    }
  }

  return NextResponse.json({ received: true });
}
