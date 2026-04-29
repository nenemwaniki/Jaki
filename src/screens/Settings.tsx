import { useState, type ReactNode } from 'react';
import { useT, TYPE } from '../tokens.js';
import { Icon, I, Avatar, Btn, Card, SectionLabel, Toggle, Header, useToast } from '../ui.js';
import type { ScreenProps } from '../types.js';

interface SettingsExtra { dark: boolean; setDark: (v: boolean) => void; }

export function SettingsScreen({ store, setScreen, dark, setDark }: ScreenProps & SettingsExtra) {
  const T = useT();
  const toast = useToast();
  const { alerts } = store;
  const [hapticsOn, setH] = useState(true);
  const [offline, setOff] = useState(true);
  const [ttsOn, setTts] = useState(true);

  return (
    <div style={{ background: T.bg, minHeight: '100%' }}>
      <Header title="Settings" onBack={() => setScreen('home')} />

      <div style={{ padding: '16px 20px 0' }}>
        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name="Jaki" color={T.amber} size={48} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: TYPE.display, fontSize: 17, color: T.ink, fontWeight: 500, letterSpacing: -0.2 }}>Jaki Mwangi</div>
            <div style={{ fontFamily: TYPE.sans, fontSize: 12, color: T.ink3, marginTop: 1 }}>Primary caregiver · paired 4 weeks ago</div>
          </div>
          <Btn kind="ghost" size="sm">Profile</Btn>
        </Card>
      </div>

      <SectionLabel>SOS alert history</SectionLabel>
      <div style={{ padding: '0 20px' }}>
        <Card noPad>
          {alerts.map((a, i) => (
            <div key={a.id} style={{
              padding: '14px 16px', display: 'flex', gap: 12,
              borderBottom: i === alerts.length - 1 ? 'none' : `1px solid ${T.line}`,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: a.kind === 'sos' ? T.roseSoft : a.kind === 'limit' ? T.amberSoft : T.skySoft,
                color: a.kind === 'sos' ? T.rose : a.kind === 'limit' ? T.amber : T.sky,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon path={a.kind === 'sos' ? I.sos : a.kind === 'limit' ? I.timer : I.shield} size={15} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TYPE.display, fontSize: 14.5, color: T.ink, fontWeight: 500 }}>{a.detail}</div>
                <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink4, marginTop: 2 }}>{a.at} · {a.resolved ? 'Resolved' : 'Open'}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <SectionLabel>Arthur's phone</SectionLabel>
      <div style={{ padding: '0 20px' }}>
        <Card noPad>
          <SRow label="Emergency shake to call you" sub="3-shake triggers call to Jaki">
            <Toggle on={true} onChange={() => toast.show('Reserved — always on')} />
          </SRow>
          <SRow label="Haptic feedback on taps" sub="Tactile response, no visual needed">
            <Toggle on={hapticsOn} onChange={setH} />
          </SRow>
          <SRow label="Speak message aloud (TTS)" sub="Read AAC cards before sending">
            <Toggle on={ttsOn} onChange={setTts} />
          </SRow>
          <SRow label="Offline-first" sub="Queue changes when no signal" last>
            <Toggle on={offline} onChange={setOff} />
          </SRow>
        </Card>
      </div>

      <SectionLabel>Your app</SectionLabel>
      <div style={{ padding: '0 20px 40px' }}>
        <Card noPad>
          <SRow label="Dark mode" sub="Easier on eyes at night">
            <Toggle on={dark} onChange={setDark} />
          </SRow>
          <SRow label="Large tap targets" sub="Helpful one-handed">
            <Toggle on={true} onChange={() => {}} />
          </SRow>
          <SRow label="Pair another caregiver" sub="Share access with family" last>
            <Btn kind="ghost" size="sm" onClick={() => toast.show('Invite sent')}>Invite</Btn>
          </SRow>
        </Card>
        <div style={{ fontFamily: TYPE.sans, fontSize: 10.5, color: T.ink4, textAlign: 'center', marginTop: 16, letterSpacing: 0.1 }}>
          ArthurOS Companion · v1.0 · Hackcessible 2026
        </div>
      </div>
    </div>
  );
}

function SRow({ label, sub, children, last }: { label: string; sub?: string; children: ReactNode; last?: boolean }) {
  const T = useT();
  return (
    <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: last ? 'none' : `1px solid ${T.line}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: TYPE.sans, fontSize: 14, color: T.ink, fontWeight: 500, letterSpacing: -0.1 }}>{label}</div>
        {sub && <div style={{ fontFamily: TYPE.sans, fontSize: 11.5, color: T.ink3, marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}
