import type { BoardTheme } from "../../../board/boardTheme";
import { Board } from "../../state/Board";
import { HexCell } from "../../state/HexCell";
import { Territory } from "../../state/Territory";
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

export const centeredBattlefield = createCenteredBattlefield();

export const centeredBattlefieldTheme: BoardTheme = {
  name: "Embergard Board 1",
  backgroundImage: "/embergard-board-1.jpg",
  imageWidth: 1368,
  imageHeight: 1500,
  imagePadding: { top: 32, right: 29, bottom: 30, left: 24 },
};

function createCenteredBattlefield(): Board {
  const hexes = createHexes();
  const northHexIds = hexes
    .filter((hex) => hex.territoryId === northTerritoryId)
    .map((hex) => hex.id);
  const southHexIds = hexes
    .filter((hex) => hex.territoryId === southTerritoryId)
    .map((hex) => hex.id);

  const board = new Board(
    "board:centered-battlefield",
    BoardSide.Front,
    hexes,
    [
      new Territory(northTerritoryId, "North Territory", null, northHexIds),
      new Territory(southTerritoryId, "South Territory", null, southHexIds),
    ],
  );
  board.recomputeEdgeFlags();
  return board;
}

function createHexes(): HexCell[] {
  return rowSizes.flatMap((rowSize, rowIndex) => createRowHexes(rowIndex, rowSize));
}

function createRowHexes(rowIndex: number, rowSize: number): HexCell[] {
  const axialRow = rowIndex - 5;
  const qStart = (-axialRow - rowSize + 1) / 2;

  return Array.from({ length: rowSize }, (_, columnIndex) => {
    const hexId = `hex:r${rowIndex}:c${columnIndex}`;
    const q = qStart + columnIndex;
    const territoryId =
      rowIndex < 5 ? northTerritoryId : rowIndex > 5 ? southTerritoryId : null;
    const isStartingHex =
      northStartingHexIds.has(hexId) || southStartingHexIds.has(hexId);

    const kind = staggerHexIds.has(hexId) ? HexKind.Stagger : HexKind.Empty;

    return new HexCell(
      hexId,
      q,
      axialRow,
      kind,
      isStartingHex,
      false,
      territoryId,
    );
  });
}
