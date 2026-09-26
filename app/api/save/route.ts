import { NextResponse } from "next/server";
import { createSave, hasSaveStore } from "../../../lib/saves/db";
import { MAX_BODY_BYTES, sanitise } from "../../../lib/saves/snapshot";
import { allow, clientKey } from "../../../lib/saves/rateLimit";

/* POST /api/save  { snapshot }  ->  { ok: true, code }
   Makes a new save code for the progress sent (J18-315). No personal data is
   taken or stored. Rate limited to 10 new codes a minute per address. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!hasSaveStore()) return NextResponse.json({ ok: false, reason: "no-store" }, { status: 503 });
  if (!allow(`create:${clientKey(req)}`, 10)) return NextResponse.json({ ok: false, reason: "slow-down" }, { status: 429 });
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) return NextResponse.json({ ok: false, reason: "too-big" }, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(text); } catch { return NextResponse.json({ ok: false, reason: "bad-body" }, { status: 400 }); }
  const snap = sanitise((body as { snapshot?: unknown } | null)?.snapshot);
  if (!snap) return NextResponse.json({ ok: false, reason: "bad-body" }, { status: 400 });
  try {
    const code = await createSave(snap);
    return NextResponse.json({ ok: true, code });
  } catch {
    return NextResponse.json({ ok: false, reason: "server" }, { status: 500 });
  }
}
