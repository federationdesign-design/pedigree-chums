// Hidden Games Stage 1: operational lifecycle status.
//
// Campaign `mode` (in registry.ts) says what the version is. Operational
// `status` says whether it may currently run (BRIEF 5). Reconnaissance found no
// runtime configuration route in this codebase, so status is build-time only:
// changing it is a rebuild-and-deploy, which is the accepted Stage 1 limitation
// (BRIEF 5, "Suspension is therefore rebuild-and-deploy").

export const LIFECYCLE_STATUSES = [
  "DRAFT",
  "OPEN",
  "SUSPENDED",
  "CLOSED",
  "ARCHIVED",
] as const;
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

// Map a raw build-config value to a status. Unknown or missing values fall back
// to OPEN, the live experience, rather than silently disabling the feature.
export function resolveStatus(raw: string | undefined | null): LifecycleStatus {
  const up = String(raw ?? "").toUpperCase();
  return (LIFECYCLE_STATUSES as readonly string[]).includes(up)
    ? (up as LifecycleStatus)
    : "OPEN";
}

// The current status, read from build configuration. Next inlines
// NEXT_PUBLIC_* at build time; unset means OPEN. Stage 1 ships OPEN, and the
// owner moves it through the other states by rebuild (BRIEF 5). CLOSED is built
// and tested but does not fire in production, since closes_at is null.
export const STATUS: LifecycleStatus = resolveStatus(
  process.env.NEXT_PUBLIC_HIDDEN_GAMES_STATUS
);

// What the counter interface shows when it renders. "hidden" means it does not
// render at all (DRAFT and ARCHIVED).
export type CounterView = "counter" | "suspended" | "closed" | "hidden";

export interface LifecycleView {
  render: boolean; // does the interface render for a public visitor?
  view: CounterView; // what it shows when it renders
  acceptsFinds: boolean; // may a new find register?
}

// The single source of per-status behaviour (BRIEF 5 table). Pure, so every
// row is unit testable without a browser.
export function lifecycleView(status: LifecycleStatus): LifecycleView {
  switch (status) {
    case "OPEN":
      return { render: true, view: "counter", acceptsFinds: true };
    case "DRAFT":
      // Hidden from public visitors; finds are test only, so they still count.
      return { render: false, view: "hidden", acceptsFinds: true };
    case "SUSPENDED":
      // Frozen, nothing deleted; a temporarily-unavailable message shows.
      return { render: true, view: "suspended", acceptsFinds: false };
    case "CLOSED":
      // No new finds; the ended message shows with the visitor's final count.
      return { render: true, view: "closed", acceptsFinds: false };
    case "ARCHIVED":
      // Component and listeners do not render.
      return { render: false, view: "hidden", acceptsFinds: false };
  }
}
