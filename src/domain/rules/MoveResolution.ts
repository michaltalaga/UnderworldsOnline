import type { HexKind } from "../values/enums";
import type { FighterId, HexId, PlayerId } from "../values/ids";

export class MoveResolution {
  public readonly playerId: PlayerId;
  public readonly playerName: string;
  public readonly fighterId: FighterId;
  public readonly fighterName: string;
  public readonly fromHexId: HexId;
  public readonly toHexId: HexId;
  public readonly path: readonly HexId[];
  public readonly destinationHexKind: HexKind;
  public readonly staggerApplied: boolean;

  public constructor(
    playerId: PlayerId,
    playerName: string,
    fighterId: FighterId,
    fighterName: string,
    fromHexId: HexId,
    toHexId: HexId,
    path: readonly HexId[],
    destinationHexKind: HexKind,
    staggerApplied: boolean,
  ) {
    this.playerId = playerId;
    this.playerName = playerName;
    this.fighterId = fighterId;
    this.fighterName = fighterName;
    this.fromHexId = fromHexId;
    this.toHexId = toHexId;
    this.path = path;
    this.destinationHexKind = destinationHexKind;
    this.staggerApplied = staggerApplied;
  }
}
