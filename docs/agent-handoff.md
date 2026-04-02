# Agent Handoff

## Purpose

This file is for current game-specific context, recent refactors, and continuation notes.

Do not move stable working rules or user preferences here. Those belong in `AGENTS.md`.

## Current Game State

The repo currently has:

- setup flow implemented through deployment
- combat round start and combat turn flow
- end phase through cleanup
- interactive battlefield map UI

The worktree was clean when this handoff was written.

## Current Architecture

### Engine and state

- `GameState`, `Game`, and `GameEngine` are the core state-machine pieces.
- `Game.records` is the typed event log and is also exposed as `game.events`.
- `GameEventLogState` is the read-only world/log view passed into cards.

### Card model

- `CardDefinition` is the base card class.
- Cards implement:
  - `canPlay(game, world, player, card, context)`
  - `play(game, world, player, card, context)`
- Card discovery should prefer `PlayerState.getPlayableCards(...)`.
- The project has moved away from separate scoring resolver layers.

## Recent Refactors

### `86ea0df` `Scan playable cards directly`

- Added `PlayerState.getPlayableCards(...)`
- Removed:
  - `src/domain/rules/ScoringResolver.ts`
  - `src/domain/rules/DefaultScoringResolver.ts`
- `GameEngine` now scans playable objective cards directly
- `createCombatDebugGame.ts` end-phase snapshot now seeds real card/event state instead of overriding scoring logic

### `759fa4f` `Reuse playable card scans in action service`

- `CombatActionService` now uses `PlayerState.getPlayableCards(...)` for ploy/upgrade legality and action generation
- Added helper:
  - `getPlayablePowerCards(...)`

## Current Gameplay Coverage

Implemented engine slices include:

- setup through deployment
- combat round start
- move
- charge
- attack
- guard
- focus
- delve
- pass
- play ploy
- play upgrade
- warscroll ability use
- end phase draw / cleanup flow

Cards currently include code-driven practice objectives, ploys, and upgrades.

## Current UI Notes

The battlefield map already supports:

- selecting fighters
- click-to-move
- click-to-charge
- click-to-attack
- guard / pass / delve controls
- power-step overlay for ploys / upgrades / warscroll abilities
- second-click confirmation for board actions

Do not casually change the confirm-on-second-click interaction pattern.

## Important Current Files

- `src/domain/engine/GameEngine.ts`
- `src/domain/rules/CombatActionService.ts`
- `src/domain/state/Game.ts`
- `src/domain/state/GameEventLogState.ts`
- `src/domain/state/GameRecord.ts`
- `src/domain/state/PlayerState.ts`
- `src/domain/definitions/CardDefinition.ts`
- `src/domain/content/warbands/SetupPracticeWarband.ts`
- `src/domain/content/games/SetupPracticeGame.ts`
- `src/PracticeBattlefieldApp.tsx`
- `src/PracticeBattlefieldApp.css`

## Good Next Steps

If continuing the current architectural cleanup, the best next step is:

- reuse `PlayerState.getPlayableCards(...)` in the battlefield power overlay / UI card-option plumbing too, so card discovery follows one path in engine, action service, and UI

Other sensible non-debug follow-ups:

- simplify any remaining card-play call sites that still reconstruct card legality manually
- continue expanding real card content using the card-owned `canPlay` / `play` model
