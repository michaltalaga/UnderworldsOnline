import { CleanupResolution } from "../endPhase/CleanupResolution";
import { ObjectiveDrawResolution } from "../endPhase/ObjectiveDrawResolution";
import { ObjectiveScoringResolution } from "../endPhase/ObjectiveScoringResolution";
import { PowerDrawResolution } from "../endPhase/PowerDrawResolution";
import { ActionStepEndedResolution } from "../rules/ActionStepEndedResolution";
import { ActionStepStartedResolution } from "../rules/ActionStepStartedResolution";
import { CardPlayedResolution } from "../rules/CardPlayedResolution";
import { CardResolvedResolution } from "../rules/CardResolvedResolution";
import { CombatEndedResolution } from "../rules/CombatEndedResolution";
import { CombatResult } from "../rules/CombatResult";
import { CombatStartedResolution } from "../rules/CombatStartedResolution";
import { DelveResolution } from "../rules/DelveResolution";
import { FighterSlainResolution } from "../rules/FighterSlainResolution";
import { FocusResolution } from "../rules/FocusResolution";
import { GuardResolution } from "../rules/GuardResolution";
import { MoveResolution } from "../rules/MoveResolution";
import { PassResolution } from "../rules/PassResolution";
import { PowerStepEndedResolution } from "../rules/PowerStepEndedResolution";
import { PloyResolution } from "../rules/PloyResolution";
import { RollOffResult } from "../rules/RollOffResult";
import { RoundStartResolution } from "../rules/RoundStartResolution";
import { TurnStepChangeResolution } from "../rules/TurnStepChangeResolution";
import { TurnEndedResolution } from "../rules/TurnEndedResolution";
import { TurnStartedResolution } from "../rules/TurnStartedResolution";
import { UpgradeResolution } from "../rules/UpgradeResolution";
import { WarscrollAbilityResolution } from "../rules/WarscrollAbilityResolution";
import type { EndPhaseActionKind, GameActionKind, SetupActionKind } from "../values/enums";
import type { Card } from "../cards/Card";
import type { Fighter } from "./Fighter";
import type { Player } from "./Player";

export const GameEventKind = {
  RoundStart: "roundStart",
  ActionStepStarted: "actionStepStarted",
  TurnStarted: "turnStarted",
  CardPlayed: "cardPlayed",
  Move: "move",
  CombatStarted: "combatStarted",
  Combat: "combat",
  CombatEnded: "combatEnded",
  CardResolved: "cardResolved",
  FighterSlain: "fighterSlain",
  Guard: "guard",
  Pass: "pass",
  ActionStepEnded: "actionStepEnded",
  PowerStepEnded: "powerStepEnded",
  TurnEnded: "turnEnded",
  TurnStepChanged: "turnStepChanged",
  Focus: "focus",
  Delve: "delve",
  Ploy: "ploy",
  Upgrade: "upgrade",
  WarscrollAbility: "warscrollAbility",
  RollOff: "rollOff",
  ObjectiveScoring: "objectiveScoring",
  ObjectiveDraw: "objectiveDraw",
  PowerDraw: "powerDraw",
  Cleanup: "cleanup",
} as const;

export type GameEventKind = (typeof GameEventKind)[keyof typeof GameEventKind];

export type GameEventDataByKind = {
  [GameEventKind.RoundStart]: RoundStartResolution;
  [GameEventKind.ActionStepStarted]: ActionStepStartedResolution;
  [GameEventKind.TurnStarted]: TurnStartedResolution;
  [GameEventKind.CardPlayed]: CardPlayedResolution;
  [GameEventKind.Move]: MoveResolution;
  [GameEventKind.CombatStarted]: CombatStartedResolution;
  [GameEventKind.Combat]: CombatResult;
  [GameEventKind.CombatEnded]: CombatEndedResolution;
  [GameEventKind.CardResolved]: CardResolvedResolution;
  [GameEventKind.FighterSlain]: FighterSlainResolution;
  [GameEventKind.Guard]: GuardResolution;
  [GameEventKind.Pass]: PassResolution;
  [GameEventKind.ActionStepEnded]: ActionStepEndedResolution;
  [GameEventKind.PowerStepEnded]: PowerStepEndedResolution;
  [GameEventKind.TurnEnded]: TurnEndedResolution;
  [GameEventKind.TurnStepChanged]: TurnStepChangeResolution;
  [GameEventKind.Focus]: FocusResolution;
  [GameEventKind.Delve]: DelveResolution;
  [GameEventKind.Ploy]: PloyResolution;
  [GameEventKind.Upgrade]: UpgradeResolution;
  [GameEventKind.WarscrollAbility]: WarscrollAbilityResolution;
  [GameEventKind.RollOff]: RollOffResult;
  [GameEventKind.ObjectiveScoring]: ObjectiveScoringResolution;
  [GameEventKind.ObjectiveDraw]: ObjectiveDrawResolution;
  [GameEventKind.PowerDraw]: PowerDrawResolution;
  [GameEventKind.Cleanup]: CleanupResolution;
};

export type GameEventInvokerKind = GameActionKind | SetupActionKind | EndPhaseActionKind;

export type GameEventMetadata = {
  roundNumber?: number;
  invokedByPlayer?: Player | null;
  invokedByFighter?: Fighter | null;
  invokedByCard?: Card | null;
  actionKind?: GameEventInvokerKind | null;
};

export type GameEvent<TKind extends GameEventKind = GameEventKind> = {
  kind: TKind;
  roundNumber: number;
  invokedByPlayer: Player | null;
  invokedByFighter: Fighter | null;
  invokedByCard: Card | null;
  actionKind: GameEventInvokerKind | null;
  data: GameEventDataByKind[TKind];
};

export const GameRecordKind = GameEventKind;

export type GameRecordKind = GameEventKind;

export type GameRecordDataByKind = GameEventDataByKind;

export type GameRecord<TKind extends GameRecordKind = GameRecordKind> = GameEvent<TKind>;
