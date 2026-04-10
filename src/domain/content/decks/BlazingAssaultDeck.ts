import { asFactory, type CardFactory } from "../../cards/Card";
import { DeckDefinition } from "../../definitions/DeckDefinition";
import {
  StrikeTheHead, BranchingFate, PerfectStrike, CriticalEffort,
  GetStuckIn, StrongStart, KeepChoppin, FieldsOfBlood,
  GoAllOut, OnTheEdge, Denial, Annihilation,
  DeterminedEffort, TwistTheKnife,
  WingsOfWar, Sidestep, ShieldsUp, HealingPotion,
  ScreamOfAnger, LureOfBattle, CommandingStride, IllusoryFighter,
  Brawler, HiddenAid, Accurate, GreatStrength,
  DeadlyAim, SharpenedPoints, Duellist, Tough, GreatFortitude, KeenEye,
} from "../cards/BlazingAssaultCards";

// Source: Warhammer Underworlds — Blazing Assault Rivals deck.

const objectives: readonly CardFactory[] = [
  asFactory(StrikeTheHead),
  asFactory(BranchingFate),
  asFactory(PerfectStrike),
  asFactory(CriticalEffort),
  asFactory(GetStuckIn),
  asFactory(StrongStart),
  asFactory(KeepChoppin),
  asFactory(FieldsOfBlood),
  asFactory(GoAllOut),
  asFactory(OnTheEdge),
  asFactory(Denial),
  asFactory(Annihilation),
];

const ploys: readonly CardFactory[] = [
  asFactory(DeterminedEffort),
  asFactory(TwistTheKnife),
  asFactory(WingsOfWar),
  asFactory(Sidestep),
  asFactory(ShieldsUp),
  asFactory(HealingPotion),
  asFactory(ScreamOfAnger),
  asFactory(LureOfBattle),
  asFactory(CommandingStride),
  asFactory(IllusoryFighter),
];

const upgrades: readonly CardFactory[] = [
  asFactory(Brawler),
  asFactory(HiddenAid),
  asFactory(Accurate),
  asFactory(GreatStrength),
  asFactory(DeadlyAim),
  asFactory(SharpenedPoints),
  asFactory(Duellist),
  asFactory(Tough),
  asFactory(GreatFortitude),
  asFactory(KeenEye),
];

export const blazingAssaultDeck = new DeckDefinition(
  "deck-def:rivals:blazing-assault",
  "Blazing Assault Rivals Deck",
  objectives,
  [...ploys, ...upgrades],
);
