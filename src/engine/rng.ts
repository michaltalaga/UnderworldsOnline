export function nextRng(state: number): { state: number; value: number } {
  const next = (1664525 * state + 1013904223) >>> 0;
  return { state: next, value: next / 0xffffffff };
}

export function rollD6(state: number): { state: number; value: number } {
  const { state: next, value } = nextRng(state);
  return { state: next, value: Math.floor(value * 6) + 1 };
}

export function shuffleWithSeed<T>(arr: T[], seed: number): { seed: number; result: T[] } {
  const out = [...arr];
  let state = seed;
  for (let i = out.length - 1; i > 0; i -= 1) {
    const next = nextRng(state);
    state = next.state;
    const j = Math.floor(next.value * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return { seed: state, result: out };
}
