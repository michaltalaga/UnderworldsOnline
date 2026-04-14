import type { BoardTheme } from "../../../board/boardTheme";
import { Board } from "../../state/Board";
import { HexCell } from "../../state/HexCell";
import { Territory } from "../../state/Territory";
import type { TerritoryId } from "../../values/ids";
import { BoardSide, HexKind } from "../../values/enums";

const rowSizes = [6, 7, 8, 9, 8, 9, 8, 9, 8, 7, 6] as const;
const northTerritoryId = "territory:north";
const southTerritoryId = "territory:south";

const northStartingHexIds = new Set([
  "hex:r0:c0",
  "hex:r1:c1",
  "hex:r2:c4",
  "hex:r2:c6",
  "hex:r3:c2",
  "hex:r3:c7",
  "hex:r4:c5",
]);

const southStartingHexIds = new Set([
  "hex:r6:c2",
  "hex:r7:c1",
  "hex:r7:c5",
  "hex:r8:c1",
  "hex:r8:c6",
  "hex:r9:c2",
  "hex:r9:c5",
]);

const staggerHexIds = new Set([
  "hex:r4:c6",
  "hex:r6:c1",
]);

export const embergard1Board = createEmbergard1Board();

export const embergard1BoardTheme: BoardTheme = {
  name: "Embergard Board 1",
  backgroundImage: "/embergard-board-1.jpg",
  imageWidth: 1368,
  imageHeight: 1500,
  imagePadding: { top: 32, right: 29, bottom: 30, left: 24 },
};

function createEmbergard1Board(): Board {
  // Create territories first (empty hexes) so HexCell can reference them.
  const northTerritory = new Territory(northTerritoryId as TerritoryId, "North Territory", null, []);
  const southTerritory = new Territory(southTerritoryId as TerritoryId, "South Territory", null, []);
  const territoryByRow = (rowIndex: number): Territory | null =>
    rowIndex < 5 ? northTerritory : rowIndex > 5 ? southTerritory : null;

  const hexes = rowSizes.flatMap((rowSize, rowIndex) =>
    createRowHexes(rowIndex, rowSize, territoryByRow(rowIndex)),
  );

  // Populate Territory.hexes with the refs we just built.
  northTerritory.hexes = hexes.filter((hex) => hex.territory === northTerritory);
  southTerritory.hexes = hexes.filter((hex) => hex.territory === southTerritory);

  const board = new Board(
    "board:centered-battlefield",
    BoardSide.Front,
    hexes,
    [northTerritory, southTerritory],
  );
  board.recomputeEdgeFlags();
  return board;
}

function createRowHexes(
  rowIndex: number,
  rowSize: number,
  territory: Territory | null,
): HexCell[] {
  const axialRow = rowIndex - 5;
  const qStart = (-axialRow - rowSize + 1) / 2;

  return Array.from({ length: rowSize }, (_, columnIndex) => {
    const hexId = `hex:r${rowIndex}:c${columnIndex}`;
    const q = qStart + columnIndex;
    const isStartingHex =
      northStartingHexIds.has(hexId) || southStartingHexIds.has(hexId);

    const kind = staggerHexIds.has(hexId) ? HexKind.Stagger : HexKind.Empty;

    return new HexCell(
      hexId as never,
      q,
      axialRow,
      kind,
      isStartingHex,
      false,
      territory,
    );
  });
}
