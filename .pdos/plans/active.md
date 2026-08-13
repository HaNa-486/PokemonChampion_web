# Active plan

| Slice | Outcome | Risk | Verification | Status |
|---|---|---|---|---|
| Item asset pipeline | Pinned PokeAPI item sprites are copied locally with a generated manifest | Missing/new assets, partial writes, mutable runtime URLs | Path resolver, bounded fetch, PNG/manifest integrity, failure rollback, and cleanup tests | Completed |
| Shared item UI | One accessible icon/display/tooltip implementation handles normal and failure states | Broken images, duplicated behavior, inaccessible labels | Component tests for normal, missing, and load-error states | Completed |
| Product-wide coverage | Catalog, battle usage, builder, team tray, Mega notice, and speed item scenario show icons | A visible held-item name remains text-only or responsive layout regresses | Code inventory and component tests passed; responsive Dev UAT remains | Completed locally |
| Release evidence | Exact remediated candidate passes gates and repeat Dev UAT before merge | Review remediation changes invalidate original UAT | Updated `verify:deploy` and live audit passed; rerun PR check/review plus `verify:dev`, deploy exact commit, repeat UAT | Remediating review |
