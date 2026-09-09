"use client";
import Terrain from "./Terrain";
import type { Stage } from "@/lib/topics";
// A single persistent world; only the worksite animates between stages.
export default function TerrainTransition({
  stage,
  paused,
}: {
  stage: Stage;
  paused: boolean;
}) {
  return <Terrain stage={stage} paused={paused} />;
}
