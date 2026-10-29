# Plan: QA fixes and low-hanging improvements

_Refs: UI test run 2026-10-29 (Playwright, Berlin → Lisbon and Reykjavik trips) · client brief "Demo" and "guarantees" · `plans/planning-core.md` (rule compile, run lifecycle) · `plans/trip-screens.md` (request form, day editor)_

## Overview

The UI test passed every demo step except one guarantee: a hard rule was saved with its check flipped, so "No red-eye flights" kept red-eye flights and removed daytime ones. The read-back sentence still said the right thing, so the traveller had no way to see it. This plan makes a flipped rule impossible to save, fixes three small UI/run bugs, and adds the cheap quality items a reviewer will look for: tests on the pure guarantee code, a standalone architecture overview, and no secrets in tracked files. Nothing here changes the data model or the agent's tools.

## Acceptance criteria

- [x] **AC-1** (standing: hard constraints remove, preferences rank) — A rule is saved only if its check agrees with worked examples the compiler gives with it. For a hard rule: at least one example the rule must keep and one it must remove. For a preference: at least one it must match and one it must not. Every example is run through the real evaluator (`evaluateRule`). Any disagreement counts as a validation error and goes into the existing single retry. If the retry still disagrees, nothing is saved and the traveller sees the existing "couldn't turn this into a rule" error.
  _Check:_ save "No red-eye flights" ten times on a fresh profile; every saved rule keeps a 14:35 flight and removes a 22:45 one.
- [x] **AC-2** — The compiler prompt shows one full worked example of a hard rule, with the test JSON beside its summary. The example demonstrates the polarity: the test describes the entry that is **kept**.
- [x] **AC-3** — The profile read-back shows the compiler's examples under the summary: "Keeps: … · Removes: …" for a hard rule, "Prefers: … · Not preferred: …" for a preference. The traveller sees what the rule does with real-looking options, not only what the model says it does.
  _Check:_ "No red-eye flights" reads like "Keeps: flight departing 14:35 · Removes: flight departing 22:45".
- [x] **AC-4** — On the trip request form, turning WhatsApp opt-in off clears the "number required" error straight away and re-enables "Plan my trip". Turning it on with an empty number shows the error again.
- [x] **AC-5** — In the day editor, a removed item stays in the list as a struck-through row with an "Undo" button until the day is saved or cancelled. Undo puts the item back. Saving sends only the items still marked removed.
- [x] **AC-6** — In "Rules applied", a rule that removed more than 5 options lists the first 5, then "and N more" as a toggle that expands the full list.
- [x] **AC-7** (standing: background run) — A plan saved through `save_plan` before the run's deadline is written to the trip even if the deadline passes while the agent is still finishing its turn. A run fails with `timeout` only when no saved or salvageable plan exists when the deadline passes.
- [ ] **AC-8** — `pnpm test` runs a unit test suite (Vitest, Node environment) with no database or model calls. It covers:
  - `evaluateRule` and `isRuleInScope`: a time window wrapping midnight, a missing field failing closed, `not` keeping an unknown as unknown;
  - the AC-1 example check, including a flipped red-eye rule being rejected;
  - `CreateTripReqSchema`: past start, end before start, over the maximum days, opt-in without a number, origin equal to destination;
  - plan validation (`validatePlan`): an unknown ref, a hard-constraint violation, and a "why" citing a preference the entry doesn't match.
- [x] **AC-9** — `docs/architecture.md` exists as the brief's "generated architecture overview". It contains:
  - a Mermaid component diagram (browser → Nitro → controllers → repos → Postgres, plus pg-boss worker, Deep Agent, Twilio);
  - a Mermaid sequence diagram of one run: request → ack → job → tools → `save_plan` → `finishRun` → WhatsApp;
  - a table mapping each brief guarantee (background run, no invented facts, constraints respected, nothing booked) to the code that enforces it;
  - the stack choices with one line of "why" each.

  `README.md` links to it.
- [x] **AC-10** — No tracked file contains a real credential. `.env.example` keeps every key with an empty value.
- [ ] **AC-11** — `pnpm lint`, `pnpm type-check` and `pnpm test` pass.

## Architecture

### How the rule self-check works (AC-1 – AC-3)

Example: the traveller saves **"No red-eye flights"** (hard rule, transport).

1. The compiler model returns what it returns today (test JSON + summary) **plus examples**: small catalogue-shaped entries with the expected outcome.

   | Example entry | Expected |
   |---|---|
   | flight, departs 14:35 | kept |
   | flight, departs 22:45 | removed |
   | train, departs 23:10 | kept |

