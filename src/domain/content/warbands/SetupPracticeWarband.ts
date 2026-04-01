import { CardDefinition } from "../../definitions/CardDefinition";
import { FighterDefinition } from "../../definitions/FighterDefinition";
import { WarbandDefinition } from "../../definitions/WarbandDefinition";
import { WeaponAbilityDefinition } from "../../definitions/WeaponAbilityDefinition";
import { WarscrollAbilityDefinition } from "../../definitions/WarscrollAbilityDefinition";
import { WarscrollDefinition } from "../../definitions/WarscrollDefinition";
import { WeaponDefinition } from "../../definitions/WeaponDefinition";
import {
  CardKind,
  FighterTokenKind,
  PloyEffectKind,
  PloyEffectTargetKind,
  SaveSymbol,
  TurnStep,
  WarscrollAbilityEffectKind,
  WeaponAbilityKind,
  WeaponAccuracy,
} from "../../values/enums";

const fighters = [
  new FighterDefinition(
    "fighter-def:setup-practice:1",
    "Practice Fighter 1",
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

export const setupPracticeWarband = new WarbandDefinition(
  "warband-def:setup-practice",
  "Setup Practice Warband",
  fighters,
  warscroll,
  createObjectiveCards(),
  createPowerCards(),
);

function createObjectiveCards(): CardDefinition[] {
  return Array.from({ length: 12 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");

    return new CardDefinition(
      `card-def:setup-practice:objective:${cardNumber}`,
      CardKind.Objective,
      `Practice Objective ${cardNumber}`,
      "",
      1,
    );
  });
}

function createPowerCards(): CardDefinition[] {
  const ploys = Array.from({ length: 10 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");
    const isDrawPloy = index < 5;
    const isSignalPloy = index >= 5 && index < 8;
    const isGuardPloy = index === 8;

    return new CardDefinition(
      `card-def:setup-practice:ploy:${cardNumber}`,
      CardKind.Ploy,
      `Practice Ploy ${cardNumber}`,
      isDrawPloy
        ? "Draw 1 power card."
        : isSignalPloy
          ? "Gain 1 signal token."
          : isGuardPloy
            ? "Give a friendly fighter a guard token."
            : "Give an enemy fighter a stagger token.",
      0,
      isDrawPloy
        ? [
          {
            kind: PloyEffectKind.DrawPowerCards,
            count: 1,
          },
        ]
        : isSignalPloy
          ? [
            {
              kind: PloyEffectKind.GainWarscrollTokens,
              tokens: { signal: 1 },
            },
          ]
          : isGuardPloy
            ? [
              {
                kind: PloyEffectKind.GainFighterToken,
                target: PloyEffectTargetKind.FriendlyFighter,
                token: FighterTokenKind.Guard,
              },
            ]
            : [
              {
                kind: PloyEffectKind.GainFighterToken,
                target: PloyEffectTargetKind.EnemyFighter,
                token: FighterTokenKind.Stagger,
              },
            ],
    );
  });

  const upgrades = Array.from({ length: 10 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");

    return new CardDefinition(
      `card-def:setup-practice:upgrade:${cardNumber}`,
      CardKind.Upgrade,
      `Practice Upgrade ${cardNumber}`,
      "",
      1,
    );
  });

  return [...ploys, ...upgrades];
}
