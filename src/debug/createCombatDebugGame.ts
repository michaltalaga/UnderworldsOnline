import {
  AttackAction,
  AttackDieFace,
  CardZone,
  CombatActionService,
  DelveAction,
  DelveResolution,
  deterministicFirstPlayerRollOff,
  EndPhaseStep,
  FeatureTokenSide,
  GameActionKind,
  GameEngine,
  GameRecordKind,
  GuardAction,
  MoveAction,
  PassAction,
  PlayPloyAction,
  PlayUpgradeAction,
  ResolveCleanupAction,
  ResolveDiscardCardsAction,
  ResolveDrawObjectivesAction,
  ResolveDrawPowerCardsAction,
  ResolveEquipUpgradesAction,
  ResolveScoreObjectivesAction,
  SaveDieFace,
  UseWarscrollAbilityAction,
  WeaponAbilityKind,
  createCombatReadySetupPracticeGame,
  type Game,
  type Player,
  type WarscrollAbilityDefinition,
  type WeaponDefinition,
} from "../domain";
import type { Card } from "../domain/cards/Card";

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

export type DelveDebugSnapshot = {
  game: Game;
};

export type PloyDebugSnapshot = {
  game: Game;
  ployOptions: readonly PloyDebugOption[];
  selectedPloyActionKey: string | null;
  ployActionError: string | null;
};

export type UpgradeDebugSnapshot = {
  game: Game;
  upgradeOptions: readonly UpgradeDebugOption[];
  selectedUpgradeActionKey: string | null;
  upgradeActionError: string | null;
  gloryBeforeUpgrades: number;
  gloryAfterUpgrades: number;
};

export type PloyDebugOption = {
  actionKey: string;
  action: PlayPloyAction;
  cardName: string;
  targetFighterName: string | null;
  targetOwnerPlayerName: string | null;
};

export type UpgradeDebugOption = {
  actionKey: string;
  action: PlayUpgradeAction;
  cardName: string;
  fighterName: string;
  gloryCost: number;
};

export type EndPhaseDebugMode = "round" | "final";

