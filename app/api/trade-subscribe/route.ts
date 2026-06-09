import { NextResponse } from "next/server";

// POST /api/trade-subscribe
//
// Trade / wholesale enquiry handler. Sibling of /api/subscribe, but built for
// retail buyers rather than consumers:
//   - adds the contact to MailerLite with the `trade` field set to "Yes" (so
//     every trade lead is filterable, kept apart from the consumer list)
//   - the Resend email is a LEAD NOTIFICATION to you (hello@), not an
//     auto-reply to the buyer
//
// Environment variables (set in Vercel; shares the consumer ones where it can):
//   Mailerlite_Key            - MailerLite API token (required)            [shared]
//   MAILERLITE_TRADE_FIELD    - custom field key for the trade flag (optional, default "trade")
//   MAILERLITE_TRADE_GROUP_ID - optional group id, if you later make a Trade group
//   Resend_Key                - Resend API key (optional, enables the notification) [shared]
//   RESEND_FROM               - verified sender, e.g. "Pedigree Chums <hello@pedigreechums.co.uk>" [shared]
//   RESEND_TO                 - where lead notifications go (optional, default hello@pedigreechums.co.uk)

type Body = {
  company?: string;
  name?: string;
  email?: string;
  businessType?: string;
  consent?: boolean;
};

const esc = (s: string) =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const company = (body.company || "").trim();
  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const businessType = (body.businessType || "").trim();
  const consent = Boolean(body.consent);

  if (!company || !name) {
    return NextResponse.json(
      { error: "Please give your shop name and a contact name." },
      { status: 400 }
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }
  if (!consent) {
    return NextResponse.json({ error: "Consent is required." }, { status: 400 });
  }

  const mlKey = process.env.Mailerlite_Key;
  if (!mlKey) {
    console.error("Mailerlite_Key is not set.");
    return NextResponse.json(
      { error: "Trade enquiries are not configured yet. Please email hello@pedigreechums.co.uk." },
      { status: 503 }
    );
  }

  // 1. Add to MailerLite (primary action). Upserts on email, so a repeat
  // enquiry just updates the existing record. The trade field is what keeps
  // these leads separable from the consumer launch list.
  const tradeField = process.env.MAILERLITE_TRADE_FIELD || "trade";
  const mlBody: Record<string, unknown> = {
    email,
    fields: {
      name,
      company,
      [tradeField]: "Yes",
    },
  };
  const mlGroup = process.env.MAILERLITE_TRADE_GROUP_ID;
  if (mlGroup) {
    mlBody.groups = [mlGroup];
  }

  try {
    const mlRes = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mlKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(mlBody),
    });
    if (!mlRes.ok) {
      console.error("MailerLite trade subscribe failed:", mlRes.status, await mlRes.text());
      return NextResponse.json(
        { error: "Sorry, something went wrong sending your enquiry. Please try again." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("MailerLite trade subscribe error:", err);
    return NextResponse.json(
      { error: "Sorry, something went wrong. Please try again." },
      { status: 502 }
    );
  }

  // 2. Notify you of the lead via Resend (best effort; a mail failure does not
  // fail the enquiry). Goes to RESEND_TO (you), not the buyer.
  const resendKey = process.env.Resend_Key;
  const resendFrom = process.env.RESEND_FROM;
  const resendTo = process.env.RESEND_TO || "hello@pedigreechums.co.uk";
  if (resendKey && resendFrom) {
    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: resendTo,
          reply_to: email,
          subject: `New trade enquiry - ${company}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #0a3a57; line-height: 1.6;">
              <h2 style="color: #1497d6; margin: 0 0 12px;">New trade enquiry</h2>
              <p style="margin:0 0 4px;"><strong>Shop / company:</strong> ${esc(company)}</p>
              <p style="margin:0 0 4px;"><strong>Contact:</strong> ${esc(name)}</p>
              <p style="margin:0 0 4px;"><strong>Email:</strong> ${esc(email)}</p>
              <p style="margin:0 0 4px;"><strong>Business type:</strong> ${esc(businessType) || "Not given"}</p>
              <p style="margin:0 0 4px;"><strong>Consent:</strong> ${consent ? "Yes" : "No"}</p>
              <p style="margin:12px 0 0; color:#5a6b78;">Reply directly to this email to reach them.</p>
            </div>
          `,
        }),
      });
      if (!resendRes.ok) {
        console.error("Resend trade notification failed:", resendRes.status, await resendRes.text());
      }
    } catch (err) {
      console.error("Resend trade notification error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
