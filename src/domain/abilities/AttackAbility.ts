import { AttackAction } from "../actions/AttackAction";
import { GameAction } from "../actions/GameAction";
import type { Game } from "../state/Game";
import type { PlayerState } from "../state/PlayerState";
import { Ability } from "./Ability";
import { canFighterAttack } from "./fighterChecks";

export class AttackAbility extends Ability {
  readonly name = "Attack";

  getLegalActions(game: Game, player: PlayerState): GameAction[] {
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
          if (target.isSlain || target.currentHexId === null) return [];
          const targetHex = game.getFighterHex(target);
          if (targetHex === undefined || game.getDistance(attackerHex, targetHex) > weapon.range) return [];

          return [
            new AttackAction(player.id, fighter.id, target.id, weapon.id),
            ...weapon.abilities.map(
              (ability) => new AttackAction(player.id, fighter.id, target.id, weapon.id, ability.kind),
            ),
          ];
        }),
      );
    });
  }

  isLegalAction(game: Game, action: GameAction): boolean {
    if (!(action instanceof AttackAction)) return false;
    if (!game.isCombatActionStep(action.playerId)) return false;

    const player = game.getPlayer(action.playerId);
    const opponent = game.getOpponent(action.playerId);
    if (player === undefined || opponent === undefined) return false;

    const attacker = player.getFighter(action.attackerId);
    if (attacker === undefined || !canFighterAttack(attacker)) return false;

    const target = opponent.getFighter(action.targetId);
    if (target === undefined || target.isSlain || target.currentHexId === null) return false;

    const weapon = player.getFighterWeaponDefinition(action.attackerId, action.weaponId);
    if (weapon === undefined) return false;
    if (action.selectedAbility !== null && !weapon.hasAbility(action.selectedAbility)) return false;

    const attackerHex = game.getFighterHex(attacker);
    const targetHex = game.getFighterHex(target);
    if (attackerHex === undefined || targetHex === undefined) return false;

    return game.getDistance(attackerHex, targetHex) <= weapon.range;
  }
}
