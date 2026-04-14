import type { Target } from "../../cards/Card";
import { Fighter } from "../../state/Fighter";
import type { Game } from "../../state/Game";
import type { Player } from "../../state/Player";
import { type CardZone, WeaponAbilityKind } from "../../values/enums";
import { ObjectiveCard } from "../../cards/ObjectiveCard";
import { PloyCard } from "../../cards/PloyCard";
import { UpgradeCard } from "../../cards/UpgradeCard";
import type { WeaponDefinition } from "../../definitions/WeaponDefinition";
import { friendlyFightersOnBoard } from "../../cards/targeting";
import { giveGuard, heal, dealDamage, removeMovementToken, pushFighter } from "../../cards/effects";
import { rollAttackDie } from "../../rules/Dice";
import { getMyLatestCombatEvent, getLatestSlainEvent, getTerritoryOwner, isMeleeWeapon } from "../../cards/scoring";
import { CombatResolvedEvent } from "../../events/CombatResolvedEvent";
import { FighterSlainEvent } from "../../events/FighterSlainEvent";
import { AttackDiceRolledEvent } from "../../events/AttackDiceRolledEvent";
import { AttackDiceModifiedEvent } from "../../events/AttackDiceModifiedEvent";
import { WeaponAbilityModifiedEvent } from "../../events/WeaponAbilityModifiedEvent";
import { SaveDiceRolledEvent } from "../../events/SaveDiceRolledEvent";
import { getActiveCombatState } from "../../rules/CombatStateProjection";

// ─── Objectives ─────────────────────────────────────────────────────────────

export class StrikeTheHead extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Strike the Head",
      "Score this immediately after an enemy fighter is slain by a friendly fighter if the target was a leader or had Health \u2265 attacker's.", 1, zone);
  }

  protected override canScore(game: Game): boolean {
    const combat = getMyLatestCombatEvent(game, this.owner);
    if (combat === null || !combat.targetSlain) return false;
    const attackerDef = combat.attackerPlayer.getFighterDefinition(combat.attacker.id);
    const targetDef = combat.defenderPlayer.getFighterDefinition(combat.target.id);
    if (attackerDef === undefined || targetDef === undefined) return false;
    return targetDef.isLeader || targetDef.health >= attackerDef.health;
  }
}

export class BranchingFate extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Branching Fate",
      "Score after an Attack roll with 3+ dice of different symbols (2+ if underdog).", 1, zone);
  }

  protected override canScore(game: Game): boolean {
    const combat = getMyLatestCombatEvent(game, this.owner);
    if (combat === null) return false;
    const uniqueSymbols = new Set(combat.attackRoll);
    const opponent = game.getOpponent(this.owner.id);
    const isUnderdog = opponent !== undefined && this.owner.glory < opponent.glory;
    return uniqueSymbols.size >= (isUnderdog ? 2 : 3);
  }
}

export class PerfectStrike extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Perfect Strike",
      "Score immediately after an Attack roll if all results were successes.", 1, zone);
  }

  protected override canScore(game: Game): boolean {
    const combat = getMyLatestCombatEvent(game, this.owner);
    if (combat === null) return false;
    if (combat.attackRoll.length === 0) return false;
    return combat.attackSuccesses === combat.attackRoll.length;
  }
}

export class CriticalEffort extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Critical Effort",
      "Score immediately after an Attack roll if any result was a critical success.", 1, zone);
  }

  protected override canScore(game: Game): boolean {
    const combat = getMyLatestCombatEvent(game, this.owner);
    if (combat === null) return false;
    return combat.attackCriticals > 0;
  }
}

export class GetStuckIn extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Get Stuck In",
      "Score after a friendly fighter's Attack if the target was in enemy territory.", 1, zone);
  }

  protected override canScore(game: Game): boolean {
    const combat = getMyLatestCombatEvent(game, this.owner);
    if (combat === null) return false;
    // If target was slain, the latest FighterSlainEvent has the hex they died on.
    // Otherwise the target is still on the board.
    let targetHexId: string | null = null;
    if (combat.targetSlain) {
      const slainEvent = getLatestSlainEvent(game);
      targetHexId = slainEvent?.slainHexId ?? null;
    } else {
      targetHexId = combat.target.currentHex?.id ?? null;
    }
    if (targetHexId === null) return false;
    const owner = getTerritoryOwner(game, targetHexId);
    return owner !== null && owner !== this.owner.id;
  }
}

