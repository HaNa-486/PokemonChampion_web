# Active plan

| Slice | Outcome | Risk | Verification | Status |
|---|---|---|---|---|
| Item asset pipeline | Pinned PokeAPI item sprites are copied locally with a generated manifest | Missing/new assets, partial writes, mutable runtime URLs | Path resolver, bounded fetch, PNG/manifest integrity, failure rollback, and cleanup tests | Completed |
| Shared item UI | One accessible icon/display/tooltip implementation handles normal and failure states | Broken images, duplicated behavior, inaccessible labels | Component tests for normal, missing, and load-error states | Completed |
| Product-wide coverage | Catalog, battle usage, builder, team tray, Mega notice, and speed item scenario show icons | A visible held-item name remains text-only or responsive layout regresses | Code inventory and component tests passed; responsive Dev UAT remains | Completed locally |
| Release evidence | Exact candidate passes repository gates and reaches owner-only Dev before PR | Generated-data or deployment regression | `verify:deploy` and live audit passed; pre-UAT review clean; run `verify:dev`, then deploy exact commit | Deploying to Dev |
