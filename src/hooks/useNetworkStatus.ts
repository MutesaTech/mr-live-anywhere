import { useState, useEffect, useCallback, useRef } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType: string | null;
  downlink: number | null;
}

/** Minimal shape of the Network Information API (not in every TS lib). */
interface NetworkInformationLike {
  effectiveType?: string;
  downlink?: number;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

const getConnection = (): NetworkInformationLike | null => {
  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
};

/**
 * Lightweight connectivity probe — resolves when a real network response
 * comes back, rejects when there is none.
 *
 * Same-origin on purpose: it is NOT matched by any Service Worker runtime
 * cache (so the SW can't fake a success from cache), it has no external
 * dependency, and `cache: 'no-store'` forces the network round-trip.
 * A 4s timeout keeps it from hanging on dead routes.
 */
const probeOnline = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const t = window.setTimeout(() => controller.abort(), 4000);
    await fetch(`/offline-probe?v=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    window.clearTimeout(t);
    return true;
  } catch {
    return false;
  }
};

/**
 * Reliable online/offline detection.
 *
 * `navigator.onLine` alone is unreliable (it can report online behind a
 * captive portal, or lag behind the real state), so every optimistic change
 * is confirmed with an actual fetch probe. While offline we poll every few
 * seconds so reconnection is detected without a page refresh; polling pauses
 * when the tab is hidden to avoid wasted requests.
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>(() => ({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    effectiveType: null,
    downlink: null,
  }));

  const isOnlineRef = useRef(status.isOnline);

  const updateConnectionInfo = useCallback(() => {
    const connection = getConnection();

    const isSlowConnection = connection
      ? connection.effectiveType === '2g' ||
        connection.effectiveType === 'slow-2g' ||
        (connection.downlink && connection.downlink < 1.5)
      : false;

    setStatus((prev) => ({
      ...prev,
      isSlowConnection,
      effectiveType: connection?.effectiveType || null,
      downlink: connection?.downlink || null,
    }));
  }, []);

  useEffect(() => {
    updateConnectionInfo();
    let disposed = false;

    const setOnline = (online: boolean) => {
      isOnlineRef.current = online;
      setStatus((prev) => (prev.isOnline === online ? prev : { ...prev, isOnline: online }));
    };

    const probe = async () => {
      const online = await probeOnline();
      if (!disposed) setOnline(online);
    };

    const handleOnline = () => {
      // navigator.onLine can fire before a real route exists (e.g. local
      // Wi-Fi with no internet) — stay offline until the probe confirms.
      setOnline(false);
      void probe();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = getConnection();
    if (connection?.addEventListener) {
      connection.addEventListener('change', updateConnectionInfo);
    }

    // Initial probe — confirm the optimistic navigator.onLine value.
    void probe();

    // Poll only while offline to detect reconnection (pauses when hidden).
    const pollTimer = window.setInterval(() => {
      if (!isOnlineRef.current && !document.hidden) void probe();
    }, 6000);

    return () => {
      disposed = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection?.removeEventListener) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
      window.clearInterval(pollTimer);
    };
  }, [updateConnectionInfo]);

  return status;
};
