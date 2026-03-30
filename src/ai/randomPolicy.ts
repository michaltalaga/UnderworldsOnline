import { nextRng } from "../engine/rng";
import { getLegal } from "../engine/engine";
import type { GameAction, GameState, LegalAction } from "../engine/types";

function weight(action: GameAction): number {
  switch (action.type) {
    case "charge":
      return 5;
    case "attack":
      return 4;
    case "play-power":
      return 3;
    case "move":
      return 2;
    case "guard":
      return 2;
    case "start-mulligan":
      return 3;
    case "resolve-mulligan":
      return 5;
    case "end-power":
      return 1;
    case "pass":
      return 0.5;
    default:
      return 1;
  }
}

export function chooseAiAction(state: GameState): { state: number; action: LegalAction | null } {
  const legal = getLegal(state);
  if (legal.length === 0) return { state: state.rngState, action: null };

  const weighted = legal.map((l) => ({ l, w: weight(l.action) }));
  const total = weighted.reduce((sum, item) => sum + item.w, 0);
  const roll = nextRng(state.rngState);
  const pick = roll.value * total;

  let cursor = 0;
  for (const item of weighted) {
    cursor += item.w;
    if (pick <= cursor) {
      return { state: roll.state, action: item.l };
    }
  }

  return { state: roll.state, action: weighted[weighted.length - 1].l };
}
