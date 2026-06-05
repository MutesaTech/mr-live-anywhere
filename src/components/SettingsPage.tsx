import { Trash2, ChevronRight, Camera, Mail, User as UserIcon, Star, Phone, MessageSquare } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import SleepTimerDialog from './SleepTimerDialog';
import ReminderManager from './ReminderManager';
import { AboutDialog, PrivacyDialog, TermsDialog } from './LegalDialogs';

interface UserProfile {
  username: string;
  email: string;
  avatar: string | null;
}

const SettingsPage = () => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useLocalStorage<UserProfile>('userProfile', {
    username: 'MR LIVE User',
    email: 'you@mrlive.app',
    avatar: null,
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(profile);

  useEffect(() => { setDraft(profile); }, [profile]);

  const handleAvatarPick = () => fileRef.current?.click();
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfile({ ...profile, avatar: reader.result as string });
      toast({ title: 'Profile picture updated' });
    };
    reader.readAsDataURL(file);
  };
  const saveProfile = () => {
    setProfile(draft);
    setEditing(false);
    toast({ title: 'Profile saved' });
  };

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      toast({ title: 'Cache cleared', description: 'All cached data has been removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to clear cache.', variant: 'destructive' });
    }
  };

  const APP_VERSION = '1.1.0';
  const BUILD = '2026.06.05';

  const handleRate = () => {
    const ua = navigator.userAgent.toLowerCase();
    let url = 'https://mrlive.app';
    if (/android/.test(ua)) url = 'https://play.google.com/store/apps/details?id=app.lovable.mrlive';
    else if (/iphone|ipad|ipod|mac/.test(ua)) url = 'https://apps.apple.com/app/mr-live/id000000000';
    window.open(url, '_blank', 'noopener');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile Card — glassy premium */}
      <section className="relative overflow-hidden rounded-3xl glass-strong border border-white/10 p-6 shadow-strong">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            <div className="h-24 w-24 rounded-full p-[2px] bg-gradient-to-br from-primary via-accent to-primary-light shadow-glow">
              <div className="h-full w-full rounded-full overflow-hidden bg-card flex items-center justify-center">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
            </div>
            <button
              onClick={handleAvatarPick}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              aria-label="Change profile picture"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          </div>

          <div className="flex-1 w-full text-center sm:text-left">
            {editing ? (
              <div className="space-y-3">
                <Input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} placeholder="Username" className="bg-background/40" />
                <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" type="email" className="bg-background/40" />
                <div className="flex gap-2 justify-center sm:justify-start">
                  <Button onClick={saveProfile}>Save</Button>
                  <Button variant="ghost" onClick={() => { setDraft(profile); setEditing(false); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold tracking-tight">{profile.username}</h2>
                <p className="text-caption text-muted-foreground flex items-center gap-1.5 justify-center sm:justify-start mt-1">
                  <Mail className="h-3.5 w-3.5" /> {profile.email}
                </p>
                <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => setEditing(true)}>
                  Edit profile
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Playback */}
      <section className="rounded-2xl bg-card/60 backdrop-blur border border-border/50 overflow-hidden divide-y divide-border/50">
        <div className="p-4">
          <h2 className="text-h3 font-semibold">Playback</h2>
          <p className="text-caption text-muted-foreground mt-1">Sleep timer & reminders</p>
        </div>
        <SleepTimerDialog />
        <ReminderManager />
      </section>

      {/* Storage */}
      <section className="rounded-2xl bg-card/60 backdrop-blur border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-h3 font-semibold">Storage</h2>
          <p className="text-caption text-muted-foreground mt-1">Manage app data and cache</p>
        </div>
        <button onClick={handleClearCache} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div className="text-left">
              <p className="text-body font-medium">Clear Cache</p>
              <p className="text-caption text-muted-foreground">Free up storage space</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </section>

      {/* Support */}
      <section className="rounded-2xl bg-card/60 backdrop-blur border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-h3 font-semibold">Contact Support</h2>
          <p className="text-caption text-muted-foreground mt-1">We respond fast</p>
        </div>
        <div className="divide-y divide-border/50">
          <a href="https://wa.me/250791319992" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/15 grid place-items-center">
                <Phone className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-body font-medium">WhatsApp</p>
                <p className="text-caption text-muted-foreground">+250 791 319 992</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </a>
          <a href="mailto:mutesamoments@gmail.com" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/10 grid place-items-center">
                <Mail className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-body font-medium">Email</p>
                <p className="text-caption text-muted-foreground">mutesamoments@gmail.com</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </a>
        </div>
      </section>

      {/* Legal */}
      <section className="rounded-2xl bg-card/60 backdrop-blur border border-border/50 overflow-hidden divide-y divide-border/50">
        <div className="p-4">
          <h2 className="text-h3 font-semibold">About & Legal</h2>
        </div>
        <AboutDialog />
        <PrivacyDialog />
        <TermsDialog />
        <button onClick={handleRate} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-500/15 grid place-items-center">
              <Star className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="text-left">
              <p className="text-body font-medium">Rate the App</p>
              <p className="text-caption text-muted-foreground">Open store rating page</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </section>

      {/* Version footer */}
      <div className="text-center text-caption text-muted-foreground py-4">
        <p className="font-semibold text-foreground/70">MR LIVE v{APP_VERSION}</p>
        <p>Build {BUILD} • Updated {new Date().toISOString().slice(0, 10)}</p>
      </div>
    </div>
  );
};

export default SettingsPage;