export const Phase = {
  Setup: "setup",
  Combat: "combat",
  End: "end",
  Finished: "finished",
} as const;

export type Phase = (typeof Phase)[keyof typeof Phase];

export const SetupStep = {
  MusterWarbands: "musterWarbands",
  DrawStartingHands: "drawStartingHands",
  Mulligan: "mulligan",
  DetermineTerritories: "determineTerritories",
  PlaceFeatureTokens: "placeFeatureTokens",
  DeployFighters: "deployFighters",
  Complete: "complete",
} as const;

export type SetupStep = (typeof SetupStep)[keyof typeof SetupStep];

export const TurnStep = {
  Action: "action",
  Power: "power",
} as const;

export type TurnStep = (typeof TurnStep)[keyof typeof TurnStep];

export const EndPhaseStep = {
  ScoreObjectives: "scoreObjectives",
  EquipUpgrades: "equipUpgrades",
  DiscardCards: "discardCards",
  DrawObjectives: "drawObjectives",
  DrawPowerCards: "drawPowerCards",
  Cleanup: "cleanup",
} as const;

export type EndPhaseStep = (typeof EndPhaseStep)[keyof typeof EndPhaseStep];

export const WarscrollAbilityEffectKind = {
  DrawPowerCards: "drawPowerCards",
  GainWarscrollTokens: "gainWarscrollTokens",
} as const;

export type WarscrollAbilityEffectKind =
  (typeof WarscrollAbilityEffectKind)[keyof typeof WarscrollAbilityEffectKind];

export const PloyEffectKind = {
  DrawPowerCards: "drawPowerCards",
  GainWarscrollTokens: "gainWarscrollTokens",
  GainFighterToken: "gainFighterToken",
} as const;

export type PloyEffectKind =
  (typeof PloyEffectKind)[keyof typeof PloyEffectKind];

export const PloyEffectTargetKind = {
  FriendlyFighter: "friendlyFighter",
  EnemyFighter: "enemyFighter",
} as const;

export type PloyEffectTargetKind =
  (typeof PloyEffectTargetKind)[keyof typeof PloyEffectTargetKind];

export const FighterTokenKind = {
  Move: "move",
  Charge: "charge",
  Guard: "guard",
  Stagger: "stagger",
} as const;

export type FighterTokenKind =
  (typeof FighterTokenKind)[keyof typeof FighterTokenKind];

export const DeckKind = {
  Objective: "objective",
  Power: "power",
} as const;

export type DeckKind = (typeof DeckKind)[keyof typeof DeckKind];

export const CardKind = {
  Objective: "objective",
  Ploy: "ploy",
  Upgrade: "upgrade",
} as const;

export type CardKind = (typeof CardKind)[keyof typeof CardKind];

export const ObjectiveConditionTiming = {
  Immediate: "immediate",
  EndPhase: "endPhase",
} as const;

export type ObjectiveConditionTiming =
  (typeof ObjectiveConditionTiming)[keyof typeof ObjectiveConditionTiming];

export const ObjectiveConditionKind = {
  AttackRollAllSuccesses: "attackRollAllSuccesses",
  SlayLeaderOrEqualOrGreaterHealth: "slayLeaderOrEqualOrGreaterHealth",
} as const;

export type ObjectiveConditionKind =
  (typeof ObjectiveConditionKind)[keyof typeof ObjectiveConditionKind];

export const CardZone = {
  ObjectiveDeck: "objectiveDeck",
  ObjectiveHand: "objectiveHand",
  ObjectiveDiscard: "objectiveDiscard",
  PowerDeck: "powerDeck",
  PowerHand: "powerHand",
  PowerDiscard: "powerDiscard",
  ScoredObjectives: "scoredObjectives",
  Equipped: "equipped",
  RemovedFromGame: "removedFromGame",
} as const;

export type CardZone = (typeof CardZone)[keyof typeof CardZone];

export const HexKind = {
  Empty: "empty",
  Blocked: "blocked",
  Stagger: "stagger",
} as const;

