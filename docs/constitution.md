---
type: constitution
tags: [constitution]
---
# Constitution

The architecture decisions currently in force. This file has no history: each line states what is true now and links to the ADR that decided it. To change a line, write a new ADR that supersedes the old one, then rewrite the line.

Agents read this at the start of every session and may not edit it.

## Stack

- Expo (managed workflow) with React Native and TypeScript in strict mode. [[ADR-0001-expo-managed-typescript]]
- File-based routing with Expo Router; every screen is a file under `app/`. [[ADR-0002-expo-router]]

## Data

- Server-less and local-first: SQLite on the device through expo-sqlite. [[ADR-0003-local-first-sqlite-storage]]
- The database is the single source of truth; screens read it through hooks in `src/data/`, with no separate client store. [[ADR-0004-database-as-source-of-truth]]
- Money is stored as integers in the minor unit; floats never hold money. [[ADR-0007-integer-money]]
- Ids are UUIDs. [[ADR-0008-uuid-identifiers]]
- Every write (create, edit, delete, import) keeps each transaction balanced, enforced by one pure domain function. [[ADR-0009-balance-invariant]]
- Net worth is the sum of ledger BRL values; currency gains are ordinary transactions entered by hand. [[ADR-0010-net-worth-from-ledger]]
- Full JSON backup export and import; CSV import is all-or-nothing and idempotent by `transaction_id`. [[ADR-0011-backup-and-csv-import]]

## Structure

- `app/` holds routes only. Logic lives in `src/features/<feature>/`, shared UI in `src/ui/`, storage in `src/data/`. [[ADR-0005-folder-structure]]

## Quality

- Jest with React Native Testing Library for units and components; Playwright against the web target for end-to-end. [[ADR-0006-testing-strategy]]

## Language

- Code, docs, commits and UI text are in English; UI strings live in `src/ui/strings`. [[ADR-0012-english-only]]

## Release

- Versions follow SemVer and are bumped by release-please from Conventional Commits. The bump arrives as a release pull request that the author merges; nothing pushes to `main`. [[ADR-0014-versioning-and-release]]

## Boundaries

- No custom native modules and no ejecting from the managed workflow. [[ADR-0001-expo-managed-typescript]]
- Preview deploys go to EAS Hosting only; nothing is submitted to a store. [[ADR-0013-web-preview-on-eas]]
- No secrets in the repository or in the client bundle.
