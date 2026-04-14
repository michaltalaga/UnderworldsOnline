import { Game } from "../state/Game";
import {
  AttackDieFace,
  CombatOutcome,
  FeatureTokenSide,
  SaveDieFace,
  SaveSymbol,
  WeaponAbilityKind,
  WeaponAccuracy,
} from "../values/enums";
import { CombatContext } from "./CombatContext";
import { CombatResolver } from "./CombatResolver";
import { CombatResult } from "./CombatResult";
import { rollAttackDie as rollAttackDieFace, rollSaveDie as rollSaveDieFace } from "./Dice";
import {
  getEffectiveAttackDice,
  getEffectiveHealth,
  getEffectiveSaveDice,
  getUpgradeWeaponAbility,
  shouldIgnoreSaveKeyword,
} from "../cards/upgradeEffects";

export type DefaultCombatResolverRollAttackDie = () => AttackDieFace;
export type DefaultCombatResolverRollSaveDie = () => SaveDieFace;

type CombatRollStats = {
  successes: number;
  criticals: number;
};

export class DefaultCombatResolver extends CombatResolver {
  private readonly rollAttackDie: DefaultCombatResolverRollAttackDie;
  private readonly rollSaveDie: DefaultCombatResolverRollSaveDie;

  public constructor(
    rollAttackDie: DefaultCombatResolverRollAttackDie = rollAttackDieFace,
    rollSaveDie: DefaultCombatResolverRollSaveDie = rollSaveDieFace,
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
    const attackerPlayer = context.attackerPlayer;
    const defenderPlayer = context.defenderPlayer;
    const attacker = context.attacker;
    if (attacker.currentHex === null) {
      throw new Error(`Attacker ${attacker.id} is not ready to attack.`);
    }

    const target = context.target;
    const targetDefinition = target.definition;
    if (target.currentHex === null) {
      throw new Error(`Target ${target.id} is not available to defend.`);
    }

    const weapon = context.weapon;

    const selectedAbilityDefinition = weapon.getAbility(context.selectedAbility);

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

    // --- Upgrade-derived effective stats ---
    const effectiveAttackDice = getEffectiveAttackDice(weapon, attackerPlayer, attacker);
    const effectiveSaveDice = getEffectiveSaveDice(targetDefinition, defenderPlayer, target);
    const effectiveHealth = getEffectiveHealth(targetDefinition, defenderPlayer, target);

    // Check if an upgrade grants a weapon ability (e.g. GreatStrength → Grievous).
    // Only applies when the weapon's own selected ability is null (no innate ability chosen).
    const upgradeAbility = context.selectedAbility === null
      ? getUpgradeWeaponAbility(weapon, attackerPlayer, attacker, targetDefinition.health)
      : null;
    const resolvedAbility = context.selectedAbility ?? upgradeAbility;

    const defenderIsStaggered = target.hasStaggerToken;
    const defenderIsGuarded = target.hasGuardToken && !defenderIsStaggered;
    const defenderIsOnCoverToken = target.currentHex === null
      ? false
      : this.isFighterOnCoverToken(game, target.currentHex.id);
    const attackRoll = this.resolveRoll(
      effectiveAttackDice,
      attackRollInput,
      this.rollAttackDie,
      "attack",
    );
    const saveRoll = this.resolveRoll(
      effectiveSaveDice,
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
    // For upgrade-granted abilities, they always trigger (no requiresCritical
    // check on the upgrade — the ability definition lives on the weapon, not
    // the upgrade).
    const canTriggerUpgradeAbility = upgradeAbility !== null;
    const canTriggerAbility = canTriggerSelectedAbility || canTriggerUpgradeAbility;

    // Check if defender should ignore the save keyword (ToughEnough / FrenzyOfGreed)
    const defenderIgnoresSaveKeyword =
      resolvedAbility !== null &&
      shouldIgnoreSaveKeyword(target, resolvedAbility, game, defenderPlayer);
    const effectiveSaveAbility = defenderIgnoresSaveKeyword ? null : resolvedAbility;

    const saveSuccessFaces = this.getSaveSuccessFaces(
      targetDefinition.saveSymbol,
      effectiveSaveAbility,
      canTriggerAbility,
      defenderIsGuarded,
    );
    const saveStats = this.getSaveRollStats(
      saveRoll,
      saveSuccessFaces,
      defenderIsOnCoverToken,
    );
    const outcome = this.getCombatOutcome(attackStats, saveStats);
    const grievousDamageBonus =
      resolvedAbility === WeaponAbilityKind.Grievous &&
      canTriggerAbility &&
      outcome === CombatOutcome.Success
        ? 1
        : 0;
    const damageInflicted = outcome === CombatOutcome.Success ? weapon.damage + grievousDamageBonus : 0;
    const targetSlain = target.damage + damageInflicted >= effectiveHealth;
    const staggerApplied =
      resolvedAbility === WeaponAbilityKind.Stagger &&
      canTriggerAbility &&
      outcome === CombatOutcome.Success &&
      !targetSlain &&
      !target.hasStaggerToken;

    return new CombatResult(
      context,
      selectedAbilityDefinition?.requiresCritical ?? false,
      canTriggerSelectedAbility,
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
    saveSuccessFaces: ReadonlySet<SaveDieFace>,
    defenderIsOnCoverToken: boolean,
  ): CombatRollStats {
    const criticals = saveRoll.filter((face) => face === SaveDieFace.Critical).length;
    const symbolSuccesses = saveRoll.filter((face) => saveSuccessFaces.has(face)).length;
    const supportSuccesses = defenderIsOnCoverToken
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

  private getSaveSuccessFaces(
    saveSymbol: SaveSymbol,
    selectedAbility: WeaponAbilityKind | null,
    canTriggerSelectedAbility: boolean,
    defenderIsGuarded: boolean,
  ): ReadonlySet<SaveDieFace> {
    const saveSuccessFaces = new Set<SaveDieFace>(
      defenderIsGuarded
        ? [SaveDieFace.Shield, SaveDieFace.Dodge]
        : saveSymbol === SaveSymbol.Shield
          ? [SaveDieFace.Shield]
          : [SaveDieFace.Dodge],
    );

    if (!canTriggerSelectedAbility) {
      return saveSuccessFaces;
    }

    if (selectedAbility === WeaponAbilityKind.Brutal) {
      saveSuccessFaces.clear();
      return saveSuccessFaces;
    }

    if (selectedAbility === WeaponAbilityKind.Cleave) {
      saveSuccessFaces.delete(SaveDieFace.Shield);
      return saveSuccessFaces;
    }

    if (selectedAbility === WeaponAbilityKind.Ensnare) {
      saveSuccessFaces.delete(SaveDieFace.Dodge);
      return saveSuccessFaces;
    }

    return saveSuccessFaces;
  }

  private static isAttackSupportFace(face: AttackDieFace): boolean {
    return face === AttackDieFace.Support || face === AttackDieFace.DoubleSupport;
  }

  private static isSaveSupportFace(face: SaveDieFace): boolean {
    return face === SaveDieFace.Support || face === SaveDieFace.DoubleSupport;
  }


  private isFighterOnCoverToken(game: Game, fighterHexId: string): boolean {
    const fighterHex = game.board.getHex(fighterHexId);
    if (fighterHex?.featureTokenId === null || fighterHex?.featureTokenId === undefined) {
      return false;
    }

    const featureToken = game.board.getFeatureToken(fighterHex.featureTokenId);
    return (
      featureToken !== undefined &&
      featureToken.hexId === fighterHex.id &&
      featureToken.side === FeatureTokenSide.Cover
    );
  }
}
