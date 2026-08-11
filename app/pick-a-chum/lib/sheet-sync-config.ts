// Task 171: read the sheet-sync kill switch from Vercel Edge Config, SERVER-SIDE ONLY. One reader, so the
// /api/pc-sync-config gate and the /api/pc-sync sender never disagree about on/off. DEFAULT IS OFF: no store
// connected (no EDGE_CONFIG env), a malformed connection string, a missing key, a value that is not exactly
// enabled:true, or any network/parse error all return { enabled:false, endpoint:'' }. The endpoint URL stays
// here on the server and is never sent to the client.

export interface SyncConfig {
  enabled: boolean;
  endpoint: string;
}

const OFF: SyncConfig = { enabled: false, endpoint: '' };

export async function readSyncConfig(): Promise<SyncConfig> {
  try {
    const conn = process.env.EDGE_CONFIG; // e.g. https://edge-config.vercel.com/<id>?token=<token>
    if (!conn) return OFF;
    const u = new URL(conn);
    const id = u.pathname.split('/').filter(Boolean)[0];
    const token = u.searchParams.get('token');
    if (!id || !token) return OFF;
    const res = await fetch(`https://edge-config.vercel.com/${id}/item/pickachum_sync?token=${token}`, {
      cache: 'no-store',
    });
    if (!res.ok) return OFF; // 404 = key not set yet -> OFF
    const v: unknown = await res.json();
    if (typeof v !== 'object' || v === null) return OFF;
    const rec = v as { enabled?: unknown; endpoint?: unknown };
    const enabled = rec.enabled === true;
    const endpoint = typeof rec.endpoint === 'string' ? rec.endpoint.trim() : '';
    return enabled && endpoint ? { enabled, endpoint } : OFF;
  } catch {
    return OFF;
  }
}
