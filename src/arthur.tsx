import { useState, useEffect, useRef } from 'react';
import { TYPE } from './tokens.js';
import { useToast, haptic, ToastProvider } from './ui.js';
import { FALLBACK_SEED, loadStore, saveRoutineState, saveFeedItem, sendSosNotification } from './data.js';
import { supabase } from './lib/supabase.js';
import type { Store, MsgCard, FeedItem, AppItem, Contact } from './types.js';

const BG      = '#0A0A0A';
const SURFACE = '#1C1C1E';
const SURF2   = '#2C2C2E';
const GREEN   = '#87A878';
const AMBER   = '#C89B4A';
const RED     = '#CF8078';
const TEXT    = '#F2F2F7';
const MUTED   = '#8E8E93';

const STORE_KEY = 'jaki_store';
const SOS_KEY   = 'jaki_sos';
const BOTTOM_H  = 90; // dots row + SOS bar

// Lookup by app id (short string ids) or by lowercased app name
const PKG_BY_ID: Record<string, string> = {
  youtube:   'com.google.android.youtube',
  spotify:   'com.spotify.music',
  playstore: 'com.android.vending',
};
const PKG_BY_NAME: Record<string, string> = {
  youtube:   'com.google.android.youtube',
  music:     'com.spotify.music',
  spotify:   'com.spotify.music',
  games:     'com.android.vending',
  'play store': 'com.android.vending',
  draw:      'com.google.android.apps.drawings',
  puzzles:   'com.microsoft.sudoku',
  stories:   'com.google.android.apps.youtube.kids',
};

function extractPkg(raw: string): string {
  // If the pkg field is a Play Store URL, extract the id= param
  if (raw.startsWith('http') || raw.startsWith('market://')) {
    try {
      const id = new URL(raw).searchParams.get('id');
      if (id) return id;
    } catch {}
  }
  return raw;
}


function launchApp(appId: string, appName?: string, pkg?: string) {
  try {
    const bridge = (window as any).Capacitor?.Plugins?.AppBridge;
    if (appId === 'camera' || pkg === '__camera__' || appName?.toLowerCase() === 'camera') {
      bridge?.launchCamera?.({});
      return;
    }
    const raw = pkg ?? PKG_BY_ID[appId] ?? PKG_BY_NAME[appName?.toLowerCase() ?? ''];
    const packageName = raw ? extractPkg(raw) : undefined;
    if (packageName && bridge) {
      bridge.launchApp({ package: packageName });
    }
  } catch {}
}

function makeNativeCall(phone: string) {
  window.location.href = `tel:${phone}`;
}

function loadLocalStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {}
  return FALLBACK_SEED;
}

// Fills the grid to cover exactly the available space
function gridLayout(n: number): { cols: number; rows: number } {
  if (n <= 1) return { cols: 1, rows: 1 };
  if (n <= 2) return { cols: 2, rows: 1 };
  if (n <= 4) return { cols: 2, rows: 2 };
  if (n <= 6) return { cols: 3, rows: 2 };
  if (n <= 9) return { cols: 3, rows: 3 };
  return { cols: 3, rows: Math.ceil(n / 3) };
}

// ─── Apps Page ─────────────────────────────────────────────────────────────
const HOLD_MS = 700;

