import { qStartForR, rowIndexFromR } from "./boardShape";
import type { Hex } from "./types";

export type BoardCoord = {
  row: number;
  col: number;
};

export function toBoardCoord(hex: Hex): BoardCoord {
  const row = rowIndexFromR(hex.r) + 1;
  const col = hex.q - qStartForR(hex.r) + 1;
  return { row, col };
}

export function boardCoordLabel(hex: Hex): string {
  const c = toBoardCoord(hex);
  return `r${c.row},c${c.col}`;
}
