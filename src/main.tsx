import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from './ui.js';
import { TYPE } from './tokens.js';
import { ArthurApp } from './arthur.js';
import { JakiApp } from './jaki.js';

const ROLE_KEY = 'jaki_role';
type Role = 'jaki' | 'arthur';

const BG     = '#0A0A0A';
const SURF   = '#1C1C1E';
const SURF2  = '#2C2C2E';
const TEXT   = '#F2F2F7';
const MUTED  = '#636366';
const GREEN  = '#87A878';
const AMBER  = '#C89B4A';

// PIN codes → roles
const PINS: Record<string, Role> = { '01': 'jaki', '02': 'arthur' };

function openHomeLauncher() {
  try { (window as any).Capacitor?.Plugins?.AppBridge?.openHomeLauncher?.(); } catch {}
}

function PinChooser({ onChoose }: { onChoose: (r: Role) => void }) {
  const [digits, setDigits] = useState('');
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState<Role | null>(null);

  const press = (d: string) => {
    const next = (digits + d).slice(-2);
    setDigits(next);
    if (next.length === 2) {
      const role = PINS[next];
      if (role) {
        setFlash(role);
        setTimeout(() => {
          if (role === 'arthur') openHomeLauncher();
          onChoose(role);
        }, 280);
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setDigits(''); }, 400);
      }
    }
  };

  const del = () => setDigits(d => d.slice(0, -1));

  const DOT_KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  const dotColor = flash === 'jaki' ? AMBER : flash === 'arthur' ? GREEN : TEXT;

  return (
    <div style={{
      width: '100%', height: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: BG, padding: '0 32px',
      userSelect: 'none',
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: TYPE.display,
        fontSize: 'clamp(48px, 13vw, 64px)',
        color: TEXT,
        fontWeight: 500,
        letterSpacing: -2,
        lineHeight: 1,
        marginBottom: 8,
      }}>Jaki</div>
      <div style={{
        fontFamily: TYPE.sans, fontSize: 13, color: MUTED,
        marginBottom: 48, letterSpacing: 0.1,
      }}>Enter your code</div>

      {/* PIN dots */}
      <div
        style={{
          display: 'flex', gap: 16, marginBottom: 44,
          animation: shake ? 'shake 0.35s ease' : 'none',
        }}
      >
        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-8px)}
            40%{transform:translateX(8px)}
            60%{transform:translateX(-5px)}
            80%{transform:translateX(5px)}
          }
        `}</style>
        {[0, 1].map(i => (
          <div
            key={i}
            style={{
              width: 14, height: 14, borderRadius: '50%',
              background: i < digits.length ? dotColor : SURF2,
              border: `2px solid ${i < digits.length ? dotColor : '#3A3A3C'}`,
              transition: 'background 0.15s, border-color 0.15s',
            }}
          />
        ))}
      </div>

      {/* Numpad */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, width: '100%', maxWidth: 280,
      }}>
        {DOT_KEYS.map((k, idx) => {
          const isEmpty = k === '';
          const isDel   = k === '⌫';
          return (
            <button
              key={idx}
              onPointerUp={() => isDel ? del() : !isEmpty && press(k)}
              disabled={isEmpty}
              style={{
                height: 68,
                background: isEmpty ? 'transparent' : SURF,
                border: 'none',
                borderRadius: 18,
                cursor: isEmpty ? 'default' : 'pointer',
                fontFamily: isDel ? TYPE.sans : TYPE.display,
                fontSize: isDel ? 18 : 26,
                color: isEmpty ? 'transparent' : TEXT,
                transition: 'background 0.1s',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                visibility: isEmpty ? 'hidden' : 'visible',
              }}
              onPointerDown={e => { if (!isEmpty) (e.currentTarget as HTMLButtonElement).style.background = SURF2; }}
            >
              {k}
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: 40,
        fontFamily: TYPE.sans, fontSize: 11, color: '#3A3A3C',
        textAlign: 'center', lineHeight: 1.8, letterSpacing: 0.05,
      }}>
        01 · Caregiver&nbsp;&nbsp;·&nbsp;&nbsp;02 · Arthur
      </div>
    </div>
  );
}

function Root() {
  const [role, setRole] = useState<Role | null>(() => (localStorage.getItem(ROLE_KEY) as Role) ?? null);

  const chooseRole = (r: Role) => {
    localStorage.setItem(ROLE_KEY, r);
    setRole(r);
  };

  // PIN shown once per device. Role is remembered after first entry.
  // To re-show PIN: clear localStorage key 'jaki_role' (via ⚙ in Arthur or Settings in Jaki).
  if (!role) return <PinChooser onChoose={chooseRole} />;
  if (role === 'arthur') return <ArthurApp />;
  return <JakiApp />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <Root />
    </ToastProvider>
  </StrictMode>,
);
