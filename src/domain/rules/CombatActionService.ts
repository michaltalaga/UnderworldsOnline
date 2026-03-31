import { GameAction } from "../actions/GameAction";
import { GuardAction } from "../actions/GuardAction";
import { MoveAction } from "../actions/MoveAction";
import { PassAction } from "../actions/PassAction";
import { Game } from "../state/Game";
import { HexCell } from "../state/HexCell";
import { FighterState } from "../state/FighterState";
import { PlayerState } from "../state/PlayerState";
import { HexKind, TurnStep } from "../values/enums";
import type { FighterId, HexId, PlayerId } from "../values/ids";
import { LegalActionService } from "./LegalActionService";

const neighborDirections = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
] as const;

type MovePathSearchNode = {
  hex: HexCell;
  path: HexId[];
};

export class CombatActionService extends LegalActionService {
  public getLegalActions(game: Game, playerId: PlayerId): GameAction[] {
    if (game.state.kind !== "combatTurn" || game.activePlayerId !== playerId) {
      return [];
    }

    const player = game.getPlayer(playerId);
    if (player === undefined) {
      return [];
    }

    if (game.turnStep === TurnStep.Power) {
      return [new PassAction(playerId)];
    }

    if (game.turnStep !== TurnStep.Action) {
      return [];
    }

    return [
      ...player.fighters.flatMap((fighter) => this.getLegalMoveActionsForFighter(game, player, fighter.id)),
      ...player.fighters.flatMap((fighter) => this.getLegalGuardActionsForFighter(game, player, fighter.id)),
      new PassAction(playerId),
    ];
  }

  public isLegalGuardAction(game: Game, action: GuardAction): boolean {
    if (!this.isCombatActionStep(game, action.playerId)) {
      return false;
    }

    const player = game.getPlayer(action.playerId);
    if (player === undefined) {
      return false;
    }

    const fighter = player.getFighter(action.fighterId);
    if (fighter === undefined) {
      return false;
    }

    return this.canFighterGuard(fighter);
  }

  public isLegalMoveAction(game: Game, action: MoveAction): boolean {
    if (!this.isCombatActionStep(game, action.playerId)) {
      return false;
    }

    const player = game.getPlayer(action.playerId);
    if (player === undefined) {
      return false;
    }

    const fighter = player.getFighter(action.fighterId);
    const fighterDefinition = player.getFighterDefinition(action.fighterId);
    if (fighter === undefined || fighterDefinition === undefined) {
      return false;
    }

    if (
      fighter.isSlain ||
      fighter.currentHexId === null ||
      fighter.hasMoveToken ||
      fighter.hasChargeToken
    ) {
      return false;
    }

    if (action.path.length === 0 || action.path.length > fighterDefinition.move) {
      return false;
    }

    const visitedHexIds = new Set<HexId>([fighter.currentHexId]);
    let currentHex = game.board.getHex(fighter.currentHexId);
    if (currentHex === undefined) {
      return false;
    }

    for (const nextHexId of action.path) {
      if (visitedHexIds.has(nextHexId)) {
        return false;
      }

      const nextHex = game.board.getHex(nextHexId);
      if (nextHex === undefined || !this.isAdjacent(currentHex, nextHex)) {
        return false;
      }

      if (!this.isTraversableMoveHex(nextHex)) {
        return false;
      }

      visitedHexIds.add(nextHex.id);
      currentHex = nextHex;
    }

    return true;
  }

  private getLegalGuardActionsForFighter(
    game: Game,
    player: PlayerState,
    fighterId: FighterId,
  ): GuardAction[] {
    const fighter = player.getFighter(fighterId);
    if (fighter === undefined || !this.canFighterGuard(fighter)) {
      return [];
    }

    if (!this.isCombatActionStep(game, player.id)) {
      return [];
    }

    return [new GuardAction(player.id, fighter.id)];
  }

  private getLegalMoveActionsForFighter(
    game: Game,
    player: PlayerState,
    fighterId: FighterId,
  ): MoveAction[] {
    const fighter = player.getFighter(fighterId);
    const fighterDefinition = player.getFighterDefinition(fighterId);
    if (fighter === undefined || fighterDefinition === undefined) {
      return [];
    }

    if (
      fighter.isSlain ||
      fighter.currentHexId === null ||
      fighter.hasMoveToken ||
      fighter.hasChargeToken
    ) {
      return [];
    }

    const startHex = game.board.getHex(fighter.currentHexId);
    if (startHex === undefined) {
      return [];
    }

    const legalActions: MoveAction[] = [];
    const frontier: MovePathSearchNode[] = [{ hex: startHex, path: [] }];
    const shortestPathLengths = new Map<HexId, number>([[startHex.id, 0]]);

    while (frontier.length > 0) {
      const currentNode = frontier.shift();
      if (currentNode === undefined || currentNode.path.length >= fighterDefinition.move) {
        continue;
      }

      for (const neighborHex of this.getAdjacentHexes(game, currentNode.hex)) {
        if (!this.isTraversableMoveHex(neighborHex)) {
          continue;
        }

        const nextPathLength = currentNode.path.length + 1;
        const bestKnownPathLength = shortestPathLengths.get(neighborHex.id);
        if (
          bestKnownPathLength !== undefined &&
          bestKnownPathLength <= nextPathLength
        ) {
          continue;
        }

        const nextPath = [...currentNode.path, neighborHex.id];
        shortestPathLengths.set(neighborHex.id, nextPathLength);
        legalActions.push(new MoveAction(player.id, fighter.id, nextPath));
        frontier.push({ hex: neighborHex, path: nextPath });
      }
    }

    return legalActions;
  }

  private canFighterGuard(fighter: FighterState): boolean {
    return !(
      fighter.isSlain ||
      fighter.currentHexId === null ||
      fighter.hasMoveToken ||
      fighter.hasChargeToken ||
      fighter.hasGuardToken
    );
  }

  private isCombatActionStep(game: Game, playerId: PlayerId): boolean {
    return (
      game.state.kind === "combatTurn" &&
      game.turnStep === TurnStep.Action &&
      game.activePlayerId === playerId
    );
  }

  private getAdjacentHexes(game: Game, hex: HexCell): HexCell[] {
    return neighborDirections.flatMap(([qOffset, rOffset]) => {
      const adjacentHex = game.board.hexes.find(
        (candidate) => candidate.q === hex.q + qOffset && candidate.r === hex.r + rOffset,
      );

      return adjacentHex === undefined ? [] : [adjacentHex];
    });
  }

  private isAdjacent(a: HexCell, b: HexCell): boolean {
    return neighborDirections.some(
      ([qOffset, rOffset]) => a.q + qOffset === b.q && a.r + rOffset === b.r,
    );
  }

  private isTraversableMoveHex(hex: HexCell): boolean {
    return hex.kind !== HexKind.Blocked && hex.occupantFighterId === null;
  }
}
