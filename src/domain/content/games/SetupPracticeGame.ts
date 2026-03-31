import { GameFactory } from "../../factories/GameFactory";
import { Game } from "../../state/Game";
import type { GameId } from "../../values/ids";
import { centeredBattlefield } from "../boards/CenteredBattlefield";
import { setupPracticeWarband } from "../warbands/SetupPracticeWarband";

export function createSetupPracticeGame(
  gameId: GameId = "game:setup-practice",
): Game {
  return new GameFactory().createGame({
    gameId,
    board: centeredBattlefield,
    players: [
      {
        id: "player:one",
        name: "Player One",
        warband: setupPracticeWarband,
      },
      {
        id: "player:two",
        name: "Player Two",
        warband: setupPracticeWarband,
      },
    ],
    shuffleCards: copyCards,
  });
}

function copyCards<T>(cards: readonly T[]): T[] {
  return [...cards];
}
