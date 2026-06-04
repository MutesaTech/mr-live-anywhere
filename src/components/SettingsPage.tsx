import { Sparkles, Trash2, Info, MessageCircle, ChevronRight, Camera, Mail, User as UserIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';

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

      {/* Appearance — Default only */}
      <section className="rounded-2xl bg-card/60 backdrop-blur border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-h3 font-semibold">Appearance</h2>
          <p className="text-caption text-muted-foreground mt-1">Premium dark theme is always on</p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary bg-primary/10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-body font-semibold">Default</p>
              <p className="text-caption text-muted-foreground">Cinematic dark experience</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
          </div>
        </div>
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

      {/* About */}
      <section className="rounded-2xl bg-card/60 backdrop-blur border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-h3 font-semibold">About</h2>
        </div>
        <div className="divide-y divide-border/50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-body font-medium">MR LIVE</p>
                <p className="text-caption text-muted-foreground">Version 1.0.0</p>
              </div>
            </div>
          </div>
          <a href="mailto:feedback@mrlive.app" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-body font-medium">Send Feedback</p>
                <p className="text-caption text-muted-foreground">Help us improve</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;