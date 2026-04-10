import { asFactory, type CardFactory } from "../../cards/Card";
import { FighterDefinition } from "../../definitions/FighterDefinition";
import { WarbandDefinition } from "../../definitions/WarbandDefinition";
import { WeaponAbilityDefinition } from "../../definitions/WeaponAbilityDefinition";
import { WarscrollAbilityDefinition } from "../../definitions/WarscrollAbilityDefinition";
import { WarscrollDefinition } from "../../definitions/WarscrollDefinition";
import { WeaponDefinition } from "../../definitions/WeaponDefinition";
import {
  SaveSymbol,
  TurnStep,
  WarscrollAbilityEffectKind,
  WeaponAbilityKind,
  WeaponAccuracy,
} from "../../values/enums";
import {
  PracticeObjective01,
  PracticeObjective02,
  PracticeObjective03,
  PracticeObjective04,
  PracticeObjectiveGeneric,
  DrawPowerCardsPloy,
  GainWarscrollTokensPloy,
  GiveGuardPloy,
  GiveStaggerPloy,
  PracticeUpgrade,
} from "../cards/SetupPracticeCards";

const fighters = [
  new FighterDefinition(
    "fighter-def:setup-practice:1",
    "Practice Fighter 1",
    true,
    3,
    1,
    SaveSymbol.Shield,
    4,
    1,
    [
      new WeaponDefinition(
        "weapon-def:setup-practice:1",
        "Practice Blade",
        1,
        2,
        WeaponAccuracy.Hammer,
        1,
        [
          new WeaponAbilityDefinition(WeaponAbilityKind.Stagger),
          new WeaponAbilityDefinition(WeaponAbilityKind.Grievous, true),
          new WeaponAbilityDefinition(WeaponAbilityKind.Cleave),
          new WeaponAbilityDefinition(WeaponAbilityKind.Ensnare),
          new WeaponAbilityDefinition(WeaponAbilityKind.Brutal),
        ],
      ),
    ],
  ),
  new FighterDefinition(
    "fighter-def:setup-practice:2",
    "Practice Fighter 2",
    false,
    3,
    1,
    SaveSymbol.Shield,
    4,
    1,
    [new WeaponDefinition("weapon-def:setup-practice:2", "Practice Spear", 2, 2, WeaponAccuracy.Hammer, 1)],
  ),
  new FighterDefinition(
    "fighter-def:setup-practice:3",
    "Practice Fighter 3",
    false,
    4,
    1,
    SaveSymbol.Dodge,
    3,
    1,
    [new WeaponDefinition("weapon-def:setup-practice:3", "Practice Bow", 3, 2, WeaponAccuracy.Sword, 1)],
  ),
  new FighterDefinition(
    "fighter-def:setup-practice:4",
    "Practice Fighter 4",
    false,
    3,
    1,
    SaveSymbol.Shield,
    4,
    1,
    [new WeaponDefinition("weapon-def:setup-practice:4", "Practice Hammer", 1, 2, WeaponAccuracy.Hammer, 2)],
  ),
] as const;

const warscroll = new WarscrollDefinition(
  "warscroll-def:setup-practice",
  "Setup Practice Warscroll",
  [],
  [],
  { signal: 1 },
  [
    new WarscrollAbilityDefinition(
      "Signal Burst",
      "Spend 1 signal token: draw 1 power card.",
      TurnStep.Power,
      { signal: 1 },
      [
        {
          kind: WarscrollAbilityEffectKind.DrawPowerCards,
          count: 1,
        },
      ],
    ),
    new WarscrollAbilityDefinition(
      "Signal Cache",
      "Spend 1 signal token: gain 1 reserve token.",
      TurnStep.Power,
      { signal: 1 },
      [
        {
          kind: WarscrollAbilityEffectKind.GainWarscrollTokens,
          tokens: { reserve: 1 },
        },
      ],
    ),
  ],
);

// --- Card creation ---

function createObjectiveCards(): CardFactory[] {
  return Array.from({ length: 12 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");
    switch (index) {
      case 0: return asFactory(PracticeObjective01);
      case 1: return asFactory(PracticeObjective02);
      case 2: return asFactory(PracticeObjective03);
      case 3: return asFactory(PracticeObjective04);
      default:
        return (id, owner, zone) => new PracticeObjectiveGeneric(id, owner, zone, cardNumber);
    }
  });
}

function createPowerCards(): CardFactory[] {
  const ploys: CardFactory[] = Array.from({ length: 10 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");
    if (index < 5) return (id, owner, zone) => new DrawPowerCardsPloy(id, owner, zone, cardNumber);
    if (index < 8) return (id, owner, zone) => new GainWarscrollTokensPloy(id, owner, zone, cardNumber);
    if (index === 8) return (id, owner, zone) => new GiveGuardPloy(id, owner, zone, cardNumber);
    return (id, owner, zone) => new GiveStaggerPloy(id, owner, zone, cardNumber);
  });

  const upgrades: CardFactory[] = Array.from({ length: 10 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");
    return (id, owner, zone) => new PracticeUpgrade(id, owner, zone, cardNumber);
  });

  return [...ploys, ...upgrades];
}

export const setupPracticeWarband = new WarbandDefinition(
  "warband-def:setup-practice",
  "Setup Practice Warband",
  fighters,
  warscroll,
  createObjectiveCards(),
  createPowerCards(),
);
