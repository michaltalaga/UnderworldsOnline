import { ChargeAction } from "../actions/ChargeAction";
import { GameAction } from "../actions/GameAction";
import { MoveAction } from "../actions/MoveAction";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { Ability } from "./Ability";
import { MoveAbility } from "./MoveAbility";

export class ChargeAbility extends Ability {
  readonly name = "Charge";
  private readonly moveAbility = new MoveAbility();

  getLegalActions(game: Game, player: Player): GameAction[] {
    if (!game.isCombatActionStep(player.id)) return [];
    const opponent = game.getOpponent(player.id);
    if (opponent === undefined) return [];

    const moveActions = this.moveAbility.getLegalActions(game, player) as MoveAction[];

    return moveActions.flatMap((moveAction) => {
      const destinationHex = moveAction.path[moveAction.path.length - 1];
      if (destinationHex === undefined) return [];

      const fighter = moveAction.fighter;
      const definition = fighter.definition;
      if (definition === undefined) return [];

      return definition.weapons.flatMap((weapon) =>
        opponent.fighters.flatMap((target) => {
          if (target.isSlain || target.currentHex === null) return [];
          const targetHex = target.currentHex ?? undefined;
          if (targetHex === undefined || game.getDistance(destinationHex, targetHex) > weapon.range) return [];

          return [
            new ChargeAction(player, fighter, moveAction.path, target, weapon),
            ...weapon.abilities.map(
              (ability) =>
                new ChargeAction(player, fighter, moveAction.path, target, weapon, ability.kind),
            ),
          ];
        }),
      );
    });
  }

  isLegalAction(game: Game, action: GameAction): boolean {
    if (!(action instanceof ChargeAction)) return false;
    if (!game.isCombatActionStep(action.player.id)) return false;

    const moveAction = new MoveAction(action.player, action.fighter, action.path);
    if (!this.moveAbility.isLegalAction(game, moveAction) || action.path.length === 0) return false;

    const target = action.target;
    if (target.isSlain || target.currentHex === null) return false;

    const weapon = action.weapon;
    // The weapon must actually belong to the attacker's fighter definition.
    const attackerDef = action.fighter.definition;
    if (attackerDef === undefined || !attackerDef.weapons.includes(weapon)) return false;
    if (action.selectedAbility !== null && !weapon.hasAbility(action.selectedAbility)) return false;

    const destinationHex = action.path[action.path.length - 1];
    if (destinationHex === undefined) return false;

    const targetHex = target.currentHex ?? undefined;
    if (targetHex === undefined) return false;

    return game.getDistance(destinationHex, targetHex) <= weapon.range;
  }
}
