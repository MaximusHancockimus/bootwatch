# BootWatch — Build Plan

A step-by-step build plan for the BootWatch MVP. Each step has substeps so we can track exactly where we are. When a step is complete, mark it with `[x]`.

> **How to use this file**: After finishing a substep, we say something like *"Step 1.2 is done. Moving to step 1.3."* This keeps us aligned and prevents scope creep mid-step.

---

## Step 1: Project Scaffold & Navigation Shell

Get the Expo project initialized with the core navigation structure and theming in place. After this step, the app launches and you can tap between empty tab screens.

- [ ] **1.1** — Initialize Expo project with TypeScript template
- [ ] **1.2** — Install core dependencies (React Navigation, React Native Maps, Expo Notifications, Supabase JS client, etc.)
- [ ] **1.3** — Set up bottom tab navigation with four tabs: **Map**, **Timer**, **Feed**, **Profile**
- [ ] **1.4** — Create placeholder screens for each tab with basic styling
- [ ] **1.5** — Define the app color palette, typography, and shared theme constants (dark/urgent reds for boot alerts, greens for safe zones)
- [ ] **1.6** — Verify the app runs cleanly on Expo Go (iOS and/or Android)

**Checkpoint**: App launches, four tabs are visible and tappable, each shows its placeholder name. No functionality yet.

---

## Step 2: Complex Directory & Map Screen

Build the map view centered on Rexburg with complex data rendered as markers. This is the first screen users see and what gives the app content on day one.

