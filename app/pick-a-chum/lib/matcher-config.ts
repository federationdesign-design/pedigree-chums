// Task 173: read the reworded-input matcher kill switch from Vercel Edge Config, SERVER-SIDE ONLY. Mirrors
// the Task 171 sheet-sync switch (sheet-sync-config.ts) exactly. DEFAULT IS OFF: no store connected (no
// EDGE_CONFIG env), a malformed connection string, a missing key, a value that is not exactly enabled:true,
// or any network/parse error all return { enabled:false }. The owner turns it on in the Vercel dashboard
// (item pickachum_matcher = { "enabled": true }) and can turn it off instantly, no redeploy.

export interface MatcherConfig {
  enabled: boolean;
}

const OFF: MatcherConfig = { enabled: false };

export async function readMatcherConfig(): Promise<MatcherConfig> {
  try {
    const conn = process.env.EDGE_CONFIG; // e.g. https://edge-config.vercel.com/<id>?token=<token>
    if (!conn) return OFF;
    const u = new URL(conn);
    const id = u.pathname.split('/').filter(Boolean)[0];
    const token = u.searchParams.get('token');
    if (!id || !token) return OFF;
    const res = await fetch(`https://edge-config.vercel.com/${id}/item/pickachum_matcher?token=${token}`, {
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
