import { BufferGeometry, Float32BufferAttribute } from "three";
export function createPondBerm() {
  const ring = (x: number, z: number, y: number) => [
    [-x, y, -z],
    [x, y, -z],
    [x, y, z],
    [-x, y, z],
  ];
  const loops = [
    ring(1.4, 3.05, -0.3),
    ring(1.22, 2.86, 0.12),
    ring(1.02, 2.62, 0.12),
    ring(0.99, 2.59, -0.3),
  ];
  const vertices: number[] = [];
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 4; i++) {
      const n = (i + 1) % 4,
        a = loops[j][i],
        b = loops[j][n],
        c = loops[j + 1][n],
        d = loops[j + 1][i];
      vertices.push(...a, ...b, ...c, ...a, ...c, ...d);
    }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Low, irregular ridges rather than pointed cone primitives. */
export function createCoalHeap(seed = 0) {
  const vertices: number[] = [];
  const rings = [1, 0.7, 0.3, 0];
  const heights = [0, 0.42, 0.83, 0.92];
  const n = 14;
  const point = (ring: number, i: number) => {
    const a = (i % n) / n * Math.PI * 2;
    const wobble = 1 + Math.sin(a * 3 + seed) * 0.11 + Math.cos(a * 5 + seed) * 0.06;
    return [Math.cos(a) * rings[ring] * wobble + ring * 0.055,
      heights[ring] * (1 + Math.sin(a * 2 + seed) * 0.06),
      Math.sin(a) * rings[ring] * wobble];
  };
  for (let r = 0; r < 3; r++) for (let i = 0; i < n; i++) {
    const a = point(r, i), b = point(r, i + 1), c = point(r + 1, i), d = point(r + 1, i + 1);
    vertices.push(...a, ...c, ...b, ...b, ...c, ...d);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}
