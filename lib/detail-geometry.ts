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
