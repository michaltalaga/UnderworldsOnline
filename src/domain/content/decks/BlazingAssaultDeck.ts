import { CardDefinition } from "../../definitions/CardDefinition";
import { DeckDefinition } from "../../definitions/DeckDefinition";
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

const ploys: readonly CardDefinition[] = [
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
    "BL15",
    "Lure of Battle",
    "Pick a friendly fighter within 2 hexes of another fighter. Push the other fighter 1 hex closer.",
  ),
  buildPloy("BL16", "Sidestep", "Pick a friendly fighter. Push that fighter 1 hex."),
  buildPloy(
    "BL17",
    "Commanding Stride",
    "Push your leader up to 3 hexes. Push must end in a starting hex.",
  ),
  buildPloy(
    "BL18",
    "Illusory Fighter (Restricted)",
    "Pick a friendly fighter. Remove from battlefield, then place in an empty starting hex in friendly territory.",
  ),
  buildPloy(
    "BL19",
    "Wings of War",
    "Play after picking a fighter to Move. That fighter gains +2 Move for that Move.",
  ),
  buildPloy("BL20", "Shields Up!", "Pick a friendly fighter. Give that fighter a Guard token."),
  buildPloy(
    "BL21",
    "Scream of Anger",
    "Pick a friendly fighter. Inflict 2 damage and remove 1 Move or Charge token.",
  ),
  buildPloy(
    "BL22",
    "Healing Potion",
    "Pick a friendly fighter. Heal that fighter (if underdog, roll Save for possible second heal).",
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
