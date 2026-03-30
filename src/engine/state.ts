import { createBoardHexes } from "./boardShape";
import { rivalsObjectiveDeckById, rivalsPowerDeckById, starterWarbandById } from "./data/starterData";
import { hexKey } from "./hex";
import { rollD6, shuffleWithSeed } from "./rng";
import type { RivalsDeckId, WarbandId } from "./data/starterData";
import type {
  AttackDieFace,
  CardComponent,
  CardZone,
  Components,
  Entity,
  EntityId,
  FighterArchetype,
  GameState,
  Hex,
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

function addEntity(
  entities: Record<EntityId, Entity>,
  id: EntityId,
  componentNames: string[],
): void {
  entities[id] = { id, components: componentNames };
}

function spawnFighter(
  team: TeamId,
  src: FighterArchetype,
  entities: Record<EntityId, Entity>,
  components: Components,
): EntityId {
  const id = `${team}-${src.id}`;
  addEntity(entities, id, ["fighter", "name", "position", "health", "combat", "status"]);

  components.fighter[id] = { team };
  components.name[id] = { value: src.name };
  components.position[id] = { pos: { ...src.pos } };
  components.health[id] = { hp: src.hp, maxHp: src.stats.maxHp };
  components.combat[id] = {
    move: src.stats.move,
    attackDice: src.stats.attackDice,
    attackTrait: src.stats.attackTrait,
    attackRange: src.stats.attackRange,
    attackDamage: src.stats.attackDamage,
    saveDice: src.stats.saveDice,
    saveTrait: src.stats.saveTrait,
    nextAttackBonusDamage: 0,
  };
  components.status[id] = { guard: false, charged: false };

  return id;
}

function spawnCards(
  team: TeamId,
  kind: "objective" | "power",
  zone: CardZone,
  cards: ObjectiveCard[] | PowerCard[],
  entities: Record<EntityId, Entity>,
  components: Components,
  idCounter: { value: number },
): EntityId[] {
  return cards.map((card, idx) => {
    const id = `${team}-${kind}-${zone}-${idx}-${idCounter.value}`;
    idCounter.value += 1;
    addEntity(entities, id, ["card"]);

    const base: CardComponent = {
      owner: team,
      zone,
      kind,
      name: card.name,
    };

    if (kind === "objective") {
      const obj = card as ObjectiveCard;
      base.objectiveType = obj.type;
      base.glory = obj.glory;
    } else {
      const power = card as PowerCard;
      base.powerType = power.type;
    }

    components.card[id] = base;
    return id;
  });
}

export function fighterEntityIds(state: GameState, team?: TeamId): EntityId[] {
  if (team) return [...state.teams[team].fighterEntities];
  return [...state.teams.red.fighterEntities, ...state.teams.blue.fighterEntities];
}

export function isAlive(state: GameState, fighterId: EntityId): boolean {
  const health = state.components.health[fighterId];
  return Boolean(health) && health.hp > 0;
}

export function fighterName(state: GameState, fighterId: EntityId): string {
  return state.components.name[fighterId]?.value ?? fighterId;
}

export function fighterTeam(state: GameState, fighterId: EntityId): TeamId {
  return state.components.fighter[fighterId].team;
}

export function fighterPos(state: GameState, fighterId: EntityId): Hex {
  return state.components.position[fighterId].pos;
}

export function fighterHealth(state: GameState, fighterId: EntityId) {
  return state.components.health[fighterId];
}

export function fighterCombat(state: GameState, fighterId: EntityId) {
  return state.components.combat[fighterId];
}

export function fighterStatus(state: GameState, fighterId: EntityId) {
  return state.components.status[fighterId];
}

export function cardById(state: GameState, cardId: EntityId): CardComponent | null {
  return state.components.card[cardId] ?? null;
}

export function cardEntityIdsInZone(state: GameState, team: TeamId, zone: CardZone): EntityId[] {
  return Object.keys(state.components.card).filter((id) => {
    const card = state.components.card[id];
    return card.owner === team && card.zone === zone;
  });
}

export function moveCardEntityToZone(state: GameState, cardId: EntityId, zone: CardZone): void {
  const card = state.components.card[cardId];
  if (!card) return;
  card.zone = zone;
}

export function occupiedBy(state: GameState, q: number, r: number): EntityId | null {
  const fighters = fighterEntityIds(state);
  const found = fighters.find((id) => {
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
  const components: Components = {
    fighter: {},
    name: {},
    position: {},
    health: {},
    combat: {},
    status: {},
    card: {},
  };

  const redRoster = starterWarbandById(setup.redWarbandId).fighters.map((src) =>
    spawnFighter("red", src, entities, components),
  );
  const blueRoster = starterWarbandById(setup.blueWarbandId).fighters.map((src) =>
    spawnFighter("blue", src, entities, components),
  );

  const redObj = shuffleWithSeed(rivalsObjectiveDeckById(setup.redRivalsDeckId), seed);
  const redPow = shuffleWithSeed(rivalsPowerDeckById(setup.redRivalsDeckId), redObj.seed);
  const blueObj = shuffleWithSeed(rivalsObjectiveDeckById(setup.blueRivalsDeckId), redPow.seed);
  const bluePow = shuffleWithSeed(rivalsPowerDeckById(setup.blueRivalsDeckId), blueObj.seed);

  const redObjDraw = drawN(redObj.result, 3);
  const redPowDraw = drawN(redPow.result, 5);
  const blueObjDraw = drawN(blueObj.result, 3);
  const bluePowDraw = drawN(bluePow.result, 5);

  spawnCards("red", "objective", "objective-hand", redObjDraw.hand, entities, components, idCounter);
  spawnCards("red", "objective", "objective-deck", redObjDraw.deck, entities, components, idCounter);
  spawnCards("red", "power", "power-hand", redPowDraw.hand, entities, components, idCounter);
  spawnCards("red", "power", "power-deck", redPowDraw.deck, entities, components, idCounter);

  spawnCards("blue", "objective", "objective-hand", blueObjDraw.hand, entities, components, idCounter);
  spawnCards("blue", "objective", "objective-deck", blueObjDraw.deck, entities, components, idCounter);
  spawnCards("blue", "power", "power-hand", bluePowDraw.hand, entities, components, idCounter);
  spawnCards("blue", "power", "power-deck", bluePowDraw.deck, entities, components, idCounter);

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
    components,
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
