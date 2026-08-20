# Champions Lab Deployment Checklist

> Purpose: prevent regressions before product-owner UAT or a Sites production deployment.  
> Applies to: every release from this repository.  
> Last updated: 2026-08-12 (Asia/Taipei)

## 1. Release identity and scope

- [ ] Record the intended release scope and affected areas: UI, domain rules, API, data sync/mapping, persistence, database migration, or hosting.
- [ ] Confirm unrelated user changes are preserved.
- [ ] Confirm the worktree contains only intended changes.
- [ ] Run `git diff --check`.
- [ ] Review dependency and lockfile changes when present.
- [ ] Record known limitations and migration/rollback notes.

## 2. Mandatory automated gate

Run from the repository root:

```bash
pnpm verify:deploy
```

This MUST pass without errors. It currently includes:

- ESLint
- TypeScript `--noEmit`
- Offline form/data integrity audit
- Vitest domain, mapping, API, and component suites
- Production vinext build
- Built-output SSR and API tests

- [ ] `pnpm verify:deploy` passed against the exact release source.
- [ ] After Dev UAT approval, the pull request `Deployment verification` GitHub Actions check passed before merge.
- [ ] Warnings were reviewed and no new high-risk warning was introduced.
- [ ] No test was skipped, focused, or weakened to make the gate pass.

## 2A. Dev/UAT promotion gate

- [ ] Work exists as an exact committed candidate on a `codex/*` branch; a pull request is intentionally deferred until Dev UAT approval.
- [ ] `pnpm verify:dev` passed and `dist/.openai/hosting.json` contains the Dev project ID, never the production project ID.
- [ ] Build and save a Sites version from that exact commit using `.openai/hosting.dev.json`.
- [ ] Deploy only to **Champions Lab Dev** while UAT is pending; keep the Dev site owner-only unless the product owner explicitly approves broader access.
- [ ] Confirm the Dev and production project IDs differ and their D1 databases remain isolated.
- [ ] Record the Dev URL, Sites version, commit SHA, test evidence, and known limitations.
- [ ] Product-owner UAT passed before opening the pull request.
- [ ] After UAT approval, open the PR, wait for `Deployment verification`, and run an independent sub-agent auto review.
- [ ] Every material review finding is addressed and required checks are repeated before automatic merge.
- [ ] Do not interpret merge approval as production-deployment approval; obtain explicit production approval separately.

## 3. Data and upstream mapping gate

Required when any of these change:

- `scripts/sync-upstream.mjs`
- `scripts/item-sprites.mjs`
- `scripts/audit-form-integrity.mjs`
- `data/generated/champions-snapshot.json`
- `data/generated/item-sprites.json`
- `public/items/*.png`
- form IDs, `speciesKey`, `battleDataKey`, `savedName`, learnsets, abilities, or usage mapping

Run:

```bash
pnpm data:audit:live
```

- [ ] Every directly indexed Champions form exists in the snapshot.
- [ ] Every directly indexed form's `battleDataKey` equals its live `showdownId`.
- [ ] Regional, gender, breed, and Rotom/appliance forms use their own battle keys.
- [ ] Ambiguous shared metadata fails instead of applying last-write-wins.
- [ ] Pokémon, move, ability, and item counts did not unexpectedly collapse.
- [ ] Held-item sprite manifest count matches the catalog; every available path is an exact catalog ID and a valid local PNG.
- [ ] All current Mega Stones resolve to a local thumbnail; unavailable items are explicit rather than fabricated.
- [ ] Ninetales and Alolan Ninetales have different battle keys, sources, types, abilities, learnsets, and Singles/Doubles defaults.
- [ ] Missing/invalid upstream data falls back to the last valid snapshot or an explicit unavailable state; it is never fabricated.

The live probe depends on a third party. A network outage blocks data-related production promotion but must not be “fixed” by weakening deterministic unit tests.

## 4. Domain and team legality regression

