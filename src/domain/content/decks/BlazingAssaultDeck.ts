import { CardDefinition, type CardPlayContext } from "../../definitions/CardDefinition";
import { DeckDefinition } from "../../definitions/DeckDefinition";
import type { CardInstance } from "../../state/CardInstance";
import type { Game } from "../../state/Game";
import type { GameEventLogState } from "../../state/GameEventLogState";
import type { PlayerState } from "../../state/PlayerState";
import { CardKind, CardZone, HexKind } from "../../values/enums";
import {
  GenericPracticeObjectiveCardDefinition,
  GenericPracticePloyCardDefinition,
  GenericPracticeUpgradeCardDefinition,
} from "./genericPracticeCardDefinitions";

// Source: Warhammer Underworlds — Blazing Assault Rivals deck.
// https://www.underworldsdb.com/shared.php?deck=0,BL1..BL32&format=rivals
//
// NOTE ON SCOPE: Card metadata only — the rules text on each card is
// NOT enforced by the engine. The cards use the generic practice
// subclasses so they're playable end-to-end (objectives score at end
// phase for their glory value, ploys discard on play, upgrades attach
// to a fighter and pay glory) without the literal rules text firing.

const objectives: readonly CardDefinition[] = [
  buildObjective(
    "BL1",
    "Strike the Head",
    1,
    "Score this immediately after an enemy fighter is slain by a friendly fighter " +
      "if the target was a leader or had Health \u2265 attacker's.",
  ),
  buildObjective(
    "BL2",
    "Branching Fate",
    1,
    "Score after an Attack roll with 3+ dice of different symbols (2+ if underdog).",
  ),
  buildObjective(
    "BL3",
    "Perfect Strike",
    1,
    "Score immediately after an Attack roll if all results were successes.",
  ),
  buildObjective(
    "BL4",
    "Critical Effort",
    1,
    "Score immediately after an Attack roll if any result was a critical success.",
  ),
  buildObjective(
    "BL5",
    "Get Stuck In",
    1,
    "Score after a friendly fighter's Attack if the target was in enemy territory.",
  ),
  buildObjective(
    "BL6",
    "Strong Start",
    1,
    "Score after an enemy fighter is slain if it was the first fighter slain this combat phase.",
  ),
  buildObjective(
    "BL7",
    "Keep Choppin'",
    1,
    "Score in an end phase if your warband Attacked 3+ times this combat phase.",
  ),
  buildObjective(
    "BL8",
    "Fields of Blood",
    1,
    "Score in an end phase if 4+ fighters are damaged and/or slain.",
  ),
  buildObjective(
    "BL9",
    "Go All Out",
    1,
    "Score in an end phase if 5+ fighters have Move and/or Charge tokens.",
  ),
  buildObjective(
    "BL10",
    "On the Edge",
    1,
    "Score in an end phase if any enemy fighters are vulnerable.",
  ),
  buildObjective(
    "BL11",
    "Denial",
    1,
    "Score in an end phase if no enemy fighters are in friendly territory.",
  ),
  buildObjective(
    "BL12",
    "Annihilation",
    5,
    "Score in an end phase if each enemy fighter is slain.",
  ),
];

// A ploy that targets a single friendly fighter. The user picks the
// fighter via the power overlay's per-fighter option list. When played,
// it calls an `apply` callback that carries out the actual game effect
// (give guard token, heal, push, etc.) then discards the card.
type TargetedFriendlyEffect = (game: Game, player: PlayerState, fighterId: string) => string;

class TargetedFriendlyPloy extends CardDefinition {
  private readonly apply: TargetedFriendlyEffect;

  public constructor(code: string, name: string, text: string, apply: TargetedFriendlyEffect) {
    super(`card-def:rivals:blazing-assault:${code}`, CardKind.Ploy, name, text, 0);
    this.apply = apply;
  }

