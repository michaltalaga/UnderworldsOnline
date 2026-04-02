import { CleanupResolution } from "../endPhase/CleanupResolution";
import { ObjectiveDrawResolution } from "../endPhase/ObjectiveDrawResolution";
import { ObjectiveScoringResolution } from "../endPhase/ObjectiveScoringResolution";
import { PowerDrawResolution } from "../endPhase/PowerDrawResolution";
import { ActionStepEndedResolution } from "../rules/ActionStepEndedResolution";
import { ActionStepStartedResolution } from "../rules/ActionStepStartedResolution";
import { CombatResult } from "../rules/CombatResult";
import { DelveResolution } from "../rules/DelveResolution";
import { FighterSlainResolution } from "../rules/FighterSlainResolution";
import { FocusResolution } from "../rules/FocusResolution";
import { GuardResolution } from "../rules/GuardResolution";
import { MoveResolution } from "../rules/MoveResolution";
import { PassResolution } from "../rules/PassResolution";
import { PowerStepEndedResolution } from "../rules/PowerStepEndedResolution";
import { PloyResolution } from "../rules/PloyResolution";
import { RoundStartResolution } from "../rules/RoundStartResolution";
import { TurnStepChangeResolution } from "../rules/TurnStepChangeResolution";
import { TurnEndedResolution } from "../rules/TurnEndedResolution";
import { TurnStartedResolution } from "../rules/TurnStartedResolution";
import { UpgradeResolution } from "../rules/UpgradeResolution";
import { WarscrollAbilityResolution } from "../rules/WarscrollAbilityResolution";
import type { EndPhaseActionKind, GameActionKind, SetupActionKind } from "../values/enums";
import type { CardId, FighterId, PlayerId } from "../values/ids";

export const GameEventKind = {
  RoundStart: "roundStart",
  ActionStepStarted: "actionStepStarted",
  TurnStarted: "turnStarted",
  Move: "move",
  Combat: "combat",
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
  [GameEventKind.Move]: MoveResolution;
  [GameEventKind.Combat]: CombatResult;
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
  [GameEventKind.ObjectiveScoring]: ObjectiveScoringResolution;
  [GameEventKind.ObjectiveDraw]: ObjectiveDrawResolution;
  [GameEventKind.PowerDraw]: PowerDrawResolution;
  [GameEventKind.Cleanup]: CleanupResolution;
};

export type GameEventInvokerKind = GameActionKind | SetupActionKind | EndPhaseActionKind;

export type GameEventMetadata = {
  roundNumber?: number;
  invokedByPlayerId?: PlayerId | null;
  invokedByFighterId?: FighterId | null;
  invokedByCardId?: CardId | null;
  actionKind?: GameEventInvokerKind | null;
};

export type GameEvent<TKind extends GameEventKind = GameEventKind> = {
  kind: TKind;
  roundNumber: number;
  invokedByPlayerId: PlayerId | null;
  invokedByFighterId: FighterId | null;
  invokedByCardId: CardId | null;
  actionKind: GameEventInvokerKind | null;
  data: GameEventDataByKind[TKind];
};

export const GameRecordKind = GameEventKind;

export type GameRecordKind = GameEventKind;

export type GameRecordDataByKind = GameEventDataByKind;

export type GameRecord<TKind extends GameRecordKind = GameRecordKind> = GameEvent<TKind>;
