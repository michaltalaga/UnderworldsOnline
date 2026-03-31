import { BoardState } from "../../state/BoardState";
import { HexCell } from "../../state/HexCell";
import { Territory } from "../../state/Territory";
import { BoardSide, HexKind } from "../../values/enums";

const rowSizes = [6, 7, 8, 9, 8, 9, 8, 9, 8, 7, 6] as const;
const northTerritoryId = "territory:north";
const southTerritoryId = "territory:south";

const northStartingHexIds = new Set([
  "hex:r0:c1",
  "hex:r0:c4",
  "hex:r1:c1",
  "hex:r1:c3",
  "hex:r1:c5",
  "hex:r2:c2",
  "hex:r2:c5",
]);

const southStartingHexIds = new Set([
  "hex:r8:c2",
  "hex:r8:c5",
  "hex:r9:c1",
  "hex:r9:c3",
  "hex:r9:c5",
  "hex:r10:c1",
  "hex:r10:c4",
]);

const neighborDirections = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
] as const;

export const centeredBattlefield = createCenteredBattlefield();

function createCenteredBattlefield(): BoardState {
  const hexes = createHexes();
  const northHexIds = hexes
    .filter((hex) => hex.territoryId === northTerritoryId)
    .map((hex) => hex.id);
  const southHexIds = hexes
    .filter((hex) => hex.territoryId === southTerritoryId)
    .map((hex) => hex.id);

  return new BoardState(
    "board:centered-battlefield",
    BoardSide.Front,
    hexes,
    [
      new Territory(northTerritoryId, "North Territory", null, northHexIds),
      new Territory(southTerritoryId, "South Territory", null, southHexIds),
    ],
  );
}

function createHexes(): HexCell[] {
  const hexes = rowSizes.flatMap((rowSize, rowIndex) => createRowHexes(rowIndex, rowSize));
  const coordinateMap = new Set(hexes.map((hex) => getCoordinateKey(hex.q, hex.r)));

  for (const hex of hexes) {
    hex.isEdgeHex = neighborDirections.some(([qOffset, rOffset]) => {
      return !coordinateMap.has(getCoordinateKey(hex.q + qOffset, hex.r + rOffset));
    });
  }

  return hexes;
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

    return new HexCell(
      hexId,
      q,
      axialRow,
      HexKind.Empty,
      isStartingHex,
      false,
      territoryId,
    );
  });
}

function getCoordinateKey(q: number, r: number): string {
  return `${q},${r}`;
}
