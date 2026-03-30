import { boardHexes } from "../engine/state";
import { hexKey } from "../engine/hex";
import { qStartForR, rowCountForR } from "../engine/boardShape";
import type { GameState } from "../engine/types";

type BoardProps = {
  state: GameState;
  selectedFighterId: string | null;
  onSelectFighter: (id: string | null) => void;
};

const BOARD_WIDTH = 900;
const BOARD_HEIGHT = 760;
const HEX_X_STEP = 90;
const HEX_Y_STEP = 78;

function toPixel(q: number, r: number) {
  const rowCount = rowCountForR(r);
  const qStart = qStartForR(r);
  const col = q - qStart;
  const x = BOARD_WIDTH / 2 + (col - (rowCount - 1) / 2) * HEX_X_STEP;
  const y = BOARD_HEIGHT / 2 + r * HEX_Y_STEP;
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
