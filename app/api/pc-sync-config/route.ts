import { NextResponse } from "next/server";
import { readSyncConfig } from "../../pick-a-chum/lib/sheet-sync-config";

// GET /api/pc-sync-config
//
// The RUNTIME kill switch for tester recording. Returns { enabled: boolean } read from Vercel Global Config
// (formerly Edge Config) so the owner can flip it OFF in the Vercel dashboard and have it take effect in
// SECONDS, with NO redeploy. This is the "stop it instantly" control (deliberately runtime, not a build-time
// env var). The recorded turns are written to Postgres by /api/pc-sync; this route only reports on/off.
//
// DEFAULT IS OFF (see readSyncConfig).
//
// One-time setup to turn it on for a TESTING window:
//   1. Create a Vercel Global Config store and connect it to this project (Vercel sets the GLOBAL_CONFIG env;
//      EDGE_CONFIG still resolves via the fallback in readSyncConfig).
//   2. Add an item  pickachum_sync = { "enabled": true }.
// Instant kill thereafter: set that item's "enabled" to false in the dashboard. No redeploy.

export const dynamic = "force-dynamic"; // never cached: the value is a live kill switch

export async function GET() {
  const { enabled } = await readSyncConfig();
  return NextResponse.json({ enabled });
}
