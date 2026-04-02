import type { Phase, TurnStep } from "../values/enums";
import type { PlayerId } from "../values/ids";
import type { GameState } from "../state/GameState";

export class TurnStepChangeResolution {
  public readonly fromStateKind: GameState["kind"];
  public readonly toStateKind: GameState["kind"];
  public readonly fromPhase: Phase;
  public readonly toPhase: Phase;
  public readonly fromTurnStep: TurnStep | null;
  public readonly toTurnStep: TurnStep | null;
  public readonly fromActivePlayerId: PlayerId | null;
  public readonly toActivePlayerId: PlayerId | null;
  public readonly turnStepChanged: boolean;
  public readonly activePlayerChanged: boolean;

  public constructor(
    fromStateKind: GameState["kind"],
    toStateKind: GameState["kind"],
    fromPhase: Phase,
    toPhase: Phase,
    fromTurnStep: TurnStep | null,
    toTurnStep: TurnStep | null,
    fromActivePlayerId: PlayerId | null,
    toActivePlayerId: PlayerId | null,
  ) {
    this.fromStateKind = fromStateKind;
    this.toStateKind = toStateKind;
    this.fromPhase = fromPhase;
    this.toPhase = toPhase;
    this.fromTurnStep = fromTurnStep;
    this.toTurnStep = toTurnStep;
    this.fromActivePlayerId = fromActivePlayerId;
    this.toActivePlayerId = toActivePlayerId;
    this.turnStepChanged = fromTurnStep !== toTurnStep;
    this.activePlayerChanged = fromActivePlayerId !== toActivePlayerId;
  }
}
