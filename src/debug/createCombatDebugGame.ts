import {
  AttackAction,
  AttackDieFace,
  CardZone,
  CombatActionService,
  EndPhaseStep,
  FeatureTokenSide,
  GameEngine,
  GuardAction,
  MoveAction,
  PassAction,
  PlayPloyAction,
  ResolveCleanupAction,
  ResolveDiscardCardsAction,
  ResolveDrawObjectivesAction,
  ResolveDrawPowerCardsAction,
  ResolveEquipUpgradesAction,
  ResolveScoreObjectivesAction,
  SaveDieFace,
  ScoringResolver,
  UseWarscrollAbilityAction,
  WeaponAbilityKind,
  createCombatReadySetupPracticeGame,
  type CardInstance,
  type Game,
  type WarscrollAbilityDefinition,
  type WeaponDefinition,
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
  isOnCoverToken?: boolean;
};

export type CombatDebugFeatureTokenSnapshot = {
  fighterHexId: string;
  featureTokenId: string | null;
  featureTokenSide: FeatureTokenSide | null;
  heldByFighterId: string | null;
};

export type CombatDebugSnapshot = {
  game: Game;
  attackError: string | null;
  attackerWeapon: WeaponDefinition;
  defenderFeatureTokenBeforeAttack: CombatDebugFeatureTokenSnapshot;
  playerWarscrollName: string;
  warscrollAbilityOptions: readonly CombatDebugWarscrollAbilityOption[];
  warscrollTokensBefore: Readonly<Record<string, number>>;
  warscrollTokensAfter: Readonly<Record<string, number>>;
  powerHandBeforeWarscroll: number;
  powerHandAfterWarscroll: number;
  warscrollAbilityError: string | null;
  selectedAbility: WeaponAbilityKind | null;
  selectedWarscrollAbilityIndex: number | null;
};

export type CombatDebugWarscrollAbilityOption = {
  abilityIndex: number;
  definition: WarscrollAbilityDefinition;
  isLegal: boolean;
};

export type EndPhaseDebugSnapshot = {
  game: Game;
};

export type PloyDebugSnapshot = {
  game: Game;
};

export type EndPhaseDebugMode = "round" | "final";

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
    description: "Support icons stay neutral until a rule like stagger or cover turns them into successes.",
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
  selectedWarscrollAbilityIndex: number | null = null,
): Game {
  return createCombatDebugSnapshot(
    scenarioId,
    defenderState,
    selectedAbility,
    selectedWarscrollAbilityIndex,
  ).game;
}

export function createCombatDebugSnapshot(
  scenarioId: CombatDebugScenarioId = "success",
  defenderState: CombatDebugDefenderState = {},
  selectedAbility: WeaponAbilityKind | null = null,
  selectedWarscrollAbilityIndex: number | null = null,
): CombatDebugSnapshot {
  const scenario = getCombatDebugScenario(scenarioId);
  const game = createCombatReadySetupPracticeGame("game:setup-practice:combat-debug");
  const engine = new GameEngine();
  const actionService = new CombatActionService();
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
  const warscrollPlayer = game.getPlayer("player:one");
  const playerWarscroll = warscrollPlayer?.getWarscrollWithDefinition();
  if (warscrollPlayer === undefined || playerWarscroll === undefined) {
    throw new Error("Could not find player one's warscroll state for debug setup.");
  }

  const powerHandBeforeWarscroll = warscrollPlayer.powerHand.length;
  const warscrollTokensBefore = { ...warscrollPlayer.warscrollState.tokens };
  const legalWarscrollAbilityIndices = new Set(
    actionService.getLegalActions(game, warscrollPlayer.id).flatMap((action) =>
      action instanceof UseWarscrollAbilityAction ? [action.abilityIndex] : []
    ),
  );
  const warscrollAbilityOptions = playerWarscroll.definition.abilities.map((definition, abilityIndex) => ({
    abilityIndex,
    definition,
    isLegal: legalWarscrollAbilityIndices.has(abilityIndex),
  }));

  let warscrollAbilityError: string | null = null;
  if (selectedWarscrollAbilityIndex !== null) {
    try {
      engine.applyGameAction(
        game,
        new UseWarscrollAbilityAction(warscrollPlayer.id, selectedWarscrollAbilityIndex),
      );
    } catch (error) {
      warscrollAbilityError = error instanceof Error ? error.message : String(error);
      game.eventLog.push(`Debug warscroll ability failed: ${warscrollAbilityError}`);
    }
  }

  const powerHandAfterWarscroll = warscrollPlayer.powerHand.length;
  const warscrollTokensAfter = { ...warscrollPlayer.warscrollState.tokens };

  engine.applyGameAction(game, new PassAction("player:one"));

  const defender = game.getFighter(debugDefenderId);
  if (defender === undefined) {
    throw new Error(`Could not find debug defender ${debugDefenderId}.`);
  }

  applyDebugDefenderFeatureTokenState(game, defender.id, defenderState);
  defender.hasGuardToken = defenderState.hasGuardToken ?? false;
  defender.hasStaggerToken = defenderState.hasStaggerToken ?? false;

  const defenderEffects: string[] = [];
  if (defender.hasGuardToken) {
    defenderEffects.push("guard");
  }

  if (defender.hasStaggerToken) {
    defenderEffects.push("stagger");
  }

  if (defenderState.isOnCoverToken) {
    defenderEffects.push("cover");
  }

  if (defenderEffects.length > 0) {
    game.eventLog.push(`Debug setup applied defender tokens: ${defenderEffects.join(", ")}.`);
  }

  const attackerPlayer = game.getPlayer("player:two");
  const attackerWeapon = attackerPlayer?.getFighterWeaponDefinition(playerTwoFighterOneId, practiceBladeWeaponId);
  if (attackerWeapon === undefined) {
    throw new Error(`Could not find debug weapon ${practiceBladeWeaponId}.`);
  }

  const defenderFeatureTokenBeforeAttack = getDefenderFeatureTokenSnapshot(game, defender.id);
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
    attackerWeapon,
    defenderFeatureTokenBeforeAttack,
    playerWarscrollName: playerWarscroll.definition.name,
    warscrollAbilityOptions,
    warscrollTokensBefore,
    warscrollTokensAfter,
    powerHandBeforeWarscroll,
    powerHandAfterWarscroll,
    warscrollAbilityError,
    selectedAbility,
    selectedWarscrollAbilityIndex,
  };
}

