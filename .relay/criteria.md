# Evaluation criteria: mobile-expo

Score each criterion from 1 to 5 for the milestone as a whole. A milestone is approved only if every criterion meets its threshold and every Definition of Done item of every feature passed.

| Criterion | Threshold | What 5 looks like | What fails |
|---|---|---|---|
| Functionality | 4 | Every Definition of Done item works when used as a person would, including after a reload | Any item that only works on the happy path, or that the code suggests works but the screen does not show |
| Data integrity | 4 | Data entered survives reload and app restart; edits and deletes affect only their target | Lost, duplicated or cross-contaminated data |
| Mobile usability | 3 | At 390 x 844 nothing is clipped or overlapping, tap targets are comfortably large, empty and error states exist | Horizontal scroll, text cut off, a dead end with no way back |
| Design coherence | 3 | Spacing, type and colour are consistent across screens and read as one app | Default template look, or screens that look like different apps |
| Code quality | 3 | Follows the constitution's structure; no dead code, no disabled tests | A constitution rule broken without an ADR |

## Calibration

- A button that renders but does nothing is Functionality 1, not 3.
- "Works but I had to reload first" is Functionality 2.
- A screen that is correct but plainly the starter template is Design coherence 2.
- Never raise a score because the rest of the milestone is good. Each criterion stands alone.
