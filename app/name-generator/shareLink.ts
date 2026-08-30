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
  r: string; // reasoning line
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
  return toBase64Url(JSON.stringify([v.b, v.f, v.k, v.r]));
}

// Never throws. A hand-edited or truncated link returns null and the route shows
// its not-found state rather than a stack trace.
export function decodeSharedName(code: string): SharedName | null {
  try {
    const raw = JSON.parse(fromBase64Url(code));
    if (!Array.isArray(raw) || raw.length < 4) return null;
    const [b, f, k, r] = raw.map((x) => (typeof x === "string" ? x : ""));
    if (!f) return null; // a card with no name is not a card
    // Cap every field. The payload comes from the URL, so treat it as untrusted:
    // React escapes it on render, but there is no reason to accept a 50KB path.
    const cap = (s: string, n: number) => s.slice(0, n);
    return { b: cap(b, 60), f: cap(f, 120), k: cap(k, 60), r: cap(r, 400) };
  } catch {
    return null;
  }
}

export function sharedNamePath(v: SharedName): string {
  return `/name-generator/n/${encodeSharedName(v)}`;
}