export type HexKind = (typeof HexKind)[keyof typeof HexKind];

export const FeatureTokenSide = {
  Hidden: "hidden",
  Treasure: "treasure",
  Cover: "cover",
} as const;

export type FeatureTokenSide = (typeof FeatureTokenSide)[keyof typeof FeatureTokenSide];

export const BoardSide = {
  Front: "front",
  Back: "back",
} as const;

export type BoardSide = (typeof BoardSide)[keyof typeof BoardSide];

export const WeaponAccuracy = {
  Hammer: "hammer",
  Sword: "sword",
} as const;

export type WeaponAccuracy = (typeof WeaponAccuracy)[keyof typeof WeaponAccuracy];

export const SaveSymbol = {
  Shield: "shield",
  Dodge: "dodge",
} as const;

export type SaveSymbol = (typeof SaveSymbol)[keyof typeof SaveSymbol];

export const AttackDieFace = {
  Critical: "critical",
  Hammer: "hammer",
  Sword: "sword",
  Support: "support",
  DoubleSupport: "doubleSupport",
  Blank: "blank",
} as const;

export type AttackDieFace = (typeof AttackDieFace)[keyof typeof AttackDieFace];

export const SaveDieFace = {
  Critical: "critical",
  Shield: "shield",
  Dodge: "dodge",
  Support: "support",
  DoubleSupport: "doubleSupport",
  Blank: "blank",
} as const;

export type SaveDieFace = (typeof SaveDieFace)[keyof typeof SaveDieFace];

export const WeaponAbilityKind = {
  Grievous: "grievous",
  Brutal: "brutal",
  Ensnare: "ensnare",
  Cleave: "cleave",
  Stagger: "stagger",
  Grapple: "grapple",
} as const;

export type WeaponAbilityKind = (typeof WeaponAbilityKind)[keyof typeof WeaponAbilityKind];

export const GameActionKind = {
  Move: "move",
  Attack: "attack",
  Charge: "charge",
  Guard: "guard",
  Focus: "focus",
  PlayPloy: "playPloy",
  PlayUpgrade: "playUpgrade",
  UseWarscrollAbility: "useWarscrollAbility",
  Delve: "delve",
  Pass: "pass",
} as const;

export type GameActionKind = (typeof GameActionKind)[keyof typeof GameActionKind];

export const SetupActionKind = {
  CompleteMuster: "completeMuster",
  DrawStartingHands: "drawStartingHands",
  ResolveMulligan: "resolveMulligan",
  ResolveTerritoryRollOff: "resolveTerritoryRollOff",
  ChooseTerritory: "chooseTerritory",
  PlaceFeatureToken: "placeFeatureToken",
  DeployFighter: "deployFighter",
} as const;

export type SetupActionKind = (typeof SetupActionKind)[keyof typeof SetupActionKind];

export const EndPhaseActionKind = {
  ResolveScoreObjectives: "resolveScoreObjectives",
  ResolveEquipUpgrades: "resolveEquipUpgrades",
  ResolveDiscardCards: "resolveDiscardCards",
  ResolveDrawObjectives: "resolveDrawObjectives",
  ResolveDrawPowerCards: "resolveDrawPowerCards",
  ResolveCleanup: "resolveCleanup",
} as const;

export type EndPhaseActionKind = (typeof EndPhaseActionKind)[keyof typeof EndPhaseActionKind];

export const RollOffKind = {
  TerritoryChoice: "territoryChoice",
  FirstTurn: "firstTurn",
} as const;

export type RollOffKind = (typeof RollOffKind)[keyof typeof RollOffKind];

export const CombatOutcome = {
  Success: "success",
  Draw: "draw",
  Failure: "failure",
} as const;

export type CombatOutcome = (typeof CombatOutcome)[keyof typeof CombatOutcome];

export const GameOutcomeKind = {
  Winner: "winner",
  Draw: "draw",
} as const;

export type GameOutcomeKind = (typeof GameOutcomeKind)[keyof typeof GameOutcomeKind];
