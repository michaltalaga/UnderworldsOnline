import { asFactory, type CardFactory } from "../../cards/Card";
import { DeckDefinition } from "../../definitions/DeckDefinition";
import {
  BrokenProspects, AgainstTheOdds, LostInTheDepths, DesolateHomeland,
  TornLandscape, StripTheRealm, AggressiveClaimant, ClaimThePrize,
  DelvingForWealth, ShareTheLoad, HostileTakeover, CarefulSurvey,
  PillageSidestep, PridefulDuellist, PillageCommandingStride, CrumblingMine,
  ExplosiveCharges, WaryDelver, BrashScout, SuddenBlast,
  TunnellingTerror, TrappedCache,
  GreatSpeed, SwiftStep, BurrowingStrike, ToughEnough,
  CannySapper, ImpossiblyQuick, Linebreaker, ExcavatingBlast,
  Gloryseeker, FrenzyOfGreed,
} from "../cards/PillageAndPlunderCards";

// Source: Warhammer Underworlds — Pillage and Plunder Rivals deck.

const objectives: readonly CardFactory[] = [
  asFactory(BrokenProspects),
  asFactory(AgainstTheOdds),
  asFactory(LostInTheDepths),
  asFactory(DesolateHomeland),
  asFactory(TornLandscape),
  asFactory(StripTheRealm),
  asFactory(AggressiveClaimant),
  asFactory(ClaimThePrize),
  asFactory(DelvingForWealth),
  asFactory(ShareTheLoad),
  asFactory(HostileTakeover),
  asFactory(CarefulSurvey),
];

const ploys: readonly CardFactory[] = [
  asFactory(PillageSidestep),
  asFactory(PridefulDuellist),
  asFactory(PillageCommandingStride),
  asFactory(CrumblingMine),
  asFactory(ExplosiveCharges),
  asFactory(WaryDelver),
  asFactory(BrashScout),
  asFactory(SuddenBlast),
  asFactory(TunnellingTerror),
  asFactory(TrappedCache),
];

const upgrades: readonly CardFactory[] = [
  asFactory(GreatSpeed),
  asFactory(SwiftStep),
  asFactory(BurrowingStrike),
  asFactory(ToughEnough),
  asFactory(CannySapper),
  asFactory(ImpossiblyQuick),
  asFactory(Linebreaker),
  asFactory(ExcavatingBlast),
  asFactory(Gloryseeker),
  asFactory(FrenzyOfGreed),
];

export const pillageAndPlunderDeck = new DeckDefinition(
  "deck-def:rivals:pillage-and-plunder",
  "Pillage and Plunder Rivals Deck",
  objectives,
  [...ploys, ...upgrades],
);
