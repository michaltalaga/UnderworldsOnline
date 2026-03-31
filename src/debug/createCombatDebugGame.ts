import {
  AttackAction,
  AttackDieFace,
  GameEngine,
  MoveAction,
  PassAction,
  SaveDieFace,
  WeaponAbilityKind,
  createCombatReadySetupPracticeGame,
  type Game,
} from "../domain";

const playerOneFighterThreeId = "player:one:fighter:fighter-def:setup-practice:3:3";
const playerOneFighterFourId = "player:one:fighter:fighter-def:setup-practice:4:4";
const playerTwoFighterOneId = "player:two:fighter:fighter-def:setup-practice:1:1";
const practiceBladeWeaponId = "weapon-def:setup-practice:1";

export type CombatDebugScenarioId = "success" | "draw" | "dodge" | "failure" | "support";

export type CombatDebugScenario = {
  id: CombatDebugScenarioId;
  label: string;
  description: string;
  attackRoll: readonly AttackDieFace[];
  saveRoll: readonly SaveDieFace[];
};

export type CombatDebugDefenderState = {
  hasGuardToken?: boolean;
  hasStaggerToken?: boolean;
};

export type CombatDebugSnapshot = {
  game: Game;
  attackError: string | null;
  attackerWeaponName: string;
  attackerWeaponAbilities: readonly CombatDebugWeaponAbility[];
  selectedAbility: WeaponAbilityKind | null;
  selectedAbilityDefinedOnWeapon: boolean;
  selectedAbilityRequiresCritical: boolean;
};

export type CombatDebugWeaponAbility = {
  kind: WeaponAbilityKind;
  requiresCritical: boolean;
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
    description: "One hit meets one shield, so Cleave can visibly change the outcome.",
    attackRoll: [AttackDieFace.Hammer, AttackDieFace.Blank],
    saveRoll: [SaveDieFace.Shield],
  },
  {
    id: "failure",
    label: "Defended",
    description: "The defender spikes a critical save and shuts the attack down.",
    attackRoll: [AttackDieFace.Hammer, AttackDieFace.Blank],
    saveRoll: [SaveDieFace.Critical],
  },
  {
    id: "dodge",
    label: "Dodge Check",
    description: "One hit meets one dodge, so Ensnare can visibly change the outcome.",
    attackRoll: [AttackDieFace.Hammer, AttackDieFace.Blank],
    saveRoll: [SaveDieFace.Dodge],
  },
  {
    id: "support",
    label: "Support Check",
    description: "Support icons stay neutral until guard or stagger turns them into successes.",
    attackRoll: [AttackDieFace.Support, AttackDieFace.Blank],
    saveRoll: [SaveDieFace.Support],
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
  defenderState: CombatDebugDefenderState = {},
  selectedAbility: WeaponAbilityKind | null = null,
): Game {
  return createCombatDebugSnapshot(scenarioId, defenderState, selectedAbility).game;
}

export function createCombatDebugSnapshot(
  scenarioId: CombatDebugScenarioId = "success",
  defenderState: CombatDebugDefenderState = {},
  selectedAbility: WeaponAbilityKind | null = null,
): CombatDebugSnapshot {
  const scenario = getCombatDebugScenario(scenarioId);
  const game = createCombatReadySetupPracticeGame("game:setup-practice:combat-debug");
  const engine = new GameEngine();
  const debugDefenderId = scenarioId === "dodge" ? playerOneFighterThreeId : playerOneFighterFourId;
  const defenderMovePath =
    scenarioId === "dodge"
      ? ["hex:r2:c1", "hex:r3:c2", "hex:r4:c2"]
      : ["hex:r2:c3", "hex:r3:c3", "hex:r4:c3"];
  const attackerMovePath =
    scenarioId === "dodge"
      ? ["hex:r7:c3", "hex:r6:c3", "hex:r5:c3"]
      : ["hex:r7:c3", "hex:r6:c3", "hex:r5:c3"];

  engine.startCombatRound(
    game,
    [{ firstFace: AttackDieFace.Hammer, secondFace: AttackDieFace.Blank }],
    "player:one",
  );

  engine.applyGameAction(
    game,
    new MoveAction("player:one", debugDefenderId, defenderMovePath),
  );
  engine.applyGameAction(game, new PassAction("player:one"));

  engine.applyGameAction(
    game,
    new MoveAction("player:two", playerTwoFighterOneId, attackerMovePath),
  );
  engine.applyGameAction(game, new PassAction("player:two"));

  engine.applyGameAction(game, new PassAction("player:one"));
  engine.applyGameAction(game, new PassAction("player:one"));

  const defender = game.getFighter(debugDefenderId);
  if (defender === undefined) {
    throw new Error(`Could not find debug defender ${debugDefenderId}.`);
  }

  defender.hasGuardToken = defenderState.hasGuardToken ?? false;
  defender.hasStaggerToken = defenderState.hasStaggerToken ?? false;

  const defenderEffects: string[] = [];
  if (defender.hasGuardToken) {
    defenderEffects.push("guard");
  }

  if (defender.hasStaggerToken) {
    defenderEffects.push("stagger");
  }

  if (defenderEffects.length > 0) {
    game.eventLog.push(`Debug setup applied defender tokens: ${defenderEffects.join(", ")}.`);
  }

  const attackerPlayer = game.getPlayer("player:two");
  const attackerDefinition = attackerPlayer?.getFighterDefinition(playerTwoFighterOneId);
  const attackerWeapon = attackerDefinition?.weapons.find(
    (candidate) => candidate.id === practiceBladeWeaponId,
  );
  if (attackerWeapon === undefined) {
    throw new Error(`Could not find debug weapon ${practiceBladeWeaponId}.`);
  }

  const attackerWeaponAbilities = attackerWeapon.abilities.map((ability) => ({
    kind: ability.kind,
    requiresCritical: ability.requiresCritical,
  }));
  const selectedAbilityDefinition =
    selectedAbility === null
      ? null
      : attackerWeaponAbilities.find((ability) => ability.kind === selectedAbility) ?? null;
  const selectedAbilityDefinedOnWeapon = selectedAbilityDefinition !== null;

  let attackError: string | null = null;
  try {
    engine.applyGameAction(
      game,
      new AttackAction(
        "player:two",
        playerTwoFighterOneId,
        debugDefenderId,
        practiceBladeWeaponId,
        selectedAbility,
        [...scenario.attackRoll],
        [...scenario.saveRoll],
      ),
    );
  } catch (error) {
    attackError = error instanceof Error ? error.message : String(error);
    game.eventLog.push(`Debug attack failed: ${attackError}`);
  }

  return {
    game,
    attackError,
    attackerWeaponName: attackerWeapon.name,
    attackerWeaponAbilities,
    selectedAbility,
    selectedAbilityDefinedOnWeapon,
    selectedAbilityRequiresCritical: selectedAbilityDefinition?.requiresCritical ?? false,
  };
}
