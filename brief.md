# Jaki — Project Brief

## What this is

**Jaki** is a caregiver companion app prototype for a young adult with autism (Arthur). It is a dual-phone UI built in React + Vite:

- **Jaki's phone** (390×812, light) — the caregiver's view: activity feed, routine management, screen-time limits, safe-zone location, contacts, and AAC (augmentative communication) message history.
- **Arthur's phone** (260×540, dark) — a simplified companion phone showing: home app grid, contacts, quick-message cards, and today's routine.

Both phones share a single in-memory `Store` object (see `src/types.ts` and `src/data.ts`). Arthur's phone reacts live to changes Jaki makes.

---

## Current state

All screens exist and are functional at a prototype level:

| Screen | File | Status |
|---|---|---|
| Home (dashboard) | `screens/Home.tsx` | Complete |
| Launcher (app grid + library) | `screens/Launcher.tsx` | Complete |
| Messages (AAC cards) | `screens/Messages.tsx` | Complete |
| Contacts | `screens/Contacts.tsx` | Complete |
| Location (map + zones) | `screens/Location.tsx` | Complete |
| Activities (routine) | `screens/Activities.tsx` | Complete |
| Limits (screen time) | `screens/Limits.tsx` | Complete |
| Settings | `screens/Settings.tsx` | Complete |
| Arthur's phone | `components/ArthurPhone.tsx` | Complete (4-page swipe) |

---

## What is left to do

### 1. Make each app independently deployable

**Problem:** Right now `App.tsx` renders both phones side-by-side in one layout. There is no way to open only Arthur's phone or only Jaki's phone independently (e.g. on separate devices, or as separate Vercel/Netlify deploys).

**Tasks:**

- Extract `ArthurPhone` into its own standalone entry point (`src/arthur.tsx` + `arthur.html`) with its own shared store (localStorage or URL-param seeded).
- Extract Jaki's phone into its own entry point (`src/jaki.tsx` + `jaki.html`).
- Update `vite.config.ts` to build both as separate HTML outputs (multi-page build).
- Add a landing/index page (`index.html`) that links to both apps with a brief description.
- The two apps can stay in sync via `localStorage` + `storage` events (same-origin), or via a simple polling mechanism against a tiny JSON file, so changes on one reflect on the other in real-time without a backend.

### 2. Arthur's phone — missing interactions

The Arthur phone is read-only and mostly decorative. Key gaps:

- **Quick messages don't update Jaki's feed.** Tapping a message card flashes green but nothing appears in `store.feed`. Wire the `sendCard` callback to push a new `FeedItem` into the shared store.
- **Routine items are not tappable.** Arthur should be able to tap a routine step to mark it done — this should reflect in the Activities screen on Jaki's side.
- **No SOS gesture.** The prototype has a demo button on Jaki's side rail. Arthur's phone should have a visible shake/long-press SOS button that triggers the SOS overlay on Jaki's side.
- **Home greeting is hardcoded.** "Good morning, Arthur" and "Tue · ☀ 24°C" are static strings — wire these to `new Date()`.

### 3. Jaki's phone — polish gaps

- **Location map is purely decorative.** The geofence ring and Arthur's pin do not respond to zone toggle states. When a zone is toggled off, the map should visually reflect it.
- **Screen time data is static.** `used` minutes in `src/data.ts` never increment. A simple `setInterval` (e.g. +1 min every 60s on the active/unlocked app) would make the limits screen feel live.
- **Settings dark mode is wired but does nothing.** The `dark` prop is passed but no tokens or backgrounds change. Either implement the dark token set or remove the toggle.
- **Contacts add/edit form exists but does not validate.** The inline form in `screens/Contacts.tsx` saves empty records if fields are blank.
- **`setScreen` navigation quirk:** Side-rail tabs (Contacts, Activities, Limits) sit outside the phone chassis. On small screens or when Arthur's phone is hidden, these buttons overlap the phone. Move the side rail into the phone or add overflow handling.

### 4. Code quality / before handoff

- Remove `_s` and `_c` unused-variable aliases (e.g. `setStore: _s` in Settings, `contacts: _c` in Home) — use proper omission or pass only what is needed.
- `src/data.ts` uses Unicode symbol icons (▶ ☏ ✉) which render inconsistently across OSes. Replace with SVG icon paths already in `src/icons.tsx`.
- Add a `<title>` to `index.html` (currently just "Vite + React + TS").
- Version string in Settings footer says "v0.4 · Hackcessible 2026" — update to match actual milestone.

---

## Delegation guide for Gemini

The tasks below are well-scoped, self-contained, and do not require deep context of the full codebase. Good candidates to delegate:

### Task A — Multi-page Vite build (standalone apps)
> **Files to touch:** `vite.config.ts`, `index.html`, create `arthur.html`, `jaki.html`, `src/arthur.tsx`, `src/jaki.tsx`
>
> Make the project build two independent HTML apps: one for Arthur's phone and one for Jaki's phone. Each should import the shared `Store` type and seed from `src/data.ts`. Sync state between them using `localStorage` and the `storage` event. Use Vite's [multi-page build](https://vitejs.dev/guide/build#multi-page-app) pattern (`build.rollupOptions.input`). The root `index.html` should become a simple link page.

### Task B — Arthur sends messages to Jaki's feed
> **Files to touch:** `src/components/ArthurPhone.tsx`, `src/types.ts`, `src/data.ts`
>
> When Arthur taps a quick-message card, push a new `FeedItem` (type `'aac'`) to `store.feed`. The `ArthurPhone` component currently receives only `store` (read-only). Pass `setStore` as a second prop. The new feed item should have `read: false` so Jaki sees the unread badge.

### Task C — Arthur marks routine steps done
> **Files to touch:** `src/components/ArthurPhone.tsx`
>
> On the Routine page of Arthur's phone, make each non-done step tappable. Tapping a step should call `setStore` to advance it to `'done'`. If it was `'current'`, the next `'next'` step should become `'current'`. This mirrors how the Activities screen works on Jaki's side.

### Task D — Live clock and date on Arthur's phone
> **Files to touch:** `src/components/ArthurPhone.tsx`
>
> Replace the hardcoded `"9:41"` and `"Tue · ☀ 24°C"` strings. Use `useState` + `useEffect` + `setInterval` (1-second tick) to show the real time. The weather can stay static (no API needed) but the day name and time should be live.

### Task E — Contacts form validation
> **Files to touch:** `src/screens/Contacts.tsx`
>
> Before saving a new contact, check that `name` and `role` fields are non-empty. If either is blank, show a red inline error message (no external library needed — just a `useState` error string rendered below the field). Do not save the contact until valid.

### Task F — Dark mode token set
> **Files to touch:** `src/tokens.ts`, `src/screens/Settings.tsx`, and any screen that uses `T.*` tokens
>
> Implement a dark variant of the `T` token object. When `dark === true`, swap backgrounds (`T.bg`, `T.surface`, `T.line`, etc.) to dark equivalents. The cleanest approach: make `T` a function of `dark: boolean` and thread `dark` down via React context so screens don't need an extra prop.

---

## Tech stack summary (for Gemini context)

- **React 19** + **TypeScript** + **Vite**
- **No CSS files** — all styling is inline `style` objects using design tokens from `src/tokens.ts`
- **No external component library** — all UI primitives live in `src/ui.tsx`
- **No routing library** — screen switching is a `useState<ScreenId>` in `App.tsx`
- **No backend** — all data is in-memory (`Store` object), seeded from `src/data.ts`, persisted only in `localStorage` for the current screen
- **Icons** — custom SVG path strings in `src/icons.tsx`, rendered via `<Icon path={...} />`
