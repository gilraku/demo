"use client";

import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { InstancedMesh, Object3D } from "three";
import { random, riverX } from "@/lib/terrain";
import { getHabitatItems } from "@/lib/habitat-cache";
import type { Stage } from "@/lib/topics";
import NatureInstances from "./NatureInstances";

function Habitat({
  stage,
  paused,
  rocks = false,
}: {
  stage: Stage;
  paused: boolean;
  rocks?: boolean;
}) {
  const variants = useMemo(() => {
    const groups: import("./NatureInstances").NatureInstance[][] = [[], []];
    getHabitatItems(stage, rocks).forEach((item, i) => {
      groups[i % 2].push(item);
    });
    return groups;
  }, [stage, rocks]);
  const models = rocks
    ? ["stone_largeC", "rock_largeA"]
    : ["plant_bushDetailed", "grass_leafsLarge"];
  return (
    <group>
      {models.map((model, i) => (
        <NatureInstances
          key={model}
          model={model}
          items={variants[i]}
          paused={paused}
        />
      ))}
    </group>
  );
}

function RiverCurrent({ paused }: { paused: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  const time = useRef(0);
  const object = useMemo(() => new Object3D(), []);
  const invalidate = useThree((state) => state.invalidate);
  const place = () => {
    if (!mesh.current) return;
    for (let i = 0; i < 64; i++) {
      const z = -80 + ((i * 2.5 + time.current * 0.8) % 160);
      const offset = (random(i, 43) - 0.5) * 1.7;
      object.position.set(riverX(z) + offset, 0.045, z);
      object.rotation.set(-Math.PI / 2, 0, 0);
      object.scale.set(
        0.025 + random(i, 4) * 0.045,
        0.4 + random(i, 8) * 1.1,
        1,
      );
      object.updateMatrix();
      mesh.current.setMatrixAt(i, object.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  };
  useLayoutEffect(() => {
    place();
    invalidate();
  }, [paused]); // Wake the demand renderer on resume.
  useFrame((_, delta) => {
    if (paused) return;
    time.current += Math.min(delta, 0.05);
    place();
    invalidate();
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, 64]}
      frustumCulled={false}
    >
      <planeGeometry />
      <meshBasicMaterial
        color="#b6d8b8"
        transparent
        opacity={0.3}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export default function LandscapeDetails({
  stage,
  paused,
}: {
  stage: Stage;
  paused: boolean;
}) {
  return (
    <group>
      <Suspense fallback={null}>
        <Habitat stage={stage} paused={paused} />
        <Habitat stage={stage} paused={paused} rocks />
      </Suspense>
      <RiverCurrent paused={paused} />
    </group>
  );
}
