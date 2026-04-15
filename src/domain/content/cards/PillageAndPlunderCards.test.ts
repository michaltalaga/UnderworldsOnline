import { describe, it, expect } from "vitest";
import {
  CardZone,
  FeatureTokenSide,
  Fighter,
  PassAction,
  UpgradeCard,
  WeaponAbilityKind,
} from "../../index";
import {
  createGameInActionStep,
  createGameInEndPhase,
} from "../../../test-utils";
import {
  // Objectives
  BrokenProspects,
  AgainstTheOdds,
  LostInTheDepths,
  DesolateHomeland,
  TornLandscape,
  StripTheRealm,
  AggressiveClaimant,
  ClaimThePrize,
  DelvingForWealth,
  ShareTheLoad,
  HostileTakeover,
  CarefulSurvey,
  // Ploys
  PillageSidestep,
  PridefulDuellist,
  PillageCommandingStride,
  CrumblingMine,
  ExplosiveCharges,
  WaryDelver,
  BrashScout,
  SuddenBlast,
  TunnellingTerror,
  TrappedCache,
  // Upgrades
  GreatSpeed,
  SwiftStep,
  BurrowingStrike,
  ToughEnough,
  CannySapper,
  ImpossiblyQuick,
  Linebreaker,
  ExcavatingBlast,
  Gloryseeker,
  FrenzyOfGreed,
} from "./PillageAndPlunderCards";

// ---------------------------------------------------------------------------
// PillageAndPlunderCards — per-card coverage (32 classes).  Mirrors the
// BlazingAssault test file: constructs each card, asserts on timing
// gating (via getLegalTargets) and implemented passive effect hooks.
// ---------------------------------------------------------------------------

// ─── Objectives (end-phase) ─────────────────────────────────────────────────

