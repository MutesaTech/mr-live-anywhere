import { useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useNetworkStatus } from './useNetworkStatus';
import { streamCandidates } from '@/lib/channelCatalog';
import { markStreamBroken, clearBrokenStream } from '@/lib/brokenStreams';

/** Structural channel shape consumed by the stream engine (TV catalog). */
export interface StreamPlayerChannel {
  id: string;
  name: string;
  logo: string;
  stream: string;
  streams?: { url: string; quality?: string; label?: string | null; requiresHeaders?: boolean }[];
  category: string;
  language: string;
}

/**
 * Shared live-stream engine used by the full TV player and the category
 * sticky player. Attaches the best candidate feed for the given channel,
 * de-prioritising recently failed streams and falling back through
 * alternate feeds on fatal errors. Owns its own <video> ref and loading
 * / error state, so callers never duplicate stream logic.
 */
export function useStreamPlayer(channel: StreamPlayerChannel | null, options?: { autoPlay?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const candidatesRef = useRef<string[]>([]);
  const candidateIndexRef = useRef(0);

  // Read via ref so changing the preference never reloads the current stream.
  const autoPlayRef = useRef(options?.autoPlay ?? true);
  useEffect(() => {
    autoPlayRef.current = options?.autoPlay ?? true;
  }, [options?.autoPlay]);

  const { isSlowConnection, isOnline } = useNetworkStatus();

  const [isLoading, setIsLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // Read the latest connectivity via ref so callbacks never go stale.
  const isOnlineRef = useRef(isOnline);
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  // Load one stream URL. On fatal failure we mark it broken and try the next feed.
  const loadStreamUrl = useCallback((url: string) => {
    if (!videoRef.current || !url) return;
    setIsLoading(true);
    setStreamError(null);
    setUnavailable(false);

    const failOver = (detail: string) => {
      // A failure caused by being offline is NOT a broken stream — don't
      // poison the broken-stream cache for a URL that may be fine once
      // connectivity returns.
      if (isOnlineRef.current) {
        markStreamBroken(url);
      }
      const next = candidatesRef.current[candidateIndexRef.current + 1];
      if (next) {
        candidateIndexRef.current += 1;
        // Never retry the same dead URL — move straight to the next feed.
        loadStreamUrl(next);
      } else {
        setIsLoading(false);
        setUnavailable(true);
        setStreamError(detail);
      }
    };

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: !isSlowConnection,
        maxBufferLength: isSlowConnection ? 15 : 30,
        maxMaxBufferLength: isSlowConnection ? 30 : 600,
      });
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        clearBrokenStream(url);
        if (autoPlayRef.current) {
          videoRef.current?.play().catch(() => {
            console.log('Autoplay prevented');
          });
        }
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          hls.destroy();
          if (hlsRef.current === hls) hlsRef.current = null;
          failOver(data.details);
        }
      });
      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = url;
      videoRef.current.addEventListener('loadeddata', () => {
        setIsLoading(false);
        clearBrokenStream(url);
      }, { once: true });      videoRef.current.addEventListener('error', () => failOver('Stream playback error'), {
        once: true
      });
      if (autoPlayRef.current) {
        videoRef.current.play().catch(() => {
          console.log('Autoplay prevented');
        });
      }
    }
  }, [isSlowConnection]);

  // Start a channel from its best candidate feed.
  const loadStream = useCallback((ch: StreamPlayerChannel) => {
    candidatesRef.current = streamCandidates(ch);
    candidateIndexRef.current = 0;
    loadStreamUrl(candidatesRef.current[0]);
  }, [loadStreamUrl]);

  useEffect(() => {
    if (!channel) return;
    // Don't waste network attempts on streams while offline — the offline
    // panel explains the situation, and the reconnect effect below loads the
    // selected channel automatically once connectivity returns.
    if (!isOnline) return;
    loadStream(channel);
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, isOnline, loadStream]);

  // Auto-resume when the connection comes back — the offline panel promises
  // playback resumes once restored, so honour that without any user action.
  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    prevOnlineRef.current = isOnline;
    if (wasOffline && isOnline && channel) {
      loadStream(channel);
    }
  }, [isOnline, channel, loadStream]);

  const retry = useCallback(() => {
    if (channel) loadStream(channel);
  }, [channel, loadStream]);

  return { videoRef, isLoading, streamError, unavailable, retry };
}
