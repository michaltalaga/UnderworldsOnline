import { CardDefinition, type CardPlayContext } from "../../definitions/CardDefinition";
import { FighterDefinition } from "../../definitions/FighterDefinition";
import { WarbandDefinition } from "../../definitions/WarbandDefinition";
import { WeaponAbilityDefinition } from "../../definitions/WeaponAbilityDefinition";
import { WarscrollAbilityDefinition } from "../../definitions/WarscrollAbilityDefinition";
import { WarscrollDefinition } from "../../definitions/WarscrollDefinition";
import { WeaponDefinition } from "../../definitions/WeaponDefinition";
import type { PloyEffect } from "../../definitions/PloyEffect";
import { GameRecordKind } from "../../state/GameRecord";
import type { CardInstance } from "../../state/CardInstance";
import type { GameEventLogState } from "../../state/GameEventLogState";
import type { FighterState } from "../../state/FighterState";
import type { Game } from "../../state/Game";
import type { PlayerState } from "../../state/PlayerState";
import {
  CardZone,
  CardKind,
  FeatureTokenSide,
  FighterTokenKind,
  ObjectiveConditionTiming,
  PloyEffectKind,
  PloyEffectTargetKind,
  SaveSymbol,
  TurnStep,
  WarscrollAbilityEffectKind,
  WeaponAbilityKind,
  WeaponAccuracy,
} from "../../values/enums";

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

abstract class PracticeObjectiveCardDefinition extends CardDefinition {
  protected constructor(cardNumber: string, text: string) {
    super(
      `card-def:setup-practice:objective:${cardNumber}`,
      CardKind.Objective,
      `Practice Objective ${cardNumber}`,
      text,
      1,
    );
  }

  public override play(
    game: Game,
    world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
  ): string[] {
    void game;
    void world;
    return scoreObjectiveCard(this, player, card);
  }
}

class PracticeBlankObjectiveCardDefinition extends PracticeObjectiveCardDefinition {
  public constructor(cardNumber: string) {
    super(cardNumber, "");
  }
}

class PracticeObjective01CardDefinition extends PracticeObjectiveCardDefinition {
  public constructor() {
    super(
      "01",
      "Score this immediately after you make an Attack roll if all of the results were successes.",
    );
  }

  public override canPlay(
    game: Game,
    world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): boolean {
    void game;
    void card;
    if (context.timing !== ObjectiveConditionTiming.Immediate) {
      return false;
    }

    const latestCombat = world.getLatestBatchEvent(GameRecordKind.Combat);
    if (latestCombat === null || latestCombat.invokedByPlayerId !== player.id) {
      return false;
    }

    return (
      latestCombat.data.attackRoll.length > 0 &&
      latestCombat.data.attackSuccesses === latestCombat.data.attackRoll.length
    );
  }
}

class PracticeObjective02CardDefinition extends PracticeObjectiveCardDefinition {
  public constructor() {
    super(
      "02",
      "Score this immediately after an enemy fighter is slain by a friendly fighter if the target was a leader or the target's Health characteristic was equal to or greater than the attacker's.",
    );
  }

  public override canPlay(
    game: Game,
    world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): boolean {
    void card;
    if (context.timing !== ObjectiveConditionTiming.Immediate) {
      return false;
    }

    const latestCombat = world.getLatestBatchEvent(GameRecordKind.Combat);
    if (
      latestCombat === null ||
      latestCombat.invokedByPlayerId !== player.id ||
      !latestCombat.data.targetSlain
    ) {
      return false;
    }

    const attackerPlayer = game.getPlayer(latestCombat.data.context.attackerPlayerId);
    const defenderPlayer = game.getPlayer(latestCombat.data.context.defenderPlayerId);
    const attackerDefinition = attackerPlayer?.getFighterDefinition(latestCombat.data.context.attackerFighterId);
    const targetDefinition = defenderPlayer?.getFighterDefinition(latestCombat.data.context.targetFighterId);
    if (attackerDefinition === undefined || targetDefinition === undefined) {
      return false;
    }

    return targetDefinition.isLeader || targetDefinition.health >= attackerDefinition.health;
  }
}

class PracticeObjective03CardDefinition extends PracticeObjectiveCardDefinition {
  public constructor() {
    super(
      "03",
      "Score this immediately after a friendly fighter Delves in enemy territory. If you are the underdog, that Delve can be in friendly territory instead.",
    );
  }

