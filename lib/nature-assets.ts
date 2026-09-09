import {
  Box3,
  Color,
  Float32BufferAttribute,
  Mesh,
  Object3D,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Bake model materials into vertex colors so each variant needs one draw call.
// Work on clones: useGLTF caches source scenes across consumers.
export function prepareNatureGeometry(scene: Object3D) {
  scene.updateMatrixWorld(true);
  const parts: import("three").BufferGeometry[] = [];
  scene.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    const geometry = node.geometry.index
      ? node.geometry.toNonIndexed()
      : node.geometry.clone();
    geometry.applyMatrix4(node.matrixWorld);
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    const groups = geometry.groups.length
      ? geometry.groups
      : [
          {
            start: 0,
            count: geometry.attributes.position.count,
            materialIndex: 0,
          },
        ];
    for (const group of groups) {
      const name = materials[group.materialIndex ?? 0].name.toLowerCase();
      const color = new Color(
        name.includes("leaf") || name.includes("grass")
          ? "#739b72"
          : name.includes("wood")
            ? "#756046"
            : "#9b9d8b",
      );
      for (let i = group.start; i < group.start + group.count; i++)
        color.toArray(colors, i * 3);
    }
    for (const name of Object.keys(geometry.attributes)) {
      if (name !== "position" && name !== "normal")
        geometry.deleteAttribute(name);
    }
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    geometry.clearGroups();
    parts.push(geometry);
  });
  if (!parts.length) throw new Error("Nature model contains no meshes");
  const geometry = mergeGeometries(parts)!;
  parts.forEach((part) => part.dispose());
  geometry.computeBoundingBox();
  const box = geometry.boundingBox as Box3;
  const center = box.getCenter(new Vector3());
  const height = box.max.y - box.min.y;
  if (!(height > 0))
    throw new Error("Nature model must have a positive height");
  geometry.translate(-center.x, -box.min.y, -center.z);
  geometry.scale(1 / height, 1 / height, 1 / height);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
