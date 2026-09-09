import { test } from "node:test";
import assert from "node:assert/strict";
import {
  haulRoad,
  pond,
  distanceToRoad,
  ringRoadCurve,
  clearOfOperationalRoads,
} from "../lib/site-layout";
test("pond footprint stays clear of the haul road including shoulders", () => {
  for (let x = pond.x - 4; x <= pond.x + 4; x += 0.5)
    for (let z = pond.z - 3; z <= pond.z + 3; z += 0.5)
      assert.ok(distanceToRoad(x, z, haulRoad) > 2);
});
test("workshop building is separate from the haul corridor", () => {
  for (let x = 7; x <= 13; x++)
    for (let z = -19; z <= -15; z++)
      assert.ok(distanceToRoad(x, z, haulRoad) > 2);
});

test("the HD ring and its shoulders reject obstacles around the full loop", () => {
  for (let i = 0; i < 100; i++) {
    const p = ringRoadCurve.getPointAt(i / 100);
    assert.equal(clearOfOperationalRoads(p.x, p.z, 0), false);
    // A large boulder whose center is outside the road still overlaps it.
    assert.equal(clearOfOperationalRoads(p.x + 2, p.z, 2.6), false);
  }
  assert.equal(clearOfOperationalRoads(-50, -40, 2.6), true);
});