export function createEndPhaseDebugSnapshot(
  mode: EndPhaseDebugMode = "round",
): EndPhaseDebugSnapshot {
  const gameId =
    mode === "final"
      ? "game:setup-practice:end-phase-debug:final"
      : "game:setup-practice:end-phase-debug";
  const game = createCombatReadySetupPracticeGame(gameId);
  const engine = new GameEngine(undefined, undefined, undefined, new DebugEndPhaseScoringResolver());
  const playerOne = game.getPlayer("player:one");

  if (playerOne === undefined) {
    throw new Error("Could not find player one for end-phase debug setup.");
  }

  if (mode === "final") {
    game.roundNumber = game.maxRounds;
    game.eventLog.push("Debug setup forced the game to its final round before round start.");
  }

  movePowerCardsToDiscard(playerOne.powerHand, playerOne.powerDeck.discardPile, 2);
  game.eventLog.push("Debug setup moved 2 power cards from Player One hand to discard before round start.");

  engine.startCombatRound(
    game,
    [{ firstFace: AttackDieFace.Hammer, secondFace: AttackDieFace.Blank }],
    "player:one",
  );

  const guardedFighterId = playerOne.fighters[0]?.id;
  if (guardedFighterId === undefined) {
    throw new Error("Could not find a fighter to guard during end-phase debug setup.");
  }

  engine.applyGameAction(game, new GuardAction(playerOne.id, guardedFighterId));
  engine.applyGameAction(game, new PassAction(playerOne.id));

  while (game.state.kind === "combatTurn") {
    engine.applyGameAction(game, new PassAction(game.activePlayerId!));
  }

  if (game.endPhaseStep !== EndPhaseStep.ScoreObjectives) {
    throw new Error(`Expected end-phase debug setup to reach scoreObjectives, got ${game.endPhaseStep}.`);
  }

  engine.applyEndPhaseAction(game, new ResolveScoreObjectivesAction());
  engine.applyEndPhaseAction(game, new ResolveEquipUpgradesAction());
  engine.applyEndPhaseAction(game, new ResolveDiscardCardsAction());
  engine.applyEndPhaseAction(game, new ResolveDrawObjectivesAction());
  engine.applyEndPhaseAction(game, new ResolveDrawPowerCardsAction());
  engine.applyEndPhaseAction(game, new ResolveCleanupAction());

  return { game };
}

