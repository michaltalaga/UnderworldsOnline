import type { CardDefinitionId, FighterId } from "../values/ids";
import {
  CardKind,
  type EndPhaseActionKind,
  type GameActionKind,
  type ObjectiveConditionTiming,
} from "../values/enums";
import type { PloyEffect } from "./PloyEffect";
import type { CardInstance } from "../state/CardInstance";
import type { GameEventLogState } from "../state/GameEventLogState";
import type { Game } from "../state/Game";
import type { PlayerState } from "../state/PlayerState";

export type CardPlayContext = {
  timing?: ObjectiveConditionTiming;
  targetFighterId?: FighterId | null;
  equippedFighterId?: FighterId | null;
  triggerActionKind?: GameActionKind | EndPhaseActionKind | null;
};

export class CardDefinition {
  public readonly id: CardDefinitionId;
  public readonly kind: CardKind;
  public readonly name: string;
  public readonly text: string;
  public readonly gloryValue: number;
  public readonly ployEffects: readonly PloyEffect[];

  public constructor(
    id: CardDefinitionId,
    kind: CardKind,
    name: string,
    text: string,
    gloryValue: number = 0,
    ployEffects: readonly PloyEffect[] = [],
  ) {
    this.id = id;
    this.kind = kind;
    this.name = name;
    this.text = text;
    this.gloryValue = gloryValue;
    this.ployEffects = ployEffects;
  }

  public canPlay(
    game: Game,
    world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): boolean {
    void game;
    void world;
    void player;
    void card;
    void context;
    return false;
  }

  public play(
    game: Game,
    world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): string[] {
    void game;
    void world;
    void player;
    void card;
    void context;
    throw new Error(`Card ${this.name} cannot be played.`);
  }
}
