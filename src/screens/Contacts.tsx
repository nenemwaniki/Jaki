import { useState } from 'react';
import { T, TYPE } from '../tokens.js';
import { Icon, I, Avatar, Btn, Card, SectionLabel, Sheet, Header, useToast } from '../ui.js';
import type { ScreenProps, Contact } from '../types.js';

export function ContactsScreen({ store, setStore, setScreen }: ScreenProps) {
  const toast = useToast();
  const { contacts } = store;
  const [editing, setEditing] = useState<Partial<Contact> | null>(null);
  const [query, setQuery] = useState('');

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

  const save = (patch: Partial<Contact>) => {
    if (editing?.id) {
      setStore(s => ({ ...s, contacts: s.contacts.map(c => c.id === editing.id ? { ...c, ...patch } : c) }));
      toast.show(`Updated ${patch.name ?? ''}`);
    } else {
      const name = patch.name ?? '';
      setStore(s => ({
        ...s,
        contacts: [...s.contacts, { id: 'c' + Date.now(), star: false, phone: '', role: '', color: '#87A878', initials: name[0]?.toUpperCase() ?? '?', ...patch, name } as Contact],
      }));
      toast.show(`${patch.name ?? ''} added to Arthur's contacts`);
    }
    setEditing(null);
  };

  const remove = (id: string) => {
    const c = contacts.find(x => x.id === id)!;
    setStore(s => ({ ...s, contacts: s.contacts.filter(x => x.id !== id) }));
    toast.show(`Removed ${c.name}`, {
      action: { label: 'UNDO', onClick: () => setStore(s => ({ ...s, contacts: [...s.contacts, c] })) },
    });
    setEditing(null);
  };

  const toggleStar = (id: string) =>
    setStore(s => ({ ...s, contacts: s.contacts.map(c => c.id === id ? { ...c, star: !c.star } : c) }));

  return (
    <div style={{ background: T.bg, minHeight: '100%' }}>
      <Header
        title="Contacts"
        sub={`${contacts.length} people Arthur can call`}
        onBack={() => setScreen('home')}
        action={<Btn kind="sage" size="sm" icon={I.plus} onClick={() => setEditing({})}>Add</Btn>}
      />

      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12,
          padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icon path={I.search} size={15} stroke={T.ink3} />
          <input
            value={query} onChange={e => setQuery(e.target.value)} placeholder="Search"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: TYPE.sans, fontSize: 14, color: T.ink }}
          />
        </div>
      </div>

      <SectionLabel>On Arthur's contacts page</SectionLabel>
      <div style={{ padding: '0 20px 32px' }}>
        <Card noPad>
          {filtered.map((c, i) => (
            <div key={c.id} onClick={() => setEditing(c)} style={{
              padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: i === filtered.length - 1 ? 'none' : `1px solid ${T.line}`,
              cursor: 'pointer',
            }}>
              <Avatar name={c.name} color={c.color} size={46} initials={c.initials} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: TYPE.display, fontSize: 16, color: T.ink, fontWeight: 500, letterSpacing: -0.2 }}>{c.name}</span>
                  {c.star && <span style={{ color: T.amber, fontSize: 12 }}>★</span>}
                </div>
                <div style={{ fontFamily: TYPE.sans, fontSize: 12, color: T.ink3, marginTop: 1 }}>{c.role}</div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); toggleStar(c.id); }}
                style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: c.star ? T.amber : T.ink4, fontSize: 18 }}
              >★</button>
              <Icon path={I.chevR} size={14} stroke={T.ink4} />
            </div>
          ))}
        </Card>
      </div>

      {editing !== null && (
        <ContactEditor
          initial={editing}
          onSave={save}
          onDelete={editing.id ? () => remove(editing.id!) : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ContactEditor({ initial, onSave, onDelete, onClose }: {
  initial: Partial<Contact>;
  onSave: (patch: Partial<Contact>) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [n, setN] = useState(initial.name ?? '');
  const [r, setR] = useState(initial.role ?? '');
  const [p, setP] = useState(initial.phone ?? '');
  const [c, setC] = useState(initial.color ?? '#87A878');
  const palette = ['#87A878', '#C89B4A', '#6F8FA8', '#8A6E8C', '#B86B5E', '#5E7C52'];

  return (
    <Sheet title={initial.id ? 'Edit contact' : 'Add contact'} onClose={onClose}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'center' }}>
        <Avatar name={n || '?'} color={c} size={64} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 6 }}>Photo colour</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {palette.map(col => (
              <button key={col} onClick={() => setC(col)} style={{
                width: 28, height: 28, borderRadius: 14, background: col, cursor: 'pointer',
                border: c === col ? `3px solid ${T.ink}` : '2px solid transparent',
              }} />
            ))}
          </div>
          <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink4, marginTop: 8 }}>Real photo upload in v2</div>
        </div>
      </div>
      {[
        { k: 'Name', v: n, s: setN, ph: 'Jaki' },
        { k: 'Role', v: r, s: setR, ph: 'Primary caregiver' },
        { k: 'Phone number', v: p, s: setP, ph: '+254 712 000 000' },
      ].map(f => (
        <div key={f.k} style={{ marginBottom: 12 }}>
          <label style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>{f.k}</label>
          <input
            value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.ph}
            style={{
              width: '100%', padding: '12px 14px', marginTop: 6,
              border: `1.5px solid ${T.line}`, borderRadius: 12,
              fontSize: 15, fontFamily: TYPE.sans, color: T.ink, background: T.bg, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {onDelete && <Btn kind="dangerGhost" icon={I.trash} onClick={onDelete}>Delete</Btn>}
        <Btn
          kind="primary" full
          onClick={() => onSave({ name: n, role: r, phone: p, color: c, initials: n[0]?.toUpperCase() ?? '?' })}
          disabled={!n.trim()}
        >
          {initial.id ? 'Save changes' : "Add to Arthur's contacts"}
        </Btn>
      </div>
    </Sheet>
  );
}
