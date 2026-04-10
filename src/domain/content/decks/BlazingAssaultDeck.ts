import { Card, type CardFactory, type Target } from "../../cards/Card";
import { DeckDefinition } from "../../definitions/DeckDefinition";
import { FighterState } from "../../state/FighterState";
import type { Game } from "../../state/Game";
import type { PlayerState } from "../../state/PlayerState";
import { CardKind, CardZone, HexKind } from "../../values/enums";
import {
  objectiveCardFactory,
  ployCardFactory,
  upgradeCardFactory,
} from "./genericPracticeCards";

// Source: Warhammer Underworlds — Blazing Assault Rivals deck.

const objectives: readonly CardFactory[] = [
  objectiveCardFactory("Strike the Head", "Score this immediately after an enemy fighter is slain by a friendly fighter if the target was a leader or had Health ≥ attacker's.", 1),
  objectiveCardFactory("Branching Fate", "Score after an Attack roll with 3+ dice of different symbols (2+ if underdog).", 1),
  objectiveCardFactory("Perfect Strike", "Score immediately after an Attack roll if all results were successes.", 1),
  objectiveCardFactory("Critical Effort", "Score immediately after an Attack roll if any result was a critical success.", 1),
  objectiveCardFactory("Get Stuck In", "Score after a friendly fighter's Attack if the target was in enemy territory.", 1),
  objectiveCardFactory("Strong Start", "Score after an enemy fighter is slain if it was the first fighter slain this combat phase.", 1),
  objectiveCardFactory("Keep Choppin'", "Score in an end phase if your warband Attacked 3+ times this combat phase.", 1),
  objectiveCardFactory("Fields of Blood", "Score in an end phase if 4+ fighters are damaged and/or slain.", 1),
  objectiveCardFactory("Go All Out", "Score in an end phase if 5+ fighters have Move and/or Charge tokens.", 1),
  objectiveCardFactory("On the Edge", "Score in an end phase if any enemy fighters are vulnerable.", 1),
  objectiveCardFactory("Denial", "Score in an end phase if no enemy fighters are in friendly territory.", 1),
  objectiveCardFactory("Annihilation", "Score in an end phase if each enemy fighter is slain.", 5),
];

// --- Targeted ploy effect functions ---

type FriendlyPloyEffect = (game: Game, player: PlayerState, fighter: FighterState) => string;

function giveGuardToken(_game: Game, _player: PlayerState, fighter: FighterState): string {
  fighter.hasGuardToken = true;
  return `gave Guard token to ${fighter.id}`;
}

function healFighter(_game: Game, _player: PlayerState, fighter: FighterState): string {
  if (fighter.damage > 0) {
    fighter.damage -= 1;
  }
  return `healed ${fighter.id} for 1 damage`;
}

function screamOfAnger(_game: Game, _player: PlayerState, fighter: FighterState): string {
  fighter.damage += 2;
  if (fighter.hasMoveToken) {
    fighter.hasMoveToken = false;
  } else if (fighter.hasChargeToken) {
    fighter.hasChargeToken = false;
  }
  return `inflicted 2 damage on ${fighter.id} and removed a token`;
}

function pushFighterOneHex(game: Game, _player: PlayerState, fighter: FighterState): string {
  if (fighter.currentHexId === null) {
    return `${fighter.id} is not on the board`;
  }
  const originHex = game.board.getHex(fighter.currentHexId);
  if (originHex === undefined) {
    return `${fighter.id} hex not found`;
  }
  const neighbors = game.board.getNeighbors(originHex);
  const emptyNeighbors = neighbors.filter(
    (hex) => hex.occupantFighterId === null && hex.kind !== HexKind.Blocked,
  );
  if (emptyNeighbors.length === 0) {
    return `${fighter.id} could not be pushed (no empty adjacent hex)`;
  }
  const destination = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
  originHex.occupantFighterId = null;
  destination.occupantFighterId = fighter.id;
  fighter.currentHexId = destination.id;
  return `pushed ${fighter.id} to ${destination.id}`;
}

function pushFighterTwoHexes(game: Game, player: PlayerState, fighter: FighterState): string {
  const first = pushFighterOneHex(game, player, fighter);
  const second = pushFighterOneHex(game, player, fighter);
  return `${first}; ${second}`;
}

