import { Game } from "../state/Game";
import {
  AttackDieFace,
  CombatOutcome,
  SaveDieFace,
  SaveSymbol,
  WeaponAccuracy,
} from "../values/enums";
import { CombatContext } from "./CombatContext";
import { CombatResolver } from "./CombatResolver";
import { CombatResult } from "./CombatResult";

export class DefaultCombatResolver extends CombatResolver {
  public resolve(game: Game, context: CombatContext): CombatResult {
    if (context.selectedAbility !== null) {
      throw new Error(`Weapon ability ${context.selectedAbility} is not supported by the default combat resolver.`);
    }

    const attackerPlayer = game.getPlayer(context.attackerPlayerId);
    if (attackerPlayer === undefined) {
      throw new Error(`Unknown attacker player ${context.attackerPlayerId}.`);
    }

    const defenderPlayer = game.getPlayer(context.defenderPlayerId);
    if (defenderPlayer === undefined) {
      throw new Error(`Unknown defender player ${context.defenderPlayerId}.`);
    }

    const attacker = attackerPlayer.getFighter(context.attackerFighterId);
    const attackerDefinition = attackerPlayer.getFighterDefinition(context.attackerFighterId);
    if (attacker === undefined || attackerDefinition === undefined || attacker.currentHexId === null) {
      throw new Error(`Attacker ${context.attackerFighterId} is not ready to attack.`);
    }

    const target = defenderPlayer.getFighter(context.targetFighterId);
    const targetDefinition = defenderPlayer.getFighterDefinition(context.targetFighterId);
    if (target === undefined || targetDefinition === undefined || target.currentHexId === null) {
      throw new Error(`Target ${context.targetFighterId} is not available to defend.`);
    }

    const weapon = attackerDefinition.weapons.find(
      (candidate) => candidate.id === context.weaponId,
    );
    if (weapon === undefined) {
      throw new Error(`Attacker ${attacker.id} does not have weapon ${context.weaponId}.`);
    }

    const attackRoll = Array.from(
      { length: weapon.dice },
      () => this.getAttackSuccessFace(weapon.accuracy),
    );
    const saveRoll = Array.from(
      { length: targetDefinition.saveDice },
      () => this.getSaveSuccessFace(targetDefinition.saveSymbol),
    );

    const attackSuccesses = attackRoll.length;
    const saveSuccesses = saveRoll.length;
    const outcome =
      attackSuccesses > saveSuccesses
        ? CombatOutcome.Success
        : attackSuccesses === saveSuccesses
          ? CombatOutcome.Draw
          : CombatOutcome.Failure;
    const damageInflicted = outcome === CombatOutcome.Success ? weapon.damage : 0;
    const targetSlain = target.damage + damageInflicted >= targetDefinition.health;

    return new CombatResult(
      context,
      attackRoll,
      saveRoll,
      outcome,
      attackSuccesses,
      saveSuccesses,
      0,
      0,
      damageInflicted,
      targetSlain,
      false,
      false,
      false,
    );
  }

  private getAttackSuccessFace(accuracy: WeaponAccuracy): AttackDieFace {
    switch (accuracy) {
      case WeaponAccuracy.Hammer:
        return AttackDieFace.Hammer;
      case WeaponAccuracy.Sword:
        return AttackDieFace.Sword;
      default: {
        const exhaustiveAccuracy: never = accuracy;
        throw new Error(`Unsupported weapon accuracy ${exhaustiveAccuracy}.`);
      }
    }
  }

  private getSaveSuccessFace(saveSymbol: SaveSymbol): SaveDieFace {
    switch (saveSymbol) {
      case SaveSymbol.Shield:
        return SaveDieFace.Shield;
      case SaveSymbol.Dodge:
        return SaveDieFace.Dodge;
      default: {
        const exhaustiveSaveSymbol: never = saveSymbol;
        throw new Error(`Unsupported save symbol ${exhaustiveSaveSymbol}.`);
      }
    }
  }
}