  public override canPlay(
    _game: Game,
    _world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): boolean {
    const targetFighterId = context.targetFighterId ?? null;
    if (card.zone !== CardZone.PowerHand || targetFighterId === null) {
      return false;
    }
    const fighter = player.getFighter(targetFighterId);
    return fighter !== undefined && !fighter.isSlain && fighter.currentHexId !== null;
  }

  public override play(
    game: Game,
    _world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): string[] {
    const targetFighterId = context.targetFighterId ?? null;
    if (targetFighterId === null) {
      throw new Error(`${this.name} requires a target fighter.`);
    }
    const description = this.apply(game, player, targetFighterId);
    discardPloyCard(player, card);
    return [description];
  }
}

function discardPloyCard(player: PlayerState, card: CardInstance): void {
  const handIndex = player.powerHand.findIndex((c) => c.id === card.id);
  if (handIndex === -1) {
    throw new Error(`Could not find ploy ${card.id} in ${player.name}'s power hand.`);
  }
  player.powerHand.splice(handIndex, 1);
  card.zone = CardZone.PowerDiscard;
  card.attachedToFighterId = null;
  card.revealed = true;
  player.powerDeck.discardPile.push(card);
}

function giveGuardToken(_game: Game, player: PlayerState, fighterId: string): string {
  const fighter = player.getFighter(fighterId);
  if (fighter === undefined) {
    throw new Error(`Fighter ${fighterId} not found.`);
  }
  fighter.hasGuardToken = true;
  return `gave Guard token to ${fighterId}`;
}

function healFighter(_game: Game, player: PlayerState, fighterId: string): string {
  const fighter = player.getFighter(fighterId);
  if (fighter === undefined) {
    throw new Error(`Fighter ${fighterId} not found.`);
  }
  if (fighter.damage > 0) {
    fighter.damage -= 1;
  }
  return `healed ${fighterId} for 1 damage`;
}

function screamOfAnger(_game: Game, player: PlayerState, fighterId: string): string {
  const fighter = player.getFighter(fighterId);
  if (fighter === undefined) {
    throw new Error(`Fighter ${fighterId} not found.`);
  }
  fighter.damage += 2;
  if (fighter.hasMoveToken) {
    fighter.hasMoveToken = false;
  } else if (fighter.hasChargeToken) {
    fighter.hasChargeToken = false;
  }
  return `inflicted 2 damage on ${fighterId} and removed a token`;
}

function pushFighterOneHex(game: Game, player: PlayerState, fighterId: string): string {
  const fighter = player.getFighter(fighterId);
  if (fighter === undefined || fighter.currentHexId === null) {
    throw new Error(`Fighter ${fighterId} not found or not on board.`);
  }
  const originHex = game.board.getHex(fighter.currentHexId);
  if (originHex === undefined) {
    throw new Error(`Hex ${fighter.currentHexId} not found.`);
  }
  const neighbors = game.board.getNeighbors(originHex);
  const emptyNeighbors = neighbors.filter(
    (hex) => hex.occupantFighterId === null && hex.kind !== HexKind.Blocked,
  );
  if (emptyNeighbors.length === 0) {
    return `${fighterId} could not be pushed (no empty adjacent hex)`;
  }
  const destination = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
  originHex.occupantFighterId = null;
  destination.occupantFighterId = fighter.id;
  fighter.currentHexId = destination.id;
  return `pushed ${fighterId} to ${destination.id}`;
}

