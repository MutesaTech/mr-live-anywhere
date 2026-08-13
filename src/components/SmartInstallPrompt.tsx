import { useState, useEffect } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePlatformDetect } from '@/hooks/usePlatformDetect';
import { cn } from '@/lib/utils';

const SmartInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const { toast } = useToast();
  const { platform, isStandalone, isIOS, isAndroid, isDesktop } = usePlatformDetect();

  useEffect(() => {
    if (isStandalone) return;

    // Check if user dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < oneDay) return;
    }

    // iOS specific handling
    if (isIOS) {
      setTimeout(() => setShowIOSPrompt(true), 3000);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      toast({
        title: "App Installed!",
        description: "Beemo is now on your home screen.",
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isIOS, isStandalone, toast]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Header install button for desktop
  if (isDesktop && deferredPrompt && !isStandalone) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 rounded-full"
        onClick={handleInstall}
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Install App</span>
      </Button>
    );
  }

  // Removed floating install button on mobile - only show on desktop now

  // iOS "Add to Home Screen" popup
  if (showIOSPrompt && isIOS && !isStandalone) {
    return (
      <div className="fixed inset-x-4 bottom-20 z-50 animate-slide-up sm:left-auto sm:right-4 sm:w-80">
        <div className="glass rounded-2xl p-4 border border-border/50 shadow-strong">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <img src="/logo.png" alt="Beemo" className="h-8 w-8" />
            </div>
            <div>
              <h4 className="font-semibold text-body">Add to Home Screen</h4>
              <p className="text-caption text-muted-foreground mt-1">
                Tap <Share className="inline h-3.5 w-3.5 mx-0.5" /> then 
                <span className="inline-flex items-center mx-1">
                  <Plus className="h-3.5 w-3.5 mr-0.5" />
                  Add to Home Screen
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SmartInstallPrompt;
