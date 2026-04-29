import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { SEED } from './data.js';
import { ArthurPhone } from './components/ArthurPhone.js';
import { ToastProvider } from './ui.js';
import type { Store } from './types.js';

const STORE_KEY = 'jaki_store';
const SOS_KEY = 'jaki_sos';

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {}
  return SEED;
}

function ArthurApp() {
  const [store, setStore] = useState<Store>(loadStore);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORE_KEY && e.newValue) {
        try { setStore(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const fireSos = () => {
    const zone = store.zones.find(z => z.inside)?.name ?? 'Home';
    localStorage.setItem(SOS_KEY, JSON.stringify({
      at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      zone,
    }));
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
