import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { residentialAssetModels } from "../lib/residential-assets";

function readGlbJson(bytes: Buffer) {
  assert.equal(bytes.toString("ascii", 0, 4), "glTF");
  assert.equal(bytes.readUInt32LE(4), 2);
  const jsonLength = bytes.readUInt32LE(12);
  const jsonType = bytes.readUInt32LE(16);
  assert.equal(jsonType, 0x4e4f534a);
  return JSON.parse(bytes.toString("utf8", 20, 20 + jsonLength));
}

test("selected residential assets are local, finite, and grounded GLBs", async () => {
  assert.deepEqual(residentialAssetModels, [
    "building-type-a",
    "building-type-g",
    "building-type-s",
  ]);

  for (const model of residentialAssetModels) {
    const bytes = readFileSync(`public/assets/kenney/suburban/${model}.glb`);
    const json = readGlbJson(bytes);
    const positions = json.meshes.flatMap((mesh: { primitives: { attributes: { POSITION: number } }[] }) =>
      mesh.primitives.map((primitive) => json.accessors[primitive.attributes.POSITION]),
    );
    const min = positions.reduce(
      (value: number[], accessor: { min: number[] }) => value.map((v, i) => Math.min(v, accessor.min[i])),
      [Infinity, Infinity, Infinity],
    );
    const max = positions.reduce(
      (value: number[], accessor: { max: number[] }) => value.map((v, i) => Math.max(v, accessor.max[i])),
      [-Infinity, -Infinity, -Infinity],
    );
    assert.ok(max[0] - min[0] > 0);
    assert.ok(max[1] - min[1] > 0);
    assert.equal(min[1], 0);
    assert.ok([...min, ...max].every(Number.isFinite));
  }

  const texture = readFileSync(
    "public/assets/kenney/suburban/Textures/colormap.png",
  );
  assert.ok(texture.length > 0);
});
