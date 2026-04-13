import type { HexId } from "../values/ids";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import type { GameEventInvokerKind } from "../state/GameRecord";
import { GameEvent } from "./GameEvent";

export class FighterSlainEvent extends GameEvent {
  public readonly attackerPlayer: Player;
  public readonly attacker: Fighter;
  public readonly slainPlayer: Player;
  public readonly slainFighter: Fighter;
  public readonly slainHexId: HexId;
  public readonly bountyGained: number;

  public constructor(
    roundNumber: number,
    attackerPlayer: Player,
    attacker: Fighter,
    slainPlayer: Player,
    slainFighter: Fighter,
    slainHexId: HexId,
    bountyGained: number,
    actionKind: GameEventInvokerKind | null,
  ) {
    super(roundNumber, attackerPlayer, attacker, null, actionKind);
    this.attackerPlayer = attackerPlayer;
    this.attacker = attacker;
    this.slainPlayer = slainPlayer;
    this.slainFighter = slainFighter;
    this.slainHexId = slainHexId;
    this.bountyGained = bountyGained;
  }
}
