import type { ObjectiveCardSpec, PowerCardSpec, TeamId, WarbandData } from "../types";

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
  objectives: ObjectiveCardSpec[];
  power: PowerCardSpec[];
};

const rivalsDecksById: Record<RivalsDeckId, RivalsDeckData> = {
  "blazing-assault": {
    name: "Blazing Assault",
    summary: "Aggressive scoring and damage boosts.",
    objectives: [
      { name: "Hold Center", kind: "hold-center", glory: 1 },
      { name: "Take Down", kind: "take-down", glory: 1 },
      { name: "No Mercy", kind: "no-mercy", glory: 1 },
      { name: "Take Down", kind: "take-down", glory: 1 },
      { name: "No Mercy", kind: "no-mercy", glory: 1 },
      { name: "Hold Center", kind: "hold-center", glory: 1 },
    ],
    power: [
      { name: "Ferocious Strike", kind: "ferocious-strike" },
      { name: "Ferocious Strike", kind: "ferocious-strike" },
      { name: "Sidestep", kind: "sidestep" },
      { name: "Healing Potion", kind: "healing-potion" },
      { name: "Sidestep", kind: "sidestep" },
      { name: "Ferocious Strike", kind: "ferocious-strike" },
      { name: "Sidestep", kind: "sidestep" },
    ],
  },
  "emberstone-hold": {
    name: "Emberstone Hold",
    summary: "Objective-focused control and sustain.",
    objectives: [
      { name: "Hold Center", kind: "hold-center", glory: 1 },
      { name: "Hold Center", kind: "hold-center", glory: 1 },
      { name: "Hold Center", kind: "hold-center", glory: 1 },
      { name: "Take Down", kind: "take-down", glory: 1 },
      { name: "No Mercy", kind: "no-mercy", glory: 1 },
      { name: "Hold Center", kind: "hold-center", glory: 1 },
    ],
    power: [
      { name: "Healing Potion", kind: "healing-potion" },
      { name: "Sidestep", kind: "sidestep" },
      { name: "Healing Potion", kind: "healing-potion" },
      { name: "Sidestep", kind: "sidestep" },
      { name: "Ferocious Strike", kind: "ferocious-strike" },
      { name: "Healing Potion", kind: "healing-potion" },
      { name: "Sidestep", kind: "sidestep" },
    ],
  },
  "nightfall-raids": {
    name: "Nightfall Raids",
    summary: "Mobility and opportunistic strikes.",
    objectives: [
      { name: "Take Down", kind: "take-down", glory: 1 },
      { name: "No Mercy", kind: "no-mercy", glory: 1 },
      { name: "Take Down", kind: "take-down", glory: 1 },
      { name: "Hold Center", kind: "hold-center", glory: 1 },
      { name: "Take Down", kind: "take-down", glory: 1 },
      { name: "No Mercy", kind: "no-mercy", glory: 1 },
    ],
    power: [
      { name: "Sidestep", kind: "sidestep" },
      { name: "Sidestep", kind: "sidestep" },
      { name: "Ferocious Strike", kind: "ferocious-strike" },
      { name: "Sidestep", kind: "sidestep" },
      { name: "Healing Potion", kind: "healing-potion" },
      { name: "Ferocious Strike", kind: "ferocious-strike" },
      { name: "Sidestep", kind: "sidestep" },
    ],
  },
  "grave-math": {
    name: "Grave Math",
    summary: "Balanced list with steady scoring and utility.",
    objectives: [
      { name: "Hold Center", kind: "hold-center", glory: 1 },
      { name: "Take Down", kind: "take-down", glory: 1 },
      { name: "No Mercy", kind: "no-mercy", glory: 1 },
      { name: "Hold Center", kind: "hold-center", glory: 1 },
      { name: "Take Down", kind: "take-down", glory: 1 },
      { name: "No Mercy", kind: "no-mercy", glory: 1 },
    ],
    power: [
      { name: "Sidestep", kind: "sidestep" },
      { name: "Ferocious Strike", kind: "ferocious-strike" },
      { name: "Healing Potion", kind: "healing-potion" },
      { name: "Sidestep", kind: "sidestep" },
      { name: "Ferocious Strike", kind: "ferocious-strike" },
      { name: "Healing Potion", kind: "healing-potion" },
      { name: "Sidestep", kind: "sidestep" },
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

export function rivalsObjectiveDeckById(id: RivalsDeckId): ObjectiveCardSpec[] {
  const data = rivalsDecksById[id];
  return data.objectives.map((c) => ({ ...c }));
}

export function rivalsPowerDeckById(id: RivalsDeckId): PowerCardSpec[] {
  const data = rivalsDecksById[id];
  return data.power.map((c) => ({ ...c }));
}

export function starterWarband(team: TeamId): WarbandData {
  return team === "red" ? emberguard : duskraiders;
}
