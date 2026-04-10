import type {
  FighterId,
  PlayerId,
  TerritoryId,
  WeaponDefinitionId,
} from "../values/ids";
import { DeckKind } from "../values/enums";
import type { Card, Target } from "../cards/Card";
import { FighterDefinition } from "../definitions/FighterDefinition";
import { WarscrollDefinition } from "../definitions/WarscrollDefinition";
import { WeaponDefinition } from "../definitions/WeaponDefinition";
import { WarbandDefinition } from "../definitions/WarbandDefinition";
import type { Game } from "./Game";
import { DeckState } from "./DeckState";
import { FighterState } from "./FighterState";
import { WarscrollState } from "./WarscrollState";

export type PlayerWarscrollWithDefinition = {
  state: WarscrollState;
  definition: WarscrollDefinition;
};

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
  public objectiveHand: Card[];
  public powerHand: Card[];
  public scoredObjectives: Card[];
  public equippedUpgrades: Card[];
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
    objectiveHand: Card[] = [],
    powerHand: Card[] = [],
    scoredObjectives: Card[] = [],
    equippedUpgrades: Card[] = [],
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

  public getWarscrollDefinition(): WarscrollDefinition | undefined {
    return this.warband.warscroll.id === this.warscrollState.definitionId
      ? this.warband.warscroll
      : undefined;
  }

  public getWarscrollWithDefinition(): PlayerWarscrollWithDefinition | undefined {
    const definition = this.getWarscrollDefinition();
    if (definition === undefined) {
      return undefined;
    }

    return {
      state: this.warscrollState,
      definition,
    };
  }

  // Find a card by ID — for debugging/engine compatibility only.
  // Prefer holding object references instead of looking up by ID.
  public getCard(cardId: string): Card | undefined {
    return this.getAllCards().find((card) => card.id === cardId);
  }

  public getAllCards(): Card[] {
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

  // Ask each card in the given list what it can target right now.
  // Returns one entry per (card, target) pair. Cards that return no
  // targets are omitted (not playable).
  public getPlayableCardOptions(
    game: Game,
    cards: readonly Card[] = [...this.objectiveHand, ...this.powerHand],
  ): { card: Card; targets: Target[] }[] {
    return cards.flatMap((card) => {
      const targets = card.getLegalTargets(game);
      return targets.length > 0 ? [{ card, targets }] : [];
    });
  }

  public getUndeployedFighters(): FighterState[] {
    return this.fighters.filter(
      (fighter) => fighter.currentHexId === null && !fighter.isSlain,
    );
  }
}
