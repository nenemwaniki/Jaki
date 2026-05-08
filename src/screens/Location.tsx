import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useT, TYPE } from '../tokens.js';
import { Icon, I, Btn, Card, SectionLabel, Toggle, Header, useToast, Sheet } from '../ui.js';
import { supabase } from '../lib/supabase.js';
import { saveZone, deleteZone } from '../data.js';
import type { ScreenProps, Zone } from '../types.js';

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

const DEFAULT_LAT = -1.286389;
const DEFAULT_LNG = 36.817223;

export function LocationScreen({ store, setStore, setScreen }: ScreenProps) {
  const T = useT();
  const toast = useToast();
  const { zones } = store;
  const mapRef = useRef<HTMLDivElement>(null);
  const leaflet = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const [ping, setPing] = useState<LocationPing | null>(null);
  const [age, setAge] = useState<string>('—');
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

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

    markerRef.current = L.marker([DEFAULT_LAT, DEFAULT_LNG], { icon }).addTo(map);
    zonesLayerRef.current = L.layerGroup().addTo(map);
    leaflet.current = map;

    return () => {
      map.remove();
      leaflet.current = null;
    };
  }, []);

  useEffect(() => {
    if (!zonesLayerRef.current) return;
    zonesLayerRef.current.clearLayers();
    zones
      .filter((zone) => zone.lat !== undefined && zone.lng !== undefined)
      .forEach((zone) => {
        const center: L.LatLngExpression = [zone.lat!, zone.lng!];
        L.circle(center, {
          radius: zone.radius,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.08,
          weight: 2,
          opacity: zone.active ? 0.9 : 0.4,
        }).addTo(zonesLayerRef.current!);
        L.marker(center, {
          icon: L.divIcon({
            html: `<div style="
              width:16px;height:16px;border-radius:50%;
              background:${zone.color};
              border:2px solid #fff;
              box-shadow:0 1px 4px rgba(0,0,0,0.28)"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            className: '',
          }),
        }).addTo(zonesLayerRef.current!);
      });
  }, [zones]);

  const updateMarker = (nextPing: LocationPing) => {
    setPing(nextPing);
    const latlng: L.LatLngExpression = [nextPing.lat, nextPing.lng];
    markerRef.current?.setLatLng(latlng);
    circleRef.current?.remove();
    if (nextPing.accuracy) {
      circleRef.current = L.circle(latlng, {
        radius: nextPing.accuracy,
        color: '#87A878',
        fillColor: '#87A878',
        fillOpacity: 0.12,
        weight: 1.5,
      }).addTo(leaflet.current!);
    }
    leaflet.current?.flyTo(latlng, 16, { duration: 1.2 });
    if (nextPing.at) {
      const diff = Math.round((Date.now() - new Date(nextPing.at).getTime()) / 60000);
      setAge(diff < 1 ? 'Just now' : `${diff} min ago`);
    }
  };

  const fetchLatestPing = async () => {
    const { data } = await supabase
      .from('location_pings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (data) {
      updateMarker({ lat: data.lat, lng: data.lng, accuracy: data.accuracy, at: data.created_at });
    }
  };

  useEffect(() => {
    fetchLatestPing();
  }, []);

  useEffect(() => {
    const ch = supabase.channel('location-live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'location_pings',
      }, (payload) => {
        const row = payload.new as any;
        updateMarker({ lat: row.lat, lng: row.lng, accuracy: row.accuracy, at: row.created_at });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const toggle = (id: string) =>
    setStore((s) => ({ ...s, zones: s.zones.map((z) => z.id === id ? { ...z, active: !z.active } : z) }));

  const active = zones.find((z) => z.inside && z.active);

  return (
    <div style={{ background: T.bg, minHeight: '100%' }}>
      <Header title="Location" sub="Arthur's live position" onBack={() => setScreen('home')} />

      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          position: 'relative', height: 300, borderRadius: 20, overflow: 'hidden',
          border: `1px solid ${T.line}`,
        }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

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

      <SectionLabel action={
        <Btn
          kind="ghost"
          size="sm"
          icon={I.plus}
          onClick={() => setEditingZone({
            id: `z${Date.now()}`,
            name: 'New zone',
            lat: ping?.lat ?? DEFAULT_LAT,
            lng: ping?.lng ?? DEFAULT_LNG,
            radius: 120,
            color: '#87A878',
            active: true,
            inside: false,
          })}
        >
          New zone
        </Btn>
      }>
        Safe zones
      </SectionLabel>
      <div style={{ padding: '0 20px 32px' }}>
        <Card noPad>
          {zones.map((zone, index) => (
            <div key={zone.id} style={{
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: index === zones.length - 1 ? 'none' : `1px solid ${T.line}`,
            }}>
              <div style={{ width: 14, height: 14, borderRadius: 7, background: zone.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TYPE.display, fontSize: 15, color: T.ink, fontWeight: 500, letterSpacing: -0.2 }}>{zone.name}</div>
                <div style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, marginTop: 1 }}>
                  {zone.radius}m radius · {zone.inside ? 'Arthur is inside' : 'Arthur is outside'}
                </div>
              </div>
              <button
                onClick={() => setEditingZone(zone)}
                style={{
                  width: 34, height: 34, borderRadius: 10, cursor: 'pointer',
                  background: 'transparent', color: T.ink4,
                  border: `1px solid ${T.line}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon path={I.edit} size={14} sw={2} />
              </button>
              <Toggle on={zone.active} onChange={() => toggle(zone.id)} />
            </div>
          ))}
        </Card>
      </div>

      {editingZone && (
        <ZoneEditor
          initial={editingZone}
          onClose={() => setEditingZone(null)}
          onSave={(nextZone) => {
            setStore((s) => {
              const exists = s.zones.some((z) => z.id === nextZone.id);
              return {
                ...s,
                zones: exists
                  ? s.zones.map((z) => z.id === nextZone.id ? nextZone : z)
                  : [...s.zones, nextZone],
              };
            });
            saveZone(nextZone).catch(() => {});
            toast.show(`Saved ${nextZone.name}`);
            setEditingZone(null);
          }}
          onDelete={(id) => {
            setStore((s) => ({ ...s, zones: s.zones.filter((z) => z.id !== id) }));
            deleteZone(id).catch(() => {});
            toast.show('Zone deleted');
            setEditingZone(null);
          }}
        />
      )}
    </div>
  );
}

function ZoneEditor({ initial, onSave, onDelete, onClose }: {
  initial: Zone;
  onSave: (zone: Zone) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const T = useT();
  const [name, setName] = useState(initial.name);
  const [radius, setRadius] = useState(initial.radius);
  const [center, setCenter] = useState({
    lat: initial.lat ?? DEFAULT_LAT,
    lng: initial.lng ?? DEFAULT_LNG,
  });
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const pinRef = useRef<L.Marker | null>(null);
  const radiusRef = useRef<L.Circle | null>(null);
  // Stable ref so the click handler always sees latest center without re-mounting the map
  const centerRef = useRef(center);
  useEffect(() => { centerRef.current = center; }, [center]);

  // Initialise map once — empty deps prevents remount on every pin move
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const { lat, lng } = centerRef.current;
    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    pinRef.current = L.marker([lat, lng]).addTo(map);
    radiusRef.current = L.circle([lat, lng], {
      radius: initial.radius,
      color: initial.color,
      fillColor: initial.color,
      fillOpacity: 0.1,
      weight: 2,
    }).addTo(map);
    map.on('click', (event: L.LeafletMouseEvent) => {
      setCenter({ lat: event.latlng.lat, lng: event.latlng.lng });
    });
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update pin + circle when center or radius changes (no map remount)
  useEffect(() => {
    const latlng: L.LatLngExpression = [center.lat, center.lng];
    pinRef.current?.setLatLng(latlng);
    radiusRef.current?.setLatLng(latlng);
    radiusRef.current?.setRadius(radius);
    mapInstance.current?.panTo(latlng, { animate: true });
  }, [center, radius]);

  const isNew = !initial.lat && !initial.lng;

  return (
    <Sheet title={isNew ? 'New zone' : 'Edit zone'} onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px', marginTop: 6,
            border: `1.5px solid ${T.line}`, borderRadius: 12, fontSize: 16,
            fontFamily: TYPE.display, color: T.ink, background: T.bg, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Centre pin — tap map to move</label>
        <div
          ref={mapRef}
          style={{ width: '100%', height: 220, marginTop: 8, borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.line}` }}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontFamily: TYPE.sans, fontSize: 11, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Radius: {radius}m</label>
        <input
          type="range"
          min="30"
          max="500"
          step="10"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          style={{ width: '100%', marginTop: 10 }}
        />
      </div>
      <Btn
        kind="primary"
        full
        disabled={!name.trim()}
        onClick={() => onSave({ ...initial, name: name.trim(), lat: center.lat, lng: center.lng, radius })}
      >
        Save zone
      </Btn>
      {!isNew && (
        <button
          onClick={() => onDelete(initial.id)}
          style={{
            width: '100%', marginTop: 10, padding: '13px',
            background: 'transparent', border: `1.5px solid ${T.rose}55`,
            borderRadius: 12, cursor: 'pointer',
            fontFamily: TYPE.sans, fontSize: 14, fontWeight: 600, color: T.rose,
          }}
        >
          Delete zone
        </button>
      )}
    </Sheet>
  );
}
