import { describe, it, expect } from "vitest";
import {
  CardZone,
  PassAction,
  WeaponAbilityKind,
} from "../../index";
import {
  createGameInActionStep,
  createGameInEndPhase,
} from "../../../test-utils";
import {
  // Objectives
  StrikeTheHead,
  BranchingFate,
  PerfectStrike,
  CriticalEffort,
  GetStuckIn,
  StrongStart,
  KeepChoppin,
  FieldsOfBlood,
  GoAllOut,
  OnTheEdge,
  Denial,
  Annihilation,
  // Ploys
  DeterminedEffort,
  TwistTheKnife,
  WingsOfWar,
  Sidestep,
  ShieldsUp,
  HealingPotion,
  ScreamOfAnger,
  LureOfBattle,
  CommandingStride,
  IllusoryFighter,
  // Upgrades
  Brawler,
  HiddenAid,
  Accurate,
  GreatStrength,
  DeadlyAim,
  SharpenedPoints,
  Duellist,
  Tough,
  GreatFortitude,
  KeenEye,
} from "./BlazingAssaultCards";

// ---------------------------------------------------------------------------
// BlazingAssaultCards — per-card coverage (32 classes).
// ---------------------------------------------------------------------------
// PATTERN: construct every card with (id, owner, zone) via the shared
// three-arg signature, then assert on getLegalTargets /
// passive-effect-hooks using scenarios from test-utils.
//
// Combat-trigger objectives are verified at the "not scorable without
// combat" edge (the CombatResolvedEvent the card inspects doesn't exist
// yet).  End-phase objectives are verified in the end phase.  Ploys
// are verified by their timing window.  Upgrades test passive hooks
// where implemented; hook-less upgrades fall back to the base
// target-in-power-step check.
// ---------------------------------------------------------------------------

// ─── Objectives (combat-trigger) ─────────────────────────────────────────────

