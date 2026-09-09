"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { Component, useEffect, useRef, useState } from "react";
import { PCFShadowMap, Vector3 } from "three";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { topics, type Stage } from "@/lib/topics";
import { heightAt, sitePositions } from "@/lib/terrain";
import { probeWebGL, type GraphicsProbe } from "@/lib/webgl";
import TerrainTransition from "./TerrainTransition";

type Props = {
  stage: Stage;
  selected: string | null;
  onSelect: (id: string) => void;
  zoom: number;
  reset: number;
  paused?: boolean;
};

function CameraRig({ selected, stage, zoom, reset }: Omit<Props, "onSelect">) {
  const controls = useRef<OrbitControlsType>(null),
    moving = useRef(true),
    reduce = useRef(false);
  const { camera, invalidate, size } = useThree();
  const destination = useRef(new Vector3()),
    target = useRef(new Vector3());
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    reduce.current = media.matches;
    const change = () => {
      reduce.current = media.matches;
    };
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const p = selected ? sitePositions[selected] : null;
    if (p) target.current.set(p[0] + 4, heightAt(p[0], p[1], stage), p[1]);
    else target.current.set(5, 0, 0);
    const mobile = size.width < 700,
      factor = Math.pow(1.16, -zoom) * (mobile ? 1.35 : 1);
    const offset = p ? new Vector3(20, 15, 24) : new Vector3(44, 37, 53);
    destination.current.copy(target.current).add(offset.multiplyScalar(factor));
    moving.current = true;
    invalidate();
  }, [selected, stage, zoom, reset, size.width, invalidate]);
  useFrame((_, dt) => {
    if (!controls.current || !moving.current) return;
    const alpha = reduce.current ? 1 : 1 - Math.exp(-dt * 3.2);
    camera.position.lerp(destination.current, alpha);
    controls.current.target.lerp(target.current, alpha);
    controls.current.update();
    if (
      camera.position.distanceTo(destination.current) < 0.04 &&
      controls.current.target.distanceTo(target.current) < 0.04
    )
      moving.current = false;
    else invalidate();
  });
  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableDamping
      dampingFactor={0.09}
      minDistance={18}
      maxDistance={125}
      minPolarAngle={0.3}
      maxPolarAngle={1.24}
      onStart={() => {
        moving.current = false;
      }}
    />
  );
}
function MapFallback({
  stage,
  selected,
  onSelect,
  retry,
  reason,
}: Pick<Props, "stage" | "selected" | "onSelect"> & {
  retry: () => void;
  reason: string;
}) {
  return (
    <div className="terrain-fallback">
      <svg
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Peta skematis lokasi tambang"
      >
        <defs>
          <radialGradient id="map-earth">
            <stop stopColor="#6a6855" />
            <stop offset="1" stopColor="#283e34" />
          </radialGradient>
        </defs>
        <path fill="url(#map-earth)" d="M0 0h1400v900H0z" />
        {Array.from({ length: 22 }, (_, i) => (
          <path
            key={i}
            d={`M ${-300 + i * 17} ${70 + i * 34} C ${170 + i * 22} ${-70 + i * 21},${260 + i * 28} ${590 + i * 12},${640 + i * 26} ${220 + i * 22} S ${1150 + i * 12} ${310 + i * 16},1500 ${10 + i * 40}`}
            fill="none"
            stroke="#a8aa832a"
            strokeWidth="1.5"
          />
        ))}
        <path
          d="M1000-50C800 250 1270 320 975 600S1180 890 1190 1000"
          fill="none"
          stroke="#678b87"
          strokeWidth="27"
        />
        <path
          d="M210 630C480 780 820 780 880 400L780 290"
          fill="none"
          stroke="#d6bd8544"
          strokeWidth="15"
        />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse
            key={i}
            cx="540"
            cy="470"
            rx={235 - i * 31}
            ry={130 - i * 17}
            transform="rotate(-18 540 470)"
            fill={
              stage === "pre"
                ? "#52604d"
                : [
                    "#9e8963",
                    "#8c795b",
                    "#7f6c52",
                    "#6e614d",
                    "#504c40",
                    "#343c35",
                  ][i]
            }
            stroke="#d9c29a33"
            strokeWidth="3"
          />
        ))}
        <g fill="#8b9985">
          <path d="M750 265h100v55H750zM1050 365h35v30h-35zM1100 400h40v30h-40z" />
        </g>
        <path
          d="M820 595h115v75H820z"
          fill="#537773"
          stroke="#b4b797"
          strokeWidth="6"
        />
      </svg>
      <div className="fallback-sites">
        {topics
          .filter((t) => t.stages.includes(stage))
          .map((t) => {
            const p = sitePositions[t.id];
            return (
              <button
                key={t.id}
                className={`world-pin ${selected === t.id ? "selected" : ""}`}
                style={{
                  left: `${44 + p[0] * 0.9}%`,
                  top: `${51 + p[1] * 0.7}%`,
                }}
                onClick={() => onSelect(t.id)}
                aria-label={`Jelajahi ${t.short}`}
              >
                <i />
                <span>{t.short}</span>
              </button>
            );
          })}
      </div>
      <div className="graphics-notice">
        <span>Peta 2D interaktif</span>
        <details>
          <summary>Tampilan 3D belum berhasil dimulai</summary>
          <p>
            Browser belum dapat membuat konteks WebGL 2. Periksa akselerasi
            grafis dan informasi WebGL di chrome://gpu, lalu mulai ulang
            browser.
          </p>
          <p>{reason}</p>
          <button onClick={retry}>Coba tampilan 3D lagi</button>
        </details>
      </div>
    </div>
  );
}
class SceneBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export default function CinematicLandscape(props: Props) {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [graphics, setGraphics] = useState<GraphicsProbe | null>(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setGraphics(probeWebGL(document.createElement("canvas")));
  }, [attempt]);
  const retry = () => {
    setGraphics(null);
    setAttempt((v) => v + 1);
  };
  const fallback = (
    <MapFallback
      {...props}
      retry={retry}
      reason={graphics?.reason || "Renderer 3D belum berhasil dimulai."}
    />
  );
  if (!graphics)
    return (
      <div className="world-loading">
        <span className="spinner" />
        <p>Menyiapkan bentang…</p>
      </div>
    );
  if (!graphics.available) return fallback;
  return (
    <SceneBoundary key={attempt} fallback={fallback}>
      <Canvas
        shadows={{ type: PCFShadowMap }}
        dpr={[1, 1.25]}
        frameloop="demand"
        camera={{ position: [47, 37, 52], fov: 44, near: 0.5, far: 240 }}
        gl={{
          antialias: graphics.antialias,
          alpha: false,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
        }}
      >
        <color attach="background" args={["#a8dcd2"]} />
        <fog attach="fog" args={["#a8dcd2", 95, 210]} />
        <hemisphereLight args={["#d7e7e7", "#59533d", 1.6]} />
        <directionalLight
          position={[-40, 65, 25]}
          color="#ffe3b2"
          intensity={2.5}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-55}
          shadow-camera-right={55}
          shadow-camera-top={55}
          shadow-camera-bottom={-55}
          shadow-camera-far={160}
          shadow-normalBias={0.09}
        />

        <TerrainTransition
          stage={props.stage}
          paused={!!props.paused || reduced}
        />
        {topics
          .filter((t) => t.stages.includes(props.stage))
          .map((t) => {
            const [x, z] = sitePositions[t.id];
            return (
              <Html
                key={t.id}
                position={[x, heightAt(x, z, props.stage) + 3.4, z]}
                center
                zIndexRange={[8, 1]}
              >
                <button
                  className={`world-pin ${props.selected === t.id ? "selected" : ""}`}
                  onClick={() => props.onSelect(t.id)}
                  aria-label={`Jelajahi ${t.short}`}
                  aria-pressed={props.selected === t.id}
                >
                  <i />
                  <span>{t.short}</span>
                </button>
              </Html>
            );
          })}
        <CameraRig {...props} />
      </Canvas>
    </SceneBoundary>
  );
}
