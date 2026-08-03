# Champions Lab Deployment Checklist

> Purpose: prevent regressions before product-owner UAT or a Sites production deployment.  
> Applies to: every release from this repository.  
> Last updated: 2026-08-03 (Asia/Taipei)

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
- [ ] Warnings were reviewed and no new high-risk warning was introduced.
- [ ] No test was skipped, focused, or weakened to make the gate pass.

## 3. Data and upstream mapping gate

Required when any of these change:

- `scripts/sync-upstream.mjs`
- `scripts/audit-form-integrity.mjs`
- `data/generated/champions-snapshot.json`
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
- [ ] Singles/Doubles usage defaults apply the highest-ranked legal item, ability, nature, AP spread, and four unique learnable moves.
- [ ] Illegal, duplicated, or unmapped usage rows are skipped instead of forced into the build.

## 6. Browser and responsive QA

Required for interaction, layout, responsive, or CSS changes. Check at 390, 768, and 1440 CSS pixels; commercial release candidates also run Chromium, Firefox, and WebKit.

- [ ] Keyboard focus, Escape, mouse, and touch behavior work for tooltips and dialogs.
- [ ] English and Traditional Chinese critical flows do not clip or lose state.
- [ ] The team tray can scroll through all six complete cards.
- [ ] Builder and detail dialogs remain within the viewport.
- [ ] At 390 px, detail move filters expand/collapse cleanly, chip rows scroll horizontally, and battle-usage tooltips open by touch.
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
- [ ] Push that exact commit to the Sites source branch.
- [ ] Build/package only from that commit; do not edit source afterward.
- [ ] Save one immutable Sites version and deploy that saved version.
- [ ] Wait for an explicit `succeeded` deployment status.
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
