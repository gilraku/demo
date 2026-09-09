"use client";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  InstancedMesh,
  Object3D,
  PlaneGeometry,
  Vector3,
  CatmullRomCurve3,
  DataTexture,
  RepeatWrapping,
  RGBAFormat,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  Group,
  ShaderChunk,
} from "three";
import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import StagePresence from "./StagePresence";
import IndustrialBuilding from "./IndustrialBuildings";
import { WorkshopFoundation, Stockpile, SedimentPonds, VillageDetails } from "./SiteDetails";
import {
  haulRoad,
  serviceRoad,
  workingArea,
  clearOfOperationalRoads,
  ringRoad,
  ringRoadCurve,
} from "@/lib/site-layout";
import {
  fbm,
  heightAt,
  pitRadius,
  random,
  riverX,
  smooth,
} from "@/lib/terrain";
import type { Stage } from "@/lib/topics";
import LandscapeDetails from "./LandscapeDetails";
import NatureInstances from "./NatureInstances";

// Patch Three.js v0.183 typo in morphcolor_vertex (vColor += vec3 -> vColor.rgb += vec3)
if (
  typeof ShaderChunk !== "undefined" &&
  ShaderChunk.morphcolor_vertex &&
  ShaderChunk.morphcolor_vertex.includes("vColor +=")
) {
  ShaderChunk.morphcolor_vertex = ShaderChunk.morphcolor_vertex.replace(
    "vColor += getMorph( gl_VertexID, i, 2 ).rgb",
    "vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb",
  );
}

