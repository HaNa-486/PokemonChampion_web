# Decision: isolated Dev/UAT environment

- Date: 2026-08-12
- Status: accepted

## Decision

Use a second owner-only ChatGPT Sites project, **Champions Lab Dev**, for every checked pull-request candidate. Its project ID and D1 database are separate from production. Keep the pull request open during UAT; merge only after product-owner approval. Treat production deployment as a separate action that requires explicit approval.

Dev builds require `SITES_ENV=dev` through `pnpm verify:dev`. The gate compares `dist/.openai/hosting.json` with `.openai/hosting.dev.json` and fails if the production project ID appears in the Dev artifact.

Automated data synchronization follows the same rule: it updates only an automation branch and notification Issue instead of pushing directly to `main`. Codex creates the pull request with the owner's authenticated GitHub session, ensuring normal PR checks run without broadening GitHub Actions permissions.

## Why

The product owner needs a real browser UI to test candidate changes. Reusing production prevents meaningful pre-release UAT and risks exposing unfinished changes or mutating production data.

## Rollback

Stop deploying new Dev versions, close the candidate PR, and leave production untouched. The Dev Sites project can be removed separately only with explicit approval.
