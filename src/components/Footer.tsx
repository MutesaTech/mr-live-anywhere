const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-lg font-semibold">About MR LIVE</h3>
            <p className="text-sm text-muted-foreground">
              Your destination for live TV and radio streaming. Access local and international
              channels anytime, anywhere.
            </p>
          </div>
          
          <div>
            <h3 className="mb-4 text-lg font-semibold">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Live TV Streaming</li>
              <li>• Radio Stations</li>
              <li>• Offline Support</li>
              <li>• Favorites & History</li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-lg font-semibold">Technology</h3>
            <p className="text-sm text-muted-foreground">
              Built as a Progressive Web App with React, TypeScript, and Vite.
            </p>
          </div>
        </div>
        
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 MR LIVE. Powered by Mutesa Techlink.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
