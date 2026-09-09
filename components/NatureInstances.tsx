"use client";
import { publicPath } from "@/lib/public-path";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, InstancedMesh, Object3D } from "three";
import { revealProgress } from "@/lib/motion";
import { prepareNatureGeometry } from "@/lib/nature-assets";

const models = [
  "tree_oak",
  "tree_detailed",
  "tree_palm",
  "plant_bushDetailed",
  "grass_leafsLarge",
  "stone_largeC",
  "rock_largeA",
];
const urls = models.map((model) => publicPath(`/assets/kenney/nature/${model}.glb`));

const readyModels = new WeakMap<HTMLCanvasElement, Map<string, number>>();

export type NatureInstance = {
  x: number;
  y: number;
  z: number;
  size: number;
  angle: number;
  tint: number;
};

export default function NatureInstances({
  model,
  items,
  paused = false,
}: {
  model: string;
  items: NatureInstance[];
  paused?: boolean;
}) {
  const assets = useGLTF(urls);
  const { scene } = assets[models.indexOf(model)];
  const geometry = useMemo(() => prepareNatureGeometry(scene), [scene]);
  const mesh = useRef<InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const state = useRef<
    { from: NatureInstance; to: NatureInstance; current: NatureInstance }[]
  >([]);
  const initialized = useRef(false);
  const started = useRef(0);
  const running = useRef(false);
  const object = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);
  const paint = (t: number) => {
    if (!mesh.current) return;
    mesh.current.count = state.current.length;
    state.current.forEach((row, i) => {
      const item = row.to;
      const size = row.from.size + (item.size - row.from.size) * t;
      const y = row.from.y + (item.y - row.from.y) * t;
      row.current = { ...item, size, y };
      object.position.set(item.x, y - 0.035, item.z);
      object.scale.setScalar(Math.max(0.00001, size));
      object.rotation.set(0, item.angle, 0);
      object.updateMatrix();
      mesh.current!.setMatrixAt(i, object.matrix);
      color.setRGB(
        0.8 + item.tint * 0.2,
        0.87 + item.tint * 0.13,
        0.82 + item.tint * 0.18,
      );
      mesh.current!.setColorAt(i, color);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor)
      mesh.current.instanceColor.needsUpdate = true;
  };
  useLayoutEffect(() => {
    const key = (item: NatureInstance) => `${item.x}:${item.z}`;
    const previous = new Map(
      state.current.map((row) => [key(row.current), row.current]),
    );
    const targets = new Map(items.map((item) => [key(item), item]));
    state.current = items.map((to) => {
      const from = previous.get(key(to)) ?? {
        ...to,
        size: initialized.current ? 0 : to.size,
      };
      return { from, to, current: from };
    });
    previous.forEach((from, id) => {
      if (!targets.has(id) && from.size > 0.001)
        state.current.push({ from, to: { ...from, size: 0 }, current: from });
    });
    started.current = performance.now();
    running.current = initialized.current && !paused;
    paint(running.current ? 0 : 1);
    initialized.current = true;
    invalidate();
  }, [items, geometry, paused, invalidate]);
  useLayoutEffect(() => {
    const ready = readyModels.get(canvas) ?? new Map<string, number>();
    readyModels.set(canvas, ready);
    ready.set(model, (ready.get(model) ?? 0) + 1);
    canvas.dataset.natureModels = String(ready.size);
    return () => {
      const count = (ready.get(model) ?? 1) - 1;
      if (count) ready.set(model, count);
      else ready.delete(model);
      canvas.dataset.natureModels = String(ready.size);
    };
  }, [canvas, model]);
  useFrame(() => {
    if (!running.current) return;
    const t = revealProgress(started.current, performance.now(), paused);
    paint(t);
    if (t === 1) running.current = false;
    else invalidate();
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, undefined, 2000]}
      frustumCulled={false}
      castShadow
      receiveShadow
    >
      <meshToonMaterial vertexColors />
    </instancedMesh>
  );
}