  public override canPlay(
    game: Game,
    world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): boolean {
    void card;
    if (context.timing !== ObjectiveConditionTiming.Immediate) {
      return false;
    }

    const latestDelve = world.getLatestBatchEvent(GameRecordKind.Delve);
    if (latestDelve === null || latestDelve.invokedByPlayerId !== player.id) {
      return false;
    }

    const delveHex = game.board.getHex(latestDelve.data.featureTokenHexId);
    if (delveHex?.territoryId === null || delveHex?.territoryId === undefined) {
      return false;
    }

    const territory = game.board.getTerritory(delveHex.territoryId);
    if (territory?.ownerPlayerId === null || territory?.ownerPlayerId === undefined) {
      return false;
    }

    if (territory.ownerPlayerId !== player.id) {
      return true;
    }

    const opponent = game.getOpponent(player.id);
    return opponent !== undefined && player.glory < opponent.glory;
  }
}

class PracticeObjective04CardDefinition extends PracticeObjectiveCardDefinition {
  public constructor() {
    super(
      "04",
      "Score this in an end phase if 3 or more different treasure tokens were Delved by your warband this battle round or if a treasure token held by an enemy fighter at the start of the battle round was Delved by your warband this battle round.",
    );
  }

  public override canPlay(
    game: Game,
    world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): boolean {
    void card;
    if (context.timing !== ObjectiveConditionTiming.EndPhase) {
      return false;
    }

    const thisRoundPlayerDelves = world.getEventHistory(GameRecordKind.Delve).filter((event) =>
      event.roundNumber === game.roundNumber && event.invokedByPlayerId === player.id,
    );
    const thisRoundTreasureDelves = thisRoundPlayerDelves.filter((event) =>
      event.data.sideBeforeDelve === FeatureTokenSide.Treasure,
    );
    const delvedTreasureTokenIds = new Set(
      thisRoundTreasureDelves.map((event) => event.data.featureTokenId),
    );
    if (delvedTreasureTokenIds.size >= 3) {
      return true;
    }

    const delvedTokenIds = new Set(thisRoundPlayerDelves.map((event) => event.data.featureTokenId));
    const roundStartHistory = world.getEventHistory(GameRecordKind.RoundStart);
    for (let index = roundStartHistory.length - 1; index >= 0; index -= 1) {
      const roundStart = roundStartHistory[index];
      if (roundStart.roundNumber !== game.roundNumber) {
        continue;
      }

      return roundStart.data.featureTokens.some((featureToken) =>
        featureToken.side === FeatureTokenSide.Treasure &&
        featureToken.heldByFighterId !== null &&
        featureToken.holderOwnerPlayerId !== null &&
        featureToken.holderOwnerPlayerId !== player.id &&
        delvedTokenIds.has(featureToken.featureTokenId),
      );
    }

    return false;
  }
}

class PracticePloyCardDefinition extends CardDefinition {
  public constructor(cardNumber: string, text: string, ployEffects: readonly PloyEffect[]) {
    super(
      `card-def:setup-practice:ploy:${cardNumber}`,
      CardKind.Ploy,
      `Practice Ploy ${cardNumber}`,
      text,
      0,
      ployEffects,
    );
  }

  public override canPlay(
    game: Game,
    world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): boolean {
    void world;
    const targetFighterId = context.targetFighterId ?? null;
    const requiresTarget = this.ployEffects.some((effect) => effect.kind === PloyEffectKind.GainFighterToken);

    return (
      card.zone === CardZone.PowerHand &&
      this.ployEffects.length > 0 &&
      (requiresTarget ? targetFighterId !== null : targetFighterId === null) &&
      this.ployEffects.every((effect) => canResolvePloyEffect(game, player, effect, targetFighterId))
    );
  }

  public override play(
    game: Game,
    world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): string[] {
    const targetFighterId = context.targetFighterId ?? null;
    if (!this.canPlay(game, world, player, card, { targetFighterId })) {
      throw new Error(`Ploy ${this.name} cannot currently resolve.`);
    }

    const effectDescriptions = this.ployEffects.map((effect) =>
      resolvePloyEffect(game, player, effect, targetFighterId),
    );
    const handIndex = player.powerHand.findIndex((candidate) => candidate.id === card.id);
    if (handIndex === -1) {
      throw new Error(`Could not find ploy ${card.id} in ${player.name}'s power hand.`);
    }

    player.powerHand.splice(handIndex, 1);
    card.zone = CardZone.PowerDiscard;
    card.attachedToFighterId = null;
    card.revealed = true;
    player.powerDeck.discardPile.push(card);
    return effectDescriptions;
  }
}

