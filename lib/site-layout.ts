import { CatmullRomCurve3, Vector3 } from "three";
export type Point = [number, number];
export const pond = { x: 13, z: 17 };
export const haulRoad: Point[] = [
  [6.5, 1],
  [10, 3],
  [17, 0],
  [20, -7],
  [20, -18],
  [17, -28],
  [16, -45],
];
export const serviceRoad: Point[] = [
  [17, 0],
  [20, 5],
  [20, 12],
  [20, 20],
];
export function distanceToRoad(x: number, z: number, points: Point[]) {
  let distance = Infinity;
  for (let i = 1; i < points.length; i++) {
    const [ax, az] = points[i - 1],
      [bx, bz] = points[i];
    const dx = bx - ax,
      dz = bz - az;
    const t = Math.max(
      0,
      Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)),
    );
    distance = Math.min(distance, Math.hypot(x - ax - t * dx, z - az - t * dz));
  }
  return distance;
}
export function workingArea(x: number, z: number, radius = 0) {
  return (
    (x > 1 - radius && x < 18 + radius && z > -23 - radius && z < -11 + radius) ||
    (x > 6.5 - radius && x < 18 + radius && z > -10.5 - radius && z < -1.5 + radius) ||
    (x > 8 - radius && x < 18 + radius && z > 12 - radius && z < 22 + radius)
  );
}

// Rendering, vehicle movement, and placement share the same curved road.
export const ringRoad: Point[] = Array.from({ length: 33 }, (_, i) => {
  const angle = (i / 32) * Math.PI * 2;
  return [-9 + Math.cos(angle) * 15.5, 1 + Math.sin(angle) * 11.6];
});
export const ringRoadCurve = new CatmullRomCurve3(
  ringRoad.slice(0, -1).map(([x, z]) => new Vector3(x, 0, z)),
  true,
);
const corridors = [
  { curve: ringRoadCurve, width: 1.3 },
  {
    curve: new CatmullRomCurve3(haulRoad.map(([x, z]) => new Vector3(x, 0, z))),
    width: 1.65,
  },
  {
    curve: new CatmullRomCurve3(
      serviceRoad.map(([x, z]) => new Vector3(x, 0, z)),
    ),
    width: 1,
  },
].map(({ curve, width }) => ({
  points: curve.getPoints(512).map((p) => [p.x, p.z] as Point),
  halfWidth: width / 2,
}));

export function clearOfOperationalRoads(
  x: number,
  z: number,
  footprintRadius: number,
) {
  // Shoulder clearance includes the HD wheel overhang. The extra 0.05 covers
  // the small error between the spline and its densely sampled segments.
  return corridors.every(
    (road) =>
      distanceToRoad(x, z, road.points) >
      road.halfWidth + 0.75 + footprintRadius + 0.05,
  );
}
