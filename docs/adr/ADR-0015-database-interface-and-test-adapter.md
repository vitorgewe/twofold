---
id: ADR-0015
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, data]
---
# ADR-0015 Database interface and test adapter

## Context

Repositories in `src/data/` need one small contract for SQL access that works on device (expo-sqlite), on the web target, and in Jest under Node, so repository tests run against real SQL. [[ADR-0003-local-first-sqlite-storage]] and [[ADR-0004-database-as-source-of-truth]] fix SQLite as the store.

## Options considered

1. Repositories use expo-sqlite directly. Costs: Jest needs the native module or a mock, so tests would not exercise real SQL.
2. A small `Database` interface (`run`, `query`, `transaction`) with expo-sqlite as the runtime implementation and a Node adapter for tests. Costs: one thin wrapper per implementation.
3. A query builder or ORM. Rejected: more surface than this app needs.

Test adapter candidates: `better-sqlite3` (native build, can fail to install on CI Node versions) and `sql.js` (WebAssembly, pure npm install, in-memory).

## Decision

Option 2. `src/data/database.ts` exports `Database` with `run(sql, params)`, `query(sql, params)` and `transaction(callback)`, plus `runMigrations(db, migrations)` driven by a `schema_version` table; each migration runs in its own transaction together with its version row. `getDatabase()` opens `twofold.db` lazily on first use. The test adapter is `sql.js` in `src/data/sqljs-adapter.ts` (`createTestDatabase()`, in-memory).

Web needs two settings, found while proving persistence: Metro treats `.wasm` as an asset and sends cross-origin isolation headers (`metro.config.js`), and `app.json` uses `web.output: "single"` because static rendering fails on expo-sqlite's web worker ("Worker chunk not found"). `navigator.storage.persist()` is requested at startup and ignored where unsupported.

## Consequences

Easier: repositories depend only on `Database` and are tested against real SQL without native code. Harder: the test adapter and expo-sqlite can differ in edge cases, so behaviour that depends on them needs a check in the running app. The single-page web output gives up pre-rendered HTML. We would notice the decision was wrong if a repository test passes on `sql.js` but fails in the browser or on device.
