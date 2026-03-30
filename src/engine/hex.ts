import type { Hex } from "./types";

export const HEX_DIRS: Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function hexKey(h: Hex): string {
  return `${h.q},${h.r}`;
}

export function addHex(a: Hex, b: Hex): Hex {
  return { q: a.q + b.q, r: a.r + b.r };
}

export function hexDistance(a: Hex, b: Hex): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = -a.q - a.r - (-b.q - b.r);
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(ds)) / 2;
}

export function neighbors(hex: Hex): Hex[] {
  return HEX_DIRS.map((d) => addHex(hex, d));
}

export function inRadius(hex: Hex, radius: number): boolean {
  const s = -hex.q - hex.r;
  return Math.max(Math.abs(hex.q), Math.abs(hex.r), Math.abs(s)) <= radius;
}

export function allHexes(radius: number): Hex[] {
  const out: Hex[] = [];
  for (let q = -radius; q <= radius; q += 1) {
    for (let r = -radius; r <= radius; r += 1) {
      const h = { q, r };
      if (inRadius(h, radius)) out.push(h);
    }
  }
  return out;
}
