import { ChargeAction } from "../actions/ChargeAction";
import { GameAction } from "../actions/GameAction";
import { MoveAction } from "../actions/MoveAction";
import type { Game } from "../state/Game";
import type { PlayerState } from "../state/PlayerState";
import { Ability } from "./Ability";
import { MoveAbility } from "./MoveAbility";

export class ChargeAbility extends Ability {
  readonly name = "Charge";
  private readonly moveAbility = new MoveAbility();

  getLegalActions(game: Game, player: PlayerState): GameAction[] {
    if (!game.isCombatActionStep(player.id)) return [];
    const opponent = game.getOpponent(player.id);
    if (opponent === undefined) return [];

    const moveActions = this.moveAbility.getLegalActions(game, player) as MoveAction[];

    return moveActions.flatMap((moveAction) => {
      const destinationHexId = moveAction.path[moveAction.path.length - 1];
      if (destinationHexId === undefined) return [];

      const destinationHex = game.getHex(destinationHexId);
      if (destinationHex === undefined) return [];

      const definition = player.getFighterDefinition(moveAction.fighterId);
      if (definition === undefined) return [];

      return definition.weapons.flatMap((weapon) =>
        opponent.fighters.flatMap((target) => {
          if (target.isSlain || target.currentHexId === null) return [];
          const targetHex = game.getFighterHex(target);
          if (targetHex === undefined || game.getDistance(destinationHex, targetHex) > weapon.range) return [];

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
    if (!game.isCombatActionStep(action.playerId)) return false;

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

    const destinationHex = game.getHex(destinationHexId);
    const targetHex = game.getFighterHex(target);
    if (destinationHex === undefined || targetHex === undefined) return false;

    return game.getDistance(destinationHex, targetHex) <= weapon.range;
  }
}
