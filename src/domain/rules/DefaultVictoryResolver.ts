import { GameOutcomeKind } from "../values/enums";
import { Game } from "../state/Game";
import { GameOutcome } from "./GameOutcome";
import { VictoryResolver } from "./VictoryResolver";

export class DefaultVictoryResolver extends VictoryResolver {
  public getOutcome(game: Game): GameOutcome {
    const [playerOne, playerTwo] = game.players;
    if (playerOne === undefined || playerTwo === undefined || game.players.length !== 2) {
      throw new Error("Victory resolution requires exactly two players.");
    }

    if (playerOne.glory > playerTwo.glory) {
      return new GameOutcome(
        GameOutcomeKind.Winner,
        playerOne.id,
        `${playerOne.name} had more glory at the end of the final round.`,
      );
    }

    if (playerTwo.glory > playerOne.glory) {
      return new GameOutcome(
        GameOutcomeKind.Winner,
        playerTwo.id,
        `${playerTwo.name} had more glory at the end of the final round.`,
      );
    }

    return new GameOutcome(
      GameOutcomeKind.Draw,
      null,
      "Both players had equal glory at the end of the final round.",
    );
  }
}
