"use client";

import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { InstancedMesh, Object3D } from "three";
import { fbm, heightAt, pitRadius, random, riverX } from "@/lib/terrain";
import { clearOfOperationalRoads, workingArea } from "@/lib/site-layout";
import type { Stage } from "@/lib/topics";
import NatureInstances from "./NatureInstances";

// A fixed seed keeps habitat clusters in place when the mining stage changes.
function habitat(stage: Stage, rocks: boolean) {
  const items = [];
  for (let i = 0; i < 1600; i++) {
    const x = (random(i, 412) - 0.5) * 105;
    const z = (random(i, 719) - 0.5) * 95;
    const bank = Math.abs(x - riverX(z));
    if (bank < 2.4 || heightAt(x, z, stage) < 0.2) continue;
    if (x > 23 && x < 37 && z > -24 && z < -3) continue;
    const size = rocks
      ? 0.35 + random(i, 321) * 0.7
      : 0.32 + random(i, 312) * 0.55;
    // Bounds cover both GLB variants after height normalization and scaling.
    const footprintRadius = size * (rocks ? 2.5 : 2.64);
    if (
      stage !== "pre" &&
      (pitRadius(x, z) < 1.35 ||
        workingArea(x, z) ||
        !clearOfOperationalRoads(x, z, footprintRadius))
    )
      continue;
    const cluster = fbm(x * 0.12, z * 0.12);
    if (rocks ? cluster < 0.64 : cluster < 0.48 || cluster > 0.68) continue;

    items.push({
      x,
      z,
      size,
      angle: random(i, 11) * Math.PI * 2,
      tint: random(i, 17),
    });
  }
  return items;
}

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
    habitat(stage, rocks).forEach((item, i) => {
      groups[i % 2].push({
        ...item,
        y: heightAt(item.x, item.z, stage),
        size: item.size * (rocks ? 1.0 : 1.1),
      });
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
