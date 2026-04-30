import { StrictMode, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { DarkCtx, useT, TYPE } from './tokens.js';
import { Icon, I, PhoneStatusBar, PhoneHomeIndicator, useToast, haptic, ToastProvider } from './ui.js';
import { FALLBACK_SEED, loadStore } from './data.js';
import { supabase } from './lib/supabase.js';
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
  { id: 'launcher' as ScreenId, label: 'Apps', icon: I.grid },
  { id: 'messages' as ScreenId, label: 'Inbox', icon: I.message },
  { id: 'location' as ScreenId, label: 'Location', icon: I.map },
  { id: 'activities' as ScreenId, label: 'Routine', icon: I.calendar },
  { id: 'contacts' as ScreenId, label: 'People', icon: I.users },
  { id: 'limits' as ScreenId, label: 'Limits', icon: I.timer },
  { id: 'settings' as ScreenId, label: 'Settings', icon: I.settings },
];

function loadLocalStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {}
  return FALLBACK_SEED;
}

interface SosState {
  at: string;
  zone: string;
}

function JakiApp() {
  const [dark, setDark] = useState(false);
  return (
    <DarkCtx.Provider value={dark}>
      <JakiPhone dark={dark} setDark={setDark} />
    </DarkCtx.Provider>
  );
}

function JakiPhone({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const T = useT();
  useToast();
  const [store, setStore] = useState<Store>(loadLocalStore);
  const [screen, setScreen] = useState<ScreenId>('home');
  const [sos, setSos] = useState<SosState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  );

  // Keep a ref so the Realtime handler always sees the latest store without re-subscribing
  const storeRef = useRef(store);
  useEffect(() => { storeRef.current = store; }, [store]);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  // Persist store to localStorage so Arthur tab stays in sync
  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }, [store]);

  // Load real data from Supabase on mount
  useEffect(() => {
    let alive = true;
    loadStore()
      .then((data) => { if (!alive) return; setStore(data); setError(null); })
      .catch((err) => { if (!alive) return; setError(err instanceof Error ? err.message : 'Failed to load Supabase data.'); })
      .finally(() => { if (!alive) return; setLoading(false); });
    return () => { alive = false; };
  }, []);

  // Cross-tab sync: pick up store + SOS changes written by Arthur tab
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORE_KEY && e.newValue) {
        try { setStore(JSON.parse(e.newValue)); } catch {}
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

  // Supabase Realtime — fire SOS overlay on any INSERT into notifications
  useEffect(() => {
    const channel = supabase
      .channel('jaki-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        const zone = storeRef.current.zones.find((z) => z.inside)?.name ?? 'Home';
        setSos({ at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), zone });
        haptic([100, 50, 100, 50, 200]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);


  const screenProps = { store, setStore, setScreen };

  const renderScreen = () => {
    switch (screen) {
      case 'home':       return <HomeScreen {...screenProps} />;
      case 'launcher':   return <LauncherScreen {...screenProps} />;
      case 'messages':   return <MessagesScreen {...screenProps} />;
      case 'contacts':   return <ContactsScreen {...screenProps} />;
      case 'location':   return <LocationScreen {...screenProps} />;
      case 'activities': return <ActivitiesScreen {...screenProps} />;
      case 'limits':     return <LimitsScreen {...screenProps} />;
      case 'settings':   return <SettingsScreen {...screenProps} dark={dark} setDark={setDark} />;
    }
  };

  const unread = store.feed.filter((f) => !f.read).length;

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
        <span style={{ fontFamily: TYPE.sans, fontSize: 14, color: T.ink3 }}>Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, padding: 24 }}>
        <span style={{ fontFamily: TYPE.sans, fontSize: 13, color: '#c0392b', textAlign: 'center' }}>{error}</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, overflow: 'hidden', position: 'relative' }}>
      <PhoneStatusBar time={time} dark={dark} />

      {/* Scrollable screen content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
        {renderScreen()}
      </div>

      {/* Bottom tab bar */}
      <div style={{ display: 'flex', borderTop: `1px solid ${T.line}`, background: T.surface, flexShrink: 0 }}>
        {TABS.map((tab) => {
          const active = screen === tab.id;
          const badge = tab.id === 'messages' && unread > 0;
          return (
            <button
              key={tab.id}
              onClick={() => setScreen(tab.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, padding: '8px 0 6px', background: 'none', border: 'none',
                cursor: 'pointer', position: 'relative',
              }}
            >
              {badge && (
                <div style={{
                  position: 'absolute', top: 6, left: '50%', marginLeft: 4,
                  width: 7, height: 7, borderRadius: '50%', background: T.rose,
                }} />
              )}
              <Icon path={tab.icon} size={19} stroke={active ? T.sage : T.ink4} sw={active ? 2.2 : 1.8} />
              <span style={{
                fontFamily: TYPE.sans, fontSize: 9, letterSpacing: 0.1,
                color: active ? T.sage : T.ink4,
                fontWeight: active ? 600 : 400,
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <PhoneHomeIndicator dark={dark} />

      {/* SOS overlay */}
      {sos && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 200,
          background: 'rgba(184,107,94,0.96)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
        }}>
          <div style={{ fontSize: 64, lineHeight: 1 }}>🆘</div>
          <div style={{ fontFamily: TYPE.display, fontSize: 30, color: '#fff', fontWeight: 600, letterSpacing: -0.5 }}>
            SOS Alert
          </div>
          <div style={{ fontFamily: TYPE.sans, fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.5 }}>
            {sos.at} · {sos.zone}
          </div>
          <button
            onClick={() => setSos(null)}
            style={{
              marginTop: 12, padding: '13px 36px', background: '#fff',
              color: '#B86B5E', border: 'none', borderRadius: 28,
              fontFamily: TYPE.sans, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <JakiApp />
    </ToastProvider>
  </StrictMode>,
);
