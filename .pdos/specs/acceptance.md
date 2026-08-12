# Acceptance

| Requirement | User-visible outcome | Verification | Status |
|---|---|---|---|
| Separate Dev site | Stable Champions Lab Dev URL exists | Sites project inspection | In progress |
| Production isolation | Dev and production have different project IDs and D1 resources | Manifest test and Sites metadata | In progress |
| Durable workflow | New Codex conversations follow branch -> tests -> review -> PR -> Dev UAT -> merge -> explicit production approval | `AGENTS.md` review/test | In progress |
| Exact candidate | Dev version source SHA equals checked PR head | GitHub/Sites provenance comparison | Pending |
| Browser usability | Owner can open key routes and exercise UI on Dev | Dev smoke test | Pending |
