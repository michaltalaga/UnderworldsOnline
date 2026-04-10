import { Card, type CardFactory, type Target } from "../../cards/Card";
import type { Game } from "../../state/Game";
import type { PlayerState } from "../../state/PlayerState";
import { CardKind, CardZone } from "../../values/enums";

// Practice-grade Card subclasses used by the Rivals decks. The rules
// text is NOT enforced — each card is playable whenever the engine's
// structural preconditions are met (in hand, fighter is alive, etc.).

// Objective: scores automatically in the end phase for its glory value.
export class GenericObjectiveCard extends Card {
  constructor(id: string, owner: PlayerState, name: string, text: string, gloryValue: number, zone: CardZone) {
    super(id, owner, CardKind.Objective, name, text, gloryValue, zone);
  }

  override getLegalTargets(game: Game): Target[] {
    if (this.zone !== CardZone.ObjectiveHand) return [];
    if (game.phase !== "end") return [];
    return [this.owner];
  }
}

// Ploy: untargeted, just discards. For reaction-timing ploys that
// can't fire during the power step.
export class GenericPloyCard extends Card {
  constructor(id: string, owner: PlayerState, name: string, text: string, zone: CardZone) {
    super(id, owner, CardKind.Ploy, name, text, 0, zone);
  }

  override getLegalTargets(game: Game): Target[] {
    if (this.zone !== CardZone.PowerHand) return [];
    if (game.turnStep !== "power") return [];
    return [this.owner];
  }
}

// Upgrade: attaches to any living on-board friendly fighter.
export class GenericUpgradeCard extends Card {
  constructor(id: string, owner: PlayerState, name: string, text: string, gloryValue: number, zone: CardZone) {
    super(id, owner, CardKind.Upgrade, name, text, gloryValue, zone);
  }

  override getLegalTargets(game: Game): Target[] {
    if (this.zone !== CardZone.PowerHand) return [];
    if (game.turnStep !== "power") return [];
    if (this.owner.glory < this.gloryValue) return [];
    return this.owner.fighters.filter((f) => !f.isSlain && f.currentHexId !== null);
  }
}

// Card factory helpers for deck definitions.
export function objectiveCardFactory(
  name: string,
  text: string,
  gloryValue: number,
): CardFactory {
  return (id, owner, zone) => new GenericObjectiveCard(id, owner, name, text, gloryValue, zone);
}

export function ployCardFactory(
  name: string,
  text: string,
): CardFactory {
  return (id, owner, zone) => new GenericPloyCard(id, owner, name, text, zone);
}

export function upgradeCardFactory(
  name: string,
  text: string,
  gloryValue: number,
): CardFactory {
  return (id, owner, zone) => new GenericUpgradeCard(id, owner, name, text, gloryValue, zone);
}
