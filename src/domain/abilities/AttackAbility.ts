import { AttackAction } from "../actions/AttackAction";
import { GameAction } from "../actions/GameAction";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import { Ability } from "./Ability";
import { canFighterAttack } from "./fighterChecks";

export class AttackAbility extends Ability {
  readonly name = "Attack";

  getLegalActions(game: Game, player: Player): GameAction[] {
    if (!game.isCombatActionStep(player.id)) return [];
    const opponent = game.getOpponent(player.id);
    if (opponent === undefined) return [];

    return player.fighters.flatMap((fighter) => {
      const definition = player.getFighterDefinition(fighter.id);
      if (definition === undefined || !canFighterAttack(fighter)) return [];

      const attackerHex = game.getFighterHex(fighter);
      if (attackerHex === undefined) return [];

      return definition.weapons.flatMap((weapon) =>
        opponent.fighters.flatMap((target) => {
          if (target.isSlain || target.currentHex === null) return [];
          const targetHex = game.getFighterHex(target);
          if (targetHex === undefined || game.getDistance(attackerHex, targetHex) > weapon.range) return [];

          return [
            new AttackAction(player, fighter, target, weapon),
            ...weapon.abilities.map(
              (ability) => new AttackAction(player, fighter, target, weapon, ability.kind),
            ),
          ];
        }),
      );
    });
  }

  isLegalAction(game: Game, action: GameAction): boolean {
    if (!(action instanceof AttackAction)) return false;
    if (!game.isCombatActionStep(action.player.id)) return false;

    const attacker = action.attacker;
    if (!canFighterAttack(attacker)) return false;

    const target = action.target;
    if (target.isSlain || target.currentHex === null) return false;

    const weapon = action.weapon;
    // Verify weapon belongs to attacker.
    const attackerDef = action.player.getFighterDefinition(attacker.id);
    if (attackerDef === undefined || !attackerDef.weapons.includes(weapon)) return false;
    if (action.selectedAbility !== null && !weapon.hasAbility(action.selectedAbility)) return false;

    const attackerHex = game.getFighterHex(attacker);
    const targetHex = game.getFighterHex(target);
    if (attackerHex === undefined || targetHex === undefined) return false;

    return game.getDistance(attackerHex, targetHex) <= weapon.range;
  }
}
