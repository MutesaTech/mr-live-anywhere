import { Moon, Sun, Monitor, Trash2, Info, MessageCircle, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

const SettingsPage = () => {
  const [theme, setTheme] = useState<Theme>('system');
  const { toast } = useToast();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemDark);
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
    }
    
    localStorage.setItem('theme', newTheme);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      localStorage.clear();
      toast({
        title: "Cache cleared",
        description: "All cached data has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache.",
        variant: "destructive",
      });
    }
  };

  const themeOptions = [
    { value: 'light' as Theme, icon: Sun, label: 'Light' },
    { value: 'dark' as Theme, icon: Moon, label: 'Dark' },
    { value: 'system' as Theme, icon: Monitor, label: 'System' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Theme Section */}
      <section className="rounded-xl bg-card border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-h3 font-semibold">Appearance</h2>
          <p className="text-caption text-muted-foreground mt-1">
            Customize how the app looks
          </p>
        </div>
        
        <div className="p-4">
          <div className="flex gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200",
                    "border-2",
                    isActive
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-border"
                  )}
                >
                  <Icon className={cn("h-6 w-6", isActive && "text-primary")} />
                  <span className={cn("text-caption font-medium", isActive && "text-primary")}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Storage Section */}
      <section className="rounded-xl bg-card border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-h3 font-semibold">Storage</h2>
          <p className="text-caption text-muted-foreground mt-1">
            Manage app data and cache
          </p>
        </div>
        
        <button
          onClick={handleClearCache}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
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

      {/* About Section */}
      <section className="rounded-xl bg-card border border-border/50 overflow-hidden">
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
          
          <a
            href="mailto:feedback@mrlive.app"
            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
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
