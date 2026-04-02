# Agent Handoff

## Current Project State

The repo is a browser board game with:

- TypeScript / React / Vite app
- domain layer in `src/domain`
- setup flow implemented through deployment
- combat flow implemented through end phase / cleanup
- interactive battlefield map UI

The worktree was clean at the time this handoff was written.

## Stable User Preferences

- Inspect before changing anything.
- Make minimal, targeted changes only.
- Reuse the existing engine/model.
- Do not invent official content unless explicitly asked.
- Always commit finished work.
- Always suggest a next step after finishing.
- Avoid overengineered abstractions and overlong naming.
- Prefer cards owning their own logic.
- Avoid prioritizing debug-only work unless needed.

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

### Trigger model

- The engine now does a generic post-action sweep through card logic.
- The intended model is:
  - cards inspect full world state
  - cards inspect full typed event history
  - cards may use simple context such as timing / target / trigger action
- Do not add more trigger metadata unless there is a real need.

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

## Important Files

### Core engine

- `src/domain/engine/GameEngine.ts`
- `src/domain/state/Game.ts`
- `src/domain/state/GameState.ts`
- `src/domain/state/GameEventLogState.ts`
- `src/domain/state/GameRecord.ts`
- `src/domain/state/PlayerState.ts`

### Card/content layer

- `src/domain/definitions/CardDefinition.ts`
- `src/domain/content/warbands/SetupPracticeWarband.ts`
- `src/domain/content/games/SetupPracticeGame.ts`

### Action generation

- `src/domain/rules/CombatActionService.ts`

### Browser map

- `src/PracticeBattlefieldApp.tsx`
- `src/PracticeBattlefieldApp.css`

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

## Battlefield UI Notes

The battlefield map already supports:

- selecting fighters
- click-to-move
- click-to-charge
- click-to-attack
- guard / pass / delve controls
- power-step overlay for ploys / upgrades / warscroll abilities
- second-click confirmation for board actions

Do not casually change the confirm-on-second-click interaction pattern.

## Current Verification Commands

- `npm run build`
- `npm run setup:practice`
- `npm run debug:end-phase`
- `npm run debug:end-phase:final`

## Good Next Steps

If continuing the current architectural cleanup, the best next step is:

- reuse `PlayerState.getPlayableCards(...)` in the battlefield power overlay / UI card-option plumbing too, so card discovery follows one path in engine, action service, and UI

Other sensible non-debug follow-ups:

- simplify any remaining card-play call sites that still reconstruct card legality manually
- continue expanding real card content using the card-owned `canPlay` / `play` model
