import { Game } from "../state/Game";
import {
  AttackDieFace,
  CombatOutcome,
  SaveDieFace,
  SaveSymbol,
  WeaponAbilityKind,
  WeaponAccuracy,
} from "../values/enums";
import { CombatContext } from "./CombatContext";
import { CombatResolver } from "./CombatResolver";
import { CombatResult } from "./CombatResult";

export type DefaultCombatResolverRollAttackDie = () => AttackDieFace;
export type DefaultCombatResolverRollSaveDie = () => SaveDieFace;

type CombatRollStats = {
  successes: number;
  criticals: number;
};

const defaultAttackDieFaces: readonly AttackDieFace[] = [
  AttackDieFace.Critical,
  AttackDieFace.Hammer,
  AttackDieFace.Sword,
  AttackDieFace.Support,
  AttackDieFace.DoubleSupport,
  AttackDieFace.Blank,
];

const defaultSaveDieFaces: readonly SaveDieFace[] = [
  SaveDieFace.Critical,
  SaveDieFace.Shield,
  SaveDieFace.Dodge,
  SaveDieFace.Support,
  SaveDieFace.DoubleSupport,
  SaveDieFace.Blank,
];

export class DefaultCombatResolver extends CombatResolver {
  private readonly rollAttackDie: DefaultCombatResolverRollAttackDie;
  private readonly rollSaveDie: DefaultCombatResolverRollSaveDie;

  public constructor(
    rollAttackDie: DefaultCombatResolverRollAttackDie = DefaultCombatResolver.rollAttackDie,
    rollSaveDie: DefaultCombatResolverRollSaveDie = DefaultCombatResolver.rollSaveDie,
  ) {
    super();
    this.rollAttackDie = rollAttackDie;
    this.rollSaveDie = rollSaveDie;
  }

  public resolve(
    game: Game,
    context: CombatContext,
    attackRollInput: readonly AttackDieFace[] | null = null,
    saveRollInput: readonly SaveDieFace[] | null = null,
  ): CombatResult {
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

    const selectedAbilityDefinition =
      context.selectedAbility === null
        ? null
        : weapon.abilities.find((ability) => ability.kind === context.selectedAbility) ?? null;

    if (context.selectedAbility !== null && selectedAbilityDefinition === null) {
      throw new Error(`Weapon ability ${context.selectedAbility} is not available on weapon ${weapon.name}.`);
    }

    if (
      context.selectedAbility !== null &&
      context.selectedAbility !== WeaponAbilityKind.Stagger
      && context.selectedAbility !== WeaponAbilityKind.Grievous
      && context.selectedAbility !== WeaponAbilityKind.Cleave
      && context.selectedAbility !== WeaponAbilityKind.Ensnare
      && context.selectedAbility !== WeaponAbilityKind.Brutal
    ) {
      throw new Error(`Weapon ability ${context.selectedAbility} is not supported by the default combat resolver.`);
    }

    const defenderIsStaggered = target.hasStaggerToken;
    const defenderIsGuarded = target.hasGuardToken && !defenderIsStaggered;
    const attackRoll = this.resolveRoll(
      weapon.dice,
      attackRollInput,
      this.rollAttackDie,
      "attack",
    );
    const saveRoll = this.resolveRoll(
      targetDefinition.saveDice,
      saveRollInput,
      this.rollSaveDie,
      "save",
    );

    const attackStats = this.getAttackRollStats(
      attackRoll,
      weapon.accuracy,
      defenderIsStaggered,
    );
    const canTriggerSelectedAbility =
      selectedAbilityDefinition !== null &&
      (!selectedAbilityDefinition.requiresCritical || attackStats.criticals > 0);
    const effectiveSaveSymbol =
      context.selectedAbility === WeaponAbilityKind.Brutal &&
      canTriggerSelectedAbility
        ? null
        : context.selectedAbility === WeaponAbilityKind.Cleave &&
            canTriggerSelectedAbility &&
            targetDefinition.saveSymbol === SaveSymbol.Shield
          ? null
          : context.selectedAbility === WeaponAbilityKind.Ensnare &&
              canTriggerSelectedAbility &&
              targetDefinition.saveSymbol === SaveSymbol.Dodge
            ? null
            : targetDefinition.saveSymbol;
    const saveStats = this.getSaveRollStats(
      saveRoll,
      effectiveSaveSymbol,
      defenderIsGuarded,
    );
    const outcome = this.getCombatOutcome(attackStats, saveStats);
    const grievousDamageBonus =
      context.selectedAbility === WeaponAbilityKind.Grievous &&
      canTriggerSelectedAbility &&
      outcome === CombatOutcome.Success
        ? 1
        : 0;
    const damageInflicted = outcome === CombatOutcome.Success ? weapon.damage + grievousDamageBonus : 0;
    const targetSlain = target.damage + damageInflicted >= targetDefinition.health;
    const staggerApplied =
      context.selectedAbility === WeaponAbilityKind.Stagger &&
      canTriggerSelectedAbility &&
      outcome === CombatOutcome.Success &&
      !targetSlain &&
      !target.hasStaggerToken;

    return new CombatResult(
      context,
      [...attackRoll],
      [...saveRoll],
      outcome,
      attackStats.successes,
      saveStats.successes,
      attackStats.criticals,
      saveStats.criticals,
      damageInflicted,
      targetSlain,
      false,
      false,
      staggerApplied,
    );
  }