export const combatDebugScenarios: readonly CombatDebugScenario[] = [
  {
    id: "success",
    label: "Hit Lands",
    description: "Critical plus hammer beats the defender cleanly and deals damage.",
    attackRoll: [AttackDieFace.Critical, AttackDieFace.Hammer],
    saveRoll: [SaveDieFace.Support],
  },
  {
    id: "draw",
    label: "Stalemate",
    description: "One hit meets one shield, so Cleave can visibly change the outcome.",
    attackRoll: [AttackDieFace.Hammer, AttackDieFace.Support],
    saveRoll: [SaveDieFace.Shield],
  },
  {
    id: "failure",
    label: "Defended",
    description: "The defender spikes a critical save and shuts the attack down.",
    attackRoll: [AttackDieFace.Hammer, AttackDieFace.Support],
    saveRoll: [SaveDieFace.Critical],
  },
  {
    id: "dodge",
    label: "Dodge Check",
    description: "One hit meets one dodge, so Ensnare can visibly change the outcome.",
    attackRoll: [AttackDieFace.Hammer, AttackDieFace.Support],
    saveRoll: [SaveDieFace.Dodge],
  },
  {
    id: "support",
    label: "Support Check",
    description: "Support icons stay neutral until a rule like stagger or cover turns them into successes.",
    attackRoll: [AttackDieFace.Support, AttackDieFace.Support],
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
    [deterministicFirstPlayerRollOff],
    "player:one",
  );

  const playerOneRef = game.players[0];
  const playerTwoRef = game.players[1];
  if (playerOneRef === undefined || playerTwoRef === undefined) {
    throw new Error("Could not find both players for combat debug setup.");
  }
  const debugDefender = game.getFighter(debugDefenderId);
  const attackerFighter = game.getFighter(playerTwoFighterOneId);
  if (debugDefender === undefined || attackerFighter === undefined) {
    throw new Error("Could not find debug fighters.");
  }

  engine.applyGameAction(
    game,
    new MoveAction(playerOneRef, debugDefender, defenderMovePath),
  );
  engine.applyGameAction(game, new PassAction(playerOneRef));

  engine.applyGameAction(
    game,
    new MoveAction(playerTwoRef, attackerFighter, attackerMovePath),
  );
  engine.applyGameAction(game, new PassAction(playerTwoRef));

  engine.applyGameAction(game, new PassAction(playerOneRef));
  const warscrollPlayer = game.players[0];
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
        new UseWarscrollAbilityAction(warscrollPlayer, selectedWarscrollAbilityIndex),
      );
    } catch (error) {
      warscrollAbilityError = error instanceof Error ? error.message : String(error);
      game.eventLog.push(`Debug warscroll ability failed: ${warscrollAbilityError}`);
    }
  }

  const powerHandAfterWarscroll = warscrollPlayer.powerHand.length;
  const warscrollTokensAfter = { ...warscrollPlayer.warscrollState.tokens };

  engine.applyGameAction(game, new PassAction(playerOneRef));

  const defender = game.getFighter(debugDefenderId);
  if (defender === undefined) {
    throw new Error(`Could not find debug defender ${debugDefenderId}.`);
  }

  applyDebugDefenderFeatureToken(game, defender.id, defenderState);
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

  const attackerPlayer = game.players[1];
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
        playerTwoRef,
        attackerFighter,
        defender,
        attackerWeapon,
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
  const engine = new GameEngine();
  const playerOne = game.players[0];

  if (playerOne === undefined) {
    throw new Error("Could not find player one for end-phase debug setup.");
  }

  if (mode === "final") {
    game.roundNumber = game.maxRounds;
    game.eventLog.push("Debug setup forced the game to its final round before round start.");
  }

  seedEndPhaseDebugObjective(game, playerOne);
  movePowerCardsToDiscard(playerOne.powerHand, playerOne.powerDeck.discardPile, 2);
  game.eventLog.push("Debug setup moved 2 power cards from Player One hand to discard before round start.");

  engine.startCombatRound(
    game,
    [deterministicFirstPlayerRollOff],
    "player:one",
  );

  const guardedFighterId = playerOne.fighters[0]?.id;
  if (guardedFighterId === undefined) {
    throw new Error("Could not find a fighter to guard during end-phase debug setup.");
  }

  const guardedFighter = playerOne.fighters[0]!;
  engine.applyGameAction(game, new GuardAction(playerOne, guardedFighter));
  engine.applyGameAction(game, new PassAction(playerOne));

  while (game.state.kind === "combatTurn") {
    const activePlayer = game.activePlayer!;
    engine.applyGameAction(game, new PassAction(activePlayer));
  }

  seedEndPhaseDebugDelves(game, playerOne);

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

export function createDelveDebugSnapshot(): DelveDebugSnapshot {
  const game = createCombatReadySetupPracticeGame("game:setup-practice:delve-debug");
  const engine = new GameEngine();

  engine.startCombatRound(
    game,
    [deterministicFirstPlayerRollOff],
    "player:one",
  );
  const delvePlayerOne = game.players[0];
  const delveFighter = game.getFighter(playerOneFighterThreeId);
  const delveToken = game.board.getFeatureToken("feature:2" as never);
  if (delvePlayerOne === undefined || delveFighter === undefined || delveToken === undefined) {
    throw new Error("Could not find delve debug refs.");
  }
  engine.applyGameAction(
    game,
    new MoveAction(delvePlayerOne, delveFighter, ["hex:r1:c2"]),
  );
  engine.applyGameAction(
    game,
    new DelveAction(delvePlayerOne, delveFighter, delveToken),
  );

  return { game };
}

