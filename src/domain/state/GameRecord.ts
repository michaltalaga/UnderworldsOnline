import { CleanupResolution } from "../endPhase/CleanupResolution";
import { ObjectiveDrawResolution } from "../endPhase/ObjectiveDrawResolution";
import { ObjectiveScoringResolution } from "../endPhase/ObjectiveScoringResolution";
import { PowerDrawResolution } from "../endPhase/PowerDrawResolution";
import { CombatResult } from "../rules/CombatResult";
import { DelveResolution } from "../rules/DelveResolution";
import { FocusResolution } from "../rules/FocusResolution";
import { PloyResolution } from "../rules/PloyResolution";
import { RoundStartResolution } from "../rules/RoundStartResolution";
import { UpgradeResolution } from "../rules/UpgradeResolution";
import { WarscrollAbilityResolution } from "../rules/WarscrollAbilityResolution";
import type { EndPhaseActionKind, GameActionKind, SetupActionKind } from "../values/enums";
import type { CardId, FighterId, PlayerId } from "../values/ids";

export const GameEventKind = {
  RoundStart: "roundStart",
  Combat: "combat",
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
  [GameEventKind.Combat]: CombatResult;
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
