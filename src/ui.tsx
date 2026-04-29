import { useState, createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { useT, TYPE } from './tokens.js';
import { Icon, I } from './icons.js';
import type { IconKey } from './icons.js';

// ─── Avatar ────────────────────────────────────────────────
export function Avatar({ name, color = '#87A878', size = 44, initials }: {
  name: string; color?: string; size?: number; initials?: string;
}) {
  const ini = initials ?? (name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: TYPE.display, fontSize: size * 0.42, fontWeight: 600,
      flexShrink: 0, letterSpacing: -0.5,
      boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.25)',
    }}>{ini}</div>
  );
}

// ─── Card ──────────────────────────────────────────────────
export function Card({ children, style, onClick, noPad }: {
  children: ReactNode; style?: CSSProperties; onClick?: () => void; noPad?: boolean;
}) {
  const T = useT();
  return (
    <div onClick={onClick} style={{
      background: T.surface, borderRadius: 18, border: `1px solid ${T.line}`,
      padding: noPad ? 0 : 16, boxShadow: T.shadow1,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

// ─── Section header ────────────────────────────────────────
export function SectionLabel({ children, action, style }: {
  children: ReactNode; action?: ReactNode; style?: CSSProperties;
}) {
  const T = useT();
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '20px 20px 8px', ...style,
    }}>
      <div style={{
        fontFamily: TYPE.sans, fontSize: 11, fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: T.ink3,
      }}>{children}</div>
      {action}
    </div>
  );
}

// ─── Button ────────────────────────────────────────────────
type BtnKind = 'primary' | 'sage' | 'ghost' | 'fill' | 'danger' | 'dangerGhost';
type BtnSize = 'sm' | 'md' | 'lg';

export function Btn({ children, kind = 'primary', size = 'md', icon, onClick, style, disabled, full }: {
  children?: ReactNode; kind?: BtnKind; size?: BtnSize;
  icon?: React.ReactNode; onClick?: () => void;
  style?: CSSProperties; disabled?: boolean; full?: boolean;
}) {
  const T = useT();
  const sizes: Record<BtnSize, { pad: string; fs: number; r: number; ic: number }> = {
    sm: { pad: '7px 12px', fs: 13, r: 10, ic: 14 },
    md: { pad: '10px 16px', fs: 14, r: 12, ic: 16 },
    lg: { pad: '14px 20px', fs: 15, r: 14, ic: 18 },
  };
  const kinds: Record<BtnKind, { bg: string; col: string; br: string }> = {
    primary:     { bg: T.ink,         col: T.bg,    br: T.ink },
    sage:        { bg: T.sage,        col: '#fff',  br: T.sage },
    ghost:       { bg: 'transparent', col: T.ink,   br: T.line },
    fill:        { bg: T.surface2,    col: T.ink,   br: T.surface2 },
    danger:      { bg: T.rose,        col: '#fff',  br: T.rose },
    dangerGhost: { bg: 'transparent', col: T.rose,  br: T.roseSoft },
  };
  const s = sizes[size];
  const k = kinds[kind];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: s.pad, fontSize: s.fs, borderRadius: s.r,
        background: k.bg, color: k.col, border: `1px solid ${k.br}`,
        fontFamily: TYPE.sans, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        opacity: disabled ? 0.45 : 1, whiteSpace: 'nowrap',
        width: full ? '100%' : 'auto', justifyContent: full ? 'center' : 'flex-start',
        letterSpacing: -0.1, transition: 'transform 0.1s, background 0.15s',
        ...style,
      }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {icon && <Icon path={icon} size={s.ic} />}
      {children}
    </button>
  );
}

// ─── Toggle ────────────────────────────────────────────────
export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  const T = useT();
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: on ? T.sage : T.line2,
        position: 'relative', cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.18s',
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 22, height: 22, borderRadius: 11, background: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.1)',
        transition: 'left 0.18s',
      }} />
    </div>
  );
}

// ─── Chip ──────────────────────────────────────────────────
export function Chip({ children, color, bg, style }: {
  children: ReactNode; color?: string; bg?: string; style?: CSSProperties;
}) {
  const T = useT();
  return (
    <span style={{
      background: bg ?? T.sageSoft, color: color ?? T.sage, borderRadius: 999,
      padding: '4px 10px', fontSize: 11, fontWeight: 600,
      fontFamily: TYPE.sans, letterSpacing: 0.1,
      display: 'inline-flex', alignItems: 'center', gap: 4,
      ...style,
    }}>{children}</span>
  );
}

// ─── Empty state ───────────────────────────────────────────
export function Empty({ children, title }: { children?: ReactNode; title?: string }) {
  const T = useT();
  return (
    <div style={{
      padding: '32px 20px', textAlign: 'center',
      color: T.ink3, fontFamily: TYPE.sans, fontSize: 13,
    }}>
      {title && (
        <div style={{ fontFamily: TYPE.display, fontSize: 17, color: T.ink2, marginBottom: 4, fontWeight: 500 }}>{title}</div>
      )}
      {children}
    </div>
  );
}