export class StrongStart extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Strong Start",
      "Score after an enemy fighter is slain if it was the first fighter slain this combat phase.", 1, zone);
  }

  protected override canScore(game: Game): boolean {
    const combat = getMyLatestCombatEvent(game, this.owner);
    if (combat === null || !combat.targetSlain) return false;
    const slainEvents = game.getEventsOfTypeThisRound(FighterSlainEvent);
    return slainEvents.length === 1;
  }
}

export class KeepChoppin extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Keep Choppin'",
      "Score in an end phase if your warband Attacked 3+ times this combat phase.", 1, zone);
  }

  protected override canScore(game: Game): boolean {
    if (game.phase !== "end") return false;
    const combatEvents = game.getEventsOfTypeThisRound(CombatResolvedEvent)
      .filter((e) => e.attackerPlayer === this.owner);
    return combatEvents.length >= 3;
  }
}

export class FieldsOfBlood extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Fields of Blood",
      "Score in an end phase if 4+ fighters are damaged and/or slain.", 1, zone);
  }

  protected override canScore(game: Game): boolean {
    if (game.phase !== "end") return false;
    let count = 0;
    for (const player of game.players) {
      for (const f of player.fighters) {
        if (f.damage > 0 || f.isSlain) count++;
      }
    }
    return count >= 4;
  }
}

export class GoAllOut extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Go All Out",
      "Score in an end phase if 5+ fighters have Move and/or Charge tokens.", 1, zone);
  }

  protected override canScore(game: Game): boolean {
    if (game.phase !== "end") return false;
    let count = 0;
    for (const player of game.players) {
      for (const f of player.fighters) {
        if (!f.isSlain && (f.hasMoveToken || f.hasChargeToken)) count++;
      }
    }
    return count >= 5;
  }
}

export class OnTheEdge extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "On the Edge",
      "Score in an end phase if any enemy fighters are vulnerable.", 1, zone);
  }

  protected override canScore(game: Game): boolean {
    if (game.phase !== "end") return false;
    const opponent = game.getOpponent(this.owner.id);
    if (opponent === undefined) return false;
    return opponent.fighters.some((f) => !f.isSlain && f.damage > 0);
  }
}

export class Denial extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Denial",
      "Score in an end phase if no enemy fighters are in friendly territory.", 1, zone);
  }

  protected override canScore(game: Game): boolean {
    if (game.phase !== "end") return false;
    const opponent = game.getOpponent(this.owner.id);
    if (opponent === undefined) return false;
    for (const fighter of opponent.fighters) {
      if (fighter.isSlain || fighter.currentHex === null) continue;
      if (fighter.currentHex.territory?.owner === this.owner) return false;
    }
    return true;
  }
}

export class Annihilation extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Annihilation",
      "Score in an end phase if each enemy fighter is slain.", 5, zone);
  }

  protected override canScore(game: Game): boolean {
    if (game.phase !== "end") return false;
    const opponent = game.getOpponent(this.owner.id);
    if (opponent === undefined) return false;
    return opponent.fighters.every((f) => f.isSlain);
  }
}

// ─── Ploys ──────────────────────────────────────────────────────────────────