2. Code runs each example through `isRuleInScope` + `evaluateRule`, the same functions the planner uses.
3. The rule from the first UI test, `any[mode ≠ flight, departs between 22:00–05:59]`, says the 14:35 flight is removed and the 22:45 one kept. That is two mismatches, so the rule is rejected and the model retries with the errors: `example "flight, departs 14:35": expected kept, rule removes it`.
4. The corrected rule, `any[mode ≠ flight, not(departs between 22:00–05:59)]`, matches all three. It is saved together with its examples.

The model could be wrong in its examples too. But a flipped polarity shows up as a disagreement between the examples and the test, and that is exactly the failure we saw. The examples are stored, so the read-back (AC-3) shows them to the traveller as the second safeguard.

Where it lives:
- `server/controllers/knowledge-graph/compileFactRule/compileFactRule.ts`:
  - `CompileOutputSchema` gets `examplesJson` (a JSON string, like `testJson`);
  - a new `checkExamples(rule, examples, kind)` runs next to `checkNextDayArrival`, and its errors go into `parseTest`'s list.
- The example entries are validated against `RULE_FIELDS[scope.kind]`, the same field list the prompt uses. An unknown field is a validation error.
- `compileFactRulePrompt.ts` gets the AC-2 worked example and the examples instruction.

### Schema changes

- `profile_facts.rule_examples jsonb null`: the stored examples. `null` for unenforceable facts and for rows saved before this change. Migration via `pnpm db:migration:generate`.
- `FactResSchema` gets `ruleExamples` (nullable), which `FactReadBack.vue` renders.

### Other fixes

| AC | Where | Change |
|---|---|---|
| AC-4 | `app/pages/components/TripRequestForm.vue` | `watch(() => state.whatsappOptIn, …)` → `form.validate({ name: ['whatsappNumber'], silent: true })`, the same pattern as the date watcher already there |
| AC-5 | `useDayEditor.ts`, `TripPlanDayItem.vue` | `restoreItem(id)` removes the id from `removedItemIds`; the item renders struck-through with an Undo button while its id is in the draft's removed list |
| AC-6 | `PlanAside.vue` | first 5 names plus an "and N more" toggle; `formatNames` is reused |
| AC-7 | `runPlanTripJob.ts` | when `runWithDeadline` rejects with the timeout `RunStop`, fall through to the existing `settled` / `salvageLastAttempt` block. Throw `timeout` only if no draft results |

### Reuse — do not reimplement

- `evaluateRule` / `isRuleInScope` (`server/utils/rules/evaluateRule.ts`): the example check must call these, never a copy.
- `validateRule` / `collectLeaves` (`server/utils/rules/validateRule.ts`) for the field and operator checks on examples.
- The retry loop in `compileFactRule`: example errors join it; no second loop.

## Key decisions

- **The model writes the examples, code checks them.** Generating examples from the real catalogue would need a catalogue query at save time and still couldn't say which outcome is *right*. Only the meaning of the text can say that, and only the model reads text.
- **Examples are stored and shown.** Showing them costs one column and makes a wrong rule visible to the traveller, which a summary sentence can't.
- **Tests only on pure functions.** They are fast and deterministic, and they are where the guarantees live. No DB or e2e harness in this pass.

## Non-goals

- Re-compiling rules already saved before this ships. The QA profile can re-save its rule by hand.
- Cutting `search_catalogue` token use (paging, dropping descriptions). It is worthwhile, but it changes agent behaviour and needs its own run comparison.
- Removing the non-null assertions in run code and splitting `salvagePlan`. Cosmetic, with risk out of proportion to the gain.
- Changing `NUXT_PUBLIC_APP_URL` in `.env.local`. It's a local setup issue: the local value must match the dev server's port, or WhatsApp links open the wrong app.

## Blockers & dependencies

- **AC-10 needs the user:** rotate the Twilio auth token in the Twilio console. The value was in an uncommitted change and has not been pushed, but treat it as exposed.

## Decisions taken

