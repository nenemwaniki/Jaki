import type {
  AlertItem,
  AppItem,
  Contact,
  FeedItem,
  LibraryApp,
  MessagesLibrary,
  RoutineItem,
  Store,
  Zone,
  MsgCard,
} from './types.js';
import { supabase } from './lib/supabase.js';

function sortById<T extends { id: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.id.localeCompare(b.id));
}

async function fetchTable<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return (data ?? []) as T[];
}

async function fetchContacts(): Promise<Contact[]> {
  const rows = await fetchTable<any>('contacts');
  return sortById(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      color: row.color,
      initials: row.initials,
      star: Boolean(row.star),
      phone: row.phone ?? '',
    })),
  );
}

async function fetchApps(): Promise<AppItem[]> {
  const rows = await fetchTable<any>('apps');
  return sortById(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      bg: row.bg,
      allowed: Boolean(row.allowed),
      locked: Boolean(row.locked),
      limit: row.limit_minutes ?? null,
      used: Number(row.used_minutes ?? 0),
      color: row.color,
      pkg: row.pkg ?? row.package_name ?? undefined,
    })),
  );
}

async function fetchLibrary(): Promise<LibraryApp[]> {
  const rows = await fetchTable<any>('library_apps');
  return sortById(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      reason: row.reason,
    })),
  );
}

async function fetchRoutine(): Promise<RoutineItem[]> {
  const rows = await fetchTable<any>('routine_items');
  return sortById(
    rows.map((row) => ({
      id: row.id,
      emoji: row.emoji,
      title: row.title,
      note: row.note,
      time: row.time,
      dur: Number(row.duration_minutes ?? row.dur ?? 0),
      state: row.state,
    })),
  );
}

async function fetchFeed(): Promise<FeedItem[]> {
  const { data, error } = await supabase
    .from('feed_items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    card: row.card ?? undefined,
    text: row.text ?? undefined,
    emoji: row.emoji,
    to: row.to_name ?? undefined,
    at: row.created_at
      ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
    minutes: 0,
    read: Boolean(row.read),
    meta: row.meta ?? undefined,
  }));
}

async function fetchZones(): Promise<Zone[]> {
  const rows = await fetchTable<any>('zones');
  return sortById(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      lat: row.lat ?? undefined,
      lng: row.lng ?? undefined,
      radius: Number(row.radius ?? 0),
      color: row.color,
      active: Boolean(row.active),
      inside: Boolean(row.inside),
    })),
  );
}

async function fetchAlerts(): Promise<AlertItem[]> {
  const rows = await fetchTable<any>('notifications');
  return [...rows]
    .map((row) => ({
      id: row.id,
      kind: row.kind,
      at: row.at ?? row.created_at ?? '',
      resolved: Boolean(row.resolved),
      detail: row.detail,
    }))
    .sort((a, b) => a.at.localeCompare(b.at));
}

const PATIENT_ID = 'b62dcc24-a980-4cc3-9396-5d4cfe16b6a9';

async function fetchMessages(): Promise<MessagesLibrary> {
  const { data, error } = await supabase
    .from('aac_cards')
    .select('*')
    .eq('patient_id', PATIENT_ID);
  if (error) throw error;
  const rows = data ?? [];
  const grouped: MessagesLibrary = {
    urgent: [],
    daily: [],
    social: [],
  };

  for (const row of rows) {
    const card: MsgCard = {
      id: row.id,
      text: row.text,
      emoji: row.emoji,
      imageUrl: row.image_url ?? undefined,
    };

    const category = row.category as keyof MessagesLibrary | undefined;
    if (category && grouped[category]) {
      grouped[category].push(card);
    }
  }

  return grouped;
}

export async function loadStore(): Promise<Store> {
  try {
    const [contacts, apps, library, routine, feed, messages, zones, alerts] =
      await Promise.all([
        fetchContacts(),
        fetchApps(),
        fetchLibrary(),
        fetchRoutine(),
        fetchFeed(),
        fetchMessages(),
        fetchZones(),
        fetchAlerts(),
      ]);

    return { contacts, apps, library, routine, feed, messages, zones, alerts };
  } catch {
    return EMPTY_STORE;
  }
}

// ── Write-back helpers ────────────────────────────────────────────────────────

export async function saveAppLock(appId: string, locked: boolean): Promise<void> {
  await supabase.from('apps').update({ locked }).eq('id', appId);
}

export async function saveAppLimit(appId: string, limitMinutes: number | null): Promise<void> {
  await supabase.from('apps').update({ limit_minutes: limitMinutes }).eq('id', appId);
}

export async function saveApp(app: AppItem): Promise<void> {
  await supabase.from('apps').upsert({
    id: app.id,
    name: app.name,
    icon: app.icon,
    bg: app.bg,
    color: app.color,
    allowed: app.allowed,
    locked: app.locked,
    limit_minutes: app.limit ?? null,
    used_minutes: app.used,
    pkg: app.pkg ?? null,
  });
}

