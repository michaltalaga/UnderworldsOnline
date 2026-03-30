import type { ObjectiveCard, PowerCard, TeamId, WarbandData } from "../types";

const objectiveCards: ObjectiveCard[] = [
  { id: "o1", name: "Hold Center", type: "hold-center", glory: 1 },
  { id: "o2", name: "Take Down", type: "take-down", glory: 1 },
  { id: "o3", name: "No Mercy", type: "no-mercy", glory: 1 },
  { id: "o4", name: "Hold Center", type: "hold-center", glory: 1 },
  { id: "o5", name: "Take Down", type: "take-down", glory: 1 },
  { id: "o6", name: "No Mercy", type: "no-mercy", glory: 1 },
];

const powerCards: PowerCard[] = [
  { id: "p1", name: "Sidestep", type: "sidestep" },
  { id: "p2", name: "Ferocious Strike", type: "ferocious-strike" },
  { id: "p3", name: "Healing Potion", type: "healing-potion" },
  { id: "p4", name: "Sidestep", type: "sidestep" },
  { id: "p5", name: "Ferocious Strike", type: "ferocious-strike" },
  { id: "p6", name: "Healing Potion", type: "healing-potion" },
  { id: "p7", name: "Sidestep", type: "sidestep" },
];

const emberguard: WarbandData = {
  name: "Emberguard",
  fighters: [
    {
      id: "captain",
      name: "Captain Varyn",
      pos: { q: -2, r: 0 },
      hp: 4,
      stats: { maxHp: 4, move: 3, attackDice: 2, attackRange: 1, attackDamage: 2, saveDice: 1 },
      guard: false,
      charged: false,
      nextAttackBonusDamage: 0,
    },
    {
      id: "blade",
      name: "Ash Blade",
      pos: { q: -2, r: 1 },
      hp: 3,
      stats: { maxHp: 3, move: 4, attackDice: 2, attackRange: 1, attackDamage: 1, saveDice: 1 },
      guard: false,
      charged: false,
      nextAttackBonusDamage: 0,
    },
    {
      id: "marksman",
      name: "Cinder Marksman",
      pos: { q: -1, r: 1 },
      hp: 3,
      stats: { maxHp: 3, move: 3, attackDice: 2, attackRange: 2, attackDamage: 1, saveDice: 1 },
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
      stats: { maxHp: 4, move: 3, attackDice: 2, attackRange: 1, attackDamage: 2, saveDice: 1 },
      guard: false,
      charged: false,
      nextAttackBonusDamage: 0,
    },
    {
      id: "hound",
      name: "Night Hound",
      pos: { q: 2, r: -1 },
      hp: 3,
      stats: { maxHp: 3, move: 4, attackDice: 2, attackRange: 1, attackDamage: 1, saveDice: 1 },
      guard: false,
      charged: false,
      nextAttackBonusDamage: 0,
    },
    {
      id: "shade",
      name: "Shade Archer",
      pos: { q: 1, r: -1 },
      hp: 3,
      stats: { maxHp: 3, move: 3, attackDice: 2, attackRange: 2, attackDamage: 1, saveDice: 1 },
      guard: false,
      charged: false,
      nextAttackBonusDamage: 0,
    },
  ],
};

export function starterWarband(team: TeamId): WarbandData {
  return team === "red" ? emberguard : duskraiders;
}

export function starterObjectiveDeck(): ObjectiveCard[] {
  return objectiveCards.map((c, i) => ({ ...c, id: `${c.id}-${i}` }));
}

export function starterPowerDeck(): PowerCard[] {
  return powerCards.map((c, i) => ({ ...c, id: `${c.id}-${i}` }));
}