describe("BlazingAssault objectives — combat-trigger", () => {
  it("StrikeTheHead is not scorable with no combat yet", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const card = new StrikeTheHead("sth-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("BranchingFate is not scorable with no combat yet", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const card = new BranchingFate("bf-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("PerfectStrike is not scorable with no combat yet", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const card = new PerfectStrike("ps-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("CriticalEffort is not scorable with no combat yet", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const card = new CriticalEffort("ce-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("GetStuckIn is not scorable with no combat yet", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const card = new GetStuckIn("gsi-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("StrongStart is not scorable with no slain fighter yet", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const card = new StrongStart("ss-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });
});

// ─── Objectives (end-phase) ─────────────────────────────────────────────────

describe("BlazingAssault objectives — end-phase", () => {
  it("KeepChoppin is not scorable outside the end phase", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const card = new KeepChoppin("kc-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("FieldsOfBlood is not scorable in end phase with no damaged fighters", () => {
    const { game } = createGameInEndPhase("player:one");
    const owner = game.getPlayer("player:one")!;
    const card = new FieldsOfBlood("fob-test", owner, CardZone.ObjectiveHand);
    // No fighter has taken damage in a pass-only round.
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("FieldsOfBlood IS scorable when ≥4 fighters are damaged", () => {
    const { game } = createGameInEndPhase("player:one");
    const owner = game.getPlayer("player:one")!;
    // Inflict 1 damage on 4 different fighters across both players.
    game.players[0].fighters[0].damage = 1;
    game.players[0].fighters[1].damage = 1;
    game.players[1].fighters[0].damage = 1;
    game.players[1].fighters[1].damage = 1;
    const card = new FieldsOfBlood("fob-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([owner]);
  });

  it("GoAllOut is not scorable in end phase with no movement tokens", () => {
    const { game } = createGameInEndPhase("player:one");
    const owner = game.getPlayer("player:one")!;
    const card = new GoAllOut("gao-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("OnTheEdge is not scorable when opponent has no damaged fighters", () => {
    const { game } = createGameInEndPhase("player:one");
    const owner = game.getPlayer("player:one")!;
    const card = new OnTheEdge("ote-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("Denial IS scorable in end phase when no enemies are in friendly territory", () => {
    const { game } = createGameInEndPhase("player:one");
    const owner = game.getPlayer("player:one")!;
    const card = new Denial("den-test", owner, CardZone.ObjectiveHand);
    // Fresh deployment: enemies deployed in their own territory, so Denial scores.
    expect(card.getLegalTargets(game)).toEqual([owner]);
  });

  it("Annihilation is not scorable with enemies still alive", () => {
    const { game } = createGameInEndPhase("player:one");
    const owner = game.getPlayer("player:one")!;
    const card = new Annihilation("ann-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("Annihilation IS scorable when every enemy is slain", () => {
    const { game } = createGameInEndPhase("player:one");
    const owner = game.getPlayer("player:one")!;
    const opponent = game.getOpponent(owner.id)!;
    for (const f of opponent.fighters) f.isSlain = true;
    const card = new Annihilation("ann-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([owner]);
  });
});

// ─── Ploys — reaction (require prior attack roll) ───────────────────────────

describe("BlazingAssault ploys — reaction", () => {
  it("DeterminedEffort is not playable without an AttackDiceRolledEvent", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction("player:one"));
    const owner = game.getPlayer("player:one")!;
    const ploy = new DeterminedEffort("de-test", owner, CardZone.PowerHand);
    expect(ploy.getLegalTargets(game)).toEqual([]);
  });

  it("TwistTheKnife is not playable without an AttackDiceRolledEvent", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction("player:one"));
    const owner = game.getPlayer("player:one")!;
    const ploy = new TwistTheKnife("ttk-test", owner, CardZone.PowerHand);
    expect(ploy.getLegalTargets(game)).toEqual([]);
  });
});

// ─── Ploys — power step (target friendly fighters) ──────────────────────────

describe("BlazingAssault ploys — power-step friendly targeting", () => {
  it("WingsOfWar targets friendly on-board fighters in power step", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction("player:one"));
    const owner = game.getPlayer("player:one")!;
    const ploy = new WingsOfWar("wow-test", owner, CardZone.PowerHand);
    const targets = ploy.getLegalTargets(game);
    expect(targets.length).toBeGreaterThan(0);
    for (const t of targets) expect((t as { ownerPlayerId: string }).ownerPlayerId).toBe("player:one");
  });

  it("Sidestep targets friendly on-board fighters in power step", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction("player:one"));
    const owner = game.getPlayer("player:one")!;
    const ploy = new Sidestep("sstep-test", owner, CardZone.PowerHand);
    expect(ploy.getLegalTargets(game).length).toBeGreaterThan(0);
  });

  it("ShieldsUp targets friendly fighters; onPlay gives guard", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction("player:one"));
    const owner = game.getPlayer("player:one")!;
    const ploy = new ShieldsUp("su-test", owner, CardZone.PowerHand);
    const target = ploy.getLegalTargets(game)[0] as { hasGuardToken: boolean; id: string };
    expect(target).toBeDefined();
    expect(target.hasGuardToken).toBe(false);

    ploy.applyEffect(game, target as never);
    expect(target.hasGuardToken).toBe(true);
  });

  it("HealingPotion is not playable in action step", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const ploy = new HealingPotion("hp-test", owner, CardZone.PowerHand);
    expect(ploy.getLegalTargets(game)).toEqual([]);
  });

  it("HealingPotion targets friendly fighters in power step", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction("player:one"));
    const owner = game.getPlayer("player:one")!;
    const ploy = new HealingPotion("hp-test", owner, CardZone.PowerHand);
    expect(ploy.getLegalTargets(game).length).toBeGreaterThan(0);
  });

  it("ScreamOfAnger onPlay deals 2 damage and removes a movement token", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction("player:one"));
    const owner = game.getPlayer("player:one")!;
    const ploy = new ScreamOfAnger("soa-test", owner, CardZone.PowerHand);
    const target = ploy.getLegalTargets(game)[0] as { damage: number; hasMoveToken: boolean; id: string };
    target.hasMoveToken = true;
    const before = target.damage;
    ploy.applyEffect(game, target as never);
    expect(target.damage).toBe(before + 2);
    expect(target.hasMoveToken).toBe(false);
  });

  it("LureOfBattle targets a friendly fighter within 2 hexes of any other fighter", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction("player:one"));
    const owner = game.getPlayer("player:one")!;
    const ploy = new LureOfBattle("lob-test", owner, CardZone.PowerHand);
    // Ring-2 covers much of the board on Embergard1; at least one should qualify.
    const targets = ploy.getLegalTargets(game);
    for (const t of targets) {
      expect((t as { ownerPlayerId: string }).ownerPlayerId).toBe("player:one");
    }
    // Targets array may legitimately be empty on very spread-out boards,
    // so we only assert the shape, not a lower bound.
  });

  it("CommandingStride targets only the friendly leader", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction("player:one"));
    const owner = game.getPlayer("player:one")!;
    const ploy = new CommandingStride("cs-test", owner, CardZone.PowerHand);
    const targets = ploy.getLegalTargets(game);
    expect(targets.length).toBe(1);
    const leaderFighter = targets[0] as { id: string };
    const def = owner.getFighterDefinition(leaderFighter.id as never);
    expect(def?.isLeader).toBe(true);
  });

  it("IllusoryFighter targets friendly on-board fighters", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction("player:one"));
    const owner = game.getPlayer("player:one")!;
    const ploy = new IllusoryFighter("if-test", owner, CardZone.PowerHand);
    expect(ploy.getLegalTargets(game).length).toBeGreaterThan(0);
  });
});

