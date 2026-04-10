import type { CardFactory } from "../../cards/Card";
import { DeckDefinition } from "../../definitions/DeckDefinition";
import {
  objectiveCardFactory,
  ployCardFactory,
  upgradeCardFactory,
} from "./genericPracticeCards";

// Source: Warhammer Underworlds — Pillage and Plunder Rivals deck.
// Rules text is NOT enforced by the engine.

const objectives: readonly CardFactory[] = [
  objectiveCardFactory("Broken Prospects", "Score this in an end phase if 3 or more different treasure tokens were Delved by your warband this battle round or if a treasure token held by an enemy fighter at the start of the battle round was Delved by your warband this battle round.", 2),
  objectiveCardFactory("Against the Odds", "Score this in an end phase if an odd-numbered treasure token was Delved by your warband this battle round.", 1),
  objectiveCardFactory("Lost in the Depths", "Score this in an end phase if no friendly fighters are adjacent and any friendly fighters are not slain.", 1),
  objectiveCardFactory("Desolate Homeland", "Score this in an end phase if there are 1 or fewer treasure tokens in friendly territory.", 1),
  objectiveCardFactory("Torn Landscape", "Score this in an end phase if there are 2 or fewer treasure tokens on the battlefield.", 2),
  objectiveCardFactory("Strip the Realm", "Score this in an end phase if there are no treasure tokens on the battlefield or if no enemy fighters hold any treasure tokens.", 3),
  objectiveCardFactory("Aggressive Claimant", "Score this immediately after a friendly fighter's successful Attack if the target was in neutral territory.", 1),
  objectiveCardFactory("Claim the Prize (Restricted)", "Score this immediately after a friendly fighter Delves in enemy territory.", 1),
  objectiveCardFactory("Delving for Wealth (Restricted)", "Score this immediately after your warband Delves for the third or subsequent time this combat phase.", 1),
  objectiveCardFactory("Share the Load", "Score this immediately after a friendly fighter Moves, if that fighter and any other friendly fighters are each on feature tokens.", 1),
  objectiveCardFactory("Hostile Takeover", "Score this immediately after the second or subsequent Attack made by your warband that was not part of a Charge.", 1),
  objectiveCardFactory("Careful Survey", "Score this immediately after an Action step if there is a friendly fighter in each territory.", 1),
];

const ploys: readonly CardFactory[] = [
  ployCardFactory("Sidestep", "Pick a friendly fighter. Push that fighter 1 hex."),
  ployCardFactory("Prideful Duellist", "Play this immediately after a friendly fighter's Attack if the attacker is in enemy territory. Heal the attacker."),
  ployCardFactory("Commanding Stride", "Push your leader up to 3 hexes. That push must end in a starting hex."),
  ployCardFactory("Crumbling Mine", "Pick a treasure token that is not held. Flip that treasure token."),
  ployCardFactory("Explosive Charges", "Domain: Friendly fighters have +1 Move while using Charge abilities."),
  ployCardFactory("Wary Delver", "Pick a friendly fighter with any Charge tokens. Give that fighter a Guard token."),
  ployCardFactory("Brash Scout", "Play this immediately after you make an Attack roll for a fighter in enemy territory. Re-roll 1 dice."),
  ployCardFactory("Sudden Blast", "Pick an enemy fighter adjacent to a friendly fighter. Give that enemy fighter a Stagger token."),
  ployCardFactory("Tunnelling Terror", "Pick a friendly fighter with no Move or Charge tokens. Remove, place in empty stagger hex, give Charge token."),
  ployCardFactory("Trapped Cache", "Pick an undamaged enemy fighter within 1 hex of a treasure token. Inflict 1 damage on that fighter."),
];

const upgrades: readonly CardFactory[] = [
  upgradeCardFactory("Great Speed", "This fighter has +1 Move.", 0),
  upgradeCardFactory("Swift Step", "Quick: Immediately after this fighter has Charged, you can push this fighter 1 hex.", 1),
  upgradeCardFactory("Burrowing Strike", "Melee Attack (2 hex, Fury 2, 2 damage). +1 Attack dice while on a feature token.", 1),
  upgradeCardFactory("Tough Enough", "While in enemy territory, Save rolls not affected by Cleave and Ensnare.", 1),
  upgradeCardFactory("Canny Sapper", "Sneaky: After playing a Ploy, remove and place in empty stagger hex or starting hex in friendly territory.", 0),
  upgradeCardFactory("Impossibly Quick", "This fighter has +1 Save. Discard after enemy's failed Attack.", 1),
  upgradeCardFactory("Linebreaker", "This fighter's weapons have Brutal.", 1),
  upgradeCardFactory("Excavating Blast", "Ranged Attack (3 hex, Smash 2, 1 damage). Stagger while in enemy territory.", 1),
  upgradeCardFactory("Gloryseeker", "This fighter's melee weapons have Grievous if target Health 4+.", 1),
  upgradeCardFactory("Frenzy of Greed", "While on treasure token in enemy territory or stagger hex, Save not affected by Cleave/Ensnare.", 2),
];

export const pillageAndPlunderDeck = new DeckDefinition(
  "deck-def:rivals:pillage-and-plunder",
  "Pillage and Plunder Rivals Deck",
  objectives,
  [...ploys, ...upgrades],
);
