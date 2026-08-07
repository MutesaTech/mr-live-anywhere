import { MessageCircle, Mail, ChevronRight, LifeBuoy } from 'lucide-react';
import SettingsPage from './SettingsPage';

const WHATSAPP_LINK = 'https://wa.me/250791319992?text=Hello%20Beemo%20Support';
const EMAIL_LINK = 'mailto:mutesamoments@gmail.com?subject=Beemo%20Support';

const FAQS = [
  { q: 'A channel is not loading', a: 'Some broadcasters restrict streams by region. Try another channel or check your connection.' },
  { q: 'How do I install Beemo?', a: 'Use the install button in the header, or "Add to Home Screen" from your browser menu.' },
  { q: 'Does Beemo host content?', a: 'No. Beemo only links to publicly available live streams and library titles.' },
];

const SupportPage = () => (
  <div className="space-y-6 animate-page-enter">
    <header className="flex items-center gap-3">
      <div className="h-11 w-11 rounded-2xl gradient-primary grid place-items-center shadow-glow">
        <LifeBuoy className="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Help &amp; Support</h1>
        <p className="text-caption text-muted-foreground">We usually reply within a few hours.</p>
      </div>
    </header>

    <section className="rounded-2xl bg-card/60 backdrop-blur border border-border/50 overflow-hidden divide-y divide-border/50">
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500/15 grid place-items-center">
            <MessageCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-body font-medium">WhatsApp</p>
            <p className="text-caption text-muted-foreground">Chat with support</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </a>
      <a
        href={EMAIL_LINK}
        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent/10 grid place-items-center">
            <Mail className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-body font-medium">Email</p>
            <p className="text-caption text-muted-foreground">Send us a message</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </a>
    </section>

    <section className="rounded-2xl bg-card/60 backdrop-blur border border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-h3 font-semibold">Frequently asked</h2>
      </div>
      <div className="divide-y divide-border/50">
        {FAQS.map((f) => (
          <div key={f.q} className="p-4">
            <p className="text-body font-medium">{f.q}</p>
            <p className="text-caption text-muted-foreground mt-1">{f.a}</p>
          </div>
        ))}
      </div>
    </section>

    <SettingsPage />
  </div>
);

export default SupportPage;