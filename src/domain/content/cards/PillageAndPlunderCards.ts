import type { Target } from "../../cards/Card";
import { Fighter } from "../../state/Fighter";
import type { Game } from "../../state/Game";
import type { Player } from "../../state/Player";
import { type CardZone, FeatureTokenSide, GameActionKind, WeaponAbilityKind } from "../../values/enums";
import { ObjectiveCard } from "../../cards/ObjectiveCard";
import { PloyCard } from "../../cards/PloyCard";
import { UpgradeCard } from "../../cards/UpgradeCard";
import {
  friendlyFightersOnBoard,
  enemyFightersOnBoard,
} from "../../cards/targeting";
import type { WeaponDefinition } from "../../definitions/WeaponDefinition";
import { giveGuard, giveStagger, heal, dealDamage, pushFighter } from "../../cards/effects";
import { CombatOutcome } from "../../values/enums";
import { rollAttackDie } from "../../rules/Dice";
import {
  getMyLatestCombatEvent,
  getMyLatestDelveEvent,
  getMyLatestMoveEvent,
  getTerritoryOwner,
  isInEnemyTerritory,
  isOnTreasureToken,
  isOnStaggerHex,
} from "../../cards/scoring";
import { CombatResolvedEvent } from "../../events/CombatResolvedEvent";
import { FighterDelvedEvent } from "../../events/FighterDelvedEvent";
import { FighterMovedEvent } from "../../events/FighterMovedEvent";
import { AttackDiceRolledEvent } from "../../events/AttackDiceRolledEvent";
import { SaveDiceRolledEvent } from "../../events/SaveDiceRolledEvent";
import { CombatEndedEvent } from "../../events/CombatEndedEvent";

// Source: Warhammer Underworlds — Pillage and Plunder Rivals deck.

// ─── Objectives ─────────────────────────────────────────────────────────────

export class BrokenProspects extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Broken Prospects",
      "Score this in an end phase if 3 or more different treasure tokens were Delved by your warband this battle round.",
      2, zone);
  }

  protected override canScore(game: Game): boolean {
    if (game.phase !== "end") return false;
    const thisRoundDelves = game.getEventsOfTypeThisRound(FighterDelvedEvent)
      .filter((e) => e.player === this.owner);
    const treasureDelves = thisRoundDelves.filter((e) => e.sideBeforeDelve === FeatureTokenSide.Treasure);
    const uniqueTokens = new Set(treasureDelves.map((e) => e.featureTokenId));
    return uniqueTokens.size >= 3;
  }
}

export class AgainstTheOdds extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Against the Odds",
      "Score this in an end phase if an odd-numbered treasure token was Delved by your warband this battle round.",
      1, zone);
  }

  protected override canScore(game: Game): boolean {
    if (game.phase !== "end") return false;
    const thisRoundDelves = game.getEventsOfTypeThisRound(FighterDelvedEvent)
      .filter((e) => e.player === this.owner);
    return thisRoundDelves.some((e) => {
      const token = game.getFeatureToken(e.featureTokenId);
      return token !== undefined && token.value % 2 === 1;
    });
  }
}

export class LostInTheDepths extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Lost in the Depths",
      "Score this in an end phase if no friendly fighters are adjacent and any friendly fighters are not slain.",
      1, zone);
  }

  protected override canScore(game: Game): boolean {
    if (game.phase !== "end") return false;
    const aliveFighters = this.owner.fighters.filter((f) => !f.isSlain && f.currentHexId !== null);
    if (aliveFighters.length === 0) return false;
    // Check no two alive friendly fighters are adjacent
    for (let i = 0; i < aliveFighters.length; i++) {
      for (let j = i + 1; j < aliveFighters.length; j++) {
        const hexA = game.getHex(aliveFighters[i].currentHexId!);
        const hexB = game.getHex(aliveFighters[j].currentHexId!);
        if (hexA !== undefined && hexB !== undefined && game.areAdjacent(hexA, hexB)) {
          return false;
        }
      }
    }
    return true;
  }
}

export class DesolateHomeland extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Desolate Homeland",
      "Score this in an end phase if there are 1 or fewer treasure tokens in friendly territory.",
      1, zone);
  }

  protected override canScore(game: Game): boolean {
    if (game.phase !== "end") return false;
    let count = 0;
    for (const token of game.featureTokens) {
      if (token.side !== FeatureTokenSide.Treasure) continue;
      if (getTerritoryOwner(game, token.hexId) === this.owner.id) count++;
    }
    return count <= 1;
  }
}

export class TornLandscape extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Torn Landscape",
      "Score this in an end phase if there are 2 or fewer treasure tokens on the battlefield.",
      2, zone);
  }

  protected override canScore(game: Game): boolean {
    if (game.phase !== "end") return false;
    const treasureCount = game.featureTokens
      .filter((t) => t.side === FeatureTokenSide.Treasure).length;
    return treasureCount <= 2;
  }
}

