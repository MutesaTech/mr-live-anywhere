/** Human-friendly relative time: "just now", "5 min ago", "2 hours ago", "yesterday", "3 days ago". */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  if (!timestamp) return '';
  const diff = Math.max(0, now - timestamp);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

/** Timestamp label for history items: "Watched 5 min ago" / "Played just now". */
export function watchTimestampLabel(
  timestamp: number,
  now: number,
  kind: 'watched' | 'played'
): string {
  const relative = formatRelativeTime(timestamp, now);
  if (!relative) return '';
  const verb = kind === 'watched' ? 'Watched' : 'Played';
  return relative === 'just now' ? `${verb} just now` : `${verb} ${relative}`;
}
