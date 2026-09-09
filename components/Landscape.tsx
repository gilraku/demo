"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { Component, useEffect, useMemo, useRef, useState } from "react";
import { Shape, Path, Vector3, OrthographicCamera } from "three";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { topics, type Stage } from "@/lib/topics";
import { probeWebGL, type GraphicsProbe } from "@/lib/webgl";

const sand = ["#bc9670", "#ad845b", "#97704e", "#7b5d45", "#4b4940"];
function Ring({
  outer,
  inner,
  y,
  color,
}: {
  outer: number;
  inner: number;
  y: number;
  color: string;
}) {
  const shape = useMemo(() => {
    const s = new Shape();
    s.absellipse(-1.65, 0, outer, outer * 0.69, 0, Math.PI * 2, false, 0.12);
    const hole = new Path();
    hole.absellipse(-1.65, 0, inner, inner * 0.69, 0, Math.PI * 2, true, 0.12);
    s.holes.push(hole);
    return s;
  }, [outer, inner]);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, y, 0]}
      receiveShadow
      castShadow
    >
      <extrudeGeometry
        args={[shape, { depth: 0.16, bevelEnabled: false, curveSegments: 32 }]}
      />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}
function Box({
  position,
  size,
  color,
  rotation = 0,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  rotation?: number;
}) {
  return (
    <mesh
      position={position}
      rotation={[0, rotation, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}
function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, 0.68, z]} scale={scale}>
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.5, 6]} />
        <meshStandardMaterial color="#6d6347" />
      </mesh>
      <mesh position={[0, 0.67, 0]} castShadow>
        <icosahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial color="#55735a" flatShading />
      </mesh>
      <mesh position={[0.1, 0.48, 0.03]} castShadow>
        <icosahedronGeometry args={[0.27, 0]} />
        <meshStandardMaterial color="#779167" flatShading />
      </mesh>
    </group>
  );
}
function Truck({
  x,
  z,
  rotation = 0,
}: {
  x: number;
  z: number;
  rotation?: number;
}) {
  return (
    <group position={[x, 0.78, z]} rotation={[0, rotation, 0]}>
      <Box position={[0, 0.16, 0]} size={[0.52, 0.16, 0.28]} color="#d9a840" />
      <Box
        position={[0.18, 0.3, 0]}
        size={[0.19, 0.19, 0.27]}
        color="#efc251"
      />
      <Box
        position={[-0.13, 0.31, 0]}
        size={[0.36, 0.17, 0.32]}
        color="#bc8e34"
      />
      <Box
        position={[0.23, 0.34, 0.002]}
        size={[0.012, 0.08, 0.2]}
        color="#475b61"
      />
      {[-0.17, 0.17].flatMap((a) =>
        [-0.17, 0.17].map((b) => (
          <mesh
            key={`${a}${b}`}
            position={[a, 0.09, b]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.095, 0.095, 0.055, 10]} />
            <meshStandardMaterial color="#303c3b" />
          </mesh>
        )),
      )}
    </group>
  );
}
function Terrain({ stage }: { stage: Stage }) {
  const shape = useMemo(() => {
    const s = new Shape();
    s.moveTo(-5.4, -3.2);
    s.lineTo(-4.65, -4);
    s.lineTo(3.8, -4);
    s.lineTo(5, -2.9);
    s.lineTo(5, 2.6);
    s.lineTo(4.3, 3.3);
    s.lineTo(-4.4, 3.3);
    s.lineTo(-5.4, 2.3);
    s.closePath();
    if (stage !== "pre") {
      const hole = new Path();
      hole.absellipse(-1.65, 0, 2.5, 1.725, 0, Math.PI * 2, true, 0.12);
      s.holes.push(hole);
    }
    return s;
  }, [stage]);
  const trees = useMemo(
    () =>
      Array.from({ length: 76 }, (_, i) => ({
        x: -4.7 + ((i * 71) % 94) / 10,
        z: -3.2 + ((i * 47) % 59) / 10,
        s: 0.64 + ((i * 13) % 9) / 15,
      })).filter(
        (p) =>
          (p.x + 1.65) ** 2 / 10 + p.z ** 2 / 5 > 1.35 &&
          !(p.x > 1 && p.z > -0.8) &&
          !(p.x > -0.6 && p.z < -0.9),
      ),
    [],
  );
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.22, 0]}
        receiveShadow
        castShadow
      >
        <extrudeGeometry args={[shape, { depth: 0.88, bevelEnabled: false }]} />
        <meshStandardMaterial
          color={stage === "post" ? "#819465" : "#a0a780"}
          roughness={1}
        />
      </mesh>
      <Box position={[0, -0.28, 0]} size={[8.6, 0.14, 5.8]} color="#bd9a78" />
      {stage !== "pre" ? (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <Ring
              key={i}
              outer={2.5 - i * 0.38}
              inner={2.12 - i * 0.38}
              y={0.5 - i * 0.14}
              color={
                stage === "post" && i < 2 ? ["#799061", "#9a9d72"][i] : sand[i]
              }
            />
          ))}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.65, -0.08, 0]}>
            <circleGeometry args={[0.62, 36]} />
            <meshStandardMaterial
              color={stage === "post" ? "#527e79" : "#474a43"}
            />
          </mesh>
        </>
      ) : (
        <>
          <Box
            position={[-1.65, 0.68, 0]}
            size={[3.7, 0.025, 2.4]}
            color="#b6b38c"
          />
          {[-2.9, -0.5].map((x) => (
            <Box
              key={x}
              position={[x, 0.72, 0]}
              size={[0.025, 0.06, 2.4]}
              color="#f3deb0"
            />
          ))}
        </>
      )}
      <Box
        position={[0.95, 0.69, 0.45]}
        size={[0.5, 0.035, 5.3]}
        color="#c8bd9c"
        rotation={-0.16}
      />
      <Box
        position={[-1.75, 0.69, 2.2]}
        size={[5.4, 0.04, 0.42]}
        color="#c8bd9c"
        rotation={-0.035}
      />
      {[0, 1].map((i) => (
        <group key={i} position={[2.2, 0.72, 1.15 + i * 0.96]}>
          <Box position={[0, 0, 0]} size={[1.62, 0.15, 0.8]} color="#b5ac8b" />
          <Box
            position={[0, 0.085, 0]}
            size={[1.43, 0.04, 0.62]}
            color={i ? "#77aaa9" : "#86a39a"}
          />
          {[-0.3, 0, 0.3].map((x) => (
            <Box
              key={x}
              position={[x, 0.11, 0]}
              size={[0.014, 0.015, 0.5]}
              color="#aac2b5"
            />
          ))}
        </group>
      ))}
      <Box
        position={[3.8, 0.69, 0.3]}
        size={[0.6, 0.035, 5.1]}
        color="#73a5a4"
        rotation={-0.1}
      />
      <Box
        position={[4.04, 0.7, 0.3]}
        size={[0.1, 0.045, 5.1]}
        color="#aaba8a"
        rotation={-0.1}
      />
      <group position={[0.1, 0.7, -2]}>
        <Box position={[0, 0.35, 0]} size={[1.3, 0.7, 0.75]} color="#dedecb" />
        <Box position={[0, 0.75, 0]} size={[1.43, 0.12, 0.9]} color="#69766a" />
        {[-0.4, 0, 0.4].map((x) => (
          <Box
            key={x}
            position={[x, 0.42, 0.386]}
            size={[0.23, 0.2, 0.02]}
            color="#71888b"
          />
        ))}
        <Box
          position={[0.9, 0.6, -0.18]}
          size={[0.25, 1.2, 0.25]}
          color="#a9aca2"
        />
      </group>
      <Box
        position={[-0.1, 1.1, -0.95]}
        size={[1.6, 0.13, 0.22]}
        color="#687062"
        rotation={0.7}
      />
      {[0, 1, 2].map((i) => (
        <group key={i} position={[2.1 + i * 0.72, 0.68, -2.5]}>
          <Box
            position={[0, 0.2, 0]}
            size={[0.47, 0.4, 0.55]}
            color="#e3d7b9"
          />
          <mesh
            position={[0, 0.46, 0]}
            rotation={[0, Math.PI / 4, 0]}
            castShadow
          >
            <coneGeometry args={[0.43, 0.25, 4]} />
            <meshStandardMaterial color={i === 1 ? "#a17c61" : "#797f64"} />
          </mesh>
          <Box
            position={[0, 0.16, 0.283]}
            size={[0.11, 0.25, 0.015]}
            color="#596e65"
          />
        </group>
      ))}
      {trees.map((t, i) => (
        <Tree key={i} x={t.x} z={t.z} scale={t.s} />
      ))}
      {stage === "post"
        ? Array.from({ length: 12 }, (_, i) => (
            <Tree
              key={`new${i}`}
              x={-3.9 + (i % 4) * 0.5}
              z={-1.25 + Math.floor(i / 4) * 0.65}
              scale={0.55}
            />
          ))
        : null}
      {stage === "active" ? (
        <>
          <Truck x={-2.5} z={2.2} />
          <Truck x={0.9} z={0.45} rotation={Math.PI / 2} />
        </>
      ) : null}
    </group>
  );
}
function CameraRig({
  selected,
  zoom,
  reset,
}: {
  selected: string;
  zoom: number;
  reset: number;
}) {
  const controls = useRef<OrbitControlsType>(null);
  const { camera, size, invalidate } = useThree();
  const target = useRef(new Vector3(0, 0.3, 0));
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);
  useEffect(() => {
    const p = topics.find((t) => t.id === selected)?.position;
    target.current.set(p ? p[0] * 0.23 : 0, 0.3, p ? p[2] * 0.23 : 0);
    invalidate();
  }, [selected, invalidate]);
  useEffect(() => {
    const cam = camera as OrthographicCamera;
    cam.zoom =
      Math.min(size.width / 12.4, size.height / 9.8) * Math.pow(1.16, zoom);
    cam.updateProjectionMatrix();
    invalidate();
  }, [camera, size, zoom, invalidate]);
  useEffect(() => {
    camera.position.set(11, 10, 12);
    controls.current?.target.set(0, 0.3, 0);
    controls.current?.update();
    invalidate();
  }, [reset, camera, invalidate]);
  useFrame(() => {
    if (
      controls.current &&
      controls.current.target.distanceTo(target.current) > 0.015
    ) {
      controls.current.target.lerp(target.current, reduced.current ? 1 : 0.12);
      controls.current.update();
      invalidate();
    }
  });
  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableZoom={false}
      minPolarAngle={0.35}
      maxPolarAngle={1.25}
      minAzimuthAngle={-0.9}
      maxAzimuthAngle={1.4}
    />
  );
}
class SceneBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-fallback">
        <strong>Jelajahi lewat daftar topik</strong>
        <p>
          Tampilan 3D belum tersedia di perangkat ini. Semua materi tetap dapat
          dibuka di bawah.
        </p>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Landscape({
  stage,
  selected,
  onSelect,
  zoom,
  reset,
}: {
  stage: Stage;
  selected: string;
  onSelect: (id: string) => void;
  zoom: number;
  reset: number;
}) {
  const [graphics, setGraphics] = useState<GraphicsProbe | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setGraphics(probeWebGL(document.createElement("canvas")));
  }, [attempt]);
  if (!graphics)
    return (
      <div className="scene-fallback">
        <span className="spinner" />
        <p>Menyiapkan tampilan 3D…</p>
      </div>
    );
  if (!graphics.available)
    return (
      <div className="scene-fallback">
        <strong>Tampilan 3D belum berhasil dimulai</strong>
        <p>
          Browser belum dapat membuat konteks grafis. Semua topik tetap tersedia
          melalui daftar lokasi.
        </p>
        <button
          className="text-button"
          onClick={() => {
            setGraphics(null);
            setAttempt((v) => v + 1);
          }}
        >
          Coba tampilan 3D lagi
        </button>
        <details className="graphics-help">
          <summary>Detail dan langkah pemeriksaan</summary>
          <p>
            Periksa pengaturan akselerasi grafis di browser, kemudian mulai
            ulang browser. Di Chrome, informasi diagnostik tersedia di
            chrome://gpu pada bagian WebGL dan WebGL2.
          </p>
          <p>{graphics.reason}</p>
        </details>
      </div>
    );
  return (
    <SceneBoundary>
      <Canvas
        orthographic
        shadows
        dpr={[1, 1.5]}
        frameloop="demand"
        camera={{ position: [11, 10, 12], zoom: 48, near: 0.1, far: 100 }}
        gl={{
          antialias: graphics.antialias,
          alpha: true,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
        }}
      >
        <ambientLight intensity={1.65} />
        <directionalLight
          position={[-4, 12, 6]}
          intensity={2.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-normalBias={0.04}
        />
        <Terrain stage={stage} />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.48, 0]}
          receiveShadow
        >
          <planeGeometry args={[200, 200]} />
          <shadowMaterial transparent opacity={0.12} />
        </mesh>
        {topics
          .filter((t) => t.stages.includes(stage))
          .map((t, i) => (
            <Html key={t.id} position={t.position} center zIndexRange={[12, 1]}>
              <button
                className={`map-pin ${selected === t.id ? "selected" : ""}`}
                onClick={() => onSelect(t.id)}
                aria-label={`Jelajahi ${t.short}`}
                aria-pressed={selected === t.id}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <em>{t.short}</em>
              </button>
            </Html>
          ))}
        <CameraRig selected={selected} zoom={zoom} reset={reset} />
      </Canvas>
    </SceneBoundary>
  );
}