export async function deleteApp(id: string): Promise<void> {
  await supabase.from('apps').delete().eq('id', id);
}

export async function saveZone(zone: Zone): Promise<void> {
  await supabase.from('zones').upsert({
    id: zone.id,
    name: zone.name,
    lat: zone.lat ?? null,
    lng: zone.lng ?? null,
    radius: zone.radius,
    color: zone.color,
    active: zone.active,
    inside: zone.inside,
  });
}

export async function deleteZone(id: string): Promise<void> {
  await supabase.from('zones').delete().eq('id', id);
}

export async function sendSosNotification(detail: string, at: string): Promise<void> {
  await supabase.from('notifications').insert({
    kind: 'sos',
    at,
    resolved: false,
    detail,
  });
}

export async function saveRoutineState(id: string, state: string): Promise<void> {
  await supabase.from('routine_items').update({ state }).eq('id', id);
}

export async function saveFeedItem(item: FeedItem): Promise<void> {
  const { error } = await supabase.from('feed_items').insert({
    id: item.id,
    patient_id: PATIENT_ID,
    type: item.type,
    card: item.card ?? null,
    text: item.text ?? null,
    emoji: item.emoji,
    to_name: item.to ?? null,
    read: item.read,
    meta: item.meta ?? null,
  });
  if (error) throw error;
}

// ── Empty store (Supabase reachable but no data yet) ─────────────────────────
export const EMPTY_STORE: Store = {
  contacts: [], apps: [], library: [], routine: [],
  feed: [], messages: { urgent: [], daily: [], social: [] },
  zones: [], alerts: [],
};

// ── Minimal fallback (used only when Supabase is unreachable) ─────────────────
/**
 * Keep this minimal — real data lives in Supabase.
 * Populate via the Supabase dashboard before the demo.
 */
export const FALLBACK_SEED: Store = {
  contacts: [
    { id: 'c1', name: 'Jaki', role: 'Primary Caregiver', color: '#C89B4A', initials: 'J', star: true, phone: '+254700000001' },
    { id: 'c2', name: 'Mum', role: 'Family', color: '#B86B5E', initials: 'M', star: true, phone: '+254700000002' },
    { id: 'c3', name: 'Dad', role: 'Family', color: '#6F8FA8', initials: 'D', star: false, phone: '+254700000003' },
  ],
  apps: [
    { id: 'youtube',   name: 'YouTube',    icon: '▶', bg: '#FFEAEA', allowed: true, locked: false, limit: 60,   used: 0, color: '#FF0000', pkg: 'com.google.android.youtube' },
    { id: 'camera',    name: 'Camera',     icon: '📷', bg: '#E8E8E8', allowed: true, locked: false, limit: null, used: 0, color: '#444',    pkg: '__camera__' },
    { id: 'spotify',   name: 'Spotify',    icon: '♪', bg: '#E8F5E9', allowed: true, locked: false, limit: null, used: 0, color: '#1DB954', pkg: 'com.spotify.music' },
    { id: 'playstore', name: 'Play Store', icon: '▶', bg: '#E3F2FD', allowed: true, locked: false, limit: null, used: 0, color: '#4285F4', pkg: 'com.android.vending' },
  ],
  library: [],
  routine: [
    { id: 'r1', emoji: '🌅', title: 'Morning Routine', note: 'Shower, dress, brush teeth', time: '7:30', dur: 30, state: 'next' },
    { id: 'r2', emoji: '🍽', title: 'Lunch', note: 'Eat in the kitchen', time: '12:30', dur: 30, state: 'next' },
    { id: 'r3', emoji: '🌙', title: 'Evening Wind-down', note: 'Prepare for bed', time: '19:00', dur: 45, state: 'next' },
  ],
  feed: [],
  messages: {
    urgent: [
      { id: 'm1', text: "I don't feel well", emoji: '🤒' },
      { id: 'm2', text: 'I need help', emoji: '😰' },
      { id: 'm3', text: 'Pain', emoji: '😣' },
    ],
    daily: [
      { id: 'm4', text: "I'm hungry", emoji: '🍽' },
      { id: 'm5', text: "I'm okay", emoji: '😊' },
      { id: 'm6', text: 'I want to rest', emoji: '😴' },
      { id: 'm7', text: 'I want to go home', emoji: '🏠' },
    ],
    social: [
      { id: 'm8', text: 'Hi! How are you?', emoji: '👋' },
      { id: 'm9', text: 'Thank you', emoji: '🙏' },
      { id: 'm10', text: 'That was fun!', emoji: '😄' },
      { id: 'm11', text: 'I miss you', emoji: '🤗' },
    ],
  },
  zones: [
    { id: 'z1', name: 'Home', lat: -1.286389, lng: 36.817223, radius: 120, color: '#87A878', active: true, inside: true },
  ],
  alerts: [],
};
