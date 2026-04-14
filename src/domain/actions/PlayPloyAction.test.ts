import { describe, it, expect } from "vitest";
import {
  CardZone,
  CombatActionService,
  GameActionKind,
  GameRecordKind,
  PlayPloyAction,
} from "../index";
import { GiveGuardPloy, GiveStaggerPloy } from "../content/cards/SetupPracticeCards";
import { CardPlayedEvent, PloyPlayedEvent } from "../events";
import {
  createGameInActionStep,
  createGameInPowerStep,
  findLatestEvent,
  getLegalActionsOfType,
} from "../../test-utils";

// ---------------------------------------------------------------------------
// PlayPloyAction — playable in the power step (and in the active-combat
// reaction window for reaction ploys).  Tests drive end-to-end flow by
// seeding a known ploy (GiveGuardPloy) directly into the player's
// power hand so legality does not depend on RNG deck order.
// ---------------------------------------------------------------------------

function seedGuardPloy(
  game: ReturnType<typeof createGameInPowerStep>["game"],
  playerId: "player:one" | "player:two" = "player:one",
): GiveGuardPloy {
  const owner = game.getPlayer(playerId)!;
  const ploy = new GiveGuardPloy("ploy-guard-test", owner, CardZone.PowerHand, "99");
  owner.powerHand.push(ploy);
  return ploy;
}

describe("PlayPloyAction eligibility", () => {
  it("is NOT legal in the action step (even when ploy is in hand)", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const owner = game.getPlayer("player:one")!;
    const ploy = new GiveGuardPloy("ploy-guard-test", owner, CardZone.PowerHand, "99");
    owner.powerHand.push(ploy);

    const plays = getLegalActionsOfType(service, game, "player:one", PlayPloyAction);
    // None of the plays reference the seeded ploy.
    expect(plays.find((p) => p.card === ploy)).toBeUndefined();
  });

  it("is legal in the power step with a friendly fighter as target", () => {
    const { game } = createGameInPowerStep("player:one");
    const service = new CombatActionService();
    const ploy = seedGuardPloy(game);

    const plays = getLegalActionsOfType(service, game, "player:one", PlayPloyAction);
    const playsForPloy = plays.filter((p) => p.card === ploy);
    expect(playsForPloy.length).toBeGreaterThan(0);
    // Every play of GiveGuardPloy targets a friendly fighter by id.
    for (const play of playsForPloy) {
      expect(play.targetFighter?.id).not.toBeNull();
      const fighter = game.getFighter(play.targetFighter?.id!);
      expect(fighter?.ownerPlayerId).toBe("player:one");
    }
  });

  it("is NOT legal for the opponent's power hand", () => {
    const { game } = createGameInPowerStep("player:one");
    const ploy = seedGuardPloy(game);
    const service = new CombatActionService();

    const opponentPlays = getLegalActionsOfType(
      service,
      game,
      "player:two",
      PlayPloyAction,
    );
    // player:two is not the active player in power step; nothing targets our ploy.
    expect(opponentPlays.find((p) => p.card === ploy)).toBeUndefined();
  });
});

describe("PlayPloyAction resolution", () => {
  it("moves the card to the discard pile and applies its effect (guard token)", () => {
    const { game, engine } = createGameInPowerStep("player:one");
    const ploy = seedGuardPloy(game);
    const service = new CombatActionService();

    const plays = getLegalActionsOfType(service, game, "player:one", PlayPloyAction)
      .filter((p) => p.card === ploy);
    expect(plays.length).toBeGreaterThan(0);

    const play = plays[0];
    const target = game.getFighter(play.targetFighter?.id!)!;
    expect(target.hasGuardToken).toBe(false);

    engine.applyGameAction(game, play);

    expect(target.hasGuardToken).toBe(true);
    expect(ploy.zone).toBe(CardZone.PowerDiscard);
    const owner = game.getPlayer("player:one")!;
    expect(owner.powerHand.includes(ploy)).toBe(false);
  });

  it("emits CardPlayedEvent and PloyPlayedEvent, records a Ploy resolution", () => {
    const { game, engine } = createGameInPowerStep("player:one");
    const ploy = seedGuardPloy(game);
    const service = new CombatActionService();

    const play = getLegalActionsOfType(service, game, "player:one", PlayPloyAction)
      .filter((p) => p.card === ploy)[0];
    engine.applyGameAction(game, play);

    expect(findLatestEvent(game, CardPlayedEvent)).not.toBeNull();
    expect(findLatestEvent(game, PloyPlayedEvent)).not.toBeNull();

    const records = game.getEventHistory(GameRecordKind.Ploy);
    expect(records).toHaveLength(1);
    expect(records[0].actionKind).toBe(GameActionKind.PlayPloy);
  });

  it("GiveStaggerPloy targets enemy fighters without stagger", () => {
    const { game } = createGameInPowerStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const ploy = new GiveStaggerPloy("ploy-stagger-test", owner, CardZone.PowerHand, "99");
    owner.powerHand.push(ploy);
    const service = new CombatActionService();

    const plays = getLegalActionsOfType(service, game, "player:one", PlayPloyAction)
      .filter((p) => p.card === ploy);
    expect(plays.length).toBeGreaterThan(0);
    for (const play of plays) {
      const target = game.getFighter(play.targetFighter?.id!);
      expect(target?.ownerPlayerId).toBe("player:two");
      expect(target?.hasStaggerToken).toBe(false);
    }
  });

  it("rejects playing a card the player doesn't hold", () => {
    const { game, engine } = createGameInPowerStep("player:one");

    expect(() =>
      engine.applyGameAction(
        game,
        new PlayPloyAction(game.getPlayer("player:one")!, "not-a-real-card" as never, null),
      ),
    ).toThrow();
  });
});