export class DeterminedEffort extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Determined Effort",
      "Play after picking a weapon for an Attack. That weapon gains +1 Attack dice (+2 if underdog).", zone);
  }

  protected override canPlay(game: Game): boolean {
    const event = game.getLatestEventOfType(AttackDiceRolledEvent);
    if (event === null || event.attackerPlayer !== this.owner) return false;
    // Only playable before save dice are rolled
    return game.getLatestEventAfter(event, SaveDiceRolledEvent) === null;
  }

  protected override onPlay(game: Game, _target: Target | null): string[] {
    const combatState = getActiveCombatState(game);
    if (combatState === null) return [];
    const opponent = game.getOpponent(this.owner.id);
    const isUnderdog = opponent !== undefined && this.owner.glory < opponent.glory;
    const extraDice = isUnderdog ? 2 : 1;
    const previousRoll = [...combatState.attackRoll];
    const newRoll = [...previousRoll];
    for (let i = 0; i < extraDice; i++) {
      newRoll.push(rollAttackDie());
    }
    game.emitEvent(new AttackDiceModifiedEvent(
      game.roundNumber,
      combatState.attackerPlayer,
      combatState.attacker,
      this,
      previousRoll,
      newRoll,
      `Determined Effort: added ${extraDice} attack dice`,
      combatState.actionKind,
    ));
    return [`Determined Effort: added ${extraDice} attack dice`];
  }
}

export class TwistTheKnife extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Twist the Knife",
      "Play after picking a melee weapon for an Attack. That weapon gains Grievous for that Attack.", zone);
  }

  protected override canPlay(game: Game): boolean {
    const event = game.getLatestEventOfType(AttackDiceRolledEvent);
    if (event === null || event.attackerPlayer !== this.owner) return false;
    if (game.getLatestEventAfter(event, SaveDiceRolledEvent) !== null) return false;
    return isMeleeWeapon(event.weapon);
  }

  protected override onPlay(game: Game, _target: Target | null): string[] {
    const combatState = getActiveCombatState(game);
    if (combatState === null) return [];
    game.emitEvent(new WeaponAbilityModifiedEvent(
      game.roundNumber,
      combatState.attackerPlayer,
      combatState.attacker,
      this,
      combatState.selectedAbility,
      WeaponAbilityKind.Grievous,
      "Twist the Knife: weapon gained Grievous",
      combatState.actionKind,
    ));
    return [`Twist the Knife: weapon gained Grievous`];
  }
}

export class WingsOfWar extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Wings of War",
      "Pick a friendly fighter. Push that fighter 2 hexes.", zone);
  }

  protected override getTargets(): Target[] {
    return friendlyFightersOnBoard(this);
  }

  protected override onPlay(game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    return pushFighter(game, target, 2);
  }
}

export class Sidestep extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Sidestep",
      "Pick a friendly fighter. Push that fighter 1 hex.", zone);
  }

  protected override getTargets(): Target[] {
    return friendlyFightersOnBoard(this);
  }

  protected override onPlay(game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    return pushFighter(game, target, 1);
  }
}

export class ShieldsUp extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Shields Up!",
      "Pick a friendly fighter. Give that fighter a Guard token.", zone);
  }

  protected override getTargets(): Target[] {
    return friendlyFightersOnBoard(this);
  }

  protected override onPlay(_game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    return giveGuard(target);
  }
}

export class HealingPotion extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Healing Potion",
      "Pick a friendly fighter. Heal that fighter.", zone);
  }

  protected override getTargets(): Target[] {
    return friendlyFightersOnBoard(this);
  }

  protected override onPlay(_game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    return heal(target);
  }
}

export class ScreamOfAnger extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Scream of Anger",
      "Pick a friendly fighter. Inflict 2 damage and remove 1 Move or Charge token.", zone);
  }

  protected override getTargets(): Target[] {
    return friendlyFightersOnBoard(this);
  }

  protected override onPlay(_game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    const messages = dealDamage(target, 2);
    messages.push(...removeMovementToken(target));
    return messages;
  }
}

export class LureOfBattle extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Lure of Battle",
      "Pick a friendly fighter within 2 hexes of another fighter. Push the other fighter 1 hex closer.", zone);
  }

  protected override getTargets(game: Game): Target[] {
    const friendlies = friendlyFightersOnBoard(this);
    const opponent = game.getOpponent(this.owner.id);
    const allFighters = [
      ...this.owner.fighters.filter(f => !f.isSlain && f.currentHex !== null),
      ...(opponent ? opponent.fighters.filter(f => !f.isSlain && f.currentHex !== null) : []),
    ];
    return friendlies.filter(f => {
      const hex = f.currentHex;
      if (hex === null) return false;
      const neighbors = game.getNeighbors(hex);
      const ring2HexIds = new Set([hex.id, ...neighbors.map(n => n.id)]);
      for (const n of neighbors) {
        for (const n2 of game.getNeighbors(n)) {
          ring2HexIds.add(n2.id);
        }
      }
      return allFighters.some(other => other !== f && other.currentHex !== null && ring2HexIds.has(other.currentHex.id));
    });
  }

  protected override onPlay(game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    return pushFighter(game, target, 1);
  }
}

