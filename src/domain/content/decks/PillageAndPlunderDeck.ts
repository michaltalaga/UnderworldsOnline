import { CardDefinition } from "../../definitions/CardDefinition";
import { DeckDefinition } from "../../definitions/DeckDefinition";
import { CardKind } from "../../values/enums";

// Source: Warhammer Underworlds — Pillage and Plunder Rivals deck.
// https://www.underworldsdb.com/shared.php?deck=0,PL1..PL32&format=rivals
//
// NOTE ON SCOPE: Card metadata only. Each card carries the official name, full
// rules text, and glory value, but inherits the base `CardDefinition.canPlay`
// which always returns false. The cards therefore live in the deck for setup,
// muster, and shuffling, but cannot yet be played until each effect is
// implemented in the engine.

const objectives: readonly CardDefinition[] = [
  buildObjective(
    "PL1",
    "Broken Prospects",
    2,
    "Score this in an end phase if 3 or more different treasure tokens were Delved by your warband " +
      "this battle round or if a treasure token held by an enemy fighter at the start of the battle round " +
      "was Delved by your warband this battle round.",
  ),
  buildObjective(
    "PL2",
    "Against the Odds",
    1,
    "Score this in an end phase if an odd-numbered treasure token was Delved by your warband this battle round.",
  ),
  buildObjective(
    "PL3",
    "Lost in the Depths",
    1,
    "Score this in an end phase if no friendly fighters are adjacent and any friendly fighters are not slain.",
  ),
  buildObjective(
    "PL4",
    "Desolate Homeland",
    1,
    "Score this in an end phase if there are 1 or fewer treasure tokens in friendly territory.",
  ),
  buildObjective(
    "PL5",
    "Torn Landscape",
    2,
    "Score this in an end phase if there are 2 or fewer treasure tokens on the battlefield.",
  ),
  buildObjective(
    "PL6",
    "Strip the Realm",
    3,
    "Score this in an end phase if there are no treasure tokens on the battlefield or if no enemy fighters " +
      "hold any treasure tokens.",
  ),
  buildObjective(
    "PL7",
    "Aggressive Claimant",
    1,
    "Score this immediately after a friendly fighter's successful Attack if the target was in neutral " +
      "territory, or the target was holding a treasure token when you picked them to be the target of that " +
      "Attack and is no longer holding that treasure token.",
  ),
  buildObjective(
    "PL8",
    "Claim the Prize (Restricted)",
    1,
    "Score this immediately after a friendly fighter Delves in enemy territory. If you are the underdog, " +
      "that Delve can be in friendly territory instead.",
  ),
  buildObjective(
    "PL9",
    "Delving for Wealth (Restricted)",
    1,
    "Score this immediately after your warband Delves for the third or subsequent time this combat phase.",
  ),
  buildObjective(
    "PL10",
    "Share the Load",
    1,
    "Score this immediately after a friendly fighter Moves, if that fighter and any other friendly " +
      "fighters are each on feature tokens.",
  ),
  buildObjective(
    "PL11",
    "Hostile Takeover",
    1,
    "Score this immediately after the second or subsequent Attack made by your warband that was not part of a Charge.",
  ),
  buildObjective(
    "PL12",
    "Careful Survey",
    1,
    "Score this immediately after an Action step if there is a friendly fighter in each territory.",
  ),
];

