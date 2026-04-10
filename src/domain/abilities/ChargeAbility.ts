import { ChargeAction } from "../actions/ChargeAction";
import { GameAction } from "../actions/GameAction";
import { MoveAction } from "../actions/MoveAction";
import type { Game } from "../state/Game";
import type { PlayerState } from "../state/PlayerState";
import { TurnStep } from "../values/enums";
import { Ability } from "./Ability";
import { MoveAbility } from "./MoveAbility";

export class ChargeAbility extends Ability {
  readonly name = "Charge";
  private readonly moveAbility = new MoveAbility();

  getLegalActions(game: Game, player: PlayerState): GameAction[] {
    if (!this.isActionStep(game, player.id)) return [];
    const opponent = game.getOpponent(player.id);
    if (opponent === undefined) return [];

    // Charge = move + attack. Reuse MoveAbility to get legal move paths,
    // then for each destination check which targets are in weapon range.
    const moveActions = this.moveAbility.getLegalActions(game, player) as MoveAction[];

    return moveActions.flatMap((moveAction) => {
      const destinationHexId = moveAction.path[moveAction.path.length - 1];
      if (destinationHexId === undefined) return [];

      const destinationHex = game.board.getHex(destinationHexId);
      if (destinationHex === undefined) return [];

      const definition = player.getFighterDefinition(moveAction.fighterId);
      if (definition === undefined) return [];

      return definition.weapons.flatMap((weapon) =>
        opponent.fighters.flatMap((target) => {
          if (target.isSlain || target.currentHexId === null) return [];
          const targetHex = game.board.getHex(target.currentHexId);
          if (targetHex === undefined || game.board.getDistance(destinationHex, targetHex) > weapon.range) return [];

          return [
            new ChargeAction(player.id, moveAction.fighterId, moveAction.path, target.id, weapon.id),
            ...weapon.abilities.map(
              (ability) => new ChargeAction(player.id, moveAction.fighterId, moveAction.path, target.id, weapon.id, ability.kind),
            ),
          ];
        }),
      );
    });
  }

  isLegalAction(game: Game, action: GameAction): boolean {
    if (!(action instanceof ChargeAction)) return false;
    if (!this.isActionStep(game, action.playerId)) return false;

    // Validate the move portion
    const moveAction = new MoveAction(action.playerId, action.fighterId, action.path);
    if (!this.moveAbility.isLegalAction(game, moveAction) || action.path.length === 0) return false;

    const player = game.getPlayer(action.playerId);
    const opponent = game.getOpponent(action.playerId);
    if (player === undefined || opponent === undefined) return false;

    const target = opponent.getFighter(action.targetId);
    if (target === undefined || target.isSlain || target.currentHexId === null) return false;

    const weapon = player.getFighterWeaponDefinition(action.fighterId, action.weaponId);
    if (weapon === undefined) return false;
    if (action.selectedAbility !== null && !weapon.hasAbility(action.selectedAbility)) return false;

    const destinationHexId = action.path[action.path.length - 1];
    if (destinationHexId === undefined) return false;

    const destinationHex = game.board.getHex(destinationHexId);
    const targetHex = game.board.getHex(target.currentHexId);
    if (destinationHex === undefined || targetHex === undefined) return false;

    return game.board.getDistance(destinationHex, targetHex) <= weapon.range;
  }

  private isActionStep(game: Game, playerId: string): boolean {
    return game.state.kind === "combatTurn" && game.turnStep === TurnStep.Action && game.activePlayerId === playerId;
  }
}
