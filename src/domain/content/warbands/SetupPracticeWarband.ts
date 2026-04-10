import { Card, type CardFactory, type Target } from "../../cards/Card";
import { FighterDefinition } from "../../definitions/FighterDefinition";
import { WarbandDefinition } from "../../definitions/WarbandDefinition";
import { WeaponAbilityDefinition } from "../../definitions/WeaponAbilityDefinition";
import { WarscrollAbilityDefinition } from "../../definitions/WarscrollAbilityDefinition";
import { WarscrollDefinition } from "../../definitions/WarscrollDefinition";
import { WeaponDefinition } from "../../definitions/WeaponDefinition";
import { GameRecordKind } from "../../state/GameRecord";
import type { Game } from "../../state/Game";
import {
  CardZone,
  CardKind,
  FeatureTokenSide,
  SaveSymbol,
  TurnStep,
  WarscrollAbilityEffectKind,
  WeaponAbilityKind,
  WeaponAccuracy,
} from "../../values/enums";
import { objectiveCardFactory, upgradeCardFactory } from "../decks/genericPracticeCards";

const fighters = [
  new FighterDefinition(
    "fighter-def:setup-practice:1",
    "Practice Fighter 1",
    true,
    3,
    1,
    SaveSymbol.Shield,
    4,
    1,
    [
      new WeaponDefinition(
        "weapon-def:setup-practice:1",
        "Practice Blade",
        1,
        2,
        WeaponAccuracy.Hammer,
        1,
        [
          new WeaponAbilityDefinition(WeaponAbilityKind.Stagger),
          new WeaponAbilityDefinition(WeaponAbilityKind.Grievous, true),
          new WeaponAbilityDefinition(WeaponAbilityKind.Cleave),
          new WeaponAbilityDefinition(WeaponAbilityKind.Ensnare),
          new WeaponAbilityDefinition(WeaponAbilityKind.Brutal),
        ],
      ),
    ],
  ),
  new FighterDefinition(
    "fighter-def:setup-practice:2",
    "Practice Fighter 2",
    false,
    3,
    1,
    SaveSymbol.Shield,
    4,
    1,
    [new WeaponDefinition("weapon-def:setup-practice:2", "Practice Spear", 2, 2, WeaponAccuracy.Hammer, 1)],
  ),
  new FighterDefinition(
    "fighter-def:setup-practice:3",
    "Practice Fighter 3",
    false,
    4,
    1,
    SaveSymbol.Dodge,
    3,
    1,
    [new WeaponDefinition("weapon-def:setup-practice:3", "Practice Bow", 3, 2, WeaponAccuracy.Sword, 1)],
  ),
  new FighterDefinition(
    "fighter-def:setup-practice:4",
    "Practice Fighter 4",
    false,
    3,
    1,
    SaveSymbol.Shield,
    4,
    1,
    [new WeaponDefinition("weapon-def:setup-practice:4", "Practice Hammer", 1, 2, WeaponAccuracy.Hammer, 2)],
  ),
] as const;

const warscroll = new WarscrollDefinition(
  "warscroll-def:setup-practice",
  "Setup Practice Warscroll",
  [],
  [],
  { signal: 1 },
  [
    new WarscrollAbilityDefinition(
      "Signal Burst",
      "Spend 1 signal token: draw 1 power card.",
      TurnStep.Power,
      { signal: 1 },
      [
        {
          kind: WarscrollAbilityEffectKind.DrawPowerCards,
          count: 1,
        },
      ],
    ),
    new WarscrollAbilityDefinition(
      "Signal Cache",
      "Spend 1 signal token: gain 1 reserve token.",
      TurnStep.Power,
      { signal: 1 },
      [
        {
          kind: WarscrollAbilityEffectKind.GainWarscrollTokens,
          tokens: { reserve: 1 },
        },
      ],
    ),
  ],
);

// --- Objective card factories ---

