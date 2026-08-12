# Champions Lab

An unofficial Pokémon Champions team-building database for the current regulation. It combines legality and usage from [Pokémon Champions Battle Data](https://championsbattledata.com/), Champions-specific move, ability, and held-item mechanics plus English text from [Pokémon Showdown](https://github.com/smogon/pokemon-showdown), and IDs plus localization supplements from [PokeAPI](https://github.com/PokeAPI/pokeapi).

The implementation contract, data model, security boundaries, acceptance criteria, and full test design live in [PROJECT_SPEC.md](./PROJECT_SPEC.md). Release work follows [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md).

## Deployment environments

The project uses two isolated ChatGPT Sites projects. `pnpm verify:dev` fails unless the final built artifact contains the Dev manifest:

- **Champions Lab Dev** is the owner-only UAT environment. After local verification, independent review, and a successful pull-request check, the exact pull-request head commit is deployed here for product-owner UI testing.
- **Champions Lab** is production. A pull request is merged only after Dev UAT approval, and production promotion then requires separate explicit approval.

The production project is identified by `.openai/hosting.json`; Dev/UAT is identified by `.openai/hosting.dev.json`. Both expose the same logical `DB` binding but Sites provisions them as separate databases. Never swap the manifests, copy production data into Dev, or use production to preview a branch. The persistent contributor rules are in [AGENTS.md](./AGENTS.md).

## Features

- Current-regulation Pokémon database using Champions sprites and stats
- Complete paginated Pokémon and move catalogs with advanced filters, sorting, and move/ability reverse lookup
- Positive, zero, and negative move-priority filters
- Accessible hover, focus, and click explanations for moves, abilities, and held items
- Independent Singles/Doubles six-member teams with family and held-item clause validation
- Four selected moves with type badges, ability, item, AP, nature, and calculated final stats
- Format-specific usage defaults and dedicated Mega Stone transformation
- Defensive matchup summaries plus a complete 18×18 type chart
- Speed comparison with stages, Choice Scarf, and Trick Room ordering
- English and Traditional Chinese UI
- Protected, allowlisted admin draft-override console backed by Cloudflare D1

## Local development

Requires Node.js 22.13 or newer and pnpm.

```bash
pnpm install
pnpm run data:sync
pnpm run dev
```

`data:sync` writes the normalized, versioned snapshot to `data/generated/champions-snapshot.json`. It is deliberately a build-time sync, not a public mirror endpoint.

### Automated upstream refresh

`.github/workflows/sync-battle-data.yml` checks Champions Battle Data, Pokémon Showdown, and PokeAPI every six hours. The sync exits without changing files when all three pinned upstream revisions are unchanged. When any source changes, the workflow regenerates the bundled catalog, runs the complete Dev/UAT verification suite, and updates the isolated `automation/battle-data-sync` candidate branch. It never pushes a new snapshot directly to `main`. The notification Issue contains a comparison link; Codex then opens the pull request using the owner's authenticated GitHub session so normal PR checks trigger without granting GitHub Actions permission to create pull requests. A failed sync or failed test never replaces the last known-good snapshot. If a later sync changes the candidate branch while UAT is pending, the previous UAT result is invalid: deploy the new head to Dev and repeat UAT.

Every synchronization run writes an Actions Summary with the check time, upstream Champions date and version, whether data changed, validation and commit outcomes, and whether production deployment is required. This makes successful no-change checks visible without reading raw step logs.

After a validated snapshot is pushed, the workflow creates or updates one `deployment-required` GitHub Issue assigned to the repository owner. Repeated updates reuse that open Issue instead of creating notification spam. A failed workflow similarly creates or updates one `sync-failed` Issue, and the next successful run closes that failure notification automatically. ChatGPT Sites deployment remains an explicit promotion step: verify the candidate on Champions Lab Dev first, then close the deployment Issue only after the approved commit is published to production and smoke-tested.

The current Singles and Doubles usage panels continue to use the upstream Current API through the server-side proxy. The footer reads `/api/v1/data-status`, so it reports the upstream generation date instead of a hard-coded date and falls back to the bundled snapshot when upstream is unavailable.

## Validation

Pull requests targeting `main` run `.github/workflows/pull-request-validation.yml`, which installs the frozen dependency graph and executes the same `verify:deploy` gate used before release. Because the private repository's current GitHub plan does not enforce branch protection, maintainers must still wait for this check to pass before merging.

```bash
pnpm run verify:deploy
```

`verify:deploy` runs lint, TypeScript checking, the offline form-integrity audit, unit/component tests, a production build, and built-worker integration tests. When upstream sync code, form mappings, or the generated snapshot changes, also run:

```bash
pnpm run data:audit:live
```

## Admin and database

Set `ADMIN_EMAILS` to a comma-separated, server-side allowlist. An empty value denies every account. The admin page uses Sign in with ChatGPT identity headers and never trusts client-supplied identity.

Generate D1 migrations after schema changes:

```bash
pnpm run db:generate
```

The initial migration is in `drizzle/0000_flippant_wendigo.sql`.

## Data and legal notes

This project is an unofficial community tool. Battle data and sprites are attributed to Pokémon Champions Battle Data. Champions move, ability, and held-item mechanics plus English text are derived from Pokémon Showdown's open-source base data and Champions mod at a pinned revision. PokeAPI supplies IDs and localization supplements at a pinned revision. Preserve the applicable upstream notices; do not expose bulk-download, dump, or mirror endpoints for the upstream Champions dataset; consult upstream terms before commercial release. Pokémon and related names are trademarks of their respective owners.
