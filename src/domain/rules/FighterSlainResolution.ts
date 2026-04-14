import type { FighterId, HexId, PlayerId } from "../values/ids";
import type { Fighter } from "../state/Fighter";
import type { HexCell } from "../state/HexCell";
import type { Player } from "../state/Player";

export class FighterSlainResolution {
  public readonly attackerPlayer: Player;
  public readonly attackerFighter: Fighter;
  public readonly slainPlayer: Player;
  public readonly slainFighter: Fighter;
  public readonly slainHex: HexCell;
  public readonly bountyGained: number;

  public constructor(
    attackerPlayer: Player,
    attackerFighter: Fighter,
    slainPlayer: Player,
    slainFighter: Fighter,
    slainHex: HexCell,
    bountyGained: number,
  ) {
    this.attackerPlayer = attackerPlayer;
    this.attackerFighter = attackerFighter;
    this.slainPlayer = slainPlayer;
    this.slainFighter = slainFighter;
    this.slainHex = slainHex;
    this.bountyGained = bountyGained;
  }

  public get attackerPlayerId(): PlayerId { return this.attackerPlayer.id; }
  public get attackerPlayerName(): string { return this.attackerPlayer.name; }
  public get attackerFighterId(): FighterId { return this.attackerFighter.id; }
  public get attackerFighterName(): string { return this.attackerFighter.definition.name; }
  public get slainPlayerId(): PlayerId { return this.slainPlayer.id; }
  public get slainPlayerName(): string { return this.slainPlayer.name; }
  public get slainFighterId(): FighterId { return this.slainFighter.id; }
  public get slainFighterName(): string { return this.slainFighter.definition.name; }
  public get slainHexId(): HexId { return this.slainHex.id; }
}
