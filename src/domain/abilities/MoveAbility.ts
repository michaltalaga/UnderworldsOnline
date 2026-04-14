import { GameAction } from "../actions/GameAction";
import { MoveAction } from "../actions/MoveAction";
import type { Game } from "../state/Game";
import type { HexCell } from "../state/HexCell";
import type { Player } from "../state/Player";
import { Ability } from "./Ability";
import { canFighterMove, isTraversableMoveHex } from "./fighterChecks";
import { getEffectiveMove } from "../cards/upgradeEffects";

type MovePathSearchNode = {
  hex: HexCell;
  path: HexCell[];
};

export class MoveAbility extends Ability {
  readonly name = "Move";

  getLegalActions(game: Game, player: Player): GameAction[] {
    if (!game.isCombatActionStep(player.id)) return [];
    return player.fighters.flatMap((fighter) => {
      const definition = fighter.definition;
      if (definition === undefined || !canFighterMove(fighter)) return [];

      const startHex = fighter.currentHex;
      if (startHex === null) return [];

      const moveDistance = getEffectiveMove(definition, player, fighter);
      const actions: MoveAction[] = [];
      const frontier: MovePathSearchNode[] = [{ hex: startHex, path: [] }];
      const shortestPathLengths = new Map<HexCell, number>([[startHex, 0]]);

      while (frontier.length > 0) {
        const node = frontier.shift();
        if (node === undefined || node.path.length >= moveDistance) continue;

        for (const neighbor of game.getNeighbors(node.hex)) {
          if (!isTraversableMoveHex(neighbor)) continue;
          const nextLen = node.path.length + 1;
          const best = shortestPathLengths.get(neighbor);
          if (best !== undefined && best <= nextLen) continue;

          const nextPath = [...node.path, neighbor];
          shortestPathLengths.set(neighbor, nextLen);
          actions.push(new MoveAction(player, fighter, nextPath));
          frontier.push({ hex: neighbor, path: nextPath });
        }
      }

      return actions;
    });
  }

  isLegalAction(game: Game, action: GameAction): boolean {
    if (!(action instanceof MoveAction)) return false;
    if (!game.isCombatActionStep(action.player.id)) return false;

    const fighter = action.fighter;
    const definition = action.fighter.definition;
    if (definition === undefined || !canFighterMove(fighter)) return false;
    const moveDistance = getEffectiveMove(definition, action.player, fighter);
    if (action.path.length === 0 || action.path.length > moveDistance) return false;

    const visited = new Set<HexCell>([fighter.currentHex]);
    let currentHex: HexCell = fighter.currentHex;

    for (const nextHex of action.path) {
      if (visited.has(nextHex)) return false;
      if (!game.areAdjacent(currentHex, nextHex)) return false;
      if (!isTraversableMoveHex(nextHex)) return false;
      visited.add(nextHex);
      currentHex = nextHex;
    }

    return true;
  }
}