export function createPloyDebugSnapshot(
  selectedPloyActionKey: string | null = null,
): PloyDebugSnapshot {
  const game = createCombatReadySetupPracticeGame("game:setup-practice:ploy-debug");
  const engine = new GameEngine();
  const actionService = new CombatActionService();

  engine.startCombatRound(
    game,
    [deterministicFirstPlayerRollOff],
    "player:one",
  );
  const playerOne = game.players[0];
  const playerTwo = game.players[1];
  if (playerOne === undefined || playerTwo === undefined) {
    throw new Error("Could not find both players for ploy debug setup.");
  }
  engine.applyGameAction(game, new PassAction(playerOne));

  const friendlyTargetedPloy = playerOne.powerDeck.drawPile.find(
    (card) => card.name === "Practice Ploy 09",
  );
  if (friendlyTargetedPloy === undefined) {
    throw new Error("Could not find Practice Ploy 09 in Player One draw pile.");
  }

  playerOne.powerDeck.drawPile = playerOne.powerDeck.drawPile.filter(
    (card) => card.id !== friendlyTargetedPloy.id,
  );
  friendlyTargetedPloy.zone = CardZone.PowerHand;
  playerOne.powerHand.push(friendlyTargetedPloy);
  game.eventLog.push("Debug setup moved Practice Ploy 09 into Player One hand.");

  const enemyTargetedPloy = playerOne.powerDeck.drawPile.find(
    (card) => card.name === "Practice Ploy 10",
  );
  if (enemyTargetedPloy === undefined) {
    throw new Error("Could not find Practice Ploy 10 in Player One draw pile.");
  }

  playerOne.powerDeck.drawPile = playerOne.powerDeck.drawPile.filter(
    (card) => card.id !== enemyTargetedPloy.id,
  );
  enemyTargetedPloy.zone = CardZone.PowerHand;
  playerOne.powerHand.push(enemyTargetedPloy);
  game.eventLog.push("Debug setup moved Practice Ploy 10 into Player One hand.");

  const ployOptions = actionService
    .getLegalActions(game, playerOne.id)
    .flatMap((action) =>
      action instanceof PlayPloyAction ? [createPloyDebugOption(game, playerOne.id, action)] : [],
    );

  let ployActionError: string | null = null;
  if (selectedPloyActionKey !== null) {
    const selectedOption = ployOptions.find((option) => option.actionKey === selectedPloyActionKey);
    if (selectedOption === undefined) {
      ployActionError = `Selected ploy action ${selectedPloyActionKey} is not legal in the captured power step.`;
      game.eventLog.push(`Debug ploy failed: ${ployActionError}`);
    } else {
      try {
        engine.applyGameAction(game, selectedOption.action);
      } catch (error) {
        ployActionError = error instanceof Error ? error.message : String(error);
        game.eventLog.push(`Debug ploy failed: ${ployActionError}`);
      }
    }
  }

  return {
    game,
    ployOptions,
    selectedPloyActionKey,
    ployActionError,
  };
}

export function createUpgradeDebugSnapshot(
  selectedUpgradeActionKey: string | null = null,
): UpgradeDebugSnapshot {
  const game = createCombatReadySetupPracticeGame("game:setup-practice:upgrade-debug");
  const engine = new GameEngine();
  const actionService = new CombatActionService();

  engine.startCombatRound(
    game,
    [deterministicFirstPlayerRollOff],
    "player:one",
  );
  const playerOne = game.players[0];
  if (playerOne === undefined) {
    throw new Error("Could not find Player One for upgrade debug setup.");
  }
  engine.applyGameAction(game, new PassAction(playerOne));

  playerOne.glory = 2;
  game.eventLog.push("Debug setup granted Player One 2 glory for upgrade replay.");
  movePowerCardFromDrawPileToHand(
    game,
    playerOne.id,
    "Practice Upgrade 01",
  );
  movePowerCardFromDrawPileToHand(
    game,
    playerOne.id,
    "Practice Upgrade 02",
  );

  const gloryBeforeUpgrades = playerOne.glory;
  const upgradeOptions = actionService
    .getLegalActions(game, playerOne.id)
    .flatMap((action) =>
      action instanceof PlayUpgradeAction
        ? [createUpgradeDebugOption(game, playerOne.id, action)]
        : [],
    );

  let upgradeActionError: string | null = null;
  if (selectedUpgradeActionKey !== null) {
    const selectedOption = upgradeOptions.find(
      (option) => option.actionKey === selectedUpgradeActionKey,
    );
    if (selectedOption === undefined) {
      upgradeActionError = `Selected upgrade action ${selectedUpgradeActionKey} is not legal in the captured power step.`;
      game.eventLog.push(`Debug upgrade failed: ${upgradeActionError}`);
    } else {
      try {
        engine.applyGameAction(game, selectedOption.action);
      } catch (error) {
        upgradeActionError = error instanceof Error ? error.message : String(error);
        game.eventLog.push(`Debug upgrade failed: ${upgradeActionError}`);
      }
    }
  }

  return {
    game,
    upgradeOptions,
    selectedUpgradeActionKey,
    upgradeActionError,
    gloryBeforeUpgrades,
    gloryAfterUpgrades: playerOne.glory,
  };
}

