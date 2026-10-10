---
type: constitution
tags: [constitution]
---
# Constitution

The architecture decisions currently in force. This file has no history: each line states what is true now and links to the ADR that decided it. To change a line, write a new ADR that supersedes the old one, then rewrite the line.

Agents read this at the start of every session and may not edit it.

## Stack

- Expo (managed workflow) with React Native and TypeScript in strict mode. [[ADR-0001-expo-managed-typescript]]

## Navigation

- File-based routing with Expo Router; every screen is a file under `app/`. [[ADR-0002-expo-router]]

## State and data

- Server-less and local-first: data is stored on the device. [[ADR-0003-local-first-storage]]
- Screen state stays in components; shared state goes through one store module, not ad hoc context. [[ADR-0004-state-management]]

## Structure

- `app/` holds routes only. Logic lives in `src/features/<feature>/`, shared UI in `src/ui/`, storage in `src/data/`. [[ADR-0005-folder-structure]]

## Quality

- Jest with React Native Testing Library for units and components; Playwright against the web target for end-to-end. [[ADR-0006-testing-strategy]]

## Boundaries

- No custom native modules and no ejecting from the managed workflow. [[ADR-0001-expo-managed-typescript]]
- No secrets in the repository or in the client bundle.
