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
  hexSize: 62,
  scaleX: 0.965,
  scaleY: 0.965,
  offsetX: 0,
  offsetY: 6,
};

function toPixel(q: number, r: number) {
  const x =
    BOARD_WIDTH / 2 +
    PROJECTION.offsetX +
    PROJECTION.scaleX * PROJECTION.hexSize * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y =
    BOARD_HEIGHT / 2 +
    PROJECTION.offsetY +
    PROJECTION.scaleY * PROJECTION.hexSize * ((3 / 2) * r);
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
                  left: `${(p.x / BOARD_WIDTH) * 100}%`,
                  top: `${(p.y / BOARD_HEIGHT) * 100}%`,
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
