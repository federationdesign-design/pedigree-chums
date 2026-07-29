// Test-only ESM resolver hook. The Hidden Games source uses extensionless
// relative imports (e.g. "./registry"), which Next and tsc resolve but the
// Node ESM loader does not. This hook retries an unextended relative specifier
// with a ".ts" suffix so node:test can import the real source unchanged. It
// affects the test process only; nothing in the app or tsconfig changes.
export async function resolve(specifier, context, next) {
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
  const hasExt = /\.(mjs|cjs|js|mts|cts|ts|json)$/.test(specifier);
  if (isRelative && !hasExt) {
    try {
      return await next(specifier + ".ts", context);
    } catch {
      // fall through to the default resolution below
    }
  }
  return next(specifier, context);
}
