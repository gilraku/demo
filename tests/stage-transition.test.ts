import { test } from "node:test";
import assert from "node:assert/strict";
import { transitionValue, retargetTransition } from "../lib/stage-transition";

test("a reversed transition continues from its current visible state", () => {
  const opening = { from: 0, to: 1, start: 1000 };
  const current = transitionValue(opening, 1250, false);
  const closing = retargetTransition(opening, 0, 1250);
  assert.equal(transitionValue(closing, 1250, false), current);
  assert.ok(transitionValue(closing, 1350, false) < current);
  assert.equal(transitionValue(closing, 3000, false), 0);
});
test("pause and reduced motion resolve to the selected state immediately", () => {
  assert.equal(transitionValue({ from: 1, to: 0, start: 1000 }, 1001, true), 0);
  assert.equal(transitionValue({ from: 0, to: 1, start: 1000 }, 1001, true), 1);
});
