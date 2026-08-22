import { useState } from 'react';
import { Trash2, ChevronDown, Mail, Phone, Gauge, Sun, Moon, Timer, Info, MessageCircle, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTheme } from '@/hooks/useTheme';
import SleepTimerDialog from './SleepTimerDialog';
import { AboutDialog, PrivacyDialog, TermsDialog } from './LegalDialogs';
import { cn } from '@/lib/utils';

const SettingsPage = () => {
  const { toast } = useToast();
  const [dataSaver, setDataSaver] = useLocalStorage<'auto' | 'low' | 'standard' | 'high'>('dataSaver', 'auto');
  const { theme, setTheme } = useTheme();
  // Collapsible sections — collapsed by default keeps the page compact.
  const [playbackOpen, setPlaybackOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

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
    let url = 'https://beemo.app';
    if (/android/.test(ua)) url = 'https://play.google.com/store/apps/details?id=app.lovable.beemo';
    else if (/iphone|ipad|ipod|mac/.test(ua)) url = 'https://apps.apple.com/app/beemo/id000000000';
    window.open(url, '_blank', 'noopener');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Appearance — light / dark theme toggle with icons */}
      <section className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
            <Sun className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-h3 font-semibold">Appearance</h2>
            <p className="text-caption text-muted-foreground mt-0.5">Choose between light and dark mode</p>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            aria-pressed={theme === 'light'}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors',
              theme === 'light'
                ? 'border-primary bg-primary/5'
                : 'border-border/50 hover:border-border'
            )}
          >
            <Sun className={cn('h-6 w-6', theme === 'light' ? 'text-primary' : 'text-muted-foreground')} />
            <span className="text-sm font-semibold">Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            aria-pressed={theme === 'dark'}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors',
              theme === 'dark'
                ? 'border-primary bg-primary/5'
                : 'border-border/50 hover:border-border'
            )}
          >
            <Moon className={cn('h-6 w-6', theme === 'dark' ? 'text-primary' : 'text-muted-foreground')} />
            <span className="text-sm font-semibold">Dark</span>
          </button>
        </div>
      </section>

      {/* Playback & Data — collapsible dropdown */}
      <section className="rounded-2xl bg-card border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setPlaybackOpen(v => !v)}
          aria-expanded={playbackOpen}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
            <Timer className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-h3 font-semibold">Playback & Data</h2>
            <p className="text-caption text-muted-foreground mt-0.5">Sleep timer and data saver</p>
          </div>
          <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform duration-300', playbackOpen && 'rotate-180')} />
        </button>
        {playbackOpen && (
          <div className="divide-y divide-border/50 animate-fade-in">
            <SleepTimerDialog />
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
                  <Gauge className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-body font-medium">Data Saver</p>
                  <p className="text-caption text-muted-foreground">Optimize streaming for your network</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: 'auto', label: 'Auto', desc: 'Match your connection' },
                  { v: 'low', label: 'Low Data', desc: 'Best on 2G / 3G' },
                  { v: 'standard', label: 'Standard', desc: 'Balanced quality' },
                  { v: 'high', label: 'High', desc: 'Best on Wi-Fi' },
                ] as const).map((o) => (
                  <button
                    key={o.v}
                    onClick={() => { setDataSaver(o.v); toast({ title: `Data Saver: ${o.label}` }); }}
                    className={cn(
                      'text-left rounded-xl border p-3 transition-colors',
                      dataSaver === o.v ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'
                    )}
                  >
                    <p className="text-sm font-semibold">{o.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Storage */}
      <section className="rounded-2xl bg-card border border-border overflow-hidden">
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
          <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
        </button>
      </section>

      {/* Contact Support — one link that reveals all contact channels */}
      <section className="rounded-2xl bg-card border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setContactOpen(v => !v)}
          aria-expanded={contactOpen}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-h3 font-semibold">Contact Support</h2>
            <p className="text-caption text-muted-foreground mt-0.5">We respond fast</p>
          </div>
          <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform duration-300', contactOpen && 'rotate-180')} />
        </button>
        {contactOpen && (
          <div className="divide-y divide-border/50 animate-fade-in">
            <a href="https://wa.me/250791319992" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/15 grid place-items-center">
                  <MessageCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-body font-medium">WhatsApp</p>
                  <p className="text-caption text-muted-foreground">+250 791 319 992</p>
                </div>
              </div>
              <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
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
              <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
            </a>
            <a href="tel:+250791319992" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-body font-medium">Call</p>
                  <p className="text-caption text-muted-foreground">+250 791 319 992</p>
                </div>
              </div>
              <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
            </a>
          </div>
        )}
      </section>

      {/* Legal */}
      <section className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border/50">
        <div className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-h3 font-semibold">About & Legal</h2>
            <p className="text-caption text-muted-foreground mt-0.5">App info, privacy and terms</p>
          </div>
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
          <ChevronDown className="h-5 w-5 text-muted-foreground -rotate-90" />
        </button>
      </section>

      {/* Version footer */}
      <div className="text-center text-caption text-muted-foreground py-4">
        <p className="font-semibold text-foreground/70">Beemo v{APP_VERSION}</p>
        <p>Build {BUILD} • Updated {new Date().toISOString().slice(0, 10)}</p>
      </div>
    </div>
  );
};

export default SettingsPage;