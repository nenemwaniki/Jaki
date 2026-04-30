-- =============================================================
-- Jaki — Seed Data
-- Run AFTER schema.sql.
-- Mirrors src/data.ts (SEED) exactly so the app looks identical
-- whether it is running against localStorage or Supabase.
--
-- HOW TO USE:
--   1. Create a caregiver account via Supabase Auth
--      (Dashboard → Authentication → Users → Add user)
--      Email: jaki@hackcessible.dev   Password: demo1234
--   2. Create a patient account the same way:
--      Email: arthur@hackcessible.dev  Password: demo1234
--   3. Copy the UUIDs Supabase assigned to both users.
--   4. Replace the two variables below with those UUIDs.
--   5. Run this file in: Dashboard → SQL Editor → Run
-- =============================================================

-- ── Set these two UUIDs before running ──────────────────────
-- Replace with the actual UUIDs from auth.users after signup.
do $$
declare
  caregiver_uid uuid := 'REPLACE_WITH_JAKI_AUTH_UUID';
  patient_uid   uuid := 'REPLACE_WITH_ARTHUR_AUTH_UUID';
begin

-- =============================================================
-- PROFILES
-- =============================================================

insert into profiles (id, role, name, patient_id) values
  (caregiver_uid, 'caregiver', 'Jaki Mwangi', patient_uid),
  (patient_uid,   'patient',   'Arthur',       null)
on conflict (id) do nothing;


