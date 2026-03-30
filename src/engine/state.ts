import { createBoardHexes } from "./boardShape";
import { rivalsObjectiveDeckById, rivalsPowerDeckById, starterWarbandById } from "./data/starterData";
import { hexKey } from "./hex";
import { rollD6, shuffleWithSeed } from "./rng";
import type { RivalsDeckId, WarbandId } from "./data/starterData";
import type {
  AttackDieFace,
  CardZone,
  Entity,
  EntityId,
  FighterArchetype,
  GameState,
  ObjectiveCard,
  PowerCard,
  TeamId,
} from "./types";

type InitialStateSetup = {
  redWarbandId: WarbandId;
  blueWarbandId: WarbandId;
  redRivalsDeckId: RivalsDeckId;
  blueRivalsDeckId: RivalsDeckId;
};

function drawN<T>(arr: T[], n: number): { hand: T[]; deck: T[] } {
  return { hand: arr.slice(0, n), deck: arr.slice(n) };
}

function rollAttackDieFace(rngState: number): { state: number; face: AttackDieFace } {
  const roll = rollD6(rngState);
  if (roll.value === 6) return { state: roll.state, face: "crit-attack" };
  if (roll.value === 5) return { state: roll.state, face: "hammer" };
  if (roll.value === 4) return { state: roll.state, face: "sword" };
  if (roll.value === 3) return { state: roll.state, face: "double-support" };
  if (roll.value === 2) return { state: roll.state, face: "support" };
  return { state: roll.state, face: "blank" };
}

function rollOffRank(face: AttackDieFace): number {
  if (face === "crit-attack") return 3;
  if (face === "hammer" || face === "sword") return 2;
  if (face === "support" || face === "double-support") return 1;
  return 0;
}

function determineFirstTeam(rngState: number): {
  rngState: number;
  firstTeam: TeamId;
  redRoll: AttackDieFace;
  blueRoll: AttackDieFace;
} {
  let state = rngState;

  while (true) {
    const red = rollAttackDieFace(state);
    const blue = rollAttackDieFace(red.state);
    state = blue.state;
    const redRank = rollOffRank(red.face);
    const blueRank = rollOffRank(blue.face);
    if (redRank === blueRank) continue;

    return {
      rngState: state,
      firstTeam: redRank > blueRank ? "red" : "blue",
      redRoll: red.face,
      blueRoll: blue.face,
    };
  }
}

function addEntity(entities: Record<EntityId, Entity>, id: EntityId, entity: Entity): void {
  entities[id] = entity;
}

function spawnFighter(team: TeamId, src: FighterArchetype, entities: Record<EntityId, Entity>): EntityId {
  const id = `${team}-${src.id}`;
  addEntity(entities, id, {
    id,
    components: [
      { type: "fighter", team },
      { type: "name", value: src.name },
      { type: "position", pos: { ...src.pos } },
      { type: "health", hp: src.hp, maxHp: src.stats.maxHp },
      {
        type: "combat",
        move: src.stats.move,
        attackDice: src.stats.attackDice,
        attackTrait: src.stats.attackTrait,
        attackRange: src.stats.attackRange,
        attackDamage: src.stats.attackDamage,
        saveDice: src.stats.saveDice,
        saveTrait: src.stats.saveTrait,
        nextAttackBonusDamage: 0,
      },
      { type: "status", guard: false, charged: false },
    ],
  });
  return id;
}

function spawnCards(
  team: TeamId,
  kind: "objective" | "power",
  zone: CardZone,
  cards: ObjectiveCard[] | PowerCard[],
  entities: Record<EntityId, Entity>,
  idCounter: { value: number },
): EntityId[] {
  return cards.map((card, idx) => {
    const id = `${team}-${kind}-${zone}-${idx}-${idCounter.value}`;
    idCounter.value += 1;
    const components: any[] = [
      { type: "name", value: card.name },
      { type: "cardOwner", owner: team },
      { type: "cardZone", zone },
    ];
    if (kind === "objective") {
      const obj = card as ObjectiveCard;
      components.push({ type: "objectiveCard", cardType: obj.type });
      components.push({ type: "glory", value: obj.glory });
    } else {
      const power = card as PowerCard;
      components.push({ type: "powerCard", cardType: power.type });
    }
    addEntity(entities, id, { id, components });
    return id;
  });
}
// ECS helpers
function getComponent<T extends { type: string }>(entity: Entity, type: T["type"]): T | undefined {
  return entity.components.find((c) => c.type === type) as T | undefined;
}

