import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface LowBandwidthMode {
  isLowBandwidth: boolean;
  isHDMode: boolean;
  enableHDMode: () => void;
  disableHDMode: () => void;
  toggleHDMode: () => void;
  shouldReduceAnimations: boolean;
  shouldLoadLowRes: boolean;
}

export const useLowBandwidthMode = (): LowBandwidthMode => {
  const { isSlowConnection, isOnline } = useNetworkStatus();
  const [manualHDMode, setManualHDMode] = useState<boolean | null>(null);

  // Check saved preference
  useEffect(() => {
    const saved = localStorage.getItem('hdMode');
    if (saved !== null) {
      setManualHDMode(saved === 'true');
    }
  }, []);

  const isLowBandwidth = isSlowConnection || !isOnline;
  const isHDMode = manualHDMode !== null ? manualHDMode : !isLowBandwidth;

  const enableHDMode = useCallback(() => {
    setManualHDMode(true);
    localStorage.setItem('hdMode', 'true');
  }, []);

  const disableHDMode = useCallback(() => {
    setManualHDMode(false);
    localStorage.setItem('hdMode', 'false');
  }, []);

  const toggleHDMode = useCallback(() => {
    const newValue = !isHDMode;
    setManualHDMode(newValue);
    localStorage.setItem('hdMode', String(newValue));
  }, [isHDMode]);

  return {
    isLowBandwidth,
    isHDMode,
    enableHDMode,
    disableHDMode,
    toggleHDMode,
    shouldReduceAnimations: isLowBandwidth && !isHDMode,
    shouldLoadLowRes: isLowBandwidth && !isHDMode,
  };
};
