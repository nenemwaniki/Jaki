import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { FALLBACK_SEED, loadStore } from './data.js';
import { ArthurPhone } from './components/ArthurPhone.js';
import { ToastProvider } from './ui.js';
import type { Store } from './types.js';

const STORE_KEY = 'jaki_store';
const SOS_KEY = 'jaki_sos';

function loadLocalStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {}
  return FALLBACK_SEED;
}

function ArthurApp() {
  const [store, setStore] = useState<Store>(loadLocalStore);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loadStore()
      .then((data) => {
        if (!alive) return;
        setStore(data);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORE_KEY && e.newValue) {
        try {
          setStore(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading demo data from Supabase…</div>;

  const fireSos = () => {
    const zone = store.zones.find((z) => z.inside)?.name ?? 'Home';
    localStorage.setItem(
      SOS_KEY,
      JSON.stringify({
        at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        zone,
      }),
    );
  };

  return <ArthurPhone store={store} setStore={setStore} onSos={fireSos} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <ArthurApp />
    </ToastProvider>
  </StrictMode>,
);
