# Champions Lab contributor workflow

These rules apply to every Codex task in this repository, including new conversations.

## Required release flow

1. Read `PROJECT_SPEC.md` and `DEPLOYMENT_CHECKLIST.md` before changing product behavior.
2. Work on a `codex/*` branch. Never implement directly on `main`.
3. Preserve `.openai/hosting.json` as the production Sites project and `.openai/hosting.dev.json` as the Dev/UAT Sites project. Never exchange their project IDs or copy database contents between them.
4. Run `pnpm verify:deploy` against the exact candidate source. Run `pnpm data:audit:live` as well when upstream synchronization, generated data, or form mappings change.
5. Request an independent review agent after tests pass and address all material findings.
6. Push the branch, open a pull request, and wait for GitHub's `Deployment verification` check.
7. Run `pnpm verify:dev`; it must leave a Dev manifest—not the production manifest—in `dist/.openai/hosting.json`. Deploy the exact checked pull-request head commit to **Champions Lab Dev**. Give the product owner the Dev URL and UAT notes. Do not merge while UAT is pending.
8. After explicit UAT approval, merge the pull request. Production deployment is a separate consequential action and requires the product owner's explicit approval in the current conversation.
9. Deploy only a saved Sites version built from the exact approved commit. Record the environment, commit, version, URL, test evidence, and smoke-test result.

## Environment boundary

- Production: `.openai/hosting.json`, title `Champions Lab`.
- Dev/UAT: `.openai/hosting.dev.json`, title `Champions Lab Dev`.
- Dev/UAT should remain owner-only unless the product owner explicitly changes its access policy.
- Never use the production Sites project to preview a branch or unapproved change.
- Never deploy to production merely because a pull request was merged or a data-sync workflow completed.
- Automated data synchronization is not an exception: the workflow may update only `automation/battle-data-sync`, then Codex must open the pull request with the owner's authenticated GitHub session so normal checks run. It must pass Dev UAT and never push directly to `main`.
- If any candidate branch head changes after a Dev deployment, the earlier UAT result is invalid. Repeat checks, deploy the new exact head, and repeat UAT.
