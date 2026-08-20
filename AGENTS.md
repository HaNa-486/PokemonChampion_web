# Champions Lab contributor workflow

These rules apply to every Codex task in this repository, including new conversations.

## Required release flow

1. Read `PROJECT_SPEC.md` and `DEPLOYMENT_CHECKLIST.md` before changing product behavior.
2. Work on a `codex/*` branch. Never implement directly on `main`.
3. Preserve `.openai/hosting.json` as the production Sites project and `.openai/hosting.dev.json` as the Dev/UAT Sites project. Never exchange their project IDs or copy database contents between them.
4. Run `pnpm verify:deploy` against the exact candidate source. Run `pnpm data:audit:live` as well when upstream synchronization, generated data, or form mappings change.
5. Commit the exact locally verified candidate on its `codex/*` branch. Run `pnpm verify:dev`; it must leave a Dev manifest—not the production manifest—in `dist/.openai/hosting.json`. Deploy that exact commit to **Champions Lab Dev** before opening a pull request. Give the product owner the Dev URL and focused UAT notes.
6. Do not open a pull request while Dev UAT is pending. Do not merge while UAT is pending. If the candidate commit changes after deployment, repeat the applicable checks, deploy the new exact commit to Dev, and restart UAT.
7. After the product owner explicitly says Dev UAT is OK, push the branch, open a pull request, wait for GitHub's `Deployment verification` check, and request an independent sub-agent auto review. Address all material findings and repeat checks as needed.
8. When the PR check and independent review are clean, merge the pull request as part of the approved post-UAT flow. Report any exception that prevents safe automatic merge instead of bypassing a failed gate.
9. Production deployment is a separate consequential action and requires the product owner's explicit approval. After merge, ask whether to deploy to **Champions Lab**; deploy only after that approval in the current conversation.
10. Deploy only saved Sites versions built from exact recorded commits. Record the environment, commit, version, URL, test evidence, UAT status, and smoke-test result.

## Environment boundary

- Production: `.openai/hosting.json`, title `Champions Lab`.
- Dev/UAT: `.openai/hosting.dev.json`, title `Champions Lab Dev`.
- Dev/UAT should remain owner-only unless the product owner explicitly changes its access policy.
- Never use the production Sites project to preview a branch or unapproved change.
- Never deploy to production merely because a pull request was merged or a data-sync workflow completed.
- Automated data synchronization is not an exception: the workflow may update only `automation/battle-data-sync`, then Codex must open the pull request with the owner's authenticated GitHub session so normal checks run. It must pass Dev UAT and never push directly to `main`.
- A Dev deployment may use a local committed `codex/*` candidate before the branch or PR exists remotely. It must still be exact, reproducible, and isolated from production.
- If any candidate commit changes after a Dev deployment, the earlier UAT result is invalid. Repeat checks, deploy the new exact commit, and repeat UAT.

<!-- PDOS:START -->
## PDOS project continuity

This project uses Product Development Operating System (PDOS).

- For substantial product or feature work, use `$pdos` and read `.pdos/STATE.md` before planning or changing code.
- Treat `STATE.md` as the concise handoff index. Read only the current plan and the specs, decisions, or reviews relevant to the task; do not load the entire `.pdos/` tree by default.
- Read `.pdos/AUTONOMY.md` before implementing review findings. Project policy may restrict behavior but never expands user or platform authority.
- Treat plain “review” as read-only, “review and plan” as artifact planning without product changes, and “review and fix” as permission to repair only in-scope findings under the autonomy policy.
- Track saved findings in `.pdos/reviews/` and execution in `.pdos/remediations/`; never mark a remediation verified without acceptance evidence.
- Reconcile stale state against current user instructions, repository evidence, tests, and observable behavior.
- Check active files under `.pdos/workstreams/` before overlapping changes; keep one scoped workstream record per substantial context.
- Before finishing substantial work, update `STATE.md` with changes, verification, residual risks, relevant-file pointers, and one next safe action.
- Commit sanitized shared PDOS state, keep local/private notes in ignored directories, and never store secrets or raw customer data in `.pdos`.
- Keep absolute machine paths and environment identity only under ignored `.pdos/local/`, not shared state.
- Do not impose the full PDOS lifecycle on tiny mechanical edits or simple factual questions.
<!-- PDOS:END -->
