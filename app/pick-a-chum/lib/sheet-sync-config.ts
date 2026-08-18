// Read the Pick a Chum recording kill switch from Vercel Global Config (formerly Edge Config), SERVER-SIDE
// ONLY. One reader, so the /api/pc-sync-config gate and the /api/pc-sync sink never disagree about on/off.
// DEFAULT IS OFF: no store connected (neither GLOBAL_CONFIG nor EDGE_CONFIG env), a malformed connection
// string, a missing key, a value that is not exactly enabled:true, or any network/parse error all return
// { enabled:false }.
//
// History: this once also carried an `endpoint` (the Apps Script URL the sink forwarded to). That forward is
// gone -- /api/pc-sync now writes to Postgres -- so the switch is a single `enabled` boolean. Any legacy
// `endpoint` field left in the config item is simply ignored.

export interface SyncConfig {
  enabled: boolean;
}

const OFF: SyncConfig = { enabled: false };

export async function readSyncConfig(): Promise<SyncConfig> {
  try {
    // Vercel renamed Edge Config to Global Config (default env GLOBAL_CONFIG); keep EDGE_CONFIG as a fallback
    // so both a renamed store and any legacy binding resolve. e.g. https://global-config.vercel.com/<id>?token=<token>
    const conn = process.env.GLOBAL_CONFIG ?? process.env.EDGE_CONFIG;
    if (!conn) return OFF;
    const u = new URL(conn);
    const id = u.pathname.split("/").filter(Boolean)[0];
    const token = u.searchParams.get("token");
    if (!id || !token) return OFF;
    // Derive the read host from the connection string (u.origin), never hardcode it, so this works whether
    // Vercel hands us edge-config.vercel.com or global-config.vercel.com, and survives any future rename.
    const res = await fetch(`${u.origin}/${id}/item/pickachum_sync?token=${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return OFF; // 404 = key not set yet -> OFF
    const v: unknown = await res.json();
    if (typeof v !== "object" || v === null) return OFF;
    const rec = v as { enabled?: unknown };
    return rec.enabled === true ? { enabled: true } : OFF;
  } catch {
    return OFF;
  }
}
