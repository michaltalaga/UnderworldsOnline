import type { CSSProperties } from "react";
import {
  FeatureTokenSide,
  HexKind,
  type BoardState,
  type HexId,
} from "../domain";
import {
  boardPadding,
  hexHeight,
  hexWidth,
  projectBoard,
} from "../board/projectBoard";

export type SetupBoardOccupant = {
  kind: "fighter";
  label: string;
  playerSlot: "player-one" | "player-two";
} | {
  kind: "feature";
  label: string;
  hidden: boolean;
};

type SetupBoardProps = {
  board: BoardState;
  legalHexIds?: ReadonlySet<HexId>;
  occupants?: ReadonlyMap<HexId, SetupBoardOccupant>;
  onHexClick?: (hexId: HexId) => void;
};

const northTerritoryId = "territory:north";
const southTerritoryId = "territory:south";

export default function SetupBoard({
  board,
  legalHexIds,
  occupants,
  onHexClick,
}: SetupBoardProps) {
  const { positionedHexes } = projectBoard(board);
  const width = Math.max(...positionedHexes.map((hex) => hex.left + hexWidth)) + boardPadding;
  const height = Math.max(...positionedHexes.map((hex) => hex.top + hexHeight)) + boardPadding;

  const wrapperStyle: CSSProperties = {
    width,
    height,
  };

  return (
    <div className="setup-board" style={wrapperStyle}>
      {positionedHexes.map(({ hex, left, top }) => {
        const isLegal = legalHexIds?.has(hex.id) ?? false;
        const occupant = occupants?.get(hex.id) ?? null;
        const classNames = ["setup-hex"];
        if (hex.territoryId === northTerritoryId) {
          classNames.push("setup-hex-territory-north");
        } else if (hex.territoryId === southTerritoryId) {
          classNames.push("setup-hex-territory-south");
        }
        if (hex.kind === HexKind.Blocked) {
          classNames.push("setup-hex-blocked");
        }
        if (hex.isEdgeHex) {
          classNames.push("setup-hex-edge");
        }
        if (hex.isStartingHex) {
          classNames.push("setup-hex-start");
        }
        if (isLegal) {
          classNames.push("setup-hex-legal");
        }

        const handleClick = isLegal && onHexClick ? () => onHexClick(hex.id) : undefined;

        return (
          <button
            key={hex.id}
            type="button"
            className={classNames.join(" ")}
            style={{ left, top }}
            disabled={!isLegal}
            onClick={handleClick}
          >
            <span className="setup-hex-coord">
              {hex.q},{hex.r}
            </span>
            <span className="setup-hex-occupant">
              {occupant?.kind === "fighter" && (
                <span className={`setup-hex-fighter setup-hex-fighter-${occupant.playerSlot}`}>
                  {occupant.label}
                </span>
              )}
              {occupant?.kind === "feature" && (
                <span
                  className={
                    occupant.hidden
                      ? "setup-hex-feature setup-hex-feature-hidden"
                      : "setup-hex-feature"
                  }
                >
                  {occupant.label}
                </span>
              )}
            </span>
            <span aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

export function describeFeatureToken(side: FeatureTokenSide, value: number): string {
  if (side === FeatureTokenSide.Hidden) {
    return "?";
  }
  return String(value);
}