class PracticeUpgradeCardDefinition extends CardDefinition {
  public constructor(cardNumber: string) {
    super(
      `card-def:setup-practice:upgrade:${cardNumber}`,
      CardKind.Upgrade,
      `Practice Upgrade ${cardNumber}`,
      "",
      1,
    );
  }

  public override canPlay(
    game: Game,
    world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): boolean {
    void game;
    void world;
    const equippedFighterId = context.equippedFighterId ?? null;
    if (
      card.zone !== CardZone.PowerHand ||
      equippedFighterId === null ||
      player.glory < this.gloryValue
    ) {
      return false;
    }

    const fighter = player.getFighter(equippedFighterId);
    return fighter !== undefined && !fighter.isSlain && fighter.currentHexId !== null;
  }

  public override play(
    game: Game,
    world: GameEventLogState,
    player: PlayerState,
    card: CardInstance,
    context: CardPlayContext = {},
  ): string[] {
    void game;
    const equippedFighterId = context.equippedFighterId ?? null;
    if (!this.canPlay(game, world, player, card, { equippedFighterId })) {
      throw new Error(`Upgrade ${this.name} cannot currently resolve.`);
    }

    if (equippedFighterId === null) {
      throw new Error(`Could not find fighter for upgrade ${this.name}.`);
    }

    const fighter = player.getFighter(equippedFighterId);
    if (fighter === undefined) {
      throw new Error(`Could not find fighter ${equippedFighterId} for upgrade ${this.name}.`);
    }

    const handIndex = player.powerHand.findIndex((candidate) => candidate.id === card.id);
    if (handIndex === -1) {
      throw new Error(`Could not find upgrade ${card.id} in ${player.name}'s power hand.`);
    }

    player.powerHand.splice(handIndex, 1);
    card.zone = CardZone.Equipped;
    card.attachedToFighterId = fighter.id;
    card.revealed = true;
    player.equippedUpgrades.push(card);
    fighter.upgradeCardIds.push(card.id);
    player.glory -= this.gloryValue;
    return [];
  }
}

export const setupPracticeWarband = new WarbandDefinition(
  "warband-def:setup-practice",
  "Setup Practice Warband",
  fighters,
  warscroll,
  createObjectiveCards(),
  createPowerCards(),
);

function createObjectiveCards(): CardDefinition[] {
  return Array.from({ length: 12 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");
    switch (index) {
      case 0:
        return new PracticeObjective01CardDefinition();
      case 1:
        return new PracticeObjective02CardDefinition();
      case 2:
        return new PracticeObjective03CardDefinition();
      case 3:
        return new PracticeObjective04CardDefinition();
      default:
        return new PracticeBlankObjectiveCardDefinition(cardNumber);
    }
  });
}

function createPowerCards(): CardDefinition[] {
  const ploys = Array.from({ length: 10 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");
    const isDrawPloy = index < 5;
    const isSignalPloy = index >= 5 && index < 8;
    const isGuardPloy = index === 8;

    return new PracticePloyCardDefinition(
      cardNumber,
      isDrawPloy
        ? "Draw 1 power card."
        : isSignalPloy
          ? "Gain 1 signal token."
          : isGuardPloy
            ? "Give a friendly fighter a guard token."
            : "Give an enemy fighter a stagger token.",
      isDrawPloy
        ? [
            {
              kind: PloyEffectKind.DrawPowerCards,
              count: 1,
            },
          ]
        : isSignalPloy
          ? [
              {
                kind: PloyEffectKind.GainWarscrollTokens,
                tokens: { signal: 1 },
              },
            ]
          : isGuardPloy
            ? [
                {
                  kind: PloyEffectKind.GainFighterToken,
                  target: PloyEffectTargetKind.FriendlyFighter,
                  token: FighterTokenKind.Guard,
                },
              ]
            : [
                {
                  kind: PloyEffectKind.GainFighterToken,
                  target: PloyEffectTargetKind.EnemyFighter,
                  token: FighterTokenKind.Stagger,
                },
              ],
    );
  });

  const upgrades = Array.from({ length: 10 }, (_, index) => {
    const cardNumber = String(index + 1).padStart(2, "0");

    return new PracticeUpgradeCardDefinition(cardNumber);
  });

  return [...ploys, ...upgrades];
}

