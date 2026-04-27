import { useState } from 'react';
import { T, TYPE } from '../tokens.js';
import { Icon, I, Btn, Card, Sheet, Header, useToast } from '../ui.js';
import type { ScreenProps, RoutineItem } from '../types.js';

export function ActivitiesScreen({ store, setStore, setScreen }: ScreenProps) {
  const toast = useToast();
  const { routine } = store;
  const [editing, setEditing] = useState<Partial<RoutineItem> | null>(null);

  const save = (patch: Partial<RoutineItem>) => {
    if (editing?.id) {
      setStore(s => ({ ...s, routine: s.routine.map(r => r.id === editing.id ? { ...r, ...patch } : r) }));
      toast.show('Task updated');
    } else {
      setStore(s => ({
        ...s,
        routine: [...s.routine, { id: 'r' + Date.now(), state: 'next', dur: 30, ...patch } as RoutineItem],
      }));
      toast.show("Task added to Arthur's routine");
    }
    setEditing(null);
  };

  const remove = (id: string) => {
    const r = routine.find(x => x.id === id)!;
    setStore(s => ({ ...s, routine: s.routine.filter(x => x.id !== id) }));
    toast.show(`Removed "${r.title}"`, {
      action: { label: 'UNDO', onClick: () => setStore(s => ({ ...s, routine: [...s.routine, r] })) },
    });
    setEditing(null);
  };

  const groups = [
    { key: 'done' as const,    label: 'Completed' },
    { key: 'current' as const, label: 'Happening now' },
    { key: 'next' as const,    label: 'Coming up' },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100%' }}>
      <Header
        title="Routine"
        sub="Tuesday, 14 April"
        onBack={() => setScreen('home')}
        action={<Btn kind="sage" size="sm" icon={I.plus} onClick={() => setEditing({})}>Add</Btn>}
      />

      <div style={{ padding: '16px 20px 32px' }}>
        {groups.map(g => {
          const items = routine.filter(r => r.state === g.key);
          if (items.length === 0) return null;
          return (
            <div key={g.key} style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: TYPE.sans, fontSize: 11, fontWeight: 700, letterSpacing: 0.15, textTransform: 'uppercase', color: T.ink3, marginBottom: 8, padding: '0 4px' }}>
                {g.label}
              </div>
              <Card noPad>
                {items.map((r, i) => (
                  <div key={r.id} onClick={() => setEditing(r)} style={{
                    padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12,
                    borderBottom: i === items.length - 1 ? 'none' : `1px solid ${T.line}`,
                    cursor: 'pointer',
                    background: r.state === 'current' ? `${T.amberSoft}70` : 'transparent',
                    opacity: r.state === 'done' ? 0.55 : 1,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: r.state === 'current' ? T.amber : T.surface2,
                      color: r.state === 'current' ? '#fff' : T.ink3,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                    }}>
                      {r.state === 'done'
                        ? <Icon path={I.check} size={18} stroke={T.sageDeep} sw={2.5} />
                        : r.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: TYPE.display, fontSize: 15, color: T.ink, fontWeight: 500, letterSpacing: -0.2,
                        textDecoration: r.state === 'done' ? 'line-through' : 'none',
                      }}>{r.title}</div>
                      <div style={{ fontFamily: TYPE.sans, fontSize: 11.5, color: T.ink3, marginTop: 1 }}>{r.note}</div>
                    </div>
                    <div style={{ fontFamily: TYPE.display, fontSize: 14, color: T.ink2, fontWeight: 500 }}>{r.time}</div>
                  </div>
                ))}
              </Card>
            </div>
          );
        })}
      </div>

      {editing !== null && (
        <RoutineEditor
          initial={editing}
          onSave={save}
          onDelete={editing.id ? () => remove(editing.id!) : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function RoutineEditor({ initial, onSave, onDelete, onClose }: {
  initial: Partial<RoutineItem>;
  onSave: (patch: Partial<RoutineItem>) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [t, setT] = useState(initial.title ?? '');
  const [n, setN] = useState(initial.note ?? '');
  const [time, setTime] = useState(initial.time ?? '09:00');
  const [em, setEm] = useState(initial.emoji ?? '📌');
  const emojis = ['🌅','🥣','🎨','🚶','🍽','📺','🧩','🌙','📚','💊','🛁','🎮'];

  return (
    <Sheet title={initial.id ? 'Edit task' : 'Add task'} onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Title</label>
        <input
          value={t} onChange={e => setT(e.target.value)} placeholder="e.g. Walk outside"
          style={{ width: '100%', padding: '12px 14px', marginTop: 6, border: `1.5px solid ${T.line}`, borderRadius: 12, fontSize: 16, fontFamily: TYPE.display, color: T.ink, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Note for Arthur</label>
        <input
          value={n} onChange={e => setN(e.target.value)} placeholder="Short description"
          style={{ width: '100%', padding: '12px 14px', marginTop: 6, border: `1.5px solid ${T.line}`, borderRadius: 12, fontSize: 14, fontFamily: TYPE.sans, color: T.ink, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Time</label>
          <input
            type="time" value={time} onChange={e => setTime(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', marginTop: 6, border: `1.5px solid ${T.line}`, borderRadius: 12, fontSize: 15, fontFamily: TYPE.sans, color: T.ink, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Symbol</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginTop: 8 }}>
          {emojis.map(e => (
            <button key={e} onClick={() => setEm(e)} style={{
              aspectRatio: '1/1', borderRadius: 10, fontSize: 22, cursor: 'pointer',
              background: em === e ? T.sage : T.surface2,
              border: em === e ? 'none' : `1px solid ${T.line}`,
            }}>{e}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {onDelete && <Btn kind="dangerGhost" icon={I.trash} onClick={onDelete}>Delete</Btn>}
        <Btn kind="primary" full disabled={!t.trim()} onClick={() => onSave({ title: t, note: n, time, emoji: em })}>Save</Btn>
      </div>
    </Sheet>
  );
}
