import { useEffect, useRef } from 'react';

export const useVolumeNormalizer = (
  videoElement: HTMLVideoElement | null,
  enabled: boolean = true
) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  useEffect(() => {
    if (!videoElement || !enabled) return;

    // Avoid reconnecting if already connected
    if (sourceNodeRef.current) return;

    try {
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Create source from video element
      const source = audioContext.createMediaElementSource(videoElement);
      sourceNodeRef.current = source;

      // Create dynamics compressor for volume normalization
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -24; // dB threshold
      compressor.knee.value = 30; // dB knee
      compressor.ratio.value = 12; // compression ratio
      compressor.attack.value = 0.003; // seconds
      compressor.release.value = 0.25; // seconds
      compressorRef.current = compressor;

      // Create gain node for overall volume adjustment
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1.2; // Slight boost to compensate compression
      gainNodeRef.current = gainNode;

      // Connect: source -> compressor -> gain -> destination
      source.connect(compressor);
      compressor.connect(gainNode);
      gainNode.connect(audioContext.destination);

    } catch (error) {
      console.log('Volume normalizer not available:', error);
    }

    return () => {
      // Cleanup on unmount
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
      sourceNodeRef.current = null;
      gainNodeRef.current = null;
      compressorRef.current = null;
    };
  }, [videoElement, enabled]);

  const setGain = (value: number) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = Math.max(0, Math.min(3, value));
    }
  };

  return { setGain };
};
