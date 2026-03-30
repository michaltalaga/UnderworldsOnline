import type { ObjectiveCard, PowerCard, TeamId, WarbandData } from "../types";

export type WarbandId = "emberguard" | "duskraiders";
export type RivalsDeckId = "blazing-assault" | "emberstone-hold" | "nightfall-raids" | "grave-math";

export type WarbandOption = {
  id: WarbandId;
  name: string;
  fighterNames: string[];
};

export type RivalsDeckOption = {
  id: RivalsDeckId;
  name: string;
  summary: string;
};

type RivalsDeckData = {
  name: string;
  summary: string;
  objectives: Array<Omit<ObjectiveCard, "id">>;
  power: Array<Omit<PowerCard, "id">>;
};

const rivalsDecksById: Record<RivalsDeckId, RivalsDeckData> = {
  "blazing-assault": {
    name: "Blazing Assault",
    summary: "Aggressive scoring and damage boosts.",
    objectives: [
      { name: "Hold Center", type: "hold-center", glory: 1 },
      { name: "Take Down", type: "take-down", glory: 1 },
      { name: "No Mercy", type: "no-mercy", glory: 1 },
      { name: "Take Down", type: "take-down", glory: 1 },
      { name: "No Mercy", type: "no-mercy", glory: 1 },
      { name: "Hold Center", type: "hold-center", glory: 1 },
    ],
    power: [
      { name: "Ferocious Strike", type: "ferocious-strike" },
      { name: "Ferocious Strike", type: "ferocious-strike" },
      { name: "Sidestep", type: "sidestep" },
      { name: "Healing Potion", type: "healing-potion" },
      { name: "Sidestep", type: "sidestep" },
      { name: "Ferocious Strike", type: "ferocious-strike" },
      { name: "Sidestep", type: "sidestep" },
    ],
  },
  "emberstone-hold": {
    name: "Emberstone Hold",
    summary: "Objective-focused control and sustain.",
    objectives: [
      { name: "Hold Center", type: "hold-center", glory: 1 },
      { name: "Hold Center", type: "hold-center", glory: 1 },
      { name: "Hold Center", type: "hold-center", glory: 1 },
      { name: "Take Down", type: "take-down", glory: 1 },
      { name: "No Mercy", type: "no-mercy", glory: 1 },
      { name: "Hold Center", type: "hold-center", glory: 1 },
    ],
    power: [
      { name: "Healing Potion", type: "healing-potion" },
      { name: "Sidestep", type: "sidestep" },
      { name: "Healing Potion", type: "healing-potion" },
      { name: "Sidestep", type: "sidestep" },
      { name: "Ferocious Strike", type: "ferocious-strike" },
      { name: "Healing Potion", type: "healing-potion" },
      { name: "Sidestep", type: "sidestep" },
    ],
  },
  "nightfall-raids": {
    name: "Nightfall Raids",
    summary: "Mobility and opportunistic strikes.",
    objectives: [
      { name: "Take Down", type: "take-down", glory: 1 },
      { name: "No Mercy", type: "no-mercy", glory: 1 },
      { name: "Take Down", type: "take-down", glory: 1 },
      { name: "Hold Center", type: "hold-center", glory: 1 },
      { name: "Take Down", type: "take-down", glory: 1 },
      { name: "No Mercy", type: "no-mercy", glory: 1 },
    ],
    power: [
      { name: "Sidestep", type: "sidestep" },
      { name: "Sidestep", type: "sidestep" },
      { name: "Ferocious Strike", type: "ferocious-strike" },
      { name: "Sidestep", type: "sidestep" },
      { name: "Healing Potion", type: "healing-potion" },
      { name: "Ferocious Strike", type: "ferocious-strike" },
      { name: "Sidestep", type: "sidestep" },
    ],
  },
  "grave-math": {
    name: "Grave Math",
    summary: "Balanced list with steady scoring and utility.",
    objectives: [
      { name: "Hold Center", type: "hold-center", glory: 1 },
      { name: "Take Down", type: "take-down", glory: 1 },
      { name: "No Mercy", type: "no-mercy", glory: 1 },
      { name: "Hold Center", type: "hold-center", glory: 1 },
      { name: "Take Down", type: "take-down", glory: 1 },
      { name: "No Mercy", type: "no-mercy", glory: 1 },
    ],
    power: [
      { name: "Sidestep", type: "sidestep" },
      { name: "Ferocious Strike", type: "ferocious-strike" },
      { name: "Healing Potion", type: "healing-potion" },
      { name: "Sidestep", type: "sidestep" },
      { name: "Ferocious Strike", type: "ferocious-strike" },
      { name: "Healing Potion", type: "healing-potion" },
      { name: "Sidestep", type: "sidestep" },
    ],
  },
};

