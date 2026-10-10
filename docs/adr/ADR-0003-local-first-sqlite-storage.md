---
id: ADR-0003
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, data]
---
# ADR-0003 Local-first storage in SQLite

## Context

Financial data of one person, who does not need several devices at once but must never lose data. Other users may come later. The author also needs a one-time CSV import from the app used today.

## Options considered

1. SQLite on the device with expo-sqlite: no account, no network, no cost, relational constraints. Costs: no sync, and reinstalling the app erases the data unless backed up.
2. Supabase Free: no cost. Rejected: the project pauses after one week of inactivity and there are no automatic backups, which does not fit "never lose data".
3. Supabase Pro: daily backups kept 7 days and no pausing. About US$ 25 per month (roughly R$ 128 at R$ 5.12 per dollar, prices checked 2026-10-10). Rejected for now: recurring cost, a third party holds the financial data, and it adds login, access rules and network failure handling that one user does not need yet.
4. JSON file or key-value storage: simplest. Rejected: no queries or constraints for a ledger.

## Decision

SQLite on the device through expo-sqlite. Data protection comes from backups ([[ADR-0011-backup-and-csv-import]]), not from the storage location.

## Consequences

Easier: no accounts, works offline, private by default. Harder: no multi-device use and no sharing. Risks and checks:

- expo-sqlite support on the web target may be less mature than on phones. The scaffold task must prove that data survives a page reload in the browser and must ask the browser for persistent storage. If it does not hold, a new ADR chooses the fallback.
- Revisit this decision if multi-device use or other users become a requirement. Ids are UUIDs and storage sits behind `src/data/` to keep that move affordable ([[ADR-0008-uuid-identifiers]]).