function hasComponents(entity: Entity, types: string[]): boolean {
  return types.every((type) => entity.components.some((c) => c.type === type));
}

function entity(state: GameState, id: EntityId): Entity {
  const found = state.entities[id];
  if (!found) throw new Error(`Missing entity: ${id}`);
  return found;
}

export function fighterEntityIds(state: GameState, team?: TeamId): EntityId[] {
  if (team) return [...state.teams[team].fighterEntities];
  return [...state.teams.red.fighterEntities, ...state.teams.blue.fighterEntities];
}

export function entityIdsWithComponents(state: GameState, required: string[]): EntityId[] {
  return Object.values(state.entities)
    .filter((e) => hasComponents(e, required))
    .map((e) => e.id);
}

export function isAlive(state: GameState, fighterId: EntityId): boolean {
  const health = getComponent<import("./types").HealthComponent>(entity(state, fighterId), "health");
  return !!health && health.hp > 0;
}

export function fighterName(state: GameState, fighterId: EntityId): string {
  return getComponent<import("./types").NameComponent>(entity(state, fighterId), "name")?.value ?? fighterId;
}

export function fighterTeam(state: GameState, fighterId: EntityId): import("./types").TeamId {
  return getComponent<import("./types").FighterComponent>(entity(state, fighterId), "fighter")!.team;
}

export function fighterPos(state: GameState, fighterId: EntityId): import("./types").Hex {
  return getComponent<import("./types").PositionComponent>(entity(state, fighterId), "position")!.pos;
}

export function fighterHealth(state: GameState, fighterId: EntityId) {
  return getComponent<import("./types").HealthComponent>(entity(state, fighterId), "health")!;
}

export function fighterCombat(state: GameState, fighterId: EntityId) {
  return getComponent<import("./types").CombatComponent>(entity(state, fighterId), "combat")!;
}

export function fighterStatus(state: GameState, fighterId: EntityId) {
  return getComponent<import("./types").StatusComponent>(entity(state, fighterId), "status")!;
}

export function cardName(state: GameState, cardId: EntityId): string {
  return getComponent<import("./types").NameComponent>(entity(state, cardId), "name")?.value ?? cardId;
}

export function cardIsObjective(state: GameState, cardId: EntityId): boolean {
  return !!getComponent<import("./types").ObjectiveCardComponent>(entity(state, cardId), "objectiveCard");
}

export function cardIsPower(state: GameState, cardId: EntityId): boolean {
  return !!getComponent<import("./types").PowerCardComponent>(entity(state, cardId), "powerCard");
}

export function cardObjectiveType(state: GameState, cardId: EntityId) {
  return getComponent<import("./types").ObjectiveCardComponent>(entity(state, cardId), "objectiveCard")?.cardType;
}

export function cardPowerType(state: GameState, cardId: EntityId) {
  return getComponent<import("./types").PowerCardComponent>(entity(state, cardId), "powerCard")?.cardType;
}

export function cardGloryValue(state: GameState, cardId: EntityId): number {
  return getComponent<import("./types").GloryComponent>(entity(state, cardId), "glory")?.value ?? 0;
}

export function cardEntityIdsInZone(state: GameState, team: TeamId, zone: CardZone): EntityId[] {
  return entityIdsWithComponents(state, ["cardOwner", "cardZone"]).filter((id) => {
    const e = entity(state, id);
    const owner = getComponent<import("./types").CardOwnerComponent>(e, "cardOwner");
    const cz = getComponent<import("./types").CardZoneComponent>(e, "cardZone");
    return owner?.owner === team && cz?.zone === zone;
  });
}

export function moveCardEntityToZone(state: GameState, cardId: EntityId, zone: CardZone): void {
  const e = entity(state, cardId);
  const cz = getComponent<import("./types").CardZoneComponent>(e, "cardZone");
  if (!cz) return;
  cz.zone = zone;
}

