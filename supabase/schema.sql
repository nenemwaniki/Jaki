-- =============================================================
-- Jaki — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → Run
-- Tables map 1-to-1 with src/types.ts and src/data.ts (SEED)
-- =============================================================


-- =============================================================
-- 0. EXTENSIONS & HELPERS
-- =============================================================

-- uuid_generate_v4() is available by default in Supabase.
-- No extension install needed.


-- =============================================================
-- 1. PROFILES
-- Extends the built-in auth.users table.
-- One row per user (caregiver OR patient).
-- Jaki logs in via Supabase Auth → a profile row is looked up.
-- =============================================================

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('caregiver', 'patient')),
  name        text not null,
  -- A caregiver profile stores the patient's id they are paired with.
  -- A patient profile leaves this null.
  patient_id  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;

-- Caregivers can read their own profile and the patient they are paired with.
create policy "profiles: read own and paired patient"
  on profiles for select
  using (
    auth.uid() = id
    or auth.uid() = (select patient_id from profiles where id = auth.uid())
    or id = (select patient_id from profiles where id = auth.uid())
  );

-- Users can only update their own profile.
create policy "profiles: update own"
  on profiles for update
  using (auth.uid() = id);


-- =============================================================
-- 2. CONTACTS
-- Maps to: Contact[] in types.ts
-- Contacts visible on Arthur's phone and managed by Jaki.
-- =============================================================

