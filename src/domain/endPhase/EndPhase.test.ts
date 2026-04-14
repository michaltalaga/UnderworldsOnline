import { describe, it, expect } from "vitest";
import {
  EndPhaseActionKind,
  EndPhaseActionService,
  EndPhaseStep,
  GameRecordKind,
  Phase,
  ResolveScoreObjectivesAction,
  ResolveEquipUpgradesAction,
  ResolveDiscardCardsAction,
  ResolveDrawObjectivesAction,
  ResolveDrawPowerCardsAction,
  ResolveCleanupAction,
} from "../index";
import { createGameInEndPhase } from "../../test-utils";

// ---------------------------------------------------------------------------
// End phase — exemplar for the end-phase layer.
// ---------------------------------------------------------------------------
// The end phase is deterministic: at every step, `EndPhaseActionService`
// returns exactly one legal action. Tests here assert step ordering,
// record emission, and the transition back to combat-ready for round 2.
//
// Scope: does NOT duplicate per-card scoring logic (that lives in
// card-layer tests). Here we only verify the orchestration of the
// ScoreObjectives → EquipUpgrades → DiscardCards → DrawObjectives →
// DrawPowerCards → Cleanup sequence.
// ---------------------------------------------------------------------------

describe("End phase step sequence", () => {
  it("offers exactly one legal action per step", () => {
    const { game } = createGameInEndPhase("player:one");
    const service = new EndPhaseActionService();

    expect(game.phase).toBe(Phase.End);
    expect(game.endPhaseStep).toBe(EndPhaseStep.ScoreObjectives);

    const legal = service.getLegalActions(game);
    expect(legal).toHaveLength(1);
    expect(legal[0]).toBeInstanceOf(ResolveScoreObjectivesAction);
  });

  it("walks ScoreObjectives → EquipUpgrades → DiscardCards → DrawObjectives → DrawPowerCards → Cleanup", () => {
    const { game, engine } = createGameInEndPhase("player:one");
    const service = new EndPhaseActionService();

    const observedSteps: (EndPhaseStep | null)[] = [];
    while (game.phase === Phase.End) {
      observedSteps.push(game.endPhaseStep);
      const [action] = service.getLegalActions(game);
      engine.applyEndPhaseAction(game, action);
    }

    expect(observedSteps).toEqual([
      EndPhaseStep.ScoreObjectives,
      EndPhaseStep.EquipUpgrades,
      EndPhaseStep.DiscardCards,
      EndPhaseStep.DrawObjectives,
      EndPhaseStep.DrawPowerCards,
      EndPhaseStep.Cleanup,
    ]);
  });

  it("returns no legal actions once the end phase is complete", () => {
    const { game, engine } = createGameInEndPhase("player:one");
    const service = new EndPhaseActionService();

    while (game.phase === Phase.End) {
      const [action] = service.getLegalActions(game);
      engine.applyEndPhaseAction(game, action);
    }

    expect(service.getLegalActions(game)).toEqual([]);
  });

  it("yields a matching action type per step", () => {
    const { game, engine } = createGameInEndPhase("player:one");
    const service = new EndPhaseActionService();
    const expected: [EndPhaseStep, Function][] = [
      [EndPhaseStep.ScoreObjectives, ResolveScoreObjectivesAction],
      [EndPhaseStep.EquipUpgrades, ResolveEquipUpgradesAction],
      [EndPhaseStep.DiscardCards, ResolveDiscardCardsAction],
      [EndPhaseStep.DrawObjectives, ResolveDrawObjectivesAction],
      [EndPhaseStep.DrawPowerCards, ResolveDrawPowerCardsAction],
      [EndPhaseStep.Cleanup, ResolveCleanupAction],
    ];

    for (const [step, Ctor] of expected) {
      expect(game.endPhaseStep).toBe(step);
      const [action] = service.getLegalActions(game);
      expect(action).toBeInstanceOf(Ctor);
      engine.applyEndPhaseAction(game, action);
    }
  });
});

describe("End phase record emission", () => {
  it("records ObjectiveScoring, ObjectiveDraw, PowerDraw, and Cleanup during the end phase", () => {
    const { game, engine } = createGameInEndPhase("player:one");
    const service = new EndPhaseActionService();

    while (game.phase === Phase.End) {
      const [action] = service.getLegalActions(game);
      engine.applyEndPhaseAction(game, action);
    }

    // At least one of each — scoring emits per-player resolutions in
    // addition to the combined one, so counts may exceed 1.
    expect(game.getEventHistory(GameRecordKind.ObjectiveScoring).length).toBeGreaterThan(0);
    expect(game.getEventHistory(GameRecordKind.ObjectiveDraw)).toHaveLength(1);
    expect(game.getEventHistory(GameRecordKind.PowerDraw)).toHaveLength(1);
    expect(game.getEventHistory(GameRecordKind.Cleanup)).toHaveLength(1);
  });

  it("tags each end-phase record with its EndPhaseActionKind", () => {
    const { game, engine } = createGameInEndPhase("player:one");
    const service = new EndPhaseActionService();

    while (game.phase === Phase.End) {
      const [action] = service.getLegalActions(game);
      engine.applyEndPhaseAction(game, action);
    }

    const scoring = game.getLatestEvent(GameRecordKind.ObjectiveScoring);
    expect(scoring?.actionKind).toBe(EndPhaseActionKind.ResolveScoreObjectives);

    const cleanup = game.getLatestEvent(GameRecordKind.Cleanup);
    expect(cleanup?.actionKind).toBe(EndPhaseActionKind.ResolveCleanup);
  });
});

describe("End phase cleanup → round 2", () => {
  it("returns to combatReady and increments roundNumber after cleanup", () => {
    const { game, engine } = createGameInEndPhase("player:one");
    const service = new EndPhaseActionService();

    expect(game.roundNumber).toBe(1);

    while (game.phase === Phase.End) {
      const [action] = service.getLegalActions(game);
      engine.applyEndPhaseAction(game, action);
    }

    expect(game.phase).toBe(Phase.Combat);
    expect(game.isCombatReady()).toBe(true);
    expect(game.roundNumber).toBe(2);
  });

  it("resets per-round player state (turnsTakenThisRound, hasDelvedThisPowerStep)", () => {
    const { game, engine } = createGameInEndPhase("player:one");
    const service = new EndPhaseActionService();

    // Each player took 4 turns in round 1 before we entered end phase.
    for (const player of game.players) {
      expect(player.turnsTakenThisRound).toBeGreaterThan(0);
    }

    while (game.phase === Phase.End) {
      const [action] = service.getLegalActions(game);
      engine.applyEndPhaseAction(game, action);
    }

    for (const player of game.players) {
      expect(player.turnsTakenThisRound).toBe(0);
      expect(player.hasDelvedThisPowerStep).toBe(false);
    }
  });
});
