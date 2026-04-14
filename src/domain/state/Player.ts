import type {
  FighterId,
  PlayerId,
  WeaponDefinitionId,
} from "../values/ids";
import { DeckKind } from "../values/enums";
import type { Card, Target } from "../cards/Card";
import { FighterDefinition } from "../definitions/FighterDefinition";
import { WarscrollDefinition } from "../definitions/WarscrollDefinition";
import { WeaponDefinition } from "../definitions/WeaponDefinition";
import { WarbandDefinition } from "../definitions/WarbandDefinition";
import type { Game } from "./Game";
import { Deck } from "./Deck";
import { Fighter } from "./Fighter";
import type { Territory } from "./Territory";
import { Warscroll } from "./Warscroll";

export type PlayerWarscrollWithDefinition = {
  state: Warscroll;
  definition: WarscrollDefinition;
};

export class Player {
  public readonly id: PlayerId;
  public name: string;
  public readonly warband: WarbandDefinition;
  public glory: number;
  public territory: Territory | null;
  public mulliganUsed: boolean;
  public turnsTakenThisRound: number;
  public hasDelvedThisPowerStep: boolean;
  public fighters: Fighter[];
  public objectiveDeck: Deck;
  public powerDeck: Deck;
  public objectiveHand: Card[];
  public powerHand: Card[];
  public scoredObjectives: Card[];
  public equippedUpgrades: Card[];
  public warscrollState: Warscroll;

  public constructor(
    id: PlayerId,
    name: string,
    warband: WarbandDefinition,
    glory: number = 0,
    territory: Territory | null = null,
    mulliganUsed: boolean = false,
    turnsTakenThisRound: number = 0,
    hasDelvedThisPowerStep: boolean = false,
    fighters: Fighter[] = [],
    objectiveDeck: Deck = new Deck(DeckKind.Objective),
    powerDeck: Deck = new Deck(DeckKind.Power),
    objectiveHand: Card[] = [],
    powerHand: Card[] = [],
    scoredObjectives: Card[] = [],
    equippedUpgrades: Card[] = [],
    warscrollState?: Warscroll,
  ) {
    this.id = id;
    this.name = name;
    this.warband = warband;
    this.glory = glory;
    this.territory = territory;
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
    this.warscrollState = warscrollState ?? new Warscroll(this, warband.warscroll);
  }

  public getFighter(fighterId: FighterId): Fighter | undefined {
    return this.fighters.find((fighter) => fighter.id === fighterId);
  }

  public getFighterDefinition(fighterId: FighterId): FighterDefinition | undefined {
    return this.getFighter(fighterId)?.definition;
  }

  public getFighterWeaponDefinition(
    fighterId: FighterId,
    weaponId: WeaponDefinitionId | null,
  ): WeaponDefinition | undefined {
    return this.getFighterDefinition(fighterId)?.getWeapon(weaponId) ?? undefined;
  }

  public getWarscrollDefinition(): WarscrollDefinition | undefined {
    return this.warscrollState.definition;
  }

  public getWarscrollWithDefinition(): PlayerWarscrollWithDefinition | undefined {
    return {
      state: this.warscrollState,
      definition: this.warscrollState.definition,
    };
  }

  public getWarscrollTokenCount(tokenName: string): number {
    return this.warscrollState.tokens[tokenName] ?? 0;
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

  public getUndeployedFighters(): Fighter[] {
    return this.fighters.filter(
      (fighter) => fighter.currentHex === null && !fighter.isSlain,
    );
  }
}
