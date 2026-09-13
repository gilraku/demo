"use client";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  InstancedMesh,
  Object3D,
  Quaternion,
  Vector3,
} from "three";
import { heightAt, random, riverX } from "@/lib/terrain";
import { pond } from "@/lib/site-layout";
import { conveyorPlacements, pondWaterLevels } from "@/lib/detail-layout";
import { createCoalHeap, createPondBerm } from "@/lib/detail-geometry";
import type { Stage } from "@/lib/topics";
import SiteAsset from "./SiteAsset";

function Block({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshToonMaterial color={color} />
    </mesh>
  );
}
function Path({
  points,
  width = 0.5,
  stage = "active",
  color = "#b9ab83",
}: {
  points: [number, number][];
  width?: number;
  stage?: Stage;
  color?: string;
}) {
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(
        points.map(([x, z]) => new Vector3(x, 0, z)),
      ),
      vertices: number[] = [];
    const edges: number[][] = [];
    for (let i = 0; i <= 60; i++) {
      const p = curve.getPoint(i / 60),
        t = curve.getTangent(i / 60),
        row: number[] = [];
      for (const side of [-1, 1]) {
        const x = p.x - (t.z * width * side) / 2,
          z = p.z + (t.x * width * side) / 2;
        row.push(x, heightAt(x, z, stage) + 0.045, z);
      }
      edges.push(row);
    }
    for (let i = 0; i < 60; i++) {
      const a = edges[i],
        b = edges[i + 1];
      vertices.push(
        ...a.slice(0, 3),
        ...b.slice(0, 3),
        ...a.slice(3),
        ...a.slice(3),
        ...b.slice(0, 3),
        ...b.slice(3),
      );
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    g.computeVertexNormals();
    return g;
  }, [points, width, stage]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshToonMaterial color={color} side={DoubleSide} />
    </mesh>
  );
}
function CoalOnBelt({ paused }: { paused: boolean }) {
  const mesh = useRef<InstancedMesh>(null),
    time = useRef(0),
    object = useMemo(() => new Object3D(), []);
  const invalidate = useThree((s) => s.invalidate);
  const paint = () => {
    if (!mesh.current) return;
    for (let i = 0; i < 12; i++) {
      const z = -8.55 + ((i * 0.38 + time.current * 0.6) % 4.4);
      object.position.set(15.7 + (random(i, 45) - 0.5) * 0.25, 1.59, z);
      object.scale.set(0.14, 0.09, 0.16);
      object.rotation.set(0, i, 0);
      object.updateMatrix();
      mesh.current.setMatrixAt(i, object.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  };
  useLayoutEffect(() => {
    paint();
    invalidate();
  }, [paused, invalidate]);
  useFrame((_, delta) => {
    if (paused) return;
    time.current += Math.min(delta, 0.1);
    paint();
    invalidate();
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, 12]}
      frustumCulled={false}
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshToonMaterial color="#28312d" />
    </instancedMesh>
  );
}
export function Stockpile({ paused }: { paused: boolean }) {
  const heaps = useMemo(() => [0, 1, 2].map(createCoalHeap), []);
  useEffect(() => () => heaps.forEach(g => g.dispose()), [heaps]);
  return (
    <group>
      <mesh
        position={[12, 1.205, -6]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[6.1, 4.15, 1]}
        receiveShadow
      >
        <circleGeometry args={[1, 24]} />
        <meshToonMaterial color="#91836b" />
      </mesh>
      {[
        { x: 9.5, z: -6.7, h: 1.25, r: 1.8 },
        { x: 12.3, z: -5.9, h: 1.65, r: 2.0 },
        { x: 15.45, z: -3.55, h: 0.42, r: 0.7 },
      ].map((pile, i) => (
        <mesh
          key={i}
          position={[pile.x, 1.23, pile.z]}
          geometry={heaps[i]}
          scale={[pile.r, pile.h, pile.r * 0.8]}
          rotation={[0, i * 0.7, 0]}
          castShadow
          receiveShadow
        >

          <meshToonMaterial color={i === 1 ? "#29302d" : "#333b34"} />
        </mesh>
      ))}
      <Suspense fallback={null}>
        {conveyorPlacements.map(([x, z], i) => (
          <SiteAsset
            key={i}
            kind="conveyor"
            width={1.6}
            rotation={Math.PI / 2}
            position={[x, 1.2, z]}
          />
        ))}
        <SiteAsset kind="hopper" width={0.95} position={[15.7, 1.52, -8.55]} />
      </Suspense>
      {/* Low curbs make the coal yard read as a contained operational area. */}
      <Block
        position={[11.8, 1.3, -8.55]}
        size={[6.2, 0.16, 0.22]}
        color="#6f695a"
      />
      <Block
        position={[8.72, 1.3, -6.75]}
        size={[0.22, 0.16, 3.7]}
        color="#6f695a"
      />
      {/* Concrete legs and a safety beam give the conveyor a clearer silhouette. */}
      {conveyorPlacements.map(([x, z], i) => (
        <group key={`conveyor-frame-${i}`} position={[x, 0, z]}>
          {[-0.52, 0.52].map((offset) => (
            <Block
              key={offset}
              position={[offset, 0.93, 0]}
              size={[0.14, 0.66, 0.14]}
              color="#5e6b64"
            />
          ))}
          <Block
            position={[0, 1.28, 0]}
            size={[1.25, 0.1, 0.14]}
            color={i === 1 ? "#c49b3d" : "#7b8579"}
          />
        </group>
      ))}
      <CoalOnBelt paused={paused} />
      <mesh position={[15.7, 1.48, -3.92]} rotation={[0.28, 0, 0]} receiveShadow>
        <boxGeometry args={[0.58, 0.07, 0.65]} />
        <meshToonMaterial color="#697570" />
      </mesh>
      <Path
        points={[
          [15.7, -3.6],
          [15.7, -2.7],
          [18, -1.7],
        ]}
        width={0.9}
      />
      {[0, 1].map((i) => (
        <Block
          key={i}
          position={[14.5 + i * 1.2, 1.27, -3.2]}
          size={[0.12, 0.04, 0.6]}
          color="#d0ba7e"
        />
      ))}
    </group>
  );
}
function Flume({
  a,
  b,
}: {
  a: [number, number, number];
  b: [number, number, number];
}) {
  const { position, rotation, length } = useMemo(() => {
    const start = new Vector3(...a),
      end = new Vector3(...b),
      direction = end.clone().sub(start);
    return {
      position: start.add(end).multiplyScalar(0.5),
      rotation: new Quaternion().setFromUnitVectors(
        new Vector3(0, 0, 1),
        direction.clone().normalize(),
      ),
      length: direction.length(),
    };
  }, [a, b]);
  return (
    <group position={position} quaternion={rotation}>
      <Block
        position={[0, -0.055, 0]}
        size={[0.48, 0.1, length]}
        color="#a9a88e"
      />
      <Block
        position={[0, 0.015, 0]}
        size={[0.3, 0.025, length]}
        color="#538e86"
      />
      {[-0.22, 0.22].map((x) => (
        <Block
          key={x}
          position={[x, 0.04, 0]}
          size={[0.08, 0.17, length]}
          color="#a9a88e"
        />
      ))}
    </group>
  );
}
export function SedimentPonds() {
  const berm = useMemo(createPondBerm, []);
  useEffect(() => () => berm.dispose(), [berm]);
  return (
    <group>
      {pondWaterLevels.map((y, i) => (
        <group key={i} position={[pond.x - 2.8 + i * 2.8, y, pond.z]}>
          <mesh geometry={berm} castShadow receiveShadow>
            <meshToonMaterial color="#a7a57a" side={DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[2, 5.2]} />
            <meshStandardMaterial
              color={["#78846a", "#53817b", "#398c85"][i]}
              roughness={0.18}
              metalness={0.18}
            />
          </mesh>
          <Block
            position={[-0.68, 0.15, 2.65]}
            size={[0.12, 0.35, 0.12]}
            color="#dfddba"
          />
        </group>
      ))}
      <Flume a={[8, 1.62, 15]} b={[9.25, 1.53, 15]} />
      <Flume a={[11.1, 1.53, 18.8]} b={[12.1, 1.41, 18.8]} />
      <Flume a={[13.9, 1.41, 15.2]} b={[14.9, 1.29, 15.2]} />
      <Flume a={[16.7, 1.29, 18.8]} b={[19.1, 1.12, 18.8]} />
      {/* The outlet passes below the service road before reaching the river. */}
      <Flume a={[21.1, 0.9, 18.8]} b={[riverX(18.8) - 0.9, 0.07, 18.8]} />
      <Block
        position={[20, 0.98, 18.8]}
        size={[2.2, 0.28, 0.6]}
        color="#8c9885"
      />
      <Path
        points={[
          [7.8, 13.6],
          [7.8, 20.4],
          [17.7, 20.4],
          [17.7, 13.6],
          [7.8, 13.6],
        ]}
        width={0.45}
      />
      <Block
        position={[17.6, 1.52, 20.1]}
        size={[0.7, 0.65, 0.65]}
        color="#c8cbb3"
      />
      <Block
        position={[17.6, 1.89, 20.1]}
        size={[0.88, 0.12, 0.84]}
        color="#477f76"
      />
    </group>
  );
}
export function VillageDetails({ stage }: { stage: Stage }) {
  return (
    <group>
      <Suspense fallback={null}>
        {[0, 1, 2].map((i) => {
          const x = 26 + i * 2.8,
            z = -13.6;
          return (
            <group key={i}>
              <SiteAsset
                kind="gate"
                width={1.8}
                position={[x, heightAt(x, z + 1.12, stage), z + 1.12]}
              />
              <SiteAsset
                kind="fence"
                width={2.1}
                rotation={Math.PI / 2}
                position={[x + 1.15, heightAt(x + 1.15, z, stage), z]}
              />
            </group>
          );
        })}
      </Suspense>
      {[0, 1, 2].map((i) => {
        const x = 26 + i * 2.8,
          z = -13.6;
        return (
          <group key={i}>
            <Path
              points={[
                [x, z + 0.75],
                [x, z + 1.6],
              ]}
              width={0.42}
              stage={stage}
            />
            <Block
              position={[
                x - 0.7,
                heightAt(x - 0.7, z + 0.9, stage) + 0.18,
                z + 0.9,
              ]}
              size={[0.5, 0.32, 0.4]}
              color="#957347"
            />
            <mesh
              position={[
                x - 0.7,
                heightAt(x - 0.7, z + 0.9, stage) + 0.44,
                z + 0.9,
              ]}
              castShadow
            >
              <icosahedronGeometry args={[0.32, 1]} />
              <meshToonMaterial color="#74904e" />
            </mesh>
          </group>
        );
      })}
      {Array.from({ length: 24 }, (_, i) => {
        const x = 27 + (i % 6) * 1.1,
          z = -10.2 + Math.floor(i / 6) * 0.48;
        return (
          <mesh
            key={i}
            position={[x, heightAt(x, z, stage) + 0.18, z]}
            castShadow
          >
            <coneGeometry args={[0.17, 0.38, 5]} />
            <meshToonMaterial color={i % 2 ? "#719558" : "#99aa62"} />
          </mesh>
        );
      })}
    </group>
  );
}

/** The apron shoulders follow the terrain instead of leaving an exposed slab. */
export function WorkshopFoundation() {
  const geometry = useMemo(() => {
    const vertices: number[] = [];
    const edge: [number, number][] = [];
    for (let side = 0; side < 4; side++) for (let i = 0; i < 24; i++) {
      const t = i / 24;
      edge.push(side === 0 ? [-5.9 + 11.8 * t, -3.9] : side === 1 ? [5.9, -3.9 + 7.8 * t] : side === 2 ? [5.9 - 11.8 * t, 3.9] : [-5.9, 3.9 - 7.8 * t]);
    }
    const top = ([x,z]: [number,number]) => [x, -0.16, z];
    const toe = ([x,z]: [number,number]) => {
      const tx = x * 1.17, tz = z * 1.2;
      return [tx, Math.min(-0.18, heightAt(10 + tx, -17 + tz, 'active') - 1.24), tz];
    };
    edge.forEach((a,i) => {
      const b = edge[(i+1)%edge.length];
      vertices.push(...top(a), ...top(b), ...toe(a), ...toe(a), ...top(b), ...toe(b));
    });
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} receiveShadow castShadow><meshToonMaterial color="#90836b" side={DoubleSide} /></mesh>;
}
