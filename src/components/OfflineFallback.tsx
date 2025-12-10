import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

const OfflineFallback = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
      </div>
      
      <h2 className="text-h2 mb-2">You're offline</h2>
      <p className="text-muted-foreground mb-6 max-w-xs">
        Showing saved content. Connect to the internet for live streams.
      </p>
      
      <Button onClick={handleRetry} variant="outline" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
};

export default OfflineFallback;