- **AC-8 dropped (no tests): Vitest, test files and `pnpm test` are not added** — the user stopped it mid-build ("please no tests"); AC-11 is therefore `pnpm lint` + `pnpm type-check` only, both clean (AC-8, AC-11)
- **Example check lives in `checkRuleExamples.ts`, not inside `compileFactRule.ts`** — pure module, no agent-service import (AC-1)
- **Example outcome follows the planner's scope rule: out-of-scope counts as kept (hard) / not preferred (preference)** — otherwise a correct food rule with a non-food example would be rejected (AC-1)
- **Examples are checked only once the test itself validates; their errors join the existing single retry** — no second loop (AC-1)
- **`evaluateRule`/`isRuleInScope` take `TRuleSubjectEntry` (kind, priceAmount, attributes) instead of the full catalogue entry** — lets save-time examples run through the one evaluator without casting; catalogue entries still fit (AC-1)
- **Read-back wording is built in code from the stored fields (`formatRuleExample`, labels added to `RULE_FIELDS`), never from model text** — the traveller sees what the stored examples actually are (AC-3)
- **Opt-in toggle re-validates the number only once its error has been shown** — ticking opt-in on a fresh form doesn't flash an error before the traveller typed (AC-4)
- **New icon `undo-2` (Lucide) for the Undo button** (AC-5)
- **A timed-out run with a saved or salvageable draft finishes `ready`; `nothingPlannable` aborts still fail** — the timeout `RunStop` is caught by reason only (AC-7)
- **Plan page vertical spacing unified to `gap-6` (page stack, plan column, trip-wide gaps list, grid, aside)** — user request during the build, outside the ACs
- **Planner day titles are replaced every run (`setPlannerDayTitle`, was `fillTripDayTitle`) and cleared when the new plan gives none; traveller titles untouched** — a title only describes the plan that wrote it (verify finding)
- **"Not in catalogue" reasons are corrected in code (`correctReasons`), only towards "a rule removed it"** — a gap whose relevant candidates all exist but are excluded becomes `all_excluded`; a wish naming a city whose legs a rule removed becomes `excluded_by_rule`. Applied in `validatePlan`'s build, so salvaged plans get it too (verify finding)
- **Prompt: say all_excluded when a search note says so; one unmetRequests entry per wish** — the agent's why text can't be corrected by code, and a merged wish can only carry one reason (verify finding)

## Verify

- Re-run the UI test's demo flow: profile with "No red-eye flights" and "Vegetarian", a 4-day Berlin → Lisbon trip, edit a day, re-plan, then a Reykjavik failure. The plan has daytime flights only. "Rules applied" lists only flights departing 22:00–05:59 as removed.
- Opt-in on/off toggle on the request form (AC-4). Remove + undo in the day editor (AC-5).

### Findings (live run 2026-10-29, Playwright + real model calls)

- **AC-1 ✓** — "No red-eye flights" saved 10× (1 UI edit + 9 API creates): all 10 compiled to the same correct test (`not between 22:00–05:59`). Caveat: the model copies the prompt's worked example (test *and* examples) verbatim, so for this exact text the few-shot is doing the work; the example check is what protects other wordings.
- **AC-1 ✓ (unseen wording)** — "Nothing with more than one stop, and we must land before 21:00" compiled correctly with 5 sensible examples (kept: 1 stop/20:45; removed: 21:30, 2 stops, overnight 00:30).
- **AC-3 ✓ then reverted** — read-back showed "Keeps: … · Removes: …"; during the run `FactReadBack.vue` was reverted on disk to the summary-only version by a concurrent edit (callers still pass `kind`/`domain`/`ruleExamples`). Decide whether AC-3 stays.
- **AC-3 copy** — example text reads awkwardly for some fields: "1 stops", "not arrives next day".
- **Re-plan (Berlin → Lisbon) ✓** — 46 s, `ready`; flights TAP 14:35 (arr 18:08, direct) and Wizz 15:45 (arr 19:18, direct). Red-eye now removes 13 flights incl. Wizz W65371 22:45 (the flipped rule had removed 58 and kept it).
- **AC-4 ✓** — opt-in on + empty number → error, submit disabled; off → error gone, submit enabled; on again → error back.
- **AC-5 ✓** — two items removed (struck rows with Undo), one undone, saved: only the other has `removed_at` set.
- **AC-6 ✓** — "…and 8 more" expands to the full list, "Show fewer" collapses.
- **AC-7 not driven** — needs a run that hits the deadline after `save_plan`.
- **Fixed: stale planner day title** — Day 2 kept "Day trip to Sintra" after a re-plan with no Sintra items; `fillTripDayTitle` only fills empty titles, so a planner-written title (`title_set_by_traveller = false`) is never replaced.
- **Fixed: wrong "not in catalogue" reason** — Sintra trains were removed by the stops hard rule (`stops: 2`), yet the plan says "“visit Sintra”: there's no such option in our catalogue", the day gap says "Transport: none in the catalogue" and an item's why says "no Sintra options were found in the catalogue". The agent's unmet/gap reason isn't checked against the run's exclusions.
- **Minor** — the date-range popover heading reads "Event date, October - November 2026"; a profile confirmation once showed a stale "Added… Best effort" mid hot-reload (not reproducible after reload).
- **Fix check (2 live re-plans)** — Day 2 retitled "Alfama and Graça sights" (traveller's "Slow Saturday" kept); unmet now `not_in_catalogue` "see a fado show one evening" + `excluded_by_rule` "visit Sintra". The first re-plan merged both wishes into one entry, which the reason then mislabelled; fixed by asking for one entry per wish.
