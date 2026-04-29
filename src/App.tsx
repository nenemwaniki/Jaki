import { useState, useEffect } from 'react';
import { useT, DarkCtx, TYPE } from './tokens.js';
import { Icon, I, Avatar, PhoneStatusBar, PhoneHomeIndicator, useToast, haptic } from './ui.js';
import { SEED } from './data.js';
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
  { id: 'home',       label: 'Home',     icon: I.home },
  { id: 'launcher',   label: 'Launcher', icon: I.grid },
  { id: 'messages',   label: 'Inbox',    icon: I.message },
  { id: 'contacts',   label: 'People',   icon: I.users },
  { id: 'location',   label: 'Location', icon: I.map },
  { id: 'activities', label: 'Routine',  icon: I.calendar },
  { id: 'limits',     label: 'Limits',   icon: I.timer },
  { id: 'settings',   label: 'Settings', icon: I.settings },
];
const PRIMARY_TABS: ScreenId[] = ['home', 'launcher', 'messages', 'location', 'settings'];
const SIDE_TABS: ScreenId[] = ['contacts', 'activities', 'limits'];

interface SosState { at: string; zone: string }

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
  const [store, setStore] = useState<Store>(SEED);
  const [twin, setTwin] = useState(true);
  const [sos, setSos] = useState<SosState | null>(null);

  useEffect(() => { localStorage.setItem('jaki_screen', screen); }, [screen]);

  const fireSos = () => {
    const zone = store.zones.find(z => z.inside)?.name ?? 'Home';
    setSos({ at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), zone });
    haptic([100, 50, 100, 50, 200]);
  };

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

  const isSettingsGroup = ['settings', 'activities', 'limits', 'contacts'].includes(screen);

  return (
    <div style={{
      minHeight: '100vh', padding: '28px 16px',
      background: dark ? '#0A0A0A' : '#EDE9E0',
      display: 'flex', gap: 48, justifyContent: 'center', alignItems: 'flex-start',
      flexWrap: 'wrap',
    }}>
      {/* Jaki's phone */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', top: -28, left: 0, right: 0, textAlign: 'center',
          fontFamily: TYPE.sans, fontSize: 11, fontWeight: 700, color: T.ink3,
          letterSpacing: 0.3, textTransform: 'uppercase',
        }}>Jaki's app</div>

        {/* Phone chassis */}
        <div style={{
          width: 390, height: 812, background: '#000', borderRadius: 54, padding: 10,
          boxShadow: '0 40px 80px rgba(31,27,22,0.2), 0 0 0 2px rgba(31,27,22,0.1)',
          position: 'relative',
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: 44, overflow: 'hidden',
            background: T.bg, position: 'relative',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Dynamic island */}
            <div style={{
              position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
              width: 116, height: 34, background: '#000', borderRadius: 22, zIndex: 50,
            }} />

            <PhoneStatusBar />

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              {renderScreen()}
            </div>

            {/* Tab bar */}
            <div style={{
              borderTop: `1px solid ${T.line}`, background: dark ? 'rgba(28,28,30,0.95)' : 'rgba(248,247,244,0.95)',
              backdropFilter: 'blur(16px)', padding: '6px 4px 4px',
              display: 'flex', justifyContent: 'space-around', flexShrink: 0, zIndex: 9,
            }}>
              {PRIMARY_TABS.map(id => {
                const tab = TABS.find(x => x.id === id)!;
                const active = screen === id || (id === 'settings' && isSettingsGroup);
                return (
                  <button key={id} onClick={() => setScreen(id)} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: '4px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    color: active ? T.ink : T.ink3,
                  }}>
                    <Icon path={tab.icon} size={21} sw={active ? 2 : 1.7} />
                    <span style={{ fontFamily: TYPE.sans, fontSize: 9.5, fontWeight: active ? 700 : 500, letterSpacing: 0.1 }}>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <PhoneHomeIndicator />

            {/* SOS overlay */}
            {sos && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 200,
                background: 'rgba(184,107,94,0.96)', backdropFilter: 'blur(20px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 24, animation: 'sosIn 0.3s cubic-bezier(0.22,1,0.36,1)',
              }}>
                <div style={{ fontFamily: TYPE.sans, fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: 0.4, textTransform: 'uppercase', opacity: 0.85, marginBottom: 10 }}>
                  ⚠ SOS · {sos.at}
                </div>
                <div style={{ fontFamily: TYPE.display, fontSize: 34, color: '#fff', fontWeight: 500, textAlign: 'center', letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 10 }}>
                  Arthur triggered<br />the shake alert.
                </div>
                <div style={{ fontFamily: TYPE.sans, fontSize: 14, color: '#fff', opacity: 0.85, textAlign: 'center', marginBottom: 24 }}>
                  At {sos.zone} · phone 78%
                </div>
                <button onClick={() => setSos(null)} style={{
                  background: '#fff', border: 'none', borderRadius: 16,
                  padding: '16px 28px', fontFamily: TYPE.sans, fontSize: 16, fontWeight: 700,
                  color: '#B86B5E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 10,
                }}>
                  <Icon path={I.phone} size={18} sw={2.3} />
                  Call Arthur now
                </button>
                <button onClick={() => setSos(null)} style={{
                  background: 'transparent', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 16,
                  padding: '12px 24px', fontFamily: TYPE.sans, fontSize: 14, fontWeight: 600,
                  color: '#fff', cursor: 'pointer',
                }}>
                  Mark safe · dismiss
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Side rail — extra tabs + SOS trigger */}
        <div style={{ position: 'absolute', left: -56, top: 80, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SIDE_TABS.map(id => {
            const tab = TABS.find(x => x.id === id)!;
            const active = screen === id;
            return (
              <button key={id} onClick={() => setScreen(id)} title={tab.label} style={{
                width: 44, height: 44, borderRadius: 12, cursor: 'pointer',
                background: active ? T.ink : T.surface,
                color: active ? T.bg : T.ink2,
                border: `1px solid ${active ? T.ink : T.line}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: T.shadow1,
              }}>
                <Icon path={tab.icon} size={18} sw={1.75} />
              </button>
            );
          })}
          <div style={{ height: 8 }} />
          <button onClick={fireSos} title="Demo: trigger SOS" style={{
            width: 44, height: 44, borderRadius: 12, cursor: 'pointer',
            background: T.roseSoft, color: T.rose, border: `1px solid ${T.rose}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: T.shadow1,
          }}>
            <Icon path={I.sos} size={18} sw={2} />
          </button>
        </div>
      </div>

      {/* Arthur's phone twin */}
      {twin && <ArthurPhone store={store} setStore={setStore} onSos={fireSos} />}

      {/* Floating controls */}
      <div style={{
        position: 'fixed', bottom: 20, left: 20, zIndex: 500,
        display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start',
      }}>
        <button onClick={() => setTwin(!twin)} style={{
          background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12,
          padding: '10px 14px', cursor: 'pointer',
          fontFamily: TYPE.sans, fontSize: 12, fontWeight: 600, color: T.ink,
          display: 'flex', alignItems: 'center', gap: 8, boxShadow: T.shadow2,
        }}>
          <Icon path={I.eye} size={14} />
          {twin ? "Hide" : "Show"} Arthur's phone
        </button>
        <button
          onClick={() => toast.show('Prototype mode — data resets on refresh')}
          style={{
            background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12,
            padding: '8px 14px', cursor: 'pointer',
            fontFamily: TYPE.sans, fontSize: 11, fontWeight: 500, color: T.ink3,
            display: 'flex', alignItems: 'center', gap: 6, boxShadow: T.shadow1,
          }}
        >
          <Avatar name="A" color={T.sage} size={18} />
          Prototype notes
        </button>
      </div>
    </div>
  );
}
