# AGENTS.md

## Purpose

This file is for stable working rules, technical conventions, and user preferences.

Do not put volatile game-progress or handoff state here. That belongs in `docs/agent-handoff.md`.

## User Preferences

- Inspect existing code before changing anything.
- Make minimal, targeted changes.
- Reuse the existing engine and model instead of adding parallel systems.
- Implement only what was asked for.
- Do not invent official game content unless explicitly requested.
- Avoid debug-only work unless it is necessary to support or verify a requested change.
- Keep naming simple and direct.
- Prefer straightforward card-centric logic over large shared condition switches.
- Do not auto-select things for the player unless explicitly requested.
- Always commit finished work.
- Always suggest a sensible next step after finishing.

## Required Workflow

1. Inspect the relevant files first.
2. Make the smallest change that fits the existing architecture.
3. Verify with the narrowest relevant command.
4. Commit the finished work.
5. End with a next-step suggestion.

## Technical Specs

### Stack and layout

- Browser board game built with TypeScript, React, and Vite.
- Frontend lives in `src/`.
- Domain model and engine live in `src/domain/`.
- Scripts live in `scripts/`.
- Game rules source material lives in `Rules/`.

### Rules source material

- For rules work, use the primary files in `Rules/`: `rules.txt`, `rules.html`, and `whuh_core_rules_eng_11-1cdg56z5qs-86cxcaddgg.pdf`.
- Do not replace these with condensed notes when implementing rules work.

### Engine

- The game is a real state machine centered on `GameState`, `Game`, and `GameEngine`.
- `Game.records` / `Game.events` is the strongly typed event log.
- Cards receive world state through `GameEventLogState`.

### Card model

- Cards own their own rule logic through `CardDefinition.canPlay(...)` and `CardDefinition.play(...)`.
- Prefer asking cards whether they can play instead of growing special-case resolver layers.
- Prefer `PlayerState.getPlayableCards(...)` for card discovery.
- Do not add extra trigger metadata unless it is clearly necessary.
- The intended model is: current state + full typed log + simple context, not batch tracking.

### UI model

- The battlefield map is the main play surface.
- Board actions follow a confirm-on-second-click pattern.
- Do not change that interaction model unless explicitly asked.

## Verification Defaults

Use the smallest relevant set:

- `npm run build`
- `npm run setup:practice`
- `npm run debug:end-phase`

If the change is docs-only, build verification is optional.

## Useful Entry Points

- `src/domain/engine/GameEngine.ts`
- `src/domain/rules/CombatActionService.ts`
- `src/domain/state/Game.ts`
- `src/domain/state/PlayerState.ts`
- `src/domain/definitions/CardDefinition.ts`
- `src/domain/content/warbands/SetupPracticeWarband.ts`
- `src/PracticeBattlefieldApp.tsx`
