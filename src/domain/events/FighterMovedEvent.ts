import type { HexKind } from "../values/enums";
import type { HexId } from "../values/ids";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";
import type { GameEventInvokerKind } from "../state/GameRecord";
import { GameEvent } from "./GameEvent";

export class FighterMovedEvent extends GameEvent {
  public readonly player: Player;
  public readonly fighter: Fighter;
  public readonly fromHexId: HexId;
  public readonly toHexId: HexId;
  public readonly path: readonly HexId[];
  public readonly destinationHexKind: HexKind;
  public readonly staggerApplied: boolean;

  public constructor(
    roundNumber: number,
    player: Player,
    fighter: Fighter,
    fromHexId: HexId,
    toHexId: HexId,
    path: readonly HexId[],
    destinationHexKind: HexKind,
    staggerApplied: boolean,
    actionKind: GameEventInvokerKind | null,
  ) {
    super(roundNumber, player, fighter, null, actionKind);
    this.player = player;
    this.fighter = fighter;
    this.fromHexId = fromHexId;
    this.toHexId = toHexId;
    this.path = path;
    this.destinationHexKind = destinationHexKind;
    this.staggerApplied = staggerApplied;
  }
}
