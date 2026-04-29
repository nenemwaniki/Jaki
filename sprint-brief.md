# Jaki — Demo Sprint Brief
**Date:** 30 April 2026 · One-day sprint for mentor demo

---

## What is already done (do not redo)

The prototype UI is feature-complete and merged to `main`. Every screen exists, is interactive, and builds cleanly.

| Done | Detail |
|---|---|
| Multi-page Vite build | `index.html` landing page → `jaki.html` (caregiver) + `arthur.html` (Arthur's phone) as independent deployable apps |
| localStorage sync | Both apps share store state across browser tabs in real-time |
| Arthur sends messages | Tapping an AAC card pushes an unread `FeedItem` to Jaki's feed |
| Arthur marks routine done | Tapping a step marks it done, auto-promotes next step, feeds Jaki's timeline |
| Live clock | Arthur's phone shows real time and day name |
| SOS button | Hold-to-trigger on Arthur's phone fires SOS overlay on Jaki's side |
| Dark mode | Full token swap across all screens, Settings toggle works |
| Contacts validation | Name + Role required before saving |
| Code quality | Unused aliases removed, version string updated, `.gitignore` in place |

---

## What the mentors need to see tomorrow

Mentors care about three things: **real data, real device, real flow**.  
The prototype already has the flow. Tomorrow is about plugging in the data and getting it on a phone.

### Priority 1 — Must have for demo (do these first)
These are what turn "looks nice" into "this could ship".

**1A. Supabase backend — replace seed data**
- Install `@supabase/supabase-js`
- Create a `src/lib/supabase.ts` client using `SUPABASE_URL` + `SUPABASE_ANON_KEY` from `.env.local`
- Replace `SEED` in `src/data.ts` with real queries from these four tables: `users`, `events`, `locations`, `notifications`
- Add loading skeletons (a simple spinner is enough — use the existing `T.line` color)
- Add error boundaries so a failed fetch shows a message, not a blank screen
- **Files to touch:** `src/data.ts`, `src/lib/supabase.ts` (new), `src/App.tsx`, `src/screens/Home.tsx`

**1B. Supabase Auth — Jaki's login screen**
- Add a login screen (email + password) before the main app renders
- On successful login, store the session and proceed to the dashboard
- On logout (Settings), clear the session and return to login
- Gate all Supabase queries behind the authenticated session
- **Files to touch:** `src/screens/Login.tsx` (new), `src/App.tsx`, `src/types.ts`, `src/lib/supabase.ts`

**1C. Capacitor Android build — get it on the emulator**
- Run `npm install @capacitor/core @capacitor/cli @capacitor/android`
- Run `npx cap init "Jaki" "com.hackcessible.jaki" --web-dir dist`
- Run `npm run build && npx cap add android && npx cap sync android`
- Open in Android Studio: `npx cap open android`
- Build and run on `Hackcessible_Pixel6` emulator (API 33)
- Fix any plugin or manifest issues that come up
- **Files to touch:** `capacitor.config.ts` (new), `android/` folder (generated)

---

### Priority 2 — Strong to have (do these if Priority 1 is done by midday)
These make the demo memorable.

**2A. Real-time location — Arthur's pin on the map**
- Replace the decorative SVG map in `screens/Location.tsx` with an iframe embed of Google Maps (or a Mapbox static map) centred on a coordinate stored in the `locations` table
- Subscribe to Supabase Realtime on the `locations` table — update the pin when a new row arrives
- Showing the pin move on screen during the demo is the moment that lands
- If the Maps API key is not ready, use a Mapbox static image URL — it requires no SDK
- **Files to touch:** `src/screens/Location.tsx`

**2B. Real-time feed — Supabase Realtime on notifications**
- Subscribe to the `notifications` table in Supabase Realtime
- When a new row arrives (e.g. an SOS event from the watch firmware), push it into `store.feed` and trigger the SOS overlay
- This means a hardware event on the M11 watch can trigger a visual alert on Jaki's phone live in front of the mentors — that is the wow moment
- **Files to touch:** `src/App.tsx`, `src/lib/supabase.ts`

---

### Priority 3 — Nice but skip if time is short
These can be shown as "coming in v2" — mentors understand scope.

| Task | Why it can wait |
|---|---|
| Push notifications (FCM) | Requires physical device, Google Play services, and a working FCM backend. Hard to demo reliably on an emulator. Show the in-app SOS overlay instead. |
| iOS build | No Apple Developer account needed for the demo — Android is enough |
| M11 Timekeeper / Caregiver app | Separate repo, separate session — do not mix with this session |
| Laptop Monitor offline queue | Not visible in a 5-minute mentor demo |
| Private npm package publishing | Internal tooling — mentors will not see this |

---

## Sprint session plan

### Before you open the laptop (15 min)
Collect from Supabase dashboard and write to `jaki/.env.local` (never commit this file):
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
Verify the four tables exist in Supabase: `users`, `events`, `locations`, `notifications`.  
If they don't exist, create them now — do not wait.

Check Android Studio is installed and `ANDROID_HOME` is set:
```bash
adb --version          # must return a version
node --version         # must be >=18
```

### Morning block (09:00–12:00) — Backend + Auth
1. `npm install @supabase/supabase-js`
2. Create `src/lib/supabase.ts`
3. Wire `src/data.ts` to real Supabase queries
4. Build the Login screen
5. Gate the app behind auth

Checkpoint: Open `jaki.html` in browser, log in with a real Supabase user, see real data.

### Midday block (12:00–14:00) — Capacitor + Android build
1. Install Capacitor packages
2. `npx cap init` + `npx cap add android`
3. `npm run build && npx cap sync android`
4. Fix any issues in Android Studio
5. Run on emulator

Checkpoint: App launches on `Hackcessible_Pixel6`, login works, feed loads.

### Afternoon block (14:00–17:00) — Realtime + map (if time allows)
1. Wire Supabase Realtime on `locations` → update map pin
2. Wire Supabase Realtime on `notifications` → trigger SOS overlay
3. Polish: loading states, error messages, any broken UI on small screen

Checkpoint: Trigger a Supabase INSERT on `notifications` manually from the dashboard — SOS overlay fires on the phone.

### Evening (17:00–demo) — Dress rehearsal
Run through the demo flow twice:
1. Jaki logs in
2. Feed shows Arthur's activity
3. Map shows Arthur's location
4. Simulate an SOS (INSERT into `notifications` from Supabase dashboard)
5. SOS overlay fires — Jaki calls Arthur

---

## Token budget rules for tomorrow's Claude Code session

- **One terminal, one session** — do not open Claude Code for M11 in the same window
- **Give exact file paths** in every message — never say "find the file", say "edit `src/lib/supabase.ts` line 12"
- **Run `/compact` every 25 messages** — this is a long sprint
- **Paste terminal errors verbatim** — do not describe them
- **Batch tasks** — give 2–3 related tasks per message, not one at a time
- **Use Gemini for boilerplate** — Capacitor config, AndroidManifest patches, FCM setup → Gemini Pro, not Claude

Gemini prompts ready to copy-paste (saves ~3k tokens each):

> **Capacitor init boilerplate:**  
> "Generate a complete `capacitor.config.ts` for a React + Vite app named 'Jaki' with bundle ID `com.hackcessible.jaki`, web dir `dist`, targeting Android API 33. Include the `@capacitor/push-notifications` plugin entry."

> **Supabase Realtime hook:**  
> "Write a React `useEffect` hook that subscribes to Supabase Realtime on a table called `notifications`, filters for `INSERT` events, and calls a callback with the new row payload. Use `@supabase/supabase-js` v2."

> **Google Maps static embed:**  
> "Write a React component that renders a Google Maps Static API image centred on a given `lat`/`lng` prop, zoom 15, 600×400, with a red marker at that coordinate. Use the API key from `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`."

---

## Definition of done for the demo

The mentor demo is successful when a mentor can watch this flow live on the emulator with no manual data seeding:

- [ ] Jaki opens the app on the Android emulator — login screen appears
- [ ] Jaki logs in with email/password — dashboard loads with real data from Supabase
- [ ] Feed shows at least one real event from the `notifications` table
- [ ] Map shows Arthur's location from the `locations` table
- [ ] A team member runs an INSERT on Supabase dashboard → SOS overlay fires on Jaki's screen within 2 seconds
- [ ] Arthur's phone (open in a browser tab) taps a message card → item appears unread in Jaki's feed on the emulator
- [ ] No `.env.local` or keystore in `git log --all -- .env.local` (run this before demo)

---

*Last updated: 29 April 2026 — written for the Hackcessible 2026 Group 1&2 mentor demo sprint*
