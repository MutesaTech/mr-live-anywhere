import { useEffect, useState } from 'react';
import { Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

const LowBandwidthToast = () => {
  const { isSlowConnection, effectiveType } = useNetworkStatus();
  const [showToast, setShowToast] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isSlowConnection && !dismissed) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isSlowConnection, dismissed]);

  if (!showToast) return null;

  return (
    <div 
      className={cn(
        "fixed top-20 left-1/2 -translate-x-1/2 z-50",
        "glass rounded-full px-4 py-2 shadow-strong",
        "flex items-center gap-2 text-caption",
        "animate-fade-in"
      )}
      onClick={() => {
        setShowToast(false);
        setDismissed(true);
      }}
    >
      <Wifi className="h-4 w-4 text-amber-500" />
      <span>Optimized for low bandwidth</span>
    </div>
  );
};

export default LowBandwidthToast;
