import { Card, type Target } from "./Card";
import type { Game } from "../state/Game";
import type { Player } from "../state/Player";
import type { WeaponDefinition } from "../definitions/WeaponDefinition";
import { CardKind, CardZone, type WeaponAbilityKind } from "../values/enums";

/**
 * Base class for all upgrade cards.
 *
 * Handles common preconditions (must be in power hand, must be in power step,
 * owner must have enough glory to pay the cost).
 *
 * Subclasses override `getTargets(game)` to restrict which fighters can receive
 * this upgrade, and override the effect methods below to declare their passive
 * modifications. The combat resolver, MoveAbility, and other systems query
 * these methods on each equipped upgrade to compute effective stats — no
 * string-matching or external lookup needed.
 */
export class UpgradeCard extends Card {
  constructor(
    id: string,
    owner: Player,
    name: string,
    text: string,
    gloryValue: number,
    zone: CardZone,
  ) {
    super(id, owner, CardKind.Upgrade, name, text, gloryValue, zone);
  }

  override getLegalTargets(game: Game): Target[] {
    if (this.zone !== CardZone.PowerHand) return [];
    if (game.turnStep !== "power") return [];
    if (this.owner.glory < this.gloryValue) return [];
    return this.getTargets(game);
  }

  /** Which fighters can receive this upgrade? Default: alive on-board friendly fighters. */
  protected getTargets(_game: Game): Target[] {
    return this.owner.fighters.filter(
      (f) => !f.isSlain && f.currentHexId !== null,
    );
  }

  // ---------------------------------------------------------------------------
  // Passive effect hooks — override in subclasses to declare modifiers.
  // The base implementations return neutral values (no effect).
  // ---------------------------------------------------------------------------

  /** Bonus to fighter's Move stat. */
  getMovementBonus(): number { return 0; }

  /** Bonus to fighter's Health stat. */
  getHealthBonus(): number { return 0; }

  /** Bonus attack dice for the given weapon. */
  getAttackDiceBonus(_weapon: WeaponDefinition): number { return 0; }

  /** Bonus save dice. */
  getSaveDiceBonus(): number { return 0; }

  /** Weapon ability granted to the given weapon (e.g. Grievous, Cleave). */
  getGrantedWeaponAbility(_weapon: WeaponDefinition, _targetHealth: number): WeaponAbilityKind | null { return null; }

  /** Whether this upgrade causes the fighter to ignore a save keyword (Cleave/Ensnare). */
  shouldIgnoreSaveKeyword(_keyword: WeaponAbilityKind, _game: Game): boolean { return false; }
}