-- =============================================================
-- CONTACTS  (Arthur's people)
-- =============================================================

insert into contacts (id, patient_id, name, role, phone, color, initials, star) values
  ('c1000000-0000-0000-0000-000000000001', patient_uid, 'Jaki',      'Primary Caregiver',      '+254 712 004 001', '#C89B4A', 'J', true),
  ('c1000000-0000-0000-0000-000000000002', patient_uid, 'Dr. Susan', 'Doctor · AKU',           '+254 712 004 002', '#6F8FA8', 'S', false),
  ('c1000000-0000-0000-0000-000000000003', patient_uid, 'Amina',     'Occupational Therapist', '+254 712 004 003', '#8A6E8C', 'A', false),
  ('c1000000-0000-0000-0000-000000000004', patient_uid, 'Kevin',     'Friend',                 '+254 712 004 004', '#87A878', 'K', false),
  ('c1000000-0000-0000-0000-000000000005', patient_uid, 'Mum',       'Family',                 '+254 712 004 005', '#B86B5E', 'M', true)
on conflict (id) do nothing;


-- =============================================================
-- APPS  (home grid)
-- =============================================================

insert into apps (id, patient_id, name, icon, bg, color, allowed, locked, limit_minutes, used_minutes, sort_order) values
  ('a1000000-0000-0000-0000-000000000001', patient_uid, 'YouTube',  '▶', '#F3E1DC', '#B86B5E', true, false, 90,   47, 1),
  ('a1000000-0000-0000-0000-000000000002', patient_uid, 'Call',     '☏', '#EAF0E4', '#5E7C52', true, false, null, 12, 2),
  ('a1000000-0000-0000-0000-000000000003', patient_uid, 'Messages', '✉', '#F5EBD6', '#C89B4A', true, false, null, 8,  3),
  ('a1000000-0000-0000-0000-000000000004', patient_uid, 'Music',    '♪', '#EDE4EE', '#8A6E8C', true, false, null, 22, 4),
  ('a1000000-0000-0000-0000-000000000005', patient_uid, 'Camera',   '◎', '#E2EAF0', '#6F8FA8', true, false, null, 5,  5),
  ('a1000000-0000-0000-0000-000000000006', patient_uid, 'Games',    '◆', '#F3E1DC', '#B86B5E', true, true,  45,   45, 6),
  ('a1000000-0000-0000-0000-000000000007', patient_uid, 'Draw',     '✦', '#EAF0E4', '#5E7C52', true, false, null, 15, 7),
  ('a1000000-0000-0000-0000-000000000008', patient_uid, 'Stories',  '❦', '#F5EBD6', '#C89B4A', true, false, null, 18, 8),
  ('a1000000-0000-0000-0000-000000000009', patient_uid, 'Puzzles',  '◐', '#EDE4EE', '#8A6E8C', true, false, null, 11, 9)
on conflict (id) do nothing;


-- =============================================================
-- LIBRARY APPS  (not yet approved for home grid)
-- =============================================================

insert into library_apps (id, patient_id, name, icon, color, reason) values
  ('l1000000-0000-0000-0000-000000000001', patient_uid, 'TikTok',    '♪', '#B86B5E', 'Not approved — infinite scroll'),
  ('l1000000-0000-0000-0000-000000000002', patient_uid, 'Instagram', '◎', '#8A6E8C', 'Not approved — infinite scroll'),
  ('l1000000-0000-0000-0000-000000000003', patient_uid, 'Settings',  '⚙', '#78716C', 'Caregiver only'),
  ('l1000000-0000-0000-0000-000000000004', patient_uid, 'Calendar',  '▦', '#6F8FA8', 'Available — tap to add'),
  ('l1000000-0000-0000-0000-000000000005', patient_uid, 'Weather',   '☀', '#C89B4A', 'Available — tap to add')
on conflict (id) do nothing;


-- =============================================================
-- ROUTINE ITEMS  (today's schedule)
-- =============================================================

insert into routine_items (id, patient_id, emoji, title, note, time, dur, state, sort_order, routine_date) values
  ('r1000000-0000-0000-0000-000000000001', patient_uid, '🌅', 'Morning Routine', 'Shower, brush teeth, get dressed', '7:30',  30, 'done',    1, current_date),
  ('r1000000-0000-0000-0000-000000000002', patient_uid, '🥣', 'Breakfast',        'Eat in the kitchen',               '8:15',  30, 'done',    2, current_date),
  ('r1000000-0000-0000-0000-000000000003', patient_uid, '🎨', 'Creative Time',    'Drawing or painting activity',     '10:00', 45, 'current', 3, current_date),
  ('r1000000-0000-0000-0000-000000000004', patient_uid, '🚶', 'Walk Outside',     '15 min walk around the compound',  '11:00', 15, 'next',    4, current_date),
  ('r1000000-0000-0000-0000-000000000005', patient_uid, '🍽', 'Lunch',            'Eat in the kitchen with Jaki',     '12:30', 45, 'next',    5, current_date),
  ('r1000000-0000-0000-0000-000000000006', patient_uid, '📺', 'YouTube Time',     'Watch favourite channels',         '13:30', 60, 'next',    6, current_date),
  ('r1000000-0000-0000-0000-000000000007', patient_uid, '🧩', 'Learning',         'Puzzles or number games',          '15:00', 45, 'next',    7, current_date),
  ('r1000000-0000-0000-0000-000000000008', patient_uid, '🌙', 'Evening Routine',  'Wind down, prepare for bed',       '19:00', 60, 'next',    8, current_date)
on conflict (id) do nothing;


-- =============================================================
-- AAC CARDS  (quick messages on Arthur's phone)
-- =============================================================

insert into aac_cards (id, patient_id, category, text, emoji, sort_order) values
  -- urgent
  ('m1000000-0000-0000-0000-000000000001', patient_uid, 'urgent', 'I don''t feel well', '🤒', 1),
  ('m1000000-0000-0000-0000-000000000002', patient_uid, 'urgent', 'I need help',        '😰', 2),
  ('m1000000-0000-0000-0000-000000000003', patient_uid, 'urgent', 'Pain',               '😣', 3),
  -- daily
  ('m1000000-0000-0000-0000-000000000004', patient_uid, 'daily',  'I''m hungry',        '🍽', 1),
  ('m1000000-0000-0000-0000-000000000005', patient_uid, 'daily',  'I''m okay',          '😊', 2),
  ('m1000000-0000-0000-0000-000000000006', patient_uid, 'daily',  'I want to rest',     '😴', 3),
  ('m1000000-0000-0000-0000-000000000007', patient_uid, 'daily',  'I want to go home',  '🏠', 4),
  -- social
  ('m1000000-0000-0000-0000-000000000008', patient_uid, 'social', 'Hi! How are you?',   '👋', 1),
  ('m1000000-0000-0000-0000-000000000009', patient_uid, 'social', 'Thank you',          '🙏', 2),
  ('m1000000-0000-0000-0000-000000000010', patient_uid, 'social', 'That was fun!',      '😄', 3),
  ('m1000000-0000-0000-0000-000000000011', patient_uid, 'social', 'I miss you',         '🤗', 4)
on conflict (id) do nothing;


-- =============================================================
-- ZONES  (safe geofence areas)
-- lat/lng set to Nairobi area — update to real coordinates.
-- =============================================================

insert into zones (id, patient_id, name, lat, lng, radius, color, active, inside) values
  ('z1000000-0000-0000-0000-000000000001', patient_uid, 'Home',             -1.2921, 36.8219, 120, '#87A878', true,  true),
  ('z2000000-0000-0000-0000-000000000002', patient_uid, 'Pool Centre',      -1.2934, 36.8201, 80,  '#6F8FA8', true,  false),
  ('z3000000-0000-0000-0000-000000000003', patient_uid, 'Therapist clinic', -1.2890, 36.8250, 60,  '#8A6E8C', false, false)
on conflict (id) do nothing;


-- =============================================================
-- LOCATIONS  (seed with Arthur's current position = Home zone)
-- =============================================================

insert into locations (patient_id, lat, lng, accuracy, source) values
  (patient_uid, -1.2921, 36.8219, 8.0, 'gps');


-- =============================================================
-- FEED ITEMS  (Jaki's activity feed — recent history)
-- =============================================================

insert into feed_items (patient_id, type, card, text, emoji, to_name, meta, read, created_at) values
  (patient_uid, 'aac',      'I''m okay',         null,                  '😊', 'Jaki', null,           false, now() - interval '10 minutes'),
  (patient_uid, 'routine',  null,                 'Finished breakfast',  '🥣', null,  null,           true,  now() - interval '75 minutes'),
  (patient_uid, 'aac',      'I''m hungry',        null,                  '🍽', 'Jaki', null,           true,  now() - interval '2 hours'),
  (patient_uid, 'location', null,                 'Arrived home',        '🏠', null,  null,           true,  now() - interval '2 hours 30 minutes'),
  (patient_uid, 'app',      null,                 'Opened YouTube',      '▶',  null,  '12 min session', true, now() - interval '3 hours'),
  (patient_uid, 'aac',      'Thank you',          null,                  '🙏', 'Jaki', null,           true,  now() - interval '4 hours');


-- =============================================================
-- NOTIFICATIONS  (alert history — maps to AlertItem[] in types.ts)
-- =============================================================

insert into notifications (patient_id, caregiver_id, kind, detail, resolved, created_at) values
  (patient_uid, caregiver_uid, 'sos',   'Shake gesture triggered at Home',              true, now() - interval '1 day'),
  (patient_uid, caregiver_uid, 'limit', 'YouTube exceeded 90 min — locked automatically', true, now() - interval '2 days'),
  (patient_uid, caregiver_uid, 'zone',  'Arthur left Home zone briefly',                true, now() - interval '3 days');


end $$;


-- =============================================================
-- QUICK VERIFICATION QUERIES
-- Run these after seeding to confirm all rows inserted correctly.
-- =============================================================

-- select count(*) from profiles;        -- expect 2
-- select count(*) from contacts;        -- expect 5
-- select count(*) from apps;            -- expect 9
-- select count(*) from library_apps;    -- expect 5
-- select count(*) from routine_items;   -- expect 8
-- select count(*) from aac_cards;       -- expect 11
-- select count(*) from zones;           -- expect 3
-- select count(*) from locations;       -- expect 1
-- select count(*) from feed_items;      -- expect 6
-- select count(*) from notifications;   -- expect 3