- [ ] **2.1** — Create the complex data model/type definitions (name, coordinates, time limit, booting company, signage quality, risk level)
- [ ] **2.2** — Build a seed data file with 10-15 real Rexburg apartment complexes (placeholder data — you'll replace with real research later)
- [ ] **2.3** — Render the map centered on Rexburg (approx. 43.826, -111.789) with markers for each complex
- [ ] **2.4** — Tapping a marker opens a bottom sheet / modal with the complex details (name, time limit, booting company, risk badge)
- [ ] **2.5** — Add a search/filter bar at the top of the map screen to find a complex by name
- [ ] **2.6** — Style the markers with color coding (red/yellow/green) based on risk level

**Checkpoint**: Map loads centered on Rexburg. Colored markers show apartment complexes. Tapping one shows its parking rules and booting company. You can search by name.

---

## Step 3: Parking Timer

Build the parking timer — the core day-one value feature. A user picks a complex (or sets a custom time) and gets push notifications before their time expires.

- [ ] **3.1** — Build the Timer screen UI: complex selector dropdown, countdown display, start/cancel buttons
- [ ] **3.2** — Implement timer logic: countdown state, background-safe timer using Expo's task manager or notification scheduling
- [ ] **3.3** — Wire up the complex selector so choosing a complex auto-fills the timer duration from seed data
- [ ] **3.4** — Add a "Custom Timer" option for unlisted complexes (user manually enters minutes)
- [ ] **3.5** — Request and configure Expo push notification permissions
- [ ] **3.6** — Schedule local push notifications at 10 minutes remaining, 5 minutes remaining, and expiration
- [ ] **3.7** — Add a "quick start" flow: tapping "Park Here" from a complex detail (Step 2.4) navigates to the Timer screen with that complex pre-selected
- [ ] **3.8** — Handle edge cases: app backgrounded, app killed, timer already running, notification permissions denied
- [ ] **3.9** — Style the timer screen (large countdown, color shifts from green → yellow → red as time runs out)

**Checkpoint**: User can select a complex or set a custom time, start a timer, see a live countdown, and receive push notifications at 10min/5min/expired — even when the app is backgrounded.

---

## Step 4: Supabase Backend & Authentication

Set up the backend so user-generated data (spotter reports, saved complexes) can be stored and shared across users.

- [ ] **4.1** — Create a Supabase project and grab the API URL + anon key
- [ ] **4.2** — Create a Supabase config/client file in the app
- [ ] **4.3** — Design and create the database tables:
  - `profiles` — user ID, display name, saved complexes, push token
  - `complexes` — complex directory (mirrors seed data, but now in the DB)
  - `sightings` — boot truck reports (user ID, complex ID, coordinates, photo URL, timestamp)
- [ ] **4.4** — Set up Row Level Security (RLS) policies: anyone can read sightings/complexes, only authenticated users can insert sightings
- [ ] **4.5** — Implement auth flow: sign-up / sign-in screen with email (or phone if preferred)
- [ ] **4.6** — Build the Profile tab: show logged-in user info, saved complexes list, sign-out button
- [ ] **4.7** — Migrate the seed complex data from the local file to Supabase so the map and timer pull from the database
- [ ] **4.8** — Verify auth works end-to-end: sign up → sign in → see profile → sign out

**Checkpoint**: Users can create an account, sign in, and see their profile. Complex data is served from Supabase. Database tables are ready for spotter reports.

---

## Step 5: Boot Spotter Feed

Build the community-driven spotter feed — the viral growth engine. Users report boot truck sightings and see a live feed of reports.

- [ ] **5.1** — Build the Feed screen UI: chronological list of sighting cards (complex name, relative timestamp, optional photo thumbnail)
- [ ] **5.2** — Fetch sightings from the Supabase `sightings` table, ordered by most recent
- [ ] **5.3** — Build the "Report Sighting" flow: FAB button → modal/screen with complex picker, optional photo (Expo ImagePicker), and submit button
- [ ] **5.4** — Upload the photo to Supabase Storage and save the sighting row to the database
- [ ] **5.5** — Enable Supabase Realtime on the `sightings` table so new reports appear in the feed instantly without pull-to-refresh
- [ ] **5.6** — Add pull-to-refresh as a fallback
- [ ] **5.7** — Show sighting pins on the Map screen (Step 2) in addition to complex markers — use a distinct icon (e.g., warning triangle) with a time-decay (fade out after 2 hours)
- [ ] **5.8** — Style the feed: urgent color treatment, relative timestamps ("3 min ago"), empty state message encouraging the first report

**Checkpoint**: Users can report a boot truck sighting with a photo. Reports appear in the live feed and as pins on the map. New reports from other users stream in via realtime.

---

## Step 6: Spotter Push Notifications

Turn spotter reports into push notifications for relevant users. This is the "Booter seen at your complex!" alert that drives virality.

- [ ] **6.1** — On sign-up or from the Profile tab, let users save/follow specific complexes
- [ ] **6.2** — Store each user's Expo push token in the `profiles` table
- [ ] **6.3** — Create a Supabase Edge Function (or Database Webhook) that fires when a new sighting is inserted
- [ ] **6.4** — The function looks up all users who follow that sighting's complex and sends push notifications via Expo's push API
- [ ] **6.5** — Notification payload deep-links into the Feed screen or the specific sighting
- [ ] **6.6** — Add a notification preferences screen: toggle alerts on/off per saved complex
- [ ] **6.7** — Test end-to-end: User A follows "The Cove" → User B reports a sighting at "The Cove" → User A gets a push notification

**Checkpoint**: When someone reports a boot truck, all users following that complex receive a push notification. Users control which complexes they get alerts for.

---

## Step 7: Heat Map Visualization

Layer community report data onto the map as a risk visualization. This gets more valuable as data accumulates.

- [ ] **7.1** — Aggregate sighting counts per complex from the database (last 30 days)
- [ ] **7.2** — Update the map markers to dynamically color based on real sighting data (not just static seed risk levels)
- [ ] **7.3** — Add a map legend: red = high activity, yellow = moderate, green = low/no reports
- [ ] **7.4** — Add a toggle or tab on the map screen to switch between "Complexes" view and "Heat Map" view
- [ ] **7.5** — Show a summary stat when tapping a marker in heat map mode: "12 sightings in the last 30 days"
- [ ] **7.6** — Handle the empty state: if a complex has zero reports, show it as gray/neutral rather than green (green implies verified safety)

**Checkpoint**: The map has a heat map mode where complex markers are colored by real community data. Tapping shows sighting stats. New reports automatically update the colors.

---

## Step 8: Polish & Launch Prep

Final pass before putting the app in real users' hands.

- [ ] **8.1** — Design and build an onboarding flow (2-3 screens): what BootWatch does, request notification permissions, pick your home complex
- [ ] **8.2** — Add an app icon and splash screen
- [ ] **8.3** — Handle error states gracefully: no internet, location denied, empty feeds, failed uploads
- [ ] **8.4** — Performance pass: optimize map rendering, lazy-load feed images, cache complex data
- [ ] **8.5** — Write App Store / Google Play listing copy and screenshots
- [ ] **8.6** — Configure EAS Build for production builds
- [ ] **8.7** — Beta test with 10-20 friends, collect feedback, fix critical bugs
- [ ] **8.8** — Submit to App Store and Google Play

**Checkpoint**: App is polished, onboarding flows smoothly, production builds work, and the app is submitted to the stores.

---

## Quick Reference

| Step | What | Depends On |
|---|---|---|
| 1 | Project scaffold & navigation | Nothing |
| 2 | Complex directory & map | Step 1 |
| 3 | Parking timer | Step 1, Step 2 (for complex data) |
| 4 | Supabase backend & auth | Step 1 |
| 5 | Boot spotter feed | Step 4 |
| 6 | Spotter push notifications | Step 4, Step 5 |
| 7 | Heat map | Step 2, Step 5 |
| 8 | Polish & launch | All above |

---

*Last updated: March 9, 2026*
