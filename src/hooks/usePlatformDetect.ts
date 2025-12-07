import { useState, useEffect } from 'react';

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

interface PlatformInfo {
  platform: Platform;
  isStandalone: boolean;
  canInstall: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
}

export const usePlatformDetect = (): PlatformInfo => {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    platform: 'unknown',
    isStandalone: false,
    canInstall: false,
    isIOS: false,
    isAndroid: false,
    isDesktop: false,
  });

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;

    let platform: Platform = 'unknown';
    let isIOS = false;
    let isAndroid = false;
    let isDesktop = false;

    // iOS detection
    if (/ipad|iphone|ipod/.test(userAgent) && !(window as any).MSStream) {
      platform = 'ios';
      isIOS = true;
    }
    // Android detection
    else if (/android/.test(userAgent)) {
      platform = 'android';
      isAndroid = true;
    }
    // Desktop detection
    else if (!/mobile|tablet/.test(userAgent)) {
      platform = 'desktop';
      isDesktop = true;
    }

    setPlatformInfo({
      platform,
      isStandalone,
      canInstall: !isStandalone,
      isIOS,
      isAndroid,
      isDesktop,
    });
  }, []);

  return platformInfo;
};
