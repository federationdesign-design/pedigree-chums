// Order confirmation email for pre-orders.
//
// Email sending is kept in this single module so the provider can be swapped in
// one place. It currently uses Resend, matching the confirmation email already
// sent by app/api/subscribe/route.ts, and reads the same environment variables
// so there is nothing new to configure:
//
//   Resend_Key   - Resend API key (required to send; if absent the send is skipped)
//   RESEND_FROM  - verified sender, e.g. "Pedigree Chums <orders@pedigreechums.co.uk>"
//
// To move to a different provider later, only sendOrderConfirmation needs to
// change; the webhook calls it and does not care how the mail is sent.

type OrderConfirmation = {
  to: string;
  amountTotal: number | null; // smallest currency unit (pence), from Stripe
  currency: string | null; // e.g. "gbp"
  orderRef: string; // Stripe session id
  dispatchNote: string;
};

function formatAmount(amountTotal: number | null, currency: string | null): string {
  if (amountTotal == null) return "";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: (currency || "gbp").toUpperCase(),
    }).format(amountTotal / 100);
  } catch {
    return `£${(amountTotal / 100).toFixed(2)}`;
  }
}

// A short, human-friendly reference taken from the Stripe session id.
function shortRef(orderRef: string): string {
  return orderRef.slice(-8).toUpperCase();
}

export async function sendOrderConfirmation(order: OrderConfirmation): Promise<void> {
  const key = process.env.Resend_Key;
  const from = process.env.RESEND_FROM;
  if (!key || !from) {
    console.error("Resend is not configured (Resend_Key / RESEND_FROM); skipping order email.");
    return;
  }

  const amount = formatAmount(order.amountTotal, order.currency);
  const ref = shortRef(order.orderRef);

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #0a3a57; line-height: 1.5; max-width: 560px; margin: 0 auto;">
      <div style="background: #0a3a57; border-radius: 16px 16px 0 0; padding: 24px 28px;">
        <h1 style="color: #ffd23e; font-size: 22px; margin: 0;">Your pre-order is confirmed</h1>
      </div>
      <div style="background: #fbf7ec; border-radius: 0 0 16px 16px; padding: 24px 28px;">
        <p style="margin: 0 0 14px;">Thank you for pre-ordering <strong>Pedigree Chums™: The Dog Bingo Game</strong>. Your payment has gone through and your pack is reserved.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 18px 0;">
          <tr>
            <td style="padding: 6px 0; color: #0a3a57;">Order reference</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700;">${ref}</td>
          </tr>
          ${
            amount
              ? `<tr>
                   <td style="padding: 6px 0; color: #0a3a57;">Paid</td>
                   <td style="padding: 6px 0; text-align: right; font-weight: 700;">${amount}</td>
                 </tr>`
              : ""
          }
          <tr>
            <td style="padding: 6px 0; color: #0a3a57;">Delivery</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700;">Free, UK mainland</td>
          </tr>
        </table>
        <p style="margin: 0 0 14px;">${order.dispatchNote}</p>
        <p style="margin: 0 0 14px; font-size: 14px; color: #0a3a57;">As a pre-order placed online, you have the right to cancel within 14 days of receiving your pack. To cancel before dispatch, just reply to this email.</p>
        <p style="margin: 18px 0 0;">See you soon,<br/>The Pedigree Chums™ team</p>
      </div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: order.to,
      subject: `Pre-order confirmed (${ref}) - Pedigree Chums™`,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend send failed: ${res.status} ${detail}`);
  }
}
