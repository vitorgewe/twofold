---
id: ADR-0008
type: adr
status: accepted
date: 2026-10-10
supersedes: ""
superseded_by: ""
tags: [adr, data]
---
# ADR-0008 UUID identifiers

## Context

Data is local now, but the author may later want several devices or other users. Ids created on a device must not collide with ids created elsewhere, and backups and imports must merge without renumbering.

## Options considered

1. Auto-increment integers: simple and small. Rejected: two devices would produce the same ids, and a restore would need renumbering.
2. UUIDs generated on the client: unique everywhere, no coordination. Costs: larger keys and ids unreadable to humans.

## Decision

All entities use UUIDs generated on the client. CSV import uses the file's `transaction_id` as an external key to avoid duplicates ([[ADR-0011-backup-and-csv-import]]).

## Consequences

Easier: backup restore, import and a future move to a server. Harder: ids are not readable when debugging. We would notice the decision was wrong if key size ever hurts performance, which is unlikely at personal scale.
