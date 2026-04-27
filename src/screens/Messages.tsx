import { useState } from 'react';
import { T, TYPE } from '../tokens.js';
import { Icon, I, Btn, Card, Sheet, Empty, Header, useToast } from '../ui.js';
import type { ScreenProps, MsgCard } from '../types.js';

export function MessagesScreen({ store, setStore, setScreen }: ScreenProps) {
  const toast = useToast();
  const { feed, messages } = store;
  const [tab, setTab] = useState<'inbox' | 'library'>('inbox');
  const [editing, setEditing] = useState<{ category: string; id?: string; text?: string; emoji?: string } | null>(null);

  const aacFeed = feed.filter(f => f.type === 'aac');

  const markRead = (id: string) =>
    setStore(s => ({ ...s, feed: s.feed.map(f => f.id === id ? { ...f, read: true } : f) }));

  const markAll = () => {
    setStore(s => ({ ...s, feed: s.feed.map(f => ({ ...f, read: true })) }));
    toast.show('All messages marked read');
  };

  const saveCard = (category: string, id: string | undefined, patch: Partial<MsgCard>) => {
    setStore(s => {
      const cat = s.messages[category as keyof typeof s.messages] ?? [];
      if (id) {
        return { ...s, messages: { ...s.messages, [category]: cat.map(c => c.id === id ? { ...c, ...patch } : c) } };
      }
      return { ...s, messages: { ...s.messages, [category]: [...cat, { id: 'm' + Date.now(), text: '', emoji: '😊', ...patch }] } };
    });
    toast.show(id ? 'Card updated' : "Card added to Arthur's library");
  };

  const delCard = (category: string, id: string) => {
    const cat = store.messages[category as keyof typeof store.messages] ?? [];
    const card = cat.find(c => c.id === id);
    if (!card) return;
    setStore(s => ({
      ...s,
      messages: { ...s.messages, [category]: (s.messages[category as keyof typeof s.messages] ?? []).filter(c => c.id !== id) },
    }));
    toast.show(`Removed "${card.text}"`, {
      action: {
        label: 'UNDO',
        onClick: () => setStore(s => ({
          ...s,
          messages: { ...s.messages, [category]: [...(s.messages[category as keyof typeof s.messages] ?? []), card] },
        })),
      },
    });
  };

  return (
    <div style={{ background: T.bg, minHeight: '100%' }}>
      <Header
        title="Messages"
        sub="From Arthur's AAC page"
        onBack={() => setScreen('home')}
        action={
          tab === 'inbox'
            ? <Btn kind="ghost" size="sm" onClick={markAll}>Mark all read</Btn>
            : <Btn kind="sage" size="sm" icon={I.plus} onClick={() => setEditing({ category: 'daily' })}>New</Btn>
        }
      />

      {/* Tabs */}
      <div style={{ padding: '8px 20px 0', display: 'flex', gap: 6 }}>
        {(['inbox', 'library'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 12px', borderRadius: 11,
            background: tab === t ? T.ink : 'transparent',
            color: tab === t ? '#fff' : T.ink3,
            border: tab === t ? 'none' : `1px solid ${T.line}`,
            fontFamily: TYPE.sans, fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: -0.1,
          }}>
            {t === 'inbox' ? `Inbox (${aacFeed.filter(f => !f.read).length})` : 'Card library'}
          </button>
        ))}
      </div>

      {tab === 'inbox' ? (
        <div style={{ padding: '16px 20px 32px' }}>
          {aacFeed.length === 0 ? (
            <Card><Empty title="Inbox clear">Arthur hasn't tapped any cards yet today.</Empty></Card>
          ) : (
            <Card noPad>
              {aacFeed.map((m, i) => (
                <div key={m.id} onClick={() => markRead(m.id)} style={{
                  padding: '16px', display: 'flex', gap: 14, alignItems: 'flex-start',
                  borderBottom: i === aacFeed.length - 1 ? 'none' : `1px solid ${T.line}`,
                  background: m.read ? 'transparent' : `${T.sageSoft}60`,
                  cursor: 'pointer', transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 14, background: T.amberSoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>{m.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, lineHeight: 1 }}>
                      <span style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.2, textTransform: 'uppercase' }}>
                        Arthur → {m.to}
                      </span>
                      {!m.read && <div style={{ width: 7, height: 7, borderRadius: 4, background: T.rose, flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontFamily: TYPE.display, fontSize: 17, color: T.ink, fontWeight: 500, letterSpacing: -0.3, lineHeight: 1.25, wordBreak: 'break-word' }}>
                      "{m.card}"
                    </div>
                    <div style={{ fontFamily: TYPE.sans, fontSize: 11.5, color: T.ink3, marginTop: 5 }}>{m.at}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toast.show(`Calling ${m.to ?? 'Jaki'}…`); }}
                    style={{
                      width: 36, height: 36, borderRadius: 10, background: T.sage, color: '#fff',
                      border: 'none', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Icon path={I.phone} size={15} stroke="#fff" sw={2} />
                  </button>
                </div>
              ))}
            </Card>
          )}
        </div>
      ) : (
        <div style={{ padding: '16px 20px 32px' }}>
          {(Object.entries(messages) as [string, MsgCard[]][]).map(([cat, cards]) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                marginBottom: 8, padding: '0 4px',
              }}>
                <div style={{ fontFamily: TYPE.sans, fontSize: 11, fontWeight: 700, letterSpacing: 0.15, textTransform: 'uppercase', color: T.ink3 }}>
                  {cat === 'urgent' ? '🆘 Urgent' : cat === 'daily' ? '💬 Daily' : '❤️ Social'}
                </div>
                <span
                  onClick={() => setEditing({ category: cat })}
                  style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.sageDeep, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.1 }}
                >+ ADD</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {cards.map(c => (
                  <div key={c.id} onClick={() => setEditing({ category: cat, id: c.id, text: c.text, emoji: c.emoji })} style={{
                    background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14,
                    padding: 14, cursor: 'pointer', position: 'relative',
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{c.emoji}</div>
                    <div style={{ fontFamily: TYPE.display, fontSize: 13, color: T.ink2, fontWeight: 500, letterSpacing: -0.1, lineHeight: 1.3 }}>{c.text}</div>
                    <button
                      onClick={e => { e.stopPropagation(); delCard(cat, c.id); }}
                      style={{
                        position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 6,
                        background: 'transparent', border: 'none', color: T.ink4, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Icon path={I.x} size={12} sw={2} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <CardEditor
          category={editing.category}
          id={editing.id}
          text={editing.text}
          emoji={editing.emoji}
          onSave={patch => { saveCard(editing.category, editing.id, patch); setEditing(null); }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function CardEditor({ id, text, emoji, onSave, onClose }: {
  category: string;
  id?: string; text?: string; emoji?: string;
  onSave: (patch: Pick<MsgCard, 'text' | 'emoji'>) => void;
  onClose: () => void;
}) {
  const [t, setT] = useState(text ?? '');
  const [e, setE] = useState(emoji ?? '😊');
  const emojiChoices = ['😊','😴','🤒','🍽','🏠','🙏','😄','🤗','😰','😣','🎨','📚','🎮','👋','❤️','💧'];

  return (
    <Sheet title={id ? 'Edit card' : 'New card'} onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
          What Arthur will say
        </label>
        <input
          value={t} onChange={ev => setT(ev.target.value)}
          autoFocus placeholder="e.g. I want water"
          style={{
            width: '100%', padding: '12px 14px', marginTop: 6,
            border: `1.5px solid ${T.line}`, borderRadius: 12, fontSize: 16,
            fontFamily: TYPE.display, color: T.ink, background: T.bg, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
          Symbol
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, marginTop: 8 }}>
          {emojiChoices.map(em => (
            <button key={em} onClick={() => setE(em)} style={{
              aspectRatio: '1/1', borderRadius: 10, fontSize: 20, cursor: 'pointer',
              background: e === em ? T.sage : T.surface2,
              border: e === em ? 'none' : `1px solid ${T.line}`,
            }}>{em}</button>
          ))}
        </div>
      </div>
      <Btn kind="primary" full size="lg" disabled={!t.trim()} onClick={() => onSave({ text: t.trim(), emoji: e })}>
        Save to Arthur's library
      </Btn>
    </Sheet>
  );
}
