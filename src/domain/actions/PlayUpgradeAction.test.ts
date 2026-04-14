import { describe, it, expect } from "vitest";
import {
  CardZone,
  CombatActionService,
  GameActionKind,
  GameRecordKind,
  PlayUpgradeAction,
} from "../index";
import { PracticeUpgrade } from "../content/cards/SetupPracticeCards";
import { CardPlayedEvent, UpgradeEquippedEvent } from "../events";
import {
  createGameInActionStep,
  createGameInPowerStep,
  findLatestEvent,
  getLegalActionsOfType,
} from "../../test-utils";

// ---------------------------------------------------------------------------
// PlayUpgradeAction — power-step only, requires glory ≥ upgrade cost,
// target must be a friendly fighter on board.  Tests seed a known
// upgrade in the player's hand and ensure enough glory is available.
// ---------------------------------------------------------------------------

function seedPracticeUpgrade(
  game: ReturnType<typeof createGameInPowerStep>["game"],
  playerId: "player:one" | "player:two" = "player:one",
  glory: number = 5,
): PracticeUpgrade {
  const owner = game.getPlayer(playerId)!;
  owner.glory = glory;
  const upgrade = new PracticeUpgrade("upg-practice-test", owner, CardZone.PowerHand, "01");
  owner.powerHand.push(upgrade);
  return upgrade;
}

describe("PlayUpgradeAction eligibility", () => {
  it("is NOT legal in the action step", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const owner = game.getPlayer("player:one")!;
    owner.glory = 5;
    const upgrade = new PracticeUpgrade("upg-test", owner, CardZone.PowerHand, "01");
    owner.powerHand.push(upgrade);

    const plays = getLegalActionsOfType(service, game, "player:one", PlayUpgradeAction);
    expect(plays.find((p) => p.cardId === upgrade.id)).toBeUndefined();
  });

  it("is legal in the power step with enough glory, targeting every friendly fighter", () => {
    const { game } = createGameInPowerStep("player:one");
    const upgrade = seedPracticeUpgrade(game);
    const service = new CombatActionService();

    const plays = getLegalActionsOfType(service, game, "player:one", PlayUpgradeAction)
      .filter((p) => p.cardId === upgrade.id);
    expect(plays.length).toBeGreaterThan(0);
    for (const play of plays) {
      const fighter = game.getFighter(play.fighterId);
      expect(fighter?.ownerPlayerId).toBe("player:one");
      expect(fighter?.isSlain).toBe(false);
    }
  });

  it("is NOT legal with insufficient glory", () => {
    const { game } = createGameInPowerStep("player:one");
    const owner = game.getPlayer("player:one")!;
    owner.glory = 0;
    const upgrade = new PracticeUpgrade("upg-test-broke", owner, CardZone.PowerHand, "01");
    owner.powerHand.push(upgrade);
    const service = new CombatActionService();

    const plays = getLegalActionsOfType(service, game, "player:one", PlayUpgradeAction)
      .filter((p) => p.cardId === upgrade.id);
    expect(plays).toEqual([]);
  });
});

describe("PlayUpgradeAction resolution", () => {
  it("attaches the upgrade to the chosen fighter and spends glory", () => {
    const { game, engine } = createGameInPowerStep("player:one");
    const upgrade = seedPracticeUpgrade(game, "player:one", 5);
    const service = new CombatActionService();

    const play = getLegalActionsOfType(service, game, "player:one", PlayUpgradeAction)
      .filter((p) => p.cardId === upgrade.id)[0];
    const fighterBefore = game.getFighter(play.fighterId)!;
    const gloryBefore = game.getPlayer("player:one")!.glory;

    engine.applyGameAction(game, play);

    expect(upgrade.zone).toBe(CardZone.Equipped);
    expect(upgrade.attachedToFighter).toBe(fighterBefore);

    const owner = game.getPlayer("player:one")!;
    expect(owner.equippedUpgrades.find((c) => c.id === upgrade.id)).toBeDefined();
    expect(owner.powerHand.find((c) => c.id === upgrade.id)).toBeUndefined();
    expect(owner.glory).toBe(gloryBefore - upgrade.gloryValue);
  });

  it("emits CardPlayedEvent + UpgradeEquippedEvent and records an Upgrade resolution", () => {
    const { game, engine } = createGameInPowerStep("player:one");
    const upgrade = seedPracticeUpgrade(game);
    const service = new CombatActionService();
    const play = getLegalActionsOfType(service, game, "player:one", PlayUpgradeAction)
      .filter((p) => p.cardId === upgrade.id)[0];

    engine.applyGameAction(game, play);

    expect(findLatestEvent(game, CardPlayedEvent)).not.toBeNull();
    expect(findLatestEvent(game, UpgradeEquippedEvent)).not.toBeNull();

    const records = game.getEventHistory(GameRecordKind.Upgrade);
    expect(records).toHaveLength(1);
    expect(records[0].actionKind).toBe(GameActionKind.PlayUpgrade);
  });

  it("rejects playing an upgrade the player doesn't hold", () => {
    const { game, engine } = createGameInPowerStep("player:one");

    expect(() =>
      engine.applyGameAction(
        game,
        new PlayUpgradeAction(
          "player:one",
          "not-a-real-card" as never,
          "not-a-real-fighter" as never,
        ),
      ),
    ).toThrow();
  });
});