// ─── Toast system ──────────────────────────────────────────
interface Toast { id: string; msg: string; action?: { label: string; onClick: () => void }; duration?: number; }

interface ToastCtxValue { show: (msg: string, opts?: Partial<Toast>) => void; dismiss: (id: string) => void; }

const ToastCtx = createContext<ToastCtxValue>({ show: () => '', dismiss: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = (msg: string, opts: Partial<Toast> = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, ...opts }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), opts.duration ?? 3400);
    return id;
  };
  const dismiss = (id: string) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <ToastCtx.Provider value={{ show, dismiss }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: '#232320', color: '#F8F7F4',
            borderRadius: 14, padding: '12px 16px',
            fontFamily: TYPE.sans, fontSize: 13, fontWeight: 500,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', gap: 12,
            minWidth: 220, maxWidth: 340,
            animation: 'toastIn 0.22s ease-out',
          }}>
            <div style={{ flex: 1, letterSpacing: -0.1 }}>{t.msg}</div>
            {t.action && (
              <button
                onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                style={{
                  background: 'transparent', border: 'none', color: '#87A878',
                  fontFamily: TYPE.sans, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', padding: 0, letterSpacing: 0.1,
                }}
              >{t.action.label}</button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

// ─── Phone chrome ──────────────────────────────────────────
export function PhoneStatusBar({ time = '9:41', dark = false }: { time?: string; dark?: boolean }) {
  const col = dark ? '#fff' : '#1F1B16';
  return (
    <div style={{
      height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', flexShrink: 0, position: 'relative', zIndex: 10,
    }}>
      <span style={{ fontFamily: TYPE.sans, fontSize: 15, fontWeight: 700, color: col, letterSpacing: -0.2 }}>{time}</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill={col}>
          <rect x="0" y="7" width="3" height="4" rx="0.6"/>
          <rect x="4.5" y="4.8" width="3" height="6.2" rx="0.6"/>
          <rect x="9" y="2.4" width="3" height="8.6" rx="0.6"/>
          <rect x="13.5" y="0" width="3" height="11" rx="0.6"/>
        </svg>
        <Icon path={I.wifi} size={14} stroke={col} sw={2.2} />
        <Icon path={I.battery} size={18} stroke={col} sw={1.5} fill={col} style={{ opacity: 0.85 }} />
      </div>
    </div>
  );
}

export function PhoneHomeIndicator({ dark = false }: { dark?: boolean }) {
  return (
    <div style={{
      height: 28, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      paddingBottom: 7, flexShrink: 0,
    }}>
      <div style={{
        width: 128, height: 5, borderRadius: 3,
        background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(31,27,22,0.3)',
      }} />
    </div>
  );
}

// ─── Bottom sheet ──────────────────────────────────────────
export function Sheet({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const T = useT();
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0, background: 'rgba(31,27,22,0.3)', zIndex: 100,
          animation: 'fadeIn 0.2s',
        }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 101,
        background: T.surface, borderRadius: '24px 24px 0 0',
        maxHeight: '75%', overflow: 'auto',
        animation: 'sheetUp 0.25s cubic-bezier(0.22,1,0.36,1)',
        boxShadow: T.shadow3,
      }}>
        <div style={{
          padding: '14px 20px 10px', position: 'sticky', top: 0, background: T.surface,
          borderBottom: `1px solid ${T.line}`, zIndex: 2,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.line2 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: TYPE.display, fontSize: 18, color: T.ink, fontWeight: 500, letterSpacing: -0.3 }}>{title}</div>
            <button
              onClick={onClose}
              style={{
                background: T.surface2, border: 'none', borderRadius: 10,
                width: 30, height: 30, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon path={I.x} size={14} stroke={T.ink2} sw={2.2} />
            </button>
          </div>
        </div>
        <div style={{ padding: '12px 20px 24px' }}>{children}</div>
      </div>
    </>
  );
}

// ─── Screen header ─────────────────────────────────────────
export function Header({ title, sub, onBack, action }: {
  title: string; sub?: string; onBack?: () => void; action?: ReactNode;
}) {
  const T = useT();
  return (
    <div style={{ padding: '4px 20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: -8,
            }}
          >
            <Icon path={I.chevL} size={20} stroke={T.ink2} sw={2} />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {sub && (
            <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>{sub}</div>
          )}
          <div style={{ fontFamily: TYPE.display, fontSize: 22, color: T.ink, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1.1 }}>{title}</div>
        </div>
        {action}
      </div>
    </div>
  );
}

export { Icon, I, type IconKey };

export const haptic = (pat: number[] = [8]) => {
  try { navigator.vibrate?.(pat); } catch { /* noop */ }
};
