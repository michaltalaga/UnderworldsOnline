import type { CardFactory } from "../../cards/Card";
import {
  placeholderObjectiveFactory,
  placeholderPloyFactory,
  placeholderUpgradeFactory,
} from "../../cards/PlaceholderCard";
import { FighterDefinition } from "../../definitions/FighterDefinition";
import { WarbandDefinition } from "../../definitions/WarbandDefinition";
import { WarscrollAbilityDefinition } from "../../definitions/WarscrollAbilityDefinition";
import { WarscrollDefinition } from "../../definitions/WarscrollDefinition";
import { WeaponAbilityDefinition } from "../../definitions/WeaponAbilityDefinition";
import { WeaponDefinition } from "../../definitions/WeaponDefinition";
import {
  SaveSymbol,
  TurnStep,
  WeaponAbilityKind,
  WeaponAccuracy,
} from "../../values/enums";

// Source: https://pathtoglorypodcast.com/zikkits-tunnelpack-review/
//
// NOTE ON SCOPE: Fighters and warscroll structure only. Card text is
// represented as prose placeholders with no gameplay effects — the engine
// treats them as blank stubs until we add the real card rules.
//
// NOTE ON INSPIRED STATS: `FighterDefinition` only stores a single profile,
// but `Fighter.isInspired` tracks the inspired flag. The fighters below
// use the uninspired profile. Inspired stat swaps will need engine-level
// support before they can be encoded.

const fighters = [
  new FighterDefinition(
    "fighter-def:zikkits-tunnelpack:zikkit-rockgnaw",
    "Zikkit Rockgnaw",
    true,
    4,
    2,
    SaveSymbol.Dodge,
    4,
    2,
    [
      new WeaponDefinition(
        "weapon-def:zikkits-tunnelpack:zikkit-claws",
        "Ratling Claws",
        1,
        2,
        WeaponAccuracy.Hammer,
        2,
      ),
      new WeaponDefinition(
        "weapon-def:zikkits-tunnelpack:zikkit-pistol",
        "Ratling Pistol",
        2,
        2,
        WeaponAccuracy.Hammer,
        1,
      ),
    ],
  ),
  new FighterDefinition(
    "fighter-def:zikkits-tunnelpack:rittak-verm",
    "Rittak Verm",
    false,
    3,
    1,
    SaveSymbol.Shield,
    4,
    2,
    [
      new WeaponDefinition(
        "weapon-def:zikkits-tunnelpack:rittak-halberd",
        "Stormvermin Halberd",
        1,
        2,
        WeaponAccuracy.Hammer,
        3,
      ),
    ],
  ),
  new FighterDefinition(
    "fighter-def:zikkits-tunnelpack:krittatok",
    "Krittatok",
    false,
    4,
    1,
    SaveSymbol.Dodge,
    3,
    1,
    [
      new WeaponDefinition(
        "weapon-def:zikkits-tunnelpack:krittatok-blades",
        "Gutter Blades",
        1,
        3,
        WeaponAccuracy.Sword,
        1,
        [new WeaponAbilityDefinition(WeaponAbilityKind.Grievous, true)],
      ),
    ],
  ),
  new FighterDefinition(
    "fighter-def:zikkits-tunnelpack:nitch-singesnout",
    "Nitch Singesnout",
    false,
    4,
    1,
    SaveSymbol.Dodge,
    3,
    1,
    [
      new WeaponDefinition(
        "weapon-def:zikkits-tunnelpack:nitch-jezzail",
        "Warpfire Jezzail",
        3,
        2,
        WeaponAccuracy.Hammer,
        1,
      ),
    ],
  ),
  new FighterDefinition(
    "fighter-def:zikkits-tunnelpack:tik-tik",
    "Tik-Tik",
    false,
    4,
    2,
    SaveSymbol.Dodge,
    2,
    0,
    [
      new WeaponDefinition(
        "weapon-def:zikkits-tunnelpack:tik-tik-knives",
        "Skitter Knives",
        1,
        2,
        WeaponAccuracy.Sword,
        1,
      ),
    ],
  ),
] as const;

const warscroll = new WarscrollDefinition(
  "warscroll-def:zikkits-tunnelpack",
  "Zikkit's Tunnelpack Warscroll",
  ["Fighters with the Tunneler keyword may start the battle inside reserve tunnels."],
  [
    "Tunnel Ambush: Once per battle round, a Tunneler fighter in reserve may " +
      "surface on a feature token hex at the start of a friendly activation.",
    "Warp-Scurry: During the power step, pay 1 warp token to give a friendly " +
      "Tunneler fighter a move token, even if it already has one.",
  ],
  { warp: 0 },
  [
    new WarscrollAbilityDefinition(
      "Tunnel Ambush",
      "Once per battle round, a Tunneler fighter in reserve surfaces next to a feature token.",
      TurnStep.Action,
    ),
    new WarscrollAbilityDefinition(
      "Warp-Scurry",
      "Spend 1 warp token to give a friendly Tunneler fighter a move token.",
      TurnStep.Power,
      { warp: 1 },
    ),
  ],
);

function createObjectiveCards(): CardFactory[] {
  return Array.from({ length: 12 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");
    return placeholderObjectiveFactory(`Tunnelpack Objective ${cardNumber}`);
  });
}

function createPowerCards(): CardFactory[] {
  const ploys: CardFactory[] = Array.from({ length: 10 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");
    return placeholderPloyFactory(`Tunnelpack Ploy ${cardNumber}`);
  });

  const upgrades: CardFactory[] = Array.from({ length: 10 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");
    return placeholderUpgradeFactory(`Tunnelpack Upgrade ${cardNumber}`);
  });

  return [...ploys, ...upgrades];
}

export const zikkitsTunnelpackWarband = new WarbandDefinition(
  "warband-def:zikkits-tunnelpack",
  "Zikkit's Tunnelpack",
  fighters,
  warscroll,
  createObjectiveCards(),
  createPowerCards(),
);
