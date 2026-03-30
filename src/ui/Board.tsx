import { boardHexes } from "../engine/state";
import { hexKey } from "../engine/hex";
import type { GameState } from "../engine/types";

type BoardProps = {
  state: GameState;
  selectedFighterId: string | null;
  onSelectFighter: (id: string | null) => void;
};

const HEX_SIZE = 38;

function toPixel(q: number, r: number) {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_SIZE * ((3 / 2) * r);
  return { x, y };
}

export function Board({ state, selectedFighterId, onSelectFighter }: BoardProps) {
  const hexes = boardHexes(state);

  return (
    <div className="board-wrap">
      <div className="board-surface">
        {hexes.map((h) => {
          const p = toPixel(h.q, h.r);
          const key = hexKey(h);
          const isObjective = state.objectiveHexes.some((o) => o.q === h.q && o.r === h.r);
          return (
            <div
              key={key}
              className={`hex ${isObjective ? "objective" : ""}`}
              style={{ left: `${p.x}px`, top: `${p.y}px` }}
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
                style={{ left: `${p.x}px`, top: `${p.y}px` }}
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
