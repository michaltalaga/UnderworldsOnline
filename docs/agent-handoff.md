# Agent Handoff

## Purpose

This file is for current project status and continuation notes only.

Do not move stable working rules or user preferences here. Those belong in `AGENTS.md`.

## Current Snapshot

- Engine coverage currently includes setup through deployment, combat round start and turn flow, core combat actions, power card play, warscroll abilities, and end phase cleanup.
- The practice battlefield UI is already interactive for movement, attacks, and power-step card play.
- Practice objective, ploy, and upgrade content already exists in code.

## Current Direction

- Card discovery has been consolidated around `PlayerState.getPlayableCards(...)`.
- `GameEngine` already uses that path for objective scans.
- `CombatActionService` already uses that path for ploy and upgrade legality.

## Likely Next Step

- Reuse `PlayerState.getPlayableCards(...)` in the battlefield power overlay and related UI card-option plumbing so engine, action service, and UI all discover playable cards the same way.
