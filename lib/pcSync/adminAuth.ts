// Password gate for the /pc-admin viewer. A single shared password (PC_SYNC_ADMIN_PASSWORD) is checked once
// at login; a short-lived HMAC-signed token is then stored in an httpOnly cookie so later requests need no
// re-entry. The password itself is never put in the cookie. Fail-closed: with no password env set, every
// check returns false, so the admin surface is unreachable rather than open.
//
// Node crypto (timing-safe compare, HMAC) => these helpers, and every route that calls them, run on the
// nodejs runtime, not edge.

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const COOKIE_NAME = "pc_admin";
const SESSION_HOURS = 12;
const TOKEN_VERSION = "v1";

function password(): string {
  return process.env.PC_SYNC_ADMIN_PASSWORD ?? "";
}

// The signing secret is a dedicated env if set, else the password itself (knowing the password is already
// enough to authenticate, so it is an acceptable HMAC key). Empty when neither is set => fail-closed.
function secret(): string {
  return process.env.PC_SYNC_ADMIN_SECRET || password();
}

function sign(msg: string): string {
  return createHmac("sha256", secret()).update(msg).digest("hex");
}

// Constant-time string compare that never throws on length mismatch.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function verifyPassword(input: string): boolean {
  const expected = password();
  if (!expected) return false; // no password configured: refuse everything
  return safeEqual(input, expected);
}

// token = "<version>.<expiryEpochMs>.<hmac>"
export function makeToken(): string {
  const exp = String(Date.now() + SESSION_HOURS * 3600 * 1000);
  const body = `${TOKEN_VERSION}.${exp}`;
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token || !secret()) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [ver, exp, sig] = parts;
  if (ver !== TOKEN_VERSION) return false;
  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || expMs < Date.now()) return false; // expired
  return safeEqual(sig, sign(`${ver}.${exp}`));
}

export const cookieOptions = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_HOURS * 3600,
};

// True when the current request carries a valid admin cookie. Async: cookies() is request-time.
export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

// Whether a password has been configured at all (used to show a setup hint on the login screen).
export function isConfigured(): boolean {
  return password() !== "";
}
