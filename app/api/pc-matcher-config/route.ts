import { NextResponse } from "next/server";
import { readMatcherConfig } from "../../pick-a-chum/lib/matcher-config";

// GET /api/pc-matcher-config
//
// Task 173 (Section 8): the RUNTIME switch for the reworded-input matcher. Returns { enabled: boolean } read
// from Vercel Global Config (formerly Edge Config) so the owner can flip it on when ready and OFF instantly
// in the dashboard, in SECONDS, with NO redeploy. Deliberately runtime, not a build-time env var (same
// pattern as Task 171).
//
// DEFAULT IS OFF (see readMatcherConfig). With it off, every unmatched turn behaves exactly as today.
//
// One-time setup to turn it on:
//   1. Create/connect a Vercel Global Config store (Vercel sets the GLOBAL_CONFIG env; EDGE_CONFIG still
//      resolves via the fallback in readMatcherConfig).
//   2. Add an item  pickachum_matcher = { "enabled": true }.
// Instant kill thereafter: set that item's "enabled" to false in the dashboard. No redeploy.

export const dynamic = "force-dynamic"; // never cached: the value is a live switch

export async function GET() {
  const { enabled } = await readMatcherConfig();
  return NextResponse.json({ enabled });
}
