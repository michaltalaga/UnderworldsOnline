import { AbstractEntity, Engine } from "@trixt0r/ecs";

export type EntityId = string;

export type TeamId = "red" | "blue";
export type TurnStep = "action" | "power";

export type AttackTrait = "hammer" | "sword";
export type SaveTrait = "shield" | "dodge";
export type AttackDieFace = "crit-attack" | "hammer" | "sword" | "support" | "double-support" | "blank";
export type SaveDieFace = "crit-save" | "shield" | "dodge" | "support" | "double-support" | "blank";

export type Hex = { q: number; r: number };

export type ObjectiveCardType = "hold-center" | "take-down" | "no-mercy";
export type PowerCardType = "sidestep" | "ferocious-strike" | "healing-potion";

export type ObjectiveCard = {
  name: string;
  type: ObjectiveCardType;
  glory: number;
};

export type PowerCard = {
  name: string;
  type: PowerCardType;
};

export type FighterStats = {
  maxHp: number;
  move: number;
  attackDice: number;
  attackTrait: AttackTrait;
  attackRange: number;
  attackDamage: number;
  saveDice: number;
  saveTrait: SaveTrait;
};

export type FighterArchetype = {
  id: string;
  name: string;
  pos: Hex;
  hp: number;
  stats: FighterStats;
};

export type WarbandData = {
  name: string;
  fighters: FighterArchetype[];
};

export class FighterComponent {
  team: TeamId;

  constructor(team: TeamId) {
    this.team = team;
  }
}

export class NameComponent {
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class PositionComponent {
  pos: Hex;

  constructor(pos: Hex) {
    this.pos = pos;
  }
}

export class HealthComponent {
  hp: number;
  maxHp: number;

  constructor(hp: number, maxHp: number) {
    this.hp = hp;
    this.maxHp = maxHp;
  }
}

export class CombatComponent {
  move: number;
  attackDice: number;
  attackTrait: AttackTrait;
  attackRange: number;
  attackDamage: number;
  saveDice: number;
  saveTrait: SaveTrait;
  nextAttackBonusDamage: number;

  constructor(
    move: number,
    attackDice: number,
    attackTrait: AttackTrait,
    attackRange: number,
    attackDamage: number,
    saveDice: number,
    saveTrait: SaveTrait,
    nextAttackBonusDamage: number,
  ) {
    this.move = move;
    this.attackDice = attackDice;
    this.attackTrait = attackTrait;
    this.attackRange = attackRange;
    this.attackDamage = attackDamage;
    this.saveDice = saveDice;
    this.saveTrait = saveTrait;
    this.nextAttackBonusDamage = nextAttackBonusDamage;
  }
}

export class StatusComponent {
  guard: boolean;
  charged: boolean;

  constructor(guard: boolean, charged: boolean) {
    this.guard = guard;
    this.charged = charged;
  }
}

export type CardZone =
  | "objective-deck"
  | "objective-hand"
  | "objective-discard"
  | "objective-temp-discard"
  | "objective-scored"
  | "power-deck"
  | "power-hand"
  | "power-discard"
  | "power-temp-discard";

export class CardOwnerComponent {
  owner: TeamId;

  constructor(owner: TeamId) {
    this.owner = owner;
  }
}

export class CardZoneComponent {
  zone: CardZone;

  constructor(zone: CardZone) {
    this.zone = zone;
  }
}

export class ObjectiveCardComponent {
  cardType: ObjectiveCardType;

  constructor(cardType: ObjectiveCardType) {
    this.cardType = cardType;
  }
}

export class PowerCardComponent {
  cardType: PowerCardType;

  constructor(cardType: PowerCardType) {
    this.cardType = cardType;
  }
}

export class GloryComponent {
  value: number;

