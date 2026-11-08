import React from 'react';
import { useOnlineStatus } from '../lib/useOnlineStatus.js';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-18 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full bg-amber-500/95 backdrop-blur-md px-4 py-2 text-xs font-semibold text-slate-950 shadow-2xl border border-amber-300 animate-bounce"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Offline Mode — Cached pages available. Live voting resumes when connected.</span>
    </div>
  );
};
