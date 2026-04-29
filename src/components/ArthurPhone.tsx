import { useState, useEffect, useRef } from 'react';
import { TYPE } from '../tokens.js';
import type { Store, MsgCard, FeedItem } from '../types.js';

function formatClock(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDay(d: Date) {
  const day = d.toLocaleDateString([], { weekday: 'short' });
  return `${day} · ☀ 24°C`;
}

export function ArthurPhone({
  store,
  setStore,
  onSos,
}: {
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  onSos?: () => void;
}) {
  const { apps, contacts, messages, routine } = store;
  const [page, setPage] = useState(0);
  const [sent, setSent] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const sosTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const sendCard = (card: MsgCard) => {
    setSent(card.id);
    setTimeout(() => setSent(null), 1400);
    const item: FeedItem = {
      id: 'f' + Date.now(),
      type: 'aac',
      card: card.text,
      emoji: card.emoji,
      to: 'Jaki',
      at: 'Just now',
      minutes: 0,
      read: false,
    };
    setStore(s => ({ ...s, feed: [item, ...s.feed] }));
  };

  const markRoutineDone = (id: string) => {
    setStore(s => {
      const items = s.routine.map(r => r.id === id ? { ...r, state: 'done' as const } : r);
      const doneIdx = items.findIndex(r => r.id === id);
      const promoted = items.map((r, i) => {
        if (r.state === 'next' && i > doneIdx && !items.slice(doneIdx + 1, i).some(x => x.state === 'next')) {
          return { ...r, state: 'current' as const };
        }
        return r;
      });
      const feedItem: FeedItem = {
        id: 'f' + Date.now(),
        type: 'routine',
        text: `Completed: ${s.routine.find(r => r.id === id)?.title ?? ''}`,
        emoji: s.routine.find(r => r.id === id)?.emoji ?? '✓',
        at: 'Just now',
        minutes: 0,
        read: false,
      };
      return { ...s, routine: promoted, feed: [feedItem, ...s.feed] };
    });
  };

  const handleSosDown = () => {
    sosTimer.current = setTimeout(() => {
      onSos?.();
    }, 800);
  };

  const handleSosUp = () => {
    if (sosTimer.current) {
      clearTimeout(sosTimer.current);
      sosTimer.current = null;
    }
  };

  return (
    <div style={{
      width: 260, height: 540, background: '#0A0A0A', borderRadius: 36,
      padding: 8, boxShadow: '0 30px 60px rgba(0,0,0,0.35), 0 0 0 2px #1a1917',
      position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden',
        background: '#111', position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* notch */}
        <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 70, height: 16, background: '#000', borderRadius: 10, zIndex: 30 }} />

        {/* status bar */}
        <div style={{ padding: '8px 18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: TYPE.sans, fontSize: 10, color: '#fff', fontWeight: 700 }}>{formatClock(now)}</span>
          <span style={{ fontFamily: TYPE.sans, fontSize: 9, color: '#fff', opacity: 0.6 }}>📶 78%</span>
        </div>

        {/* page strip */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', marginTop: 6 }}>
          <div style={{
            display: 'flex', width: '400%', height: '100%',
            transform: `translateX(-${page * 25}%)`,
            transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
          }}>
            {/* HOME grid */}
            <div style={{ width: '25%', padding: '8px 12px', overflow: 'auto' }}>
              <div style={{ textAlign: 'center', padding: '6px 0 10px' }}>
                <div style={{ fontFamily: TYPE.display, fontSize: 14, color: '#fff', fontWeight: 500 }}>Good morning, Arthur</div>
                <div style={{ fontFamily: TYPE.sans, fontSize: 9, color: '#87A878', marginTop: 2 }}>{formatDay(now)}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {apps.map(a => (
                  <div key={a.id} style={{
                    background: a.bg, borderRadius: 10, padding: '8px 4px',
                    textAlign: 'center', position: 'relative',
                    opacity: a.locked ? 0.5 : 1,
                  }}>
                    <div style={{ fontFamily: TYPE.display, fontSize: 18, color: a.color }}>{a.icon}</div>
                    <div style={{ fontFamily: TYPE.sans, fontSize: 8, color: '#333', fontWeight: 600, marginTop: 2 }}>{a.name}</div>
                    {a.locked && <div style={{ position: 'absolute', top: 3, right: 3 }}>🔒</div>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, background: 'rgba(135,168,120,0.12)', border: '1px solid rgba(135,168,120,0.3)', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: 3, background: '#87A878' }} />
                <span style={{ fontFamily: TYPE.sans, fontSize: 8, color: '#A8C89B' }}>Watching · 1h 12m today</span>
              </div>
            </div>

            {/* CONTACTS */}
            <div style={{ width: '25%', padding: '8px 12px', overflow: 'auto' }}>
              <div style={{ fontFamily: TYPE.display, fontSize: 13, color: '#fff', fontWeight: 500, marginBottom: 8 }}>People</div>
              {contacts.map(c => (
                <div key={c.id} style={{
                  background: '#1e1e1e', borderRadius: 10, padding: '7px 8px',
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 16, background: c.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TYPE.display, fontSize: 13, fontWeight: 600 }}>{c.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: '#fff', fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontFamily: TYPE.sans, fontSize: 8, color: '#999' }}>{c.role}</div>
                  </div>
                  <div style={{ width: 26, height: 26, borderRadius: 13, background: '#87A878', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>📞</div>
                </div>
              ))}
            </div>

            {/* MESSAGES */}
            <div style={{ width: '25%', padding: '8px 12px', overflow: 'auto' }}>
              <div style={{ fontFamily: TYPE.display, fontSize: 13, color: '#fff', fontWeight: 500, marginBottom: 8 }}>Quick messages</div>
              {(Object.entries(messages) as [string, MsgCard[]][]).map(([cat, cards]) => (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: TYPE.sans, fontSize: 8, color: '#888', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>{cat}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {cards.map(c => (
                      <div key={c.id} onClick={() => sendCard(c)} style={{
                        background: sent === c.id ? '#87A878' : '#1e1e1e',
                        borderRadius: 8, padding: '8px 4px', textAlign: 'center', cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}>
                        <div style={{ fontSize: 15 }}>{c.emoji}</div>
                        <div style={{ fontFamily: TYPE.sans, fontSize: 8, color: sent === c.id ? '#fff' : '#ccc', fontWeight: 500, marginTop: 2, lineHeight: 1.2 }}>{c.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ROUTINE */}
            <div style={{ width: '25%', padding: '8px 12px', overflow: 'auto' }}>
              <div style={{ fontFamily: TYPE.display, fontSize: 13, color: '#fff', fontWeight: 500, marginBottom: 8 }}>Today</div>
              {routine.map(r => (
                <div
                  key={r.id}
                  onClick={() => r.state !== 'done' && markRoutineDone(r.id)}
                  style={{
                    background: r.state === 'current' ? 'rgba(200,155,74,0.15)' : '#1e1e1e',
                    borderRadius: 9, padding: '7px 8px', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4,
                    opacity: r.state === 'done' ? 0.4 : 1,
                    border: r.state === 'current' ? '1px solid #C89B4A' : '1px solid transparent',
                    cursor: r.state !== 'done' ? 'pointer' : 'default',
                    transition: 'opacity 0.2s',
                  }}
                >
                  <div style={{ fontSize: 14 }}>{r.state === 'done' ? '✓' : r.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: TYPE.sans, fontSize: 10, color: '#fff', fontWeight: 600, textDecoration: r.state === 'done' ? 'line-through' : 'none' }}>{r.title}</div>
                  </div>
                  <div style={{ fontFamily: TYPE.sans, fontSize: 8.5, color: r.state === 'current' ? '#C89B4A' : '#888' }}>{r.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* page dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '6px 0 4px', flexShrink: 0 }}>
          {['home', 'contacts', 'messages', 'routine'].map((p, i) => (
            <div key={p} onClick={() => setPage(i)} style={{
              width: page === i ? 16 : 5, height: 5, borderRadius: 3,
              background: page === i ? '#87A878' : '#444', cursor: 'pointer',
              transition: 'all 0.2s',
            }} />
          ))}
        </div>

        {/* SOS button */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 6, flexShrink: 0 }}>
          <button
            onMouseDown={handleSosDown}
            onMouseUp={handleSosUp}
            onMouseLeave={handleSosUp}
            onTouchStart={handleSosDown}
            onTouchEnd={handleSosUp}
            style={{
              background: 'rgba(184,107,94,0.18)', border: '1.5px solid rgba(184,107,94,0.5)',
              borderRadius: 10, padding: '4px 16px', cursor: 'pointer',
              fontFamily: TYPE.sans, fontSize: 9, fontWeight: 700, color: '#CF8078',
              letterSpacing: 0.4, textTransform: 'uppercase',
            }}
          >
            Hold for SOS
          </button>
        </div>

        {/* home indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 60, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.5)' }} />
        </div>
      </div>

      {/* label */}
      <div style={{
        position: 'absolute', top: -28, left: 0, right: 0, textAlign: 'center',
        fontFamily: TYPE.sans, fontSize: 11, fontWeight: 700,
        color: 'rgba(120,113,108,1)', letterSpacing: 0.3, textTransform: 'uppercase',
      }}>Arthur's phone · Live</div>
    </div>
  );
}
