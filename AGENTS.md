# AGENTS.md

## Project

Browser board game built with TypeScript, React, and Vite.

- Frontend lives in `src/`
- Domain model and engine live in `src/domain`
- CLI/debug scripts live in `scripts/`

## Working Style

- Inspect existing code before changing anything.
- Make minimal, targeted changes.
- Reuse the existing engine and model instead of adding parallel systems.
- Implement only what was asked for.
- Do not invent official game content unless explicitly requested.
- Avoid debug-only work unless it is necessary to support or verify a requested change.

## Required Workflow

1. Inspect the relevant files first.
2. Make the smallest change that fits the existing architecture.
3. Verify the change with the narrowest relevant command.
4. Commit the finished work.
5. End by suggesting a sensible next step.

## Verification Defaults

Use the smallest relevant set:

- `npm run build`
- `npm run setup:practice`
- `npm run debug:end-phase`

If the change is docs-only, build verification is optional.

## Architecture Notes

### Core engine

- The game is a real state machine centered on `GameState`, `Game`, and `GameEngine`.
- `Game.records` / `Game.events` is the strongly typed event log.
- Cards receive world state through `GameEventLogState`.

### Card model

- Cards own their own rule logic through `CardDefinition.canPlay(...)` and `CardDefinition.play(...)`.
- Prefer asking cards whether they can play instead of growing special-case resolver layers.
- Prefer `PlayerState.getPlayableCards(...)` for card discovery.
- Do not add extra trigger metadata unless it is clearly necessary.
- The intended model is: state + full typed log + simple context, not batch tracking.

### UI model

- The battlefield map is interactive and is the main play surface.
- Board actions follow a confirm-on-second-click pattern.
- Avoid changing that interaction model unless explicitly asked.

## Current Preferences From The User

- Always commit finished work.
- Always suggest a next step.
- Keep naming simple and direct.
- Prefer straightforward card-centric logic over large shared condition switches.
- Do not auto-select things for the player unless explicitly requested.

## Good File Entry Points

- `src/domain/engine/GameEngine.ts`
- `src/domain/rules/CombatActionService.ts`
- `src/domain/state/Game.ts`
- `src/domain/state/PlayerState.ts`
- `src/domain/definitions/CardDefinition.ts`
- `src/domain/content/warbands/SetupPracticeWarband.ts`
- `src/PracticeBattlefieldApp.tsx`

