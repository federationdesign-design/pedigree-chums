// NG-SHARE-1, 29 Aug 2026. Payload for a shared name link.
//
// The four strings a result card needs are carried literally, base64url encoded
// into the path. NOT a seed: regenerating the name from a seed would be a much
// shorter URL, but every link ever shared would break the moment the name pools
// change, and those pools changed twice on 29 Aug alone. Literals mean a link
// shared today still renders correctly after any future change to the generator.
//
// The route is a path segment rather than ?n=, because Next's opengraph-image
// convention only receives route params, never the query string.

export type SharedName = {
  b: string; // breed
  f: string; // full name
  k: string; // nickname, may be empty
};

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeSharedName(v: SharedName): string {
  return toBase64Url(JSON.stringify([v.b, v.f, v.k]));
}

// Never throws. A hand-edited or truncated link returns null and the route shows
// its not-found state rather than a stack trace.
export function decodeSharedName(code: string): SharedName | null {
  try {
    const raw = JSON.parse(fromBase64Url(code));
    // Reads the old four-part payload too, so links shared before 30 Aug 2026
    // keep working. The fourth item was the reasoning line and is ignored.
    if (!Array.isArray(raw) || raw.length < 3) return null;
    const [b, f, k] = raw.map((x) => (typeof x === "string" ? x : ""));
    if (!f) return null; // a card with no name is not a card
    // Cap every field. The payload comes from the URL, so treat it as untrusted:
    // React escapes it on render, but there is no reason to accept a 50KB path.
    const cap = (s: string, n: number) => s.slice(0, n);
    return { b: cap(b, 60), f: cap(f, 120), k: cap(k, 60) };
  } catch {
    return null;
  }
}

export function sharedNamePath(v: SharedName): string {
  return `/name-generator/n/${encodeSharedName(v)}`;
}

/* ── Podium ─────────────────────────────────────────────────────────────────
   NG-SHARE-2, 30 Aug 2026. The knockout result: first, second and third.

   Third can be missing. KnockoutRound derives it as the highest-scoring loser
   from the rounds before the final (line 457), so with a two-name field there
   is no third at all. In practice the Knockout button only appears at three or
   more, but the type allows for it rather than relying on that guard.

   No reasoning line here, and none on the single-name payload either from now
   on: it was 95 of the 154 characters and Steve dropped it on 30 Aug 2026 to
   shorten the URL. */

export type PodiumEntry = { f: string; k: string }; // full name, nickname
export type SharedPodium = { b: string; places: PodiumEntry[] };

export function encodeSharedPodium(v: SharedPodium): string {
  const flat: string[] = [v.b];
  for (const p of v.places.slice(0, 3)) flat.push(p.f, p.k);
  return toBase64Url(JSON.stringify(flat));
}

export function decodeSharedPodium(code: string): SharedPodium | null {
  try {
    const raw = JSON.parse(fromBase64Url(code));
    if (!Array.isArray(raw) || raw.length < 3) return null;
    const cap = (s: unknown, n: number) => (typeof s === "string" ? s.slice(0, n) : "");
    const b = cap(raw[0], 60);
    const places: PodiumEntry[] = [];
    for (let i = 1; i + 1 < raw.length && places.length < 3; i += 2) {
      const f = cap(raw[i], 120);
      if (!f) continue;
      places.push({ f, k: cap(raw[i + 1], 60) });
    }
    if (places.length === 0) return null;
    return { b, places };
  } catch {
    return null;
  }
}

export function sharedPodiumPath(v: SharedPodium): string {
  return `/name-generator/p/${encodeSharedPodium(v)}`;
}
