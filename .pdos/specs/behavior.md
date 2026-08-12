# Behavior

| State or event | Expected behavior | Failure/recovery | Evidence |
|---|---|---|---|
| Candidate passes local and PR checks | Exact PR head is deployed to owner-only Champions Lab Dev | Do not deploy if checks fail or provenance differs | Sites version source SHA and GitHub check |
| UAT is pending | PR remains open; production remains unchanged | Fix on same branch, rerun gates, replace Dev candidate | PR history and Dev version |
| UAT is approved | PR may merge | Production still waits for explicit approval | Approval message and merge record |
| Wrong manifest/project is selected | Deployment is blocked | Rebuild package with the correct environment manifest | Manifest validation test |
