import { T, TYPE } from '../tokens.js';
import { Icon, I } from '../ui.js';
import { Avatar, Card, SectionLabel, Chip } from '../ui.js';
import type { ScreenProps, FeedItem } from '../types.js';

export function HomeScreen({ store, setStore, setScreen }: ScreenProps) {
  const { contacts: _c, routine, feed, apps, zones, alerts } = store;
  const activeZone = zones.find(z => z.inside && z.active);
  const current = routine.find(r => r.state === 'current');
  const next = routine.find(r => r.state === 'next');
  const unread = feed.filter(f => !f.read).length;
  const screenTime = apps.reduce((a, b) => a + (b.used ?? 0), 0);
  const overLimit = apps.filter(a => a.limit !== null && a.used >= (a.limit ?? 0)).length;

  const greet = () => {
    const h = new Date().getHours();
    if (h < 5) return 'Late evening';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const markAllRead = () => setStore(s => ({ ...s, feed: s.feed.map(f => ({ ...f, read: true })) }));

  return (
    <div style={{ background: T.bg, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '4px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <div>
            <div style={{ fontFamily: TYPE.sans, fontSize: 12, color: T.ink3, fontWeight: 500, letterSpacing: 0.2 }}>
              {greet()}, Jaki
            </div>
            <div style={{ fontFamily: TYPE.display, fontSize: 26, color: T.ink, fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.6, marginTop: 2 }}>
              Arthur is <span style={{ fontStyle: 'italic', color: T.sageDeep }}>safe &amp; home</span>.
            </div>
          </div>
          <div onClick={() => setScreen('settings')} style={{ cursor: 'pointer' }}>
            <Avatar name="Jaki" color="#C89B4A" size={40} />
          </div>
        </div>
      </div>

      {/* Primary status card */}
      <div style={{ padding: '16px 20px 0' }}>
        <Card style={{ padding: 0, background: `linear-gradient(160deg, ${T.sageSoft} 0%, #F5F1E8 70%)`, border: `1px solid ${T.sageSoft}` }}>
          <div style={{ padding: '18px 18px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: 4, background: T.sageDeep,
                    boxShadow: `0 0 0 4px ${T.sage}33`, animation: 'pulse 2s infinite',
                  }} />
                  <span style={{ fontFamily: TYPE.sans, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.sageDeep }}>Live</span>
                </div>
                <div style={{ fontFamily: TYPE.display, fontSize: 22, fontWeight: 500, color: T.ink, lineHeight: 1.2, letterSpacing: -0.3 }}>
                  At {activeZone?.name ?? 'Home'}, with {current?.title?.toLowerCase() ?? 'creative time'}.
                </div>
                <div style={{ fontFamily: TYPE.sans, fontSize: 12, color: T.ink3, marginTop: 6, letterSpacing: -0.1 }}>
                  Last ping 2 min ago · phone 78% · no alerts
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
              {routine.slice(0, 6).map(r => (
                <div key={r.id} style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: r.state === 'done' ? T.sageDeep : r.state === 'current' ? T.sage : T.line2,
                  opacity: r.state === 'current' ? 1 : r.state === 'done' ? 0.9 : 0.5,
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontFamily: TYPE.sans, fontSize: 10, color: T.ink3, letterSpacing: 0.2 }}>
                ROUTINE · {routine.filter(r => r.state === 'done').length}/{routine.length} DONE
              </span>
              <span
                onClick={() => setScreen('activities')}
                style={{ fontFamily: TYPE.sans, fontSize: 10, color: T.sageDeep, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.2 }}
              >OPEN ↗</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick tiles */}
      <div style={{ padding: '12px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <QuickTile
          label="Screen time"
          value={`${Math.floor(screenTime / 60)}h ${screenTime % 60}m`}
          sub={overLimit ? `${overLimit} over limit` : 'Within limits'}
          tone={overLimit ? 'amber' : 'sage'}
          icon={I.timer}
          onClick={() => setScreen('limits')}
        />
        <QuickTile
          label="Safe zone"
          value={activeZone?.name ?? 'Out'}
          sub={`${zones.filter(z => z.active).length} zones active`}
          tone="sky"
          icon={I.shield}
          onClick={() => setScreen('location')}
        />
      </div>

      {/* Activity feed */}
      <SectionLabel action={
        <span
          onClick={markAllRead}
          style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.sageDeep, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.1 }}
        >MARK READ</span>
      }>
        From Arthur {unread > 0 && <Chip style={{ marginLeft: 8 }}>{unread} new</Chip>}
      </SectionLabel>

      <div style={{ padding: '0 20px' }}>
        <Card noPad>
          {feed.slice(0, 6).map((f, i) => (
            <FeedRow
              key={f.id} item={f}
              last={i === Math.min(feed.length, 6) - 1}
              onClick={() => {
                if (f.type === 'aac') setScreen('messages');
                else if (f.type === 'location') setScreen('location');
                else if (f.type === 'app') setScreen('limits');
                else if (f.type === 'routine') setScreen('activities');
              }}
            />
          ))}
        </Card>
      </div>

      {/* Up next */}
      {next && (
        <>
          <SectionLabel>Up next</SectionLabel>
          <div style={{ padding: '0 20px' }}>
            <Card onClick={() => setScreen('activities')} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>{next.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TYPE.display, fontSize: 17, color: T.ink, fontWeight: 500, letterSpacing: -0.2 }}>{next.title}</div>
                <div style={{ fontFamily: TYPE.sans, fontSize: 12, color: T.ink3, marginTop: 2 }}>{next.note}</div>
              </div>
              <div style={{ fontFamily: TYPE.display, fontSize: 15, color: T.ink2, fontWeight: 500 }}>{next.time}</div>
            </Card>
          </div>
        </>
      )}

      {/* Recent alerts */}
      {alerts.length > 0 && (
        <>
          <SectionLabel>Recent alerts</SectionLabel>
          <div style={{ padding: '0 20px' }}>
            <Card noPad>
              {alerts.slice(0, 2).map((a, i) => (
                <div key={a.id} onClick={() => setScreen('settings')} style={{
                  padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
                  borderBottom: i === 0 ? `1px solid ${T.line}` : 'none',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: a.kind === 'sos' ? T.roseSoft : a.kind === 'limit' ? T.amberSoft : T.skySoft,
                    color: a.kind === 'sos' ? T.rose : a.kind === 'limit' ? T.amber : T.sky,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon path={a.kind === 'sos' ? I.sos : a.kind === 'limit' ? I.timer : I.shield} size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: TYPE.sans, fontSize: 13, color: T.ink2, fontWeight: 500, letterSpacing: -0.1 }}>{a.detail}</div>
                    <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink4, marginTop: 2 }}>{a.at} {a.resolved && '· resolved'}</div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}

      <div style={{ height: 32 }} />
    </div>
  );
}

type Tone = 'sage' | 'amber' | 'sky' | 'rose';

function QuickTile({ label, value, sub, tone, icon, onClick }: {
  label: string; value: string; sub: string; tone: Tone; icon: React.ReactNode; onClick: () => void;
}) {
  const tones: Record<Tone, { bg: string; col: string }> = {
    sage:  { bg: T.sageSoft,  col: T.sageDeep },
    amber: { bg: T.amberSoft, col: T.amber },
    sky:   { bg: T.skySoft,   col: T.sky },
    rose:  { bg: T.roseSoft,  col: T.rose },
  };
  const t = tones[tone];
  return (
    <Card onClick={onClick} style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 9,
          background: t.bg, color: t.col,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon path={icon} size={14} />
        </div>
        <Icon path={I.chevR} size={14} stroke={T.ink4} />
      </div>
      <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', marginTop: 12 }}>{label}</div>
      <div style={{ fontFamily: TYPE.display, fontSize: 22, color: T.ink, fontWeight: 500, letterSpacing: -0.3, marginTop: 2 }}>{value}</div>
      <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: t.col, fontWeight: 600, marginTop: 2 }}>{sub}</div>
    </Card>
  );
}

function FeedRow({ item, last, onClick }: { item: FeedItem; last: boolean; onClick: () => void }) {
  const typeLabels: Record<string, { bg: string; col: string; tag: string }> = {
    aac:      { bg: T.amberSoft, col: T.amber,    tag: 'MESSAGE' },
    routine:  { bg: T.sageSoft,  col: T.sageDeep, tag: 'ROUTINE' },
    location: { bg: T.skySoft,   col: T.sky,      tag: 'LOCATION' },
    app:      { bg: T.plumSoft,  col: T.plum,     tag: 'APP' },
  };
  const t = typeLabels[item.type] ?? typeLabels['aac']!;
  const txt = item.card ? `"${item.card}"` : (item.text ?? '');
  return (
    <div onClick={onClick} style={{
      padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
      borderBottom: last ? 'none' : `1px solid ${T.line}`,
      cursor: 'pointer', position: 'relative',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 11, background: t.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17, flexShrink: 0,
      }}>{item.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontFamily: TYPE.sans, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: t.col }}>{t.tag}</span>
          {!item.read && <div style={{ width: 6, height: 6, borderRadius: 3, background: T.rose }} />}
        </div>
        <div style={{ fontFamily: TYPE.display, fontSize: 15, color: T.ink, fontWeight: 500, letterSpacing: -0.2 }}>{txt}</div>
        <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, marginTop: 2, letterSpacing: -0.05 }}>
          {item.to ? `to ${item.to} · ` : ''}{item.meta ? `${item.meta} · ` : ''}{item.at}
        </div>
      </div>
    </div>
  );
}