  constructor(value: number) {
    this.value = value;
  }
}

export type GameComponent =
  | FighterComponent
  | NameComponent
  | PositionComponent
  | HealthComponent
  | CombatComponent
  | StatusComponent
  | CardOwnerComponent
  | CardZoneComponent
  | ObjectiveCardComponent
  | PowerCardComponent
  | GloryComponent;

export class GameEntity extends AbstractEntity<GameComponent> {
  constructor(id: EntityId, components: GameComponent[] = []) {
    super(id);
    if (components.length > 0) {
      this.components.add(...components);
    }
  }
}

export type ComponentType =
  | "fighter"
  | "name"
  | "position"
  | "health"
  | "combat"
  | "status"
  | "cardOwner"
  | "cardZone"
  | "objectiveCard"
  | "powerCard"
  | "glory";

export type TeamState = {
  glory: number;
  fighterEntities: EntityId[];
  mulliganUsed: boolean;
  roundTakedowns: number;
  roundSuccessfulAttacks: number;
};

export type EventLogEntry = {
  turn: number;
  text: string;
};

export type DiceFace = {
  face: AttackDieFace | SaveDieFace;
  result: "crit" | "success" | "fail";
};

export type DiceRollEvent = {
  turn: number;
  attackerName: string;
  defenderName: string;
  attackFaces: DiceFace[];
  defenseFaces: DiceFace[];
};

export type GameState = {
  seed: number;
  rngState: number;
  round: number;
  turnInRound: number;
  activeTeam: TeamId;
  firstTeam: TeamId;
  powerPriorityTeam: TeamId;
  powerPassCount: number;
  turnStep: TurnStep;
  winner: TeamId | "draw" | null;
  boardHexes: Hex[];
  objectiveHexes: Hex[];
  occupiedObjectives: Record<string, string | null>;
  diceRollEvent: DiceRollEvent | null;
  ecs: Engine<GameEntity>;
  entities: Record<EntityId, GameEntity>;
  teams: Record<TeamId, TeamState>;
  log: EventLogEntry[];
};

export function cloneGameComponent(component: GameComponent): GameComponent {
  if (component instanceof FighterComponent) return new FighterComponent(component.team);
  if (component instanceof NameComponent) return new NameComponent(component.value);
  if (component instanceof PositionComponent) return new PositionComponent({ ...component.pos });
  if (component instanceof HealthComponent) return new HealthComponent(component.hp, component.maxHp);
  if (component instanceof CombatComponent) {
    return new CombatComponent(
      component.move,
      component.attackDice,
      component.attackTrait,
      component.attackRange,
      component.attackDamage,
      component.saveDice,
      component.saveTrait,
      component.nextAttackBonusDamage,
    );
  }
  if (component instanceof StatusComponent) return new StatusComponent(component.guard, component.charged);
  if (component instanceof CardOwnerComponent) return new CardOwnerComponent(component.owner);
  if (component instanceof CardZoneComponent) return new CardZoneComponent(component.zone);
  if (component instanceof ObjectiveCardComponent) return new ObjectiveCardComponent(component.cardType);
  if (component instanceof PowerCardComponent) return new PowerCardComponent(component.cardType);
  return new GloryComponent(component.value);
}

export function cloneGameEntity(entity: GameEntity): GameEntity {
  return new GameEntity(entity.id as EntityId, entity.components.map(cloneGameComponent));
}

export type ActionBase = { actorTeam: TeamId };

export type MoveAction = ActionBase & {
  type: "move";
  fighterId: EntityId;
  to: Hex;
};

export type GuardAction = ActionBase & {
  type: "guard";
  fighterId: EntityId;
};

export type AttackAction = ActionBase & {
  type: "attack";
  attackerId: EntityId;
  targetId: EntityId;
};

export type ChargeAction = ActionBase & {
  type: "charge";
  fighterId: EntityId;
  to: Hex;
  targetId: EntityId;
};

export type PlayPowerCardAction = ActionBase & {
  type: "play-power";
  cardId: EntityId;
  fighterId?: EntityId;
  targetHex?: Hex;
};

export type PassAction = ActionBase & {
  type: "pass";
};

export type EndPowerStepAction = ActionBase & {
  type: "end-power";
};

export type StartMulliganAction = ActionBase & {
  type: "start-mulligan";
};

export type ResolveMulliganAction = ActionBase & {
  type: "resolve-mulligan";
};

export type GameAction =
  | MoveAction
  | GuardAction
  | AttackAction
  | ChargeAction
  | PlayPowerCardAction
  | PassAction
  | EndPowerStepAction
  | StartMulliganAction
  | ResolveMulliganAction;

export type LegalAction = {
  label: string;
  action: GameAction;
};
