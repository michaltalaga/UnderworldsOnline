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

export type CombatDebugScenarioId = "success" | "draw" | "failure";

export type CombatDebugScenario = {
  id: CombatDebugScenarioId;
  label: string;
  description: string;
  attackRoll: readonly AttackDieFace[];
  saveRoll: readonly SaveDieFace[];
};

export const combatDebugScenarios: readonly CombatDebugScenario[] = [
  {
    id: "success",
    label: "Hit Lands",
    description: "Critical plus hammer beats the defender cleanly and deals damage.",
    attackRoll: [AttackDieFace.Critical, AttackDieFace.Hammer],
    saveRoll: [SaveDieFace.Blank],
  },
  {
    id: "draw",
    label: "Stalemate",
    description: "One hit meets one dodge, so the attack resolves as a draw.",
    attackRoll: [AttackDieFace.Hammer, AttackDieFace.Blank],
    saveRoll: [SaveDieFace.Dodge],
  },
  {
    id: "failure",
    label: "Defended",
    description: "The defender spikes a critical save and shuts the attack down.",
    attackRoll: [AttackDieFace.Hammer, AttackDieFace.Blank],
    saveRoll: [SaveDieFace.Critical],
  },
] as const;

export function getCombatDebugScenario(scenarioId: CombatDebugScenarioId): CombatDebugScenario {
  const scenario = combatDebugScenarios.find((candidate) => candidate.id === scenarioId);
  if (scenario === undefined) {
    throw new Error(`Unknown combat debug scenario ${scenarioId}.`);
  }

  return scenario;
}

export function createCombatDebugGame(
  scenarioId: CombatDebugScenarioId = "success",
): Game {
  const scenario = getCombatDebugScenario(scenarioId);
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
      [...scenario.attackRoll],
      [...scenario.saveRoll],
    ),
  );

  return game;
}