const ploys: readonly CardDefinition[] = [
  buildPloy("PL13", "Sidestep", "Pick a friendly fighter. Push that fighter 1 hex."),
  buildPloy(
    "PL14",
    "Prideful Duellist",
    "Play this immediately after a friendly fighter's Attack if the attacker is in enemy territory. Heal the attacker.",
  ),
  buildPloy(
    "PL15",
    "Commanding Stride",
    "Push your leader up to 3 hexes. That push must end in a starting hex.",
  ),
  buildPloy(
    "PL16",
    "Crumbling Mine",
    "Pick a treasure token that is not held. Flip that treasure token.",
  ),
  buildPloy(
    "PL17",
    "Explosive Charges",
    "Domain: Friendly fighters have +1 Move while using Charge abilities. This effect persists until the end " +
      "of the battle round or until another Domain card is played.",
  ),
  buildPloy(
    "PL18",
    "Wary Delver",
    "Pick a friendly fighter with any Charge tokens. Give that fighter a Guard token.",
  ),
  buildPloy(
    "PL19",
    "Brash Scout",
    "Play this immediately after you make an Attack roll for a fighter in enemy territory. Re-roll 1 dice in " +
      "that Attack roll. If you are the underdog, you can re-roll each dice instead.",
  ),
  buildPloy(
    "PL20",
    "Sudden Blast",
    "Pick an enemy fighter adjacent to a friendly fighter. Give that enemy fighter a Stagger token.",
  ),
  buildPloy(
    "PL21",
    "Tunnelling Terror",
    "Pick a friendly fighter with no Move or Charge tokens. Remove that fighter from the battlefield, and " +
      "then place that fighter in an empty stagger hex. Then, give that fighter a Charge token. If you are " +
      "the underdog, give a Move token instead.",
  ),
  buildPloy(
    "PL22",
    "Trapped Cache",
    "Pick an undamaged enemy fighter within 1 hex of a treasure token. Inflict 1 damage on that fighter.",
  ),
];

const upgrades: readonly CardDefinition[] = [
  buildUpgrade("PL23", "Great Speed", 0, "This fighter has +1 Move."),
  buildUpgrade(
    "PL24",
    "Swift Step",
    1,
    "Quick: Immediately after this fighter has Charged, you can push this fighter 1 hex.",
  ),
  buildUpgrade(
    "PL25",
    "Burrowing Strike",
    1,
    "Melee Attack (2 hex, Fury 2, 2 damage). This weapon has +1 Attack dice while this fighter has any " +
      "Stagger tokens or is on a feature token.",
  ),
  buildUpgrade(
    "PL26",
    "Tough Enough",
    1,
    "While this fighter is in enemy territory, Save rolls for this fighter cannot be affected by Cleave and Ensnare.",
  ),
  buildUpgrade(
    "PL27",
    "Canny Sapper",
    0,
    "Sneaky: Immediately after you play a Ploy in a Power step, you can remove this fighter from the battlefield. " +
      "Place this fighter in an empty stagger hex or starting hex in friendly territory, then discard this card.",
  ),
  buildUpgrade(
    "PL28",
    "Impossibly Quick",
    1,
    "This fighter has +1 Save. Immediately discard this Upgrade after an enemy fighter's failed Attack if " +
      "this fighter was the target.",
  ),
  buildUpgrade("PL29", "Linebreaker", 1, "This fighter's weapons have Brutal."),
  buildUpgrade(
    "PL30",
    "Excavating Blast",
    1,
    "Ranged Attack (3 hex, Smash 2, 1 damage). This weapon has Stagger while this fighter is in enemy territory.",
  ),
  buildUpgrade(
    "PL31",
    "Gloryseeker",
    1,
    "This fighter's melee weapons have Grievous if the target has a Health characteristic of 4 or more.",
  ),
  buildUpgrade(
    "PL32",
    "Frenzy of Greed",
    2,
    "While this fighter is on a treasure token in enemy territory or is in a stagger hex, Save rolls for " +
      "this fighter are not affected by Cleave and Ensnare and this fighter cannot be given Stagger tokens.",
  ),
];

export const pillageAndPlunderDeck = new DeckDefinition(
  "deck-def:rivals:pillage-and-plunder",
  "Pillage and Plunder Rivals Deck",
  objectives,
  [...ploys, ...upgrades],
);

function buildObjective(
  code: string,
  name: string,
  glory: number,
  text: string,
): CardDefinition {
  return new CardDefinition(
    `card-def:rivals:pillage-and-plunder:${code}`,
    CardKind.Objective,
    name,
    text,
    glory,
  );
}

function buildPloy(code: string, name: string, text: string): CardDefinition {
  return new CardDefinition(
    `card-def:rivals:pillage-and-plunder:${code}`,
    CardKind.Ploy,
    name,
    text,
    0,
  );
}

function buildUpgrade(
  code: string,
  name: string,
  glory: number,
  text: string,
): CardDefinition {
  return new CardDefinition(
    `card-def:rivals:pillage-and-plunder:${code}`,
    CardKind.Upgrade,
    name,
    text,
    glory,
  );
}