function practiceObjective01Factory(): CardFactory {
  return (id, owner, zone) => {
    const card = new Card(id, owner, CardKind.Objective, "Practice Objective 01",
      "Score this immediately after you make an Attack roll if all of the results were successes.",
      1, zone);
    card.getLegalTargets = (game: Game): Target[] => {
      if (card.zone !== CardZone.ObjectiveHand) return [];
      const world = game.getEventLogState();
      const latestCombat = world.getLatestEvent(GameRecordKind.Combat);
      if (latestCombat === null || latestCombat.invokedByPlayerId !== card.owner.id) return [];
      if (latestCombat.data.attackRoll.length === 0) return [];
      if (latestCombat.data.attackSuccesses !== latestCombat.data.attackRoll.length) return [];
      return [card.owner];
    };
    return card;
  };
}

function practiceObjective02Factory(): CardFactory {
  return (id, owner, zone) => {
    const card = new Card(id, owner, CardKind.Objective, "Practice Objective 02",
      "Score this immediately after an enemy fighter is slain by a friendly fighter if the target was a leader or the target's Health was >= the attacker's.",
      1, zone);
    card.getLegalTargets = (game: Game): Target[] => {
      if (card.zone !== CardZone.ObjectiveHand) return [];
      const world = game.getEventLogState();
      const latestCombat = world.getLatestEvent(GameRecordKind.Combat);
      if (latestCombat === null || latestCombat.invokedByPlayerId !== card.owner.id || !latestCombat.data.targetSlain) return [];
      const attackerPlayer = game.getPlayer(latestCombat.data.context.attackerPlayerId);
      const defenderPlayer = game.getPlayer(latestCombat.data.context.defenderPlayerId);
      const attackerDef = attackerPlayer?.getFighterDefinition(latestCombat.data.context.attackerFighterId);
      const targetDef = defenderPlayer?.getFighterDefinition(latestCombat.data.context.targetFighterId);
      if (attackerDef === undefined || targetDef === undefined) return [];
      if (targetDef.isLeader || targetDef.health >= attackerDef.health) return [card.owner];
      return [];
    };
    return card;
  };
}

function practiceObjective03Factory(): CardFactory {
  return (id, owner, zone) => {
    const card = new Card(id, owner, CardKind.Objective, "Practice Objective 03",
      "Score this immediately after a friendly fighter Delves in enemy territory.",
      1, zone);
    card.getLegalTargets = (game: Game): Target[] => {
      if (card.zone !== CardZone.ObjectiveHand) return [];
      const world = game.getEventLogState();
      const latestDelve = world.getLatestEvent(GameRecordKind.Delve);
      if (latestDelve === null || latestDelve.invokedByPlayerId !== card.owner.id) return [];
      const delveHex = game.board.getHex(latestDelve.data.featureTokenHexId);
      if (delveHex?.territoryId == null) return [];
      const territory = game.board.getTerritory(delveHex.territoryId);
      if (territory?.ownerPlayerId == null) return [];
      if (territory.ownerPlayerId !== card.owner.id) return [card.owner];
      const opponent = game.getOpponent(card.owner.id);
      if (opponent !== undefined && card.owner.glory < opponent.glory) return [card.owner];
      return [];
    };
    return card;
  };
}

function practiceObjective04Factory(): CardFactory {
  return (id, owner, zone) => {
    const card = new Card(id, owner, CardKind.Objective, "Practice Objective 04",
      "Score this in an end phase if 3 or more different treasure tokens were Delved by your warband this battle round.",
      1, zone);
    card.getLegalTargets = (game: Game): Target[] => {
      if (card.zone !== CardZone.ObjectiveHand) return [];
      if (game.phase !== "end") return [];
      const world = game.getEventLogState();
      const thisRoundDelves = world.getEventHistory(GameRecordKind.Delve).filter((event) =>
        event.roundNumber === game.roundNumber && event.invokedByPlayerId === card.owner.id,
      );
      const thisRoundTreasureDelves = thisRoundDelves.filter((event) =>
        event.data.sideBeforeDelve === FeatureTokenSide.Treasure,
      );
      const delvedTokenIds = new Set(thisRoundTreasureDelves.map((event) => event.data.featureTokenId));
      if (delvedTokenIds.size >= 3) return [card.owner];
      return [];
    };
    return card;
  };
}

