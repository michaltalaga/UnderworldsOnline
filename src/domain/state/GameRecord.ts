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

export const GameRecordKind = {
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

export type GameRecordKind = (typeof GameRecordKind)[keyof typeof GameRecordKind];

export type GameRecordDataByKind = {
  [GameRecordKind.RoundStart]: RoundStartResolution;
  [GameRecordKind.Combat]: CombatResult;
  [GameRecordKind.Focus]: FocusResolution;
  [GameRecordKind.Delve]: DelveResolution;
  [GameRecordKind.Ploy]: PloyResolution;
  [GameRecordKind.Upgrade]: UpgradeResolution;
  [GameRecordKind.WarscrollAbility]: WarscrollAbilityResolution;
  [GameRecordKind.ObjectiveScoring]: ObjectiveScoringResolution;
  [GameRecordKind.ObjectiveDraw]: ObjectiveDrawResolution;
  [GameRecordKind.PowerDraw]: PowerDrawResolution;
  [GameRecordKind.Cleanup]: CleanupResolution;
};

export type GameRecord<TKind extends GameRecordKind = GameRecordKind> = {
  kind: TKind;
  data: GameRecordDataByKind[TKind];
};
