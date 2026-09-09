"use client";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group } from "three";
import { retargetTransition, transitionValue } from "@/lib/stage-transition";

export default function StagePresence({
  visible,
  paused,
  name,
  children,
}: {
  visible: boolean;
  paused: boolean;
  name: string;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  const motion = useRef({
    from: Number(visible),
    to: Number(visible),
    start: 0,
  });
  const running = useRef(true);
  const { invalidate, gl } = useThree();
  const apply = (value: number) => {
    if (!group.current) return;
    group.current.visible = value > 0.0001;
    group.current.position.y = -(1 - value) * 5;
    group.current.scale.y = Math.max(0.001, value);
    gl.domElement.dataset[name] = value.toFixed(3);
  };
  useLayoutEffect(() => {
    motion.current = retargetTransition(
      motion.current,
      Number(visible),
      performance.now(),
    );
    running.current = true;
    if (paused) {
      motion.current.from = motion.current.to;
      apply(motion.current.to);
      running.current = false;
    }
    invalidate();
  }, [visible, paused, invalidate]);
  useFrame(() => {
    if (!running.current) return;
    const value = transitionValue(motion.current, performance.now(), paused);
    apply(value);
    if (value === motion.current.to) running.current = false;
    else invalidate();
  });
  return (
    <group ref={group} name={name}>
      {children}
    </group>
  );
}
