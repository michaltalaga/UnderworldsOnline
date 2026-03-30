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
const HEX_RADIUS = 44;
const HEX_X_STEP = Math.sqrt(3) * HEX_RADIUS;
const HEX_Y_STEP = 1.5 * HEX_RADIUS;

function toPixel(q: number, r: number) {
  const rowCount = rowCountForR(r);
  const qStart = qStartForR(r);
  const col = q - qStart;
  const x = BOARD_WIDTH / 2 + (col - (rowCount - 1) / 2) * HEX_X_STEP;
  const y = BOARD_HEIGHT / 2 + r * HEX_Y_STEP;
  return { x, y };
}

function hexPolygonPoints(cx: number, cy: number) {
  const pts: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angleDeg = -90 + i * 60;
    const angle = (angleDeg * Math.PI) / 180;
    const x = cx + HEX_RADIUS * Math.cos(angle);
    const y = cy + HEX_RADIUS * Math.sin(angle);
    pts.push(`${x},${y}`);
  }
  return pts.join(" ");
}

export function Board({ state, selectedFighterId, onSelectFighter }: BoardProps) {
  const hexes = boardHexes(state);

  return (
    <div className="board-wrap">
      <div className="board-surface" role="img" aria-label="Underworlds tactical board">
        <svg className="hex-layer" viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} aria-hidden="true">
          {hexes.map((h) => {
            const p = toPixel(h.q, h.r);
            const key = hexKey(h);
            const isObjective = state.objectiveHexes.some((o) => o.q === h.q && o.r === h.r);
            return (
              <polygon
                key={key}
                className={`hex ${isObjective ? "objective" : ""}`}
                points={hexPolygonPoints(p.x, p.y)}
              />
            );
          })}
        </svg>

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
