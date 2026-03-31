import { createCombatReadySetupPracticeGame } from "../src/domain/index.ts";

const game = createCombatReadySetupPracticeGame();

console.log(JSON.stringify(game, null, 2));
