import type { WeaponAbilityKind } from "../values/enums";
import type { Card } from "../cards/Card";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import type { GameEventInvokerKind } from "../state/GameRecord";
import { GameEvent } from "./GameEvent";

export class WeaponAbilityModifiedEvent extends GameEvent {
  public readonly attackerPlayer: Player;
  public readonly attacker: Fighter;
  public readonly modifiedByCard: Card;
  public readonly previousAbility: WeaponAbilityKind | null;
  public readonly newAbility: WeaponAbilityKind | null;
  public readonly reason: string;

  public constructor(
    roundNumber: number,
    attackerPlayer: Player,
    attacker: Fighter,
    modifiedByCard: Card,
    previousAbility: WeaponAbilityKind | null,
    newAbility: WeaponAbilityKind | null,
    reason: string,
    actionKind: GameEventInvokerKind,
  ) {
    super(roundNumber, attackerPlayer, attacker, modifiedByCard, actionKind);
    this.attackerPlayer = attackerPlayer;
    this.attacker = attacker;
    this.modifiedByCard = modifiedByCard;
    this.previousAbility = previousAbility;
    this.newAbility = newAbility;
    this.reason = reason;
  }
}
