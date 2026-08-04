// Analytics for What's Your Superpower.
//
// The four event names below are the only permitted events (spec section 12).
// No event may carry any parameter with answer identity, score, plot value,
// gap, state ID or result label. The prototype ships this as a stub: nothing
// is transmitted anywhere. Wiring it to a real collector is a Release-gate
// change and needs the privacy audit rerun.

export type AnalyticsEvent =
  | "game_start"
  | "question_view"
  | "game_complete"
  | "game_restart";

export function trackEvent(event: AnalyticsEvent): void {
  void event;
}
