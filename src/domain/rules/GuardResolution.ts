import type { FighterId, PlayerId } from "../values/ids";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";

export class GuardResolution {
  public readonly player: Player;
  public readonly fighter: Fighter;

  public constructor(player: Player, fighter: Fighter) {
    this.player = player;
    this.fighter = fighter;
  }

  public get playerId(): PlayerId { return this.player.id; }
  public get playerName(): string { return this.player.name; }
  public get fighterId(): FighterId { return this.fighter.id; }
  public get fighterName(): string { return this.fighter.definition.name; }
}