create table if not exists contacts (
  id          uuid primary key default uuid_generate_v4(),
  patient_id  uuid not null references profiles(id) on delete cascade,
  name        text not null,
  role        text not null,
  phone       text not null default '',
  color       text not null default '#87A878',   -- hex colour for avatar
  initials    text not null default '?',
  star        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table contacts enable row level security;

create policy "contacts: caregiver full access"
  on contacts for all
  using (
    patient_id = (select patient_id from profiles where id = auth.uid())
    or patient_id = auth.uid()
  );

create index on contacts (patient_id);


-- =============================================================
-- 3. APPS  (home grid)
-- Maps to: AppItem[] in types.ts
-- The apps on Arthur's home screen, with lock/limit settings.
-- =============================================================

create table if not exists apps (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references profiles(id) on delete cascade,
  name            text not null,
  icon            text not null,          -- single unicode character
  bg              text not null,          -- hex background colour
  color           text not null,          -- hex icon colour
  allowed         boolean not null default true,
  locked          boolean not null default false,
  limit_minutes   integer,                -- null = no limit
  used_minutes    integer not null default 0,
  sort_order      integer not null default 0,
  updated_at      timestamptz not null default now()
);

alter table apps enable row level security;

create policy "apps: caregiver full access"
  on apps for all
  using (
    patient_id = (select patient_id from profiles where id = auth.uid())
    or patient_id = auth.uid()
  );

create index on apps (patient_id);


-- =============================================================
-- 4. LIBRARY_APPS  (app library — not yet on home grid)
-- Maps to: LibraryApp[] in types.ts
-- =============================================================

create table if not exists library_apps (
  id          uuid primary key default uuid_generate_v4(),
  patient_id  uuid not null references profiles(id) on delete cascade,
  name        text not null,
  icon        text not null,
  color       text not null,
  reason      text not null default '',   -- shown to caregiver
  created_at  timestamptz not null default now()
);

alter table library_apps enable row level security;

create policy "library_apps: caregiver full access"
  on library_apps for all
  using (
    patient_id = (select patient_id from profiles where id = auth.uid())
    or patient_id = auth.uid()
  );

create index on library_apps (patient_id);


-- =============================================================
-- 5. ROUTINE_ITEMS  (daily schedule)
-- Maps to: RoutineItem[] in types.ts
-- State resets each day — 'done' | 'current' | 'next'
-- =============================================================

create table if not exists routine_items (
  id          uuid primary key default uuid_generate_v4(),
  patient_id  uuid not null references profiles(id) on delete cascade,
  emoji       text not null,
  title       text not null,
  note        text not null default '',
  time        text not null,             -- display string: "7:30", "10:00"
  dur         integer not null default 30,  -- duration in minutes
  state       text not null default 'next' check (state in ('done', 'current', 'next')),
  sort_order  integer not null default 0,
  routine_date date not null default current_date,
  created_at  timestamptz not null default now()
);

alter table routine_items enable row level security;

create policy "routine_items: caregiver and patient full access"
  on routine_items for all
  using (
    patient_id = (select patient_id from profiles where id = auth.uid())
    or patient_id = auth.uid()
  );

create index on routine_items (patient_id, routine_date);


-- =============================================================
-- 6. AAC_CARDS  (quick-message cards on Arthur's phone)
-- Maps to: MessagesLibrary { urgent, daily, social } in types.ts
-- =============================================================

create table if not exists aac_cards (
  id          uuid primary key default uuid_generate_v4(),
  patient_id  uuid not null references profiles(id) on delete cascade,
  category    text not null check (category in ('urgent', 'daily', 'social')),
  text        text not null,
  emoji       text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table aac_cards enable row level security;

create policy "aac_cards: caregiver and patient full access"
  on aac_cards for all
  using (
    patient_id = (select patient_id from profiles where id = auth.uid())
    or patient_id = auth.uid()
  );

create index on aac_cards (patient_id, category);


-- =============================================================
-- 7. ZONES  (geofence safe zones)
-- Maps to: Zone[] in types.ts
-- 'inside' is updated by the watch/location service in real-time.
-- =============================================================

create table if not exists zones (
  id          uuid primary key default uuid_generate_v4(),
  patient_id  uuid not null references profiles(id) on delete cascade,
  name        text not null,
  lat         double precision,           -- centre latitude  (null = demo/decorative)
  lng         double precision,           -- centre longitude (null = demo/decorative)
  radius      integer not null default 100,  -- metres
  color       text not null default '#87A878',
  active      boolean not null default true,
  inside      boolean not null default false,
  updated_at  timestamptz not null default now()
);

alter table zones enable row level security;

create policy "zones: caregiver full access"
  on zones for all
  using (
    patient_id = (select patient_id from profiles where id = auth.uid())
    or patient_id = auth.uid()
  );

create index on zones (patient_id);


-- =============================================================
-- 8. LOCATIONS  (Arthur's real-time position)
-- Maps to: Task 3 in sprint-brief.md
-- Subscribe to this table with Supabase Realtime for the live pin.
-- One row per ping — latest row = current position.
-- =============================================================

create table if not exists locations (
  id          uuid primary key default uuid_generate_v4(),
  patient_id  uuid not null references profiles(id) on delete cascade,
  lat         double precision not null,
  lng         double precision not null,
  accuracy    double precision,           -- metres
  source      text default 'gps',        -- 'gps' | 'network' | 'watch'
  created_at  timestamptz not null default now()
);

alter table locations enable row level security;

create policy "locations: caregiver and patient full access"
  on locations for all
  using (
    patient_id = (select patient_id from profiles where id = auth.uid())
    or patient_id = auth.uid()
  );

create index on locations (patient_id, created_at desc);

-- Convenience view: just the latest location per patient
create or replace view latest_locations as
  select distinct on (patient_id)
    id, patient_id, lat, lng, accuracy, source, created_at
  from locations
  order by patient_id, created_at desc;


-- =============================================================
-- 9. EVENTS  (watch firmware events from M11)
-- Maps to: events table referenced in m11/ brief
-- Heart rate, fall detection, SOS trigger, battery low, etc.
-- =============================================================

create table if not exists events (
  id          uuid primary key default uuid_generate_v4(),
  patient_id  uuid not null references profiles(id) on delete cascade,
  type        text not null check (type in (
                'heart_rate', 'sos_trigger', 'battery_low',
                'fall_detected', 'step_count', 'zone_enter',
                'zone_exit', 'app_open', 'routine_done'
              )),
  payload     jsonb not null default '{}',  -- flexible per event type
  -- heart_rate  → { bpm: 72 }
  -- sos_trigger → { zone: "Home", lat: -1.28, lng: 36.82 }
  -- battery_low → { pct: 12 }
  -- fall_detected → { severity: "moderate" }
  -- app_open    → { app: "YouTube", session_minutes: 12 }
  -- routine_done→ { item_id: "r3", title: "Creative Time" }
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table events enable row level security;

create policy "events: caregiver and patient full access"
  on events for all
  using (
    patient_id = (select patient_id from profiles where id = auth.uid())
    or patient_id = auth.uid()
  );

create index on events (patient_id, created_at desc);
create index on events (patient_id, type);


-- =============================================================
-- 10. FEED_ITEMS  (Jaki's activity feed — Home screen)
-- Maps to: FeedItem[] in types.ts
-- Written to whenever Arthur sends an AAC message, completes a
-- routine step, or an event arrives from the watch.
-- Subscribe to this with Supabase Realtime for the live feed badge.
-- =============================================================

create table if not exists feed_items (
  id          uuid primary key default uuid_generate_v4(),
  patient_id  uuid not null references profiles(id) on delete cascade,
  type        text not null check (type in ('aac', 'routine', 'location', 'app')),
  card        text,           -- AAC card text e.g. "I'm hungry"
  text        text,           -- other types e.g. "Finished breakfast"
  emoji       text not null,
  to_name     text,           -- AAC recipient e.g. "Jaki"
  meta        text,           -- extra info e.g. "12 min session"
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table feed_items enable row level security;

create policy "feed_items: caregiver full access"
  on feed_items for all
  using (
    patient_id = (select patient_id from profiles where id = auth.uid())
    or patient_id = auth.uid()
  );

create index on feed_items (patient_id, created_at desc);
create index on feed_items (patient_id, read);


-- =============================================================
-- 11. NOTIFICATIONS  (SOS + push notification log)
-- Maps to: AlertItem[] in types.ts  +  notifications table in brief
-- Written to when an SOS is triggered or a limit is exceeded.
-- Supabase Realtime on this table drives the SOS overlay in Jaki.
-- =============================================================

create table if not exists notifications (
  id           uuid primary key default uuid_generate_v4(),
  patient_id   uuid not null references profiles(id) on delete cascade,
  caregiver_id uuid references profiles(id),
  kind         text not null check (kind in ('sos', 'limit', 'zone', 'fall', 'heart_rate', 'battery')),
  detail       text not null,            -- human-readable e.g. "Shake gesture at Home"
  -- push notification fields
  push_title   text,
  push_body    text,
  push_sent    boolean not null default false,
  resolved     boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "notifications: caregiver full access"
  on notifications for all
  using (
    caregiver_id = auth.uid()
    or patient_id = (select patient_id from profiles where id = auth.uid())
    or patient_id = auth.uid()
  );

create index on notifications (patient_id, created_at desc);
create index on notifications (caregiver_id, resolved);


-- =============================================================
-- ENABLE REALTIME
-- Run these after creating tables.
-- Required for live location pin, feed badge, and SOS overlay.
-- =============================================================

-- In Supabase Dashboard → Database → Replication, enable these tables:
--   locations    ← Arthur's pin updates in real-time
--   feed_items   ← Jaki's feed badge updates instantly
--   notifications← SOS overlay fires in ≤2 seconds
--   events       ← Watch firmware events stream to caregiver app
--   routine_items← Jaki and Arthur see routine state changes live

-- Or run via SQL:
alter publication supabase_realtime add table locations;
alter publication supabase_realtime add table feed_items;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table routine_items;


-- =============================================================
-- HOW THIS MAPS TO src/types.ts
-- =============================================================
--
--  TypeScript type     → Supabase table
--  ─────────────────────────────────────────────────────────
--  Contact[]           → contacts
--  AppItem[]           → apps
--  LibraryApp[]        → library_apps
--  RoutineItem[]       → routine_items
--  FeedItem[]          → feed_items          ← Realtime ON
--  MessagesLibrary     → aac_cards
--  Zone[]              → zones
--  AlertItem[]         → notifications
--  (new) location ping → locations           ← Realtime ON
--  (new) watch event   → events              ← Realtime ON
--  (new) user/auth     → profiles (+ auth.users)
--
