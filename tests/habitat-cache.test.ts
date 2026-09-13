import { test } from "node:test";
import assert from "node:assert/strict";
import { getHabitatItems } from "../lib/habitat-cache";

test("reuses the cached habitat layout for the same stage and variant", () => {
  const first = getHabitatItems("post", false);
  const second = getHabitatItems("post", false);

  assert.strictEqual(second, first);
  assert.ok(first.length > 0);
  assert.ok(first.every((item) => Number.isFinite(item.y)));
});