export class StripTheRealm extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Strip the Realm",
      "Score this in an end phase if there are no treasure tokens on the battlefield or if no enemy fighters hold any treasure tokens.",
      3, zone);
  }

  protected override canScore(game: Game): boolean {
    if (game.phase !== "end") return false;
    const treasures = game.featureTokens.filter((t) => t.side === FeatureTokenSide.Treasure);
    if (treasures.length === 0) return true;
    const opponent = game.getOpponent(this.owner.id);
    if (opponent === undefined) return false;
    const enemyHoldsTreasure = treasures.some((t) =>
      t.heldByFighterId !== null &&
      opponent.fighters.some((f) => f.id === t.heldByFighterId),
    );
    return !enemyHoldsTreasure;
  }
}

export class AggressiveClaimant extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Aggressive Claimant",
      "Score this immediately after a friendly fighter's successful Attack if the target was in neutral territory.",
      1, zone);
  }

  protected override canScore(game: Game): boolean {
    const combat = getMyLatestCombatEvent(game, this.owner);
    if (combat === null || combat.damageInflicted === 0) return false;
    if (combat.target.currentHexId === null) return false;
    // Neutral territory: no owner
    return getTerritoryOwner(game, combat.target.currentHexId) === null;
  }
}

export class ClaimThePrize extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Claim the Prize (Restricted)",
      "Score this immediately after a friendly fighter Delves in enemy territory.",
      1, zone);
  }

  protected override canScore(game: Game): boolean {
    const latestDelve = getMyLatestDelveEvent(game, this.owner);
    if (latestDelve === null) return false;
    const owner = getTerritoryOwner(game, latestDelve.featureTokenHexId);
    // Enemy territory: owned by someone, but not us
    return owner !== null && owner !== this.owner.id;
  }
}

export class DelvingForWealth extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Delving for Wealth (Restricted)",
      "Score this immediately after your warband Delves for the third or subsequent time this combat phase.",
      1, zone);
  }

  protected override canScore(game: Game): boolean {
    // Early exit: only scorable right after a delve by us
    const latestDelve = getMyLatestDelveEvent(game, this.owner);
    if (latestDelve === null) return false;
    const thisRoundDelves = game.getEventsOfTypeThisRound(FighterDelvedEvent)
      .filter((e) => e.player === this.owner);
    return thisRoundDelves.length >= 3;
  }
}

export class ShareTheLoad extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Share the Load",
      "Score this immediately after a friendly fighter Moves, if that fighter and any other friendly fighters are each on feature tokens.",
      1, zone);
  }

  protected override canScore(game: Game): boolean {
    const latestMove = getMyLatestMoveEvent(game, this.owner);
    if (latestMove === null) return false;
    // Check how many friendly fighters are on feature tokens
    const friendlyOnFeatureTokens = this.owner.fighters.filter((f) => {
      if (f.isSlain || f.currentHexId === null) return false;
      const hex = game.getHex(f.currentHexId);
      return hex?.featureTokenId !== null && hex?.featureTokenId !== undefined;
    });
    return friendlyOnFeatureTokens.length >= 2;
  }
}

export class HostileTakeover extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Hostile Takeover",
      "Score this immediately after the second or subsequent Attack made by your warband that was not part of a Charge.",
      1, zone);
  }

  protected override canScore(game: Game): boolean {
    // Early exit: only scorable right after a combat by us
    const combat = getMyLatestCombatEvent(game, this.owner);
    if (combat === null) return false;
    const nonChargeAttacks = game.getEventsOfTypeThisRound(CombatResolvedEvent)
      .filter((e) => e.attackerPlayer === this.owner && e.actionKind !== GameActionKind.Charge);
    return nonChargeAttacks.length >= 2;
  }
}

export class CarefulSurvey extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Careful Survey",
      "Score this immediately after an Action step if there is a friendly fighter in each territory.",
      1, zone);
  }

  protected override canScore(game: Game): boolean {
    const territories = game.territories;
    if (territories.length === 0) return false;
    for (const territory of territories) {
      const hasFriendlyFighter = this.owner.fighters.some((f) => {
        if (f.isSlain || f.currentHexId === null) return false;
        return territory.hexIds.includes(f.currentHexId);
      });
      if (!hasFriendlyFighter) return false;
    }
    return true;
  }
}

// ─── Ploys ──────────────────────────────────────────────────────────────────