// --- TargetedFriendlyPloyCard ---
// A ploy that targets a single friendly alive on-board fighter.
// The effect callback runs against the chosen target.

class TargetedFriendlyPloyCard extends Card {
  private readonly apply: FriendlyPloyEffect;

  constructor(id: string, owner: PlayerState, name: string, text: string, zone: CardZone, apply: FriendlyPloyEffect) {
    super(id, owner, CardKind.Ploy, name, text, 0, zone);
    this.apply = apply;
  }

  override getLegalTargets(game: Game): Target[] {
    if (this.zone !== CardZone.PowerHand) return [];
    if (game.turnStep !== "power") return [];
    return this.owner.fighters.filter((f) => !f.isSlain && f.currentHexId !== null);
  }

  // Engine calls this after handling zone transition (hand → discard).
  override applyEffect(game: Game, target: Target | null): string[] {
    if (target === null || !(target instanceof FighterState)) {
      return [];
    }
    return [this.apply(game, this.owner, target)];
  }
}

function targetedFriendlyPloyFactory(
  name: string,
  text: string,
  apply: FriendlyPloyEffect,
): CardFactory {
  return (id, owner, zone) => new TargetedFriendlyPloyCard(id, owner, name, text, zone, apply);
}

const ploys: readonly CardFactory[] = [
  // Reaction-timing ploys — no-op discard for now
  ployCardFactory("Determined Effort", "Play after picking a weapon for an Attack. That weapon gains +1 Attack dice (+2 if underdog)."),
  ployCardFactory("Twist the Knife", "Play after picking a melee weapon for an Attack. That weapon gains Grievous for that Attack."),
  // Targeted ploys with real effects
  targetedFriendlyPloyFactory("Wings of War", "Pick a friendly fighter. Push that fighter 2 hexes.", pushFighterTwoHexes),
  targetedFriendlyPloyFactory("Sidestep", "Pick a friendly fighter. Push that fighter 1 hex.", pushFighterOneHex),
  targetedFriendlyPloyFactory("Shields Up!", "Pick a friendly fighter. Give that fighter a Guard token.", giveGuardToken),
  targetedFriendlyPloyFactory("Healing Potion", "Pick a friendly fighter. Heal that fighter.", healFighter),
  targetedFriendlyPloyFactory("Scream of Anger", "Pick a friendly fighter. Inflict 2 damage and remove 1 Move or Charge token.", screamOfAnger),
  targetedFriendlyPloyFactory("Lure of Battle", "Pick a friendly fighter within 2 hexes of another fighter. Push the other fighter 1 hex closer.", pushFighterOneHex),
  targetedFriendlyPloyFactory("Commanding Stride", "Push your leader up to 3 hexes. Push must end in a starting hex.", pushFighterOneHex),
  targetedFriendlyPloyFactory("Illusory Fighter (Restricted)", "Pick a friendly fighter. Remove from battlefield, then place in an empty starting hex in friendly territory.", pushFighterOneHex),
];

const upgrades: readonly CardFactory[] = [
  upgradeCardFactory("Brawler", "This fighter cannot be Flanked or Surrounded.", 1),
  upgradeCardFactory("Hidden Aid", "Enemy fighters adjacent to this fighter are Flanked.", 1),
  upgradeCardFactory("Accurate", "After an Attack roll, immediately re-roll 1 Attack die.", 1),
  upgradeCardFactory("Great Strength", "This fighter's melee weapons have Grievous.", 2),
  upgradeCardFactory("Deadly Aim", "This fighter's weapons have Ensnare.", 1),
  upgradeCardFactory("Sharpened Points", "This fighter's weapons have Cleave.", 1),
  upgradeCardFactory("Duellist", "Immediately after this fighter Attacks, push this fighter 1 hex.", 1),
  upgradeCardFactory("Tough", "No more than 3 damage can be inflicted on this fighter in the same turn.", 2),
  upgradeCardFactory("Great Fortitude", "This fighter has +1 Health.", 2),
  upgradeCardFactory("Keen Eye", "This fighter's melee weapons have +1 Attack dice.", 2),
];

export const blazingAssaultDeck = new DeckDefinition(
  "deck-def:rivals:blazing-assault",
  "Blazing Assault Rivals Deck",
  objectives,
  [...ploys, ...upgrades],
);
