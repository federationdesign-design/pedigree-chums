// Task 173: read the reworded-input matcher kill switch from Vercel Global Config (formerly Edge Config),
// SERVER-SIDE ONLY. Mirrors the Task 171 sheet-sync switch (sheet-sync-config.ts) exactly. DEFAULT IS OFF:
// no store connected (neither GLOBAL_CONFIG nor EDGE_CONFIG env), a malformed connection string, a missing
// key, a value that is not exactly enabled:true, or any network/parse error all return { enabled:false }.
// The owner turns it on in the Vercel dashboard (item pickachum_matcher = { "enabled": true }) and can turn
// it off instantly, no redeploy.

export interface MatcherConfig {
  enabled: boolean;
}

const OFF: MatcherConfig = { enabled: false };

export async function readMatcherConfig(): Promise<MatcherConfig> {
  try {
    // Vercel renamed Edge Config to Global Config (default env GLOBAL_CONFIG); keep EDGE_CONFIG as a fallback
    // so both a renamed store and any legacy binding resolve. e.g. https://global-config.vercel.com/<id>?token=<token>
    const conn = process.env.GLOBAL_CONFIG ?? process.env.EDGE_CONFIG;
    if (!conn) return OFF;
    const u = new URL(conn);
    const id = u.pathname.split('/').filter(Boolean)[0];
    const token = u.searchParams.get('token');
    if (!id || !token) return OFF;
    // Derive the read host from the connection string (u.origin), never hardcode it, so this works whether
    // Vercel hands us edge-config.vercel.com or global-config.vercel.com, and survives any future rename.
    const res = await fetch(`${u.origin}/${id}/item/pickachum_matcher?token=${token}`, {
      cache: 'no-store',
    });
    if (!res.ok) return OFF; // 404 = key not set yet -> OFF
    const v: unknown = await res.json();
    if (typeof v !== 'object' || v === null) return OFF;
    return (v as { enabled?: unknown }).enabled === true ? { enabled: true } : OFF;
  } catch {
    return OFF;
  }
}
