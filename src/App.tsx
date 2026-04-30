import { useState, useEffect } from 'react';
import { useT, DarkCtx, TYPE } from './tokens.js';
import { Icon, I, Avatar, PhoneStatusBar, PhoneHomeIndicator, useToast, haptic } from './ui.js';
import { FALLBACK_SEED, loadStore } from './data.js';
import { ArthurPhone } from './components/ArthurPhone.js';
import { HomeScreen } from './screens/Home.js';
import { LauncherScreen } from './screens/Launcher.js';
import { MessagesScreen } from './screens/Messages.js';
import { ContactsScreen } from './screens/Contacts.js';
import { LocationScreen } from './screens/Location.js';
import { ActivitiesScreen } from './screens/Activities.js';
import { LimitsScreen } from './screens/Limits.js';
import { SettingsScreen } from './screens/Settings.js';
import type { ScreenId, Store } from './types.js';

const TABS: { id: ScreenId; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: I.home },
  { id: 'launcher', label: 'Launcher', icon: I.grid },
  { id: 'messages', label: 'Inbox', icon: I.message },
  { id: 'contacts', label: 'People', icon: I.users },
  { id: 'location', label: 'Location', icon: I.map },
  { id: 'activities', label: 'Routine', icon: I.calendar },
  { id: 'limits', label: 'Limits', icon: I.timer },
  { id: 'settings', label: 'Settings', icon: I.settings },
];

const PRIMARY_TABS: ScreenId[] = ['home', 'launcher', 'messages', 'location', 'settings'];
const SIDE_TABS: ScreenId[] = ['contacts', 'activities', 'limits'];

interface SosState {
  at: string;
  zone: string;
}

export function App() {
  const [dark, setDark] = useState(false);
  return (
    <DarkCtx.Provider value={dark}>
      <AppInner dark={dark} setDark={setDark} />
    </DarkCtx.Provider>
  );
}

function AppInner({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const T = useT();
  const toast = useToast();
  const [screen, setScreen] = useState<ScreenId>(() => {
    const stored = localStorage.getItem('jaki_screen') as ScreenId | null;
    return stored ?? 'home';
  });
  const [store, setStore] = useState<Store>(FALLBACK_SEED);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [twin, setTwin] = useState(true);
  const [sos, setSos] = useState<SosState | null>(null);

  useEffect(() => {
    localStorage.setItem('jaki_screen', screen);
  }, [screen]);

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

  const fireSos = () => {
    const zone = store.zones.find((z) => z.inside)?.name ?? 'Home';
    setSos({ at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), zone });
    haptic([100, 50, 100, 50, 200]);
  };

  const screenProps = { store, setStore, setScreen };

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomeScreen {...screenProps} />;
      case 'launcher':
        return <LauncherScreen {...screenProps} />;
      case 'messages':
        return <MessagesScreen {...screenProps} />;
      case 'contacts':
        return <ContactsScreen {...screenProps} />;
      case 'location':
        return <LocationScreen {...screenProps} />;
      case 'activities':
        return <ActivitiesScreen {...screenProps} />;
      case 'limits':
        return <LimitsScreen {...screenProps} />;
      case 'settings':
      return <SettingsScreen {...screenProps} dark={dark} setDark={setDark} />;
    }
  };

  return (
    <div>
      {loading ? (
        <div style={{ padding: 24, color: T.ink3 }}>Loading demo data from Supabase…</div>
      ) : error ? (
        <div style={{ padding: 24, color: '#c0392b' }}>
          Failed to load Supabase data: {error}
        </div>
      ) : (
        renderScreen()
      )}
    </div>
  );
}