export class CommandingStride extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Commanding Stride",
      "Push your leader up to 3 hexes. Push must end in a starting hex.", zone);
  }

  protected override getTargets(): Target[] {
    return this.owner.fighters.filter(f => {
      if (f.isSlain || f.currentHex === null) return false;
      const def = this.owner.getFighterDefinition(f.id);
      return def?.isLeader === true;
    });
  }

  protected override onPlay(game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    return pushFighter(game, target, 3);
  }
}

export class IllusoryFighter extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Illusory Fighter (Restricted)",
      "Pick a friendly fighter. Remove from battlefield, then place in an empty starting hex in friendly territory.", zone);
  }

  protected override getTargets(): Target[] {
    return friendlyFightersOnBoard(this);
  }

  protected override onPlay(game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter) || target.currentHex === null) return [];
    const originHex = target.currentHex;
    // Remove from current hex
    originHex.occupantFighter = null;
    // Find an empty starting hex in friendly territory
    const friendlyTerritory = this.owner.territory;
    const startingHexes = game.board.hexes.filter(h =>
      h.isStartingHex &&
      h.occupantFighter === null &&
      h.territory === friendlyTerritory
    );
    if (startingHexes.length === 0) {
      // No valid hex, put fighter back
      originHex.occupantFighter = target;
      return [`no empty starting hex available for ${target.id}`];
    }
    const destination = startingHexes[Math.floor(Math.random() * startingHexes.length)];
    destination.occupantFighter = target;
    target.currentHex = destination;
    return [`removed ${target.id} and placed in ${destination.id}`];
  }
}

// ─── Upgrades ───────────────────────────────────────────────────────────────

export class Brawler extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Brawler", "This fighter cannot be Flanked or Surrounded.", 1, zone);
  }
}

export class HiddenAid extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Hidden Aid", "Enemy fighters adjacent to this fighter are Flanked.", 1, zone);
  }
}

export class Accurate extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Accurate", "After an Attack roll, immediately re-roll 1 Attack die.", 1, zone);
  }
}

export class GreatStrength extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Great Strength", "This fighter's melee weapons have Grievous.", 2, zone);
  }
  override getGrantedWeaponAbility(weapon: WeaponDefinition): WeaponAbilityKind | null {
    return isMeleeWeapon(weapon) ? WeaponAbilityKind.Grievous : null;
  }
}

export class DeadlyAim extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Deadly Aim", "This fighter's weapons have Ensnare.", 1, zone);
  }
  override getGrantedWeaponAbility(): WeaponAbilityKind | null {
    return WeaponAbilityKind.Ensnare;
  }
}

export class SharpenedPoints extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Sharpened Points", "This fighter's weapons have Cleave.", 1, zone);
  }
  override getGrantedWeaponAbility(): WeaponAbilityKind | null {
    return WeaponAbilityKind.Cleave;
  }
}

export class Duellist extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Duellist", "Immediately after this fighter Attacks, push this fighter 1 hex.", 1, zone);
  }
  // Post-attack trigger — requires reaction system, not yet implemented.
}

export class Tough extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Tough", "No more than 3 damage can be inflicted on this fighter in the same turn.", 2, zone);
  }
  // Per-turn damage cap — requires damage tracking, not yet implemented.
}

export class GreatFortitude extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Great Fortitude", "This fighter has +1 Health.", 2, zone);
  }
  override getHealthBonus(): number { return 1; }
}

export class KeenEye extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Keen Eye", "This fighter's melee weapons have +1 Attack dice.", 2, zone);
  }
  override getAttackDiceBonus(weapon: WeaponDefinition): number {
    return isMeleeWeapon(weapon) ? 1 : 0;
  }
}
