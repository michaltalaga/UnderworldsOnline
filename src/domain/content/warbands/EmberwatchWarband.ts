import { Card, type CardFactory } from "../../cards/Card";
import { FighterDefinition } from "../../definitions/FighterDefinition";
import { WarbandDefinition } from "../../definitions/WarbandDefinition";
import { WarscrollAbilityDefinition } from "../../definitions/WarscrollAbilityDefinition";
import { WarscrollDefinition } from "../../definitions/WarscrollDefinition";
import { WeaponDefinition } from "../../definitions/WeaponDefinition";
import { CardKind, SaveSymbol, TurnStep, WeaponAccuracy } from "../../values/enums";

// Source: https://pathtoglorypodcast.com/the-emberwatch-review/
//
// NOTE ON SCOPE: Fighters and warscroll structure only. Card text is
// represented as prose placeholders with no gameplay effects — the engine
// treats them as blank stubs until we add the real card rules.
//
// NOTE ON INSPIRED STATS: `FighterDefinition` only stores a single profile,
// but `FighterState.isInspired` tracks the inspired flag. The fighters below
// use the uninspired profile. Inspired stat swaps will need engine-level
// support before they can be encoded.

const fighters = [
  new FighterDefinition(
    "fighter-def:emberwatch:ardorn-flamerunner",
    "Ardorn Flamerunner",
    true,
    3,
    1,
    SaveSymbol.Shield,
    5,
    3,
    [
      new WeaponDefinition(
        "weapon-def:emberwatch:ardorn-blade",
        "Flamerunner Blade",
        1,
        2,
        WeaponAccuracy.Hammer,
        2,
      ),
      new WeaponDefinition(
        "weapon-def:emberwatch:ardorn-bow",
        "Stormcast Bow",
        3,
        2,
        WeaponAccuracy.Hammer,
        1,
      ),
    ],
  ),
  new FighterDefinition(
    "fighter-def:emberwatch:farasa-twice-risen",
    "Farasa Twice-Risen",
    false,
    3,
    1,
    SaveSymbol.Shield,
    5,
    2,
    [
      new WeaponDefinition(
        "weapon-def:emberwatch:farasa-glaive",
        "Twice-Risen Glaive",
        1,
        3,
        WeaponAccuracy.Sword,
        2,
      ),
      new WeaponDefinition(
        "weapon-def:emberwatch:farasa-bow",
        "Stormcast Bow",
        3,
        2,
        WeaponAccuracy.Hammer,
        1,
      ),
    ],
  ),
  new FighterDefinition(
    "fighter-def:emberwatch:yurik-velzaine",
    "Yurik Velzaine",
    false,
    3,
    1,
    SaveSymbol.Shield,
    5,
    2,
    [
      new WeaponDefinition(
        "weapon-def:emberwatch:yurik-blade",
        "Velzaine Blade",
        1,
        2,
        WeaponAccuracy.Hammer,
        2,
      ),
      new WeaponDefinition(
        "weapon-def:emberwatch:yurik-longbow",
        "Vanguard Longbow",
        4,
        2,
        WeaponAccuracy.Hammer,
        1,
      ),
    ],
  ),
] as const;

const warscroll = new WarscrollDefinition(
  "warscroll-def:emberwatch",
  "The Emberwatch Warscroll",
  ["Place feature tokens within 1 hex of an edge hex during deployment when possible."],
  [
    "Alone I Stand! — After the last power step, push a friendly fighter 1 hex away from other fighters.",
    "Vanguard Dash — Once per game, after your action step, teleport any friendly fighter to an edge hex.",
    "Deadly Sentries — Once per game, friendly fighters gain +1 Range on attacks this activation.",
    "The Raptors of Sigmar — Once per game, finish off a vulnerable enemy fighter after an attack.",
  ],
  {},
  [
    new WarscrollAbilityDefinition(
      "Alone I Stand!",
      "After the last power step, push a friendly fighter 1 hex away from other fighters.",
      TurnStep.Power,
    ),
    new WarscrollAbilityDefinition(
      "Vanguard Dash",
      "Once per game, after your action step, teleport any friendly fighter to an edge hex.",
      TurnStep.Action,
    ),
    new WarscrollAbilityDefinition(
      "Deadly Sentries",
      "Once per game, friendly fighters gain +1 Range on attacks this activation.",
      TurnStep.Action,
    ),
    new WarscrollAbilityDefinition(
      "The Raptors of Sigmar",
      "Once per game, finish off a vulnerable enemy fighter after an attack.",
      TurnStep.Action,
    ),
  ],
);

// Placeholder cards inherit the base `canPlay` which always returns `false`,
// so they will not surface as playable options until the real effects are
// implemented. They exist so the deck sizes match the warband template and
// setup/muster flows stay legal.
function placeholderCardFactory(
  kind: CardKind,
  namePrefix: string,
  cardNumber: string,
  gloryValue: number,
): CardFactory {
  return (id, owner, zone) =>
    new Card(id, owner, kind, `${namePrefix} ${cardNumber}`, "(Placeholder — card effect not yet implemented.)", gloryValue, zone);
}

function createObjectiveCards(): CardFactory[] {
  return Array.from({ length: 12 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");
    return placeholderCardFactory(CardKind.Objective, "Emberwatch Objective", cardNumber, 1);
  });
}

function createPowerCards(): CardFactory[] {
  const ploys: CardFactory[] = Array.from({ length: 10 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");
    return placeholderCardFactory(CardKind.Ploy, "Emberwatch Ploy", cardNumber, 0);
  });

  const upgrades: CardFactory[] = Array.from({ length: 10 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");
    return placeholderCardFactory(CardKind.Upgrade, "Emberwatch Upgrade", cardNumber, 1);
  });

  return [...ploys, ...upgrades];
}

export const emberwatchWarband = new WarbandDefinition(
  "warband-def:emberwatch",
  "The Emberwatch",
  fighters,
  warscroll,
  createObjectiveCards(),
  createPowerCards(),
);
