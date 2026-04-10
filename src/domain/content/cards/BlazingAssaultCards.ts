import type { Target } from "../../cards/Card";
import { Fighter } from "../../state/Fighter";
import { GameRecordKind } from "../../state/GameRecord";
import type { Game } from "../../state/Game";
import type { Player } from "../../state/Player";
import type { CardZone } from "../../values/enums";
import { ObjectiveCard } from "../../cards/ObjectiveCard";
import { PloyCard } from "../../cards/PloyCard";
import { UpgradeCard } from "../../cards/UpgradeCard";
import { friendlyFightersOnBoard } from "../../cards/targeting";
import { giveGuard, heal, dealDamage, removeMovementToken, pushFighter } from "../../cards/effects";
import { getMyLatestCombat, getTerritoryOwner } from "../../cards/scoring";

// ─── Objectives ─────────────────────────────────────────────────────────────

export class StrikeTheHead extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Strike the Head",
      "Score this immediately after an enemy fighter is slain by a friendly fighter if the target was a leader or had Health \u2265 attacker's.", 1, zone);
  }

  protected override canScore(game: Game): boolean {
    const combat = getMyLatestCombat(game, this.owner.id);
    if (combat === null || !combat.data.targetSlain) return false;
    const attackerPlayer = game.getPlayer(combat.data.context.attackerPlayerId);
    const defenderPlayer = game.getPlayer(combat.data.context.defenderPlayerId);
    const attackerDef = attackerPlayer?.getFighterDefinition(combat.data.context.attackerFighterId);
    const targetDef = defenderPlayer?.getFighterDefinition(combat.data.context.targetFighterId);
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
    const combat = getMyLatestCombat(game, this.owner.id);
    if (combat === null) return false;
    const uniqueSymbols = new Set(combat.data.attackRoll);
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
    const combat = getMyLatestCombat(game, this.owner.id);
    if (combat === null) return false;
    if (combat.data.attackRoll.length === 0) return false;
    return combat.data.attackSuccesses === combat.data.attackRoll.length;
  }
}

export class CriticalEffort extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Critical Effort",
      "Score immediately after an Attack roll if any result was a critical success.", 1, zone);
  }

  protected override canScore(game: Game): boolean {
    const combat = getMyLatestCombat(game, this.owner.id);
    if (combat === null) return false;
    return combat.data.attackCriticals > 0;
  }
}

export class GetStuckIn extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Get Stuck In",
      "Score after a friendly fighter's Attack if the target was in enemy territory.", 1, zone);
  }

  protected override canScore(game: Game): boolean {
    const combat = getMyLatestCombat(game, this.owner.id);
    if (combat === null) return false;
    // If target was slain, the latest FighterSlain event has the hex they died on.
    // Otherwise the target is still on the board — use the combat record's target.
    let targetHexId: string | null = null;
    if (combat.data.targetSlain) {
      const slainEvent = game.getLatestEvent(GameRecordKind.FighterSlain);
      targetHexId = slainEvent?.data.slainHexId ?? null;
    } else {
      const target = game.getFighter(combat.data.context.targetFighterId);
      targetHexId = target?.currentHexId ?? null;
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
    const combat = getMyLatestCombat(game, this.owner.id);
    if (combat === null || !combat.data.targetSlain) return false;
    const slainEvents = game.getEventHistory(GameRecordKind.FighterSlain)
      .filter((e) => e.roundNumber === game.roundNumber);
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
    const combatEvents = game.getEventHistory(GameRecordKind.Combat)
      .filter((e) => e.roundNumber === game.roundNumber && e.invokedByPlayerId === this.owner.id);
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
      if (fighter.isSlain || fighter.currentHexId === null) continue;
      if (getTerritoryOwner(game, fighter.currentHexId) === this.owner.id) return false;
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
}

export class TwistTheKnife extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Twist the Knife",
      "Play after picking a melee weapon for an Attack. That weapon gains Grievous for that Attack.", zone);
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

  protected override getTargets(): Target[] {
    return friendlyFightersOnBoard(this);
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
    return friendlyFightersOnBoard(this);
  }

  protected override onPlay(game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    return pushFighter(game, target, 1);
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
    if (!(target instanceof Fighter)) return [];
    return pushFighter(game, target, 1);
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
}

export class DeadlyAim extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Deadly Aim", "This fighter's weapons have Ensnare.", 1, zone);
  }
}

export class SharpenedPoints extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Sharpened Points", "This fighter's weapons have Cleave.", 1, zone);
  }
}

export class Duellist extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Duellist", "Immediately after this fighter Attacks, push this fighter 1 hex.", 1, zone);
  }
}

export class Tough extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Tough", "No more than 3 damage can be inflicted on this fighter in the same turn.", 2, zone);
  }
}

export class GreatFortitude extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Great Fortitude", "This fighter has +1 Health.", 2, zone);
  }
}

export class KeenEye extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Keen Eye", "This fighter's melee weapons have +1 Attack dice.", 2, zone);
  }
}
