import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { DarkCtx, useT, TYPE } from './tokens.js';
import { Icon, I, Avatar, PhoneStatusBar, PhoneHomeIndicator, useToast, haptic, ToastProvider } from './ui.js';
import { FALLBACK_SEED, loadStore } from './data.js';
import { HomeScreen } from './screens/Home.js';
import { LauncherScreen } from './screens/Launcher.js';
import { MessagesScreen } from './screens/Messages.js';
import { ContactsScreen } from './screens/Contacts.js';
import { LocationScreen } from './screens/Location.js';
import { ActivitiesScreen } from './screens/Activities.js';
import { LimitsScreen } from './screens/Limits.js';
import { SettingsScreen } from './screens/Settings.js';
import type { ScreenId, Store } from './types.js';

const STORE_KEY = 'jaki_store';
const SOS_KEY = 'jaki_sos';

const TABS = [
  { id: 'home' as ScreenId, label: 'Home', icon: I.home },
  { id: 'launcher' as ScreenId, label: 'Launcher', icon: I.grid },
  { id: 'messages' as ScreenId, label: 'Inbox', icon: I.message },
  { id: 'contacts' as ScreenId, label: 'People', icon: I.users },
  { id: 'location' as ScreenId, label: 'Location', icon: I.map },
  { id: 'activities' as ScreenId, label: 'Routine', icon: I.calendar },
  { id: 'limits' as ScreenId, label: 'Limits', icon: I.timer },
  { id: 'settings' as ScreenId, label: 'Settings', icon: I.settings },
];

const PRIMARY_TABS: ScreenId[] = ['home', 'launcher', 'messages', 'location', 'settings'];
const SIDE_TABS: ScreenId[] = ['contacts', 'activities', 'limits'];

function loadLocalStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {}
  return FALLBACK_SEED;
}

function JakiApp() {
  const [dark, setDark] = useState(false);
  return (
    <DarkCtx.Provider value={dark}>
      <JakiPhone dark={dark} setDark={setDark} />
    </DarkCtx.Provider>
  );
}

interface SosState {
  at: string;
  zone: string;
}

function JakiPhone({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const T = useT();
  const toast = useToast();
  const [store, setStore] = useState<Store>(loadLocalStore);
  const [screen, setScreen] = useState<ScreenId>('home');
  const [sos, setSos] = useState<SosState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    let alive = true;
    loadStore()
      .then((data) => {
        if (!alive) return;
        setStore(data);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Failed to load Supabase data.');
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORE_KEY && e.newValue) {
        try {
          setStore(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === SOS_KEY && e.newValue) {
        try {
          setSos(JSON.parse(e.newValue));
          localStorage.removeItem(SOS_KEY);
          haptic([100, 50, 100, 50, 200]);
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading demo data from Supabase…</div>;
  if (error) return <div style={{ padding: 24, color: '#c0392b' }}>Failed to load Supabase data: {error}</div>;

  return <div>/* keep your existing JSX here */</div>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <JakiApp />
    </ToastProvider>
  </StrictMode>,
);