- [ ] AP accepts 0–32 per stat and total ≤66; 33/67 are rejected.
- [ ] All 21 supported natures show their increased/decreased stats; neutral nature states no change.
- [ ] Mega Charizard X and Garchomp golden final-stat fixtures pass.
- [ ] A team accepts 0–6 members and never hides or overwrites member seven.
- [ ] Duplicate non-null items are rejected; null items may repeat.
- [ ] Base + Mega is rejected.
- [ ] Sibling Mega branches such as Mega X + Mega Y are rejected.
- [ ] Mega Pokémon from different species families remain legal together.
- [ ] Every Mega form is locked to its dedicated stone.
- [ ] Selecting a Mega Stone on a base form updates sprite, name, types, abilities, base stats, matchups, final stats, and legality identity.
- [ ] Singles and Doubles teams remain independent and persist through switching.
- [ ] Editing a team member restores its exact saved fields, saves in the same slot with the same member ID, does not change the team count, and does not falsely conflict with its own Pokémon or held item.
- [ ] Editing cannot move a member between Singles and Doubles; genuine duplicate-family, duplicate-item, Mega-Stone, move, ability, and AP errors still block save.

## 5. Catalog and recommendation regression

- [ ] Pokémon and Move catalogs expose all results through pagination, including the real final page.
- [ ] Counts and page totals are derived from current data rather than hard-coded.
- [ ] Pokémon name search does not match type text.
- [ ] Type OR/AND, form, ability, multiple known moves, and minimum-stat filters work in combination.
- [ ] Move type/category/target/property/priority filters work in combination.
- [ ] Pokémon-detail learnsets expose the same five move filters, filtered/total count, clear/empty states, and only legal moves for that form.
- [ ] Pokémon-detail learnsets default to category → type → descending priority → properties → target, with name used only as a final tie-breaker.
- [ ] Move and Ability eligible-Pokémon counts sort numerically and open complete reverse lookup.
- [ ] Reverse lookup supports name, Type OR/AND, Form, Ability, additional known moves, minimum stats, and clear/empty states.
- [ ] Reverse lookup sorts by name/type/ability/all six stats in both directions; move lookups default to same-move-type first, then type and Pokémon name.
- [ ] Reverse results use the Pokémon DB-style table; header sorting and sort controls stay synchronized, and mobile horizontal scrolling keeps the Pokémon column sticky.
- [ ] Pokémon detail shows form-specific learnsets, abilities, matchups, and both battle formats.
- [ ] Current-season move/item/ability entries open canonical tooltips; moves show their visible type badge and unmapped rows remain readable.
- [ ] Held-item thumbnails appear beside item names in the Item DB, Pokémon battle usage, builder selection preview, Mega transformation message, floating team tray, and Speed Compare selection preview.
- [ ] The same held-item thumbnail appears in both a tooltip trigger and its tooltip heading; a failed image remains readable through the neutral fallback.
- [ ] Singles/Doubles usage defaults apply the highest-ranked legal item, ability, nature, AP spread, and four unique learnable moves.
- [ ] Illegal, duplicated, or unmapped usage rows are skipped instead of forced into the build.
- [ ] Each builder move slot supports localized/English name and effect-text search, common-move-first ordering, visible type/category/Power/Accuracy/priority/effect information, clearing, and duplicate-move prevention.

## 6. Browser and responsive QA

Required for interaction, layout, responsive, or CSS changes. Check at 390, 768, and 1440 CSS pixels; commercial release candidates also run Chromium, Firefox, and WebKit.

- [ ] Keyboard focus, Escape, mouse, and touch behavior work for tooltips and dialogs.
- [ ] English and Traditional Chinese critical flows do not clip or lose state.
- [ ] In `zh-Hant`, every listed Pokémon/form name is the official Traditional Chinese name; no Pokémon name is machine translated or left in English.
- [ ] In `zh-Hant`, all move, ability, and held-item names and descriptions are Chinese on database rows, detail dialogs, battle-usage rows, and tooltips; none silently reuse the English description.
- [ ] `pnpm data:audit:zh` confirms every Chinese description is derived from the exact effective Champions English mechanic, preserves every numeric token, multiplier, rounding rule, trigger threshold, and single-use condition, and contains no broken placeholder or unapproved English residue.
- [ ] Every legal move name exactly matches the pinned Traditional Chinese game-string source; PokeAPI locale labels are treated only as community-maintained candidates, and every entity name retains per-record provenance.
- [ ] The known Gen 8/9 regressions—including `毒千針`, `秘劍・千重濤`, `潑冷水`, `噴射拳`, `掃墓`, `鎧農炮`, and `下壓踢`—contain no Simplified Chinese characters.
- [ ] Chinese descriptions and fixed UI terms contain no Simplified Chinese; official Traditional Chinese entity spellings are not rewritten merely to satisfy OpenCC lexical preferences.
- [ ] Type, category, target, property, ability-category, item-category, effect-class, and sortable table labels switch to Chinese without changing filter semantics.
- [ ] Localization completeness tests fail when a legal catalog entry lacks Chinese content or when a Chinese description equals its English source.
- [ ] The team tray can scroll through all six complete cards.
- [ ] Builder and detail dialogs remain within the viewport.
- [ ] Builder move pickers work by keyboard, mouse, and touch; only one field menu needs focus at a time, Escape closes it, and its independently scrollable results are not clipped at 390, 768, or 1440 px.
- [ ] At 390 px, detail move filters expand/collapse cleanly, chip rows scroll horizontally, and battle-usage tooltips open by touch.
- [ ] At 390, 768, and 1440 px, item thumbnails do not clip, distort, obscure labels, or create unintended horizontal page scrolling.
- [ ] The 18×18 type chart is complete.
- [ ] The floating chart scrolls horizontally and vertically.
- [ ] The attack column stays sticky during horizontal scrolling.
- [ ] The defense header stays sticky during vertical scrolling.
- [ ] Type badges use readable high-contrast text.
- [ ] Mobile hides the floating chart and exposes the standalone chart page.
- [ ] No tooltip, menu, or dialog is clipped behind a table or floating tray.

