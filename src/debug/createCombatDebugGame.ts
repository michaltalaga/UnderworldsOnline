import {
  AttackAction,
  AttackDieFace,
  GameEngine,
  MoveAction,
  PassAction,
  SaveDieFace,
  createCombatReadySetupPracticeGame,
  type Game,
} from "../domain";

const playerOneFighterOneId = "player:one:fighter:fighter-def:setup-practice:1:1";
const playerOneFighterThreeId = "player:one:fighter:fighter-def:setup-practice:3:3";
const playerTwoFighterOneId = "player:two:fighter:fighter-def:setup-practice:1:1";
const practiceBladeWeaponId = "weapon-def:setup-practice:1";

export function createCombatDebugGame(): Game {
  const game = createCombatReadySetupPracticeGame("game:setup-practice:combat-debug");
  const engine = new GameEngine();

  engine.startCombatRound(
    game,
    [{ firstFace: AttackDieFace.Hammer, secondFace: AttackDieFace.Blank }],
    "player:one",
  );

  engine.applyGameAction(
    game,
    new MoveAction("player:one", playerOneFighterOneId, ["hex:r0:c2"]),
  );
  engine.applyGameAction(game, new PassAction("player:one"));

  engine.applyGameAction(
    game,
    new MoveAction("player:two", playerTwoFighterOneId, ["hex:r7:c3", "hex:r6:c3"]),
  );
  engine.applyGameAction(game, new PassAction("player:two"));

  engine.applyGameAction(
    game,
    new MoveAction("player:one", playerOneFighterThreeId, [
      "hex:r2:c1",
      "hex:r3:c2",
      "hex:r4:c2",
      "hex:r5:c3",
    ]),
  );
  engine.applyGameAction(game, new PassAction("player:one"));

  engine.applyGameAction(
    game,
    new AttackAction(
      "player:two",
      playerTwoFighterOneId,
      playerOneFighterThreeId,
      practiceBladeWeaponId,
      null,
      [AttackDieFace.Critical, AttackDieFace.Hammer],
      [SaveDieFace.Blank],
    ),
  );

  return game;
}