const ploys: readonly CardDefinition[] = [
  // Reaction-timing ploys — fire mid-action, not yet implementable.
  // Kept as generic no-op (discard only).
  buildPloy(
    "BL13",
    "Determined Effort",
    "Play after picking a weapon for an Attack. That weapon gains +1 Attack dice (+2 if underdog).",
  ),
  buildPloy(
    "BL14",
    "Twist the Knife",
    "Play after picking a melee weapon for an Attack. That weapon gains Grievous for that Attack.",
  ),
  buildPloy(
    "BL19",
    "Wings of War",
    "Play after picking a fighter to Move. That fighter gains +2 Move for that Move.",
  ),
  // Targeted ploys with real effects:
  new TargetedFriendlyPloy(
    "BL16",
    "Sidestep",
    "Pick a friendly fighter. Push that fighter 1 hex.",
    pushFighterOneHex,
  ),
  new TargetedFriendlyPloy(
    "BL20",
    "Shields Up!",
    "Pick a friendly fighter. Give that fighter a Guard token.",
    giveGuardToken,
  ),
  new TargetedFriendlyPloy(
    "BL22",
    "Healing Potion",
    "Pick a friendly fighter. Heal that fighter.",
    healFighter,
  ),
  new TargetedFriendlyPloy(
    "BL21",
    "Scream of Anger",
    "Pick a friendly fighter. Inflict 2 damage and remove 1 Move or Charge token.",
    screamOfAnger,
  ),
  new TargetedFriendlyPloy(
    "BL15",
    "Lure of Battle",
    "Pick a friendly fighter within 2 hexes of another fighter. Push the other fighter 1 hex closer.",
    pushFighterOneHex,
  ),
  new TargetedFriendlyPloy(
    "BL17",
    "Commanding Stride",
    "Push your leader up to 3 hexes. Push must end in a starting hex.",
    pushFighterOneHex,
  ),
  new TargetedFriendlyPloy(
    "BL18",
    "Illusory Fighter (Restricted)",
    "Pick a friendly fighter. Remove from battlefield, then place in an empty starting hex in friendly territory.",
    pushFighterOneHex,
  ),
];

const upgrades: readonly CardDefinition[] = [
  buildUpgrade("BL23", "Brawler", 1, "This fighter cannot be Flanked or Surrounded."),
  buildUpgrade("BL24", "Hidden Aid", 1, "Enemy fighters adjacent to this fighter are Flanked."),
  buildUpgrade(
    "BL25",
    "Accurate",
    1,
    "After an Attack roll, immediately re-roll 1 Attack die.",
  ),
  buildUpgrade("BL26", "Great Strength", 2, "This fighter's melee weapons have Grievous."),
  buildUpgrade("BL27", "Deadly Aim", 1, "This fighter's weapons have Ensnare."),
  buildUpgrade("BL28", "Sharpened Points", 1, "This fighter's weapons have Cleave."),
  buildUpgrade(
    "BL29",
    "Duellist",
    1,
    "Immediately after this fighter Attacks, push this fighter 1 hex.",
  ),
  buildUpgrade(
    "BL30",
    "Tough",
    2,
    "No more than 3 damage can be inflicted on this fighter in the same turn.",
  ),
  buildUpgrade("BL31", "Great Fortitude", 2, "This fighter has +1 Health."),
  buildUpgrade("BL32", "Keen Eye", 2, "This fighter's melee weapons have +1 Attack dice."),
];

export const blazingAssaultDeck = new DeckDefinition(
  "deck-def:rivals:blazing-assault",
  "Blazing Assault Rivals Deck",
  objectives,
  [...ploys, ...upgrades],
);

function buildObjective(
  code: string,
  name: string,
  glory: number,
  text: string,
): CardDefinition {
  return new GenericPracticeObjectiveCardDefinition(
    `card-def:rivals:blazing-assault:${code}`,
    name,
    text,
    glory,
  );
}

function buildPloy(code: string, name: string, text: string): CardDefinition {
  return new GenericPracticePloyCardDefinition(
    `card-def:rivals:blazing-assault:${code}`,
    name,
    text,
  );
}

function buildUpgrade(
  code: string,
  name: string,
  glory: number,
  text: string,
): CardDefinition {
  return new GenericPracticeUpgradeCardDefinition(
    `card-def:rivals:blazing-assault:${code}`,
    name,
    text,
    glory,
  );
}
