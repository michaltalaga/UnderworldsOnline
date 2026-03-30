export const BOARD_ROW_COUNTS = [6, 7, 8, 9, 8, 9, 8, 9, 8, 7, 6] as const;

export function boardCenterRow(): number {
  return Math.floor(BOARD_ROW_COUNTS.length / 2);
}

export function rowIndexFromR(r: number): number {
  return r + boardCenterRow();
}

export function rowCountForR(r: number): number {
  const idx = rowIndexFromR(r);
  if (idx < 0 || idx >= BOARD_ROW_COUNTS.length) return 0;
  return BOARD_ROW_COUNTS[idx];
}

export function qStartForR(r: number): number {
  return -Math.floor(rowCountForR(r) / 2);
}

export function createBoardHexes() {
  const out: Array<{ q: number; r: number }> = [];
  BOARD_ROW_COUNTS.forEach((count, rowIndex) => {
    const r = rowIndex - boardCenterRow();
    const qStart = qStartForR(r);
    for (let i = 0; i < count; i += 1) {
      out.push({ q: qStart + i, r });
    }
  });
  return out;
}
