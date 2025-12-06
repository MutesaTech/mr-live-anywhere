import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={cn(
        "fixed top-16 left-1/2 z-50 -translate-x-1/2 animate-slide-up",
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-md",
        isOnline
          ? "bg-green-500/90 text-white"
          : "bg-destructive/90 text-destructive-foreground"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          Back online
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          You're offline - viewing cached content
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
