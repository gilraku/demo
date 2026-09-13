import { clearOfOperationalRoads, workingArea } from "./site-layout";
import { fbm, heightAt, pitRadius, random, riverX } from "./terrain";
import type { Stage } from "./topics";

export type HabitatItem = {
  x: number;
  y: number;
  z: number;
  size: number;
  angle: number;
  tint: number;
};

const cache = new Map<string, HabitatItem[]>();

function createHabitatItems(stage: Stage, rocks: boolean) {
  const items: HabitatItem[] = [];
  for (let i = 0; i < 1600; i++) {
    const x = (random(i, 412) - 0.5) * 105;
    const z = (random(i, 719) - 0.5) * 95;
    const bank = Math.abs(x - riverX(z));
    const y = heightAt(x, z, stage);
    if (bank < 2.4 || y < 0.2) continue;
    if (x > 23 && x < 37 && z > -24 && z < -3) continue;

    const size = rocks
      ? 0.35 + random(i, 321) * 0.7
      : 0.32 + random(i, 312) * 0.55;
    const footprintRadius = size * (rocks ? 2.5 : 2.64);
    if (
      stage !== "pre" &&
      (pitRadius(x, z) < 1.35 ||
        workingArea(x, z, 1.5) ||
        !clearOfOperationalRoads(x, z, footprintRadius))
    )
      continue;

    const cluster = fbm(x * 0.12, z * 0.12);
    if (rocks ? cluster < 0.64 : cluster < 0.48 || cluster > 0.68) continue;

    items.push({
      x,
      y,
      z,
      size: size * (rocks ? 1.0 : 1.1),
      angle: random(i, 11) * Math.PI * 2,
      tint: random(i, 17),
    });
  }
  return items;
}

export function getHabitatItems(stage: Stage, rocks: boolean) {
  const key = `${stage}:${rocks ? "rocks" : "plants"}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const items = createHabitatItems(stage, rocks);
  cache.set(key, items);
  return items;
}