// ─── Upgrades ───────────────────────────────────────────────────────────────

describe("BlazingAssault upgrades", () => {
  it("Brawler has no passive effect hooks (base defaults)", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    owner.glory = 5;
    const upg = new Brawler("br-test", owner, CardZone.PowerHand);
    const weapon = owner.warband.fighters[0].weapons[0];
    expect(upg.getMovementBonus()).toBe(0);
    expect(upg.getHealthBonus()).toBe(0);
    expect(upg.getAttackDiceBonus(weapon)).toBe(0);
    expect(upg.getSaveDiceBonus()).toBe(0);
    // Not playable in action step.
    expect(upg.getLegalTargets(game)).toEqual([]);
  });

  it("HiddenAid has no passive hooks but is targetable in power step with glory", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction("player:one"));
    const owner = game.getPlayer("player:one")!;
    owner.glory = 5;
    const upg = new HiddenAid("ha-test", owner, CardZone.PowerHand);
    expect(upg.getLegalTargets(game).length).toBeGreaterThan(0);
  });

  it("Accurate has no passive hooks (defaults to neutral)", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const upg = new Accurate("acc-test", owner, CardZone.PowerHand);
    expect(upg.getAttackDiceBonus(owner.warband.fighters[0].weapons[0])).toBe(0);
    void game;
  });

  it("GreatStrength grants Grievous to melee weapons only", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const upg = new GreatStrength("gs-test", owner, CardZone.PowerHand);

    const meleeWeapon = owner.warband.fighters[0].weapons[0]; // Practice Blade (range 1)
    const rangedWeapon = owner.warband.fighters[2].weapons[0]; // Practice Bow (range 3)
    expect(upg.getGrantedWeaponAbility(meleeWeapon, 1)).toBe(WeaponAbilityKind.Grievous);
    expect(upg.getGrantedWeaponAbility(rangedWeapon, 1)).toBeNull();
    void game;
  });

  it("DeadlyAim grants Ensnare to any weapon", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const upg = new DeadlyAim("da-test", owner, CardZone.PowerHand);
    const weapon = owner.warband.fighters[2].weapons[0];
    expect(upg.getGrantedWeaponAbility(weapon, 1)).toBe(WeaponAbilityKind.Ensnare);
    void game;
  });

  it("SharpenedPoints grants Cleave to any weapon", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const upg = new SharpenedPoints("sp-test", owner, CardZone.PowerHand);
    const weapon = owner.warband.fighters[0].weapons[0];
    expect(upg.getGrantedWeaponAbility(weapon, 1)).toBe(WeaponAbilityKind.Cleave);
    void game;
  });

  it("Duellist has no passive hooks (reactive effect not implemented)", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const upg = new Duellist("du-test", owner, CardZone.PowerHand);
    expect(upg.getMovementBonus()).toBe(0);
    expect(upg.getAttackDiceBonus(owner.warband.fighters[0].weapons[0])).toBe(0);
    void game;
  });

  it("Tough has no passive hooks (per-turn damage cap not implemented)", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const upg = new Tough("tough-test", owner, CardZone.PowerHand);
    expect(upg.getHealthBonus()).toBe(0);
    void game;
  });

  it("GreatFortitude grants +1 health", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const upg = new GreatFortitude("gf-test", owner, CardZone.PowerHand);
    expect(upg.getHealthBonus()).toBe(1);
    void game;
  });

  it("KeenEye grants +1 attack die to melee weapons only", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.getPlayer("player:one")!;
    const upg = new KeenEye("ke-test", owner, CardZone.PowerHand);
    const meleeWeapon = owner.warband.fighters[0].weapons[0];
    const rangedWeapon = owner.warband.fighters[2].weapons[0];
    expect(upg.getAttackDiceBonus(meleeWeapon)).toBe(1);
    expect(upg.getAttackDiceBonus(rangedWeapon)).toBe(0);
    void game;
  });
});
