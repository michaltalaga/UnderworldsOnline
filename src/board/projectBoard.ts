import type { BoardState, HexCell } from "../domain";

export const hexRadius = 46;
export const hexWidth = Math.sqrt(3) * hexRadius;
export const hexHeight = hexRadius * 2;
export const boardPadding = 28;

export type PositionedHex = {
  hex: HexCell;
  left: number;
  top: number;
};

export function projectBoard(board: BoardState): { positionedHexes: PositionedHex[] } {
  const rawHexes = board.hexes.map((hex) => {
    const centerX = hexRadius * Math.sqrt(3) * (hex.q + hex.r / 2);
    const centerY = hexRadius * 1.5 * hex.r;

    return {
      hex,
      left: centerX - hexWidth / 2,
      top: centerY - hexHeight / 2,
    };
  });

  const minLeft = Math.min(...rawHexes.map((hex) => hex.left));
  const minTop = Math.min(...rawHexes.map((hex) => hex.top));

  return {
    positionedHexes: rawHexes.map((hex) => ({
      ...hex,
      left: hex.left - minLeft + boardPadding,
      top: hex.top - minTop + boardPadding,
    })),
  };
}
