# Dev/UAT environment review

- Review ID: REV-20260812-dev-uat
- Mode: review-and-fix
- Status: verified
- Created: 2026-08-12T00:00:00Z
- Scope: Dev/UAT environment isolation and promotion workflow
- Release assessment: ready

## First independent review

Two material findings were identified:

1. The build path always packaged the production manifest.
2. The written promotion order and automated data-sync behavior conflicted with pre-merge UAT.

## Resolution

- Added explicit `production`/`dev` manifest selection with unknown environments rejected.
- Added `verify:dev` and an assertion against the built artifact.
- Changed pull-request validation to run the Dev gate.
- Unified the documented promotion order.
- Changed scheduled data sync to create or update a pull request rather than pushing to `main`.
- Follow-up review found that `GITHUB_TOKEN` pull requests may not trigger validation and repository settings may forbid their creation. The workflow now updates only a candidate branch and Issue; Codex opens the PR through the owner's authenticated session.

## Evidence

`pnpm verify:dev` passed with 82 Vitest tests, 10 built-output integration tests, form-integrity audit, production build, Dev build, and Dev manifest assertion.

Final independent re-review is required before the candidate pull request is published.

## Findings

### F-001

- Severity: high
- Confidence: high
- Status: verified
- Evidence: The original build path selected the production manifest for Dev artifacts and the promotion order conflicted across documentation and automation.
- User impact: A candidate could target production or bypass the required Dev UAT order.
- Root cause: Environment selection was implicit and release rules were inconsistent.
- Recommended solution: Use fail-closed environment selection, assert the built manifest, and require pre-PR Dev UAT.
- Alternatives and tradeoffs: Manual manifest swapping is too error-prone.
- Affected areas: Sites build scripts, manifests, Actions, contributor workflow.
- Acceptance criteria: Dev artifact contains only the Dev project ID and documented/automated release ordering agrees.
- Verification: `verify:dev` and final independent review passed in the completed release.
- Residual risk: Production deployment remains human-only.
- Autonomy class: independent-review-required
- Remediation: remediations/REM-20260812-dev-uat-F001.md
