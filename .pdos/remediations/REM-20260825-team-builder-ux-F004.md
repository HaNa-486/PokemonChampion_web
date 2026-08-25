# Remediation: Rank-aware builder choices and transparent upstream gaps

- Remediation ID: REM-20260825-team-builder-ux-F004
- Review finding: reviews/REV-20260820-team-builder-ux.md#F-004
- Severity: medium
- Status: implemented
- Updated: 2026-08-25T07:00:00Z
- Autonomy class: auto-decide
- Owner: Codex
- Decision authority: project owner authorized the in-scope fixes; implementation details are auto-decide
- Reason: Directly requested after product-owner Dev testing exposed incomplete ranking and matchup ordering.
- Revisit condition: Reopen if real source ranks are reordered, compressed, hidden, or fabricated, or if matchup severity order regresses.

## Scope

- Expose mapped legal current-format ranks 1–10 in builder move, ability, held-item, and nature selectors.
- Preserve the upstream rank number rather than compressing gaps.
- Detect and disclose missing battle-usage ranks without inventing data.
- Sort defensive weaknesses and resistances by their multiplier severity.
- Reconcile Mega Gallade's live form-specific battle key found by the required live audit.

## Acceptance evidence

- Recommendation tests cover rank 10 and source-rank preservation.
- Battle normalization test covers Clefable-like ranks 6–10 with missing ranks 1–5.
- Component test verifies the disclosure and unmodified rank 6.
- Type matchup tests verify descending weakness and ascending resistance multipliers.
- Exact-candidate `pnpm verify:deploy` passed with 117 tests and the complete build/API gate. `pnpm data:audit:live` passed for all 358 snapshot forms. Dev packaging and Dev UAT remain the release gates.

## Residual risk

- The upstream does not currently provide Clefable Doubles move ranks 1–5; the product can only disclose this accurately until the provider publishes them.
- Real browser/mobile selector layout and live data disclosure need Dev UAT.

## History

- 2026-08-25T07:00:00Z open: created from product-owner Dev findings.
- 2026-08-25T07:10:00Z implemented: local implementation, full deployment gate, and live data audit passed.
