# Active plan

| Slice | Outcome | Risk | Verification | Status |
|---|---|---|---|---|
| Dev/UAT environment | Separate Sites project and D1 boundary | Accidental production overwrite or shared data | Distinct manifests and Sites access inspection | In progress |
| Persistent release rules | New conversations follow the same promotion gates | Process exists only in chat history | Repository `AGENTS.md` plus documentation tests | In progress |
| Candidate deployment | Exact checked PR head is usable in a browser | Untested artifact or wrong project packaged | `pnpm verify:deploy`, independent review, GitHub check, Dev smoke test | Pending |
