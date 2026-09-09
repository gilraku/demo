import type { Stage } from "./topics";
const fract = (v: number) => v - Math.floor(v);
export const random = (x: number, z: number) =>
  fract(Math.sin(x * 127.1 + z * 311.7) * 43758.5453);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function noise(x: number, z: number) {
  const a = Math.floor(x),
    b = Math.floor(z),
    u = smooth(0, 1, fract(x)),
    v = smooth(0, 1, fract(z));
  return mix(
    mix(random(a, b), random(a + 1, b), u),
    mix(random(a, b + 1), random(a + 1, b + 1), u),
    v,
  );
}
export function fbm(x: number, z: number) {
  return (
    noise(x, z) * 0.58 +
    noise(x * 2.1, z * 2.1) * 0.27 +
    noise(x * 4.3, z * 4.3) * 0.15
  );
}
export const riverX = (z: number) =>
  23 + Math.sin(z * 0.055) * 5 + Math.sin(z * 0.13) * 1.3;
export function pitRadius(x: number, z: number) {
  const nx = (x + 9) / 13,
    nz = (z - 1) / 9;
  const a = Math.atan2(nz, nx);
  return (
    Math.hypot(nx, nz) / (1 + Math.sin(a * 3) * 0.075 + Math.cos(a * 5) * 0.045)
  );
}

// Elliptical falloff avoids the rectangular shoulders of the old grading pads.
function siteBlend(
  x: number,
  z: number,
  px: number,
  pz: number,
  rx: number,
  rz: number,
) {
  return smooth(0.65, 1.55, Math.hypot((x - px) / rx, (z - pz) / rz));
}

export function heightAt(x: number, z: number, stage: Stage) {
  const distance = Math.hypot(x, z),
    mountain = smooth(24, 70, distance);
  let h =
    0.9 +
    (fbm(x * 0.035, z * 0.065) - 0.45) * (2 + mountain * 21) +
    mountain * 5;

  // Compact level cores support buildings; broad rounded shoulders meet the hills.
  // 1. Workshop & maintenance yard
  const fWorkshop = siteBlend(x, z, 10, -17, 5.8, 4.0);
  h = mix(1.2, h, fWorkshop);

  // 2. Stockpile pad
  const fStockpile = siteBlend(x, z, 12, -6, 5.5, 4.0);
  h = mix(1.2, h, fStockpile);

  // 3. Sediment pond pad
  const fPond = siteBlend(x, z, 13, 17, 5.5, 3.8);
  h = mix(1.15, h, fPond);

  // 4. Village residential pad
  const fVillage = siteBlend(x, z, 29, -17, 5.0, 4.2);
  h = mix(1.15, h, fVillage);

  const r = pitRadius(x, z);
  if (stage !== "pre" && r < 1.08) {
    const level = Math.max(0, r) * 7;
    const bench =
      -4.6 + Math.floor(level) * 0.79 + smooth(0.82, 1, fract(level)) * 0.79;
    h = mix(bench, h, smooth(0.94, 1.08, r));
  }
  const riverDistance = Math.abs(x - riverX(z));
  h = mix(-0.35, h, smooth(1.1, 3.6 + smooth(2, 8, h) * (5.5 + Math.sin(z * 0.07)), riverDistance));
  return h;
}

export const sitePositions: Record<string, [number, number]> = {
  pit: [-9, 1],
  water: [13, 17],
  air: [10, -17],
  community: [29, -16],
  reclaim: [-21, -15],
};
