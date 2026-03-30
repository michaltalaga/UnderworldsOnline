import { SetupActionKind } from "../values/enums";
import type { RollOffRoundInput } from "../rules/RollOffRound";
import { SetupAction } from "./SetupAction";

export class ResolveTerritoryRollOffAction extends SetupAction {
  public readonly rounds: readonly RollOffRoundInput[];

  public constructor(rounds: readonly RollOffRoundInput[]) {
    super(SetupActionKind.ResolveTerritoryRollOff);
    this.rounds = rounds;
  }
}