// --- Ploy card factories ---

function drawPowerCardsPloyFactory(cardNumber: string): CardFactory {
  return (id, owner, zone) => {
    const card = new Card(id, owner, CardKind.Ploy, `Practice Ploy ${cardNumber}`, "Draw 1 power card.", 0, zone);
    card.getLegalTargets = (game: Game): Target[] => {
      if (card.zone !== CardZone.PowerHand || game.turnStep !== "power") return [];
      if (card.owner.powerDeck.drawPile.length < 1) return [];
      return [card.owner];
    };
    return card;
  };
}

function gainWarscrollTokensPloyFactory(cardNumber: string): CardFactory {
  return (id, owner, zone) => {
    const card = new Card(id, owner, CardKind.Ploy, `Practice Ploy ${cardNumber}`, "Gain 1 signal token.", 0, zone);
    card.getLegalTargets = (game: Game): Target[] => {
      if (card.zone !== CardZone.PowerHand || game.turnStep !== "power") return [];
      return [card.owner];
    };
    return card;
  };
}

function giveGuardPloyFactory(cardNumber: string): CardFactory {
  return (id, owner, zone) => {
    const card = new Card(id, owner, CardKind.Ploy, `Practice Ploy ${cardNumber}`,
      "Give a friendly fighter a guard token.", 0, zone);
    card.getLegalTargets = (game: Game): Target[] => {
      if (card.zone !== CardZone.PowerHand || game.turnStep !== "power") return [];
      return card.owner.fighters.filter((f) => !f.isSlain && f.currentHexId !== null && !f.hasGuardToken);
    };
    return card;
  };
}

function giveStaggerPloyFactory(cardNumber: string): CardFactory {
  return (id, owner, zone) => {
    const card = new Card(id, owner, CardKind.Ploy, `Practice Ploy ${cardNumber}`,
      "Give an enemy fighter a stagger token.", 0, zone);
    card.getLegalTargets = (game: Game): Target[] => {
      if (card.zone !== CardZone.PowerHand || game.turnStep !== "power") return [];
      const opponent = game.getOpponent(card.owner.id);
      if (opponent === undefined) return [];
      return opponent.fighters.filter((f) => !f.isSlain && f.currentHexId !== null && !f.hasStaggerToken);
    };
    return card;
  };
}

// --- Card creation ---

function createObjectiveCards(): CardFactory[] {
  return Array.from({ length: 12 }, (_, index) => {
    switch (index) {
      case 0: return practiceObjective01Factory();
      case 1: return practiceObjective02Factory();
      case 2: return practiceObjective03Factory();
      case 3: return practiceObjective04Factory();
      default: {
        const cardNumber = String(index + 1).padStart(2, "0");
        return objectiveCardFactory(`Practice Objective ${cardNumber}`, "", 1);
      }
    }
  });
}

function createPowerCards(): CardFactory[] {
  const ploys: CardFactory[] = Array.from({ length: 10 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");
    if (index < 5) return drawPowerCardsPloyFactory(cardNumber);
    if (index < 8) return gainWarscrollTokensPloyFactory(cardNumber);
    if (index === 8) return giveGuardPloyFactory(cardNumber);
    return giveStaggerPloyFactory(cardNumber);
  });

  const upgrades: CardFactory[] = Array.from({ length: 10 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");
    return upgradeCardFactory(`Practice Upgrade ${cardNumber}`, "", 1);
  });

  return [...ploys, ...upgrades];
}

export const setupPracticeWarband = new WarbandDefinition(
  "warband-def:setup-practice",
  "Setup Practice Warband",
  fighters,
  warscroll,
  createObjectiveCards(),
  createPowerCards(),
);
