import { describe, it, expect } from "vitest";
import {
  CombatActionService,
  GameActionKind,
  GameRecordKind,
  UseWarscrollAbilityAction,
} from "../index";
import { WarscrollAbilityUsedEvent } from "../events";
import {
  createGameInActionStep,
  createGameInPowerStep,
  findLatestEvent,
  getLegalActionsOfType,
} from "../../test-utils";

// ---------------------------------------------------------------------------
// UseWarscrollAbilityAction — power-step only; requires matching tokens
// and an effect the resolver considers applicable.  The Setup Practice
// warscroll has two power-step abilities that each cost 1 signal token.
// ---------------------------------------------------------------------------

describe("UseWarscrollAbilityAction eligibility", () => {
  it("is NOT legal in the action step", () => {
    const { game } = createGameInActionStep("player:one");
    game.getPlayer("player:one")!.warscrollState.tokens = { signal: 5 };
    const service = new CombatActionService();

    const uses = getLegalActionsOfType(
      service,
      game,
      "player:one",
      UseWarscrollAbilityAction,
    );
    expect(uses).toEqual([]);
  });

  it("is legal in the power step when the player has the required tokens", () => {
    const { game } = createGameInPowerStep("player:one");
    game.getPlayer("player:one")!.warscrollState.tokens = { signal: 5 };
    const service = new CombatActionService();

    const uses = getLegalActionsOfType(
      service,
      game,
      "player:one",
      UseWarscrollAbilityAction,
    );
    expect(uses.length).toBeGreaterThan(0);
    for (const use of uses) {
      expect(use.player.id).toBe("player:one");
      expect(use.abilityIndex).toBeGreaterThanOrEqual(0);
    }
  });

  it("is NOT legal when tokens are insufficient", () => {
    const { game } = createGameInPowerStep("player:one");
    game.getPlayer("player:one")!.warscrollState.tokens = { signal: 0 };
    const service = new CombatActionService();

    const uses = getLegalActionsOfType(
      service,
      game,
      "player:one",
      UseWarscrollAbilityAction,
    );
    expect(uses).toEqual([]);
  });

  it("is NOT legal for the inactive player", () => {
    const { game } = createGameInPowerStep("player:one");
    game.getPlayer("player:two")!.warscrollState.tokens = { signal: 5 };
    const service = new CombatActionService();

    const uses = getLegalActionsOfType(
      service,
      game,
      "player:two",
      UseWarscrollAbilityAction,
    );
    expect(uses).toEqual([]);
  });
});

describe("UseWarscrollAbilityAction resolution", () => {
  it("consumes the correct number of tokens and records a WarscrollAbility resolution", () => {
    const { game, engine } = createGameInPowerStep("player:one");
    const player = game.getPlayer("player:one")!;
    player.warscrollState.tokens = { signal: 3 };
    const service = new CombatActionService();

    // Find the "Signal Cache" ability (gain-tokens effect — doesn't need
    // a deck to draw from).
    const warscroll = player.getWarscrollDefinition()!;
    const cacheIndex = warscroll.abilities.findIndex((a) => a.name === "Signal Cache");
    expect(cacheIndex).toBeGreaterThanOrEqual(0);

    const uses = getLegalActionsOfType(
      service,
      game,
      "player:one",
      UseWarscrollAbilityAction,
    );
    const cacheUse = uses.find((u) => u.abilityIndex === cacheIndex);
    expect(cacheUse).toBeDefined();

    engine.applyGameAction(game, cacheUse!);

    // Signal cost paid: 3 → 2.  Reserve token gained: 0 → 1.
    expect(player.warscrollState.tokens["signal"]).toBe(2);
    expect(player.warscrollState.tokens["reserve"]).toBe(1);

    const records = game.getEventHistory(GameRecordKind.WarscrollAbility);
    expect(records).toHaveLength(1);
    expect(records[0].actionKind).toBe(GameActionKind.UseWarscrollAbility);
  });

  it("emits WarscrollAbilityUsedEvent", () => {
    const { game, engine } = createGameInPowerStep("player:one");
    const player = game.getPlayer("player:one")!;
    player.warscrollState.tokens = { signal: 3 };
    const service = new CombatActionService();

    const warscroll = player.getWarscrollDefinition()!;
    const cacheIndex = warscroll.abilities.findIndex((a) => a.name === "Signal Cache");
    const cacheUse = getLegalActionsOfType(
      service,
      game,
      "player:one",
      UseWarscrollAbilityAction,
    ).find((u) => u.abilityIndex === cacheIndex)!;

    engine.applyGameAction(game, cacheUse);

    const used = findLatestEvent(game, WarscrollAbilityUsedEvent);
    expect(used).not.toBeNull();
    expect(used!.abilityIndex).toBe(cacheIndex);
  });

  it("rejects a use from the wrong player", () => {
    const { game, engine } = createGameInPowerStep("player:one");
    game.getPlayer("player:one")!.warscrollState.tokens = { signal: 1 };

    expect(() =>
      engine.applyGameAction(game, new UseWarscrollAbilityAction(game.getPlayer("player:two")!, 0)),
    ).toThrow();
  });
});
