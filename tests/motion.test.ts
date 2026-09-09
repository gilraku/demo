import { test } from "node:test";
import assert from "node:assert/strict";
import { revealProgress } from "../lib/motion";
test("reveal finishes by elapsed time even after a slow frame", () => {
  assert.equal(revealProgress(1000, 1000, false), 0);
  assert.equal(revealProgress(1000, 3000, false), 1);
  assert.equal(revealProgress(1000, 1100, true), 1);
  assert.ok(revealProgress(1000, 1300, false) > 0);
});
