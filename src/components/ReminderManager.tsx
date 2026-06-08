import { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Bell, Calendar as CalendarIcon, Pencil, Trash2, Plus, Play, Square } from 'lucide-react';
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
  const [previewing, setPreviewing] = useState<HTMLAudioElement | null>(null);

  const previewSound = () => {
    if (previewing) { previewing.pause(); setPreviewing(null); return; }
    const s = REMINDER_SOUNDS.find(x => x.id === soundId);
    if (!s) return;
    const a = new Audio(s.url);
    a.volume = 0.8;
    a.play().catch(() => {});
    setPreviewing(a);
    setTimeout(() => { a.pause(); setPreviewing((p) => p === a ? null : p); }, 4000);
  };
  useEffect(() => () => { if (previewing) previewing.pause(); }, [previewing]);

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
        <div className="flex items-center justify-between">
          <label className="text-caption text-muted-foreground">Reminder sound</label>
          <button
            type="button"
            onClick={previewSound}
            className="text-xs text-primary inline-flex items-center gap-1"
          >
            {previewing ? <><Square className="h-3 w-3" /> Stop</> : <><Play className="h-3 w-3" /> Preview</>}
          </button>
        </div>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          {REMINDER_SOUNDS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSoundId(s.id)}
              className={cn(
                'py-1.5 text-xs rounded-md border',
                soundId === s.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50'
              )}
            >{s.name}</button>
          ))}
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

  const sorted = useMemo(() =>
    [...reminders].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
    [reminders]
  );

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
            {sorted.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border/50 rounded-lg">
                No reminders yet
              </div>
            )}
            {sorted.map((r) => (
              <div key={r.id} className="rounded-xl border border-border/50 p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{r.channelName}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.date} • {r.time} • {r.repeat}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setEditing(r)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReminderManager;