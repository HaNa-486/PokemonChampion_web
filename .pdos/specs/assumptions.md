# Assumptions

| Statement | Class | Confidence | Impact | Evidence | Default/decision | Validation |
|---|---|---:|---|---|---|---|
| Owner-only Dev access is sufficient initially | Reversible | High | Low | User asked for their own UI/UAT surface | Keep private until explicitly changed | Inspect Sites access policy |
| Dev must not share mutable production data | Consequential | High | High | UAT actions may write drafts/settings | Separate Sites project and D1 | Compare project/binding metadata |
| UAT should happen before merge | Reversible process | High | Medium | User needs to reject/fix candidate releases | Keep PR open during UAT | Document and test workflow |
