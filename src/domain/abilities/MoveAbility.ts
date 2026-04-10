import { GameAction } from "../actions/GameAction";
import { MoveAction } from "../actions/MoveAction";
import type { Game } from "../state/Game";
import type { HexCell } from "../state/HexCell";
import type { PlayerState } from "../state/PlayerState";
import type { HexId } from "../values/ids";
import { Ability } from "./Ability";
import { canFighterMove, isTraversableMoveHex } from "./fighterChecks";

type MovePathSearchNode = {
  hex: HexCell;
  path: HexId[];
};

export class MoveAbility extends Ability {
  readonly name = "Move";

  getLegalActions(game: Game, player: PlayerState): GameAction[] {
    if (!game.isCombatActionStep(player.id)) return [];
    return player.fighters.flatMap((fighter) => {
      const definition = player.getFighterDefinition(fighter.id);
      if (definition === undefined || !canFighterMove(fighter)) return [];

      const startHex = game.getFighterHex(fighter);
      if (startHex === undefined) return [];

      const actions: MoveAction[] = [];
      const frontier: MovePathSearchNode[] = [{ hex: startHex, path: [] }];
      const shortestPathLengths = new Map<HexId, number>([[startHex.id, 0]]);

      while (frontier.length > 0) {
        const node = frontier.shift();
        if (node === undefined || node.path.length >= definition.move) continue;

        for (const neighbor of game.getNeighbors(node.hex)) {
          if (!isTraversableMoveHex(neighbor)) continue;
          const nextLen = node.path.length + 1;
          const best = shortestPathLengths.get(neighbor.id);
          if (best !== undefined && best <= nextLen) continue;

          const nextPath = [...node.path, neighbor.id];
          shortestPathLengths.set(neighbor.id, nextLen);
          actions.push(new MoveAction(player.id, fighter.id, nextPath));
          frontier.push({ hex: neighbor, path: nextPath });
        }
      }

      return actions;
    });
  }

  isLegalAction(game: Game, action: GameAction): boolean {
    if (!(action instanceof MoveAction)) return false;
    if (!game.isCombatActionStep(action.playerId)) return false;

    const player = game.getPlayer(action.playerId);
    if (player === undefined) return false;

    const fighter = player.getFighter(action.fighterId);
    const definition = player.getFighterDefinition(action.fighterId);
    if (fighter === undefined || definition === undefined || !canFighterMove(fighter)) return false;
    if (action.path.length === 0 || action.path.length > definition.move) return false;

    const visited = new Set<HexId>([fighter.currentHexId]);
    let currentHex = game.getFighterHex(fighter);
    if (currentHex === undefined) return false;

    for (const nextHexId of action.path) {
      if (visited.has(nextHexId)) return false;
      const nextHex = game.getHex(nextHexId);
      if (nextHex === undefined || !game.areAdjacent(currentHex, nextHex)) return false;
      if (!isTraversableMoveHex(nextHex)) return false;
      visited.add(nextHex.id);
      currentHex = nextHex;
    }

    return true;
  }
}