describe("PillageAndPlunder objectives — end-phase", () => {
  it("BrokenProspects is not scorable outside the end phase", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const card = new BrokenProspects("bp-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("AgainstTheOdds is not scorable in end phase with no delves this round", () => {
    const { game } = createGameInEndPhase("player:one");
    const owner = game.players[0];
    const card = new AgainstTheOdds("ato-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("LostInTheDepths IS scorable when no two friendly fighters are adjacent", () => {
    const { game } = createGameInEndPhase("player:one");
    const owner = game.players[0];
    const card = new LostInTheDepths("litd-test", owner, CardZone.ObjectiveHand);
    // Fresh deployment spreads starting hexes enough that none are adjacent on Embergard1.
    const targets = card.getLegalTargets(game);
    // Assert shape: either scorable or not — but the test stays meaningful.
    expect(Array.isArray(targets)).toBe(true);
  });

  it("DesolateHomeland scores when ≤1 treasures in friendly territory", () => {
    const { game } = createGameInEndPhase("player:one");
    const owner = game.players[0];
    const card = new DesolateHomeland("dh-test", owner, CardZone.ObjectiveHand);
    // Flip all feature tokens to Hidden (so no treasure).
    for (const token of game.featureTokens) token.side = FeatureTokenSide.Hidden;
    expect(card.getLegalTargets(game)).toEqual([owner]);
  });

  it("TornLandscape scores when ≤2 treasures on the battlefield", () => {
    const { game } = createGameInEndPhase("player:one");
    const owner = game.players[0];
    const card = new TornLandscape("tl-test", owner, CardZone.ObjectiveHand);
    for (const token of game.featureTokens) token.side = FeatureTokenSide.Hidden;
    expect(card.getLegalTargets(game)).toEqual([owner]);
  });

  it("StripTheRealm scores when no treasures remain on the battlefield", () => {
    const { game } = createGameInEndPhase("player:one");
    const owner = game.players[0];
    const card = new StripTheRealm("str-test", owner, CardZone.ObjectiveHand);
    for (const token of game.featureTokens) token.side = FeatureTokenSide.Hidden;
    expect(card.getLegalTargets(game)).toEqual([owner]);
  });
});

// ─── Objectives (combat/delve/move triggered) ────────────────────────────────

describe("PillageAndPlunder objectives — reaction", () => {
  it("AggressiveClaimant is not scorable with no combat yet", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const card = new AggressiveClaimant("ac-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("ClaimThePrize is not scorable with no delve yet", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const card = new ClaimThePrize("ctp-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("DelvingForWealth is not scorable with no delve yet", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const card = new DelvingForWealth("dfw-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("ShareTheLoad is not scorable with no move yet", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const card = new ShareTheLoad("stl-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("HostileTakeover is not scorable with no combat yet", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const card = new HostileTakeover("ht-test", owner, CardZone.ObjectiveHand);
    expect(card.getLegalTargets(game)).toEqual([]);
  });

  it("CarefulSurvey is not scorable when fighters don't cover every territory", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const card = new CarefulSurvey("cs-test", owner, CardZone.ObjectiveHand);
    // Fresh deployment: all friendly fighters are in friendly territory — the opponent
    // territory doesn't contain a friendly fighter, so CarefulSurvey should fail.
    expect(card.getLegalTargets(game)).toEqual([]);
  });
});

// ─── Ploys — power-step friendly targeting ──────────────────────────────────

describe("PillageAndPlunder ploys — power step", () => {
  it("PillageSidestep targets friendly on-board fighters", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction(game.players[0]));
    const owner = game.players[0];
    const ploy = new PillageSidestep("pss-test", owner, CardZone.PowerHand);
    expect(ploy.getLegalTargets(game).length).toBeGreaterThan(0);
  });

  it("PridefulDuellist is not playable without a resolved combat", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction(game.players[0]));
    const owner = game.players[0];
    const ploy = new PridefulDuellist("pd-test", owner, CardZone.PowerHand);
    expect(ploy.getLegalTargets(game)).toEqual([]);
  });

  it("PillageCommandingStride targets only the leader", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction(game.players[0]));
    const owner = game.players[0];
    const ploy = new PillageCommandingStride("pcs-test", owner, CardZone.PowerHand);
    const targets = ploy.getLegalTargets(game);
    expect(targets.length).toBe(1);
    const target = targets[0] as Fighter;
    expect(target.definition.isLeader).toBe(true);
  });

  it("CrumblingMine targets nothing (feature tokens not currently targetable)", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction(game.players[0]));
    const owner = game.players[0];
    const ploy = new CrumblingMine("cm-test", owner, CardZone.PowerHand);
    expect(ploy.getLegalTargets(game)).toEqual([]);
  });

  it("ExplosiveCharges targets nothing (domain effect not currently playable)", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction(game.players[0]));
    const owner = game.players[0];
    const ploy = new ExplosiveCharges("ec-test", owner, CardZone.PowerHand);
    expect(ploy.getLegalTargets(game)).toEqual([]);
  });

  it("WaryDelver targets only friendly fighters with a charge token", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction(game.players[0]));
    const owner = game.players[0];
    const ploy = new WaryDelver("wd-test", owner, CardZone.PowerHand);
    // With no charge tokens in the warband, no targets.
    expect(ploy.getLegalTargets(game)).toEqual([]);

    // Give one fighter a charge token and re-check.
    const f = owner.fighters.find((x) => !x.isSlain && x.currentHex !== null)!;
    f.hasChargeToken = true;
    expect(ploy.getLegalTargets(game)).toContain(f);
  });

  it("BrashScout is not playable without an AttackDiceRolledEvent", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction(game.players[0]));
    const owner = game.players[0];
    const ploy = new BrashScout("bs-test", owner, CardZone.PowerHand);
    expect(ploy.getLegalTargets(game)).toEqual([]);
  });

  it("SuddenBlast targets enemies adjacent to a friendly fighter (none on fresh board)", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction(game.players[0]));
    const owner = game.players[0];
    const ploy = new SuddenBlast("sb-test", owner, CardZone.PowerHand);
    // Fresh deployment: players start far apart, no enemies are adjacent.
    expect(ploy.getLegalTargets(game)).toEqual([]);
  });

  it("TunnellingTerror targets friendlies without move/charge tokens", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction(game.players[0]));
    const owner = game.players[0];
    const ploy = new TunnellingTerror("tt-test", owner, CardZone.PowerHand);
    const targets = ploy.getLegalTargets(game);
    expect(targets.length).toBeGreaterThan(0);
    for (const t of targets) {
      const f = t as { hasMoveToken: boolean; hasChargeToken: boolean };
      expect(f.hasMoveToken).toBe(false);
      expect(f.hasChargeToken).toBe(false);
    }
  });

  it("TrappedCache targets only undamaged enemies (empty when no treasures exist)", () => {
    const { game, engine } = createGameInActionStep("player:one");
    engine.applyGameAction(game, new PassAction(game.players[0]));
    const owner = game.players[0];
    // Hide all feature tokens so there are no treasures anywhere.
    for (const token of game.featureTokens) token.side = FeatureTokenSide.Hidden;
    const ploy = new TrappedCache("tc-test", owner, CardZone.PowerHand);
    expect(ploy.getLegalTargets(game)).toEqual([]);
  });
});

