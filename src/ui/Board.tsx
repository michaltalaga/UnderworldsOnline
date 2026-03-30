import { boardHexes } from "../engine/state";
import { hexKey } from "../engine/hex";
import type { GameState } from "../engine/types";

type BoardProps = {
  state: GameState;
  selectedFighterId: string | null;
  onSelectFighter: (id: string | null) => void;
};

const BOARD_WIDTH = 1500;
const BOARD_HEIGHT = 1368;

// Projection calibration for the Embergard board art in public/embergard-board-1.jpg.
// These values align logical hex centers to printed map hex centers.
const PROJECTION = {
  // Affine projection (origin + q-vector + r-vector) allows better fit than idealized hex math.
  originX: 748,
  originY: 681,
  qVecX: 103.2,
  qVecY: 1.6,
  rVecX: 51.0,
  rVecY: 89.6,
  tokenOffsetX: 0,
  tokenOffsetY: -2,
};

function toPixel(q: number, r: number) {
  const x = PROJECTION.originX + q * PROJECTION.qVecX + r * PROJECTION.rVecX;
  const y = PROJECTION.originY + q * PROJECTION.qVecY + r * PROJECTION.rVecY;
  return { x, y };
}

export function Board({ state, selectedFighterId, onSelectFighter }: BoardProps) {
  const hexes = boardHexes(state);

  return (
    <div className="board-wrap">
      <div className="board-surface" role="img" aria-label="Underworlds tactical board">
        {hexes.map((h) => {
          const p = toPixel(h.q, h.r);
          const key = hexKey(h);
          const isObjective = state.objectiveHexes.some((o) => o.q === h.q && o.r === h.r);
          return (
            <div
              key={key}
              className={`hex ${isObjective ? "objective" : ""}`}
              style={{
                left: `${(p.x / BOARD_WIDTH) * 100}%`,
                top: `${(p.y / BOARD_HEIGHT) * 100}%`,
              }}
            />
          );
        })}

        {Object.values(state.components.fighters)
          .filter((f) => f.hp > 0)
          .map((f) => {
            const p = toPixel(f.pos.q, f.pos.r);
            const selected = selectedFighterId === f.id;
            return (
              <button
                key={f.id}
                className={`fighter ${f.team} ${selected ? "selected" : ""}`}
                style={{
                  left: `${((p.x + PROJECTION.tokenOffsetX) / BOARD_WIDTH) * 100}%`,
                  top: `${((p.y + PROJECTION.tokenOffsetY) / BOARD_HEIGHT) * 100}%`,
                }}
                onClick={() => onSelectFighter(selected ? null : f.id)}
                title={`${f.name} (${f.hp}/${f.stats.maxHp})`}
              >
                <span className="name">{f.name}</span>
                <span className="hp">{f.hp}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
