import { NextResponse } from "next/server";
import { readSyncConfig } from "../../pick-a-chum/lib/sheet-sync-config";

// GET /api/pc-sync-config
//
// Task 171 (Section 0): the RUNTIME kill switch for tester sheet-sync. Returns { enabled: boolean } read from
// Vercel Edge Config so the owner can flip it OFF in the Vercel dashboard and have it take effect in SECONDS,
// with NO redeploy. This is the "stop it instantly" control (deliberately runtime, not a build-time env var).
//
// DEFAULT IS OFF (see readSyncConfig). The Apps Script endpoint URL lives in the same Edge Config item and is
// deliberately NOT returned here: the client only needs on/off; the URL stays server-side for /api/pc-sync.
//
// One-time setup to turn it on for a TESTING window:
//   1. Create a Vercel Edge Config store and connect it to this project (Vercel sets the EDGE_CONFIG env).
//   2. Add an item  pickachum_sync = { "enabled": true, "endpoint": "<published Apps Script URL>" }.
// Instant kill thereafter: set that item's "enabled" to false in the dashboard. No redeploy.

export const dynamic = "force-dynamic"; // never cached: the value is a live kill switch

export async function GET() {
  const { enabled } = await readSyncConfig();
  return NextResponse.json({ enabled });
}
