import type { CardId, FighterId, PlayerId, TerritoryId } from "../values/ids";
import { DeckKind } from "../values/enums";
import { WarbandDefinition } from "../definitions/WarbandDefinition";
import { CardInstance } from "./CardInstance";
import { DeckState } from "./DeckState";
import { FighterState } from "./FighterState";

export class PlayerState {
  public readonly id: PlayerId;
  public name: string;
  public readonly warband: WarbandDefinition;
  public glory: number;
  public territoryId: TerritoryId | null;
  public mulliganUsed: boolean;
  public turnsTakenThisRound: number;
  public hasDelvedThisPowerStep: boolean;
  public fighters: FighterState[];
  public objectiveDeck: DeckState;
  public powerDeck: DeckState;
  public objectiveHand: CardInstance[];
  public powerHand: CardInstance[];
  public scoredObjectives: CardInstance[];
  public equippedUpgrades: CardInstance[];

  public constructor(
    id: PlayerId,
    name: string,
    warband: WarbandDefinition,
    glory: number = 0,
    territoryId: TerritoryId | null = null,
    mulliganUsed: boolean = false,
    turnsTakenThisRound: number = 0,
    hasDelvedThisPowerStep: boolean = false,
    fighters: FighterState[] = [],
    objectiveDeck: DeckState = new DeckState(DeckKind.Objective),
    powerDeck: DeckState = new DeckState(DeckKind.Power),
    objectiveHand: CardInstance[] = [],
    powerHand: CardInstance[] = [],
    scoredObjectives: CardInstance[] = [],
    equippedUpgrades: CardInstance[] = [],
  ) {
    this.id = id;
    this.name = name;
    this.warband = warband;
    this.glory = glory;
    this.territoryId = territoryId;
    this.mulliganUsed = mulliganUsed;
    this.turnsTakenThisRound = turnsTakenThisRound;
    this.hasDelvedThisPowerStep = hasDelvedThisPowerStep;
    this.fighters = fighters;
    this.objectiveDeck = objectiveDeck;
    this.powerDeck = powerDeck;
    this.objectiveHand = objectiveHand;
    this.powerHand = powerHand;
    this.scoredObjectives = scoredObjectives;
    this.equippedUpgrades = equippedUpgrades;
  }

  public getFighter(fighterId: FighterId): FighterState | undefined {
    return this.fighters.find((fighter) => fighter.id === fighterId);
  }

  public getCard(cardId: CardId): CardInstance | undefined {
    return this.getAllCards().find((card) => card.id === cardId);
  }

  public getAllCards(): CardInstance[] {
    return [
      ...this.objectiveDeck.drawPile,
      ...this.objectiveDeck.discardPile,
      ...this.powerDeck.drawPile,
      ...this.powerDeck.discardPile,
      ...this.objectiveHand,
      ...this.powerHand,
      ...this.scoredObjectives,
      ...this.equippedUpgrades,
    ];
  }
}