const rivalsDeckOrder: RivalsDeckId[] = ["blazing-assault", "emberstone-hold", "nightfall-raids", "grave-math"];

export const rivalsDeckOptions: RivalsDeckOption[] = rivalsDeckOrder.map((id) => ({
  id,
  name: rivalsDecksById[id].name,
  summary: rivalsDecksById[id].summary,
}));

const emberguard: WarbandData = {
  name: "Emberguard",
  fighters: [
    {
      id: "captain",
      name: "Captain Varyn",
      pos: { q: -2, r: 0 },
      hp: 4,
      stats: {
        maxHp: 4,
        move: 3,
        attackDice: 2,
        attackTrait: "hammer",
        attackRange: 1,
        attackDamage: 2,
        saveDice: 1,
        saveTrait: "shield",
      },
      guard: false,
      charged: false,
      nextAttackBonusDamage: 0,
    },
    {
      id: "blade",
      name: "Ash Blade",
      pos: { q: -2, r: 1 },
      hp: 3,
      stats: {
        maxHp: 3,
        move: 4,
        attackDice: 2,
        attackTrait: "sword",
        attackRange: 1,
        attackDamage: 1,
        saveDice: 1,
        saveTrait: "dodge",
      },
      guard: false,
      charged: false,
      nextAttackBonusDamage: 0,
    },
    {
      id: "marksman",
      name: "Cinder Marksman",
      pos: { q: -1, r: 1 },
      hp: 3,
      stats: {
        maxHp: 3,
        move: 3,
        attackDice: 2,
        attackTrait: "hammer",
        attackRange: 2,
        attackDamage: 1,
        saveDice: 1,
        saveTrait: "dodge",
      },
      guard: false,
      charged: false,
      nextAttackBonusDamage: 0,
    },
  ],
};

const duskraiders: WarbandData = {
  name: "Duskraiders",
  fighters: [
    {
      id: "reaver",
      name: "Dusk Reaver",
      pos: { q: 2, r: 0 },
      hp: 4,
      stats: {
        maxHp: 4,
        move: 3,
        attackDice: 2,
        attackTrait: "sword",
        attackRange: 1,
        attackDamage: 2,
        saveDice: 1,
        saveTrait: "shield",
      },
      guard: false,
      charged: false,
      nextAttackBonusDamage: 0,
    },
    {
      id: "hound",
      name: "Night Hound",
      pos: { q: 2, r: -1 },
      hp: 3,
      stats: {
        maxHp: 3,
        move: 4,
        attackDice: 2,
        attackTrait: "hammer",
        attackRange: 1,
        attackDamage: 1,
        saveDice: 1,
        saveTrait: "dodge",
      },
      guard: false,
      charged: false,
      nextAttackBonusDamage: 0,
    },
    {
      id: "shade",
      name: "Shade Archer",
      pos: { q: 1, r: -1 },
      hp: 3,
      stats: {
        maxHp: 3,
        move: 3,
        attackDice: 2,
        attackTrait: "sword",
        attackRange: 2,
        attackDamage: 1,
        saveDice: 1,
        saveTrait: "shield",
      },
      guard: false,
      charged: false,
      nextAttackBonusDamage: 0,
    },
  ],
};

const warbandsById: Record<WarbandId, WarbandData> = {
  emberguard,
  duskraiders,
};

export const starterWarbandOptions: WarbandOption[] = [
  {
    id: "emberguard",
    name: emberguard.name,
    fighterNames: emberguard.fighters.map((f) => f.name),
  },
  {
    id: "duskraiders",
    name: duskraiders.name,
    fighterNames: duskraiders.fighters.map((f) => f.name),
  },
];

export function oppositeWarbandId(id: WarbandId): WarbandId {
  return id === "emberguard" ? "duskraiders" : "emberguard";
}

export function starterWarbandById(id: WarbandId): WarbandData {
  return warbandsById[id];
}

export function opposingRivalsDeckId(id: RivalsDeckId): RivalsDeckId {
  const idx = rivalsDeckOrder.indexOf(id);
  return rivalsDeckOrder[(idx + 1) % rivalsDeckOrder.length];
}

export function rivalsObjectiveDeckById(id: RivalsDeckId): ObjectiveCard[] {
  const data = rivalsDecksById[id];
  return data.objectives.map((c, i) => ({ ...c, id: `${id}-obj-${i}` }));
}

export function rivalsPowerDeckById(id: RivalsDeckId): PowerCard[] {
  const data = rivalsDecksById[id];
  return data.power.map((c, i) => ({ ...c, id: `${id}-pow-${i}` }));
}

export function starterWarband(team: TeamId): WarbandData {
  return team === "red" ? emberguard : duskraiders;
}
