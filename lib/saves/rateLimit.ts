/* SAVE CODES: A SIMPLE RATE LIMIT, 27 September 2026 (owner, J18-315). Counts
   requests per address in memory, in a fixed one-minute window. It lives in one
   server instance, so it is a speed bump rather than a wall, which is all it
   needs to be: codes are 100 million to one against a guess, and hold no personal
   data. */
const hits = new Map<string, { n: number; until: number }>();

export function allow(key: string, perMinute: number): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.until <= now) {
    hits.set(key, { n: 1, until: now + 60_000 });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.until <= now) hits.delete(k);
    return true;
  }
  h.n += 1;
  return h.n <= perMinute;
}

export function clientKey(req: Request): string {
  const f = req.headers.get("x-forwarded-for") ?? "";
  return f.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
