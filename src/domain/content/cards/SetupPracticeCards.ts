import type { Target } from "../../cards/Card";
import { ObjectiveCard } from "../../cards/ObjectiveCard";
import { PloyCard } from "../../cards/PloyCard";
import { UpgradeCard } from "../../cards/UpgradeCard";
import { Fighter } from "../../state/Fighter";
import type { Game } from "../../state/Game";
import type { Player } from "../../state/Player";
import { CardZone, FeatureTokenSide } from "../../values/enums";
import { friendlyFightersWithoutGuard, enemyFightersWithoutStagger } from "../../cards/targeting";
import { giveGuard, giveStagger } from "../../cards/effects";
import { getMyLatestCombatEvent, getMyLatestDelveEvent, getTerritoryOwner } from "../../cards/scoring";
import { FighterDelvedEvent } from "../../events/FighterDelvedEvent";

// ─── Custom Objectives (event-log aware) ────────────────────────────────────

export class PracticeObjective01 extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Practice Objective 01",
      "Score this immediately after you make an Attack roll if all of the results were successes.",
      1, zone);
  }

  protected override canScore(game: Game): boolean {
    const combat = getMyLatestCombatEvent(game, this.owner);
    if (combat === null) return false;
    if (combat.attackRoll.length === 0) return false;
    return combat.attackSuccesses === combat.attackRoll.length;
  }
}

export class PracticeObjective02 extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Practice Objective 02",
      "Score this immediately after an enemy fighter is slain by a friendly fighter if the target was a leader or the target's Health was >= the attacker's.",
      1, zone);
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

export class PracticeObjective03 extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Practice Objective 03",
      "Score this immediately after a friendly fighter Delves in enemy territory.",
      1, zone);
  }

  protected override canScore(game: Game): boolean {
    const latestDelve = getMyLatestDelveEvent(game, this.owner);
    if (latestDelve === null) return false;
    const owner = getTerritoryOwner(game, latestDelve.featureTokenHexId);
    if (owner === null) return false;
    // Enemy territory = not ours
    if (owner !== this.owner.id) return true;
    // Underdog exception: score even in own territory if behind on glory
    const opponent = game.getOpponent(this.owner.id);
    return opponent !== undefined && this.owner.glory < opponent.glory;
  }
}

export class PracticeObjective04 extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone) {
    super(id, owner, "Practice Objective 04",
      "Score this in an end phase if 3 or more different treasure tokens were Delved by your warband this battle round.",
      1, zone);
  }

  protected override canScore(game: Game): boolean {
    if (game.phase !== "end") return false;
    const thisRoundDelves = game.getEventsOfTypeThisRound(FighterDelvedEvent)
      .filter((e) => e.player === this.owner);
    const thisRoundTreasureDelves = thisRoundDelves.filter((e) =>
      e.sideBeforeDelve === FeatureTokenSide.Treasure,
    );
    const delvedTokenIds = new Set(thisRoundTreasureDelves.map((e) => e.featureTokenId));
    return delvedTokenIds.size >= 3;
  }
}

/** Generic end-phase practice objective (no special scoring condition). */
export class PracticeObjectiveGeneric extends ObjectiveCard {
  constructor(id: string, owner: Player, zone: CardZone, cardNumber: string) {
    super(id, owner, `Practice Objective ${cardNumber}`, "", 1, zone);
  }
}

// ─── Ploys ──────────────────────────────────────────────────────────────────

/** Draw 1 power card. */
export class DrawPowerCardsPloy extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone, cardNumber: string) {
    super(id, owner, `Practice Ploy ${cardNumber}`, "Draw 1 power card.", zone);
  }

  protected override getTargets(_game: Game): Target[] {
    if (this.owner.powerDeck.drawPile.length < 1) return [];
    return [this.owner];
  }

  // TODO: onPlay should draw from power deck when engine supports it
}

/** Gain 1 signal token. */
export class GainWarscrollTokensPloy extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone, cardNumber: string) {
    super(id, owner, `Practice Ploy ${cardNumber}`, "Gain 1 signal token.", zone);
  }
  // Untargeted, default getTargets returns [this.owner]. No effect yet.
}

/** Give a friendly fighter a guard token. */
export class GiveGuardPloy extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone, cardNumber: string) {
    super(id, owner, `Practice Ploy ${cardNumber}`, "Give a friendly fighter a guard token.", zone);
  }

  protected override getTargets(): Target[] {
    return friendlyFightersWithoutGuard(this);
  }

  protected override onPlay(_game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    return giveGuard(target);
  }
}

/** Give an enemy fighter a stagger token. */
export class GiveStaggerPloy extends PloyCard {
  constructor(id: string, owner: Player, zone: CardZone, cardNumber: string) {
    super(id, owner, `Practice Ploy ${cardNumber}`, "Give an enemy fighter a stagger token.", zone);
  }

  protected override getTargets(game: Game): Target[] {
    return enemyFightersWithoutStagger(this, game);
  }

  protected override onPlay(_game: Game, target: Target | null): string[] {
    if (!(target instanceof Fighter)) return [];
    return giveStagger(target);
  }
}

/** Generic practice upgrade (no special effect). */
export class PracticeUpgrade extends UpgradeCard {
  constructor(id: string, owner: Player, zone: CardZone, cardNumber: string) {
    super(id, owner, `Practice Upgrade ${cardNumber}`, "", 1, zone);
  }
}
