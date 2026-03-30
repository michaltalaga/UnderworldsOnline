import { createBoardHexes } from "./boardShape";
import { rivalsObjectiveDeckById, rivalsPowerDeckById, starterWarbandById } from "./data/starterData";
import { hexKey } from "./hex";
import { rollD6, shuffleWithSeed } from "./rng";
import { Engine } from "@trixt0r/ecs";
import type { RivalsDeckId, WarbandId } from "./data/starterData";
import type {
  AttackDieFace,
  CardZone,
  EntityId,
  FighterArchetype,
  GameState,
  ObjectiveCard,
  PowerCard,
  TeamId,
} from "./types";
import {
  CardOwnerComponent,
  CardZoneComponent,
  cloneGameEntity,
  CombatComponent,
  FighterComponent,
  GameEntity,
  GloryComponent,
  HealthComponent,
  NameComponent,
  ObjectiveCardComponent,
  PositionComponent,
  PowerCardComponent,
  StatusComponent,
  type ComponentType,
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

function addEntity(state: Pick<GameState, "ecs" | "entities">, entity: GameEntity): void {
  const id = entity.id as EntityId;
  state.ecs.entities.add(entity);
  state.entities[id] = entity;
}

function addEntityToRecord(entities: Record<EntityId, GameEntity>, id: EntityId, entity: GameEntity): void {
  entities[id] = entity;
}

function spawnFighter(team: TeamId, src: FighterArchetype, entities: Record<EntityId, GameEntity>): EntityId {
  const id = `${team}-${src.id}`;
  addEntityToRecord(
    entities,
    id,
    new GameEntity(id, [
      new FighterComponent(team),
      new NameComponent(src.name),
      new PositionComponent({ ...src.pos }),
      new HealthComponent(src.hp, src.stats.maxHp),
      new CombatComponent(
        src.stats.move,
        src.stats.attackDice,
        src.stats.attackTrait,
        src.stats.attackRange,
        src.stats.attackDamage,
        src.stats.saveDice,
        src.stats.saveTrait,
        0,
      ),
      new StatusComponent(false, false),
    ]),
  );
  return id;
}

function spawnCards(
  team: TeamId,
  kind: "objective" | "power",
  zone: CardZone,
  cards: ObjectiveCard[] | PowerCard[],
  entities: Record<EntityId, GameEntity>,
  idCounter: { value: number },
): EntityId[] {
  return cards.map((card, idx) => {
    const id = `${team}-${kind}-${zone}-${idx}-${idCounter.value}`;
    idCounter.value += 1;
    const components: import("./types").GameComponent[] = [
      new NameComponent(card.name),
      new CardOwnerComponent(team),
      new CardZoneComponent(zone),
    ];
    if (kind === "objective") {
      const obj = card as ObjectiveCard;
      components.push(new ObjectiveCardComponent(obj.type));
      components.push(new GloryComponent(obj.glory));
    } else {
      const power = card as PowerCard;
      components.push(new PowerCardComponent(power.type));
    }
    addEntityToRecord(entities, id, new GameEntity(id, components));
    return id;
  });
}
// ECS helpers
function entity(state: GameState, id: EntityId): GameEntity {
  const found = state.ecs.entities.get(id) ?? state.entities[id];
  if (!found) throw new Error(`Missing entity: ${id}`);
  return found;
}

function hasComponents(gameEntity: GameEntity, types: ComponentType[]): boolean {
  return types.every((type) => {
    switch (type) {
      case "fighter":
        return Boolean(gameEntity.components.get(FighterComponent));
      case "name":
        return Boolean(gameEntity.components.get(NameComponent));
      case "position":
        return Boolean(gameEntity.components.get(PositionComponent));
      case "health":
        return Boolean(gameEntity.components.get(HealthComponent));
      case "combat":
        return Boolean(gameEntity.components.get(CombatComponent));
      case "status":
        return Boolean(gameEntity.components.get(StatusComponent));
      case "cardOwner":
        return Boolean(gameEntity.components.get(CardOwnerComponent));
      case "cardZone":
        return Boolean(gameEntity.components.get(CardZoneComponent));
      case "objectiveCard":
        return Boolean(gameEntity.components.get(ObjectiveCardComponent));
      case "powerCard":
        return Boolean(gameEntity.components.get(PowerCardComponent));
      case "glory":
        return Boolean(gameEntity.components.get(GloryComponent));
      default:
        return false;
    }
  });
}

export function fighterEntityIds(state: GameState, team?: TeamId): EntityId[] {
  if (team) return [...state.teams[team].fighterEntities];
  return [...state.teams.red.fighterEntities, ...state.teams.blue.fighterEntities];
}

export function entityIdsWithComponents(state: GameState, required: ComponentType[]): EntityId[] {
  return state.ecs.entities
    .filter((e) => hasComponents(e, required))
    .map((e) => e.id as EntityId);
}

export function isAlive(state: GameState, fighterId: EntityId): boolean {
  const health = entity(state, fighterId).components.get(HealthComponent);
  return !!health && health.hp > 0;
}

export function fighterName(state: GameState, fighterId: EntityId): string {
  return entity(state, fighterId).components.get(NameComponent)?.value ?? fighterId;
}

export function fighterTeam(state: GameState, fighterId: EntityId): import("./types").TeamId {
  return entity(state, fighterId).components.get(FighterComponent)!.team;
}

export function fighterPos(state: GameState, fighterId: EntityId): import("./types").Hex {
  return entity(state, fighterId).components.get(PositionComponent)!.pos;
}

export function fighterHealth(state: GameState, fighterId: EntityId) {
  return entity(state, fighterId).components.get(HealthComponent)!;
}

export function fighterCombat(state: GameState, fighterId: EntityId) {
  return entity(state, fighterId).components.get(CombatComponent)!;
}

export function fighterStatus(state: GameState, fighterId: EntityId) {
  return entity(state, fighterId).components.get(StatusComponent)!;
}

export function cardName(state: GameState, cardId: EntityId): string {
  return entity(state, cardId).components.get(NameComponent)?.value ?? cardId;
}

export function cardIsObjective(state: GameState, cardId: EntityId): boolean {
  return Boolean(entity(state, cardId).components.get(ObjectiveCardComponent));
}

export function cardIsPower(state: GameState, cardId: EntityId): boolean {
  return Boolean(entity(state, cardId).components.get(PowerCardComponent));
}

export function cardObjectiveType(state: GameState, cardId: EntityId) {
  return entity(state, cardId).components.get(ObjectiveCardComponent)?.cardType;
}

export function cardPowerType(state: GameState, cardId: EntityId) {
  return entity(state, cardId).components.get(PowerCardComponent)?.cardType;
}

export function cardGloryValue(state: GameState, cardId: EntityId): number {
  return entity(state, cardId).components.get(GloryComponent)?.value ?? 0;
}

export function cardEntityIdsInZone(state: GameState, team: TeamId, zone: CardZone): EntityId[] {
  return entityIdsWithComponents(state, ["cardOwner", "cardZone"]).filter((id) => {
    const e = entity(state, id);
    const owner = e.components.get(CardOwnerComponent);
    const cz = e.components.get(CardZoneComponent);
    return owner?.owner === team && cz?.zone === zone;
  });
}

export function moveCardEntityToZone(state: GameState, cardId: EntityId, zone: CardZone): void {
  const e = entity(state, cardId);
  const cz = e.components.get(CardZoneComponent);
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
  const entities: Record<EntityId, GameEntity> = {};
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

  const ecs = new Engine<GameEntity>();
  Object.values(entities).forEach((gameEntity) => {
    ecs.entities.add(gameEntity);
  });

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
    ecs,
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

export function cloneState(state: GameState): GameState {
  const ecs = new Engine<GameEntity>();
  const entities: Record<EntityId, GameEntity> = {};

  Object.values(state.entities).forEach((gameEntity) => {
    const copy = cloneGameEntity(gameEntity);
    addEntity({ ecs, entities }, copy);
  });

  return {
    seed: state.seed,
    rngState: state.rngState,
    round: state.round,
    turnInRound: state.turnInRound,
    activeTeam: state.activeTeam,
    firstTeam: state.firstTeam,
    powerPriorityTeam: state.powerPriorityTeam,
    powerPassCount: state.powerPassCount,
    turnStep: state.turnStep,
    winner: state.winner,
    boardHexes: state.boardHexes.map((hex) => ({ ...hex })),
    objectiveHexes: state.objectiveHexes.map((hex) => ({ ...hex })),
    occupiedObjectives: { ...state.occupiedObjectives },
    diceRollEvent: state.diceRollEvent
      ? {
          ...state.diceRollEvent,
          attackFaces: state.diceRollEvent.attackFaces.map((face) => ({ ...face })),
          defenseFaces: state.diceRollEvent.defenseFaces.map((face) => ({ ...face })),
        }
      : null,
    ecs,
    entities,
    teams: {
      red: { ...state.teams.red, fighterEntities: [...state.teams.red.fighterEntities] },
      blue: { ...state.teams.blue, fighterEntities: [...state.teams.blue.fighterEntities] },
    },
    log: state.log.map((entry) => ({ ...entry })),
  };
}
