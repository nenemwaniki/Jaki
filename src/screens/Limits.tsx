import { useState } from 'react';
import { useT, TYPE } from '../tokens.js';
import { Icon, I, Card, SectionLabel, Header, useToast } from '../ui.js';
import type { ScreenProps, AppItem } from '../types.js';

export function LimitsScreen({ store, setStore, setScreen }: ScreenProps) {
  const T = useT();
  const toast = useToast();
  const { apps } = store;

  const setLimit = (id: string, minutes: number | null) =>
    setStore(s => ({ ...s, apps: s.apps.map(a => a.id === id ? { ...a, limit: minutes } : a) }));

  const totalUsed = apps.reduce((a, b) => a + (b.used ?? 0), 0);
  const byUse = [...apps].sort((a, b) => b.used - a.used);
  const max = Math.max(...byUse.map(a => a.used), 1);

  return (
    <div style={{ background: T.bg, minHeight: '100%' }}>
      <Header title="Screen time" sub="Today · since midnight" onBack={() => setScreen('home')} />

      <div style={{ padding: '16px 20px 0' }}>
        <Card>
          <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Total today</div>
          <div style={{ fontFamily: TYPE.display, fontSize: 34, color: T.ink, fontWeight: 500, letterSpacing: -0.8, marginTop: 2, lineHeight: 1 }}>
            {Math.floor(totalUsed / 60)}<span style={{ fontSize: 20, color: T.ink3 }}>h</span>{' '}
            {totalUsed % 60}<span style={{ fontSize: 20, color: T.ink3 }}>m</span>
          </div>
          <div style={{ fontFamily: TYPE.sans, fontSize: 12, color: T.sageDeep, fontWeight: 600, marginTop: 4 }}>↓ 14 min less than yesterday</div>

          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {byUse.slice(0, 5).map(a => (
              <div key={a.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: TYPE.sans, fontSize: 12, color: T.ink2, fontWeight: 500 }}>{a.icon} {a.name}</span>
                  <span style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 500 }}>
                    {a.used}m {a.limit !== null && `· limit ${a.limit}m`}
                  </span>
                </div>
                <div style={{ height: 8, background: T.surface2, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    height: '100%', width: `${(a.used / max) * 100}%`,
                    background: a.limit !== null && a.used >= a.limit ? T.rose : a.color,
                    borderRadius: 4,
                  }} />
                  {a.limit !== null && (
                    <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${(a.limit / max) * 100}%`, width: 2, background: T.ink, opacity: 0.4 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <SectionLabel>Daily limits</SectionLabel>
      <div style={{ padding: '0 20px 32px' }}>
        <Card noPad>
          {apps.map((a, i) => (
            <LimitRow
              key={a.id} app={a}
              onSet={m => { setLimit(a.id, m); toast.show(m !== null ? `${a.name} limited to ${m} min/day` : `${a.name} unlimited`); }}
              last={i === apps.length - 1}
            />
          ))}
        </Card>
      </div>
    </div>
  );
}

function LimitRow({ app, onSet, last }: { app: AppItem; onSet: (m: number | null) => void; last: boolean }) {
  const T = useT();
  const [open, setOpen] = useState(false);
  const options: (number | null)[] = [null, 15, 30, 45, 60, 90, 120];

  return (
    <div style={{ borderBottom: last ? 'none' : `1px solid ${T.line}` }}>
      <div onClick={() => setOpen(!open)} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: app.bg, color: app.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TYPE.display, fontSize: 17, flexShrink: 0,
        }}>{app.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: TYPE.display, fontSize: 14.5, color: T.ink, fontWeight: 500 }}>{app.name}</div>
          <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>
            {app.limit !== null ? `${app.limit} min daily` : 'No limit'}
          </div>
        </div>
        <Icon path={open ? I.chevD : I.chevR} size={14} stroke={T.ink4} />
      </div>
      {open && (
        <div style={{ padding: '0 14px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {options.map(o => (
            <button key={o ?? 'none'} onClick={() => { onSet(o); setOpen(false); }} style={{
              padding: '6px 12px', borderRadius: 9, cursor: 'pointer',
              fontFamily: TYPE.sans, fontSize: 12, fontWeight: 600,
              background: app.limit === o ? T.ink : T.surface2,
              color: app.limit === o ? '#fff' : T.ink2,
              border: `1px solid ${app.limit === o ? T.ink : T.line}`,
            }}>{o !== null ? `${o}m` : 'No limit'}</button>
          ))}
        </div>
      )}
    </div>
  );
}
