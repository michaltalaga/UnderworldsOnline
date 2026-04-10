import type { PlayerState } from "../../state/PlayerState";
import type { CardZone } from "../../values/enums";
import { ObjectiveCard } from "../../cards/ObjectiveCard";
import { PloyCard } from "../../cards/PloyCard";
import { UpgradeCard } from "../../cards/UpgradeCard";

// Source: Warhammer Underworlds — Pillage and Plunder Rivals deck.
// Rules text is NOT enforced by the engine.

// ─── Objectives ─────────────────────────────────────────────────────────────

export class BrokenProspects extends ObjectiveCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Broken Prospects",
      "Score this in an end phase if 3 or more different treasure tokens were Delved by your warband this battle round or if a treasure token held by an enemy fighter at the start of the battle round was Delved by your warband this battle round.",
      2, zone);
  }
}

export class AgainstTheOdds extends ObjectiveCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Against the Odds",
      "Score this in an end phase if an odd-numbered treasure token was Delved by your warband this battle round.",
      1, zone);
  }
}

export class LostInTheDepths extends ObjectiveCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Lost in the Depths",
      "Score this in an end phase if no friendly fighters are adjacent and any friendly fighters are not slain.",
      1, zone);
  }
}

export class DesolateHomeland extends ObjectiveCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Desolate Homeland",
      "Score this in an end phase if there are 1 or fewer treasure tokens in friendly territory.",
      1, zone);
  }
}

export class TornLandscape extends ObjectiveCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Torn Landscape",
      "Score this in an end phase if there are 2 or fewer treasure tokens on the battlefield.",
      2, zone);
  }
}

export class StripTheRealm extends ObjectiveCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Strip the Realm",
      "Score this in an end phase if there are no treasure tokens on the battlefield or if no enemy fighters hold any treasure tokens.",
      3, zone);
  }
}

export class AggressiveClaimant extends ObjectiveCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Aggressive Claimant",
      "Score this immediately after a friendly fighter's successful Attack if the target was in neutral territory.",
      1, zone);
  }
}

export class ClaimThePrize extends ObjectiveCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Claim the Prize (Restricted)",
      "Score this immediately after a friendly fighter Delves in enemy territory.",
      1, zone);
  }
}

export class DelvingForWealth extends ObjectiveCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Delving for Wealth (Restricted)",
      "Score this immediately after your warband Delves for the third or subsequent time this combat phase.",
      1, zone);
  }
}

export class ShareTheLoad extends ObjectiveCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Share the Load",
      "Score this immediately after a friendly fighter Moves, if that fighter and any other friendly fighters are each on feature tokens.",
      1, zone);
  }
}

export class HostileTakeover extends ObjectiveCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Hostile Takeover",
      "Score this immediately after the second or subsequent Attack made by your warband that was not part of a Charge.",
      1, zone);
  }
}

export class CarefulSurvey extends ObjectiveCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Careful Survey",
      "Score this immediately after an Action step if there is a friendly fighter in each territory.",
      1, zone);
  }
}

// ─── Ploys ──────────────────────────────────────────────────────────────────

export class PillageSidestep extends PloyCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Sidestep",
      "Pick a friendly fighter. Push that fighter 1 hex.", zone);
  }
}

export class PridefulDuellist extends PloyCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Prideful Duellist",
      "Play this immediately after a friendly fighter's Attack if the attacker is in enemy territory. Heal the attacker.", zone);
  }
}

export class PillageCommandingStride extends PloyCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Commanding Stride",
      "Push your leader up to 3 hexes. That push must end in a starting hex.", zone);
  }
}

export class CrumblingMine extends PloyCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Crumbling Mine",
      "Pick a treasure token that is not held. Flip that treasure token.", zone);
  }
}

export class ExplosiveCharges extends PloyCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Explosive Charges",
      "Domain: Friendly fighters have +1 Move while using Charge abilities.", zone);
  }
}

export class WaryDelver extends PloyCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Wary Delver",
      "Pick a friendly fighter with any Charge tokens. Give that fighter a Guard token.", zone);
  }
}

export class BrashScout extends PloyCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Brash Scout",
      "Play this immediately after you make an Attack roll for a fighter in enemy territory. Re-roll 1 dice.", zone);
  }
}

export class SuddenBlast extends PloyCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Sudden Blast",
      "Pick an enemy fighter adjacent to a friendly fighter. Give that enemy fighter a Stagger token.", zone);
  }
}

export class TunnellingTerror extends PloyCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Tunnelling Terror",
      "Pick a friendly fighter with no Move or Charge tokens. Remove, place in empty stagger hex, give Charge token.", zone);
  }
}

export class TrappedCache extends PloyCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Trapped Cache",
      "Pick an undamaged enemy fighter within 1 hex of a treasure token. Inflict 1 damage on that fighter.", zone);
  }
}

// ─── Upgrades ───────────────────────────────────────────────────────────────

export class GreatSpeed extends UpgradeCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Great Speed", "This fighter has +1 Move.", 0, zone);
  }
}

export class SwiftStep extends UpgradeCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Swift Step",
      "Quick: Immediately after this fighter has Charged, you can push this fighter 1 hex.", 1, zone);
  }
}

export class BurrowingStrike extends UpgradeCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Burrowing Strike",
      "Melee Attack (2 hex, Fury 2, 2 damage). +1 Attack dice while on a feature token.", 1, zone);
  }
}

export class ToughEnough extends UpgradeCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Tough Enough",
      "While in enemy territory, Save rolls not affected by Cleave and Ensnare.", 1, zone);
  }
}

export class CannySapper extends UpgradeCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Canny Sapper",
      "Sneaky: After playing a Ploy, remove and place in empty stagger hex or starting hex in friendly territory.", 0, zone);
  }
}

export class ImpossiblyQuick extends UpgradeCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Impossibly Quick",
      "This fighter has +1 Save. Discard after enemy's failed Attack.", 1, zone);
  }
}

export class Linebreaker extends UpgradeCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Linebreaker", "This fighter's weapons have Brutal.", 1, zone);
  }
}

export class ExcavatingBlast extends UpgradeCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Excavating Blast",
      "Ranged Attack (3 hex, Smash 2, 1 damage). Stagger while in enemy territory.", 1, zone);
  }
}

export class Gloryseeker extends UpgradeCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Gloryseeker",
      "This fighter's melee weapons have Grievous if target Health 4+.", 1, zone);
  }
}

export class FrenzyOfGreed extends UpgradeCard {
  constructor(id: string, owner: PlayerState, zone: CardZone) {
    super(id, owner, "Frenzy of Greed",
      "While on treasure token in enemy territory or stagger hex, Save not affected by Cleave/Ensnare.", 2, zone);
  }
}
