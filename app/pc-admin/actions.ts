"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, cookieOptions, makeToken, verifyPassword } from "../../lib/pcSync/adminAuth";

// Login: check the shared password, and on success drop a short-lived signed cookie (see adminAuth). A wrong
// or missing password bounces back to the form with ?error=1. The password is never stored anywhere.
export async function loginAction(formData: FormData): Promise<void> {
  const pw = String(formData.get("password") ?? "");
  if (!verifyPassword(pw)) redirect("/pc-admin?error=1");
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(), cookieOptions);
  redirect("/pc-admin");
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
  redirect("/pc-admin");
}