export class PillageSidestep extends PloyCard {
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

export class PridefulDuellist extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Prideful Duellist",
      "Play this immediately after a friendly fighter's Attack if the attacker is in enemy territory. Heal the attacker.", zone);
  }

  protected override canPlay(game: Game): boolean {
    // Playable after combat is resolved but before it ends
    const resolved = game.getLatestEventOfType(CombatResolvedEvent);
    if (resolved === null || resolved.attackerPlayer !== this.owner) return false;
    if (game.getLatestEventAfter(resolved, CombatEndedEvent) !== null) return false;
    if (resolved.attacker.isSlain) return false;
    return isInEnemyTerritory(game, resolved.attacker, this.owner.id);
  }

  protected override onPlay(game: Game, _target: Target | null): string[] {
    const resolved = game.getLatestEventOfType(CombatResolvedEvent);
    if (resolved === null) return [];
    if (resolved.attacker.isSlain) return [];
    return heal(resolved.attacker);
  }
}

export class PillageCommandingStride extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Commanding Stride",
      "Push your leader up to 3 hexes. That push must end in a starting hex.", zone);
  }

  protected override getTargets(): Target[] {
    return this.owner.fighters.filter(f => {
      if (f.isSlain || f.currentHexId === null) return false;
      const def = this.owner.getFighterDefinition(f.id);
      return def?.isLeader === true;
    });
  }

  protected override onPlay(game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    return pushFighter(game, target, 3);
  }
}

export class CrumblingMine extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Crumbling Mine",
      "Pick a treasure token that is not held. Flip that treasure token.", zone);
  }

  // This card targets feature tokens, not fighters. The system does not
  // currently support targeting tokens, so this card is unplayable for now.
  protected override getTargets(_game: Game): Target[] {
    return [];
  }
}

export class ExplosiveCharges extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Explosive Charges",
      "Domain: Friendly fighters have +1 Move while using Charge abilities.", zone);
  }

  // Domain effect: passive modifier that is not a playable action.
  // The system does not currently support domain effects, so this card
  // is unplayable for now.
  protected override getTargets(_game: Game): Target[] {
    return [];
  }
}

export class WaryDelver extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Wary Delver",
      "Pick a friendly fighter with any Charge tokens. Give that fighter a Guard token.", zone);
  }

  protected override getTargets(): Target[] {
    return this.owner.fighters.filter(
      (f) => !f.isSlain && f.currentHexId !== null && f.hasChargeToken,
    );
  }

  protected override onPlay(_game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    return giveGuard(target);
  }
}

export class BrashScout extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Brash Scout",
      "Play this immediately after you make an Attack roll for a fighter in enemy territory. Re-roll 1 dice.", zone);
  }

  protected override canPlay(game: Game): boolean {
    const event = game.getLatestEventOfType(AttackDiceRolledEvent);
    if (event === null || event.attackerPlayer !== this.owner) return false;
    if (game.getLatestEventAfter(event, SaveDiceRolledEvent) !== null) return false;
    if (event.attacker.isSlain) return false;
    return isInEnemyTerritory(game, event.attacker, this.owner.id);
  }

  protected override onPlay(game: Game, _target: Target | null): string[] {
    const pending = game.pendingCombat;
    if (pending === null || pending.attackRoll.length === 0) return [];
    // Re-roll the worst attack die.
    const worstIndex = pending.attackRoll.indexOf(
      pending.attackRoll.reduce((worst, face) => face < worst ? face : worst),
    );
    const oldFace = pending.attackRoll[worstIndex];
    pending.attackRoll[worstIndex] = rollAttackDie();
    return [`Brash Scout: re-rolled ${oldFace} → ${pending.attackRoll[worstIndex]}`];
  }
}

export class SuddenBlast extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Sudden Blast",
      "Pick an enemy fighter adjacent to a friendly fighter. Give that enemy fighter a Stagger token.", zone);
  }

  protected override getTargets(game: Game): Target[] {
    const friendlies = friendlyFightersOnBoard(this);
    const enemies = enemyFightersOnBoard(this, game);
    // Only target enemies adjacent to at least one friendly
    return enemies.filter((enemy) => {
      if (enemy.currentHexId === null) return false;
      const enemyHex = game.getHex(enemy.currentHexId);
      if (enemyHex === undefined) return false;
      return friendlies.some((friendly) => {
        if (friendly.currentHexId === null) return false;
        const friendlyHex = game.getHex(friendly.currentHexId);
        return friendlyHex !== undefined && game.areAdjacent(enemyHex, friendlyHex);
      });
    });
  }

  protected override onPlay(_game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    return giveStagger(target);
  }
}

