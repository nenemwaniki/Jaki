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
  const rows = await fetchTable<any>('feed_items');
  return [...rows]
    .map((row) => ({
      id: row.id,
      type: row.type,
      card: row.card ?? undefined,
      text: row.text ?? undefined,
      emoji: row.emoji,
      to: row.to_name ?? row.to ?? undefined,
      at: row.at ?? '',
      minutes: Number(row.minutes ?? 0),
      read: Boolean(row.read),
      meta: row.meta ?? undefined,
    }))
    .sort((a, b) => a.minutes - b.minutes);
}

async function fetchZones(): Promise<Zone[]> {
  const rows = await fetchTable<any>('zones');
  return sortById(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
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

async function fetchMessages(): Promise<MessagesLibrary> {
  const rows = await fetchTable<any>('aac_cards');
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

    const isEmpty =
      contacts.length === 0 &&
      apps.length === 0 &&
      routine.length === 0 &&
      feed.length === 0;

    if (isEmpty) return FALLBACK_SEED;

    return { contacts, apps, library, routine, feed, messages, zones, alerts };
  } catch {
    return FALLBACK_SEED;
  }
}

/**
 * Optional fallback demo store.
 * Use this only if Supabase is unreachable.
 */
export const FALLBACK_SEED: Store = {
  contacts: [
    { id: 'c1', name: 'Jaki', role: 'Primary Caregiver', color: '#C89B4A', initials: 'J', star: true, phone: '+254 712 004 001' },
    { id: 'c2', name: 'Dr. Susan', role: 'Doctor · AKU', color: '#6F8FA8', initials: 'S', star: false, phone: '+254 712 004 002' },
    { id: 'c3', name: 'Amina', role: 'Occupational Therapist', color: '#8A6E8C', initials: 'A', star: false, phone: '+254 712 004 003' },
    { id: 'c4', name: 'Kevin', role: 'Friend', color: '#87A878', initials: 'K', star: false, phone: '+254 712 004 004' },
    { id: 'c5', name: 'Mum', role: 'Family', color: '#B86B5E', initials: 'M', star: true, phone: '+254 712 004 005' },
  ],
  apps: [
    { id: 'a1', name: 'YouTube', icon: '▶', bg: '#F3E1DC', allowed: true, locked: false, limit: 90, used: 47, color: '#B86B5E' },
    { id: 'a2', name: 'Call', icon: '☏', bg: '#EAF0E4', allowed: true, locked: false, limit: null, used: 12, color: '#5E7C52' },
    { id: 'a3', name: 'Messages', icon: '✉', bg: '#F5EBD6', allowed: true, locked: false, limit: null, used: 8, color: '#C89B4A' },
    { id: 'a4', name: 'Music', icon: '♪', bg: '#EDE4EE', allowed: true, locked: false, limit: null, used: 22, color: '#8A6E8C' },
    { id: 'a5', name: 'Camera', icon: '◎', bg: '#E2EAF0', allowed: true, locked: false, limit: null, used: 5, color: '#6F8FA8' },
    { id: 'a6', name: 'Games', icon: '◆', bg: '#F3E1DC', allowed: true, locked: true, limit: 45, used: 45, color: '#B86B5E' },
    { id: 'a7', name: 'Draw', icon: '✦', bg: '#EAF0E4', allowed: true, locked: false, limit: null, used: 15, color: '#5E7C52' },
    { id: 'a8', name: 'Stories', icon: '❦', bg: '#F5EBD6', allowed: true, locked: false, limit: null, used: 18, color: '#C89B4A' },
    { id: 'a9', name: 'Puzzles', icon: '◐', bg: '#EDE4EE', allowed: true, locked: false, limit: null, used: 11, color: '#8A6E8C' },
  ],
  library: [
    { id: 'l1', name: 'TikTok', icon: '♪', color: '#B86B5E', reason: 'Not approved — infinite scroll' },
    { id: 'l2', name: 'Instagram', icon: '◎', color: '#8A6E8C', reason: 'Not approved — infinite scroll' },
    { id: 'l3', name: 'Settings', icon: '⚙', color: '#78716C', reason: 'Caregiver only' },
    { id: 'l4', name: 'Calendar', icon: '▦', color: '#6F8FA8', reason: 'Available — tap to add' },
    { id: 'l5', name: 'Weather', icon: '☀', color: '#C89B4A', reason: 'Available — tap to add' },
  ],
  routine: [
    { id: 'r1', emoji: '🌅', title: 'Morning Routine', note: 'Shower, brush teeth, get dressed', time: '7:30', dur: 30, state: 'done' },
    { id: 'r2', emoji: '🥣', title: 'Breakfast', note: 'Eat in the kitchen', time: '8:15', dur: 30, state: 'done' },
    { id: 'r3', emoji: '🎨', title: 'Creative Time', note: 'Drawing or painting activity', time: '10:00', dur: 45, state: 'current' },
    { id: 'r4', emoji: '🚶', title: 'Walk Outside', note: '15 min walk around the compound', time: '11:00', dur: 15, state: 'next' },
    { id: 'r5', emoji: '🍽', title: 'Lunch', note: 'Eat in the kitchen with Jaki', time: '12:30', dur: 45, state: 'next' },
    { id: 'r6', emoji: '📺', title: 'YouTube Time', note: 'Watch favourite channels', time: '13:30', dur: 60, state: 'next' },
    { id: 'r7', emoji: '🧩', title: 'Learning', note: 'Puzzles or number games', time: '15:00', dur: 45, state: 'next' },
    { id: 'r8', emoji: '🌙', title: 'Evening Routine', note: 'Wind down, prepare for bed', time: '19:00', dur: 60, state: 'next' },
  ],
  feed: [
    { id: 'f1', type: 'aac', card: "I'm okay", emoji: '😊', to: 'Jaki', at: '10 min ago', minutes: 10, read: false },
    { id: 'f2', type: 'routine', text: 'Finished breakfast', emoji: '🥣', at: '1h 15m ago', minutes: 75, read: true },
    { id: 'f3', type: 'aac', card: "I'm hungry", emoji: '🍽', to: 'Jaki', at: '2h ago', minutes: 120, read: true },
    { id: 'f4', type: 'location', text: 'Arrived home', emoji: '🏠', at: '2h 30m ago', minutes: 150, read: true },
    { id: 'f5', type: 'app', text: 'Opened YouTube', emoji: '▶', at: '3h ago', minutes: 180, read: true, meta: '12 min session' },
    { id: 'f6', type: 'aac', card: 'Thank you', emoji: '🙏', to: 'Jaki', at: '4h ago', minutes: 240, read: true },
  ],
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
    { id: 'z1', name: 'Home', radius: 120, color: '#87A878', active: true, inside: true },
    { id: 'z2', name: 'Pool Centre', radius: 80, color: '#6F8FA8', active: true, inside: false },
    { id: 'z3', name: 'Therapist clinic', radius: 60, color: '#8A6E8C', active: false, inside: false },
  ],
  alerts: [
    { id: 'al1', kind: 'sos', at: 'Yesterday · 18:42', resolved: true, detail: 'Shake gesture triggered at Home' },
    { id: 'al2', kind: 'limit', at: '2 days ago · 14:15', resolved: true, detail: 'YouTube exceeded 90 min — locked automatically' },
    { id: 'al3', kind: 'zone', at: '3 days ago · 11:30', resolved: true, detail: 'Arthur left Home zone briefly' },
  ],
};
