import { T, TYPE } from '../tokens.js';
import { Icon, I, Btn, Card, SectionLabel, Toggle, Header, useToast } from '../ui.js';
import type { ScreenProps } from '../types.js';

export function LocationScreen({ store, setStore, setScreen }: ScreenProps) {
  const toast = useToast();
  const { zones } = store;
  const active = zones.find(z => z.inside && z.active);

  const toggle = (id: string) =>
    setStore(s => ({ ...s, zones: s.zones.map(z => z.id === id ? { ...z, active: !z.active } : z) }));

  return (
    <div style={{ background: T.bg, minHeight: '100%' }}>
      <Header title="Location" sub="Where Arthur is now" onBack={() => setScreen('home')} />

      {/* Map */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          position: 'relative', height: 280, borderRadius: 20, overflow: 'hidden',
          background: 'linear-gradient(180deg, #F0EDE5 0%, #E7E3DB 100%)',
          border: `1px solid ${T.line}`,
        }}>
          {/* grid */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.5,
            backgroundImage: `linear-gradient(${T.line2} 1px, transparent 1px), linear-gradient(90deg, ${T.line2} 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }} />
          {/* roads */}
          <div style={{ position: 'absolute', top: '38%', left: 0, right: 0, height: 10, background: '#DFD9CC' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '35%', width: 10, background: '#DFD9CC' }} />
          {/* buildings */}
          <div style={{ position: 'absolute', top: '15%', left: '45%', width: 50, height: 38, background: '#D6D0C1', borderRadius: 4 }} />
          <div style={{ position: 'absolute', top: '55%', left: '55%', width: 60, height: 32, background: '#D6D0C1', borderRadius: 4 }} />
          <div style={{ position: 'absolute', top: '60%', left: '18%', width: 40, height: 40, background: '#D6D0C1', borderRadius: 4 }} />

          {/* geofence ring */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 160, height: 160, borderRadius: 80,
            background: `${T.sage}22`, border: `2px dashed ${T.sage}`,
            animation: 'spin 40s linear infinite',
          }} />
          {/* Arthur's pin */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 54, height: 54, borderRadius: 27, background: T.surface,
            border: `3px solid ${T.sageDeep}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 0 8px ${T.sage}22, ${T.shadow2}`, zIndex: 5,
          }}>
            <span style={{ fontFamily: TYPE.display, fontSize: 22, fontWeight: 600, color: T.sageDeep }}>A</span>
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, background: T.sageDeep, border: '2px solid #fff' }} />
          </div>

          {/* info card */}
          <div style={{
            position: 'absolute', left: 12, right: 12, bottom: 12,
            background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
            border: `1px solid ${T.line}`,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: TYPE.sans, fontSize: 10, color: T.sageDeep, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>Inside safe zone</div>
              <div style={{ fontFamily: TYPE.display, fontSize: 17, color: T.ink, fontWeight: 500, letterSpacing: -0.3, marginTop: 1 }}>{active?.name ?? 'Home'}</div>
              <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>Ping accuracy · 8m · updated 2 min ago</div>
            </div>
            <Btn kind="fill" size="sm" icon={I.refresh} onClick={() => toast.show('Location refreshed')}>Refresh</Btn>
          </div>
        </div>
      </div>

      <SectionLabel action={<Btn kind="ghost" size="sm" icon={I.plus} onClick={() => toast.show('Draw a new zone on the map')}>New zone</Btn>}>
        Safe zones
      </SectionLabel>
      <div style={{ padding: '0 20px 32px' }}>
        <Card noPad>
          {zones.map((z, i) => (
            <div key={z.id} style={{
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: i === zones.length - 1 ? 'none' : `1px solid ${T.line}`,
            }}>
              <div style={{ width: 14, height: 14, borderRadius: 7, background: z.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TYPE.display, fontSize: 15, color: T.ink, fontWeight: 500, letterSpacing: -0.2 }}>{z.name}</div>
                <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>
                  {z.radius}m radius · {z.inside ? 'Arthur is inside' : 'Arthur is outside'}
                </div>
              </div>
              <Toggle on={z.active} onChange={() => toggle(z.id)} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