export class TunnellingTerror extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Tunnelling Terror",
      "Pick a friendly fighter with no Move or Charge tokens. Remove, place in empty stagger hex, give Charge token.", zone);
  }

  protected override getTargets(): Target[] {
    return this.owner.fighters.filter(
      (f) => !f.isSlain && f.currentHexId !== null && !f.hasMoveToken && !f.hasChargeToken,
    );
  }

  protected override onPlay(game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    // Simplified: push 2 hexes (approximation of remove-and-place) and give charge token
    const messages = pushFighter(game, target, 2);
    target.hasChargeToken = true;
    messages.push(`gave Charge token to ${target.id}`);
    return messages;
  }
}

export class TrappedCache extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Trapped Cache",
      "Pick an undamaged enemy fighter within 1 hex of a treasure token. Inflict 1 damage on that fighter.", zone);
  }

  protected override getTargets(game: Game): Target[] {
    const enemies = enemyFightersOnBoard(this, game);
    return enemies.filter((enemy) => {
      if (enemy.damage > 0) return false;
      if (enemy.currentHexId === null) return false;
      const enemyHex = game.getHex(enemy.currentHexId);
      if (enemyHex === undefined) return false;
      // Check if any treasure token is within 1 hex
      const neighbors = game.getNeighbors(enemyHex);
      const nearbyHexIds = [enemyHex.id, ...neighbors.map((h) => h.id)];
      return game.featureTokens.some(
        (t) => t.side === FeatureTokenSide.Treasure && nearbyHexIds.includes(t.hexId),
      );
    });
  }

  protected override onPlay(_game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    return dealDamage(target, 1);
  }
}

// ─── Upgrades ───────────────────────────────────────────────────────────────

export class GreatSpeed extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Great Speed", "This fighter has +1 Move.", 0, zone);
  }
  override getMovementBonus(): number { return 1; }
}

export class SwiftStep extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Swift Step",
      "Quick: Immediately after this fighter has Charged, you can push this fighter 1 hex.", 1, zone);
  }
  // Post-charge trigger — requires reaction system, not yet implemented.
}

export class BurrowingStrike extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Burrowing Strike",
      "Melee Attack (2 hex, Fury 2, 2 damage). +1 Attack dice while on a feature token.", 1, zone);
  }
  // Adds a weapon — requires weapon addition system, not yet implemented.
}

export class ToughEnough extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Tough Enough",
      "While in enemy territory, Save rolls not affected by Cleave and Ensnare.", 1, zone);
  }
  override shouldIgnoreSaveKeyword(keyword: WeaponAbilityKind, game: Game): boolean {
    if (keyword !== WeaponAbilityKind.Cleave && keyword !== WeaponAbilityKind.Ensnare) return false;
    if (this.attachedToFighter === null) return false;
    return isInEnemyTerritory(game, this.attachedToFighter, this.owner.id);
  }
}

export class CannySapper extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Canny Sapper",
      "Sneaky: After playing a Ploy, remove and place in empty stagger hex or starting hex in friendly territory.", 0, zone);
  }
  // Post-ploy trigger — requires reaction system, not yet implemented.
}

export class ImpossiblyQuick extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Impossibly Quick",
      "This fighter has +1 Save. Discard after enemy's failed Attack.", 1, zone);
  }
  override getSaveDiceBonus(): number { return 1; }
  // Discard-after-failed-attack — requires reaction system, not yet implemented.
}

export class Linebreaker extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Linebreaker", "This fighter's weapons have Brutal.", 1, zone);
  }
  override getGrantedWeaponAbility(): WeaponAbilityKind | null {
    return WeaponAbilityKind.Brutal;
  }
}

export class ExcavatingBlast extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Excavating Blast",
      "Ranged Attack (3 hex, Smash 2, 1 damage). Stagger while in enemy territory.", 1, zone);
  }
  // Adds a weapon — requires weapon addition system, not yet implemented.
}

export class Gloryseeker extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Gloryseeker",
      "This fighter's melee weapons have Grievous if target Health 4+.", 1, zone);
  }
  override getGrantedWeaponAbility(weapon: WeaponDefinition, targetHealth: number): WeaponAbilityKind | null {
    if (weapon.range <= 1 && targetHealth >= 4) return WeaponAbilityKind.Grievous;
    return null;
  }
}

export class FrenzyOfGreed extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Frenzy of Greed",
      "While on treasure token in enemy territory or stagger hex, Save not affected by Cleave/Ensnare.", 2, zone);
  }
  override shouldIgnoreSaveKeyword(keyword: WeaponAbilityKind, game: Game): boolean {
    if (keyword !== WeaponAbilityKind.Cleave && keyword !== WeaponAbilityKind.Ensnare) return false;
    if (this.attachedToFighter === null) return false;
    const fighter = this.attachedToFighter;
    const onTreasureInEnemy = isOnTreasureToken(game, fighter) && isInEnemyTerritory(game, fighter, this.owner.id);
    return onTreasureInEnemy || isOnStaggerHex(game, fighter);
  }
}
