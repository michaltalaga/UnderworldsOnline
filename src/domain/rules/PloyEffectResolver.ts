import { CardDefinition } from "../definitions/CardDefinition";
import { Game } from "../state/Game";
import { PlayerState } from "../state/PlayerState";

export abstract class PloyEffectResolver {
  public abstract canResolve(
    game: Game,
    player: PlayerState,
    ploy: CardDefinition,
  ): boolean;

  public abstract resolve(
    game: Game,
    player: PlayerState,
    ploy: CardDefinition,
  ): string[];
}
