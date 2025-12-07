import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType: string | null;
  downlink: number | null;
}

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    effectiveType: null,
    downlink: null,
  });

  const updateNetworkStatus = useCallback(() => {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

    const isSlowConnection = connection ? 
      connection.effectiveType === '2g' || 
      connection.effectiveType === 'slow-2g' ||
      (connection.downlink && connection.downlink < 1.5) : false;

    setStatus({
      isOnline: navigator.onLine,
      isSlowConnection,
      effectiveType: connection?.effectiveType || null,
      downlink: connection?.downlink || null,
    });
  }, []);

  useEffect(() => {
    updateNetworkStatus();

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [updateNetworkStatus]);

  return status;
};
