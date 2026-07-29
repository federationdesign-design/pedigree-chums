// Hidden Games Stage 1: lifecycle and copy assertions (BRIEF 5, 7).
// Run: npm run test:hidden-games

import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveStatus,
  lifecycleView,
  LIFECYCLE_STATUSES,
} from "../../lib/hiddenGames/lifecycle.ts";
import {
  SUSPENDED,
  STORAGE_BLOCKED,
  closedMessage,
} from "../../lib/hiddenGames/copy.ts";

test("HG-LIFE-01 resolveStatus maps every valid value and defaults unknowns to OPEN", () => {
  for (const s of LIFECYCLE_STATUSES) {
    assert.equal(resolveStatus(s), s);
    assert.equal(resolveStatus(s.toLowerCase()), s); // build config may be lowercased
  }
  assert.equal(resolveStatus(undefined), "OPEN");
  assert.equal(resolveStatus(null), "OPEN");
  assert.equal(resolveStatus(""), "OPEN");
  assert.equal(resolveStatus("banana"), "OPEN");
});

test("HG-LIFE-02 lifecycleView gives the BRIEF 5 behaviour for each status", () => {
  assert.deepEqual(lifecycleView("OPEN"), {
    render: true,
    view: "counter",
    acceptsFinds: true,
  });
  assert.deepEqual(lifecycleView("DRAFT"), {
    render: false,
    view: "hidden",
    acceptsFinds: true,
  });
  assert.deepEqual(lifecycleView("SUSPENDED"), {
    render: true,
    view: "suspended",
    acceptsFinds: false,
  });
  assert.deepEqual(lifecycleView("CLOSED"), {
    render: true,
    view: "closed",
    acceptsFinds: false,
  });
  assert.deepEqual(lifecycleView("ARCHIVED"), {
    render: false,
    view: "hidden",
    acceptsFinds: false,
  });
});

test("HG-COPY-01 the suspended and storage-blocked copy is the exact BRIEF 7 text", () => {
  assert.equal(
    SUSPENDED,
    "The Hidden Games challenge is temporarily unavailable. Your saved progress has not been changed. Please check back later."
  );
  assert.equal(
    STORAGE_BLOCKED,
    "Your browser is blocking game progress. You can still play, but the games you find cannot be saved on this device."
  );
});

test("HG-COPY-02 closedMessage resolves its tokens and leaves no unresolved value", () => {
  const msg = closedMessage(1, 2);
  assert.equal(msg, "This Hidden Games challenge has ended. You found 1 of 2 games.");
  assert.ok(!msg.includes("{"), "no unresolved {token} reaches the browser");
  assert.ok(!msg.includes("PLACEHOLDER"));
});
