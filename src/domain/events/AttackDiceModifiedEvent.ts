import type { AttackDieFace, GameActionKind } from "../values/enums";
import type { Card } from "../cards/Card";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import { GameEvent } from "./GameEvent";

export class AttackDiceModifiedEvent extends GameEvent {
  public readonly attackerPlayer: Player;
  public readonly attacker: Fighter;
  public readonly modifiedByCard: Card;
  public readonly previousRoll: readonly AttackDieFace[];
  public readonly newRoll: readonly AttackDieFace[];
  public readonly reason: string;

  public constructor(
    roundNumber: number,
    attackerPlayer: Player,
    attacker: Fighter,
    modifiedByCard: Card,
    previousRoll: readonly AttackDieFace[],
    newRoll: readonly AttackDieFace[],
    reason: string,
    actionKind: GameActionKind,
  ) {
    super(roundNumber, attackerPlayer, attacker, modifiedByCard, actionKind);
    this.attackerPlayer = attackerPlayer;
    this.attacker = attacker;
    this.modifiedByCard = modifiedByCard;
    this.previousRoll = previousRoll;
    this.newRoll = newRoll;
    this.reason = reason;
  }
}