function useGroundTexture() {
  const texture = useMemo(() => {
    const size = 128,
      data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4,
          v = 210 + fbm(x * 0.08, y * 0.08) * 28 + random(x, y) * 6;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
    const t = new DataTexture(data, size, size, RGBAFormat);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.magFilter = LinearFilter;
    t.minFilter = LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 4;
    t.repeat.set(18, 18);
    t.needsUpdate = true;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function useGroundGeometry() {
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(180, 180, 160, 160);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    const count = p.count;

    // Filter triangles inside the open pit once
    if (g.index) {
      const indices: number[] = [];
      for (let i = 0; i < g.index.count; i += 3) {
        const a = g.index.getX(i),
          b = g.index.getX(i + 1),
          c = g.index.getX(i + 2);
        const x = (p.getX(a) + p.getX(b) + p.getX(c)) / 3,
          z = (p.getZ(a) + p.getZ(b) + p.getZ(c)) / 3;
        if (pitRadius(x, z) > 1.075) indices.push(a, b, c);
      }
      g.setIndex(indices);
    }

    const posPre = new Float32Array(count * 3);
    const posActive = new Float32Array(count * 3);
    const posPost = new Float32Array(count * 3);

    const colPre = new Float32Array(count * 4);
    const colActive = new Float32Array(count * 4);
    const colPost = new Float32Array(count * 4);

    const grass = new Color("#72a58c"),
      rock = new Color("#77674f"),
      soil = new Color("#c6a273"),
      coal = new Color("#33342f");

    for (let i = 0; i < count; i++) {
      const x = p.getX(i),
        z = p.getZ(i);
      const r = pitRadius(x, z),
        n = fbm(x * 0.55, z * 0.55);
      const riverDistance = Math.abs(x - riverX(z));

      // PRE
      const hPre = heightAt(x, z, "pre");
      posPre[i * 3] = x;
      posPre[i * 3 + 1] = hPre;
      posPre[i * 3 + 2] = z;

      const meadow = grass
        .clone()
        .lerp(
          new Color("#acae70"),
          smooth(0.38, 0.7, fbm(x * 0.085, z * 0.085)) * 0.65,
        );
      const cPre = meadow.clone();
      cPre.lerp(rock, smooth(6, 20, hPre) * 0.6);
      cPre.multiplyScalar(0.7 + n * 0.55);
      if (riverDistance < 3)
        cPre.lerp(new Color("#a99c78"), 1 - smooth(1.2, 3, riverDistance));
      colPre[i * 4] = cPre.r;
      colPre[i * 4 + 1] = cPre.g;
      colPre[i * 4 + 2] = cPre.b;
      colPre[i * 4 + 3] = 1.0;

      // ACTIVE
      const hActive = heightAt(x, z, "active");
      posActive[i * 3] = x;
      posActive[i * 3 + 1] = hActive;
      posActive[i * 3 + 2] = z;

      const cActive = meadow.clone();
      cActive.lerp(rock, smooth(6, 20, hActive) * 0.6);
      cActive.multiplyScalar(0.7 + n * 0.55);
      if (r < 1.1) {
        cActive.copy(soil).multiplyScalar(0.78 + n * 0.38);
        if (r < 0.3) cActive.lerp(coal, 1 - smooth(0.16, 0.32, r));
        const bench = (r * 7) % 1;
        if (bench > 0.8) cActive.multiplyScalar(0.76);
      }
      if (riverDistance < 3)
        cActive.lerp(new Color("#a99c78"), 1 - smooth(1.2, 3, riverDistance));
      colActive[i * 4] = cActive.r;
      colActive[i * 4 + 1] = cActive.g;
      colActive[i * 4 + 2] = cActive.b;
      colActive[i * 4 + 3] = 1.0;

      // POST
      const hPost = heightAt(x, z, "post");
      posPost[i * 3] = x;
      posPost[i * 3 + 1] = hPost;
      posPost[i * 3 + 2] = z;

      const cPost = meadow.clone();
      cPost.lerp(rock, smooth(6, 20, hPost) * 0.6);
      cPost.multiplyScalar(0.7 + n * 0.55);
      if (r < 1.1) {
        cPost.copy(soil).multiplyScalar(0.78 + n * 0.38);
        if (r < 0.3) cPost.lerp(coal, 1 - smooth(0.16, 0.32, r));
        cPost.lerp(grass, 0.52);
        const bench = (r * 7) % 1;
        if (bench > 0.8) cPost.multiplyScalar(0.76);
      }
      if (riverDistance < 3)
        cPost.lerp(new Color("#a99c78"), 1 - smooth(1.2, 3, riverDistance));
      colPost[i * 4] = cPost.r;
      colPost[i * 4 + 1] = cPost.g;
      colPost[i * 4 + 2] = cPost.b;
      colPost[i * 4 + 3] = 1.0;
    }

    // Base = PRE
    g.setAttribute("position", new BufferAttribute(posPre, 3));
    g.setAttribute("color", new BufferAttribute(colPre, 4));
    g.computeVertexNormals();
    const normPre = g.attributes.normal.clone();

    // Compute ACTIVE normals
    g.setAttribute("position", new BufferAttribute(posActive, 3));
    g.computeVertexNormals();
    const normActive = g.attributes.normal.clone();

    // Compute POST normals
    g.setAttribute("position", new BufferAttribute(posPost, 3));
    g.computeVertexNormals();
    const normPost = g.attributes.normal.clone();

    // Reset base to PRE
    g.setAttribute("position", new BufferAttribute(posPre, 3));
    g.setAttribute("normal", normPre);

    g.morphAttributes.position = [
      new BufferAttribute(posActive, 3),
      new BufferAttribute(posPost, 3),
    ];
    g.morphAttributes.normal = [normActive, normPost];
    g.morphAttributes.color = [
      new BufferAttribute(colActive, 4),
      new BufferAttribute(colPost, 4),
    ];

    return g;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

function useMinePitGeometry() {
  const geometry = useMemo(() => {
    const rings: [number, number][] = [
      [0, -4.6],
      [0.12, -4.6],
    ];
    for (let level = 1; level <= 7; level++) {
      rings.push(
        [0.12 + level * 0.126, -4.6 + (level - 1) * 0.79],
        [0.145 + level * 0.126, -4.6 + level * 0.79],
      );
    }
    rings.push([1.14, 1.1]);

    const segments = 240;
    const vertCount = rings.length * (segments + 1);

    const posPre = new Float32Array(vertCount * 3);
    const posActive = new Float32Array(vertCount * 3);
    const posPost = new Float32Array(vertCount * 3);

    const colPre = new Float32Array(vertCount * 4);
    const colActive = new Float32Array(vertCount * 4);
    const colPost = new Float32Array(vertCount * 4);

    const uvs = new Float32Array(vertCount * 2);
    const indices: number[] = [];

    const grass = new Color("#72a58c"),
      rock = new Color("#77674f");

    let ptr = 0;
    rings.forEach(([radius, y], j) => {
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2,
          shape = 1 + Math.sin(a * 3) * 0.075 + Math.cos(a * 5) * 0.045,
          x = -9 + Math.cos(a) * 13 * radius * shape,
          z = 1 + Math.sin(a) * 9 * radius * shape;

        // PRE: natural hill contour matching surrounding terrain
        const hPre = heightAt(x, z, "pre");
        posPre[ptr * 3] = x;
        posPre[ptr * 3 + 1] = hPre;
        posPre[ptr * 3 + 2] = z;

        const meadow = grass
          .clone()
          .lerp(
            new Color("#acae70"),
            smooth(0.38, 0.7, fbm(x * 0.085, z * 0.085)) * 0.65,
          );
        const cPre = meadow.clone();
        cPre.lerp(rock, smooth(6, 20, hPre) * 0.6);
        cPre.multiplyScalar(0.7 + fbm(x * 0.55, z * 0.55) * 0.55);
        colPre[ptr * 4] = cPre.r;
        colPre[ptr * 4 + 1] = cPre.g;
        colPre[ptr * 4 + 2] = cPre.b;
        colPre[ptr * 4 + 3] = 1.0;

        // ACTIVE: open pit stepped excavation
        const hActive =
          j === rings.length - 1 ? heightAt(x, z, "active") + 0.015 : y;
        posActive[ptr * 3] = x;
        posActive[ptr * 3 + 1] = hActive;
        posActive[ptr * 3 + 2] = z;

        const cActive = new Color(
          radius < 0.28 ? "#45463e" : "#a88c68",
        ).multiplyScalar(0.78 + fbm(x * 0.8, z * 0.8) * 0.3);
        if (j % 2 === 0 && j > 0) cActive.multiplyScalar(0.86);
        colActive[ptr * 4] = cActive.r;
        colActive[ptr * 4 + 1] = cActive.g;
        colActive[ptr * 4 + 2] = cActive.b;
        colActive[ptr * 4 + 3] = 1.0;

        // POST: reclaimed pit with softer natural tones
        const hPost =
          j === rings.length - 1 ? heightAt(x, z, "post") + 0.015 : y;
        posPost[ptr * 3] = x;
        posPost[ptr * 3 + 1] = hPost;
        posPost[ptr * 3 + 2] = z;

        const cPost = new Color(
          radius < 0.28 ? "#3d4b41" : "#788269",
        ).multiplyScalar(0.78 + fbm(x * 0.8, z * 0.8) * 0.3);
        if (j % 2 === 0 && j > 0) cPost.multiplyScalar(0.86);
        colPost[ptr * 4] = cPost.r;
        colPost[ptr * 4 + 1] = cPost.g;
        colPost[ptr * 4 + 2] = cPost.b;
        colPost[ptr * 4 + 3] = 1.0;

        uvs[ptr * 2] = x / 180;
        uvs[ptr * 2 + 1] = z / 180;

        if (j < rings.length - 1 && i < segments) {
          const k = j * (segments + 1) + i;
          indices.push(
            k,
            k + 1,
            k + segments + 1,
            k + 1,
            k + segments + 2,
            k + segments + 1,
          );
        }
        ptr++;
      }
    });

    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(posPre, 3));
    g.setAttribute("color", new BufferAttribute(colPre, 4));
    g.setAttribute("uv", new BufferAttribute(uvs, 2));
    g.setIndex(indices);

    g.computeVertexNormals();
    const normPre = g.attributes.normal.clone();

    g.setAttribute("position", new BufferAttribute(posActive, 3));
    g.computeVertexNormals();
    const normActive = g.attributes.normal.clone();

    g.setAttribute("position", new BufferAttribute(posPost, 3));
    g.computeVertexNormals();
    const normPost = g.attributes.normal.clone();

    // Reset base to PRE
    g.setAttribute("position", new BufferAttribute(posPre, 3));
    g.setAttribute("normal", normPre);

    g.morphAttributes.position = [
      new BufferAttribute(posActive, 3),
      new BufferAttribute(posPost, 3),
    ];
    g.morphAttributes.normal = [normActive, normPost];
    g.morphAttributes.color = [
      new BufferAttribute(colActive, 4),
      new BufferAttribute(colPost, 4),
    ];

    return g;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

function Ground({ meshRef }: { meshRef: React.RefObject<Mesh | null> }) {
  const texture = useGroundTexture();
  const geometry = useGroundGeometry();

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      morphTargetInfluences={[0, 0]}
      receiveShadow
    >
      <meshStandardMaterial vertexColors map={texture} roughness={0.98} />
    </mesh>
  );
}

function MinePit({
  meshRef,
  stage,
  pitInfluence,
}: {
  meshRef: React.RefObject<Mesh | null>;
  stage: Stage;
  pitInfluence: number;
}) {
  const texture = useGroundTexture();
  const geometry = useMinePitGeometry();

  const edges = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const level = index + 1,
          radius = 0.145 + level * 0.126,
          y = -4.6 + level * 0.79 + 0.025;
        return Array.from({ length: 181 }, (_, i): [number, number, number] => {
          const a = (i / 180) * Math.PI * 2,
            shape = 1 + Math.sin(a * 3) * 0.075 + Math.cos(a * 5) * 0.045;
          return [
            -9 + Math.cos(a) * 13 * radius * shape,
            y,
            1 + Math.sin(a) * 9 * radius * shape,
          ];
        });
      }),
    [],
  );

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        morphTargetInfluences={[0, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          map={texture}
          roughness={1}
          flatShading
          side={DoubleSide}
        />
      </mesh>
      {pitInfluence > 0.05 ? (
        <group>
          {edges.map((points, i) => (
            <Line
              key={i}
              points={points}
              color={stage === "post" ? "#58614c" : "#776347"}
              lineWidth={0.7}
            />
          ))}
        </group>
      ) : null}
    </group>
  );
}

function Forest({ stage, paused }: { stage: Stage; paused: boolean }) {
  const trees = useMemo(() => {
    const list = [];
    for (let i = 0; i < 1250; i++) {
      const x = (random(i, 9) - 0.5) * 135,
        z = (random(i, 21) - 0.5) * 125,
        r = pitRadius(x, z);

      if (Math.abs(x - riverX(z)) < 3.7) continue;
      if (
        Math.hypot(x - 6, z + 8) < 8 ||
        Math.hypot(x - 10, z - 13) < 7 ||
        Math.hypot(x - 29, z + 16) < 6
      )
        continue;
      if (z > 12 && z < 16 && x > -19 && x < 16) continue;

      const hPre = heightAt(x, z, "pre");
      if (hPre < 0.15) continue;
      const hActive = heightAt(x, z, "active");
      const hPost = heightAt(x, z, "post");
      const baseScale = 0.65 + random(i, 31) * 1.2;
      const rotY = random(i, 52) * 6.28;

      let scalePre = baseScale;
      if (r < 1.25 && random(i, 8) < 0.5) scalePre = 0;

      let scaleActive = baseScale;
      if (
        workingArea(x, z, baseScale * 1.12) ||
        !clearOfOperationalRoads(x, z, baseScale * 1.12) ||
        r < 1.3
      ) {
        scaleActive = 0;
      }

      let scalePost = baseScale;
      if (
        workingArea(x, z, baseScale * 1.12) ||
        !clearOfOperationalRoads(x, z, baseScale * 1.12)
      ) {
        scalePost = 0;
      } else if (r < 1.3) {
        if (r > 0.66 && random(i, 17) > 0.58) {
          scalePost = baseScale * 0.8;
        } else {
          scalePost = 0;
        }
      }

      const color = new Color("#306a60").lerp(
        new Color("#89b18a"),
        random(i, 34) * 0.8,
      );

      list.push({
        x,
        z,
        hPre,
        hActive,
        hPost,
        baseScale,
        scalePre,
        scaleActive,
        scalePost,
        rotY,
        color,
      });
    }
    return list;
  }, []);

  const variants = useMemo(() => {
    const groups: import("./NatureInstances").NatureInstance[][] = [[], [], []];
    trees.forEach((tree, i) => {
      const size =
        stage === "pre"
          ? tree.scalePre
          : stage === "active"
            ? tree.scaleActive
            : tree.scalePost;
      if (size <= 0) return;
      const y =
        stage === "pre"
          ? tree.hPre
          : stage === "active"
            ? tree.hActive
            : tree.hPost;
      const variant =
        tree.x > riverX(tree.z) && Math.abs(tree.z + 16) < 20 && i % 3 === 0
          ? 2
          : i % 2;
      groups[variant].push({
        x: tree.x,
        z: tree.z,
        y,
        size: size * 2.35,
        angle: tree.rotY,
        tint: random(i, 34),
      });
    });
    return groups;
  }, [trees, stage]);
  return (
    <group>
      {["tree_oak", "tree_detailed", "tree_palm"].map((model, i) => (
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

function Ribbon({
  points,
  width,
  color,
  water = false,
}: {
  points: [number, number][];
  width: number;
  color: string;
  water?: boolean;
}) {
  const geometry = useMemo(() => {
    const curve =
      points === ringRoad
        ? ringRoadCurve
        : new CatmullRomCurve3(points.map(([x, z]) => new Vector3(x, 0, z)));
    const vertices: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 220; i++) {
      const p = curve.getPoint(i / 220),
        t = curve.getTangent(i / 220);
      for (const side of [-1, 1]) {
        const x = p.x - (t.z * width * side) / 2,
          z = p.z + (t.x * width * side) / 2;
        vertices.push(x, water ? 0.02 : heightAt(x, z, "active") + 0.08, z);
      }
      if (i < 220) {
        const k = i * 2;
        indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(vertices), 3),
    );
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [points, width, water]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} receiveShadow>
      {water ? (
        <meshPhysicalMaterial
          color={color}
          roughness={0.12}
          metalness={0.1}
          clearcoat={1}
          side={DoubleSide}
        />
      ) : (
        <meshStandardMaterial color={color} roughness={0.9} side={DoubleSide} />
      )}
    </mesh>
  );
}

const riverPoints: [number, number][] = Array.from({ length: 32 }, (_, i) => {
  const z = -85 + i * 5.5;
  return [riverX(z), z];
});

function Box({
  p,
  s,
  c,
  rot = 0,
  roughness = 0.8,
  metalness = 0.1,
}: {
  p: [number, number, number];
  s: [number, number, number];
  c: string;
  rot?: number;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <mesh position={p} rotation={[0, rot, 0]} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        roughness={roughness}
        metalness={metalness}
      />
    </mesh>
  );
}

// Broad shapes keep the haul-truck silhouette readable from the overview.
function Truck({
  x,
  z,
  stage,
  rotation = 0,
}: {
  x: number;
  z: number;
  stage: Stage;
  rotation?: number;
}) {
  return (
    <group
      position={[x, heightAt(x, z, stage), z]}
      rotation={[0, rotation, 0]}
      scale={0.85}
    >
      <Box p={[0, 0.55, 0]} s={[2.8, 0.35, 1.25]} c="#d4a638" />
      <Box p={[0.85, 1.1, -0.38]} s={[0.85, 0.95, 0.7]} c="#d4a638" />
      <Box p={[0.98, 1.25, -0.38]} s={[0.62, 0.38, 0.73]} c="#29494c" />
      <group position={[-0.5, 0.95, 0]} rotation={[0, 0, -0.1]}>
        <Box p={[0, 0, 0]} s={[1.95, 0.22, 1.65]} c="#d4a638" />
        {[-0.77, 0.77].map((side) => (
          <Box
            key={side}
            p={[0, 0.32, side]}
            s={[1.95, 0.64, 0.14]}
            c="#d4a638"
          />
        ))}
        <Box p={[-0.92, 0.3, 0]} s={[0.14, 0.6, 1.65]} c="#bf902e" />
        <Box p={[0.9, 0.34, 0]} s={[0.14, 0.68, 1.65]} c="#d4a638" />
        <mesh position={[0, 0.4, 0]} scale={[1.05, 0.45, 0.72]} castShadow>
          <dodecahedronGeometry args={[0.9, 0]} />
          <meshToonMaterial color="#252d2c" />
        </mesh>
      </group>
      {[-0.88, 0.88].flatMap((axle) =>
        [-0.8, 0.8].map((side) => (
          <group key={`${axle}-${side}`} position={[axle, 0.48, side]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.48, 0.48, 0.36, 12]} />
              <meshToonMaterial color="#27302e" />
            </mesh>
            <mesh
              position={[0, 0, Math.sign(side) * 0.19]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.23, 0.23, 0.04, 10]} />
              <meshToonMaterial color="#d4a638" />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}

function MovingTruck({
  stage,
  offset,
  paused,
}: {
  stage: Stage;
  offset: number;
  paused: boolean;
}) {
  const group = useRef<Group>(null),
    progress = useRef(offset);
  const invalidate = useThree((s) => s.invalidate);
  const curve = ringRoadCurve;

  const initial = useMemo(() => {
    const p = curve.getPointAt(offset);
    const t = curve.getTangentAt(offset);
    return {
      position: [
        p.x,
        heightAt(p.x, p.z, stage) - heightAt(0, 0, stage),
        p.z,
      ] as [number, number, number],
      rotation: [0, Math.atan2(-t.z, t.x), 0] as [number, number, number],
    };
  }, [curve, offset, stage]);

  useFrame((_, delta) => {
    if (stage !== "active") return;
    if (!paused) {
      progress.current = (progress.current + Math.min(delta, 0.1) * 0.014) % 1;
      const p = curve.getPointAt(progress.current),
        t = curve.getTangentAt(progress.current);
      group.current?.position.set(
        p.x,
        heightAt(p.x, p.z, "active") - heightAt(0, 0, "active"),
        p.z,
      );
      group.current?.rotation.set(0, Math.atan2(-t.z, t.x), 0);
      invalidate();
    }
  });

  return (
    <group ref={group} position={initial.position} rotation={initial.rotation}>
      <Truck x={0} z={0} stage={stage} />
    </group>
  );
}

function Operations({ stage, paused }: { stage: Stage; paused: boolean }) {
  return (
    <StagePresence
      visible={stage === "active"}
      paused={paused}
      name="operationsPresence"
    >
      {/* Roads */}
      <Ribbon points={ringRoad} width={1.3} color="#b2a07e" />
      <Ribbon points={haulRoad} width={1.65} color="#ae9d79" />
      <Ribbon points={serviceRoad} width={1} color="#a99b7b" />

      {/* ========================================================= */}
      {/* 1. COAL STOCKPILE & OVERLAND CONVEYOR AREA               */}
      {/* ========================================================= */}
      <Stockpile paused={paused || stage !== "active"} />

      {/* Weighbridge & Security Checkpoint */}
      <group position={[18.3, 1.2, 20]}>
        <Box
          p={[0, -0.15, 0]}
          s={[2.2, 0.4, 2.2]}
          c="#606663"
          roughness={0.8}
        />
        <Box p={[0, 0.45, 0]} s={[1.2, 0.9, 1.2]} c="#cbd2cb" roughness={0.5} />
        <Box
          p={[0, 0.95, 0]}
          s={[1.5, 0.12, 1.5]}
          c="#364947"
          roughness={0.5}
        />
        {/* Scale Platform */}
        <Box
          p={[-0.9, 0.08, 0]}
          s={[0.5, 0.06, 1.8]}
          c="#e5ad38"
          metalness={0.3}
        />
      </group>

      <Line
        points={[
          [17, 1.5, 19],
          [18, 1.5, 19],
          [18, 1.5, 20],
        ]}
        color="#777a6a"
        lineWidth={3}
      />
      <Ribbon
        points={[
          [20, -17],
          [15, -17],
        ]}
        width={1.4}
        color="#a99b7b"
      />

      {/* ========================================================= */}
      {/* 2. MAIN WORKSHOP & OPERATIONAL FACILITY                   */}
      {/* ========================================================= */}
      <group position={[10, 1.2, -17]}>
        <WorkshopFoundation />
        <Box p={[0, -0.08, 0]} s={[11.8, 0.2, 7.8]} c="#b0a58b" />

        <Suspense fallback={null}>
          <IndustrialBuilding
            model="building-s"
            rotation={Math.PI}
            width={7}
            position={[-1.5, 0.03, -0.5]}
          />
          <IndustrialBuilding
            model="building-n"
            rotation={Math.PI}
            width={3.4}
            position={[4.2, 0.03, -1]}
          />
          <IndustrialBuilding
            model="shipping-container-a"
            width={2.7}
            position={[-3.8, 0.03, 2.7]}
          />
        </Suspense>
      </group>

      {/* ========================================================= */}
      {/* 3. TIERED SEDIMENTATION PONDS (KPL - PENGELOLAAN AIR)     */}
      {/* ========================================================= */}
      <SedimentPonds />

      {/* Operational Haul Trucks */}
      {stage === "active" ? (
        <>
          {[0, 0.34, 0.67].map((offset) => (
            <MovingTruck
              key={offset}
              stage={stage}
              offset={offset}
              paused={paused}
            />
          ))}
        </>
      ) : null}
    </StagePresence>
  );
}

function Rehabilitation({ stage, paused }: { stage: Stage; paused: boolean }) {
  const plants = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const x = 8.8 + (i % 6) * 1.25;
        const z = -8 + Math.floor(i / 6) * 1.3;
        return {
          x,
          z,
          y: heightAt(x, z, "post"),
          size: 0.65 + random(i, 81) * 0.3,
          angle: random(i, 2) * 6,
          tint: 0.6,
        };
      }),
    [],
  );
  return (
    <StagePresence
      visible={stage === "post"}
      paused={paused}
      name="rehabilitationPresence"
    >
      <Suspense fallback={null}>
        <IndustrialBuilding
          model="building-p"
          width={3.2}
          position={[8, 1.2, -17]}
        />
        <NatureInstances model="tree_oak" items={plants} paused={paused} />
      </Suspense>
      {[0, 1, 2, 3].map((row) => (
        <Ribbon
          key={row}
          points={[
            [8, -8 + row * 1.3],
            [16, -8 + row * 1.3],
          ]}
          width={0.35}
          color="#b9ac82"
        />
      ))}
      <Ribbon
        points={[
          [8, -15],
          [8, -10],
          [12, -5],
        ]}
        width={0.55}
        color="#b9ac82"
      />
    </StagePresence>
  );
}

// The settlement predates the mine and remains visible in every chapter.
function Village({ stage }: { stage: Stage }) {
  return (
    <group>
      <Ribbon points={villageLane} width={0.65} color="#bdad84" />
      <VillageDetails stage={stage} />
      {[-18.4, -15.2, -12].map((z) => (
        <Ribbon
          key={z}
          points={[
            [25, z],
            [28, z],
            [33, z],
          ]}
          width={0.45}
          color="#bdad84"
        />
      ))}
      {[0, 1, 2].map((plot) => (
        <group key={plot}>
          {Array.from({ length: 5 }, (_, row) => {
            const x = 27 + plot * 2.5 + row * 0.32;
            return (
              <Ribbon
                key={row}
                points={[
                  [x, -10.5],
                  [x, -8.5],
                ]}
                width={0.22}
                color={row % 2 ? "#7c9454" : "#a7ae6b"}
              />
            );
          })}
        </group>
      ))}
      {/* ========================================================= */}
      {/* 4. COMMUNITY VILLAGE SETTLEMENT (PERMUKIMAN WARGA)        */}
      {/* ========================================================= */}
      {/* Vernacular Stilt Architecture on Terraced Stone Pads       */}
      {Array.from({ length: 9 }, (_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const vx = 26 + col * 2.8;
        const vz = -20 + row * 3.2;
        const vh = heightAt(vx, vz, stage);

        // Roof and wall color palettes inspired by Indonesian rural villages:
        const roofColors = [
          "#824632",
          "#4a5446",
          "#73493b",
          "#613b2d",
          "#3d4b47",
          "#8c5339",
          "#4f3b2d",
          "#5e5246",
          "#7b4131",
        ];
        const wallColors = [
          "#cbb998",
          "#b8a685",
          "#d6c5a6",
          "#c2b090",
          "#ab9b7d",
          "#d1c2a1",
          "#bead8e",
          "#c5b697",
          "#bca98a",
        ];

        return (
          <group key={`house-${i}`} position={[vx, vh, vz]}>
            {/* Embedded Stone Foundation Terrace (ZERO FLOATING) */}
            <Box
              p={[0, -0.25, 0]}
              s={[1.9, 0.6, 1.9]}
              c="#53514a"
              roughness={0.95}
            />

            {/* Timber Stilts & Substructure */}
            {[-0.65, 0.65].flatMap((sx) =>
              [-0.65, 0.65].map((sz) => (
                <Box
                  key={`stilt-${sx}-${sz}`}
                  p={[sx, 0.18, sz]}
                  s={[0.1, 0.45, 0.1]}
                  c="#45382b"
                  roughness={0.9}
                />
              )),
            )}

            {/* Raised Timber Floor Platform */}
            <Box
              p={[0, 0.42, 0]}
              s={[1.7, 0.1, 1.7]}
              c="#6e553e"
              roughness={0.8}
            />

            {/* House Living Quarters */}
            <Box
              p={[0, 0.95, -0.1]}
              s={[1.45, 0.95, 1.35]}
              c={wallColors[i % wallColors.length]}
              roughness={0.7}
            />

            {/* Front Veranda / Porch */}
            <Box
              p={[0, 0.72, 0.68]}
              s={[1.45, 0.52, 0.04]}
              c="#5a4533"
              roughness={0.8}
            />

            {/* Vernacular Pitched Limasan / Gable Roof with Eaves Overhang */}
            <mesh
              position={[0, 1.62, -0.1]}
              rotation={[0, Math.PI / 4, 0]}
              castShadow
            >
              <coneGeometry args={[1.35, 0.75, 4]} />
              <meshStandardMaterial
                color={roofColors[i % roofColors.length]}
                roughness={0.65}
              />
            </mesh>

            {/* Front Door */}
            <Box p={[0, 0.75, 0.58]} s={[0.32, 0.58, 0.04]} c="#3b2b1f" />
          </group>
        );
      })}
    </group>
  );
}
const villageLane: [number, number][] = [
  [33.5, -24],
  [33.5, -18],
  [33.5, -12],
  [31, -6],
  [29, -2],
];

export default function Terrain({
  stage,
  paused = true,
}: {
  stage: Stage;
  paused?: boolean;
}) {
  const groundRef = useRef<Mesh>(null);
  const pitRef = useRef<Mesh>(null);
  const invalidate = useThree((s) => s.invalidate);

  // Target morph influences:
  // pre: [0, 0]
  // active: [1, 0]
  // post: [0, 1]
  const target0 = stage === "active" ? 1 : 0;
  const target1 = stage === "post" ? 1 : 0;

  const current0 = useRef(target0);
  const current1 = useRef(target1);
  const start0 = useRef(target0);
  const start1 = useRef(target1);
  const startTime = useRef(performance.now());
  const isAnimating = useRef(false);

  useLayoutEffect(() => {
    if (groundRef.current) groundRef.current.updateMorphTargets();
    if (pitRef.current) pitRef.current.updateMorphTargets();
    start0.current = current0.current;
    start1.current = current1.current;
    startTime.current = performance.now();
    isAnimating.current = true;
    invalidate();
  }, [stage, paused, invalidate]);

  useFrame(() => {
    if (!isAnimating.current) return;
    const elapsed = performance.now() - startTime.current;
    const t = paused ? 1 : Math.min(1, elapsed / 650);
    const ease = 1 - Math.pow(1 - t, 3); // cubic ease out

    const c0 = start0.current + (target0 - start0.current) * ease;
    const c1 = start1.current + (target1 - start1.current) * ease;

    current0.current = c0;
    current1.current = c1;

    if (groundRef.current?.morphTargetInfluences) {
      groundRef.current.morphTargetInfluences[0] = c0;
      groundRef.current.morphTargetInfluences[1] = c1;
    }
    if (pitRef.current?.morphTargetInfluences) {
      pitRef.current.morphTargetInfluences[0] = c0;
      pitRef.current.morphTargetInfluences[1] = c1;
    }

    if (t >= 1) {
      current0.current = target0;
      current1.current = target1;
      if (groundRef.current?.morphTargetInfluences) {
        groundRef.current.morphTargetInfluences[0] = target0;
        groundRef.current.morphTargetInfluences[1] = target1;
      }
      if (pitRef.current?.morphTargetInfluences) {
        pitRef.current.morphTargetInfluences[0] = target0;
        pitRef.current.morphTargetInfluences[1] = target1;
      }
      isAnimating.current = false;
    } else {
      invalidate();
    }
  });

  return (
    <group>
      <Ground meshRef={groundRef} />
      <MinePit
        meshRef={pitRef}
        stage={stage}
        pitInfluence={current0.current + current1.current}
      />
      <Ribbon points={riverPoints} width={2.4} color="#327370" water />
      <Suspense fallback={null}>
        <Forest stage={stage} paused={paused} />
      </Suspense>
      <LandscapeDetails stage={stage} paused={paused} />
      <Village stage={stage} />
      <Operations stage={stage} paused={paused} />
      <Rehabilitation stage={stage} paused={paused} />
    </group>
  );
}
