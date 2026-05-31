# Making SparkyFitness My Own — Roadmap & Progress Tracker

*Owner: dcohen115 · Branch convention: `claude/<slug>` feature branches*

This is the cross-session tracking document for the personal customization of
SparkyFitness. It outlines three workstreams. Update the **Status** checkboxes
and the **Session Log** at the bottom as work lands so a fresh session can pick
up where the last one left off.

---

## Workstream A — Peptide tracker on the phone app (mobile port)

**Goal:** Bring the custom peptide / injection tracker (already built for the
web app + server) into `SparkyFitnessMobile/` with a UI that mirrors the web
experience: current-level cards, a half-life decay chart, injection logging,
and a compact summary card on the Diary screen.

**Backend status:** ✅ Already complete. No server changes are needed — the
mobile app talks to the existing routes mounted at `/api/peptides`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/peptides` | List peptides |
| POST | `/api/peptides` | Create peptide |
| PUT | `/api/peptides/:id` | Update peptide |
| DELETE | `/api/peptides/:id` | Delete peptide |
| GET | `/api/peptides/levels` | Current estimated level for all peptides |
| GET | `/api/peptides/:id/series` | Decay time-series for charting |
| GET | `/api/peptides/:id/injections` | Injection history |
| POST | `/api/peptides/:id/injections` | Log an injection |
| DELETE | `/api/peptides/injections/:injectionId` | Delete an injection |

Response shapes are defined by the web client at
`SparkyFitnessFrontend/src/api/Peptides/peptideService.ts` (`Peptide`,
`Injection`, `PeptideLevel`, `LevelSeriesResponse`). The mobile types mirror
these exactly.

### Mobile files (this workstream)

- `src/types/peptides.ts` — shared peptide types + `HALF_LIFE_PRESETS`.
- `src/services/api/peptidesApi.ts` — API client (uses shared `apiFetch`).
- `src/hooks/usePeptides.ts` — React Query hooks (levels, list, series,
  injections) + mutations (create/delete peptide, log/delete injection).
- `src/hooks/queryKeys.ts` — peptide query keys.
- `src/components/PeptideLevelChart.tsx` — victory-native decay line chart.
- `src/components/PeptideSummary.tsx` — Diary landing-page summary card.
- `src/screens/PeptidesScreen.tsx` — full peptides screen (cards + chart +
  history + add/log modals).
- Wiring: `src/components/Icon.tsx` (peptides icon), `src/types/navigation.ts`
  (route), `App.tsx` (register screen), `src/screens/LibraryScreen.tsx`
  (Create tile + Browse row entry point), `src/screens/DiaryScreen.tsx`
  (summary card).

### Status

- [x] API client + types
- [x] React Query hooks + query keys
- [x] `PeptidesScreen` (cards, chart, injection history, add/log modals)
- [x] `PeptideSummary` card wired into Diary
- [x] Library entry points (Create tile + Browse row)
- [x] Navigation + App.tsx registration + icon
- [x] Tests (api client, summary card)
- [x] `pnpm run validate` (typecheck + lint) clean and full `jest` suite green
      (2280 tests / 144 suites) on 2026-05-31

### Known follow-ups / parity gaps

- **Backdating injections:** the web form lets you pick an arbitrary
  date/time (`<input type="datetime-local">`). The first mobile cut logs at
  *now* (server default) to avoid pulling in a native date-time picker
  dependency. Add `@react-native-community/datetimepicker` later if backdating
  is needed.
- **Edit peptide:** web exposes create + delete from the screen; editing
  (`PUT /api/peptides/:id`) is wired in the API/hooks layer but not yet
  surfaced in the mobile UI. Add an edit modal when desired.
- **Per-peptide color:** `color` is carried through the types but the mobile
  chart uses the theme accent. Wire `color` into the chart/cards for parity.

---

## Workstream B — Build & install the iOS app (sideload IPA)

**Goal:** Get the app (with the peptide feature) onto an iPhone, ideally via a
sideloaded `.ipa` so an App Store / TestFlight round-trip isn't required for
personal use.

The app is Expo SDK 54 + React Native 0.81 and is wired for **EAS Build**
(`SparkyFitnessMobile/eas.json`). There is already an App Store Connect app id
on the `production` submit profile.

### Options

1. **EAS `preview` build → install link (recommended for personal use).**
   ```bash
   cd SparkyFitnessMobile
   npm i -g eas-cli && eas login
   eas build --platform ios --profile preview   # distribution: internal
   ```
   `preview` uses `distribution: internal`, producing an ad-hoc / internal
   build installable on devices registered to the Apple Developer account.
   Requires a paid Apple Developer account ($99/yr) and registering the
   device UDID.

2. **EAS `production` → TestFlight.**
   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios --profile production
   ```

3. **True sideload of an `.ipa`** (e.g. AltStore / Sideloadly with a free
   Apple ID). Build an unsigned/ad-hoc archive, then sideload. Free-account
   sideloads expire every 7 days and have entitlement limits — note that the
   app uses **HealthKit**, **app groups**, and **widgets**, which a free
   personal team can be flaky with. A paid account + EAS internal build is the
   smoother path.

### Pre-flight notes

- Production builds **reject plain `http://` server URLs** — the self-hosted
  server must be reachable over **HTTPS**.
- Run `npx expo prebuild -c` after any native change before building.
- Point the app at the server in Onboarding (URL + login or API key).

### Status

- [ ] Apple Developer account / signing decided (paid vs free sideload)
- [ ] First `preview` build produced
- [ ] Installed on device, connected to server, peptide feature verified

---

## Workstream C — Apple Watch companion (future / scoping)

**Goal (aspirational):** Log workout sets/reps and run rest timers from the
watch.

**Reality today:** There is **no watchOS app**. The only native Apple targets
are two iOS home-screen widgets (`SparkyFitnessMobile/targets/widget/`). The
watch currently only contributes **passively** — workouts recorded on the
Apple Watch land in Apple Health and are pulled in by the phone app's HealthKit
sync. There is no on-wrist UI.

A real watch app is a separate, larger effort:

- New native **watchOS target** (Expo doesn't scaffold this out of the box —
  likely a custom config plugin or bare native target under `targets/`).
- **`WatchConnectivity`** bridge to sync session state between phone and watch.
- Decide scope: full on-watch set/rep logging + rest timer, vs. a lighter
  complication / "active workout" glance that mirrors the phone's
  `activeWorkoutStore` rest timer.

The phone-side rest timer already exists (`stores/activeWorkoutStore.ts`,
`ActiveWorkoutBar`, `services/notifications.ts`) and would be the data source
to mirror.

### Status

- [ ] Decide scope (full logging vs. glance/complication)
- [ ] Spike a watchOS target + WatchConnectivity bridge
- [ ] Mirror `activeWorkoutStore` rest timer to the watch

---

## Session Log

- **2026-05-30** — Created this plan. Built Workstream A (peptide mobile port):
  types, API client, hooks, `PeptidesScreen`, `PeptideSummary` card, Library +
  Diary + navigation wiring, icon, and tests. Validation against an installed
  workspace + the IPA build (Workstreams B) remain.