function AppsPage({ store, onToast }: { store: Store; onToast: (m: string) => void }) {
  const { apps } = store;
  const count = apps.length || 1;
  const { cols, rows } = gridLayout(count);
  const scrollable = rows > 3;
  const pressStartRef = useRef<number | null>(null);
  const pressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const cancelPress = () => {
    if (pressIntervalRef.current) { clearInterval(pressIntervalRef.current); pressIntervalRef.current = null; }
    pressStartRef.current = null;
    setPressedId(null);
    setProgress(0);
  };

  const startPress = (app: AppItem) => {
    if (app.locked) { onToast(`${app.name} is locked`); haptic([6]); return; }
    cancelPress();
    pressStartRef.current = Date.now();
    setPressedId(app.id);
    setProgress(0);
    haptic([3]);
    pressIntervalRef.current = setInterval(() => {
      if (pressStartRef.current === null) return;
      const p = Math.min((Date.now() - pressStartRef.current) / HOLD_MS, 1);
      setProgress(p);
      if (p >= 1) {
        clearInterval(pressIntervalRef.current!);
        pressIntervalRef.current = null;
        pressStartRef.current = null;
        setPressedId(null);
        setProgress(0);
        launchApp(app.id, app.name, app.pkg);
        haptic([8]);
      }
    }, 30);
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      overflowY: scrollable ? 'auto' : 'hidden',
      padding: '12px 14px 0',
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: scrollable ? `repeat(${rows}, minmax(120px, 1fr))` : `repeat(${rows}, 1fr)`,
      gap: 12,
      transition: 'grid-template-columns 0.35s ease, grid-template-rows 0.35s ease',
    }}>
      {apps.map(app => {
        const isPressed = pressedId === app.id;
        return (
          <button
            key={app.id}
            onPointerDown={() => startPress(app)}
            onPointerUp={cancelPress}
            onPointerCancel={cancelPress}
            onPointerLeave={cancelPress}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              background: app.locked ? SURF2 : app.bg,
              borderRadius: 24,
              border: 'none',
              cursor: app.locked ? 'default' : 'pointer',
              opacity: app.locked ? 0.4 : 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              gap: 8,
              padding: 8,
            }}
          >
            {/* Hold progress fill */}
            {isPressed && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: `${progress * 100}%`,
                background: `${app.color}33`,
                pointerEvents: 'none',
                transition: 'none',
              }} />
            )}
            <div style={{
              fontSize: 'clamp(30px, 9vw, 52px)',
              color: app.color,
              lineHeight: 1,
              fontFamily: TYPE.display,
              position: 'relative',
            }}>
              {app.icon}
            </div>
            <div style={{
              fontFamily: TYPE.sans,
              fontSize: 'clamp(11px, 3vw, 15px)',
              color: app.locked ? MUTED : '#333',
              fontWeight: 600,
              letterSpacing: -0.1,
              position: 'relative',
            }}>{app.name}</div>
            {app.locked && (
              <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 14 }}>🔒</div>
            )}
            {(app.pkg || PKG_BY_ID[app.id] || PKG_BY_NAME[app.name?.toLowerCase()] || app.name?.toLowerCase() === 'camera') && !app.locked && (
              <div style={{
                position: 'absolute', bottom: 10, right: 12,
                width: 7, height: 7, borderRadius: '50%', background: GREEN,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Call Page ─────────────────────────────────────────────────────────────
function CallPage({ contacts }: { contacts: Contact[] }) {
  const [pressing, setPressing] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const shown = contacts.slice(0, 4);
  const rows = shown.length <= 2 ? 1 : 2;

  const startPress = (c: Contact) => {
    if (!c.phone) return;
    setPressing(c.id);
    setProgress(0);
    const start = Date.now();
    const DURATION = 3000;
    progressTimer.current = setInterval(() => {
      const p = Math.min((Date.now() - start) / DURATION, 1);
      setProgress(p);
    }, 30);
    pressTimer.current = setTimeout(() => {
      clearInterval(progressTimer.current!);
      haptic([50, 50, 100]);
      makeNativeCall(c.phone);
      setPressing(null);
      setProgress(0);
    }, DURATION);
  };

  const endPress = () => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
    if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = null; }
    setPressing(null);
    setProgress(0);
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: 12,
      padding: '12px 14px 0',
    }}>
      {shown.map(c => {
        const isPressed = pressing === c.id;
        const circumference = 2 * Math.PI * 44; // radius=44
        return (
          <div
            key={c.id}
            onMouseDown={() => startPress(c)}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onTouchStart={() => startPress(c)}
            onTouchEnd={endPress}
            onTouchCancel={endPress}
            style={{
              background: isPressed ? `${c.color}22` : SURFACE,
              borderRadius: 28,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: 'pointer',
              border: `2px solid ${isPressed ? c.color : 'transparent'}`,
              transition: 'border-color 0.1s, background 0.1s',
              overflow: 'hidden',
              WebkitTapHighlightColor: 'transparent',
              gap: 12,
              userSelect: 'none',
            }}
          >
            {/* Avatar with SVG ring for progress */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <svg
                width={100} height={100}
                style={{ position: 'absolute', top: -6, left: -6, transform: 'rotate(-90deg)' }}
              >
                <circle
                  cx={50} cy={50} r={44}
                  fill="none"
                  stroke={c.color}
                  strokeWidth={3}
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.03s linear', opacity: isPressed ? 1 : 0 }}
                />
              </svg>
              <div style={{
                width: 88, height: 88,
                borderRadius: '50%',
                background: `${c.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(26px, 7vw, 38px)',
                fontFamily: TYPE.display,
                fontWeight: 700,
                color: c.color,
              }}>
                {c.initials}
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '0 8px' }}>
              <div style={{
                fontFamily: TYPE.display,
                fontSize: 'clamp(16px, 4.5vw, 22px)',
                color: TEXT, fontWeight: 500, letterSpacing: -0.3,
              }}>{c.name}</div>
              <div style={{
                fontFamily: TYPE.sans,
                fontSize: 'clamp(10px, 2.8vw, 13px)',
                color: MUTED, marginTop: 3,
              }}>{c.role}</div>
            </div>

            <div style={{
              fontFamily: TYPE.sans,
              fontSize: 10,
              color: isPressed ? c.color : `${MUTED}88`,
              letterSpacing: 0.5, textTransform: 'uppercase',
              fontWeight: 700,
              transition: 'color 0.15s',
            }}>
              {isPressed ? 'Calling…' : 'Hold 3s to call'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── AAC Page ───────────────────────────────────────────────────────────────
const AAC_CATS = ['urgent', 'daily', 'social'] as const;
type AACCat = typeof AAC_CATS[number];
const CAT_LABELS: Record<AACCat, string> = { urgent: 'Urgent', daily: 'Daily', social: 'Social' };
const CAT_COLORS: Record<AACCat, string> = { urgent: RED, daily: AMBER, social: GREEN };

function AACPage({ store, onSend }: { store: Store; onSend: (c: MsgCard) => void }) {
  const [sent, setSent] = useState<string | null>(null);
  const [cat, setCat] = useState<AACCat>('urgent');
  const cards = (store.messages[cat] ?? []) as (MsgCard & { imageUrl?: string })[];

  const send = (card: MsgCard) => {
    setSent(card.id);
    setTimeout(() => setSent(null), 1400);
    haptic([12, 40, 8]);
    onSend(card);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 14px 10px', flexShrink: 0 }}>
        {AAC_CATS.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              flex: 1, padding: '8px 4px',
              background: cat === c ? `${CAT_COLORS[c]}22` : SURFACE,
              border: `1.5px solid ${cat === c ? CAT_COLORS[c] : 'transparent'}`,
              borderRadius: 12,
              fontFamily: TYPE.sans, fontSize: 12, fontWeight: 700,
              color: cat === c ? CAT_COLORS[c] : MUTED,
              cursor: 'pointer', letterSpacing: 0.3,
              WebkitTapHighlightColor: 'transparent',
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            {CAT_LABELS[c]}
          </button>
        ))}
      </div>

      {/* 2-column scrollable card grid */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '0 14px 8px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        alignContent: 'start',
      }}>
        {cards.map(c => (
          <button
            key={c.id}
            onClick={() => send(c)}
            style={{
              background: sent === c.id ? CAT_COLORS[cat] : SURFACE,
              borderRadius: 18,
              padding: '14px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: `1.5px solid ${sent === c.id ? CAT_COLORS[cat] : 'transparent'}`,
              transition: 'background 0.18s',
              minHeight: 100,
              gap: 8,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {c.imageUrl ? (
              <img
                src={c.imageUrl}
                alt={c.text}
                style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
              />
            ) : (
              <div style={{ fontSize: 30, lineHeight: 1 }}>{c.emoji}</div>
            )}
            <div style={{
              fontFamily: TYPE.sans,
              fontSize: 12,
              color: sent === c.id ? '#fff' : TEXT,
              fontWeight: 500,
              lineHeight: 1.3,
              textAlign: 'center',
            }}>{c.text}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Routine Page ───────────────────────────────────────────────────────────
function RoutinePage({ store, onToggle }: { store: Store; onToggle: (id: string) => void }) {
  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '12px 14px 8px' }}>
      {store.routine.map(r => (
        <div
          key={r.id}
          onClick={() => onToggle(r.id)}
          style={{
            background: r.state === 'current' ? 'rgba(200,155,74,0.12)' : SURFACE,
            borderRadius: 16,
            padding: '16px',
            display: 'flex', alignItems: 'center', gap: 14,
            marginBottom: 10,
            opacity: r.state === 'done' ? 0.5 : 1,
            border: `1.5px solid ${r.state === 'current' ? AMBER : 'transparent'}`,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ fontSize: 26, flexShrink: 0 }}>
            {r.state === 'done' ? '✓' : r.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: TYPE.sans, fontSize: 16, color: TEXT, fontWeight: 600,
              textDecoration: r.state === 'done' ? 'line-through' : 'none',
              letterSpacing: -0.1,
            }}>{r.title}</div>
            {r.note && (
              <div style={{ fontFamily: TYPE.sans, fontSize: 12, color: MUTED, marginTop: 2 }}>
                {r.note}
              </div>
            )}
            {r.state === 'done' && (
              <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: GREEN, marginTop: 2 }}>
                Tap to undo
              </div>
            )}
          </div>
          <div style={{
            fontFamily: TYPE.sans, fontSize: 12,
            color: r.state === 'current' ? AMBER : MUTED, flexShrink: 0,
          }}>{r.time}</div>
        </div>
      ))}
    </div>
  );
}

// ─── PIN Gate ───────────────────────────────────────────────────────────────
function PinGate({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [digits, setDigits] = useState('');
  const [shake, setShake]   = useState(false);

  const press = (d: string) => {
    const next = (digits + d).slice(-2);
    setDigits(next);
    if (next.length === 2) {
      if (next === '01') {
        onSuccess();
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setDigits(''); }, 400);
      }
    }
  };

  const del = () => setDigits(d => d.slice(0, -1));
  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '32px 28px 28px',
          background: SURFACE, borderRadius: 28,
          width: 290, maxWidth: '92vw',
        }}
      >
        <div style={{
          fontFamily: TYPE.display, fontSize: 18, color: TEXT,
          fontWeight: 500, letterSpacing: -0.3, marginBottom: 6,
        }}>Caregiver PIN required</div>
        <div style={{
          fontFamily: TYPE.sans, fontSize: 12, color: MUTED,
          marginBottom: 28, textAlign: 'center',
        }}>Enter your PIN to access settings</div>

        {/* Dots */}
        <div style={{
          display: 'flex', gap: 16, marginBottom: 28,
          animation: shake ? 'pin-shake 0.35s ease' : 'none',
        }}>
          <style>{`
            @keyframes pin-shake {
              0%,100%{transform:translateX(0)}
              20%{transform:translateX(-8px)}
              40%{transform:translateX(8px)}
              60%{transform:translateX(-5px)}
              80%{transform:translateX(5px)}
            }
          `}</style>
          {[0, 1].map(i => (
            <div key={i} style={{
              width: 13, height: 13, borderRadius: '50%',
              background: i < digits.length ? TEXT : SURF2,
              border: `2px solid ${i < digits.length ? TEXT : '#3A3A3C'}`,
              transition: 'background 0.15s',
            }} />
          ))}
        </div>

        {/* Numpad */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10, width: '100%',
        }}>
          {KEYS.map((k, idx) => {
            const isEmpty = k === '';
            const isDel   = k === '⌫';
            return (
              <button
                key={idx}
                onPointerUp={() => isDel ? del() : !isEmpty && press(k)}
                disabled={isEmpty}
                style={{
                  height: 60,
                  background: isEmpty ? 'transparent' : SURF2,
                  border: 'none', borderRadius: 14,
                  cursor: isEmpty ? 'default' : 'pointer',
                  fontFamily: isDel ? TYPE.sans : TYPE.display,
                  fontSize: isDel ? 17 : 24,
                  color: isEmpty ? 'transparent' : TEXT,
                  transition: 'background 0.1s',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  visibility: isEmpty ? 'hidden' : 'visible',
                }}
                onPointerDown={e => {
                  if (!isEmpty) (e.currentTarget as HTMLButtonElement).style.background = '#3A3A3C';
                }}
              >{k}</button>
            );
          })}
        </div>

        <button
          onClick={onCancel}
          style={{
            marginTop: 20, background: 'transparent', border: 'none',
            cursor: 'pointer', fontFamily: TYPE.sans, fontSize: 13,
            color: MUTED, padding: '6px 16px',
            WebkitTapHighlightColor: 'transparent',
          }}
        >Cancel</button>
      </div>
    </div>
  );
}

// ─── Root Arthur App ────────────────────────────────────────────────────────
export function ArthurApp() {
  const toast = useToast();
  const [store, setStore] = useState<Store>(loadLocalStore);
  const [page, setPage]   = useState(0);
  const [showPinGate, setShowPinGate] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sosTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storeRef  = useRef(store);
  useEffect(() => { storeRef.current = store; }, [store]);

  useEffect(() => {
    let alive = true;
    loadStore().then(data => { if (alive) setStore(data); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORE_KEY && e.newValue) {
        try { setStore(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    const ch = supabase.channel('arthur-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apps' }, async () => {
        const { data } = await supabase.from('apps').select('*');
        if (!data) return;
        const apps: AppItem[] = data.map((r: any) => ({
          id: r.id, name: r.name, icon: r.icon, bg: r.bg,
          allowed: Boolean(r.allowed), locked: Boolean(r.locked),
          limit: r.limit_minutes ?? null, used: Number(r.used_minutes ?? 0), color: r.color,
        }));
        setStore(s => ({ ...s, apps }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routine_items' }, async () => {
        const { data } = await supabase.from('routine_items').select('*');
        if (!data) return;
        setStore(s => ({
          ...s, routine: data.map((r: any) => ({
            id: r.id, emoji: r.emoji, title: r.title, note: r.note,
            time: r.time, dur: Number(r.duration_minutes ?? r.dur ?? 0), state: r.state,
          })),
        }));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // GPS ping to Supabase every 30 s via browser geolocation API
  useEffect(() => {
    if (!navigator.geolocation) return;
    let watchId: number | null = null;
    let lastPing = 0;
    const INTERVAL_MS = 30_000;

    const writePing = (lat: number, lng: number, accuracy: number | null) => {
      const now = Date.now();
      if (now - lastPing < INTERVAL_MS) return;
      lastPing = now;
      supabase.from('location_pings').insert({ lat, lng, accuracy }).then(() => {});
    };

    watchId = navigator.geolocation.watchPosition(
      pos => writePing(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? null),
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, offsetWidth } = scrollRef.current;
    setPage(Math.round(scrollLeft / offsetWidth));
  };

  const goToPage = (p: number) => {
    scrollRef.current?.scrollTo({ left: p * (scrollRef.current.offsetWidth), behavior: 'smooth' });
  };

  const sendCard = (card: MsgCard) => {
    const item: FeedItem = {
      id: crypto.randomUUID(), type: 'aac',
      card: card.text, emoji: card.emoji,
      to: 'Jaki', at: '', minutes: 0, read: false,
    };
    setStore(s => ({ ...s, feed: [item, ...s.feed] }));
    saveFeedItem(item).catch(() => {});
    toast.show(`Sent: ${card.text}`);
  };

  const toggleRoutine = (id: string) => {
    setStore(s => {
      const item = s.routine.find(r => r.id === id);
      if (!item) return s;
      const next = item.state === 'done' ? 'next' as const : 'done' as const;
      saveRoutineState(id, next).catch(() => {});
      haptic([8]);
      return { ...s, routine: s.routine.map(r => r.id === id ? { ...r, state: next } : r) };
    });
  };

  const handleSosDown = () => {
    if (sosTimer.current) return;
    sosTimer.current = setTimeout(() => {
      sosTimer.current = null;
      const zone = storeRef.current.zones.find(z => z.inside)?.name ?? 'Home';
      const at = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const detail = `SOS triggered from ${zone}`;
      const alert = { id: `sos-${Date.now()}`, kind: 'sos' as const, at, resolved: false, detail };
      setStore(s => ({ ...s, alerts: [alert, ...s.alerts] }));
      // Cross-tab (same-browser) fallback
      localStorage.setItem(SOS_KEY, JSON.stringify({ at, zone }));
      // Supabase Realtime — works across separate devices/APKs
      sendSosNotification(detail, at).catch(() => {});
      haptic([100, 50, 100, 50, 200]);
      toast.show('SOS sent to Jaki');
    }, 800);
  };

  const handleSosUp = () => {
    if (sosTimer.current) { clearTimeout(sosTimer.current); sosTimer.current = null; }
  };

  const pages = [
    <AppsPage store={store} onToast={m => toast.show(m)} />,
    <CallPage contacts={store.contacts} />,
    <AACPage store={store} onSend={sendCard} />,
    <RoutinePage store={store} onToggle={toggleRoutine} />,
  ];

  return (
    <div style={{ width: '100%', height: '100vh', background: BG, overflow: 'hidden', position: 'relative' }}>

      {/* Scrollable page strip */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          width: '100%',
          height: `calc(100vh - ${BOTTOM_H}px)`,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
        }}
      >
        <style>{`::-webkit-scrollbar{display:none}`}</style>
        {pages.map((el, i) => (
          <div
            key={i}
            style={{
              width: '100%',
              flexShrink: 0,
              height: '100%',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
          >
            {el}
          </div>
        ))}
      </div>

      {/* Bottom chrome: dots + SOS */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: BOTTOM_H,
        display: 'flex', flexDirection: 'column',
        padding: '6px 16px 20px',
        gap: 8,
      }}>
        {/* Dots row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', height: 24,
        }}>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i)}
                style={{
                  width: page === i ? 18 : 7,
                  height: 7,
                  borderRadius: 999,
                  background: page === i ? TEXT : `${MUTED}55`,
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'width 0.25s ease, background 0.25s',
                }}
              />
            ))}
          </div>
          {/* Exit / switch launcher — subtle gear right side */}
          <button
            onClick={() => setShowPinGate(true)}
            style={{
              position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '4px 6px',
              fontSize: 16, color: `${MUTED}66`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ⚙
          </button>
        </div>

        {/* SOS — calm, not loud */}
        <button
          onPointerDown={handleSosDown}
          onPointerUp={handleSosUp}
          onPointerCancel={handleSosUp}
          onPointerLeave={handleSosUp}
          style={{
            flex: 1,
            background: `rgba(207,128,120,0.09)`,
            border: `1.5px solid ${RED}44`,
            borderRadius: 14,
            cursor: 'pointer',
            fontFamily: TYPE.sans, fontSize: 12,
            fontWeight: 700, color: `${RED}BB`,
            letterSpacing: 0.5, textTransform: 'uppercase',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Hold for SOS
        </button>
      </div>

      {/* PIN gate — must pass before exit dialog */}
      {showPinGate && (
        <PinGate
          onSuccess={() => { setShowPinGate(false); setShowExit(true); }}
          onCancel={() => setShowPinGate(false)}
        />
      )}

      {/* Exit dialog */}
      {showExit && (
        <div
          onClick={() => setShowExit(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: SURFACE, borderRadius: 24, padding: 28,
              width: 290, maxWidth: '92vw',
            }}
          >
            <div style={{
              fontFamily: TYPE.display, fontSize: 20, color: TEXT,
              fontWeight: 500, marginBottom: 8, letterSpacing: -0.3,
            }}>
              Switch home screen?
            </div>
            <div style={{
              fontFamily: TYPE.sans, fontSize: 13, color: MUTED,
              marginBottom: 24, lineHeight: 1.5,
            }}>
              Opens Android home settings so you can choose a different launcher.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowExit(false)}
                style={{
                  flex: 1, padding: 13, background: SURF2, border: 'none',
                  borderRadius: 12, cursor: 'pointer',
                  fontFamily: TYPE.sans, fontSize: 14, color: MUTED, fontWeight: 600,
                }}
              >Cancel</button>
              <button
                onClick={() => {
                  setShowExit(false);
                  try { (window as any).Capacitor?.Plugins?.AppBridge?.openHomeLauncher?.(); } catch {}
                }}
                style={{
                  flex: 1, padding: 13, background: `${RED}22`,
                  border: `1px solid ${RED}55`,
                  borderRadius: 12, cursor: 'pointer',
                  fontFamily: TYPE.sans, fontSize: 14, color: RED, fontWeight: 600,
                }}
              >Switch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
