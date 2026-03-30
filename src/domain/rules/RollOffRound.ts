import type { AttackDieFace } from "../values/enums";
import type { PlayerId } from "../values/ids";

export type RollOffRoundInput = {
  firstFace: AttackDieFace;
  secondFace: AttackDieFace;
};

export class RollOffRound {
  public readonly playerOneId: PlayerId;
  public readonly playerOneFace: AttackDieFace;
  public readonly playerTwoId: PlayerId;
  public readonly playerTwoFace: AttackDieFace;

  public constructor(
    playerOneId: PlayerId,
    playerOneFace: AttackDieFace,
    playerTwoId: PlayerId,
    playerTwoFace: AttackDieFace,
  ) {
    this.playerOneId = playerOneId;
    this.playerOneFace = playerOneFace;
    this.playerTwoId = playerTwoId;
    this.playerTwoFace = playerTwoFace;
  }
}
