import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useT, TYPE } from '../tokens.js';
import { Icon, I, Btn, Card, SectionLabel, Toggle, Header, useToast } from '../ui.js';
import { supabase } from '../lib/supabase.js';
import type { ScreenProps } from '../types.js';

// Fix Leaflet's broken default icon paths when bundled with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationPing {
  lat: number;
  lng: number;
  accuracy?: number;
  at?: string;
}

export function LocationScreen({ store, setStore, setScreen }: ScreenProps) {
  const T = useT();
  const toast = useToast();
  const { zones } = store;
  const mapRef   = useRef<HTMLDivElement>(null);
  const leaflet  = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [ping, setPing] = useState<LocationPing | null>(null);
  const [age, setAge]   = useState<string>('—');

  // Nairobi default if no ping yet
  const DEFAULT_LAT = -1.286389;
  const DEFAULT_LNG = 36.817223;

  // Build the map once
  useEffect(() => {
    if (!mapRef.current || leaflet.current) return;
    const map = L.map(mapRef.current, {
      center: [DEFAULT_LAT, DEFAULT_LNG],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Custom Arthur marker icon
    const icon = L.divIcon({
      html: `<div style="
        width:40px;height:40px;border-radius:50%;
        background:#87A878;border:3px solid #fff;
        display:flex;align-items:center;justify-content:center;
        font-family:Georgia,serif;font-size:16px;font-weight:700;color:#fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.3)">A</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      className: '',
    });

    const marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { icon }).addTo(map);
    markerRef.current = marker;
    leaflet.current = map;

    return () => { map.remove(); leaflet.current = null; };
  }, []);

  // Load latest ping from Supabase
  const fetchLatestPing = async () => {
    const { data } = await supabase
      .from('location_pings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (data) updateMarker({ lat: data.lat, lng: data.lng, accuracy: data.accuracy, at: data.created_at });
  };

  const updateMarker = (p: LocationPing) => {
    setPing(p);
    const latlng: L.LatLngExpression = [p.lat, p.lng];
    markerRef.current?.setLatLng(latlng);
    circleRef.current?.remove();
    if (p.accuracy) {
      circleRef.current = L.circle(latlng, {
        radius: p.accuracy,
        color: '#87A878',
        fillColor: '#87A878',
        fillOpacity: 0.12,
        weight: 1.5,
      }).addTo(leaflet.current!);
    }
    leaflet.current?.flyTo(latlng, 16, { duration: 1.2 });
    if (p.at) {
      const diff = Math.round((Date.now() - new Date(p.at).getTime()) / 60000);
      setAge(diff < 1 ? 'Just now' : `${diff} min ago`);
    }
  };

  useEffect(() => { fetchLatestPing(); }, []);

  // Realtime subscription
  useEffect(() => {
    const ch = supabase.channel('location-live')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'location_pings',
      }, payload => {
        const r = payload.new as any;
        updateMarker({ lat: r.lat, lng: r.lng, accuracy: r.accuracy, at: r.created_at });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const toggle = (id: string) =>
    setStore(s => ({ ...s, zones: s.zones.map(z => z.id === id ? { ...z, active: !z.active } : z) }));

  const active = zones.find(z => z.inside && z.active);

  return (
    <div style={{ background: T.bg, minHeight: '100%' }}>
      <Header title="Location" sub="Arthur's live position" onBack={() => setScreen('home')} />

      {/* Leaflet Map */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          position: 'relative', height: 300, borderRadius: 20, overflow: 'hidden',
          border: `1px solid ${T.line}`,
        }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {/* Overlay info card */}
          <div style={{
            position: 'absolute', left: 12, right: 12, bottom: 12, zIndex: 1000,
            background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
            border: `1px solid ${T.line}`,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: TYPE.sans, fontSize: 10, color: T.sageDeep, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                {active ? 'Inside safe zone' : ping ? 'Outside safe zone' : 'Waiting for ping…'}
              </div>
              <div style={{ fontFamily: TYPE.display, fontSize: 17, color: T.ink, fontWeight: 500, letterSpacing: -0.3, marginTop: 1 }}>
                {active?.name ?? (ping ? 'Unknown area' : '—')}
              </div>
              <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>
                {ping?.accuracy ? `±${Math.round(ping.accuracy)}m accuracy · ` : ''}{age}
              </div>
            </div>
            <Btn kind="fill" size="sm" icon={I.refresh} onClick={() => { fetchLatestPing(); toast.show('Refreshed'); }}>
              Refresh
            </Btn>
          </div>
        </div>
      </div>

      <SectionLabel action={<Btn kind="ghost" size="sm" icon={I.plus} onClick={() => toast.show('Zone editing coming soon')}>New zone</Btn>}>
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
