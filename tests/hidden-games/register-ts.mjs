// Registers the ".ts" extension resolver for the test process.
// Usage: node --import ./tests/hidden-games/register-ts.mjs --test <files>
import { register } from "node:module";
register("./resolve-ts.mjs", import.meta.url);
