// Contrast-scheme plumbing for the accessibility toolbar (brief v5, task 5).
//
// The chosen scheme is persisted in localStorage and mirrored onto <html> as
// the data-pc-contrast-scheme attribute. The before-first-paint read lives
// inline in the root layout (app/layout.tsx) so a returning scheme user never
// sees a flash of the default. This module is the runtime get/set/clear the
// toolbar controls (task 8) will call. The attribute name, the storage key and
// the two valid values MUST stay in sync with that inline script and with the
// CSS gate :root:not([data-pc-contrast-scheme]) that the per-article toggle and
// the scheme palettes (task 6) key off.

export type ContrastScheme = "black-on-white" | "white-on-black";

export const SCHEME_ATTR = "data-pc-contrast-scheme";
export const SCHEME_KEY = "pc-contrast-scheme";

// Fired whenever the scheme or hide-images state changes, so components outside
// the toolbar (the Nav menu swap in accessible mode) can react without polling.
export const CONTRAST_EVENT = "pc:contrast";
function emitContrastChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONTRAST_EVENT));
}

const SCHEMES: ContrastScheme[] = ["black-on-white", "white-on-black"];

export function isScheme(v: unknown): v is ContrastScheme {
  return typeof v === "string" && (SCHEMES as string[]).includes(v);
}

// The active scheme, or null for the default view. Reads the attribute the
// inline script already applied, so it is correct on the first client render.
export function getScheme(): ContrastScheme | null {
  if (typeof document === "undefined") return null;
  const v = document.documentElement.getAttribute(SCHEME_ATTR);
  return isScheme(v) ? v : null;
}

// Apply and persist a scheme, or pass null to return to the default view. The
// attribute drives the CSS; localStorage carries the choice to the next load.
export function setScheme(scheme: ContrastScheme | null): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (scheme && isScheme(scheme)) {
    root.setAttribute(SCHEME_ATTR, scheme);
  } else {
    root.removeAttribute(SCHEME_ATTR);
  }
  try {
    if (scheme && isScheme(scheme)) {
      window.localStorage.setItem(SCHEME_KEY, scheme);
    } else {
      window.localStorage.removeItem(SCHEME_KEY);
    }
  } catch {
    // localStorage can throw (private mode, quota disabled). The attribute is
    // still applied for this session; only the persistence is lost.
  }
  emitContrastChange();
}

// Return to the default view. Reset, in the toolbar's sense.
export function clearScheme(): void {
  setScheme(null);
}

// ---- Hide images (task 7) --------------------------------------------------
// Independent of the scheme: it can be on with or without one. The attribute
// hides content media before first paint (via contrast-schemes.css) and drives
// the HideImages component that draws the alt-text blocks.

export const HIDE_ATTR = "data-pc-hide-images";
export const HIDE_KEY = "pc-hide-images";

export function getHideImages(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.hasAttribute(HIDE_ATTR);
}

export function setHideImages(on: boolean): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (on) root.setAttribute(HIDE_ATTR, ""); else root.removeAttribute(HIDE_ATTR);
  try {
    if (on) window.localStorage.setItem(HIDE_KEY, "1"); else window.localStorage.removeItem(HIDE_KEY);
  } catch {
    // localStorage may be unavailable; the attribute still applies this session.
  }
  emitContrastChange();
}
