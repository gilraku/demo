import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Box3, Mesh, Vector3 } from "three";
import { prepareNatureGeometry } from "../lib/nature-assets";

const names = [
  "tree_oak",
  "tree_detailed",
  "tree_palm",
  "plant_bushDetailed",
  "grass_leafsLarge",
  "stone_largeC",
  "rock_largeA",
];
for (const name of names) {
  test(`${name}: local GLB produces finite, grounded instancing geometry`, async () => {
    const bytes = readFileSync(`public/assets/kenney/nature/${name}.glb`);
    const gltf = await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      "",
    );
    const original = new Box3().setFromObject(gltf.scene);
    const geometry = prepareNatureGeometry(gltf.scene);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const radius = Math.hypot(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
    const clearanceBound = name.startsWith("tree_")
      ? 0.47
      : name.startsWith("stone_") || name.startsWith("rock_")
        ? 2.5
        : 2.4;
    assert.ok(
      radius <= clearanceBound,
      "road clearance must cover the full normalized model footprint",
    );
    assert.ok(Math.abs(box.min.y) < 1e-5);
    assert.ok(Math.abs(box.getSize(new Vector3()).y - 1) < 1e-5);
    assert.equal(
      geometry.attributes.position.count,
      geometry.attributes.color.count,
    );
    assert.ok([...geometry.attributes.position.array].every(Number.isFinite));
    assert.ok([...geometry.attributes.color.array].every(Number.isFinite));
    assert.ok(
      new Box3().setFromObject(gltf.scene).equals(original),
      "cached source must not be mutated",
    );
    geometry.dispose();
    gltf.scene.traverse((node) => {
      if (node instanceof Mesh) node.geometry.dispose();
    });
  });
}