export function createPloyDebugSnapshot(): PloyDebugSnapshot {
  const game = createCombatReadySetupPracticeGame("game:setup-practice:ploy-debug");
  const engine = new GameEngine();
  const actionService = new CombatActionService();

  engine.startCombatRound(
    game,
    [{ firstFace: AttackDieFace.Hammer, secondFace: AttackDieFace.Blank }],
    "player:one",
  );
  engine.applyGameAction(game, new PassAction("player:one"));

  const playerOne = game.getPlayer("player:one");
  const playerTwo = game.getPlayer("player:two");
  if (playerOne === undefined || playerTwo === undefined) {
    throw new Error("Could not find both players for ploy debug setup.");
  }

  const targetedPloy = playerOne.powerDeck.drawPile.find(
    (card) => card.definitionId === "card-def:setup-practice:ploy:10",
  );
  if (targetedPloy === undefined) {
    throw new Error("Could not find Practice Ploy 10 in Player One draw pile.");
  }

  playerOne.powerDeck.drawPile = playerOne.powerDeck.drawPile.filter(
    (card) => card.id !== targetedPloy.id,
  );
  targetedPloy.zone = CardZone.PowerHand;
  playerOne.powerHand.push(targetedPloy);
  game.eventLog.push("Debug setup moved Practice Ploy 10 into Player One hand.");

  const drawPloy = playerOne.powerHand.find(
    (card) => card.definitionId === "card-def:setup-practice:ploy:01",
  );
  if (drawPloy === undefined) {
    throw new Error("Could not find Practice Ploy 01 in Player One hand.");
  }

  engine.applyGameAction(game, new PlayPloyAction(playerOne.id, drawPloy.id));

  const targetedPloyAction = actionService
    .getLegalActions(game, playerOne.id)
    .find(
      (action): action is PlayPloyAction =>
        action instanceof PlayPloyAction &&
        action.cardId === targetedPloy.id &&
        playerTwo.getFighter(action.targetFighterId ?? "") !== undefined,
    );
  if (targetedPloyAction === undefined) {
    throw new Error("Could not find a legal targeted Practice Ploy 10 action.");
  }

  engine.applyGameAction(game, targetedPloyAction);

  return { game };
}

class DebugEndPhaseScoringResolver extends ScoringResolver {
  public override getScorableObjectives(game: Game, playerId: string): CardInstance[] {
    const player = game.getPlayer(playerId);
    if (player === undefined || player.id !== "player:one") {
      return [];
    }

    return player.objectiveHand.slice(0, 1);
  }
}

function movePowerCardsToDiscard(
  hand: CardInstance[],
  discardPile: CardInstance[],
  count: number,
): void {
  const discardedCards = hand.splice(0, count);
  for (const card of discardedCards) {
    card.zone = CardZone.PowerDiscard;
    discardPile.push(card);
  }
}

function applyDebugDefenderFeatureTokenState(
  game: Game,
  defenderId: string,
  defenderState: CombatDebugDefenderState,
): void {
  const defender = game.getFighter(defenderId);
  const defenderHexId = defender?.currentHexId;
  if (defender === undefined || defenderHexId === null || defenderHexId === undefined) {
    throw new Error(`Could not place debug feature token state for defender ${defenderId}.`);
  }

  const defenderHex = game.board.getHex(defenderHexId);
  if (defenderHex === undefined) {
    throw new Error(`Could not find debug defender hex ${defenderHexId}.`);
  }

  const existingFeatureTokenId = defenderHex.featureTokenId;
  if (existingFeatureTokenId !== null) {
    const existingFeatureToken = game.board.getFeatureToken(existingFeatureTokenId);
    if (existingFeatureToken !== undefined) {
      existingFeatureToken.side = defenderState.isOnCoverToken
        ? FeatureTokenSide.Cover
        : FeatureTokenSide.Treasure;
      existingFeatureToken.heldByFighterId = null;
    }

    return;
  }

  if (!defenderState.isOnCoverToken) {
    return;
  }

  const debugFeatureToken = game.board.getFeatureToken("feature:1");
  if (debugFeatureToken === undefined) {
    throw new Error("Could not find debug feature token feature:1.");
  }

  const previousHex = game.board.getHex(debugFeatureToken.hexId);
  if (previousHex?.featureTokenId === debugFeatureToken.id) {
    previousHex.featureTokenId = null;
  }

  debugFeatureToken.hexId = defenderHex.id;
  debugFeatureToken.side = FeatureTokenSide.Cover;
  debugFeatureToken.heldByFighterId = null;
  defenderHex.featureTokenId = debugFeatureToken.id;
}

function getDefenderFeatureTokenSnapshot(
  game: Game,
  defenderId: string,
): CombatDebugFeatureTokenSnapshot {
  const defender = game.getFighter(defenderId);
  const fighterHexId = defender?.currentHexId;
  if (defender === undefined || fighterHexId === null || fighterHexId === undefined) {
    throw new Error(`Could not capture feature token snapshot for defender ${defenderId}.`);
  }

  const fighterHex = game.board.getHex(fighterHexId);
  if (fighterHex === undefined) {
    throw new Error(`Could not find defender hex ${fighterHexId} for feature token snapshot.`);
  }

  if (fighterHex.featureTokenId === null) {
    return {
      fighterHexId: fighterHex.id,
      featureTokenId: null,
      featureTokenSide: null,
      heldByFighterId: null,
    };
  }

  const featureToken = game.board.getFeatureToken(fighterHex.featureTokenId);
  if (featureToken === undefined) {
    throw new Error(`Could not find feature token ${fighterHex.featureTokenId} for debug snapshot.`);
  }

  return {
    fighterHexId: fighterHex.id,
    featureTokenId: featureToken.id,
    featureTokenSide: featureToken.side,
    heldByFighterId: featureToken.heldByFighterId,
  };
}
