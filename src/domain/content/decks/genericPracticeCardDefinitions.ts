import { CardDefinition, type CardPlayContext } from "../../definitions/CardDefinition";
import type { CardInstance } from "../../state/CardInstance";
import type { Game } from "../../state/Game";
import type { GameEventLogState } from "../../state/GameEventLogState";
import type { PlayerState } from "../../state/PlayerState";
import { CardKind, CardZone, ObjectiveConditionTiming } from "../../values/enums";

// Practice-grade CardDefinition subclasses used by the Rivals decks
// (Blazing Assault, Pillage & Plunder, ...). The Rivals decks ship with
// name + text + glory metadata only, so the base `CardDefinition.canPlay`
// (which returns false) makes every card inert. For practice mode we
// short-circuit the rules text entirely: each card is playable whenever
// the engine's structural preconditions are met (in hand, fighter is
// alive, glory is available, etc.) and plays as a generic no-op that
// just moves the card to its destination zone.
//
// Real rules-accurate implementations can ship as dedicated subclasses
// per card without touching these fallbacks.

// Objective: scores automatically in the end phase for its glory value.
// No other conditions are checked — "score in an end phase if X" cards
// become unconditional-score cards in practice mode.
export class GenericPracticeObjectiveCardDefinition extends CardDefinition {
  public constructor(id: string, name: string, text: string, gloryValue: number) {
    super(id, CardKind.Objective, name, text, gloryValue);
  }

  public override canPlay(
    _game: Game,
    _world: GameEventLogState,
    _player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): boolean {
    return (
      context.timing === ObjectiveConditionTiming.EndPhase &&
      card.zone === CardZone.ObjectiveHand
    );
  }

  public override play(
    _game: Game,
    _world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
  ): string[] {
    const handIndex = player.objectiveHand.findIndex((candidate) => candidate.id === card.id);
    if (handIndex === -1) {
      throw new Error(`Could not find objective ${card.id} in ${player.name}'s hand.`);
    }
    player.objectiveHand.splice(handIndex, 1);
    card.zone = CardZone.ScoredObjectives;
    card.revealed = true;
    player.scoredObjectives.push(card);
    player.glory += this.gloryValue;
    return [`scored for ${this.gloryValue} glory`];
  }
}

// Ploy: playable any time the active player is in the power step with
// the card in their hand. Play is a no-op — the card just moves to the
// power discard pile.
export class GenericPracticePloyCardDefinition extends CardDefinition {
  public constructor(id: string, name: string, text: string) {
    super(id, CardKind.Ploy, name, text, 0);
  }

  public override canPlay(
    _game: Game,
    _world: GameEventLogState,
    _player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): boolean {
    // The overlay model passes `targetFighterId: null` when asking for
    // ploys without a target. Accept that shape only — untargeted ploys
    // shouldn't flood the legal-action list with per-fighter variants.
    return (
      card.zone === CardZone.PowerHand &&
      (context.targetFighterId === null || context.targetFighterId === undefined)
    );
  }

  public override play(
    _game: Game,
    _world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
  ): string[] {
    const handIndex = player.powerHand.findIndex((candidate) => candidate.id === card.id);
    if (handIndex === -1) {
      throw new Error(`Could not find ploy ${card.id} in ${player.name}'s power hand.`);
    }
    player.powerHand.splice(handIndex, 1);
    card.zone = CardZone.PowerDiscard;
    card.attachedToFighterId = null;
    card.revealed = true;
    player.powerDeck.discardPile.push(card);
    return [`played ${this.name}`];
  }
}

// Upgrade: attaches to any living, on-board friendly fighter, spending
// the card's glory value from the player.
export class GenericPracticeUpgradeCardDefinition extends CardDefinition {
  public constructor(id: string, name: string, text: string, gloryValue: number) {
    super(id, CardKind.Upgrade, name, text, gloryValue);
  }

  public override canPlay(
    _game: Game,
    _world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): boolean {
    const equippedFighterId = context.equippedFighterId ?? null;
    if (
      card.zone !== CardZone.PowerHand ||
      equippedFighterId === null ||
      player.glory < this.gloryValue
    ) {
      return false;
    }
    const fighter = player.getFighter(equippedFighterId);
    return fighter !== undefined && !fighter.isSlain && fighter.currentHexId !== null;
  }

  public override play(
    _game: Game,
    _world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): string[] {
    const equippedFighterId = context.equippedFighterId ?? null;
    if (equippedFighterId === null) {
      throw new Error(`Upgrade ${this.name} requires a fighter target.`);
    }
    const fighter = player.getFighter(equippedFighterId);
    if (fighter === undefined) {
      throw new Error(`Could not find fighter ${equippedFighterId} for upgrade ${this.name}.`);
    }
    const handIndex = player.powerHand.findIndex((candidate) => candidate.id === card.id);
    if (handIndex === -1) {
      throw new Error(`Could not find upgrade ${card.id} in ${player.name}'s power hand.`);
    }
    player.powerHand.splice(handIndex, 1);
    card.zone = CardZone.Equipped;
    card.attachedToFighterId = fighter.id;
    card.revealed = true;
    player.equippedUpgrades.push(card);
    fighter.upgradeCardIds.push(card.id);
    player.glory -= this.gloryValue;
    return [`equipped ${this.name}`];
  }
}
