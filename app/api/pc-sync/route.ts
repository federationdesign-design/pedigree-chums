import { NextResponse } from "next/server";
import { readSyncConfig } from "../../pick-a-chum/lib/sheet-sync-config";

// POST /api/pc-sync
//
// Task 171: the same-origin sender. The client posts a completed (non-protected) session's rows here as
// { turns: [...], sessions: [...] } and this route forwards them to the Apps Script endpoint. TWO reasons it
// is a server hop, not a direct client -> Apps Script post:
//   1. The kill switch is RE-READ HERE, server-side, on every request. A tab that was open before the owner
//      flipped the switch still thinks sync is on and will post; this drops that post, so an instant kill is
//      enforced even for stale tabs (the beacon-on-unload cannot re-check).
//   2. The Apps Script URL lives in Edge Config and is read here, so it never reaches the client.
//
// Fire-and-forget: a disabled switch, a bad body, or an Apps Script failure all return without throwing, so a
// tester whose network drops or whose post is dropped notices nothing. It carries no protected data: the
// client already dropped any protected session's buffer (earlier turns included) before it could post.

export const dynamic = "force-dynamic"; // never cached: re-read the live switch every time

export async function POST(req: Request) {
  const { enabled, endpoint } = await readSyncConfig();
  if (!enabled || !endpoint) return NextResponse.json({ ok: false, reason: "disabled" });

  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-body" });
  }

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      cache: "no-store",
    });
  } catch {
    // Never surface a sink failure to the chat.
  }
  return NextResponse.json({ ok: true });
}
