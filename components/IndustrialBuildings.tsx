"use client";
import { publicPath } from "@/lib/public-path";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  Box3,
  Color,
  Mesh,
  MeshStandardMaterial,
  MeshToonMaterial,
  Vector3,
} from "three";

const models = [
  "building-n",
  "building-s",
  "building-p",
  "shipping-container-a",
];
const urls = models.map((name) => publicPath(`/assets/kenney/industrial/${name}.glb`));
const ready = new WeakMap<HTMLCanvasElement, Set<string>>();

export default function IndustrialBuilding({
  model,
  width,
  position,
  rotation = 0,
}: {
  model: string;
  width: number;
  position: [number, number, number];
  rotation?: number;
}) {
  const assets = useGLTF(urls);
  const source = assets[models.indexOf(model)].scene;
  const { scene, factor, offset, materials } = useMemo(() => {
    const scene = source.clone(true);
    const materials: MeshToonMaterial[] = [];
    scene.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      const originals = Array.isArray(node.material)
        ? node.material
        : [node.material];
      const mapped = originals.map((original: MeshStandardMaterial) => {
        const material = new MeshToonMaterial({
          map: original.map,
          color: new Color("#e2f5e8"),
          side: original.side,
        });
        materials.push(material);
        return material;
      });
      node.material = Array.isArray(node.material) ? mapped : mapped[0];
      node.castShadow = node.receiveShadow = true;
    });
    const box = new Box3().setFromObject(scene);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    return {
      scene,
      factor: width / Math.max(size.x, size.z),
      offset: [-center.x, -box.min.y, -center.z] as [number, number, number],
      materials,
    };
  }, [source, width]);
  const { gl, invalidate } = useThree();
  useEffect(
    () => () => materials.forEach((material) => material.dispose()),
    [materials],
  );
  useLayoutEffect(() => {
    const set = ready.get(gl.domElement) ?? new Set<string>();
    ready.set(gl.domElement, set);
    set.add(model);
    gl.domElement.dataset.industrialModels = String(set.size);
    invalidate();
    return () => {
      set.delete(model);
      gl.domElement.dataset.industrialModels = String(set.size);
    };
  }, [model, gl, invalidate]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <group scale={factor}>
        <primitive object={scene} position={offset} dispose={null} />
      </group>
    </group>
  );
}
