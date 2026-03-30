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

export type Entity = {
  id: EntityId;
  components: Component[];
};

export type Component =
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

export type FighterComponent = {
  type: "fighter";
  team: TeamId;
};

export type NameComponent = {
  type: "name";
  value: string;
};

export type PositionComponent = {
  type: "position";
  pos: Hex;
};

export type HealthComponent = {
  type: "health";
  hp: number;
  maxHp: number;
};

export type CombatComponent = {
  type: "combat";
  move: number;
  attackDice: number;
  attackTrait: AttackTrait;
  attackRange: number;
  attackDamage: number;
  saveDice: number;
  saveTrait: SaveTrait;
  nextAttackBonusDamage: number;
};

export type StatusComponent = {
  type: "status";
  guard: boolean;
  charged: boolean;
};

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

export type CardOwnerComponent = {
  type: "cardOwner";
  owner: TeamId;
};

export type CardZoneComponent = {
  type: "cardZone";
  zone: CardZone;
};

export type ObjectiveCardComponent = {
  type: "objectiveCard";
  cardType: ObjectiveCardType;
};

export type PowerCardComponent = {
  type: "powerCard";
  cardType: PowerCardType;
};

export type GloryComponent = {
  type: "glory";
  value: number;
};

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
  entities: Record<EntityId, Entity>;
  teams: Record<TeamId, TeamState>;
  log: EventLogEntry[];
};

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
  objective: boolean;
  power: boolean;
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
