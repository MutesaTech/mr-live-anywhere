import { useMemo, useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Bell, Calendar as CalendarIcon, Pencil, Trash2, Plus, Play, Square, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import {
  useReminders,
  REMINDER_SOUNDS,
  stopReminderSound,
  type Reminder,
  type ReminderRepeat,
  type ReminderSoundId,
  type ReminderDuration,
} from '@/hooks/useReminders';
import channels from '@/data/channels.json';
import radios from '@/data/radios.json';
import { cn } from '@/lib/utils';

const REPEAT: ReminderRepeat[] = ['once', 'daily', 'weekly', 'monthly'];
const NOTIFY = [5, 15, 30, 60];
const DURATIONS: { v: ReminderDuration; label: string }[] = [
  { v: 5, label: '5s' },
  { v: 10, label: '10s' },
  { v: 15, label: '15s' },
  { v: 30, label: '30s' },
  { v: 60, label: '1m' },
  { v: 'manual', label: 'Manual' },
];

function ReminderForm({ initial, onSave, onCancel }: {
  initial?: Reminder;
  onSave: (r: Omit<Reminder, 'id'>) => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [kind, setKind] = useState<'tv' | 'radio'>(initial?.kind ?? 'tv');
  const [channelId, setChannelId] = useState(initial?.channelId ?? '');
  const [date, setDate] = useState(initial?.date ?? today);
  const [time, setTime] = useState(initial?.time ?? '20:00');
  const [repeat, setRepeat] = useState<ReminderRepeat>(initial?.repeat ?? 'once');
  const [notify, setNotify] = useState(initial?.notifyBeforeMin ?? 15);
  const [soundId, setSoundId] = useState<ReminderSoundId>(initial?.soundId ?? 'velvet');
  const [duration, setDuration] = useState<ReminderDuration>(initial?.duration ?? 15);
  const [previewId, setPreviewId] = useState<ReminderSoundId | null>(null);
  const [previewLeft, setPreviewLeft] = useState(60);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopPreview = () => {
    if (audioRef.current) { try { audioRef.current.pause(); } catch {} audioRef.current = null; }
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    setPreviewId(null);
    setPreviewLeft(60);
  };
  const startPreview = (id: ReminderSoundId) => {
    stopPreview();
    const s = REMINDER_SOUNDS.find(x => x.id === id);
    if (!s) return;
    const a = new Audio(s.url);
    a.volume = 0.85;
    a.loop = true;
    a.play().catch(() => {});
    audioRef.current = a;
    setPreviewId(id);
    setPreviewLeft(60);
    timerRef.current = window.setInterval(() => {
      setPreviewLeft((l) => {
        if (l <= 1) { stopPreview(); return 60; }
        return l - 1;
      });
    }, 1000);
  };
  useEffect(() => () => stopPreview(), []);

  const list = kind === 'tv' ? channels : radios;
  const sel = list.find((c) => c.id === channelId);

  const submit = () => {
    if (!sel) return;
    onSave({
      kind,
      channelId,
      channelName: sel.name,
      date,
      time,
      repeat,
      notifyBeforeMin: notify,
      soundId,
      duration,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['tv', 'radio'] as const).map((k) => (
          <button
            key={k}
            onClick={() => { setKind(k); setChannelId(''); }}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-semibold border',
              kind === k ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground'
            )}
          >
            {k === 'tv' ? 'TV Channel' : 'Radio Station'}
          </button>
        ))}
      </div>

      <div>
        <label className="text-caption text-muted-foreground">Channel</label>
        <select
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          className="mt-1 w-full h-10 px-3 rounded-md bg-background border border-input text-sm"
        >
          <option value="">Select…</option>
          {list.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-caption text-muted-foreground">Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="text-caption text-muted-foreground">Time</label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-caption text-muted-foreground">Repeat</label>
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {REPEAT.map((r) => (
            <button
              key={r}
              onClick={() => setRepeat(r)}
              className={cn(
                'py-1.5 text-xs rounded-md border capitalize',
                repeat === r ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50'
              )}
            >{r}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-caption text-muted-foreground">Notify before</label>
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {NOTIFY.map((n) => (
            <button
              key={n}
              onClick={() => setNotify(n)}
              className={cn(
                'py-1.5 text-xs rounded-md border',
                notify === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50'
              )}
            >{n < 60 ? `${n} min` : '1 hour'}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-caption text-muted-foreground">Reminder sound</label>
        <div className="mt-1 space-y-2">
          {REMINDER_SOUNDS.map((s) => {
            const selected = soundId === s.id;
            const playing = previewId === s.id;
            return (
              <div
                key={s.id}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors',
                  selected ? 'border-primary bg-primary/5' : 'border-border/50'
                )}
              >
                <button onClick={() => setSoundId(s.id)} className="flex items-center gap-2 flex-1 text-left">
                  <span className={cn('h-4 w-4 rounded-full border-2 grid place-items-center', selected ? 'border-primary' : 'border-muted-foreground')}>
                    {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                  <span className="text-sm font-medium">{s.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => (playing ? stopPreview() : startPreview(s.id))}
                  className="text-xs text-primary inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-primary/10"
                >
                  {playing ? (
                    <><Square className="h-3 w-3" /> Stop · 0:{String(previewLeft).padStart(2, '0')}</>
                  ) : (
                    <><Play className="h-3 w-3" /> Preview (1m)</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-caption text-muted-foreground">Sound duration</label>
        <div className="mt-1 grid grid-cols-6 gap-1.5">
          {DURATIONS.map((d) => (
            <button
              key={String(d.v)}
              onClick={() => setDuration(d.v)}
              className={cn(
                'py-1.5 text-xs rounded-md border',
                duration === d.v ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50'
              )}
            >{d.label}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={submit} disabled={!channelId} className="flex-1">Save Reminder</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

const ReminderManager = () => {
  const { reminders, add, update, remove } = useReminders();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'completed' | 'missed'>('upcoming');

  const grouped = useMemo(() => {
    const sorted = [...reminders].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
    return {
      upcoming: sorted.filter((r) => (r.status ?? 'upcoming') === 'upcoming'),
      completed: sorted.filter((r) => r.status === 'completed'),
      missed: sorted.filter((r) => r.status === 'missed'),
    };
  }, [reminders]);
  const list = grouped[tab];

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setCreating(false); } }}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/15 flex items-center justify-center">
              <Bell className="h-5 w-5 text-amber-400" />
            </div>
            <div className="text-left">
              <p className="text-body font-medium">Reminders</p>
              <p className="text-caption text-muted-foreground">
                {reminders.length ? `${reminders.length} active` : 'Set channel reminders'}
              </p>
            </div>
          </div>
          <Plus className="h-5 w-5 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{creating || editing ? (editing ? 'Edit Reminder' : 'New Reminder') : 'My Reminders'}</DialogTitle>
        </DialogHeader>

        {creating || editing ? (
          <ReminderForm
            initial={editing ?? undefined}
            onSave={(r) => {
              if (editing) update(editing.id, r); else add(r);
              setEditing(null); setCreating(false);
            }}
            onCancel={() => { setEditing(null); setCreating(false); }}
          />
        ) : (
          <div className="space-y-3">
            <Button onClick={() => setCreating(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> New Reminder
            </Button>

            <div className="grid grid-cols-3 gap-1 p-1 bg-muted/40 rounded-lg">
              {([
                { k: 'upcoming', label: 'Upcoming', icon: Clock, count: grouped.upcoming.length },
                { k: 'completed', label: 'Completed', icon: CheckCircle2, count: grouped.completed.length },
                { k: 'missed', label: 'Missed', icon: AlertCircle, count: grouped.missed.length },
              ] as const).map(({ k, label, icon: Icon, count }) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={cn(
                    'py-1.5 text-xs rounded-md inline-flex items-center justify-center gap-1.5 font-medium transition-colors',
                    tab === k ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {count > 0 && <span className="text-[10px] opacity-70">({count})</span>}
                </button>
              ))}
            </div>

            {list.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border/50 rounded-lg">
                No {tab} reminders
              </div>
            )}
            {list.map((r) => {
              const isUpcoming = (r.status ?? 'upcoming') === 'upcoming';
              const iconColor = r.status === 'completed' ? 'text-emerald-400 bg-emerald-500/10' : r.status === 'missed' ? 'text-destructive bg-destructive/10' : 'text-primary bg-primary/10';
              return (
                <div key={r.id} className="rounded-xl border border-border/50 p-3 flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-full grid place-items-center', iconColor)}>
                    {r.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : r.status === 'missed' ? <AlertCircle className="h-5 w-5" /> : <CalendarIcon className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{r.channelName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.date} • {r.time} • {r.repeat}
                    </p>
                  </div>
                  {isUpcoming && (
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReminderManager;