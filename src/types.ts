export interface Contact {
  id: string;
  name: string;
  role: string;
  color: string;
  initials: string;
  star: boolean;
  phone: string;
}

export interface AppItem {
  id: string;
  name: string;
  icon: string;
  bg: string;
  allowed: boolean;
  locked: boolean;
  limit: number | null;
  used: number;
  color: string;
}

export interface LibraryApp {
  id: string;
  name: string;
  icon: string;
  color: string;
  reason: string;
}

export type RoutineState = 'done' | 'current' | 'next';

export interface RoutineItem {
  id: string;
  emoji: string;
  title: string;
  note: string;
  time: string;
  dur: number;
  state: RoutineState;
}

export type FeedType = 'aac' | 'routine' | 'location' | 'app';

export interface FeedItem {
  id: string;
  type: FeedType;
  card?: string;
  text?: string;
  emoji: string;
  to?: string;
  at: string;
  minutes: number;
  read: boolean;
  meta?: string;
}

export interface MsgCard {
  id: string;
  text: string;
  emoji: string;
}

export interface MessagesLibrary {
  urgent: MsgCard[];
  daily: MsgCard[];
  social: MsgCard[];
}

export interface Zone {
  id: string;
  name: string;
  radius: number;
  color: string;
  active: boolean;
  inside: boolean;
}

export type AlertKind = 'sos' | 'limit' | 'zone';

export interface AlertItem {
  id: string;
  kind: AlertKind;
  at: string;
  resolved: boolean;
  detail: string;
}

export interface Store {
  contacts: Contact[];
  apps: AppItem[];
  library: LibraryApp[];
  routine: RoutineItem[];
  feed: FeedItem[];
  messages: MessagesLibrary;
  zones: Zone[];
  alerts: AlertItem[];
}

export type ScreenId =
  | 'home' | 'launcher' | 'messages'
  | 'contacts' | 'location' | 'activities'
  | 'limits' | 'settings';

export interface ScreenProps {
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  setScreen: (s: ScreenId) => void;
}
