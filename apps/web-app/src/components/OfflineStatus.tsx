'use client';

import { useEffect, useState } from 'react';

export function OfflineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online) return null;
  return (
    <div role="status" className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-200 shadow-xl">
      You are offline. Changes will resume when the connection returns.
    </div>
  );
}