  private getAttackRollStats(
    attackRoll: readonly AttackDieFace[],
    accuracy: WeaponAccuracy,
    defenderIsStaggered: boolean,
  ): CombatRollStats {
    const criticals = attackRoll.filter((face) => face === AttackDieFace.Critical).length;
    const symbolSuccesses = attackRoll.filter((face) => face === accuracy).length;
    const supportSuccesses = defenderIsStaggered
      ? attackRoll.filter(DefaultCombatResolver.isAttackSupportFace).length
      : 0;

    return {
      successes: criticals + symbolSuccesses + supportSuccesses,
      criticals,
    };
  }

  private getSaveRollStats(
    saveRoll: readonly SaveDieFace[],
    saveSymbol: SaveSymbol | null,
    defenderIsGuarded: boolean,
  ): CombatRollStats {
    const criticals = saveRoll.filter((face) => face === SaveDieFace.Critical).length;
    const symbolSuccesses =
      saveSymbol === null
        ? 0
        : saveRoll.filter((face) => face === saveSymbol).length;
    const supportSuccesses = defenderIsGuarded
      ? saveRoll.filter(DefaultCombatResolver.isSaveSupportFace).length
      : 0;

    return {
      successes: criticals + symbolSuccesses + supportSuccesses,
      criticals,
    };
  }

  private getCombatOutcome(
    attackStats: CombatRollStats,
    saveStats: CombatRollStats,
  ): CombatOutcome {
    if (attackStats.criticals > saveStats.criticals) {
      return CombatOutcome.Success;
    }

    if (attackStats.criticals < saveStats.criticals) {
      return CombatOutcome.Failure;
    }

    if (attackStats.successes > saveStats.successes) {
      return CombatOutcome.Success;
    }

    if (attackStats.successes < saveStats.successes) {
      return CombatOutcome.Failure;
    }

    return CombatOutcome.Draw;
  }

  private resolveRoll<T>(
    expectedCount: number,
    providedRoll: readonly T[] | null,
    rollDie: () => T,
    label: string,
  ): T[] {
    if (providedRoll !== null) {
      if (providedRoll.length !== expectedCount) {
        throw new Error(`Expected ${expectedCount} ${label} dice, got ${providedRoll.length}.`);
      }

      return [...providedRoll];
    }

    return Array.from({ length: expectedCount }, () => rollDie());
  }

  private static isAttackSupportFace(face: AttackDieFace): boolean {
    return face === AttackDieFace.Support || face === AttackDieFace.DoubleSupport;
  }

  private static isSaveSupportFace(face: SaveDieFace): boolean {
    return face === SaveDieFace.Support || face === SaveDieFace.DoubleSupport;
  }

  private static rollAttackDie(): AttackDieFace {
    return DefaultCombatResolver.pickRandom(defaultAttackDieFaces);
  }

  private static rollSaveDie(): SaveDieFace {
    return DefaultCombatResolver.pickRandom(defaultSaveDieFaces);
  }

  private static pickRandom<T>(faces: readonly T[]): T {
    const randomIndex = Math.floor(Math.random() * faces.length);
    const face = faces[randomIndex];
    if (face === undefined) {
      throw new Error("Expected a combat die face.");
    }

    return face;
  }
}
