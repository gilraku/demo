export function revealProgress(start: number, now: number, reduced: boolean) {
  if (reduced) return 1;
  const t = Math.max(0, Math.min(1, (now - start) / 650));
  return 1 - Math.pow(1 - t, 3);
}