## 7. Security, accessibility, and performance

- [ ] Unknown IDs cannot become arbitrary upstream URLs.
- [ ] Upstream calls use a fixed host, an explicit timeout, and a bounded response body.
- [ ] Item sprite downloads use the pinned PokeAPI sprites revision, validate PNG type/signature/size, and publish atomically.
- [ ] Runtime item rendering uses local `/items/...` assets only and never fetches a third-party URL per render or hover.
- [ ] JSON write endpoints reject non-JSON and oversized request bodies before schema validation.
- [ ] Authenticated write endpoints reject missing or cross-origin `Origin` headers.
- [ ] Admin APIs reject unauthenticated and unauthorized requests before database access.
- [ ] No secret, access token, auth header, or private user data is committed or logged.
- [ ] `pnpm audit --prod --audit-level=moderate` reports no known production dependency vulnerabilities.
- [ ] Dependency, license, secret, and static-security scans pass for a commercial release candidate.
- [ ] Critical pages have no critical/serious axe findings.
- [ ] Critical journeys work keyboard-only with focus restoration.
- [ ] Catalog, detail, filtering, and team interactions remain within agreed performance budgets.
- [ ] Attribution, unofficial notice, privacy, terms, and consent controls are present as required by the release scope.

## 8. Exact artifact and production promotion

- [ ] Commit the exact source that passed all applicable gates.
- [ ] Confirm `.openai/hosting.json` is selected for production and `.openai/hosting.dev.json` was not packaged accidentally.
- [ ] Push that exact commit to the Sites source branch.
- [ ] Build/package only from that commit; do not edit source afterward.
- [ ] Save one immutable Sites version and deploy that saved version.
- [ ] Wait for an explicit `succeeded` deployment status.
- [ ] For automated data refreshes, update the open `deployment-required` Issue with the deployed URL and close it only after the smoke test passes.
- [ ] Verify the production URL with an authenticated browser or authorized smoke-test credential when the site is access-controlled; anonymous HTTP 401 alone is not a valid functional smoke test.

Production smoke test:

- [ ] Home and `/type-chart` load.
- [ ] Pokémon, Move, Ability, Held Item, and Speed Compare navigation works.
- [ ] Ninetales reports `battleDataKey=ninetales`.
- [ ] Alolan Ninetales reports `battleDataKey=ninetalesalola`.
- [ ] Their usage-based builds are visibly different and form-correct.
- [ ] Singles/Doubles teams, Mega transformation, reverse lookup, pagination, and chart scrolling work.
- [ ] Record deployed URL, version, commit SHA, test summary, and known limitations for UAT.

## 9. Current hardening gaps

The following remain required before claiming the full commercial-readiness Definition of Done in `PROJECT_SPEC.md`:

- Automated Chromium/Firefox/WebKit E2E suite
- Automated sticky-header and real-scroll assertions
- axe accessibility gate
- Dependency, secret, SAST, and isolated-staging ZAP gates
- Performance/load budgets and k6 suite
- Authenticated post-deployment smoke automation
- Scheduled live form-contract audit
- Enforced coverage thresholds

Do not describe these as passed until their tools and reports actually exist.
