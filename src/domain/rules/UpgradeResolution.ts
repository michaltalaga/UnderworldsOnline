import type { CardDefinitionId, CardId, FighterId, PlayerId } from "../values/ids";

export class UpgradeResolution {
  public readonly playerId: PlayerId;
  public readonly playerName: string;
  public readonly cardId: CardId;
  public readonly cardDefinitionId: CardDefinitionId;
  public readonly cardName: string;
  public readonly fighterId: FighterId;
  public readonly fighterName: string;
  public readonly gloryPaid: number;

  public constructor(
    playerId: PlayerId,
    playerName: string,
    cardId: CardId,
    cardDefinitionId: CardDefinitionId,
    cardName: string,
    fighterId: FighterId,
    fighterName: string,
    gloryPaid: number,
  ) {
    this.playerId = playerId;
    this.playerName = playerName;
    this.cardId = cardId;
    this.cardDefinitionId = cardDefinitionId;
    this.cardName = cardName;
    this.fighterId = fighterId;
    this.fighterName = fighterName;
    this.gloryPaid = gloryPaid;
  }
}