function movePowerCardsToDiscard(
  hand: Card[],
  discardPile: Card[],
  count: number,
): void {
  const discardedCards = hand.splice(0, count);
  for (const card of discardedCards) {
    card.zone = CardZone.PowerDiscard;
    discardPile.push(card);
  }
}

function applyDebugDefenderFeatureToken(
  game: Game,
  defenderId: string,
  defenderState: CombatDebugDefenderState,
): void {
  const defender = game.getFighter(defenderId);
  const defenderHex = defender?.currentHex ?? null;
  if (defender === undefined || defenderHex === null) {
    throw new Error(`Could not place debug feature token state for defender ${defenderId}.`);
  }

  const existingFeatureToken = defenderHex.featureToken;
  if (existingFeatureToken !== null) {
    existingFeatureToken.side = defenderState.isOnCoverToken
      ? FeatureTokenSide.Cover
      : FeatureTokenSide.Treasure;
    existingFeatureToken.heldByFighter = null;
    return;
  }

  if (!defenderState.isOnCoverToken) {
    return;
  }

  const debugFeatureToken = game.board.getFeatureToken("feature:1");
  if (debugFeatureToken === undefined) {
    throw new Error("Could not find debug feature token feature:1.");
  }

  const previousHex = debugFeatureToken.hex;
  if (previousHex.featureToken === debugFeatureToken) {
    previousHex.featureToken = null;
  }

  debugFeatureToken.hex = defenderHex;
  debugFeatureToken.side = FeatureTokenSide.Cover;
  debugFeatureToken.heldByFighter = null;
  defenderHex.featureToken = debugFeatureToken;
}

function getDefenderFeatureTokenSnapshot(
  game: Game,
  defenderId: string,
): CombatDebugFeatureTokenSnapshot {
  const defender = game.getFighter(defenderId);
  const fighterHex = defender?.currentHex ?? null;
  if (defender === undefined || fighterHex === null) {
    throw new Error(`Could not capture feature token snapshot for defender ${defenderId}.`);
  }

  const featureToken = fighterHex.featureToken;
  if (featureToken === null) {
    return {
      fighterHexId: fighterHex.id,
      featureTokenId: null,
      featureTokenSide: null,
      heldByFighterId: null,
    };
  }

  return {
    fighterHexId: fighterHex.id,
    featureTokenId: featureToken.id,
    featureTokenSide: featureToken.side,
    heldByFighterId: featureToken.heldByFighter?.id ?? null,
  };
}

function seedEndPhaseDebugObjective(game: Game, player: Player): void {
  const objectiveName = "Practice Objective 04";
  const existingObjective = player.objectiveHand.find((card) => card.name === objectiveName);
  if (existingObjective !== undefined) {
    return;
  }

  const sourceIndex = player.objectiveDeck.drawPile.findIndex(
    (card) => card.name === objectiveName,
  );
  if (sourceIndex === -1) {
    throw new Error(`Could not find ${objectiveName} in Player One objective deck for debug setup.`);
  }

  const replacementCard = player.objectiveHand.shift();
  const objectiveCard = player.objectiveDeck.drawPile.splice(sourceIndex, 1)[0];
  if (replacementCard === undefined || objectiveCard === undefined) {
    throw new Error("Could not swap in the end-phase debug objective.");
  }

  replacementCard.zone = CardZone.ObjectiveDeck;
  player.objectiveDeck.drawPile.push(replacementCard);
  objectiveCard.zone = CardZone.ObjectiveHand;
  player.objectiveHand.push(objectiveCard);
  game.eventLog.push("Debug setup swapped Practice Objective 04 into Player One's hand.");
}

