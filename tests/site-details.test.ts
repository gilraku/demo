import { test } from "node:test";
import assert from "node:assert/strict";
import { clearOfOperationalRoads } from "../lib/site-layout";
import { conveyorPlacements, pondWaterLevels } from "../lib/detail-layout";
import { createPondBerm } from "../lib/detail-geometry";

test("stockpile conveyor footprints leave the HD and service corridors clear", () => {
  for (const [x, z] of conveyorPlacements)
    assert.ok(clearOfOperationalRoads(x, z, 0.9));
});
test("three pond cells descend toward the outlet and berms leave open water", () => {
  assert.equal(pondWaterLevels.length, 3);
  assert.ok(
    pondWaterLevels[0] > pondWaterLevels[1] &&
      pondWaterLevels[1] > pondWaterLevels[2],
  );
  const geometry = createPondBerm();
  const p = geometry.getAttribute("position");
  for (let i = 0; i < p.count; i += 3) {
    const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
    const z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    assert.ok(
      Math.abs(x) >= 0.98 || Math.abs(z) >= 2.58,
      "earthen berm must not fill the water opening",
    );
  }
  geometry.dispose();
});

test('industrial clearing includes tree canopy overlapping the pad edge', async () => {
  const { workingArea } = await import('../lib/site-layout');
  assert.equal(workingArea(6, -5, 1.2), true);
  assert.equal(workingArea(-30, -5, 1.2), false);
});

test('coal heap is grounded and has finite normals', async () => {
  const { createCoalHeap } = await import('../lib/detail-geometry');
  const g = createCoalHeap(1);
  g.computeBoundingBox();
  assert.equal(g.boundingBox!.min.y, 0);
  assert.ok(g.boundingBox!.max.y < 1.1);
  assert.ok(Array.from(g.getAttribute('normal').array).every(Number.isFinite));
  g.dispose();
});
