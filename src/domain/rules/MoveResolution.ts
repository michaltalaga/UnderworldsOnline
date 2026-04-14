import type { FighterId, HexId, PlayerId } from "../values/ids";
import type { HexKind } from "../values/enums";
import type { Fighter } from "../state/Fighter";
import type { HexCell } from "../state/HexCell";
import type { Player } from "../state/Player";

export class MoveResolution {
  public readonly player: Player;
  public readonly fighter: Fighter;
  public readonly fromHex: HexCell;
  public readonly toHex: HexCell;
  public readonly path: readonly HexCell[];
  public readonly destinationHexKind: HexKind;
  public readonly staggerApplied: boolean;

  public constructor(
    player: Player,
    fighter: Fighter,
    fromHex: HexCell,
    toHex: HexCell,
    path: readonly HexCell[],
    destinationHexKind: HexKind,
    staggerApplied: boolean,
  ) {
    this.player = player;
    this.fighter = fighter;
    this.fromHex = fromHex;
    this.toHex = toHex;
    this.path = path;
    this.destinationHexKind = destinationHexKind;
    this.staggerApplied = staggerApplied;
  }

  // Legacy id-shaped getters — derive from object refs above.
  public get playerId(): PlayerId { return this.player.id; }
  public get playerName(): string { return this.player.name; }
  public get fighterId(): FighterId { return this.fighter.id; }
  public get fighterName(): string { return this.fighter.definition.name; }
  public get fromHexId(): HexId { return this.fromHex.id; }
  public get toHexId(): HexId { return this.toHex.id; }
}