export function occupiedBy(state: GameState, q: number, r: number): EntityId | null {
  const found = entityIdsWithComponents(state, ["fighter", "position", "health"]).find((id) => {
    if (!isAlive(state, id)) return false;
    const pos = fighterPos(state, id);
    return pos.q === q && pos.r === r;
  });
  return found ?? null;
}

export function objectiveOccupancy(state: GameState): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  state.objectiveHexes.forEach((h) => {
    out[hexKey(h)] = occupiedBy(state, h.q, h.r);
  });
  return out;
}

export function isBoardHex(state: GameState, q: number, r: number): boolean {
  return state.boardHexes.some((h) => h.q === q && h.r === r);
}

export function initialState(
  seed = 1337,
  setup: InitialStateSetup = {
    redWarbandId: "emberguard",
    blueWarbandId: "duskraiders",
    redRivalsDeckId: "blazing-assault",
    blueRivalsDeckId: "emberstone-hold",
  },
): GameState {
  const entities: Record<EntityId, Entity> = {};
  const idCounter = { value: 1 };

  const redRoster = starterWarbandById(setup.redWarbandId).fighters.map((src) => spawnFighter("red", src, entities));
  const blueRoster = starterWarbandById(setup.blueWarbandId).fighters.map((src) => spawnFighter("blue", src, entities));

  const redObj = shuffleWithSeed(rivalsObjectiveDeckById(setup.redRivalsDeckId), seed);
  const redPow = shuffleWithSeed(rivalsPowerDeckById(setup.redRivalsDeckId), redObj.seed);
  const blueObj = shuffleWithSeed(rivalsObjectiveDeckById(setup.blueRivalsDeckId), redPow.seed);
  const bluePow = shuffleWithSeed(rivalsPowerDeckById(setup.blueRivalsDeckId), blueObj.seed);

  const redObjDraw = drawN(redObj.result, 3);
  const redPowDraw = drawN(redPow.result, 5);
  const blueObjDraw = drawN(blueObj.result, 3);
  const bluePowDraw = drawN(bluePow.result, 5);

  spawnCards("red", "objective", "objective-hand", redObjDraw.hand, entities, idCounter);
  spawnCards("red", "objective", "objective-deck", redObjDraw.deck, entities, idCounter);
  spawnCards("red", "power", "power-hand", redPowDraw.hand, entities, idCounter);
  spawnCards("red", "power", "power-deck", redPowDraw.deck, entities, idCounter);

  spawnCards("blue", "objective", "objective-hand", blueObjDraw.hand, entities, idCounter);
  spawnCards("blue", "objective", "objective-deck", blueObjDraw.deck, entities, idCounter);
  spawnCards("blue", "power", "power-hand", bluePowDraw.hand, entities, idCounter);
  spawnCards("blue", "power", "power-deck", bluePowDraw.deck, entities, idCounter);

  const firstRoll = determineFirstTeam(bluePow.seed);

  const state: GameState = {
    seed,
    rngState: firstRoll.rngState,
    round: 1,
    turnInRound: 1,
    activeTeam: firstRoll.firstTeam,
    firstTeam: firstRoll.firstTeam,
    powerPriorityTeam: firstRoll.firstTeam,
    powerPassCount: 0,
    turnStep: "action",
    winner: null,
    boardHexes: createBoardHexes(),
    objectiveHexes: [{ q: 0, r: 0 }, { q: -1, r: 0 }, { q: 1, r: 0 }],
    occupiedObjectives: {},
    diceRollEvent: null,
    entities,
    teams: {
      red: {
        glory: 0,
        fighterEntities: redRoster,
        mulliganUsed: false,
        roundTakedowns: 0,
        roundSuccessfulAttacks: 0,
      },
      blue: {
        glory: 0,
        fighterEntities: blueRoster,
        mulliganUsed: false,
        roundTakedowns: 0,
        roundSuccessfulAttacks: 0,
      },
    },
    log: [
      {
        turn: 1,
        text: `Match started (roll-off red ${firstRoll.redRoll} vs blue ${firstRoll.blueRoll}; ${firstRoll.firstTeam} starts)`,
      },
    ],
  };

  state.occupiedObjectives = objectiveOccupancy(state);
  return state;
}

export function boardHexes(state: GameState) {
  return state.boardHexes;
}
