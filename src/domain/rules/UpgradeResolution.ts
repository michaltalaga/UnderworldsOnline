import type { CardDefinitionId, CardId, FighterId, PlayerId } from "../values/ids";
import type { Card } from "../cards/Card";
import type { Fighter } from "../state/Fighter";
import type { Player } from "../state/Player";

export class UpgradeResolution {
  public readonly player: Player;
  public readonly card: Card;
  public readonly fighter: Fighter;
  public readonly gloryPaid: number;

  public constructor(
    player: Player,
    card: Card,
    fighter: Fighter,
    gloryPaid: number,
  ) {
    this.player = player;
    this.card = card;
    this.fighter = fighter;
    this.gloryPaid = gloryPaid;
  }

  public get playerId(): PlayerId { return this.player.id; }
  public get playerName(): string { return this.player.name; }
  public get cardId(): CardId { return this.card.id; }
  public get cardDefinitionId(): CardDefinitionId { return this.card.name as CardDefinitionId; }
  public get cardName(): string { return this.card.name; }
  public get fighterId(): FighterId { return this.fighter.id; }
  public get fighterName(): string { return this.fighter.definition.name; }
}