function scoreObjectiveCard(
  definition: CardDefinition,
  player: PlayerState,
  card: CardInstance,
): string[] {
  const handIndex = player.objectiveHand.findIndex((candidate) => candidate.id === card.id);
  if (handIndex === -1) {
    throw new Error(`Could not find objective ${card.id} in ${player.name}'s hand.`);
  }

  player.objectiveHand.splice(handIndex, 1);
  card.zone = CardZone.ScoredObjectives;
  card.revealed = true;
  player.scoredObjectives.push(card);
  player.glory += definition.gloryValue;
  return [];
}

function canResolvePloyEffect(
  game: Game,
  player: PlayerState,
  effect: PloyEffect,
  targetFighterId: string | null,
): boolean {
  switch (effect.kind) {
    case PloyEffectKind.DrawPowerCards:
      return Number.isInteger(effect.count) && effect.count > 0 && player.powerDeck.drawPile.length >= effect.count;
    case PloyEffectKind.GainWarscrollTokens:
      return Object.values(effect.tokens).every((tokenCount) => Number.isInteger(tokenCount) && tokenCount > 0);
    case PloyEffectKind.GainFighterToken: {
      const target = getPloyTargetFighter(game, player, effect.target, targetFighterId);
      return target !== undefined && !hasFighterToken(target, effect.token);
    }
  }
}

function resolvePloyEffect(
  game: Game,
  player: PlayerState,
  effect: PloyEffect,
  targetFighterId: string | null,
): string {
  switch (effect.kind) {
    case PloyEffectKind.DrawPowerCards:
      for (let drawIndex = 0; drawIndex < effect.count; drawIndex += 1) {
        const nextCard = player.powerDeck.drawPile.shift();
        if (nextCard === undefined) {
          throw new Error(`Could not draw power card ${drawIndex + 1} for ${player.name}.`);
        }

        nextCard.zone = CardZone.PowerHand;
        player.powerHand.push(nextCard);
      }

      return `drew ${effect.count} power card${effect.count === 1 ? "" : "s"}`;
    case PloyEffectKind.GainWarscrollTokens:
      for (const [tokenName, tokenCount] of Object.entries(effect.tokens)) {
        const currentTokenCount = player.warscrollState.tokens[tokenName] ?? 0;
        player.warscrollState.tokens[tokenName] = currentTokenCount + tokenCount;
      }

      return `gained ${formatTokenAmounts(effect.tokens)}`;
    case PloyEffectKind.GainFighterToken: {
      const target = getPloyTargetFighter(game, player, effect.target, targetFighterId);
      if (target === undefined) {
        throw new Error(`Could not find a legal fighter target for ${effect.kind}.`);
      }

      setFighterToken(target, effect.token, true);
      return `gave ${effect.token} token to fighter ${target.id}`;
    }
  }
}

function getPloyTargetFighter(
  game: Game,
  player: PlayerState,
  targetKind: PloyEffectTargetKind,
  targetFighterId: string | null,
): FighterState | undefined {
  if (targetFighterId === null) {
    return undefined;
  }

  const targetOwner =
    targetKind === PloyEffectTargetKind.FriendlyFighter
      ? player
      : targetKind === PloyEffectTargetKind.EnemyFighter
        ? game.getOpponent(player.id)
        : undefined;
  if (targetOwner === undefined) {
    return undefined;
  }

  const target = targetOwner.getFighter(targetFighterId);
  if (target === undefined || target.isSlain || target.currentHexId === null) {
    return undefined;
  }

  return target;
}

function hasFighterToken(fighter: FighterState, token: FighterTokenKind): boolean {
  switch (token) {
    case FighterTokenKind.Move:
      return fighter.hasMoveToken;
    case FighterTokenKind.Charge:
      return fighter.hasChargeToken;
    case FighterTokenKind.Guard:
      return fighter.hasGuardToken;
    case FighterTokenKind.Stagger:
      return fighter.hasStaggerToken;
  }
}

function setFighterToken(fighter: FighterState, token: FighterTokenKind, value: boolean): void {
  switch (token) {
    case FighterTokenKind.Move:
      fighter.hasMoveToken = value;
      return;
    case FighterTokenKind.Charge:
      fighter.hasChargeToken = value;
      return;
    case FighterTokenKind.Guard:
      fighter.hasGuardToken = value;
      return;
    case FighterTokenKind.Stagger:
      fighter.hasStaggerToken = value;
      return;
  }
}

function formatTokenAmounts(tokens: Readonly<Record<string, number>>): string {
  return Object.entries(tokens)
    .map(([tokenName, tokenCount]) => `${tokenCount} ${tokenName} token${tokenCount === 1 ? "" : "s"}`)
    .join(", ");
}
