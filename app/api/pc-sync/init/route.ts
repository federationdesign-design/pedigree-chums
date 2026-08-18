import { NextResponse } from "next/server";
import { ensureSchema, hasStore } from "../../../../lib/pcSync/db";

// POST /api/pc-sync/init
//
// One-shot schema creation (CREATE TABLE IF NOT EXISTS pc_turns / pc_sessions). Idempotent: safe to call any
// number of times. The write path (/api/pc-sync) also ensures the schema on first insert, so this route is a
// convenience to provision the tables up front (e.g. right after connecting the Postgres store) rather than a
// requirement. GET is offered too so it can be triggered from a browser during setup.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function run() {
  if (!hasStore()) {
    return NextResponse.json({ ok: false, reason: "no-store" }, { status: 503 });
  }
  try {
    await ensureSchema();
    return NextResponse.json({ ok: true, tables: ["pc_turns", "pc_sessions"] });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: (err as Error).message }, { status: 500 });
  }
}

export const POST = run;
export const GET = run;
