import { CardDefinition } from "../definitions/CardDefinition";
import { Game } from "../state/Game";
import { PlayerState } from "../state/PlayerState";
import type { FighterId } from "../values/ids";

export abstract class PloyEffectResolver {
  public abstract canResolve(
    game: Game,
    player: PlayerState,
    ploy: CardDefinition,
    targetFighterId?: FighterId | null,
  ): boolean;

  public abstract resolve(
    game: Game,
    player: PlayerState,
    ploy: CardDefinition,
    targetFighterId?: FighterId | null,
  ): string[];
}
