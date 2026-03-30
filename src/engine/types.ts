import type { Card, Fighter, PlayerCardPools } from "./model";

export type TeamId = "red" | "blue";
export type TurnStep = "action" | "power";

export type AttackTrait = "hammer" | "sword";
export type SaveTrait = "shield" | "dodge";
export type AttackDieFace = "crit-attack" | "hammer" | "sword" | "support" | "double-support" | "blank";
export type SaveDieFace = "crit-save" | "shield" | "dodge" | "support" | "double-support" | "blank";

export type Hex = { q: number; r: number };

export type ObjectiveCardKind = "hold-center" | "take-down" | "no-mercy";
export type PowerCardKind = "sidestep" | "ferocious-strike" | "healing-potion";

export type ObjectiveCardSpec = {
  name: string;
  kind: ObjectiveCardKind;
  glory: number;
};

export type PowerCardSpec = {
  name: string;
  kind: PowerCardKind;
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

export type TeamState = {
  glory: number;
  fighters: Fighter[];
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
  fighters: Fighter[];
  cards: Card[];
  cardPools: Record<TeamId, PlayerCardPools>;
  teams: Record<TeamId, TeamState>;
  log: EventLogEntry[];
};

export type ActionBase = { actorTeam: TeamId };

export type MoveAction = ActionBase & {
  type: "move";
  fighter: Fighter;
  to: Hex;
};

export type GuardAction = ActionBase & {
  type: "guard";
  fighter: Fighter;
};

export type AttackAction = ActionBase & {
  type: "attack";
  attacker: Fighter;
  target: Fighter;
};

export type ChargeAction = ActionBase & {
  type: "charge";
  fighter: Fighter;
  to: Hex;
  target: Fighter;
};

export type PlayPowerCardAction = ActionBase & {
  type: "play-power";
  card: Card;
  fighter?: Fighter;
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
