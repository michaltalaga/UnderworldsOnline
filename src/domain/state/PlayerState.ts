import type { CardId, FighterId, PlayerId, TerritoryId, WeaponDefinitionId } from "../values/ids";
import { DeckKind } from "../values/enums";
import { CardDefinition } from "../definitions/CardDefinition";
import { FighterDefinition } from "../definitions/FighterDefinition";
import { WeaponDefinition } from "../definitions/WeaponDefinition";
import { WarbandDefinition } from "../definitions/WarbandDefinition";
import { CardInstance } from "./CardInstance";
import { DeckState } from "./DeckState";
import { FighterState } from "./FighterState";
import { WarscrollState } from "./WarscrollState";

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
  public warscrollState: WarscrollState;

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
    warscrollState: WarscrollState = new WarscrollState(id, warband.warscroll.id),
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
    this.warscrollState = warscrollState;
  }

  public getFighter(fighterId: FighterId): FighterState | undefined {
    return this.fighters.find((fighter) => fighter.id === fighterId);
  }

  public getFighterDefinition(fighterId: FighterId): FighterDefinition | undefined {
    const fighter = this.getFighter(fighterId);
    if (fighter === undefined) {
      return undefined;
    }

    return this.warband.fighters.find(
      (definition) => definition.id === fighter.definitionId,
    );
  }

  public getFighterWeaponDefinition(
    fighterId: FighterId,
    weaponId: WeaponDefinitionId | null,
  ): WeaponDefinition | undefined {
    return this.getFighterDefinition(fighterId)?.getWeapon(weaponId) ?? undefined;
  }

  public getCard(cardId: CardId): CardInstance | undefined {
    return this.getAllCards().find((card) => card.id === cardId);
  }

  public getCardDefinition(cardId: CardId): CardDefinition | undefined {
    const card = this.getCard(cardId);
    if (card === undefined) {
      return undefined;
    }

    return [...this.warband.objectiveCards, ...this.warband.powerCards].find(
      (definition) => definition.id === card.definitionId,
    );
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

  public getUndeployedFighters(): FighterState[] {
    return this.fighters.filter(
      (fighter) => fighter.currentHexId === null && !fighter.isSlain,
    );
  }
}
