export type TeamId = "red" | "blue";
export type TurnStep = "action" | "power";

export type Hex = { q: number; r: number };

export type ObjectiveCardType = "hold-center" | "take-down" | "no-mercy";
export type PowerCardType = "sidestep" | "ferocious-strike" | "healing-potion";

export type ObjectiveCard = {
  id: string;
  name: string;
  type: ObjectiveCardType;
  glory: number;
};

export type PowerCard = {
  id: string;
  name: string;
  type: PowerCardType;
};

export type FighterStats = {
  maxHp: number;
  move: number;
  attackDice: number;
  attackRange: number;
  attackDamage: number;
  saveDice: number;
};

export type FighterEntity = {
  id: string;
  team: TeamId;
  name: string;
  pos: Hex;
  hp: number;
  stats: FighterStats;
  guard: boolean;
  charged: boolean;
  nextAttackBonusDamage: number;
};

export type WarbandData = {
  name: string;
  fighters: Array<Omit<FighterEntity, "team">>;
};

export type TeamState = {
  glory: number;
  fighters: string[];
  objectiveDeck: ObjectiveCard[];
  objectiveHand: ObjectiveCard[];
  scoredObjectives: ObjectiveCard[];
  powerDeck: PowerCard[];
  powerHand: PowerCard[];
  discardPower: PowerCard[];
  roundTakedowns: number;
  roundSuccessfulAttacks: number;
};

export type Components = {
  fighters: Record<string, FighterEntity>;
};

export type EventLogEntry = {
  turn: number;
  text: string;
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
  components: Components;
  teams: Record<TeamId, TeamState>;
  log: EventLogEntry[];
};

export type ActionBase = { actorTeam: TeamId };

export type MoveAction = ActionBase & {
  type: "move";
  fighterId: string;
  to: Hex;
};

export type GuardAction = ActionBase & {
  type: "guard";
  fighterId: string;
};

export type AttackAction = ActionBase & {
  type: "attack";
  attackerId: string;
  targetId: string;
};

export type ChargeAction = ActionBase & {
  type: "charge";
  fighterId: string;
  to: Hex;
  targetId: string;
};

export type PlayPowerCardAction = ActionBase & {
  type: "play-power";
  cardId: string;
  fighterId?: string;
  targetHex?: Hex;
};

export type PassAction = ActionBase & {
  type: "pass";
};

export type EndPowerStepAction = ActionBase & {
  type: "end-power";
};

export type GameAction =
  | MoveAction
  | GuardAction
  | AttackAction
  | ChargeAction
  | PlayPowerCardAction
  | PassAction
  | EndPowerStepAction;

export type LegalAction = {
  label: string;
  action: GameAction;
};
