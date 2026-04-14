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
  const owner = playerId === "player:one" ? game.players[0] : game.players[1];
  owner.glory = glory;
  const upgrade = new PracticeUpgrade("upg-practice-test", owner, CardZone.PowerHand, "01");
  owner.powerHand.push(upgrade);
  return upgrade;
}

describe("PlayUpgradeAction eligibility", () => {
  it("is NOT legal in the action step", () => {
    const { game } = createGameInActionStep("player:one");
    const service = new CombatActionService();
    const owner = game.players[0];
    owner.glory = 5;
    const upgrade = new PracticeUpgrade("upg-test", owner, CardZone.PowerHand, "01");
    owner.powerHand.push(upgrade);

    const plays = getLegalActionsOfType(service, game, "player:one", PlayUpgradeAction);
    expect(plays.find((p) => p.card === upgrade)).toBeUndefined();
  });

  it("is legal in the power step with enough glory, targeting every friendly fighter", () => {
    const { game } = createGameInPowerStep("player:one");
    const upgrade = seedPracticeUpgrade(game);
    const service = new CombatActionService();

    const plays = getLegalActionsOfType(service, game, "player:one", PlayUpgradeAction)
      .filter((p) => p.card === upgrade);
    expect(plays.length).toBeGreaterThan(0);
    for (const play of plays) {
      const fighter = play.fighter;
      expect(fighter?.owner.id).toBe("player:one");
      expect(fighter?.isSlain).toBe(false);
    }
  });

  it("is NOT legal with insufficient glory", () => {
    const { game } = createGameInPowerStep("player:one");
    const owner = game.players[0];
    owner.glory = 0;
    const upgrade = new PracticeUpgrade("upg-test-broke", owner, CardZone.PowerHand, "01");
    owner.powerHand.push(upgrade);
    const service = new CombatActionService();

    const plays = getLegalActionsOfType(service, game, "player:one", PlayUpgradeAction)
      .filter((p) => p.card === upgrade);
    expect(plays).toEqual([]);
  });
});

describe("PlayUpgradeAction resolution", () => {
  it("attaches the upgrade to the chosen fighter and spends glory", () => {
    const { game, engine } = createGameInPowerStep("player:one");
    const upgrade = seedPracticeUpgrade(game, "player:one", 5);
    const service = new CombatActionService();

    const play = getLegalActionsOfType(service, game, "player:one", PlayUpgradeAction)
      .filter((p) => p.card === upgrade)[0];
    const fighterBefore = play.fighter;
    const gloryBefore = game.players[0].glory;

    engine.applyGameAction(game, play);

    expect(upgrade.zone).toBe(CardZone.Equipped);
    expect(upgrade.attachedToFighter).toBe(fighterBefore);

    const owner = game.players[0];
    expect(owner.equippedUpgrades.includes(upgrade)).toBe(true);
    expect(owner.powerHand.includes(upgrade)).toBe(false);
    expect(owner.glory).toBe(gloryBefore - upgrade.gloryValue);
  });

  it("emits CardPlayedEvent + UpgradeEquippedEvent and records an Upgrade resolution", () => {
    const { game, engine } = createGameInPowerStep("player:one");
    const upgrade = seedPracticeUpgrade(game);
    const service = new CombatActionService();
    const play = getLegalActionsOfType(service, game, "player:one", PlayUpgradeAction)
      .filter((p) => p.card === upgrade)[0];

    engine.applyGameAction(game, play);

    expect(findLatestEvent(game, CardPlayedEvent)).not.toBeNull();
    expect(findLatestEvent(game, UpgradeEquippedEvent)).not.toBeNull();

    const records = game.getEventHistory(GameRecordKind.Upgrade);
    expect(records).toHaveLength(1);
    expect(records[0].actionKind).toBe(GameActionKind.PlayUpgrade);
  });

  it("rejects playing an upgrade the player doesn't hold", () => {
    const { game, engine } = createGameInPowerStep("player:one");
    const owner = game.players[0];
    const fighter = owner.fighters[0]!;
    // Construct a fake card that the player doesn't hold.
    const fakeCard = {
      ...owner.powerDeck.drawPile[0],
      id: "not-a-real-card" as never,
    };

    expect(() =>
      engine.applyGameAction(
        game,
        new PlayUpgradeAction(
          owner,
          fakeCard as unknown as typeof owner.powerDeck.drawPile[0],
          fighter,
        ),
      ),
    ).toThrow();
  });
});
