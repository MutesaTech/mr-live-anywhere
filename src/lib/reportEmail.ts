/**
 * Client-side email delivery for channel reports via Web3Forms.
 *
 * The app is a static PWA with no backend, so reports are delivered to the
 * inbox bound to the Web3Forms access key (an alias to the destination email —
 * it is explicitly safe to expose in client-side code, unlike a secret API key).
 *
 * The access key comes from VITE_WEB3FORMS_ACCESS_KEY (see .env.example).
 * If it is missing, sending is skipped and the caller falls back to the
 * existing localStorage record (the app never crashes because of it).
 */

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

const ACCESS_KEY = (import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string | undefined)?.trim() ?? '';

export interface ChannelReportEmail {
  channelId: string;
  channelName: string;
  reason: string;
  details?: string;
}

/** True when a Web3Forms access key is configured so reports can be emailed. */
export const isReportEmailConfigured = () => ACCESS_KEY.length > 0;

/**
 * Sends a channel report email to the inbox bound to the access key.
 * Resolves true on success, false when unconfigured or the request fails.
 */
export const sendChannelReportEmail = async (report: ChannelReportEmail): Promise<boolean> => {
  if (!isReportEmailConfigured()) return false;

  try {
    const payload = new FormData();
    payload.append('access_key', ACCESS_KEY);
    payload.append('subject', `Channel report: ${report.channelName}`);
    payload.append('from_name', 'Beemo Channel Report');
    payload.append('Channel ID', report.channelId);
    payload.append('Channel name', report.channelName);
    payload.append('Reason', report.reason);
    payload.append('Details', report.details?.trim() || '(none provided)');
    payload.append('Submitted at', new Date().toLocaleString());

    const res = await fetch(WEB3FORMS_ENDPOINT, { method: 'POST', body: payload });
    if (!res.ok) return false;

    const json = (await res.json().catch(() => null)) as { success?: boolean } | null;
    return json?.success === true;
  } catch {
    return false;
  }
};
