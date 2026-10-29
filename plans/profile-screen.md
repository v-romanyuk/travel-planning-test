# Plan: Profile screen — knowledge graph view and editing

_Refs: client brief (PoC Travel Planning PDF) · design canvas "Trip Planner prototype" (https://claude.ai/artifact/5NeKwsuj4TJwjDn7Kqomdp — board "Profile and knowledge graph") · `app/pages/profile.vue` · `plans/planning-core.md` · `plans/trip-screens.md`_

## Overview

The traveller sees their knowledge graph on the web — themselves, their companions, the party, and every hard rule and preference with how the planner read it — and edits it: add, edit and remove facts, add and remove companions, change the home city. Built on the existing knowledge-graph API; adds one endpoint for the home city.

## Acceptance criteria

Each criterion is a rule for any user and profile. The `Check:` line is one way to verify it in a browser on the local stack, signed in as the demo user (`olena@local.test`, password in the README).

**Graph view**

- [x] **AC-1** — The page shows "Your travel profile", the intro "The planner reads only what's stored here. It never adds a rule or preference on its own.", and the legend: Hard rule (solid line) removes options, Preference (dashed line) ranks options.
- [x] **AC-2** — "Who travels and what matters to them" shows one row per node, in this order: Everyone (the party), the traveller, then each companion in the order they were added. Each row shows the node's initials, its name as stored, its role line, and the facts whose subject is that node, in the order they were added. A fact whose subject is changed moves to its new node.
  _Check:_ the demo user shows Everyone, Olena Kovalenko, Taras.
- [x] **AC-3** — Role lines use first names (the first word of each name): Everyone lists them all ("Olena and Taras", "Olena, Taras and Ivan"; "Just you" with no companions); the traveller reads "You, the traveller"; a companion reads "Travels with <traveller's first name>". Everyone's initials are the first letters of up to three people joined with "+" (e.g. "O+T").
- [x] **AC-4** — Each fact card shows the text as stored, "Hard rule for <area>" or "Preference for <area>" (area in lowercase: stay, food, transport), and a read-back line: "Read as: <summary>" for a checked fact, or a "Not checked" badge with "Can't be checked automatically: <note>" for an unenforceable one. Hard rules and preferences are told apart by the solid vs dashed connector, not by colour alone.
  _Check:_ "No red-eye flights" reads "Read as: Removes flights departing 22:00–05:59".
- [x] **AC-5** — A node with no facts shows "Nothing stored yet."
  _Check:_ Taras in the seed.

**Adding and editing facts**

- [x] **AC-6** — "Add to your profile" has Applies to (Everyone on the trip, "<traveller> (you)", each companion), Area (Stay, Food, Transport), Type (Hard rule — "Options that break it are never suggested"; Preference — "Matching options are ranked higher") and "What is it?". "Add to profile" is disabled until "What is it?" has text.
- [x] **AC-7** — While a fact is being saved, the button reads "Checking…" and is disabled; the save can take up to about 40 seconds without the page treating it as failed.
- [x] **AC-8** — After a successful add, the fact appears under its node, the form clears "What is it?", and the card shows "Added. The planner uses it the next time it plans." followed by the same read-back line the fact card shows. The confirmation stays until the user types in the form or starts editing a fact.
  _Check:_ add the hard rule "Vegetarian" for Taras (Food).
- [x] **AC-9** — A fact the catalogue can't check is saved and shown with the "Not checked" badge and its note, both on its card and in the confirmation.
  _Check:_ "No hotels near the airport" (Stay).
- [x] **AC-10** — When the check fails, nothing is saved, the server's message appears on the "What is it?" field, and everything typed stays in the form.
  _Check:_ set an invalid model key and add a fact.
- [x] **AC-11** — The edit button on a fact card loads it into the right-hand card, which becomes "Edit" with "Save" and "Cancel", and highlights that fact card. Only one fact is edited at a time: choosing edit on another fact while there are unsaved changes asks "Discard changes?" first. Edit buttons are disabled while a save is checking. Removing the fact being edited, or its companion, leaves edit mode. At phone width, choosing edit scrolls to the form and focuses "What is it?"; Save or Cancel scrolls back to the fact card.
- [x] **AC-12** — "Save" is disabled until something differs from the stored fact. Saving updates the fact's text, area, type or subject, returns the card to "Add to your profile", and shows "Saved. The planner uses it the next time it plans." with the fact's read-back; when the text, area or type changed, the read-back shows the new reading. "Cancel" returns the card to "Add to your profile" with nothing changed.
- [x] **AC-13** — Removing a fact asks "Remove '<text>'?" first; confirming removes it from the page and from storage; cancelling changes nothing.

**Companions**

- [x] **AC-14** — "Add a companion" (name + Add) under the graph adds a new row with "Nothing stored yet." and the person as a new "Applies to" option; the trip request form lists them the next time it opens. An empty name shows "Enter a name" on the field; Add is disabled while saving, and a failure shows the server's message as a toast.
- [x] **AC-15** — Each companion node has a remove button; it asks "Remove <name>?", saying how many of their rules and preferences will be removed with them. Confirming removes the person and those facts.
- [x] **AC-16** — A removal the server refuses (a companion on a trip: "<name> is on a trip, so they can't be removed."; a fact or person already gone) closes the confirmation, shows the server's message as a toast, and changes nothing. The traveller has no remove button. Duplicate companion names and duplicate fact texts are allowed without a warning.

**Home city**

- [x] **AC-17** — The "Home city" card shows the user's current home city in a city picker, with "Every trip starts here unless you pick another starting point when you plan." "Save home city" is enabled only after a different city is picked.
- [x] **AC-18** — "Save home city" is disabled while saving; a failure shows the server's message as a toast and keeps the picked city. Saving shows "Saved. New trips start from here."; the trip request form's "Starting from" then defaults to the new city without a reload; existing trips keep their origin; a reload still shows the new city.

**Shared state**

- [x] **AC-19** — After any change on the page, the graph shows exactly what is stored: reloading the page shows the same nodes, facts and read-back lines. If a change succeeds but refreshing the graph fails, the page keeps what it showed and says so in a toast. If the first load fails, the page shows the server's message with "Try again", which re-loads the graph.

**Standing: any UI surface**

- [x] **AC-20** (standing: any UI surface) — Loading, empty and error states each render a distinct, readable surface — never a blank region, a bare spinner with no context, or a silent failure.
- [x] **AC-21** (standing: any UI surface) — Every failure the user can cause is surfaced to them — inline on the field/region that caused it, or via a `useToast()` toast carrying the server's message, not a generic one.
- [x] **AC-22** (standing: any UI surface) — No caught error at an async or mutation boundary is swallowed by an empty `catch` — it is either shown to the user or rethrown so it reaches the console/server log.
- [x] **AC-23** (standing: any UI surface) — Every interactive control is reachable by keyboard, and focus is visible on it.
- [x] **AC-24** (standing: any UI surface) — Copy is English and uses the product's terms — the same words the rest of the app uses for the same thing (trip, day, stay, place, transport, planned). Nothing reads as booked, reserved, confirmed or paid.
- [x] **AC-25** (standing: any UI surface) — The surface works at phone width (375px) with no horizontal page scroll — the traveller opens it from a WhatsApp link.

**Standing: table / list screen** (nodes and fact cards)

- [x] **AC-26** (standing: table / list screen) — Order is stable and meaningful (days by date/position, items by time/position) and survives a reload.
- [x] **AC-27** (standing: table / list screen) — Row actions (edit / remove) take effect without a full page reload, and destructive ones ask for confirmation first.
- [x] **AC-28** (standing: table / list screen) — Long values truncate or wrap rather than widening the layout.

**Standing: form** (add/edit fact, add companion, home city, confirm modals)

- [x] **AC-29** (standing: form) — Every validation rule fires on the field that caused it, with a message naming what to fix.
- [x] **AC-30** (standing: form) — Client validation matches the server's Zod Req schema — anything the server rejects shows its message on the form.
- [x] **AC-31** (standing: form) — Submit is blocked while the form is invalid, and the reason is visible without submitting.
- [x] **AC-32** (standing: form) — A failed submit preserves everything the user typed.
- [x] **AC-33** (standing: form) — Submitting twice quickly does not create two records (or start two agent runs).
- [x] **AC-34** (standing: form) — Closing a modal/slideover with unsaved changes warns, or the change is already persisted.

**Standing: detail page / slideover** (knowledge-graph view)

- [x] **AC-35** (standing: detail page / slideover) — The record's identity (trip destination + dates, person name) is visible without scrolling.
- [x] **AC-36** (standing: detail page / slideover) — Every section renders with real data, including the ones the feature did not change.
- [x] **AC-37** (standing: detail page / slideover) — A record that cannot be loaded (unknown or malformed id) shows why, using the backend's message rather than a generic alert.
- [x] **AC-38** (standing: detail page / slideover) — Edits are persisted and survive a reload.

## Architecture

### How it works

The page loads `GET /api/knowledge-graph` through the shared FE knowledge-graph service and groups the nodes by `applies_to` edges into rows: party, traveller, then companions in API order. A page composable owns loading, the mutations and toasts. After every successful mutation it re-loads the graph and replaces what's shown, so the screen never merges responses by hand.

Adding a fact posts `CreateFactReqSchema` (subject `null` for Everyone). The ~40 s worst case must fit the host's request timeout (Fly); the build confirms Fly's proxy limits before relying on it. The server checks the subject, runs the save-time rule step (up to two model calls of 20 s each), and writes one row. The FE keeps the form disabled with "Checking…" and sets no client timeout below 45 s. On a 502 the server's message goes to the "What is it?" field and the form keeps its values. A saved fact shows up in the re-read graph; there is no separate confirmation and no fact editing. Fact and companion removal go through `AppConfirmModal`. The companion confirm counts that person's facts from the loaded graph. A 409 for a companion on a trip shows the server's message as a toast.

The home city is saved with the new `PATCH /api/me`. The server validates `homeCity` with `CitySchema`, updates `users.home_city` for the signed-in user, and returns `UserResSchema`. The FE writes that response into `useAuthStore().user`, so the trip request form's default origin follows it. Trips store their own origin and are unaffected.

### Screen layout

Placement follows the design board **Profile and knowledge graph**, plus the four approved additions.

- **Header** — "Your travel profile", the intro, the Hard rule / Preference legend.
- **Main column: "Who travels and what matters to them"** — one row per node (Everyone, traveller, companions), each with the node on the left and its fact cards on the right. A card holds the text, kind + area, the read-back line or "Not checked" badge, and edit and remove buttons. Companion nodes have a remove button. Under the last row: "Add a companion" (name + Add) · `PersonNode`, `ProfileFactCard`, `UInput`, `UButton`, `AppConfirmModal`.
- **Side column, card 1: "Home city"** — explainer, city picker, "Save home city", saved status · `CitySelect`, `UButton`.
- **Side column, card 2: "Add to your profile" / "Edit"** — Applies to, Area, Type (two described radio options), "What is it?", the primary button (Add to profile / Save, showing "Checking…" while saving), Cancel in edit mode, the confirmation with read-back · `UForm`, `UFormField`, `USelect`, `URadioGroup`, `UInput`, `UButton`.
- **Phone width** — the side column stacks below the main column.

### Schema changes

None.

### API contract

```ts
// PATCH /api/me — change the signed-in user's home city
UpdateMeReqSchema = z.object({ homeCity: z.object(CitySchema.shape, { error: 'Choose your home city' }) })   // same wrapping as SignUpReqSchema
// 200 → UserResSchema { id, email, fullName, homeCity: CitySchema, createdAt }

// Existing, consumed as is:
// GET    /api/knowledge-graph                 → KnowledgeGraphResSchema { nodes: (person | party | fact)[], edges: { from, to, type: 'member_of' | 'applies_to' }[] }
//        fact node: { id, type: 'fact', kind: EPreferenceKind, domain: EPreferenceDomain, value, ruleStatus: ERuleStatus, ruleSummary: string | null, ruleNote: string | null }
// POST   /api/knowledge-graph/people          CreatePersonReqSchema { name } → 201 PersonResSchema { id, name, role }
// DELETE /api/knowledge-graph/people/:personId → 204 · 400 traveller · 409 "<name> is on a trip, so they can't be removed."
// POST   /api/knowledge-graph/facts           CreateFactReqSchema { subjectPersonId: uuid | null, kind, domain, value } → 204
// DELETE /api/knowledge-graph/facts/:factId   → 204
// rule step failures → 502 with message ("We couldn't check this right now…" / "We couldn't turn this into a rule…")
```

### Reuse — do not reimplement

- The knowledge-graph API, routes and controllers (`server/api/knowledge-graph/**`, `server/controllers/knowledge-graph/`), including `compileFactRule` and its error messages.
- `KnowledgeGraphResSchema`, `CreatePersonReqSchema`, `PersonResSchema`, `CreateFactReqSchema`, enums `EPersonRole`, `ERuleStatus`, `EPreferenceKind`, `EPreferenceDomain` (`shared/schemas/knowledge-graph/`); `CitySchema` (`shared/schemas/cities/`); `UserResSchema` (`shared/schemas/users/`).
- `usersRepo` (`server/repos/`). Add an update method there for the home city, not a new repo.
- `PersonNode`, `ProfileFactCard` (`app/components/profile/`), extended, not duplicated (the card's `subject` suffix isn't used here, because the row shows the subject). `KitProfile` (`app/pages/ui-kit/components/`) updated to show a checked card, a "Not checked" card, the editing highlight, an empty node and companion remove.
- `CitySelect`, `AppConfirmModal` (`app/components/`); `useModals` (`app/features/platform/modals/`); `useAuthStore` (`app/store/auth.store.ts`); `useAuthErrorMessage` (`app/composables/`) for reading `FetchError.data.message`.
- The FE knowledge-graph service (`app/services/knowledge-graph.service.ts`, created by the trip-screens build with the read call). This plan adds the add, edit and remove calls to it. No shared store: the trip request form re-loads companions when it opens.

## Key decisions

- **The design board is the layout source**, with four additions: read-back lines, fact editing, companion add and remove, and Home city instead of a street address (the catalogue only knows cities).
- **Each fact card shows the planner's reading of it**: "Read as" or "Not checked". This is where the traveller sees, and fixes, how free text became a rule.
- **Editing happens in the side card**, so there's one form for add and edit. A misread rule is fixed in place instead of deleted and re-added.
- **Re-load after every change**: the graph is small, and the screen always equals storage.
- **Confirm before removing**, unlike the design's one-click ×, because removal can't be undone and a companion takes their facts with them.
- **Slow saves are normal**: the rule step can take ~40 s, so the UI waits with "Checking…" instead of timing out.
- **Home city edit via `PATCH /api/me`**: new trips default to it, and old trips keep their own origin.

## Non-goals

- Renaming people, or editing the traveller's name or email.
- A street-level home address.
- Choosing a rule from a list or editing the stored rule directly. The traveller only edits the text.
- Showing which trips used a fact.
- From the standing *table / list* block: "Every column marked sortable actually sorts" and "Search/filters … visibly reduce the row set" are dropped, because the graph has no sorting or filters.
- From the standing *detail page* block: AC-35's "identity" here is the page title and the traveller's row. AC-37 reads as the profile failing to load, since there's no id in the URL; that case is covered by AC-19's "Try again".

## Blockers & dependencies

None. The knowledge-graph API is implemented (`plans/planning-core.md`). The FE knowledge-graph service exists from the trip-screens build, which is in progress.

## Decisions taken

- **Fly proxy fits the ~40 s save** — Fly's proxy closes a request after ~60 s without a response; no `fly.toml` change, and `$fetch` gets no client timeout (AC-7)
- **Page moved to `app/pages/profile/index.vue`** — same route name `profile`; gives the page its own `components/`, `composables/` and `profile.store.ts` like `trips/` (layout)
- **Page-scoped `useProfileStore`** holds the graph, the form draft, the fact being edited and the last confirmation, so the graph column and the side card share them without prop drilling; reset on every visit (AC-11, AC-19)
- **Entering edit stashes the "Add" form and Save/Cancel restore it** — so "Discard changes?" only fires for unsaved edits of another fact, and nothing typed into "Add" is lost (AC-11, AC-32)
- **Person initials = first letter of first + last word** ("Olena Kovalenko" → "OK"), one letter for a one-word name (AC-3)
- **Defaults of the add form**: Applies to Everyone, Area Stay, Type Preference (AC-6)
- **"What is it?" reserves two lines for its error** — the server's rule-step messages don't fit the one-line slot (AC-10, AC-21)
- **Server errors on save**: Zod issues go to their fields; anything else (502, 404) goes on "What is it?" (AC-10, AC-30)
- **Remove buttons stay enabled while a save is checking**, except on the fact being saved; edit buttons are all disabled (AC-11)
- **A refused removal doesn't re-read the graph** — the toast says why and the page stays as shown (AC-16)
- **Companion remove copy** counts hard rules and preferences separately ("Their 1 hard rule and 2 preferences will be removed with them.") (AC-15)
- **Phone-width scroll uses the `lg` breakpoint** (side column stacks below 1024 px), not 375 px (AC-11)
- **Schema messages that name the fix**: `CreateFactReqSchema.value` max → "Keep it under 300 characters", min → "Describe the rule or preference"; `CreatePersonReqSchema.name` max → "Keep the name under 100 characters" (AC-29)
- **"Saved. New trips start from here."** is the home-city field's help line, so it doesn't shift the card; it clears when a different city is picked (AC-18)
- **A fact code can't check reads "Best effort", not "Not checked"** (changes the AC-4/AC-9 copy) — the planner still applies such facts by reading each option, so "Not checked" wrongly suggested they're ignored. The card says "We can't check this one automatically, so it's less reliable. The planner will still do its best to follow it." The compiler's `ruleNote` names catalogue fields, so it stays in the API and is no longer shown (AC-4, AC-9)
- **Facts can't be edited on the profile, only removed** (supersedes the edit criteria) — a changed fact is removed and added again. The card is the title with the remove button on its first line, then "Hard rule / Preference for …", then the read-back, all at full width. `PATCH /api/knowledge-graph/facts/:id` stays in the API, unused by the screen
- **The read-back shows only "Read as: <summary>"** — the compiler's worked examples ("Prefers: … · Not preferred: …") read as noise on the card; they still run as the save-time self-check (AC-4)
- **A party of three or more shows "<traveller's initial>+<companion count>"** (e.g. "M+3") on the Everyone node, since three letters overflow the avatar; two people still show "M+A"

## Verify

Runs last, after every build slice is done.

An orchestrator session: a fresh sub-agent drives the **entire** `## Acceptance criteria` list in a browser against the local stack, blind to the diff; a second reviews the whole branch; then one fix agent per finding. Findings are appended below before anything is fixed.

### Findings

_(populated during verify)_
