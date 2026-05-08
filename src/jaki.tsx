import { useState, useEffect, useRef } from 'react';
import { DarkCtx, useT, TYPE } from './tokens.js';
import { Icon, I, PhoneHomeIndicator, useToast, haptic } from './ui.js';
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

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function JakiPhone({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const T = useT();
  const toast = useToast();
  const [store, setStore] = useState<Store>(loadLocalStore);
  const [screen, setScreen] = useState<ScreenId>('home');
  const [sos, setSos] = useState<SosState | null>(null);
  const [outsideZone, setOutsideZone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storeRef = useRef(store);
  const feedIdsRef = useRef(new Set(store.feed.map((f) => f.id)));
  const alertIdsRef = useRef(new Set(store.alerts.map((a) => a.id)));
  useEffect(() => { storeRef.current = store; }, [store]);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    let alive = true;
    loadStore()
      .then((data) => { if (!alive) return; setStore(data); setError(null); })
      .catch((err) => { if (!alive) return; setError(err instanceof Error ? err.message : 'Failed to load Supabase data.'); })
      .finally(() => { if (!alive) return; setLoading(false); });
    return () => { alive = false; };
  }, []);

  // Cross-tab sync (same-browser fallback)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORE_KEY && e.newValue) {
        try {
          const next = JSON.parse(e.newValue) as Store;
          const nextFeedIds = new Set(next.feed.map((f) => f.id));
          const nextAlertIds = new Set(next.alerts.map((a) => a.id));
          const newFeed = next.feed.find((f) => !feedIdsRef.current.has(f.id) && !f.read);
          const newAlert = next.alerts.find((a) => !alertIdsRef.current.has(a.id));
          if (newFeed) toast.show(newFeed.card ? `Arthur: ${newFeed.card}` : (newFeed.text ?? 'New notification'));
          if (newAlert) toast.show(newAlert.detail);
          feedIdsRef.current = nextFeedIds;
          alertIdsRef.current = nextAlertIds;
          setStore(next);
        } catch {}
      }
      if (e.key === SOS_KEY && e.newValue) {
        try {
          const nextSos = JSON.parse(e.newValue);
          setSos(nextSos);
          localStorage.removeItem(SOS_KEY);
          haptic([100, 50, 100, 50, 200]);
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Supabase Realtime — SOS, feed, location pings
  useEffect(() => {
    const channel = supabase
      .channel('jaki-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const row = payload.new as any;
        const zone = row.detail?.replace('SOS triggered from ', '') ?? storeRef.current.zones.find((z) => z.inside)?.name ?? 'Home';
        setSos({ at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), zone });
        haptic([100, 50, 100, 50, 200]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_items' }, (payload) => {
        const row = payload.new as any;
        const item = {
          id: row.id, type: row.type, card: row.card ?? undefined, text: row.text ?? undefined,
          emoji: row.emoji, to: row.to_name ?? undefined,
          at: row.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          minutes: 0, read: false, meta: row.meta ?? undefined,
        };
        setStore(s => {
          if (s.feed.some(f => f.id === item.id)) return s;
          toast.show(item.card ? `Arthur: ${item.card}` : (item.text ?? 'New notification'));
          return { ...s, feed: [item, ...s.feed] };
        });
        haptic([8, 30, 8]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'location_pings' }, (payload) => {
        const { lat, lng } = payload.new as any;
        const activeZones = storeRef.current.zones.filter(z => z.active && z.lat != null && z.lng != null);
        if (activeZones.length === 0) return;
        const inside = activeZones.some(z => haversineMeters(lat, lng, z.lat!, z.lng!) <= z.radius);
        setOutsideZone(!inside);
        if (!inside) haptic([30, 60, 30]);
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

  // Full-screen SOS — replaces entire UI
  if (sos) {
    return (
      <div style={{
        width: '100%', height: '100vh',
        background: '#C0392B',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18,
        position: 'relative',
      }}>
        <style>{`
          @keyframes sos-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        `}</style>
        <div style={{ fontSize: 88, lineHeight: 1, animation: 'sos-pulse 1s ease-in-out infinite' }}>🆘</div>
        <div style={{ fontFamily: TYPE.display, fontSize: 36, color: '#fff', fontWeight: 700, letterSpacing: -0.5 }}>
          SOS Alert
        </div>
        <div style={{ fontFamily: TYPE.sans, fontSize: 16, color: 'rgba(255,255,255,0.88)', textAlign: 'center', lineHeight: 1.6 }}>
          {sos.at} · {sos.zone}
        </div>
        <div style={{ fontFamily: TYPE.sans, fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
          Arthur needs your attention. Respond immediately.
        </div>
        <button
          onClick={() => setSos(null)}
          style={{
            marginTop: 16, padding: '15px 44px',
            background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.5)',
            borderRadius: 32, fontFamily: TYPE.sans, fontSize: 16, fontWeight: 700,
            color: '#fff', cursor: 'pointer', letterSpacing: 0.2,
          }}
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, overflow: 'hidden', position: 'relative' }}>
      {/* Outside-zone blinking banner */}
      {outsideZone && (
        <>
          <style>{`
            @keyframes zone-blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
          `}</style>
          <div
            onClick={() => { setScreen('location'); setOutsideZone(false); }}
            style={{
              background: '#E67E22', padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0,
              animation: 'zone-blink 1.2s ease-in-out infinite',
            }}
          >
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: TYPE.sans, fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: -0.1 }}>
                Arthur left the safe zone
              </div>
              <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
                Tap to view location
              </div>
            </div>
            <span style={{ fontFamily: TYPE.sans, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>✕</span>
          </div>
        </>
      )}

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
    </div>
  );
}

export { JakiApp };
