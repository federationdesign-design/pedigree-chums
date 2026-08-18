import { NextResponse } from "next/server";
import { readSyncConfig } from "../../pick-a-chum/lib/sheet-sync-config";
import { insertBatch } from "../../../lib/pcSync/db";

// POST /api/pc-sync
//
// The same-origin sink for tester conversation recording. The client posts a completed (non-protected)
// session's rows here as { turns: [...], sessions: [...] } and this route writes them to Postgres (Vercel /
// Neon). It replaces the abandoned Apps Script forward; the payload shape is unchanged.
//
// It stays a server hop (not a direct client -> DB write) for the same reason it always was: the kill switch
// is RE-READ HERE, server-side, on every request. A tab that was open before the owner flipped the switch
// still thinks recording is on and will post; this drops that post, so an instant kill is enforced even for a
// stale tab (the beacon-on-unload cannot re-check).
//
// Fire-and-forget: a disabled switch, a bad body, no store connected, or a DB failure all return without
// throwing, so a tester whose network drops or whose post is dropped notices nothing. It carries no protected
// data: the client already dropped any protected session's buffer (earlier turns included) before it posted.

export const dynamic = "force-dynamic"; // never cached: re-read the live switch every time
export const runtime = "nodejs"; // Neon HTTP driver + fixed to the Node runtime

export async function POST(req: Request) {
  const { enabled } = await readSyncConfig();
  if (!enabled) return NextResponse.json({ ok: false, reason: "disabled" });

  let data: unknown;
  try {
    data = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-body" });
  }

  try {
    const { turns, sessions } = (data ?? {}) as { turns?: unknown; sessions?: unknown };
    await insertBatch(Array.isArray(turns) ? turns : [], Array.isArray(sessions) ? sessions : []);
  } catch {
    // Never surface a sink failure to the client.
  }
  return NextResponse.json({ ok: true });
}
