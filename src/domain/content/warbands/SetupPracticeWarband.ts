import { CardDefinition } from "../../definitions/CardDefinition";
import { FighterDefinition } from "../../definitions/FighterDefinition";
import { WarbandDefinition } from "../../definitions/WarbandDefinition";
import { PracticeObjective01Rule } from "../../rules/objectives/AttackRollAllSuccessesObjectiveRule";
import { PracticeObjective03Rule } from "../../rules/objectives/DelveInEnemyTerritoryOrFriendlyIfUnderdogObjectiveRule";
import { PracticeObjective04Rule } from "../../rules/objectives/DelveThreeTreasureTokensThisRoundOrEnemyHeldAtRoundStartObjectiveRule";
import { PracticeObjective02Rule } from "../../rules/objectives/SlayLeaderOrEqualOrGreaterHealthObjectiveRule";
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
    const isAllSuccessesObjective = index === 0;
    const isSlayLeaderOrEqualOrGreaterHealthObjective = index === 1;
    const isDelveTerritoryObjective = index === 2;
    const isDelveTreasureRoundObjective = index === 3;
    const objectiveRule = isAllSuccessesObjective
      ? new PracticeObjective01Rule()
      : isSlayLeaderOrEqualOrGreaterHealthObjective
        ? new PracticeObjective02Rule()
        : isDelveTerritoryObjective
          ? new PracticeObjective03Rule()
          : isDelveTreasureRoundObjective
            ? new PracticeObjective04Rule()
            : null;

    return new CardDefinition(
      `card-def:setup-practice:objective:${cardNumber}`,
      CardKind.Objective,
      `Practice Objective ${cardNumber}`,
      isAllSuccessesObjective
        ? "Score this immediately after you make an Attack roll if all of the results were successes."
        : isSlayLeaderOrEqualOrGreaterHealthObjective
          ? "Score this immediately after an enemy fighter is slain by a friendly fighter if the target was a leader or the target's Health characteristic was equal to or greater than the attacker's."
          : isDelveTerritoryObjective
            ? "Score this immediately after a friendly fighter Delves in enemy territory. If you are the underdog, that Delve can be in friendly territory instead."
            : isDelveTreasureRoundObjective
              ? "Score this in an end phase if 3 or more different treasure tokens were Delved by your warband this battle round or if a treasure token held by an enemy fighter at the start of the battle round was Delved by your warband this battle round."
        : "",
      1,
      [],
      objectiveRule,
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
