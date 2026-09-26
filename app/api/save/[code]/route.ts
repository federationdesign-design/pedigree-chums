import { NextResponse } from "next/server";
import { hasSaveStore, readSave, updateSave } from "../../../../lib/saves/db";
import { normaliseCode } from "../../../../lib/saves/codes";
import { MAX_BODY_BYTES, sanitise } from "../../../../lib/saves/snapshot";
import { allow, clientKey } from "../../../../lib/saves/rateLimit";

/* GET /api/save/PUG-BONE-SAUSAGE-42   ->  { ok: true, code, snapshot }
   PUT /api/save/PUG-BONE-SAUSAGE-42   { snapshot }  ->  { ok: true, snapshot }
   Fetch a save, or merge new progress into it (J18-315). The PUT merges rather than
   replaces, so an out-of-date device never wipes progress made elsewhere, and the
   merged save comes back so the browser can take it. Both are rate limited per
   address; a fetch more tightly, as that is where guessing would happen. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(req: Request, ctx: Ctx) {
  if (!hasSaveStore()) return NextResponse.json({ ok: false, reason: "no-store" }, { status: 503 });
  if (!allow(`get:${clientKey(req)}`, 20)) return NextResponse.json({ ok: false, reason: "slow-down" }, { status: 429 });
  const code = normaliseCode(decodeURIComponent((await ctx.params).code));
  if (!code) return NextResponse.json({ ok: false, reason: "not-found" }, { status: 404 });
  try {
    const snapshot = await readSave(code);
    if (!snapshot) return NextResponse.json({ ok: false, reason: "not-found" }, { status: 404 });
    return NextResponse.json({ ok: true, code, snapshot });
  } catch {
    return NextResponse.json({ ok: false, reason: "server" }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  if (!hasSaveStore()) return NextResponse.json({ ok: false, reason: "no-store" }, { status: 503 });
  if (!allow(`put:${clientKey(req)}`, 30)) return NextResponse.json({ ok: false, reason: "slow-down" }, { status: 429 });
  const code = normaliseCode(decodeURIComponent((await ctx.params).code));
  if (!code) return NextResponse.json({ ok: false, reason: "not-found" }, { status: 404 });
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) return NextResponse.json({ ok: false, reason: "too-big" }, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(text); } catch { return NextResponse.json({ ok: false, reason: "bad-body" }, { status: 400 }); }
  const snap = sanitise((body as { snapshot?: unknown } | null)?.snapshot);
  if (!snap) return NextResponse.json({ ok: false, reason: "bad-body" }, { status: 400 });
  try {
    const merged = await updateSave(code, snap);
    if (!merged) return NextResponse.json({ ok: false, reason: "not-found" }, { status: 404 });
    return NextResponse.json({ ok: true, snapshot: merged });
  } catch {
    return NextResponse.json({ ok: false, reason: "server" }, { status: 500 });
  }
}
