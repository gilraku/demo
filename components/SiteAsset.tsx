"use client";
import { publicPath } from "@/lib/public-path";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  Box3,
  Mesh,
  MeshStandardMaterial,
  MeshToonMaterial,
  Vector3,
} from "three";
const paths = {
  conveyor: "/assets/kenney/factory/conveyor-long-sides.glb",
  hopper: "/assets/kenney/factory/hopper-square.glb",
  fence: "/assets/kenney/nature/fence_simpleLow.glb",
  gate: "/assets/kenney/nature/fence_gate.glb",
};
const keys = Object.keys(paths) as (keyof typeof paths)[];
const urls = keys.map((key) => publicPath(paths[key]));
const ready = new WeakMap<HTMLCanvasElement, Map<string, number>>();
export default function SiteAsset({
  kind,
  width,
  position,
  rotation = 0,
}: {
  kind: keyof typeof paths;
  width: number;
  position: [number, number, number];
  rotation?: number;
}) {
  const assets = useGLTF(urls),
    source = assets[keys.indexOf(kind)].scene;
  const data = useMemo(() => {
    const scene = source.clone(true),
      materials: MeshToonMaterial[] = [];
    scene.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      const mapMaterial = (old: MeshStandardMaterial) => {
        const material = new MeshToonMaterial({
          map: old.map,
          color: old.map ? "#e0e9ce" : "#897351",
          side: old.side,
        });
        materials.push(material);
        return material;
      };
      node.material = Array.isArray(node.material)
        ? node.material.map(mapMaterial)
        : mapMaterial(node.material);
      node.castShadow = node.receiveShadow = true;
    });
    const box = new Box3().setFromObject(scene),
      size = box.getSize(new Vector3()),
      center = box.getCenter(new Vector3());
    return {
      scene,
      materials,
      scale: width / Math.max(size.x, size.z),
      offset: [-center.x, -box.min.y, -center.z] as [number, number, number],
    };
  }, [source, width]);
  const { gl, invalidate } = useThree();
  useEffect(
    () => () => data.materials.forEach((material) => material.dispose()),
    [data],
  );
  useLayoutEffect(() => {
    const counts = ready.get(gl.domElement) ?? new Map<string, number>();
    ready.set(gl.domElement, counts);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
    gl.domElement.dataset.siteDetailModels = String(counts.size);
    invalidate();
    return () => {
      const n = (counts.get(kind) ?? 1) - 1;
      if (n) counts.set(kind, n);
      else counts.delete(kind);
      gl.domElement.dataset.siteDetailModels = String(counts.size);
    };
  }, [kind, gl, invalidate]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <group scale={data.scale}>
        <primitive object={data.scene} position={data.offset} dispose={null} />
      </group>
    </group>
  );
}
