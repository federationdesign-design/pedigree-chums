// Hidden Games Stage 1: the G01 award rule, extracted so it is testable without
// a browser. G01 "Off Exploring" awards on the first completed route change of
// the visit, from any starting page (BRIEF 2.1). Never on the initial load, and
// once only. The engine also deduplicates by Game ID, so this guard is belt and
// braces rather than the sole defence.
export function shouldAwardOnRouteChange(
  initialPath: string,
  currentPath: string,
  alreadyAwarded: boolean
): boolean {
  if (alreadyAwarded) return false;
  return currentPath !== initialPath;
}
