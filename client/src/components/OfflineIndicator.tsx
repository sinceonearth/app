import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [showToast, setShowToast] = useState(false);
  const [hasTransitioned, setHasTransitioned] = useState(false);

  useEffect(() => {
    // Show toast when status changes after initial load
    if (hasTransitioned) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), isOnline ? 3000 : 5000);
      return () => clearTimeout(timer);
    } else {
      // Mark that we've seen the initial state
      setHasTransitioned(true);
    }
  }, [isOnline, hasTransitioned]);

  return (
    <>
      {/* Toast notification on status change */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top">
          <div
            className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-lg border ${
              isOnline
                ? 'bg-green-500 text-white border-green-600'
                : 'bg-orange-500 text-white border-orange-600'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5" />
                <span className="font-semibold">Back Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5" />
                <span className="font-semibold">You're Offline</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Persistent badge when offline */}
      {!isOnline && (
        <div className="fixed top-20 right-4 z-[9998]">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/90 text-white text-sm shadow-lg backdrop-blur-sm border border-orange-600/50">
            <WifiOff className="w-4 h-4" />
            <span className="font-medium">Offline Mode</span>
          </div>
        </div>
      )}
    </>
  );
}