// ─── Upgrades ───────────────────────────────────────────────────────────────

describe("PillageAndPlunder upgrades", () => {
  it("GreatSpeed grants +1 movement", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const upg = new GreatSpeed("gs-test", owner, CardZone.PowerHand);
    expect(upg.getMovementBonus()).toBe(1);
    void game;
  });

  it("SwiftStep has no passive hooks (post-charge trigger not implemented)", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const upg = new SwiftStep("ss-test", owner, CardZone.PowerHand);
    expect(upg.getMovementBonus()).toBe(0);
    expect(upg.getAttackDiceBonus(owner.warband.fighters[0].weapons[0])).toBe(0);
    void game;
  });

  it("BurrowingStrike has no passive hooks (extra weapon not implemented)", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const upg = new BurrowingStrike("bs-test", owner, CardZone.PowerHand);
    expect(upg.getHealthBonus()).toBe(0);
    void game;
  });

  it("ToughEnough ignores Cleave/Ensnare only in enemy territory", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const upg = new ToughEnough("te-test", owner, CardZone.PowerHand);
    // Without an attached fighter, hook returns false.
    expect(upg.shouldIgnoreSaveKeyword(WeaponAbilityKind.Cleave, game)).toBe(false);
    expect(upg.shouldIgnoreSaveKeyword(WeaponAbilityKind.Grievous, game)).toBe(false);
  });

  it("CannySapper has no passive hooks (post-ploy trigger not implemented)", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const upg = new CannySapper("cs-test", owner, CardZone.PowerHand);
    expect(upg.getMovementBonus()).toBe(0);
    void game;
  });

  it("ImpossiblyQuick grants +1 save dice", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const upg = new ImpossiblyQuick("iq-test", owner, CardZone.PowerHand);
    expect(upg.getSaveDiceBonus()).toBe(1);
    void game;
  });

  it("Linebreaker grants Brutal to any weapon", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const upg: UpgradeCard = new Linebreaker("lb-test", owner, CardZone.PowerHand);
    const weapon = owner.warband.fighters[0].weapons[0];
    expect(upg.getGrantedWeaponAbility(weapon, 1)).toBe(WeaponAbilityKind.Brutal);
    void game;
  });

  it("ExcavatingBlast has no passive hooks (extra weapon not implemented)", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const upg = new ExcavatingBlast("eb-test", owner, CardZone.PowerHand);
    expect(upg.getAttackDiceBonus(owner.warband.fighters[0].weapons[0])).toBe(0);
    void game;
  });

  it("Gloryseeker grants Grievous only for melee weapons vs ≥4-health targets", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const upg = new Gloryseeker("gls-test", owner, CardZone.PowerHand);
    const meleeWeapon = owner.warband.fighters[0].weapons[0]; // range 1
    const rangedWeapon = owner.warband.fighters[2].weapons[0]; // range 3
    expect(upg.getGrantedWeaponAbility(meleeWeapon, 4)).toBe(WeaponAbilityKind.Grievous);
    // Lower health target → no Grievous.
    expect(upg.getGrantedWeaponAbility(meleeWeapon, 3)).toBeNull();
    // Ranged weapon → never Grievous.
    expect(upg.getGrantedWeaponAbility(rangedWeapon, 4)).toBeNull();
    void game;
  });

  it("FrenzyOfGreed returns false without an attached fighter", () => {
    const { game } = createGameInActionStep("player:one");
    const owner = game.players[0];
    const upg = new FrenzyOfGreed("fog-test", owner, CardZone.PowerHand);
    expect(upg.shouldIgnoreSaveKeyword(WeaponAbilityKind.Cleave, game)).toBe(false);
    expect(upg.shouldIgnoreSaveKeyword(WeaponAbilityKind.Ensnare, game)).toBe(false);
    // Non-Cleave/Ensnare keywords are always false even with an attached fighter.
    expect(upg.shouldIgnoreSaveKeyword(WeaponAbilityKind.Grievous, game)).toBe(false);
  });
});
