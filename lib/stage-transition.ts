import { revealProgress } from "./motion";
export type StageTransition = { from: number; to: number; start: number };
export function transitionValue(
  state: StageTransition,
  now: number,
  reduced: boolean,
) {
  return (
    state.from +
    (state.to - state.from) * revealProgress(state.start, now, reduced)
  );
}
export function retargetTransition(
  state: StageTransition,
  to: number,
  now: number,
): StageTransition {
  return { from: transitionValue(state, now, false), to, start: now };
}
