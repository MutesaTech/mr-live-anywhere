import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Shield, FileText, Info } from 'lucide-react';
import { ReactNode } from 'react';

const Row = ({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode }) => (
  <Dialog>
    <DialogTrigger asChild>
      <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">{icon}</div>
          <div className="text-left">
            <p className="text-body font-medium">{title}</p>
            <p className="text-caption text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <div className="prose prose-invert prose-sm max-w-none text-foreground/90">{children}</div>
    </DialogContent>
  </Dialog>
);

export const AboutDialog = () => (
  <Row icon={<Info className="h-5 w-5 text-primary" />} title="About" subtitle="App info & release notes">
    <h3>MR LIVE</h3>
    <p>Premium Live TV & Radio streaming, built for mobile, tablet, desktop, and Smart TVs.</p>
    <p><strong>Developer:</strong> Mutesa Moments</p>
    <h4>Release Notes</h4>
    <ul>
      <li>Stable floating mini-player</li>
      <li>Sleep timer & reminder system</li>
      <li>Quick categories on home</li>
      <li>Premium futuristic radio player</li>
    </ul>
  </Row>
);

export const PrivacyDialog = () => (
  <Row icon={<Shield className="h-5 w-5 text-primary" />} title="Privacy Policy" subtitle="How we handle your data">
    <p><strong>Data Collection.</strong> MR LIVE stores your preferences, favorites, watch history, profile, reminders and sleep-timer state only on your device using local storage. No personal data is sent to any server by the app itself.</p>
    <p><strong>Cookies.</strong> The app uses browser local storage only. We do not place tracking cookies.</p>
    <p><strong>User Information.</strong> Usernames, emails and avatars you enter in Settings stay on your device. You may delete them at any time by clearing app cache.</p>
    <p><strong>Security.</strong> All stream playback uses HTTPS where available. Update your device & browser regularly for best protection.</p>
    <p><strong>Third-Party Services.</strong> Streams are provided by their respective broadcasters and are subject to their own privacy practices.</p>
    <p><strong>Contact.</strong> Questions? Email <a href="mailto:mutesamoments@gmail.com">mutesamoments@gmail.com</a> or WhatsApp <a href="https://wa.me/250791319992">+250 791 319 992</a>.</p>
  </Row>
);

export const TermsDialog = () => (
  <Row icon={<FileText className="h-5 w-5 text-primary" />} title="Terms of Service" subtitle="Rules for using MR LIVE">
    <p><strong>User Responsibilities.</strong> You agree to use MR LIVE for lawful, personal viewing only.</p>
    <p><strong>Streaming Usage.</strong> All streams belong to their respective broadcasters. MR LIVE only links to publicly available streams and does not host any content.</p>
    <p><strong>Copyright.</strong> Do not record, redistribute, or rebroadcast any stream without permission from the rights holder.</p>
    <p><strong>Acceptable Use.</strong> No scraping, automation, or attempts to disrupt the service or other users.</p>
    <p><strong>Account Terms.</strong> Profile data is stored locally; you are responsible for keeping your device secure.</p>
    <p><strong>Service Availability.</strong> Streams may be unavailable due to broadcaster, network, or geographic restrictions. The app is provided “as is” with no warranty.</p>
  </Row>
);