function seedEndPhaseDebugDelves(game: Game, player: Player): void {
  const fighter = player.fighters[0];
  const fighterDefinition = fighter === undefined ? undefined : player.getFighterDefinition(fighter.id);
  if (fighter === undefined || fighterDefinition === undefined) {
    throw new Error("Could not find a fighter to seed end-phase delve history.");
  }

  const treasureTokens = game.board.featureTokens.slice(0, 3);
  if (treasureTokens.length < 3) {
    throw new Error("End-phase debug setup expected at least 3 feature tokens.");
  }

  for (const featureToken of treasureTokens) {
    game.addRecord(
      GameRecordKind.Delve,
      new DelveResolution(
        game.roundNumber,
        player,
        fighter,
        featureToken,
        FeatureTokenSide.Treasure,
        FeatureTokenSide.Cover,
        true,
        null,
      ),
      {
        invokedByPlayer: player,
        invokedByFighter: fighter,
        actionKind: GameActionKind.Delve,
      },
    );
  }

  game.eventLog.push("Debug setup seeded 3 treasure delve events for Player One this round.");
}

function createPloyDebugOption(
  game: Game,
  playerId: string,
  action: PlayPloyAction,
): PloyDebugOption {
  const player = game.getPlayer(playerId);
  const card = player?.getCard(action.card.id);
  if (player === undefined || card === undefined) {
    throw new Error(`Could not build ploy debug option for card ${action.card.id}.`);
  }

  const targetDetails = getPloyDebugTargetDetails(game, action.targetFighter?.id ?? null);

  return {
    actionKey: getPloyDebugActionKey(action),
    action,
    cardName: card.name,
    targetFighterName: targetDetails.targetFighterName,
    targetOwnerPlayerName: targetDetails.targetOwnerPlayerName,
  };
}

function getPloyDebugActionKey(action: PlayPloyAction): string {
  return `${action.card.id}:${action.targetFighter?.id ?? "none"}`;
}

function getPloyDebugTargetDetails(
  game: Game,
  targetFighterId: string | null,
): {
  targetFighterName: string | null;
  targetOwnerPlayerName: string | null;
} {
  if (targetFighterId === null) {
    return {
      targetFighterName: null,
      targetOwnerPlayerName: null,
    };
  }

  for (const player of game.players) {
    const fighterDefinition = player.getFighterDefinition(targetFighterId);
    if (fighterDefinition !== undefined) {
      return {
        targetFighterName: fighterDefinition.name,
        targetOwnerPlayerName: player.name,
      };
    }
  }

  return {
    targetFighterName: targetFighterId,
    targetOwnerPlayerName: null,
  };
}

function createUpgradeDebugOption(
  game: Game,
  playerId: string,
  action: PlayUpgradeAction,
): UpgradeDebugOption {
  const player = game.getPlayer(playerId);
  const card = player?.getCard(action.card.id);
  const fighterDefinition = player?.getFighterDefinition(action.fighter.id);
  if (
    player === undefined ||
    card === undefined ||
    fighterDefinition === undefined
  ) {
    throw new Error(`Could not build upgrade debug option for card ${action.card.id}.`);
  }

  return {
    actionKey: getUpgradeDebugActionKey(action),
    action,
    cardName: card.name,
    fighterName: fighterDefinition.name,
    gloryCost: card.gloryValue,
  };
}

function getUpgradeDebugActionKey(action: PlayUpgradeAction): string {
  return `${action.card.id}:${action.fighter.id}`;
}

function movePowerCardFromDrawPileToHand(
  game: Game,
  playerId: string,
  cardName: string,
): void {
  const player = game.getPlayer(playerId);
  if (player === undefined) {
    throw new Error(`Could not find player ${playerId} for debug power card setup.`);
  }

  const card = player.powerDeck.drawPile.find((candidate) => candidate.name === cardName);
  if (card === undefined) {
    throw new Error(`Could not find power card ${cardName} in ${player.name}'s draw pile.`);
  }

  player.powerDeck.drawPile = player.powerDeck.drawPile.filter((candidate) => candidate.id !== card.id);
  card.zone = CardZone.PowerHand;
  player.powerHand.push(card);
  game.eventLog.push(`Debug setup moved ${card.name} into ${player.name}'s hand.`);
}
