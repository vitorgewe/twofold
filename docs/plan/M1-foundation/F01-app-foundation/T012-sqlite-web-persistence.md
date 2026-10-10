---
id: T012
type: task
feature: "[[F01-app-foundation]]"
milestone: "[[M1-foundation]]"
status: in_progress
depends_on: ["[[T011-scaffold-expo-app]]"]
estimate_tokens: 400000
estimate_hours: 0.5
actual_tokens: 109321
actual_hours: 0.05
tags: [task]
---
# T012 SQLite web persistence

## Goal

Evidence that SQLite persists across reloads on the web target, and a database module ready for migrations.

## Description

Add `expo-sqlite`. Create `src/data/database.ts`:

- opens the database `twofold.db` lazily;
- exports a small `Database` interface that repositories will depend on: run a statement with parameters, query rows, and run a callback inside a transaction;
- exports `runMigrations(db, migrations)` driven by a `schema_version` table. Migration 1 creates `meta(key text primary key, value text)`.

On web, call `navigator.storage.persist()` at startup and ignore browsers that do not support it.

For tests, pick a SQL adapter that implements the `Database` interface in Node (`sql.js` or `better-sqlite3`, whichever installs cleanly on Node 22 in CI) so later tasks can test repositories against real SQL. Write an ADR (next free number, status accepted) recording the interface and the test adapter.

The proof: with a temporary debug screen that is not committed, write a value to `meta` through the module, reload the page in the browser and read it back. Use the Playwright MCP tools.

If persistence does not work on the web target, do not work around it: write an ADR with status `proposed` that holds the evidence and the fallback options, set this task to `blocked` and stop (see the methodology).

Out of scope: tables other than `meta` and `schema_version`, and any UI that stays in the app.

## Definition of Done

- [ ] Observed in the running web app: a value written to `meta` is still there after a full page reload and after closing and reopening the tab
- [ ] The Progress entry records the browser used and whether `navigator.storage.persist()` was granted
- [ ] Jest tests for `runMigrations` pass: applies migrations once, applies new ones in order, is idempotent when run twice
- [ ] The temporary debug screen is not in the commit
- [ ] The ADR for the `Database` interface and the test adapter exists with status accepted
- [ ] `.relay/verify.sh` passes

## Related decisions

- [[ADR-0003-local-first-sqlite-storage]]
- [[ADR-0004-database-as-source-of-truth]]
- [[ADR-0011-backup-and-csv-import]]

## Progress

## QA
