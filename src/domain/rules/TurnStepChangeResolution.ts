import type { Phase, TurnStep } from "../values/enums";
import type { PlayerId } from "../values/ids";
import type { GameState } from "../state/GameState";
import type { Player } from "../state/Player";

export class TurnStepChangeResolution {
  public readonly fromStateKind: GameState["kind"];
  public readonly toStateKind: GameState["kind"];
  public readonly fromPhase: Phase;
  public readonly toPhase: Phase;
  public readonly fromTurnStep: TurnStep | null;
  public readonly toTurnStep: TurnStep | null;
  public readonly fromActivePlayer: Player | null;
  public readonly toActivePlayer: Player | null;
  public readonly turnStepChanged: boolean;
  public readonly activePlayerChanged: boolean;

  public constructor(
    fromStateKind: GameState["kind"],
    toStateKind: GameState["kind"],
    fromPhase: Phase,
    toPhase: Phase,
    fromTurnStep: TurnStep | null,
    toTurnStep: TurnStep | null,
    fromActivePlayer: Player | null,
    toActivePlayer: Player | null,
  ) {
    this.fromStateKind = fromStateKind;
    this.toStateKind = toStateKind;
    this.fromPhase = fromPhase;
    this.toPhase = toPhase;
    this.fromTurnStep = fromTurnStep;
    this.toTurnStep = toTurnStep;
    this.fromActivePlayer = fromActivePlayer;
    this.toActivePlayer = toActivePlayer;
    this.turnStepChanged = fromTurnStep !== toTurnStep;
    this.activePlayerChanged = fromActivePlayer !== toActivePlayer;
  }

  public get fromActivePlayerId(): PlayerId | null { return this.fromActivePlayer?.id ?? null; }
  public get toActivePlayerId(): PlayerId | null { return this.toActivePlayer?.id ?? null; }
}
