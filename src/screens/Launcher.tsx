import { useState } from 'react';
import { T, TYPE } from '../tokens.js';
import { Icon, I, Btn, Chip, Card, SectionLabel, Sheet, Empty, useToast, haptic } from '../ui.js';
import type { ScreenProps } from '../types.js';

export function LauncherScreen({ store, setStore, setScreen }: ScreenProps) {
  const toast = useToast();
  const { apps, library } = store;
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const update = (id: string, patch: Partial<typeof apps[0]>) =>
    setStore(s => ({ ...s, apps: s.apps.map(a => a.id === id ? { ...a, ...patch } : a) }));

  const reorder = (fromIdx: number, toIdx: number) =>
    setStore(s => {
      const next = [...s.apps];
      const [moved] = next.splice(fromIdx, 1);
      if (moved) next.splice(toIdx, 0, moved);
      return { ...s, apps: next };
    });

  const remove = (id: string) => {
    const app = apps.find(a => a.id === id)!;
    setStore(s => ({ ...s, apps: s.apps.filter(a => a.id !== id) }));
    toast.show(`Removed "${app.name}" from Arthur's home grid`, {
      action: { label: 'UNDO', onClick: () => setStore(s => ({ ...s, apps: [...s.apps, app] })) },
    });
    haptic([10]);
  };

  const addFromLibrary = (item: typeof library[0]) => {
    const newApp = {
      id: item.id, name: item.name, icon: item.icon, bg: T.sageSoft,
      color: item.color, allowed: true, locked: false, limit: null, used: 0,
    };
    setStore(s => ({
      ...s,
      apps: [...s.apps, newApp],
      library: s.library.filter(l => l.id !== item.id),
    }));
    toast.show(`Added "${item.name}" to home grid`);
    haptic([8]);
  };

  const toggleLock = (id: string) => {
    const app = apps.find(a => a.id === id)!;
    update(id, { locked: !app.locked });
    toast.show(app.locked ? `${app.name} unlocked` : `${app.name} locked`);
    haptic([6]);
  };

  return (
    <div style={{ background: T.bg, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '4px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 2 }}>
          <button
            onClick={() => setScreen('home')}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 10, marginLeft: -8,
            }}
          >
            <Icon path={I.chevL} size={20} stroke={T.ink2} sw={2} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Arthur's Launcher</div>
            <div style={{ fontFamily: TYPE.display, fontSize: 22, color: T.ink, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1.1 }}>Home grid</div>
          </div>
        </div>
      </div>

      {/* Hint */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          background: T.sageSoft, border: `1px solid ${T.sage}33`,
          borderRadius: 14, padding: '12px 14px',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <div style={{ color: T.sageDeep, flexShrink: 0, marginTop: 1 }}>
            <Icon path={I.zap} size={16} sw={2} fill={T.sageDeep} />
          </div>
          <div>
            <div style={{ fontFamily: TYPE.sans, fontSize: 12.5, color: T.ink2, fontWeight: 600, letterSpacing: -0.1 }}>
              Changes appear on Arthur's phone within 60 seconds.
            </div>
            <div style={{ fontFamily: TYPE.sans, fontSize: 11.5, color: T.ink3, marginTop: 2, lineHeight: 1.4 }}>
              Drag to reorder. Tap an app to lock or unlock.
            </div>
          </div>
        </div>
      </div>

      {/* Current grid */}
      <SectionLabel action={<Chip color={T.sageDeep} bg={T.sageSoft}>{apps.length} apps · live</Chip>}>
        On Arthur's home
      </SectionLabel>

      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: 'linear-gradient(180deg, #F6F2EA 0%, #FFFFFF 100%)',
          borderRadius: 22, border: `1px solid ${T.line}`,
          padding: 16, boxShadow: T.shadow1,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {apps.map((app, idx) => (
              <div
                key={app.id}
                draggable
                onDragStart={e => { setDragging(idx); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={e => { e.preventDefault(); setDragOver(idx); }}
                onDragEnd={() => {
                  if (dragging !== null && dragOver !== null && dragging !== dragOver) {
                    reorder(dragging, dragOver);
                    haptic([4]);
                  }
                  setDragging(null); setDragOver(null);
                }}
                onClick={() => toggleLock(app.id)}
                style={{
                  background: app.bg, borderRadius: 16, padding: '12px 6px',
                  textAlign: 'center', cursor: 'grab',
                  border: `2px solid ${dragOver === idx && dragging !== null ? T.sage : 'transparent'}`,
                  opacity: dragging === idx ? 0.4 : 1,
                  position: 'relative', userSelect: 'none',
                  transition: 'transform 0.12s, opacity 0.15s',
                }}
              >
                <div style={{
                  fontSize: 24, color: app.color,
                  fontFamily: TYPE.display, fontWeight: 400,
                  marginBottom: 4, lineHeight: 1,
                }}>{app.icon}</div>
                <div style={{ fontFamily: TYPE.sans, fontSize: 10.5, color: T.ink2, fontWeight: 600, letterSpacing: -0.05 }}>{app.name}</div>
                {app.locked && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 18, height: 18, borderRadius: 9, background: T.ink,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon path={I.lock} size={10} stroke="#fff" sw={2.5} />
                  </div>
                )}
                {app.limit !== null && (
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    padding: '2px 5px', borderRadius: 5, background: 'rgba(31,27,22,0.85)',
                    fontFamily: TYPE.sans, fontSize: 8, fontWeight: 700, color: '#fff', letterSpacing: 0.3,
                  }}>{app.used}/{app.limit}m</div>
                )}
              </div>
            ))}
            <button
              onClick={() => setShowLibrary(true)}
              style={{
                background: 'transparent', border: `1.5px dashed ${T.line2}`,
                borderRadius: 16, padding: '12px 6px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 74,
              }}
            >
              <Icon path={I.plus} size={20} stroke={T.ink4} />
              <div style={{ fontFamily: TYPE.sans, fontSize: 10.5, color: T.ink4, fontWeight: 600, marginTop: 4 }}>Add</div>
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
            <div style={{ width: 64, height: 3, borderRadius: 2, background: T.line2 }} />
          </div>
        </div>
      </div>

      {/* Per-app controls */}
      <SectionLabel>App controls</SectionLabel>
      <div style={{ padding: '0 20px' }}>
        <Card noPad>
          {apps.map((app, i) => (
            <div key={app.id} style={{
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: i === apps.length - 1 ? 'none' : `1px solid ${T.line}`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, background: app.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: app.color, flexShrink: 0, fontFamily: TYPE.display,
              }}>{app.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: TYPE.display, fontSize: 15, color: T.ink, fontWeight: 500, letterSpacing: -0.2 }}>{app.name}</div>
                <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, marginTop: 2 }}>
                  {app.limit !== null ? `${app.used} / ${app.limit} min today` : `${app.used} min today · no limit`}
                </div>
              </div>
              <button
                onClick={() => toggleLock(app.id)}
                title={app.locked ? 'Unlock' : 'Lock'}
                style={{
                  width: 34, height: 34, borderRadius: 10, cursor: 'pointer',
                  background: app.locked ? T.ink : T.surface2,
                  color: app.locked ? '#fff' : T.ink3,
                  border: `1px solid ${app.locked ? T.ink : T.line}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon path={app.locked ? I.lock : I.unlock} size={14} sw={2} />
              </button>
              <button
                onClick={() => remove(app.id)}
                title="Remove"
                style={{
                  width: 34, height: 34, borderRadius: 10, cursor: 'pointer',
                  background: 'transparent', color: T.rose,
                  border: `1px solid ${T.roseSoft}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon path={I.trash} size={14} sw={2} />
              </button>
            </div>
          ))}
        </Card>
      </div>

      {/* Kiosk mode */}
      <SectionLabel>Kiosk mode</SectionLabel>
      <div style={{ padding: '0 20px 32px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, background: T.amberSoft,
              color: T.amber, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon path={I.lock} size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: TYPE.display, fontSize: 15, color: T.ink, fontWeight: 500 }}>Lock to one app</div>
              <div style={{ fontFamily: TYPE.sans, fontSize: 11.5, color: T.ink3, marginTop: 1 }}>For therapy sessions, focused activities</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="fill" size="sm" onClick={() => toast.show('Kiosk: Drawing only')}>Drawing only</Btn>
            <Btn kind="fill" size="sm" onClick={() => toast.show('Kiosk: YouTube only')}>YouTube only</Btn>
            <Btn kind="ghost" size="sm" icon={I.plus} onClick={() => toast.show('Choose an app to pin')}>Pick</Btn>
          </div>
        </Card>
      </div>

      {/* Library sheet */}
      {showLibrary && (
        <Sheet title="App library" onClose={() => setShowLibrary(false)}>
          <div style={{ fontFamily: TYPE.sans, fontSize: 12.5, color: T.ink3, lineHeight: 1.5, marginBottom: 12, letterSpacing: -0.05 }}>
            Apps installed on Arthur's phone. Approve to add to his home grid; unapproved apps stay hidden.
          </div>
          {library.length === 0 ? (
            <Empty title="All approved">Every installed app is on Arthur's home grid.</Empty>
          ) : library.map((item, i) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
              borderBottom: i === library.length - 1 ? 'none' : `1px solid ${T.line}`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, background: T.surface2,
                color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontFamily: TYPE.display,
              }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TYPE.display, fontSize: 15, color: T.ink, fontWeight: 500, letterSpacing: -0.2 }}>{item.name}</div>
                <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>{item.reason}</div>
              </div>
              {item.reason.startsWith('Available') ? (
                <Btn kind="sage" size="sm" icon={I.plus} onClick={() => addFromLibrary(item)}>Approve</Btn>
              ) : (
                <Chip color={T.ink3} bg={T.surface2}>Blocked</Chip>
              )}
            </div>
          ))}
        </Sheet>
      )}
    </div>
  );
}
