import { NextResponse } from "next/server";

// GET /api/pc-sync-config
//
// Task 171 (Section 0): the RUNTIME kill switch for tester sheet-sync. Returns { enabled: boolean } read from
// Vercel Edge Config so the owner can flip it OFF in the Vercel dashboard and have it take effect in SECONDS,
// with NO redeploy. This is the "stop it instantly" control (deliberately runtime, not a build-time env var).
//
// DEFAULT IS OFF. If no Edge Config store is connected (no EDGE_CONFIG env), the key is missing, the value is
// not `enabled: true`, or anything throws, this returns { enabled: false }. Nothing about tester transcripts
// passes through here -- it only reports on/off. The Apps Script endpoint URL is kept in the same Edge Config
// item (field `endpoint`) for the future server-side sender and is NOT exposed to the client here.
//
// One-time setup to turn it on for a TESTING window:
//   1. Create a Vercel Edge Config store and connect it to this project (Vercel sets the EDGE_CONFIG env).
//   2. Add an item  pickachum_sync = { "enabled": true, "endpoint": "<published Apps Script URL>" }.
// Instant kill thereafter: set that item's "enabled" to false in the dashboard. No redeploy.

export const dynamic = "force-dynamic"; // never cached: the value is a live kill switch

const OFF = { enabled: false } as const;

export async function GET() {
  try {
    const conn = process.env.EDGE_CONFIG; // e.g. https://edge-config.vercel.com/<id>?token=<token>
    if (!conn) return NextResponse.json(OFF);
    const u = new URL(conn);
    const id = u.pathname.split("/").filter(Boolean)[0];
    const token = u.searchParams.get("token");
    if (!id || !token) return NextResponse.json(OFF);
    const res = await fetch(`https://edge-config.vercel.com/${id}/item/pickachum_sync?token=${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json(OFF); // 404 = key not set yet -> OFF
    const v: unknown = await res.json();
    const enabled = typeof v === "object" && v !== null && (v as { enabled?: unknown }).enabled === true;
    return NextResponse.json({ enabled });
  } catch {
    return NextResponse.json(OFF);
  }
}
