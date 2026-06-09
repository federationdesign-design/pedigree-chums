import { NextResponse } from "next/server";

// POST /api/subscribe
//
// Adds the visitor to the MailerLite launch list and sends a Resend
// confirmation email. Everything sensitive is read from environment variables
// (set these in Vercel, nothing is committed):
//
//   MAILERLITE_API_KEY       - MailerLite API token (required)
//   MAILERLITE_GROUP_ID      - id of the group to add subscribers to (optional)
//   MAILERLITE_RESERVE_FIELD - custom field key to record the reserve choice (optional)
//   RESEND_API_KEY           - Resend API key (optional, enables the confirmation email)
//   RESEND_FROM              - verified sender, e.g. "Pedigree Chums <hello@pedigreechums.co.uk>"
//
// The visitor is added to MailerLite as the primary action; the Resend email is
// best effort, so a mail failure does not block a successful sign-up.

type Body = { email?: string; reserve?: boolean; consent?: boolean };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = (body.email || "").trim();
  const reserve = Boolean(body.reserve);
  const consent = Boolean(body.consent);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }
  if (!consent) {
    return NextResponse.json({ error: "Consent is required." }, { status: 400 });
  }

  const mlKey = process.env.MAILERLITE_API_KEY;
  if (!mlKey) {
    console.error("MAILERLITE_API_KEY is not set.");
    return NextResponse.json(
      { error: "Sign-ups are not configured yet. Please try again later." },
      { status: 503 }
    );
  }

  // 1. Add to the MailerLite launch list (primary action). This upserts, so a
  // repeat sign-up with the same email just updates the existing subscriber.
  const mlBody: Record<string, unknown> = { email };
  const reserveField = process.env.MAILERLITE_RESERVE_FIELD;
  if (reserveField) {
    mlBody.fields = { [reserveField]: reserve ? "Yes" : "No" };
  }
  const mlGroup = process.env.MAILERLITE_GROUP_ID;
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
      console.error("MailerLite subscribe failed:", mlRes.status, await mlRes.text());
      return NextResponse.json(
        { error: "Sorry, something went wrong adding you to the list. Please try again." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("MailerLite subscribe error:", err);
    return NextResponse.json(
      { error: "Sorry, something went wrong. Please try again." },
      { status: 502 }
    );
  }

  // 2. Send a confirmation email via Resend (best effort).
  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;
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
          to: email,
          subject: "You are on the list - Pedigree Chums",
          html: `
            <div style="font-family: Arial, sans-serif; color: #0a3a57; line-height: 1.5;">
              <h2 style="color: #1497d6; margin: 0 0 12px;">You are on the list!</h2>
              <p>Thanks for signing up for the Pedigree Chums pre-release.</p>
              <p>We will email your discount code 1 day before our pre-release launch, ahead of general sale. Orders are taken on a first come first served basis, so keep an eye on your inbox.</p>
              ${reserve ? "<p>We have also noted that you would like us to reserve a pack for you.</p>" : ""}
              <p>See you soon,<br/>The Pedigree Chums team</p>
            </div>
          `,
        }),
      });
      if (!resendRes.ok) {
        console.error("Resend email failed:", resendRes.status, await resendRes.text());
      }
    } catch (err) {
      console.error("Resend email error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
