import type { FighterId, PlayerId } from "../values/ids";

export class GuardResolution {
  public readonly playerId: PlayerId;
  public readonly playerName: string;
  public readonly fighterId: FighterId;
  public readonly fighterName: string;

  public constructor(
    playerId: PlayerId,
    playerName: string,
    fighterId: FighterId,
    fighterName: string,
  ) {
    this.playerId = playerId;
    this.playerName = playerName;
    this.fighterId = fighterId;
    this.fighterName = fighterName;
  }
}
