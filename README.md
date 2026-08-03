# Champions Lab

An unofficial Pokémon Champions team-building database for the current regulation. It combines the live [Pokémon Champions Battle Data](https://championsbattledata.com/) index with structured move data from the [PokeAPI repository](https://github.com/PokeAPI/pokeapi).

The implementation contract, data model, security boundaries, acceptance criteria, and full test design live in [PROJECT_SPEC.md](./PROJECT_SPEC.md). Release work follows [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md).

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

## Validation

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

This project is an unofficial community tool. Battle data and sprites are attributed to Pokémon Champions Battle Data. PokeAPI data is consumed from its open-source repository. Do not expose bulk-download, dump, or mirror endpoints for the upstream Champions dataset; consult upstream terms before commercial release. Pokémon and related names are trademarks of their respective owners.
