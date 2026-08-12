# Dev/UAT environment review

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
