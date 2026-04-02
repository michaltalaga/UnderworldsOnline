import type { FighterId, HexId, PlayerId } from "../values/ids";

export class FighterSlainResolution {
  public readonly attackerPlayerId: PlayerId;
  public readonly attackerPlayerName: string;
  public readonly attackerFighterId: FighterId;
  public readonly attackerFighterName: string;
  public readonly slainPlayerId: PlayerId;
  public readonly slainPlayerName: string;
  public readonly slainFighterId: FighterId;
  public readonly slainFighterName: string;
  public readonly slainHexId: HexId;
  public readonly bountyGained: number;

  public constructor(
    attackerPlayerId: PlayerId,
    attackerPlayerName: string,
    attackerFighterId: FighterId,
    attackerFighterName: string,
    slainPlayerId: PlayerId,
    slainPlayerName: string,
    slainFighterId: FighterId,
    slainFighterName: string,
    slainHexId: HexId,
    bountyGained: number,
  ) {
    this.attackerPlayerId = attackerPlayerId;
    this.attackerPlayerName = attackerPlayerName;
    this.attackerFighterId = attackerFighterId;
    this.attackerFighterName = attackerFighterName;
    this.slainPlayerId = slainPlayerId;
    this.slainPlayerName = slainPlayerName;
    this.slainFighterId = slainFighterId;
    this.slainFighterName = slainFighterName;
    this.slainHexId = slainHexId;
    this.bountyGained = bountyGained;
  }
}
