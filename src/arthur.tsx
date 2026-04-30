import { StrictMode, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { FALLBACK_SEED, loadStore } from './data.js';
import { ToastProvider } from './ui.js';
import { TYPE } from './tokens.js';
import type { Store, MsgCard, FeedItem } from './types.js';

const STORE_KEY = 'jaki_store';
const SOS_KEY = 'jaki_sos';

const BG = '#0A0A0A';
const SURFACE = '#1C1C1E';
const SURFACE2 = '#2C2C2E';
const GREEN = '#87A878';
const AMBER = '#C89B4A';
const RED = '#CF8078';
const TEXT = '#F2F2F7';
const MUTED = '#8E8E93';

function loadLocalStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {}
  return FALLBACK_SEED;
}

function formatClock(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

type Tab = 'home' | 'contacts' | 'messages' | 'routine';

function ArthurApp() {
  const [store, setStore] = useState<Store>(loadLocalStore);
  const [tab, setTab] = useState<Tab>('home');
  const [sent, setSent] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const sosTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storeRef = useRef(store);
  useEffect(() => { storeRef.current = store; }, [store]);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Load from Supabase (falls back to seed on error)
  useEffect(() => {
    let alive = true;
    loadStore().then((data) => { if (alive) setStore(data); }).finally(() => { alive = false; });
    return () => { alive = false; };
  }, []);

  // Persist to localStorage so Jaki tab stays in sync
  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }, [store]);

  // Listen for store updates from Jaki tab
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORE_KEY && e.newValue) {
        try { setStore(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const sendCard = (card: MsgCard) => {
    setSent(card.id);
    setTimeout(() => setSent(null), 1400);
    const item: FeedItem = {
      id: 'f' + Date.now(), type: 'aac',
      card: card.text, emoji: card.emoji,
      to: 'Jaki', at: 'Just now', minutes: 0, read: false,
    };
    setStore(s => ({ ...s, feed: [item, ...s.feed] }));
  };

  const markRoutineDone = (id: string) => {
    setStore(s => {
      const items = s.routine.map(r => r.id === id ? { ...r, state: 'done' as const } : r);
      const doneIdx = items.findIndex(r => r.id === id);
      const promoted = items.map((r, i) => {
        if (r.state === 'next' && i > doneIdx && !items.slice(doneIdx + 1, i).some(x => x.state === 'next'))
          return { ...r, state: 'current' as const };
        return r;
      });
      const feedItem: FeedItem = {
        id: 'f' + Date.now(), type: 'routine',
        text: `Completed: ${s.routine.find(r => r.id === id)?.title ?? ''}`,
        emoji: s.routine.find(r => r.id === id)?.emoji ?? '✓',
        at: 'Just now', minutes: 0, read: false,
      };
      return { ...s, routine: promoted, feed: [feedItem, ...s.feed] };
    });
  };

  const handleSosDown = () => {
    sosTimer.current = setTimeout(() => {
      const zone = storeRef.current.zones.find(z => z.inside)?.name ?? 'Home';
      localStorage.setItem(SOS_KEY, JSON.stringify({
        at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        zone,
      }));
    }, 800);
  };

  const handleSosUp = () => {
    if (sosTimer.current) { clearTimeout(sosTimer.current); sosTimer.current = null; }
  };

  const { apps, contacts, messages, routine } = store;

  const renderTab = () => {
    switch (tab) {
      case 'home':
        return (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: TYPE.display, fontSize: 22, color: TEXT, fontWeight: 500 }}>
                Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, Arthur
              </div>
              <div style={{ fontFamily: TYPE.sans, fontSize: 13, color: GREEN, marginTop: 4 }}>
                {now.toLocaleDateString([], { weekday: 'long' })} · ☀ 24°C
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {apps.map(a => (
                <div key={a.id} style={{
                  background: a.locked ? SURFACE2 : a.bg,
                  borderRadius: 16, padding: '16px 8px',
                  textAlign: 'center', position: 'relative',
                  opacity: a.locked ? 0.5 : 1,
                }}>
                  <div style={{ fontFamily: TYPE.display, fontSize: 28, color: a.color }}>{a.icon}</div>
                  <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: '#333', fontWeight: 600, marginTop: 4 }}>{a.name}</div>
                  {a.locked && <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 12 }}>🔒</div>}
                </div>
              ))}
            </div>
          </div>
        );

      case 'contacts':
        return (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
            <div style={{ fontFamily: TYPE.display, fontSize: 22, color: TEXT, fontWeight: 500, marginBottom: 16 }}>People</div>
            {contacts.map(c => (
              <div key={c.id} style={{
                background: SURFACE, borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 24, background: c.color,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: TYPE.display, fontSize: 18, fontWeight: 600, flexShrink: 0,
                }}>{c.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: TYPE.sans, fontSize: 15, color: TEXT, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontFamily: TYPE.sans, fontSize: 12, color: MUTED, marginTop: 2 }}>{c.role}</div>
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: 20, background: GREEN,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>📞</div>
              </div>
            ))}
          </div>
        );

      case 'messages':
        return (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
            <div style={{ fontFamily: TYPE.display, fontSize: 22, color: TEXT, fontWeight: 500, marginBottom: 16 }}>Quick Messages</div>
            {(Object.entries(messages) as [string, MsgCard[]][]).map(([cat, cards]) => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>{cat}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {cards.map(c => (
                    <div
                      key={c.id}
                      onClick={() => sendCard(c)}
                      style={{
                        background: sent === c.id ? GREEN : SURFACE,
                        borderRadius: 14, padding: '16px 10px', textAlign: 'center',
                        cursor: 'pointer', transition: 'background 0.2s',
                        border: `1px solid ${sent === c.id ? GREEN : 'transparent'}`,
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{c.emoji}</div>
                      <div style={{ fontFamily: TYPE.sans, fontSize: 12, color: sent === c.id ? '#fff' : TEXT, fontWeight: 500, lineHeight: 1.3 }}>{c.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'routine':
        return (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
            <div style={{ fontFamily: TYPE.display, fontSize: 22, color: TEXT, fontWeight: 500, marginBottom: 16 }}>Today</div>
            {routine.map(r => (
              <div
                key={r.id}
                onClick={() => r.state !== 'done' && markRoutineDone(r.id)}
                style={{
                  background: r.state === 'current' ? `rgba(200,155,74,0.15)` : SURFACE,
                  borderRadius: 14, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10,
                  opacity: r.state === 'done' ? 0.4 : 1,
                  border: `1px solid ${r.state === 'current' ? AMBER : 'transparent'}`,
                  cursor: r.state !== 'done' ? 'pointer' : 'default',
                }}
              >
                <div style={{ fontSize: 24, flexShrink: 0 }}>{r.state === 'done' ? '✓' : r.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: TYPE.sans, fontSize: 15, color: TEXT, fontWeight: 600,
                    textDecoration: r.state === 'done' ? 'line-through' : 'none',
                  }}>{r.title}</div>
                  {r.note ? <div style={{ fontFamily: TYPE.sans, fontSize: 12, color: MUTED, marginTop: 2 }}>{r.note}</div> : null}
                </div>
                <div style={{ fontFamily: TYPE.sans, fontSize: 12, color: r.state === 'current' ? AMBER : MUTED, flexShrink: 0 }}>{r.time}</div>
              </div>
            ))}
          </div>
        );
    }
  };

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: 'home', label: 'Apps', emoji: '⊞' },
    { id: 'contacts', label: 'People', emoji: '👥' },
    { id: 'messages', label: 'Messages', emoji: '💬' },
    { id: 'routine', label: 'Today', emoji: '📋' },
  ];

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: BG, overflow: 'hidden' }}>
      {/* Status bar */}
      <div style={{ padding: '12px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: TYPE.sans, fontSize: 15, color: TEXT, fontWeight: 700 }}>{formatClock(now)}</span>
        <span style={{ fontFamily: TYPE.sans, fontSize: 12, color: MUTED }}>📶 78%</span>
      </div>

      {/* Screen content */}
      {renderTab()}

      {/* SOS button */}
      <div style={{ padding: '0 16px 8px', flexShrink: 0 }}>
        <button
          onMouseDown={handleSosDown}
          onMouseUp={handleSosUp}
          onMouseLeave={handleSosUp}
          onTouchStart={handleSosDown}
          onTouchEnd={handleSosUp}
          style={{
            width: '100%', padding: '12px', background: 'rgba(207,128,120,0.15)',
            border: `1.5px solid ${RED}`, borderRadius: 14, cursor: 'pointer',
            fontFamily: TYPE.sans, fontSize: 13, fontWeight: 700, color: RED,
            letterSpacing: 0.4, textTransform: 'uppercase',
          }}
        >
          Hold for SOS
        </button>
      </div>

      {/* Bottom tab bar */}
      <div style={{ display: 'flex', borderTop: `1px solid ${SURFACE2}`, background: SURFACE, flexShrink: 0, paddingBottom: 16 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '10px 0 6px', background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 20 }}>{t.emoji}</span>
            <span style={{
              fontFamily: TYPE.sans, fontSize: 10, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? GREEN : MUTED,
            }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <ArthurApp />
    </ToastProvider>
  </StrictMode>,
);
